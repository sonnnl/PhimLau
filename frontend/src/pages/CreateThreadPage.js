import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link as RouterLink } from "react-router-dom";
import {
  Box,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  Button,
  VStack,
  Spinner,
  Alert,
  AlertIcon,
  useToast,
  Icon,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Text,
} from "@chakra-ui/react";
import {
  createThread,
  fetchAllForumCategories,
} from "../services/forumService";
import { useAuth } from "../contexts/AuthContext";
import { FiHome, FiChevronRight, FiMessageSquare } from "react-icons/fi";

const CreateThreadPage = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Để lấy category slug từ query params nếu có
  const { token, isAuthenticated } = useAuth();
  const toast = useToast();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Lấy category slug từ URL query params để pre-select
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const preSelectedCategorySlug = queryParams.get("category");
    if (preSelectedCategorySlug && categories.length > 0) {
      const selectedCat = categories.find(
        (cat) => cat.slug === preSelectedCategorySlug
      );
      if (selectedCat) {
        setCategoryId(selectedCat._id);
      }
    }
  }, [location.search, categories]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const fetchedCategories = await fetchAllForumCategories();
        setCategories(fetchedCategories || []);
        // Nếu không có pre-selected từ URL, chọn category đầu tiên (nếu có)
        // if (!categoryId && fetchedCategories && fetchedCategories.length > 0) {
        //   setCategoryId(fetchedCategories[0]._id);
        // }
      } catch (err) {
        toast({
          title: "Lỗi tải danh mục",
          description: err.message || "Không thể tải danh sách danh mục.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        setError("Không thể tải danh sách danh mục.");
      }
      setLoadingCategories(false);
    };
    fetchCategories();
  }, [toast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !categoryId) {
      toast({
        title: "Thông tin không hợp lệ",
        description: "Vui lòng điền đầy đủ tiêu đề, nội dung và chọn danh mục.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const newThread = await createThread(
        { title, content, categoryId },
        token
      );
      toast({
        title: "Tạo chủ đề thành công!",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      navigate(`/forum/thread/${newThread.slug}`); // Điều hướng đến chủ đề vừa tạo
    } catch (err) {
      toast({
        title: "Lỗi khi tạo chủ đề",
        description: err.message || "Đã có lỗi xảy ra, vui lòng thử lại.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      setError(err.message || "Đã có lỗi xảy ra khi tạo chủ đề.");
    }
    setIsSubmitting(false);
  };

  if (!isAuthenticated) {
    // Điều này không nên xảy ra nếu dùng ProtectedRoute, nhưng để chắc chắn
    navigate("/login");
    return null;
  }

  return (
    <Box p={{ base: 3, md: 5 }} maxW="800px" mx="auto">
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
          <BreadcrumbLink href="#">Tạo chủ đề mới</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>

      <Heading as="h1" size="xl" mb={6} textAlign="center">
        Tạo Chủ Đề Mới
      </Heading>
      {error && (
        <Alert status="error" mb={4}>
          <AlertIcon />
          {error}
        </Alert>
      )}
      <Box as="form" onSubmit={handleSubmit}>
        <VStack spacing={5} align="stretch">
          <FormControl isRequired id="title">
            <FormLabel>Tiêu đề</FormLabel>
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tiêu đề cho chủ đề của bạn"
              bg="background.input"
              borderColor="gray.600"
            />
          </FormControl>

          <FormControl isRequired id="category">
            <FormLabel>Danh mục</FormLabel>
            {loadingCategories ? (
              <Spinner />
            ) : categories.length > 0 ? (
              <Select
                placeholder="-- Chọn danh mục --"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                bg="background.input"
                borderColor="gray.600"
              >
                {categories.map((cat) => (
                  <option
                    key={cat._id}
                    value={cat._id}
                    style={{ backgroundColor: "#2D3748" }}
                  >
                    {/* Chakra Select option bg hack */}
                    {cat.name}
                  </option>
                ))}
              </Select>
            ) : (
              <Text color="gray.500">
                Không có danh mục nào để chọn. Vui lòng thử lại hoặc liên hệ
                quản trị viên.
              </Text>
            )}
          </FormControl>

          <FormControl isRequired id="content">
            <FormLabel>Nội dung</FormLabel>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Nhập nội dung chi tiết cho chủ đề của bạn...\n(Bạn có thể sử dụng Markdown cơ bản cho định dạng)"
              minHeight="200px"
              bg="background.input"
              borderColor="gray.600"
            />
            {/* Gợi ý: Có thể thêm component Markdown Editor ở đây sau này */}
          </FormControl>

          <Button
            type="submit"
            colorScheme="orange"
            isLoading={isSubmitting}
            loadingText="Đang tạo..."
            size="lg"
            w="full"
            leftIcon={<Icon as={FiMessageSquare} />}
          >
            Đăng Chủ Đề
          </Button>
        </VStack>
      </Box>
    </Box>
  );
};

export default CreateThreadPage;
