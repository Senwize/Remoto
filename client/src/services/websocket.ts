import { EventEmitter } from 'eventemitter3';

export class AutoWebSocket extends EventEmitter {
  private readonly address: string;
  private ws?: WebSocket;
  private keepAlive = false;
  private connectionAttempts = 0;
  private maxRetryDelay = 2000;

  constructor(address: string) {
    super();
    this.address = address;
  }

  protected onConnect(ws: WebSocket) {
    console.log('[AutoWebSocket] Connected');
    this.connectionAttempts = 0;
    this.ws = ws;

    this.emit('connect', ws);
  }

  async onDisconnect(ws: WebSocket) {
    console.log('[AutoWebSocket] Disconnected');
    this.emit('disconnect', { attempts: this.connectionAttempts });
    this.tryConnect();
  }

  onError(ws: WebSocket, err: any) {
    console.log('[AutoWebSocket] Error', err);
    this.tryConnect();
  }

  protected async retryDelay() {
    // Insert delay after multiple consecutive failures
    const retryDelay = Math.min(500 * Math.max(this.connectionAttempts - 1, 0), this.maxRetryDelay);
    if (retryDelay === 0) return;

    console.log(`[AutoWebSocket] Connecting in ${retryDelay}ms`);
    return new Promise((resolve) => {
      setTimeout(resolve, retryDelay);
    });
  }

  protected async waitForConnect(ws: WebSocket) {
    // Wait for open/error
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });
    ws.onopen = null;
    ws.onerror = null;
  }

  protected async tryConnect() {
    if (!this.keepAlive) return;
    console.log('[AutoWebSocket] Trying connect to ', this.address, { attempts: this.connectionAttempts });

    // This is a new connection attempt. Will reset to 0 in the onConnect listener
    this.connectionAttempts++;

    // Insert reconenct delay if there are consecutive failures
    await this.retryDelay();

    // Create new websocket instance
    const ws = new WebSocket(this.address);

    // Wait for websocket open / error
    await this.waitForConnect(ws).catch(this.tryConnect.bind(this));

    // Setup listeners
    ws.onerror = this.onError.bind(this, ws);
    ws.onclose = this.onDisconnect.bind(this, ws);
    // Fire onConnect listener manually as we've already had the 'open' event whilst `waitForConnect`
    this.onConnect(ws);
  }

  /**
   * Starts a connection and keepalive
   */
  async connect() {
    this.keepAlive = true;
    return this.tryConnect();
  }

  async disconnect() {
    this.keepAlive = false;
    this.ws?.close();
  }
}

export declare interface AutoWebSocket {
  addListener(event: 'connect', listener: () => void): this;
  addListener(event: 'disconnect', listener: () => void): this;
  addListener(event: string, listener: Function): this;
}
