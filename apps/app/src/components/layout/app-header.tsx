
"use client";

import { SidebarTrigger, useSidebar } from "@myapp/ui/components/sidebar";
import { Separator } from "@myapp/ui/components/separator";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@myapp/ui/components/breadcrumb";
import { UserButton } from "@/components/clerk/UserButton";
import { SignedIn } from "@/components/clerk/SignedIn";
import { usePathname } from "next/navigation";
import { Fragment } from "react";

import { ChannelSelector } from "@/components/layout/channel-selector";

export function AppHeader() {
    const { toggleSidebar } = useSidebar();
    const pathname = usePathname();

    // Simple breadcrumb logic
    const segments = pathname.split('/').filter(Boolean).filter(s => s !== 'en' && s !== 'ko'); // Remove locale if present in path segments handling logic

    return (
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem className="hidden md:block">
                            <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
                        </BreadcrumbItem>
                        {segments.map((segment, index) => (
                            <Fragment key={index}>
                                <BreadcrumbSeparator className="hidden md:block" />
                                <BreadcrumbItem>
                                    {index === segments.length - 1 ? (
                                        <BreadcrumbPage>{segment.charAt(0).toUpperCase() + segment.slice(1)}</BreadcrumbPage>
                                    ) : (
                                        <BreadcrumbLink href={`/${segments.slice(0, index + 1).join('/')}`}>
                                            {segment.charAt(0).toUpperCase() + segment.slice(1)}
                                        </BreadcrumbLink>
                                    )}
                                </BreadcrumbItem>
                            </Fragment>
                        ))}
                    </BreadcrumbList>
                </Breadcrumb>
            </div>
            <div className="ml-auto flex items-center gap-4 px-4">
                <ChannelSelector />
                <Separator orientation="vertical" className="h-4" />
                <SignedIn>
                    <UserButton afterSignOutUrl="/" />
                </SignedIn>
            </div>
        </header>
    );
}
