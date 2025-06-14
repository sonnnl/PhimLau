// Admin Pages
export { default as AdminDashboard } from "./pages/AdminDashboard";
export { default as AdminUsers } from "./pages/AdminUsers";
export { default as AdminNotifications } from "./pages/AdminNotifications";
export { default as AdminSetup } from "./pages/AdminSetup";

// Admin Components
export { default as AdminLayout } from "./components/AdminLayout";

// Admin Services
export { default as adminService } from "./services/adminService";

// Admin Constants
export const ADMIN_ROUTES = {
  DASHBOARD: "/admin",
  USERS: "/admin/users",
  NOTIFICATIONS: "/admin/notifications",
  SETUP: "/admin/setup",
  REVIEWS: "/admin/reviews",
  SYSTEM: "/admin/system",
  LOGS: "/admin/logs",
  SETTINGS: "/admin/settings",
};

export const ADMIN_PERMISSIONS = {
  VIEW_DASHBOARD: "admin:dashboard:view",
  MANAGE_USERS: "admin:users:manage",
  SEND_NOTIFICATIONS: "admin:notifications:send",
  MODERATE_REVIEWS: "admin:reviews:moderate",
  VIEW_SYSTEM: "admin:system:view",
};
