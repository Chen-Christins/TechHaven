import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";
import "./App.css";
import { BrowserRouter } from "react-router-dom";
import { MessageProvider } from "./components/message/Message";
import { ConfirmProvider } from "./components/confirm/Confirm";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import { SiteSettingsProvider } from "./contexts/SiteSettingsContext";
import IdleTimeoutHandler from "./components/sessionTimeout/IdleTimeoutHandler";
import RouterConfig from "./router/RouterConfig";

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <SiteSettingsProvider>
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
          </SiteSettingsProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
