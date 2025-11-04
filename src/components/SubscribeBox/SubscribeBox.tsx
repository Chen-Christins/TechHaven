import React, { useState } from 'react';
import styles from './SubscribeBox.module.css';

const SubscribeBox: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // 邮箱验证正则
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(email)) {
      alert("请输入有效的邮箱地址！");
      return;
    }

    setIsSubmitting(true);
    // 模拟接口请求（实际项目中替换为真实接口）
    setTimeout(() => {
      alert(`订阅成功！我们将向 ${email} 发送最新文章通知。`);
      setEmail('');
      setIsSubmitting(false);
    }, 1500);
  };

  return (
    <div className={styles.subscribeBox}>
      <h3 className={styles.panelTitle}>订阅更新</h3>
      <p className={styles.subscribeDesc}>输入邮箱，获取最新文章推送</p>
      <form onSubmit={handleSubmit} className={styles.subscribeForm}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="请输入您的邮箱"
          className={styles.emailInput}
          required
          disabled={isSubmitting}
        />
        <button
          type="submit"
          className={styles.subscribeBtn}
          disabled={isSubmitting}
        >
          {isSubmitting ? "订阅中..." : "立即订阅"}
        </button>
      </form>
    </div>
  );
};

export default SubscribeBox;