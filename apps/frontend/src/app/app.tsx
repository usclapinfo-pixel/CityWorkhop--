import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../store/auth-context';
import { AppRouter } from '../routes/app-router';

export function App() {
  return <BrowserRouter><AuthProvider><AppRouter /></AuthProvider></BrowserRouter>;
}
