import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  Button,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Badge,
  Text,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Icon,
  useColorModeValue,
} from "@chakra-ui/react";
import {
  FiBell,
  FiSend,
  FiUsers,
  FiCheck,
  FiClock,
  FiActivity,
} from "react-icons/fi";

const AdminNotifications = () => {
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "info",
    sendType: "all",
    targetRole: "user",
    expiresAt: "",
    icon: "🔔",
    color: "blue",
    actionUrl: "",
    actionText: "",
  });
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState({});
  const toast = useToast();
  const cardBg = useColorModeValue("white", "gray.800");

  useEffect(() => {
    fetchNotifications();
    fetchStats();
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("movieAppToken");
      const response = await fetch("/api/admin/notifications", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setNotifications(data.data.notifications);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("movieAppToken");
      const response = await fetch("/api/admin/notifications/stats", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.message) {
      toast({
        title: "❌ Lỗi",
        description: "Vui lòng điền tiêu đề và nội dung",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("movieAppToken");

      const response = await fetch("/api/admin/notifications/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          metadata: {
            icon: formData.icon,
            color: formData.color,
            actionUrl: formData.actionUrl,
            actionText: formData.actionText,
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "🎉 Thành công!",
          description: data.message,
          status: "success",
          duration: 3000,
          isClosable: true,
        });

        // Reset form
        setFormData({
          title: "",
          message: "",
          type: "info",
          sendType: "all",
          targetRole: "user",
          expiresAt: "",
          icon: "🔔",
          color: "blue",
          actionUrl: "",
          actionText: "",
        });

        fetchNotifications();
        fetchStats();
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast({
        title: "❌ Lỗi",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const sendTestNotification = () => {
    // Emit test notification via Socket.IO if connected
    if (window.socket) {
      window.socket.emit("admin_test_notification", {
        message: "Test notification từ admin panel!",
      });

      toast({
        title: "🧪 Test sent",
        description: "Đã gửi test notification",
        status: "info",
        duration: 2000,
        isClosable: true,
      });
    } else {
      toast({
        title: "❌ Socket.IO chưa kết nối",
        description: "Không thể gửi test notification",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("vi-VN");
  };

  const getTypeColor = (type) => {
    const colors = {
      info: "blue",
      success: "green",
      warning: "orange",
      error: "red",
      announcement: "purple",
    };
    return colors[type] || "gray";
  };

  return (
    <Box p={6} maxW="1400px" mx="auto">
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Box>
          <Heading size="xl" color="brand.accent" mb={2}>
            📢 Quản lý Thông báo
          </Heading>
          <Text color="gray.500">Gửi thông báo real-time cho users</Text>
        </Box>

        {/* Stats */}
        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6}>
          <Card bg={cardBg}>
            <CardBody>
              <Stat>
                <HStack justify="space-between">
                  <Box>
                    <StatLabel>Tổng thông báo</StatLabel>
                    <StatNumber color="blue.500">{stats.total || 0}</StatNumber>
                    <StatHelpText>Tất cả</StatHelpText>
                  </Box>
                  <Icon as={FiBell} boxSize="30px" color="blue.400" />
                </HStack>
              </Stat>
            </CardBody>
          </Card>

          <Card bg={cardBg}>
            <CardBody>
              <Stat>
                <HStack justify="space-between">
                  <Box>
                    <StatLabel>Đang hoạt động</StatLabel>
                    <StatNumber color="green.500">
                      {stats.active || 0}
                    </StatNumber>
                    <StatHelpText>Active</StatHelpText>
                  </Box>
                  <Icon as={FiCheck} boxSize="30px" color="green.400" />
                </HStack>
              </Stat>
            </CardBody>
          </Card>

          <Card bg={cardBg}>
            <CardBody>
              <Stat>
                <HStack justify="space-between">
                  <Box>
                    <StatLabel>Tuần này</StatLabel>
                    <StatNumber color="orange.500">
                      {stats.recent || 0}
                    </StatNumber>
                    <StatHelpText>7 ngày qua</StatHelpText>
                  </Box>
                  <Icon as={FiClock} boxSize="30px" color="orange.400" />
                </HStack>
              </Stat>
            </CardBody>
          </Card>

          <Card bg={cardBg}>
            <CardBody>
              <Stat>
                <HStack justify="space-between">
                  <Box>
                    <StatLabel>Users online</StatLabel>
                    <StatNumber color="purple.500">5</StatNumber>
                    <StatHelpText>Hiện tại</StatHelpText>
                  </Box>
                  <Icon as={FiUsers} boxSize="30px" color="purple.400" />
                </HStack>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Tabs */}
        <Tabs>
          <TabList>
            <Tab>📝 Gửi thông báo</Tab>
            <Tab>📋 Lịch sử</Tab>
            <Tab>🧪 Test</Tab>
          </TabList>

          <TabPanels>
            {/* Send Notification Tab */}
            <TabPanel p={0} pt={6}>
              <Card bg={cardBg}>
                <CardHeader>
                  <Heading size="md">Gửi thông báo mới</Heading>
                </CardHeader>
                <CardBody>
                  <form onSubmit={handleSubmit}>
                    <VStack spacing={4}>
                      <HStack spacing={4} w="full">
                        <FormControl isRequired>
                          <FormLabel>Tiêu đề</FormLabel>
                          <Input
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="Tiêu đề thông báo"
                          />
                        </FormControl>

                        <FormControl>
                          <FormLabel>Icon</FormLabel>
                          <Input
                            name="icon"
                            value={formData.icon}
                            onChange={handleChange}
                            placeholder="🔔"
                            maxW="100px"
                          />
                        </FormControl>
                      </HStack>

                      <FormControl isRequired>
                        <FormLabel>Nội dung</FormLabel>
                        <Textarea
                          name="message"
                          value={formData.message}
                          onChange={handleChange}
                          placeholder="Nội dung thông báo..."
                          rows={4}
                        />
                      </FormControl>

                      <HStack spacing={4} w="full">
                        <FormControl>
                          <FormLabel>Loại</FormLabel>
                          <Select
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                          >
                            <option value="info">Thông tin</option>
                            <option value="success">Thành công</option>
                            <option value="warning">Cảnh báo</option>
                            <option value="error">Lỗi</option>
                            <option value="announcement">
                              Thông báo quan trọng
                            </option>
                          </Select>
                        </FormControl>

                        <FormControl>
                          <FormLabel>Gửi đến</FormLabel>
                          <Select
                            name="sendType"
                            value={formData.sendType}
                            onChange={handleChange}
                          >
                            <option value="all">Tất cả users</option>
                            <option value="role">Theo role</option>
                          </Select>
                        </FormControl>

                        {formData.sendType === "role" && (
                          <FormControl>
                            <FormLabel>Role</FormLabel>
                            <Select
                              name="targetRole"
                              value={formData.targetRole}
                              onChange={handleChange}
                            >
                              <option value="user">User</option>
                              <option value="admin">Admin</option>
                            </Select>
                          </FormControl>
                        )}
                      </HStack>

                      <HStack spacing={4} w="full">
                        <FormControl>
                          <FormLabel>Action URL (tùy chọn)</FormLabel>
                          <Input
                            name="actionUrl"
                            value={formData.actionUrl}
                            onChange={handleChange}
                            placeholder="/movies/123"
                          />
                        </FormControl>

                        <FormControl>
                          <FormLabel>Action Text</FormLabel>
                          <Input
                            name="actionText"
                            value={formData.actionText}
                            onChange={handleChange}
                            placeholder="Xem chi tiết"
                          />
                        </FormControl>
                      </HStack>

                      <Button
                        type="submit"
                        colorScheme="blue"
                        isLoading={loading}
                        loadingText="Đang gửi..."
                        leftIcon={<Icon as={FiSend} />}
                        w="full"
                      >
                        Gửi thông báo
                      </Button>
                    </VStack>
                  </form>
                </CardBody>
              </Card>
            </TabPanel>

            {/* History Tab */}
            <TabPanel p={0} pt={6}>
              <Card bg={cardBg}>
                <CardHeader>
                  <Heading size="md">Lịch sử thông báo</Heading>
                </CardHeader>
                <CardBody>
                  <TableContainer>
                    <Table variant="simple">
                      <Thead>
                        <Tr>
                          <Th>Tiêu đề</Th>
                          <Th>Loại</Th>
                          <Th>Gửi đến</Th>
                          <Th>Thống kê</Th>
                          <Th>Ngày tạo</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {notifications.map((notification) => (
                          <Tr key={notification._id}>
                            <Td>
                              <VStack align="start" spacing={1}>
                                <Text fontWeight="medium">
                                  {notification.title}
                                </Text>
                                <Text
                                  fontSize="sm"
                                  color="gray.500"
                                  noOfLines={2}
                                >
                                  {notification.message}
                                </Text>
                              </VStack>
                            </Td>
                            <Td>
                              <Badge
                                colorScheme={getTypeColor(notification.type)}
                              >
                                {notification.type}
                              </Badge>
                            </Td>
                            <Td>
                              <Text fontSize="sm">
                                {notification.sendType === "all"
                                  ? "Tất cả"
                                  : notification.sendType === "role"
                                  ? `Role: ${notification.targetRole}`
                                  : "Specific users"}
                              </Text>
                            </Td>
                            <Td>
                              <VStack align="start" spacing={0}>
                                <Text fontSize="xs">
                                  Gửi: {notification.stats?.sent || 0}
                                </Text>
                                <Text fontSize="xs">
                                  Đọc: {notification.stats?.read || 0}
                                </Text>
                              </VStack>
                            </Td>
                            <Td>
                              <Text fontSize="sm">
                                {formatDate(notification.createdAt)}
                              </Text>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </TableContainer>
                </CardBody>
              </Card>
            </TabPanel>

            {/* Test Tab */}
            <TabPanel p={0} pt={6}>
              <Card bg={cardBg}>
                <CardHeader>
                  <Heading size="md">🧪 Test thông báo</Heading>
                </CardHeader>
                <CardBody>
                  <VStack spacing={4}>
                    <Text color="gray.500">
                      Gửi test notification để kiểm tra Socket.IO connection
                    </Text>

                    <Button
                      colorScheme="orange"
                      onClick={sendTestNotification}
                      leftIcon={<Icon as={FiActivity} />}
                    >
                      Gửi Test Notification
                    </Button>
                  </VStack>
                </CardBody>
              </Card>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Box>
  );
};

export default AdminNotifications;
