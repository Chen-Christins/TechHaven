import React, { useEffect, useState } from "react";
import styles from "./GMServer.module.css";
import dashboardStyles from "./GMDashboard.module.css";
import { FaServer, FaPowerOff, FaSyncAlt, FaArrowCircleUp, FaTerminal } from "react-icons/fa";
import Loading from "../../components/loading/Loading";
import CustomSelect from "../../components/customSelect/CustomSelect";
import Switch from "../../components/switcher/Switch";
import Button from "../../components/button/Button";
import GMService from "../../services/gmService";
import type { ServerStatusResponse } from "../../services/gmService";
import type { SelectOption } from "../../types";
import { message } from "../../components/message/Message";

const GMServer: React.FC = () => {
  const [status, setStatus] = useState<ServerStatusResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showConsole, setShowConsole] = useState(false);
  const [consoleOutput, setConsoleOutput] = useState<string[]>([
    "[2024-02-23 10:21:15] 服务器启动中...",
    "[2024-02-23 10:21:16] 加载配置文件: server.conf",
    "[2024-02-23 10:21:17] 初始化数据库连接",
    "[2024-02-23 10:21:18] 监听端口: 8080",
    "[2024-02-23 10:21:19] 服务器启动完成",
    "[2024-02-23 10:21:20] 等待客户端连接...",
  ]);

  const serverOptions: SelectOption[] = [
    { id: "server1", name: "服务器 1", color: "#3b82f6" },
    { id: "server2", name: "服务器 2", color: "#f59e0b" },
    { id: "server3", name: "服务器 3", color: "#10b981" },
    { id: "server4", name: "服务器 4", color: "#8b5cf6" },
  ];

  
  const [selectedServer, setSelectedServer] = useState<SelectOption | null>(serverOptions[0]);
  const [isHotUpdate, setIsHotUpdate] = useState<boolean>(true);
  const [updateConfig, setUpdateConfig] = useState<boolean>(false);

  const formatUptime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}小时${minutes}分钟${secs}秒`;
    } else if (minutes > 0) {
      return `${minutes}分钟${secs}秒`;
    } else {
      return `${secs}秒`;
    }
  };

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const s = await GMService.getServerStatus();
      setStatus(s);
    } catch (err) {
      message.error("无法获取服务器状态");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const addConsoleMessage = (message: string) => {
    const timestamp = new Date().toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    setConsoleOutput(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const handleAction = async (action: "start" | "stop" | "update") => {
    try {
      setActionLoading(true);
      if (action === "start") {
        addConsoleMessage(`正在启动 ${selectedServer?.name}...`);
        await GMService.startServer();
        addConsoleMessage(`${selectedServer?.name} 启动命令已发送`);
        message.success(`${selectedServer?.name} 启动命令已发送`);
      } else if (action === "stop") {
        addConsoleMessage(`正在停止 ${selectedServer?.name}...`);
        await GMService.stopServer();
        addConsoleMessage(`${selectedServer?.name} 停止命令已发送`);
        message.success(`${selectedServer?.name} 停止命令已发送`);
      } else if (action === "update") {
        const updateType = isHotUpdate ? "热更新" : "冷更新";
        addConsoleMessage(`正在执行 ${selectedServer?.name} ${updateType}...`);
        await GMService.updateServer();
        addConsoleMessage(`${selectedServer?.name} ${updateType}命令已发送${updateConfig ? '（包含资源配置）' : ''}`);
        message.success(`${selectedServer?.name} ${isHotUpdate ? '热更新' : '冷更新'}命令已发送${updateConfig ? '（包含资源配置）' : ''}`);
      }
      await fetchStatus();
    } catch (err) {
      addConsoleMessage("操作失败");
      message.error("操作失败");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className={styles.serverPage}>
      <div className={dashboardStyles.card}>
        <div className={dashboardStyles.cardHeader}>
          <div>
            <p className={dashboardStyles.cardTag}>服务器管理</p>
            <h3 className={dashboardStyles.cardTitle}>服务器状态控制</h3>
            <p className={dashboardStyles.cardDesc}>管理游戏服务器的启动、停止和更新</p>
          </div>
          <div className={dashboardStyles.cardIcon}>
            <FaServer size={24} />
          </div>
        </div>

        <div className={styles.controlsLayout}>
          <div className={styles.halfWidthContainer}>
            <div className={styles.controlSection}>
              <div className={dashboardStyles.formRow}>
                <label>选择服务器</label>
                <CustomSelect
                  name="服务器"
                  options={serverOptions}
                  value={selectedServer}
                  onChange={(option) => setSelectedServer(option)}
                  className={styles.selectInput}
                  hideBadge={true}
                />
              </div>

              <div className={styles.switchesRow}>
                <div className={dashboardStyles.formRow}>
                  <div className={styles.switchLabel}>
                    <span onClick={(e) => e.stopPropagation()}>热更新</span>
                    <Switch
                      checked={isHotUpdate}
                      onChange={setIsHotUpdate}
                      disabled={actionLoading}
                      size="default"
                    />
                    <span onClick={(e) => e.stopPropagation()}>冷更新</span>
                  </div>
                </div>

                <div className={dashboardStyles.formRow}>
                  <div className={styles.switchLabel}>
                    <span onClick={(e) => e.stopPropagation()}>更新资源配置</span>
                    <Switch
                      checked={updateConfig}
                      onChange={setUpdateConfig}
                      disabled={actionLoading}
                      size="default"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.controlsFooter}>
              <Button color="primary" variant="solid" size="medium" onClick={() => handleAction("start")} disabled={actionLoading}>
                <FaPowerOff/> 启动
              </Button>

              <Button color="error" variant="solid" size="medium" onClick={() => handleAction("stop")} disabled={actionLoading}>
                <FaPowerOff/> 停止
              </Button>

              <Button color="primary" variant="outline" size="medium" onClick={() => handleAction("update")} disabled={actionLoading}>
                <FaArrowCircleUp/> 更新
              </Button>

              <Button color="primary" variant="outline" size="medium" onClick={fetchStatus} disabled={loading || actionLoading}>
                <FaSyncAlt/> 刷新状态
              </Button>

              <Button color="primary" variant="outline" size="medium" onClick={() => setShowConsole(!showConsole)} disabled={actionLoading}>
                <FaTerminal/> 控制台
              </Button>
            </div>
          </div>

          <div className={styles.statusPanel}>
            <div className={styles.statusHeader}>
              <h4>服务器状态</h4>
              <div className={`${styles.statusIndicator} ${status?.running ? styles.statusOnline : styles.statusOffline}`}>
                {status?.running ? "在线" : "离线"}
              </div>
            </div>

            {loading ? (
              <div className={styles.loadingContainer}>
                <Loading size="small" text="正在获取状态..." />
              </div>
            ) : status ? (
              <div className={styles.statusContent}>
                <div className={styles.statusItem}>
                  <span className={styles.statusLabel}>服务器:</span>
                  <span className={styles.statusValue}>{selectedServer?.name}</span>
                </div>
                <div className={styles.statusItem}>
                  <span className={styles.statusLabel}>运行状态:</span>
                  <span className={`${styles.statusValue} ${status.running ? styles.statusOnline : styles.statusOffline}`}>
                    {status.running ? "运行中" : "已停止"}
                  </span>
                </div>
                {status.version && (
                  <div className={styles.statusItem}>
                    <span className={styles.statusLabel}>版本:</span>
                    <span className={styles.statusValue}>{status.version}</span>
                  </div>
                )}
                {status.uptime !== undefined && (
                  <div className={styles.statusItem}>
                    <span className={styles.statusLabel}>运行时长:</span>
                    <span className={styles.statusValue}>{formatUptime(status.uptime)}</span>
                  </div>
                )}
                {status.message && (
                  <div className={styles.statusItem}>
                    <span className={styles.statusLabel}>消息:</span>
                    <span className={styles.statusValue}>{status.message}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.statusContent}>
                <div className={styles.statusItem}>
                  <span className={styles.statusValue}>无法获取状态</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showConsole && (
        <div className={dashboardStyles.card} style={{ marginTop: '16px' }}>
          <div className={dashboardStyles.cardHeader}>
            <div>
              <p className={dashboardStyles.cardTag}>控制台输出</p>
              <h3 className={dashboardStyles.cardTitle}>服务器日志</h3>
              <p className={dashboardStyles.cardDesc}>实时显示服务器运行日志和控制台输出</p>
            </div>
            <div className={dashboardStyles.cardIcon}>
              <FaTerminal size={24} />
            </div>
          </div>
          <div className={styles.consoleContainer}>
            <div className={styles.consoleOutput}>
              {consoleOutput.map((line, index) => (
                <div key={index} className={styles.consoleLine}>
                  {line}
                </div>
              ))}
            </div>
            <div className={styles.consoleActions}>
              <Button
                color="primary"
                variant="outline"
                size="tiny"
                onClick={() => setConsoleOutput([])}
                disabled={consoleOutput.length === 0}
              >
                清空日志
              </Button>
              <Button
                color="primary"
                variant="outline"
                size="tiny"
                onClick={() => {
                  navigator.clipboard.writeText(consoleOutput.join('\n'));
                  message.success('日志已复制到剪贴板');
                }}
                disabled={consoleOutput.length === 0}
              >
                复制日志
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GMServer;
