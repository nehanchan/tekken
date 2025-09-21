'use client';

import { useEffect, useState } from 'react';
import { client } from '@/lib/client';

// キャラクター型定義
interface Character {
  id: string;
  character_id: string;
  character_name_en: string;
  character_name_jp?: string | null;
  display_name?: string | null;
  nickname?: string | null;
  height?: string | null;
  weight?: string | null;
  nationality?: string | null;
  martial_arts?: string | null;
  character_description?: string | null;
}

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
  const [isMobile, setIsMobile] = useState(false);
  const [screenScale, setScreenScale] = useState(1);

  useEffect(() => {
    fetchCharacters();
    loadNews();
    checkScreenSize();
    
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // 画面サイズのチェックとスケール計算
  const checkScreenSize = () => {
    const width = window.innerWidth;
    setIsMobile(width < 768);
    
    // デスクトップでのスケール計算
    if (width >= 1400) {
      setScreenScale(1);
    } else if (width >= 1200) {
      setScreenScale(0.9);
    } else if (width >= 1000) {
      setScreenScale(0.8);
    } else if (width >= 768) {
      setScreenScale(0.7);
    } else {
      // モバイルサイズ
      setScreenScale(1);
    }
  };

  const fetchCharacters = async () => {
    try {
      const { data } = await client.models.Character.list({ 
        authMode: 'apiKey' 
      });
      
      const validCharacters = (data || []).filter(character => character !== null) as Character[];
      
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

  const loadNews = () => {
    const savedNews = localStorage.getItem('tekkenNews');
    if (savedNews) {
      setNewsItems(JSON.parse(savedNews));
    } else {
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

  const getDisplayName = (character: Character): string => {
    if (character.display_name) {
      return character.display_name;
    }
    return character.character_name_jp || character.character_name_en;
  };

  // モバイル用ボタンコンポーネント
  const MobileCharacterButton = ({ character }: { character: Character }) => {
    return (
      <a
        href={`/character/${character.character_id}`}
        style={{
          position: 'relative',
          display: 'block',
          textDecoration: 'none',
          width: '100%',
          height: '120px',
          cursor: 'pointer'
        }}
      >
        <div style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          borderRadius: '2px'
        }}>
          <div style={{
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            background: 'linear-gradient(135deg, #dc2626, #991b1b)',
            padding: '2px',
            boxShadow: '0 2px 5px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #000000 100%)',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: '0',
                left: '0',
                right: '0',
                bottom: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}>
                {/* モバイル用画像: /character-faces-mobile/[character_id].png */}
                {/* フォールバック: /character-faces/[character_id].png */}
                <img
                  src={`/character-faces-mobile/${character.character_id}.png`}
                  alt={getDisplayName(character)}
                  style={{
                    width: 'auto',
                    height: '100%',
                    maxWidth: '130%',
                    objectFit: 'contain',
                    objectPosition: 'center',
                    opacity: 0.85,
                    filter: 'brightness(0.9) contrast(1.0)'
                  }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    // モバイル用画像がない場合は通常の画像にフォールバック
                    if (!target.dataset.fallbackAttempted) {
                      target.dataset.fallbackAttempted = 'true';
                      target.src = `/character-faces/${character.character_id}.png`;
                    } else {
                      // 両方とも失敗した場合は非表示
                      target.style.display = 'none';
                    }
                  }}
                />
              </div>
              <div style={{
                position: 'absolute',
                top: '0',
                left: '0',
                right: '0',
                bottom: '0',
                background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.3) 50%, rgba(0, 0, 0, 0.8) 100%)',
                pointerEvents: 'none'
              }} />
              <div style={{
                position: 'absolute',
                bottom: '4px',
                left: '0',
                right: '0',
                padding: '0 8px',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '11px',
                  fontWeight: 'bold',
                  color: '#ffffff',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.9)',
                  lineHeight: '1.2',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {getDisplayName(character)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </a>
    );
  };

  // デスクトップ用ボタンコンポーネント
  const DesktopCharacterButton = ({ character }: { character: Character }) => {
    const isHovered = hoveredCharacter === character.id;

    return (
      <a
        href={`/character/${character.character_id}`}
        onMouseEnter={() => setHoveredCharacter(character.id)}
        onMouseLeave={() => setHoveredCharacter(null)}
        style={{
          position: 'relative',
          display: 'block',
          textDecoration: 'none',
          width: `${240 * screenScale}px`,
          height: `${170 * screenScale}px`,
          transform: isHovered ? 'scale(1.05) translateY(-3px)' : 'scale(1)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          cursor: 'pointer'
        }}
      >
        <div style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          transform: 'skewX(-15deg)',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            background: isHovered
              ? 'linear-gradient(135deg, #ef4444, #dc2626)'
              : 'linear-gradient(135deg, #dc2626, #991b1b)',
            padding: `${3 * screenScale}px`,
            boxShadow: isHovered
              ? '0 0 20px rgba(220, 38, 38, 0.8), inset 0 0 20px rgba(0, 0, 0, 0.5)'
              : '0 5px 15px rgba(0, 0, 0, 0.7), inset 0 0 10px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #000000 100%)',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: '0',
                left: '0',
                right: '0',
                bottom: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}>
                {/* デスクトップ用画像: /character-faces/[character_id].png */}
                <img
                  src={`/character-faces/${character.character_id}.png`}
                  alt={getDisplayName(character)}
                  style={{
                    width: 'auto',
                    height: '100%',
                    maxWidth: '150%',
                    objectFit: 'contain',
                    objectPosition: 'center',
                    transform: 'skewX(15deg)',
                    opacity: isHovered ? 0.9 : 0.7,
                    transition: 'opacity 0.3s',
                    filter: isHovered
                      ? 'brightness(1.1) contrast(1.1)'
                      : 'brightness(0.8) contrast(1.0)'
                  }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              </div>
              <div style={{
                position: 'absolute',
                top: '0',
                left: '0',
                right: '0',
                bottom: '0',
                background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0.4) 50%, rgba(0, 0, 0, 0.9) 100%)',
                pointerEvents: 'none'
              }} />
              <div style={{
                position: 'absolute',
                bottom: `${10 * screenScale}px`,
                left: '0',
                right: '0',
                padding: `0 ${20 * screenScale}px`,
                transform: 'skewX(15deg)',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: `${16 * screenScale}px`,
                  fontWeight: 'bold',
                  color: '#ffffff',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.9), 0 0 10px rgba(0,0,0,0.8)',
                  letterSpacing: '0.5px',
                  lineHeight: '1.2',
                  marginBottom: `${3 * screenScale}px`,
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {getDisplayName(character)}
                </div>
                <div style={{
                  fontSize: `${11 * screenScale}px`,
                  color: 'rgba(252, 165, 165, 0.9)',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                  letterSpacing: '0.3px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {character.character_name_en}
                </div>
              </div>
              {isHovered && (
                <>
                  <div style={{
                    position: 'absolute',
                    top: '-50%',
                    left: '-50%',
                    width: '200%',
                    height: '200%',
                    background: 'linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%)',
                    animation: 'shimmer 0.8s ease-out',
                    pointerEvents: 'none'
                  }} />
                  <div style={{
                    position: 'absolute',
                    top: '0',
                    left: '0',
                    right: '0',
                    bottom: '0',
                    boxShadow: 'inset 0 0 30px rgba(220, 38, 38, 0.3)',
                    pointerEvents: 'none'
                  }} />
                </>
              )}
            </div>
          </div>
        </div>
      </a>
    );
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: `
        linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)),
        url('/backgrounds/background.jpg')
      `,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      backgroundRepeat: 'no-repeat',
      position: 'relative',
      overflow: 'hidden'
    }}>
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
        padding: '40px 20px',
        maxWidth: '1600px',
        margin: '0 auto'
      }}>
        {/* NEWSセクション */}
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto 60px',
          padding: '0 20px'
        }}>
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
                <div style={{
                  fontSize: '16px',
                  color: '#9ca3af',
                  minWidth: '110px',
                  fontFamily: 'monospace',
                  letterSpacing: '1px'
                }}>
                  {news.date}
                </div>
                
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

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '15px'
          }}>
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
            >
              🎮 キャラクター編集
            </a>

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
            Character List
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
            gridTemplateColumns: isMobile 
              ? 'repeat(4, 1fr)'
              : `repeat(auto-fill, ${240 * screenScale}px)`,
            gap: isMobile ? '4px' : `${15 * screenScale}px`,
            padding: isMobile ? '10px 4px' : '20px',
            justifyContent: 'center',
            maxWidth: '1400px',
            margin: '0 auto'
          }}>
            {isMobile ? (
              characters.map((character) => (
                <MobileCharacterButton key={character.id} character={character} />
              ))
            ) : (
              characters.map((character) => (
                <DesktopCharacterButton key={character.id} character={character} />
              ))
            )}
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

        {/* 管理者リンク */}
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
          >
            ⚙️ 管理画面
          </a>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { 
            transform: translateX(0) translateY(0); 
            opacity: 0;
          }
          50% { 
            opacity: 1;
          }
          100% { 
            transform: translateX(100%) translateY(100%); 
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}