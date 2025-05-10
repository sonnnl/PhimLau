import React, { useState, useEffect } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Heading,
  Text,
  VStack,
  Spinner,
  Alert,
  AlertIcon,
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
  Stat,
  StatNumber,
  StatHelpText,
  Icon,
} from "@chakra-ui/react";
import { getCategories } from "../services/forumService";
import { FiMessageSquare, FiHash } from "react-icons/fi"; // Ví dụ icons

const ForumCategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const data = await getCategories();
        setCategories(data);
        setError(null);
      } catch (err) {
        setError(err.message || "Không thể tải danh mục diễn đàn.");
        console.error(err);
      }
      setLoading(false);
    };

    fetchCategories();
  }, []);

  if (loading) {
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
      <Alert status="error" mt={4}>
        <AlertIcon />
        <Text>{error}</Text>
      </Alert>
    );
  }

  if (categories.length === 0) {
    return (
      <Box textAlign="center" mt={10}>
        <Heading as="h2" size="lg" mb={4}>
          Diễn đàn
        </Heading>
        <Text>Hiện chưa có danh mục nào.</Text>
      </Box>
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
