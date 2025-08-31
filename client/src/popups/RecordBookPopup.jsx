import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { recordBorrowBook, resetBorrowSlice } from "../store/slices/borrowSlice";
import { toggleRecordBookPopup } from "../store/slices/popupSlice";

const RecordBookPopup = () => {
  const dispatch = useDispatch();
  const { recordBookPopup, selectedBook } = useSelector((state) => state.popup);
  const { loading: borrowLoading, error: borrowError, message: borrowMessage } = useSelector((state) => state.borrow);

  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const emailInputRef = useRef(null);
  const popupRef = useRef(null);

  const book = selectedBook;

  // Focus email input when popup opens
  useEffect(() => {
    if (recordBookPopup && emailInputRef.current) {
      emailInputRef.current.focus();
    }
  }, [recordBookPopup]);

  // Reset states when popup closes
  useEffect(() => {
    if (!recordBookPopup) {
      setEmail("");
      setMessage("");
      // Reset borrow state when popup closes
      dispatch(resetBorrowSlice());
    }
  }, [recordBookPopup, dispatch]);

  // Handle messages from Redux state
  useEffect(() => {
    if (borrowMessage) {
      setMessage(borrowMessage);
    } else if (borrowError) {
      setMessage(borrowError);
    }
  }, [borrowMessage, borrowError]);

  // Handle ESC key to close popup
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  // Trap focus inside popup
  useEffect(() => {
    if (!recordBookPopup) return;
    
    const focusableElements = popupRef.current?.querySelectorAll(
      'a[href], button:not([disabled]), textarea, input, select'
    );
    const firstEl = focusableElements?.[0];
    const lastEl = focusableElements?.[focusableElements.length - 1];

    const handleTab = (e) => {
      if (e.key !== "Tab") return;
      if (!firstEl || !lastEl) return;

      if (e.shiftKey) {
        if (document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        }
      } else {
        if (document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };

    window.addEventListener("keydown", handleTab);
    return () => window.removeEventListener("keydown", handleTab);
  }, [recordBookPopup]);

  const handleClose = () => {
    dispatch(toggleRecordBookPopup({ open: false }));
  };

 const handleRecordBook = async (e) => {
  e.preventDefault();
  setMessage("");

  // Email validation
  const emailRegex = /^\S+@\S+\.\S+$/;
  if (!email.trim() || !emailRegex.test(email)) {
    setMessage("Please enter a valid email address.");
    emailInputRef.current.focus();
    return;
  }

  if (!book?._id) {
    setMessage("No book selected. Please select a book.");
    return;
  }

  const isAvailable = book.available === true || book.available === "true";
  const quantity = Number(book.quantity || 0);

  if (!isAvailable || quantity <= 0) {
    setMessage("This book is currently unavailable.");
    return;
  }

  try {
    const response = await dispatch(
      recordBorrowBook({ email, bookId: book._id })
    ).unwrap();

    setMessage(response?.message || "Book borrowed successfully!");
    setEmail("");

    // ✅ reset redux borrow slice so it doesn’t trigger again
    dispatch(resetBorrowSlice());

    // ✅ close popup after success
    setTimeout(() => {
      handleClose();
    }, 1200);
  } catch (err) {
    console.error("Failed to record borrowed book:", err);
    setMessage(err?.message || "Failed to record borrowed book.");

    // ✅ reset borrow slice on error too
    dispatch(resetBorrowSlice());
  }
};

  if (!recordBookPopup) return null;

  const isBookAvailable = book?.available === true || book?.available === "true";
  const hasQuantity = Number(book?.quantity || 0) > 0;
  const isButtonDisabled = borrowLoading || !book?._id || !isBookAvailable || !hasQuantity;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="recordBookTitle"
    >
      <div
        ref={popupRef}
        className="w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden"
      >
        <div className="p-6">
          <header className="mb-6 pb-4 border-b border-black">
            <h3
              id="recordBookTitle"
              className="text-2xl font-bold text-black text-center"
            >
              Record Borrowed Book
            </h3>
          </header>

          <form onSubmit={handleRecordBook} className="space-y-5">
            <div>
              <label className="block text-black font-medium mb-1">
                Borrower Email
              </label>
              <input
                type="email"
                ref={emailInputRef}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border-2 border-black rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="Enter borrower's email"
                required
                disabled={borrowLoading}
              />
            </div>

            {book && (
              <div className="text-sm text-gray-700 font-mono space-y-1">
                <p>
                  <strong>Title:</strong> {book.title}
                </p>
                <p>
                  <strong>Author:</strong> {book.author}
                </p>
                <p>
                  <strong>Book ID:</strong> {book._id}
                </p>
                <p>
                  <strong>Available:</strong>{" "}
                  {(book.available === true || book.available === "true")
                    ? "Yes"
                    : "No"}
                </p>
                <p>
                  <strong>Quantity:</strong> {Number(book.quantity)}
                </p>
              </div>
            )}

            {message && (
              <p
                className={`text-sm ${
                  message.toLowerCase().includes("success")
                    ? "text-green-600"
                    : "text-red-600"
                }`}
                role="alert"
              >
                {message}
              </p>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={borrowLoading}
                className="px-4 py-2 bg-gray-200 text-black rounded-md hover:bg-gray-300 disabled:opacity-50"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={isButtonDisabled}
                className={`px-4 py-2 rounded-md text-white ${
                  isButtonDisabled
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-black hover:bg-gray-800"
                }`}
              >
                {borrowLoading ? "Recording..." : "Record"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RecordBookPopup;