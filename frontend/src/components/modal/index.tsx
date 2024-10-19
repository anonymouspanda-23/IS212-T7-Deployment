import React, { createContext, useContext, useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@chakra-ui/react";

interface ModalContextProps {
  openModal: (
    title: string,
    bodyContent: React.ReactNode,
    footerContent?: React.ReactNode,
    onClose?: () => void // Optional callback to run on close
  ) => void;
  closeModal: () => void;
}

const ModalContext = createContext<ModalContextProps | undefined>(undefined);

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
};

export const ModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState<string>("");
  const [modalBodyContent, setModalBodyContent] = useState<React.ReactNode>(null);
  const [modalFooterContent, setModalFooterContent] = useState<React.ReactNode>(null);

  const openModal = (
    title: string,
    bodyContent: React.ReactNode,
    footerContent?: React.ReactNode,
    onClose?: () => void // Optional callback
  ) => {
    setModalTitle(title);
    setModalBodyContent(bodyContent);
    setModalFooterContent(footerContent);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  return (
    <ModalContext.Provider value={{ openModal, closeModal }}>
      {children}
      <Modal isOpen={isOpen} onClose={closeModal}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{modalTitle}</ModalHeader>
          <ModalBody>{modalBodyContent}</ModalBody>
          <ModalFooter justifyContent={"center"}>
            {modalFooterContent ? modalFooterContent : <Button onClick={closeModal}>Close</Button>}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </ModalContext.Provider>
  );
};
