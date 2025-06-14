import React from "react";
import { HStack, Button, Text, Icon, Box, Flex } from "@chakra-ui/react";
import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  isLoading = false,
  showFirstLast = false,
  maxButtons = 5,
  size = "md",
}) => {
  if (totalPages <= 1) return null;

  // Calculate which page numbers to show
  const getPageNumbers = () => {
    const pages = [];
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);

    // Adjust start page if we're near the end
    if (endPage - startPage < maxButtons - 1) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();
  const hasPrevious = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <Flex justify="center" align="center" mt={6} gap={2} flexWrap="wrap">
      {/* First page button */}
      {showFirstLast && currentPage > 3 && (
        <>
          <Button
            size={size}
            onClick={() => onPageChange(1)}
            isDisabled={isLoading}
            variant="outline"
            colorScheme="orange"
          >
            1
          </Button>
          {currentPage > 4 && (
            <Text color="gray.500" px={1}>
              ...
            </Text>
          )}
        </>
      )}

      {/* Previous button */}
      <Button
        size={size}
        onClick={() => onPageChange(currentPage - 1)}
        isDisabled={!hasPrevious || isLoading}
        variant="outline"
        colorScheme="orange"
        leftIcon={<ChevronLeftIcon />}
      >
        Trước
      </Button>

      {/* Page number buttons */}
      <HStack spacing={1}>
        {pageNumbers.map((number) => (
          <Button
            key={`page-${number}`}
            size={size}
            onClick={() => onPageChange(number)}
            isActive={currentPage === number}
            variant={currentPage === number ? "solid" : "outline"}
            colorScheme="orange"
            isDisabled={isLoading}
            minW="40px"
          >
            {number}
          </Button>
        ))}
      </HStack>

      {/* Next button */}
      <Button
        size={size}
        onClick={() => onPageChange(currentPage + 1)}
        isDisabled={!hasNext || isLoading}
        variant="outline"
        colorScheme="orange"
        rightIcon={<ChevronRightIcon />}
      >
        Sau
      </Button>

      {/* Last page button */}
      {showFirstLast && currentPage < totalPages - 2 && (
        <>
          {currentPage < totalPages - 3 && (
            <Text color="gray.500" px={1}>
              ...
            </Text>
          )}
          <Button
            size={size}
            onClick={() => onPageChange(totalPages)}
            isDisabled={isLoading}
            variant="outline"
            colorScheme="orange"
          >
            {totalPages}
          </Button>
        </>
      )}
    </Flex>
  );
};

// Simple pagination info component
export const PaginationInfo = ({
  currentPage,
  totalPages,
  totalItems = null,
  itemsPerPage = null,
}) => {
  if (totalPages <= 1) return null;

  const startItem =
    totalItems && itemsPerPage ? (currentPage - 1) * itemsPerPage + 1 : null;
  const endItem =
    totalItems && itemsPerPage
      ? Math.min(currentPage * itemsPerPage, totalItems)
      : null;

  return (
    <Box textAlign="center" mt={2}>
      <Text fontSize="sm" color="gray.400">
        Trang {currentPage} / {totalPages}
        {totalItems && itemsPerPage && (
          <>
            {" "}
            • Hiển thị {startItem}-{endItem} / {totalItems} kết quả
          </>
        )}
      </Text>
    </Box>
  );
};

export default Pagination;
