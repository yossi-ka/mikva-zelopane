/**
 * Nedarim Plus Payment System Integration
 * Based on official API documentation from https://matara.pro/nedarimplus/ApiDocumentation.html
 * 
 * This file contains all functions for integrating with Nedarim Plus payment system
 * including iframe payments, transaction management, webhooks and more.
 */

// Configuration - Replace with your actual credentials
const NEDARIM_CONFIG = {
    mosadId: '7005806', // 7 digits
    apiValid: 'YOUR_API_VALID', // Authentication token from Nedarim office
    apiPassword: 'YOUR_API_PASSWORD', // API password for data retrieval
    baseUrl: 'https://matara.pro/nedarimplus',
    iframeUrl: 'https://www.matara.pro/nedarimplus/iframe/',
    trustedIP: '18.194.219.73' // Nedarim Plus server IP for webhook verification
};

/**
 * ========================================
 * IFRAME PAYMENT SYSTEM
 * ========================================
 */

/**
 * Initialize iframe payment system
 * @param {string} iframeId - ID of the existing iframe element
 * @param {Object} config - Optional configuration overrides
 */
function initNedarimIframe(iframeId = 'payment-iframe', config = {}) {
    const iframe = document.getElementById(iframeId);
    if (!iframe) {
        console.error('Payment iframe not found:', iframeId);
        return;
    }

    // Configure existing iframe
    iframe.src = config.iframeUrl || NEDARIM_CONFIG.iframeUrl;
    iframe.style.width = '100%';
    iframe.style.border = 'none';
    iframe.style.minHeight = '400px';
    iframe.style.padding = '15px';

    // Setup PostMessage communication
    setupIframeMessaging(iframe);

    return iframe;
}/**
 * Setup PostMessage communication with iframe
 * @param {HTMLIFrameElement} iframe - The payment iframe element
 */
function setupIframeMessaging(iframe) {
    window.addEventListener('message', function (event) {
        // Verify origin for security
        if (event.origin !== 'https://www.matara.pro') {
            return;
        }

        const data = event.data;

        switch (data.type) {
            case 'height':
                // Adjust iframe height dynamically
                iframe.style.height = data.height + 'px';
                break;

            case 'payment_ready':
                // Iframe is ready to receive payment data
                console.log('Payment iframe ready');
                break;

            case 'payment_result':
                // Payment completed - handle result
                handlePaymentResult(data.result);
                break;

            case 'payment_error':
                // Payment failed
                handlePaymentError(data.error);
                break;
        }
    });
}

/**
 * Send payment data to iframe
 * @param {Object} paymentData - Payment information
 */
function sendPaymentToIframe(paymentData) {
    const iframe = document.getElementById('payment-iframe');
    if (!iframe) {
        console.error('Payment iframe not found');
        return;
    }

    // Validate required fields
    const requiredFields = ['Mosad', 'ApiValid', 'PaymentType', 'Amount', 'Tashlumim'];
    for (const field of requiredFields) {
        if (!paymentData[field]) {
            console.error(`Missing required field: ${field}`);
            return;
        }
    }

    // Send data to iframe
    iframe.contentWindow.postMessage({
        type: 'payment_data',
        data: paymentData
    }, 'https://www.matara.pro');
}

/**
 * Create payment data object for iframe
 * @param {Object} formData - Form data from payment form
 * @returns {Object} Formatted payment data for Nedarim Plus
 */
function createPaymentData(formData) {
    return {
        // Required fields
        Mosad: NEDARIM_CONFIG.mosadId,
        ApiValid: NEDARIM_CONFIG.apiValid,
        PaymentType: formData.paymentType || 'Ragil', // Ragil, HK, CreateToken
        Amount: formData.amount,
        Tashlumim: formData.installments || 1,

        // Customer information
        Zeout: formData.idNumber || '',
        FirstName: formData.firstName || '',
        LastName: formData.lastName || '',
        Street: formData.street || '',
        City: formData.city || '',
        Phone: formData.phone || '',
        Mail: formData.email || '',

        // Payment details
        Day: formData.chargeDay || '', // For HK (standing order) only
        Currency: formData.currency || '2', // 1=Shekel, 2=Dollar

        // Additional info
        Groupe: formData.category || '',
        Comment: formData.comments || '',
        Param1: formData.param1 || '',
        Param2: formData.param2 || '',

        // Callback settings
        CallBack: formData.callbackUrl || '',
        CallBackMailError: formData.callbackErrorEmail || '',

        // Special flags
        ForceUpdateMatching: formData.forceUpdateMatching || '0',
        ThirdPartyReceipt: formData.thirdPartyReceipt || '0'
    };
}

/**
 * Handle successful payment result
 * @param {Object} result - Payment result from iframe
 */
function handlePaymentResult(result) {
    console.log('Payment successful:', result);

    // Update UI
    showPaymentSuccess(result);

    // Trigger custom event
    document.dispatchEvent(new CustomEvent('nedarimPaymentSuccess', {
        detail: result
    }));
}

/**
 * Handle payment error
 * @param {Object} error - Error details from iframe
 */
function handlePaymentError(error) {
    console.error('Payment failed:', error);

    // Update UI
    showPaymentError(error);

    // Trigger custom event
    document.dispatchEvent(new CustomEvent('nedarimPaymentError', {
        detail: error
    }));
}

/**
 * ========================================
 * TRANSACTION HISTORY API
 * ========================================
 */

/**
 * Get transaction history
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Transaction history data
 */
async function getTransactionHistory(options = {}) {
    const params = new URLSearchParams({
        Action: 'GetHistoryJson',
        MosadId: NEDARIM_CONFIG.mosadId,
        ApiPassword: NEDARIM_CONFIG.apiPassword,
        LastId: options.lastId || '',
        MaxId: options.maxResults || '100'
    });

    try {
        const response = await fetch(`${NEDARIM_CONFIG.baseUrl}/Reports/Manage3.aspx`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching transaction history:', error);
        throw error;
    }
}

/**
 * ========================================
 * TRANSACTION MANAGEMENT
 * ========================================
 */

/**
 * Cancel a transaction
 * @param {string} transactionId - Nedarim Plus transaction ID
 * @returns {Promise<Object>} Cancellation result
 */
async function cancelTransaction(transactionId) {
    const params = new URLSearchParams({
        Action: 'DeletedAllowedTransaction',
        MosadId: NEDARIM_CONFIG.mosadId,
        ApiPassword: NEDARIM_CONFIG.apiPassword,
        TransactionId: transactionId
    });

    try {
        const response = await fetch(`${NEDARIM_CONFIG.baseUrl}/Reports/Manage3.aspx`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params
        });

        const result = await response.text(); // Some responses are text, not JSON
        return { success: result.includes('OK'), message: result };
    } catch (error) {
        console.error('Error canceling transaction:', error);
        throw error;
    }
}

/**
 * Refund a transaction
 * @param {string} transactionId - Nedarim Plus transaction ID
 * @param {number} refundAmount - Amount to refund
 * @returns {Promise<Object>} Refund result
 */
async function refundTransaction(transactionId, refundAmount) {
    const params = new URLSearchParams({
        Action: 'RefundTransaction',
        MosadId: NEDARIM_CONFIG.mosadId,
        ApiPassword: NEDARIM_CONFIG.apiPassword,
        TransactionId: transactionId,
        RefundAmount: refundAmount
    });

    try {
        const response = await fetch(`${NEDARIM_CONFIG.baseUrl}/Reports/Manage3.aspx`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error refunding transaction:', error);
        throw error;
    }
}

/**
 * ========================================
 * BIT PAYMENT SYSTEM
 * ========================================
 */

/**
 * Create Bit payment transaction
 * @param {Object} bitData - Bit payment data
 * @returns {Promise<Object>} Bit payment URL and details
 */
async function createBitTransaction(bitData) {
    const params = new URLSearchParams({
        Action: 'CreateTransaction',
        MosadId: NEDARIM_CONFIG.mosadId,
        ApiValid: NEDARIM_CONFIG.apiValid,
        Zeout: bitData.idNumber || '',
        ClientName: bitData.fullName,
        Street: bitData.street || '',
        City: bitData.city || '',
        Phone: bitData.phone,
        Mail: bitData.email || '',
        Amount: bitData.amount,
        Groupe: bitData.category || '',
        Comment: bitData.comments || '',
        Param2: bitData.uniqueId || '',
        UrlSuccess: bitData.successUrl || '',
        UrlFailure: bitData.failureUrl || '',
        CallBack: bitData.callbackUrl || ''
    });

    try {
        const response = await fetch(`${NEDARIM_CONFIG.baseUrl}/V6/Files/WebServices/DebitBit.aspx`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error creating Bit transaction:', error);
        throw error;
    }
}

/**
 * ========================================
 * STANDING ORDERS (CREDIT CARD)
 * ========================================
 */

/**
 * Get all standing orders
 * @returns {Promise<Object>} Standing orders data
 */
async function getStandingOrders() {
    const params = new URLSearchParams({
        Action: 'GetKevaNew',
        MosadNumber: NEDARIM_CONFIG.mosadId,
        ApiPassword: NEDARIM_CONFIG.apiPassword
    });

    try {
        const response = await fetch(`${NEDARIM_CONFIG.baseUrl}/Reports/Manage3.aspx?${params}`, {
            method: 'GET'
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching standing orders:', error);
        throw error;
    }
}

/**
 * Get standing order details by ID
 * @param {string} kevaId - Standing order ID
 * @returns {Promise<Object>} Standing order details
 */
async function getStandingOrderDetails(kevaId) {
    const params = new URLSearchParams({
        Action: 'GetKevaId',
        MosadId: NEDARIM_CONFIG.mosadId,
        ApiPassword: NEDARIM_CONFIG.apiPassword,
        KevaId: kevaId
    });

    try {
        const response = await fetch(`${NEDARIM_CONFIG.baseUrl}/Reports/Manage3.aspx?${params}`, {
            method: 'GET'
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching standing order details:', error);
        throw error;
    }
}

/**
 * Update standing order
 * @param {string} kevaId - Standing order ID
 * @param {Object} updateData - Updated standing order data
 * @returns {Promise<Object>} Update result
 */
async function updateStandingOrder(kevaId, updateData) {
    const params = new URLSearchParams({
        Action: 'UpdateKevaNew',
        MosadNumber: NEDARIM_CONFIG.mosadId,
        ApiPassword: NEDARIM_CONFIG.apiPassword,
        KevaId: kevaId,
        Zeout: updateData.idNumber || '',
        ClientName: updateData.clientName || '',
        Adresse: updateData.address || '',
        City: updateData.city || '',
        Phone: updateData.phone || '',
        Mail: updateData.email || '',
        Tashlumim: updateData.remainingPayments || '',
        Groupe: updateData.category || '',
        Avour: updateData.comments || '',
        NextDate: updateData.nextDate,
        Frequency: updateData.frequency || '1', // 1=Monthly, 2=Weekly, 3=Memorial
        Amount: updateData.amount,
        CreditCard: updateData.creditCard,
        Tokef: updateData.expiry,
        CVV: updateData.cvv || ''
    });

    try {
        const response = await fetch(`${NEDARIM_CONFIG.baseUrl}/Reports/Manage3.aspx`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error updating standing order:', error);
        throw error;
    }
}

/**
 * Charge single payment from existing standing order
 * @param {string} kevaId - Standing order ID
 * @param {Object} chargeData - Charge details
 * @returns {Promise<Object>} Charge result
 */
async function chargeSinglePayment(kevaId, chargeData) {
    const params = new URLSearchParams({
        Action: 'TashlumBodedNew',
        MosadNumber: NEDARIM_CONFIG.mosadId,
        ApiPassword: NEDARIM_CONFIG.apiPassword,
        Currency: chargeData.currency || '2',
        KevaId: kevaId,
        Amount: chargeData.amount,
        Tashloumim: chargeData.installments || '1',
        Groupe: chargeData.category || '',
        Comments: chargeData.comments || '',
        JoinToKevaId: chargeData.joinToKeva || 'Join' // Join or NoJoin
    });

    try {
        const response = await fetch(`${NEDARIM_CONFIG.baseUrl}/Reports/Manage3.aspx`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error charging single payment:', error);
        throw error;
    }
}

/**
 * ========================================
 * WEBHOOK HANDLING
 * ========================================
 */

/**
 * Verify webhook authenticity
 * @param {Object} request - HTTP request object
 * @returns {boolean} True if webhook is authentic
 */
function verifyWebhook(request) {
    // Check if request comes from Nedarim Plus IP
    const clientIP = request.headers['x-forwarded-for'] ||
        request.connection.remoteAddress ||
        request.socket.remoteAddress ||
        request.connection.socket.remoteAddress;

    return clientIP === NEDARIM_CONFIG.trustedIP;
}

/**
 * Handle webhook data for regular transactions
 * @param {Object} webhookData - Data received from webhook
 * @returns {Object} Processed webhook data
 */
function handleRegularTransactionWebhook(webhookData) {
    return {
        transactionId: webhookData.TransactionId,
        clientId: webhookData.ClientId,
        idNumber: webhookData.Zeout,
        clientName: webhookData.ClientName,
        address: webhookData.Adresse,
        phone: webhookData.Phone,
        email: webhookData.Mail,
        amount: webhookData.Amount,
        currency: webhookData.Currency || '2', // 1=Shekel, 2=Dollar
        transactionTime: webhookData.TransactionTime,
        confirmation: webhookData.Confirmation,
        lastFour: webhookData.LastNum,
        expiry: webhookData.Tokef,
        transactionType: webhookData.TransactionType,
        category: webhookData.Groupe,
        comments: webhookData.Comments,
        installments: webhookData.Tashloumim,
        firstPayment: webhookData.FirstTashloum,
        mosadNumber: webhookData.MosadNumber,
        callId: webhookData.CallId,
        terminalId: webhookData.MasofId,
        shovar: webhookData.Shovar,
        companyCard: webhookData.CompagnyCard,
        processor: webhookData.Solek,
        isTourist: webhookData.Tayar,
        source: webhookData.Makor,
        standingOrderId: webhookData.KevaId,
        isIframe: webhookData.DebitIframe,
        receiptCreated: webhookData.ReceiptCreated,
        receiptUrl: webhookData.ReceiptData,
        receiptNumber: webhookData.ReceiptDocNum
    };
}

/**
 * Handle webhook data for standing order creation
 * @param {Object} webhookData - Data received from webhook
 * @returns {Object} Processed webhook data
 */
function handleStandingOrderWebhook(webhookData) {
    return {
        standingOrderId: webhookData.KevaId,
        clientId: webhookData.ClientId,
        idNumber: webhookData.Zeout,
        clientName: webhookData.ClientName,
        address: webhookData.Adresse,
        phone: webhookData.Phone,
        email: webhookData.Mail,
        monthlyAmount: webhookData.Amount,
        currency: webhookData.Currency || '2', // 1=Shekel, 2=Dollar
        nextDate: webhookData.NextDate,
        lastFour: webhookData.LastNum,
        expiry: webhookData.Tokef,
        category: webhookData.Groupe,
        comments: webhookData.Comments,
        remainingPayments: webhookData.Tashloumim,
        mosadNumber: webhookData.MosadNumber,
        terminalId: webhookData.MasofId,
        isIframe: webhookData.DebitIframe
    };
}

/**
 * ========================================
 * EXTERNAL INCOME MANAGEMENT
 * ========================================
 */

/**
 * Add external income (cash, check, bank transfer, etc.)
 * @param {Object} incomeData - External income data
 * @returns {Promise<Object>} Save result
 */
async function saveExternalIncome(incomeData) {
    const params = new URLSearchParams({
        Action: 'SaveAchnasot',
        MosadNumber: NEDARIM_CONFIG.mosadId,
        ApiPassword: NEDARIM_CONFIG.apiPassword,
        ID: incomeData.id || '', // For editing existing income
        Type: incomeData.type, // 1=Cash, 2=Check, 3=Bank transfer, 4=External credit, 5=External direct debit, 6=Other
        Zeout: incomeData.idNumber,
        Amount: incomeData.amount,
        Date: incomeData.date, // dd/mm/yyyy format
        Currency: incomeData.currency || '2', // 1=Shekel, 2=Dollar
        Groupe: incomeData.category || '',
        Avour: incomeData.comments || '',
        Asmahta: incomeData.reference || '',
        Asmahta2: incomeData.reference2 || '',
        SpecialName: incomeData.specialName || '',
        SpecialAdresse: incomeData.specialAddress || '',
        Delete: incomeData.delete ? 'true' : 'false'
    });

    try {
        const response = await fetch(`${NEDARIM_CONFIG.baseUrl}/Reports/Manage3.aspx`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error saving external income:', error);
        throw error;
    }
}

/**
 * ========================================
 * RECEIPT MANAGEMENT
 * ========================================
 */

/**
 * Create receipt for credit transaction
 * @param {string} transactionId - Transaction ID
 * @param {string} receiptType - Receipt type (405=Donation, 400=Regular, 320=Tax invoice)
 * @returns {Promise<Object>} Receipt creation result
 */
async function createCreditReceipt(transactionId, receiptType = '405') {
    const params = new URLSearchParams({
        Action: 'TamalCreate',
        MosadNumber: NEDARIM_CONFIG.mosadId,
        ApiPassword: NEDARIM_CONFIG.apiPassword,
        TransactionId: transactionId,
        TamalType: receiptType
    });

    try {
        const response = await fetch(`${NEDARIM_CONFIG.baseUrl}/Reports/Tamal3.aspx?${params}`, {
            method: 'GET'
        });

        const result = await response.text();
        return { success: result === 'OK', message: result };
    } catch (error) {
        console.error('Error creating receipt:', error);
        throw error;
    }
}

/**
 * Show receipt URL
 * @param {string} transactionId - Transaction ID (optional)
 * @param {string} externalIncomeId - External income ID (optional)
 * @returns {Promise<Object>} Receipt URL
 */
async function getReceiptUrl(transactionId = '', externalIncomeId = '') {
    const params = new URLSearchParams({
        Action: 'ShowInvoice',
        MosadNumber: NEDARIM_CONFIG.mosadId,
        ApiPassword: NEDARIM_CONFIG.apiPassword
    });

    if (transactionId) {
        params.append('TransactionId', transactionId);
    }
    if (externalIncomeId) {
        params.append('AchnasotId', externalIncomeId);
    }

    try {
        const response = await fetch(`${NEDARIM_CONFIG.baseUrl}/Reports/Tamal3.aspx?${params}`, {
            method: 'GET'
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error getting receipt URL:', error);
        throw error;
    }
}

/**
 * ========================================
 * EXPORT FUNCTIONS
 * ========================================
 */

/**
 * Export transaction history to Excel
 * @param {string} fromDate - Start date (dd/mm/yyyy)
 * @param {string} toDate - End date (dd/mm/yyyy)
 * @param {boolean} sendToEmail - Whether to send to email or download now
 * @returns {Promise<Object>} Export result
 */
async function exportTransactionHistory(fromDate, toDate, sendToEmail = false) {
    const params = new URLSearchParams({
        Action: 'GetHistoryCSV',
        MosadNumber: NEDARIM_CONFIG.mosadId,
        ApiPassword: NEDARIM_CONFIG.apiPassword,
        From: fromDate,
        To: toDate,
        ToMail: sendToEmail ? '1' : '0'
    });

    try {
        const response = await fetch(`${NEDARIM_CONFIG.baseUrl}/Reports/Manage3.aspx?${params}`, {
            method: 'GET'
        });

        if (sendToEmail) {
            const result = await response.text();
            return { success: true, message: result };
        } else {
            // Return file blob for download
            const blob = await response.blob();
            return { success: true, data: blob };
        }
    } catch (error) {
        console.error('Error exporting transaction history:', error);
        throw error;
    }
}

/**
 * ========================================
 * UTILITY FUNCTIONS
 * ========================================
 */

/**
 * Format date for Nedarim Plus API
 * @param {Date} date - JavaScript Date object
 * @returns {string} Formatted date string (dd/mm/yyyy)
 */
function formatDateForAPI(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

/**
 * Show payment success message
 * @param {Object} result - Payment result
 */
function showPaymentSuccess(result) {
    // This should be customized based on your UI framework
    console.log('Payment completed successfully:', result);

    // Example implementation
    const successDiv = document.getElementById('payment-success');
    if (successDiv) {
        successDiv.style.display = 'block';
        successDiv.innerHTML = `
            <h3>תשלום בוצע בהצלחה!</h3>
            <p>מספר אישור: ${result.confirmation || 'N/A'}</p>
            <p>סכום: $${result.amount || 'N/A'}</p>
        `;
    }
}

/**
 * Show payment error message
 * @param {Object} error - Error details
 */
function showPaymentError(error) {
    // This should be customized based on your UI framework
    console.error('Payment failed:', error);

    // Example implementation
    const errorDiv = document.getElementById('payment-error');
    if (errorDiv) {
        errorDiv.style.display = 'block';
        errorDiv.innerHTML = `
            <h3>שגיאה בתשלום</h3>
            <p>${error.message || 'אירעה שגיאה לא צפויה'}</p>
        `;
    }
}

/**
 * ========================================
 * EXPORT MODULE
 * ========================================
 */

// Export all functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        // Configuration
        NEDARIM_CONFIG,

        // Iframe functions
        initNedarimIframe,
        setupIframeMessaging,
        sendPaymentToIframe,
        createPaymentData,
        handlePaymentResult,
        handlePaymentError,

        // Transaction management
        getTransactionHistory,
        cancelTransaction,
        refundTransaction,

        // Bit payments
        createBitTransaction,

        // Standing orders
        getStandingOrders,
        getStandingOrderDetails,
        updateStandingOrder,
        chargeSinglePayment,

        // Webhooks
        verifyWebhook,
        handleRegularTransactionWebhook,
        handleStandingOrderWebhook,

        // External income
        saveExternalIncome,

        // Receipts
        createCreditReceipt,
        getReceiptUrl,

        // Export
        exportTransactionHistory,

        // Utilities
        formatDateForAPI,
        showPaymentSuccess,
        showPaymentError
    };
}
