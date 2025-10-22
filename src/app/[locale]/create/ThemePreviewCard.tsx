import React from "react";

export default function ThemePreviewCard({ theme, locale, isSelected, onClick, onDoubleClick }: {
  theme: any;
  locale: string;
  isSelected: boolean;
  onClick: () => void;
  onDoubleClick: () => void;
}) {
  // id-folder eşleşmesi için map
  const themeFolderMap: Record<string, string> = {
    'modern-gradient': 'business-modern',
    'minimal-light': 'portfolio-minimal',
    'dark-elegant': 'portfolio-creative',
    'warm-sunset': 'agency-modern',
    'ocean-breeze': 'saas-modern',
    'forest-green': 'restaurant-elegant',
    'startup-landing': 'landing-startup', // Eklendi
  };
  // Öncelik: theme.folder > themeFolderMap > theme.id
  const folder = theme.folder || themeFolderMap[theme.id] || theme.id;
  const previewImg = `/templates/${folder}/${locale}/preview.png`;
  const previewHtml = `/templates/${folder}/${locale}/preview.html`;
  const fallbackSvg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='16' fill='url(%23g)'/%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='64' y2='64' gradientUnits='userSpaceOnUse'%3E%3Cstop stop-color='%236C63FF'/%3E%3Cstop offset='1' stop-color='%23FF6CAB'/%3E%3C/linearGradient%3E%3C/defs%3E%3C/svg%3E";
  const [imgError, setImgError] = React.useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className={`group relative rounded-2xl border-2 transition-all duration-300 text-left overflow-hidden transform hover:scale-105 hover:-translate-y-1 ${isSelected ? "border-indigo-500 shadow-2xl shadow-indigo-500/30 scale-105" : "border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 shadow-lg hover:shadow-xl"}`}
    >
      <div className="flex items-center gap-4 p-4">
        <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 relative flex items-center justify-center overflow-hidden">
          {!imgError ? (
            <img
              src={previewImg}
              alt={theme.name}
              className="w-full h-full object-cover rounded-lg absolute inset-0"
              onError={() => setImgError(true)}
            />
          ) : (
            <span className="text-white font-bold text-base z-10 select-none text-center w-full">{theme.name.split(' ')[0]}</span>
          )}
        </div>
        <div>
          <div className="text-xs font-bold text-gray-400 mb-1">TEMA</div>
          <div className="text-lg font-bold text-gray-900 dark:text-white mb-1">{theme.name}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">{theme.description}</div>
        </div>
      </div>
    </button>
  );
}
