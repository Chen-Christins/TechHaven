import Radio from "../components/radio/Radio";
import RadioGroup from "../components/radioGroup/RadioGroup";
import { useState } from "react";

function SampleRadioGroup() {
  const [selectedValue, setSelectedValue] = useState("");
  const options = [
    { label: "选项一", value: "1" },
    { label: "选项二", value: "2" },
    { label: "选项三", value: "3", disabled: true },
    { label: "选项四", value: "4" },
    { label: "选项五", value: "5" },
  ];

  const [groupValue] = useState("2");

  return (
    <>
      <div style={{ padding: "20px", maxWidth: "600px" }}>
        <h2>单选框组件示例</h2>

        {/* 使用 RadioGroup 组件 */}
        <div style={{ marginBottom: "24px" }}>
          <h3>1. 基础用法 - RadioGroup</h3>
          <RadioGroup options={options} value={groupValue} name="example-group" layout="vertical" style={{ marginBottom: "16px" }} />
          <p>当前选中的值: {groupValue}</p>
        </div>

        {/* 使用单个 Radio 组件 */}
        <div style={{ marginBottom: "24px" }}>
          <h3>2. 单个 Radio 组件</h3>
          <div>
            <Radio
              value="option1"
              checked={selectedValue === "option1"}
              onChange={(checked) => checked && setSelectedValue("option1")}
              name="single"
            >
              选项一
            </Radio>
            <Radio
              value="option2"
              checked={selectedValue === "option2"}
              onChange={(checked) => checked && setSelectedValue("option2")}
              name="single"
              style={{ marginLeft: "16px" }}
            >
              选项二
            </Radio>
          </div>
          <p>当前选中的值: {selectedValue}</p>
        </div>

        {/* 不同尺寸 */}
        <div style={{ marginBottom: "24px" }}>
          <h3>3. 不同尺寸</h3>
          <RadioGroup options={options.slice(0, 3)} size="small" layout="horizontal" style={{ marginBottom: "12px" }} />
          <RadioGroup options={options.slice(0, 3)} size="default" layout="horizontal" style={{ marginBottom: "12px" }} />
          <RadioGroup options={options.slice(0, 3)} size="large" layout="horizontal" />
        </div>

        {/* 禁用状态 */}
        <div style={{ marginBottom: "24px" }}>
          <h3>4. 禁用状态</h3>
          <RadioGroup options={options} defaultValue="1" disabled layout="vertical" />
        </div>

        {/* 水平布局 */}
        <div>
          <h3>5. 水平布局</h3>
          <RadioGroup options={options} defaultValue="1" layout="horizontal" />
        </div>
      </div>
    </>
  );
}

export default SampleRadioGroup;
