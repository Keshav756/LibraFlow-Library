import { v2 as cloudinary } from "cloudinary";
import crypto from "crypto";
import path from "path";
import fs from "fs";
import envConfig from "../config/environment.js";
import ErrorHandler from "../middlewares/errorMiddlewares.js";

/**
 * Advanced File Upload Handler with Cloudinary Integration
 * Provides secure, validated, and optimized file upload functionality
 */

/**
 * Supported file types and their configurations
 */
const FILE_TYPES = {
  IMAGE: {
    mimeTypes: [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/webp',
      'image/gif'
    ],
    maxSize: 5 * 1024 * 1024, // 5MB
    folder: 'book_covers',
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif']
  },
  AVATAR: {
    mimeTypes: [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp'
    ],
    maxSize: 2 * 1024 * 1024, // 2MB
    folder: 'user_avatars',
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp']
  },
  DOCUMENT: {
    mimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],
    maxSize: 10 * 1024 * 1024, // 10MB
    folder: 'documents',
    allowedExtensions: ['.pdf', '.doc', '.docx']
  }
};

/**
 * Generate secure filename to prevent conflicts
 */
const generateSecureFilename = (originalName, userId = null) => {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  const extension = path.extname(originalName).toLowerCase();
  const baseName = path.basename(originalName, extension).replace(/[^a-zA-Z0-9]/g, '_');
  
  const userPrefix = userId ? `${userId}_` : '';
  return `${userPrefix}${baseName}_${timestamp}_${randomString}${extension}`;
};

/**
 * Validate file type and size
 */
const validateFile = (file, fileType) => {
  const config = FILE_TYPES[fileType];
  
  if (!config) {
    throw new ErrorHandler("Invalid file type configuration", 400);
  }

  // Check file existence
  if (!file || !file.mimetype || !file.size) {
    throw new ErrorHandler("Invalid file provided", 400);
  }

  // Validate MIME type
  if (!config.mimeTypes.includes(file.mimetype)) {
    throw new ErrorHandler(
      `Invalid file type. Allowed types: ${config.mimeTypes.join(', ')}`, 
      400
    );
  }

  // Validate file size
  if (file.size > config.maxSize) {
    const maxSizeMB = (config.maxSize / (1024 * 1024)).toFixed(1);
    throw new ErrorHandler(
      `File too large. Maximum size allowed: ${maxSizeMB}MB`, 
      400
    );
  }

  // Validate file extension
  const extension = path.extname(file.name).toLowerCase();
  if (!config.allowedExtensions.includes(extension)) {
    throw new ErrorHandler(
      `Invalid file extension. Allowed extensions: ${config.allowedExtensions.join(', ')}`, 
      400
    );
  }

  return true;
};

/**
 * Upload file to Cloudinary with advanced options
 */
const uploadToCloudinary = async (file, fileType, options = {}) => {
  try {
    const config = FILE_TYPES[fileType];
    const cloudinaryConfig = envConfig.getCloudinaryConfig();
    
    // Generate secure filename
    const secureFilename = generateSecureFilename(file.name, options.userId);
    
    // Base upload options
    const uploadOptions = {
      folder: `${cloudinaryConfig.folder}/${config.folder}`,
      public_id: secureFilename.replace(/\.[^/.]+$/, ""), // Remove extension
      resource_type: fileType === 'IMAGE' || fileType === 'AVATAR' ? 'image' : 'raw',
      secure: true,
      overwrite: false,
      unique_filename: true,
      use_filename: false,
      tags: [
        'LibraFlow',
        fileType.toLowerCase(),
        ...(options.tags || [])
      ],
      context: {
        purpose: fileType.toLowerCase(),
        uploaded_by: options.userId || 'system',
        upload_timestamp: new Date().toISOString(),
        ...(options.context || {})
      }
    };

    // Image-specific optimizations
    if (fileType === 'IMAGE' || fileType === 'AVATAR') {
      uploadOptions.transformation = [
        {
          quality: 'auto:good',
          fetch_format: 'auto'
        }
      ];
      
      // Avatar-specific transformations
      if (fileType === 'AVATAR') {
        uploadOptions.transformation.push({
          width: 300,
          height: 300,
          crop: 'fill',
          gravity: 'face'
        });
      }
      
      // Book cover-specific transformations
      if (fileType === 'IMAGE') {
        uploadOptions.transformation.push({
          width: 400,
          height: 600,
          crop: 'fit'
        });
      }
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(file.tempFilePath, uploadOptions);
    
    // Clean up temporary file
    if (fs.existsSync(file.tempFilePath)) {
      fs.unlinkSync(file.tempFilePath);
    }

    return {
      success: true,
      data: {
        public_id: result.public_id,
        url: result.secure_url,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
        folder: result.folder,
        created_at: result.created_at,
        resource_type: result.resource_type
      }
    };

  } catch (error) {
    // Clean up temporary file on error
    if (file.tempFilePath && fs.existsSync(file.tempFilePath)) {
      fs.unlinkSync(file.tempFilePath);
    }
    
    console.error("❌ Cloudinary upload error:", error);
    throw new ErrorHandler(
      `File upload failed: ${error.message}`, 
      500
    );
  }
};

/**
 * Delete file from Cloudinary
 */
const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType
    });
    
    return {
      success: result.result === 'ok',
      result: result.result
    };
  } catch (error) {
    console.error("❌ Cloudinary delete error:", error);
    throw new ErrorHandler(
      `File deletion failed: ${error.message}`, 
      500
    );
  }
};

/**
 * Main upload handler function
 */
export const handleFileUpload = async (file, fileType, options = {}) => {
  try {
    // Validate file
    validateFile(file, fileType);
    
    // Upload to Cloudinary
    const uploadResult = await uploadToCloudinary(file, fileType, options);
    
    console.log(`✅ File uploaded successfully: ${uploadResult.data.url}`);
    return uploadResult;
    
  } catch (error) {
    console.error("❌ File upload handler error:", error);
    throw error; // Re-throw to be handled by calling function
  }
};

/**
 * Handle multiple file uploads
 */
export const handleMultipleFileUploads = async (files, fileType, options = {}) => {
  const results = [];
  const errors = [];
  
  for (const file of files) {
    try {
      const result = await handleFileUpload(file, fileType, options);
      results.push(result);
    } catch (error) {
      errors.push({
        filename: file.name,
        error: error.message
      });
    }
  }
  
  return {
    success: results.length > 0,
    results,
    errors,
    totalUploaded: results.length,
    totalFailed: errors.length
  };
};

/**
 * Get file upload statistics
 */
export const getUploadStats = () => {
  return {
    supportedTypes: Object.keys(FILE_TYPES),
    configurations: FILE_TYPES,
    cloudinaryConfigured: !!envConfig.getCloudinaryConfig().api_key
  };
};

// Export configurations for external use
export { FILE_TYPES, deleteFromCloudinary };