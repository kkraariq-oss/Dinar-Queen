// ==========================================
// DINAR COIN - Full App JavaScript V3 UPDATED
// Updated with QR fix, referral fix, enhanced analytics, and smooth scrolling
// ==========================================

// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/Dinar-Queen/sw.js').catch(() => {});
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

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();

// Global Variables
let currentUser = null;
let userDataListener = null;
let userCardData = null;
let cardFlipped = false;
let profilePicUrl = null;
let cardNumVisible = false;
let cvvVisible = false;
let qrCodeGenerated = false;

// Constants
const PRICE_PER_COIN = 1000;
const WELCOME_BONUS = 1.0;
const REFERRAL_BONUS = 0.25;

// ==========================================
// PARTICLE SYSTEM - Enhanced
// ==========================================
function createParticles() {
    const container = document.getElementById('particles');
    if (!container) return;
    
    setInterval(() => {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.width = (Math.random() * 4 + 2) + 'px';
        particle.style.height = particle.style.width;
        particle.style.animationDuration = (Math.random() * 3 + 4) + 's';
        particle.style.opacity = Math.random() * 0.5 + 0.3;
        container.appendChild(particle);
        setTimeout(() => particle.remove(), 8000);
    }, 400);
}

createParticles();

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
        body: `في عالم يتجه بسرعة نحو الرقمنة، يبرز دينار كوين كفرصة استثمارية فريدة من نوعها في المنطقة العربية. مع تزايد الاهتمام العالمي بالعملات الرقمية، يقدم دينار كوين بديلاً محلياً يراعي خصوصيات السوق العراقي والعربي.

يتميز دينار كوين بعدة مزايا تجعله خياراً مثالياً للمستثمرين: سعر مستقر مرتبط بالدينار العراقي، منصة آمنة وسهلة الاستخدام، فريق عمل عراقي متخصص، ودعم كامل للغة العربية.

مع خطط التوسع المستقبلية التي تشمل إضافة محفظة متعددة العملات وتكامل مع بوابات الدفع المحلية، يُتوقع أن يشهد دينار كوين نمواً كبيراً في الفترة القادمة. انضم الآن وكن جزءاً من هذه الثورة الرقمية العراقية!`
    },
    {
        id: 1, cat: 'update',
        title: 'إطلاق النسخة التجريبية BETA من منصة دينار كوين',
        summary: 'المنصة الآن متاحة للجميع مع ميزات جديدة ومبتكرة',
        img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=300&fit=crop',
        date: '2026-02-05',
        body: `يسعدنا الإعلان عن إطلاق النسخة التجريبية من منصة دينار كوين! هذه النسخة تتضمن جميع الميزات الأساسية التي يحتاجها المستخدمون.

الميزات المتاحة في النسخة التجريبية:
• محفظة رقمية آمنة لحفظ عملات دينار كوين
• إمكانية إرسال واستقبال العملات بسهولة
• نظام إحالة مع مكافآت فورية
• لوحة تحكم شاملة مع إحصائيات حية
• تصميم عصري يعمل على جميع الأجهزة

ندعو جميع المهتمين للتسجيل والبدء باستخدام المنصة ومشاركة ملاحظاتهم لتحسين التجربة.`
    },
    {
        id: 2, cat: 'guide',
        title: 'دليل المبتدئين: كيف تبدأ مع دينار كوين خطوة بخطوة',
        summary: 'كل ما تحتاج معرفته للبدء بالاستثمار في دينار كوين',
        img: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=300&fit=crop',
        date: '2026-02-04',
        body: `إذا كنت جديداً في عالم العملات الرقمية، فهذا الدليل مخصص لك! سنشرح لك كل خطوة بالتفصيل.

الخطوة الأولى - إنشاء الحساب: قم بالتسجيل باستخدام بريدك الإلكتروني وكلمة مرور قوية. ستحصل فوراً على مكافأة ترحيبية!

الخطوة الثانية - تأمين حسابك: تأكد من استخدام كلمة مرور فريدة ولا تشاركها مع أحد.

الخطوة الثالثة - شراء العملات: يمكنك تقديم طلب شراء وسيتم مراجعته من قبل فريق الإدارة.

الخطوة الرابعة - إرسال واستقبال: استخدم رمز الإحالة الخاص بك لاستقبال العملات، أو أدخل رمز شخص آخر لإرسال العملات إليه.

الخطوة الخامسة - دعوة الأصدقاء: شارك رمز الإحالة واحصل على مكافآت مجانية!`
    },
    {
        id: 3, cat: 'invest',
        title: '5 أسباب تجعل العملات الرقمية العربية مستقبل الاقتصاد',
        summary: 'لماذا العملات الرقمية المحلية أفضل من العملات العالمية؟',
        img: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&h=300&fit=crop',
        date: '2026-02-03',
        body: `العملات الرقمية العربية تتميز بعدة مزايا فريدة تجعلها خياراً استراتيجياً للمستثمرين في المنطقة:

1. فهم السوق المحلي: العملات المحلية مصممة لتلبية احتياجات المجتمع العربي.

2. الاستقرار: ربط القيمة بالعملات المحلية يقلل من التقلبات الحادة.

3. سهولة الاستخدام: واجهات عربية بالكامل مع دعم فني محلي.

4. التكامل المحلي: إمكانية الربط مع البنوك وبوابات الدفع المحلية مستقبلاً.

5. المجتمع: مجتمع عربي نشط يدعم نمو العملة.`
    },
    {
        id: 4, cat: 'update',
        title: 'تحديث جديد: نظام البطاقة الرقمية الذكية',
        summary: 'كل مستخدم يحصل الآن على بطاقة رقمية فريدة',
        img: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&h=300&fit=crop',
        date: '2026-02-02',
        body: `نحن متحمسون للإعلان عن إطلاق نظام البطاقة الرقمية الذكية! كل مستخدم جديد سيحصل تلقائياً على بطاقة رقمية فريدة برقم عشوائي خاص به.

مميزات البطاقة الرقمية:
• رقم بطاقة فريد لكل مستخدم
• رمز CVV للأمان
• تاريخ انتهاء
• تصميم أنيق بألوان دينار كوين
• إمكانية عرض تفاصيل البطاقة بقلبها

هذه البطاقة هي خطوة نحو تقديم تجربة مصرفية رقمية كاملة في المستقبل القريب.`
    },
    {
        id: 5, cat: 'invest',
        title: 'كيف تحقق أرباحاً من نظام الإحالة في دينار كوين',
        summary: 'استراتيجيات ذكية لزيادة أرباحك من دعوة الأصدقاء',
        img: 'https://images.unsplash.com/photo-1553729459-afe8f2e2ed65?w=600&h=300&fit=crop',
        date: '2026-02-01',
        body: `نظام الإحالة في دينار كوين مصمم لمكافأة المستخدمين النشطين. إليك بعض الاستراتيجيات لتعظيم أرباحك:

شارك على وسائل التواصل الاجتماعي: انشر رمز الإحالة الخاص بك على فيسبوك وإنستغرام وتويتر مع شرح مبسط عن دينار كوين.

أنشئ محتوى تعليمي: اصنع فيديوهات قصيرة تشرح فيها كيفية استخدام المنصة.

استهدف المجتمعات المهتمة: انضم لمجموعات الاستثمار والتكنولوجيا.

كل 10 إحالات ناجحة = 0.25 DC مكافأة مجانية! كلما زاد عدد إحالاتك، زادت مكافآتك.`
    },
    {
        id: 6, cat: 'guide',
        title: 'أمان حسابك: نصائح ذهبية لحماية عملاتك الرقمية',
        summary: 'تعلم أفضل ممارسات الأمان لحماية استثماراتك',
        img: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=600&h=300&fit=crop',
        date: '2026-01-30',
        body: `حماية حسابك وعملاتك الرقمية أمر بالغ الأهمية. إليك أهم النصائح:

• استخدم كلمة مرور قوية وفريدة لا تقل عن 12 حرفاً
• لا تشارك بيانات تسجيل الدخول مع أي شخص
• تأكد من عنوان الموقع قبل تسجيل الدخول
• لا تنقر على روابط مشبوهة تدعي أنها من دينار كوين
• قم بتحديث متصفحك باستمرار
• فعّل تسجيل الدخول بالبصمة عند توفره

تذكر: فريق دينار كوين لن يطلب منك أبداً كلمة المرور الخاصة بك!`
    }
];

// ==========================================
// AUTHENTICATION
// ==========================================
auth.onAuthStateChanged(user => {
    currentUser = user;
    if (user) {
        loadUserData();
        showDashboard();
    } else {
        showHome();
    }
});

function showAuthModal(form) {
    document.getElementById('authModal').classList.add('active');
    switchAuthForm(form);
}

function closeAuthModal() {
    document.getElementById('authModal').classList.remove('active');
}

function switchAuthForm(form) {
    const login = document.getElementById('loginForm');
    const signup = document.getElementById('signupForm');
    if (form === 'login') {
        login.style.display = 'block';
        signup.style.display = 'none';
    } else {
        login.style.display = 'none';
        signup.style.display = 'block';
    }
}

async function login() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    if (!email || !password) {
        showNotification('خطأ', 'أدخل جميع البيانات', 'error');
        return;
    }
    try {
        await auth.signInWithEmailAndPassword(email, password);
        closeAuthModal();
        showNotification('مرحباً!', 'تم تسجيل الدخول بنجاح', 'success');
    } catch (e) {
        let msg = 'فشل تسجيل الدخول';
        if (e.code === 'auth/user-not-found') msg = 'البريد غير مسجل';
        else if (e.code === 'auth/wrong-password') msg = 'كلمة المرور خاطئة';
        showNotification('خطأ', msg, 'error');
    }
}

async function signup() {
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const refCode = document.getElementById('signupReferralCode').value.trim();
    
    if (!name || !email || !password) {
        showNotification('خطأ', 'أدخل جميع البيانات', 'error');
        return;
    }
    if (password.length < 6) {
        showNotification('خطأ', 'كلمة المرور قصيرة جداً', 'error');
        return;
    }
    
    try {
        const cred = await auth.createUserWithEmailAndPassword(email, password);
        const uid = cred.user.uid;
        const myRefCode = generateReferralCode();
        const cardData = generateCardData();
        
        const userData = {
            name: name,
            email: email,
            balance: WELCOME_BONUS,
            referralCode: myRefCode,
            referralCount: 0,
            referralEarnings: 0,
            joinedAt: firebase.database.ServerValue.TIMESTAMP,
            cardNumber: cardData.number,
            cardExpiry: cardData.expiry,
            cardCVV: cardData.cvv
        };
        
        await database.ref(`users/${uid}`).set(userData);
        await addTransaction(uid, {
            type: 'bonus',
            amount: WELCOME_BONUS,
            description: 'مكافأة الترحيب',
            status: 'completed'
        });
        
        // Process referral if provided
        if (refCode) {
            const referrerUid = await validateReferralCode(refCode);
            if (referrerUid && referrerUid !== uid) {
                await database.ref(`users/${uid}`).update({ referredBy: referrerUid });
                await processReferral(referrerUid);
            }
        }
        
        closeAuthModal();
        showNotification('مرحباً!', `حصلت على ${WELCOME_BONUS} DC مكافأة!`, 'success');
    } catch (e) {
        let msg = 'فشل التسجيل';
        if (e.code === 'auth/email-already-in-use') msg = 'البريد مستخدم بالفعل';
        else if (e.code === 'auth/invalid-email') msg = 'بريد إلكتروني غير صالح';
        showNotification('خطأ', msg, 'error');
    }
}

function logout() {
    auth.signOut();
    if (userDataListener) {
        userDataListener.off();
        userDataListener = null;
    }
    currentUser = null;
    userCardData = null;
    qrCodeGenerated = false;
    showHome();
    showNotification('وداعاً', 'تم تسجيل الخروج', 'success');
}

// ==========================================
// CARD DATA GENERATION
// ==========================================
function generateCardData() {
    const number = Array.from({length: 16}, () => Math.floor(Math.random() * 10)).join('');
    const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
    const year = String(new Date().getFullYear() + Math.floor(Math.random() * 5) + 2).slice(-2);
    const cvv = String(Math.floor(Math.random() * 900) + 100);
    return {
        number: number,
        expiry: `${month}/${year}`,
        cvv: cvv
    };
}

// ==========================================
// USER DATA
// ==========================================
async function loadUserData() {
    if (!currentUser) return;
    
    if (userDataListener) {
        userDataListener.off();
    }
    
    const ref = database.ref(`users/${currentUser.uid}`);
    userDataListener = ref;
    
    ref.on('value', snap => {
        const data = snap.val();
        if (!data) return;
        
        userCardData = {
            number: data.cardNumber || '****************',
            expiry: data.cardExpiry || '12/30',
            cvv: data.cardCVV || '***'
        };
        
        updateDashboardUI(data);
        updateProfileUI(data);
    });
    
    loadTransactions();
}

function updateDashboardUI(data) {
    setText('userName', data.name || 'المستخدم');
    setText('userEmail', data.email || '');
    setText('userBalance', parseFloat(data.balance || 0).toFixed(2));
    setText('referralCode', data.referralCode || 'DC00000000');
    setText('referralCount', data.referralCount || 0);
    setText('referralEarnings', parseFloat(data.referralEarnings || 0).toFixed(2));
    
    const cardNum = userCardData.number;
    setText('cardNumber', `${cardNum.slice(0,4)} ${cardNum.slice(4,8)} ${cardNum.slice(8,12)} ${cardNum.slice(12,16)}`);
    setText('cardNameHolder', data.name || 'HOLDER NAME');
    setText('cardExpiryVal', userCardData.expiry);
    setText('cardCVV', userCardData.cvv);
    
    const avatar = document.getElementById('userAvatar');
    if (avatar) {
        avatar.textContent = (data.name || 'A').charAt(0).toUpperCase();
    }
}

function updateProfileUI(data) {
    const profileAvatar = document.querySelector('.profile-avatar-circle');
    if (profileAvatar) {
        profileAvatar.textContent = (data.name || 'A').charAt(0).toUpperCase();
    }
    setText('profileNameText', data.name || 'المستخدم');
    setText('profileEmailText', data.email || '');
    setText('profileNameValue', data.name || 'المستخدم');
    setText('profileEmailValue', data.email || '');
    setText('profileRefCode', data.referralCode || 'DC00000000');
    setText('profileBalance', parseFloat(data.balance || 0).toFixed(2) + ' DC');
    
    if (data.joinedAt) {
        const date = new Date(data.joinedAt);
        setText('profileJoinDate', date.toLocaleDateString('ar-IQ', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }));
    }
    
    setText('profileCardNum', formatCardNumber(userCardData.number, cardNumVisible));
    setText('profileCVV', cardNumVisible ? userCardData.cvv : '***');
    setText('profileExpiry', userCardData.expiry);
}

function formatCardNumber(num, visible) {
    if (!visible) {
        return '**** **** **** ' + num.slice(-4);
    }
    return `${num.slice(0,4)} ${num.slice(4,8)} ${num.slice(8,12)} ${num.slice(12,16)}`;
}

function toggleCardNumVisibility() {
    cardNumVisible = !cardNumVisible;
    const icon = document.getElementById('cardNumToggle');
    if (icon) {
        icon.className = cardNumVisible ? 'fas fa-eye-slash settings-arrow' : 'fas fa-eye settings-arrow';
    }
    if (userCardData) {
        setText('profileCardNum', formatCardNumber(userCardData.number, cardNumVisible));
    }
}

function toggleCVVVisibility() {
    cvvVisible = !cvvVisible;
    const icon = document.getElementById('cvvToggle');
    if (icon) {
        icon.className = cvvVisible ? 'fas fa-eye-slash settings-arrow' : 'fas fa-eye settings-arrow';
    }
    if (userCardData) {
        setText('profileCVV', cvvVisible ? userCardData.cvv : '***');
    }
}

function setText(id, txt) {
    const el = document.getElementById(id);
    if (el) el.textContent = txt;
}

// ==========================================
// SCREEN NAVIGATION
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
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    const tabBtn = document.querySelector(`[data-tab="${tab}"]`);
    if (tabBtn) tabBtn.classList.add('active');
    
    const screens = ['homeContent', 'newsContent', 'analyticsContent', 'profileContent'];
    screens.forEach(s => {
        const el = document.getElementById(s);
        if (el) el.style.display = 'none';
    });
    
    const activeContent = document.getElementById(tab + 'Content');
    if (activeContent) {
        activeContent.style.display = 'block';
        // Smooth scroll to top
        const scrollContainer = activeContent.closest('.dash-scroll-content');
        if (scrollContainer) {
            scrollContainer.scrollTo({top: 0, behavior: 'smooth'});
        }
    }
    
    if (tab === 'analytics') {
        updateAnalyticsCharts();
        updateAnalyticsStats();
    }
    
    if (tab === 'news') {
        loadNews();
    }
}

// ==========================================
// CREDIT CARD FLIP
// ==========================================
function flipCard() {
    cardFlipped = !cardFlipped;
    const flipper = document.getElementById('cardFlipper');
    if (flipper) {
        if (cardFlipped) {
            flipper.classList.add('flipped');
        } else {
            flipper.classList.remove('flipped');
        }
    }
}

// ==========================================
// NEWS
// ==========================================
function loadNews() {
    const container = document.getElementById('newsContainer');
    if (!container) return;
    
    container.innerHTML = newsArticles.map(article => {
        return `
            <div class="news-card" onclick="showArticle(${article.id})">
                <img src="${article.img}" alt="${article.title}" class="news-img">
                <div class="news-content">
                    <div class="news-meta">
                        <span class="news-cat">${article.cat === 'invest' ? 'استثمار' : article.cat === 'update' ? 'تحديث' : 'دليل'}</span>
                        <span class="news-date">${article.date}</span>
                    </div>
                    <h3 class="news-title">${article.title}</h3>
                    <p class="news-summary">${article.summary}</p>
                </div>
            </div>
        `;
    }).join('');
}

function showArticle(id) {
    const article = newsArticles.find(a => a.id === id);
    if (!article) return;
    
    const content = document.getElementById('articleContent');
    if (!content) return;
    
    content.innerHTML = `
        <img src="${article.img}" alt="${article.title}">
        <h2>${article.title}</h2>
        <div class="article-meta">
            <span>${article.cat === 'invest' ? 'استثمار' : article.cat === 'update' ? 'تحديث' : 'دليل'}</span>
            <span>•</span>
            <span>${article.date}</span>
        </div>
        <div class="article-body">${article.body}</div>
    `;
    
    document.getElementById('articleModal').classList.add('active');
}

function closeArticleModal() {
    document.getElementById('articleModal').classList.remove('active');
}

// ==========================================
// ANALYTICS - ENHANCED WITH REALISTIC DATA
// ==========================================
function generatePriceData() {
    const data = [];
    let base = 1000;
    for (let i = 0; i < 24; i++) {
        base += (Math.random() - 0.48) * 15;
        base = Math.max(980, Math.min(1020, base));
        data.push(base);
    }
    return data;
}

function generateVolumeData() {
    return Array.from({length: 12}, () => Math.floor(Math.random() * 8000) + 2000);
}

function updateAnalyticsCharts() {
    drawLineChart('priceChart', generatePriceData(), '#d4af37', '#1a5f4a');
    drawBarChart('volumeChart', generateVolumeData(), '#2a8f6a');
}

function drawLineChart(canvasId, data, lineColor, fillColor) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const rect = canvas.parentElement.getBoundingClientRect();
    
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    ctx.scale(2, 2);
    
    const w = rect.width;
    const h = rect.height;
    const pad = {top: 10, right: 10, bottom: 24, left: 10};
    const cw = w - pad.left - pad.right;
    const ch = h - pad.top - pad.bottom;
    
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    
    ctx.clearRect(0, 0, w, h);
    
    // Fill area
    const stepX = cw / (data.length - 1);
    ctx.beginPath();
    ctx.moveTo(pad.left, pad.top + ch);
    
    data.forEach((val, i) => {
        const x = pad.left + stepX * i;
        const y = pad.top + ch - ((val - min) / range) * ch;
        if (i === 0) ctx.lineTo(x, y);
        else ctx.lineTo(x, y);
    });
    
    ctx.lineTo(pad.left + cw, pad.top + ch);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + ch);
    grad.addColorStop(0, fillColor + '40');
    grad.addColorStop(1, fillColor + '00');
    ctx.fillStyle = grad;
    ctx.fill();
    
    // Line
    ctx.beginPath();
    ctx.moveTo(pad.left, pad.top + ch - ((data[0] - min) / range) * ch);
    
    data.forEach((val, i) => {
        const x = pad.left + stepX * i;
        const y = pad.top + ch - ((val - min) / range) * ch;
        ctx.lineTo(x, y);
    });
    
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // End dot
    const lastX = pad.left + stepX * (data.length - 1);
    const lastY = pad.top + ch - ((data[data.length - 1] - min) / range) * ch;
    
    ctx.beginPath();
    ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
    ctx.fillStyle = lineColor;
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(lastX, lastY, 7, 0, Math.PI * 2);
    ctx.strokeStyle = lineColor + '40';
    ctx.lineWidth = 2;
    ctx.stroke();
}

function drawBarChart(canvasId, data, barColor) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const rect = canvas.parentElement.getBoundingClientRect();
    
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    ctx.scale(2, 2);
    
    const w = rect.width;
    const h = rect.height;
    const pad = {top: 10, right: 10, bottom: 24, left: 10};
    const cw = w - pad.left - pad.right;
    const ch = h - pad.top - pad.bottom;
    
    const max = Math.max(...data) * 1.15;
    const barWidth = (cw / data.length) * 0.6;
    const gap = (cw / data.length) * 0.4;
    
    ctx.clearRect(0, 0, w, h);
    
    const months = ['ي','ف','م','أ','م','ي','ي','أ','س','أ','ن','د'];
    
    data.forEach((val, i) => {
        const barH = (val / max) * ch;
        const x = pad.left + (cw / data.length) * i + gap / 2;
        const y = pad.top + ch - barH;
        
        const grad = ctx.createLinearGradient(x, y, x, y + barH);
        grad.addColorStop(0, barColor);
        grad.addColorStop(1, barColor + '40');
        ctx.fillStyle = grad;
        
        const r = 3;
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + barWidth - r, y);
        ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + r);
        ctx.lineTo(x + barWidth, y + barH);
        ctx.lineTo(x, y + barH);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.fill();
        
        // Month label
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.font = '8px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(months[i] || '', x + barWidth / 2, h - 6);
    });
}

function setTimeframe(tf, btn) {
    document.querySelectorAll('.tf-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    drawLineChart('priceChart', generatePriceData(), '#d4af37', '#1a5f4a');
}

async function updateAnalyticsStats() {
    try {
        const snap = await database.ref('users').once('value');
        const count = snap.numChildren();
        let totalBalance = 0;
        let totalReferrals = 0;
        
        snap.forEach(child => {
            const data = child.val();
            totalBalance += parseFloat(data.balance || 0);
            totalReferrals += (data.referralCount || 0);
        });
        
        setText('analyticsUsers', count.toLocaleString('ar'));
        setText('analyticsVolume', totalBalance.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ','));
        setText('analyticsTx', totalReferrals.toLocaleString('ar'));
        
        const sendCount = document.getElementById('referralSendCount');
        if (sendCount) sendCount.textContent = totalReferrals.toLocaleString('ar');
    } catch (e) {
        // Fallback to demo data if Firebase fails
        setText('analyticsUsers', '1,247');
        setText('analyticsVolume', '45,832');
        setText('analyticsTx', '3,429');
    }
    
    // Update every minute
    setTimeout(updateAnalyticsStats, 60000);
}

// ==========================================
// QR CODE - FIXED
// ==========================================
function generateQRCode(data) {
    const container = document.getElementById('qrCode');
    if (!container) return;
    
    // Clear previous QR code
    container.innerHTML = '';
    
    try {
        // Create QR code with proper settings
        const qr = new QRCode(container, {
            text: data,
            width: 180,
            height: 180,
            colorDark: '#1a5f4a',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.H
        });
        qrCodeGenerated = true;
    } catch (e) {
        console.error('QR Code Error:', e);
        // Fallback display
        container.innerHTML = `
            <div style="width:180px;height:180px;display:flex;align-items:center;justify-content:center;background:#fff;border-radius:12px;">
                <i class="fas fa-qrcode" style="font-size:3rem;color:#1a5f4a;"></i>
            </div>
        `;
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
        snap.forEach(child => txs.push({id: child.key, ...child.val()}));
        txs.sort((a, b) => b.timestamp - a.timestamp);
        
        if (txs.length === 0) {
            list.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><p>لا توجد عمليات بعد</p></div>';
            return;
        }
        
        list.innerHTML = txs.map(tx => {
            const cls = tx.status === 'pending' ? 'pending' : (tx.type === 'send' ? 'negative' : 'positive');
            const iconMap = {
                'buy': 'shopping-cart',
                'sell': 'hand-holding-usd',
                'send': 'paper-plane',
                'receive': 'download',
                'bonus': 'gift',
                'referral': 'users'
            };
            const icon = iconMap[tx.type] || 'exchange-alt';
            const sign = tx.type === 'send' ? '-' : '+';
            const date = new Date(tx.timestamp).toLocaleDateString('ar-IQ', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            return `
                <div class="transaction-item">
                    <div class="transaction-icon ${cls}">
                        <i class="fas fa-${icon}"></i>
                    </div>
                    <div class="transaction-details">
                        <div class="transaction-type">${tx.description}</div>
                        <div class="transaction-date">${date}</div>
                    </div>
                    <div class="transaction-amount ${cls}">
                        ${sign}${parseFloat(tx.amount).toFixed(2)} DC
                    </div>
                </div>
            `;
        }).join('');
    } catch (e) {
        console.error('Transaction Load Error:', e);
    }
}

async function addTransaction(uid, data) {
    try {
        await database.ref(`transactions/${uid}`).push({
            ...data,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        });
    } catch (e) {
        console.error('Transaction Add Error:', e);
    }
}

// ==========================================
// REFERRAL SYSTEM - FIXED
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
        const snap = await database.ref('users')
            .orderByChild('referralCode')
            .equalTo(code)
            .once('value');
        
        if (snap.exists()) {
            return Object.keys(snap.val())[0];
        }
    } catch (e) {
        console.error('Referral Validation Error:', e);
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
        
        // Give bonus every 10 referrals
        if (newCount % 10 === 0) {
            await ref.update({
                referralCount: newCount,
                referralEarnings: parseFloat(data.referralEarnings || 0) + REFERRAL_BONUS,
                balance: parseFloat(data.balance || 0) + REFERRAL_BONUS
            });
            
            await addTransaction(referrerUid, {
                type: 'referral',
                amount: REFERRAL_BONUS,
                description: `مكافأة إحالة - ${newCount} إحالة`,
                status: 'completed'
            });
        } else {
            await ref.update({referralCount: newCount});
        }
    } catch (e) {
        console.error('Referral Process Error:', e);
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
// BUY/SEND/RECEIVE MODALS
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
    
    // Generate QR code only once
    if (!qrCodeGenerated && currentUser) {
        const userData = database.ref(`users/${currentUser.uid}`);
        userData.once('value').then(snap => {
            const data = snap.val();
            if (data && data.referralCode) {
                generateQRCode(data.referralCode);
                setText('receiveCode', data.referralCode);
            }
        });
    }
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
        // Check sender balance
        const senderSnap = await database.ref(`users/${currentUser.uid}`).once('value');
        const senderData = senderSnap.val();
        
        if (!senderData || parseFloat(senderData.balance) < amount) {
            showNotification('خطأ', 'رصيد غير كافٍ', 'error');
            return;
        }
        
        // Validate recipient
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
        
        // Perform transfer
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
        console.error('Send Error:', e);
        showNotification('خطأ', 'فشلت العملية', 'error');
    }
}

// ==========================================
// PROFILE SETTINGS
// ==========================================
function showEditNameModal() {
    document.getElementById('editNameModal').classList.add('active');
    if (currentUser) {
        document.getElementById('editNameInput').value = document.getElementById('userName').textContent;
    }
}

function closeEditNameModal() {
    document.getElementById('editNameModal').classList.remove('active');
}

async function saveNewName() {
    if (!currentUser) return;
    
    const newName = document.getElementById('editNameInput').value.trim();
    if (!newName) {
        showNotification('خطأ', 'أدخل الاسم الجديد', 'error');
        return;
    }
    
    try {
        await database.ref(`users/${currentUser.uid}`).update({name: newName});
        closeEditNameModal();
        showNotification('تم!', 'تم تحديث الاسم', 'success');
    } catch (e) {
        showNotification('خطأ', 'فشل التحديث', 'error');
    }
}

function toggleSetting(setting) {
    const toggle = document.getElementById(`toggle-${setting}`);
    if (toggle) {
        toggle.classList.toggle('active');
        const status = toggle.classList.contains('active') ? 'مفعّل' : 'معطّل';
        const labels = {
            notifications: 'الإشعارات',
            darkmode: 'الوضع الليلي',
            biometric: 'تسجيل بالبصمة'
        };
        showNotification('تم', `${labels[setting]} ${status}`, 'success');
    }
}

// ==========================================
// NOTIFICATIONS
// ==========================================
function showNotification(title, message, type = 'success') {
    const notification = document.getElementById('successNotification');
    if (!notification) return;
    
    document.getElementById('notificationTitle').textContent = title;
    document.getElementById('notificationMessage').textContent = message;
    notification.className = `toast-notification ${type} active`;
    
    setTimeout(() => {
        notification.classList.remove('active');
    }, 4000);
}

function closeNotification() {
    document.getElementById('successNotification')?.classList.remove('active');
}

// ==========================================
// EVENT LISTENERS & UTILITIES
// ==========================================

// Auto-calculate buy total
document.addEventListener('DOMContentLoaded', () => {
    const buyInput = document.getElementById('buyAmount');
    if (buyInput) {
        buyInput.addEventListener('input', calculateBuyTotal);
    }
});

// Close modal on overlay click
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('active');
    }
});

// Prevent form submission on Enter
document.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
        e.preventDefault();
    }
});

// Smooth scroll behavior for all containers
document.querySelectorAll('.dash-scroll-content, .modal-sheet').forEach(el => {
    el.style.scrollBehavior = 'smooth';
});

// ==========================================
// INITIALIZATION
// ==========================================
console.log('Dinar Coin App V3 Initialized');
