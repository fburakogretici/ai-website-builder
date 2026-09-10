import { getAllPosts } from '@/lib/blog';
import { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: 'Blog - NoCodePage',
        description: 'AI, no-code, and web development insights for the modern era.',
    };
}

export default async function BlogPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'blog' });
    const posts = getAllPosts();

    // Bento grid pattern logic
    const getBentoClass = (index: number) => {
        const patterns = [
            'md:col-span-2 md:row-span-2', // Massive
            'md:col-span-1 md:row-span-1', // Small
            'md:col-span-1 md:row-span-1', // Small
            'md:col-span-2 md:row-span-1', // Wide
            'md:col-span-1 md:row-span-2', // Tall
            'md:col-span-1 md:row-span-1', // Small
            'md:col-span-1 md:row-span-1', // Small (Fills the gap)
        ];
        return patterns[index % patterns.length];
    };

    return (
        <div className="min-h-screen bg-white dark:bg-[#060606] text-gray-900 dark:text-white selection:bg-indigo-500/30 transition-colors duration-700" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
            {/* Immersive Background System */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
                <div className="absolute top-[30%] left-[40%] w-[30%] h-[30%] bg-blue-500/5 dark:bg-blue-500/5 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '4s' }}></div>
            </div>

            {/* Hero Section */}
            <section className="relative pt-40 pb-32 overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
                        <div className="inline-flex items-center gap-3 px-4 py-2 bg-gray-100 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-full mb-10 backdrop-blur-xl shadow-2xl animate-fade-in">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                            </span>
                            <span className="text-[10px] font-black tracking-[0.3em] text-gray-500 dark:text-white/40 uppercase">{t('resources')}</span>
                        </div>

                        <h1 className="text-6xl md:text-9xl font-bold tracking-tighter mb-10 leading-[0.9] animate-slide-up">
                            {t('futureOfWeb').split('.').filter(Boolean).map((part, i) => (
                                <span key={i} className="block relative">
                                    {i === 1 ? (
                                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 dark:from-white dark:via-white/80 dark:to-white/20">
                                            {part}.
                                        </span>
                                    ) : (
                                        part + (i === 0 ? "." : "")
                                    )}
                                </span>
                            ))}
                        </h1>

                        <p className="text-xl md:text-3xl text-gray-500 dark:text-white/40 max-w-3xl leading-relaxed font-light animate-fade-in" style={{ animationDelay: '0.4s' }}>
                            {t('subtitle')}
                        </p>
                    </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-white/10 to-transparent"></div>
            </section>

            {/* Content Grid */}
            <section className="relative max-w-7xl mx-auto px-6 py-24 pb-40">
                {posts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-40 border border-dashed border-gray-200 dark:border-white/10 rounded-[4rem] bg-gray-50/50 dark:bg-white/[0.02] backdrop-blur-md">
                        <div className="w-20 h-20 mb-8 rounded-3xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center animate-pulse">
                            <svg className="w-10 h-10 text-gray-300 dark:text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l4 4v10a2 2 0 01-2 2z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M14 2v4h4" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 10h10M7 14h10M7 18h5" />
                            </svg>
                        </div>
                        <p className="text-gray-400 dark:text-white/20 text-xl font-light tracking-[0.2em] uppercase animate-pulse">{t('transmissionPending')}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 auto-rows-[400px] gap-10">
                        {posts.map((post, index) => {
                            const bentoClass = getBentoClass(index);
                            const isLarge = index % 6 === 0;

                            return (
                                <Link
                                    key={post.slug}
                                    href={`/${locale}/blog/${post.slug}`}
                                    className={`group relative overflow-hidden rounded-[3rem] bg-white dark:bg-[#0c0c0c] border border-gray-100 dark:border-white/[0.05] hover:border-indigo-500/40 dark:hover:border-white/20 transition-all duration-1000 ${bentoClass} shadow-[0_20px_50px_-15px_rgba(0,0,0,0.04)] dark:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] flex flex-col active:scale-[0.98] hover:shadow-[0_40px_80px_-15px_rgba(0,0,0,0.08)]`}
                                >
                                    {/* Glass Overlay Glow */}
                                    <div className="absolute inset-0 z-10 bg-gradient-to-br from-white/10 to-transparent dark:from-white/[0.02] dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>

                                    {/* Visual Background */}
                                    <div className="absolute inset-0 z-0 h-full w-full overflow-hidden">
                                        {post.image ? (
                                            <>
                                                <img
                                                    src={post.image}
                                                    alt={post.title}
                                                    className="w-full h-full object-cover opacity-[0.7] dark:opacity-[0.4] group-hover:opacity-[1] dark:group-hover:opacity-[0.8] group-hover:scale-110 transition-all duration-1000 ease-in-out"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent dark:from-[#0c0c0c] dark:via-[#0c0c0c]/80 dark:to-transparent transition-colors duration-1000"></div>
                                                <div className="absolute inset-0 bg-white/10 dark:bg-black/20"></div>
                                            </>
                                        ) : (
                                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.1] to-purple-500/[0.1] dark:from-indigo-500/[0.1] dark:to-purple-500/[0.1]"></div>
                                        )}
                                    </div>

                                    {/* Animated Border Beam (Simulated) */}
                                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/0 to-transparent group-hover:via-indigo-500 dark:group-hover:via-white transition-all duration-1000"></div>

                                    {/* Content Container */}
                                    <div className="relative z-20 h-full p-10 md:p-12 flex flex-col justify-between overflow-hidden">
                                        <div className="flex-1 overflow-hidden">
                                            {/* Tags */}
                                            <div className="flex flex-wrap gap-2 mb-8">
                                                {post.tags?.slice(0, 2).map((tag) => (
                                                    <span
                                                        key={tag}
                                                        className="px-4 py-1.5 text-[9px] font-black tracking-[0.2em] text-gray-500 dark:text-white/30 bg-gray-100/80 dark:bg-white/[0.05] rounded-full border border-gray-200/50 dark:border-white/[0.05] uppercase backdrop-blur-2xl group-hover:bg-indigo-500/10 dark:group-hover:bg-white/10 transition-colors duration-500"
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>

                                            {/* Title */}
                                            <h2 className={`font-bold text-gray-900 dark:text-white tracking-tighter leading-tight mb-6 group-hover:translate-y-[-4px] transition-transform duration-700 line-clamp-2 ${isLarge ? 'text-4xl md:text-5xl lg:text-6xl' : 'text-2xl md:text-3xl'}`}>
                                                {post.title}
                                            </h2>

                                            {/* Description - only show on large cards */}
                                            {isLarge && (
                                                <p className="text-gray-500 dark:text-white/40 text-lg leading-relaxed font-light line-clamp-2 mb-8 max-w-xl">
                                                    {post.description}
                                                </p>
                                            )}
                                        </div>

                                        {/* Footer */}
                                        <div className="flex-shrink-0 flex items-center justify-between pt-8 border-t border-gray-200/50 dark:border-white/[0.05]">
                                            <div className="flex items-center gap-5">
                                                <div className="w-10 h-10 rounded-2xl bg-gray-100 dark:bg-white/[0.05] border border-gray-200 dark:border-white/[0.1] flex items-center justify-center backdrop-blur-2xl group-hover:scale-110 transition-transform duration-500">
                                                    <span className="text-xs text-gray-600 dark:text-white/50 font-black uppercase">{post.author.charAt(0)}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] font-black text-gray-800 dark:text-white/60 tracking-[0.1em] uppercase group-hover:text-indigo-600 dark:group-hover:text-white transition-colors duration-500">{post.author}</span>
                                                    <span className="text-[10px] font-bold text-gray-400 dark:text-white/20 tracking-wider uppercase">{post.readingTime}</span>
                                                </div>
                                            </div>

                                            <div className="w-14 h-14 rounded-full bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.05] flex items-center justify-center group-hover:bg-indigo-600 dark:group-hover:bg-white group-hover:scale-110 transition-all duration-700 shadow-xl group-hover:shadow-indigo-500/20 dark:group-hover:shadow-white/10">
                                                <svg className="w-5 h-5 text-gray-400 dark:text-white/20 group-hover:text-white dark:group-hover:text-black transform group-hover:rotate-45 transition-all duration-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7-7 7" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* Custom Animations */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
                
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slide-up {
                    from { opacity: 0; transform: translateY(40px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in { animation: fade-in 1.2s ease-out forwards; }
                .animate-slide-up { animation: slide-up 1s cubic-bezier(0.165, 0.84, 0.44, 1) forwards; }
                `}} />
        </div>
    );
}
