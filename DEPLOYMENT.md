# 🚀 NoCodePage.ai Deployment Rehberi

## 1. Ana Uygulama Deployment (Vercel)

### Adım 1: GitHub'a Push Et

```bash
git add .
git commit -m "Ready for production deployment"
git push origin master
```

### Adım 2: Vercel'e Bağlan

1. https://vercel.com adresine git
2. GitHub ile giriş yap
3. "New Project" tıkla
4. `ai-website-builder` reposunu seç
5. "Import" tıkla

### Adım 3: Environment Variables Ekle

Vercel Project Settings → Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://fhwcguzotqwohfczxyqd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=AIza...
NEXT_PUBLIC_APP_URL=https://nocodepage.ai  (veya vercel URL)
IYZICO_API_KEY=sandbox-xxx (sonra eklenecek)
IYZICO_SECRET_KEY=sandbox-xxx (sonra eklenecek)
```

### Adım 4: Domain Bağlama

1. Vercel Dashboard → Project → Settings → Domains
2. `nocodepage.ai` veya istediğin domaini ekle
3. DNS ayarlarını domain sağlayıcında güncelle:
   - **A Record:** `76.76.21.21`
   - **CNAME:** `cname.vercel-dns.com`

### Adım 5: Supabase URL'lerini Güncelle

1. Supabase Dashboard → Authentication → URL Configuration
2. Site URL: `https://nocodepage.ai`
3. Redirect URLs: 
   - `https://nocodepage.ai/auth/callback`
   - `https://nocodepage.ai/**`

---

## 2. Kullanıcı Siteleri Deployment Stratejisi

### Seçenek A: Vercel Edge + Supabase Storage (Önerilen)
- Kullanıcı siteleri Supabase Storage'da HTML olarak saklanır
- Edge function ile serve edilir
- Subdomain: `sitename.nocodepage.app`

### Seçenek B: Cloudflare Pages
- Her site ayrı Cloudflare Pages projesi
- Otomatik SSL
- Global CDN

### Seçenek C: AWS S3 + CloudFront
- S3'te static hosting
- CloudFront CDN
- Route53 ile DNS

---

## 3. Önerilen Mimari

```
┌─────────────────────────────────────────────────────┐
│                   nocodepage.ai                      │
│              (Ana Uygulama - Vercel)                │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │   Editor    │  │  Dashboard  │  │   Pricing   │ │
│  └─────────────┘  └─────────────┘  └─────────────┘ │
│                                                      │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│              Kullanıcı Siteleri                     │
├─────────────────────────────────────────────────────┤
│                                                      │
│  *.nocodepage.app (Subdomain)                       │
│  ────────────────────────────                       │
│  │ mysite.nocodepage.app                            │
│  │ mybusiness.nocodepage.app                        │
│  │ portfolio.nocodepage.app                         │
│                                                      │
│  Custom Domains (Pro+)                              │
│  ────────────────────                               │
│  │ www.mybusiness.com                               │
│  │ www.myportfolio.io                               │
│                                                      │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│                 Storage Layer                        │
├─────────────────────────────────────────────────────┤
│  Supabase Storage                                   │
│  ├── /sites/{user_id}/{site_id}/                   │
│  │   ├── index.html                                │
│  │   ├── styles.css                                │
│  │   └── assets/                                   │
└─────────────────────────────────────────────────────┘
```

---

## 4. Domain Satın Alma

### Önerilen Domain Sağlayıcıları:
- **Namecheap** - Uygun fiyat, kolay yönetim
- **Cloudflare** - Ücretsiz SSL, DDoS koruması
- **Google Domains** - Basit arayüz
- **GoDaddy** - Popüler, destek iyi

### Alınacak Domainler:
1. `nocodepage.ai` - Ana domain ($15-50/yıl)
2. `nocodepage.app` - Kullanıcı siteleri için ($12/yıl)

---

## 5. Sonraki Adımlar

1. ✅ Vercel hesabı oluştur
2. ✅ GitHub repoyu Vercel'e bağla
3. ✅ Environment variables ekle
4. ✅ Test deploy yap
5. ⬜ Domain satın al (nocodepage.ai veya benzeri)
6. ⬜ Supabase'i production URL ile güncelle
7. ⬜ iyzico gerçek hesap aç
