import { h, Fragment, render } from 'preact';
import { useEffect } from 'preact/hooks';
import { AdminPage } from './pages/admin';
import LoginPage from './pages/login';
import { Viewer } from './pages/viewer';
import { useStore } from './services/store';
import './styles/global.css';

const App = () => {
  const validateSession = useStore((s) => s.validateSession);
  const session = useStore((s) => s.session);

  useEffect(() => {
    validateSession();
  }, []);

  if (session === undefined) {
    return <></>;
  }

  if (session === null) {
    return <LoginPage />;
  }

  if (session.isAdmin) {
    return <AdminPage />;
  }

  return <Viewer />;
};

const el = document.getElementById('app');
render(<App />, el as any);
