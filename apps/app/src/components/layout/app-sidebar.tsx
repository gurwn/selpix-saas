
"use client";

import {
    Sidebar,
    SidebarHeader,
    SidebarContent,
    SidebarFooter,
    SidebarSeparator,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarRail,
} from "@myapp/ui/components/sidebar";
import {
    Home,
    BarChart3,
    Users,
    CreditCard,
    Settings,
    HelpCircle,
    Package,
    Sparkles,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { usePathname } from "next/navigation";

export function AppSidebar() {
    const tLayout = useTranslations("DashboardLayout");
    const pathname = usePathname();

    const navItems = [
        { label: tLayout("nav.overview"), icon: Home, href: "/" },
        { label: "상품 등록 (Registration)", icon: Sparkles, href: "/registration" }, // Added manually
        { label: tLayout("nav.analytics"), icon: BarChart3, href: "/analytics" },
        { label: tLayout("nav.products"), icon: Package, href: "/products" },
        { label: tLayout("nav.customers"), icon: Users, href: "/customers" },
        { label: tLayout("nav.billing"), icon: CreditCard, href: "/subscription" },
        { label: tLayout("nav.settings"), icon: Settings, href: "/settings" },
        { label: tLayout("nav.support"), icon: HelpCircle, href: "/support" },
    ];

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader>
                <div className="px-2 py-1.5 flex items-center gap-2">
                    <div className="size-6 bg-primary rounded-md flex items-center justify-center text-primary-foreground font-bold">
                        S
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">Selpix</span>
                        <span className="truncate text-xs">Pro Plan</span>
                    </div>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>{tLayout("group.main")}</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {navItems.map((item, idx) => {
                                const isActive = pathname === item.href;
                                return (
                                    <SidebarMenuItem key={idx}>
                                        <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                                            <Link href={item.href}>
                                                <item.icon className="size-4" />
                                                <span>{item.label}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarSeparator />
            <SidebarFooter>
                <div className="p-2 text-xs text-muted-foreground text-center">
                    v1.0.0
                </div>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
