import React from "react";
import { FaFileAlt } from "react-icons/fa";
import styles from "./GMProtocol.module.css";
import CustomSelect from "../../components/customSelect/CustomSelect";
import Button from "../../components/button/Button";
import type { SelectOption } from "../../types";

const GMProtocol: React.FC = () => {
  const versionOptions: SelectOption[] = [
    { id: "v1.0", name: "v1.0", color: "#3b82f6" },
    { id: "v2.0", name: "v2.0", color: "#8b5cf6" },
    { id: "beta", name: "Beta", color: "#f59e0b" },
  ];

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div>
          <p className={styles.cardTag}>协议管理</p>
          <h3 className={styles.cardTitle}>协议配置与测试</h3>
          <p className={styles.cardDesc}>维护 GM 协议文档、Mock 数据与连通性检查。</p>
        </div>
        <FaFileAlt className={styles.cardIcon} />
      </div>
      <div className={styles.formRow}>
        <label>协议版本</label>
        <CustomSelect name="协议版本" options={versionOptions} value={versionOptions[0]} hideBadge />
      </div>
      <div className={styles.formRow}>
        <label>说明</label>
        <textarea className={styles.textarea} rows={4} placeholder="在此描述协议变更或测试要点" />
      </div>
      <div className={styles.inlineActions}>
        <Button color="primary" variant="solid" size="medium">
          保存配置
        </Button>
        <Button color="primary" variant="outline" size="medium">
          联通性测试
        </Button>
      </div>
    </div>
  );
};

export default GMProtocol;
