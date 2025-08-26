// utils.js - Utility Functions for SSVikas App

/**
 * Date Utilities
 */
class DateUtils {
    /**
     * Format date for display
     */
    static formatDate(date, format = 'dd/mm/yyyy') {
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        
        switch (format) {
            case 'dd/mm/yyyy':
                return `${day}/${month}/${year}`;
            case 'dd-mm-yyyy':
                return `${day}-${month}-${year}`;
            case 'yyyy-mm-dd':
                return `${year}-${month}-${day}`;
            case 'readable':
                return d.toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            default:
                return `${day}/${month}/${year}`;
        }
    }
    
    /**
     * Get date range for common periods
     */
    static getDateRange(period) {
        const now = new Date();
        const start = new Date();
        
        switch (period) {
            case 'today':
                start.setHours(0, 0, 0, 0);
                now.setHours(23, 59, 59, 999);
                break;
            case 'yesterday':
                start.setDate(start.getDate() - 1);
                start.setHours(0, 0, 0, 0);
                now.setDate(now.getDate() - 1);
                now.setHours(23, 59, 59, 999);
                break;
            case 'thisWeek':
                const dayOfWeek = start.getDay();
                start.setDate(start.getDate() - dayOfWeek);
                start.setHours(0, 0, 0, 0);
                break;
            case 'thisMonth':
                start.setDate(1);
                start.setHours(0, 0, 0, 0);
                break;
            case 'last30Days':
                start.setDate(start.getDate() - 30);
                start.setHours(0, 0, 0, 0);
                break;
            case 'last90Days':
                start.setDate(start.getDate() - 90);
                start.setHours(0, 0, 0, 0);
                break;
            default:
                start.setHours(0, 0, 0, 0);
        }
        
        return {
            start: start.toISOString().split('T')[0],
            end: now.toISOString().split('T')[0]
        };
    }
    
    /**
     * Check if date is in range
     */
    static isDateInRange(date, startDate, endDate) {
        const d = new Date(date);
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        return d >= start && d <= end;
    }
}

/**
 * Validation Utilities
 */
class ValidationUtils {
    /**
     * Validate required fields
     */
    static validateRequired(value, fieldName) {
        if (!value || value.toString().trim() === '') {
            return `${fieldName} is required`;
        }
        return null;
    }
    
    /**
     * Validate number field
     */
    static validateNumber(value, fieldName, min = null, max = null) {
        const num = parseFloat(value);
        
        if (isNaN(num)) {
            return `${fieldName} must be a valid number`;
        }
        
        if (min !== null && num < min) {
            return `${fieldName} must be at least ${min}`;
        }
        
        if (max !== null && num > max) {
            return `${fieldName} must not exceed ${max}`;
        }
        
        return null;
    }
    
    /**
     * Validate date field
     */
    static validateDate(value, fieldName) {
        const date = new Date(value);
        
        if (isNaN(date.getTime())) {
            return `${fieldName} must be a valid date`;
        }
        
        return null;
    }
    
    /**
     * Validate vehicle number format
     */
    static validateVehicleNumber(value) {
        const pattern = /^[A-Z]{2}-\d{2}-[A-Z]{1,2}-\d{4}$/;
        
        if (!pattern.test(value.toUpperCase())) {
            return 'Vehicle number format should be like: MP-11-ZD-6272';
        }
        
        return null;
    }
    
    /**
     * Validate form data
     */
    static validateTransactionForm(formData) {
        const errors = [];
        
        // Required field validations
        const requiredFields = [
            { field: 'date', name: 'Date' },
            { field: 'gaadiNo', name: 'Vehicle Number' },
            { field: 'farmerName', name: 'Farmer Name' },
            { field: 'purchaserName', name: 'Purchaser Name' },
            { field: 'weight', name: 'Weight' },
            { field: 'lungar', name: 'Lungar' },
            { field: 'bhaav', name: 'Bhaav' },
            { field: 'mandiTax', name: 'Mandi Tax' },
            { field: 'commission', name: 'Commission' },
            { field: 'majduri', name: 'Majduri' }
        ];
        
        requiredFields.forEach(({ field, name }) => {
            const error = this.validateRequired(formData[field], name);
            if (error) errors.push(error);
        });
        
        // Number validations
        if (formData.weight) {
            const error = this.validateNumber(formData.weight, 'Weight', 0);
            if (error) errors.push(error);
        }
        
        if (formData.bhaav) {
            const error = this.validateNumber(formData.bhaav, 'Bhaav', 0);
            if (error) errors.push(error);
        }
        
        if (formData.mandiTax) {
            const error = this.validateNumber(formData.mandiTax, 'Mandi Tax', 0, 100);
            if (error) errors.push(error);
        }
        
        // Date validation
        if (formData.date) {
            const error = this.validateDate(formData.date, 'Date');
            if (error) errors.push(error);
        }
        
        // Vehicle number validation
        if (formData.gaadiNo) {
            const error = this.validateVehicleNumber(formData.gaadiNo);
            if (error) errors.push(error);
        }
        
        return errors;
    }
}

/**
 * Export Utilities
 */
class ExportUtils {
    /**
     * Export data to CSV
     */
    static exportToCSV(data, filename, headers = null) {
        if (!data || data.length === 0) {
            throw new Error('No data to export');
        }
        
        // Use provided headers or extract from first object
        const csvHeaders = headers || Object.keys(data[0]);
        
        // Create CSV content
        const csvContent = [
            csvHeaders.join(','),
            ...data.map(row => 
                csvHeaders.map(header => {
                    const value = row[header] || '';
                    // Escape commas and quotes
                    return typeof value === 'string' && (value.includes(',') || value.includes('"'))
                        ? `"${value.replace(/"/g, '""')}"`
                        : value;
                }).join(',')
            )
        ].join('\n');
        
        // Create and download file
        this.downloadFile(csvContent, `${filename}.csv`, 'text/csv');
    }
    
    /**
     * Export transactions to CSV
     */
    static exportTransactions(transactions, filename = 'transactions') {
        const exportData = transactions.map(t => ({
            'Date': DateUtils.formatDate(t.date),
            'Board No': t.boardNo || '',
            'Vehicle No': t.gaadiNo,
            'Farmer Name': t.farmerName,
            'Purchaser Name': t.purchaserName,
            'Weight (KG)': parseFloat(t.weight).toFixed(2),
            'Lungar': t.lungar,
            'Bhaav (₹/100kg)': parseFloat(t.bhaav).toFixed(2),
            'Mandi Tax (%)': parseFloat(t.mandiTax).toFixed(2),
            'Commission (₹)': parseFloat(t.commission).toFixed(2),
            'Majduri (₹)': parseFloat(t.majduri).toFixed(2),
            'Total Amount (₹)': t.calculations.totalAmount.toFixed(2),
            'Net Amount (₹)': t.calculations.netAmount.toFixed(2),
            'Firm Commission (₹)': t.calculations.firmCommission.toFixed(2)
        }));
        
        this.exportToCSV(exportData, filename);
    }
    
    /**
     * Export farmers to CSV
     */
    static exportFarmers(farmers, filename = 'farmers') {
        const exportData = farmers.map(f => ({
            'Name': f.name,
            'Total Transactions': f.totalTransactions,
            'Total Weight (KG)': f.totalWeight.toFixed(2),
            'Total Earnings (₹)': f.totalEarnings.toFixed(2),
            'Outstanding Balance (₹)': f.balance.toFixed(2),
            'Last Transaction Date': f.lastTransactionDate ? DateUtils.formatDate(f.lastTransactionDate) : 'N/A',
            'Created Date': DateUtils.formatDate(f.createdDate)
        }));
        
        this.exportToCSV(exportData, filename);
    }
    
    /**
     * Export purchasers to CSV
     */
    static exportPurchasers(purchasers, filename = 'purchasers') {
        const exportData = purchasers.map(p => ({
            'Name': p.name,
            'Total Transactions': p.totalTransactions,
            'Total Weight (KG)': p.totalWeight.toFixed(2),
            'Total Payments (₹)': p.totalPayments.toFixed(2),
            'Outstanding Balance (₹)': p.balance.toFixed(2),
            'Last Transaction Date': p.lastTransactionDate ? DateUtils.formatDate(p.lastTransactionDate) : 'N/A',
            'Created Date': DateUtils.formatDate(p.createdDate)
        }));
        
        this.exportToCSV(exportData, filename);
    }
    
    /**
     * Download file
     */
    static downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
    }
    
    /**
     * Generate PDF report (placeholder for future implementation)
     */
    static async generatePDFReport(data, title, filename) {
        // This would integrate with jsPDF or similar library
        console.log('PDF generation feature coming soon!');
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({ success: true, message: 'PDF generated successfully' });
            }, 1000);
        });
    }
}

/**
 * Search and Filter Utilities
 */
class SearchUtils {
    /**
     * Fuzzy search in text
     */
    static fuzzySearch(query, text) {
        const queryLower = query.toLowerCase();
        const textLower = text.toLowerCase();
        
        // Exact match gets highest priority
        if (textLower.includes(queryLower)) {
            return true;
        }
        
        // Character-by-character fuzzy matching
        let queryIndex = 0;
        for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
            if (textLower[i] === queryLower[queryIndex]) {
                queryIndex++;
            }
        }
        
        return queryIndex === queryLower.length;
    }
    
    /**
     * Filter array of objects by multiple criteria
     */
    static filterData(data, filters) {
        return data.filter(item => {
            return Object.entries(filters).every(([key, value]) => {
                if (!value) return true;
                
                const itemValue = item[key];
                if (!itemValue) return false;
                
                // Handle different filter types
                if (typeof value === 'string') {
                    return this.fuzzySearch(value, itemValue.toString());
                } else if (typeof value === 'object' && value.start && value.end) {
                    // Date range filter
                    return DateUtils.isDateInRange(itemValue, value.start, value.end);
                } else if (typeof value === 'number') {
                    return parseFloat(itemValue) === value;
                }
                
                return false;
            });
        });
    }
    
    /**
     * Sort array by multiple criteria
     */
    static sortData(data, sortBy, sortOrder = 'asc') {
        return [...data].sort((a, b) => {
            const aVal = a[sortBy];
            const bVal = b[sortBy];
            
            // Handle different data types
            if (typeof aVal === 'string' && typeof bVal === 'string') {
                const result = aVal.localeCompare(bVal);
                return sortOrder === 'asc' ? result : -result;
            } else if (typeof aVal === 'number' && typeof bVal === 'number') {
                const result = aVal - bVal;
                return sortOrder === 'asc' ? result : -result;
            } else if (aVal instanceof Date && bVal instanceof Date) {
                const result = aVal.getTime() - bVal.getTime();
                return sortOrder === 'asc' ? result : -result;
            }
            
            return 0;
        });
    }
}

/**
 * Local Storage Utilities
 */
class StorageUtils {
    /**
     * Get data from localStorage with error handling
     */
    static get(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            console.error(`Error reading from localStorage: ${key}`, error);
            return defaultValue;
        }
    }
    
    /**
     * Set data to localStorage with error handling
     */
    static set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`Error writing to localStorage: ${key}`, error);
            return false;
        }
    }
    
    /**
     * Remove data from localStorage
     */
    static remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error(`Error removing from localStorage: ${key}`, error);
            return false;
        }
    }
    
    /**
     * Clear all localStorage data
     */
    static clear() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('Error clearing localStorage', error);
            return false;
        }
    }
    
    /**
     * Get storage usage info
     */
    static getUsageInfo() {
        let totalSize = 0;
        const items = {};
        
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                const size = localStorage[key].length;
                items[key] = size;
                totalSize += size;
            }
        }
        
        return {
            totalSize: totalSize,
            totalSizeKB: (totalSize / 1024).toFixed(2),
            items: items,
            itemCount: Object.keys(items).length
        };
    }
}

/**
 * Performance Utilities
 */
class PerformanceUtils {
    /**
     * Debounce function to limit rapid function calls
     */
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    /**
     * Throttle function to limit function calls
     */
    static throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
    
    /**
     * Measure function execution time
     */
    static measureTime(func, label = 'Operation') {
        const start = performance.now();
        const result = func();
        const end = performance.now();
        console.log(`${label} took ${(end - start).toFixed(2)} milliseconds`);
        return result;
    }
}

/**
 * UI Utilities
 */
class UIUtils {
    /**
     * Show loading state
     */
    static showLoading(element, message = 'Loading...') {
        const originalContent = element.innerHTML;
        element.innerHTML = `
            <div class="loading">
                <i data-lucide="loader" class="loading-icon"></i>
                ${message}
            </div>
        `;
        
        // Re-initialize Lucide icons
        if (window.lucide) {
            lucide.createIcons();
        }
        
        return originalContent;
    }
    
    /**
     * Hide loading state
     */
    static hideLoading(element, originalContent) {
        element.innerHTML = originalContent;
        
        // Re-initialize Lucide icons
        if (window.lucide) {
            lucide.createIcons();
        }
    }
    
    /**
     * Smooth scroll to element
     */
    static scrollToElement(selector, offset = 0) {
        const element = document.querySelector(selector);
        if (element) {
            const y = element.getBoundingClientRect().top + window.pageYOffset + offset;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
    }
    
    /**
     * Copy text to clipboard
     */
    static async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (error) {
            console.error('Failed to copy text:', error);
            return false;
        }
    }
    
    /**
     * Format file size
     */
    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

/**
 * Print Utilities
 */
class PrintUtils {
    /**
     * Print specific element
     */
    static printElement(selector, title = 'SSVikas Print') {
        const element = document.querySelector(selector);
        if (!element) {
            console.error('Element not found for printing');
            return;
        }
        
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>${title}</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        table { width: 100%; border-collapse: collapse; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f2f2f2; }
                        @media print { body { margin: 0; } }
                    </style>
                </head>
                <body>
                    ${element.outerHTML}
                </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.focus();
        
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    }
    
    /**
     * Generate print-friendly transaction receipt
     */
    static generateTransactionReceipt(transaction) {
        const receiptHTML = `
            <div class="receipt">
                <h2 style="text-align: center; margin-bottom: 20px;">SSVikas Kela Agency</h2>
                <h3 style="text-align: center; margin-bottom: 30px;">Transaction Receipt</h3>
                
                <table style="width: 100%; margin-bottom: 20px;">
                    <tr><td><strong>Date:</strong></td><td>${DateUtils.formatDate(transaction.date)}</td></tr>
                    <tr><td><strong>Board No:</strong></td><td>${transaction.boardNo || 'N/A'}</td></tr>
                    <tr><td><strong>Vehicle No:</strong></td><td>${transaction.gaadiNo}</td></tr>
                    <tr><td><strong>Farmer:</strong></td><td>${transaction.farmerName}</td></tr>
                    <tr><td><strong>Purchaser:</strong></td><td>${transaction.purchaserName}</td></tr>
                </table>
                
                <table style="width: 100%; margin-bottom: 20px;">
                    <tr><td><strong>Weight:</strong></td><td>${TransactionCalculator.formatWeight(transaction.weight)}</td></tr>
                    <tr><td><strong>Lungar:</strong></td><td>${transaction.lungar} plants</td></tr>
                    <tr><td><strong>Bhaav:</strong></td><td>${TransactionCalculator.formatCurrency(parseFloat(transaction.bhaav))}/100kg</td></tr>
                </table>
                
                <table style="width: 100%;">
                    <tr><td><strong>Total Amount:</strong></td><td style="text-align: right;"><strong>${TransactionCalculator.formatCurrency(transaction.calculations.totalAmount)}</strong></td></tr>
                    <tr><td>Less: Mandi Tax (${transaction.mandiTax}%):</td><td style="text-align: right;">${TransactionCalculator.formatCurrency(transaction.calculations.mandiTaxAmount)}</td></tr>
                    <tr><td>Less: Commission:</td><td style="text-align: right;">${TransactionCalculator.formatCurrency(parseFloat(transaction.commission))}</td></tr>
                    <tr><td>Less: Majduri:</td><td style="text-align: right;">${TransactionCalculator.formatCurrency(parseFloat(transaction.majduri))}</td></tr>
                    <tr style="border-top: 2px solid #000;"><td><strong>Net Amount to Farmer:</strong></td><td style="text-align: right;"><strong>${TransactionCalculator.formatCurrency(transaction.calculations.netAmount)}</strong></td></tr>
                </table>
                
                <p style="text-align: center; margin-top: 30px; font-size: 12px; color: #666;">
                    Generated on ${DateUtils.formatDate(new Date(), 'readable')}
                </p>
            </div>
        `;
        
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Transaction Receipt</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        table { border-collapse: collapse; }
                        td { padding: 5px 10px; }
                        @media print { body { margin: 0; } }
                    </style>
                </head>
                <body>${receiptHTML}</body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.focus();
        
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    }
}

// Export utilities for global access
window.DateUtils = DateUtils;
window.ValidationUtils = ValidationUtils;
window.ExportUtils = ExportUtils;
window.SearchUtils = SearchUtils;
window.StorageUtils = StorageUtils;
window.PerformanceUtils = PerformanceUtils;
window.UIUtils = UIUtils;
window.PrintUtils = PrintUtils;