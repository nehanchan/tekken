'use client';

import { useEffect, useState } from 'react';
import { client } from '@/lib/client';
import Footer from '@/components/Footer';

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

  const checkScreenSize = () => {
    const width = window.innerWidth;
    setIsMobile(width < 768);
    
    if (width >= 1400) {
      setScreenScale(1);
    } else if (width >= 1200) {
      setScreenScale(0.9);
    } else if (width >= 1000) {
      setScreenScale(0.8);
    } else if (width >= 768) {
      setScreenScale(0.7);
    } else {
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

  const MobileCharacterButton = ({ character }: { character: Character }) => {
    return (
      <a
        href={`/character/${character.character_id}`}
        className="relative block no-underline w-full cursor-pointer"
        style={{ height: '120px' }}
      >
        <div className="relative w-full h-full overflow-hidden" style={{ borderRadius: '2px' }}>
          <div 
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(135deg, #dc2626, #991b1b)',
              padding: '2px',
              boxShadow: '0 2px 5px rgba(0, 0, 0, 0.5)'
            }}
          >
            <div 
              className="relative w-full h-full overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #000000 100%)'
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                <img
                  src={`/character-faces-mobile/${character.character_id}.png`}
                  alt={getDisplayName(character)}
                  className="object-contain"
                  style={{
                    width: 'auto',
                    height: '100%',
                    maxWidth: '130%',
                    objectPosition: 'center',
                    opacity: 0.85,
                    filter: 'brightness(0.9) contrast(1.0)'
                  }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (!target.dataset.fallbackAttempted) {
                      target.dataset.fallbackAttempted = 'true';
                      target.src = `/character-faces/${character.character_id}.png`;
                    } else {
                      target.style.display = 'none';
                    }
                  }}
                />
              </div>
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.3) 50%, rgba(0, 0, 0, 0.8) 100%)'
                }}
              />
              <div className="absolute bottom-1 left-0 right-0 px-2 text-center">
                <div 
                  className="font-bold text-white whitespace-nowrap overflow-hidden overflow-ellipsis"
                  style={{
                    fontSize: '11px',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.9)',
                    lineHeight: '1.2'
                  }}
                >
                  {getDisplayName(character)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </a>
    );
  };

  const DesktopCharacterButton = ({ character }: { character: Character }) => {
    const isHovered = hoveredCharacter === character.id;

    return (
      <a
        href={`/character/${character.character_id}`}
        onMouseEnter={() => setHoveredCharacter(character.id)}
        onMouseLeave={() => setHoveredCharacter(null)}
        className="relative block no-underline cursor-pointer"
        style={{
          width: `${240 * screenScale}px`,
          height: `${170 * screenScale}px`,
          transform: isHovered ? 'scale(1.05) translateY(-3px)' : 'scale(1)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <div 
          className="relative w-full h-full overflow-hidden"
          style={{ transform: 'skewX(-15deg)' }}
        >
          <div 
            className="absolute inset-0"
            style={{
              background: isHovered
                ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                : 'linear-gradient(135deg, #dc2626, #991b1b)',
              padding: `${3 * screenScale}px`,
              boxShadow: isHovered
                ? '0 0 20px rgba(220, 38, 38, 0.8), inset 0 0 20px rgba(0, 0, 0, 0.5)'
                : '0 5px 15px rgba(0, 0, 0, 0.7), inset 0 0 10px rgba(0, 0, 0, 0.5)'
            }}
          >
            <div 
              className="relative w-full h-full overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #000000 100%)'
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                <img
                  src={`/character-faces/${character.character_id}.png`}
                  alt={getDisplayName(character)}
                  className="object-contain"
                  style={{
                    width: 'auto',
                    height: '100%',
                    maxWidth: '150%',
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
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0.4) 50%, rgba(0, 0, 0, 0.9) 100%)'
                }}
              />
              <div 
                className="absolute left-0 right-0 text-center"
                style={{
                  bottom: `${10 * screenScale}px`,
                  padding: `0 ${20 * screenScale}px`,
                  transform: 'skewX(15deg)'
                }}
              >
                <div 
                  className="font-bold text-white uppercase whitespace-nowrap overflow-hidden overflow-ellipsis"
                  style={{
                    fontSize: `${16 * screenScale}px`,
                    textShadow: '2px 2px 4px rgba(0,0,0,0.9), 0 0 10px rgba(0,0,0,0.8)',
                    letterSpacing: '0.5px',
                    lineHeight: '1.2',
                    marginBottom: `${3 * screenScale}px`
                  }}
                >
                  {getDisplayName(character)}
                </div>
                <div 
                  className="whitespace-nowrap overflow-hidden overflow-ellipsis"
                  style={{
                    fontSize: `${11 * screenScale}px`,
                    color: 'rgba(252, 165, 165, 0.9)',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                    letterSpacing: '0.3px'
                  }}
                >
                  {character.character_name_en}
                </div>
              </div>
              {isHovered && (
                <div 
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    boxShadow: 'inset 0 0 40px rgba(220, 38, 38, 0.5), 0 0 20px rgba(220, 38, 38, 0.3)'
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </a>
    );
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div 
        className="min-h-screen relative"
        style={{
          background: `
            linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.5)),
            url('/backgrounds/background.jpg')
          `,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23991b1b' fill-opacity='0.02'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            zIndex: 0
          }}
        />

        <div className="relative z-10">    
          {/* ロゴセクション */}
          <div 
            className="w-full flex justify-center items-center mb-0"
            style={{
              background: `
                linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)),
                url('/backgrounds/background-title1.jpg')
              `,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              padding: isMobile ? '40px 20px' : '60px 20px'
            }}
          >
            <img 
              src="/backgrounds/TEKKEN8_LOGO.png"
              alt="TEKKEN 8"
              style={{
                maxWidth: isMobile ? '80%' : '600px',
                width: '100%',
                height: 'auto',
                filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.8))'
              }}
            />
          </div>

          <div className="py-10 px-5 mx-auto max-w-screen-2xl">
            {/* NEWSセクション */}
            <div className="max-w-screen-xl mx-auto mb-15 px-5">
              <div className="text-center mb-8">
                <div className="inline-block relative">
                  <div 
                    className="absolute"
                    style={{
                      top: '-5px',
                      left: '-30px',
                      right: '-30px',
                      bottom: '-5px',
                      background: 'linear-gradient(135deg, #dc2626, #991b1b)',
                      padding: '3px',
                      borderRadius: '2px',
                      boxShadow: '0 5px 15px rgba(0, 0, 0, 0.7)'
                    }}
                  >
                    <div 
                      className="w-full h-full"
                      style={{
                        background: 'linear-gradient(135deg, rgba(0,0,0,0.95), rgba(127, 29, 29, 0.15))',
                        borderRadius: '1px'
                      }}
                    />
                  </div>
                  
                  <h2 
                    className="relative font-bold text-white uppercase"
                    style={{
                      fontSize: '32px',
                      letterSpacing: '4px',
                      textShadow: '2px 2px 4px rgba(0,0,0,0.9)',
                      padding: '10px 40px'
                    }}
                  >
                    NEWS
                  </h2>
                </div>
              </div>

              <div className="relative">
                <div 
                  className="absolute inset-0 rounded"
                  style={{
                    background: 'linear-gradient(135deg, #dc2626, #991b1b)',
                    padding: '3px',
                    boxShadow: '0 5px 15px rgba(0, 0, 0, 0.7)'
                  }}
                >
                  <div 
                    className="w-full h-full"
                    style={{
                      background: 'rgba(0, 0, 0, 0.85)',
                      borderRadius: '2px'
                    }}
                  />
                </div>
                
                <div className="relative py-5 px-8">
                  {newsItems.map((news, index) => (
                    <div 
                      key={index}
                      className="py-4 flex items-center gap-5 transition-all cursor-pointer"
                      style={{
                        borderBottom: index < newsItems.length - 1 ? '1px solid rgba(185, 28, 28, 0.2)' : 'none'
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
                      <div 
                        className="text-gray-400 font-mono"
                        style={{
                          fontSize: '16px',
                          minWidth: '110px',
                          letterSpacing: '1px'
                        }}
                      >
                        {news.date}
                      </div>
                      
                      <div 
                        className="text-white font-bold text-center rounded"
                        style={{
                          background: 'linear-gradient(135deg, #dc2626, #991b1b)',
                          padding: '2px 10px',
                          fontSize: '13px',
                          minWidth: '50px',
                          textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                        }}
                      >
                        {news.tag}
                      </div>
                      
                      <div 
                        className="text-gray-200 flex-1"
                        style={{
                          fontSize: '16px',
                          letterSpacing: '0.5px'
                        }}
                      >
                        {news.content}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* キャラクターセクションヘッダー */}
            <div className="max-w-screen-xl mx-auto mb-10 px-5">
              <div className="text-center">
                <div className="inline-block relative">
                  <div 
                    className="absolute"
                    style={{
                      top: '-5px',
                      left: '-30px',
                      right: '-30px',
                      bottom: '-5px',
                      background: 'linear-gradient(135deg, #dc2626, #991b1b)',
                      padding: '3px',
                      borderRadius: '2px',
                      boxShadow: '0 5px 15px rgba(0, 0, 0, 0.7)'
                    }}
                  >
                    <div 
                      className="w-full h-full"
                      style={{
                        background: 'linear-gradient(135deg, rgba(0,0,0,0.95), rgba(127, 29, 29, 0.15))',
                        borderRadius: '1px'
                      }}
                    />
                  </div>
                  
                  <h2 
                    className="relative font-bold text-white uppercase"
                    style={{
                      fontSize: '32px',
                      letterSpacing: '4px',
                      textShadow: '2px 2px 4px rgba(0,0,0,0.9)',
                      padding: '10px 40px'
                    }}
                  >
                    CHARACTER LIST
                  </h2>
                </div>
              </div>
            </div>

            {/* キャラクターグリッド */}
            {loading ? (
              <div className="text-center text-2xl mt-24" style={{ color: '#fca5a5' }}>
                Loading...
              </div>
            ) : characters.length > 0 ? (
              <div 
                className="grid justify-center mx-auto max-w-screen-xl"
                style={{
                  gridTemplateColumns: isMobile 
                    ? 'repeat(4, 1fr)'
                    : `repeat(auto-fill, ${240 * screenScale}px)`,
                  gap: isMobile ? '4px' : `${15 * screenScale}px`,
                  padding: isMobile ? '10px 4px' : '20px'
                }}
              >
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
              <div className="text-center py-24 px-5">
                <p className="text-2xl text-gray-400 mb-5">
                  キャラクターデータがありません
                </p>
              </div>
            )}
          </div>

          {/* フッター */}
          <Footer isMobile={isMobile} />
        </div>
      </div>
    </div>
  );
}
