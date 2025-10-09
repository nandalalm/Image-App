import { useAppDispatch, useAppSelector } from "../redux/store";
import { logoutUser } from "../redux/authSlice";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white shadow-lg rounded-2xl p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Home</h1>
          <p className="text-gray-600 mb-6">
            Welcome to your dashboard!
          </p>
          {user && (
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <p className="text-sm text-gray-600">Logged in as:</p>
              <p className="font-semibold text-blue-800">{user.email}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full bg-red-500 text-white py-3 px-4 rounded-lg hover:bg-red-600 transition-colors font-medium"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
