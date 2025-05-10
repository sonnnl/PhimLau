import {
  Box,
  Flex,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Link as ChakraLink,
  Image,
  useDisclosure,
  Stack,
  Container,
  Heading,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Avatar,
  Text,
} from "@chakra-ui/react";
import { HamburgerIcon, CloseIcon, SearchIcon } from "@chakra-ui/icons";
import { Link as RouterLink, useNavigate, useLocation } from "react-router-dom";
import React, { useContext, useState } from "react";
import { AuthContext } from "../../contexts/AuthContext";

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
  { name: "Thể Loại", path: "/genres" },
  { name: "Diễn Đàn", path: "/forum" },
];

export default function Header() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isAuthenticated, user, logout, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

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
            >
              {NavLinks.map((link) => (
                <NavLink key={link.name} to={link.path}>
                  {link.name}
                </NavLink>
              ))}
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
              <Menu>
                <MenuButton
                  as={Button}
                  rounded={"full"}
                  variant={"link"}
                  cursor={"pointer"}
                  minW={0}
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
                  />
                </MenuButton>
                <MenuList bg="background.card" borderColor="brand.700">
                  <MenuItem
                    bg="background.card"
                    _hover={{ bg: "brand.800", color: "brand.accent" }}
                    as={RouterLink}
                    to="/profile"
                  >
                    Trang Cá Nhân
                  </MenuItem>
                  <MenuDivider borderColor="brand.700" />
                  <MenuItem
                    bg="background.card"
                    _hover={{ bg: "brand.800", color: "brand.accent" }}
                    onClick={handleLogout}
                  >
                    Đăng Xuất
                  </MenuItem>
                </MenuList>
              </Menu>
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
            </Stack>
          </Box>
        ) : null}
      </Container>
    </Box>
  );
}
