// database.js - SQLite Database Manager for SSVikas Admin

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

class DatabaseManager {
    constructor() {
        this.db = null;
        this.dbPath = null;
        this.initDatabase();
    }

    initDatabase() {
        try {
            // Create database directory
            const dbDir = path.join(__dirname, '..', 'database');
            if (!fs.existsSync(dbDir)) {
                fs.mkdirSync(dbDir, { recursive: true });
            }

            // Database file path
            this.dbPath = path.join(dbDir, 'ssvikas.db');
            
            // Initialize database connection
            this.db = new Database(this.dbPath);
            
            console.log('✅ Database connected:', this.dbPath);
            
            // Create tables
            this.createTables();
            
            // Import existing localStorage data if exists
            this.importExistingData();
            
        } catch (error) {
            console.error('❌ Database initialization failed:', error);
            throw error;
        }
    }

    createTables() {
        try {
            // Farmers table
            this.db.exec(`
                CREATE TABLE IF NOT EXISTS farmers (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    farmer_id TEXT UNIQUE NOT NULL,
                    name TEXT NOT NULL,
                    contact_number TEXT,
                    address_village TEXT,
                    address_district TEXT,
                    address_state TEXT,
                    address_pincode TEXT,
                    bank_account_number TEXT,
                    bank_ifsc_code TEXT,
                    bank_name TEXT,
                    bank_holder_name TEXT,
                    balance REAL DEFAULT 0,
                    total_transactions INTEGER DEFAULT 0,
                    total_weight REAL DEFAULT 0,
                    total_earnings REAL DEFAULT 0,
                    created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                    last_transaction_date DATETIME,
                    is_active BOOLEAN DEFAULT 1,
                    notes TEXT
                )
            `);

            // Purchasers table
            this.db.exec(`
                CREATE TABLE IF NOT EXISTS purchasers (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    purchaser_id TEXT UNIQUE NOT NULL,
                    name TEXT NOT NULL,
                    company_name TEXT,
                    contact_number TEXT,
                    email TEXT,
                    address_street TEXT,
                    address_city TEXT,
                    address_state TEXT,
                    address_pincode TEXT,
                    gst_number TEXT,
                    credit_limit REAL DEFAULT 0,
                    balance REAL DEFAULT 0,
                    total_transactions INTEGER DEFAULT 0,
                    total_weight REAL DEFAULT 0,
                    total_payments REAL DEFAULT 0,
                    created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                    last_transaction_date DATETIME,
                    is_active BOOLEAN DEFAULT 1,
                    notes TEXT
                )
            `);

            // Transactions table
            this.db.exec(`
                CREATE TABLE IF NOT EXISTS transactions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    transaction_id TEXT UNIQUE NOT NULL,
                    date DATE NOT NULL,
                    board_no TEXT,
                    gaadi_no TEXT NOT NULL,
                    farmer_id TEXT NOT NULL,
                    farmer_name TEXT NOT NULL,
                    purchaser_id TEXT NOT NULL,
                    purchaser_name TEXT NOT NULL,
                    weight REAL NOT NULL,
                    lungar INTEGER,
                    quality TEXT,
                    variety TEXT,
                    bhaav REAL NOT NULL,
                    mandi_tax REAL NOT NULL,
                    commission REAL NOT NULL,
                    majduri REAL NOT NULL,
                    transport REAL DEFAULT 0,
                    other_deductions REAL DEFAULT 0,
                    total_amount REAL NOT NULL,
                    mandi_tax_amount REAL NOT NULL,
                    net_amount REAL NOT NULL,
                    firm_commission REAL NOT NULL,
                    farmer_paid BOOLEAN DEFAULT 0,
                    farmer_paid_date DATETIME,
                    farmer_paid_amount REAL DEFAULT 0,
                    purchaser_paid BOOLEAN DEFAULT 0,
                    purchaser_paid_date DATETIME,
                    purchaser_paid_amount REAL DEFAULT 0,
                    created_by TEXT DEFAULT 'admin',
                    created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                    notes TEXT,
                    FOREIGN KEY (farmer_id) REFERENCES farmers (farmer_id),
                    FOREIGN KEY (purchaser_id) REFERENCES purchasers (purchaser_id)
                )
            `);

            // Firm Bank Ledger table
            this.db.exec(`
                CREATE TABLE IF NOT EXISTS firm_ledger (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    ledger_id TEXT UNIQUE NOT NULL,
                    date DATE NOT NULL,
                    type TEXT NOT NULL, -- INCOME, EXPENSE, TRANSFER
                    category TEXT NOT NULL, -- COMMISSION, TRANSPORT, OFFICE_EXPENSE, etc.
                    description TEXT NOT NULL,
                    amount REAL NOT NULL,
                    balance REAL NOT NULL,
                    reference_type TEXT, -- TRANSACTION, FARMER_PAYMENT, PURCHASER_PAYMENT
                    reference_id TEXT,
                    bank_account TEXT,
                    payment_mode TEXT, -- CASH, BANK_TRANSFER, CHEQUE, UPI
                    cheque_number TEXT,
                    created_by TEXT DEFAULT 'admin',
                    created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                    notes TEXT
                )
            `);

            // Farmer Payments table
            this.db.exec(`
                CREATE TABLE IF NOT EXISTS farmer_payments (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    payment_id TEXT UNIQUE NOT NULL,
                    farmer_id TEXT NOT NULL,
                    farmer_name TEXT NOT NULL,
                    amount REAL NOT NULL,
                    payment_date DATE NOT NULL,
                    payment_mode TEXT NOT NULL,
                    bank_account_number TEXT,
                    transaction_id TEXT,
                    utr_number TEXT,
                    cheque_number TEXT,
                    bank_name TEXT,
                    cheque_date DATE,
                    related_transactions TEXT, -- JSON array of transaction IDs
                    created_by TEXT DEFAULT 'admin',
                    created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                    notes TEXT,
                    FOREIGN KEY (farmer_id) REFERENCES farmers (farmer_id)
                )
            `);

            // Purchaser Payments table
            this.db.exec(`
                CREATE TABLE IF NOT EXISTS purchaser_payments (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    payment_id TEXT UNIQUE NOT NULL,
                    purchaser_id TEXT NOT NULL,
                    purchaser_name TEXT NOT NULL,
                    amount REAL NOT NULL,
                    received_date DATE NOT NULL,
                    payment_mode TEXT NOT NULL,
                    bank_account_number TEXT,
                    transaction_id TEXT,
                    deposit_slip_number TEXT,
                    cheque_number TEXT,
                    bank_name TEXT,
                    cheque_date DATE,
                    clearance_date DATE,
                    cheque_status TEXT, -- PENDING, CLEARED, BOUNCED
                    related_transactions TEXT, -- JSON array of transaction IDs
                    created_by TEXT DEFAULT 'admin',
                    created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                    notes TEXT,
                    FOREIGN KEY (purchaser_id) REFERENCES purchasers (purchaser_id)
                )
            `);

            // Create indexes for better performance
            this.db.exec(`
                CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
                CREATE INDEX IF NOT EXISTS idx_transactions_farmer ON transactions(farmer_id);
                CREATE INDEX IF NOT EXISTS idx_transactions_purchaser ON transactions(purchaser_id);
                CREATE INDEX IF NOT EXISTS idx_ledger_date ON firm_ledger(date);
                CREATE INDEX IF NOT EXISTS idx_ledger_type ON firm_ledger(type);
            `);

            console.log('✅ Database tables created successfully');

        } catch (error) {
            console.error('❌ Error creating database tables:', error);
            throw error;
        }
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Import existing localStorage data if exists
    importExistingData() {
        try {
            // Check if localStorage data exists (only in renderer process)
            if (typeof localStorage !== 'undefined') {
                const existingTransactions = localStorage.getItem('ssvikas_transactions');
                const existingFarmers = localStorage.getItem('ssvikas_farmers');
                const existingPurchasers = localStorage.getItem('ssvikas_purchasers');

                if (existingTransactions || existingFarmers || existingPurchasers) {
                    console.log('📦 Importing existing localStorage data...');
                    
                    // This will be handled by the main process
                    return { 
                        needsImport: true,
                        transactions: existingTransactions ? JSON.parse(existingTransactions) : [],
                        farmers: existingFarmers ? JSON.parse(existingFarmers) : [],
                        purchasers: existingPurchasers ? JSON.parse(existingPurchasers) : []
                    };
                }
            }
        } catch (error) {
            console.log('Import check error (expected in main process):', error.message);
        }
        
        return { needsImport: false };
    }

    // Farmer Operations
    createFarmer(farmerData) {
        try {
            const farmerId = farmerData.farmer_id || this.generateId();
            
            const stmt = this.db.prepare(`
                INSERT INTO farmers (
                    farmer_id, name, contact_number, address_village, address_district,
                    address_state, address_pincode, bank_account_number, bank_ifsc_code,
                    bank_name, bank_holder_name, balance, total_transactions, total_weight,
                    total_earnings, last_transaction_date, notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            const result = stmt.run(
                farmerId,
                farmerData.name,
                farmerData.contact_number || null,
                farmerData.address_village || null,
                farmerData.address_district || null,
                farmerData.address_state || null,
                farmerData.address_pincode || null,
                farmerData.bank_account_number || null,
                farmerData.bank_ifsc_code || null,
                farmerData.bank_name || null,
                farmerData.bank_holder_name || null,
                farmerData.balance || 0,
                farmerData.total_transactions || 0,
                farmerData.total_weight || 0,
                farmerData.total_earnings || 0,
                farmerData.last_transaction_date || null,
                farmerData.notes || null
            );

            return { ...farmerData, farmer_id: farmerId, id: result.lastInsertRowid };
        } catch (error) {
            console.error('Error creating farmer:', error);
            throw error;
        }
    }

    getFarmers() {
        try {
            const stmt = this.db.prepare('SELECT * FROM farmers WHERE is_active = 1 ORDER BY name');
            return stmt.all();
        } catch (error) {
            console.error('Error getting farmers:', error);
            return [];
        }
    }

    getFarmerById(farmerId) {
        try {
            const stmt = this.db.prepare('SELECT * FROM farmers WHERE farmer_id = ?');
            return stmt.get(farmerId);
        } catch (error) {
            console.error('Error getting farmer by ID:', error);
            return null;
        }
    }

    updateFarmer(farmerId, updates) {
        try {
            const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
            const values = Object.values(updates);
            
            const stmt = this.db.prepare(`UPDATE farmers SET ${setClause}, updated_date = CURRENT_TIMESTAMP WHERE farmer_id = ?`);
            const result = stmt.run(...values, farmerId);
            
            return result.changes > 0;
        } catch (error) {
            console.error('Error updating farmer:', error);
            return false;
        }
    }

    // Purchaser Operations
    createPurchaser(purchaserData) {
        try {
            const purchaserId = purchaserData.purchaser_id || this.generateId();
            
            const stmt = this.db.prepare(`
                INSERT INTO purchasers (
                    purchaser_id, name, company_name, contact_number, email,
                    address_street, address_city, address_state, address_pincode,
                    gst_number, credit_limit, balance, total_transactions,
                    total_weight, total_payments, last_transaction_date, notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            const result = stmt.run(
                purchaserId,
                purchaserData.name,
                purchaserData.company_name || null,
                purchaserData.contact_number || null,
                purchaserData.email || null,
                purchaserData.address_street || null,
                purchaserData.address_city || null,
                purchaserData.address_state || null,
                purchaserData.address_pincode || null,
                purchaserData.gst_number || null,
                purchaserData.credit_limit || 0,
                purchaserData.balance || 0,
                purchaserData.total_transactions || 0,
                purchaserData.total_weight || 0,
                purchaserData.total_payments || 0,
                purchaserData.last_transaction_date || null,
                purchaserData.notes || null
            );

            return { ...purchaserData, purchaser_id: purchaserId, id: result.lastInsertRowid };
        } catch (error) {
            console.error('Error creating purchaser:', error);
            throw error;
        }
    }

    getPurchasers() {
        try {
            const stmt = this.db.prepare('SELECT * FROM purchasers WHERE is_active = 1 ORDER BY name');
            return stmt.all();
        } catch (error) {
            console.error('Error getting purchasers:', error);
            return [];
        }
    }

    getPurchaserById(purchaserId) {
        try {
            const stmt = this.db.prepare('SELECT * FROM purchasers WHERE purchaser_id = ?');
            return stmt.get(purchaserId);
        } catch (error) {
            console.error('Error getting purchaser by ID:', error);
            return null;
        }
    }

    // Transaction Operations
    createTransaction(transactionData) {
        try {
            const transactionId = this.generateId();
            
            const stmt = this.db.prepare(`
                INSERT INTO transactions (
                    transaction_id, date, board_no, gaadi_no, farmer_id, farmer_name,
                    purchaser_id, purchaser_name, weight, lungar, quality, variety,
                    bhaav, mandi_tax, commission, majduri, transport, other_deductions,
                    total_amount, mandi_tax_amount, net_amount, firm_commission, notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            const result = stmt.run(
                transactionId,
                transactionData.date,
                transactionData.board_no || null,
                transactionData.gaadi_no,
                transactionData.farmer_id,
                transactionData.farmer_name,
                transactionData.purchaser_id,
                transactionData.purchaser_name,
                transactionData.weight,
                transactionData.lungar || null,
                transactionData.quality || null,
                transactionData.variety || null,
                transactionData.bhaav,
                transactionData.mandi_tax,
                transactionData.commission,
                transactionData.majduri,
                transactionData.transport || 0,
                transactionData.other_deductions || 0,
                transactionData.total_amount,
                transactionData.mandi_tax_amount,
                transactionData.net_amount,
                transactionData.firm_commission,
                transactionData.notes || null
            );

            // Update farmer balance and stats
            this.updateFarmerAfterTransaction(transactionData.farmer_id, transactionData);
            
            // Update purchaser balance and stats
            this.updatePurchaserAfterTransaction(transactionData.purchaser_id, transactionData);
            
            // Add entry to firm ledger
            this.addLedgerEntry({
                type: 'INCOME',
                category: 'COMMISSION',
                description: `Commission from transaction ${transactionId}`,
                amount: transactionData.firm_commission,
                reference_type: 'TRANSACTION',
                reference_id: transactionId,
                date: transactionData.date
            });

            return { ...transactionData, transaction_id: transactionId, id: result.lastInsertRowid };
        } catch (error) {
            console.error('Error creating transaction:', error);
            throw error;
        }
    }

    getTransactions(limit = null, offset = 0) {
        try {
            let query = 'SELECT * FROM transactions ORDER BY date DESC, created_date DESC';
            if (limit) {
                query += ` LIMIT ${limit} OFFSET ${offset}`;
            }
            
            const stmt = this.db.prepare(query);
            return stmt.all();
        } catch (error) {
            console.error('Error getting transactions:', error);
            return [];
        }
    }

    searchTransactions(searchTerm, searchType = 'all') {
        try {
            let query = 'SELECT * FROM transactions WHERE ';
            let params = [`%${searchTerm.toLowerCase()}%`];

            switch (searchType) {
                case 'farmer':
                    query += 'LOWER(farmer_name) LIKE ?';
                    break;
                case 'purchaser':
                    query += 'LOWER(purchaser_name) LIKE ?';
                    break;
                case 'date':
                    query += 'date LIKE ?';
                    params = [`%${searchTerm}%`];
                    break;
                case 'vehicle':
                    query += 'LOWER(gaadi_no) LIKE ?';
                    break;
                default:
                    query += '(LOWER(farmer_name) LIKE ? OR LOWER(purchaser_name) LIKE ? OR LOWER(gaadi_no) LIKE ? OR LOWER(board_no) LIKE ? OR date LIKE ?)';
                    params = Array(5).fill(`%${searchTerm.toLowerCase()}%`);
                    params[4] = `%${searchTerm}%`; // date search without lowercase
            }

            query += ' ORDER BY date DESC, created_date DESC';

            const stmt = this.db.prepare(query);
            return stmt.all(...params);
        } catch (error) {
            console.error('Error searching transactions:', error);
            return [];
        }
    }

    // Helper method to update farmer after transaction
    updateFarmerAfterTransaction(farmerId, transactionData) {
        try {
            const stmt = this.db.prepare(`
                UPDATE farmers SET 
                    balance = balance + ?,
                    total_transactions = total_transactions + 1,
                    total_weight = total_weight + ?,
                    total_earnings = total_earnings + ?,
                    last_transaction_date = ?
                WHERE farmer_id = ?
            `);

            stmt.run(
                transactionData.net_amount,
                transactionData.weight,
                transactionData.net_amount,
                transactionData.date,
                farmerId
            );
        } catch (error) {
            console.error('Error updating farmer after transaction:', error);
        }
    }

    // Helper method to update purchaser after transaction
    updatePurchaserAfterTransaction(purchaserId, transactionData) {
        try {
            const stmt = this.db.prepare(`
                UPDATE purchasers SET 
                    balance = balance + ?,
                    total_transactions = total_transactions + 1,
                    total_weight = total_weight + ?,
                    total_payments = total_payments + ?,
                    last_transaction_date = ?
                WHERE purchaser_id = ?
            `);

            stmt.run(
                transactionData.total_amount,
                transactionData.weight,
                transactionData.total_amount,
                transactionData.date,
                purchaserId
            );
        } catch (error) {
            console.error('Error updating purchaser after transaction:', error);
        }
    }

    // Firm Ledger Operations
    addLedgerEntry(entryData) {
        try {
            const ledgerId = this.generateId();
            
            // Get current balance
            const balanceStmt = this.db.prepare('SELECT balance FROM firm_ledger ORDER BY created_date DESC LIMIT 1');
            const lastEntry = balanceStmt.get();
            let currentBalance = lastEntry ? lastEntry.balance : 0;
            
            // Calculate new balance
            const newBalance = entryData.type === 'INCOME' 
                ? currentBalance + entryData.amount 
                : currentBalance - entryData.amount;
            
            const stmt = this.db.prepare(`
                INSERT INTO firm_ledger (
                    ledger_id, date, type, category, description, amount, balance,
                    reference_type, reference_id, bank_account, payment_mode,
                    cheque_number, created_by, notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            const result = stmt.run(
                ledgerId,
                entryData.date,
                entryData.type,
                entryData.category,
                entryData.description,
                entryData.amount,
                newBalance,
                entryData.reference_type || null,
                entryData.reference_id || null,
                entryData.bank_account || null,
                entryData.payment_mode || 'CASH',
                entryData.cheque_number || null,
                entryData.created_by || 'admin',
                entryData.notes || null
            );

            return { ...entryData, ledger_id: ledgerId, balance: newBalance, id: result.lastInsertRowid };
        } catch (error) {
            console.error('Error adding ledger entry:', error);
            throw error;
        }
    }

    getLedgerEntries(limit = 100) {
        try {
            const stmt = this.db.prepare('SELECT * FROM firm_ledger ORDER BY date DESC, created_date DESC LIMIT ?');
            return stmt.all(limit);
        } catch (error) {
            console.error('Error getting ledger entries:', error);
            return [];
        }
    }

    getCurrentBalance() {
        try {
            const stmt = this.db.prepare('SELECT balance FROM firm_ledger ORDER BY created_date DESC LIMIT 1');
            const result = stmt.get();
            return result ? result.balance : 0;
        } catch (error) {
            console.error('Error getting current balance:', error);
            return 0;
        }
    }

    // Statistics
    getStatistics(dateRange = null) {
        try {
            let query = 'SELECT COUNT(*) as count, SUM(weight) as weight, SUM(firm_commission) as commission, SUM(total_amount) as volume FROM transactions';
            let params = [];

            if (dateRange) {
                query += ' WHERE date BETWEEN ? AND ?';
                params = [dateRange.start, dateRange.end];
            }

            const stmt = this.db.prepare(query);
            const result = stmt.get(...params);

            return {
                totalTransactions: result.count || 0,
                totalWeight: result.weight || 0,
                totalCommission: result.commission || 0,
                totalVolume: result.volume || 0,
                averageWeight: result.count > 0 ? (result.weight || 0) / result.count : 0,
                averageCommission: result.count > 0 ? (result.commission || 0) / result.count : 0
            };
        } catch (error) {
            console.error('Error getting statistics:', error);
            return {
                totalTransactions: 0,
                totalWeight: 0,
                totalCommission: 0,
                totalVolume: 0,
                averageWeight: 0,
                averageCommission: 0
            };
        }
    }

    // Backup and Export
    exportAllData() {
        try {
            return {
                farmers: this.getFarmers(),
                purchasers: this.getPurchasers(),
                transactions: this.getTransactions(),
                ledger: this.getLedgerEntries(1000),
                exportDate: new Date().toISOString(),
                version: '2.0'
            };
        } catch (error) {
            console.error('Error exporting data:', error);
            throw error;
        }
    }

    close() {
        if (this.db) {
            this.db.close();
            console.log('📝 Database connection closed');
        }
    }
}

module.exports = DatabaseManager;