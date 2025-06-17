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
  Tag,
  SimpleGrid,
  Icon,
  Link,
  Button,
  Divider,
} from "@chakra-ui/react";
import { getPublicProfile } from "../services/socialService";
import { FiUsers, FiMessageSquare, FiCalendar } from "react-icons/fi";

const StatCard = ({ icon, label, value }) => (
  <HStack
    p={4}
    bg="background.secondary"
    borderRadius="md"
    spacing={4}
    align="center"
  >
    <Icon as={icon} boxSize={6} color="orange.400" />
    <VStack align="start" spacing={0}>
      <Text fontSize="2xl" fontWeight="bold">
        {value}
      </Text>
      <Text fontSize="sm" color="gray.400">
        {label}
      </Text>
    </VStack>
  </HStack>
);

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
      <Box display="flex" justifyContent="center" alignItems="center" h="80vh">
        <Spinner size="xl" />
      </Box>
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
    return null;
  }

  const { user, stats, recentThreads } = profile;

  return (
    <Container maxW="container.lg" py={8}>
      <VStack spacing={8} align="stretch">
        {/* User Info Header */}
        <HStack
          spacing={6}
          p={6}
          bg="background.card"
          borderRadius="lg"
          boxShadow="lg"
        >
          <Avatar size="xl" name={user.displayName} src={user.avatarUrl} />
          <VStack align="start" spacing={1}>
            <Heading size="lg">{user.displayName}</Heading>
            <HStack>
              <Tag
                colorScheme={user.role === "admin" ? "red" : "blue"}
                size="md"
              >
                {user.role}
              </Tag>
              <HStack color="gray.500" fontSize="sm">
                <Icon as={FiCalendar} />
                <Text>
                  Tham gia vào{" "}
                  {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                </Text>
              </HStack>
            </HStack>
          </VStack>
        </HStack>

        {/* Stats Section */}
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
          <StatCard
            icon={FiMessageSquare}
            label="Chủ đề đã tạo"
            value={stats.totalThreads}
          />
          <StatCard
            icon={FiUsers}
            label="Bình luận đã viết"
            value={stats.totalReplies}
          />
        </SimpleGrid>

        {/* Recent Threads Section */}
        <VStack spacing={4} align="stretch">
          <Heading size="md">Hoạt động gần đây</Heading>
          {recentThreads.length > 0 ? (
            <VStack
              divider={<Divider borderColor="gray.700" />}
              spacing={4}
              p={4}
              bg="background.card"
              borderRadius="md"
            >
              {recentThreads.map((thread) => (
                <Box key={thread._id} w="full">
                  <HStack justify="space-between">
                    <VStack align="start" spacing={0}>
                      <Link
                        as={RouterLink}
                        to={`/forum/thread/${thread.slug}`}
                        fontWeight="semibold"
                      >
                        {thread.title}
                      </Link>
                      <Text fontSize="sm" color="gray.400">
                        trong mục{" "}
                        <Link
                          as={RouterLink}
                          to={`/forum/category/${thread.category.slug}`}
                          color="orange.400"
                        >
                          {thread.category.name}
                        </Link>
                      </Text>
                    </VStack>
                    <Text fontSize="xs" color="gray.500">
                      {new Date(thread.createdAt).toLocaleDateString("vi-VN")}
                    </Text>
                  </HStack>
                </Box>
              ))}
            </VStack>
          ) : (
            <Text color="gray.500" p={4} bg="background.card" borderRadius="md">
              Người dùng này chưa có hoạt động nào.
            </Text>
          )}
        </VStack>
      </VStack>
    </Container>
  );
};

export default UserProfilePage;
