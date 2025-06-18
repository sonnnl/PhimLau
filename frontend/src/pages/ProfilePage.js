import React, { useState, useEffect, useContext } from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Avatar,
  Button,
  Card,
  CardHeader,
  CardBody,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  useDisclosure,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Badge,
  Icon,
  Divider,
  Alert,
  AlertIcon,
  Spinner,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Flex,
  Spacer,
  IconButton,
} from "@chakra-ui/react";
import {
  FiEdit3,
  FiUser,
  FiSettings,
  FiActivity,
  FiCalendar,
  FiMail,
  FiStar,
  FiMessageSquare,
  FiEye,
  FiCamera,
  FiLock,
  FiThumbsUp,
  FiShield,
  FiMessageCircle,
} from "react-icons/fi";
import { AuthContext } from "../contexts/AuthContext";
import {
  updateUserProfile,
  getUserProfile,
  updateUserPassword,
  uploadAvatar,
} from "../services/userService";

const getTrustLevelInfo = (level) => {
  switch (level) {
    case "new":
      return { label: "Thành viên mới", color: "gray", icon: FiUser };
    case "basic":
      return { label: "Thành viên cơ bản", color: "blue", icon: FiUser };
    case "active":
      return {
        label: "Thành viên tích cực",
        color: "green",
        icon: FiActivity,
      };
    case "trusted":
      return {
        label: "Thành viên tin cậy",
        color: "purple",
        icon: FiShield,
      };
    case "veteran":
      return {
        label: "Thành viên kỳ cựu",
        color: "orange",
        icon: FiStar,
      };
    case "moderator":
      return {
        label: "Điều hành viên",
        color: "yellow",
        icon: FiShield,
      };
    case "admin":
      return { label: "Quản trị viên", color: "red", icon: FiShield };
    default:
      return { label: "Chưa phân loại", color: "gray", icon: FiUser };
  }
};

const ProfilePage = () => {
  const { user, refreshUser } = useContext(AuthContext);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    displayName: "",
    email: "",
    avatarUrl: "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [activeTab, setActiveTab] = useState(0);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [uploadMethod, setUploadMethod] = useState("file"); // "file" or "url"
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isPasswordModalOpen,
    onOpen: onPasswordModalOpen,
    onClose: onPasswordModalClose,
  } = useDisclosure();
  const toast = useToast();

  useEffect(() => {
    if (user) {
      fetchProfileData();
    }
  }, [user]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const data = await getUserProfile();
      setProfileData(data);
      setFormData({
        displayName: data.user.displayName || "",
        email: data.user.email || "",
        avatarUrl: data.user.avatarUrl || "",
      });
    } catch (error) {
      toast({
        title: "❌ Lỗi",
        description: "Không thể tải thông tin profile",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setUploadingAvatar(true);
      let finalFormData = { ...formData };

      // If user selected file to upload, upload it first
      if (selectedFile && uploadMethod === "file") {
        const uploadFormData = new FormData();
        uploadFormData.append("avatar", selectedFile);

        const uploadResponse = await uploadAvatar(uploadFormData);
        finalFormData.avatarUrl = uploadResponse.avatarUrl;
      }

      const response = await updateUserProfile(finalFormData);
      toast({
        title: "✅ Thành công",
        description: "Đã cập nhật thông tin cá nhân",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      await refreshUser();
      setIsEditing(false);
      resetModalState();
      fetchProfileData();
    } catch (error) {
      toast({
        title: "❌ Lỗi",
        description: error.message || "Không thể cập nhật thông tin",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "❌ Lỗi",
        description: "Mật khẩu xác nhận không khớp",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      await updateUserPassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast({
        title: "✅ Thành công",
        description: "Đã đổi mật khẩu thành công",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      onPasswordModalClose();
    } catch (error) {
      toast({
        title: "❌ Lỗi",
        description: error.message || "Không thể đổi mật khẩu",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "❌ Lỗi",
        description: "Vui lòng chọn file ảnh",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "❌ Lỗi",
        description: "File ảnh quá lớn (tối đa 5MB)",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setUploadingAvatar(true);
      const formData = new FormData();
      formData.append("avatar", file);

      const response = await uploadAvatar(formData);

      toast({
        title: "✅ Thành công",
        description: "Đã cập nhật avatar thành công",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      // Refresh user data
      await refreshUser();
      fetchProfileData();
    } catch (error) {
      toast({
        title: "❌ Lỗi",
        description: error.message || "Không thể upload avatar",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) {
      setSelectedFile(null);
      setPreviewUrl("");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "❌ Lỗi",
        description: "Vui lòng chọn file ảnh",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "❌ Lỗi",
        description: "File ảnh quá lớn (tối đa 5MB)",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setSelectedFile(file);

    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const resetModalState = () => {
    setSelectedFile(null);
    setPreviewUrl("");
    setUploadMethod("file");
    setFormData({
      displayName: profileData?.user.displayName || "",
      email: profileData?.user.email || "",
      avatarUrl: profileData?.user.avatarUrl || "",
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <Container maxW="6xl" py={8}>
        <Flex justify="center" align="center" minH="400px">
          <Spinner size="xl" color="brand.accent" />
        </Flex>
      </Container>
    );
  }

  if (!profileData) {
    return (
      <Container maxW="6xl" py={8}>
        <Alert status="error">
          <AlertIcon />
          Không thể tải thông tin profile
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxW="6xl" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Header Profile */}
        <Card bg="background.secondary" shadow="lg">
          <CardBody>
            <Flex
              direction={{ base: "column", md: "row" }}
              align="center"
              gap={6}
            >
              <Box position="relative">
                <Avatar
                  size="2xl"
                  src={profileData.user.avatarUrl}
                  name={
                    profileData.user.displayName || profileData.user.username
                  }
                />
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  display="none"
                  id="avatar-upload"
                />
                <IconButton
                  as="label"
                  htmlFor="avatar-upload"
                  icon={<FiCamera />}
                  size="sm"
                  colorScheme="brand"
                  rounded="full"
                  position="absolute"
                  bottom={0}
                  right={0}
                  cursor="pointer"
                  isLoading={uploadingAvatar}
                  loadingText=""
                />
              </Box>
              <VStack
                align={{ base: "center", md: "start" }}
                spacing={3}
                flex={1}
              >
                <Heading size="xl" color="brand.accent">
                  {profileData.user.displayName || profileData.user.username}
                </Heading>
                <Text fontSize="lg" color="gray.400">
                  @{profileData.user.username}
                </Text>
                <HStack spacing={4} wrap="wrap">
                  <HStack>
                    <Icon as={FiMail} color="brand.accent" />
                    <Text>{profileData.user.email}</Text>
                  </HStack>
                  <HStack>
                    <Icon as={FiCalendar} color="brand.accent" />
                    <Text>
                      Tham gia từ {formatDate(profileData.user.createdAt)}
                    </Text>
                  </HStack>
                  <Badge
                    colorScheme={
                      profileData.user.role === "admin" ? "red" : "blue"
                    }
                  >
                    {profileData.user.role === "admin" ? "Admin" : "Thành viên"}
                  </Badge>
                  {profileData.user.role !== "admin" && (
                    <Badge
                      colorScheme={
                        getTrustLevelInfo(profileData.user.trustLevel).color
                      }
                    >
                      {getTrustLevelInfo(profileData.user.trustLevel).label}
                    </Badge>
                  )}
                </HStack>
              </VStack>
              <VStack spacing={2}>
                <Button
                  leftIcon={<FiEdit3 />}
                  colorScheme="blue"
                  variant="solid"
                  bg="blue.500"
                  color="white"
                  _hover={{ bg: "blue.600" }}
                  _active={{ bg: "blue.700" }}
                  onClick={() => setIsEditing(true)}
                >
                  Chỉnh sửa
                </Button>
                <Button
                  leftIcon={<FiLock />}
                  variant="outline"
                  colorScheme="brand"
                  onClick={onPasswordModalOpen}
                  size="sm"
                >
                  Đổi mật khẩu
                </Button>
              </VStack>
            </Flex>
          </CardBody>
        </Card>

        {/* Statistics */}
        <SimpleGrid columns={{ base: 1, md: 3, lg: 6 }} spacing={6}>
          <Card bg="background.secondary">
            <CardBody>
              <Flex align="center">
                <Flex
                  align="center"
                  justify="center"
                  bg="yellow.500"
                  color="white"
                  boxSize={12}
                  borderRadius="lg"
                  mr={4}
                >
                  <Icon as={FiStar} boxSize={6} />
                </Flex>
                <Box>
                  <Text fontSize="sm" color="gray.400">
                    Tổng đánh giá
                  </Text>
                  <Text fontSize="2xl" fontWeight="bold" color="brand.accent">
                    {profileData.stats?.totalReviews || 0}
                  </Text>
                </Box>
              </Flex>
            </CardBody>
          </Card>
          <Card bg="background.secondary">
            <CardBody>
              <Flex align="center">
                <Flex
                  align="center"
                  justify="center"
                  bg="blue.500"
                  color="white"
                  boxSize={12}
                  borderRadius="lg"
                  mr={4}
                >
                  <Icon as={FiMessageSquare} boxSize={6} />
                </Flex>
                <Box>
                  <Text fontSize="sm" color="gray.400">
                    Bài viết Forum
                  </Text>
                  <Text fontSize="2xl" fontWeight="bold" color="brand.accent">
                    {profileData.stats?.totalThreads || 0}
                  </Text>
                </Box>
              </Flex>
            </CardBody>
          </Card>
          <Card bg="background.secondary">
            <CardBody>
              <Flex align="center">
                <Flex
                  align="center"
                  justify="center"
                  bg="cyan.500"
                  color="white"
                  boxSize={12}
                  borderRadius="lg"
                  mr={4}
                >
                  <Icon as={FiMessageCircle} boxSize={6} />
                </Flex>
                <Box>
                  <Text fontSize="sm" color="gray.400">
                    Trả lời Forum
                  </Text>
                  <Text fontSize="2xl" fontWeight="bold" color="brand.accent">
                    {profileData.stats?.totalReplies || 0}
                  </Text>
                </Box>
              </Flex>
            </CardBody>
          </Card>
          <Card bg="background.secondary">
            <CardBody>
              <Flex align="center">
                <Flex
                  align="center"
                  justify="center"
                  bg="orange.500"
                  color="white"
                  boxSize={12}
                  borderRadius="lg"
                  mr={4}
                >
                  <Icon as={FiStar} boxSize={6} />
                </Flex>
                <Box>
                  <Text fontSize="sm" color="gray.400">
                    Điểm trung bình
                  </Text>
                  <Text fontSize="2xl" fontWeight="bold" color="brand.accent">
                    {profileData.stats?.averageRating
                      ? profileData.stats.averageRating.toFixed(1)
                      : "0.0"}
                  </Text>
                </Box>
              </Flex>
            </CardBody>
          </Card>
          <Card bg="background.secondary">
            <CardBody>
              <Flex align="center">
                <Flex
                  align="center"
                  justify="center"
                  bg="pink.500"
                  color="white"
                  boxSize={12}
                  borderRadius="lg"
                  mr={4}
                >
                  <Icon as={FiThumbsUp} boxSize={6} />
                </Flex>
                <Box>
                  <Text fontSize="sm" color="gray.400">
                    Tổng lượt thích
                  </Text>
                  <Text fontSize="2xl" fontWeight="bold" color="brand.accent">
                    {profileData.stats?.totalLikes || 0}
                  </Text>
                </Box>
              </Flex>
            </CardBody>
          </Card>
          <Card
            bg={`${getTrustLevelInfo(profileData.user.trustLevel).color}.800`}
            color="white"
            overflow="hidden"
            position="relative"
          >
            <CardBody>
              <VStack align="center" justify="center" h="100%">
                <Icon
                  as={getTrustLevelInfo(profileData.user.trustLevel).icon}
                  boxSize={10}
                  color="white"
                  position="absolute"
                  top={-3}
                  right={-3}
                  opacity={0.1}
                  transform="rotate(-15deg)"
                />
                <Text fontSize="sm" fontWeight="bold" textTransform="uppercase">
                  Cấp độ tin cậy
                </Text>
                <Text fontSize="2xl" fontWeight="bold" textAlign="center">
                  {getTrustLevelInfo(profileData.user.trustLevel).label}
                </Text>
              </VStack>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Tabs Content */}
        <Card bg="background.secondary">
          <CardBody>
            <Tabs variant="line" colorScheme="brand">
              <TabList>
                <Tab>
                  <Icon as={FiStar} mr={2} />
                  Đánh giá gần đây
                </Tab>
                <Tab>
                  <Icon as={FiMessageSquare} mr={2} />
                  Hoạt động Forum
                </Tab>
                <Tab>
                  <Icon as={FiActivity} mr={2} />
                  Lịch sử hoạt động
                </Tab>
              </TabList>

              <TabPanels>
                {/* Recent Reviews */}
                <TabPanel>
                  <VStack spacing={4} align="stretch">
                    <Heading size="md">Đánh giá phim gần đây</Heading>
                    {profileData.recentReviews?.length > 0 ? (
                      <TableContainer>
                        <Table variant="simple" size="sm">
                          <Thead>
                            <Tr>
                              <Th>Phim</Th>
                              <Th>Điểm</Th>
                              <Th>Bình luận</Th>
                              <Th>Ngày</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {profileData.recentReviews.map((review) => (
                              <Tr key={review._id}>
                                <Td>
                                  {review.movie ? (
                                    <Text
                                      fontWeight="semibold"
                                      color="brand.accent"
                                    >
                                      {review.movie.name}
                                    </Text>
                                  ) : (
                                    <Text fontStyle="italic" color="gray.500">
                                      Phim đã bị xóa
                                    </Text>
                                  )}
                                </Td>
                                <Td>
                                  <HStack>
                                    <Icon as={FiStar} color="yellow.400" />
                                    <Text>{review.rating}/5</Text>
                                  </HStack>
                                </Td>
                                <Td>
                                  <Text noOfLines={2} maxW="200px">
                                    {review.content}
                                  </Text>
                                </Td>
                                <Td>{formatDateTime(review.createdAt)}</Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Text color="gray.500" textAlign="center" py={8}>
                        Chưa có đánh giá nào
                      </Text>
                    )}
                  </VStack>
                </TabPanel>

                {/* Forum Activity */}
                <TabPanel>
                  <VStack spacing={4} align="stretch">
                    <Heading size="md">Hoạt động Forum</Heading>
                    {profileData.recentThreads?.length > 0 ? (
                      <VStack spacing={3} align="stretch">
                        {profileData.recentThreads.map((thread) => (
                          <Card
                            key={thread._id}
                            bg="background.primary"
                            size="sm"
                          >
                            <CardBody>
                              <Flex justify="space-between" align="start">
                                <VStack align="start" spacing={1} flex={1}>
                                  <Text
                                    fontWeight="semibold"
                                    color="brand.accent"
                                  >
                                    {thread.title}
                                  </Text>
                                  {thread.category && (
                                    <Badge
                                      colorScheme="purple"
                                      size="sm"
                                      mb={1}
                                    >
                                      {thread.category.name}
                                    </Badge>
                                  )}
                                  <HStack
                                    spacing={4}
                                    fontSize="sm"
                                    color="gray.400"
                                  >
                                    <HStack>
                                      <Icon as={FiMessageSquare} />
                                      <Text>
                                        {thread.replyCount || 0} trả lời
                                      </Text>
                                    </HStack>
                                    <HStack>
                                      <Icon as={FiEye} />
                                      <Text>{thread.views || 0} lượt xem</Text>
                                    </HStack>
                                  </HStack>
                                </VStack>
                                <Text fontSize="sm" color="gray.500">
                                  {formatDateTime(thread.createdAt)}
                                </Text>
                              </Flex>
                            </CardBody>
                          </Card>
                        ))}
                      </VStack>
                    ) : (
                      <Text color="gray.500" textAlign="center" py={8}>
                        Chưa có hoạt động Forum nào
                      </Text>
                    )}
                  </VStack>
                </TabPanel>

                {/* Activity History */}
                <TabPanel>
                  <VStack spacing={4} align="stretch">
                    <Heading size="md">Lịch sử hoạt động</Heading>
                    <Text color="gray.500" textAlign="center" py={8}>
                      Tính năng này sẽ được cập nhật trong phiên bản tiếp theo
                    </Text>
                  </VStack>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </CardBody>
        </Card>
      </VStack>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={isEditing}
        onClose={() => {
          setIsEditing(false);
          resetModalState();
        }}
        size="lg"
      >
        <ModalOverlay />
        <ModalContent bg="background.secondary">
          <ModalHeader>Chỉnh sửa thông tin cá nhân</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Tên hiển thị</FormLabel>
                <Input
                  value={formData.displayName}
                  onChange={(e) =>
                    setFormData({ ...formData, displayName: e.target.value })
                  }
                  placeholder="Nhập tên hiển thị"
                />
              </FormControl>
              <FormControl>
                <FormLabel>Email</FormLabel>
                <Input
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="Nhập email"
                  type="email"
                />
              </FormControl>

              {/* Avatar Section */}
              <FormControl>
                <FormLabel>Ảnh đại diện</FormLabel>
                <Tabs
                  variant="line"
                  colorScheme="blue"
                  defaultIndex={uploadMethod === "file" ? 0 : 1}
                  onChange={(index) =>
                    setUploadMethod(index === 0 ? "file" : "url")
                  }
                >
                  <TabList>
                    <Tab>Upload ảnh</Tab>
                    <Tab>Nhập URL</Tab>
                  </TabList>
                  <TabPanels>
                    <TabPanel px={0}>
                      <VStack spacing={4}>
                        {/* Preview current or selected image */}
                        <Avatar
                          size="xl"
                          src={previewUrl || profileData?.user.avatarUrl}
                          name={profileData?.user.displayName}
                        />

                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          p={1}
                        />

                        <Text fontSize="sm" color="gray.500">
                          Chọn ảnh từ máy tính (tối đa 5MB)
                        </Text>
                      </VStack>
                    </TabPanel>
                    <TabPanel px={0}>
                      <VStack spacing={4}>
                        <Avatar
                          size="xl"
                          src={formData.avatarUrl}
                          name={profileData?.user.displayName}
                        />

                        <Input
                          value={formData.avatarUrl}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              avatarUrl: e.target.value,
                            })
                          }
                          placeholder="Nhập URL ảnh đại diện"
                        />

                        <Text fontSize="sm" color="gray.500">
                          Nhập đường link ảnh từ internet
                        </Text>
                      </VStack>
                    </TabPanel>
                  </TabPanels>
                </Tabs>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              mr={3}
              onClick={() => {
                setIsEditing(false);
                resetModalState();
              }}
            >
              Hủy
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleUpdateProfile}
              isLoading={uploadingAvatar}
              loadingText="Đang lưu..."
            >
              Lưu thay đổi
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={onPasswordModalClose}
        size="md"
      >
        <ModalOverlay />
        <ModalContent bg="background.secondary">
          <ModalHeader>Đổi mật khẩu</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Mật khẩu hiện tại</FormLabel>
                <Input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      currentPassword: e.target.value,
                    })
                  }
                  placeholder="Nhập mật khẩu hiện tại"
                />
              </FormControl>
              <FormControl>
                <FormLabel>Mật khẩu mới</FormLabel>
                <Input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      newPassword: e.target.value,
                    })
                  }
                  placeholder="Nhập mật khẩu mới"
                />
              </FormControl>
              <FormControl>
                <FormLabel>Xác nhận mật khẩu mới</FormLabel>
                <Input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      confirmPassword: e.target.value,
                    })
                  }
                  placeholder="Xác nhận mật khẩu mới"
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onPasswordModalClose}>
              Hủy
            </Button>
            <Button colorScheme="brand" onClick={handleUpdatePassword}>
              Đổi mật khẩu
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default ProfilePage;
