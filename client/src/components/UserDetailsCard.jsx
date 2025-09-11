import React, { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { fetchAllBorrowedBooks } from "../store/slices/borrowSlice";
import { fetchUserFineSummary, calculateFineForBorrow } from "../store/slices/fineSlice";
import { X, Book, Calendar, User, Mail, Shield, Clock, BookOpen, CheckCircle, AlertCircle, IndianRupee } from "lucide-react";

const UserDetailsCard = ({ user, onClose }) => {
    const dispatch = useDispatch();
    const { allBorrowedBooks, fetchLoading } = useSelector((state) => state.borrow);
    // Add proper null checks for the fine state
    const fineState = useSelector((state) => state.fine) || {};
    const { 
        userSummary = null, 
        calculatedFines = {}, 
        loading: fineLoading = false 
    } = fineState;
    
    const [activeTab, setActiveTab] = useState("profile");
    const [localBorrowedBooks, setLocalBorrowedBooks] = useState([]);
    const [finesCalculated, setFinesCalculated] = useState(false);
    const [loading, setLoading] = useState(false);

    // Fetch borrowed books and user fine summary
    const fetchData = useCallback(async () => {
        if (user?.email && !loading) {
            setLoading(true);
            try {
                // Fetch all borrowed books
                await dispatch(fetchAllBorrowedBooks()).unwrap();
                
                // Fetch user fine summary if user ID is available
                if (user._id) {
                    await dispatch(fetchUserFineSummary(user._id)).unwrap();
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
                // Even if there's an error, we still want to show the UI
            } finally {
                setLoading(false);
            }
        }
    }, [user, dispatch, loading]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        if (allBorrowedBooks && user?.email) {
            // Filter borrowed books for this specific user
            let userBooks = allBorrowedBooks.filter(book =>
                (book.user?.email === user.email) || (book.email === user.email)
            );
            
            // Remove any potential duplicates by creating a map based on _id
            const uniqueBooksMap = new Map();
            userBooks.forEach(book => {
                if (book._id) {
                    uniqueBooksMap.set(book._id, book);
                } else {
                    // For books without _id, use a composite key
                    const compositeKey = `${book.book?._id || book.bookId}-${book.borrowDate || book.createdAt}`;
                    uniqueBooksMap.set(compositeKey, book);
                }
            });
            
            // Convert map back to array
            userBooks = Array.from(uniqueBooksMap.values());
            
            setLocalBorrowedBooks(userBooks);
        } else if (user?.BorrowBooks) {
            // Fallback to user.BorrowBooks if available
            setLocalBorrowedBooks(user.BorrowBooks);
        }
    }, [allBorrowedBooks, user]);

    // Calculate fines for all overdue books when switching to borrowing tab
    const calculateFines = useCallback(() => {
        if (activeTab === "borrowing" && localBorrowedBooks.length > 0 && !finesCalculated) {
            // Calculate fines for all books with overdue status
            const finePromises = localBorrowedBooks
                .filter(book => book._id && !book.returnDate)
                .map(book => dispatch(calculateFineForBorrow(book._id)).unwrap());
            
            Promise.allSettled(finePromises)
                .then(() => setFinesCalculated(true))
                .catch(error => console.error("Error calculating fines:", error));
        }
    }, [activeTab, localBorrowedBooks, calculatedFines, dispatch, finesCalculated]);

    useEffect(() => {
        calculateFines();
    }, [calculateFines]);

    // Cleanup function to reset state when component unmounts
    useEffect(() => {
        return () => {
            setLocalBorrowedBooks([]);
            setFinesCalculated(false);
        };
    }, []);

    const formatDate = (timestamp) => {
        if (!timestamp) return "N/A";
        const date = new Date(timestamp);
        return date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const formatDateTime = (timestamp) => {
        if (!timestamp) return "N/A";
        const date = new Date(timestamp);
        return date.toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // Shared transition configurations
    const springTransition = { type: "spring", damping: 25, stiffness: 300 };
    const defaultTransition = { duration: 0.3, ease: "easeInOut" };

    if (!user) return null;

    // Calculate statistics from user's borrowed books
    const borrowedBooks = localBorrowedBooks || [];
    const totalBorrowed = borrowedBooks.length;
    const returnedBooks = borrowedBooks.filter(b => b.returnDate).length;
    const activeLoans = borrowedBooks.filter(b => !b.returnDate).length;
    const overdueBooks = borrowedBooks.filter(b => {
        if (b.returnDate) return false;
        // Check if book is overdue (borrowed more than 60 days ago)
        const borrowDate = new Date(b.borrowDate || b.createdAt);
        const dueDate = new Date(borrowDate);
        dueDate.setDate(dueDate.getDate() + 60);
        return new Date() > dueDate;
    }).length;

    // Calculate total outstanding fines
    const totalOutstandingFines = borrowedBooks.reduce((total, book) => {
        if (book._id && !book.returnDate) {
            const calculatedFine = calculatedFines[book._id];
            if (calculatedFine && calculatedFine.data) {
                return total + (calculatedFine.data.totalFine || 0);
            } else if (book.fine) {
                return total + book.fine;
            }
        }
        return total;
    }, 0);

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={`user-details-card-${user._id || 'unknown'}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black bg-opacity-50"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    transition={springTransition}
                    className="w-full max-w-4xl bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col h-[95vh] sm:h-[90vh]"
                    onClick={(e) => e.stopPropagation()}
                >
                    <style>{`
                        .custom-scrollbar::-webkit-scrollbar {
                            width: 4px;
                        }
                        .custom-scrollbar::-webkit-scrollbar-track {
                            background: #f1f1f1;
                            border-radius: 10px;
                        }
                        .custom-scrollbar::-webkit-scrollbar-thumb {
                            background: #c5c5c5;
                            border-radius: 10px;
                        }
                        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                            background: #a1a1a1;
                        }
                        .no-scrollbar::-webkit-scrollbar {
                            display: none;
                        }
                        .no-scrollbar {
                            -ms-overflow-style: none;
                            scrollbar-width: none;
                        }
                    `}</style>
                    
                    {/* Header - Fixed */}
                    <div className="bg-gradient-to-r from-[#151619] to-[#3D3E3E] p-4 sm:p-6 text-white flex-shrink-0">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-lg sm:text-2xl font-bold flex items-center gap-2">
                                    <User className="w-5 h-5 sm:w-6 sm:h-6" />
                                    {user.name || "Unknown User"}
                                </h2>
                                <p className="text-blue-100 flex items-center gap-1 mt-1 text-xs sm:text-sm">
                                    <Mail className="w-3 h-3 sm:w-4 sm:h-4" />
                                    {user.email || "No email provided"}
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-white hover:text-gray-200 transition-colors"
                            >
                                <X className="w-5 h-5 sm:w-6 sm:h-6" />
                            </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-3 sm:mt-4">
                            <div className="bg-white bg-opacity-20 rounded-lg px-2 py-1 sm:px-3 sm:py-1 flex items-center gap-1">
                                <Shield className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span className="text-xs sm:text-sm font-medium">{user.role || "User"}</span>
                            </div>
                            <div className="bg-white bg-opacity-20 rounded-lg px-2 py-1 sm:px-3 sm:py-1 flex items-center gap-1">
                                <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span className="text-xs sm:text-sm">Joined: {user.createdAt ? formatDate(user.createdAt) : "N/A"}</span>
                            </div>
                            {userSummary && userSummary.summary && (
                                <div className="bg-white bg-opacity-20 rounded-lg px-2 py-1 sm:px-3 sm:py-1 flex items-center gap-1">
                                    <IndianRupee className="w-3 h-3 sm:w-4 sm:h-4" />
                                    <span className="text-xs sm:text-sm">
                                        Outstanding: ₹{(userSummary.summary?.totalOutstanding || 0).toFixed(2)}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Tabs - Fixed */}
                    <div className="border-b border-gray-200 flex-shrink-0">
                        <nav className="flex">
                            <button
                                onClick={() => setActiveTab("profile")}
                                className={`px-3 py-2 sm:px-6 sm:py-3 font-medium text-xs sm:text-sm relative transition-all duration-300 ease-in-out ${activeTab === "profile"
                                        ? "text-[#3D3E3E] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#3D3E3E] after:rounded-full"
                                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                                    }`}
                            >
                                <div className="flex items-center gap-1 sm:gap-2">
                                    <User className="w-3 h-3 sm:w-4 sm:h-4" />
                                    <span>Profile</span>
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab("borrowing")}
                                className={`px-3 py-2 sm:px-6 sm:py-3 font-medium text-xs sm:text-sm relative transition-all duration-300 ease-in-out ${activeTab === "borrowing"
                                        ? "text-[#3D3E3E] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#3D3E3E] after:rounded-full"
                                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                                    }`}
                            >
                                <div className="flex items-center gap-1 sm:gap-2">
                                    <Book className="w-3 h-3 sm:w-4 sm:h-4" />
                                    <span className="hidden xs:inline">Borrowing History</span>
                                    <span className="xs:hidden">Borrowing</span>
                                    {totalBorrowed > 0 && (
                                        <span className="bg-gradient-to-r from-[#3D3E3E] to-[#151619] text-white text-[8px] sm:text-xs font-bold px-1 py-0.5 sm:px-2 sm:py-0.5 rounded-full animate-pulse">
                                            {totalBorrowed}
                                        </span>
                                    )}
                                </div>
                            </button>
                        </nav>
                    </div>

                    {/* Content - Scrollable */}
                    <div className="overflow-y-auto flex-1 no-scrollbar">
                        {activeTab === "profile" && (
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={defaultTransition}
                                className="space-y-4 sm:space-y-6 p-3 sm:p-6"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                    <div className="bg-gray-50 rounded-lg p-3 sm:p-4 overflow-hidden no-scrollbar">
                                        <h3 className="font-semibold text-gray-700 mb-2 sm:mb-3 text-sm sm:text-base">Personal Information</h3>
                                        <div className="space-y-2 sm:space-y-3">
                                            <div className="flex justify-between">
                                                <span className="text-gray-500 text-xs sm:text-sm">Full Name</span>
                                                <span className="font-medium text-[#3D3E3E] truncate max-w-[50%] sm:max-w-[60%] text-xs sm:text-sm">{user.name || "N/A"}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500 text-xs sm:text-sm">Email</span>
                                                <span className="font-medium text-[#3D3E3E] truncate max-w-[50%] sm:max-w-[60%] text-xs sm:text-sm">{user.email || "N/A"}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500 text-xs sm:text-sm">Role</span>
                                                <span className="font-medium">
                                                    <span className={`px-1 py-0.5 sm:px-1.5 sm:py-0.5 rounded-full text-[10px] sm:text-sm ${user.role === "Admin"
                                                            ? "bg-purple-100 text-purple-800"
                                                            : "bg-blue-100 text-blue-800"
                                                        }`}>
                                                        {user.role || "User"}
                                                    </span>
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                                        <h3 className="font-semibold text-gray-700 mb-2 sm:mb-3 text-sm sm:text-base">Account Information</h3>
                                        <div className="space-y-2 sm:space-y-3">
                                            <div className="flex justify-between">
                                                <span className="text-gray-500 text-xs sm:text-sm">Account Status</span>
                                                <span className="font-medium">
                                                    <span className={`px-1 py-0.5 sm:px-1.5 sm:py-0.5 rounded-full text-[10px] sm:text-sm ${user.accountVerified
                                                            ? "bg-green-100 text-green-800"
                                                            : "bg-red-100 text-red-800"
                                                        }`}>
                                                        {user.accountVerified ? "Verified" : "Pending"}
                                                    </span>
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500 text-xs sm:text-sm">Member Since</span>
                                                <span className="font-medium text-[#3D3E3E] text-xs sm:text-sm">{user.createdAt ? formatDate(user.createdAt) : "N/A"}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500 text-xs sm:text-sm">Last Updated</span>
                                                <span className="font-medium text-[#3D3E3E] text-xs sm:text-sm">{user.updatedAt ? formatDate(user.updatedAt) : "N/A"}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-lg p-2 sm:p-3 overflow-hidden">
                                    <h3 className="font-semibold text-gray-700 mb-2 text-sm sm:text-sm">Statistics</h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="bg-white rounded-md shadow p-2 border-l-2 border-blue-500 hover:shadow-sm transition-all duration-300 cursor-pointer transform hover:-translate-y-0.5 hover:scale-102 group relative overflow-hidden">
                                            <div className="flex items-center">
                                                <div className="p-1 sm:p-1.5 bg-blue-100 rounded-full">
                                                    <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                                                </div>
                                                <div className="ml-2">
                                                    <p className="text-[10px] sm:text-xs font-medium text-gray-600">Books Borrowed</p>
                                                    <p className="text-base sm:text-lg font-semibold text-[#3D3E3E]">
                                                        {totalBorrowed}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-800 to-transparent text-white p-1 sm:p-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-full group-hover:translate-y-0 overflow-hidden">
                                                <p className="text-[8px] sm:text-[10px] whitespace-nowrap overflow-hidden text-ellipsis">
                                                    Total books borrowed
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div className="bg-white rounded-md shadow p-2 border-l-2 border-green-500 hover:shadow-sm transition-all duration-300 cursor-pointer transform hover:-translate-y-0.5 hover:scale-102 group relative overflow-hidden">
                                            <div className="flex items-center">
                                                <div className="p-1 sm:p-1.5 bg-green-100 rounded-full">
                                                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                                                </div>
                                                <div className="ml-2">
                                                    <p className="text-[10px] sm:text-xs font-medium text-gray-600">Books Returned</p>
                                                    <p className="text-base sm:text-lg font-semibold text-green-600">
                                                        {returnedBooks}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-800 to-transparent text-white p-1 sm:p-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-full group-hover:translate-y-0 overflow-hidden">
                                                <p className="text-[8px] sm:text-[10px] whitespace-nowrap overflow-hidden text-ellipsis">
                                                    Books successfully returned
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div className="bg-white rounded-md shadow p-2 border-l-2 border-orange-500 hover:shadow-sm transition-all duration-300 cursor-pointer transform hover:-translate-y-0.5 hover:scale-102 group relative overflow-hidden">
                                            <div className="flex items-center">
                                                <div className="p-1 sm:p-1.5 bg-orange-100 rounded-full">
                                                    <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-orange-600" />
                                                </div>
                                                <div className="ml-2">
                                                    <p className="text-[10px] sm:text-xs font-medium text-gray-600">Currently Borrowed</p>
                                                    <p className="text-base sm:text-lg font-semibold text-orange-600">
                                                        {activeLoans}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-800 to-transparent text-white p-1 sm:p-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-full group-hover:translate-y-0 overflow-hidden">
                                                <p className="text-[8px] sm:text-[10px] whitespace-nowrap overflow-hidden text-ellipsis">
                                                    Books currently borrowed
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div className="bg-white rounded-md shadow p-2 border-l-2 border-red-500 hover:shadow-sm transition-all duration-300 cursor-pointer transform hover:-translate-y-0.5 hover:scale-102 group relative overflow-hidden">
                                            <div className="flex items-center">
                                                <div className="p-1 sm:p-1.5 bg-red-100 rounded-full">
                                                    <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" />
                                                </div>
                                                <div className="ml-2">
                                                    <p className="text-[10px] sm:text-xs font-medium text-gray-600">Overdue Books</p>
                                                    <p className="text-base sm:text-lg font-semibold text-red-600">
                                                        {overdueBooks}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-800 to-transparent text-white p-1 sm:p-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-full group-hover:translate-y-0 overflow-hidden">
                                                <p className="text-[8px] sm:text-[10px] whitespace-nowrap overflow-hidden text-ellipsis">
                                                    Books past due date
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div className="bg-white rounded-md shadow p-2 border-l-2 border-purple-500 hover:shadow-sm transition-all duration-300 cursor-pointer transform hover:-translate-y-0.5 hover:scale-102 group relative overflow-hidden col-span-2">
                                            <div className="flex items-center">
                                                <div className="p-1 sm:p-1.5 bg-purple-100 rounded-full">
                                                    <IndianRupee className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600" />
                                                </div>
                                                <div className="ml-2">
                                                    <p className="text-[10px] sm:text-xs font-medium text-gray-600">Total Outstanding Fines</p>
                                                    <p className="text-base sm:text-lg font-semibold text-purple-600">
                                                        ₹{totalOutstandingFines.toFixed(2)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-800 to-transparent text-white p-1 sm:p-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-full group-hover:translate-y-0 overflow-hidden">
                                                <p className="text-[8px] sm:text-[10px] whitespace-nowrap overflow-hidden text-ellipsis">
                                                    Total amount owed for overdue books
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                {userSummary && userSummary.summary && (
                                    <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                                        <h3 className="font-semibold text-gray-700 mb-2 sm:mb-3 text-sm sm:text-base">Fine Summary</h3>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                                            <div className="bg-white rounded-md shadow p-2 border-l-2 border-blue-500">
                                                <p className="text-[10px] sm:text-xs font-medium text-gray-600">Total Borrows</p>
                                                <p className="text-base sm:text-lg font-semibold text-[#3D3E3E]">
                                                    {userSummary.summary?.totalBorrows || 0}
                                                </p>
                                            </div>
                                            
                                            <div className="bg-white rounded-md shadow p-2 border-l-2 border-green-500">
                                                <p className="text-[10px] sm:text-xs font-medium text-gray-600">Current Overdue</p>
                                                <p className="text-base sm:text-lg font-semibold text-[#3D3E3E]">
                                                    {userSummary.summary?.currentOverdue || 0}
                                                </p>
                                            </div>
                                            
                                            <div className="bg-white rounded-md shadow p-2 border-l-2 border-orange-500">
                                                <p className="text-[10px] sm:text-xs font-medium text-gray-600">Monthly Fines</p>
                                                <p className="text-base sm:text-lg font-semibold text-[#3D3E3E]">
                                                    ₹{(userSummary.summary?.monthlyFines || 0).toFixed(2)}
                                                </p>
                                            </div>
                                            
                                            <div className="bg-white rounded-md shadow p-2 border-l-2 border-red-500">
                                                <p className="text-[10px] sm:text-xs font-medium text-gray-600">Outstanding Fines</p>
                                                <p className="text-base sm:text-lg font-semibold text-[#3D3E3E]">
                                                    ₹{(userSummary.summary?.totalOutstanding || 0).toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        {(userSummary.exemptions?.firstTimeBorrower || userSummary.exemptions?.excellentHistory) && (
                                            <div className="mt-3 p-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                                                <h4 className="text-xs font-semibold text-gray-700 mb-1">Applied Exemptions</h4>
                                                <div className="flex flex-wrap gap-1">
                                                    {userSummary.exemptions?.firstTimeBorrower && (
                                                        <span className="text-[10px] bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                                            🎉 First-time borrower exemption
                                                        </span>
                                                    )}
                                                    {userSummary.exemptions?.excellentHistory && (
                                                        <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                                            🌟 Excellent history discount
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {activeTab === "borrowing" && (
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={defaultTransition}
                                className="space-y-4 sm:space-y-6 p-3 sm:p-6"
                            >
                                <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                                    <div className="flex justify-between items-center mb-2 sm:mb-3">
                                        <h3 className="font-semibold text-gray-700 text-sm sm:text-base">Borrowing History</h3>
                                        <div className="text-xs sm:text-sm text-gray-600">
                                            Outstanding Fines: <span className="font-semibold text-red-600">₹{totalOutstandingFines.toFixed(2)}</span>
                                        </div>
                                    </div>
                                    
                                    {(fineLoading || loading || fetchLoading) && (
                                        <div className="text-center py-3">
                                            <div className="inline-block animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-purple-500 mb-2"></div>
                                            <p className="text-sm text-gray-600">Loading data...</p>
                                        </div>
                                    )}
                                    
                                    {localBorrowedBooks?.length > 0 ? (
                                        <div className="space-y-2 sm:space-y-3 max-h-[50vh] sm:max-h-[65vh] overflow-y-auto custom-scrollbar">
                                            {localBorrowedBooks.map((borrow, index) => {
                                                // Calculate due date (typically 60 days from borrow date)
                                                const borrowDate = new Date(borrow.borrowDate || borrow.createdAt);
                                                const dueDate = new Date(borrowDate);
                                                dueDate.setDate(dueDate.getDate() + 60);
                                                
                                                // Calculate if overdue
                                                const isOverdue = !borrow.returnDate && new Date() > dueDate;
                                                
                                                // Get fine information
                                                let fineAmount = 0;
                                                let calculatedFine = null;
                                                if (borrow._id && !borrow.returnDate) {
                                                    calculatedFine = calculatedFines[borrow._id];
                                                    if (calculatedFine && calculatedFine.data) {
                                                        fineAmount = calculatedFine.data.totalFine || 0;
                                                    } else if (borrow.fine) {
                                                        fineAmount = borrow.fine;
                                                    }
                                                }
                                                
                                                // Create a robust unique key that remains stable across renders
                                                let uniqueKey;
                                                if (borrow._id) {
                                                    uniqueKey = `borrow-${borrow._id}`;
                                                } else {
                                                    // Create a composite key from available properties
                                                    const bookId = borrow.book?._id || borrow.bookId || 'no-book-id';
                                                    const borrowTimestamp = borrow.borrowDate || borrow.createdAt || Date.now();
                                                    const returnTimestamp = borrow.returnDate || 'not-returned';
                                                    // Include index to ensure uniqueness when other properties are the same
                                                    uniqueKey = `borrow-${bookId}-${borrowTimestamp}-${returnTimestamp}-${index}`;
                                                }
                                                
                                                return (
                                                    <div 
                                                        key={uniqueKey}
                                                        className="bg-white rounded-lg shadow p-3 sm:p-4 border-l-2 border-blue-500 hover:shadow-sm transition-all duration-300 cursor-pointer transform hover:-translate-y-0.5 hover:scale-102 group relative overflow-hidden"
                                                    >
                                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 sm:gap-3">
                                                            <div className="flex items-start gap-2 sm:gap-3">
                                                                <div className="bg-[#3D3E3E] p-1.5 sm:p-2 rounded-lg flex-shrink-0">
                                                                    <Book className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <h4 className="font-semibold text-[#3D3E3E] text-sm truncate">{borrow.book?.title || borrow.bookName || "Untitled Book"}</h4>
                                                                    <p className="text-xs text-gray-600 truncate">by {borrow.book?.author || "Unknown Author"}</p>
                                                                    <div className="flex flex-wrap gap-1 mt-1.5 sm:mt-2">
                                                                        <span className="text-[8px] sm:text-[10px] bg-gray-100 px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded text-[#3D3E3E]">
                                                                            Borrowed: {borrow.borrowDate || borrow.createdAt ? formatDate(borrow.borrowDate || borrow.createdAt) : "N/A"}
                                                                        </span>
                                                                        {borrow.returnDate ? (
                                                                            <span className="text-[8px] sm:text-[10px] bg-green-100 text-green-800 px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded">
                                                                                Returned: {formatDate(borrow.returnDate)}
                                                                            </span>
                                                                        ) : (
                                                                            <span className="text-[8px] sm:text-[10px] bg-orange-100 text-orange-800 px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded">
                                                                                Not Returned
                                                                            </span>
                                                                        )}
                                                                        {!borrow.returnDate && (
                                                                            <span className="text-[8px] sm:text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded">
                                                                                Due: {formatDate(dueDate)}
                                                                            </span>
                                                                        )}
                                                                        {isOverdue && (
                                                                            <span className="text-[8px] sm:text-[10px] bg-red-100 text-red-800 px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded animate-pulse">
                                                                                Overdue
                                                                            </span>
                                                                        )}
                                                                        {fineAmount > 0 && (
                                                                            <span className="text-[8px] sm:text-[10px] bg-red-100 text-red-800 px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded flex items-center">
                                                                                <IndianRupee className="w-2 h-2 mr-0.5" />
                                                                                Fine: {fineAmount.toFixed(2)}
                                                                            </span>
                                                                        )}
                                                                        {calculatedFine && calculatedFine.data?.exemptions?.length > 0 && (
                                                                            <span className="text-[8px] sm:text-[10px] bg-green-100 text-green-800 px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded">
                                                                                {calculatedFine.data.exemptions.length} exemptions
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-1 text-[10px] sm:text-xs text-gray-600 bg-gray-50 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded whitespace-nowrap">
                                                                <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />
                                                                <span className="truncate">
                                                                    {borrow.returnDate
                                                                        ? `${Math.ceil((new Date(borrow.returnDate) - new Date(borrow.borrowDate || borrow.createdAt)) / (1000 * 60 * 60 * 24))} days`
                                                                        : `${Math.ceil((new Date() - new Date(borrow.borrowDate || borrow.createdAt)) / (1000 * 60 * 60 * 24))} days`}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        
                                                        {calculatedFine && calculatedFine.data && (
                                                            <div className="mt-2 p-2 bg-blue-50 rounded text-[10px] sm:text-xs text-blue-800">
                                                                <div className="flex justify-between">
                                                                    <span>Calculated Fine:</span>
                                                                    <span className="font-semibold">₹{calculatedFine.data.totalFine.toFixed(2)}</span>
                                                                </div>
                                                                {calculatedFine.data.exemptions?.map((exemption, idx) => (
                                                                    <div key={idx} className="flex justify-between mt-1">
                                                                        <span className="text-blue-600">{exemption.type}:</span>
                                                                        <span className="text-blue-600">-{exemption.amount.toFixed(2)}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="text-center py-6 sm:py-8">
                                            <Book className="w-8 h-8 sm:w-10 sm:h-10 text-gray-300 mx-auto mb-2 sm:mb-3" />
                                            <h3 className="text-sm sm:text-base font-medium text-gray-700">No borrowing history</h3>
                                            <p className="text-gray-500 mt-1 text-xs sm:text-sm">This user hasn't borrowed any books yet.</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Footer - Fixed */}
                    <div className="border-t border-gray-200 px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 flex justify-end flex-shrink-0">
                        <button
                            onClick={onClose}
                            className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm sm:text-base"
                        >
                            Close
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default UserDetailsCard;