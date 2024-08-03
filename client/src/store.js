import { create } from "zustand";

export const useStore = create((set) => ({
  meetingId: "",
  setMeetingId: (meetingId) => set({ meetingId: meetingId }),
  messages: [],
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  users: [],
  addUser: (user) => set((state) => ({ users: [...state.users, user] })),
  removeUser: (userId) =>
    set((state) => ({
      users: state.users.filter((user) => user.id !== userId),
    })),
  clearUsers: () => set({ users: [] }),
  clearMessages: () => set({ messages: [] }),
}));
