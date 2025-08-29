import React, { useEffect, useMemo, useState } from "react";
import {
  BookA,
  Edit,
  Trash2,
  Table,
  LayoutGrid,
  Eye,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  X,
  Check,
  Calendar,
  BarChart3,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  toggleAddBookPopup,
  toggleReadBookPopup,
  toggleRecordBookPopup,
} from "../store/slices/popupSlice";
import { toast } from "react-toastify";
import {
  fetchAllBooks,
  addBook,
  updateBook,
  deleteBook,
  resetBookSlice,
} from "../store/slices/bookSlice";
import {
  fetchAllBorrowedBooks,
  resetBorrowSlice,
} from "../store/slices/borrowSlice";
import Header from "../layout/Header";
import RecordBookPopup from "../popups/RecordBookPopup";
import AddBookPopup from "../popups/AddBookPopup";
import ReadBookPopup from "../popups/ReadBookPopup";
import EditBookPopup from "../popups/EditBookPopup";
import { saveAs } from "file-saver";
import Papa from "papaparse";

/**
 * Utilities
 */
const currency = (v) => {
  const n = Number(v || 0);
  return isNaN(n) ? "$0" : `$${n}`;
};

const safeLower = (s) => (typeof s === "string" ? s.toLowerCase() : "");

/**
 * Component
 */
const BookManagement = () => {
  const dispatch = useDispatch();

  // Redux slices
  const { loading, error, message, books } = useSelector((state) => state.book);
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { addBookPopup, recordBookPopup, readBookPopup } = useSelector(
    (state) => state.popup
  );
  const {
    loading: borrowSliceLoading,
    error: borrowSliceError,
    message: borrowSliceMessage,
  } = useSelector((state) => state.borrow);

  // Local UI state
  const [readBook, setReadBook] = useState({});
  const [editBook, setEditBook] = useState(null);
  const [selectedBookId, setSelectedBookId] = useState(null);

  const [searchedKeyword, setSearchedKeyword] = useState("");
  const [filterGenre, setFilterGenre] = useState("");
  const [filterAvailability, setFilterAvailability] = useState("all"); // all | available | unavailable

  const [sortBy, setSortBy] = useState("title");
  const [sortOrder, setSortOrder] = useState("asc");

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [bookToDelete, setBookToDelete] = useState(null);

  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [selectedBooks, setSelectedBooks] = useState(new Set());
  const [viewMode, setViewMode] = useState("table"); // 'table' | 'grid'

  const [stats, setStats] = useState({
    total: 0,
    available: 0,
    borrowed: 0,
    genres: {},
  });

  /**
   * Effects: initial fetch
   */
  useEffect(() => {
    dispatch(fetchAllBooks());
    if (isAuthenticated && user?.role === "Admin") {
      dispatch(fetchAllBorrowedBooks());
    }
  }, [dispatch, isAuthenticated, user?.role]);

  /**
   * Effects: success/error toasts + refetch logic
   */
  useEffect(() => {
    if (message || borrowSliceMessage) {
      toast.success(message || borrowSliceMessage);
      dispatch(fetchAllBooks());
      if (isAuthenticated && user?.role === "Admin") {
        dispatch(fetchAllBorrowedBooks());
      }
      dispatch(resetBorrowSlice());
      dispatch(resetBookSlice());
    }
    if (error || borrowSliceError) {
      toast.error(error || borrowSliceError);
      dispatch(resetBorrowSlice());
      dispatch(resetBookSlice());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    loading,
    message,
    borrowSliceMessage,
    error,
    borrowSliceError,
    borrowSliceLoading,
    isAuthenticated,
    user?.role,
  ]);

  /**
   * Effects: statistics
   */
  useEffect(() => {
    if (!Array.isArray(books) || books.length === 0) {
      setStats({ total: 0, available: 0, borrowed: 0, genres: {} });
      return;
    }

    const available = books.filter((b) => Number(b.quantity) > 0).length;
    const borrowed = books.filter((b) => Number(b.borrowedCount) > 0).length;

    const genres = {};
    books.forEach((b) => {
      if (b.genre) {
        genres[b.genre] = (genres[b.genre] || 0) + 1;
      }
    });

    setStats({
      total: books.length,
      available,
      borrowed,
      genres,
    });
  }, [books]);

  /**
   * Derived: filters, sorting, unique genres
   */
  const uniqueGenres = useMemo(
    () => [...new Set((books || []).map((b) => b.genre).filter(Boolean))],
    [books]
  );

  const filteredAndSortedBooks = useMemo(() => {
    const arr = Array.isArray(books) ? books.slice() : [];

    const filtered = arr.filter((book) => {
      // search
      const kw = safeLower(searchedKeyword);
      const matchesSearch =
        safeLower(book.title).includes(kw) ||
        safeLower(book.author).includes(kw) ||
        (book.ISBN && safeLower(book.ISBN).includes(kw));

      // genre
      const matchesGenre = !filterGenre || book.genre === filterGenre;

      // availability
      const isAvailable = Number(book.quantity) > 0 && book.available !== false;
      const matchesAvailability =
        filterAvailability === "all" ||
        (filterAvailability === "available" && isAvailable) ||
        (filterAvailability === "unavailable" && !isAvailable);

      return matchesSearch && matchesGenre && matchesAvailability;
    });

    const sorted = filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === "availability") {
        aValue = Number(a.quantity) > 0;
        bValue = Number(b.quantity) > 0;
      }

      // fallback to empty for undefined values to avoid exceptions
      if (typeof aValue === "string") aValue = aValue.toLowerCase();
      if (typeof bValue === "string") bValue = bValue.toLowerCase();

      if (aValue === bValue) return 0;

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return sorted;
  }, [
    books,
    searchedKeyword,
    filterGenre,
    filterAvailability,
    sortBy,
    sortOrder,
  ]);

  /**
   * Helpers
   */
  const getAvailabilityStatus = (book) => {
    const isAvailable = Number(book.quantity) > 0 && book.available !== false;
    if (isAvailable) {
      return {
        status: "Available",
        color: "text-green-600",
        bgColor: "bg-green-100",
      };
    }
    return {
      status: "Not Available",
      color: "text-red-600",
      bgColor: "bg-red-100",
    };
  };

  /**
   * Popup openers
   */
  const openReadBookPopup = (id) => {
    const book = (books || []).find((b) => b._id === id);
    if (book) {
      setReadBook(book);
      dispatch(toggleReadBookPopup());
    }
  };

  const openBorrowBookPopup = (bookId) => {
    setSelectedBookId(bookId);
    dispatch(toggleRecordBookPopup());
  };

  const openEditBookPopup = (book) => {
    setEditBook(book);
  };

  /**
   * Delete flow
   */
  const handleDeleteBook = (book) => {
    setBookToDelete(book);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteBook = async () => {
    if (!bookToDelete) return;
    try {
      await dispatch(deleteBook(bookToDelete._id));
      setShowDeleteConfirm(false);
      setBookToDelete(null);
    } catch {
      toast.error("Failed to delete book");
    }
  };

  /**
   * Bulk select / delete
   */
  const handleSelectBook = (bookId) => {
    setSelectedBooks((prev) => {
      const n = new Set(prev);
      if (n.has(bookId)) n.delete(bookId);
      else n.add(bookId);
      return n;
    });
  };

  const handleSelectAll = () => {
    if (selectedBooks.size === filteredAndSortedBooks.length) {
      setSelectedBooks(new Set());
    } else {
      setSelectedBooks(new Set(filteredAndSortedBooks.map((b) => b._id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedBooks.size === 0) {
      toast.warning("Please select at least one book to delete");
      return;
    }
    const count = selectedBooks.size;
    if (!window.confirm(`Are you sure you want to delete ${count} book(s)?`))
      return;

    try {
      for (const id of selectedBooks) {
        await dispatch(deleteBook(id));
      }
      toast.success(`${count} book(s) deleted successfully`);
      setSelectedBooks(new Set());
    } catch {
      toast.error("Failed to delete some books");
    }
  };

  /**
   * CSV Export
   */
  const handleExport = async () => {
    if (!Array.isArray(books) || books.length === 0) {
      toast.info("No books to export");
      return;
    }
    setExporting(true);
    try {
      const data = books.map((book) => ({
        title: book.title ?? "",
        author: book.author ?? "",
        genre: book.genre ?? "",
        ISBN: book.ISBN ?? "",
        quantity: Number(book.quantity ?? 0),
        price: Number(book.price ?? 0),
        available: Number(book.quantity ?? 0) > 0 ? "Yes" : "No",
      }));

      const csv = Papa.unparse(data);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const filename = `books-export-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;
      saveAs(blob, filename);
      toast.success("Books exported successfully");
    } catch (e) {
      toast.error("Failed to export books");
    } finally {
      setExporting(false);
    }
  };

  /**
   * CSV Import
   */
  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async ({ data }) => {
        try {
          // normalize keys & dispatch addBook per row
          const rows = Array.isArray(data) ? data : [];
          let success = 0;
          let failed = 0;

          for (const raw of rows) {
            const payload = {
              title: raw.title || raw.Title || "",
              author: raw.author || raw.Author || "",
              genre: raw.genre || raw.Genre || "",
              ISBN: raw.ISBN || raw.isbn || "",
              quantity: Number(raw.quantity || raw.Quantity || 0),
              price: Number(raw.price || raw.Price || 0),
            };

            // Basic validation
            if (!payload.title || !payload.author) {
              failed++;
              continue;
            }

            try {
              await dispatch(addBook(payload));
              success++;
            } catch {
              failed++;
            }
          }

          toast.success(`Import complete: ${success} added, ${failed} failed.`);
          dispatch(fetchAllBooks());
        } catch {
          toast.error("Failed to import books");
        } finally {
          setImporting(false);
          // reset the input
          e.target.value = "";
        }
      },
      error: () => {
        toast.error("Failed to parse CSV");
        setImporting(false);
      },
    });
  };

  /**
   * Handlers: search/filter/sort
   */
  const handleSearch = (e) => setSearchedKeyword(safeLower(e.target.value));
  const handleFilterChange = (e) => setFilterGenre(e.target.value);
  const handleAvailabilityFilter = (e) => setFilterAvailability(e.target.value);
  const handleSortChange = (e) => setSortBy(e.target.value);
  const handleSortOrderChange = () =>
    setSortOrder((p) => (p === "asc" ? "desc" : "asc"));

  /**
   * Render
   */
  return (
    <>
      <main className="relative flex-1 p-6 pt-28">
        <Header />

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-blue-500">
            <div className="flex items-center">
              <div className="rounded-full bg-blue-100 p-3 mr-4">
                <BookA className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  Total Books
                </h3>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-green-500">
            <div className="flex items-center">
              <div className="rounded-full bg-green-100 p-3 mr-4">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Available</h3>
                <p className="text-2xl font-bold">{stats.available}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-yellow-500">
            <div className="flex items-center">
              <div className="rounded-full bg-yellow-100 p-3 mr-4">
                <Calendar className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Borrowed</h3>
                <p className="text-2xl font-bold">{stats.borrowed}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-purple-500">
            <div className="flex items-center">
              <div className="rounded-full bg-purple-100 p-3 mr-4">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Genres</h3>
                <p className="text-2xl font-bold">
                  {Object.keys(stats.genres).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sub Header */}
        <header className="flex flex-col gap-3 md:flex-row md:justify-between md:items-center mb-6">
          <h2 className="text-xl font-medium md:text-2xl md:font-semibold">
            {user && user.role === "Admin" ? "Book Management" : "My Books"}
          </h2>
          <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
            {isAuthenticated && user?.role === "Admin" && (
              <>
                <button
                  onClick={() => dispatch(toggleAddBookPopup(true))}
                  className="relative pl-14 w-full sm:w-52 flex gap-4 justify-center items-center py-2 px-4 bg-black text-white rounded-md hover:bg-gray-800 transition-colors duration-200"
                >
                  <span className="absolute left-5 flex items-center justify-center w-8 h-8 bg-white rounded-full">
                    <Plus className="w-5 h-5 text-black" />
                  </span>
                  Add Book
                </button>

                <label className="relative pl-14 w-full sm:w-52 flex gap-4 justify-center items-center py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 cursor-pointer">
                  <span className="absolute left-5 flex items-center justify-center w-8 h-8 bg-white rounded-full">
                    <Upload className="w-5 h-5 text-blue-600" />
                  </span>
                  {importing ? "Importing..." : "Import Books"}
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleImport}
                    className="hidden"
                    disabled={importing}
                  />
                </label>

                <button
                  onClick={handleExport}
                  disabled={exporting || books.length === 0}
                  className="relative pl-14 w-full sm:w-52 flex gap-4 justify-center items-center py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="absolute left-5 flex items-center justify-center w-8 h-8 bg-white rounded-full">
                    <Download className="w-5 h-5 text-green-600" />
                  </span>
                  {exporting ? "Exporting..." : "Export Books"}
                </button>
              </>
            )}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search books..."
                className="w-full sm:w-52 pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchedKeyword}
                onChange={handleSearch}
              />
            </div>
          </div>
        </header>

        {/* Bulk Actions */}
        {isAuthenticated &&
          user?.role === "Admin" &&
          selectedBooks.size > 0 && (
            <div className="mb-4 p-3 bg-blue-50 rounded-md flex items-center justify-between">
              <span className="text-blue-700">
                {selectedBooks.size} book{selectedBooks.size !== 1 ? "s" : ""}{" "}
                selected
              </span>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete Selected
              </button>
            </div>
          )}

        {/* Filters and Sorting */}
        <div className="mt-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" aria-hidden="true" />
              <label htmlFor="genre-select" className="text-sm text-gray-700">
                Genre:
              </label>
              <select
                id="genre-select"
                value={filterGenre}
                onChange={handleFilterChange}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 transition duration-150 ease-in-out"
              >
                <option value="">All Genres</option>
                {uniqueGenres.map((genre) => (
                  <option key={genre} value={genre}>
                    {genre}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label
                htmlFor="availability-select"
                className="text-sm text-gray-700"
              >
                Availability:
              </label>
              <select
                id="availability-select"
                value={filterAvailability}
                onChange={handleAvailabilityFilter}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 transition duration-150 ease-in-out"
              >
                <option value="all">All</option>
                <option value="available">Available</option>
                <option value="unavailable">Unavailable</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Sort by:</span>
              <select
                value={sortBy}
                onChange={handleSortChange}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="title">Title</option>
                <option value="author">Author</option>
                <option value="price">Price</option>
                <option value="quantity">Quantity</option>
                <option value="availability">Availability</option>
                <option value="createdAt">Date Added</option>
              </select>
              <button
                onClick={handleSortOrderChange}
                className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200"
              >
                {sortOrder === "asc" ? "↑" : "↓"}
              </button>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full">
            {/* Books info */}
            <div className="text-sm sm:text-base text-gray-500">
              {filteredAndSortedBooks.length} of {books.length} books
            </div>

            {/* Futuristic animated pill toggle */}
            <div className="relative flex w-full sm:w-auto border border-gray-300 rounded-full overflow-hidden bg-gray-100 shadow-md">
              {/* Animated sliding & glowing background */}
              <div
                className={`
        absolute top-0 left-0 h-full w-1/2 rounded-full
        transition-all duration-500 ease-in-out
        ${
          viewMode === "table"
            ? "translate-x-0 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 shadow-xl ring-2 ring-blue-400 animate-pulse"
            : "translate-x-full bg-gradient-to-r from-green-500 via-green-600 to-green-700 shadow-xl ring-2 ring-green-400 animate-pulse"
        }
      `}
              />

              {/* Table Button */}
              <button
                onClick={() => setViewMode("table")}
                className={`
        flex-1 sm:flex-none flex items-center justify-center gap-2 relative z-10
        px-4 py-2 sm:px-5 sm:py-2.5 text-sm sm:text-base font-semibold
        transition-all duration-300 ease-in-out
        rounded-full
        ${
          viewMode === "table"
            ? "text-white transform scale-105"
            : "text-gray-800 hover:text-gray-900 hover:bg-gray-300 hover:translate-x-1"
        }
      `}
              >
                <Table size={16} />
                Table
              </button>

              {/* Grid Button */}
              <button
                onClick={() => setViewMode("grid")}
                className={`
        flex-1 sm:flex-none flex items-center justify-center gap-2 relative z-10
        px-4 py-2 sm:px-5 sm:py-2.5 text-sm sm:text-base font-semibold
        transition-all duration-300 ease-in-out
        rounded-full
        ${
          viewMode === "grid"
            ? "text-white transform scale-105"
            : "text-gray-800 hover:text-gray-900 hover:bg-gray-300 hover:-translate-x-1"
        }
      `}
              >
                <LayoutGrid size={16} />
                Grid
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="mt-6 flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2">Loading books...</span>
          </div>
        )}

        {/* Table View */}
        {!loading && viewMode === "table" && books && books.length > 0 ? (
          <div className="mt-6 overflow-auto bg-white rounded-md shadow-lg">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b">
                  {isAuthenticated && user?.role === "Admin" && (
                    <th className="border px-4 py-3 text-left font-medium text-gray-700">
                      <input
                        type="checkbox"
                        checked={
                          selectedBooks.size ===
                            filteredAndSortedBooks.length &&
                          filteredAndSortedBooks.length > 0
                        }
                        onChange={handleSelectAll}
                        className="rounded text-blue-500 focus:ring-blue-400"
                      />
                    </th>
                  )}
                  <th className="border px-4 py-3 text-left font-medium text-gray-700">
                    ID
                  </th>
                  <th className="border px-4 py-3 text-left font-medium text-gray-700">
                    Title
                  </th>
                  <th className="border px-4 py-3 text-left font-medium text-gray-700">
                    Author
                  </th>
                  <th className="border px-4 py-3 text-left font-medium text-gray-700">
                    Genre
                  </th>
                  {isAuthenticated && user?.role === "Admin" && (
                    <th className="border px-4 py-3 text-left font-medium text-gray-700">
                      Quantity
                    </th>
                  )}
                  <th className="border px-4 py-3 text-left font-medium text-gray-700">
                    Price
                  </th>
                  <th className="border px-4 py-3 text-left font-medium text-gray-700">
                    Availability
                  </th>
                  <th className="border px-4 py-3 text-center font-medium text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedBooks && filteredAndSortedBooks.length > 0 ? (
                  filteredAndSortedBooks.map((book, index) => {
                    const availability = getAvailabilityStatus(book);
                    return (
                      <tr
                        key={book._id}
                        className={`${
                          index % 2 === 0 ? "bg-white" : "bg-gray-50"
                        } hover:bg-gray-100 transition-colors duration-200`}
                      >
                        {isAuthenticated && user?.role === "Admin" && (
                          <td className="border px-4 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={selectedBooks.has(book._id)}
                              onChange={() => handleSelectBook(book._id)}
                              className="rounded text-blue-500 focus:ring-blue-400"
                            />
                          </td>
                        )}
                        <td className="border px-4 py-3 text-sm text-gray-600">
                          {index + 1}
                        </td>
                        <td className="border px-4 py-3 font-medium">
                          <div className="flex flex-col">
                            <span className="font-semibold">{book.title}</span>
                            <span className="text-xs text-gray-500">
                              ISBN: {book.ISBN || "N/A"}
                            </span>
                          </div>
                        </td>
                        <td className="border px-4 py-3">{book.author}</td>
                        <td className="border px-4 py-3">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                            {book.genre || "N/A"}
                          </span>
                        </td>
                        {isAuthenticated && user?.role === "Admin" && (
                          <td className="border px-4 py-3 text-center">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                Number(book.quantity) > 0
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {Number(book.quantity) || 0}
                            </span>
                          </td>
                        )}
                        <td className="border px-4 py-3 font-medium">
                          {currency(book.price)}
                        </td>
                        <td className="border px-4 py-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${availability.bgColor} ${availability.color}`}
                          >
                            {availability.status}
                          </span>
                        </td>
                        <td className="border px-4 py-3 text-center">
                          <div className="flex justify-center items-center space-x-2">
                            <button
                              onClick={() => openReadBookPopup(book._id)}
                              className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors duration-200"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {isAuthenticated && user?.role === "Admin" && (
                              <>
                                <button
                                  onClick={() => {
                                    if (Number(book.quantity) > 0) {
                                      setSelectedBookId(book._id);
                                      dispatch(toggleRecordBookPopup(true));
                                    }
                                  }}
                                  className={`p-1 rounded transition-colors duration-200 ${
                                    Number(book.quantity) > 0
                                      ? "text-green-500 hover:text-green-700 hover:bg-green-50"
                                      : "text-gray-400 cursor-not-allowed"
                                  }`}
                                  title="Record Book"
                                  disabled={Number(book.quantity) === 0}
                                >
                                  <BookA className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => openEditBookPopup(book)}
                                  className="p-1 text-yellow-500 hover:text-yellow-700 hover:bg-yellow-50 rounded transition-colors duration-200"
                                  title="Edit Book"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteBook(book)}
                                  className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors duration-200"
                                  title="Delete Book"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={
                        isAuthenticated && user?.role === "Admin" ? 9 : 8
                      }
                      className="text-center p-8 text-gray-500"
                    >
                      <div className="flex flex-col items-center">
                        <BookA className="w-12 h-12 text-gray-300 mb-2" />
                        <p>No books found matching your criteria.</p>
                        <p className="text-sm">Try adjusting your filters.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : !loading && viewMode === "grid" && books && books.length > 0 ? (
          // Grid View
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAndSortedBooks.map((book) => {
              const availability = getAvailabilityStatus(book);
              return (
                <div
                  key={book._id}
                  className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow duration-200"
                >
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg truncate">
                        {book.title}
                      </h3>
                      {isAuthenticated && user?.role === "Admin" && (
                        <input
                          type="checkbox"
                          checked={selectedBooks.has(book._id)}
                          onChange={() => handleSelectBook(book._id)}
                          className="rounded text-blue-500 focus:ring-blue-400"
                        />
                      )}
                    </div>
                    <p className="text-gray-600 text-sm mb-2">
                      by {book.author}
                    </p>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                        {book.genre || "N/A"}
                      </span>
                      <span className="font-semibold">
                        {currency(book.price)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${availability.bgColor} ${availability.color}`}
                      >
                        {availability.status}
                      </span>
                      {isAuthenticated && user?.role === "Admin" && (
                        <span className="text-sm text-gray-500">
                          Qty: {Number(book.quantity) || 0}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <button
                        onClick={() => openReadBookPopup(book._id)}
                        className="text-blue-500 hover:text-blue-700 text-sm flex items-center"
                      >
                        <Eye className="w-4 h-4 mr-1" /> Details
                      </button>
                      {isAuthenticated && user?.role === "Admin" && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              if (Number(book.quantity) > 0) {
                                setSelectedBookId(book._id);
                                dispatch(toggleRecordBookPopup(true));
                              }
                            }}
                            className={`text-xs p-1 rounded ${
                              Number(book.quantity) > 0
                                ? "text-green-500 hover:text-green-700"
                                : "text-gray-400 cursor-not-allowed"
                            }`}
                            disabled={Number(book.quantity) === 0}
                          >
                            <BookA className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditBookPopup(book)}
                            className="text-yellow-500 hover:text-yellow-700 text-xs p-1 rounded"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteBook(book)}
                            className="text-red-500 hover:text-red-700 text-xs p-1 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          !loading && (
            <div className="mt-6 text-center p-8">
              <div className="flex flex-col items-center">
                <BookA className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No books available
                </h3>
                <p className="text-gray-500">
                  {isAuthenticated && user?.role === "Admin"
                    ? "Start by adding some books to your library."
                    : "No books are currently available in the library."}
                </p>
                {isAuthenticated && user?.role === "Admin" && (
                  <button
                    onClick={() => dispatch(toggleAddBookPopup())}
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200"
                  >
                    Add Your First Book
                  </button>
                )}
              </div>
            </div>
          )
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && bookToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold">Confirm Delete</h3>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setBookToDelete(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete "{bookToDelete.title}"? This
                action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setBookToDelete(null);
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteBook}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors duration-200"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Record Book Popup */}
        {recordBookPopup && selectedBookId && (
          <RecordBookPopup
            bookId={selectedBookId}
            onClose={() => {
              setSelectedBookId(null);
              dispatch(toggleRecordBookPopup(false));
            }}
          />
        )}

        {/* Add Book Popup */}
        {addBookPopup && (
          <AddBookPopup
            onClose={() => {
              dispatch(toggleAddBookPopup(false));
            }}
          />
        )}

        {/* Read Book Popup */}
        {readBookPopup && readBook?._id && (
          <ReadBookPopup
            book={readBook}
            onClose={() => {
              setReadBook({});
              dispatch(toggleReadBookPopup(false));
            }}
          />
        )}

        {/* Edit Book Popup (local control) */}
        {editBook && (
          <EditBookPopup
            book={editBook}
            onClose={() => {
              setEditBook(null);
            }}
          />
        )}
      </main>
    </>
  );
};

export default BookManagement;
