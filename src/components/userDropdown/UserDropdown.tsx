import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
    FaUserCircle,
    FaCog,
    FaSignOutAlt
} from 'react-icons/fa';
import styles from './UserDropdown.module.css';

interface User {
    name: string;
    avatar: string;
    role?: string;
    email: string;
}

interface UserDropdownProps {
    user: User;
    onLogout?: () => void;
    showAdminLink?: boolean;
    className?: string;
}

const UserDropdown: React.FC<UserDropdownProps> = ({
    user,
    onLogout,
    showAdminLink = false,
    className = ''
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // 点击外部关闭下拉菜单
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
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
        <div
            ref={dropdownRef}
            className={`${styles.userDropdown} ${className}`}
        >
            {/* 用户显示区域 */}
            <div className={styles.userDisplay} onClick={toggleDropdown}>
                <img
                    src={user.avatar}
                    alt={user.name}
                    className={styles.userAvatar}
                />
                <div className={styles.userDetails}>
                    <div className={styles.userName}>{user.name}</div>
                    {user.role && (
                        <div className={styles.userRole}>{user.role}</div>
                    )}
                </div>
                <div className={`${styles.dropdownArrow} ${isOpen ? styles.open : ''}`}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </div>
            </div>

            {/* 下拉菜单 */}
            {isOpen && (
                <div className={styles.dropdown}>
                    <div className={styles.dropdownHeader}>
                        <img
                            src={user.avatar}
                            alt={user.name}
                            className={styles.dropdownAvatar}
                        />
                        <div className={styles.dropdownUserInfo}>
                            <div className={styles.dropdownUserName}>{user.name}</div>
                            <div className={styles.dropdownUserEmail}>{user.email}</div>
                        </div>
                    </div>
                    <div className={styles.dropdownDivider}></div>
                    <div className={styles.dropdownMenu}>
                        <Link to="/profile/1" className={styles.dropdownItem} onClick={closeDropdown}>
                            <FaUserCircle />
                            个人资料
                        </Link>
                        {showAdminLink && (
                            <Link to="/admin" className={styles.dropdownItem} onClick={closeDropdown}>
                                <FaCog />
                                管理后台
                            </Link>
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