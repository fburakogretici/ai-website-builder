/**
 * Template System Test Script
 * Bu script şablon sistemini test eder ve örnek HTML üretir
 */

import { getAllTemplates, getTemplateById } from '../src/lib/templates/template-definitions';
import { generateWebsite, createCompleteHtmlDocument, mapUserDataToPlaceholders } from '../src/lib/templates/template-processor';
import * as fs from 'fs';
import * as path from 'path';

// Test için örnek kullanıcı verileri
const testUserData = {
  business: {
    siteName: 'TechVision Danışmanlık',
    siteType: 'business',
    description: 'Dijital dönüşüm ve teknoloji danışmanlığı alanında lider firma',
    features: ['Strateji Geliştirme', 'Süreç Optimizasyonu', 'Teknoloji Entegrasyonu'],
    targetAudience: 'Orta ve büyük ölçekli kurumsal firmalar',
    additionalInfo: 'TechVision olarak, 10 yılı aşkın tecrübemizle işletmelerin dijital dönüşüm yolculuğunda güvenilir ortağıyız. Müşterilerimize özel stratejiler geliştiriyor, süreçlerini optimize ediyor ve en son teknolojileri entegre ediyoruz.',
  },
  portfolio: {
    siteName: 'Ayşe Yılmaz',
    siteType: 'portfolio',
    description: 'UI/UX Designer & Creative Director',
    features: ['Mobil Uygulama Tasarımı', 'Web Tasarım', 'Marka Kimliği'],
    targetAudience: 'Startup ve teknoloji şirketleri',
    additionalInfo: 'Kullanıcı deneyimi odaklı, estetik ve fonksiyonel tasarımlar yaratıyorum. Her projede kullanıcının ihtiyaçlarını merkeze alarak, markaların dijital dünyada fark yaratmasına yardımcı oluyorum.',
  },
  landing: {
    siteName: 'CloudFlow',
    siteType: 'landing',
    description: 'Akıllı İş Akışı Otomasyonu Platformu',
    features: ['Kolay Entegrasyon', 'Güçlü Otomasyon', 'Güvenli Altyapı'],
    targetAudience: 'Küçük ve orta ölçekli işletmeler',
    additionalInfo: 'CloudFlow ile iş süreçlerinizi otomatikleştirin, ekip verimliliğinizi artırın ve zamandan tasarruf edin.',
  },
};

async function testTemplate(templateId: string, userData: any) {
  console.log(`\n🔧 Testing template: ${templateId}`);
  console.log('━'.repeat(50));

  try {
    // 1. Template config al
    const template = getTemplateById(templateId);
    if (!template) {
      console.error(`❌ Template not found: ${templateId}`);
      return;
    }
    console.log(`✅ Template loaded: ${template.name}`);

    // 2. Placeholder mapping test
    console.log('\n📝 Mapping user data to placeholders...');
    const placeholders = mapUserDataToPlaceholders(userData, template);
    console.log(`✅ Mapped ${Object.keys(placeholders).length} placeholders`);
    console.log('\nSample mappings:');
    console.log(`  - SITE_TITLE: ${placeholders.SITE_TITLE}`);
    console.log(`  - HERO_TITLE: ${placeholders.HERO_TITLE}`);
    console.log(`  - ABOUT_TEXT: ${placeholders.ABOUT_TEXT?.substring(0, 60)}...`);

    // 3. Website oluştur
    console.log('\n🏗️  Generating website...');
    const { html, css } = await generateWebsite(templateId, template, userData);
    console.log(`✅ HTML generated: ${html.length} characters`);
    console.log(`✅ CSS loaded: ${css.length} characters`);

    // 4. Complete HTML document oluştur
    console.log('\n📄 Creating complete HTML document...');
    const completeHtml = createCompleteHtmlDocument(html, css);
    console.log(`✅ Complete document: ${completeHtml.length} characters`);

    // 5. Dosyaya kaydet
    const outputDir = path.join(process.cwd(), 'test-output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, `${templateId}-test.html`);
    fs.writeFileSync(outputPath, completeHtml, 'utf-8');
    console.log(`\n💾 Saved to: ${outputPath}`);
    console.log(`🌐 Open in browser: file:///${outputPath.replace(/\\/g, '/')}`);

    return true;
  } catch (error) {
    console.error(`❌ Error testing template ${templateId}:`, error);
    return false;
  }
}

async function runTests() {
  console.log('\n🎨 TEMPLATE SYSTEM TEST');
  console.log('='.repeat(50));

  // Tüm şablonları listele
  const templates = getAllTemplates();
  console.log(`\n📋 Found ${templates.length} templates:`);
  templates.forEach((t) => {
    console.log(`  - ${t.id} (${t.category}): ${t.name}`);
  });

  // Her şablonu test et
  console.log('\n🧪 Running tests...\n');

  const results = await Promise.all([
    testTemplate('business-modern', testUserData.business),
    testTemplate('portfolio-creative', testUserData.portfolio),
    testTemplate('landing-startup', testUserData.landing),
  ]);

  // Sonuçları özetle
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(50));
  const successCount = results.filter((r) => r).length;
  console.log(`✅ Successful: ${successCount}/${results.length}`);
  console.log(`❌ Failed: ${results.length - successCount}/${results.length}`);

  if (successCount === results.length) {
    console.log('\n🎉 All tests passed! Check test-output folder for results.');
  } else {
    console.log('\n⚠️  Some tests failed. Check logs above for details.');
  }

  console.log('\n📂 Test output directory: test-output/');
  console.log('   - business-modern-test.html');
  console.log('   - portfolio-creative-test.html');
  console.log('   - landing-startup-test.html');
  console.log('\n✨ Open these files in your browser to see the results!\n');
}

// Script'i çalıştır
runTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
