import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Channel, getChannel, DEFAULT_CHANNEL } from "@/lib/channels/registry";

const STORAGE_KEY = "selpix:channel";

export function useChannel() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // URL query param takes precedence
    const channelParam = searchParams.get("channel");

    // Local state for immediate UI feedback
    const [currentChannelId, setCurrentChannelId] = useState<string>(
        channelParam || DEFAULT_CHANNEL.id
    );

    // Sync with LocalStorage on mount if URL param is missing
    useEffect(() => {
        if (!channelParam) {
            const storedChannel = localStorage.getItem(STORAGE_KEY);
            if (storedChannel && storedChannel !== currentChannelId) {
                setChannel(storedChannel);
            }
        } else {
            // If URL has param, save it to storage
            localStorage.setItem(STORAGE_KEY, channelParam);
            if (channelParam !== currentChannelId) {
                setCurrentChannelId(channelParam);
            }
        }
    }, [channelParam]);

    const setChannel = useCallback(
        (channelId: string) => {
            // 1. Update Local State
            setCurrentChannelId(channelId);

            // 2. Update Local Storage
            localStorage.setItem(STORAGE_KEY, channelId);

            // 3. Update URL Structure
            // We want to persist other query params if necessary, but purely for channel switching
            // we usually just replace/merge the channel param.
            const params = new URLSearchParams(searchParams.toString());
            params.set("channel", channelId);

            router.replace(`${pathname}?${params.toString()}`);
        },
        [pathname, router, searchParams]
    );

    const currentChannel: Channel = getChannel(currentChannelId);

    return {
        channel: currentChannel,
        setChannel,
        isLoaded: true, // simplified
    };
}
