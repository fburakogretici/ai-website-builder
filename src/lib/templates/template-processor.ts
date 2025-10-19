import { TemplateConfig } from './template-definitions';

/**
 * User input data structure
 */
export interface UserData {
  siteName: string;
  siteType: string;
  description: string;
  features?: string[];
  targetAudience?: string;
  colorScheme?: string;
  additionalInfo?: string;
}

/**
 * Fetch template HTML and CSS from public folder
 */
export async function fetchTemplate(templateId: string): Promise<{ html: string; css: string }> {
  try {
    const [htmlResponse, cssResponse] = await Promise.all([
      fetch(`/templates/${templateId}/index.html`),
      fetch(`/templates/${templateId}/styles.css`),
    ]);

    if (!htmlResponse.ok || !cssResponse.ok) {
      throw new Error('Failed to fetch template files');
    }

    const html = await htmlResponse.text();
    const css = await cssResponse.text();

    return { html, css };
  } catch (error) {
    console.error('Error fetching template:', error);
    throw error;
  }
}

/**
 * Replace placeholders in template with actual data
 */
export function replacePlaceholders(
  templateHtml: string,
  placeholders: Record<string, string>
): string {
  let processedHtml = templateHtml;

  // Replace all placeholders
  Object.entries(placeholders).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    const regex = new RegExp(placeholder, 'g');
    processedHtml = processedHtml.replace(regex, value);
  });

  return processedHtml;
}

/**
 * Map user data to template placeholders
 * This is a simple mapping - AI will enhance this later
 */
export function mapUserDataToPlaceholders(
  userData: UserData,
  templateConfig: TemplateConfig
): Record<string, string> {
  const { placeholders } = templateConfig;
  const mappedData: Record<string, string> = {};

  // Basic mapping - will be enhanced with AI
  mappedData.SITE_TITLE = userData.siteName || placeholders.SITE_TITLE;
  mappedData.SITE_DESCRIPTION = userData.description || placeholders.SITE_DESCRIPTION;
  
  // Hero section
  mappedData.HERO_TITLE = userData.siteName || placeholders.HERO_TITLE;
  mappedData.HERO_SUBTITLE = userData.description || placeholders.HERO_SUBTITLE;

  // About section
  mappedData.ABOUT_TITLE = 'About Us';
  mappedData.ABOUT_TEXT = userData.additionalInfo || 
    `We are ${userData.siteName}, dedicated to ${userData.description}. ` +
    `We serve ${userData.targetAudience || 'our valued customers'} with excellence.`;

  // Features/Services
  if (userData.features && userData.features.length > 0) {
    userData.features.forEach((feature, index) => {
      const featureNum = index + 1;
      mappedData[`SERVICE_${featureNum}_TITLE`] = feature;
      mappedData[`SERVICE_${featureNum}_DESC`] = `Experience our ${feature.toLowerCase()} service.`;
      mappedData[`FEATURE_${featureNum}_TITLE`] = feature;
      mappedData[`FEATURE_${featureNum}_DESC`] = `Discover our ${feature.toLowerCase()} capabilities.`;
      mappedData[`PROJECT_${featureNum}_TITLE`] = feature;
      mappedData[`PROJECT_${featureNum}_DESC`] = `Innovative ${feature.toLowerCase()} solutions.`;
    });
  }

  // Fill remaining placeholders with defaults
  Object.entries(placeholders).forEach(([key, defaultValue]) => {
    if (!mappedData[key]) {
      mappedData[key] = defaultValue;
    }
  });

  return mappedData;
}

/**
 * Generate a complete website from template and user data
 */
export async function generateWebsite(
  templateId: string,
  templateConfig: TemplateConfig,
  userData: UserData
): Promise<{ html: string; css: string }> {
  try {
    // 1. Fetch template files
    const { html, css } = await fetchTemplate(templateId);

    // 2. Map user data to placeholders
    const placeholders = mapUserDataToPlaceholders(userData, templateConfig);

    // 3. Replace placeholders in HTML
    const processedHtml = replacePlaceholders(html, placeholders);

    // 4. Return processed files
    return {
      html: processedHtml,
      css: css,
    };
  } catch (error) {
    console.error('Error generating website:', error);
    throw error;
  }
}

/**
 * Create a complete HTML document with embedded CSS
 */
export function createCompleteHtmlDocument(html: string, css: string): string {
  // Extract body content from template HTML
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const bodyContent = bodyMatch ? bodyMatch[1] : html;

  // Extract head content (title, meta tags)
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1] : 'My Website';

  const metaDescMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/i);
  const metaDescription = metaDescMatch ? metaDescMatch[1] : '';

  // Create complete HTML document with embedded styles
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <meta name="description" content="${metaDescription}">
    <style>
${css}
    </style>
</head>
<body>
${bodyContent}
</body>
</html>`;
}
