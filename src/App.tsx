import './App.css';
import { MessageProvider } from './components/message/Message'; // 导入MessageProvider
import { ConfirmProvider } from './components/confirm/Confirm'; // 导入ConfirmProvider
import AuthPage from './pages/auth/AuthPage';

function App() {
  return (
    // 外层包裹MessageProvider
    <MessageProvider>
      {/* 内层包裹ConfirmProvider */}
      <ConfirmProvider>
        {/* 子组件可以同时使用message和confirm功能 */}
		<AuthPage />
      </ConfirmProvider>
    </MessageProvider>
  );
}

export default App;