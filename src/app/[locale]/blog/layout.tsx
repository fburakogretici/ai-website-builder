import { getMessages } from 'next-intl/server';
import BlogLayoutClient from './BlogLayoutClient';

export default async function BlogLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const messages = await getMessages({ locale });

    return (
        <BlogLayoutClient params={{ locale }} messages={messages}>
            {children}
        </BlogLayoutClient>
    );
}
