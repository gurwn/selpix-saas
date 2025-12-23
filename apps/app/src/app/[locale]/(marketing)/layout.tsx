export default function MarketingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex-1 flex flex-col min-h-screen">
            {children}
        </div>
    );
}
