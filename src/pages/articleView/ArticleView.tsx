import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import 'katex/dist/katex.min.css';
import styles from './ArticleView.module.css';

interface Heading {
    id: string;
    text: string;
    level: number;
}

interface ArticleViewProps {
    title: string;
    content: string;
    className?: string;
    author: string;
    views: number;
    praises: number;
    update_time: string;
    pushlish_time: string;
}


// 使用 react-markdown 期望的标题属性类型
interface HeadingComponentProps extends React.HTMLAttributes<HTMLHeadingElement> {
    level?: number;
    node?: any;
}

const ArticleView: React.FC<ArticleViewProps> = ({
    title,
    author,
    views,
    praises,
    update_time,
    pushlish_time,
    content,
    className = ''
}) => {
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

    
    // 创建标题组件
    const createHeadingComponent = (level: number) => {
        return ({ children, ...props }: HeadingComponentProps) => {
            const text = React.Children.toArray(children).join('');
            const id = generateId(text);

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

    // 简化段落组件 - 不要干预代码块处理
    const ParagraphComponent: React.FC<React.HTMLAttributes<HTMLParagraphElement> & { node?: any }> =
        ({ children, ...props }) => {
        return <p {...props}>{children}</p>;
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
                    <h1 className={styles.title}>{title}</h1>
                    <div className={styles.articleMeta}>
                        <span>发布时间: {pushlish_time}</span>
                        <span>作者: {author}</span>
                        <span>阅读量: {views}</span>
                        <span>点赞量: {praises}</span>
                        <span>更新时间: {update_time}</span>
                    </div>
                    <div className={styles.markdownBody}>
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm, remarkMath]}
                            rehypePlugins={[rehypeKatex]}
                            components={{
                                // 暂时移除自定义 code 组件，使用默认处理
                                // code: CodeBlock,
                                p: ParagraphComponent,
                                h1: createHeadingComponent(1),
                                h2: createHeadingComponent(2),
                                h3: createHeadingComponent(3),
                                h4: createHeadingComponent(4),
                                h5: createHeadingComponent(5),
                                h6: createHeadingComponent(6),
                                // 只对代码块进行自定义处理
                                code: ({ className, children }) => {
                                    const codeContent = String(children || '');
                                    const language = className?.replace('language-', '') || '';

                                    // 如果没有语言标识，认为是行内代码
                                    if (!className) {
                                        return <code className={styles.inlineCode}>{codeContent}</code>;
                                    }

                                    // 有语言标识的是块级代码
                                    return (
                                        <div className={styles.codeBlockWrapper}>
                                            <div className={styles.codeHeader}>
                                                <span className={styles.languageTag}>{language}</span>
                                                <button
                                                    className={styles.copyButton}
                                                    onClick={() => handleCopyCode(codeContent)}
                                                >
                                                    复制
                                                </button>
                                            </div>
                                            <SyntaxHighlighter
                                                style={vscDarkPlus}
                                                language={language}
                                                PreTag="div"
                                                showLineNumbers={true}
                                                customStyle={{
                                                    margin: 0,
                                                    borderRadius: '0 0 8px 8px',
                                                    fontSize: '14px'
                                                }}
                                            >
                                                {codeContent}
                                            </SyntaxHighlighter>
                                        </div>
                                    );
                                }
                            }}
                            skipHtml={false}
                            unwrapDisallowed={false}
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