import './App.css';
import { MessageProvider } from './components/message/Message';
import { ConfirmProvider } from './components/confirm/Confirm';
// import AuthPage from './pages/auth/AuthPage';
import IndexPage from './pages/home/IndexPage';

function App() {
  return (
	<>
		<MessageProvider>
			<ConfirmProvider>
				<IndexPage />
			</ConfirmProvider>
		</MessageProvider>
	</>
  );
}

export default App;