import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { ArticleCreateProps, ArticleFormData, Category, SelectOption, Tag } from '../../types/index';
import { FaEdit, FaEye, FaFileImport, FaInfoCircle, FaSave, FaFly, FaDivide } from 'react-icons/fa';
import styles from './ArticleCreate.module.css';
import Footer from '../../components/footer/Footer';
import Navbar from '../../components/navbar/Navbar';
import CustomSelect from '../../components/customSelect/CustomSelect';
import AddButton from '../../components/addButton/AddButton';
import BackToTop from '../../components/backToTop/BackToTop';

// 模拟数据
const initialCategories: SelectOption[] = [
    { id: 1, name: '技术', color: '#4361ee' },
    { id: 2, name: '生活', color: '#3a0ca3' },
    { id: 3, name: '旅行', color: '#7209b7' },
    { id: 4, name: '美食', color: '#f72585' },
  ];

const initialTags: Tag[] = [
    { id: 1, name: 'React', color: '#61dafb' },
    { id: 2, name: 'TypeScript', color: '#3178c6' },
    { id: 3, name: 'JavaScript', color: '#f7df1e' },
    { id: 4, name: 'CSS', color: '#1572b6' },
    { id: 5, name: 'Node.js', color: '#339933' },
];

const markdownHelpData = [
    { element: '标题', syntax: '# H1\n## H2\n### H3', example: '# 一级标题' },
    { element: '加粗', syntax: '**粗体**', example: '这是**粗体**文字' },
    { element: '斜体', syntax: '*斜体*', example: '这是*斜体*文字' },
    { element: '链接', syntax: '[文本](URL)', example: '[百度](https://www.baidu.com)' },
    { element: '图片', syntax: '![alt文本](图片URL)', example: '![logo](https://example.com/logo.png)' },
    { element: '列表', syntax: '- 项目1\n- 项目2', example: '- 第一项\n- 第二项' },
    { element: '代码块', syntax: '```语言\n代码\n```', example: '```javascript\nconsole.log("Hello");\n```' },
    { element: '引用', syntax: '> 引用内容', example: '> 这是引用内容' },
    { element: '数学公式(行内)', syntax: '$公式$', example: '勾股定理: $a^2 + b^2 = c^2$' },
    { element: '数学公式(块级)', syntax: '$$公式$$', example: '$$\n\\int_a^b f(x)dx = F(b) - F(a)\n$$' },
];

const ArticleCreate: React.FC<ArticleCreateProps> = ({
    className = '',
    onSaveDraft,
    onPublish,
    initialData
}) => {
    const [formData, setFormData] = useState<ArticleFormData>({
        title: '',
        articleType: 'original',
        category: null,
        tags: [],
        content: '',
        ...initialData
    });

    const [viewMode, setViewMode] = useState<'editor' | 'preview' | 'both'>('both');
    const [showHelpModal, setShowHelpModal] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const [isTagsOpen, setIsTagsOpen] = useState(false);
    const [categories, setCategories] = useState(initialCategories);
    const [tags, setTags] = useState(initialTags);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const categoryRef = useRef<HTMLDivElement>(null);
    const tagsRef = useRef<HTMLDivElement>(null);

    // 点击外部关闭下拉框
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) {
                setIsCategoryOpen(false);
            }
            if (tagsRef.current && !tagsRef.current.contains(event.target as Node)) {
                setIsTagsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, title: e.target.value }));
    };

    const handleTypeChange = (type: 'original' | 'repost') => {
        setFormData(prev => ({ ...prev, articleType: type }));
    };

    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, content: e.target.value }));
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const content = event.target?.result as string;
                setFormData(prev => ({ ...prev, content }));
            };
            reader.readAsText(file);
        }
    };

    const handleCategorySelect = (category: Category) => {
        setSelectedCategory(category);
        setFormData(prev => ({ ...prev, category }));
        setIsCategoryOpen(false);
    };

    const handleTagSelect = (tag: Tag) => {
        if (!selectedTags.find(t => t.id === tag.id)) {
            const newTags = [...selectedTags, tag];
            setSelectedTags(newTags);
            setFormData(prev => ({ ...prev, tags: newTags }));
        }
        setIsTagsOpen(false);
    };

    const handleRemoveTag = (tagId: string | number) => {
        const newTags = selectedTags.filter(tag => tag.id !== tagId);
        setSelectedTags(newTags);
        setFormData(prev => ({ ...prev, tags: newTags }));
    };

    const handleAddCategory = (newCategory: SelectOption) => {
        setCategories(prev => [...prev, newCategory]);
        // 自动选择新添加的分类
        setSelectedCategory(newCategory);
        setFormData(prev => ({ ...prev, category: newCategory }));
    };

    const handleAddTag = (newTag: SelectOption) => {
        setTags(prev => [...prev, newTag]);
        // 自动选择新添加的标签
        const tagToAdd: Tag = {
            id: newTag.id,
            name: newTag.name,
            color: newTag.color || '#61dafb'
        };
        if (!selectedTags.find(t => t.id === tagToAdd.id)) {
            const newTags = [...selectedTags, tagToAdd];
            setSelectedTags(newTags);
            setFormData(prev => ({ ...prev, tags: newTags }));
        }
    };

    const handleSaveDraft = () => {
        onSaveDraft?.(formData);
        // 这里可以添加保存草稿的API调用
        console.log('保存草稿:', formData);
    };

    const handlePublish = () => {
        onPublish?.(formData);
        // 这里可以添加发布文章的API调用
        console.log('发布文章:', formData);
    };

    const renderMarkdownPreview = (content: string) => {
        // 简单的Markdown预览渲染
        return content.split('\n').map((line, index) => {
            if (line.startsWith('# ')) {
                return <h1 key={index}>{line.substring(2)}</h1>;
            } else if (line.startsWith('## ')) {
                return <h2 key={index}>{line.substring(3)}</h2>;
            } else if (line.startsWith('### ')) {
                return <h3 key={index}>{line.substring(4)}</h3>;
            } else if (line.startsWith('> ')) {
                return <blockquote key={index}>{line.substring(2)}</blockquote>;
            } else if (line.startsWith('- ')) {
                return <li key={index}>{line.substring(2)}</li>;
            } else if (line.startsWith('```')) {
                return <pre key={index}><code>{line}</code></pre>;
            } else {
                return <p key={index}>{line}</p>;
            }
        });
    };

    return (
        <>
            <div className={`${styles.container} ${className}`}>
                <Navbar />

                <div className={styles.editorContainer}>
                    {/* 头部 */}
                    <div className={styles.editorHeader}>
                        <h2>
                            <Link to="/" className={styles.editorHeaderLink}>
                                创建新文章
                            </Link>
                        </h2>
                    </div>

                    {/* 文章标题 */}
                    <div className={styles.formSection}>
                        <div className={styles.formSectionTitle}>
                            <i className="bi bi-type"></i>
                            文章标题
                        </div>
                        <input
                            type="text"
                            className={styles.formControl}
                            placeholder="请输入文章标题..."
                            value={formData.title}
                            onChange={handleTitleChange}
                        />
                    </div>

                    {/* 文章类型 */}
                    <div className={styles.formSection}>
                        <div className={styles.formSectionTitle}>
                            <i className="bi bi-file-earmark"></i>
                            文章类型
                        </div>
                        <div className={styles.radioGroup}>
                            <label className={styles.radioItem}>
                                <input
                                    type="radio"
                                    className={styles.radioInput}
                                    name="article-type"
                                    value="original"
                                    checked={formData.articleType === 'original'}
                                    onChange={() => handleTypeChange('original')}
                                />
                                <span className={styles.radioLabel}>原创文章</span>
                            </label>
                            <label className={styles.radioItem}>
                                <input
                                    type="radio"
                                    className={styles.radioInput}
                                    name="article-type"
                                    value="repost"
                                    checked={formData.articleType === 'repost'}
                                    onChange={() => handleTypeChange('repost')}
                                />
                                <span className={styles.radioLabel}>转载文章</span>
                            </label>
                        </div>
                    </div>

                    {/* 文章分类 */}
                    <div className={styles.formSection}>
                        <div className={styles.formSectionTitle}>
                            <i className="bi bi-folder"></i>
                            文章分类
                            <AddButton
                                name="分类"
                                onAdd={handleAddCategory}
                            />
                        </div>
                        <div ref={categoryRef} style={{ position: 'relative' }}>
                            <CustomSelect
                                name={'分类'}
                                options={categories}
                            />
                        </div>
                    </div>

                    {/* 文章标签 */}
                    <div className={styles.formSection}>
                        <div className={styles.formSectionTitle}>
                            <i className="bi bi-tags"></i>
                            文章标签
                            <AddButton
                                name="标签"
                                onAdd={handleAddTag}
                            />
                        </div>
                        <div ref={tagsRef} style={{ position: 'relative' }}>
                            <CustomSelect
                                name={'标签'}
                                options={tags}
                            />
                        </div>
                        <div className={styles.tagsContainer}>
                            {selectedTags.map(tag => (
                                <div key={tag.id} className={styles.tagItem}>
                                    {tag.name}
                                    <button
                                        className={styles.removeTag}
                                        onClick={() => handleRemoveTag(tag.id)}
                                    >
                                        <i className="bi bi-x"></i>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 文章内容 */}
                    <div className={styles.formSection}>
                        <div className={styles.formSectionTitle}>
                            <i className="bi bi-pencil"></i>
                            文章内容
                        </div>

                        {/* 工具栏 */}
                        <div className={styles.toolbar}>
                            <div className={styles.toolbarLeft}>
                                <button
                                    className={`${styles.btn} ${styles.btnOutlinePrimary}`}
                                    onClick={handleImportClick}
                                >
                                    <FaFileImport /> 导入Markdown
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    className={styles.fileInput}
                                    accept=".md,.markdown"
                                    onChange={handleFileImport}
                                />
                                <button
                                    className={`${styles.btn} ${styles.btnOutline}`}
                                    onClick={() => setShowHelpModal(true)}
                                >
                                    <FaInfoCircle /> 语法帮助
                                </button>
                            </div>
                            <div className={styles.toolbarRight}>
                                <button
                                    className={`${styles.editorTab} ${viewMode === 'editor' ? styles.active : ''}`}
                                    onClick={() => setViewMode('editor')}
                                >
                                    <FaEdit /> 编辑
                                </button>
                                <button
                                    className={`${styles.editorTab} ${viewMode === 'preview' ? styles.active : ''}`}
                                    onClick={() => setViewMode('preview')}
                                >
                                    <FaEye /> 预览
                                </button>
                                <button
                                    className={`${styles.editorTab} ${viewMode === 'both' ? styles.active : ''}`}
                                    onClick={() => setViewMode('both')}
                                >
                                    分屏
                                </button>
                            </div>
                        </div>

                        {/* 编辑器区域 */}
                        <div className={styles.editorRow}>
                            {(viewMode === 'editor' || viewMode === 'both') && (
                                <div className={styles.editorColumn}>
                                    <textarea
                                        className={`${styles.markdownEditor} ${styles.editorContent} ${styles.active}`}
                                        placeholder="在这里输入Markdown格式的内容..."
                                        value={formData.content}
                                        onChange={handleContentChange}
                                    />
                                </div>
                            )}
                            {(viewMode === 'preview' || viewMode === 'both') && (
                                <div className={styles.editorColumn}>
                                    <div className={`${styles.markdownPreview} ${styles.editorContent} ${styles.active}`}>
                                        {renderMarkdownPreview(formData.content)}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className={styles.actionButtons}>
                        <button
                            className={`${styles.btn} ${styles.btnOutline}`}
                            onClick={handleSaveDraft}
                        >
                            <FaSave /> 保存草稿
                        </button>
                        <button
                            className={`${styles.btn} ${styles.btnPrimary}`}
                            onClick={handlePublish}
                        >
                            <FaFly /> 发布文章  
                        </button>
                    </div>
                </div>

                {/* Markdown 帮助模态框 */}
                {showHelpModal && (
                    <div className={styles.modalOverlay}>
                        <div className={styles.modalContent}>
                            <div className={styles.modalHeader}>
                                <h3 className={styles.modalTitle}>Markdown 语法帮助</h3>
                                <button
                                    className={styles.modalClose}
                                    onClick={() => setShowHelpModal(false)}
                                >
                                    ×
                                </button>
                            </div>
                            <div className={styles.modalBody}>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th>元素</th>
                                            <th>语法</th>
                                            <th>示例</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {markdownHelpData.map((item, index) => (
                                            <tr key={index}>
                                                <td>{item.element}</td>
                                                <td style={{ whiteSpace: 'pre-line' }}>{item.syntax}</td>
                                                <td style={{ whiteSpace: 'pre-line' }}>{item.example}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className={styles.modalFooter}>
                                <button
                                    className={`${styles.btn} ${styles.btnPrimary}`}
                                    onClick={() => setShowHelpModal(false)}
                                >
                                    我知道了
                                </button>
                            </div>
                        </div>
                    </div>
                )}
  
            </div>
            <Footer companyName="TechBlog" startYear={2025} />
            <BackToTop />
        </>
    );
};

export default ArticleCreate;