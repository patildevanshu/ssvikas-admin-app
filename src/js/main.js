// main.js - Main Application Logic for SSVikas Middleman App

class SSVikasApp {
    constructor() {
        this.currentPage = 'dashboard';
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadDashboardData();
        this.setupTransactionForm();
        this.checkFirstRun();
    }
    
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.getAttribute('data-page');
                this.navigateTo(page);
            });
        });
        
        // Header actions
        document.getElementById('newTransactionBtn').addEventListener('click', () => {
            this.openTransactionModal();
        });
        
        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.refreshCurrentPage();
        });
        
        // Modal actions
        document.getElementById('closeTransactionModal').addEventListener('click', () => {
            this.closeTransactionModal();
        });
        
        document.getElementById('cancelTransactionBtn').addEventListener('click', () => {
            this.closeTransactionModal();
        });
        
        // Form submission
        document.getElementById('transactionForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTransaction();
        });
        
        // Modal overlay
        document.getElementById('modalOverlay').addEventListener('click', (e) => {
            if (e.target.id === 'modalOverlay') {
                this.closeTransactionModal();
            }
        });
        
        // Balance tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchBalanceTab(e.target.getAttribute('data-tab'));
            });
        });
        
        // View all transactions
        document.getElementById('viewAllTransactions').addEventListener('click', () => {
            this.navigateTo('transactions');
        });
        
        // Sidebar toggle
        document.getElementById('sidebarToggle').addEventListener('click', () => {
            this.toggleSidebar();
        });
        
        document.getElementById('mobileSidebarToggle').addEventListener('click', () => {
            this.toggleMobileSidebar();
        });
        
        // Electron menu handlers
        if (window.electronAPI) {
            window.electronAPI.onMenuAction((event, action) => {
                this.handleMenuAction(action);
            });
            
            window.electronAPI.onNavigateTo((event, page) => {
                this.navigateTo(page);
            });
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'n':
                        e.preventDefault();
                        this.openTransactionModal();
                        break;
                    case '1':
                        e.preventDefault();
                        this.navigateTo('dashboard');
                        break;
                    case '2':
                        e.preventDefault();
                        this.navigateTo('transactions');
                        break;
                    case '3':
                        e.preventDefault();
                        this.navigateTo('farmers');
                        break;
                    case '4':
                        e.preventDefault();
                        this.navigateTo('purchasers');
                        break;
                    case '5':
                        e.preventDefault();
                        this.navigateTo('reports');
                        break;
                }
            }
        });
    }
    
    checkFirstRun() {
        const hasData = DataManager.getTransactions().length > 0;
        if (!hasData) {
            this.showToast('Welcome! Click "Generate Sample Data" to get started with demo data.', 'info', 'Welcome to SSVikas');
        }
    }
    
    navigateTo(page) {
        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        document.querySelector(`[data-page="${page}"]`).classList.add('active');
        
        // Update page title
        const pageTitles = {
            dashboard: 'Dashboard',
            transactions: 'Transactions',
            farmers: 'Farmers',
            purchasers: 'Purchasers',
            search: 'Search',
            reports: 'Reports'
        };
        
        document.getElementById('pageTitle').textContent = pageTitles[page] || 'Dashboard';
        
        // Show page content
        document.querySelectorAll('.page-view').forEach(view => {
            view.classList.remove('active');
        });
        
        document.getElementById(`${page}-view`).classList.add('active');
        
        // Load page data
        this.loadPageData(page);
        this.currentPage = page;
    }
    
    loadPageData(page) {
        switch (page) {
            case 'dashboard':
                this.loadDashboardData();
                break;
            case 'transactions':
                this.loadTransactionsPage();
                break;
            case 'farmers':
                this.loadFarmersPage();
                break;
            case 'purchasers':
                this.loadPurchasersPage();
                break;
            case 'search':
                this.loadSearchPage();
                break;
            case 'reports':
                this.loadReportsPage();
                break;
        }
    }
    
    loadDashboardData() {
        const stats = DataManager.getStatistics();
        const accountSummary = AccountManager.getAccountSummary();
        const transactions = DataManager.getTransactions();
        
        // Update header stats
        const today = new Date().toISOString().split('T')[0];
        const todayTransactions = transactions.filter(t => t.date === today);
        const todayAmount = todayTransactions.reduce((sum, t) => sum + (t.calculations?.firmCommission || 0), 0);
        
        document.getElementById('todayTrades').textContent = todayTransactions.length;
        document.getElementById('todayAmount').textContent = TransactionCalculator.formatCurrency(todayAmount);
        document.getElementById('pendingAmount').textContent = TransactionCalculator.formatCurrency(accountSummary.totalFarmersOwed);
        
        // Update summary cards
        document.getElementById('totalTransactions').textContent = stats.totalTransactions;
        document.getElementById('totalCommission').textContent = TransactionCalculator.formatCurrency(stats.totalCommission);
        document.getElementById('activeFarmers').textContent = accountSummary.activeFarmers;
        document.getElementById('totalWeight').textContent = TransactionCalculator.formatWeight(stats.totalWeight);
        
        // Load recent transactions
        this.loadRecentTransactions();
        
        // Load account balances
        this.loadAccountBalances();
    }
    
    loadRecentTransactions() {
        const transactions = DataManager.getTransactions()
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 5);
        
        const tbody = document.getElementById('recentTransactionsTable');
        
        if (transactions.length === 0) {
            tbody.innerHTML = '<tr class="no-data"><td colspan="6">No recent transactions</td></tr>';
            return;
        }
        
        tbody.innerHTML = transactions.map(t => `
            <tr>
                <td>${new Date(t.date).toLocaleDateString('en-IN')}</td>
                <td>${t.farmerName}</td>
                <td>${t.purchaserName}</td>
                <td>${TransactionCalculator.formatWeight(t.weight)}</td>
                <td>${TransactionCalculator.formatCurrency(t.calculations.netAmount)}</td>
                <td class="text-success">${TransactionCalculator.formatCurrency(t.calculations.firmCommission)}</td>
            </tr>
        `).join('');
    }
    
    loadAccountBalances() {
        const farmers = DataManager.getFarmers()
            .filter(f => f.balance > 0)
            .sort((a, b) => b.balance - a.balance)
            .slice(0, 5);
        
        const purchasers = DataManager.getPurchasers()
            .filter(p => p.balance > 0)
            .sort((a, b) => b.balance - a.balance)
            .slice(0, 5);
        
        // Farmer balances
        const farmerBalanceList = document.getElementById('farmerBalanceList');
        if (farmers.length === 0) {
            farmerBalanceList.innerHTML = '<div class="no-data">No pending farmer payments</div>';
        } else {
            farmerBalanceList.innerHTML = farmers.map(farmer => `
                <div class="balance-item">
                    <span class="balance-name">${farmer.name}</span>
                    <span class="balance-amount negative">${TransactionCalculator.formatCurrency(farmer.balance)}</span>
                </div>
            `).join('');
        }
        
        // Purchaser balances
        const purchaserBalanceList = document.getElementById('purchaserBalanceList');
        if (purchasers.length === 0) {
            purchaserBalanceList.innerHTML = '<div class="no-data">No pending purchaser payments</div>';
        } else {
            purchaserBalanceList.innerHTML = purchasers.map(purchaser => `
                <div class="balance-item">
                    <span class="balance-name">${purchaser.name}</span>
                    <span class="balance-amount positive">${TransactionCalculator.formatCurrency(purchaser.balance)}</span>
                </div>
            `).join('');
        }
    }
    
    loadTransactionsPage() {
        const view = document.getElementById('transactions-view');
        const transactions = DataManager.getTransactions()
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        view.innerHTML = `
            <div class="page-header">
                <div class="page-header-left">
                    <h2>All Transactions</h2>
                    <p>Manage and view all trading transactions</p>
                </div>
                <div class="page-header-right">
                    <button class="btn btn-secondary" id="exportTransactionsBtn">
                        <i data-lucide="download"></i>
                        Export
                    </button>
                    <button class="btn btn-primary" onclick="app.openTransactionModal()">
                        <i data-lucide="plus"></i>
                        New Transaction
                    </button>
                </div>
            </div>
            
            <div class="card">
                <div class="card-body">
                    <div class="table-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Board No</th>
                                    <th>Vehicle No</th>
                                    <th>Farmer</th>
                                    <th>Purchaser</th>
                                    <th>Weight</th>
                                    <th>Bhaav</th>
                                    <th>Total Amount</th>
                                    <th>Net Amount</th>
                                    <th>Commission</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${transactions.length === 0 ? 
                                    '<tr class="no-data"><td colspan="11">No transactions found</td></tr>' :
                                    transactions.map(t => `
                                        <tr>
                                            <td>${new Date(t.date).toLocaleDateString('en-IN')}</td>
                                            <td>${t.boardNo || '-'}</td>
                                            <td>${t.gaadiNo}</td>
                                            <td>${t.farmerName}</td>
                                            <td>${t.purchaserName}</td>
                                            <td>${TransactionCalculator.formatWeight(t.weight)}</td>
                                            <td>${TransactionCalculator.formatCurrency(parseFloat(t.bhaav))}/100kg</td>
                                            <td>${TransactionCalculator.formatCurrency(t.calculations.totalAmount)}</td>
                                            <td>${TransactionCalculator.formatCurrency(t.calculations.netAmount)}</td>
                                            <td class="text-success">${TransactionCalculator.formatCurrency(t.calculations.firmCommission)}</td>
                                            <td>
                                                <button class="btn btn-sm btn-secondary" onclick="app.viewTransaction('${t.id}')">
                                                    <i data-lucide="eye"></i>
                                                </button>
                                                <button class="btn btn-sm btn-danger" onclick="app.deleteTransaction('${t.id}')">
                                                    <i data-lucide="trash-2"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    `).join('')
                                }
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
        
        // Re-initialize Lucide icons
        lucide.createIcons();
    }
    
    loadFarmersPage() {
        const view = document.getElementById('farmers-view');
        const farmers = DataManager.getFarmers()
            .sort((a, b) => b.totalTransactions - a.totalTransactions);
        
        view.innerHTML = `
            <div class="page-header">
                <div class="page-header-left">
                    <h2>Farmers</h2>
                    <p>Manage farmer accounts and payments</p>
                </div>
            </div>
            
            <div class="card">
                <div class="card-body">
                    <div class="table-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Total Transactions</th>
                                    <th>Total Weight</th>
                                    <th>Total Earnings</th>
                                    <th>Outstanding Balance</th>
                                    <th>Last Transaction</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${farmers.length === 0 ? 
                                    '<tr class="no-data"><td colspan="7">No farmers found</td></tr>' :
                                    farmers.map(farmer => `
                                        <tr>
                                            <td><strong>${farmer.name}</strong></td>
                                            <td>${farmer.totalTransactions}</td>
                                            <td>${TransactionCalculator.formatWeight(farmer.totalWeight)}</td>
                                            <td>${TransactionCalculator.formatCurrency(farmer.totalEarnings)}</td>
                                            <td class="${farmer.balance > 0 ? 'text-danger' : 'text-success'}">
                                                ${TransactionCalculator.formatCurrency(farmer.balance)}
                                            </td>
                                            <td>${farmer.lastTransactionDate ? new Date(farmer.lastTransactionDate).toLocaleDateString('en-IN') : '-'}</td>
                                            <td>
                                                <button class="btn btn-sm btn-primary" onclick="app.viewFarmerDetails('${farmer.id}')">
                                                    <i data-lucide="eye"></i>
                                                </button>
                                                ${farmer.balance > 0 ? 
                                                    `<button class="btn btn-sm btn-success" onclick="app.payFarmer('${farmer.id}')">
                                                        <i data-lucide="credit-card"></i>
                                                    </button>` : ''
                                                }
                                            </td>
                                        </tr>
                                    `).join('')
                                }
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
        
        lucide.createIcons();
    }
    
    loadPurchasersPage() {
        const view = document.getElementById('purchasers-view');
        const purchasers = DataManager.getPurchasers()
            .sort((a, b) => b.totalTransactions - a.totalTransactions);
        
        view.innerHTML = `
            <div class="page-header">
                <div class="page-header-left">
                    <h2>Purchasers</h2>
                    <p>Manage purchaser accounts and payments</p>
                </div>
            </div>
            
            <div class="card">
                <div class="card-body">
                    <div class="table-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Total Transactions</th>
                                    <th>Total Weight</th>
                                    <th>Total Payments</th>
                                    <th>Outstanding Balance</th>
                                    <th>Last Transaction</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${purchasers.length === 0 ? 
                                    '<tr class="no-data"><td colspan="7">No purchasers found</td></tr>' :
                                    purchasers.map(purchaser => `
                                        <tr>
                                            <td><strong>${purchaser.name}</strong></td>
                                            <td>${purchaser.totalTransactions}</td>
                                            <td>${TransactionCalculator.formatWeight(purchaser.totalWeight)}</td>
                                            <td>${TransactionCalculator.formatCurrency(purchaser.totalPayments)}</td>
                                            <td class="${purchaser.balance > 0 ? 'text-success' : 'text-danger'}">
                                                ${TransactionCalculator.formatCurrency(purchaser.balance)}
                                            </td>
                                            <td>${purchaser.lastTransactionDate ? new Date(purchaser.lastTransactionDate).toLocaleDateString('en-IN') : '-'}</td>
                                            <td>
                                                <button class="btn btn-sm btn-primary" onclick="app.viewPurchaserDetails('${purchaser.id}')">
                                                    <i data-lucide="eye"></i>
                                                </button>
                                                ${purchaser.balance > 0 ? 
                                                    `<button class="btn btn-sm btn-success" onclick="app.receivePurchaserPayment('${purchaser.id}')">
                                                        <i data-lucide="credit-card"></i>
                                                    </button>` : ''
                                                }
                                            </td>
                                        </tr>
                                    `).join('')
                                }
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
        
        lucide.createIcons();
    }
    
    loadSearchPage() {
        const view = document.getElementById('search-view');
        
        view.innerHTML = `
            <div class="page-header">
                <div class="page-header-left">
                    <h2>Search</h2>
                    <p>Search transactions by farmer, purchaser, date, or vehicle</p>
                </div>
            </div>
            
            <div class="card">
                <div class="card-body">
                    <div class="search-form">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="searchTerm">Search Term</label>
                                <input type="text" id="searchTerm" placeholder="Enter farmer name, purchaser, vehicle no, etc." class="form-control">
                            </div>
                            <div class="form-group">
                                <label for="searchType">Search Type</label>
                                <select id="searchType" class="form-control">
                                    <option value="all">All Fields</option>
                                    <option value="farmer">Farmer Name</option>
                                    <option value="purchaser">Purchaser Name</option>
                                    <option value="date">Date</option>
                                    <option value="vehicle">Vehicle Number</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>&nbsp;</label>
                                <button class="btn btn-primary" id="searchBtn">
                                    <i data-lucide="search"></i>
                                    Search
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="card" id="searchResults" style="display: none;">
                <div class="card-header">
                    <h3>Search Results</h3>
                    <span id="resultCount"></span>
                </div>
                <div class="card-body">
                    <div class="table-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Farmer</th>
                                    <th>Purchaser</th>
                                    <th>Vehicle</th>
                                    <th>Weight</th>
                                    <th>Total Amount</th>
                                    <th>Commission</th>
                                </tr>
                            </thead>
                            <tbody id="searchResultsBody">
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
        
        // Add search functionality
        document.getElementById('searchBtn').addEventListener('click', () => {
            this.performSearch();
        });
        
        document.getElementById('searchTerm').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.performSearch();
            }
        });
        
        lucide.createIcons();
    }
    
    loadReportsPage() {
        const view = document.getElementById('reports-view');
        
        view.innerHTML = `
            <div class="page-header">
                <div class="page-header-left">
                    <h2>Reports</h2>
                    <p>Generate and export business reports</p>
                </div>
            </div>
            
            <div class="reports-grid">
                <div class="card">
                    <div class="card-header">
                        <h3>Daily Report</h3>
                        <i data-lucide="calendar" class="card-icon"></i>
                    </div>
                    <div class="card-body">
                        <div class="form-group">
                            <label for="dailyReportDate">Select Date</label>
                            <input type="date" id="dailyReportDate" class="form-control" value="${new Date().toISOString().split('T')[0]}">
                        </div>
                        <button class="btn btn-primary" onclick="app.generateDailyReport()">
                            <i data-lucide="file-text"></i>
                            Generate Report
                        </button>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <h3>Monthly Report</h3>
                        <i data-lucide="calendar-days" class="card-icon"></i>
                    </div>
                    <div class="card-body">
                        <div class="form-group">
                            <label for="monthlyReportMonth">Select Month</label>
                            <input type="month" id="monthlyReportMonth" class="form-control" value="${new Date().toISOString().slice(0, 7)}">
                        </div>
                        <button class="btn btn-primary" onclick="app.generateMonthlyReport()">
                            <i data-lucide="file-text"></i>
                            Generate Report
                        </button>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <h3>Farmer Statement</h3>
                        <i data-lucide="user" class="card-icon"></i>
                    </div>
                    <div class="card-body">
                        <div class="form-group">
                            <label for="farmerSelect">Select Farmer</label>
                            <select id="farmerSelect" class="form-control">
                                <option value="">Choose a farmer...</option>
                                ${DataManager.getFarmers().map(farmer => 
                                    `<option value="${farmer.id}">${farmer.name}</option>`
                                ).join('')}
                            </select>
                        </div>
                        <button class="btn btn-primary" onclick="app.generateFarmerStatement()">
                            <i data-lucide="file-text"></i>
                            Generate Statement
                        </button>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <h3>Purchaser Statement</h3>
                        <i data-lucide="truck" class="card-icon"></i>
                    </div>
                    <div class="card-body">
                        <div class="form-group">
                            <label for="purchaserSelect">Select Purchaser</label>
                            <select id="purchaserSelect" class="form-control">
                                <option value="">Choose a purchaser...</option>
                                ${DataManager.getPurchasers().map(purchaser => 
                                    `<option value="${purchaser.id}">${purchaser.name}</option>`
                                ).join('')}
                            </select>
                        </div>
                        <button class="btn btn-primary" onclick="app.generatePurchaserStatement()">
                            <i data-lucide="file-text"></i>
                            Generate Statement
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        lucide.createIcons();
    }
    
    performSearch() {
        const searchTerm = document.getElementById('searchTerm').value.trim();
        const searchType = document.getElementById('searchType').value;
        
        if (!searchTerm) {
            this.showToast('Please enter a search term', 'warning');
            return;
        }
        
        const results = DataManager.searchTransactions(searchTerm, searchType);
        
        const resultsCard = document.getElementById('searchResults');
        const resultCount = document.getElementById('resultCount');
        const resultsBody = document.getElementById('searchResultsBody');
        
        resultCount.textContent = `${results.length} result(s) found`;
        
        if (results.length === 0) {
            resultsBody.innerHTML = '<tr class="no-data"><td colspan="7">No results found</td></tr>';
        } else {
            resultsBody.innerHTML = results.map(t => `
                <tr>
                    <td>${new Date(t.date).toLocaleDateString('en-IN')}</td>
                    <td>${t.farmerName}</td>
                    <td>${t.purchaserName}</td>
                    <td>${t.gaadiNo}</td>
                    <td>${TransactionCalculator.formatWeight(t.weight)}</td>
                    <td>${TransactionCalculator.formatCurrency(t.calculations.totalAmount)}</td>
                    <td class="text-success">${TransactionCalculator.formatCurrency(t.calculations.firmCommission)}</td>
                </tr>
            `).join('');
        }
        
        resultsCard.style.display = 'block';
    }
    
    setupTransactionForm() {
        // Auto-calculate amounts when inputs change
        const inputs = ['weight', 'bhaav', 'mandiTax', 'commission', 'majduri'];
        
        inputs.forEach(inputId => {
            document.getElementById(inputId).addEventListener('input', () => {
                this.calculateTransactionAmounts();
            });
        });
        
        // Load farmer and purchaser suggestions
        this.loadFormSuggestions();
        
        // Set default date to today
        document.getElementById('transactionDate').value = new Date().toISOString().split('T')[0];
    }
    
    loadFormSuggestions() {
        const farmers = DataManager.getFarmers();
        const purchasers = DataManager.getPurchasers();
        
        // Populate farmer suggestions
        const farmersList = document.getElementById('farmersList');
        farmersList.innerHTML = farmers.map(farmer => `<option value="${farmer.name}"></option>`).join('');
        
        // Populate purchaser suggestions
        const purchasersList = document.getElementById('purchasersList');
        purchasersList.innerHTML = purchasers.map(purchaser => `<option value="${purchaser.name}"></option>`).join('');
    }
    
    calculateTransactionAmounts() {
        const formData = {
            weight: document.getElementById('weight').value,
            bhaav: document.getElementById('bhaav').value,
            mandiTax: document.getElementById('mandiTax').value,
            commission: document.getElementById('commission').value,
            majduri: document.getElementById('majduri').value
        };
        
        // Skip calculation if essential fields are empty
        if (!formData.weight || !formData.bhaav) {
            document.getElementById('calculatedTotalAmount').textContent = '₹0';
            document.getElementById('calculatedNetAmount').textContent = '₹0';
            document.getElementById('calculatedFirmCommission').textContent = '₹0';
            return;
        }
        
        const calculations = TransactionCalculator.calculateAmounts(formData);
        
        document.getElementById('calculatedTotalAmount').textContent = TransactionCalculator.formatCurrency(calculations.totalAmount);
        document.getElementById('calculatedNetAmount').textContent = TransactionCalculator.formatCurrency(calculations.netAmount);
        document.getElementById('calculatedFirmCommission').textContent = TransactionCalculator.formatCurrency(calculations.firmCommission);
    }
    
    openTransactionModal() {
        // Reset form
        document.getElementById('transactionForm').reset();
        document.getElementById('transactionDate').value = new Date().toISOString().split('T')[0];
        
        // Clear calculated amounts
        document.getElementById('calculatedTotalAmount').textContent = '₹0';
        document.getElementById('calculatedNetAmount').textContent = '₹0';
        document.getElementById('calculatedFirmCommission').textContent = '₹0';
        
        // Refresh form suggestions
        this.loadFormSuggestions();
        
        // Show modal
        document.getElementById('modalOverlay').style.display = 'flex';
        
        // Focus on first input
        setTimeout(() => {
            document.getElementById('transactionDate').focus();
        }, 100);
    }
    
    closeTransactionModal() {
        document.getElementById('modalOverlay').style.display = 'none';
    }
    
    saveTransaction() {
        const form = document.getElementById('transactionForm');
        const formData = new FormData(form);
        
        // Validate required fields
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        
        const transactionData = {
            date: formData.get('date'),
            boardNo: formData.get('boardNo') || '',
            gaadiNo: formData.get('gaadiNo'),
            farmerName: formData.get('farmerName'),
            purchaserName: formData.get('purchaserName'),
            weight: formData.get('weight'),
            lungar: formData.get('lungar'),
            bhaav: formData.get('bhaav'),
            mandiTax: formData.get('mandiTax'),
            commission: formData.get('commission'),
            majduri: formData.get('majduri')
        };
        
        try {
            const transaction = DataManager.addTransaction(transactionData);
            this.closeTransactionModal();
            this.showToast('Transaction saved successfully!', 'success');
            this.refreshCurrentPage();
        } catch (error) {
            this.showToast('Error saving transaction: ' + error.message, 'error');
        }
    }
    
    switchBalanceTab(tab) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        
        // Update tab content
        document.querySelectorAll('.balance-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tab}-balances`).classList.add('active');
    }
    
    toggleSidebar() {
        document.getElementById('sidebar').classList.toggle('collapsed');
    }
    
    toggleMobileSidebar() {
        document.getElementById('sidebar').classList.toggle('open');
    }
    
    refreshCurrentPage() {
        this.loadPageData(this.currentPage);
        this.showToast('Page refreshed', 'info');
    }
    
    handleMenuAction(action) {
        switch (action) {
            case 'new-trade':
                this.openTransactionModal();
                break;
            case 'export-data':
                this.exportAllData();
                break;
            case 'backup-data':
                this.createBackup();
                break;
            case 'generate-sample':
                this.generateSampleData();
                break;
            case 'clear-all-data':
                this.clearAllData();
                break;
        }
    }
    
    generateSampleData() {
        const result = DataManager.generateSampleData();
        this.showToast(
            `Generated ${result.transactions} transactions, ${result.farmers} farmers, and ${result.purchasers} purchasers`,
            'success',
            'Sample Data Generated'
        );
        this.refreshCurrentPage();
    }
    
    clearAllData() {
        localStorage.clear();
        this.showToast('All data has been cleared', 'success');
        this.refreshCurrentPage();
    }
    
    async createBackup() {
        if (window.electronAPI) {
            const data = {
                transactions: DataManager.getTransactions(),
                farmers: DataManager.getFarmers(),
                purchasers: DataManager.getPurchasers(),
                timestamp: new Date().toISOString()
            };
            
            const result = await window.electronAPI.createBackup(data);
            if (result.success) {
                this.showToast(`Backup created: ${result.fileName}`, 'success');
            } else {
                this.showToast('Backup failed: ' + result.error, 'error');
            }
        }
    }
    
    // Placeholder methods for future implementation
    viewTransaction(id) {
        this.showToast('View transaction feature coming soon!', 'info');
    }
    
    deleteTransaction(id) {
        if (confirm('Are you sure you want to delete this transaction?')) {
            // Implementation for deleting transaction
            this.showToast('Delete transaction feature coming soon!', 'info');
        }
    }
    
    viewFarmerDetails(id) {
        this.showToast('View farmer details feature coming soon!', 'info');
    }
    
    payFarmer(id) {
        this.showToast('Pay farmer feature coming soon!', 'info');
    }
    
    viewPurchaserDetails(id) {
        this.showToast('View purchaser details feature coming soon!', 'info');
    }
    
    receivePurchaserPayment(id) {
        this.showToast('Receive payment feature coming soon!', 'info');
    }
    
    generateDailyReport() {
        this.showToast('Daily report feature coming soon!', 'info');
    }
    
    generateMonthlyReport() {
        this.showToast('Monthly report feature coming soon!', 'info');
    }
    
    generateFarmerStatement() {
        this.showToast('Farmer statement feature coming soon!', 'info');
    }
    
    generatePurchaserStatement() {
        this.showToast('Purchaser statement feature coming soon!', 'info');
    }
    
    showToast(message, type = 'info', title = null) {
        const container = document.getElementById('toastContainer');
        const toastId = 'toast-' + Date.now();
        
        const icons = {
            success: 'check-circle',
            error: 'x-circle',
            warning: 'alert-triangle',
            info: 'info'
        };
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.id = toastId;
        toast.innerHTML = `
            <i data-lucide="${icons[type]}" class="toast-icon"></i>
            <div class="toast-content">
                ${title ? `<div class="toast-title">${title}</div>` : ''}
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i data-lucide="x"></i>
            </button>
        `;
        
        container.appendChild(toast);
        lucide.createIcons();
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            const toastElement = document.getElementById(toastId);
            if (toastElement) {
                toastElement.remove();
            }
        }, 5000);
    }
}

// Initialize the application
const app = new SSVikasApp();

// Make app globally available for onclick handlers
window.app = app;