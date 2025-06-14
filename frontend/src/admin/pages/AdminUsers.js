import React, { useState, useEffect } from "react";
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
} from "@chakra-ui/react";
import {
  FiSearch,
  FiEdit,
  FiTrash2,
  FiUserCheck,
  FiUsers,
} from "react-icons/fi";
import { Link as RouterLink } from "react-router-dom";
import {
  getAllUsers,
  deleteUser,
  updateUserRole,
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
  const { isOpen, onOpen, onClose } = useDisclosure();
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  const getRoleBadgeColor = (role) => {
    return role === "admin" ? "purple" : "blue";
  };

  return (
    <Box p={6} maxW="1400px" mx="auto">
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Box>
          <Heading size="xl" color="brand.accent" mb={2}>
            👥 Quản lý Users
          </Heading>
          <Text color="gray.500">
            Quản lý người dùng, phân quyền và moderation
          </Text>
        </Box>

        {/* Filters */}
        <Card bg={cardBg}>
          <CardHeader>
            <Heading size="md">🔍 Bộ lọc</Heading>
          </CardHeader>
          <CardBody>
            <HStack spacing={4} wrap="wrap">
              <InputGroup maxW="300px">
                <InputLeftElement>
                  <Icon as={FiSearch} color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder="Tìm kiếm user..."
                  value={filters.search}
                  onChange={handleSearch}
                />
              </InputGroup>

              <Select
                placeholder="Tất cả roles"
                value={filters.role}
                onChange={handleRoleFilter}
                maxW="150px"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </Select>

              <Select
                value={filters.limit}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    limit: parseInt(e.target.value),
                    page: 1,
                  })
                }
                maxW="100px"
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </Select>
            </HStack>
          </CardBody>
        </Card>

        {/* Users Table */}
        <Card bg={cardBg}>
          <CardHeader>
            <HStack justify="space-between">
              <Heading size="md">
                📋 Danh sách Users ({pagination.total || 0})
              </Heading>
              <Button
                as={RouterLink}
                to="/admin/setup"
                colorScheme="green"
                size="sm"
                leftIcon={<Icon as={FiUserCheck} />}
              >
                Tạo Admin
              </Button>
            </HStack>
          </CardHeader>
          <CardBody>
            <TableContainer>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>User</Th>
                    <Th>Email</Th>
                    <Th>Role</Th>
                    <Th>Ngày tạo</Th>
                    <Th>Thao tác</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {loading ? (
                    <Tr>
                      <Td colSpan={5} textAlign="center">
                        Đang tải...
                      </Td>
                    </Tr>
                  ) : users.length === 0 ? (
                    <Tr>
                      <Td colSpan={5} textAlign="center">
                        Không có user nào
                      </Td>
                    </Tr>
                  ) : (
                    users.map((user) => (
                      <Tr key={user._id}>
                        <Td>
                          <VStack align="start" spacing={1}>
                            <Text fontWeight="medium">
                              {user.displayName || user.username}
                            </Text>
                            <Text fontSize="sm" color="gray.500">
                              @{user.username}
                            </Text>
                          </VStack>
                        </Td>
                        <Td>{user.email}</Td>
                        <Td>
                          <Badge colorScheme={getRoleBadgeColor(user.role)}>
                            {user.role}
                          </Badge>
                        </Td>
                        <Td>{formatDate(user.createdAt)}</Td>
                        <Td>
                          <HStack spacing={2}>
                            <Select
                              size="sm"
                              value={user.role}
                              onChange={(e) =>
                                handleRoleUpdate(user._id, e.target.value)
                              }
                              maxW="100px"
                            >
                              <option value="user">User</option>
                              <option value="admin">Admin</option>
                            </Select>

                            <Button
                              size="sm"
                              colorScheme="red"
                              variant="outline"
                              leftIcon={<Icon as={FiTrash2} />}
                              onClick={() => openDeleteDialog(user)}
                            >
                              Xóa
                            </Button>
                          </HStack>
                        </Td>
                      </Tr>
                    ))
                  )}
                </Tbody>
              </Table>
            </TableContainer>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <HStack justify="center" mt={4} spacing={2}>
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
          </CardBody>
        </Card>
      </VStack>

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
              <strong>{selectedUser?.username}</strong>? Hành động này không thể
              hoàn tác.
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
    </Box>
  );
};

export default AdminUsers;
