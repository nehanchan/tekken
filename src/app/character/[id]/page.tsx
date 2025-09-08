// src/app/character/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { client } from '@/lib/client';
import CommandDisplay from '@/components/CommandDisplay';
import FrameAdvantage from '@/components/FrameAdvantage';
import EffectDisplay from '@/components/EffectDisplay';

interface CharacterData {
  id: string;
  character_id: string;
  character_name_en: string;
  character_name_jp?: string | null;
  nickname?: string | null;
  height?: string | null;
  weight?: string | null;
  nationality?: string | null;
  martial_arts?: string | null;
  character_description?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface MoveCategoryData {
  id: string;
  move_category_id: string;
  move_category: string;
  createdAt?: string;
  updatedAt?: string;
}

interface MoveData {
  id: string;
  move_id: string;
  move_num?: number | null;
  character_id: string;
  move_category_id?: string | null;
  move_name: string;
  move_name_kana?: string | null;
  command?: string | null;
  startup_frame?: number | null;
  active_frame?: string | null;
  hit_frame?: string | null;
  block_frame?: string | null;
  attribute?: string | null;
  effects?: (string | null)[] | null;
  remarks?: (string | null)[] | null;
  createdAt?: string;
  updatedAt?: string;
}

export default function CharacterDetailPage() {
  const params = useParams();
  const characterId = params.id as string;
  
  const [character, setCharacter] = useState<CharacterData | null>(null);
  const [categories, setCategories] = useState<MoveCategoryData[]>([]);
  const [movesByCategory, setMovesByCategory] = useState<{[key: string]: MoveData[]}>({});
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(true);

  useEffect(() => {
    fetchCharacterData();
  }, [characterId]);

  useEffect(() => {
    if (categories.length > 0) {
      const allCategoryIds = new Set(categories.map(cat => cat.id));
      setSelectedCategories(allCategoryIds);
    }
  }, [categories]);

  const fetchCharacterData = async () => {
    setLoading(true);
    try {
      const { data: characters } = await client.models.Character.list({
        filter: { character_id: { eq: characterId } },
        authMode: 'apiKey'
      });
      
      const validCharacters = (characters || []).filter(c => c !== null) as CharacterData[];
      
      if (validCharacters[0]) {
        setCharacter(validCharacters[0]);
        
        let allMoves: MoveData[] = [];
        let nextToken = null;
        
        do {
          const params: any = {
            filter: { character_id: { eq: characterId } },
            authMode: 'apiKey',
            limit: 1000
          };
          
          if (nextToken) {
            params.nextToken = nextToken;
          }
          
          const result = await client.models.Move.list(params);
          const pageMoves = (result.data || []).filter(m => m !== null) as MoveData[];
          allMoves = allMoves.concat(pageMoves);
          nextToken = result.nextToken;
          
        } while (nextToken);
        
        let allCategories: MoveCategoryData[] = [];
        nextToken = null;
        
        do {
          const params: any = {
            authMode: 'apiKey',
            limit: 1000
          };
          
          if (nextToken) {
            params.nextToken = nextToken;
          }
          
          const result = await client.models.MoveCategory.list(params);
          const pageCategories = (result.data || []).filter(c => c !== null) as MoveCategoryData[];
          allCategories = allCategories.concat(pageCategories);
          nextToken = result.nextToken;
          
        } while (nextToken);
        
        const grouped: {[key: string]: MoveData[]} = {};
        const usedCategories: MoveCategoryData[] = [];
        
        for (const move of allMoves) {
          const categoryId = move.move_category_id;
          if (categoryId) {
            if (!grouped[categoryId]) {
              grouped[categoryId] = [];
              const category = allCategories.find(c => c.id === categoryId);
              if (category && !usedCategories.find(uc => uc.id === category.id)) {
                usedCategories.push(category);
              }
            }
            grouped[categoryId].push(move);
          }
        }
        
        usedCategories.sort((a, b) => {
          const aMovesInCategory = grouped[a.id] || [];
          const bMovesInCategory = grouped[b.id] || [];
          
          const aMinMoveId = aMovesInCategory.length > 0 
            ? Math.min(...aMovesInCategory.map(move => parseInt(move.move_id, 10)).filter(id => !isNaN(id)))
            : Infinity;
          const bMinMoveId = bMovesInCategory.length > 0 
            ? Math.min(...bMovesInCategory.map(move => parseInt(move.move_id, 10)).filter(id => !isNaN(id)))
            : Infinity;
          
          return aMinMoveId - bMinMoveId;
        });
        
        Object.keys(grouped).forEach(categoryId => {
          grouped[categoryId].sort((a, b) => {
            const aId = String(a.move_id).padStart(5, '0');
            const bId = String(b.move_id).padStart(5, '0');
            return aId.localeCompare(bId);
          });
        });
        
        setMovesByCategory(grouped);
        setCategories(usedCategories);
      }
    } catch (error) {
      console.error('データ取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  // コマンド表示のシンプルな関数
  const renderCommand = (command: string | null | undefined) => {
    if (!command) {
      return <span style={{ color: 'rgba(248, 113, 113, 0.6)' }}>-</span>;
    }

    // CommandDisplayコンポーネントに完全に任せる
    return (
      <CommandDisplay 
        command={command} 
        size="lg"
        className="justify-center"
        showFallback={true}
      />
    );
  };

  if (loading) {
    return (
      <div 
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(to bottom right, #111827, #7f1d1d, #000000)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <div style={{ fontSize: '18px', color: '#fef2f2', textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
          読み込み中...
        </div>
      </div>
    );
  }

  if (!character) {
    return (
      <div 
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(to bottom right, #111827, #7f1d1d, #000000)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#f87171', marginBottom: '16px', textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
            キャラクターが見つかりません
          </h1>
          <a 
            href="/character/create" 
            style={{
              background: 'linear-gradient(to right, #dc2626, #b91c1c)',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '8px',
              fontWeight: '600',
              textDecoration: 'none',
              boxShadow: '0 10px 15px rgba(0,0,0,0.3)',
              transition: 'all 0.2s'
            }}
          >
            キャラクター作成ページに戻る
          </a>
        </div>
      </div>
    );
  }

  return (
    <div 
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom right, #111827, #7f1d1d, #000000)',
        padding: '24px'
      }}
    >
      {/* ヘッダー */}
      <div style={{ marginBottom: '24px' }}>
        <nav style={{ fontSize: '14px', color: '#d1d5db', marginBottom: '16px' }}>
          <a href="/" style={{ color: '#d1d5db', textDecoration: 'none' }}>トップ</a>
          <span style={{ margin: '0 8px', color: '#ef4444' }}>›</span>
          <a href="/character/create" style={{ color: '#d1d5db', textDecoration: 'none' }}>キャラクター作成</a>
          <span style={{ margin: '0 8px', color: '#ef4444' }}>›</span>
          <span style={{ color: '#fca5a5' }}>{character.character_name_jp || character.character_name_en}</span>
        </nav>
      </div>

      {/* キャラクター情報表示 */}
      <div 
        style={{
          marginBottom: '32px',
          background: 'linear-gradient(to right, #450a0a, #111827, #450a0a)',
          padding: '32px',
          borderRadius: '8px',
          boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
          border: '1px solid rgba(185, 28, 28, 0.3)',
          backdropFilter: 'blur(4px)',
          maxWidth: '1152px',
          margin: '0 auto 32px auto'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 style={{ 
            fontSize: '36px', 
            fontWeight: 'bold', 
            color: '#fef2f2', 
            marginBottom: '8px', 
            textShadow: '2px 2px 8px rgba(0,0,0,0.8)' 
          }}>
            {character.character_name_jp || character.character_name_en}
          </h1>
          <p style={{ fontSize: '18px', color: '#fca5a5' }}>
            {character.character_name_en}
          </p>
          {character.nickname && (
            <p style={{ fontSize: '20px', color: '#f87171', fontWeight: '600', marginTop: '8px' }}>
              {character.nickname}
            </p>
          )}
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '24px' }}>
          <div 
            style={{
              background: 'rgba(0, 0, 0, 0.4)',
              padding: '16px',
              borderRadius: '8px',
              boxShadow: '0 10px 15px rgba(0,0,0,0.3)',
              border: '1px solid rgba(185, 28, 28, 0.2)',
              backdropFilter: 'blur(4px)'
            }}
          >
            <h3 style={{ fontWeight: '600', color: '#fca5a5', marginBottom: '8px' }}>基本情報</h3>
            <p style={{ fontSize: '14px', color: '#d1d5db' }}>身長: {character.height || '未設定'}</p>
            <p style={{ fontSize: '14px', color: '#d1d5db' }}>体重: {character.weight || '未設定'}</p>
            <p style={{ fontSize: '14px', color: '#d1d5db' }}>国籍: {character.nationality || '未設定'}</p>
            {character.martial_arts && (
              <p style={{ fontSize: '14px', color: '#d1d5db' }}>格闘技: {character.martial_arts}</p>
            )}
          </div>
        </div>
        
        {character.character_description && (
          <div 
            style={{
              border: '1px solid rgba(185, 28, 28, 0.3)',
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 10px 15px rgba(0,0,0,0.3)',
              background: 'rgba(0, 0, 0, 0.2)',
              backdropFilter: 'blur(4px)'
            }}
          >
            <button 
              onClick={() => setIsDescriptionOpen(!isDescriptionOpen)}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '16px',
                background: 'rgba(69, 10, 10, 0.5)',
                border: 'none',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
                borderBottom: '1px solid rgba(185, 28, 28, 0.2)'
              }}
            >
              <h3 style={{ fontWeight: '600', color: '#fca5a5', margin: 0 }}>キャラクター紹介</h3>
              <span style={{ 
                transform: isDescriptionOpen ? 'rotate(180deg)' : 'rotate(0deg)', 
                transition: 'transform 0.2s', 
                color: '#f87171' 
              }}>
                ▼
              </span>
            </button>
            
            {isDescriptionOpen && (
              <div style={{ padding: '24px', background: 'rgba(0, 0, 0, 0.3)' }}>
                <div style={{ color: '#e5e7eb', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
                  {character.character_description}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 技分類選択・技表示 */}
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ 
          fontSize: '24px', 
          fontWeight: 'bold', 
          color: '#fef2f2', 
          marginBottom: '24px', 
          textShadow: '2px 2px 8px rgba(0,0,0,0.8)' 
        }}>
          技一覧
        </h2>
        
        {categories.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {categories.map(category => {
              const moves = movesByCategory[category.id] || [];
              const isSelected = selectedCategories.has(category.id);
              
              return (
                <div 
                  key={category.id} 
                  style={{
                    border: '1px solid rgba(185, 28, 28, 0.4)',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
                    background: 'linear-gradient(to right, rgba(69, 10, 10, 0.5), rgba(0, 0, 0, 0.5))',
                    backdropFilter: 'blur(4px)'
                  }}
                >
                  <button 
                    onClick={() => handleCategorySelect(category.id)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '16px',
                      background: 'linear-gradient(to right, rgba(127, 29, 29, 0.7), rgba(69, 10, 10, 0.7))',
                      border: 'none',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      borderBottom: '1px solid rgba(220, 38, 38, 0.3)'
                    }}
                  >
                    <span style={{ 
                      fontWeight: '600', 
                      color: '#fef2f2', 
                      textShadow: '1px 1px 2px rgba(0,0,0,0.8)' 
                    }}>
                      {category.move_category} ({moves.length}個の技)
                    </span>
                    <span style={{ 
                      transform: isSelected ? 'rotate(180deg)' : 'rotate(0deg)', 
                      transition: 'transform 0.2s', 
                      color: '#f87171' 
                    }}>
                      ▼
                    </span>
                  </button>
                  
                  {isSelected && (
                    <div style={{ background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.8), rgba(69, 10, 10, 0.6))' }}>
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid rgba(185, 28, 28, 0.5)', minWidth: 'max-content' }}>
                          <thead>
                            <tr style={{ background: 'linear-gradient(to right, #7f1d1d, #b91c1c, #7f1d1d)' }}>
                              <th style={{ border: '1px solid rgba(185, 28, 28, 0.5)', padding: '12px 16px', fontSize: '14px', fontWeight: 'bold', width: '80px', color: '#fef2f2' }}>No</th>
                              <th style={{ border: '1px solid rgba(185, 28, 28, 0.5)', padding: '12px 24px', fontSize: '14px', fontWeight: 'bold', width: '288px', color: '#fef2f2' }}>技名</th>
                              <th style={{ border: '1px solid rgba(185, 28, 28, 0.5)', padding: '12px 32px', fontSize: '14px', fontWeight: 'bold', width: '384px', color: '#fef2f2' }}>コマンド</th>
                              <th style={{ border: '1px solid rgba(185, 28, 28, 0.5)', padding: '12px 16px', fontSize: '14px', fontWeight: 'bold', width: '80px', color: '#fef2f2' }}>発生</th>
                              <th style={{ border: '1px solid rgba(185, 28, 28, 0.5)', padding: '12px 16px', fontSize: '14px', fontWeight: 'bold', width: '80px', color: '#fef2f2' }}>持続</th>
                              <th style={{ border: '1px solid rgba(185, 28, 28, 0.5)', padding: '12px 16px', fontSize: '14px', fontWeight: 'bold', width: '112px', color: '#fef2f2' }}>ヒット</th>
                              <th style={{ border: '1px solid rgba(185, 28, 28, 0.5)', padding: '12px 16px', fontSize: '14px', fontWeight: 'bold', width: '112px', color: '#fef2f2' }}>ガード</th>
                              <th style={{ border: '1px solid rgba(185, 28, 28, 0.5)', padding: '12px 16px', fontSize: '14px', fontWeight: 'bold', width: '80px', color: '#fef2f2' }}>判定</th>
                              <th style={{ border: '1px solid rgba(185, 28, 28, 0.5)', padding: '12px 24px', fontSize: '14px', fontWeight: 'bold', width: '128px', color: '#fef2f2' }}>属性</th>
                              <th style={{ border: '1px solid rgba(185, 28, 28, 0.5)', padding: '12px 32px', fontSize: '14px', fontWeight: 'bold', color: '#fef2f2' }}>備考</th>
                            </tr>
                          </thead>
                          <tbody style={{ background: 'linear-gradient(to bottom, #000000, #111827, #000000)', color: 'white' }}>
                            {moves.map((move, index) => (
                              <tr 
                                key={move.id} 
                                style={{ 
                                  borderBottom: '1px solid rgba(127, 29, 29, 0.2)',
                                  transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = 'linear-gradient(to right, rgba(127, 29, 29, 0.3), rgba(185, 28, 28, 0.3))';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = 'transparent';
                                }}
                              >
                                <td style={{ border: '1px solid rgba(185, 28, 28, 0.3)', padding: '16px', textAlign: 'center', fontSize: '14px', fontWeight: '500', color: '#fca5a5' }}>
                                  {move.move_num || index + 1}
                                </td>
                                <td style={{ border: '1px solid rgba(185, 28, 28, 0.3)', padding: '16px 24px', fontSize: '14px' }}>
                                  <div>
                                    <div style={{ fontWeight: '500', fontSize: '16px', color: '#fef2f2' }}>{move.move_name}</div>
                                    {move.move_name_kana && (
                                      <div style={{ fontSize: '12px', color: '#fca5a5', marginTop: '4px' }}>({move.move_name_kana})</div>
                                    )}
                                  </div>
                                </td>
                                <td style={{ border: '1px solid rgba(185, 28, 28, 0.3)', padding: '16px 32px', fontSize: '14px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '40px' }}>
                                    {renderCommand(move.command)}
                                  </div>
                                </td>
                                <td style={{ border: '1px solid rgba(185, 28, 28, 0.3)', padding: '16px', textAlign: 'center', fontSize: '14px', fontWeight: '500', color: '#fca5a5' }}>
                                  {move.startup_frame || '-'}
                                </td>
                                <td style={{ border: '1px solid rgba(185, 28, 28, 0.3)', padding: '16px', textAlign: 'center', fontSize: '14px', fontWeight: '500', color: '#fca5a5' }}>
                                  {move.active_frame || '-'}
                                </td>
                                <td style={{ border: '1px solid rgba(185, 28, 28, 0.3)', padding: '16px', textAlign: 'center', fontSize: '14px' }}>
                                  <FrameAdvantage value={move.hit_frame} />
                                </td>
                                <td style={{ border: '1px solid rgba(185, 28, 28, 0.3)', padding: '16px', textAlign: 'center', fontSize: '14px' }}>
                                  <FrameAdvantage value={move.block_frame} />
                                </td>
                                <td style={{ border: '1px solid rgba(185, 28, 28, 0.3)', padding: '16px', textAlign: 'center', fontSize: '14px', color: '#fca5a5' }}>
                                  {move.attribute || '-'}
                                </td>
                                <td style={{ border: '1px solid rgba(185, 28, 28, 0.3)', padding: '16px 24px', textAlign: 'center', fontSize: '14px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '32px' }}>
                                    <EffectDisplay 
                                      effectIds={move.effects ? move.effects.filter(e => e !== null) : []} 
                                      size="md"
                                      showTooltip={true}
                                    />
                                  </div>
                                </td>
                                <td style={{ border: '1px solid rgba(185, 28, 28, 0.3)', padding: '16px 32px', fontSize: '14px', minWidth: '0' }}>
                                  {move.remarks && move.remarks.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                      {move.remarks
                                        .filter((remark): remark is string => remark !== null && remark !== undefined)
                                        .map((remark, remarkIndex) => (
                                          <div key={remarkIndex} style={{ fontSize: '14px', lineHeight: '1.6', wordBreak: 'break-word', color: '#fef2f2' }}>
                                            {remark}
                                          </div>
                                        ))
                                      }
                                    </div>
                                  ) : (
                                    <span style={{ color: 'rgba(248, 113, 113, 0.6)' }}>-</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div 
            style={{
              textAlign: 'center',
              padding: '48px',
              background: 'linear-gradient(to right, rgba(69, 10, 10, 0.3), rgba(0, 0, 0, 0.3))',
              borderRadius: '8px',
              border: '1px solid rgba(185, 28, 28, 0.2)',
              backdropFilter: 'blur(4px)'
            }}
          >
            <p style={{ color: '#fca5a5' }}>このキャラクターには技データがありません</p>
          </div>
        )}
      </div>
    </div>
  );
}