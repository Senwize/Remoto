import { EventEmitter } from 'eventemitter3';

export class AutoWebSocket extends EventEmitter {
  private readonly address: string;
  private ws!: WebSocket;
  private keepAlive = false;
  private consecutiveFailures = 0;
  private maxRetryDelay = 2000;

  constructor(address: string) {
    super();
    this.address = address;
  }

  onConnect(ws: WebSocket) {
    this.consecutiveFailures = 0;
    this.ws = ws;

    this.emit('connect', ws);
  }

  async onDisconnect(ws: WebSocket) {
    // Remove listeners
    ws.removeEventListener('open', this.onConnect.bind(this, ws));
    ws.removeEventListener('close', this.onDisconnect.bind(this, ws));
    this.emit('disconnect', { consecutiveFailures: this.consecutiveFailures });

    if (this.keepAlive) {
      // Wait after multiple consecutive failures
      const retryDelay = Math.max(500 * this.consecutiveFailures, this.maxRetryDelay);
      await new Promise((resolve) => {
        setTimeout(resolve, retryDelay);
      });
      this.tryConnect();
    }
  }

  protected async tryConnect() {
    if (!this.keepAlive) return;
    const ws = new WebSocket(this.address);
    ws.addEventListener('open', this.onConnect.bind(this, ws));
    ws.addEventListener('close', this.onDisconnect.bind(this, ws));
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
    this.ws.close();
  }
}

export declare interface AutoWebSocket {
  addListener(event: 'connect', listener: () => void): this;
  addListener(event: 'disconnect', listener: () => void): this;
  addListener(event: string, listener: Function): this;
}
