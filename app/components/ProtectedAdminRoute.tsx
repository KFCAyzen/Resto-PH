import { useAuth } from '../hooks/useAuth';
import AdminLogin from './AdminLogin';
import AdminPage from './AdminPage';

export default function ProtectedAdminRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="page-loader">
        <div className="spinner" />
        <p style={{ margin: 0 }}>Vérification...</p>
      </div>
    );
  }

  return user ? <AdminPage /> : <AdminLogin />;
}
