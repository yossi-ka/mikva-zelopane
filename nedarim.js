
// ===== MATARA.PRO IFRAME PAYMENT FUNCTIONS =====

// Payment configuration - הגדרות תשלום
const PAYMENT_CONFIG = {
    mosad: '7005806',        // מזהה מוסד בנדרים פלוס (7 ספרות)
    apiValid: 'CDMSfoGz4j',  // טקסט אימות
    currency: '2',           // מטבע: 1 (שקל) | 2 (דולר) - CHANGED FOR TESTING!
    paymentType: 'Ragil'     // סוג תשלום: Ragil (עסקה רגילה)
};

// Handle callback/webhook data from Matara.pro
function handleCallbackData(callbackData) {

    // Parse important fields according to documentation
    const transactionInfo = {
        TransactionId: callbackData.TransactionId,
        ClientName: callbackData.ClientName,
        Zeout: callbackData.Zeout,
        Amount: callbackData.Amount,
        Currency: callbackData.Currency === '1' ? 'Shekel' : 'Dollar',
        TransactionTime: callbackData.TransactionTime,
        Confirmation: callbackData.Confirmation,
        LastNum: callbackData.LastNum,
        Tokef: callbackData.Tokef,
        TransactionType: callbackData.TransactionType,
        Groupe: callbackData.Groupe,
        Comments: callbackData.Comments,
        Tashloumim: callbackData.Tashloumim,
        MosadNumber: callbackData.MosadNumber,
        DebitIframe: callbackData.DebitIframe === '1' ? 'Iframe Transaction' : 'Regular Transaction',
        ReceiptCreated: callbackData.ReceiptCreated,
        ReceiptData: callbackData.ReceiptData
    };

    return transactionInfo;
}

// Function to restore process button to normal state
function restoreProcessButton() {

    const processBtn = document.getElementById('process-payment-btn');
    if (processBtn) {

        // Check if translations are available (from app.js)
        if (typeof translations !== 'undefined' && typeof currentLanguage !== 'undefined') {

            const normalText = translations['process_payment_btn'] && translations['process_payment_btn'][currentLanguage]
                ? translations['process_payment_btn'][currentLanguage]
                : (currentLanguage === 'en' ? 'Process Payment' : 'בצע תשלום');

            processBtn.textContent = normalText;
        } else {
            // Fallback - try to detect if English is needed
            const isEnglish = document.body.getAttribute('dir') === 'ltr';
            const fallbackText = isEnglish ? 'Process Payment' : 'בצע תשלום';

            processBtn.textContent = fallbackText;
        }
        processBtn.disabled = false;
    }
}

// ===== GLOBAL FUNCTIONS FOR IFRAME COMMUNICATION =====
// Export ReadPostMessage to global scope IMMEDIATELY (required by Matara.pro iframe)
window.ReadPostMessage = ReadPostMessage;

// Handle PostMessage from Matara.pro iframe - Official format from sample
function ReadPostMessage(Name, Value) {

    const iframe = document.getElementById('payment-iframe');

    // Handle iframe height adjustment (from official sample)
    if (Name === 'Height' && iframe) {

        iframe.style.height = Value + 'px';

        // Show iframe when height is set (indicates iframe is ready)
        if (Value > 0) {
            const waitDiv = document.getElementById('payment-processing');
            if (waitDiv) {
                waitDiv.style.display = 'none';
            }
            iframe.style.display = 'block';
        }
    }

    // Handle transaction response (from official sample)
    if (Name === 'TransactionResponse') {

        // Try to parse the response
        try {
            const responseData = typeof Value === 'string' ? JSON.parse(Value) : Value;

            // Check if transaction was successful (multiple possible success indicators)
            if (responseData.Status === 'OK' || responseData.Status === 'Success' ||
                responseData.status === 'success' ||
                responseData.result === 'success' ||
                responseData.Result === 'Success') {
                handlePaymentSuccess(responseData);
            } else if (responseData.Status === 'Error' || responseData.Status === 'Failed' ||
                responseData.status === 'error' ||
                responseData.result === 'error') {
                handlePaymentError(responseData);
            } else {
                // Treat unknown status as error for safety
                handlePaymentError(responseData);
            }

        } catch (parseError) {

            // Handle as string response
            if (Value && Value.toString().toLowerCase().includes('success')) {
                handlePaymentSuccess({ result: 'success', rawResponse: Value });
            } else {
                handlePaymentError({ result: 'error', rawResponse: Value, error: 'Response parsing failed' });
            }
        }
    }

}

// Initialize iframe communication according to documentation
function initializeIframe() {

    // Set up PostMessage listener for iframe communication
    window.addEventListener('message', function (event) {

        // Security check - ensure message is from matara.pro (updated origin)
        if (event.origin !== 'https://matara.pro') {
            return;
        }

        handleIframeMessage(event.data);
    });

}

// Handle messages from iframe according to documentation
function handleIframeMessage(data) {

    const iframe = document.getElementById('payment-iframe');

    // Handle different types of messages from iframe
    if (typeof data === 'object' && data !== null) {

        // Check if this is the official Name/Value format
        if (data.Name && data.Value !== undefined) {
            ReadPostMessage(data.Name, data.Value);
            return; // Important: exit here to avoid duplicate processing
        }

        // Handle height adjustment for responsive design
        if (data.height) {
            iframe.style.height = data.height + 'px';
        }

        // Handle payment success
        if (data.result === 'success' || data.status === 'success') {
            handlePaymentSuccess(data);
        }

        // Handle payment error
        if (data.result === 'error' || data.status === 'error') {
            handlePaymentError(data);
        }

    } else if (typeof data === 'string') {

        // Handle string messages
        if (data.includes('success')) {
            handlePaymentSuccess({ message: data });
        } else if (data.includes('error')) {
            handlePaymentError({ message: data });
        }
    }
}

// Load iframe and send payment data according to documentation
function loadIframeWithPaymentData() {

    const iframe = document.getElementById('payment-iframe');
    const paymentContainer = document.getElementById('payment-container');

    // Load the iframe with matara.pro URL - adjust language dynamically
    const currentLang = (typeof currentLanguage !== 'undefined') ? currentLanguage : 'he';
    const iframeUrl = `https://matara.pro/nedarimplus/iframe?language=${currentLang}`;

    iframe.src = iframeUrl;
    paymentContainer.classList.add('loaded');


    // Setup iframe communication for height adjustments
    iframe.onload = function () {
        // Request iframe height for responsive design
        setTimeout(() => {
            askIframeForHeight();
        }, 1000);
    };

}

// Ask iframe for its height for responsive design
function askIframeForHeight() {

    const iframe = document.getElementById('payment-iframe');
    if (iframe.contentWindow) {
        const heightRequest = { action: 'getHeight' };

        try {
            iframe.contentWindow.postMessage(heightRequest, 'https://www.matara.pro');
        } catch (error) {
        }
    }
}

// שולח פרטי טופס ל-iFrame
function sendPaymentDataToIframe() {

    const iframe = document.getElementById('payment-iframe');
    const form = document.querySelector('form');


    if (!iframe.contentWindow) {
        return;
    }

    // Collect form data
    const formData = new FormData(form);
    const formEntries = Object.fromEntries(formData.entries());

    // Get clean amount (remove $ sign)
    const totalAmountElement = document.getElementById('total-amount');
    const rawAmount = totalAmountElement?.value || '0';
    const amountValue = '1.04'; //rawAmount.replace(/[^0-9]/g, '');

    const paymentData = {
        // פרמטרים חובה
        'Mosad': PAYMENT_CONFIG.mosad,           // מזהה מוסד בנדרים פלוס (7 ספרות)
        'ApiValid': PAYMENT_CONFIG.apiValid,     // טקסט אימות
        'PaymentType': PAYMENT_CONFIG.paymentType, // Ragil (עסקה רגילה)
        'Amount': amountValue,                   // סכום כל העסקה
        'Tashlumim': '1',                       // תשלום אחד בלבד
        'Currency': PAYMENT_CONFIG.currency,     // 2 = דולר

        // פרטי לקוח
        'Zeout': formData.get('id-number') || '',     // מספר תעודת זהות
        'FirstName': formData.get('name') || '',      // שם פרטי
        'LastName': formData.get('last-name') || '',  // שם משפחה
        'Street': 'מקוה - אזמרה אומן',               // רחוב - נדרש על פי שגיאת המערכת
        'City': 'אוקראינה',                          // עיר - נדרש על פי שגיאת המערכת
        'Phone': formData.get('phone') || '',         // טלפון
        'Mail': formData.get('email') || '',          // מייל

        // פרמטרים נוספים
        'Day': '',                               // יום לחיוב (רלוונטי רק ל-HK)
        'Groupe': 'מקוה אומן',                   // קטגוריה
        'Comment': `הזמנה ל-${formData.get('ticket-quantity')} כרטיסים למקוה`, // הערות
        'Param1': '',                            // טקסט חופשי לקאלבק
        'Param2': '',                            // טקסט חופשי לקאלבק

        // הגדרות קאלבק וקבלות
        'CallBack': '',                          // כתובת לקבלת עדכון לשרת
        'CallBackMailError': '',                 // כתובת מייל לשגיאות
        'ThirdPartyReceipt': '0',               // לא מפיקים קבלות בצד שלנו
        'ForceUpdateMatching': '0'              // לא מחובר לפלטפורמת גיוס המונים
    };

    // Send data to iframe using PostMessage according to OFFICIAL matara.pro sample
    try {
        const targetOrigin = 'https://matara.pro';  // Note: updated origin from sample

        // Send data using the OFFICIAL format from sample.html:
        // Using "FinishTransaction2" command with nested data object
        const officialPayload = {
            Name: 'FinishTransaction2',
            Value: paymentData
        };

        // שליחת הנתונים לאייפרם באמצעות PostMessage - פורמט רשמי
        iframe.contentWindow.postMessage(officialPayload, targetOrigin);

    } catch (error) {

        // Get current language for error message
        const lang = (typeof currentLanguage !== 'undefined') ? currentLanguage : 'he';
        const errorMsg = lang === 'en'
            ? 'Error loading payment system. Please try again.'
            : 'שגיאה בטעינת מערכת התשלומים. אנא נסה שוב.';

        alert(errorMsg);

        // Restore process button
        restoreProcessButton();
    }
}

// מופעל בעת תשלום שהצליח
function handlePaymentSuccess(data) {

    // Hide entire form and payment container
    const formElement = document.querySelector('form');
    const paymentContainer = document.getElementById('payment-container');

    if (formElement) {
        formElement.style.display = 'none';
    }

    if (paymentContainer) {
        paymentContainer.style.display = 'none';
    }

    // Get current language and translations
    const lang = (typeof currentLanguage !== 'undefined') ? currentLanguage : 'he';
    const trans = (typeof translations !== 'undefined') ? translations : {};

    // Helper function to get translated text
    function getTranslation(key, fallbackHe, fallbackEn) {
        const result = trans[key] && trans[key][lang] ? trans[key][lang] : (lang === 'en' ? fallbackEn : fallbackHe);
        return result;
    }

    // Create success message with translations
    const successDiv = document.createElement('div');
    successDiv.className = 'payment-success';

    const titleText = getTranslation('payment_success_title', '✅ תשלום בוצע בהצלחה!', '✅ Payment Successful!');
    const confirmationText = getTranslation('confirmation_number', 'מספר אישור:', 'Confirmation Number:');
    const amountText = getTranslation('amount', 'סכום:', 'Amount:');
    const dateText = getTranslation('date', 'תאריך:', 'Date:');
    const thankYouText = getTranslation('thank_you_message', 'תודה שבחרת במקוה שלנו!', 'Thank you for choosing our Mikvah!');
    const backButtonText = getTranslation('back_to_home', 'חזור לעמוד הראשי', 'Back to Home Page');
    const emailFallback = getTranslation('will_be_sent_by_email', 'יתקבל במייל', 'Will be sent by email');

    // Format date according to language
    const dateFormatted = lang === 'en'
        ? new Date().toLocaleDateString('en-US')
        : new Date().toLocaleDateString('he-IL');

    const totalAmountValue = document.getElementById('total-amount')?.value || 'N/A';

    successDiv.innerHTML = `
        <div class="success-content">
            <h2>${titleText}</h2>
            <p>${confirmationText} <strong>${data.Confirmation || data.confirmation || data.TransactionId || data.transactionId || emailFallback}</strong></p>
            <p>${amountText} <strong>${data.Amount || totalAmountValue}</strong> ${data.Currency === '1' ? '₪' : '$'}</p>
            <p>${dateText} <strong>${data.TransactionTime ? new Date(data.TransactionTime).toLocaleDateString(lang === 'he' ? 'he-IL' : 'en-US') : dateFormatted}</strong></p>
            <p>${thankYouText}</p>
            <div class="transaction-details" style="margin-top: 20px; padding: 15px; background: rgba(255,255,255,0.2); border-radius: 10px; font-size: 0.9em;">
                ${data.TransactionId ? `<p><strong>מס' עסקה:</strong> ${data.TransactionId}</p>` : ''}
                ${data.LastNum ? `<p><strong>4 ספרות אחרונות:</strong> ${data.LastNum}****</p>` : ''}
                ${data.Shovar ? `<p><strong>מס' שובר:</strong> ${data.Shovar}</p>` : ''}
            </div>
            <button onclick="window.location.reload()">${backButtonText}</button>
        </div>
    `;

    // Insert success message instead of the form
    const sec2 = document.getElementById('sec2');
    if (sec2) {
        // Create a container for the success message
        const successContainer = document.createElement('div');
        successContainer.style.cssText = `
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        `;
        successContainer.appendChild(successDiv);
        sec2.appendChild(successContainer);
    } else {
        // Fallback: add to body
        document.body.appendChild(successDiv);
    }
}

// מופעל בעת שגיאת תשלום
function handlePaymentError(data) {

    // Get current language for error message
    const lang = (typeof currentLanguage !== 'undefined') ? currentLanguage : 'he';

    // Extract error message - check multiple possible fields
    const errorMessage = data.Message || data.message || data.error || data.ErrorMessage ||
        (lang === 'en' ? 'Unknown payment error' : 'שגיאה לא ידועה בתשלום');

    // Create error message UI
    showErrorMessage(errorMessage, lang);

    // Reset buttons but DON'T hide payment container yet (showErrorMessage will handle it)
    const continueBtn = document.getElementById('continue-payment-btn');
    const processBtn = document.getElementById('process-payment-btn');

    if (continueBtn) continueBtn.style.display = 'block';
    if (processBtn) processBtn.style.display = 'none';

    // Restore process button to normal state
    restoreProcessButton();
}

// Show beautiful error message instead of alert
function showErrorMessage(errorMessage, lang = 'he') {

    // Check what elements are available
    const errorPaymentContainer = document.getElementById('payment-container');
    const errorFormElement = document.querySelector('form');
    const errorSec2 = document.getElementById('sec2');

    // Remove any existing error messages
    const existingErrors = document.querySelectorAll('.payment-error');
    existingErrors.forEach(error => error.remove());

    // Create error message element
    const errorDiv = document.createElement('div');
    errorDiv.className = 'payment-error';

    const errorTitle = lang === 'en' ? 'Payment Error' : 'שגיאה בתשלום';
    const retryMsg = lang === 'en' ? 'Please try again or contact customer service.' : 'אנא נסה שוב או פנה לשירות לקוחות.';
    const closeButtonText = lang === 'en' ? 'Try Again' : 'נסה שוב';

    errorDiv.innerHTML = `
        <div class="error-content">
            <div class="error-icon">❌</div>
            <h2>${errorTitle}</h2>
            <p class="error-message">${errorMessage}</p>
            <p class="error-instruction">${retryMsg}</p>
            <button onclick="closeErrorMessage()" class="error-close-btn">${closeButtonText}</button>
        </div>
    `;

    // Insert error message in a visible location
    const currentPaymentContainer = document.getElementById('payment-container');
    const currentFormElement = document.querySelector('form');
    const currentSec2 = document.getElementById('sec2');

    if (currentPaymentContainer) {
        // Save the original payment container content before replacing with error
        if (!currentPaymentContainer.dataset.originalContent) {
            currentPaymentContainer.dataset.originalContent = currentPaymentContainer.innerHTML;
        }

        // Show the payment container and replace its content with error
        currentPaymentContainer.style.display = 'block';
        currentPaymentContainer.innerHTML = '';
        currentPaymentContainer.appendChild(errorDiv);

    } else if (currentFormElement) {
        // If no payment container, add to form
        currentFormElement.style.display = 'block'; // Make sure form is visible
        currentFormElement.appendChild(errorDiv);
    } else if (currentSec2) {
        // Last resort: add to sec2 section
        const errorContainer = document.createElement('div');
        errorContainer.style.cssText = `
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        `;
        errorContainer.appendChild(errorDiv);
        currentSec2.appendChild(errorContainer);
    } else {
        // Ultimate fallback: add to body
        document.body.appendChild(errorDiv);
    }

    // Scroll to error message
    errorDiv.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
    });
}

// Close error message function
function closeErrorMessage() {

    // Simply remove all error messages from anywhere they might be
    const errorElements = document.querySelectorAll('.payment-error');
    errorElements.forEach(error => error.remove());

    // Make sure payment container is visible for retry
    const closePaymentContainer = document.getElementById('payment-container');
    if (closePaymentContainer) {
        closePaymentContainer.style.display = 'block';

        // Restore original payment container content if it was saved
        if (closePaymentContainer.dataset.originalContent) {
            closePaymentContainer.innerHTML = closePaymentContainer.dataset.originalContent;
            delete closePaymentContainer.dataset.originalContent;
        }

    }

    // Make sure buttons are in the correct state for payment retry
    const continueBtn = document.getElementById('continue-payment-btn');
    const processBtn = document.getElementById('process-payment-btn');
    const iframe = document.getElementById('payment-iframe');

    if (continueBtn && processBtn && iframe) {
        // If iframe has src (payment is loaded), show process button
        if (iframe.src && iframe.src !== 'about:blank' && iframe.src !== '') {
            continueBtn.style.display = 'none';
            processBtn.style.display = 'inline-block';
        } else {
            // If no payment loaded, show continue button and load payment
            continueBtn.style.display = 'inline-block';
            processBtn.style.display = 'none';

            // Load the payment iframe
            if (typeof loadIframeWithPaymentData === 'function') {
                loadIframeWithPaymentData();

                // Switch to process button after loading
                setTimeout(() => {
                    continueBtn.style.display = 'none';
                    processBtn.style.display = 'inline-block';
                }, 1000);
            }
        }
    }

}

// Export closeErrorMessage to global scope so onclick can access it
window.closeErrorMessage = closeErrorMessage;

// בודק תקינות מס' זהות ישראלי
function isValidIsraeliID(id) {
    if (!id || id.length !== 9) return false;

    let sum = 0;
    for (let i = 0; i < 9; i++) {
        let digit = parseInt(id[i]);
        if (i % 2 === 1) {
            digit *= 2;
            if (digit > 9) digit -= 9;
        }
        sum += digit;
    }

    return sum % 10 === 0;
}

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', function () {

    initializeIframe();

});


