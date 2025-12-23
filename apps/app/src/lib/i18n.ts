export const copy = {
    // Landing Page
    landing_hero_title: "상품 소싱부터 등록까지,\nSelpix가 1분 만에 끝냅니다.",
    landing_hero_desc: "복잡한 분석과 등록은 AI에게 맡기고,\n대표님은 '무엇을 팔지'만 결정하세요.",
    landing_cta_primary: "무료로 시작하기",
    landing_cta_secondary: "서비스 소개 더보기",

    // Dashboard
    dashboard_title: "대시보드",
    dashboard_welcome: "{name} 대표님, 오늘의 AI 업무 현황입니다.",

    // Widget: Automation Status
    widget_automation_title: "자동화 파이프라인",
    widget_automation_status_ok: "모든 시스템 정상 가동 중",
    widget_automation_collected: "수집됨",
    widget_automation_analyzed: "분석완료",
    widget_automation_registered: "등록성공",
    widget_automation_failed: "{count}건 실패 (조치 필요)",

    // Widget: Registration Pipeline
    widget_pipeline_title: "마켓 등록 현황",
    widget_pipeline_limit_usage: "일일 한도 사용량",
    widget_pipeline_registering: "등록 진행 중",
    widget_pipeline_registered: "등록 완료",
    widget_pipeline_failed: "등록 실패",

    // Widget: Demo Market
    widget_demomarket_title: "데모마켓 추천",
    widget_demomarket_desc: "지금 소싱 가능한 알짜배기 상품",
    widget_demomarket_action: "AI 분석 시작하기",

    // Common Actions
    action_start_sourcing: "지금 소싱 시작",
    action_view_analysis: "분석 결과 보기",
    action_register_coupang: "1-Click 등록",
    action_retry: "재시도",
    action_go_dashboard: "대시보드로 이동",

    // Analysis Page
    analysis_title: "AI 상품 분석",
    analysis_calculating: "AI가 최적 마진율을 계산하고 있어요...",
    analysis_result_saved: "분석 결과가 저장되었습니다.",

    analysis_section_input: "필수 입력 정보",
    analysis_label_cost: "원가 입력",
    analysis_action_save: "저장하기",

    // Demo Market
    demomarket_title: "데모 마켓",
    demomarket_desc: "지금 바로 소싱할 수 있는 상품들을 확인하세요.",
    demomarket_list_title: "추천 상품 ({count})",
    demomarket_action_analyze: "AI 분석하기",

    // Publish Page
    publish_title: "쿠팡 상품 등록",
    publish_desc: "분석된 데이터를 바탕으로 Selpix가 등록을 수행합니다.",
    publish_button: "1-Click 상품 등록하기",
    publish_success: "등록이 완료되었습니다!",
    publish_success_desc: "이제 쿠팡 판매자 센터에서 관리할 수 있습니다.",
} as const;

export type CopyKey = keyof typeof copy;

export function t(key: CopyKey, params?: Record<string, string | number>) {
    let text = copy[key];
    if (!params) return text;

    return text.replace(/\{(\w+)\}/g, (_, k) => {
        return params[k] !== undefined ? String(params[k]) : `{${k}}`;
    });
}
