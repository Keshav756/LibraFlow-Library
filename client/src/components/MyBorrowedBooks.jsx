import React, { useState } from "react";
import { BookA } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {toggleReadBookPopup} from "../store/slices/popupSlice"
import Header from "../layout/Header";
import ReadBookPopup from "../popups/ReadBookPopup";

const MyBorrowedBooks = () => {
  const dispatch = useDispatch();
  const { books } = useSelector((state) => state.book);
  const { userBorrowedBooks } = useSelector((state) => state.borrow);
  const { readBookPopup } = useSelector((state) => state.popup);

  const [readBook, setReadBook] = useState("");
  const [filter, setFilter] = useState("returned");

  const openReadBookPopup = (id) => {
    const book = books.find((book) => book._id === id);
    setReadBook(book);
    dispatch(toggleReadBookPopup()); // ✅ Ensure parentheses
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "-";
    const date = new Date(timestamp);
    return `${String(date.getDate()).padStart(2, "0")}/${String(
      date.getMonth() + 1
    ).padStart(2, "0")}/${date.getFullYear()} ${String(
      date.getHours()
    ).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  };

  const returnedBooks = userBorrowedBooks?.filter((book) => book.returnDate);
  const nonReturnedBooks = userBorrowedBooks?.filter(
    (book) => !book.returnDate
  );

  const booksToDisplay =
    filter === "returned" ? returnedBooks : nonReturnedBooks;

  return (
    <>
      <main className="relative flex-1 p-6 pt-28">
        <Header />

        {/* Sub Header */}
        <header className="flex flex-col gap-3 md:flex-row md:justify-between md:items-center">
          <h2 className="text-xl font-medium md:text-2xl md:font-semibold">
            Borrowed Books
          </h2>
        </header>

        {/* Filter Buttons */}
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            className={`relative rounded sm:rounded-tr-none sm:rounded-br-none sm:rounded-tl-lg sm:rounded-bl-lg text-center border-2 font-semibold py-2 w-full sm:w-72 ${
              filter === "returned"
                ? "bg-black text-white border-black"
                : "bg-gray-200 text-black border-gray-200 hover:bg-gray-300"
            }`}
            onClick={() => setFilter("returned")}
          >
            Returned Books
          </button>
          <button
            className={`relative rounded sm:rounded-tl-none sm:rounded-bl-none sm:rounded-tr-lg sm:rounded-br-lg text-center border-2 font-semibold py-2 w-full sm:w-72 ${
              filter === "nonReturned"
                ? "bg-black text-white border-black"
                : "bg-gray-200 text-black border-gray-200 hover:bg-gray-300"
            }`}
            onClick={() => setFilter("nonReturned")}
          >
            Non-Returned Books
          </button>
        </header>

        {booksToDisplay?.length > 0 ? (
          <div className="mt-6 overflow-auto bg-white rounded-md shadow-lg">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-gray-200">
                  <th className="px-4 py-2 text-left">ID</th>
                  <th className="px-4 py-2 text-left">Book Title</th>
                  <th className="px-4 py-2 text-left">Borrow Date</th>
                  <th className="px-4 py-2 text-left">Due Date</th>
                  <th className="px-4 py-2 text-left">Price</th>
                  <th className="px-4 py-2 text-left">Fine</th>
                  <th className="px-4 py-2 text-left">Returned</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {booksToDisplay.map((book, index) => (
                  <tr
                    key={index}
                    className={(index + 1) % 2 === 0 ? "bg-gray-50" : ""}
                  >
                    <td className="px-4 py-2">{index + 1}</td>
                    <td className="px-4 py-2">
                      {book.book?.title || book.bookTitle}
                    </td>
                    <td className="px-4 py-2">{formatDate(book.borrowDate)}</td>
                    <td className="px-4 py-2">{formatDate(book.dueDate)}</td>
                    <td className="px-4 py-2">${book.price?.toFixed(2)}</td>
                    <td className="px-4 py-2">${book.fine?.toFixed(2)}</td>
                    <td className="px-4 py-2">
                      {book.returnDate ? "Yes" : "No"}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <BookA
                        onClick={() =>
                          openReadBookPopup(book.book?._id || book.bookId)
                        }
                        className="w-4 h-4 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors duration-200 cursor-pointer"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : filter === "returned" ? (
          <h3 className="text-3xl font-medium mt-5 text-gray-500">
            No returned books found!
          </h3>
        ) : (
          <h3 className="text-3xl font-medium mt-5 text-gray-500">
            No non-returned books found!
          </h3>
        )}
      </main>
      {readBookPopup && <ReadBookPopup book={readBook} />}
    </>
  );
};

export default MyBorrowedBooks;
