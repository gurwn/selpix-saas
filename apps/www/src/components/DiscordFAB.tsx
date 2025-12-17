"use client";

import { SiDiscord } from "@icons-pack/react-simple-icons";
import { DISCORD_LINK } from "@/constants/links";

export const DiscordFAB = () => {
  return (
    <div className="fixed z-50 bottom-6 right-6">
      <a
        href={DISCORD_LINK}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center text-white transition-all duration-200 bg-gray-900 rounded-full shadow-lg w-14 h-14 hover:bg-gray-800 hover:scale-105 hover:shadow-xl"
        aria-label="디스코드 커뮤니티 참여하기"
      >
        <SiDiscord className="w-6 h-6" />
      </a>
    </div>
  );
};
