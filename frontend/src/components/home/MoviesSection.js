import React from "react";
import {
  Box,
  Heading,
  Text,
  Spinner,
  Center,
  SimpleGrid,
  Button,
  Flex,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";
import { ArrowForwardIcon } from "@chakra-ui/icons";
import MovieCard from "../MovieCard";

const SectionHeader = ({ title, onViewMore }) => (
  <Flex justify="space-between" align="center" mb={6}>
    <Heading as="h2" size="lg" color="whiteAlpha.900" fontWeight="bold">
      {title}
    </Heading>
    {onViewMore && (
      <Button
        rightIcon={<ArrowForwardIcon />}
        colorScheme="orange"
        variant="link"
        onClick={onViewMore}
        color="brand.accent"
        fontSize="md"
        _hover={{
          textDecoration: "underline",
          transform: "translateX(2px)",
        }}
        transition="all 0.2s"
      >
        Xem Tất Cả
      </Button>
    )}
  </Flex>
);

const MovieGrid = ({ movies, loading, error }) => {
  if (loading) {
    return (
      <Center h="200px">
        <Spinner size="lg" color="brand.accent" thickness="4px" speed="0.65s" />
      </Center>
    );
  }

  if (error) {
    return (
      <Center h="150px">
        <Alert status="error" variant="subtle" rounded="md" maxW="400px">
          <AlertIcon />
          <Box>
            <Text fontWeight="bold" fontSize="sm">
              Lỗi tải dữ liệu
            </Text>
            <Text fontSize="xs" color="gray.600">
              {error}
            </Text>
          </Box>
        </Alert>
      </Center>
    );
  }

  if (!movies || movies.length === 0) {
    return (
      <Center
        h="150px"
        bg="background.secondary"
        rounded="md"
        border="1px dashed"
        borderColor="gray.600"
      >
        <Text color="gray.500">Không có phim nào để hiển thị.</Text>
      </Center>
    );
  }

  return (
    <SimpleGrid
      columns={{ base: 2, sm: 3, md: 4, lg: 5, xl: 6 }}
      spacing={{ base: 3, md: 5 }}
    >
      {movies.map((movie, index) => (
        <MovieCard key={`${movie._id || movie.slug}-${index}`} movie={movie} />
      ))}
    </SimpleGrid>
  );
};

const MoviesSection = ({
  title,
  movies,
  loading,
  error,
  onViewMore,
  maxItems = 6,
}) => {
  // Limit movies to maxItems
  const displayMovies = movies ? movies.slice(0, maxItems) : [];

  return (
    <Box>
      <SectionHeader title={title} onViewMore={onViewMore} />
      <MovieGrid movies={displayMovies} loading={loading} error={error} />
    </Box>
  );
};

export default MoviesSection;
