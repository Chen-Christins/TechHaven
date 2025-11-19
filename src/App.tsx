import './App.css';
import { BrowserRouter } from 'react-router-dom';
import { MessageProvider } from './components/message/Message';
import { ConfirmProvider } from './components/confirm/Confirm';
import { ThemeProvider } from './contexts/ThemeContext';
import RouterConfig from './router/RouterConfig';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <MessageProvider>
          <ConfirmProvider>
            <RouterConfig />
          </ConfirmProvider>
        </MessageProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;