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
  const [verificationInfo, setVerificationInfo] = useState(null);
  const [showAlert, setShowAlert] = useState(true);
  const [hasShownToast, setHasShownToast] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  useEffect(() => {
    // Kiểm tra xem có thông điệp từ registration không
    if (location.state?.message) {
      if (location.state.needsVerification) {
        setVerificationInfo({
          email: location.state.email,
          message: location.state.message,
          showResendOption: location.state.showResendOption,
        });
      }

      // Xóa state để tránh hiển thị lại khi refresh
      navigate("/login", { replace: true });
    }

    // Kiểm tra error từ Google OAuth redirect
    const urlParams = new URLSearchParams(location.search);
    const error = urlParams.get("error");
    const message = urlParams.get("message");

    if (error) {
      let toastStatus = "error";
      let toastTitle = "Lỗi Đăng Nhập Google";

      if (error === "account_suspended") {
        toastStatus = "warning";
        toastTitle = "⚠️ Tài khoản bị tạm khóa";
      } else if (error === "account_banned") {
        toastStatus = "error";
        toastTitle = "🚫 Tài khoản bị cấm";
      } else if (error === "account_inactive") {
        toastStatus = "info";
        toastTitle = "ℹ️ Tài khoản không hoạt động";
      }

      toast({
        title: toastTitle,
        description: message
          ? decodeURIComponent(message)
          : "Đăng nhập Google thất bại",
        status: toastStatus,
        duration: 8000,
        isClosable: true,
      });

      // Xóa error khỏi URL
      navigate("/login", { replace: true });
    }
  }, [location.state, location.search, navigate, toast]);

  const handleGoogleLogin = () => {
    setIsGoogleLoading(true);
    window.location.href = `${BACKEND_API_URL}/auth/google`;
  };

  const handleNormalLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data } = await axios.post(`${BACKEND_API_URL}/auth/login`, {
        emailOrUsername,
        password,
      });
      login(data.token);
      toast({
        title: "Đăng nhập thành công!",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      navigate("/");
    } catch (err) {
      const errorMessage =
        err.response && err.response.data && err.response.data.message
          ? err.response.data.message
          : "Đăng nhập thất bại. Vui lòng thử lại.";

      const accountStatus = err.response?.data?.accountStatus;

      // Kiểm tra xem có phải lỗi verification không
      if (err.response?.data?.needsVerification) {
        setVerificationInfo({
          email: err.response.data.email,
          message: errorMessage,
          showResendOption: true,
        });
        setShowAlert(true); // Đảm bảo alert được hiển thị
      } else {
        // Xử lý các trạng thái tài khoản bị khóa
        let toastStatus = "error";
        let toastTitle = "Lỗi Đăng Nhập";

        if (accountStatus === "suspended") {
          toastStatus = "warning";
          toastTitle = "⚠️ Tài khoản bị tạm khóa";
        } else if (accountStatus === "banned") {
          toastStatus = "error";
          toastTitle = "🚫 Tài khoản bị cấm";
        } else if (accountStatus === "inactive") {
          toastStatus = "info";
          toastTitle = "ℹ️ Tài khoản không hoạt động";
        }

        toast({
          title: toastTitle,
          description: errorMessage,
          status: toastStatus,
          duration: accountStatus ? 8000 : 5000, // Hiển thị lâu hơn cho các lỗi tài khoản
          isClosable: true,
        });
      }
    }
    setIsLoading(false);
  };

  const handleResendVerification = () => {
    if (verificationInfo?.email) {
      navigate("/resend-verification", {
        state: { email: verificationInfo.email },
      });
    }
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

        {/* Alert cho verification */}
        {verificationInfo && showAlert && (
          <Alert status="success" borderRadius="md" mb={4}>
            <AlertIcon />
            <Box flex="1">
              <AlertTitle fontSize="sm">Đăng ký thành công!</AlertTitle>
              <AlertDescription fontSize="xs">
                {verificationInfo.message}
                {verificationInfo.showResendOption && (
                  <>
                    <br />
                    <ChakraLink
                      color="blue.500"
                      textDecoration="underline"
                      fontSize="xs"
                      onClick={handleResendVerification}
                      cursor="pointer"
                      mt={1}
                    >
                      Gửi lại email xác nhận
                    </ChakraLink>
                  </>
                )}
              </AlertDescription>
            </Box>
            <CloseButton
              alignSelf="flex-start"
              onClick={() => setShowAlert(false)}
            />
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

        <form onSubmit={handleNormalLogin} style={{ width: "100%" }}>
          <VStack spacing={4}>
            <FormControl id="emailOrUsername">
              <FormLabel>Email hoặc Username</FormLabel>
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
            <FormControl id="password">
              <FormLabel>Mật khẩu</FormLabel>
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
        </form>

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
