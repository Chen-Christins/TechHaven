import React from "react";

const OrganizationDetailSkeleton: React.FC = () => {
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

      {/* 顶部区域骨架 - 包含返回按钮和标题 */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div
          style={{
            height: "36px",
            width: "100px",
            backgroundColor: "var(--bg-secondary, #f0f0f0)",
            borderRadius: "6px",
            marginBottom: "1.5rem",
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        ></div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
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
                width: "40%",
              }}
            ></div>
            <div
              style={{
                height: "20px",
                backgroundColor: "var(--bg-secondary, #f0f0f0)",
                borderRadius: "4px",
                animation: "pulse 1.5s ease-in-out infinite",
                width: "25%",
              }}
            ></div>
          </div>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <div
              style={{
                height: "28px",
                width: "80px",
                backgroundColor: "var(--bg-secondary, #f0f0f0)",
                borderRadius: "6px",
                animation: "pulse 1.5s ease-in-out infinite",
              }}
            ></div>
            <div
              style={{
                height: "28px",
                width: "100px",
                backgroundColor: "var(--bg-secondary, #f0f0f0)",
                borderRadius: "6px",
                animation: "pulse 1.5s ease-in-out infinite",
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* 描述区域骨架 */}
      <div
        style={{
          height: "60px",
          backgroundColor: "var(--bg-secondary, #f0f0f0)",
          borderRadius: "8px",
          marginBottom: "2rem",
          animation: "pulse 1.5s ease-in-out infinite",
        }}
      ></div>

      {/* 统计卡片区域骨架 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            style={{
              backgroundColor: "var(--bg-secondary, #f0f0f0)",
              borderRadius: "8px",
              padding: "1.5rem",
              height: "100px",
              animation: "pulse 1.5s ease-in-out infinite",
            }}
          ></div>
        ))}
      </div>

      {/* 成员列表表头骨架 */}
      <div style={{ marginBottom: "1rem" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1rem",
          }}
        >
          <div
            style={{
              height: "24px",
              width: "100px",
              backgroundColor: "var(--bg-secondary, #f0f0f0)",
              borderRadius: "4px",
              animation: "pulse 1.5s ease-in-out infinite",
            }}
          ></div>
          <div
            style={{
              height: "20px",
              width: "80px",
              backgroundColor: "var(--bg-secondary, #f0f0f0)",
              borderRadius: "4px",
              animation: "pulse 1.5s ease-in-out infinite",
            }}
          ></div>
        </div>

        {/* 表格头部骨架 */}
        <div
          style={{
            display: "flex",
            gap: "1rem",
            padding: "1rem",
            backgroundColor: "var(--bg-secondary, #f0f0f0)",
            borderRadius: "8px",
            marginBottom: "1rem",
            height: "40px",
          }}
        >
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              style={{
                flex: i === 0 ? 2 : 1,
                height: "16px",
                backgroundColor: "var(--bg-tertiary, #e0e0e0)",
                borderRadius: "4px",
                animation: "pulse 1.5s ease-in-out infinite",
              }}
            ></div>
          ))}
        </div>

        {/* 表格行骨架 - 模拟成员列表 */}
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: "1rem",
              padding: "1rem",
              backgroundColor: "var(--bg-secondary, #f0f0f0)",
              borderRadius: "8px",
              marginBottom: "0.5rem",
              height: "60px",
              animation: "pulse 1.5s ease-in-out infinite",
            }}
          >
            {[...Array(5)].map((_, j) => (
              <div
                key={j}
                style={{
                  flex: j === 0 ? 2 : 1,
                  height: j === 0 ? "32px" : "16px",
                  backgroundColor: "var(--bg-tertiary, #e0e0e0)",
                  borderRadius: j === 0 ? "16px" : "4px",
                  animation: "pulse 1.5s ease-in-out infinite",
                }}
              ></div>
            ))}
          </div>
        ))}
      </div>

      {/* 分页区域骨架 */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1rem 0",
        }}
      >
        <div
          style={{
            height: "18px",
            width: "120px",
            backgroundColor: "var(--bg-secondary, #f0f0f0)",
            borderRadius: "4px",
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        ></div>
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
          }}
        >
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              style={{
                height: "32px",
                width: i === 1 || i === 2 ? "32px" : "70px",
                backgroundColor: "var(--bg-secondary, #f0f0f0)",
                borderRadius: "6px",
                animation: "pulse 1.5s ease-in-out infinite",
              }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrganizationDetailSkeleton;
