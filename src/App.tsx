import './App.css';
import { BrowserRouter } from 'react-router-dom';
import { MessageProvider } from './components/message/Message';
import { ConfirmProvider } from './components/confirm/Confirm';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import RouterConfig from './router/RouterConfig';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <MessageProvider>
            <ConfirmProvider>
              <RouterConfig />
            </ConfirmProvider>
          </MessageProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;