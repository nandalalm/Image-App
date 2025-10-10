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
    if (!accessToken && !hasTriedRefresh.current) {
      hasTriedRefresh.current = true;
      dispatch(refreshAccessToken()).catch(() => {
      });
    }
  }, [dispatch, accessToken]);

  useEffect(() => {
    if (accessToken) {
      dispatch(fetchProfile());
    }
  }, [dispatch, accessToken]);

  return <Router />;
};

export default App;
