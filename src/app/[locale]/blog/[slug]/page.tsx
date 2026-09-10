import { getPostBySlug, getAllPostSlugs } from '@/lib/blog';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { MDXRemote } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { getTranslations } from 'next-intl/server';

export async function generateStaticParams() {
    const slugs = getAllPostSlugs();
    const locales = ['en', 'tr'];

    return locales.flatMap((locale) =>
        slugs.map((slug) => ({
            locale,
            slug,
        }))
    );
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string; locale: string }>;
}): Promise<Metadata> {
    const { slug } = await params;
    const post = getPostBySlug(slug);

    if (!post) {
        return {
            title: 'Post Not Found',
        };
    }

    return {
        title: `${post.title} - NoCodePage`,
        description: post.description,
    };
}

export default async function BlogPostPage({
    params,
}: {
    params: Promise<{ slug: string; locale: string }>;
}) {
    const { slug, locale } = await params;
    const t = await getTranslations({ locale, namespace: 'blog' });
    const post = getPostBySlug(slug);

    if (!post) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-white dark:bg-[#060606] text-gray-900 dark:text-white selection:bg-indigo-500/30 transition-colors duration-700" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
            {/* Reading Progress Bar Placeholder */}
            <div className="fixed top-0 left-0 right-0 h-1 z-[60] pointer-events-none opacity-20">
                <div className="h-full bg-indigo-600 dark:bg-white w-0 transition-all duration-300"></div>
            </div>

            {/* Immersive Hero Header */}
            <header className="relative h-[60vh] min-h-[500px] w-full overflow-hidden flex items-center justify-center">
                {/* Visual Background */}
                <div className="absolute inset-0 z-0">
                    {post.image ? (
                        <div className="relative w-full h-full">
                            <img
                                src={post.image}
                                alt={post.title}
                                className="w-full h-full object-cover"
                            />
                            {/* Overlay Gradient System */}
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px]"></div>
                            <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-[#060606] via-transparent to-black/30"></div>
                        </div>
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-900 via-indigo-950 to-purple-950"></div>
                    )}
                </div>

                {/* Hero Content */}
                <div className="relative z-10 max-w-5xl mx-auto px-6 pt-20 text-center flex flex-col items-center">
                    {/* Back Link Overlay */}
                    <Link
                        href={`/${locale}/blog`}
                        className="absolute top-10 left-6 group inline-flex items-center gap-2 text-[10px] font-black tracking-[0.2em] text-white/40 hover:text-white transition-all uppercase"
                    >
                        <div className="w-8 h-8 rounded-xl bg-white/10 dark:bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-all">
                            <svg className="w-3 h-3 text-white/60 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M15 19l-7-7 7-7" />
                            </svg>
                        </div>
                        {t('backToInsights')}
                    </Link>

                    {/* Tags */}
                    {post.tags && (
                        <div className="flex flex-wrap justify-center gap-3 mb-8 animate-fade-in">
                            {post.tags.map((tag) => (
                                <span
                                    key={tag}
                                    className="px-4 py-1.5 text-[9px] font-black tracking-[0.2em] text-white/40 bg-white/5 rounded-full border border-white/10 uppercase backdrop-blur-xl"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}

                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter text-white mb-10 leading-[1] max-w-4xl animate-slide-up">
                        {post.title}
                    </h1>

                    <div className="flex flex-wrap items-center justify-center gap-6 text-[10px] font-bold text-white/40 tracking-widest uppercase animate-fade-in" style={{ animationDelay: '0.2s' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-[10px] text-white">
                                {post.author.charAt(0)}
                            </div>
                            <span>{post.author}</span>
                        </div>
                        <div className="w-1 h-1 bg-white/20 rounded-full"></div>
                        <time dateTime={post.date}>
                            {new Date(post.date).toLocaleDateString(locale, {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                            })}
                        </time>
                        <div className="w-1 h-1 bg-white/20 rounded-full"></div>
                        <div>{post.readingTime}</div>
                    </div>
                </div>
            </header>

            <div className="max-w-4xl mx-auto px-6 pb-40 relative z-20 -mt-16">
                {/* Main Content Area */}
                <article className="relative p-8 md:p-16 lg:p-24 rounded-[3rem] bg-white dark:bg-[#0c0c0c] border border-gray-200/60 dark:border-white/[0.05] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] dark:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)]">

                    {/* Prose with Refined Typography Hierarchy */}
                    <div className="prose prose-zinc dark:prose-invert max-w-none
                        prose-headings:font-black prose-headings:tracking-tighter prose-headings:text-gray-900 dark:prose-headings:text-white
                        prose-h2:text-3xl md:text-5xl prose-h2:mt-20 prose-h2:mb-8 prose-h2:pb-4 prose-h2:border-b prose-h2:border-gray-100 dark:prose-h2:border-white/[0.05] prose-h2:leading-tight
                        prose-h3:text-2xl md:text-3xl prose-h3:mt-16 prose-h3:mb-6 prose-h3:leading-snug
                        prose-p:text-gray-600 dark:prose-p:text-zinc-400 prose-p:text-base md:text-lg prose-p:leading-[1.8] prose-p:mb-8 prose-p:font-normal
                        prose-strong:text-gray-900 dark:prose-strong:text-white prose-strong:font-black
                        prose-img:rounded-[2rem] prose-img:shadow-2xl prose-img:my-16 prose-img:border prose-img:border-gray-100 dark:prose-img:border-white/5
                        prose-a:text-indigo-600 dark:prose-a:text-white prose-a:font-bold prose-a:underline prose-a:underline-offset-8 prose-a:decoration-indigo-600/20 dark:prose-a:decoration-white/20 hover:prose-a:decoration-indigo-600 dark:hover:prose-a:decoration-white
                        prose-code:text-indigo-600 dark:prose-code:text-purple-300 prose-code:bg-indigo-50 dark:prose-code:bg-white/[0.03] prose-code:px-2 prose-code:py-0.5 prose-code:rounded-lg prose-code:before:content-none prose-code:after:content-none prose-code:font-bold prose-code:text-sm
                        prose-pre:bg-gray-900 dark:prose-pre:bg-black prose-pre:border prose-pre:border-white/10 prose-pre:rounded-2xl prose-pre:p-8 prose-pre:shadow-2xl
                        prose-blockquote:border-l-[4px] prose-blockquote:border-indigo-600 dark:prose-blockquote:border-white/20 prose-blockquote:pl-8 prose-blockquote:text-gray-900 dark:prose-blockquote:text-white prose-blockquote:font-bold prose-blockquote:italic prose-blockquote:text-2xl prose-blockquote:bg-gray-50 dark:prose-blockquote:bg-white/[0.02] prose-blockquote:py-12 prose-blockquote:pr-8 prose-blockquote:rounded-r-2xl prose-blockquote:my-16
                        prose-ul:my-10 prose-ul:list-disc prose-ul:pl-8
                        prose-li:text-gray-600 dark:prose-li:text-zinc-400 prose-li:text-base md:text-lg prose-li:my-3
                        prose-hr:border-gray-100 dark:prose-hr:border-white/5 prose-hr:my-24
                    ">
                        <MDXRemote
                            source={post.content}
                            options={{
                                mdxOptions: {
                                    remarkPlugins: [remarkGfm],
                                    rehypePlugins: [rehypeHighlight],
                                }
                            }}
                        />
                    </div>

                    {/* Author & Back Link */}
                    <div className="mt-24 pt-16 border-t border-gray-100 dark:border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-xl shadow-indigo-600/20">
                                {post.author.charAt(0)}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black tracking-[0.2em] text-gray-400 dark:text-white/20 uppercase mb-0.5">{locale === 'tr' ? 'YAZAR' : 'WRITTEN BY'}</span>
                                <span className="text-lg font-black text-gray-900 dark:text-white">{post.author}</span>
                            </div>
                        </div>
                        <Link
                            href={`/${locale}/blog`}
                            className="group flex items-center gap-3 px-8 py-4 bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5 rounded-2xl text-[10px] font-black tracking-[0.2em] text-gray-500 dark:text-white/40 uppercase hover:bg-gray-900 dark:hover:bg-white hover:text-white dark:hover:text-black transition-all duration-500"
                        >
                            <svg className="w-3.5 h-3.5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M15 19l-7-7 7-7" />
                            </svg>
                            {t('backToInsights')}
                        </Link>
                    </div>
                </article>

                {/* Simplified CTA */}
                <div className="mt-20 p-10 md:p-16 relative overflow-hidden rounded-[3rem] bg-indigo-600 dark:bg-white text-white dark:text-black text-center shadow-2xl">
                    <h3 className="text-3xl md:text-5xl font-black tracking-tighter mb-6 leading-[0.9]">
                        {t('readyToBuild')}
                    </h3>
                    <p className="text-white/70 dark:text-black/60 text-lg md:text-xl max-w-xl mx-auto mb-10 font-light">
                        {t('ctaSubtitle')}
                    </p>
                    <Link
                        href={`/${locale}`}
                        className="inline-flex items-center gap-4 px-10 py-5 bg-white dark:bg-black text-indigo-600 dark:text-white font-black tracking-[0.2em] uppercase text-xs rounded-full hover:scale-105 transition-all shadow-xl"
                    >
                        {t('getStarted')}
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </Link>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
                
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slide-up { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in { animation: fade-in 1.2s ease-out forwards; }
                .animate-slide-up { animation: slide-up 1s cubic-bezier(0.165, 0.84, 0.44, 1) forwards; }
                
                ::selection { background-color: rgba(99, 102, 241, 0.2); }
                `}} />
        </div>
    );
}
