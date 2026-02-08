// ==========================================
// DINAR COIN - Full App JavaScript V3.0 (Supabase Only - NO FIREBASE)
// ==========================================

// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/Dinar-Queen/sw.js').catch(() => {});
    });
}

// ==========================================
// SUPABASE CONFIGURATION
// ==========================================
var SUPABASE_URL = "https://umlbxdcgpdifxzijujvj.supabase.co";
var SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtbGJ4ZGNncGRpZnh6aWp1anZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0NzQzODUsImV4cCI6MjA4NjA1MDM4NX0.Ld3fU2_B4eu803BsDYKQ0ofg69WxQPJcscGf93lnM3w";
var supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==========================================
// GLOBAL VARIABLES
// ==========================================
let currentUser = null;
let userCardData = null;
let cardFlipped = false;
let cardNumVisible = false;
let cvvVisible = false;

const PRICE_PER_COIN = 1000;
const TOTAL_SUPPLY = 1000000;
const WELCOME_BONUS = 1.0;
const REFERRAL_BONUS = 0.25;

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

// توليد رقم بطاقة عشوائي
function generateCardNumber() {
    let num = '5464';
    for (let i = 0; i < 12; i++) {
        num += Math.floor(Math.random() * 10);
    }
    return num;
}

// توليد CVV عشوائي
function generateCVV() {
    return String(Math.floor(100 + Math.random() * 900));
}

// توليد تاريخ انتهاء البطاقة
function generateExpiry() {
    const month = String(Math.floor(1 + Math.random() * 12)).padStart(2, '0');
    const year = String(new Date().getFullYear() + 5).slice(-2);
    return `${month}/${year}`;
}

// توليد رمز إحالة فريد
function generateReferralCode() {
    const numbers = '0123456789';
    let code = 'DC';
    for (let i = 0; i < 8; i++) {
        code += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }
    return code;
}

// تنسيق رقم البطاقة
function formatCardNumber(num) {
    if (!num) return '**** **** **** ****';
    return num.match(/.{1,4}/g)?.join(' ') || num;
}

// تحديث عنصر HTML
function updateElement(id, value) {
    const el = document.getElementById(id);
    if (el) {
        if (el.tagName === 'INPUT') el.value = value;
        else el.textContent = value;
    }
}

// ==========================================
// SUPABASE AUTH FUNCTIONS
// ==========================================

// تسجيل مستخدم جديد مع ملف تعريف كامل
async function signUpWithProfile(form) {
    // 1) إنشاء حساب Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
    });
    
    if (authError) throw authError;
    
    const userId = authData.user?.id;
    if (!userId) throw new Error("لم يتم الحصول على user id");

    // 2) توليد بيانات البطاقة ورمز الإحالة
    const cardNumber = generateCardNumber();
    const cardCVV = generateCVV();
    const cardExpiry = generateExpiry();
    const referralCode = generateReferralCode();

    // 3) إنشاء ملف تعريف في profiles
    const { error: profileError } = await supabase
        .from("profiles")
        .insert({
            id: userId,
            email: form.email,
            first_name: form.firstName,
            last_name: form.lastName || '',
            phone: form.phone || '',
            country: form.country || 'IQ',
            card_number: cardNumber,
            card_cvv: cardCVV,
            card_expiry: cardExpiry,
            referral_code: referralCode,
            join_date: new Date().toISOString(),
            referred_by: form.referredBy || null
        });
    
    if (profileError) throw profileError;

    // 4) إنشاء محفظة مع مكافأة الترحيب
    const { error: walletError } = await supabase
        .from("wallets")
        .insert({ 
            user_id: userId, 
            balance: WELCOME_BONUS 
        });
    
    if (walletError) throw walletError;

    // 5) تسجيل معاملة مكافأة الترحيب
    const { error: txError } = await supabase
        .from("transactions")
        .insert({
            from_user: null,
            to_user: userId,
            type: 'welcome_bonus',
            amount: WELCOME_BONUS,
            note: 'مكافأة الترحيب',
            status: 'completed'
        });
    
    if (txError) console.error('Error adding welcome transaction:', txError);

    // 6) إضافة مكافأة إحالة إن وجدت
    if (form.referredBy) {
        try {
            await supabase.rpc('add_referral_bonus', {
                p_referrer_code: form.referredBy,
                p_new_user_id: userId
            });
        } catch (e) {
            console.error('Error adding referral bonus:', e);
        }
    }

    // 7) تحديث الإحصائيات العامة
    try {
        await supabase.rpc('update_global_stats');
    } catch (e) {
        console.error('Error updating global stats:', e);
    }

    return authData;
}

// تسجيل الدخول
async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
}

// الحصول على المستخدم الحالي
async function getCurrentUser() {
    const { data } = await supabase.auth.getUser();
    return data.user;
}

// تحميل ملف تعريف ومحفظة المستخدم
async function loadMyProfileAndWallet() {
    const user = await getCurrentUser();
    if (!user) throw new Error("غير مسجل دخول");

    // تحميل الملف الشخصي
    const { data: profiles, error: pErr } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .limit(1);

    if (pErr) throw pErr;

    let profile = profiles?.[0];
    if (!profile) {
        // إنشاء profile تلقائيًا إذا لم يكن موجودًا
        const cardNumber = generateCardNumber();
        const cardCVV = generateCVV();
        const cardExpiry = generateExpiry();
        const referralCode = generateReferralCode();

        const { error: createErr } = await supabase.from("profiles").insert({
            id: user.id,
            email: user.email,
            first_name: "",
            last_name: "",
            phone: "",
            country: "IQ",
            card_number: cardNumber,
            card_cvv: cardCVV,
            card_expiry: cardExpiry,
            referral_code: referralCode,
            join_date: new Date().toISOString()
        });

        if (createErr) throw createErr;

        profile = {
            id: user.id,
            email: user.email,
            card_number: cardNumber,
            card_cvv: cardCVV,
            card_expiry: cardExpiry,
            referral_code: referralCode
        };
    }

    // تحميل المحفظة
    const { data: wallets, error: wErr } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", user.id)
        .limit(1);

    if (wErr) throw wErr;

    let wallet = wallets?.[0];
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

// تحميل المعاملات
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
    return data || [];
}

// تحميل الإحصائيات العامة
async function loadGlobalStats() {
    try {
        const { data, error } = await supabase
            .from("global_stats")
            .select("*")
            .eq("id", 1)
            .limit(1);

        if (error) throw error;

        const stats = data?.[0] || { total_users: 0, total_distributed: 0, total_remaining: TOTAL_SUPPLY };

        // تحديث شاشة الرئيسية
        updateElement('homeUsersCount', Number(stats.total_users).toLocaleString('ar-IQ'));
        updateElement('homeCoinsRemaining', Number(stats.total_remaining).toLocaleString('ar-IQ'));

        // تحديث شاشة الداشبورد
        updateElement('dashUsersCount', Number(stats.total_users).toLocaleString('ar-IQ'));
        updateElement('dashCoinsRemaining', Number(stats.total_remaining).toLocaleString('ar-IQ'));

        // تحديث شاشة التحليلات
        updateElement('statTotalUsers', Number(stats.total_users).toLocaleString('ar-IQ'));
        updateElement('statCirculating', Number(stats.total_distributed).toLocaleString('ar-IQ'));
        updateElement('statRemaining', Number(stats.total_remaining).toLocaleString('ar-IQ'));
        updateElement('statTotalSupply', TOTAL_SUPPLY.toLocaleString('ar-IQ'));

        const distributionPercent = ((stats.total_distributed / TOTAL_SUPPLY) * 100).toFixed(2);
        updateElement('distributionPercent', distributionPercent + '%');

    } catch (e) {
        console.error('Error loading global stats:', e);
    }
}


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
// APP INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    createParticles();
    setupEventListeners();
    renderNewsArticles();
    loadGlobalStats();

    // التحقق من الجلسة الحالية
    supabase.auth.getSession().then(({ data }) => {
        if (data?.session?.user) {
            currentUser = data.session.user;
            loadUserDataAndShowDashboard();
        } else {
            showHome();
        }
    });
});

// مراقبة تغييرات حالة المصادقة
supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
        currentUser = session.user;
        await loadUserDataAndShowDashboard();
    } else {
        currentUser = null;
        userCardData = null;
        showHome();
    }
});

// تحميل بيانات المستخدم وعرض الداشبورد
async function loadUserDataAndShowDashboard() {
    try {
        const { profile, wallet } = await loadMyProfileAndWallet();
        
        // حفظ بيانات البطاقة
        userCardData = {
            number: profile.card_number,
            cvv: profile.card_cvv,
            expiry: profile.card_expiry
        };

        // بناء اسم المستخدم
        const name = (profile.first_name || 'مستخدم') + (profile.last_name ? ' ' + profile.last_name : '');
        const email = currentUser?.email || '';
        const balance = Number(wallet.balance || 0).toFixed(2);
        const referralCode = profile.referral_code || '';

        // تحديث العناصر الأساسية
        updateElement('userName', name);
        updateElement('userEmail', email);
        updateElement('userReferralCode', referralCode);

        // تحديث الداشبورد
        updateElement('cardBalance', balance + ' DC');
        updateElement('totalBalance', balance + ' DC');
        updateElement('cardName', name);
        updateElement('referralCode', referralCode);
        updateElement('referralCount', profile.referral_count || 0);
        updateElement('referralEarnings', (profile.referral_earnings || 0).toFixed(2) + ' DC');

        // تحديث بيانات البطاقة
        updateElement('cardNum', formatCardNumber(profile.card_number));
        updateElement('cardNumFront', formatCardNumber(profile.card_number));
        updateElement('cardCVV', profile.card_cvv);
        updateElement('cardExpiry', profile.card_expiry);

        // تحديث الملف الشخصي
        updateElement('profileName', name);
        updateElement('profileNameDisplay', name);
        updateElement('profileEmailValue', email);
        updateElement('profileRefCode', referralCode);
        updateElement('profileBalance', balance + ' DC');
        updateElement('profileCardNum', formatCardNumber(profile.card_number));
        updateElement('profileCVV', '***');
        updateElement('profileExpiry', profile.card_expiry);

        // تحديث التحليلات
        updateElement('analyticBalance', balance + ' DC');
        updateElement('analyticReferrals', profile.referral_count || 0);
        updateElement('analyticEarnings', (profile.referral_earnings || 0).toFixed(2) + ' DC');

        // تحديث تاريخ الانضمام
        if (profile.join_date) {
            const date = new Date(profile.join_date);
            updateElement('profileJoinDate', date.toLocaleDateString('ar-IQ', {
                year: 'numeric', month: 'long', day: 'numeric'
            }));
        }

        // تحديث Avatar
        const firstLetter = name.charAt(0).toUpperCase() || 'U';
        updateElement('userAvatar', firstLetter);
        updateElement('profileAvatar', firstLetter);

        // تحديث رمز الاستقبال و QR
        updateElement('receiveCode', referralCode);
        generateQRCode(referralCode);

        // تحميل المعاملات
        await loadTransactionsSupabase();

        // عرض الداشبورد
        showDashboard();

    } catch (e) {
        console.error('Error loading user data:', e);
        showNotification('خطأ', 'فشل تحميل البيانات', 'error');
    }
}

// ==========================================
// SCREEN MANAGEMENT
// ==========================================
function showHome() {
    document.getElementById('homeScreen').classList.add('active-screen');
    document.getElementById('dashboardScreen').classList.remove('active-screen');
    const bottomNav = document.getElementById('bottomNav');
    if (bottomNav) bottomNav.style.display = 'none';
}

function showDashboard() {
    document.getElementById('homeScreen').classList.remove('active-screen');
    document.getElementById('dashboardScreen').classList.add('active-screen');
    const bottomNav = document.getElementById('bottomNav');
    if (bottomNav) bottomNav.style.display = 'flex';
    switchTab('home');
}

function switchTab(tab) {
    const screens = ['dashboardScreen', 'newsScreen', 'analyticsScreen', 'profileScreen'];
    screens.forEach(s => {
        const screen = document.getElementById(s);
        if (screen) screen.classList.remove('active-screen');
    });
    
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(t => t.classList.remove('active'));
    
    if (tab === 'home') {
        document.getElementById('dashboardScreen')?.classList.add('active-screen');
        document.querySelector('[data-tab="home"]')?.classList.add('active');
        loadTransactionsSupabase();
    } else if (tab === 'news') {
        document.getElementById('newsScreen')?.classList.add('active-screen');
        document.querySelector('[data-tab="news"]')?.classList.add('active');
    } else if (tab === 'analytics') {
        document.getElementById('analyticsScreen')?.classList.add('active-screen');
        document.querySelector('[data-tab="analytics"]')?.classList.add('active');
        loadGlobalStats();
    } else if (tab === 'profile') {
        document.getElementById('profileScreen')?.classList.add('active-screen');
        document.querySelector('[data-tab="profile"]')?.classList.add('active');
    }
}


// ==========================================
// AUTH FUNCTIONS
// ==========================================
function showAuthModal(type) {
    const authModal = document.getElementById('authModal');
    if (!authModal) return;
    
    authModal.classList.add('active');
    if (type === 'signup') {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('signupForm').style.display = 'block';
    } else {
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('signupForm').style.display = 'none';
    }
}

function closeAuthModal() {
    document.getElementById('authModal')?.classList.remove('active');
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
        email: document.getElementById('signupEmail')?.value.trim(),
        password: document.getElementById('signupPassword')?.value,
        firstName: document.getElementById('signupName')?.value.trim() || 'مستخدم',
        lastName: '',
        phone: '',
        country: 'IQ',
        referredBy: null
    };

    if (!form.email || !form.password) {
        showNotification('خطأ', 'الرجاء ملء جميع الحقول', 'error');
        return;
    }

    try {
        await signUpWithProfile(form);
        closeAuthModal();
        showNotification('نجاح', 'تم إنشاء الحساب بنجاح! مرحباً بك في دينار كوين', 'success');
    } catch (e) {
        console.error('Signup error:', e);
        showNotification('خطأ', e.message || 'فشل إنشاء الحساب', 'error');
    }
}

async function login() {
    const email = document.getElementById('loginEmail')?.value.trim();
    const password = document.getElementById('loginPassword')?.value;

    if (!email || !password) {
        showNotification('خطأ', 'الرجاء إدخال البريد وكلمة المرور', 'error');
        return;
    }

    try {
        await signIn(email, password);
        closeAuthModal();
        showNotification('مرحباً', 'تم تسجيل الدخول بنجاح', 'success');
    } catch (e) {
        console.error('Login error:', e);
        showNotification('خطأ', e.message || 'فشل تسجيل الدخول', 'error');
    }
}

async function logout() {
    try {
        await supabase.auth.signOut();
        currentUser = null;
        userCardData = null;
        cardFlipped = false;
        showHome();
        showNotification('تم', 'تم تسجيل الخروج بنجاح', 'success');
    } catch (e) {
        console.error('Logout error:', e);
        showNotification('خطأ', 'فشل تسجيل الخروج', 'error');
    }
}

// ==========================================
// CARD FUNCTIONS
// ==========================================
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
// QR CODE GENERATION
// ==========================================
let qrCodeInstance = null;

function generateQRCode(text) {
    const container = document.getElementById('qrCode');
    if (!container || !text) return;
    
    container.innerHTML = '';
    
    try {
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
// TRANSACTIONS FUNCTIONS
// ==========================================
async function loadTransactionsSupabase() {
    const list = document.getElementById('transactionsList');
    if (!list || !currentUser) return;

    try {
        const txs = await loadMyTransactions(20);

        if (!txs || txs.length === 0) {
            list.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><p>لا توجد عمليات بعد</p></div>';
            return;
        }

        list.innerHTML = txs.map(tx => {
            const isFromMe = tx.from_user === currentUser.id;
            const cls = isFromMe ? 'negative' : 'positive';
            const sign = isFromMe ? '-' : '+';
            
            const iconMap = {
                send: 'paper-plane',
                receive: 'download',
                topup: 'shopping-cart',
                withdraw: 'hand-holding-usd',
                welcome_bonus: 'gift',
                referral_bonus: 'users'
            };
            const icon = iconMap[tx.type] || 'exchange-alt';
            
            const typeNames = {
                send: 'إرسال',
                receive: 'استقبال',
                topup: 'شراء',
                withdraw: 'سحب',
                welcome_bonus: 'مكافأة ترحيب',
                referral_bonus: 'مكافأة إحالة'
            };
            const typeName = typeNames[tx.type] || tx.type;
            
            const date = new Date(tx.created_at).toLocaleDateString('ar-IQ', {
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });

            return `<div class="transaction-item">
                <div class="transaction-icon ${cls}"><i class="fas fa-${icon}"></i></div>
                <div class="transaction-details">
                    <div class="transaction-type">${typeName}</div>
                    <div class="transaction-date">${date}${tx.note ? ' - ' + tx.note : ''}</div>
                </div>
                <div class="transaction-amount ${cls}">${sign}${Number(tx.amount).toFixed(2)} DC</div>
            </div>`;
        }).join('');

    } catch (e) {
        console.error('Error loading transactions:', e);
        list.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>خطأ في تحميل العمليات</p></div>';
    }
}

// ==========================================
// MODAL FUNCTIONS
// ==========================================

// Buy Modal
function showBuyModal() {
    document.getElementById('buyModal')?.classList.add('active');
}

function closeBuyModal() {
    document.getElementById('buyModal')?.classList.remove('active');
    document.getElementById('buyAmount').value = '';
    document.getElementById('totalIQD').textContent = '0 IQD';
}

function calculateBuyTotal() {
    const amount = parseFloat(document.getElementById('buyAmount')?.value || 0);
    const total = amount * PRICE_PER_COIN;
    updateElement('totalIQD', total.toLocaleString('ar-IQ') + ' IQD');
}

async function submitBuyRequest() {
    const amount = parseFloat(document.getElementById('buyAmount')?.value || 0);
    
    if (amount <= 0) {
        showNotification('خطأ', 'الرجاء إدخال كمية صحيحة', 'error');
        return;
    }

    try {
        const result = await supabase.rpc('request_topup', {
            p_amount: amount,
            p_note: 'طلب شراء'
        });

        if (result.error) throw result.error;

        const data = result.data;
        if (data && !data.success) {
            showNotification('خطأ', data.error || 'فشل إرسال الطلب', 'error');
            return;
        }

        closeBuyModal();
        showNotification('نجاح', 'تم إرسال طلبك للإدارة', 'success');
    } catch (e) {
        console.error('Buy request error:', e);
        showNotification('خطأ', 'فشل إرسال الطلب', 'error');
    }
}

// Send Modal
function showSendModal() {
    document.getElementById('sendModal')?.classList.add('active');
}

function closeSendModal() {
    document.getElementById('sendModal')?.classList.remove('active');
    document.getElementById('recipientCode').value = '';
    document.getElementById('sendAmount').value = '';
    document.getElementById('sendNote').value = '';
}

async function sendCoins() {
    const recipientCode = document.getElementById('recipientCode')?.value.trim();
    const amount = parseFloat(document.getElementById('sendAmount')?.value || 0);
    const note = document.getElementById('sendNote')?.value.trim();

    if (!recipientCode) {
        showNotification('خطأ', 'الرجاء إدخال رمز المستلم', 'error');
        return;
    }

    if (amount <= 0) {
        showNotification('خطأ', 'الرجاء إدخال كمية صحيحة', 'error');
        return;
    }

    try {
        const result = await supabase.rpc('send_by_referral', {
            p_referral_code: recipientCode,
            p_amount: amount,
            p_note: note || ''
        });

        if (result.error) throw result.error;

        const data = result.data;
        if (data && !data.success) {
            showNotification('خطأ', data.error || 'فشل إرسال العملات', 'error');
            return;
        }

        closeSendModal();
        showNotification('نجاح', 'تم إرسال العملات بنجاح', 'success');
        
        // إعادة تحميل البيانات
        await loadUserDataAndShowDashboard();
        
    } catch (e) {
        console.error('Send error:', e);
        showNotification('خطأ', 'فشل إرسال العملات', 'error');
    }
}

// Receive Modal
function showReceiveModal() {
    document.getElementById('receiveModal')?.classList.add('active');
}

function closeReceiveModal() {
    document.getElementById('receiveModal')?.classList.remove('active');
}

function copyReceiveCode() {
    const code = document.getElementById('receiveCode')?.textContent;
    if (!code) return;
    
    navigator.clipboard.writeText(code).then(() => {
        showNotification('نجاح', 'تم نسخ الرمز', 'success');
    }).catch(() => {
        showNotification('خطأ', 'فشل نسخ الرمز', 'error');
    });
}

// Edit Name Modal
function showEditNameModal() {
    document.getElementById('editNameModal')?.classList.add('active');
    const currentName = document.getElementById('profileNameDisplay')?.textContent || '';
    document.getElementById('editNameInput').value = currentName;
}

function closeEditNameModal() {
    document.getElementById('editNameModal')?.classList.remove('active');
}

async function saveNewName() {
    const newName = document.getElementById('editNameInput')?.value.trim();
    
    if (!newName) {
        showNotification('خطأ', 'الرجاء إدخال اسم صحيح', 'error');
        return;
    }

    if (!currentUser) {
        showNotification('خطأ', 'غير مسجل دخول', 'error');
        return;
    }

    try {
        const { error } = await supabase
            .from('profiles')
            .update({ first_name: newName })
            .eq('id', currentUser.id);

        if (error) throw error;

        closeEditNameModal();
        showNotification('نجاح', 'تم تحديث الاسم بنجاح', 'success');
        
        // إعادة تحميل البيانات
        await loadUserDataAndShowDashboard();
        
    } catch (e) {
        console.error('Update name error:', e);
        showNotification('خطأ', 'فشل تحديث الاسم', 'error');
    }
}

// ==========================================
// NEWS FUNCTIONS
// ==========================================
function renderNewsArticles() {
    const container = document.getElementById('newsArticlesList');
    if (!container) return;
    
    container.innerHTML = newsArticles.map(article => `
        <div class="news-card" onclick="openArticle(${article.id})">
            <div class="news-img" style="background-image:url('${article.img}');"></div>
            <div class="news-content">
                <div class="news-meta">
                    <span class="news-cat ${article.cat}">${getCategoryName(article.cat)}</span>
                    <span class="news-date">${new Date(article.date).toLocaleDateString('ar-IQ')}</span>
                </div>
                <h3 class="news-title">${article.title}</h3>
                <p class="news-summary">${article.summary}</p>
            </div>
        </div>
    `).join('');
}

function getCategoryName(cat) {
    const names = {
        invest: 'استثمار',
        update: 'تحديث',
        guide: 'دليل',
        news: 'أخبار'
    };
    return names[cat] || cat;
}

function openArticle(id) {
    const article = newsArticles.find(a => a.id === id);
    if (!article) return;
    
    const modal = document.getElementById('articleModal');
    const content = document.getElementById('articleContent');
    
    if (!modal || !content) return;
    
    content.innerHTML = `
        <div class="article-header">
            <img src="${article.img}" alt="${article.title}" class="article-img">
            <div class="article-meta">
                <span class="article-cat ${article.cat}">${getCategoryName(article.cat)}</span>
                <span class="article-date">${new Date(article.date).toLocaleDateString('ar-IQ', {
                    year: 'numeric', month: 'long', day: 'numeric'
                })}</span>
            </div>
            <h1 class="article-title">${article.title}</h1>
        </div>
        <div class="article-body">${article.body.replace(/\n/g, '<br><br>')}</div>
    `;
    
    modal.classList.add('active');
}

function closeArticleModal() {
    document.getElementById('articleModal')?.classList.remove('active');
}


// ==========================================
// SETTINGS FUNCTIONS
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
    
    html += `</div></div></div>`;
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
}

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
                            جميع المعلومات مشفرة ومخزنة بشكل آمن عبر Supabase.
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
                            نعم، نستخدم تشفير عالي المستوى وSupabase لحماية بياناتك.
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

function toggleSetting(settingId) {
    const toggle = document.getElementById(`toggle-${settingId}`);
    if (!toggle) return;
    
    const isActive = toggle.classList.toggle('active');
    localStorage.setItem(`setting-${settingId}`, isActive);
    
    if (settingId === 'darkmode') {
        applyDarkMode(isActive);
    }
    
    showNotification('تم', `تم ${isActive ? 'تفعيل' : 'تعطيل'} الإعداد`, 'success');
}

function applyDarkMode(enabled) {
    if (enabled) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
}

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

// ==========================================
// PARTICLES ANIMATION
// ==========================================
function createParticles() {
    const container = document.getElementById('particles');
    if (!container) return;
    
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.width = particle.style.height = (Math.random() * 3 + 1) + 'px';
        particle.style.animationDuration = (Math.random() * 10 + 10) + 's';
        particle.style.animationDelay = Math.random() * 5 + 's';
        container.appendChild(particle);
    }
}

// ==========================================
// EVENT LISTENERS SETUP
// ==========================================
function setupEventListeners() {
    // Close modals on overlay click
    window.addEventListener('click', e => {
        if (e.target.classList.contains('modal-overlay')) {
            e.target.classList.remove('active');
        }
    });

    // Prevent Enter key default on inputs
    document.addEventListener('keypress', e => {
        if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
            e.preventDefault();
        }
    });
}

// ==========================================
// NOTIFICATION SYSTEM
// ==========================================
function showNotification(title, msg, type = 'success') {
    const notification = document.getElementById('successNotification');
    if (!notification) return;
    
    updateElement('notificationTitle', title);
    updateElement('notificationMessage', msg);
    
    notification.className = `toast-notification ${type} active`;
    setTimeout(() => notification.classList.remove('active'), 4000);
}

function closeNotification() {
    document.getElementById('successNotification')?.classList.remove('active');
}

// ==========================================
// MAKE FUNCTIONS GLOBAL
// ==========================================
// Make functions available globally for HTML onclick handlers
window.showAuthModal = showAuthModal;
window.closeAuthModal = closeAuthModal;
window.switchAuthForm = switchAuthForm;
window.signup = signup;
window.login = login;
window.logout = logout;
window.switchTab = switchTab;
window.flipCard = flipCard;
window.toggleCardNumVisibility = toggleCardNumVisibility;
window.toggleCVVVisibility = toggleCVVVisibility;
window.showBuyModal = showBuyModal;
window.closeBuyModal = closeBuyModal;
window.calculateBuyTotal = calculateBuyTotal;
window.submitBuyRequest = submitBuyRequest;
window.showSendModal = showSendModal;
window.closeSendModal = closeSendModal;
window.sendCoins = sendCoins;
window.showReceiveModal = showReceiveModal;
window.closeReceiveModal = closeReceiveModal;
window.copyReceiveCode = copyReceiveCode;
window.showEditNameModal = showEditNameModal;
window.closeEditNameModal = closeEditNameModal;
window.saveNewName = saveNewName;
window.openArticle = openArticle;
window.closeArticleModal = closeArticleModal;
window.showLanguageModal = showLanguageModal;
window.closeLanguageModal = closeLanguageModal;
window.changeLanguage = changeLanguage;
window.showSecurityModal = showSecurityModal;
window.closeSecurityModal = closeSecurityModal;
window.showHelpModal = showHelpModal;
window.closeHelpModal = closeHelpModal;
window.toggleSetting = toggleSetting;
window.closeNotification = closeNotification;

// تحميل الإعدادات عند بدء التطبيق
setTimeout(loadSettings, 100);

// ==========================================
// END OF FILE
// ==========================================
console.log('✅ Dinar Queen V3.0 (Supabase Only) - Loaded Successfully');