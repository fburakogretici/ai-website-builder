# NoCodePage AI - Ödeme ve Kredi Sistemi Tasarımı

## 🎯 Genel Bakış

Lovable.dev'den esinlenerek tasarlanmış kredi tabanlı ödeme sistemi.

---

## 💳 Abonelik Planları

### 1. Free (Ücretsiz)
- **Fiyat:** ₺0/ay
- **Krediler:** 50 kredi/ay (yenilenmez, rollover yok)
- **Özellikler:**
  - 1 web sitesi
  - Temel şablonlar
  - lovable.app subdomain
  - E-posta desteği
  - Lovable badge zorunlu

### 2. Pro
- **Fiyat:** ₺249/ay veya ₺2.490/yıl (%17 indirim)
- **Krediler:** 100 kredi/ay + 5 günlük kredi (max 150/ay)
- **Özellikler:**
  - 5 web sitesi
  - Tüm şablonlar
  - Kredi rollover (max 200)
  - Özel domain bağlama
  - Badge kaldırma
  - Öncelikli destek

### 3. Business
- **Fiyat:** ₺499/ay veya ₺4.990/yıl
- **Krediler:** 250 kredi/ay + 10 günlük kredi
- **Özellikler:**
  - 20 web sitesi
  - Team üyeleri (5 kişi)
  - Kullanıcı rolleri & izinler
  - SSO entegrasyonu
  - API erişimi
  - Gelişmiş analitikler

### 4. Enterprise
- **Fiyat:** Özel fiyatlandırma
- **Krediler:** Sınırsız
- **Özellikler:**
  - Sınırsız web sitesi
  - Sınırsız team üyesi
  - Dedicated support
  - Custom entegrasyonlar
  - SLA garantisi
  - Beyaz etiket seçeneği

---

## 🪙 Kredi Sistemi

### Kredi Nedir?
Her AI işlemi belirli miktarda kredi tüketir:

| İşlem | Kredi Maliyeti |
|-------|----------------|
| Yeni site oluşturma | 10 kredi |
| Site düzenleme (küçük) | 2 kredi |
| Site düzenleme (büyük) | 5 kredi |
| Tam site yeniden tasarım | 15 kredi |
| Şablon özelleştirme | 3 kredi |
| SEO optimizasyonu | 5 kredi |
| İçerik oluşturma | 3 kredi |

### Ek Kredi Paketleri
Abonelik kredileri bittiğinde satın alınabilir:

| Paket | Kredi | Fiyat | Birim Fiyat |
|-------|-------|-------|-------------|
| Starter | 50 | ₺49 | ₺0.98/kredi |
| Popular | 150 | ₺129 | ₺0.86/kredi |
| Pro | 500 | ₺399 | ₺0.80/kredi |
| Mega | 1000 | ₺699 | ₺0.70/kredi |

---

## 🗄️ Veritabanı Şeması (Supabase)

### users tablosu (mevcut güncelleme)
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active';
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS credits_monthly INTEGER DEFAULT 50;
ALTER TABLE users ADD COLUMN IF NOT EXISTS credits_bonus INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS credits_purchased INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS credits_used_this_month INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_period_end TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS daily_credits_remaining INTEGER DEFAULT 0;
```

### credit_transactions tablosu (yeni)
```sql
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- pozitif: ekleme, negatif: harcama
  type TEXT NOT NULL, -- 'subscription', 'purchase', 'usage', 'bonus', 'refund'
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_credit_transactions_user ON credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_created ON credit_transactions(created_at);
```

### subscriptions tablosu (yeni)
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  plan TEXT NOT NULL, -- 'free', 'pro', 'business', 'enterprise'
  status TEXT NOT NULL, -- 'active', 'canceled', 'past_due', 'trialing'
  billing_period TEXT, -- 'monthly', 'yearly'
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);
```

### credit_purchases tablosu (yeni)
```sql
CREATE TABLE credit_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT UNIQUE,
  package TEXT NOT NULL, -- 'starter', 'popular', 'pro', 'mega'
  credits INTEGER NOT NULL,
  amount_paid INTEGER NOT NULL, -- kuruş cinsinden
  currency TEXT DEFAULT 'TRY',
  status TEXT NOT NULL, -- 'pending', 'completed', 'failed', 'refunded'
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🔌 API Endpoints

### Subscription APIs
```
POST /api/subscription/create-checkout   - Stripe checkout session oluştur
POST /api/subscription/portal            - Müşteri portalı linki
POST /api/subscription/cancel            - Abonelik iptal
GET  /api/subscription/status            - Mevcut abonelik durumu
```

### Credit APIs
```
GET  /api/credits/balance                - Kredi bakiyesi
POST /api/credits/use                    - Kredi harcama
POST /api/credits/purchase               - Kredi satın alma
GET  /api/credits/history                - İşlem geçmişi
```

### Webhook
```
POST /api/webhooks/stripe                - Stripe webhook handler
```

---

## 🔄 Stripe Entegrasyonu

### Gerekli Ürünler (Stripe Dashboard'da oluşturulacak)

1. **Abonelik Ürünleri:**
   - pro_monthly (₺249/ay)
   - pro_yearly (₺2490/yıl)
   - business_monthly (₺499/ay)
   - business_yearly (₺4990/yıl)

2. **Tek Seferlik Ürünler (Kredi Paketleri):**
   - credits_50 (₺49)
   - credits_150 (₺129)
   - credits_500 (₺399)
   - credits_1000 (₺699)

### Webhook Events
- `checkout.session.completed` - Ödeme tamamlandı
- `customer.subscription.created` - Yeni abonelik
- `customer.subscription.updated` - Abonelik güncellendi
- `customer.subscription.deleted` - Abonelik iptal edildi
- `invoice.paid` - Fatura ödendi (aylık yenileme)
- `invoice.payment_failed` - Ödeme başarısız

---

## 🎨 UI Bileşenleri

### 1. Pricing Page (`/pricing`)
- Plan karşılaştırma kartları
- Toggle: Aylık/Yıllık
- CTA butonları
- FAQ accordion

### 2. Billing Settings (`/settings/billing`)
- Mevcut plan bilgisi
- Kredi bakiyesi ve kullanım grafiği
- Fatura geçmişi
- Ödeme yöntemi
- Plan değiştirme/iptal

### 3. Credit Purchase Modal
- Paket seçimi
- Ödeme özeti
- Stripe Elements

### 4. Usage Dashboard Widget
- Kalan kredi
- Bu ay kullanılan
- Progress bar
- "Kredi Al" butonu

---

## 🚀 Uygulama Adımları

### Faz 1: Temel Altyapı
1. [ ] Supabase tablolarını oluştur
2. [ ] Stripe hesabı kur, ürünleri tanımla
3. [ ] Environment variables ekle
4. [ ] Stripe SDK entegrasyonu

### Faz 2: Abonelik Sistemi
1. [ ] Checkout session API
2. [ ] Webhook handler
3. [ ] Subscription status API
4. [ ] Customer portal entegrasyonu

### Faz 3: Kredi Sistemi
1. [ ] Kredi bakiye API
2. [ ] Kredi harcama logic
3. [ ] Kredi satın alma
4. [ ] AI endpoint'lerinde kredi kontrolü

### Faz 4: UI
1. [ ] Pricing sayfası
2. [ ] Billing settings güncellemesi
3. [ ] Dashboard kredi widget
4. [ ] Kredi bitti uyarıları

---

## 🔒 Güvenlik Notları

1. **Webhook İmza Doğrulama** - Tüm Stripe webhook'ları imza doğrulaması yapılmalı
2. **Rate Limiting** - Kredi API'lerine rate limit ekle
3. **Row Level Security** - Supabase RLS kuralları
4. **PCI Compliance** - Kart bilgileri asla backend'de saklanmaz (Stripe Elements kullan)

---

## 📊 Metrikler (Takip Edilecek)

- MRR (Monthly Recurring Revenue)
- Churn Rate
- Average Credit Usage
- Conversion Rate (Free → Paid)
- Credit Purchase Rate
