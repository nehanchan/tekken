// src/app/combo/list/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { client } from '@/lib/client';
import { TextWithIcons } from '@/components/CommandDisplay';

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
  title?: string | null;
  description?: string | null;
  category?: string | null;
  difficulty?: number | null;
  damage?: number | null;
  importance?: number | null;
  nodes?: string | null;
  display_mode?: string | null;
  createdAt: string;
  updatedAt: string;
}

const COMBO_CATEGORIES = [
  { value: '', label: '未選択', order: 0 },
  { value: 'basic', label: '基本コンボ', order: 1 },
  { value: 'normal', label: '通常コンボ', order: 2 },
  { value: 'carry', label: '運び重視コンボ', order: 3 },
  { value: 'damage', label: '火力重視コンボ', order: 4 },
  { value: 'counter', label: 'カウンターヒットコンボ', order: 5 },
  { value: 'okizeme', label: '起き攻め重視コンボ', order: 6 },
  { value: 'stage', label: 'ステージギミックコンボ', order: 7 },
  { value: 'advanced', label: '高難度コンボ', order: 8 },
  { value: 'setup', label: 'セットアップ', order: 9 },
  { value: 'wakeup', label: '起き攻め', order: 10 },
];

export default function ComboListPage() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [filteredCombos, setFilteredCombos] = useState<Combo[]>([]);
  const [selectedCharacterId, setSelectedCharacterId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterAndSortCombos();
  }, [combos, selectedCharacterId]);

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
      setCombos(validCombos);
    } catch (error) {
      console.error('❌ データ取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryOrder = (category?: string | null) => {
    if (!category) return 999;
    const cat = COMBO_CATEGORIES.find(c => c.value === category);
    return cat ? cat.order : 999;
  };

  const filterAndSortCombos = () => {
    let filtered = [...combos];

    // キャラクターでフィルタ
    if (selectedCharacterId) {
      filtered = filtered.filter(combo => combo.character_id === selectedCharacterId);
    }

    // ソート: ①分類順 ②難易度順 ③重要度順
    filtered.sort((a, b) => {
      // ①分類順
      const categoryOrderA = getCategoryOrder(a.category);
      const categoryOrderB = getCategoryOrder(b.category);
      if (categoryOrderA !== categoryOrderB) {
        return categoryOrderA - categoryOrderB;
      }

      // ②難易度順（昇順）
      const diffA = a.difficulty || 999;
      const diffB = b.difficulty || 999;
      if (diffA !== diffB) {
        return diffA - diffB;
      }

      // ③重要度順（降順）
      const impA = a.importance || 0;
      const impB = b.importance || 0;
      return impB - impA;
    });

    setFilteredCombos(filtered);
  };

  const deleteCombo = async (comboId: string) => {
    if (!confirm('このコンボを削除しますか？')) return;
    
    try {
      await client.models.Combo.delete({ id: comboId }, { authMode: 'apiKey' });
      alert('コンボを削除しました');
      fetchData();
    } catch (error) {
      console.error('❌ 削除エラー:', error);
      alert('削除に失敗しました');
    }
  };

  const getDisplayName = (char: Character) => {
    return char.display_name || char.character_name_jp || char.character_name_en;
  };

  const getCategoryLabel = (value?: string | null) => {
    if (!value) return '未設定';
    const category = COMBO_CATEGORIES.find(cat => cat.value === value);
    return category ? category.label : value;
  };

  const getCharacterIconPath = (characterId: string) => {
    const paddedId = String(characterId).padStart(3, '0');
    return `/character-faces/${paddedId}.png`;
  };

  const renderComboPreview = (combo: Combo) => {
    try {
      if (!combo.nodes) return <div style={{ color: '#6b7280', fontSize: '11px' }}>ノードなし</div>;
      
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
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
          {allNodeIds.map((nodeId: string, index: number) => (
            <React.Fragment key={nodeId}>
              {index > 0 && <span style={{ color: '#6b7280', fontSize: '11px' }}>＜</span>}
              <div style={{ 
                padding: '2px 8px', 
                background: 'rgba(59, 130, 246, 0.2)', 
                border: '1px solid rgba(59, 130, 246, 0.3)', 
                borderRadius: '10px', 
                fontSize: '11px', 
                color: '#93c5fd' 
              }}>
                <TextWithIcons text={getNodeText(nodeId)} size="sm" showFallback={false} enableIconReplacement={true} />
              </div>
            </React.Fragment>
          ))}
        </div>
      );
    } catch (error) {
      return <div style={{ color: '#ef4444', fontSize: '11px' }}>エラー</div>;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #000000 0%, #1a0505 50%, #000000 100%)', padding: '15px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* ヘッダー */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffffff', letterSpacing: '1px', textShadow: '2px 2px 4px rgba(0,0,0,0.8)', margin: 0 }}>コンボ一覧</h1>
          <div style={{ display: 'flex', gap: '8px' }}>
            <a href="/combo/create" style={{ padding: '8px 16px', background: 'rgba(34, 197, 94, 0.3)', border: '2px solid rgba(34, 197, 94, 0.5)', borderRadius: '6px', color: '#86efac', textDecoration: 'none', fontWeight: 'bold', fontSize: '13px' }}>+ 新規作成</a>
            <a href="/" style={{ padding: '8px 16px', background: 'linear-gradient(135deg, #dc2626, #991b1b)', border: 'none', borderRadius: '6px', color: '#ffffff', textDecoration: 'none', fontWeight: 'bold', fontSize: '13px' }}>トップ</a>
          </div>
        </div>

        {/* フィルター */}
        <div style={{ background: 'rgba(0, 0, 0, 0.8)', border: '2px solid rgba(185, 28, 28, 0.3)', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <select value={selectedCharacterId} onChange={(e) => setSelectedCharacterId(e.target.value)} style={{ width: '100%', padding: '6px', background: 'rgba(0, 0, 0, 0.6)', border: '1px solid rgba(185, 28, 28, 0.4)', borderRadius: '4px', color: '#ffffff', fontSize: '12px' }}>
                <option value="">すべてのキャラクター</option>
                {characters.map(char => <option key={char.id} value={char.character_id}>{getDisplayName(char)}</option>)}
              </select>
            </div>
            <button onClick={() => setSelectedCharacterId('')} style={{ padding: '6px 14px', background: 'rgba(107, 114, 128, 0.3)', border: '2px solid rgba(107, 114, 128, 0.5)', borderRadius: '4px', color: '#9ca3af', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' }}>リセット</button>
            <div style={{ color: '#9ca3af', fontSize: '11px', whiteSpace: 'nowrap' }}>
              {filteredCombos.length}件
            </div>
          </div>
        </div>

        {/* コンボリスト */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af', fontSize: '14px' }}>読み込み中...</div>
        ) : filteredCombos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280', fontSize: '14px' }}>コンボが見つかりませんでした</div>
        ) : (
          <div style={{ display: 'grid', gap: '8px' }}>
            {filteredCombos.map(combo => (
              <div key={combo.id} style={{ background: 'rgba(0, 0, 0, 0.8)', border: '2px solid rgba(185, 28, 28, 0.3)', borderRadius: '6px', padding: '10px', transition: 'all 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)'; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(185, 28, 28, 0.3)'; }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {/* キャラクターアイコン */}
                  <div style={{ flexShrink: 0, width: '60px', height: '60px', position: 'relative' }}>
                    <img 
                      src={getCharacterIconPath(combo.character_id)} 
                      alt={combo.character_name || ''} 
                      style={{ 
                        width: '60px', 
                        height: '60px', 
                        borderRadius: '6px', 
                        border: '2px solid rgba(185, 28, 28, 0.4)', 
                        objectFit: 'cover',
                        background: 'rgba(0, 0, 0, 0.5)'
                      }}
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent && !parent.querySelector('.placeholder')) {
                          const placeholder = document.createElement('div');
                          placeholder.className = 'placeholder';
                          placeholder.style.cssText = `
                            width: 60px;
                            height: 60px;
                            border-radius: 6px;
                            border: 2px solid rgba(185, 28, 28, 0.4);
                            background: rgba(0, 0, 0, 0.5);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            color: #9ca3af;
                            font-size: 10px;
                            font-weight: bold;
                          `;
                          placeholder.textContent = combo.character_id;
                          parent.appendChild(placeholder);
                        }
                      }}
                    />
                  </div>

                  {/* コンテンツ */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* タイトル行 */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#ffffff', margin: 0, wordBreak: 'break-word' }}>
                        {combo.title || '無題のコンボ'}
                      </h3>
                      {combo.category && (
                        <span style={{ padding: '2px 8px', background: 'rgba(59, 130, 246, 0.2)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '10px', fontSize: '10px', color: '#93c5fd', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                          {getCategoryLabel(combo.category)}
                        </span>
                      )}
                    </div>
                    
                    {/* メタ情報 */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                      <span style={{ color: '#fca5a5', fontSize: '12px', fontWeight: 'bold' }}>
                        {combo.character_name || `ID:${combo.character_id}`}
                      </span>
                      {combo.difficulty && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <span style={{ color: '#9ca3af', fontSize: '10px' }}>難</span>
                          <span style={{ color: '#ef4444', fontSize: '12px', fontWeight: 'bold' }}>{combo.difficulty}</span>
                        </div>
                      )}
                      {combo.damage && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <span style={{ color: '#9ca3af', fontSize: '10px' }}>dmg</span>
                          <span style={{ color: '#fbbf24', fontSize: '12px', fontWeight: 'bold' }}>{combo.damage}</span>
                        </div>
                      )}
                      {combo.importance && combo.importance > 0 && (
                        <div style={{ display: 'flex', gap: '1px' }}>
                          {[...Array(combo.importance)].map((_, i) => (
                            <span key={i} style={{ color: '#fbbf24', fontSize: '12px' }}>★</span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 説明 */}
                    {combo.description && (
                      <p style={{ color: '#d1d5db', fontSize: '11px', marginBottom: '6px', lineHeight: '1.4', maxHeight: '32px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{combo.description}</p>
                    )}

                    {/* プレビュー */}
                    <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px solid rgba(185, 28, 28, 0.2)' }}>
                      {renderComboPreview(combo)}
                    </div>
                  </div>
                  
                  {/* ボタン */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flexShrink: 0 }}>
                    <a href={`/combo/edit/${combo.id}`} style={{ padding: '4px 10px', background: 'rgba(59, 130, 246, 0.2)', border: '1px solid rgba(59, 130, 246, 0.4)', borderRadius: '4px', color: '#60a5fa', fontSize: '10px', fontWeight: 'bold', textDecoration: 'none', cursor: 'pointer', textAlign: 'center', whiteSpace: 'nowrap' }}>編集</a>
                    <button onClick={() => deleteCombo(combo.id)} style={{ padding: '4px 10px', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '4px', color: '#fca5a5', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' }}>削除</button>
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