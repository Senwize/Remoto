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

enum ControlState {
  ControlAndSerial,
  ControlOnly,
  ViewOnly,
}

export const App = () => {
  const [state, setState] = useState<State>(State.Disconnected);
  const [control, setControl] = useState(ControlState.ControlAndSerial);
  const [client, setClient] = useState<Guacamole.Client | undefined>(undefined);
  const [buttonText, setButtonText] = useState('Connect');

  useEffect(() => {
    if (state === State.Ready) return;

    function keyHandler(e: KeyboardEvent) {
      if (e.ctrlKey) {
        setButtonText('Connect with control');
        setControl(ControlState.ControlOnly);
        return;
      }
      if (e.shiftKey) {
        setButtonText('Connect view-only');
        setControl(ControlState.ViewOnly);
        return;
      }
      setButtonText('Connect');
      setControl(ControlState.ControlAndSerial);
    }

    document.addEventListener('keydown', keyHandler);
    document.addEventListener('keyup', keyHandler);

    return () => {
      document.removeEventListener('keydown', keyHandler);
      document.removeEventListener('keyup', keyHandler);
    };
  }, [state]);

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
    setState(State.Connecting);
    startConnect().catch(onConnectFailed);
  }

  async function startConnect() {
    // Initialize SerialForwarder
    // const forwarder = new SerialForwarder();
    // TODO: Add event listeners
    if (control === ControlState.ControlAndSerial) {
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
      {state !== State.Disconnected ? null : <ConnectButton state={state} onClick={onConnectClick} text={buttonText} />}
      <Display client={client} withControl={control !== ControlState.ViewOnly} />
    </>
  );
};

const el = document.getElementById('app');
render(<App />, el as any);
