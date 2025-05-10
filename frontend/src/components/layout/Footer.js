import { Box, Text, Container, Link as ChakraLink } from "@chakra-ui/react";

export default function Footer() {
  return (
    <Box bg="background.secondary" color="text.secondary" py={6} mt={10}>
      <Container maxW="container.xl">
        <Text textAlign="center" fontSize="sm">
          &copy; {new Date().getFullYear()} MyMovieApp. All Rights Reserved.
        </Text>
        <Text textAlign="center" fontSize="xs" mt={1}>
          Inspired by various movie platforms. Data provided by external APIs.
        </Text>
        {/* You can add more links or information here if needed */}
        {/* Example: <ChakraLink href="/about" fontSize="xs" mx={2}>About</ChakraLink> */}
      </Container>
    </Box>
  );
}
