import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Box,
  Heading,
  VStack,
  HStack,
  Text,
  Badge,
  Card,
  CardBody,
  Flex,
  Icon,
  Button,
  Tabs,
  TabList,
  Tab,
  Link,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useColorModeValue,
  StatGroup,
  Stat,
  StatLabel,
  StatNumber,
  Divider,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import {
  FiMessageSquare,
  FiEye,
  FiClock,
  FiCheck,
  FiX,
  FiPlusCircle,
  FiBookmark,
} from "react-icons/fi";
import { getUserThreads } from "../services/userService";
import { useAuth } from "../contexts/AuthContext";
import Pagination from "../components/common/Pagination";

const MyThreadsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // State management
  const [threadsData, setThreadsData] = useState({
    threads: [],
    pagination: {},
    statusStats: {},
    currentFilter: { status: "all", category: "all" },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // URL params
  const currentPage = parseInt(searchParams.get("page")) || 1;
  const currentStatus = searchParams.get("status") || "all";

  // Theme colors
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const textColor = useColorModeValue("gray.800", "white");
  const mutedColor = useColorModeValue("gray.600", "gray.400");

  // Fetch threads function
  const fetchThreads = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: currentPage,
        limit: 15,
      };

      if (currentStatus !== "all") {
        params.status = currentStatus;
      }

      const response = await getUserThreads(params.page, params.limit, params);
      setThreadsData(response.data);
    } catch (err) {
      setError(err.message || "Không thể tải danh sách bài viết");
      console.error("Error fetching user threads:", err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, currentStatus]);

  // Effects
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    fetchThreads();
  }, [isAuthenticated, navigate, fetchThreads]);

  // Handlers
  const handleStatusChange = (status) => {
    const newParams = new URLSearchParams(searchParams);
    if (status === "all") {
      newParams.delete("status");
    } else {
      newParams.set("status", status);
    }
    newParams.delete("page"); // Reset to page 1
    setSearchParams(newParams);
  };

  const handlePageChange = (page) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("page", page.toString());
    setSearchParams(newParams);
  };

  // Utility functions
  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { colorScheme: "yellow", icon: FiClock, text: "Chờ duyệt" },
      approved: { colorScheme: "green", icon: FiCheck, text: "Đã duyệt" },
      rejected: { colorScheme: "red", icon: FiX, text: "Bị từ chối" },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <Badge colorScheme={config.colorScheme} variant="subtle">
        <HStack spacing={1}>
          <Icon as={config.icon} boxSize={3} />
          <Text>{config.text}</Text>
        </HStack>
      </Badge>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <Box maxW="1200px" mx="auto" px={4} py={6}>
      {/* Header */}
      <VStack spacing={6} align="stretch">
        <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
          <Heading size="lg" color={textColor}>
            Bài viết của tôi
          </Heading>
          <Button
            as={RouterLink}
            to="/forum/create-thread"
            colorScheme="orange"
            leftIcon={<Icon as={FiPlusCircle} />}
            size="md"
          >
            Tạo bài viết mới
          </Button>
        </Flex>

        {/* Statistics */}
        {threadsData.statusStats && (
          <Card bg={bgColor} border="1px" borderColor={borderColor}>
            <CardBody>
              <StatGroup>
                <Stat>
                  <StatLabel>Tổng bài viết</StatLabel>
                  <StatNumber color="blue.500">
                    {threadsData.statusStats.total || 0}
                  </StatNumber>
                </Stat>
                <Stat>
                  <StatLabel>Đã duyệt</StatLabel>
                  <StatNumber color="green.500">
                    {threadsData.statusStats.approved || 0}
                  </StatNumber>
                </Stat>
                <Stat>
                  <StatLabel>Chờ duyệt</StatLabel>
                  <StatNumber color="yellow.500">
                    {threadsData.statusStats.pending || 0}
                  </StatNumber>
                </Stat>
                <Stat>
                  <StatLabel>Bị từ chối</StatLabel>
                  <StatNumber color="red.500">
                    {threadsData.statusStats.rejected || 0}
                  </StatNumber>
                </Stat>
              </StatGroup>
            </CardBody>
          </Card>
        )}

        {/* Filter Tabs */}
        <Tabs
          index={
            currentStatus === "all"
              ? 0
              : currentStatus === "approved"
              ? 1
              : currentStatus === "pending"
              ? 2
              : currentStatus === "rejected"
              ? 3
              : 0
          }
          onChange={(index) => {
            const statusMap = ["all", "approved", "pending", "rejected"];
            handleStatusChange(statusMap[index]);
          }}
          colorScheme="orange"
        >
          <TabList>
            <Tab>
              Tất cả{" "}
              <Badge ml={2} colorScheme="gray" variant="subtle">
                {threadsData.statusStats.total || 0}
              </Badge>
            </Tab>
            <Tab>
              Đã duyệt{" "}
              <Badge ml={2} colorScheme="green" variant="subtle">
                {threadsData.statusStats.approved || 0}
              </Badge>
            </Tab>
            <Tab>
              Chờ duyệt{" "}
              <Badge ml={2} colorScheme="yellow" variant="subtle">
                {threadsData.statusStats.pending || 0}
              </Badge>
            </Tab>
            <Tab>
              Bị từ chối{" "}
              <Badge ml={2} colorScheme="red" variant="subtle">
                {threadsData.statusStats.rejected || 0}
              </Badge>
            </Tab>
          </TabList>
        </Tabs>
      </VStack>

      <Divider my={6} />

      {/* Content */}
      {loading ? (
        <Center py={12}>
          <VStack spacing={4}>
            <Spinner size="xl" color="orange.500" />
            <Text color={mutedColor}>Đang tải danh sách bài viết...</Text>
          </VStack>
        </Center>
      ) : error ? (
        <Alert status="error" rounded="lg">
          <AlertIcon />
          <VStack align="start" spacing={2}>
            <AlertTitle>Có lỗi xảy ra!</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
            <Button size="sm" colorScheme="red" onClick={fetchThreads}>
              Thử lại
            </Button>
          </VStack>
        </Alert>
      ) : threadsData.threads.length === 0 ? (
        <Card bg={bgColor} border="1px" borderColor={borderColor}>
          <CardBody>
            <VStack spacing={4} py={8}>
              <Icon as={FiMessageSquare} boxSize={12} color={mutedColor} />
              <Text color={mutedColor} fontSize="lg">
                {currentStatus === "all"
                  ? "Bạn chưa có bài viết nào"
                  : `Không có bài viết nào ${
                      currentStatus === "pending"
                        ? "đang chờ duyệt"
                        : currentStatus === "approved"
                        ? "đã được duyệt"
                        : "bị từ chối"
                    }`}
              </Text>
              <Button
                as={RouterLink}
                to="/forum/create-thread"
                colorScheme="orange"
                leftIcon={<Icon as={FiPlusCircle} />}
              >
                Tạo bài viết đầu tiên
              </Button>
            </VStack>
          </CardBody>
        </Card>
      ) : (
        <VStack spacing={4} align="stretch">
          {threadsData.threads.map((thread) => (
            <Card
              key={thread._id}
              bg={thread.isPinned ? "purple.900" : bgColor}
              border="1px"
              borderColor={thread.isPinned ? "purple.400" : borderColor}
              _hover={{
                shadow: "lg",
                transform: "translateY(-2px)",
                borderColor: thread.isPinned ? "purple.300" : borderColor,
              }}
              transition="all 0.2s"
              // ✨ PINNED THREAD STYLING
              {...(thread.isPinned && {
                borderLeftWidth: "4px",
                borderLeftColor: "purple.400",
                shadow: "lg",
              })}
            >
              <CardBody>
                <Flex justify="space-between" align="start" gap={4}>
                  {/* Thread Info */}
                  <VStack align="start" spacing={3} flex={1}>
                    <HStack spacing={3} align="start" w="full">
                      <VStack align="start" spacing={1} flex={1}>
                        <HStack spacing={2} align="center" w="full">
                          {/* ✨ PINNED ICON */}
                          {thread.isPinned && (
                            <Icon
                              as={FiBookmark}
                              color="purple.400"
                              boxSize={4}
                              transform="rotate(15deg)"
                            />
                          )}
                          <Link
                            as={RouterLink}
                            to={`/forum/thread/${thread.slug}`}
                            fontSize="lg"
                            fontWeight="semibold"
                            color={
                              thread.isPinned ? "purple.300" : "orange.400"
                            }
                            _hover={{
                              color: thread.isPinned
                                ? "purple.200"
                                : "orange.300",
                            }}
                            noOfLines={2}
                            flex={1}
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
                            >
                              📌 GHIM
                            </Badge>
                          )}
                        </HStack>
                        <HStack spacing={4} fontSize="sm" color={mutedColor}>
                          <HStack>
                            <Icon as={FiClock} />
                            <Text>{formatDate(thread.createdAt)}</Text>
                          </HStack>
                          {thread.category && (
                            <Badge colorScheme="purple" variant="outline">
                              {thread.category.name}
                            </Badge>
                          )}
                        </HStack>
                      </VStack>
                      <VStack align="end" spacing={2}>
                        {getStatusBadge(thread.moderationStatus)}
                        <HStack spacing={4} fontSize="sm" color={mutedColor}>
                          <HStack>
                            <Icon as={FiMessageSquare} />
                            <Text>{thread.replyCount || 0}</Text>
                          </HStack>
                          <HStack>
                            <Icon as={FiEye} />
                            <Text>{thread.views || 0}</Text>
                          </HStack>
                        </HStack>
                      </VStack>
                    </HStack>

                    {/* Moderation Note */}
                    {thread.moderationNote && (
                      <Alert status="warning" size="sm" rounded="md">
                        <AlertIcon />
                        <VStack align="start" spacing={1}>
                          <Text fontSize="sm" fontWeight="semibold">
                            Ghi chú kiểm duyệt:
                          </Text>
                          <Text fontSize="sm">{thread.moderationNote}</Text>
                        </VStack>
                      </Alert>
                    )}
                  </VStack>
                </Flex>
              </CardBody>
            </Card>
          ))}
        </VStack>
      )}

      {/* Pagination */}
      {threadsData.pagination && threadsData.pagination.totalPages > 1 && (
        <Flex justify="center" mt={8}>
          <Pagination
            currentPage={threadsData.pagination.currentPage}
            totalPages={threadsData.pagination.totalPages}
            onPageChange={handlePageChange}
            totalItems={threadsData.pagination.total}
          />
        </Flex>
      )}
    </Box>
  );
};

export default MyThreadsPage;
