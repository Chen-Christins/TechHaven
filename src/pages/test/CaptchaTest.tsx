import React, { useState } from "react";
import CaptchaModal from "../../components/captcha/CaptchaModal";
import Button from "../../components/button/Button";
import message from "../../components/message/Message";
import styles from "./CaptchaTest.module.css";

const CaptchaTest: React.FC = () => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [verificationResult, setVerificationResult] = useState<string[]>([]);

  const addResult = (msg: string) => {
    message.success(msg.toString());
    setVerificationResult((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  const handleLoginSuccess = () => {
    addResult("登录验证码验证成功！可以继续执行登录操作");
  };

  const handleRegisterSuccess = () => {
    addResult("注册验证码验证成功！可以继续执行注册操作");
  };

  const clearResults = () => {
    setVerificationResult([]);
  };

  return (
    <div className={styles.testContainer}>
      <div className={styles.testCard}>
        <h1 className={styles.title}>图形验证码测试</h1>
        <p className={styles.description}>点击下方按钮测试不同场景的图形验证码功能</p>

        <div className={styles.buttonGroup}>
          <Button color="primary" variant="solid" size="medium" onClick={() => setIsLoginModalOpen(true)}>
            测试登录验证码
          </Button>

          <Button color="success" variant="solid" size="medium" onClick={() => setIsRegisterModalOpen(true)}>
            测试注册验证码
          </Button>

          <Button color="secondary" variant="outline" size="medium" onClick={clearResults} disabled={verificationResult.length === 0}>
            清空日志
          </Button>
        </div>

        {verificationResult.length > 0 && (
          <div className={styles.resultContainer}>
            <h3 className={styles.resultTitle}>验证日志</h3>
            <div className={styles.resultList}>
              {verificationResult.map((result, index) => (
                <div key={index} className={styles.resultItem}>
                  {result}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 登录验证码弹窗 */}
      <CaptchaModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={handleLoginSuccess}
        title="登录验证"
      />

      {/* 注册验证码弹窗 */}
      <CaptchaModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSuccess={handleRegisterSuccess}
        title="注册验证"
      />
    </div>
  );
};

export default CaptchaTest;
