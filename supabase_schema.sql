-- ==========================================
-- جداول قاعدة البيانات لتطبيق دينار كوين
-- تم التصحيح - النسخة 3.1
-- ==========================================

-- جدول المستخدمين
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- المعلومات الشخصية
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    full_name VARCHAR(200) GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    phone_country_code VARCHAR(10) NOT NULL,
    
    -- معلومات العنوان
    country VARCHAR(100) NOT NULL,
    country_code VARCHAR(5) NOT NULL,
    city VARCHAR(100) NOT NULL,
    street VARCHAR(200),
    
    -- معلومات الحساب
    referral_code VARCHAR(20) UNIQUE NOT NULL,
    balance DECIMAL(20, 2) DEFAULT 0.00,
    welcome_bonus_received BOOLEAN DEFAULT FALSE,
    
    -- معلومات البطاقة
    card_number VARCHAR(19) NOT NULL,
    card_cvv VARCHAR(3) NOT NULL,
    card_expiry VARCHAR(7) NOT NULL,
    
    -- الإحصائيات
    total_sent DECIMAL(20, 2) DEFAULT 0.00,
    total_received DECIMAL(20, 2) DEFAULT 0.00,
    total_referrals INTEGER DEFAULT 0,
    referral_earnings DECIMAL(20, 2) DEFAULT 0.00,
    
    -- تواريخ
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    
    -- حالة الحساب
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE
);

-- جدول المعاملات
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- أطراف المعاملة
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    receiver_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- تفاصيل المعاملة
    amount DECIMAL(20, 2) NOT NULL,
    transaction_type VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'completed',
    
    -- معلومات إضافية
    note TEXT,
    reference_number VARCHAR(50) UNIQUE,
    
    -- تواريخ
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- جدول طلبات الشراء
CREATE TABLE IF NOT EXISTS buy_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- تفاصيل الطلب
    amount DECIMAL(20, 2) NOT NULL,
    total_iqd DECIMAL(20, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    
    -- ملاحظات
    user_note TEXT,
    admin_note TEXT,
    
    -- تواريخ
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- جدول الإحالات
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- أطراف الإحالة
    referrer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    referred_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- المكافأة
    bonus_amount DECIMAL(20, 2) DEFAULT 0.25,
    bonus_paid BOOLEAN DEFAULT FALSE,
    
    -- تواريخ
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    bonus_paid_at TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(referrer_id, referred_id)
);

-- جدول الإحصائيات العامة
CREATE TABLE IF NOT EXISTS platform_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- الإحصائيات
    total_users INTEGER DEFAULT 0,
    total_coins_distributed DECIMAL(20, 2) DEFAULT 0.00,
    total_transactions INTEGER DEFAULT 0,
    total_buy_requests INTEGER DEFAULT 0,
    
    -- تواريخ
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- إضافة صف واحد للإحصائيات
INSERT INTO platform_stats (id, total_users, total_coins_distributed)
VALUES (gen_random_uuid(), 0, 0.00)
ON CONFLICT DO NOTHING;

-- ==========================================
-- الفهارس لتحسين الأداء
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);
CREATE INDEX IF NOT EXISTS idx_users_country ON users(country);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_sender ON transactions(sender_id);
CREATE INDEX IF NOT EXISTS idx_transactions_receiver ON transactions(receiver_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(transaction_type);

CREATE INDEX IF NOT EXISTS idx_buy_requests_user ON buy_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_buy_requests_status ON buy_requests(status);
CREATE INDEX IF NOT EXISTS idx_buy_requests_created_at ON buy_requests(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_id);

-- ==========================================
-- الـ Triggers لتحديث updated_at
-- ==========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_buy_requests_updated_at ON buy_requests;
CREATE TRIGGER update_buy_requests_updated_at
    BEFORE UPDATE ON buy_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- الـ Functions لتحديث الإحصائيات
-- ==========================================

CREATE OR REPLACE FUNCTION update_platform_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE platform_stats
    SET 
        total_users = (SELECT COUNT(*) FROM users WHERE is_active = TRUE),
        total_coins_distributed = (SELECT COALESCE(SUM(balance), 0) FROM users),
        total_transactions = (SELECT COUNT(*) FROM transactions WHERE status = 'completed'),
        total_buy_requests = (SELECT COUNT(*) FROM buy_requests),
        last_updated = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_stats_on_user
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH STATEMENT
    EXECUTE FUNCTION update_platform_stats();

CREATE TRIGGER trigger_update_stats_on_transaction
    AFTER INSERT OR UPDATE OR DELETE ON transactions
    FOR EACH STATEMENT
    EXECUTE FUNCTION update_platform_stats();

-- ==========================================
-- Row Level Security (RLS) Policies
-- ==========================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE buy_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- سياسات المستخدمين
CREATE POLICY "Users can view their own data"
    ON users FOR SELECT
    USING (auth.uid() = auth_id);

CREATE POLICY "Users can update their own data"
    ON users FOR UPDATE
    USING (auth.uid() = auth_id);

-- سياسات المعاملات
CREATE POLICY "Users can view their own transactions"
    ON transactions FOR SELECT
    USING (
        auth.uid() IN (
            SELECT auth_id FROM users WHERE id = sender_id OR id = receiver_id
        )
    );

CREATE POLICY "Users can create transactions"
    ON transactions FOR INSERT
    WITH CHECK (
        auth.uid() IN (
            SELECT auth_id FROM users WHERE id = sender_id
        )
    );

-- سياسات طلبات الشراء
CREATE POLICY "Users can view their own buy requests"
    ON buy_requests FOR SELECT
    USING (
        auth.uid() IN (
            SELECT auth_id FROM users WHERE id = user_id
        )
    );

CREATE POLICY "Users can create buy requests"
    ON buy_requests FOR INSERT
    WITH CHECK (
        auth.uid() IN (
            SELECT auth_id FROM users WHERE id = user_id
        )
    );

-- سياسات الإحالات
CREATE POLICY "Users can view their own referrals"
    ON referrals FOR SELECT
    USING (
        auth.uid() IN (
            SELECT auth_id FROM users WHERE id = referrer_id OR id = referred_id
        )
    );

-- السماح لجميع المستخدمين بقراءة الإحصائيات العامة
CREATE POLICY "Anyone can view platform stats"
    ON platform_stats FOR SELECT
    TO authenticated
    USING (true);

-- ==========================================
-- Functions مساعدة
-- ==========================================

-- دالة لتوليد رمز إحالة فريد
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
    code TEXT;
    code_exists BOOLEAN;
BEGIN
    LOOP
        code := 'DC' || LPAD(FLOOR(RANDOM() * 100000000)::TEXT, 8, '0');
        SELECT EXISTS(SELECT 1 FROM users WHERE referral_code = code) INTO code_exists;
        EXIT WHEN NOT code_exists;
    END LOOP;
    RETURN code;
END;
$$ LANGUAGE plpgsql;

-- دالة لتوليد رقم بطاقة فريد
CREATE OR REPLACE FUNCTION generate_card_number()
RETURNS TEXT AS $$
DECLARE
    card TEXT;
    card_exists BOOLEAN;
BEGIN
    LOOP
        card := LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0') || ' ' ||
                LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0') || ' ' ||
                LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0') || ' ' ||
                LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
        SELECT EXISTS(SELECT 1 FROM users WHERE card_number = card) INTO card_exists;
        EXIT WHEN NOT card_exists;
    END LOOP;
    RETURN card;
END;
$$ LANGUAGE plpgsql;

-- دالة لتوليد CVV عشوائي
CREATE OR REPLACE FUNCTION generate_cvv()
RETURNS TEXT AS $$
BEGIN
    RETURN LPAD(FLOOR(RANDOM() * 1000)::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

-- دالة لتوليد تاريخ انتهاء البطاقة (5 سنوات من الآن)
CREATE OR REPLACE FUNCTION generate_card_expiry()
RETURNS TEXT AS $$
DECLARE
    future_date DATE;
BEGIN
    future_date := CURRENT_DATE + INTERVAL '5 years';
    RETURN LPAD(EXTRACT(MONTH FROM future_date)::TEXT, 2, '0') || '/' || 
           EXTRACT(YEAR FROM future_date)::TEXT;
END;
$$ LANGUAGE plpgsql;

-- دالة للحصول على عدد العملات المتبقية
CREATE OR REPLACE FUNCTION get_remaining_coins()
RETURNS DECIMAL AS $$
DECLARE
    total_supply CONSTANT DECIMAL := 1000000;
    distributed DECIMAL;
BEGIN
    SELECT COALESCE(SUM(balance), 0) INTO distributed FROM users;
    RETURN total_supply - distributed;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- تم إنشاء قاعدة البيانات بنجاح!
-- ==========================================