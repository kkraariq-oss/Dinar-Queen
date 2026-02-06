// ==========================================
// دينار كوين - Dinar Coin JavaScript
// Redesigned Mobile App Version
// ==========================================

// Register Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('SW registered:', reg.scope))
            .catch(err => console.log('SW registration failed:', err));
    });
}

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDGpAHia_wEmrhnmYjrPf1n1TrAzwEMiAI",
    authDomain: "messageemeapp.firebaseapp.com",
    databaseURL: "https://messageemeapp-default-rtdb.firebaseio.com",
    projectId: "messageemeapp",
    storageBucket: "messageemeapp.appspot.com",
    messagingSenderId: "255034474844",
    appId: "1:255034474844:web:5e3b7a6bc4b2fb94cc4199",
    measurementId: "G-4QBEWRC583"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const database = firebase.database();

// Global Variables
let currentUser = null;
let userDataListener = null;

// Constants
const PRICE_PER_COIN = 1000;
const WELCOME_BONUS = 1.0;
const REFERRAL_BONUS = 0.25;

// ==========================================
// Initialization
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    createParticles();
    setupEventListeners();
});

function initializeApp() {
    auth.onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            loadUserData();
            showDashboard();
            updateStatistics();
        } else {
            currentUser = null;
            showHome();
        }
    });
}

function createParticles() {
    const container = document.getElementById('particles');
    if (!container) return;
    
    const count = 25;
    for (let i = 0; i < count; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.left = Math.random() * 100 + '%';
        const size = Math.random() * 3 + 1.5;
        p.style.width = size + 'px';
        p.style.height = size + 'px';
        p.style.animationDelay = Math.random() * 20 + 's';
        p.style.animationDuration = (Math.random() * 12 + 10) + 's';
        p.style.opacity = '0';
        container.appendChild(p);
    }
}

function setupEventListeners() {
    // Buy amount calculation
    const buyInput = document.getElementById('buyAmount');
    if (buyInput) {
        buyInput.addEventListener('input', calculateBuyTotal);
    }
}

// ==========================================
// Screen Navigation
// ==========================================

function showHome() {
    document.getElementById('homeScreen').classList.add('active-screen');
    document.getElementById('dashboardScreen').classList.remove('active-screen');
    
    // Update nav
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.querySelector('[data-tab="home"]')?.classList.add('active');
}

function showDashboard() {
    document.getElementById('homeScreen').classList.remove('active-screen');
    document.getElementById('dashboardScreen').classList.add('active-screen');
    
    // Update nav
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.querySelector('[data-tab="home"]')?.classList.add('active');
}

function switchTab(tab) {
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`[data-tab="${tab}"]`)?.classList.add('active');
    
    if (tab === 'home') {
        if (currentUser) {
            showDashboard();
        } else {
            showHome();
        }
    }
    // Other tabs can be expanded later
}

// ==========================================
// Authentication
// ==========================================

function showAuthModal(type = 'login') {
    const modal = document.getElementById('authModal');
    modal.classList.add('active');
    switchAuthForm(type);
}

function closeAuthModal() {
    document.getElementById('authModal').classList.remove('active');
}

function switchAuthForm(type) {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    
    if (type === 'login') {
        loginForm.style.display = 'block';
        signupForm.style.display = 'none';
    } else {
        loginForm.style.display = 'none';
        signupForm.style.display = 'block';
    }
}

async function login() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        showNotification('خطأ', 'الرجاء إدخال البريد الإلكتروني وكلمة المرور', 'error');
        return;
    }
    
    try {
        await auth.signInWithEmailAndPassword(email, password);
        closeAuthModal();
        showNotification('مرحباً بك!', 'تم تسجيل الدخول بنجاح', 'success');
    } catch (error) {
        console.error('Login error:', error);
        showNotification('خطأ', getErrorMessage(error.code), 'error');
    }
}

async function signup() {
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const referralCode = document.getElementById('signupReferralCode').value.trim();
    
    if (!name || !email || !password) {
        showNotification('خطأ', 'الرجاء إدخال جميع البيانات المطلوبة', 'error');
        return;
    }
    
    if (password.length < 6) {
        showNotification('خطأ', 'كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'error');
        return;
    }
    
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        const newReferralCode = generateReferralCode();
        
        let referrerUid = null;
        if (referralCode) {
            referrerUid = await validateReferralCode(referralCode);
        }
        
        await database.ref(`users/${user.uid}`).set({
            name: name,
            email: email,
            balance: WELCOME_BONUS,
            referralCode: newReferralCode,
            referralCount: 0,
            referralEarnings: 0,
            usedReferralCode: referralCode || null,
            createdAt: firebase.database.ServerValue.TIMESTAMP
        });
        
        await addTransaction(user.uid, {
            type: 'bonus',
            amount: WELCOME_BONUS,
            description: 'مكافأة الترحيب',
            status: 'completed'
        });
        
        if (referrerUid) {
            await processReferral(referrerUid, user.uid);
        }
        
        closeAuthModal();
        showNotification('مرحباً بك!', 'تم إنشاء الحساب بنجاح وإضافة مكافأة الترحيب', 'success');
        
    } catch (error) {
        console.error('Signup error:', error);
        showNotification('خطأ', getErrorMessage(error.code), 'error');
    }
}

async function logout() {
    try {
        if (userDataListener) {
            userDataListener.off();
            userDataListener = null;
        }
        await auth.signOut();
        showNotification('تم تسجيل الخروج', 'نراك قريباً!', 'success');
    } catch (error) {
        console.error('Logout error:', error);
    }
}

function getErrorMessage(errorCode) {
    const messages = {
        'auth/email-already-in-use': 'البريد الإلكتروني مستخدم بالفعل',
        'auth/invalid-email': 'البريد الإلكتروني غير صحيح',
        'auth/weak-password': 'كلمة المرور ضعيفة',
        'auth/user-not-found': 'المستخدم غير موجود',
        'auth/wrong-password': 'كلمة المرور غير صحيحة',
        'auth/invalid-credential': 'بيانات الدخول غير صحيحة'
    };
    return messages[errorCode] || 'حدث خطأ ما، الرجاء المحاولة مرة أخرى';
}

// ==========================================
// User Data Management
// ==========================================

function loadUserData() {
    if (!currentUser) return;
    
    userDataListener = database.ref(`users/${currentUser.uid}`);
    userDataListener.on('value', (snapshot) => {
        const userData = snapshot.val();
        if (userData) {
            updateUserUI(userData);
            loadTransactions();
        }
    });
}

function updateUserUI(userData) {
    // Hidden data holders
    const userNameEl = document.getElementById('userName');
    const userEmailEl = document.getElementById('userEmail');
    if (userNameEl) userNameEl.textContent = userData.name;
    if (userEmailEl) userEmailEl.textContent = userData.email;
    
    // Avatar
    const avatar = document.getElementById('userAvatar');
    if (avatar) {
        const firstLetter = userData.name.charAt(0).toUpperCase();
        avatar.textContent = firstLetter;
    }
    
    // Credit Card
    const cardBalance = document.getElementById('cardBalance');
    const cardHolder = document.getElementById('cardHolderName');
    const cardNumber = document.getElementById('cardNumber');
    
    if (cardBalance) cardBalance.textContent = parseFloat(userData.balance || 0).toFixed(2);
    if (cardHolder) cardHolder.textContent = userData.name;
    if (cardNumber) cardNumber.innerHTML = formatCardNumber(currentUser.uid);
    
    // Referral
    const refCode = document.getElementById('referralCode');
    const receiveCode = document.getElementById('receiveCode');
    const refCount = document.getElementById('referralCount');
    const refEarnings = document.getElementById('referralEarnings');
    
    if (refCode) refCode.textContent = userData.referralCode;
    if (receiveCode) receiveCode.textContent = userData.referralCode;
    if (refCount) refCount.textContent = userData.referralCount || 0;
    if (refEarnings) refEarnings.textContent = parseFloat(userData.referralEarnings || 0).toFixed(0) || '0';
    
    // Generate QR Code
    generateQRCode(userData.referralCode);
}

function formatCardNumber(uid) {
    const hash = uid.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
    }, 0);
    
    const cardNum = Math.abs(hash).toString().padEnd(16, '0').substring(0, 16);
    const parts = cardNum.match(/.{1,4}/g);
    // Show XXXX for first 3 groups, real for last
    return `XXXX &nbsp; XXXX &nbsp; XXXX &nbsp; ${parts[3]}`;
}

function generateQRCode(data) {
    const qrContainer = document.getElementById('qrCode');
    if (!qrContainer) return;
    
    qrContainer.innerHTML = '';
    
    try {
        new QRCode(qrContainer, {
            text: data,
            width: 180,
            height: 180,
            colorDark: '#1a5f3f',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.H
        });
    } catch (error) {
        console.error('QR Code error:', error);
        qrContainer.innerHTML = '<div style="width:180px;height:180px;display:flex;align-items:center;justify-content:center;background:#fff;border-radius:12px;"><i class="fas fa-qrcode" style="font-size:3rem;color:#1a5f3f;"></i></div>';
    }
}

// ==========================================
// Transactions
// ==========================================

async function loadTransactions() {
    if (!currentUser) return;
    
    const list = document.getElementById('transactionsList');
    if (!list) return;
    
    try {
        const snapshot = await database.ref(`transactions/${currentUser.uid}`)
            .orderByChild('timestamp')
            .limitToLast(20)
            .once('value');
        
        const transactions = [];
        snapshot.forEach((child) => {
            transactions.push({ id: child.key, ...child.val() });
        });
        
        transactions.sort((a, b) => b.timestamp - a.timestamp);
        
        if (transactions.length === 0) {
            list.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>لا توجد عمليات بعد</p>
                </div>
            `;
            return;
        }
        
        list.innerHTML = transactions.map(tx => createTransactionHTML(tx)).join('');
        
    } catch (error) {
        console.error('Load transactions error:', error);
    }
}

function createTransactionHTML(tx) {
    const iconClass = tx.status === 'pending' ? 'pending' : (tx.type === 'send' ? 'negative' : 'positive');
    const icon = { buy: 'shopping-cart', sell: 'hand-holding-usd', send: 'paper-plane', receive: 'download', bonus: 'gift', referral: 'users' }[tx.type] || 'exchange-alt';
    const sign = tx.type === 'send' ? '-' : '+';
    const date = new Date(tx.timestamp).toLocaleDateString('ar-IQ', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    
    return `
        <div class="transaction-item">
            <div class="transaction-icon ${iconClass}">
                <i class="fas fa-${icon}"></i>
            </div>
            <div class="transaction-details">
                <div class="transaction-type">${tx.description}</div>
                <div class="transaction-date">${date}</div>
            </div>
            <div class="transaction-amount ${iconClass}">
                ${sign}${parseFloat(tx.amount).toFixed(2)} DC
            </div>
        </div>
    `;
}

async function addTransaction(userId, data) {
    try {
        await database.ref(`transactions/${userId}`).push({
            ...data,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        });
    } catch (error) {
        console.error('Add transaction error:', error);
    }
}

// ==========================================
// Statistics
// ==========================================

async function updateStatistics() {
    try {
        const snapshot = await database.ref('users').once('value');
        const userCount = snapshot.numChildren();
        
        let txCount = 0;
        snapshot.forEach((child) => {
            const data = child.val();
            if (data.referralCount) txCount += data.referralCount;
        });
        
        // Update referral send count if element exists
        const sendCountEl = document.getElementById('referralSendCount');
        if (sendCountEl) sendCountEl.textContent = txCount;
        
    } catch (error) {
        console.error('Statistics error:', error);
    }
    
    setTimeout(updateStatistics, 60000);
}

// ==========================================
// Referral System
// ==========================================

function generateReferralCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'DC';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

async function validateReferralCode(code) {
    if (!code || code.length !== 10) return null;
    
    try {
        const snapshot = await database.ref('users')
            .orderByChild('referralCode')
            .equalTo(code)
            .once('value');
        
        if (snapshot.exists()) {
            return Object.keys(snapshot.val())[0];
        }
    } catch (error) {
        console.error('Validate referral error:', error);
    }
    return null;
}

async function processReferral(referrerUid, newUserUid) {
    try {
        const referrerRef = database.ref(`users/${referrerUid}`);
        const snapshot = await referrerRef.once('value');
        const data = snapshot.val();
        if (!data) return;
        
        const newCount = (data.referralCount || 0) + 1;
        let bonus = 0;
        
        if (newCount % 10 === 0) {
            bonus = REFERRAL_BONUS;
            const newBalance = parseFloat(data.balance || 0) + bonus;
            const newEarnings = parseFloat(data.referralEarnings || 0) + bonus;
            
            await referrerRef.update({
                referralCount: newCount,
                referralEarnings: newEarnings,
                balance: newBalance
            });
            
            await addTransaction(referrerUid, {
                type: 'referral',
                amount: bonus,
                description: `مكافأة إحالة - ${newCount} إحالة`,
                status: 'completed'
            });
        } else {
            await referrerRef.update({ referralCount: newCount });
        }
    } catch (error) {
        console.error('Process referral error:', error);
    }
}

function copyReferralCode() {
    const code = document.getElementById('referralCode')?.textContent;
    if (code) {
        copyToClipboard(code);
        showNotification('تم النسخ', 'تم نسخ رمز الإحالة بنجاح', 'success');
    }
}

function copyReceiveCode() {
    const code = document.getElementById('receiveCode')?.textContent;
    if (code) {
        copyToClipboard(code);
        showNotification('تم النسخ', 'تم نسخ رمز الإحالة بنجاح', 'success');
    }
}

function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
    } else {
        fallbackCopy(text);
    }
}

function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
}

// ==========================================
// Buy / Send / Receive Modals
// ==========================================

function showBuyModal() {
    document.getElementById('buyModal').classList.add('active');
    document.getElementById('buyAmount').value = '';
    document.getElementById('totalIQD').textContent = '0 IQD';
}

function closeBuyModal() {
    document.getElementById('buyModal').classList.remove('active');
}

function calculateBuyTotal() {
    const amount = parseFloat(document.getElementById('buyAmount').value) || 0;
    const total = amount * PRICE_PER_COIN;
    document.getElementById('totalIQD').textContent = total.toLocaleString('ar-IQ') + ' IQD';
}

async function submitBuyRequest() {
    if (!currentUser) return;
    
    const amount = parseFloat(document.getElementById('buyAmount').value);
    if (!amount || amount <= 0) {
        showNotification('خطأ', 'الرجاء إدخال كمية صحيحة', 'error');
        return;
    }
    
    try {
        const totalIQD = amount * PRICE_PER_COIN;
        
        await database.ref(`purchase_requests/${currentUser.uid}`).push({
            userId: currentUser.uid,
            amount: amount,
            totalIQD: totalIQD,
            status: 'pending',
            timestamp: firebase.database.ServerValue.TIMESTAMP
        });
        
        await addTransaction(currentUser.uid, {
            type: 'buy',
            amount: amount,
            description: `طلب شراء - ${totalIQD.toLocaleString('ar-IQ')} IQD`,
            status: 'pending'
        });
        
        closeBuyModal();
        showNotification('تم إرسال الطلب!', `تم إرسال طلب شراء ${amount} DC بنجاح`, 'success');
        
    } catch (error) {
        console.error('Buy error:', error);
        showNotification('خطأ', 'فشل إرسال الطلب', 'error');
    }
}

function showSendModal() {
    document.getElementById('sendModal').classList.add('active');
    document.getElementById('recipientCode').value = '';
    document.getElementById('sendAmount').value = '';
    document.getElementById('sendNote').value = '';
}

function closeSendModal() {
    document.getElementById('sendModal').classList.remove('active');
}

function showReceiveModal() {
    if (!currentUser) {
        showAuthModal('login');
        return;
    }
    document.getElementById('receiveModal').classList.add('active');
}

function closeReceiveModal() {
    document.getElementById('receiveModal').classList.remove('active');
}

async function sendCoins() {
    if (!currentUser) return;
    
    const recipientCode = document.getElementById('recipientCode').value.trim();
    const amount = parseFloat(document.getElementById('sendAmount').value);
    const note = document.getElementById('sendNote').value.trim() || 'تحويل';
    
    if (!recipientCode || !amount || amount <= 0) {
        showNotification('خطأ', 'الرجاء إدخال جميع البيانات المطلوبة', 'error');
        return;
    }
    
    try {
        const senderSnapshot = await database.ref(`users/${currentUser.uid}`).once('value');
        const senderData = senderSnapshot.val();
        
        if (!senderData || parseFloat(senderData.balance) < amount) {
            showNotification('خطأ', 'رصيدك غير كافٍ لإتمام هذه العملية', 'error');
            return;
        }
        
        const recipientUid = await validateReferralCode(recipientCode);
        
        if (!recipientUid) {
            showNotification('خطأ', 'رمز الإحالة غير صحيح', 'error');
            return;
        }
        
        if (recipientUid === currentUser.uid) {
            showNotification('خطأ', 'لا يمكنك إرسال الأموال لنفسك', 'error');
            return;
        }
        
        const recipientSnapshot = await database.ref(`users/${recipientUid}`).once('value');
        const recipientData = recipientSnapshot.val();
        
        if (!recipientData) {
            showNotification('خطأ', 'المستخدم غير موجود', 'error');
            return;
        }
        
        const newSenderBalance = parseFloat(senderData.balance) - amount;
        const newRecipientBalance = parseFloat(recipientData.balance || 0) + amount;
        
        await database.ref(`users/${currentUser.uid}`).update({ balance: newSenderBalance });
        await database.ref(`users/${recipientUid}`).update({ balance: newRecipientBalance });
        
        await addTransaction(currentUser.uid, {
            type: 'send',
            amount: amount,
            description: `إرسال إلى ${recipientData.name} - ${note}`,
            recipient: recipientUid,
            status: 'completed'
        });
        
        await addTransaction(recipientUid, {
            type: 'receive',
            amount: amount,
            description: `استلام من ${senderData.name} - ${note}`,
            sender: currentUser.uid,
            status: 'completed'
        });
        
        closeSendModal();
        showNotification('تمت العملية بنجاح!', `تم إرسال ${amount} DC إلى ${recipientData.name}`, 'success');
        
    } catch (error) {
        console.error('Send error:', error);
        showNotification('خطأ', 'فشلت العملية', 'error');
    }
}

// ==========================================
// Notifications
// ==========================================

function showNotification(title, message, type = 'success') {
    const notification = document.getElementById('successNotification');
    if (!notification) return;
    
    document.getElementById('notificationTitle').textContent = title;
    document.getElementById('notificationMessage').textContent = message;
    
    notification.className = `toast-notification ${type}`;
    notification.classList.add('active');
    
    setTimeout(() => {
        notification.classList.remove('active');
    }, 4000);
}

function closeNotification() {
    document.getElementById('successNotification')?.classList.remove('active');
}

// ==========================================
// Utility
// ==========================================

// Close modals on backdrop click
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('active');
    }
});

// Prevent Enter key form submission
document.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
        e.preventDefault();
    }
});

// Debug
window.debugDinarCoin = {
    currentUser: () => currentUser,
    database: database,
    auth: auth
};
