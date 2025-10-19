'use client';

import { useState, useEffect } from 'react';
import { getTemplateById, TemplateConfig } from '@/lib/templates/template-definitions';
import { generateWebsite, createCompleteHtmlDocument, UserData } from '@/lib/templates/template-processor';

interface TemplatePreviewProps {
  templateId: string;
}

// Loading spinner component
const PreviewLoading = () => (
  <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
    <div className="flex flex-col items-center gap-4">
      <svg className="animate-spin h-10 w-10 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <p className="text-gray-600 dark:text-gray-300">Loading Preview...</p>
    </div>
  </div>
);

export default function TemplatePreview({ templateId }: TemplatePreviewProps) {
  const [htmlDoc, setHtmlDoc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!templateId) return;

    const generatePreview = async () => {
      setHtmlDoc(null); // Reset on change
      setError(null);

      try {
        const templateConfig = getTemplateById(templateId);
        if (!templateConfig) {
          throw new Error(`Template with id "${templateId}" not found.`);
        }

        // Use default placeholders as fake user data for the preview
        const fakeUserData: UserData = {
          siteName: templateConfig.placeholders.SITE_TITLE || 'My Website',
          siteType: templateConfig.category,
          description: templateConfig.placeholders.SITE_DESCRIPTION || 'A great description of my website.',
          features: [
            templateConfig.placeholders.SERVICE_1_TITLE || 'Feature 1',
            templateConfig.placeholders.SERVICE_2_TITLE || 'Feature 2',
            templateConfig.placeholders.SERVICE_3_TITLE || 'Feature 3',
          ],
          additionalInfo: templateConfig.placeholders.ABOUT_TEXT || 'More information about our company.',
          targetAudience: 'Everyone',
        };

        const { html, css } = await generateWebsite(templateId, templateConfig, fakeUserData);
        const finalHtml = createCompleteHtmlDocument(html, css);
        setHtmlDoc(finalHtml);

      } catch (err) {
        console.error("Failed to generate template preview:", err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      }
    };

    generatePreview();
  }, [templateId]);

  return (
    <div className="w-full h-full bg-gray-200 dark:bg-gray-900 flex items-center justify-center p-4">
      {error && <div className="text-red-500">{error}</div>}
      {!htmlDoc && !error && <PreviewLoading />}
      {htmlDoc && (
        <div className="relative w-full h-full rounded-lg overflow-hidden shadow-2xl bg-white">
          <iframe
            srcDoc={htmlDoc}
            title={`Preview of ${templateId}`}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      )}
    </div>
  );
}
