import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { encodeId } from "../../../utils/hashId";
import { FaUserMinus, FaUserSlash } from "react-icons/fa";
import FollowService from "../../../services/followService";
import type { FollowUser } from "../../../types/follow";
import styles from "../PersonalCenter.module.css";

const PAGE_SIZE = 20;

function formatDate(timestamp: number): string {
  if (!timestamp) return "";
  const date = new Date(timestamp * 1000);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getPageNumbers(current: number, total: number): (number | string)[] {
  const pages: (number | string)[] = [];
  if (total <= 5) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    const start = Math.max(1, current - 2);
    const end = Math.min(total, start + 4);
    if (start > 1) { pages.push(1); if (start > 2) pages.push("..."); }
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < total) { if (end < total - 1) pages.push("..."); pages.push(total); }
  }
  return pages;
}

const FollowingTab: React.FC = () => {
  const navigate = useNavigate();
  const [list, setList] = useState<FollowUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [unfollowLoading, setUnfollowLoading] = useState<Set<number>>(new Set());

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const offset = (currentPage - 1) * PAGE_SIZE;
      const data = await FollowService.getFollowingList({ offset, size: PAGE_SIZE });
      setList(data.list);
      setTotal(data.total);
    } catch {
      // 静默处理
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handleUnfollow = async (user: FollowUser) => {
    setUnfollowLoading((prev) => new Set(prev).add(user.id));
    try {
      await FollowService.unfollow(user.id);
      setList((prev) => prev.filter((u) => u.id !== user.id));
      setTotal((t) => t - 1);
    } catch {
      // 静默处理
    } finally {
      setUnfollowLoading((prev) => {
        const next = new Set(prev);
        next.delete(user.id);
        return next;
      });
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const startIndex = (currentPage - 1) * PAGE_SIZE;

  return (
    <div className={styles.contentSection}>
      <div className={styles.sectionHeader}>
        <h2>我的关注</h2>
        {total > 0 && <span className={styles.unreadBadge}>{total} 人</span>}
      </div>

      {loading ? (
        <div className={styles.notifEmpty}><span>加载中...</span></div>
      ) : list.length === 0 ? (
        <div className={styles.notifEmpty}>
          <FaUserSlash className={styles.notifEmptyIcon} />
          <span>暂无关注</span>
        </div>
      ) : (
        <div className={styles.followList}>
          {list.map((user) => (
            <div key={user.id} className={styles.followItem}>
              <div
                className={styles.followItemLeft}
                onClick={() => navigate(`/profile/${encodeId(user.id)}`)}
                style={{ cursor: "pointer" }}
              >
                <img src={user.avatar || `https://picsum.photos/id/${(user.id % 100) + 1}/80`} alt={user.name} className={styles.followAvatar} />
                <div className={styles.followItemInfo}>
                  <div className={styles.followItemName}>{user.name}</div>
                  {user.bio && <div className={styles.followItemBio}>{user.bio}</div>}
                  <div className={styles.followItemTime}>@{user.account} · {formatDate(user.create_time)} 加入</div>
                  <div className={styles.followItemStats}>
                    <span>{user.following_count ?? 0} 关注</span>
                    <span>{user.follower_count ?? 0} 粉丝</span>
                  </div>
                </div>
              </div>
              <button
                className={styles.unfollowButton}
                onClick={() => handleUnfollow(user)}
                disabled={unfollowLoading.has(user.id)}
              >
                <FaUserMinus size={12} />
                {unfollowLoading.has(user.id) ? "..." : "取消关注"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <div className={styles.paginationInfo}>
            显示 {startIndex + 1} - {Math.min(startIndex + PAGE_SIZE, total)} 条，共 {total} 条
          </div>
          <div className={styles.paginationControls}>
            <button className={styles.paginationButton} onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>首页</button>
            <button className={styles.paginationButton} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>上一页</button>
            {getPageNumbers(currentPage, totalPages).map((page, i) => (
              <button
                key={i}
                className={`${styles.paginationButton} ${currentPage === page ? styles.active : ""}`}
                onClick={() => page !== "..." && setCurrentPage(page as number)}
                disabled={page === "..."}
              >{page}</button>
            ))}
            <button className={styles.paginationButton} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>下一页</button>
            <button className={styles.paginationButton} onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>末页</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FollowingTab;
