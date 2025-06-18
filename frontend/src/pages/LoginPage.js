import {
  Box,
  Button,
  Heading,
  VStack,
  Icon,
  Text,
  FormControl,
  FormLabel,
  Input,
  Stack,
  Link as ChakraLink,
  Divider,
  useToast,
  InputGroup,
  InputLeftElement,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  CloseButton,
  HStack,
} from "@chakra-ui/react";
import { FaGoogle } from "react-icons/fa";
import { EmailIcon, LockIcon } from "@chakra-ui/icons";
import { Link as RouterLink, useNavigate, useLocation } from "react-router-dom";
import { useState, useContext, useEffect } from "react";
import { AuthContext } from "../contexts/AuthContext";
import axios from "axios";

// Lấy URL backend từ biến môi trường, nếu không có thì dùng giá trị mặc định
const BACKEND_API_URL =
  process.env.REACT_APP_BACKEND_API_URL || "http://localhost:5001";

export default function LoginPage() {
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [loginAlert, setLoginAlert] = useState(null); // {type, title, message, details}
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  useEffect(() => {
    // Kiểm tra xem có thông điệp từ registration, verification, etc.
    if (location.state?.message) {
      setLoginAlert({
        type: location.state.alertType || "success",
        title: location.state.title || "Thông báo",
        message: location.state.message,
        details: location.state.details,
      });

      // Xóa state để tránh hiển thị lại khi refresh
      navigate("/login", { replace: true, state: {} });
    }

    // Kiểm tra error từ Google OAuth redirect
    const urlParams = new URLSearchParams(location.search);
    const error = urlParams.get("error");
    const message = urlParams.get("message");
    const reason = urlParams.get("reason");
    const expires = urlParams.get("expires");

    if (error) {
      let alertType = "error";
      let title = "Lỗi Đăng Nhập Google";
      let details;

      if (error === "account_suspended") {
        alertType = "warning";
        title = "⚠️ Tài khoản bị tạm khóa";
        if (expires) {
          details = `Ngày hết hạn: ${new Date(expires).toLocaleString(
            "vi-VN"
          )}.`;
        }
        if (reason) {
          details = `${details ? details + " " : ""}Lý do: ${decodeURIComponent(
            reason
          )}`;
        }
      } else if (error === "account_banned") {
        title = "🚫 Tài khoản bị cấm";
        if (reason) details = `Lý do: ${decodeURIComponent(reason)}`;
      } else if (error === "account_inactive") {
        alertType = "info";
        title = "ℹ️ Tài khoản không hoạt động";
      }

      setLoginAlert({
        type: alertType,
        title,
        message: decodeURIComponent(message),
        details,
      });

      // Xóa error khỏi URL
      navigate("/login", { replace: true });
    }
  }, [location.state, location.search, navigate]);

  const handleGoogleLogin = () => {
    setIsGoogleLoading(true);
    window.location.href = `${BACKEND_API_URL}/auth/google`;
  };

  const handleNormalLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginAlert(null); // Xóa alert cũ khi thử đăng nhập lại

    try {
      const { data } = await axios.post(`${BACKEND_API_URL}/auth/login`, {
        emailOrUsername,
        password,
      });
      login(data.token);
      toast({
        title: "🎉 Đăng nhập thành công!",
        description: "Chào mừng bạn quay trở lại.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      navigate("/");
    } catch (err) {
      const errorData = err.response?.data;
      const message =
        errorData?.message || "Đăng nhập thất bại. Vui lòng thử lại.";

      if (errorData?.needsVerification) {
        setLoginAlert({
          type: "warning",
          title: "Yêu cầu xác nhận Email",
          message: message,
          details: (
            <Button
              size="sm"
              mt={2}
              onClick={() =>
                navigate("/resend-verification", {
                  state: { email: errorData.email },
                })
              }
            >
              Gửi lại email xác nhận
            </Button>
          ),
        });
      } else if (errorData?.accountStatus) {
        let alertType = "error";
        let title = "Lỗi Đăng Nhập";
        let details = errorData.reason
          ? `Lý do: ${errorData.reason}`
          : "Vui lòng liên hệ quản trị viên để biết thêm chi tiết.";

        if (errorData.accountStatus === "suspended") {
          alertType = "warning";
          title = "⚠️ Tài khoản của bạn đang bị tạm khóa";
          if (errorData.expires) {
            details = `Tài khoản bị khóa cho đến: ${new Date(
              errorData.expires
            ).toLocaleString("vi-VN")}. ${details}`;
          }
        } else if (errorData.accountStatus === "banned") {
          title = "🚫 Tài khoản của bạn đã bị cấm vĩnh viễn";
        } else if (errorData.accountStatus === "inactive") {
          alertType = "info";
          title = "ℹ️ Tài khoản của bạn đã bị vô hiệu hóa";
        }

        setLoginAlert({ type: alertType, title, message, details });
      } else {
        // Lỗi chung (sai mật khẩu, etc.)
        setLoginAlert({
          type: "error",
          title: "Đăng nhập không thành công",
          message: message,
        });
      }
    }
    setIsLoading(false);
  };

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      minH="calc(100vh - 128px)" // Chiều cao viewport trừ đi chiều cao ước tính của header và footer
      py={12}
    >
      <VStack
        spacing={6}
        p={8}
        bg="background.secondary"
        borderRadius="lg"
        shadow="xl"
        textAlign="center"
        width={{ base: "90%", sm: "450px" }}
        border="1px"
        borderColor="brand.700"
      >
        <Heading as="h1" size="lg" color="text.primary" mb={2}>
          Đăng Nhập
        </Heading>

        {/* Alert cho tất cả các thông báo */}
        {loginAlert && (
          <Alert
            status={loginAlert.type}
            borderRadius="md"
            mb={4}
            flexDirection="column"
            alignItems="flex-start"
            textAlign="left"
            position="relative"
            p={4}
          >
            <CloseButton
              position="absolute"
              right="8px"
              top="8px"
              onClick={() => setLoginAlert(null)}
            />
            <HStack>
              <AlertIcon />
              <AlertTitle>{loginAlert.title}</AlertTitle>
            </HStack>
            <AlertDescription w="full" pl={8} mt={1}>
              {loginAlert.message}
              {loginAlert.details && (
                <Box mt={2} fontSize="xs" color="text.secondary">
                  {loginAlert.details}
                </Box>
              )}
            </AlertDescription>
          </Alert>
        )}

        <Button
          leftIcon={<Icon as={FaGoogle} />}
          variant="google"
          size="lg"
          onClick={handleGoogleLogin}
          isLoading={isGoogleLoading}
          width="full"
        >
          Tiếp tục với Google
        </Button>

        <Stack direction="row" align="center" width="full" py={2}>
          <Divider />
          <Text fontSize="xs" color="text.secondary" whiteSpace="nowrap">
            HOẶC
          </Text>
          <Divider />
        </Stack>

        <VStack as="form" onSubmit={handleNormalLogin} spacing={4} w="full">
          <FormControl isRequired>
            <FormLabel htmlFor="email" srOnly>
              Email hoặc Username
            </FormLabel>
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <EmailIcon color="gray.500" />
              </InputLeftElement>
              <Input
                type="text"
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                placeholder="Nhập email hoặc username"
              />
            </InputGroup>
          </FormControl>
          <FormControl isRequired>
            <FormLabel htmlFor="password" srOnly>
              Mật khẩu
            </FormLabel>
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <LockIcon color="gray.500" />
              </InputLeftElement>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
              />
            </InputGroup>
          </FormControl>
          <Button
            mt={4}
            type="submit"
            bg="brand.accent"
            color="white"
            _hover={{ bg: "brand.accentDark" }}
            width="full"
            size="lg"
            isLoading={isLoading}
          >
            Đăng nhập
          </Button>

          <Text color="text.secondary" fontSize="sm" textAlign="center">
            <ChakraLink
              as={RouterLink}
              to="/forgot-password"
              color="brand.accent"
              fontWeight="medium"
              _hover={{ textDecoration: "underline" }}
            >
              Quên mật khẩu?
            </ChakraLink>
          </Text>
        </VStack>

        <Text color="text.secondary" fontSize="sm">
          Chưa có tài khoản?{" "}
          <ChakraLink
            as={RouterLink}
            to="/register"
            color="brand.accent"
            fontWeight="medium"
          >
            Đăng ký ngay
          </ChakraLink>
        </Text>
      </VStack>
    </Box>
  );
}
