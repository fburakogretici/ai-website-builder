# Template System Documentation

## 📁 Klasör Yapısı

```
ai-website-builder/
├── public/
│   └── templates/
│       ├── business-modern/       # İşletme şablonu
│       │   ├── index.html         # HTML yapısı (placeholder'lar ile)
│       │   ├── styles.css         # CSS stilleri
│       │   ├── config.json        # Şablon metadata
│       │   └── preview.png        # (Eklenecek) Önizleme görseli
│       ├── portfolio-creative/    # Portfolyo şablonu
│       └── landing-startup/       # Landing page şablonu
├── src/
│   └── lib/
│       └── templates/
│           ├── template-definitions.ts   # Şablon metadata ve helper fonksiyonlar
│           └── template-processor.ts     # Şablon işleme ve doldurma sistemi
```

## 🎯 Sistem Nasıl Çalışıyor?

### 1. Şablon Yapısı

Her şablon 3 dosyadan oluşur:

#### **index.html** 
- Placeholder'lar `{{PLACEHOLDER_NAME}}` formatında
- Örnek: `{{SITE_TITLE}}`, `{{HERO_TEXT}}`, `{{CONTACT_EMAIL}}`

#### **styles.css**
- Responsive tasarım
- Modern animasyonlar
- Gradient ve efektler

#### **config.json**
- Şablon metadata (id, name, category, description)
- Placeholder tanımları ve default değerler
- Preview image path

### 2. İş Akışı (Workflow)

```
1. Kullanıcı Bilgileri
   ├── Site adı
   ├── Site tipi (business/portfolio/landing)
   ├── Açıklama
   ├── Özellikler/Hizmetler
   └── Hedef kitle

2. Şablon Seçimi
   ├── Kategori filtreleme
   ├── Preview gösterimi
   └── Şablon seçimi

3. İçerik Üretimi
   ├── Kullanıcı bilgilerini al
   ├── AI ile içeriği zenginleştir (opsiyonel)
   └── Placeholder'lara map et

4. Website Oluştur
   ├── Template HTML'i fetch et
   ├── Placeholder'ları değiştir
   ├── CSS'i embed et
   └── Complete HTML döndür

5. Preview
   ├── iframe içinde göster
   ├── Düzenleme seçeneği
   └── İndirme/Yayınlama
```

### 3. Kod Kullanımı

#### **Şablon Listesini Al**
```typescript
import { getAllTemplates, getTemplateById } from '@/lib/templates/template-definitions';

// Tüm şablonlar
const templates = getAllTemplates();

// Belirli bir şablon
const template = getTemplateById('business-modern');
```

#### **Website Oluştur**
```typescript
import { generateWebsite, createCompleteHtmlDocument } from '@/lib/templates/template-processor';
import { getTemplateById } from '@/lib/templates/template-definitions';

// Kullanıcı verileri
const userData = {
  siteName: 'ABC Şirketi',
  siteType: 'business',
  description: 'Profesyonel danışmanlık hizmetleri',
  features: ['Strateji', 'Analiz', 'Uygulama'],
  targetAudience: 'Kurumsal firmalar',
};

// Template config al
const template = getTemplateById('business-modern');

// Website oluştur
const { html, css } = await generateWebsite('business-modern', template, userData);

// Complete HTML document oluştur (iframe için)
const completeHtml = createCompleteHtmlDocument(html, css);
```

### 4. Placeholder Mapping Mantığı

**Mevcut Mapping (Basit):**
```typescript
// Kullanıcı verisi → Placeholder
siteName          → SITE_TITLE, HERO_TITLE
description       → SITE_DESCRIPTION, HERO_SUBTITLE
features[0]       → SERVICE_1_TITLE, FEATURE_1_TITLE
features[1]       → SERVICE_2_TITLE, FEATURE_2_TITLE
features[2]       → SERVICE_3_TITLE, FEATURE_3_TITLE
additionalInfo    → ABOUT_TEXT
```

**AI ile Geliştirilmiş Mapping (Planlanan):**
- OpenAI/Anthropic API kullanarak zengin içerik üretimi
- Kullanıcı bilgilerine göre profesyonel metin üretimi
- SEO-friendly başlıklar ve açıklamalar
- Brand tone'una uygun içerik

## 🚀 Sonraki Adımlar

### Faz 1: Temel Entegrasyon ✅
- [x] Şablon dosyaları oluşturuldu
- [x] Template definitions hazır
- [x] Template processor sistemi hazır
- [ ] Create page'e entegre et
- [ ] Preview sistemi ekle

### Faz 2: UI Geliştirme
- [ ] Şablon seçici component
- [ ] Preview modal/page
- [ ] Düzenleme özellikleri
- [ ] İndirme butonu

### Faz 3: AI Entegrasyonu
- [ ] OpenAI API bağlantısı
- [ ] İçerik üretimi fonksiyonları
- [ ] Akıllı placeholder doldurma
- [ ] SEO optimizasyonu

### Faz 4: Deploy & Storage
- [ ] Supabase Storage entegrasyonu
- [ ] Vercel/Netlify deploy
- [ ] Custom domain desteği
- [ ] Site yönetimi

## 📝 Örnek Kullanım Senaryosu

```typescript
// 1. Create page'de kullanıcı formu doldurur
const formData = {
  siteName: "Tech Innovations",
  siteType: "business",
  description: "Cutting-edge technology solutions",
  features: ["AI Solutions", "Cloud Services", "Consulting"],
};

// 2. Şablon seçer
const selectedTemplate = "business-modern";

// 3. Website oluştur butonuna tıklar
const template = getTemplateById(selectedTemplate);
const { html, css } = await generateWebsite(selectedTemplate, template, formData);
const finalHtml = createCompleteHtmlDocument(html, css);

// 4. Preview göster
<iframe srcDoc={finalHtml} />

// 5. İndir veya yayınla
// - HTML dosyasını download et
// - Veya Supabase'e kaydet ve URL oluştur
```

## 🎨 Şablon Ekleme Rehberi

Yeni şablon eklemek için:

1. **Klasör oluştur**: `public/templates/yeni-sablon/`
2. **Dosyaları ekle**:
   - `index.html` (placeholder'lar ile)
   - `styles.css`
   - `config.json`
   - `preview.png`
3. **Template definitions'a ekle**: `src/lib/templates/template-definitions.ts`
4. **Test et**: Şablon yükleme ve doldurma testleri

## 🔧 Placeholder Kuralları

- Format: `{{PLACEHOLDER_NAME}}`
- Büyük harf, underscore ile ayır
- Anlamlı isimler kullan
- Config.json'da tanımla
- Default değer ver

## ⚡ Performans Notları

- Template HTML/CSS fetch'i client-side (fast)
- Placeholder replacement hafif işlem
- Preview iframe ile izole
- CSS embed edilmiş (external request yok)

---

**Hazırlayan**: AI Assistant  
**Tarih**: 2024  
**Versiyon**: 1.0
