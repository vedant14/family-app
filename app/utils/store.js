import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const useAuthStore = create(
  persist(
    (set) => ({
      user: undefined,
      teams: [],
      selectedTeam: null,
      setTeams: (teams) => set({ teams }),
      setSelectedTeam: (team) => set({ selectedTeam: team }),
      logout: () => set({ user: undefined, teams: [], selectedTeam: null }),
      setUser: (user) => set({ user }),
    }),
    {
      name: "user-auth",
    }
  )
);

const useDialogStore = create((set) => ({
  open: false,
  toggleOpen: () => set((state) => ({ open: !state.open })), // Fix here
}));

export { useAuthStore, useDialogStore };
