import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Input,
  InputGroup,
  InputLeftElement,
  VStack,
  HStack,
  Text,
  Image,
  Button,
  Spinner,
  Alert,
  AlertIcon,
  Badge,
  IconButton,
  Collapse,
  useDisclosure,
  Card,
  CardBody,
  Flex,
  Spacer,
} from "@chakra-ui/react";
import {
  FiSearch,
  FiX,
  FiChevronDown,
  FiChevronUp,
  FiFilm,
} from "react-icons/fi";
import { searchMoviesForThread } from "../../services/forumService";
import { useDebounce } from "../../hooks/useDebounce";

// 🎨 HELPER: Get optimized image URL with fallback
const getOptimizedImageUrl = (posterUrl) => {
  if (!posterUrl) {
    return "https://via.placeholder.com/300x450/e2e8f0/718096?text=No+Image";
  }

  // Nếu là URL đầy đủ thì return luôn
  if (posterUrl.startsWith("http")) {
    return posterUrl;
  }

  // Nếu là relative path thì thêm domain
  return `https://img.phimapi.com/${posterUrl}`;
};

// 🎨 COMPONENT: Movie Image với error handling
const MovieImage = ({ src, alt, size = "50px", ...props }) => {
  const [imgSrc, setImgSrc] = useState(getOptimizedImageUrl(src));
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(
        "https://via.placeholder.com/300x450/e2e8f0/718096?text=No+Image"
      );
    }
  };

  return (
    <Image
      src={imgSrc}
      alt={alt}
      boxSize={size}
      objectFit="cover"
      borderRadius="md"
      onError={handleError}
      bg="gray.100"
      {...props}
    />
  );
};

/**
 * 🎬 MovieSearch Component
 *
 * 🔄 LUỒNG HOẠT ĐỘNG:
 * 1. User click "Chọn phim" -> mở search box
 * 2. User nhập keyword -> debounce 500ms -> auto search
 * 3. Hiển thị kết quả search từ API phimapi.com
 * 4. User click chọn phim -> gọi onMovieSelect callback
 * 5. Hiển thị phim đã chọn với option xóa
 * 6. Khi tạo thread -> movieMetadata được gửi lên backend
 *
 * @param {Array} selectedMovies - Danh sách phim đã được chọn
 * @param {Function} onMovieSelect - Callback khi user chọn phim
 * @param {Function} onMovieRemove - Callback khi user xóa phim đã chọn
 */
const MovieSearch = ({ selectedMovies = [], onMovieSelect, onMovieRemove }) => {
  // ===== 🎯 STATE MANAGEMENT =====
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 🔄 DEBOUNCE: Giảm số lần gọi API khi user đang gõ
  const debouncedKeyword = useDebounce(searchKeyword, 500);

  // 🎛️ DISCLOSURE: Control search box visibility
  const { isOpen, onToggle } = useDisclosure();

  // ===== 🔍 SEARCH FUNCTION =====
  const handleSearch = useCallback(async (keyword) => {
    // 🛡️ VALIDATION: Keyword phải có ít nhất 2 ký tự
    if (!keyword || keyword.trim().length < 2) {
      setSearchResults([]);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Gọi API tìm kiếm phim từ backend
      const response = await searchMoviesForThread(keyword);
      setSearchResults(response.movies || []);

      // Xử lý trường hợp không tìm thấy kết quả
      if (response.movies?.length === 0) {
        setError("Không tìm thấy phim nào với từ khóa này");
      }
    } catch (err) {
      console.error("❌ Search error:", err);
      setError(err.message || "Có lỗi xảy ra khi tìm kiếm phim");
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // 🎯 EFFECT: Auto search khi debounced keyword thay đổi
  useEffect(() => {
    handleSearch(debouncedKeyword);
  }, [debouncedKeyword, handleSearch]);

  // Xử lý khi user chọn phim
  const handleMovieSelect = (movie) => {
    // Kiểm tra xem phim đã được chọn chưa
    const isAlreadySelected = selectedMovies.some((m) => m._id === movie._id);
    if (isAlreadySelected) {
      return;
    }

    onMovieSelect(movie); // Callback to parent component
    setSearchKeyword(""); // Xóa từ khóa tìm kiếm
    setSearchResults([]); // Xóa kết quả tìm kiếm
  };

  // Xử lý khi user xóa phim đã chọn
  const handleRemoveMovie = (movieId) => {
    onMovieRemove(movieId); // Callback to parent component
  };

  return (
    <Box>
      {/* Header với toggle button */}
      <HStack justify="space-between" mb={3}>
        <HStack>
          <FiFilm />
          <Text fontWeight="medium">Gắn phim vào bài viết (tuỳ chọn)</Text>
        </HStack>
        <Button
          size="sm"
          variant="ghost"
          onClick={onToggle}
          rightIcon={isOpen ? <FiChevronUp /> : <FiChevronDown />}
        >
          {selectedMovies.length > 0
            ? `Đã chọn ${selectedMovies.length} phim`
            : "Chọn phim"}
        </Button>
      </HStack>

      {/* Selected Movies Display */}
      {selectedMovies.length > 0 && (
        <VStack spacing={2} mb={3}>
          {selectedMovies.map((movie) => (
            <Card
              key={movie._id}
              size="sm"
              w="full"
              bg="green.900"
              borderColor="green.600"
            >
              <CardBody p={3}>
                <HStack spacing={3}>
                  <MovieImage
                    src={movie.posterUrl}
                    alt={movie.name}
                    size="50px"
                  />
                  <Box flex={1}>
                    <Text fontWeight="medium" fontSize="sm" noOfLines={1}>
                      {movie.displayName}
                    </Text>
                    <HStack spacing={2}>
                      <Badge size="sm" colorScheme="blue">
                        {movie.typeDisplay}
                      </Badge>
                      {movie.year && (
                        <Text fontSize="xs" color="gray.600">
                          {movie.year}
                        </Text>
                      )}
                    </HStack>
                  </Box>
                  <IconButton
                    icon={<FiX />}
                    size="sm"
                    variant="ghost"
                    colorScheme="red"
                    onClick={() => handleRemoveMovie(movie._id)}
                    aria-label="Xóa phim"
                  />
                </HStack>
              </CardBody>
            </Card>
          ))}
        </VStack>
      )}

      {/* Search Box */}
      <Collapse in={isOpen}>
        <VStack spacing={3} align="stretch">
          {/* Search Input */}
          <HStack>
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <FiSearch color="gray.500" />
              </InputLeftElement>
              <Input
                placeholder="Tìm kiếm phim để gắn vào bài viết..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                size="md"
              />
            </InputGroup>
            {loading && <Spinner size="sm" />}
          </HStack>

          {/* Search Results */}
          {error && (
            <Alert status="warning" size="sm">
              <AlertIcon />
              <Text fontSize="sm">{error}</Text>
            </Alert>
          )}

          {searchResults.length > 0 && (
            <Box
              maxH="300px"
              overflowY="auto"
              border="1px solid"
              borderColor="gray.600"
              borderRadius="md"
              bg="background.card"
            >
              {searchResults.map((movie) => {
                const isSelected = selectedMovies.some(
                  (m) => m._id === movie._id
                );
                return (
                  <Box
                    key={movie._id}
                    p={3}
                    borderBottom="1px solid"
                    borderBottomColor="gray.600"
                    _hover={{ bg: "background.secondary", cursor: "pointer" }}
                    _last={{ borderBottom: "none" }}
                    onClick={() => handleMovieSelect(movie)}
                    bg={isSelected ? "green.900" : "transparent"}
                    opacity={isSelected ? 0.7 : 1}
                  >
                    <HStack spacing={3}>
                      <MovieImage
                        src={movie.posterUrl}
                        alt={movie.name}
                        size="50px"
                      />
                      <Box flex={1}>
                        <HStack spacing={2} align="center">
                          <Text
                            fontWeight="medium"
                            fontSize="sm"
                            noOfLines={2}
                            flex={1}
                          >
                            {movie.displayName}
                          </Text>
                          {isSelected && (
                            <Badge size="sm" colorScheme="green">
                              ✓ Đã chọn
                            </Badge>
                          )}
                        </HStack>
                        <HStack spacing={2} mt={1}>
                          <Badge size="sm" colorScheme="blue">
                            {movie.typeDisplay}
                          </Badge>
                          {movie.year && (
                            <Text fontSize="xs" color="gray.600">
                              {movie.year}
                            </Text>
                          )}
                        </HStack>
                        {movie.originName &&
                          movie.originName !== movie.name && (
                            <Text fontSize="xs" color="gray.500" noOfLines={1}>
                              {movie.originName}
                            </Text>
                          )}
                      </Box>
                    </HStack>
                  </Box>
                );
              })}
            </Box>
          )}

          {/* Helper Text */}
          <Text fontSize="xs" color="gray.500">
            💡 Bạn có thể chọn nhiều phim để gắn vào bài viết. Phim đã chọn sẽ
            được đánh dấu ✓
          </Text>

          {selectedMovies.length > 0 && (
            <Text fontSize="xs" color="green.600" fontWeight="medium">
              🎬 Đã chọn {selectedMovies.length} phim
            </Text>
          )}
        </VStack>
      </Collapse>
    </Box>
  );
};

export default MovieSearch;
