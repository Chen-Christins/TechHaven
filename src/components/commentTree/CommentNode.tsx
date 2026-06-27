import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ThumbsUp, Send } from "lucide-react";
import Avatar from "../avatar/Avatar";
import type { ArticleComment } from "../../types/comment";
import styles from "./CommentNode.module.css";

// 最大回复嵌套深度（0=顶级评论，每级回复+1）
const MAX_REPLY_DEPTH = 4;

export interface CommentNodeProps {
  comment: ArticleComment;
  depth: number;
  likedCommentIds: Set<number>;
  editingId: number | null;
  editText: string;
  replyToId: number | null;
  replyText: string;
  currentUserId?: number;
  isAuthenticated: boolean;
  onLike: (id: number) => void;
  onToggleReply: (id: number) => void;
  onStartEdit: (comment: ArticleComment) => void;
  onSaveEdit: (id: number) => void;
  onCancelEdit: () => void;
  onReplyTextChange: (text: string) => void;
  onReplySubmit: (parentId: number) => void;
  onReplyCancel: () => void;
  onEditTextChange: (text: string) => void;
}

const CommentNode: React.FC<CommentNodeProps> = ({
  comment,
  depth,
  likedCommentIds,
  editingId,
  editText,
  replyToId,
  replyText,
  currentUserId,
  isAuthenticated,
  onLike,
  onToggleReply,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onReplyTextChange,
  onReplySubmit,
  onReplyCancel,
  onEditTextChange,
}) => {
  const isReply = depth > 0;
  const canReply = depth < MAX_REPLY_DEPTH;

  return (
    <>
      <div className={isReply ? styles.replyItem : styles.commentItem}>
        <div className={styles.commentAvatar}>
          <Avatar src={comment.avatar} name={comment.user} size={isReply ? 32 : 40} />
        </div>
        <div className={styles.commentBody}>
          <div className={styles.commentMeta}>
            <span className={styles.commentUser}>{comment.user}</span>
            <span className={styles.commentTime}>{comment.time}</span>
          </div>
          {editingId === comment.id ? (
            <div className={styles.editSection}>
              <textarea
                className={styles.textarea}
                value={editText}
                onChange={(e) => onEditTextChange(e.target.value)}
                rows={isReply ? 2 : 3}
              />
              <div className={styles.editActions}>
                <button
                  className={styles.editSave}
                  onClick={() => onSaveEdit(comment.id)}
                  disabled={!editText.trim() || editText.trim() === comment.content}
                >
                  保存
                </button>
                <button className={styles.editCancel} onClick={onCancelEdit}>
                  取消
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.commentContent}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{comment.content}</ReactMarkdown>
            </div>
          )}
          <div className={styles.actions}>
            <button
              className={`${styles.actionButton} ${likedCommentIds.has(comment.id) ? styles.liked : ""}`}
              onClick={() => onLike(comment.id)}
            >
              <ThumbsUp size={12} />
              {comment.likes > 0 ? comment.likes : "赞"}
            </button>
            {canReply && (
              <button className={styles.actionButton} onClick={() => onToggleReply(comment.id)}>
                回复
              </button>
            )}
            {isAuthenticated && currentUserId === comment.user_id && (
              <button className={styles.actionButton} onClick={() => onStartEdit(comment)}>
                编辑
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 子回复列表 */}
      {comment.replies?.length > 0 && (
        <div className={styles.replyList}>
          {comment.replies.map((reply) => (
            <CommentNode
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              likedCommentIds={likedCommentIds}
              editingId={editingId}
              editText={editText}
              replyToId={replyToId}
              replyText={replyText}
              currentUserId={currentUserId}
              isAuthenticated={isAuthenticated}
              onLike={onLike}
              onToggleReply={onToggleReply}
              onStartEdit={onStartEdit}
              onSaveEdit={onSaveEdit}
              onCancelEdit={onCancelEdit}
              onReplyTextChange={onReplyTextChange}
              onReplySubmit={onReplySubmit}
              onReplyCancel={onReplyCancel}
              onEditTextChange={onEditTextChange}
            />
          ))}
        </div>
      )}

      {/* 回复输入框 */}
      {replyToId === comment.id && (
        <div className={styles.replyInputWrapper}>
          <textarea
            className={styles.textarea}
            placeholder={`回复 ${comment.user}...`}
            value={replyText}
            onChange={(e) => onReplyTextChange(e.target.value)}
            rows={2}
          />
          <div className={styles.inputFooter}>
            <span className={styles.hint}>支持 Markdown 语法</span>
            <div style={{ display: "flex", gap: 8 }}>
              <button className={styles.cancelButton} onClick={onReplyCancel}>
                取消
              </button>
              <button className={styles.submitButton} onClick={() => onReplySubmit(comment.id)} disabled={!replyText.trim()}>
                <Send size={14} />
                回复
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CommentNode;
