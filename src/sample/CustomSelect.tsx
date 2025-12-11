import React, { useState } from "react";
import CustomSelect from "../components/customSelect/CustomSelect";
import type { SelectOption } from "../types/index";

const SampleCustomSelect: React.FC = () => {
    const [selectedCategory, setSelectedCategory] = useState<SelectOption | null>(null);

    const categories: SelectOption[] = [
        { id: 1, name: "技术", color: "#4361ee" },
        { id: 2, name: "生活", color: "#3a0ca3" },
        { id: 3, name: "旅行", color: "#7209b7" },
        { id: 4, name: "美食", color: "#f72585" },
    ];

    const handleCategoryChange = (selectedOption: SelectOption | null, _selectedIndex: number, _oldIndex: number) => {
        setSelectedCategory(selectedOption);
        // console.log('选择变化:', { selectedOption, selectedIndex, oldIndex });
    };

    return (
        <div className="form-section">
            <div className="form-section-title">文章分类</div>
            <CustomSelect
                name="分类"
                options={categories}
                value={selectedCategory}
                onChange={handleCategoryChange}
                showDate={false}
            />
        </div>
    );
};

export default SampleCustomSelect;
