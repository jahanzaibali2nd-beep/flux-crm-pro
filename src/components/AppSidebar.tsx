import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  Wrench,
  BarChart3,
  TrendingUp,
  Settings,
  LogOut,
  Sparkles,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useAuth } from "@/integrations/auth-provider";
import { Button } from "@/components/ui/button";

const allItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, roles: ["admin", "marketer"] },
  { title: "Leads", url: "/leads", icon: Users, roles: ["admin", "marketer"] },
  { title: "Techs", url: "/techs", icon: Wrench, roles: ["admin", "marketer"] },
  { title: "Reports", url: "/reports", icon: BarChart3, roles: ["admin"] },
  { title: "Analytics", url: "/analytics", icon: TrendingUp, roles: ["admin"] },
  { title: "Settings", url: "/settings", icon: Settings, roles: ["admin"] },
];

export function AppSidebar() {
  const { role, profile, signOut } = useAuth();
  const path = useRouterState({ select: (r) => r.location.pathname });
  const items = allItems.filter((i) => (role ? i.roles.includes(role) : false));

  return (
    <Sidebar collapsible="icon" className="border-r border-white/10 bg-transparent">
      <SidebarHeader className="border-b border-white/10">
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-cyan-400 shadow-lg">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold text-white">Flux</span>
            <span className="text-[10px] uppercase tracking-wider text-white/60">Marketing CRM</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = path === item.url || path.startsWith(item.url + "/");
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      className={
                        active
                          ? "bg-white/15 text-white hover:bg-white/20"
                          : "text-white/75 hover:bg-white/10 hover:text-white"
                      }
                    >
                      <Link to={item.url} className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-white/10 p-2">
        <div className="flex flex-col gap-1 group-data-[collapsible=icon]:hidden">
          <span className="px-2 text-xs text-white/80 truncate">{profile?.name}</span>
          <span className="px-2 text-[10px] text-white/50 uppercase">{role}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut()}
          className="justify-start text-white/80 hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          <span className="group-data-[collapsible=icon]:hidden">Sign out</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}