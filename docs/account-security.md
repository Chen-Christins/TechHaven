# 账户安全（Account Security）

入口：个人中心（`/personal?tab=security`）→ 账户安全 Tab。
对应组件：`src/pages/user/SecurityTab.tsx`（外壳 `src/pages/user/AccountSecurity.tsx` 已废弃，仅保留 Tab）。

## 数据模型

```ts
interface Device {
  id: string;
  name: string;        // 设备描述，如 "Chrome · macOS"
  location: string;    // 登录地点，如 "杭州"
  lastActive: string;  // 最近活跃，如 "刚刚" / "2 小时前"
  current: boolean;    // 是否为当前设备
  mobile: boolean;     // 是否移动端
}

interface SecuritySettings {
  twoFactor: boolean;  // 两步验证开关
  loginAlert: boolean; // 异地登录提醒开关
}
```

## 接口

### GET /api/v1/user/security/settings
获取安全开关状态。

**响应 data**
```json
{ "twoFactor": false, "loginAlert": true }
```

### PUT /api/v1/user/security/2fa
开启 / 关闭两步验证。

**请求体**
```json
{ "enabled": true }
```

**响应 data**
```json
{ "twoFactor": true }
```

### PUT /api/v1/user/security/login-alert
开启 / 关闭异地登录提醒。

**请求体**
```json
{ "enabled": false }
```

**响应 data**
```json
{ "loginAlert": false }
```

### GET /api/v1/user/devices
获取当前账号登录设备列表。

**响应 data**
```json
[
  {
    "id": "1",
    "name": "Chrome · macOS",
    "location": "杭州",
    "lastActive": "刚刚",
    "current": true,
    "mobile": false
  }
]
```

### DELETE /api/v1/user/devices/:id
强制下线指定设备（对应前端 `revoke` 二次确认）。

**响应**：成功返回空 `data`；`errno` 非 0 表示失败（如设备不存在）。

## 备注
- 修改密码不在本界面（平台采用内存态 Token + HttpOnly Cookie，密码修改由认证服务单独处理）。
- 所有写操作需携带有效 `Bearer` token，否则响应 `errno=1101` 触发重新登录。
