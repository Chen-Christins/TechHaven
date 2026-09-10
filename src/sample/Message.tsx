import React from "react";
import message from "../components/message/Message";

const ExampleMessages: React.FC = () => {
    const showMessages = () => {
        // 显示成功消息
        message.success("操作成功！");

        // 显示警告消息，5秒后自动关闭
        message.warn("请注意，这是一个警告", { duration: 5000 });

        // 显示错误消息，位置在左下角
        message.error("操作失败，请重试", { position: "bottom-left" });

        // 显示信息消息，不自动关闭
        const infoId = message.info("这是一条信息，需要手动关闭", { duration: 0 });

        // 5秒后手动关闭信息消息
        setTimeout(() => {
            message.close(infoId);
        }, 5000);
    };

    return (
        <div>
            <button onClick={showMessages}>显示各种消息</button>
        </div>
    );
};

export default ExampleMessages;
