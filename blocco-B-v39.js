// ========================================
// 📦 BLOCCO B - CODICE V39 COMPLETO
// ========================================
// Tutte le classi della Dashboard V39
// Da copiare DOPO blocco-A-api.js
// ========================================

// ========================================
// CLASSE PRINCIPALE - DashboardApp
// ========================================
class DashboardApp {
    constructor() {
        this.data = {
            raw: { lead: null, campaigns: null, sales: null, weekly: null },
            original: { lead: null, campaigns: null },
            filtered: {
                leadByPeriod: null, leadFullyFiltered: null, campaigns: null
            },
            processed: {
                funnel: {}, economic: {}, advertising: {}, performance: {},
                conversionRates: {}, performanceBubbles: {}, efficiency: {}, temporal: {}
            }
        };
        this.filters = {
            state: {
                periodo: 'tutto', dateStart: null, dateEnd: null, fonte: '', mezzo: '',
                puntoVendita: '', riattivazione: '', personType: '', active: false
            },
            options: {
                fonti: new Set(), mezzi: new Set(), personTypes: new Set()
            }
        };
        this.charts = {};
        this.logger = new Logger();
        this.dateTimeInterval = null;
        this.currentFunnelAggregation = 'weekly';
        this.currentEconomicAggregation = 'monthly';
    }

    init() {
        this.logger.log('🚀 Inizializzazione Dashboard Intelligence 3.0', 'success');
        this.setupEventListeners();
        this.filterManager = new FilterManager(this);
        this.dataProcessor = new DataProcessor(this);
        this.chartRenderer = new ChartRenderer(this);
        this.tableRenderer = new TableRenderer(this);
        this.startDateTime();

        // 🆕 Inizializzazione API Manager
        this.apiManager = new ApiManager(this);
    }

    setupEventListeners() {
        document.getElementById('toggleDebug')?.addEventListener('click', () => this.toggleDebug());
        document.getElementById('processButton')?.addEventListener('click', () => this.processData());
        document.getElementById('applyFilters')?.addEventListener('click', () => this.filterManager.apply());
        document.getElementById('resetFilters')?.addEventListener('click', () => this.filterManager.reset());
        document.getElementById('exportCSV')?.addEventListener('click', () => this.exportCSV());

        document.getElementById('exportFullDashboard')?.addEventListener('click', () => this.exportFullDashboardPDF());

        document.getElementById('exportPDF')?.addEventListener('click', () =>
            this.exportSectionToPDF('performanceTableSection', 'performance_dettagliata')
        );

        document.getElementById('exportFunnelKpi')?.addEventListener('click', () =>
            this.exportSectionToPDF('funnelKpiSection', 'funnel_kpi')
        );
        document.getElementById('exportEconomicKpi')?.addEventListener('click', () =>
            this.exportSectionToPDF('economicKpiSection', 'performance_economica')
        );
        document.getElementById('exportAdvertisingKpi')?.addEventListener('click', () =>
            this.exportSectionToPDF('advertisingKpiSection', 'efficienza_pubblicitaria')
        );
        document.getElementById('exportFunnelChart')?.addEventListener('click', () =>
            this.exportSectionToPDF('funnelChartSection', 'grafico_funnel')
        );
        document.getElementById('exportEfficiency')?.addEventListener('click', () =>
            this.exportSectionToPDF('efficiencySection', 'indici_efficienza')
        );
        document.getElementById('exportTemporalFunnel')?.addEventListener('click', () =>
            this.exportSectionToPDF('temporalAnalysisSection', 'andamento_funnel')
        );
        document.getElementById('exportTemporalEconomic')?.addEventListener('click', () =>
            this.exportSectionToPDF('temporalEconomicAnalysisSection', 'andamento_economico')
        );

        this.setupModalHandlers();
        this.setupAggregationHandlers();
    }

    setupAggregationHandlers() {
        const funnelButtons = {
            weekly: document.getElementById('aggWeekly'),
            monthly: document.getElementById('aggMonthly'),
            annual: document.getElementById('aggAnnual')
        };
        Object.entries(funnelButtons).forEach(([agg, btn]) => {
            btn?.addEventListener('click', () => {
                if (this.currentFunnelAggregation === agg) return;
                this.currentFunnelAggregation = agg;
                Object.values(funnelButtons).forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.chartRenderer.renderTemporalFunnelChart();
            });
        });

        const economicButtons = {
            monthly: document.getElementById('aggMonthlyEco'),
            annual: document.getElementById('aggAnnualEco')
        };
        Object.entries(economicButtons).forEach(([agg, btn]) => {
            btn?.addEventListener('click', () => {
                if (this.currentEconomicAggregation === agg) return;
                this.currentEconomicAggregation = agg;
                Object.values(economicButtons).forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.chartRenderer.renderTemporalEconomicChart();
            });
        });
    }

    startDateTime() {
        const update = () => {
            const now = new Date();
            const date = now.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
            const time = now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
            document.getElementById('dateTimeValue').textContent = `${date}, ${time}`;
        };
        update();
        this.dateTimeInterval = setInterval(update, 60000);
    }

    setupModalHandlers() {
        const modalBindings = [
            { btn: 'drillDownBtn', close: 'closeModal', modal: 'drillDownModal', open: () => this.openDrillDownModal() },
            { btn: 'performanceDrillDownBtn', close: 'closePerformanceModal', modal: 'performanceModal', open: () => this.openPerformanceModal() }
        ];

        modalBindings.forEach(({ btn, close, modal, open }) => {
            document.getElementById(btn)?.addEventListener('click', open);
            document.getElementById(close)?.addEventListener('click', () => this.closeModal(modal));
            document.getElementById(modal)?.addEventListener('click', (e) => {
                if (e.target.id === modal) this.closeModal(modal);
            });
        });
    }

    toggleDebug() {
        CONFIG.DEBUG_MODE = !CONFIG.DEBUG_MODE;
        document.getElementById('debugPanel').style.display = CONFIG.DEBUG_MODE ? 'block' : 'none';
        this.logger.log(`Debug mode ${CONFIG.DEBUG_MODE ? 'attivato' : 'disattivato'}`, 'info');
    }

    processData() {
        try {
            this.logger.log('📊 Inizio elaborazione dati', 'success');
            this.data.filtered.leadByPeriod = JSON.parse(JSON.stringify(this.data.original.lead));
            this.data.filtered.leadFullyFiltered = JSON.parse(JSON.stringify(this.data.original.lead));
            this.data.filtered.campaigns = JSON.parse(JSON.stringify(this.data.original.campaigns));
            const leadData = this.dataProcessor.processLead(this.data.filtered.leadFullyFiltered);
            const campaignData = this.dataProcessor.processCampaigns(this.data.filtered.campaigns);
            this.dataProcessor.calculateMetrics(leadData, campaignData);
            this.filterManager.populate();
            this.render();
            this.showFilters();
            this.updateStatus('Dashboard elaborata con successo', 'success');
            document.getElementById('dateTimeDisplay').classList.remove('hidden');

            document.getElementById('exportFullDashboard').disabled = false;

            this.logger.log('✅ Elaborazione completata', 'success');
        } catch (error) {
            this.logger.log(`❌ Errore: ${error.message}`, 'error');
            console.error('Stack trace:', error);
            alert(`Errore durante l'elaborazione: ${error.message}`);
        }
    }

    render() {
        this.chartRenderer.renderAll();
        this.tableRenderer.render();
        this.renderKPIs();
        this.renderEfficiencyIndices();
        this.renderInsights();
        document.getElementById('dashboardContent')?.classList.remove('hidden');
    }

    renderKPIs() {
        const { funnel, economic, advertising } = this.data.processed;
        this.updateElement('kpiTotalContacts', funnel.contatti?.toLocaleString());
        this.updateElement('kpiLeads', funnel.lead?.toLocaleString());
        this.updateElement('kpiProspects', funnel.prospect?.toLocaleString());
        this.updateElement('kpiClients', funnel.clienti?.toLocaleString());
        this.updateElement('kpiGhosts', funnel.ghost?.toLocaleString());
        this.updateElement('kpiNotWorked', funnel.nonLavorati?.toLocaleString());
        if (funnel.contatti > 0) {
            this.updateElement('kpiLeadsPerc', `${((funnel.lead / funnel.contatti) * 100).toFixed(1)}% dei contatti`);
            this.updateElement('kpiProspectsPerc', `${funnel.lead > 0 ? ((funnel.prospect / funnel.lead) * 100).toFixed(1) : '0.0'}% dei lead`);
            this.updateElement('kpiClientsPerc', `${funnel.prospect > 0 ? ((funnel.clienti / funnel.prospect) * 100).toFixed(1) : '0.0'}% dei prospect`);
            this.updateElement('kpiGhostsPerc', `${((funnel.ghost / funnel.contatti) * 100).toFixed(1)}% del totale`);
            this.updateElement('kpiNotWorkedPerc', `${((funnel.nonLavorati / funnel.contatti) * 100).toFixed(1)}% del totale`);
        }
        this.updateElement('kpiTotalValue', Utils.formatCurrency(economic.valoreVenduto));
        this.updateElement('kpiAvgValue', Utils.formatCurrency(economic.aov));
        this.updateElement('kpiAdSpend', Utils.formatCurrency(advertising.spesaTotale));
        this.updateElement('kpiROI', `${advertising.roi?.toFixed(2)}X`);
        this.updateElement('kpiContactValue', Utils.formatCurrency(advertising.valoreContatto));
        this.updateElement('kpiCPC', Utils.formatCurrency(advertising.cpcMedio));
        this.updateElement('kpiCPL', Utils.formatCurrency(advertising.cpl));
        this.updateElement('kpiCPO', Utils.formatCurrency(advertising.cpo));
        this.updateElement('kpiCPV', Utils.formatCurrency(advertising.cpvMedio));
        const roiElement = document.getElementById('kpiROI');
        if (roiElement) {
            roiElement.className = `text-2xl font-bold ${advertising.roi > 15 ? 'text-green-600' : advertising.roi > 5 ? 'text-yellow-600' : 'text-red-600'}`;
        }
    }

    renderEfficiencyIndices() {
        const { efficiency } = this.data.processed;
        if (!efficiency) return;
        this.updateElement('effContattiPerOfferta', efficiency.contattiPerOfferta.toLocaleString());
        this.updateElement('effContattiPerVendita', efficiency.contattiPerVendita.toLocaleString());
        this.updateElement('effLeadPerOfferta', efficiency.leadPerOfferta.toLocaleString());
        this.updateElement('effLeadPerVendita', efficiency.leadPerVendita.toLocaleString());
        this.updateElement('effOffertePerVendita', efficiency.offertePerVendita.toLocaleString());
        this.updateElement('effRateOC', `${efficiency.rateOC.toFixed(1)}%`);
        this.updateElement('effRateVC', `${efficiency.rateVC.toFixed(1)}%`);
        this.updateElement('effRateOL', `${efficiency.rateOL.toFixed(1)}%`);
        this.updateElement('effRateVL', `${efficiency.rateVL.toFixed(1)}%`);
        this.updateElement('effRateVO', `${efficiency.rateVO.toFixed(1)}%`);
    }

    renderInsights() {
        const insightsHtml = new InsightsGenerator(this.data.processed).generate();
        const container = document.getElementById('insightsContent');
        if (container) {
            container.innerHTML = insightsHtml.join('');
        }
    }

    showFilters() {
        document.getElementById('filtersSection').style.display = 'block';
    }

    updateStatus(message, type = 'info') {
        const status = document.getElementById('dataStatus');
        if (status) {
            const colors = { success: 'bg-green-500/80', warning: 'bg-yellow-500/80', error: 'bg-red-500/80', info: 'bg-blue-500/80' };
            status.innerHTML = `<i class="fas fa-circle text-white"></i> ${message}`;
            status.className = `status-indicator ${colors[type]} px-3 py-1 rounded-full text-sm text-white`;
        }
    }

    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element && value !== undefined && value !== null) {
            element.textContent = value;
        }
    }

    openDrillDownModal() {
        new ModalRenderer(this).renderDrillDown();
        document.getElementById('drillDownModal').classList.remove('hidden');
    }

    openPerformanceModal() {
        new ModalRenderer(this).renderPerformance();
        document.getElementById('performanceModal').classList.remove('hidden');
    }

    closeModal(modalId) {
        document.getElementById(modalId).classList.add('hidden');
    }

    exportCSV() {
        try {
            const exporter = new DataExporter(this.data.processed.performance);
            exporter.toCSV('performance_dettagliata_per_fonte.csv');
            this.logger.log('✅ CSV esportato', 'success');
        } catch (error) {
            this.logger.log(`❌ Errore export CSV: ${error.message}`, 'error');
            alert('Errore durante l\'esportazione CSV');
        }
    }

    exportSectionToPDF(elementId, filename) {
        const buttonId = `export${elementId.charAt(0).toUpperCase() + elementId.slice(1)}`;
        const exportButton = document.getElementById(buttonId) || document.getElementById('exportPDF');
        const originalText = exportButton.innerHTML;

        this.logger.log(`🚀 Inizio esportazione PDF per #${elementId}...`, 'info');

        exportButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Esportazione...';
        exportButton.disabled = true;

        const elementToCapture = document.getElementById(elementId);
        if (!elementToCapture) {
            this.logger.log(`❌ Elemento #${elementId} non trovato`, 'error');
            alert(`Errore: Impossibile trovare la sezione da esportare.`);
            exportButton.innerHTML = originalText;
            exportButton.disabled = false;
            return;
        }

        html2canvas(elementToCapture, { scale: 2, useCORS: true }).then(canvas => {
            try {
                const imgData = canvas.toDataURL('image/png');
                const { jsPDF } = window.jspdf;

                const pdf = new jsPDF({
                    orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
                    unit: 'mm',
                    format: 'a4'
                });

                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();
                const canvasAspectRatio = canvas.width / canvas.height;

                let imgWidth = pdfWidth - 20;
                let imgHeight = imgWidth / canvasAspectRatio;

                if (imgHeight > pdfHeight - 20) {
                    imgHeight = pdfHeight - 20;
                    imgWidth = imgHeight * canvasAspectRatio;
                }

                const x = (pdfWidth - imgWidth) / 2;
                const y = (pdfHeight - imgHeight) / 2;

                pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
                pdf.save(`${filename}_${new Date().toISOString().slice(0,10)}.pdf`);

                this.logger.log(`✅ PDF per #${elementId} esportato`, 'success');
            } catch (error) {
                this.logger.log(`❌ Errore PDF: ${error.message}`, 'error');
                alert('Si è verificato un errore durante la creazione del PDF.');
            } finally {
                exportButton.innerHTML = originalText;
                exportButton.disabled = false;
            }
        });
    }

    async exportFullDashboardPDF() {
        const exportButton = document.getElementById('exportFullDashboard');
        if (!exportButton || exportButton.disabled) return;

        const originalText = exportButton.innerHTML;
        exportButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Generazione Report...';
        exportButton.disabled = true;
        this.logger.log('🚀 Inizio esportazione PDF completo v50...', 'info');

        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const margin = 15;

        const reportLayout = [
            { page: 1, sections: ['funnelKpiSection', 'economicKpiSection', 'advertisingKpiSection'], layout: 'center-stack' },
            { page: 2, sections: ['funnelChartSection', 'conversionChartSection', 'efficiencySection'], layout: 'stack-scaled' },
            { page: 3, sections: ['temporalAnalysisSection', 'temporalEconomicAnalysisSection'], layout: 'center-stack' },
            { page: 4, sections: ['performanceChartSection', 'performanceTableSection', 'insightsPanel'], layout: 'stack' }
        ];

        try {
            for (let i = 0; i < reportLayout.length; i++) {
                const pageConfig = reportLayout[i];
                if (i > 0) {
                    pdf.addPage();
                }

                let currentPageY = margin;
                if (i === 0) {
                    pdf.setFontSize(18);
                    pdf.setFont('helvetica', 'bold');
                    pdf.text('Dashboard - Centro di Comando CRM', pdfWidth / 2, currentPageY, { align: 'center' });
                    pdf.setFontSize(12);
                    pdf.setFont('helvetica', 'normal');
                    pdf.text('ROI e Performance Analysis', pdfWidth / 2, currentPageY + 8, { align: 'center' });
                    currentPageY += 25;
                }

                const canvases = [];
                for (const elementId of pageConfig.sections) {
                    const element = document.getElementById(elementId);
                    if (element) {
                        this.logger.log(`📸 Cattura sezione per pagina ${i + 1}: #${elementId}`, 'info');
                        canvases.push(await html2canvas(element, { scale: 2, useCORS: true }));
                    } else {
                        this.logger.log(`⚠️ Sezione #${elementId} non trovata, saltata.`, 'warning');
                    }
                }

                let totalHeight = 0;
                const sectionSpacing = 5;

                if (pageConfig.layout === 'center-stack') {
                    totalHeight = canvases.reduce((sum, canvas) => {
                        const imgWidth = pdfWidth - (margin * 2);
                        const imgHeight = (imgWidth / canvas.width) * canvas.height;
                        return sum + imgHeight + sectionSpacing;
                    }, 0) - sectionSpacing;
                    currentPageY = (pdfHeight - totalHeight) / 2;
                }

                for (const canvas of canvases) {
                    let imgWidth = pdfWidth - (margin * 2);
                    if (pageConfig.layout === 'stack-scaled') {
                        imgWidth *= 0.8;
                    }

                    const imgHeight = (imgWidth / canvas.width) * canvas.height;
                    const x = (pdfWidth - imgWidth) / 2;

                    if (currentPageY + imgHeight > pdfHeight - margin && canvases.indexOf(canvas) > 0) {
                        pdf.addPage();
                        currentPageY = margin;
                    }

                    const imgData = canvas.toDataURL('image/png');
                    pdf.addImage(imgData, 'PNG', x, currentPageY, imgWidth, imgHeight);
                    currentPageY += imgHeight + sectionSpacing;
                }
            }

            pdf.save(`report_dashboard_completo_v50_${new Date().toISOString().slice(0,10)}.pdf`);
            this.logger.log('✅ Report PDF v50 completo esportato con successo.', 'success');

        } catch (error) {
            this.logger.log(`❌ Errore durante la generazione del PDF completo: ${error.message}`, 'error');
            console.error(error);
            alert('Si è verificato un errore durante la creazione del report completo.');
        } finally {
            exportButton.innerHTML = originalText;
            exportButton.disabled = false;
        }
    }
}

// ========================================
// CLASSE LOGGER
// ========================================
class Logger {
    constructor() { this.entries = []; }
    log(message, type = 'info') {
        if (!CONFIG.DEBUG_MODE) return;
        const entry = { timestamp: new Date().toLocaleTimeString(), message, type };
        this.entries.push(entry);
        if (this.entries.length > CONFIG.MAX_DEBUG_ENTRIES) this.entries.shift();
        this.render();
    }
    render() {
        const container = document.getElementById('debugContent');
        if (!container) return;
        const className = { error: 'debug-error', success: 'debug-success', warning: 'debug-warning' };
        container.innerHTML = this.entries.map(entry => `<div class="debug-section ${className[entry.type] || ''}">[${entry.timestamp}] ${entry.message}</div>`).join('');
        container.scrollTop = container.scrollHeight;
    }
}

// ========================================
// CLASSE FILTER MANAGER
// ========================================
class FilterManager {
    constructor(app) { this.app = app; this.setupEventListeners(); }
    setupEventListeners() {
        document.getElementById('filterPeriodo')?.addEventListener('change', (e) => this.handlePeriodChange(e.target.value));
        const filterIds = ['filterFonte', 'filterMezzo', 'filterPuntoVendita', 'filterRiattivazione', 'filterPersonType', 'dateStart', 'dateEnd'];
        filterIds.forEach(id => { document.getElementById(id)?.addEventListener('change', () => this.updateCounter()); });
    }
    handlePeriodChange(value) {
        const customInputs = document.getElementById('customDateInputs');
        customInputs.classList.toggle('show', value === 'custom');
        if (value !== 'tutto' && value !== 'custom') {
            const today = new Date();
            const startDate = new Date(today);
            startDate.setDate(today.getDate() - parseInt(value));
            document.getElementById('dateStart').value = startDate.toISOString().split('T')[0];
            document.getElementById('dateEnd').value = today.toISOString().split('T')[0];
        }
        this.updateCounter();
    }
    updateCounter() {
        let total = 0;
        if (document.getElementById('filterPeriodo').value !== 'tutto') total++;
        ['filterFonte', 'filterMezzo', 'filterPuntoVendita', 'filterRiattivazione', 'filterPersonType'].forEach(id => {
            const select = document.getElementById(id);
            if (select?.value !== '') total++;
        });
        const indicator = document.getElementById('filtersActiveIndicator');
        const count = document.getElementById('filtersActiveCount');
        if (total > 0) { indicator.classList.remove('hidden'); count.textContent = total; }
        else { indicator.classList.add('hidden'); }
    }
    populate() {
        if (!this.app.data.original.lead) return;
        this.app.logger.log('🎛️ Popolamento filtri...', 'info');
        const headers = this.app.data.original.lead[0];
        const rows = this.app.data.original.lead.slice(1);
        const indices = {
            fonte: headers.findIndex(h => h.toLowerCase().includes('fonte')),
            mezzo: headers.findIndex(h => h.toLowerCase().includes('mezzo')),
            personType: headers.findIndex(h => h.toLowerCase().includes('person') && h.toLowerCase().includes('type'))
        };
        this.app.filters.options.fonti.clear();
        this.app.filters.options.mezzi.clear();
        this.app.filters.options.personTypes.clear();
        rows.forEach(row => {
            if (indices.fonte >= 0 && row[indices.fonte]) this.app.filters.options.fonti.add(row[indices.fonte].trim());
            if (indices.mezzo >= 0 && row[indices.mezzo]) this.app.filters.options.mezzi.add(row[indices.mezzo].trim());
            if (indices.personType >= 0 && row[indices.personType]) this.app.filters.options.personTypes.add(row[indices.personType].trim());
        });
        this.populateDropdown('filterFonte', Array.from(this.app.filters.options.fonti).sort());
        this.populateDropdown('filterMezzo', Array.from(this.app.filters.options.mezzi).sort());
        this.populateDropdown('filterPersonType', Array.from(this.app.filters.options.personTypes).sort());
        this.app.logger.log(`✅ Filtri popolati: ${this.app.filters.options.fonti.size} fonti`, 'success');
    }
    populateDropdown(selectId, options) {
        const select = document.getElementById(selectId);
        if (!select) return;
        const firstOption = select.children[0];
        select.innerHTML = '';
        select.appendChild(firstOption);
        options.forEach(option => {
            const opt = document.createElement('option');
            opt.value = option;
            opt.textContent = option;
            select.appendChild(opt);
        });
    }
    apply() {
        this.app.logger.log('✅ Applicazione filtri...', 'info');
        const state = this.app.filters.state;
        state.periodo = document.getElementById('filterPeriodo').value;
        state.dateStart = document.getElementById('dateStart').value;
        state.dateEnd = document.getElementById('dateEnd').value;
        state.fonte = document.getElementById('filterFonte').value;
        state.mezzo = document.getElementById('filterMezzo').value;
        state.puntoVendita = document.getElementById('filterPuntoVendita').value;
        state.riattivazione = document.getElementById('filterRiattivazione').value;
        state.personType = document.getElementById('filterPersonType').value;
        state.active = true;
        this.app.data.filtered.leadByPeriod = this.filterLeadByPeriod(this.app.data.original.lead);
        this.app.data.filtered.campaigns = this.filterCampaignsByPeriod(this.app.data.original.campaigns);
        this.app.data.filtered.leadFullyFiltered = this.filterByAllCriteria(this.app.data.original.lead);
        const leadDataForFunnel = this.app.dataProcessor.processLead(this.app.data.filtered.leadFullyFiltered);
        const leadDataForPerformance = this.app.dataProcessor.processLead(this.app.data.filtered.leadByPeriod);
        const campaignData = this.app.dataProcessor.processCampaigns(this.app.data.filtered.campaigns);
        this.app.dataProcessor.calculateFunnel(leadDataForFunnel);
        this.app.dataProcessor.calculateEconomic(leadDataForFunnel);
        this.app.dataProcessor.calculateAdvertising(leadDataForPerformance, campaignData);
        this.app.dataProcessor.calculateSourcePerformance(leadDataForPerformance, campaignData);
        this.app.dataProcessor.calculateConversionRates();
        this.app.dataProcessor.calculatePerformanceBubbles();
        this.app.dataProcessor.calculateEfficiencyIndices();
        this.app.dataProcessor.calculateTemporalData(leadDataForFunnel, campaignData);
        this.app.render();
        this.app.logger.log('✅ Filtri applicati correttamente', 'success');
    }
    filterLeadByPeriod(data) {
        if (!data || this.app.filters.state.periodo === 'tutto') return data;
        const headers = data[0];
        const rows = data.slice(1);
        const dateIndex = headers.findIndex(h => h.toLowerCase().includes('data richiesta') || h.toLowerCase().includes('data contatto'));
        if (dateIndex === -1) { this.app.logger.log('⚠️ Colonna "Data Richiesta" non trovata in Lead, skip filtro periodo', 'warning'); return data; }
        const { dateStart, dateEnd } = this.app.filters.state;
        if (!dateStart || !dateEnd) return data;
        const startDate = new Date(dateStart); startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(dateEnd); endDate.setHours(23, 59, 59, 999);
        const filteredRows = rows.filter(row => {
            const cellValue = (row[dateIndex] || '').trim();
            if (!cellValue) return false;
            const rowDate = Utils.parseItalianDate(cellValue);
            if (!rowDate) { this.app.logger.log(`⚠️ Data invalida ignorata: "${cellValue}"`, 'warning'); return false; }
            return rowDate >= startDate && rowDate <= endDate;
        });
        return [headers, ...filteredRows];
    }
    filterCampaignsByPeriod(data) {
        if (!data || this.app.filters.state.periodo === 'tutto') return data;
        const headers = data[0];
        const rows = data.slice(1);
        const yearMonthIndex = headers.findIndex(h => h.toLowerCase().includes('anno') && h.toLowerCase().includes('mese'));
        if (yearMonthIndex === -1) { this.app.logger.log('⚠️ Colonna "Anno/Mese" non trovata in Campaigns, skip filtro periodo', 'warning'); return data; }
        const { dateStart, dateEnd } = this.app.filters.state;
        if (!dateStart || !dateEnd) return data;
        const startDate = new Date(dateStart); const endDate = new Date(dateEnd);
        const startYearMonth = { year: startDate.getFullYear(), month: startDate.getMonth() + 1 };
        const endYearMonth = { year: endDate.getFullYear(), month: endDate.getMonth() + 1 };
        const filteredRows = rows.filter(row => {
            const cellValue = (row[yearMonthIndex] || '').trim();
            if (cellValue.toLowerCase().includes('totale') || cellValue.toLowerCase().includes('ultimi') || cellValue.toLowerCase().includes('progressiv')) return false;
            if (!cellValue) return false;
            const parsed = Utils.parseYearMonth(cellValue);
            if (!parsed) { this.app.logger.log(`⚠️ Anno/Mese invalido ignorato: "${cellValue}"`, 'warning'); return false; }
            const rowYearMonth = parsed.year * 12 + parsed.month;
            const startYM = startYearMonth.year * 12 + startYearMonth.month;
            const endYM = endYearMonth.year * 12 + endYearMonth.month;
            return rowYearMonth >= startYM && rowYearMonth <= endYM;
        });
        return [headers, ...filteredRows];
    }
    filterByAllCriteria(data) {
        if (!data) return data;
        const headers = data[0];
        const rows = data.slice(1);
        let filteredRows = rows;
        const dateIndex = headers.findIndex(h => h.toLowerCase().includes('data richiesta') || h.toLowerCase().includes('data contatto'));
        if (this.app.filters.state.periodo !== 'tutto' && dateIndex >= 0) {
            const { dateStart, dateEnd } = this.app.filters.state;
            if (dateStart && dateEnd) {
                const startDate = new Date(dateStart); startDate.setHours(0, 0, 0, 0);
                const endDate = new Date(dateEnd); endDate.setHours(23, 59, 59, 999);
                filteredRows = filteredRows.filter(row => {
                    const cellValue = (row[dateIndex] || '').trim();
                    if (!cellValue) return false;
                    const rowDate = Utils.parseItalianDate(cellValue);
                    if (!rowDate) return false;
                    return rowDate >= startDate && rowDate <= endDate;
                });
            }
        }
        const indices = {
            fonte: headers.findIndex(h => h.toLowerCase().includes('fonte')),
            mezzo: headers.findIndex(h => h.toLowerCase().includes('mezzo')),
            personType: headers.findIndex(h => h.toLowerCase().includes('person') && h.toLowerCase().includes('type')),
            riattivazione: headers.findIndex(h => h.toLowerCase().includes('riattivazione') || h.toLowerCase().includes('riattivabile')),
            puntoVendita: headers.findIndex(h => h.toLowerCase().includes('punto') && h.toLowerCase().includes('vendita'))
        };
        const state = this.app.filters.state;
        filteredRows = filteredRows.filter(row => {
            if (state.fonte && indices.fonte >= 0 && (row[indices.fonte] || '').trim().toLowerCase() !== state.fonte.toLowerCase()) return false;
            if (state.mezzo && indices.mezzo >= 0 && (row[indices.mezzo] || '').trim().toLowerCase() !== state.mezzo.toLowerCase()) return false;
            if (state.personType && indices.personType >= 0 && (row[indices.personType] || '').trim().toLowerCase() !== state.personType.toLowerCase()) return false;
            if (state.puntoVendita && indices.puntoVendita >= 0 && (row[indices.puntoVendita] || '').trim().toLowerCase() !== state.puntoVendita.toLowerCase()) return false;
            if (state.riattivazione && indices.riattivazione >= 0) {
                const cellValue = (row[indices.riattivazione] || '').trim().toLowerCase();
                const isTrue = ['true', 'vero', '1', 'sì', 'si'].includes(cellValue);
                const isFalse = ['false', 'falso', '0', 'no'].includes(cellValue);
                if (state.riattivazione === 'VERO' && !isTrue) return false;
                if (state.riattivazione === 'FALSO' && !isFalse) return false;
            }
            return true;
        });
        return [headers, ...filteredRows];
    }
    reset() {
        this.app.logger.log('🔄 Reset filtri...', 'info');
        document.getElementById('filterPeriodo').value = 'tutto';
        document.getElementById('customDateInputs').classList.remove('show');
        document.getElementById('dateStart').value = '';
        document.getElementById('dateEnd').value = '';
        ['filterFonte', 'filterMezzo', 'filterPuntoVendita', 'filterRiattivazione', 'filterPersonType'].forEach(id => {
            const select = document.getElementById(id);
            if (select) select.value = '';
        });
        Object.keys(this.app.filters.state).forEach(key => { this.app.filters.state[key] = key === 'periodo' ? 'tutto' : (key === 'active' ? false : ''); });
        this.app.data.filtered.leadByPeriod = this.app.data.original.lead;
        this.app.data.filtered.leadFullyFiltered = this.app.data.original.lead;
        this.app.data.filtered.campaigns = this.app.data.original.campaigns;
        this.updateCounter();
        const leadData = this.app.dataProcessor.processLead(this.app.data.original.lead);
        const campaignData = this.app.dataProcessor.processCampaigns(this.app.data.original.campaigns);
        this.app.dataProcessor.calculateMetrics(leadData, campaignData);
        this.app.render();
        this.app.logger.log('✅ Filtri resettati', 'success');
    }
}

// ========================================
// CLASSE DATA PROCESSOR
// ========================================
class DataProcessor {
    constructor(app) { this.app = app; }
    processLead(leadDataRaw) {
        if (!leadDataRaw || leadDataRaw.length < 2) return [];
        const [headers, ...rows] = leadDataRaw;
        const getIndex = (terms) => headers.findIndex(h => terms.some(term => h.toLowerCase().includes(term.toLowerCase())));
        const valoreVendutoIndex = headers.findIndex(h => h === 'Valore del Venduto');
        const indices = {
            contattato: getIndex(['contattato']), offerta: getIndex(['offerta']), venduto: getIndex(['venduto']),
            valore: valoreVendutoIndex >= 0 ? valoreVendutoIndex : getIndex(['valore']),
            fonte: getIndex(['fonte']), data: getIndex(['data richiesta', 'data contatto'])
        };
        return rows.map(row => {
            const contattato = (row[indices.contattato] || '').toString().trim().toLowerCase();
            const offerta = (row[indices.offerta] || '').toString().trim().toLowerCase();
            const vendutoRaw = (row[indices.venduto] || '').toString().trim();
            const valoreRaw = (row[indices.valore] || '').toString().trim();
            const vendutoLower = vendutoRaw.toLowerCase().replace(/\s/g, '');
            const isVenduto = ['si', 'sì', 'yes'].includes(vendutoLower);
            const valore = isVenduto ? Utils.parseItalianCurrency(valoreRaw) : 0;
            return {
                contattato, offerta, venduto: vendutoRaw, valore,
                fonte: row[indices.fonte] || 'Sconosciuta',
                data: Utils.parseItalianDate(row[indices.data]),
                isLead: ['si', 'sì', 'yes'].includes(contattato.replace(/\s/g, '')),
                isProspect: ['si', 'sì', 'yes'].includes(offerta.replace(/\s/g, '')),
                isCliente: isVenduto,
                isGhost: ['no', 'n'].includes(contattato),
                isNonLavorato: contattato === '' || contattato === 'pending'
            };
        });
    }
    processCampaigns(campaignsDataRaw) {
        if (!campaignsDataRaw || campaignsDataRaw.length < 2) return [];
        const [headers, ...rows] = campaignsDataRaw;
        const getIndex = (terms) => headers.findIndex(h => terms.some(term => h.toLowerCase().includes(term.toLowerCase())));
        const indices = {
            annoMese: 0, costo: getIndex(['costo piattaforme']), cpc: getIndex(['cpc']),
            contatti: getIndex(['nº contatti']), roi: getIndex(['roi']), fatturato: getIndex(['fatturato'])
        };
        return rows
            .filter(row => {
                const annoMese = (row[indices.annoMese] || '').trim();
                return annoMese && !annoMese.toLowerCase().includes('totale') && !annoMese.toLowerCase().includes('ultimi') && !annoMese.toLowerCase().includes('progressiv');
            })
            .map(row => ({
                annoMese: Utils.parseYearMonth(row[indices.annoMese]),
                spesa: Utils.parseItalianCurrency(row[indices.costo]),
                cpc: Utils.parseItalianCurrency(row[indices.cpc]),
                contatti: parseFloat(row[indices.contatti]) || 0,
                roi: parseFloat(row[indices.roi]) || 0,
                fatturato: Utils.parseItalianCurrency(row[indices.fatturato])
            }));
    }
    calculateMetrics(leadData, campaignData) {
        this.calculateFunnel(leadData);
        this.calculateEconomic(leadData);
        this.calculateAdvertising(leadData, campaignData);
        this.calculateSourcePerformance(leadData, campaignData);
        this.calculateConversionRates();
        this.calculatePerformanceBubbles();
        this.calculateEfficiencyIndices();
        this.calculateTemporalData(leadData, campaignData);
    }
    calculateFunnel(leadData) {
        this.app.data.processed.funnel = {
            contatti: leadData.length,
            lead: leadData.filter(r => r.isLead).length,
            prospect: leadData.filter(r => r.isProspect).length,
            clienti: leadData.filter(r => r.isCliente).length,
            ghost: leadData.filter(r => r.isGhost).length,
            nonLavorati: leadData.filter(r => r.isNonLavorato).length
        };
    }
    calculateEconomic(leadData) {
        const valoreVenduto = leadData.reduce((sum, r) => sum + r.valore, 0);
        const clienti = this.app.data.processed.funnel.clienti;
        this.app.data.processed.economic = { valoreVenduto, aov: clienti > 0 ? valoreVenduto / clienti : 0 };
    }
    calculateAdvertising(leadData, campaignData) {
        const validCampaigns = campaignData.filter(c => c.annoMese);
        const spesaTotale = validCampaigns.reduce((sum, r) => sum + r.spesa, 0);
        const leadCountForCPL = leadData.filter(r => r.isLead).length;
        const prospectCountForCPO = leadData.filter(r => r.isProspect).length;
        const clientiCountForCPV = leadData.filter(r => r.isCliente).length;
        const contattiCountForCPC = leadData.length;
        const fatturatoCalcolato = leadData.reduce((sum, r) => sum + r.valore, 0);
        const roiCalcolato = spesaTotale > 0 ? (fatturatoCalcolato - spesaTotale) / spesaTotale : 0;
        this.app.data.processed.advertising = {
            spesaTotale, roi: roiCalcolato,
            valoreContatto: contattiCountForCPC > 0 ? fatturatoCalcolato / contattiCountForCPC : 0,
            cpcMedio: contattiCountForCPC > 0 ? spesaTotale / contattiCountForCPC : 0,
            cpl: leadCountForCPL > 0 ? spesaTotale / leadCountForCPL : 0,
            cpo: prospectCountForCPO > 0 ? spesaTotale / prospectCountForCPO : 0,
            cpvMedio: clientiCountForCPV > 0 ? spesaTotale / clientiCountForCPV : 0
        };
    }
    calculateEfficiencyIndices() {
        const { contatti, lead, prospect, clienti } = this.app.data.processed.funnel;
        this.app.data.processed.efficiency = {
            contattiPerOfferta: prospect > 0 ? Math.round(contatti / prospect) : 0,
            contattiPerVendita: clienti > 0 ? Math.round(contatti / clienti) : 0,
            leadPerOfferta: prospect > 0 ? Math.round(lead / prospect) : 0,
            leadPerVendita: clienti > 0 ? Math.round(lead / clienti) : 0,
            offertePerVendita: clienti > 0 ? Math.round(prospect / clienti) : 0,
            rateOC: contatti > 0 ? (prospect / contatti) * 100 : 0,
            rateVC: contatti > 0 ? (clienti / contatti) * 100 : 0,
            rateOL: lead > 0 ? (prospect / lead) * 100 : 0,
            rateVL: lead > 0 ? (clienti / lead) * 100 : 0,
            rateVO: prospect > 0 ? (clienti / prospect) * 100 : 0,
        };
    }
    calculateTemporalData(leadData, campaignData) {
        const weekly = {}, monthly = {}, annual = {};
        leadData.forEach(row => {
            if (!row.data) return;
            const date = row.data;
            const weekKey = Utils.getWeekKey(date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const yearKey = date.getFullYear().toString();
            [weekly, monthly, annual].forEach(agg => {
                const key = agg === weekly ? weekKey : (agg === monthly ? monthKey : yearKey);
                if (!agg[key]) agg[key] = { contatti: 0, lead: 0, prospect: 0, clienti: 0, fatturato: 0 };
                agg[key].contatti++;
                if (row.isLead) agg[key].lead++;
                if (row.isProspect) agg[key].prospect++;
                if (row.isCliente) { agg[key].clienti++; agg[key].fatturato += row.valore; }
            });
        });
        campaignData.forEach(row => {
            if (!row.annoMese) return;
            const monthKey = `${row.annoMese.year}-${String(row.annoMese.month).padStart(2, '0')}`;
            const yearKey = row.annoMese.year.toString();
            if (monthly[monthKey]) monthly[monthKey].spesa = (monthly[monthKey].spesa || 0) + row.spesa;
            else monthly[monthKey] = { contatti: 0, lead: 0, prospect: 0, clienti: 0, fatturato: 0, spesa: row.spesa };
            if (annual[yearKey]) annual[yearKey].spesa = (annual[yearKey].spesa || 0) + row.spesa;
            else annual[yearKey] = { contatti: 0, lead: 0, prospect: 0, clienti: 0, fatturato: 0, spesa: row.spesa };
        });
        [monthly, annual].forEach(agg => {
            Object.values(agg).forEach(period => {
                period.roi = period.spesa > 0 ? (period.fatturato - period.spesa) / period.spesa : 0;
            });
        });
        this.app.data.processed.temporal = { weekly, monthly, annual };
    }
    calculateSourcePerformance(leadData, campaignData) {
        const sourceStats = {};
        leadData.forEach(row => {
            const fonte = row.fonte.toLowerCase();
            if (!sourceStats[fonte]) sourceStats[fonte] = { contatti: 0, lead: 0, prospect: 0, clienti: 0, valore: 0, spesa: 0, roi: 0, ghost: 0, nomeOriginale: row.fonte };
            sourceStats[fonte].contatti++;
            if (row.isLead) sourceStats[fonte].lead++;
            if (row.isProspect) sourceStats[fonte].prospect++;
            if (row.isCliente) { sourceStats[fonte].clienti++; sourceStats[fonte].valore += row.valore; }
            if (row.isGhost) sourceStats[fonte].ghost++;
        });
        campaignData.forEach(campaign => {
            if (!campaign.annoMese) return;
            const fonte = `${campaign.annoMese.year}/${campaign.annoMese.month}`;
            if (fonte.includes('totale') || fonte === '' || campaign.spesa === 0) return;
            if (!sourceStats[fonte]) sourceStats[fonte] = { contatti: 0, lead: 0, prospect: 0, clienti: 0, valore: 0, spesa: 0, roi: 0, ghost: 0, nomeOriginale: fonte };
            sourceStats[fonte].spesa += campaign.spesa;
        });
        Object.values(sourceStats).forEach(stats => { if (stats.spesa > 0) stats.roi = (stats.valore - stats.spesa) / stats.spesa; });
        this.app.data.processed.performance = sourceStats;
    }
    calculateConversionRates() {
        const f = this.app.data.processed.funnel;
        this.app.data.processed.conversionRates = {
            ghostPercentage: f.contatti > 0 ? (f.ghost / f.contatti) * 100 : 0,
            contattiToLead: f.contatti > 0 ? (f.lead / f.contatti) * 100 : 0,
            contattiToProspect: f.contatti > 0 ? (f.prospect / f.contatti) * 100 : 0,
            leadToProspect: f.lead > 0 ? (f.prospect / f.lead) * 100 : 0,
            prospectToClienti: f.prospect > 0 ? (f.clienti / f.prospect) * 100 : 0,
            conversioneTotale: f.contatti > 0 ? (f.clienti / f.contatti) * 100 : 0
        };
    }
    calculatePerformanceBubbles() {
        const performance = this.app.data.processed.performance;
        const bubbleData = [];
        Object.entries(performance)
            .filter(([fonte, stats]) => !fonte.includes('totale') && stats.contatti > 0)
            .forEach(([fonte, stats], index) => {
                const conversione = stats.contatti > 0 ? ((stats.clienti / stats.contatti) * 100) : 0;
                const aov = stats.clienti > 0 ? stats.valore / stats.clienti : 0;
                bubbleData.push({
                    x: stats.contatti, y: conversione, r: Math.sqrt(stats.valore / 1000),
                    fonte: stats.nomeOriginale || fonte, fatturato: stats.valore, aov: aov,
                    backgroundColor: CONFIG.GENERIC_CHART_COLORS[index % CONFIG.GENERIC_CHART_COLORS.length],
                    borderColor: CONFIG.GENERIC_CHART_COLORS[index % CONFIG.GENERIC_CHART_COLORS.length]
                });
            });
        this.app.data.processed.performanceBubbles = bubbleData;
    }
}

// ========================================
// CLASSE UTILS
// ========================================
class Utils {
    static parseItalianCurrency(value) {
        if (!value || value === '' || value === '-') return 0;
        const cleaned = String(value).trim().replace(/€/g, '').replace(/\s/g, '').replace(/\./g, '').replace(/,/g, '.');
        const num = parseFloat(cleaned);
        return isNaN(num) ? 0 : num;
    }
    static parseItalianDate(dateStr) {
        if (!dateStr || dateStr.trim() === '') return null;
        const cleaned = dateStr.trim();
        const parts = cleaned.split(/[\/\-]/);
        if (parts.length === 3) {
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const year = parseInt(parts[2], 10);
            if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
                const date = new Date(year, month, day);
                if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) return date;
            }
        }
        const isoDate = new Date(cleaned);
        if (!isNaN(isoDate.getTime())) return isoDate;
        return null;
    }
    static parseYearMonth(yearMonthStr) {
        if (!yearMonthStr || yearMonthStr.trim() === '') return null;
        const cleaned = yearMonthStr.trim();
        const parts = cleaned.split('/');
        if (parts.length === 2) {
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10);
            if (!isNaN(year) && !isNaN(month) && month >= 1 && month <= 12) return { year, month };
        }
        return null;
    }
    static getWeekKey(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
    }
    static formatCurrency(value) { return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value); }
    static getConversionColor(percentage, isGhost = false) {
        if (isGhost) {
            if (percentage > CONFIG.GHOST_THRESHOLDS.WARNING) return '#dc2626';
            if (percentage >= CONFIG.GHOST_THRESHOLDS.EXCELLENT) return '#f59e0b';
            return '#10b981';
        }
        if (percentage < 20) return '#ef4444';
        if (percentage <= 40) return '#f59e0b';
        return '#10b981';
    }
    static getPerformanceBadgeClass(percentage) {
        const value = parseFloat(percentage);
        const t = CONFIG.PERFORMANCE_THRESHOLDS;
        if (value >= t.GOOD) return 'badge-excellent';
        if (value >= t.MEDIUM) return 'badge-good';
        if (value >= t.LOW) return 'badge-medium';
        if (value >= t.CRITICAL) return 'badge-low';
        return 'badge-critical';
    }
    static getDataColorClass(columnType) {
        const classes = { contatti: 'data-contatti', lead: 'data-lead', prospect: 'data-prospect', clienti: 'data-clienti', fatturato: 'data-fatturato' };
        return classes[columnType] || '';
    }
    static calculateTotals(performance) {
        const totali = { contatti: 0, lead: 0, prospect: 0, clienti: 0, valore: 0, ghost: 0 };
        Object.entries(performance).forEach(([fonte, stats]) => {
            if (!fonte.includes('totale') && stats.contatti > 0) Object.keys(totali).forEach(key => totali[key] += stats[key] || 0);
        });
        return totali;
    }
}

// ========================================
// CLASSE CHART RENDERER
// ========================================
class ChartRenderer {
    constructor(app) { this.app = app; }
    renderAll() { this.renderFunnel(); this.renderConversion(); this.renderPerformance(); this.renderTemporalFunnelChart(); this.renderTemporalEconomicChart(); }
    renderTemporalFunnelChart() {
        const agg = this.app.currentFunnelAggregation;
        const canvas = document.getElementById('temporalFunnelChart');
        if (!canvas) return;
        const temporalData = this.app.data.processed.temporal[agg];
        if (!temporalData) return;
        const sortedKeys = Object.keys(temporalData).sort();
        const datasets = [
            { label: 'Contatti', data: sortedKeys.map(k => temporalData[k].contatti), borderColor: CONFIG.CHART_COLORS.contatti, tension: 0.1, yAxisID: 'y' },
            { label: 'Lead', data: sortedKeys.map(k => temporalData[k].lead), borderColor: CONFIG.CHART_COLORS.lead, tension: 0.1, yAxisID: 'y' },
            { label: 'Prospect', data: sortedKeys.map(k => temporalData[k].prospect), borderColor: CONFIG.CHART_COLORS.prospect, tension: 0.1, yAxisID: 'y' },
            { label: 'Clienti', data: sortedKeys.map(k => temporalData[k].clienti), borderColor: CONFIG.CHART_COLORS.clienti, tension: 0.1, yAxisID: 'y' }
        ];
        if (this.app.charts.temporalFunnel) this.app.charts.temporalFunnel.destroy();
        this.app.charts.temporalFunnel = new Chart(canvas.getContext('2d'), {
            type: 'line', data: { labels: sortedKeys, datasets },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, title: { display: true, text: 'Conteggio' } } } }
        });
    }
    renderTemporalEconomicChart() {
        const agg = this.app.currentEconomicAggregation;
        const canvas = document.getElementById('temporalEconomicChart');
        if (!canvas) return;
        const temporalData = this.app.data.processed.temporal[agg];
        if (!temporalData) { if (this.app.charts.temporalEconomic) this.app.charts.temporalEconomic.destroy(); return; }
        const sortedKeys = Object.keys(temporalData).sort();
        const datasets = [
            { type: 'bar', label: 'Spesa', data: sortedKeys.map(k => temporalData[k].spesa || 0), backgroundColor: CONFIG.CHART_COLORS.spesa, yAxisID: 'y' },
            { type: 'bar', label: 'Fatturato', data: sortedKeys.map(k => temporalData[k].fatturato || 0), backgroundColor: CONFIG.CHART_COLORS.fatturato, yAxisID: 'y' },
            { type: 'line', label: 'N° Vendite', data: sortedKeys.map(k => temporalData[k].clienti || 0), borderColor: CONFIG.CHART_COLORS.vendite, tension: 0.1, yAxisID: 'y1' },
            { type: 'line', label: 'ROI', data: sortedKeys.map(k => temporalData[k].roi || 0), borderColor: CONFIG.CHART_COLORS.roi, tension: 0.1, yAxisID: 'y1' }
        ];
        if (this.app.charts.temporalEconomic) this.app.charts.temporalEconomic.destroy();
        this.app.charts.temporalEconomic = new Chart(canvas.getContext('2d'), {
            data: { labels: sortedKeys, datasets },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { tooltip: { callbacks: { label: function(context) {
                    let label = context.dataset.label || '';
                    if (label) label += ': ';
                    if (context.parsed.y !== null) {
                        if (label.includes('Spesa') || label.includes('Fatturato')) label += Utils.formatCurrency(context.parsed.y);
                        else if (label.includes('ROI')) label += `${context.parsed.y.toFixed(1)}X`;
                        else label += context.parsed.y;
                    }
                    return label;
                }}}},
                scales: {
                    y: { type: 'linear', position: 'left', beginAtZero: true, title: { display: true, text: 'Valore (€)' }, ticks: { callback: function(value) { return '€ ' + value.toLocaleString('it-IT'); }}},
                    y1: { type: 'linear', position: 'right', beginAtZero: true, title: { display: true, text: 'Conteggio / ROI (X)' }, grid: { drawOnChartArea: false }, ticks: { callback: function(value) { return Number.isInteger(value) ? value : value.toFixed(1); }}}
                }
            }
        });
    }
    renderFunnel() {
        const canvas = document.getElementById('funnelChart');
        if (!canvas) return;
        const { funnel } = this.app.data.processed;
        if (this.app.charts.funnel) this.app.charts.funnel.destroy();
        this.app.charts.funnel = new Chart(canvas.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['Contatti', 'Lead', 'Prospect', 'Clienti'],
                datasets: [{ label: 'Funnel', data: [funnel.contatti, funnel.lead, funnel.prospect, funnel.clienti], backgroundColor: [CONFIG.CHART_COLORS.contatti, CONFIG.CHART_COLORS.lead, CONFIG.CHART_COLORS.prospect, CONFIG.CHART_COLORS.clienti], borderRadius: 8 }]
            },
            options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true }, y: { grid: { display: false } } } }
        });
    }
    renderConversion() {
        const canvas = document.getElementById('conversionChart');
        if (!canvas) return;
        const { conversionRates } = this.app.data.processed;
        if (this.app.charts.conversion) this.app.charts.conversion.destroy();
        const data = [conversionRates.ghostPercentage, conversionRates.contattiToLead, conversionRates.contattiToProspect, conversionRates.leadToProspect, conversionRates.prospectToClienti, conversionRates.conversioneTotale];
        const colors = [
            Utils.getConversionColor(conversionRates.ghostPercentage, true), Utils.getConversionColor(conversionRates.contattiToLead),
            Utils.getConversionColor(conversionRates.contattiToProspect), Utils.getConversionColor(conversionRates.leadToProspect),
            Utils.getConversionColor(conversionRates.prospectToClienti), Utils.getConversionColor(conversionRates.conversioneTotale)
        ];
        this.app.charts.conversion = new Chart(canvas.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['🚨 Ghost %', 'Contatti → Lead', 'Contatti → Prospect', 'Lead → Prospect', 'Prospect → Clienti', 'Conversione Totale'],
                datasets: [{ label: 'Tasso %', data: data, backgroundColor: colors.map(color => color + '80'), borderColor: colors, borderWidth: 2, borderRadius: 8 }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => `${ctx.parsed.y.toFixed(1)}%` } } },
                scales: { y: { beginAtZero: true, max: 100, ticks: { callback: (value) => value + '%' } }, x: { grid: { display: false }, ticks: { maxRotation: 45 } } },
                onClick: () => this.app.openDrillDownModal()
            }
        });
    }
    renderPerformance() {
        const canvas = document.getElementById('performanceChart');
        if (!canvas) return;
        const { performanceBubbles } = this.app.data.processed;
        if (this.app.charts.performance) this.app.charts.performance.destroy();
        this.app.charts.performance = new Chart(canvas.getContext('2d'), {
            type: 'bubble',
            data: { datasets: [{ label: 'Performance per Fonte', data: performanceBubbles, backgroundColor: performanceBubbles.map(d => d.backgroundColor + '60'), borderColor: performanceBubbles.map(d => d.borderColor), borderWidth: 2 }] },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { callbacks: {
                    title: (ctx) => ctx[0].raw.fonte,
                    label: (ctx) => {
                        const d = ctx.raw;
                        return [`Volume Contatti: ${d.x.toLocaleString()}`, `Tasso Conversione: ${d.y.toFixed(1)}%`, `Fatturato: ${Utils.formatCurrency(d.fatturato)}`, `AOV: ${Utils.formatCurrency(d.aov)}`];
                    }
                }}},
                scales: {
                    x: { type: 'linear', position: 'bottom', title: { display: true, text: 'Volume Contatti' }, beginAtZero: true },
                    y: { title: { display: true, text: 'Tasso Conversione (%)' }, beginAtZero: true, max: Math.max(...performanceBubbles.map(d => d.y)) * 1.2 }
                },
                onClick: () => this.app.openPerformanceModal()
            }
        });
    }
}

// ========================================
// CLASSE TABLE RENDERER
// ========================================
class TableRenderer {
    constructor(app) { this.app = app; }
    render() {
        const container = document.getElementById('performanceTableContainer');
        if (!container) return;
        const { performance } = this.app.data.processed;
        const realSources = Object.entries(performance).filter(([fonte, stats]) => !fonte.includes('totale') && stats.contatti > 0).sort((a, b) => b[1].valore - a[1].valore);
        let html = `<div class="performance-table header"><div class="fonte-col">FONTE</div><div class="numeric-col">CONTATTI</div><div class="numeric-col">LEAD</div><div class="numeric-col">PROSPECT</div><div class="numeric-col">CLIENTI</div><div class="fatturato-col">FATTURATO</div><div class="percentage-col">TASSO CONVERSIONE %</div></div>`;
        realSources.forEach(([fonte, stats]) => {
            const conversionRate = stats.contatti > 0 ? ((stats.clienti / stats.contatti) * 100) : 0;
            const nomeDisplay = stats.nomeOriginale || fonte;
            html += `<div class="performance-table"><div class="fonte-col">${nomeDisplay}</div><div class="numeric-col ${Utils.getDataColorClass('contatti')}">${stats.contatti.toLocaleString()}</div><div class="numeric-col ${Utils.getDataColorClass('lead')}">${stats.lead.toLocaleString()}</div><div class="numeric-col ${Utils.getDataColorClass('prospect')}">${stats.prospect.toLocaleString()}</div><div class="numeric-col ${Utils.getDataColorClass('clienti')}">${stats.clienti.toLocaleString()}</div><div class="fatturato-col ${Utils.getDataColorClass('fatturato')}">${stats.valore.toLocaleString('it-IT', {minimumFractionDigits: 2, maximumFractionDigits: 2})} €</div><div class="percentage-col"><span class="badge ${Utils.getPerformanceBadgeClass(conversionRate)}">${conversionRate.toFixed(1)}%</span></div></div>`;
        });
        const totali = Utils.calculateTotals(performance);
        const tassoTotale = totali.contatti > 0 ? ((totali.clienti / totali.contatti) * 100) : 0;
        html += `<div class="performance-table totali-row"><div class="fonte-col">TOTALE</div><div class="numeric-col ${Utils.getDataColorClass('contatti')}">${totali.contatti.toLocaleString()}</div><div class="numeric-col ${Utils.getDataColorClass('lead')}">${totali.lead.toLocaleString()}</div><div class="numeric-col ${Utils.getDataColorClass('prospect')}">${totali.prospect.toLocaleString()}</div><div class="numeric-col ${Utils.getDataColorClass('clienti')}">${totali.clienti.toLocaleString()}</div><div class="fatturato-col ${Utils.getDataColorClass('fatturato')}">${totali.valore.toLocaleString('it-IT', {minimumFractionDigits: 2, maximumFractionDigits: 2})} €</div><div class="percentage-col"><span class="badge ${Utils.getPerformanceBadgeClass(tassoTotale)}">${tassoTotale.toFixed(1)}%</span></div></div>`;
        container.innerHTML = html;
    }
}

// ========================================
// CLASSE MODAL RENDERER
// ========================================
class ModalRenderer {
    constructor(app) { this.app = app; }
    renderDrillDown() {
        const { performance } = this.app.data.processed;
        const realSources = Object.entries(performance).filter(([fonte, stats]) => !fonte.includes('totale') && stats.contatti > 0).sort((a, b) => b[1].valore - a[1].valore);
        let html = '<div class="overflow-x-auto"><table class="w-full"><thead class="bg-gray-50"><tr><th class="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Fonte</th><th class="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase">🚨 Ghost %</th><th class="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase">Contatti → Lead</th><th class="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase">Lead → Prospect</th><th class="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase">Prospect → Clienti</th><th class="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase">Totale</th></tr></thead><tbody class="divide-y divide-gray-200">';
        realSources.forEach(([fonte, stats]) => {
            const rates = {
                ghost: stats.contatti > 0 ? ((stats.ghost / stats.contatti) * 100) : 0,
                contattiToLead: stats.contatti > 0 ? ((stats.lead / stats.contatti) * 100) : 0,
                leadToProspect: stats.lead > 0 ? ((stats.prospect / stats.lead) * 100) : 0,
                prospectToClienti: stats.prospect > 0 ? ((stats.clienti / stats.prospect) * 100) : 0,
                totale: stats.contatti > 0 ? ((stats.clienti / stats.contatti) * 100) : 0
            };
            html += `<tr class="hover:bg-gray-50"><td class="px-4 py-3 font-semibold">${stats.nomeOriginale || fonte}</td>`;
            html += this.createBadge(rates.ghost, true);
            html += this.createBadge(rates.contattiToLead);
            html += this.createBadge(rates.leadToProspect);
            html += this.createBadge(rates.prospectToClienti);
            html += this.createBadge(rates.totale);
            html += '</tr>';
        });
        html += '</tbody></table></div>';
        document.getElementById('modalContent').innerHTML = html;
    }
    createBadge(percentage, isGhost = false) {
        const color = Utils.getConversionColor(percentage, isGhost);
        return `<td class="px-4 py-3 text-center"><span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full" style="background-color: ${color}20; color: ${color}">${isGhost ? '🚨 ' : ''}${percentage.toFixed(1)}%</span></td>`;
    }
    renderPerformance() {
        const { performance } = this.app.data.processed;
        const realSources = Object.entries(performance).filter(([fonte, stats]) => !fonte.includes('totale') && stats.contatti > 0).sort((a, b) => b[1].valore - a[1].valore);
        const volumeMedio = realSources.reduce((sum, [_, s]) => sum + s.contatti, 0) / realSources.length;
        const conversioneMedia = realSources.reduce((sum, [_, s]) => sum + (s.contatti > 0 ? (s.clienti / s.contatti) * 100 : 0), 0) / realSources.length;
        let html = '<div class="overflow-x-auto"><table class="w-full"><thead class="bg-gray-50"><tr><th class="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Fonte</th><th class="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase">Quadrante</th><th class="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase">Volume</th><th class="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase">Conversione</th><th class="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase">Fatturato</th></tr></thead><tbody class="divide-y divide-gray-200">';
        realSources.forEach(([fonte, stats]) => {
            const conversione = stats.contatti > 0 ? ((stats.clienti / stats.contatti) * 100) : 0;
            const quadrante = this.getQuadrante(stats.contatti, conversione, volumeMedio, conversioneMedia);
            html += `<tr class="hover:bg-gray-50"><td class="px-4 py-3 font-semibold">${stats.nomeOriginale || fonte}</td>`;
            html += `<td class="px-4 py-3 text-center"><span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${quadrante.color}">${quadrante.label}</span></td>`;
            html += `<td class="px-4 py-3 text-center">${stats.contatti.toLocaleString()}</td>`;
            html += `<td class="px-4 py-3 text-center">${conversione.toFixed(1)}%</td>`;
            html += `<td class="px-4 py-3 text-center font-bold">${Utils.formatCurrency(stats.valore)}</td>`;
            html += '</tr>';
        });
        html += '</tbody></table></div>';
        document.getElementById('performanceModalContent').innerHTML = html;
    }
    getQuadrante(volume, conversione, volumeMedio, conversioneMedia) {
        if (volume >= volumeMedio && conversione >= conversioneMedia) return { label: '🏆 CAMPIONI', color: 'bg-green-100 text-green-800' };
        if (volume >= volumeMedio) return { label: '📈 SCALABILI', color: 'bg-blue-100 text-blue-800' };
        if (conversione >= conversioneMedia) return { label: '💎 PREMIUM', color: 'bg-purple-100 text-purple-800' };
        return { label: '⚠️ NICCHIA', color: 'bg-yellow-100 text-yellow-800' };
    }
}

// ========================================
// CLASSE INSIGHTS GENERATOR
// ========================================
class InsightsGenerator {
    constructor(processedData) {
        this.data = processedData;
    }

    generate() {
        const insights = [];
        const { funnel, conversionRates, performance } = this.data;

        if (!performance || Object.keys(performance).length === 0) {
            return ['<p>Dati insufficienti per generare insights.</p>'];
        }

        const realSources = Object.values(performance).filter(stats => stats.contatti > 0);

        // 1. Top Performer (Valore)
        if (realSources.length > 0) {
            const topPerformer = realSources.reduce((best, current) =>
                current.valore > best.valore ? current : best,
                { valore: -1, nomeOriginale: 'N/D' }
            );
            if (topPerformer.valore > 0) {
                insights.push(`<strong>Top Performer (Valore):</strong> La fonte <strong>${topPerformer.nomeOriginale}</strong> è il motore primario di fatturato, generando <strong>${Utils.formatCurrency(topPerformer.valore)}</strong>.`);
            }
        }

        // 2. Macchina da Conversione (Efficienza)
        const minContactsForConversionInsight = Math.max(10, funnel.contatti * 0.01);
        const relevantSourcesForConversion = realSources.filter(stats => stats.contatti >= minContactsForConversionInsight);

        if (relevantSourcesForConversion.length > 0) {
            const conversionMachine = relevantSourcesForConversion.reduce((best, current) => {
                const currentRate = current.contatti > 0 ? (current.clienti / current.contatti) : 0;
                const bestRate = best.contatti > 0 ? (best.clienti / best.contatti) : 0;
                return currentRate > bestRate ? current : best;
            }, relevantSourcesForConversion[0]);

            if (conversionMachine) {
                const rate = (conversionMachine.clienti / conversionMachine.contatti) * 100;
                insights.push(`<strong>Macchina da Conversione:</strong> Il canale <strong>${conversionMachine.nomeOriginale}</strong> è il più letale, convertendo il <strong>${rate.toFixed(1)}%</strong> dei contatti in clienti.`);
            }
        }

        // 3. Clienti Premium (Qualità/AOV)
        const sourcesWithClients = realSources.filter(stats => stats.clienti > 0);
        if (sourcesWithClients.length > 0) {
            const premiumSource = sourcesWithClients.reduce((best, current) => {
                const currentAOV = current.valore / current.clienti;
                const bestAOV = best.clienti > 0 ? (best.valore / best.clienti) : 0;
                return currentAOV > bestAOV ? current : best;
            }, { valore: 0, clienti: 0, nomeOriginale: 'N/D' });

            if (premiumSource.clienti > 0) {
                const aov = premiumSource.valore / premiumSource.clienti;
                insights.push(`<strong>Clienti Premium:</strong> I clienti da <strong>${premiumSource.nomeOriginale}</strong> sono i più preziosi, con un valore medio di vendita di <strong>${Utils.formatCurrency(aov)}</strong>.`);
            }
        }

        // 4. L'Anello Debole (Processo)
        const drops = [];
        if (funnel.contatti > 0 && funnel.lead > 0) {
            drops.push({ name: 'da Contatti a Lead', value: 1 - (funnel.lead / funnel.contatti) });
        }
        if (funnel.lead > 0 && funnel.prospect > 0) {
            drops.push({ name: 'da Lead a Prospect', value: 1 - (funnel.prospect / funnel.lead) });
        }
        if (funnel.prospect > 0 && funnel.clienti > 0) {
            drops.push({ name: 'da Prospect a Clienti', value: 1 - (funnel.clienti / funnel.prospect) });
        }

        if (drops.length > 0) {
            const weakestLink = drops.reduce((max, current) => current.value > max.value ? current : max, { value: -1, name: 'N/D' });
            if (weakestLink.value >= 0) {
                insights.push(`<strong>L'Anello Debole:</strong> La più grande emorragia di opportunità si verifica nel passaggio <strong>${weakestLink.name}</strong> (calo del <strong>${(weakestLink.value * 100).toFixed(1)}%</strong>).`);
            }
        }

        // 5. ALLARME Ghost
        if (conversionRates.ghostPercentage > CONFIG.GHOST_THRESHOLDS.WARNING) {
            insights.push(`<strong>ALLARME Ghost:</strong> Il <strong>${conversionRates.ghostPercentage.toFixed(1)}%</strong> dei contatti non viene mai lavorato, rappresentando una perdita secca di potenziale.`);
        } else if (conversionRates.ghostPercentage < CONFIG.GHOST_THRESHOLDS.EXCELLENT) {
            insights.push(`<strong>Ghost Ottimizzato:</strong> Solo il <strong>${conversionRates.ghostPercentage.toFixed(1)}%</strong> dei contatti viene disperso prima del contatto iniziale.`);
        }

        const icons = {
            'Top Performer': '🎯',
            'Macchina da Conversione': '⚙️',
            'Clienti Premium': '💎',
            'L\'Anello Debole': '📉',
            'ALLARME Ghost': '🚨',
            'Ghost Ottimizzato': '✅'
        };

        return insights.map(insight => {
            const key = Object.keys(icons).find(k => insight.includes(k));
            const iconHtml = key ? `<span class="mr-3 text-xl">${icons[key]}</span>` : '';
            return `<div class="bg-white/10 rounded-lg p-4 backdrop-filter backdrop-blur-sm flex items-center">${iconHtml}<div class="text-white/90">${insight}</div></div>`;
        });
    }
}

// ========================================
// CLASSE DATA EXPORTER
// ========================================
class DataExporter {
    constructor(performance) { this.performance = performance; }
    toCSV(filename) {
        const csvData = [['Fonte', 'Contatti', 'Lead', 'Prospect', 'Clienti', 'Valore', 'Tasso Conversione %']];
        Object.entries(this.performance).filter(([fonte, stats]) => !fonte.includes('totale') && stats.contatti > 0).sort((a, b) => b[1].valore - a[1].valore).forEach(([fonte, stats]) => {
            const tasso = ((stats.clienti / (stats.contatti || 1)) * 100).toFixed(1);
            csvData.push([stats.nomeOriginale || fonte, stats.contatti, stats.lead, stats.prospect, stats.clienti, '€ ' + stats.valore.toLocaleString('it-IT', {minimumFractionDigits: 2}), tasso + '%']);
        });
        const totali = Utils.calculateTotals(this.performance);
        const tassoTotale = ((totali.clienti / (totali.contatti || 1)) * 100).toFixed(1);
        csvData.push(['TOTALE', totali.contatti, totali.lead, totali.prospect, totali.clienti, '€ ' + totali.valore.toLocaleString('it-IT'), tassoTotale + '%']);
        const csvContent = csvData.map(row => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// ========================================
// 🆕 FUNZIONE GLOBALE PER INIT API
// ========================================
function handleClientLoad() {
    gapi.load('client', () => {
        if (window.app && window.app.apiManager) {
            window.app.apiManager.initializeGapiClient();
        }
    });
}

// ========================================
// INIT APPLICAZIONE AL CARICAMENTO
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    window.app = new DashboardApp();
    window.app.init();
});
