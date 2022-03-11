import createStore from 'zustand';
import { combine } from 'zustand/middleware';

interface SessionData {
  groupName: string;
  isAdmin: boolean;
}

export const useSession = createStore(
  combine(
    // Initial state
    {
      session: undefined as SessionData | null | undefined,
    },
    // Functions
    (set) => ({
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

      startSession: async (workshopCode: string) => {
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

        const session = await res.json();
        set({ session });

        return;
      },
    })
  )
);
