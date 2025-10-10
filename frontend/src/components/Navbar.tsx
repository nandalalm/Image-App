import { useAppDispatch, useAppSelector } from "../redux/store";
import { logoutUser } from "../redux/authSlice";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { Camera } from "lucide-react";
import ConfirmDialog from "./ConfirmDialog";

const Navbar = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const [open, setOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const displayName = user?.firstName 
    ? (user?.lastName ? `${user.firstName} ${user.lastName}` : user.firstName)
    : (user?.email ? user.email.split('@')[0] : "User");
  const profileImageUrl = user?.profileImageUrl;

  const handleLogoutClick = () => {
    setOpen(false); // Close the dropdown menu
    setShowLogoutConfirm(true); // Show confirmation dialog
  };

  const handleLogoutConfirm = async () => {
    setShowLogoutConfirm(false);
    await dispatch(logoutUser());
    navigate("/login");
  };

  const handleLogoutCancel = () => {
    setShowLogoutConfirm(false);
  };

  const goProfile = () => {
    navigate("/profile");
    setOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="sticky top-0 z-40 bg-white shadow-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Left side - Brand (camera icon + text) */}
          <button
            onClick={() => navigate("/home")}
            className="flex items-center gap-1 focus:outline-none"
            aria-label="Go to Home"
          >
            <Camera size={18} className="text-gray-800 sm:hidden" />
            <Camera size={20} className="text-gray-800 hidden sm:inline" />
            <h1 className="text-lg sm:text-2xl font-bold text-gray-800 leading-tight">ImageApp</h1>
          </button>

          {/* Right side - User dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setOpen((o) => !o)}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md border border-gray-200 hover:bg-gray-50"
           >
              {profileImageUrl ? (
                <img src={profileImageUrl} alt="Avatar" className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover" />
              ) : (
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold text-xs sm:text-sm">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-gray-800 font-medium text-sm sm:text-base max-w-[120px] sm:max-w-none truncate">{displayName}</span>
              <svg className={`w-3 h-3 sm:w-4 sm:h-4 text-gray-600 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </button>

            {open && (
              <div className="absolute right-0 mt-2 w-36 sm:w-44 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                <button onClick={goProfile} className="w-full text-left px-3 sm:px-4 py-2 hover:bg-gray-50 text-sm">Profile</button>
                <button onClick={handleLogoutClick} className="w-full text-left px-3 sm:px-4 py-2 text-red-600 hover:bg-gray-50 text-sm">Logout</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        open={showLogoutConfirm}
        onConfirm={handleLogoutConfirm}
        onCancel={handleLogoutCancel}
        title="Confirm Logout"
        description="Are you sure you want to logout?"
        confirmText="Logout"
        cancelText="Cancel"
      />
    </nav>
  );
};

export default Navbar;
