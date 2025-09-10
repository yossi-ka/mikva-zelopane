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
