import type { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useAuthModal } from "../context/AuthModalContext";
import { AuthModal } from "./AuthModal";

function navLinkClass({ isActive }: { isActive: boolean }) {
  return isActive ? "active-link" : undefined;
}

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const { openLogin, openRegister } = useAuthModal();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/book");
  }

  return (
    <div className="layout">
      <header className="nav">
        <NavLink to="/book" className="brand">
          Booking System
        </NavLink>
        <nav>
          <NavLink to="/book" className={navLinkClass}>
            Book
          </NavLink>
          {user ? (
            <>
              <NavLink to="/my-bookings" className={navLinkClass}>
                My Bookings
              </NavLink>
              {user.role === "ADMIN" && (
                <NavLink to="/admin/bookings" className={navLinkClass}>
                  Admin
                </NavLink>
              )}
              <span className="user-email">{user.email}</span>
              <button type="button" onClick={handleLogout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={() => openLogin()}>
                Log in
              </button>
              <button type="button" className="btn-primary" onClick={() => openRegister()}>
                Register
              </button>
            </>
          )}
        </nav>
      </header>
      <main>{children}</main>
      <AuthModal />
    </div>
  );
}
