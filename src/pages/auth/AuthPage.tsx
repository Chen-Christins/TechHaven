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
import { useAuth } from '../../contexts/AuthContext';
import { AuthService } from '../../services/authService';
import { CodeType } from '../../utils/http';
import { CookieHelper } from '../../utils/cookieHelper';


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
        if (!formData.account) {
            errors.account = '请输入账号';
        } else if (formData.account.length < 3) {
            errors.account = '账号长度至少3位';
        }

        if (!formData.email) {
            errors.email = '请输入邮箱';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = '请输入有效的邮箱地址';
        }

        if (!formData.auth_code) {
            errors.auth_code = '请输入验证码';
        } else if (formData.auth_code.length !== 8) {
            errors.auth_code = '验证码长度为8位';
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
        } else if (formData.code.length !== 8) {
            errors.code = '验证码长度为8位';
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
    // 获取认证状态
    const { login } = useAuth();

    // 页面加载时检查cookies状态
    useEffect(() => {
        // console.log('📄 AuthPage加载，检查当前Cookies状态...');
        // CookieHelper.debugCookies();
        // console.log('🔍 是否有认证相关Cookies:', CookieHelper.hasAuthCookies());
    }, []);

    // 状态管理
    const [formType, setFormType] = useState<FormType>('login');
    const [formData, setFormData] = useState({
        usernameOrEmail: '',
        account: '',
        email: '',
        auth_code: '',
        code: '', // 保留用于密码重置
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
    const handleSendCode = async () => {
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

        try {
            setIsSubmitting(true);

            // 根据表单类型选择验证码类型
            let codeType: CodeType;
            if (formType === 'register') {
                codeType = CodeType.REGISTER;
                await AuthService.sendRegisterCode(email);
            } else if (formType === 'forgotPassword') {
                codeType = CodeType.PASSWORD_RESET;
                await AuthService.sendPasswordResetCode(email);
            } else {
                throw new Error('不支持的验证码类型');
            }

            setCountdown(60);
            setMessage({ text: '验证码已发送，请注意查收', type: 'success' });
            console.log(`验证码已发送到邮箱: ${email}, 类型: ${codeType}`);
        } catch (error: any) {
            console.error('发送验证码失败:', error);
            setMessage({ text: error.message || '验证码发送失败', type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    // 倒计时效果
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    // 处理表单提交
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // 验证表单
        const newErrors = validateForm(formType, formData);
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setIsSubmitting(true);
        setMessage(null);

        try {
            if (formType === 'login') {
                // 登录逻辑
                await login(formData.usernameOrEmail, formData.password);

                // 调试：检查登录后的cookies状态
                console.log('🔐 登录成功，检查Cookies状态...');
                CookieHelper.debugCookies();
                console.log('🔍 是否有认证相关Cookies:', CookieHelper.hasAuthCookies());

                setMessage({ text: '登录成功，正在跳转...', type: 'success' });
                // 登录成功后，AuthContext会自动处理状态更新
                // 跳转前再次检查cookies
                console.log('🔄 页面跳转前检查Cookies...');
                CookieHelper.debugCookies();
                window.location.href = '/index';
            } else if (formType === 'register') {
                // 注册逻辑
                await AuthService.register({
                    account: formData.account,
                    email: formData.email,
                    passwd: formData.password,  // AuthService 内部会进行 MD5 加密
                    auth_code: formData.auth_code
                });
                setMessage({ text: '注册成功，请登录', type: 'success' });
                console.log('注册成功:', formData);
                // 注册成功后切换到登录表单
                setTimeout(() => setFormType('login'), 500);
            } else if (formType === 'forgotPassword') {
                // 密码重置逻辑（这里需要根据实际后台API调整）
                console.log('密码重置请求:', {
                    email: formData.email,
                    code: formData.code,
                    newPassword: formData.newPassword
                });
                setMessage({ text: '密码重置成功，请登录', type: 'success' });
                // 重置成功后切换到登录表单
                setTimeout(() => setFormType('login'), 500);
            }
        } catch (error: any) {
            console.error(`${formType}失败:`, error);
            setMessage({ text: error.message || `${formType === 'login' ? '登录' : formType === 'register' ? '注册' : '重置密码'}失败`, type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    // 切换表单视图
    const switchForm = (type: FormType) => {
        setFormType(type);
        setErrors({});
        setMessage(null);
        // 重置相关表单字段
        setFormData(prev => ({
            ...prev,
            auth_code: '',
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
        <div className={styles.authPage}>
            <div className={styles.mainContent}>
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
                                            htmlFor="account"
                                            className={styles.label}
                                        >
                                            账号
                                        </label>
                                        <div className={styles.formControl}>
                                            <User size={18} className={styles.icon} />
                                            <input
                                                type="text"
                                                id="account"
                                                name="account"
                                                value={formData.account}
                                                onChange={handleInputChange}
                                                className={`${styles.input} ${errors.account ? styles.inputError : ''}`}
                                                placeholder="请输入账号"
                                            />
                                        </div>
                                        {errors.account && (
                                            <p className={styles.errorText}>
                                                <AlertCircle size={14} />
                                                {errors.account}
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
                                            htmlFor="auth_code"
                                            className={styles.label}
                                        >
                                            验证码
                                        </label>
                                        <div className={styles.formControl}>
                                            <Mail size={18} className={styles.icon} />
                                            <input
                                                type="text"
                                                id="auth_code"
                                                name="auth_code"
                                                value={formData.auth_code}
                                                onChange={handleInputChange}
                                                className={`${styles.input} ${errors.auth_code ? styles.inputError : ''}`}
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
                                        {errors.auth_code && (
                                            <p className={styles.errorText}>
                                                <AlertCircle size={14} />
                                                {errors.auth_code}
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
                                        <span>{formType === 'login' ? '登录中...' : formType === 'register' ? '注册中...' : '重置中...'}</span>
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
        </div>
    );
};

export default AuthPage;