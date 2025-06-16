import React, { useState, useEffect } from "react";
import {
  useParams,
  useSearchParams,
  Link as RouterLink,
} from "react-router-dom";
import {
  Container,
  Heading,
  Text,
  Spinner,
  Center,
  SimpleGrid,
  Button,
  HStack,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Icon,
  Box,
} from "@chakra-ui/react";
import { ChevronRightIcon } from "@chakra-ui/icons";
import { FaFilm } from "react-icons/fa";
import movieService from "../services/movieService";
import MovieCard from "../components/MovieCard";

const MOVIES_PER_PAGE = 18;

const GenrePage = () => {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const currentPage = parseInt(searchParams.get("page") || "1", 10);

  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [genreInfo, setGenreInfo] = useState({ titlePage: "", breadCrumb: [] });

  useEffect(() => {
    if (!slug) return;

    const fetchMoviesByGenre = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await movieService.getMoviesByGenre(
          slug,
          currentPage,
          MOVIES_PER_PAGE
        );
        setMovies(data.items || []);
        setPagination(data.pagination || null);
        setGenreInfo({
          titlePage: data.titlePage || `Thể loại: ${slug}`,
          breadCrumb: data.breadCrumb || [],
        });

        if (!data.items || data.items.length === 0) {
          setError(`Không tìm thấy phim nào cho thể loại "${slug}".`);
        }
      } catch (err) {
        console.error(`Error fetching movies for genre ${slug}:`, err);
        setError(err.message || "Lỗi khi tải phim theo thể loại.");
        setMovies([]);
        setPagination(null);
      }
      setLoading(false);
    };

    fetchMoviesByGenre();
  }, [slug, currentPage]);

  const handlePageChange = (newPage) => {
    if (newPage > 0 && (!pagination || newPage <= pagination.totalPages)) {
      setSearchParams({ page: newPage.toString() });
      window.scrollTo({ top: 0, behavior: "smooth" });
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
        <BreadcrumbItem>
          <BreadcrumbLink as={RouterLink} to="/">
            Thể Loại
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>
          <BreadcrumbLink href="#">
            {genreInfo.titlePage || slug}
          </BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>

      <Box mb={6}>
        <Heading as="h1" size="xl" mb={2} color="brand.accent">
          <Icon as={FaFilm} mr={3} verticalAlign="middle" />
          {genreInfo.titlePage || `Thể loại: ${slug}`}
        </Heading>
        {pagination && (
          <Text fontSize="sm" color="gray.400">
            Trang {pagination.currentPage} / {pagination.totalPages} (Tổng số{" "}
            {pagination.totalItems} phim)
          </Text>
        )}
      </Box>

      {loading && (
        <Center h="300px">
          <Spinner
            size="xl"
            color="brand.accent"
            thickness="4px"
            speed="0.65s"
          />
        </Center>
      )}

      {!loading && error && (
        <Alert
          status={movies.length > 0 ? "warning" : "info"}
          variant="subtle"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
          minHeight="200px"
          rounded="md"
          p={6}
        >
          <AlertIcon boxSize="40px" mr={0} />
          <AlertTitle mt={4} mb={1} fontSize="lg">
            {movies.length > 0 ? "Thông báo" : "Không tìm thấy"}
          </AlertTitle>
          <AlertDescription maxWidth="md">{error}</AlertDescription>
          <Button
            mt={6}
            colorScheme="orange"
            onClick={() => window.history.back()}
          >
            Quay lại
          </Button>
        </Alert>
      )}

      {!loading && !error && movies.length > 0 && (
        <SimpleGrid
          columns={{ base: 2, sm: 3, md: 4, lg: 5, xl: 6 }}
          spacing={{ base: 4, md: 6 }}
        >
          {movies.map((movie) => (
            <MovieCard key={movie._id || movie.slug} movie={movie} />
          ))}
        </SimpleGrid>
      )}

      {!loading && pagination && pagination.totalPages > 1 && (
        <HStack justifyContent="center" spacing={4} mt={10}>
          <Button
            onClick={() => handlePageChange(1)}
            isDisabled={currentPage === 1}
            size="sm"
            variant="outline"
            colorScheme="orange"
          >
            Trang đầu
          </Button>
          <Button
            onClick={() => handlePageChange(currentPage - 1)}
            isDisabled={currentPage === 1}
            size="sm"
            variant="outline"
            colorScheme="orange"
          >
            Trước
          </Button>
          <Text color="whiteAlpha.800">
            Trang <Text as="strong">{currentPage}</Text> /{" "}
            {pagination.totalPages}
          </Text>
          <Button
            onClick={() => handlePageChange(currentPage + 1)}
            isDisabled={currentPage === pagination.totalPages}
            size="sm"
            variant="outline"
            colorScheme="orange"
          >
            Sau
          </Button>
          <Button
            onClick={() => handlePageChange(pagination.totalPages)}
            isDisabled={currentPage === pagination.totalPages}
            size="sm"
            variant="outline"
            colorScheme="orange"
          >
            Trang cuối
          </Button>
        </HStack>
      )}
    </Container>
  );
};

export default GenrePage;
