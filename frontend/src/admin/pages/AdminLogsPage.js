import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Spinner,
  Text,
  Alert,
  AlertIcon,
  HStack,
  IconButton,
  Tooltip,
  Tag,
  VStack,
  Card,
  CardHeader,
  CardBody,
  Link as ChakraLink,
  Icon,
  InputGroup,
  InputLeftElement,
  Input,
  Select,
  Flex,
  Button,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Code,
  useColorModeValue,
  Avatar,
} from "@chakra-ui/react";
import {
  FiChevronLeft,
  FiChevronRight,
  FiChevronsLeft,
  FiChevronsRight,
  FiExternalLink,
  FiSearch,
  FiEye,
} from "react-icons/fi";
import { Link as RouterLink } from "react-router-dom";
import {
  getAdminLogs,
  getLogAdmins,
  getLogActions,
} from "../services/adminService";
import { debounce } from "lodash";

const ActionTag = ({ action }) => {
  const colorSchemes = {
    delete: "red",
    update: "yellow",
    create: "green",
    moderate: "blue",
    resolve: "purple",
    toggle: "cyan",
    sent: "pink",
    user: "gray",
  };

  const actionType = (action.split("_")[0] || "").toLowerCase();
  const color = colorSchemes[actionType] || "gray";

  return (
    <Tag colorScheme={color}>{action.replace(/_/g, " ").toUpperCase()}</Tag>
  );
};

const TargetLink = ({ log }) => {
  let to = null;
  switch (log.targetType) {
    case "review":
      if (log.metadata?.movieSlug) {
        to = `/movie/${log.metadata.movieSlug}`;
      }
      break;
    case "user":
      // For user, we just display the name, not a link.
      return <Text>{log.metadata?.username || log.targetId}</Text>;
    case "report":
      to = `/admin/forum/reports`;
      break;
    case "thread":
      if (log.metadata?.threadSlug) {
        to = `/forum/thread/${log.metadata.threadSlug}`;
      }
      break;
    // Add other cases as needed
    default:
      break;
  }

  if (!to) {
    return <Text color="gray.500">N/A</Text>;
  }

  return (
    <Tooltip label={`Đi đến: ${to}`}>
      <ChakraLink as={RouterLink} to={to} isExternal>
        <Icon as={FiExternalLink} />
      </ChakraLink>
    </Tooltip>
  );
};

const JsonViewer = ({ data }) => {
  if (!data || Object.keys(data).length === 0) {
    return <Text color="gray.500">Không có dữ liệu.</Text>;
  }
  return (
    <Code
      p={3}
      borderRadius="md"
      w="full"
      overflowX="auto"
      bg="gray.700"
      color="white"
    >
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </Code>
  );
};

const AdminLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    page: 1,
    limit: 15,
    search: "",
    adminId: "",
    action: "",
  });

  const [admins, setAdmins] = useState([]);
  const [actions, setActions] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const cardBg = useColorModeValue("white", "gray.800");

  const fetchFilterData = useCallback(async () => {
    try {
      const [adminsData, actionsData] = await Promise.all([
        getLogAdmins(),
        getLogActions(),
      ]);
      setAdmins(adminsData);
      setActions(actionsData);
    } catch (err) {
      console.error("Failed to fetch filter data:", err);
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAdminLogs(filters);
      setLogs(data.logs);
      setPagination({
        totalPages: data.totalPages,
        currentPage: data.currentPage,
        totalLogs: data.totalLogs,
      });
    } catch (err) {
      setError(err.message || "Không thể tải nhật ký.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchFilterData();
  }, [fetchFilterData]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const debouncedSearch = useCallback(
    debounce((value) => {
      setFilters((prev) => ({ ...prev, search: value, page: 1 }));
    }, 500),
    []
  );

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleViewDetails = (log) => {
    setSelectedLog(log);
    onOpen();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("vi-VN");
  };

  const renderPagination = () => {
    if (!pagination.totalPages || pagination.totalPages <= 1) return null;
    return (
      <HStack mt={4} spacing={2} justify="center">
        <IconButton
          icon={<FiChevronsLeft />}
          onClick={() => handlePageChange(1)}
          isDisabled={filters.page === 1}
          aria-label="First page"
        />
        <IconButton
          icon={<FiChevronLeft />}
          onClick={() => handlePageChange(filters.page - 1)}
          isDisabled={filters.page === 1}
          aria-label="Previous page"
        />
        <Text>
          Trang {filters.page} / {pagination.totalPages}
        </Text>
        <IconButton
          icon={<FiChevronRight />}
          onClick={() => handlePageChange(filters.page + 1)}
          isDisabled={filters.page === pagination.totalPages}
          aria-label="Next page"
        />
        <IconButton
          icon={<FiChevronsRight />}
          onClick={() => handlePageChange(pagination.totalPages)}
          isDisabled={filters.page === pagination.totalPages}
          aria-label="Last page"
        />
      </HStack>
    );
  };

  return (
    <Box p={4}>
      <VStack spacing={4} align="stretch">
        <Heading as="h1" size="lg">
          Nhật ký hoạt động của Admin
        </Heading>
        <Card bg={cardBg}>
          <CardHeader>
            <Flex justify="space-between" align="center">
              <Heading size="md">
                Lịch sử hành động ({pagination.totalLogs || 0})
              </Heading>
              <HStack spacing={2}>
                <InputGroup w={{ base: "150px", md: "250px" }}>
                  <InputLeftElement pointerEvents="none">
                    <Icon as={FiSearch} color="gray.500" />
                  </InputLeftElement>
                  <Input
                    placeholder="Tìm kiếm lý do..."
                    onChange={(e) => debouncedSearch(e.target.value)}
                  />
                </InputGroup>
                <Select
                  name="adminId"
                  value={filters.adminId}
                  onChange={handleFilterChange}
                  w={{ base: "120px", md: "180px" }}
                >
                  <option value="">Tất cả Admin</option>
                  {admins.map((admin) => (
                    <option key={admin._id} value={admin._id}>
                      {admin.username}
                    </option>
                  ))}
                </Select>
                <Select
                  name="action"
                  value={filters.action}
                  onChange={handleFilterChange}
                  w={{ base: "150px", md: "200px" }}
                >
                  <option value="">Tất cả Hành động</option>
                  {actions.map((action) => (
                    <option key={action} value={action}>
                      {action}
                    </option>
                  ))}
                </Select>
              </HStack>
            </Flex>
          </CardHeader>
          <CardBody>
            {loading ? (
              <Flex justify="center" align="center" minH="300px">
                <Spinner size="xl" />
              </Flex>
            ) : error ? (
              <Alert status="error">
                <AlertIcon />
                {error}
              </Alert>
            ) : (
              <>
                <TableContainer>
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Admin</Th>
                        <Th>Hành động</Th>
                        <Th>Mô tả/Lý do</Th>
                        <Th>Thời gian</Th>
                        <Th>Chi tiết</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {logs.map((log) => (
                        <Tr key={log._id}>
                          <Td>
                            <HStack>
                              <Avatar
                                size="sm"
                                name={log.admin?.username}
                                src={log.admin?.avatarUrl}
                              />
                              <Text>{log.admin?.username || "N/A"}</Text>
                            </HStack>
                          </Td>
                          <Td>
                            <ActionTag action={log.action} />
                          </Td>
                          <Td>
                            <Tooltip label={log.reason}>
                              <Text maxW="350px" isTruncated>
                                {log.reason || "N/A"}
                              </Text>
                            </Tooltip>
                          </Td>
                          <Td>{formatDate(log.createdAt)}</Td>
                          <Td>
                            <HStack spacing={2}>
                              <TargetLink log={log} />
                              <Tooltip label="Xem chi tiết Log">
                                <IconButton
                                  icon={<FiEye />}
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleViewDetails(log)}
                                />
                              </Tooltip>
                            </HStack>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>
                {renderPagination()}
              </>
            )}
          </CardBody>
        </Card>
      </VStack>

      {/* Details Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            Chi tiết Log #{selectedLog?._id.toString().substring(0, 8)}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedLog && (
              <VStack spacing={4} align="start">
                <Text>
                  <strong>Admin:</strong> {selectedLog.admin?.username}
                </Text>
                <Text>
                  <strong>Hành động:</strong>{" "}
                  <ActionTag action={selectedLog.action} />
                </Text>
                <Text>
                  <strong>Thời gian:</strong>{" "}
                  {formatDate(selectedLog.createdAt)}
                </Text>
                <Text>
                  <strong>Đối tượng:</strong> {selectedLog.targetType} - ID:{" "}
                  {selectedLog.targetId}
                </Text>
                <Text>
                  <strong>Lý do/Mô tả:</strong> {selectedLog.reason}
                </Text>
                <Text>
                  <strong>IP Address:</strong> {selectedLog.ipAddress}
                </Text>
                <Box w="full">
                  <Heading size="sm" mb={2}>
                    Dữ liệu trước thay đổi (Before)
                  </Heading>
                  <JsonViewer data={selectedLog.beforeData} />
                </Box>
                <Box w="full">
                  <Heading size="sm" mb={2}>
                    Dữ liệu sau thay đổi (After)
                  </Heading>
                  <JsonViewer data={selectedLog.afterData} />
                </Box>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose}>Đóng</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default AdminLogsPage;
