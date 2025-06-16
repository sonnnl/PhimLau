import React, { useState, useEffect } from "react";
import AdminLayout from "../components/AdminLayout";
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Button,
  HStack,
  VStack,
  Input,
  Select,
  Badge,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
  Text,
  InputGroup,
  InputLeftElement,
  Icon,
  useColorModeValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Textarea,
  ButtonGroup,
  Avatar,
  Flex,
  Spacer,
  Divider,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Tooltip,
  Wrap,
  WrapItem,
  Grid,
  GridItem,
  SimpleGrid,
  Spinner,
  Tag,
  TagLabel,
  TagCloseButton,
  IconButton,
} from "@chakra-ui/react";
import {
  FiSearch,
  FiEdit,
  FiTrash2,
  FiUserCheck,
  FiUsers,
  FiShield,
  FiClock,
  FiXCircle,
  FiCheckCircle,
  FiAlertTriangle,
  FiMoreHorizontal,
  FiMail,
  FiCalendar,
  FiSettings,
} from "react-icons/fi";
import { Link as RouterLink } from "react-router-dom";
import {
  getAllUsers,
  deleteUser,
  updateUserRole,
  updateUserStatus,
} from "../services/adminService";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: "",
    role: "",
  });
  const [selectedUser, setSelectedUser] = useState(null);

  const [actionData, setActionData] = useState({
    action: "",
    reason: "",
    suspensionDays: 7,
  });
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isActionOpen,
    onOpen: onActionOpen,
    onClose: onActionClose,
  } = useDisclosure();
  const cancelRef = React.useRef();
  const toast = useToast();
  const cardBg = useColorModeValue("white", "gray.800");

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await getAllUsers(filters);
      setUsers(data.data.users);
      setPagination(data.data.pagination);
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

  const handleSearch = (e) => {
    setFilters({
      ...filters,
      search: e.target.value,
      page: 1,
    });
  };

  const handleRoleFilter = (e) => {
    setFilters({
      ...filters,
      role: e.target.value,
      page: 1,
    });
  };

  const handlePageChange = (newPage) => {
    setFilters({
      ...filters,
      page: newPage,
    });
  };

  const handleRoleUpdate = async (userId, newRole) => {
    try {
      await updateUserRole(userId, newRole);
      toast({
        title: "✅ Thành công",
        description: `Đã cập nhật quyền thành ${newRole}`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      fetchUsers();
    } catch (error) {
      toast({
        title: "❌ Lỗi",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleStatusUpdate = async (
    userId,
    newStatus,
    reason = "",
    suspensionDays = 7
  ) => {
    try {
      await updateUserStatus(userId, {
        status: newStatus,
        reason,
        suspensionDays,
      });
      const statusMessages = {
        active: "kích hoạt",
        suspended: `tạm khóa ${suspensionDays} ngày`,
        banned: "cấm vĩnh viễn",
        inactive: "vô hiệu hóa",
      };
      toast({
        title: "✅ Thành công",
        description: `Đã ${statusMessages[newStatus]} tài khoản`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      fetchUsers();
    } catch (error) {
      toast({
        title: "❌ Lỗi",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleDeleteUser = async () => {
    try {
      await deleteUser(selectedUser._id);
      toast({
        title: "✅ Thành công",
        description: "Đã xóa user thành công",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      onClose();
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      toast({
        title: "❌ Lỗi",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const openDeleteDialog = (user) => {
    setSelectedUser(user);
    onOpen();
  };

  const openActionModal = (user, action) => {
    setSelectedUser(user);
    setActionData({
      action,
      reason: "",
      suspensionDays: 7,
    });
    onActionOpen();
  };

  const handleStatusAction = async () => {
    if (!selectedUser || !actionData.action) return;

    try {
      await handleStatusUpdate(
        selectedUser._id,
        actionData.action,
        actionData.reason,
        actionData.suspensionDays
      );
      onActionClose();
      setActionData({ action: "", reason: "", suspensionDays: 7 });
    } catch (error) {
      // Error handled in handleStatusUpdate
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  const getRoleBadgeColor = (role) => {
    return role === "admin" ? "purple" : "blue";
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case "active":
        return "green";
      case "suspended":
        return "yellow";
      case "banned":
        return "red";
      case "inactive":
        return "gray";
      default:
        return "gray";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "active":
        return "Hoạt động";
      case "suspended":
        return "Tạm khóa";
      case "banned":
        return "Cấm";
      case "inactive":
        return "Vô hiệu";
      default:
        return status;
    }
  };

  return (
    <AdminLayout
      title="👥 Quản lý Users"
      description="Quản lý người dùng, phân quyền và moderation"
    >
      <VStack spacing={6} align="stretch">
        {/* Filters */}
        <Card bg={cardBg} shadow="md">
          <CardHeader pb={4}>
            <HStack>
              <Icon as={FiSearch} color="blue.500" size="20px" />
              <Heading size="md" color="blue.600">
                Tìm kiếm & Lọc
              </Heading>
            </HStack>
          </CardHeader>
          <CardBody pt={0}>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
              <Box>
                <Text fontSize="sm" fontWeight="medium" color="gray.600" mb={2}>
                  Tìm kiếm
                </Text>
                <InputGroup size="md">
                  <InputLeftElement>
                    <Icon as={FiSearch} color="gray.400" />
                  </InputLeftElement>
                  <Input
                    placeholder="Tìm theo username, email..."
                    value={filters.search}
                    onChange={handleSearch}
                    bg={cardBg}
                    border="1px"
                    borderColor="gray.300"
                    _focus={{
                      borderColor: "blue.500",
                      shadow: "outline",
                    }}
                  />
                </InputGroup>
              </Box>

              <Box>
                <Text fontSize="sm" fontWeight="medium" color="gray.600" mb={2}>
                  Vai trò
                </Text>
                <Select
                  value={filters.role}
                  onChange={handleRoleFilter}
                  bg={cardBg}
                  border="1px"
                  borderColor="gray.300"
                  _focus={{
                    borderColor: "blue.500",
                    shadow: "outline",
                  }}
                >
                  <option value="">Tất cả quyền</option>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </Select>
              </Box>

              <Box>
                <Text fontSize="sm" fontWeight="medium" color="gray.600" mb={2}>
                  Hiển thị
                </Text>
                <Select
                  value={filters.limit}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      limit: parseInt(e.target.value),
                      page: 1,
                    })
                  }
                  bg={cardBg}
                  border="1px"
                  borderColor="gray.300"
                  _focus={{
                    borderColor: "blue.500",
                    shadow: "outline",
                  }}
                >
                  <option value="10">10 mục</option>
                  <option value="25">25 mục</option>
                  <option value="50">50 mục</option>
                </Select>
              </Box>
            </SimpleGrid>

            {/* Active Filters Display */}
            {(filters.search || filters.role) && (
              <Box mt={4} pt={4} borderTop="1px" borderColor="gray.200">
                <HStack spacing={2} flexWrap="wrap">
                  <Text fontSize="sm" fontWeight="medium" color="gray.600">
                    Đang lọc:
                  </Text>
                  {filters.search && (
                    <Tag size="md" colorScheme="blue" variant="subtle">
                      <TagLabel>Tìm kiếm: "{filters.search}"</TagLabel>
                      <TagCloseButton
                        onClick={() =>
                          setFilters({ ...filters, search: "", page: 1 })
                        }
                      />
                    </Tag>
                  )}
                  {filters.role && (
                    <Tag size="md" colorScheme="purple" variant="subtle">
                      <TagLabel>
                        Vai trò: {filters.role === "admin" ? "Admin" : "User"}
                      </TagLabel>
                      <TagCloseButton
                        onClick={() =>
                          setFilters({ ...filters, role: "", page: 1 })
                        }
                      />
                    </Tag>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    colorScheme="gray"
                    onClick={() =>
                      setFilters({
                        search: "",
                        role: "",
                        limit: 10,
                        page: 1,
                      })
                    }
                  >
                    Xóa tất cả
                  </Button>
                </HStack>
              </Box>
            )}
          </CardBody>
        </Card>

        {/* Users Grid */}
        <Box>
          <Flex align="center" justify="space-between" mb={6}>
            <VStack align="start" spacing={1}>
              <Heading size="md" color="gray.700">
                📋 Danh sách Users
              </Heading>
              <Text fontSize="sm" color="gray.500">
                Tổng cộng {pagination.total || 0} người dùng
              </Text>
            </VStack>
            <Button
              as={RouterLink}
              to="/admin/setup"
              colorScheme="blue"
              size="sm"
              leftIcon={<Icon as={FiUserCheck} />}
            >
              Tạo Admin
            </Button>
          </Flex>

          {loading ? (
            <Grid
              templateColumns="repeat(auto-fill, minmax(350px, 1fr))"
              gap={6}
            >
              {[...Array(6)].map((_, i) => (
                <Card key={i} bg={cardBg} shadow="md" h="280px">
                  <CardBody p={6}>
                    <VStack
                      spacing={4}
                      align="center"
                      justify="center"
                      h="full"
                    >
                      <Spinner size="lg" color="blue.500" />
                      <Text color="gray.500">Đang tải...</Text>
                    </VStack>
                  </CardBody>
                </Card>
              ))}
            </Grid>
          ) : users.length === 0 ? (
            <Card bg={cardBg} p={8}>
              <VStack spacing={4}>
                <Icon as={FiUsers} size="48px" color="gray.400" />
                <Text color="gray.500" fontSize="lg">
                  Không có user nào
                </Text>
              </VStack>
            </Card>
          ) : (
            <Grid
              templateColumns="repeat(auto-fill, minmax(350px, 1fr))"
              gap={6}
            >
              {users.map((user) => (
                <Card
                  key={user._id}
                  bg={cardBg}
                  shadow="md"
                  borderRadius="lg"
                  overflow="hidden"
                  transition="all 0.2s"
                  _hover={{ shadow: "lg", transform: "translateY(-2px)" }}
                >
                  <CardBody p={6}>
                    <VStack spacing={4} align="stretch">
                      {/* User Avatar & Basic Info */}
                      <HStack spacing={4}>
                        <Avatar
                          size="lg"
                          src={user.avatarUrl}
                          name={user.displayName || user.username}
                          bg="blue.500"
                        />
                        <VStack align="start" flex={1} spacing={1}>
                          <HStack spacing={2} align="center">
                            <Text fontWeight="bold" fontSize="lg">
                              {user.displayName || user.username}
                            </Text>
                            <Badge
                              colorScheme={getRoleBadgeColor(user.role)}
                              variant="subtle"
                              fontSize="xs"
                            >
                              {user.role === "admin" ? "Admin" : "User"}
                            </Badge>
                          </HStack>
                          <Text fontSize="sm" color="gray.500">
                            @{user.username}
                          </Text>
                          <HStack spacing={1}>
                            <Icon as={FiMail} size="12px" color="gray.400" />
                            <Text fontSize="xs" color="gray.500" isTruncated>
                              {user.email}
                            </Text>
                          </HStack>
                        </VStack>
                      </HStack>

                      <Divider />

                      {/* User Stats */}
                      <SimpleGrid columns={2} spacing={4}>
                        <VStack spacing={1}>
                          <Text
                            fontSize="sm"
                            fontWeight="medium"
                            color="gray.600"
                          >
                            Tham gia
                          </Text>
                          <HStack spacing={1}>
                            <Icon
                              as={FiCalendar}
                              size="12px"
                              color="gray.400"
                            />
                            <Text fontSize="xs" color="gray.500">
                              {formatDate(user.createdAt)}
                            </Text>
                          </HStack>
                        </VStack>
                        <VStack spacing={1}>
                          <Text
                            fontSize="sm"
                            fontWeight="medium"
                            color="gray.600"
                          >
                            Trạng thái
                          </Text>
                          <Badge
                            colorScheme={getStatusBadgeColor(user.status)}
                            variant="solid"
                            fontSize="xs"
                          >
                            {getStatusText(user.status)}
                          </Badge>
                        </VStack>
                      </SimpleGrid>

                      <Divider />

                      {/* Action Buttons */}
                      <HStack justify="space-between" align="center">
                        <VStack align="start" spacing={0}>
                          <Text fontSize="xs" color="gray.500">
                            Vai trò
                          </Text>
                          <Select
                            size="sm"
                            value={user.role}
                            onChange={(e) =>
                              handleRoleUpdate(user._id, e.target.value)
                            }
                            maxW="100px"
                            fontSize="xs"
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </Select>
                        </VStack>

                        <Menu>
                          <MenuButton
                            as={IconButton}
                            icon={<Icon as={FiSettings} />}
                            size="sm"
                            variant="ghost"
                            colorScheme="gray"
                          />
                          <MenuList>
                            {user.status !== "active" && (
                              <MenuItem
                                icon={
                                  <Icon as={FiCheckCircle} color="green.500" />
                                }
                                onClick={() =>
                                  handleStatusUpdate(user._id, "active")
                                }
                              >
                                Kích hoạt
                              </MenuItem>
                            )}
                            {user.status !== "suspended" && (
                              <MenuItem
                                icon={<Icon as={FiClock} color="yellow.500" />}
                                onClick={() =>
                                  openActionModal(user, "suspended")
                                }
                              >
                                Tạm khóa
                              </MenuItem>
                            )}
                            {user.status !== "banned" && (
                              <MenuItem
                                icon={<Icon as={FiXCircle} color="red.500" />}
                                onClick={() => openActionModal(user, "banned")}
                              >
                                Cấm vĩnh viễn
                              </MenuItem>
                            )}
                            {user.status !== "inactive" && (
                              <MenuItem
                                icon={
                                  <Icon as={FiAlertTriangle} color="gray.500" />
                                }
                                onClick={() =>
                                  handleStatusUpdate(user._id, "inactive")
                                }
                              >
                                Vô hiệu hóa
                              </MenuItem>
                            )}
                            <MenuDivider />
                            <MenuItem
                              icon={<Icon as={FiTrash2} color="red.500" />}
                              onClick={() => openDeleteDialog(user)}
                              color="red.500"
                            >
                              Xóa tài khoản
                            </MenuItem>
                          </MenuList>
                        </Menu>
                      </HStack>
                    </VStack>
                  </CardBody>
                </Card>
              ))}
            </Grid>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <HStack justify="center" mt={6} spacing={2}>
              <Button
                size="sm"
                disabled={!pagination.hasPrev}
                onClick={() => handlePageChange(pagination.currentPage - 1)}
              >
                Trước
              </Button>

              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .filter(
                  (page) =>
                    page === 1 ||
                    page === pagination.totalPages ||
                    Math.abs(page - pagination.currentPage) <= 2
                )
                .map((page, index, array) => (
                  <React.Fragment key={page}>
                    {index > 0 && array[index - 1] !== page - 1 && (
                      <Text>...</Text>
                    )}
                    <Button
                      size="sm"
                      variant={
                        page === pagination.currentPage ? "solid" : "outline"
                      }
                      colorScheme={
                        page === pagination.currentPage ? "blue" : "gray"
                      }
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </Button>
                  </React.Fragment>
                ))}

              <Button
                size="sm"
                disabled={!pagination.hasNext}
                onClick={() => handlePageChange(pagination.currentPage + 1)}
              >
                Sau
              </Button>
            </HStack>
          )}
        </Box>

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          isOpen={isOpen}
          leastDestructiveRef={cancelRef}
          onClose={onClose}
        >
          <AlertDialogOverlay>
            <AlertDialogContent>
              <AlertDialogHeader fontSize="lg" fontWeight="bold">
                ⚠️ Xác nhận xóa user
              </AlertDialogHeader>

              <AlertDialogBody>
                Bạn có chắc chắn muốn xóa user{" "}
                <strong>{selectedUser?.username}</strong>? Hành động này không
                thể hoàn tác.
              </AlertDialogBody>

              <AlertDialogFooter>
                <Button ref={cancelRef} onClick={onClose}>
                  Hủy
                </Button>
                <Button colorScheme="red" onClick={handleDeleteUser} ml={3}>
                  Xóa
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>

        {/* Action Modal */}
        <Modal isOpen={isActionOpen} onClose={onActionClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              {actionData.action === "suspended" ? "Tạm khóa" : "Cấm"} tài khoản
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <Text>
                  Bạn sắp{" "}
                  {actionData.action === "suspended" ? "tạm khóa" : "cấm"} tài
                  khoản: <strong>{selectedUser?.username}</strong>
                </Text>

                {actionData.action === "suspended" && (
                  <FormControl>
                    <FormLabel>Số ngày tạm khóa</FormLabel>
                    <Input
                      type="number"
                      min="1"
                      max="365"
                      value={actionData.suspensionDays}
                      onChange={(e) =>
                        setActionData((prev) => ({
                          ...prev,
                          suspensionDays: parseInt(e.target.value) || 7,
                        }))
                      }
                      placeholder="Nhập số ngày (1-365)"
                    />
                  </FormControl>
                )}

                <FormControl>
                  <FormLabel>Lý do</FormLabel>
                  <Textarea
                    value={actionData.reason}
                    onChange={(e) =>
                      setActionData((prev) => ({
                        ...prev,
                        reason: e.target.value,
                      }))
                    }
                    placeholder="Nhập lý do (không bắt buộc)"
                    rows={3}
                  />
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <ButtonGroup>
                <Button onClick={onActionClose}>Hủy</Button>
                <Button
                  colorScheme={
                    actionData.action === "suspended" ? "yellow" : "red"
                  }
                  onClick={handleStatusAction}
                >
                  {actionData.action === "suspended" ? "Tạm khóa" : "Cấm"}
                </Button>
              </ButtonGroup>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </VStack>
    </AdminLayout>
  );
};

export default AdminUsers;
