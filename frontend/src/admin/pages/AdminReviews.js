import React, { useState, useEffect, useCallback } from "react";
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
  Flex,
  Spacer,
  IconButton,
  Avatar,
  Link as ChakraLink,
  Tooltip,
  Spinner,
} from "@chakra-ui/react";
import {
  FiSearch,
  FiEdit,
  FiTrash2,
  FiChevronLeft,
  FiChevronRight,
  FiChevronsLeft,
  FiChevronsRight,
  FiStar,
  FiClock,
} from "react-icons/fi";
import { Link as RouterLink } from "react-router-dom";
import {
  getAllReviews,
  deleteReview,
  updateReview,
} from "../services/adminService";
import { debounce } from "lodash";

const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: "",
    sort: "-createdAt",
  });
  const [selectedReview, setSelectedReview] = useState(null);

  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();
  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onClose: onEditClose,
  } = useDisclosure();
  const [editedContent, setEditedContent] = useState("");
  const cancelRef = React.useRef();
  const toast = useToast();
  const cardBg = useColorModeValue("white", "gray.800");

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllReviews(filters);
      setReviews(data.reviews);
      setPagination({
        totalPages: data.totalPages,
        currentPage: data.currentPage,
        totalReviews: data.totalReviews,
      });
    } catch (error) {
      toast({
        title: "❌ Lỗi",
        description: `Không thể tải các bài đánh giá: ${error.message}`,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const debouncedSearch = useCallback(
    debounce((value) => {
      setFilters((prev) => ({ ...prev, search: value, page: 1 }));
    }, 500),
    []
  );

  const handleSearchChange = (e) => {
    debouncedSearch(e.target.value);
  };

  const handleSortChange = (e) => {
    setFilters({ ...filters, sort: e.target.value, page: 1 });
  };

  const handlePageChange = (newPage) => {
    setFilters({ ...filters, page: newPage });
  };

  const openDeleteDialog = (review) => {
    setSelectedReview(review);
    onDeleteOpen();
  };

  const handleDeleteReview = async () => {
    if (!selectedReview) return;
    try {
      await deleteReview(selectedReview._id);
      toast({
        title: "✅ Thành công",
        description: "Đã xóa bài đánh giá.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      onDeleteClose();
      setSelectedReview(null);
      fetchReviews(); // Refresh the list
    } catch (error) {
      toast({
        title: "❌ Lỗi",
        description: `Xóa thất bại: ${error.message}`,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const openEditModal = (review) => {
    setSelectedReview(review);
    setEditedContent(review.content);
    onEditOpen();
  };

  const handleUpdateReview = async () => {
    if (!selectedReview) return;
    try {
      await updateReview(selectedReview._id, { content: editedContent });
      toast({
        title: "✅ Thành công",
        description: "Đã cập nhật bài đánh giá.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      onEditClose();
      setSelectedReview(null);
      fetchReviews(); // Refresh the list
    } catch (error) {
      toast({
        title: "❌ Lỗi",
        description: `Cập nhật thất bại: ${error.message}`,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("vi-VN");
  };

  const renderPagination = () => {
    if (!pagination.totalPages || pagination.totalPages <= 1) return null;
    return (
      <HStack mt={4} spacing={2} justify="center">
        <IconButton
          icon={<FiChevronsLeft />}
          onClick={() => handlePageChange(1)}
          isDisabled={pagination.currentPage === 1}
          aria-label="First page"
        />
        <IconButton
          icon={<FiChevronLeft />}
          onClick={() => handlePageChange(pagination.currentPage - 1)}
          isDisabled={pagination.currentPage === 1}
          aria-label="Previous page"
        />
        <Text>
          Trang {pagination.currentPage} / {pagination.totalPages}
        </Text>
        <IconButton
          icon={<FiChevronRight />}
          onClick={() => handlePageChange(pagination.currentPage + 1)}
          isDisabled={pagination.currentPage === pagination.totalPages}
          aria-label="Next page"
        />
        <IconButton
          icon={<FiChevronsRight />}
          onClick={() => handlePageChange(pagination.totalPages)}
          isDisabled={pagination.currentPage === pagination.totalPages}
          aria-label="Last page"
        />
      </HStack>
    );
  };

  return (
    <Box p={4}>
      <VStack spacing={4} align="stretch">
        <Heading as="h1" size="lg">
          Quản lý Đánh giá
        </Heading>
        <Card bg={cardBg}>
          <CardHeader>
            <Flex justify="space-between" align="center">
              <Heading size="md">
                Danh sách Đánh giá ({pagination.totalReviews || 0})
              </Heading>
              <HStack spacing={4}>
                <InputGroup w="300px">
                  <InputLeftElement pointerEvents="none">
                    <Icon as={FiSearch} color="gray.500" />
                  </InputLeftElement>
                  <Input
                    type="text"
                    placeholder="Tìm kiếm nội dung..."
                    onChange={handleSearchChange}
                  />
                </InputGroup>
                <Select
                  w="200px"
                  value={filters.sort}
                  onChange={handleSortChange}
                >
                  <option value="-createdAt">Mới nhất</option>
                  <option value="createdAt">Cũ nhất</option>
                  <option value="-rating">Rating cao nhất</option>
                  <option value="rating">Rating thấp nhất</option>
                </Select>
              </HStack>
            </Flex>
          </CardHeader>
          <CardBody>
            <TableContainer>
              {loading ? (
                <Flex justify="center" align="center" minH="300px">
                  <Spinner size="xl" />
                </Flex>
              ) : (
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Người dùng</Th>
                      <Th>Phim</Th>
                      <Th maxW="300px">Nội dung</Th>
                      <Th isNumeric>Rating</Th>
                      <Th>Ngày đăng</Th>
                      <Th>Hành động</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {reviews.map((review) => (
                      <Tr key={review._id}>
                        <Td>
                          <HStack>
                            <Avatar
                              size="sm"
                              name={review.user?.username}
                              src={review.user?.avatarUrl}
                            />
                            <Text>{review.user?.username || "N/A"}</Text>
                          </HStack>
                        </Td>
                        <Td>
                          <Tooltip label={review.movie?.name}>
                            <ChakraLink
                              as={RouterLink}
                              to={`/movie/${review.movie?.slug}`}
                            >
                              {review.movie?.name?.substring(0, 20) ||
                                "Phim không xác định"}
                              ...
                            </ChakraLink>
                          </Tooltip>
                        </Td>
                        <Td maxW="300px" whiteSpace="pre-wrap">
                          {review.content}
                        </Td>
                        <Td isNumeric>
                          <HStack spacing={1} justify="flex-end">
                            <Text>{review.rating}</Text>
                            <Icon as={FiStar} color="yellow.400" />
                          </HStack>
                        </Td>
                        <Td>{formatDate(review.createdAt)}</Td>
                        <Td>
                          <HStack spacing={2}>
                            <Tooltip label="Chỉnh sửa">
                              <IconButton
                                icon={<FiEdit />}
                                size="sm"
                                colorScheme="blue"
                                onClick={() => openEditModal(review)}
                              />
                            </Tooltip>
                            <Tooltip label="Xóa">
                              <IconButton
                                icon={<FiTrash2 />}
                                size="sm"
                                colorScheme="red"
                                onClick={() => openDeleteDialog(review)}
                              />
                            </Tooltip>
                          </HStack>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              )}
            </TableContainer>
            {renderPagination()}
          </CardBody>
        </Card>
      </VStack>

      {/* Edit Modal */}
      <Modal isOpen={isEditOpen} onClose={onEditClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Chỉnh sửa Đánh giá</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <FormLabel>Nội dung</FormLabel>
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                rows={5}
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onEditClose}>
              Hủy
            </Button>
            <Button colorScheme="blue" onClick={handleUpdateReview}>
              Lưu thay đổi
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Xóa Đánh giá
            </AlertDialogHeader>
            <AlertDialogBody>
              Bạn có chắc chắn muốn xóa bài đánh giá này không? Hành động này
              không thể được hoàn tác.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose}>
                Hủy
              </Button>
              <Button colorScheme="red" onClick={handleDeleteReview} ml={3}>
                Xóa
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default AdminReviews;
