import { h, Fragment, render } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { Display } from './components/display';
import { ConnectButton, State } from './components/connect-btn';
import { RemoteDesktop } from './services/remote-desktop';
import { SerialForwarder } from './services/serial-forwarder';
import Guacamole from 'guacamole-common-js';
import './styles/global.css';

const forwarder = new SerialForwarder();
const remoteDesktop = new RemoteDesktop();

export const App = () => {
  const [state, setState] = useState<State>(State.Disconnected);
  const [withControl, setWithControl] = useState(false);
  const [client, setClient] = useState<Guacamole.Client | undefined>(undefined);

  useEffect(() => {
    function reset() {
      remoteDesktop.disconnect();
      forwarder.disconnect();
      setState(State.Disconnected);
    }

    // listeners
    function onRemoteDesktopConnect(client: Guacamole.Client) {
      setClient(client);
    }
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

  async function onConnectClick(e: any) {
    const withControl = e.shiftKey !== true;

    setState(State.Connecting);
    startConnect(withControl).catch(onConnectFailed);

    setWithControl(withControl);
  }

  async function startConnect(withControl: boolean) {
    // Initialize SerialForwarder
    // const forwarder = new SerialForwarder();
    // TODO: Add event listeners
    if (withControl) {
      await forwarder.connect();
    }

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
      <Display client={client} withControl={withControl} />
    </>
  );
};

const el = document.getElementById('app');
render(<App />, el as any);
