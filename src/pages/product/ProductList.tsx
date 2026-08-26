import React from "react";
import { FaCube, FaCode, FaDownload, FaUserFriends, FaWrench, FaPuzzlePiece, FaLayerGroup } from "react-icons/fa";
import Navbar from "@/components/navbar/Navbar";
import Footer from "@/components/footer/Footer";
import BackToTop from "@/components/backToTop/BackToTop";
import styles from "./ProductList.module.css";
import { MOCK_PRODUCTS } from "./mockProducts";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  工具: <FaWrench />,
  SDK: <FaCode />,
  插件: <FaPuzzlePiece />,
  平台: <FaLayerGroup />,
};

const GRADIENTS = [styles.gradient0, styles.gradient1, styles.gradient2, styles.gradient3];

const ProductList: React.FC = () => {
  return (
    <div className={styles.container}>
      <Navbar />

      <div className={styles.mainContent}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>
            <FaCube /> 产品包
          </h1>
          <p className={styles.pageSubtitle}>我们打造的一系列软件产品与工具集</p>
        </div>

        <div className={styles.grid}>
          {MOCK_PRODUCTS.map((product, index) => (
            <div key={product.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={`${styles.cardIcon} ${GRADIENTS[index % GRADIENTS.length]}`}>
                  {CATEGORY_ICONS[product.category] || <FaCube />}
                </div>
                <div className={styles.cardTitleRow}>
                  <h3 className={styles.cardTitle}>{product.name}</h3>
                  <span className={styles.versionBadge}>{product.version}</span>
                </div>
              </div>

              <p className={styles.cardDesc}>{product.description}</p>

              <div className={styles.cardFooter}>
                <span className={styles.cardMetric}>
                  <FaUserFriends /> {product.users} 人使用
                </span>
                <a className={styles.actionLink} href={product.link} target="_blank" rel="noreferrer">
                  <FaDownload /> 下载
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Footer startYear={2025} />
      <BackToTop />
    </div>
  );
};

export default ProductList;
