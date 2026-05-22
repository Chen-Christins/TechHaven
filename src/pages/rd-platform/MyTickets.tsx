import React, { useState, useEffect } from "react";
import { FaEye, FaClipboardList, FaBug } from "react-icons/fa";
import styles from "./ListPage.module.css";
import Input from "../../components/input/Input";
import CustomSelect from "../../components/customSelect/CustomSelect";
import Modal from "../../components/modal/Modal";
import Loading from "../../components/loading/Loading";
import { useAuth } from "../../contexts/AuthContext";
import { RdPlatformMockService } from "../../services/rdPlatformMockService";
import type { SelectOption } from "../../types";
import type { Requirement, Bug } from "../../types/rdPlatform";

const reqStatusOptions: SelectOption[] = [
  { id: "", name: "全部状态", color: "#6c757d" },
  { id: "new", name: "新建", color: "#3b82f6" },
  { id: "developing", name: "开发中", color: "#eab308" },
  { id: "testing", name: "测试中", color: "#a855f7" },
  { id: "done", name: "已完成", color: "#22c55e" },
  { id: "closed", name: "已关闭", color: "#6b7280" },
];

const bugStatusOptions: SelectOption[] = [
  { id: "", name: "全部状态", color: "#6c757d" },
  { id: "new", name: "新建", color: "#3b82f6" },
  { id: "accepted", name: "已受理", color: "#eab308" },
  { id: "processing", name: "处理中", color: "#a855f7" },
  { id: "verified", name: "已验证", color: "#22c55e" },
  { id: "closed", name: "已关闭", color: "#6b7280" },
  { id: "reopened", name: "已重开", color: "#ef4444" },
];

const reqStatusText: Record<string, string> = {
  new: "新建",
  developing: "开发中",
  testing: "测试中",
  done: "已完成",
  closed: "已关闭",
};
const bugStatusText: Record<string, string> = {
  new: "新建",
  accepted: "已受理",
  processing: "处理中",
  verified: "已验证",
  closed: "已关闭",
  reopened: "已重开",
};
const priorityText: Record<string, string> = { urgent: "紧急", high: "高", medium: "中", low: "低" };
const severityText: Record<string, string> = { fatal: "致命", serious: "严重", normal: "一般", minor: "轻微" };

const MyTickets: React.FC = () => {
  const { user } = useAuth();
  const currentUser = user?.name || user?.account || "";

  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [loading, setLoading] = useState(true);
  const [reqTab, setReqTab] = useState(true);

  // filters
  const [reqFilter, setReqFilter] = useState({ search: "", status: "" });
  const [bugFilter, setBugFilter] = useState({ search: "", status: "" });

  // modal
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedReq, setSelectedReq] = useState<Requirement | null>(null);
  const [selectedBug, setSelectedBug] = useState<Bug | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [reqRes, bugRes] = await Promise.all([
        RdPlatformMockService.getRequirements({ page: 1, pageSize: 1000 }),
        RdPlatformMockService.getBugs({ page: 1, pageSize: 1000 }),
      ]);
      setRequirements(reqRes.data.filter((r) => r.creator === currentUser || r.assignee === currentUser));
      setBugs(bugRes.data.filter((b) => b.creator === currentUser || b.assignee === currentUser));
      setLoading(false);
    };
    fetchData();
  }, [currentUser]);

  // filtered data
  const filteredReqs = requirements.filter((r) => {
    if (reqFilter.status && r.status !== reqFilter.status) return false;
    if (reqFilter.search) {
      const kw = reqFilter.search.toLowerCase();
      if (!r.title.toLowerCase().includes(kw) && !r.description.toLowerCase().includes(kw)) return false;
    }
    return true;
  });

  const filteredBugs = bugs.filter((b) => {
    if (bugFilter.status && b.status !== bugFilter.status) return false;
    if (bugFilter.search) {
      const kw = bugFilter.search.toLowerCase();
      if (!b.title.toLowerCase().includes(kw) && !b.description.toLowerCase().includes(kw)) return false;
    }
    return true;
  });

  const openReqView = (req: Requirement) => {
    setSelectedBug(null);
    setSelectedReq(req);
    setModalVisible(true);
  };
  const openBugView = (bug: Bug) => {
    setSelectedReq(null);
    setSelectedBug(bug);
    setModalVisible(true);
  };

  const renderField = (label: string, value: React.ReactNode) => (
    <div style={{ marginBottom: "14px" }}>
      <span style={{ fontSize: "13px", color: "var(--text-tertiary)", display: "block", marginBottom: "2px" }}>{label}</span>
      <span style={{ fontSize: "14px", color: "var(--text-primary)", fontWeight: 500 }}>{value || "-"}</span>
    </div>
  );

  if (loading) return <Loading />;

  return (
    <div className={styles.listPage}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>我的工单</h1>
          <p className={styles.pageDescription}>我负责或创建的需求与缺陷</p>
        </div>
      </div>

      {/* tab bar */}
      <div style={{ display: "flex", gap: "0", marginBottom: "20px", borderBottom: "2px solid var(--border-primary)" }}>
        <button
          onClick={() => setReqTab(true)}
          style={{
            padding: "10px 24px",
            fontSize: "14px",
            fontWeight: reqTab ? 600 : 400,
            color: reqTab ? "var(--primary)" : "var(--text-secondary)",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            borderBottom: reqTab ? "2px solid var(--primary)" : "2px solid transparent",
            marginBottom: "-2px",
          }}
        >
          <FaClipboardList style={{ marginRight: "6px" }} />
          需求 ({filteredReqs.length})
        </button>
        <button
          onClick={() => setReqTab(false)}
          style={{
            padding: "10px 24px",
            fontSize: "14px",
            fontWeight: !reqTab ? 600 : 400,
            color: !reqTab ? "var(--primary)" : "var(--text-secondary)",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            borderBottom: !reqTab ? "2px solid var(--primary)" : "2px solid transparent",
            marginBottom: "-2px",
          }}
        >
          <FaBug style={{ marginRight: "6px" }} />
          缺陷 ({filteredBugs.length})
        </button>
      </div>

      {/* filters */}
      {reqTab ? (
        <>
          <div className={styles.filterSection}>
            <div className={styles.filterHeader}>
              <h3 className={styles.filterTitle}>筛选条件</h3>
              <button className={styles.clearBtn} onClick={() => setReqFilter({ search: "", status: "" })}>
                清除筛选
              </button>
            </div>
            <div className={styles.filterForm}>
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>搜索</label>
                <Input
                  placeholder="标题或描述"
                  value={reqFilter.search}
                  onChange={(val) => setReqFilter((p) => ({ ...p, search: val }))}
                  allowClear
                  size="large"
                />
              </div>
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>状态</label>
                <CustomSelect
                  name="状态"
                  options={reqStatusOptions}
                  value={reqStatusOptions.find((o) => o.id === reqFilter.status) || null}
                  onChange={(o) => setReqFilter((p) => ({ ...p, status: (o?.id as string) || "" }))}
                  hideBadge
                />
              </div>
            </div>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>标题</th>
                  <th>优先级</th>
                  <th>状态</th>
                  <th>负责人</th>
                  <th>创建人</th>
                  <th>创建时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredReqs.map((r) => (
                  <tr key={r.id}>
                    <td className={styles.titleCell} onClick={() => openReqView(r)}>
                      {r.title}
                    </td>
                    <td>
                      <span className={`${styles.badge} ${styles[`priority_${r.priority}`]}`}>{priorityText[r.priority]}</span>
                    </td>
                    <td>
                      <span className={`${styles.badge} ${styles[`status_${r.status}`]}`}>{reqStatusText[r.status]}</span>
                    </td>
                    <td>{r.assignee || "-"}</td>
                    <td>{r.creator}</td>
                    <td>{new Date(r.createdAt).toLocaleDateString("zh-CN")}</td>
                    <td>
                      <div className={styles.actionButtons}>
                        <button className={`${styles.actionBtn} ${styles.view}`} title="查看" onClick={() => openReqView(r)}>
                          <FaEye />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredReqs.length === 0 && (
                  <tr>
                    <td colSpan={7} className={styles.emptyCell}>
                      暂无相关需求
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <>
          <div className={styles.filterSection}>
            <div className={styles.filterHeader}>
              <h3 className={styles.filterTitle}>筛选条件</h3>
              <button className={styles.clearBtn} onClick={() => setBugFilter({ search: "", status: "" })}>
                清除筛选
              </button>
            </div>
            <div className={styles.filterForm}>
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>搜索</label>
                <Input
                  placeholder="标题或描述"
                  value={bugFilter.search}
                  onChange={(val) => setBugFilter((p) => ({ ...p, search: val }))}
                  allowClear
                  size="large"
                />
              </div>
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>状态</label>
                <CustomSelect
                  name="状态"
                  options={bugStatusOptions}
                  value={bugStatusOptions.find((o) => o.id === bugFilter.status) || null}
                  onChange={(o) => setBugFilter((p) => ({ ...p, status: (o?.id as string) || "" }))}
                  hideBadge
                />
              </div>
            </div>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>标题</th>
                  <th>严重程度</th>
                  <th>优先级</th>
                  <th>状态</th>
                  <th>负责人</th>
                  <th>创建人</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredBugs.map((b) => (
                  <tr key={b.id}>
                    <td className={styles.titleCell} onClick={() => openBugView(b)}>
                      {b.title}
                    </td>
                    <td>
                      <span className={`${styles.badge} ${styles[`severity_${b.severity}`]}`}>{severityText[b.severity]}</span>
                    </td>
                    <td>
                      <span className={`${styles.badge} ${styles[`priority_${b.priority}`]}`}>{priorityText[b.priority]}</span>
                    </td>
                    <td>
                      <span className={`${styles.badge} ${styles[`status_${b.status}`]}`}>{bugStatusText[b.status]}</span>
                    </td>
                    <td>{b.assignee || "-"}</td>
                    <td>{b.creator}</td>
                    <td>
                      <div className={styles.actionButtons}>
                        <button className={`${styles.actionBtn} ${styles.view}`} title="查看" onClick={() => openBugView(b)}>
                          <FaEye />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredBugs.length === 0 && (
                  <tr>
                    <td colSpan={7} className={styles.emptyCell}>
                      暂无相关缺陷
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ============ MODAL ============ */}
      <Modal
        visible={modalVisible}
        title={selectedReq ? selectedReq.title : selectedBug?.title || "工单详情"}
        onClose={() => {
          setModalVisible(false);
          setSelectedReq(null);
          setSelectedBug(null);
        }}
        width={720}
        footer={null}
      >
        {selectedReq && (
          <div>
            <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
              <span className={`${styles.badge} ${styles[`priority_${selectedReq.priority}`]}`}>
                {priorityText[selectedReq.priority]}
              </span>
              <span className={`${styles.badge} ${styles[`status_${selectedReq.status}`]}`}>{reqStatusText[selectedReq.status]}</span>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: "8px",
                marginBottom: "20px",
                paddingBottom: "16px",
                borderBottom: "1px solid var(--border-primary)",
              }}
            >
              {renderField("负责人", selectedReq.assignee)}
              {renderField("创建人", selectedReq.creator)}
              {renderField("迭代", selectedReq.iteration)}
              {renderField("分类", selectedReq.category)}
              {renderField("来源", selectedReq.source)}
              {renderField("创建时间", new Date(selectedReq.createdAt).toLocaleString("zh-CN"))}
              {renderField("更新时间", new Date(selectedReq.updatedAt).toLocaleString("zh-CN"))}
            </div>
            <div>
              <h4 style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "8px" }}>描述</h4>
              <div style={{ fontSize: "14px", color: "var(--text-primary)", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
                {selectedReq.description || "暂无描述"}
              </div>
            </div>
          </div>
        )}
        {selectedBug && (
          <div>
            <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
              <span className={`${styles.badge} ${styles[`severity_${selectedBug.severity}`]}`}>
                {severityText[selectedBug.severity]}
              </span>
              <span className={`${styles.badge} ${styles[`priority_${selectedBug.priority}`]}`}>
                {priorityText[selectedBug.priority]}
              </span>
              <span className={`${styles.badge} ${styles[`status_${selectedBug.status}`]}`}>{bugStatusText[selectedBug.status]}</span>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: "8px",
                marginBottom: "20px",
                paddingBottom: "16px",
                borderBottom: "1px solid var(--border-primary)",
              }}
            >
              {renderField("负责人", selectedBug.assignee)}
              {renderField("创建人", selectedBug.creator)}
              {renderField("所属模块", selectedBug.module)}
              {renderField("关联需求", selectedBug.relatedRequirementId)}
              {renderField("运行环境", selectedBug.environment)}
              {renderField("创建时间", new Date(selectedBug.createdAt).toLocaleString("zh-CN"))}
              {renderField("更新时间", new Date(selectedBug.updatedAt).toLocaleString("zh-CN"))}
            </div>
            <div style={{ marginBottom: selectedBug.stepsToReproduce ? "20px" : "0" }}>
              <h4 style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "8px" }}>描述</h4>
              <div style={{ fontSize: "14px", color: "var(--text-primary)", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
                {selectedBug.description || "暂无描述"}
              </div>
            </div>
            {selectedBug.stepsToReproduce && (
              <div>
                <h4 style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "8px" }}>复现步骤</h4>
                <div style={{ fontSize: "14px", color: "var(--text-primary)", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
                  {selectedBug.stepsToReproduce}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MyTickets;
