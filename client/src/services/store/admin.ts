import { StateCreator } from 'zustand';

interface AdminState {
  selectedSession: Session | null;
  selectedSandbox: Sandbox | null;
  adminSummary: AdminData | null | undefined;

  fetchAdminSummary(): void;
  selectSession(session: Session | null): void;
  selectSandbox(sandbox: Sandbox | null): void;
  destroySession(sessionID: string): void;
}

export const adminSlice: StateCreator<AdminState> = (set, get) => ({
  selectedSandbox: null,
  selectedSession: null,
  adminSummary: undefined,

  /**
   *
   */
  async fetchAdminSummary() {
    const res = await fetch('/api/admin/summary');

    if (!res.ok) {
      console.error(res);
    }

    const admin = await res.json();
    set({ adminSummary: admin });
  },

  /**
   *
   * @param session
   */
  selectSession(session) {
    set({ selectedSession: session });
  },

  /**
   *
   * @param sandbox
   */
  selectSandbox(sandbox) {
    set({ selectedSandbox: sandbox });
  },

  /**
   *sessionID
   * @param sandbox
   */
  async destroySession(sessionID) {
    const res = await fetch('/api/sessions/' + sessionID, {
      method: 'DELETE',
    });

    if (!res.ok) {
      console.error(res);
    }

    get().selectSession(null);
    return get().fetchAdminSummary();
  },
});
