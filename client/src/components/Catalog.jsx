import React, { useEffect, useState } from "react";
import { PiKeyReturnBold } from "react-icons/pi";
import { FaSquareCheck } from "react-icons/fa6";
import { useDispatch, useSelector } from "react-redux";
import { toggleReturnBookPopup } from "../store/slices/popupSlice";
import { toast } from "react-toastify";
import { fetchAllBooks, resetBookSlice } from "../store/slices/bookSlice";
import {
  fetchAllBorrowedBooks,
  resetBorrowSlice,
} from "../store/slices/borrowSlice";
import ReturnBookPopup from "../popups/ReturnBookPopup";
import Header from "../layout/Header";

const Catalog = () => {
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.auth || {});
  const { returnBookPopup } = useSelector((state) => state.popup || {});
  const { loading, message, error, allBorrowedBooks } = useSelector(
    (state) => state.borrow || {}
  );

  const [filter, setFilter] = useState("borrowed");
  const [email, setEmail] = useState("");
  const [borrowedBookId, setBorrowedBookId] = useState("");

  const formatDateAndTime = (timestamp) => {
    if (!timestamp) return "-";
    const date = new Date(timestamp);
    return `${String(date.getDate()).padStart(2, "0")}/${String(
      date.getMonth() + 1
    ).padStart(2, "0")}/${date.getFullYear()} ${String(
      date.getHours()
    ).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "-";
    const date = new Date(timestamp);
    return `${String(date.getDate()).padStart(2, "0")}/${String(
      date.getMonth() + 1
    ).padStart(2, "0")}/${date.getFullYear()}`;
  };

  const currentDate = new Date();

  const borrowedBooks = Array.isArray(allBorrowedBooks)
    ? allBorrowedBooks.filter((book) => {
        const dueDate = new Date(book.dueDate);
        return dueDate > currentDate;
      })
    : [];

  const overdueBooks = Array.isArray(allBorrowedBooks)
    ? allBorrowedBooks.filter((book) => {
        const dueDate = new Date(book.dueDate);
        return dueDate <= currentDate;
      })
    : [];

  const booksToDisplay = filter === "borrowed" ? borrowedBooks : overdueBooks;

  // Fix: Make sure bookId is always valid string
  const openReturnBookPopup = (bookObj, emailParam) => {
    let id = null;
    if (typeof bookObj === "string") {
      id = bookObj; // If bookObj is already an ID string
    } else if (bookObj && typeof bookObj === "object") {
      id = bookObj._id || bookObj.bookId || null;
    }

    if (!id) {
      toast.error("Book ID not found, cannot open return popup.");
      return;
    }
    setBorrowedBookId(id);
    setEmail(emailParam);
    dispatch(toggleReturnBookPopup());
  };

  useEffect(() => {
    if (message) {
      toast.success(message);
      dispatch(fetchAllBooks());
      dispatch(fetchAllBorrowedBooks());
      dispatch(resetBookSlice());
      dispatch(resetBorrowSlice());
    }
    if (error) {
      toast.error(error);
      dispatch(resetBookSlice());
      dispatch(resetBorrowSlice());
    }
  }, [dispatch, message, error]);

  return (
    <>
      <main className="relative flex-1 p-6 pt-28">
        <Header />

        {/* Display logged-in user name */}
        <div className="mb-4 text-lg font-semibold text-gray-700">
          Welcome, {user?.username || "Guest"}!
        </div>

        {/* Filter Buttons */}
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            className={`relative rounded sm:rounded-tr-none sm:rounded-br-none sm:rounded-tl-lg sm:rounded-bl-lg text-center border-2 font-semibold py-2 w-full sm:w-72 ${
              filter === "borrowed"
                ? "bg-black text-white border-black"
                : "bg-gray-200 text-black border-gray-200 hover:bg-gray-300"
            }`}
            onClick={() => setFilter("borrowed")}
          >
            Borrowed Books
          </button>
          <button
            className={`relative rounded sm:rounded-tl-none sm:rounded-bl-none sm:rounded-tr-lg sm:rounded-br-lg text-center border-2 font-semibold py-2 w-full sm:w-72 ${
              filter === "overdue"
                ? "bg-black text-white border-black"
                : "bg-gray-200 text-black border-gray-200 hover:bg-gray-300"
            }`}
            onClick={() => setFilter("overdue")}
          >
            Overdue Borrowers
          </button>
        </header>

        {booksToDisplay.length > 0 ? (
          <div className="mt-6 overflow-auto bg-white rounded-md shadow-lg">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-gray-200">
                  <th className="px-4 py-2 text-left">ID</th>
                  <th className="px-4 py-2 text-left">Username</th>
                  <th className="px-4 py-2 text-left">Email</th>
                  <th className="px-4 py-2 text-left">Price</th>
                  <th className="px-4 py-2 text-left">Due Date</th>
                  <th className="px-4 py-2 text-left">Date & Time</th>
                  <th className="px-4 py-2 text-left">Fine</th>
                  <th className="px-4 py-2 text-left">Return</th>
                </tr>
              </thead>
              <tbody>
                {booksToDisplay.map((book, index) => (
                  <tr
                    key={
                      book._id ||
                      book.bookId ||
                      (book.book && (book.book._id || book.book.bookId)) ||
                      index
                    }
                    className={(index + 1) % 2 === 0 ? "bg-gray-50" : ""}
                  >
                    <td className="px-4 py-2">{index + 1}</td>
                    <td className="px-4 py-2">
                      {book?.user?.username ||
                        book?.user?.name ||
                        book.username ||
                        book.name ||
                        "N/A"}
                    </td>
                    <td className="px-4 py-2">
                      {book?.user?.email || book.email || "N/A"}
                    </td>
                    <td className="px-4 py-2">
                      $
                      {book?.book?.price
                        ? book.book.price.toFixed(2)
                        : book.price
                        ? book.price.toFixed(2)
                        : "0.00"}
                    </td>
                    <td className="px-4 py-2">{formatDate(book.dueDate)}</td>
                    <td className="px-4 py-2">
                      {formatDateAndTime(book.borrowDate)}
                    </td>
                    <td className="px-4 py-2">
                      ${book.fine ? book.fine.toFixed(2) : "0.00"}
                    </td>
                    <td className="px-4 py-2">
                      {book.returnDate ? (
                        <FaSquareCheck className="w-6 h-6" />
                      ) : (
                        <PiKeyReturnBold
                          className="w-6 h-6 cursor-pointer"
                          onClick={() =>
                            openReturnBookPopup(
                              book.book || book,
                              book?.user?.email || book.email
                            )
                          }
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <h3 className="text-3xl font-medium mt-5 text-gray-500">
            No {filter === "borrowed" ? "borrowed" : "overdue"} books found!!
          </h3>
        )}
      </main>

      {returnBookPopup && (
        <ReturnBookPopup bookId={borrowedBookId} email={email} />
      )}
    </>
  );
};

export default Catalog;
