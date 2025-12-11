import Selector from "../components/selector/Selector";
import { useState } from "react";

function SampleSelector() {
    const [isLoading] = useState(false);

    const [selectedValue] = useState("");
    const [multipleValue] = useState([]);
    const options = [
        { label: "选项一", value: "1" },
        { label: "选项二", value: "2" },
        { label: "选项三", value: "3", disabled: true },
        { label: "选项四", value: "4" },
        { label: "选项五", value: "5" },
    ];

    return (
        <>
            <div style={{ padding: "20px", maxWidth: "400px" }}>
                <h2>选择框示例</h2>
                {/* 基础单选 */}
                <Selector
                    options={options}
                    value={selectedValue}
                    placeholder="请选择"
                    allowClear
                    style={{ marginBottom: "16px" }}
                />

                {/* 多选模式 */}
                <Selector
                    options={options}
                    value={multipleValue}
                    mode="multiple"
                    placeholder="请选择（多选）"
                    allowClear
                    style={{ marginBottom: "16px" }}
                />

                {/* 带搜索功能 */}
                <Selector
                    options={options}
                    showSearch
                    placeholder="搜索选择"
                    size="large"
                    loading={isLoading}
                    style={{ marginBottom: "16px" }}
                />

                {/* 禁用状态 */}
                <Selector options={options} placeholder="禁用状态" disabled style={{ marginBottom: "16px" }} />

                {/* 不同尺寸 */}
                <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
                    <Selector options={options} placeholder="小尺寸" size="small" style={{ width: "120px" }} />
                    <Selector options={options} placeholder="默认尺寸" style={{ width: "150px" }} />
                    <Selector options={options} placeholder="大尺寸" size="large" style={{ width: "180px" }} />
                </div>
            </div>
        </>
    );
}

export default SampleSelector;
