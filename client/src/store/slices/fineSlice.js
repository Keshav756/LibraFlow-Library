import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { API_ENDPOINTS } from "../../config/api";
import { toast } from "react-toastify";

// Async thunk for calculating fine for a specific borrow record
export const calculateFineForBorrow = createAsyncThunk(
  "fine/calculateForBorrow",
  async (borrowId, { rejectWithValue }) => {
    try {
      const response = await axios.get(API_ENDPOINTS.FINE.CALCULATE(borrowId), {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      // Handle 404 errors gracefully by returning a default structure
      if (error.response?.status === 404) {
        console.warn(`Fine calculation endpoint not found for borrowId: ${borrowId}`);
        // Return a default structure if endpoint doesn't exist or borrow record not found
        return {
          data: {
            totalFine: 0,
            message: "No fine record found",
            status: "none"
          }
        };
      }
      
      // More detailed error extraction
      if (error.response) {
        // Server responded with error status
        if (error.response.data) {
          if (error.response.data.message) {
            return rejectWithValue(error.response.data.message);
          }
          if (error.response.data.error) {
            return rejectWithValue(error.response.data.error);
          }
          return rejectWithValue(JSON.stringify(error.response.data));
        }
        return rejectWithValue(`Server error: ${error.response.status}`);
      } else if (error.request) {
        // Request was made but no response received
        return rejectWithValue("Network error - no response from server");
      } else {
        // Something else happened
        return rejectWithValue(error.message || "Unknown error occurred");
      }
    }
  }
);

// Async thunk for fetching user fine summary
export const fetchUserFineSummary = createAsyncThunk(
  "fine/fetchUserSummary",
  async (userId, { rejectWithValue }) => {
    try {
      // Validate userId before making request
      if (!userId) {
        console.warn("No userId provided for fine summary fetch");
        return {
          data: {
            summary: {
              totalOutstanding: 0,
              monthlyFines: 0,
              currentOverdue: 0,
              totalBorrows: 0
            },
            user: {
              id: "unknown",
              name: "Unknown User",
              email: "unknown@example.com"
            }
          }
        };
      }

      // First try the documented endpoint
      console.log(`Fetching fine summary for user: ${userId}`);
      const response = await axios.get(API_ENDPOINTS.FINE.SUMMARY(userId), {
        withCredentials: true,
      });
      console.log(`Fine summary response for user ${userId}:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`Error fetching fine summary for user ${userId}:`, error);
      
      // Handle 404 errors gracefully by returning a default structure
      if (error.response?.status === 404) {
        console.warn(`Fine summary endpoint not found for userId: ${userId}`);
        // Return a default structure if endpoint doesn't exist or user has no fines
        return {
          data: {
            summary: {
              totalOutstanding: 0,
              monthlyFines: 0,
              currentOverdue: 0,
              totalBorrows: 0
            },
            user: {
              id: userId,
              name: "Unknown User",
              email: "unknown@example.com"
            }
          }
        };
      }
      
      // Handle 400 errors (bad request) for invalid user ID
      if (error.response?.status === 400) {
        console.warn(`Invalid userId provided: ${userId}`);
        return {
          data: {
            summary: {
              totalOutstanding: 0,
              monthlyFines: 0,
              currentOverdue: 0,
              totalBorrows: 0
            },
            user: {
              id: userId,
              name: "Invalid User",
              email: "invalid@example.com"
            }
          }
        };
      }
      
      // More detailed error extraction
      if (error.response) {
        // Server responded with error status
        if (error.response.data) {
          if (error.response.data.message) {
            return rejectWithValue(error.response.data.message);
          }
          if (error.response.data.error) {
            return rejectWithValue(error.response.data.error);
          }
          return rejectWithValue(JSON.stringify(error.response.data));
        }
        return rejectWithValue(`Server error: ${error.response.status}`);
      } else if (error.request) {
        // Request was made but no response received
        return rejectWithValue("Network error - no response from server");
      } else {
        // Something else happened
        return rejectWithValue(error.message || "Unknown error occurred");
      }
    }
  }
);

// Async thunk for creating Razorpay order
export const createFinePaymentOrder = createAsyncThunk(
  "fine/createPaymentOrder",
  async (orderData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API_ENDPOINTS.FINE.CREATE_ORDER()}`,
        orderData,
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      // More detailed error extraction
      if (error.response) {
        // Server responded with error status
        if (error.response.data) {
          if (error.response.data.message) {
            return rejectWithValue(error.response.data.message);
          }
          if (error.response.data.error) {
            return rejectWithValue(error.response.data.error);
          }
          return rejectWithValue(JSON.stringify(error.response.data));
        }
        return rejectWithValue(`Server error: ${error.response.status}`);
      } else if (error.request) {
        // Request was made but no response received
        return rejectWithValue("Network error - no response from server");
      } else {
        // Something else happened
        return rejectWithValue(error.message || "Unknown error occurred");
      }
    }
  }
);

// Async thunk for verifying Razorpay payment
export const verifyRazorpayPayment = createAsyncThunk(
  "fine/verifyRazorpayPayment",
  async (paymentData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || "https://libraflow-library-management-system.onrender.com/api/v1"}/payments/verify-payment`,
        paymentData,
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      // More detailed error extraction
      if (error.response) {
        // Server responded with error status
        if (error.response.data) {
          if (error.response.data.message) {
            return rejectWithValue(error.response.data.message);
          }
          if (error.response.data.error) {
            return rejectWithValue(error.response.data.error);
          }
          return rejectWithValue(JSON.stringify(error.response.data));
        }
        return rejectWithValue(`Server error: ${error.response.status}`);
      } else if (error.request) {
        // Request was made but no response received
        return rejectWithValue("Network error - no response from server");
      } else {
        // Something else happened
        return rejectWithValue(error.message || "Unknown error occurred");
      }
    }
  }
);

// Async thunk for fetching payment order status
export const fetchPaymentOrderStatus = createAsyncThunk(
  "fine/fetchPaymentOrderStatus",
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL || "https://libraflow-library-management-system.onrender.com/api/v1"}/payments/order-status/${orderId}`,
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      // More detailed error extraction
      if (error.response) {
        // Server responded with error status
        if (error.response.data) {
          if (error.response.data.message) {
            return rejectWithValue(error.response.data.message);
          }
          if (error.response.data.error) {
            return rejectWithValue(error.response.data.error);
          }
          return rejectWithValue(JSON.stringify(error.response.data));
        }
        return rejectWithValue(`Server error: ${error.response.status}`);
      } else if (error.request) {
        // Request was made but no response received
        return rejectWithValue("Network error - no response from server");
      } else {
        // Something else happened
        return rejectWithValue(error.message || "Unknown error occurred");
      }
    }
  }
);

// Async thunk for fetching payment metrics (Admin only)
export const fetchPaymentMetrics = createAsyncThunk(
  "fine/fetchPaymentMetrics",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL || "https://libraflow-library-management-system.onrender.com/api/v1"}/payments/metrics`,
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      // More detailed error extraction
      if (error.response) {
        // Server responded with error status
        if (error.response.data) {
          if (error.response.data.message) {
            return rejectWithValue(error.response.data.message);
          }
          if (error.response.data.error) {
            return rejectWithValue(error.response.data.error);
          }
          return rejectWithValue(JSON.stringify(error.response.data));
        }
        return rejectWithValue(`Server error: ${error.response.status}`);
      } else if (error.request) {
        // Request was made but no response received
        return rejectWithValue("Network error - no response from server");
      } else {
        // Something else happened
        return rejectWithValue(error.message || "Unknown error occurred");
      }
    }
  }
);

// Async thunk for fetching borrow audit trail (Admin only)
export const fetchBorrowAuditTrail = createAsyncThunk(
  "fine/fetchBorrowAuditTrail",
  async (borrowId, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL || "https://libraflow-library-management-system.onrender.com/api/v1"}/admin/fines/audit-trail/${borrowId}`,
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      // More detailed error extraction
      if (error.response) {
        // Server responded with error status
        if (error.response.data) {
          if (error.response.data.message) {
            return rejectWithValue(error.response.data.message);
          }
          if (error.response.data.error) {
            return rejectWithValue(error.response.data.error);
          }
          return rejectWithValue(JSON.stringify(error.response.data));
        }
        return rejectWithValue(`Server error: ${error.response.status}`);
      } else if (error.request) {
        // Request was made but no response received
        return rejectWithValue("Network error - no response from server");
      } else {
        // Something else happened
        return rejectWithValue(error.message || "Unknown error occurred");
      }
    }
  }
);

// Async thunk for adjusting borrow fine (Admin only)
export const adjustBorrowFine = createAsyncThunk(
  "fine/adjustBorrowFine",
  async ({ borrowId, newFine, reason, notes }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || "https://libraflow-library-management-system.onrender.com/api/v1"}/admin/fines/adjust-fine/${borrowId}`,
        { newFine, reason, notes },
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      // More detailed error extraction
      if (error.response) {
        // Server responded with error status
        if (error.response.data) {
          if (error.response.data.message) {
            return rejectWithValue(error.response.data.message);
          }
          if (error.response.data.error) {
            return rejectWithValue(error.response.data.error);
          }
          return rejectWithValue(JSON.stringify(error.response.data));
        }
        return rejectWithValue(`Server error: ${error.response.status}`);
      } else if (error.request) {
        // Request was made but no response received
        return rejectWithValue("Network error - no response from server");
      } else {
        // Something else happened
        return rejectWithValue(error.message || "Unknown error occurred");
      }
    }
  }
);

// Async thunk for fetching fine analytics
export const fetchFineAnalytics = createAsyncThunk(
  "fine/fetchAnalytics",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(API_ENDPOINTS.FINE.ADMIN.ANALYTICS(), {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      // Handle 404 errors for analytics as well
      if (error.response?.status === 404) {
        console.warn("Fine analytics endpoint not found");
        // Return a default structure when endpoint doesn't exist
        return {
          data: {
            statistics: {
              totalFines: 0,
              paidFines: 0,
              unpaidFines: 0,
              avgFine: 0,
              totalBooks: 0,
              overdueBooks: 0
            },
            insights: [],
            efficiency: {
              onTimeRate: 0,
              overdueRate: 0
            }
          }
        };
      }
      
      // More detailed error extraction
      if (error.response) {
        // Server responded with error status
        if (error.response.data) {
          if (error.response.data.message) {
            return rejectWithValue(error.response.data.message);
          }
          if (error.response.data.error) {
            return rejectWithValue(error.response.data.error);
          }
          return rejectWithValue(JSON.stringify(error.response.data));
        }
        return rejectWithValue(`Server error: ${error.response.status}`);
      } else if (error.request) {
        // Request was made but no response received
        return rejectWithValue("Network error - no response from server");
      } else {
        // Something else happened
        return rejectWithValue(error.message || "Unknown error occurred");
      }
    }
  }
);

const fineSlice = createSlice({
  name: "fine",
  initialState: {
    calculatedFines: {},
    userSummary: null,
    loading: false,
    error: null,
    paymentLoading: false,
    paymentError: null,
    razorpayOrder: null,
    razorpayVerification: null,
    paymentOrderStatus: null,
    paymentMetrics: null,
    borrowAuditTrail: null,
    analytics: null,
    analyticsLoading: false,
    analyticsError: null,
  },
  reducers: {
    clearFineError: (state) => {
      state.error = null;
    },
    clearPaymentError: (state) => {
      state.paymentError = null;
    },
    resetFineState: (state) => {
      state.calculatedFines = {};
      state.userSummary = null;
      state.loading = false;
      state.error = null;
      state.paymentLoading = false;
      state.paymentError = null;
      state.razorpayOrder = null;
      state.razorpayVerification = null;
      state.paymentOrderStatus = null;
      state.paymentMetrics = null;
      state.borrowAuditTrail = null;
      state.analytics = null;
      state.analyticsLoading = false;
      state.analyticsError = null;
    },
    setRazorpayOrder: (state, action) => {
      state.razorpayOrder = action.payload;
    },
    clearRazorpayOrder: (state) => {
      state.razorpayOrder = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Calculate fine for borrow
      .addCase(calculateFineForBorrow.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(calculateFineForBorrow.fulfilled, (state, action) => {
        state.loading = false;
        // Store the entire payload data with proper structure
        state.calculatedFines[action.meta.arg] = action.payload;
        // Show success message if available
        if (action.payload?.data?.message && !action.payload.data.message.includes("No fine record found")) {
          toast.success(action.payload.data.message);
        }
      })
      .addCase(calculateFineForBorrow.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        // Only show error toast for non-404 errors
        if (action.payload && !action.payload.includes("404")) {
          toast.error(action.payload);
        }
      })
      // Fetch user fine summary
      .addCase(fetchUserFineSummary.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserFineSummary.fulfilled, (state, action) => {
        state.loading = false;
        // Ensure we have the expected data structure
        if (action.payload && action.payload.data) {
          state.userSummary = action.payload.data;
        } else {
          // Fallback to empty structure if data is missing
          state.userSummary = {
            summary: {
              totalOutstanding: 0,
              monthlyFines: 0,
              currentOverdue: 0,
              totalBorrows: 0
            }
          };
        }
      })
      .addCase(fetchUserFineSummary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        // Show error toast only for non-404 errors
        if (action.payload && !action.payload.includes("404") && !action.payload.includes("400")) {
          toast.error(action.payload);
        }
        console.log('Fine summary fetch rejected:', action.payload);
        
        // Ensure we have a fallback userSummary structure even on error
        if (!state.userSummary) {
          state.userSummary = {
            summary: {
              totalOutstanding: 0,
              monthlyFines: 0,
              currentOverdue: 0,
              totalBorrows: 0
            }
          };
        }
      })
      // Create payment order
      .addCase(createFinePaymentOrder.pending, (state) => {
        state.paymentLoading = true;
        state.paymentError = null;
      })
      .addCase(createFinePaymentOrder.fulfilled, (state, action) => {
        state.paymentLoading = false;
        state.razorpayOrder = action.payload.data;
        toast.success(action.payload.message || "Razorpay order created successfully");
      })
      .addCase(createFinePaymentOrder.rejected, (state, action) => {
        state.paymentLoading = false;
        state.paymentError = action.payload;
        toast.error(action.payload);
      })
      // Verify Razorpay payment
      .addCase(verifyRazorpayPayment.pending, (state) => {
        state.paymentLoading = true;
        state.paymentError = null;
      })
      .addCase(verifyRazorpayPayment.fulfilled, (state, action) => {
        state.paymentLoading = false;
        state.razorpayVerification = action.payload;
        toast.success(action.payload.message || "Payment verified successfully");
      })
      .addCase(verifyRazorpayPayment.rejected, (state, action) => {
        state.paymentLoading = false;
        state.paymentError = action.payload;
        toast.error(action.payload);
      })
      // Fetch payment order status
      .addCase(fetchPaymentOrderStatus.pending, (state) => {
        state.paymentLoading = true;
        state.paymentError = null;
      })
      .addCase(fetchPaymentOrderStatus.fulfilled, (state, action) => {
        state.paymentLoading = false;
        state.paymentOrderStatus = action.payload.data;
      })
      .addCase(fetchPaymentOrderStatus.rejected, (state, action) => {
        state.paymentLoading = false;
        state.paymentError = action.payload;
        toast.error(action.payload);
      })
      // Fetch payment metrics
      .addCase(fetchPaymentMetrics.pending, (state) => {
        state.paymentLoading = true;
        state.paymentError = null;
      })
      .addCase(fetchPaymentMetrics.fulfilled, (state, action) => {
        state.paymentLoading = false;
        state.paymentMetrics = action.payload.data;
      })
      .addCase(fetchPaymentMetrics.rejected, (state, action) => {
        state.paymentLoading = false;
        state.paymentError = action.payload;
        toast.error(action.payload);
      })
      // Fetch borrow audit trail
      .addCase(fetchBorrowAuditTrail.pending, (state) => {
        state.paymentLoading = true;
        state.paymentError = null;
      })
      .addCase(fetchBorrowAuditTrail.fulfilled, (state, action) => {
        state.paymentLoading = false;
        state.borrowAuditTrail = action.payload.data;
      })
      .addCase(fetchBorrowAuditTrail.rejected, (state, action) => {
        state.paymentLoading = false;
        state.paymentError = action.payload;
        toast.error(action.payload);
      })
      // Adjust borrow fine
      .addCase(adjustBorrowFine.pending, (state) => {
        state.paymentLoading = true;
        state.paymentError = null;
      })
      .addCase(adjustBorrowFine.fulfilled, (state, action) => {
        state.paymentLoading = false;
        toast.success(action.payload.message || "Fine adjusted successfully");
      })
      .addCase(adjustBorrowFine.rejected, (state, action) => {
        state.paymentLoading = false;
        state.paymentError = action.payload;
        toast.error(action.payload);
      })
      // Fetch fine analytics
      .addCase(fetchFineAnalytics.pending, (state) => {
        state.analyticsLoading = true;
        state.analyticsError = null;
      })
      .addCase(fetchFineAnalytics.fulfilled, (state, action) => {
        state.analyticsLoading = false;
        state.analytics = action.payload.data;
      })
      .addCase(fetchFineAnalytics.rejected, (state, action) => {
        state.analyticsLoading = false;
        state.analyticsError = action.payload;
        // Show error toast only for non-404 errors
        if (action.payload && !action.payload.includes("404")) {
          toast.error(action.payload);
        }
      });
  },
});

export const { 
  clearFineError, 
  clearPaymentError, 
  resetFineState,
  setRazorpayOrder,
  clearRazorpayOrder
} = fineSlice.actions;
export default fineSlice.reducer;