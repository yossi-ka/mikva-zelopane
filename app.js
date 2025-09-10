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
        const processingText = translations['processing_payment'] && translations['processing_payment'][currentLanguage]
            ? translations['processing_payment'][currentLanguage]
            : 'מעבד תשלום...';
        processBtn.textContent = processingText;
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
