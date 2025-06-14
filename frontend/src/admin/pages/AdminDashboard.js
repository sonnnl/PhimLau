import React, { useState, useEffect } from "react";
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
    <Box p={6} maxW="1400px" mx="auto">
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Box>
          <Heading size="xl" color="brand.accent" mb={2}>
            👑 Admin Dashboard
          </Heading>
          <Text color="gray.500">
            Quản lý hệ thống Movie Review - Chỉ nghiệp vụ thực tế
          </Text>
        </Box>

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
                <StatLabel>Admin</StatLabel>
                <StatNumber color="purple.500">
                  {stats.users?.admins || 0}
                </StatNumber>
                <StatHelpText>Quản trị viên</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Action Cards - Chỉ nghiệp vụ thực tế */}
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
          <AdminActionCard
            title="👥 Quản lý Users"
            description="Quản lý người dùng, phân quyền và moderation."
            icon={FiUsers}
            color="blue"
            actions={[
              { label: "Danh sách users", link: "/admin/users", icon: FiUsers },
              {
                label: "Phân quyền admin",
                link: "/admin/users?role=admin",
                icon: FiShield,
              },
              {
                label: "Users hoạt động",
                link: "/admin/users?active=true",
                icon: FiActivity,
              },
            ]}
          />

          <AdminActionCard
            title="📢 Quản lý Thông báo"
            description="Gửi thông báo real-time cho users, quản lý announcements."
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
              {
                label: "Test notifications",
                link: "/admin/notifications?tab=test",
                icon: FiActivity,
              },
            ]}
          />

          <AdminActionCard
            title="⭐ Quản lý Reviews"
            description="Moderation đánh giá phim, spam detection và quality control."
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
              {
                label: "Thống kê đánh giá",
                link: "/admin/reviews/stats",
                icon: FiTrendingUp,
              },
            ]}
          />

          <AdminActionCard
            title="⚙️ Cấu hình Hệ thống"
            description="Settings, logs và monitoring hệ thống."
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
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
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
                <Text fontSize="2xl" fontWeight="bold" color="orange.500">
                  {Math.floor(stats.system?.uptime / 3600) || 0}h
                </Text>
                <Text fontSize="sm" color="gray.500">
                  Server uptime
                </Text>
              </Box>
              <Box textAlign="center">
                <Text fontSize="2xl" fontWeight="bold" color="purple.500">
                  {stats.system?.platform || "N/A"}
                </Text>
                <Text fontSize="sm" color="gray.500">
                  Platform
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
    </Box>
  );
};

export default AdminDashboard;
