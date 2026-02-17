import Switch from "../components/switcher/Switch";
import { useState } from "react";

function SampleSwitch() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <>
      <div style={{ padding: "20px", maxWidth: "400px" }}>
        <h2>开关组件示例</h2>

        {/* 基础用法 */}
        <div style={{ marginBottom: "20px" }}>
          <h3>1. 基础开关</h3>
          <Switch checked={isEnabled} onChange={(checked) => setIsEnabled(checked)} style={{ marginRight: "10px" }} />
          <span>状态: {isEnabled ? "开启" : "关闭"}</span>
        </div>

        {/* 不同尺寸 */}
        <div style={{ marginBottom: "20px" }}>
          <h3>2. 不同尺寸</h3>
          <Switch size="small" defaultChecked style={{ marginRight: "10px" }} />
          <Switch size="default" defaultChecked style={{ marginRight: "10px" }} />
          <Switch size="large" defaultChecked />
        </div>

        {/* 自定义颜色 */}
        <div style={{ marginBottom: "20px" }}>
          <h3>3. 自定义颜色</h3>
          <Switch onColor="#52c41a" offColor="#f5222d" defaultChecked style={{ marginRight: "10px" }} />
          <Switch onColor="#faad14" offColor="#722ed1" defaultChecked style={{ marginRight: "10px" }} />
        </div>

        {/* 禁用状态 */}
        <div style={{ marginBottom: "20px" }}>
          <h3>4. 禁用状态</h3>
          <Switch disabled defaultChecked style={{ marginRight: "10px" }} />
          <Switch disabled style={{ marginRight: "10px" }} />
        </div>

        {/* 实际应用场景 */}
        <div style={{ marginBottom: "20px" }}>
          <h3>5. 实际应用</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>自动保存</span>
              <Switch checked={autoSave} onChange={setAutoSave} onColor="#52c41a" />
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>暗黑模式</span>
              <Switch checked={darkMode} onChange={setDarkMode} onColor="#1890ff" />
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>消息通知</span>
              <Switch defaultChecked onColor="#faad14" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default SampleSwitch;
