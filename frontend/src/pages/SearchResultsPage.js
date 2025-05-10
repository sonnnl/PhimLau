import React, { useState, useEffect, useMemo } from "react";
import {
  useSearchParams,
  useNavigate,
  Link as RouterLink,
} from "react-router-dom";
import {
  Container,
  Heading,
  Text,
  Spinner,
  Center,
  SimpleGrid,
  Box,
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
} from "@chakra-ui/react";
import { ChevronRightIcon } from "@chakra-ui/icons";
import { FaSearch } from "react-icons/fa";
import movieService from "../services/movieService";
import MainLayout from "../components/layout/MainLayout";
import MovieCard from "../components/MovieCard";

const SearchResultsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const keyword = useMemo(
    () => searchParams.get("keyword") || "",
    [searchParams]
  );
  const currentPage = useMemo(
    () => parseInt(searchParams.get("page") || "1", 10),
    [searchParams]
  );

  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    if (!keyword) {
      // Nếu không có keyword, có thể redirect về home hoặc hiển thị thông báo
      // navigate('/');
      setSearchResults([]);
      setPagination(null);
      setError("Vui lòng nhập từ khóa để tìm kiếm."); // Hoặc để trống nếu không muốn báo lỗi ngay
      return;
    }

    const fetchSearchResults = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await movieService.searchMovies(keyword, currentPage);
        setSearchResults(data.items || []);
        setPagination(data.pagination || null);
        if (!data.items || data.items.length === 0) {
          setError(`Không tìm thấy kết quả nào cho từ khóa "${keyword}".`);
        }
      } catch (err) {
        console.error(`Error searching for keyword ${keyword}:`, err);
        setError(err.message || "Lỗi khi tìm kiếm phim.");
        setSearchResults([]);
        setPagination(null);
      }
      setLoading(false);
    };

    fetchSearchResults();
  }, [keyword, currentPage, navigate]);

  const handlePageChange = (newPage) => {
    if (newPage > 0 && (!pagination || newPage <= pagination.totalPages)) {
      setSearchParams({ keyword, page: newPage.toString() });
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <MainLayout>
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
            <BreadcrumbLink href="#">Kết quả tìm kiếm</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>

        <Heading as="h1" size="xl" mb={2} color="brand.accent">
          <Icon as={FaSearch} mr={3} verticalAlign="middle" />
          Kết quả tìm kiếm cho:
          <Text as="span" color="whiteAlpha.900" fontWeight="bold">
            {keyword ? `"${keyword}"` : "..."}
          </Text>
        </Heading>
        {pagination && (
          <Text fontSize="sm" color="gray.400" mb={6}>
            Trang {pagination.currentPage} / {pagination.totalPages} (Tổng số{" "}
            {pagination.totalItems} kết quả)
          </Text>
        )}

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
            status={searchResults.length > 0 ? "warning" : "info"} // Nếu có lỗi nhưng vẫn có kết quả cũ thì là warning
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
              {searchResults.length > 0 ? "Thông báo" : "Không tìm thấy"}
            </AlertTitle>
            <AlertDescription maxWidth="md">{error}</AlertDescription>
            <Button mt={6} colorScheme="orange" onClick={() => navigate("/")}>
              Về Trang Chủ
            </Button>
          </Alert>
        )}

        {!loading && !error && searchResults.length > 0 && (
          <SimpleGrid
            columns={{ base: 2, sm: 3, md: 4, lg: 5, xl: 6 }}
            spacing={{ base: 4, md: 6 }}
          >
            {searchResults.map((movie) => (
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
      </Container>
    </MainLayout>
  );
};

export default SearchResultsPage;
