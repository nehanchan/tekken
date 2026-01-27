'use client';

import { useState, useEffect } from 'react';
import { client } from '@/lib/client';
import { TextWithIcons } from '@/components/CommandDisplay';
import LogoutButton from '@/components/LogoutButton';

interface Memo {
  id: string;
  character_id: string;
  character_name?: string | null;
  categories?: (string | null)[] | null;
  title: string;
  content?: string | null;
  importance?: number | null;
  createdAt: string;
  updatedAt: string;
}

export default function MemoListPage() {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [filteredMemos, setFilteredMemos] = useState<Memo[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc' | 'date'>('date');
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedMemo, setSelectedMemo] = useState<Memo | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    fetchMemos();
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    let result = [...memos];
    
    // キャラクターで絞り込み
    if (selectedCharacter !== 'all') {
      result = result.filter(memo => memo.character_id === selectedCharacter);
    }
    
    // 分類で絞り込み
    if (selectedCategory !== 'all') {
      result = result.filter(memo => 
        memo.categories && memo.categories.includes(selectedCategory)
      );
    }
    
    // ソート
    if (sortOrder === 'desc') {
      // 重要度降順（高い順）
      result.sort((a, b) => (b.importance || 0) - (a.importance || 0));
    } else if (sortOrder === 'asc') {
      // 重要度昇順（低い順）
      result.sort((a, b) => (a.importance || 0) - (b.importance || 0));
    } else {
      // 日付順（新しい順）
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    
    setFilteredMemos(result);
  }, [selectedCharacter, selectedCategory, sortOrder, memos]);

  const fetchMemos = async () => {
    setLoading(true);
    try {
      const { data } = await client.models.Memo.list({ authMode: 'userPool' });
      const validMemos = (data || []).filter(m => m !== null) as Memo[];
      const sorted = validMemos.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setMemos(sorted);
      setFilteredMemos(sorted);
      console.log('メモ取得成功:', sorted.length, '件');
    } catch (error) {
      console.error('メモ取得エラー:', error);
      alert('メモの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (memoId: string) => {
    if (!confirm('このメモを削除しますか？')) return;

    try {
      const result = await client.models.Memo.delete({ 
        id: memoId 
      }, {
        authMode: 'userPool'
      });
      
      console.log('削除結果:', result);
      
      if (result.data || !result.errors) {
        alert('メモを削除しました');
        fetchMemos();
      } else {
        throw new Error('削除に失敗しました');
      }
    } catch (error) {
      console.error('削除エラー:', error);
      if (error instanceof Error) {
        alert(`削除に失敗しました: ${error.message}`);
      } else {
        alert('削除に失敗しました');
      }
    }
  };

  const uniqueCharacters = Array.from(
    new Set(memos.map(memo => memo.character_id))
  );

  const uniqueCategories = Array.from(
    new Set(
      memos.flatMap(memo => 
        memo.categories ? memo.categories.filter((c): c is string => c !== null) : []
      )
    )
  ).sort();

  return (
    <div style={{
      minHeight: '100vh',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* ハンバーガーメニューボタン */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        style={{
          position: 'fixed',
          top: '20px',
          left: menuOpen ? '320px' : '20px',
          zIndex: 999,
          width: '50px',
          height: '50px',
          background: 'linear-gradient(135deg, #dc2626, #991b1b)',
          border: '2px solid rgba(185, 28, 28, 0.5)',
          borderRadius: '8px',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
          transition: 'all 0.3s ease-in-out'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.boxShadow = '0 6px 15px rgba(0,0,0,0.6)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.5)';
        }}
      >
        <div style={{ width: '30px', height: '3px', background: '#ffffff', borderRadius: '2px' }} />
        <div style={{ width: '30px', height: '3px', background: '#ffffff', borderRadius: '2px' }} />
        <div style={{ width: '30px', height: '3px', background: '#ffffff', borderRadius: '2px' }} />
      </button>

      {/* サイドメニュー */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: menuOpen ? 0 : '-300px',
          width: '300px',
          height: '100vh',
          background: 'linear-gradient(to bottom, #000000, #1a0505, #000000)',
          boxShadow: menuOpen ? '4px 0 20px rgba(0,0,0,0.5)' : 'none',
          zIndex: 998,
          transition: 'left 0.3s ease-in-out',
          overflowY: 'auto'
        }}
      >
        {/* メニューヘッダー */}
        <div style={{
          padding: '20px',
          borderBottom: '2px solid rgba(185, 28, 28, 0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#fef2f2',
            letterSpacing: '2px',
            textTransform: 'uppercase'
          }}>
            MENU
          </h2>
          <button
            onClick={() => setMenuOpen(false)}
            style={{
              width: '32px',
              height: '32px',
              background: 'rgba(185, 28, 28, 0.3)',
              border: '1px solid rgba(185, 28, 28, 0.5)',
              borderRadius: '50%',
              color: '#fca5a5',
              cursor: 'pointer',
              fontSize: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
        </div>

        {/* メニュー項目 */}
        <nav style={{ padding: '20px 0' }}>
          {[
            { label: 'TOP', href: '/' },
            { label: 'キャラクター', href: '/' },
            { label: '対策メモ', href: '/memo/list' },
            { label: 'コンボ', href: '/combo/list' },
            { label: 'カスタマイズ', href: '/coming-soon?type=customize' }
          ].map((item, index) => (
            <a
              key={index}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                padding: '15px 30px',
                color: '#e5e7eb',
                textDecoration: 'none',
                fontSize: '16px',
                fontWeight: '600',
                borderLeft: '4px solid transparent',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(185, 28, 28, 0.2)';
                e.currentTarget.style.borderLeftColor = '#dc2626';
                e.currentTarget.style.color = '#fef2f2';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderLeftColor = 'transparent';
                e.currentTarget.style.color = '#e5e7eb';
              }}
            >
              <span style={{ letterSpacing: '1px' }}>{item.label}</span>
            </a>
          ))}
        </nav>

        {/* メニューフッター */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '20px',
          borderTop: '2px solid rgba(185, 28, 28, 0.3)',
          background: 'rgba(0, 0, 0, 0.5)'
        }}>
          <div style={{
            fontSize: '12px',
            color: '#6b7280',
            textAlign: 'center'
          }}>
            TEKKEN 8 Database
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
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
        marginLeft: menuOpen ? '300px' : '0',
        transition: 'margin-left 0.3s ease-in-out',
        width: menuOpen ? 'calc(100% - 300px)' : '100%',
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
          padding: isMobile ? '20px' : '40px 20px',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {/* ヘッダー */}
          <div style={{
            marginBottom: '40px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative'
          }}>
            {/* タイトル */}
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
                background: 'linear-gradient(135deg, #dc2626, #991b1b)',
                padding: '3px',
                borderRadius: '2px',
                boxShadow: '0 5px 15px rgba(0, 0, 0, 0.7)'
              }}>
                <div style={{
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(135deg, rgba(0,0,0,0.95), rgba(127, 29, 29, 0.15))',
                  borderRadius: '1px'
                }} />
              </div>
              
              <h1 style={{
                position: 'relative',
                fontSize: isMobile ? '24px' : '32px',
                fontWeight: 'bold',
                color: '#ffffff',
                letterSpacing: '4px',
                textTransform: 'uppercase',
                textShadow: '2px 2px 4px rgba(0,0,0,0.9)',
                padding: '10px 40px'
              }}>
                メモ一覧
              </h1>
            </div>

            {/* ログアウトボタン（右上固定） */}
            {!isMobile && (
              <div style={{
                position: 'absolute',
                right: 0,
                top: '50%',
                transform: 'translateY(-50%)'
              }}>
                <LogoutButton />
              </div>
            )}
          </div>

          {/* モバイル用ログアウトボタン */}
          {isMobile && (
            <div style={{
              marginBottom: '20px',
              display: 'flex',
              justifyContent: 'flex-end'
            }}>
              <LogoutButton />
            </div>
          )}

          {/* フィルター＆ソート＆ボタン */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '15px',
            marginBottom: '30px'
          }}>
            {/* 上段：フィルター */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '10px',
              alignItems: 'center'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <label style={{
                  fontSize: '12px',
                  color: '#fca5a5',
                  fontWeight: '600',
                  whiteSpace: 'nowrap'
                }}>
                  キャラクター:
                </label>
                <select
                  value={selectedCharacter}
                  onChange={(e) => setSelectedCharacter(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    fontSize: '13px',
                    background: 'rgba(0, 0, 0, 0.6)',
                    border: '2px solid rgba(185, 28, 28, 0.4)',
                    borderRadius: '6px',
                    color: '#ffffff',
                    cursor: 'pointer',
                    outline: 'none',
                    minWidth: '180px'
                  }}
                >
                  <option value="all">全て ({memos.length})</option>
                  {uniqueCharacters.map(charId => {
                    const memo = memos.find(m => m.character_id === charId);
                    const count = memos.filter(m => m.character_id === charId).length;
                    return (
                      <option key={charId} value={charId}>
                        {memo?.character_name || charId} ({count})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <label style={{
                  fontSize: '12px',
                  color: '#fca5a5',
                  fontWeight: '600',
                  whiteSpace: 'nowrap'
                }}>
                  分類:
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    fontSize: '13px',
                    background: 'rgba(0, 0, 0, 0.6)',
                    border: '2px solid rgba(185, 28, 28, 0.4)',
                    borderRadius: '6px',
                    color: '#ffffff',
                    cursor: 'pointer',
                    outline: 'none',
                    minWidth: '150px'
                  }}
                >
                  <option value="all">全て</option>
                  {uniqueCategories.map(category => {
                    const count = memos.filter(m => 
                      m.categories && m.categories.includes(category)
                    ).length;
                    return (
                      <option key={category} value={category}>
                        {category} ({count})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <label style={{
                  fontSize: '12px',
                  color: '#fca5a5',
                  fontWeight: '600',
                  whiteSpace: 'nowrap'
                }}>
                  並び順:
                </label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as 'desc' | 'asc' | 'date')}
                  style={{
                    padding: '8px 12px',
                    fontSize: '13px',
                    background: 'rgba(0, 0, 0, 0.6)',
                    border: '2px solid rgba(185, 28, 28, 0.4)',
                    borderRadius: '6px',
                    color: '#ffffff',
                    cursor: 'pointer',
                    outline: 'none',
                    minWidth: '150px'
                  }}
                >
                  <option value="date">日付順（新しい順）</option>
                  <option value="desc">重要度順（高い順）</option>
                  <option value="asc">重要度順（低い順）</option>
                </select>
              </div>

              {/* クリアボタン */}
              {(selectedCharacter !== 'all' || selectedCategory !== 'all' || sortOrder !== 'date') && (
                <button
                  onClick={() => {
                    setSelectedCharacter('all');
                    setSelectedCategory('all');
                    setSortOrder('date');
                  }}
                  style={{
                    padding: '8px 16px',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    background: 'rgba(239, 68, 68, 0.3)',
                    border: '2px solid rgba(239, 68, 68, 0.5)',
                    borderRadius: '6px',
                    color: '#fca5a5',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  ✕ クリア
                </button>
              )}
            </div>

            {/* 下段：ボタンと検索結果件数 */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <div style={{
                fontSize: '13px',
                color: '#9ca3af'
              }}>
                {filteredMemos.length > 0 && (
                  <>
                    {memos.length !== filteredMemos.length && (
                      <span style={{ color: '#60a5fa', fontWeight: '600' }}>
                        {filteredMemos.length}件
                      </span>
                    )}
                    {memos.length !== filteredMemos.length && (
                      <span> / 全{memos.length}件</span>
                    )}
                    {memos.length === filteredMemos.length && (
                      <span>全{memos.length}件</span>
                    )}
                  </>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <a
                  href="/memo"
                  style={{
                    padding: '10px 20px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    background: 'linear-gradient(135deg, #dc2626, #991b1b)',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#ffffff',
                    cursor: 'pointer',
                    textDecoration: 'none',
                    display: 'inline-block'
                  }}
                >
                  ＋ 新規作成
                </a>
                <a
                  href="/"
                  style={{
                    padding: '10px 20px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    background: 'rgba(107, 114, 128, 0.3)',
                    border: '2px solid rgba(107, 114, 128, 0.5)',
                    borderRadius: '6px',
                    color: '#ffffff',
                    cursor: 'pointer',
                    textDecoration: 'none',
                    display: 'inline-block'
                  }}
                >
                  トップへ
                </a>
              </div>
            </div>
          </div>

          {/* メモリスト */}
          {loading ? (
            <div style={{
              textAlign: 'center',
              padding: '100px 20px',
              color: '#fca5a5',
              fontSize: '18px'
            }}>
              読み込み中...
            </div>
          ) : filteredMemos.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '100px 20px'
            }}>
              <div style={{
                position: 'relative',
                display: 'inline-block'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '0',
                  left: '0',
                  right: '0',
                  bottom: '0',
                  background: 'linear-gradient(135deg, #dc2626, #991b1b)',
                  padding: '3px',
                  borderRadius: '8px'
                }}>
                  <div style={{
                    width: '100%',
                    height: '100%',
                    background: 'rgba(0, 0, 0, 0.85)',
                    borderRadius: '6px'
                  }} />
                </div>
                <div style={{
                  position: 'relative',
                  padding: '40px 60px',
                  color: '#9ca3af',
                  fontSize: '16px'
                }}>
                  {memos.length === 0 ? (
                    'メモがありません'
                  ) : (
                    <>
                      <div style={{ marginBottom: '10px' }}>
                        条件に一致するメモがありません
                      </div>
                      <button
                        onClick={() => {
                          setSelectedCharacter('all');
                          setSelectedCategory('all');
                          setSortOrder('date');
                        }}
                        style={{
                          marginTop: '10px',
                          padding: '8px 16px',
                          fontSize: '13px',
                          fontWeight: 'bold',
                          background: 'rgba(239, 68, 68, 0.3)',
                          border: '2px solid rgba(239, 68, 68, 0.5)',
                          borderRadius: '6px',
                          color: '#fca5a5',
                          cursor: 'pointer'
                        }}
                      >
                        フィルターをクリア
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              maxWidth: '1000px',
              margin: '0 auto'
            }}>
              {filteredMemos.map(memo => (
                <div
                  key={memo.id}
                  style={{
                    position: 'relative',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    setSelectedMemo(memo);
                    setShowDetail(true);
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    top: '0',
                    left: '0',
                    right: '0',
                    bottom: '0',
                    background: 'linear-gradient(135deg, #dc2626, #991b1b)',
                    padding: '1px',
                    borderRadius: '4px',
                    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.5)'
                  }}>
                    <div style={{
                      width: '100%',
                      height: '100%',
                      background: 'rgba(0, 0, 0, 0.85)',
                      borderRadius: '3px'
                    }} />
                  </div>

                  <div style={{
                    position: 'relative',
                    padding: isMobile ? '6px' : '8px',
                    display: 'flex',
                    gap: isMobile ? '6px' : '10px',
                    alignItems: 'center'
                  }}>
                    {/* キャラクター画像（固定幅） */}
                    <div style={{
                      width: isMobile ? '32px' : '50px',
                      minWidth: isMobile ? '32px' : '50px',
                      maxWidth: isMobile ? '32px' : '50px',
                      height: isMobile ? '32px' : '50px',
                      flexShrink: 0,
                      position: 'relative',
                      overflow: 'hidden',
                      borderRadius: '3px',
                      background: 'transparent',
                      border: '1px solid rgba(185, 28, 28, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <img
                        src={`/character-faces/${memo.character_id}.png`}
                        alt={memo.character_name || memo.character_id}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          objectPosition: 'center bottom',
                          imageRendering: 'crisp-edges'
                        }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (!target.dataset.fallbackAttempted) {
                            target.dataset.fallbackAttempted = 'true';
                            target.src = `/character-faces-mobile/${memo.character_id}.png`;
                          } else {
                            target.style.display = 'none';
                            const placeholder = document.createElement('div');
                            placeholder.style.width = '100%';
                            placeholder.style.height = '100%';
                            placeholder.style.display = 'flex';
                            placeholder.style.alignItems = 'center';
                            placeholder.style.justifyContent = 'center';
                            placeholder.style.fontSize = isMobile ? '20px' : '24px';
                            placeholder.textContent = '🥊';
                            target.parentNode?.appendChild(placeholder);
                          }
                        }}
                      />
                    </div>

                    {/* キャラクター名と重要度（固定幅） */}
                    <div style={{
                      width: isMobile ? '60px' : '80px',
                      minWidth: isMobile ? '60px' : '80px',
                      maxWidth: isMobile ? '60px' : '80px',
                      flexShrink: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px'
                    }}>
                      <div style={{
                        fontSize: isMobile ? '10px' : '11px',
                        color: '#60a5fa',
                        fontWeight: '600',
                        whiteSpace: 'nowrap',
                        lineHeight: '1.2',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {memo.character_name || memo.character_id}
                      </div>
                      <div style={{ display: 'flex', gap: '1px' }}>
                        {[1, 2, 3, 4, 5].map(star => (
                          <span
                            key={star}
                            style={{
                              fontSize: '9px',
                              color: star <= (memo.importance || 0) ? '#fbbf24' : '#4b5563',
                              lineHeight: '1'
                            }}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* 分類タグ（固定幅・デスクトップのみ） */}
                    {!isMobile && (
                      <div style={{
                        width: '100px',
                        minWidth: '100px',
                        maxWidth: '100px',
                        flexShrink: 0,
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '3px',
                        alignContent: 'flex-start'
                      }}>
                        {memo.categories && memo.categories.length > 0 ? (
                          <>
                            {memo.categories.filter(c => c !== null).slice(0, 2).map((category, idx) => (
                              <span
                                key={idx}
                                style={{
                                  fontSize: '8px',
                                  padding: '1px 4px',
                                  background: 'rgba(185, 28, 28, 0.3)',
                                  border: '1px solid rgba(248, 113, 113, 0.5)',
                                  borderRadius: '2px',
                                  color: '#fca5a5',
                                  whiteSpace: 'nowrap',
                                  lineHeight: '1.2'
                                }}
                              >
                                {category}
                              </span>
                            ))}
                            {memo.categories.length > 2 && (
                              <span style={{
                                fontSize: '8px',
                                color: '#6b7280'
                              }}>
                                +{memo.categories.length - 2}
                              </span>
                            )}
                          </>
                        ) : (
                          <span style={{ fontSize: '8px', color: '#4b5563' }}>-</span>
                        )}
                      </div>
                    )}

                    {/* 件名（左・固定幅） */}
                    <div style={{
                      width: isMobile ? 'auto' : '280px',
                      minWidth: isMobile ? '0' : '280px',
                      maxWidth: isMobile ? 'none' : '280px',
                      flex: isMobile ? 1 : '0 0 280px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        fontSize: isMobile ? '11px' : '12px',
                        fontWeight: 'bold',
                        color: '#fef2f2',
                        lineHeight: '1.3',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        <TextWithIcons 
                          text={memo.title}
                          size="md"
                          textClassName="text-red-50 font-bold"
                          showFallback={false}
                          enableIconReplacement={true}
                        />
                      </div>
                    </div>

                    {/* 補足（右・可変幅・デスクトップのみ） */}
                    {memo.content && !isMobile && (
                      <div style={{
                        flex: '1 1 auto',
                        minWidth: 0,
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          fontSize: '10px',
                          color: '#9ca3af',
                          lineHeight: '1.3',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          <TextWithIcons 
                            text={memo.content}
                            size="md"
                            textClassName="text-gray-400"
                            showFallback={false}
                            enableIconReplacement={true}
                          />
                        </div>
                      </div>
                    )}

                    {/* 日付（固定幅） */}
                    <div style={{
                      width: isMobile ? '50px' : '60px',
                      minWidth: isMobile ? '50px' : '60px',
                      maxWidth: isMobile ? '50px' : '60px',
                      flexShrink: 0,
                      textAlign: 'right'
                    }}>
                      <div style={{
                        fontSize: '9px',
                        color: '#6b7280',
                        lineHeight: '1.2'
                      }}>
                        {new Date(memo.createdAt).toLocaleDateString('ja-JP', {
                          year: '2-digit',
                          month: '2-digit',
                          day: '2-digit'
                        }).replace(/\//g, '/')}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 詳細モーダル */}
      {showDetail && selectedMemo && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            backdropFilter: 'blur(4px)'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDetail(false);
            }
          }}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '700px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto'
            }}
          >
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
                background: 'rgba(0, 0, 0, 0.95)',
                borderRadius: '10px'
              }} />
            </div>

            <div style={{
              position: 'relative',
              padding: '30px'
            }}>
              <button
                onClick={() => setShowDetail(false)}
                style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  background: 'rgba(185, 28, 28, 0.3)',
                  border: '1px solid rgba(185, 28, 28, 0.5)',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  color: '#fca5a5',
                  cursor: 'pointer',
                  fontSize: '18px'
                }}
              >
                ×
              </button>

              <div style={{
                marginBottom: '20px'
              }}>
                <div style={{
                  fontSize: '16px',
                  color: '#60a5fa',
                  fontWeight: '600',
                  marginBottom: '8px'
                }}>
                  {selectedMemo.character_name || selectedMemo.character_id}
                </div>
                <div style={{ display: 'flex', gap: '2px' }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <span
                      key={star}
                      style={{
                        fontSize: '16px',
                        color: star <= (selectedMemo.importance || 0) ? '#fbbf24' : '#4b5563'
                      }}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>

              <h2 style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#fef2f2',
                marginBottom: '20px',
                lineHeight: '1.4'
              }}>
                <TextWithIcons 
                  text={selectedMemo.title}
                  size="lg"
                  textClassName="text-red-50 font-bold"
                  showFallback={false}
                  enableIconReplacement={true}
                />
              </h2>

              {selectedMemo.categories && selectedMemo.categories.length > 0 && (
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  marginBottom: '20px'
                }}>
                  {selectedMemo.categories.filter(c => c !== null).map((category, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: '13px',
                        padding: '6px 12px',
                        background: 'rgba(185, 28, 28, 0.3)',
                        border: '1px solid rgba(248, 113, 113, 0.5)',
                        borderRadius: '6px',
                        color: '#fca5a5'
                      }}
                    >
                      {category}
                    </span>
                  ))}
                </div>
              )}

              {selectedMemo.content && (
                <div style={{ marginBottom: '20px' }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: '#fca5a5',
                    marginBottom: '8px'
                  }}>
                    補足
                  </div>
                  <div style={{
                    fontSize: '16px',
                    color: '#e5e7eb',
                    lineHeight: '1.8',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    padding: '12px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '6px',
                    border: '1px solid rgba(185, 28, 28, 0.2)'
                  }}>
                    <TextWithIcons 
                      text={selectedMemo.content}
                      size="lg"
                      textClassName="text-gray-200"
                      showFallback={false}
                      enableIconReplacement={true}
                    />
                  </div>
                </div>
              )}

              <div style={{
                fontSize: '13px',
                color: '#6b7280',
                paddingTop: '20px',
                borderTop: '1px solid rgba(185, 28, 28, 0.3)',
                marginBottom: '20px'
              }}>
                作成: {new Date(selectedMemo.createdAt).toLocaleString('ja-JP')}
                {selectedMemo.updatedAt !== selectedMemo.createdAt && (
                  <> / 更新: {new Date(selectedMemo.updatedAt).toLocaleString('ja-JP')}</>
                )}
              </div>

              <div style={{
                display: 'flex',
                gap: '10px',
                justifyContent: 'flex-end'
              }}>
                <a
                  href={`/memo/edit/${selectedMemo.id}`}
                  style={{
                    padding: '10px 24px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    background: 'rgba(59, 130, 246, 0.3)',
                    border: '2px solid rgba(59, 130, 246, 0.5)',
                    borderRadius: '6px',
                    color: '#60a5fa',
                    cursor: 'pointer',
                    textDecoration: 'none',
                    display: 'inline-block'
                  }}
                >
                  編集
                </a>
                <button
                  onClick={() => {
                    handleDelete(selectedMemo.id);
                    setShowDetail(false);
                  }}
                  style={{
                    padding: '10px 24px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    background: 'rgba(239, 68, 68, 0.3)',
                    border: '2px solid rgba(239, 68, 68, 0.5)',
                    borderRadius: '6px',
                    color: '#fca5a5',
                    cursor: 'pointer'
                  }}
                >
                  削除
                </button>
                <button
                  onClick={() => setShowDetail(false)}
                  style={{
                    padding: '10px 24px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    background: 'linear-gradient(135deg, #dc2626, #991b1b)',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#ffffff',
                    cursor: 'pointer'
                  }}
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
