import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "./redux/store"
import { refreshAccessToken } from "./redux/authSlice";
import Router from "./routes/Router";

const App = () => {
  const dispatch = useAppDispatch();
  const { accessToken } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // 🔁 Try to refresh token on app load (only once)
    if (!accessToken) {
      dispatch(refreshAccessToken()).catch(() => {
        // Silently fail if no refresh token is available
        console.log("No valid refresh token found");
      });
    }
  }, [dispatch]); // Remove accessToken from dependencies to run only once

  return <Router />;
};

export default App;
