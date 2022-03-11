import { h, Fragment, render } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { AdminPage } from './pages/admin';
import LoginPage from './pages/login';
import { Viewer } from './pages/viewer';
import { useSession } from './services/session';
import './styles/global.css';

const App = () => {
  const validateSession = useSession((s) => s.validateSession);
  const hasSession = useSession((s) => s.hasSession);
  const isAdmin = useSession((s) => s.isAdmin);

  useEffect(() => {
    validateSession();
  }, []);

  if (hasSession === null) {
    return <></>;
  }

  if (!hasSession) {
    return <LoginPage />;
  }

  if (isAdmin) {
    return <AdminPage />;
  }

  return <Viewer />;
};

const el = document.getElementById('app');
render(<App />, el as any);
