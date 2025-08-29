import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { recordBorrowBook } from "../store/slices/borrowSlice";
import { toggleRecordBookPopup } from "../store/slices/popupSlice";

const RecordBookPopup = () => {
  const dispatch = useDispatch();
  const { recordBookPopup, selectedBookId } = useSelector(
    (state) => state.popup
  );

  const [email, setEmail] = useState("");
  const [bookId, setBookId] = useState("");

  // Set bookId from Redux or generate temporary random one
  useEffect(() => {
    if (selectedBookId) {
      setBookId(selectedBookId);
    } else if (!selectedBookId && recordBookPopup) {
      // Generate random 8-character ID
      const randomId = Math.random().toString(36).substring(2, 10);
      setBookId(randomId);
    }
  }, [selectedBookId, recordBookPopup]);

  if (!recordBookPopup) return null;

  const handleRecordBook = (e) => {
    e.preventDefault();

    if (!email.trim()) {
      alert("Please enter a valid email");
      return;
    }

    if (!bookId) {
      alert("Book ID is missing! Please select a book.");
      return;
    }

    // Dispatch Redux action to record borrow
    dispatch(recordBorrowBook({ email, bookId }));

    // Reset local state
    setEmail("");
    setBookId("");

    // Close popup
    dispatch(toggleRecordBookPopup({ open: false }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 p-4 flex items-center justify-center z-50">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg">
        <div className="p-6">
          <header className="mb-5 pb-4 border-b border-black">
            <h3 className="text-xl font-bold text-gray-900">
              Record Borrowed Book
            </h3>
          </header>

          <form onSubmit={handleRecordBook} className="space-y-4">
            <div>
              <label className="block text-gray-900 font-medium mb-2">
                Borrower Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md"
                placeholder="Enter borrower email"
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => dispatch(toggleRecordBookPopup({ open: false }))}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
              >
                Record
              </button>
            </div>
          </form>

          {bookId && (
            <p className="mt-3 text-sm text-gray-500">
              Book ID: <span className="font-mono">{bookId}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecordBookPopup;
