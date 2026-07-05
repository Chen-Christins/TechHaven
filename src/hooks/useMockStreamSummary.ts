import { useState, useRef, useCallback, useEffect } from "react";

/**
 * Mock 总结文本，模拟 AI 生成的文章摘要
 */
const MOCK_SUMMARY = `本文详细介绍了前端开发中的关键技术要点。作者从基础概念出发，循序渐进地讲解了核心技术原理，并结合实际代码示例进行了演示。

文章的主要亮点包括：清晰地阐述了问题的背景与解决方案，代码示例完整且易于理解，适合有一定基础的开发者阅读。整体结构合理，从理论到实践层层递进。

总结来说，这是一篇高质量的技术分享文章，读者可以通过本文快速掌握相关知识点，并应用到实际项目中。建议配合代码实践以加深理解。`;

/**
 * 模拟 SSE 流式输出的自定义 Hook
 *
 * 每 30~80ms 随机吐出 1~3 个字符，模拟真实 LLM 的生成节奏。
 * 后续接入真实 AI API 时，只需替换 start 函数中的逻辑为 EventSource / fetch stream。
 */
function useMockStreamSummary() {
  const [text, setText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const indexRef = useRef(0);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    // 重置状态
    clearTimer();
    setText("");
    indexRef.current = 0;
    setIsStreaming(true);
    setIsCompleted(false);

    timerRef.current = setInterval(
      () => {
        // 随机每次吐出 1~3 个字符
        const chunkSize = Math.floor(Math.random() * 3) + 1;
        const nextIndex = Math.min(indexRef.current + chunkSize, MOCK_SUMMARY.length);

        setText(MOCK_SUMMARY.slice(0, nextIndex));
        indexRef.current = nextIndex;

        if (nextIndex >= MOCK_SUMMARY.length) {
          clearTimer();
          setIsStreaming(false);
          setIsCompleted(true);
        }
      },
      30 + Math.random() * 50,
    ); // 30~80ms 随机间隔
  }, [clearTimer]);

  const reset = useCallback(() => {
    clearTimer();
    setText("");
    indexRef.current = 0;
    setIsStreaming(false);
    setIsCompleted(false);
  }, [clearTimer]);

  // 组件卸载时清理 timer
  useEffect(() => {
    return clearTimer;
  }, [clearTimer]);

  return {
    text,
    isStreaming,
    isCompleted,
    error: null,
    start,
    reset,
  };
}

export default useMockStreamSummary;
