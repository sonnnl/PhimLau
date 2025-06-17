import { Box, Text, Container, Link as ChakraLink } from "@chakra-ui/react";

export default function Footer() {
  return (
    <Box bg="background.secondary" color="text.secondary" py={6} mt={10}>
      <Container maxW="container.xl">
        <Text textAlign="center" fontSize="sm">
          &copy; {new Date().getFullYear()} PhimKhongMoi. No CopyRights.
        </Text>
        <Text textAlign="center" fontSize="xs" mt={1}>
          Thực hiện bởi sonnnl, lhthang PTITHCM
        </Text>
        <Text textAlign="center" fontSize="xs" mt={1}>
          Được lấy cảm hứng bởi nhiều web xem phim khác, dự án học thuật không
          vì mục đích khác. Nguồn phim từ kkphim.com
        </Text>
        {/* You can add more links or information here if needed */}
        {/* Example: <ChakraLink href="/about" fontSize="xs" mx={2}>About</ChakraLink> */}
      </Container>
    </Box>
  );
}
