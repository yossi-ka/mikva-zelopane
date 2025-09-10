// Language Management System
let translations = {};
let currentLanguage = 'he';

// Load translations from JSON file
async function loadTranslations() {
    try {
        const response = await fetch('text.json');
        const data = await response.json();
        translations = data.translations;

        // Initialize with default language
        changeLanguage(currentLanguage);
    } catch (error) {
        console.error('Error loading translations:', error);
    }
}

// Change language function
function changeLanguage(lang) {
    currentLanguage = lang;

    // Update HTML lang and dir attributes
    const html = document.documentElement;
    const body = document.body;

    html.setAttribute('lang', lang);

    if (lang === 'he') {
        body.setAttribute('dir', 'rtl');
        body.style.direction = 'rtl';
    } else {
        body.setAttribute('dir', 'ltr');
        body.style.direction = 'ltr';
    }

    // Update all translatable elements
    updateTranslations();

    // Update language button text
    const languageBtn = document.getElementById('language-btn');
    if (languageBtn) {
        languageBtn.textContent = translations.language_switch[lang];
    }

    // Update page title
    const title = document.querySelector('title');
    if (title && translations.page_title) {
        title.textContent = translations.page_title[lang];
    }

    // Save language preference
    localStorage.setItem('selectedLanguage', lang);
}

// Update all translations on the page
function updateTranslations() {
    // Update elements with data-translate attribute
    const translatableElements = document.querySelectorAll('[data-translate]');
    translatableElements.forEach(element => {
        const key = element.getAttribute('data-translate');
        if (translations[key] && translations[key][currentLanguage]) {
            element.textContent = translations[key][currentLanguage];
        }
    });

    // Update alt attributes for images
    const imgElements = document.querySelectorAll('[data-alt-translate]');
    imgElements.forEach((img, index) => {
        const key = img.getAttribute('data-alt-translate');
        if (translations[key] && translations[key][currentLanguage]) {
            img.setAttribute('alt', translations[key][currentLanguage] + ' ' + (index + 1));
        }
    });
}

// Initialize language system
document.addEventListener('DOMContentLoaded', function () {
    // Load saved language preference
    const savedLanguage = localStorage.getItem('selectedLanguage') || 'he';
    currentLanguage = savedLanguage;

    // Load translations
    loadTranslations();

    // Add language button event listener
    const languageBtn = document.getElementById('language-btn');
    if (languageBtn) {
        languageBtn.addEventListener('click', function () {
            const newLang = currentLanguage === 'he' ? 'en' : 'he';
            changeLanguage(newLang);
        });
    }
});

// Ticket price calculation
const ticketQuantityInput = document.getElementById('ticket-quantity');
const totalAmountInput = document.getElementById('total-amount');
const ticketPrice = 150;

// Update total amount when quantity changes
ticketQuantityInput.addEventListener('input', () => {
    const quantity = parseInt(ticketQuantityInput.value) || 0;
    const total = quantity * ticketPrice;
    totalAmountInput.value = total + ' $';

    // Update payment container total as well
    const paymentTotalAmount = document.getElementById('payment-total-amount');
    if (paymentTotalAmount) {
        paymentTotalAmount.textContent = total;
    }
});

// Update payment details when installments change
function updatePaymentDetails() {
    const installmentsSelect = document.getElementById('payment-installments');
    const paymentTotalAmount = document.getElementById('payment-total-amount');

    if (installmentsSelect && paymentTotalAmount) {
        const quantity = parseInt(ticketQuantityInput.value) || 0;
        const total = quantity * ticketPrice;
        paymentTotalAmount.textContent = total;
    }
}

// Navigation functionality for buttons
document.getElementById('show-photos-btn').addEventListener('click', function () {
    document.getElementById('sec3').scrollIntoView({
        behavior: 'smooth'
    });
});

document.getElementById('purchase-btn').addEventListener('click', function () {
    document.getElementById('sec2').scrollIntoView({
        behavior: 'smooth'
    });
});

// Form submission handling - show iframe inside form
document.addEventListener('DOMContentLoaded', function () {
    const form = document.querySelector('form');
    const paymentContainer = document.getElementById('payment-container');
    const paymentIframe = document.getElementById('payment-iframe');
    const continueBtn = document.getElementById('continue-payment-btn');
    const processBtn = document.getElementById('process-payment-btn');

    // Continue to payment button
    form.addEventListener('submit', function (event) {
        event.preventDefault();

        // Validate form
        if (!form.checkValidity()) {
            alert('אנא מלא את כל השדות הנדרשים');
            return;
        }

        // Validate Israeli ID number
        const idNumber = document.getElementById('id-number').value;
        if (idNumber && !isValidIsraeliID(idNumber)) {
            alert('מספר תעודת זהות לא תקין');
            return;
        }

        console.log('Form submitted, showing payment iframe...');

        // Show payment container and iframe
        paymentContainer.style.display = 'block';
        continueBtn.style.display = 'none';
        processBtn.style.display = 'block';

        // Update payment details
        updatePaymentDetails();

        // Load iframe with payment data
        loadIframeWithPaymentData();

        // Scroll to payment area
        paymentContainer.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });
    });

    // Process payment button
    processBtn.addEventListener('click', function () {
        console.log('Processing payment...');

        // Send payment data to iframe
        sendPaymentDataToIframe();

        // Change button text to indicate processing
        processBtn.textContent = 'מעבד תשלום...';
        processBtn.disabled = true;
    });

    // Add event listener for installments changes
    setTimeout(() => {
        const installmentsSelect = document.getElementById('payment-installments');
        if (installmentsSelect) {
            installmentsSelect.addEventListener('change', updatePaymentDetails);
        }
    }, 100);
});

// ===== MATARA.PRO IFRAME PAYMENT FUNCTIONS =====

// Payment configuration - REPLACE WITH YOUR ACTUAL CREDENTIALS
const PAYMENT_CONFIG = {
    mosad: 'XXXXXXX', // 7-digit institution ID - GET FROM MATARA.PRO
    apiValid: 'XXXXXXXXXX', // API validation code - REQUEST FROM MATARA.PRO
    currency: '2', // 1 = Shekel, 2 = Dollar
    paymentType: 'Ragil' // Regular payment type
};

// Initialize iframe communication according to documentation
function initializeIframe() {
    // Set up PostMessage listener for iframe communication
    window.addEventListener('message', function (event) {
        // Security check - ensure message is from matara.pro
        if (event.origin !== 'https://www.matara.pro') {
            return;
        }

        console.log('Received message from iframe:', event.data);
        handleIframeMessage(event.data);
    });
}

// Handle messages from iframe according to documentation
function handleIframeMessage(data) {
    const iframe = document.getElementById('payment-iframe');

    console.log('Processing iframe message:', data);

    // Handle different types of messages from iframe
    if (typeof data === 'object' && data.height) {
        // Set iframe height dynamically
        iframe.style.height = data.height + 'px';
        console.log('Set iframe height to:', data.height);
    } else if (data && data.result === 'success') {
        // Payment successful
        handlePaymentSuccess(data);
    } else if (data && data.result === 'error') {
        // Payment failed
        handlePaymentError(data);
    } else if (typeof data === 'string' && data.includes('success')) {
        // Handle string success message
        handlePaymentSuccess({ message: data });
    }
}

// Load iframe and send payment data according to documentation
function loadIframeWithPaymentData() {
    const iframe = document.getElementById('payment-iframe');
    const paymentContainer = document.getElementById('payment-container');

    console.log('Loading iframe with payment data...');

    // First, load the iframe
    iframe.src = 'https://www.matara.pro/nedarimplus/iframe/';
    paymentContainer.classList.add('loaded');

    // Wait for iframe to load, then send data
    iframe.onload = function () {
        console.log('Iframe loaded, waiting before sending data...');

        // Wait a bit for iframe to fully initialize
        setTimeout(() => {
            sendPaymentDataToIframe();
        }, 2000);
    };
}

// Send payment data to iframe according to documentation format
function sendPaymentDataToIframe() {
    const iframe = document.getElementById('payment-iframe');
    const form = document.querySelector('form');

    if (!iframe.contentWindow) {
        console.error('Iframe not ready');
        return;
    }

    // Collect form data
    const formData = new FormData(form);

    // Get clean amount (remove $ sign)
    const amountValue = document.getElementById('total-amount').value.replace(/[^0-9]/g, '');

    // Prepare payment data object according to documentation
    const paymentData = {
        // Required fields according to documentation
        'Mosad': PAYMENT_CONFIG.mosad,
        'ApiValid': PAYMENT_CONFIG.apiValid,
        'PaymentType': PAYMENT_CONFIG.paymentType,
        'Amount': amountValue,
        'Tashlumim': '1', // Number of payments
        'Currency': PAYMENT_CONFIG.currency,

        // Customer details
        'Zeout': formData.get('id-number') || '',
        'FirstName': formData.get('name') || '',
        'LastName': formData.get('last-name') || '',
        'Phone': formData.get('phone') || '',
        'Mail': formData.get('email') || '',

        // Optional fields
        'Street': '',
        'City': '',
        'Groupe': 'מקוה אומן',
        'Comment': `הזמנה ל-${formData.get('ticket-quantity')} כרטיסים`,
        'Day': '',
        'Param1': '',
        'Param2': '',

        // Callback settings
        'CallBack': '',
        'CallBackMailError': '',
        'ThirdPartyReceipt': '0',
        'ForceUpdateMatching': '0'
    };

    console.log('Sending payment data to iframe:', paymentData);

    // Send data to iframe using PostMessage as per documentation
    try {
        iframe.contentWindow.postMessage(paymentData, 'https://www.matara.pro');
        console.log('Payment data sent successfully');

        // Reset process button
        const processBtn = document.getElementById('process-payment-btn');
        processBtn.textContent = 'בצע תשלום';
        processBtn.disabled = false;

    } catch (error) {
        console.error('Error sending data to iframe:', error);
        alert('שגיאה בטעינת מערכת התשלומים. אנא נסה שוב.');

        // Reset process button
        const processBtn = document.getElementById('process-payment-btn');
        processBtn.textContent = 'בצע תשלום';
        processBtn.disabled = false;
    }
}

// Handle successful payment
function handlePaymentSuccess(data) {
    console.log('Payment successful:', data);

    // Hide payment container
    const paymentContainer = document.getElementById('payment-container');
    paymentContainer.style.display = 'none';

    // Create success message
    const successDiv = document.createElement('div');
    successDiv.className = 'payment-success';
    successDiv.innerHTML = `
        <div class="success-content">
            <h2>✅ תשלום בוצע בהצלחה!</h2>
            <p>מספר אישור: ${data.confirmation || data.transactionId || 'יתקבל במייל'}</p>
            <p>סכום: ${document.getElementById('total-amount').value}</p>
            <p>תאריך: ${new Date().toLocaleDateString('he-IL')}</p>
            <p>תודה שבחרת במקוה שלנו!</p>
            <button onclick="window.location.reload()">חזור לעמוד הראשי</button>
        </div>
    `;

    // Insert success message
    const form = document.querySelector('form');
    form.appendChild(successDiv);
}

// Handle payment error
function handlePaymentError(data) {
    console.error('Payment failed:', data);

    // Show error message
    const errorMessage = data.message || data.error || 'שגיאה לא ידועה בתשלום';
    alert(`שגיאה בתשלום: ${errorMessage}\n\nאנא נסה שוב או פנה לשירות לקוחות.`);

    // Reset buttons
    const continueBtn = document.getElementById('continue-payment-btn');
    const processBtn = document.getElementById('process-payment-btn');
    const paymentContainer = document.getElementById('payment-container');

    continueBtn.style.display = 'block';
    processBtn.style.display = 'none';
    paymentContainer.style.display = 'none';
}

// Israeli ID validation function
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
