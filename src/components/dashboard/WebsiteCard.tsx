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
        className={`group bg-white dark:bg-gray-800 rounded-2xl p-4 border transition-all duration-300 hover:shadow-xl ${website.is_published
            ? 'border-emerald-500/30 dark:border-emerald-500/30 hover:border-emerald-500 dark:hover:border-emerald-400'
            : 'border-gray-200 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-500'
          }`}
      >
        {/* Preview */}
        <div
          className="w-full h-48 bg-gray-100 dark:bg-gray-900 rounded-xl mb-4 overflow-hidden border border-gray-100 dark:border-gray-700 relative cursor-pointer group-hover:scale-[1.02] transition-transform duration-300"
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
          {website.is_published && (
            <div className="absolute top-3 left-3 bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm z-10">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
              {locale === 'tr' ? 'YAYINDA' : 'LIVE'}
            </div>
          )}

          {/* Draft Badge (Optional, for clarity) */}
          {!website.is_published && (
            <div className="absolute top-3 left-3 bg-gray-900/60 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm z-10">
              {locale === 'tr' ? 'TASLAK' : 'DRAFT'}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3
                className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1 cursor-pointer"
                onClick={() => router.push(`/${locale}/editor/${website.id}`)}
              >
                {website.name}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {new Date(website.created_at).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </p>
            </div>

            <button
              onClick={(e) => onDelete(website.id, website.name, e)}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
              title={locale === 'tr' ? 'Sil' : 'Delete'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>

          {/* Subdomain Link */}
          {website.is_published && website.subdomain && (
            <a
              href={`/s/${website.subdomain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-md w-fit"
              onClick={(e) => e.stopPropagation()}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              {website.subdomain}
            </a>
          )}

          <div className="flex gap-2 pt-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/${locale}/editor/${website.id}`);
              }}
              className="flex-1 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 rounded-lg transition-colors text-sm font-semibold shadow-sm"
            >
              {locale === 'tr' ? 'Düzenle' : 'Edit'}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowPublishModal(true);
              }}
              className={`py-2 px-3 rounded-lg transition-colors text-sm font-medium border ${website.is_published
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400 hover:bg-emerald-100'
                : 'bg-white border-gray-200 text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
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
              className="py-2 px-3 bg-white border border-gray-200 text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
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
