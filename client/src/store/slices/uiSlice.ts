import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface Notification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
  duration?: number;
}

export interface UIState {
  sidebarOpen: boolean;
  notifications: Notification[];
  isLoading: boolean;
  theme: "light" | "dark" | "system";
}

const initialState: UIState = {
  sidebarOpen: true,
  notifications: [],
  isLoading: false,
  theme: "system",
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleSidebar: state => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.notifications.push(action.payload);
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      if (action.payload === "") {
        // Clear all notifications
        state.notifications = [];
      } else {
        // Remove specific notification
        state.notifications = state.notifications.filter(
          notification => notification.id !== action.payload
        );
      }
    },
    clearNotifications: state => {
      state.notifications = [];
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setTheme: (state, action: PayloadAction<"light" | "dark" | "system">) => {
      state.theme = action.payload;
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  addNotification,
  removeNotification,
  clearNotifications,
  setLoading,
  setTheme,
} = uiSlice.actions;

export default uiSlice.reducer;
