import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { encodeId } from "@/utils/hashId";
import { FaUserCircle, FaCog, FaSignOutAlt, FaHome } from "react-icons/fa";
import Avatar from "../avatar/Avatar";
import styles from "./UserDropdown.module.css";

interface User {
  id: number | string;
  name: string;
  avatar?: string;
  role?: string;
  email: string;
}

interface UserDropdownProps {
  user: User;
  onLogout?: () => void;
  showAdminLink?: boolean;
  className?: string;
  /** 覆盖 user.role 展示，用于显示组织内角色 */
  roleOverride?: string;
  /** 角色悬浮提示（如提示最高角色） */
  roleTitle?: string;
}

const UserDropdown: React.FC<UserDropdownProps> = ({
  user,
  onLogout,
  showAdminLink = false,
  className = "",
  roleOverride,
  roleTitle,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const closeDropdown = () => {
    setIsOpen(false);
  };

  const handleLogout = () => {
    closeDropdown();
    if (onLogout) {
      onLogout();
    } else {
      // console.log('退出登录');
    }
  };

  return (
    <div ref={dropdownRef} className={`${styles.userDropdown} ${className}`}>
      {/* 用户显示区域 */}
      <div className={styles.userDisplay} onClick={toggleDropdown}>
        <Avatar src={user.avatar} name={user.name} size={36} className={styles.userAvatar} />
        <div className={styles.userDetails}>
          <div className={styles.userName}>{user.name}</div>
          {(roleOverride || user.role) && (
            <div className={styles.userRole} title={roleTitle}>
              {roleOverride || user.role}
            </div>
          )}
        </div>
        <div className={`${styles.dropdownArrow} ${isOpen ? styles.open : ""}`}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* 下拉菜单 */}
      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownHeader}>
            <Avatar src={user.avatar} name={user.name} size={48} className={styles.dropdownAvatar} />
            <div className={styles.dropdownUserInfo}>
              <div className={styles.dropdownUserName}>{user.name}</div>
              <div className={styles.dropdownUserEmail}>{user.email}</div>
            </div>
          </div>
          <div className={styles.dropdownDivider}></div>
          <div className={styles.dropdownMenu}>
            <div
              className={styles.dropdownItem}
              onClick={() => {
                closeDropdown();
                navigate(`/profile/${encodeId(user.id, "user")}`);
              }}
            >
              <FaUserCircle />
              个人资料
            </div>
            <div
              className={styles.dropdownItem}
              onClick={() => {
                closeDropdown();
                navigate("/");
              }}
            >
              <FaHome />
              回到首页
            </div>
            {showAdminLink && (
              <div
                className={styles.dropdownItem}
                onClick={() => {
                  closeDropdown();
                  navigate("/admin");
                }}
              >
                <FaCog />
                管理后台
              </div>
            )}
            <div className={styles.dropdownDivider}></div>
            <button className={styles.dropdownItem} onClick={handleLogout}>
              <FaSignOutAlt />
              退出登录
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDropdown;
