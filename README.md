# دليل استخدام تطبيق دينار كوين - نسخة Supabase V3.0

## نظرة عامة
تم تحديث تطبيق دينار كوين بالكامل للعمل مع قاعدة بيانات Supabase بدلاً من Firebase. النظام الآن يدعم نموذج تسجيل موسع مع معلومات شاملة للمستخدمين.

---

## الخطوات الأولى

### 1. إعداد قاعدة البيانات في Supabase

1. قم بتسجيل الدخول إلى حسابك في Supabase: https://supabase.com
2. افتح مشروعك أو أنشئ مشروعاً جديداً
3. انتقل إلى SQL Editor
4. انسخ محتوى ملف `supabase_schema.sql` والصقه في المحرر
5. اضغط على "Run" لتنفيذ الأوامر

سيتم إنشاء الجداول التالية:
- **users**: جدول المستخدمين مع جميع المعلومات الشخصية
- **transactions**: جدول المعاملات (إرسال/استقبال/شراء)
- **buy_requests**: طلبات الشراء
- **referrals**: نظام الإحالات
- **platform_stats**: إحصائيات المنصة العامة

### 2. تحديث مفاتيح Supabase

افتح ملف `app.js` وقم بتحديث الأسطر التالية:

```javascript
const SUPABASE_URL = 'https://yusbdsss8rgrgpwv5gl71da.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

استبدل القيم بمفاتيحك الفعلية من Supabase:
- URL: من Project Settings > API > Project URL
- Anon Key: من Project Settings > API > Project API keys > anon/public

---

## الميزات الجديدة

### نموذج التسجيل الموسع
يتضمن النموذج الجديد الحقول التالية:

#### المعلومات الشخصية:
- الاسم الأول
- اسم العائلة

#### معلومات الاتصال:
- البريد الإلكتروني
- الدولة (قائمة منسدلة بـ 18 دولة عربية + 10 دول إنجليزية)
- مفتاح الدولة (يتم تحديثه تلقائياً)
- رقم الهاتف

#### العنوان:
- المدينة
- اسم الشارع/الحي (اختياري)

#### الأمان:
- كلمة المرور (8 أحرف على الأقل، أحرف كبيرة وصغيرة وأرقام)
- تأكيد كلمة المرور

### البيانات التي يتم رفعها تلقائياً:
- معلومات المستخدم الكاملة
- رصيد المستخدم
- معلومات البطاقة (رقم البطاقة، CVV، تاريخ الانتهاء)
- رمز الإحالة الفريد
- المعاملات
- الإحالات
- طلبات الشراء

### الإحصائيات المباشرة:
- عدد المستخدمين المسجلين
- عدد العملات الموزعة
- عدد العملات المتبقية (1,000,000 - الموزعة)
- إجمالي المعاملات

---

## هيكل قاعدة البيانات

### جدول users
```sql
- id (UUID)
- auth_id (UUID) - معرف المصادقة
- first_name (VARCHAR)
- last_name (VARCHAR)
- full_name (GENERATED) - الاسم الكامل
- email (VARCHAR UNIQUE)
- phone (VARCHAR)
- phone_country_code (VARCHAR)
- country (VARCHAR)
- country_code (VARCHAR)
- city (VARCHAR)
- street (VARCHAR)
- referral_code (VARCHAR UNIQUE)
- balance (DECIMAL)
- card_number (VARCHAR)
- card_cvv (VARCHAR)
- card_expiry (VARCHAR)
- total_sent (DECIMAL)
- total_received (DECIMAL)
- total_referrals (INTEGER)
- referral_earnings (DECIMAL)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- last_login (TIMESTAMP)
- is_active (BOOLEAN)
- is_verified (BOOLEAN)
```

### جدول transactions
```sql
- id (UUID)
- sender_id (UUID)
- receiver_id (UUID)
- amount (DECIMAL)
- transaction_type (VARCHAR) - 'send', 'receive', 'buy', 'bonus', 'referral'
- status (VARCHAR) - 'pending', 'completed', 'failed', 'cancelled'
- note (TEXT)
- reference_number (VARCHAR UNIQUE)
- created_at (TIMESTAMP)
- completed_at (TIMESTAMP)
```

### جدول buy_requests
```sql
- id (UUID)
- user_id (UUID)
- amount (DECIMAL)
- total_iqd (DECIMAL)
- status (VARCHAR) - 'pending', 'approved', 'rejected', 'completed'
- user_note (TEXT)
- admin_note (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- completed_at (TIMESTAMP)
```

### جدول referrals
```sql
- id (UUID)
- referrer_id (UUID) - المُحيل
- referred_id (UUID) - المُحال
- bonus_amount (DECIMAL) - 0.25 DC
- bonus_paid (BOOLEAN)
- created_at (TIMESTAMP)
- bonus_paid_at (TIMESTAMP)
```

---

## الأمان (Row Level Security)

تم تفعيل RLS على جميع الجداول:
- المستخدمون يمكنهم فقط رؤية بياناتهم الخاصة
- المعاملات محمية حسب طرفي المعاملة
- طلبات الشراء محمية حسب صاحب الطلب
- الإحصائيات العامة متاحة للجميع

---

## الدوال المساعدة

تم إنشاء دوال SQL لتوليد بيانات فريدة:
- `generate_referral_code()` - توليد رمز إحالة فريد
- `generate_card_number()` - توليد رقم بطاقة فريد
- `generate_cvv()` - توليد رمز CVV عشوائي
- `generate_card_expiry()` - توليد تاريخ انتهاء (5 سنوات)
- `get_remaining_coins()` - حساب العملات المتبقية

---

## قائمة الدول المدعومة

### الدول العربية (18 دولة):
- العراق (+964)
- السعودية (+966)
- الإمارات (+971)
- الكويت (+965)
- قطر (+974)
- البحرين (+973)
- عُمان (+968)
- الأردن (+962)
- فلسطين (+970)
- لبنان (+961)
- سوريا (+963)
- مصر (+20)
- المغرب (+212)
- الجزائر (+213)
- تونس (+216)
- ليبيا (+218)
- السودان (+249)
- اليمن (+967)

### الدول الإنجليزية (10 دول):
- United States (+1)
- United Kingdom (+44)
- Canada (+1)
- Australia (+61)
- Germany (+49)
- France (+33)
- Italy (+39)
- Spain (+34)
- Turkey (+90)
- India (+91)

---

## الاستخدام

### 1. رفع الملفات
قم برفع جميع الملفات إلى الخادم:
- index.html
- app.js
- style.css
- logo.png
- manifest.json
- sw.js

### 2. تسجيل مستخدم جديد
عند إنشاء حساب جديد:
1. يتم التحقق من صحة جميع البيانات
2. يتم إنشاء حساب مصادقة في Supabase Auth
3. يتم توليد رمز إحالة فريد
4. يتم توليد معلومات بطاقة رقمية فريدة
5. يحصل المستخدم على 1.0 DC كمكافأة ترحيبية
6. يتم تسجيل معاملة المكافأة في جدول transactions

### 3. عرض الإحصائيات
- يتم تحديث الإحصائيات تلقائياً كل 30 ثانية
- عدد المستخدمين يتم حسابه من جدول users
- العملات المتبقية = 1,000,000 - مجموع الأرصدة

---

## التحسينات التقنية

### 1. الأداء
- استخدام Indexes لتسريع الاستعلامات
- Connection pooling في Supabase
- Real-time subscriptions (اختياري)

### 2. الأمان
- Row Level Security (RLS)
- تشفير كلمات المرور
- التحقق من صحة البيانات
- CORS protection

### 3. التجربة
- نموذج تسجيل سلس وسهل
- تحديث تلقائي للواجهة
- رسائل توضيحية للمستخدم
- دعم RTL كامل

---

## الصيانة والتطوير

### إضافة دولة جديدة
في ملف `app.js`، أضف الدولة إلى مصفوفة `countries`:

```javascript
countries.ar.push({ name: 'الدولة الجديدة', code: 'XX', phone: '+XXX' });
```

### تغيير المكافآت
في ملف `app.js`:
```javascript
const WELCOME_BONUS = 1.0;  // مكافأة الترحيب
const REFERRAL_BONUS = 0.25; // مكافأة الإحالة
```

### تعديل السعر
```javascript
const PRICE_PER_COIN = 1000; // 1 DC = 1000 IQD
```

---

## استعلامات مفيدة

### عرض جميع المستخدمين
```sql
SELECT 
    full_name, 
    email, 
    country, 
    balance, 
    total_referrals,
    created_at
FROM users
ORDER BY created_at DESC;
```

### عرض المعاملات الأخيرة
```sql
SELECT 
    t.*,
    s.full_name as sender_name,
    r.full_name as receiver_name
FROM transactions t
LEFT JOIN users s ON t.sender_id = s.id
LEFT JOIN users r ON t.receiver_id = r.id
ORDER BY t.created_at DESC
LIMIT 50;
```

### عرض الإحصائيات
```sql
SELECT 
    total_users,
    total_coins_distributed,
    total_transactions,
    1000000 - total_coins_distributed as remaining_coins
FROM platform_stats;
```

---

## الدعم الفني

إذا واجهت أي مشاكل:
1. تحقق من أن مفاتيح Supabase صحيحة
2. تحقق من تفعيل RLS Policies
3. راجع console.log في المتصفح
4. تحقق من جداول قاعدة البيانات

---

## الملاحظات المهمة

⚠️ **تنبيهات:**
- قم بتحديث مفاتيح Supabase قبل استخدام التطبيق
- تأكد من تفعيل Email Auth في Supabase
- احتفظ بنسخة احتياطية من قاعدة البيانات
- قم بمراجعة RLS Policies قبل النشر للإنتاج

✅ **مزايا النظام الجديد:**
- تسجيل شامل مع جميع المعلومات المطلوبة
- دعم 28 دولة مع مفاتيح هواتفها
- نظام أمان متطور
- إحصائيات حية ودقيقة
- تجربة مستخدم محسّنة

---

## التواصل

للدعم والاستفسارات:
- البريد الإلكتروني: alsebekrara@gmail.com
- الهاتف: 07813798636

---

تم التطوير بواسطة: Digital Creativity Company - الإبداع الرقمي
النسخة: 3.0 (Supabase Edition)
التاريخ: February 2026
