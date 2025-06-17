import React from "react";
import {
  Box,
  VStack,
  HStack,
  Icon,
  Text,
  Select,
  Button,
  Heading,
} from "@chakra-ui/react";
import { FaServer } from "react-icons/fa";

const EpisodeList = ({
  availableServers,
  selectedServerIndex,
  currentEpisode,
  handleServerChange,
  handleEpisodeSelect,
  watchedEpisodes,
}) => {
  const currentServerEpisodes =
    availableServers[selectedServerIndex]?.server_data || [];

  return (
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
      {/* Server Selector */}
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

      {/* Episode List Header */}
      <Heading
        size="md"
        mb={3}
        color={availableServers.length > 1 ? "whiteAlpha.800" : "brand.accent"}
      >
        {availableServers.length > 1
          ? `Danh Sách Tập (${
              availableServers[selectedServerIndex]?.server_name || "Server"
            })`
          : "Danh Sách Tập"}
      </Heading>

      {/* Episodes */}
      {currentServerEpisodes.length > 0 ? (
        <VStack spacing={2} align="stretch">
          {currentServerEpisodes.map((ep, idx) => {
            const isActive =
              currentEpisode?.slug === ep.slug &&
              currentEpisode?.name === ep.name;
            const isWatched = watchedEpisodes?.has(ep.slug);

            // Xác định style cho button
            let buttonVariant = "outline";
            let buttonColorScheme = "gray";
            let fontWeight = "normal";

            if (isActive) {
              buttonVariant = "solid";
              buttonColorScheme = "orange";
              fontWeight = "bold";
            } else if (isWatched) {
              buttonVariant = "solid"; // Hiển thị 'solid' cho tập đã xem
              buttonColorScheme = "gray"; // Màu 'gray' để phân biệt với tập đang active
              fontWeight = "bold"; // Tô đậm chữ
            }

            return (
              <Button
                key={ep.slug || `${ep.name}-${idx}`}
                onClick={() => handleEpisodeSelect(ep)}
                variant={buttonVariant}
                colorScheme={buttonColorScheme}
                fontWeight={fontWeight} // Áp dụng fontWeight
                justifyContent="flex-start"
                isFullWidth
                size="sm"
                textAlign="left"
                whiteSpace="normal"
                height="auto"
                py={2}
                opacity={isActive ? 1 : isWatched ? 0.7 : 1} // Giảm độ mờ cho tập đã xem
                _hover={{
                  bg: isActive ? "orange.600" : "brand.800",
                  borderColor: isActive ? "orange.600" : "brand.accent",
                }}
              >
                {ep.name}
              </Button>
            );
          })}
        </VStack>
      ) : (
        <Text color="text.disabled" textAlign="center" mt={4}>
          Server này hiện chưa có tập nào.
        </Text>
      )}
    </Box>
  );
};

export default EpisodeList;
