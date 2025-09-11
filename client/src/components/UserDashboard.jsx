import React, { useEffect, useMemo, useState, useCallback } from "react";
import logo_with_title from "../assets/logo-with-title-black.png";
import logo from "../assets/black-logo.png";
import returnIcon from "../assets/redo.png";
import browseIcon from "../assets/pointing.png";
import bookIcon from "../assets/book-square.png";
import { Pie, Line, Bar } from "react-chartjs-2";
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
import { fetchUserFineSummary } from "../store/slices/fineSlice";
import { saveAs } from "file-saver";
import Papa from "papaparse";
import { IndianRupee, Clock, BookOpen, CheckCircle, AlertCircle } from "lucide-react";

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

// Interactive BookCard component with 3D book effect - Tablet optimized
const BookCard = ({
  title,
  value,
  subtitle,
  icon,
  colorClass = "from-[#151619] to-[#3D3E3E]",
}) => (
  <div className="relative h-40 perspective-1000 group cursor-pointer overflow-hidden">
    {/* 3D Book Effect */}
    <div 
      className={`absolute inset-0 rounded-lg shadow-2xl transform transition-all duration-500 
      group-hover:rotate-y-[-20deg] group-hover:scale-105 overflow-hidden hover:shadow-3xl`}
    >
      {/* Book spine */}
      <div className={`absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r ${colorClass} 
        transform-style-3d shadow-inner z-10 overflow-hidden`}>
        <div className="absolute inset-0 bg-black bg-opacity-20 overflow-hidden"></div>
      </div>
      
      {/* Book cover */}
      <div className={`absolute left-6 right-0 top-0 bottom-0 bg-gradient-to-br ${colorClass} p-3
        flex flex-col justify-between transform-style-3d overflow-hidden`}>
        
        {/* Book title and value */}
        <div className="flex justify-between items-start overflow-hidden">
          <div className="overflow-hidden">
            <h3 className="text-sm font-bold text-white mb-1 overflow-hidden">
              {title}
            </h3>
            <p className="text-xl font-extrabold text-white tracking-tight overflow-hidden">
              {Number.isFinite(value) ? value : 0}
            </p>
          </div>
          
          {/* Icon with floating animation */}
          <div className="w-10 h-10 rounded-full bg-white bg-opacity-20 p-2 animate-float overflow-hidden flex items-center justify-center flex-shrink-0">
            {icon}
          </div>
        </div>
        
        {/* Subtitle */}
        {subtitle && (
          <p className="text-xs text-white text-opacity-80 mt-1 overflow-hidden">
            {subtitle}
          </p>
        )}
        
        {/* Decorative elements */}
        <div className="absolute bottom-2 left-2 w-8 h-1 bg-white bg-opacity-30 rounded-full overflow-hidden"></div>
        <div className="absolute bottom-4 left-2 w-5 h-1 bg-white bg-opacity-20 rounded-full overflow-hidden"></div>
        
        {/* Interactive particles */}
        <div className="absolute top-0 right-0 w-12 h-12 bg-white opacity-5 rounded-full blur-xl 
          group-hover:scale-150 transition-all duration-700 group-hover:opacity-10 overflow-hidden"></div>
        <div className="absolute bottom-0 left-8 w-10 h-10 bg-white opacity-5 rounded-full blur-xl 
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
  const { userSummary, loading: fineLoading } = useSelector((state) => state.fine || {});
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

  // Fetch user fine summary on component mount
  useEffect(() => {
    if (authUser?._id) {
      dispatch(fetchUserFineSummary(authUser._id));
    }
  }, [authUser, dispatch]);

  // Enhanced totals with additional stats including fine data
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

    // Calculate current borrowed book read average (days since borrowing for currently borrowed books)
    const currentDate = new Date();
    const totalCurrentBorrowedDays = userBorrowedBooks
      .filter((b) => !b.returnDate && b.borrowDate)
      .reduce(
        (sum, b) => sum + Math.max(0, daysBetween(b.borrowDate, currentDate)),
        0
      );
    
    const avgCurrentBorrowedDays = 
      borrowed > 0 ? Math.round(totalCurrentBorrowedDays / borrowed) : 0;

    // Get fine data from userSummary with proper null checks
    const totalOutstandingFines = userSummary?.summary?.totalOutstanding || 0;
    const monthlyFines = userSummary?.summary?.monthlyFines || 0;
    const currentOverdue = userSummary?.summary?.currentOverdue || 0;

    return {
      borrowed,
      returned,
      overdue,
      totalInteractions,
      totalReadingDays,
      avgReadingDays,
      avgCurrentBorrowedDays,
      totalOutstandingFines,
      monthlyFines,
      currentOverdue,
    };
  }, [userBorrowedBooks, userSummary]);

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

  // Fine analytics bar chart data
  const fineBarData = useMemo(() => {
    // Always return data structure, even when userSummary is null
    return {
      labels: ["Total Outstanding", "Monthly Fines", "Current Overdue"],
      datasets: [
        {
          label: "Amount (₹)",
          data: [
            totals.totalOutstandingFines || 0,
            totals.monthlyFines || 0,
            totals.currentOverdue || 0,
          ],
          backgroundColor: [
            "rgba(255, 99, 132, 0.6)",
            "rgba(54, 162, 235, 0.6)",
            "rgba(255, 206, 86, 0.6)",
          ],
          borderColor: [
            "rgba(255, 99, 132, 1)",
            "rgba(54, 162, 235, 1)",
            "rgba(255, 206, 86, 1)",
          ],
          borderWidth: 1,
        },
      ],
    };
  }, [totals]);

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
      await Promise.all([
        dispatch(fetchUserBorrowedBooks(authUser.email)),
        dispatch(fetchUserFineSummary(authUser._id))
      ]);
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
    <main className="relative flex-1 p-2 sm:p-4 md:p-6 pt-16 sm:pt-20 md:pt-24 lg:pt-28 bg-gray-50 min-h-screen">
      <Header />

      <div className="space-y-4 sm:space-y-6 overflow-hidden">
        {/* Top header - responsive */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#3D3E3E]">
              Welcome back{authUser ? `, ${authUser.name}` : ""}
            </h1>
            <p className="text-sm text-[#151619] mt-1">
              Personal summary of your borrowing activity
            </p>
          </div>

          <div className="flex justify-end">
            <button
              onClick={onRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-1 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-white border border-gray-300 rounded-md shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 text-xs sm:text-sm transform hover:-translate-y-0.5"
              title="Refresh dashboard data"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`w-3 h-3 sm:w-4 sm:h-4 ${refreshing ? "animate-spin" : ""}`}
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
              <span className="text-[10px] sm:text-sm text-[#3D3E3E]">
                {refreshing ? "Refreshing..." : "Refresh"}
              </span>
            </button>
          </div>
        </div>

        {/* Enhanced stat cards with 3D book effect including fine data - Tablet optimized grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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
              <AlertCircle className="w-full h-full text-white" />
            }
          />
          <BookCard
            title="Avg. Reading Days"
            value={totals?.avgReadingDays ?? 0}
            subtitle="Across all returned books"
            colorClass="from-yellow-700 to-yellow-500"
            icon={
              <Clock className="w-full h-full text-white" />
            }
          />
          <BookCard
            title="Outstanding Fines"
            value={totals?.totalOutstandingFines ? `₹${totals.totalOutstandingFines.toFixed(2)}` : "₹0.00"}
            subtitle="Total unpaid fines"
            colorClass="from-purple-700 to-purple-500"
            icon={
              <IndianRupee className="w-full h-full text-white" />
            }
          />
        </section>

        {/* Enhanced charts section with fine analytics - Tablet optimized grid */}
        <section className="flex flex-col gap-4 sm:gap-6 overflow-hidden">
          {/* Pie chart */}
          <article className="bg-white p-5 rounded-lg shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden animate-fade-in-up transform hover:-translate-y-1">
            <h3 className="text-lg font-semibold mb-4 text-[#3D3E3E] overflow-hidden">
              Borrowed vs Returned
            </h3>
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden">
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
              <div className="mt-4 md:mt-0 text-center md:text-left">
                <div className="grid grid-cols-2 gap-y-3 items-center text-[#151619]">
                  <span className="text-sm font-medium flex items-center gap-1">
                    <BookOpen className="w-4 h-4 text-blue-500" />
                    <span className="hidden xs:inline">Currently Borrowed:</span>
                    <span className="xs:hidden">Currently Borrowed:</span>
                  </span>
                  <span className="text-base font-semibold text-right">
                    {totals.borrowed}
                  </span>

                  <span className="text-sm font-medium flex items-center gap-1">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="hidden xs:inline">Returned:</span>
                    <span className="xs:hidden">Returned:</span>
                  </span>
                  <span className="text-base font-semibold text-right">
                    {totals.returned}
                  </span>
                  
                  {totals.borrowed > 0 && (
                    <>
                      <span className="text-sm font-medium flex items-center gap-1">
                        <Clock className="w-4 h-4 text-indigo-500" />
                        <span className="hidden sm:inline">Avg. Borrowed Days:</span>
                        <span className="sm:hidden">Avg. Borrowed Days:</span>
                      </span>
                      <span className="text-base font-semibold text-right">
                        {totals.avgCurrentBorrowedDays}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </article>

          {/* Enhanced trend line */}
          <article className="bg-white p-5 rounded-lg shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden animate-fade-in-up transform hover:-translate-y-1">
            <header className="flex justify-between items-center mb-3 overflow-hidden">
              <h3 className="text-lg font-semibold text-[#3D3E3E] overflow-hidden">
                Borrowing Trend (last 14 days)
              </h3>
              <span className="text-sm text-gray-500 overflow-hidden hidden md:inline">
                Recent activity
              </span>
            </header>
            <div className="h-48 overflow-hidden">
              <Line
                data={lineData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { 
                      labels: { 
                        color: "#151619" 
                      } 
                    },
                  },
                  scales: {
                    x: { 
                      ticks: { 
                        color: "#3D3E3E" 
                      } 
                    },
                    y: { 
                      ticks: { 
                        color: "#3D3E3E" 
                      } 
                    },
                  },
                }}
              />
            </div>
          </article>

          {/* Fine analytics bar chart */}
          <article className="bg-white p-5 rounded-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <h4 className="font-semibold mb-4 text-[#3D3E3E] flex items-center gap-2">
              <IndianRupee className="w-5 h-5" />
              Fine Analytics
            </h4>
            {fineBarData ? (
              <div className="h-48">
                <Bar
                  data={fineBarData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                    scales: {
                      y: {
                        ticks: {
                          callback: function(value) {
                            return '₹' + value;
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-48">
                <p className="text-gray-500 text-sm">No fine data available</p>
              </div>
            )}
            {userSummary && (
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div className="bg-blue-50 p-2 rounded">
                  <p className="text-blue-800 font-medium">Monthly Fines</p>
                  <p className="text-blue-600">₹{totals.monthlyFines.toFixed(2)}</p>
                </div>
                <div className="bg-green-50 p-2 rounded">
                  <p className="text-green-800 font-medium">On-time Rate</p>
                  <p className="text-green-600">{Math.round((totals.borrowed > 0 ? ((totals.borrowed - totals.overdue) / totals.borrowed) * 100 : 0))}%</p>
                </div>
              </div>
            )}
          </article>
        </section>

        {/* Enhanced controls & list with tabs - Tablet optimized layout */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 overflow-hidden">
          {/* Enhanced controls */}
          <article className="bg-white p-3 sm:p-4 md:p-5 rounded-lg shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1">
            <h4 className="font-semibold mb-2 sm:mb-3 text-[#3D3E3E] flex items-center gap-1 sm:gap-2 overflow-hidden text-sm sm:text-base">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Search & Filters
            </h4>

            {/* Tab filters - responsive */}
            <div className="flex mb-3 sm:mb-4 border-b overflow-x-auto overflow-y-hidden pb-1 -mx-1 px-1">
              <button
                className={`px-2 py-1 sm:px-3 sm:py-2 text-[10px] xs:text-xs md:text-sm font-medium whitespace-nowrap overflow-hidden ${
                  activeTab === "all"
                    ? "border-b-2 border-[#3D3E3E] text-[#3D3E3E]"
                    : "text-gray-500"
                }`}
                onClick={() => setActiveTab("all")}
              >
                All ({userBorrowedBooks.length})
              </button>
              <button
                className={`px-2 py-1 sm:px-3 sm:py-2 text-[10px] xs:text-xs md:text-sm font-medium whitespace-nowrap ${
                  activeTab === "borrowed"
                    ? "border-b-2 border-[#3D3E3E] text-[#3D3E3E]"
                    : "text-gray-500"
                }`}
                onClick={() => setActiveTab("borrowed")}
              >
                Borrowed ({totals.borrowed})
              </button>
              <button
                className={`px-2 py-1 sm:px-3 sm:py-2 text-[10px] xs:text-xs md:text-sm font-medium whitespace-nowrap ${
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
              className="w-full p-1.5 sm:p-2 border border-gray-200 rounded-md mb-2 sm:mb-3 text-[#3D3E3E] text-xs sm:text-sm"
            />

            <div className="flex gap-2 mb-2 sm:mb-3 flex-col xs:flex-row">
              <select
                value={genreFilter}
                onChange={(e) => setGenreFilter(e.target.value)}
                className="flex-1 p-1.5 sm:p-2 border rounded-md text-xs sm:text-sm"
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
                className="w-full xs:w-28 sm:w-32 p-1.5 sm:p-2 border rounded-md text-xs sm:text-sm"
              >
                <option value="latest">Latest</option>
                <option value="oldest">Oldest</option>
                <option value="title">Title</option>
                <option value="dueSoon">Due Soon</option>
              </select>
            </div>

            <label className="inline-flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm mb-3 sm:mb-4">
              <input
                type="checkbox"
                className="form-checkbox rounded text-[#3D3E3E] w-3 h-3 sm:w-4 sm:h-4"
                checked={onlyOverdue}
                onChange={(e) => {
                  setOnlyOverdue(e.target.checked);
                  setPage(1);
                }}
              />
              <span>Only show overdue</span>
            </label>

            <div className="mt-3 sm:mt-4">
              <h5 className="text-xs sm:text-sm text-gray-500 mb-1 sm:mb-2">Quick actions</h5>
              <div className="flex gap-1.5 sm:gap-2 flex-wrap">
                <button
                  onClick={() => {
                    setSearch("");
                    setGenreFilter("All");
                    setOnlyOverdue(false);
                    setSortBy("latest");
                    setActiveTab("all");
                  }}
                  className="px-2 py-1 sm:px-3 sm:py-2 border rounded-md text-xs sm:text-sm"
                >
                  Reset Filters
                </button>
                <button
                  onClick={() => {
                    setPerPage(10);
                    setPage(1);
                  }}
                  className="px-2 py-1 sm:px-3 sm:py-2 border rounded-md text-xs sm:text-sm"
                >
                  Show 10
                </button>
              </div>
            </div>
          </article>

          {/* Enhanced list */}
          <article className="lg:col-span-2 bg-white p-3 sm:p-4 md:p-5 rounded-lg shadow-xl hover:shadow-2xl transition-all duration-300 animate-slide-in-up transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h4 className="font-semibold text-[#3D3E3E] flex items-center gap-1 sm:gap-2 text-sm sm:text-base">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 4v12l-4-2-4 2V4M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Your Borrowed Items
              </h4>
              <span className="text-[10px] xs:text-xs md:text-sm text-gray-500 bg-gray-100 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full">
                {filtered.length} records
              </span>
            </div>

            {paginated.length === 0 ? (
              <div className="text-center py-6 sm:py-8 md:py-10 text-gray-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 mx-auto text-gray-400"
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
                <p className="mt-1 sm:mt-2 text-xs sm:text-sm">No records found with current filters</p>
                <button
                  onClick={() => {
                    setSearch("");
                    setGenreFilter("All");
                    setOnlyOverdue(false);
                    setSortBy("latest");
                    setActiveTab("all");
                  }}
                  className="mt-2 sm:mt-3 px-3 py-1.5 sm:px-4 sm:py-2 bg-[#3D3E3E] text-white rounded-md text-xs sm:text-sm"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
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
                      className="flex items-center gap-2 sm:gap-3 md:gap-4 border-b last:border-none pb-2 sm:pb-3 transition-all hover:bg-gray-50 p-1.5 sm:p-2 rounded animate-fade-in-up"
                    >
                      <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-gray-100 rounded-md flex items-center justify-center">
                        <img src={bookIcon} alt="book" className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                          <div>
                            <p className="text-xs sm:text-sm font-medium text-[#151619]">
                              {rec?.book?.title ||
                                rec.bookName ||
                                "Untitled Book"}
                            </p>
                            <p className="text-[10px] xs:text-xs text-gray-500">
                              {rec.book?.ISBN || rec.book?.isbn || "No ISBN"} • {rec.book?.genre || "Other"}
                            </p>
                          </div>
                          <div className="text-right mt-1 md:mt-0">
                            <p
                              className={`text-[10px] xs:text-xs font-semibold flex items-center gap-1 ${
                                isReturned
                                  ? "text-green-600"
                                  : isOverdue
                                  ? "text-red-600"
                                  : "text-indigo-700"
                              }`}
                            >
                              {isReturned ? (
                                <>
                                  <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                  Returned
                                </>
                              ) : isOverdue ? (
                                <>
                                  <AlertCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                  <span className="hidden xs:inline">Overdue ({daysBetween(rec.borrowDate)}d)</span>
                                  <span className="xs:hidden">Overdue</span>
                                </>
                              ) : (
                                <>
                                  <BookOpen className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                  Borrowed
                                </>
                              )}
                            </p>
                            <p className="text-[10px] xs:text-xs text-gray-400 mt-1">
                              {formatDate(rec.borrowDate || rec.createdAt)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-1.5 sm:mt-2 flex flex-wrap items-center gap-1.5 sm:gap-2">
                          <button
                            onClick={() => openBookDetail(rec)}
                            className="px-1.5 py-0.5 sm:px-2 sm:py-1 text-[10px] xs:text-xs border rounded-md hover:bg-gray-100 transition"
                          >
                            Details
                          </button>

                          {!isReturned && (
                            <button
                              onClick={() => markReturnedLocally(rec._id)}
                              className="px-1.5 py-0.5 sm:px-2 sm:py-1 text-[10px] xs:text-xs bg-green-600 text-white rounded-md hover:bg-green-700 transition"
                            >
                              Mark Returned
                            </button>
                          )}

                          {isReturned && (
                            <span className="px-1.5 py-0.5 sm:px-2 sm:py-1 text-[10px] xs:text-xs bg-gray-100 rounded-md">
                              Returned on {formatDate(rec.returnDate)}
                            </span>
                          )}

                          <span className="text-[10px] xs:text-xs text-gray-400">
                              {isReturned
                                ? `Read in ${daysBorrowed} days`
                                : `Due: ${
                                    rec.dueDate ? formatDate(rec.dueDate) : "—"
                                  }`}
                            </span>
                            <span className="text-[10px] xs:text-xs text-gray-400 flex items-center gap-1">
                              <IndianRupee className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                              <span className="hidden sm:inline">Price: ₹{rec.price?.toFixed?.(2) ?? "0.00"} • Fine: ₹{rec.fine?.toFixed?.(2) ?? "0.00"}</span>
                              <span className="sm:hidden">P: ₹{rec.price?.toFixed?.(2) ?? "0.00"} • F: ₹{rec.fine?.toFixed?.(2) ?? "0.00"}</span>
                            </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Enhanced pagination - responsive */}
            {filtered.length > 0 && (
              <div className="mt-3 sm:mt-4 flex flex-col xs:flex-row items-center justify-between gap-2 sm:gap-3">
                <div className="flex items-center gap-1 sm:gap-2">
                  <button
                    onClick={() => setPage(1)}
                    disabled={page === 1}
                    className="px-1.5 py-0.5 sm:px-2 sm:py-1 border rounded disabled:opacity-50 text-[10px] xs:text-xs shadow hover:shadow-md transition-all transform hover:-translate-y-0.5"
                  >
                    First
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-1.5 py-0.5 sm:px-2 sm:py-1 border rounded disabled:opacity-50 text-[10px] xs:text-xs shadow hover:shadow-md transition-all transform hover:-translate-y-0.5"
                  >
                    Prev
                  </button>
                  <span className="text-[10px] xs:text-xs px-2 py-1">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-1.5 py-0.5 sm:px-2 sm:py-1 border rounded disabled:opacity-50 text-[10px] xs:text-xs shadow hover:shadow-md transition-all transform hover:-translate-y-0.5"
                  >
                    Next
                  </button>
                  <button
                    onClick={() => setPage(totalPages)}
                    disabled={page === totalPages}
                    className="px-1.5 py-0.5 sm:px-2 sm:py-1 border rounded disabled:opacity-50 text-[10px] xs:text-xs shadow hover:shadow-md transition-all transform hover:-translate-y-0.5"
                  >
                    Last
                  </button>
                </div>

                <div className="flex items-center gap-1 sm:gap-2">
                  <label className="text-[10px] xs:text-xs text-gray-500">Per page</label>
                  <select
                    value={perPage}
                    onChange={(e) => {
                      setPerPage(Number(e.target.value));
                      setPage(1);
                    }}
                    className="p-0.5 sm:p-1 border rounded text-[10px] xs:text-xs shadow hover:shadow-md transition-all"
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

        {/* Enhanced activity + branding - Tablet optimized grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <article className="bg-white p-3 sm:p-4 md:p-5 rounded-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="bg-gradient-to-br from-[#151619] to-[#3D3E3E] p-2 sm:p-3 rounded-lg flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="font-semibold text-[#3D3E3E] flex items-center gap-1 sm:gap-2">
                Recent Activity
              </h4>
            </div>
            {recentActivity.length === 0 ? (
              <div className="text-center py-6 sm:py-8 md:py-10 text-gray-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 mx-auto text-gray-400"
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
                <p className="mt-1 sm:mt-2 text-xs sm:text-sm">No recent activity</p>
              </div>
            ) : (
              <ul className="space-y-2 sm:space-y-3">
                {recentActivity.map((a, idx) => {
                  const isReturned = !!a.returnDate;
                  const daysBorrowed = isReturned
                    ? daysBetween(a.borrowDate, new Date(a.returnDate))
                    : daysBetween(a.borrowDate);
                  
                  return (
                    <li
                      key={a._id}
                      style={{animationDelay: `${idx * 50}ms`}} className="flex items-start gap-2 sm:gap-3 p-1.5 sm:p-2 rounded hover:bg-gray-50 transition animate-fade-in-up"
                    >
                      <div
                        className={`w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-white text-[10px] xs:text-xs font-medium ${
                          isReturned ? "bg-green-500" : "bg-blue-500"
                        }`}
                      >
                        {isReturned ? 
                          <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" /> : 
                          <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                        }
                      </div>
                      <div className="flex-1">
                        <p className="text-xs sm:text-sm">
                          <strong>
                            {a.book?.title || a.bookName || "Untitled"}
                          </strong>{" "}
                          —{isReturned ? " Returned" : " Borrowed"}
                        </p>
                        <p className="text-[10px] xs:text-xs text-gray-400">
                          {formatDate(a.borrowDate || a.createdAt)}
                        </p>
                        {!isReturned && (
                          <p className="text-[10px] xs:text-xs text-indigo-600 mt-1">
                            Currently borrowed for {daysBorrowed} days
                          </p>
                        )}
                      </div>
                      <div className="text-[10px] xs:text-xs text-gray-400">
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

          <article className="bg-white p-3 sm:p-4 md:p-5 rounded-lg shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col items-center justify-center">
            <div className="flex flex-col items-center justify-center text-center mb-3 sm:mb-4">
              <img
                src={logo_with_title}
                alt="LibraFlow Library Management System"
                className="max-w-[80px] xs:max-w-[100px] sm:max-w-[120px] md:max-w-[140px] lg:max-w-[160px] mb-2 sm:mb-3"
              />
              <p className="text-[10px] xs:text-xs sm:text-sm text-gray-500">
                Library made simple. Track your books and never lose an ISBN again.
              </p>
            </div>
            
            <div className="space-y-2 sm:space-y-3 w-full">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-2 sm:p-3 rounded-lg border border-blue-100">
                <h4 className="text-[10px] xs:text-xs font-semibold text-blue-800 mb-1 flex items-center justify-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  Reading Statistics
                </h4>
                <div className="grid grid-cols-2 gap-1.5 sm:gap-2 mt-1.5 sm:mt-2">
                  <div className="bg-white p-1.5 sm:p-2 rounded text-center">
                    <p className="text-sm sm:text-lg font-bold text-blue-600">{totals.returned}</p>
                    <p className="text-[10px] xs:text-xs text-gray-600">Books Read</p>
                  </div>
                  <div className="bg-white p-1.5 sm:p-2 rounded text-center">
                    <p className="text-sm sm:text-lg font-bold text-indigo-600">{totals.totalReadingDays}</p>
                    <p className="text-[10px] xs:text-xs text-gray-600">Days Reading</p>
                  </div>
                </div>
                {totals.returned > 0 && (
                  <p className="text-[10px] xs:text-xs text-blue-700 mt-1.5 sm:mt-2 flex items-center justify-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5 sm:h-3 sm:w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    Avg. {totals.avgReadingDays} days per book
                  </p>
                )}
                {totals.borrowed > 0 && (
                  <p className="text-[10px] xs:text-xs text-indigo-700 mt-1 flex items-center justify-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5 sm:h-3 sm:w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Current books avg. {totals.avgCurrentBorrowedDays} days
                  </p>
                )}
              </div>
              
              {userSummary && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-2 sm:p-3 rounded-lg border border-purple-100">
                  <h4 className="text-[10px] xs:text-xs font-semibold text-purple-800 mb-1 flex items-center justify-center gap-1">
                    <IndianRupee className="h-3 w-3 sm:h-4 sm:w-4" />
                    Financial Summary
                  </h4>
                  <div className="grid grid-cols-2 gap-1.5 sm:gap-2 mt-1.5 sm:mt-2">
                    <div className="bg-white p-1.5 sm:p-2 rounded text-center">
                      <p className="text-sm sm:text-lg font-bold text-purple-600">₹{totals.totalOutstandingFines.toFixed(2)}</p>
                      <p className="text-[10px] xs:text-xs text-gray-600">Outstanding</p>
                    </div>
                    <div className="bg-white p-1.5 sm:p-2 rounded text-center">
                      <p className="text-sm sm:text-lg font-bold text-pink-600">{totals.currentOverdue}</p>
                      <p className="text-[10px] xs:text-xs text-gray-600">Overdue Books</p>
                    </div>
                  </div>
                  {totals.totalOutstandingFines > 0 && (
                    <button 
                      onClick={() => window.location.hash = '#fine-payment'}
                      className="mt-1.5 sm:mt-2 w-full text-[10px] xs:text-xs bg-purple-600 hover:bg-purple-700 text-white py-1 sm:py-1.5 rounded transition-colors"
                    >
                      Pay Fines Now
                    </button>
                  )}
                  {totals.totalOutstandingFines === 0 && (
                    <p className="text-[10px] xs:text-xs text-green-600 mt-1.5 sm:mt-2 flex items-center justify-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5 sm:h-3 sm:w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      All fines cleared!
                    </p>
                  )}
                </div>
              )}
              
              <div className="bg-gradient-to-r from-green-50 to-teal-50 p-2 sm:p-3 rounded-lg border border-green-100">
                <h4 className="text-[10px] xs:text-xs font-semibold text-green-800 mb-1 flex items-center justify-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Library Tips
                </h4>
                <p className="text-[10px] xs:text-xs text-gray-600 mt-1.5 sm:mt-2">
                  {totals.borrowed > 0 
                    ? `Return ${totals.borrowed} books on time to avoid fines.` 
                    : "Browse our catalog to discover new books to read!"}
                </p>
              </div>
            </div>
          </article>
        </section>

        {/* Enhanced footer tip - responsive */}
        <footer className="bg-white p-3 sm:p-4 rounded-lg shadow-xl hover:shadow-2xl transition-all duration-300 mt-4 sm:mt-6 flex flex-col xs:flex-row justify-between items-center gap-2 sm:gap-3 text-[10px] xs:text-xs sm:text-sm text-gray-600 transform hover:-translate-y-1">
          <div>
            <span className="font-semibold">Pro Tip:</span> Return books before
            due date to avoid overdue status. You can export your history for
            records.
          </div>
          <div className="text-center xs:text-right">Dashboard powered by LibraFlow • Made for learners</div>
        </footer>
      </div>

      {/* Book Detail Modal */}
      {selectedBook && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md sm:max-w-lg p-4 sm:p-6 max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-95 animate-scale-in">
            <div className="flex justify-between items-start mb-3 sm:mb-4">
              <h3 className="text-lg sm:text-xl font-bold text-[#3D3E3E]">
                Book Details
              </h3>
              <button
                onClick={closeBookDetail}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="bg-gray-200 border-2 border-dashed rounded-xl w-12 h-12 sm:w-16 sm:h-16 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-[#151619] text-base sm:text-lg">
                    {selectedBook?.book?.title || selectedBook.bookName || "Untitled Book"}
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-600">
                    {selectedBook?.book?.author || "Unknown Author"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div className="bg-gray-50 p-2 sm:p-3 rounded">
                  <p className="text-xs sm:text-sm text-gray-500">ISBN</p>
                  <p className="font-medium text-xs sm:text-sm">
                    {selectedBook?.book?.ISBN || selectedBook?.book?.isbn || "N/A"}
                  </p>
                </div>
                <div className="bg-gray-50 p-2 sm:p-3 rounded">
                  <p className="text-xs sm:text-sm text-gray-500">Genre</p>
                  <p className="font-medium text-xs sm:text-sm">
                    {selectedBook?.book?.genre || "Other"}
                  </p>
                </div>
                <div className="bg-gray-50 p-2 sm:p-3 rounded">
                  <p className="text-xs sm:text-sm text-gray-500">Borrowed On</p>
                  <p className="font-medium text-xs sm:text-sm">
                    {formatDate(selectedBook.borrowDate || selectedBook.createdAt)}
                  </p>
                </div>
                <div className="bg-gray-50 p-2 sm:p-3 rounded">
                  <p className="text-xs sm:text-sm text-gray-500">Status</p>
                  <p className={`font-medium text-xs sm:text-sm ${selectedBook.returnDate ? 'text-green-600' : 'text-blue-600'}`}>
                    {selectedBook.returnDate ? 'Returned' : 'Borrowed'}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 p-2 sm:p-3 rounded">
                <p className="text-xs sm:text-sm text-gray-500">Duration</p>
                <p className="font-medium">
                  {selectedBook.returnDate
                    ? `${daysBetween(
                        selectedBook.borrowDate,
                        new Date(selectedBook.returnDate)
                      )} days`
                    : `${daysBetween(selectedBook.borrowDate)} days so far`}
                </p>
              </div>

              <div className="mt-3 sm:mt-4 flex gap-2 flex-wrap">
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
                    className="px-3 py-1.5 sm:px-4 sm:py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition text-xs sm:text-sm shadow hover:shadow-md transform hover:-translate-y-0.5"
                  >
                    Mark Returned
                  </button>
                )}
                <button
                  onClick={closeBookDetail}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 border rounded-md hover:bg-gray-50 transition text-xs sm:text-sm shadow hover:shadow-md transform hover:-translate-y-0.5"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default UserDashboard;