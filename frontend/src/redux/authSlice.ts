import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import axiosInstance from "../api/axiosInstance";

interface AuthState {
  accessToken: string | null;
  loading: boolean;
  error: string | null;
  user: { email: string; name: string } | null;
}

const initialState: AuthState = {
  accessToken: null,
  loading: false,
  error: null,
  user: null,
};

// ✅ Login user
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/auth/login", credentials);
      return response.data.accessToken;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || "Login failed");
    }
  }
);

// ✅ Silent refresh token
export const refreshAccessToken = createAsyncThunk(
  "auth/refreshAccessToken",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/auth/refresh-token");
      return response.data.accessToken;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || "Failed to refresh token");
    }
  }
);

// ✅ Logout user
export const logoutUser = createAsyncThunk(
  "auth/logoutUser",
  async (_, { rejectWithValue }) => {
    try {
      await axiosInstance.post("/auth/logout");
      return true;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || "Logout failed");
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAccessToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
    },
    setUser: (state, action: PayloadAction<{ email: string; name: string } | null>) => {
      state.user = action.payload;
    },
    logout: (state) => {
      state.accessToken = null;
      state.user = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login cases
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.accessToken = action.payload;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Refresh token cases
      .addCase(refreshAccessToken.fulfilled, (state, action) => {
        state.accessToken = action.payload;
      })
      .addCase(refreshAccessToken.rejected, (state) => {
        state.accessToken = null;
        state.user = null;
      })
      // Logout cases
      .addCase(logoutUser.fulfilled, (state) => {
        state.accessToken = null;
        state.user = null;
        state.error = null;
      });
  },
});

export const { setAccessToken, setUser, logout } = authSlice.actions;
export default authSlice.reducer;
