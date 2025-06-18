import React, { useState, useEffect } from "react";
import { useParams, Link as RouterLink } from "react-router-dom";
import {
  Box,
  Heading,
  Text,
  Spinner,
  Alert,
  AlertIcon,
  Container,
  VStack,
  HStack,
  Avatar,
  SimpleGrid,
  Icon,
  Link,
  Divider,
  Card,
  CardBody,
  Badge,
  Tabs,
  TabList,
  Tab,
  TabPanel,
  TabPanels,
  Flex,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
} from "@chakra-ui/react";
import { getPublicProfile } from "../services/socialService";
import {
  FiUsers,
  FiMessageSquare,
  FiCalendar,
  FiMail,
  FiStar,
  FiActivity,
  FiEye,
  FiThumbsUp,
  FiShield,
  FiUser,
  FiMessageCircle,
} from "react-icons/fi";

const getTrustLevelInfo = (level) => {
  switch (level) {
    case "new":
      return { label: "Thành viên mới", color: "gray", icon: FiUser };
    case "basic":
      return { label: "Thành viên cơ bản", color: "blue", icon: FiUser };
    case "active":
      return {
        label: "Thành viên tích cực",
        color: "green",
        icon: FiActivity,
      };
    case "trusted":
      return {
        label: "Thành viên tin cậy",
        color: "purple",
        icon: FiShield,
      };
    case "veteran":
      return {
        label: "Thành viên kỳ cựu",
        color: "orange",
        icon: FiStar,
      };
    case "moderator":
      return {
        label: "Điều hành viên",
        color: "yellow",
        icon: FiShield,
      };
    case "admin":
      return { label: "Quản trị viên", color: "red", icon: FiShield };
    default:
      return { label: "Chưa phân loại", color: "gray", icon: FiUser };
  }
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatDateTime = (dateString) => {
  return new Date(dateString).toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const UserProfilePage = () => {
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await getPublicProfile(userId);
        if (res.success) {
          setProfile(res.data);
        } else {
          setError(res.message);
        }
      } catch (err) {
        setError(err.message || "Đã xảy ra lỗi không xác định.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [userId]);

  if (loading) {
    return (
      <Container maxW="6xl" py={8}>
        <Flex justify="center" align="center" minH="400px">
          <Spinner size="xl" color="brand.accent" />
        </Flex>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxW="container.md" py={10}>
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          {error}
        </Alert>
      </Container>
    );
  }

  if (!profile) {
    return (
      <Container maxW="container.md" py={10}>
        <Alert status="warning" borderRadius="md">
          <AlertIcon />
          Không tìm thấy thông tin người dùng.
        </Alert>
      </Container>
    );
  }

  const { user, stats, recentThreads, recentReviews } = profile;

  return (
    <Container maxW="6xl" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Header Profile */}
        <Card bg="background.secondary" shadow="lg">
          <CardBody>
            <Flex
              direction={{ base: "column", md: "row" }}
              align="center"
              gap={6}
            >
              <Avatar
                size="2xl"
                src={user.avatarUrl}
                name={user.displayName || user.username}
              />
              <VStack
                align={{ base: "center", md: "start" }}
                spacing={3}
                flex={1}
              >
                <Heading size="xl" color="brand.accent">
                  {user.displayName || user.username}
                </Heading>
                <Text fontSize="lg" color="gray.400">
                  @{user.username}
                </Text>
                <HStack spacing={4} wrap="wrap">
                  <HStack>
                    <Icon as={FiCalendar} color="brand.accent" />
                    <Text>Tham gia từ {formatDate(user.createdAt)}</Text>
                  </HStack>
                  <Badge colorScheme={user.role === "admin" ? "red" : "blue"}>
                    {user.role === "admin" ? "Admin" : "Thành viên"}
                  </Badge>
                  {user.role !== "admin" && user.trustLevel && (
                    <Badge
                      colorScheme={getTrustLevelInfo(user.trustLevel).color}
                    >
                      {getTrustLevelInfo(user.trustLevel).label}
                    </Badge>
                  )}
                </HStack>
              </VStack>
            </Flex>
          </CardBody>
        </Card>

        {/* Statistics */}
        <SimpleGrid columns={{ base: 1, md: 3, lg: 6 }} spacing={6}>
          <Card bg="background.secondary">
            <CardBody>
              <Flex align="center">
                <Flex
                  align="center"
                  justify="center"
                  bg="yellow.500"
                  color="white"
                  boxSize={12}
                  borderRadius="lg"
                  mr={4}
                >
                  <Icon as={FiStar} boxSize={6} />
                </Flex>
                <Box>
                  <Text fontSize="sm" color="gray.400">
                    Tổng đánh giá
                  </Text>
                  <Text fontSize="2xl" fontWeight="bold" color="brand.accent">
                    {stats?.totalReviews || 0}
                  </Text>
                </Box>
              </Flex>
            </CardBody>
          </Card>
          <Card bg="background.secondary">
            <CardBody>
              <Flex align="center">
                <Flex
                  align="center"
                  justify="center"
                  bg="blue.500"
                  color="white"
                  boxSize={12}
                  borderRadius="lg"
                  mr={4}
                >
                  <Icon as={FiMessageSquare} boxSize={6} />
                </Flex>
                <Box>
                  <Text fontSize="sm" color="gray.400">
                    Bài viết Forum
                  </Text>
                  <Text fontSize="2xl" fontWeight="bold" color="brand.accent">
                    {stats?.totalThreads || 0}
                  </Text>
                </Box>
              </Flex>
            </CardBody>
          </Card>
          <Card bg="background.secondary">
            <CardBody>
              <Flex align="center">
                <Flex
                  align="center"
                  justify="center"
                  bg="cyan.500"
                  color="white"
                  boxSize={12}
                  borderRadius="lg"
                  mr={4}
                >
                  <Icon as={FiMessageCircle} boxSize={6} />
                </Flex>
                <Box>
                  <Text fontSize="sm" color="gray.400">
                    Trả lời Forum
                  </Text>
                  <Text fontSize="2xl" fontWeight="bold" color="brand.accent">
                    {stats?.totalReplies || 0}
                  </Text>
                </Box>
              </Flex>
            </CardBody>
          </Card>
          <Card bg="background.secondary">
            <CardBody>
              <Flex align="center">
                <Flex
                  align="center"
                  justify="center"
                  bg="orange.500"
                  color="white"
                  boxSize={12}
                  borderRadius="lg"
                  mr={4}
                >
                  <Icon as={FiStar} boxSize={6} />
                </Flex>
                <Box>
                  <Text fontSize="sm" color="gray.400">
                    Điểm trung bình
                  </Text>
                  <Text fontSize="2xl" fontWeight="bold" color="brand.accent">
                    {stats?.averageRating
                      ? stats.averageRating.toFixed(1)
                      : "0.0"}
                  </Text>
                </Box>
              </Flex>
            </CardBody>
          </Card>
          <Card bg="background.secondary">
            <CardBody>
              <Flex align="center">
                <Flex
                  align="center"
                  justify="center"
                  bg="pink.500"
                  color="white"
                  boxSize={12}
                  borderRadius="lg"
                  mr={4}
                >
                  <Icon as={FiThumbsUp} boxSize={6} />
                </Flex>
                <Box>
                  <Text fontSize="sm" color="gray.400">
                    Tổng lượt thích
                  </Text>
                  <Text fontSize="2xl" fontWeight="bold" color="brand.accent">
                    {stats?.totalLikes || 0}
                  </Text>
                </Box>
              </Flex>
            </CardBody>
          </Card>
          <Card
            bg={`${getTrustLevelInfo(user.trustLevel).color}.800`}
            color="white"
            overflow="hidden"
            position="relative"
          >
            <CardBody>
              <VStack align="center" justify="center" h="100%">
                <Icon
                  as={getTrustLevelInfo(user.trustLevel).icon}
                  boxSize={10}
                  color="white"
                  position="absolute"
                  top={-3}
                  right={-3}
                  opacity={0.1}
                  transform="rotate(-15deg)"
                />
                <Text fontSize="sm" fontWeight="bold" textTransform="uppercase">
                  Cấp độ tin cậy
                </Text>
                <Text fontSize="2xl" fontWeight="bold" textAlign="center">
                  {getTrustLevelInfo(user.trustLevel).label}
                </Text>
              </VStack>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Tabs Content */}
        <Card bg="background.secondary">
          <CardBody>
            <Tabs variant="line" colorScheme="brand">
              <TabList>
                <Tab>
                  <Icon as={FiStar} mr={2} />
                  Đánh giá gần đây
                </Tab>
                <Tab>
                  <Icon as={FiMessageSquare} mr={2} />
                  Hoạt động Forum
                </Tab>
              </TabList>

              <TabPanels>
                {/* Recent Reviews */}
                <TabPanel>
                  <VStack spacing={4} align="stretch">
                    <Heading size="md">Đánh giá phim gần đây</Heading>
                    {recentReviews?.length > 0 ? (
                      <TableContainer>
                        <Table variant="simple" size="sm">
                          <Thead>
                            <Tr>
                              <Th>Phim</Th>
                              <Th>Điểm</Th>
                              <Th>Bình luận</Th>
                              <Th>Ngày</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {recentReviews.map((review) => (
                              <Tr key={review._id}>
                                <Td>
                                  {review.movie ? (
                                    <Link
                                      as={RouterLink}
                                      to={`/movie/${review.movie.slug}`}
                                      fontWeight="semibold"
                                      color="brand.accent"
                                    >
                                      {review.movie.name}
                                    </Link>
                                  ) : (
                                    <Text fontStyle="italic" color="gray.500">
                                      Phim đã bị xóa
                                    </Text>
                                  )}
                                </Td>
                                <Td>
                                  <HStack>
                                    <Icon as={FiStar} color="yellow.400" />
                                    <Text>{review.rating}/5</Text>
                                  </HStack>
                                </Td>
                                <Td>
                                  <Text noOfLines={2} maxW="200px">
                                    {review.content}
                                  </Text>
                                </Td>
                                <Td>{formatDateTime(review.createdAt)}</Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Text color="gray.500" textAlign="center" py={8}>
                        Chưa có đánh giá nào
                      </Text>
                    )}
                  </VStack>
                </TabPanel>

                {/* Forum Activity */}
                <TabPanel>
                  <VStack spacing={4} align="stretch">
                    <Heading size="md">Hoạt động Forum gần đây</Heading>
                    {recentThreads?.length > 0 ? (
                      <VStack spacing={3} align="stretch">
                        {recentThreads.map((thread) => (
                          <Card
                            key={thread._id}
                            bg="background.primary"
                            size="sm"
                          >
                            <CardBody>
                              <Flex justify="space-between" align="start">
                                <VStack align="start" spacing={1} flex={1}>
                                  <Link
                                    as={RouterLink}
                                    to={`/forum/thread/${thread.slug}`}
                                    fontWeight="semibold"
                                    color="brand.accent"
                                  >
                                    {thread.title}
                                  </Link>
                                  {thread.category && (
                                    <Badge
                                      colorScheme="purple"
                                      size="sm"
                                      mb={1}
                                    >
                                      {thread.category.name}
                                    </Badge>
                                  )}
                                  <HStack
                                    spacing={4}
                                    fontSize="sm"
                                    color="gray.400"
                                  >
                                    <HStack>
                                      <Icon as={FiMessageSquare} />
                                      <Text>
                                        {thread.replyCount || 0} trả lời
                                      </Text>
                                    </HStack>
                                    <HStack>
                                      <Icon as={FiEye} />
                                      <Text>{thread.views || 0} lượt xem</Text>
                                    </HStack>
                                  </HStack>
                                </VStack>
                                <Text fontSize="sm" color="gray.500">
                                  {formatDateTime(thread.createdAt)}
                                </Text>
                              </Flex>
                            </CardBody>
                          </Card>
                        ))}
                      </VStack>
                    ) : (
                      <Text color="gray.500" textAlign="center" py={8}>
                        Chưa có hoạt động Forum nào
                      </Text>
                    )}
                  </VStack>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </CardBody>
        </Card>
      </VStack>
    </Container>
  );
};

export default UserProfilePage;
