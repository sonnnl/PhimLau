import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  IconButton,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverFooter,
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  Divider,
  Avatar,
  useToast,
  Spinner,
  Center,
  Link,
  useColorModeValue,
} from "@chakra-ui/react";
import { FiBell } from "react-icons/fi";
import { Link as RouterLink } from "react-router-dom";
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getNotificationIcon,
  getNotificationColor,
} from "../../services/notificationService";
import { useAuth } from "../../contexts/AuthContext";

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const toast = useToast();
  const intervalRef = useRef(null);

  // Theme colors
  const bg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const textColor = useColorModeValue("gray.800", "white");
  const mutedTextColor = useColorModeValue("gray.600", "gray.400");
  const hoverBg = useColorModeValue("gray.50", "gray.700");
  const unreadBg = useColorModeValue("blue.50", "blue.900");

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Poll for new notifications every 30 seconds
      intervalRef.current = setInterval(fetchNotifications, 30000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const response = await getUserNotifications({ limit: 10 });
      setNotifications(response.data);
      setUnreadCount(response.unreadCount);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      // Mark as read if not already read
      if (!notification.isRead) {
        await markNotificationAsRead(notification._id);
        setNotifications((prev) =>
          prev.map((n) =>
            n._id === notification._id ? { ...n, isRead: true } : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      // Navigate to action URL if available
      if (notification.actionUrl) {
        window.location.href = notification.actionUrl;
      }
    } catch (error) {
      console.error("Error handling notification click:", error);
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

  if (!user) return null;

  return (
    <Popover
      isOpen={isOpen}
      onOpen={() => setIsOpen(true)}
      onClose={() => setIsOpen(false)}
      placement="bottom-end"
    >
      <PopoverTrigger>
        <Box position="relative">
          <IconButton
            icon={<FiBell />}
            variant="ghost"
            size="md"
            aria-label="Thông báo"
            _hover={{ bg: "gray.100" }}
          />
          {unreadCount > 0 && (
            <Badge
              colorScheme="red"
              variant="solid"
              borderRadius="full"
              position="absolute"
              top="-1"
              right="-1"
              fontSize="xs"
              minW="18px"
              h="18px"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Box>
      </PopoverTrigger>

      <PopoverContent
        w="400px"
        maxH="500px"
        bg={bg}
        borderColor={borderColor}
        shadow="lg"
      >
        <PopoverHeader
          borderBottomColor={borderColor}
          display="flex"
          justifyContent="space-between"
          alignItems="center"
        >
          <Text fontWeight="semibold" color={textColor}>
            Thông báo
          </Text>
          {unreadCount > 0 && (
            <Button
              size="xs"
              variant="ghost"
              onClick={handleMarkAllAsRead}
              color="blue.500"
            >
              Đánh dấu tất cả đã đọc
            </Button>
          )}
        </PopoverHeader>

        <PopoverBody p={0} maxH="350px" overflowY="auto">
          {isLoading ? (
            <Center py={8}>
              <Spinner size="md" />
            </Center>
          ) : notifications.length === 0 ? (
            <Center py={8}>
              <Text color={mutedTextColor}>Không có thông báo nào</Text>
            </Center>
          ) : (
            <VStack spacing={0} align="stretch">
              {notifications.map((notification, index) => (
                <Box key={notification._id}>
                  <Box
                    p={3}
                    cursor="pointer"
                    _hover={{ bg: hoverBg }}
                    onClick={() => handleNotificationClick(notification)}
                    bg={notification.isRead ? "transparent" : unreadBg}
                  >
                    <HStack spacing={3} align="start">
                      <Text fontSize="lg">
                        {getNotificationIcon(notification.type)}
                      </Text>
                      <VStack spacing={1} align="start" flex={1}>
                        <Text
                          fontSize="sm"
                          fontWeight={
                            notification.isRead ? "normal" : "semibold"
                          }
                          color={textColor}
                          noOfLines={2}
                        >
                          {notification.title}
                        </Text>
                        <Text
                          fontSize="xs"
                          color={mutedTextColor}
                          noOfLines={2}
                        >
                          {notification.message}
                        </Text>
                        <Text fontSize="xs" color={mutedTextColor}>
                          {formatTimeAgo(notification.createdAt)}
                        </Text>
                      </VStack>
                      {!notification.isRead && (
                        <Box
                          w="8px"
                          h="8px"
                          borderRadius="full"
                          bg="blue.500"
                          flexShrink={0}
                        />
                      )}
                    </HStack>
                  </Box>
                  {index < notifications.length - 1 && (
                    <Divider borderColor={borderColor} />
                  )}
                </Box>
              ))}
            </VStack>
          )}
        </PopoverBody>

        {notifications.length > 0 && (
          <PopoverFooter borderTopColor={borderColor}>
            <Link
              as={RouterLink}
              to="/notifications"
              fontSize="sm"
              color="blue.500"
              textAlign="center"
              display="block"
            >
              Xem tất cả thông báo
            </Link>
          </PopoverFooter>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
