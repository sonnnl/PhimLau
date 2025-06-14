import React from "react";
import {
  Box,
  Heading,
  Text,
  HStack,
  Icon,
  Link,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Avatar,
  VStack,
  Flex,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import {
  FiHome,
  FiChevronRight,
  FiClock,
  FiMessageSquare,
} from "react-icons/fi";

// Helper function to format date
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

const ThreadDetailHeader = ({ thread, categoryName }) => {
  if (!thread) return null;

  return (
    <Box mb={6}>
      {/* Breadcrumb Navigation */}
      <Breadcrumb
        spacing="8px"
        separator={<Icon as={FiChevronRight} color="gray.500" />}
        mb={4}
      >
        <BreadcrumbItem>
          <BreadcrumbLink
            as={RouterLink}
            to="/"
            display="flex"
            alignItems="center"
          >
            <Icon as={FiHome} mr={1} />
            Trang chủ
          </BreadcrumbLink>
        </BreadcrumbItem>

        <BreadcrumbItem>
          <BreadcrumbLink as={RouterLink} to="/forum">
            Diễn đàn
          </BreadcrumbLink>
        </BreadcrumbItem>

        {thread.category && (
          <BreadcrumbItem>
            <BreadcrumbLink
              as={RouterLink}
              to={`/forum/category/${thread.category.slug}`}
            >
              {categoryName || thread.category.name}
            </BreadcrumbLink>
          </BreadcrumbItem>
        )}

        <BreadcrumbItem isCurrentPage>
          <Text color="gray.400" isTruncated maxW="300px">
            {thread.title}
          </Text>
        </BreadcrumbItem>
      </Breadcrumb>

      {/* Thread Header */}
      <Box
        p={6}
        bg="background.secondary"
        rounded="lg"
        shadow="md"
        borderLeft="4px solid"
        borderLeftColor="brand.accent"
      >
        <VStack align="start" spacing={4}>
          <Heading as="h1" size="lg" color="whiteAlpha.900" lineHeight="1.3">
            {thread.title}
          </Heading>

          <Flex
            w="full"
            justify="space-between"
            align={{ base: "start", md: "center" }}
            direction={{ base: "column", md: "row" }}
            gap={4}
          >
            {/* Author Info */}
            <HStack spacing={3}>
              <Avatar
                size="sm"
                name={thread.author?.displayName || thread.author?.username}
                src={thread.author?.avatarUrl}
              />
              <VStack align="start" spacing={0}>
                <Text fontWeight="semibold" color="whiteAlpha.900">
                  {thread.author?.displayName ||
                    thread.author?.username ||
                    "Ẩn danh"}
                </Text>
                <HStack spacing={4} color="gray.400" fontSize="sm">
                  <HStack spacing={1}>
                    <Icon as={FiClock} />
                    <Text>{formatDate(thread.createdAt)}</Text>
                  </HStack>
                  <HStack spacing={1}>
                    <Icon as={FiMessageSquare} />
                    <Text>{thread.replyCount || 0} phản hồi</Text>
                  </HStack>
                </HStack>
              </VStack>
            </HStack>

            {/* Thread Stats */}
            <HStack spacing={6} color="gray.400" fontSize="sm">
              <VStack spacing={0}>
                <Text fontWeight="semibold" color="whiteAlpha.900">
                  {thread.views || 0}
                </Text>
                <Text>Lượt xem</Text>
              </VStack>
              <VStack spacing={0}>
                <Text fontWeight="semibold" color="whiteAlpha.900">
                  {thread.replyCount || 0}
                </Text>
                <Text>Phản hồi</Text>
              </VStack>
            </HStack>
          </Flex>
        </VStack>
      </Box>
    </Box>
  );
};

export default ThreadDetailHeader;
