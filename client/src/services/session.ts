import createStore from 'zustand';
import { combine } from 'zustand/middleware';

export const useSession = createStore(
  combine(
    // Initial state
    {
      hasSession: null as boolean | null,
      groupname: '',
    },
    // Functions
    (set) => ({})
  )
);
