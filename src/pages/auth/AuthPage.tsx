import React, { useState, useEffect } from 'react';
import {
    Eye,
    EyeOff,
    Mail,
    User,
    Lock,
    ArrowLeft,
    Check,
    AlertCircle
} from 'lucide-react';
import styles from './AuthPage.module.css'; // 导入 CSS Modules
import Footer from "../../components/footer/Footer";

// 定义表单类型
type FormType = 'login' | 'register' | 'forgotPassword';

// 表单验证规则
const validateForm = (type: FormType, formData: any) => {
    const errors: Record<string, string> = {};

    if (type === 'login') {
        if (!formData.usernameOrEmail) {
            errors.usernameOrEmail = '请输入用户名或邮箱';
        }
        if (!formData.password) {
            errors.password = '请输入密码';
        } else if (formData.password.length < 6) {
            errors.password = '密码长度至少6位';
        }
    } else if (type === 'register') {
        if (!formData.username) {
            errors.username = '请输入用户名';
        } else if (formData.username.length < 3) {
            errors.username = '用户名长度至少3位';
        }

        if (!formData.email) {
            errors.email = '请输入邮箱';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = '请输入有效的邮箱地址';
        }

        if (!formData.code) {
            errors.code = '请输入验证码';
        } else if (formData.code.length !== 6) {
            errors.code = '验证码长度为6位';
        }

        if (!formData.password) {
            errors.password = '请输入密码';
        } else if (formData.password.length < 6) {
            errors.password = '密码长度至少6位';
        }

        if (!formData.confirmPassword) {
            errors.confirmPassword = '请确认密码';
        } else if (formData.password !== formData.confirmPassword) {
            errors.confirmPassword = '两次密码输入不一致';
        }
    } else if (type === 'forgotPassword') {
        if (!formData.email) {
            errors.email = '请输入邮箱';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = '请输入有效的邮箱地址';
        }

        if (!formData.code) {
            errors.code = '请输入验证码';
        } else if (formData.code.length !== 6) {
            errors.code = '验证码长度为6位';
        }

        if (!formData.newPassword) {
            errors.newPassword = '请输入新密码';
        } else if (formData.newPassword.length < 6) {
            errors.newPassword = '密码长度至少6位';
        }

        if (!formData.confirmNewPassword) {
            errors.confirmNewPassword = '请确认新密码';
        } else if (formData.newPassword !== formData.confirmNewPassword) {
            errors.confirmNewPassword = '两次密码输入不一致';
        }
    }

    return errors;
};

const AuthPage: React.FC = () => {
    // 状态管理
    const [formType, setFormType] = useState<FormType>('login');
    const [formData, setFormData] = useState({
        usernameOrEmail: '',
        username: '',
        email: '',
        code: '',
        password: '',
        confirmPassword: '',
        newPassword: '',
        confirmNewPassword: ''
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    // 处理输入变化
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // 清除对应字段的错误
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    // 发送验证码
    const handleSendCode = () => {
        const email = formData.email;
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setErrors(prev => ({ ...prev, email: '请输入有效的邮箱地址' }));
            return;
        }

        // 清除邮箱错误
        if (errors.email) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.email;
                return newErrors;
            });
        }

        // 模拟发送验证码请求
        console.log(`发送验证码到邮箱: ${email}`);
        setCountdown(60);
        setMessage({ text: '验证码已发送，请注意查收', type: 'success' });
    };

    // 倒计时效果
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    // 处理表单提交
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // 验证表单
        const newErrors = validateForm(formType, formData);
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setIsSubmitting(true);
        setMessage(null);

        // 模拟API请求
        setTimeout(() => {
            if (formType === 'login') {
                console.log('登录成功', formData);
                setMessage({ text: '登录成功，正在跳转...', type: 'success' });
                // 实际项目中这里应该跳转到首页或其他页面
            } else if (formType === 'register') {
                console.log('注册成功', formData);
                setMessage({ text: '注册成功，请登录', type: 'success' });
                // 注册成功后切换到登录表单
                setTimeout(() => setFormType('login'), 1500);
            } else if (formType === 'forgotPassword') {
                console.log('密码重置成功', formData);
                setMessage({ text: '密码重置成功，请登录', type: 'success' });
                // 重置成功后切换到登录表单
                setTimeout(() => setFormType('login'), 1500);
            }
            setIsSubmitting(false);
        }, 1500);
    };

    // 切换表单视图
    const switchForm = (type: FormType) => {
        setFormType(type);
        setErrors({});
        setMessage(null);
        // 重置相关表单字段
        setFormData(prev => ({
            ...prev,
            code: '',
            password: '',
            confirmPassword: '',
            newPassword: '',
            confirmNewPassword: ''
        }));
        setCountdown(0);
    };

    // 渲染表单标题
    const renderTitle = () => {
        switch (formType) {
            case 'login':
                return '欢迎回来';
            case 'register':
                return '创建账号';
            case 'forgotPassword':
                return '重置密码';
            default:
                return '';
        }
    };

    // 渲染表单描述
    const renderDescription = () => {
        switch (formType) {
            case 'login':
                return '请输入您的账号信息登录';
            case 'register':
                return '创建新账号，开始您的旅程';
            case 'forgotPassword':
                return '输入您的邮箱，我们将发送验证码重置密码';
            default:
                return '';
        }
    };

    return (
        <>
            <div className={styles.authPage}>
                <div className={styles.authCard}>
                    {/* 顶部装饰条 */}
                    <div className={styles.topBar}></div>

                    {/* 表单内容 */}
                    <div className={styles.content}>
                        {/* 返回按钮（除了登录页） */}
                        {formType !== 'login' && (
                            <button
                                onClick={() => switchForm('login')}
                                className={styles.backButton}
                            >
                                <ArrowLeft size={18} />
                                <span>返回登录</span>
                            </button>
                        )}

                        {/* 标题和描述 */}
                        <div>
                            <h2 className={styles.title}>{renderTitle()}</h2>
                            <p className={styles.description}>{renderDescription()}</p>
                        </div>

                        {/* 消息提示 */}
                        {message && (
                            <div
                                className={`${styles.message} ${message.type === 'success' ? styles.messageSuccess : styles.messageError}`}
                            >
                                {message.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
                                <span>{message.text}</span>
                            </div>
                        )}

                        {/* 表单 */}
                        <form onSubmit={handleSubmit} className={styles.form}>
                            {/* 登录表单字段 */}
                            {formType === 'login' && (
                                <>
                                    <div className={styles.formGroup}>
                                        <label
                                            htmlFor="usernameOrEmail"
                                            className={styles.label}
                                        >
                                            用户名或邮箱
                                        </label>
                                        <div className={styles.formControl}>
                                            <User size={18} className={styles.icon} />
                                            <input
                                                type="text"
                                                id="usernameOrEmail"
                                                name="usernameOrEmail"
                                                value={formData.usernameOrEmail}
                                                onChange={handleInputChange}
                                                className={`${styles.input} ${errors.usernameOrEmail ? styles.inputError : ''}`}
                                                placeholder="请输入用户名或邮箱"
                                            />
                                        </div>
                                        {errors.usernameOrEmail && (
                                            <p className={styles.errorText}>
                                                <AlertCircle size={14} />
                                                {errors.usernameOrEmail}
                                            </p>
                                        )}
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label
                                            htmlFor="password"
                                            className={styles.label}
                                        >
                                            密码
                                        </label>
                                        <div className={styles.formControl}>
                                            <Lock size={18} className={styles.icon} />
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                id="password"
                                                name="password"
                                                value={formData.password}
                                                onChange={handleInputChange}
                                                className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
                                                placeholder="请输入密码"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className={styles.actionButton}
                                            >
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                        {errors.password && (
                                            <p className={styles.errorText}>
                                                <AlertCircle size={14} />
                                                {errors.password}
                                            </p>
                                        )}
                                    </div>
                                </>
                            )}

                            {/* 注册表单字段 */}
                            {formType === 'register' && (
                                <>
                                    <div className={styles.formGroup}>
                                        <label
                                            htmlFor="username"
                                            className={styles.label}
                                        >
                                            用户名
                                        </label>
                                        <div className={styles.formControl}>
                                            <User size={18} className={styles.icon} />
                                            <input
                                                type="text"
                                                id="username"
                                                name="username"
                                                value={formData.username}
                                                onChange={handleInputChange}
                                                className={`${styles.input} ${errors.username ? styles.inputError : ''}`}
                                                placeholder="请输入用户名"
                                            />
                                        </div>
                                        {errors.username && (
                                            <p className={styles.errorText}>
                                                <AlertCircle size={14} />
                                                {errors.username}
                                            </p>
                                        )}
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label
                                            htmlFor="email"
                                            className={styles.label}
                                        >
                                            邮箱
                                        </label>
                                        <div className={styles.formControl}>
                                            <Mail size={18} className={styles.icon} />
                                            <input
                                                type="email"
                                                id="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                                                placeholder="请输入邮箱"
                                            />
                                        </div>
                                        {errors.email && (
                                            <p className={styles.errorText}>
                                                <AlertCircle size={14} />
                                                {errors.email}
                                            </p>
                                        )}
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label
                                            htmlFor="code"
                                            className={styles.label}
                                        >
                                            验证码
                                        </label>
                                        <div className={styles.formControl}>
                                            <Mail size={18} className={styles.icon} />
                                            <input
                                                type="text"
                                                id="code"
                                                name="code"
                                                value={formData.code}
                                                onChange={handleInputChange}
                                                className={`${styles.input} ${errors.code ? styles.inputError : ''}`}
                                                placeholder="请输入验证码"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleSendCode}
                                                disabled={countdown > 0}
                                                className={styles.actionButton}
                                            >
                                                {countdown > 0 ? `${countdown}s后重发` : '获取验证码'}
                                            </button>
                                        </div>
                                        {errors.code && (
                                            <p className={styles.errorText}>
                                                <AlertCircle size={14} />
                                                {errors.code}
                                            </p>
                                        )}
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label
                                            htmlFor="password"
                                            className={styles.label}
                                        >
                                            密码
                                        </label>
                                        <div className={styles.formControl}>
                                            <Lock size={18} className={styles.icon} />
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                id="password"
                                                name="password"
                                                value={formData.password}
                                                onChange={handleInputChange}
                                                className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
                                                placeholder="请输入密码"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className={styles.actionButton}
                                            >
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                        {errors.password && (
                                            <p className={styles.errorText}>
                                                <AlertCircle size={14} />
                                                {errors.password}
                                            </p>
                                        )}
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label
                                            htmlFor="confirmPassword"
                                            className={styles.label}
                                        >
                                            确认密码
                                        </label>
                                        <div className={styles.formControl}>
                                            <Lock size={18} className={styles.icon} />
                                            <input
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                id="confirmPassword"
                                                name="confirmPassword"
                                                value={formData.confirmPassword}
                                                onChange={handleInputChange}
                                                className={`${styles.input} ${errors.confirmPassword ? styles.inputError : ''}`}
                                                placeholder="请确认密码"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className={styles.actionButton}
                                            >
                                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                        {errors.confirmPassword && (
                                            <p className={styles.errorText}>
                                                <AlertCircle size={14} />
                                                {errors.confirmPassword}
                                            </p>
                                        )}
                                    </div>
                                </>
                            )}

                            {/* 忘记密码表单字段 */}
                            {formType === 'forgotPassword' && (
                                <>
                                    <div className={styles.formGroup}>
                                        <label
                                            htmlFor="email"
                                            className={styles.label}
                                        >
                                            邮箱
                                        </label>
                                        <div className={styles.formControl}>
                                            <Mail size={18} className={styles.icon} />
                                            <input
                                                type="email"
                                                id="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                                                placeholder="请输入邮箱"
                                            />
                                        </div>
                                        {errors.email && (
                                            <p className={styles.errorText}>
                                                <AlertCircle size={14} />
                                                {errors.email}
                                            </p>
                                        )}
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label
                                            htmlFor="code"
                                            className={styles.label}
                                        >
                                            验证码
                                        </label>
                                        <div className={styles.formControl}>
                                            <Mail size={18} className={styles.icon} />
                                            <input
                                                type="text"
                                                id="code"
                                                name="code"
                                                value={formData.code}
                                                onChange={handleInputChange}
                                                className={`${styles.input} ${errors.code ? styles.inputError : ''}`}
                                                placeholder="请输入验证码"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleSendCode}
                                                disabled={countdown > 0}
                                                className={styles.actionButton}
                                            >
                                                {countdown > 0 ? `${countdown}s后重发` : '获取验证码'}
                                            </button>
                                        </div>
                                        {errors.code && (
                                            <p className={styles.errorText}>
                                                <AlertCircle size={14} />
                                                {errors.code}
                                            </p>
                                        )}
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label
                                            htmlFor="newPassword"
                                            className={styles.label}
                                        >
                                            新密码
                                        </label>
                                        <div className={styles.formControl}>
                                            <Lock size={18} className={styles.icon} />
                                            <input
                                                type={showNewPassword ? 'text' : 'password'}
                                                id="newPassword"
                                                name="newPassword"
                                                value={formData.newPassword}
                                                onChange={handleInputChange}
                                                className={`${styles.input} ${errors.newPassword ? styles.inputError : ''}`}
                                                placeholder="请输入新密码"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                                className={styles.actionButton}
                                            >
                                                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                        {errors.newPassword && (
                                            <p className={styles.errorText}>
                                                <AlertCircle size={14} />
                                                {errors.newPassword}
                                            </p>
                                        )}
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label
                                            htmlFor="confirmNewPassword"
                                            className={styles.label}
                                        >
                                            确认新密码
                                        </label>
                                        <div className={styles.formControl}>
                                            <Lock size={18} className={styles.icon} />
                                            <input
                                                type={showConfirmNewPassword ? 'text' : 'password'}
                                                id="confirmNewPassword"
                                                name="confirmNewPassword"
                                                value={formData.confirmNewPassword}
                                                onChange={handleInputChange}
                                                className={`${styles.input} ${errors.confirmNewPassword ? styles.inputError : ''}`}
                                                placeholder="请确认新密码"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                                                className={styles.actionButton}
                                            >
                                                {showConfirmNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                        {errors.confirmNewPassword && (
                                            <p className={styles.errorText}>
                                                <AlertCircle size={14} />
                                                {errors.confirmNewPassword}
                                            </p>
                                        )}
                                    </div>
                                </>
                            )}

                            {/* 提交按钮 */}
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={`${styles.btn} ${styles.primaryBtn}`}
                            >
                                {isSubmitting ? (
                                    <div className={styles.btnLoading}>
                                        <div className={styles.loadingSpinner}></div>
                                        <span>处理中...</span>
                                    </div>
                                ) : formType === 'login' ? '登录' : formType === 'register' ? '注册' : '重置密码'}
                            </button>

                            {/* 表单切换链接 */}
                            <div className={styles.formSwitch}>
                                {formType === 'login' ? (
                                    <div style={{ display: 'flex', alignContent: 'center', justifyContent: 'center', gap: '20px', flexWrap: 'wrap'}}>
                                        <div>忘记密码？
                                            <button
                                                type="button"
                                                onClick={() => switchForm('forgotPassword')}
                                                className={`${styles.btn} ${styles.textBtn}`}
                                            >
                                                点击重置
                                            </button>
                                        </div>
                                        
                                        {/* 竖直分隔符 */}
                                        <div style={{
                                            width: '1px',
                                            height: '20px',

                                            backgroundColor: '#ddd',
                                        }}></div>

                                        <div>还没有账号？
                                            <button
                                                type="button"
                                                onClick={() => switchForm('register')}
                                                className={`${styles.btn} ${styles.textBtn}`}
                                            >
                                                立即注册
                                            </button>
                                        </div>
                                    </div>
                                ) : formType === 'register' ? (
                                    <div>
                                        已有账号？
                                        <button
                                            type="button"
                                            onClick={() => switchForm('login')}
                                            className={`${styles.btn} ${styles.textBtn}`}
                                        >
                                            立即登录
                                        </button>
                                    </div>
                                ) : (
                                    <div>
                                        想起密码了？
                                        <button
                                            type="button"
                                            onClick={() => switchForm('login')}
                                            className={`${styles.btn} ${styles.textBtn}`}
                                        >
                                            立即登录
                                        </button>
                                    </div>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            <Footer companyName="TechBlog" startYear={2025} />
        </>
    );
};

export default AuthPage;