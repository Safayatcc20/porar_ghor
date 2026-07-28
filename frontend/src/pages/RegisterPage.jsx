import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import AuthForm from '../components/AuthForm.jsx';

export default function RegisterPage() {
  const { register } = useAuth();
  const nav = useNavigate();

  async function handle({ name, email, password }) {
    await register(name, email, password);
    nav('/');
  }

  return <AuthForm mode="register" onSubmit={handle} />;
}
