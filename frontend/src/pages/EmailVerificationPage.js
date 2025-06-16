import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, Link as RouterLink } from "react-router-dom";
import axios from "axios";
import {
  Box,
  VStack,
  Heading,
  Text,
  Button,
  Link as ChakraLink,
  Spinner,
  Icon,
  Center,
  useToast,
  HStack,
} from "@chakra-ui/react";
import { CheckIcon, WarningIcon, TimeIcon } from "@chakra-ui/icons";
import { motion } from "framer-motion";

const MotionBox = motion(Box);

const EmailVerificationPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [status, setStatus] = useState("verifying");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const hasVerifiedRef = useRef(false);

  const verifyEmail = useCallback(async () => {
    // Tránh double call trong StrictMode
    if (hasVerifiedRef.current) return;

    try {
      setIsLoading(true);
      hasVerifiedRef.current = true; // Đánh dấu đã gọi API

      // Decode token nếu bị encode
      const decodedToken = decodeURIComponent(token);
      const response = await axios.get(
        `${
          process.env.REACT_APP_BACKEND_API_URL || "http://localhost:5001"
        }/auth/verify-email/${decodedToken}`
      );

      setStatus("success");
      setMessage(response.data.message);

      toast({
        title: "Xác nhận thành công!",
        description: response.data.message,
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      // Chuyển hướng đến trang đăng nhập sau 3 giây
      setTimeout(() => {
        navigate("/login", {
          state: {
            message:
              "Email đã được xác nhận thành công. Bạn có thể đăng nhập ngay bây giờ!",
          },
        });
      }, 3000);
    } catch (error) {
      console.error("Email verification error:", error);
      setStatus("error");

      let errorMessage =
        "Có lỗi xảy ra khi xác nhận email. Vui lòng thử lại sau.";
      let showResendOption = false;

      if (error.response?.data) {
        const { message, expired, invalid, alreadyVerified } =
          error.response.data;
        errorMessage = message;

        if (expired) {
          showResendOption = true;
          setStatus("expired");
        } else if (alreadyVerified) {
          setStatus("already_verified");
        } else if (invalid) {
          setStatus("invalid");
        }
      } else if (error.code === "NETWORK_ERROR" || !error.response) {
        errorMessage =
          "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng và thử lại.";
      }

      setMessage(errorMessage);

      // Lưu thông tin để hiển thị option gửi lại email nếu cần
      if (showResendOption && error.response?.data?.email) {
        localStorage.setItem("resendEmail", error.response.data.email);
      }

      const getToastTitle = (data) => {
        if (data?.alreadyVerified) return "Đã xác nhận";
        if (data?.expired) return "Token hết hạn";
        if (data?.invalid) return "Token không hợp lệ";
        return "Xác nhận thất bại";
      };

      toast({
        title: getToastTitle(error.response?.data),
        description: errorMessage,
        status: error.response?.data?.alreadyVerified ? "info" : "error",
        duration: 8000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [token, navigate, toast]);

  useEffect(() => {
    if (token && !hasVerifiedRef.current) {
      verifyEmail();
    }
  }, [token, verifyEmail]);

  const getStatusIcon = () => {
    switch (status) {
      case "verifying":
        return <Icon as={TimeIcon} boxSize={12} color="blue.500" />;
      case "success":
        return <Icon as={CheckIcon} boxSize={12} color="green.500" />;
      case "already_verified":
        return <Icon as={CheckIcon} boxSize={12} color="blue.500" />;
      case "expired":
        return <Icon as={TimeIcon} boxSize={12} color="orange.500" />;
      case "invalid":
        return <Icon as={WarningIcon} boxSize={12} color="red.500" />;
      case "error":
        return <Icon as={WarningIcon} boxSize={12} color="red.500" />;
      default:
        return <Icon as={TimeIcon} boxSize={12} color="gray.500" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "verifying":
        return "blue.500";
      case "success":
        return "green.500";
      case "already_verified":
        return "blue.500";
      case "expired":
        return "orange.500";
      case "invalid":
        return "red.500";
      case "error":
        return "red.500";
      default:
        return "gray.500";
    }
  };

  const getStatusTitle = () => {
    switch (status) {
      case "success":
        return "Xác nhận thành công!";
      case "already_verified":
        return "Đã được xác nhận";
      case "expired":
        return "Token đã hết hạn";
      case "invalid":
        return "Token không hợp lệ";
      case "error":
        return "Xác nhận thất bại";
      default:
        return "Xác nhận thất bại";
    }
  };

  return (
    <MotionBox
      display="flex"
      alignItems="center"
      justifyContent="center"
      minH="calc(100vh - 128px)"
      py={12}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
    >
      <VStack
        spacing={6}
        p={8}
        bg="background.secondary"
        borderRadius="lg"
        shadow="xl"
        textAlign="center"
        width={{ base: "90%", sm: "500px" }}
        border="1px"
        borderColor="brand.700"
      >
        <VStack spacing={2}>
          <Text fontSize="3xl">🎬</Text>
          <Heading as="h1" size="lg" color="text.primary">
            Movie Review App
          </Heading>
          <Heading as="h2" size="md" color="text.secondary" fontWeight="normal">
            Xác nhận Email
          </Heading>
        </VStack>

        <VStack spacing={6} py={4}>
          <Center>
            {isLoading ? (
              <Spinner size="xl" color="blue.500" thickness="4px" />
            ) : (
              getStatusIcon()
            )}
          </Center>

          <VStack spacing={3}>
            {isLoading ? (
              <Text color="text.secondary" fontSize="lg">
                Đang xác nhận email của bạn...
              </Text>
            ) : (
              <>
                <Heading size="md" color={getStatusColor()}>
                  {getStatusTitle()}
                </Heading>
                <Text color="text.secondary" fontSize="md" textAlign="center">
                  {message}
                </Text>
              </>
            )}
          </VStack>

          <VStack spacing={4} pt={4}>
            {status === "success" && (
              <VStack spacing={4}>
                <Text color="green.500" fontSize="sm" fontStyle="italic">
                  Bạn sẽ được chuyển hướng đến trang đăng nhập trong giây lát...
                </Text>
                <Button
                  as={RouterLink}
                  to="/login"
                  bg="brand.accent"
                  color="white"
                  _hover={{ bg: "brand.accentDark" }}
                  size="lg"
                  px={8}
                >
                  Đăng nhập ngay
                </Button>
              </VStack>
            )}

            {(status === "already_verified" || status === "success") && (
              <Button
                as={RouterLink}
                to="/login"
                bg="brand.accent"
                color="white"
                _hover={{ bg: "brand.accentDark" }}
                size="lg"
                px={8}
              >
                Đăng nhập ngay
              </Button>
            )}

            {status === "expired" && (
              <VStack spacing={4}>
                <Text color="orange.500" fontSize="sm" fontStyle="italic">
                  Token xác nhận đã hết hạn. Vui lòng yêu cầu gửi lại email mới.
                </Text>
                <HStack
                  spacing={4}
                  flexWrap="wrap"
                  justify="center"
                  flexDirection={{ base: "column", sm: "row" }}
                >
                  <Button
                    as={RouterLink}
                    to="/login"
                    variant="outline"
                    colorScheme="gray"
                    size="md"
                  >
                    Về trang đăng nhập
                  </Button>
                  <Button
                    as={RouterLink}
                    to="/resend-verification"
                    bg="orange.500"
                    color="white"
                    _hover={{ bg: "orange.600" }}
                    size="md"
                  >
                    Gửi lại email xác nhận
                  </Button>
                </HStack>
              </VStack>
            )}

            {(status === "error" || status === "invalid") && (
              <HStack
                spacing={4}
                flexWrap="wrap"
                justify="center"
                flexDirection={{ base: "column", sm: "row" }}
              >
                <Button
                  as={RouterLink}
                  to="/login"
                  variant="outline"
                  colorScheme="gray"
                  size="md"
                >
                  Về trang đăng nhập
                </Button>
                <Button
                  as={RouterLink}
                  to="/resend-verification"
                  bg="brand.accent"
                  color="white"
                  _hover={{ bg: "brand.accentDark" }}
                  size="md"
                >
                  Gửi lại email xác nhận
                </Button>
              </HStack>
            )}

            {status === "verifying" && (
              <Text color="blue.500" fontSize="sm" fontStyle="italic">
                Vui lòng đợi trong giây lát...
              </Text>
            )}
          </VStack>
        </VStack>

        <Box pt={4} borderTop="1px" borderColor="gray.200" width="100%">
          <Text color="text.secondary" fontSize="sm">
            <ChakraLink
              as={RouterLink}
              to="/"
              color="brand.accent"
              fontWeight="medium"
              _hover={{ textDecoration: "underline" }}
            >
              Về trang chủ
            </ChakraLink>
          </Text>
        </Box>
      </VStack>
    </MotionBox>
  );
};

export default EmailVerificationPage;
