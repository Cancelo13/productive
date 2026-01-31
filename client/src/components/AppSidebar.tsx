import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  CalendarDays, 
  Target, 
  BarChart2, 
  Settings, 
  Timer
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarRail
} from "@/components/ui/sidebar";

export function AppSidebar() {
  const [location] = useLocation();

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/" },
    { icon: CalendarDays, label: "Calendar", href: "/calendar" },
    { icon: Target, label: "Goals & Habits", href: "/goals" },
    { icon: BarChart2, label: "Reports", href: "/reports" },
    { icon: Settings, label: "Settings", href: "/settings" },
  ];

  return (
    <Sidebar className="border-r border-border/50 bg-card/50 backdrop-blur-sm">
      <SidebarHeader className="h-16 flex items-center px-6 border-b border-border/50">
        <div className="flex items-center gap-2 text-primary font-display font-bold text-xl">
          <span>Productivity<span className="text-foreground">Pro</span></span>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="p-4">
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton 
                asChild 
                isActive={location === item.href}
                className="w-full justify-start gap-3 px-4 py-6 text-base font-medium transition-all hover:translate-x-1"
              >
                <Link href={item.href}>
                  <item.icon className={`w-5 h-5 ${location === item.href ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-border/50">
        <div className="bg-primary/10 rounded-xl p-4 flex flex-col items-center text-center">
          <Timer className="w-8 h-8 text-primary mb-2" />
          <p className="text-xs font-medium text-foreground">Focus Mode</p>
          <p className="text-[10px] text-muted-foreground">Stay productive today!</p>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
