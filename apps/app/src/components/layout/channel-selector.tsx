"use client";

import { useChannel } from "@/hooks/use-channel";
import { getAllChannels } from "@/lib/channels/registry";
import { cn } from "@myapp/ui/lib/utils";

export function ChannelSelector({ className }: { className?: string }) {
    const { channel, setChannel } = useChannel();
    const channels = getAllChannels();

    return (
        <div
            className={cn(
                "inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground",
                className
            )}
            role="tablist"
            aria-label="Sourcing Channels"
        >
            {channels.map((ch) => {
                const isSelected = channel.id === ch.id;
                return (
                    <button
                        key={ch.id}
                        onClick={() => setChannel(ch.id)}
                        role="tab"
                        aria-selected={isSelected}
                        className={cn(
                            "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 gap-2",
                            isSelected
                                ? "bg-background text-foreground shadow-sm"
                                : "hover:bg-background/50 hover:text-foreground"
                        )}
                    >
                        {ch.icon}
                        {ch.label}
                    </button>
                );
            })}
        </div>
    );
}
