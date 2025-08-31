import React, { useEffect, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { returnBorrowBook } from "../store/slices/borrowSlice";
import { toggleReturnBookPopup } from "../store/slices/popupSlice";
import { toast } from "react-toastify";

const ReturnBookPopup = ({ bookId, email }) => {
  const dispatch = useDispatch();
  const { borrowLoading, message, error } = useSelector((state) => state.borrow);
  const cancelButtonRef = useRef(null);

  /** Handle form submit */
  const handleReturnBook = (e) => {
    e.preventDefault();

    if (!bookId || !email) {
      toast.error("📚 Missing book ID or user email. Cannot process return.");
      return;
    }

    dispatch(returnBorrowBook({ email, bookId }));
  };

  /** Close popup */
  const handleClose = useCallback(() => {
    dispatch(toggleReturnBookPopup());
  }, [dispatch]);

  /** Toast notifications */
  useEffect(() => {
    if (borrowLoading) {
      toast.info("⏳ Returning your book... Please wait!", {
        toastId: "return-process",
      });
    }
  }, [borrowLoading]);

  useEffect(() => {
    if (message) {
      toast.success(`✅ ${message}`, { toastId: "return-success" });
      handleClose();
    }
  }, [message, handleClose]);

  useEffect(() => {
    if (error) {
      toast.error(`❌ ${error}`, { toastId: "return-error" });
    }
  }, [error]);

  /** Auto-focus Cancel button & ESC key close */
  useEffect(() => {
    cancelButtonRef.current?.focus();

    const handleEsc = (e) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [handleClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl transform transition-all scale-95 hover:scale-100"
        role="dialog"
        aria-labelledby="return-book-title"
        aria-modal="true"
      >
        <div className="p-6">
          <h3 id="return-book-title" className="text-2xl font-extrabold text-gray-900 mb-4">
            Return Book
          </h3>

          <form onSubmit={handleReturnBook} className="space-y-5">
            <div>
              <label htmlFor="user-email" className="block text-sm font-medium text-gray-700">
                User Email
              </label>
              <input
                id="user-email"
                type="email"
                value={email}
                disabled
                className="w-full px-4 py-2 border-2 border-gray-900 rounded-md bg-gray-100 cursor-not-allowed"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                ref={cancelButtonRef}
                onClick={handleClose}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={borrowLoading}
                className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
              >
                {borrowLoading ? "⏳ Processing..." : "Return"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReturnBookPopup;
