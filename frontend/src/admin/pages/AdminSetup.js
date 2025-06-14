import React, { useState } from "react";
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Button,
  Text,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useToast,
  InputGroup,
  InputRightElement,
  IconButton,
} from "@chakra-ui/react";
import { FiEye, FiEyeOff, FiShield } from "react-icons/fi";
import { createFirstAdmin } from "../services/adminService";

const AdminSetup = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    displayName: "",
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const toast = useToast();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.username || !formData.email || !formData.password) {
      toast({
        title: "❌ Lỗi",
        description: "Vui lòng điền đầy đủ thông tin bắt buộc",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setLoading(true);

      const response = await createFirstAdmin({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        displayName: formData.displayName || formData.username,
      });

      setSuccess(true);
      toast({
        title: "🎉 Thành công!",
        description: response.message,
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      // Reset form
      setFormData({
        username: "",
        email: "",
        password: "",
        displayName: "",
      });
    } catch (error) {
      toast({
        title: "❌ Lỗi",
        description: error.message || "Không thể tạo admin",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Box p={6} maxW="500px" mx="auto" mt={10}>
        <Alert
          status="success"
          variant="subtle"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
          height="300px"
          borderRadius="lg"
        >
          <AlertIcon boxSize="40px" mr={0} />
          <AlertTitle mt={4} mb={1} fontSize="lg">
            🎉 Admin đã được tạo thành công!
          </AlertTitle>
          <AlertDescription maxWidth="sm" mt={2}>
            Bạn có thể đăng nhập với tài khoản admin vừa tạo. Hãy bookmark trang
            này hoặc đi đến trang đăng nhập.
          </AlertDescription>
          <Button
            as="a"
            href="/login"
            colorScheme="green"
            mt={4}
            leftIcon={<FiShield />}
          >
            Đăng nhập Admin
          </Button>
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={6} maxW="500px" mx="auto" mt={10}>
      <Card>
        <CardHeader textAlign="center" pb={2}>
          <VStack spacing={2}>
            <Box fontSize="3xl">🛡️</Box>
            <Heading size="lg" color="red.500">
              Tạo Admin Đầu Tiên
            </Heading>
            <Text fontSize="sm" color="gray.500">
              Chỉ có thể tạo nếu chưa có admin nào trong hệ thống
            </Text>
          </VStack>
        </CardHeader>

        <CardBody>
          <form onSubmit={handleSubmit}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Username</FormLabel>
                <Input
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="admin hoặc tên bạn thích"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Email</FormLabel>
                <Input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="admin@example.com"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Mật khẩu</FormLabel>
                <InputGroup>
                  <Input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Mật khẩu mạnh (tối thiểu 6 ký tự)"
                    minLength={6}
                  />
                  <InputRightElement>
                    <IconButton
                      variant="ghost"
                      icon={showPassword ? <FiEyeOff /> : <FiEye />}
                      onClick={() => setShowPassword(!showPassword)}
                      size="sm"
                      aria-label={
                        showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"
                      }
                    />
                  </InputRightElement>
                </InputGroup>
              </FormControl>

              <FormControl>
                <FormLabel>Tên hiển thị (tùy chọn)</FormLabel>
                <Input
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleChange}
                  placeholder="Tên đầy đủ của bạn"
                />
              </FormControl>

              <Alert status="warning" size="sm" borderRadius="md">
                <AlertIcon />
                <Box fontSize="sm">
                  <AlertTitle>Quan trọng!</AlertTitle>
                  <AlertDescription>
                    Hãy nhớ username và mật khẩu này. Admin có toàn quyền trên
                    hệ thống.
                  </AlertDescription>
                </Box>
              </Alert>

              <Button
                type="submit"
                colorScheme="red"
                isLoading={loading}
                loadingText="Đang tạo admin..."
                w="full"
                leftIcon={<FiShield />}
              >
                Tạo Admin Đầu Tiên
              </Button>
            </VStack>
          </form>
        </CardBody>
      </Card>

      <Text textAlign="center" mt={4} fontSize="sm" color="gray.500">
        Nếu admin đã tồn tại, endpoint này sẽ từ chối tạo.
      </Text>
    </Box>
  );
};

export default AdminSetup;
