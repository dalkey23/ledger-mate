import React, { useEffect } from "react";
import styled from "@emotion/styled";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children?: React.ReactNode;
  maxWidth?: number | string;
};

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 9999;
`;

const Backdrop = styled.div`
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
`;

const Panel = styled.div<{ $maxWidth: number | string }>`
  position: absolute;
  left: 50%;
  top: 50%;
  width: 100%;
  max-width: ${({ $maxWidth }) => (typeof $maxWidth === "number" ? `${$maxWidth}px` : $maxWidth)};
  transform: translate(-50%, -50%);
  border-radius: 16px;
  background: ${({ theme }) => theme.colors.bg};
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.18);
  overflow: hidden;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const Title = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
`;

const CloseButton = styled.button`
  border: 0;
  background: transparent;
  border-radius: 8px;
  padding: 4px;
  line-height: 1;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.text};

  &:hover {
    background: ${({ theme }) => theme.colors.surface};
  }
`;

const Body = styled.div`
  padding: 20px;
`;

const Modal: React.FC<ModalProps> = ({ open, onClose, title, children, maxWidth = 640 }) => {
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <Overlay onClick={onClose}>
      <Backdrop />
      <Panel
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        $maxWidth={maxWidth}
        onClick={(e) => e.stopPropagation()}
      >
        <Header>
          <Title id="modal-title">{title}</Title>
          <CloseButton onClick={onClose} aria-label="닫기">✕</CloseButton>
        </Header>
        <Body>{children}</Body>
      </Panel>
    </Overlay>
  );
};

export default Modal;
