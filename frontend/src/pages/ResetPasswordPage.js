import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link as RouterLink } from "react-router-dom";
import axios from "axios";
import {
  Box,
  Button,
  Heading,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Text,
  Link as ChakraLink,
  useToast,
  FormErrorMessage,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Icon,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from "@chakra-ui/react";
import { LockIcon, ViewIcon, ViewOffIcon, CheckIcon } from "@chakra-ui/icons";
import { motion } from "framer-motion";

const MotionBox = motion(Box);

const BACKEND_API_URL =
  process.env.REACT_APP_BACKEND_API_URL || "http://localhost:5001";

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [status, setStatus] = useState("idle"); // idle, loading, success, error
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!token) {
      toast({
        title: "Link không hợp lệ",
        description: "Token đặt lại mật khẩu không tồn tại",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      navigate("/forgot-password");
    }
  }, [token, navigate, toast]);

  const validateForm = () => {
    const newErrors = {};

    if (!password) {
      newErrors.password = "Mật khẩu là bắt buộc";
    } else if (password.length < 6) {
      newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Xác nhận mật khẩu là bắt buộc";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setStatus("loading");
    setMessage("");
    setErrors({});

    try {
      const response = await axios.post(
        `${BACKEND_API_URL}/auth/reset-password/${token}`,
        { password, confirmPassword }
      );

      setStatus("success");
      setMessage(response.data.message);

      toast({
        title: "Đặt lại mật khẩu thành công!",
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
              "Mật khẩu đã được đổi thành công. Hãy đăng nhập với mật khẩu mới!",
          },
        });
      }, 3000);
    } catch (error) {
      setStatus("error");
      const errorMessage =
        error.response?.data?.message ||
        "Có lỗi xảy ra khi đặt lại mật khẩu. Vui lòng thử lại sau.";

      setMessage(errorMessage);
      toast({
        title: "Đặt lại mật khẩu thất bại",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleInputChange = (field, value) => {
    if (field === "password") {
      setPassword(value);
      if (errors.password) {
        setErrors({ ...errors, password: "" });
      }
    } else if (field === "confirmPassword") {
      setConfirmPassword(value);
      if (errors.confirmPassword) {
        setErrors({ ...errors, confirmPassword: "" });
      }
    }
  };

  if (status === "success") {
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
          width={{ base: "90%", sm: "450px" }}
          border="1px"
          borderColor="brand.700"
        >
          <VStack spacing={2}>
            <Text fontSize="3xl">🎬</Text>
            <Heading as="h1" size="lg" color="text.primary">
              Movie Review App
            </Heading>
          </VStack>

          <VStack spacing={6} py={4}>
            <Icon as={CheckIcon} boxSize={16} color="green.500" />
            <VStack spacing={3}>
              <Heading size="md" color="green.500">
                Đặt lại mật khẩu thành công!
              </Heading>
              <Text color="text.secondary" fontSize="md" textAlign="center">
                {message}
              </Text>
            </VStack>

            <Alert status="success" borderRadius="md">
              <AlertIcon />
              <Box>
                <AlertTitle fontSize="sm">Hoàn tất!</AlertTitle>
                <AlertDescription fontSize="sm">
                  Bạn sẽ được chuyển hướng đến trang đăng nhập trong giây lát...
                </AlertDescription>
              </Box>
            </Alert>

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
        </VStack>
      </MotionBox>
    );
  }

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
        width={{ base: "90%", sm: "450px" }}
        border="1px"
        borderColor="brand.700"
      >
        <VStack spacing={2}>
          <Text fontSize="3xl">🎬</Text>
          <Heading as="h1" size="lg" color="text.primary">
            Movie Review App
          </Heading>
          <Heading as="h2" size="md" color="text.secondary" fontWeight="normal">
            Đặt lại mật khẩu
          </Heading>
          <Text color="text.secondary" fontSize="sm" textAlign="center">
            Nhập mật khẩu mới cho tài khoản của bạn
          </Text>
        </VStack>

        <form onSubmit={handleSubmit} style={{ width: "100%" }}>
          <VStack spacing={6}>
            <FormControl isRequired isInvalid={!!errors.password}>
              <FormLabel>Mật khẩu mới</FormLabel>
              <InputGroup size="md">
                <InputLeftElement pointerEvents="none">
                  <LockIcon color="gray.500" />
                </InputLeftElement>
                <Input
                  pr="4.5rem"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
                  disabled={status === "loading"}
                />
                <InputRightElement width="4.5rem">
                  <Button
                    h="1.75rem"
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <ViewOffIcon /> : <ViewIcon />}
                  </Button>
                </InputRightElement>
              </InputGroup>
              {errors.password && (
                <FormErrorMessage>{errors.password}</FormErrorMessage>
              )}
            </FormControl>

            <FormControl isRequired isInvalid={!!errors.confirmPassword}>
              <FormLabel>Xác nhận mật khẩu mới</FormLabel>
              <InputGroup size="md">
                <InputLeftElement pointerEvents="none">
                  <LockIcon color="gray.500" />
                </InputLeftElement>
                <Input
                  pr="4.5rem"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) =>
                    handleInputChange("confirmPassword", e.target.value)
                  }
                  placeholder="Nhập lại mật khẩu mới"
                  disabled={status === "loading"}
                />
                <InputRightElement width="4.5rem">
                  <Button
                    h="1.75rem"
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <ViewOffIcon /> : <ViewIcon />}
                  </Button>
                </InputRightElement>
              </InputGroup>
              {errors.confirmPassword && (
                <FormErrorMessage>{errors.confirmPassword}</FormErrorMessage>
              )}
            </FormControl>

            {status === "error" && (
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                <AlertDescription fontSize="sm">{message}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              bg="brand.accent"
              color="white"
              _hover={{ bg: "brand.accentDark" }}
              width="full"
              size="lg"
              isLoading={status === "loading"}
              loadingText="Đang đặt lại..."
            >
              Đặt lại mật khẩu
            </Button>
          </VStack>
        </form>

        <Box pt={4} borderTop="1px" borderColor="gray.200" width="100%">
          <VStack spacing={2}>
            <Text color="text.secondary" fontSize="sm">
              Nhớ mật khẩu rồi?{" "}
              <ChakraLink
                as={RouterLink}
                to="/login"
                color="brand.accent"
                fontWeight="medium"
                _hover={{ textDecoration: "underline" }}
              >
                Đăng nhập
              </ChakraLink>
            </Text>
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
          </VStack>
        </Box>
      </VStack>
    </MotionBox>
  );
};

export default ResetPasswordPage;
