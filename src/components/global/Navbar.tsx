import { useNavigate } from "react-router";
import { NotificationDropdown } from "./Notification/NotificationDropdown";
import { useAppSelector } from "@/redux/hooks";
import { selectAccountUser } from "@/redux/account/accountSlice";
import { selectIsAdmin } from "@/redux/auth/authSlice";

export function Navbar() {
  const navigate = useNavigate();
  const user = useAppSelector(selectAccountUser);
  const isAdmin = useAppSelector(selectIsAdmin);

  return (
    <header className="h-[60px] border-b border-gray-200 bg-white">
      <div className="flex h-full items-center justify-between px-6">

        {/* Logo */}
        <div className="flex items-center gap-4">
          <div className="relative flex h-10 w-10 items-center justify-center">
            <span className="font-serif text-4xl leading-none text-black">
              T
            </span>

            <span className="absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-primary" />

            <span className="absolute bottom-1 left-1/2 h-0.5 w-5 -translate-x-1/2 bg-primary" />
          </div>

          <span className="text-2xl font-bold tracking-tight">
            Taverna
          </span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-5">

          {/* Notification */}
          {/* <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 text-gray-700 transition hover:bg-gray-100"
          >
            <Bell size={20} strokeWidth={2} />
          </button> */}
          <NotificationDropdown/>

          {/* User; admins have no account page */}
          <button
            type="button"
            onClick={() => navigate(isAdmin ? "/admin" : "/dashboard/account")}
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-800">
              {user.name.charAt(0).toUpperCase()}
            </div>

            <span className="text-sm font-semibold text-gray-800">
              {user.name}
            </span>

            {isAdmin && (
              <span className="rounded-md bg-gray-900 px-2 py-0.5 text-[10px] font-semibold uppercase text-white">
                Admin
              </span>
            )}
          </button>

        </div>
      </div>
    </header>
  );
}