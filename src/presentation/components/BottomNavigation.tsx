import { useState } from 'react';
import { Button } from '../../shared/ui/button';
import { Home, Users, ShoppingCart, Route, Menu } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BottomNavigationActionSheet } from './BottomNavigationActionSheet';

export function BottomNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);

  const navItems = [
    {
      id: 'deliveries',
      label: 'Entregas',
      icon: Home,
      path: '/deliveries',
      preload: () => import('../pages/DeliveriesOverview')
    },
    {
      id: 'routes',
      label: 'Rotas',
      icon: Route,
      path: '/routes',
      preload: () => import('../pages/RoutesScreen')
    },
    {
      id: 'menu',
      label: 'Menu',
      icon: Menu,
      onClick: () => setIsActionSheetOpen(true)
    },
    {
      id: 'customers',
      label: 'Clientes',
      icon: Users,
      path: '/customers',
      preload: () => import('../pages/CustomerList')
    },
    {
      id: 'pdv',
      label: 'PDV',
      icon: ShoppingCart,
      path: '/pdv',
      preload: () => import('../pages/PDVStandalone')
    }
  ];

  // Helper to check if a path is active
  const isPathActive = (itemPath: string | undefined) => {
    if (!itemPath) return false;
    if (itemPath === '/deliveries' && location.pathname === '/') return true;
    return location.pathname.startsWith(itemPath);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg" style={{ borderColor: 'rgba(0, 128, 0, 0.1)' }}>
      <div className="flex items-center justify-around py-1 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = isPathActive(item.path);

          return (
            <Button
              key={item.id}
              variant="ghost"
              className={`flex flex-col items-center gap-0.5 h-16 px-2 transition-all duration-200 ${isActive
                ? 'text-red-500'
                : 'text-muted-foreground hover:text-primary/70'
                }`}
              onClick={() => { item.onClick ? item.onClick() : navigate(item.path) }}
              onMouseEnter={() => item.preload?.()}
              onTouchStart={() => item.preload?.()}
            >
              <div className={`p-2 rounded-xl transition-all duration-200 ${isActive
                ? 'bg-primary/10 scale-105'
                : 'hover:bg-primary/5'
                }`}>
                <Icon className={`w-5 h-5 transition-all duration-200 
                  ${isActive ? 'text-primary' : 'text-black'}
                `} />
              </div>
              <span className={`text-[10px] transition-all duration-200 
                ${isActive ? 'text-primary' : 'text-black '}
                `}>
                {item.label}
              </span>
            </Button>
          );
        })}
      </div>
      <BottomNavigationActionSheet
        isOpen={isActionSheetOpen}
        onOpenChange={setIsActionSheetOpen}
      />
    </div>
  );
}