import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Box,
  Heading,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  Button,
  Alert,
  AlertIcon,
  useToast,
  Card,
  CardHeader,
  CardBody,
  Divider,
  Text,
  HStack,
  Icon,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
} from "@chakra-ui/react";
import {
  FiSend,
  FiHome,
  FiChevronRight,
  FiList,
  FiClock,
} from "react-icons/fi";
import { Link as RouterLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useForumCategories } from "../hooks/useForumData";
import { createThread } from "../services/forumService";
import MovieSearch from "../components/forum/MovieSearch";

const CreateThreadPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { isAuthenticated, token } = useAuth();
  const [searchParams] = useSearchParams();

  // Pre-select category from URL
  const categorySlugFromUrl = searchParams.get("category");

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    categoryId: "",
  });
  const [selectedMovies, setSelectedMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get categories
  const {
    categories,
    loading: categoriesLoading,
    error: categoriesError,
  } = useForumCategories();

  // Auto-select category if provided in URL
  useEffect(() => {
    if (categorySlugFromUrl && categories.length > 0) {
      const category = categories.find(
        (cat) => cat.slug === categorySlugFromUrl
      );
      if (category) {
        setFormData((prev) => ({ ...prev, categoryId: category._id }));
      }
    }
  }, [categorySlugFromUrl, categories]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      toast({
        title: "Vui lòng đăng nhập",
        description: "Bạn cần đăng nhập để tạo bài viết mới",
        status: "warning",
        duration: 3000,
      });
      navigate("/login");
    }
  }, [isAuthenticated, navigate, toast]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleMovieSelect = (movie) => {
    setSelectedMovies((prev) => [...prev, movie]);
    console.log("✅ Selected movie:", movie);
  };

  const handleMovieRemove = (movieId) => {
    setSelectedMovies((prev) => prev.filter((m) => m._id !== movieId));
    console.log("❌ Removed selected movie:", movieId);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập tiêu đề bài viết",
        status: "error",
        duration: 3000,
      });
      return;
    }

    if (!formData.content.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập nội dung bài viết",
        status: "error",
        duration: 3000,
      });
      return;
    }

    if (!formData.categoryId) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn danh mục",
        status: "error",
        duration: 3000,
      });
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Prepare thread data
      const threadData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        categoryId: formData.categoryId,
      };

      // Add movie metadata if selected (now supports multiple movies)
      if (selectedMovies.length > 0) {
        threadData.movieMetadata = selectedMovies.map((movie, index) => ({
          movieId: movie._id,
          movieSlug: movie.slug,
          movieTitle: movie.name,
          moviePosterUrl: movie.posterUrl,
          movieType: movie.type,
          movieYear: movie.year,
          category: movie.category,
          isPrimary: index === 0, // First movie is primary
        }));
        threadData.isMovieDiscussion = true; // Mark as movie discussion
      }

      // Gửi request tạo thread
      const response = await createThread(threadData, token);

      // 🔄 HANDLE DIFFERENT MODERATION OUTCOMES
      if (response.moderationStatus === "rejected") {
        // ❌ THREAD REJECTED - Show error and stay on page
        toast({
          title: "Bài viết bị từ chối",
          description:
            response.message || "Nội dung không phù hợp với quy định cộng đồng",
          status: "error",
          duration: 8000,
          isClosable: true,
        });
        return; // Don't redirect, let user edit
      } else if (response.moderationStatus === "pending") {
        // ⏳ THREAD PENDING - Redirect to My Threads with info
        const isNewUser =
          response.autoAnalysis?.moderationNote?.includes("User mới");
        const riskInfo = response.autoAnalysis
          ? ` (Risk: ${response.autoAnalysis.riskLevel}, Score: ${response.autoAnalysis.riskScore}/100)`
          : "";

        toast({
          title: "Bài viết đã được gửi!",
          description: isNewUser
            ? "Bài viết của user mới cần được kiểm duyệt trước khi hiển thị công khai."
            : `Bài viết đang chờ kiểm duyệt${riskInfo}. Bạn có thể xem trong mục 'Bài viết của tôi'.`,
          status: "warning",
          duration: isNewUser ? 8000 : 6000,
          isClosable: true,
        });

        // Redirect to My Threads with pending filter
        navigate("/my-threads?status=pending", { replace: true });
      } else if (response.moderationStatus === "approved") {
        // ✅ THREAD APPROVED - Redirect to thread or forum
        const approvalMessage = response.isAutoApproved
          ? "Bài viết đã được tự động phê duyệt và hiển thị công khai!"
          : "Bài viết đã được phê duyệt và hiển thị công khai!";

        toast({
          title: "Thành công!",
          description: approvalMessage,
          status: "success",
          duration: 4000,
          isClosable: true,
        });

        // Navigate to thread detail if slug available
        if (response.slug) {
          navigate(`/forum/thread/${response.slug}`, { replace: true });
        } else {
          navigate("/forum", { replace: true });
        }
      } else {
        // Trạng thái không xác định - fallback handling
        toast({
          title: "Bài viết đã được gửi",
          description:
            response.message ||
            "Trạng thái không xác định, vui lòng kiểm tra trong 'Bài viết của tôi'",
          status: "info",
          duration: 5000,
          isClosable: true,
        });
        navigate("/my-threads", { replace: true });
      }
    } catch (err) {
      console.error("❌ Create thread error:", err);

      const errorMessage = err.message || "Có lỗi xảy ra khi tạo bài viết";
      setError(errorMessage);

      toast({
        title: "Lỗi",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  return (
    <Box p={5} maxW="800px" mx="auto">
      {/* Breadcrumbs */}
      <Breadcrumb
        spacing="8px"
        separator={<Icon as={FiChevronRight} color="gray.500" />}
        mb={6}
      >
        <BreadcrumbItem>
          <BreadcrumbLink as={RouterLink} to="/">
            <Icon as={FiHome} mr={1} verticalAlign="text-bottom" />
            Trang chủ
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbLink as={RouterLink} to="/forum">
            Diễn đàn
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>
          <BreadcrumbLink href="#">Tạo bài viết mới</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>

      <Card>
        <CardHeader>
          <Heading size="lg">Tạo bài viết mới</Heading>
          <Text color="gray.600" mt={2}>
            Chia sẻ suy nghĩ, thảo luận về phim, hoặc đặt câu hỏi với cộng đồng
          </Text>
        </CardHeader>

        <CardBody>
          {error && (
            <Alert status="error" mb={4}>
              <AlertIcon />
              {error}
            </Alert>
          )}

          {categoriesError && (
            <Alert status="error" mb={4}>
              <AlertIcon />
              Không thể tải danh mục: {categoriesError}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <VStack spacing={6} align="stretch">
              {/* Category Selection */}
              <FormControl isRequired>
                <FormLabel htmlFor="category">Danh mục</FormLabel>
                <Select
                  id="category"
                  name="categoryId"
                  placeholder="Chọn danh mục"
                  value={formData.categoryId}
                  onChange={handleInputChange}
                  isDisabled={!!categorySlugFromUrl}
                  icon={<FiList />}
                >
                  {!categoriesLoading &&
                    categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                </Select>
              </FormControl>

              {/* Movie Search Component */}
              <MovieSearch
                selectedMovies={selectedMovies}
                onMovieSelect={handleMovieSelect}
                onMovieRemove={handleMovieRemove}
              />

              <Divider />

              {/* Title */}
              <FormControl isRequired>
                <FormLabel>Tiêu đề</FormLabel>
                <Input
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Nhập tiêu đề bài viết..."
                  maxLength={200}
                />
                <Text fontSize="xs" color="gray.500" mt={1}>
                  {formData.title.length}/200 ký tự
                </Text>
              </FormControl>

              {/* Content */}
              <FormControl isRequired>
                <FormLabel>Nội dung</FormLabel>
                <Textarea
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  placeholder="Nhập nội dung bài viết..."
                  minHeight="200px"
                  maxLength={10000}
                />
                <Text fontSize="xs" color="gray.500" mt={1}>
                  {formData.content.length}/10000 ký tự
                </Text>
              </FormControl>

              {/* Submit Buttons */}
              <HStack spacing={3}>
                <Button
                  type="submit"
                  colorScheme="orange"
                  leftIcon={<Icon as={FiSend} />}
                  isLoading={loading}
                  loadingText="Đang đăng..."
                  isDisabled={loading}
                  flex={1}
                  _loading={{
                    opacity: 0.8,
                    cursor: "not-allowed",
                  }}
                >
                  Đăng bài viết
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => navigate(-1)}
                  isDisabled={loading}
                  _disabled={{
                    opacity: 0.5,
                    cursor: "not-allowed",
                  }}
                >
                  Hủy
                </Button>
              </HStack>

              {/* Helper Text */}
              <Text fontSize="sm" color="gray.500">
                💡 <strong>Lưu ý:</strong>
                {selectedMovies.length > 0 && (
                  <Text as="span" color="green.600" fontWeight="medium">
                    {" "}
                    Bài viết sẽ được gắn {selectedMovies.length} phim
                    {selectedMovies.length === 1 &&
                      `: "${selectedMovies[0].name}"`}
                    {selectedMovies.length > 1 &&
                      ` (chính: "${selectedMovies[0].name}")`}
                    .
                  </Text>
                )}
              </Text>

              {/* ===== 📋 MODERATION INFO BOX ===== */}
              <Box
                p={4}
                bg="blue.900"
                borderColor="blue.600"
                borderWidth="1px"
                borderRadius="md"
              >
                <Text fontSize="sm" fontWeight="medium" color="blue.200" mb={2}>
                  📋 Quy trình kiểm duyệt:
                </Text>
                <VStack
                  align="start"
                  spacing={1}
                  fontSize="xs"
                  color="blue.300"
                >
                  <Text>
                    • <strong>Admin/Moderator:</strong> Tự động phê duyệt
                  </Text>
                  <Text>
                    • <strong>User tin cậy + nội dung an toàn:</strong> Tự động
                    phê duyệt
                  </Text>
                  <Text>
                    • <strong>User mới ({"<"}5 bài):</strong> Luôn cần kiểm
                    duyệt
                  </Text>
                  <Text>
                    • <strong>Nội dung có rủi ro:</strong> Cần kiểm duyệt thủ
                    công
                  </Text>
                  <Text>
                    • <strong>Nội dung vi phạm:</strong> Tự động từ chối
                  </Text>
                </VStack>
              </Box>

              {/* Quick Links */}
              <HStack
                justify="center"
                spacing={4}
                pt={3}
                borderTop="1px"
                borderColor="gray.200"
              >
                <Button
                  as={RouterLink}
                  to="/my-threads"
                  variant="ghost"
                  size="sm"
                  colorScheme="blue"
                  leftIcon={<Icon as={FiList} />}
                >
                  📋 Bài viết của tôi
                </Button>
                <Button
                  as={RouterLink}
                  to="/my-threads?status=pending"
                  variant="ghost"
                  size="sm"
                  colorScheme="yellow"
                  leftIcon={<Icon as={FiClock} />}
                >
                  ⏳ Bài chờ duyệt
                </Button>
              </HStack>
            </VStack>
          </form>
        </CardBody>
      </Card>
    </Box>
  );
};

export default CreateThreadPage;
