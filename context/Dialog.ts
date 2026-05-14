import { create } from "zustand";
type DialogStore = {
  open: boolean;
  setIsOpen: () => void;
  setOpen: (isOpen: boolean) => void;
};

const useDialogOpen = create<DialogStore>((set) => ({
  open: false,
  setIsOpen: () => set((state) => ({ open: !state.open })),
  setOpen: (isOpen: boolean) => set({ open: isOpen }),
}));

export default useDialogOpen;
