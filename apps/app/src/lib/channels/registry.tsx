import { ReactNode } from "react";
import { ShoppingBag, Box } from "lucide-react";

export interface Channel {
    id: string;
    label: string;
    description: string;
    icon: ReactNode;
}

export const CHANNELS: Record<string, Channel> = {
    domaggu: {
        id: "domaggu",
        label: "도매꾹",
        description: "도매꾹 상품 소싱",
        icon: <ShoppingBag className="w-4 h-4" />,
    },
    demomarket: {
        id: "demomarket",
        label: "데모마켓",
        description: "테스트용 데모 데이터",
        icon: <Box className="w-4 h-4" />,
    },
};

export const DEFAULT_CHANNEL = CHANNELS.domaggu;

export function getChannel(id: string | null): Channel {
    if (!id) return DEFAULT_CHANNEL;
    return CHANNELS[id] || DEFAULT_CHANNEL;
}

export function getAllChannels(): Channel[] {
    return Object.values(CHANNELS);
}
