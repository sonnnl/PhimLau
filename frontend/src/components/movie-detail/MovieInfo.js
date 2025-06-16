import React from "react";
import {
  Box,
  Flex,
  Image,
  Heading,
  Text,
  Tag,
  HStack,
  VStack,
  Icon,
  Button,
} from "@chakra-ui/react";
import { FaStar, FaRegStar, FaHeart, FaEye } from "react-icons/fa";
import { Link as RouterLink } from "react-router-dom";
import Rating from "react-rating";

// Component để hiển thị một dòng thông tin
const InfoRow = ({ label, children, isLink = false }) => (
  <Flex as="p" wrap="wrap">
    <Text as="span" fontWeight="bold" mr={2} color="whiteAlpha.800">
      {label}:
    </Text>
    {isLink ? (
      <HStack spacing={2} wrap="wrap">
        {children}
      </HStack>
    ) : (
      <Text as="span" color="whiteAlpha.700">
        {children}
      </Text>
    )}
  </Flex>
);

const MovieInfo = ({
  movie,
  movieMetadata,
  isFavorited,
  isFavoriteLoading,
  onToggleFavorite,
}) => {
  if (!movie) return null;

  return (
    <Flex direction={{ base: "column", md: "row" }} gap={8}>
      {/* Poster */}
      <Box flex="0 0 200px" alignSelf={{ base: "center", md: "flex-start" }}>
        <Image
          src={movie.poster_url || movie.thumb_url}
          alt={`Poster of ${movie.name}`}
          borderRadius="lg"
          boxShadow="lg"
          w="full"
          objectFit="cover"
        />
      </Box>

      {/* Movie Details */}
      <VStack align="start" spacing={4} flex={1}>
        <InfoRow label="Tên khác">{movie.origin_name}</InfoRow>
        <InfoRow label="Năm">{movie.year}</InfoRow>
        <InfoRow label="Trạng thái">{movie.episode_current}</InfoRow>
        {movieMetadata?.appTotalViews > 0 && (
          <InfoRow label="Lượt xem">
            <HStack spacing={1}>
              <Icon as={FaEye} color="whiteAlpha.700" />
              <Text>
                {new Intl.NumberFormat().format(movieMetadata.appTotalViews)}
              </Text>
            </HStack>
          </InfoRow>
        )}
        <InfoRow label="Thời lượng">{movie.time}</InfoRow>
        <InfoRow label="Đạo diễn" isLink>
          {movie.director?.map((d, index) => (
            <Tag
              key={`${d}-${index}`}
              size="sm"
              variant="outline"
              colorScheme="cyan"
            >
              {d}
            </Tag>
          ))}
        </InfoRow>
        <InfoRow label="Diễn viên" isLink>
          {movie.actor?.map((a, index) => (
            <Tag
              key={`${a}-${index}`}
              size="sm"
              variant="outline"
              colorScheme="purple"
            >
              {a}
            </Tag>
          ))}
        </InfoRow>
        <InfoRow label="Thể loại" isLink>
          {movie.category?.map((cat) => (
            <Tag
              as={RouterLink}
              to={`/genres/${cat.slug}`}
              key={cat.slug}
              size="sm"
              variant="solid"
              colorScheme="orange"
              _hover={{ bg: "orange.600" }}
            >
              {cat.name}
            </Tag>
          ))}
        </InfoRow>
        <InfoRow label="Quốc gia" isLink>
          {movie.country?.map((c) => (
            <Tag
              as={RouterLink}
              to={`/countries/${c.slug}`}
              key={c.slug}
              size="sm"
              variant="solid"
              colorScheme="teal"
              _hover={{ bg: "teal.600" }}
            >
              {c.name}
            </Tag>
          ))}
        </InfoRow>

        {/* Rating and Favorite Button */}
        <HStack spacing={4} mt={4} w="full">
          {movieMetadata && (
            <HStack spacing={1} align="center">
              <Rating
                initialRating={movieMetadata.appAverageRating || 0}
                readonly
                emptySymbol={<Icon as={FaRegStar} color="gray.400" />}
                fullSymbol={<Icon as={FaStar} color="yellow.400" />}
              />
              <Text fontSize="sm" color="gray.400" ml={2}>
                ({movieMetadata.appRatingCount || 0} đánh giá)
              </Text>
            </HStack>
          )}
          <Button
            leftIcon={<FaHeart />}
            colorScheme={isFavorited ? "pink" : "gray"}
            variant={isFavorited ? "solid" : "outline"}
            isLoading={isFavoriteLoading}
            onClick={onToggleFavorite}
          >
            {isFavorited ? "Đã yêu thích" : "Thêm vào yêu thích"}
          </Button>
        </HStack>
      </VStack>
    </Flex>
  );
};

export default MovieInfo;
