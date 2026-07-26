import { NavLink, Outlet } from "react-router-dom";

function tabClass({ isActive }: { isActive: boolean }) {
  return isActive ? "admin-tab active-link" : "admin-tab";
}

export function AdminLayout() {
  return (
    <div className="admin-layout">
      <h1>Admin</h1>
      <nav className="admin-tabs">
        <NavLink to="/admin/bookings" className={tabClass}>
          Bookings
        </NavLink>
        <NavLink to="/admin/staff" className={tabClass}>
          Staff
        </NavLink>
        <NavLink to="/admin/services" className={tabClass}>
          Services
        </NavLink>
      </nav>
      <Outlet />
    </div>
  );
}
