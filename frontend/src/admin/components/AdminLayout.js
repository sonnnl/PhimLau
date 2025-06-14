import React from "react";
import {
  Box,
  Container,
  VStack,
  HStack,
  Heading,
  Text,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  useColorModeValue,
  Divider,
} from "@chakra-ui/react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { FiHome, FiChevronRight } from "react-icons/fi";

const AdminLayout = ({ children, title, description, breadcrumbs = [] }) => {
  const location = useLocation();
  const bgColor = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");

  const defaultBreadcrumbs = [
    { label: "Dashboard", href: "/admin", icon: FiHome },
    ...breadcrumbs,
  ];

  return (
    <Box minH="100vh" bg={bgColor}>
      <Container maxW="1400px" p={6}>
        <VStack spacing={6} align="stretch">
          {/* Header with Breadcrumbs */}
          <Box bg={cardBg} p={6} borderRadius="lg" shadow="sm">
            <VStack align="start" spacing={3}>
              <Breadcrumb
                spacing="8px"
                separator={<FiChevronRight color="gray.500" />}
                fontSize="sm"
              >
                {defaultBreadcrumbs.map((crumb, index) => (
                  <BreadcrumbItem
                    key={index}
                    isCurrentPage={index === defaultBreadcrumbs.length - 1}
                  >
                    <BreadcrumbLink
                      as={RouterLink}
                      to={crumb.href}
                      color={
                        index === defaultBreadcrumbs.length - 1
                          ? "brand.accent"
                          : "gray.500"
                      }
                      fontWeight={
                        index === defaultBreadcrumbs.length - 1
                          ? "medium"
                          : "normal"
                      }
                    >
                      {crumb.label}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                ))}
              </Breadcrumb>

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
            </VStack>
          </Box>

          {/* Content */}
          <Box>{children}</Box>
        </VStack>
      </Container>
    </Box>
  );
};

export default AdminLayout;
