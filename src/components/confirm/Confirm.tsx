import React, {
  useState,
  useEffect,
  useCallback,
  type ReactNode
} from 'react';
import styles from './Confirm.module.css';
import { createPortal } from 'react-dom';

// 确认弹窗配置接口
export interface ConfirmConfig {
  title?: ReactNode;
  content: ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  closeOnMaskClick?: boolean;
  showCancel?: boolean;
}

// 弹窗状态接口
interface ConfirmState extends ConfirmConfig {
  visible: boolean;
  id: string;
}

// 生成唯一ID
const generateId = () => {
  return `confirm-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
};

// Confirm组件
const Confirm = ({
  id,
  visible,
  title,
  content,
  confirmText = '确认',
  cancelText = '取消',
  onConfirm,
  onCancel,
  closeOnMaskClick = true,
  showCancel = true,
  onClose
}: ConfirmState & { onClose: (id: string) => void }) => {
  const [isConfirming, setIsConfirming] = useState(false);

  // 点击确认按钮
  const handleConfirm = useCallback(async () => {
    setIsConfirming(true);
    try {
      // 执行确认回调，支持异步操作
      await onConfirm?.();
      onClose(id);
    } finally {
      setIsConfirming(false);
    }
  }, [id, onConfirm, onClose]);

  // 点击取消按钮
  const handleCancel = useCallback(() => {
    onCancel?.();
    onClose(id);
  }, [id, onCancel, onClose]);

  // 点击遮罩层关闭
  const handleMaskClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget && closeOnMaskClick) {
        onClose(id);
      }
    },
    [id, closeOnMaskClick, onClose]
  );

  // 阻止冒泡
  const handleContentClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  // 按ESC键关闭
  useEffect(() => {
    if (!visible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose(id);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [visible, id, onClose]);

  if (!visible) return null;

  // 使用portal将弹窗渲染到body，避免样式层级问题
  return createPortal(
    <div className={styles.mask} onClick={handleMaskClick}>
      <div className={styles.confirmBox} role="dialog" aria-modal="true">
        <div className={styles.content} onClick={handleContentClick}>
          {/* 标题区域 */}
          {title && <div className={styles.title}>{title}</div>}
          
          {/* 内容区域 */}
          <div className={styles.message}>{content}</div>
          
          {/* 按钮区域 */}
          <div className={styles.footer}>
            {showCancel && (
              <button
                className={styles.cancelBtn}
                onClick={handleCancel}
                disabled={isConfirming}
              >
                {cancelText}
              </button>
            )}
            <button
              className={styles.confirmBtn}
              onClick={handleConfirm}
              disabled={isConfirming}
            >
              {isConfirming ? '处理中...' : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

// Confirm管理器组件
export const ConfirmProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [confirms, setConfirms] = useState<ConfirmState[]>([]);

  // 添加弹窗
  const openConfirm = useCallback((config: ConfirmConfig) => {
    const id = generateId();
    setConfirms(prev => [
      ...prev,
      {
        ...config,
        id,
        visible: true
      }
    ]);
    return id;
  }, []);

  // 关闭弹窗
  const closeConfirm = useCallback((id: string) => {
    setConfirms(prev => prev.filter(item => item.id !== id));
  }, []);

  // 暴露confirm API
  useEffect(() => {
    (window as any).confirmApi = {
      open: openConfirm,
      close: closeConfirm
    };
  }, [openConfirm, closeConfirm]);

  return (
    <>
      {children}
      {confirms.map(confirm => (
        <Confirm
          key={confirm.id}
          {...confirm}
          onClose={closeConfirm}
        />
      ))}
    </>
  );
};

// 工具函数，用于快速调用confirm
export const confirm = (config: ConfirmConfig) => {
  return new Promise<boolean>((resolve) => {
    const confirmApi = (window as any).confirmApi;
    if (!confirmApi) {
      console.error('请在ConfirmProvider中使用confirm函数');
      resolve(false);
      return;
    }

    const id = confirmApi.open({
      ...config,
      onConfirm: async () => {
        await config.onConfirm?.();
        resolve(true);
      },
      onCancel: () => {
        config.onCancel?.();
        resolve(false);
      }
    });

    // 防止内存泄漏，确保弹窗关闭时无论如何都resolve
    const timer = setTimeout(() => {
      confirmApi.close(id);
    }, 30000); // 30秒后自动关闭

    return () => clearTimeout(timer);
  });
};

export default Confirm;
