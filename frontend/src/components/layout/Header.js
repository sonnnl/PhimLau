import {
  Box,
  Flex,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Link as ChakraLink,
  useDisclosure,
  Stack,
  Container,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Avatar,
  Text,
  VStack,
  Badge,
  Heading,
} from "@chakra-ui/react";
import { HamburgerIcon, CloseIcon, SearchIcon } from "@chakra-ui/icons";
import { Link as RouterLink, useNavigate, useLocation } from "react-router-dom";
import React, { useContext, useState, useEffect, useRef } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import GenreDropdown from "../GenreDropdown";
import NotificationBell from "../notifications/NotificationBell";
import {
  FiSettings,
  FiLogOut,
  FiUser,
  FiHeart,
  FiClock,
  FiFileText,
} from "react-icons/fi";

// Thay thế bằng logo thực của bạn trong thư mục frontend/src/assets/logo.png
const Logo = () => (
  <RouterLink to="/">
    {/* <Image src="/assets/logo.png" alt="My Movie App Logo" h={{ base: "30px", md: "40px" }} /> */}
    <Heading size={{ base: "sm", md: "md" }} color="text.primary">
      MyMovieApp
    </Heading>
  </RouterLink>
);

const NavLink = ({ children, to }) => (
  <ChakraLink
    as={RouterLink}
    to={to}
    px={2}
    py={1}
    rounded={"md"}
    color="text.primary"
    _hover={{
      textDecoration: "none",
      bg: "brand.800",
      color: "brand.accent",
    }}
    _activeLink={{
      fontWeight: "bold",
      color: "brand.accent",
    }}
  >
    {children}
  </ChakraLink>
);

const NavLinks = [
  { name: "Trang Chủ", path: "/" },
  { name: "Phim Mới", path: "/movies/latest" },
  { name: "Phim Lẻ", path: "/movies/single" },
  { name: "Phim Bộ", path: "/movies/series" },
  { name: "Diễn Đàn", path: "/forum" },
];

const menuItemStyles = {
  bg: "transparent",
  color: "text.secondary",
  borderRadius: "lg",
  py: 3,
  px: 4,
  fontSize: "sm",
  fontWeight: "medium",
  _hover: {
    bg: "brand.800",
    color: "brand.accent",
  },
};

export default function Header() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isAuthenticated, user, logout, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  // State cho profile dropdown hover
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const hoverTimeoutRef = useRef(null);

  // Tự động đóng dropdown khi route thay đổi
  useEffect(() => {
    onClose();
    setIsProfileDropdownOpen(false);
  }, [location.pathname, onClose]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?keyword=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery(""); // Optional: clear search input after submit
    }
  };

  // Xử lý hover cho profile dropdown
  const handleProfileMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setIsProfileDropdownOpen(true);
  };

  const handleProfileMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsProfileDropdownOpen(false);
    }, 300); // Delay 300ms trước khi đóng
  };

  const menuItemProps = {
    w: "full",
    variant: "ghost",
    justifyContent: "flex-start",
    bg: "transparent",
    _hover: { bg: "brand.700", color: "brand.accent" },
    py: 3,
    px: 4,
    fontSize: "sm",
    fontWeight: "medium",
    borderRadius: "lg",
    transition: "background-color 0.2s, color 0.2s",
  };

  return (
    <Box
      bg="background.secondary"
      px={4}
      shadow="md"
      position="sticky"
      top={0}
      zIndex="sticky"
    >
      <Container maxW="container.xl">
        <Flex h={16} alignItems={"center"} justifyContent={"space-between"}>
          <IconButton
            size={"md"}
            icon={isOpen ? <CloseIcon /> : <HamburgerIcon />}
            aria-label={"Open Menu"}
            display={{ md: "none" }}
            onClick={isOpen ? onClose : onOpen}
            variant="ghost"
            color="text.primary"
          />
          <HStack spacing={8} alignItems={"center"}>
            <Logo />
            <HStack
              as={"nav"}
              spacing={4}
              display={{ base: "none", md: "flex" }}
              alignItems="center"
            >
              {NavLinks.map((link) => (
                <NavLink key={link.name} to={link.path}>
                  {link.name}
                </NavLink>
              ))}
              <GenreDropdown currentGenreLabel="Thể Loại" />
            </HStack>
          </HStack>
          <Flex alignItems={"center"} gap={{ base: 2, md: 4 }}>
            <form onSubmit={handleSearchSubmit}>
              <InputGroup maxW={{ base: "120px", sm: "150px", md: "250px" }}>
                <InputLeftElement pointerEvents="none">
                  <SearchIcon color="gray.500" />
                </InputLeftElement>
                <Input
                  type="text"
                  placeholder="Tìm kiếm..."
                  borderRadius="md"
                  bg="brand.900"
                  borderColor="brand.700"
                  _placeholder={{ color: "text.disabled" }}
                  color="text.primary"
                  size="sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  _focus={{
                    borderColor: "brand.accent",
                    boxShadow: `0 0 0 1px var(--chakra-colors-brand-accent)`,
                  }}
                />
              </InputGroup>
            </form>

            {loading ? (
              <Text fontSize="sm" color="text.secondary">
                Loading...
              </Text>
            ) : isAuthenticated && user ? (
              <HStack spacing={2}>
                <NotificationBell />
                <Menu
                  isOpen={isProfileDropdownOpen}
                  onClose={() => setIsProfileDropdownOpen(false)}
                >
                  <MenuButton
                    as={Button}
                    rounded={"full"}
                    variant={"link"}
                    cursor={"pointer"}
                    minW={0}
                    p={0}
                    onMouseEnter={handleProfileMouseEnter}
                    onMouseLeave={handleProfileMouseLeave}
                    _hover={{
                      "& > div": {
                        borderColor: "white",
                        boxShadow: "0 0 12px rgba(255, 255, 255, 0.4)",
                      },
                    }}
                    sx={{
                      "& > div": {
                        transition:
                          "border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
                      },
                    }}
                  >
                    <Avatar
                      size={"sm"}
                      src={
                        user.avatarUrl ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          user.displayName || user.email
                        )}&background=random&color=fff&size=30`
                      }
                      name={user.displayName || user.email}
                      border="2px solid"
                      borderColor="brand.accent"
                    />
                  </MenuButton>

                  <MenuList
                    onMouseEnter={handleProfileMouseEnter}
                    onMouseLeave={handleProfileMouseLeave}
                    mt={2}
                    bg="background.card"
                    borderColor="brand.700"
                    border="1px solid"
                    borderRadius="xl"
                    boxShadow="2xl"
                    minW="280px"
                    py={4}
                    zIndex="dropdown"
                    overflow="hidden"
                  >
                    {/* User Info Header - Restored */}
                    <Box
                      px={6}
                      py={3}
                      mb={3}
                      bg="linear-gradient(135deg, var(--chakra-colors-brand-800), var(--chakra-colors-brand-900))"
                    >
                      <HStack spacing={4}>
                        <Avatar
                          size="md"
                          src={
                            user.avatarUrl ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              user.displayName || user.email
                            )}&background=random&color=fff&size=48`
                          }
                          name={user.displayName || user.email}
                          border="2px solid"
                          borderColor="brand.accent"
                        />
                        <VStack spacing={1} align="start" flex={1}>
                          <Text
                            fontWeight="bold"
                            color="white"
                            fontSize="md"
                            noOfLines={1}
                          >
                            {user.displayName || user.email}
                          </Text>
                          <Text fontSize="xs" color="gray.300" noOfLines={1}>
                            @{user.username || user.email.split("@")[0]}
                          </Text>
                          <HStack spacing={2} mt={1}>
                            <Badge
                              colorScheme={
                                user.role === "admin" ? "red" : "blue"
                              }
                              size="sm"
                              variant="solid"
                              fontSize="xs"
                            >
                              {user.role === "admin" ? "👑 Admin" : "👤 User"}
                            </Badge>
                            {user.isVerified && (
                              <Badge
                                colorScheme="green"
                                size="sm"
                                variant="solid"
                                fontSize="xs"
                              >
                                ✓ Verified
                              </Badge>
                            )}
                          </HStack>
                        </VStack>
                      </HStack>
                    </Box>

                    {/* Menu Items - Restored */}
                    <VStack spacing={1} px={2}>
                      <MenuItem
                        onClick={() => navigate("/profile")}
                        icon={<FiUser size="16px" />}
                        {...menuItemProps}
                      >
                        Trang Cá Nhân
                      </MenuItem>

                      <MenuItem
                        onClick={() => navigate("/my-favorites")}
                        icon={<FiHeart size="16px" />}
                        {...menuItemProps}
                      >
                        Phim yêu thích
                      </MenuItem>

                      <MenuItem
                        onClick={() => navigate("/history")}
                        icon={<FiClock size="16px" />}
                        {...menuItemProps}
                      >
                        Lịch sử xem
                      </MenuItem>

                      <MenuItem
                        onClick={() => navigate("/my-threads")}
                        icon={<FiFileText size="16px" />}
                        {...menuItemProps}
                      >
                        Bài viết của tôi
                      </MenuItem>

                      {user.role === "admin" && (
                        <>
                          <MenuDivider my={2} borderColor="brand.700" />
                          <MenuItem
                            onClick={() => navigate("/admin")}
                            icon={<FiSettings size="16px" />}
                            {...menuItemProps}
                            _hover={{ bg: "red.800", color: "red.300" }}
                            color="red.400"
                          >
                            Bảng điều khiển Admin
                          </MenuItem>
                        </>
                      )}

                      <MenuDivider my={2} borderColor="brand.700" />
                      <MenuItem
                        onClick={handleLogout}
                        icon={<FiLogOut size="16px" />}
                        {...menuItemProps}
                        _hover={{ bg: "red.800", color: "red.200" }}
                        color="red.300"
                      >
                        Đăng Xuất
                      </MenuItem>
                    </VStack>
                  </MenuList>
                </Menu>
              </HStack>
            ) : (
              <HStack spacing={{ base: 1, md: 2 }}>
                <Button
                  as={RouterLink}
                  to="/login"
                  variant="outline"
                  size="sm"
                  borderColor="brand.accent"
                  color="brand.accent"
                  _hover={{ bg: "brand.accent", color: "background.primary" }}
                >
                  Đăng Nhập
                </Button>
                <Button
                  as={RouterLink}
                  to="/register"
                  variant="solid"
                  colorScheme="orange"
                  size="sm"
                >
                  Đăng Ký
                </Button>
              </HStack>
            )}
          </Flex>
        </Flex>

        {isOpen ? (
          <Box pb={4} display={{ md: "none" }} mt={2}>
            <Stack as={"nav"} spacing={4}>
              {NavLinks.map((link) => (
                <NavLink key={link.name} to={link.path}>
                  {link.name}
                </NavLink>
              ))}
              <Box pl={2} py={1}>
                <GenreDropdown currentGenreLabel="Thể Loại" />
              </Box>
            </Stack>
          </Box>
        ) : null}
      </Container>
    </Box>
  );
}
