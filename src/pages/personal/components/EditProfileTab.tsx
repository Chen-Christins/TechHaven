import React, { useState, useRef } from "react";
import { FaCamera, FaUser, FaLock, FaSave, FaQuoteRight, FaGlobe, FaLink } from "react-icons/fa";
import { useAuth } from "../../../contexts/AuthContext";
import { AuthService } from "../../../services/authService";
import { FileService } from "../../../services/fileService";
import { message } from "../../../components/message/Message";
import styles from "../PersonalCenter.module.css";

const EditProfileTab: React.FC = () => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(user?.name || "");
  const [motto, setMotto] = useState(user?.bio || "");
  const [website, setWebsite] = useState(user?.website || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || "https://picsum.photos/id/64/200");
  const [avatarInput, setAvatarInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      message.warn("图片大小不能超过 5MB");
      return;
    }

    setUploading(true);
    try {
      const result = await FileService.uploadFile({
        dir_name: "avatar",
        biz_type: "user",
        biz_id: String(user?.id || ""),
        files: [file],
      });

      if (result.data?.file_path || result.data?.url) {
        const newAvatar = result.data.file_path || result.data.url;
        setAvatarUrl(newAvatar);
        await AuthService.updateUserProfile(undefined, undefined, undefined, undefined, undefined, newAvatar);
        message.success("头像上传成功");
      } else {
        message.warn("头像上传失败，请重试");
      }
    } catch (err: any) {
      message.error(err?.message || "头像上传失败");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleApplyAvatarUrl = async () => {
    const trimmed = avatarInput.trim();
    if (!trimmed) {
      message.warn("请输入头像URL");
      return;
    }
    if (!/^https?:\/\/.+/.test(trimmed)) {
      message.warn("请输入有效的 HTTP/HTTPS 链接");
      return;
    }
    setSaving(true);
    try {
      await AuthService.updateUserProfile(undefined, undefined, undefined, undefined, undefined, trimmed);
      setAvatarUrl(trimmed);
      setAvatarInput("");
      message.success("头像已更新");
    } catch (err: any) {
      message.error(err?.message || "头像更新失败");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      message.warn("请输入昵称");
      return;
    }

    setSaving(true);
    try {
      await AuthService.updateUserProfile(name.trim(), undefined, motto.trim(), website.trim(), undefined, avatarUrl);
      message.success("个人资料已更新");
    } catch (err: any) {
      message.error(err?.message || "保存失败");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword) {
      message.warn("请输入当前密码");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      message.warn("新密码至少 6 位");
      return;
    }
    if (newPassword !== confirmPassword) {
      message.warn("两次输入的密码不一致");
      return;
    }

    setSaving(true);
    try {
      await AuthService.updateUserProfile(undefined, newPassword, undefined, undefined, currentPassword);
      message.success("密码已修改，下次登录时生效");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      message.error(err?.message || "修改密码失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <h2 className={styles.pageTitle}>编辑资料</h2>
      </div>

      <div className={styles.editSections}>
        {/* 头像区域 */}
        <div className={styles.editCard}>
          <div className={styles.editCardHeader}>
            <FaCamera className={styles.editCardIcon} />
            <span>头像</span>
          </div>
          <div className={styles.editCardBody}>
            <div className={styles.avatarSection}>
              <div className={styles.avatarWrapper} onClick={handleAvatarClick}>
                <img src={avatarUrl} alt="头像" className={styles.editAvatar} />
                <div className={styles.avatarOverlay}>
                  <FaCamera />
                  <span>{uploading ? "上传中..." : "更换头像"}</span>
                </div>
              </div>
              <p className={styles.avatarHint}>支持 JPG、PNG 格式，大小不超过 5MB，或直接输入图片链接</p>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <input
                  type="url"
                  className={styles.editInput}
                  value={avatarInput}
                  onChange={(e) => setAvatarInput(e.target.value)}
                  placeholder={user?.avatar || "https://example.com/avatar.jpg"}
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  className={styles.editSaveBtn}
                  onClick={handleApplyAvatarUrl}
                  style={{ whiteSpace: "nowrap" }}
                >
                  <FaLink size={12} />
                  应用
                </button>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleAvatarChange}
              style={{ display: "none" }}
            />
          </div>
        </div>

        {/* 基本信息 */}
        <div className={styles.editCard}>
          <div className={styles.editCardHeader}>
            <FaUser className={styles.editCardIcon} />
            <span>基本信息</span>
          </div>
          <div className={styles.editCardBody}>
            <div className={styles.editFormGrid}>
              <div className={styles.editFormGroup}>
                <label className={styles.editLabel}>昵称</label>
                <input
                  type="text"
                  className={styles.editInput}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={user?.name || "请输入昵称"}
                />
              </div>
              <div className={styles.editFormGroup}>
                <label className={styles.editLabel}>邮箱</label>
                <input type="email" className={styles.editInput} value={user?.email || ""} disabled />
                <span className={styles.editHint}>邮箱暂不支持自行修改</span>
              </div>
              <div className={styles.editFormGroup}>
                <label className={styles.editLabel}>
                  <FaQuoteRight size={12} style={{ marginRight: 4 }} />
                  座右铭
                </label>
                <input
                  type="text"
                  className={styles.editInput}
                  value={motto}
                  onChange={(e) => setMotto(e.target.value)}
                  placeholder={user?.bio || "一句话介绍自己"}
                  maxLength={100}
                />
              </div>
              <div className={styles.editFormGroup}>
                <label className={styles.editLabel}>
                  <FaGlobe size={12} style={{ marginRight: 4 }} />
                  个人网站
                </label>
                <input
                  type="url"
                  className={styles.editInput}
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder={user?.website || "https://example.com"}
                />
              </div>
            </div>
            <button className={styles.editSaveBtn} onClick={handleSaveProfile} disabled={saving}>
              <FaSave />
              {saving ? "保存中..." : "保存修改"}
            </button>
          </div>
        </div>

        {/* 修改密码 */}
        <div className={styles.editCard}>
          <div className={styles.editCardHeader}>
            <FaLock className={styles.editCardIcon} />
            <span>修改密码</span>
          </div>
          <div className={styles.editCardBody}>
            <div className={styles.editFormGroup}>
              <label className={styles.editLabel}>当前密码</label>
              <input
                type="password"
                className={styles.editInput}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="请输入当前密码"
              />
            </div>
            <div className={styles.editFormGroup}>
              <label className={styles.editLabel}>新密码</label>
              <input
                type="password"
                className={styles.editInput}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="至少 6 位字符"
              />
            </div>
            <div className={styles.editFormGroup}>
              <label className={styles.editLabel}>确认新密码</label>
              <input
                type="password"
                className={styles.editInput}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="请再次输入新密码"
              />
            </div>
            <button className={styles.editSaveBtn} onClick={handleChangePassword} disabled={saving}>
              <FaLock />
              {saving ? "修改中..." : "修改密码"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProfileTab;
