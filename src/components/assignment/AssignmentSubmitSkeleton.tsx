import React from "react";

const AssignmentSubmitSkeleton: React.FC = () => {
    return (
        <div
            style={{
                padding: "2rem",
                maxWidth: "1560px",
                margin: "0 auto",
                width: "100%",
                minHeight: "60vh",
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem",
            }}
        >
            <style>
                {`
          @keyframes pulse {
            0% { opacity: 0.6; }
            50% { opacity: 1; }
            100% { opacity: 0.6; }
          }
        `}
            </style>

            {/* 返回按钮骨架 */}
            <div
                style={{
                    width: "120px",
                    height: "36px",
                    backgroundColor: "var(--bg-secondary, #f0f0f0)",
                    borderRadius: "6px",
                    marginBottom: "1rem",
                    animation: "pulse 1.5s ease-in-out infinite",
                }}
            ></div>

            {/* 标题和课程信息骨架 */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "1rem",
                }}
            >
                <div style={{ flex: 1 }}>
                    <div
                        style={{
                            height: "32px",
                            backgroundColor: "var(--bg-secondary, #f0f0f0)",
                            borderRadius: "6px",
                            marginBottom: "0.5rem",
                            animation: "pulse 1.5s ease-in-out infinite",
                            width: "60%",
                        }}
                    ></div>
                    <div
                        style={{
                            height: "20px",
                            backgroundColor: "var(--bg-secondary, #f0f0f0)",
                            borderRadius: "4px",
                            animation: "pulse 1.5s ease-in-out infinite",
                            width: "40%",
                        }}
                    ></div>
                </div>
                <div
                    style={{
                        height: "28px",
                        width: "80px",
                        backgroundColor: "var(--bg-secondary, #f0f0f0)",
                        borderRadius: "14px",
                        animation: "pulse 1.5s ease-in-out infinite",
                    }}
                ></div>
            </div>

            {/* 信息卡片骨架 */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                    gap: "1rem",
                    marginBottom: "2rem",
                }}
            >
                {[...Array(3)].map((_, i) => (
                    <div
                        key={i}
                        style={{
                            backgroundColor: "var(--bg-secondary, #f0f0f0)",
                            borderRadius: "8px",
                            padding: "1rem",
                            height: "80px",
                            animation: "pulse 1.5s ease-in-out infinite",
                        }}
                    ></div>
                ))}
            </div>

            {/* 描述内容骨架 */}
            <div style={{ marginBottom: "2rem" }}>
                {[...Array(4)].map((_, i) => (
                    <div
                        key={i}
                        style={{
                            height: "16px",
                            backgroundColor: "var(--bg-secondary, #f0f0f0)",
                            borderRadius: "4px",
                            marginBottom: "0.5rem",
                            animation: "pulse 1.5s ease-in-out infinite",
                            width: i === 3 ? "70%" : "100%",
                        }}
                    ></div>
                ))}
            </div>

            {/* 上传区域骨架 */}
            <div style={{ marginBottom: "2rem" }}>
                <div
                    style={{
                        height: "180px",
                        backgroundColor: "var(--bg-secondary, #f0f0f0)",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        animation: "pulse 1.5s ease-in-out infinite",
                    }}
                >
                    <div
                        style={{
                            textAlign: "center",
                            color: "var(--text-tertiary, #ccc)",
                        }}
                    >
                        <div
                            style={{
                                height: "40px",
                                backgroundColor: "var(--bg-tertiary, #e0e0e0)",
                                borderRadius: "20px",
                                width: "240px",
                                margin: "0 auto 1rem",
                                animation: "pulse 1.5s ease-in-out infinite",
                            }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* 操作按钮骨架 */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "1rem",
                    marginTop: "1rem",
                }}
            >
                <div
                    style={{
                        height: "40px",
                        width: "80px",
                        backgroundColor: "var(--bg-secondary, #f0f0f0)",
                        borderRadius: "6px",
                        animation: "pulse 1.5s ease-in-out infinite",
                    }}
                ></div>
                <div
                    style={{
                        height: "40px",
                        width: "100px",
                        backgroundColor: "var(--bg-secondary, #f0f0f0)",
                        borderRadius: "6px",
                        animation: "pulse 1.5s ease-in-out infinite",
                    }}
                ></div>
            </div>
        </div>
    );
};

export default AssignmentSubmitSkeleton;
