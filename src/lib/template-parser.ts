import type { TemplateData } from '@/types/template';

/**
 * Parse template HTML and replace placeholders with data
 */
export function parseTemplate(html: string, data: TemplateData): string {
  let result = html;
  
  // Replace basic placeholders {{key}}
  const placeholders = result.match(/\{\{(\w+)\}\}/g) || [];
  
  for (const placeholder of placeholders) {
    const key = placeholder.replace(/\{\{|\}\}/g, '') as keyof TemplateData;
    const value = data[key];
    
    if (value !== undefined && value !== null) {
      if (typeof value === 'string') {
        result = result.replace(placeholder, value);
      } else if (typeof value === 'number') {
        result = result.replace(placeholder, String(value));
      }
    }
  }
  
  // Replace nested placeholders {{object.key}}
  const nestedPlaceholders = result.match(/\{\{(\w+)\.(\w+)\}\}/g) || [];
  
  for (const placeholder of nestedPlaceholders) {
    const match = placeholder.match(/\{\{(\w+)\.(\w+)\}\}/);
    if (match) {
      const [, obj, key] = match;
      const objValue = data[obj as keyof TemplateData];
      
      if (objValue && typeof objValue === 'object' && key in objValue) {
        const value = (objValue as Record<string, unknown>)[key];
        if (value !== undefined && value !== null) {
          result = result.replace(placeholder, String(value));
        }
      }
    }
  }
  
  return result;
}

/**
 * Parse CSS and replace color variables
 */
export function parseCss(css: string, data: TemplateData): string {
  let result = css;
  
  // Replace color variables
  if (data.primaryColor) {
    result = result.replace(/var\(--primary-color\)|#007bff/gi, data.primaryColor);
  }
  
  if (data.secondaryColor) {
    result = result.replace(/var\(--secondary-color\)|#6c757d/gi, data.secondaryColor);
  }
  
  if (data.accentColor) {
    result = result.replace(/var\(--accent-color\)|#28a745/gi, data.accentColor);
  }
  
  return result;
}

/**
 * Inject CSS styles into HTML head
 */
export function injectStyles(html: string, css: string): string {
  const styleTag = `<style>\n${css}\n</style>`;
  
  // Try to inject into <head>
  if (html.includes('</head>')) {
    return html.replace('</head>', `${styleTag}\n</head>`);
  }
  
  // Fallback: inject at the beginning
  return styleTag + '\n' + html;
}

/**
 * Cleanup unused placeholders
 */
export function cleanupUnusedPlaceholders(html: string): string {
  // Remove remaining {{placeholder}} patterns
  return html.replace(/\{\{[^}]+\}\}/g, '');
}
