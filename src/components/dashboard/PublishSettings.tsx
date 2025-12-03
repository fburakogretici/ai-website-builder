"use client";

import { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import { toast } from "sonner";
import { useConfirm } from "@/components/ConfirmProvider";

interface PublishSettingsProps {
  websiteId: string;
  websiteName: string;
  onPublishChange?: (isPublished: boolean) => void;
  onClose?: () => void;
  onPublishSuccess?: () => void;
}

interface DomainStatus {
  verified: boolean;
  cnameValid: boolean;
  txtValid: boolean;
}

export default function PublishSettings({
  websiteId,
  websiteName,
  onPublishChange,
  onClose,
  onPublishSuccess
}: PublishSettingsProps) {
  const locale = useLocale();
  const { confirm } = useConfirm();
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
      const response = await fetch(`/api/websites/domain?websiteId=${websiteId}`, {
        credentials: 'include',
      });
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
        credentials: 'include',
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
      onPublishSuccess?.();

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
        credentials: 'include',
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
        credentials: 'include',
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
        credentials: 'include',
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
    const confirmed = await confirm({
      title: locale === 'tr' ? 'Domain Kaldır' : 'Remove Domain',
      message: locale === 'tr'
        ? 'Domain bağlantısını kaldırmak istediğinize emin misiniz?'
        : 'Are you sure you want to remove this domain?',
      confirmText: locale === 'tr' ? 'Kaldır' : 'Remove',
      cancelText: locale === 'tr' ? 'İptal' : 'Cancel',
      variant: 'warning'
    });

    if (!confirmed) return;

    setIsLoading(true);
    try {
      await fetch(`/api/websites/domain?websiteId=${websiteId}`, {
        method: "DELETE",
        credentials: 'include',
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
    <div className="bg-[#1e293b] border border-slate-700 shadow-2xl rounded-2xl overflow-hidden w-full max-w-lg mx-auto transform transition-all">
      {/* Header */}
      <div className="bg-slate-900/50 px-6 py-4 border-b border-slate-700/50 flex items-center justify-between">
        <h3 className="text-lg font-bold text-white flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
          </div>
          {locale === 'tr' ? 'Yayınlama Ayarları' : 'Publishing Settings'}
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white hover:bg-slate-800 p-2 rounded-lg transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="p-6 space-y-8">
        {/* Status Messages */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400 text-sm animate-fadeIn">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}
        {success && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-3 text-emerald-400 text-sm animate-fadeIn">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {success}
          </div>
        )}

        {/* Subdomain Section */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-slate-300">
            {locale === 'tr' ? 'Subdomain (Ücretsiz)' : 'Subdomain (Free)'}
          </label>
          <div className="relative group">
            <div className="flex shadow-sm rounded-xl overflow-hidden ring-1 ring-slate-700 group-focus-within:ring-2 group-focus-within:ring-violet-500 transition-all">
              <input
                type="text"
                value={subdomain}
                onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="my-site"
                className="flex-1 px-4 py-3 bg-slate-800/50 text-white placeholder-slate-500 focus:outline-none min-w-0"
                disabled={isPublished}
              />
              <div className="px-4 py-3 bg-slate-800 border-l border-slate-700 text-slate-400 text-sm font-medium flex items-center select-none">
                .nocodepage.app
              </div>
            </div>
            {!subdomain && (
              <button
                onClick={generateSubdomain}
                className="absolute right-[140px] top-1/2 -translate-y-1/2 px-2 py-1 text-xs font-medium text-violet-400 hover:text-violet-300 bg-violet-500/10 hover:bg-violet-500/20 rounded transition-colors"
              >
                {locale === 'tr' ? 'Otomatik Oluştur' : 'Auto Generate'}
              </button>
            )}
          </div>

          {isPublished && subdomain && (
            <a
              href={`https://${subdomain}.nocodepage.app`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors p-2 rounded-lg hover:bg-emerald-500/10"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              https://{subdomain}.nocodepage.app
            </a>
          )}
        </div>

        {/* Publish Button */}
        <div>
          {isPublished ? (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handlePublish}
                disabled={isLoading}
                className="flex items-center justify-center gap-2 py-3 px-4 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-violet-500/20"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    {locale === 'tr' ? 'Güncelleniyor...' : 'Updating...'}
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {locale === 'tr' ? 'Güncelle' : 'Update Site'}
                  </>
                )}
              </button>
              <button
                onClick={handleUnpublish}
                disabled={isLoading}
                className="flex items-center justify-center gap-2 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium rounded-xl border border-slate-700 transition-all disabled:opacity-50"
              >
                {locale === 'tr' ? 'Yayından Kaldır' : 'Unpublish'}
              </button>
            </div>
          ) : (
            <button
              onClick={handlePublish}
              disabled={isLoading || !subdomain}
              className="w-full py-4 px-6 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-lg rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-6 h-6" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {locale === 'tr' ? 'Yayınlanıyor...' : 'Publishing...'}
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {locale === 'tr' ? 'Siteyi Yayınla' : 'Publish Live Site'}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Custom Domain Section */}
        <div className="pt-6 border-t border-slate-700/50">
          <div className="bg-slate-800/30 rounded-xl p-5 border border-slate-700/50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-violet-500/10 rounded-lg">
                  <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                </div>
                <label className="text-sm font-semibold text-white">
                  {locale === 'tr' ? 'Custom Domain' : 'Custom Domain'}
                </label>
              </div>
              <span className="text-[10px] font-bold tracking-wider text-violet-300 bg-violet-500/20 px-2.5 py-1 rounded-full border border-violet-500/20 uppercase">
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
                  className="flex-1 px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                />
                <button
                  onClick={handleAddCustomDomain}
                  disabled={isLoading || !customDomain}
                  className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-xl transition-colors disabled:opacity-50 shadow-lg shadow-violet-500/20"
                >
                  {locale === 'tr' ? 'Ekle' : 'Add'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Domain Status */}
                <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
                  <span className="text-white font-medium">{customDomain}</span>
                  <div className="flex items-center gap-3">
                    {domainStatus?.verified ? (
                      <span className="flex items-center gap-1.5 text-emerald-400 text-sm font-medium bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        {locale === 'tr' ? 'Doğrulandı' : 'Verified'}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-amber-400 text-sm font-medium bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {locale === 'tr' ? 'Bekliyor' : 'Pending'}
                      </span>
                    )}
                    <button
                      onClick={handleRemoveDomain}
                      className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      title={locale === 'tr' ? 'Kaldır' : 'Remove'}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* DNS Instructions */}
                {dnsInstructions && !domainStatus?.verified && (
                  <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700/50 space-y-4">
                    <p className="text-sm text-slate-400">
                      {locale === 'tr'
                        ? 'Domain sağlayıcınızda aşağıdaki DNS kayıtlarını ekleyin:'
                        : 'Add the following DNS records at your domain provider:'
                      }
                    </p>

                    {/* CNAME Record */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold font-mono bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20">CNAME</span>
                        {domainStatus?.cnameValid && (
                          <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-slate-800 p-2.5 rounded-lg border border-slate-700">
                          <div className="text-xs text-slate-500 mb-1">Name</div>
                          <code className="text-sm text-white font-mono">{dnsInstructions.name}</code>
                        </div>
                        <div className="bg-slate-800 p-2.5 rounded-lg border border-slate-700">
                          <div className="text-xs text-slate-500 mb-1">Value</div>
                          <code className="text-sm text-white font-mono">{dnsInstructions.value}</code>
                        </div>
                      </div>
                    </div>

                    {/* TXT Record */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold font-mono bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded border border-purple-500/20">TXT</span>
                        {domainStatus?.txtValid && (
                          <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        <div className="bg-slate-800 p-2.5 rounded-lg border border-slate-700">
                          <div className="text-xs text-slate-500 mb-1">Name</div>
                          <code className="text-sm text-white font-mono">{dnsInstructions.txtRecord.name}</code>
                        </div>
                        <div className="bg-slate-800 p-2.5 rounded-lg border border-slate-700">
                          <div className="text-xs text-slate-500 mb-1">Value</div>
                          <code className="text-xs text-white font-mono break-all">{dnsInstructions.txtRecord.value}</code>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleVerifyDomain}
                      disabled={isVerifying}
                      className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 hover:border-slate-500 rounded-xl transition-all disabled:opacity-50 text-sm font-medium"
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
                        locale === 'tr' ? 'DNS Doğrula' : 'Verify DNS Records'
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
