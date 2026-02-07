// ==========================================
// DINAR COIN - Supabase Version V3.0
// ==========================================

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/Dinar-Queen/sw.js').catch(() => {});
    });
}

// إعدادات Supabase
const SUPABASE_URL = 'https://umlbxdcgpdifxzijujvj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtbGJ4ZGNncGRpZnh6aWp1anZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0NzQzODUsImV4cCI6MjA4NjA1MDM4NX0.Ld3fU2_B4eu803BsDYKQ0ofg69WxQPJcscGf93lnM3w';

// إنشاء عميل Supabase
var supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

// قوائم الدول مع رموزها ومفاتيح الهاتف
const countries = {
    ar: [
        { name: 'العراق', code: 'IQ', phone: '+964' },
        { name: 'السعودية', code: 'SA', phone: '+966' },
        { name: 'الإمارات', code: 'AE', phone: '+971' },
        { name: 'الكويت', code: 'KW', phone: '+965' },
        { name: 'قطر', code: 'QA', phone: '+974' },
        { name: 'البحرين', code: 'BH', phone: '+973' },
        { name: 'عُمان', code: 'OM', phone: '+968' },
        { name: 'الأردن', code: 'JO', phone: '+962' },
        { name: 'فلسطين', code: 'PS', phone: '+970' },
        { name: 'لبنان', code: 'LB', phone: '+961' },
        { name: 'سوريا', code: 'SY', phone: '+963' },
        { name: 'مصر', code: 'EG', phone: '+20' },
        { name: 'المغرب', code: 'MA', phone: '+212' },
        { name: 'الجزائر', code: 'DZ', phone: '+213' },
        { name: 'تونس', code: 'TN', phone: '+216' },
        { name: 'ليبيا', code: 'LY', phone: '+218' },
        { name: 'السودان', code: 'SD', phone: '+249' },
        { name: 'اليمن', code: 'YE', phone: '+967' }
    ],
    en: [
        { name: 'United States', code: 'US', phone: '+1' },
        { name: 'United Kingdom', code: 'GB', phone: '+44' },
        { name: 'Canada', code: 'CA', phone: '+1' },
        { name: 'Australia', code: 'AU', phone: '+61' },
        { name: 'Germany', code: 'DE', phone: '+49' },
        { name: 'France', code: 'FR', phone: '+33' },
        { name: 'Italy', code: 'IT', phone: '+39' },
        { name: 'Spain', code: 'ES', phone: '+34' },
        { name: 'Turkey', code: 'TR', phone: '+90' },
        { name: 'India', code: 'IN', phone: '+91' }
    ]
};

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
        body: `في عالم يتجه بسرعة نحو الرقمنة، يبرز دينار كوين كفرصة استثمارية فريدة من نوعها في المنطقة العربية...`
    },
    // باقي المقالات...
];

// ==========================================
// AUTHENTICATION
// ==========================================

// مراقبة حالة تسجيل الدخول
supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session) {
        await loadUserData(session.user.id);
    } else if (event === 'SIGNED_OUT') {
        currentUser = null;
        showScreen('homeScreen');
    }
});

// تسجيل الدخول
async function login() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        showNotification('خطأ', 'الرجاء إدخال البريد الإلكتروني وكلمة المرور', 'error');
        return;
    }
    
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) throw error;
        
        // تحديث آخر تسجيل دخول
        await supabase
            .from('users')
            .update({ last_login: new Date().toISOString() })
            .eq('auth_id', data.user.id);
        
        showNotification('نجاح', 'تم تسجيل الدخول بنجاح!', 'success');
        closeAuthModal();
        
    } catch (error) {
        console.error('Login error:', error);
        showNotification('خطأ', 'البريد الإلكتروني أو كلمة المرور غير صحيحة', 'error');
    }
}

// إنشاء حساب جديد
async function signup() {
    // الحصول على القيم من النموذج
    const firstName = document.getElementById('signupFirstName').value.trim();
    const lastName = document.getElementById('signupLastName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;
    const phone = document.getElementById('signupPhone').value.trim();
    const countrySelect = document.getElementById('signupCountry');
    const selectedCountry = countries.ar[countrySelect.selectedIndex] || countries.ar[0];
    const city = document.getElementById('signupCity').value.trim();
    const street = document.getElementById('signupStreet').value.trim();
    
    // التحقق من البيانات
    if (!firstName || !lastName || !email || !password || !phone || !city) {
        showNotification('خطأ', 'الرجاء ملء جميع الحقول المطلوبة', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showNotification('خطأ', 'كلمتا المرور غير متطابقتين', 'error');
        return;
    }
    
    if (password.length < 8) {
        showNotification('خطأ', 'كلمة المرور يجب أن تكون 8 أحرف على الأقل', 'error');
        return;
    }
    
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
        showNotification('خطأ', 'كلمة المرور يجب أن تحتوي على أحرف كبيرة وصغيرة وأرقام', 'error');
        return;
    }
    
    try {
        // التحقق من وجود البريد الإلكتروني
        const { data: existingUser } = await supabase
            .from('users')
            .select('email')
            .eq('email', email)
            .single();
        
        if (existingUser) {
            showNotification('خطأ', 'البريد الإلكتروني مستخدم بالفعل', 'error');
            return;
        }
        
        // إنشاء حساب المصادقة
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: email,
            password: password
        });
        
        if (authError) throw authError;
        
        // توليد بيانات فريدة
        const referralCode = await generateReferralCode();
        const cardNumber = generateCardNumber();
        const cardCVV = generateCVV();
        const cardExpiry = generateCardExpiry();
        
        // إنشاء سجل المستخدم
        const { data: userData, error: userError } = await supabase
            .from('users')
            .insert([{
                auth_id: authData.user.id,
                first_name: firstName,
                last_name: lastName,
                email: email,
                phone: phone,
                phone_country_code: selectedCountry.phone,
                country: selectedCountry.name,
                country_code: selectedCountry.code,
                city: city,
                street: street || '',
                referral_code: referralCode,
                balance: WELCOME_BONUS,
                welcome_bonus_received: true,
                card_number: cardNumber,
                card_cvv: cardCVV,
                card_expiry: cardExpiry
            }])
            .select()
            .single();
        
        if (userError) throw userError;
        
        // إضافة معاملة المكافأة الترحيبية
        await supabase
            .from('transactions')
            .insert([{
                receiver_id: userData.id,
                amount: WELCOME_BONUS,
                transaction_type: 'bonus',
                status: 'completed',
                note: 'مكافأة ترحيبية',
                reference_number: `BONUS-${Date.now()}`,
                completed_at: new Date().toISOString()
            }]);
        
        showNotification('نجاح', `مرحباً ${firstName}! تم إنشاء حسابك بنجاح وحصلت على ${WELCOME_BONUS} دينار كمكافأة ترحيبية!`, 'success');
        closeAuthModal();
        
    } catch (error) {
        console.error('Signup error:', error);
        showNotification('خطأ', 'حدث خطأ أثناء إنشاء الحساب. حاول مرة أخرى.', 'error');
    }
}

// تسجيل الخروج
async function logout() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        currentUser = null;
        showScreen('homeScreen');
        showNotification('نجاح', 'تم تسجيل الخروج بنجاح', 'success');
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// ==========================================
// DATA LOADING
// ==========================================

async function loadUserData(authId) {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('auth_id', authId)
            .single();
        
        if (error) throw error;
        
        currentUser = data;
        updateDashboardUI();
        showScreen('dashboardScreen');
        loadTransactions();
        loadReferrals();
        
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

async function loadPlatformStats() {
    try {
        const { data: stats, error } = await supabase
            .from('platform_stats')
            .select('*')
            .single();
        
        if (error) throw error;
        
        const remainingCoins = TOTAL_SUPPLY - (stats.total_coins_distributed || 0);
        
        // تحديث إحصائيات الصفحة الرئيسية
        document.getElementById('homeUsersCount').textContent = formatNumber(stats.total_users || 0);
        document.getElementById('homeCoinsRemaining').textContent = formatNumber(remainingCoins);
        
        // تحديث إحصائيات لوحة التحكم
        if (document.getElementById('dashUsersCount')) {
            document.getElementById('dashUsersCount').textContent = formatNumber(stats.total_users || 0);
            document.getElementById('dashCoinsRemaining').textContent = formatNumber(remainingCoins);
        }
        
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

async function loadTransactions() {
    if (!currentUser) return;
    
    try {
        const { data, error } = await supabase
            .from('transactions')
            .select(`
                *,
                sender:sender_id(full_name, referral_code),
                receiver:receiver_id(full_name, referral_code)
            `)
            .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
            .order('created_at', { ascending: false })
            .limit(50);
        
        if (error) throw error;
        
        displayTransactions(data);
        
    } catch (error) {
        console.error('Error loading transactions:', error);
    }
}

async function loadReferrals() {
    if (!currentUser) return;
    
    try {
        const { data, error } = await supabase
            .from('referrals')
            .select(`
                *,
                referred:referred_id(full_name, email, created_at)
            `)
            .eq('referrer_id', currentUser.id)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        displayReferrals(data);
        
    } catch (error) {
        console.error('Error loading referrals:', error);
    }
}

// ==========================================
// UI UPDATES
// ==========================================

function updateDashboardUI() {
    if (!currentUser) return;
    
    // تحديث معلومات المستخدم
    const fullName = `${currentUser.first_name} ${currentUser.last_name}`;
    document.getElementById('userName').textContent = fullName;
    document.getElementById('userEmail').textContent = currentUser.email;
    document.getElementById('userReferralCode').textContent = currentUser.referral_code;
    
    // تحديث الرصيد
    document.getElementById('cardBalance').textContent = `${formatNumber(currentUser.balance)} DC`;
    document.getElementById('profileBalance').textContent = `${formatNumber(currentUser.balance)} DC`;
    document.getElementById('earnedCoins').textContent = formatNumber(currentUser.referral_earnings);
    
    // تحديث معلومات البطاقة
    document.getElementById('cardName').textContent = fullName.toUpperCase();
    document.getElementById('cardNum').textContent = currentUser.card_number;
    document.getElementById('cardNumFront').textContent = currentUser.card_number;
    document.getElementById('cardCVV').textContent = currentUser.card_cvv;
    document.getElementById('cardExpiry').textContent = currentUser.card_expiry;
    
    // تحديث رمز الاستقبال
    document.getElementById('receiveCode').textContent = currentUser.referral_code;
    
    // تحديث الأفاتار
    const avatar = document.getElementById('userAvatar');
    avatar.textContent = currentUser.first_name.charAt(0).toUpperCase();
    
    // تحديث معلومات الملف الشخصي
    document.getElementById('profileName').textContent = fullName;
    document.getElementById('profileEmail').textContent = currentUser.email;
    document.getElementById('profilePhone').textContent = `${currentUser.phone_country_code} ${currentUser.phone}`;
    document.getElementById('profileCountry').textContent = currentUser.country;
    document.getElementById('profileCity').textContent = currentUser.city;
    document.getElementById('profileAddress').textContent = currentUser.street || 'غير محدد';
    document.getElementById('profileJoinDate').textContent = new Date(currentUser.created_at).toLocaleDateString('ar-IQ');
    document.getElementById('totalReferrals').textContent = currentUser.total_referrals || 0;
    
    // توليد QR Code
    generateQRCode(currentUser.referral_code);
}

function displayTransactions(transactions) {
    const container = document.getElementById('transactionsList');
    if (!container || !transactions || transactions.length === 0) {
        if (container) container.innerHTML = '<p class="empty-state">لا توجد معاملات</p>';
        return;
    }
    
    container.innerHTML = transactions.map(tx => {
        const isSender = tx.sender_id === currentUser.id;
        const isReceiver = tx.receiver_id === currentUser.id;
        const otherParty = isSender ? tx.receiver?.full_name : tx.sender?.full_name;
        
        let icon, typeText, amountClass;
        if (tx.transaction_type === 'bonus' || tx.transaction_type === 'referral') {
            icon = 'fas fa-gift';
            typeText = 'مكافأة';
            amountClass = 'positive';
        } else if (isSender) {
            icon = 'fas fa-arrow-up';
            typeText = 'إرسال';
            amountClass = 'negative';
        } else {
            icon = 'fas fa-arrow-down';
            typeText = 'استقبال';
            amountClass = 'positive';
        }
        
        return `
            <div class="transaction-item">
                <div class="transaction-icon ${tx.transaction_type}">
                    <i class="${icon}"></i>
                </div>
                <div class="transaction-details">
                    <div class="transaction-title">${typeText}${otherParty ? ' - ' + otherParty : ''}</div>
                    <div class="transaction-date">${new Date(tx.created_at).toLocaleString('ar-IQ')}</div>
                    ${tx.note ? `<div class="transaction-note">${tx.note}</div>` : ''}
                </div>
                <div class="transaction-amount ${amountClass}">
                    ${isSender ? '-' : '+'}${formatNumber(tx.amount)} DC
                </div>
            </div>
        `;
    }).join('');
}

function displayReferrals(referrals) {
    const container = document.getElementById('referralsList');
    if (!container) return;
    
    if (!referrals || referrals.length === 0) {
        container.innerHTML = '<p class="empty-state">لم تقم بدعوة أي شخص بعد</p>';
        return;
    }
    
    container.innerHTML = referrals.map(ref => `
        <div class="referral-item">
            <div class="referral-avatar">
                ${ref.referred?.full_name.charAt(0).toUpperCase()}
            </div>
            <div class="referral-details">
                <div class="referral-name">${ref.referred?.full_name || 'مستخدم'}</div>
                <div class="referral-date">${new Date(ref.created_at).toLocaleDateString('ar-IQ')}</div>
            </div>
            <div class="referral-bonus ${ref.bonus_paid ? 'paid' : 'pending'}">
                ${ref.bonus_paid ? '✓' : '⏳'} ${formatNumber(ref.bonus_amount)} DC
            </div>
        </div>
    `).join('');
}

// ==========================================
// ACTIONS
// ==========================================

async function sendCoins() {
    const recipientCode = document.getElementById('recipientCode').value.trim();
    const amount = parseFloat(document.getElementById('sendAmount').value);
    const note = document.getElementById('sendNote').value.trim();
    
    if (!recipientCode || !amount || amount <= 0) {
        showNotification('خطأ', 'الرجاء إدخال رمز المستلم والكمية', 'error');
        return;
    }
    
    if (amount > currentUser.balance) {
        showNotification('خطأ', 'رصيدك غير كافٍ', 'error');
        return;
    }
    
    if (recipientCode === currentUser.referral_code) {
        showNotification('خطأ', 'لا يمكنك الإرسال لنفسك', 'error');
        return;
    }
    
    try {
        // البحث عن المستلم
        const { data: recipient, error: recipientError } = await supabase
            .from('users')
            .select('*')
            .eq('referral_code', recipientCode)
            .single();
        
        if (recipientError || !recipient) {
            showNotification('خطأ', 'رمز المستلم غير صحيح', 'error');
            return;
        }
        
        // خصم من المرسل
        const { error: deductError } = await supabase
            .from('users')
            .update({ 
                balance: currentUser.balance - amount,
                total_sent: currentUser.total_sent + amount
            })
            .eq('id', currentUser.id);
        
        if (deductError) throw deductError;
        
        // إضافة للمستلم
        const { error: addError } = await supabase
            .from('users')
            .update({ 
                balance: recipient.balance + amount,
                total_received: recipient.total_received + amount
            })
            .eq('id', recipient.id);
        
        if (addError) throw addError;
        
        // تسجيل المعاملة
        await supabase
            .from('transactions')
            .insert([{
                sender_id: currentUser.id,
                receiver_id: recipient.id,
                amount: amount,
                transaction_type: 'send',
                status: 'completed',
                note: note || '',
                reference_number: `SEND-${Date.now()}`,
                completed_at: new Date().toISOString()
            }]);
        
        currentUser.balance -= amount;
        updateDashboardUI();
        closeSendModal();
        loadTransactions();
        
        showNotification('نجاح', `تم إرسال ${formatNumber(amount)} DC إلى ${recipient.full_name}`, 'success');
        
    } catch (error) {
        console.error('Send error:', error);
        showNotification('خطأ', 'حدث خطأ أثناء الإرسال', 'error');
    }
}

async function submitBuyRequest() {
    const amount = parseFloat(document.getElementById('buyAmount').value);
    
    if (!amount || amount <= 0) {
        showNotification('خطأ', 'الرجاء إدخال كمية صحيحة', 'error');
        return;
    }
    
    const totalIQD = amount * PRICE_PER_COIN;
    
    try {
        await supabase
            .from('buy_requests')
            .insert([{
                user_id: currentUser.id,
                amount: amount,
                total_iqd: totalIQD,
                status: 'pending'
            }]);
        
        closeBuyModal();
        showNotification('نجاح', 'تم إرسال طلب الشراء. سيتم مراجعته قريباً', 'success');
        
    } catch (error) {
        console.error('Buy request error:', error);
        showNotification('خطأ', 'حدث خطأ أثناء إرسال الطلب', 'error');
    }
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

async function generateReferralCode() {
    let code;
    let exists = true;
    
    while (exists) {
        code = 'DC' + Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
        
        const { data } = await supabase
            .from('users')
            .select('referral_code')
            .eq('referral_code', code)
            .single();
        
        exists = !!data;
    }
    
    return code;
}

function generateCardNumber() {
    const parts = [];
    for (let i = 0; i < 4; i++) {
        parts.push(Math.floor(Math.random() * 10000).toString().padStart(4, '0'));
    }
    return parts.join(' ');
}

function generateCVV() {
    return Math.floor(Math.random() * 1000).toString().padStart(3, '0');
}

function generateCardExpiry() {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 5);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${year}`;
}

function formatNumber(num) {
    return new Intl.NumberFormat('ar-IQ').format(num || 0);
}

function generateQRCode(text) {
    const qrContainer = document.getElementById('qrCode');
    if (!qrContainer) return;
    
    qrContainer.innerHTML = '';
    new QRCode(qrContainer, {
        text: text,
        width: 200,
        height: 200,
        colorDark: '#1a5f4a',
        colorLight: '#ffffff'
    });
}

function showNotification(title, message, type = 'success') {
    const notification = document.getElementById('successNotification');
    document.getElementById('notificationTitle').textContent = title;
    document.getElementById('notificationMessage').textContent = message;
    
    notification.className = `toast-notification ${type} show`;
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 4000);
}

function copyReceiveCode() {
    const code = document.getElementById('receiveCode').textContent;
    navigator.clipboard.writeText(code).then(() => {
        showNotification('نجاح', 'تم نسخ الرمز', 'success');
    });
}

// ==========================================
// MODALS & UI
// ==========================================

function showAuthModal(type) {
    document.getElementById('authModal').classList.add('active');
    switchAuthForm(type);
}

function closeAuthModal() {
    document.getElementById('authModal').classList.remove('active');
}

function switchAuthForm(type) {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    
    if (type === 'login') {
        loginForm.classList.add('active');
        signupForm.classList.remove('active');
    } else {
        loginForm.classList.remove('active');
        signupForm.classList.add('active');
        populateCountryOptions();
    }
}

function populateCountryOptions() {
    const selectAr = document.getElementById('signupCountry');
    const selectEn = document.getElementById('signupCountryEn');
    
    if (selectAr && selectAr.children.length === 1) {
        countries.ar.forEach(country => {
            const option = document.createElement('option');
            option.value = JSON.stringify(country);
            option.textContent = country.name;
            selectAr.appendChild(option);
        });
    }
    
    if (selectEn && selectEn.children.length === 1) {
        countries.en.forEach(country => {
            const option = document.createElement('option');
            option.value = JSON.stringify(country);
            option.textContent = country.name;
            selectEn.appendChild(option);
        });
    }
}

function updatePhoneCode() {
    const select = document.getElementById('signupCountry');
    const phoneCode = document.getElementById('phoneCountryCode');
    
    if (select.selectedIndex > 0) {
        const country = countries.ar[select.selectedIndex - 1];
        phoneCode.textContent = country.phone;
    }
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active-screen'));
    document.getElementById(screenId).classList.add('active-screen');
}

function showBuyModal() {
    document.getElementById('buyModal').classList.add('active');
}

function closeBuyModal() {
    document.getElementById('buyModal').classList.remove('active');
    document.getElementById('buyAmount').value = '';
    document.getElementById('totalIQD').textContent = '0 IQD';
}

function showSendModal() {
    document.getElementById('sendModal').classList.add('active');
}

function closeSendModal() {
    document.getElementById('sendModal').classList.remove('active');
    document.getElementById('recipientCode').value = '';
    document.getElementById('sendAmount').value = '';
    document.getElementById('sendNote').value = '';
}

function showReceiveModal() {
    document.getElementById('receiveModal').classList.add('active');
}

function closeReceiveModal() {
    document.getElementById('receiveModal').classList.remove('active');
}

function calculateBuyTotal() {
    const amount = parseFloat(document.getElementById('buyAmount').value) || 0;
    const total = amount * PRICE_PER_COIN;
    document.getElementById('totalIQD').textContent = formatNumber(total) + ' IQD';
}

function flipCard() {
    cardFlipped = !cardFlipped;
    document.getElementById('cardFlipper').classList.toggle('flipped', cardFlipped);
}

function switchTab(tab) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById(`${tab}Tab`).classList.add('active');
}

function closeNotification() {
    document.getElementById('successNotification').classList.remove('show');
}

// ==========================================
// INITIALIZATION
// ==========================================

document.addEventListener('DOMContentLoaded', async () => {
    // تحميل الإحصائيات
    loadPlatformStats();
    setInterval(loadPlatformStats, 30000); // تحديث كل 30 ثانية
    
    // التحقق من حالة تسجيل الدخول
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        await loadUserData(session.user.id);
    }
    
    // عرض المقالات
    renderNews();
    
    // إنشاء جزيئات الخلفية
    createParticles();
});

function createParticles() {
    const container = document.getElementById('particles');
    if (!container) return;
    
    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 20 + 's';
        particle.style.animationDuration = (20 + Math.random() * 20) + 's';
        container.appendChild(particle);
    }
}

function renderNews() {
    const container = document.getElementById('newsGrid');
    if (!container) return;
    
    container.innerHTML = newsArticles.map(article => `
        <div class="news-card" onclick="openArticle(${article.id})">
            <div class="news-img" style="background-image:url('${article.img}')"></div>
            <div class="news-content">
                <span class="news-cat ${article.cat}">${getCategoryName(article.cat)}</span>
                <h4 class="news-title">${article.title}</h4>
                <p class="news-summary">${article.summary}</p>
                <div class="news-meta">
                    <span><i class="fas fa-calendar"></i> ${new Date(article.date).toLocaleDateString('ar-IQ')}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function getCategoryName(cat) {
    const names = {
        'invest': 'استثمار',
        'update': 'تحديثات',
        'guide': 'دليل'
    };
    return names[cat] || cat;
}

function openArticle(id) {
    const article = newsArticles.find(a => a.id === id);
    if (!article) return;
    
    const modal = document.getElementById('articleModal');
    const content = document.getElementById('articleContent');
    
    content.innerHTML = `
        <div class="article-header">
            <span class="article-cat ${article.cat}">${getCategoryName(article.cat)}</span>
            <h2>${article.title}</h2>
            <div class="article-meta">
                <span><i class="fas fa-calendar"></i> ${new Date(article.date).toLocaleDateString('ar-IQ')}</span>
            </div>
        </div>
        <div class="article-body">${article.body.split('\n').map(p => `<p>${p}</p>`).join('')}</div>
    `;
    
    modal.classList.add('active');
}

function closeArticleModal() {
    document.getElementById('articleModal').classList.remove('active');
}

// Enter key handlers
document.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        if (document.getElementById('loginForm').classList.contains('active')) {
            login();
        } else if (document.getElementById('signupForm').classList.contains('active')) {
            signup();
        }
    }
});