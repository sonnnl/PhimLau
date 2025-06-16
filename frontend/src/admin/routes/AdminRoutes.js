import React from "react";
import { Routes, Route } from "react-router-dom";
import AdminRoute from "../components/AdminRoute";
import AdminDashboard from "../pages/AdminDashboard";
import AdminUsers from "../pages/AdminUsers";
import AdminNotifications from "../pages/AdminNotifications";
import AdminForumCategories from "../pages/AdminForumCategories";
import AdminForumThreads from "../pages/AdminForumThreads";
import AdminForumReports from "../pages/AdminForumReports";
import AdminReviews from "../pages/AdminReviews";
import AdminLogsPage from "../pages/AdminLogsPage";
import AdminSettingsPage from "../pages/AdminSettingsPage";
import AdminMonitoringPage from "../pages/AdminMonitoringPage";

const AdminRoutes = () => {
  return (
    <AdminRoute>
      <Routes>
        <Route path="/" element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="reviews" element={<AdminReviews />} />
        <Route path="notifications" element={<AdminNotifications />} />
        <Route path="forum/categories" element={<AdminForumCategories />} />
        <Route path="forum/threads" element={<AdminForumThreads />} />
        <Route path="forum/reports" element={<AdminForumReports />} />
        <Route path="logs" element={<AdminLogsPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
        <Route path="monitoring" element={<AdminMonitoringPage />} />
      </Routes>
    </AdminRoute>
  );
};

export default AdminRoutes;
