import React, { useState } from "react";
import { FaShieldAlt, FaDesktop, FaMobileAlt, FaSignOutAlt } from "react-icons/fa";
import styles from "./UserPage.module.css";
import secStyles from "./AccountSecurity.module.css";
import Switch from "@/components/switch/Switch";
import message from "@/components/message/Message";
import { confirm } from "@/components/confirm/Confirm";

interface Device {
  id: string;
  name: string;
  location: string;
  lastActive: string;
  current: boolean;
  mobile: boolean;
}

const INITIAL_DEVICES: Device[] = [
  { id: "1", name: "Chrome · macOS", location: "杭州", lastActive: "刚刚", current: true, mobile: false },
  { id: "2", name: "Safari · iPhone", location: "杭州", lastActive: "2 小时前", current: false, mobile: true },
  { id: "3", name: "Edge · Windows", location: "上海", lastActive: "3 天前", current: false, mobile: false },
];

const SecurityTab: React.FC = () => {
  const [twoFactor, setTwoFactor] = useState(false);
  const [loginAlert, setLoginAlert] = useState(true);
  const [devices, setDevices] = useState<Device[]>(INITIAL_DEVICES);

  const revoke = (d: Device) => {
    confirm({
      title: "下线设备",
      content: (
        <div>
          确定要将 "<strong>{d.name}</strong>" 强制下线吗？
        </div>
      ),
      confirmText: "下线",
      cancelText: "取消",
      onConfirm: () => {
        setDevices((prev) => prev.filter((x) => x.id !== d.id));
        message.success("设备已下线");
      },
    });
  };

  return (
    <div className={styles.tabWrap}>
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>
          <FaShieldAlt /> 安全选项
        </h2>
        <div className={styles.settingRow}>
          <div className={styles.settingInfo}>
            <p className={styles.settingName}>两步验证（2FA）</p>
            <p className={styles.settingHint}>登录时需额外输入动态验证码，大幅提升账户安全</p>
          </div>
          <Switch
            checked={twoFactor}
            onChange={(c) => {
              setTwoFactor(c);
              message.info(c ? "已开启两步验证（演示）" : "已关闭两步验证");
            }}
          />
        </div>
        <div className={styles.settingRow}>
          <div className={styles.settingInfo}>
            <p className={styles.settingName}>异地登录提醒</p>
            <p className={styles.settingHint}>检测到新设备或异地登录时通过站内信提醒</p>
          </div>
          <Switch checked={loginAlert} onChange={(c) => setLoginAlert(c)} />
        </div>
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>
          <FaDesktop /> 登录设备
        </h2>
        <p className={styles.cardDesc}>当前共有 {devices.length} 台设备登录</p>
        <div className={secStyles.deviceList}>
          {devices.map((d) => (
            <div key={d.id} className={secStyles.deviceItem}>
              <div className={secStyles.deviceIcon}>{d.mobile ? <FaMobileAlt /> : <FaDesktop />}</div>
              <div className={secStyles.deviceInfo}>
                <p className={secStyles.deviceName}>
                  {d.name}
                  {d.current && <span className={secStyles.currentTag}>当前设备</span>}
                </p>
                <p className={secStyles.deviceMeta}>
                  {d.location} · {d.lastActive}
                </p>
              </div>
              {!d.current && (
                <button className={secStyles.revokeBtn} onClick={() => revoke(d)}>
                  <FaSignOutAlt /> 下线
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SecurityTab;
