import { Box, Flex, Container } from "@chakra-ui/react";
import Header from "./Header"; // Giả định Header.js nằm cùng thư mục
import Footer from "./Footer"; // Giả định Footer.js nằm cùng thư mục

export default function MainLayout({ children }) {
  return (
    <Flex direction="column" minH="100vh">
      <Header />
      <Box as="main" flex={1} py={{ base: 4, md: 8 }}>
        {/* Container maxW đã được loại bỏ ở đây vì các trang con sẽ tự quản lý Container */}
        {children}
      </Box>
      <Footer />
    </Flex>
  );
}
