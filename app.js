// Supabase setup
var SUPABASE_URL = "https://umlbxdcgpdifxzijujvj.supabase.co";
var SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtbGJ4ZGNncGRpZnh6aWp1anZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0NzQzODUsImV4cCI6MjA4NjA1MDM4NX0.Ld3fU2_B4eu803BsDYKQ0ofg69WxQPJcscGf93lnM3w";
var supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Supabase Auth & Profile
async function signUpWithProfile(form) {
    // 1) إنشاء حساب Auth
    const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
    });
    if (error) throw error;

    const userId = data.user?.id;
    if (!userId) throw new Error("لم يتم الحصول على user id");

    // 2) حفظ بيانات المستخدم في profiles
    const { error: pErr } = await supabase
        .from("profiles")
        .upsert({
            id: userId,
            first_name: form.firstName,
            last_name: form.lastName,
            phone: form.phone,
            country: form.country
        });
    if (pErr) throw pErr;

    // 3) إنشاء محفظة للمستخدم
    const { error: wErr } = await supabase
        .from("wallets")
        .upsert({ user_id: userId, balance: 0 });
    if (wErr) throw wErr;

    return data;
}

async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
}

async function getCurrentUser() {
    const { data } = await supabase.auth.getUser();
    return data.user; // null إذا غير مسجل
}

async function loadMyProfileAndWallet() {
    const user = await getCurrentUser();
    if (!user) throw new Error("غير مسجل دخول");

    // ---- PROFILE ----
    const { data: profiles, error: pErr } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .limit(1);

    if (pErr) throw pErr;

    // إذا لم يوجد profile (أول مرة)
    let profile = profiles[0];
    if (!profile) {
        // إنشاء profile تلقائيًا
      const { error: createErr } = await supabase.from("profiles").upsert({
  id: user.id,
  first_name: "",
  last_name: "",
  phone: "",
  country: "IQ"
});

        if (createErr) throw createErr;

        profile = { id: user.id };
    }

    // ---- WALLET ----
    const { data: wallets, error: wErr } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", user.id)
        .limit(1);

    if (wErr) throw wErr;

    let wallet = wallets[0];
    if (!wallet) {
        const { error: wCreateErr } = await supabase.from("wallets").insert({
            user_id: user.id,
            balance: 0
        });
        if (wCreateErr) throw wCreateErr;

        wallet = { user_id: user.id, balance: 0 };
    }

    return { profile, wallet };
}




function initializeApp() {
  // مراقبة جلسة Supabase بدل Firebase
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      currentUser = session.user;
      try {
        await loadMyProfileAndWallet();
      } catch (e) {
        console.error(e);
      }
      showDashboard();
    } else {
      currentUser = null;
      showHome();
    }
  });

  // فحص جلسة عند التشغيل
  supabase.auth.getSession().then(({ data }) => {
    if (data?.session?.user) {
      currentUser = data.session.user;
      showDashboard();
    } else {
      showHome();
    }
  });
}

function applyUserDataFromSupabase(profile, wallet) {
  const name = (profile?.first_name || 'مستخدم') + (profile?.last_name ? ' ' + profile.last_name : '');
  const email = currentUser?.email || '';

  const balance = Number(wallet?.balance ?? 0).toFixed(2);

  updateElement('userName', name);
  updateElement('userEmail', email);

  // الرصيد بالداشبورد
  updateElement('cardBalance', balance + ' DC');
  updateElement('totalBalance', balance + ' DC');
  updateElement('cardName', name);

  // بروفايل
  updateElement('profileName', name);
  updateElement('profileNameDisplay', name);
  updateElement('profileEmailValue', email);
  updateElement('profileBalance', balance + ' DC');

  // افاتار
  const firstLetter = name?.charAt(0)?.toUpperCase() || 'U';
  updateElement('userAvatar', firstLetter);
  updateElement('profileAvatar', firstLetter);
}


async function sendMoney(toUserId, amount, note = "") {
    const { error } = await supabase.rpc("send_money", {
        p_to: toUserId,
        p_amount: amount,
        p_note: note
    });
    if (error) throw error;
}

async function loadMyTransactions(limit = 50) {
    const user = await getCurrentUser();
    if (!user) throw new Error("غير مسجل دخول");

    const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .or(`from_user.eq.${user.id},to_user.eq.${user.id}`)
        .order("created_at", { ascending: false })
        .limit(limit);

    if (error) throw error;
    return data;
}
// ==========================================
// DINAR COIN - Full App JavaScript V2.0
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
        body: `في عالم يتجه بسرعة نحو الرقمنة، يبرز دينار كوين كفرصة استثمارية فريدة من نوعها في المنطقة العربية. مع تزايد الاهتمام العالمي بالعملات الرقمية، يقدم دينار كوين بديلاً محلياً يراعي خصوصيات السوق العراقي والعربي.\n\nيتميز دينار كوين بعدة مزايا تجعله خياراً مثالياً للمستثمرين: سعر مستقر مرتبط بالدينار العراقي، منصة آمنة وسهلة الاستخدام، فريق عمل عراقي متخصص، ودعم كامل للغة العربية.\n\nمع خطط التوسع المستقبلية التي تشمل إضافة محفظة متعددة العملات وتكامل مع بوابات الدفع المحلية، يُتوقع أن يشهد دينار كوين نمواً كبيراً في الفترة القادمة. انضم الآن وكن جزءاً من هذه الثورة الرقمية العراقية!`
    },
    {
        id: 1, cat: 'update',
        title: 'إطلاق النسخة التجريبية من دينار كوين',
        summary: 'بداية رحلتنا نحو مستقبل رقمي متطور',
        img: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=300&fit=crop',
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
    loadGlobalStats(); // تحميل الإحصائيات العامة
});

supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
        currentUser = session.user;
        try {
            const { profile, wallet } = await loadMyProfileAndWallet();
            const data = mapSupabaseToUI(profile, wallet);

            // تحديث بيانات البطاقة
            userCardData = data.card;

            // تحديث عناصر واجهة المستخدم الأساسية
            updateElement('userName', data.name);
            updateElement('userEmail', data.email);
            updateElement('userReferralCode', data.referralCode);

            const balance = data.balance.toFixed(2);
            updateElement('cardBalance', balance + ' DC');
            updateElement('totalBalance', balance + ' DC');
            updateElement('cardName', data.name);
            updateElement('referralCode', data.referralCode);

            // تحديث بيانات الملف الشخصي
            updateElement('profileName', data.name);
            updateElement('profileNameDisplay', data.name);
            updateElement('profileEmailValue', data.email);
            updateElement('profileRefCode', data.referralCode);
            updateElement('profileBalance', balance + ' DC');

            // تحديث بيانات البطاقة
            updateElement('cardNum', formatCardNumber(data.card.number));
            updateElement('cardNumFront', formatCardNumber(data.card.number));
            updateElement('cardCVV', data.card.cvv);
            updateElement('cardExpiry', data.card.expiry);

            // تحديث تاريخ الانضمام
            if (data.joinDate) {
                const date = new Date(data.joinDate);
                updateElement('profileJoinDate', date.toLocaleDateString('ar-IQ', {
                    year: 'numeric', month: 'long', day: 'numeric'
                }));
            }

            // تحديث رمز الاستقبال و QR
            updateElement('receiveCode', data.referralCode);
            generateQRCode(data.referralCode);

            // حمّل معاملات Supabase
            await loadTransactionsSupabase();

            showDashboard();
        } catch (e) {
            console.error('Error loading user data:', e);
            showNotification('خطأ', 'فشل تحميل البيانات', 'error');
        }
    } else {
        currentUser = null;
        showHome();
    }
});


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

function loadGlobalStats() {
    // إنشاء العقدة إذا لم تكن موجودة
    database.ref('global_stats').once('value').then(snap => {
        if (!snap.exists()) {
            database.ref('global_stats').set({
                totalUsers: 0,
                totalDistributed: 0,
                totalRemaining: TOTAL_SUPPLY
            });
        }
    });

    // الاستماع للتحديثات
    globalStatsListener = database.ref('global_stats').on('value', (snap) => {
        const data = snap.val() || { totalUsers: 0, totalDistributed: 0, totalRemaining: TOTAL_SUPPLY };
        
        // تحديث شاشة الصفحة الرئيسية
        updateElement('homeUsersCount', data.totalUsers.toLocaleString('ar-IQ'));
        updateElement('homeCoinsRemaining', data.totalRemaining.toLocaleString('ar-IQ'));
        
        // تحديث شاشة الداشبورد
        updateElement('dashUsersCount', data.totalUsers.toLocaleString('ar-IQ'));
        updateElement('dashCoinsRemaining', data.totalRemaining.toLocaleString('ar-IQ'));
        
        // تحديث شاشة التحليلات
        updateElement('statTotalUsers', data.totalUsers.toLocaleString('ar-IQ'));
        updateElement('statCirculating', data.totalDistributed.toLocaleString('ar-IQ'));
        updateElement('statRemaining', data.totalRemaining.toLocaleString('ar-IQ'));
        updateElement('statTotalSupply', TOTAL_SUPPLY.toLocaleString('ar-IQ'));
        
        const distributionPercent = ((data.totalDistributed / TOTAL_SUPPLY) * 100).toFixed(2);
        updateElement('distributionPercent', distributionPercent + '%');
    });
}

async function updateGlobalStats(userCountDelta, coinsDelta) {
    try {
        const ref = database.ref('global_stats');
        const snap = await ref.once('value');
        const current = snap.val() || { totalUsers: 0, totalDistributed: 0, totalRemaining: TOTAL_SUPPLY };
        
        await ref.update({
            totalUsers: Math.max(0, current.totalUsers + userCountDelta),
            totalDistributed: Math.max(0, current.totalDistributed + coinsDelta),
            totalRemaining: Math.max(0, TOTAL_SUPPLY - (current.totalDistributed + coinsDelta))
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
        loadTransactionsSupabase();
    } else if (tab === 'news') {
        document.getElementById('newsScreen').classList.add('active-screen');
        document.querySelector('[data-tab="news"]').classList.add('active');
    } else if (tab === 'analytics') {
        document.getElementById('analyticsScreen').classList.add('active-screen');
        document.querySelector('[data-tab="analytics"]').classList.add('active');
        updateAnalyticsStats();
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
    if (type === 'signup') {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('signupForm').style.display = 'block';
    } else {
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('signupForm').style.display = 'none';
    }
}

// Make showAuthModal available globally for HTML onclick
window.showAuthModal = showAuthModal;


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
    const form = {
        email: document.getElementById('signupEmail').value.trim(),
        password: document.getElementById('signupPassword').value,
        firstName: document.getElementById('signupName').value.trim(),
        lastName: '',
        phone: '',
        country: 'IQ'
    };

    try {
        await signUpWithProfile(form);
        closeAuthModal();
        showNotification('نجاح', 'تم إنشاء الحساب في Supabase', 'success');
    } catch (e) {
        showNotification('خطأ', e.message, 'error');
    }
}

async function login() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    try {
        await signIn(email, password);
        closeAuthModal();
        showNotification('مرحباً', 'تم تسجيل الدخول عبر Supabase', 'success');
    } catch (e) {
        showNotification('خطأ', e.message, 'error');
    }
}

function logout() {
    async function logout() {
        await supabase.auth.signOut();
        currentUser = null;
        userCardData = null;
        cardFlipped = false;
        showHome();
        showNotification('تم', 'تم تسجيل الخروج', 'success');
    }
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
        
        // Dashboard
        const balance = parseFloat(data.balance || 0).toFixed(2);
        updateElement('cardBalance', balance + ' DC');
        updateElement('totalBalance', balance + ' DC');
        updateElement('cardName', data.name);
        updateElement('referralCode', data.referralCode);
        updateElement('referralCount', data.referralCount || 0);
        updateElement('referralEarnings', parseFloat(data.referralEarnings || 0).toFixed(2) + ' DC');

        // Card
        if (data.card) {
            userCardData = data.card;
            updateElement('cardNum', formatCardNumber(data.card.number));
            updateElement('cardNumFront', formatCardNumber(data.card.number)); // تحديث رقم البطاقة في الواجهة الأمامية
            updateElement('cardCVV', data.card.cvv);
            updateElement('cardExpiry', data.card.expiry);
        }
        
        // Profile
        updateElement('profileName', data.name);
        updateElement('profileNameDisplay', data.name);
        updateElement('profileEmailValue', data.email);
        updateElement('profileRefCode', data.referralCode);
        updateElement('profileBalance', balance + ' DC');
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
        updateElement('analyticBalance', balance + ' DC');
        updateElement('analyticReferrals', data.referralCount || 0);
        updateElement('analyticEarnings', parseFloat(data.referralEarnings || 0).toFixed(2) + ' DC');
        
        // Avatar
        const firstLetter = data.name.charAt(0).toUpperCase();
        updateElement('userAvatar', firstLetter);
        updateElement('profileAvatar', firstLetter);
        
        // QR Code للاستقبال
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
// QR CODE
// ==========================================
let qrCodeInstance = null;

function generateQRCode(text) {
    const container = document.getElementById('qrCode');
    if (!container || !text) return;
    
    // مسح الكود القديم
    container.innerHTML = '';
    
    try {
        // إنشاء كود QR جديد
        qrCodeInstance = new QRCode(container, {
            text: text,
            width: 200,
            height: 200,
            colorDark: '#0a1a14',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.H
        });
    } catch (e) {
        console.error('Error generating QR code:', e);
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

// معاملات Supabase
async function loadTransactionsSupabase() {
    const list = document.getElementById('transactionsList');
    if (!list || !currentUser) return;

    const txs = await loadMyTransactions(20); // هذه عندك جاهزة

    if (!txs || txs.length === 0) {
        list.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><p>لا توجد عمليات بعد</p></div>';
        return;
    }

    list.innerHTML = txs.map(tx => {
        const cls = (tx.type === 'send') ? 'negative' : 'positive';
        const sign = (tx.type === 'send') ? '-' : '+';
        const date = new Date(tx.created_at).toLocaleDateString('ar-IQ', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        return `<div class="transaction-item">
            <div class="transaction-icon ${cls}"><i class="fas fa-exchange-alt"></i></div>
            <div class="transaction-details">
                <div class="transaction-type">${tx.note || tx.type}</div>
                <div class="transaction-date">${date}</div>
            </div>
            <div class="transaction-amount ${cls}">${sign}${Number(tx.amount).toFixed(2)} DC</div>
        </div>`;
    }).join('');
}

// ==========================================
// REFERRAL
// ==========================================
function generateReferralCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'DC';
  for (let i = 0; i < 8; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return code; // DCXXXXXXXX (10)
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

async function signUpWithProfile(form) {
  // 1) Auth
  const { data, error } = await supabase.auth.signUp({
    email: form.email,
    password: form.password
  });
  if (error) throw error;

  const userId = data.user?.id;
  if (!userId) throw new Error("لم يتم الحصول على user id");

  // 2) جهّز بيانات مشابهة لـ Firebase القديم
  const name = (form.firstName || '').trim() || (form.name || '').trim() || 'مستخدم';
  const referralCode = generateReferralCode();
  const cardNumber = generateCardNumber();
  const cardCVV = generateCVV();
  const cardExpiry = generateExpiry();

  // 3) خزّن profile (UPsert حتى ما يصير 409)
  const { error: pErr } = await supabase.from("profiles").upsert({
    id: userId,
    name,
    email: form.email,
    first_name: form.firstName || name,
    last_name: form.lastName || '',
    phone: form.phone || '',
    country: form.country || 'IQ',
    referral_code: referralCode,
    join_date: new Date().toISOString(),
    card_number: cardNumber,
    card_cvv: cardCVV,
    card_expiry: cardExpiry
  });
  if (pErr) throw pErr;

  // 4) أنشئ محفظة مع مكافأة الترحيب
  const { error: wErr } = await supabase.from("wallets").upsert({
    user_id: userId,
    balance: WELCOME_BONUS
  });
  if (wErr) throw wErr;

  // 5) سجّل معاملة المكافأة
  const { error: tErr } = await supabase.from("transactions").insert({
    from_user: null,
    to_user: userId,
    type: "topup",
    amount: WELCOME_BONUS,
    note: "مكافأة الانضمام",
    status: "completed"
  });
  if (tErr) throw tErr;

  return data;
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
        
        // كل 10 إحالات يحصل على مكافأة
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
            
            // تحديث العملات الموزعة
            await updateGlobalStats(0, REFERRAL_BONUS);
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


function mapSupabaseToUI(profile, wallet) {
  const data = {
    name: profile?.name || profile?.first_name || 'مستخدم',
    email: profile?.email || currentUser?.email || '',
    referralCode: profile?.referral_code || 'DC--------',
    joinDate: profile?.join_date || profile?.created_at || new Date().toISOString(),
    balance: Number(wallet?.balance ?? 0),
    card: {
      number: profile?.card_number || '',
      cvv: profile?.card_cvv || '',
      expiry: profile?.card_expiry || '',
      holder: profile?.name || profile?.first_name || ''
    }
  };
  return data;
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

    const { error } = await supabase.from("transactions").insert({
      from_user: null,
      to_user: currentUser.id,
      type: "topup",
      amount: amount,
      note: `طلب شراء - ${total.toLocaleString('ar-IQ')} IQD`,
      status: "pending"
    });
    if (error) throw error;

    closeBuyModal();
    showNotification('تم!', `طلب شراء ${amount} DC أُرسل بنجاح`, 'success');
    await loadTransactionsSupabase();
  } catch (e) {
    showNotification('خطأ', e.message || 'فشل الطلب', 'error');
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
    // توليد QR عند فتح المودال
    const code = document.getElementById('receiveCode')?.textContent || '';
    generateQRCode(code);
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
    const { error } = await supabase.rpc("send_by_referral", {
      p_code: recipientCode,
      p_amount: amount,
      p_note: note
    });
    if (error) throw error;

    closeSendModal();
    showNotification('تم!', `أُرسل ${amount} DC بنجاح`, 'success');

    // إعادة تحميل الرصيد والمعاملات
    const { profile, wallet } = await loadMyProfileAndWallet();
    const data = mapSupabaseToUI(profile, wallet);
    updateElement('cardBalance', data.balance.toFixed(2) + ' DC');
    updateElement('totalBalance', data.balance.toFixed(2) + ' DC');
    await loadTransactionsSupabase();
  } catch (e) {
    showNotification('خطأ', e.message || 'فشلت العملية', 'error');
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
    const labels = {
        update: 'تحديث',
        guide: 'دليل',
        invest: 'استثمار'
    };
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
    // Stats are already updated by loadUserData and loadGlobalStats
}

// ==========================================
// PROFILE
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
        const isActive = toggle.classList.toggle('active');
        
        // حفظ الإعدادات في localStorage
        localStorage.setItem(`setting-${setting}`, isActive ? 'true' : 'false');
        
        // تطبيق الإعدادات
        if (setting === 'darkmode') {
            applyDarkMode(isActive);
        } else if (setting === 'notifications') {
            applyNotifications(isActive);
        } else if (setting === 'biometric') {
            applyBiometric(isActive);
        }
        
        showNotification('تم', `تم ${isActive ? 'تفعيل' : 'إلغاء'} ${getSettingName(setting)}`, 'success');
    }
}

function getSettingName(setting) {
    const names = {
        'darkmode': 'الوضع الليلي',
        'notifications': 'الإشعارات',
        'biometric': 'تسجيل الدخول بالبصمة'
    };
    return names[setting] || setting;
}

function applyDarkMode(isActive) {
    if (isActive) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
}

function applyNotifications(isActive) {
    if (isActive && 'Notification' in window) {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                console.log('تم تفعيل الإشعارات');
            }
        });
    }
}

function applyBiometric(isActive) {
    if (isActive) {
        console.log('تم تفعيل البصمة (متاح في التحديث القادم)');
    }
}

// استعادة الإعدادات عند تحميل الصفحة
function loadSettings() {
    const darkmode = localStorage.getItem('setting-darkmode') === 'true';
    const notifications = localStorage.getItem('setting-notifications') === 'true';
    const biometric = localStorage.getItem('setting-biometric') === 'true';
    
    if (darkmode) {
        document.getElementById('toggle-darkmode')?.classList.add('active');
        applyDarkMode(true);
    }
    if (notifications) {
        document.getElementById('toggle-notifications')?.classList.add('active');
    }
    if (biometric) {
        document.getElementById('toggle-biometric')?.classList.add('active');
    }
}

// تحميل الإعدادات عند بدء التطبيق
setTimeout(loadSettings, 100);


// ==========================================
// LANGUAGE FUNCTIONS
// ==========================================
function showLanguageModal() {
    const languages = [
        { code: 'ar', name: 'العربية', flag: '🇮🇶' },
        { code: 'en', name: 'English', flag: '🇺🇸' },
        { code: 'ku', name: 'کوردی', flag: '🇮🇶' }
    ];
    
    const currentLang = localStorage.getItem('app-language') || 'ar';
    
    let html = `
        <div class="modal-overlay active">
            <div class="modal-sheet modal-small">
                <div class="modal-handle"></div>
                <button class="modal-close-btn" onclick="closeLanguageModal()">
                    <i class="fas fa-times"></i>
                </button>
                <div class="modal-icon-header">
                    <div class="modal-icon-circle receive">
                        <i class="fas fa-language"></i>
                    </div>
                    <h2>اختر اللغة</h2>
                </div>
                <div class="settings-card" style="margin-top:20px;">
    `;
    
    languages.forEach(lang => {
        const active = lang.code === currentLang ? 'style="background:var(--gold-light);"' : '';
        html += `
            <div class="settings-item" onclick="changeLanguage('${lang.code}')" ${active}>
                <div class="settings-item-icon">${lang.flag}</div>
                <div class="settings-item-content">
                    <span class="settings-item-label">${lang.name}</span>
                </div>
                ${lang.code === currentLang ? '<i class="fas fa-check" style="color:var(--gold-primary);"></i>' : ''}
            </div>
        `;
    });
    
    html += `
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', html);
}

function closeLanguageModal() {
    const modal = document.querySelector('.modal-overlay:last-child');
    if (modal) modal.remove();
}

function changeLanguage(langCode) {
    localStorage.setItem('app-language', langCode);
    showNotification('تم', 'سيتم تطبيق اللغة في التحديث القادم', 'success');
    closeLanguageModal();
    
    // تحديث عرض اللغة في الإعدادات
    const langNames = { ar: 'العربية', en: 'English', ku: 'کوردی' };
    const langValueEl = document.querySelector('.settings-item:has(.fa-language) .settings-item-value');
    if (langValueEl) {
        langValueEl.textContent = langNames[langCode];
    }
}

// ==========================================
// SECURITY & PRIVACY MODAL
// ==========================================
function showSecurityModal() {
    const html = `
        <div class="modal-overlay active">
            <div class="modal-sheet">
                <div class="modal-handle"></div>
                <button class="modal-close-btn" onclick="closeSecurityModal()">
                    <i class="fas fa-times"></i>
                </button>
                <div class="modal-icon-header">
                    <div class="modal-icon-circle receive">
                        <i class="fas fa-shield-alt"></i>
                    </div>
                    <h2>الأمان والخصوصية</h2>
                </div>
                <div style="padding:20px;">
                    <h3 style="color:var(--gold-primary);margin-bottom:15px;">نصائح الأمان</h3>
                    <div style="background:rgba(255,255,255,0.05);padding:15px;border-radius:12px;margin-bottom:15px;">
                        <p style="line-height:1.8;">
                            🔐 استخدم كلمة مرور قوية<br>
                            🔒 لا تشارك بياناتك مع أحد<br>
                            📱 فعّل المصادقة الثنائية<br>
                            🛡️ تحقق من عنوان الموقع<br>
                            ⚠️ احذر من الروابط المشبوهة
                        </p>
                    </div>
                    <h3 style="color:var(--gold-primary);margin-bottom:15px;">سياسة الخصوصية</h3>
                    <div style="background:rgba(255,255,255,0.05);padding:15px;border-radius:12px;">
                        <p style="line-height:1.8;">
                            نحن نحترم خصوصيتك ونحمي بياناتك الشخصية. 
                            جميع المعلومات مشفرة ومخزنة بشكل آمن.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', html);
}

function closeSecurityModal() {
    const modal = document.querySelector('.modal-overlay:last-child');
    if (modal) modal.remove();
}

// ==========================================
// HELP & SUPPORT MODAL
// ==========================================
function showHelpModal() {
    const html = `
        <div class="modal-overlay active">
            <div class="modal-sheet">
                <div class="modal-handle"></div>
                <button class="modal-close-btn" onclick="closeHelpModal()">
                    <i class="fas fa-times"></i>
                </button>
                <div class="modal-icon-header">
                    <div class="modal-icon-circle receive">
                        <i class="fas fa-question-circle"></i>
                    </div>
                    <h2>المساعدة والدعم</h2>
                </div>
                <div style="padding:20px;">
                    <h3 style="color:var(--gold-primary);margin-bottom:15px;">الأسئلة الشائعة</h3>
                    
                    <div style="margin-bottom:20px;">
                        <h4 style="color:#fff;margin-bottom:8px;">❓ كيف أشتري دينار كوين؟</h4>
                        <p style="color:rgba(255,255,255,0.7);line-height:1.6;">
                            انقر على زر "شراء" وأدخل الكمية المطلوبة. سيتم مراجعة طلبك من الإدارة.
                        </p>
                    </div>
                    
                    <div style="margin-bottom:20px;">
                        <h4 style="color:#fff;margin-bottom:8px;">❓ كيف أحصل على مكافأة الإحالة؟</h4>
                        <p style="color:rgba(255,255,255,0.7);line-height:1.6;">
                            شارك رمز الإحالة الخاص بك. ستحصل على 0.25 DC عن كل صديق يسجل.
                        </p>
                    </div>
                    
                    <div style="margin-bottom:20px;">
                        <h4 style="color:#fff;margin-bottom:8px;">❓ هل التطبيق آمن؟</h4>
                        <p style="color:rgba(255,255,255,0.7);line-height:1.6;">
                            نعم، نستخدم تشفير عالي المستوى وFirebase لحماية بياناتك.
                        </p>
                    </div>
                    
                    <h3 style="color:var(--gold-primary);margin:20px 0 15px;">تواصل معنا</h3>
                    <div style="background:rgba(255,255,255,0.05);padding:15px;border-radius:12px;">
                        <p style="line-height:1.8;">
                            📧 البريد: support@dinarcoin.iq<br>
                            📱 الهاتف: +964 XXX XXX XXXX<br>
                            💬 الدردشة: متاحة قريباً
                        </p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', html);
}

function closeHelpModal() {
    const modal = document.querySelector('.modal-overlay:last-child');
    if (modal) modal.remove();
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
    }
});

document.addEventListener('keypress', e => {
    if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
        e.preventDefault();
    }
});