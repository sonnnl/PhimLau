import React, { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
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
  Icon,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  HStack,
} from "@chakra-ui/react";
import { EmailIcon, CheckIcon } from "@chakra-ui/icons";
import { motion } from "framer-motion";

const MotionBox = motion(Box);

const BACKEND_API_URL =
  process.env.REACT_APP_BACKEND_API_URL || "http://localhost:5001";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle, loading, success, error
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({});
  const toast = useToast();

  const validateForm = () => {
    const newErrors = {};

    if (!email) {
      newErrors.email = "Email là bắt buộc";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email không hợp lệ";
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
        `${BACKEND_API_URL}/auth/forgot-password`,
        { email }
      );

      setStatus("success");
      setMessage(response.data.message);

      toast({
        title: "Email đã được gửi!",
        description: response.data.message,
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      setStatus("error");
      const errorMessage =
        error.response?.data?.message ||
        "Có lỗi xảy ra khi gửi email. Vui lòng thử lại sau.";

      setMessage(errorMessage);
      toast({
        title: "Gửi email thất bại",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleInputChange = (e) => {
    setEmail(e.target.value);
    // Xóa lỗi khi user bắt đầu nhập
    if (errors.email) {
      setErrors({ ...errors, email: "" });
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
            Quên mật khẩu
          </Heading>
          <Text color="text.secondary" fontSize="sm" textAlign="center">
            Nhập email của bạn để nhận link đặt lại mật khẩu
          </Text>
        </VStack>

        {status === "success" ? (
          <VStack spacing={6} py={4}>
            <Icon as={CheckIcon} boxSize={16} color="green.500" />
            <VStack spacing={3}>
              <Heading size="md" color="green.500">
                Email đã được gửi!
              </Heading>
              <Text color="text.secondary" fontSize="md" textAlign="center">
                {message}
              </Text>
            </VStack>

            <Alert status="success" borderRadius="md">
              <AlertIcon />
              <Box>
                <AlertTitle fontSize="sm">Hướng dẫn:</AlertTitle>
                <AlertDescription fontSize="sm">
                  Vui lòng kiểm tra hộp thư email của bạn và click vào link đặt
                  lại mật khẩu.
                </AlertDescription>
              </Box>
            </Alert>

            <Alert status="warning" borderRadius="md">
              <AlertIcon />
              <AlertDescription fontSize="sm">
                ⏰ Link sẽ hết hạn sau 10 phút
              </AlertDescription>
            </Alert>

            <HStack spacing={4} flexWrap="wrap" justify="center">
              <Button
                as={RouterLink}
                to="/login"
                bg="brand.accent"
                color="white"
                _hover={{ bg: "brand.accentDark" }}
                size="md"
              >
                Về trang đăng nhập
              </Button>
              <Button
                onClick={() => setStatus("idle")}
                variant="outline"
                colorScheme="gray"
                size="md"
              >
                Gửi lại email khác
              </Button>
            </HStack>
          </VStack>
        ) : (
          <form onSubmit={handleSubmit} style={{ width: "100%" }}>
            <VStack spacing={6}>
              <FormControl isRequired isInvalid={!!errors.email}>
                <FormLabel>Email</FormLabel>
                <InputGroup>
                  <InputLeftElement pointerEvents="none">
                    <EmailIcon color="gray.500" />
                  </InputLeftElement>
                  <Input
                    type="email"
                    value={email}
                    onChange={handleInputChange}
                    placeholder="Nhập địa chỉ email của bạn"
                    disabled={status === "loading"}
                  />
                </InputGroup>
                {errors.email && (
                  <FormErrorMessage>{errors.email}</FormErrorMessage>
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
                loadingText="Đang gửi..."
              >
                Gửi link đặt lại mật khẩu
              </Button>
            </VStack>
          </form>
        )}

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
              Chưa có tài khoản?{" "}
              <ChakraLink
                as={RouterLink}
                to="/register"
                color="brand.accent"
                fontWeight="medium"
                _hover={{ textDecoration: "underline" }}
              >
                Đăng ký ngay
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

export default ForgotPasswordPage;
