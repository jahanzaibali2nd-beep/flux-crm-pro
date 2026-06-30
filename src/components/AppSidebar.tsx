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
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-200">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2.5 px-2 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 shadow-md">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-bold tracking-tight text-sidebar-foreground">Flux CRM</span>
            <span className="text-[9px] uppercase font-bold tracking-widest text-sidebar-foreground/50">PRO EDITION</span>
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
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-sm border border-sidebar-border/10"
                          : "text-sidebar-foreground/75 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-all"
                      }
                    >
                      <Link to={item.url} className="flex items-center gap-2">
                        <item.icon className={`h-4 w-4 transition-transform ${active ? "scale-110 text-primary" : "text-sidebar-foreground/60"}`} />
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
      <SidebarFooter className="border-t border-sidebar-border p-3 bg-sidebar/50">
        <div className="flex flex-col gap-1 group-data-[collapsible=icon]:hidden mb-2">
          <span className="px-2 text-xs font-semibold text-sidebar-foreground/90 truncate">{profile?.name}</span>
          <span className="px-2 text-[9px] font-bold tracking-widest text-sidebar-foreground/40 uppercase">{role}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut()}
          className="justify-start text-sidebar-foreground/70 hover:bg-destructive/10 hover:text-destructive-foreground w-full h-8 px-2 font-medium text-xs rounded-md transition-all"
        >
          <LogOut className="h-4 w-4 mr-2" />
          <span className="group-data-[collapsible=icon]:hidden">Sign out</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}