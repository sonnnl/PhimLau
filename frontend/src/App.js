import React, { Suspense, lazy } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import {
  ChakraProvider,
  ColorModeScript,
  Spinner,
  Center,
} from "@chakra-ui/react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import customTheme from "./theme";
import MainLayout from "./components/layout/MainLayout";
// Import các trang khác khi bạn tạo chúng
// import MovieDetailPage from "./pages/MovieDetailPage";
// import GenrePage from "./pages/GenrePage";
// import SearchResultsPage from "./pages/SearchResultsPage";

// Lazy load pages
const HomePage = lazy(() => import("./pages/HomePage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const AuthCallbackPage = lazy(() => import("./pages/AuthCallbackPage"));
// const ProfilePage = lazy(() => import("./pages/ProfilePage")); // Tạm thời comment out
// Thêm MovieDetailPage sau khi tạo
const MovieDetailPage = lazy(() => import("./pages/MovieDetailPage"));
const SearchResultsPage = lazy(() => import("./pages/SearchResultsPage"));
const LatestMoviesPage = lazy(() => import("./pages/LatestMoviesPage"));
const ForumCategoriesPage = lazy(() => import("./pages/ForumCategoriesPage"));
const ForumThreadsPage = lazy(() => import("./pages/ForumThreadsPage"));
const ForumThreadDetailPage = lazy(() =>
  import("./pages/ForumThreadDetailPage")
);
const CreateThreadPage = lazy(() => import("./pages/CreateThreadPage"));
const SingleMoviesPage = lazy(() => import("./pages/SingleMoviesPage"));
const SeriesMoviesPage = lazy(() => import("./pages/SeriesMoviesPage"));
const GenrePage = lazy(() => import("./pages/GenrePage"));

// Admin pages
const AdminDashboard = lazy(() => import("./admin/pages/AdminDashboard"));
const AdminUsers = lazy(() => import("./admin/pages/AdminUsers"));
const AdminNotifications = lazy(() =>
  import("./admin/pages/AdminNotifications")
);
const AdminSetup = lazy(() => import("./admin/pages/AdminSetup"));
const AdminRoute = lazy(() => import("./components/admin/AdminRoute"));

// Component ProtectedRoute
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <Center h="100vh">
        <Spinner size="xl" color="brand.accent" />
      </Center>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Componentđể xử lý redirect cho người dùng đã đăng nhập
const AuthenticatedRedirect = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <Center h="100vh">
        <Spinner size="xl" color="brand.accent" />
      </Center>
    );
  }
  return isAuthenticated ? <Navigate to="/" replace /> : children;
};

function App() {
  return (
    <ChakraProvider theme={customTheme}>
      <ColorModeScript initialColorMode={customTheme.config.initialColorMode} />
      <AuthProvider>
        <Router>
          <Suspense
            fallback={
              <Center h="100vh" bg="background.primary">
                <Spinner
                  size="xl"
                  color="brand.accent"
                  thickness="4px"
                  speed="0.65s"
                />
              </Center>
            }
          >
            <MainLayout>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route
                  path="/login"
                  element={
                    <AuthenticatedRedirect>
                      <LoginPage />
                    </AuthenticatedRedirect>
                  }
                />
                <Route
                  path="/register"
                  element={
                    <AuthenticatedRedirect>
                      <RegisterPage />
                    </AuthenticatedRedirect>
                  }
                />
                <Route
                  path="/auth/google/callback"
                  element={<AuthCallbackPage />}
                />
                {/* <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                /> */}
                <Route path="/movie/:slug" element={<MovieDetailPage />} />
                <Route path="/search" element={<SearchResultsPage />} />
                <Route path="/movies/latest" element={<LatestMoviesPage />} />
                <Route path="/movies/single" element={<SingleMoviesPage />} />
                <Route path="/movies/series" element={<SeriesMoviesPage />} />
                <Route path="/genres/:slug" element={<GenrePage />} />
                <Route path="/forum" element={<ForumCategoriesPage />} />
                <Route
                  path="/forum/category/:categorySlug"
                  element={<ForumThreadsPage />}
                />
                <Route
                  path="/forum/thread/:threadSlug"
                  element={<ForumThreadDetailPage />}
                />
                <Route
                  path="/forum/create-thread"
                  element={
                    <ProtectedRoute>
                      <CreateThreadPage />
                    </ProtectedRoute>
                  }
                />

                {/* Admin setup route (public) */}
                <Route path="/admin/setup" element={<AdminSetup />} />

                {/* Admin routes */}
                <Route
                  path="/admin"
                  element={
                    <AdminRoute>
                      <AdminDashboard />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/users"
                  element={
                    <AdminRoute>
                      <AdminUsers />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/notifications"
                  element={
                    <AdminRoute>
                      <AdminNotifications />
                    </AdminRoute>
                  }
                />

                {/* Fallback route cho các đường dẫn không khớp */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </MainLayout>
          </Suspense>
        </Router>
      </AuthProvider>
    </ChakraProvider>
  );
}

export default App;
