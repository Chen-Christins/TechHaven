import React, { useState, useMemo } from "react";
import { FaFolder, FaBookmark, FaRegClock, FaRegEye, FaRegUser, FaTrash, FaCheck, FaRegBookmark } from "react-icons/fa";
import styles from "./BlogPage.module.css";
import bmStyles from "./Bookmarks.module.css";
import message from "@/components/message/Message";
import { MOCK_ARTICLES, type BlogArticle } from "./mockBlog";

interface Folder {
  id: string;
  name: string;
  articleIds: string[];
}

const MOCK_FOLDERS: Folder[] = [
  { id: "all", name: "全部收藏", articleIds: ["1", "2", "4", "5"] },
  { id: "fe", name: "前端进阶", articleIds: ["1", "4"] },
  { id: "sec", name: "安全", articleIds: ["2", "7"] },
];

interface ReadLater extends BlogArticle {
  addedAt: string;
  read: boolean;
}

const INITIAL_READ_LATER: ReadLater[] = [
  { ...MOCK_ARTICLES[2], addedAt: "2026-07-11", read: false },
  { ...MOCK_ARTICLES[5], addedAt: "2026-07-09", read: false },
  { ...MOCK_ARTICLES[7], addedAt: "2026-07-05", read: true },
];

type Tab = "collections" | "readlater";

const BookmarksTab: React.FC = () => {
  const [tab, setTab] = useState<Tab>("collections");
  const [activeFolder, setActiveFolder] = useState("all");
  const [folders, setFolders] = useState<Folder[]>(MOCK_FOLDERS);
  const [readLater, setReadLater] = useState<ReadLater[]>(INITIAL_READ_LATER);

  const folderArticles = useMemo(() => {
    const f = folders.find((x) => x.id === activeFolder);
    if (!f) return [];
    return MOCK_ARTICLES.filter((a) => f.articleIds.includes(a.id));
  }, [folders, activeFolder]);

  const removeFromFolder = (articleId: string) => {
    setFolders((prev) => prev.map((f) => ({ ...f, articleIds: f.articleIds.filter((id) => id !== articleId) })));
    message.success("已移出收藏夹");
  };

  const toggleRead = (id: string) => {
    setReadLater((prev) => prev.map((r) => (r.id === id ? { ...r, read: !r.read } : r)));
  };

  const removeReadLater = (id: string) => {
    setReadLater((prev) => prev.filter((r) => r.id !== id));
    message.success("已移除");
  };

  return (
    <div className={styles.tabWrap}>
      <div className={styles.tabs}>
        <button className={`${styles.tab} ${tab === "collections" ? styles.tabActive : ""}`} onClick={() => setTab("collections")}>
          <FaFolder style={{ marginRight: 6 }} /> 收藏夹
        </button>
        <button className={`${styles.tab} ${tab === "readlater" ? styles.tabActive : ""}`} onClick={() => setTab("readlater")}>
          <FaBookmark style={{ marginRight: 6 }} /> 稍后读
          <span className={styles.tabCount}>{readLater.filter((r) => !r.read).length}</span>
        </button>
      </div>

      {tab === "collections" && (
        <div className={bmStyles.layout}>
          <aside className={bmStyles.folderList}>
            {folders.map((f) => (
              <button
                key={f.id}
                className={`${bmStyles.folderItem} ${activeFolder === f.id ? bmStyles.folderActive : ""}`}
                onClick={() => setActiveFolder(f.id)}
              >
                <FaFolder />
                <span className={bmStyles.folderName}>{f.name}</span>
                <span className={bmStyles.folderCount}>{f.articleIds.length}</span>
              </button>
            ))}
          </aside>
          <div className={styles.articleList}>
            {folderArticles.map((a) => (
              <div key={a.id} className={bmStyles.row}>
                <div className={bmStyles.rowMain}>
                  <h3 className={styles.articleTitle}>{a.title}</h3>
                  <p className={styles.articleSummary}>{a.summary}</p>
                  <div className={styles.articleMeta}>
                    <span className={styles.metaItem}>
                      <FaRegUser /> {a.author}
                    </span>
                    <span className={styles.metaItem}>{a.date}</span>
                    <span className={styles.metaItem}>
                      <FaRegEye /> {a.views}
                    </span>
                  </div>
                </div>
                <button className={bmStyles.iconBtn} title="移出收藏夹" onClick={() => removeFromFolder(a.id)}>
                  <FaTrash />
                </button>
              </div>
            ))}
            {folderArticles.length === 0 && (
              <div className={styles.empty}>
                <div className={styles.emptyIcon}>
                  <FaRegBookmark />
                </div>
                该收藏夹暂无文章
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "readlater" && (
        <div className={styles.articleList}>
          {readLater.map((r) => (
            <div key={r.id} className={`${bmStyles.row} ${r.read ? bmStyles.rowRead : ""}`}>
              <div className={bmStyles.rowMain}>
                <h3 className={styles.articleTitle}>{r.title}</h3>
                <p className={styles.articleSummary}>{r.summary}</p>
                <div className={styles.articleMeta}>
                  <span className={styles.metaItem}>
                    <FaRegClock /> 加入于 {r.addedAt}
                  </span>
                  {r.read && <span className={bmStyles.readTag}>已读</span>}
                </div>
              </div>
              <div className={bmStyles.rowActions}>
                <button
                  className={`${bmStyles.iconBtn} ${r.read ? bmStyles.iconActive : ""}`}
                  title={r.read ? "标记未读" : "标记已读"}
                  onClick={() => toggleRead(r.id)}
                >
                  <FaCheck />
                </button>
                <button className={bmStyles.iconBtn} title="移除" onClick={() => removeReadLater(r.id)}>
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
          {readLater.length === 0 && (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>
                <FaBookmark />
              </div>
              稍后读列表为空
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BookmarksTab;
