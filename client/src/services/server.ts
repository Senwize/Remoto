import { useSession } from './session';

class server {
  async validateSession() {
    const res = await fetch('/api/sessions/current');

    // Check if an active session exists
    if (!res.ok) {
      useSession.setState({ hasSession: false }, true);
      return;
    }

    const data = await res.json();
    useSession.setState({ ...data, hasSession: true });
  }

  async startSession(workshopCode: string) {
    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        workshop_code: workshopCode,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message);
    }

    return this.validateSession();
  }
}

export const Server = new server();

setInterval(() => Server.validateSession(), 5000);
