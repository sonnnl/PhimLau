import { useEffect, useContext } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Box, Spinner, Text, VStack, Heading } from "@chakra-ui/react";
import { AuthContext } from "../contexts/AuthContext";

export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  useEffect(() => {
    const token = searchParams.get("token");

    if (token) {
      console.log("Received token:", token);
      login(token); // Gọi hàm login từ AuthContext
      // AuthContext.login sẽ tự động lưu token và fetch user (khi được implement đầy đủ)
      navigate("/");
    } else {
      console.error("No token found in callback URL");
      // Có thể hiển thị thông báo lỗi trên trang login một cách tinh tế hơn
      navigate("/login?error=token_missing");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, navigate, login]);

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      minH="calc(100vh - 128px)"
    >
      <VStack spacing={4} textAlign="center">
        <Heading size="lg">Đang xử lý đăng nhập...</Heading>
        <Spinner size="xl" color="brand.accent" thickness="4px" />
        <Text>Vui lòng chờ trong giây lát.</Text>
      </VStack>
    </Box>
  );
}
