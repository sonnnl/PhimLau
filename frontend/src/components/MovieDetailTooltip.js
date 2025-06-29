import React from "react";
import {
  Box,
  Text,
  Heading,
  VStack,
  HStack,
  Icon,
  Flex,
} from "@chakra-ui/react";
import {
  FiClock,
  FiGlobe,
  FiTag,
  FiVideo,
  FiUsers,
  FiUserCheck,
  FiEye,
  FiHeart,
} from "react-icons/fi";
import { StarIcon } from "@chakra-ui/icons";

const MovieDetailTooltip = ({ movie }) => {
  if (!movie) {
    return null;
  }

  const renderList = (items, label, icon) => {
    if (!items || items.length === 0) return null;
    let displayItems = [];
    if (Array.isArray(items)) {
      displayItems = items.map((item) => {
        if (typeof item === "object" && item !== null) {
          return item.name || JSON.stringify(item);
        }
        return String(item);
      });
    } else if (typeof items === "string") {
      displayItems = items.split(",").map((s) => s.trim());
    } else if (items) {
      displayItems = [String(items)];
    }
    if (displayItems.length === 0) return null;
    return (
      <HStack align="start" spacing={1.5}>
        {icon && <Icon as={icon} mt={0.5} color="gray.500" boxSize={3.5} />}
        <Text
          fontSize="xs"
          fontWeight="semibold"
          color="gray.600"
          whiteSpace="nowrap"
        >
          {label}:
        </Text>
        <Text
          fontSize="xs"
          color="gray.800"
          flex={1}
          noOfLines={2}
          title={displayItems.join(", ")}
        >
          {displayItems.join(", ")}
        </Text>
      </HStack>
    );
  };

  const renderSimpleInfo = (data, label, icon) => {
    if (data === null || data === undefined || data === "") return null;
    return (
      <HStack spacing={1.5} align="center">
        {icon && <Icon as={icon} color="gray.500" boxSize={3.5} />}
        <Text
          fontSize="xs"
          fontWeight="semibold"
          color="gray.600"
          whiteSpace="nowrap"
        >
          {label}:
        </Text>
        <Text fontSize="xs" color="gray.800" noOfLines={1} title={String(data)}>
          {String(data)}
        </Text>
      </HStack>
    );
  };

  const categories = movie.category
    ? Array.isArray(movie.category)
      ? movie.category.map((cat) => cat.name || cat)
      : [movie.category]
    : [];
  const directors = movie.director
    ? Array.isArray(movie.director)
      ? movie.director.map((d) => d.name || d)
      : String(movie.director).split(",")
    : [];
  const actors = movie.actor
    ? Array.isArray(movie.actor)
      ? movie.actor.map((a) => a.name || a)
      : String(movie.actor).split(",")
    : [];

  const avgRating = movie.movieMetadata?.appAverageRating;
  const ratingCount = movie.movieMetadata?.appRatingCount || 0;
  const totalViews = movie.movieMetadata?.appTotalViews || 0;
  const totalFavorites = movie.movieMetadata?.appTotalFavorites || 0;

  return (
    <Box maxWidth="380px" minWidth="320px" p={4}>
      <VStack spacing={2} align="stretch">
        <Heading
          size="sm"
          color="brand.accent"
          noOfLines={3}
          title={movie.name}
        >
          {movie.name || "Tên phim không xác định"}
        </Heading>
        {movie.origin_name && movie.origin_name !== movie.name && (
          <Text
            fontSize="xs"
            color="gray.500"
            fontStyle="italic"
            noOfLines={2}
            title={movie.origin_name}
          >
            {movie.origin_name}
          </Text>
        )}

        <HStack spacing={4} my={1.5} flexWrap="wrap">
          {ratingCount > 0 && (
            <Flex align="center" title={`${ratingCount} lượt đánh giá`}>
              <Icon as={StarIcon} color="yellow.400" boxSize={3.5} mr={1.5} />
              <Text fontSize="sm" fontWeight="bold" color="gray.700">
                {avgRating ? avgRating.toFixed(1) : "N/A"}
              </Text>
            </Flex>
          )}
          {totalViews > 0 && (
            <Flex
              align="center"
              title={`${totalViews.toLocaleString("vi-VN")} lượt xem`}
            >
              <Icon as={FiEye} color="blue.500" boxSize={3.5} mr={1.5} />
              <Text fontSize="sm" fontWeight="bold" color="gray.700">
                {totalViews.toLocaleString("vi-VN")}
              </Text>
            </Flex>
          )}
          {totalFavorites > 0 && (
            <Flex
              align="center"
              title={`${totalFavorites.toLocaleString("vi-VN")} lượt yêu thích`}
            >
              <Icon as={FiHeart} color="red.500" boxSize={3.5} mr={1.5} />
              <Text fontSize="sm" fontWeight="bold" color="gray.700">
                {totalFavorites.toLocaleString("vi-VN")}
              </Text>
            </Flex>
          )}
        </HStack>
        {ratingCount === 0 && totalViews === 0 && (
          <Text fontSize="xs" color="gray.500" fontStyle="italic" my={1.5}>
            Chưa có số liệu thống kê.
          </Text>
        )}

        <VStack spacing={1} align="stretch" mt={1}>
          {renderSimpleInfo(movie.year, "Năm", FiTag)}
          {renderSimpleInfo(
            movie.time ? movie.time.replace(/\s*phút/i, "") : null,
            "Thời lượng",
            FiClock
          )}
          {renderList(movie.country, "Quốc gia", FiGlobe)}
          {renderList(categories, "Thể loại", FiTag)}
          {renderSimpleInfo(movie.quality, "Chất lượng", FiVideo)}
          {renderSimpleInfo(movie.lang, "Ngôn ngữ/Phụ đề", FiVideo)}
          {movie.episode_current &&
            renderSimpleInfo(
              `${movie.episode_current}${
                movie.episode_total ? `/${movie.episode_total}` : ""
              }`,
              "Tập phim",
              FiVideo
            )}
          {renderList(directors, "Đạo diễn", FiUserCheck)}
          {renderList(actors, "Diễn viên", FiUsers)}
        </VStack>

        {movie.content && (
          <Box mt={2} pt={2} borderTopWidth="1px" borderColor="gray.200">
            <Text fontSize="xs" fontWeight="semibold" color="gray.600" mb={0.5}>
              Mô tả:
            </Text>
            <Text
              fontSize="xs"
              color="gray.700"
              noOfLines={3}
              overflow="hidden"
              textOverflow="ellipsis"
              dangerouslySetInnerHTML={{
                __html: movie.content
                  .replace(/<p><br><\/p>/g, "")
                  .replace(/<br>/g, " "),
              }}
              title={movie.content.replace(/<[^>]+>/g, "")}
            />
          </Box>
        )}
      </VStack>
    </Box>
  );
};

export default MovieDetailTooltip;
