'use client';

import { useState, useEffect } from 'react';
import { client } from '@/lib/client';
import { TextWithIcons } from '@/components/CommandDisplay';

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
  const [menuOpen, setMenuOpen] = useState(false); // ハンバーガーメニューの状態
  const [editMode, setEditMode] = useState(false); // 編集モードの状態
  const [editedMemo, setEditedMemo] = useState<Partial<Memo>>({});
  const [availableCharacters, setAvailableCharacters] = useState<{id: string; name: string}[]>([]);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    fetchMemos();
    fetchCharacters();
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const fetchCharacters = async () => {
    try {
      const { data } = await client.models.Character.list({ authMode: 'apiKey' });
      const validCharacters = (data || []).filter(c => c !== null);
      const characters = validCharacters.map((c: any) => ({
        id: c.character_id,
        name: c.display_name || c.character_name_jp || c.character_name_en || c.character_id
      }));
      setAvailableCharacters(characters);
    } catch (error) {
      console.error('キャラクター取得エラー:', error);
    }
  };

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
      const { data } = await client.models.Memo.list({ authMode: 'apiKey' });
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
        authMode: 'apiKey'
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

  const handleEdit = () => {
    if (selectedMemo) {
      setEditMode(true);
      setEditedMemo({
        ...selectedMemo
      });
    }
  };

  const handleSave = async () => {
    if (!editedMemo.id) return;

    try {
      const result = await client.models.Memo.update({
        id: editedMemo.id,
        character_id: editedMemo.character_id,
        character_name: editedMemo.character_name,
        categories: editedMemo.categories,
        title: editedMemo.title,
        content: editedMemo.content,
        importance: editedMemo.importance
      }, {
        authMode: 'apiKey'
      });

      if (result.data) {
        alert('メモを更新しました');
        setEditMode(false);
        fetchMemos();
        setShowDetail(false);
      } else {
        throw new Error('更新に失敗しました');
      }
    } catch (error) {
      console.error('更新エラー:', error);
      if (error instanceof Error) {
        alert(`更新に失敗しました: ${error.message}`);
      } else {
        alert('更新に失敗しました');
      }
    }
  };

  const handleCancel = () => {
    setEditMode(false);
    setEditedMemo({});
  };

  const CATEGORIES = [
    '確定反撃',
    'しゃがめる連携',
    '割れない連携',
    '潜る連携',
    'ファジー',
    '立ち回り',
    'その他'
  ];

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
            { label: 'TOP', href: '/', icon: '🏠' },
            { label: 'キャラクター', href: '/', icon: '👊' },
            { label: '対策メモ', href: '/memo/list', icon: '📝' },
            { label: 'コンボ', href: '/coming-soon?type=combo', icon: '⚡' },
            { label: 'カスタマイズ', href: '/coming-soon?type=customize', icon: '⚙️' }
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
                color: item.href === '/memo/list' ? '#fef2f2' : '#e5e7eb',
                textDecoration: 'none',
                fontSize: '16px',
                fontWeight: '600',
                borderLeft: '4px solid',
                borderLeftColor: item.href === '/memo/list' ? '#dc2626' : 'transparent',
                background: item.href === '/memo/list' ? 'rgba(185, 28, 28, 0.2)' : 'transparent',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (item.href !== '/memo/list') {
                  e.currentTarget.style.background = 'rgba(185, 28, 28, 0.2)';
                  e.currentTarget.style.borderLeftColor = '#dc2626';
                  e.currentTarget.style.color = '#fef2f2';
                }
              }}
              onMouseLeave={(e) => {
                if (item.href !== '/memo/list') {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderLeftColor = 'transparent';
                  e.currentTarget.style.color = '#e5e7eb';
                }
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
        overflow: 'hidden',
        marginLeft: menuOpen ? '300px' : '0',
        transition: 'margin-left 0.3s ease-in-out',
        width: menuOpen ? 'calc(100% - 300px)' : '100%'
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
          padding: isMobile ? '30px 20px' : '50px 30px',
          maxWidth: '1400px',
          margin: '0 auto'
        }}>
          {/* ヘッダー - サイズアップ */}
          <div style={{
            textAlign: 'center',
            marginBottom: '50px'
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
                fontSize: isMobile ? '32px' : '40px',
                fontWeight: 'bold',
                color: '#ffffff',
                letterSpacing: '4px',
                textTransform: 'uppercase',
                textShadow: '2px 2px 4px rgba(0,0,0,0.9)',
                padding: '15px 50px'
              }}>
                メモ一覧
              </h1>
            </div>
          </div>

          {/* フィルター＆ソート＆ボタン - サイズアップ */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            marginBottom: '40px'
          }}>
            {/* 上段：フィルター */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '15px',
              alignItems: 'center'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <label style={{
                  fontSize: '14px',
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
                    padding: '10px 16px',
                    fontSize: '15px',
                    background: 'rgba(0, 0, 0, 0.6)',
                    border: '2px solid rgba(185, 28, 28, 0.4)',
                    borderRadius: '6px',
                    color: '#ffffff',
                    cursor: 'pointer',
                    outline: 'none',
                    minWidth: '200px'
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
                gap: '10px'
              }}>
                <label style={{
                  fontSize: '14px',
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
                    padding: '10px 16px',
                    fontSize: '15px',
                    background: 'rgba(0, 0, 0, 0.6)',
                    border: '2px solid rgba(185, 28, 28, 0.4)',
                    borderRadius: '6px',
                    color: '#ffffff',
                    cursor: 'pointer',
                    outline: 'none',
                    minWidth: '180px'
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
                gap: '10px'
              }}>
                <label style={{
                  fontSize: '14px',
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
                    padding: '10px 16px',
                    fontSize: '15px',
                    background: 'rgba(0, 0, 0, 0.6)',
                    border: '2px solid rgba(185, 28, 28, 0.4)',
                    borderRadius: '6px',
                    color: '#ffffff',
                    cursor: 'pointer',
                    outline: 'none',
                    minWidth: '180px'
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
                    padding: '10px 20px',
                    fontSize: '15px',
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
              gap: '15px'
            }}>
              <div style={{
                fontSize: '15px',
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

              <div style={{ display: 'flex', gap: '15px' }}>
                <a
                  href="/memo"
                  style={{
                    padding: '12px 28px',
                    fontSize: '16px',
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
                    padding: '12px 28px',
                    fontSize: '16px',
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

          {/* メモリスト - サイズアップ */}
          {loading ? (
            <div style={{
              textAlign: 'center',
              padding: '120px 20px',
              color: '#fca5a5',
              fontSize: '24px'
            }}>
              読み込み中...
            </div>
          ) : filteredMemos.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '120px 20px'
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
                  padding: '50px 80px',
                  color: '#9ca3af',
                  fontSize: '18px'
                }}>
                  {memos.length === 0 ? (
                    'メモがありません'
                  ) : (
                    <>
                      <div style={{ marginBottom: '15px' }}>
                        条件に一致するメモがありません
                      </div>
                      <button
                        onClick={() => {
                          setSelectedCharacter('all');
                          setSelectedCategory('all');
                          setSortOrder('date');
                        }}
                        style={{
                          marginTop: '15px',
                          padding: '10px 20px',
                          fontSize: '15px',
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
              gap: '8px',
              maxWidth: '1200px',
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
                    padding: isMobile ? '12px' : '14px',
                    display: 'flex',
                    gap: isMobile ? '10px' : '15px',
                    alignItems: 'center'
                  }}>
                    {/* キャラクター画像（固定幅） - サイズアップ */}
                    <div style={{
                      width: isMobile ? '48px' : '56px',
                      minWidth: isMobile ? '48px' : '56px',
                      maxWidth: isMobile ? '48px' : '56px',
                      height: isMobile ? '48px' : '56px',
                      flexShrink: 0,
                      position: 'relative',
                      overflow: 'hidden',
                      borderRadius: '4px',
                      background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 50%, #1a1a1a 100%)',
                      border: '1px solid rgba(185, 28, 28, 0.4)',
                      display: 'flex',
                      alignItems: 'flex-end',
                      justifyContent: 'center'
                    }}>
                      <img
                        src={`/character-faces/${memo.character_id}.png`}
                        alt={memo.character_name || memo.character_id}
                        style={{
                          width: '120%',
                          height: 'auto',
                          minHeight: '100%',
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
                            placeholder.style.fontSize = isMobile ? '28px' : '32px';
                            placeholder.textContent = '🥊';
                            target.parentNode?.appendChild(placeholder);
                          }
                        }}
                      />
                    </div>

                    {/* キャラクター名と重要度（固定幅） - サイズアップ */}
                    <div style={{
                      width: isMobile ? '90px' : '120px',
                      minWidth: isMobile ? '90px' : '120px',
                      maxWidth: isMobile ? '90px' : '120px',
                      flexShrink: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}>
                      <div style={{
                        fontSize: isMobile ? '13px' : '14px',
                        color: '#60a5fa',
                        fontWeight: '600',
                        whiteSpace: 'nowrap',
                        lineHeight: '1.3',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {memo.character_name || memo.character_id}
                      </div>
                      <div style={{ display: 'flex', gap: '2px' }}>
                        {[1, 2, 3, 4, 5].map(star => (
                          <span
                            key={star}
                            style={{
                              fontSize: '12px',
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
                        width: '150px',
                        minWidth: '150px',
                        maxWidth: '150px',
                        flexShrink: 0,
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '4px',
                        alignContent: 'flex-start'
                      }}>
                        {memo.categories && memo.categories.length > 0 ? (
                          <>
                            {memo.categories.filter(c => c !== null).slice(0, 2).map((category, idx) => (
                              <span
                                key={idx}
                                style={{
                                  fontSize: '11px',
                                  padding: '2px 6px',
                                  background: 'rgba(185, 28, 28, 0.3)',
                                  border: '1px solid rgba(248, 113, 113, 0.5)',
                                  borderRadius: '3px',
                                  color: '#fca5a5',
                                  whiteSpace: 'nowrap',
                                  lineHeight: '1.3'
                                }}
                              >
                                {category}
                              </span>
                            ))}
                            {memo.categories.length > 2 && (
                              <span style={{
                                fontSize: '11px',
                                color: '#6b7280'
                              }}>
                                +{memo.categories.length - 2}
                              </span>
                            )}
                          </>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#4b5563' }}>-</span>
                        )}
                      </div>
                    )}

                    {/* 件名（左・固定幅） - サイズアップ */}
                    <div style={{
                      width: isMobile ? 'auto' : '350px',
                      minWidth: isMobile ? '0' : '350px',
                      maxWidth: isMobile ? 'none' : '350px',
                      flex: isMobile ? 1 : '0 0 350px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        fontSize: isMobile ? '14px' : '16px',
                        fontWeight: 'bold',
                        color: '#fef2f2',
                        lineHeight: '1.4',
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
                          fontSize: '13px',
                          color: '#9ca3af',
                          lineHeight: '1.4',
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
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 詳細モーダル - サイズアップ */}
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
                maxWidth: '800px',
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
                padding: '40px'
              }}>
                <button
                  onClick={() => setShowDetail(false)}
                  style={{
                    position: 'absolute',
                    top: '25px',
                    right: '25px',
                    background: 'rgba(185, 28, 28, 0.3)',
                    border: '1px solid rgba(185, 28, 28, 0.5)',
                    borderRadius: '50%',
                    width: '36px',
                    height: '36px',
                    color: '#fca5a5',
                    cursor: 'pointer',
                    fontSize: '20px'
                  }}
                >
                  ×
                </button>

                {!editMode ? (
                  <>
                    {/* 閲覧モード */}
                    <div style={{
                      display: 'flex',
                      gap: '20px',
                      marginBottom: '25px',
                      alignItems: 'flex-start'
                    }}>
                      {/* キャラクター画像 */}
                      <div style={{
                        width: '80px',
                        height: '80px',
                        flexShrink: 0,
                        position: 'relative',
                        overflow: 'hidden',
                        borderRadius: '6px',
                        background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 50%, #1a1a1a 100%)',
                        border: '2px solid rgba(185, 28, 28, 0.4)',
                        display: 'flex',
                        alignItems: 'flex-end',
                        justifyContent: 'center'
                      }}>
                        <img
                          src={`/character-faces/${selectedMemo.character_id}.png`}
                          alt={selectedMemo.character_name || selectedMemo.character_id}
                          style={{
                            width: '120%',
                            height: 'auto',
                            minHeight: '100%',
                            objectFit: 'cover',
                            objectPosition: 'center bottom',
                            imageRendering: 'crisp-edges'
                          }}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (!target.dataset.fallbackAttempted) {
                              target.dataset.fallbackAttempted = 'true';
                              target.src = `/character-faces-mobile/${selectedMemo.character_id}.png`;
                            } else {
                              target.style.display = 'none';
                              const placeholder = document.createElement('div');
                              placeholder.style.width = '100%';
                              placeholder.style.height = '100%';
                              placeholder.style.display = 'flex';
                              placeholder.style.alignItems = 'center';
                              placeholder.style.justifyContent = 'center';
                              placeholder.style.fontSize = '40px';
                              placeholder.textContent = '🥊';
                              target.parentNode?.appendChild(placeholder);
                            }
                          }}
                        />
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: '18px',
                          color: '#60a5fa',
                          fontWeight: '600',
                          marginBottom: '10px'
                        }}>
                          {selectedMemo.character_name || selectedMemo.character_id}
                        </div>
                        <div style={{ display: 'flex', gap: '3px' }}>
                          {[1, 2, 3, 4, 5].map(star => (
                            <span
                              key={star}
                              style={{
                                fontSize: '20px',
                                color: star <= (selectedMemo.importance || 0) ? '#fbbf24' : '#4b5563'
                              }}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* 分類を上に配置（位置変更） */}
                    {selectedMemo.categories && selectedMemo.categories.length > 0 && (
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '10px',
                        marginBottom: '25px'
                      }}>
                        {selectedMemo.categories.filter(c => c !== null).map((category, idx) => (
                          <span
                            key={idx}
                            style={{
                              fontSize: '15px',
                              padding: '8px 16px',
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

                    {/* 件名を下に配置（位置変更） */}
                    <h2 style={{
                      fontSize: '28px',
                      fontWeight: 'bold',
                      color: '#fef2f2',
                      marginBottom: '25px',
                      lineHeight: '1.5'
                    }}>
                      <TextWithIcons 
                        text={selectedMemo.title}
                        size="lg"
                        textClassName="text-red-50 font-bold"
                        showFallback={false}
                        enableIconReplacement={true}
                      />
                    </h2>

                    {selectedMemo.content && (
                      <div style={{ marginBottom: '25px' }}>
                        <div style={{
                          fontSize: '16px',
                          fontWeight: 'bold',
                          color: '#fca5a5',
                          marginBottom: '12px'
                        }}>
                          補足
                        </div>
                        <div style={{
                          fontSize: '18px',
                          color: '#e5e7eb',
                          lineHeight: '1.9',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          padding: '16px',
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
                      display: 'flex',
                      gap: '15px',
                      justifyContent: 'flex-end',
                      paddingTop: '25px',
                      borderTop: '1px solid rgba(185, 28, 28, 0.3)'
                    }}>
                      <button
                        onClick={() => handleEdit()}
                        style={{
                          padding: '12px 30px',
                          fontSize: '16px',
                          fontWeight: 'bold',
                          background: 'rgba(59, 130, 246, 0.3)',
                          border: '2px solid rgba(59, 130, 246, 0.5)',
                          borderRadius: '6px',
                          color: '#93c5fd',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(59, 130, 246, 0.5)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(59, 130, 246, 0.3)';
                        }}
                      >
                        編集
                      </button>
                      <button
                        onClick={() => {
                          handleDelete(selectedMemo.id);
                          setShowDetail(false);
                        }}
                        style={{
                          padding: '12px 30px',
                          fontSize: '16px',
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
                          padding: '12px 30px',
                          fontSize: '16px',
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
                  </>
                ) : (
                  <>
                    {/* 編集モード */}
                    <h3 style={{
                      fontSize: '24px',
                      fontWeight: 'bold',
                      color: '#fca5a5',
                      marginBottom: '25px'
                    }}>
                      メモを編集
                    </h3>

                    {/* 分類を上に配置（位置変更） */}
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{
                        fontSize: '14px',
                        color: '#d1d5db',
                        fontWeight: 'bold',
                        display: 'block',
                        marginBottom: '10px'
                      }}>
                        分類
                      </label>
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '8px'
                      }}>
                        {CATEGORIES.map(category => (
                          <label
                            key={category}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '8px 12px',
                              background: editedMemo.categories?.includes(category)
                                ? 'rgba(248, 113, 113, 0.3)'
                                : 'rgba(107, 114, 128, 0.2)',
                              border: editedMemo.categories?.includes(category)
                                ? '1px solid rgba(248, 113, 113, 0.6)'
                                : '1px solid rgba(107, 114, 128, 0.3)',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease'
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={editedMemo.categories?.includes(category) || false}
                              onChange={(e) => {
                                const newCategories = e.target.checked
                                  ? [...(editedMemo.categories || []), category]
                                  : (editedMemo.categories || []).filter(c => c !== category);
                                setEditedMemo({
                                  ...editedMemo,
                                  categories: newCategories
                                });
                              }}
                              style={{ cursor: 'pointer' }}
                            />
                            <span style={{ color: '#d1d5db', fontSize: '14px' }}>
                              {category}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* 件名を下に配置（位置変更） */}
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{
                        fontSize: '14px',
                        color: '#d1d5db',
                        fontWeight: 'bold',
                        display: 'block',
                        marginBottom: '8px'
                      }}>
                        件名
                      </label>
                      <input
                        type="text"
                        value={editedMemo.title || ''}
                        onChange={(e) => setEditedMemo({
                          ...editedMemo,
                          title: e.target.value
                        })}
                        style={{
                          width: '100%',
                          padding: '12px',
                          background: '#1f2937',
                          border: '1px solid rgba(248, 113, 113, 0.3)',
                          borderRadius: '6px',
                          color: '#ffffff',
                          fontSize: '14px',
                          boxSizing: 'border-box'
                        }}
                        placeholder="メモのタイトルを入力"
                      />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                      <label style={{
                        fontSize: '14px',
                        color: '#d1d5db',
                        fontWeight: 'bold',
                        display: 'block',
                        marginBottom: '8px'
                      }}>
                        補足
                      </label>
                      <textarea
                        value={editedMemo.content || ''}
                        onChange={(e) => setEditedMemo({
                          ...editedMemo,
                          content: e.target.value
                        })}
                        style={{
                          width: '100%',
                          minHeight: '150px',
                          padding: '12px',
                          background: '#1f2937',
                          border: '1px solid rgba(248, 113, 113, 0.3)',
                          borderRadius: '6px',
                          color: '#ffffff',
                          fontSize: '14px',
                          fontFamily: 'inherit',
                          boxSizing: 'border-box',
                          resize: 'vertical'
                        }}
                        placeholder="メモの内容を入力"
                      />
                    </div>

                    <div style={{
                      display: 'flex',
                      gap: '15px',
                      justifyContent: 'flex-end',
                      paddingTop: '25px',
                      borderTop: '1px solid rgba(185, 28, 28, 0.3)'
                    }}>
                      <button
                        onClick={handleSave}
                        style={{
                          padding: '12px 30px',
                          fontSize: '16px',
                          fontWeight: 'bold',
                          background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                          border: 'none',
                          borderRadius: '6px',
                          color: '#ffffff',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.opacity = '0.8';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.opacity = '1';
                        }}
                      >
                        保存
                      </button>
                      <button
                        onClick={handleCancel}
                        style={{
                          padding: '12px 30px',
                          fontSize: '16px',
                          fontWeight: 'bold',
                          background: 'rgba(107, 114, 128, 0.3)',
                          border: '2px solid rgba(107, 114, 128, 0.5)',
                          borderRadius: '6px',
                          color: '#d1d5db',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(107, 114, 128, 0.5)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(107, 114, 128, 0.3)';
                        }}
                      >
                        キャンセル
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}