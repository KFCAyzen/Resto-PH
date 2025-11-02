import { useAuth } from '../hooks/useAuth';
import AdminLogin from './AdminLogin';
import AdminPage from './AdminPage';

export default function ProtectedAdminRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #7d3837',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        <p style={{ color: '#7d3837', fontSize: '1.1rem', margin: 0 }}>Vérification...</p>
      </div>
    );
  }

  return user ? <AdminPage /> : <AdminLogin />;
}