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
} from "@chakra-ui/react";
import { FaGoogle } from "react-icons/fa";
import { EmailIcon, LockIcon } from "@chakra-ui/icons";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useState, useContext } from "react";
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
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const toast = useToast();

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
      toast({
        title: "Lỗi Đăng Nhập",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      setIsLoading(false);
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
