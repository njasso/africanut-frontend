import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, Home, Store, Users, Wallet, LineChart, LogIn, LogOut, BookOpen, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function NavItem({ to, icon, children, onClick }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        "px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-2 " +
        (isActive ? "bg-brand-brown text-white" : "hover:bg-neutral-100")
      }
      onClick={onClick}
    >
      {icon}{children}
    </NavLink>
  );
}

function SubMenuItem({ to, children, onClick }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        "block px-3 py-2 rounded-xl text-sm hover:bg-neutral-100 " +
        (isActive ? "bg-brand-brown text-white" : "")
      }
      onClick={onClick}
    >
      {children}
    </NavLink>
  );
}

function LoginNavItem({ to, icon, children }) {
  return (
    <Link
      to={to}
      className="px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-neutral-100"
    >
      {icon}{children}
    </Link>
  );
}

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [openResources, setOpenResources] = useState(false);
  const [openResourcesMobile, setOpenResourcesMobile] = useState(false);
  const resourcesMenuRef = useRef(null);

  const toggleMenu = () => setIsOpen(!isOpen);
  const toggleResources = () => setOpenResources(!openResources);
  const toggleResourcesMobile = () => setOpenResourcesMobile(!openResourcesMobile);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (resourcesMenuRef.current && !resourcesMenuRef.current.contains(event.target)) {
        setOpenResources(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [resourcesMenuRef]);

  // Définissez les éléments de navigation avec leurs rôles
  const navItems = [
    { to: '/', label: 'Accueil', icon: <Home size={18} />, roles: ['ANY'] },
    { to: '/entreprises', label: 'Entreprises', icon: <Store size={18} />, roles: ['ANY'] },
    // Lien public pour la boutique, accessible à tous
    { to: '/entreprises/africanut-industry/boutique', label: 'Boutique', icon: <Store size={18} />, roles: ['ANY'] },
    { to: '/personnel', label: 'Personnel', icon: <Users size={18} />, roles: ['ADMIN', 'MANAGER'] },
    { to: '/comptabilite', label: 'Comptabilité', icon: <Wallet size={18} />, roles: ['ADMIN', 'MANAGER'] },
    { to: '/tableau-de-bord', label: 'Tableau de bord', icon: <LineChart size={18} />, roles: ['ADMIN', 'MANAGER'] },
    // Lien privé pour la gestion, visible uniquement pour les admins
    { to: '/dashboard/gestion-produits/africanut-industry', label: 'Gestion boutique', icon: <Store size={18} />, roles: ['ADMIN', 'MANAGER'] },
    { to: '/ressources', label: 'Ressources', icon: <BookOpen size={18} />, roles: ['ANY'], hasSubMenu: true },
    { to: '/apropos', label: 'À propos', icon: <Info size={18} />, roles: ['ANY'] },
    { to: '/contacts', label: 'Contacts', icon: <Info size={18} />, roles: ['ANY'] },
  ];

  const renderNavItems = (isMobile = false) => {
    const isLogged = !!user;
    const userRole = user?.role;

    return (
      <>
        {navItems.map((item, index) => {
          const isAllowed = item.roles.includes('ANY') || (isLogged && item.roles.includes(userRole));
          if (!isAllowed) {
            return null;
          }

          if (item.hasSubMenu) {
            if (isMobile) {
              return (
                <div key={index} className="flex flex-col">
                  <button
                    onClick={toggleResourcesMobile}
                    className="px-3 py-2 rounded-xl text-sm font-medium flex items-center justify-between gap-2 hover:bg-neutral-100"
                  >
                    <span className="flex items-center gap-2">{item.icon}{item.label}</span>
                    {openResourcesMobile ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {openResourcesMobile && (
                    <div className="flex flex-col pl-4 mt-1">
                      <SubMenuItem to="/ressources/webinaire" onClick={toggleMenu}>Webinaire</SubMenuItem>
                      <SubMenuItem to="/ressources/articles" onClick={toggleMenu}>Articles</SubMenuItem>
                      <SubMenuItem to="/ressources/livre-blanc" onClick={toggleMenu}>Livre blanc</SubMenuItem>
                      <SubMenuItem to="/ressources/brochures" onClick={toggleMenu}>Brochures</SubMenuItem>
                      <SubMenuItem to="/ressources/communiques" onClick={toggleMenu}>Communiqués de presse</SubMenuItem>
                      <SubMenuItem to="/ressources/mediatheque" onClick={toggleMenu}>Médiathèque</SubMenuItem>
                      <SubMenuItem to="/ressources/apps" onClick={toggleMenu}>Apps</SubMenuItem>
                      <SubMenuItem to="/ressources/info-kits" onClick={toggleMenu}>Info Kits</SubMenuItem>
                    </div>
                  )}
                </div>
              );
            } else {
              return (
                <div key={index} className="relative" ref={resourcesMenuRef}>
                  <button
                    onClick={toggleResources}
                    className="px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-neutral-100"
                  >
                    {item.icon}{item.label}
                  </button>
                  {openResources && (
                    <div className="absolute mt-1 bg-white border rounded-lg shadow-lg flex flex-col min-w-[180px] z-50">
                      <SubMenuItem to="/ressources/webinaire">Webinaire</SubMenuItem>
                      <SubMenuItem to="/ressources/articles">Articles</SubMenuItem>
                      <SubMenuItem to="/ressources/livre-blanc">Livre blanc</SubMenuItem>
                      <SubMenuItem to="/ressources/brochures">Brochures</SubMenuItem>
                      <SubMenuItem to="/ressources/communiques">Communiqués de presse</SubMenuItem>
                      <SubMenuItem to="/ressources/mediatheque">Médiathèque</SubMenuItem>
                      <SubMenuItem to="/ressources/apps">Apps</SubMenuItem>
                      <SubMenuItem to="/ressources/info-kits">Info Kits</SubMenuItem>
                    </div>
                  )}
                </div>
              );
            }
          }

          return <NavItem key={index} to={item.to} icon={item.icon}>{item.label}</NavItem>;
        })}

        {isLogged ? (
          <button
            onClick={handleLogout}
            className="px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-neutral-100"
          >
            <LogOut size={18} /> Déconnexion
          </button>
        ) : (
          <LoginNavItem to="/login" icon={<LogIn size={18} />}>Connexion</LoginNavItem>
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen w-full flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b w-full">
        <div className="px-4 py-3 flex items-center gap-4">
          <img src="/logo.jpg" alt="Logo" className="w-10 h-10 rounded-full shadow" />
          <div className="flex-1">
            <Link to="/" className="font-bold text-xl tracking-wide">AFRICANUT INDUSTRY GROUP</Link>
            <div className="text-xs text-neutral-500">Administration & Gestion</div>
          </div>
          <nav className="hidden md:flex gap-4">{renderNavItems(false)}</nav>
          <button className="md:hidden p-2 rounded-xl border hover:bg-neutral-50" onClick={toggleMenu}>
            {isOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
        {isOpen && (
          <nav className="md:hidden bg-white border-t flex flex-col p-2 gap-2">
            {renderNavItems(true)}
          </nav>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1 w-full p-4">{children}</main>

      {/* Footer */}
      <footer className="border-t bg-white/50 w-full">
        <div className="px-4 py-6 text-sm text-neutral-600 flex flex-wrap items-center justify-between gap-2">
          <span>© {new Date().getFullYear()} AFRICANUT INDUSTRY GROUP</span>
          <a className="hover:underline" href="#">Politique & Mentions légales</a>
        </div>
      </footer>
    </div>
  );
}
