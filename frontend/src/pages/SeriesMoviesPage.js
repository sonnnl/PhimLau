import React, { useState, useEffect, useCallback } from "react";
import movieService from "../services/movieService";
import MovieCard from "../components/MovieCard";
import {
  Container,
  Heading,
  SimpleGrid,
  Spinner,
  Text,
  Center,
  Alert,
  AlertIcon,
  Button,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { ChevronRightIcon } from "@chakra-ui/icons";
import InfiniteScroll from "react-infinite-scroll-component";

const SeriesMoviesPage = () => {
  const [movies, setMovies] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);

  const fetchMovies = useCallback(async (currentPage) => {
    if (currentPage === 1) {
      setInitialLoading(true);
    }
    setError(null);
    try {
      const data = await movieService.getSeriesMovies(currentPage);
      const newMovies = data.items || data.movies || [];
      setMovies((prevMovies) =>
        currentPage === 1 ? newMovies : [...prevMovies, ...newMovies]
      );
      if (data.pagination) {
        setHasMore(data.pagination.currentPage < data.pagination.totalPages);
      } else if (newMovies.length === 0 && currentPage > 1) {
        setHasMore(false);
      } else if (newMovies.length < (data.limit || 20)) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
    } catch (err) {
      console.error("Error in fetchMovies (SeriesMoviesPage):", err);
      setError(err.message || "Không thể tải danh sách phim bộ.");
      setHasMore(false);
    } finally {
      if (currentPage === 1) {
        setInitialLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    setMovies([]);
    setPage(1);
    setHasMore(true);
    fetchMovies(1);
  }, [fetchMovies]);

  const loadMoreMovies = () => {
    if (hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchMovies(nextPage);
    }
  };

  return (
    <Container maxW="container.xl" py={8}>
      <Breadcrumb
        spacing="8px"
        separator={<ChevronRightIcon color="gray.500" />}
        mb={6}
      >
        <BreadcrumbItem>
          <BreadcrumbLink as={RouterLink} to="/">
            Trang Chủ
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>
          <BreadcrumbLink href="#">Phim Bộ</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>
      <Heading as="h1" size="xl" mb={6} color="brand.accent" fontWeight="bold">
        Phim Bộ
      </Heading>

      {initialLoading ? (
        <Center minH="300px">
          <Spinner
            size="xl"
            color="brand.accent"
            thickness="4px"
            speed="0.65s"
          />
        </Center>
      ) : error && movies.length === 0 ? (
        <Center minH="200px" flexDirection="column">
          <Alert
            status="error"
            variant="subtle"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            textAlign="center"
            borderRadius="md"
            p={6}
          >
            <AlertIcon boxSize="40px" mr={0} />
            <Text fontWeight="bold" mt={3}>
              Lỗi khi tải phim
            </Text>
            <Text fontSize="sm">{error}</Text>
            <Button
              colorScheme="orange"
              mt={4}
              onClick={() => {
                setInitialLoading(true);
                fetchMovies(1);
              }}
            >
              Thử lại
            </Button>
          </Alert>
        </Center>
      ) : movies.length === 0 ? (
        <Center minH="200px">
          <Text fontSize="xl" color="text.secondary">
            Không có phim bộ nào để hiển thị.
          </Text>
        </Center>
      ) : (
        <InfiniteScroll
          dataLength={movies.length}
          next={loadMoreMovies}
          hasMore={hasMore}
          loader={
            <Center py={5}>
              <Spinner color="brand.accent" />
            </Center>
          }
          endMessage={
            <Center p={4} mt={4}>
              <Text textAlign="center" color="text.secondary">
                Đã hiển thị tất cả phim bộ.
              </Text>
            </Center>
          }
          scrollThreshold="80%"
        >
          <SimpleGrid
            columns={{ base: 2, sm: 3, md: 4, lg: 5, xl: 6 }}
            spacing={{ base: 4, md: 6 }}
          >
            {movies.map((movie, index) => (
              <MovieCard key={`${movie._id}-${index}`} movie={movie} />
            ))}
          </SimpleGrid>
        </InfiniteScroll>
      )}

      {!initialLoading && error && movies.length > 0 && (
        <Alert status="warning" mt={4}>
          <AlertIcon />
          <Text fontSize="sm">
            Đã có lỗi khi tải thêm phim: {error}. Hiển thị dữ liệu đã tải được.
          </Text>
        </Alert>
      )}
    </Container>
  );
};

export default SeriesMoviesPage;
