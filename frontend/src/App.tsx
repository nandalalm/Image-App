import { useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "./redux/store"
import { refreshAccessToken } from "./redux/authSlice";
import Router from "./routes/Router";
import { fetchProfile } from "./redux/authSlice";

const App = () => {
  const dispatch = useAppDispatch();
  const { accessToken } = useAppSelector((state) => state.auth);
  const hasTriedRefresh = useRef(false);

  useEffect(() => {
    // 🔁 Try to refresh token on app load (only once)
    if (!accessToken && !hasTriedRefresh.current) {
      hasTriedRefresh.current = true;
      dispatch(refreshAccessToken()).catch(() => {
        // Silently fail if no refresh token is available
        console.log("No valid refresh token found");
      });
    }
  }, [dispatch, accessToken]);

  // When we have an access token, fetch profile once
  useEffect(() => {
    if (accessToken) {
      dispatch(fetchProfile());
    }
  }, [dispatch, accessToken]);

  return <Router />;
};

export default App;
