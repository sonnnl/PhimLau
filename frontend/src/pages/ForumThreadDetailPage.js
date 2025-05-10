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
} from "@chakra-ui/react";
import {
  getThreadBySlug,
  createReply as createReplyService,
} from "../services/forumService"; // Thêm createReplyService
import {
  FiClock,
  FiChevronRight,
  FiHome,
  FiMessageSquare,
  FiSend,
} from "react-icons/fi";
import { useAuth } from "../contexts/AuthContext";

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

const ReplyForm = ({ threadId, onReplyCreated }) => {
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
      const newReply = await createReplyService(threadId, { content }, token);
      onReplyCreated(newReply); // Callback để cập nhật UI
      setContent("");
      toast({
        title: "Đăng trả lời thành công!",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
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
    <Box mt={8} as="form" onSubmit={handleSubmit}>
      <Heading size="md" mb={3}>
        Gửi trả lời
      </Heading>
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Nhập nội dung trả lời của bạn..."
        minHeight="120px"
        mb={3}
        bg="background.input"
        borderColor="gray.600"
      />
      <Button
        type="submit"
        colorScheme="orange"
        isLoading={isLoading}
        leftIcon={<Icon as={FiSend} />}
      >
        Gửi trả lời
      </Button>
    </Box>
  );
};

const ForumThreadDetailPage = () => {
  const { threadSlug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = useAuth(); // Lấy token cho việc tạo reply

  const queryParams = new URLSearchParams(location.search);
  const initialReplyPage = parseInt(queryParams.get("replyPage"), 10) || 1;

  const [threadData, setThreadData] = useState({
    thread: null,
    replies: { items: [], pagination: {} },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentReplyPage, setCurrentReplyPage] = useState(initialReplyPage);

  const replyLimit = 10; // Số replies mỗi trang

  const fetchThreadDetails = useCallback(
    async (pageToFetch) => {
      try {
        setLoading(true);
        const data = await getThreadBySlug(threadSlug, {
          replyPage: pageToFetch,
          replyLimit,
        });
        setThreadData(data);
        setError(null);
        if (pageToFetch !== currentReplyPage) {
          setCurrentReplyPage(pageToFetch);
        }
        navigate(`${location.pathname}?replyPage=${pageToFetch}`, {
          replace: true,
        });
      } catch (err) {
        setError(err.message || "Không thể tải chi tiết chủ đề.");
        console.error(err);
      }
      setLoading(false);
    },
    [threadSlug, navigate, location.pathname, currentReplyPage]
  );

  useEffect(() => {
    fetchThreadDetails(initialReplyPage);
  }, [threadSlug, initialReplyPage, fetchThreadDetails]);

  const handleReplyPageChange = (newPage) => {
    if (
      newPage >= 1 &&
      newPage <= (threadData.replies.pagination?.totalPages || 1)
    ) {
      fetchThreadDetails(newPage);
    }
  };

  const handleReplyCreated = (newReply) => {
    // Thêm reply mới vào danh sách replies hiện tại hoặc fetch lại trang cuối
    // Đơn giản nhất là fetch lại trang replies hiện tại để có thứ tự đúng nếu có sort phức tạp
    // Hoặc nếu reply luôn được thêm vào cuối, có thể thêm vào state
    setThreadData((prevData) => ({
      ...prevData,
      replies: {
        ...prevData.replies,
        items: [...prevData.replies.items, newReply],
        // Cập nhật pagination nếu cần, ví dụ totalItems
      },
      thread: {
        ...prevData.thread,
        replyCount: (prevData.thread.replyCount || 0) + 1,
        lastReplyTime: newReply.createdAt, // Cập nhật lastReplyTime
        // lastReplyAuthor sẽ được cập nhật bởi backend hook, nhưng có thể cập nhật ở client nếu muốn
      },
    }));
    // Hoặc fetch lại trang cuối nếu muốn đảm bảo
    // if (threadData.replies.pagination.totalPages > currentReplyPage && threadData.replies.items.length === replyLimit) {
    //   fetchThreadDetails(threadData.replies.pagination.totalPages +1 );
    // } else {
    //   fetchThreadDetails(currentReplyPage);
    // }
  };

  if (loading && !threadData.thread) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="70vh"
      >
        <Spinner size="xl" />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert status="error" mt={4} mx={5}>
        <AlertIcon />
        <Text>{error}</Text>
        <Button
          ml={4}
          onClick={() => fetchThreadDetails(currentReplyPage)}
          size="sm"
        >
          Thử lại
        </Button>
      </Alert>
    );
  }

  const { thread, replies } = threadData;

  if (!thread) {
    return (
      <Alert status="warning" mt={4} mx={5}>
        <AlertIcon />
        <Text>Không tìm thấy chủ đề.</Text>
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

        {/* Thread Content */}
        <Box
          p={5}
          borderWidth="1px"
          borderRadius="md"
          borderColor="gray.700"
          bg="background.secondaryAlt"
        >
          <Heading as="h1" size="lg" mb={3}>
            {thread.title}
          </Heading>
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
          <Divider my={4} borderColor="gray.600" />
          <Box
            className="thread-content"
            whiteSpace="pre-wrap"
            dangerouslySetInnerHTML={{
              __html: thread.content.replace(/\n/g, "<br />"),
            }}
          />
          {/* TODO: Sanitize HTML content if it comes from a rich text editor. For now, basic pre-wrap. */}
        </Box>

        {/* Replies List */}
        <Heading size="lg" mt={8} mb={4}>
          Trả lời ({replies.pagination?.totalItems || 0})
        </Heading>
        {loading && replies.items.length === 0 && <Spinner />}
        {replies.items.length > 0 ? (
          <VStack spacing={5} align="stretch">
            {replies.items.map((reply) => (
              <Box
                key={reply._id}
                p={4}
                borderWidth="1px"
                borderRadius="md"
                borderColor="gray.700"
                bg="background.card"
              >
                <HStack spacing={3} mb={2} fontSize="sm" color="gray.400">
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
                <Box
                  whiteSpace="pre-wrap"
                  dangerouslySetInnerHTML={{
                    __html: reply.content.replace(/\n/g, "<br />"),
                  }}
                />
                {/* TODO: Sanitize HTML content for replies as well */}
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
        <ReplyForm threadId={thread._id} onReplyCreated={handleReplyCreated} />
      </VStack>
    </Box>
  );
};

export default ForumThreadDetailPage;
