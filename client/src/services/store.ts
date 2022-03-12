import createStore from 'zustand';
import { combine } from 'zustand/middleware';

interface SessionData {
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

export const useStore = createStore(
  combine(
    // Initial state
    {
      session: undefined as SessionData | null | undefined,
      adminSummary: undefined as AdminData | null | undefined,
    },
    // Functions
    (set) => ({
      /**
       * Fetch new session data
       */
      validateSession: async () => {
        const res = await fetch('/api/sessions/current');

        // Check if an active session exists
        if (!res.ok) {
          set({ session: null });
          return;
        }

        const session = await res.json();
        set({ session });
      },

      /**
       * Attempt to start a new session
       * @param workshopCode the code for the workshop
       */
      startSession: async (workshopCode: string, groupName: string = '') => {
        const res = await fetch('/api/sessions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            workshop_code: workshopCode,
            groupName,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message);
        }

        const session = await res.json();
        set({ session });

        return;
      },

      /**
       * Fetch administrative data
       */
      fetchAdminSummary: async () => {
        const res = await fetch('/api/admin/summary');

        if (!res.ok) {
          console.error(res);
        }

        const admin = await res.json();
        set({ adminSummary: admin });
      },
    })
  )
);
