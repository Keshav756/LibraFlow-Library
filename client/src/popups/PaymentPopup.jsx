import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createOrder, verifyPayment, clearOrder } from "../store/slices/fineSlice";
import { X, IndianRupee, Book, Calendar, User } from "lucide-react";
import { toast } from "react-toastify";

const PaymentPopup = ({ borrowRecord, onClose, onPaymentSuccess }) => {
  const dispatch = useDispatch();
  const { order, orderLoading, verifyLoading, error, message } = useSelector((state) => state.fine);
  
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Handle error and message toasts
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
    if (message) {
      toast.success(message);
    }
  }, [error, message]);

  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      dispatch(clearOrder());
    };
  }, [dispatch]);

  const handlePayment = async () => {
    if (!borrowRecord || borrowRecord.fine <= 0) {
      toast.error("Invalid fine amount");
      return;
    }

    try {
      // Create order
      const resultAction = await dispatch(createOrder({
        borrowId: borrowRecord._id,
        amount: borrowRecord.fine
      }));

      if (createOrder.fulfilled.match(resultAction)) {
        const result = resultAction.payload;
        
        if (result.order) {
          setPaymentProcessing(true);
          
          // Load Razorpay script
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.async = true;
          document.body.appendChild(script);

          script.onload = () => {
            const options = {
              key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_JTA2gns76PnMtx",
              amount: result.order.amount,
              currency: result.order.currency,
              name: "LibraFlow Library",
              description: `Fine payment for book: ${borrowRecord.book?.title || 'Unknown Book'}`,
              order_id: result.order.id,
              handler: async function (response) {
                try {
                  // Verify payment
                  const verificationResultAction = await dispatch(verifyPayment({
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature
                  }));

                  if (verifyPayment.fulfilled.match(verificationResultAction)) {
                    const verificationResult = verificationResultAction.payload;
                    setPaymentSuccess(true);
                    setPaymentProcessing(false);
                    toast.success("Payment successful!");
                    
                    // Notify parent component
                    if (onPaymentSuccess) {
                      onPaymentSuccess(verificationResult.payment);
                    }
                  } else {
                    setPaymentProcessing(false);
                    toast.error("Payment verification failed");
                  }
                } catch (error) {
                  setPaymentProcessing(false);
                  toast.error("Payment verification failed");
                }
              },
              prefill: {
                name: borrowRecord.name,
                email: borrowRecord.email,
              },
              theme: {
                color: "#333333"
              }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
          };

          script.onerror = () => {
            setPaymentProcessing(false);
            toast.error("Failed to load payment gateway");
          };
        }
      } else {
        toast.error(resultAction.payload || "Failed to initiate payment");
      }
    } catch (error) {
      toast.error("Failed to initiate payment");
    }
  };

  if (!borrowRecord) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800">Pay Library Fine</h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {paymentSuccess ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">Payment Successful!</h4>
              <p className="text-gray-600 mb-6">Your fine payment has been processed successfully.</p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-center mb-3">
                  <div className="bg-gray-200 rounded-lg w-12 h-12 flex items-center justify-center mr-3">
                    <Book className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">{borrowRecord.book?.title || "Unknown Book"}</h4>
                    <p className="text-sm text-gray-600">by {borrowRecord.book?.author || "Unknown Author"}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="flex items-center text-sm">
                    <User className="w-4 h-4 text-gray-500 mr-2" />
                    <span className="text-gray-600">Borrower:</span>
                  </div>
                  <div className="text-sm font-medium">{borrowRecord.name}</div>
                  
                  <div className="flex items-center text-sm">
                    <Calendar className="w-4 h-4 text-gray-500 mr-2" />
                    <span className="text-gray-600">Borrowed:</span>
                  </div>
                  <div className="text-sm font-medium">
                    {new Date(borrowRecord.borrowDate || borrowRecord.createdAt).toLocaleDateString()}
                  </div>
                  
                  <div className="flex items-center text-sm">
                    <IndianRupee className="w-4 h-4 text-gray-500 mr-2" />
                    <span className="text-gray-600">Fine Amount:</span>
                  </div>
                  <div className="text-sm font-bold text-red-600">₹{borrowRecord.fine.toFixed(2)}</div>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="font-semibold text-gray-800 mb-2">Payment Details</h4>
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Total Amount</span>
                    <span className="font-bold text-lg">₹{borrowRecord.fine.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                  disabled={paymentProcessing || verifyLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handlePayment}
                  disabled={paymentProcessing || verifyLoading || borrowRecord.fine <= 0}
                  className="flex-1 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {(paymentProcessing || verifyLoading) ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    `Pay ₹${borrowRecord.fine.toFixed(2)}`
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentPopup;