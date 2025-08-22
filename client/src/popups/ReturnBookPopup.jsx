import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { returnBorrowBook } from "../store/slices/borrowSlice"; // Correct import name
import { toggleReturnBookPopup } from "../store/slices/popupSlice";
import { toast } from "react-toastify";

const ReturnBookPopup = ({ bookId, email }) => {
  const dispatch = useDispatch();
  const { message, error, loading } = useSelector((state) => state.borrow); // Borrow slice, not popup

  const handleReturnBook = (e) => {
    e.preventDefault();

    if (!bookId) {
      toast.error("Book ID is missing. Cannot return book.");
      return;
    }
    dispatch(returnBorrowBook(email, bookId));
    dispatch(toggleReturnBookPopup());
  };

  useEffect(() => {
    if (message) {
      toast.success(message);
    }
  }, [message]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  useEffect(() => {
    if (loading) {
      toast.info("Returning book...");
    }
  }, [loading]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 p-5 flex items-center justify-center z-50">
      <div className="w-full bg-white rounded-lg shadow-lg md:w-1/3">
        <div className="p-6">
          <h3 className="text-xl font-bold mb-4">Return Book</h3>
          <form onSubmit={handleReturnBook}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                User Email
              </label>
              <input
                type="email"
                defaultValue={email}
                disabled
                className="w-full px-4 py-2 border-2 border-black rounded-md"
                required
                placeholder="User Email"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
                type="button"
                onClick={() => dispatch(toggleReturnBookPopup())}
              >
                Close
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
              >
                Return
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReturnBookPopup;
