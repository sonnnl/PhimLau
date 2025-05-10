import React from "react";
import {
  Box,
  Heading,
  Text,
  Image,
  LinkBox,
  LinkOverlay,
  AspectRatio,
  Tooltip,
  HStack,
  Icon,
  Flex,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { FiClock, FiGlobe } from "react-icons/fi";
import { StarIcon } from "@chakra-ui/icons";
import MovieDetailTooltip from "./MovieDetailTooltip";

const MovieCard = ({ movie }) => {
  if (!movie) {
    return null;
  }

  const CDN_IMAGE_DOMAIN = "https://phimimg.com";

  const getImageUrl = (path) => {
    if (!path) return "https://via.placeholder.com/300x450.png?text=No+Image";
    if (path.startsWith("http://") || path.startsWith("https://")) {
      return path;
    }
    return `${CDN_IMAGE_DOMAIN}/${path}`;
  };

  const imageUrl = getImageUrl(movie.poster_url || movie.thumb_url);

  const avgRating =
    movie.movieMetadata?.appAverageRating || movie.appAverageRating;
  const ratingCount =
    movie.movieMetadata?.appRatingCount || movie.appRatingCount;

  let bottomText = "N/A";
  if (movie.episode_current && movie.lang && movie.quality) {
    bottomText = `${movie.episode_current} | ${movie.lang} | ${movie.quality}`;
  } else if (movie.modified && movie.modified.time) {
    bottomText = new Date(movie.modified.time).toLocaleDateString("vi-VN");
  }

  return (
    <Tooltip
      label={<MovieDetailTooltip movie={movie} />}
      placement="auto-start"
      hasArrow
      bg="white"
      color="gray.800"
      p={0}
      borderRadius="md"
      boxShadow="xl"
      openDelay={300}
      closeDelay={100}
      isDisabled={!movie}
      offset={[0, 10]}
    >
      <LinkBox
        as="article"
        borderWidth="1px"
        rounded="lg"
        overflow="hidden"
        borderColor="brand.700"
        bg="background.card"
        _hover={{
          boxShadow: "lg",
          transform: "translateY(-2px)",
          borderColor: "brand.accent",
        }}
        transition="all 0.2s ease-in-out"
        height="100%"
        display="flex"
        flexDirection="column"
      >
        <AspectRatio ratio={2 / 3} width="100%">
          <Image
            src={imageUrl}
            alt={movie.name}
            objectFit="cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src =
                "https://via.placeholder.com/300x450.png?text=Image+Error";
            }}
          />
        </AspectRatio>
        <Box
          p="4"
          flexGrow={1}
          display="flex"
          flexDirection="column"
          justifyContent="space-between"
        >
          <Box>
            <Heading
              size="sm"
              noOfLines={2}
              title={movie.name}
              color="whiteAlpha.900"
              mb={1}
              minHeight="2.5em"
            >
              <LinkOverlay
                as={RouterLink}
                to={`/movie/${movie.slug}`}
                color="inherit"
                _hover={{ color: "inherit" }}
              >
                {movie.name || "Tên phim không xác định"}
              </LinkOverlay>
            </Heading>
            <Text
              fontSize="xs"
              color="gray.400"
              noOfLines={1}
              title={movie.origin_name}
              minHeight="1.2em"
            >
              {movie.origin_name || "Tên gốc không rõ"}{" "}
              {movie.year ? `(${movie.year})` : ""}
            </Text>
            <HStack
              spacing={3}
              mt={1.5}
              fontSize="xs"
              color="gray.400"
              minHeight="1.4em"
            >
              {movie.country && movie.country[0] && (
                <HStack spacing={1} align="center">
                  <Icon as={FiGlobe} boxSize={3} />
                  <Text
                    noOfLines={1}
                    title={movie.country.map((c) => c.name).join(", ")}
                  >
                    {movie.country[0].name}
                  </Text>
                </HStack>
              )}
              {movie.time && (
                <HStack spacing={1} align="center">
                  <Icon as={FiClock} boxSize={3} />
                  <Text>
                    {movie.time ? movie.time.replace(/\s*phút/i, "") : "N/A"}
                  </Text>
                </HStack>
              )}
            </HStack>
          </Box>
          <Flex align="center" justify="space-between" mt={2}>
            <Text
              fontSize="xs"
              color="gray.500"
              noOfLines={1}
              title={bottomText}
            >
              {bottomText}
            </Text>
            {ratingCount > 0 && (
              <Flex align="center">
                <StarIcon color="yellow.400" boxSize={3} mr={0.5} />
                <Text fontSize="xs" color="gray.400" fontWeight="semibold">
                  {avgRating ? avgRating.toFixed(1) : "-"}
                </Text>
              </Flex>
            )}
          </Flex>
        </Box>
      </LinkBox>
    </Tooltip>
  );
};

export default MovieCard;
