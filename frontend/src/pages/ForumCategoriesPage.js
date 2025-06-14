import React from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
  Stat,
  StatNumber,
  StatHelpText,
  Icon,
  Button,
} from "@chakra-ui/react";
import { useForumCategories } from "../hooks/useForumData";
import {
  ForumLoadingState,
  ForumErrorState,
  ForumEmptyState,
} from "../components/forum/ForumErrorBoundary";
import { FiMessageSquare, FiHash, FiUsers } from "react-icons/fi";

const ForumCategoriesPage = () => {
  const { categories, loading, error, refreshCategories } =
    useForumCategories();

  // ===== LOADING STATE =====
  if (loading) {
    return <ForumLoadingState message="Đang tải danh mục diễn đàn..." />;
  }

  // ===== ERROR STATE =====
  if (error) {
    return (
      <ForumErrorState
        error={error}
        onRetry={refreshCategories}
        retryText="Tải lại danh mục"
      />
    );
  }

  // ===== EMPTY STATE =====
  if (categories.length === 0) {
    return (
      <ForumEmptyState
        title="Chưa có danh mục diễn đàn"
        description="Hiện tại chưa có danh mục nào được tạo."
        icon={FiUsers}
      >
        <Button colorScheme="orange" onClick={refreshCategories}>
          Tải lại
        </Button>
      </ForumEmptyState>
    );
  }

  return (
    <Box p={5} maxW="1200px" mx="auto">
      <Heading as="h1" size="xl" mb={6} textAlign="center">
        Danh Mục Diễn Đàn
      </Heading>
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
        {categories.map((category) => (
          <Card
            as={RouterLink}
            to={`/forum/category/${category.slug}`}
            key={category._id}
            variant="outline"
            transition="all 0.2s ease-in-out"
            _hover={{
              transform: "translateY(-4px)",
              shadow: "lg",
              borderColor: "orange.400",
            }}
          >
            <CardHeader pb={2}>
              <Heading size="md" color="orange.400">
                <Icon as={FiHash} mr={2} verticalAlign="middle" />
                {category.name}
              </Heading>
            </CardHeader>
            <CardBody pt={2}>
              {category.description && (
                <Text fontSize="sm" color="gray.400" mb={3} noOfLines={2}>
                  {category.description}
                </Text>
              )}
              <Stat>
                <StatNumber fontSize="lg">
                  <Icon as={FiMessageSquare} mr={2} verticalAlign="middle" />
                  {category.threadCount || 0}
                </StatNumber>
                <StatHelpText>Chủ đề</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        ))}
      </SimpleGrid>
    </Box>
  );
};

export default ForumCategoriesPage;
