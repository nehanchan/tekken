// src/app/character/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { client } from '@/lib/client';
import CommandDisplay from '@/components/CommandDisplay';
import FrameAdvantage from '@/components/FrameAdvantage';
import EffectDisplay from '@/components/EffectDisplay';

// 型定義を明示的に定義
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

  useEffect(() => {
    fetchCharacterData();
  }, [characterId]);

  // categoriesが更新された時に全タブをオープンにする
  useEffect(() => {
    if (categories.length > 0) {
      const allCategoryIds = new Set(categories.map(cat => cat.id));
      setSelectedCategories(allCategoryIds);
      console.log('全タブをオープンに設定:', Array.from(allCategoryIds));
    }
  }, [categories]);

  const fetchCharacterData = async () => {
    setLoading(true);
    try {
      // キャラクター情報取得
      const { data: characters } = await client.models.Character.list({
        filter: { character_id: { eq: characterId } },
        authMode: 'apiKey'
      });
      
      const validCharacters = (characters || []).filter(c => c !== null) as CharacterData[];
      
      if (validCharacters[0]) {
        setCharacter(validCharacters[0]);
        
        // キャラクターの全技取得（ページネーション対応）
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
        
        console.log(`${characterId}の技データ取得: ${allMoves.length}件`);
        
        // 技分類取得（ページネーション対応）
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
        
        console.log(`技分類データ取得: ${allCategories.length}件`);
        
        // 技分類別にグループ化
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
        
        // 技分類を各分類の最小move_id順にソート
        usedCategories.sort((a, b) => {
          const aMovesInCategory = grouped[a.id] || [];
          const bMovesInCategory = grouped[b.id] || [];
          
          // 各カテゴリ内の最小move_idを取得
          const aMinMoveId = aMovesInCategory.length > 0 
            ? Math.min(...aMovesInCategory.map(move => parseInt(move.move_id, 10)).filter(id => !isNaN(id)))
            : Infinity;
          const bMinMoveId = bMovesInCategory.length > 0 
            ? Math.min(...bMovesInCategory.map(move => parseInt(move.move_id, 10)).filter(id => !isNaN(id)))
            : Infinity;
          
          return aMinMoveId - bMinMoveId;
        });
        
        // 各分類内の技をmove_id順にソート
        Object.keys(grouped).forEach(categoryId => {
          grouped[categoryId].sort((a, b) => {
            const aId = String(a.move_id).padStart(5, '0');
            const bId = String(b.move_id).padStart(5, '0');
            return aId.localeCompare(bId);
          });
        });
        
        setMovesByCategory(grouped);
        setCategories(usedCategories);
        
        console.log(`技分類別グループ化完了: ${usedCategories.length}分類`);
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

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">読み込み中...</div>
      </div>
    );
  }

  if (!character) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">キャラクターが見つかりません</h1>
          <a href="/character/create" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
            キャラクター作成ページに戻る
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* ヘッダー */}
      <div className="mb-6">
        <nav className="text-sm text-gray-500 mb-4">
          <a href="/" className="hover:text-blue-600">トップ</a>
          <span className="mx-2">›</span>
          <a href="/character/create" className="hover:text-blue-600">キャラクター作成</a>
          <span className="mx-2">›</span>
          <span>{character.character_name_jp || character.character_name_en}</span>
        </nav>
      </div>

      {/* キャラクター情報表示 */}
      <div className="mb-8 bg-gradient-to-r from-blue-50 to-blue-100 p-8 rounded-lg shadow-lg">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-blue-900 mb-2">
            {character.character_name_jp || character.character_name_en}
          </h1>
          <p className="text-lg text-blue-700">
            {character.character_name_en}
          </p>
          {character.nickname && (
            <p className="text-xl text-blue-800 font-semibold">
              {character.nickname}
            </p>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold text-gray-700 mb-2">基本情報</h3>
            <p className="text-sm text-gray-600">
              身長: {character.height || '未設定'}
            </p>
            <p className="text-sm text-gray-600">
              体重: {character.weight || '未設定'}
            </p>
            <p className="text-sm text-gray-600">
              国籍: {character.nationality || '未設定'}
            </p>
            {character.martial_arts && (
              <p className="text-sm text-gray-600">
                格闘技: {character.martial_arts}
              </p>
            )}
          </div>
        </div>
        
        {character.character_description && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-semibold text-gray-700 mb-3">キャラクター紹介</h3>
<div className="text-gray-600 leading-relaxed whitespace-pre-line">
  {(() => {
    let text = character.character_description;
    
    // 改行すべき位置を特定（引用符が続かない場合のみ）
    text = text.replace(/。(?!\s*[」""])/g, '。\n');
    text = text.replace(/」(?!\s*[」""])/g, '」\n');
    
    // …！の処理（最後に実行して他の処理と干渉しないように）
    text = text.replace(/…！(?!\s*[」""])/g, '…！\n');
    
    return text;
  })()}
</div>
      </div>
        )}
      </div>

      {/* 技分類選択・技表示 */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">技一覧</h2>
        
        {categories.length > 0 ? (
          categories.map(category => {
            const moves = movesByCategory[category.id] || [];
            const isSelected = selectedCategories.has(category.id);
            
            return (
              <div key={category.id} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                <button 
                  onClick={() => handleCategorySelect(category.id)}
                  className="w-full text-left p-4 bg-gray-50 hover:bg-gray-100 flex justify-between items-center transition-colors"
                >
                  <span className="font-semibold text-gray-800">
                    {category.move_category} ({moves.length}個の技)
                  </span>
                  <span className={`transform transition-transform ${isSelected ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </button>
                
                {isSelected && (
                  <div className="p-4 bg-white overflow-x-auto">
                    <table className="min-w-full border-collapse border border-gray-300">
                      <thead className="bg-red-900 text-white">
                        <tr>
                          <th className="border border-gray-300 px-2 py-3 text-sm font-medium">No</th>
                          <th className="border border-gray-300 px-4 py-3 text-sm font-medium">技名</th>
                          <th className="border border-gray-300 px-6 py-3 text-sm font-medium">コマンド</th>
                          <th className="border border-gray-300 px-3 py-3 text-sm font-medium">発生F</th>
                          <th className="border border-gray-300 px-3 py-3 text-sm font-medium">持続F</th>
                          <th className="border border-gray-300 px-3 py-3 text-sm font-medium">ヒット時硬直差</th>
                          <th className="border border-gray-300 px-3 py-3 text-sm font-medium">ガード時硬直差</th>
                          <th className="border border-gray-300 px-3 py-3 text-sm font-medium">属性</th>
                          <th className="border border-gray-300 px-6 py-3 text-sm font-medium">エフェクト</th>
                          <th className="border border-gray-300 px-6 py-3 text-sm font-medium">備考</th>
                        </tr>
                      </thead>
                      <tbody className="bg-black text-white">
                        {moves.map((move, index) => (
                          <tr key={move.id} className="hover:bg-red-900 hover:bg-opacity-20">
                            <td className="border border-gray-600 px-2 py-3 text-center text-sm">
                              {move.move_num || index + 1}
                            </td>
                            <td className="border border-gray-600 px-4 py-3 text-sm">
                              <div>
                                <div className="font-medium">{move.move_name}</div>
                                {move.move_name_kana && (
                                  <div className="text-xs text-gray-300">({move.move_name_kana})</div>
                                )}
                              </div>
                            </td>
                            <td className="border border-gray-600 px-6 py-3 text-sm">
                              <CommandDisplay 
                                command={move.command} 
                                size="sm"
                                className="justify-center"
                                showFallback={true}
                              />
                            </td>
                            <td className="border border-gray-600 px-3 py-3 text-center text-sm">
                              {move.startup_frame || '-'}
                            </td>
                            <td className="border border-gray-600 px-3 py-3 text-center text-sm">
                              {move.active_frame || '-'}
                            </td>
                            <td className="border border-gray-600 px-3 py-3 text-center text-sm">
                              <FrameAdvantage value={move.hit_frame} />
                            </td>
                            <td className="border border-gray-600 px-3 py-3 text-center text-sm">
                              <FrameAdvantage value={move.block_frame} />
                            </td>
                            <td className="border border-gray-600 px-3 py-3 text-center text-sm">
                              {move.attribute || '-'}
                            </td>
                            <td className="border border-gray-600 px-3 py-3 text-center text-sm">
                              <EffectDisplay 
                                effectIds={move.effects ? move.effects.filter(e => e !== null) : []} 
                                size="sm"
                                showTooltip={true}
                              />
                            </td>
                            <td className="border border-gray-600 px-6 py-3 text-sm">
                              {move.remarks && move.remarks.length > 0 ? (
                                <div className="space-y-1">
                                  {move.remarks
                                    .filter((remark): remark is string => remark !== null && remark !== undefined)
                                    .map((remark, remarkIndex) => (
                                      <div key={remarkIndex} className="text-xs">{remark}</div>
                                    ))
                                  }
                                </div>
                              ) : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">このキャラクターには技データがありません</p>
          </div>
        )}
      </div>
    </div>
  );
}