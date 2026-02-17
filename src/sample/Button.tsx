import Button from "../components/button/Button";

function SampleButton() {
  return (
    <>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          padding: "20px",
        }}
      >
        <h2>按钮示例</h2>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <Button size="small" color="primary" variant="solid">
            主要按钮
          </Button>
          <Button size="small" color="secondary" variant="solid">
            次要按钮
          </Button>
          <Button size="small" color="success" variant="solid">
            成功按钮
          </Button>
          <Button size="small" color="warning" variant="solid">
            警告按钮
          </Button>
          <Button size="small" color="error" variant="solid">
            错误按钮
          </Button>
          <Button size="small" color="info" variant="solid">
            信息按钮
          </Button>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <Button size="small" color="warning" variant="solid">
            实心警告
          </Button>
          <Button size="small" color="warning" variant="outline">
            描边警告
          </Button>
          <Button size="small" color="warning" variant="ghost">
            幽灵警告
          </Button>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <Button size="small" disabled>
            禁用按钮
          </Button>
          <Button size="small" loading>
            加载中...
          </Button>
          <Button size="small" color="error" disabled>
            禁用错误按钮
          </Button>
        </div>
      </div>
    </>
  );
}

export default SampleButton;
