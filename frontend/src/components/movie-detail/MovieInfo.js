import React from "react";
import {
  Box,
  SimpleGrid,
  HStack,
  VStack,
  Icon,
  Text,
  Tag,
  Heading,
} from "@chakra-ui/react";
import {
  FaCalendarAlt,
  FaClock,
  FaGlobe,
  FaVideo,
  FaFilm,
  FaTags,
  FaUserFriends,
} from "react-icons/fa";

const MovieInfo = ({ movie }) => {
  if (!movie) return null;

  return (
    <VStack align="start" spacing={6}>
      {/* Basic Info Grid */}
      <SimpleGrid
        columns={{ base: 1, md: 2 }}
        spacingX={8}
        spacingY={{ base: 3, md: 4 }}
        w="full"
      >
        <HStack>
          <Icon as={FaCalendarAlt} color="brand.accent" mr={2} />
          <Text>
            <strong>Năm:</strong> {movie.year || "N/A"}
          </Text>
        </HStack>

        <HStack>
          <Icon as={FaClock} color="brand.accent" mr={2} />
          <Text>
            <strong>Thời lượng:</strong> {movie.time || "N/A"}
          </Text>
        </HStack>

        <HStack>
          <Icon as={FaGlobe} color="brand.accent" mr={2} />
          <Text>
            <strong>Quốc gia:</strong>{" "}
            {movie.country?.map((c) => c.name).join(", ") || "N/A"}
          </Text>
        </HStack>

        <HStack>
          <Icon as={FaVideo} color="brand.accent" mr={2} />
          <Text>
            <strong>Chất lượng:</strong> {movie.quality || "N/A"}
          </Text>
        </HStack>

        <HStack>
          <Icon as={FaFilm} color="brand.accent" mr={2} />
          <Text>
            <strong>Ngôn ngữ:</strong> {movie.lang || "N/A"}
          </Text>
        </HStack>

        <HStack>
          <Icon as={FaTags} color="brand.accent" mr={2} />
          <Text>
            <strong>Trạng thái:</strong> {movie.episode_current || "N/A"}
          </Text>
        </HStack>

        {/* Director */}
        <Box gridColumn={{ base: "auto", md: "span 2" }}>
          <HStack mb={2}>
            <Icon as={FaUserFriends} color="brand.accent" mr={2} />
            <Text>
              <strong>Đạo diễn:</strong>
            </Text>
          </HStack>
          <Text ml={6} color="gray.300">
            {movie.director?.join(", ") || "N/A"}
          </Text>
        </Box>

        {/* Genre */}
        <Box gridColumn={{ base: "auto", md: "span 2" }}>
          <HStack mb={2}>
            <Icon as={FaTags} color="brand.accent" mr={2} />
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

        {/* Actors */}
        <Box gridColumn={{ base: "auto", md: "span 2" }}>
          <HStack mb={2}>
            <Icon as={FaUserFriends} color="brand.accent" mr={2} />
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
              <Text fontSize="sm" color="text.disabled">
                Không có thông tin.
              </Text>
            )}
          </HStack>
        </Box>
      </SimpleGrid>
    </VStack>
  );
};

export default MovieInfo;
