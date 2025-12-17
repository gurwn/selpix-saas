"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Play } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@myapp/ui/components/dialog";

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TutorialModal({ isOpen, onClose }: TutorialModalProps) {
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  // YouTube 영상 ID (템플릿용 플레이스홀더)
  const videoId = "VIDEO_ID_PLACEHOLDER";
  const embedUrl = videoId
    ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`
    : "";

  useEffect(() => {
    if (isOpen) {
      setIsVideoLoaded(true);
    } else {
      // 모달이 닫힐 때 비디오 로드 상태 리셋
      setIsVideoLoaded(false);
    }
  }, [isOpen]);

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: 20 },
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-w-[95vw] p-0 bg-white border-0 shadow-2xl overflow-hidden">
        <motion.div
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="relative"
        >
          {/* Header */}
          <DialogHeader className="flex-shrink-0 px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-semibold text-gray-900">
                제품 튜토리얼
              </DialogTitle>
            </div>
          </DialogHeader>

          {/* Video Container */}
          <div className="relative bg-black">
            <div className="relative w-full aspect-video">
              {isVideoLoaded && embedUrl ? (
                <iframe
                  src={embedUrl}
                  title="Product Tutorial"
                  className="absolute inset-0 w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                  <div className="text-center">
                    <Play className="w-16 h-16 mx-auto mb-4 text-white opacity-80" />
                    <p className="text-lg text-white">
                      튜토리얼 영상이 준비 중입니다
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                제품 사용법을 단계별로 알아보세요
              </p>
            </div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
