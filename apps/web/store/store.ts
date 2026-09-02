import { configureStore, createSlice, PayloadAction } from "@reduxjs/toolkit";

type SessionState = {
  role: "MANAGER" | "CASHIER" | null;
};

const sessionSlice = createSlice({
  name: "session",
  initialState: { role: null } as SessionState,
  reducers: {
    setRole(state, action: PayloadAction<SessionState["role"]>) {
      state.role = action.payload;
    }
  }
});

export const { setRole } = sessionSlice.actions;

export const store = configureStore({
  reducer: {
    session: sessionSlice.reducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
