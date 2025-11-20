import React, { useRef } from 'react';
import { FaPlus } from 'react-icons/fa';
import { confirm } from '../confirm/Confirm';
import type { SelectOption } from '../../types/index';
import styles from './AddButton.module.css';

interface AddButtonProps {
    name: string;
    onAdd: (newItem: SelectOption) => void;
    className?: string;
}

const AddButton: React.FC<AddButtonProps> = ({
    name,
    onAdd,
    className = ''
}) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const colorInputRef = useRef<HTMLInputElement>(null);

    const handleClick = async () => {
        // 创建自定义内容
        const content = (
            <div style={{ width: '100%' }}>
                <div style={{ marginBottom: '16px' }}>
                    <label style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontWeight: '500',
                        color: 'var(--text-primary)'
                    }}>
                        {name}名称
                    </label>
                    <input
                        ref={inputRef}
                        type="text"
                        style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid var(--border-primary)',
                            borderRadius: '4px',
                            fontSize: '14px',
                            backgroundColor: 'var(--input-bg)',
                            color: 'var(--text-primary)'
                        }}
                        placeholder={`请输入${name}名称...`}
                        defaultValue=""
                        autoFocus
                    />
                </div>
                <div>
                    <label style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontWeight: '500',
                        color: 'var(--text-primary)'
                    }}>
                        颜色
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <input
                            ref={colorInputRef}
                            type="color"
                            style={{
                                width: '50px',
                                height: '38px',
                                border: '1px solid var(--border-primary)',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                padding: '2px'
                            }}
                            defaultValue="#4361ee"
                        />
                        <div
                            style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '4px',
                                border: '1px solid var(--border-primary)',
                                backgroundColor: '#4361ee'
                            }}
                        />
                    </div>
                </div>
            </div>
        );

        // 显示确认框
        await confirm({
            title: `添加新${name}`,
            content: content,
            confirmText: '添加',
            cancelText: '取消',
            onConfirm: () => {
                const itemName = inputRef.current?.value || '';
                const itemColor = colorInputRef.current?.value || '#4361ee';

                if (itemName.trim()) {
                    const newItem: SelectOption = {
                        id: Date.now(), // 临时ID，实际应该由后端生成
                        name: itemName.trim(),
                        color: itemColor
                    };
                    onAdd(newItem);
                } else {
                    throw new Error('请输入名称');
                }
            }
        });
    };

    return (
        <button
            className={`${styles.addButton} ${className}`}
            onClick={handleClick}
            title={`添加新${name}`}
        >
            <FaPlus className={styles.addIcon} />
        </button>
    );
};

export default AddButton;