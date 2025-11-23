        // ========================================
        // 🆕 GOOGLE SHEETS API - SMART SHEET MATCHER
        // ========================================
        class SheetMatcher {
            static normalize(str) {
                return str.toLowerCase().replace(/[\s_-]/g, '');
            }

            static findSheet(availableSheets, baseName) {
                const baseNorm = this.normalize(baseName);

                // STEP 1: Exact match
                let match = availableSheets.find(s => s === baseName);
                if (match) return { found: true, name: match, method: 'exact' };

                // STEP 2: Case-insensitive
                match = availableSheets.find(s => s.toLowerCase() === baseName.toLowerCase());
                if (match) return { found: true, name: match, method: 'case-insensitive' };

                // STEP 3: Starts with (normalized)
                match = availableSheets.find(s => this.normalize(s).startsWith(baseNorm));
                if (match) return { found: true, name: match, method: 'pattern' };

                // STEP 4: Contains (last resort)
                match = availableSheets.find(s => this.normalize(s).includes(baseNorm));
                if (match) return { found: true, name: match, method: 'contains' };

                return { found: false, name: null, available: availableSheets };
            }

            static async getSheetNames(spreadsheetId) {
                try {
                    const response = await gapi.client.sheets.spreadsheets.get({
                        spreadsheetId: spreadsheetId
                    });
                    return response.result.sheets.map(sheet => sheet.properties.title);
                } catch (err) {
                    throw new Error(`Impossibile recuperare i fogli: ${err.message}`);
                }
            }
        }

        // ========================================
        // 🆕 GOOGLE SHEETS API MANAGER
        // ========================================
        class ApiManager {
            constructor(app) {
                this.app = app;
                this.tokenClient = null;
                this.isAuthenticated = false;
                this.lastSpreadsheetId = null;
            }

            async initializeGapiClient() {
                try {
                    this.app.logger.log('🔧 Inizializzazione Google API...', 'info');

                    await gapi.client.init({
                        apiKey: CONFIG.API.API_KEY,
                        discoveryDocs: CONFIG.API.DISCOVERY_DOCS,
                    });

                    this.tokenClient = google.accounts.oauth2.initTokenClient({
                        client_id: CONFIG.API.CLIENT_ID,
                        scope: CONFIG.API.SCOPES,
                        callback: (resp) => {
                            if (resp && resp.access_token) {
                                this.isAuthenticated = true;
                                this.updateAuthStatus(true);
                                this.app.logger.log('✅ Autenticazione completata', 'success');
                            } else {
                                this.app.logger.log('❌ Token invalido', 'error');
                                this.updateAuthStatus(false);
                            }
                        },
                    });

                    this.setupEventListeners();
                    this.updateAuthStatus(false);

                    // Load saved spreadsheet ID
                    const saved = localStorage.getItem('dashboard_spreadsheet_id');
                    if (saved) {
                        document.getElementById('globalSpreadsheetId').value = saved;
                        this.app.logger.log('✅ Spreadsheet ID caricato da cache', 'info');
                    }

                    this.app.logger.log('✅ Google API inizializzata', 'success');
                } catch (e) {
                    this.app.logger.log(`❌ Errore init API: ${e.message}`, 'error');
                }
            }

            setupEventListeners() {
                document.getElementById('authorize_api')?.addEventListener('click', () => this.handleAuthClick());
                document.getElementById('signout_api')?.addEventListener('click', () => this.handleSignoutClick());
                document.getElementById('quickLoadAPI')?.addEventListener('click', () => this.quickLoadAll());
            }

            handleAuthClick() {
                if (gapi.client.getToken() === null) {
                    this.tokenClient.requestAccessToken({ prompt: 'consent' });
                } else {
                    this.tokenClient.requestAccessToken({ prompt: '' });
                }
            }

            handleSignoutClick() {
                const token = gapi.client.getToken();
                if (token) {
                    google.accounts.oauth2.revoke(token.access_token, () => {
                        gapi.client.setToken('');
                        this.isAuthenticated = false;
                        this.updateAuthStatus(false);
                        this.app.logger.log('🔓 Disconnesso da Google', 'info');
                    });
                }
            }

            updateAuthStatus(isAuthenticated) {
                const status = document.getElementById('authStatus');
                const authBtn = document.getElementById('authorize_api');
                const signoutBtn = document.getElementById('signout_api');

                if (isAuthenticated) {
                    status.innerHTML = '<i class="fas fa-check-circle"></i> API Connessa';
                    status.className = 'status-indicator bg-green-500/80 px-3 py-1 rounded-full text-sm text-white';
                    authBtn.style.display = 'none';
                    signoutBtn.style.display = 'inline-block';
                } else {
                    status.innerHTML = '<i class="fas fa-lock"></i> API Non Connessa';
                    status.className = 'status-indicator bg-red-500/80 px-3 py-1 rounded-full text-sm text-white';
                    authBtn.style.display = 'inline-block';
                    signoutBtn.style.display = 'none';
                }
            }

            async quickLoadAll() {
                const spreadsheetId = document.getElementById('globalSpreadsheetId').value.trim();

                if (!spreadsheetId) {
                    alert('⚠️ Inserisci lo Spreadsheet ID');
                    return;
                }

                if (!this.isAuthenticated) {
                    alert('⚠️ Autenticati prima di caricare i dati');
                    return;
                }

                const btn = document.getElementById('quickLoadAPI');
                const originalText = btn.innerHTML;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Caricamento...';
                btn.disabled = true;

                try {
                    this.app.logger.log(`🔍 Recupero lista fogli da: ${spreadsheetId}`, 'info');

                    // STEP 1: Get available sheets
                    const availableSheets = await SheetMatcher.getSheetNames(spreadsheetId);
                    this.app.logger.log(`📋 Fogli disponibili: ${availableSheets.join(', ')}`, 'info');

                    // STEP 2: Smart matching
                    const matches = {
                        lead: SheetMatcher.findSheet(availableSheets, CONFIG.API.SHEET_NAMES.lead),
                        campaigns: SheetMatcher.findSheet(availableSheets, CONFIG.API.SHEET_NAMES.campaigns),
                        sales: SheetMatcher.findSheet(availableSheets, CONFIG.API.SHEET_NAMES.sales),
                        weekly: SheetMatcher.findSheet(availableSheets, CONFIG.API.SHEET_NAMES.weekly)
                    };

                    // STEP 3: Validate required sheets
                    if (!matches.lead.found) {
                        throw new Error(`❌ Foglio "Lead" non trovato. Disponibili: ${availableSheets.join(', ')}`);
                    }
                    if (!matches.campaigns.found) {
                        throw new Error(`❌ Foglio "Report Campagne" non trovato. Disponibili: ${availableSheets.join(', ')}`);
                    }

                    // STEP 4: Log matches
                    this.app.logger.log(`✅ Lead: "${matches.lead.name}" (${matches.lead.method})`, 'success');
                    this.app.logger.log(`✅ Campaigns: "${matches.campaigns.name}" (${matches.campaigns.method})`, 'success');
                    if (matches.sales.found) {
                        this.app.logger.log(`✅ Sales: "${matches.sales.name}" (${matches.sales.method})`, 'success');
                    }
                    if (matches.weekly.found) {
                        this.app.logger.log(`✅ Weekly: "${matches.weekly.name}" (${matches.weekly.method})`, 'success');
                    }

                    // STEP 5: Build ranges (A:BZ = fino a 78 colonne)
                    const ranges = [
                        `'${matches.lead.name}'!A:BZ`,
                        `'${matches.campaigns.name}'!A:BZ`
                    ];
                    if (matches.sales.found) ranges.push(`'${matches.sales.name}'!A:BZ`);
                    if (matches.weekly.found) ranges.push(`'${matches.weekly.name}'!A:BZ`);

                    this.app.logger.log(`📥 Caricamento ${ranges.length} fogli...`, 'info');

                    // STEP 6: Batch fetch
                    const response = await gapi.client.sheets.spreadsheets.values.batchGet({
                        spreadsheetId: spreadsheetId,
                        ranges: ranges,
                    });

                    // STEP 7: Assign data
                    let i = 0;
                    this.app.data.raw.lead = response.result.valueRanges[i++].values;
                    this.app.data.raw.campaigns = response.result.valueRanges[i++].values;
                    if (matches.sales.found) this.app.data.raw.sales = response.result.valueRanges[i++].values;
                    if (matches.weekly.found) this.app.data.raw.weekly = response.result.valueRanges[i++].values;

                    // STEP 8: Clone to original
                    this.app.data.original.lead = JSON.parse(JSON.stringify(this.app.data.raw.lead));
                    this.app.data.original.campaigns = JSON.parse(JSON.stringify(this.app.data.raw.campaigns));

                    // STEP 9: Enable process button
                    document.getElementById('processButton').disabled = false;

                    // STEP 10: Save & update status
                    localStorage.setItem('dashboard_spreadsheet_id', spreadsheetId);
                    this.lastSpreadsheetId = spreadsheetId;

                    this.app.updateStatus(`✅ Caricati ${this.app.data.raw.lead.length} Lead + ${this.app.data.raw.campaigns.length} Campagne`, 'success');
                    this.app.logger.log('✅ Tutti i dati caricati da API!', 'success');

                } catch (error) {
                    this.app.logger.log(`❌ ${error.message}`, 'error');
                    alert(`Errore: ${error.message}`);
                } finally {
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                }
            }
        }

        // 🆕 GLOBAL HANDLER for API load
        function handleClientLoad() {
            gapi.load('client', () => {
                if (window.dashboardApp && window.dashboardApp.apiManager) {
                    window.dashboardApp.apiManager.initializeGapiClient();
                }
            });
        }
