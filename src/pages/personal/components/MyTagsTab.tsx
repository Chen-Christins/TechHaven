import React, { useState, useEffect } from "react";
import { FaTag, FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import Loading from "@/components/loading/Loading";
import { confirm } from "@/components/confirm/Confirm";
import { message } from "@/components/message/Message";
import { useAuth } from "@/contexts/AuthContext";
import LabelService from "@/services/labelService";
import { formatToChinaTime } from "@/utils/utils";
import styles from "../PersonalCenter.module.css";

// 个人标签类型
interface PersonalTag {
  id: number;
  name: string;
  description?: string | "暂无";
  articleCount?: number | 0;
  color: string;
  createTime?: string | "未知时间";
}

const MyTagsTab: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.id;
  const [tags, setTags] = useState<PersonalTag[]>([]);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [editingTag, setEditingTag] = useState<PersonalTag | null>(null);
  const [tagForm, setTagForm] = useState({
    name: "",
    description: "",
    color: "#61dafb",
  });
  const [savingTag, setSavingTag] = useState(false);

  useEffect(() => {
    const fetchPersonalTags = async () => {
      setTagsLoading(true);
      if (!userId) {
        setTags([]);
        setTagsLoading(false);
        return;
      }

      try {
        const res = await LabelService.queryLabel({ user_id: userId });
        const mapped = (res || []).map((t: any) => ({
          id: t.id,
          name: t.name,
          description: t.desc || "暂无",
          articleCount: (t.article_count as number) || 0,
          color: t.color || "#61dafb",
          createTime: t.create_time ? formatToChinaTime(t.create_time) : "未知时间",
        }));
        setTags(mapped);
      } catch (err) {
        console.error("获取个人标签失败:", err);
        setTags([]);
      } finally {
        setTagsLoading(false);
      }
    };

    fetchPersonalTags();
  }, [userId]);

  // 添加/编辑标签
  const handleSaveTag = async () => {
    if (!tagForm.name.trim()) return;

    setSavingTag(true);
    try {
      if (editingTag) {
        // 编辑标签
        const res = await LabelService.createLabel({
          id: editingTag.id,
          name: tagForm.name,
          color: tagForm.color,
          description: tagForm.description || "",
        });

        setTags(
          tags.map((tag) =>
            tag.id === editingTag.id
              ? {
                  ...tag,
                  name: res.name,
                  description: res.desc || "暂无",
                  color: res.color,
                  createTime: res.create_time ? formatToChinaTime(res.create_time) : tag.createTime,
                }
              : tag,
          ),
        );
      } else {
        // 创建新标签
        const res = await LabelService.createLabel({
          name: tagForm.name,
          color: tagForm.color,
          description: tagForm.description || "",
        });

        // 将API响应映射到PersonalTag格式
        const newTag: PersonalTag = {
          id: Number(res.id),
          name: res.name,
          description: res.desc || "暂无",
          articleCount: 0,
          color: res.color,
          createTime: res.create_time ? formatToChinaTime(res.create_time) : new Date().toISOString().split("T")[0],
        };
        setTags([...tags, newTag]);
      }

      setShowTagModal(false);
      setEditingTag(null);
      setTagForm({ name: "", description: "", color: "#61dafb" });
    } catch (err) {
      console.error("保存标签失败:", err);
      message.error("保存标签失败，请重试");
    } finally {
      setSavingTag(false);
    }
  };

  // 删除标签
  const handleDeleteTag = async (tag: PersonalTag) => {
    const confirmed = await confirm({
      title: "确认删除",
      content: `确定要删除标签 "${tag.name}" 吗？删除后关联文章将失去此标签。`,
      confirmText: "删除",
      cancelText: "取消",
    });

    if (confirmed) {
      try {
        await LabelService.deleteLabel({ ids: String(tag.id) });
        // 删除成功后从本地状态移除
        setTags(tags.filter((t) => t.id !== tag.id));
      } catch (err) {
        console.error("删除标签失败:", err);
        message.error("删除标签失败，请重试");
      }
    }
  };

  // 编辑标签
  const handleEditTag = (tag: PersonalTag) => {
    setEditingTag(tag);
    setTagForm({
      name: tag.name,
      description: tag.description || "",
      color: tag.color,
    });
    setShowTagModal(true);
  };

  return (
    <div className={styles.contentSection}>
      <div className={styles.sectionHeader}>
        <h2>我的标签</h2>
        <button className={styles.addButton} onClick={() => setShowTagModal(true)}>
          <FaPlus />
          新建标签
        </button>
      </div>

      {tagsLoading ? (
        <div style={{ padding: "24px", textAlign: "center" }}>
          <Loading size="small" text="正在加载标签..." />
        </div>
      ) : tags.length === 0 ? (
        <div className={styles.emptyState}>
          <FaTag className={styles.emptyIcon} />
          <h3>暂无标签数据</h3>
          <p>点击"新增标签"按钮创建第一个标签</p>
        </div>
      ) : (
        <div className={styles.tagsGrid}>
          {tags.map((tag) => (
            <div key={tag.id} className={styles.tagCard}>
              <div className={styles.tagHeader}>
                <div className={styles.tagColor} style={{ backgroundColor: tag.color }}></div>
                <h3>{tag.name}</h3>
              </div>
              <p className={styles.tagDescription}>{tag.description}</p>
              <div className={styles.tagStats}>
                <span>{tag.articleCount} 篇文章</span>
                <span>创建于 {tag.createTime}</span>
              </div>
              <div className={styles.tagActions}>
                <button className={styles.actionButton} onClick={() => handleEditTag(tag)}>
                  <FaEdit />
                </button>
                <button className={styles.actionButton} onClick={() => handleDeleteTag(tag)}>
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 标签模态框 */}
      {showTagModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>{editingTag ? "编辑标签" : "新建标签"}</h3>
              <button
                className={styles.closeButton}
                onClick={() => {
                  setShowTagModal(false);
                  setEditingTag(null);
                  setTagForm({ name: "", description: "", color: "#61dafb" });
                }}
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label>标签名称</label>
                <input
                  type="text"
                  value={tagForm.name}
                  onChange={(e) => setTagForm({ ...tagForm, name: e.target.value })}
                  placeholder="请输入标签名称"
                />
              </div>
              <div className={styles.formGroup}>
                <label>标签描述</label>
                <textarea
                  value={tagForm.description}
                  onChange={(e) => setTagForm({ ...tagForm, description: e.target.value })}
                  placeholder="请输入标签描述"
                  rows={3}
                />
              </div>
              <div className={styles.formGroup}>
                <label>标签颜色</label>
                <div className={styles.colorPicker}>
                  <input type="color" value={tagForm.color} onChange={(e) => setTagForm({ ...tagForm, color: e.target.value })} />
                  <span>{tagForm.color}</span>
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button
                className={styles.cancelButton}
                onClick={() => {
                  setShowTagModal(false);
                  setEditingTag(null);
                  setTagForm({ name: "", description: "", color: "#61dafb" });
                }}
              >
                取消
              </button>
              <button className={styles.confirmButton} onClick={handleSaveTag} disabled={savingTag}>
                {savingTag ? "保存中..." : editingTag ? "更新" : "创建"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyTagsTab;
