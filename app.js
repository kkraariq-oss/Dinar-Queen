// ==========================================
// DINAR COIN - Full App JavaScript V3.0
// تطبيق دينار كوين - نسخة محدثة ومحسنة
// ==========================================

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/Dinar-Queen/sw.js').catch(() => {});
    });
}

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

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();

let currentUser = null;
let userDataListener = null;
let userCardData = null;
let cardFlipped = false;
let cardNumVisible = false;
let cvvVisible = false;
let qrScanner = null;

const PRICE_PER_COIN = 1000;
const TOTAL_SUPPLY = 1000000;
const WELCOME_BONUS = 1.0;
const REFERRAL_BONUS = 0.25;

// ==========================================
// NEWS ARTICLES DATA
// ==========================================
const newsArticles = [
    {
        id: 0, cat: 'invest',
        title: 'لماذا دينار كوين هو مستقبل الاستثمار الرقمي العراقي؟',
        summary: 'تحليل شامل لفرص الاستثمار في العملة الرقمية العراقية الأولى',
        img: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=600&h=300&fit=crop',
        date: '2026-02-06',
        body: `في عالم يتجه بسرعة نحو الرقمنة، يبرز دينار كوين كفرصة استثمارية فريدة من نوعها في المنطقة العربية.`
    },
    {
        id: 1, cat: 'update',
        title: 'إطلاق النسخة التجريبية من دينار كوين',
        summary: 'بداية رحلتنا نحو مستقبل رقمي متطور',
        img: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=300&fit=crop',
        date: '2026-02-05',
        body: `يسعدنا الإعلان عن إطلاق النسخة التجريبية من منصة دينار كوين!`
    }
];

// ==========================================
// INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    createParticles();
    setupEventListeners();
    renderNewsArticles();
    loadGlobalStats();
});

function initializeApp() {
    auth.onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            loadUserData();
            showDashboard();
            updateAnalyticsStats();
        } else {
            currentUser = null;
            showHome();
        }
    });
}

function createParticles() {
    const c = document.getElementById('particles');
    if (!c) return;
    for (let i = 0; i < 20; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.left = Math.random() * 100 + '%';
        const s = Math.random() * 3 + 1.5;
        p.style.width = s + 'px';
        p.style.height = s + 'px';
        p.style.animationDelay = Math.random() * 20 + 's';
        c.appendChild(p);
    }
}

function setupEventListeners() {
    document.getElementById('buyAmount')?.addEventListener('input', calculateBuyTotal);
}

// ==========================================
// GLOBAL STATISTICS
// ==========================================
let globalStatsListener = null;

async function loadGlobalStats() {
    try {
        // التحقق من وجود العقدة وإنشاءها إذا لم تكن موجودة
        const snap = await database.ref('global_stats').once('value');
        if (!snap.exists()) {
            await database.ref('global_stats').set({
                totalUsers: 0,
                totalDistributed: 0,
                totalRemaining: TOTAL_SUPPLY,
                lastUpdated: firebase.database.ServerValue.TIMESTAMP
            });
        }
        
        // حساب الإحصائيات الفعلية من المستخدمين
        await updateGlobalStatsFromUsers();
        
        // الاستماع للتحديثات
        globalStatsListener = database.ref('global_stats').on('value', (snapshot) => {
            const data = snapshot.val() || { 
                totalUsers: 0, 
                totalDistributed: 0, 
                totalRemaining: TOTAL_SUPPLY 
            };
            
            updateStatsDisplay(data);
        });
    } catch (e) {
        console.error('Error loading global stats:', e);
    }
}

async function updateGlobalStatsFromUsers() {
    try {
        const usersSnap = await database.ref('users').once('value');
        let totalUsers = 0;
        let totalDistributed = 0;
        
        if (usersSnap.exists()) {
            usersSnap.forEach(userSnap => {
                totalUsers++;
                const userData = userSnap.val();
                if (userData.balance) {
                    totalDistributed += parseFloat(userData.balance);
                }
            });
        }
        
        const remaining = Math.max(0, TOTAL_SUPPLY - totalDistributed);
        
        await database.ref('global_stats').update({
            totalUsers: totalUsers,
            totalDistributed: totalDistributed,
            totalRemaining: remaining,
            lastUpdated: firebase.database.ServerValue.TIMESTAMP
        });
    } catch (e) {
        console.error('Error updating global stats:', e);
    }
}

function updateStatsDisplay(data) {
    const totalUsers = data.totalUsers || 0;
    const totalRemaining = data.totalRemaining || TOTAL_SUPPLY;
    const totalDistributed = data.totalDistributed || 0;
    
    // تحديث شاشة الصفحة الرئيسية
    updateElement('homeUsersCount', totalUsers.toLocaleString('ar-IQ'));
    updateElement('homeCoinsRemaining', totalRemaining.toLocaleString('ar-IQ'));
    
    // تحديث شاشة الداشبورد
    updateElement('dashUsersCount', totalUsers.toLocaleString('ar-IQ'));
    updateElement('dashCoinsRemaining', totalRemaining.toLocaleString('ar-IQ'));
    
    // تحديث شاشة التحليلات
    updateElement('statTotalUsers', totalUsers.toLocaleString('ar-IQ'));
    updateElement('statCirculating', totalDistributed.toLocaleString('ar-IQ'));
    updateElement('statRemaining', totalRemaining.toLocaleString('ar-IQ'));
    updateElement('statTotalSupply', TOTAL_SUPPLY.toLocaleString('ar-IQ'));
    
    const distributionPercent = ((totalDistributed / TOTAL_SUPPLY) * 100).toFixed(2);
    updateElement('distributionPercent', distributionPercent + '%');
    
    // تحديث الرسم البياني
    updateCharts(data);
}

// ==========================================
// CHARTS - الرسوم البيانية
// ==========================================
function updateCharts(data) {
    updateDistributionChart(data);
    updateUsersChart();
}

function updateDistributionChart(data) {
    const distributed = data.totalDistributed || 0;
    const remaining = data.totalRemaining || TOTAL_SUPPLY;
    const percentage = ((distributed / TOTAL_SUPPLY) * 100).toFixed(1);
    
    const chartEl = document.getElementById('distributionChart');
    if (chartEl) {
        chartEl.style.background = `conic-gradient(
            var(--gold-primary) 0% ${percentage}%,
            var(--bg-card) ${percentage}% 100%
        )`;
    }
    
    updateElement('chartDistributed', distributed.toLocaleString('ar-IQ'));
    updateElement('chartRemaining', remaining.toLocaleString('ar-IQ'));
    updateElement('chartPercentage', percentage + '%');
}

async function updateUsersChart() {
    try {
        const usersSnap = await database.ref('users').limitToLast(7).once('value');
        const labels = [];
        const values = [];
        
        usersSnap.forEach(snap => {
            const userData = snap.val();
            if (userData.joinDate) {
                const date = new Date(userData.joinDate);
                labels.push(date.toLocaleDateString('ar-IQ', { month: 'short', day: 'numeric' }));
                values.push(parseFloat(userData.balance || 0));
            }
        });
        
        renderSimpleBarChart('usersGrowthChart', labels, values);
    } catch (e) {
        console.error('Error updating users chart:', e);
    }
}

function renderSimpleBarChart(elementId, labels, values) {
    const canvas = document.getElementById(elementId);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const padding = 30;
    const barWidth = (width - 2 * padding) / labels.length;
    const maxValue = Math.max(...values, 1);
    
    ctx.clearRect(0, 0, width, height);
    
    // رسم الأعمدة
    values.forEach((value, i) => {
        const barHeight = (value / maxValue) * (height - 2 * padding);
        const x = padding + i * barWidth + barWidth * 0.1;
        const y = height - padding - barHeight;
        const w = barWidth * 0.8;
        
        // تدرج لوني
        const gradient = ctx.createLinearGradient(x, y, x, y + barHeight);
        gradient.addColorStop(0, '#d4af37');
        gradient.addColorStop(1, '#1a5f4a');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, w, barHeight);
        
        // النص
        ctx.fillStyle = '#c8d6d0';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(labels[i], x + w/2, height - 10);
    });
}

// ==========================================
// SCREENS
// ==========================================
function showHome() {
    document.getElementById('homeScreen').classList.add('active-screen');
    document.getElementById('dashboardScreen').classList.remove('active-screen');
    document.getElementById('bottomNav').style.display = 'none';
}

function showDashboard() {
    document.getElementById('homeScreen').classList.remove('active-screen');
    document.getElementById('dashboardScreen').classList.add('active-screen');
    document.getElementById('bottomNav').style.display = 'flex';
    switchTab('home');
}

function switchTab(tab) {
    const screens = ['dashboardScreen', 'newsScreen', 'analyticsScreen', 'profileScreen'];
    screens.forEach(s => document.getElementById(s)?.classList.remove('active-screen'));
    
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(t => t.classList.remove('active'));
    
    if (tab === 'home') {
        document.getElementById('dashboardScreen').classList.add('active-screen');
        document.querySelector('[data-tab="home"]')?.classList.add('active');
        loadTransactions();
    } else if (tab === 'news') {
        document.getElementById('newsScreen').classList.add('active-screen');
        document.querySelector('[data-tab="news"]')?.classList.add('active');
    } else if (tab === 'analytics') {
        document.getElementById('analyticsScreen').classList.add('active-screen');
        document.querySelector('[data-tab="analytics"]')?.classList.add('active');
        updateAnalyticsStats();
    } else if (tab === 'profile') {
        document.getElementById('profileScreen').classList.add('active-screen');
        document.querySelector('[data-tab="profile"]')?.classList.add('active');
    }
}

// ==========================================
// AUTH
// ==========================================
function showAuthModal(type) {
    document.getElementById('authModal').classList.add('active');
    if (type === 'signup') {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('signupForm').style.display = 'block';
    } else {
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('signupForm').style.display = 'none';
    }
}

function closeAuthModal() {
    document.getElementById('authModal').classList.remove('active');
}

function switchAuthForm(type) {
    if (type === 'signup') {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('signupForm').style.display = 'block';
    } else {
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('signupForm').style.display = 'none';
    }
}

async function signup() {
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const refCode = document.getElementById('signupReferralCode').value.trim();
    
    if (!name || !email || !password) {
        showNotification('خطأ', 'الرجاء إدخال جميع البيانات', 'error');
        return;
    }
    
    if (password.length < 6) {
        showNotification('خطأ', 'كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'error');
        return;
    }
    
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const uid = userCredential.user.uid;
        
        const cardData = generateCardData(name);
        
        const userData = {
            name: name,
            email: email,
            referralCode: generateReferralCode(),
            balance: WELCOME_BONUS,
            referralCount: 0,
            referralEarnings: 0,
            joinDate: new Date().toISOString(),
            card: cardData
        };
        
        await database.ref(`users/${uid}`).set(userData);
        
        await addTransaction(uid, {
            type: 'bonus',
            amount: WELCOME_BONUS,
            description: 'مكافأة الانضمام',
            status: 'completed'
        });
        
        // تحديث الإحصائيات
        await updateGlobalStatsFromUsers();
        
        if (refCode) {
            const referrerUid = await validateReferralCode(refCode);
            if (referrerUid && referrerUid !== uid) {
                await processReferral(referrerUid);
                await database.ref(`users/${uid}`).update({ referredBy: refCode });
            }
        }
        
        closeAuthModal();
        showNotification('مرحباً!', `تم إنشاء حسابك بنجاح! حصلت على ${WELCOME_BONUS} DC`, 'success');
    } catch (e) {
        let msg = 'حدث خطأ في التسجيل';
        if (e.code === 'auth/email-already-in-use') msg = 'البريد الإلكتروني مستخدم مسبقاً';
        else if (e.code === 'auth/invalid-email') msg = 'بريد إلكتروني غير صحيح';
        showNotification('خطأ', msg, 'error');
    }
}

async function login() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        showNotification('خطأ', 'أدخل البريد وكلمة المرور', 'error');
        return;
    }
    
    try {
        await auth.signInWithEmailAndPassword(email, password);
        closeAuthModal();
        showNotification('مرحباً بعودتك!', 'تم تسجيل الدخول بنجاح', 'success');
    } catch (e) {
        let msg = 'بيانات خاطئة';
        if (e.code === 'auth/user-not-found') msg = 'المستخدم غير موجود';
        else if (e.code === 'auth/wrong-password') msg = 'كلمة مرور خاطئة';
        showNotification('خطأ', msg, 'error');
    }
}

function logout() {
    if (userDataListener && currentUser) {
        database.ref(`users/${currentUser.uid}`).off('value', userDataListener);
        userDataListener = null;
    }
    if (globalStatsListener) {
        database.ref('global_stats').off('value', globalStatsListener);
        globalStatsListener = null;
    }
    auth.signOut();
    cardFlipped = false;
    showNotification('تم', 'تم تسجيل الخروج', 'success');
}

// ==========================================
// USER DATA
// ==========================================
async function loadUserData() {
    if (!currentUser) return;
    
    if (userDataListener) {
        database.ref(`users/${currentUser.uid}`).off('value', userDataListener);
    }
    
    userDataListener = database.ref(`users/${currentUser.uid}`).on('value', (snap) => {
        const data = snap.val();
        if (!data) return;
        
        updateElement('userName', data.name);
        updateElement('userEmail', data.email);
        updateElement('userReferralCode', data.referralCode);
        
        const balance = parseFloat(data.balance || 0);
        const balanceFormatted = balance.toFixed(2);
        const balanceIQD = (balance * PRICE_PER_COIN).toLocaleString('ar-IQ');
        
        // Dashboard
        updateElement('cardBalance', balanceFormatted + ' DC');
        updateElement('totalBalance', balanceFormatted + ' DC');
        updateElement('balanceIQD', balanceIQD + ' IQD');
        updateElement('cardName', data.name);
        updateElement('referralCode', data.referralCode);
        updateElement('referralCount', data.referralCount || 0);
        updateElement('referralEarnings', parseFloat(data.referralEarnings || 0).toFixed(2) + ' DC');
        
        // Card
        if (data.card) {
            userCardData = data.card;
            updateElement('cardNum', formatCardNumber(data.card.number));
            updateElement('cardNumFull', data.card.number);
            updateElement('cardCVV', data.card.cvv);
            updateElement('cardExpiry', data.card.expiry);
        }
        
        // Profile
        updateElement('profileName', data.name);
        updateElement('profileNameDisplay', data.name);
        updateElement('profileEmailValue', data.email);
        updateElement('profileRefCode', data.referralCode);
        updateElement('profileBalance', balanceFormatted + ' DC');
        updateElement('profileCardNum', formatCardNumber(data.card?.number || '****************'));
        updateElement('profileCVV', '***');
        updateElement('profileExpiry', data.card?.expiry || '--/--');
        
        if (data.joinDate) {
            const date = new Date(data.joinDate);
            updateElement('profileJoinDate', date.toLocaleDateString('ar-IQ', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }));
        }
        
        // Analytics
        updateElement('analyticBalance', balanceFormatted + ' DC');
        updateElement('analyticReferrals', data.referralCount || 0);
        updateElement('analyticEarnings', parseFloat(data.referralEarnings || 0).toFixed(2) + ' DC');
        
        // Avatar
        const firstLetter = data.name.charAt(0).toUpperCase();
        updateElement('userAvatar', firstLetter);
        updateElement('profileAvatar', firstLetter);
        
        // QR Code
        updateElement('receiveCode', data.referralCode);
        generateQRCode(data.referralCode);
    });
}

function updateElement(id, value) {
    const el = document.getElementById(id);
    if (el) {
        if (el.tagName === 'INPUT') el.value = value;
        else el.textContent = value;
    }
}

// ==========================================
// CARD
// ==========================================
function generateCardData(name) {
    return {
        number: generateCardNumber(),
        cvv: generateCVV(),
        expiry: generateExpiry(),
        holder: name
    };
}

function generateCardNumber() {
    let num = '5464';
    for (let i = 0; i < 12; i++) {
        num += Math.floor(Math.random() * 10);
    }
    return num;
}

function generateCVV() {
    return String(Math.floor(100 + Math.random() * 900));
}

function generateExpiry() {
    const month = String(Math.floor(1 + Math.random() * 12)).padStart(2, '0');
    const year = String(new Date().getFullYear() + 5).slice(-2);
    return `${month}/${year}`;
}

function formatCardNumber(num) {
    if (!num) return '**** **** **** ****';
    return num.match(/.{1,4}/g)?.join(' ') || num;
}

function flipCard() {
    cardFlipped = !cardFlipped;
    const flipper = document.getElementById('cardFlipper');
    if (flipper) {
        if (cardFlipped) flipper.classList.add('flipped');
        else flipper.classList.remove('flipped');
    }
}

function toggleCardNumVisibility() {
    cardNumVisible = !cardNumVisible;
    const el = document.getElementById('profileCardNum');
    const icon = document.getElementById('cardNumToggle');
    if (el && userCardData) {
        el.textContent = cardNumVisible ? formatCardNumber(userCardData.number) : formatCardNumber('****************');
        if (icon) icon.className = cardNumVisible ? 'fas fa-eye-slash settings-arrow' : 'fas fa-eye settings-arrow';
    }
}

function toggleCVVVisibility() {
    cvvVisible = !cvvVisible;
    const el = document.getElementById('profileCVV');
    const icon = document.getElementById('cvvToggle');
    if (el && userCardData) {
        el.textContent = cvvVisible ? userCardData.cvv : '***';
        if (icon) icon.className = cvvVisible ? 'fas fa-eye-slash settings-arrow' : 'fas fa-eye settings-arrow';
    }
}

// ==========================================
// QR CODE - إصلاح شامل
// ==========================================
function generateQRCode(text) {
    const container = document.getElementById('qrCode');
    if (!container || !text) return;
    
    // مسح المحتوى القديم
    container.innerHTML = '';
    
    try {
        // استخدام مكتبة QRCode.js
        new QRCode(container, {
            text: text,
            width: 200,
            height: 200,
            colorDark: '#0a1a14',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.H
        });
        
        console.log('QR Code generated successfully:', text);
    } catch (e) {
        console.error('Error generating QR code:', e);
        // Fallback: استخدام API خارجي
        container.innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(text)}" alt="QR Code" style="width:200px;height:200px;">`;
    }
}

// ==========================================
// QR SCANNER - قارئ QR Code
// ==========================================
function showQRScanner() {
    if (!currentUser) {
        showNotification('تنبيه', 'يجب تسجيل الدخول أولاً', 'error');
        return;
    }
    
    document.getElementById('qrScannerModal').classList.add('active');
    startQRScanner();
}

function closeQRScanner() {
    stopQRScanner();
    document.getElementById('qrScannerModal').classList.remove('active');
}

async function startQRScanner() {
    const video = document.getElementById('qrVideo');
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } 
        });
        video.srcObject = stream;
        video.play();
        
        scanQRCode(video);
    } catch (e) {
        console.error('Camera error:', e);
        showNotification('خطأ', 'لا يمكن الوصول للكاميرا', 'error');
    }
}

function stopQRScanner() {
    const video = document.getElementById('qrVideo');
    if (video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
        video.srcObject = null;
    }
    if (qrScanner) {
        clearInterval(qrScanner);
        qrScanner = null;
    }
}

function scanQRCode(video) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    qrScanner = setInterval(() => {
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height);
            
            if (code) {
                handleQRCodeScanned(code.data);
            }
        }
    }, 300);
}

async function handleQRCodeScanned(data) {
    stopQRScanner();
    closeQRScanner();
    
    // التحقق من أن البيانات هي رمز إحالة
    if (data.startsWith('DC') && data.length === 10) {
        document.getElementById('recipientCode').value = data;
        showSendModal();
        showNotification('تم!', 'تم مسح رمز الإحالة بنجاح', 'success');
    } else {
        showNotification('خطأ', 'رمز QR غير صحيح', 'error');
    }
}

// ==========================================
// TRANSACTIONS
// ==========================================
async function loadTransactions() {
    if (!currentUser) return;
    const list = document.getElementById('transactionsList');
    if (!list) return;
    
    try {
        const snap = await database.ref(`transactions/${currentUser.uid}`)
            .orderByChild('timestamp')
            .limitToLast(20)
            .once('value');
        
        const txs = [];
        snap.forEach(c => txs.push({ id: c.key, ...c.val() }));
        txs.sort((a, b) => b.timestamp - a.timestamp);
        
        if (txs.length === 0) {
            list.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><p>لا توجد عمليات بعد</p></div>';
            return;
        }
        
        list.innerHTML = txs.map(tx => {
            const cls = tx.status === 'pending' ? 'pending' : (tx.type === 'send' ? 'negative' : 'positive');
            const iconMap = {
                buy: 'shopping-cart',
                sell: 'hand-holding-usd',
                send: 'paper-plane',
                receive: 'download',
                bonus: 'gift',
                referral: 'users'
            };
            const icon = iconMap[tx.type] || 'exchange-alt';
            const sign = tx.type === 'send' ? '-' : '+';
            const date = new Date(tx.timestamp).toLocaleDateString('ar-IQ', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            return `<div class="transaction-item">
                <div class="transaction-icon ${cls}"><i class="fas fa-${icon}"></i></div>
                <div class="transaction-details">
                    <div class="transaction-type">${tx.description}</div>
                    <div class="transaction-date">${date}</div>
                </div>
                <div class="transaction-amount ${cls}">${sign}${parseFloat(tx.amount).toFixed(2)} DC</div>
            </div>`;
        }).join('');
    } catch (e) {
        console.error('Error loading transactions:', e);
    }
}

async function addTransaction(uid, data) {
    try {
        await database.ref(`transactions/${uid}`).push({
            ...data,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        });
    } catch (e) {
        console.error('Error adding transaction:', e);
    }
}

// ==========================================
// REFERRAL
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
        const snap = await database.ref('users').orderByChild('referralCode').equalTo(code).once('value');
        if (snap.exists()) {
            return Object.keys(snap.val())[0];
        }
    } catch (e) {
        console.error('Error validating referral code:', e);
    }
    
    return null;
}

async function processReferral(referrerUid) {
    try {
        const ref = database.ref(`users/${referrerUid}`);
        const snap = await ref.once('value');
        const data = snap.val();
        if (!data) return;
        
        const newCount = (data.referralCount || 0) + 1;
        
        if (newCount % 10 === 0) {
            const newEarnings = parseFloat(data.referralEarnings || 0) + REFERRAL_BONUS;
            const newBalance = parseFloat(data.balance || 0) + REFERRAL_BONUS;
            
            await ref.update({
                referralCount: newCount,
                referralEarnings: newEarnings,
                balance: newBalance
            });
            
            await addTransaction(referrerUid, {
                type: 'referral',
                amount: REFERRAL_BONUS,
                description: `مكافأة إحالة - ${newCount} إحالة`,
                status: 'completed'
            });
            
            await updateGlobalStatsFromUsers();
        } else {
            await ref.update({ referralCount: newCount });
        }
    } catch (e) {
        console.error('Error processing referral:', e);
    }
}

function copyReferralCode() {
    const code = document.getElementById('referralCode')?.textContent;
    if (code) {
        copyToClipboard(code);
        showNotification('تم النسخ', 'تم نسخ رمز الإحالة', 'success');
    }
}

function copyReceiveCode() {
    const code = document.getElementById('receiveCode')?.textContent;
    if (code) {
        copyToClipboard(code);
        showNotification('تم النسخ', 'تم نسخ الرمز', 'success');
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
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
}

// ==========================================
// BUY/SEND/RECEIVE
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
    document.getElementById('totalIQD').textContent = (amount * PRICE_PER_COIN).toLocaleString('ar-IQ') + ' IQD';
}

async function submitBuyRequest() {
    if (!currentUser) return;
    
    const amount = parseFloat(document.getElementById('buyAmount').value);
    if (!amount || amount <= 0) {
        showNotification('خطأ', 'أدخل كمية صحيحة', 'error');
        return;
    }
    
    try {
        const total = amount * PRICE_PER_COIN;
        await database.ref(`purchase_requests/${currentUser.uid}`).push({
            userId: currentUser.uid,
            amount: amount,
            totalIQD: total,
            status: 'pending',
            timestamp: firebase.database.ServerValue.TIMESTAMP
        });
        
        await addTransaction(currentUser.uid, {
            type: 'buy',
            amount: amount,
            description: `طلب شراء - ${total.toLocaleString('ar-IQ')} IQD`,
            status: 'pending'
        });
        
        closeBuyModal();
        showNotification('تم!', `طلب شراء ${amount} DC أُرسل بنجاح`, 'success');
    } catch (e) {
        showNotification('خطأ', 'فشل الطلب', 'error');
    }
}

function showSendModal() {
    document.getElementById('sendModal').classList.add('active');
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
        showNotification('خطأ', 'أدخل جميع البيانات', 'error');
        return;
    }
    
    try {
        const senderSnap = await database.ref(`users/${currentUser.uid}`).once('value');
        const senderData = senderSnap.val();
        
        if (!senderData || parseFloat(senderData.balance) < amount) {
            showNotification('خطأ', 'رصيد غير كافٍ', 'error');
            return;
        }
        
        const recipientUid = await validateReferralCode(recipientCode);
        if (!recipientUid) {
            showNotification('خطأ', 'رمز غير صحيح', 'error');
            return;
        }
        
        if (recipientUid === currentUser.uid) {
            showNotification('خطأ', 'لا يمكن الإرسال لنفسك', 'error');
            return;
        }
        
        const recipientSnap = await database.ref(`users/${recipientUid}`).once('value');
        const recipientData = recipientSnap.val();
        
        if (!recipientData) {
            showNotification('خطأ', 'مستخدم غير موجود', 'error');
            return;
        }
        
        await database.ref(`users/${currentUser.uid}`).update({
            balance: parseFloat(senderData.balance) - amount
        });
        
        await database.ref(`users/${recipientUid}`).update({
            balance: parseFloat(recipientData.balance || 0) + amount
        });
        
        await addTransaction(currentUser.uid, {
            type: 'send',
            amount: amount,
            description: `إرسال إلى ${recipientData.name} - ${note}`,
            status: 'completed'
        });
        
        await addTransaction(recipientUid, {
            type: 'receive',
            amount: amount,
            description: `استلام من ${senderData.name} - ${note}`,
            status: 'completed'
        });
        
        closeSendModal();
        showNotification('تم!', `أُرسل ${amount} DC إلى ${recipientData.name}`, 'success');
    } catch (e) {
        console.error('Error sending coins:', e);
        showNotification('خطأ', 'فشلت العملية', 'error');
    }
}

// ==========================================
// NEWS
// ==========================================
function renderNewsArticles() {
    const container = document.getElementById('newsArticlesList');
    if (!container) return;
    
    container.innerHTML = newsArticles.map(article => `
        <div class="news-card" data-category="${article.cat}" onclick="openArticle(${article.id})">
            <div class="news-card-img" style="background-image:url('${article.img}')"></div>
            <div class="news-card-content">
                <span class="news-badge ${article.cat}">${getCategoryLabel(article.cat)}</span>
                <h3>${article.title}</h3>
                <p>${article.summary}</p>
                <div class="news-meta">
                    <span><i class="fas fa-calendar"></i> ${formatDate(article.date)}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function getCategoryLabel(cat) {
    const labels = { update: 'تحديث', guide: 'دليل', invest: 'استثمار' };
    return labels[cat] || cat;
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ar-IQ', { year: 'numeric', month: 'long', day: 'numeric' });
}

function filterNews(category) {
    const cards = document.querySelectorAll('.news-card');
    const buttons = document.querySelectorAll('.filter-btn');
    
    buttons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.cat === category) btn.classList.add('active');
    });
    
    cards.forEach(card => {
        if (category === 'all' || card.dataset.category === category) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

function openArticle(id) {
    const article = newsArticles.find(a => a.id === id);
    if (!article) return;
    
    const content = document.getElementById('articleContent');
    content.innerHTML = `
        <div class="article-header-img" style="background-image:url('${article.img}')"></div>
        <div class="article-body">
            <span class="news-badge ${article.cat}">${getCategoryLabel(article.cat)}</span>
            <h2>${article.title}</h2>
            <div class="article-meta">
                <span><i class="fas fa-calendar"></i> ${formatDate(article.date)}</span>
            </div>
            <div class="article-text">${article.body.replace(/\n/g, '<br>')}</div>
        </div>
    `;
    
    document.getElementById('articleModal').classList.add('active');
}

function closeArticleModal() {
    document.getElementById('articleModal').classList.remove('active');
}

// ==========================================
// ANALYTICS
// ==========================================
function updateAnalyticsStats() {
    if (!currentUser) return;
    updateCharts({ totalDistributed: 0, totalRemaining: TOTAL_SUPPLY });
}

// ==========================================
// PROFILE & SETTINGS
// ==========================================
function showEditNameModal() {
    document.getElementById('editNameModal').classList.add('active');
    document.getElementById('editNameInput').value = document.getElementById('userName').textContent;
}

function closeEditNameModal() {
    document.getElementById('editNameModal').classList.remove('active');
}

async function saveNewName() {
    if (!currentUser) return;
    
    const newName = document.getElementById('editNameInput').value.trim();
    if (!newName) {
        showNotification('خطأ', 'أدخل اسماً صحيحاً', 'error');
        return;
    }
    
    try {
        await database.ref(`users/${currentUser.uid}`).update({ name: newName });
        closeEditNameModal();
        showNotification('تم!', 'تم تحديث الاسم بنجاح', 'success');
    } catch (e) {
        showNotification('خطأ', 'فشل التحديث', 'error');
    }
}

function toggleSetting(setting) {
    const toggle = document.getElementById(`toggle-${setting}`);
    if (toggle) {
        toggle.classList.toggle('active');
        const isActive = toggle.classList.contains('active');
        
        // حفظ الإعداد
        if (currentUser) {
            database.ref(`users/${currentUser.uid}/settings`).update({
                [setting]: isActive
            });
        }
        
        showNotification('تم', `تم ${isActive ? 'تفعيل' : 'إلغاء'} الإعداد`, 'success');
    }
}

// صفحات الإعدادات
function showLanguageSettings() {
    showNotification('قريباً', 'خيارات اللغة ستكون متاحة قريباً', 'success');
}

function showSecuritySettings() {
    showNotification('قريباً', 'إعدادات الأمان ستكون متاحة قريباً', 'success');
}

function showHelpSupport() {
    showNotification('الدعم', 'للمساعدة تواصل معنا عبر support@dinarcoin.iq', 'success');
}

// ==========================================
// NOTIFICATIONS
// ==========================================
function showNotification(title, msg, type = 'success') {
    const notification = document.getElementById('successNotification');
    if (!notification) return;
    
    document.getElementById('notificationTitle').textContent = title;
    document.getElementById('notificationMessage').textContent = msg;
    
    notification.className = `toast-notification ${type} active`;
    setTimeout(() => notification.classList.remove('active'), 4000);
}

function closeNotification() {
    document.getElementById('successNotification')?.classList.remove('active');
}

// ==========================================
// UTILS
// ==========================================
window.addEventListener('click', e => {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('active');
        if (e.target.id === 'qrScannerModal') {
            stopQRScanner();
        }
    }
});

document.addEventListener('keypress', e => {
    if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
        e.preventDefault();
    }
});

// تحميل مكتبة jsQR للمسح
const script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js';
document.head.appendChild(script);
