'use client';

import React, { useState, useEffect } from 'react';
import { client } from '@/lib/client';
import { TextWithIcons } from '@/components/CommandDisplay';
import Link from 'next/link';

interface Character {
  id: string;
  character_id: string;
  character_name_en: string;
  character_name_jp?: string | null;
  display_name?: string | null;
  portrait_url?: string | null;
}

interface Combo {
  id: string;
  character_id: string;
  character_name?: string;
  combo_name?: string;
  title?: string;
  damage?: number;
  difficulty?: number;
  notes?: string;
  description?: string;
  category?: string;
  importance?: number;
  nodes?: string;
  display_mode?: 'move_name' | 'command';
  created_at?: string;
  updated_at?: string;
}

// 背景色定義
const BACKGROUND_COLORS = {
  blue: '#60a5fa',
  orange: '#ff9500',
  red: '#ff8787',
  green: '#69db7c',
  yellow: '#ffd700',
  gray: '#4b5563',      // ダークグレーに変更
  purple: '#cc9dff',
  cyan: '#66d9e8',
};

// Hex colorをRGBAに変換する関数
const hexToRgba = (hex: string, alpha: number = 0.5): { bg: string; border: string } => {
  const rgbMatch = hex.match(/^#([A-Fa-f0-9]{6})$/);
  
  if (rgbMatch) {
    const hexValue = rgbMatch[1];
    const r = parseInt(hexValue.substr(0, 2), 16);
    const g = parseInt(hexValue.substr(2, 2), 16);
    const b = parseInt(hexValue.substr(4, 2), 16);
    
    return {
      bg: `rgba(${r}, ${g}, ${b}, ${alpha})`,
      border: `rgba(${r}, ${g}, ${b}, ${alpha * 0.8})`
    };
  }
  
  // デフォルト（青）
  return {
    bg: 'rgba(96, 165, 250, 0.5)',
    border: 'rgba(96, 165, 250, 0.4)'
  };
};

export default function ComboListPage() {
  const [combos, setCombos] = useState<Combo[]>([]);
  const [characters, setCharacters] = useState<{ [key: string]: Character }>({});
  const [loading, setLoading] = useState(true);
  const [selectedCharacter, setSelectedCharacter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'created_at' | 'damage' | 'difficulty'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // キャラクター一覧を取得
      const charactersResponse = await client.models.Character.list({ authMode: 'apiKey' });
      const charactersList = (charactersResponse.data || []).filter(c => c !== null) as Character[];
      const charactersMap: { [key: string]: Character } = {};
      charactersList.forEach((char: Character) => {
        // character_idをキーとして使用
        charactersMap[char.character_id] = char;
      });
      setCharacters(charactersMap);

      // コンボ一覧を取得
      const combosResponse = await client.models.Combo.list({ authMode: 'apiKey' });
      const combosList = (combosResponse.data || []).filter(c => c !== null) as Combo[];
      setCombos(combosList);
    } catch (error) {
      console.error('データの読み込みに失敗しました:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderComboPreview = (combo: Combo) => {
    try {
      if (!combo.nodes) return <span style={{ color: '#6b7280', fontSize: '12px' }}>ノードなし</span>;
      
      const treeData = JSON.parse(combo.nodes);
      const displayMode = combo.display_mode || 'move_name';
      
      const getNodeText = (nodeId: string) => {
        const node = treeData.nodes[nodeId];
        if (!node) return '未設定';
        
        if (displayMode === 'move_name') {
          return node.moveName || node.freeText || '未設定';
        } else {
          return node.command || node.freeText || '未設定';
        }
      };

      // ノードの背景色を取得する関数
      const getNodeColors = (nodeId: string) => {
        const node = treeData.nodes[nodeId];
        if (!node) {
          return hexToRgba(BACKGROUND_COLORS.blue, 0.5);
        }
        
        // 背景色プロパティを取得
        const backgroundColor = node.backgroundColor || BACKGROUND_COLORS.blue;
        
        return hexToRgba(backgroundColor, 0.5);
      };

      // ツリーを平坦化してすべてのノードを取得
      const flattenTree = (nodeId: string, result: string[] = []): string[] => {
        result.push(nodeId);
        const node = treeData.nodes[nodeId];
        if (node && node.children && node.children.length > 0) {
          node.children.forEach((childId: string) => flattenTree(childId, result));
        }
        return result;
      };

      // すべてのルートノードから始めてツリーを平坦化
      const allNodeIds: string[] = [];
      treeData.rootIds.forEach((rootId: string) => {
        flattenTree(rootId, allNodeIds);
      });

      return (
        <>
          {allNodeIds.map((nodeId: string, index: number) => {
            const colors = getNodeColors(nodeId);
            
            return (
              <React.Fragment key={nodeId}>
                {index > 0 && <span style={{ color: '#6b7280', fontSize: '12px', margin: '0 3px' }}>＜</span>}
                <span style={{ 
                  padding: '2px 6px', 
                  background: colors.bg,
                  border: `1px solid ${colors.border}`, 
                  borderRadius: '8px', 
                  fontSize: '12px', 
                  color: '#ffffff',
                  fontWeight: '500',
                  whiteSpace: 'nowrap',
                  display: 'inline-block'
                }}>
                  <TextWithIcons text={getNodeText(nodeId)} size="sm" showFallback={false} enableIconReplacement={true} />
                </span>
              </React.Fragment>
            );
          })}
        </>
      );
    } catch (error) {
      console.error('Combo preview error:', error);
      return <span style={{ color: '#ef4444', fontSize: '12px' }}>エラー</span>;
    }
  };

  const getDifficultyLabel = (difficulty?: number) => {
    if (!difficulty) return '未設定';
    if (difficulty <= 2) return '簡単';
    if (difficulty <= 4) return '普通';
    return '難しい';
  };

  const getDifficultyColor = (difficulty?: number) => {
    if (!difficulty) return '#6b7280';
    if (difficulty <= 2) return '#10b981';
    if (difficulty <= 4) return '#f59e0b';
    return '#ef4444';
  };

  const filteredAndSortedCombos = combos
    .filter(combo => {
      if (selectedCharacter === 'all') return true;
      // character_idで比較（文字列として）
      return String(combo.character_id) === String(selectedCharacter);
    })
    .sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'created_at') {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        comparison = dateA - dateB;
      } else if (sortBy === 'damage') {
        comparison = (a.damage || 0) - (b.damage || 0);
      } else if (sortBy === 'difficulty') {
        comparison = (a.difficulty || 0) - (b.difficulty || 0);
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const handleDelete = async (comboId: string) => {
    if (!confirm('このコンボを削除してもよろしいですか?')) return;

    try {
      await client.models.Combo.delete({ id: comboId }, { authMode: 'apiKey' });
      setCombos(combos.filter(combo => combo.id !== comboId));
    } catch (error) {
      console.error('コンボの削除に失敗しました:', error);
      alert('コンボの削除に失敗しました');
    }
  };

  const getDisplayName = (char: Character) => {
    return char.display_name || char.character_name_jp || char.character_name_en;
  };

  const getCharacterName = (characterId: string) => {
    const char = characters[characterId];
    return char ? getDisplayName(char) : '不明';
  };

  const getComboTitle = (combo: Combo) => {
    return combo.title || combo.combo_name || '無題のコンボ';
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #000000 0%, #1a0505 50%, #000000 100%)',
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        padding: '40px 20px'
      }}>
        <div style={{ color: '#fca5a5', fontSize: '18px', fontWeight: 'bold' }}>読み込み中...</div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #000000 0%, #1a0505 50%, #000000 100%)',
      padding: '40px 20px'
    }}>
      
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
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
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#ffffff',
            letterSpacing: '4px',
            textTransform: 'uppercase',
            textShadow: '2px 2px 4px rgba(0,0,0,0.9)',
            padding: '10px 40px',
            margin: 0
          }}>
            コンボ一覧
          </h1>
        </div>
      </div>

      {/* フィルターとソート */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        gap: '15px', 
        marginBottom: '30px'
      }}>
        {/* フィルター行 */}
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
              marginRight: '8px', 
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
              <option value="all">すべて</option>
              {Object.values(characters).map(char => (
                <option key={char.id} value={char.character_id}>
                  {getDisplayName(char)}
                </option>
              ))}
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
              marginRight: '8px', 
              fontWeight: '600',
              whiteSpace: 'nowrap'
            }}>
              並び替え:
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
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
              <option value="created_at">作成日時</option>
              <option value="damage">ダメージ</option>
              <option value="difficulty">難易度</option>
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
              marginRight: '8px', 
              fontWeight: '600',
              whiteSpace: 'nowrap'
            }}>
              順序:
            </label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
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
              <option value="desc">降順</option>
              <option value="asc">昇順</option>
            </select>
          </div>
        </div>

        {/* ボタン行 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{
            fontSize: '13px',
            color: '#9ca3af'
          }}>
            {filteredAndSortedCombos.length > 0 && (
              <>全{filteredAndSortedCombos.length}件</>
            )}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link 
              href="/combo/create"
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
            </Link>
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

      {/* コンボリスト */}
      {filteredAndSortedCombos.length === 0 ? (
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
              コンボが見つかりませんでした
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
          {filteredAndSortedCombos.map(combo => (
            <div
              key={combo.id}
              style={{
                position: 'relative'
              }}
            >
              {/* 赤いボーダー */}
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

              {/* コンテンツ */}
              <div style={{
                position: 'relative',
                padding: '14px 10px',
                display: 'flex',
                gap: '10px',
                alignItems: 'center'
              }}>
                {/* キャラクター画像 */}
                <div style={{
                  width: '50px',
                  minWidth: '50px',
                  maxWidth: '50px',
                  height: '50px',
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
                    src={`/character-faces/${combo.character_id}.png`}
                    alt={getCharacterName(combo.character_id)}
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
                        target.src = `/character-faces-mobile/${combo.character_id}.png`;
                      } else {
                        target.style.display = 'none';
                        const placeholder = document.createElement('div');
                        placeholder.style.width = '100%';
                        placeholder.style.height = '100%';
                        placeholder.style.display = 'flex';
                        placeholder.style.alignItems = 'center';
                        placeholder.style.justifyContent = 'center';
                        placeholder.style.fontSize = '24px';
                        placeholder.textContent = '🥊';
                        target.parentNode?.appendChild(placeholder);
                      }
                    }}
                  />
                </div>

                {/* キャラクター名とダメージ */}
                <div style={{
                  width: '100px',
                  minWidth: '100px',
                  maxWidth: '100px',
                  flexShrink: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px'
                }}>
                  <div style={{
                    fontSize: '13px',
                    color: '#60a5fa',
                    fontWeight: '600',
                    whiteSpace: 'nowrap',
                    lineHeight: '1.2',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {getCharacterName(combo.character_id)}
                  </div>
                  {combo.damage && (
                    <div style={{
                      fontSize: '12px',
                      color: '#ef4444',
                      fontWeight: '600'
                    }}>
                      {combo.damage}
                    </div>
                  )}
                </div>

                {/* 難易度と重要度 */}
                <div style={{
                  width: '100px',
                  minWidth: '100px',
                  maxWidth: '100px',
                  flexShrink: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px'
                }}>
                  {combo.difficulty && (
                    <div style={{
                      fontSize: '11px',
                      color: getDifficultyColor(combo.difficulty),
                      fontWeight: '600'
                    }}>
                      難易度: {getDifficultyLabel(combo.difficulty)}
                    </div>
                  )}
                  {combo.importance && (
                    <div style={{ display: 'flex', gap: '1px' }}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <span
                          key={star}
                          style={{
                            fontSize: '11px',
                            color: star <= combo.importance! ? '#fbbf24' : '#4b5563',
                            lineHeight: '1'
                          }}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* コンボタイトル */}
                <div style={{
                  width: '250px',
                  minWidth: '250px',
                  maxWidth: '250px',
                  flex: '0 0 250px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: '#fef2f2',
                    lineHeight: '1.3',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {getComboTitle(combo)}
                  </div>
                </div>

                {/* コンボプレビュー */}
                <div style={{
                  flex: '1 1 auto',
                  minWidth: 0,
                  overflow: 'hidden'
                }}>
                  <div style={{
                    fontSize: '12px',
                    lineHeight: '1.3',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {renderComboPreview(combo)}
                  </div>
                </div>

                {/* ボタン */}
                <div style={{
                  width: '120px',
                  minWidth: '120px',
                  maxWidth: '120px',
                  flexShrink: 0,
                  display: 'flex',
                  gap: '4px',
                  justifyContent: 'flex-end'
                }}>
                  <Link
                    href={`/combo/edit/${combo.id}`}
                    style={{
                      padding: '6px 12px',
                      background: 'rgba(59, 130, 246, 0.3)',
                      border: '1px solid rgba(59, 130, 246, 0.5)',
                      borderRadius: '4px',
                      color: '#60a5fa',
                      textDecoration: 'none',
                      fontSize: '13px',
                      fontWeight: 'bold'
                    }}
                  >
                    編集
                  </Link>
                  <button
                    onClick={() => handleDelete(combo.id)}
                    style={{
                      padding: '6px 12px',
                      background: 'rgba(239, 68, 68, 0.3)',
                      border: '1px solid rgba(239, 68, 68, 0.5)',
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
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
