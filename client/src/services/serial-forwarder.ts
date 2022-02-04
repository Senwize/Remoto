import { EventEmitter } from 'events';

enum State {
  Disconnected,
  Ready,
}

/*
  TODO: try and recover websocket disconnections to avoid having to request a SerialPort again
*/

export class SerialForwarder extends EventEmitter {
  protected state = State.Disconnected;
  // Websocket connection to serial broker
  protected ws!: WebSocket;
  // SerialPort to the Pico
  protected serialPort!: SerialPort;

  // AbortController can be used to cancel streams
  protected abortController = new AbortController();
  // SerialPort streams
  protected serialWriteable!: WritableStream<Uint8Array>;
  protected serialReadable!: ReadableStream<Uint8Array>;
  // Websocket streams
  protected wsWritable!: WritableStream<Uint8Array>;
  protected wsReadable!: ReadableStream<Uint8Array>;

  async connect() {
    await this.connectWebSocket();
    await this.connectSerialPort();
    this.createPipe();

    console.log('[SerialForwarder] Initialized and started');
    this.state = State.Ready;
    this.emit('connect');
  }

  protected createPipe() {
    this.serialReadable.pipeTo(this.wsWritable, { signal: this.abortController.signal });
    this.wsReadable.pipeTo(this.serialWriteable, { signal: this.abortController.signal });
  }

  protected async connectWebSocket() {
    // Create WebSocket streams
    const ws = new WebSocket(`ws://${location.host}/websocket-serial`);

    // Wait for connection
    await new Promise<void>((resolve) => {
      ws.addEventListener('open', () => resolve());
    });
    console.log('[SerialForwarder] Websocket connected');

    // Handle disconnect
    ws.addEventListener('close', () => this.onWebSocketDisconnect());

    // Create websocket streams
    this.wsWritable = newWebSocketWritable(ws);
    this.wsReadable = newWebSocketReadable(ws);

    // Set the websocket
    this.ws = ws;
  }

  protected async connectSerialPort() {
    // Request user to select a serial port
    const port = await navigator.serial.requestPort({
      filters: [{ usbVendorId: 0x2e8a, usbProductId: 0x0005 }],
    });

    // Handle disconnect
    port.ondisconnect = () => this.onSerialPortDisconnect();

    // Create a connection
    await port.open({ baudRate: 115200 });
    console.log('[SerialForwarder] Serial port opened');

    // Verify readability and writability
    if (!port.readable || !port.writable) {
      throw new Error("Can't open port with correct permissions");
    }

    // Create serial streams
    this.serialWriteable = port.writable;
    this.serialReadable = port.readable;

    // Set the port
    this.serialPort = port;
  }

  protected onWebSocketDisconnect() {
    console.log('[SerialForwarder] Websocket disconnected');
    this.disconnect();
  }

  protected onSerialPortDisconnect() {
    console.log('[SerialForwarder] Serial port disconnected');
    this.disconnect();
  }

  async disconnect() {
    if (this.state === State.Disconnected) return;
    this.state = State.Disconnected;

    // Cancel streams
    this.abortController.abort();

    // Close connections
    // this.serialPort.close();
    // this.ws.close();

    // Emit event
    this.emit('disconnect');
  }
}

/**
 * Creates a writable stream which writes to the websocket
 * @param ws
 * @returns
 */
function newWebSocketWritable(ws: WebSocket) {
  return new WritableStream({
    write(chunk: Uint8Array, controller) {
      ws.send(chunk);
    },
  });
}

/**
 * Creates a readable stream which reads from the websocket
 * @param ws
 * @returns
 */
function newWebSocketReadable(ws: WebSocket) {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    start(controller) {
      ws.addEventListener('close', () => controller.close());
      ws.addEventListener('message', (event) => {
        controller.enqueue(encoder.encode(event.data));
      });
    },
    pull(controller) {},
    cancel() {},
  });
}

export declare interface SerialForwarder {
  addListener(event: 'connect', listener: () => void): this;
  addListener(event: 'disconnect', listener: () => void): this;
  addListener(event: string, listener: Function): this;
}
