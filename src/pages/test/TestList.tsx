import React from "react";
import { useNavigate } from "react-router-dom";
import { FaFlask, FaUpload, FaShieldAlt, FaCog, FaArrowRight, FaHome } from "react-icons/fa";
import Button from "../../components/button/Button";
import styles from "./TestList.module.css";

interface TestItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  status: "ready" | "in-progress" | "completed";
  tags: string[];
}

const TestList: React.FC = () => {
  const navigate = useNavigate();

  const testItems: TestItem[] = [
    {
      id: "captcha",
      title: "图形验证码测试",
      description: "测试登录和注册场景的图形验证码功能，包括验证码生成、刷新和校验",
      icon: <FaShieldAlt />,
      path: "/test/captcha",
      status: "ready",
      tags: ["验证码", "安全性", "UI组件"],
    },
    {
      id: "chunk-upload",
      title: "分片上传测试",
      description: "测试大文件分片上传功能，包括断点续传、进度显示和错误处理",
      icon: <FaUpload />,
      path: "/test/chunk-upload",
      status: "completed",
      tags: ["文件上传", "分片", "断点续传"],
    },
    {
      id: "performance",
      title: "性能测试",
      description: "测试页面性能、组件渲染效率和资源加载优化",
      icon: <FaCog />,
      path: "/test/performance",
      status: "in-progress",
      tags: ["性能", "优化", "监控"],
    },
  ];

  const getStatusBadge = (status: TestItem["status"]) => {
    switch (status) {
      case "ready":
        return <span className={`${styles.statusBadge} ${styles.ready}`}>准备就绪</span>;
      case "in-progress":
        return <span className={`${styles.statusBadge} ${styles.inProgress}`}>开发中</span>;
      case "completed":
        return <span className={`${styles.statusBadge} ${styles.completed}`}>已完成</span>;
      default:
        return null;
    }
  };

  const handleTestClick = (path: string) => {
    navigate(path);
  };

  return (
    <div className={styles.testListContainer}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <FaFlask className={styles.headerIcon} />
            <div>
              <h1 className={styles.title}>开发测试中心</h1>
              <p className={styles.subtitle}>这里集成了各种功能测试页面，用于开发和验证新功能</p>
            </div>
          </div>

          <div className={styles.headerRight}>
            <Button color="info" variant="solid" size="small" onClick={() => navigate("/")}>
              <FaHome />
              回到首页
            </Button>
          </div>
        </div>
      </div>

      <div className={styles.testGrid}>
        {testItems.map((test) => (
          <div key={test.id} className={styles.testCard}>
            <div className={styles.cardHeader}>
              <div className={styles.iconContainer}>{test.icon}</div>
              <div className={styles.cardInfo}>
                <h3 className={styles.cardTitle}>{test.title}</h3>
                {getStatusBadge(test.status)}
              </div>
            </div>

            <p className={styles.cardDescription}>{test.description}</p>

            <div className={styles.cardTags}>
              {test.tags.map((tag, index) => (
                <span key={index} className={styles.tag}>
                  {tag}
                </span>
              ))}
            </div>

            <div className={styles.cardActions}>
              <Button
                color="primary"
                variant="outline"
                size="small"
                onClick={() => handleTestClick(test.path)}
                disabled={test.status !== "ready" && test.status !== "completed"}
              >
                进入测试
                <FaArrowRight style={{ marginLeft: "8px" }} />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.footer}>
        <p className={styles.footerText}>💡 提示：测试页面仅在开发环境下可用，生产环境不会显示这些功能</p>
      </div>
    </div>
  );
};

export default TestList;
