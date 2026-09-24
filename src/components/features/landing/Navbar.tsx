import { siteConfig } from "@/config/site.config";
import { Container } from "@/components/ui/Container";
import { useNavigate } from "react-router";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { selectSession, setAuthMode, type AuthMode } from "@/redux/auth/authSlice";
import { openAuthModal } from "@/redux/modals/homeModal/homeModalSlice";

export function Navbar() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const session = useAppSelector(selectSession);

  const openAuth = (mode: AuthMode) => {
    dispatch(setAuthMode(mode));
    dispatch(openAuthModal());
  };

  return (
    <nav className="border-b border-border bg-white">
      <Container>
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <a href="/" className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center text-lg font-bold">
              <span className="text-primary">T</span>
            </div>

            <span className="text-lg font-bold">{siteConfig.name}</span>
          </a>

          {/* Navigation */}
          <div className="hidden items-center gap-8 md:flex">
            {siteConfig.navigation.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-gray-500 transition hover:text-gray-900"
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-5">
            {session ? (
              <button
                onClick={() => navigate(session.user.role === "admin" ? "/admin" : "/dashboard")}
                className="rounded-button cursor-pointer bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
              >
                Go to Dashboard
              </button>
            ) : (
              <>
                <button onClick={() => openAuth("login")} className="text-sm font-semibold cursor-pointer">
                  Log in
                </button>

                <button
                  onClick={() => openAuth("signup")}
                  className="rounded-button cursor-pointer bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </Container>
    </nav>
  );
}
