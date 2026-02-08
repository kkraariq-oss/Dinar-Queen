-- ==========================================
-- جدول قاعدة البيانات الكامل لتطبيق دينار كوين
-- Supabase Database Schema
-- ==========================================

-- 1. جدول المستخدمين (users)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    
    -- معلومات شخصية أساسية
    name TEXT NOT NULL,
    username TEXT UNIQUE,
    phone_number TEXT,
    country_code TEXT DEFAULT '+964',
    country TEXT DEFAULT 'العراق',
    
    -- معلومات العنوان
    address TEXT,
    city TEXT,
    street TEXT,
    
    -- صورة البروفايل
    profile_picture_url TEXT,
    
    -- معلومات المحفظة
    balance DECIMAL(18, 2) DEFAULT 1.00,
    referral_code TEXT UNIQUE NOT NULL,
    referral_count INTEGER DEFAULT 0,
    referral_earnings DECIMAL(18, 2) DEFAULT 0.00,
    referred_by TEXT,
    
    -- معلومات البطاقة الرقمية
    card_number TEXT UNIQUE NOT NULL,
    card_cvv TEXT NOT NULL,
    card_expiry TEXT NOT NULL,
    
    -- معلومات الحساب
    join_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- طوابع زمنية
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. جدول المعاملات (transactions)
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- معلومات المعاملة
    type TEXT NOT NULL, -- 'send', 'receive', 'buy', 'bonus'
    amount DECIMAL(18, 2) NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'completed', -- 'pending', 'completed', 'failed'
    
    -- معلومات إضافية
    recipient_id UUID REFERENCES users(id),
    note TEXT,
    
    -- طوابع زمنية
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. جدول طلبات الشراء (purchase_requests)
CREATE TABLE IF NOT EXISTS purchase_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- معلومات الطلب
    amount DECIMAL(18, 2) NOT NULL,
    total_iqd DECIMAL(18, 2) NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    
    -- ملاحظات
    admin_note TEXT,
    
    -- طوابع زمنية
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. جدول الإحصائيات العامة (global_stats)
CREATE TABLE IF NOT EXISTS global_stats (
    id INTEGER PRIMARY KEY DEFAULT 1,
    total_users INTEGER DEFAULT 0,
    total_distributed DECIMAL(18, 2) DEFAULT 0.00,
    total_remaining DECIMAL(18, 2) DEFAULT 1000000.00,
    
    -- طوابع زمنية
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- منع إدراج أكثر من صف واحد
    CONSTRAINT single_row CHECK (id = 1)
);

-- إدراج الصف الافتراضي للإحصائيات
INSERT INTO global_stats (id, total_users, total_distributed, total_remaining)
VALUES (1, 0, 0.00, 1000000.00)
ON CONFLICT (id) DO NOTHING;

-- 5. جدول الجلسات (sessions) - اختياري
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- معلومات الجلسة
    token TEXT UNIQUE NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    
    -- صلاحية الجلسة
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- طوابع زمنية
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- الفهارس (Indexes) لتحسين الأداء
-- ==========================================

-- فهارس جدول المستخدمين
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_users_phone_number ON users(phone_number);

-- فهارس جدول المعاملات
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(timestamp);

-- فهارس جدول طلبات الشراء
CREATE INDEX IF NOT EXISTS idx_purchase_requests_user_id ON purchase_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_status ON purchase_requests(status);

-- فهارس جدول الجلسات
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);

-- ==========================================
-- الدوال المخصصة (Functions)
-- ==========================================

-- دالة لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- تطبيق الدالة على الجداول
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_purchase_requests_updated_at ON purchase_requests;
CREATE TRIGGER update_purchase_requests_updated_at
    BEFORE UPDATE ON purchase_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_global_stats_updated_at ON global_stats;
CREATE TRIGGER update_global_stats_updated_at
    BEFORE UPDATE ON global_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- سياسات الأمان (Row Level Security)
-- ==========================================

-- تفعيل RLS على جميع الجداول
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- سياسات جدول المستخدمين
-- يمكن للمستخدم قراءة وتعديل بياناته فقط
CREATE POLICY users_select_own 
    ON users FOR SELECT 
    USING (auth.uid()::text = id::text);

CREATE POLICY users_update_own 
    ON users FOR UPDATE 
    USING (auth.uid()::text = id::text);

-- سياسات جدول المعاملات
-- يمكن للمستخدم قراءة معاملاته فقط
CREATE POLICY transactions_select_own 
    ON transactions FOR SELECT 
    USING (auth.uid()::text = user_id::text);

CREATE POLICY transactions_insert_own 
    ON transactions FOR INSERT 
    WITH CHECK (auth.uid()::text = user_id::text);

-- سياسات جدول طلبات الشراء
CREATE POLICY purchase_requests_select_own 
    ON purchase_requests FOR SELECT 
    USING (auth.uid()::text = user_id::text);

CREATE POLICY purchase_requests_insert_own 
    ON purchase_requests FOR INSERT 
    WITH CHECK (auth.uid()::text = user_id::text);

-- سياسات جدول الإحصائيات العامة
-- يمكن للجميع القراءة، لا أحد يمكنه الكتابة مباشرة
CREATE POLICY global_stats_select_all 
    ON global_stats FOR SELECT 
    TO PUBLIC
    USING (true);

-- سياسات جدول الجلسات
CREATE POLICY sessions_select_own 
    ON sessions FOR SELECT 
    USING (auth.uid()::text = user_id::text);

-- ==========================================
-- دوال مساعدة للتطبيق
-- ==========================================

-- دالة للتحقق من رمز الإحالة
CREATE OR REPLACE FUNCTION validate_referral_code(ref_code TEXT)
RETURNS UUID AS $$
DECLARE
    user_uuid UUID;
BEGIN
    SELECT id INTO user_uuid 
    FROM users 
    WHERE referral_code = ref_code AND is_active = TRUE
    LIMIT 1;
    
    RETURN user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- دالة لمعالجة الإحالة
CREATE OR REPLACE FUNCTION process_referral(referrer_id UUID, bonus_amount DECIMAL)
RETURNS VOID AS $$
BEGIN
    -- تحديث بيانات المحيل
    UPDATE users 
    SET 
        balance = balance + bonus_amount,
        referral_count = referral_count + 1,
        referral_earnings = referral_earnings + bonus_amount
    WHERE id = referrer_id;
    
    -- إضافة معاملة للمحيل
    INSERT INTO transactions (user_id, type, amount, description, status)
    VALUES (referrer_id, 'bonus', bonus_amount, 'مكافأة إحالة', 'completed');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- دالة لتحديث الإحصائيات العامة
CREATE OR REPLACE FUNCTION update_global_stats(
    user_count_delta INTEGER DEFAULT 0,
    coins_delta DECIMAL DEFAULT 0
)
RETURNS VOID AS $$
BEGIN
    UPDATE global_stats 
    SET 
        total_users = GREATEST(0, total_users + user_count_delta),
        total_distributed = GREATEST(0, total_distributed + coins_delta),
        total_remaining = GREATEST(0, 1000000 - (total_distributed + coins_delta))
    WHERE id = 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- ملاحظات مهمة
-- ==========================================

/*
1. استخدم هذا الكود في محرر SQL في Supabase
2. قم بتشغيله بالكامل لإنشاء الجداول والفهارس
3. تأكد من تفعيل Authentication في Supabase
4. احفظ SUPABASE_URL و SUPABASE_ANON_KEY من إعدادات المشروع
5. استخدم Storage في Supabase لحفظ صور البروفايل
6. يمكنك إضافة المزيد من السياسات حسب الحاجة

مثال على إنشاء bucket للصور:
- اذهب إلى Storage في Supabase
- أنشئ bucket جديد باسم "profile-pictures"
- اضبط السياسات للسماح بالتحميل والقراءة
*/
