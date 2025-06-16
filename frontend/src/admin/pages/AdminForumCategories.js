import React, { useState, useEffect } from "react";
import AdminLayout from "../components/AdminLayout";
import {
  Box,
  Heading,
  Button,
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
  Input,
  Textarea,
  Switch,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Flex,
  Spacer,
  HStack,
  VStack,
  Text,
  Select,
  Container,
  Spinner,
  Center,
  useColorModeValue,
  SimpleGrid,
  Tooltip,
} from "@chakra-ui/react";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiEyeOff,
  FiHash,
  FiMessageSquare,
  FiHelpCircle,
  FiUsers,
  FiStar,
  FiTrendingUp,
  FiBookOpen,
  FiCode,
  FiCamera,
  FiMusic,
  FiPlay,
  FiShoppingCart,
  FiHeart,
  FiGlobe,
  FiSettings,
  FiAward,
  FiTarget,
  FiZap,
  FiCoffee,
  FiTool,
  FiGift,
  FiSmile,
} from "react-icons/fi";
import { adminApiClient } from "../services/adminService";

// Danh sách icon có sẵn
const AVAILABLE_ICONS = [
  { name: "FiHash", icon: FiHash, label: "Thảo luận chung" },
  { name: "FiMessageSquare", icon: FiMessageSquare, label: "Tin nhắn" },
  { name: "FiHelpCircle", icon: FiHelpCircle, label: "Hỏi đáp" },
  { name: "FiUsers", icon: FiUsers, label: "Cộng đồng" },
  { name: "FiStar", icon: FiStar, label: "Nổi bật" },
  { name: "FiTrendingUp", icon: FiTrendingUp, label: "Xu hướng" },
  { name: "FiBookOpen", icon: FiBookOpen, label: "Học tập" },
  { name: "FiCode", icon: FiCode, label: "Lập trình" },
  { name: "FiCamera", icon: FiCamera, label: "Ảnh" },
  { name: "FiMusic", icon: FiMusic, label: "Âm nhạc" },
  { name: "FiPlay", icon: FiPlay, label: "Game & Giải trí" },
  { name: "FiShoppingCart", icon: FiShoppingCart, label: "Mua bán" },
  { name: "FiHeart", icon: FiHeart, label: "Yêu thích" },
  { name: "FiGlobe", icon: FiGlobe, label: "Quốc tế" },
  { name: "FiSettings", icon: FiSettings, label: "Cài đặt" },
  { name: "FiAward", icon: FiAward, label: "Thành tích" },
  { name: "FiTarget", icon: FiTarget, label: "Mục tiêu" },
  { name: "FiZap", icon: FiZap, label: "Nhanh" },
  { name: "FiCoffee", icon: FiCoffee, label: "Thư giãn" },
  { name: "FiTool", icon: FiTool, label: "Công cụ" },
  { name: "FiGift", icon: FiGift, label: "Quà tặng" },
  { name: "FiSmile", icon: FiSmile, label: "Vui vẻ" },
];

const AdminForumCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    icon: "FiHash", // Default icon
    color: "#007bff",
    order: 0,
    isActive: true,
    allowedRoles: ["user"],
  });

  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();
  const toast = useToast();
  const cancelRef = React.useRef();

  // Theme colors
  const bg = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const textColor = useColorModeValue("gray.800", "white");
  const secondaryTextColor = useColorModeValue("gray.600", "gray.400");
  const tableHeaderBg = useColorModeValue("gray.50", "gray.700");
  const tableHeaderColor = useColorModeValue("gray.700", "gray.300");

  // Icon picker colors
  const iconBorderColor = useColorModeValue("gray.200", "gray.600");
  const iconSelectedBg = useColorModeValue("blue.50", "blue.900");
  const iconSelectedColor = useColorModeValue("blue.600", "blue.200");
  const iconDefaultColor = useColorModeValue("gray.600", "gray.400");

  // Function để render icon từ tên
  const renderIcon = (iconName) => {
    try {
      if (!iconName) return <FiHash />;

      const iconData = AVAILABLE_ICONS.find((icon) => icon.name === iconName);
      if (iconData && iconData.icon) {
        const IconComponent = iconData.icon;
        return <IconComponent />;
      }
      return <FiHash />; // Default icon
    } catch (error) {
      console.error("Error rendering icon:", iconName, error);
      return <FiHash />; // Fallback icon
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await adminApiClient.get("/forum/categories");
      setCategories(response.data.data);
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách danh mục",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedCategory(null);
    setFormData({
      name: "",
      description: "",
      icon: "FiHash", // Default icon
      color: "#007bff",
      order: 0,
      isActive: true,
      allowedRoles: ["user"],
    });
    onOpen();
  };

  const handleEdit = (category) => {
    setSelectedCategory(category);

    // Kiểm tra icon có hợp lệ không
    const validIcon =
      category.icon &&
      AVAILABLE_ICONS.find((icon) => icon.name === category.icon)
        ? category.icon
        : "FiHash";

    setFormData({
      name: category.name,
      description: category.description || "",
      icon: validIcon,
      color: category.color || "#007bff",
      order: category.order || 0,
      isActive: category.isActive,
      allowedRoles: category.allowedRoles || ["user"],
    });
    onOpen();
  };

  const handleDelete = (category) => {
    setSelectedCategory(category);
    onDeleteOpen();
  };

  const handleSubmit = async () => {
    try {
      if (selectedCategory) {
        // Update
        await adminApiClient.put(
          `/forum/categories/${selectedCategory._id}`,
          formData
        );
        toast({
          title: "Thành công",
          description: "Cập nhật danh mục thành công",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
        // Create
        await adminApiClient.post("/forum/categories", formData);
        toast({
          title: "Thành công",
          description: "Tạo danh mục thành công",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      }
      onClose();
      fetchCategories();
    } catch (error) {
      toast({
        title: "Lỗi",
        description: error.response?.data?.message || "Có lỗi xảy ra",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await adminApiClient.delete(`/forum/categories/${selectedCategory._id}`);
      toast({
        title: "Thành công",
        description: "Xóa danh mục thành công",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      onDeleteClose();
      fetchCategories();
    } catch (error) {
      toast({
        title: "Lỗi",
        description: error.response?.data?.message || "Có lỗi xảy ra",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const toggleStatus = async (category) => {
    try {
      await adminApiClient.put(`/forum/categories/${category._id}`, {
        ...category,
        isActive: !category.isActive,
      });
      toast({
        title: "Thành công",
        description: `Đã ${
          category.isActive ? "vô hiệu hóa" : "kích hoạt"
        } danh mục`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      fetchCategories();
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể thay đổi trạng thái danh mục",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  if (loading) {
    return (
      <Center h="200px">
        <Spinner size="xl" />
      </Center>
    );
  }

  return (
    <AdminLayout
      title="📂 Quản lý Danh mục Forum"
      description="Quản lý danh mục và cấu trúc forum"
    >
      <VStack spacing={6} align="stretch">
        <Flex align="center">
          <Spacer />
          <Button
            leftIcon={<FiPlus />}
            colorScheme="blue"
            onClick={handleCreate}
          >
            Tạo danh mục mới
          </Button>
        </Flex>

        <Box bg={cardBg} shadow="md" rounded="lg" overflow="hidden">
          <Table variant="simple">
            <Thead bg={tableHeaderBg}>
              <Tr>
                <Th color={tableHeaderColor}>Thứ tự</Th>
                <Th color={tableHeaderColor}>Tên danh mục</Th>
                <Th color={tableHeaderColor}>Mô tả</Th>
                <Th color={tableHeaderColor}>Số bài viết</Th>
                <Th color={tableHeaderColor}>Trạng thái</Th>
                <Th color={tableHeaderColor}>Người tạo</Th>
                <Th color={tableHeaderColor}>Thao tác</Th>
              </Tr>
            </Thead>
            <Tbody>
              {categories.map((category) => (
                <Tr key={category._id}>
                  <Td>{category.order}</Td>
                  <Td>
                    <HStack>
                      <Box color={category.color} fontSize="16px">
                        {renderIcon(category.icon)}
                      </Box>
                      <Box w="8px" h="8px" bg={category.color} rounded="full" />
                      <Text fontWeight="medium">{category.name}</Text>
                    </HStack>
                  </Td>
                  <Td>
                    <Text noOfLines={2} maxW="200px">
                      {category.description || "Không có mô tả"}
                    </Text>
                  </Td>
                  <Td>{category.threadCount || 0}</Td>
                  <Td>
                    <Badge
                      colorScheme={category.isActive ? "green" : "red"}
                      cursor="pointer"
                      onClick={() => toggleStatus(category)}
                    >
                      {category.isActive ? "Hoạt động" : "Vô hiệu hóa"}
                    </Badge>
                  </Td>
                  <Td>
                    <Text fontSize="sm">
                      {category.createdBy?.username || "N/A"}
                    </Text>
                  </Td>
                  <Td>
                    <HStack spacing={2}>
                      <IconButton
                        icon={<FiEdit2 />}
                        size="sm"
                        colorScheme="blue"
                        variant="ghost"
                        onClick={() => handleEdit(category)}
                      />
                      <IconButton
                        icon={category.isActive ? <FiEyeOff /> : <FiEye />}
                        size="sm"
                        colorScheme="orange"
                        variant="ghost"
                        onClick={() => toggleStatus(category)}
                      />
                      <IconButton
                        icon={<FiTrash2 />}
                        size="sm"
                        colorScheme="red"
                        variant="ghost"
                        onClick={() => handleDelete(category)}
                      />
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>

        {/* Modal tạo/sửa danh mục */}
        <Modal isOpen={isOpen} onClose={onClose} size="md">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              {selectedCategory ? "Chỉnh sửa danh mục" : "Tạo danh mục mới"}
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Tên danh mục</FormLabel>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Nhập tên danh mục"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Mô tả</FormLabel>
                  <Textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Nhập mô tả danh mục"
                    rows={3}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>
                    Icon danh mục
                    <Text
                      fontSize="xs"
                      color={secondaryTextColor}
                      fontWeight="normal"
                    >
                      Chọn icon phù hợp với chủ đề danh mục
                    </Text>
                  </FormLabel>

                  {/* Preview icon được chọn */}
                  <Box
                    mb={3}
                    p={3}
                    border="1px"
                    borderColor="gray.200"
                    rounded="md"
                  >
                    <HStack>
                      <Box fontSize="20px" color={formData.color}>
                        {renderIcon(formData.icon)}
                      </Box>
                      <Text fontSize="sm">
                        {formData.icon
                          ? AVAILABLE_ICONS.find(
                              (icon) => icon.name === formData.icon
                            )?.label || formData.icon
                          : "Chưa chọn icon"}
                      </Text>
                    </HStack>
                  </Box>

                  {/* Icon picker */}
                  <SimpleGrid columns={6} spacing={2}>
                    {AVAILABLE_ICONS.map((iconData) => {
                      const IconComponent = iconData.icon;
                      const isSelected = formData.icon === iconData.name;

                      return (
                        <Tooltip key={iconData.name} label={iconData.label}>
                          <Box
                            p={3}
                            border="2px"
                            borderColor={
                              isSelected ? "blue.500" : iconBorderColor
                            }
                            bg={isSelected ? iconSelectedBg : "transparent"}
                            color={
                              isSelected ? iconSelectedColor : iconDefaultColor
                            }
                            rounded="md"
                            cursor="pointer"
                            textAlign="center"
                            _hover={{
                              borderColor: "blue.300",
                              bg: iconSelectedBg,
                              color: iconSelectedColor,
                            }}
                            onClick={() =>
                              setFormData({ ...formData, icon: iconData.name })
                            }
                          >
                            <IconComponent size={20} />
                          </Box>
                        </Tooltip>
                      );
                    })}
                  </SimpleGrid>
                </FormControl>

                <FormControl>
                  <FormLabel>Màu sắc</FormLabel>
                  <Input
                    type="color"
                    value={formData.color}
                    onChange={(e) =>
                      setFormData({ ...formData, color: e.target.value })
                    }
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>
                    Thứ tự hiển thị
                    <Text
                      fontSize="xs"
                      color={secondaryTextColor}
                      fontWeight="normal"
                    >
                      Số thứ tự để sắp xếp danh mục (số nhỏ hơn hiển thị trước)
                    </Text>
                  </FormLabel>
                  <NumberInput
                    value={formData.order}
                    onChange={(value) =>
                      setFormData({ ...formData, order: parseInt(value) || 0 })
                    }
                    min={0}
                  >
                    <NumberInputField placeholder="0" />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>

                <FormControl>
                  <FormLabel>Quyền truy cập</FormLabel>
                  <Select
                    value={formData.allowedRoles[0] || "user"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        allowedRoles: [e.target.value],
                      })
                    }
                  >
                    <option value="user">Người dùng</option>
                    <option value="admin">Chỉ admin</option>
                  </Select>
                </FormControl>

                <FormControl display="flex" alignItems="center">
                  <FormLabel htmlFor="isActive" mb="0">
                    Kích hoạt danh mục
                  </FormLabel>
                  <Switch
                    id="isActive"
                    isChecked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                  />
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose}>
                Hủy
              </Button>
              <Button colorScheme="blue" onClick={handleSubmit}>
                {selectedCategory ? "Cập nhật" : "Tạo mới"}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Alert Dialog xác nhận xóa */}
        <AlertDialog
          isOpen={isDeleteOpen}
          leastDestructiveRef={cancelRef}
          onClose={onDeleteClose}
        >
          <AlertDialogOverlay>
            <AlertDialogContent>
              <AlertDialogHeader fontSize="lg" fontWeight="bold">
                Xóa danh mục
              </AlertDialogHeader>
              <AlertDialogBody>
                Bạn có chắc chắn muốn xóa danh mục "{selectedCategory?.name}"?
                Hành động này không thể hoàn tác.
              </AlertDialogBody>
              <AlertDialogFooter>
                <Button ref={cancelRef} onClick={onDeleteClose}>
                  Hủy
                </Button>
                <Button colorScheme="red" onClick={handleDeleteConfirm} ml={3}>
                  Xóa
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      </VStack>
    </AdminLayout>
  );
};

export default AdminForumCategories;
