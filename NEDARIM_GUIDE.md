# Nedarim Plus Integration Guide

## מדריך שימוש במערכת נדרים פלוס

### הגדרות ראשוניות

1. **קבלת פרטי הזדהות**
   - פנה לשירות לקוחות נדרים פלוס במייל
   - בקש מזהה מוסד (7 ספרות)
   - בקש קוד אימות (ApiValid)
   - בקש סיסמת API למשיכת נתונים

2. **עדכון הגדרות בקובץ**
   ```javascript
   const NEDARIM_CONFIG = {
       mosadId: 'YOUR_MOSAD_ID', // 7 ספרות שקיבלת
       apiValid: 'YOUR_API_VALID', // קוד האימות
       apiPassword: 'YOUR_API_PASSWORD', // סיסמת API
       // שאר ההגדרות נשארות כמו שהן
   };
   ```

### שימוש במערכת האייפרם

#### 1. יצירת אייפרם תשלום

```javascript
// יצירת אייפרם בקונטיינר קיים (ה-iframe כבר קיים ב-HTML)
const iframe = initNedarimIframe('payment-iframe');

// הכנת נתוני תשלום
const paymentData = createPaymentData({
    paymentType: 'Ragil', // Ragil=רגיל, HK=הוראת קבע, CreateToken=יצירת טוקן
    amount: '150', // סכום בשקלים
    installments: 1, // מספר תשלומים
    firstName: 'יוסי',
    lastName: 'כהן',
    idNumber: '123456789',
    phone: '0501234567',
    email: 'test@example.com',
    currency: '2', // 1=שקל, 2=דולר
    category: 'מקווה',
    comments: 'תשלום עבור מקווה'
});

// שליחת נתונים לאייפרם
sendPaymentToIframe(paymentData);
```

#### 2. טיפול בתוצאות תשלום

```javascript
// האזנה לתוצאת תשלום מוצלח
document.addEventListener('nedarimPaymentSuccess', function(event) {
    const result = event.detail;
    console.log('תשלום הצליח:', result);
    
    // הפניה לדף תודה
    window.location.href = '/thank-you';
});

// האזנה לשגיאת תשלום
document.addEventListener('nedarimPaymentError', function(event) {
    const error = event.detail;
    console.log('תשלום נכשל:', error);
    
    // הצגת הודעת שגיאה
    alert('התשלום נכשל: ' + error.message);
});
```

### שימוש במערכת ביט

```javascript
// יצירת תשלום ביט
const bitResult = await createBitTransaction({
    fullName: 'יוסי כהן',
    phone: '0501234567',
    amount: '150',
    uniqueId: 'UNIQUE_ORDER_ID_123',
    successUrl: 'https://yoursite.com/success',
    failureUrl: 'https://yoursite.com/failure',
    callbackUrl: 'https://yoursite.com/webhook/bit'
});

if (bitResult.Status === 'OK') {
    // הפניה לביט
    window.location.href = bitResult.BitUrl;
}
```

### ניהול עסקאות

#### 1. שליפת היסטוריית עסקאות

```javascript
const history = await getTransactionHistory({
    maxResults: 50,
    lastId: '' // להמשך דפדוף
});

console.log('עסקאות:', history.data);
```

#### 2. ביטול עסקה

```javascript
const cancelResult = await cancelTransaction('TRANSACTION_ID');
if (cancelResult.success) {
    console.log('עסקה בוטלה בהצלחה');
}
```

#### 3. זיכוי עסקה

```javascript
const refundResult = await refundTransaction('TRANSACTION_ID', 150);
if (refundResult.Result === 'OK') {
    console.log('זיכוי בוצע בהצלחה');
}
```

### ניהול הוראות קבע

#### 1. שליפת הוראות קבע

```javascript
const standingOrders = await getStandingOrders();
console.log('הוראות קבע:', standingOrders.data);
```

#### 2. חיוב בודד מהוראת קבע

```javascript
const chargeResult = await chargeSinglePayment('KEVA_ID', {
    amount: '100',
    currency: '2',
    installments: '1',
    category: 'תשלום חודשי',
    joinToKeva: 'Join' // Join או NoJoin
});

if (chargeResult.Status === 'OK') {
    console.log('חיוב בוצע בהצלחה');
}
```

### טיפול בוובהוקים

#### 1. אימות וובהוק

```javascript
// בשרת Node.js/Express
app.post('/webhook/nedarim', (req, res) => {
    // אימות שהבקשה מגיעה מנדרים פלוס
    if (!verifyWebhook(req)) {
        return res.status(403).send('Unauthorized');
    }
    
    const webhookData = req.body;
    
    // טיפול בעסקה רגילה
    if (webhookData.TransactionType === 'רגיל') {
        const processedData = handleRegularTransactionWebhook(webhookData);
        
        // שמירה במסד הנתונים שלך
        saveTransactionToDatabase(processedData);
    }
    
    // טיפול בהוראת קבע
    if (webhookData.KevaId) {
        const processedData = handleStandingOrderWebhook(webhookData);
        
        // עדכון הוראת קבע במסד הנתונים
        updateStandingOrderInDatabase(processedData);
    }
    
    res.status(200).send('OK');
});
```

### ניהול הכנסות חיצוניות

```javascript
// הוספת הכנסה ממזומן
const incomeResult = await saveExternalIncome({
    type: '1', // 1=מזומן
    idNumber: '123456789',
    amount: '100',
    date: formatDateForAPI(new Date()), // תאריך היום
    currency: '2',
    category: 'תרומה',
    comments: 'תרומת מזומן'
});

if (incomeResult.Result === 'OK') {
    console.log('הכנסה חיצונית נשמרה, מזהה:', incomeResult.ID);
}
```

### ניהול קבלות

#### 1. יצירת קבלה לעסקת אשראי

```javascript
const receiptResult = await createCreditReceipt('TRANSACTION_ID', '405'); // 405=קבלת תרומה
if (receiptResult.success) {
    console.log('קבלה נוצרה בהצלחה');
}
```

#### 2. קבלת קישור לקבלה

```javascript
const receiptUrl = await getReceiptUrl('TRANSACTION_ID');
if (receiptUrl.Result === 'OK') {
    console.log('קישור לקבלה:', receiptUrl.Message);
}
```

### ייצוא נתונים

```javascript
// ייצוא עסקאות לאקסל
const exportResult = await exportTransactionHistory(
    '01/01/2024', // מתאריך
    '31/12/2024', // עד תאריך
    false // false=הורדה ישירה, true=שליחה למייל
);

if (exportResult.success) {
    // הורדת הקובץ
    const url = window.URL.createObjectURL(exportResult.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transactions.csv';
    a.click();
}
```

### פונקציות עזר

```javascript
// פורמט תאריך לAPI
const formattedDate = formatDateForAPI(new Date()); // dd/mm/yyyy

// הצגת הודעות הצלחה/שגיאה
showPaymentSuccess({ amount: 150, confirmation: '12345' });
showPaymentError({ message: 'כרטיס אשראי לא תקין' });
```

## הערות חשובות

1. **אבטחה**: וודא שכל הבקשות מגיעות מכתובת IP המורשית של נדרים פלוס
2. **מגבלות**: חלק מה-API מוגבל ל-20 בקשות בשעה
3. **פורמט תאריכים**: תמיד השתמש בפורמט dd/mm/yyyy
4. **מטבע**: 1=שקל, 2=דולר
5. **וובהוקים**: הגדר URL קבוע לקבלת עדכונים מנדרים פלוס

## דוגמאות מעשיות

### דוגמא מלאה לטופס תשלום

```html
<form id="payment-form">
    <input type="text" id="first-name" placeholder="שם פרטי" required>
    <input type="text" id="last-name" placeholder="שם משפחה" required>
    <input type="text" id="id-number" placeholder="תעודת זהות" required>
    <input type="tel" id="phone" placeholder="טלפון" required>
    <input type="email" id="email" placeholder="אימייל">
    <input type="number" id="amount" placeholder="סכום" required>
    <select id="installments">
        <option value="1">תשלום מלא</option>
        <option value="2">2 תשלומים</option>
        <option value="3">3 תשלומים</option>
    </select>
    
    <iframe id="payment-iframe" src="" frameborder="0">טוען מערכת תשלומים...</iframe>
    
    <button type="button" onclick="processPayment()">המשך לתשלום</button>
</form>
```

```javascript
function processPayment() {
    // איסוף נתונים מהטופס
    const formData = {
        firstName: document.getElementById('first-name').value,
        lastName: document.getElementById('last-name').value,
        idNumber: document.getElementById('id-number').value,
        phone: document.getElementById('phone').value,
        email: document.getElementById('email').value,
        amount: document.getElementById('amount').value,
        installments: document.getElementById('installments').value
    };
    
    // הגדרת אייפרם אם לא הוגדר עדיין
    if (!document.getElementById('payment-iframe').src) {
        initNedarimIframe('payment-iframe');
    }
    
    // יצירת נתוני תשלום ושליחה
    const paymentData = createPaymentData(formData);
    sendPaymentToIframe(paymentData);
}
```

זהו! עכשיו יש לך מערכת מלאה לעבודה עם נדרים פלוס.
