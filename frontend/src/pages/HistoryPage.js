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
  Box,
  IconButton,
} from "@chakra-ui/react";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import { ChevronRightIcon, DeleteIcon } from "@chakra-ui/icons";
import { FaHistory } from "react-icons/fa";
import {
  getContinueWatching,
  deleteWatchSession,
} from "../services/watchSessionService";
import ForumMovieCard from "../components/forum/ForumMovieCard"; // Thay thế MovieCard

const HistoryPage = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = parseInt(searchParams.get("page") || "1", 10);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getContinueWatching(currentPage, 18);
      if (data.success) {
        setSessions(data.data || []);
        setPagination(data.pagination || null);
        if (!data.data || data.data.length === 0) {
          setError(
            "Lịch sử xem của bạn trống. Hãy bắt đầu khám phá phim ngay!"
          );
        }
      } else {
        setError(data.message || "Không thể tải lịch sử xem.");
      }
    } catch (err) {
      setError(err.message || "Lỗi kết nối đến server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [currentPage]);

  const handleDelete = async (sessionId) => {
    // Tìm session cần xóa và tạm thời ẩn nó đi để tăng trải nghiệm người dùng
    const originalSessions = [...sessions];
    setSessions(sessions.filter((s) => s._id !== sessionId));

    const response = await deleteWatchSession(sessionId);
    if (!response.success) {
      // Nếu xóa thất bại, phục hồi lại danh sách
      setSessions(originalSessions);
      // Có thể thêm thông báo lỗi ở đây
      console.error("Failed to delete session:", response.message);
    }
    // Nếu thành công, không cần làm gì vì session đã được ẩn
  };

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
          <BreadcrumbLink href="#">Lịch Sử Xem</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>

      <Heading as="h1" size="xl" mb={6} color="brand.accent">
        <Icon as={FaHistory} mr={3} verticalAlign="middle" />
        Lịch Sử Xem Phim
      </Heading>

      {loading ? (
        <Center h="300px">
          <Spinner size="xl" color="brand.accent" thickness="4px" />
        </Center>
      ) : error && sessions.length === 0 ? (
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
            Lịch sử trống
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
            {sessions.map((session) => {
              const movieMetadata = {
                movieSlug: session.movie.slug,
                movieTitle: session.movie.name,
                moviePosterUrl: session.movie.posterUrl,
                movieYear: session.movie.year,
                movieType: session.movie.type,
                appRatingCount: session.movie.appRatingCount,
                appAverageRating: session.movie.appAverageRating,
                appTotalViews: session.movie.appTotalViews,
                appTotalFavorites: session.movie.appTotalFavorites,
              };

              return (
                <Box
                  key={session._id}
                  position="relative"
                  _hover={{
                    ".delete-button": {
                      opacity: 1,
                      transform: "translateY(0)",
                    },
                  }}
                >
                  <ForumMovieCard movieMetadata={movieMetadata} />
                  <IconButton
                    aria-label="Xóa khỏi lịch sử"
                    icon={<DeleteIcon />}
                    size="sm"
                    colorScheme="red"
                    variant="solid"
                    isRound
                    position="absolute"
                    top="8px"
                    right="8px"
                    boxShadow="lg"
                    opacity={0}
                    transform="translateY(-10px)"
                    transition="opacity 0.2s, transform 0.2s"
                    className="delete-button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDelete(session._id);
                    }}
                  />
                </Box>
              );
            })}
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

export default HistoryPage;
