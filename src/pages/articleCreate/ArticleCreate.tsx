import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import mermaid from 'mermaid';
import 'katex/dist/katex.min.css';
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
    { element: 'Mermaid图表', syntax: '```mermaid\n图表代码\n```', example: '```mermaid\ngraph TD\n    A[开始] --> B{条件判断}\n    B -->|是| C[执行操作]\n    B -->|否| D[结束]\n    C --> D\n```' },
];

// 初始化 Mermaid
mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    securityLevel: 'loose',
    fontFamily: 'monospace',
    fontSize: 14,
    flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis'
    }
});

// Mermaid 图表组件
const MermaidComponent: React.FC<{ code: string }> = ({ code }) => {
    const elementRef = useRef<HTMLDivElement>(null);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        if (elementRef.current) {
            try {
                const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                mermaid.render(id, code).then(({ svg }) => {
                    if (elementRef.current) {
                        elementRef.current.innerHTML = svg;
                    }
                }).catch((err) => {
                    setError(`Mermaid 渲染错误: ${err.message}`);
                });
            } catch (err: any) {
                setError(`Mermaid 渲染错误: ${err.message}`);
            }
        }
    }, [code]);

    if (error) {
        return (
            <div className={styles.mermaidError}>
                <div className={styles.errorMessage}>{error}</div>
                <pre className={styles.errorCode}>{code}</pre>
            </div>
        );
    }

    return <div ref={elementRef} className={styles.mermaidDiagram} />;
};

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

    // 复制成功状态管理
    const [copySuccess, setCopySuccess] = useState<string>('');
    const copyTimeoutRef = useRef<number | null>(null);

    // 处理复制功能
    const handleCopy = async (text: string, type: string = '代码') => {
        try {
            await navigator.clipboard.writeText(text);
            setCopySuccess(`${type}已复制到剪贴板`);

            // 清除之前的定时器
            if (copyTimeoutRef.current) {
                clearTimeout(copyTimeoutRef.current);
            }

            // 3秒后清除提示
            copyTimeoutRef.current = setTimeout(() => {
                setCopySuccess('');
            }, 3000);
        } catch (err) {
            setCopySuccess('复制失败，请手动复制');
            setTimeout(() => setCopySuccess(''), 3000);
        }
    };

    // 清理定时器
    useEffect(() => {
        return () => {
            if (copyTimeoutRef.current) {
                clearTimeout(copyTimeoutRef.current);
            }
        };
    }, []);

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

    // 创建标题组件工厂函数
    const createHeadingComponent = (level: number) => {
        return ({ children, ...props }: any) => {
            const text = React.Children.toArray(children).join('');
            const id = text.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5\s-]/g, '').replace(/\s+/g, '-');

            switch (level) {
                case 1:
                    return <h1 id={id} {...props}>{children}</h1>;
                case 2:
                    return <h2 id={id} {...props}>{children}</h2>;
                case 3:
                    return <h3 id={id} {...props}>{children}</h3>;
                case 4:
                    return <h4 id={id} {...props}>{children}</h4>;
                case 5:
                    return <h5 id={id} {...props}>{children}</h5>;
                case 6:
                    return <h6 id={id} {...props}>{children}</h6>;
                default:
                    return <h2 id={id} {...props}>{children}</h2>;
            }
        };
    };

    // 简化段落组件
    const ParagraphComponent: React.FC<React.HTMLAttributes<HTMLParagraphElement> & { node?: any }> =
        ({ children, ...props }) => {
            return <p {...props}>{children}</p>;
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
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm, remarkMath]}
                                            rehypePlugins={[rehypeKatex]}
                                            components={{
                                                p: ParagraphComponent,
                                                h1: createHeadingComponent(1),
                                                h2: createHeadingComponent(2),
                                                h3: createHeadingComponent(3),
                                                h4: createHeadingComponent(4),
                                                h5: createHeadingComponent(5),
                                                h6: createHeadingComponent(6),
                                                code: ({ className, children }) => {
                                                    const codeContent = String(children || '');
                                                    const language = className?.replace('language-', '') || '';

                                                    // 如果没有语言标识，认为是行内代码
                                                    if (!className) {
                                                        return <code className={styles.inlineCode}>{codeContent}</code>;
                                                    }

                                                    // 如果是 Mermaid 代码，使用 MermaidComponent
                                                    if (language === 'mermaid') {
                                                        return (
                                                            <div className={styles.mermaidWrapper}>
                                                                <div className={styles.codeHeader}>
                                                                    <span className={styles.languageTag}>Mermaid 图表</span>
                                                                    <button
                                                                        className={styles.copyButton}
                                                                        onClick={() => navigator.clipboard.writeText(codeContent)}
                                                                    >
                                                                        复制代码
                                                                    </button>
                                                                </div>
                                                                <MermaidComponent code={codeContent.trim()} />
                                                            </div>
                                                        );
                                                    }

                                                    // 其他语言标识的是块级代码
                                                    return (
                                                        <div className={styles.codeBlockWrapper}>
                                                            <div className={styles.codeHeader}>
                                                                <span className={styles.languageTag}>{language}</span>
                                                                <button
                                                                    className={styles.copyButton}
                                                                    onClick={() => navigator.clipboard.writeText(codeContent)}
                                                                >
                                                                    复制
                                                                </button>
                                                            </div>
                                                            <pre className={styles.codeBlock}>
                                                                <code>{codeContent}</code>
                                                            </pre>
                                                        </div>
                                                    );
                                                }
                                            }}
                                        >
                                            {formData.content}
                                        </ReactMarkdown>
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
                                                <td className={styles.exampleCell}>
                                                    <div className={styles.markdownExample}>
                                                        <ReactMarkdown
                                                            remarkPlugins={[remarkGfm, remarkMath]}
                                                            rehypePlugins={[rehypeKatex]}
                                                            components={{
                                                                p: ParagraphComponent,
                                                                h1: createHeadingComponent(1),
                                                                h2: createHeadingComponent(2),
                                                                h3: createHeadingComponent(3),
                                                                h4: createHeadingComponent(4),
                                                                h5: createHeadingComponent(5),
                                                                h6: createHeadingComponent(6),
                                                                code: ({ className, children }) => {
                                                                    const codeContent = String(children || '');
                                                                    const language = className?.replace('language-', '') || '';

                                                                    // 如果没有语言标识，认为是行内代码
                                                                    if (!className) {
                                                                        return <code className={styles.inlineCode}>{codeContent}</code>;
                                                                    }

                                                                    // 如果是 Mermaid 代码，使用 MermaidComponent
                                                                    if (language === 'mermaid') {
                                                                        return (
                                                                            <div className={styles.mermaidWrapper}>
                                                                                <div className={styles.codeHeader}>
                                                                                    <span className={styles.languageTag}>Mermaid 图表</span>
                                                                                    <button
                                                                                        className={styles.copyButton}
                                                                                        onClick={() => handleCopy(codeContent.trim(), 'Mermaid代码')}
                                                                                    >
                                                                                        复制代码
                                                                                    </button>
                                                                                </div>
                                                                                <MermaidComponent code={codeContent.trim()} />
                                                                            </div>
                                                                        );
                                                                    }

                                                                    // 其他语言标识的是块级代码
                                                                    return (
                                                                        <div className={styles.codeBlockWrapper}>
                                                                            <div className={styles.codeHeader}>
                                                                                <span className={styles.languageTag}>{language}</span>
                                                                                <button
                                                                                    className={styles.copyButton}
                                                                                    onClick={() => handleCopy(codeContent, `${language}代码`)}
                                                                                >
                                                                                    复制
                                                                                </button>
                                                                            </div>
                                                                            <pre className={styles.codeBlock}>
                                                                                <code>{codeContent}</code>
                                                                            </pre>
                                                                        </div>
                                                                    );
                                                                }
                                                            }}
                                                        >
                                                            {item.example}
                                                        </ReactMarkdown>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className={styles.modalFooter}>
                                {copySuccess && (
                                    <div className={styles.copySuccessMessage}>
                                        {copySuccess}
                                    </div>
                                )}
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