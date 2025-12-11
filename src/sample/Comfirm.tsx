import React from "react";
import { confirm } from "../components/confirm/Confirm";

const ExampleConfirm: React.FC = () => {
    // 基础用法
    const handleDelete = async () => {
        const confirmed = await confirm({
            title: "删除确认",
            content: "确定要删除这条数据吗？此操作不可撤销。",
            confirmText: "删除",
            cancelText: "取消",
        });

        if (confirmed) {
            // 执行删除操作
            // console.log('执行删除操作');
        }
    };

    // 带异步操作的用法
    const handleSubmit = async () => {
        const confirmed = await confirm({
            title: "提交确认",
            content: (
                <div>
                    <p>请确认以下信息无误：</p>
                    <ul style={{ marginTop: "8px", paddingLeft: "20px" }}>
                        <li>用户名：张三</li>
                        <li>邮箱：zhangsan@example.com</li>
                    </ul>
                </div>
            ),
            onConfirm: async () => {
                // 模拟API请求
                await new Promise((resolve) => setTimeout(resolve, 1500));
            },
        });

        if (confirmed) {
            // console.log('提交成功');
        }
    };

    // 自定义按钮和行为
    const handleSpecialAction = async () => {
        await confirm({
            title: "特殊操作",
            content: "这是一个没有取消按钮的确认框",
            confirmText: "继续",
            showCancel: false,
            closeOnMaskClick: false, // 点击遮罩层不关闭
        });
    };

    return (
        <div style={{ padding: "20px" }}>
            <button onClick={handleDelete} style={{ marginRight: "10px" }}>
                删除数据
            </button>
            <button onClick={handleSubmit} style={{ marginRight: "10px" }}>
                提交信息
            </button>
            <button onClick={handleSpecialAction}>特殊操作</button>
        </div>
    );
};

export default ExampleConfirm;
