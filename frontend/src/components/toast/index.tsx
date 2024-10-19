import { useToast } from "@chakra-ui/react";
import { NotificationProvider } from "@refinedev/core";

export const useCustomNotificationProvider = (): NotificationProvider => {
  const toast = useToast();

  return {
    open: ({ message, description, key, type, ...options }: any) => {
      toast({
        id: key,
        title: message,
        description: description,
        status: type,
        position: "bottom", // Set the position to bottom
        duration: 5000,
        isClosable: true,
        ...options,
      });
    },
    close: (key) => {
      toast.close(key);
    },
  };
};
