// Template data types for the website builder

export interface ServiceItem {
  id?: string;
  title: string;
  description: string;
  icon?: string;
}

export interface TestimonialItem {
  id?: string;
  name: string;
  role: string;
  company?: string;
  content: string;
  avatar?: string;
  rating?: number;
}

export interface SocialLinks {
  facebook?: string;
  twitter?: string;
  instagram?: string;
  linkedin?: string;
  youtube?: string;
  tiktok?: string;
  github?: string;
}

export interface TemplateData {
  // Business Info
  businessName: string;
  tagline?: string;
  description?: string;
  industry?: string;
  targetAudience?: string;
  
  // Contact Info
  email?: string;
  phone?: string;
  address?: string;
  
  // Social Links
  socialLinks?: SocialLinks;
  
  // Content
  heroTitle?: string;
  heroSubtitle?: string;
  heroImage?: string;
  heroCtaText?: string;
  aboutContent?: string;
  
  // Services/Features
  services?: ServiceItem[];
  
  // Testimonials
  testimonials?: TestimonialItem[];
  
  // Colors/Theme
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  
  // Logo
  logo?: string;
  
  // Footer
  footerText?: string;
  copyrightText?: string;
  
  // Additional sections
  aboutText?: string;
  missionText?: string;
  visionText?: string;
  
  // Team members
  team?: Array<{
    id: string;
    name: string;
    role: string;
    bio?: string;
    image?: string;
  }>;
  
  // Products/Portfolio items
  portfolio?: Array<{
    id: string;
    title: string;
    description?: string;
    image?: string;
    link?: string;
    category?: string;
  }>;
  
  // Blog posts preview
  blogPosts?: Array<{
    id: string;
    title: string;
    excerpt?: string;
    image?: string;
    date?: string;
    author?: string;
  }>;
  
  // Pricing plans
  pricing?: Array<{
    id: string;
    name: string;
    price: number;
    period?: string;
    features: string[];
    highlighted?: boolean;
  }>;
  
  // FAQ items
  faq?: Array<{
    id: string;
    question: string;
    answer: string;
  }>;
  
  // Custom metadata
  metadata?: Record<string, unknown>;
}

export interface TemplateConfig {
  id: string;
  name: string;
  description: string;
  category: string;
  preview: string;
  features: string[];
  defaultData?: Partial<TemplateData>;
}

export type TemplateCategory = 
  | 'business'
  | 'portfolio'
  | 'landing'
  | 'ecommerce'
  | 'blog'
  | 'agency'
  | 'saas'
  | 'restaurant'
  | 'personal'
  | 'event';

/**
 * Loaded template with HTML, CSS and config
 */
export interface LoadedTemplate {
  html: string;
  css: string;
  config: TemplateConfig;
  preview?: string;
}

/**
 * Rendered website output
 */
export interface RenderedWebsite {
  html: string;
  css: string;
  fullHtml?: string;
  templateId: string;
  locale: string;
  generatedAt?: string;
}
