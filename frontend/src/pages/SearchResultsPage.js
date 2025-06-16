import React, { useState, useEffect, useCallback } from "react";
import {
  useSearchParams,
  useNavigate,
  Link as RouterLink,
} from "react-router-dom";
import {
  Container,
  Heading,
  Text,
  Spinner,
  Center,
  SimpleGrid,
  Box,
  Button,
  HStack,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Icon,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Flex,
  Wrap,
  WrapItem,
  Tag,
  TagLabel,
  TagCloseButton,
} from "@chakra-ui/react";
import { ChevronRightIcon, SearchIcon } from "@chakra-ui/icons";
import { FaSearch, FaFilter } from "react-icons/fa";
import movieService from "../services/movieService";
import MovieCard from "../components/MovieCard";
import CustomSelect from "../components/common/CustomSelect";

const MOVIES_PER_PAGE = 18;

const SORT_OPTIONS = [
  { value: "default", label: "Mặc định" },
  { value: "year_desc", label: "Năm sản xuất: Mới nhất" },
  { value: "year_asc", label: "Năm sản xuất: Cũ nhất" },
];

const SearchResultsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // State cho dữ liệu từ API (phim, phân trang, bộ lọc)
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [genres, setGenres] = useState([]);
  const [countries, setCountries] = useState([]);

  // State cho các giá trị bộ lọc hiện tại trên UI
  const [filters, setFilters] = useState({
    category: searchParams.get("category") || "",
    country: searchParams.get("country") || "",
    year: searchParams.get("year") || "",
    sort: searchParams.get("sort") || "default",
  });

  // Lấy keyword và page từ URL
  const keyword = searchParams.get("keyword") || "";
  const currentPage = parseInt(searchParams.get("page") || "1", 10);

  // Lấy danh sách thể loại và quốc gia cho bộ lọc
  useEffect(() => {
    const fetchFilterData = async () => {
      try {
        const [genresData, countriesData] = await Promise.all([
          movieService.getMovieGenres(),
          movieService.getMovieCountries(),
        ]);
        setGenres(genresData.items || []);
        setCountries(countriesData.items || []);
      } catch (err) {
        console.error("Failed to fetch filter data:", err);
        // Có thể hiển thị một thông báo lỗi nhỏ nếu cần
      }
    };
    fetchFilterData();
  }, []);

  // Hàm tìm kiếm chính, được gọi khi có thay đổi
  const fetchSearchResults = useCallback(async () => {
    // Chỉ tìm kiếm khi có ít nhất một tham số
    if (!keyword && !filters.category && !filters.country && !filters.year) {
      setSearchResults([]);
      setPagination(null);
      setError("Vui lòng nhập từ khóa hoặc chọn bộ lọc để tìm kiếm.");
      return;
    }

    setLoading(true);
    setError(null);

    // Tập hợp tất cả các tham số để gửi đi
    const searchOptions = {
      keyword,
      page: currentPage,
      limit: MOVIES_PER_PAGE,
      category: filters.category,
      country: filters.country,
      year: filters.year,
    };

    // Xử lý tham số sort
    if (filters.sort) {
      if (filters.sort === "year_desc") {
        searchOptions.sort_field = "year";
        searchOptions.sort_type = "desc";
      } else if (filters.sort === "year_asc") {
        searchOptions.sort_field = "year";
        searchOptions.sort_type = "asc";
      }
      // "default" không cần thêm gì, API sẽ tự xử lý
    }

    try {
      const data = await movieService.searchMovies(searchOptions);
      setSearchResults(data.items || []);
      setPagination(data.pagination || null);
      if (!data.items || data.items.length === 0) {
        setError("Không tìm thấy kết quả nào phù hợp với tiêu chí của bạn.");
      }
    } catch (err) {
      console.error("Error during search:", err);
      setError(err.message || "Lỗi khi tìm kiếm phim.");
      setSearchResults([]);
      setPagination(null);
    }
    setLoading(false);
  }, [keyword, currentPage, filters]);

  // Trigger tìm kiếm khi các tham số thay đổi
  useEffect(() => {
    fetchSearchResults();
  }, [fetchSearchResults]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = () => {
    // Tạo object params mới, chỉ bao gồm các giá trị có thật
    const newParams = { page: "1" }; // Reset về trang 1 khi áp dụng bộ lọc mới
    if (keyword) newParams.keyword = keyword;
    if (filters.category) newParams.category = filters.category;
    if (filters.country) newParams.country = filters.country;
    if (filters.year) newParams.year = filters.year;
    if (filters.sort && filters.sort !== "default") {
      newParams.sort = filters.sort;
    }
    setSearchParams(newParams);
  };

  const handlePageChange = (newPage) => {
    if (newPage > 0 && (!pagination || newPage <= pagination.totalPages)) {
      const currentParams = Object.fromEntries(searchParams.entries());
      setSearchParams({ ...currentParams, page: newPage.toString() });
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const removeFilter = (key) => {
    // Khi xóa sort, set nó về 'default' thay vì rỗng
    const newFilters = { ...filters, [key]: key === "sort" ? "default" : "" };
    setFilters(newFilters);

    const newParams = { page: "1" };
    if (keyword) newParams.keyword = keyword;
    if (newFilters.category) newParams.category = newFilters.category;
    if (newFilters.country) newParams.country = newFilters.country;
    if (newFilters.year) newParams.year = newFilters.year;
    if (newFilters.sort && newFilters.sort !== "default") {
      newParams.sort = newFilters.sort;
    }
    setSearchParams(newParams);
  };

  // Hiển thị các bộ lọc đang được áp dụng
  const AppliedFilters = () => {
    // Lọc ra các filter thực sự có giá trị để hiển thị
    const activeFilters = Object.entries(filters).filter(([key, value]) => {
      if (!value) return false; // Bỏ qua các giá trị rỗng
      if (key === "sort" && value === "default") return false; // Bỏ qua sort mặc định
      return true;
    });

    if (activeFilters.length === 0) return null;

    return (
      <Wrap spacing={2} mb={6}>
        {activeFilters.map(([key, value]) => {
          let label = "";
          if (key === "category") {
            label = `Thể loại: ${
              genres.find((g) => g.slug === value)?.name || value
            }`;
          } else if (key === "country") {
            label = `Quốc gia: ${
              countries.find((c) => c.slug === value)?.name || value
            }`;
          } else if (key === "year") {
            label = `Năm: ${value}`;
          } else if (key === "sort") {
            if (value === "year_desc") label = "Sắp xếp: Năm mới nhất";
            if (value === "year_asc") label = "Sắp xếp: Năm cũ nhất";
          }

          if (!label) return null;

          return (
            <WrapItem key={key}>
              <Tag
                size="lg"
                borderRadius="full"
                variant="solid"
                colorScheme="orange"
              >
                <TagLabel>{label}</TagLabel>
                <TagCloseButton onClick={() => removeFilter(key)} />
              </Tag>
            </WrapItem>
          );
        })}
      </Wrap>
    );
  };

  return (
    <Container maxW="container.xl" py={8}>
      <Breadcrumb
        spacing="8px"
        separator={<ChevronRightIcon color="gray.500" />}
        mb={6}
      >
        <BreadcrumbItem>
          <BreadcrumbLink as={RouterLink} to="/">
            Trang Chủ
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>
          <BreadcrumbLink href="#">Tìm kiếm nâng cao</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>

      <Heading as="h1" size="xl" mb={4} color="brand.accent">
        <Icon as={FaSearch} mr={3} verticalAlign="middle" />
        {keyword ? `Kết quả cho "${keyword}"` : "Tìm kiếm nâng cao"}
      </Heading>

      {/* ===== BỘ LỌC NÂNG CAO ===== */}
      <Box
        p={4}
        bg="background.secondary"
        borderRadius="lg"
        mb={6}
        border="1px solid"
        borderColor="brand.700"
      >
        <SimpleGrid
          columns={{ base: 1, md: 2, lg: 5 }}
          spacing={4}
          alignItems="flex-end"
        >
          <FormControl>
            <FormLabel htmlFor="category" fontWeight="bold" mb={1}>
              Thể Loại
            </FormLabel>
            <CustomSelect
              name="category"
              value={filters.category}
              placeholder="Tất cả thể loại"
              options={genres}
              onChange={handleFilterChange}
            />
          </FormControl>
          <FormControl>
            <FormLabel htmlFor="country" fontWeight="bold" mb={1}>
              Quốc Gia
            </FormLabel>
            <CustomSelect
              name="country"
              value={filters.country}
              placeholder="Tất cả quốc gia"
              options={countries}
              onChange={handleFilterChange}
            />
          </FormControl>
          <FormControl>
            <FormLabel htmlFor="year" fontWeight="bold" mb={1}>
              Năm
            </FormLabel>
            <Input
              id="year"
              name="year"
              type="number"
              placeholder="VD: 2023"
              value={filters.year}
              onChange={handleFilterChange}
              focusBorderColor="brand.accent"
            />
          </FormControl>
          <FormControl>
            <FormLabel htmlFor="sort" fontWeight="bold" mb={1}>
              Sắp xếp
            </FormLabel>
            <CustomSelect
              name="sort"
              value={filters.sort}
              placeholder="Chọn cách sắp xếp"
              options={SORT_OPTIONS}
              onChange={handleFilterChange}
              getOptionLabel={(opt) => opt.label}
              getOptionValue={(opt) => opt.value}
            />
          </FormControl>
          <Button
            leftIcon={<FaFilter />}
            colorScheme="orange"
            onClick={handleApplyFilters}
            w="full"
          >
            Lọc
          </Button>
        </SimpleGrid>
      </Box>

      <AppliedFilters />

      {pagination && pagination.totalItems > 0 && (
        <Text fontSize="sm" color="gray.400" mb={4}>
          Tìm thấy tổng số {pagination.totalItems} kết quả.
        </Text>
      )}

      {loading ? (
        <Center h="300px">
          <Spinner
            size="xl"
            color="brand.accent"
            thickness="4px"
            speed="0.65s"
          />
        </Center>
      ) : error ? (
        <Alert
          status="info"
          variant="subtle"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
          minHeight="200px"
          rounded="md"
          p={6}
        >
          <AlertIcon boxSize="40px" mr={0} />
          <AlertTitle mt={4} mb={1} fontSize="lg">
            Không tìm thấy
          </AlertTitle>
          <AlertDescription maxWidth="md">{error}</AlertDescription>
          <Button
            mt={6}
            colorScheme="orange"
            onClick={() => navigate("/")}
            variant="outline"
          >
            Về Trang Chủ
          </Button>
        </Alert>
      ) : searchResults.length > 0 ? (
        <>
          <SimpleGrid
            columns={{ base: 2, sm: 3, md: 4, lg: 5, xl: 6 }}
            spacing={{ base: 4, md: 6 }}
          >
            {searchResults.map((movie) => (
              <MovieCard key={movie._id || movie.slug} movie={movie} />
            ))}
          </SimpleGrid>

          {pagination && pagination.totalPages > 1 && (
            <HStack justifyContent="center" spacing={4} mt={10}>
              <Button
                onClick={() => handlePageChange(1)}
                isDisabled={currentPage === 1}
                size="sm"
              >
                Trang đầu
              </Button>
              <Button
                onClick={() => handlePageChange(currentPage - 1)}
                isDisabled={currentPage === 1}
                size="sm"
              >
                Trước
              </Button>
              <Text>
                Trang <Text as="strong">{currentPage}</Text> /{" "}
                {pagination.totalPages}
              </Text>
              <Button
                onClick={() => handlePageChange(currentPage + 1)}
                isDisabled={currentPage === pagination.totalPages}
                size="sm"
              >
                Sau
              </Button>
              <Button
                onClick={() => handlePageChange(pagination.totalPages)}
                isDisabled={currentPage === pagination.totalPages}
                size="sm"
              >
                Trang cuối
              </Button>
            </HStack>
          )}
        </>
      ) : null}
    </Container>
  );
};

export default SearchResultsPage;
