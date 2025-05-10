import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Heading,
  Text,
  Spinner,
  Center,
  Image,
  VStack,
  HStack,
  Tag,
  AspectRatio,
  SimpleGrid,
  Button,
  Divider,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Icon,
  Select,
  Textarea,
  useToast,
  Flex,
  Avatar,
  IconButton,
} from "@chakra-ui/react";
import { StarIcon, DeleteIcon } from "@chakra-ui/icons";
import {
  FaPlayCircle,
  FaTags,
  FaInfoCircle,
  FaCalendarAlt,
  FaClock,
  FaGlobe,
  FaFilm,
  FaUserFriends,
  FaVideo,
  FaServer,
  FaYoutube,
  FaStar,
} from "react-icons/fa";
import movieService from "../services/movieService";
import reviewService from "../services/reviewService";
import { useAuth } from "../contexts/AuthContext";
import ReactStars from "react-stars";

const MovieDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, token, isAuthenticated } = useAuth();
  const toast = useToast();

  const [movieDetails, setMovieDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedServerIndex, setSelectedServerIndex] = useState(0);
  const [currentEpisode, setCurrentEpisode] = useState(null);
  const playerRef = useRef(null);

  const [showTrailer, setShowTrailer] = useState(false);
  const [youtubeVideoId, setYoutubeVideoId] = useState(null);

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

  const fetchReviews = useCallback(
    async (currentPage) => {
      if (!movieDetails?.movieMetadata?._id) return;
      setLoadingReviews(true);
      setErrorReviews(null);
      try {
        const data = await reviewService.getReviewsForMovie(
          movieDetails.movieMetadata._id,
          currentPage
        );
        setReviews(data.reviews);
        setReviewPage(data.page);
        setReviewPages(data.pages);
        setReviewCount(data.count);

        if (user && data.reviews) {
          const currentUserReview = data.reviews.find(
            (review) => review.user?._id === user._id
          );
          if (currentUserReview) {
            setExistingUserReview(currentUserReview);
            setUserRating(currentUserReview.rating || 0);
            setUserReviewContent(currentUserReview.content || "");
          } else {
            if (currentPage === 1 && existingUserReview) {
              setExistingUserReview(null);
              setUserRating(0);
              setUserReviewContent("");
            }
          }
        } else {
          setExistingUserReview(null);
          setUserRating(0);
          setUserReviewContent("");
        }
      } catch (err) {
        console.error("Error fetching reviews:", err);
        setErrorReviews(err.message || "Không thể tải bình luận.");
        setReviews([]);
      } finally {
        setLoadingReviews(false);
      }
    },
    [movieDetails, user, existingUserReview]
  );

  useEffect(() => {
    const fetchDetails = async () => {
      if (!slug) return;
      setLoading(true);
      setError(null);

      try {
        const data = await movieService.getMovieDetails(slug);
        setMovieDetails(data);

        let lastState = null;
        try {
          const storedState = localStorage.getItem(
            `myMovieApp_watch_state_${slug}`
          );
          if (storedState) {
            lastState = JSON.parse(storedState);
          }
        } catch (e) {
          console.error("Error reading watch state from localStorage:", e);
          localStorage.removeItem(`myMovieApp_watch_state_${slug}`);
        }

        if (data && data.episodes && data.episodes.length > 0) {
          let serverToSelect = 0;
          let episodeToSelect = null;

          if (
            lastState &&
            lastState.serverIndex !== undefined &&
            data.episodes[lastState.serverIndex]
          ) {
            serverToSelect = lastState.serverIndex;
          }

          const selectedServerData = data.episodes[serverToSelect]?.server_data;

          if (selectedServerData && selectedServerData.length > 0) {
            episodeToSelect = selectedServerData[0];

            if (lastState && lastState.episodeSlug) {
              const foundEpisode = selectedServerData.find(
                (ep) => ep.slug === lastState.episodeSlug
              );
              if (foundEpisode) {
                episodeToSelect = foundEpisode;
              }
            }
          }
          setSelectedServerIndex(serverToSelect);
          setCurrentEpisode(episodeToSelect);
        } else {
          setSelectedServerIndex(0);
          setCurrentEpisode(null);
        }

        if (data && data.movie && data.movie.trailer_url) {
          const videoId = extractYouTubeVideoId(data.movie.trailer_url);
          if (videoId) {
            setYoutubeVideoId(videoId);
            setShowTrailer(true);
          } else {
            setShowTrailer(false);
            setYoutubeVideoId(null);
          }
        } else {
          setShowTrailer(false);
          setYoutubeVideoId(null);
        }
      } catch (err) {
        console.error(`Error fetching details for ${slug}:`, err);
        setError(err.message || "Không thể tải thông tin phim.");
      }
      setLoading(false);
    };
    fetchDetails();
  }, [slug]);

  useEffect(() => {
    if (!loading && slug && movieDetails && currentEpisode) {
      try {
        const stateToSave = {
          slug,
          serverIndex: selectedServerIndex,
          episodeSlug: currentEpisode.slug,
          episodeName: currentEpisode.name,
          timestamp: Date.now(),
        };
        localStorage.setItem(
          `myMovieApp_watch_state_${slug}`,
          JSON.stringify(stateToSave)
        );
      } catch (e) {
        console.error("Error saving watch state to localStorage:", e);
      }
    }
  }, [slug, selectedServerIndex, currentEpisode, loading, movieDetails]);

  useEffect(() => {
    if (movieDetails?.movieMetadata._id) {
      fetchReviews(reviewPage);
    }
  }, [movieDetails?.movieMetadata._id, reviewPage, fetchReviews]);

  const handleServerChange = (event) => {
    const newServerIndex = parseInt(event.target.value, 10);

    const newServerData = movieDetails?.episodes[newServerIndex]?.server_data;
    let newEpisode = null;
    if (newServerData && newServerData.length > 0) {
      newEpisode = newServerData[0];
    }
    setSelectedServerIndex(newServerIndex);
    setCurrentEpisode(newEpisode);
  };

  const handleEpisodeSelect = (episode) => {
    setCurrentEpisode(episode);
    setTimeout(() => {
      playerRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 100);
  };

  const extractYouTubeVideoId = (url) => {
    if (!url) return null;
    const regex =
      /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const handleRatingChange = (newRating) => {
    setUserRating(newRating);
  };

  const handleContentChange = (event) => {
    setUserReviewContent(event.target.value);
  };

  const handleSubmitReview = async () => {
    if (!isAuthenticated || !token || !movieDetails?.movieMetadata._id) {
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
        description: "Vui lòng chọn số sao.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    if (!userReviewContent.trim()) {
      toast({
        title: "Thiếu nội dung",
        description: "Vui lòng nhập nội dung đánh giá.",
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
        movieDetails.movieMetadata._id,
        { rating: userRating, content: userReviewContent },
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
      if (reviewPage !== 1) {
        setReviewPage(1);
      } else {
        fetchReviews(1);
      }
      movieService
        .getMovieDetails(slug)
        .then(setMovieDetails)
        .catch(console.error);
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

  const handleDeleteReview = async (reviewId) => {
    if (!isAuthenticated || !token) return;

    if (!window.confirm("Bạn có chắc muốn xóa đánh giá này?")) {
      return;
    }

    try {
      await reviewService.deleteReview(reviewId, token);
      toast({
        title: "Đã xóa đánh giá",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      fetchReviews(reviewPage);
      if (existingUserReview && existingUserReview._id === reviewId) {
        setExistingUserReview(null);
        setUserRating(0);
        setUserReviewContent("");
      }
      movieService
        .getMovieDetails(slug)
        .then(setMovieDetails)
        .catch(console.error);
    } catch (err) {
      console.error("Error deleting review:", err);
      const errMsg =
        typeof err === "string"
          ? err
          : err.message || "Lỗi không xác định khi xóa đánh giá.";
      toast({
        title: "Lỗi khi xóa đánh giá",
        description: errMsg,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= reviewPages && newPage !== reviewPage) {
      setReviewPage(newPage);
    }
  };

  if (loading) {
    return (
      <Center h="calc(100vh - 128px)">
        <Spinner size="xl" color="brand.accent" thickness="4px" speed="0.65s" />
      </Center>
    );
  }

  if (error) {
    return (
      <Container maxW="container.lg" py={8}>
        <Alert
          status="error"
          variant="subtle"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
          minHeight="250px"
          rounded="md"
          p={6}
        >
          <AlertIcon boxSize="40px" mr={0} />
          <AlertTitle mt={4} mb={1} fontSize="lg">
            Rất tiếc, đã có lỗi xảy ra!
          </AlertTitle>
          <AlertDescription maxWidth="sm">
            {error}. <br /> Có thể phim này không tồn tại hoặc đã bị xóa.
          </AlertDescription>
          <Button mt={6} colorScheme="orange" onClick={() => navigate("/")}>
            Về Trang Chủ
          </Button>
        </Alert>
      </Container>
    );
  }

  if (!movieDetails || !movieDetails.movie) {
    return (
      <Center h="calc(100vh - 128px)">
        <Text>Không tìm thấy thông tin phim.</Text>
      </Center>
    );
  }

  const { movie, episodes, movieMetadata } = movieDetails;
  const availableServers = episodes || [];
  const currentServerEpisodes =
    availableServers[selectedServerIndex]?.server_data || [];

  return (
    <Container maxW="container.xl" py={8}>
      <SimpleGrid
        columns={{ base: 1, md: 3 }}
        spacing={{ base: 4, md: 8 }}
        mb={8}
      >
        <Box gridColumn={{ base: "auto", md: "span 2" }} ref={playerRef}>
          {currentEpisode && currentEpisode.link_embed ? (
            <AspectRatio
              ratio={16 / 9}
              mb={4}
              shadow="xl"
              rounded="md"
              overflow="hidden"
              bg="black"
            >
              <iframe
                title={currentEpisode.name || movie.name}
                src={currentEpisode.link_embed}
                allowFullScreen
                style={{ border: 0 }}
              />
            </AspectRatio>
          ) : (
            <Center
              h={{ base: "250px", md: "400px" }}
              bg="background.secondary"
              rounded="md"
              shadow="md"
              mb={4}
            >
              <VStack spacing={4}>
                <Icon
                  as={FaPlayCircle}
                  boxSize={{ base: 12, md: 16 }}
                  color="brand.accent"
                />
                <Text
                  color="text.secondary"
                  fontSize={{ base: "md", md: "lg" }}
                  textAlign="center"
                  px={4}
                >
                  {availableServers.length > 0
                    ? "Vui lòng chọn một tập để xem"
                    : "Phim hiện chưa có tập nào"}
                </Text>
              </VStack>
            </Center>
          )}
          <Heading
            as="h1"
            size={{ base: "lg", md: "xl" }}
            color="whiteAlpha.900"
            mb={1}
          >
            {movie.name}
          </Heading>
          <Text color="gray.400" fontSize={{ base: "sm", md: "md" }} mb={4}>
            {movie.origin_name} ({movie.year})
          </Text>
        </Box>

        <Box
          maxH={{
            base: "350px",
            md: "calc((16/9 * ( (100vw - 32px*2 - 32px*0.66) * 2/3 ) ) + 70px)",
          }}
          overflowY="auto"
          p={4}
          bg="background.secondary"
          rounded="md"
          shadow="md"
          css={{
            "&::-webkit-scrollbar": { width: "8px" },
            "&::-webkit-scrollbar-track": { background: "transparent" },
            "&::-webkit-scrollbar-thumb": {
              background: "brand.700",
              borderRadius: "4px",
            },
            "&::-webkit-scrollbar-thumb:hover": {
              background: "brand.accent",
            },
          }}
        >
          {availableServers.length > 1 && (
            <Box mb={4}>
              <HStack mb={2}>
                <Icon as={FaServer} color="brand.accent" />
                <Text fontWeight="bold" color="brand.accent">
                  Chọn Server:
                </Text>
              </HStack>
              <Select
                value={selectedServerIndex}
                onChange={handleServerChange}
                size="sm"
                borderColor="brand.600"
                focusBorderColor="brand.accent"
                bg="background.primary"
              >
                {availableServers.map((server, index) => (
                  <option
                    key={index}
                    value={index}
                    style={{ backgroundColor: "#2D3748" }}
                  >
                    {server.server_name} ({server.server_data.length} tập)
                  </option>
                ))}
              </Select>
            </Box>
          )}
          <Heading
            size="md"
            mb={3}
            color={
              availableServers.length > 1 ? "whiteAlpha.800" : "brand.accent"
            }
          >
            {availableServers.length > 1
              ? `Danh Sách Tập (${
                  availableServers[selectedServerIndex]?.server_name || "Server"
                })`
              : "Danh Sách Tập"}
          </Heading>
          {currentServerEpisodes.length > 0 ? (
            <VStack spacing={2} align="stretch">
              {currentServerEpisodes.map((ep, idx) => (
                <Button
                  key={ep.slug || `${ep.name}-${idx}`}
                  onClick={() => handleEpisodeSelect(ep)}
                  variant={
                    currentEpisode &&
                    currentEpisode.slug === ep.slug &&
                    currentEpisode.name === ep.name
                      ? "solid"
                      : "outline"
                  }
                  colorScheme={
                    currentEpisode &&
                    currentEpisode.slug === ep.slug &&
                    currentEpisode.name === ep.name
                      ? "orange"
                      : "gray"
                  }
                  justifyContent="flex-start"
                  isFullWidth
                  size="sm"
                  textAlign="left"
                  whiteSpace="normal"
                  height="auto"
                  py={2}
                  _hover={{
                    bg:
                      currentEpisode &&
                      currentEpisode.slug === ep.slug &&
                      currentEpisode.name === ep.name
                        ? "orange.600"
                        : "brand.800",
                    borderColor:
                      currentEpisode &&
                      currentEpisode.slug === ep.slug &&
                      currentEpisode.name === ep.name
                        ? "orange.600"
                        : "brand.accent",
                  }}
                >
                  {ep.name}
                </Button>
              ))}
            </VStack>
          ) : (
            <Text color="text.disabled" textAlign="center" mt={4}>
              Server này hiện chưa có tập nào.
            </Text>
          )}
        </Box>
      </SimpleGrid>

      <Divider my={8} borderColor="brand.700" />

      <Tabs variant="soft-rounded" colorScheme="orange" mb={8} defaultIndex={0}>
        <TabList overflowX="auto" overflowY="hidden" pb={1}>
          <Tab
            _selected={{ color: "white", bg: "orange.500" }}
            whiteSpace="nowrap"
          >
            Thông Tin Chung
          </Tab>
          <Tab
            _selected={{ color: "white", bg: "orange.500" }}
            whiteSpace="nowrap"
          >
            Nội Dung Phim
          </Tab>
          {showTrailer && (
            <Tab
              _selected={{ color: "white", bg: "orange.500" }}
              whiteSpace="nowrap"
            >
              Trailer
            </Tab>
          )}
        </TabList>
        <TabPanels>
          <TabPanel>
            <SimpleGrid
              columns={{ base: 1, md: 2 }}
              spacingX={8}
              spacingY={{ base: 3, md: 4 }}
              mt={4}
            >
              <HStack>
                <Icon as={FaCalendarAlt} color="brand.accent" mr={2} />{" "}
                <Text>
                  <strong>Năm:</strong> {movie.year || "N/A"}
                </Text>
              </HStack>
              <HStack>
                <Icon as={FaClock} color="brand.accent" mr={2} />{" "}
                <Text>
                  <strong>Thời lượng:</strong> {movie.time || "N/A"}
                </Text>
              </HStack>
              <HStack>
                <Icon as={FaGlobe} color="brand.accent" mr={2} />{" "}
                <Text>
                  <strong>Quốc gia:</strong>{" "}
                  {movie.country?.map((c) => c.name).join(", ") || "N/A"}
                </Text>
              </HStack>
              <HStack>
                <Icon as={FaVideo} color="brand.accent" mr={2} />{" "}
                <Text>
                  <strong>Chất lượng:</strong> {movie.quality || "N/A"}
                </Text>
              </HStack>
              <HStack>
                <Icon as={FaFilm} color="brand.accent" mr={2} />{" "}
                <Text>
                  <strong>Ngôn ngữ:</strong> {movie.lang || "N/A"}
                </Text>
              </HStack>
              <HStack>
                <Icon as={FaTags} color="brand.accent" mr={2} />{" "}
                <Text>
                  <strong>Trạng thái:</strong> {movie.episode_current || "N/A"}
                </Text>
              </HStack>
              <Box gridColumn={{ base: "auto", md: "span 2" }}>
                <HStack>
                  <Icon as={FaUserFriends} color="brand.accent" mr={2} />{" "}
                  <Text>
                    <strong>Đạo diễn:</strong>
                  </Text>
                </HStack>
                <Text ml={6} color="gray.300">
                  {movie.director?.join(", ") || "N/A"}
                </Text>
              </Box>
              <Box gridColumn={{ base: "auto", md: "span 2" }}>
                <HStack>
                  <Icon as={FaTags} color="brand.accent" mr={2} />{" "}
                  <Text>
                    <strong>Thể loại:</strong>
                  </Text>
                </HStack>
                <HStack spacing={2} mt={1} wrap="wrap" ml={6}>
                  {movie.category?.map((cat) => (
                    <Tag
                      key={cat.slug}
                      size="sm"
                      variant="solid"
                      colorScheme="gray"
                      m={0.5}
                    >
                      {cat.name}
                    </Tag>
                  ))}
                </HStack>
              </Box>
              <Box gridColumn={{ base: "auto", md: "span 2" }}>
                <HStack>
                  <Icon as={FaUserFriends} color="brand.accent" mr={2} />{" "}
                  <Text>
                    <strong>Diễn viên:</strong>
                  </Text>
                </HStack>
                <HStack spacing={2} mt={1} wrap="wrap" ml={6}>
                  {movie.actor && movie.actor.length > 0 ? (
                    movie.actor.map((act, idx) => (
                      <Tag
                        key={`${act}-${idx}`}
                        size="sm"
                        variant="outline"
                        colorScheme="teal"
                        m={0.5}
                      >
                        {act}
                      </Tag>
                    ))
                  ) : (
                    <Text fontSize="sm" color="text.disabled" ml={6}>
                      Không có thông tin.
                    </Text>
                  )}
                </HStack>
              </Box>
            </SimpleGrid>
          </TabPanel>
          <TabPanel>
            <VStack align="start" spacing={3} mt={4}>
              <Heading size="md" color="brand.accent">
                Nội dung
              </Heading>
              {movie.content || movie.description ? (
                <Box
                  dangerouslySetInnerHTML={{
                    __html: movie.content || movie.description,
                  }}
                  color="text.secondary"
                  sx={{
                    p: { marginBottom: "0.75rem", lineHeight: "1.7" },
                    strong: { color: "whiteAlpha.800" },
                    a: { color: "orange.400", textDecoration: "underline" },
                    img: {
                      maxWidth: "100%",
                      height: "auto",
                      borderRadius: "md",
                      marginY: "0.5rem",
                    },
                  }}
                />
              ) : (
                <Text color="text.disabled">Nội dung đang được cập nhật.</Text>
              )}
            </VStack>
          </TabPanel>
          {showTrailer && (
            <TabPanel>
              <VStack align="start" spacing={3} mt={4}>
                <Heading size="md" color="brand.accent">
                  Trailer
                </Heading>
                {youtubeVideoId && (
                  <iframe
                    width="100%"
                    height="315"
                    src={`https://www.youtube.com/embed/${youtubeVideoId}`}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                )}
              </VStack>
            </TabPanel>
          )}
        </TabPanels>
      </Tabs>

      <Divider my={8} borderColor="brand.700" />

      <Box id="review-section" mb={10}>
        <Heading as="h3" size="lg" mb={6} color="whiteAlpha.900">
          Đánh giá & Bình luận
        </Heading>

        <Flex mb={6} align="center" wrap="wrap">
          <Heading size="md" mr={4} color="whiteAlpha.800">
            Xếp hạng:
          </Heading>
          {movieMetadata?.appRatingCount > 0 ? (
            <Flex align="center">
              <HStack spacing={1} mr={2}>
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
              <Text
                fontWeight="bold"
                fontSize="lg"
                mr={2}
                color="whiteAlpha.900"
              >
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

        {isAuthenticated ? (
          <Box p={4} bg="background.secondary" rounded="md" mb={8} shadow="md">
            <Heading size="md" mb={3} color="brand.accent">
              {existingUserReview
                ? "Chỉnh sửa đánh giá của bạn"
                : "Viết đánh giá của bạn"}
            </Heading>
            <VStack spacing={3} align="stretch">
              <Box>
                <Text mb={1} fontSize="sm" fontWeight="medium">
                  Đánh giá của bạn (sao):
                </Text>
                <ReactStars
                  count={5}
                  onChange={handleRatingChange}
                  size={30}
                  color1={"#666"}
                  color2={"#ffd700"}
                  value={userRating}
                  half={false}
                />
              </Box>
              <Box>
                <Text mb={1} fontSize="sm" fontWeight="medium">
                  Nội dung bình luận:
                </Text>
                <Textarea
                  value={userReviewContent}
                  onChange={handleContentChange}
                  placeholder="Chia sẻ cảm nghĩ của bạn về bộ phim..."
                  size="sm"
                  rows={4}
                  borderColor="brand.600"
                  focusBorderColor="brand.accent"
                  bg="background.primary"
                />
              </Box>
              {submitReviewError && (
                <Text color="red.400" fontSize="sm">
                  Lỗi: {submitReviewError}
                </Text>
              )}
              <Button
                colorScheme="orange"
                onClick={handleSubmitReview}
                isLoading={isSubmittingReview}
                alignSelf="flex-end"
              >
                {existingUserReview ? "Cập Nhật Đánh Giá" : "Gửi Đánh Giá"}
              </Button>
            </VStack>
          </Box>
        ) : (
          <Center
            p={4}
            bg="background.secondary"
            rounded="md"
            mb={8}
            shadow="md"
          >
            <Text color="gray.400">
              Vui lòng{" "}
              <Button
                variant="link"
                colorScheme="orange"
                onClick={() => navigate("/login")}
              >
                đăng nhập
              </Button>{" "}
              để viết đánh giá.
            </Text>
          </Center>
        )}

        <VStack spacing={6} align="stretch">
          <Heading size="md" color="whiteAlpha.800">
            Bình luận ({reviewCount})
          </Heading>
          {loadingReviews ? (
            <Center h="100px">
              <Spinner color="brand.accent" />
            </Center>
          ) : errorReviews ? (
            <Text color="red.400">Lỗi tải bình luận: {errorReviews}</Text>
          ) : reviews.length > 0 ? (
            reviews.map((review) => (
              <Box
                key={review._id}
                p={4}
                bg="background.card"
                rounded="md"
                shadow="sm"
              >
                <Flex justify="space-between" align="flex-start" mb={2}>
                  <HStack spacing={3}>
                    <Avatar
                      size="sm"
                      name={review.user?.name || "User"}
                      src={review.user?.avatarUrl}
                    />
                    <VStack align="flex-start" spacing={0}>
                      <Text
                        fontWeight="bold"
                        fontSize="sm"
                        color="whiteAlpha.900"
                      >
                        {review.user?.name || "Người dùng ẩn danh"}
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
                      onClick={() => handleDeleteReview(review._id)}
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
                  </HStack>
                )}
                <Text fontSize="sm" color="gray.300" whiteSpace="pre-wrap">
                  {review.content}
                </Text>
              </Box>
            ))
          ) : (
            <Text color="gray.500" fontStyle="italic">
              Hiện chưa có bình luận nào cho phim này.
            </Text>
          )}

          {reviewPages > 1 && (
            <HStack justify="center" spacing={4} mt={4}>
              <Button
                onClick={() => handlePageChange(reviewPage - 1)}
                isDisabled={reviewPage <= 1}
                size="sm"
              >
                Trước
              </Button>
              <Text>
                Trang {reviewPage} / {reviewPages}
              </Text>
              <Button
                onClick={() => handlePageChange(reviewPage + 1)}
                isDisabled={reviewPage >= reviewPages}
                size="sm"
              >
                Sau
              </Button>
            </HStack>
          )}
        </VStack>
      </Box>
    </Container>
  );
};

export default MovieDetailPage;
