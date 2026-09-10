-- NoCodePage AI - Kredi ve Abonelik Sistemi Tabloları
-- Bu SQL'i Supabase SQL Editor'de çalıştırın

-- 1. profiles tablosuna kredi ve abonelik sütunları ekle
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
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_daily_credit_reset TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_monthly_credit_reset TIMESTAMPTZ DEFAULT NOW();

-- 2. credit_transactions tablosu oluştur
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL, -- pozitif = kazanç, negatif = harcama
  type TEXT NOT NULL CHECK (type IN ('subscription', 'purchase', 'usage', 'bonus', 'refund', 'rollover', 'daily_reset', 'monthly_reset')),
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index ekle
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON credit_transactions(type);

-- 3. RLS (Row Level Security) aktifleştir
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar sadece kendi transaction'larını görebilir
CREATE POLICY "Users can view own credit transactions" ON credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Sadece servis rolü transaction ekleyebilir (API üzerinden)
CREATE POLICY "Service role can insert credit transactions" ON credit_transactions
  FOR INSERT WITH CHECK (true);

-- 4. Günlük kredi sıfırlama fonksiyonu
CREATE OR REPLACE FUNCTION reset_daily_credits()
RETURNS void AS $$
BEGIN
  -- Pro ve üzeri planlar için günlük kredileri sıfırla
  UPDATE profiles
  SET 
    daily_credits_remaining = CASE 
      WHEN subscription_tier = 'pro' THEN 5
      WHEN subscription_tier = 'business' THEN 10
      WHEN subscription_tier = 'enterprise' THEN 0 -- unlimited
      ELSE 0
    END,
    last_daily_credit_reset = NOW()
  WHERE last_daily_credit_reset < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Aylık kredi sıfırlama fonksiyonu
CREATE OR REPLACE FUNCTION reset_monthly_credits()
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET 
    credits_monthly = CASE 
      WHEN subscription_tier = 'free' THEN 50
      WHEN subscription_tier = 'pro' THEN 100
      WHEN subscription_tier = 'business' THEN 250
      WHEN subscription_tier = 'enterprise' THEN 0 -- unlimited
      ELSE 50
    END,
    credits_used_this_month = 0,
    last_monthly_credit_reset = NOW()
  WHERE 
    subscription_period_end IS NOT NULL 
    AND subscription_period_end < NOW()
    AND subscription_status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Yeni kullanıcı için otomatik free plan başlat
CREATE OR REPLACE FUNCTION handle_new_user_credits()
RETURNS TRIGGER AS $$
BEGIN
  -- Sadece subscription_tier boşsa varsayılan değerleri ayarla
  IF NEW.subscription_tier IS NULL THEN
    NEW.subscription_tier := 'free';
    NEW.subscription_status := 'active';
    NEW.credits_monthly := 50;
    NEW.credits_used_this_month := 0;
    NEW.daily_credits_remaining := 0;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger ekle (eğer yoksa)
DROP TRIGGER IF EXISTS on_profile_created_credits ON profiles;
CREATE TRIGGER on_profile_created_credits
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_credits();

-- 7. Mevcut kullanıcıları güncelle (henüz subscription_tier'ı olmayanlar)
UPDATE profiles 
SET 
  subscription_tier = 'free',
  subscription_status = 'active',
  credits_monthly = 50,
  credits_used_this_month = 0,
  daily_credits_remaining = 0
WHERE subscription_tier IS NULL;

-- 8. Test için birkaç örnek veri
-- Aktif kullanıcınız varsa bu sorguyla kredinizi görebilirsiniz:
-- SELECT id, email, subscription_tier, credits_monthly, credits_used_this_month, daily_credits_remaining FROM profiles;
