import React, { useState, useEffect } from "react";
import type { Category } from "../../types/index";
import { FaChevronDown, FaChevronRight } from "react-icons/fa";
import styles from "./CategoryPanel.module.css";
import CategoryService from "../../services/categoryService";
import Skeleton from "../skeleton/Skeleton";

interface CategoryPanelProps {
  selectedCategoryId?: string | number;
  onCategoryClick?: (id: string | number, name: string) => void;
}

const CategoryPanel: React.FC<CategoryPanelProps> = ({ selectedCategoryId, onCategoryClick }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await CategoryService.queryCategory();
        // @ts-ignore
        const list = response.list || [];

        // 构建分类树
        const categoryMap = new Map();
        const rootCategories: Category[] = [];

        // 第一遍遍历：创建所有分类对象
        list.forEach((item: any) => {
          categoryMap.set(item.id, {
            id: item.id,
            name: item.name,
            count: 0, // 暂时没有文章计数，设为0
            color: item.color,
            children: [],
          });
        });

        // 第二遍遍历：构建树形结构
        list.forEach((item: any) => {
          const category = categoryMap.get(item.id);
          if (item.parent_id && categoryMap.has(item.parent_id)) {
            const parent = categoryMap.get(item.parent_id);
            parent.children.push(category);
          } else {
            rootCategories.push(category);
          }
        });

        setCategories(rootCategories);
      } catch {
        // 未登录等场景下 /category/admin/query 不可用，静默展示空列表
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const toggleExpand = (categoryId: string | number) => {
    setExpanded((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const handleCategoryClick = (id: string | number, name: string) => {
    if (onCategoryClick) {
      onCategoryClick(id, name);
    }
  };

  return (
    <div className={styles.categoryPanel}>
      <h3 className={styles.panelTitle}>文章分类</h3>
      {loading ? (
        <div className={styles.emptyPlaceholder}>
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
              <Skeleton variant="text" width={100} height={16} />
              <Skeleton variant="text" width={30} height={14} />
            </div>
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className={styles.emptyPlaceholder}>暂无分类</div>
      ) : (
        <ul className={styles.categoryList}>
          {categories.map((category) => {
            const hasChildren = !!category.children?.length;
            const isExpanded = expanded[category.id];

            return (
              <li key={category.id} className={styles.parentItem}>
                {/* 父分类容器 */}
                <div className={styles.parentCategory}>
                  {/* 展开/折叠按钮 */}
                  {hasChildren ? (
                    <div className={styles.toggleBtn} onClick={() => toggleExpand(category.id)}>
                      {isExpanded ? <FaChevronDown className={styles.chevron} /> : <FaChevronRight className={styles.chevron} />}
                    </div>
                  ) : (
                    <div className={styles.toggleBtn} />
                  )}

                  {/* 父分类名称（点击筛选） */}
                  <span
                    className={`${styles.parentLink} ${selectedCategoryId === category.id ? styles.categorySelected : ""}`}
                    onClick={() => handleCategoryClick(category.id, category.name)}
                  >
                    <span className={styles.parentName}>{category.name}</span>
                    <span className={styles.parentCount}>{category.count}</span>
                  </span>
                </div>

                {/* 子分类列表（带动画过渡） */}
                {hasChildren && (
                  <div className={`${styles.childrenContainer} ${isExpanded ? styles.expanded : styles.collapsed}`}>
                    <ul className={styles.childrenList}>
                      {category.children?.map((child) => (
                        <li key={child.id} className={styles.childItem}>
                          <span
                            className={`${styles.childLink} ${selectedCategoryId === child.id ? styles.categorySelected : ""}`}
                            onClick={() => handleCategoryClick(child.id, child.name)}
                          >
                            <span className={styles.childName}>{child.name}</span>
                            <span className={styles.childCount}>{child.count}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default CategoryPanel;
