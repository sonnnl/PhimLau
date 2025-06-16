import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Heading,
  Text,
  Spinner,
  Center,
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
  VStack,
} from "@chakra-ui/react";
import movieService from "../services/movieService";
import { useAuth } from "../contexts/AuthContext";
import favoriteService from "../services/favoriteService";
import { reportWatchEvent } from "../services/watchSessionService";

// Import custom components
import VideoPlayer from "../components/movie-detail/VideoPlayer";
import EpisodeList from "../components/movie-detail/EpisodeList";
import MovieInfo from "../components/movie-detail/MovieInfo";
import ReviewSection from "../components/movie-detail/ReviewSection";

// Helper function to determine if a movie is a single-part movie (phim lẻ)
const isSingleMovie = (movieData) => {
  if (!movieData || !movieData.episodes || movieData.episodes.length === 0) {
    // Nếu không có episodes, không thể xác định, coi như không phải
    return false;
  }
  // Trả về true nếu TẤT CẢ các server đều chỉ có 1 tập phim
  return movieData.episodes.every(
    (server) => server.server_data && server.server_data.length === 1
  );
};

const MovieDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, token, isAuthenticated } = useAuth();

  // Main states
  const [movieDetails, setMovieDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Favorite state
  const [isFavorited, setIsFavorited] = useState(false);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(true);

  // Video player states
  const [selectedServerIndex, setSelectedServerIndex] = useState(0);
  const [currentEpisode, setCurrentEpisode] = useState(null);
  const playerRef = useRef(null);

  // Trailer states
  const [showTrailer, setShowTrailer] = useState(false);
  const [youtubeVideoId, setYoutubeVideoId] = useState(null);

  // Function to refresh movie details after review update
  const handleReviewUpdate = useCallback(async () => {
    try {
      const data = await movieService.getMovieDetails(slug);
      setMovieDetails(data);
    } catch (err) {
      console.error("Error refreshing movie details:", err);
    }
  }, [slug]);

  // Extract YouTube video ID from URL
  const extractYouTubeVideoId = (url) => {
    if (!url) return null;
    const regex =
      /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  // Handle server change
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

  // Handle episode selection
  const handleEpisodeSelect = (episode) => {
    setCurrentEpisode(episode);

    // Báo cáo sự kiện xem phim (fire-and-forget)
    if (user && movieDetails?.movie?._id && episode?.slug) {
      const serverName =
        movieDetails.episodes[selectedServerIndex]?.server_name;
      reportWatchEvent(movieDetails.movie._id, episode.slug, serverName);
    }

    setTimeout(() => {
      playerRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 100);
  };

  // Fetch movie details
  useEffect(() => {
    const fetchDetails = async () => {
      if (!slug) return;

      setLoading(true);
      setError(null);

      try {
        const data = await movieService.getMovieDetails(slug);
        setMovieDetails(data);

        // -- LOGIC MỚI CHO PHIM LẺ --
        // Tự động báo cáo và phát phim lẻ ngay khi tải xong
        if (user && isSingleMovie(data)) {
          const firstServer = data.episodes[0];
          const singleEpisode = firstServer?.server_data[0];

          if (singleEpisode) {
            // Tự động báo cáo sự kiện xem
            reportWatchEvent(
              data.movie._id,
              singleEpisode.slug,
              firstServer.server_name
            );
            // Tự động chọn tập để phát
            setCurrentEpisode(singleEpisode);
          }
        } else {
          // Logic cũ cho phim bộ: khôi phục trạng thái đã lưu
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

          // Set initial server and episode
          if (data && data.episodes && data.episodes.length > 0) {
            let serverToSelect = 0;
            let episodeToSelect = null;

            // Use stored state if available
            if (
              lastState &&
              lastState.serverIndex !== undefined &&
              data.episodes[lastState.serverIndex]
            ) {
              serverToSelect = lastState.serverIndex;
            }

            const selectedServerData =
              data.episodes[serverToSelect]?.server_data;

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
          }
        }

        // Handle trailer
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
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [slug]);

  // Check favorite status when user or movie details are loaded
  useEffect(() => {
    const checkStatus = async () => {
      if (isAuthenticated && movieDetails?.movie?._id) {
        setIsFavoriteLoading(true);
        try {
          const status = await favoriteService.checkFavoriteStatus(
            movieDetails.movie._id
          );
          setIsFavorited(status.isFavorited);
        } catch (err) {
          console.error("Failed to check favorite status:", err);
          // Don't set an error, just assume not favorited
          setIsFavorited(false);
        } finally {
          setIsFavoriteLoading(false);
        }
      } else {
        setIsFavoriteLoading(false);
        setIsFavorited(false);
      }
    };
    checkStatus();
  }, [isAuthenticated, movieDetails]);

  // Handle favorite button toggle
  const handleToggleFavorite = async () => {
    if (!isAuthenticated || !movieDetails?.movie?._id) {
      navigate("/login"); // Redirect to login if not authenticated
      return;
    }

    setIsFavoriteLoading(true);
    try {
      if (isFavorited) {
        await favoriteService.removeFavorite(movieDetails.movie._id);
        setIsFavorited(false);
      } else {
        await favoriteService.addFavorite(movieDetails.movie._id);
        setIsFavorited(true);
      }
    } catch (err) {
      console.error("Failed to toggle favorite:", err);
      // Optional: show a toast notification on error
    } finally {
      setIsFavoriteLoading(false);
    }
  };

  // Save watch state to localStorage
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

  // Loading state
  if (loading) {
    return (
      <Center h="calc(100vh - 128px)">
        <Spinner size="xl" color="brand.accent" thickness="4px" speed="0.65s" />
      </Center>
    );
  }

  // Error state
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

  // No data state
  if (!movieDetails || !movieDetails.movie) {
    return (
      <Center h="calc(100vh - 128px)">
        <Text>Không tìm thấy thông tin phim.</Text>
      </Center>
    );
  }

  const { movie, episodes, movieMetadata } = movieDetails;
  const availableServers = episodes || [];

  return (
    <Container maxW="container.xl" py={8}>
      {/* Video Player & Episode List */}
      <SimpleGrid
        columns={{ base: 1, md: 3 }}
        spacing={{ base: 4, md: 8 }}
        mb={8}
      >
        {/* Video Player */}
        <Box gridColumn={{ base: "auto", md: "span 2" }}>
          <VideoPlayer
            currentEpisode={currentEpisode}
            movie={movie}
            availableServers={availableServers}
            playerRef={playerRef}
          />

          {/* Movie Title */}
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

        {/* Episode List */}
        <EpisodeList
          availableServers={availableServers}
          selectedServerIndex={selectedServerIndex}
          currentEpisode={currentEpisode}
          handleServerChange={handleServerChange}
          handleEpisodeSelect={handleEpisodeSelect}
        />
      </SimpleGrid>

      <Divider my={8} borderColor="brand.700" />

      {/* Movie Information Tabs */}
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
          {/* Movie Info Tab */}
          <TabPanel>
            <MovieInfo
              movie={movie}
              movieMetadata={movieMetadata}
              isFavorited={isFavorited}
              isFavoriteLoading={isFavoriteLoading}
              onToggleFavorite={handleToggleFavorite}
            />
          </TabPanel>

          {/* Content Tab */}
          <TabPanel>
            <VStack align="start" spacing={4} mt={4}>
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

          {/* Trailer Tab */}
          {showTrailer && (
            <TabPanel>
              <VStack align="start" spacing={4} mt={4}>
                <Heading size="md" color="brand.accent">
                  Trailer
                </Heading>
                {youtubeVideoId && (
                  <Box w="full" maxW="800px">
                    <iframe
                      width="100%"
                      height="450"
                      src={`https://www.youtube.com/embed/${youtubeVideoId}`}
                      title="YouTube video player"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      style={{ borderRadius: "8px" }}
                    />
                  </Box>
                )}
              </VStack>
            </TabPanel>
          )}
        </TabPanels>
      </Tabs>

      <Divider my={8} borderColor="brand.700" />

      {/* Review Section */}
      <ReviewSection
        movieMetadata={movieMetadata}
        user={user}
        token={token}
        isAuthenticated={isAuthenticated}
        slug={slug}
        onReviewUpdate={handleReviewUpdate}
      />
    </Container>
  );
};

export default MovieDetailPage;
