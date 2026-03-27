import { NavLink } from 'react-router-dom';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { 
    path: '/', 
    label: 'Home', 
    icon: 'home',
  },
  { 
    path: '/vaults', 
    label: 'Bóveda', 
    icon: 'lock_person',
  },
  { 
    path: '/send', 
    label: 'Enviar', 
    icon: 'send',
  },
  { 
    path: '/profile', 
    label: 'Perfil', 
    icon: 'person',
  },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 w-full z-50 rounded-t-[24px] glass border-t border-outline-variant/15 shadow-[0_-4px_40px_rgba(0,0,0,0.5)]">
      <div className="flex justify-around items-center pt-3 pb-8 px-4 w-full">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex flex-col items-center justify-center text-[10px] font-bold uppercase tracking-widest transition-all duration-300 ease-out
              ${isActive 
                ? 'text-primary scale-110' 
                : 'text-[#494847] opacity-60 hover:text-secondary hover:opacity-100'
              }
            `}
          >
            {({ isActive }) => (
              <>
                <span 
                  className="material-symbols-outlined mb-1 text-xl"
                  style={{ fontVariationSettings: isActive ? 'FILL 1' : 'FILL 0' }}
                >
                  {item.icon}
                </span>
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}