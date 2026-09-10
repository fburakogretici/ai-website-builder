"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

export default function BillingPage() {
  const t = useTranslations();
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [loading, setLoading] = useState(false);

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(" ");
    } else {
      return value;
    }
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return v.slice(0, 2) + "/" + v.slice(2, 4);
    }
    return v;
  };

  const handleSaveCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Kart kaydetme işlemi burada yapılacak
    setTimeout(() => {
      setLoading(false);
      toast.success("Kart bilgileri kaydedildi! (Demo)");
    }, 1500);
  };

  const plans = [
    {
      name: "Ücretsiz",
      price: "₺0",
      period: "/ay",
      features: [
        "1 Web Sitesi",
        "100 AI Kredisi",
        "Temel Şablonlar",
        "E-posta Desteği",
      ],
      current: true,
    },
    {
      name: "Pro",
      price: "₺299",
      period: "/ay",
      features: [
        "10 Web Sitesi",
        "1000 AI Kredisi",
        "Premium Şablonlar",
        "Öncelikli Destek",
        "Özel Domain",
        "Analitikler",
      ],
      popular: true,
    },
    {
      name: "Enterprise",
      price: "₺999",
      period: "/ay",
      features: [
        "Sınırsız Web Sitesi",
        "Sınırsız AI Kredisi",
        "Tüm Şablonlar",
        "7/24 Destek",
        "Özel Domain",
        "Gelişmiş Analitikler",
        "API Erişimi",
        "Beyaz Etiket",
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
        <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Mevcut Planınız</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Abonelik ve faturalandırma bilgileri</p>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">Ücretsiz Plan</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">100 AI kredisi kaldı</p>
            </div>
            <button className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg hover:scale-105 transition-all duration-200">
              Yükselt
            </button>
          </div>
        </div>
      </div>

      {/* Pricing Plans */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white">Planları Karşılaştır</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">İhtiyacınıza uygun planı seçin</p>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-xl border-2 p-6 transition-all duration-200 ${plan.popular
                  ? "border-indigo-600 shadow-xl scale-105"
                  : plan.current
                    ? "border-green-500 bg-green-50 dark:bg-green-900/10"
                    : "border-gray-200 dark:border-gray-700 hover:border-indigo-400"
                }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                    EN POPÜLER
                  </span>
                </div>
              )}
              {plan.current && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    MEVCUT PLAN
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">{plan.name}</h3>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">{plan.price}</span>
                  <span className="text-gray-600 dark:text-gray-400">{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start space-x-2">
                    <svg className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-gray-600 dark:text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                disabled={plan.current}
                className={`w-full py-3 rounded-lg font-medium transition-all duration-200 ${plan.current
                    ? "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                    : plan.popular
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg hover:scale-105"
                      : "border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
              >
                {plan.current ? "Aktif Plan" : "Bu Planı Seç"}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Method */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white">Ödeme Yöntemi</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Kredi kartı bilgilerinizi kaydedin</p>
        </div>

        <div className="p-6">
          <form onSubmit={handleSaveCard} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                Kart Numarası
              </label>
              <input
                type="text"
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                placeholder="1234 5678 9012 3456"
                maxLength={19}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                Kart Üzerindeki İsim
              </label>
              <input
                type="text"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                placeholder="AD SOYAD"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  Son Kullanma Tarihi
                </label>
                <input
                  type="text"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(formatExpiryDate(e.target.value))}
                  placeholder="MM/YY"
                  maxLength={5}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  CVV
                </label>
                <input
                  type="text"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="123"
                  maxLength={4}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <span>Bilgileriniz 256-bit SSL ile güvenli şekilde saklanmaktadır</span>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Kaydediliyor..." : "Kartı Kaydet"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
