import React, { useState, useEffect } from "react";
import AdminLayout from "../components/AdminLayout";
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  VStack,
  HStack,
  Icon,
  Text,
  Button,
  useColorModeValue,
  Link as ChakraLink,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import {
  FiUsers,
  FiStar,
  FiBell,
  FiActivity,
  FiTrendingUp,
  FiShield,
  FiSettings,
  FiMessageSquare,
  FiAlertTriangle,
} from "react-icons/fi";
import { getDashboardStats } from "../services/adminService.js";

const AdminActionCard = ({ title, description, icon, color, actions }) => {
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  return (
    <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
      <CardHeader pb={3}>
        <HStack spacing={3}>
          <Icon as={icon} boxSize="30px" color={`${color}.500`} />
          <VStack align="start" spacing={1}>
            <Heading size="md">{title}</Heading>
            <Text fontSize="sm" color="gray.500">
              {description}
            </Text>
          </VStack>
        </HStack>
      </CardHeader>
      <CardBody pt={0}>
        <VStack spacing={2} align="stretch">
          {actions.map((action, index) => (
            <Button
              key={index}
              as={RouterLink}
              to={action.link}
              size="sm"
              variant="ghost"
              leftIcon={<Icon as={action.icon} />}
              justifyContent="flex-start"
              colorScheme={color}
            >
              {action.label}
            </Button>
          ))}
        </VStack>
      </CardBody>
    </Card>
  );
};

const AdminDashboard = () => {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Move all hooks to the top - before any early returns
  const cardBg = useColorModeValue("white", "gray.800");
  const noteBg = useColorModeValue("blue.50", "blue.900");

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await getDashboardStats();
      setStats(data.data);
    } catch (error) {
      setError(error.message);
      console.error("Error fetching admin stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box p={6}>
        <Text>Đang tải thống kê...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={6}>
        <Text color="red.500">Lỗi: {error}</Text>
        <Button mt={2} onClick={fetchStats}>
          Thử lại
        </Button>
      </Box>
    );
  }

  return (
    <AdminLayout title="👑 Dashboard">
      <VStack spacing={6} align="stretch">
        {/* Statistics Grid */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
          <Card bg={cardBg}>
            <CardBody>
              <Stat>
                <StatLabel>Tổng người dùng</StatLabel>
                <StatNumber color="blue.500">
                  {stats.users?.total || 0}
                </StatNumber>
                <StatHelpText>
                  <StatArrow type="increase" />+{stats.users?.recent || 0} tuần
                  này
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card bg={cardBg}>
            <CardBody>
              <Stat>
                <StatLabel>Người dùng hoạt động</StatLabel>
                <StatNumber color="green.500">
                  {stats.users?.active || 0}
                </StatNumber>
                <StatHelpText>30 ngày qua</StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card bg={cardBg}>
            <CardBody>
              <Stat>
                <StatLabel>Đánh giá phim</StatLabel>
                <StatNumber color="orange.500">
                  {stats.reviews?.total || 0}
                </StatNumber>
                <StatHelpText>
                  <StatArrow type="increase" />+{stats.reviews?.recent || 0} mới
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card bg={cardBg}>
            <CardBody>
              <Stat>
                <StatLabel>Forum threads</StatLabel>
                <StatNumber color="teal.500">
                  {stats.forum?.totalThreads || 0}
                </StatNumber>
                <StatHelpText>
                  <StatArrow type="increase" />+
                  {stats.forum?.recentThreads || 0} mới
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Action Cards */}
        <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={6}>
          <AdminActionCard
            title="👥 Quản lý Users"
            description="Quản lý người dùng, phân quyền và moderation"
            icon={FiUsers}
            color="blue"
            actions={[
              { label: "Danh sách users", link: "/admin/users", icon: FiUsers },
            ]}
          />

          <AdminActionCard
            title="💬 Quản lý Forum"
            description="Moderation forum threads, replies và community management"
            icon={FiMessageSquare}
            color="teal"
            actions={[
              {
                label: "Quản lý danh mục",
                link: "/admin/forum/categories",
                icon: FiMessageSquare,
              },
              {
                label: "Quản lý bài viết",
                link: "/admin/forum/threads",
                icon: FiShield,
              },
              {
                label: "Báo cáo vi phạm",
                link: "/admin/forum/reports",
                icon: FiAlertTriangle,
              },
            ]}
          />

          <AdminActionCard
            title="📢 Quản lý Thông báo"
            description="Gửi thông báo real-time cho users"
            icon={FiBell}
            color="green"
            actions={[
              {
                label: "Gửi thông báo",
                link: "/admin/notifications",
                icon: FiBell,
              },
              {
                label: "Lịch sử thông báo",
                link: "/admin/notifications?tab=history",
                icon: FiTrendingUp,
              },
            ]}
          />

          <AdminActionCard
            title="⭐ Quản lý Reviews"
            description="Moderation đánh giá phim và spam detection"
            icon={FiStar}
            color="orange"
            actions={[
              {
                label: "Review moderation",
                link: "/admin/reviews",
                icon: FiStar,
              },
              {
                label: "Báo cáo spam",
                link: "/admin/reviews/reports",
                icon: FiShield,
              },
            ]}
          />

          <AdminActionCard
            title="⚙️ Cấu hình Hệ thống"
            description="Settings, logs và monitoring hệ thống"
            icon={FiSettings}
            color="purple"
            actions={[
              {
                label: "System health",
                link: "/admin/system",
                icon: FiActivity,
              },
              { label: "Server logs", link: "/admin/logs", icon: FiTrendingUp },
              { label: "Cấu hình", link: "/admin/settings", icon: FiSettings },
            ]}
          />
        </SimpleGrid>

        {/* Quick Stats */}
        <Card bg={cardBg}>
          <CardHeader>
            <Heading size="md">📊 Thống kê nhanh</Heading>
          </CardHeader>
          <CardBody>
            <SimpleGrid columns={{ base: 2, md: 5 }} spacing={4}>
              <Box textAlign="center">
                <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                  {Math.floor(
                    ((stats.users?.active || 0) / (stats.users?.total || 1)) *
                      100
                  )}
                  %
                </Text>
                <Text fontSize="sm" color="gray.500">
                  Tỷ lệ users hoạt động
                </Text>
              </Box>
              <Box textAlign="center">
                <Text fontSize="2xl" fontWeight="bold" color="green.500">
                  {stats.reviews?.avgRating || "N/A"}
                </Text>
                <Text fontSize="sm" color="gray.500">
                  Điểm đánh giá TB
                </Text>
              </Box>
              <Box textAlign="center">
                <Text fontSize="2xl" fontWeight="bold" color="teal.500">
                  {stats.forum?.totalReplies || 0}
                </Text>
                <Text fontSize="sm" color="gray.500">
                  Forum replies
                </Text>
              </Box>
              <Box textAlign="center">
                <Text fontSize="2xl" fontWeight="bold" color="orange.500">
                  {Math.floor(stats.system?.uptime / 3600) || 0}h
                </Text>
                <Text fontSize="sm" color="gray.500">
                  Server uptime
                </Text>
              </Box>
              <Box textAlign="center">
                <Text fontSize="2xl" fontWeight="bold" color="purple.500">
                  {stats.users?.admins || 0}
                </Text>
                <Text fontSize="sm" color="gray.500">
                  Admins
                </Text>
              </Box>
            </SimpleGrid>
          </CardBody>
        </Card>

        {/* Note */}
        <Box
          p={4}
          bg={noteBg}
          borderRadius="md"
          borderLeft="4px"
          borderLeftColor="blue.500"
        >
          <Text fontSize="sm" color="blue.700">
            💡 <strong>Lưu ý:</strong> Dashboard này chỉ quản lý nghiệp vụ thực
            tế. Phim được lấy từ API bên thứ 3 (TMDB/OMDb), không cần quản lý
            database phim.
          </Text>
        </Box>
      </VStack>
    </AdminLayout>
  );
};

export default AdminDashboard;
