import React, { useState, useEffect } from 'react';
import {
    FaTags,
    FaPlus,
    FaEdit,
    FaTrash,
    FaTimes,
    FaEye,
    FaChartBar,
    FaArrowUp,
    FaArrowDown,
    FaCheckCircle,
    FaLayerGroup
} from 'react-icons/fa';
import styles from './CategoryManagement.module.css';
import CustomSelect from '../../components/customSelect/CustomSelect';
import SearchBox from '../../components/searchBox/SearchBox';
import Button from '../../components/button/Button';
import { confirm } from '../../components/confirm/Confirm';

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
    status: 'active' | 'inactive';
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
    status: 'active' | 'inactive';
}

const CategoryManagement: React.FC = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<'name' | 'articleCount' | 'views' | 'createdAt'>('name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [isLoading, setIsLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [selectedCategories, setSelectedCategories] = useState<(string | number)[]>([]);
    const [formData, setFormData] = useState<CategoryFormData>({
        name: '',
        slug: '',
        description: '',
        color: '#4361ee',
        icon: '',
        parentId: '',
        status: 'active'
    });

    // 排序选项
    const sortOptions = [
        { id: 'name', name: '按名称' },
        { id: 'articleCount', name: '按文章数' },
        { id: 'views', name: '按浏览量' },
        { id: 'createdAt', name: '按创建时间' }
    ];

    // 状态选项
    const statusOptions = [
        { id: 'active', name: '活跃' },
        { id: 'inactive', name: '停用' }
    ];

    // 动态获取父级分类选项
    const getParentCategoryOptions = () => {
        const parentOptions = [{ id: '', name: '无（顶级分类）' }];
        const activeCategories = categories.filter(cat => cat.level === 0 && cat.status === 'active');
        parentOptions.push(...activeCategories.map(cat => ({ id: cat.id.toString(), name: cat.name })));
        return parentOptions;
    };

    // 预设颜色选项
    const colorOptions = [
        '#4361ee', '#3a0ca3', '#7209b7', '#f72585',
        '#4cc9f0', '#4895ef', '#4361ee', '#3f37c9',
        '#3a0ca3', '#240046', '#10002b', '#e63946',
        '#f77f00', '#fcbf49', '#eae2b7', '#2a9d8f',
        '#264653', '#d62828', '#003049', '#f77f00'
    ];

    // 图标选项
    const iconOptions = [
        { name: '默认', value: '' },
        { name: '技术', value: '💻' },
        { name: '生活', value: '🌟' },
        { name: '旅行', value: '✈️' },
        { name: '美食', value: '🍔' },
        { name: '设计', value: '🎨' },
        { name: '音乐', value: '🎵' },
        { name: '运动', value: '⚽' },
        { name: '读书', value: '📚' },
        { name: '摄影', value: '📷' }
    ];

    // 模拟分类数据
    const mockCategories: Category[] = [
        {
            id: 1,
            name: '前端开发',
            slug: 'frontend',
            description: 'HTML、CSS、JavaScript等前端技术相关文章',
            color: '#4361ee',
            icon: '💻',
            articleCount: 456,
            views: 125678,
            createdAt: '2024-01-15',
            updatedAt: '2024-11-20',
            status: 'active',
            level: 0,
            children: [
                {
                    id: 11,
                    name: 'React',
                    slug: 'react',
                    description: 'React框架相关内容',
                    color: '#61dafb',
                    icon: '⚛️',
                    parentId: 1,
                    articleCount: 156,
                    views: 45678,
                    createdAt: '2024-02-01',
                    updatedAt: '2024-11-18',
                    status: 'active',
                    level: 1
                },
                {
                    id: 12,
                    name: 'Vue',
                    slug: 'vue',
                    description: 'Vue框架相关内容',
                    color: '#4fc08d',
                    icon: '💚',
                    parentId: 1,
                    articleCount: 89,
                    views: 23456,
                    createdAt: '2024-02-15',
                    updatedAt: '2024-11-17',
                    status: 'active',
                    level: 1
                }
            ]
        },
        {
            id: 2,
            name: '后端技术',
            slug: 'backend',
            description: '服务器端编程相关技术文章',
            color: '#7209b7',
            icon: '⚙️',
            articleCount: 342,
            views: 98765,
            createdAt: '2024-01-20',
            updatedAt: '2024-11-19',
            status: 'active',
            level: 0
        },
        {
            id: 3,
            name: '开发工具',
            slug: 'tools',
            description: '各种开发工具和软件使用教程',
            color: '#f72585',
            icon: '🔧',
            articleCount: 289,
            views: 67890,
            createdAt: '2024-01-25',
            updatedAt: '2024-11-18',
            status: 'active',
            level: 0
        },
        {
            id: 4,
            name: '设计相关',
            slug: 'design',
            description: 'UI/UX设计、平面设计相关内容',
            color: '#4cc9f0',
            icon: '🎨',
            articleCount: 234,
            views: 54321,
            createdAt: '2024-02-01',
            updatedAt: '2024-11-16',
            status: 'active',
            level: 0
        },
        {
            id: 5,
            name: '其他',
            slug: 'other',
            description: '其他杂类文章',
            color: '#eae2b7',
            icon: '📝',
            articleCount: 135,
            views: 32109,
            createdAt: '2024-02-10',
            updatedAt: '2024-11-15',
            status: 'inactive',
            level: 0
        }
    ];

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        setIsLoading(true);
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 500));
        setCategories(mockCategories);
        setIsLoading(false);
    };

    // 生成slug
    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    };

    // 处理表单输入
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // 自动生成slug
        if (name === 'name') {
            setFormData(prev => ({
                ...prev,
                slug: generateSlug(value)
            }));
        }
    };

    // 打开新增/编辑模态框
    const openModal = (category?: Category) => {
        if (category) {
            setEditingCategory(category);
            setFormData({
                name: category.name,
                slug: category.slug,
                description: category.description,
                color: category.color,
                icon: category.icon || '',
                parentId: category.parentId?.toString() || '',
                status: category.status
            });
        } else {
            setEditingCategory(null);
            setFormData({
                name: '',
                slug: '',
                description: '',
                color: '#4361ee',
                icon: '',
                parentId: '',
                status: 'active'
            });
        }
        setShowModal(true);
    };

    // 关闭模态框
    const closeModal = () => {
        setShowModal(false);
        setEditingCategory(null);
    };

    // 保存分类
    const saveCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // 模拟API调用
            await new Promise(resolve => setTimeout(resolve, 1000));

            if (editingCategory) {
                // 编辑模式
                setCategories(prev => prev.map(cat =>
                    cat.id === editingCategory.id
                        ? { ...cat, ...formData, updatedAt: new Date().toISOString().split('T')[0] }
                        : cat
                ));
            } else {
                // 新增模式
                const newCategory: Category = {
                    id: Date.now(),
                    ...formData,
                    articleCount: 0,
                    views: 0,
                    createdAt: new Date().toISOString().split('T')[0],
                    updatedAt: new Date().toISOString().split('T')[0],
                    level: formData.parentId ? 1 : 0
                };
                setCategories(prev => [...prev, newCategory]);
            }

            closeModal();
        } catch (error) {
            console.error('保存分类失败:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // 删除分类
    const deleteCategories = async () => {
        await confirm({
            title: '确认删除',
            content: (
                <div>
                    <p>确定要删除选中的 {selectedCategories.length} 个分类吗？</p>
                    <p style={{ color: 'var(--danger-color)', fontWeight: 500 }}>
                        注意：删除分类不会删除相关文章，但文章将失去分类归属。
                    </p>
                </div>
            ),
            confirmText: '确认删除',
            cancelText: '取消',
            onConfirm: async () => {
                setIsLoading(true);
                try {
                    // 模拟API调用
                    await new Promise(resolve => setTimeout(resolve, 1000));

                    setCategories(prev => prev.filter(cat => !selectedCategories.includes(cat.id)));
                    setSelectedCategories([]);
                } catch (error) {
                    console.error('删除分类失败:', error);
                } finally {
                    setIsLoading(false);
                }
            }
        });
    };

    // 切换分类状态
    const toggleCategoryStatus = async (category: Category) => {
        const newStatus = category.status === 'active' ? 'inactive' : 'active';
        try {
            await new Promise(resolve => setTimeout(resolve, 500));
            setCategories(prev => prev.map(cat =>
                cat.id === category.id
                    ? { ...cat, status: newStatus, updatedAt: new Date().toISOString().split('T')[0] }
                    : cat
            ));
        } catch (error) {
            console.error('切换状态失败:', error);
        }
    };

    // 删除单个分类
    const deleteCategory = async (category: Category) => {
        await confirm({
            title: '确认删除分类',
            content: (
                <div>
                    <p>确定要删除分类 "<strong>{category.name}</strong>" 吗？</p>
                    <p style={{ color: 'var(--danger-color)', fontWeight: 500 }}>
                        注意：删除分类不会删除相关文章，但文章将失去分类归属。
                    </p>
                </div>
            ),
            confirmText: '确认删除',
            cancelText: '取消',
            onConfirm: async () => {
                setIsLoading(true);
                try {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    setCategories(prev => prev.filter(cat => cat.id !== category.id));
                } catch (error) {
                    console.error('删除分类失败:', error);
                } finally {
                    setIsLoading(false);
                }
            }
        });
    };

    // 排序和过滤分类
    const filteredAndSortedCategories = categories
        .filter(category =>
            category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            category.description.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => {
            let comparison = 0;
            const aValue = a[sortBy];
            const bValue = b[sortBy];

            if (typeof aValue === 'string' && typeof bValue === 'string') {
                comparison = aValue.localeCompare(bValue);
            } else {
                comparison = (aValue || 0) > (bValue || 0) ? 1 : -1;
            }

            return sortOrder === 'asc' ? comparison : -comparison;
        });

    
    // 统计数据
    const stats = {
        totalCategories: categories.length,
        activeCategories: categories.filter(cat => cat.status === 'active').length,
        totalArticles: categories.reduce((sum, cat) => sum + cat.articleCount, 0),
        totalViews: categories.reduce((sum, cat) => sum + cat.views, 0)
    };

    return (
        <div className={styles.categoryManagement}>
            {/* 页面头部 */}
            <div className={styles.pageHeader}>
                <div className={styles.headerLeft}>
                    <h1 className={styles.pageTitle}>
                        <FaTags />
                        分类管理
                    </h1>
                    <p className={styles.pageDescription}>
                        管理博客文章分类，创建层级结构，优化内容组织
                    </p>
                </div>
                <div className={styles.headerActions}>
                    <button
                        className={styles.addButton}
                        onClick={() => openModal()}
                    >
                        <FaPlus />
                        新增分类
                    </button>
                </div>
            </div>

            {/* 统计卡片 */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statIcon}>
                        <FaLayerGroup />
                    </div>
                    <div className={styles.statContent}>
                        <div className={styles.statValue}>{stats.totalCategories}</div>
                        <div className={styles.statLabel}>总分类数</div>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statIcon}>
                        <FaCheckCircle />
                    </div>
                    <div className={styles.statContent}>
                        <div className={styles.statValue}>{stats.activeCategories}</div>
                        <div className={styles.statLabel}>活跃分类</div>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statIcon}>
                        <FaChartBar />
                    </div>
                    <div className={styles.statContent}>
                        <div className={styles.statValue}>{stats.totalArticles}</div>
                        <div className={styles.statLabel}>文章总数</div>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statIcon}>
                        <FaEye />
                    </div>
                    <div className={styles.statContent}>
                        <div className={styles.statValue}>{stats.totalViews.toLocaleString()}</div>
                        <div className={styles.statLabel}>总浏览量</div>
                    </div>
                </div>
            </div>

            {/* 工具栏 */}
            <div className={styles.toolbar}>
                <div className={styles.toolbarLeft}>
                    <div className={styles.searchWrapper}>
                        <SearchBox
                            placeholder="搜索分类名称或描述..."
                            value={searchTerm}
                            onChange={(value) => setSearchTerm(value)}
                            onSearch={(value) => setSearchTerm(value)}
                            size="medium"
                            variant="default"
                        />
                    </div>

                    <div className={styles.filterGroup}>
                        <span className={styles.filterLabel}>排序：</span>
                        <CustomSelect
                            name="排序方式"
                            value={sortOptions.find(option => option.id === sortBy) || null}
                            onChange={(selectedOption) => setSortBy(selectedOption?.id as any)}
                            options={sortOptions}
                            hideBadge={true}
                            placeholder="选择排序方式"
                            className={styles.sortSelect}
                        />
                        <button
                            className={styles.sortButton}
                            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                        >
                            {sortOrder === 'asc' ? <FaArrowUp /> : <FaArrowDown />}
                        </button>
                    </div>

                    <div className={styles.statsInfo}>
                        <div className={styles.stat}>
                            <span className={styles.statLabel}>总计</span>
                            <span className={styles.statValue}>{filteredAndSortedCategories.length}</span>
                        </div>
                        <div className={styles.stat}>
                            <span className={styles.statLabel}>已选</span>
                            <span className={styles.statValue}>{selectedCategories.length}</span>
                        </div>
                    </div>
                </div>

                <div className={styles.toolbarRight}>
                    {selectedCategories.length > 0 && (
                        <Button
                            className={styles.deleteButton}
                            onClick={deleteCategories}
                            color='error'
                        >
                            <FaTrash />
                            删除 ({selectedCategories.length})
                        </Button>
                    )}
                </div>
            </div>

            {/* 分类列表 */}
            <div className={styles.categoryList}>
                {isLoading ? (
                    <div className={styles.loading}>
                        <div className={styles.loadingSpinner}></div>
                        <p>加载中...</p>
                    </div>
                ) : filteredAndSortedCategories.length === 0 ? (
                    <div className={styles.emptyState}>
                        <FaTags className={styles.emptyIcon} />
                        <h3>暂无分类数据</h3>
                        <p>点击"新增分类"按钮创建第一个分类</p>
                    </div>
                ) : (
                    <div className={styles.categoryGrid}>
                        {filteredAndSortedCategories.map(category => (
                            <div
                                key={category.id}
                                className={`${styles.categoryCard} ${category.status === 'inactive' ? styles.inactive : ''}`}
                            >
                                <div className={styles.categoryHeader}>
                                    <div className={styles.categoryInfo}>
                                        <div className={styles.categoryIcon} style={{ backgroundColor: category.color }}>
                                            {category.icon || <FaTags />}
                                        </div>
                                        <div>
                                            <h3 className={styles.categoryName}>{category.name}</h3>
                                            <p className={styles.categorySlug}>/{category.slug}</p>
                                        </div>
                                    </div>
                                    <div className={styles.categoryStatus}>
                                        <span className={`${styles.statusBadge} ${styles[category.status]}`}>
                                            {category.status === 'active' ? '活跃' : '停用'}
                                        </span>
                                    </div>
                                </div>

                                <div className={styles.categoryDescription}>
                                    {category.description}
                                </div>

                                <div className={styles.categoryStats}>
                                    <div className={styles.stat}>
                                        <span className={styles.statNumber}>{category.articleCount}</span>
                                        <span className={styles.statText}>篇文章</span>
                                    </div>
                                    <div className={styles.stat}>
                                        <span className={styles.statNumber}>{category.views.toLocaleString()}</span>
                                        <span className={styles.statText}>次浏览</span>
                                    </div>
                                </div>

                                <div className={styles.categoryActions}>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <Button
                                            color="primary"
                                            variant="ghost"
                                            size="small"
                                            onClick={() => openModal(category)}
                                            className={styles.actionButton}
                                            aria-label="编辑分类"
                                        >
                                            <FaEdit />
                                        </Button>
                                        <Button
                                            color="warning"
                                            variant="ghost"
                                            size="small"
                                            onClick={() => toggleCategoryStatus(category)}
                                            className={styles.actionButton}
                                            aria-label={category.status === 'active' ? '停用分类' : '启用分类'}
                                        >
                                            {category.status === 'active' ? <FaTimes /> : <FaCheckCircle />}
                                        </Button>
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
                                    <input
                                        type="checkbox"
                                        className={styles.checkbox}
                                        checked={selectedCategories.includes(category.id)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedCategories(prev => [...prev, category.id]);
                                            } else {
                                                setSelectedCategories(prev => prev.filter(id => id !== category.id));
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 新增/编辑模态框 */}
            {showModal && (
                <div className={styles.modalOverlay} onClick={closeModal}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>
                                {editingCategory ? '编辑分类' : '新增分类'}
                            </h2>
                            <button className={styles.closeButton} onClick={closeModal}>
                                <FaTimes />
                            </button>
                        </div>

                        <form onSubmit={saveCategory} className={styles.modalForm}>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>分类名称 *</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className={styles.formInput}
                                    placeholder="输入分类名称"
                                    required
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>URL标识 *</label>
                                <input
                                    type="text"
                                    name="slug"
                                    value={formData.slug}
                                    onChange={handleInputChange}
                                    className={styles.formInput}
                                    placeholder="自动生成或手动输入"
                                    required
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>描述</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    className={styles.formTextarea}
                                    placeholder="输入分类描述"
                                    rows={3}
                                />
                            </div>

                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>颜色</label>
                                    <div className={styles.colorPicker}>
                                        {colorOptions.map(color => (
                                            <button
                                                key={color}
                                                type="button"
                                                className={`${styles.colorOption} ${formData.color === color ? styles.selected : ''}`}
                                                style={{ backgroundColor: color }}
                                                onClick={() => setFormData(prev => ({ ...prev, color }))}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>图标</label>
                                    <CustomSelect
                                        name="图标"
                                        value={iconOptions.find(icon => icon.value === formData.icon) ? { id: iconOptions.find(icon => icon.value === formData.icon)!.value, name: iconOptions.find(icon => icon.value === formData.icon)!.name } : null}
                                        onChange={(selectedOption) => setFormData(prev => ({ ...prev, icon: String(selectedOption?.id || '') }))}
                                        options={iconOptions.map(icon => ({ id: icon.value, name: `${icon.name} ${icon.value}` }))}
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
                                        value={getParentCategoryOptions().find(option => option.id === formData.parentId) || null}
                                        onChange={(selectedOption) => setFormData(prev => ({ ...prev, parentId: String(selectedOption?.id || '') }))}
                                        options={getParentCategoryOptions()}
                                        hideBadge={true}
                                        placeholder="选择父级分类"
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>状态</label>
                                    <CustomSelect
                                        name="状态"
                                        value={statusOptions.find(option => option.id === formData.status) || null}
                                        onChange={(selectedOption) => setFormData(prev => ({ ...prev, status: selectedOption?.id as 'active' | 'inactive' || 'active' }))}
                                        options={statusOptions}
                                        hideBadge={true}
                                        placeholder="选择状态"
                                    />
                                </div>
                            </div>

                            <div className={styles.modalActions}>
                                <button
                                    type="button"
                                    className={styles.cancelButton}
                                    onClick={closeModal}
                                    disabled={isLoading}
                                >
                                    取消
                                </button>
                                <button
                                    type="submit"
                                    className={styles.saveButton}
                                    disabled={isLoading}
                                >
                                    {isLoading ? '保存中...' : '保存'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CategoryManagement;