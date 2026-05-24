import React from "react";
import { FaTools } from "react-icons/fa";
import styles from "./MaintenancePage.module.css";

const MaintenancePage: React.FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.icon}>
          <FaTools />
        </div>
        <h1 className={styles.title}>系统维护中</h1>
        <p className={styles.description}>站点正在维护，暂时无法访问。请稍后再来。</p>
      </div>
    </div>
  );
};

export default MaintenancePage;
