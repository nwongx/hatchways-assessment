import { configureStore } from "@reduxjs/toolkit";
import studentReducer from "../features/student/student.slice";

export const store = configureStore({
  reducer: {
    student: studentReducer,
  },
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
