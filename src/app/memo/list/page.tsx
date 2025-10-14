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
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedMemo, setSelectedMemo] = useState<Memo | null>(null);
  const [showDetail, setShowDetail] = useState(false);

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
    if (selectedCharacter === 'all') {
      setFilteredMemos(memos);
    } else {
      setFilteredMemos(memos.filter(memo => memo.character_id === selectedCharacter));
    }
  }, [selectedCharacter, memos]);

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

  const renderStars = (importance: number | null | undefined) => {
    const stars = importance || 0;
    return (
      <div style={{ display: 'flex', gap: '2px' }}>
        {[1, 2, 3, 4, 5].map(star => (
          <span
            key={star}
            style={{
              fontSize: '16px',
              color: star <= stars ? '#fbbf24' : '#4b5563'
            }}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  const uniqueCharacters = Array.from(
    new Set(memos.map(memo => memo.character_id))
  );

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
        padding: isMobile ? '20px' : '40px 20px',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* ヘッダー */}
        <div style={{
          textAlign: 'center',
          marginBottom: '40px'
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
        </div>

        {/* フィルター＆ボタン */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          <select
            value={selectedCharacter}
            onChange={(e) => setSelectedCharacter(e.target.value)}
            style={{
              padding: '10px 16px',
              fontSize: '14px',
              background: 'rgba(0, 0, 0, 0.6)',
              border: '2px solid rgba(185, 28, 28, 0.4)',
              borderRadius: '6px',
              color: '#ffffff',
              cursor: 'pointer',
              outline: 'none',
              minWidth: '200px'
            }}
          >
            <option value="all">全キャラクター ({memos.length})</option>
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
                メモがありません
              </div>
            </div>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
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
                  padding: '2px',
                  borderRadius: '8px',
                  boxShadow: '0 4px 10px rgba(0, 0, 0, 0.5)'
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
                  padding: isMobile ? '16px' : '20px 24px',
                  display: 'flex',
                  gap: isMobile ? '12px' : '20px',
                  alignItems: 'flex-start'
                }}>
                  {/* 最左：キャラクター画像 */}
                  <div style={{
                    width: isMobile ? '80px' : '100px',
                    height: isMobile ? '80px' : '100px',
                    flexShrink: 0,
                    position: 'relative',
                    overflow: 'hidden',
                    borderRadius: '6px',
                    background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 50%, #1a1a1a 100%)',
                    border: '2px solid rgba(185, 28, 28, 0.4)',
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
                        objectFit: 'contain',
                        objectPosition: 'center',
                        imageRendering: 'crisp-edges'
                      }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (!target.dataset.fallbackAttempted) {
                          target.dataset.fallbackAttempted = 'true';
                          target.src = `/character-faces-mobile/${memo.character_id}.png`;
                        } else {
                          // 両方とも失敗した場合はプレースホルダーを表示
                          target.style.display = 'none';
                          const placeholder = document.createElement('div');
                          placeholder.style.width = '100%';
                          placeholder.style.height = '100%';
                          placeholder.style.display = 'flex';
                          placeholder.style.alignItems = 'center';
                          placeholder.style.justifyContent = 'center';
                          placeholder.style.fontSize = isMobile ? '32px' : '40px';
                          placeholder.textContent = '🥊';
                          target.parentNode?.appendChild(placeholder);
                        }
                      }}
                    />
                  </div>

                  {/* 左側：キャラクター名と重要度 */}
                  <div style={{
                    minWidth: isMobile ? '80px' : '120px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    <div style={{
                      fontSize: isMobile ? '13px' : '14px',
                      color: '#60a5fa',
                      fontWeight: '600',
                      whiteSpace: 'nowrap'
                    }}>
                      {memo.character_name || memo.character_id}
                    </div>
                    {renderStars(memo.importance)}
                  </div>

                  {/* 中央：メモ内容 */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{
                      fontSize: isMobile ? '16px' : '18px',
                      fontWeight: 'bold',
                      color: '#fef2f2',
                      marginBottom: '8px',
                      lineHeight: '1.4'
                    }}>
                      <TextWithIcons 
                        text={memo.title}
                        size="md"
                        textClassName="text-red-50 font-bold"
                        showFallback={false}
                        enableIconReplacement={true}
                      />
                    </h3>

                    {memo.categories && memo.categories.length > 0 && (
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '6px',
                        marginBottom: '8px'
                      }}>
                        {memo.categories.filter(c => c !== null).map((category, idx) => (
                          <span
                            key={idx}
                            style={{
                              fontSize: '11px',
                              padding: '3px 8px',
                              background: 'rgba(185, 28, 28, 0.3)',
                              border: '1px solid rgba(248, 113, 113, 0.5)',
                              borderRadius: '4px',
                              color: '#fca5a5'
                            }}
                          >
                            {category}
                          </span>
                        ))}
                      </div>
                    )}

                    {memo.content && !isMobile && (
                      <div style={{ marginTop: '8px' }}>
                        <div style={{
                          fontSize: '11px',
                          color: '#9ca3af',
                          marginBottom: '4px'
                        }}>
                          補足:
                        </div>
                        <div style={{
                          fontSize: '13px',
                          color: '#d1d5db',
                          lineHeight: '1.5',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}>
                          <TextWithIcons 
                            text={memo.content}
                            size="md"
                            textClassName="text-gray-300"
                            showFallback={false}
                            enableIconReplacement={true}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 右側：日付 */}
                  <div style={{
                    minWidth: isMobile ? '60px' : '100px',
                    textAlign: 'right'
                  }}>
                    <div style={{
                      fontSize: '12px',
                      color: '#6b7280'
                    }}>
                      {new Date(memo.createdAt).toLocaleDateString('ja-JP', {
                        year: 'numeric',
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
                {renderStars(selectedMemo.importance)}
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