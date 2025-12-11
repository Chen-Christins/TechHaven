import React, { useState } from "react";
import {
    FaSave,
    FaUpload,
    FaTrash,
    FaEnvelope,
    FaServer,
    FaCog,
    FaGlobe,
    FaPalette,
    FaBell,
    FaShieldAlt,
    FaDatabase,
    FaUsers,
    FaClock,
    FaCheckCircle,
    FaExclamationTriangle,
} from "react-icons/fa";
import styles from "./Settings.module.css";
import CustomSelect from "../../components/customSelect/CustomSelect";

// 设置接口定义
interface SiteSettings {
    siteName: string;
    siteDescription: string;
    siteKeywords: string;
    siteIcon: string;
    siteLogo: string;
    favicon: string;
    adminEmail: string;
    timezone: string;
    language: string;
}

interface EmailSettings {
    smtpHost: string;
    smtpPort: number;
    smtpUsername: string;
    smtpPassword: string;
    smtpEncryption: "none" | "ssl" | "tls";
    fromEmail: string;
    fromName: string;
    replyTo: string;
}

interface SystemSettings {
    enableRegistration: boolean;
    requireEmailVerification: boolean;
    allowComments: boolean;
    moderateComments: boolean;
    maxFileSize: number;
    allowedFileTypes: string;
    sessionTimeout: number;
    maintenanceMode: boolean;
    backupSchedule: string;
}

const Settings: React.FC = () => {
    // 状态管理
    const [activeTab, setActiveTab] = useState<"site" | "email" | "system">("site");
    const [saving, setSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");

    // 站点设置状态
    const [siteSettings, setSiteSettings] = useState<SiteSettings>({
        siteName: "TechBlog",
        siteDescription: "一个专注于技术分享的博客平台",
        siteKeywords: "技术,博客,编程,开发,分享",
        siteIcon: "",
        siteLogo: "",
        favicon: "",
        adminEmail: "admin@techblog.com",
        timezone: "Asia/Shanghai",
        language: "zh-CN",
    });

    // 邮件设置状态
    const [emailSettings, setEmailSettings] = useState<EmailSettings>({
        smtpHost: "smtp.gmail.com",
        smtpPort: 587,
        smtpUsername: "",
        smtpPassword: "",
        smtpEncryption: "tls",
        fromEmail: "noreply@techblog.com",
        fromName: "TechBlog",
        replyTo: "support@techblog.com",
    });

    // 系统设置状态
    const [systemSettings, setSystemSettings] = useState<SystemSettings>({
        enableRegistration: true,
        requireEmailVerification: true,
        allowComments: true,
        moderateComments: false,
        maxFileSize: 10,
        allowedFileTypes: "jpg,jpeg,png,gif,pdf,doc,docx",
        sessionTimeout: 24,
        maintenanceMode: false,
        backupSchedule: "daily",
    });

    // 处理输入变化
    const handleSiteSettingChange = (field: keyof SiteSettings, value: string | boolean) => {
        setSiteSettings((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleEmailSettingChange = (field: keyof EmailSettings, value: string | number) => {
        setEmailSettings((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleSystemSettingChange = (field: keyof SystemSettings, value: string | boolean | number) => {
        setSystemSettings((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    // 保存设置
    const saveSettings = async () => {
        setSaving(true);
        setSaveStatus("idle");

        try {
            // 模拟API调用
            await new Promise((resolve) => setTimeout(resolve, 1500));

            setSaveStatus("success");
            setTimeout(() => setSaveStatus("idle"), 3000);
        } catch (error) {
            console.error("保存失败:", error);
            setSaveStatus("error");
            setTimeout(() => setSaveStatus("idle"), 3000);
        } finally {
            setSaving(false);
        }
    };

    // 文件上传处理
    const handleFileUpload = (type: "siteIcon" | "siteLogo" | "favicon") => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                // 这里处理文件上传逻辑
                const reader = new FileReader();
                reader.onload = (e) => {
                    const result = e.target?.result as string;
                    handleSiteSettingChange(type, result);
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    };

    // 时区选项
    const timezoneOptions = [
        { id: "Asia/Shanghai", name: "Asia/Shanghai", color: "" },
        { id: "Asia/Tokyo", name: "Asia/Tokyo", color: "" },
        { id: "Asia/Seoul", name: "Asia/Seoul", color: "" },
        { id: "UTC", name: "UTC", color: "" },
        { id: "America/New_York", name: "America/New_York", color: "" },
        { id: "Europe/London", name: "Europe/London", color: "" },
        { id: "Europe/Paris", name: "Europe/Paris", color: "" },
    ];

    // 语言选项
    const languageOptions = [
        { id: "zh-CN", name: "简体中文", color: "" },
        { id: "zh-TW", name: "繁体中文", color: "" },
        { id: "en-US", name: "English", color: "" },
        { id: "ja-JP", name: "日本語", color: "" },
        { id: "ko-KR", name: "한국어", color: "" },
    ];

    // 加密方式选项
    const encryptionOptions = [
        { id: "none", name: "无加密", color: "" },
        { id: "ssl", name: "SSL", color: "" },
        { id: "tls", name: "TLS", color: "" },
    ];

    // 备份计划选项
    const backupScheduleOptions = [
        { id: "disabled", name: "禁用", color: "" },
        { id: "daily", name: "每日", color: "" },
        { id: "weekly", name: "每周", color: "" },
        { id: "monthly", name: "每月", color: "" },
    ];

    return (
        <div className={styles.settings}>
            {/* 保存状态提示 */}
            {saveStatus !== "idle" && (
                <div className={`${styles.saveAlert} ${styles[saveStatus]}`}>
                    {saveStatus === "success" ? (
                        <>
                            <FaCheckCircle />
                            设置保存成功！
                        </>
                    ) : (
                        <>
                            <FaExclamationTriangle />
                            保存失败，请重试
                        </>
                    )}
                </div>
            )}

            {/* Tab导航 */}
            <div className={styles.tabsContainer}>
                <nav className={styles.tabsNav}>
                    <button
                        className={`${styles.tabButton} ${activeTab === "site" ? styles.active : ""}`}
                        onClick={() => setActiveTab("site")}
                    >
                        <div className={styles.tabIcon}>
                            <FaGlobe />
                        </div>
                        <div className={styles.tabContent}>
                            <span className={styles.tabLabel}>站点设置</span>
                            <span className={styles.tabDescription}>基本信息和外观配置</span>
                        </div>
                    </button>
                    <button
                        className={`${styles.tabButton} ${activeTab === "email" ? styles.active : ""}`}
                        onClick={() => setActiveTab("email")}
                    >
                        <div className={styles.tabIcon}>
                            <FaEnvelope />
                        </div>
                        <div className={styles.tabContent}>
                            <span className={styles.tabLabel}>邮件设置</span>
                            <span className={styles.tabDescription}>SMTP服务器和邮件配置</span>
                        </div>
                    </button>
                    <button
                        className={`${styles.tabButton} ${activeTab === "system" ? styles.active : ""}`}
                        onClick={() => setActiveTab("system")}
                    >
                        <div className={styles.tabIcon}>
                            <FaCog />
                        </div>
                        <div className={styles.tabContent}>
                            <span className={styles.tabLabel}>系统设置</span>
                            <span className={styles.tabDescription}>系统参数和功能开关</span>
                        </div>
                    </button>
                </nav>
            </div>

            {/* 主要内容区域 */}
            <div className={styles.settingsContent}>
                {/* 站点设置 */}
                {activeTab === "site" && (
                    <div className={styles.settingsSection}>
                        <div className={styles.sectionHeader}>
                            <h2 className={styles.sectionTitle}>
                                <FaGlobe />
                                站点设置
                            </h2>
                            <p className={styles.sectionDescription}>配置站点基本信息和外观</p>
                        </div>

                        <div className={styles.settingsGrid}>
                            {/* 站点信息 */}
                            <div className={styles.settingCard}>
                                <h3 className={styles.cardTitle}>基本信息</h3>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>站点名称</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={siteSettings.siteName}
                                        onChange={(e) => handleSiteSettingChange("siteName", e.target.value)}
                                        placeholder="请输入站点名称"
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>站点描述</label>
                                    <textarea
                                        className={styles.formTextarea}
                                        value={siteSettings.siteDescription}
                                        onChange={(e) => handleSiteSettingChange("siteDescription", e.target.value)}
                                        placeholder="请输入站点描述"
                                        rows={3}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>关键词</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={siteSettings.siteKeywords}
                                        onChange={(e) => handleSiteSettingChange("siteKeywords", e.target.value)}
                                        placeholder="请输入关键词，用逗号分隔"
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>管理员邮箱</label>
                                    <input
                                        type="email"
                                        className={styles.formInput}
                                        value={siteSettings.adminEmail}
                                        onChange={(e) => handleSiteSettingChange("adminEmail", e.target.value)}
                                        placeholder="admin@example.com"
                                    />
                                </div>
                            </div>

                            {/* 站点图标 */}
                            <div className={styles.settingCard}>
                                <h3 className={styles.cardTitle}>
                                    <FaPalette />
                                    站点图标
                                </h3>
                                <div className={styles.imageUploadGrid}>
                                    <div className={styles.imageUploadItem}>
                                        <label className={styles.uploadLabel}>站点图标</label>
                                        <div className={styles.imageUploadContainer}>
                                            {siteSettings.siteIcon ? (
                                                <img
                                                    src={siteSettings.siteIcon}
                                                    alt="站点图标"
                                                    className={styles.uploadedImage}
                                                />
                                            ) : (
                                                <div className={styles.uploadPlaceholder}>
                                                    <FaUpload />
                                                    <span>点击上传图标</span>
                                                </div>
                                            )}
                                            <button
                                                type="button"
                                                className={styles.uploadButton}
                                                onClick={() => handleFileUpload("siteIcon")}
                                            >
                                                选择文件
                                            </button>
                                            {siteSettings.siteIcon && (
                                                <button
                                                    type="button"
                                                    className={styles.deleteButton}
                                                    onClick={() => handleSiteSettingChange("siteIcon", "")}
                                                >
                                                    <FaTrash />
                                                </button>
                                            )}
                                        </div>
                                        <p className={styles.uploadHint}>建议尺寸：32x32px，支持PNG、ICO格式</p>
                                    </div>

                                    <div className={styles.imageUploadItem}>
                                        <label className={styles.uploadLabel}>站点Logo</label>
                                        <div className={styles.imageUploadContainer}>
                                            {siteSettings.siteLogo ? (
                                                <img
                                                    src={siteSettings.siteLogo}
                                                    alt="站点Logo"
                                                    className={styles.uploadedImage}
                                                />
                                            ) : (
                                                <div className={styles.uploadPlaceholder}>
                                                    <FaUpload />
                                                    <span>点击上传Logo</span>
                                                </div>
                                            )}
                                            <button
                                                type="button"
                                                className={styles.uploadButton}
                                                onClick={() => handleFileUpload("siteLogo")}
                                            >
                                                选择文件
                                            </button>
                                            {siteSettings.siteLogo && (
                                                <button
                                                    type="button"
                                                    className={styles.deleteButton}
                                                    onClick={() => handleSiteSettingChange("siteLogo", "")}
                                                >
                                                    <FaTrash />
                                                </button>
                                            )}
                                        </div>
                                        <p className={styles.uploadHint}>建议尺寸：200x50px，支持PNG、JPG格式</p>
                                    </div>

                                    <div className={styles.imageUploadItem}>
                                        <label className={styles.uploadLabel}>Favicon</label>
                                        <div className={styles.imageUploadContainer}>
                                            {siteSettings.favicon ? (
                                                <img
                                                    src={siteSettings.favicon}
                                                    alt="Favicon"
                                                    className={styles.uploadedImage}
                                                />
                                            ) : (
                                                <div className={styles.uploadPlaceholder}>
                                                    <FaUpload />
                                                    <span>点击上传Favicon</span>
                                                </div>
                                            )}
                                            <button
                                                type="button"
                                                className={styles.uploadButton}
                                                onClick={() => handleFileUpload("favicon")}
                                            >
                                                选择文件
                                            </button>
                                            {siteSettings.favicon && (
                                                <button
                                                    type="button"
                                                    className={styles.deleteButton}
                                                    onClick={() => handleSiteSettingChange("favicon", "")}
                                                >
                                                    <FaTrash />
                                                </button>
                                            )}
                                        </div>
                                        <p className={styles.uploadHint}>
                                            建议尺寸：16x16px或32x32px，支持ICO、PNG格式
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* 本地化设置 */}
                            <div className={styles.settingCard}>
                                <h3 className={styles.cardTitle}>
                                    <FaClock />
                                    本地化设置
                                </h3>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>时区</label>
                                    <CustomSelect
                                        name="时区"
                                        value={timezoneOptions.find((tz) => tz.id === siteSettings.timezone) || null}
                                        onChange={(selectedOption) =>
                                            handleSiteSettingChange("timezone", String(selectedOption?.id || ""))
                                        }
                                        options={timezoneOptions}
                                        hideBadge={true}
                                        placeholder="选择时区"
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>语言</label>
                                    <CustomSelect
                                        name="语言"
                                        value={
                                            languageOptions.find((lang) => lang.id === siteSettings.language) || null
                                        }
                                        onChange={(selectedOption) =>
                                            handleSiteSettingChange("language", String(selectedOption?.id || ""))
                                        }
                                        options={languageOptions}
                                        hideBadge={true}
                                        placeholder="选择语言"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 邮件设置 */}
                {activeTab === "email" && (
                    <div className={styles.settingsSection}>
                        <div className={styles.sectionHeader}>
                            <h2 className={styles.sectionTitle}>
                                <FaEnvelope />
                                邮件设置
                            </h2>
                            <p className={styles.sectionDescription}>配置SMTP服务器和邮件发送参数</p>
                        </div>

                        <div className={styles.settingsGrid}>
                            {/* SMTP配置 */}
                            <div className={styles.settingCard}>
                                <h3 className={styles.cardTitle}>
                                    <FaServer />
                                    SMTP服务器配置
                                </h3>
                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>SMTP主机</label>
                                        <input
                                            type="text"
                                            className={styles.formInput}
                                            value={emailSettings.smtpHost}
                                            onChange={(e) => handleEmailSettingChange("smtpHost", e.target.value)}
                                            placeholder="smtp.gmail.com"
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>端口</label>
                                        <input
                                            type="number"
                                            className={styles.formInput}
                                            value={emailSettings.smtpPort}
                                            onChange={(e) =>
                                                handleEmailSettingChange("smtpPort", parseInt(e.target.value))
                                            }
                                            placeholder="587"
                                        />
                                    </div>
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>加密方式</label>
                                    <CustomSelect
                                        name="加密方式"
                                        value={
                                            encryptionOptions.find((opt) => opt.id === emailSettings.smtpEncryption) ||
                                            null
                                        }
                                        onChange={(selectedOption) =>
                                            handleEmailSettingChange(
                                                "smtpEncryption",
                                                (selectedOption?.id as "none" | "ssl" | "tls") || "none",
                                            )
                                        }
                                        options={encryptionOptions}
                                        hideBadge={true}
                                        placeholder="选择加密方式"
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>用户名</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={emailSettings.smtpUsername}
                                        onChange={(e) => handleEmailSettingChange("smtpUsername", e.target.value)}
                                        placeholder="your-email@gmail.com"
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>密码</label>
                                    <input
                                        type="password"
                                        className={styles.formInput}
                                        value={emailSettings.smtpPassword}
                                        onChange={(e) => handleEmailSettingChange("smtpPassword", e.target.value)}
                                        placeholder="请输入SMTP密码"
                                    />
                                </div>
                            </div>

                            {/* 邮件发送设置 */}
                            <div className={styles.settingCard}>
                                <h3 className={styles.cardTitle}>邮件发送设置</h3>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>发件人邮箱</label>
                                    <input
                                        type="email"
                                        className={styles.formInput}
                                        value={emailSettings.fromEmail}
                                        onChange={(e) => handleEmailSettingChange("fromEmail", e.target.value)}
                                        placeholder="noreply@techblog.com"
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>发件人名称</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={emailSettings.fromName}
                                        onChange={(e) => handleEmailSettingChange("fromName", e.target.value)}
                                        placeholder="TechBlog"
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>回复邮箱</label>
                                    <input
                                        type="email"
                                        className={styles.formInput}
                                        value={emailSettings.replyTo}
                                        onChange={(e) => handleEmailSettingChange("replyTo", e.target.value)}
                                        placeholder="support@techblog.com"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 系统设置 */}
                {activeTab === "system" && (
                    <div className={styles.settingsSection}>
                        <div className={styles.sectionHeader}>
                            <h2 className={styles.sectionTitle}>
                                <FaCog />
                                系统设置
                            </h2>
                            <p className={styles.sectionDescription}>配置系统参数和功能开关</p>
                        </div>

                        <div className={styles.settingsGrid}>
                            {/* 用户设置 */}
                            <div className={styles.settingCard}>
                                <h3 className={styles.cardTitle}>
                                    <FaUsers />
                                    用户设置
                                </h3>
                                <div className={styles.switchGroup}>
                                    <label className={styles.switchLabel}>
                                        <input
                                            type="checkbox"
                                            className={styles.switchInput}
                                            checked={systemSettings.enableRegistration}
                                            onChange={(e) =>
                                                handleSystemSettingChange("enableRegistration", e.target.checked)
                                            }
                                        />
                                        <span className={styles.switchSlider}></span>
                                        <span className={styles.switchText}>允许用户注册</span>
                                    </label>
                                </div>
                                <div className={styles.switchGroup}>
                                    <label className={styles.switchLabel}>
                                        <input
                                            type="checkbox"
                                            className={styles.switchInput}
                                            checked={systemSettings.requireEmailVerification}
                                            onChange={(e) =>
                                                handleSystemSettingChange("requireEmailVerification", e.target.checked)
                                            }
                                        />
                                        <span className={styles.switchSlider}></span>
                                        <span className={styles.switchText}>需要邮箱验证</span>
                                    </label>
                                </div>
                            </div>

                            {/* 评论设置 */}
                            <div className={styles.settingCard}>
                                <h3 className={styles.cardTitle}>
                                    <FaBell />
                                    评论设置
                                </h3>
                                <div className={styles.switchGroup}>
                                    <label className={styles.switchLabel}>
                                        <input
                                            type="checkbox"
                                            className={styles.switchInput}
                                            checked={systemSettings.allowComments}
                                            onChange={(e) =>
                                                handleSystemSettingChange("allowComments", e.target.checked)
                                            }
                                        />
                                        <span className={styles.switchSlider}></span>
                                        <span className={styles.switchText}>允许评论</span>
                                    </label>
                                </div>
                                <div className={styles.switchGroup}>
                                    <label className={styles.switchLabel}>
                                        <input
                                            type="checkbox"
                                            className={styles.switchInput}
                                            checked={systemSettings.moderateComments}
                                            onChange={(e) =>
                                                handleSystemSettingChange("moderateComments", e.target.checked)
                                            }
                                        />
                                        <span className={styles.switchSlider}></span>
                                        <span className={styles.switchText}>评论需要审核</span>
                                    </label>
                                </div>
                            </div>

                            {/* 文件上传设置 */}
                            <div className={styles.settingCard}>
                                <h3 className={styles.cardTitle}>文件上传设置</h3>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>最大文件大小 (MB)</label>
                                    <input
                                        type="number"
                                        className={styles.formInput}
                                        value={systemSettings.maxFileSize}
                                        onChange={(e) =>
                                            handleSystemSettingChange("maxFileSize", parseInt(e.target.value))
                                        }
                                        min="1"
                                        max="100"
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>允许的文件类型</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={systemSettings.allowedFileTypes}
                                        onChange={(e) => handleSystemSettingChange("allowedFileTypes", e.target.value)}
                                        placeholder="jpg,jpeg,png,gif,pdf,doc,docx"
                                    />
                                    <p className={styles.formHint}>用逗号分隔文件扩展名</p>
                                </div>
                            </div>

                            {/* 系统维护设置 */}
                            <div className={styles.settingCard}>
                                <h3 className={styles.cardTitle}>
                                    <FaShieldAlt />
                                    系统维护
                                </h3>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>会话超时时间 (小时)</label>
                                    <input
                                        type="number"
                                        className={styles.formInput}
                                        value={systemSettings.sessionTimeout}
                                        onChange={(e) =>
                                            handleSystemSettingChange("sessionTimeout", parseInt(e.target.value))
                                        }
                                        min="1"
                                        max="168"
                                    />
                                </div>
                                <div className={styles.switchGroup}>
                                    <label className={styles.switchLabel}>
                                        <input
                                            type="checkbox"
                                            className={styles.switchInput}
                                            checked={systemSettings.maintenanceMode}
                                            onChange={(e) =>
                                                handleSystemSettingChange("maintenanceMode", e.target.checked)
                                            }
                                        />
                                        <span className={styles.switchSlider}></span>
                                        <span className={styles.switchText}>维护模式</span>
                                    </label>
                                    <p className={styles.switchHint}>启用后，普通用户将无法访问站点</p>
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>备份计划</label>
                                    <CustomSelect
                                        name="备份计划"
                                        value={
                                            backupScheduleOptions.find(
                                                (opt) => opt.id === systemSettings.backupSchedule,
                                            ) || null
                                        }
                                        onChange={(selectedOption) =>
                                            handleSystemSettingChange(
                                                "backupSchedule",
                                                selectedOption?.id || "disabled",
                                            )
                                        }
                                        options={backupScheduleOptions}
                                        hideBadge={true}
                                        placeholder="选择备份计划"
                                    />
                                </div>
                            </div>

                            {/* 数据库设置 */}
                            <div className={styles.settingCard}>
                                <h3 className={styles.cardTitle}>
                                    <FaDatabase />
                                    数据库设置
                                </h3>
                                <div className={styles.formGroup}>
                                    <button className={styles.actionButton}>
                                        <FaDatabase />
                                        优化数据库
                                    </button>
                                    <p className={styles.formHint}>清理冗余数据，优化数据库性能</p>
                                </div>
                                <div className={styles.formGroup}>
                                    <button className={styles.actionButton}>
                                        <FaSave />
                                        立即备份
                                    </button>
                                    <p className={styles.formHint}>创建完整的数据库备份</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* 底部操作栏 */}
            <div className={styles.settingsFooter}>
                <div className={styles.footerActions}>
                    <button className={styles.cancelButton}>重置</button>
                    <button className={styles.saveButton} onClick={saveSettings} disabled={saving}>
                        <FaSave />
                        {saving ? "保存中..." : "保存设置"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Settings;
