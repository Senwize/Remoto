import createStore, { GetState, SetState, StoreApi } from 'zustand';
import { adminSlice } from './admin';
import { sessionSlice } from './session';

const store = (set: SetState<any>, get: GetState<any>, api: StoreApi<any>) => ({
  ...sessionSlice(set, get, api),
  ...adminSlice(set, get, api),
});

export const useStore = createStore(store);

setInterval(() => useStore.getState().validateSession(), 15000);
