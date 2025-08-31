import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { returnBorrowBook, resetBorrowSlice } from "../store/slices/borrowSlice"; // Correct import name
import { toggleReturnBookPopup } from "../store/slices/popupSlice";
import { toast } from "react-toastify";

const ReturnBookPopup = ({ bookId, email }) => {
  const dispatch = useDispatch();
  const { message, error, loading } = useSelector((state) => state.borrow); // Borrow slice, not popup

  const handleReturnBook = async (e) => {
    e.preventDefault();

    if (!bookId) {
      toast.error("Book ID is missing. Cannot return book.");
      return;
    }
    const result = await dispatch(returnBorrowBook({ email, bookId }));
    if (returnBorrowBook.fulfilled.match(result)) {
      // Only close and reset if the operation was successful
      toast.success("Book returned successfully!");
      dispatch(toggleReturnBookPopup());
      dispatch(resetBorrowSlice());
    } else if (returnBorrowBook.rejected.match(result)) {
      // Handle error case, message already shown by toast in thunk
      dispatch(resetBorrowSlice());
    }
  };

  useEffect(() => {
    // This effect will now only handle the closing of the popup and resetting the slice
    // after a message or error has been displayed by the thunk's toast.
    if (message || error) {
      // Give toast time to display before closing and resetting
      const timer = setTimeout(() => {
        dispatch(toggleReturnBookPopup());
        dispatch(resetBorrowSlice());
      }, 2000); // Adjust delay as needed
      return () => clearTimeout(timer);
    }
  }, [message, error, dispatch]);

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
