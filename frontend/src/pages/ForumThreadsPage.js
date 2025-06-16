import React, { useState, useEffect, useCallback } from "react";
import {
  useParams,
  Link as RouterLink,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  Box,
  Heading,
  Text,
  VStack,
  Spinner,
  Alert,
  AlertIcon,
  Link,
  Button,
  Flex,
  Spacer,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Avatar,
  HStack,
  Icon,
  Tag,
  Tooltip,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  SimpleGrid,
  Badge,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import {
  fetchForumThreadsWithFilters,
  deleteThread as deleteThreadService,
} from "../services/forumService";
import {
  FiMessageSquare,
  FiEye,
  FiClock,
  FiChevronRight,
  FiHome,
  FiPlusCircle,
  FiHeart,
  FiBookmark,
  FiMoreVertical,
  FiTrash2,
} from "react-icons/fi";
import { useAuth } from "../contexts/AuthContext"; // Để kiểm tra đăng nhập cho nút Tạo chủ đề

// Helper function to format date (can be replaced with date-fns or similar)
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    return date.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (e) {
    return dateString; // fallback
  }
};

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, isLoading }) => (
  <Modal isOpen={isOpen} onClose={onClose} isCentered>
    <ModalOverlay />
    <ModalContent bg="background.card">
      <ModalHeader>Xác nhận xóa</ModalHeader>
      <ModalCloseButton />
      <ModalBody>
        <Text>
          Bạn có chắc chắn muốn xóa chủ đề này không? Hành động này không thể
          hoàn tác.
        </Text>
      </ModalBody>
      <ModalFooter>
        <Button variant="ghost" mr={3} onClick={onClose}>
          Hủy
        </Button>
        <Button colorScheme="red" onClick={onConfirm} isLoading={isLoading}>
          Xóa
        </Button>
      </ModalFooter>
    </ModalContent>
  </Modal>
);

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  limit,
  totalItems,
}) => {
  if (totalPages <= 1) return null;

  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  return (
    <Flex justify="center" align="center" mt={6} wrap="wrap">
      <Text fontSize="sm" mr={4} mb={{ base: 2, md: 0 }}>
        Trang {currentPage} / {totalPages} (Tổng số {totalItems} mục)
      </Text>
      <HStack spacing={2} wrap="wrap" justifyContent="center">
        <Button
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          isDisabled={currentPage === 1}
        >
          Trước
        </Button>
        {/* Logic hiển thị số trang có thể phức tạp hơn cho nhiều trang (e.g., ... 5 6 7 ... ) */}
        {pageNumbers.map((number) => (
          <Button
            key={number}
            size="sm"
            onClick={() => onPageChange(number)}
            isActive={currentPage === number}
            variant={currentPage === number ? "solid" : "outline"}
            colorScheme={currentPage === number ? "orange" : "gray"}
          >
            {number}
          </Button>
        ))}
        <Button
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          isDisabled={currentPage === totalPages}
        >
          Sau
        </Button>
      </HStack>
    </Flex>
  );
};

const ForumThreadsPage = () => {
  const { categorySlug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const toast = useToast();

  const queryParams = new URLSearchParams(location.search);
  const initialPage = parseInt(queryParams.get("page"), 10) || 1;

  const [threadsData, setThreadsData] = useState({
    threads: [],
    pagination: {},
    category: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(initialPage);

  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const limit = 15; // Số thread mỗi trang, có thể đặt trong config

  const fetchThreadsData = useCallback(
    async (pageToFetch) => {
      try {
        setLoading(true);
        const data = await fetchForumThreadsWithFilters({
          categorySlug,
          page: pageToFetch,
          limit,
        });
        setThreadsData(data);
        setError(null);
        if (pageToFetch !== currentPage) {
          setCurrentPage(pageToFetch);
        }
        // Update URL without full page reload
        navigate(`${location.pathname}?page=${pageToFetch}`, { replace: true });
      } catch (err) {
        setError(err.message || "Không thể tải danh sách chủ đề.");
        console.error(err);
      }
      setLoading(false);
    },
    [categorySlug, navigate, location.pathname, limit]
  );

  useEffect(() => {
    fetchThreadsData(initialPage);
  }, [categorySlug, initialPage, fetchThreadsData]); // Sử dụng initialPage ở đây

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= (threadsData.pagination?.totalPages || 1)) {
      fetchThreadsData(newPage);
    }
  };

  const handleDeleteRequest = (threadId) => {
    setDeleteTarget(threadId);
    onDeleteOpen();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteThreadService(deleteTarget);
      toast({
        title: "Thành công",
        description: "Chủ đề đã được xóa.",
        status: "success",
        duration: 3000,
      });
      fetchThreadsData(currentPage); // Refetch the list
    } catch (error) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa chủ đề.",
        status: "error",
        duration: 3000,
      });
    } finally {
      setIsDeleting(false);
      onDeleteClose();
    }
  };

  if (loading && !threadsData.threads.length) {
    // Chỉ hiển thị spinner toàn trang khi chưa có data
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="70vh"
      >
        <VStack spacing={4}>
          <Spinner size="xl" />
          <Text color="gray.500">Đang tải danh sách chủ đề...</Text>
        </VStack>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert status="error" mt={4} mx={5} borderRadius="md">
        <AlertIcon />
        <VStack align="start" spacing={2} flex="1">
          <Text fontWeight="semibold">Có lỗi xảy ra</Text>
          <Text fontSize="sm">{error}</Text>
          <HStack spacing={2}>
            <Button
              onClick={() => fetchThreadsData(currentPage)}
              size="sm"
              variant="outline"
            >
              Thử lại
            </Button>
            <Button
              onClick={() => window.location.reload()}
              size="sm"
              variant="ghost"
            >
              Tải lại trang
            </Button>
          </HStack>
        </VStack>
      </Alert>
    );
  }

  const { threads, pagination, category } = threadsData;

  return (
    <Box p={{ base: 3, md: 5 }} maxW="1200px" mx="auto">
      <Breadcrumb
        spacing="8px"
        separator={<Icon as={FiChevronRight} color="gray.500" />}
        mb={6}
      >
        <BreadcrumbItem>
          <BreadcrumbLink as={RouterLink} to="/">
            <Icon as={FiHome} mr={1} verticalAlign="text-bottom" />
            Trang chủ
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbLink as={RouterLink} to="/forum">
            Diễn đàn
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>
          <BreadcrumbLink href="#">
            {category?.name || "Danh mục"}
          </BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>

      <Flex
        mb={6}
        alignItems="center"
        direction={{ base: "column", md: "row" }}
      >
        <Box flexGrow={1} mb={{ base: 4, md: 0 }}>
          <Heading as="h1" size="xl">
            {category?.name || "Các chủ đề"}
          </Heading>
          {category?.description && (
            <Text color="gray.400" mt={1}>
              {category.description}
            </Text>
          )}
        </Box>
        {isAuthenticated && (
          <Button
            as={RouterLink}
            to={`/forum/create-thread?category=${categorySlug}`} // Truyền category slug để pre-fill nếu cần
            colorScheme="orange"
            leftIcon={<Icon as={FiPlusCircle} />}
          >
            Tạo chủ đề mới
          </Button>
        )}
      </Flex>

      {loading && <Spinner mb={4} />}

      {threads.length === 0 && !loading ? (
        <Alert status="info" variant="subtle">
          <AlertIcon />
          <Text>Chưa có chủ đề nào trong danh mục này.</Text>
        </Alert>
      ) : (
        <VStack spacing={4} align="stretch">
          {threads.map((thread) => (
            <Box
              key={thread._id}
              p={4}
              borderWidth="1px"
              borderRadius="md"
              borderColor={thread.isPinned ? "purple.400" : "gray.700"}
              bg={thread.isPinned ? "purple.900" : "background.secondaryAlt"}
              _hover={{
                borderColor: thread.isPinned ? "purple.300" : "orange.400",
                shadow: "md",
              }}
              position="relative"
              // ✨ PINNED THREAD STYLING
              {...(thread.isPinned && {
                borderLeftWidth: "4px",
                borderLeftColor: "purple.400",
                shadow: "lg",
              })}
            >
              <Flex
                direction={{ base: "column", md: "row" }}
                justify="space-between"
              >
                <Box flex={1} mr={{ base: 0, md: 4 }} mb={{ base: 3, md: 0 }}>
                  <Heading as="h3" size="md" mb={1}>
                    <HStack spacing={2} align="center">
                      {/* ✨ PINNED ICON */}
                      {thread.isPinned && (
                        <Tooltip label="Bài viết được ghim" placement="top">
                          <Icon
                            as={FiBookmark}
                            color="purple.400"
                            boxSize={4}
                            transform="rotate(15deg)"
                          />
                        </Tooltip>
                      )}
                      <Link
                        as={RouterLink}
                        to={`/forum/thread/${thread.slug}`}
                        _hover={{
                          color: thread.isPinned ? "purple.300" : "orange.400",
                        }}
                        flex={1}
                        color={thread.isPinned ? "purple.200" : "inherit"}
                        fontWeight={thread.isPinned ? "bold" : "normal"}
                      >
                        {thread.title}
                      </Link>
                      {/* ✨ PINNED BADGE */}
                      {thread.isPinned && (
                        <Badge
                          colorScheme="purple"
                          size="sm"
                          variant="solid"
                          fontWeight="bold"
                          px={2}
                        >
                          📌 GHIM
                        </Badge>
                      )}
                      {thread.movieMetadata &&
                        thread.movieMetadata.length > 0 && (
                          <Tooltip
                            label={`Thảo luận về ${
                              thread.movieMetadata.length
                            } phim: ${thread.movieMetadata
                              .map((m) => m.movieTitle)
                              .join(", ")}`}
                            placement="top"
                          >
                            <Badge
                              colorScheme="orange"
                              size="sm"
                              variant="subtle"
                            >
                              🎬 {thread.movieMetadata.length}
                            </Badge>
                          </Tooltip>
                        )}
                    </HStack>
                  </Heading>
                  <HStack spacing={2} fontSize="sm" color="gray.400">
                    <Avatar
                      size="xs"
                      name={thread.author?.displayName}
                      src={thread.author?.avatarUrl}
                    />
                    <Text fontWeight="bold">
                      {thread.author?.displayName || "Người dùng ẩn danh"}
                    </Text>
                    <Text>• {formatDate(thread.createdAt)}</Text>
                  </HStack>
                </Box>
                <Flex align="center">
                  <SimpleGrid
                    columns={{ base: 2, sm: 4 }}
                    spacingX={4}
                    spacingY={2}
                    minW={{ md: "280px" }}
                    textAlign={{ base: "left", md: "right" }}
                    fontSize="sm"
                  >
                    <Tooltip label="Lượt trả lời" placement="top">
                      <HStack justify={{ base: "flex-start", md: "flex-end" }}>
                        <Icon as={FiMessageSquare} color="gray.500" />
                        <Text>{thread.replyCount || 0}</Text>
                      </HStack>
                    </Tooltip>
                    <Tooltip label="Lượt thích" placement="top">
                      <HStack justify={{ base: "flex-start", md: "flex-end" }}>
                        <Icon as={FiHeart} color="red.400" />
                        <Text>{thread.likeCount || 0}</Text>
                      </HStack>
                    </Tooltip>
                    <Tooltip label="Lượt xem" placement="top">
                      <HStack justify={{ base: "flex-start", md: "flex-end" }}>
                        <Icon as={FiEye} color="gray.500" />
                        <Text>{thread.views || 0}</Text>
                      </HStack>
                    </Tooltip>
                    <Tooltip label="Hoạt động cuối" placement="top">
                      <HStack
                        justify={{ base: "flex-start", md: "flex-end" }}
                        gridColumn={{ base: "span 2", sm: "span 1" }}
                      >
                        <Icon as={FiClock} color="gray.500" />
                        <Text noOfLines={1}>
                          {formatDate(thread.lastReplyTime)}
                        </Text>
                      </HStack>
                    </Tooltip>
                  </SimpleGrid>

                  {user &&
                    (user.role === "admin" ||
                      user._id === thread.author?._id) && (
                      <Menu>
                        <MenuButton
                          as={IconButton}
                          icon={<FiMoreVertical />}
                          variant="ghost"
                          size="sm"
                          ml={4}
                        />
                        <MenuList bg="background.card" borderColor="gray.600">
                          <MenuItem
                            icon={<FiTrash2 />}
                            onClick={() => handleDeleteRequest(thread._id)}
                            color="red.400"
                          >
                            Xóa chủ đề
                          </MenuItem>
                        </MenuList>
                      </Menu>
                    )}
                </Flex>
              </Flex>
              {thread.lastReplyAuthor && (
                <HStack
                  mt={2}
                  fontSize="xs"
                  color="gray.500"
                  justify="flex-end"
                >
                  <Text>Trả lời cuối bởi:</Text>
                  <Avatar
                    size="2xs"
                    name={thread.lastReplyAuthor?.displayName}
                    src={thread.lastReplyAuthor?.avatarUrl}
                  />
                  <Text fontWeight="semibold">
                    {thread.lastReplyAuthor?.displayName}
                  </Text>
                </HStack>
              )}
            </Box>
          ))}
        </VStack>
      )}

      {pagination && pagination.totalPages > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
          limit={limit}
          totalItems={pagination.totalItems}
        />
      )}
      <DeleteConfirmationModal
        isOpen={isDeleteOpen}
        onClose={onDeleteClose}
        onConfirm={confirmDelete}
        isLoading={isDeleting}
      />
    </Box>
  );
};

export default ForumThreadsPage;
