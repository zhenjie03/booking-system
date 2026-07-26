import type { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function navLinkClass({ isActive }: { isActive: boolean }) {
  return isActive ? "active-link" : undefined;
}

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="layout">
      <header className="nav">
        <NavLink to="/book" className="brand">
          Booking System
        </NavLink>
        <nav>
          {user ? (
            <>
              <NavLink to="/book" className={navLinkClass}>
                Book
              </NavLink>
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
              <NavLink to="/login" className={navLinkClass}>
                Log in
              </NavLink>
              <NavLink to="/register" className={navLinkClass}>
                Register
              </NavLink>
            </>
          )}
        </nav>
      </header>
      <main>{children}</main>
    </div>
  );
}
