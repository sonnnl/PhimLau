import React, { useState, useEffect, useRef } from "react";
import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
  Box,
  Spinner,
  SimpleGrid,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { ChevronDownIcon } from "@chakra-ui/icons";
import { useNavigate } from "react-router-dom";
import movieService from "../services/movieService";

const GenreDropdown = ({ currentGenreLabel = "Thể Loại" }) => {
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Sử dụng state và ref để quản lý hover tốt hơn
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const hoverTimeoutRef = useRef(null);

  useEffect(() => {
    const fetchGenres = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await movieService.getMovieGenres();
        if (data && data.success && Array.isArray(data.items)) {
          setGenres(data.items);
        } else {
          setError("Lỗi tải thể loại (dữ liệu không đúng).");
          setGenres([]);
        }
      } catch (err) {
        setError(err.message || "Lỗi kết nối máy chủ.");
        setGenres([]);
      } finally {
        setLoading(false);
      }
    };

    fetchGenres();
  }, []);

  const handleGenreClick = (slug) => {
    navigate(slug ? `/genres/${slug}` : "/movies/latest");
    setIsMenuOpen(false);
  };

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setIsMenuOpen(true);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsMenuOpen(false);
    }, 200); // Thêm một khoảng trễ nhỏ
  };

  const menuItemStyle = {
    bg: "transparent",
    color: "text.primary",
    _hover: { bg: "brand.800", color: "brand.accent" },
    borderRadius: "md",
    fontSize: "sm",
    textAlign: "center",
    justifyContent: "center",
    w: "full",
    fontWeight: "medium",
  };

  return (
    <Box onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <Menu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        gutter={4}
        closeOnBlur={true}
      >
        <MenuButton
          as={Button}
          rightIcon={<ChevronDownIcon />}
          variant="ghost"
          color="text.primary"
          _hover={{
            bg: "brand.800",
            color: "brand.accent",
          }}
          _active={{
            bg: "brand.700",
            color: "brand.accent",
          }}
          px={3}
          py={2}
          borderRadius="md"
        >
          {currentGenreLabel}
        </MenuButton>
        <MenuList
          bg="background.card"
          borderColor="brand.700"
          borderWidth="1px"
          boxShadow="2xl"
          zIndex="dropdown"
          p={3}
          minW={{ base: "250px", md: "450px", lg: "600px" }}
          maxH="70vh"
          overflowY="auto"
          css={{
            "&::-webkit-scrollbar": {
              width: "4px",
            },
            "&::-webkit-scrollbar-track": {
              width: "6px",
            },
            "&::-webkit-scrollbar-thumb": {
              background: "var(--chakra-colors-brand-600)",
              borderRadius: "24px",
            },
          }}
        >
          {loading ? (
            <MenuItem isDisabled {...menuItemStyle}>
              <Spinner size="sm" mr={2} /> Đang tải...
            </MenuItem>
          ) : error ? (
            <MenuItem isDisabled color="red.400" {...menuItemStyle}>
              <Text>{error}</Text>
            </MenuItem>
          ) : genres.length === 0 ? (
            <MenuItem isDisabled {...menuItemStyle}>
              Không có thể loại nào
            </MenuItem>
          ) : (
            <SimpleGrid columns={{ base: 2, sm: 3, md: 4 }} spacing={2}>
              <MenuItem
                onClick={() => handleGenreClick("")}
                color="brand.accent"
                fontWeight="bold"
                {...menuItemStyle}
              >
                Tất cả Phim
              </MenuItem>
              {genres.map((genre) => (
                <MenuItem
                  key={genre.slug}
                  onClick={() => handleGenreClick(genre.slug)}
                  {...menuItemStyle}
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
