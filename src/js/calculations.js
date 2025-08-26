// calculations.js - Business Logic for SSVikas Middleman App

class TransactionCalculator {
    /**
     * Calculate all amounts for a transaction
     * @param {Object} data - Transaction data
     * @returns {Object} Calculated amounts
     */
    static calculateAmounts(data) {
        const { weight, bhaav, mandiTax, commission, majduri } = data;
        
        // Convert inputs to numbers
        const weightKg = parseFloat(weight) || 0;
        const bhaavPer100kg = parseFloat(bhaav) || 0;
        const mandiTaxPercent = parseFloat(mandiTax) || 0;
        const commissionAmount = parseFloat(commission) || 0;
        const majduriAmount = parseFloat(majduri) || 0;
        
        // Calculate total amount (what purchaser pays to firm)
        const totalAmount = (weightKg * bhaavPer100kg) / 100;
        
        // Calculate mandi tax amount
        const mandiTaxAmount = (totalAmount * mandiTaxPercent) / 100;
        
        // Calculate net amount (what farmer receives)
        const netAmount = totalAmount - mandiTaxAmount - commissionAmount - majduriAmount;
        
        // Calculate firm's total commission/profit
        const firmCommission = commissionAmount + mandiTaxAmount + majduriAmount;
        
        return {
            totalAmount: this.roundToTwoDecimals(totalAmount),
            mandiTaxAmount: this.roundToTwoDecimals(mandiTaxAmount),
            netAmount: this.roundToTwoDecimals(netAmount),
            firmCommission: this.roundToTwoDecimals(firmCommission),
            commissionAmount: this.roundToTwoDecimals(commissionAmount),
            majduriAmount: this.roundToTwoDecimals(majduriAmount)
        };
    }
    
    /**
     * Round number to 2 decimal places
     */
    static roundToTwoDecimals(num) {
        return Math.round((num + Number.EPSILON) * 100) / 100;
    }
    
    /**
     * Format currency for display
     */
    static formatCurrency(amount, showSymbol = true) {
        const formatted = new Intl.NumberFormat('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
        
        return showSymbol ? `₹${formatted}` : formatted;
    }
    
    /**
     * Format weight for display
     */
    static formatWeight(weight) {
        return `${parseFloat(weight).toFixed(2)} KG`;
    }
}

class AccountManager {
    /**
     * Update farmer account after transaction
     */
    static updateFarmerAccount(farmerName, transactionData, calculatedAmounts) {
        const farmers = DataManager.getFarmers();
        let farmer = farmers.find(f => f.name.toLowerCase() === farmerName.toLowerCase());
        
        if (!farmer) {
            farmer = {
                id: this.generateId(),
                name: farmerName,
                balance: 0,
                totalTransactions: 0,
                totalWeight: 0,
                totalEarnings: 0,
                createdDate: new Date().toISOString(),
                lastTransactionDate: null
            };
            farmers.push(farmer);
        }
        
        // Update farmer data
        farmer.balance += calculatedAmounts.netAmount;
        farmer.totalTransactions += 1;
        farmer.totalWeight += parseFloat(transactionData.weight);
        farmer.totalEarnings += calculatedAmounts.netAmount;
        farmer.lastTransactionDate = transactionData.date;
        
        DataManager.saveFarmers(farmers);
        return farmer;
    }
    
    /**
     * Update purchaser account after transaction
     */
    static updatePurchaserAccount(purchaserName, transactionData, calculatedAmounts) {
        const purchasers = DataManager.getPurchasers();
        let purchaser = purchasers.find(p => p.name.toLowerCase() === purchaserName.toLowerCase());
        
        if (!purchaser) {
            purchaser = {
                id: this.generateId(),
                name: purchaserName,
                balance: 0, // Amount they owe to firm
                totalTransactions: 0,
                totalWeight: 0,
                totalPayments: 0,
                createdDate: new Date().toISOString(),
                lastTransactionDate: null
            };
            purchasers.push(purchaser);
        }
        
        // Update purchaser data (they owe more money to firm)
        purchaser.balance += calculatedAmounts.totalAmount;
        purchaser.totalTransactions += 1;
        purchaser.totalWeight += parseFloat(transactionData.weight);
        purchaser.totalPayments += calculatedAmounts.totalAmount;
        purchaser.lastTransactionDate = transactionData.date;
        
        DataManager.savePurchasers(purchasers);
        return purchaser;
    }
    
    /**
     * Process payment from purchaser to firm
     */
    static processPurchaserPayment(purchaserName, amount, paymentDate, paymentMode = 'cash') {
        const purchasers = DataManager.getPurchasers();
        const purchaser = purchasers.find(p => p.name.toLowerCase() === purchaserName.toLowerCase());
        
        if (!purchaser) {
            throw new Error('Purchaser not found');
        }
        
        if (amount > purchaser.balance) {
            throw new Error('Payment amount exceeds outstanding balance');
        }
        
        // Reduce purchaser balance
        purchaser.balance -= amount;
        
        // Record payment
        if (!purchaser.payments) {
            purchaser.payments = [];
        }
        
        purchaser.payments.push({
            id: this.generateId(),
            amount: amount,
            date: paymentDate,
            mode: paymentMode,
            timestamp: new Date().toISOString()
        });
        
        DataManager.savePurchasers(purchasers);
        return purchaser;
    }
    
    /**
     * Process payment from firm to farmer
     */
    static processFarmerPayment(farmerName, amount, paymentDate, paymentMode = 'cash') {
        const farmers = DataManager.getFarmers();
        const farmer = farmers.find(f => f.name.toLowerCase() === farmerName.toLowerCase());
        
        if (!farmer) {
            throw new Error('Farmer not found');
        }
        
        if (amount > farmer.balance) {
            throw new Error('Payment amount exceeds outstanding balance');
        }
        
        // Reduce farmer balance
        farmer.balance -= amount;
        
        // Record payment
        if (!farmer.payments) {
            farmer.payments = [];
        }
        
        farmer.payments.push({
            id: this.generateId(),
            amount: amount,
            date: paymentDate,
            mode: paymentMode,
            timestamp: new Date().toISOString()
        });
        
        DataManager.saveFarmers(farmers);
        return farmer;
    }
    
    /**
     * Get account summary
     */
    static getAccountSummary() {
        const farmers = DataManager.getFarmers();
        const purchasers = DataManager.getPurchasers();
        const transactions = DataManager.getTransactions();
        
        const totalFarmerBalance = farmers.reduce((sum, farmer) => sum + farmer.balance, 0);
        const totalPurchaserBalance = purchasers.reduce((sum, purchaser) => sum + purchaser.balance, 0);
        const totalCommission = transactions.reduce((sum, t) => sum + (t.calculations?.firmCommission || 0), 0);
        
        return {
            totalFarmersOwed: totalFarmerBalance, // Money firm owes to farmers
            totalPurchasersOwe: totalPurchaserBalance, // Money purchasers owe to firm
            netBalance: totalPurchaserBalance - totalFarmerBalance, // Firm's net position
            totalCommissionEarned: totalCommission,
            activeFarmers: farmers.filter(f => f.balance > 0).length,
            activePurchasers: purchasers.filter(p => p.balance > 0).length
        };
    }
    
    /**
     * Generate unique ID
     */
    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
}

class DataManager {
    /**
     * Get all transactions
     */
    static getTransactions() {
        const data = localStorage.getItem('ssvikas_transactions');
        return data ? JSON.parse(data) : [];
    }
    
    /**
     * Save transactions
     */
    static saveTransactions(transactions) {
        localStorage.setItem('ssvikas_transactions', JSON.stringify(transactions));
    }
    
    /**
     * Get all farmers
     */
    static getFarmers() {
        const data = localStorage.getItem('ssvikas_farmers');
        return data ? JSON.parse(data) : [];
    }
    
    /**
     * Save farmers
     */
    static saveFarmers(farmers) {
        localStorage.setItem('ssvikas_farmers', JSON.stringify(farmers));
    }
    
    /**
     * Get all purchasers
     */
    static getPurchasers() {
        const data = localStorage.getItem('ssvikas_purchasers');
        return data ? JSON.parse(data) : [];
    }
    
    /**
     * Save purchasers
     */
    static savePurchasers(purchasers) {
        localStorage.setItem('ssvikas_purchasers', JSON.stringify(purchasers));
    }
    
    /**
     * Add new transaction
     */
    static addTransaction(transactionData) {
        const transactions = this.getTransactions();
        
        // Calculate amounts
        const calculations = TransactionCalculator.calculateAmounts(transactionData);
        
        // Create transaction object
        const transaction = {
            id: AccountManager.generateId(),
            ...transactionData,
            calculations,
            timestamp: new Date().toISOString()
        };
        
        // Add transaction
        transactions.push(transaction);
        this.saveTransactions(transactions);
        
        // Update farmer and purchaser accounts
        AccountManager.updateFarmerAccount(transactionData.farmerName, transactionData, calculations);
        AccountManager.updatePurchaserAccount(transactionData.purchaserName, transactionData, calculations);
        
        return transaction;
    }
    
    /**
     * Search transactions by various criteria
     */
    static searchTransactions(searchTerm, searchType = 'all') {
        const transactions = this.getTransactions();
        
        if (!searchTerm) return transactions;
        
        return transactions.filter(transaction => {
            const term = searchTerm.toLowerCase();
            
            switch (searchType) {
                case 'farmer':
                    return transaction.farmerName.toLowerCase().includes(term);
                case 'purchaser':
                    return transaction.purchaserName.toLowerCase().includes(term);
                case 'date':
                    return transaction.date.includes(term);
                case 'vehicle':
                    return transaction.gaadiNo.toLowerCase().includes(term);
                default:
                    // Search in all fields
                    return (
                        transaction.farmerName.toLowerCase().includes(term) ||
                        transaction.purchaserName.toLowerCase().includes(term) ||
                        transaction.gaadiNo.toLowerCase().includes(term) ||
                        transaction.boardNo?.toLowerCase().includes(term) ||
                        transaction.date.includes(term)
                    );
            }
        });
    }
    
    /**
     * Get transactions for date range
     */
    static getTransactionsByDateRange(startDate, endDate) {
        const transactions = this.getTransactions();
        return transactions.filter(t => {
            const transactionDate = new Date(t.date);
            return transactionDate >= new Date(startDate) && transactionDate <= new Date(endDate);
        });
    }
    
    /**
     * Get statistics
     */
    static getStatistics(dateRange = null) {
        let transactions = this.getTransactions();
        
        if (dateRange) {
            transactions = this.getTransactionsByDateRange(dateRange.start, dateRange.end);
        }
        
        const totalTransactions = transactions.length;
        const totalWeight = transactions.reduce((sum, t) => sum + parseFloat(t.weight), 0);
        const totalCommission = transactions.reduce((sum, t) => sum + (t.calculations?.firmCommission || 0), 0);
        const totalVolume = transactions.reduce((sum, t) => sum + (t.calculations?.totalAmount || 0), 0);
        
        return {
            totalTransactions,
            totalWeight: TransactionCalculator.roundToTwoDecimals(totalWeight),
            totalCommission: TransactionCalculator.roundToTwoDecimals(totalCommission),
            totalVolume: TransactionCalculator.roundToTwoDecimals(totalVolume),
            averageWeight: totalTransactions > 0 ? TransactionCalculator.roundToTwoDecimals(totalWeight / totalTransactions) : 0,
            averageCommission: totalTransactions > 0 ? TransactionCalculator.roundToTwoDecimals(totalCommission / totalTransactions) : 0
        };
    }
    
    /**
     * Generate sample data for demo
     */
    static generateSampleData() {
        // Clear existing data
        localStorage.removeItem('ssvikas_transactions');
        localStorage.removeItem('ssvikas_farmers');
        localStorage.removeItem('ssvikas_purchasers');
        
        // Sample farmers
        const sampleFarmers = [
            'राम प्रसाद शर्मा',
            'श्याम लाल पटेल',
            'गोपाल सिंह',
            'मोहन कुमार',
            'राज कुमार वर्मा'
        ];
        
        // Sample purchasers
        const samplePurchasers = [
            'आर्य ट्रेडर्स',
            'गुप्ता फ्रूट्स',
            'शर्मा एंटरप्राइजेज',
            'पटेल एक्सपोर्ट्स',
            'सिंह कमोडिटीज'
        ];
        
        // Generate sample transactions for last 30 days
        const transactions = [];
        const today = new Date();
        
        for (let i = 0; i < 25; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - Math.floor(Math.random() * 30));
            
            const transactionData = {
                date: date.toISOString().split('T')[0],
                boardNo: `B${Math.floor(Math.random() * 999) + 100}`,
                gaadiNo: `MP-${Math.floor(Math.random() * 99) + 10}-ZD-${Math.floor(Math.random() * 9999) + 1000}`,
                farmerName: sampleFarmers[Math.floor(Math.random() * sampleFarmers.length)],
                purchaserName: samplePurchasers[Math.floor(Math.random() * samplePurchasers.length)],
                weight: (Math.random() * 500 + 100).toFixed(2),
                lungar: Math.floor(Math.random() * 50) + 10,
                bhaav: (Math.random() * 1000 + 2000).toFixed(2),
                mandiTax: (Math.random() * 3 + 1).toFixed(2),
                commission: (Math.random() * 200 + 50).toFixed(2),
                majduri: (Math.random() * 100 + 25).toFixed(2)
            };
            
            this.addTransaction(transactionData);
        }
        
        return {
            transactions: this.getTransactions().length,
            farmers: this.getFarmers().length,
            purchasers: this.getPurchasers().length
        };
    }
}

// Export classes for global access
window.TransactionCalculator = TransactionCalculator;
window.AccountManager = AccountManager;
window.DataManager = DataManager;