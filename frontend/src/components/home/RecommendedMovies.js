import React, { useState, useEffect, useContext } from "react";
import { Box, Heading, Center, Spinner, Text } from "@chakra-ui/react";
import recommendationService from "../../services/recommendationService";
import MovieSlider from "../MovieSlider";
import { AuthContext } from "../../contexts/AuthContext";

const RecommendedMovies = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      setRecommendations([]);
      return;
    }

    const fetchRecommendations = async () => {
      setLoading(true);
      try {
        const data = await recommendationService.getRecommendedMovies();
        if (data?.recommendations?.length > 0) {
          setRecommendations(data.recommendations);
          setMessage("");
        } else {
          setRecommendations([]);
          setMessage(data.message || "Hiện tại chưa có gợi ý nào cho bạn.");
        }
      } catch (error) {
        console.error("Failed to load recommendations:", error);
        setRecommendations([]);
        setMessage("Lỗi khi tải phim gợi ý.");
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [user]);

  if (!user) {
    return null;
  }

  return (
    <Box>
      <Heading
        as="h2"
        size="lg"
        color="whiteAlpha.900"
        fontWeight="bold"
        mb={4}
      >
        Gợi Ý Cho Bạn
      </Heading>
      {loading ? (
        <Center h="300px">
          <Spinner size="xl" color="brand.accent" />
        </Center>
      ) : recommendations.length > 0 ? (
        <MovieSlider movies={recommendations} />
      ) : (
        <Center h="150px">
          <Text color="gray.500">{message}</Text>
        </Center>
      )}
    </Box>
  );
};

export default RecommendedMovies;
