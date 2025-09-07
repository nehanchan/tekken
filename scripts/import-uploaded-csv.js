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
  height?: number | null;
  weight?: number | null;
  nationality?: string | null;
  martial_arts?: string | null;
  character_description?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface MoveCategoryData {
  id: string;
  categoryName: string;
  createdAt?: string;
  updatedAt?: string;
}

interface MoveData {
  id: string;
  moveId: string;
  character_id: string;
  categoryId?: string | null;
  name: string;
  nameKana?: string | null;
  command?: string | null;
  damage?: number | null;
  startupFrame?: number | null;
  activeFrame?: string | null;
  hitFrame?: string | null;
  blockFrame?: string | null;
  attribute?: string | null;
  judgment?: string | null;
  effects?: (string | null)[] | null;
  notes?: (string | null)[] | null;
  createdAt?: string;
  updatedAt?: string;
}

export default function CharacterDetailPage() {
  const params = useParams();
  const characterId = params.id as string;
  
  const [character, setCharacter] = useState<CharacterData | null>(null);
  const [categories, setCategories] = useState<MoveCategoryData[]>([]);
  const [movesByCategory, setMovesByCategory] = useState<{[key: string]: MoveData[]}>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCharacterData();
  }, [characterId]);

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
        
        // キャラクターの全技取得
        const { data: moves } = await client.models.Move.list({
          filter: { character_id: { eq: characterId } },
          authMode: 'apiKey'
        });
        
        const validMoves = (moves || []).filter(m => m !== null) as MoveData[];
        
        // 技分類取得
        const { data: allCategories } = await client.models.MoveCategory.list({
          authMode: 'apiKey'
        });
        
        const validCategories = (allCategories || []).filter(c => c !== null) as MoveCategoryData[];
        
        // 技分類別にグループ化
        const grouped: {[key: string]: MoveData[]} = {};
        const usedCategories: MoveCategoryData[] = [];
        
        for (const move of validMoves) {
          const categoryId = move.categoryId;
          if (categoryId) {
            if (!grouped[categoryId]) {
              grouped[categoryId] = [];
              const category = validCategories.find(c => c.id === categoryId);
              if (category && !usedCategories.find(uc => uc.id === category.id)) {
                usedCategories.push(category);
              }
            }
            grouped[categoryId].push(move);
          }
        }
        
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
    setSelectedCategory(prev => prev === categoryId ? '' : categoryId);
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
              身長: {character.height ? `${character.height}cm` : '未設定'}
            </p>
            <p className="text-sm text-gray-600">
              体重: {character.weight ? `${character.weight}kg` : '未設定'}
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
            <p className="text-gray-600 leading-relaxed">{character.character_description}</p>
          </div>
        )}
      </div>

      {/* 技分類選択・技表示 */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">技一覧</h2>
        
        {categories.length > 0 ? (
          categories.map(category => {
            const moves = movesByCategory[category.id] || [];
            const isSelected = selectedCategory === category.id;
            
            return (
              <div key={category.id} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                <button 
                  onClick={() => handleCategorySelect(category.id)}
                  className="w-full text-left p-4 bg-gray-50 hover:bg-gray-100 flex justify-between items-center transition-colors"
                >
                  <span className="font-semibold text-gray-800">
                    {category.categoryName} ({moves.length}個の技)
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
                          <th className="border border-gray-300 px-4 py-3 text-sm font-medium">ダメージ</th>
                          <th className="border border-gray-300 px-4 py-3 text-sm font-medium">判定</th>
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
                              {index + 1}
                            </td>
                            <td className="border border-gray-600 px-4 py-3 text-sm">
                              <div>
                                <div className="font-medium">{move.name}</div>
                                {move.nameKana && (
                                  <div className="text-xs text-gray-300">({move.nameKana})</div>
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
                            <td className="border border-gray-600 px-4 py-3 text-center text-sm">
                              {move.damage || '-'}
                            </td>
                            <td className="border border-gray-600 px-4 py-3 text-sm">
                              {move.judgment || move.attribute || '-'}
                            </td>
                            <td className="border border-gray-600 px-3 py-3 text-center text-sm">
                              {move.startupFrame || '-'}
                            </td>
                            <td className="border border-gray-600 px-3 py-3 text-center text-sm">
                              {move.activeFrame || '-'}
                            </td>
                            <td className="border border-gray-600 px-3 py-3 text-center text-sm">
                              <FrameAdvantage value={move.hitFrame} />
                            </td>
                            <td className="border border-gray-600 px-3 py-3 text-center text-sm">
                              <FrameAdvantage value={move.blockFrame} />
                            </td>
                            <td className="border border-gray-600 px-3 py-3 text-center text-sm">
                              {move.attribute || '-'}
                            </td>
                            <td className="border border-gray-600 px-3 py-3 text-center text-sm">
                              <EffectDisplay 
                                effectIds={move.effects || []} 
                                size="sm"
                                showTooltip={true}
                              />
                            </td>
                            <td className="border border-gray-600 px-6 py-3 text-sm">
                              {move.notes && move.notes.length > 0 ? (
                                <div className="space-y-1">
                                  {move.notes
                                    .filter((note): note is string => note !== null && note !== undefined)
                                    .map((note, noteIndex) => (
                                      <div key={noteIndex} className="text-xs">{note}</div>
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