import React, { useState, useRef, useEffect } from "react";
import { FaSearch, FaPaperPlane, FaCircle, FaRegSmile, FaArrowLeft } from "react-icons/fa";
import styles from "./UserPage.module.css";
import msgStyles from "./Messages.module.css";
import Navbar from "@/components/navbar/Navbar";
import Footer from "@/components/footer/Footer";
import Avatar from "@/components/avatar/Avatar";
import Input from "@/components/input/Input";

interface ChatMsg {
  id: string;
  fromMe: boolean;
  text: string;
  time: string;
}

interface Conversation {
  id: string;
  name: string;
  online: boolean;
  lastTime: string;
  unread: number;
  messages: ChatMsg[];
}

const INITIAL: Conversation[] = [
  {
    id: "1",
    name: "林悦",
    online: true,
    lastTime: "10:32",
    unread: 2,
    messages: [
      { id: "m1", fromMe: false, text: "在吗？你那篇关于内存态 Token 的文章我看了", time: "10:28" },
      { id: "m2", fromMe: true, text: "在的，有什么问题吗？", time: "10:30" },
      { id: "m3", fromMe: false, text: "想问下 HttpOnly Cookie 和内存存储怎么配合", time: "10:31" },
      { id: "m4", fromMe: false, text: "尤其是刷新页面后怎么恢复登录态", time: "10:32" },
    ],
  },
  {
    id: "2",
    name: "王磊",
    online: true,
    lastTime: "昨天",
    unread: 0,
    messages: [
      { id: "m1", fromMe: false, text: "看板那个拖拽做完了吗？", time: "昨天 16:20" },
      { id: "m2", fromMe: true, text: "做完了，已经提 PR 了", time: "昨天 16:45" },
    ],
  },
  {
    id: "3",
    name: "赵天",
    online: false,
    lastTime: "周三",
    unread: 0,
    messages: [{ id: "m1", fromMe: false, text: "周会记得同步下研发平台进度", time: "周三 09:00" }],
  },
];

const Messages: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>(INITIAL);
  const [activeId, setActiveId] = useState<string>(INITIAL[0].id);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  const active = conversations.find((c) => c.id === activeId) || conversations[0];

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [active?.messages.length, activeId]);

  const selectConv = (id: string) => {
    setActiveId(id);
    setMobileChatOpen(true);
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c)));
  };

  const send = () => {
    const text = input.trim();
    if (!text) return;
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeId
          ? { ...c, lastTime: time, messages: [...c.messages, { id: `m${Date.now()}`, fromMe: true, text, time }] }
          : c,
      ),
    );
    setInput("");
  };

  const filtered = conversations.filter((c) => !search || c.name.includes(search));

  return (
    <div className={`${styles.page} ${msgStyles.msgPage}`}>
      <Navbar />
      <div className={msgStyles.wrapper}>
        <div className={`${msgStyles.chatLayout} ${mobileChatOpen ? msgStyles.showChat : ""}`}>
          <aside className={msgStyles.convList}>
            <div className={msgStyles.convSearch}>
              <Input placeholder="搜索会话" value={search} onChange={setSearch} prefix={<FaSearch />} allowClear />
            </div>
            <div className={msgStyles.convItems}>
              {filtered.map((c) => (
                <div
                  key={c.id}
                  className={`${msgStyles.convItem} ${activeId === c.id ? msgStyles.convActive : ""}`}
                  onClick={() => selectConv(c.id)}
                >
                  <div className={msgStyles.convAvatar}>
                    <Avatar name={c.name} size={44} />
                    {c.online && <FaCircle className={msgStyles.onlineDot} />}
                  </div>
                  <div className={msgStyles.convInfo}>
                    <div className={msgStyles.convTop}>
                      <span className={msgStyles.convName}>{c.name}</span>
                      <span className={msgStyles.convTime}>{c.lastTime}</span>
                    </div>
                    <div className={msgStyles.convBottom}>
                      <span className={msgStyles.convPreview}>{c.messages[c.messages.length - 1]?.text}</span>
                      {c.unread > 0 && <span className={msgStyles.convUnread}>{c.unread}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </aside>

          <section className={msgStyles.chatWindow}>
            <header className={msgStyles.chatHeader}>
              <button className={msgStyles.backBtn} onClick={() => setMobileChatOpen(false)}>
                <FaArrowLeft />
              </button>
              <Avatar name={active.name} size={36} />
              <div>
                <div className={msgStyles.chatName}>{active.name}</div>
                <div className={msgStyles.chatStatus}>{active.online ? "在线" : "离线"}</div>
              </div>
            </header>

            <div className={msgStyles.chatBody} ref={bodyRef}>
              {active.messages.map((m) => (
                <div key={m.id} className={`${msgStyles.msgRow} ${m.fromMe ? msgStyles.msgMine : ""}`}>
                  {!m.fromMe && <Avatar name={active.name} size={32} />}
                  <div className={msgStyles.bubbleWrap}>
                    <div className={`${msgStyles.bubble} ${m.fromMe ? msgStyles.bubbleMine : ""}`}>{m.text}</div>
                    <span className={msgStyles.bubbleTime}>{m.time}</span>
                  </div>
                </div>
              ))}
            </div>

            <footer className={msgStyles.chatInput}>
              <button className={msgStyles.emojiBtn} title="表情">
                <FaRegSmile />
              </button>
              <input
                className={msgStyles.textInput}
                placeholder="输入消息，回车发送"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
              />
              <button className={msgStyles.sendBtn} onClick={send} disabled={!input.trim()}>
                <FaPaperPlane />
              </button>
            </footer>
          </section>
        </div>
      </div>
      <Footer startYear={2025} />
    </div>
  );
};

export default Messages;
