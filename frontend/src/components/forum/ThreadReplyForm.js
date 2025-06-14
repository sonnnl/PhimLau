import React, { useState } from "react";
import {
  Box,
  Heading,
  Text,
  Textarea,
  Button,
  Icon,
  Link,
  useToast,
  VStack,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { FiSend } from "react-icons/fi";
import { useAuth } from "../../contexts/AuthContext";
import { createReply as createReplyService } from "../../services/forumService";

const ThreadReplyForm = ({ threadId, onReplyCreated }) => {
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const { token, isAuthenticated } = useAuth();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      setError("Nội dung không được để trống.");
      return;
    }

    if (trimmedContent.length < 5) {
      setError("Nội dung phải có ít nhất 5 ký tự.");
      return;
    }

    if (trimmedContent.length > 2000) {
      setError("Nội dung không được vượt quá 2000 ký tự.");
      return;
    }

    setIsLoading(true);

    try {
      const newReply = await createReplyService(
        threadId,
        { content: trimmedContent },
        token
      );

      // Reset form
      setContent("");
      setError(null);

      // Callback để cập nhật UI
      if (onReplyCreated) {
        onReplyCreated(newReply);
      }

      toast({
        title: "Đăng trả lời thành công!",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      const errorMsg = error.message || "Có lỗi xảy ra khi đăng trả lời.";
      setError(errorMsg);

      toast({
        title: "Lỗi khi đăng trả lời",
        description: errorMsg,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <Box
        mt={8}
        p={6}
        bg="background.secondary"
        rounded="lg"
        textAlign="center"
      >
        <Text color="gray.400" mb={4}>
          Bạn cần đăng nhập để tham gia thảo luận
        </Text>
        <Button as={RouterLink} to="/login" colorScheme="orange" size="md">
          Đăng nhập
        </Button>
      </Box>
    );
  }

  return (
    <Box mt={8} p={6} bg="background.secondary" rounded="lg" shadow="md">
      <Heading size="md" mb={4} color="whiteAlpha.900">
        Trả lời thảo luận
      </Heading>

      <VStack as="form" onSubmit={handleSubmit} spacing={4} align="stretch">
        <Box>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Nhập nội dung trả lời của bạn... (tối thiểu 5 ký tự)"
            minHeight="120px"
            bg="background.primary"
            borderColor="brand.600"
            focusBorderColor="brand.accent"
            color="whiteAlpha.900"
            maxLength={2000}
            resize="vertical"
          />
          <Text fontSize="xs" color="gray.500" mt={1}>
            {content.length}/2000 ký tự
          </Text>
        </Box>

        {error && (
          <Alert status="error" size="sm" rounded="md">
            <AlertIcon />
            <Text fontSize="sm">{error}</Text>
          </Alert>
        )}

        <Button
          type="submit"
          colorScheme="orange"
          isLoading={isLoading}
          loadingText="Đang gửi..."
          leftIcon={<Icon as={FiSend} />}
          alignSelf="flex-end"
          disabled={!content.trim() || content.trim().length < 5}
        >
          Gửi trả lời
        </Button>
      </VStack>
    </Box>
  );
};

export default ThreadReplyForm;
