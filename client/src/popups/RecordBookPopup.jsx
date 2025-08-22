import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { recordBorrowBook } from "../store/slices/borrowSlice";
import { toggleRecordBookPopup } from "../store/slices/popupSlice";

const RecordBookPopup = () => {
  const dispatch = useDispatch();
  const { recordBookPopup, selectedBookId } = useSelector((state) => state.popup);

  const [email, setEmail] = useState("");

  if (!recordBookPopup) return null; // Only render if popup is active

  const handleRecordBook = (e) => {
    e.preventDefault();
    if (!email.trim()) {
      alert("Please enter an email");
      return;
    }

    dispatch(recordBorrowBook({ bookId: selectedBookId, email }));
    setEmail("");
    dispatch(toggleRecordBookPopup(null));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 p-4 flex items-center justify-center z-50">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg">
        <div className="p-6">
          <header className="mb-5 pb-4 border-b border-black">
            <h3 className="text-xl font-bold text-gray-900">Record Borrowed Book</h3>
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
                onClick={() => dispatch(toggleRecordBookPopup(null))}
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
        </div>
      </div>
    </div>
  );
};

export default RecordBookPopup;