import React from "react";
import {
  Box,
  Spinner,
  Alert,
  AlertIcon,
  Button,
  Text,
  VStack,
  Icon,
} from "@chakra-ui/react";
import { FiRefreshCw, FiAlertTriangle } from "react-icons/fi";

/**
 * ===== LOADING STATE COMPONENT =====
 * Component hiển thị loading state cho forum
 */
export const ForumLoadingState = ({ message = "Đang tải..." }) => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      height="300px"
      gap={4}
    >
      <Spinner size="xl" color="brand.accent" thickness="4px" speed="0.65s" />
      <Text color="gray.400" fontSize="sm">
        {message}
      </Text>
    </Box>
  );
};

/**
 * ===== ERROR STATE COMPONENT =====
 * Component hiển thị error state cho forum với retry option
 */
export const ForumErrorState = ({
  error,
  onRetry,
  retryText = "Thử lại",
  showRetryButton = true,
}) => {
  return (
    <Alert
      status="error"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      textAlign="center"
      height="200px"
      borderRadius="md"
      variant="subtle"
    >
      <Icon as={FiAlertTriangle} boxSize="40px" mr={0} />
      <AlertIcon />
      <VStack spacing={3} mt={4}>
        <Text fontWeight="bold">Có lỗi xảy ra</Text>
        <Text fontSize="sm" color="gray.600">
          {error || "Không thể tải dữ liệu diễn đàn"}
        </Text>
        {showRetryButton && onRetry && (
          <Button
            leftIcon={<FiRefreshCw />}
            colorScheme="red"
            variant="outline"
            size="sm"
            onClick={onRetry}
          >
            {retryText}
          </Button>
        )}
      </VStack>
    </Alert>
  );
};

/**
 * ===== EMPTY STATE COMPONENT =====
 * Component hiển thị khi không có dữ liệu
 */
export const ForumEmptyState = ({
  title = "Không có dữ liệu",
  description = "Hiện chưa có nội dung nào.",
  icon = FiAlertTriangle,
  children,
}) => {
  return (
    <Box textAlign="center" py={10} px={6}>
      <Icon as={icon} boxSize="50px" color="gray.500" mb={4} />
      <Text fontSize="xl" fontWeight="bold" color="gray.600" mb={2}>
        {title}
      </Text>
      <Text color="gray.500" mb={6}>
        {description}
      </Text>
      {children}
    </Box>
  );
};
