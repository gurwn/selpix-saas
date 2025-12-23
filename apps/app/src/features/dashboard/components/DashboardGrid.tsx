"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Responsive, WidthProvider } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { WIDGETS, DEFAULT_LAYOUT, WidgetSize } from "../lib/widget-registry";
import { Button } from "@myapp/ui/components/button";
import { Edit2, Save, Plus, X, RotateCcw, Monitor, GripHorizontal } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@myapp/ui/components/dropdown-menu";
import { cn } from "@myapp/ui/lib/utils";

const ResponsiveGridLayout = WidthProvider(Responsive);
// ... (rest of imports)

// Local Storage Keys
const STORAGE_KEY_LAYOUT = "dashboard-layout-v1";
const STORAGE_KEY_HIDDEN = "dashboard-hidden-widgets-v1";
const STORAGE_KEY_SIZES = "dashboard-widget-sizes-v1";

export function DashboardGrid() {
    const [isMounted, setIsMounted] = useState(false);
    const [layouts, setLayouts] = useState<{ lg: any[] }>({ lg: DEFAULT_LAYOUT });
    const [hiddenWidgets, setHiddenWidgets] = useState<string[]>([]);
    const [widgetSizes, setWidgetSizes] = useState<Record<string, WidgetSize>>({});
    const [isEditMode, setIsEditMode] = useState(false);
    const [resetKey, setResetKey] = useState(0); // To force re-mount on reset

    // 1. Load from localStorage
    useEffect(() => {
        setIsMounted(true);
        const savedLayout = localStorage.getItem(STORAGE_KEY_LAYOUT);
        const savedHidden = localStorage.getItem(STORAGE_KEY_HIDDEN);
        const savedSizes = localStorage.getItem(STORAGE_KEY_SIZES);

        if (savedLayout) {
            try {
                setLayouts(JSON.parse(savedLayout));
            } catch (e) {
                console.error("Failed to parse saved layout", e);
                // Fallback to default if parsing fails
                setLayouts({ lg: DEFAULT_LAYOUT });
            }
        }
        if (savedHidden) {
            try {
                setHiddenWidgets(JSON.parse(savedHidden));
            } catch (e) {
                console.error("Failed to parse hidden widgets", e);
                setHiddenWidgets([]);
            }
        }

        // Initialize sizes: merge saved with defaults
        const initialSizes: Record<string, WidgetSize> = {};
        Object.values(WIDGETS).forEach(w => {
            initialSizes[w.id] = w.defaultSize;
        });
        if (savedSizes) {
            try {
                Object.assign(initialSizes, JSON.parse(savedSizes));
            } catch (e) {
                console.error("Failed to parse widget sizes", e);
            }
        }
        setWidgetSizes(initialSizes);

    }, [resetKey]);

    // 2. Save logic
    const saveLayout = useCallback(() => {
        localStorage.setItem(STORAGE_KEY_LAYOUT, JSON.stringify(layouts));
        localStorage.setItem(STORAGE_KEY_HIDDEN, JSON.stringify(hiddenWidgets));
        localStorage.setItem(STORAGE_KEY_SIZES, JSON.stringify(widgetSizes));
        setIsEditMode(false);
    }, [layouts, hiddenWidgets, widgetSizes]);

    const resetDashboard = () => {
        if (confirm("대시보드를 초기화하시겠습니까? 모든 위젯 위치, 크기 및 숨김 상태가 기본값으로 돌아갑니다.")) {
            localStorage.removeItem(STORAGE_KEY_LAYOUT);
            localStorage.removeItem(STORAGE_KEY_HIDDEN);
            localStorage.removeItem(STORAGE_KEY_SIZES);
            setLayouts({ lg: DEFAULT_LAYOUT });
            setHiddenWidgets([]);
            setWidgetSizes({}); // Reset widget sizes to default on next load
            setResetKey(prev => prev + 1); // Force re-mount
        }
    };

    const handleLayoutChange = useCallback((layout: any[], allLayouts: any) => {
        // Only update if in edit mode, otherwise RGL might trigger on initial load
        if (isEditMode) {
            setLayouts(allLayouts);
        }
    }, [isEditMode]);

    const removeWidget = useCallback((id: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent drag start
        setHiddenWidgets((prev) => [...prev, id]);
        // Also remove from current layout to prevent it from rendering
        setLayouts(prev => ({
            ...prev,
            lg: prev.lg.filter(l => l.i !== id)
        }));
    }, []);

    const addWidget = useCallback((id: string) => {
        setHiddenWidgets(prev => prev.filter((w) => w !== id));

        // Restore dimensions based on current (or default) size
        const wDef = WIDGETS[id];
        if (!wDef) return;

        const currentSize = widgetSizes[id] || wDef.defaultSize;
        const layoutDims = wDef.layouts[currentSize];

        setLayouts((prev) => {
            const currentLg = prev.lg || [];
            const exists = currentLg.find((l) => l.i === id);

            if (exists) {
                return {
                    ...prev,
                    lg: currentLg.map(l => l.i === id ? {
                        ...l,
                        w: layoutDims.w,
                        h: layoutDims.h,
                        minW: wDef.minW,
                        minH: wDef.minH,
                        y: Infinity // Place at bottom
                    } : l)
                };
            } else {
                return {
                    ...prev,
                    lg: [...currentLg, { i: id, ...layoutDims, y: Infinity, minW: wDef.minW, minH: wDef.minH }]
                };
            }
        });
    }, [widgetSizes]);

    const changeWidgetSize = useCallback((id: string, newSize: WidgetSize) => {
        const wDef = WIDGETS[id];
        if (!wDef) return;

        const newDims = wDef.layouts[newSize];

        // 1. Update Size State
        setWidgetSizes(prev => ({ ...prev, [id]: newSize }));

        // 2. Update Layout Dimensions
        setLayouts((prev) => {
            const currentLg = prev.lg || [];
            return {
                ...prev,
                lg: currentLg.map(l => l.i === id ? {
                    ...l,
                    w: newDims.w,
                    h: newDims.h
                } : l)
            };
        });
    }, []);

    if (!isMounted) return <div className="p-10 text-center animate-pulse">대시보드 로딩 중...</div>;

    // Filter visible widgets based on current layouts and hiddenWidgets
    const visibleLayoutItems = layouts.lg.filter(l => !hiddenWidgets.includes(l.i));

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between bg-card p-2 rounded-lg border shadow-sm">
                <div className="flex items-center gap-2">
                    <Monitor className="h-5 w-5 text-primary" />
                    <span className="font-semibold text-sm">Operation Console</span>
                    {isEditMode && <span className="text-xs text-orange-500 font-medium animate-pulse ml-2">● 편집 모드</span>}
                </div>

                <div className="flex items-center gap-2">
                    {isEditMode ? (
                        <>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="gap-1">
                                        <Plus className="h-4 w-4" /> 위젯 추가
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    {hiddenWidgets.length > 0 ? (
                                        hiddenWidgets.map(id => (
                                            <DropdownMenuItem key={id} onClick={() => addWidget(id)}>
                                                {WIDGETS[id]?.title || id}
                                            </DropdownMenuItem>
                                        ))
                                    ) : (
                                        <div className="p-2 text-xs text-muted-foreground">숨겨진 위젯이 없습니다</div>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <Button variant="ghost" size="sm" onClick={resetDashboard} className="text-muted-foreground hover:text-destructive">
                                <RotateCcw className="h-4 w-4" />
                            </Button>

                            <Button onClick={saveLayout} size="sm" className="gap-1 bg-green-600 hover:bg-green-700 text-white">
                                <Save className="h-4 w-4" /> 저장 완료
                            </Button>
                        </>
                    ) : (
                        <Button onClick={() => setIsEditMode(true)} variant="outline" size="sm" className="gap-1">
                            <Edit2 className="h-4 w-4" /> 화면 편집
                        </Button>
                    )}
                </div>
            </div>

            {/* Grid Area */}
            <div className={cn("min-h-[600px] transition-colors rounded-xl", isEditMode && "bg-muted/30 border-2 border-dashed border-primary/20")}>
                {/* 
                   KEY FIX: key={resetKey} ensures a full re-mount when resetting.
                   This clears internal RGL state that might be stuck.
                */}
                <ResponsiveGridLayout
                    key={resetKey}
                    className="layout"
                    layouts={layouts}
                    breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                    cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
                    rowHeight={60}
                    isDraggable={isEditMode}
                    isResizable={isEditMode}
                    onLayoutChange={handleLayoutChange}
                    margin={[16, 16]}
                    draggableHandle=".grid-drag-handle"
                >
                    {visibleLayoutItems.map((l) => {
                        const widget = WIDGETS[l.i];
                        if (!widget) return null;
                        const Component = widget.component;
                        const size = widgetSizes[l.i] || widget.defaultSize;

                        return (
                            <div key={l.i} className={cn("relative group rounded-xl transition-all duration-200", isEditMode && "ring-2 ring-primary/20 ring-offset-2 bg-background/50 backdrop-blur-sm")}>
                                {/* Edit Mode Controls */}
                                {isEditMode && (
                                    <>
                                        {/* Drag Handle Overlay */}
                                        <div className="grid-drag-handle absolute inset-0 z-10 cursor-move bg-white/10 dark:bg-black/10 rounded-xl" />

                                        <div className="absolute -top-3 -right-3 z-50 flex items-center gap-1">
                                            {/* Size Controls */}
                                            {widget.supportedSizes && widget.supportedSizes.length > 1 && (
                                                <div className="flex bg-white dark:bg-zinc-800 rounded-md border shadow-sm p-0.5 scale-90 origin-right">
                                                    {widget.supportedSizes.map(s => (
                                                        <button
                                                            key={s}
                                                            onClick={() => changeWidgetSize(l.i, s)}
                                                            className={cn(
                                                                "px-2 py-0.5 text-[10px] uppercase font-bold rounded-sm transition-colors",
                                                                size === s
                                                                    ? "bg-primary text-primary-foreground"
                                                                    : "text-muted-foreground hover:bg-muted"
                                                            )}
                                                        >
                                                            {s.charAt(0)}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                            {/* Remove Button */}
                                            <button
                                                onClick={(e) => removeWidget(l.i, e)}
                                                className="bg-red-500 text-white p-1 rounded-full shadow-md hover:bg-red-600 transition-transform hover:scale-110"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>

                                        {/* Shake Animation */}
                                        <div className="absolute inset-0 pointer-events-none animate-jiggle" />
                                    </>
                                )}

                                {/* Widget Content - Passing Size Prop */}
                                <div className="h-full w-full overflow-hidden rounded-xl">
                                    <Component size={size} />
                                </div>
                            </div>
                        );
                    })}
                </ResponsiveGridLayout>
            </div>
        </div>
    );
}
