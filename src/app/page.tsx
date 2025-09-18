// src/app/page.tsx (鉄拳スタイル キャラクター選択画面 + NEWS)
'use client';

import { useEffect, useState } from 'react';
import { client } from '@/lib/client';
import type { Character } from '@/types';

// ニュース型定義
interface NewsItem {
  date: string;
  tag: string;
  content: string;
}

export default function Home() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredCharacter, setHoveredCharacter] = useState<string | null>(null);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);

  useEffect(() => {
    fetchCharacters();
    loadNews();
  }, []);

  const fetchCharacters = async () => {
    try {
      const { data } = await client.models.Character.list({ 
        authMode: 'apiKey' 
      });
      console.log('取得したキャラクターデータ:', data);
      
      // nullを除外してフィルタリング
      const validCharacters = (data || []).filter(character => character !== null);
      
      // character_idでソート
      const sortedCharacters = validCharacters.sort((a, b) => {
        const idA = String(a.character_id).padStart(3, '0');
        const idB = String(b.character_id).padStart(3, '0');
        return idA.localeCompare(idB);
      });
      
      setCharacters(sortedCharacters);
    } catch (error) {
      console.error('Error fetching characters:', error);
    } finally {
      setLoading(false);
    }
  };

  // ニュースをローカルストレージから読み込み
  const loadNews = () => {
    const savedNews = localStorage.getItem('tekkenNews');
    if (savedNews) {
      setNewsItems(JSON.parse(savedNews));
    } else {
      // デフォルトニュース
      const defaultNews: NewsItem[] = [
        { date: '2024.06.09', tag: '新着', content: '風間仁 のコマンドリストを追加' },
        { date: '2024.07.15', tag: '新着', content: 'アリサ・ボスコノビッチ のコマンドリストを追加' },
        { date: '2024.10.01', tag: '新着', content: '新キャラクター 三島平八 参戦!' },
        { date: '2024.12.17', tag: '新着', content: '新キャラクター クライヴ・ロズフィールド 参戦' },
        { date: '2025.04.15', tag: '新着', content: '鉄拳8 SEASON2開幕！' },
      ];
      setNewsItems(defaultNews);
      localStorage.setItem('tekkenNews', JSON.stringify(defaultNews));
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: `
        radial-gradient(circle at 20% 50%, rgba(127, 29, 29, 0.3), transparent 50%),
        radial-gradient(circle at 80% 80%, rgba(185, 28, 28, 0.2), transparent 50%),
        radial-gradient(circle at 40% 20%, rgba(220, 38, 38, 0.1), transparent 50%),
        linear-gradient(135deg, #000000 0%, #1a0505 50%, #000000 100%)
      `,
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* 背景のパーティクル効果 */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23991b1b' fill-opacity='0.02'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        pointerEvents: 'none'
      }} />

      {/* メインコンテナ */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        padding: '40px 20px',
        maxWidth: '1600px',
        margin: '0 auto'
      }}>
        {/* タイトルセクション */}
        <div style={{
          textAlign: 'center',
          marginBottom: '50px'
        }}>
          <div style={{
            display: 'inline-block',
            position: 'relative'
          }}>
            {/* タイトル背景 */}
            <div style={{
              position: 'absolute',
              top: '-10px',
              left: '-40px',
              right: '-40px',
              bottom: '-10px',
              border: '3px solid rgba(185, 28, 28, 0.6)',
              background: 'linear-gradient(135deg, rgba(0,0,0,0.95), rgba(127, 29, 29, 0.2))',
              transform: 'skew(-10deg)',
              borderRadius: '4px'
            }} />
            
            <h1 style={{
              position: 'relative',
              fontSize: '48px',
              fontWeight: 'bold',
              color: '#ffffff',
              letterSpacing: '8px',
              textTransform: 'uppercase',
              textShadow: '3px 3px 6px rgba(0,0,0,0.9)',
              padding: '20px 60px'
            }}>
              CHARACTER
            </h1>
          </div>
        </div>

        {/* NEWSセクション */}
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto 60px',
          padding: '0 20px'
        }}>
          {/* NEWSタイトル */}
          <div style={{
            textAlign: 'center',
            marginBottom: '30px'
          }}>
            <div style={{
              display: 'inline-block',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: '-5px',
                left: '-30px',
                right: '-30px',
                bottom: '-5px',
                border: '2px solid rgba(185, 28, 28, 0.5)',
                background: 'linear-gradient(135deg, rgba(0,0,0,0.95), rgba(127, 29, 29, 0.15))',
                borderRadius: '2px'
              }} />
              
              <h2 style={{
                position: 'relative',
                fontSize: '32px',
                fontWeight: 'bold',
                color: '#ffffff',
                letterSpacing: '4px',
                textTransform: 'uppercase',
                textShadow: '2px 2px 4px rgba(0,0,0,0.9)',
                padding: '10px 40px'
              }}>
                NEWS
              </h2>
            </div>
          </div>

          {/* NEWSリスト */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.85)',
            border: '2px solid rgba(185, 28, 28, 0.3)',
            borderRadius: '4px',
            padding: '20px 30px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.8)'
          }}>
            {newsItems.map((news, index) => (
              <div 
                key={index}
                style={{
                  padding: '15px 0',
                  borderBottom: index < newsItems.length - 1 ? '1px solid rgba(185, 28, 28, 0.2)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '20px',
                  transition: 'all 0.2s',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(185, 28, 28, 0.1)';
                  e.currentTarget.style.paddingLeft = '10px';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.paddingLeft = '0';
                }}
              >
                {/* 日付 */}
                <div style={{
                  fontSize: '16px',
                  color: '#9ca3af',
                  minWidth: '110px',
                  fontFamily: 'monospace',
                  letterSpacing: '1px'
                }}>
                  {news.date}
                </div>
                
                {/* タグ */}
                <div style={{
                  background: 'linear-gradient(135deg, #dc2626, #991b1b)',
                  color: '#ffffff',
                  padding: '2px 10px',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  borderRadius: '2px',
                  minWidth: '50px',
                  textAlign: 'center',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                }}>
                  {news.tag}
                </div>
                
                {/* コンテンツ */}
                <div style={{
                  fontSize: '16px',
                  color: '#e5e7eb',
                  flex: 1,
                  letterSpacing: '0.5px'
                }}>
                  {news.content}
                </div>
              </div>
            ))}
          </div>

          {/* 編集ボタン */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '15px'
          }}>
            {/* キャラクター編集ボタン */}
            <a 
              href="/character/create"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(0, 0, 0, 0.8)',
                color: '#6b7280',
                padding: '8px 16px',
                borderRadius: '4px',
                border: '1px solid rgba(185, 28, 28, 0.2)',
                textDecoration: 'none',
                fontSize: '13px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.3)';
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.8)';
                e.currentTarget.style.color = '#6b7280';
                e.currentTarget.style.borderColor = 'rgba(185, 28, 28, 0.2)';
              }}
            >
              🎮 キャラクター編集
            </a>

            {/* ニュース編集ボタン */}
            <a 
              href="/news-editor"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(0, 0, 0, 0.8)',
                color: '#6b7280',
                padding: '8px 16px',
                borderRadius: '4px',
                border: '1px solid rgba(185, 28, 28, 0.2)',
                textDecoration: 'none',
                fontSize: '13px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(127, 29, 29, 0.5)';
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.borderColor = 'rgba(185, 28, 28, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.8)';
                e.currentTarget.style.color = '#6b7280';
                e.currentTarget.style.borderColor = 'rgba(185, 28, 28, 0.2)';
              }}
            >
              ✏️ ニュースを編集
            </a>
          </div>
        </div>

        {/* キャラクターセクションヘッダー */}
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto 20px',
          padding: '0 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#fca5a5',
            letterSpacing: '2px',
            textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
          }}>
            キャラクター一覧
          </h2>
          
          <a 
            href="/character/create"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              color: '#ffffff',
              padding: '10px 20px',
              borderRadius: '6px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: 'bold',
              boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
              transition: 'all 0.2s'
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
            🎮 キャラクター技表を編集
          </a>
        </div>

        {/* キャラクターグリッド */}
        {loading ? (
          <div style={{
            textAlign: 'center',
            fontSize: '24px',
            color: '#fca5a5',
            marginTop: '100px'
          }}>
            Loading...
          </div>
        ) : characters.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, 320px)',
            gap: '20px',
            padding: '0 20px',
            justifyContent: 'center',
            maxWidth: '1400px',
            margin: '0 auto'
          }}>
            {characters.map((character, index) => (
              <a
                key={character.id}
                href={`/character/${character.character_id}`}
                onMouseEnter={() => setHoveredCharacter(character.id)}
                onMouseLeave={() => setHoveredCharacter(null)}
                style={{
                  position: 'relative',
                  display: 'block',
                  textDecoration: 'none',
                  transform: hoveredCharacter === character.id ? 'scale(1.05) translateY(-5px)' : 'scale(1)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer',
                  height: '100px', // 高さを固定
                  width: '100%'
                }}
              >
                {/* ボタン背景 */}
                <div style={{
                  position: 'relative',
                  background: hoveredCharacter === character.id 
                    ? 'linear-gradient(135deg, rgba(220, 38, 38, 0.7), rgba(127, 29, 29, 0.7))'
                    : 'linear-gradient(135deg, rgba(0, 0, 0, 0.95), rgba(127, 29, 29, 0.2))',
                  border: '2px solid',
                  borderColor: hoveredCharacter === character.id 
                    ? 'rgba(248, 113, 113, 0.6)' 
                    : 'rgba(185, 28, 28, 0.3)',
                  height: '100%', // 高さ100%
                  clipPath: 'polygon(10% 0%, 100% 0%, 90% 100%, 0% 100%)',
                  transition: 'all 0.3s',
                  boxShadow: hoveredCharacter === character.id 
                    ? '0 10px 30px rgba(220, 38, 38, 0.3)'
                    : '0 5px 15px rgba(0, 0, 0, 0.7)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {/* 内部の斜線装飾 */}
                  <div style={{
                    position: 'absolute',
                    top: '0',
                    left: '0',
                    width: '100%',
                    height: '100%',
                    background: `repeating-linear-gradient(
                      45deg,
                      transparent,
                      transparent 10px,
                      rgba(185, 28, 28, 0.03) 10px,
                      rgba(185, 28, 28, 0.03) 11px
                    )`,
                    pointerEvents: 'none'
                  }} />
                  
                  {/* キャラクター情報 */}
                  <div style={{
                    position: 'relative',
                    textAlign: 'center',
                    padding: '0 40px'
                  }}>
                    {/* 日本語名 */}
                    <div style={{
                      fontSize: '20px',
                      fontWeight: 'bold',
                      color: '#ffffff',
                      marginBottom: '6px',
                      textShadow: '2px 2px 4px rgba(0,0,0,0.9)',
                      letterSpacing: '1px',
                      lineHeight: '1.2',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {character.character_name_jp || character.character_name_en}
                    </div>
                    
                    {/* 英語名 */}
                    <div style={{
                      fontSize: '12px',
                      color: 'rgba(252, 165, 165, 0.8)',
                      textTransform: 'capitalize',
                      letterSpacing: '0.5px',
                      lineHeight: '1.2',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {character.character_name_en}
                    </div>
                  </div>
                  
                  {/* ホバー時の光る効果 */}
                  {hoveredCharacter === character.id && (
                    <div style={{
                      position: 'absolute',
                      top: '-2px',
                      left: '-2px',
                      right: '-2px',
                      bottom: '-2px',
                      background: 'linear-gradient(45deg, transparent 30%, rgba(248, 113, 113, 0.3) 50%, transparent 70%)',
                      backgroundSize: '200% 200%',
                      animation: 'shimmer 1s infinite',
                      pointerEvents: 'none'
                    }} />
                  )}
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '100px 20px'
          }}>
            <p style={{
              fontSize: '24px',
              color: '#9ca3af',
              marginBottom: '20px'
            }}>
              キャラクターデータがありません
            </p>
          </div>
        )}

        {/* 管理者リンク（右下固定） */}
        <div style={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          alignItems: 'flex-end'
        }}>
          <a 
            href="/character/create"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(0, 0, 0, 0.9)',
              color: '#6b7280',
              padding: '12px 20px',
              borderRadius: '6px',
              border: '1px solid rgba(185, 28, 28, 0.2)',
              textDecoration: 'none',
              fontSize: '14px',
              transition: 'all 0.2s',
              backdropFilter: 'blur(10px)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(59, 130, 246, 0.5)';
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.9)';
              e.currentTarget.style.color = '#6b7280';
              e.currentTarget.style.borderColor = 'rgba(185, 28, 28, 0.2)';
            }}
          >
            🎮 キャラクター編集
          </a>
          
          <a 
            href="/admin/effects"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(0, 0, 0, 0.9)',
              color: '#6b7280',
              padding: '12px 20px',
              borderRadius: '6px',
              border: '1px solid rgba(185, 28, 28, 0.2)',
              textDecoration: 'none',
              fontSize: '14px',
              transition: 'all 0.2s',
              backdropFilter: 'blur(10px)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(127, 29, 29, 0.6)';
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.borderColor = 'rgba(185, 28, 28, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.9)';
              e.currentTarget.style.color = '#6b7280';
              e.currentTarget.style.borderColor = 'rgba(185, 28, 28, 0.2)';
            }}
          >
            ⚙️ 管理画面
          </a>
        </div>
      </div>

      {/* アニメーションスタイル */}
      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}