import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  Box,
  Center,
  Spinner,
  VStack,
  Text,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from "@chakra-ui/react";

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <Center h="100vh">
        <VStack spacing={4}>
          <Spinner size="xl" color="brand.accent" />
          <Text>Đang kiểm tra quyền truy cập...</Text>
        </VStack>
      </Center>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Show access denied if user is not admin
  if (user.role !== "admin") {
    return (
      <Center h="100vh" p={6}>
        <Box maxW="md" w="full">
          <Alert
            status="error"
            variant="subtle"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            textAlign="center"
            height="200px"
            borderRadius="lg"
          >
            <AlertIcon boxSize="40px" mr={0} />
            <AlertTitle mt={4} mb={1} fontSize="lg">
              🚫 Truy cập bị từ chối
            </AlertTitle>
            <AlertDescription maxWidth="sm">
              Bạn không có quyền truy cập vào khu vực admin. Vui lòng liên hệ
              quản trị viên nếu bạn cần quyền truy cập.
            </AlertDescription>
          </Alert>
        </Box>
      </Center>
    );
  }

  // User is admin, render protected component
  return children;
};

export default AdminRoute;
