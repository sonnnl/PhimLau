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
  Avatar,
  HStack,
  Icon,
  Divider,
  Textarea,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Select,
  useDisclosure,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Image,
  SimpleGrid,
} from "@chakra-ui/react";
import {
  getThreadBySlug,
  createReply as createReplyService,
  createReport as createReportService,
  deleteThread as deleteThreadService,
  deleteReply as deleteReplyService,
} from "../services/forumService";
import {
  FiClock,
  FiChevronRight,
  FiHome,
  FiMessageSquare,
  FiSend,
  FiFlag,
  FiMoreVertical,
  FiTrash2,
} from "react-icons/fi";
import { useAuth } from "../contexts/AuthContext";
import LikeButton from "../components/forum/LikeButton";
import ForumMovieCard from "../components/forum/ForumMovieCard";

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
    return dateString;
  }
};

// 🎬 Helper function to display movie type
const getMovieTypeDisplay = (type) => {
  const typeMap = {
    single: "Phim lẻ",
    series: "Phim bộ",
    hoathinh: "Hoạt hình",
    tvshows: "TV Shows",
  };
  return typeMap[type] || type || "N/A";
};

const Pagination = ({ currentPage, totalPages, onPageChange, baseName }) => {
  if (totalPages <= 1) return null;
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  return (
    <HStack spacing={2} mt={6} justifyContent="center">
      <Button
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        isDisabled={currentPage === 1}
      >
        Trước
      </Button>
      {pageNumbers.map((number) => (
        <Button
          key={`${baseName}-page-${number}`}
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
  );
};

const ReplyForm = ({
  threadId,
  onReplyCreated,
  replyingTo,
  setReplyingTo,
  setShowReplyForm,
}) => {
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { token, isAuthenticated } = useAuth();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) {
      toast({
        title: "Nội dung không được để trống.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    setIsLoading(true);
    try {
      // ✅ Thêm parentReply nếu đang reply to reply
      const replyData = { content };
      if (replyingTo?.replyId) {
        replyData.parentReply = replyingTo.replyId;
      }

      const response = await createReplyService(threadId, replyData, token);
      onReplyCreated(response.reply); // 🔧 Chỉ truyền reply object, không phải toàn bộ response
      setContent("");

      // Reset reply state
      setReplyingTo(null);
      setShowReplyForm(false);

      // Show appropriate message based on status
      if (response.moderationStatus === "rejected") {
        toast({
          title: "Phản hồi bị từ chối",
          description: response.message || "Nội dung vi phạm quy tắc cộng đồng",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      } else {
        toast({
          title: replyingTo
            ? `Đã trả lời ${replyingTo.authorName}!`
            : "Đăng trả lời thành công!",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: "Lỗi khi đăng trả lời.",
        description: error.message || "Vui lòng thử lại.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
    setIsLoading(false);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
    setShowReplyForm(false);
    setContent("");
  };

  if (!isAuthenticated) {
    return (
      <Text mt={4} color="gray.500">
        Vui lòng{" "}
        <Link as={RouterLink} to="/login" color="orange.400">
          đăng nhập
        </Link>{" "}
        để trả lời.
      </Text>
    );
  }

  return (
    <Box mt={8} as="form" onSubmit={handleSubmit} id="reply-form">
      <Heading size="md" mb={3}>
        {replyingTo ? `Trả lời ${replyingTo.authorName}` : "Gửi trả lời"}
      </Heading>

      {/* Hiển thị thông tin reply gốc nếu đang reply to reply */}
      {replyingTo && (
        <Box
          p={3}
          mb={3}
          bg="gray.700"
          borderRadius="md"
          borderLeft="3px solid"
          borderLeftColor="orange.400"
        >
          <Text fontSize="sm" color="gray.300">
            Đang trả lời: <strong>{replyingTo.authorName}</strong>
          </Text>
          <Text fontSize="xs" color="gray.400" mt={1} noOfLines={2}>
            {replyingTo.content}
          </Text>
          <Button
            size="xs"
            variant="ghost"
            colorScheme="red"
            onClick={handleCancelReply}
            mt={2}
          >
            Hủy trả lời
          </Button>
        </Box>
      )}

      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={
          replyingTo
            ? `Trả lời ${replyingTo.authorName}...`
            : "Nhập nội dung trả lời của bạn..."
        }
        minHeight="120px"
        mb={3}
        bg="background.input"
        borderColor="gray.600"
      />
      <HStack>
        <Button
          type="submit"
          colorScheme="orange"
          isLoading={isLoading}
          leftIcon={<Icon as={FiSend} />}
        >
          {replyingTo ? "Trả lời" : "Gửi trả lời"}
        </Button>
        {replyingTo && (
          <Button variant="ghost" onClick={handleCancelReply}>
            Hủy
          </Button>
        )}
      </HStack>
    </Box>
  );
};

// 🚨 REPORT COMPONENT - Component báo cáo
const ReportModal = ({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetTitle,
}) => {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const reasonOptions = [
    { value: "spam", label: "Spam hoặc quảng cáo" },
    { value: "harassment", label: "Quấy rối hoặc bắt nạt" },
    { value: "inappropriate_content", label: "Nội dung không phù hợp" },
    { value: "violence", label: "Bạo lực hoặc đe dọa" },
    { value: "hate_speech", label: "Ngôn từ thù địch" },
    { value: "false_information", label: "Thông tin sai lệch" },
    { value: "copyright", label: "Vi phạm bản quyền" },
    { value: "other", label: "Lý do khác" },
  ];

  const handleSubmit = async () => {
    if (!reason) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn lý do báo cáo",
        status: "error",
        duration: 3000,
      });
      return;
    }

    setLoading(true);
    try {
      await createReportService({
        reportType: targetType,
        targetId,
        reason,
        description,
      });

      toast({
        title: "Thành công",
        description:
          "Báo cáo đã được gửi. Chúng tôi sẽ xem xét trong thời gian sớm nhất.",
        status: "success",
        duration: 5000,
      });

      onClose();
      setReason("");
      setDescription("");
    } catch (error) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể gửi báo cáo",
        status: "error",
        duration: 3000,
      });
    }
    setLoading(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent bg="background.card" borderColor="gray.600">
        <ModalHeader>
          <Icon as={FiFlag} mr={2} color="red.400" />
          Báo cáo {targetType === "thread" ? "chủ đề" : "trả lời"}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <Box>
              <Text fontSize="sm" color="gray.400" mb={2}>
                Bạn đang báo cáo:{" "}
                <Text as="span" fontWeight="bold">
                  "{targetTitle}"
                </Text>
              </Text>
            </Box>

            <Box>
              <Text mb={2} fontWeight="medium">
                Lý do báo cáo *
              </Text>
              <Select
                placeholder="Chọn lý do báo cáo..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                bg="background.secondary"
                borderColor="gray.600"
              >
                {reasonOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Box>

            <Box>
              <Text mb={2} fontWeight="medium">
                Mô tả chi tiết (tùy chọn)
              </Text>
              <Textarea
                placeholder="Mô tả thêm về vấn đề này..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                bg="background.secondary"
                borderColor="gray.600"
                resize="vertical"
                rows={4}
              />
              <Text fontSize="xs" color="gray.500" mt={1}>
                {description.length}/500 ký tự
              </Text>
            </Box>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Hủy
          </Button>
          <Button
            colorScheme="red"
            onClick={handleSubmit}
            isLoading={loading}
            loadingText="Đang gửi..."
          >
            Gửi báo cáo
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

// ✅ Delete Confirmation Modal Component
const DeleteConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  targetType,
}) => (
  <Modal isOpen={isOpen} onClose={onClose} isCentered>
    <ModalOverlay />
    <ModalContent bg="background.card">
      <ModalHeader>Xác nhận xóa</ModalHeader>
      <ModalCloseButton />
      <ModalBody>
        <Text>
          Bạn có chắc chắn muốn xóa{" "}
          {targetType === "thread" ? "chủ đề" : "trả lời"} này không? Hành động
          này không thể hoàn tác.
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

const ForumThreadDetailPage = () => {
  const { threadSlug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();

  const queryParams = new URLSearchParams(location.search);
  const initialReplyPage = parseInt(queryParams.get("page"), 10) || 1;

  const [threadData, setThreadData] = useState({
    thread: null,
    replies: {
      data: [], // ✅ Changed from 'items' to 'data' để match backend
      pagination: {
        currentPage: 1,
        totalPages: 0,
        totalItems: 0,
        limit: 20,
      },
    },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentReplyPage, setCurrentReplyPage] = useState(initialReplyPage);

  const replyLimit = 20; // ✅ Changed from 10 to 20 để match backend default

  // Report modal state
  const {
    isOpen: isReportOpen,
    onOpen: onReportOpen,
    onClose: onReportClose,
  } = useDisclosure();
  const [reportTarget, setReportTarget] = useState({
    type: "",
    id: "",
    title: "",
  });

  // ✅ Delete Confirmation Modal
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();
  const [deleteTarget, setDeleteTarget] = useState({ type: "", id: "" });
  const [isDeleting, setIsDeleting] = useState(false);

  // Reply to reply state
  const [replyingTo, setReplyingTo] = useState(null); // { replyId, authorName }
  const [showReplyForm, setShowReplyForm] = useState(false);

  const fetchThreadDetails = useCallback(
    async (pageToFetch = 1, replyLimitParam = 20) => {
      // ✅ Add replyLimitParam parameter
      setLoading(true);
      try {
        const response = await getThreadBySlug(threadSlug, {
          page: pageToFetch,
          limit: replyLimitParam, // ✅ Use parameter instead of hardcoded
        });

        // 🔧 SAFE DATA HANDLING - Xử lý dữ liệu an toàn
        const responseData = response?.data || response || {};

        setThreadData({
          thread: responseData.thread || null,
          replies: {
            data: responseData.replies?.data || [],
            pagination: responseData.replies?.pagination || {
              currentPage: 1,
              totalPages: 0,
              totalItems: 0,
              limit: replyLimitParam, // ✅ Use parameter
            },
          },
        });

        setError(null);
        if (pageToFetch !== currentReplyPage) {
          setCurrentReplyPage(pageToFetch);
        }
        navigate(`${location.pathname}?page=${pageToFetch}`, {
          replace: true,
        });
      } catch (err) {
        setError(err.message || "Không thể tải chi tiết chủ đề.");
      }
      setLoading(false);
    },
    [threadSlug, navigate, location.pathname] // ✅ Removed currentReplyPage to prevent infinite loop
  );

  useEffect(() => {
    fetchThreadDetails(initialReplyPage, replyLimit); // ✅ Pass both parameters
  }, [threadSlug, initialReplyPage, fetchThreadDetails]);

  const handleReplyPageChange = (newPage) => {
    if (
      newPage >= 1 &&
      newPage <= (threadData.replies.pagination?.totalPages || 1)
    ) {
      fetchThreadDetails(newPage, replyLimit); // ✅ Pass both parameters
    }
  };

  const handleReplyCreated = (newReply) => {
    // 🔧 CHỈ THÊM REPLY NẾU ĐƯỢC APPROVE
    if (newReply.moderationStatus === "approved") {
      setThreadData((prevData) => ({
        ...prevData,
        replies: {
          ...prevData.replies,
          data: [...(prevData.replies.data || []), newReply], // ✅ Safe spread
        },
        thread: {
          ...prevData.thread,
          replyCount: (prevData.thread?.replyCount || 0) + 1,
          lastReplyTime: newReply.createdAt,
        },
      }));
    }
    // Nếu reply bị reject thì không thêm vào UI, toast sẽ thông báo
  };

  // ✅ DELETE HANDLERS
  const handleDeleteRequest = (type, id) => {
    setDeleteTarget({ type, id });
    onDeleteOpen();
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      if (deleteTarget.type === "thread") {
        await deleteThreadService(deleteTarget.id);
        toast({
          title: "Thành công",
          description: "Chủ đề đã được xóa.",
          status: "success",
          duration: 3000,
        });
        navigate("/forum"); // Navigate away after deleting thread
      } else if (deleteTarget.type === "reply") {
        await deleteReplyService(deleteTarget.id);
        toast({
          title: "Thành công",
          description: "Trả lời đã được xóa.",
          status: "success",
          duration: 3000,
        });
        // Refetch to update the UI
        fetchThreadDetails(currentReplyPage, replyLimit);
      }
      onDeleteClose();
    } catch (error) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa.",
        status: "error",
        duration: 3000,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // 🚨 REPORT HANDLERS - Xử lý báo cáo
  const handleReportThread = () => {
    // ✅ SAFE ACCESS - Kiểm tra thread tồn tại trước khi báo cáo
    if (!threadData?.thread?._id) {
      toast({
        title: "Lỗi",
        description: "Không thể báo cáo chủ đề này",
        status: "error",
        duration: 3000,
      });
      return;
    }

    setReportTarget({
      type: "thread",
      id: threadData.thread._id,
      title: threadData.thread.title,
    });
    onReportOpen();
  };

  const handleReportReply = (reply) => {
    // ✅ SAFE ACCESS - Kiểm tra reply tồn tại trước khi báo cáo
    if (!reply?._id) {
      toast({
        title: "Lỗi",
        description: "Không thể báo cáo trả lời này",
        status: "error",
        duration: 3000,
      });
      return;
    }

    setReportTarget({
      type: "reply",
      id: reply._id,
      title: `Trả lời của ${reply.author?.displayName || "Ẩn danh"}`,
    });
    onReportOpen();
  };

  // 💬 REPLY TO REPLY HANDLERS
  const handleReplyToReply = (reply) => {
    if (!reply?._id) {
      toast({
        title: "Lỗi",
        description: "Không thể trả lời comment này",
        status: "error",
        duration: 3000,
      });
      return;
    }

    setReplyingTo({
      replyId: reply._id,
      authorName: reply.author?.displayName || "Ẩn danh",
      content:
        reply.content.substring(0, 100) +
        (reply.content.length > 100 ? "..." : ""),
    });
    setShowReplyForm(true);

    // Scroll to reply form
    setTimeout(() => {
      document.querySelector("#reply-form")?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 100);
  };

  if (loading && !threadData.thread) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="70vh"
      >
        <VStack spacing={4}>
          <Spinner size="xl" />
          <Text color="gray.500">Đang tải chi tiết chủ đề...</Text>
        </VStack>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert status="error" mt={4} mx={5} borderRadius="md">
        <AlertIcon />
        <VStack align="start" spacing={2} flex="1">
          <Text fontWeight="semibold">Không thể tải chủ đề</Text>
          <Text fontSize="sm">{error}</Text>
          <HStack spacing={2}>
            <Button
              onClick={() => fetchThreadDetails(currentReplyPage, replyLimit)}
              size="sm"
              variant="outline"
            >
              Thử lại
            </Button>
            <Button
              onClick={() => navigate("/forum")}
              size="sm"
              variant="ghost"
            >
              Về trang diễn đàn
            </Button>
          </HStack>
        </VStack>
      </Alert>
    );
  }

  // 🔧 SAFE DESTRUCTURING
  const thread = threadData?.thread || null;
  const replies = threadData?.replies || { data: [], pagination: {} };

  if (!thread) {
    return (
      <Alert status="warning" mt={4} mx={5}>
        <AlertIcon />
        <VStack>
          <Text>Không tìm thấy chủ đề.</Text>
          <Text fontSize="sm" color="gray.500">
            Chủ đề có thể đang chờ kiểm duyệt hoặc đã bị xóa.
          </Text>
          <Button size="sm" onClick={() => window.location.reload()}>
            Tải lại trang
          </Button>
        </VStack>
      </Alert>
    );
  }

  return (
    <Box p={{ base: 3, md: 5 }} maxW="900px" mx="auto">
      <VStack spacing={4} align="stretch">
        {/* Breadcrumbs */}
        <Flex justifyContent="space-between" alignItems="center" mb={2}>
          <HStack fontSize="sm" color="gray.400">
            <Link as={RouterLink} to="/">
              <Icon as={FiHome} mr={1} />
              Trang chủ
            </Link>
            <Icon as={FiChevronRight} />
            <Link as={RouterLink} to="/forum">
              Diễn đàn
            </Link>
            <Icon as={FiChevronRight} />
            {thread.category && (
              <>
                <Link
                  as={RouterLink}
                  to={`/forum/category/${thread.category.slug}`}
                >
                  {thread.category.name}
                </Link>
                <Icon as={FiChevronRight} />
              </>
            )}
            <Text noOfLines={1} title={thread.title}>
              {thread.title.substring(0, 30)}
              {thread.title.length > 30 && "..."}
            </Text>
          </HStack>
        </Flex>

        {/* Thread Content với Report Button */}
        <Box
          p={5}
          borderWidth="1px"
          borderRadius="md"
          borderColor="gray.700"
          bg="background.secondaryAlt"
        >
          <Flex justify="space-between" align="flex-start" mb={3}>
            <Heading as="h1" size="lg" flex="1">
              {thread.title}
            </Heading>
            {/* 🚨 REPORT/DELETE BUTTON - Nút báo cáo & xóa thread */}
            <Menu>
              <MenuButton
                as={IconButton}
                icon={<FiMoreVertical />}
                variant="ghost"
                size="sm"
                ml={2}
              />
              <MenuList bg="background.card" borderColor="gray.600">
                <MenuItem
                  icon={<FiFlag />}
                  onClick={handleReportThread}
                  color="red.400"
                >
                  Báo cáo chủ đề
                </MenuItem>
                {user &&
                  (user.role === "admin" ||
                    user._id === thread.author?._id) && (
                    <MenuItem
                      icon={<FiTrash2 />}
                      onClick={() => handleDeleteRequest("thread", thread._id)}
                      color="red.400"
                    >
                      Xóa chủ đề
                    </MenuItem>
                  )}
              </MenuList>
            </Menu>
          </Flex>

          <HStack spacing={3} mb={4} fontSize="sm" color="gray.400">
            <Avatar
              size="sm"
              name={thread.author?.displayName}
              src={thread.author?.avatarUrl}
            />
            <Text fontWeight="bold">
              {thread.author?.displayName || "Người dùng ẩn danh"}
            </Text>
            <HStack spacing={1}>
              <Icon as={FiClock} />
              <Text>{formatDate(thread.createdAt)}</Text>
            </HStack>
            <HStack spacing={1}>
              <Icon as={FiMessageSquare} />
              <Text>{thread.replyCount || 0} trả lời</Text>
            </HStack>
          </HStack>

          {/* Movie Metadata Display */}
          {thread.movieMetadata && thread.movieMetadata.length > 0 && (
            <Box mb={4}>
              <Text fontSize="sm" color="gray.400" mb={3}>
                🎬 Phim được thảo luận:
              </Text>
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={3}>
                {thread.movieMetadata.map((movie, index) => (
                  <ForumMovieCard
                    key={movie.movieId || index}
                    movieMetadata={movie}
                    showPrimaryBadge={true}
                  />
                ))}
              </SimpleGrid>
            </Box>
          )}

          <Divider my={4} borderColor="gray.600" />
          <Box
            className="thread-content"
            whiteSpace="pre-wrap"
            dangerouslySetInnerHTML={{
              __html: (thread.content || "").replace(/\n/g, "<br />"),
            }}
          />

          <Flex justify="flex-start" mt={4}>
            <LikeButton
              targetType="thread"
              targetId={thread._id}
              initialLikeCount={thread.likeCount || 0}
              size="sm"
            />
          </Flex>
        </Box>

        {/* Replies List với Report Buttons */}
        <Heading size="lg" mt={8} mb={4}>
          Trả lời ({replies.pagination?.totalItems || 0})
        </Heading>

        {loading && replies.data.length === 0 && <Spinner />}

        {/* 🔧 SAFE RENDER - Render an toàn với fallback */}
        {(replies.data || []).length > 0 ? (
          <VStack spacing={5} align="stretch">
            {replies.data.map((reply) => (
              <Box
                key={reply._id}
                p={4}
                borderWidth="1px"
                borderRadius="md"
                borderColor="gray.700"
                bg="background.card"
              >
                <Flex justify="space-between" align="flex-start" mb={2}>
                  <HStack spacing={3} fontSize="sm" color="gray.400" flex="1">
                    <Avatar
                      size="xs"
                      name={reply.author?.displayName}
                      src={reply.author?.avatarUrl}
                    />
                    <Text fontWeight="bold">
                      {reply.author?.displayName || "Người dùng ẩn danh"}
                    </Text>
                    <Text>• {formatDate(reply.createdAt)}</Text>
                  </HStack>

                  {/* 🚨 REPORT/DELETE BUTTON - Nút báo cáo & xóa reply */}
                  <Menu>
                    <MenuButton
                      as={IconButton}
                      icon={<FiMoreVertical />}
                      variant="ghost"
                      size="xs"
                    />
                    <MenuList bg="background.card" borderColor="gray.600">
                      <MenuItem
                        icon={<FiFlag />}
                        onClick={() => handleReportReply(reply)}
                        color="red.400"
                        fontSize="sm"
                      >
                        Báo cáo trả lời
                      </MenuItem>
                      {user &&
                        (user.role === "admin" ||
                          user._id === reply.author?._id) && (
                          <MenuItem
                            icon={<FiTrash2 />}
                            onClick={() =>
                              handleDeleteRequest("reply", reply._id)
                            }
                            color="red.400"
                            fontSize="sm"
                          >
                            Xóa trả lời
                          </MenuItem>
                        )}
                    </MenuList>
                  </Menu>
                </Flex>

                {/* Hiển thị parent reply nếu có */}
                {reply.parentReply && (
                  <Box
                    mb={3}
                    p={2}
                    bg="gray.700"
                    borderRadius="md"
                    borderLeft="3px solid"
                    borderLeftColor="blue.400"
                  >
                    <Text fontSize="xs" color="gray.400" mb={1}>
                      Trả lời:{" "}
                      <strong>
                        {reply.parentReply.author?.displayName || "Ẩn danh"}
                      </strong>
                    </Text>
                    <Text fontSize="sm" color="gray.300" noOfLines={2}>
                      {reply.parentReply?.isDeleted
                        ? "Nội dung này đã bị xóa."
                        : reply.parentReply?.content || "Nội dung không có"}
                    </Text>
                  </Box>
                )}

                <Box
                  whiteSpace="pre-wrap"
                  dangerouslySetInnerHTML={{
                    __html: (reply.content || "").replace(/\n/g, "<br />"),
                  }}
                />

                <Flex justify="space-between" align="center" mt={3}>
                  <LikeButton
                    targetType="reply"
                    targetId={reply._id}
                    initialLikeCount={reply.likeCount || 0}
                    size="xs"
                  />

                  {/* 💬 REPLY BUTTON */}
                  <Button
                    size="xs"
                    variant="ghost"
                    colorScheme="blue"
                    leftIcon={<Icon as={FiMessageSquare} />}
                    onClick={() => handleReplyToReply(reply)}
                  >
                    Trả lời
                  </Button>
                </Flex>
              </Box>
            ))}
          </VStack>
        ) : (
          !loading && (
            <Text color="gray.500">Chưa có trả lời nào cho chủ đề này.</Text>
          )
        )}

        {replies.pagination && replies.pagination.totalPages > 0 && (
          <Pagination
            currentPage={currentReplyPage}
            totalPages={replies.pagination.totalPages}
            onPageChange={handleReplyPageChange}
            baseName={`reply-${thread._id}`}
          />
        )}

        {/* Reply Form */}
        <ReplyForm
          threadId={thread._id}
          onReplyCreated={handleReplyCreated}
          replyingTo={replyingTo}
          setReplyingTo={setReplyingTo}
          setShowReplyForm={setShowReplyForm}
        />
      </VStack>

      {/* 🚨 REPORT MODAL - Modal báo cáo */}
      <ReportModal
        isOpen={isReportOpen}
        onClose={onReportClose}
        targetType={reportTarget.type}
        targetId={reportTarget.id}
        targetTitle={reportTarget.title}
      />

      {/* ✅ DELETE CONFIRMATION MODAL */}
      <DeleteConfirmationModal
        isOpen={isDeleteOpen}
        onClose={onDeleteClose}
        onConfirm={confirmDelete}
        isLoading={isDeleting}
        targetType={deleteTarget.type}
      />
    </Box>
  );
};

export default ForumThreadDetailPage;
