import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { AngleDown, Logout, UserCircle } from "reicon-react";
import { cn } from "@/libs/utils";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { selectAccountUser, setActiveSection } from "@/redux/account/accountSlice";
import { selectIsAdmin } from "@/redux/auth/authSlice";
import { useLogout } from "@/hooks/useLogout";

const itemClass =
  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors";

// Avatar in the navbar that opens a menu with Profile and Log out
export function ProfileDropdown() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector(selectAccountUser);
  const isAdmin = useAppSelector(selectIsAdmin);
  const handleLogout = useLogout();
  // Only this menu cares whether it's open, so it stays local
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on a click outside the avatar + menu, or on Escape
  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const openProfile = () => {
    setOpen(false);
    dispatch(setActiveSection("account"));
    navigate("/dashboard/account");
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-3 rounded-full py-1 pl-1 pr-2 transition hover:bg-gray-100"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-900">
          {user.name.charAt(0).toUpperCase()}
        </div>

        <span className="hidden text-sm font-semibold text-gray-800 sm:inline">
          {user.name}
        </span>

        <AngleDown
          size={16}
          className={cn("text-gray-500 transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+8px)] z-50 w-60 overflow-hidden rounded-2xl border border-gray-200 bg-white p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.12)]"
        >
          {/* Who is logged in */}
          <div className="border-b border-gray-100 px-3 pb-2.5 pt-2">
            <p className="truncate text-sm font-semibold text-gray-900">{user.name}</p>
            <p className="truncate text-xs text-gray-500">{user.email}</p>
          </div>

          <div className="pt-1.5">
            {/* Admins have no profile page */}
            {!isAdmin && (
              <button
                type="button"
                role="menuitem"
                onClick={openProfile}
                className={cn(itemClass, "text-gray-700 hover:bg-gray-100")}
              >
                <UserCircle size={18} />
                Profile
              </button>
            )}

            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              className={cn(itemClass, "text-red-600 hover:bg-red-50")}
            >
              <Logout size={18} />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
