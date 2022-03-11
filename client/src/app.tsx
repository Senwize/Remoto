import { h, Fragment, render } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import LoginPage from './pages/login';
import { Viewer } from './pages/viewer';
import { Server } from './services/server';
import { useSession } from './services/session';
import './styles/global.css';

const App = () => {
  const hasSession = useSession((s) => s.hasSession);

  useEffect(() => {
    Server.validateSession();
  }, []);

  if (hasSession === null) {
    return <></>;
  }

  if (!hasSession) {
    return <LoginPage />;
  }

  return <Viewer />;
};

const el = document.getElementById('app');
render(<App />, el as any);
