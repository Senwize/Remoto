declare global {
  export interface SessionData {
    groupName: string;
    isAdmin: boolean;
  }

  export interface Session {
    id: string;
    groupName: string;
    sandboxIP: string;
    lastActive: number;
  }

  export interface Sandbox {
    ip: string;
    sessionID: string;
  }

  export interface AdminData {
    sessions: Session[];
    sandboxes: Sandbox[];
  }
}

export {};
