import { getRequestConfig } from 'next-intl/server';

export const locales = ['tr', 'en'] as const;

export default getRequestConfig(async ({ locale }) => {
  // Ensure locale is valid, default to 'tr' if undefined
  const validLocale = locale && ['tr', 'en'].includes(locale) ? locale : 'tr';
  
  return {
    locale: validLocale,
    messages: (await import(`../messages/${validLocale}.json`)).default
  };
});
