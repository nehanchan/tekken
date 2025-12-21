// src/app/combo/list/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { client } from '@/lib/client';

interface Character {
  id: string;
  character_id: string;
  character_name_en: string;
  character_name_jp?: string | null;
  display_name?: string | null;
}

interface Combo {
  id: string;
  character_id: string;
  character_name?: string | null;
  title: string;
  description?: string | null;
  difficulty?: number | null;
  damage?: number | null;
  importance?: number | null;
  nodes: string;
  display_mode?: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function ComboListPage() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [filteredCombos, setFilteredCombos] = useState<Combo[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [selectedImportance, setSelectedImportance] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterCombos();
  }, [combos, selectedCharacter, selectedDifficulty, selectedImportance, searchQuery]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // キャラクター取得
      const { data: charData } = await client.models.Character.list({ authMode: 'apiKey' });
      const validChars = (charData || []).filter(c => c !== null) as Character[];
      const sortedChars = validChars.sort((a, b) => {
        const idA = String(a.character_id).padStart(3, '0');
        const idB = String(b.character_id).padStart(3, '0');
        return idA.localeCompare(idB);
      });
      setCharacters(sortedChars);

      // コンボ取得
      const { data: comboData } = await client.models.Combo.list({ authMode: 'apiKey' });
      const validCombos = (comboData || []).filter(c => c !== null) as Combo[];
      const sortedCombos = validCombos.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setCombos(sortedCombos);
    } catch (error) {
      console.error('データ取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterCombos = () => {
    let filtered = [...combos];

    // キャラクターフィルター
    if (selectedCharacter) {
      filtered = filtered.filter(c => c.character_id === selectedCharacter);
    }

    // 難易度フィルター
    if (selectedDifficulty) {
      filtered = filtered.filter(c => c.difficulty === parseInt(selectedDifficulty));
    }

    // 重要度フィルター
    if (selectedImportance) {
      filtered = filtered.filter(c => c.importance === parseInt(selectedImportance));
    }

    // 検索フィルター
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        c.title.toLowerCase().includes(query) ||
        (c.description && c.description.toLowerCase().includes(query)) ||
        (c.character_name && c.character_name.toLowerCase().includes(query))
      );
    }

    setFilteredCombos(filtered);
  };

  const resetFilters = () => {
    setSelectedCharacter('');
    setSelectedDifficulty('');
    setSelectedImportance('');
    setSearchQuery('');
  };

  const getDisplayName = (char: Character) => {
    return char.display_name || char.character_name_jp || char.character_name_en;
  };

  const deleteCombo = async (comboId: string) => {
    if (!confirm('このコンボを削除しますか?')) return;

    try {
      await client.models.Combo.delete({ id: comboId }, { authMode: 'apiKey' });
      setCombos(combos.filter(c => c.id !== comboId));
      alert('削除しました');
    } catch (error) {
      console.error('削除エラー:', error);
      alert('削除に失敗しました');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #000000 0%, #1a0505 50%, #000000 100%)',
      padding: '20px'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* ヘッダー */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px'
        }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#ffffff',
            letterSpacing: '2px'
          }}>
            コンボ一覧
          </h1>
          <div style={{ display: 'flex', gap: '10px' }}>
            <a href="/combo/create" style={{
              padding: '10px 20px',
              background: 'rgba(34, 197, 94, 0.3)',
              border: '2px solid rgba(34, 197, 94, 0.5)',
              borderRadius: '6px',
              color: '#86efac',
              textDecoration: 'none',
              fontWeight: 'bold'
            }}>
              新規作成
            </a>
            <a href="/" style={{
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #dc2626, #991b1b)',
              border: 'none',
              borderRadius: '6px',
              color: '#ffffff',
              textDecoration: 'none',
              fontWeight: 'bold'
            }}>
              トップ
            </a>
          </div>
        </div>

        {/* フィルターエリア */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.8)',
          border: '2px solid rgba(185, 28, 28, 0.3)',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '30px'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '15px',
            marginBottom: '15px'
          }}>
            {/* キャラクターフィルター */}
            <div>
              <label style={{
                display: 'block',
                color: '#fca5a5',
                fontSize: '13px',
                fontWeight: 'bold',
                marginBottom: '6px'
              }}>
                キャラクター
              </label>
              <select
                value={selectedCharacter}
                onChange={(e) => setSelectedCharacter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  background: 'rgba(0, 0, 0, 0.6)',
                  border: '1px solid rgba(185, 28, 28, 0.4)',
                  borderRadius: '4px',
                  color: '#ffffff',
                  fontSize: '13px'
                }}
              >
                <option value="">すべて</option>
                {characters.map(char => (
                  <option key={char.id} value={char.character_id}>
                    {getDisplayName(char)}
                  </option>
                ))}
              </select>
            </div>

            {/* 難易度フィルター */}
            <div>
              <label style={{
                display: 'block',
                color: '#fca5a5',
                fontSize: '13px',
                fontWeight: 'bold',
                marginBottom: '6px'
              }}>
                難易度
              </label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  background: 'rgba(0, 0, 0, 0.6)',
                  border: '1px solid rgba(185, 28, 28, 0.4)',
                  borderRadius: '4px',
                  color: '#ffffff',
                  fontSize: '13px'
                }}
              >
                <option value="">すべて</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
              </select>
            </div>

            {/* 重要度フィルター */}
            <div>
              <label style={{
                display: 'block',
                color: '#fca5a5',
                fontSize: '13px',
                fontWeight: 'bold',
                marginBottom: '6px'
              }}>
                重要度
              </label>
              <select
                value={selectedImportance}
                onChange={(e) => setSelectedImportance(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  background: 'rgba(0, 0, 0, 0.6)',
                  border: '1px solid rgba(185, 28, 28, 0.4)',
                  borderRadius: '4px',
                  color: '#ffffff',
                  fontSize: '13px'
                }}
              >
                <option value="">すべて</option>
                <option value="1">★1</option>
                <option value="2">★2</option>
                <option value="3">★3</option>
                <option value="4">★4</option>
                <option value="5">★5</option>
              </select>
            </div>

            {/* 検索 */}
            <div>
              <label style={{
                display: 'block',
                color: '#fca5a5',
                fontSize: '13px',
                fontWeight: 'bold',
                marginBottom: '6px'
              }}>
                検索
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="タイトル、説明で検索"
                style={{
                  width: '100%',
                  padding: '8px',
                  background: 'rgba(0, 0, 0, 0.6)',
                  border: '1px solid rgba(185, 28, 28, 0.4)',
                  borderRadius: '4px',
                  color: '#ffffff',
                  fontSize: '13px'
                }}
              />
            </div>
          </div>

          {/* リセットボタン */}
          <div style={{ textAlign: 'right' }}>
            <button
              onClick={resetFilters}
              style={{
                padding: '8px 20px',
                background: 'rgba(107, 114, 128, 0.3)',
                border: '2px solid rgba(107, 114, 128, 0.5)',
                borderRadius: '4px',
                color: '#9ca3af',
                fontSize: '13px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              フィルターをリセット
            </button>
          </div>
        </div>

        {/* 結果表示 */}
        <div style={{
          color: '#9ca3af',
          fontSize: '14px',
          marginBottom: '20px'
        }}>
          {loading ? (
            '読み込み中...'
          ) : (
            `${filteredCombos.length}件のコンボ`
          )}
        </div>

        {/* コンボグリッド */}
        {loading ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#6b7280',
            fontSize: '16px'
          }}>
            読み込み中...
          </div>
        ) : filteredCombos.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#6b7280',
            fontSize: '16px'
          }}>
            コンボが見つかりませんでした
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '20px'
          }}>
            {filteredCombos.map(combo => (
              <div
                key={combo.id}
                style={{
                  background: 'rgba(0, 0, 0, 0.8)',
                  border: '2px solid rgba(185, 28, 28, 0.3)',
                  borderRadius: '8px',
                  padding: '20px',
                  transition: 'all 0.3s',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.6)';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(185, 28, 28, 0.3)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* キャラクター名 */}
                <div style={{
                  fontSize: '12px',
                  color: '#60a5fa',
                  fontWeight: 'bold',
                  marginBottom: '8px'
                }}>
                  {combo.character_name || `ID: ${combo.character_id}`}
                </div>

                {/* タイトル */}
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: '#fca5a5',
                  marginBottom: '12px'
                }}>
                  {combo.title}
                </h3>

                {/* 説明 */}
                {combo.description && (
                  <p style={{
                    fontSize: '13px',
                    color: '#d1d5db',
                    marginBottom: '15px',
                    lineHeight: '1.5',
                    maxHeight: '60px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical'
                  }}>
                    {combo.description}
                  </p>
                )}

                {/* メタ情報 */}
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  marginBottom: '15px',
                  flexWrap: 'wrap'
                }}>
                  {combo.difficulty && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <span style={{ fontSize: '11px', color: '#9ca3af' }}>難易度:</span>
                      <span style={{
                        fontSize: '14px',
                        fontWeight: 'bold',
                        color: '#fca5a5'
                      }}>
                        {combo.difficulty}
                      </span>
                    </div>
                  )}

                  {combo.damage && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <span style={{ fontSize: '11px', color: '#9ca3af' }}>ダメージ:</span>
                      <span style={{
                        fontSize: '14px',
                        fontWeight: 'bold',
                        color: '#fbbf24'
                      }}>
                        {combo.damage}
                      </span>
                    </div>
                  )}

                  {combo.importance && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2px'
                    }}>
                      {Array.from({ length: combo.importance }).map((_, i) => (
                        <span key={i} style={{ color: '#fbbf24', fontSize: '16px' }}>★</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* 作成日 */}
                <div style={{
                  fontSize: '11px',
                  color: '#6b7280',
                  marginBottom: '15px'
                }}>
                  作成日: {new Date(combo.createdAt).toLocaleDateString('ja-JP')}
                </div>

                {/* ボタン */}
                <div style={{
                  display: 'flex',
                  gap: '10px'
                }}>
                  <a
                    href={`/combo/${combo.id}`}
                    style={{
                      flex: 1,
                      padding: '8px',
                      background: 'rgba(59, 130, 246, 0.3)',
                      border: '2px solid rgba(59, 130, 246, 0.5)',
                      borderRadius: '4px',
                      color: '#60a5fa',
                      textAlign: 'center',
                      textDecoration: 'none',
                      fontSize: '13px',
                      fontWeight: 'bold'
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    詳細
                  </a>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteCombo(combo.id);
                    }}
                    style={{
                      padding: '8px 16px',
                      background: 'rgba(239, 68, 68, 0.3)',
                      border: '2px solid rgba(239, 68, 68, 0.5)',
                      borderRadius: '4px',
                      color: '#fca5a5',
                      fontSize: '13px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    削除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
