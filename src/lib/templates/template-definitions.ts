// Template Types
export interface TemplateConfig {
  id: string;
  name: string;
  name_en: string;
  category: 'business' | 'portfolio' | 'landing';
  description: string;
  description_en: string;
  preview: string;
  color: string;
  placeholders: Record<string, string>;
}

// Available Templates
export const TEMPLATES: TemplateConfig[] = [
  {
    id: 'business-modern',
    name: 'Modern İşletme',
    name_en: 'Modern Business',
    category: 'business',
    description: 'Profesyonel işletmeler için modern ve şık tasarım',
    description_en: 'Modern and elegant design for professional businesses',
    preview: '/templates/business-modern/preview.png',
    color: 'blue',
    placeholders: {
      SITE_TITLE: 'Company Name',
      SITE_DESCRIPTION: 'Professional business solutions',
      HERO_TITLE: 'Welcome to Our Business',
      HERO_SUBTITLE: 'We provide excellent services',
      ABOUT_TITLE: 'About Us',
      ABOUT_TEXT: 'We are a leading company...',
      SERVICES_TITLE: 'Our Services',
      SERVICE_1_TITLE: 'Service 1',
      SERVICE_1_DESC: 'Description of service 1',
      SERVICE_2_TITLE: 'Service 2',
      SERVICE_2_DESC: 'Description of service 2',
      SERVICE_3_TITLE: 'Service 3',
      SERVICE_3_DESC: 'Description of service 3',
      CONTACT_EMAIL: 'info@company.com',
      CONTACT_PHONE: '+1 234 567 890',
      CONTACT_ADDRESS: '123 Business St, City, Country',
    },
  },
  {
    id: 'portfolio-creative',
    name: 'Yaratıcı Portfolyo',
    name_en: 'Creative Portfolio',
    category: 'portfolio',
    description: 'Tasarımcılar ve yaratıcı profesyoneller için şık portfolyo',
    description_en: 'Elegant portfolio for designers and creative professionals',
    preview: '/templates/portfolio-creative/preview.png',
    color: 'purple',
    placeholders: {
      SITE_TITLE: 'Your Name',
      SITE_DESCRIPTION: 'Creative Portfolio',
      HERO_TITLE: 'Creative Designer',
      HERO_SUBTITLE: 'Bringing ideas to life',
      ABOUT_TITLE: 'About Me',
      ABOUT_TEXT: 'I am a passionate designer...',
      PORTFOLIO_TITLE: 'My Work',
      PROJECT_1_TITLE: 'Project 1',
      PROJECT_1_DESC: 'Amazing project description',
      PROJECT_2_TITLE: 'Project 2',
      PROJECT_2_DESC: 'Creative solution description',
      PROJECT_3_TITLE: 'Project 3',
      PROJECT_3_DESC: 'Innovative design description',
      SKILLS_TITLE: 'Skills',
      CONTACT_EMAIL: 'hello@designer.com',
      CONTACT_SOCIAL: 'Social media links',
    },
  },
  {
    id: 'landing-startup',
    name: 'Startup Landing',
    name_en: 'Startup Landing',
    category: 'landing',
    description: 'Startup ve ürün lansmanı için modern landing page',
    description_en: 'Modern landing page for startups and product launches',
    preview: '/templates/landing-startup/preview.png',
    color: 'green',
    placeholders: {
      SITE_TITLE: 'Startup Name',
      SITE_DESCRIPTION: 'Revolutionary product',
      HERO_TITLE: 'Build Something Amazing',
      HERO_SUBTITLE: 'The future starts here',
      CTA_BUTTON: 'Start Free Trial',
      FEATURE_1_TITLE: 'Fast & Easy',
      FEATURE_1_DESC: 'Get started in minutes',
      FEATURE_2_TITLE: 'Powerful',
      FEATURE_2_DESC: 'All the tools you need',
      FEATURE_3_TITLE: 'Secure',
      FEATURE_3_DESC: 'Your data is safe',
      TESTIMONIAL_TEXT: 'This product changed our business!',
      TESTIMONIAL_AUTHOR: 'Happy Customer',
      PRICING_TITLE: 'Simple Pricing',
      PRICE_AMOUNT: '$29',
      PRICE_PERIOD: '/month',
      CONTACT_EMAIL: 'hello@startup.com',
    },
  },
];

// Helper Functions
export function getTemplateById(id: string): TemplateConfig | undefined {
  return TEMPLATES.find((template) => template.id === id);
}

export function getTemplatesByCategory(category: 'business' | 'portfolio' | 'landing'): TemplateConfig[] {
  return TEMPLATES.filter((template) => template.category === category);
}

export function getAllTemplates(): TemplateConfig[] {
  return TEMPLATES;
}
