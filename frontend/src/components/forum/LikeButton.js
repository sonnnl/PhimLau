import React, { useState, useEffect } from "react";
import {
  Button,
  HStack,
  Text,
  useToast,
  Tooltip,
  Icon,
} from "@chakra-ui/react";
import { FiHeart } from "react-icons/fi";
import { FaHeart } from "react-icons/fa";
import { toggleLike, getLikeStatus } from "../../services/likeService";
import { useAuth } from "../../contexts/AuthContext";

const LikeButton = ({
  targetType,
  targetId,
  initialLikeCount = 0,
  size = "sm",
  variant = "ghost",
  showCount = true,
  onLikeChange = null,
}) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const toast = useToast();

  // Fetch initial like status
  useEffect(() => {
    if (user && targetId) {
      fetchLikeStatus();
    }
  }, [user, targetId, targetType]);

  const fetchLikeStatus = async () => {
    try {
      const response = await getLikeStatus([{ targetType, targetId }]);
      const key = `${targetType}_${targetId}`;
      const status = response.data[key];

      if (status) {
        setIsLiked(status.isLiked);
        setLikeCount(status.likeCount);
      }
    } catch (error) {
      console.error("Error fetching like status:", error);
    }
  };

  const handleToggleLike = async () => {
    if (!user) {
      toast({
        title: "Yêu cầu đăng nhập",
        description: "Bạn cần đăng nhập để thích bài viết",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (isLoading) return;

    setIsLoading(true);

    try {
      const response = await toggleLike(targetType, targetId);

      setIsLiked(response.data.liked);
      setLikeCount(response.data.likeCount);

      // Callback to parent component
      if (onLikeChange) {
        onLikeChange({
          targetType,
          targetId,
          isLiked: response.data.liked,
          likeCount: response.data.likeCount,
        });
      }

      toast({
        title: response.data.liked ? "Đã thích!" : "Đã bỏ thích!",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Lỗi",
        description:
          error.response?.data?.message || "Không thể thực hiện thao tác",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const buttonColor = isLiked ? "red.500" : "gray.400";
  const hoverColor = isLiked ? "red.600" : "red.500";

  return (
    <Tooltip label={isLiked ? "Bỏ thích" : "Thích"} placement="top" hasArrow>
      <Button
        variant={variant}
        size={size}
        leftIcon={
          <Icon
            as={isLiked ? FaHeart : FiHeart}
            color={buttonColor}
            transition="all 0.2s"
          />
        }
        onClick={handleToggleLike}
        isLoading={isLoading}
        loadingText=""
        color={buttonColor}
        _hover={{
          color: hoverColor,
          transform: "scale(1.05)",
        }}
        _active={{
          transform: "scale(0.95)",
        }}
        transition="all 0.2s"
      >
        {showCount && (
          <Text fontSize={size === "xs" ? "xs" : "sm"}>{likeCount}</Text>
        )}
      </Button>
    </Tooltip>
  );
};

export default LikeButton;
