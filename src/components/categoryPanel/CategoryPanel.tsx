import React, { useState, useEffect } from "react";
import type { Category } from "../../types/index";
import { FaChevronDown, FaChevronRight } from "react-icons/fa";
import styles from "./CategoryPanel.module.css";
import CategoryService from "../../services/categoryService";

const CategoryPanel: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
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

        // 默认展开第一个有子分类的分类
        // if (rootCategories.length > 0) {
        // 	const firstWithChildren = rootCategories.find(c => c.children && c.children.length > 0);
        // 	if (firstWithChildren) {
        // 		setExpanded({ [firstWithChildren.id]: true });
        // 	}
        // }
      } catch (error) {
        console.error("获取分类失败:", error);
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

  return (
    <div className={styles.categoryPanel}>
      <h3 className={styles.panelTitle}>文章分类</h3>
      {categories.length === 0 ? (
        <div className={styles.emptyPlaceholder}>暂无分类</div>
      ) : (
        <ul className={styles.categoryList}>
          {categories.map((category) => {
            const hasChildren = !!category.children?.length;
            const isExpanded = expanded[category.id];

            return (
              <li key={category.id} className={styles.parentItem}>
                {/* 父分类容器 */}
                <div
                  className={styles.parentCategory}
                  onClick={(e) => {
                    // 点击箭头或文字区域都能展开/折叠
                    if (hasChildren) {
                      toggleExpand(category.id);
                      e.preventDefault(); // 阻止链接跳转
                    }
                  }}
                >
                  {/* 展开/折叠按钮 */}
                  {hasChildren && (
                    <div className={styles.toggleBtn}>
                      {isExpanded ? <FaChevronDown className={styles.chevron} /> : <FaChevronRight className={styles.chevron} />}
                    </div>
                  )}

                  {/* 父分类链接 */}
                  <a href={`/category/${category.id}`} className={styles.parentLink}>
                    <span className={styles.parentName}>{category.name}</span>
                    <span className={styles.parentCount}>{category.count}</span>
                  </a>
                </div>

                {/* 子分类列表（带动画过渡） */}
                {hasChildren && (
                  <div className={`${styles.childrenContainer} ${isExpanded ? styles.expanded : styles.collapsed}`}>
                    <ul className={styles.childrenList}>
                      {category.children?.map((child) => (
                        <li key={child.id} className={styles.childItem}>
                          <a href={`/category/${category.id}/${child.id}`} className={styles.childLink}>
                            <span className={styles.childName}>{child.name}</span>
                            <span className={styles.childCount}>{child.count}</span>
                          </a>
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
