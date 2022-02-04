import { h, Fragment, render } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { Display } from './components/display';
import { ConnectButton, State } from './components/connect-btn';
import { RemoteDesktop } from './services/remote-desktop';
import { SerialForwarder } from './services/serial-forwarder';
import './styles/global.css';

const forwarder = new SerialForwarder();
const remoteDesktop = new RemoteDesktop();

export const App = () => {
  const [state, setState] = useState<State>(State.Disconnected);

  useEffect(() => {
    function reset() {
      remoteDesktop.disconnect();
      forwarder.disconnect();
      setState(State.Disconnected);
    }

    // listeners
    function onRemoteDesktopConnect() {}
    function onRemoteDesktopDisconnect() {
      reset();
    }
    function onForwarderConnect() {}
    function onForwarderDisconnect() {
      reset();
    }

    // Set listeners
    remoteDesktop.addListener('connect', onRemoteDesktopConnect);
    remoteDesktop.addListener('disconnect', onRemoteDesktopDisconnect);
    forwarder.addListener('connect', onForwarderConnect);
    forwarder.addListener('disconnect', onForwarderDisconnect);

    return () => {
      remoteDesktop.removeListener('connect', onRemoteDesktopConnect);
      remoteDesktop.removeListener('disconnect', onRemoteDesktopDisconnect);
      forwarder.removeListener('connect', onForwarderConnect);
      forwarder.removeListener('disconnect', onForwarderDisconnect);
    };
  }, []);

  async function onConnectClick() {
    setState(State.Connecting);
    startConnect().catch(onConnectFailed);
  }

  async function startConnect() {
    // Initialize SerialForwarder
    // const forwarder = new SerialForwarder();
    // TODO: Add event listeners
    await forwarder.connect();

    // Initialize Guacamole Client
    // const rd = new RemoteDesktop();
    await remoteDesktop.connect();

    // Set references

    setState(State.Ready);
  }

  function onConnectFailed(err: Error) {
    console.warn('[app] connect failed: ', err);
    setState(State.Disconnected);
  }

  return (
    <>
      <ConnectButton state={state} onClick={onConnectClick} />
      <Display remote={remoteDesktop} />
    </>
  );
};

const el = document.getElementById('app');
render(<App />, el as any);
