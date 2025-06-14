import React, { useState, useCallback, useRef } from "react";
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Textarea,
  Spinner,
  Center,
  Flex,
  Avatar,
  IconButton,
  Icon,
  useToast,
  Alert,
  AlertIcon,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
} from "@chakra-ui/react";
import { DeleteIcon } from "@chakra-ui/icons";
import { FaStar } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import ReactStars from "react-stars";
import reviewService from "../../services/reviewService";

const ReviewSection = ({
  movieMetadata,
  user,
  token,
  isAuthenticated,
  slug,
  onReviewUpdate,
}) => {
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef();

  // States
  const [reviews, setReviews] = useState([]);
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewPages, setReviewPages] = useState(1);
  const [reviewCount, setReviewCount] = useState(0);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [errorReviews, setErrorReviews] = useState(null);

  const [userRating, setUserRating] = useState(0);
  const [userReviewContent, setUserReviewContent] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [submitReviewError, setSubmitReviewError] = useState(null);
  const [existingUserReview, setExistingUserReview] = useState(null);

  // Delete review state
  const [reviewToDelete, setReviewToDelete] = useState(null);

  // Fetch reviews with improved error handling
  const fetchReviews = useCallback(
    async (currentPage = 1) => {
      if (!movieMetadata?._id) return;

      setLoadingReviews(true);
      setErrorReviews(null);

      try {
        const data = await reviewService.getReviewsForMovie(
          movieMetadata._id,
          currentPage
        );

        if (data && data.reviews) {
          setReviews(data.reviews);
          setReviewPage(data.page || currentPage);
          setReviewPages(data.pages || 1);
          setReviewCount(data.count || 0);

          // Check for existing user review
          if (user && data.reviews.length > 0) {
            const currentUserReview = data.reviews.find(
              (review) => review.user?._id === user._id
            );

            if (currentUserReview) {
              setExistingUserReview(currentUserReview);
              setUserRating(currentUserReview.rating || 0);
              setUserReviewContent(currentUserReview.content || "");
            } else if (currentPage === 1) {
              // Reset form if no existing review found on first page
              setExistingUserReview(null);
              setUserRating(0);
              setUserReviewContent("");
            }
          }
        }
      } catch (err) {
        console.error("Error fetching reviews:", err);
        setErrorReviews(
          err.message || "Không thể tải bình luận. Vui lòng thử lại."
        );
        setReviews([]);
      } finally {
        setLoadingReviews(false);
      }
    },
    [movieMetadata?._id, user]
  );

  // Submit review with validation
  const handleSubmitReview = async () => {
    // Validation
    if (!isAuthenticated || !token || !movieMetadata?._id) {
      toast({
        title: "Yêu cầu đăng nhập",
        description: "Bạn cần đăng nhập để gửi đánh giá.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (userRating === 0) {
      toast({
        title: "Thiếu đánh giá",
        description: "Vui lòng chọn số sao đánh giá.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const trimmedContent = userReviewContent.trim();
    if (!trimmedContent) {
      toast({
        title: "Thiếu nội dung",
        description: "Vui lòng nhập nội dung đánh giá.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (trimmedContent.length < 10) {
      toast({
        title: "Nội dung quá ngắn",
        description: "Đánh giá phải có ít nhất 10 ký tự.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSubmittingReview(true);
    setSubmitReviewError(null);

    try {
      await reviewService.createOrUpdateReview(
        movieMetadata._id,
        { rating: userRating, content: trimmedContent },
        token
      );

      toast({
        title: existingUserReview
          ? "Đánh giá đã được cập nhật!"
          : "Đánh giá đã được gửi!",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      // Refresh reviews and movie data
      await fetchReviews(1);
      if (onReviewUpdate) {
        onReviewUpdate();
      }
    } catch (err) {
      console.error("Error submitting review:", err);
      const errMsg =
        typeof err === "string"
          ? err
          : err.message || "Lỗi không xác định khi gửi đánh giá.";

      setSubmitReviewError(errMsg);
      toast({
        title: "Lỗi khi gửi đánh giá",
        description: errMsg,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Open delete confirmation dialog
  const openDeleteDialog = (reviewId) => {
    if (!isAuthenticated || !token) return;
    setReviewToDelete(reviewId);
    onOpen();
  };

  // Delete review
  const handleDeleteReview = async () => {
    if (!reviewToDelete) return;

    try {
      await reviewService.deleteReview(reviewToDelete, token);

      toast({
        title: "✅ Đã xóa đánh giá thành công",
        description: "Đánh giá của bạn đã được xóa khỏi hệ thống.",
        status: "success",
        duration: 4000,
        isClosable: true,
        position: "top",
      });

      // Reset form if deleted review was user's own
      if (existingUserReview && existingUserReview._id === reviewToDelete) {
        setExistingUserReview(null);
        setUserRating(0);
        setUserReviewContent("");
      }

      // Refresh data
      await fetchReviews(reviewPage);
      if (onReviewUpdate) {
        onReviewUpdate();
      }
    } catch (err) {
      console.error("Error deleting review:", err);
      const errMsg =
        typeof err === "string"
          ? err
          : err.message || "Lỗi không xác định khi xóa đánh giá.";

      toast({
        title: "❌ Lỗi khi xóa đánh giá",
        description: errMsg,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
    } finally {
      // Close dialog and reset state
      onClose();
      setReviewToDelete(null);
    }
  };

  // Pagination
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= reviewPages && newPage !== reviewPage) {
      fetchReviews(newPage);
    }
  };

  // Initialize reviews when movieMetadata changes
  React.useEffect(() => {
    if (movieMetadata?._id) {
      fetchReviews(1);
    }
  }, [movieMetadata?._id, fetchReviews]);

  return (
    <Box id="review-section" mb={10}>
      <Heading as="h3" size="lg" mb={6} color="whiteAlpha.900">
        Đánh giá & Bình luận
      </Heading>

      {/* Rating Display */}
      <Flex mb={6} align="center" wrap="wrap" gap={4}>
        <Heading size="md" color="whiteAlpha.800">
          Xếp hạng:
        </Heading>
        {movieMetadata?.appRatingCount > 0 ? (
          <Flex align="center" gap={2}>
            <HStack spacing={1}>
              {[...Array(5)].map((_, i) => (
                <Icon
                  key={i}
                  as={FaStar}
                  color={
                    i < Math.round(movieMetadata.appAverageRating)
                      ? "yellow.400"
                      : "gray.600"
                  }
                  boxSize={5}
                />
              ))}
            </HStack>
            <Text fontWeight="bold" fontSize="lg" color="whiteAlpha.900">
              {movieMetadata.appAverageRating.toFixed(1)} / 5
            </Text>
            <Text fontSize="sm" color="gray.400">
              ({movieMetadata.appRatingCount} lượt đánh giá)
            </Text>
          </Flex>
        ) : (
          <Text color="gray.500" fontStyle="italic">
            Chưa có đánh giá nào.
          </Text>
        )}
      </Flex>

      {/* Review Form */}
      {isAuthenticated ? (
        <Box p={4} bg="background.secondary" rounded="md" mb={8} shadow="md">
          <Heading size="md" mb={4} color="brand.accent">
            {existingUserReview
              ? "Chỉnh sửa đánh giá của bạn"
              : "Viết đánh giá của bạn"}
          </Heading>

          <VStack spacing={4} align="stretch">
            <Box>
              <Text
                mb={2}
                fontSize="sm"
                fontWeight="medium"
                color="whiteAlpha.900"
              >
                Đánh giá của bạn (sao): *
              </Text>
              <ReactStars
                count={5}
                onChange={setUserRating}
                size={32}
                color1={"#666"}
                color2={"#ffd700"}
                value={userRating}
                half={false}
              />
            </Box>

            <Box>
              <Text
                mb={2}
                fontSize="sm"
                fontWeight="medium"
                color="whiteAlpha.900"
              >
                Nội dung bình luận: *
              </Text>
              <Textarea
                value={userReviewContent}
                onChange={(e) => setUserReviewContent(e.target.value)}
                placeholder="Chia sẻ cảm nghĩ của bạn về bộ phim... (tối thiểu 10 ký tự)"
                size="sm"
                rows={4}
                borderColor="brand.600"
                focusBorderColor="brand.accent"
                bg="background.primary"
                color="whiteAlpha.900"
                maxLength={1000}
              />
              <Text fontSize="xs" color="gray.500" mt={1}>
                {userReviewContent.length}/1000 ký tự
              </Text>
            </Box>

            {submitReviewError && (
              <Alert status="error" size="sm" rounded="md">
                <AlertIcon />
                <Text fontSize="sm">{submitReviewError}</Text>
              </Alert>
            )}

            <Button
              colorScheme="orange"
              onClick={handleSubmitReview}
              isLoading={isSubmittingReview}
              loadingText={
                existingUserReview ? "Đang cập nhật..." : "Đang gửi..."
              }
              alignSelf="flex-end"
              disabled={userRating === 0 || !userReviewContent.trim()}
            >
              {existingUserReview ? "Cập Nhật Đánh Giá" : "Gửi Đánh Giá"}
            </Button>
          </VStack>
        </Box>
      ) : (
        <Center p={4} bg="background.secondary" rounded="md" mb={8} shadow="md">
          <Text color="gray.400">
            Vui lòng{" "}
            <Button
              variant="link"
              colorScheme="orange"
              onClick={() => navigate("/login")}
              size="sm"
            >
              đăng nhập
            </Button>{" "}
            để viết đánh giá.
          </Text>
        </Center>
      )}

      {/* Reviews List */}
      <VStack spacing={6} align="stretch">
        <Heading size="md" color="whiteAlpha.800">
          Bình luận ({reviewCount})
        </Heading>

        {loadingReviews ? (
          <Center h="100px">
            <Spinner color="brand.accent" size="lg" />
          </Center>
        ) : errorReviews ? (
          <Alert status="error" rounded="md">
            <AlertIcon />
            <Box>
              <Text fontWeight="bold">Lỗi tải bình luận</Text>
              <Text fontSize="sm">{errorReviews}</Text>
            </Box>
          </Alert>
        ) : reviews.length > 0 ? (
          reviews.map((review) => (
            <Box
              key={review._id}
              p={4}
              bg="background.card"
              rounded="md"
              shadow="sm"
              borderLeft="4px solid"
              borderLeftColor="brand.accent"
            >
              <Flex justify="space-between" align="flex-start" mb={3}>
                <HStack spacing={3}>
                  <Avatar
                    size="sm"
                    name={
                      review.user?.displayName ||
                      review.user?.username ||
                      "User"
                    }
                    src={review.user?.avatarUrl}
                  />
                  <VStack align="flex-start" spacing={0}>
                    <Text
                      fontWeight="bold"
                      fontSize="sm"
                      color="whiteAlpha.900"
                    >
                      {review.user?.displayName ||
                        review.user?.username ||
                        "Người dùng ẩn danh"}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      {new Date(review.createdAt).toLocaleString("vi-VN", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </Text>
                  </VStack>
                </HStack>

                {isAuthenticated && user?._id === review.user?._id && (
                  <IconButton
                    aria-label="Xóa đánh giá"
                    icon={<DeleteIcon />}
                    size="sm"
                    variant="ghost"
                    colorScheme="red"
                    onClick={() => openDeleteDialog(review._id)}
                  />
                )}
              </Flex>

              {review.rating && (
                <HStack spacing={1} mb={2}>
                  {[...Array(5)].map((_, i) => (
                    <Icon
                      key={i}
                      as={FaStar}
                      color={i < review.rating ? "yellow.400" : "gray.600"}
                      boxSize={3}
                    />
                  ))}
                  <Text fontSize="sm" color="gray.400" ml={2}>
                    ({review.rating}/5 sao)
                  </Text>
                </HStack>
              )}

              <Text
                fontSize="sm"
                color="gray.300"
                whiteSpace="pre-wrap"
                lineHeight="1.6"
              >
                {review.content}
              </Text>
            </Box>
          ))
        ) : (
          <Center p={8} bg="background.secondary" rounded="md">
            <Text color="gray.500" fontStyle="italic">
              Hiện chưa có bình luận nào cho phim này.
              {isAuthenticated ? " Hãy là người đầu tiên để lại đánh giá!" : ""}
            </Text>
          </Center>
        )}

        {/* Pagination */}
        {reviewPages > 1 && (
          <HStack justify="center" spacing={4} mt={6}>
            <Button
              onClick={() => handlePageChange(reviewPage - 1)}
              isDisabled={reviewPage <= 1}
              size="sm"
              variant="outline"
              colorScheme="orange"
            >
              ← Trước
            </Button>
            <Text color="whiteAlpha.800" fontSize="sm">
              Trang {reviewPage} / {reviewPages}
            </Text>
            <Button
              onClick={() => handlePageChange(reviewPage + 1)}
              isDisabled={reviewPage >= reviewPages}
              size="sm"
              variant="outline"
              colorScheme="orange"
            >
              Sau →
            </Button>
          </HStack>
        )}
      </VStack>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
        motionPreset="slideInBottom"
        isCentered
      >
        <AlertDialogOverlay bg="blackAlpha.800">
          <AlertDialogContent
            bg="background.secondary"
            borderColor="brand.600"
            borderWidth="1px"
            maxW="400px"
            mx={4}
          >
            <AlertDialogHeader
              fontSize="lg"
              fontWeight="bold"
              color="whiteAlpha.900"
              borderBottomColor="brand.600"
            >
              🗑️ Xóa đánh giá
            </AlertDialogHeader>

            <AlertDialogBody color="whiteAlpha.800" py={6}>
              <Text mb={2}>Bạn có chắc chắn muốn xóa đánh giá này không?</Text>
              <Text fontSize="sm" color="gray.400">
                Hành động này không thể hoàn tác.
              </Text>
            </AlertDialogBody>

            <AlertDialogFooter borderTopColor="brand.600">
              <Button
                ref={cancelRef}
                onClick={onClose}
                variant="ghost"
                colorScheme="gray"
                mr={3}
              >
                ❌ Hủy
              </Button>
              <Button
                colorScheme="red"
                onClick={handleDeleteReview}
                bg="red.500"
                _hover={{ bg: "red.600" }}
                _active={{ bg: "red.700" }}
              >
                🗑️ Xóa ngay
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default ReviewSection;
