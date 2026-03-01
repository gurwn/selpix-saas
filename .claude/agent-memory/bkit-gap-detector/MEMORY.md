# Gap Detector Memory -- OpenClaw / Selpix SaaS

## Project Context
- Pipeline: domeggook sourcing -> register_queue -> coupang registration
- Key files: coupang_api.js (shared API module), cron_register_product.js (registration cron), pipeline_sourcing.js (sourcing), image_utils.js (image validation)
- Queue file: data/register_queue.json (can be very large)

## Analysis History

### 2026-02-20: OpenClaw v2 Phase 1 Analysis
- **Overall Match Rate**: 91% (PASS)
- T-1A (attribute lookup): 95% -- defaults file structure simpler than designed (flat vs nested), file path differs (data/ vs lib/)
- T-1B (price rounding): 100% -- exact match
- T-1C (option dedup): 100% -- exact match
- T-2 (temp-saved): 70% -- strategy changed from updateProduct to deleteProduct+re-queue, missing 24h time gate
- T-3 (image defense): 90% -- missing Content-Length < 1024 check in checkImageReachable()
- Report: /home/dev/docs/03-analysis/openclaw-v2.analysis.md

### 2026-02-20: OpenClaw v2 Phase 2 Analysis
- **Overall Match Rate**: 93% (PASS)
- T-4 (twitter keyword pipeline): 95% -- category filter removed, stop words expanded, filterProductizable with cache all match
- T-5 (naver shopping categories): 90% -- 5 categories implemented vs 9 designed, output is category-level not keyword-level Top 10
- T-6 (keyword scoring v2): 100% -- formula exact match (demand*0.25+niche*0.20+cross*0.15+productizable*0.25+seasonal*15)*age_decay
- T-7 (sourcing yield): 85% -- PRODUCTS_PER_KEYWORD=5 matches, MOQ/image filters in pipeline loop instead of searchViaApi()
- Report: /home/dev/docs/03-analysis/openclaw-v2-phase2.analysis.md
- Combined Phase 1+2: 92% overall PASS

### 2026-02-20: OpenClaw v2 Phase 3 Analysis
- **Overall Match Rate**: 93% (PASS)
- T-8 (category fee rates): 95% -- fee table has 4 extra categories, getCoupangFeeRate() exact match, categoryName at call site uses keyword not actual category
- T-9 (SEO tag enhancement): 100% -- SYNONYMS 4 designed terms match, 6 extra added; generateSearchTags() all 5 steps match; filter 2-20 chars max 15 exact
- T-10 (denial analyzer): 85% -- denial_analyzer.js module 100% match; processDenied() uses if/else on reasonText instead of switch(autoFix), missing roundPrice case
- Report: /home/dev/docs/03-analysis/openclaw-v2-phase3.analysis.md
- Combined Phase 1+2+3: 92% overall PASS

### 2026-02-20: OpenClaw v2 Phase 4 Analysis
- **Overall Match Rate**: 92% (PASS)
- T-11 (agent role redistribution): 90% -- 6/7 agentId correct; twitter-intel-daily still "main" not "trend-scout"; worker tools superset (fs_read/fs_write vs "fs", extra agent_connector/clawdbot-filesystem)
- T-12 (monitoring metrics expansion): 95% -- all 6 check functions implemented with correct thresholds; old 50% denial check retained alongside new 20%; dashboard "(재처리 대기)" label missing
- T-13 (daily metrics collector): 90% -- schema matches; output path at workspace/data/metrics/ not selpix-saas/data/; keywords_viable uses frequency proxy
- Report: /home/dev/docs/03-analysis/openclaw-v2-phase4.analysis.md
- Combined Phase 1+2+3+4: 92% overall PASS

## Key Patterns
- Implementation often exceeds design (extractRangeValue unit conversion, groupNumber dedup, processDenied)
- Strategy deviations happen when implementation discovers edge cases not foreseen in design
- File paths may shift between design and implementation (lib/ vs data/)
- Function names may be renamed but keep same semantics (getDefaultAttributeValue -> inferFallbackValue)
- Filter placement may move from inner functions to outer pipeline loops for better data accuracy (T-7 MOQ filter)
- Scoring formulas tend to match exactly when coefficients are precisely specified in design
- Category/scope reductions common when blacklists already cover excluded items (T-5 dropped fashion/food categories)
- When design specifies structured dispatch (switch/autoFix), implementation may use simpler if/else for flexibility (T-10 processDenied)
- Data tables (fee rates, synonyms) tend to grow beyond design spec -- implementation adds entries proactively
- Arguments at call sites may differ from function signature intent (T-8 keyword used as categoryName)
- Config-level changes (agentId, tool lists) may lag behind design when external systems auto-modify files (T-11 twitter-intel-daily)
- Tool naming granularity may differ from design ("fs" vs "fs_read"/"fs_write") -- functionally equivalent
- Monitoring scripts tend to add checks without removing old ones (T-12 dual denial thresholds)
- Output directory placement for cross-cutting concerns (metrics, health checks) gravitates to workspace/scripts/ not feature-specific paths
- Dynamic schema approaches (spread operator for statusCounts) produce supersets of design's explicit fields

## Gotchas
- attribute_defaults.json is at data/ not lib/ -- coupang_api.js loads via relative path '../data/'
- cron_register_product.js has buildItems() defined INSIDE registerProduct() (nested function)
- tempSavedRetry has a typo vs design's tempSaveRetry
