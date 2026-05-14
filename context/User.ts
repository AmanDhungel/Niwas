import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import Cookies from "js-cookie";

export type UserDataType = {
  createdAt: string;
  updatedAt: string;
  user_email: string;
  user_email_verified: boolean;
  user_groups: string[];
  user_name: string;
  user_permissions: string[];
  user_permission_policies: {
    createdAt: string;
    description: string;
    name: string;
    policy: string;
    type: string;
    _id: string;
  }[];
  user_role: string;
  user_type: string;
};
type AuthStore = {
  user: UserDataType | null;
  isLoggedIn: boolean;
  loginData: (userData: UserDataType) => void;
  logout: () => void;
  updateName: (newName: string) => void;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  setUser: (user: UserDataType | null) => void;
};

const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isLoggedIn: false,
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),

      loginData: (userData) =>
        set({
          user: userData,
          isLoggedIn: true,
        }),

      logout: () =>
        set(() => {
          return { user: null, isLoggedIn: false };
        }),

      setUser: (user) => set({ user, isLoggedIn: !!user }),
      updateName: (newName) =>
        set((state) => ({
          user: state.user ? { ...state.user, user_name: newName } : null,
        })),
    }),
    {
      name: "auth-storage",
      onRehydrateStorage: () => (state) => {
        if (!state) return;

        if (typeof window !== "undefined") {
          const token = Cookies.get("user_token");

          if (state.user && !token) {
            console.warn("No token found. Resetting session.");
            state.logout();
          }
        }
        state.setHasHydrated(true);
      },

      partialize: (state) => ({
        user: state.user,
        isLoggedIn: state.isLoggedIn,
      }),

      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? localStorage : ({} as Storage),
      ),
    },
  ),
);

export default useAuthStore;
