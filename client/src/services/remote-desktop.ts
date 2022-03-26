import { Client, Tunnel, WebSocketTunnel, Status, Display } from 'guacamole-common-js';
import { EventEmitter } from 'eventemitter3';
import qs from 'query-string';

enum State {
  Disconnected,
  Ready,
}

export interface ConnectOpts {
  protocol: 'vnc' | 'rdp';
  hostname: string;
  port: string;
  username: string;
  password: string;
  ignorecert: string;
  security: 'any';
}

export class RemoteDesktop extends EventEmitter {
  protected state = State.Disconnected;
  protected tunnel!: Tunnel;
  protected client!: Client;
  protected display!: Display;

  onClientError(status: Status) {
    console.error('[RemoteDesktop] client error: ', status);
    this.emit('error', status);
  }

  onClientStateChange(state: number) {
    console.log('[RemoteDesktop] client state: ', state);
    switch (state) {
      // TODO: other states
      case 3:
        this.state = State.Ready;
        console.log('[RemoteDesktop] client connected');
        this.emit('connect', this.client);
        break;
    }
  }

  onTunnelError(status: Status) {
    console.warn('[RemoteDesktop] tunnel error: ', status);
    this.emit('error', status);
  }

  onTunnelStateChange(state: number) {
    console.log('[RemoteDesktop] tunnel state: ', state);
  }

  async connect(opts: Partial<ConnectOpts> = {}) {
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const tunnel = new WebSocketTunnel(`${protocol}//${location.host}/api/ws/guacamole`);
    const client = new Client(tunnel);

    // Set
    this.client = client;
    this.tunnel = tunnel;

    // Register listeners
    tunnel.onerror = this.onTunnelError.bind(this);
    tunnel.onstatechange = this.onTunnelStateChange.bind(this);
    client.onerror = this.onClientError.bind(this);
    client.onstatechange = this.onClientStateChange.bind(this);

    client.connect(qs.stringify(opts));

    return () => {
      client.disconnect();
    };
  }

  disconnect() {
    if (this.state === State.Disconnected) return;
    this.state = State.Disconnected;

    this.client.disconnect();
  }
}

// export declare interface RemoteDesktop {
//   on(event: 'connect', listener: (client: Client) => void): this;
//   on(event: 'disconnect', listener: () => void): this;
//   on(event: string, listener: Function): this;

//   removeListener(event: 'connect', listener: (client: Client) => void): this;
//   removeListener(event: 'disconnect', listener: () => void): this;
//   removeListener(event: string, listener: Function): this;
// }
