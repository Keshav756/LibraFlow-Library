import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { 
  calculateFineForBorrow, 
  createFinePaymentOrder,
  verifyRazorpayPayment,
  clearPaymentError
} from "../store/slices/fineSlice";

const FinePaymentPopup = ({ book, email, onPaymentComplete, onClose }) => {
  const dispatch = useDispatch();
  const fineState = useSelector((state) => state.fine) || {};
  const { calculatedFines = {}, loading, paymentLoading, paymentError, razorpayOrder } = fineState;
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasAutoSkipped, setHasAutoSkipped] = useState(false);

  const borrowId = book?._id || book?.bookId;
  const fineData = borrowId ? calculatedFines[borrowId] : null;
  
  // Get fine amount from calculated data or fallback to book.fine
  const fineAmount = fineData && fineData.data 
    ? fineData.data.totalFine 
    : (book?.fine || 0);

  // Calculate fine when popup opens
  useEffect(() => {
    if (borrowId) {
      dispatch(calculateFineForBorrow(borrowId));
    }
  }, [borrowId, dispatch]);

  // If there's no fine amount, automatically skip to return
  useEffect(() => {
    if (!loading && fineAmount <= 0 && !hasAutoSkipped) {
      setHasAutoSkipped(true);
      const timer = setTimeout(() => {
        onPaymentComplete();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [fineAmount, loading, hasAutoSkipped, onPaymentComplete]);

  // Load Razorpay script
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        resolve(true);
      };
      script.onerror = () => {
        resolve(false);
      };
      document.body.appendChild(script);
    });
  };

  // Handle payment processing with Razorpay
  const handlePayFine = async () => {
    if (!borrowId || fineAmount <= 0) {
      toast.error("Invalid fine amount or borrow record");
      return;
    }

    setIsProcessing(true);
    
    try {
      // Create Razorpay order
      const orderResult = await dispatch(createFinePaymentOrder({ 
        borrowId, 
        amount: fineAmount
      })).unwrap();

      // Load Razorpay script
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        toast.error("Failed to load payment gateway. Please try again later.");
        setIsProcessing(false);
        return;
      }

      // Configure Razorpay options
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_placeholder",
        amount: orderResult.data.order.amount * 100, // Convert to paise
        currency: orderResult.data.order.currency,
        name: "LibraFlow Library",
        description: `Fine Payment for ${orderResult.data.borrowRecord.book}`,
        order_id: orderResult.data.order.id,
        handler: async function (response) {
          try {
            // Verify payment with backend
            await dispatch(verifyRazorpayPayment({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              borrowId: borrowId,
              amount: fineAmount
            })).unwrap();
            
            // Payment successful, show success message
            toast.success("Payment successful! Thank you for your payment.");
            onPaymentComplete();
          } catch (verificationError) {
            console.error("Payment verification error:", verificationError);
            toast.error("Payment processed but verification failed. Please contact support.");
          }
        },
        prefill: {
          name: "User",
          email: email || "",
        },
        theme: {
          color: "#151619"
        }
      };

      // Open Razorpay checkout
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        toast.error("Payment failed. Please try again.");
        console.error("Payment failed:", response.error);
      });
      rzp.open();
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Failed to process payment: " + (error.message || "Unknown error"));
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle skip if no fine
  const handleSkip = () => {
    onPaymentComplete();
  };

  // Clear payment error when component unmounts
  useEffect(() => {
    return () => {
      if (paymentError) {
        dispatch(clearPaymentError());
      }
    };
  }, [dispatch, paymentError]);

  if (!book) return null;

  // Get the borrow date - try multiple possible fields
  const borrowDate = book?.borrowDate || book?.createdAt || null;
  const formattedBorrowDate = borrowDate 
    ? new Date(borrowDate).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    : "N/A";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center bg-black text-white px-6 py-4 rounded-t-lg">
          <h3 className="text-lg font-bold">Fine Payment</h3>
          <button
            className="text-white text-2xl font-bold hover:text-gray-300"
            onClick={onClose}
            disabled={isProcessing || paymentLoading}
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[80vh] overflow-y-auto space-y-4">
          <p className="text-gray-600 mb-4">
            Please pay the outstanding fine before returning the book.
          </p>

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              <span className="ml-3">Calculating fine...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Book Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Book Title</label>
                <p className="border-2 border-gray-300 rounded-md px-4 py-2 bg-gray-100">
                  {book?.book?.title || book?.title || "Unknown Book"}
                </p>
              </div>

              {/* Borrowed On */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Borrowed On</label>
                <p className="border-2 border-gray-300 rounded-md px-4 py-2 bg-gray-100">
                  {formattedBorrowDate}
                </p>
              </div>

              {/* Fine Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Fine Amount</label>
                <p className="border-2 border-gray-300 rounded-md px-4 py-2 bg-gray-100 text-red-600 font-bold">
                  ₹{fineAmount.toFixed(2)}
                </p>
              </div>

              {/* User Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700">User Email</label>
                <p className="border-2 border-gray-300 rounded-md px-4 py-2 bg-gray-100">
                  {email || "N/A"}
                </p>
              </div>

              {/* Payment Error */}
              {paymentError && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded">
                  {paymentError}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-4 bg-gray-100 rounded-b-lg space-x-3">
          <button
            onClick={onClose}
            disabled={isProcessing || paymentLoading}
            className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
          >
            Cancel
          </button>
          
          {fineAmount > 0 ? (
            <button
              onClick={handlePayFine}
              disabled={isProcessing || paymentLoading}
              className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 disabled:opacity-50 flex items-center"
            >
              {isProcessing || paymentLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                `Pay ₹${fineAmount.toFixed(2)}`
              )}
            </button>
          ) : (
            <button
              onClick={handleSkip}
              className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
            >
              No Fine - Continue to Return
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinePaymentPopup;