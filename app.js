// ==========================================
// DINAR COIN - Full App JavaScript V2
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

const PRICE_PER_COIN = 1000;
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
        body: `في عالم يتجه بسرعة نحو الرقمنة، يبرز دينار كوين كفرصة استثمارية فريدة من نوعها في المنطقة العربية. مع تزايد الاهتمام العالمي بالعملات الرقمية، يقدم دينار كوين بديلاً محلياً يراعي خصوصيات السوق العراقي والعربي.\n\nيتميز دينار كوين بعدة مزايا تجعله خياراً مثالياً للمستثمرين: سعر مستقر مرتبط بالدينار العراقي، منصة آمنة وسهلة الاستخدام، فريق عمل عراقي متخصص، ودعم كامل للغة العربية.\n\nمع خطط التوسع المستقبلية التي تشمل إضافة محفظة متعددة العملات وتكامل مع بوابات الدفع المحلية، يُتوقع أن يشهد دينار كوين نمواً كبيراً في الفترة القادمة. انضم الآن وكن جزءاً من هذه الثورة الرقمية العراقية!`
    },
    {
        id: 1, cat: 'update',
        title: 'إطلاق النسخة التجريبية BETA من منصة دينار كوين',
        summary: 'المنصة الآن متاحة للجميع مع ميزات جديدة ومبتكرة',
        img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=300&fit=crop',
        date: '2026-02-05',
        body: `يسعدنا الإعلان عن إطلاق النسخة التجريبية من منصة دينار كوين! هذه النسخة تتضمن جميع الميزات الأساسية التي يحتاجها المستخدمون.\n\nالميزات المتاحة في النسخة التجريبية:\n• محفظة رقمية آمنة لحفظ عملات دينار كوين\n• إمكانية إرسال واستقبال العملات بسهولة\n• نظام إحالة مع مكافآت فورية\n• لوحة تحكم شاملة مع إحصائيات حية\n• تصميم عصري يعمل على جميع الأجهزة\n\nندعو جميع المهتمين للتسجيل والبدء باستخدام المنصة ومشاركة ملاحظاتهم لتحسين التجربة.`
    },
    {
        id: 2, cat: 'guide',
        title: 'دليل المبتدئين: كيف تبدأ مع دينار كوين خطوة بخطوة',
        summary: 'كل ما تحتاج معرفته للبدء بالاستثمار في دينار كوين',
        img: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=300&fit=crop',
        date: '2026-02-04',
        body: `إذا كنت جديداً في عالم العملات الرقمية، فهذا الدليل مخصص لك! سنشرح لك كل خطوة بالتفصيل.\n\nالخطوة الأولى - إنشاء الحساب: قم بالتسجيل باستخدام بريدك الإلكتروني وكلمة مرور قوية. ستحصل فوراً على مكافأة ترحيبية!\n\nالخطوة الثانية - تأمين حسابك: تأكد من استخدام كلمة مرور فريدة ولا تشاركها مع أحد.\n\nالخطوة الثالثة - شراء العملات: يمكنك تقديم طلب شراء وسيتم مراجعته من قبل فريق الإدارة.\n\nالخطوة الرابعة - إرسال واستقبال: استخدم رمز الإحالة الخاص بك لاستقبال العملات، أو أدخل رمز شخص آخر لإرسال العملات إليه.\n\nالخطوة الخامسة - دعوة الأصدقاء: شارك رمز الإحالة واحصل على مكافآت مجانية!`
    },
    {
        id: 3, cat: 'invest',
        title: '5 أسباب تجعل العملات الرقمية العربية مستقبل الاقتصاد',
        summary: 'لماذا العملات الرقمية المحلية أفضل من العملات العالمية؟',
        img: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&h=300&fit=crop',
        date: '2026-02-03',
        body: `العملات الرقمية العربية تتميز بعدة مزايا فريدة تجعلها خياراً استراتيجياً للمستثمرين في المنطقة:\n\n1. فهم السوق المحلي: العملات المحلية مصممة لتلبية احتياجات المجتمع العربي.\n\n2. الاستقرار: ربط القيمة بالعملات المحلية يقلل من التقلبات الحادة.\n\n3. سهولة الاستخدام: واجهات عربية بالكامل مع دعم فني محلي.\n\n4. التكامل المحلي: إمكانية الربط مع البنوك وبوابات الدفع المحلية مستقبلاً.\n\n5. المجتمع: مجتمع عربي نشط يدعم نمو العملة.`
    },
    {
        id: 4, cat: 'update',
        title: 'تحديث جديد: نظام البطاقة الرقمية الذكية',
        summary: 'كل مستخدم يحصل الآن على بطاقة رقمية فريدة',
        img: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&h=300&fit=crop',
        date: '2026-02-02',
        body: `نحن متحمسون للإعلان عن إطلاق نظام البطاقة الرقمية الذكية! كل مستخدم جديد سيحصل تلقائياً على بطاقة رقمية فريدة برقم عشوائي خاص به.\n\nمميزات البطاقة الرقمية:\n• رقم بطاقة فريد لكل مستخدم\n• رمز CVV للأمان\n• تاريخ انتهاء\n• تصميم أنيق بألوان دينار كوين\n• إمكانية عرض تفاصيل البطاقة بقلبها\n\nهذه البطاقة هي خطوة نحو تقديم تجربة مصرفية رقمية كاملة في المستقبل القريب.`
    },
    {
        id: 5, cat: 'invest',
        title: 'كيف تحقق أرباحاً من نظام الإحالة في دينار كوين',
        summary: 'استراتيجيات ذكية لزيادة أرباحك من دعوة الأصدقاء',
        img: 'https://images.unsplash.com/photo-1553729459-afe8f2e2ed65?w=600&h=300&fit=crop',
        date: '2026-02-01',
        body: `نظام الإحالة في دينار كوين مصمم لمكافأة المستخدمين النشطين. إليك بعض الاستراتيجيات لتعظيم أرباحك:\n\nشارك على وسائل التواصل الاجتماعي: انشر رمز الإحالة الخاص بك على فيسبوك وإنستغرام وتويتر مع شرح مبسط عن دينار كوين.\n\nأنشئ محتوى تعليمي: اصنع فيديوهات قصيرة تشرح فيها كيفية استخدام المنصة.\n\nاستهدف المجتمعات المهتمة: انضم لمجموعات الاستثمار والتكنولوجيا.\n\nكل 10 إحالات ناجحة = 0.25 DC مكافأة مجانية! كلما زاد عدد إحالاتك، زادت مكافآتك.`
    },
    {
        id: 6, cat: 'guide',
        title: 'أمان حسابك: نصائح ذهبية لحماية عملاتك الرقمية',
        summary: 'تعلم أفضل ممارسات الأمان لحماية استثماراتك',
        img: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=600&h=300&fit=crop',
        date: '2026-01-30',
        body: `حماية حسابك وعملاتك الرقمية أمر بالغ الأهمية. إليك أهم النصائح:\n\n• استخدم كلمة مرور قوية وفريدة لا تقل عن 12 حرفاً\n• لا تشارك بيانات تسجيل الدخول مع أي شخص\n• تأكد من عنوان الموقع قبل تسجيل الدخول\n• لا تنقر على روابط مشبوهة تدعي أنها من دينار كوين\n• قم بتحديث متصفحك باستمرار\n• فعّل تسجيل الدخول بالبصمة عند توفره\n\nتذكر: فريق دينار كوين لن يطلب منك أبداً كلمة المرور الخاصة بك!`
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
        p.style.animationDuration = (Math.random() * 12 + 10) + 's';
        c.appendChild(p);
    }
}

function setupEventListeners() {
    const buyInput = document.getElementById('buyAmount');
    if (buyInput) buyInput.addEventListener('input', calculateBuyTotal);
}

// ==========================================
// TAB NAVIGATION (FIXED)
// ==========================================
function switchTab(tab) {
    // If not logged in and trying to access protected tabs
    if (!currentUser && ['home', 'news', 'analytics', 'profile'].includes(tab)) {
        if (tab !== 'home') {
            showAuthModal('login');
            return;
        }
    }

    // Hide all screens
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active-screen'));

    // Update nav tabs
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    const navBtn = document.querySelector(`[data-tab="${tab}"]`);
    if (navBtn) navBtn.classList.add('active');

    // Show appropriate screen
    switch(tab) {
        case 'home':
            if (currentUser) {
                document.getElementById('dashboardScreen').classList.add('active-screen');
            } else {
                document.getElementById('homeScreen').classList.add('active-screen');
            }
            break;
        case 'news':
            document.getElementById('newsScreen').classList.add('active-screen');
            break;
        case 'analytics':
            document.getElementById('analyticsScreen').classList.add('active-screen');
            setTimeout(() => drawAllCharts(), 100);
            break;
        case 'profile':
            document.getElementById('profileScreen').classList.add('active-screen');
            break;
    }
}

function showHome() {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active-screen'));
    document.getElementById('homeScreen').classList.add('active-screen');
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.querySelector('[data-tab="home"]')?.classList.add('active');
}

function showDashboard() {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active-screen'));
    document.getElementById('dashboardScreen').classList.add('active-screen');
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.querySelector('[data-tab="home"]')?.classList.add('active');
}

// ==========================================
// CARD FLIP
// ==========================================
function flipCard() {
    const flipper = document.getElementById('cardFlipper');
    if (!flipper) return;
    cardFlipped = !cardFlipped;
    flipper.classList.toggle('flipped', cardFlipped);
}

// ==========================================
// GENERATE RANDOM CARD DATA
// ==========================================
function generateCardData(uid) {
    // Use uid as seed for consistent random numbers
    let seed = 0;
    for (let i = 0; i < uid.length; i++) {
        seed = ((seed << 5) - seed) + uid.charCodeAt(i);
        seed |= 0;
    }
    const rng = (max) => { seed = (seed * 16807 + 0) % 2147483647; return Math.abs(seed) % max; };

    const groups = [];
    for (let g = 0; g < 4; g++) {
        let n = '';
        for (let d = 0; d < 4; d++) n += rng(10);
        groups.push(n);
    }
    const fullNumber = groups.join(' ');
    const cvv = '' + rng(10) + rng(10) + rng(10);
    const expMonth = String(rng(12) + 1).padStart(2, '0');
    const expYear = String(28 + rng(5));
    const expiry = expMonth + '/' + expYear;
    const cardId = 'DC-' + String(100000 + rng(900000));

    return { fullNumber, groups, cvv, expiry, cardId };
}

// ==========================================
// AUTHENTICATION
// ==========================================
function showAuthModal(type = 'login') {
    document.getElementById('authModal').classList.add('active');
    switchAuthForm(type);
}
function closeAuthModal() { document.getElementById('authModal').classList.remove('active'); }
function switchAuthForm(type) {
    document.getElementById('loginForm').style.display = type === 'login' ? 'block' : 'none';
    document.getElementById('signupForm').style.display = type === 'signup' ? 'block' : 'none';
}

async function login() {
    const email = document.getElementById('loginEmail').value.trim();
    const pw = document.getElementById('loginPassword').value;
    if (!email || !pw) { showNotification('خطأ', 'الرجاء إدخال البيانات', 'error'); return; }
    try {
        await auth.signInWithEmailAndPassword(email, pw);
        closeAuthModal();
        showNotification('مرحباً بك!', 'تم تسجيل الدخول بنجاح', 'success');
    } catch (e) { showNotification('خطأ', getErrorMessage(e.code), 'error'); }
}

async function signup() {
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const pw = document.getElementById('signupPassword').value;
    const ref = document.getElementById('signupReferralCode').value.trim();
    if (!name || !email || !pw) { showNotification('خطأ', 'الرجاء إدخال جميع البيانات', 'error'); return; }
    if (pw.length < 6) { showNotification('خطأ', 'كلمة المرور قصيرة جداً', 'error'); return; }
    try {
        const cred = await auth.createUserWithEmailAndPassword(email, pw);
        const user = cred.user;
        const refCode = generateReferralCode();
        const cardData = generateCardData(user.uid);
        let referrerUid = null;
        if (ref) referrerUid = await validateReferralCode(ref);

        await database.ref(`users/${user.uid}`).set({
            name, email, balance: WELCOME_BONUS, referralCode: refCode,
            referralCount: 0, referralEarnings: 0, usedReferralCode: ref || null,
            cardNumber: cardData.fullNumber, cardCVV: cardData.cvv,
            cardExpiry: cardData.expiry, cardId: cardData.cardId,
            createdAt: firebase.database.ServerValue.TIMESTAMP
        });
        await addTransaction(user.uid, { type: 'bonus', amount: WELCOME_BONUS, description: 'مكافأة الترحيب', status: 'completed' });
        if (referrerUid) await processReferral(referrerUid, user.uid);
        closeAuthModal();
        showNotification('مرحباً بك!', 'تم إنشاء الحساب بنجاح', 'success');
    } catch (e) { showNotification('خطأ', getErrorMessage(e.code), 'error'); }
}

async function logout() {
    try {
        if (userDataListener) { userDataListener.off(); userDataListener = null; }
        await auth.signOut();
        showNotification('تم تسجيل الخروج', 'نراك قريباً!', 'success');
    } catch (e) {}
}

function getErrorMessage(c) {
    const m = { 'auth/email-already-in-use': 'البريد مستخدم بالفعل', 'auth/invalid-email': 'بريد غير صحيح', 'auth/weak-password': 'كلمة مرور ضعيفة', 'auth/user-not-found': 'مستخدم غير موجود', 'auth/wrong-password': 'كلمة مرور خاطئة', 'auth/invalid-credential': 'بيانات غير صحيحة' };
    return m[c] || 'حدث خطأ، حاول مرة أخرى';
}

// ==========================================
// USER DATA
// ==========================================
function loadUserData() {
    if (!currentUser) return;
    userDataListener = database.ref(`users/${currentUser.uid}`);
    userDataListener.on('value', (snap) => {
        const d = snap.val();
        if (d) { updateUserUI(d); loadTransactions(); }
    });
}

function updateUserUI(d) {
    // Generate card data if missing
    if (!d.cardNumber) {
        const cd = generateCardData(currentUser.uid);
        database.ref(`users/${currentUser.uid}`).update({
            cardNumber: cd.fullNumber, cardCVV: cd.cvv,
            cardExpiry: cd.expiry, cardId: cd.cardId
        });
        d.cardNumber = cd.fullNumber;
        d.cardCVV = cd.cvv;
        d.cardExpiry = cd.expiry;
        d.cardId = cd.cardId;
    }

    userCardData = { number: d.cardNumber, cvv: d.cardCVV, expiry: d.cardExpiry, id: d.cardId };

    // Avatar
    const av = document.getElementById('userAvatar');
    if (av) av.textContent = d.name.charAt(0).toUpperCase();

    // Card front
    const cb = document.getElementById('cardBalance');
    if (cb) cb.textContent = parseFloat(d.balance || 0).toFixed(2);
    const ch = document.getElementById('cardHolderName');
    if (ch) ch.textContent = d.name;
    const cn = document.getElementById('cardNumber');
    if (cn) {
        const parts = d.cardNumber.split(' ');
        cn.innerHTML = `XXXX &nbsp; XXXX &nbsp; XXXX &nbsp; ${parts[3] || '0000'}`;
    }
    const ce = document.getElementById('cardExpiry');
    if (ce) ce.textContent = d.cardExpiry || '02/30';
    const cvv = document.getElementById('cardCVV');
    if (cvv) cvv.textContent = d.cardCVV || '000';
    const cid = document.getElementById('cardBackId');
    if (cid) cid.textContent = d.cardId || 'DC-000000';

    // Referral
    const rc = document.getElementById('referralCode');
    if (rc) rc.textContent = d.referralCode;
    const rce = document.getElementById('receiveCode');
    if (rce) rce.textContent = d.referralCode;
    const rcnt = document.getElementById('referralCount');
    if (rcnt) rcnt.textContent = d.referralCount || 0;
    const re = document.getElementById('referralEarnings');
    if (re) re.textContent = parseFloat(d.referralEarnings || 0).toFixed(0);

    // Profile screen
    const pal = document.getElementById('profileAvatarLarge');
    if (pal) {
        if (profilePicUrl) {
            pal.innerHTML = `<img src="${profilePicUrl}" alt="">`;
        } else {
            pal.textContent = d.name.charAt(0).toUpperCase();
        }
    }
    setText('profileName', d.name);
    setText('profileEmail', d.email);
    setText('profileNameValue', d.name);
    setText('profileEmailValue', d.email);
    setText('profileRefCode', d.referralCode);
    setText('profileBalance', parseFloat(d.balance || 0).toFixed(2) + ' DC');
    setText('profileExpiry', d.cardExpiry);

    if (d.createdAt) {
        const jd = new Date(d.createdAt);
        setText('profileJoinDate', jd.toLocaleDateString('ar-IQ', { year: 'numeric', month: 'long', day: 'numeric' }));
    }

    // Profile card data (masked)
    setText('profileCardNum', cardNumVisible ? d.cardNumber : '**** **** **** ' + (d.cardNumber?.split(' ')[3] || '****'));
    setText('profileCVV', cvvVisible ? d.cardCVV : '***');

    generateQRCode(d.referralCode);
}

function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

// ==========================================
// CARD VISIBILITY TOGGLES
// ==========================================
function toggleCardNumVisibility() {
    cardNumVisible = !cardNumVisible;
    const el = document.getElementById('profileCardNum');
    const icon = document.getElementById('cardNumToggle');
    if (el && userCardData) {
        el.textContent = cardNumVisible ? userCardData.number : '**** **** **** ' + (userCardData.number?.split(' ')[3] || '****');
    }
    if (icon) icon.className = cardNumVisible ? 'fas fa-eye-slash settings-arrow' : 'fas fa-eye settings-arrow';
}

function toggleCVVVisibility() {
    cvvVisible = !cvvVisible;
    const el = document.getElementById('profileCVV');
    const icon = document.getElementById('cvvToggle');
    if (el && userCardData) el.textContent = cvvVisible ? userCardData.cvv : '***';
    if (icon) icon.className = cvvVisible ? 'fas fa-eye-slash settings-arrow' : 'fas fa-eye settings-arrow';
}

// ==========================================
// PROFILE MANAGEMENT
// ==========================================
function changeProfilePicture() {
    document.getElementById('profilePicInput')?.click();
}

function handleProfilePic(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        profilePicUrl = e.target.result;
        const pal = document.getElementById('profileAvatarLarge');
        if (pal) pal.innerHTML = `<img src="${profilePicUrl}" alt="">`;
        showNotification('تم التحديث', 'تم تغيير صورة الملف الشخصي', 'success');
    };
    reader.readAsDataURL(file);
}

function editProfileField(field) {
    if (field === 'name') {
        document.getElementById('editNameModal').classList.add('active');
        document.getElementById('editNameInput').value = '';
    }
}

function closeEditNameModal() {
    document.getElementById('editNameModal').classList.remove('active');
}

async function saveNewName() {
    const name = document.getElementById('editNameInput').value.trim();
    if (!name) { showNotification('خطأ', 'الرجاء إدخال الاسم', 'error'); return; }
    if (!currentUser) return;
    try {
        await database.ref(`users/${currentUser.uid}`).update({ name });
        closeEditNameModal();
        showNotification('تم التحديث', 'تم تغيير الاسم بنجاح', 'success');
    } catch (e) { showNotification('خطأ', 'فشل التحديث', 'error'); }
}

function toggleSetting(key) {
    const toggle = document.getElementById(`toggle-${key}`);
    if (!toggle) return;
    toggle.classList.toggle('active');
    const isActive = toggle.classList.contains('active');
    showNotification('الإعدادات', isActive ? 'تم التفعيل' : 'تم الإيقاف', 'success');
}

// ==========================================
// NEWS
// ==========================================
function renderNewsArticles(filter = 'all') {
    const list = document.getElementById('newsArticlesList');
    if (!list) return;
    const filtered = filter === 'all' ? newsArticles : newsArticles.filter(a => a.cat === filter);
    list.innerHTML = filtered.map(a => `
        <div class="news-article-card" onclick="openArticle(${a.id})">
            <img src="${a.img}" alt="" class="news-article-img">
            <div class="news-article-info">
                <h4>${a.title}</h4>
                <div class="news-article-meta">
                    <span>${a.date}</span>
                    <span class="news-article-cat">${{invest:'استثمار',update:'تحديث',guide:'دليل'}[a.cat]}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function filterNews(cat, btn) {
    document.querySelectorAll('.news-cat-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    renderNewsArticles(cat);
}

function openArticle(id) {
    const a = newsArticles.find(x => x.id === id);
    if (!a) return;
    const content = document.getElementById('articleContent');
    if (!content) return;
    const catLabels = {invest:'استثمار',update:'تحديث',guide:'دليل'};
    content.innerHTML = `
        <img src="${a.img}" alt="">
        <span class="article-tag">${catLabels[a.cat]}</span>
        <h2>${a.title}</h2>
        <span class="article-date"><i class="fas fa-calendar"></i> ${a.date}</span>
        ${a.body.split('\n').map(p => p.trim() ? `<p>${p}</p>` : '').join('')}
    `;
    document.getElementById('articleModal').classList.add('active');
}

function closeArticleModal() { document.getElementById('articleModal').classList.remove('active'); }

// ==========================================
// ANALYTICS CHARTS (Canvas)
// ==========================================
function drawAllCharts() {
    drawLineChart('priceChart', generatePriceData(), '#d4af37', '#1a5f4a');
    drawBarChart('usersChart', generateUsersData(), '#2a8f6a');
    drawBarChart('volumeChart', generateVolumeData(), '#d4af37');
}

function generatePriceData() {
    const data = [];
    let price = 1000; // Starting at stable 1000 IQD
    const timeframe = document.querySelector('.tf-btn.active')?.textContent || '1D';
    
    let points, volatility, trend;
    switch(timeframe) {
        case '1D': points = 24; volatility = 5; trend = 0.2; break;
        case '1W': points = 7; volatility = 15; trend = 0.5; break;
        case '1M': points = 30; volatility = 20; trend = 1; break;
        case '1Y': points = 12; volatility = 50; trend = 2; break;
        default: points = 30; volatility = 20; trend = 1;
    }
    
    for (let i = 0; i < points; i++) {
        // Add realistic market movement with trend
        const randomChange = (Math.random() - 0.48) * volatility;
        const trendChange = trend * (i / points);
        price += randomChange + trendChange;
        
        // Keep price within reasonable bounds
        price = Math.max(950, Math.min(1050, price));
        data.push(Math.round(price * 100) / 100);
    }
    return data;
}

function generateUsersData() {
    // Realistic user growth with exponential trend
    const baseUsers = [15, 22, 28, 38, 52, 68, 85, 102, 125, 148, 175, 205];
    return baseUsers.map(u => Math.round(u + (Math.random() - 0.5) * 10));
}

function generateVolumeData() {
    // Realistic trading volume with market cycles
    const baseVolume = [180, 245, 310, 420, 580, 720, 890, 1050, 1200, 1380, 1560, 1750];
    return baseVolume.map(v => Math.round(v + (Math.random() - 0.5) * 100));
}
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
    const w = rect.width, h = rect.height;
    const pad = { top: 10, right: 10, bottom: 20, left: 10 };
    const cw = w - pad.left - pad.right;
    const ch = h - pad.top - pad.bottom;

    const min = Math.min(...data) - 10;
    const max = Math.max(...data) + 10;
    const range = max - min;
    const stepX = cw / (data.length - 1);

    ctx.clearRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 4; i++) {
        const y = pad.top + (ch / 3) * i;
        ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(w - pad.right, y); ctx.stroke();
    }

    // Fill
    ctx.beginPath();
    ctx.moveTo(pad.left, pad.top + ch - ((data[0] - min) / range) * ch);
    for (let i = 1; i < data.length; i++) {
        const x = pad.left + stepX * i;
        const y = pad.top + ch - ((data[i] - min) / range) * ch;
        ctx.lineTo(x, y);
    }
    ctx.lineTo(pad.left + cw, pad.top + ch);
    ctx.lineTo(pad.left, pad.top + ch);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + ch);
    grad.addColorStop(0, fillColor + '40');
    grad.addColorStop(1, fillColor + '05');
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    ctx.beginPath();
    ctx.moveTo(pad.left, pad.top + ch - ((data[0] - min) / range) * ch);
    for (let i = 1; i < data.length; i++) {
        const x = pad.left + stepX * i;
        const y = pad.top + ch - ((data[i] - min) / range) * ch;
        ctx.lineTo(x, y);
    }
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
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
    const w = rect.width, h = rect.height;
    const pad = { top: 10, right: 10, bottom: 24, left: 10 };
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
        snap.forEach(c => {
            const d = c.val();
            totalBalance += parseFloat(d.balance || 0);
            totalReferrals += (d.referralCount || 0);
        });
        setText('analyticsUsers', count);
        setText('analyticsVolume', totalBalance.toFixed(0));
        setText('analyticsTx', totalReferrals);
        const sc = document.getElementById('referralSendCount');
        if (sc) sc.textContent = totalReferrals;
    } catch (e) {}
    setTimeout(updateAnalyticsStats, 60000);
}

// ==========================================
// QR CODE
// ==========================================
function generateQRCode(data) {
    const c = document.getElementById('qrCode');
    if (!c) return;
    c.innerHTML = '';
    try {
        new QRCode(c, { text: data, width: 160, height: 160, colorDark: '#1a5f3f', colorLight: '#ffffff', correctLevel: QRCode.CorrectLevel.H });
    } catch (e) {
        c.innerHTML = '<div style="width:160px;height:160px;display:flex;align-items:center;justify-content:center;background:#fff;border-radius:12px;"><i class="fas fa-qrcode" style="font-size:2.5rem;color:#1a5f3f;"></i></div>';
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
        if (txs.length === 0) { list.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><p>لا توجد عمليات بعد</p></div>'; return; }
        list.innerHTML = txs.map(tx => {
            const cls = tx.status === 'pending' ? 'pending' : (tx.type === 'send' ? 'negative' : 'positive');
            const icon = {buy:'shopping-cart',sell:'hand-holding-usd',send:'paper-plane',receive:'download',bonus:'gift',referral:'users'}[tx.type] || 'exchange-alt';
            const sign = tx.type === 'send' ? '-' : '+';
            const date = new Date(tx.timestamp).toLocaleDateString('ar-IQ',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});
            return `<div class="transaction-item"><div class="transaction-icon ${cls}"><i class="fas fa-${icon}"></i></div><div class="transaction-details"><div class="transaction-type">${tx.description}</div><div class="transaction-date">${date}</div></div><div class="transaction-amount ${cls}">${sign}${parseFloat(tx.amount).toFixed(2)} DC</div></div>`;
        }).join('');
    } catch (e) {}
}

async function addTransaction(uid, data) {
    try { await database.ref(`transactions/${uid}`).push({ ...data, timestamp: firebase.database.ServerValue.TIMESTAMP }); } catch (e) {}
}

// ==========================================
// REFERRAL
// ==========================================
function generateReferralCode() {
    const c = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'DC';
    for (let i = 0; i < 8; i++) code += c.charAt(Math.floor(Math.random() * c.length));
    return code;
}

async function validateReferralCode(code) {
    if (!code || code.length !== 10) return null;
    try {
        const snap = await database.ref('users').orderByChild('referralCode').equalTo(code).once('value');
        if (snap.exists()) return Object.keys(snap.val())[0];
    } catch (e) {}
    return null;
}

async function processReferral(rUid) {
    try {
        const ref = database.ref(`users/${rUid}`);
        const snap = await ref.once('value');
        const d = snap.val();
        if (!d) return;
        const nc = (d.referralCount || 0) + 1;
        if (nc % 10 === 0) {
            await ref.update({ referralCount: nc, referralEarnings: parseFloat(d.referralEarnings||0)+REFERRAL_BONUS, balance: parseFloat(d.balance||0)+REFERRAL_BONUS });
            await addTransaction(rUid, { type:'referral', amount:REFERRAL_BONUS, description:`مكافأة إحالة - ${nc} إحالة`, status:'completed' });
        } else {
            await ref.update({ referralCount: nc });
        }
    } catch (e) {}
}

function copyReferralCode() { const c = document.getElementById('referralCode')?.textContent; if(c){copyToClipboard(c);showNotification('تم النسخ','تم نسخ رمز الإحالة','success');} }
function copyReceiveCode() { const c = document.getElementById('receiveCode')?.textContent; if(c){copyToClipboard(c);showNotification('تم النسخ','تم نسخ الرمز','success');} }
function copyToClipboard(t) { if(navigator.clipboard){navigator.clipboard.writeText(t).catch(()=>fallbackCopy(t));}else{fallbackCopy(t);} }
function fallbackCopy(t) { const a=document.createElement('textarea');a.value=t;a.style.position='fixed';a.style.opacity='0';document.body.appendChild(a);a.select();document.execCommand('copy');document.body.removeChild(a); }

// ==========================================
// BUY/SEND/RECEIVE
// ==========================================
function showBuyModal() { document.getElementById('buyModal').classList.add('active'); document.getElementById('buyAmount').value=''; document.getElementById('totalIQD').textContent='0 IQD'; }
function closeBuyModal() { document.getElementById('buyModal').classList.remove('active'); }
function calculateBuyTotal() { const a=parseFloat(document.getElementById('buyAmount').value)||0; document.getElementById('totalIQD').textContent=(a*PRICE_PER_COIN).toLocaleString('ar-IQ')+' IQD'; }

async function submitBuyRequest() {
    if(!currentUser)return;
    const a=parseFloat(document.getElementById('buyAmount').value);
    if(!a||a<=0){showNotification('خطأ','أدخل كمية صحيحة','error');return;}
    try {
        const t=a*PRICE_PER_COIN;
        await database.ref(`purchase_requests/${currentUser.uid}`).push({userId:currentUser.uid,amount:a,totalIQD:t,status:'pending',timestamp:firebase.database.ServerValue.TIMESTAMP});
        await addTransaction(currentUser.uid,{type:'buy',amount:a,description:`طلب شراء - ${t.toLocaleString('ar-IQ')} IQD`,status:'pending'});
        closeBuyModal();
        showNotification('تم!',`طلب شراء ${a} DC أُرسل بنجاح`,'success');
    } catch(e){showNotification('خطأ','فشل الطلب','error');}
}

function showSendModal() { document.getElementById('sendModal').classList.add('active'); document.getElementById('recipientCode').value=''; document.getElementById('sendAmount').value=''; document.getElementById('sendNote').value=''; }
function closeSendModal() { document.getElementById('sendModal').classList.remove('active'); }
function showReceiveModal() { 
    if(!currentUser){showAuthModal('login');return;} 
    document.getElementById('receiveModal').classList.add('active');
    // Generate QR code when modal opens
    database.ref(`users/${currentUser.uid}/referralCode`).once('value').then(snap => {
        const refCode = snap.val();
        if (refCode) {
            generateQRCode(refCode);
            setText('receiveCode', refCode);
        }
    });
}
function closeReceiveModal() { document.getElementById('receiveModal').classList.remove('active'); }

async function sendCoins() {
    if(!currentUser)return;
    const rc=document.getElementById('recipientCode').value.trim();
    const a=parseFloat(document.getElementById('sendAmount').value);
    const n=document.getElementById('sendNote').value.trim()||'تحويل';
    if(!rc||!a||a<=0){showNotification('خطأ','أدخل جميع البيانات','error');return;}
    try {
        const ss=await database.ref(`users/${currentUser.uid}`).once('value');
        const sd=ss.val();
        if(!sd||parseFloat(sd.balance)<a){showNotification('خطأ','رصيد غير كافٍ','error');return;}
        const ru=await validateReferralCode(rc);
        if(!ru){showNotification('خطأ','رمز غير صحيح','error');return;}
        if(ru===currentUser.uid){showNotification('خطأ','لا يمكن الإرسال لنفسك','error');return;}
        const rs=await database.ref(`users/${ru}`).once('value');
        const rd=rs.val();
        if(!rd){showNotification('خطأ','مستخدم غير موجود','error');return;}
        await database.ref(`users/${currentUser.uid}`).update({balance:parseFloat(sd.balance)-a});
        await database.ref(`users/${ru}`).update({balance:parseFloat(rd.balance||0)+a});
        await addTransaction(currentUser.uid,{type:'send',amount:a,description:`إرسال إلى ${rd.name} - ${n}`,status:'completed'});
        await addTransaction(ru,{type:'receive',amount:a,description:`استلام من ${sd.name} - ${n}`,status:'completed'});
        closeSendModal();
        showNotification('تم!',`أُرسل ${a} DC إلى ${rd.name}`,'success');
    } catch(e){showNotification('خطأ','فشلت العملية','error');}
}

// ==========================================
// NOTIFICATIONS
// ==========================================
function showNotification(title, msg, type='success') {
    const n=document.getElementById('successNotification');
    if(!n)return;
    document.getElementById('notificationTitle').textContent=title;
    document.getElementById('notificationMessage').textContent=msg;
    n.className=`toast-notification ${type} active`;
    setTimeout(()=>n.classList.remove('active'),4000);
}
function closeNotification() { document.getElementById('successNotification')?.classList.remove('active'); }

// ==========================================
// UTILS
// ==========================================
window.addEventListener('click', e => { if(e.target.classList.contains('modal-overlay'))e.target.classList.remove('active'); });
document.addEventListener('keypress', e => { if(e.key==='Enter'&&e.target.tagName==='INPUT')e.preventDefault(); });

// ==========================================
// ADDITIONAL FUNCTIONS - v2.0
// ==========================================
function showContactSupport() {
    showNotification('قريباً', 'ميزة الدعم الفني قيد التطوير', 'success');
}

function showAboutApp() {
    const aboutText = `
دينار كوين - العملة الرقمية العراقية الأولى

النسخة: 2.0.0 BETA
تاريخ التحديث: فبراير 2026

تطبيق دينار كوين هو منصة رقمية آمنة وسهلة الاستخدام للاستثمار والتداول في العملة الرقمية العراقية الأولى.

المميزات:
• محفظة رقمية آمنة ومشفرة
• نظام إحالة مع مكافآت فورية
• تحليلات مالية متقدمة
• واجهة عصرية وسهلة الاستخدام
• دعم كامل للغة العربية

تم التطوير بواسطة: Digital Creativity Company
جميع الحقوق محفوظة © 2026
صنع بكل ❤️ في العراق 🇮🇶
    `;
    showNotification('حول التطبيق', aboutText, 'success');
}

// Enhanced toggle settings with persistence
function toggleSetting(setting) {
    const toggle = document.getElementById(`toggle-${setting}`);
    if (!toggle) return;
    
    toggle.classList.toggle('active');
    const isActive = toggle.classList.contains('active');
    
    // Save to localStorage
    try {
        localStorage.setItem(`setting_${setting}`, isActive ? 'true' : 'false');
    } catch (e) {}
    
    // Show notification
    const settingNames = {
        notifications: 'الإشعارات',
        sound: 'الأصوات',
        darkmode: 'الوضع الليلي',
        biometric: 'تسجيل الدخول بالبصمة',
        autoUpdate: 'التحديث التلقائي'
    };
    
    const settingName = settingNames[setting] || setting;
    const status = isActive ? 'تم التفعيل' : 'تم التعطيل';
    showNotification(settingName, status, 'success');
}

// Load settings from localStorage on init
function loadSavedSettings() {
    const settings = ['notifications', 'sound', 'darkmode', 'biometric', 'autoUpdate'];
    settings.forEach(setting => {
        try {
            const saved = localStorage.getItem(`setting_${setting}`);
            const toggle = document.getElementById(`toggle-${setting}`);
            if (toggle && saved !== null) {
                if (saved === 'true') {
                    toggle.classList.add('active');
                } else {
                    toggle.classList.remove('active');
                }
            }
        } catch (e) {}
    });
}

// Call on page load
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(loadSavedSettings, 500);
});

// Add smooth scroll behavior
document.querySelectorAll('.dash-scroll-content').forEach(el => {
    el.style.scrollBehavior = 'smooth';
});
