import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import AuthForm from '../components/AuthForm.jsx';

export default function LoginPage() {
  const { login } = useAuth();
  const nav = useNavigate();

  async function handle({ email, password }) {
    await login(email, password);
    nav('/');
  }

  return <AuthForm mode="login" onSubmit={handle} />;
}
