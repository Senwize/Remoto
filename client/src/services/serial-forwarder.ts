import { EventEmitter } from 'events';
import { AutoWebSocket } from './websocket';
import qs from 'query-string';

enum State {
  Disconnected,
  Ready,
}

/*
  TODO: try and recover websocket disconnections to avoid having to request a SerialPort again
*/

export class SerialForwarder extends EventEmitter {
  protected aws?: AutoWebSocket;
  protected ws?: WebSocket;
  protected serialPort?: SerialPort;
  protected serialRead?: ReadableStreamDefaultReader<Uint8Array>;
  protected serialWrite?: WritableStreamDefaultWriter<Uint8Array>;
  protected readLoopAlive = false;

  async connect() {
    await this.connectWebsocket();
    await this.connectSerialPort();
    console.log('[SerialForwarder] Connected');
  }

  disconnect() {
    this.readLoopAlive = false;
    if (this.serialPort) {
      this.serialPort.close();
    }
    if (this.aws) {
      this.aws.disconnect();
    }
    this.aws = undefined;
    this.ws = undefined;
    this.serialPort = undefined;
    this.serialRead = undefined;
    this.serialWrite = undefined;
    console.log('[SerialForwarder] disconnected');
  }

  protected async connectWebsocket() {
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const q = qs.parse(location.search) as any;
    const ws = new WebSocket(`${protocol}//${location.host}/api/ws/serial?` + qs.stringify(q));
    ws.onopen = () => {
      console.log('[SerialForwarder] Websocket connected');
      this.ws = ws;
      ws.onmessage = this.onWebsocketData.bind(this);
    };
    ws.onclose = ws.onerror = () => {
      console.log('[SerialForwarder] Websocket disconnected');
      setTimeout(this.connectWebsocket.bind(this), 1000);
      this.ws = undefined;
    };
  }

  protected async connectSerialPort() {
    // Request user to select a serial port
    let port: SerialPort;

    try {
      port = await navigator.serial.requestPort({
        filters: [{ usbVendorId: 0x2e8a, usbProductId: 0x0005 }],
      });
    } catch (e) {
      alert('Could not open serial port. Page will be refreshed');
      location.reload();
      return;
    }

    port.ondisconnect = () => {
      console.log('[SerialForwarder] Serial port disconnected');
      this.serialPort = undefined;
      this.serialRead = undefined;
      this.serialWrite = undefined;
      setTimeout(this.connectSerialPort.bind(this), 1000);
      return;
    };

    // Open the serial port
    try {
      await port.open({ baudRate: 115200 });
      console.log('[SerialForwarder] Serial port opened');
    } catch (e) {
      alert('Could not open serial port. Page will be refreshed');
      location.reload();
    }

    // Verify readability and writability
    if (!port.readable || !port.writable) {
      throw new Error("Can't open port with correct permissions");
    }

    this.serialPort = port;
    this.serialRead = port.readable.getReader();
    this.serialWrite = port.writable.getWriter();

    this.readLoopAlive = true;
    this.pipeSerialToWS();
  }

  private encoder = new TextEncoder();
  async onWebsocketData(ev: MessageEvent<string>) {
    if (!this.serialWrite || !this.ws) {
      console.log("[SerialForwarder] onWebSocketData: Can't pipe without a serial port and websocket");
      return;
    }

    // Pipe WS to Serial
    this.serialWrite.write(this.encoder.encode(ev.data));
  }

  async pipeSerialToWS() {
    console.log('[SerialForwarder] Reading serial port...');
    if (!this.serialRead || !this.ws) {
      console.log("[SerialForwarder] pipeSerialToWS: Can't pipe without a serial port and websocket");
      this.readLoopAlive && setTimeout(this.pipeSerialToWS.bind(this), 1000);
      return;
    }

    // Pipe WS to Serial
    const { value, done } = await this.serialRead.read();
    if (done) {
      console.log('[SerialForwarder] Serial port closed');
      return;
    }

    // Skip empty data
    if (value === undefined) {
      console.log('[SerialForwarder] Skipping empty data');
      this.readLoopAlive && setTimeout(this.pipeSerialToWS.bind(this), 5);
      return;
    }

    this.ws.send(value);

    // Continue
    this.readLoopAlive && setTimeout(this.pipeSerialToWS.bind(this), 5);
  }
}
