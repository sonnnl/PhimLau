import React, { useState, useEffect } from "react";
import AdminLayout from "../components/AdminLayout";
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  IconButton,
  useDisclosure,
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
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Flex,
  Spacer,
  HStack,
  VStack,
  Text,
  Select,
  Spinner,
  Center,
  Button,
  Avatar,
  Link,
  Tooltip,
  useColorModeValue,
  Icon,
} from "@chakra-ui/react";
import {
  FiLock,
  FiUnlock,
  FiBookmark,
  FiTrash2,
  FiCheck,
  FiRefreshCw,
} from "react-icons/fi";
import { adminApiClient } from "../services/adminService";

const AdminForumThreads = () => {
  const [threads, setThreads] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedThread, setSelectedThread] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
  });
  const [filters, setFilters] = useState({
    category: "",
    status: "",
    moderation: "",
    page: 1,
    limit: 20,
  });
  const [moderationData, setModerationData] = useState({
    status: "approved",
    note: "",
  });

  const {
    isOpen: isModerateOpen,
    onOpen: onModerateOpen,
    onClose: onModerateClose,
  } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();
  const toast = useToast();
  const cancelRef = React.useRef();

  // Theme colors
  const cardBg = useColorModeValue("white", "gray.800");
  const tableHeaderBg = useColorModeValue("gray.50", "gray.700");
  const tableHeaderColor = useColorModeValue("gray.700", "gray.300");

  useEffect(() => {
    fetchThreads();
    fetchCategories();
  }, [filters]);

  const fetchThreads = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      Object.keys(filters).forEach((key) => {
        if (filters[key]) params.append(key, filters[key]);
      });

      const response = await adminApiClient.get(`/forum/threads?${params}`);
      setThreads(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách bài viết",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await adminApiClient.get("/forum/categories");
      setCategories(response.data.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleModerate = (thread) => {
    setSelectedThread(thread);
    setModerationData({
      status: thread.moderationStatus || "approved",
      note: thread.moderationNote || "",
    });
    onModerateOpen();
  };

  const handleDelete = (thread) => {
    setSelectedThread(thread);
    onDeleteOpen();
  };

  const handleModerationSubmit = async () => {
    try {
      await adminApiClient.patch(
        `/forum/threads/${selectedThread._id}/moderate`,
        moderationData
      );
      toast({
        title: "Thành công",
        description: "Kiểm duyệt bài viết thành công",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      onModerateClose();
      fetchThreads();
    } catch (error) {
      toast({
        title: "Lỗi",
        description: error.response?.data?.message || "Có lỗi xảy ra",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await adminApiClient.delete(`/forum/threads/${selectedThread._id}`, {
        data: { reason: "Xóa bởi admin" },
      });
      toast({
        title: "Thành công",
        description: "Xóa bài viết thành công",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      onDeleteClose();
      fetchThreads();
    } catch (error) {
      toast({
        title: "Lỗi",
        description: error.response?.data?.message || "Có lỗi xảy ra",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const toggleLock = async (thread) => {
    try {
      await adminApiClient.patch(`/forum/threads/${thread._id}/lock`, {
        reason: thread.isLocked ? "Mở khóa bởi admin" : "Khóa bởi admin",
      });
      toast({
        title: "Thành công",
        description: `Đã ${thread.isLocked ? "mở khóa" : "khóa"} bài viết`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      fetchThreads();
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể thay đổi trạng thái khóa",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const togglePin = async (thread) => {
    try {
      await adminApiClient.patch(`/forum/threads/${thread._id}/pin`, {
        reason: thread.isPinned ? "Bỏ ghim bởi admin" : "Ghim bởi admin",
      });
      toast({
        title: "Thành công",
        description: `Đã ${thread.isPinned ? "bỏ ghim" : "ghim"} bài viết`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      fetchThreads();
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể thay đổi trạng thái ghim",
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

  const getStatusBadge = (thread) => {
    if (thread.isDeleted) return <Badge colorScheme="red">Đã xóa</Badge>;

    if (thread.moderationStatus === "pending") {
      return (
        <VStack spacing={1}>
          <Badge colorScheme="yellow">Chờ duyệt</Badge>
          {thread.autoApproved === false && (
            <Badge size="xs" colorScheme="orange" variant="outline">
              {thread.autoApprovalReason ? "Auto-review" : "Manual review"}
            </Badge>
          )}
        </VStack>
      );
    }

    if (thread.moderationStatus === "rejected") {
      return (
        <VStack spacing={1}>
          <Badge colorScheme="red">Từ chối</Badge>
          {thread.moderationNote && (
            <Tooltip label={thread.moderationNote}>
              <Badge size="xs" colorScheme="red" variant="outline">
                Có ghi chú
              </Badge>
            </Tooltip>
          )}
        </VStack>
      );
    }

    if (thread.moderationStatus === "approved") {
      return (
        <VStack spacing={1}>
          <Badge colorScheme="green">Đã duyệt</Badge>
          {thread.autoApproved && (
            <Badge size="xs" colorScheme="blue" variant="outline">
              Auto: {thread.autoApprovalReason}
            </Badge>
          )}
          {thread.isLocked && (
            <Badge size="xs" colorScheme="gray">
              Khóa
            </Badge>
          )}
          {thread.isPinned && (
            <Badge size="xs" colorScheme="purple">
              Ghim
            </Badge>
          )}
        </VStack>
      );
    }

    return <Badge colorScheme="gray">Không rõ</Badge>;
  };

  if (loading) {
    return (
      <Center h="200px">
        <Spinner size="xl" />
      </Center>
    );
  }

  return (
    <AdminLayout
      title="💬 Quản lý Bài viết Forum"
      description="Moderation và quản lý threads"
    >
      <VStack spacing={6} align="stretch">
        <Flex align="center">
          <Spacer />
          <Button
            leftIcon={<FiRefreshCw />}
            onClick={fetchThreads}
            variant="outline"
          >
            Làm mới
          </Button>
        </Flex>

        {/* Filters */}
        <Box bg={cardBg} p={4} shadow="md" rounded="lg">
          <HStack spacing={4} wrap="wrap">
            <FormControl maxW="200px">
              <FormLabel fontSize="sm">Danh mục</FormLabel>
              <Select
                size="sm"
                value={filters.category}
                onChange={(e) => handleFilterChange("category", e.target.value)}
              >
                <option value="">Tất cả</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl maxW="150px">
              <FormLabel fontSize="sm">Trạng thái</FormLabel>
              <Select
                size="sm"
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
              >
                <option value="">Tất cả</option>
                <option value="active">Hoạt động</option>
                <option value="deleted">Đã xóa</option>
              </Select>
            </FormControl>

            <FormControl maxW="150px">
              <FormLabel fontSize="sm">Kiểm duyệt</FormLabel>
              <Select
                size="sm"
                value={filters.moderation}
                onChange={(e) =>
                  handleFilterChange("moderation", e.target.value)
                }
              >
                <option value="">Tất cả</option>
                <option value="pending">Chờ duyệt</option>
                <option value="approved">Đã duyệt</option>
                <option value="rejected">Từ chối</option>
              </Select>
            </FormControl>
          </HStack>
        </Box>

        <Box bg={cardBg} shadow="md" rounded="lg" overflow="hidden">
          <Table variant="simple">
            <Thead bg={tableHeaderBg}>
              <Tr>
                <Th color={tableHeaderColor}>Tiêu đề</Th>
                <Th color={tableHeaderColor}>Tác giả</Th>
                <Th color={tableHeaderColor}>Danh mục</Th>
                <Th color={tableHeaderColor}>Phản hồi</Th>
                <Th color={tableHeaderColor}>Lượt xem</Th>
                <Th color={tableHeaderColor}>Trạng thái</Th>
                <Th color={tableHeaderColor}>Ngày tạo</Th>
                <Th color={tableHeaderColor}>Thao tác</Th>
              </Tr>
            </Thead>
            <Tbody>
              {threads.map((thread) => (
                <Tr key={thread._id}>
                  <Td maxW="300px">
                    <VStack align="start" spacing={1}>
                      <HStack spacing={2} align="start" w="full">
                        {/* ✨ PINNED ICON FOR ADMIN */}
                        {thread.isPinned && (
                          <Icon
                            as={FiBookmark}
                            color="purple.500"
                            boxSize={4}
                            transform="rotate(15deg)"
                            mt={0.5}
                          />
                        )}
                        <Link
                          href={`/forum/thread/${thread.slug}`}
                          target="_blank"
                          fontWeight={thread.isPinned ? "bold" : "medium"}
                          noOfLines={2}
                          color={thread.isPinned ? "purple.600" : "blue.600"}
                          flex={1}
                        >
                          {thread.title}
                        </Link>
                      </HStack>
                      {thread.tags && thread.tags.length > 0 && (
                        <HStack>
                          {thread.tags.slice(0, 2).map((tag, idx) => (
                            <Badge key={idx} size="sm" variant="outline">
                              {tag}
                            </Badge>
                          ))}
                        </HStack>
                      )}
                    </VStack>
                  </Td>
                  <Td>
                    <HStack>
                      <Avatar size="sm" src={thread.author?.avatarUrl} />
                      <Text fontSize="sm">{thread.author?.username}</Text>
                    </HStack>
                  </Td>
                  <Td>
                    <Badge colorScheme="blue" variant="outline">
                      {thread.category?.name}
                    </Badge>
                  </Td>
                  <Td>{thread.replyCount || 0}</Td>
                  <Td>{thread.views || 0}</Td>
                  <Td>{getStatusBadge(thread)}</Td>
                  <Td>
                    <Text fontSize="sm">
                      {new Date(thread.createdAt).toLocaleDateString("vi-VN")}
                    </Text>
                  </Td>
                  <Td>
                    <HStack spacing={1}>
                      <Tooltip label="Kiểm duyệt">
                        <IconButton
                          icon={<FiCheck />}
                          size="sm"
                          colorScheme="green"
                          variant="ghost"
                          onClick={() => handleModerate(thread)}
                        />
                      </Tooltip>

                      <Tooltip label={thread.isLocked ? "Mở khóa" : "Khóa"}>
                        <IconButton
                          icon={thread.isLocked ? <FiUnlock /> : <FiLock />}
                          size="sm"
                          colorScheme="orange"
                          variant="ghost"
                          onClick={() => toggleLock(thread)}
                        />
                      </Tooltip>

                      <Tooltip label={thread.isPinned ? "Bỏ ghim" : "Ghim"}>
                        <IconButton
                          icon={<FiBookmark />}
                          size="sm"
                          colorScheme={thread.isPinned ? "blue" : "gray"}
                          variant="ghost"
                          onClick={() => togglePin(thread)}
                        />
                      </Tooltip>

                      <Tooltip label="Xóa">
                        <IconButton
                          icon={<FiTrash2 />}
                          size="sm"
                          colorScheme="red"
                          variant="ghost"
                          onClick={() => handleDelete(thread)}
                        />
                      </Tooltip>
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <Flex justify="center">
            <HStack>
              <Button
                size="sm"
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                isDisabled={!pagination.hasPrev}
              >
                Trước
              </Button>

              <Text fontSize="sm">
                Trang {pagination.currentPage} / {pagination.totalPages}
              </Text>

              <Button
                size="sm"
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                isDisabled={!pagination.hasNext}
              >
                Sau
              </Button>
            </HStack>
          </Flex>
        )}

        {/* Modal kiểm duyệt */}
        <Modal isOpen={isModerateOpen} onClose={onModerateClose} size="md">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Kiểm duyệt bài viết</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <Text fontSize="sm" color="gray.600">
                  Bài viết: <strong>{selectedThread?.title}</strong>
                </Text>

                <FormControl>
                  <FormLabel>Trạng thái</FormLabel>
                  <Select
                    value={moderationData.status}
                    onChange={(e) =>
                      setModerationData({
                        ...moderationData,
                        status: e.target.value,
                      })
                    }
                  >
                    <option value="approved">Phê duyệt</option>
                    <option value="rejected">Từ chối</option>
                    <option value="pending">Chờ duyệt</option>
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Ghi chú</FormLabel>
                  <Textarea
                    value={moderationData.note}
                    onChange={(e) =>
                      setModerationData({
                        ...moderationData,
                        note: e.target.value,
                      })
                    }
                    placeholder="Nhập ghi chú kiểm duyệt..."
                    rows={3}
                  />
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onModerateClose}>
                Hủy
              </Button>
              <Button colorScheme="blue" onClick={handleModerationSubmit}>
                Xác nhận
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Alert Dialog xác nhận xóa */}
        <AlertDialog
          isOpen={isDeleteOpen}
          leastDestructiveRef={cancelRef}
          onClose={onDeleteClose}
        >
          <AlertDialogOverlay>
            <AlertDialogContent>
              <AlertDialogHeader fontSize="lg" fontWeight="bold">
                Xóa bài viết
              </AlertDialogHeader>
              <AlertDialogBody>
                Bạn có chắc chắn muốn xóa bài viết "{selectedThread?.title}"?
                Hành động này không thể hoàn tác.
              </AlertDialogBody>
              <AlertDialogFooter>
                <Button ref={cancelRef} onClick={onDeleteClose}>
                  Hủy
                </Button>
                <Button colorScheme="red" onClick={handleDeleteConfirm} ml={3}>
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

export default AdminForumThreads;
