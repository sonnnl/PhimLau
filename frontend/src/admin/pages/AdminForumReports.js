import React, { useState, useEffect } from "react";
import AdminLayout from "../components/AdminLayout";
import {
  Box,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  IconButton,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Textarea,
  useToast,
  Flex,
  Spacer,
  HStack,
  VStack,
  Text,
  Select,
  Container,
  Spinner,
  Center,
  Button,
  Avatar,
  Link,
  Tooltip,
  useColorModeValue,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  ButtonGroup,
  Input,
  InputGroup,
  InputLeftElement,
  Checkbox,
  Stack,
  Divider,
  Card,
  CardBody,
  CardHeader,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
} from "@chakra-ui/react";
import {
  FiAlertTriangle,
  FiCheck,
  FiX,
  FiEye,
  FiTrash2,
  FiRefreshCw,
  FiSearch,
  FiFilter,
  FiDownload,
  FiUserX,
  FiMessageSquare,
  FiClock,
  FiUser,
  FiShield,
  FiEdit,
} from "react-icons/fi";
import adminService, { adminApiClient } from "../services/adminService";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

const AdminForumReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedReports, setSelectedReports] = useState([]);
  const [stats, setStats] = useState({});
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
  });
  const [filters, setFilters] = useState({
    status: "",
    reportType: "",
    reason: "",
    priority: "",
    page: 1,
    limit: 20,
    search: "",
  });
  const [actionData, setActionData] = useState({
    status: "resolved",
    actionTaken: "none",
    adminNote: "",
  });

  const {
    isOpen: isViewOpen,
    onOpen: onViewOpen,
    onClose: onViewClose,
  } = useDisclosure();
  const {
    isOpen: isActionOpen,
    onOpen: onActionOpen,
    onClose: onActionClose,
  } = useDisclosure();
  const {
    isOpen: isBulkOpen,
    onOpen: onBulkOpen,
    onClose: onBulkClose,
  } = useDisclosure();

  // New states for delete and edit actions
  const {
    isOpen: isDeleteConfirmOpen,
    onOpen: onDeleteConfirmOpen,
    onClose: onDeleteConfirmClose,
  } = useDisclosure();
  const {
    isOpen: isRequestEditOpen,
    onOpen: onRequestEditOpen,
    onClose: onRequestEditClose,
  } = useDisclosure();

  const [editReason, setEditReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const cancelRef = React.useRef();

  const toast = useToast();

  // Theme colors - All hooks must be at the top level
  const bg = useColorModeValue("gray.50", "gray.900");
  const secondaryTextColor = useColorModeValue("gray.600", "gray.400");
  const tableHeaderBg = useColorModeValue("gray.50", "gray.700");
  const tableHoverBg = useColorModeValue("gray.50", "gray.700");
  const descriptionBg = useColorModeValue("gray.50", "gray.700");
  const reportedContentBg = useColorModeValue("red.50", "red.900");
  const reportedContentBorder = useColorModeValue("red.200", "red.700");
  const reportedContentText = useColorModeValue("red.800", "red.100");
  const adminNoteBg = useColorModeValue("blue.50", "blue.900");

  // Fetch reports
  const fetchReports = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams(
        Object.entries(filters).filter(([_, value]) => value)
      ).toString();

      const response = await adminApiClient.get(
        `/forum/reports?${queryParams}`
      );

      setReports(response.data.data);
      setPagination(response.data.pagination);
      setStats(response.data.stats);
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách báo cáo",
        status: "error",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle filter change
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1, // Reset page when filter changes
    }));
  };

  // Handle pagination
  const handlePageChange = (page) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  // View report details
  const handleViewReport = (report) => {
    setSelectedReport(report);
    onViewOpen();
  };

  // Handle legacy actions like warn, suspend, ban
  const handleLegacyAction = async () => {
    if (!selectedReport) return;

    try {
      let adminNote = actionData.adminNote;

      if (
        actionData.actionTaken === "user_suspended" &&
        actionData.suspensionDays
      ) {
        adminNote = `${actionData.adminNote}|${actionData.suspensionDays}`;
      }

      await adminApiClient.put(`/forum/reports/${selectedReport._id}`, {
        status: actionData.status,
        actionTaken: actionData.actionTaken,
        adminNote: adminNote,
      });

      toast({
        title: "Thành công",
        description: "Đã cập nhật báo cáo",
        status: "success",
        duration: 3000,
      });

      onActionClose();
      fetchReports();
    } catch (error) {
      toast({
        title: "Lỗi",
        description:
          error.response?.data?.message || "Không thể cập nhật báo cáo",
        status: "error",
        duration: 3000,
      });
    }
  };

  // == NEW ACTION HANDLERS ==

  const handleDeleteContent = async () => {
    if (!selectedReport) return;
    setActionLoading(true);
    try {
      await adminService.resolveReportAndDelete(selectedReport._id);
      toast({
        title: "Thành công",
        description: "Nội dung đã được xóa và báo cáo đã được xử lý.",
        status: "success",
        duration: 3000,
      });
      fetchReports();
      onDeleteConfirmClose();
    } catch (error) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa nội dung.",
        status: "error",
        duration: 5000,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestEditContent = async () => {
    if (!selectedReport || !editReason) {
      toast({
        title: "Lỗi",
        description: "Lý do yêu cầu chỉnh sửa không được để trống.",
        status: "warning",
        duration: 3000,
      });
      return;
    }
    setActionLoading(true);
    try {
      await adminService.resolveReportAndRequestEdit(
        selectedReport._id,
        editReason
      );
      toast({
        title: "Thành công",
        description: "Đã gửi yêu cầu chỉnh sửa và báo cáo đã được xử lý.",
        status: "success",
        duration: 3000,
      });
      fetchReports();
      onRequestEditClose();
      setEditReason("");
    } catch (error) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể yêu cầu chỉnh sửa.",
        status: "error",
        duration: 5000,
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle bulk action
  const handleBulkAction = async () => {
    if (selectedReports.length === 0) return;

    try {
      let adminNote = actionData.adminNote;

      // Nếu là suspension và có nhập số ngày, thêm vào adminNote
      if (
        actionData.actionTaken === "user_suspended" &&
        actionData.suspensionDays
      ) {
        adminNote = `${actionData.adminNote}|${actionData.suspensionDays}`;
      }

      await adminApiClient.put("/forum/reports/bulk", {
        reportIds: selectedReports,
        status: actionData.status,
        actionTaken: actionData.actionTaken,
        adminNote: adminNote,
      });

      toast({
        title: "Thành công",
        description: `Đã cập nhật ${selectedReports.length} báo cáo`,
        status: "success",
        duration: 3000,
      });

      setSelectedReports([]);
      onBulkClose();
      fetchReports();
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật báo cáo",
        status: "error",
        duration: 3000,
      });
    }
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "yellow";
      case "reviewed":
        return "blue";
      case "resolved":
        return "green";
      case "dismissed":
        return "gray";
      default:
        return "gray";
    }
  };

  // Get priority badge color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case "urgent":
        return "red";
      case "high":
        return "orange";
      case "medium":
        return "yellow";
      case "low":
        return "green";
      default:
        return "gray";
    }
  };

  // Get reason label
  const getReasonLabel = (reason) => {
    const reasonLabels = {
      spam: "Spam",
      harassment: "Quấy rối",
      inappropriate_content: "Nội dung không phù hợp",
      violence: "Bạo lực",
      hate_speech: "Ngôn từ thù địch",
      copyright: "Vi phạm bản quyền",
      false_information: "Thông tin sai lệch",
      other: "Khác",
    };
    return reasonLabels[reason] || reason;
  };

  useEffect(() => {
    fetchReports();
  }, [filters]);

  if (loading && reports.length === 0) {
    return (
      <Center h="50vh">
        <VStack>
          <Spinner size="xl" color="blue.500" />
          <Text>Đang tải báo cáo...</Text>
        </VStack>
      </Center>
    );
  }

  return (
    <AdminLayout
      title="🚨 Quản lý Báo cáo Vi phạm"
      description="Xử lý báo cáo vi phạm forum"
    >
      <VStack spacing={6} align="stretch">
        <Flex align="center">
          <Spacer />
          <HStack>
            <Button
              leftIcon={<FiRefreshCw />}
              onClick={fetchReports}
              variant="outline"
              size="sm"
            >
              Làm mới
            </Button>
            {selectedReports.length > 0 && (
              <Button
                leftIcon={<FiShield />}
                colorScheme="blue"
                onClick={onBulkOpen}
                size="sm"
              >
                Xử lý nhiều ({selectedReports.length})
              </Button>
            )}
          </HStack>
        </Flex>

        {/* Statistics */}
        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Tổng báo cáo</StatLabel>
                <StatNumber>{stats.total || 0}</StatNumber>
                <StatHelpText>
                  <FiMessageSquare
                    style={{ display: "inline", marginRight: "4px" }}
                  />
                  Tất cả thời gian
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Chờ xử lý</StatLabel>
                <StatNumber color="orange.500">
                  {stats.byStatus?.find((s) => s._id === "pending")?.count || 0}
                </StatNumber>
                <StatHelpText>
                  <FiClock style={{ display: "inline", marginRight: "4px" }} />
                  Cần xem xét
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Đã giải quyết</StatLabel>
                <StatNumber color="green.500">
                  {stats.byStatus?.find((s) => s._id === "resolved")?.count ||
                    0}
                </StatNumber>
                <StatHelpText>
                  <FiCheck style={{ display: "inline", marginRight: "4px" }} />
                  Hoàn thành
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Ưu tiên cao</StatLabel>
                <StatNumber color="red.500">
                  {stats.byPriority?.find((p) => p._id === "high")?.count || 0}
                </StatNumber>
                <StatHelpText>
                  <FiAlertTriangle
                    style={{ display: "inline", marginRight: "4px" }}
                  />
                  Cần ưu tiên
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Filters */}
        <Card>
          <CardHeader>
            <HStack>
              <FiFilter />
              <Text fontWeight="bold">Bộ lọc</Text>
            </HStack>
          </CardHeader>
          <CardBody>
            <SimpleGrid columns={{ base: 2, md: 6 }} spacing={4}>
              <FormControl>
                <FormLabel fontSize="sm">Trạng thái</FormLabel>
                <Select
                  size="sm"
                  value={filters.status}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                >
                  <option value="">Tất cả</option>
                  <option value="pending">Chờ xử lý</option>
                  <option value="reviewed">Đã xem xét</option>
                  <option value="resolved">Đã giải quyết</option>
                  <option value="dismissed">Đã bỏ qua</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm">Loại</FormLabel>
                <Select
                  size="sm"
                  value={filters.reportType}
                  onChange={(e) =>
                    handleFilterChange("reportType", e.target.value)
                  }
                >
                  <option value="">Tất cả</option>
                  <option value="thread">Bài viết</option>
                  <option value="reply">Trả lời</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm">Lý do</FormLabel>
                <Select
                  size="sm"
                  value={filters.reason}
                  onChange={(e) => handleFilterChange("reason", e.target.value)}
                >
                  <option value="">Tất cả</option>
                  <option value="spam">Spam</option>
                  <option value="harassment">Quấy rối</option>
                  <option value="inappropriate_content">Không phù hợp</option>
                  <option value="violence">Bạo lực</option>
                  <option value="hate_speech">Ngôn từ thù địch</option>
                  <option value="other">Khác</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm">Độ ưu tiên</FormLabel>
                <Select
                  size="sm"
                  value={filters.priority}
                  onChange={(e) =>
                    handleFilterChange("priority", e.target.value)
                  }
                >
                  <option value="">Tất cả</option>
                  <option value="urgent">Khẩn cấp</option>
                  <option value="high">Cao</option>
                  <option value="medium">Trung bình</option>
                  <option value="low">Thấp</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm">Tìm kiếm</FormLabel>
                <InputGroup size="sm">
                  <InputLeftElement>
                    <FiSearch />
                  </InputLeftElement>
                  <Input
                    placeholder="Tìm theo nội dung..."
                    value={filters.search}
                    onChange={(e) =>
                      handleFilterChange("search", e.target.value)
                    }
                  />
                </InputGroup>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm">Số lượng</FormLabel>
                <Select
                  size="sm"
                  value={filters.limit}
                  onChange={(e) =>
                    handleFilterChange("limit", parseInt(e.target.value))
                  }
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </Select>
              </FormControl>
            </SimpleGrid>
          </CardBody>
        </Card>

        {/* Reports Table */}
        <Card>
          <CardBody p={0}>
            <Table variant="simple">
              <Thead>
                <Tr bg={tableHeaderBg}>
                  <Th>
                    <Checkbox
                      isChecked={selectedReports.length === reports.length}
                      isIndeterminate={
                        selectedReports.length > 0 &&
                        selectedReports.length < reports.length
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedReports(reports.map((r) => r._id));
                        } else {
                          setSelectedReports([]);
                        }
                      }}
                    />
                  </Th>
                  <Th>Loại</Th>
                  <Th>Nội dung bị báo cáo</Th>
                  <Th>Người báo cáo</Th>
                  <Th>Lý do</Th>
                  <Th>Độ ưu tiên</Th>
                  <Th>Trạng thái</Th>
                  <Th>Thời gian</Th>
                  <Th>Thao tác</Th>
                </Tr>
              </Thead>
              <Tbody>
                {reports.map((report) => (
                  <Tr key={report._id} _hover={{ bg: tableHoverBg }}>
                    <Td>
                      <Checkbox
                        isChecked={selectedReports.includes(report._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedReports((prev) => [...prev, report._id]);
                          } else {
                            setSelectedReports((prev) =>
                              prev.filter((id) => id !== report._id)
                            );
                          }
                        }}
                      />
                    </Td>
                    <Td>
                      <Badge
                        colorScheme={
                          report.reportType === "thread" ? "blue" : "green"
                        }
                        variant="subtle"
                      >
                        {report.reportType === "thread"
                          ? "Bài viết"
                          : "Trả lời"}
                      </Badge>
                    </Td>
                    <Td maxW="300px">
                      <VStack align="start" spacing={1}>
                        <Text fontSize="sm" fontWeight="bold" noOfLines={1}>
                          {report.targetId?.title ||
                            `Trả lời của ${report.targetId?.author?.displayName}`}
                        </Text>
                        <Text
                          fontSize="xs"
                          color={secondaryTextColor}
                          noOfLines={2}
                        >
                          {report.targetId?.content?.substring(0, 100)}...
                        </Text>
                      </VStack>
                    </Td>
                    <Td>
                      <HStack>
                        <Avatar size="sm" src={report.reporter?.avatarUrl} />
                        <VStack align="start" spacing={0}>
                          <Text fontSize="sm">
                            {report.reporter?.displayName}
                          </Text>
                          <Text fontSize="xs" color={secondaryTextColor}>
                            {report.reporter?.email}
                          </Text>
                        </VStack>
                      </HStack>
                    </Td>
                    <Td>
                      <Text fontSize="sm">{getReasonLabel(report.reason)}</Text>
                    </Td>
                    <Td>
                      <Badge colorScheme={getPriorityColor(report.priority)}>
                        {report.priority}
                      </Badge>
                    </Td>
                    <Td>
                      <Badge colorScheme={getStatusColor(report.status)}>
                        {report.status}
                      </Badge>
                    </Td>
                    <Td>
                      <VStack align="start" spacing={0}>
                        <Text fontSize="sm">
                          {format(new Date(report.createdAt), "dd/MM/yyyy", {
                            locale: vi,
                          })}
                        </Text>
                        <Text fontSize="xs" color={secondaryTextColor}>
                          {format(new Date(report.createdAt), "HH:mm", {
                            locale: vi,
                          })}
                        </Text>
                      </VStack>
                    </Td>
                    <Td>
                      <ButtonGroup size="sm" isAttached variant="outline">
                        <Tooltip label="Xem chi tiết báo cáo">
                          <IconButton
                            aria-label="View report"
                            icon={<FiEye />}
                            onClick={() => handleViewReport(report)}
                          />
                        </Tooltip>
                        <Tooltip label="Xóa nội dung vi phạm">
                          <IconButton
                            aria-label="Delete content"
                            icon={<FiTrash2 />}
                            colorScheme="red"
                            onClick={() => {
                              setSelectedReport(report);
                              onDeleteConfirmOpen();
                            }}
                            isDisabled={report.status === "resolved"}
                          />
                        </Tooltip>
                        <Tooltip label="Yêu cầu người dùng chỉnh sửa">
                          <IconButton
                            aria-label="Request edit"
                            icon={<FiEdit />}
                            colorScheme="yellow"
                            onClick={() => {
                              setSelectedReport(report);
                              onRequestEditOpen();
                            }}
                            isDisabled={report.status === "resolved"}
                          />
                        </Tooltip>
                        <Tooltip label="Xử lý (cảnh cáo, cấm...)">
                          <IconButton
                            aria-label="Take action"
                            icon={<FiShield />}
                            colorScheme="blue"
                            onClick={() => {
                              setSelectedReport(report);
                              onActionOpen();
                            }}
                            isDisabled={report.status === "resolved"}
                          />
                        </Tooltip>
                      </ButtonGroup>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>

            {reports.length === 0 && (
              <Center p={8}>
                <VStack>
                  <FiAlertTriangle size={48} color="gray" />
                  <Text color={secondaryTextColor}>Không có báo cáo nào</Text>
                </VStack>
              </Center>
            )}
          </CardBody>
        </Card>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <HStack justify="center">
            <ButtonGroup size="sm">
              <Button
                isDisabled={pagination.currentPage === 1}
                onClick={() => handlePageChange(pagination.currentPage - 1)}
              >
                Trước
              </Button>
              {Array.from(
                { length: pagination.totalPages },
                (_, i) => i + 1
              ).map((page) => (
                <Button
                  key={page}
                  variant={pagination.currentPage === page ? "solid" : "ghost"}
                  colorScheme={
                    pagination.currentPage === page ? "blue" : "gray"
                  }
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </Button>
              ))}
              <Button
                isDisabled={pagination.currentPage === pagination.totalPages}
                onClick={() => handlePageChange(pagination.currentPage + 1)}
              >
                Sau
              </Button>
            </ButtonGroup>
          </HStack>
        )}

        {/* View Report Modal */}
        <Modal isOpen={isViewOpen} onClose={onViewClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Chi tiết báo cáo</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {selectedReport && (
                <VStack align="start" spacing={4}>
                  <SimpleGrid columns={2} spacing={4} w="full">
                    <VStack align="start">
                      <Text fontWeight="bold">Loại báo cáo:</Text>
                      <Badge
                        colorScheme={
                          selectedReport.reportType === "thread"
                            ? "blue"
                            : "green"
                        }
                      >
                        {selectedReport.reportType === "thread"
                          ? "Bài viết"
                          : "Trả lời"}
                      </Badge>
                    </VStack>
                    <VStack align="start">
                      <Text fontWeight="bold">Trạng thái:</Text>
                      <Badge
                        colorScheme={getStatusColor(selectedReport.status)}
                      >
                        {selectedReport.status}
                      </Badge>
                    </VStack>
                    <VStack align="start">
                      <Text fontWeight="bold">Lý do:</Text>
                      <Text>{getReasonLabel(selectedReport.reason)}</Text>
                    </VStack>
                    <VStack align="start">
                      <Text fontWeight="bold">Độ ưu tiên:</Text>
                      <Badge
                        colorScheme={getPriorityColor(selectedReport.priority)}
                      >
                        {selectedReport.priority}
                      </Badge>
                    </VStack>
                  </SimpleGrid>

                  <Divider />

                  <VStack align="start" w="full">
                    <Text fontWeight="bold">Người báo cáo:</Text>
                    <HStack>
                      <Avatar src={selectedReport.reporter?.avatarUrl} />
                      <VStack align="start" spacing={0}>
                        <Text>{selectedReport.reporter?.displayName}</Text>
                        <Text fontSize="sm" color={secondaryTextColor}>
                          {selectedReport.reporter?.email}
                        </Text>
                      </VStack>
                    </HStack>
                  </VStack>

                  {selectedReport.description && (
                    <VStack align="start" w="full">
                      <Text fontWeight="bold">Mô tả chi tiết:</Text>
                      <Text p={3} bg={descriptionBg} rounded="md" w="full">
                        {selectedReport.description}
                      </Text>
                    </VStack>
                  )}

                  <Divider />

                  <VStack align="start" w="full">
                    <Text fontWeight="bold">Nội dung bị báo cáo:</Text>
                    <Box
                      p={4}
                      bg={reportedContentBg}
                      border="1px"
                      borderColor={reportedContentBorder}
                      rounded="md"
                      w="full"
                      color={reportedContentText}
                    >
                      {selectedReport.targetId?.title && (
                        <Text
                          fontWeight="bold"
                          mb={2}
                          color={reportedContentText}
                        >
                          {selectedReport.targetId.title}
                        </Text>
                      )}
                      <Text color={reportedContentText}>
                        {selectedReport.targetId?.content ||
                          "Không có nội dung"}
                      </Text>
                      {selectedReport.targetId?.author && (
                        <Text
                          fontSize="sm"
                          color={reportedContentText}
                          mt={2}
                          fontStyle="italic"
                        >
                          - Bởi: {selectedReport.targetId.author.displayName}
                        </Text>
                      )}
                    </Box>
                  </VStack>

                  {selectedReport.adminNote && (
                    <VStack align="start" w="full">
                      <Text fontWeight="bold">Ghi chú admin:</Text>
                      <Text p={3} bg={adminNoteBg} rounded="md" w="full">
                        {selectedReport.adminNote}
                      </Text>
                    </VStack>
                  )}
                </VStack>
              )}
            </ModalBody>
            <ModalFooter>
              <Button onClick={onViewClose}>Đóng</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Action Modal */}
        <Modal isOpen={isActionOpen} onClose={onActionClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Xử lý Báo cáo</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <FormControl>
                  <FormLabel>Trạng thái</FormLabel>
                  <Select
                    value={actionData.status}
                    onChange={(e) =>
                      setActionData((prev) => ({
                        ...prev,
                        status: e.target.value,
                      }))
                    }
                  >
                    <option value="reviewed">Đã xem xét</option>
                    <option value="resolved">Đã giải quyết</option>
                    <option value="dismissed">Bỏ qua</option>
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Hành động thực hiện</FormLabel>
                  <Select
                    value={actionData.actionTaken}
                    onChange={(e) =>
                      setActionData((prev) => ({
                        ...prev,
                        actionTaken: e.target.value,
                      }))
                    }
                  >
                    <option value="none">Không có hành động</option>
                    <option value="warning_sent">Gửi cảnh báo</option>
                    <option value="content_removed">Xóa nội dung</option>
                    <option value="content_edited">Chỉnh sửa nội dung</option>
                    <option value="user_suspended">Tạm khóa người dùng</option>
                    <option value="user_banned">Cấm người dùng</option>
                  </Select>
                </FormControl>

                {actionData.actionTaken === "user_suspended" && (
                  <FormControl>
                    <FormLabel>Số ngày tạm khóa</FormLabel>
                    <Input
                      type="number"
                      min="1"
                      max="365"
                      defaultValue="7"
                      placeholder="Nhập số ngày (1-365)"
                      onChange={(e) => {
                        const days = e.target.value;
                        setActionData((prev) => ({
                          ...prev,
                          suspensionDays: days,
                        }));
                      }}
                    />
                    <Text fontSize="sm" color="gray.500">
                      Mặc định: 7 ngày nếu để trống
                    </Text>
                  </FormControl>
                )}

                <FormControl>
                  <FormLabel>Ghi chú admin</FormLabel>
                  <Textarea
                    value={actionData.adminNote}
                    onChange={(e) =>
                      setActionData((prev) => ({
                        ...prev,
                        adminNote: e.target.value,
                      }))
                    }
                    placeholder="Ghi chú về quyết định xử lý..."
                    rows={4}
                  />
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onActionClose}>
                Hủy
              </Button>
              <Button colorScheme="blue" onClick={handleLegacyAction}>
                Xác nhận
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Bulk Action Modal */}
        <Modal isOpen={isBulkOpen} onClose={onBulkClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              Xử lý nhiều báo cáo ({selectedReports.length})
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <FormControl>
                  <FormLabel>Trạng thái</FormLabel>
                  <Select
                    value={actionData.status}
                    onChange={(e) =>
                      setActionData((prev) => ({
                        ...prev,
                        status: e.target.value,
                      }))
                    }
                  >
                    <option value="reviewed">Đã xem xét</option>
                    <option value="resolved">Đã giải quyết</option>
                    <option value="dismissed">Bỏ qua</option>
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Hành động thực hiện</FormLabel>
                  <Select
                    value={actionData.actionTaken}
                    onChange={(e) =>
                      setActionData((prev) => ({
                        ...prev,
                        actionTaken: e.target.value,
                      }))
                    }
                  >
                    <option value="none">Không có hành động</option>
                    <option value="warning_sent">Gửi cảnh báo</option>
                    <option value="content_removed">Xóa nội dung</option>
                  </Select>
                </FormControl>

                {actionData.actionTaken === "user_suspended" && (
                  <FormControl>
                    <FormLabel>Số ngày tạm khóa</FormLabel>
                    <Input
                      type="number"
                      min="1"
                      max="365"
                      defaultValue="7"
                      placeholder="Nhập số ngày (1-365)"
                      onChange={(e) => {
                        const days = e.target.value;
                        setActionData((prev) => ({
                          ...prev,
                          suspensionDays: days,
                        }));
                      }}
                    />
                    <Text fontSize="sm" color="gray.500">
                      Áp dụng cho tất cả users bị suspend
                    </Text>
                  </FormControl>
                )}

                <FormControl>
                  <FormLabel>Ghi chú chung</FormLabel>
                  <Textarea
                    value={actionData.adminNote}
                    onChange={(e) =>
                      setActionData((prev) => ({
                        ...prev,
                        adminNote: e.target.value,
                      }))
                    }
                    placeholder="Ghi chú chung cho tất cả báo cáo..."
                    rows={3}
                  />
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <ButtonGroup>
                <Button onClick={onBulkClose}>Hủy</Button>
                <Button colorScheme="red" onClick={handleBulkAction}>
                  Xử lý {selectedReports.length} báo cáo
                </Button>
              </ButtonGroup>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          isOpen={isDeleteConfirmOpen}
          leastDestructiveRef={cancelRef}
          onClose={onDeleteConfirmClose}
        >
          <AlertDialogOverlay>
            <AlertDialogContent>
              <AlertDialogHeader fontSize="lg" fontWeight="bold">
                Xác nhận Xóa Nội dung
              </AlertDialogHeader>

              <AlertDialogBody>
                Bạn có chắc chắn muốn xóa vĩnh viễn nội dung này? Hành động này
                sẽ không thể hoàn tác và sẽ giải quyết báo cáo này.
              </AlertDialogBody>

              <AlertDialogFooter>
                <Button ref={cancelRef} onClick={onDeleteConfirmClose}>
                  Hủy
                </Button>
                <Button
                  colorScheme="red"
                  onClick={handleDeleteContent}
                  ml={3}
                  isLoading={actionLoading}
                >
                  Xóa Nội dung
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>

        {/* Request Edit Modal */}
        {selectedReport && (
          <Modal isOpen={isRequestEditOpen} onClose={onRequestEditClose}>
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>Yêu cầu Chỉnh sửa Nội dung</ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                <FormControl isRequired>
                  <FormLabel>Lý do yêu cầu chỉnh sửa</FormLabel>
                  <Textarea
                    placeholder="Ví dụ: Vui lòng gỡ bỏ thông tin cá nhân, điều chỉnh lại ngôn từ cho phù hợp..."
                    value={editReason}
                    onChange={(e) => setEditReason(e.target.value)}
                  />
                </FormControl>
              </ModalBody>
              <ModalFooter>
                <Button variant="ghost" mr={3} onClick={onRequestEditClose}>
                  Hủy
                </Button>
                <Button
                  colorScheme="yellow"
                  onClick={handleRequestEditContent}
                  isLoading={actionLoading}
                >
                  Gửi yêu cầu
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        )}
      </VStack>
    </AdminLayout>
  );
};

export default AdminForumReports;
