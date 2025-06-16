import React, { useState, useEffect } from "react";
import {
  Container,
  Heading,
  Text,
  Spinner,
  Center,
  SimpleGrid,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Icon,
  Button,
  HStack,
} from "@chakra-ui/react";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import { ChevronRightIcon } from "@chakra-ui/icons";
import { FaHeart } from "react-icons/fa";
import favoriteService from "../services/favoriteService";
import MovieCard from "../components/MovieCard";

const FavoriteMoviesPage = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const currentPage = parseInt(searchParams.get("page") || "1", 10);

  useEffect(() => {
    const fetchFavorites = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await favoriteService.getMyFavorites(currentPage, 18);
        setMovies(data.items || []);
        setPagination(data.pagination || null);
        if (!data.items || data.items.length === 0) {
          setError(
            "Bạn chưa có phim yêu thích nào. Hãy khám phá và thêm phim ngay!"
          );
        }
      } catch (err) {
        setError(err.message || "Không thể tải danh sách phim yêu thích.");
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [currentPage]);

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
        <BreadcrumbItem isCurrentPage>
          <BreadcrumbLink href="#">Phim Yêu Thích</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>

      <Heading as="h1" size="xl" mb={6} color="brand.accent">
        <Icon as={FaHeart} mr={3} verticalAlign="middle" />
        Phim Yêu Thích Của Tôi
      </Heading>

      {loading ? (
        <Center h="300px">
          <Spinner
            size="xl"
            color="brand.accent"
            thickness="4px"
            speed="0.65s"
          />
        </Center>
      ) : error && movies.length === 0 ? (
        <Alert
          status="info"
          variant="subtle"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
          minHeight="200px"
          rounded="md"
        >
          <AlertIcon boxSize="40px" mr={0} />
          <AlertTitle mt={4} mb={1} fontSize="lg">
            Danh sách trống
          </AlertTitle>
          <AlertDescription maxWidth="sm">{error}</AlertDescription>
          <Button as={RouterLink} to="/" mt={6} colorScheme="orange">
            Khám phá ngay
          </Button>
        </Alert>
      ) : (
        <>
          <SimpleGrid
            columns={{ base: 2, sm: 3, md: 4, lg: 5, xl: 6 }}
            spacing={{ base: 4, md: 6 }}
          >
            {movies.map((movie) => (
              <MovieCard key={movie._id} movie={movie} />
            ))}
          </SimpleGrid>

          {pagination && pagination.totalPages > 1 && (
            <HStack justifyContent="center" spacing={4} mt={10}>
              <Button
                onClick={() => handlePageChange(1)}
                isDisabled={currentPage === 1}
                size="sm"
              >
                Trang đầu
              </Button>
              <Button
                onClick={() => handlePageChange(currentPage - 1)}
                isDisabled={currentPage === 1}
                size="sm"
              >
                Trước
              </Button>
              <Text>
                Trang <Text as="strong">{currentPage}</Text> /{" "}
                {pagination.totalPages}
              </Text>
              <Button
                onClick={() => handlePageChange(currentPage + 1)}
                isDisabled={currentPage === pagination.totalPages}
                size="sm"
              >
                Sau
              </Button>
              <Button
                onClick={() => handlePageChange(pagination.totalPages)}
                isDisabled={currentPage === pagination.totalPages}
                size="sm"
              >
                Trang cuối
              </Button>
            </HStack>
          )}
        </>
      )}
    </Container>
  );
};

export default FavoriteMoviesPage;
