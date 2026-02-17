/**
 * Cookie 工具类
 * 用于调试和验证cookies的处理
 */
export class CookieHelper {
  /**
   * 获取所有cookies
   */
  static getAllCookies(): Record<string, string> {
    const cookies: Record<string, string> = {};
    document.cookie.split(";").forEach((cookie) => {
      const [name, value] = cookie.trim().split("=");
      if (name && value) {
        cookies[name] = decodeURIComponent(value);
      }
    });
    return cookies;
  }

  /**
   * 获取特定cookie
   */
  static getCookie(name: string): string | null {
    const cookies = this.getAllCookies();
    return cookies[name] || null;
  }

  /**
   * 设置cookie
   */
  static setCookie(
    name: string,
    value: string,
    options: {
      expires?: Date;
      maxAge?: number;
      domain?: string;
      path?: string;
      secure?: boolean;
      sameSite?: "strict" | "lax" | "none";
    } = {},
  ): void {
    let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

    if (options.expires) {
      cookieString += `; expires=${options.expires.toUTCString()}`;
    }
    if (options.maxAge) {
      cookieString += `; max-age=${options.maxAge}`;
    }
    if (options.domain) {
      cookieString += `; domain=${options.domain}`;
    }
    if (options.path) {
      cookieString += `; path=${options.path}`;
    }
    if (options.secure) {
      cookieString += "; secure";
    }
    if (options.sameSite) {
      cookieString += `; samesite=${options.sameSite}`;
    }

    document.cookie = cookieString;
  }

  /**
   * 删除cookie
   */
  static deleteCookie(name: string, options: { domain?: string; path?: string } = {}): void {
    this.setCookie(name, "", {
      expires: new Date("1970-01-01"),
      domain: options.domain,
      path: options.path,
    });
  }

  /**
   * 调试：打印所有cookies
   */
  static debugCookies(): void {
    const cookies = this.getAllCookies();
    // console.log('🍪 当前Cookies状态:');
    // console.log('总数:', Object.keys(cookies).length);
    Object.entries(cookies).forEach(([_name, _value]) => {
      // console.log(`  ${name}: ${value}`);
    });
    if (Object.keys(cookies).length === 0) {
      // console.log('  (无cookies)');
    }
  }

  /**
   * 检查是否有认证相关的cookies
   */
  static hasAuthCookies(): boolean {
    const cookies = this.getAllCookies();
    const authCookieNames = ["token", "session", "auth", "sid", "sessionid", "jwt"];
    return authCookieNames.some((name) => Object.keys(cookies).some((cookie) => cookie.toLowerCase().includes(name.toLowerCase())));
  }

  /**
   * 监控cookies变化
   */
  static monitorCookies(interval: number = 1000): () => void {
    let previousCookies = JSON.stringify(this.getAllCookies());

    const intervalId = setInterval(() => {
      const currentCookies = JSON.stringify(this.getAllCookies());
      if (previousCookies !== currentCookies) {
        // console.log('🍪 Cookies发生变化:');
        this.debugCookies();
        previousCookies = currentCookies;
      }
    }, interval);

    return () => clearInterval(intervalId);
  }
}

export default CookieHelper;
