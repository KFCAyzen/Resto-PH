import { useAuth } from './hooks/useAuth';
import AdminLogin from './AdminLogin';
import AdminPage from './AdminPage';

export default function ProtectedAdminRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Chargement...</div>;
  }

  return user ? <AdminPage /> : <AdminLogin />;
}