import { StateCreator } from 'zustand';

interface SessionState {
  session: SessionData | null | undefined;
  validateSession(): void;
  startSession(workshopCode: string, groupName: string): Promise<void>;
}

export const sessionSlice: StateCreator<SessionState> = (set, get) => ({
  session: undefined,

  /**
   * Fetch new session data
   */
  async validateSession() {
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
  async startSession(workshopCode: string, groupName: string = '') {
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

    return get().validateSession();
  },
});
