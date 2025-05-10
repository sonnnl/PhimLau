import React, { useState, useEffect } from "react";
import {
  Container,
  Heading,
  Text,
  Spinner,
  Center,
  SimpleGrid,
  Button,
  Icon,
  Box,
  VStack,
  Flex,
} from "@chakra-ui/react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { ArrowForwardIcon } from "@chakra-ui/icons";
import movieService from "../services/movieService";
import MovieCard from "../components/MovieCard";
import MovieSlider from "../components/MovieSlider";

const MAX_SLIDER_MOVIES = 12;
const MAX_GRID_MOVIES = 6;

const SectionHeader = ({ title, onViewMore }) => (
  <Flex justify="space-between" align="center" mb={4}>
    <Heading as="h2" size="lg" color="whiteAlpha.900" fontWeight="bold">
      {title}
    </Heading>
    {onViewMore && (
      <Button
        rightIcon={<ArrowForwardIcon />}
        colorScheme="orange"
        variant="link"
        onClick={onViewMore}
        color="brand.accent"
        _hover={{ textDecoration: "underline" }}
      >
        Xem Tất Cả
      </Button>
    )}
  </Flex>
);

const MovieGrid = ({ movies, isLoading, error }) => {
  if (isLoading) {
    return (
      <Center h="200px">
        <Spinner size="lg" color="brand.accent" />
      </Center>
    );
  }

  if (error) {
    return (
      <Center h="150px">
        <Text color="red.400" bg="red.50" p={3} rounded="md" fontSize="sm">
          Lỗi: {error}
        </Text>
      </Center>
    );
  }

  if (!movies || movies.length === 0) {
    return (
      <Center h="150px">
        <Text color="gray.500">Không có phim nào để hiển thị.</Text>
      </Center>
    );
  }

  return (
    <SimpleGrid
      columns={{ base: 2, sm: 3, md: 4, lg: 5, xl: 6 }}
      spacing={{ base: 3, md: 5 }}
    >
      {movies.map((movie, index) => (
        <MovieCard key={`${movie._id || movie.slug}-${index}`} movie={movie} />
      ))}
    </SimpleGrid>
  );
};

const HomePage = () => {
  const [sliderMovies, setSliderMovies] = useState([]);
  const [singleMovies, setSingleMovies] = useState([]);
  const [seriesMovies, setSeriesMovies] = useState([]);

  const [loadingSlider, setLoadingSlider] = useState(true);
  const [loadingSingle, setLoadingSingle] = useState(true);
  const [loadingSeries, setLoadingSeries] = useState(true);

  const [errorSlider, setErrorSlider] = useState(null);
  const [errorSingle, setErrorSingle] = useState(null);
  const [errorSeries, setErrorSeries] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchAllMovies = async () => {
      setLoadingSlider(true);
      setErrorSlider(null);
      try {
        const latestData = await movieService.getLatestMovies(1);
        if (latestData && latestData.items) {
          setSliderMovies(latestData.items.slice(0, MAX_SLIDER_MOVIES));
        } else {
          setSliderMovies([]);
        }
      } catch (err) {
        setErrorSlider(err.message || "Không thể tải phim mới cập nhật.");
        console.error("Error HomePage - Latest Movies:", err);
      } finally {
        setLoadingSlider(false);
      }

      setLoadingSingle(true);
      setErrorSingle(null);
      try {
        const singleData = await movieService.getSingleMovies(
          1,
          MAX_GRID_MOVIES
        );
        if (singleData && (singleData.items || singleData.movies)) {
          setSingleMovies(
            (singleData.items || singleData.movies).slice(0, MAX_GRID_MOVIES)
          );
        } else {
          setSingleMovies([]);
        }
      } catch (err) {
        setErrorSingle(err.message || "Không thể tải phim lẻ.");
        console.error("Error HomePage - Single Movies:", err);
      } finally {
        setLoadingSingle(false);
      }

      setLoadingSeries(true);
      setErrorSeries(null);
      try {
        const seriesData = await movieService.getSeriesMovies(
          1,
          MAX_GRID_MOVIES
        );
        if (seriesData && (seriesData.items || seriesData.movies)) {
          setSeriesMovies(
            (seriesData.items || seriesData.movies).slice(0, MAX_GRID_MOVIES)
          );
        } else {
          setSeriesMovies([]);
        }
      } catch (err) {
        setErrorSeries(err.message || "Không thể tải phim bộ.");
        console.error("Error HomePage - Series Movies:", err);
      } finally {
        setLoadingSeries(false);
      }
    };

    fetchAllMovies();
  }, []);

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={12} align="stretch">
        <Box>
          <Heading
            as="h1"
            size="xl"
            mb={6}
            color="brand.accent"
            fontWeight="bold"
          >
            Phim Mới Cập Nhật
          </Heading>
          {loadingSlider && (
            <Center h="300px">
              <Spinner size="xl" color="brand.accent" />
            </Center>
          )}
          {errorSlider && (
            <Center h="200px">
              <Text color="red.400" bg="red.50" p={4} rounded="md">
                Lỗi: {errorSlider}
              </Text>
            </Center>
          )}
          {!loadingSlider &&
            !errorSlider &&
            (sliderMovies.length > 0 ? (
              <MovieSlider movies={sliderMovies} />
            ) : (
              <Center h="200px">
                <Text>Không có phim mới nào để hiển thị.</Text>
              </Center>
            ))}
        </Box>

        <Box>
          <SectionHeader
            title="Phim Lẻ Chiếu Rạp"
            onViewMore={() => navigate("/movies/single")}
          />
          <MovieGrid
            movies={singleMovies}
            isLoading={loadingSingle}
            error={errorSingle}
          />
        </Box>

        <Box>
          <SectionHeader
            title="Phim Bộ Đặc Sắc"
            onViewMore={() => navigate("/movies/series")}
          />
          <MovieGrid
            movies={seriesMovies}
            isLoading={loadingSeries}
            error={errorSeries}
          />
        </Box>
      </VStack>
    </Container>
  );
};

export default HomePage;
