import { useNavigate } from 'react-router-dom';

interface TopAppBarProps {
  showBack?: boolean;
  title?: string;
  showMenu?: boolean;
  showAvatar?: boolean;
}

export function TopAppBar({
  showBack = true,
  title,
  showMenu = false,
  showAvatar = true,
}: TopAppBarProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate('/');
  };

  return (
    <header className="fixed top-0 w-full z-50 glass border-b border-outline-variant/25">
      <div className="flex justify-between items-center px-5 py-4 max-w-lg mx-auto">
        <div className="flex items-center gap-3 min-w-0">
          {showBack ? (
            <button
              onClick={handleBack}
              aria-label="Volver"
              className="w-10 h-10 rounded-xl surface-card flex items-center justify-center text-primary active:scale-95 transition"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
          ) : showMenu ? (
            <button className="w-10 h-10 rounded-xl surface-card flex items-center justify-center text-primary active:scale-95 transition">
              <span className="material-symbols-outlined">menu</span>
            </button>
          ) : null}

          <div className="min-w-0">
            <h1 className="font-headline font-extrabold tracking-tight text-lg text-on-background truncate">
              {title ?? 'AHORROGO'}
            </h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant/70">Finanzas con estilo</p>
          </div>
        </div>

        {showAvatar ? (
          <button className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-secondary/30 border border-outline-variant/30 overflow-hidden flex items-center justify-center active:scale-95 transition-transform">
            <span className="material-symbols-outlined text-on-background">pets</span>
          </button>
        ) : (
          <button className="w-10 h-10 rounded-xl surface-card flex items-center justify-center text-on-surface-variant/90 active:scale-95 transition">
            <span className="material-symbols-outlined">notifications</span>
          </button>
        )}
      </div>
    </header>
  );
}
