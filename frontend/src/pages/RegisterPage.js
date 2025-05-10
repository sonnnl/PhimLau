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
} from "@chakra-ui/react";
import {
  EmailIcon,
  LockIcon,
  ViewIcon,
  ViewOffIcon,
  AtSignIcon,
  InfoIcon,
} from "@chakra-ui/icons";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useState, useContext } from "react";
import { motion } from "framer-motion";
import { AuthContext } from "../contexts/AuthContext";
import axios from "axios";

const MotionBox = motion(Box);

const BACKEND_API_URL =
  process.env.REACT_APP_BACKEND_API_URL || "http://localhost:5001";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const toast = useToast();

  const validateForm = () => {
    const newErrors = {};
    if (!username.trim()) newErrors.username = "Username là bắt buộc";
    else if (username.trim().length < 3)
      newErrors.username = "Username phải có ít nhất 3 ký tự";
    if (!email.trim()) newErrors.email = "Email là bắt buộc";
    else if (!/\S+@\S+\.\S+/.test(email))
      newErrors.email = "Email không hợp lệ";
    if (!password) newErrors.password = "Mật khẩu là bắt buộc";
    else if (password.length < 6)
      newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
    if (password !== confirmPassword)
      newErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});
    try {
      const { data } = await axios.post(`${BACKEND_API_URL}/auth/register`, {
        username,
        email,
        password,
        displayName: displayName || username,
      });
      login(data.token);
      toast({
        title: "Đăng ký thành công!",
        description: "Chào mừng bạn đến với MyMovieApp.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      navigate("/");
    } catch (err) {
      const errorMessage =
        err.response && err.response.data && err.response.data.message
          ? err.response.data.message
          : "Đăng ký thất bại. Vui lòng thử lại.";
      if (errorMessage.toLowerCase().includes("exists")) {
        if (errorMessage.toLowerCase().includes("email")) {
          setErrors((prev) => ({ ...prev, email: errorMessage }));
        } else if (errorMessage.toLowerCase().includes("username")) {
          setErrors((prev) => ({ ...prev, username: errorMessage }));
        }
      }
      toast({
        title: "Lỗi Đăng Ký",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      setIsLoading(false);
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
        spacing={5}
        p={8}
        bg="background.secondary"
        borderRadius="lg"
        shadow="xl"
        textAlign="center"
        width={{ base: "90%", sm: "450px" }}
        border="1px"
        borderColor="brand.700"
      >
        <Heading as="h1" size="lg" color="text.primary" mb={4}>
          Tạo Tài Khoản
        </Heading>

        <form onSubmit={handleRegister} style={{ width: "100%" }}>
          <VStack spacing={4}>
            <FormControl id="displayName" isInvalid={!!errors.displayName}>
              <FormLabel>Tên hiển thị (Tùy chọn)</FormLabel>
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <InfoIcon color="gray.500" />
                </InputLeftElement>
                <Input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Nhập tên bạn muốn hiển thị"
                />
              </InputGroup>
              {errors.displayName && (
                <FormErrorMessage>{errors.displayName}</FormErrorMessage>
              )}
            </FormControl>

            <FormControl id="username" isRequired isInvalid={!!errors.username}>
              <FormLabel>Username</FormLabel>
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <AtSignIcon color="gray.500" />
                </InputLeftElement>
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Chọn một username"
                />
              </InputGroup>
              {errors.username && (
                <FormErrorMessage>{errors.username}</FormErrorMessage>
              )}
            </FormControl>

            <FormControl
              id="email-register"
              isRequired
              isInvalid={!!errors.email}
            >
              <FormLabel>Email</FormLabel>
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <EmailIcon color="gray.500" />
                </InputLeftElement>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Nhập địa chỉ email"
                />
              </InputGroup>
              {errors.email && (
                <FormErrorMessage>{errors.email}</FormErrorMessage>
              )}
            </FormControl>

            <FormControl
              id="password-register"
              isRequired
              isInvalid={!!errors.password}
            >
              <FormLabel>Mật khẩu</FormLabel>
              <InputGroup size="md">
                <InputLeftElement pointerEvents="none">
                  <LockIcon color="gray.500" />
                </InputLeftElement>
                <Input
                  pr="4.5rem"
                  type={showPassword ? "text" : "password"}
                  placeholder="Tạo mật khẩu (ít nhất 6 ký tự)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

            <FormControl
              id="confirmPassword"
              isRequired
              isInvalid={!!errors.confirmPassword}
            >
              <FormLabel>Xác nhận mật khẩu</FormLabel>
              <InputGroup size="md">
                <InputLeftElement pointerEvents="none">
                  <LockIcon color="gray.500" />
                </InputLeftElement>
                <Input
                  pr="4.5rem"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Nhập lại mật khẩu"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
              Đăng ký
            </Button>
          </VStack>
        </form>

        <Text color="text.secondary" fontSize="sm">
          Đã có tài khoản?{" "}
          <ChakraLink
            as={RouterLink}
            to="/login"
            color="brand.accent"
            fontWeight="medium"
          >
            Đăng nhập
          </ChakraLink>
        </Text>
      </VStack>
    </MotionBox>
  );
}
