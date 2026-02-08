// ==========================================
// DINAR COIN - Full App JavaScript V3.0 - Supabase Edition
// ==========================================

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/Dinar-Queen/sw.js').catch(() => {});
    });
}

// ==========================================
// SUPABASE CONFIGURATION
// ==========================================
const SUPABASE_URL = 'https://umlbxdcgpdifxzijujvj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtbGJ4ZGNncGRpZnh6aWp1anZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0NzQzODUsImV4cCI6MjA4NjA1MDM4NX0.Ld3fU2_B4eu803BsDYKQ0ofg69WxQPJcscGf93lnM3w';
// إنشاء عميل Supabase
if (typeof window.supabaseApp === 'undefined') {
    window.supabaseApp = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
const supabase = window.supabaseApp;

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
    // ... بقية المقالات
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

async function initializeApp() {
    // التحقق من الجلسة الحالية
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
        currentUser = session.user;
        await loadUserData();
        showDashboard();
        updateAnalyticsStats();
    } else {
        currentUser = null;
        showHome();
    }
    
    // الاستماع لتغييرات حالة المصادقة
    supabase.auth.onAuthStateChange(async (event, session) => {
        if (session) {
            currentUser = session.user;
            await loadUserData();
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
    for (let i = 0; i < 30; i++) {
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
// دالة لتحديث مفتاح الدولة
// ==========================================
function updateCountryCode() {
    const countrySelect = document.getElementById('signupCountry');
    const selectedOption = countrySelect.options[countrySelect.selectedIndex];
    const countryCode = selectedOption.getAttribute('data-code');
    document.getElementById('signupCountryCode').value = countryCode;
}

// ==========================================
// GLOBAL STATISTICS
// ==========================================
async function loadGlobalStats() {
    try {
        // الحصول على الإحصائيات
        const { data, error } = await supabase
            .from('global_stats')
            .select('*')
            .eq('id', 1)
            .single();
        
        if (error) {
            console.error('Error loading global stats:', error);
            return;
        }
        
        if (data) {
            updateGlobalStatsUI(data);
        }
        
        // الاستماع للتحديثات الفورية
        supabase
            .channel('global_stats_changes')
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: 'global_stats' }, 
                (payload) => {
                    updateGlobalStatsUI(payload.new);
                }
            )
            .subscribe();
            
    } catch (e) {
        console.error('Error in loadGlobalStats:', e);
    }
}

function updateGlobalStatsUI(data) {
    // تحديث شاشة الصفحة الرئيسية
    updateElement('homeUsersCount', data.total_users.toLocaleString('ar-IQ'));
    updateElement('homeCoinsRemaining', parseFloat(data.total_remaining).toLocaleString('ar-IQ'));
    
    // تحديث شاشة الداشبورد
    updateElement('dashUsersCount', data.total_users.toLocaleString('ar-IQ'));
    updateElement('dashCoinsRemaining', parseFloat(data.total_remaining).toLocaleString('ar-IQ'));
    
    // تحديث شاشة التحليلات
    updateElement('statTotalUsers', data.total_users.toLocaleString('ar-IQ'));
    updateElement('statCirculating', parseFloat(data.total_distributed).toLocaleString('ar-IQ'));
    updateElement('statRemaining', parseFloat(data.total_remaining).toLocaleString('ar-IQ'));
    updateElement('statTotalSupply', TOTAL_SUPPLY.toLocaleString('ar-IQ'));
    
    const distributionPercent = ((parseFloat(data.total_distributed) / TOTAL_SUPPLY) * 100).toFixed(2);
    updateElement('distributionPercent', distributionPercent + '%');
}

async function updateGlobalStats(userCountDelta, coinsDelta) {
    try {
        const { error } = await supabase.rpc('update_global_stats', {
            user_count_delta: userCountDelta,
            coins_delta: coinsDelta
        });
        
        if (error) throw error;
    } catch (e) {
        console.error('Error updating global stats:', e);
    }
}

// ==========================================
// AUTHENTICATION
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
    const username = document.getElementById('signupUsername').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const country = document.getElementById('signupCountry').value;
    const countryCode = document.getElementById('signupCountryCode').value;
    const phone = document.getElementById('signupPhone').value.trim();
    const city = document.getElementById('signupCity').value.trim();
    const street = document.getElementById('signupStreet').value.trim();
    const address = document.getElementById('signupAddress').value.trim();
    const refCode = document.getElementById('signupReferralCode').value.trim();
    
    if (!name || !username || !email || !password) {
        showNotification('خطأ', 'الرجاء إدخال جميع البيانات الأساسية', 'error');
        return;
    }
    
    if (password.length < 6) {
        showNotification('خطأ', 'كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'error');
        return;
    }
    
    try {
        // إنشاء المستخدم في Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: email,
            password: password,
        });
        
        if (authError) throw authError;
        
        const uid = authData.user.id;
        
        // إنشاء بيانات البطاقة
        const cardData = generateCardData(name);
        
        // بيانات المستخدم الكاملة
        const userData = {
            id: uid,
            email: email,
            name: name,
            username: username,
            phone_number: phone,
            country_code: countryCode,
            country: country,
            city: city,
            street: street,
            address: address,
            balance: WELCOME_BONUS,
            referral_code: generateReferralCode(),
            referral_count: 0,
            referral_earnings: 0,
            referred_by: refCode || null,
            card_number: cardData.number,
            card_cvv: cardData.cvv,
            card_expiry: cardData.expiry,
            is_active: true
        };
        
        // إدراج بيانات المستخدم
        const { error: insertError } = await supabase
            .from('users')
            .insert([userData]);
        
        if (insertError) throw insertError;
        
        // إضافة معاملة المكافأة الترحيبية
        await addTransaction(uid, {
            type: 'bonus',
            amount: WELCOME_BONUS,
            description: 'مكافأة الانضمام',
            status: 'completed'
        });
        
        // تحديث الإحصائيات العامة
        await updateGlobalStats(1, WELCOME_BONUS);
        
        // معالجة رمز الإحالة إن وُجد
        if (refCode) {
            const referrerUid = await validateReferralCode(refCode);
            if (referrerUid && referrerUid !== uid) {
                await processReferral(referrerUid, REFERRAL_BONUS);
            }
        }
        
        closeAuthModal();
        showNotification('مرحباً!', `تم إنشاء حسابك بنجاح! حصلت على ${WELCOME_BONUS} DC`, 'success');
    } catch (e) {
        console.error('Signup error:', e);
        let msg = 'حدث خطأ في التسجيل';
        if (e.message.includes('already registered')) msg = 'البريد الإلكتروني أو اسم المستخدم مستخدم مسبقاً';
        else if (e.message.includes('invalid email')) msg = 'بريد إلكتروني غير صحيح';
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
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });
        
        if (error) throw error;
        
        // تحديث آخر تسجيل دخول
        await supabase
            .from('users')
            .update({ last_login: new Date().toISOString() })
            .eq('id', data.user.id);
        
        closeAuthModal();
        showNotification('مرحباً بعودتك!', 'تم تسجيل الدخول بنجاح', 'success');
    } catch (e) {
        console.error('Login error:', e);
        let msg = 'بيانات خاطئة';
        if (e.message.includes('Invalid login')) msg = 'البريد أو كلمة المرور غير صحيحة';
        showNotification('خطأ', msg, 'error');
    }
}

async function logout() {
    try {
        await supabase.auth.signOut();
        cardFlipped = false;
        showNotification('تم', 'تم تسجيل الخروج', 'success');
    } catch (e) {
        console.error('Logout error:', e);
    }
}

// ==========================================
// USER DATA
// ==========================================
async function loadUserData() {
    if (!currentUser) return;
    
    try {
        // الحصول على بيانات المستخدم
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', currentUser.id)
            .single();
        
        if (error) throw error;
        
        if (data) {
            updateUserUI(data);
        }
        
        // الاستماع للتحديثات الفورية
        supabase
            .channel(`user_${currentUser.id}_changes`)
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: 'users', filter: `id=eq.${currentUser.id}` }, 
                (payload) => {
                    updateUserUI(payload.new);
                }
            )
            .subscribe();
            
    } catch (e) {
        console.error('Error loading user data:', e);
    }
}

function updateUserUI(data) {
    updateElement('userName', data.name);
    updateElement('userEmail', data.email);
    updateElement('userReferralCode', data.referral_code);
    
    // Dashboard
    const balance = parseFloat(data.balance || 0).toFixed(2);
    updateElement('cardBalance', balance + ' DC');
    updateElement('totalBalance', balance + ' DC');
    updateElement('cardName', data.name);
    updateElement('referralCode', data.referral_code);
    updateElement('referralCount', data.referral_count || 0);
    updateElement('referralEarnings', parseFloat(data.referral_earnings || 0).toFixed(2) + ' DC');

    // Card
    userCardData = {
        number: data.card_number,
        cvv: data.card_cvv,
        expiry: data.card_expiry
    };
    updateElement('cardNum', formatCardNumber(data.card_number));
    updateElement('cardNumFront', formatCardNumber(data.card_number));
    updateElement('cardCVV', data.card_cvv);
    updateElement('cardExpiry', data.card_expiry);
    
    // Profile
    updateElement('profileName', data.name);
    updateElement('profileNameDisplay', data.name);
    updateElement('profileEmailValue', data.email);
    updateElement('profileRefCode', data.referral_code);
    updateElement('profileBalance', balance + ' DC');
    updateElement('profileCardNum', formatCardNumber(data.card_number));
    updateElement('profileCVV', '***');
    updateElement('profileExpiry', data.card_expiry);
    
    if (data.join_date) {
        const date = new Date(data.join_date);
        updateElement('profileJoinDate', date.toLocaleDateString('ar-IQ', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }));
    }
    
    // Analytics
    updateElement('analyticBalance', balance + ' DC');
    updateElement('analyticReferrals', data.referral_count || 0);
    updateElement('analyticEarnings', parseFloat(data.referral_earnings || 0).toFixed(2) + ' DC');
    
    // Avatar
    if (data.profile_picture_url) {
        const avatarElements = document.querySelectorAll('.profile-avatar-large, .user-avatar-btn, #profileAvatar');
        avatarElements.forEach(el => {
            el.style.backgroundImage = `url(${data.profile_picture_url})`;
            el.style.backgroundSize = 'cover';
            el.style.backgroundPosition = 'center';
            el.textContent = '';
        });
    } else {
        const firstLetter = data.name.charAt(0).toUpperCase();
        updateElement('userAvatar', firstLetter);
        updateElement('profileAvatar', firstLetter);
    }
    
    // QR Code للاستقبال
    updateElement('receiveCode', data.referral_code);
    generateQRCode(data.referral_code);
}

function updateElement(id, value) {
    const el = document.getElementById(id);
    if (el) {
        if (el.tagName === 'INPUT') el.value = value;
        else el.textContent = value;
    }
}

// ==========================================
// PROFILE PHOTO UPLOAD
// ==========================================
async function uploadProfilePhoto(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // التحقق من نوع الملف
    if (!file.type.startsWith('image/')) {
        showNotification('خطأ', 'يرجى اختيار صورة', 'error');
        return;
    }
    
    // التحقق من حجم الملف (أقل من 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showNotification('خطأ', 'حجم الصورة كبير جداً (الحد الأقصى 5MB)', 'error');
        return;
    }
    
    try {
        showNotification('جاري التحميل...', 'يرجى الانتظار', 'info');
        
        // رفع الصورة إلى Supabase Storage
        const fileName = `${currentUser.id}_${Date.now()}.${file.name.split('.').pop()}`;
        const { data, error } = await supabase.storage
            .from('profile-pictures')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            });
        
        if (error) throw error;
        
        // الحصول على URL العام للصورة
        const { data: urlData } = supabase.storage
            .from('profile-pictures')
            .getPublicUrl(fileName);
        
        const photoUrl = urlData.publicUrl;
        
        // تحديث قاعدة البيانات
        const { error: updateError } = await supabase
            .from('users')
            .update({ profile_picture_url: photoUrl })
            .eq('id', currentUser.id);
        
        if (updateError) throw updateError;
        
        showNotification('نجح!', 'تم تحديث صورة البروفايل', 'success');
    } catch (e) {
        console.error('Error uploading photo:', e);
        showNotification('خطأ', 'فشل رفع الصورة', 'error');
    }
}

// ==========================================
// CARD UTILITIES
// ==========================================
function generateCardData(name) {
    const number = Array.from({length: 16}, () => Math.floor(Math.random() * 10)).join('');
    const cvv = Array.from({length: 3}, () => Math.floor(Math.random() * 10)).join('');
    const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
    const year = String(new Date().getFullYear() + 3).slice(-2);
    return {
        number: number,
        cvv: cvv,
        expiry: `${month}/${year}`
    };
}

function generateReferralCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'DC';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

function formatCardNumber(num) {
    if (!num) return '**** **** **** ****';
    return num.match(/.{1,4}/g)?.join(' ') || num;
}

async function validateReferralCode(code) {
    try {
        const { data, error } = await supabase.rpc('validate_referral_code', {
            ref_code: code
        });
        
        if (error) throw error;
        return data;
    } catch (e) {
        console.error('Error validating referral code:', e);
        return null;
    }
}

async function processReferral(referrerUid, bonusAmount) {
    try {
        const { error } = await supabase.rpc('process_referral', {
            referrer_id: referrerUid,
            bonus_amount: bonusAmount
        });
        
        if (error) throw error;
        
        // تحديث الإحصائيات العامة
        await updateGlobalStats(0, bonusAmount);
    } catch (e) {
        console.error('Error processing referral:', e);
    }
}

// ==========================================
// TRANSACTIONS
// ==========================================
async function addTransaction(userId, transactionData) {
    try {
        const { error } = await supabase
            .from('transactions')
            .insert([{
                user_id: userId,
                ...transactionData
            }]);
        
        if (error) throw error;
    } catch (e) {
        console.error('Error adding transaction:', e);
    }
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
        const { error } = await supabase
            .from('purchase_requests')
            .insert([{
                user_id: currentUser.id,
                amount: amount,
                total_iqd: total,
                status: 'pending'
            }]);
        
        if (error) throw error;
        
        await addTransaction(currentUser.id, {
            type: 'buy',
            amount: amount,
            description: `طلب شراء - ${total.toLocaleString('ar-IQ')} IQD`,
            status: 'pending'
        });
        
        closeBuyModal();
        showNotification('تم!', `طلب شراء ${amount} DC أُرسل بنجاح`, 'success');
    } catch (e) {
        console.error('Error submitting buy request:', e);
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
        // الحصول على بيانات المرسل
        const { data: senderData, error: senderError } = await supabase
            .from('users')
            .select('*')
            .eq('id', currentUser.id)
            .single();
        
        if (senderError) throw senderError;
        
        if (parseFloat(senderData.balance) < amount) {
            showNotification('خطأ', 'رصيد غير كافٍ', 'error');
            return;
        }
        
        // التحقق من رمز المستلم
        const recipientUid = await validateReferralCode(recipientCode);
        if (!recipientUid) {
            showNotification('خطأ', 'رمز غير صحيح', 'error');
            return;
        }
        
        if (recipientUid === currentUser.id) {
            showNotification('خطأ', 'لا يمكن الإرسال لنفسك', 'error');
            return;
        }
        
        // الحصول على بيانات المستلم
        const { data: recipientData, error: recipientError } = await supabase
            .from('users')
            .select('*')
            .eq('id', recipientUid)
            .single();
        
        if (recipientError) throw recipientError;
        
        // تحديث أرصدة المرسل والمستلم
        const { error: updateSenderError } = await supabase
            .from('users')
            .update({ balance: parseFloat(senderData.balance) - amount })
            .eq('id', currentUser.id);
        
        if (updateSenderError) throw updateSenderError;
        
        const { error: updateRecipientError } = await supabase
            .from('users')
            .update({ balance: parseFloat(recipientData.balance || 0) + amount })
            .eq('id', recipientUid);
        
        if (updateRecipientError) throw updateRecipientError;
        
        // إضافة المعاملات
        await addTransaction(currentUser.id, {
            type: 'send',
            amount: amount,
            description: `إرسال إلى ${recipientData.name} - ${note}`,
            status: 'completed',
            recipient_id: recipientUid,
            note: note
        });
        
        await addTransaction(recipientUid, {
            type: 'receive',
            amount: amount,
            description: `استلام من ${senderData.name} - ${note}`,
            status: 'completed',
            note: note
        });
        
        closeSendModal();
        showNotification('تم!', `أُرسل ${amount} DC إلى ${recipientData.name}`, 'success');
    } catch (e) {
        console.error('Error sending coins:', e);
        showNotification('خطأ', 'فشلت العملية', 'error');
    }
}

// ==========================================
// QR CODE GENERATION
// ==========================================
function generateQRCode(code) {
    const qrContainer = document.getElementById('qrCode');
    if (!qrContainer || !code) return;
    
    qrContainer.innerHTML = '';
    
    try {
        if (typeof QRCode === 'undefined') {
            qrContainer.innerHTML = '<div style="text-align:center;padding:20px;color:#888;">رمز QR: ' + code + '</div>';
            return;
        }
        
        new QRCode(qrContainer, {
            text: code,
            width: 200,
            height: 200,
            colorDark: '#1a5f4a',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.H
        });
    } catch (e) {
        console.error('QR Code generation error:', e);
        qrContainer.innerHTML = '<div style="text-align:center;padding:20px;color:#888;">رمز QR: ' + code + '</div>';
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

// ==========================================
// SCREEN NAVIGATION
// ==========================================
function showHome() {
    document.getElementById('homeScreen').classList.add('active-screen');
    document.getElementById('dashboardScreen').classList.remove('active-screen');
}

function showDashboard() {
    document.getElementById('homeScreen').classList.remove('active-screen');
    document.getElementById('dashboardScreen').classList.add('active-screen');
    switchTab('home');
}

function switchTab(tabName) {
    const screens = ['homeTab', 'newsTab', 'analyticsTab', 'profileTab'];
    screens.forEach(screen => {
        document.getElementById(screen)?.classList.remove('active-tab');
    });
    document.getElementById(tabName + 'Tab')?.classList.add('active-tab');
    
    const navButtons = document.querySelectorAll('.nav-tab');
    navButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tabName) {
            btn.classList.add('active');
        }
    });
    
    if (tabName === 'analytics') {
        updateAnalyticsStats();
    }
}

function flipCard() {
    const flipper = document.getElementById('cardFlipper');
    cardFlipped = !cardFlipped;
    if (cardFlipped) {
        flipper.style.transform = 'rotateY(180deg)';
    } else {
        flipper.style.transform = 'rotateY(0deg)';
    }
}

// ==========================================
// ANALYTICS
// ==========================================
function updateAnalyticsStats() {
    // يمكن إضافة المزيد من الإحصائيات هنا
    setTimeout(() => {
        updatePriceChart();
    }, 500);
}

function updatePriceChart() {
    const canvas = document.getElementById('priceChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width = canvas.offsetWidth * 2;
    const height = canvas.height = canvas.offsetHeight * 2;
    
    ctx.clearRect(0, 0, width, height);
    
    const data = Array.from({length: 18}, (_, i) => {
        const basePrice = 1000;
        const variation = Math.sin(i * 0.5) * 50 + Math.random() * 30;
        return basePrice + variation;
    });
    
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min;
    
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 4;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    
    ctx.beginPath();
    data.forEach((price, i) => {
        const x = padding + (i / (data.length - 1)) * chartWidth;
        const y = padding + chartHeight - ((price - min) / range) * chartHeight;
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    ctx.stroke();
    
    const gradient = ctx.createLinearGradient(0, padding, 0, height - padding);
    gradient.addColorStop(0, 'rgba(212, 175, 55, 0.3)');
    gradient.addColorStop(1, 'rgba(212, 175, 55, 0)');
    ctx.fillStyle = gradient;
    
    ctx.beginPath();
    ctx.moveTo(padding, height - padding);
    data.forEach((price, i) => {
        const x = padding + (i / (data.length - 1)) * chartWidth;
        const y = padding + chartHeight - ((price - min) / range) * chartHeight;
        ctx.lineTo(x, y);
    });
    ctx.lineTo(width - padding, height - padding);
    ctx.closePath();
    ctx.fill();
}

// ==========================================
// EDIT PROFILE
// ==========================================
function showEditNameModal() {
    document.getElementById('editNameModal').classList.add('active');
    document.getElementById('editNameInput').value = '';
}

function closeEditNameModal() {
    document.getElementById('editNameModal').classList.remove('active');
}

async function saveNewName() {
    const newName = document.getElementById('editNameInput').value.trim();
    if (!newName) {
        showNotification('خطأ', 'أدخل اسماً جديداً', 'error');
        return;
    }
    
    try {
        const { error } = await supabase
            .from('users')
            .update({ name: newName })
            .eq('id', currentUser.id);
        
        if (error) throw error;
        
        closeEditNameModal();
        showNotification('تم!', 'تم تحديث الاسم', 'success');
    } catch (e) {
        console.error('Error updating name:', e);
        showNotification('خطأ', 'فشل التحديث', 'error');
    }
}

// ==========================================
// NOTIFICATIONS
// ==========================================
function showNotification(title, message, type = 'success') {
    const notification = document.getElementById('successNotification');
    const titleEl = document.getElementById('notificationTitle');
    const messageEl = document.getElementById('notificationMessage');
    const icon = notification.querySelector('.toast-icon i');
    
    titleEl.textContent = title;
    messageEl.textContent = message;
    
    notification.classList.remove('success', 'error', 'info');
    notification.classList.add(type);
    
    if (type === 'error') {
        icon.className = 'fas fa-exclamation-circle';
    } else if (type === 'info') {
        icon.className = 'fas fa-info-circle';
    } else {
        icon.className = 'fas fa-check-circle';
    }
    
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

function closeNotification() {
    document.getElementById('successNotification').classList.remove('show');
}

// ==========================================
// CARD VISIBILITY TOGGLES
// ==========================================
function toggleCardNumVisibility() {
    const el = document.getElementById('profileCardNum');
    const icon = document.getElementById('cardNumToggle');
    
    if (!el || !userCardData) return;
    
    cardNumVisible = !cardNumVisible;
    if (cardNumVisible) {
        el.textContent = formatCardNumber(userCardData.number);
        icon.className = 'fas fa-eye-slash settings-arrow';
    } else {
        el.textContent = '**** **** **** ****';
        icon.className = 'fas fa-eye settings-arrow';
    }
}

function toggleCVVVisibility() {
    const el = document.getElementById('profileCVV');
    const icon = document.getElementById('cvvToggle');
    
    if (!el || !userCardData) return;
    
    cvvVisible = !cvvVisible;
    if (cvvVisible) {
        el.textContent = userCardData.cvv;
        icon.className = 'fas fa-eye-slash settings-arrow';
    } else {
        el.textContent = '***';
        icon.className = 'fas fa-eye settings-arrow';
    }
}

// ==========================================
// COPY FUNCTIONS
// ==========================================
function copyReferralCode() {
    const code = document.getElementById('profileRefCode')?.textContent;
    if (code) {
        copyToClipboard(code);
        showNotification('تم!', 'تم نسخ رمز الإحالة', 'success');
    }
}

function copyReceiveCode() {
    const code = document.getElementById('receiveCode')?.textContent;
    if (code) {
        copyToClipboard(code);
        showNotification('تم!', 'تم نسخ رمز الإحالة', 'success');
    }
}

function copyToClipboard(text) {
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
// ADDITIONAL FUNCTIONS
// ==========================================
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
    
    const modal = document.getElementById('articleModal');
    const content = document.getElementById('articleContent');
    
    content.innerHTML = `
        <div class="article-header">
            <img src="${article.img}" alt="" class="article-header-img">
            <span class="news-badge ${article.cat}">${getCategoryLabel(article.cat)}</span>
            <h2>${article.title}</h2>
            <p class="article-meta">
                <i class="fas fa-calendar"></i> ${formatDate(article.date)}
            </p>
        </div>
        <div class="article-body">${article.body.replace(/\n/g, '<br><br>')}</div>
    `;
    
    modal.classList.add('active');
}

function closeArticleModal() {
    document.getElementById('articleModal').classList.remove('active');
}

// بقية الدوال...
function showLanguageModal() { showNotification('قريباً', 'هذه الميزة قيد التطوير', 'info'); }
function showSecurityModal() { showNotification('قريباً', 'هذه الميزة قيد التطوير', 'info'); }
function showHelpModal() { showNotification('قريباً', 'هذه الميزة قيد التطوير', 'info'); }
function toggleDarkMode() { showNotification('قريباً', 'هذه الميزة قيد التطوير', 'info'); }
