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
  Badge,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { FiCalendar, FiFilm, FiEye, FiHeart } from "react-icons/fi";
import { StarIcon } from "@chakra-ui/icons";

const ForumMovieCard = ({ movieMetadata }) => {
  if (!movieMetadata) {
    return null;
  }

  const getImageUrl = (posterUrl) => {
    if (!posterUrl) {
      return "https://via.placeholder.com/300x450/e2e8f0/718096?text=No+Image";
    }
    if (posterUrl.startsWith("http")) {
      return posterUrl;
    }
    return `https://img.phimapi.com/${posterUrl}`;
  };

  const getMovieTypeDisplay = (type) => {
    const typeMap = {
      single: "Phim lẻ",
      series: "Phim bộ",
      hoathinh: "Hoạt hình",
      tvshows: "TV Shows",
    };
    return typeMap[type] || type || "N/A";
  };

  const imageUrl = getImageUrl(movieMetadata.moviePosterUrl);

  return (
    <Tooltip
      label={
        <Box p={3} maxW="250px">
          <Text fontWeight="bold" mb={2}>
            {movieMetadata.movieTitle}
          </Text>
          <Text fontSize="sm" color="gray.300" mb={1}>
            {getMovieTypeDisplay(movieMetadata.movieType)}
          </Text>
          {movieMetadata.movieYear && (
            <Text fontSize="sm" color="gray.400" mb={2}>
              Năm: {movieMetadata.movieYear}
            </Text>
          )}

          {/* Rating Info */}
          {movieMetadata.appRatingCount > 0 && (
            <HStack spacing={2} mb={2}>
              <HStack spacing={1}>
                <StarIcon color="yellow.400" boxSize={3} />
                <Text fontSize="sm" fontWeight="semibold">
                  {movieMetadata.appAverageRating?.toFixed(1) || "0.0"}
                </Text>
              </HStack>
              <Text fontSize="xs" color="gray.400">
                ({movieMetadata.appRatingCount} đánh giá)
              </Text>
            </HStack>
          )}

          {/* Stats */}
          <HStack spacing={3} fontSize="xs" color="gray.400" mb={2}>
            {movieMetadata.appTotalViews > 0 && (
              <HStack spacing={1}>
                <Icon as={FiEye} boxSize={3} />
                <Text>{movieMetadata.appTotalViews} lượt xem</Text>
              </HStack>
            )}
            {movieMetadata.appTotalFavorites > 0 && (
              <HStack spacing={1}>
                <Icon as={FiHeart} boxSize={3} />
                <Text>{movieMetadata.appTotalFavorites} yêu thích</Text>
              </HStack>
            )}
          </HStack>

          {movieMetadata.isPrimary && (
            <Badge colorScheme="orange" size="sm">
              Phim chính
            </Badge>
          )}
        </Box>
      }
      placement="auto-start"
      hasArrow
      bg="gray.800"
      color="white"
      borderRadius="md"
      boxShadow="xl"
      openDelay={300}
      closeDelay={100}
    >
      <LinkBox
        as="article"
        borderWidth="1px"
        rounded="lg"
        overflow="hidden"
        borderColor="gray.700"
        bg="background.card"
        _hover={{
          boxShadow: "lg",
          transform: "translateY(-2px)",
          borderColor: "orange.400",
        }}
        transition="all 0.2s ease-in-out"
        height="100%"
        display="flex"
        flexDirection="column"
        position="relative"
      >
        <AspectRatio ratio={2 / 3} width="100%">
          <Image
            src={imageUrl}
            alt={movieMetadata.movieTitle}
            objectFit="cover"
          />
        </AspectRatio>

        <Box
          p="3"
          flexGrow={1}
          display="flex"
          flexDirection="column"
          justifyContent="space-between"
        >
          <Box>
            <Heading
              size="sm"
              noOfLines={2}
              title={movieMetadata.movieTitle}
              color="whiteAlpha.900"
              mb={1}
              minHeight="2.5em"
              fontSize="sm"
            >
              <LinkOverlay
                as={RouterLink}
                to={`/movie/${movieMetadata.movieSlug}`}
                color="inherit"
                _hover={{ color: "orange.400" }}
              >
                {movieMetadata.movieTitle || "Tên phim không xác định"}
              </LinkOverlay>
            </Heading>

            <HStack
              spacing={2}
              mt={2}
              fontSize="xs"
              color="gray.400"
              minHeight="1.4em"
              wrap="wrap"
            >
              {movieMetadata.movieType && (
                <HStack spacing={1} align="center">
                  <Icon as={FiFilm} boxSize={3} />
                  <Text noOfLines={1}>
                    {getMovieTypeDisplay(movieMetadata.movieType)}
                  </Text>
                </HStack>
              )}
              {movieMetadata.movieYear && (
                <HStack spacing={1} align="center">
                  <Icon as={FiCalendar} boxSize={3} />
                  <Text>{movieMetadata.movieYear}</Text>
                </HStack>
              )}
            </HStack>

            {/* Rating Display */}
            {movieMetadata.appRatingCount > 0 && (
              <Flex
                align="center"
                justify="space-between"
                mt={2}
                flexWrap="wrap"
              >
                <HStack spacing={1} mb={{ base: 1, md: 0 }}>
                  <StarIcon color="yellow.400" boxSize={3} />
                  <Text fontSize="xs" color="gray.300" fontWeight="semibold">
                    {movieMetadata.appAverageRating?.toFixed(1) || "0.0"}
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    ({movieMetadata.appRatingCount})
                  </Text>
                </HStack>
                <HStack spacing={2} fontSize="xs" color="gray.500">
                  {movieMetadata.appTotalViews > 0 && (
                    <HStack spacing={1}>
                      <Icon as={FiEye} boxSize={3} />
                      <Text>{movieMetadata.appTotalViews}</Text>
                    </HStack>
                  )}
                  {movieMetadata.appTotalFavorites > 0 && (
                    <HStack spacing={1}>
                      <Icon as={FiHeart} boxSize={3} />
                      <Text>{movieMetadata.appTotalFavorites}</Text>
                    </HStack>
                  )}
                </HStack>
              </Flex>
            )}
          </Box>
        </Box>
      </LinkBox>
    </Tooltip>
  );
};

export default ForumMovieCard;
