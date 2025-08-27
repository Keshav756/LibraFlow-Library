import React, { useEffect, useMemo, useState } from "react";
import bookIcon from "../assets/book.png";
import { Pie, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  Title,
  Filler,
} from "chart.js";

import {
  RefreshCw,
  Users,
  Book,
  Clock,
  TrendingUp,
  Mail,
  Shield,
  Calendar,
  Edit3,
  LogOut,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import Header from "../layout/Header";

// Async thunk actions to fetch data
import { fetchAllUsers } from "../store/slices/userSlice";
import { fetchAllBooks } from "../store/slices/bookSlice";
import { fetchAllBorrowedBooks } from "../store/slices/borrowSlice";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  Title,
  Filler
);

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const [searchTerm, setSearchTerm] = useState("");

  // Local UI states for loading and error feedback
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Selectors with safe fallbacks
  const users = useSelector((state) => state.user?.users || []);
  const books = useSelector((state) => state.book?.books || []);
  const allBorrowedBooks = useSelector(
    (state) => state.borrow?.allBorrowedBooks || []
  );

  // Try to get the currently logged-in user from common state shapes
  const currentUser = useSelector(
    (state) =>
      state.user?.currentUser ||
      state.auth?.user ||
      state.user?.user ||
      null
  );

  // Derived user stats
  const totalAllUsers = users.length;
  const totalUsersOnly = users.filter(
    (u) => u.role?.toLowerCase() === "user"
  ).length;
  const totalAdmins = users.filter(
    (u) => u.role?.toLowerCase() === "admin"
  ).length;

  // Fetch dashboard data on mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          dispatch(fetchAllUsers()),
          dispatch(fetchAllBooks()),
          dispatch(fetchAllBorrowedBooks()),
        ]);
      } catch (e) {
        setError("Failed to refresh dashboard data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [dispatch]);

  // Refresh data handler
  const refreshData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        dispatch(fetchAllUsers()),
        dispatch(fetchAllBooks()),
        dispatch(fetchAllBorrowedBooks()),
      ]);
    } catch (e) {
      setError("Failed to refresh dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Memoized calculations for performance

  const totalUsers = useMemo(
    () => users.filter((u) => u.role === "User").length,
    [users]
  );
  // totalAdmins is already derived above, so no need to memoize again

  const totalBooks = books.length;

  // Calculate available book copies
  const availableBooks = useMemo(() => {
    return books.reduce((acc, book) => {
      const borrowedCount = allBorrowedBooks.filter(
        (borrow) => borrow.bookId === book._id && !borrow.returnDate
      ).length;
      return acc + Math.max((book.quantity || 0) - borrowedCount, 0);
    }, 0);
  }, [books, allBorrowedBooks]);

  // Total currently borrowed books
  const totalBorrowedNow = useMemo(
    () => allBorrowedBooks.filter((b) => !b.returnDate).length,
    [allBorrowedBooks]
  );

  // Total returned books
  const totalReturned = useMemo(
    () => allBorrowedBooks.filter((b) => b.returnDate).length,
    [allBorrowedBooks]
  );

  // Pie chart data for borrowed vs returned
  const pieData = useMemo(
    () => ({
      labels: ["Currently Borrowed", "Returned"],
      datasets: [
        {
          data: [totalBorrowedNow, totalReturned],
          backgroundColor: ["#3D3E3E", "#151619"],
          hoverBackgroundColor: ["#5a5b5b", "#2a2a2a"],
          borderWidth: 2,
          borderColor: "#fff",
          hoverOffset: 8,
        },
      ],
    }),
    [totalBorrowedNow, totalReturned]
  );

  // Line chart data for borrowing trend over last 8 days
  const lineData = useMemo(() => {
    const days = [];
    const counts = [];
    for (let d = 7; d >= 0; d--) {
      const day = new Date();
      day.setDate(day.getDate() - d);
      const label = `${String(day.getDate()).padStart(2, "0")}/${String(
        day.getMonth() + 1
      ).padStart(2, "0")}`;
      days.push(label);

      const count = allBorrowedBooks.filter((b) => {
        if (!b.borrowDate) return false;
        const borrowDate = new Date(b.borrowDate);
        return (
          borrowDate.getDate() === day.getDate() &&
          borrowDate.getMonth() === day.getMonth() &&
          borrowDate.getFullYear() === day.getFullYear()
        );
      }).length;

      counts.push(count);
    }
    return {
      labels: days,
      datasets: [
        {
          label: "Borrows per Day",
          data: counts,
          borderColor: "#151619",
          backgroundColor: "rgba(17, 22, 25, 0.1)",
          tension: 0.3,
          fill: true,
        },
      ],
    };
  }, [allBorrowedBooks]);

  // Top borrowers by count
  const topBorrowers = useMemo(() => {
    const map = new Map();
    allBorrowedBooks.forEach((rec) => {
      const userEmail = rec?.user?.email || rec.email || "Unknown";
      map.set(userEmail, (map.get(userEmail) || 0) + 1);
    });

    return Array.from(map.entries())
      .map(([email, count]) => {
        const user = users.find((u) => u.email === email);
        return {
          email,
          name: user ? user.name : "Unknown",
          count,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [allBorrowedBooks, users]);

  // Overdue book count (borrowed more than 14 days ago and not returned)
  const overdueDaysLimit = 14;
  const now = new Date();

  const overdueCount = useMemo(() => {
    return allBorrowedBooks.filter((b) => {
      if (b.returnDate) return false;
      if (!b.borrowDate) return false;
      const borrowDate = new Date(b.borrowDate);
      const diffDays = (now - borrowDate) / (1000 * 60 * 60 * 24);
      return diffDays > overdueDaysLimit;
    }).length;
  }, [allBorrowedBooks]);

  // Recent borrowing/returning activity (latest 6)
  const recentActivity = useMemo(() => {
    return allBorrowedBooks
      .slice()
      .sort(
        (a, b) =>
          new Date(b.borrowDate || b.createdAt) -
          new Date(a.borrowDate || a.createdAt)
      )
      .slice(0, 6);
  }, [allBorrowedBooks]);

  // Filter recent activity by search term on book title or borrower email
  const filteredRecentActivity = useMemo(() => {
    if (!searchTerm) return recentActivity;
    return recentActivity.filter((r) => {
      const bookTitle = r?.book?.title?.toLowerCase() || "";
      const borrowerEmail =
        r?.user?.email?.toLowerCase() || r.email?.toLowerCase() || "";
      return (
        bookTitle.includes(searchTerm.toLowerCase()) ||
        borrowerEmail.includes(searchTerm.toLowerCase())
      );
    });
  }, [searchTerm, recentActivity]);

  // Popular genres with count (top 6)
  const genreDistribution = useMemo(() => {
    const map = new Map();
    books.forEach((b) => {
      const genre = b.genre || "Other";
      map.set(genre, (map.get(genre) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([genre, count]) => ({ genre, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [books]);

  // Helper to format date-time strings
  const formatDateTime = (ts) => {
    if (!ts) return "-";
    const d = new Date(ts);
    return `${String(d.getDate()).padStart(2, "0")}/${String(
      d.getMonth() + 1
    ).padStart(2, "0")}/${d.getFullYear()} ${String(d.getHours()).padStart(
      2,
      "0"
    )}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  // Derived currentUser info (safe fallbacks)
  const adminName = currentUser?.name || "Admin";
  const adminEmail = currentUser?.email || "admin@mail.com";
  const adminRole = currentUser?.role || "Admin";
  const adminAvatar =
    currentUser?.avatar ||
    currentUser?.profilePic ||
    "https://via.placeholder.com/100";
  const memberSince = currentUser?.createdAt
    ? new Date(currentUser.createdAt)
    : null;

  return (
    <main className="relative flex-1 p-6 pt-28 bg-gray-50 min-h-screen">
      <Header />

      <section className="space-y-6">
        {/* Header + refresh */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#3D3E3E]">
              Admin Dashboard
            </h1>
            <p className="text-sm text-[#151619] mt-1">
              Overview of users, books, and borrowing activity
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={refreshData}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm hover:shadow-lg transition disabled:opacity-50"
              title="Refresh dashboard data"
            >
              <RefreshCw className="w-4 h-4 text-[#3D3E3E]" />
              <span className="text-sm text-[#3D3E3E]">
                {loading ? "Refreshing..." : "Refresh"}
              </span>
            </button>
            <div className="hidden sm:flex items-center gap-3 text-sm text-[#3D3E3E]">
              <Users className="w-4 h-4" />
              <span>{totalUsers} users</span>
              <span className="mx-2">•</span>
              <Book className="w-4 h-4" />
              <span>{totalBooks} books</span>
            </div>
          </div>
        </header>

        {/* Error message */}
        {error && (
          <div className="bg-red-100 text-red-700 rounded p-3 text-center font-medium">
            {error}
          </div>
        )}

        {/* Top stat cards (unchanged) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Users"
            value={totalAllUsers}
            subtitle={`${totalAdmins} admins • ${totalUsersOnly} users`}
            icon={<Users className="w-6 h-6 text-white" />}
            color="bg-gradient-to-r from-[#151619] to-[#3D3E3E]"
          />
          <StatCard
            title="Total Books"
            value={totalBooks}
            subtitle={`${availableBooks} copies available`}
            icon={<Book className="w-6 h-6 text-white" />}
            color="bg-gradient-to-r from-indigo-700 to-indigo-500"
          />
          <StatCard
            title="Overdue Books"
            value={overdueCount}
            subtitle={`Borrowed > ${overdueDaysLimit} days`}
            icon={<Clock className="w-6 h-6 text-white" />}
            color="bg-gradient-to-r from-red-700 to-red-500"
          />
          <StatCard
            title="Top Borrower (recent)"
            value={topBorrowers[0]?.count || 0}
            subtitle={topBorrowers[0]?.email || "—"}
            icon={<TrendingUp className="w-6 h-6 text-white" />}
            color="bg-gradient-to-r from-yellow-700 to-yellow-500"
          />
        </section>

        {/* ====== NEW LAYOUT WRAPPER ======
            Keep your original two content sections the same, but place them in a left column.
            The animated profile card sits in a sticky right column on large screens.
        */}
        <section className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* LEFT: original dashboard content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Charts and lists (kept same) */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Pie chart */}
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
                    <span className="text-sm font-medium">
                      Currently Borrowed:
                    </span>
                    <span className="text-base font-semibold text-right">
                      {totalBorrowedNow}
                    </span>

                    <span className="text-sm font-medium">Returned:</span>
                    <span className="text-base font-semibold text-right">
                      {totalReturned}
                    </span>
                  </div>
                </div>
              </article>

              {/* Line chart */}
              <article className="col-span-1 lg:col-span-2 bg-white p-5 rounded-lg shadow-md">
                <header className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold text-[#3D3E3E]">
                    Borrowing Trend (last 8 days)
                  </h3>
                  <span className="text-sm text-gray-500">Realtime insights</span>
                </header>
                <div className="h-48">
                  <Line
                    data={lineData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { labels: { color: "#151619" } },
                      },
                      scales: {
                        x: { ticks: { color: "#3D3E3E" } },
                        y: { ticks: { color: "#3D3E3E" } },
                      },
                    }}
                  />
                </div>
              </article>
            </section>

            {/* Recent activity, top borrowers, genre distribution (kept same) */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
              {/* Recent Activity */}
              <article className="bg-white p-5 rounded-lg shadow-md">
                <input
                  type="text"
                  placeholder="Search recent activity..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full mb-3 p-2 border border-gray-300 rounded-md text-[#3D3E3E]"
                />
                <h4 className="font-semibold mb-4 text-[#3D3E3E]">
                  Recent Activity
                </h4>
                {filteredRecentActivity.length === 0 ? (
                  <p className="text-gray-500 text-sm">No recent activity.</p>
                ) : (
                  filteredRecentActivity.map((rec, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 border-b border-gray-200 py-2 last:border-none"
                    >
                      <img
                        src={bookIcon}
                        alt="Book Icon"
                        className="w-6 h-6 shrink-0"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-[#151619]">
                          {rec?.book?.title || rec.bookName || "Untitled Book"}
                        </p>
                        <p className="text-xs text-gray-500">
                          Borrower: {rec?.user?.email || rec.email || "Unknown"} •{" "}
                          {formatDateTime(rec.borrowDate || rec.createdAt)}
                        </p>
                      </div>
                      <div
                        className={`text-xs font-semibold ${
                          rec.returnDate ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {rec.returnDate ? "Returned" : "Borrowed"}
                      </div>
                    </div>
                  ))
                )}
              </article>

              {/* Top Borrowers */}
              <article className="bg-white p-5 rounded-lg shadow-md">
                <h4 className="font-semibold mb-4 text-[#3D3E3E]">
                  Top Borrowers
                </h4>
                {topBorrowers.length === 0 ? (
                  <p className="text-gray-500 text-sm">No borrowers found.</p>
                ) : (
                  <ul>
                    {topBorrowers.map((borrower, idx) => (
                      <li
                        key={idx}
                        className="flex justify-between border-b border-gray-200 py-2 last:border-none"
                      >
                        <span className="text-sm text-[#151619]">
                          {borrower.email}
                        </span>
                        <span className="text-sm font-semibold text-[#151619]">
                          {borrower.count}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </article>

              {/* Genre Distribution */}
              <article className="bg-white p-5 rounded-lg shadow-md">
                <h4 className="font-semibold mb-4 text-[#3D3E3E]">
                  Popular Genres
                </h4>
                {genreDistribution.length === 0 ? (
                  <p className="text-gray-500 text-sm">No genre data.</p>
                ) : (
                  <ul>
                    {genreDistribution.map((genre, idx) => (
                      <li
                        key={idx}
                        className="flex justify-between border-b border-gray-200 py-2 last:border-none"
                      >
                        <span className="text-sm text-[#151619]">
                          {genre.genre}
                        </span>
                        <span className="text-sm font-semibold text-[#151619]">
                          {genre.count}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            </section>

            {/* Footer tips (kept same) */}
            <footer className="bg-white p-4 rounded-lg shadow-md mt-6 flex flex-col md:flex-row justify-between items-center gap-3 text-gray-600 text-sm">
              <div>
                Pro Tip: Keep ISBNs unique and update book quantities when
                recording borrow/return.
              </div>
              <div>Dashboard powered by LibraFlow • Designed for learning projects</div>
            </footer>
          </div>

          {/* RIGHT: Animated Profile Card (new) */}
          <aside className="lg:col-span-1">
            <AnimatedProfileCard
              name={adminName}
              email={adminEmail}
              role={adminRole}
              avatar={adminAvatar}
              memberSince={memberSince}
              totals={{
                books: totalBooks,
                users: totalAllUsers,
                overdue: overdueCount,
                borrowedNow: totalBorrowedNow,
              }}
            />
          </aside>
        </section>
      </section>
    </main>
  );
};

/** Animated profile card pinned to the right side (responsive & interactive) */
const AnimatedProfileCard = ({
  name,
  email,
  role,
  avatar,
  memberSince,
  totals,
}) => {
  const since =
    memberSince &&
    `${String(memberSince.getDate()).padStart(2, "0")}/${String(
      memberSince.getMonth() + 1
    ).padStart(2, "0")}/${memberSince.getFullYear()}`;

  return (
    <div className="sticky top-28">
      <div className="group relative overflow-hidden rounded-2xl shadow-lg bg-gradient-to-br from-[#151619] to-[#3D3E3E] text-white">
        {/* Glow + subtle floating animation */}
        <div className="absolute -inset-1 bg-gradient-to-br from-white/10 to-white/0 rounded-2xl blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
        <div className="relative p-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={avatar}
                alt="Admin Avatar"
                className="w-20 h-20 rounded-full border-4 border-white/20 shadow-md transform group-hover:scale-105 transition-transform duration-500"
              />
              <span className="absolute -bottom-1 -right-1 inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500 ring-2 ring-white text-[10px] font-bold">
                {role?.[0] || "A"}
              </span>
            </div>
            <div className="">
              <h3 className="text-xl font-bold leading-tight">{name}</h3>
              <div className="flex items-center gap-2 text-white/80 text-sm mt-0.5">
                <Shield className="w-4 h-4" />
                <span>{role}</span>
              </div>
              <div className="flex items-center gap-2 text-white/80 text-sm mt-0.5 break-all">
                <Mail className="w-4 h-4" />
                <span>{email}</span>
              </div>
              {since && (
                <div className="flex items-center gap-2 text-white/70 text-xs mt-0.5">
                  <Calendar className="w-4 h-4" />
                  <span>Member since {since}</span>
                </div>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="my-5 h-px bg-white/10" />

          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-3">
            <MiniStat label="Books" value={totals?.books ?? 0} />
            <MiniStat label="Users" value={totals?.users ?? 0} />
            <MiniStat label="Overdue" value={totals?.overdue ?? 0} />
            <MiniStat label="Borrowed Now" value={totals?.borrowedNow ?? 0} />
          </div>

          {/* Actions */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors focus:outline-none"
              title="Edit profile"
            >
              <Edit3 className="w-4 h-4" />
              <span className="text-sm">Edit</span>
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors focus:outline-none"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm">Logout</span>
            </button>
          </div>
        </div>

        {/* Decorative bubbles */}
        <div className="pointer-events-none">
          <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10 blur-xl group-hover:scale-125 transition-transform duration-700" />
          <div className="absolute -bottom-10 left-10 w-28 h-28 rounded-full bg-white/5 blur-[22px] group-hover:scale-110 transition-transform duration-700 delay-100" />
        </div>
      </div>
    </div>
  );
};

const MiniStat = ({ label, value }) => (
  <div className="rounded-xl bg-white/5 p-3 text-center backdrop-blur-sm border border-white/10">
    <p className="text-2xl font-extrabold leading-none">{Number(value) || 0}</p>
    <p className="text-xs text-white/70 mt-1">{label}</p>
  </div>
);

// Small reusable stat detail for pie chart info box
const StatDetail = ({ label, value }) => (
  <div className="flex justify-between text-sm font-semibold">
    <span className="text-[#3D3E3E]">{label}</span>
    <span className="text-indigo-600">{value}</span>
  </div>
);

// 3D BookCard component with interactive effect (reused from UserDashboard)
const BookCard = ({
  title,
  value,
  subtitle,
  icon,
  colorClass = "from-[#151619] to-[#3D3E3E]",
}) => (
  <div className="relative h-48 perspective-1000 group cursor-pointer overflow-hidden">
    <div
      className={`absolute inset-0 rounded-lg shadow-xl transform transition-all duration-500 group-hover:rotate-y-[-25deg] group-hover:scale-105 overflow-hidden`}
    >
      <div
        className={`absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r ${colorClass} transform-style-3d shadow-inner z-10 overflow-hidden`}
      >
        <div className="absolute inset-0 bg-black bg-opacity-20 overflow-hidden"></div>
      </div>
      <div
        className={`absolute left-8 right-0 top-0 bottom-0 bg-gradient-to-br ${colorClass} p-6 flex flex-col justify-between transform-style-3d overflow-hidden`}
      >
        <div className="flex justify-between items-start overflow-hidden">
          <div className="overflow-hidden">
            <h3 className="text-lg font-bold text-white mb-1 overflow-hidden">
              {title}
            </h3>
            <p className="text-4xl font-extrabold text-white tracking-tight overflow-hidden">
              {Number.isFinite(value) ? value : 0}
            </p>
          </div>
          <div className="w-16 h-16 rounded-full bg-white bg-opacity-20 p-3 animate-float overflow-hidden">
            {icon}
          </div>
        </div>
        {subtitle && (
          <p className="text-sm text-white text-opacity-80 mt-2 overflow-hidden">
            {subtitle}
          </p>
        )}
        <div className="absolute bottom-3 left-3 w-12 h-1 bg-white bg-opacity-30 rounded-full overflow-hidden"></div>
        <div className="absolute bottom-6 left-3 w-8 h-1 bg-white bg-opacity-20 rounded-full overflow-hidden"></div>
        <div className="absolute top-0 right-0 w-20 h-20 bg-white opacity-5 rounded-full blur-xl group-hover:scale-150 transition-all duration-700 group-hover:opacity-10 overflow-hidden"></div>
        <div className="absolute bottom-0 left-10 w-16 h-16 bg-white opacity-5 rounded-full blur-xl group-hover:scale-150 transition-all duration-700 delay-100 group-hover:opacity-10 overflow-hidden"></div>
      </div>
    </div>
    <div className="absolute top-0 right-0 bottom-0 w-1/2 bg-white bg-opacity-5 transform origin-left scale-y-100 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 rounded-r-lg overflow-hidden"></div>
  </div>
);

// Backward compatibility wrapper to reuse AdminDashboard props
const StatCard = ({ color, ...rest }) => {
  const gradient = color ? color.replace(/bg-gradient-to-[\w-]+ /, "") : undefined;
  return <BookCard {...rest} colorClass={gradient} />;
};

export default AdminDashboard;