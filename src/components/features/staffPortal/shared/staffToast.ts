import { toast } from "sonner";

// The next action sits at the bottom of the screen on the staff pages, so their
// toasts go to the top instead of the app's usual bottom-right
const options = { position: "top-center" } as const;

export const staffToast = {
  success: (message: string) => toast.success(message, options),
  error: (message: string) => toast.error(message, options),
};
