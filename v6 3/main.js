// Selpix v1.5 Frontend Application with Automation Features
function selpixApp() {
    return {
        // State
        currentStep: 'dashboard',
        isLoading: false,
        isRegistering: false,
        isAutomating: false,
        progress: 0,
        
        // Data
        productUrl: '',
        productData: null,
        marginReport: null,
        keywords: [],
        history: [],
        automationStatus: null,
        manualApprovalId: '',
        
        // Form Data
        marginParams: {
            shippingCost: 3000,
            storageFee: 0,
            commissionRate: 8.5,
            targetMarginRate: 30,
            advertisingCost: 0,
            roasTarget: 500
        },
        
        registrationData: {
            sellingPrice: 0,
            discountRate: 0,
            selectedKeywords: [],
            shippingCost: 0,
            minOrderQuantity: 1
        },
        
        // Automation Configuration
        automationConfig: {
            enabled: false,
            coupangAccessKey: '',
            coupangSecretKey: '',
            coupangVendorId: '',
            domeApiKey: '',
            domeLoginId: '',
            domePassword: '',
            processingInterval: 30, // minutes
            autoApprove: false
        },
        
        // Stats
        stats: {
            todayAnalysis: 0,
            registrationSuccess: 0,
            averageMargin: 0,
            automationJobs: 0
        },
        
        // Notification
        notification: {
            show: false,
            type: 'info',
            message: ''
        },

        // 마진계산 데이터
        marginCalc: {
            productName: '',
            unitPrice: 0,
            cost: 5000,
            commissionRate: 11,
            cpc: 100,
            conversionRate: 2,
            targetProfit: 50000,
            result: '',
            historyHtml: ''
        },

        // 광고분석 데이터
        adAnalysis: {
            statsHtml: '',
            chart: null
        },

        // 키워드분석 데이터
        keywordAnalysis: {
            products: [],
            selectedProduct: '',
            allKeywords: [],
            goodKeywords: [],
            lowKeywords: []
        },

        // 상품검사 데이터
        productInspection: {
            products: [],
            currentPage: 1,
            itemsPerPage: 20,
            sortOption: ''
        },

        // 도매검색 데이터
        wholesaleSearch: {
            keyword: '',
            minPrice: 0,
            maxPrice: 1000000,
            selectedSites: ['domeggook'],
            isSearching: false,
            searched: false,
            results: [],
            errors: [],
            searchDuration: 0,
            filterSite: 'all',
            imageFilter: 'all',
            selectedProduct: null,
            detailCache: {},
            detailLoading: null,
            detailPrefetching: false,
            favorites: [],
            showFavoritesOnly: false
        },

        // API Configuration - default to backend on port 3001 during local dev
        apiBaseUrl: (() => {
            const fallback = 'http://localhost:3001/api/v1';
            if (typeof window === 'undefined') return fallback;
            const { protocol, hostname, port } = window.location;
            if (protocol === 'file:') return fallback;
            const localHosts = new Set(['localhost', '127.0.0.1']);
            const preferredPort = '3001';
            const resolvedPort = localHosts.has(hostname)
                ? (port === '' || port === '3000' ? preferredPort : port)
                : port;
            const hostPort = resolvedPort ? `:${resolvedPort}` : '';
            return `${protocol}//${hostname}${hostPort}/api/v1`;
        })(),
        
        // Initialization
        init() {
            this.loadStats();
            this.loadHistory();
            this.loadWholesaleFavorites();
            this.loadAutomationConfig();
            this.setupEventListeners();
            this.checkAutomationStatus();
        },
        
        // Event Listeners
        setupEventListeners() {
            // Auto-save form data
            this.$watch('marginParams', () => {
                localStorage.setItem('selpix_margin_params', JSON.stringify(this.marginParams));
            }, { deep: true });
            
            this.$watch('automationConfig', () => {
                localStorage.setItem('selpix_automation_config', JSON.stringify(this.automationConfig));
            }, { deep: true });

            this.$watch('wholesaleSearch.favorites', () => {
                localStorage.setItem('selpix_wholesale_favorites', JSON.stringify(this.wholesaleSearch.favorites));
            }, { deep: true });
            
            // Load saved form data
            const savedParams = localStorage.getItem('selpix_margin_params');
            if (savedParams) {
                try {
                    const parsedParams = JSON.parse(savedParams);
                    if (parsedParams && typeof parsedParams === 'object') {
                        delete parsedParams.exchangeRate;
                        this.marginParams = { ...this.marginParams, ...parsedParams };
                    }
                } catch (error) {
                    console.warn('Failed to parse saved margin params:', error);
                }
            }
        },
        
        // Automation Functions
        loadAutomationConfig() {
            const saved = localStorage.getItem('selpix_automation_config');
            if (saved) {
                this.automationConfig = { ...this.automationConfig, ...JSON.parse(saved) };
            }
        },

        loadWholesaleFavorites() {
            try {
                const saved = localStorage.getItem('selpix_wholesale_favorites');
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (Array.isArray(parsed)) {
                        this.wholesaleSearch.favorites = parsed;
                        this.applyFavoritesToResults();
                    }
                }
            } catch (error) {
                console.warn('Failed to load wholesale favorites:', error);
                this.wholesaleSearch.favorites = [];
            }
        },
        
        async checkAutomationStatus() {
            try {
                const response = await this.apiCall('GET', '/automation/orders/status');
                this.automationStatus = response;
                
                if (response.seenIdsCount !== undefined) {
                    this.stats.automationJobs = response.seenIdsCount;
                }
            } catch (error) {
                console.error('Failed to check automation status:', error);
            }
        },
        
        async startAutomation() {
            if (!this.validateAutomationConfig()) {
                this.showNotification('error', '자동화 설정을 완료해주세요.');
                return;
            }
            
            this.isAutomating = true;
            
            try {
                const response = await this.apiCall('POST', '/automation/process-orders', {
                    config: {
                        coupangAccessKey: this.automationConfig.coupangAccessKey,
                        coupangSecretKey: this.automationConfig.coupangSecretKey,
                        coupangVendorId: this.automationConfig.coupangVendorId,
                        domeApiKey: this.automationConfig.domeApiKey,
                        domeLoginId: this.automationConfig.domeLoginId
                    },
                    options: {
                        status: 'ACCEPT',
                        hoursBack: 24,
                        maxPerPage: 50
                    }
                });
                
                this.showNotification('success', 
                    `자동화 완료: 신규 주문 ${response.newOrders}건 중 ${response.processed}건 처리됨`);
                
                this.checkAutomationStatus();
                this.updateStats();
                
            } catch (error) {
                console.error('Automation failed:', error);
                this.showNotification('error', '자동화 처리 중 오류가 발생했습니다: ' + error.message);
            } finally {
                this.isAutomating = false;
            }
        },
        
        async approveOrder(shipmentBoxId) {
            if (!shipmentBoxId) {
                this.showNotification('error', 'shipmentBoxId를 입력해주세요.');
                return;
            }
            
            try {
                const response = await this.apiCall('POST', `/automation/approve-order/${shipmentBoxId}`, {
                    config: {
                        coupangAccessKey: this.automationConfig.coupangAccessKey,
                        coupangSecretKey: this.automationConfig.coupangSecretKey,
                        coupangVendorId: this.automationConfig.coupangVendorId,
                        domeApiKey: this.automationConfig.domeApiKey,
                        domeLoginId: this.automationConfig.domeLoginId
                    },
                    password: this.automationConfig.domePassword
                });
                
                if (response.success) {
                    this.showNotification('success', `주문 ${shipmentBoxId} 승인 완료`);
                } else {
                    this.showNotification('error', `주문 승인 실패: ${response.result?.error || 'Unknown error'}`);
                }
                
            } catch (error) {
                console.error('Manual approval failed:', error);
                this.showNotification('error', '수동 승인 중 오류가 발생했습니다: ' + error.message);
            }
        },
        
        validateAutomationConfig() {
            // For demo purposes, return true. In production, validate required fields
            return true;
        },
        
        // Main Workflow (Enhanced)
        async startAnalysis() {
            if (!this.productUrl) {
                this.showNotification('error', '상품 URL을 입력해주세요.');
                return;
            }
            
            this.isLoading = true;
            this.currentStep = 'analysis';
            this.progress = 20;
            
            try {
                // Step 1: Analyze Product
                await this.analyzeProduct();
                this.progress = 40;
                
                // Step 2: Calculate Margin
                await this.calculateMargin();
                this.progress = 60;
                
                // Step 3: Generate Keywords
                await this.generateKeywords();
                this.progress = 80;
                
                // Step 4: Prepare for Registration
                this.prepareRegistration();
                this.progress = 100;
                
                this.showNotification('success', '상품 분석이 완료되었습니다!');
                
            } catch (error) {
                console.error('Analysis failed:', error);
                this.showNotification('error', '분석 중 오류가 발생했습니다: ' + error.message);
                this.progress = 0;
            } finally {
                this.isLoading = false;
            }
        },
        
        // Product Analysis
        async analyzeProduct() {
            const response = await this.apiCall('POST', '/products/analyze', {
                productUrl: this.productUrl,
                shippingCost: this.marginParams.shippingCost,
                storageFee: this.marginParams.storageFee
            });
            
            this.productData = response.productInfo;
            
            // Update margin params with product data
            if (this.productData.wholesalePrice) {
                this.marginParams.wholesalePrice = this.productData.wholesalePrice;
            }
        },
        
        // Margin Calculation
        async calculateMargin() {
            if (!this.productData) return;
            
            const response = await this.apiCall('POST', '/margin/calculate', {
                productId: this.productData.productId,
                wholesalePrice: this.productData.wholesalePrice,
                currency: this.productData.currency || 'KRW',
                site: this.productData.site || '',
                ...this.marginParams
            });
            
            this.marginReport = response;
            
            // Update registration data
            this.registrationData.sellingPrice = this.marginReport.recommendedPrice;
        },
        
        // Keyword Generation
        async generateKeywords() {
            if (!this.productData) return;
            
            const response = await this.apiCall('POST', '/keywords/generate', {
                productInfo: {
                    name: this.productData.name,
                    category: this.productData.category,
                    description: this.productData.description,
                    productId: this.productData.productId
                },
                count: 20,
                language: 'ko'
            });
            
            this.keywords = response.keywords;
        },
        
        // Registration Preparation
        prepareRegistration() {
            // Auto-select top 5 keywords
            this.registrationData.selectedKeywords = this.keywords.slice(0, 5);
        },
        
        // Product Registration
        async registerProduct() {
            if (!this.productData || !this.marginReport) {
                this.showNotification('error', '상품 분석을 먼저 완료해주세요.');
                return;
            }
            
            this.isRegistering = true;
            
            try {
                const response = await this.apiCall('POST', '/registration/register', {
                    productData: {
                        productInfo: this.productData,
                        pricing: {
                            sellingPrice: this.registrationData.sellingPrice,
                            originalPrice: this.productData.wholesalePrice,
                            discountRate: this.registrationData.discountRate,
                            minOrderQuantity: this.registrationData.minOrderQuantity || 1
                        },
                        keywords: this.registrationData.selectedKeywords,
                        categoryId: this.productData.category,
                        shippingInfo: {
                            method: 'standard',
                            cost: this.registrationData.shippingCost ?? this.marginParams.shippingCost,
                            deliveryDays: 3,
                            freeShippingThreshold: 50000
                        }
                    }
                });
                
                if (response.success) {
                    this.showNotification('success', '상품이 성공적으로 등록되었습니다!');
                    this.addToHistory(response);
                    this.resetForm();
                } else {
                    throw new Error(response.message || '등록에 실패했습니다.');
                }
                
            } catch (error) {
                console.error('Registration failed:', error);
                this.showNotification('error', '등록 중 오류가 발생했습니다: ' + error.message);
            } finally {
                this.isRegistering = false;
            }
        },
        
        // Utility Functions
        async apiCall(method, endpoint, data = null) {
            const url = this.apiBaseUrl + endpoint;
            const options = {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                }
            };
            
            if (data) {
                options.body = JSON.stringify(data);
            }
            
            try {
                const response = await fetch(url, options);
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.message || `HTTP ${response.status}`);
                }
                
                return await response.json();
            } catch (error) {
                console.error('API call failed:', error);
                throw error;
            }
        },
        
        getAuthToken() {
            // For MVP, using a mock token
            // In production, this would be managed by proper authentication
            return localStorage.getItem('selpix_auth_token') || 'mock-token';
        },
        
        // Copy Functions
        async copyKeyword(keyword) {
            try {
                await navigator.clipboard.writeText(keyword);
                this.showNotification('success', `"${keyword}" 복사됨`);
            } catch (error) {
                console.error('Copy failed:', error);
                this.showNotification('error', '복사에 실패했습니다.');
            }
        },
        
        async copyAllKeywords() {
            try {
                const keywordText = this.keywords.join(', ');
                await navigator.clipboard.writeText(keywordText);
                this.showNotification('success', '모든 키워드가 복사되었습니다.');
            } catch (error) {
                console.error('Copy failed:', error);
                this.showNotification('error', '복사에 실패했습니다.');
            }
        },
        
        // History Management
        addToHistory(registrationResponse) {
            const historyItem = {
                id: registrationResponse.registrationId,
                name: this.productData.name,
                createdAt: new Date().toISOString(),
                status: registrationResponse.status,
                marginRate: this.marginReport.marginRate,
                productUrl: registrationResponse.productUrl,
                isAutomated: false
            };
            
            this.history.unshift(historyItem);
            localStorage.setItem('selpix_history', JSON.stringify(this.history));
            this.updateStats();
        },
        
        loadHistory() {
            const saved = localStorage.getItem('selpix_history');
            if (saved) {
                this.history = JSON.parse(saved);
            }
        },
        
        // Stats Management
        loadStats() {
            const today = new Date().toDateString();
            const todayItems = this.history.filter(item => 
                new Date(item.createdAt).toDateString() === today
            );
            
            this.stats.todayAnalysis = todayItems.length;
            this.stats.registrationSuccess = this.history.filter(item => 
                item.status === 'SUCCESS'
            ).length;
            
            if (this.history.length > 0) {
                const totalMargin = this.history.reduce((sum, item) => sum + (item.marginRate || 0), 0);
                this.stats.averageMargin = Math.round(totalMargin / this.history.length);
            }
        },
        
        updateStats() {
            this.loadStats();
        },
        
        // Form Management
        resetForm() {
            this.productUrl = '';
            this.productData = null;
            this.marginReport = null;
            this.keywords = [];
            this.registrationData = {
                sellingPrice: 0,
                discountRate: 0,
                selectedKeywords: [],
                shippingCost: 0,
                minOrderQuantity: 1
            };
            this.progress = 0;
            this.currentStep = 'dashboard';
        },
        
        // Notification System
        showNotification(type, message) {
            this.notification = {
                show: true,
                type: type,
                message: message
            };
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                this.notification.show = false;
            }, 5000);
        },
        
        // Formatting Functions
        formatCurrency(amount) {
            if (!amount) return '₩0';
            return '₩' + new Intl.NumberFormat('ko-KR').format(amount);
        },
        
        formatDate(dateString) {
            if (!dateString) return '';
            return new Date(dateString).toLocaleDateString('ko-KR');
        },
        
        getStatusColor(status) {
            switch (status) {
                case 'SUCCESS': return 'bg-green-100 text-green-800';
                case 'FAILED': return 'bg-red-100 text-red-800';
                case 'PENDING': return 'bg-yellow-100 text-yellow-800';
                case 'REVIEWING': return 'bg-blue-100 text-blue-800';
                default: return 'bg-gray-100 text-gray-800';
            }
        },
        
        getStatusText(status) {
            switch (status) {
                case 'SUCCESS': return '성공';
                case 'FAILED': return '실패';
                case 'PENDING': return '대기중';
                case 'REVIEWING': return '검토중';
                default: return '알 수 없음';
            }
        },

        // ========================================
        // 마진 계산기 기능
        // ========================================
        calculateProfit() {
            const { productName, unitPrice, cost, commissionRate, cpc, conversionRate, targetProfit } = this.marginCalc;

            if (!unitPrice || !cost) {
                this.showNotification('error', '판매가와 도매가를 입력해주세요');
                return;
            }

            // 광고비/개 계산
            const adPerUnit = cpc / (conversionRate / 100);

            // 판매 수량 계산
            for (let qty = 1; qty <= 1000; qty++) {
                const commission = unitPrice * (commissionRate / 100);
                const unitProfit = unitPrice - commission - adPerUnit - cost;
                const totalProfit = unitProfit * qty;

                if (totalProfit >= targetProfit) {
                    this.marginCalc.result = `
                        ✅ 최소 <strong>${qty}개</strong> 팔면 목표 순이익 달성<br/>
                        • 단위 순이익: ${Math.round(unitProfit).toLocaleString()}원<br/>
                        • 광고비/개: ${Math.round(adPerUnit).toLocaleString()}원<br/>
                        • 총 순이익: ${Math.round(totalProfit).toLocaleString()}원
                    `;

                    // 기록 추가
                    const history = JSON.parse(localStorage.getItem('selpix_margin_history') || '[]');
                    history.unshift({
                        productName: productName || '-',
                        qty,
                        unitProfit: Math.round(unitProfit),
                        totalProfit: Math.round(totalProfit)
                    });
                    if (history.length > 10) history.pop();
                    localStorage.setItem('selpix_margin_history', JSON.stringify(history));

                    this.updateMarginHistory();
                    return;
                }
            }

            this.marginCalc.result = '❌ 목표 순이익을 달성할 수 없습니다 (적자 구조)';
        },

        updateMarginHistory() {
            const history = JSON.parse(localStorage.getItem('selpix_margin_history') || '[]');
            this.marginCalc.historyHtml = history.map(item => `
                <tr>
                    <td class="px-4 py-2 text-sm">${item.productName}</td>
                    <td class="px-4 py-2 text-sm">${item.qty}</td>
                    <td class="px-4 py-2 text-sm">${item.unitProfit.toLocaleString()}원</td>
                </tr>
            `).join('');
        },

        // ========================================
        // 광고 분석 기능
        // ========================================
        async loadAdData(event) {
            const file = event.target.files[0];
            if (!file) return;

            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data, { type: 'array', cellDates: true });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });

            // 헤더 감지
            const headers = Object.keys(rows[0] || {});
            const dateKey = headers.find(h => /날짜|일자|Date/i.test(h)) || headers[0];
            const zoneKey = headers.find(h => /광고.*노출.*지면|영역/i.test(h)) || headers[1];
            const spendKey = headers.find(h => /광고비$/i.test(h) && !/매출/i.test(h)) || headers.find(h => /광고.*비|비용/i.test(h));
            const revenueKey = headers.find(h => /전환.*매출액|매출액/i.test(h)) || headers[headers.length - 1];
            const impKey = headers.find(h => /노출.*수/i.test(h)) || headers[2];
            const clickKey = headers.find(h => /클릭/i.test(h)) || headers[3];
            const orderKey = headers.find(h => /주문|전환$/i.test(h)) || headers[4];

            // 통계 계산
            const stats = {
                검색: { imp: 0, click: 0, order: 0, spend: 0, revenue: 0 },
                비검색: { imp: 0, click: 0, order: 0, spend: 0, revenue: 0 },
                리타겟팅: { imp: 0, click: 0, order: 0, spend: 0, revenue: 0 },
                합계: { imp: 0, click: 0, order: 0, spend: 0, revenue: 0 }
            };

            rows.forEach(r => {
                const cell = (r[zoneKey] || '').toString().trim();
                let zone = '비검색';
                if (/검색/i.test(cell) && !/비검색/i.test(cell)) zone = '검색';
                else if (/리타겟팅/i.test(cell)) zone = '리타겟팅';

                const imp = parseInt((r[impKey] || 0).toString().replace(/[^0-9]/g, '')) || 0;
                const clk = parseInt((r[clickKey] || 0).toString().replace(/[^0-9]/g, '')) || 0;
                const ord = parseInt((r[orderKey] || 0).toString().replace(/[^0-9]/g, '')) || 0;
                const sp = parseInt((r[spendKey] || 0).toString().replace(/[^0-9]/g, '')) || 0;
                const rev = parseInt((r[revenueKey] || 0).toString().replace(/[^0-9]/g, '')) || 0;

                stats[zone].imp += imp; stats['합계'].imp += imp;
                stats[zone].click += clk; stats['합계'].click += clk;
                stats[zone].order += ord; stats['합계'].order += ord;
                stats[zone].spend += sp; stats['합계'].spend += sp;
                stats[zone].revenue += rev; stats['합계'].revenue += rev;
            });

            // 통계 HTML 생성
            let html = '<h3 class="font-bold mb-2">기본 통계</h3><table class="min-w-full divide-y divide-gray-200"><thead class="bg-gray-50"><tr>' +
                       '<th class="px-4 py-2 text-xs font-medium text-gray-500">노출영역</th><th>노출수</th><th>클릭</th><th>주문</th>' +
                       '<th>클릭률</th><th>전환율</th><th>광고비</th><th>매출</th><th>ROAS</th>' +
                       '</tr></thead><tbody class="bg-white divide-y divide-gray-200">';

            ['검색', '비검색', '리타겟팅', '합계'].forEach(zone => {
                const s = stats[zone];
                const cr = s.imp ? ((s.click / s.imp * 100).toFixed(2) + '%') : '0%';
                const vr = s.click ? ((s.order / s.click * 100).toFixed(2) + '%') : '0%';
                const ro = s.spend ? ((s.revenue / s.spend * 100).toFixed(1) + '%') : '0%';
                html += `<tr><td class="px-4 py-2">${zone}</td><td class="px-4 py-2">${s.imp.toLocaleString()}</td>` +
                        `<td class="px-4 py-2">${s.click.toLocaleString()}</td><td class="px-4 py-2">${s.order.toLocaleString()}</td>` +
                        `<td class="px-4 py-2">${cr}</td><td class="px-4 py-2">${vr}</td>` +
                        `<td class="px-4 py-2">${s.spend.toLocaleString()}</td><td class="px-4 py-2">${s.revenue.toLocaleString()}</td>` +
                        `<td class="px-4 py-2">${ro}</td></tr>`;
            });
            html += '</tbody></table>';
            this.adAnalysis.statsHtml = html;

            // 차트 데이터 준비
            const dateMap = {};
            rows.forEach(r => {
                const dt = this.normalizeDate(r[dateKey]);
                const zone = r[zoneKey] ? r[zoneKey].trim() : '기타';
                const spend = parseInt((r[spendKey] || 0).toString().replace(/[^0-9]/g, '')) || 0;
                const rev = parseInt((r[revenueKey] || 0).toString().replace(/[^0-9]/g, '')) || 0;

                if (!dateMap[dt]) dateMap[dt] = { search: 0, nonSearch: 0, revenue: 0 };
                if (/검색/i.test(zone)) dateMap[dt].search += spend;
                else dateMap[dt].nonSearch += spend;
                if (dateMap[dt].revenue === 0) dateMap[dt].revenue = rev;
            });

            const dates = Object.keys(dateMap).filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort();
            const revenueData = dates.map(d => dateMap[d]?.revenue || 0);
            const spendData = dates.map(d => (dateMap[d]?.search || 0) + (dateMap[d]?.nonSearch || 0));
            const roasData = dates.map(d => {
                const totalSpend = (dateMap[d]?.search || 0) + (dateMap[d]?.nonSearch || 0);
                return totalSpend ? parseFloat(((dateMap[d].revenue || 0) / totalSpend * 100).toFixed(1)) : 0;
            });

            // Chart.js로 차트 생성
            const ctx = document.getElementById('adChart').getContext('2d');
            if (this.adAnalysis.chart) this.adAnalysis.chart.destroy();

            this.adAnalysis.chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: dates,
                    datasets: [
                        {
                            type: 'line',
                            label: '광고비',
                            data: spendData,
                            borderColor: '#f59e0b',
                            backgroundColor: '#f59e0b33',
                            yAxisID: 'spendAxis',
                            tension: 0.2,
                            fill: false
                        },
                        {
                            type: 'line',
                            label: '매출액',
                            data: revenueData,
                            borderColor: '#8b5cf6',
                            backgroundColor: '#8b5cf633',
                            yAxisID: 'revenueAxis',
                            tension: 0.2,
                            fill: false
                        },
                        {
                            type: 'line',
                            label: 'ROAS (%)',
                            data: roasData,
                            borderColor: '#10b981',
                            backgroundColor: '#10b98133',
                            yAxisID: 'roasAxis',
                            tension: 0.2,
                            fill: false
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { title: { display: true, text: '날짜' } },
                        spendAxis: {
                            type: 'linear',
                            position: 'left',
                            title: { display: true, text: '광고비 (원)' }
                        },
                        revenueAxis: {
                            type: 'linear',
                            position: 'right',
                            title: { display: true, text: '매출액 (원)' },
                            grid: { drawOnChartArea: false }
                        },
                        roasAxis: {
                            type: 'linear',
                            position: 'right',
                            title: { display: true, text: 'ROAS (%)' },
                            grid: { drawOnChartArea: false }
                        }
                    },
                    plugins: {
                        legend: { position: 'top' },
                        tooltip: { mode: 'index', intersect: false }
                    }
                }
            });

            this.showNotification('success', '광고 데이터 분석 완료');
        },

        normalizeDate(d) {
            if (d instanceof Date) return d.toISOString().split('T')[0];
            const s = d.toString().trim();
            if (/^\d{8}$/.test(s)) return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6)}`;
            if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
            return new Date(s).toISOString().split('T')[0];
        },

        // ========================================
        // 키워드 분석 기능
        // ========================================
        async loadKeywordData(event) {
            const file = event.target.files[0];
            if (!file) return;

            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data, { type: 'array', cellDates: true });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

            // 헤더 감지
            const headers = Object.keys(rows[0] || {});
            const impKey = headers.find(h => /노출.*수/i.test(h)) || '';
            const clickKey = headers.find(h => /클릭수/i.test(h)) || '';
            const convKey = headers.find(h => /전환수/i.test(h)) || '';
            const spendKey = headers.find(h => /광고비/i.test(h)) || '';
            const revKey = headers.find(h => /총.*전환매출액|매출/i.test(h)) || '';
            const productKey = headers.find(h => /광고전환매출발생.*상품명/i.test(h)) || headers[0];

            // 키워드별 데이터 집계
            const keywordMap = {};
            const products = new Set();

            rows.forEach(r => {
                const kw = (r['키워드'] || r['Keyword'] || '').toString();
                const prod = r[productKey] || '';
                const imp = parseInt(r[impKey] || 0) || 0;
                const clk = parseInt(r[clickKey] || 0) || 0;
                const conv = parseInt(r[convKey] || 0) || 0;
                const sp = parseInt((r[spendKey] || 0).toString().replace(/[^0-9]/g, '')) || 0;
                const rev = parseInt((r[revKey] || 0).toString().replace(/[^0-9]/g, '')) || 0;

                if (!kw || kw === '-' || clk === 0) return;

                if (!keywordMap[kw]) {
                    keywordMap[kw] = {
                        product: prod,
                        keyword: kw,
                        impressions: 0,
                        clicks: 0,
                        conversions: 0,
                        spend: 0,
                        revenue: 0
                    };
                }

                keywordMap[kw].impressions += imp;
                keywordMap[kw].clicks += clk;
                keywordMap[kw].conversions += conv;
                keywordMap[kw].spend += sp;
                keywordMap[kw].revenue += rev;

                if (prod) products.add(prod);
            });

            // ROAS 계산 및 분류
            const allKeywords = Object.values(keywordMap).map(kw => ({
                ...kw,
                roas: kw.spend ? (kw.revenue / kw.spend * 100) : 0
            }));

            this.keywordAnalysis.allKeywords = allKeywords;
            this.keywordAnalysis.products = Array.from(products);
            this.filterKeywords();

            this.showNotification('success', '키워드 데이터 분석 완료');
        },

        filterKeywords() {
            const selected = this.keywordAnalysis.selectedProduct;
            const filtered = selected
                ? this.keywordAnalysis.allKeywords.filter(kw => kw.product === selected)
                : this.keywordAnalysis.allKeywords;

            // 저성과 키워드 필터링: 전환율 < 1% 또는 ROAS < 100%
            const lowKeywords = filtered.filter(kw => {
                const convRate = kw.clicks ? (kw.conversions / kw.clicks * 100) : 0;
                return convRate < 1 || kw.roas < 100;
            });

            const goodKeywords = filtered.filter(kw => {
                const convRate = kw.clicks ? (kw.conversions / kw.clicks * 100) : 0;
                return convRate >= 1 && kw.roas >= 100;
            });

            this.keywordAnalysis.lowKeywords = lowKeywords;
            this.keywordAnalysis.goodKeywords = goodKeywords;
        },

        downloadLowKeywords() {
            const keywords = this.keywordAnalysis.lowKeywords.map(kw => kw.keyword).join('\n');
            const blob = new Blob([keywords], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'low_performance_keywords.txt';
            a.click();
            URL.revokeObjectURL(url);

            this.showNotification('success', '저성과 키워드 다운로드 완료');
        },

        // ========================================
        // 상품 검사 기능
        // ========================================
        async loadProductExcel(event) {
            const file = event.target.files[0];
            if (!file) return;

            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data, { type: 'array' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];

            // 3번째 행부터 읽기 (헤더 스킵)
            const range = XLSX.utils.decode_range(sheet['!ref']);
            range.s.r = 2;
            sheet['!ref'] = XLSX.utils.encode_range(range);

            const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: '' });
            const headers = Object.keys(jsonData[0]);

            const products = jsonData.map(row => ({
                name: row[headers[0]] || '',
                price: row[headers[9]] || 0,
                sales: row[headers[13]] || 0,
                wholesalePrice: 0,
                rec1: null,
                rec2: null,
                rec3: null,
                applyPrice: 0,
                rawData: row
            }));

            this.productInspection.products = products;
            this.productInspection.currentPage = 1;

            this.showNotification('success', `${products.length}개 상품 로드 완료`);
        },

        calculateRecommendedPrices(index) {
            const product = this.productInspection.products[index];
            if (!product.wholesalePrice || product.wholesalePrice === 0) {
                product.rec1 = null;
                product.rec2 = null;
                product.rec3 = null;
                return;
            }

            product.rec1 = (Math.round(product.wholesalePrice * 1.7 / 10) * 10).toLocaleString();
            product.rec2 = (Math.round(product.wholesalePrice * 2.0 / 10) * 10).toLocaleString();
            product.rec3 = (Math.round(product.wholesalePrice * 2.2 / 10) * 10).toLocaleString();
        },

        applyProductPrice(index) {
            const product = this.productInspection.products[index];
            if (!product.applyPrice) {
                this.showNotification('error', '적용가를 입력해주세요');
                return;
            }

            // 실제 엑셀 데이터 업데이트 (원본 데이터 수정)
            product.rawData[15] = product.applyPrice; // 판매가격
            product.rawData[16] = product.applyPrice; // 할인율기준가
            product.rawData[17] = '판매중'; // 판매상태
            product.rawData[18] = 9999; // 잔여수량

            this.showNotification('success', '적용 완료');
        },

        sortProducts() {
            const option = this.productInspection.sortOption;
            if (!option) return;

            let sorted = [...this.productInspection.products];

            switch (option) {
                case 'price-asc':
                    sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
                    break;
                case 'price-desc':
                    sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
                    break;
                case 'sales-asc':
                    sorted.sort((a, b) => (a.sales || 0) - (b.sales || 0));
                    break;
                case 'sales-desc':
                    sorted.sort((a, b) => (b.sales || 0) - (a.sales || 0));
                    break;
            }

            this.productInspection.products = sorted;
            this.productInspection.currentPage = 1;
        },

        paginatedProducts() {
            const start = (this.productInspection.currentPage - 1) * this.productInspection.itemsPerPage;
            const end = start + this.productInspection.itemsPerPage;
            return this.productInspection.products.slice(start, end);
        },

        totalPages() {
            return Math.ceil(this.productInspection.products.length / this.productInspection.itemsPerPage);
        },

        // ========================================
        // 도매검색 기능
        // ========================================
        async searchWholesale() {
            if (!this.wholesaleSearch.keyword) {
                this.showNotification('error', '검색 키워드를 입력해주세요');
                return;
            }

            if (this.wholesaleSearch.selectedSites.length === 0) {
                this.showNotification('error', '검색할 사이트를 하나 이상 선택해주세요');
                return;
            }

            this.wholesaleSearch.isSearching = true;
            this.wholesaleSearch.results = [];
            this.wholesaleSearch.errors = [];
            this.wholesaleSearch.searched = false;
            this.wholesaleSearch.selectedProduct = null;
            this.wholesaleSearch.detailCache = {};
            this.wholesaleSearch.detailLoading = null;
            this.wholesaleSearch.detailPrefetching = false;
            this.wholesaleSearch.showFavoritesOnly = false;

            try {
                const selectedSites = this.wholesaleSearch.selectedSites.filter(site => site !== 'coupang');
                if (selectedSites.length === 0) {
                    selectedSites.push('domeggook');
                }
                const response = await fetch(`${this.apiBaseUrl}/crawler/search`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        keyword: this.wholesaleSearch.keyword,
                        sites: selectedSites,
                        minPrice: parseInt(this.wholesaleSearch.minPrice) || 0,
                        maxPrice: parseInt(this.wholesaleSearch.maxPrice) || 1000000
                    })
                });

                const data = await response.json();

                if (data.success) {
                    const products = (data.data.products || []).map(product => ({
                        ...product,
                        imageUsageStatus: product.imageUsageStatus || 'pending',
                        imageUsageText: product.imageUsageText || null,
                        detailText: product.detailText || null,
                        detailHtml: product.detailHtml || null,
                        detailImages: product.detailImages || []
                    }));
                    this.wholesaleSearch.results = products;
                    this.wholesaleSearch.errors = data.data.errors || [];
                    this.wholesaleSearch.searchDuration = data.data.duration || 0;
                    this.wholesaleSearch.searched = true;
                    this.wholesaleSearch.filterSite = 'all';
                    this.wholesaleSearch.imageFilter = 'all';
                    this.applyFavoritesToResults();

                    this.showNotification('success', `${this.wholesaleSearch.results.length}개 상품을 찾았습니다`);

                    this.prefetchWholesaleDetails().catch(error => {
                        console.warn('Wholesale detail prefetch failed:', error);
                    });
                } else {
                    throw new Error(data.message || '검색 실패');
                }

            } catch (error) {
                console.error('도매검색 오류:', error);
                this.showNotification('error', '검색 중 오류가 발생했습니다: ' + error.message);
                this.wholesaleSearch.searched = true;
            } finally {
                this.wholesaleSearch.isSearching = false;
            }
        },

        getUniqueSites() {
            const sites = new Set(this.wholesaleSearch.results.map(p => p.site));
            return Array.from(sites);
        },

        countBySite(site) {
            return this.wholesaleSearch.results.filter(p => p.site === site).length;
        },

        getFilteredResults() {
            const { filterSite, imageFilter } = this.wholesaleSearch;
            const siteFiltered = filterSite === 'all'
                ? this.wholesaleSearch.results
                : this.wholesaleSearch.results.filter(p => p.site === filterSite);

            if (imageFilter === 'all') {
                return this.wholesaleSearch.showFavoritesOnly
                    ? siteFiltered.filter(p => this.isWholesaleFavorite(p))
                    : siteFiltered;
            }

            const statusFiltered = siteFiltered.filter(p => (p.imageUsageStatus || 'pending') === imageFilter);
            return this.wholesaleSearch.showFavoritesOnly
                ? statusFiltered.filter(p => this.isWholesaleFavorite(p))
                : statusFiltered;
        },

        applyFavoritesToResults() {
            const favoritesSet = new Set(this.wholesaleSearch.favorites || []);
            this.wholesaleSearch.results.forEach(product => {
                if (!product) return;
                const isFavorite = favoritesSet.has(this.getWholesaleProductKey(product));
                product.isFavorite = isFavorite;
            });
        },

        toggleWholesaleFavorite(product) {
            if (!product) return;
            const key = this.getWholesaleProductKey(product);
            if (!key) return;

            const favoritesSet = new Set(this.wholesaleSearch.favorites || []);
            let isFavorite;
            if (favoritesSet.has(key)) {
                favoritesSet.delete(key);
                isFavorite = false;
            } else {
                favoritesSet.add(key);
                isFavorite = true;
            }

            product.isFavorite = isFavorite;
            this.wholesaleSearch.favorites = Array.from(favoritesSet);

            const cached = this.wholesaleSearch.detailCache[key];
            if (cached) {
                cached.isFavorite = isFavorite;
            }

            if (this.productData && this.getWholesaleProductKey(this.productData) === key) {
                this.productData.isFavorite = isFavorite;
            }

            if (favoritesSet.size === 0) {
                this.wholesaleSearch.showFavoritesOnly = false;
            }
        },

        isWholesaleFavorite(product) {
            if (!product) return false;
            const key = this.getWholesaleProductKey(product);
            return this.wholesaleSearch.favorites?.includes(key);
        },

        favoriteResults() {
            return this.wholesaleSearch.results.filter(product => this.isWholesaleFavorite(product));
        },

        toggleFavoritesView() {
            const hasFavorites = (this.wholesaleSearch.favorites || []).length > 0;
            if (!hasFavorites) {
                this.showNotification('info', '찜한 상품이 없습니다.');
                return;
            }
            this.wholesaleSearch.showFavoritesOnly = !this.wholesaleSearch.showFavoritesOnly;
        },

        imageStatusOptions() {
            return [
                { value: 'all', label: '전체', count: this.wholesaleSearch.results.length },
                { value: 'available', label: '사용 가능', count: this.countByImageStatus('available') },
                { value: 'unavailable', label: '사용 불가', count: this.countByImageStatus('unavailable') },
                { value: 'review', label: '확인 필요', count: this.countByImageStatus('review') },
                { value: 'pending', label: '확인 중', count: this.countByImageStatus('pending') }
            ];
        },

        countByImageStatus(status) {
            if (status === 'all') return this.wholesaleSearch.results.length;
            return this.wholesaleSearch.results.filter(p => (p.imageUsageStatus || 'pending') === status).length;
        },

        openCoupangSearch() {
            const keyword = (this.wholesaleSearch.keyword || '').trim();
            if (!keyword) {
                this.showNotification('info', '쿠팡 검색을 위해 키워드를 입력해주세요.');
                return;
            }
            const url = `https://www.coupang.com/np/search?q=${encodeURIComponent(keyword)}`;
            window.open(url, '_blank', 'noopener');
        },

        marginExplanation() {
            if (!this.marginReport) return '';
            const target = Number(this.marginParams.targetMarginRate || 0);
            const commission = Number(this.marginParams.commissionRate || 0);
            const actual = Number(this.marginReport.marginRate || 0);

            const formatPct = (value) => {
                if (!Number.isFinite(value)) return '-';
                const fixed = value.toFixed(2);
                return fixed.endsWith('.00') ? fixed.slice(0, -3) + '%' : fixed + '%';
            };

            return `목표 마진율 ${formatPct(target)}에 수수료율 ${formatPct(commission)}이 반영돼 실제 마진율은 ${formatPct(actual)}로 계산되었습니다.`;
        },

        async prepareRegistrationFromWholesale(product) {
            if (!product) return;
            if (!product.sourceUrl) {
                this.showNotification('error', '상품 상세 URL을 확인할 수 없습니다.');
                return;
            }

            const productKey = this.getWholesaleProductKey(product);
            let detailData = this.wholesaleSearch.detailCache[productKey];

            if (!detailData) {
                this.wholesaleSearch.detailLoading = productKey;
                try {
                    const response = await this.apiCall('POST', '/crawler/detail', {
                        sourceUrl: product.sourceUrl,
                        site: product.site,
                        name: product.name,
                        price: product.price,
                        imageUrl: product.imageUrl
                    });

                    detailData = response.data || {};
                    this.wholesaleSearch.detailCache = {
                        ...this.wholesaleSearch.detailCache,
                        [productKey]: detailData
                    };

                    Object.assign(product, detailData);

                } catch (error) {
                    console.error('Wholesale detail fetch failed:', error);
                    this.showNotification('error', '상세 정보를 불러오지 못했습니다: ' + error.message);
                    this.wholesaleSearch.detailLoading = null;
                    return;
                } finally {
                    this.wholesaleSearch.detailLoading = null;
                }
            } else {
                Object.assign(product, detailData);
            }

            const wholesalePrice = product.price || product.wholesalePrice || 0;
            const productId = this.generateTempId();
            const detailImages = Array.isArray(product.detailImages) ? product.detailImages : [];
            const primaryImage = detailImages[0] || product.imageUrl || null;
            const imageUsageText = product.imageUsageText || null;
            const imageUsageStatus = product.imageUsageStatus || 'unknown';
            const fallbackDescription = `${product.site ? product.site.toUpperCase() : '도매'} 소싱 상품`;
            const rawDetailText = (product.detailText || '').trim();
            const rawDescription = (product.description || '').trim();
            const effectiveDetailText = rawDetailText || rawDescription || fallbackDescription;
            const limitedDescription = effectiveDetailText.length > 800 ? effectiveDetailText.slice(0, 800) + '…' : effectiveDetailText;
            const detailHtml = product.detailHtml || null;
            const currency = (product.currency || 'KRW').toUpperCase();
            const minOrderQuantity = product.minOrderQuantity || 1;
            const shippingCost = Number.isFinite(product.shippingCost) ? product.shippingCost : (product.shippingCost ? Number(product.shippingCost) : 0);
            const shippingText = product.shippingText || (shippingCost ? `${shippingCost.toLocaleString()}원` : '정보 없음');

            this.productData = {
                productId,
                name: product.name || '도매 상품',
                wholesalePrice,
                category: product.category || '도매 검색',
                description: limitedDescription || fallbackDescription,
                detailText: effectiveDetailText || null,
                detailHtml: detailHtml,
                image: primaryImage,
                detailImages,
                sourceUrl: product.sourceUrl || null,
                wholesaleUrl: product.sourceUrl || null,
                site: product.site || null,
                currency,
                minOrderQuantity,
                shippingCost,
                shippingText,
                isWholesaleSelection: true,
                imageUsageText,
                imageUsageStatus
            };

            const baseWholesale = Number(product.price || product.wholesalePrice || wholesalePrice || 0) || 0;
            const totalWholesaleCost = minOrderQuantity > 0 ? baseWholesale * minOrderQuantity : baseWholesale;

            this.marginParams.wholesalePrice = totalWholesaleCost;
            if (shippingCost !== undefined && shippingCost !== null) {
                this.marginParams.shippingCost = shippingCost;
            }
            this.registrationData.sellingPrice = totalWholesaleCost ? Math.round(totalWholesaleCost * 1.3) : 0;
            this.registrationData.discountRate = 0;
            this.registrationData.selectedKeywords = [];
            this.registrationData.minOrderQuantity = minOrderQuantity;
            this.registrationData.shippingCost = shippingCost;
            this.marginReport = null;
            this.keywords = [];
            this.productUrl = product.sourceUrl || '';
            this.progress = 0;

            this.wholesaleSearch.selectedProduct = productKey;
            this.currentStep = 'analysis';

            this.showNotification('success', '도매 상품 정보를 불러왔습니다. 마진 계산을 진행해주세요.');
        },

        async prefetchWholesaleDetails() {
            const resultsRef = this.wholesaleSearch.results;
            if (!Array.isArray(resultsRef) || resultsRef.length === 0) {
                return;
            }

            const concurrency = 3;
            this.wholesaleSearch.detailPrefetching = true;

            let index = 0;
            const worker = async () => {
                while (true) {
                    if (resultsRef !== this.wholesaleSearch.results) {
                        return;
                    }

                    if (index >= resultsRef.length) {
                        break;
                    }

                    const currentIndex = index;
                    index += 1;

                    const product = resultsRef[currentIndex];
                    if (!product || !product.sourceUrl) {
                        continue;
                    }

                    const key = this.getWholesaleProductKey(product);
                    if (this.wholesaleSearch.detailCache[key]) {
                        Object.assign(product, this.wholesaleSearch.detailCache[key]);
                        product.imageUsageStatus = product.imageUsageStatus || 'unknown';
                        continue;
                    }

                    try {
                        const response = await this.apiCall('POST', '/crawler/detail', {
                            sourceUrl: product.sourceUrl,
                            site: product.site,
                            name: product.name,
                            price: product.price,
                            imageUrl: product.imageUrl
                        });

                        if (this.wholesaleSearch.results !== resultsRef) {
                            return;
                        }

                        const detail = response.data || {};
                        this.wholesaleSearch.detailCache = {
                            ...this.wholesaleSearch.detailCache,
                            [key]: detail
                        };

                        Object.assign(product, detail);
                        product.imageUsageStatus = detail.imageUsageStatus || product.imageUsageStatus || 'unknown';

                    } catch (error) {
                        console.warn('Detail prefetch failed:', error);
                        if (product.imageUsageStatus === 'pending') {
                            product.imageUsageStatus = 'unknown';
                        }
                    }
                }
            };

            const workerCount = Math.min(concurrency, resultsRef.length);

            try {
                await Promise.all(Array.from({ length: workerCount }, () => worker()));
            } finally {
                if (this.wholesaleSearch.results === resultsRef) {
                    this.wholesaleSearch.detailPrefetching = false;
                    if (this.wholesaleSearch.detailLoading && !this.wholesaleSearch.detailCache[this.wholesaleSearch.detailLoading]) {
                        this.wholesaleSearch.detailLoading = null;
                    }
                }
            }
        },

        generateTempId() {
            try {
                if (typeof window !== 'undefined' && window.crypto?.randomUUID) {
                    return window.crypto.randomUUID();
                }
            } catch (error) {
                console.warn('Failed to use crypto.randomUUID:', error);
            }
            return `wh-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
        },

        getWholesaleProductKey(product) {
            if (!product) return '';
            if (product.sourceUrl) return product.sourceUrl;
            const namePart = (product.name || 'item').toLowerCase().replace(/\s+/g, '-').slice(0, 30);
            const sitePart = product.site || 'wholesale';
            return `${sitePart}-${namePart}-${product.price || '0'}`;
        },

        wholesaleDescriptionPreview(product) {
            const cache = this.wholesaleSearch.detailCache || {};
            const cached = cache[this.getWholesaleProductKey(product)] || {};
            const textSource = cached.detailText || cached.description || product?.detailText || product?.description || '';
            const text = textSource.replace(/\s+/g, ' ').trim();
            if (!text) return '';
            if (text.length <= 80) return text;
            return text.slice(0, 80) + '…';
        },

        imageUsageClass(product) {
            const status = product?.imageUsageStatus || 'unknown';
            switch (status) {
                case 'available':
                    return 'bg-green-100 text-green-700 border border-green-200';
                case 'unavailable':
                    return 'bg-red-100 text-red-700 border border-red-200';
                case 'review':
                    return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
                case 'pending':
                    return 'bg-blue-100 text-blue-700 border border-blue-200';
                default:
                    return 'bg-gray-100 text-gray-700 border border-gray-200';
            }
        },

        imageUsageLabel(product) {
            const status = product?.imageUsageStatus || 'unknown';
            switch (status) {
                case 'available':
                    return '이미지 사용 가능';
                case 'unavailable':
                    return '이미지 사용 불가';
                case 'review':
                    return '이미지 사용 확인 필요';
                case 'pending':
                    return '이미지 사용 확인 중';
                default:
                    return '사용 여부 미확인';
            }
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Selpix v1.5 Frontend with Automation Loaded');
});
