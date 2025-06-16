import React from "react";
import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";

const AdminLayout = ({ children, title, description }) => {
  const bgColor = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");

  return (
    <Box minH="100vh" bg={bgColor}>
      <Container maxW="1400px" p={6}>
        <VStack spacing={6} align="stretch">
          {/* Header - chỉ hiển thị khi có title */}
          {title && (
            <Box bg={cardBg} p={6} borderRadius="lg" shadow="sm">
              <VStack align="start" spacing={2}>
                <Heading size="xl" color="brand.accent">
                  {title}
                </Heading>
                {description && (
                  <Text color="gray.500" fontSize="md">
                    {description}
                  </Text>
                )}
              </VStack>
            </Box>
          )}

          {/* Content */}
          <Box>{children}</Box>
        </VStack>
      </Container>
    </Box>
  );
};

export default AdminLayout;
