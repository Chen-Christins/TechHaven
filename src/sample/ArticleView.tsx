// ExampleUsage.tsx
import React from 'react';
import ArticleView from '../components/articleView/ArticleView';
import Footer from '../components/footer/Footer';

const ExampleUsage: React.FC = () => {
	// 示例Markdown内容，包含代码和公式
	const markdownContent = `
这是一篇包含代码和数学公式的示例文章。

## 代码示例

以下是一个TypeScript函数示例：

\`\`\`typescript
function calculateArea(radius: number): number {
  // 使用圆面积公式: πr²
  return Math.PI * radius * radius;
}

// 使用示例
const area = calculateArea(5);
console.log(\`半径为5的圆面积是: \${area.toFixed(2)}\`);
\`\`\`

## 数学公式

行内公式示例：$E = mc^2$（爱因斯坦质能方程）

块级公式示例：

$$
\\sum_{i=1}^n i = \\frac{n(n+1)}{2}
$$

这是前n个正整数的求和公式。

另一个复杂公式：

$$
f(x) = \\frac{1}{\\sqrt{2\\pi\\sigma^2}} e^{-\\frac{(x-\\mu)^2}{2\\sigma^2}}
$$

这是正态分布的概率密度函数。

## 列表示例

- 无序列表项1
- 无序列表项2
  - 嵌套列表项A
  - 嵌套列表项B
- 无序列表项3

1. 有序列表项1
2. 有序列表项2
3. 有序列表项3

## 引用

> 这是一段引用文本，用于展示引用样式。
> 多行引用会保持正确的格式。

## 图片示例

![示例图片](https://picsum.photos/800/400)

这是一张示例图片的说明文字。
  `;

	return (
		<>
			<ArticleView content={markdownContent} />
			<Footer companyName='TechBlog' startYear={2025} authorName='chen' />
		</>
	);
};

export default ExampleUsage;