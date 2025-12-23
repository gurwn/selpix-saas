import { AutomationStatusSummary } from "../components/AutomationStatusSummary";
import { DemoMarketRecommendations } from "../components/DemoMarketRecommendations";
import { SourcingStatus } from "../components/SourcingStatus";
import { AIAnalysisStatus } from "../components/AIAnalysisStatus";
import { RegistrationPipeline } from "../components/RegistrationPipeline";
import { ControlPanel } from "../components/ControlPanel";
import { RiskAlerts } from "../components/RiskAlerts";
import { PerformanceSummary } from "../components/PerformanceSummary";

export type WidgetSize = "small" | "medium" | "large";

export type WidgetType = {
    id: string;
    title: string;
    component: React.ComponentType<any>;
    supportedSizes: WidgetSize[];
    defaultSize: WidgetSize;
    layouts: Record<WidgetSize, { w: number; h: number }>;
    minW: number;
    minH: number;
};

export const WIDGETS: Record<string, WidgetType> = {
    "automation-status": {
        id: "automation-status",
        title: "자동화 상태 요약",
        component: AutomationStatusSummary,
        supportedSizes: ["small", "medium"],
        defaultSize: "medium",
        layouts: {
            small: { w: 6, h: 2 },
            medium: { w: 12, h: 2 },
            large: { w: 12, h: 4 }, // Fallback if needed
        },
        minW: 3,
        minH: 2,
    },
    "demo-market": {
        id: "demo-market",
        title: "데모마켓 추천",
        component: DemoMarketRecommendations,
        supportedSizes: ["medium", "large"],
        defaultSize: "medium",
        layouts: {
            small: { w: 2, h: 2 },
            medium: { w: 4, h: 4 },
            large: { w: 6, h: 6 },
        },
        minW: 2,
        minH: 2,
    },
    "sourcing-status": {
        id: "sourcing-status",
        title: "수집 채널",
        component: SourcingStatus,
        supportedSizes: ["small", "medium"],
        defaultSize: "medium",
        layouts: {
            small: { w: 2, h: 2 },
            medium: { w: 4, h: 2 },
            large: { w: 4, h: 4 },
        },
        minW: 2,
        minH: 2,
    },
    "ai-status": {
        id: "ai-status",
        title: "AI 분석 현황",
        component: AIAnalysisStatus,
        supportedSizes: ["small", "medium"],
        defaultSize: "medium",
        layouts: {
            small: { w: 2, h: 2 },
            medium: { w: 4, h: 2 },
            large: { w: 4, h: 4 },
        },
        minW: 2,
        minH: 2,
    },
    "registration-pipeline": {
        id: "registration-pipeline",
        title: "등록 파이프라인",
        component: RegistrationPipeline,
        supportedSizes: ["medium", "large"],
        defaultSize: "medium",
        layouts: {
            small: { w: 4, h: 2 },
            medium: { w: 8, h: 2 },
            large: { w: 12, h: 2 },
        },
        minW: 4,
        minH: 2,
    },
    "control-panel": {
        id: "control-panel",
        title: "제어 패널",
        component: ControlPanel,
        supportedSizes: ["small", "medium"],
        defaultSize: "medium",
        layouts: {
            small: { w: 2, h: 4 },
            medium: { w: 4, h: 4 },
            large: { w: 6, h: 4 },
        },
        minW: 2,
        minH: 4,
    },
    "risk-alerts": {
        id: "risk-alerts",
        title: "리스크 및 알림",
        component: RiskAlerts,
        supportedSizes: ["small", "medium"],
        defaultSize: "medium",
        layouts: {
            small: { w: 4, h: 2 },
            medium: { w: 4, h: 4 },
            large: { w: 4, h: 6 },
        },
        minW: 3,
        minH: 2,
    },
    "performance-summary": {
        id: "performance-summary",
        title: "성과 요약",
        component: PerformanceSummary,
        supportedSizes: ["small", "medium"],
        defaultSize: "medium",
        layouts: {
            small: { w: 2, h: 2 },
            medium: { w: 4, h: 2 },
            large: { w: 4, h: 4 },
        },
        minW: 2,
        minH: 2,
    },
};

export const DEFAULT_LAYOUT = Object.values(WIDGETS).map((w, i) => {
    // Basic auto-layout logic for default: just stacking or simplified grid
    // For T-013 Extension, we just use the 'defaultSize' layout
    const layout = w.layouts[w.defaultSize];
    return {
        i: w.id,
        w: layout.w,
        h: layout.h,
        x: (i * 4) % 12, // Simple distribution
        y: Infinity, // Let RGL handle stacking
    };
});
