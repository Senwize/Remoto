import { h, render } from 'preact';
import { Client } from './components/client';
import './styles/global.css';

export const App = () => {
  return <Client />;
};

const el = document.getElementById('app');
render(<App />, el as any);
