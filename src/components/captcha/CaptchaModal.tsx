import React, { useState, useEffect, useRef } from "react";
import { RefreshCw, X } from "lucide-react";
import Button from "../button/Button";
import Input from "../input/Input";
import styles from "./CaptchaModal.module.css";

interface CaptchaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title: string;
}

const CaptchaModal: React.FC<CaptchaModalProps> = ({ isOpen, onClose, onSuccess, title }) => {
  const [captchaCode, setCaptchaCode] = useState("");
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 生成随机验证码
  const generateCaptcha = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaCode(code);
    drawCaptcha(code);
  };

  // 绘制验证码
  const drawCaptcha = (code: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 设置背景
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 添加干扰线
    for (let i = 0; i < 5; i++) {
      ctx.strokeStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.3)`;
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.stroke();
    }

    // 添加干扰点
    for (let i = 0; i < 50; i++) {
      ctx.fillStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.5)`;
      ctx.beginPath();
      ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, 1, 0, 2 * Math.PI);
      ctx.fill();
    }

    // 绘制文字
    ctx.font = "bold 24px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let i = 0; i < code.length; i++) {
      const x = (canvas.width / (code.length + 1)) * (i + 1);
      const y = canvas.height / 2;
      const rotation = (Math.random() - 0.5) * 0.4;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);

      // 随机颜色
      const hue = Math.random() * 360;
      ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
      ctx.fillText(code[i], 0, 0);

      ctx.restore();
    }
  };

  // 验证处理
  const handleVerify = () => {
    if (!userInput.trim()) {
      setError("请输入验证码");
      return;
    }

    if (userInput.toLowerCase() !== captchaCode.toLowerCase()) {
      setError("验证码错误，请重新输入");
      setUserInput("");
      generateCaptcha();
      return;
    }

    setIsLoading(true);
    // 模拟验证延迟
    setTimeout(() => {
      setIsLoading(false);
      onSuccess();
      handleClose();
    }, 500);
  };

  // 关闭弹窗
  const handleClose = () => {
    setUserInput("");
    setError("");
    onClose();
  };

  // 处理回车键
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleVerify();
    }
  };

  // 初始化和重新生成验证码
  useEffect(() => {
    if (isOpen) {
      generateCaptcha();
    }
  }, [isOpen]);

  // ESC键关闭
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h3>{title}</h3>
          <button onClick={handleClose} className={styles.closeBtn}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.content}>
          <p className={styles.description}>请输入下方图形验证码以继续操作</p>

          <div className={styles.captchaContainer}>
            <div className={styles.captchaWrapper}>
              <canvas ref={canvasRef} width={240} height={80} className={styles.captchaCanvas} />
            </div>
            <button onClick={generateCaptcha} className={styles.refreshBtn} title="刷新验证码">
              <RefreshCw size={16} />
            </button>
          </div>

          <div className={styles.inputGroup}>
            <Input
              type="text"
              value={userInput}
              onChange={(value) => {
                setUserInput(value);
                setError("");
              }}
              onPressEnter={handleKeyPress}
              placeholder="请输入验证码"
              maxLength={6}
              autoFocus
              size="large"
              textAlign="center"
              fontSize={18}
              fontWeight="medium"
              letterSpacing={3}
              fontFamily="Consolas, Monaco, 'Courier New', monospace"
              className={error ? styles.inputError : ""}
            />
            {error && <p className={styles.errorText}>{error}</p>}
          </div>
        </div>

        <div className={styles.footer}>
          <Button onClick={handleClose} disabled={isLoading} variant="outline" color="secondary" size="medium">
            取消
          </Button>
          <Button
            onClick={handleVerify}
            disabled={isLoading || !userInput.trim()}
            loading={isLoading}
            color="primary"
            variant="solid"
            size="medium"
          >
            确认
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CaptchaModal;
