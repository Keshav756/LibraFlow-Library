import express from 'express';
import { 
  getAllUsers, 
  registerNewAdmin,
  getSystemCleanupStats,
  triggerSystemCleanup,
  getSystemHealth,
  getAdminDashboard,
  getNotificationStats,
  triggerNotificationBatch,
  getEnvironmentInfo,
  generateSecureSecrets,
  validateEnvironmentSecurity
} from '../controllers/userControllers.js';
import { isAuthenticated, isAuthorized } from '../middlewares/authMiddleware.js';

const router = express.Router();

// ===== ADMIN USER ROUTES =====
router.get('/all', isAuthenticated, isAuthorized("Admin"), getAllUsers);       // Get all users
router.post('/add/new-admin', isAuthenticated, isAuthorized("Admin"), registerNewAdmin); // Add a new admin

// ===== ENHANCED ADMIN SYSTEM MANAGEMENT ROUTES =====
router.get('/system/dashboard', isAuthenticated, isAuthorized("Admin"), getAdminDashboard);    // Get admin dashboard
router.get('/system/cleanup/stats', isAuthenticated, isAuthorized("Admin"), getSystemCleanupStats); // Get cleanup stats
router.post('/system/cleanup/trigger', isAuthenticated, isAuthorized("Admin"), triggerSystemCleanup); // Trigger cleanup
router.get('/system/health', isAuthenticated, isAuthorized("Admin"), getSystemHealth);        // Get system health

// ===== ENHANCED ADMIN NOTIFICATION MANAGEMENT ROUTES =====
router.get('/system/notifications/stats', isAuthenticated, isAuthorized("Admin"), getNotificationStats); // Get notification stats
router.post('/system/notifications/trigger', isAuthenticated, isAuthorized("Admin"), triggerNotificationBatch); // Trigger notification batch

// ===== ENHANCED ADMIN ENVIRONMENT & SECURITY MANAGEMENT ROUTES =====
router.get('/system/environment', isAuthenticated, isAuthorized("Admin"), getEnvironmentInfo);     // Get environment info
router.post('/system/secrets/generate', isAuthenticated, isAuthorized("Admin"), generateSecureSecrets); // Generate secure secrets
router.get('/system/security/validate', isAuthenticated, isAuthorized("Admin"), validateEnvironmentSecurity); // Validate security

export default router;
