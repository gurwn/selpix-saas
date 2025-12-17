
import { AppLayout } from "@/components/layout/app-layout";

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export default function Layout({ children }: DashboardLayoutProps) {
    return <AppLayout>{children}</AppLayout>;
}
