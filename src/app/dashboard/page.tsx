"use client";

import { useEffect, useState, useRef } from "react";
import { createBrowserClient } from "@/utils/supabase/client"; // Use client-side Supabase client
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const [session, setSession] = useState<any>(null);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [userProfile, setUserProfile] = useState<any>({
    full_name: "",
    avatar_url: "",
  });
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const supabase = createBrowserClient();

  useEffect(() => {
    // Hızlı session kontrolü
    const loadUserData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setSession(session);
        // Get fresh user metadata
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserProfile({
            full_name: user.user_metadata?.full_name || "",
            avatar_url: user.user_metadata?.avatar_url || "",
          });
        }
      } else {
        router.replace("/login");
      }
    };

    loadUserData();

    // Auth değişikliklerini dinle
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session) {
          setSession(session);
          // Get fresh user metadata
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            setUserProfile({
              full_name: user.user_metadata?.full_name || "",
              avatar_url: user.user_metadata?.avatar_url || "",
            });
          }
        } else {
          router.replace("/login");
        }
      }
    );

    // Listen for profile updates
    const handleProfileUpdate = () => {
      loadUserData();
    };

    window.addEventListener('profile-updated', handleProfileUpdate);

    return () => {
      authListener.subscription.unsubscribe();
      window.removeEventListener('profile-updated', handleProfileUpdate);
    };
  }, [router, supabase]);

  // Dropdown dışına tıklanınca kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowAccountMenu(false);
      }
    };

    if (showAccountMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showAccountMenu]);

  const handleLogout = async () => {
    // 1. Session'ı hemen temizle (UI anında güncellenir)
    setSession(null);
    
    // 2. Hemen login sayfasına yönlendir (bekleme yok)
    router.replace("/login");
    
    // 3. Arka planda Supabase'den çıkış yap (kullanıcı beklemez)
    supabase.auth.signOut().catch((error) => {
      console.error("Çıkış yapılırken hata:", error);
    });
  };

  // Session yoksa hiçbir şey render etme
  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-indigo-200 dark:border-indigo-900 rounded-full"></div>
            <div className="w-20 h-20 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin absolute top-0"></div>
          </div>
          <p className="mt-6 text-lg font-medium text-gray-700 dark:text-gray-300 animate-pulse">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation */}
        <nav className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-lg rounded-2xl px-6 py-4 mb-8 border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <button
              onClick={() => router.push("/")}
              className="flex items-center space-x-3 group cursor-pointer"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                NoCodePage.AI
              </h1>
            </button>
            
            <div className="flex items-center space-x-4">
              {/* Account Dropdown Menu */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowAccountMenu(!showAccountMenu)}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold overflow-hidden">
                    {userProfile.avatar_url && userProfile.avatar_url.startsWith('data:image') ? (
                      <img 
                        src={userProfile.avatar_url} 
                        alt="Avatar" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback to initials if image fails to load
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      userProfile.full_name?.charAt(0)?.toUpperCase() || session.user.email?.charAt(0)?.toUpperCase() || "?"
                    )}
                  </div>
                  <span className="hidden sm:block text-sm text-gray-700 dark:text-gray-300 max-w-[150px] truncate">
                    {userProfile.full_name || session.user.email}
                  </span>
                  <svg
                    className={`w-4 h-4 text-gray-600 dark:text-gray-300 transition-transform duration-200 ${
                      showAccountMenu ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {showAccountMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 py-2 z-50">
                    {/* User Info Section */}
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-semibold text-gray-800 dark:text-white">
                        {userProfile.full_name || "Hesabım"}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{session.user.email}</p>
                    </div>

                    {/* Menu Items */}
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setShowAccountMenu(false);
                          router.push("/settings/profile");
                        }}
                        className="w-full flex items-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                      >
                        <svg className="w-5 h-5 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Profil Bilgileri
                      </button>

                      <button
                        onClick={() => {
                          setShowAccountMenu(false);
                          router.push("/settings/security");
                        }}
                        className="w-full flex items-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                      >
                        <svg className="w-5 h-5 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Güvenlik Ayarları
                      </button>

                      <button
                        onClick={() => {
                          setShowAccountMenu(false);
                          router.push("/settings/billing");
                        }}
                        className="w-full flex items-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                      >
                        <svg className="w-5 h-5 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        Ödeme Yöntemleri
                      </button>

                      <button
                        onClick={() => {
                          setShowAccountMenu(false);
                          router.push("/settings/notifications");
                        }}
                        className="w-full flex items-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                      >
                        <svg className="w-5 h-5 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        Bildirimler
                      </button>
                    </div>

                    {/* Logout Section */}
                    <div className="border-t border-gray-200 dark:border-gray-700 py-1">
                      <button
                        onClick={() => {
                          setShowAccountMenu(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
                      >
                        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Çıkış Yap
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Welcome Section */}
        <div className="mb-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-xl">
          <h2 className="text-3xl font-bold mb-2">Hoş Geldiniz! 👋</h2>
          <p className="text-indigo-100 text-lg">
            AI destekli web sitesi oluşturucuya hoş geldiniz. Hemen yeni bir proje oluşturmaya başlayın.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Web Sites Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all duration-200 border border-gray-200 dark:border-gray-700 group">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-gray-800 dark:text-white">Web Sitelerim</h2>
              </div>
              <span className="bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 text-xs font-bold px-3 py-1 rounded-full">0 Site</span>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
              Henüz bir web sitesi oluşturmadınız. Hemen yeni bir site oluşturmaya başlayın!
            </p>
            <button 
              onClick={() => router.push("/")}
              className="mt-4 w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-4 rounded-lg hover:shadow-lg hover:scale-[1.02] transition-all duration-200 flex items-center justify-center font-medium group"
            >
              <svg className="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Yeni Site Oluştur
            </button>
          </div>

          {/* Analytics Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all duration-200 border border-gray-200 dark:border-gray-700 group">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-gray-800 dark:text-white">Analitikler</h2>
              </div>
              <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs font-bold px-3 py-1 rounded-full">Aktif</span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">Toplam Ziyaret</span>
                <span className="text-lg font-bold text-gray-800 dark:text-gray-200">0</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">Sayfa Görüntüleme</span>
                <span className="text-lg font-bold text-gray-800 dark:text-gray-200">0</span>
              </div>
            </div>
          </div>

          {/* AI Credits Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all duration-200 border border-gray-200 dark:border-gray-700 group">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-gray-800 dark:text-white">AI Kredileri</h2>
              </div>
              <span className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs font-bold px-3 py-1 rounded-full">Ücretsiz</span>
            </div>
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">Kalan Kredi</span>
                <span className="text-lg font-bold text-gray-800 dark:text-gray-200">100/100</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 h-3 rounded-full transition-all duration-500" style={{ width: '100%' }}></div>
              </div>
            </div>
            <button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-lg hover:shadow-lg hover:scale-[1.02] transition-all duration-200 font-medium">
              Kredi Satın Al
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
