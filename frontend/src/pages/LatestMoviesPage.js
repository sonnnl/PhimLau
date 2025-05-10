import React, { useState, useEffect } from "react";
import {
  Container,
  Heading,
  Text,
  Spinner,
  Center,
  SimpleGrid,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { ChevronRightIcon } from "@chakra-ui/icons";
import InfiniteScroll from "react-infinite-scroll-component";
import movieService from "../services/movieService";
import MovieCard from "../components/MovieCard";

const LatestMoviesPage = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);

  const fetchMovies = async (pageToFetch) => {
    if (pageToFetch === 1) {
      setLoading(true);
      setInitialLoad(true);
    }
    setError(null);
    try {
      const data = await movieService.getLatestMovies(pageToFetch);
      if (data && data.items) {
        setMovies((prevMovies) =>
          pageToFetch === 1 ? data.items : [...prevMovies, ...data.items]
        );
        if (
          data.pagination &&
          data.pagination.currentPage >= data.pagination.totalPages
        ) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }
      } else {
        setHasMore(false);
        if (pageToFetch === 1) setMovies([]);
      }
    } catch (err) {
      setError(err.message || "Không thể tải danh sách phim.");
      console.error("Error in LatestMoviesPage fetching movies:", err);
      setHasMore(false);
    } finally {
      if (pageToFetch === 1) {
        setLoading(false);
        setInitialLoad(false);
      }
    }
  };

  // Fetch trang đầu tiên khi component mount
  useEffect(() => {
    fetchMovies(1);
  }, []); // Chỉ chạy 1 lần

  // Hàm để InfiniteScroll gọi khi cần tải thêm
  const fetchMoreData = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    fetchMovies(nextPage);
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
          <BreadcrumbLink href="#">Phim Mới Cập Nhật</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>

      <Heading as="h1" size="xl" mb={6} color="brand.accent" fontWeight="bold">
        Phim Mới Cập Nhật
      </Heading>

      {initialLoad && loading && (
        <Center h="300px">
          <Spinner
            size="xl"
            color="brand.accent"
            thickness="4px"
            speed="0.65s"
          />
        </Center>
      )}

      {error && !initialLoad && (
        <Center h="200px">
          <Text color="red.400" bg="red.50" p={4} rounded="md">
            Lỗi: {error}
          </Text>
        </Center>
      )}

      {!initialLoad && !error && movies.length === 0 && (
        <Center h="200px">
          <Text color="gray.500">Không có phim nào để hiển thị.</Text>
        </Center>
      )}

      {/* Sử dụng InfiniteScroll */}
      {movies.length > 0 && (
        <InfiniteScroll
          dataLength={movies.length} // Số lượng item hiện tại
          next={fetchMoreData} // Hàm để gọi khi cần load thêm
          hasMore={hasMore} // Boolean cho biết còn dữ liệu không
          loader={
            <Center h="100px">
              <Spinner size="lg" color="brand.accent" thickness="3px" />
            </Center>
          }
          endMessage={
            <Center p={4} mt={4}>
              <Text textAlign="center" color="gray.500">
                Đã xem hết phim mới! ^_^
              </Text>
            </Center>
          }
          style={{ overflow: "visible" }} // Quan trọng để shadow của Card không bị cắt
        >
          <SimpleGrid
            columns={{ base: 2, sm: 3, md: 4, lg: 5, xl: 6 }}
            spacing={{ base: 4, md: 6 }}
          >
            {movies.map((movie, index) => (
              <MovieCard key={`${movie.slug}-${index}`} movie={movie} />
            ))}
          </SimpleGrid>
        </InfiniteScroll>
      )}
    </Container>
  );
};

export default LatestMoviesPage;
