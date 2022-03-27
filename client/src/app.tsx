import { h, Fragment, render } from 'preact';
import Router, { route, Route } from 'preact-router';
import { useEffect } from 'preact/hooks';
import { AdminPage } from './pages/admin';
import LoginPage from './pages/login';
import { TestPage } from './pages/test';
import { Viewer } from './pages/viewer';
import { useStore } from './services/store';
import './styles/global.css';

const Redirect = ({ to }: { to: string }) => {
  route(to);
  return null;
};

const ProtectedRoute = (props: any) => {
  const isLoggedIn = useStore((s) => s.session !== null && s.session !== undefined);

  // only redirect once we've cleared the screen:
  useEffect(() => {
    if (!isLoggedIn) {
      route('/', true);
    }
  }, [isLoggedIn]);

  // not logged in, render nothing:
  if (!isLoggedIn) return null;

  return <Route {...props} />;
};

const AdminRoute = (props: any) => {
  const isAdmin = useStore((s) => s.session?.isAdmin === true);

  // only redirect once we've cleared the screen:
  useEffect(() => {
    if (!isAdmin) {
      route('/', true);
    }
  }, [isAdmin]);

  // not logged in, render nothing:
  if (!isAdmin) return null;

  return <Route {...props} />;
};

const App = () => {
  const validateSession = useStore((s) => s.validateSession);
  const session = useStore((s) => s.session);

  useEffect(() => {
    validateSession();
  }, []);

  if (session === undefined) {
    return <></>;
  }

  return (
    <Router>
      <Route path='/' component={LoginPage} />
      <Route path='/test' component={TestPage} />
      <ProtectedRoute path='/viewer' component={Viewer} />
      <AdminRoute path='/admin' component={AdminPage} />
    </Router>
  );
};

const el = document.getElementById('app');
render(<App />, el as any);
