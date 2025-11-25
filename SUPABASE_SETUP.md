# Supabase CORS Hatası Çözümü

## Problem
Projenizde şu CORS hatası alıyorsunuz:
```
Access to fetch at 'https://fhwcguzotqwohfczxyqd.supabase.co/auth/v1/user' from origin 'http://localhost:3000' has been blocked by CORS policy
```

## Çözüm Adımları

### 1. Supabase Dashboard'a Gidin
1. https://supabase.com adresine gidin
2. Projenizi seçin (fhwcguzotqwohfczxyqd)

### 2. URL Konfigürasyonunu Düzeltin
1. Sol menüden **Authentication** > **URL Configuration** seçin
2. Aşağıdaki URL'leri ekleyin:

**Site URL:**
```
http://localhost:3000
```

**Redirect URLs:**
```
http://localhost:3000/auth/callback
http://localhost:3000/**
```

### 3. CORS Ayarlarını Kontrol Edin
1. Sol menüden **Settings** > **API** seçin
2. **CORS Configuration** bölümünde şunları ekleyin:
   - `http://localhost:3000`
   - `http://localhost:3001` (ihtiyaç halinde)

### 4. Authentication Settings
1. **Authentication** > **Settings** gidin
2. **Enable Email Confirmations** - İhtiyaca göre açık/kapalı
3. **Enable Phone Confirmations** - İhtiyaca göre açık/kapalı

### 5. Değişiklikleri Kaydedin
Tüm değişiklikleri kaydettikten sonra:
1. Projeyi yeniden başlatın: `npm run dev`
2. Tarayıcı cache'ini temizleyin (Ctrl+Shift+Delete)
3. Sayfayı yenileyin (Ctrl+F5)

## Alternatif Çözüm - Production URL Kullanımı

Eğer uygulamanızı deploy ettiyseniz (örn: Vercel):
1. Production URL'inizi Supabase'e ekleyin
2. `.env.local` dosyasını kontrol edin
3. Environment variables'ların doğru yüklendiğinden emin olun

## Test
Değişikliklerden sonra:
```bash
npm run dev
```

Ardından http://localhost:3000 adresine gidin ve console'da CORS hatası olmamalı.

## Notlar
- Supabase'de yapılan değişiklikler birkaç saniye içinde aktif olur
- Tarayıcı cache'i bazen eski CORS ayarlarını tutar, cache temizleme önemlidir
- Production'da mutlaka HTTPS kullanın

---

# Kredi Sistemi Kurulumu

## SQL Migration

Supabase SQL Editor'de aşağıdaki SQL'i çalıştırın:

```sql
-- NoCodePage AI - Kredi ve Abonelik Sistemi
-- profiles tablosuna kredi sütunları ekle

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS credits_monthly INTEGER DEFAULT 50;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS credits_bonus INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS credits_purchased INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS credits_used_this_month INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS daily_credits_remaining INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_period_start TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_period_end TIMESTAMPTZ;

-- credit_transactions tablosu
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- pending_payments tablosu (iyzico için)
CREATE TABLE IF NOT EXISTS pending_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  conversation_id TEXT,
  basket_id TEXT UNIQUE,
  plan_id TEXT,
  billing_period TEXT,
  amount DECIMAL(10, 2),
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending',
  iyzico_payment_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- payments tablosu (ödeme geçmişi)
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  iyzico_payment_id TEXT,
  stripe_payment_id TEXT,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending',
  type TEXT NOT NULL, -- 'subscription', 'credits'
  plan_id TEXT,
  billing_period TEXT,
  credits_amount INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexler
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_pending_payments_user_id ON pending_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_pending_payments_basket_id ON pending_payments(basket_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);

-- RLS
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own credit transactions" ON credit_transactions;
CREATE POLICY "Users can view own credit transactions" ON credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own pending payments" ON pending_payments;
CREATE POLICY "Users can view own pending payments" ON pending_payments
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own payments" ON payments;
CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (auth.uid() = user_id);

-- Mevcut kullanıcıları güncelle
UPDATE profiles 
SET 
  subscription_tier = COALESCE(subscription_tier, 'free'),
  subscription_status = COALESCE(subscription_status, 'active'),
  credits_monthly = COALESCE(credits_monthly, 50),
  credits_used_this_month = COALESCE(credits_used_this_month, 0),
  daily_credits_remaining = COALESCE(daily_credits_remaining, 0)
WHERE subscription_tier IS NULL;
```

## Kontrol Sorgusu

```sql
SELECT 
  id, 
  email, 
  subscription_tier, 
  credits_monthly, 
  credits_used_this_month 
FROM profiles 
LIMIT 5;
```
