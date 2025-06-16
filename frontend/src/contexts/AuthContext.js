import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useContext,
} from "react";
import axios from "axios"; // Sẽ dùng để gọi API /auth/me

const BACKEND_API_URL =
  process.env.REACT_APP_BACKEND_API_URL || "http://localhost:5001";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("movieAppToken"));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Ban đầu sẽ loading để fetch user
  const [error, setError] = useState(null);

  const fetchUser = useCallback(async (currentToken) => {
    if (currentToken) {
      setLoading(true);
      setError(null);
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${currentToken}`,
          },
        };
        const { data } = await axios.get(`${BACKEND_API_URL}/auth/me`, config);
        setUser(data);
        setToken(currentToken); // Đảm bảo token trong state cũng được cập nhật nếu nó được truyền vào từ ngoài
        localStorage.setItem("movieAppToken", currentToken); // Đảm bảo token cũng được lưu lại nếu fetchUser được gọi với token mới
      } catch (err) {
        console.error(
          "Failed to fetch user:",
          err.response ? err.response.data : err.message
        );
        setUser(null);
        setToken(null);
        localStorage.removeItem("movieAppToken");
        setError(
          err.response
            ? err.response.data.message || "Failed to fetch user"
            : "Failed to fetch user"
        );
      } finally {
        setLoading(false);
      }
    } else {
      setUser(null);
      setToken(null);
      setLoading(false); // Không có token, không loading, không user
      localStorage.removeItem("movieAppToken"); // Xóa token nếu không có currentToken
    }
  }, []);

  // Load user khi component mount lần đầu nếu có token trong localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem("movieAppToken");
    if (storedToken) {
      fetchUser(storedToken);
    } else {
      setLoading(false); // Không có token, không cần fetch, kết thúc loading
    }
  }, [fetchUser]);

  const login = useCallback(
    async (newToken) => {
      // Lưu ý: login bây giờ chỉ nhận token, sau đó fetchUser sẽ được gọi để lấy thông tin user
      // Điều này hữu ích cho cả Google login (nhận token từ URL) và login thường (nhận token từ API response)
      setLoading(true);
      localStorage.setItem("movieAppToken", newToken);
      setToken(newToken); // Cập nhật token trong state ngay
      await fetchUser(newToken); // Gọi fetchUser để lấy thông tin user thật
      // setLoading sẽ được xử lý bên trong fetchUser
    },
    [fetchUser]
  );

  const logout = useCallback(() => {
    localStorage.removeItem("movieAppToken");
    setToken(null);
    setUser(null);
    setError(null);
    // navigate('/'); // Có thể điều hướng ở đây hoặc ở component gọi logout
  }, []);

  const refreshUser = useCallback(async () => {
    if (token) {
      await fetchUser(token);
    }
  }, [fetchUser, token]);

  const value = {
    token,
    user,
    isAuthenticated: !!token && !!user,
    loading,
    error,
    login,
    logout,
    fetchUser,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Tạo và export hook useAuth
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined || context === null) {
    // Thêm kiểm tra null
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
