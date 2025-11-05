import './App.css';
import { BrowserRouter } from 'react-router-dom';
import { MessageProvider } from './components/message/Message';
import { ConfirmProvider } from './components/confirm/Confirm';
import RouterConfig from './router/RouterConfig';

function App() {
  return (
    <BrowserRouter>
      <MessageProvider>
        <ConfirmProvider>
          <RouterConfig />
        </ConfirmProvider>
      </MessageProvider>
    </BrowserRouter>
  );
}

export default App;