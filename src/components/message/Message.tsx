import React, {
  useState,
  useEffect,
  createContext,
  useContext,
  type ReactNode,
  useCallback
} from 'react';
import styles from './Message.module.css';

// 消息类型定义
export type MessageType = 'success' | 'warn' | 'error' | 'info';

// 消息位置定义
export type MessagePosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

// 消息配置接口
export interface MessageConfig {
  id?: string;
  type?: MessageType;
  content: ReactNode;
  duration?: number; // 显示时长(ms)，0表示不自动关闭
  onClose?: () => void;
  position?: MessagePosition;
  isClosing?: boolean; // 新增：用于动画过渡的内部状态
}

// 消息上下文类型
interface MessageContextType {
  messages: MessageConfig[];
  addMessage: (config: Omit<MessageConfig, 'id' | 'isClosing'>) => string;
  removeMessage: (id: string) => void;
}

// 创建上下文
const MessageContext = createContext<MessageContextType | undefined>(undefined);

// 生成唯一ID
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
};

// 消息API引用
let messageApi: {
  addMessage: (config: Omit<MessageConfig, 'id' | 'isClosing'>) => string;
  removeMessage: (id: string) => void;
} | null = null;

// 消息提供者组件
export const MessageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<MessageConfig[]>([]);

  // 添加消息
  const addMessage = useCallback((config: Omit<MessageConfig, 'id' | 'isClosing'>): string => {
    const id = generateId();
    const newMessage: MessageConfig = {
      id,
      type: 'info',
      duration: 3000,
      position: 'top-right',
      ...config
    };

    setMessages(prev => [...prev, newMessage]);

    // 自动关闭 - 修正返回值类型问题
    if (newMessage.duration && newMessage.duration > 0) {
      setTimeout(() => {
        removeMessage(id);
        newMessage.onClose?.();
      }, newMessage.duration);
    }

    return id; // 始终返回id
  }, []);

  // 移除消息
  const removeMessage = useCallback((id: string) => {
    // 先添加淡出动画，再移除元素
    setMessages(prev =>
      prev.map(msg =>
        msg.id === id ? { ...msg, isClosing: true } : msg
      )
    );

    // 等待动画完成后再彻底移除
    setTimeout(() => {
      setMessages(prev => prev.filter(msg => msg.id !== id));
    }, 300);
  }, []);

  // 初始化消息API
  useEffect(() => {
    messageApi = { addMessage, removeMessage };
    return () => {
      messageApi = null;
    };
  }, [addMessage, removeMessage]);

  return (
    <MessageContext.Provider value={{ messages, addMessage, removeMessage }}>
      {children}
      <MessageContainer />
    </MessageContext.Provider>
  );
};

// 消息容器组件
const MessageContainer: React.FC = () => {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error('Message components must be used within a MessageProvider');
  }

  const { messages, removeMessage } = context;

  // 按位置分组消息
  const messagesByPosition = messages.reduce<Record<MessagePosition, MessageConfig[]>>(
    (groups, message) => {
      const position = message.position || 'top-right';
      if (!groups[position]) {
        groups[position] = [];
      }
      groups[position].push(message);
      return groups;
    },
    {} as Record<MessagePosition, MessageConfig[]>
  );

  // 获取消息图标
  const getIcon = (type: MessageType) => {
    switch (type) {
      case 'success':
        return <span className={styles.icon} style={{ color: '#52c41a' }}>✓</span>;
      case 'warn':
        return <span className={styles.icon} style={{ color: '#faad14' }}>!</span>;
      case 'error':
        return <span className={styles.icon} style={{ color: '#f5222d' }}>✕</span>;
      case 'info':
        return <span className={styles.icon} style={{ color: '#1890ff' }}>i</span>;
    }
  };

  return (
    <>
      {Object.entries(messagesByPosition).map(([position, positionMessages]) => (
        <div
          key={position}
          className={`${styles.container} ${styles[position as MessagePosition]}`}
        >
          {positionMessages.map(message => (
            <div
              key={message.id}
              className={`${styles.message} ${styles[message.type || 'info']} ${
                message.isClosing ? styles.fadeOut : ''
              }`}
            >
              {getIcon(message.type || 'info')}
              <div className={styles.content}>{message.content}</div>
              <button
                className={styles.closeBtn}
                onClick={() => {
                  removeMessage(message.id!);
                  message.onClose?.();
                }}
                aria-label="关闭消息"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      ))}
    </>
  );
};

// 消息工具函数
export const message = {
  success: (content: ReactNode, config?: Omit<MessageConfig, 'content' | 'type' | 'id' | 'isClosing'>) => {
    if (!messageApi) {
      throw new Error('请在MessageProvider中使用message函数');
    }
    return messageApi.addMessage({ ...config, content, type: 'success' });
  },
  warn: (content: ReactNode, config?: Omit<MessageConfig, 'content' | 'type' | 'id' | 'isClosing'>) => {
    if (!messageApi) {
      throw new Error('请在MessageProvider中使用message函数');
    }
    return messageApi.addMessage({ ...config, content, type: 'warn' });
  },
  error: (content: ReactNode, config?: Omit<MessageConfig, 'content' | 'type' | 'id' | 'isClosing'>) => {
    if (!messageApi) {
      throw new Error('请在MessageProvider中使用message函数');
    }
    return messageApi.addMessage({ ...config, content, type: 'error' });
  },
  info: (content: ReactNode, config?: Omit<MessageConfig, 'content' | 'type' | 'id' | 'isClosing'>) => {
    if (!messageApi) {
      throw new Error('请在MessageProvider中使用message函数');
    }
    return messageApi.addMessage({ ...config, content, type: 'info' });
  },
  close: (id: string) => {
    if (!messageApi) {
      throw new Error('请在MessageProvider中使用message函数');
    }
    messageApi.removeMessage(id);
  }
};

// 自定义Hook
export const useMessage = () => {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error('useMessage must be used within a MessageProvider');
  }
  return context;
};

export default message;
