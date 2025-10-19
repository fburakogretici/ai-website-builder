import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import Image from 'next/image';
import { getLocale } from 'next-intl/server';

const TemplatesPage = async () => {
  const locale = await getLocale();
  const templatesDirectory = path.join(process.cwd(), 'public/templates');
  const templateNames = fs.readdirSync(templatesDirectory);

  const templates = templateNames.map(name => {
    const nameParts = name.split('-');
    const capitalizedName = nameParts.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    return {
      id: name,
      name: capitalizedName,
      previewUrl: `/templates/${name}/preview.png`,
    };
  });

  return (
    <div className="bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white sm:text-5xl lg:text-6xl">
                {locale === 'tr' ? 'Tüm Şablonlar' : 'All Templates'}
            </h1>
            <p className="mt-4 text-xl text-gray-600 dark:text-gray-300">
                {locale === 'tr' ? 'Projeniz için mükemmel başlangıç noktasını seçin.' : 'Choose the perfect starting point for your project.'}
            </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {templates.map(template => (
            <div key={template.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 group">
                <div className="relative h-64 w-full overflow-hidden bg-gray-100 dark:bg-gray-700">
                    <Image 
                        src={template.previewUrl} 
                        alt={`${template.name} Preview`} 
                        width={400}
                        height={300}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                </div>
                <div className="p-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {template.name}
                    </h2>
                </div>
            </div>
            ))}
        </div>

        <div className="text-center mt-12">
            <Link href={`/${locale}`} className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold">
            &larr; {locale === 'tr' ? 'Ana Sayfaya Dön' : 'Back to Home'}
            </Link>
        </div>
        </div>
    </div>
  );
};

export default TemplatesPage;
