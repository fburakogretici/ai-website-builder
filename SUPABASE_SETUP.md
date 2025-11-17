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
