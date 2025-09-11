
// ===== MATARA.PRO IFRAME PAYMENT FUNCTIONS =====

// Payment configuration - הגדרות תשלום
// 🚨 TEST MODE: Changed for 1 NIS testing - REMEMBER TO REVERT!
const PAYMENT_CONFIG = {
    mosad: '7005806',        // מזהה מוסד בנדרים פלוס (7 ספרות)
    apiValid: 'CDMSfoGz4j',  // טקסט אימות
    // ORIGINAL LINE (to restore): currency: '2',           // מטבע: 1 (שקל) | 2 (דולר)
    currency: '1',           // מטבע: 1 (שקל) | 2 (דולר) - CHANGED FOR TESTING!
    paymentType: 'Ragil'     // סוג תשלום: Ragil (עסקה רגילה)
};

// Debug logging function
function debugLog(category, message, data = null) {
    const timestamp = new Date().toISOString();
    console.group(`🔍 [${timestamp}] ${category}`);
    console.log(`📝 ${message}`);
    if (data) {
        console.log('📊 Data:', data);
        console.log('📊 Data Type:', typeof data);
        console.log('📊 Data JSON:', JSON.stringify(data, null, 2));
    }
    console.groupEnd();
}

// Handle callback/webhook data from Matara.pro
function handleCallbackData(callbackData) {
    debugLog('CALLBACK_RECEIVED', '🎯 Received callback data from Matara.pro', callbackData);

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

    console.group('💳 TRANSACTION SUMMARY');
    console.log('🆔 Transaction ID:', transactionInfo.TransactionId);
    console.log('👤 Customer:', transactionInfo.ClientName);
    console.log('🆔 ID Number:', transactionInfo.Zeout);
    console.log('💰 Amount:', transactionInfo.Amount, transactionInfo.Currency);
    console.log('⏰ Time:', transactionInfo.TransactionTime);
    console.log('✅ Confirmation:', transactionInfo.Confirmation);
    console.log('💳 Last 4 Digits:', transactionInfo.LastNum);
    console.log('📅 Expiry:', transactionInfo.Tokef);
    console.log('📋 Type:', transactionInfo.TransactionType);
    console.log('🏷️ Category:', transactionInfo.Groupe);
    console.log('📝 Comments:', transactionInfo.Comments);
    console.log('🔢 Installments:', transactionInfo.Tashloumim);
    console.log('🏢 Institution:', transactionInfo.MosadNumber);
    console.log('🖥️ Source:', transactionInfo.DebitIframe);
    console.log('🧾 Receipt Created:', transactionInfo.ReceiptCreated);
    if (transactionInfo.ReceiptData) {
        console.log('📄 Receipt Link:', transactionInfo.ReceiptData);
    }
    console.groupEnd();

    return transactionInfo;
}

// Function to restore process button to normal state
function restoreProcessButton() {
    debugLog('BUTTON_RESTORE', 'Attempting to restore process button');

    const processBtn = document.getElementById('process-payment-btn');
    if (processBtn) {
        debugLog('BUTTON_RESTORE', 'Process button found, checking translations');

        // Check if translations are available (from app.js)
        if (typeof translations !== 'undefined' && typeof currentLanguage !== 'undefined') {
            debugLog('BUTTON_RESTORE', `Translations available, current language: ${currentLanguage}`);

            const normalText = translations['process_payment_btn'] && translations['process_payment_btn'][currentLanguage]
                ? translations['process_payment_btn'][currentLanguage]
                : (currentLanguage === 'en' ? 'Process Payment' : 'בצע תשלום');

            debugLog('BUTTON_RESTORE', `Setting button text to: "${normalText}"`);
            processBtn.textContent = normalText;
        } else {
            debugLog('BUTTON_RESTORE', 'Translations not available, using fallback detection');

            // Fallback - try to detect if English is needed
            const isEnglish = document.body.getAttribute('dir') === 'ltr';
            const fallbackText = isEnglish ? 'Process Payment' : 'בצע תשלום';

            debugLog('BUTTON_RESTORE', `Detected direction: ${document.body.getAttribute('dir')}, using text: "${fallbackText}"`);
            processBtn.textContent = fallbackText;
        }
        processBtn.disabled = false;
        debugLog('BUTTON_RESTORE', 'Button restored successfully');
    } else {
        debugLog('BUTTON_RESTORE', 'ERROR: Process button not found!');
    }
}

// ===== GLOBAL FUNCTIONS FOR IFRAME COMMUNICATION =====
// Export ReadPostMessage to global scope IMMEDIATELY (required by Matara.pro iframe)
window.ReadPostMessage = ReadPostMessage;

debugLog('GLOBAL_EXPORT', '🌐 ReadPostMessage exported to global scope immediately', {
    functionAvailable: typeof window.ReadPostMessage === 'function',
    exportedAt: new Date().toISOString()
});

// Handle PostMessage from Matara.pro iframe - Official format from sample
function ReadPostMessage(Name, Value) {
    debugLog('POSTMESSAGE_OFFICIAL', `🎯 ReadPostMessage called (official format): ${Name} = ${Value}`, {
        name: Name,
        value: Value,
        valueType: typeof Value
    });

    const iframe = document.getElementById('payment-iframe');

    debugLog('READPOSTMESSAGE_HANDLER', 'Processing official PostMessage format', {
        paramName: Name,
        paramValue: Value,
        iframeFound: !!iframe
    });

    // Handle iframe height adjustment (from official sample)
    if (Name === 'Height' && iframe) {
        debugLog('IFRAME_HEIGHT_OFFICIAL', `Setting iframe height to: ${Value}px`, {
            previousHeight: iframe.style.height,
            newHeight: Value + 'px'
        });
        iframe.style.height = Value + 'px';

        // Show iframe when height is set (indicates iframe is ready)
        if (Value > 0) {
            const waitDiv = document.getElementById('payment-processing');
            if (waitDiv) {
                waitDiv.style.display = 'none';
                debugLog('IFRAME_HEIGHT_OFFICIAL', 'Hiding wait div - iframe ready');
            }
            iframe.style.display = 'block';
            debugLog('IFRAME_READY', 'Iframe is ready and visible', {
                height: Value,
                display: iframe.style.display
            });
        }
    }

    // Handle transaction response (from official sample)
    if (Name === 'TransactionResponse') {
        debugLog('PAYMENT_RESPONSE_OFFICIAL', '🎯 Transaction response received!', {
            rawResponse: Value,
            responseType: typeof Value
        });

        // Try to parse the response
        try {
            const responseData = typeof Value === 'string' ? JSON.parse(Value) : Value;
            debugLog('PAYMENT_RESPONSE_PARSED', 'Transaction response parsed successfully', responseData);

            // Check if transaction was successful (multiple possible success indicators)
            if (responseData.Status === 'OK' || responseData.Status === 'Success' ||
                responseData.status === 'success' ||
                responseData.result === 'success' ||
                responseData.Result === 'Success') {
                debugLog('PAYMENT_SUCCESS', 'Payment completed successfully!', responseData);
                handlePaymentSuccess(responseData);
            } else if (responseData.Status === 'Error' || responseData.Status === 'Failed' ||
                responseData.status === 'error' ||
                responseData.result === 'error') {
                debugLog('PAYMENT_ERROR', 'Payment failed or was declined', responseData);
                handlePaymentError(responseData);
            } else {
                debugLog('PAYMENT_UNKNOWN', 'Unknown payment status', responseData);
                // Treat unknown status as error for safety
                handlePaymentError(responseData);
            }

        } catch (parseError) {
            debugLog('PAYMENT_RESPONSE_ERROR', 'Failed to parse transaction response', {
                parseError: parseError.message,
                rawValue: Value
            });

            // Handle as string response
            if (Value && Value.toString().toLowerCase().includes('success')) {
                debugLog('PAYMENT_SUCCESS', 'Success detected in string response');
                handlePaymentSuccess({ result: 'success', rawResponse: Value });
            } else {
                debugLog('PAYMENT_ERROR', 'Error or unknown response format');
                handlePaymentError({ result: 'error', rawResponse: Value, error: 'Response parsing failed' });
            }
        }
    }

    // Handle any other message types
    if (Name !== 'Height' && Name !== 'TransactionResponse') {
        debugLog('POSTMESSAGE_OTHER', 'Unknown PostMessage type received', {
            name: Name,
            value: Value,
            knownTypes: ['Height', 'TransactionResponse']
        });
    }
}

// Initialize iframe communication according to documentation
function initializeIframe() {
    debugLog('IFRAME_INIT', 'Initializing iframe communication system');

    // Set up PostMessage listener for iframe communication
    window.addEventListener('message', function (event) {
        debugLog('IFRAME_MESSAGE', 'Received PostMessage event', {
            origin: event.origin,
            expectedOrigin: 'https://matara.pro',  // Updated to match official sample
            dataType: typeof event.data,
            rawData: event.data
        });

        // Security check - ensure message is from matara.pro (updated origin)
        if (event.origin !== 'https://matara.pro') {
            debugLog('IFRAME_MESSAGE', `⚠️ SECURITY WARNING: Message from unauthorized origin: ${event.origin}`);
            return;
        }

        debugLog('IFRAME_MESSAGE', '✅ Message from authorized origin, processing...', event.data);
        handleIframeMessage(event.data);
    });

    debugLog('IFRAME_INIT', '✅ PostMessage listener initialized successfully');
}

// Handle messages from iframe according to documentation
function handleIframeMessage(data) {
    debugLog('MESSAGE_HANDLER', 'Processing iframe message', {
        dataType: typeof data,
        dataConstructor: data?.constructor?.name,
        hasHeight: data?.hasOwnProperty?.('height'),
        hasResult: data?.hasOwnProperty?.('result'),
        hasStatus: data?.hasOwnProperty?.('status'),
        allKeys: data && typeof data === 'object' ? Object.keys(data) : 'N/A',
        fullData: data
    });

    const iframe = document.getElementById('payment-iframe');
    debugLog('MESSAGE_HANDLER', `Iframe element found: ${!!iframe}`);

    // Handle different types of messages from iframe
    if (typeof data === 'object' && data !== null) {
        debugLog('MESSAGE_HANDLER', 'Processing object-type message');

        // Check if this is the official Name/Value format
        if (data.Name && data.Value !== undefined) {
            debugLog('MESSAGE_HANDLER', 'Redirecting to official ReadPostMessage format', {
                name: data.Name,
                value: data.Value
            });
            ReadPostMessage(data.Name, data.Value);
            return; // Important: exit here to avoid duplicate processing
        }

        // Handle height adjustment for responsive design
        if (data.height) {
            debugLog('IFRAME_HEIGHT', `Setting iframe height to: ${data.height}px`, {
                previousHeight: iframe.style.height,
                newHeight: data.height + 'px'
            });
            iframe.style.height = data.height + 'px';
        }

        // Handle payment success
        if (data.result === 'success' || data.status === 'success') {
            debugLog('PAYMENT_SUCCESS', 'Payment success detected!', {
                resultField: data.result,
                statusField: data.status,
                transactionId: data.transactionId,
                confirmation: data.confirmation,
                allFields: Object.keys(data)
            });
            handlePaymentSuccess(data);
        }

        // Handle payment error
        if (data.result === 'error' || data.status === 'error') {
            debugLog('PAYMENT_ERROR', 'Payment error detected!', {
                resultField: data.result,
                statusField: data.status,
                errorMessage: data.error || data.message,
                errorCode: data.errorCode,
                allFields: Object.keys(data)
            });
            handlePaymentError(data);
        }

        // Log any other object properties
        if (!data.height && data.result !== 'success' && data.status !== 'success' &&
            data.result !== 'error' && data.status !== 'error' && !data.Name) {
            debugLog('MESSAGE_HANDLER', 'Unknown object message type', {
                possibleType: 'status_update_or_other',
                allProperties: Object.entries(data)
            });
        }

    } else if (typeof data === 'string') {
        debugLog('MESSAGE_HANDLER', 'Processing string-type message', {
            messageLength: data.length,
            containsSuccess: data.includes('success'),
            containsError: data.includes('error'),
            fullMessage: data
        });

        // Handle string messages
        if (data.includes('success')) {
            debugLog('PAYMENT_SUCCESS', 'Payment success detected in string message!');
            handlePaymentSuccess({ message: data });
        } else if (data.includes('error')) {
            debugLog('PAYMENT_ERROR', 'Payment error detected in string message!');
            handlePaymentError({ message: data });
        } else {
            debugLog('MESSAGE_HANDLER', 'Unknown string message', {
                possibleType: 'info_or_status',
                message: data
            });
        }
    } else {
        debugLog('MESSAGE_HANDLER', 'Unexpected message type', {
            type: typeof data,
            value: data
        });
    }
}

// Load iframe and send payment data according to documentation
function loadIframeWithPaymentData() {
    debugLog('IFRAME_LOAD', 'Starting iframe loading process');

    const iframe = document.getElementById('payment-iframe');
    const paymentContainer = document.getElementById('payment-container');

    debugLog('IFRAME_LOAD', 'Element status', {
        iframeFound: !!iframe,
        containerFound: !!paymentContainer,
        iframeSrc: iframe?.src || 'none'
    });

    // Load the iframe with matara.pro URL (updated to match official sample)
    const iframeUrl = 'https://matara.pro/nedarimplus/iframe?language=he';  // Hebrew by default
    debugLog('IFRAME_LOAD', `Setting iframe source to: ${iframeUrl} (official URL format)`);

    iframe.src = iframeUrl;
    paymentContainer.classList.add('loaded');

    debugLog('IFRAME_LOAD', 'Added "loaded" class to payment container');

    // Setup iframe communication for height adjustments
    iframe.onload = function () {
        debugLog('IFRAME_LOAD', '✅ Iframe loaded successfully!', {
            finalSrc: iframe.src,
            readyState: iframe.readyState,
            contentWindow: !!iframe.contentWindow
        });

        // Request iframe height for responsive design
        setTimeout(() => {
            debugLog('IFRAME_LOAD', 'Requesting iframe height after 1 second delay');
            askIframeForHeight();
        }, 1000);
    };

    iframe.onerror = function (error) {
        debugLog('IFRAME_LOAD', '❌ Iframe loading error!', {
            error: error,
            src: iframe.src
        });
    };
}

// Ask iframe for its height for responsive design
function askIframeForHeight() {
    debugLog('IFRAME_HEIGHT_REQUEST', 'Requesting iframe height');

    const iframe = document.getElementById('payment-iframe');
    if (iframe.contentWindow) {
        const heightRequest = { action: 'getHeight' };
        debugLog('IFRAME_HEIGHT_REQUEST', 'Sending height request to iframe', heightRequest);

        try {
            iframe.contentWindow.postMessage(heightRequest, 'https://www.matara.pro');
            debugLog('IFRAME_HEIGHT_REQUEST', '✅ Height request sent successfully');
        } catch (error) {
            debugLog('IFRAME_HEIGHT_REQUEST', '❌ Error sending height request', error);
        }
    } else {
        debugLog('IFRAME_HEIGHT_REQUEST', '❌ Iframe contentWindow not available');
    }
}

// שולח פרטי טופס ל-iFrame לפי התיעוד הרשמי
function sendPaymentDataToIframe() {
    debugLog('PAYMENT_SEND', '🚀 Starting payment data transmission');

    const iframe = document.getElementById('payment-iframe');
    const form = document.querySelector('form');

    debugLog('PAYMENT_SEND', 'Element validation', {
        iframeFound: !!iframe,
        formFound: !!form,
        iframeContentWindow: !!iframe?.contentWindow,
        iframeSrc: iframe?.src
    });

    if (!iframe.contentWindow) {
        debugLog('PAYMENT_SEND', '❌ CRITICAL ERROR: Iframe not ready - contentWindow unavailable');
        return;
    }

    // Collect form data
    const formData = new FormData(form);
    const formEntries = Object.fromEntries(formData.entries());

    debugLog('PAYMENT_SEND', 'Form data collection', {
        formDataEntries: formEntries,
        formDataSize: formData.entries.length,
        availableFields: Object.keys(formEntries)
    });

    // Get clean amount (remove $ sign)
    // 🚨 TEST MODE: Force amount to 1 NIS for testing - REMEMBER TO REVERT!
    const totalAmountElement = document.getElementById('total-amount');
    const rawAmount = totalAmountElement?.value || '0';
    // ORIGINAL LINE (to restore): const amountValue = rawAmount.replace(/[^0-9]/g, '');
    const amountValue = '1.09'; // FORCED TO 1 FOR TESTING!

    debugLog('PAYMENT_SEND', 'Amount processing - TEST MODE: FORCED TO 1 NIS', {
        originalRawAmountValue: rawAmount,
        originalCleanedAmount: rawAmount.replace(/[^0-9]/g, ''),
        forcedAmountForTesting: amountValue,
        elementFound: !!totalAmountElement
    });

    // Prepare payment data object according to matara.pro documentation
    // חובה לרשום את כל הפרמטרים, גם אם הם ריקים
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

    debugLog('PAYMENT_SEND', '📋 Complete payment data object prepared', {
        totalFields: Object.keys(paymentData).length,
        requiredFields: {
            Mosad: paymentData.Mosad,
            ApiValid: paymentData.ApiValid,
            PaymentType: paymentData.PaymentType,
            Amount: paymentData.Amount,
            Currency: paymentData.Currency
        },
        customerFields: {
            Zeout: paymentData.Zeout,
            FirstName: paymentData.FirstName,
            LastName: paymentData.LastName,
            Phone: paymentData.Phone,
            Mail: paymentData.Mail
        },
        fullPaymentData: paymentData
    });

    debugLog('PAYMENT_SEND', '📤 Sending payment data to Nedarim Plus iframe using official format');

    // Send data to iframe using PostMessage according to OFFICIAL matara.pro sample
    try {
        const targetOrigin = 'https://matara.pro';  // Note: updated origin from sample

        debugLog('PAYMENT_SEND', 'Attempting PostMessage transmission (official format)', {
            targetOrigin: targetOrigin,
            contentWindowAvailable: !!iframe.contentWindow,
            payloadSize: JSON.stringify(paymentData).length,
            timestamp: new Date().toISOString(),
            format: 'FinishTransaction2 (official sample format)'
        });

        // Send data using the OFFICIAL format from sample.html:
        // Using "FinishTransaction2" command with nested data object
        const officialPayload = {
            Name: 'FinishTransaction2',
            Value: paymentData
        };

        debugLog('PAYMENT_SEND', 'Official payload structure prepared', {
            command: officialPayload.Name,
            dataKeys: Object.keys(officialPayload.Value),
            fullPayload: officialPayload
        });

        // שליחת הנתונים לאייפרם באמצעות PostMessage - פורמט רשמי
        iframe.contentWindow.postMessage(officialPayload, targetOrigin);

        debugLog('PAYMENT_SEND', '✅ Payment data sent successfully using official format!', {
            sentAt: new Date().toISOString(),
            command: 'FinishTransaction2',
            dataSize: JSON.stringify(officialPayload).length + ' characters',
            targetOrigin: targetOrigin,
            officialFormat: true
        });

    } catch (error) {
        debugLog('PAYMENT_SEND', '❌ CRITICAL ERROR: Failed to send payment data', {
            errorName: error.name,
            errorMessage: error.message,
            errorStack: error.stack,
            iframeState: {
                src: iframe.src,
                readyState: iframe.readyState,
                contentWindow: !!iframe.contentWindow
            }
        });

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
    debugLog('PAYMENT_SUCCESS', '🎉 Payment success handler activated!', {
        receivedData: data,
        dataType: typeof data,
        hasConfirmation: !!data.confirmation,
        hasTransactionId: !!data.transactionId,
        hasMessage: !!data.message,
        allProperties: data && typeof data === 'object' ? Object.keys(data) : 'N/A'
    });

    // Hide entire form and payment container
    const formElement = document.querySelector('form');
    const paymentContainer = document.getElementById('payment-container');

    if (formElement) {
        formElement.style.display = 'none';
        debugLog('PAYMENT_SUCCESS', 'Form hidden completely');
    }

    if (paymentContainer) {
        paymentContainer.style.display = 'none';
        debugLog('PAYMENT_SUCCESS', 'Payment container hidden');
    }

    // Get current language and translations
    const lang = (typeof currentLanguage !== 'undefined') ? currentLanguage : 'he';
    const trans = (typeof translations !== 'undefined') ? translations : {};

    debugLog('PAYMENT_SUCCESS', 'Language and translation status', {
        currentLanguage: lang,
        translationsAvailable: !!trans,
        translationKeys: Object.keys(trans)
    });

    // Helper function to get translated text
    function getTranslation(key, fallbackHe, fallbackEn) {
        const result = trans[key] && trans[key][lang] ? trans[key][lang] : (lang === 'en' ? fallbackEn : fallbackHe);
        debugLog('PAYMENT_SUCCESS', `Translation for "${key}"`, {
            key: key,
            language: lang,
            result: result,
            foundInTranslations: !!(trans[key] && trans[key][lang])
        });
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

    debugLog('PAYMENT_SUCCESS', 'Success message components', {
        titleText,
        confirmationText,
        amountText,
        dateText,
        thankYouText,
        backButtonText,
        emailFallback,
        dateFormatted,
        totalAmountValue,
        confirmationValue: data.Confirmation || data.confirmation || data.TransactionId || data.transactionId || emailFallback
    });

    successDiv.innerHTML = `
        <div class="success-content">
            <h2>${titleText}</h2>
            <p>${confirmationText} <strong>${data.Confirmation || data.confirmation || data.TransactionId || data.transactionId || emailFallback}</strong></p>
            <p>${amountText} <strong>${data.Amount || totalAmountValue}</strong> ${data.Currency === '1' ? '₪' : '$'}</p>
            <p>${dateText} <strong>${data.TransactionTime ? new Date(data.TransactionTime).toLocaleDateString(lang === 'he' ? 'he-IL' : 'en-US') : dateFormatted}</strong></p>
            <p>${thankYouText}</p>
            <div class="transaction-details" style="margin-top: 20px; padding: 15px; background: rgba(255,255,255,0.2); border-radius: 10px; font-size: 0.9em;">
                ${data.TransactionId ? `<p><strong>מס' עסקה:</strong> ${data.TransactionId}</p>` : ''}
                ${data.LastNum ? `<p><strong>4 ספרות אחרונות:</strong> ****${data.LastNum}</p>` : ''}
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
        debugLog('PAYMENT_SUCCESS', '✅ Success message inserted into sec2');
    } else {
        // Fallback: add to body
        document.body.appendChild(successDiv);
        debugLog('PAYMENT_SUCCESS', '✅ Success message inserted into body (fallback)');
    }
}

// מופעל בעת שגיאת תשלום
function handlePaymentError(data) {
    debugLog('PAYMENT_ERROR', '❌ Payment error handler activated!', {
        receivedData: data,
        dataType: typeof data,
        hasMessage: !!data.message,
        hasError: !!data.error,
        hasErrorCode: !!data.errorCode,
        hasResult: !!data.result,
        hasStatus: !!data.status,
        allProperties: data && typeof data === 'object' ? Object.keys(data) : 'N/A'
    });

    // Get current language for error message
    const lang = (typeof currentLanguage !== 'undefined') ? currentLanguage : 'he';

    debugLog('PAYMENT_ERROR', 'Language detection', {
        detectedLanguage: lang,
        languageSource: typeof currentLanguage !== 'undefined' ? 'currentLanguage variable' : 'fallback to Hebrew'
    });

    // Extract error message - check multiple possible fields
    const errorMessage = data.Message || data.message || data.error || data.ErrorMessage ||
        (lang === 'en' ? 'Unknown payment error' : 'שגיאה לא ידועה בתשלום');

    debugLog('PAYMENT_ERROR', 'Extracted error message', {
        extractedMessage: errorMessage,
        sourceField: data.Message ? 'Message' : data.message ? 'message' : data.error ? 'error' : 'fallback'
    });

    // Create error message UI
    showErrorMessage(errorMessage, lang);

    // Reset buttons but DON'T hide payment container yet (showErrorMessage will handle it)
    const continueBtn = document.getElementById('continue-payment-btn');
    const processBtn = document.getElementById('process-payment-btn');

    debugLog('PAYMENT_ERROR', 'Button reset status', {
        continueBtnFound: !!continueBtn,
        processBtnFound: !!processBtn
    });

    if (continueBtn) continueBtn.style.display = 'block';
    if (processBtn) processBtn.style.display = 'none';

    // Restore process button to normal state
    debugLog('PAYMENT_ERROR', 'Calling restoreProcessButton()');
    restoreProcessButton();
}

// Show beautiful error message instead of alert
function showErrorMessage(errorMessage, lang = 'he') {
    debugLog('ERROR_UI', 'Creating error message UI', {
        message: errorMessage,
        language: lang
    });

    // Check what elements are available
    const errorPaymentContainer = document.getElementById('payment-container');
    const errorFormElement = document.querySelector('form');
    const errorSec2 = document.getElementById('sec2');

    debugLog('ERROR_UI', 'Available elements for error display', {
        paymentContainer: !!errorPaymentContainer,
        paymentContainerDisplay: errorPaymentContainer?.style.display || 'default',
        formElement: !!errorFormElement,
        formDisplay: errorFormElement?.style.display || 'default',
        sec2: !!errorSec2
    });

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

    debugLog('ERROR_UI', 'Final container selection', {
        paymentContainer: !!currentPaymentContainer,
        formElement: !!currentFormElement,
        sec2: !!currentSec2
    });

    if (currentPaymentContainer) {
        // Save the original payment container content before replacing with error
        if (!currentPaymentContainer.dataset.originalContent) {
            currentPaymentContainer.dataset.originalContent = currentPaymentContainer.innerHTML;
        }

        // Show the payment container and replace its content with error
        currentPaymentContainer.style.display = 'block';
        currentPaymentContainer.innerHTML = '';
        currentPaymentContainer.appendChild(errorDiv);

        debugLog('ERROR_UI', '✅ Error message replaced payment container content');
    } else if (currentFormElement) {
        // If no payment container, add to form
        currentFormElement.style.display = 'block'; // Make sure form is visible
        currentFormElement.appendChild(errorDiv);
        debugLog('ERROR_UI', '✅ Error message inserted into form');
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
        debugLog('ERROR_UI', '✅ Error message inserted into sec2 (fallback)');
    } else {
        // Ultimate fallback: add to body
        document.body.appendChild(errorDiv);
        debugLog('ERROR_UI', '✅ Error message inserted into body (ultimate fallback)');
    }

    // Scroll to error message
    errorDiv.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
    });
}

// Close error message function
function closeErrorMessage() {
    debugLog('ERROR_UI', 'Closing error message');

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
            debugLog('ERROR_UI', 'Restored original payment container content');
        }

        debugLog('ERROR_UI', 'Payment container made visible');
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
            debugLog('ERROR_UI', 'Payment already loaded - showing process button');
        } else {
            // If no payment loaded, show continue button and load payment
            continueBtn.style.display = 'inline-block';
            processBtn.style.display = 'none';

            // Load the payment iframe
            if (typeof loadIframeWithPaymentData === 'function') {
                debugLog('ERROR_UI', 'Loading payment data for retry');
                loadIframeWithPaymentData();

                // Switch to process button after loading
                setTimeout(() => {
                    continueBtn.style.display = 'none';
                    processBtn.style.display = 'inline-block';
                }, 1000);
            }
        }
    }

    debugLog('ERROR_UI', '✅ Error message closed, payment ready for retry');
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
    debugLog('SYSTEM_INIT', '🚀 Nedarim Plus payment system initializing...');

    debugLog('SYSTEM_INIT', 'System configuration', {
        paymentConfig: PAYMENT_CONFIG,
        currentURL: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
    });

    initializeIframe();

    debugLog('SYSTEM_INIT', '✅ Nedarim Plus payment system initialized successfully');
});

// ===== GLOBAL FUNCTIONS FOR IFRAME COMMUNICATION =====
// Make ReadPostMessage available globally so the iframe can call it

// Export ReadPostMessage to global scope (required by Matara.pro iframe)
window.ReadPostMessage = ReadPostMessage;

debugLog('GLOBAL_EXPORT', '🌐 ReadPostMessage exported to global scope', {
    functionAvailable: typeof window.ReadPostMessage === 'function',
    exportedAt: new Date().toISOString()
});
