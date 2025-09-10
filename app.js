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

// Language toggle event listener
document.addEventListener('DOMContentLoaded', function() {
    // Load saved language preference
    const savedLanguage = localStorage.getItem('selectedLanguage') || 'he';
    currentLanguage = savedLanguage;
    
    // Load translations
    loadTranslations();
    
    // Add language button event listener
    const languageBtn = document.getElementById('language-btn');
    if (languageBtn) {
        languageBtn.addEventListener('click', function() {
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

// Form submission handling
const form = document.querySelector('form');
const iframe = document.querySelector('iframe');

// Initially hide the iframe
iframe.style.display = 'none';

form.addEventListener('submit', function (event) {
    event.preventDefault(); // מונע שליחה רגילה של הטופס

    // בדיקת תקינות הטופס
    if (form.checkValidity()) {
        // הטופס תקין - הצג את האייפריים
        iframe.style.display = 'block';
        iframe.scrollIntoView({
            behavior: 'smooth'
        });

        // כאן תוכל להוסיף קוד נוסף לשליחת הנתונים לשרת
        console.log('טופס נשלח בהצלחה!');
    } else {
        // הטופס לא תקין - הצג הודעת שגיאה
        alert('אנא מלא את כל השדות הנדרשים');
    }
});
