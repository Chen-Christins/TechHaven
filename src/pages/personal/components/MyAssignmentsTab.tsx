import React, { useEffect, useMemo, useState } from "react";
import { FaArrowRight, FaCalendarAlt, FaCheckCircle, FaClipboardList, FaExclamationCircle, FaEye, FaSearch } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Button from "@/components/button/Button";
import CustomSelect from "@/components/customSelect/CustomSelect";
import ErrorState from "@/components/errorState/ErrorState";
import Input from "@/components/input/Input";
import Skeleton from "@/components/skeleton/Skeleton";
import AssignmentService, { type GetUserAssignmentsResponse } from "@/services/assignmentService";
import type { SelectOption } from "@/types/index";
import { encodeId } from "@/utils/hashId";
import styles from "../PersonalCenter.module.css";

type Assignment = GetUserAssignmentsResponse["list"][number];
type AssignmentFilter = "all" | "open" | "closed";

const STATUS_MAP: Record<number, AssignmentFilter> = {
  1: "open",
  2: "closed",
};

const filterOptions: SelectOption[] = [
  { id: "all", name: "全部任务", color: "#6b7280" },
  { id: "open", name: "开启中", color: "#10b981" },
  { id: "closed", name: "已关闭", color: "#ef4444" },
];

const MyAssignmentsTab: React.FC = () => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<AssignmentFilter>("all");
  const [selectedFilter, setSelectedFilter] = useState<SelectOption | null>(filterOptions[0]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await AssignmentService.getUserAssignments();
      setAssignments(response.list || []);
    } catch (err: any) {
      setError(err.message || "获取任务列表失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const filteredAssignments = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return assignments.filter((item) => {
      const status = STATUS_MAP[item.status] || "open";
      const matchesStatus = filter === "all" || status === filter;
      const matchesKeyword =
        !keyword ||
        item.name.toLowerCase().includes(keyword) ||
        item.description.toLowerCase().includes(keyword) ||
        item.subject_name.toLowerCase().includes(keyword);

      return matchesStatus && matchesKeyword;
    });
  }, [assignments, filter, searchTerm]);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const getStatusBadge = (status: number) => {
    const statusString = STATUS_MAP[status] || "open";
    return statusString === "closed" ? (
      <span className={`${styles.assignmentStatus} ${styles.assignmentStatusClosed}`}>
        <FaExclamationCircle />
        已关闭
      </span>
    ) : (
      <span className={`${styles.assignmentStatus} ${styles.assignmentStatusOpen}`}>
        <FaCheckCircle />
        开启中
      </span>
    );
  };

  const handleFilterChange = (option: SelectOption | null) => {
    setSelectedFilter(option);
    setFilter((option?.id as AssignmentFilter | undefined) || "all");
  };

  return (
    <div className={styles.contentSection}>
      <div className={styles.sectionHeader}>
        <h2>我的任务</h2>
      </div>

      <div className={styles.searchFilterBar}>
        <Input
          value={searchTerm}
          onChange={setSearchTerm}
          prefix={<FaSearch />}
          placeholder="搜索任务名称、描述或科目..."
          allowClear
          className={styles.assignmentSearchInput}
        />
        <CustomSelect
          name="任务状态"
          options={filterOptions}
          value={selectedFilter}
          onChange={handleFilterChange}
          className={`${styles.statusSelect} ${styles.assignmentStatusSelect}`}
          hideBadge={true}
        />
      </div>

      {error ? (
        <ErrorState
          title="加载失败"
          message={error}
          icon={<FaExclamationCircle />}
          actionText="重新加载"
          onAction={fetchAssignments}
        />
      ) : loading ? (
        <div className={styles.assignmentsGrid}>
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className={styles.assignmentCard}>
              <div className={styles.assignmentCardHeader}>
                <Skeleton variant="rounded" width={96} height={24} />
                <Skeleton variant="rounded" width={72} height={24} />
              </div>
              <Skeleton variant="text" width="70%" height={26} />
              <Skeleton variant="text" lines={2} />
              <div className={styles.assignmentFooter}>
                <Skeleton variant="text" width={120} />
                <Skeleton variant="rounded" width={112} height={34} />
              </div>
            </div>
          ))}
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div className={styles.emptyState}>
          <FaClipboardList className={styles.emptyIcon} />
          <h3>暂无任务</h3>
          <p>当前筛选条件下没有找到相关任务</p>
        </div>
      ) : (
        <div className={styles.assignmentsGrid}>
          {filteredAssignments.map((item) => {
            const closed = STATUS_MAP[item.status] === "closed";

            return (
              <div key={item.id} className={styles.assignmentCard}>
                <div className={styles.assignmentCardHeader}>
                  <span className={styles.assignmentSubject}>{item.subject_name}</span>
                  {getStatusBadge(item.status)}
                </div>

                <h3 className={styles.assignmentTitle}>{item.name}</h3>
                <p className={styles.assignmentDescription}>{item.description || "暂无任务说明"}</p>

                <div className={styles.assignmentMeta}>
                  <span>
                    <FaCalendarAlt />
                    截止 {formatDate(item.end_time)}
                  </span>
                  <span>{Math.round(item.file_size)} MB</span>
                  <span>{item.file_type}</span>
                </div>

                <div className={styles.assignmentFooter}>
                  <Button
                    variant="light"
                    color="secondary"
                    size="small"
                    className={styles.assignmentIconButton}
                    onClick={() => navigate(`/assignment/submissions/${encodeId(item.id, "assignment")}`)}
                  >
                    <FaEye />
                    提交记录
                  </Button>
                  <Button
                    color={closed ? "secondary" : "primary"}
                    variant={closed ? "light" : "solid"}
                    size="small"
                    onClick={() => navigate(`/assignment/submit/${encodeId(item.id, "assignment")}`)}
                  >
                    {closed ? "查看详情" : "去提交"}
                    <FaArrowRight />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyAssignmentsTab;
