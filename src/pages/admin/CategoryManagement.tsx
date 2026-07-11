import React, { useState, useEffect } from "react";
import { FaTags, FaPlus, FaEdit, FaTrash, FaFilter, FaEye, FaChartBar, FaCheckCircle, FaTimes, FaLayerGroup } from "react-icons/fa";
import CustomSelect from "@/components/customSelect/CustomSelect";
import Input from "@/components/input/Input";
import Button from "@/components/button/Button";
import Loading from "@/components/loading/Loading";
import Modal from "@/components/modal/Modal";
import { confirm } from "@/components/confirm/Confirm";
import message from "@/components/message/Message";
import type { SelectOption } from "@/types/index";
import styles from "./CategoryManagement.module.css";
import CategoryService from "@/services/categoryService";

interface Category {
  id: string | number;
  name: string;
  slug: string;
  description: string;
  color: string;
  icon?: string;
  parentId?: string | number;
  articleCount: number;
  views: number;
  createdAt: string;
  updatedAt: string;
  status: "active" | "inactive";
  children?: Category[];
  level: number;
}

interface CategoryFormData {
  name: string;
  slug: string;
  description: string;
  color: string;
  icon: string;
  parentId: string;
  status: "active" | "inactive";
}

interface CategoryStats {
  totalCategories: number;
  activeCategories: number;
  totalArticles: number;
  totalViews: number;
}

interface FilterOptions {
  search: string;
  status: string;
  sortBy: "name" | "articleCount" | "views" | "createdAt";
  sortOrder: "asc" | "desc";
}

const iconMap: Record<string, string> = {
  "": "默认",
  "💻": "技术",
  "🌟": "生活",
  "✈️": "旅行",
  "🍔": "美食",
  "🎨": "设计",
  "🎵": "音乐",
  "⚽": "运动",
  "📚": "读书",
  "📷": "摄影",
};

const CategoryManagement: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterOptions>({
    search: "",
    status: "",
    sortBy: "name",
    sortOrder: "asc",
  });
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: "",
    slug: "",
    description: "",
    color: "#4361ee",
    icon: "",
    parentId: "",
    status: "active",
  });
  const [submitting, setSubmitting] = useState(false);

  const statusOptions: SelectOption[] = [
    { id: "", name: "全部状态", color: "#6c757d" },
    { id: "active", name: "活跃", color: "#28a745" },
    { id: "inactive", name: "停用", color: "#dc3545" },
  ];

  const sortOptions: SelectOption[] = [
    { id: "name", name: "按名称", color: "#007bff" },
    { id: "articleCount", name: "按文章数", color: "#007bff" },
    { id: "views", name: "按浏览量", color: "#007bff" },
    { id: "createdAt", name: "按创建时间", color: "#007bff" },
  ];

  const iconOptions: SelectOption[] = Object.entries(iconMap).map(([value, label]) => ({
    id: value,
    name: value ? `${label} ${value}` : label,
    color: "#007bff",
  }));

  const getParentCategoryOptions = (): SelectOption[] => {
    const options: SelectOption[] = [{ id: "", name: "无（顶级分类）", color: "#6c757d" }];
    const activeCategories = categories.filter((cat) => cat.level === 0 && cat.status === "active");
    options.push(
      ...activeCategories.map((cat) => ({
        id: cat.id.toString(),
        name: cat.name,
        color: "#17a2b8",
      })),
    );
    return options;
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const response = await CategoryService.queryCategory();
      const categoryList = response.list || [];

      const mappedCategories: Category[] = categoryList.map((item: any) => ({
        id: item.id,
        name: item.name,
        slug: item.url,
        description: item.description || "",
        color: item.color,
        icon: item.icon,
        parentId: item.parent_id,
        articleCount: item.article_count || 0,
        views: item.view_count || 0,
        createdAt: item.create_time ? new Date(item.create_time * 1000).toISOString().split("T")[0] : "",
        updatedAt: item.update_time ? new Date(item.update_time * 1000).toISOString().split("T")[0] : "",
        status: item.status === 1 ? "active" : "inactive",
        level: item.parent_id ? 1 : 0,
        children: [],
      }));

      setCategories(mappedCategories);
    } catch (error) {
      console.error("加载分类失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleFilterChange = (field: keyof FilterOptions, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleSelectChange = (field: keyof FilterOptions) => {
    return (selectedOption: SelectOption | null) => {
      setFilters((prev) => ({ ...prev, [field]: selectedOption?.id || "" }));
    };
  };

  const clearFilters = () => {
    setFilters({ search: "", status: "", sortBy: "name", sortOrder: "asc" });
  };

  const openModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        slug: category.slug,
        description: category.description,
        color: category.color,
        icon: category.icon || "",
        parentId: category.parentId?.toString() || "",
        status: category.status,
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: "",
        slug: "",
        description: "",
        color: "#4361ee",
        icon: "",
        parentId: "",
        status: "active",
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCategory(null);
  };

  const saveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      message.error("请输入分类名称");
      return;
    }
    if (!formData.slug.trim()) {
      message.error("请输入URL标识");
      return;
    }
    setSubmitting(true);
    try {
      const response = await CategoryService.createCategory({
        id: editingCategory ? editingCategory.id : undefined,
        name: formData.name,
        url: formData.slug,
        color: formData.color,
        icon: formData.icon,
        description: formData.description,
        parent_id: formData.parentId,
        status: formData.status === "active" ? 1 : 0,
      });

      if (editingCategory) {
        setCategories((prev) =>
          prev.map((cat) =>
            cat.id === editingCategory.id ? { ...cat, ...formData, updatedAt: new Date().toISOString().split("T")[0] } : cat,
          ),
        );
        message.success("分类已更新");
      } else {
        const newCategory: Category = {
          id: response.id,
          name: response.name,
          slug: formData.slug,
          description: formData.description,
          color: response.color,
          icon: formData.icon,
          parentId: response.parent_id,
          articleCount: 0,
          views: 0,
          createdAt: new Date().toISOString().split("T")[0],
          updatedAt: new Date().toISOString().split("T")[0],
          status: formData.status,
          level: formData.parentId ? 1 : 0,
        };
        setCategories((prev) => [...prev, newCategory]);
        message.success("分类已创建");
      }

      closeModal();
    } catch (error) {
      message.error("保存分类失败");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteCategory = async (category: Category) => {
    const isConfirmed = await confirm({
      title: "确认删除",
      content: (
        <div>
          <p>
            确定要删除分类 "<strong>{category.name}</strong>" 吗？
          </p>
          <p style={{ color: "var(--error)" }}>注意：删除分类不会删除相关文章，但文章将失去分类归属。</p>
        </div>
      ),
      confirmText: "确认删除",
      cancelText: "取消",
    });
    if (!isConfirmed) return;

    try {
      await CategoryService.deleteCategory({ ids: String(category.id) });
      setCategories((prev) => prev.filter((cat) => cat.id !== category.id));
      message.success("分类已删除");
    } catch (error) {
      message.error("删除失败");
    }
  };

  const toggleCategoryStatus = async (category: Category) => {
    const newStatus = category.status === "active" ? "inactive" : "active";
    try {
      await CategoryService.createCategory({
        name: category.name,
        url: category.slug,
        color: category.color,
        icon: category.icon || "",
        description: category.description,
        parent_id: category.parentId,
        status: newStatus === "active" ? 1 : 0,
      });
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === category.id ? { ...cat, status: newStatus, updatedAt: new Date().toISOString().split("T")[0] } : cat,
        ),
      );
    } catch (error) {
      message.error("切换状态失败");
    }
  };

  const stats: CategoryStats = {
    totalCategories: categories.length,
    activeCategories: categories.filter((cat) => cat.status === "active").length,
    totalArticles: categories.reduce((sum, cat) => sum + cat.articleCount, 0),
    totalViews: categories.reduce((sum, cat) => sum + cat.views, 0),
  };

  const filteredCategories = categories
    .filter((cat) => {
      if (
        filters.search &&
        !cat.name.toLowerCase().includes(filters.search.toLowerCase()) &&
        !cat.description.toLowerCase().includes(filters.search.toLowerCase())
      ) {
        return false;
      }
      if (filters.status && cat.status !== filters.status) return false;
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (filters.sortBy === "name") {
        comparison = a.name.localeCompare(b.name);
      } else {
        comparison = (a[filters.sortBy] || 0) > (b[filters.sortBy] || 0) ? 1 : -1;
      }
      return filters.sortOrder === "asc" ? comparison : -comparison;
    });

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className={styles.categoryManagement}>
        <Loading text="加载分类数据中..." size="large" />
      </div>
    );
  }

  return (
    <div className={styles.categoryManagement}>
      {/* 页面头部 */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>分类管理</h1>
          <p className={styles.pageDescription}>管理博客文章分类，创建层级结构，优化内容组织</p>
        </div>
        <div className={styles.headerActions}>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => openModal()}>
            <FaPlus />
            新增分类
          </button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className={styles.statsContainer}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.primary}`}>
            <FaLayerGroup />
          </div>
          <div className={styles.statValue}>{stats.totalCategories}</div>
          <div className={styles.statLabel}>总分类数</div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.success}`}>
            <FaCheckCircle />
          </div>
          <div className={styles.statValue}>{stats.activeCategories}</div>
          <div className={styles.statLabel}>活跃分类</div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.primary}`}>
            <FaChartBar />
          </div>
          <div className={styles.statValue}>{stats.totalArticles}</div>
          <div className={styles.statLabel}>文章总数</div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.warning}`}>
            <FaEye />
          </div>
          <div className={styles.statValue}>{stats.totalViews.toLocaleString()}</div>
          <div className={styles.statLabel}>总浏览量</div>
        </div>
      </div>

      {/* 筛选区域 */}
      <div className={styles.filterSection}>
        <div className={styles.filterHeader}>
          <h3 className={styles.filterTitle}>
            <FaFilter />
            筛选条件
          </h3>
          <div className={styles.filterActions}>
            <button className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`} onClick={clearFilters}>
              清除筛选
            </button>
          </div>
        </div>
        <div className={styles.filterForm}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>搜索分类</label>
            <Input
              placeholder="分类名称或描述"
              value={filters.search}
              onChange={(value) => handleFilterChange("search", value)}
              allowClear={true}
              size="large"
              style={{ minHeight: "46px", height: "50px" }}
            />
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>分类状态</label>
            <CustomSelect
              name="分类状态"
              options={statusOptions}
              value={statusOptions.find((option) => option.id === filters.status) || null}
              onChange={handleSelectChange("status")}
              placeholder="选择状态..."
              className="adminCustomSelect"
              hideBadge={true}
            />
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>排序方式</label>
            <CustomSelect
              name="排序方式"
              options={sortOptions}
              value={sortOptions.find((option) => option.id === filters.sortBy) || null}
              onChange={handleSelectChange("sortBy")}
              placeholder="选择排序..."
              className="adminCustomSelect"
              hideBadge={true}
            />
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>排序方向</label>
            <button
              className={`${styles.btn} ${styles.btnOutline}`}
              onClick={() => setFilters((prev) => ({ ...prev, sortOrder: prev.sortOrder === "asc" ? "desc" : "asc" }))}
              style={{ minHeight: "46px", height: "50px", justifyContent: "center" }}
            >
              {filters.sortOrder === "asc" ? "升序 ↑" : "降序 ↓"}
            </button>
          </div>
        </div>
      </div>

      {/* 分类表格 */}
      <div className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <h3 className={styles.tableTitle}>分类列表</h3>
          <div className={styles.tableActions}>
            <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>共 {filteredCategories.length} 个分类</span>
          </div>
        </div>
        <table className={styles.categoriesTable}>
          <thead>
            <tr>
              <th>分类信息</th>
              <th>父级分类</th>
              <th>状态</th>
              <th>统计数据</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredCategories.length > 0 ? (
              filteredCategories.map((category) => (
                <tr key={category.id}>
                  <td>
                    <div className={styles.categoryInfo}>
                      <div className={styles.categoryIcon} style={{ backgroundColor: category.color }}>
                        {category.icon || <FaTags />}
                      </div>
                      <div className={styles.categoryDetails}>
                        <div className={styles.categoryName}>{category.name}</div>
                        <div className={styles.categorySlug}>{category.slug}</div>
                        {category.description && <div className={styles.categoryDescription}>{category.description}</div>}
                      </div>
                    </div>
                  </td>
                  <td>
                    {category.parentId ? (
                      <span className={styles.parentBadge}>{categories.find((c) => c.id === category.parentId)?.name || "-"}</span>
                    ) : (
                      <span style={{ color: "var(--text-tertiary)", fontSize: "13px" }}>顶级分类</span>
                    )}
                  </td>
                  <td>
                    <span className={`${styles.statusBadge} ${styles[category.status]}`}>
                      <span className={styles.statusIndicator}></span>
                      {category.status === "active" ? "活跃" : "停用"}
                    </span>
                  </td>
                  <td>
                    <div className={styles.statsInfo}>
                      <span>
                        <FaTags /> {category.articleCount} 篇
                      </span>
                      <span>
                        <FaEye /> {category.views.toLocaleString()}
                      </span>
                    </div>
                  </td>
                  <td>{formatDate(category.createdAt)}</td>
                  <td>
                    <div className={styles.actionButtons}>
                      <button className={`${styles.actionButton} ${styles.edit}`} title="编辑分类" onClick={() => openModal(category)}>
                        <FaEdit />
                      </button>
                      <button
                        className={`${styles.actionButton} ${styles.edit}`}
                        title={category.status === "active" ? "停用" : "启用"}
                        onClick={() => toggleCategoryStatus(category)}
                      >
                        {category.status === "active" ? <FaTimes /> : <FaCheckCircle />}
                      </button>
                      <Button
                        color="error"
                        variant="ghost"
                        size="small"
                        onClick={() => deleteCategory(category)}
                        className={styles.actionButton}
                        aria-label="删除分类"
                      >
                        <FaTrash />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    textAlign: "center",
                    padding: "40px",
                    color: "var(--text-secondary)",
                  }}
                >
                  暂无数据
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 新增/编辑模态框 */}
      <Modal
        visible={showModal}
        title={editingCategory ? "编辑分类" : "新增分类"}
        onClose={closeModal}
        width={600}
        footer={
          <>
            <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={closeModal} disabled={submitting}>
              取消
            </button>
            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={saveCategory} disabled={submitting}>
              {submitting ? "保存中..." : editingCategory ? "保存修改" : "确认创建"}
            </button>
          </>
        }
      >
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>分类名称 *</label>
          <Input
            placeholder="输入分类名称"
            value={formData.name}
            onChange={(value) => {
              setFormData((prev) => ({ ...prev, name: value, slug: value ? generateSlug(value) : "" }));
            }}
            className={styles.formInput}
            size="large"
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>URL标识 *</label>
          <Input
            placeholder="自动生成或手动输入"
            value={formData.slug}
            onChange={(value) => setFormData((prev) => ({ ...prev, slug: value }))}
            className={styles.formInput}
            size="large"
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>描述</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            className={styles.formTextarea}
            placeholder="输入分类描述"
            rows={3}
          />
        </div>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>颜色</label>
            <div className={styles.colorPickerContainer}>
              <input
                type="color"
                className={styles.colorInput}
                value={formData.color}
                onChange={(e) => setFormData((prev) => ({ ...prev, color: e.target.value }))}
              />
              <div className={styles.colorPreview} style={{ backgroundColor: formData.color }} />
            </div>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>图标</label>
            <CustomSelect
              name="图标"
              value={iconOptions.find((o) => o.id === formData.icon) || null}
              onChange={(option) => setFormData((prev) => ({ ...prev, icon: String(option?.id || "") }))}
              options={iconOptions}
              hideBadge={true}
              placeholder="选择图标"
            />
          </div>
        </div>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>父级分类</label>
            <CustomSelect
              name="父级分类"
              value={getParentCategoryOptions().find((option) => option.id === formData.parentId) || null}
              onChange={(option) => setFormData((prev) => ({ ...prev, parentId: String(option?.id || "") }))}
              options={getParentCategoryOptions()}
              hideBadge={true}
              placeholder="选择父级分类"
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>状态</label>
            <CustomSelect
              name="状态"
              value={statusOptions.find((option) => option.id === formData.status) || null}
              onChange={(option) => setFormData((prev) => ({ ...prev, status: (option?.id as "active" | "inactive") || "active" }))}
              options={statusOptions.slice(1)}
              hideBadge={true}
              placeholder="选择状态"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CategoryManagement;
