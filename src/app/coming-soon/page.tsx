// src/app/coming-soon/page.tsx
// このファイルを新規作成してください
'use client';

import { useEffect, useState } from 'react';

export default function ComingSoonPage() {
  const [pageType, setPageType] = useState<string>('');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    // URLパラメータから種類を取得
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type');
    setPageType(type || '');

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const getTitle = () => {
    switch (pageType) {
      case 'combo':
        return 'コンボ';
      case 'customize':
        return 'カスタマイズ';
      default:
        return 'ページ';
    }
  };

  const getIcon = () => {
    switch (pageType) {
      case 'combo':
        return '⚡';
      case 'customize':
        return '⚙️';
      default:
        return '🚧';
    }
  };

  const getDescription = () => {
    switch (pageType) {
      case 'combo':
        return 'キャラクター別のコンボレシピを掲載予定です。各キャラクターの基本コンボから高難度コンボまで、詳しく解説します。';
      case 'customize':
        return 'キャラクターのカスタマイズ情報を掲載予定です。おすすめの設定や見た目のカスタマイズ方法などを紹介します。';
      default:
        return 'このページは現在準備中です。もうしばらくお待ちください。';
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: `
        linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.5)),
        url('/backgrounds/background.jpg')
      `,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      backgroundRepeat: 'no-repeat',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px'
    }}>
      {/* パターンオーバーレイ */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23991b1b' fill-opacity='0.02'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        pointerEvents: 'none'
      }} />

      <div style={{
        position: 'relative',
        zIndex: 1,
        maxWidth: '800px',
        width: '100%'
      }}>
        {/* メインコンテンツ */}
        <div style={{
          position: 'relative'
        }}>
          <div style={{
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            background: 'linear-gradient(135deg, #dc2626, #991b1b)',
            padding: '3px',
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.8)'
          }}>
            <div style={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, rgba(0,0,0,0.95), rgba(127, 29, 29, 0.15))',
              borderRadius: '10px'
            }} />
          </div>

          <div style={{
            position: 'relative',
            padding: isMobile ? '40px 30px' : '60px 50px',
            textAlign: 'center'
          }}>
            {/* アイコン */}
            <div style={{
              fontSize: isMobile ? '80px' : '120px',
              marginBottom: '30px',
              animation: 'pulse 2s infinite'
            }}>
              {getIcon()}
            </div>

            {/* タイトル */}
            <h1 style={{
              fontSize: isMobile ? '32px' : '48px',
              fontWeight: 'bold',
              color: '#fef2f2',
              marginBottom: '20px',
              letterSpacing: '2px',
              textShadow: '2px 2px 8px rgba(0,0,0,0.8)'
            }}>
              {getTitle()}
            </h1>

            {/* サブタイトル */}
            <div style={{
              fontSize: isMobile ? '20px' : '28px',
              color: '#fca5a5',
              fontWeight: '600',
              marginBottom: '30px',
              letterSpacing: '1px'
            }}>
              COMING SOON
            </div>

            {/* 説明文 */}
            <p style={{
              fontSize: isMobile ? '14px' : '16px',
              color: '#d1d5db',
              lineHeight: '1.8',
              marginBottom: '40px',
              maxWidth: '600px',
              margin: '0 auto 40px'
            }}>
              {getDescription()}
            </p>

            {/* ボタン */}
            <div style={{
              display: 'flex',
              gap: '15px',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <a
                href="/"
                style={{
                  padding: isMobile ? '12px 30px' : '15px 40px',
                  fontSize: isMobile ? '14px' : '16px',
                  fontWeight: 'bold',
                  background: 'linear-gradient(135deg, #dc2626, #991b1b)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#ffffff',
                  textDecoration: 'none',
                  display: 'inline-block',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
                  transition: 'all 0.2s',
                  letterSpacing: '1px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 15px rgba(0,0,0,0.6)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.5)';
                }}
              >
                トップページへ
              </a>

              <a
                href="/memo/list"
                style={{
                  padding: isMobile ? '12px 30px' : '15px 40px',
                  fontSize: isMobile ? '14px' : '16px',
                  fontWeight: 'bold',
                  background: 'rgba(107, 114, 128, 0.3)',
                  border: '2px solid rgba(107, 114, 128, 0.5)',
                  borderRadius: '8px',
                  color: '#ffffff',
                  textDecoration: 'none',
                  display: 'inline-block',
                  transition: 'all 0.2s',
                  letterSpacing: '1px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(107, 114, 128, 0.5)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(107, 114, 128, 0.3)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                📝 対策メモを見る
              </a>
            </div>

            {/* 追加情報 */}
            <div style={{
              marginTop: '50px',
              paddingTop: '30px',
              borderTop: '1px solid rgba(185, 28, 28, 0.3)'
            }}>
              <div style={{
                fontSize: '13px',
                color: '#6b7280',
                lineHeight: '1.6'
              }}>
                このページは現在開発中です。<br />
                更新情報はトップページのNEWSでお知らせします。
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.05);
          }
        }
      `}</style>
    </div>
  );
}