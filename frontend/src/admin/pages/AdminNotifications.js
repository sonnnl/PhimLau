import React, { useState, useEffect } from "react";
import AdminLayout from "../components/AdminLayout";
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
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Checkbox,
  CheckboxGroup,
  Stack,
  IconButton,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
} from "@chakra-ui/react";
import {
  FiBell,
  FiSend,
  FiUsers,
  FiCheck,
  FiClock,
  FiActivity,
  FiBarChart3,
  FiTrash2,
  FiEye,
  FiRefreshCw,
} from "react-icons/fi";
import axios from "axios";
import Pagination from "../../components/common/Pagination";

const AdminNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    type: "",
    isRead: "",
  });

  // Send notification form
  const [sendForm, setSendForm] = useState({
    recipients: "all",
    selectedUsers: [],
    type: "admin_message",
    title: "",
    message: "",
    actionUrl: "",
    priority: "normal",
    expiresAt: "",
  });

  // User selection states
  const [userSearch, setUserSearch] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [userPage, setUserPage] = useState(1);
  const [userTotalPages, setUserTotalPages] = useState(1);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();
  const [deleteId, setDeleteId] = useState(null);
  const cancelRef = React.useRef();

  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  // API calls
  const apiClient = axios.create({
    baseURL: process.env.REACT_APP_API_URL || "http://localhost:5001/api",
    withCredentials: true,
  });

  // Add auth token to requests
  apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem("movieAppToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  const fetchNotifications = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...filters,
      });

      const response = await apiClient.get(
        `/admin/notifications?${params.toString()}`
      );

      if (response.data.success) {
        setNotifications(response.data.data || []);
        setCurrentPage(response.data.pagination?.currentPage || 1);
        setTotalPages(response.data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách thông báo",
        status: "error",
        duration: 3000,
      });
      // Set empty array để tránh lỗi map
      setNotifications([]);
      setCurrentPage(1);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async (page = 1, search = "") => {
    try {
      setLoadingUsers(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        search: search,
      });

      const response = await apiClient.get(
        `/admin/notifications/users?${params.toString()}`
      );

      if (response.data.success) {
        setUsers(response.data.data);
        setFilteredUsers(response.data.data);
        setUserPage(response.data.pagination?.currentPage || 1);
        setUserTotalPages(response.data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách người dùng",
        status: "error",
        duration: 3000,
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await apiClient.get("/admin/notifications/stats");
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
      // Set default stats nếu API lỗi
      setStats({
        overview: {
          totalNotifications: 0,
          totalUnread: 0,
          totalUsers: 0,
          readRate: 0,
        },
        byType: [],
        recentActivity: [],
        recent: 0,
      });
    }
  };

  const sendNotification = async () => {
    try {
      if (!sendForm.title || !sendForm.message) {
        toast({
          title: "❌ Lỗi",
          description: "Vui lòng nhập tiêu đề và nội dung",
          status: "error",
          duration: 3000,
        });
        return;
      }

      setLoading(true);

      const payload = {
        ...sendForm,
        recipients:
          sendForm.recipients === "selected"
            ? sendForm.selectedUsers
            : sendForm.recipients,
      };

      const response = await apiClient.post(
        "/admin/notifications/send",
        payload
      );

      if (response.data.success) {
        // Show success message with details
        toast({
          title: "✅ Thành công!",
          description: `${response.data.message}. Đang làm mới dữ liệu...`,
          status: "success",
          duration: 5000,
          isClosable: true,
        });

        // Fetch updated data first
        await Promise.all([fetchNotifications(), fetchStats()]);

        // Reset form sau khi load xong data với delay
        setTimeout(() => {
          setSendForm({
            recipients: "all",
            selectedUsers: [],
            type: "admin_message",
            title: "",
            message: "",
            actionUrl: "",
            priority: "normal",
            expiresAt: "",
          });

          // Close modal sau khi reset form
          setTimeout(() => {
            onClose();
          }, 500);
        }, 1000);
      }
    } catch (error) {
      toast({
        title: "❌ Lỗi",
        description: error.response?.data?.message || "Không thể gửi thông báo",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteNotification = async (id) => {
    try {
      setLoading(true);
      const response = await apiClient.delete(`/admin/notifications/${id}`);

      if (response.data.success) {
        toast({
          title: "Thành công",
          description: "Đã xóa thông báo",
          status: "success",
          duration: 3000,
        });

        fetchNotifications();
        fetchStats();
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể xóa thông báo",
        status: "error",
        duration: 3000,
      });
    } finally {
      setLoading(false);
      onDeleteClose();
    }
  };

  const getTypeColor = (type) => {
    const colors = {
      thread_reply: "blue",
      thread_like: "green",
      reply_like: "green",
      admin_message: "purple",
      system: "orange",
      moderation: "red",
      moderation_warning: "orange",
      account_suspended: "red",
      account_banned: "red",
      content_removed: "red",
      content_edited: "yellow",
    };
    return colors[type] || "gray";
  };

  const getTypeLabel = (type) => {
    const labels = {
      thread_reply: "Trả lời",
      thread_like: "Thích chủ đề",
      reply_like: "Thích phản hồi",
      admin_message: "Thông báo admin",
      system: "Hệ thống",
      moderation: "Kiểm duyệt",
      moderation_warning: "Cảnh báo",
      account_suspended: "Tạm khóa",
      account_banned: "Cấm vĩnh viễn",
      content_removed: "Xóa nội dung",
      content_edited: "Chỉnh sửa",
    };
    return labels[type] || type;
  };

  useEffect(() => {
    fetchNotifications();
    fetchUsers();
    fetchStats();
  }, [filters]);

  // Search users with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (sendForm.recipients === "selected") {
        fetchUsers(1, userSearch);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [userSearch, sendForm.recipients]);

  return (
    <AdminLayout
      title="📢 Quản lý Thông báo"
      description="Gửi thông báo real-time cho users"
    >
      <VStack spacing={6} align="stretch">
        {/* Stats */}
        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6}>
          <Card bg={bgColor}>
            <CardBody>
              <Stat>
                <HStack justify="space-between">
                  <Box>
                    <StatLabel>Tổng thông báo</StatLabel>
                    <StatNumber color="blue.500">
                      {stats?.overview?.totalNotifications || 0}
                    </StatNumber>
                    <StatHelpText>Tất cả</StatHelpText>
                  </Box>
                  <Icon as={FiBell} boxSize="30px" color="blue.400" />
                </HStack>
              </Stat>
            </CardBody>
          </Card>

          <Card bg={bgColor}>
            <CardBody>
              <Stat>
                <HStack justify="space-between">
                  <Box>
                    <StatLabel>Đang hoạt động</StatLabel>
                    <StatNumber color="green.500">
                      {stats?.overview?.totalUsers || 0}
                    </StatNumber>
                    <StatHelpText>Active</StatHelpText>
                  </Box>
                  <Icon as={FiCheck} boxSize="30px" color="green.400" />
                </HStack>
              </Stat>
            </CardBody>
          </Card>

          <Card bg={bgColor}>
            <CardBody>
              <Stat>
                <HStack justify="space-between">
                  <Box>
                    <StatLabel>Tuần này</StatLabel>
                    <StatNumber color="orange.500">
                      {stats?.recent || 0}
                    </StatNumber>
                    <StatHelpText>7 ngày qua</StatHelpText>
                  </Box>
                  <Icon as={FiClock} boxSize="30px" color="orange.400" />
                </HStack>
              </Stat>
            </CardBody>
          </Card>

          <Card bg={bgColor}>
            <CardBody>
              <Stat>
                <HStack justify="space-between">
                  <Box>
                    <StatLabel>Users online</StatLabel>
                    <StatNumber color="purple.500">
                      {stats?.overview?.totalUsers || 0}
                    </StatNumber>
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
          </TabList>

          <TabPanels>
            {/* Send Notification Tab */}
            <TabPanel p={0} pt={6}>
              <Card bg={bgColor}>
                <CardHeader>
                  <HStack justify="space-between" align="center">
                    <Heading size="md">📬 Gửi thông báo mới</Heading>
                    {(sendForm.title || sendForm.message) && (
                      <Badge colorScheme="blue" variant="subtle">
                        Đang soạn thảo...
                      </Badge>
                    )}
                  </HStack>
                </CardHeader>
                <CardBody>
                  <form onSubmit={sendNotification}>
                    <VStack spacing={4}>
                      <HStack spacing={4} w="full">
                        <FormControl isRequired>
                          <FormLabel>Người nhận</FormLabel>
                          <Select
                            value={sendForm.recipients}
                            onChange={(e) => {
                              setSendForm({
                                ...sendForm,
                                recipients: e.target.value,
                                selectedUsers: [], // Reset khi chuyển mode
                              });
                              setUserSearch(""); // Reset search

                              // Load users khi chọn "selected" mode
                              if (e.target.value === "selected") {
                                fetchUsers(1, "");
                              }
                            }}
                          >
                            <option value="all">Tất cả người dùng</option>
                            <option value="selected">
                              Chọn người dùng cụ thể
                            </option>
                          </Select>
                        </FormControl>

                        {sendForm.recipients === "selected" && (
                          <FormControl>
                            <FormLabel>
                              <HStack justify="space-between">
                                <Text>Chọn người dùng</Text>
                                <Badge colorScheme="blue" variant="outline">
                                  {sendForm.selectedUsers.length} đã chọn
                                </Badge>
                              </HStack>
                            </FormLabel>

                            {/* Search Input */}
                            <Input
                              placeholder="🔍 Tìm kiếm theo tên hoặc email..."
                              value={userSearch}
                              onChange={(e) => setUserSearch(e.target.value)}
                              mb={3}
                              focusBorderColor="blue.400"
                            />

                            {/* User List */}
                            <Box
                              border="1px"
                              borderColor={borderColor}
                              rounded="lg"
                              overflow="hidden"
                            >
                              {/* Header với Select All */}
                              <Box
                                bg="gray.50"
                                px={3}
                                py={2}
                                borderBottom="1px"
                                borderColor={borderColor}
                              >
                                <HStack justify="space-between">
                                  <Checkbox
                                    isChecked={
                                      filteredUsers.length > 0 &&
                                      sendForm.selectedUsers.length ===
                                        filteredUsers.length
                                    }
                                    isIndeterminate={
                                      sendForm.selectedUsers.length > 0 &&
                                      sendForm.selectedUsers.length <
                                        filteredUsers.length
                                    }
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        // Select all current page users
                                        const allCurrentIds = filteredUsers.map(
                                          (user) => user._id
                                        );
                                        const newSelected = [
                                          ...new Set([
                                            ...sendForm.selectedUsers,
                                            ...allCurrentIds,
                                          ]),
                                        ];
                                        setSendForm({
                                          ...sendForm,
                                          selectedUsers: newSelected,
                                        });
                                      } else {
                                        // Deselect all current page users
                                        const currentIds = filteredUsers.map(
                                          (user) => user._id
                                        );
                                        const newSelected =
                                          sendForm.selectedUsers.filter(
                                            (id) => !currentIds.includes(id)
                                          );
                                        setSendForm({
                                          ...sendForm,
                                          selectedUsers: newSelected,
                                        });
                                      }
                                    }}
                                  >
                                    <Text fontSize="sm" fontWeight="medium">
                                      Chọn tất cả trang này
                                    </Text>
                                  </Checkbox>
                                  <Text fontSize="xs" color="gray.500">
                                    Trang {userPage}/{userTotalPages}
                                  </Text>
                                </HStack>
                              </Box>

                              {/* User List Body */}
                              <Box maxH="300px" overflowY="auto" p={2}>
                                {loadingUsers ? (
                                  <Box textAlign="center" py={4}>
                                    <Text fontSize="sm" color="gray.500">
                                      Đang tải...
                                    </Text>
                                  </Box>
                                ) : filteredUsers.length > 0 ? (
                                  <CheckboxGroup
                                    value={sendForm.selectedUsers}
                                    onChange={(values) =>
                                      setSendForm({
                                        ...sendForm,
                                        selectedUsers: values,
                                      })
                                    }
                                  >
                                    <VStack spacing={2} align="stretch">
                                      {filteredUsers.map((user) => (
                                        <Box
                                          key={user._id}
                                          p={3}
                                          border="1px"
                                          borderColor="gray.200"
                                          rounded="md"
                                          _hover={{ bg: "gray.50" }}
                                        >
                                          <Checkbox value={user._id}>
                                            <VStack align="start" spacing={1}>
                                              <Text fontWeight="medium">
                                                {user.displayName ||
                                                  user.username}
                                              </Text>
                                              <Text
                                                fontSize="sm"
                                                color="gray.500"
                                              >
                                                {user.email}
                                              </Text>
                                              <HStack spacing={2}>
                                                <Badge
                                                  size="sm"
                                                  colorScheme="blue"
                                                >
                                                  {user.role === "admin"
                                                    ? "Admin"
                                                    : "User"}
                                                </Badge>
                                                <Text
                                                  fontSize="xs"
                                                  color="gray.400"
                                                >
                                                  {new Date(
                                                    user.createdAt
                                                  ).toLocaleDateString("vi-VN")}
                                                </Text>
                                              </HStack>
                                            </VStack>
                                          </Checkbox>
                                        </Box>
                                      ))}
                                    </VStack>
                                  </CheckboxGroup>
                                ) : (
                                  <Box textAlign="center" py={4}>
                                    <Text fontSize="sm" color="gray.500">
                                      {userSearch
                                        ? "Không tìm thấy người dùng"
                                        : "Không có người dùng"}
                                    </Text>
                                  </Box>
                                )}
                              </Box>

                              {/* Pagination */}
                              {userTotalPages > 1 && (
                                <Box
                                  p={3}
                                  borderTop="1px"
                                  borderColor={borderColor}
                                >
                                  <HStack justify="center" spacing={2}>
                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        const newPage = userPage - 1;
                                        setUserPage(newPage);
                                        fetchUsers(newPage, userSearch);
                                      }}
                                      isDisabled={userPage <= 1 || loadingUsers}
                                    >
                                      « Trước
                                    </Button>
                                    <Text fontSize="sm" color="gray.500">
                                      {userPage} / {userTotalPages}
                                    </Text>
                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        const newPage = userPage + 1;
                                        setUserPage(newPage);
                                        fetchUsers(newPage, userSearch);
                                      }}
                                      isDisabled={
                                        userPage >= userTotalPages ||
                                        loadingUsers
                                      }
                                    >
                                      Sau »
                                    </Button>
                                  </HStack>
                                </Box>
                              )}
                            </Box>
                          </FormControl>
                        )}
                      </HStack>

                      <FormControl isRequired>
                        <FormLabel>Loại thông báo</FormLabel>
                        <Select
                          value={sendForm.type}
                          onChange={(e) =>
                            setSendForm({ ...sendForm, type: e.target.value })
                          }
                        >
                          <option value="admin_message">Thông báo admin</option>
                          <option value="system">Hệ thống</option>
                          <option value="moderation">Kiểm duyệt</option>
                        </Select>
                      </FormControl>

                      <FormControl isRequired isInvalid={!sendForm.title}>
                        <FormLabel>Tiêu đề</FormLabel>
                        <Input
                          name="title"
                          value={sendForm.title}
                          onChange={(e) =>
                            setSendForm({ ...sendForm, title: e.target.value })
                          }
                          placeholder="Nhập tiêu đề thông báo"
                          focusBorderColor="blue.400"
                        />
                      </FormControl>

                      <FormControl isRequired isInvalid={!sendForm.message}>
                        <FormLabel>Nội dung</FormLabel>
                        <Textarea
                          name="message"
                          value={sendForm.message}
                          onChange={(e) =>
                            setSendForm({
                              ...sendForm,
                              message: e.target.value,
                            })
                          }
                          placeholder="Nhập nội dung thông báo"
                          rows={4}
                          focusBorderColor="blue.400"
                          resize="vertical"
                        />
                      </FormControl>

                      <FormControl>
                        <FormLabel>URL hành động (tùy chọn)</FormLabel>
                        <Input
                          name="actionUrl"
                          value={sendForm.actionUrl}
                          onChange={(e) =>
                            setSendForm({
                              ...sendForm,
                              actionUrl: e.target.value,
                            })
                          }
                          placeholder="/forum/thread/example"
                        />
                      </FormControl>

                      <FormControl>
                        <FormLabel>Độ ưu tiên</FormLabel>
                        <Select
                          value={sendForm.priority}
                          onChange={(e) =>
                            setSendForm({
                              ...sendForm,
                              priority: e.target.value,
                            })
                          }
                        >
                          <option value="low">Thấp</option>
                          <option value="normal">Bình thường</option>
                          <option value="high">Cao</option>
                          <option value="urgent">Khẩn cấp</option>
                        </Select>
                      </FormControl>

                      <Button
                        type="submit"
                        colorScheme="blue"
                        isLoading={loading}
                        loadingText="Đang gửi thông báo..."
                        leftIcon={!loading ? <Icon as={FiSend} /> : null}
                        w="full"
                        size="lg"
                        fontSize="md"
                        py={6}
                        _loading={{
                          bg: "blue.400",
                          color: "white",
                          cursor: "not-allowed",
                        }}
                        isDisabled={!sendForm.title || !sendForm.message}
                      >
                        {loading ? "🚀 Đang gửi..." : "📤 Gửi thông báo"}
                      </Button>
                    </VStack>
                  </form>
                </CardBody>
              </Card>
            </TabPanel>

            {/* History Tab */}
            <TabPanel p={0} pt={6}>
              <Card bg={bgColor}>
                <CardHeader>
                  <Heading size="md">Lịch sử thông báo</Heading>
                </CardHeader>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    {/* Filters */}
                    <HStack spacing={4}>
                      <Select
                        placeholder="Tất cả loại"
                        value={filters.type}
                        onChange={(e) =>
                          setFilters({ ...filters, type: e.target.value })
                        }
                        maxW="200px"
                      >
                        <option value="thread_reply">Trả lời</option>
                        <option value="thread_like">Thích chủ đề</option>
                        <option value="reply_like">Thích phản hồi</option>
                        <option value="admin_message">Thông báo admin</option>
                        <option value="system">Hệ thống</option>
                      </Select>

                      <Select
                        placeholder="Tất cả trạng thái"
                        value={filters.isRead}
                        onChange={(e) =>
                          setFilters({ ...filters, isRead: e.target.value })
                        }
                        maxW="200px"
                      >
                        <option value="true">Đã đọc</option>
                        <option value="false">Chưa đọc</option>
                      </Select>
                    </HStack>

                    {/* Notifications Table */}
                    <Box overflowX="auto">
                      <Table variant="simple">
                        <Thead>
                          <Tr>
                            <Th>Người nhận</Th>
                            <Th>Loại</Th>
                            <Th>Tiêu đề</Th>
                            <Th>Trạng thái</Th>
                            <Th>Ngày tạo</Th>
                            <Th>Thao tác</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {Array.isArray(notifications) &&
                          notifications.length > 0 ? (
                            notifications.map((notification) => (
                              <Tr key={notification._id}>
                                <Td>
                                  <VStack align="start" spacing={1}>
                                    <Text fontWeight="medium">
                                      {notification.recipient?.displayName ||
                                        notification.recipient?.username}
                                    </Text>
                                    <Text fontSize="sm" color="gray.500">
                                      {notification.recipient?.email}
                                    </Text>
                                  </VStack>
                                </Td>
                                <Td>
                                  <Badge
                                    colorScheme={getTypeColor(
                                      notification.type
                                    )}
                                  >
                                    {getTypeLabel(notification.type)}
                                  </Badge>
                                </Td>
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
                                    colorScheme={
                                      notification.isRead ? "green" : "red"
                                    }
                                  >
                                    {notification.isRead
                                      ? "Đã đọc"
                                      : "Chưa đọc"}
                                  </Badge>
                                </Td>
                                <Td>
                                  <Text fontSize="sm">
                                    {new Date(
                                      notification.createdAt
                                    ).toLocaleString("vi-VN")}
                                  </Text>
                                </Td>
                                <Td>
                                  <IconButton
                                    icon={<FiTrash2 />}
                                    size="sm"
                                    colorScheme="red"
                                    variant="ghost"
                                    onClick={() => {
                                      setDeleteId(notification._id);
                                      onDeleteOpen();
                                    }}
                                  />
                                </Td>
                              </Tr>
                            ))
                          ) : (
                            <Tr>
                              <Td colSpan={6} textAlign="center" py={8}>
                                <Text color="gray.500">
                                  {loading
                                    ? "Đang tải..."
                                    : "Chưa có thông báo nào"}
                                </Text>
                              </Td>
                            </Tr>
                          )}
                        </Tbody>
                      </Table>
                    </Box>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={(page) => {
                          setCurrentPage(page);
                          fetchNotifications(page);
                        }}
                      />
                    )}
                  </VStack>
                </CardBody>
              </Card>
            </TabPanel>
          </TabPanels>
        </Tabs>

        {/* Delete Confirmation */}
        <AlertDialog
          isOpen={isDeleteOpen}
          leastDestructiveRef={cancelRef}
          onClose={onDeleteClose}
        >
          <AlertDialogOverlay>
            <AlertDialogContent>
              <AlertDialogHeader fontSize="lg" fontWeight="bold">
                Xóa thông báo
              </AlertDialogHeader>
              <AlertDialogBody>
                Bạn có chắc chắn muốn xóa thông báo này không? Hành động này
                không thể hoàn tác.
              </AlertDialogBody>
              <AlertDialogFooter>
                <Button ref={cancelRef} onClick={onDeleteClose}>
                  Hủy
                </Button>
                <Button
                  colorScheme="red"
                  onClick={() => deleteNotification(deleteId)}
                  ml={3}
                  isLoading={loading}
                >
                  Xóa
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      </VStack>
    </AdminLayout>
  );
};

export default AdminNotifications;
