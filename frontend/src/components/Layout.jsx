import { NavLink, Outlet } from 'react-router-dom';

const navItems = [
  { path: '/', label: 'Tablero', icon: 'dashboard' },
  { path: '/riesgo', label: 'Reservas', icon: 'list_alt' },
  { path: '/mlops', label: 'MLOps', icon: 'settings_input_component' },
  { path: '/validacion', label: 'Alertas', icon: 'warning' },
];

export default function Layout() {
  return (
    <div className="min-h-screen pb-20 md:pb-0 flex flex-col bg-background text-foreground">
      {/* TopAppBar */}
      <header className="bg-surface-container-highest border-b border-border flex justify-between items-center w-full px-4 h-16 sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-primary text-2xl">analytics</span>
          <h1 className="font-bold text-primary text-xl md:text-2xl">Monitor de Riesgo Hotelero</h1>
        </div>

        {/* Desktop Nav Cluster */}
        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-lg transition-colors font-medium ${
                  isActive
                    ? 'text-primary bg-surface-variant font-bold'
                    : 'text-muted-foreground hover:bg-surface-variant'
                }`
              }
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-primary font-bold overflow-hidden border border-border">
            <img
              alt="User Profile"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuD8sMx4P1tKh8TKmEmnQo-VQVPDX9eMZqvnY21n7YJ0qlOILtRh2nlIwGfwiJoA9YUxSrvBeaOXDSzNTssiv90Znv7Yt8MPjILhrWPPQRRO5LhekTzn8ES7Ou_sDJVPDPT1Crn3gj41cwAu-eUmTpUvq5-qucNcKczoFohrbB4iTEC2Nrvx6KohNjL4ze336Jy0uQ4IOkboaG7OqKeP9_5VWxIl-r1GURRSZgA_ehVi7q5BLpfxKt8-lQ"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow p-4 md:p-10 max-w-7xl mx-auto w-full flex flex-col gap-6">
        <Outlet />
      </main>

      {/* BottomNavBar (Mobile) */}
      <nav className="fixed bottom-0 w-full z-50 rounded-t-xl border-t border-border bg-card shadow-lg md:hidden flex justify-around items-center px-4 py-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center rounded-xl px-3 py-1 transition-colors ${
                isActive
                  ? 'bg-primary/10 text-primary scale-105'
                  : 'text-muted-foreground hover:bg-secondary'
              }`
            }
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="font-mono mt-1 text-[10px]">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
