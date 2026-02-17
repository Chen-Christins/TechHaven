import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { FaTimes } from "react-icons/fa";
import styles from "./Modal.module.css";

interface ModalProps {
  visible: boolean;
  title?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: number | string;
  size?: "small" | "medium" | "large";
  closeOnMaskClick?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  visible,
  title,
  onClose,
  children,
  footer,
  width,
  size = "medium",
  closeOnMaskClick = true,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && visible) {
        onClose();
      }
    };

    if (visible) {
      document.body.style.overflow = "hidden";
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [visible, onClose]);

  if (!visible) return null;

  const handleMaskClick = (e: React.MouseEvent) => {
    if (closeOnMaskClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  const modalStyle = width ? { width, maxWidth: "95%" } : {};
  const sizeClass = size === "large" ? styles.large : size === "small" ? styles.small : "";

  return createPortal(
    <div className={styles.overlay} onClick={handleMaskClick}>
      <div className={`${styles.modal} ${sizeClass}`} style={modalStyle} ref={modalRef} role="dialog" aria-modal="true">
        <div className={styles.header}>
          <h3 className={styles.title}>{title}</h3>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <FaTimes />
          </button>
        </div>
        <div className={styles.content}>{children}</div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>,
    document.body,
  );
};

export default Modal;
