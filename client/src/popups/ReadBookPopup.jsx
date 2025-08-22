import React from "react";
import { useDispatch } from "react-redux";
import { toggleReadBookPopup } from "../store/slices/popupSlice";

const ReadBookPopup = ({ book }) => {
  const dispatch = useDispatch();

  if (!book) return null; // don’t render if no book is provided

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 p-5 flex items-center justify-center z-50">
      <div className="w-full max-w-lg bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center bg-black text-white px-6 py-4 rounded-t-lg">
          <h2 className="text-lg font-bold">View Book Info</h2>
          <button
            className="text-white text-2xl font-bold hover:text-gray-300"
            onClick={() => dispatch(toggleReadBookPopup())}
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[80vh] overflow-y-auto space-y-4">
          {/* Book Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Book Title</label>
            <p className="border-2 border-gray-300 rounded-md px-4 py-2 bg-gray-100">
              {book?.title || "N/A"}
            </p>
          </div>

          {/* Author */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Author</label>
            <p className="border-2 border-gray-300 rounded-md px-4 py-2 bg-gray-100">
              {book?.author || "N/A"}
            </p>
          </div>

          {/* Publisher */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Publisher</label>
            <p className="border-2 border-gray-300 rounded-md px-4 py-2 bg-gray-100">
              {book?.publisher || "N/A"}
            </p>
          </div>

          {/* ISBN */}
          <div>
            <label className="block text-sm font-medium text-gray-700">ISBN</label>
            <p className="border-2 border-gray-300 rounded-md px-4 py-2 bg-gray-100">
              {book?.ISBN || "N/A"}
            </p>
          </div>

          {/* Publication Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Publication Date</label>
            <p className="border-2 border-gray-300 rounded-md px-4 py-2 bg-gray-100">
              {book?.publishedDate
                ? new Date(book.publishedDate).toLocaleDateString()
                : "N/A"}
            </p>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Quantity</label>
            <p className="border-2 border-gray-300 rounded-md px-4 py-2 bg-gray-100">
              {book?.quantity ?? "N/A"}
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <p className="border-2 border-gray-300 rounded-md px-4 py-2 bg-gray-100 whitespace-pre-line">
              {book?.description || "N/A"}
            </p>
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Price</label>
            <p className="border-2 border-gray-300 rounded-md px-4 py-2 bg-gray-100">
              {book?.price ? `$${book.price.toFixed(2)}` : "N/A"}
            </p>
          </div>

          {/* Availability */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Availability</label>
            <p
              className={`border-2 rounded-md px-4 py-2 ${
                book?.available
                  ? "bg-green-100 border-green-300 text-green-800"
                  : "bg-red-100 border-red-300 text-red-800"
              }`}
            >
              {book?.available ? "Available" : "Not Available"}
            </p>
          </div>

          {/* Genre */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Genre</label>
            <p className="border-2 border-gray-300 rounded-md px-4 py-2 bg-gray-100">
              {book?.genre || "N/A"}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-4 bg-gray-100 rounded-b-lg">
          <button
            className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
            type="button"
            onClick={() => dispatch(toggleReadBookPopup())}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReadBookPopup;
