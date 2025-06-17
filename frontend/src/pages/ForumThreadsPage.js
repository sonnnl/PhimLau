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
  Tooltip,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
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
  TableContainer,
} from "@chakra-ui/react";
import {
  fetchForumThreadsWithFilters,
  deleteThread as deleteThreadService,
} from "../services/forumService";
import {
  FiMessageSquare,
  FiEye,
  FiChevronRight,
  FiHome,
  FiPlusCircle,
  FiHeart,
  FiBookmark,
  FiMoreVertical,
  FiTrash2,
} from "react-icons/fi";
import { useAuth } from "../contexts/AuthContext";

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = (now.getTime() - date.getTime()) / 1000;

  if (diffInSeconds < 60) return "vài giây trước";
  if (diffInSeconds < 3600)
    return `${Math.floor(diffInSeconds / 60)} phút trước`;
  if (diffInSeconds < 86400)
    return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
  if (diffInSeconds < 604800)
    return `${Math.floor(diffInSeconds / 86400)} ngày trước`;

  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
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
    <Flex justify="center" align="center" mt={8} wrap="wrap">
      <Text fontSize="sm" mr={4} mb={{ base: 2, md: 0 }} color="gray.400">
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

  const limit = 15;

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
        if (location.search !== `?page=${pageToFetch}`) {
          navigate(`${location.pathname}?page=${pageToFetch}`, {
            replace: true,
          });
        }
      } catch (err) {
        setError(err.message || "Không thể tải danh sách chủ đề.");
        console.error(err);
      }
      setLoading(false);
    },
    [
      categorySlug,
      navigate,
      location.pathname,
      location.search,
      limit,
      currentPage,
    ]
  );

  useEffect(() => {
    fetchThreadsData(initialPage);
  }, [categorySlug, initialPage, fetchThreadsData]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= (threadsData.pagination?.totalPages || 1)) {
      fetchThreadsData(newPage);
    }
  };

  const handleDeleteRequest = (threadId, e) => {
    e.stopPropagation();
    setDeleteTarget(threadId);
    onDeleteOpen();
  };

  const handleRowClick = (slug, e) => {
    if (e.target.closest("A, BUTTON")) return;
    navigate(`/forum/thread/${slug}`);
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
      fetchThreadsData(currentPage); // Refetch
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

  const renderThreadStats = (thread, props) => (
    <HStack spacing={4} color="gray.400" fontSize="sm" {...props}>
      <Tooltip label="Lượt trả lời" placement="top">
        <HStack spacing={1}>
          <Icon as={FiMessageSquare} />
          <Text fontWeight="medium">{thread.replyCount || 0}</Text>
        </HStack>
      </Tooltip>
      <Tooltip label="Lượt thích" placement="top">
        <HStack spacing={1}>
          <Icon as={FiHeart} />
          <Text fontWeight="medium">{thread.likeCount || 0}</Text>
        </HStack>
      </Tooltip>
      <Tooltip label="Lượt xem" placement="top">
        <HStack spacing={1}>
          <Icon as={FiEye} />
          <Text fontWeight="medium">{thread.views || 0}</Text>
        </HStack>
      </Tooltip>
    </HStack>
  );

  return (
    <Box p={{ base: 3, md: 5 }} maxW="1300px" mx="auto">
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
            to={`/forum/create-thread?category=${categorySlug}`}
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
        <Box>
          {/* DESKTOP VIEW - TABLE */}
          <TableContainer
            display={{ base: "none", md: "block" }}
            borderWidth="1px"
            borderColor="gray.700"
            borderRadius="md"
            bg="background.secondaryAlt"
          >
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th pl={4} py={3} w="55%">
                    Chủ đề
                  </Th>
                  <Th textAlign="center" w="20%">
                    Thống kê
                  </Th>
                  <Th w="25%">Hoạt động cuối</Th>
                </Tr>
              </Thead>
              <Tbody>
                {threads.map((thread) => (
                  <Tr
                    key={thread._id}
                    borderLeft="4px solid"
                    borderColor={thread.isPinned ? "purple.400" : "transparent"}
                    bg={
                      thread.isPinned
                        ? "rgba(128, 90, 213, 0.1)"
                        : "transparent"
                    }
                    _hover={{ bg: "whiteAlpha.100", cursor: "pointer" }}
                    onClick={(e) => handleRowClick(thread.slug, e)}
                  >
                    <Td verticalAlign="middle" py={3}>
                      <HStack align="start">
                        <Link
                          as={RouterLink}
                          to={`/profile/${thread.author?._id}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Avatar
                            size="sm"
                            name={thread.author?.displayName}
                            src={thread.author?.avatarUrl}
                            mt={1}
                          />
                        </Link>
                        <VStack align="start" spacing={1}>
                          <HStack>
                            {thread.isPinned && (
                              <Tooltip
                                label="Bài viết được ghim"
                                placement="top"
                              >
                                <Icon as={FiBookmark} color="purple.400" />
                              </Tooltip>
                            )}
                            <Link
                              as={RouterLink}
                              to={`/forum/thread/${thread.slug}`}
                              fontWeight="semibold"
                              fontSize="md"
                              color="whiteAlpha.900"
                              _hover={{ color: "orange.300" }}
                            >
                              {thread.title}
                            </Link>
                          </HStack>
                          <HStack spacing={2} fontSize="sm" color="gray.400">
                            <Text>bởi</Text>
                            <Link
                              as={RouterLink}
                              to={`/profile/${thread.author?._id}`}
                              fontWeight="bold"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {thread.author?.displayName ||
                                "Người dùng ẩn danh"}
                            </Link>
                          </HStack>
                        </VStack>
                      </HStack>
                    </Td>
                    <Td textAlign="center" verticalAlign="middle">
                      {renderThreadStats(thread)}
                    </Td>
                    <Td verticalAlign="middle" py={3}>
                      {thread.lastReplyAuthor ? (
                        <VStack align="start" spacing={0} fontSize="sm">
                          <HStack>
                            <Link
                              as={RouterLink}
                              to={`/profile/${thread.lastReplyAuthor?._id}`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Avatar
                                size="2xs"
                                name={thread.lastReplyAuthor?.displayName}
                                src={thread.lastReplyAuthor?.avatarUrl}
                              />
                            </Link>
                            <Link
                              as={RouterLink}
                              to={`/profile/${thread.lastReplyAuthor?._id}`}
                              fontWeight="bold"
                              color="whiteAlpha.800"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {thread.lastReplyAuthor?.displayName}
                            </Link>
                          </HStack>
                          <Text color="gray.400" mt={1}>
                            {formatDate(thread.lastReplyTime)}
                          </Text>
                        </VStack>
                      ) : (
                        <Text fontSize="sm" color="gray.500">
                          Chưa có trả lời
                        </Text>
                      )}
                    </Td>
                    <Td verticalAlign="middle" textAlign="right">
                      {user &&
                        (user.role === "admin" ||
                          user._id === thread.author?._id) && (
                          <Menu>
                            <MenuButton
                              as={IconButton}
                              icon={<FiMoreVertical />}
                              variant="ghost"
                              size="sm"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Actions
                            </MenuButton>
                            <MenuList
                              bg="background.card"
                              borderColor="gray.600"
                            >
                              <MenuItem
                                icon={<FiTrash2 />}
                                onClick={(e) =>
                                  handleDeleteRequest(thread._id, e)
                                }
                                color="red.400"
                              >
                                Xóa chủ đề
                              </MenuItem>
                            </MenuList>
                          </Menu>
                        )}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>

          {/* MOBILE VIEW - CARDS */}
          <VStack spacing={3} display={{ base: "block", md: "none" }}>
            {threads.map((thread) => (
              <Box
                key={thread._id}
                p={3}
                borderWidth="1px"
                borderRadius="md"
                borderColor={thread.isPinned ? "purple.400" : "gray.700"}
                bg={
                  thread.isPinned
                    ? "rgba(128, 90, 213, 0.1)"
                    : "background.secondaryAlt"
                }
                borderLeftWidth="4px"
                onClick={(e) => handleRowClick(thread.slug, e)}
              >
                <VStack align="start" spacing={2}>
                  <HStack w="full">
                    {thread.isPinned && (
                      <Icon as={FiBookmark} color="purple.400" />
                    )}
                    <Link
                      as={RouterLink}
                      to={`/forum/thread/${thread.slug}`}
                      fontWeight="bold"
                      fontSize="md"
                      noOfLines={2}
                    >
                      {thread.title}
                    </Link>
                  </HStack>
                  <HStack spacing={2} fontSize="sm" color="gray.400" w="full">
                    <Link
                      as={RouterLink}
                      to={`/profile/${thread.author?._id}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Avatar
                        size="xs"
                        name={thread.author?.displayName}
                        src={thread.author?.avatarUrl}
                      />
                    </Link>
                    <Link
                      as={RouterLink}
                      to={`/profile/${thread.author?._id}`}
                      fontWeight="bold"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {thread.author?.displayName || "..."}
                    </Link>
                    <Text>•</Text>
                    <Text>{formatDate(thread.createdAt)}</Text>
                    <Spacer />
                    {user &&
                      (user.role === "admin" ||
                        user._id === thread.author?._id) && (
                        <Menu>
                          <MenuButton
                            as={IconButton}
                            icon={<FiMoreVertical />}
                            variant="ghost"
                            size="sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Actions
                          </MenuButton>
                          <MenuList bg="background.card" borderColor="gray.600">
                            <MenuItem
                              icon={<FiTrash2 />}
                              onClick={(e) =>
                                handleDeleteRequest(thread._id, e)
                              }
                              color="red.400"
                            >
                              Xóa chủ đề
                            </MenuItem>
                          </MenuList>
                        </Menu>
                      )}
                  </HStack>
                  {renderThreadStats(thread, {
                    w: "full",
                    justify: "space-around",
                    pt: 2,
                    borderTopWidth: "1px",
                    borderColor: "gray.700",
                  })}
                </VStack>
              </Box>
            ))}
          </VStack>
        </Box>
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
