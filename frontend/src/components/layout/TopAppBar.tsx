import { useNavigate } from 'react-router-dom';

interface TopAppBarProps {
  showBack?: boolean;
  title?: string;
  showMenu?: boolean;
  showAvatar?: boolean;
}

export function TopAppBar({ 
  showBack = false, 
  title,
  showMenu = false,
}: TopAppBarProps) {
  const navigate = useNavigate();

  // Default home header (avatar left, logo right)
  if (!showBack && !title && !showMenu) {
    return (
      <header className="fixed top-0 w-full z-50 glass border-b border-outline-variant/10">
        <div className="flex justify-between items-center px-6 py-4">
          {/* Left: Penguin Avatar */}
          <button className="w-10 h-10 rounded-full bg-surface-container-high border-2 border-primary/30 overflow-hidden flex items-center justify-center active:scale-95 transition-transform">
            <img 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuA8TtEkhRR316KhDUmq7ykO2eQWvxAEFRMBq9HKSHQAUFjk-ZHuZlNjyEHEFOJQODoviDTYEQII1GIEkrcNqznI7xrDhKIHTh_ROBIxtHot5_PcT44Az2wQIE_8Btu_VJNreakKBiHBixVJz3NYEQkPZGwD-BQgmPQVMBJjr5rXtUuT8Q-T4n2s71TdJVK7JtokRIRabpVHA3ohK09uZVkjs4LG8F1ijPz3BVYcLqt79MgMPBjZko99pt29XDodw6_B9C0DNkfECC0" 
              alt="User Avatar" 
              className="w-full h-full object-cover"
            />
          </button>
          
          {/* Right: AHORROGO Logo */}
          <h1 className="text-xl font-black text-on-background tracking-tight font-headline">
            AHORROGO
          </h1>
        </div>
      </header>
    );
  }

  // Standard header for other pages
  return (
    <header className="fixed top-0 w-full z-50 glass border-b border-outline-variant/10">
      <div className="flex justify-between items-center px-6 py-4">
        {/* Left section */}
        <div className="flex items-center gap-4">
          {showBack ? (
            <button 
              onClick={() => navigate(-1)}
              className="text-primary active:scale-95 duration-200 transition-opacity hover:opacity-80"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
          ) : showMenu ? (
            <button className="text-primary active:scale-95 duration-200 transition-opacity hover:opacity-80">
              <span className="material-symbols-outlined">menu</span>
            </button>
          ) : null}
          
          {title ? (
            <h1 className="font-headline font-extrabold tracking-tight text-xl text-on-background">
              {title}
            </h1>
          ) : (
            <h1 className="text-xl font-black text-primary tracking-tight font-headline">
              AHORROGO
            </h1>
          )}
        </div>
        
        {/* Right section */}
        <div className="flex items-center gap-4">
          <button className="text-on-surface-variant active:scale-95 duration-200 transition-opacity hover:text-primary">
            <span className="material-symbols-outlined">notifications</span>
          </button>
        </div>
      </div>
    </header>
  );
}