import React, { useState, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import Header from "../layout/Header";
import UserDetailsCard from "./UserDetailsCard";
import { User, Mail, Shield, BookOpen, Calendar, Search, IndianRupee } from "lucide-react";
import { fetchAllBorrowedBooks } from "../store/slices/borrowSlice";
import { fetchUserFineSummary } from "../store/slices/fineSlice";
import { fetchAllUsers } from "../store/slices/userSlice";

const Users = () => {
  const { users } = useSelector((state) => state.user);
  const { allBorrowedBooks } = useSelector((state) => state.borrow);
  const dispatch = useDispatch();
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [userFineData, setUserFineData] = useState({});

  // Trigger animations when component mounts
  useEffect(() => {
    setIsVisible(true);
    return () => setIsVisible(false);
  }, []);

  // Fetch all users
  useEffect(() => {
    if (!users || users.length === 0) {
      dispatch(fetchAllUsers());
    }
  }, [dispatch, users]);

  // Fetch all borrowed books data
  useEffect(() => {
    if (!allBorrowedBooks || allBorrowedBooks.length === 0) {
      dispatch(fetchAllBorrowedBooks());
    }
  }, [dispatch, allBorrowedBooks]);

  // Fetch fine data for all users - optimized version
  const fetchUserFines = useCallback(async () => {
    if (users && users.length > 0) {
      try {
        // Create an array of promises for all user fine fetches
        const finePromises = users
          .filter(user => user._id && user.role === "User")
          .map(user => dispatch(fetchUserFineSummary(user._id)).unwrap());
        
        // Wait for all promises to resolve
        const results = await Promise.allSettled(finePromises);
        
        // Process the results
        const fineData = {};
        results.forEach((result, index) => {
          const user = users.filter(u => u._id && u.role === "User")[index];
          if (result.status === 'fulfilled' && result.value && result.value.data) {
            fineData[user._id] = result.value.data;
          }
        });
        
        setUserFineData(fineData);
      } catch (error) {
        console.error("Error fetching user fines:", error);
      }
    }
  }, [users, dispatch]);

  // Fetch user fines when users data changes
  useEffect(() => {
    fetchUserFines();
  }, [fetchUserFines]);

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const formattedDate = `${String(date.getDate()).padStart(2, "0")}/${String(
      date.getMonth() + 1
    ).padStart(2, "0")}/${date.getFullYear()}`;
    const formattedTime = `${String(date.getHours()).padStart(2, "0")}:${String(
      date.getMinutes()
    ).padStart(2, "0")}`;
    const result = `${formattedDate} ${formattedTime}`;
    return result;
  };

  const filteredUsers = users?.filter(user => 
    user.role === "User" && 
    (user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  // Calculate statistics
  const totalUsers = users?.filter(u => u.role === "User").length || 0;
  const activeBorrowers = users?.filter(u => u.role === "User" && u.BorrowBooks?.length > 0).length || 0;
  
  // Calculate overdue books using real fine data
  const overdueBooks = filteredUsers.reduce((count, user) => {
    const userFines = userFineData[user._id];
    if (userFines && userFines.summary) {
      return count + (userFines.summary.currentOverdue || 0);
    }
    // Fallback to static data if real data not available
    return count + (user.BorrowBooks?.filter(b => b.fine > 0).length || 0);
  }, 0);
  
  const verifiedUsers = users?.filter(u => u.role === "User" && u.accountVerified).length || 0;
  
  // Calculate total outstanding fines
  const totalOutstandingFines = filteredUsers.reduce((total, user) => {
    const userFines = userFineData[user._id];
    if (userFines && userFines.summary) {
      return total + (userFines.summary.totalOutstanding || 0);
    }
    // Fallback to static data if real data not available
    return total + (user.BorrowBooks?.reduce((sum, book) => sum + (book.fine || 0), 0) || 0);
  }, 0);

  // Stats card data
  const statsData = [
    { 
      id: 1, 
      title: "Total Users", 
      value: totalUsers, 
      icon: User, 
      color: "blue", 
      borderClass: "border-blue-500",
      bgClass: "bg-blue-100",
      textClass: "text-blue-600"
    },
    { 
      id: 2, 
      title: "Active Borrowers", 
      value: activeBorrowers, 
      icon: BookOpen, 
      color: "green", 
      borderClass: "border-green-500",
      bgClass: "bg-green-100",
      textClass: "text-green-600"
    },
    { 
      id: 3, 
      title: "Overdue Books", 
      value: overdueBooks, 
      icon: Calendar, 
      color: "orange", 
      borderClass: "border-orange-500",
      bgClass: "bg-orange-100",
      textClass: "text-orange-600"
    },
    { 
      id: 4, 
      title: "Verified Users", 
      value: verifiedUsers, 
      icon: Shield, 
      color: "purple", 
      borderClass: "border-purple-500",
      bgClass: "bg-purple-100",
      textClass: "text-purple-600"
    },
    { 
      id: 5, 
      title: "Total Outstanding Fines", 
      value: `₹${totalOutstandingFines.toFixed(2)}`, 
      icon: IndianRupee, 
      color: "red", 
      borderClass: "border-red-500",
      bgClass: "bg-red-100",
      textClass: "text-red-600"
    }
  ];

  // Function to get borrowed books for a user
  const getBorrowedBooksForUser = (user) => {
    // Filter all borrowed books by user email
    if (allBorrowedBooks && user.email) {
      return allBorrowedBooks.filter(book => 
        (book.user?.email === user.email) || (book.email === user.email)
      );
    }
    // Fallback to user.BorrowBooks if available
    if (user.BorrowBooks) {
      return user.BorrowBooks;
    }
    // Return empty array if no data
    return [];
  };

  // Function to get active loans for a user
  const getActiveLoans = (user) => {
    const borrowedBooks = getBorrowedBooksForUser(user);
    return borrowedBooks.filter(book => !book.returnDate).length;
  };

  // Function to get overdue books for a user (using real fine data)
  const getOverdueBooks = (user) => {
    const userFines = userFineData[user._id];
    if (userFines && userFines.summary) {
      return userFines.summary.currentOverdue || 0;
    }
    // Fallback to static calculation
    const borrowedBooks = getBorrowedBooksForUser(user);
    return borrowedBooks.filter(book => book.fine > 0).length;
  };

  // Function to get total borrowed books for a user
  const getTotalBorrowed = (user) => {
    const borrowedBooks = getBorrowedBooksForUser(user);
    return borrowedBooks.length;
  };

  // Function to get total fines for a user (using real fine data)
  const getTotalFines = (user) => {
    const userFines = userFineData[user._id];
    if (userFines && userFines.summary) {
      return userFines.summary.totalOutstanding || 0;
    }
    // Fallback to static calculation
    const borrowedBooks = getBorrowedBooksForUser(user);
    return borrowedBooks.reduce((sum, book) => sum + (book.fine || 0), 0);
  };

  return (
    <>
      <main className="relative flex-1 p-2 sm:p-4 md:p-6 pt-20 sm:pt-24 md:pt-28">
        <Header />
        
        {/* Sub Header */}
        <div className={`flex flex-col gap-3 md:flex-row md:justify-between md:items-center mb-4 sm:mb-6 transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          <h2 className="text-lg sm:text-xl md:text-2xl font-medium md:font-semibold text-[#3D3E3E]">
            Registered Users
          </h2>
          
          {/* Search Bar */}
          <div className="relative w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search users..."
              className="pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64 transition-all duration-300 hover:shadow-md text-sm sm:text-base"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search
              className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 absolute left-2.5 sm:left-3 top-2 sm:top-2.5"
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-4 mb-4 sm:mb-6">
          {statsData.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div 
                key={stat.id}
                className={`bg-white rounded-lg shadow p-2 sm:p-4 border-l-4 ${stat.borderClass} hover:shadow-md transition-all duration-300 cursor-pointer transform hover:-translate-y-1 hover:scale-105 group relative overflow-hidden`}
                style={{ 
                  transitionDelay: `${index * 50}ms`,
                  transitionProperty: 'transform, box-shadow',
                  transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                <div className="flex items-center">
                  <div className={`p-2 sm:p-3 ${stat.bgClass} rounded-full`}>
                    <IconComponent className={`w-4 h-4 sm:w-6 sm:h-6 ${stat.textClass}`} />
                  </div>
                  <div className="ml-2 sm:ml-4">
                    <p className="text-xs sm:text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-lg sm:text-2xl font-semibold text-[#3D3E3E] animate-pulse">
                      {stat.value}
                    </p>
                  </div>
                </div>
                
                {/* Expanded information on hover - hidden by default, no scrollbars */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-800 to-transparent text-white p-2 sm:p-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-full group-hover:translate-y-0 overflow-hidden">
                  <p className="text-[8px] sm:text-xs whitespace-nowrap overflow-hidden text-ellipsis">
                    {stat.id === 1 && "Total number of registered users in the system"}
                    {stat.id === 2 && "Users who currently have borrowed books"}
                    {stat.id === 3 && "Books that are past their due date"}
                    {stat.id === 4 && "Users who have verified their accounts"}
                    {stat.id === 5 && "Total outstanding fines across all users"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Users Grid */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {filteredUsers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 p-3 sm:p-6">
              {filteredUsers.map((user, index) => (
                <div
                  key={user._id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-200 transform hover:-translate-y-1 sm:hover:-translate-y-2"
                  onClick={() => setSelectedUser(user)}
                  style={{
                    animation: 'fadeInUp 0.5s ease-out forwards',
                    animationDelay: `${index * 30}ms`,
                    opacity: 0,
                  }}
                >
                  <div className="p-3 sm:p-5">
                    <div className="flex items-center">
                      <div className="bg-gradient-to-br from-[#151619] to-[#3D3E3E] rounded-lg w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-md">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-3 sm:ml-4">
                        <h3 className="text-base sm:text-lg font-semibold text-[#3D3E3E]">{user.name}</h3>
                        <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-1">
                          <Mail className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="truncate max-w-[120px] sm:max-w-none">{user.email}</span>
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-3 sm:mt-4 flex flex-wrap gap-1 sm:gap-2">
                      <span className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${
                        user.accountVerified 
                          ? "bg-green-100 text-green-800" 
                          : "bg-red-100 text-red-800"
                      }`}>
                        {user.accountVerified ? "Verified" : "Pending"}
                      </span>
                      <span className="px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium bg-blue-100 text-blue-800">
                        {user.role}
                      </span>
                    </div>
                    
                    {/* Stats Grid */}
                    <div className="mt-3 sm:mt-5 grid grid-cols-2 gap-2 sm:gap-3">
                      <div className="bg-gradient-to-br from-blue-50 to-white p-2 sm:p-3 rounded-lg border border-blue-100 transition-all duration-300 hover:shadow-sm">
                        <p className="text-[10px] sm:text-xs text-gray-500 font-medium">Books Borrowed</p>
                        <p className="font-bold text-[#3D3E3E] text-base sm:text-lg">{getTotalBorrowed(user)}</p>
                      </div>
                      <div className="bg-gradient-to-br from-orange-50 to-white p-2 sm:p-3 rounded-lg border border-orange-100 transition-all duration-300 hover:shadow-sm">
                        <p className="text-[10px] sm:text-xs text-gray-500 font-medium">Overdue Books</p>
                        <p className="font-bold text-[#3D3E3E] text-base sm:text-lg">
                          {getOverdueBooks(user)}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-white p-2 sm:p-3 rounded-lg border border-green-100 transition-all duration-300 hover:shadow-sm">
                        <p className="text-[10px] sm:text-xs text-gray-500 font-medium">Active Loans</p>
                        <p className="font-bold text-[#3D3E3E] text-base sm:text-lg">
                          {getActiveLoans(user)}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-white p-2 sm:p-3 rounded-lg border border-purple-100 transition-all duration-300 hover:shadow-sm">
                        <p className="text-[10px] sm:text-xs text-gray-500 font-medium">Total Fines</p>
                        <p className="font-bold text-[#3D3E3E] text-base sm:text-lg">
                          ₹{getTotalFines(user).toFixed(2)}
                        </p>
                      </div>
                    </div>
                    
                    {/* Quick Action Button */}
                    <div className="mt-3 sm:mt-4">
                      <button 
                        className="w-full py-1.5 sm:py-2 bg-[#3D3E3E] text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-[#151619] transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedUser(user);
                        }}
                      >
                        View Details
                      </button>
                    </div>
                    
                    <div className="mt-3 sm:mt-4 text-[10px] sm:text-xs text-gray-500 flex items-center">
                      <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
                      <span className="truncate">Registered: {formatDate(user.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 sm:py-12">
              <div className="inline-block animate-bounce">
                <User className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
              </div>
              <h3 className="text-base sm:text-lg font-medium text-gray-700">
                {searchTerm ? "No users found" : "No registered users found"}
              </h3>
              <p className="text-gray-500 mt-1 text-sm sm:text-base">
                {searchTerm 
                  ? "Try adjusting your search terms" 
                  : "There are currently no users registered in the library"}
              </p>
            </div>
          )}
        </div>

        {/* User Details Card Modal */}
        {selectedUser && (
          <UserDetailsCard 
            user={selectedUser} 
            onClose={() => setSelectedUser(null)} 
          />
        )}
      </main>

      {/* Custom CSS Animations */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeInUp {
          animation: fadeInUp 0.5s ease-out forwards;
        }
        
        @media (max-width: 640px) {
          .grid-cols-2 {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        
        @media (max-width: 480px) {
          .grid-cols-2 {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
};

export default Users;