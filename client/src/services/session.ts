import createStore from 'zustand';
import { combine } from 'zustand/middleware';

export const useSession = createStore(
  combine(
    // Initial state
    {
      hasSession: null as boolean | null,
      isAdmin: false,
      groupname: '',
    },
    // Functions
    (set) => ({
      validateSession: async () => {
        const res = await fetch('/api/sessions/current');

        // Check if an active session exists
        if (!res.ok) {
          set({ hasSession: false });
          return;
        }

        const data = await res.json();
        set({ ...data, hasSession: true });
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

        const data = await res.json();
        set({ ...data, hasSession: true });

        return;
      },
    })
  )
);
