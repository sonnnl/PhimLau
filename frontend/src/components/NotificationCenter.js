import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  IconButton,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverCloseButton,
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  Divider,
  useColorModeValue,
  useToast,
  Avatar,
  SimpleGrid,
  useDisclosure,
} from "@chakra-ui/react";
import { FiBell, FiCheck, FiX, FiExternalLink } from "react-icons/fi";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const socket = useRef(null);
  const { user, token } = useAuth();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const navigate = useNavigate();

  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  useEffect(() => {
    if (user && token) {
      fetchNotifications();
      initializeSocket();
    }

    return () => {
      if (socket.current) {
        socket.current.disconnect();
      }
    };
  }, [user, token]);

  const initializeSocket = () => {
    if (!token) return;

    try {
      socket.current = io(
        process.env.REACT_APP_API_URL || "http://localhost:5001",
        {
          auth: {
            token: token,
          },
          transports: ["websocket", "polling"],
        }
      );

      socket.current.on("connect", () => {
        console.log("🔌 Connected to notification socket");
        window.socket = socket.current; // Store for admin test
      });

      socket.current.on("notification", (notification) => {
        console.log("📢 New notification received:", notification);

        // Add to notifications list
        setNotifications((prev) => [notification, ...prev]);
        setUnreadCount((prev) => prev + 1);

        // Show toast notification
        toast({
          title: notification.title,
          description: notification.message,
          status: getToastStatus(notification.type),
          duration: 5000,
          isClosable: true,
          position: "top-right",
          variant: "left-accent",
        });
      });

      socket.current.on("disconnect", () => {
        console.log("❌ Disconnected from notification socket");
      });

      socket.current.on("connect_error", (error) => {
        console.error("🔥 Socket connection error:", error);
      });
    } catch (error) {
      console.error("Error initializing socket:", error);
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/notifications", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setNotifications(data.data.notifications);
        setUnreadCount(data.data.unreadCount);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(
        `/api/notifications/${notificationId}/read`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            device: "web",
            ip: "auto",
          }),
        }
      );

      if (response.ok) {
        // Update local state
        setNotifications((prev) =>
          prev.map((notif) =>
            notif.id === notificationId || notif._id === notificationId
              ? { ...notif, isRead: true, readAt: new Date() }
              : notif
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));

        // Emit to socket for admin tracking
        if (socket.current) {
          socket.current.emit("notification_read", {
            notificationId,
            readAt: new Date(),
          });
        }
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleNotificationClick = (notification) => {
    // Mark as read
    if (!notification.isRead) {
      markAsRead(notification.id || notification._id);
    }

    // Navigate if has action URL
    if (notification.metadata?.actionUrl) {
      navigate(notification.metadata.actionUrl);
      onClose();
    }
  };

  const getToastStatus = (type) => {
    const statusMap = {
      info: "info",
      success: "success",
      warning: "warning",
      error: "error",
      announcement: "info",
    };
    return statusMap[type] || "info";
  };

  const getNotificationIcon = (notification) => {
    return notification.metadata?.icon || "🔔";
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return "Vừa xong";
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
    if (diffInMinutes < 1440)
      return `${Math.floor(diffInMinutes / 60)} giờ trước`;
    return `${Math.floor(diffInMinutes / 1440)} ngày trước`;
  };

  const getBadgeColor = (type) => {
    const colors = {
      info: "blue",
      success: "green",
      warning: "orange",
      error: "red",
      announcement: "purple",
    };
    return colors[type] || "gray";
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter((n) => !n.isRead);

      for (const notification of unreadNotifications) {
        await markAsRead(notification.id || notification._id);
      }

      toast({
        title: "✅ Đã đánh dấu tất cả là đã đọc",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  if (!user) return null;

  return (
    <Popover
      isOpen={isOpen}
      onOpen={onOpen}
      onClose={onClose}
      placement="bottom-end"
    >
      <PopoverTrigger>
        <Box position="relative">
          <IconButton
            icon={<FiBell />}
            variant="ghost"
            size="md"
            aria-label="Thông báo"
            position="relative"
          />
          {unreadCount > 0 && (
            <Badge
              position="absolute"
              top="-1"
              right="-1"
              colorScheme="red"
              borderRadius="full"
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
        bg={bgColor}
        border={`1px solid ${borderColor}`}
      >
        <PopoverHeader borderBottomWidth="1px">
          <HStack justify="space-between">
            <Text fontWeight="bold">📢 Thông báo ({unreadCount} chưa đọc)</Text>
            <HStack>
              {unreadCount > 0 && (
                <Button size="xs" variant="ghost" onClick={markAllAsRead}>
                  <FiCheck /> Đánh dấu tất cả
                </Button>
              )}
              <PopoverCloseButton position="relative" />
            </HStack>
          </HStack>
        </PopoverHeader>

        <PopoverBody p={0}>
          <VStack spacing={0} maxH="400px" overflowY="auto">
            {loading ? (
              <Box p={4}>
                <Text color="gray.500">Đang tải...</Text>
              </Box>
            ) : notifications.length === 0 ? (
              <Box p={6} textAlign="center">
                <Text color="gray.500">🔕 Chưa có thông báo nào</Text>
              </Box>
            ) : (
              notifications.map((notification, index) => (
                <Box
                  key={notification.id || notification._id || index}
                  w="full"
                >
                  <Box
                    p={3}
                    cursor="pointer"
                    _hover={{ bg: useColorModeValue("gray.50", "gray.700") }}
                    bg={
                      notification.isRead
                        ? "transparent"
                        : useColorModeValue("blue.50", "blue.900")
                    }
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <HStack align="start" spacing={3}>
                      <Text fontSize="lg">
                        {getNotificationIcon(notification)}
                      </Text>

                      <VStack align="start" flex={1} spacing={1}>
                        <HStack justify="space-between" w="full">
                          <Text fontWeight="medium" fontSize="sm" noOfLines={2}>
                            {notification.title}
                          </Text>
                          <Badge
                            size="sm"
                            colorScheme={getBadgeColor(notification.type)}
                            variant={notification.isRead ? "outline" : "solid"}
                          >
                            {notification.type}
                          </Badge>
                        </HStack>

                        <Text fontSize="xs" color="gray.500" noOfLines={2}>
                          {notification.message}
                        </Text>

                        <HStack justify="space-between" w="full" mt={1}>
                          <Text fontSize="xs" color="gray.400">
                            {getTimeAgo(notification.createdAt)}
                          </Text>

                          {notification.metadata?.actionUrl && (
                            <HStack spacing={1}>
                              <FiExternalLink size="10px" />
                              <Text fontSize="xs" color="blue.500">
                                {notification.metadata?.actionText || "Xem"}
                              </Text>
                            </HStack>
                          )}
                        </HStack>
                      </VStack>

                      {!notification.isRead && (
                        <Box
                          w="8px"
                          h="8px"
                          bg="blue.500"
                          borderRadius="full"
                          mt={1}
                        />
                      )}
                    </HStack>
                  </Box>
                  {index < notifications.length - 1 && <Divider />}
                </Box>
              ))
            )}
          </VStack>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationCenter;
