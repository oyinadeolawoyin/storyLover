import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthService } from '../service/authService';

// Wrap any admin page with this. If nobody is logged in, it sends them to the login page.
export default function AdminRoute({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkSession() {
      try {
        const current = await AuthService.getSession();
        setSession(current);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    checkSession();

    // Update automatically if the person logs out in another tab
    const subscription = AuthService.onAuthChange(setSession);
    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <p>Loading...</p>;
  if (!session) return <Navigate to="/admin/login" replace />;

  return children;
}