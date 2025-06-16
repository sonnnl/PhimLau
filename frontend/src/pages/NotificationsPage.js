import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Heading,
  VStack,
  HStack,
  Text,
  Button,
  Badge,
  Divider,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  Flex,
  Spacer,
  Select,
  useToast,
  useColorModeValue,
  Avatar,
  IconButton,
  Tooltip,
} from "@chakra-ui/react";
import { FiTrash2, FiCheck, FiCheckCircle, FiRefreshCw } from "react-icons/fi";
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getNotificationIcon,
} from "../services/notificationService";
import { useAuth } from "../contexts/AuthContext";
import Pagination from "../components/common/Pagination";

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [unreadCount, setUnreadCount] = useState(0);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    type: "",
    isRead: "",
  });
  const { user } = useAuth();
  const toast = useToast();

  // Theme colors
  const bg = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const textColor = useColorModeValue("gray.800", "white");
  const mutedTextColor = useColorModeValue("gray.600", "gray.400");
  const unreadBg = useColorModeValue("blue.50", "blue.900");
  const hoverBg = useColorModeValue("gray.50", "gray.700");

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user, filters]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await getUserNotifications(filters);
      setNotifications(response.data);
      setPagination(response.pagination);
      setUnreadCount(response.unreadCount);
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải thông báo",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.isRead) {
        await markNotificationAsRead(notification._id);
        setNotifications((prev) =>
          prev.map((n) =>
            n._id === notification._id ? { ...n, isRead: true } : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      if (notification.actionUrl) {
        window.location.href = notification.actionUrl;
      }
    } catch (error) {
      console.error("Error handling notification click:", error);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      toast({
        title: "Thành công",
        description: "Đã đánh dấu thông báo là đã đọc",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể đánh dấu thông báo",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast({
        title: "Thành công",
        description: "Đã đánh dấu tất cả thông báo là đã đọc",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể đánh dấu thông báo",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      await deleteNotification(notificationId);
      setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
      toast({
        title: "Thành công",
        description: "Đã xóa thông báo",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể xóa thông báo",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1,
    }));
  };

  const handlePageChange = (page) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return "Vừa xong";
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} phút trước`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
    return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
  };

  if (!user) {
    return (
      <Container maxW="container.md" py={8}>
        <Alert status="warning">
          <AlertIcon />
          Bạn cần đăng nhập để xem thông báo
        </Alert>
      </Container>
    );
  }

  return (
    <Box bg={bg} minH="100vh" py={8}>
      <Container maxW="container.md">
        <VStack spacing={6} align="stretch">
          <Flex align="center">
            <VStack align="start" spacing={1}>
              <Heading size="lg" color={textColor}>
                Thông báo
              </Heading>
              {unreadCount > 0 && (
                <Text fontSize="sm" color={mutedTextColor}>
                  {unreadCount} thông báo chưa đọc
                </Text>
              )}
            </VStack>
            <Spacer />
            <HStack spacing={2}>
              <Button
                leftIcon={<FiRefreshCw />}
                onClick={fetchNotifications}
                variant="outline"
                size="sm"
              >
                Làm mới
              </Button>
              {unreadCount > 0 && (
                <Button
                  leftIcon={<FiCheckCircle />}
                  onClick={handleMarkAllAsRead}
                  colorScheme="blue"
                  size="sm"
                >
                  Đánh dấu tất cả đã đọc
                </Button>
              )}
            </HStack>
          </Flex>

          <Box
            bg={cardBg}
            p={4}
            rounded="lg"
            shadow="sm"
            borderColor={borderColor}
            borderWidth="1px"
          >
            <HStack spacing={4} wrap="wrap">
              <Box>
                <Text fontSize="sm" mb={1} color={mutedTextColor}>
                  Loại thông báo
                </Text>
                <Select
                  size="sm"
                  value={filters.type}
                  onChange={(e) => handleFilterChange("type", e.target.value)}
                  minW="150px"
                >
                  <option value="">Tất cả</option>
                  <option value="thread_reply">Trả lời chủ đề</option>
                  <option value="thread_like">Thích chủ đề</option>
                  <option value="reply_like">Thích phản hồi</option>
                  <option value="mention">Nhắc đến</option>
                  <option value="system">Hệ thống</option>
                </Select>
              </Box>
              <Box>
                <Text fontSize="sm" mb={1} color={mutedTextColor}>
                  Trạng thái
                </Text>
                <Select
                  size="sm"
                  value={filters.isRead}
                  onChange={(e) => handleFilterChange("isRead", e.target.value)}
                  minW="120px"
                >
                  <option value="">Tất cả</option>
                  <option value="false">Chưa đọc</option>
                  <option value="true">Đã đọc</option>
                </Select>
              </Box>
            </HStack>
          </Box>

          <Box
            bg={cardBg}
            rounded="lg"
            shadow="sm"
            borderColor={borderColor}
            borderWidth="1px"
          >
            {loading ? (
              <Center py={12}>
                <Spinner size="lg" />
              </Center>
            ) : notifications.length === 0 ? (
              <Center py={12}>
                <VStack spacing={3}>
                  <Text fontSize="lg" color={mutedTextColor}>
                    🔔
                  </Text>
                  <Text color={mutedTextColor}>
                    {filters.type || filters.isRead
                      ? "Không có thông báo phù hợp"
                      : "Chưa có thông báo nào"}
                  </Text>
                </VStack>
              </Center>
            ) : (
              <VStack spacing={0} align="stretch">
                {notifications.map((notification, index) => (
                  <Box key={notification._id}>
                    <Box
                      p={4}
                      bg={notification.isRead ? "transparent" : unreadBg}
                      _hover={{ bg: hoverBg }}
                      transition="background 0.2s"
                    >
                      <HStack spacing={3} align="start">
                        <Text fontSize="xl" flexShrink={0}>
                          {getNotificationIcon(notification.type)}
                        </Text>

                        <VStack spacing={2} align="start" flex={1}>
                          <HStack spacing={2} w="full">
                            <Text
                              fontSize="sm"
                              fontWeight={
                                notification.isRead ? "normal" : "semibold"
                              }
                              color={textColor}
                              flex={1}
                              cursor={
                                notification.actionUrl ? "pointer" : "default"
                              }
                              onClick={() =>
                                handleNotificationClick(notification)
                              }
                              _hover={
                                notification.actionUrl
                                  ? { textDecoration: "underline" }
                                  : {}
                              }
                            >
                              {notification.title}
                            </Text>
                            {!notification.isRead && (
                              <Badge colorScheme="blue" size="sm">
                                Mới
                              </Badge>
                            )}
                          </HStack>

                          <Text
                            fontSize="xs"
                            color={mutedTextColor}
                            cursor={
                              notification.actionUrl ? "pointer" : "default"
                            }
                            onClick={() =>
                              handleNotificationClick(notification)
                            }
                          >
                            {notification.message}
                          </Text>

                          <HStack
                            spacing={3}
                            fontSize="xs"
                            color={mutedTextColor}
                          >
                            <Text>{formatTimeAgo(notification.createdAt)}</Text>
                            {notification.sender && (
                              <>
                                <Text>•</Text>
                                <HStack spacing={1}>
                                  <Avatar
                                    size="2xs"
                                    src={notification.sender.avatarUrl}
                                    name={
                                      notification.sender.displayName ||
                                      notification.sender.username
                                    }
                                  />
                                  <Text>
                                    {notification.sender.displayName ||
                                      notification.sender.username}
                                  </Text>
                                </HStack>
                              </>
                            )}
                          </HStack>
                        </VStack>

                        <HStack spacing={1} flexShrink={0}>
                          {!notification.isRead && (
                            <Tooltip label="Đánh dấu đã đọc">
                              <IconButton
                                icon={<FiCheck />}
                                size="xs"
                                variant="ghost"
                                onClick={() =>
                                  handleMarkAsRead(notification._id)
                                }
                                aria-label="Đánh dấu đã đọc"
                              />
                            </Tooltip>
                          )}
                          <Tooltip label="Xóa thông báo">
                            <IconButton
                              icon={<FiTrash2 />}
                              size="xs"
                              variant="ghost"
                              colorScheme="red"
                              onClick={() =>
                                handleDeleteNotification(notification._id)
                              }
                              aria-label="Xóa thông báo"
                            />
                          </Tooltip>
                        </HStack>
                      </HStack>
                    </Box>
                    {index < notifications.length - 1 && (
                      <Divider borderColor={borderColor} />
                    )}
                  </Box>
                ))}
              </VStack>
            )}
          </Box>

          {pagination.totalPages > 1 && (
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
              totalItems={pagination.total}
            />
          )}
        </VStack>
      </Container>
    </Box>
  );
};

export default NotificationsPage;
