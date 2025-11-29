"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import PublishSettings from "./PublishSettings";

interface WebsiteCardProps {
  website: {
    id: string;
    name: string;
    html_content: string;
    status: string;
    created_at: string;
    is_published?: boolean;
    subdomain?: string;
  };
  onDelete: (id: string, name: string, e: React.MouseEvent) => void;
  onUpdate: () => void;
}

export default function WebsiteCard({ website, onDelete, onUpdate }: WebsiteCardProps) {
  const router = useRouter();
  const locale = useLocale();
  const [showPublishModal, setShowPublishModal] = useState(false);

  const handlePublishChange = () => {
    // Trigger parent refresh
    onUpdate();
  };

  return (
    <>
      <div
        className="group bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-lg transition-all duration-200"
      >
        {/* Preview */}
        <div
          className="w-full h-48 bg-white dark:bg-gray-800 rounded-lg mb-3 overflow-hidden border border-gray-200 dark:border-gray-700 relative cursor-pointer"
          onClick={() => router.push(`/${locale}/editor/${website.id}`)}
        >
          <div className="absolute inset-0" style={{ transform: 'scale(0.25)', transformOrigin: 'top left', width: '400%', height: '400%' }}>
            <iframe
              srcDoc={website.html_content}
              className="w-full h-full border-0 pointer-events-none"
              title={`Preview of ${website.name}`}
              sandbox=""
            />
          </div>

          {/* Published Badge */}
          {website.is_published && website.subdomain && (
            <div className="absolute top-2 left-2 bg-emerald-500/90 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
              Live
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3
              className="font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1 text-base cursor-pointer"
              onClick={() => router.push(`/${locale}/editor/${website.id}`)}
            >
              {website.name}
            </h3>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${website.is_published
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                }`}>
                {website.is_published ? (locale === 'tr' ? 'Yayında' : 'Live') : (locale === 'tr' ? 'Taslak' : 'Draft')}
              </span>
              <button
                onClick={(e) => onDelete(website.id, website.name, e)}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                title={locale === 'tr' ? 'Sil' : 'Delete'}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Subdomain Link */}
          {website.is_published && website.subdomain && (
            <a
              href={`/s/${website.subdomain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              /s/{website.subdomain}
            </a>
          )}

          <p className="text-xs text-gray-500 dark:text-gray-400">
            {new Date(website.created_at).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}
          </p>

          <div className="flex gap-2 pt-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/${locale}/editor/${website.id}`);
              }}
              className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              {locale === 'tr' ? 'Düzenle' : 'Edit'}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowPublishModal(true);
              }}
              className={`py-2 px-3 rounded-lg transition-colors text-sm font-medium ${website.is_published
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              title={locale === 'tr' ? 'Yayınla' : 'Publish'}
            >
              🌐
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                const win = window.open('', '_blank');
                if (win) {
                  win.document.open();
                  win.document.write(website.html_content);
                  win.document.close();
                }
              }}
              className="py-2 px-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm"
              title={locale === 'tr' ? 'Önizle' : 'Preview'}
            >
              👁️
            </button>
          </div>
        </div>
      </div>

      {/* Publish Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowPublishModal(false)}
          />

          {/* Modal Content */}
          <div className="relative bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h2 className="text-lg font-semibold text-white">
                {locale === 'tr' ? 'Yayınlama Ayarları' : 'Publishing Settings'}
              </h2>
              <button
                onClick={() => setShowPublishModal(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="p-4">
              <PublishSettings
                websiteId={website.id}
                websiteName={website.name}
                onPublishChange={handlePublishChange}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
