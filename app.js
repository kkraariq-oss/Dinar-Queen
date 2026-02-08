// ==========================================
// DINAR COIN - Complete App JavaScript V3.0
// Supabase Only - No Firebase
// ==========================================

// ==========================================
// SUPABASE CONFIGURATION
// ==========================================
const SUPABASE_URL = "https://umlbxdcgpdifxzijujvj.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtbGJ4ZGNncGRpZnh6aWp1anZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0NzQzODUsImV4cCI6MjA4NjA1MDM4NX0.Ld3fU2_B4eu803BsDYKQ0ofg69WxQPJcscGf93lnM3w";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==========================================
// CONSTANTS
// ==========================================
const PRICE_PER_COIN = 1000;
const TOTAL_SUPPLY = 1000000;
const WELCOME_BONUS = 1.0;
const REFERRAL_BONUS = 0.25;

// ==========================================
// GLOBAL VARIABLES
// ==========================================
let currentUser = null;
let currentProfile = null;
let currentWallet = null;
let cardFlipped = false;
let cardNumVisible = false;
let cvvVisible = false;

// ==========================================
// SERVICE WORKER REGISTRATION
// ==========================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/Dinar-Queen/sw.js')
            .then(() => console.log('SW registered'))
            .catch(err => console.error('SW registration failed:', err));
    });
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

// Generate unique card number
function generateCardNumber() {
    const prefix = '5428'; // Mastercard prefix
    let number = prefix;
    for (let i = 0; i < 12; i++) {
        number += Math.floor(Math.random() * 10);
    }
    return number;
}

// Generate CVV
function generateCVV() {
    return Math.floor(100 + Math.random() * 900).toString();
}

// Generate card expiry (3 years from now)
function generateExpiry() {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear() + 3).slice(-2);
    return `${month}/${year}`;
}

// Generate unique referral code (8 chars)
function generateReferralCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// Format number with commas
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Update element text safely
function updateElement(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

// Update element HTML safely
function updateElementHTML(id, html) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
}

// ==========================================
// AUTHENTICATION FUNCTIONS
// ==========================================

// Sign Up with complete profile creation
async function signUpWithProfile(formData) {
    try {
        // 1. Create auth account
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: formData.email,
            password: formData.password
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error('Failed to create user');

        const userId = authData.user.id;

        // 2. Generate card and referral data
        const cardNumber = generateCardNumber();
        const cardCVV = generateCVV();
        const cardExpiry = generateExpiry();
        const referralCode = await generateUniqueReferralCode();

        // 3. Create profile with all data
        const { error: profileError } = await supabase
            .from('profiles')
            .insert({
                id: userId,
                email: formData.email,
                first_name: formData.firstName || '',
                last_name: formData.lastName || '',
                phone: formData.phone || '',
                country: formData.country || 'IQ',
                card_number: cardNumber,
                card_cvv: cardCVV,
                card_expiry: cardExpiry,
                referral_code: referralCode,
                join_date: new Date().toISOString()
            });

        if (profileError) throw profileError;

        // 4. Create wallet
        const { error: walletError } = await supabase
            .from('wallets')
            .insert({
                user_id: userId,
                balance: 0
            });

        if (walletError) throw walletError;

        // 5. Add welcome bonus (using RPC for security)
        // Note: This requires service_role, so we'll do it via edge function or admin
        // For now, we'll add it directly (you should use Edge Function in production)
        const { error: bonusError } = await supabase.rpc('add_welcome_bonus', {
            p_user_id: userId,
            p_amount: WELCOME_BONUS
        });

        // If RPC fails (permission issue), add manually for demo
        if (bonusError) {
            console.warn('RPC failed, adding bonus manually:', bonusError);
            await supabase.from('wallets')
                .update({ balance: WELCOME_BONUS })
                .eq('user_id', userId);
            
            await supabase.from('transactions')
                .insert({
                    to_user: userId,
                    amount: WELCOME_BONUS,
                    type: 'welcome',
                    status: 'completed',
                    note: 'مكافأة الترحيب'
                });
        }

        // 6. Handle referral if provided
        if (formData.referredBy) {
            await processReferralBonus(formData.referredBy);
        }

        return { success: true, user: authData.user };

    } catch (error) {
        console.error('Signup error:', error);
        throw error;
    }
}

// Generate unique referral code (check for duplicates)
async function generateUniqueReferralCode() {
    let attempts = 0;
    while (attempts < 10) {
        const code = generateReferralCode();
        
        // Check if code exists
        const { data } = await supabase
            .from('profiles')
            .select('referral_code')
            .eq('referral_code', code)
            .maybeSingle();
        
        if (!data) return code; // Code is unique
        attempts++;
    }
    
    // Fallback: add timestamp
    return generateReferralCode() + Date.now().toString().slice(-4);
}

// Process referral bonus for referrer
async function processReferralBonus(referralCode) {
    try {
        // Find referrer
        const { data: referrer } = await supabase
            .from('profiles')
            .select('id')
            .eq('referral_code', referralCode)
            .maybeSingle();
        
        if (!referrer) return;

        // Add bonus using RPC
        const { error } = await supabase.rpc('add_referral_bonus', {
            p_referrer_id: referrer.id,
            p_amount: REFERRAL_BONUS
        });

        if (error) {
            console.warn('Referral bonus RPC failed:', error);
            // Manual fallback
            await supabase.from('wallets')
                .update({ balance: supabase.raw(`balance + ${REFERRAL_BONUS}`) })
                .eq('user_id', referrer.id);
            
            await supabase.from('transactions')
                .insert({
                    to_user: referrer.id,
                    amount: REFERRAL_BONUS,
                    type: 'referral',
                    status: 'completed',
                    note: 'مكافأة إحالة صديق'
                });
        }
    } catch (error) {
        console.error('Referral processing error:', error);
    }
}

// Sign In
async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });
    
    if (error) throw error;
    return data;
}

// Sign Out
async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    // Clear local data
    currentUser = null;
    currentProfile = null;
    currentWallet = null;
}

// Get current user
async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

// ==========================================
// DATA LOADING FUNCTIONS
// ==========================================

// Load profile and wallet
async function loadUserData() {
    try {
        const user = await getCurrentUser();
        if (!user) throw new Error('Not authenticated');

        // Load profile
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

        if (profileError) throw profileError;

        // If no profile exists, create one (shouldn't happen after signup fix)
        if (!profile) {
            const referralCode = await generateUniqueReferralCode();
            const { data: newProfile, error: createError } = await supabase
                .from('profiles')
                .insert({
                    id: user.id,
                    email: user.email,
                    first_name: '',
                    last_name: '',
                    phone: '',
                    country: 'IQ',
                    card_number: generateCardNumber(),
                    card_cvv: generateCVV(),
                    card_expiry: generateExpiry(),
                    referral_code: referralCode,
                    join_date: new Date().toISOString()
                })
                .select()
                .single();

            if (createError) throw createError;
            currentProfile = newProfile;
        } else {
            currentProfile = profile;
        }

        // Load wallet
        const { data: wallet, error: walletError } = await supabase
            .from('wallets')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

        if (walletError) throw walletError;

        // If no wallet exists, create one
        if (!wallet) {
            const { data: newWallet, error: createError } = await supabase
                .from('wallets')
                .insert({
                    user_id: user.id,
                    balance: 0
                })
                .select()
                .single();

            if (createError) throw createError;
            currentWallet = newWallet;
        } else {
            currentWallet = wallet;
        }

        currentUser = user;
        return { profile: currentProfile, wallet: currentWallet };

    } catch (error) {
        console.error('Load user data error:', error);
        throw error;
    }
}

// Load transactions
async function loadTransactions(limit = 50) {
    try {
        const user = await getCurrentUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .or(`from_user.eq.${user.id},to_user.eq.${user.id}`)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data || [];

    } catch (error) {
        console.error('Load transactions error:', error);
        return [];
    }
}

// Load global stats
async function loadGlobalStats() {
    try {
        const { data, error } = await supabase
            .from('global_stats')
            .select('*')
            .eq('id', 1)
            .maybeSingle();

        if (error) throw error;
        
        return data || {
            total_users: 0,
            total_distributed: 0,
            total_remaining: TOTAL_SUPPLY
        };

    } catch (error) {
        console.error('Load global stats error:', error);
        return {
            total_users: 0,
            total_distributed: 0,
            total_remaining: TOTAL_SUPPLY
        };
    }
}

// ==========================================
// TRANSACTION FUNCTIONS
// ==========================================

// Send money by referral code
async function sendMoneyByReferral(referralCode, amount, note = '') {
    try {
        const { data, error } = await supabase.rpc('send_by_referral', {
            p_code: referralCode,
            p_amount: parseFloat(amount),
            p_note: note
        });

        if (error) throw error;
        
        // Check for error in response
        if (data && data.error) {
            throw new Error(data.error);
        }

        return data;

    } catch (error) {
        console.error('Send money error:', error);
        throw error;
    }
}

// Request topup (purchase)
async function requestTopup(amount, note = '') {
    try {
        const { data, error } = await supabase.rpc('request_topup', {
            p_amount: parseFloat(amount),
            p_note: note
        });

        if (error) throw error;
        
        if (data && data.error) {
            throw new Error(data.error);
        }

        return data;

    } catch (error) {
        console.error('Request topup error:', error);
        throw error;
    }
}

// ==========================================
// UI UPDATE FUNCTIONS
// ==========================================

// Apply user data to UI
function applyUserDataToUI() {
    if (!currentProfile || !currentWallet) return;

    const fullName = `${currentProfile.first_name || 'مستخدم'} ${currentProfile.last_name || ''}`.trim();
    const email = currentUser?.email || currentProfile.email || '';
    const balance = Number(currentWallet.balance || 0).toFixed(2);

    // Update user info
    updateElement('userName', fullName);
    updateElement('userEmail', email);
    updateElement('profileName', fullName);
    updateElement('profileNameDisplay', fullName);
    updateElement('profileEmailValue', email);

    // Update balance
    updateElement('cardBalance', balance + ' DC');
    updateElement('totalBalance', balance + ' DC');
    updateElement('profileBalance', balance + ' DC');

    // Update card info
    updateElement('cardName', fullName);
    if (currentProfile.card_number) {
        updateElement('cardNumber', formatCardNumber(currentProfile.card_number));
        updateElement('cardNumberFull', formatCardNumber(currentProfile.card_number));
    }
    if (currentProfile.card_expiry) {
        updateElement('cardExpiry', currentProfile.card_expiry);
    }
    if (currentProfile.card_cvv) {
        updateElement('cardCVV', currentProfile.card_cvv);
    }

    // Update referral code
    if (currentProfile.referral_code) {
        updateElement('myReferralCode', currentProfile.referral_code);
        updateElement('receiveCode', currentProfile.referral_code);
    }

    // Update join date
    if (currentProfile.join_date) {
        const joinDate = new Date(currentProfile.join_date);
        updateElement('profileJoinDate', joinDate.toLocaleDateString('ar-IQ'));
    }

    // Update referral stats
    updateElement('profileReferralCount', currentProfile.referral_count || 0);
    updateElement('profileReferralEarnings', (currentProfile.referral_earnings || 0).toFixed(2) + ' DC');

    // Update avatar
    const firstLetter = fullName.charAt(0).toUpperCase() || 'U';
    updateElement('userAvatar', firstLetter);
    updateElement('profileAvatar', firstLetter);

    // Generate QR Code for receiving
    generateReceiveQR();
}

// Format card number with spaces
function formatCardNumber(cardNum) {
    if (!cardNum) return '•••• •••• •••• ••••';
    return cardNum.match(/.{1,4}/g).join(' ');
}

// Generate QR code for receiving
function generateReceiveQR() {
    if (!currentProfile || !currentProfile.referral_code) return;

    const qrContainer = document.getElementById('qrcode');
    if (!qrContainer) return;

    // Clear existing QR
    qrContainer.innerHTML = '';

    // Generate new QR
    try {
        new QRCode(qrContainer, {
            text: currentProfile.referral_code,
            width: 200,
            height: 200,
            colorDark: '#D4AF37',
            colorLight: '#0a1a14'
        });
    } catch (error) {
        console.error('QR generation error:', error);
    }
}

// Update global stats in UI
async function updateGlobalStatsUI() {
    const stats = await loadGlobalStats();
    
    updateElement('homeUsersCount', formatNumber(stats.total_users));
    updateElement('dashUsersCount', formatNumber(stats.total_users));
    
    const remaining = Math.max(0, stats.total_remaining);
    updateElement('homeCoinsRemaining', formatNumber(Math.floor(remaining)));
    updateElement('dashCoinsRemaining', formatNumber(Math.floor(remaining)));
}

// Display transactions in UI
async function displayTransactions() {
    const transactions = await loadTransactions(20);
    const container = document.getElementById('transactionsList');
    
    if (!container) return;

    if (transactions.length === 0) {
        container.innerHTML = `
            <div style="text-align:center;padding:40px 20px;color:rgba(255,255,255,0.5);">
                <i class="fas fa-inbox" style="font-size:48px;margin-bottom:15px;"></i>
                <p>لا توجد معاملات بعد</p>
            </div>
        `;
        return;
    }

    let html = '';
    transactions.forEach(tx => {
        const isReceived = tx.to_user === currentUser?.id;
        const icon = isReceived ? 'arrow-down' : 'arrow-up';
        const iconClass = isReceived ? 'receive' : 'send';
        const sign = isReceived ? '+' : '-';
        const amountClass = isReceived ? 'amount-positive' : 'amount-negative';
        
        let title = '';
        if (tx.type === 'welcome') title = 'مكافأة الترحيب';
        else if (tx.type === 'referral') title = 'مكافأة إحالة';
        else if (tx.type === 'send') title = isReceived ? 'استلام' : 'إرسال';
        else if (tx.type === 'topup') title = 'شراء رصيد';
        else title = tx.type;

        const date = new Date(tx.created_at).toLocaleDateString('ar-IQ');

        html += `
            <div class="transaction-item">
                <div class="transaction-icon ${iconClass}">
                    <i class="fas fa-${icon}"></i>
                </div>
                <div class="transaction-details">
                    <div class="transaction-title">${title}</div>
                    <div class="transaction-date">${date}</div>
                    ${tx.note ? `<div class="transaction-note">${tx.note}</div>` : ''}
                </div>
                <div class="transaction-amount ${amountClass}">
                    ${sign}${tx.amount.toFixed(2)} DC
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

// ==========================================
// APP INITIALIZATION
// ==========================================

function initializeApp() {
    // Auth state listener
    supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event);

        if (session?.user) {
            try {
                await loadUserData();
                showDashboard();
            } catch (error) {
                console.error('Error loading user data:', error);
                showNotification('خطأ', 'فشل تحميل البيانات', 'error');
            }
        } else {
            currentUser = null;
            currentProfile = null;
            currentWallet = null;
            showHome();
        }
    });

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
            loadUserData()
                .then(() => showDashboard())
                .catch(error => {
                    console.error('Initial load error:', error);
                    showHome();
                });
        } else {
            showHome();
        }
    });

    // Load global stats
    updateGlobalStatsUI();
    setInterval(updateGlobalStatsUI, 30000); // Update every 30 seconds
}

// ==========================================
// SCREEN NAVIGATION
// ==========================================

function showHome() {
    hideAllScreens();
    document.getElementById('homeScreen')?.classList.add('active-screen');
    updateGlobalStatsUI();
}

function showDashboard() {
    hideAllScreens();
    document.getElementById('dashboardScreen')?.classList.add('active-screen');
    applyUserDataToUI();
    switchTab('home');
    updateGlobalStatsUI();
}

function hideAllScreens() {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active-screen');
    });
}

function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`.tab-btn[onclick="switchTab('${tabName}')"]`)?.classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}Tab`)?.classList.add('active');

    // Load data for specific tabs
    if (tabName === 'analytics') {
        displayTransactions();
    }
}

// ==========================================
// AUTH MODAL FUNCTIONS
// ==========================================

function showAuthModal(mode) {
    const isSignup = mode === 'signup';
    const title = isSignup ? 'إنشاء حساب جديد' : 'تسجيل الدخول';
    const buttonText = isSignup ? 'إنشاء الحساب' : 'دخول';
    
    const signupFields = isSignup ? `
        <input type="text" id="signupFirstName" placeholder="الاسم الأول" required>
        <input type="text" id="signupLastName" placeholder="الاسم الأخير" required>
        <input type="tel" id="signupPhone" placeholder="رقم الهاتف" required>
        <select id="signupCountry">
            <option value="IQ">العراق 🇮🇶</option>
            <option value="SA">السعودية 🇸🇦</option>
            <option value="AE">الإمارات 🇦🇪</option>
            <option value="KW">الكويت 🇰🇼</option>
        </select>
        <input type="text" id="signupReferral" placeholder="رمز الإحالة (اختياري)">
    ` : '';

    const html = `
        <div class="modal-overlay active" id="authModal">
            <div class="modal-sheet">
                <div class="modal-handle"></div>
                <button class="modal-close-btn" onclick="closeAuthModal()">
                    <i class="fas fa-times"></i>
                </button>
                <div class="modal-icon-header">
                    <div class="modal-icon-circle ${isSignup ? 'send' : 'receive'}">
                        <i class="fas fa-${isSignup ? 'user-plus' : 'sign-in-alt'}"></i>
                    </div>
                    <h2>${title}</h2>
                </div>
                <form id="authForm" style="padding:20px;">
                    <input type="email" id="authEmail" placeholder="البريد الإلكتروني" required>
                    <input type="password" id="authPassword" placeholder="كلمة المرور" required>
                    ${signupFields}
                    <button type="submit" class="btn-primary" style="width:100%;margin-top:15px;">
                        ${buttonText}
                    </button>
                </form>
                <div style="text-align:center;padding:15px;color:rgba(255,255,255,0.6);">
                    ${isSignup 
                        ? '<a href="#" onclick="showAuthModal(\'login\');return false;">لديك حساب؟ تسجيل الدخول</a>'
                        : '<a href="#" onclick="showAuthModal(\'signup\');return false;">ليس لديك حساب؟ إنشاء حساب</a>'
                    }
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);

    // Add form submit handler
    document.getElementById('authForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('authEmail').value;
        const password = document.getElementById('authPassword').value;

        try {
            if (isSignup) {
                const formData = {
                    email,
                    password,
                    firstName: document.getElementById('signupFirstName').value,
                    lastName: document.getElementById('signupLastName').value,
                    phone: document.getElementById('signupPhone').value,
                    country: document.getElementById('signupCountry').value,
                    referredBy: document.getElementById('signupReferral').value || null
                };

                await signUpWithProfile(formData);
                showNotification('نجح!', 'تم إنشاء الحساب بنجاح', 'success');
                closeAuthModal();
            } else {
                await signIn(email, password);
                showNotification('أهلاً!', 'تم تسجيل الدخول بنجاح', 'success');
                closeAuthModal();
            }
        } catch (error) {
            console.error('Auth error:', error);
            showNotification('خطأ', error.message || 'فشلت العملية', 'error');
        }
    });
}

function closeAuthModal() {
    document.getElementById('authModal')?.remove();
}

// ==========================================
// LOGOUT FUNCTION
// ==========================================

async function logout() {
    try {
        await signOut();
        showNotification('تم', 'تم تسجيل الخروج بنجاح', 'success');
        showHome();
    } catch (error) {
        console.error('Logout error:', error);
        showNotification('خطأ', 'فشل تسجيل الخروج', 'error');
    }
}

// ==========================================
// SEND MONEY MODAL
// ==========================================

function showSendModal() {
    const html = `
        <div class="modal-overlay active" id="sendModal">
            <div class="modal-sheet">
                <div class="modal-handle"></div>
                <button class="modal-close-btn" onclick="closeSendModal()">
                    <i class="fas fa-times"></i>
                </button>
                <div class="modal-icon-header">
                    <div class="modal-icon-circle send">
                        <i class="fas fa-paper-plane"></i>
                    </div>
                    <h2>إرسال دينار كوين</h2>
                </div>
                <form id="sendForm" style="padding:20px;">
                    <label style="color:rgba(255,255,255,0.8);margin-bottom:8px;display:block;">رمز الإحالة للمستلم</label>
                    <input type="text" id="sendRecipientCode" placeholder="مثال: ABC12345" required style="margin-bottom:15px;">
                    
                    <label style="color:rgba(255,255,255,0.8);margin-bottom:8px;display:block;">المبلغ (DC)</label>
                    <input type="number" id="sendAmount" placeholder="0.00" step="0.01" min="0.01" required style="margin-bottom:15px;">
                    
                    <label style="color:rgba(255,255,255,0.8);margin-bottom:8px;display:block;">ملاحظة (اختياري)</label>
                    <textarea id="sendNote" placeholder="أضف ملاحظة..." style="margin-bottom:15px;"></textarea>
                    
                    <div style="background:rgba(255,255,255,0.05);padding:12px;border-radius:8px;margin-bottom:15px;">
                        <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
                            <span style="color:rgba(255,255,255,0.6);">رصيدك الحالي:</span>
                            <span style="color:var(--gold-primary);font-weight:bold;">${currentWallet?.balance.toFixed(2) || '0.00'} DC</span>
                        </div>
                    </div>
                    
                    <button type="submit" class="btn-primary" style="width:100%;">
                        <i class="fas fa-paper-plane"></i> إرسال الآن
                    </button>
                </form>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);

    document.getElementById('sendForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const recipientCode = document.getElementById('sendRecipientCode').value.trim().toUpperCase();
        const amount = parseFloat(document.getElementById('sendAmount').value);
        const note = document.getElementById('sendNote').value.trim();

        if (!recipientCode || amount <= 0) {
            showNotification('خطأ', 'الرجاء ملء البيانات بشكل صحيح', 'error');
            return;
        }

        if (amount > currentWallet.balance) {
            showNotification('خطأ', 'الرصيد غير كافٍ', 'error');
            return;
        }

        try {
            await sendMoneyByReferral(recipientCode, amount, note);
            showNotification('نجح!', `تم إرسال ${amount.toFixed(2)} DC بنجاح`, 'success');
            closeSendModal();
            
            // Reload data
            await loadUserData();
            applyUserDataToUI();
            displayTransactions();
        } catch (error) {
            console.error('Send error:', error);
            showNotification('خطأ', error.message || 'فشل الإرسال', 'error');
        }
    });
}

function closeSendModal() {
    document.getElementById('sendModal')?.remove();
}

// ==========================================
// BUY MODAL
// ==========================================

function showBuyModal() {
    const html = `
        <div class="modal-overlay active" id="buyModal">
            <div class="modal-sheet">
                <div class="modal-handle"></div>
                <button class="modal-close-btn" onclick="closeBuyModal()">
                    <i class="fas fa-times"></i>
                </button>
                <div class="modal-icon-header">
                    <div class="modal-icon-circle receive">
                        <i class="fas fa-shopping-cart"></i>
                    </div>
                    <h2>شراء دينار كوين</h2>
                </div>
                <form id="buyForm" style="padding:20px;">
                    <label style="color:rgba(255,255,255,0.8);margin-bottom:8px;display:block;">الكمية (DC)</label>
                    <input type="number" id="buyAmount" placeholder="0.00" step="0.01" min="0.01" required style="margin-bottom:15px;">
                    
                    <div style="background:rgba(255,255,255,0.05);padding:12px;border-radius:8px;margin-bottom:15px;">
                        <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
                            <span style="color:rgba(255,255,255,0.6);">السعر:</span>
                            <span style="color:var(--gold-primary);">1 DC = ${PRICE_PER_COIN.toLocaleString()} IQD</span>
                        </div>
                        <div style="display:flex;justify-content:space-between;">
                            <span style="color:rgba(255,255,255,0.6);">الإجمالي:</span>
                            <span style="color:var(--gold-primary);font-weight:bold;" id="buyTotal">0 IQD</span>
                        </div>
                    </div>
                    
                    <label style="color:rgba(255,255,255,0.8);margin-bottom:8px;display:block;">ملاحظة (اختياري)</label>
                    <textarea id="buyNote" placeholder="رقم هاتفك أو طريقة الدفع المفضلة..." style="margin-bottom:15px;"></textarea>
                    
                    <div style="background:rgba(212,175,55,0.1);border:1px solid var(--gold-primary);padding:12px;border-radius:8px;margin-bottom:15px;">
                        <p style="color:rgba(255,255,255,0.8);font-size:13px;line-height:1.6;">
                            <i class="fas fa-info-circle" style="color:var(--gold-primary);"></i>
                            سيتم مراجعة طلبك من قبل الإدارة وإضافة الرصيد خلال 24 ساعة.
                        </p>
                    </div>
                    
                    <button type="submit" class="btn-primary" style="width:100%;">
                        <i class="fas fa-shopping-cart"></i> إرسال الطلب
                    </button>
                </form>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);

    // Update total on amount change
    document.getElementById('buyAmount').addEventListener('input', (e) => {
        const amount = parseFloat(e.target.value) || 0;
        const total = amount * PRICE_PER_COIN;
        document.getElementById('buyTotal').textContent = total.toLocaleString() + ' IQD';
    });

    document.getElementById('buyForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const amount = parseFloat(document.getElementById('buyAmount').value);
        const note = document.getElementById('buyNote').value.trim();

        if (!amount || amount <= 0) {
            showNotification('خطأ', 'الرجاء إدخال كمية صحيحة', 'error');
            return;
        }

        try {
            await requestTopup(amount, note);
            showNotification('تم!', 'تم إرسال طلبك بنجاح. سيتم مراجعته قريباً.', 'success');
            closeBuyModal();
        } catch (error) {
            console.error('Buy error:', error);
            showNotification('خطأ', error.message || 'فشل إرسال الطلب', 'error');
        }
    });
}

function closeBuyModal() {
    document.getElementById('buyModal')?.remove();
}

// ==========================================
// RECEIVE MODAL
// ==========================================

function showReceiveModal() {
    const code = currentProfile?.referral_code || 'Loading...';

    const html = `
        <div class="modal-overlay active" id="receiveModal">
            <div class="modal-sheet modal-small">
                <div class="modal-handle"></div>
                <button class="modal-close-btn" onclick="closeReceiveModal()">
                    <i class="fas fa-times"></i>
                </button>
                <div class="modal-icon-header">
                    <div class="modal-icon-circle receive">
                        <i class="fas fa-qrcode"></i>
                    </div>
                    <h2>استقبال دينار كوين</h2>
                </div>
                <div style="padding:20px;text-align:center;">
                    <p style="color:rgba(255,255,255,0.8);margin-bottom:20px;">
                        شارك رمز الإحالة أو رمز QR لاستقبال الأموال
                    </p>
                    
                    <div id="qrcodeReceive" style="margin:20px auto;max-width:200px;"></div>
                    
                    <div style="background:rgba(255,255,255,0.05);padding:15px;border-radius:12px;margin:20px 0;">
                        <div style="color:rgba(255,255,255,0.6);font-size:13px;margin-bottom:8px;">رمز الإحالة الخاص بك</div>
                        <div style="color:var(--gold-primary);font-size:24px;font-weight:bold;letter-spacing:2px;">
                            ${code}
                        </div>
                    </div>
                    
                    <button onclick="copyReferralCode('${code}')" class="btn-primary" style="width:100%;">
                        <i class="fas fa-copy"></i> نسخ الرمز
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);

    // Generate QR
    const qrContainer = document.getElementById('qrcodeReceive');
    if (qrContainer && code !== 'Loading...') {
        try {
            new QRCode(qrContainer, {
                text: code,
                width: 200,
                height: 200,
                colorDark: '#D4AF37',
                colorLight: '#0a1a14'
            });
        } catch (error) {
            console.error('QR generation error:', error);
        }
    }
}

function closeReceiveModal() {
    document.getElementById('receiveModal')?.remove();
}

function copyReferralCode(code) {
    navigator.clipboard.writeText(code)
        .then(() => showNotification('تم!', 'تم نسخ الرمز', 'success'))
        .catch(() => showNotification('خطأ', 'فشل النسخ', 'error'));
}

// ==========================================
// CARD FUNCTIONS
// ==========================================

function flipCard() {
    cardFlipped = !cardFlipped;
    document.querySelector('.virtual-card')?.classList.toggle('flipped');
}

function toggleCardNumber() {
    cardNumVisible = !cardNumVisible;
    const el = document.getElementById('cardNumber');
    if (el && currentProfile?.card_number) {
        el.textContent = cardNumVisible 
            ? formatCardNumber(currentProfile.card_number)
            : '•••• •••• •••• ' + currentProfile.card_number.slice(-4);
    }
}

function toggleCVV() {
    cvvVisible = !cvvVisible;
    const el = document.getElementById('cardCVV');
    if (el && currentProfile?.card_cvv) {
        el.textContent = cvvVisible ? currentProfile.card_cvv : '•••';
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
    setTimeout(() => notification.classList.remove('active'), 4000);
}

function closeNotification() {
    document.getElementById('successNotification')?.classList.remove('active');
}

// ==========================================
// SETTINGS FUNCTIONS
// ==========================================

function toggleDarkMode() {
    const toggle = document.getElementById('toggle-darkmode');
    const isActive = toggle?.classList.toggle('active');
    localStorage.setItem('setting-darkmode', isActive);
    applyDarkMode(isActive);
}

function toggleNotifications() {
    const toggle = document.getElementById('toggle-notifications');
    const isActive = toggle?.classList.toggle('active');
    localStorage.setItem('setting-notifications', isActive);
    showNotification('تم', isActive ? 'تم تفعيل الإشعارات' : 'تم إيقاف الإشعارات', 'success');
}

function toggleBiometric() {
    const toggle = document.getElementById('toggle-biometric');
    const isActive = toggle?.classList.toggle('active');
    localStorage.setItem('setting-biometric', isActive);
    showNotification('تم', isActive ? 'تم تفعيل البصمة' : 'تم إيقاف البصمة', 'success');
}

function applyDarkMode(enabled) {
    // Implementation for dark mode (if needed)
    // Currently app is already dark themed
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
// OTHER MODALS
// ==========================================

function showLanguageModal() {
    showNotification('قريباً', 'ميزة تغيير اللغة ستتوفر قريباً', 'success');
}

function showSecurityModal() {
    showNotification('قريباً', 'إعدادات الأمان ستتوفر قريباً', 'success');
}

function showHelpModal() {
    showNotification('قريباً', 'المساعدة والدعم ستتوفر قريباً', 'success');
}

// ==========================================
// UTILITY EVENT LISTENERS
// ==========================================

// Close modals on overlay click
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('active');
    }
});

// Prevent form submission on Enter key
document.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
        e.preventDefault();
    }
});

// ==========================================
// APP INITIALIZATION ON LOAD
// ==========================================

window.addEventListener('DOMContentLoaded', () => {
    console.log('Dinar Queen V3.0 - Supabase Edition');
    initializeApp();
    loadSettings();
});