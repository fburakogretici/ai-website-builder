import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

export default async function AIBuilderLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const awaitedParams = await params;
  const { locale } = awaitedParams;
  const messages = await getMessages({ locale });

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <div className="h-screen overflow-hidden">
        {children}
      </div>
    </NextIntlClientProvider>
  );
}
