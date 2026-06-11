import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";
import "./App.css";
import { BrowserRouter } from "react-router-dom";
import { useEffect } from "react";
import { MessageProvider } from "./components/message/Message";
import { ConfirmProvider } from "./components/confirm/Confirm";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import { LayoutWidthProvider } from "./contexts/LayoutWidthContext";
import { SiteSettingsProvider, useSiteSettings } from "./contexts/SiteSettingsContext";
import IdleTimeoutHandler from "./components/sessionTimeout/IdleTimeoutHandler";
import RouterConfig from "./router/RouterConfig";
import { usePresenceConnection } from "./hooks/useOnlineCount";
import { useDevToolsProtection } from "./hooks/useDevToolsProtection";
import { initErrorCodes } from "./utils/errorCodes";

function AppContent() {
  usePresenceConnection();
  useDevToolsProtection();

  // 应用启动时拉取一次错误码表
  const { settings } = useSiteSettings();
  useEffect(() => {
    initErrorCodes(settings.language);
  }, [settings.language]);
  return (
    <>
      <IdleTimeoutHandler />
      <MessageProvider>
        <ConfirmProvider>
          <SimpleBar
            style={{
              maxHeight: "100vh",
              width: "100vw",
              overflowX: "hidden",
            }}
            autoHide={false}
          >
            <RouterConfig />
          </SimpleBar>
        </ConfirmProvider>
      </MessageProvider>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <LayoutWidthProvider>
            <SiteSettingsProvider>
              <AppContent />
            </SiteSettingsProvider>
          </LayoutWidthProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
