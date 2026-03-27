import { NavLink } from 'react-router-dom';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { path: '/', label: 'Home', icon: 'home' },
  { path: '/vaults', label: 'Bóveda', icon: 'lock_person' },
  { path: '/send', label: 'Enviar', icon: 'send' },
  { path: '/profile', label: 'Perfil', icon: 'person' },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 w-full z-50 rounded-t-[24px] glass border-t border-outline-variant/30 shadow-[0_-6px_36px_rgba(2,8,18,0.65)]">
      <div className="flex justify-around items-center pt-3 pb-8 px-4 w-full max-w-lg mx-auto">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `relative flex flex-col items-center justify-center min-w-[64px] text-[10px] font-bold uppercase tracking-[0.14em] transition-all duration-300 ease-out ${
                isActive ? 'text-primary' : 'text-on-surface-variant/70 hover:text-secondary'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`absolute -top-1 h-1 w-8 rounded-full transition-opacity ${isActive ? 'opacity-100 bg-primary' : 'opacity-0'}`}
                />
                <div
                  className={`mb-1 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                    isActive
                      ? 'bg-primary/18 border border-primary/40 shadow-[0_0_14px_rgba(87,231,192,0.3)]'
                      : 'bg-surface-container-low border border-transparent'
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-xl"
                    style={{ fontVariationSettings: isActive ? 'FILL 1' : 'FILL 0' }}
                  >
                    {item.icon}
                  </span>
                </div>
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
