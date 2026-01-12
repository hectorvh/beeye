import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { TopBar } from "./TopBar";
import { MobileNav } from "./MobileNav";
import { MobileHeader } from "./MobileHeader";

export function AppLayout() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Desktop sidebar - hidden on mobile */}
      <div className="hidden md:block">
        <AppSidebar />
      </div>
      
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Desktop topbar - hidden on mobile */}
        <div className="hidden md:block">
          <TopBar />
        </div>
        
        {/* Mobile header - visible only on mobile */}
        <MobileHeader />
        
        <main className="flex-1 overflow-auto pb-20 md:pb-0">
          <Outlet />
        </main>
        
        {/* Mobile bottom nav - visible only on mobile */}
        <MobileNav />
      </div>
    </div>
  );
}
