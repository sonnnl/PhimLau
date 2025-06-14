import React from "react";
import {
  Box,
  Heading,
  Center,
  Spinner,
  Text,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";
import MovieSlider from "../MovieSlider";

const FeaturedMoviesSlider = ({
  movies,
  loading,
  error,
  title = "Phim Mới Cập Nhật",
}) => {
  return (
    <Box>
      <Heading
        as="h1"
        size="xl"
        mb={6}
        color="brand.accent"
        fontWeight="bold"
        textAlign={{ base: "center", md: "left" }}
      >
        {title}
      </Heading>

      {loading && (
        <Center h="300px">
          <Spinner
            size="xl"
            color="brand.accent"
            thickness="4px"
            speed="0.65s"
          />
        </Center>
      )}

      {error && (
        <Center h="200px">
          <Alert
            status="error"
            variant="subtle"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            textAlign="center"
            height="200px"
            bg="red.50"
            color="red.800"
            rounded="md"
          >
            <AlertIcon boxSize="40px" mr={0} />
            <Text mt={2} fontWeight="semibold">
              Lỗi tải dữ liệu
            </Text>
            <Text fontSize="sm" mt={1}>
              {error}
            </Text>
          </Alert>
        </Center>
      )}

      {!loading && !error && (
        <>
          {movies && movies.length > 0 ? (
            <MovieSlider movies={movies} />
          ) : (
            <Center
              h="200px"
              bg="background.secondary"
              rounded="md"
              border="1px dashed"
              borderColor="gray.600"
            >
              <Text color="gray.500" fontSize="lg">
                Không có phim mới nào để hiển thị.
              </Text>
            </Center>
          )}
        </>
      )}
    </Box>
  );
};

export default FeaturedMoviesSlider;
