"use client";

import { useState, useEffect } from "react";
import { useLocale } from "next-intl";

interface PublishSettingsProps {
  websiteId: string;
  websiteName: string;
  onPublishChange?: (isPublished: boolean) => void;
}

interface DomainStatus {
  verified: boolean;
  cnameValid: boolean;
  txtValid: boolean;
}

export default function PublishSettings({ websiteId, websiteName, onPublishChange }: PublishSettingsProps) {
  const locale = useLocale();
  const [isPublished, setIsPublished] = useState(false);
  const [subdomain, setSubdomain] = useState("");
  const [customDomain, setCustomDomain] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [domainStatus, setDomainStatus] = useState<DomainStatus | null>(null);
  const [dnsInstructions, setDnsInstructions] = useState<{
    type: string;
    name: string;
    value: string;
    txtRecord: { name: string; value: string };
  } | null>(null);

  useEffect(() => {
    loadDomainSettings();
  }, [websiteId]);

  const loadDomainSettings = async () => {
    try {
      const response = await fetch(`/api/websites/domain?websiteId=${websiteId}`);
      if (response.ok) {
        const data = await response.json();
        setSubdomain(data.website?.subdomain || "");
        setCustomDomain(data.website?.custom_domain || "");
        setIsPublished(data.website?.is_published || false);
        if (data.domainStatus) {
          setDomainStatus({
            verified: data.domainStatus.verification_status === 'verified',
            cnameValid: data.domainStatus.dns_configured,
            txtValid: data.domainStatus.verification_status === 'verified',
          });
        }
      }
    } catch (err) {
      console.error("Failed to load domain settings:", err);
    }
  };

  const handlePublish = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/websites/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          websiteId,
          subdomain: subdomain || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.suggestion) {
          setSubdomain(data.suggestion);
          throw new Error(`${data.error}. Try: ${data.suggestion}`);
        }
        throw new Error(data.error);
      }

      setSubdomain(data.subdomain);
      setIsPublished(true);
      setSuccess(locale === 'tr' 
        ? `Siteniz yayınlandı! ${data.url}` 
        : `Your site is live! ${data.url}`
      );
      onPublishChange?.(true);

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnpublish = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/websites/publish?websiteId=${websiteId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      setIsPublished(false);
      setSuccess(locale === 'tr' ? 'Site yayından kaldırıldı' : 'Site unpublished');
      onPublishChange?.(false);

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unpublish");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCustomDomain = async () => {
    if (!customDomain) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/websites/domain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          websiteId,
          domain: customDomain,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.upgrade) {
          throw new Error(locale === 'tr' 
            ? 'Custom domain için Pro veya üzeri plan gerekli' 
            : 'Custom domains require Pro or higher plan'
          );
        }
        throw new Error(data.error);
      }

      setDnsInstructions(data.dnsInstructions);
      setSuccess(locale === 'tr' 
        ? 'Domain eklendi. DNS ayarlarını yapılandırın.' 
        : 'Domain added. Configure your DNS settings.'
      );

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add domain");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyDomain = async () => {
    setIsVerifying(true);
    setError(null);

    try {
      const response = await fetch("/api/websites/domain", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ websiteId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      setDomainStatus(data.checks);
      
      if (data.verified) {
        setSuccess(locale === 'tr' ? 'Domain doğrulandı!' : 'Domain verified!');
        setDnsInstructions(null);
      } else {
        setError(locale === 'tr' 
          ? 'DNS kayıtları henüz yayılmadı. Birkaç dakika bekleyip tekrar deneyin.'
          : 'DNS records not propagated yet. Wait a few minutes and try again.'
        );
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRemoveDomain = async () => {
    if (!confirm(locale === 'tr' ? 'Domain bağlantısını kaldırmak istediğinize emin misiniz?' : 'Are you sure you want to remove this domain?')) {
      return;
    }

    setIsLoading(true);
    try {
      await fetch(`/api/websites/domain?websiteId=${websiteId}`, {
        method: "DELETE",
      });
      setCustomDomain("");
      setDnsInstructions(null);
      setDomainStatus(null);
      setSuccess(locale === 'tr' ? 'Domain kaldırıldı' : 'Domain removed');
    } catch {
      setError("Failed to remove domain");
    } finally {
      setIsLoading(false);
    }
  };

  const generateSubdomain = () => {
    const slug = websiteName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 30);
    setSubdomain(slug || `site-${Date.now().toString(36)}`);
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
        {locale === 'tr' ? 'Yayınlama Ayarları' : 'Publishing Settings'}
      </h3>

      {/* Status Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-emerald-500/20 border border-emerald-500/50 rounded-lg text-emerald-400 text-sm">
          {success}
        </div>
      )}

      {/* Subdomain Section */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-300 mb-2">
          {locale === 'tr' ? 'Subdomain (Ücretsiz)' : 'Subdomain (Free)'}
        </label>
        <div className="flex gap-2">
          <div className="flex-1 flex">
            <input
              type="text"
              value={subdomain}
              onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              placeholder="my-site"
              className="flex-1 px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-l-lg text-white placeholder-slate-400 focus:outline-none focus:border-violet-500"
              disabled={isPublished}
            />
            <span className="px-3 py-2 bg-slate-700 border border-l-0 border-slate-600 rounded-r-lg text-slate-400 text-sm">
              .nocodepage.app
            </span>
          </div>
          {!subdomain && (
            <button
              onClick={generateSubdomain}
              className="px-3 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors text-sm"
            >
              {locale === 'tr' ? 'Oluştur' : 'Generate'}
            </button>
          )}
        </div>
        
        {isPublished && subdomain && (
          <a
            href={`https://${subdomain}.nocodepage.app`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-sm text-violet-400 hover:text-violet-300"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            https://{subdomain}.nocodepage.app
          </a>
        )}
      </div>

      {/* Publish Button */}
      <div className="mb-6">
        {isPublished ? (
          <div className="flex gap-2">
            <button
              onClick={handlePublish}
              disabled={isLoading}
              className="flex-1 py-2 px-4 bg-violet-500/20 text-violet-400 border border-violet-500/50 rounded-lg hover:bg-violet-500/30 transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {locale === 'tr' ? 'Güncelleniyor...' : 'Updating...'}
                </span>
              ) : (
                locale === 'tr' ? '🔄 Güncelle' : '🔄 Update'
              )}
            </button>
            <button
              onClick={handleUnpublish}
              disabled={isLoading}
              className="py-2 px-4 bg-red-500/20 text-red-400 border border-red-500/50 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50"
            >
              {locale === 'tr' ? 'Yayından Kaldır' : 'Unpublish'}
            </button>
          </div>
        ) : (
          <button
            onClick={handlePublish}
            disabled={isLoading || !subdomain}
            className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold rounded-lg hover:from-emerald-400 hover:to-green-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {locale === 'tr' ? 'Yayınlanıyor...' : 'Publishing...'}
              </span>
            ) : (
              locale === 'tr' ? '🚀 Siteyi Yayınla' : '🚀 Publish Site'
            )}
          </button>
        )}
      </div>

      {/* Custom Domain Section */}
      <div className="pt-6 border-t border-slate-700/50">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-slate-300">
            {locale === 'tr' ? 'Custom Domain' : 'Custom Domain'}
          </label>
          <span className="text-xs text-violet-400 bg-violet-500/20 px-2 py-0.5 rounded">
            Pro+
          </span>
        </div>

        {!customDomain || !dnsInstructions ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={customDomain}
              onChange={(e) => setCustomDomain(e.target.value.toLowerCase())}
              placeholder="www.example.com"
              className="flex-1 px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-violet-500"
            />
            <button
              onClick={handleAddCustomDomain}
              disabled={isLoading || !customDomain}
              className="px-4 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-400 transition-colors disabled:opacity-50"
            >
              {locale === 'tr' ? 'Ekle' : 'Add'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Domain Status */}
            <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
              <span className="text-white font-medium">{customDomain}</span>
              <div className="flex items-center gap-2">
                {domainStatus?.verified ? (
                  <span className="flex items-center gap-1 text-emerald-400 text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    {locale === 'tr' ? 'Doğrulandı' : 'Verified'}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-amber-400 text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {locale === 'tr' ? 'Bekliyor' : 'Pending'}
                  </span>
                )}
                <button
                  onClick={handleRemoveDomain}
                  className="p-1 text-red-400 hover:text-red-300"
                  title={locale === 'tr' ? 'Kaldır' : 'Remove'}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* DNS Instructions */}
            {dnsInstructions && !domainStatus?.verified && (
              <div className="p-4 bg-slate-700/30 rounded-lg space-y-3">
                <p className="text-sm text-slate-300">
                  {locale === 'tr' 
                    ? 'Domain sağlayıcınızda aşağıdaki DNS kayıtlarını ekleyin:'
                    : 'Add the following DNS records at your domain provider:'
                  }
                </p>

                {/* CNAME Record */}
                <div className="p-3 bg-slate-800/50 rounded border border-slate-600">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-mono bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">CNAME</span>
                    {domainStatus?.cnameValid && (
                      <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-slate-400">Name:</span>
                      <code className="ml-2 text-white">{dnsInstructions.name}</code>
                    </div>
                    <div>
                      <span className="text-slate-400">Value:</span>
                      <code className="ml-2 text-white">{dnsInstructions.value}</code>
                    </div>
                  </div>
                </div>

                {/* TXT Record */}
                <div className="p-3 bg-slate-800/50 rounded border border-slate-600">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-mono bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded">TXT</span>
                    {domainStatus?.txtValid && (
                      <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-slate-400">Name:</span>
                      <code className="ml-2 text-white">{dnsInstructions.txtRecord.name}</code>
                    </div>
                    <div>
                      <span className="text-slate-400">Value:</span>
                      <code className="ml-2 text-white text-xs break-all">{dnsInstructions.txtRecord.value}</code>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleVerifyDomain}
                  disabled={isVerifying}
                  className="w-full py-2 px-4 bg-violet-500/20 text-violet-400 border border-violet-500/50 rounded-lg hover:bg-violet-500/30 transition-colors disabled:opacity-50"
                >
                  {isVerifying ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      {locale === 'tr' ? 'Doğrulanıyor...' : 'Verifying...'}
                    </span>
                  ) : (
                    locale === 'tr' ? 'DNS Doğrula' : 'Verify DNS'
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
