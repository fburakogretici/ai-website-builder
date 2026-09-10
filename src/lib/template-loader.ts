import fs from 'fs/promises';
import path from 'path';
import type { TemplateConfig, LoadedTemplate } from '@/types/template';

/**
 * Şablon dizini yolu
 */
const TEMPLATES_DIR = path.join(process.cwd(), 'public', 'templates');

/**
 * Belirtilen şablonun HTML içeriğini yükler
 */
export async function loadTemplateHtml(
  templateId: string,
  locale: string = 'en'
): Promise<string> {
  try {
    const htmlPath = path.join(
      TEMPLATES_DIR,
      templateId,
      locale,
      'index.html'
    );
    
    const html = await fs.readFile(htmlPath, 'utf-8');
    return html;
  } catch (error) {
    // Fallback to English if locale not found
    if (locale !== 'en') {
      console.warn(`Template ${templateId} not found for ${locale}, falling back to 'en'`);
      return loadTemplateHtml(templateId, 'en');
    }
    throw new Error(`Failed to load template HTML: ${templateId}`);
  }
}

/**
 * Belirtilen şablonun CSS içeriğini yükler
 */
export async function loadTemplateCss(
  templateId: string,
  locale: string = 'en'
): Promise<string> {
  try {
    const cssPath = path.join(
      TEMPLATES_DIR,
      templateId,
      locale,
      'styles.css'
    );
    
    const css = await fs.readFile(cssPath, 'utf-8');
    return css;
  } catch (error) {
    // Fallback to English if locale not found
    if (locale !== 'en') {
      return loadTemplateCss(templateId, 'en');
    }
    throw new Error(`Failed to load template CSS: ${templateId}`);
  }
}

/**
 * Belirtilen şablonun config.json dosyasını yükler
 */
export async function loadTemplateConfig(
  templateId: string,
  locale: string = 'en'
): Promise<TemplateConfig> {
  try {
    const configPath = path.join(
      TEMPLATES_DIR,
      templateId,
      locale,
      'config.json'
    );
    
    const configData = await fs.readFile(configPath, 'utf-8');
    const config: TemplateConfig = JSON.parse(configData);
    return config;
  } catch (error) {
    // Fallback to English if locale not found
    if (locale !== 'en') {
      return loadTemplateConfig(templateId, 'en');
    }
    throw new Error(`Failed to load template config: ${templateId}`);
  }
}

/**
 * Şablonu tamamen yükler (HTML + CSS + Config)
 */
export async function loadTemplate(
  templateId: string,
  locale: string = 'en'
): Promise<LoadedTemplate> {
  try {
    const [html, css, config] = await Promise.all([
      loadTemplateHtml(templateId, locale),
      loadTemplateCss(templateId, locale),
      loadTemplateConfig(templateId, locale),
    ]);

    return {
      html,
      css,
      config,
    };
  } catch (error) {
    console.error(`Error loading template ${templateId}:`, error);
    throw error;
  }
}

/**
 * Tüm mevcut şablonları listeler
 */
export async function listTemplates(): Promise<string[]> {
  try {
    const entries = await fs.readdir(TEMPLATES_DIR, { withFileTypes: true });
    
    const templateDirs = entries
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name);
    
    return templateDirs;
  } catch (error) {
    console.error('Error listing templates:', error);
    return [];
  }
}

/**
 * Tüm şablonların config bilgilerini yükler
 */
export async function loadAllTemplateConfigs(
  locale: string = 'en'
): Promise<Map<string, TemplateConfig>> {
  const templateIds = await listTemplates();
  const configs = new Map<string, TemplateConfig>();

  await Promise.all(
    templateIds.map(async (templateId) => {
      try {
        const config = await loadTemplateConfig(templateId, locale);
        configs.set(templateId, config);
      } catch (error) {
        console.warn(`Failed to load config for template: ${templateId}`);
      }
    })
  );

  return configs;
}

/**
 * Şablon kategorisine göre filtrele
 */
export async function getTemplatesByCategory(
  category: string,
  locale: string = 'en'
): Promise<TemplateConfig[]> {
  const allConfigs = await loadAllTemplateConfigs(locale);
  
  return Array.from(allConfigs.values()).filter(
    (config) => config.category === category
  );
}

/**
 * Şablon var mı kontrol et
 */
export async function templateExists(
  templateId: string,
  locale: string = 'en'
): Promise<boolean> {
  try {
    const htmlPath = path.join(
      TEMPLATES_DIR,
      templateId,
      locale,
      'index.html'
    );
    
    await fs.access(htmlPath);
    return true;
  } catch {
    // Try English fallback
    if (locale !== 'en') {
      return templateExists(templateId, 'en');
    }
    return false;
  }
}

/**
 * Şablon preview URL'ini oluştur
 */
export function getTemplatePreviewUrl(
  templateId: string,
  locale: string = 'en'
): string {
  return `/templates/${templateId}/${locale}/preview.html`;
}

/**
 * Şablon thumbnail URL'ini oluştur
 */
export function getTemplateThumbnailUrl(
  templateId: string,
  locale: string = 'en'
): string {
  return `/templates/${templateId}/${locale}/preview.png`;
}
