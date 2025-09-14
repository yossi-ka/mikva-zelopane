// הפונקציות זמינות מ-nedarim.js שנטען קודם
// PAYMENT_CONFIG, initializeIframe, loadIframeWithPaymentData, isValidIsraeliID

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
            // Check if the translation contains HTML (like <br> tags)
            if (translations[key][currentLanguage].includes('<br>')) {
                element.innerHTML = translations[key][currentLanguage];
            } else {
                element.textContent = translations[key][currentLanguage];
            }
        }
    });

    // Update price items with data-he and data-en attributes
    const priceItems = document.querySelectorAll('.price-item[data-he][data-en]');
    priceItems.forEach(item => {
        const text = currentLanguage === 'he' ? item.getAttribute('data-he') : item.getAttribute('data-en');
        if (text) {
            item.textContent = text;
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

    // Update processing payment button based on its current state
    const processBtn = document.getElementById('process-payment-btn');
    if (processBtn) {
        if (processBtn.disabled && (processBtn.textContent.includes('מעבד') || processBtn.textContent.includes('Processing'))) {
            // Button is in processing state - update processing text
            const processingText = translations['processing_payment'] && translations['processing_payment'][currentLanguage]
                ? translations['processing_payment'][currentLanguage]
                : 'מעבד תשלום...';
            processBtn.textContent = processingText;
        } else if (!processBtn.disabled) {
            // Button is in normal state - update normal text
            const normalText = translations['process_payment_btn'] && translations['process_payment_btn'][currentLanguage]
                ? translations['process_payment_btn'][currentLanguage]
                : 'בצע תשלום';
            processBtn.textContent = normalText;
        }
    }
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

// Ticket price calculation with tiered pricing
const ticketQuantityInput = document.getElementById('ticket-quantity');
const totalAmountInput = document.getElementById('total-amount');

// Function to calculate price based on quantity
function calculatePrice(quantity, validCoupon = false, discount = 0) {
    const disc = validCoupon ? discount : 0;
    if (quantity >= 1 && quantity <= 4) {
        return 160 - disc; // $160 per ticket for 1-4 tickets
    } else if (quantity >= 5 && quantity <= 9) {
        return 150 - disc; // $150 per ticket for 5-9 tickets
    } else if (quantity >= 10) {
        return 140 - disc; // $140 per ticket for 10+ tickets
    }
    return 0; // No tickets
}

// Update total amount when quantity changes
ticketQuantityInput.addEventListener('input', () => {
    const quantity = parseInt(ticketQuantityInput.value) || 0;
    const pricePerTicket = calculatePrice(quantity);
    const total = quantity * pricePerTicket;
    totalAmountInput.value = total + ' $';

    // Update payment container total as well
    const paymentTotalAmount = document.getElementById('payment-total-amount');
    if (paymentTotalAmount) {
        paymentTotalAmount.textContent = total;
    }
});

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

    // Store original button text for restoration
    let originalProcessBtnText = '';

    // Function to get current translated text for process button
    function getProcessButtonText() {
        return translations['process_payment_btn'] && translations['process_payment_btn'][currentLanguage]
            ? translations['process_payment_btn'][currentLanguage]
            : 'בצע תשלום';
    }

    // Function to restore process button to normal state
    function restoreProcessButton() {
        processBtn.textContent = getProcessButtonText();
        processBtn.disabled = false;
    }

    // Continue to payment button
    form.addEventListener('submit', function (event) {
        event.preventDefault();

        // Validate form
        if (!form.checkValidity()) {
            alert('אנא מלא את כל השדות הנדרשים');
            return;
        }

        // Show payment container and iframe
        paymentContainer.style.display = 'block';
        continueBtn.style.display = 'none';
        processBtn.style.display = 'block';

        // Update button states when process button becomes visible
        if (typeof updateButtonStates === 'function') {
            updateButtonStates();
        }

        // Load iframe with payment data
        if (typeof debugLog !== 'undefined') {
            debugLog('APP_FORM', 'Form submitted, loading payment iframe', {
                containerVisible: paymentContainer.style.display,
                continueButtonVisible: continueBtn.style.display,
                processButtonVisible: processBtn.style.display
            });
        }

        loadIframeWithPaymentData();

        // Scroll to payment area
        paymentContainer.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });
    });

    // Process payment button
    processBtn.addEventListener('click', function () {

        // Add debugging for button click
        if (typeof debugLog !== 'undefined') {
            debugLog('APP_PAYMENT', 'Process payment button clicked', {
                buttonText: processBtn.textContent,
                buttonDisabled: processBtn.disabled,
                currentLanguage: currentLanguage,
                translationsAvailable: typeof translations !== 'undefined'
            });
        }

        // Send payment data to iframe
        sendPaymentDataToIframe();

        // Change button text to indicate processing
        const processingText = translations['processing_payment'] && translations['processing_payment'][currentLanguage]
            ? translations['processing_payment'][currentLanguage]
            : 'מעבד תשלום...';

        if (typeof debugLog !== 'undefined') {
            debugLog('APP_PAYMENT', 'Updating button text to processing state', {
                oldText: processBtn.textContent,
                newText: processingText,
                language: currentLanguage
            });
        }

        processBtn.textContent = processingText;
        processBtn.disabled = true;
    });

});

//  Show coupon input when link is clicked
document.getElementById('couponLink').addEventListener('click', function () {
    const couponElements = document.querySelectorAll('.coupon');
    couponElements.forEach(el => {
        el.style.display = 'block';
    });
});

const calculateTotalAmount = async () => {
    const url = "https://script.google.com/macros/s/AKfycbyMrvZESBbfggHyhKM3p8VD0BGTnGXW61zMxnf_s7QJpawT7yZ_Wlr2oqYbZXQsaa2I3A/exec?coupon=";
    const couponCodeInput = document.getElementById('coupon-code').value.trim() || '';
    const fullUrl = `${url}${couponCodeInput}`;
    const res = await fetch(fullUrl);
    const data = await res.json();
    const validCoupon = data.isValid;
    const quantity = parseInt(ticketQuantityInput.value) || 0;

    const ticketPrice = calculatePrice(quantity, validCoupon, data.discountPerTicket || 0);
    const totalAmount = ticketPrice * quantity;

    totalAmountInput.value = totalAmount.toFixed(2) + ' $';
};
ticketQuantityInput.addEventListener('input', calculateTotalAmount);
document.getElementById('coupon-code').addEventListener('input', calculateTotalAmount);

// Initial total amount calculation
calculateTotalAmount();
