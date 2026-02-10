// ==========================================
// DINAR COIN - Enhanced App JavaScript V3.0
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
let profilePicUrl = null;
let cardNumVisible = false;
let cvvVisible = false;
let chartUpdateInterval = null;
let tickerUpdateInterval = null;

const PRICE_PER_COIN = 1000;
const TOTAL_SUPPLY = 1000000;
const WELCOME_BONUS = 1.0;
const REFERRAL_BONUS = 0.25;
const DAILY_REWARD = 0.01;

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
        body: `في عالم يتجه بسرعة نحو الرقمنة، يبرز دينار كوين كفرصة استثمارية فريدة من نوعها في المنطقة العربية. مع تزايد الاهتمام العالمي بالعملات الرقمية، يقدم دينار كوين بديلاً محلياً يراعي خصوصيات السوق العراقي والعربي.\n\nيتميز دينار كوين بعدة مزايا تجعله خياراً مثالياً للمستثمرين: سعر مستقر مرتبط بالدينار العراقي، منصة آمنة وسهلة الاستخدام، فريق عمل عراقي متخصص، ودعم كامل للغة العربية.`
    },
    {
        id: 1, cat: 'update',
        title: 'إطلاق النسخة التجريبية من دينار كوين',
        summary: 'بداية رحلتنا نحو مستقبل رقمي متطور',
        img: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=300&fit=crop',
        date: '2026-02-05',
        body: `يسعدنا الإعلان عن إطلاق النسخة التجريبية من منصة دينار كوين! هذه النسخة تتضمن جميع الميزات الأساسية التي يحتاجها المستخدمون.\n\nالميزات المتاحة: محفظة رقمية آمنة، إرسال واستقبال العملات، نظام إحالة مع مكافآت، لوحة تحكم شاملة، تصميم عصري يعمل على جميع الأجهزة.`
    },
    {
        id: 2, cat: 'guide',
        title: 'دليل المبتدئين: كيف تبدأ مع دينار كوين',
        summary: 'كل ما تحتاج معرفته للبدء بالاستثمار في دينار كوين',
        img: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=300&fit=crop',
        date: '2026-02-04',
        body: `إذا كنت جديداً في عالم العملات الرقمية، فهذا الدليل مخصص لك!\n\nالخطوة الأولى: إنشاء حساب والحصول على مكافأة ترحيبية.\nالخطوة الثانية: تأمين حسابك بكلمة مرور قوية.\nالخطوة الثالثة: شراء العملات عبر طلب يُراجع من الإدارة.\nالخطوة الرابعة: استخدام رمز الإحالة لكسب المكافآت.`
    },
    {
        id: 3, cat: 'invest',
        title: '5 أسباب تجعل العملات الرقمية العربية مستقبل الاقتصاد',
        summary: 'لماذا العملات الرقمية المحلية أفضل من العالمية؟',
        img: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&h=300&fit=crop',
        date: '2026-02-03',
        body: `العملات الرقمية العربية تتميز بمزايا فريدة:\n\n1. فهم السوق المحلي\n2. الاستقرار مع ربط القيمة بالعملات المحلية\n3. سهولة الاستخدام مع واجهات عربية\n4. التكامل مع البنوك المحلية مستقبلاً\n5. مجتمع عربي نشط يدعم نمو العملة`
    },
    {
        id: 4, cat: 'update',
        title: 'تحديث جديد: نظام البطاقة الرقمية الذكية',
        summary: 'كل مستخدم يحصل على بطاقة رقمية فريدة',
        img: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&h=300&fit=crop',
        date: '2026-02-02',
        body: `نحن متحمسون للإعلان عن إطلاق نظام البطاقة الرقمية الذكية! كل مستخدم جديد سيحصل تلقائياً على بطاقة رقمية فريدة برقم خاص به.\n\nمميزات البطاقة: رقم فريد، رمز CVV، تاريخ انتهاء، تصميم أنيق، إمكانية عرض التفاصيل بقلب البطاقة.`
    },
    {
        id: 5, cat: 'invest',
        title: 'كيف تحقق أرباحاً من نظام الإحالة',
        summary: 'استراتيجيات ذكية لزيادة أرباحك',
        img: 'https://images.unsplash.com/photo-1553729459-afe8f2e2ed65?w=600&h=300&fit=crop',
        date: '2026-02-01',
        body: `نظام الإحالة مصمم لمكافأة المستخدمين النشطين.\n\nشارك على وسائل التواصل الاجتماعي، أنشئ محتوى تعليمي، واستهدف المجتمعات المهتمة.\n\nكل 10 إحالات = 0.25 DC مكافأة مجانية!`
    },
    {
        id: 6, cat: 'guide',
        title: 'أمان حسابك: نصائح ذهبية لحماية عملاتك',
        summary: 'تعلم أفضل ممارسات الأمان',
        img: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=600&h=300&fit=crop',
        date: '2026-01-30',
        body: `حماية حسابك أمر بالغ الأهمية:\n\nاستخدم كلمة مرور قوية لا تقل عن 12 حرفاً، لا تشارك بياناتك، تأكد من عنوان الموقع، لا تنقر على روابط مشبوهة.\n\nتذكر: فريق دينار كوين لن يطلب منك كلمة المرور!`
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
    generateMarketChart();
    generateAnalyticsChart();
    startTickerUpdates();
});

function initializeApp() {
    auth.onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            loadUserData();
            showDashboard();
            updateAnalyticsStats();
            checkDailyReward();
        } else {
            currentUser = null;
            showHome();
        }
    });
}

function createParticles() {
    const c = document.getElementById('particles');
    if (!c) return;
    for (let i = 0; i < 25; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.left = Math.random() * 100 + '%';
        const s = Math.random() * 3 + 1.5;
        p.style.width = s + 'px';
        p.style.height = s + 'px';
        p.style.animationDelay = Math.random() * 20 + 's';
        p.style.animationDuration = (15 + Math.random() * 15) + 's';
        c.appendChild(p);
    }
}

function setupEventListeners() {
    document.getElementById('buyAmount')?.addEventListener('input', calculateBuyTotal);
}

// ==========================================
// MARKET CHART (Candlestick Blocks)
// ==========================================
let chartData = [];

function generateChartData(count = 24) {
    const data = [];
    let price = 980 + Math.random() * 40;
    for (let i = 0; i < count; i++) {
        const change = (Math.random() - 0.45) * 20;
        price = Math.max(950, Math.min(1050, price + change));
        const volume = 5 + Math.random() * 25;
        data.push({
            price: Math.round(price),
            up: change >= 0,
            volume: volume
        });
    }
    return data;
}

function generateMarketChart() {
    chartData = generateChartData(24);
    renderCandlestickChart(chartData);
    
    // Update every 8 seconds
    if (chartUpdateInterval) clearInterval(chartUpdateInterval);
    chartUpdateInterval = setInterval(() => {
        const lastPrice = chartData[chartData.length - 1].price;
        const change = (Math.random() - 0.45) * 15;
        const newPrice = Math.max(950, Math.min(1050, lastPrice + change));
        chartData.push({
            price: Math.round(newPrice),
            up: change >= 0,
            volume: 5 + Math.random() * 25
        });
        if (chartData.length > 24) chartData.shift();
        renderCandlestickChart(chartData);
        updateTickerData(chartData);
    }, 8000);
}

function renderCandlestickChart(data) {
    const container = document.getElementById('candlestickChart');
    const volumeContainer = document.getElementById('volumeBars');
    if (!container) return;
    
    const maxPrice = Math.max(...data.map(d => d.price));
    const minPrice = Math.min(...data.map(d => d.price));
    const range = maxPrice - minPrice || 1;
    const maxVol = Math.max(...data.map(d => d.volume));
    
    container.innerHTML = data.map(d => {
        const height = ((d.price - minPrice) / range) * 100;
        return `<div class="candle-bar ${d.up ? 'up' : 'down'}" style="height:${Math.max(5, height)}%" data-price="${d.price} IQD"></div>`;
    }).join('');
    
    if (volumeContainer) {
        volumeContainer.innerHTML = data.map(d => {
            const height = (d.volume / maxVol) * 100;
            return `<div class="volume-bar" style="height:${Math.max(5, height)}%"></div>`;
        }).join('');
    }
    
    // Update price display
    const latest = data[data.length - 1];
    const prev = data[data.length - 2] || latest;
    const changePercent = ((latest.price - prev.price) / prev.price * 100).toFixed(1);
    const isUp = latest.price >= prev.price;
    
    updateElement('chartCurrentPrice', latest.price.toLocaleString() + ' IQD');
    const changeEl = document.getElementById('chartPriceChange');
    if (changeEl) {
        changeEl.textContent = `${isUp ? '+' : ''}${changePercent}% ${isUp ? '↑' : '↓'}`;
        changeEl.className = `chart-price-change ${isUp ? 'positive' : 'negative'}`;
    }
}

function changeChartPeriod(period) {
    const btns = document.querySelectorAll('.market-chart-section .period-btn');
    btns.forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    
    const counts = { '1h': 12, '1d': 24, '1w': 28, '1m': 30 };
    chartData = generateChartData(counts[period] || 24);
    renderCandlestickChart(chartData);
}

// ==========================================
// ANALYTICS CHART
// ==========================================
function generateAnalyticsChart() {
    const container = document.getElementById('analyticsFullChart');
    if (!container) return;
    
    const data = generateChartData(40);
    const maxPrice = Math.max(...data.map(d => d.price));
    const minPrice = Math.min(...data.map(d => d.price));
    const range = maxPrice - minPrice || 1;
    
    container.innerHTML = data.map(d => {
        const height = ((d.price - minPrice) / range) * 100;
        return `<div class="analytics-bar ${d.up ? 'up' : 'down'}" style="height:${Math.max(5, height)}%"></div>`;
    }).join('');
}

function changeAnalyticsChart(period) {
    const btns = document.querySelectorAll('.analytics-chart-section .period-btn');
    btns.forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    generateAnalyticsChart();
}

// ==========================================
// LIVE TICKER
// ==========================================
function startTickerUpdates() {
    updateTickerData(chartData.length ? chartData : generateChartData(24));
    
    if (tickerUpdateInterval) clearInterval(tickerUpdateInterval);
    tickerUpdateInterval = setInterval(() => {
        if (chartData.length) updateTickerData(chartData);
    }, 10000);
}

function updateTickerData(data) {
    if (!data.length) return;
    const latest = data[data.length - 1];
    const first = data[0];
    const changePercent = ((latest.price - first.price) / first.price * 100).toFixed(1);
    const isUp = latest.price >= first.price;
    
    updateElement('tickerPrice', latest.price.toLocaleString());
    const changeEl = document.getElementById('tickerChange');
    if (changeEl) {
        changeEl.innerHTML = `<i class="fas fa-caret-${isUp ? 'up' : 'down'}"></i> ${isUp ? '+' : ''}${changePercent}%`;
        changeEl.className = `ticker-change ${isUp ? 'positive' : 'negative'}`;
    }
    
    const totalVol = data.reduce((s, d) => s + d.volume, 0);
    updateElement('tickerVolume', totalVol.toFixed(1) + 'K');
    updateElement('tickerMarketCap', (latest.price * TOTAL_SUPPLY / 1000000000).toFixed(1) + 'B IQD');
}

// ==========================================
// LIVE COUNTERS
// ==========================================
function updateCounters(totalUsers, totalDistributed, txCount) {
    const supplyPercent = ((totalDistributed / TOTAL_SUPPLY) * 100).toFixed(1);
    const usersTarget = 10000;
    const usersPercent = Math.min(100, (totalUsers / usersTarget) * 100).toFixed(0);
    const txTarget = 1000;
    const txPercent = Math.min(100, (txCount / txTarget) * 100).toFixed(0);
    
    // Update rings
    const supplyRing = document.getElementById('supplyRing');
    const usersRing = document.getElementById('usersRing');
    const txRing = document.getElementById('txRing');
    
    if (supplyRing) supplyRing.setAttribute('stroke-dasharray', `${supplyPercent}, 100`);
    if (usersRing) usersRing.setAttribute('stroke-dasharray', `${usersPercent}, 100`);
    if (txRing) txRing.setAttribute('stroke-dasharray', `${txPercent}, 100`);
    
    updateElement('supplyPercent', supplyPercent + '%');
    updateElement('usersPercent', totalUsers);
    updateElement('txCount', txCount || 0);
}

// ==========================================
// CURRENCY CONVERTER
// ==========================================
function convertCurrency(from) {
    const dcInput = document.getElementById('convertDC');
    const iqdInput = document.getElementById('convertIQD');
    if (!dcInput || !iqdInput) return;
    
    if (from === 'dc') {
        const dc = parseFloat(dcInput.value) || 0;
        iqdInput.value = dc ? (dc * PRICE_PER_COIN).toLocaleString('en') : '';
    } else {
        const iqd = parseFloat(iqdInput.value.replace(/,/g, '')) || 0;
        dcInput.value = iqd ? (iqd / PRICE_PER_COIN).toFixed(2) : '';
    }
}

// ==========================================
// DAILY REWARD
// ==========================================
function checkDailyReward() {
    if (!currentUser) return;
    const lastClaim = localStorage.getItem(`dailyReward_${currentUser.uid}`);
    const today = new Date().toDateString();
    const card = document.getElementById('dailyRewardCard');
    const status = document.getElementById('rewardStatus');
    
    if (lastClaim === today) {
        if (card) card.classList.add('claimed');
        if (status) status.textContent = 'تم الحصول على مكافأة اليوم ✓';
    } else {
        if (card) card.classList.remove('claimed');
        if (status) status.textContent = 'اضغط للحصول على مكافأتك اليومية';
    }
}

async function claimDailyReward() {
    if (!currentUser) return;
    const lastClaim = localStorage.getItem(`dailyReward_${currentUser.uid}`);
    const today = new Date().toDateString();
    
    if (lastClaim === today) {
        showNotification('تنبيه', 'لقد حصلت على مكافأة اليوم بالفعل', 'error');
        return;
    }
    
    try {
        const snap = await database.ref(`users/${currentUser.uid}`).once('value');
        const data = snap.val();
        if (!data) return;
        
        const newBalance = parseFloat(data.balance || 0) + DAILY_REWARD;
        const dailyTotal = parseFloat(data.dailyRewards || 0) + DAILY_REWARD;
        
        await database.ref(`users/${currentUser.uid}`).update({
            balance: newBalance,
            dailyRewards: dailyTotal
        });
        
        await addTransaction(currentUser.uid, {
            type: 'bonus',
            amount: DAILY_REWARD,
            description: 'مكافأة يومية',
            status: 'completed'
        });
        
        await updateGlobalStats(0, DAILY_REWARD);
        
        localStorage.setItem(`dailyReward_${currentUser.uid}`, today);
        checkDailyReward();
        showNotification('مبروك! 🎁', `حصلت على ${DAILY_REWARD} DC كمكافأة يومية`, 'success');
    } catch (e) {
        showNotification('خطأ', 'فشل الحصول على المكافأة', 'error');
    }
}

// ==========================================
// GLOBAL STATISTICS
// ==========================================
let globalStatsListener = null;

function loadGlobalStats() {
    database.ref('global_stats').once('value').then(snap => {
        if (!snap.exists()) {
            database.ref('global_stats').set({
                totalUsers: 0, totalDistributed: 0, totalRemaining: TOTAL_SUPPLY, totalTransactions: 0
            });
        }
    });

    globalStatsListener = database.ref('global_stats').on('value', (snap) => {
        const data = snap.val() || { totalUsers: 0, totalDistributed: 0, totalRemaining: TOTAL_SUPPLY, totalTransactions: 0 };
        
        updateElement('homeUsersCount', data.totalUsers.toLocaleString('ar-IQ'));
        updateElement('homeCoinsRemaining', data.totalRemaining.toLocaleString('ar-IQ'));
        updateElement('dashUsersCount', data.totalUsers.toLocaleString('ar-IQ'));
        updateElement('dashCoinsRemaining', data.totalRemaining.toLocaleString('ar-IQ'));
        updateElement('statTotalUsers', data.totalUsers.toLocaleString('ar-IQ'));
        updateElement('statCirculating', data.totalDistributed.toLocaleString('ar-IQ'));
        updateElement('statRemaining', data.totalRemaining.toLocaleString('ar-IQ'));
        updateElement('statTotalSupply', TOTAL_SUPPLY.toLocaleString('ar-IQ'));
        
        const distributionPercent = ((data.totalDistributed / TOTAL_SUPPLY) * 100).toFixed(2);
        updateElement('distributionPercent', distributionPercent + '%');
        
        updateCounters(data.totalUsers, data.totalDistributed, data.totalTransactions || 0);
    });
}

async function updateGlobalStats(userCountDelta, coinsDelta) {
    try {
        const ref = database.ref('global_stats');
        const snap = await ref.once('value');
        const current = snap.val() || { totalUsers: 0, totalDistributed: 0, totalRemaining: TOTAL_SUPPLY, totalTransactions: 0 };
        
        await ref.update({
            totalUsers: Math.max(0, current.totalUsers + userCountDelta),
            totalDistributed: Math.max(0, current.totalDistributed + coinsDelta),
            totalRemaining: Math.max(0, TOTAL_SUPPLY - (current.totalDistributed + coinsDelta)),
            totalTransactions: (current.totalTransactions || 0) + 1
        });
    } catch (e) {
        console.error('Error updating global stats:', e);
    }
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
    screens.forEach(s => document.getElementById(s).classList.remove('active-screen'));
    
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(t => t.classList.remove('active'));
    
    if (tab === 'home') {
        document.getElementById('dashboardScreen').classList.add('active-screen');
        document.querySelector('[data-tab="home"]').classList.add('active');
        loadTransactions();
    } else if (tab === 'news') {
        document.getElementById('newsScreen').classList.add('active-screen');
        document.querySelector('[data-tab="news"]').classList.add('active');
    } else if (tab === 'analytics') {
        document.getElementById('analyticsScreen').classList.add('active-screen');
        document.querySelector('[data-tab="analytics"]').classList.add('active');
        updateAnalyticsStats();
        generateAnalyticsChart();
    } else if (tab === 'profile') {
        document.getElementById('profileScreen').classList.add('active-screen');
        document.querySelector('[data-tab="profile"]').classList.add('active');
    }
}

// ==========================================
// AUTH
// ==========================================
function showAuthModal(type) {
    document.getElementById('authModal').classList.add('active');
    switchAuthForm(type);
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
            name, email,
            referralCode: generateReferralCode(),
            balance: WELCOME_BONUS,
            referralCount: 0, referralEarnings: 0, dailyRewards: 0,
            joinDate: new Date().toISOString(),
            card: cardData, phone: '', level: 'beginner', xp: 10
        };
        
        await database.ref(`users/${uid}`).set(userData);
        await addTransaction(uid, { type: 'bonus', amount: WELCOME_BONUS, description: 'مكافأة الانضمام', status: 'completed' });
        await updateGlobalStats(1, WELCOME_BONUS);
        
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
    auth.signOut();
    if (userDataListener) {
        database.ref(`users/${currentUser.uid}`).off('value', userDataListener);
        userDataListener = null;
    }
    if (globalStatsListener) {
        database.ref('global_stats').off('value', globalStatsListener);
        globalStatsListener = null;
    }
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
        
        const balance = parseFloat(data.balance || 0).toFixed(2);
        const balanceIQD = (parseFloat(balance) * PRICE_PER_COIN).toLocaleString('ar-IQ');
        
        updateElement('cardBalance', balance + ' DC');
        updateElement('totalBalance', balance + ' DC');
        updateElement('totalValueIQD', balanceIQD + ' IQD');
        updateElement('cardName', data.name);
        updateElement('referralCode', data.referralCode);
        updateElement('referralCount', data.referralCount || 0);
        updateElement('referralEarnings', parseFloat(data.referralEarnings || 0).toFixed(2) + ' DC');
        
        // Referral progress
        const refCount = data.referralCount || 0;
        const refProgress = (refCount % 10) / 10 * 100;
        const progressFill = document.getElementById('referralProgressFill');
        const progressText = document.getElementById('referralProgressText');
        if (progressFill) progressFill.style.width = refProgress + '%';
        if (progressText) progressText.textContent = `${refCount % 10}/10 إحالة`;

        // Card
        if (data.card) {
            userCardData = data.card;
            updateElement('cardNum', formatCardNumber(data.card.number));
            updateElement('cardNumFront', formatCardNumber(data.card.number));
            updateElement('cardCVV', data.card.cvv);
            updateElement('cardExpiry', data.card.expiry);
        }
        
        // Profile
        updateElement('profileName', data.name);
        updateElement('profileNameDisplay', data.name);
        updateElement('profileEmailValue', data.email);
        updateElement('profileRefCode', data.referralCode);
        updateElement('profileBalance', balance + ' DC');
        updateElement('profilePhone', data.phone || 'غير محدد');
        updateElement('profileCardNum', formatCardNumber(data.card?.number || '****************'));
        updateElement('profileCVV', '***');
        updateElement('profileExpiry', data.card?.expiry || '--/--');
        
        // Level
        const xp = data.xp || 10;
        const level = getLevel(xp);
        updateElement('profileLevel', `مستوى: ${level.name} ${level.star}`);
        const levelFill = document.getElementById('levelProgressFill');
        const levelXPEl = document.getElementById('levelXP');
        if (levelFill) levelFill.style.width = level.progress + '%';
        if (levelXPEl) levelXPEl.textContent = `${xp}/${level.nextXP} XP`;
        
        if (data.joinDate) {
            const date = new Date(data.joinDate);
            updateElement('profileJoinDate', date.toLocaleDateString('ar-IQ', { year:'numeric', month:'long', day:'numeric' }));
        }
        
        // Analytics
        updateElement('analyticBalance', balance + ' DC');
        updateElement('analyticValueIQD', balanceIQD + ' IQD');
        updateElement('analyticReferrals', data.referralCount || 0);
        updateElement('analyticEarnings', parseFloat(data.referralEarnings || 0).toFixed(2) + ' DC');
        updateElement('analyticDailyRewards', parseFloat(data.dailyRewards || 0).toFixed(2) + ' DC');
        
        // Avatar
        const firstLetter = data.name.charAt(0).toUpperCase();
        updateElement('userAvatar', firstLetter);
        updateElement('profileAvatar', firstLetter);
        
        updateElement('receiveCode', data.referralCode);
        generateQRCode(data.referralCode);
    });
}

function getLevel(xp) {
    if (xp >= 500) return { name: 'ذهبي', star: '🌟', progress: 100, nextXP: 500 };
    if (xp >= 200) return { name: 'فضي', star: '⭐⭐', progress: ((xp - 200) / 300) * 100, nextXP: 500 };
    if (xp >= 100) return { name: 'برونزي', star: '⭐', progress: ((xp - 100) / 100) * 100, nextXP: 200 };
    return { name: 'مبتدئ', star: '✨', progress: (xp / 100) * 100, nextXP: 100 };
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
    return { number: generateCardNumber(), cvv: generateCVV(), expiry: generateExpiry(), holder: name };
}
function generateCardNumber() {
    let num = '5464';
    for (let i = 0; i < 12; i++) num += Math.floor(Math.random() * 10);
    return num;
}
function generateCVV() { return String(Math.floor(100 + Math.random() * 900)); }
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
    if (flipper) flipper.classList.toggle('flipped', cardFlipped);
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
// QR CODE
// ==========================================
let qrCodeInstance = null;
function generateQRCode(text) {
    const container = document.getElementById('qrCode');
    if (!container || !text) return;
    container.innerHTML = '';
    try {
        qrCodeInstance = new QRCode(container, { text, width:200, height:200, colorDark:'#0a1a14', colorLight:'#ffffff', correctLevel:QRCode.CorrectLevel.H });
    } catch (e) {
        container.innerHTML = '<p style="text-align:center;padding:20px;">خطأ في إنشاء رمز QR</p>';
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
        const snap = await database.ref(`transactions/${currentUser.uid}`).orderByChild('timestamp').limitToLast(20).once('value');
        const txs = [];
        snap.forEach(c => txs.push({ id: c.key, ...c.val() }));
        txs.sort((a, b) => b.timestamp - a.timestamp);
        
        if (txs.length === 0) {
            list.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><p>لا توجد عمليات بعد</p></div>';
            return;
        }
        
        list.innerHTML = txs.slice(0, 10).map(tx => {
            const cls = tx.status === 'pending' ? 'pending' : (tx.type === 'send' ? 'negative' : 'positive');
            const iconMap = { buy:'shopping-cart', sell:'hand-holding-usd', send:'paper-plane', receive:'download', bonus:'gift', referral:'users' };
            const icon = iconMap[tx.type] || 'exchange-alt';
            const sign = tx.type === 'send' ? '-' : '+';
            const date = new Date(tx.timestamp).toLocaleDateString('ar-IQ', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });
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

function showAllTransactions() {
    showNotification('قريباً', 'سيتم إضافة صفحة المعاملات الكاملة', 'success');
}

async function addTransaction(uid, data) {
    try {
        await database.ref(`transactions/${uid}`).push({ ...data, timestamp: firebase.database.ServerValue.TIMESTAMP });
    } catch (e) { console.error('Error adding transaction:', e); }
}

// ==========================================
// REFERRAL
// ==========================================
function generateReferralCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'DC';
    for (let i = 0; i < 8; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    return code;
}

async function validateReferralCode(code) {
    if (!code || code.length !== 10) return null;
    try {
        const snap = await database.ref('users').orderByChild('referralCode').equalTo(code).once('value');
        if (snap.exists()) return Object.keys(snap.val())[0];
    } catch (e) { console.error('Error validating referral code:', e); }
    return null;
}

async function processReferral(referrerUid) {
    try {
        const ref = database.ref(`users/${referrerUid}`);
        const snap = await ref.once('value');
        const data = snap.val();
        if (!data) return;
        
        const newCount = (data.referralCount || 0) + 1;
        const newXP = (data.xp || 10) + 5;
        
        if (newCount % 10 === 0) {
            const newEarnings = parseFloat(data.referralEarnings || 0) + REFERRAL_BONUS;
            const newBalance = parseFloat(data.balance || 0) + REFERRAL_BONUS;
            await ref.update({ referralCount: newCount, referralEarnings: newEarnings, balance: newBalance, xp: newXP });
            await addTransaction(referrerUid, { type: 'referral', amount: REFERRAL_BONUS, description: `مكافأة إحالة - ${newCount} إحالة`, status: 'completed' });
            await updateGlobalStats(0, REFERRAL_BONUS);
        } else {
            await ref.update({ referralCount: newCount, xp: newXP });
        }
    } catch (e) { console.error('Error processing referral:', e); }
}

function copyReferralCode() {
    const code = document.getElementById('referralCode')?.textContent;
    if (code) { copyToClipboard(code); showNotification('تم النسخ', 'تم نسخ رمز الإحالة', 'success'); }
}
function copyReceiveCode() {
    const code = document.getElementById('receiveCode')?.textContent;
    if (code) { copyToClipboard(code); showNotification('تم النسخ', 'تم نسخ الرمز', 'success'); }
}
function copyToClipboard(text) {
    if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
    else fallbackCopy(text);
}
function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select(); document.execCommand('copy');
    document.body.removeChild(ta);
}

function showReferralShareModal() {
    const code = document.getElementById('referralCode')?.textContent || '';
    const shareText = `انضم إلى دينار كوين - العملة الرقمية العراقية الأولى! استخدم رمز الإحالة: ${code} واحصل على مكافأة ترحيبية 🎁`;
    
    if (navigator.share) {
        navigator.share({ title: 'دينار كوين', text: shareText }).catch(() => {});
    } else {
        copyToClipboard(shareText);
        showNotification('تم النسخ', 'تم نسخ رابط المشاركة', 'success');
    }
}

// ==========================================
// BUY/SEND/RECEIVE MODALS
// ==========================================
function showBuyModal() { document.getElementById('buyModal').classList.add('active'); document.getElementById('buyAmount').value = ''; document.getElementById('totalIQD').textContent = '0 IQD'; }
function closeBuyModal() { document.getElementById('buyModal').classList.remove('active'); }
function calculateBuyTotal() {
    const amount = parseFloat(document.getElementById('buyAmount').value) || 0;
    document.getElementById('totalIQD').textContent = (amount * PRICE_PER_COIN).toLocaleString('ar-IQ') + ' IQD';
}
function setQuickBuyAmount(val) {
    document.getElementById('buyAmount').value = val;
    calculateBuyTotal();
}

async function submitBuyRequest() {
    if (!currentUser) return;
    const amount = parseFloat(document.getElementById('buyAmount').value);
    if (!amount || amount <= 0) { showNotification('خطأ', 'أدخل كمية صحيحة', 'error'); return; }
    try {
        const total = amount * PRICE_PER_COIN;
        await database.ref(`purchase_requests/${currentUser.uid}`).push({
            userId: currentUser.uid, amount, totalIQD: total, status: 'pending', timestamp: firebase.database.ServerValue.TIMESTAMP
        });
        await addTransaction(currentUser.uid, { type: 'buy', amount, description: `طلب شراء - ${total.toLocaleString('ar-IQ')} IQD`, status: 'pending' });
        closeBuyModal();
        showNotification('تم!', `طلب شراء ${amount} DC أُرسل بنجاح`, 'success');
    } catch (e) { showNotification('خطأ', 'فشل الطلب', 'error'); }
}

function showSendModal() { document.getElementById('sendModal').classList.add('active'); document.getElementById('recipientCode').value = ''; document.getElementById('sendAmount').value = ''; document.getElementById('sendNote').value = ''; }
function closeSendModal() { document.getElementById('sendModal').classList.remove('active'); }

function showReceiveModal() {
    if (!currentUser) { showAuthModal('login'); return; }
    document.getElementById('receiveModal').classList.add('active');
    const code = document.getElementById('receiveCode')?.textContent || '';
    generateQRCode(code);
}
function closeReceiveModal() { document.getElementById('receiveModal').classList.remove('active'); }

async function sendCoins() {
    if (!currentUser) return;
    const recipientCode = document.getElementById('recipientCode').value.trim();
    const amount = parseFloat(document.getElementById('sendAmount').value);
    const note = document.getElementById('sendNote').value.trim() || 'تحويل';
    
    if (!recipientCode || !amount || amount <= 0) { showNotification('خطأ', 'أدخل جميع البيانات', 'error'); return; }
    
    try {
        const senderSnap = await database.ref(`users/${currentUser.uid}`).once('value');
        const senderData = senderSnap.val();
        if (!senderData || parseFloat(senderData.balance) < amount) { showNotification('خطأ', 'رصيد غير كافٍ', 'error'); return; }
        
        const recipientUid = await validateReferralCode(recipientCode);
        if (!recipientUid) { showNotification('خطأ', 'رمز غير صحيح', 'error'); return; }
        if (recipientUid === currentUser.uid) { showNotification('خطأ', 'لا يمكن الإرسال لنفسك', 'error'); return; }
        
        const recipientSnap = await database.ref(`users/${recipientUid}`).once('value');
        const recipientData = recipientSnap.val();
        if (!recipientData) { showNotification('خطأ', 'مستخدم غير موجود', 'error'); return; }
        
        // Update XP
        const newXP = (senderData.xp || 10) + 2;
        
        await database.ref(`users/${currentUser.uid}`).update({ balance: parseFloat(senderData.balance) - amount, xp: newXP });
        await database.ref(`users/${recipientUid}`).update({ balance: parseFloat(recipientData.balance || 0) + amount });
        
        await addTransaction(currentUser.uid, { type: 'send', amount, description: `إرسال إلى ${recipientData.name} - ${note}`, status: 'completed' });
        await addTransaction(recipientUid, { type: 'receive', amount, description: `استلام من ${senderData.name} - ${note}`, status: 'completed' });
        
        closeSendModal();
        showNotification('تم!', `أُرسل ${amount} DC إلى ${recipientData.name}`, 'success');
    } catch (e) { showNotification('خطأ', 'فشلت العملية', 'error'); }
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
                <div class="news-meta"><span><i class="fas fa-calendar"></i> ${formatDate(article.date)}</span></div>
            </div>
        </div>
    `).join('');
}

function getCategoryLabel(cat) { return { update:'تحديث', guide:'دليل', invest:'استثمار' }[cat] || cat; }
function formatDate(dateStr) { return new Date(dateStr).toLocaleDateString('ar-IQ', { year:'numeric', month:'long', day:'numeric' }); }

function filterNews(category) {
    const cards = document.querySelectorAll('.news-card');
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => { btn.classList.remove('active'); if (btn.dataset.cat === category) btn.classList.add('active'); });
    cards.forEach(card => { card.style.display = (category === 'all' || card.dataset.category === category) ? 'block' : 'none'; });
}

function openArticle(id) {
    const article = newsArticles.find(a => a.id === id);
    if (!article) return;
    document.getElementById('articleContent').innerHTML = `
        <div class="article-header-img" style="background-image:url('${article.img}')"></div>
        <div class="article-body">
            <span class="news-badge ${article.cat}">${getCategoryLabel(article.cat)}</span>
            <h2>${article.title}</h2>
            <div class="article-meta"><span><i class="fas fa-calendar"></i> ${formatDate(article.date)}</span></div>
            <div class="article-text">${article.body.replace(/\n/g, '<br>')}</div>
        </div>
    `;
    document.getElementById('articleModal').classList.add('active');
}
function closeArticleModal() { document.getElementById('articleModal').classList.remove('active'); }

// ==========================================
// ANALYTICS
// ==========================================
function updateAnalyticsStats() { if (!currentUser) return; }

// ==========================================
// PROFILE & SETTINGS
// ==========================================
function showEditNameModal() { document.getElementById('editNameModal').classList.add('active'); document.getElementById('editNameInput').value = document.getElementById('userName').textContent; }
function closeEditNameModal() { document.getElementById('editNameModal').classList.remove('active'); }

async function saveNewName() {
    if (!currentUser) return;
    const newName = document.getElementById('editNameInput').value.trim();
    if (!newName) { showNotification('خطأ', 'أدخل اسماً صحيحاً', 'error'); return; }
    try {
        await database.ref(`users/${currentUser.uid}`).update({ name: newName });
        closeEditNameModal();
        showNotification('تم!', 'تم تحديث الاسم بنجاح', 'success');
    } catch (e) { showNotification('خطأ', 'فشل التحديث', 'error'); }
}

function showEditPhoneModal() {
    const html = `<div class="modal-overlay active"><div class="modal-sheet modal-small">
        <div class="modal-handle"></div>
        <button class="modal-close-btn" onclick="this.closest('.modal-overlay').remove()"><i class="fas fa-times"></i></button>
        <div class="modal-icon-header"><div class="modal-icon-circle receive"><i class="fas fa-phone"></i></div><h2>تعديل رقم الهاتف</h2></div>
        <div class="form-field"><label>رقم الهاتف</label><div class="input-wrapper"><i class="fas fa-phone"></i><input type="tel" id="editPhoneInput" placeholder="+964 XXX XXX XXXX"></div></div>
        <button class="btn-submit" onclick="savePhone()">حفظ</button>
    </div></div>`;
    document.body.insertAdjacentHTML('beforeend', html);
}

async function savePhone() {
    if (!currentUser) return;
    const phone = document.getElementById('editPhoneInput')?.value.trim();
    if (!phone) { showNotification('خطأ', 'أدخل رقماً صحيحاً', 'error'); return; }
    try {
        await database.ref(`users/${currentUser.uid}`).update({ phone });
        document.querySelector('.modal-overlay:last-child')?.remove();
        showNotification('تم!', 'تم تحديث رقم الهاتف', 'success');
    } catch (e) { showNotification('خطأ', 'فشل التحديث', 'error'); }
}

function toggleSetting(setting) {
    const toggle = document.getElementById(`toggle-${setting}`);
    if (toggle) {
        const isActive = toggle.classList.toggle('active');
        localStorage.setItem(`setting-${setting}`, isActive ? 'true' : 'false');
        if (setting === 'darkmode') applyDarkMode(isActive);
        else if (setting === 'notifications') applyNotifications(isActive);
        showNotification('تم', `تم ${isActive ? 'تفعيل' : 'إلغاء'} ${getSettingName(setting)}`, 'success');
    }
}

function getSettingName(setting) {
    return { darkmode:'الوضع الليلي', notifications:'الإشعارات', biometric:'تسجيل بالبصمة', sounds:'الأصوات', autosave:'الحفظ التلقائي', priceAlerts:'تنبيهات الأسعار' }[setting] || setting;
}

function applyDarkMode(isActive) { document.body.classList.toggle('dark-mode', isActive); }
function applyNotifications(isActive) {
    if (isActive && 'Notification' in window) Notification.requestPermission();
}

function loadSettings() {
    const settings = ['darkmode', 'notifications', 'biometric', 'sounds', 'autosave', 'priceAlerts'];
    settings.forEach(s => {
        const val = localStorage.getItem(`setting-${s}`);
        if (val === 'true') {
            document.getElementById(`toggle-${s}`)?.classList.add('active');
            if (s === 'darkmode') applyDarkMode(true);
        } else if (val === 'false') {
            document.getElementById(`toggle-${s}`)?.classList.remove('active');
        }
    });
}
setTimeout(loadSettings, 100);

// ==========================================
// MODAL FUNCTIONS (Settings)
// ==========================================
function showLanguageModal() {
    const languages = [{ code:'ar', name:'العربية', flag:'🇮🇶' }, { code:'en', name:'English', flag:'🇺🇸' }, { code:'ku', name:'کوردی', flag:'🇮🇶' }];
    const currentLang = localStorage.getItem('app-language') || 'ar';
    let html = `<div class="modal-overlay active"><div class="modal-sheet modal-small"><div class="modal-handle"></div><button class="modal-close-btn" onclick="this.closest('.modal-overlay').remove()"><i class="fas fa-times"></i></button><div class="modal-icon-header"><div class="modal-icon-circle receive"><i class="fas fa-language"></i></div><h2>اختر اللغة</h2></div><div class="settings-card" style="margin-top:20px;">`;
    languages.forEach(lang => {
        const active = lang.code === currentLang ? 'style="background:rgba(212,175,55,0.1);"' : '';
        html += `<div class="settings-item" onclick="changeLanguage('${lang.code}')" ${active}><div class="settings-item-icon">${lang.flag}</div><div class="settings-item-content"><span class="settings-item-label">${lang.name}</span></div>${lang.code === currentLang ? '<i class="fas fa-check" style="color:var(--gold-primary);"></i>' : ''}</div>`;
    });
    html += `</div></div></div>`;
    document.body.insertAdjacentHTML('beforeend', html);
}

function changeLanguage(langCode) {
    localStorage.setItem('app-language', langCode);
    const langNames = { ar:'العربية', en:'English', ku:'کوردی' };
    updateElement('currentLangDisplay', langNames[langCode]);
    showNotification('تم', 'سيتم تطبيق اللغة في التحديث القادم', 'success');
    document.querySelector('.modal-overlay:last-child')?.remove();
}

function showCurrencyModal() {
    const currencies = [{ code:'IQD', name:'دينار عراقي', symbol:'د.ع' }, { code:'USD', name:'دولار أمريكي', symbol:'$' }, { code:'EUR', name:'يورو', symbol:'€' }];
    const current = localStorage.getItem('app-currency') || 'IQD';
    let html = `<div class="modal-overlay active"><div class="modal-sheet modal-small"><div class="modal-handle"></div><button class="modal-close-btn" onclick="this.closest('.modal-overlay').remove()"><i class="fas fa-times"></i></button><div class="modal-icon-header"><div class="modal-icon-circle send"><i class="fas fa-money-bill-wave"></i></div><h2>العملة الافتراضية</h2></div><div class="settings-card" style="margin-top:20px;">`;
    currencies.forEach(c => {
        const active = c.code === current ? 'style="background:rgba(212,175,55,0.1);"' : '';
        html += `<div class="settings-item" onclick="changeCurrency('${c.code}')" ${active}><div class="settings-item-icon" style="font-size:1.2rem;">${c.symbol}</div><div class="settings-item-content"><span class="settings-item-label">${c.name}</span><span class="settings-item-value">${c.code}</span></div>${c.code === current ? '<i class="fas fa-check" style="color:var(--gold-primary);"></i>' : ''}</div>`;
    });
    html += `</div></div></div>`;
    document.body.insertAdjacentHTML('beforeend', html);
}

function changeCurrency(code) {
    localStorage.setItem('app-currency', code);
    const names = { IQD:'IQD - دينار عراقي', USD:'USD - دولار أمريكي', EUR:'EUR - يورو' };
    updateElement('currentCurrencyDisplay', names[code]);
    showNotification('تم', 'تم تغيير العملة الافتراضية', 'success');
    document.querySelector('.modal-overlay:last-child')?.remove();
}

function showThemeModal() {
    const themes = [{ id:'classic', name:'أخضر كلاسيكي', color:'#1a5f4a' }, { id:'dark', name:'أسود داكن', color:'#1a1a1a' }, { id:'ocean', name:'أزرق محيطي', color:'#1a3a5f' }];
    const current = localStorage.getItem('app-theme') || 'classic';
    let html = `<div class="modal-overlay active"><div class="modal-sheet modal-small"><div class="modal-handle"></div><button class="modal-close-btn" onclick="this.closest('.modal-overlay').remove()"><i class="fas fa-times"></i></button><div class="modal-icon-header"><div class="modal-icon-circle receive"><i class="fas fa-palette"></i></div><h2>المظهر</h2></div><div class="settings-card" style="margin-top:20px;">`;
    themes.forEach(t => {
        const active = t.id === current ? 'style="background:rgba(212,175,55,0.1);"' : '';
        html += `<div class="settings-item" onclick="changeTheme('${t.id}')" ${active}><div class="settings-item-icon" style="background:${t.color};width:36px;height:36px;border-radius:50%;"></div><div class="settings-item-content"><span class="settings-item-label">${t.name}</span></div>${t.id === current ? '<i class="fas fa-check" style="color:var(--gold-primary);"></i>' : ''}</div>`;
    });
    html += `</div></div></div>`;
    document.body.insertAdjacentHTML('beforeend', html);
}

function changeTheme(themeId) {
    localStorage.setItem('app-theme', themeId);
    const names = { classic:'أخضر كلاسيكي', dark:'أسود داكن', ocean:'أزرق محيطي' };
    updateElement('currentThemeDisplay', names[themeId]);
    showNotification('تم', 'تم تغيير المظهر', 'success');
    document.querySelector('.modal-overlay:last-child')?.remove();
}

function showChangePasswordModal() {
    const html = `<div class="modal-overlay active"><div class="modal-sheet modal-small"><div class="modal-handle"></div><button class="modal-close-btn" onclick="this.closest('.modal-overlay').remove()"><i class="fas fa-times"></i></button>
        <div class="modal-icon-header"><div class="modal-icon-circle send"><i class="fas fa-lock"></i></div><h2>تغيير كلمة المرور</h2></div>
        <div class="form-field"><label>كلمة المرور الجديدة</label><div class="input-wrapper"><i class="fas fa-lock"></i><input type="password" id="newPasswordInput" placeholder="6 أحرف على الأقل"></div></div>
        <div class="form-field"><label>تأكيد كلمة المرور</label><div class="input-wrapper"><i class="fas fa-lock"></i><input type="password" id="confirmPasswordInput" placeholder="أعد كتابة كلمة المرور"></div></div>
        <button class="btn-submit" onclick="changePassword()">تغيير</button></div></div>`;
    document.body.insertAdjacentHTML('beforeend', html);
}

async function changePassword() {
    const newPass = document.getElementById('newPasswordInput')?.value;
    const confirmPass = document.getElementById('confirmPasswordInput')?.value;
    if (!newPass || newPass.length < 6) { showNotification('خطأ', 'كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'error'); return; }
    if (newPass !== confirmPass) { showNotification('خطأ', 'كلمات المرور غير متطابقة', 'error'); return; }
    try {
        await currentUser.updatePassword(newPass);
        document.querySelector('.modal-overlay:last-child')?.remove();
        showNotification('تم!', 'تم تغيير كلمة المرور بنجاح', 'success');
    } catch (e) { showNotification('خطأ', 'فشل تغيير كلمة المرور. أعد تسجيل الدخول وحاول مرة أخرى', 'error'); }
}

function showForgotPasswordModal() {
    const html = `<div class="modal-overlay active"><div class="modal-sheet modal-small"><div class="modal-handle"></div><button class="modal-close-btn" onclick="this.closest('.modal-overlay').remove()"><i class="fas fa-times"></i></button>
        <div class="modal-icon-header"><div class="modal-icon-circle receive"><i class="fas fa-envelope-open"></i></div><h2>استعادة كلمة المرور</h2></div>
        <div class="form-field"><label>البريد الإلكتروني</label><div class="input-wrapper"><i class="fas fa-envelope"></i><input type="email" id="resetEmailInput" placeholder="example@email.com"></div></div>
        <button class="btn-submit" onclick="sendPasswordReset()">إرسال رابط الاستعادة</button></div></div>`;
    document.body.insertAdjacentHTML('beforeend', html);
}

async function sendPasswordReset() {
    const email = document.getElementById('resetEmailInput')?.value.trim();
    if (!email) { showNotification('خطأ', 'أدخل بريدك الإلكتروني', 'error'); return; }
    try {
        await auth.sendPasswordResetEmail(email);
        document.querySelector('.modal-overlay:last-child')?.remove();
        showNotification('تم!', 'تم إرسال رابط الاستعادة إلى بريدك', 'success');
    } catch (e) { showNotification('خطأ', 'البريد الإلكتروني غير مسجل', 'error'); }
}

function showSecurityModal() {
    const html = `<div class="modal-overlay active"><div class="modal-sheet"><div class="modal-handle"></div><button class="modal-close-btn" onclick="this.closest('.modal-overlay').remove()"><i class="fas fa-times"></i></button>
        <div class="modal-icon-header"><div class="modal-icon-circle receive"><i class="fas fa-shield-alt"></i></div><h2>الأمان والخصوصية</h2></div>
        <div style="padding:20px;">
            <h3 style="color:var(--gold-primary);margin-bottom:15px;">نصائح الأمان</h3>
            <div style="background:rgba(255,255,255,0.05);padding:15px;border-radius:12px;margin-bottom:15px;"><p style="line-height:1.8;">🔐 استخدم كلمة مرور قوية<br>🔒 لا تشارك بياناتك مع أحد<br>📱 فعّل المصادقة الثنائية<br>🛡️ تحقق من عنوان الموقع<br>⚠️ احذر من الروابط المشبوهة</p></div>
            <h3 style="color:var(--gold-primary);margin-bottom:15px;">سياسة الخصوصية</h3>
            <div style="background:rgba(255,255,255,0.05);padding:15px;border-radius:12px;"><p style="line-height:1.8;">نحن نحترم خصوصيتك ونحمي بياناتك الشخصية. جميع المعلومات مشفرة ومخزنة بشكل آمن.</p></div>
        </div></div></div>`;
    document.body.insertAdjacentHTML('beforeend', html);
}

function showHelpModal() {
    const html = `<div class="modal-overlay active"><div class="modal-sheet"><div class="modal-handle"></div><button class="modal-close-btn" onclick="this.closest('.modal-overlay').remove()"><i class="fas fa-times"></i></button>
        <div class="modal-icon-header"><div class="modal-icon-circle receive"><i class="fas fa-question-circle"></i></div><h2>المساعدة والدعم</h2></div>
        <div style="padding:20px;">
            <h3 style="color:var(--gold-primary);margin-bottom:15px;">الأسئلة الشائعة</h3>
            <div style="margin-bottom:20px;"><h4 style="color:#fff;margin-bottom:8px;">❓ كيف أشتري دينار كوين؟</h4><p style="color:rgba(255,255,255,0.7);line-height:1.6;">انقر على زر "شراء" وأدخل الكمية. سيتم مراجعة طلبك من الإدارة.</p></div>
            <div style="margin-bottom:20px;"><h4 style="color:#fff;margin-bottom:8px;">❓ كيف أحصل على مكافأة الإحالة؟</h4><p style="color:rgba(255,255,255,0.7);line-height:1.6;">شارك رمز الإحالة الخاص بك. ستحصل على 0.25 DC عن كل 10 إحالات.</p></div>
            <div style="margin-bottom:20px;"><h4 style="color:#fff;margin-bottom:8px;">❓ ما هي المكافأة اليومية؟</h4><p style="color:rgba(255,255,255,0.7);line-height:1.6;">يمكنك الحصول على 0.01 DC كل يوم بمجرد الضغط على بطاقة المكافأة اليومية.</p></div>
            <h3 style="color:var(--gold-primary);margin:20px 0 15px;">تواصل معنا</h3>
            <div style="background:rgba(255,255,255,0.05);padding:15px;border-radius:12px;"><p style="line-height:1.8;">📧 البريد: support@dinarcoin.iq<br>📱 الهاتف: +964 XXX XXX XXXX<br>💬 الدردشة: متاحة قريباً</p></div>
        </div></div></div>`;
    document.body.insertAdjacentHTML('beforeend', html);
}

function showAboutModal() {
    const html = `<div class="modal-overlay active"><div class="modal-sheet modal-small"><div class="modal-handle"></div><button class="modal-close-btn" onclick="this.closest('.modal-overlay').remove()"><i class="fas fa-times"></i></button>
        <div class="modal-icon-header"><div class="modal-icon-circle buy"><i class="fas fa-info-circle"></i></div><h2>عن التطبيق</h2></div>
        <div style="padding:20px;text-align:center;">
            <img src="logo.png" alt="DC" style="width:80px;height:80px;border-radius:50%;margin-bottom:16px;">
            <h3 style="color:var(--text-white);margin-bottom:8px;">دينار كوين</h3>
            <p style="color:var(--gold-primary);margin-bottom:16px;">النسخة 3.0.0 BETA</p>
            <div style="background:rgba(255,255,255,0.05);padding:15px;border-radius:12px;text-align:right;">
                <p style="color:var(--text-light);line-height:1.8;">دينار كوين هو مشروع عملة رقمية عراقية مبتكر يهدف إلى تسهيل التعاملات المالية الرقمية في العراق والمنطقة العربية.</p>
            </div>
            <p style="color:var(--text-muted);margin-top:16px;font-size:0.8rem;">© 2026 Digital Creativity Company<br>صنع بـ ❤️ في العراق 🇮🇶</p>
        </div></div></div>`;
    document.body.insertAdjacentHTML('beforeend', html);
}

function clearAppCache() {
    if (confirm('هل تريد مسح الكاش؟')) {
        if ('caches' in window) {
            caches.keys().then(names => names.forEach(name => caches.delete(name)));
        }
        showNotification('تم', 'تم مسح الكاش بنجاح', 'success');
    }
}

async function exportUserData() {
    if (!currentUser) return;
    try {
        const snap = await database.ref(`users/${currentUser.uid}`).once('value');
        const data = snap.val();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `dinar-coin-data-${Date.now()}.json`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showNotification('تم', 'تم تصدير بياناتك بنجاح', 'success');
    } catch (e) { showNotification('خطأ', 'فشل تصدير البيانات', 'error'); }
}

function confirmDeleteAccount() {
    if (confirm('⚠️ هل أنت متأكد من حذف حسابك؟ هذا الإجراء لا يمكن التراجع عنه!')) {
        if (confirm('تأكيد أخير: سيتم حذف جميع بياناتك ورصيدك نهائياً. متابعة؟')) {
            deleteAccount();
        }
    }
}

async function deleteAccount() {
    if (!currentUser) return;
    try {
        await database.ref(`users/${currentUser.uid}`).remove();
        await database.ref(`transactions/${currentUser.uid}`).remove();
        await currentUser.delete();
        showNotification('تم', 'تم حذف حسابك بنجاح', 'success');
    } catch (e) { showNotification('خطأ', 'فشل حذف الحساب. أعد تسجيل الدخول وحاول مرة أخرى', 'error'); }
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
function closeNotification() { document.getElementById('successNotification')?.classList.remove('active'); }

// ==========================================
// UTILS
// ==========================================
window.addEventListener('click', e => {
    if (e.target.classList.contains('modal-overlay')) e.target.classList.remove('active');
});
document.addEventListener('keypress', e => {
    if (e.key === 'Enter' && e.target.tagName === 'INPUT') e.preventDefault();
});
