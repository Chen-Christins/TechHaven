import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'katex/dist/katex.min.css';
import 'highlight.js/styles/github-dark.css';
import styles from './ArticleView.module.css';

interface Heading {
    id: string;
    text: string;
    level: number;
}

interface ArticleViewProps {
    content: string;
    className?: string;
}

interface CodeProps {
    node?: any;
    inline?: boolean;
    className?: string;
    children?: React.ReactNode;
}

// 使用 react-markdown 期望的标题属性类型
interface HeadingComponentProps extends React.HTMLAttributes<HTMLHeadingElement> {
    level?: number;
    node?: any;
}

const ArticleView: React.FC<ArticleViewProps> = ({ content, className = '' }) => {
    const [headings, setHeadings] = useState<Heading[]>([]);
    const [activeId, setActiveId] = useState<string>('');
    const contentRef = useRef<HTMLDivElement>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);

    // 生成更安全的 ID
    const generateId = (text: string): string => {
        return text
            .toLowerCase()
            .replace(/[^a-z0-9\u4e00-\u9fa5\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    };

    // 提取标题
    useEffect(() => {
        const extractHeadings = (markdown: string): Heading[] => {
            const headingRegex = /^(#{1,6})\s+(.+)$/gm;
            const matches: Heading[] = [];
            let match;

            while ((match = headingRegex.exec(markdown)) !== null) {
                const level = match[1].length;
                const text = match[2].trim();
                const id = generateId(text);

                matches.push({ id, text, level });
            }

            return matches;
        };

        setHeadings(extractHeadings(content));
    }, [content]);

    // 设置 Intersection Observer 来跟踪活跃标题
    useEffect(() => {
        if (!contentRef.current || headings.length === 0) return;

        // 清理旧的 observer
        if (observerRef.current) {
            observerRef.current.disconnect();
        }

        const options: IntersectionObserverInit = {
            rootMargin: '-20% 0px -60% 0px',
            threshold: 0.1,
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    setActiveId(entry.target.id);
                }
            });
        }, options);

        // 观察所有标题元素
        headings.forEach((heading) => {
            const element = document.getElementById(heading.id);
            if (element) {
                observer.observe(element);
            }
        });

        observerRef.current = observer;

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [headings]);

    // 修复目录点击跳转
    const handleTocClick = useCallback((id: string, event: React.MouseEvent) => {
        event.preventDefault();

        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });

            // 更新活跃ID
            setActiveId(id);

            // 更新URL的hash（可选）
            window.history.pushState(null, '', `#${id}`);
        }
    }, []);

    // 复制代码功能
    const handleCopyCode = useCallback((code: string) => {
        navigator.clipboard.writeText(code).then(() => {
            console.log('代码已复制到剪贴板');
        });
    }, []);

    // 代码块组件
    const CodeBlock: React.FC<CodeProps> = ({ inline, className, children }) => {
        const match = /language-(\w+)/.exec(className || '');
        const code = String(children).replace(/\n$/, '');
        const language = match ? match[1] : '';

        if (inline) {
            return <code className={styles.inlineCode}>{children}</code>;
        }

        return (
            <div className={styles.codeBlock}>
                {language && (
                    <div className={styles.codeHeader}>
                        <span>{language}</span>
                        <button
                            className={styles.copyButton}
                            onClick={() => handleCopyCode(code)}
                        >
                            复制
                        </button>
                    </div>
                )}
                <SyntaxHighlighter
                    style={vscDarkPlus}
                    language={language}
                    PreTag="div"
                    showLineNumbers
                >
                    {code}
                </SyntaxHighlighter>
            </div>
        );
    };

    // 创建标题组件的简化版本
    const Heading1: React.FC<HeadingComponentProps> = ({ children, ...props }) => {
        const text = React.Children.toArray(children).join('');
        const id = generateId(text);
        return <h1 id={id} {...props}>{children}</h1>;
    };

    const Heading2: React.FC<HeadingComponentProps> = ({ children, ...props }) => {
        const text = React.Children.toArray(children).join('');
        const id = generateId(text);
        return <h2 id={id} {...props}>{children}</h2>;
    };

    const Heading3: React.FC<HeadingComponentProps> = ({ children, ...props }) => {
        const text = React.Children.toArray(children).join('');
        const id = generateId(text);
        return <h3 id={id} {...props}>{children}</h3>;
    };

    const Heading4: React.FC<HeadingComponentProps> = ({ children, ...props }) => {
        const text = React.Children.toArray(children).join('');
        const id = generateId(text);
        return <h4 id={id} {...props}>{children}</h4>;
    };

    const Heading5: React.FC<HeadingComponentProps> = ({ children, ...props }) => {
        const text = React.Children.toArray(children).join('');
        const id = generateId(text);
        return <h5 id={id} {...props}>{children}</h5>;
    };

    const Heading6: React.FC<HeadingComponentProps> = ({ children, ...props }) => {
        const text = React.Children.toArray(children).join('');
        const id = generateId(text);
        return <h6 id={id} {...props}>{children}</h6>;
    };

    const getTocItemClass = (level: number, id: string) => {
        const baseClass = styles.tocItem;
        const levelClass = level === 1 ? styles.tocItemH1 :
            level === 2 ? styles.tocItemH2 :
                styles.tocItemH3;
        const activeClass = id === activeId ? styles.active : '';

        return `${baseClass} ${levelClass} ${activeClass}`.trim();
    };

    return (
        <div className={`${styles.container} ${className}`} ref={contentRef}>
            {headings.length > 0 && (
                <aside className={styles.sidebar}>
                    <nav className={styles.toc}>
                        <div className={styles.tocTitle}>目录</div>
                        <div className={styles.tocList}>
                            {headings.map((heading) => (
                                <a
                                    key={heading.id}
                                    href={`#${heading.id}`}
                                    className={getTocItemClass(heading.level, heading.id)}
                                    onClick={(e) => handleTocClick(heading.id, e)}
                                >
                                    {heading.text}
                                </a>
                            ))}
                        </div>
                    </nav>
                </aside>
            )}
            <div className={styles.content}>
                <article className={styles.article}>
                    <div className={styles.markdownBody}>
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm, remarkMath]}
                            rehypePlugins={[rehypeHighlight, rehypeKatex]}
                            components={{
                                code: CodeBlock,
                                h1: Heading1,
                                h2: Heading2,
                                h3: Heading3,
                                h4: Heading4,
                                h5: Heading5,
                                h6: Heading6,
                            }}
                        >
                            {content}
                        </ReactMarkdown>
                    </div>
                </article>
            </div>
        </div>
    );
};

export default ArticleView;