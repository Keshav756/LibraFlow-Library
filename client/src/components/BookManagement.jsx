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
  Download,
  Upload,
  X,
  Check,
  Calendar,
  BarChart3,
  ChevronDown,
  SlidersHorizontal,
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
} from "../store/slices/bookSlice";
import { fetchAllBorrowedBooks } from "../store/slices/borrowSlice";
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
  return Number.isFinite(n) ? `₹${n}` : "₹0";
};

const safeLower = (s) => (typeof s === "string" ? s.toLowerCase() : "");

/**
 * Component
 */
const BookManagement = () => {
  const dispatch = useDispatch();

  // Redux slices
  const {
    loading: booksLoading,
    error,
    message,
    books = [],
  } = useSelector((state) => state.book);
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { addBookPopup, recordBookPopup, readBookPopup } = useSelector(
    (state) => state.popup
  );
  const { error: borrowSliceError, message: borrowSliceMessage } = useSelector(
    (state) => state.borrow
  );

  // Local UI state
  const [readBook, setReadBook] = useState({});
  const [editBook, setEditBook] = useState(null);

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
  const [showMobileFilters, setShowMobileFilters] = useState(false);

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
    // Optional: also load borrowed list for admins who land here directly
    if (isAuthenticated && user?.role === "Admin") {
      dispatch(fetchAllBorrowedBooks());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  /**
   * Effects: fetch borrowed books when auth/admin state changes
   */
  useEffect(() => {
    if (isAuthenticated && user?.role === "Admin") {
      dispatch(fetchAllBorrowedBooks());
    }
  }, [dispatch, isAuthenticated, user?.role]);

  /**
   * Effects: success/error toasts + slice resets
   */
  useEffect(() => {
    if (message) toast.success(message);
    if (borrowSliceMessage) toast.success(borrowSliceMessage);
    if (error) toast.error(error);
    if (borrowSliceError) toast.error(borrowSliceError);
  }, [message, borrowSliceMessage, error, borrowSliceError, toast]);

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
      if (b?.genre) {
        genres[b.genre] = (genres[b.genre] || 0) + 1;
      }
    });

    setStats({ total: books.length, available, borrowed, genres });
  }, [books]);

  /**
   * Derived: filters, sorting, unique genres
   */
  const uniqueGenres = useMemo(
    () => [...new Set((books || []).map((b) => b?.genre).filter(Boolean))],
    [books]
  );

  // Improved sorting helper to correctly compare numbers/dates/strings
  const compareValues = (a, b, key) => {
    let av = a?.[key];
    let bv = b?.[key];

    // availability is derived
    if (key === "availability") {
      av = Number(a?.quantity) > 0;
      bv = Number(b?.quantity) > 0;
    }

    // try numeric comparison
    const na = Number(av);
    const nb = Number(bv);
    if (!Number.isNaN(na) && !Number.isNaN(nb)) {
      return na - nb;
    }

    // try date
    const da = Date.parse(av);
    const db = Date.parse(bv);
    if (!Number.isNaN(da) && !Number.isNaN(db)) {
      return da - db;
    }

    // fallback string
    av = typeof av === "string" ? av.toLowerCase() : String(av || "");
    bv = typeof bv === "string" ? bv.toLowerCase() : String(bv || "");
    if (av === bv) return 0;
    return av > bv ? 1 : -1;
  };

  const filteredAndSortedBooks = useMemo(() => {
    const arr = Array.isArray(books) ? books.slice() : [];

    const kw = safeLower(searchedKeyword);

    const filtered = arr.filter((book) => {
      const matchesSearch =
        safeLower(book?.title).includes(kw) ||
        safeLower(book?.author).includes(kw) ||
        (book?.ISBN && safeLower(book.ISBN).includes(kw));

      const matchesGenre = !filterGenre || book?.genre === filterGenre;

      const isAvailable =
        Number(book?.quantity) > 0 && book?.available !== false;
      const matchesAvailability =
        filterAvailability === "all" ||
        (filterAvailability === "available" && isAvailable) ||
        (filterAvailability === "unavailable" && !isAvailable);

      return matchesSearch && matchesGenre && matchesAvailability;
    });

    filtered.sort((a, b) => {
      const cmp = compareValues(a, b, sortBy);
      return sortOrder === "asc" ? cmp : -cmp;
    });

    return filtered;
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
    const isAvailable = Number(book?.quantity) > 0 && book?.available !== false;
    if (isAvailable)
      return {
        status: "Available",
        color: "text-green-600",
        bgColor: "bg-green-100",
      };
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
    const book = (books || []).find((b) => b?._id === id);
    if (book) {
      setReadBook(book);
      dispatch(toggleReadBookPopup(true));
    }
  };

  const openBorrowBookPopup = (bookId) => {
    const book = (books || []).find((b) => b?._id === bookId);
    if (book) {
      // rely on popup slice to provide selectedBook to popup
      dispatch(toggleRecordBookPopup({ open: true, book }));
    }
  };

  const openEditBookPopup = (book) => setEditBook(book);

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
      dispatch(fetchAllBooks());
      setSelectedBooks(new Set());
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
    if (selectedBooks.size === filteredAndSortedBooks.length)
      setSelectedBooks(new Set());
    else setSelectedBooks(new Set(filteredAndSortedBooks.map((b) => b._id)));
  };

  const handleBulkDelete = async () => {
    if (selectedBooks.size === 0)
      return toast.warning("Please select at least one book to delete");
    const count = selectedBooks.size;
    if (!window.confirm(`Are you sure you want to delete ${count} book(s)?`))
      return;

    try {
      // Use Promise.all for better performance
      await Promise.all(
        Array.from(selectedBooks).map((id) => dispatch(deleteBook(id)))
      );
      toast.success(`${count} book(s) deleted successfully`);
      setSelectedBooks(new Set());
      dispatch(fetchAllBooks());
    } catch (error) {
      // More robust error handling
      const errorMessage =
        error?.message || error?.toString() || "Failed to delete some books";
      toast.error(errorMessage);
    }
  };

  /**
   * CSV Export
   */
  const handleExport = async () => {
    if (!Array.isArray(books) || books.length === 0)
      return toast.info("No books to export");
    setExporting(true);
    try {
      const data = books.map((book) => ({
        title: book?.title ?? "",
        author: book?.author ?? "",
        genre: book?.genre ?? "",
        ISBN: book?.ISBN ?? "",
        quantity: Number(book?.quantity ?? 0),
        price: Number(book?.price ?? 0),
        available: Number(book?.quantity ?? 0) > 0 ? "Yes" : "No",
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

            if (!payload.title || !payload.author) {
              failed++;
              continue;
            }

            try {
              // eslint-disable-next-line no-await-in-loop
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
          e.target.value = ""; // reset
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
  const handleSearch = (e) => setSearchedKeyword(e.target.value);
  const handleFilterChange = (e) => setFilterGenre(e.target.value);
  const handleAvailabilityFilter = (e) => setFilterAvailability(e.target.value);
  const handleSortChange = (e) => setSortBy(e.target.value);
  const handleSortOrderChange = () =>
    setSortOrder((p) => (p === "asc" ? "desc" : "asc"));

  /**
   * Clear all filters
   */
  const clearAllFilters = () => {
    setSearchedKeyword("");
    setFilterGenre("");
    setFilterAvailability("all");
    setSortBy("title");
    setSortOrder("asc");
    setShowMobileFilters(false);
  };

  /**
   * Render
   */
  const showSpinner = booksLoading && books.length === 0; // prevents permanent spinner if slice forgets to turn loading off

  return (
    <>
      <main className="relative flex-1 p-4 sm:p-6 pt-24 sm:pt-28">
        <Header />

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
                  disabled={exporting || (books?.length ?? 0) === 0}
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

        {/* Mobile Filter Toggle */}
        <div className="lg:hidden mb-4">
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="flex items-center justify-center w-full py-2 px-4 bg-white border border-gray-300 rounded-md shadow-sm"
          >
            <SlidersHorizontal className="w-5 h-5 mr-2" />
            Filters & Sorting
            <ChevronDown
              className={`w-5 h-5 ml-2 transition-transform ${
                showMobileFilters ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>

        {/* Filters and Sorting */}
        <div
          className={`${
            showMobileFilters ? "block" : "hidden"
          } lg:flex mt-6 flex-col lg:flex-row gap-4 items-center justify-between`}
        >
          <div className="flex flex-col lg:flex-row gap-4 w-full lg:w-auto">
            <div className="flex flex-col sm:flex-row gap-4 w-full">
              <div className="flex flex-col w-full sm:w-auto">
                <label
                  htmlFor="genre-select"
                  className="text-sm text-gray-700 mb-1"
                >
                  Genre:
                </label>
                <select
                  id="genre-select"
                  value={filterGenre}
                  onChange={handleFilterChange}
                  className="w-full sm:w-48 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Genres</option>
                  {uniqueGenres.map((genre) => (
                    <option key={genre} value={genre}>
                      {genre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col w-full sm:w-auto">
                <label
                  htmlFor="availability-select"
                  className="text-sm text-gray-700 mb-1"
                >
                  Availability:
                </label>
                <select
                  id="availability-select"
                  value={filterAvailability}
                  onChange={handleAvailabilityFilter}
                  className="w-full sm:w-48 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All</option>
                  <option value="available">Available</option>
                  <option value="unavailable">Unavailable</option>
                </select>
              </div>

              <div className="flex flex-col w-full sm:w-auto">
                <label className="text-sm text-gray-700 mb-1">Sort by:</label>
                <div className="flex">
                  <select
                    value={sortBy}
                    onChange={handleSortChange}
                    className="w-full sm:w-32 border border-gray-300 rounded-l-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="px-3 py-2 border border-gray-300 border-l-0 rounded-r-md hover:bg-gray-50 transition-colors duration-200"
                  >
                    {sortOrder === "asc" ? "↑" : "↓"}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-end">
              <button
                onClick={clearAllFilters}
                className="px-3 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors duration-200"
              >
                Clear Filters
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full lg:w-auto mt-4 lg:mt-0">
            {/* Books info */}
            <div className="text-sm text-gray-500">
              {filteredAndSortedBooks.length} of {(books || []).length} books
            </div>

            {/* View toggle */}
            <div className="relative flex w-full sm:w-auto border border-gray-300 rounded-full overflow-hidden bg-gray-100 shadow-md">
              <div
                className={`absolute top-0 left-0 h-full w-1/2 rounded-full transition-all duration-500 ease-in-out ${
                  viewMode === "table"
                    ? "translate-x-0 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 shadow-xl ring-2 ring-blue-400"
                    : "translate-x-full bg-gradient-to-r from-green-500 via-green-600 to-green-700 shadow-xl ring-2 ring-green-400"
                }`}
              />

              <button
                onClick={() => setViewMode("table")}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 relative z-10 px-4 py-2 sm:px-5 sm:py-2.5 text-sm sm:text-base font-semibold transition-all duration-300 ease-in-out rounded-full ${
                  viewMode === "table"
                    ? "text-white"
                    : "text-gray-800 hover:text-gray-900"
                }`}
              >
                <Table size={16} />
                <span className="hidden sm:inline">Table</span>
              </button>

              <button
                onClick={() => setViewMode("grid")}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 relative z-10 px-4 py-2 sm:px-5 sm:py-2.5 text-sm sm:text-base font-semibold transition-all duration-300 ease-in-out rounded-full ${
                  viewMode === "grid"
                    ? "text-white"
                    : "text-gray-800 hover:text-gray-900"
                }`}
              >
                <LayoutGrid size={16} />
                <span className="hidden sm:inline">Grid</span>
              </button>
            </div>
          </div>
        </div>

        {/* Loading State — only when we have no books yet */}
        {showSpinner && (
          <div className="mt-6 flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            <span className="ml-2">Loading books...</span>
          </div>
        )}

        {/* Table View */}
        {viewMode === "table" && (books || []).length > 0 ? (
          <div className="mt-6 overflow-auto bg-white rounded-md shadow-lg">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b">
                  {isAuthenticated && user?.role === "Admin" && (
                    <th className="border px-2 py-2 sm:px-4 sm:py-3 text-left font-medium text-gray-700">
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
                  <th className="border px-2 py-2 sm:px-4 sm:py-3 text-left font-medium text-gray-700">
                    #
                  </th>
                  <th className="border px-2 py-2 sm:px-4 sm:py-3 text-left font-medium text-gray-700">
                    Title
                  </th>
                  <th className="border px-2 py-2 sm:px-4 sm:py-3 text-left font-medium text-gray-700">
                    Author
                  </th>
                  <th className="border px-2 py-2 sm:px-4 sm:py-3 text-left font-medium text-gray-700 hidden sm:table-cell">
                    Genre
                  </th>
                  {isAuthenticated && user?.role === "Admin" && (
                    <th className="border px-2 py-2 sm:px-4 sm:py-3 text-left font-medium text-gray-700 hidden md:table-cell">
                      Quantity
                    </th>
                  )}
                  <th className="border px-2 py-2 sm:px-4 sm:py-3 text-left font-medium text-gray-700 hidden md:table-cell">
                    Price
                  </th>
                  <th className="border px-2 py-2 sm:px-4 sm:py-3 text-left font-medium text-gray-700">
                    Availability
                  </th>
                  <th className="border px-2 py-2 sm:px-4 sm:py-3 text-center font-medium text-gray-700">
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
                        key={book?._id || index}
                        className={`${
                          index % 2 === 0 ? "bg-white" : "bg-gray-50"
                        } hover:bg-gray-100 transition-colors duration-200`}
                      >
                        {isAuthenticated && user?.role === "Admin" && (
                          <td className="border px-2 py-2 sm:px-4 sm:py-3 text-center">
                            <input
                              type="checkbox"
                              checked={selectedBooks.has(book._id)}
                              onChange={() => handleSelectBook(book._id)}
                              className="rounded text-blue-500 focus:ring-blue-400"
                            />
                          </td>
                        )}
                        <td className="border px-2 py-2 sm:px-4 sm:py-3 text-sm text-gray-600">
                          {index + 1}
                        </td>
                        <td className="border px-2 py-2 sm:px-4 sm:py-3 font-medium">
                          <div className="flex flex-col">
                            <span className="font-semibold text-sm sm:text-base">
                              {book?.title}
                            </span>
                            <span className="text-xs text-gray-500">
                              ISBN: {book?.ISBN || "N/A"}
                            </span>
                          </div>
                        </td>
                        <td className="border px-2 py-2 sm:px-4 sm:py-3 text-sm sm:text-base">
                          {book?.author}
                        </td>
                        <td className="border px-2 py-2 sm:px-4 sm:py-3 hidden sm:table-cell">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                            {book?.genre || "N/A"}
                          </span>
                        </td>
                        {isAuthenticated && user?.role === "Admin" && (
                          <td className="border px-2 py-2 sm:px-4 sm:py-3 text-center hidden md:table-cell">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                Number(book?.quantity) > 0
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {Number(book?.quantity) || 0}
                            </span>
                          </td>
                        )}
                        <td className="border px-2 py-2 sm:px-4 sm:py-3 font-medium hidden md:table-cell">
                          {currency(book?.price)}
                        </td>
                        <td className="border px-2 py-2 sm:px-4 sm:py-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${availability.bgColor} ${availability.color}`}
                          >
                            {availability.status}
                          </span>
                        </td>
                        <td className="border px-2 py-2 sm:px-4 sm:py-3 text-center">
                          <div className="flex justify-center items-center space-x-1 sm:space-x-2">
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
                                    if (Number(book?.quantity) > 0)
                                      openBorrowBookPopup(book._id);
                                  }}
                                  className={`p-1 rounded transition-colors duration-200 ${
                                    Number(book?.quantity) > 0
                                      ? "text-green-500 hover:text-green-700 hover:bg-green-50"
                                      : "text-gray-400 cursor-not-allowed"
                                  }`}
                                  title="Record Book"
                                  disabled={Number(book?.quantity) === 0}
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
        ) : viewMode === "grid" && (books || []).length > 0 ? (
          // Grid View
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredAndSortedBooks.map((book, index) => {
              const availability = getAvailabilityStatus(book);
              return (
                <div
                  key={book?._id || index}
                  className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow duration-200"
                >
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-base sm:text-lg truncate">
                        {book?.title}
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
                      by {book?.author}
                    </p>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                        {book?.genre || "N/A"}
                      </span>
                      <span className="font-semibold text-sm sm:text-base">
                        {currency(book?.price)}
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
                          Qty: {Number(book?.quantity) || 0}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <button
                        onClick={() => openReadBookPopup(book._id)}
                        className="text-blue-500 hover:text-blue-700 text-sm flex items-center"
                      >
                        <Eye className="w-4 h-4 mr-1" />{" "}
                        <span className="hidden sm:inline">Details</span>
                      </button>
                      {isAuthenticated && user?.role === "Admin" && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              if (Number(book?.quantity) > 0)
                                openBorrowBookPopup(book._id);
                            }}
                            className={`text-xs p-1 rounded ${
                              Number(book?.quantity) > 0
                                ? "text-green-500 hover:text-green-700"
                                : "text-gray-400 cursor-not-allowed"
                            }`}
                            disabled={Number(book?.quantity) === 0}
                            title="Record Book"
                          >
                            <BookA className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditBookPopup(book)}
                            className="text-yellow-500 hover:text-yellow-700 text-xs p-1 rounded"
                            title="Edit Book"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteBook(book)}
                            className="text-red-500 hover:text-red-700 text-xs p-1 rounded"
                            title="Delete Book"
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
          !showSpinner && (
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
                    onClick={() => dispatch(toggleAddBookPopup(true))}
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
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
                Are you sure you want to delete "{bookToDelete?.title}"? This
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
        {recordBookPopup && <RecordBookPopup />}

        {/* Add Book Popup */}
        {addBookPopup && (
          <AddBookPopup
            onClose={() => {
              dispatch(toggleAddBookPopup(false));
              dispatch(fetchAllBooks());
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
              dispatch(fetchAllBooks());
            }}
          />
        )}
      </main>
    </>
  );
};

export default BookManagement;
