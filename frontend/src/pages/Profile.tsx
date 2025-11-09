import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../redux/store";
import Navbar from "../components/Navbar";
import { useEffect, useRef, useState } from "react";
import { UserApi } from "../services";
import { fetchProfile } from "../redux/authSlice";
import { useToast } from "../hooks/useToast";

const Profile = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const { show } = useToast();
  const [fileError, setFileError] = useState<string>("");

  useEffect(() => {
    if (!fileError) return;
    const t = setTimeout(() => setFileError(""), 3000);
    return () => clearTimeout(t);
  }, [fileError]);

  const displayName = user?.firstName 
    ? (user?.lastName ? `${user.firstName} ${user.lastName}` : user.firstName)
    : (user?.email ? user.email.split("@")[0] : "User");
  const email = user?.email ?? "";
  const profileImageUrl = user?.profileImageUrl;

  const onEditClick = () => {
    fileInputRef.current?.click();
  };

  const onFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setFileError("Only image files are allowed (JPG, PNG, GIF, WebP)");
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    setFileError("");
    try {
      setUploading(true);
      await UserApi.updateProfileImage(file);
      await dispatch(fetchProfile());
      show('Profile image updated', 'success');
    } catch (err) {
      console.error('Failed to upload profile image:', err);
      show('Failed to upload profile image', 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4 py-8">
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 relative">
          <button
            onClick={() => navigate("/home")}
            className="absolute top-5 left-5 inline-flex items-center gap-1 text-gray-600 hover:text-gray-900 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back</span>
          </button>

          <div className="flex flex-col items-center pt-10">
            <div className="relative">
              {profileImageUrl ? (
                <img
                  src={profileImageUrl}
                  alt="Profile"
                  className="w-32 h-32 rounded-full object-cover"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center text-3xl font-semibold text-gray-600">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onFileSelected}
              />
              <button
                onClick={onEditClick}
                title="Edit profile photo"
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow disabled:opacity-60"
                disabled={uploading}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
            </div>

            {fileError && (
              <div className="mt-4">
                <p className="text-sm text-red-600 text-center">{fileError}</p>
              </div>
            )}

            <h2 className={`${fileError ? 'mt-4' : 'mt-6'} text-2xl font-bold text-gray-900 text-center`}>{displayName}</h2>
            <p className="mt-2 text-gray-600 text-center">{email}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
