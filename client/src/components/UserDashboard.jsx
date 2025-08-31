// UserDashboard.jsx
import React, { useEffect, useMemo, useState, useCallback, lazy, Suspense } from "react";
import logo_with_title from "../assets/logo-with-title-black.png";
import logo from "../assets/black-logo.png";
import returnIcon from "../assets/redo.png";
import browseIcon from "../assets/pointing.png";
import bookIcon from "../assets/book-square.png";
import { Pie, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  ArcElement,
  Filler,
} from "chart.js";
import { useSelector, useDispatch } from "react-redux";
import Header from "../layout/Header";
import { fetchUserBorrowedBooks } from "../store/slices/borrowSlice";
import { saveAs } from "file-saver";
import Papa from "papaparse";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  ArcElement,
  Filler
);

// Interactive BookCard component with 3D book effect
const BookCard = ({
  title,
  value,
  subtitle,
  icon,
  colorClass = "from-[#151619] to-[#3D3E3E]",
}) => (
  <div className="relative h-48 perspective-1000 group cursor-pointer overflow-hidden">
    {/* 3D Book Effect */}
    <div 
      className={`absolute inset-0 rounded-lg shadow-xl transform transition-all duration-500 
      group-hover:rotate-y-[-25deg] group-hover:scale-105 overflow-hidden`}
    >
      {/* Book spine */}
      <div className={`absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r ${colorClass} 
        transform-style-3d shadow-inner z-10 overflow-hidden`}>
        <div className="absolute inset-0 bg-black bg-opacity-20 overflow-hidden"></div>
      </div>
      
      {/* Book cover */}
      <div className={`absolute left-8 right-0 top-0 bottom-0 bg-gradient-to-br ${colorClass} p-6 
        flex flex-col justify-between transform-style-3d overflow-hidden`}>
        
        {/* Book title and value */}
        <div className="flex justify-between items-start overflow-hidden">
          <div className="overflow-hidden">
            <h3 className="text-lg font-bold text-white mb-1 overflow-hidden">{title}</h3>
            <p className="text-4xl font-extrabold text-white tracking-tight overflow-hidden">
              {Number.isFinite(value) ? value : 0}
            </p>
          </div>
          
          {/* Icon with floating animation */}
          <div className="w-16 h-16 rounded-full bg-white bg-opacity-20 p-3 animate-float overflow-hidden">
            {icon}
          </div>
        </div>
        
        {/* Subtitle */}
        {subtitle && (
          <p className="text-sm text-white text-opacity-80 mt-2 overflow-hidden">{subtitle}</p>
        )}
        
        {/* Decorative elements */}
        <div className="absolute bottom-3 left-3 w-12 h-1 bg-white bg-opacity-30 rounded-full overflow-hidden"></div>
        <div className="absolute bottom-6 left-3 w-8 h-1 bg-white bg-opacity-20 rounded-full overflow-hidden"></div>
        
        {/* Interactive particles */}
        <div className="absolute top-0 right-0 w-20 h-20 bg-white opacity-5 rounded-full blur-xl 
          group-hover:scale-150 transition-all duration-700 group-hover:opacity-10 overflow-hidden"></div>
        <div className="absolute bottom-0 left-10 w-16 h-16 bg-white opacity-5 rounded-full blur-xl 
          group-hover:scale-150 transition-all duration-700 delay-100 group-hover:opacity-10 overflow-hidden"></div>
      </div>
    </div>
    
    {/* Interactive hover effect - page flip animation */}
    <div className="absolute top-0 right-0 bottom-0 w-1/2 bg-white bg-opacity-5 
      transform origin-left scale-y-100 scale-x-0 group-hover:scale-x-100 
      transition-transform duration-500 rounded-r-lg overflow-hidden">
    </div>
  </div>
);

// Backward compatibility wrapper for StatCard
const StatCard = (props) => <BookCard {...props} />;

const formatDate = (iso) => {
  if (!iso) return "-";
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(
    d.getMonth() + 1
  ).padStart(2, "0")}/${d.getFullYear()} ${String(d.getHours()).padStart(
    2,
    "0"
  )}:${String(d.getMinutes()).padStart(2, "0")}`;
};

const daysBetween = (a, b = new Date()) =>
  Math.floor((b - new Date(a)) / (1000 * 60 * 60 * 24));

const UserDashboard = () => {
  const dispatch = useDispatch();
  const { userBorrowedBooks = [] } = useSelector((state) => state.borrow || {});
  const authUser = useSelector((state) => state.auth?.user || null);

  // Local UI state
  const [search, setSearch] = useState("");
  const [genreFilter, setGenreFilter] = useState("All");
  const [onlyOverdue, setOnlyOverdue] = useState(false);
  const [sortBy, setSortBy] = useState("latest");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(6);
  const [selectedBook, setSelectedBook] = useState(null);
  const [localState, setLocalState] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("all"); // New tab state: all, borrowed, returned

  // Enhanced totals with additional stats
  const totals = useMemo(() => {
    const borrowed = userBorrowedBooks.filter((b) => !b.returnDate).length;
    const returned = userBorrowedBooks.filter((b) => !!b.returnDate).length;
    const overdue = userBorrowedBooks.filter(
      (b) => !b.returnDate && b.borrowDate && daysBetween(b.borrowDate) > 14
    ).length;
    const totalInteractions = userBorrowedBooks.length;

    // Calculate total reading days (only for returned books)
    const totalReadingDays = userBorrowedBooks
      .filter((b) => b.returnDate && b.borrowDate)
      .reduce(
        (sum, b) => sum + daysBetween(b.borrowDate, new Date(b.returnDate)),
        0
      );

    // Calculate average reading days
    const avgReadingDays =
      returned > 0 ? Math.round(totalReadingDays / returned) : 0;

    return {
      borrowed,
      returned,
      overdue,
      totalInteractions,
      totalReadingDays,
      avgReadingDays,
    };
  }, [userBorrowedBooks]);

  // Enhanced genres with counts
  const genres = useMemo(() => {
    const genreMap = new Map();
    userBorrowedBooks.forEach((rec) => {
      const g = rec?.book?.genre || "Other";
      genreMap.set(g, (genreMap.get(g) || 0) + 1);
    });

    // Convert to array and sort by count
    const genreArray = Array.from(genreMap, ([name, count]) => ({
      name,
      count,
    }));
    genreArray.sort((a, b) => b.count - a.count);

    return [{ name: "All", count: userBorrowedBooks.length }, ...genreArray];
  }, [userBorrowedBooks]);

  // Enhanced pie chart with more visual appeal
  const pieData = useMemo(
    () => ({
      labels: ["Currently Borrowed", "Returned"],
      datasets: [
        {
          data: [totals.borrowed, totals.returned],
          backgroundColor: ["#3D3E3E", "#151619"],
          hoverBackgroundColor: ["#5a5b5b", "#2a2b2b"],
          borderWidth: 2,
          borderColor: "#fff",
          hoverOffset: 8,
        },
      ],
    }),
    [totals.borrowed, totals.returned]
  );

  // Enhanced line chart with better visuals
  const lineData = useMemo(() => {
    const days = [];
    const counts = [];

    for (let i = 13; i >= 0; i--) {
      const day = new Date();
      day.setDate(day.getDate() - i);
      days.push(
        `${String(day.getDate()).padStart(2, "0")}/${String(
          day.getMonth() + 1
        ).padStart(2, "0")}`
      );

      const count = userBorrowedBooks.filter((b) => {
        if (!b.borrowDate) return false;
        const bd = new Date(b.borrowDate);
        return (
          bd.getDate() === day.getDate() &&
          bd.getMonth() === day.getMonth() &&
          bd.getFullYear() === day.getFullYear()
        );
      }).length;

      counts.push(count);
    }

    return {
      labels: days,
      datasets: [
        {
          label: "Daily Borrows",
          data: counts,
          borderColor: "#151619",
          backgroundColor: (context) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, 200);
            gradient.addColorStop(0, "rgba(21, 22, 25, 0.3)");
            gradient.addColorStop(1, "rgba(21, 22, 25, 0.0)");
            return gradient;
          },
          tension: 0.4,
          fill: true,
          pointBackgroundColor: "#151619",
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    };
  }, [userBorrowedBooks]);

  // Enhanced filtering with tab support
  const filtered = useMemo(() => {
    let arr = userBorrowedBooks.slice();

    // Apply optimistic local state
    arr = arr.map((r) => {
      if (localState[r._id]) {
        return { ...r, ...localState[r._id] };
      }
      return r;
    });

    // Apply tab filter
    if (activeTab === "borrowed") {
      arr = arr.filter((r) => !r.returnDate);
    } else if (activeTab === "returned") {
      arr = arr.filter((r) => !!r.returnDate);
    }

    // Apply search filter
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      arr = arr.filter((r) => {
        const title =
          r?.book?.title?.toLowerCase() || r.bookName?.toLowerCase?.() || "";
        const email =
          r?.user?.email?.toLowerCase?.() || r.email?.toLowerCase?.() || "";
        return (
          title.includes(q) ||
          email.includes(q) ||
          (r.book?.isbn || "").toLowerCase().includes(q)
        );
      });
    }

    // Apply genre filter
    if (genreFilter !== "All") {
      arr = arr.filter((r) => (r?.book?.genre || "Other") === genreFilter);
    }

    // Apply overdue filter
    if (onlyOverdue) {
      arr = arr.filter(
        (r) => !r.returnDate && r.borrowDate && daysBetween(r.borrowDate) > 14
      );
    }

    // Apply sorting
    switch (sortBy) {
      case "oldest":
        arr.sort(
          (a, b) =>
            new Date(a.borrowDate || a.createdAt) -
            new Date(b.borrowDate || b.createdAt)
        );
        break;
      case "title":
        arr.sort((a, b) =>
          (a.book?.title || "").localeCompare(b.book?.title || "")
        );
        break;
      case "dueSoon":
        arr.sort((a, b) => {
          const da = a.dueDate ? new Date(a.dueDate) : new Date(9999, 0, 1);
          const db = b.dueDate ? new Date(b.dueDate) : new Date(9999, 0, 1);
          return da - db;
        });
        break;
      default: // latest
        arr.sort(
          (a, b) =>
            new Date(b.borrowDate || b.createdAt) -
            new Date(a.borrowDate || a.createdAt)
        );
    }

    return arr;
  }, [
    userBorrowedBooks,
    search,
    genreFilter,
    onlyOverdue,
    sortBy,
    localState,
    activeTab,
  ]);

  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const paginated = useMemo(() => {
    const start = (page - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, page, perPage]);

  // Enhanced recent activity with icons
  const recentActivity = useMemo(() => {
    return userBorrowedBooks
      .slice()
      .sort(
        (a, b) =>
          new Date(b.borrowDate || b.createdAt) -
          new Date(a.borrowDate || a.createdAt)
      )
      .slice(0, 6);
  }, [userBorrowedBooks]);

  // Enhanced CSV export with more data
  const handleExportCSV = useCallback(() => {
    if (!userBorrowedBooks || userBorrowedBooks.length === 0) return;
    const data = userBorrowedBooks.map((r) => ({
      id: r._id,
      title: r.book?.title || r.bookName || "Untitled",
      isbn: r.book?.ISBN || r.book?.isbn || "",
      genre: r.book?.genre || "Other",
      borrowDate: r.borrowDate || r.createdAt || "",
      returnDate: r.returnDate || "",
      dueDate: r.dueDate || "",
      status: r.returnDate ? "Returned" : "Borrowed",
      price: r.price ?? 0,
      fine: r.fine ?? 0,
      daysBorrowed: r.returnDate
        ? daysBetween(r.borrowDate, new Date(r.returnDate))
        : daysBetween(r.borrowDate),
    }));
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(
      blob,
      `borrowed-books-${authUser?.email || "user"}-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`
    );
  }, [userBorrowedBooks, authUser]);

  // Enhanced mark as returned with confirmation
  const markReturnedLocally = async (recordId) => {
    if (!window.confirm("Are you sure you want to mark this book as returned?"))
      return;

    // Optimistic UI update
    setLocalState((s) => ({
      ...s,
      [recordId]: { returnDate: new Date().toISOString() },
    }));

    // TODO: Add actual API call here
  };

  // Enhanced refresh with visual feedback
  const onRefresh = async () => {
    if (!authUser?.email) return;

    setRefreshing(true);
    try {
      await dispatch(fetchUserBorrowedBooks(authUser.email));
    } catch (err) {
      console.error("Refresh failed:", err);
    } finally {
      setRefreshing(false);
    }
   };

  // Book detail modal
  const openBookDetail = (record) => setSelectedBook(record);
  const closeBookDetail = () => setSelectedBook(null);

  // Loading indicator for async operations
  const LoadingSpinner = () => (
    <div className="flex justify-center items-center h-20">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#3D3E3E]"></div>
    </div>
  );

  return (
    <main className="relative flex-1 p-6 pt-28 bg-gray-50 min-h-screen">
      <Header />

      <div className="space-y-6 overflow-hidden">
        {/* Top header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#3D3E3E]">
              Welcome back{authUser ? `, ${authUser.name}` : ""}
            </h1>
            <p className="text-sm text-[#151619] mt-1">
              Personal summary of your borrowing activity
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm hover:shadow-lg transition disabled:opacity-50"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v6h6M20 20v-6h-6"
                />
              </svg>
              <span className="text-sm text-[#3D3E3E]">
                {refreshing ? "Refreshing..." : "Refresh"}
              </span>
            </button>

            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#151619] text-white rounded-md shadow-sm hover:opacity-90 transition"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Export CSV
            </button>
          </div>
        </div>

        {/* Enhanced stat cards with 3D book effect */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <BookCard
            title="Currently Borrowed"
            value={totals?.borrowed ?? 0}
            subtitle="Books you still have"
            colorClass="from-[#151619] to-[#3D3E3E]"
            icon={
              <img src={browseIcon} alt="browse" className="w-full h-full object-contain" />
            }
          />
          <BookCard
            title="Returned"
            value={totals?.returned ?? 0}
            subtitle="Books you've returned"
            colorClass="from-[#3D3E3E] to-[#151619]"
            icon={
              <img src={returnIcon} alt="return" className="w-full h-full object-contain" />
            }
          />
          <BookCard
            title="Overdue"
            value={totals?.overdue ?? 0}
            subtitle="Borrowed > 60 days"
            colorClass="from-red-700 to-red-500"
            icon={
              <img src={bookIcon} alt="book" className="w-full h-full object-contain" />
            }
          />
          <BookCard
            title="Avg. Reading Days"
            value={totals?.avgReadingDays ?? 0}
            subtitle="Across all returned books"
            colorClass="from-yellow-700 to-yellow-500"
            icon={
              <img src={bookIcon} alt="book" className="w-full h-full object-contain" />
            }
          />
        </section>

        {/* Enhanced charts section */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
          {/* Enhanced pie chart */}
          <article className="col-span-1 bg-white p-5 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden animate-fade-in-up">
            <h3 className="text-lg font-semibold mb-4 text-[#3D3E3E] overflow-hidden">
              Borrowed vs Returned
            </h3>
            <div className="flex items-center justify-between gap-6 overflow-hidden">
              <div className="w-44 h-44 mx-auto overflow-hidden">
                <Pie
                  data={pieData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: "bottom",
                        labels: {
                          usePointStyle: true,
                          padding: 20,
                        },
                      },
                    },
                  }}
                />
              </div>
            </div>
            <div className="mt-4 text-center">
              <div className="grid grid-cols-2 gap-y-3 items-center text-[#151619]">
                <span className="text-sm font-medium">Currently Borrowed:</span>
                <span className="text-base font-semibold text-right">
                  {totals.borrowed}
                </span>

                <span className="text-sm font-medium">Returned:</span>
                <span className="text-base font-semibold text-right">
                  {totals.returned}
                </span>
              </div>
            </div>
          </article>

          {/* Enhanced trend line */}
          <article className="col-span-1 lg:col-span-2 bg-white p-5 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden animate-fade-in-up">
            <header className="flex justify-between items-center mb-3 overflow-hidden">
              <h3 className="text-lg font-semibold text-[#3D3E3E] overflow-hidden">
                Borrowing Trend (last 14 days)
              </h3>
              <span className="text-sm text-gray-500 overflow-hidden">Recent activity</span>
            </header>
            <div className="h-40 overflow-hidden">
              <Line
                data={lineData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  scales: {
                    x: {
                      grid: { display: false },
                      ticks: { color: "#3D3E3E" },
                    },
                    y: {
                      beginAtZero: true,
                      ticks: { color: "#3D3E3E" },
                    },
                  },
                }}
              />
            </div>
          </article>
        </section>

        {/* Enhanced controls & list with tabs */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
          {/* Enhanced controls */}
          <article className="col-span-1 bg-white p-5 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
            <h4 className="font-semibold mb-3 text-[#3D3E3E] flex items-center gap-2 overflow-hidden">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Search & Filters
            </h4>

            {/* Tab filters */}
            <div className="flex mb-4 border-b overflow-hidden">
              <button
                className={`px-4 py-2 text-sm font-medium overflow-hidden ${
                  activeTab === "all"
                    ? "border-b-2 border-[#3D3E3E] text-[#3D3E3E]"
                    : "text-gray-500"
                }`}
                onClick={() => setActiveTab("all")}
              >
                All ({userBorrowedBooks.length})
              </button>
              <button
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === "borrowed"
                    ? "border-b-2 border-[#3D3E3E] text-[#3D3E3E]"
                    : "text-gray-500"
                }`}
                onClick={() => setActiveTab("borrowed")}
              >
                Borrowed ({totals.borrowed})
              </button>
              <button
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === "returned"
                    ? "border-b-2 border-[#3D3E3E] text-[#3D3E3E]"
                    : "text-gray-500"
                }`}
                onClick={() => setActiveTab("returned")}
              >
                Returned ({totals.returned})
              </button>
            </div>

            <input
              placeholder="Search by title, ISBN or email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full p-2 border border-gray-200 rounded-md mb-3 text-[#3D3E3E]"
            />

            <div className="flex gap-2 mb-3">
              <select
                value={genreFilter}
                onChange={(e) => setGenreFilter(e.target.value)}
                className="flex-1 p-2 border rounded-md"
              >
                {genres.map((g) => (
                  <option value={g.name} key={g.name}>
                    {g.name} ({g.count})
                  </option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-36 p-2 border rounded-md"
              >
                <option value="latest">Latest</option>
                <option value="oldest">Oldest</option>
                <option value="title">Title</option>
                <option value="dueSoon">Due Soon</option>
              </select>
            </div>

            <label className="inline-flex items-center gap-2 text-sm mb-4">
              <input
                type="checkbox"
                className="form-checkbox rounded text-[#3D3E3E]"
                checked={onlyOverdue}
                onChange={(e) => {
                  setOnlyOverdue(e.target.checked);
                  setPage(1);
                }}
              />
              <span>Only show overdue</span>
            </label>

            <div className="mt-4">
              <h5 className="text-sm text-gray-500 mb-2">Quick actions</h5>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSearch("");
                    setGenreFilter("All");
                    setOnlyOverdue(false);
                    setSortBy("latest");
                    setActiveTab("all");
                  }}
                  className="px-3 py-2 border rounded-md text-sm"
                >
                  Reset Filters
                </button>
                <button
                  onClick={() => {
                    setPerPage(10);
                    setPage(1);
                  }}
                  className="px-3 py-2 border rounded-md text-sm"
                >
                  Show 10
                </button>
              </div>
            </div>
          </article>

          {/* Enhanced list */}
          <article className="col-span-2 bg-white p-5 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 animate-slide-in-up">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-[#3D3E3E] flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 4v12l-4-2-4 2V4M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Your Borrowed Items
              </h4>
              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                {filtered.length} records
              </span>
            </div>

            {paginated.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 mx-auto text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <p className="mt-2">No records found with current filters</p>
                <button
                  onClick={() => {
                    setSearch("");
                    setGenreFilter("All");
                    setOnlyOverdue(false);
                    setSortBy("latest");
                    setActiveTab("all");
                  }}
                  className="mt-3 px-4 py-2 bg-[#3D3E3E] text-white rounded-md text-sm"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {paginated.map((rec) => {
                  const isReturned = !!rec.returnDate;
                  const isOverdue =
                    !isReturned &&
                    rec.borrowDate &&
                    daysBetween(rec.borrowDate) > 14;
                  const daysBorrowed = isReturned
                    ? daysBetween(rec.borrowDate, new Date(rec.returnDate))
                    : daysBetween(rec.borrowDate);

                  return (
                    <div
                      key={rec._id}
                      className="flex items-center gap-4 border-b last:border-none pb-3 transition-all hover:bg-gray-50 p-2 rounded animate-fade-in-up"
                    >
                      <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center">
                        <img src={bookIcon} alt="book" className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium text-[#151619]">
                              {rec?.book?.title ||
                                rec.bookName ||
                                "Untitled Book"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {rec.book?.ISBN || rec.book?.isbn || "No ISBN"} • {rec.book?.genre || "Other"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p
                              className={`text-xs font-semibold ${
                                isReturned
                                  ? "text-green-600"
                                  : isOverdue
                                  ? "text-red-600"
                                  : "text-indigo-700"
                              }`}
                            >
                              {isReturned
                                ? "Returned"
                                : isOverdue
                                ? `Overdue (${daysBetween(rec.borrowDate)}d)`
                                : "Borrowed"}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {formatDate(rec.borrowDate || rec.createdAt)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-2 flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => openBookDetail(rec)}
                            className="px-2 py-1 text-xs border rounded-md hover:bg-gray-100 transition"
                          >
                            Details
                          </button>

                          {!isReturned && (
                            <button
                              onClick={() => markReturnedLocally(rec._id)}
                              className="px-2 py-1 text-xs bg-green-600 text-white rounded-md hover:bg-green-700 transition"
                            >
                              Mark Returned
                            </button>
                          )}

                          {isReturned && (
                            <span className="px-2 py-1 text-xs bg-gray-100 rounded-md">
                              Returned on {formatDate(rec.returnDate)}
                            </span>
                          )}

                          <span className="text-xs text-gray-400">
                              {isReturned
                                ? `Read in ${daysBorrowed} days`
                                : `Due: ${
                                    rec.dueDate ? formatDate(rec.dueDate) : "—"
                                  }`}
                            </span>
                            <span className="text-xs text-gray-400">
                              Price: ₹{rec.price?.toFixed?.(2) ?? "0.00"} • Fine: ₹{rec.fine?.toFixed?.(2) ?? "0.00"}
                            </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Enhanced pagination */}
            {filtered.length > 0 && (
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(1)}
                    disabled={page === 1}
                    className="px-2 py-1 border rounded disabled:opacity-50 text-sm"
                  >
                    First
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-2 py-1 border rounded disabled:opacity-50 text-sm"
                  >
                    Prev
                  </button>
                  <span className="px-3 text-sm">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-2 py-1 border rounded disabled:opacity-50 text-sm"
                  >
                    Next
                  </button>
                  <button
                    onClick={() => setPage(totalPages)}
                    disabled={page === totalPages}
                    className="px-2 py-1 border rounded disabled:opacity-50 text-sm"
                  >
                    Last
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-500">Per page</label>
                  <select
                    value={perPage}
                    onChange={(e) => {
                      setPerPage(Number(e.target.value));
                      setPage(1);
                    }}
                    className="p-1 border rounded text-sm"
                  >
                    <option value={6}>6</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                  </select>
                </div>
              </div>
            )}
          </article>
        </section>

        {/* Enhanced activity + branding */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <article className="col-span-2 bg-white p-5 rounded-lg shadow-md hover:shadow-lg transition-all duration-300">
            <h4 className="font-semibold mb-3 text-[#3D3E3E] flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Recent Activity
            </h4>
            {recentActivity.length === 0 ? (
              <p className="text-gray-500">No recent activity.</p>
            ) : (
              <ul className="space-y-3">
                {recentActivity.map((a, idx) => {
                  const isReturned = !!a.returnDate;
                  return (
                    <li
                      key={a._id}
                      style={{animationDelay: `${idx * 50}ms`}} className="flex items-start gap-3 p-2 rounded hover:bg-gray-50 transition animate-fade-in-up"
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                          isReturned ? "bg-green-500" : "bg-blue-500"
                        }`}
                      >
                        {isReturned ? "R" : "B"}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">
                          <strong>
                            {a.book?.title || a.bookName || "Untitled"}
                          </strong>{" "}
                          —{isReturned ? " Returned" : " Borrowed"}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatDate(a.borrowDate || a.createdAt)}
                        </p>
                      </div>
                      <div className="text-xs text-gray-400">
                        {isReturned
                          ? formatDate(a.returnDate)
                          : `Due: ${a.dueDate ? formatDate(a.dueDate) : "—"}`}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </article>

          <article className="col-span-1 bg-white p-5 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex flex-col items-center justify-center">
            <img
              src={logo_with_title}
              alt="logo"
              className="max-w-[160px] mb-4"
            />
            <p className="text-sm text-gray-500 text-center mb-4">
              Library made simple. Track your books and never lose an ISBN
              again.
            </p>
            <div className="w-full bg-gray-100 p-3 rounded-lg">
              <p className="text-xs text-gray-600 text-center">
                <strong>Reading Stats:</strong> You've spent{" "}
                {totals.totalReadingDays} days reading {totals.returned} books
              </p>
            </div>
          </article>
        </section>

        {/* Enhanced footer tip */}
        <footer className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 mt-6 flex flex-col md:flex-row justify-between items-center gap-3 text-gray-600 text-sm">
          <div>
            <span className="font-semibold">Pro Tip:</span> Return books before
            due date to avoid overdue status. You can export your history for
            records.
          </div>
          <div>Dashboard powered by LibraFlow • Made for learners</div>
        </footer>
      </div>

      {/* Enhanced Modal - Book Detail */}
      {selectedBook && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-lg overflow-hidden shadow-xl">
            <div className="p-5 border-b flex justify-between items-center">
              <h3 className="font-semibold text-lg">Book details</h3>
              <button
                onClick={closeBookDetail}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="col-span-1 flex items-center justify-center">
                <div className="w-36 h-48 bg-gray-100 rounded-md flex items-center justify-center">
                  <img src={bookIcon} alt="book-cover" className="w-12 h-12" />
                </div>
              </div>

              <div className="col-span-2">
                <h4 className="text-xl font-semibold">
                  {selectedBook.book?.title || selectedBook.bookName}
                </h4>
                <p className="text-sm text-gray-500 mb-3">
                  {selectedBook.book?.genre || "Other"} •{" "}
                  {selectedBook.book?.ISBN || selectedBook.book?.isbn || "No ISBN"}
                </p>

                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-600 text-xs">Status</p>
                    <p
                      className={`font-medium ${
                        selectedBook.returnDate
                          ? "text-green-600"
                          : "text-blue-600"
                      }`}
                    >
                      {selectedBook.returnDate ? "Returned" : "Borrowed"}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-600 text-xs">Borrowed on</p>
                    <p className="font-medium">
                      {formatDate(
                        selectedBook.borrowDate || selectedBook.createdAt
                      )}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-600 text-xs">Due date</p>
                    <p className="font-medium">
                      {selectedBook.dueDate
                        ? formatDate(selectedBook.dueDate)
                        : "—"}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-600 text-xs">Price</p>
                    <p className="font-medium">
                      ${selectedBook.price?.toFixed?.(2) ?? "0.00"}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-600 text-xs">Fine</p>
                    <p className="font-medium">
                      ${selectedBook.fine?.toFixed?.(2) ?? "0.00"}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-600 text-xs">Reading time</p>
                    <p className="font-medium">
                      {selectedBook.returnDate
                        ? `${daysBetween(
                            selectedBook.borrowDate,
                            new Date(selectedBook.returnDate)
                          )} days`
                        : `${daysBetween(selectedBook.borrowDate)} days so far`}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  {!selectedBook.returnDate && (
                    <button
                      onClick={() => {
                        if (
                          window.confirm(
                            "Are you sure you want to mark this book as returned?"
                          )
                        ) {
                          markReturnedLocally(selectedBook._id);
                          closeBookDetail();
                        }
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
                    >
                      Mark Returned
                    </button>
                  )}
                  <button
                    onClick={closeBookDetail}
                    className="px-4 py-2 border rounded-md hover:bg-gray-50 transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default UserDashboard;
