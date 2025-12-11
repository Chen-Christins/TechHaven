import React from "react";

interface SkeletonArticleViewProps {
    count?: number; // 表示要显示多少个骨架屏项
}

const SkeletonArticleView: React.FC<SkeletonArticleViewProps> = ({ count = 1 }) => {
    const skeletons = Array.from({ length: count }, (_, index) => (
        <div
            key={index}
            style={{
                padding: "2rem",
                maxWidth: "800px",
                margin: "0 auto",
                width: "100%",
            }}
        >
            <div
                style={{
                    height: "40px",
                    backgroundColor: "var(--bg-secondary, #f0f0f0)",
                    borderRadius: "8px",
                    marginBottom: "1rem",
                    animation: "pulse 1.5s ease-in-out infinite",
                }}
            ></div>
            <div
                style={{
                    height: "20px",
                    backgroundColor: "var(--bg-secondary, #f0f0f0)",
                    borderRadius: "6px",
                    marginBottom: "0.5rem",
                    animation: "pulse 1.5s ease-in-out infinite",
                }}
            ></div>
            <div
                style={{
                    height: "20px",
                    backgroundColor: "var(--bg-secondary, #f0f0f0)",
                    borderRadius: "6px",
                    marginBottom: "0.5rem",
                    animation: "pulse 1.5s ease-in-out infinite",
                }}
            ></div>
            <div
                style={{
                    height: "20px",
                    backgroundColor: "var(--bg-secondary, #f0f0f0)",
                    borderRadius: "6px",
                    marginBottom: "1rem",
                    animation: "pulse 1.5s ease-in-out infinite",
                }}
            ></div>
            <div
                style={{
                    height: "150px",
                    backgroundColor: "var(--bg-secondary, #f0f0f0)",
                    borderRadius: "8px",
                    marginBottom: "1rem",
                    animation: "pulse 1.5s ease-in-out infinite",
                }}
            ></div>
            <div
                style={{
                    height: "16px",
                    backgroundColor: "var(--bg-secondary, #f0f0f0)",
                    borderRadius: "4px",
                    marginBottom: "0.5rem",
                    animation: "pulse 1.5s ease-in-out infinite",
                    width: "65%",
                }}
            ></div>
        </div>
    ));

    return (
        <div style={{ width: "100%", padding: "1rem" }}>
            <style>
                {`
                    @keyframes pulse {
                        0% {
                            opacity: 0.6;
                        }
                        50% {
                            opacity: 1;
                        }
                        100% {
                            opacity: 0.6;
                        }
                    }
                `}
            </style>
            {skeletons}
        </div>
    );
};

export default SkeletonArticleView;
