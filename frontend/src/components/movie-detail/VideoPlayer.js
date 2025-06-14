import React from "react";
import { Box, AspectRatio, Center, VStack, Icon, Text } from "@chakra-ui/react";
import { FaPlayCircle } from "react-icons/fa";

const VideoPlayer = ({
  currentEpisode,
  movie,
  availableServers,
  playerRef,
}) => {
  if (currentEpisode && currentEpisode.link_embed) {
    return (
      <AspectRatio
        ratio={16 / 9}
        mb={4}
        shadow="xl"
        rounded="md"
        overflow="hidden"
        bg="black"
        ref={playerRef}
      >
        <iframe
          title={currentEpisode.name || movie.name}
          src={currentEpisode.link_embed}
          allowFullScreen
          style={{ border: 0 }}
        />
      </AspectRatio>
    );
  }

  return (
    <Center
      h={{ base: "250px", md: "400px" }}
      bg="background.secondary"
      rounded="md"
      shadow="md"
      mb={4}
      ref={playerRef}
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
  );
};

export default VideoPlayer;
