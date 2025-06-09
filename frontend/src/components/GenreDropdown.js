import React, { useState, useEffect, useRef } from "react";
import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
  Box,
  Text,
  Spinner,
  useDisclosure,
  SimpleGrid,
} from "@chakra-ui/react";
import { ChevronDownIcon } from "@chakra-ui/icons";
import axios from "axios";
import { Link as RouterLink, useNavigate } from "react-router-dom";
const BACKEND_API_URL =
  process.env.REACT_APP_BACKEND_API_URL || "http://localhost:5001";

const GenreDropdown = ({ currentGenreLabel = "Thể loại" }) => {
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const menuRef = useRef(null);

  useEffect(() => {
    const fetchGenres = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(
          `${BACKEND_API_URL}/api/movies/genres`
        );
        if (
          response.data &&
          response.data.success &&
          Array.isArray(response.data.genres)
        ) {
          setGenres(response.data.genres);
        } else {
          console.error(
            "API response for genres is not as expected:",
            response.data
          );
          setError("Lỗi tải thể loại (dữ liệu không đúng).");
          setGenres([]);
        }
      } catch (err) {
        console.error("Error fetching genres:", err);
        setError(
          err.response?.data?.message || err.message || "Lỗi kết nối máy chủ."
        );
        setGenres([]);
      } finally {
        setLoading(false);
      }
    };

    fetchGenres();
  }, []);

  const navigate = useNavigate();

  const handleGenreClick = (slug) => {
    if (slug) {
      navigate(`/genres/${slug}`);
    } else {
      navigate("/movies");
    }
    onClose();
  };

  let hoverTimeout;
  const handleMouseEnter = () => {
    clearTimeout(hoverTimeout);
    onOpen();
  };

  const handleMouseLeave = () => {
    hoverTimeout = setTimeout(() => {
      onClose();
    }, 200);
  };

  const itemsPerColumn = genres.length > 0 ? Math.ceil(genres.length / 3) : 1;

  return (
    <Box onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <Menu isOpen={isOpen} onClose={onClose} gutter={2} closeOnBlur={true}>
        <MenuButton
          as={Button}
          rightIcon={<ChevronDownIcon />}
          variant="ghost"
          color="gray.100"
          _hover={{ color: "orange.400", textDecoration: "none" }}
          _active={{ color: "orange.500" }}
          px={3}
          py={2}
          borderRadius="md"
        >
          {currentGenreLabel}
        </MenuButton>
        <MenuList
          bg="white"
          borderColor="gray.200"
          color="gray.800"
          boxShadow="xl"
          zIndex="dropdown"
          p={2}
          minW={{ base: "200px", md: "400px", lg: "550px" }}
        >
          {loading ? (
            <MenuItem
              isDisabled
              _hover={{ bg: "gray.100" }}
              bg="white"
              justifyContent="center"
              fontSize="sm"
            >
              <Spinner size="sm" mr={2} /> Đang tải...
            </MenuItem>
          ) : error ? (
            <MenuItem
              isDisabled
              color="red.500"
              _hover={{ bg: "gray.100" }}
              bg="white"
              justifyContent="center"
              fontSize="sm"
            >
              {error}
            </MenuItem>
          ) : genres.length === 0 ? (
            <MenuItem
              isDisabled
              _hover={{ bg: "gray.100" }}
              bg="white"
              justifyContent="center"
              fontSize="sm"
            >
              Không có thể loại
            </MenuItem>
          ) : (
            <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={2}>
              <MenuItem
                onClick={() => handleGenreClick("")}
                bg="white"
                color="orange.500"
                fontWeight="semibold"
                _hover={{ bg: "orange.50", color: "orange.600" }}
                borderRadius="md"
                justifyContent="center"
                fontSize="sm"
              >
                Tất cả Phim
              </MenuItem>
              {genres.map((genre) => (
                <MenuItem
                  key={genre.slug}
                  onClick={() => handleGenreClick(genre.slug)}
                  bg="white"
                  _hover={{ bg: "teal.50", color: "teal.700" }}
                  borderRadius="md"
                  justifyContent="center"
                  textAlign="center"
                  fontSize="sm"
                >
                  {genre.name}
                </MenuItem>
              ))}
            </SimpleGrid>
          )}
        </MenuList>
      </Menu>
    </Box>
  );
};

export default GenreDropdown;
