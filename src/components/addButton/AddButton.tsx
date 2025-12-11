import React from "react";
import { FaPlus } from "react-icons/fa";
import { confirm } from "../confirm/Confirm";
import type { SelectOption } from "../../types/index";
import styles from "./AddButton.module.css";

interface AddButtonProps {
    name: string;
    onAdd: (newItem: SelectOption) => void;
    className?: string;
}

const AddButton: React.FC<AddButtonProps> = ({ name, onAdd, className = "" }) => {
    const handleClick = async () => {
        // 弹窗内容需要有状态
        const inputRef = React.createRef<HTMLInputElement>();
        const colorInputRef = React.createRef<HTMLInputElement>();
        // 用于颜色板动态变化
        function ColorContent() {
            const [color, setColor] = React.useState("#4361ee");
            return (
                <div style={{ width: "100%" }}>
                    <div style={{ marginBottom: "16px" }}>
                        <label
                            style={{
                                display: "block",
                                marginBottom: "8px",
                                fontWeight: "500",
                                color: "var(--text-primary)",
                            }}
                        >
                            {name}名称
                        </label>
                        <input
                            ref={inputRef}
                            type="text"
                            style={{
                                width: "100%",
                                padding: "8px 12px",
                                border: "1px solid var(--border-primary)",
                                borderRadius: "4px",
                                fontSize: "14px",
                                backgroundColor: "var(--input-bg)",
                                color: "var(--text-primary)",
                            }}
                            placeholder={`请输入${name}名称...`}
                            defaultValue=""
                            autoFocus
                        />
                    </div>
                    <div>
                        <label
                            style={{
                                display: "block",
                                marginBottom: "8px",
                                fontWeight: "500",
                                color: "var(--text-primary)",
                            }}
                        >
                            颜色
                        </label>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <input
                                ref={colorInputRef}
                                type="color"
                                style={{
                                    width: "50px",
                                    height: "38px",
                                    border: "1px solid var(--border-primary)",
                                    borderRadius: "4px",
                                    cursor: "pointer",
                                    padding: "2px",
                                }}
                                value={color}
                                onChange={(e) => setColor(e.target.value)}
                            />
                            <div
                                style={{
                                    width: "38px",
                                    height: "38px",
                                    borderRadius: "4px",
                                    border: "1px solid var(--border-primary)",
                                    backgroundColor: color,
                                }}
                            />
                        </div>
                    </div>
                </div>
            );
        }
        // 显示确认框
        await confirm({
            title: `添加新${name}`,
            content: <ColorContent />,
            confirmText: "添加",
            cancelText: "取消",
            onConfirm: () => {
                const itemName = inputRef.current?.value || "";
                // 直接取 colorInputRef.current?.value
                const itemColor = colorInputRef.current?.value || "#4361ee";
                if (itemName.trim()) {
                    const newItem: SelectOption = {
                        id: Date.now(),
                        name: itemName.trim(),
                        color: itemColor,
                    };
                    onAdd(newItem);
                } else {
                    throw new Error("请输入名称");
                }
            },
        });
    };

    return (
        <button className={`${styles.addButton} ${className}`} onClick={handleClick} title={`添加新${name}`}>
            <FaPlus className={styles.addIcon} />
        </button>
    );
};

export default AddButton;
