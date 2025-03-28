import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const useAuthStore = create(
  persist(
    (set) => ({
      user: undefined,
      setUser: (user) => set({ user }),
    }),
    {
      name: "user-auth", // name of the item in the storage (must be unique)
    }
  )
);

const useDialogStore = create((set) => ({
  open: false,
  toggleOpen: () => set((state) => ({ open: !state.open })), // Fix here
}));

export { useAuthStore, useDialogStore };
