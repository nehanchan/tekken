// src/app/character/create/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { client } from '@/lib/client';

// 明示的な型定義
interface CharacterData {
  id: string;
  character_id: string;
  character_name_en: string;
  character_name_jp?: string | null;
  nickname?: string | null;
  nationality?: string | null;
  height?: string | null;
  weight?: string | null;
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

export default function CreateCharacterPage() {
  const [characters, setCharacters] = useState<CharacterData[]>([]);
  const [categories, setCategories] = useState<MoveCategoryData[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterData | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categoryMoves, setCategoryMoves] = useState<{[key: string]: MoveData[]}>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [charactersResult, categoriesResult] = await Promise.all([
        client.models.Character.list({ authMode: 'apiKey' }),
        client.models.MoveCategory.list({ authMode: 'apiKey' })
      ]);
      
      // null要素をフィルタリング
      const allCharacters = (charactersResult.data || []).filter(c => c !== null) as CharacterData[];
      const allCategories = (categoriesResult.data || []).filter(c => c !== null) as MoveCategoryData[];
      
      // 重複除去（Mapを使用したより安全な方法）
      const characterMap = new Map<string, CharacterData>();
      allCharacters.forEach(char => {
        if (char.character_id && !characterMap.has(char.character_id)) {
          characterMap.set(char.character_id, char);
        }
      });
      const uniqueCharacters = Array.from(characterMap.values());
      
      const categoryMap = new Map<string, MoveCategoryData>();
      allCategories.forEach(cat => {
        if (cat.move_category_id && !categoryMap.has(cat.move_category_id)) {
          categoryMap.set(cat.move_category_id, cat);
        }
      });
      const uniqueCategories = Array.from(categoryMap.values());
      
      console.log('キャラクター（重複除去後）:', uniqueCharacters);
      console.log('技分類（重複除去後）:', uniqueCategories);
      
      setCharacters(uniqueCharacters);
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('データ取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCharacterSelect = async (characterId: string) => {
    const character = characters.find(c => c && c.character_id === characterId);
    setSelectedCharacter(character || null);
    setSelectedCategories([]);
    setCategoryMoves({});
  };

  const handleCategoryToggle = async (move_category_id: string) => {
    if (!selectedCharacter) return;
    
    console.log('技分類トグル:', move_category_id, selectedCharacter.character_id);
    
    const isSelected = selectedCategories.includes(move_category_id);
    
    if (isSelected) {
      setSelectedCategories(prev => prev.filter(id => id !== move_category_id));
      setCategoryMoves(prev => {
        const updated = { ...prev };
        delete updated[move_category_id];
        return updated;
      });
    } else {
      setSelectedCategories(prev => [...prev, move_category_id]);
      
      try {
        console.log('技データ検索条件:', {
          character_id: selectedCharacter.character_id,
          move_category_id: move_category_id
        });
        
        const { data: moves } = await client.models.Move.list({
          filter: {
            and: [
              { character_id: { eq: selectedCharacter.character_id } },
              { move_category_id: { eq: move_category_id } }
            ]
          },
          authMode: 'apiKey'
        });
        
        console.log('取得した技データ:', moves);
        
        // null要素をフィルタリング
        const validMoves = (moves || []).filter(m => m !== null) as MoveData[];
        console.log('有効な技データ:', validMoves.length, '件');
        
        setCategoryMoves(prev => ({
          ...prev,
          [move_category_id]: validMoves
        }));
        
        // デバッグ：全技データも確認
        const { data: allMoves } = await client.models.Move.list({
          filter: { character_id: { eq: selectedCharacter.character_id } },
          authMode: 'apiKey'
        });
        console.log('キャラクターの全技:', allMoves?.filter(m => m !== null).length, '件');
        
      } catch (error) {
        console.error('技データ取得エラー:', error);
      }
    }
  };

  const handleCreatePage = () => {
    if (selectedCharacter) {
      window.location.href = `/character/${selectedCharacter.character_id}`;
    }
  };

  if (loading) {
    return <div className="container mx-auto p-6">読み込み中...</div>;
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8">キャラクターページ作成</h1>
      
      {/* キャラクター選択 */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">1. キャラクターID選択</h2>
        <select 
          onChange={(e) => handleCharacterSelect(e.target.value)}
          className="border border-gray-300 p-3 rounded-lg w-full max-w-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          defaultValue=""
        >
          <option value="">キャラクターを選択してください</option>
          {characters.map((character, index) => character && character.character_id && (
            <option key={`char-${character.id || index}`} value={character.character_id}>
              {character.character_id} - {character.character_name_jp || character.character_name_en}
            </option>
          ))}
        </select>
      </div>

      {/* キャラクター情報表示 */}
      {selectedCharacter && (
        <div className="mb-8 p-6 border border-gray-200 rounded-lg bg-blue-50">
          <h3 className="text-lg font-semibold mb-4 text-blue-900">キャラクター情報</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <p><span className="font-medium text-gray-700">日本語名:</span> <span className="text-gray-900">{selectedCharacter.character_name_jp || '未設定'}</span></p>
            <p><span className="font-medium text-gray-700">英語名:</span> <span className="text-gray-900">{selectedCharacter.character_name_en || '未設定'}</span></p>
            <p><span className="font-medium text-gray-700">ニックネーム:</span> <span className="text-gray-900">{selectedCharacter.nickname || '未設定'}</span></p>
            <p><span className="font-medium text-gray-700">身長:</span> <span className="text-gray-900">{selectedCharacter.height || '未設定'}</span></p>
            <p><span className="font-medium text-gray-700">体重:</span> <span className="text-gray-900">{selectedCharacter.weight || '未設定'}</span></p>
            <p><span className="font-medium text-gray-700">国籍:</span> <span className="text-gray-900">{selectedCharacter.nationality || '未設定'}</span></p>
            <p><span className="font-medium text-gray-700">格闘技:</span> <span className="text-gray-900">{selectedCharacter.martial_arts || '未設定'}</span></p>
          </div>
          {selectedCharacter.character_description && (
            <div className="mt-4">
              <p className="font-medium text-gray-700 mb-1">紹介文:</p>
              <p className="text-gray-900 leading-relaxed">{selectedCharacter.character_description}</p>
            </div>
          )}
        </div>
      )}

      {/* 技分類選択 */}
      {selectedCharacter && categories.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">2. 技分類選択（複数選択可）</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((category, index) => category && (
              <label key={`category-${category.id || index}`} className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(category.id)}
                  onChange={() => handleCategoryToggle(category.id)}
                  className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-900">{category.move_category}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* 選択された技分類の技一覧 */}
      {selectedCategories.length > 0 && (
        <div className="mb-8 space-y-6">
          {selectedCategories.map((move_category_id, categoryIndex) => {
            const category = categories.find(c => c && c.id === move_category_id);
            const moves = categoryMoves[move_category_id] || [];
            
            return (
              <div key={`selected-category-${move_category_id || categoryIndex}`} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4">
                  <h3 className="text-lg font-semibold text-white">
                    {category?.move_category} ({moves.length}件)
                  </h3>
                </div>
                
                <div className="p-4 bg-white">
                  {moves.length > 0 ? (
                    <div className="space-y-4">
                      {moves.map((move, moveIndex) => move && (
                        <div key={`move-${move.id || `${move_category_id}-${moveIndex}`}`} className="p-4 border border-gray-100 rounded-lg hover:shadow-md transition-shadow">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                              <p className="font-semibold text-lg text-gray-900">{move.move_name}</p>
                              <p className="text-sm text-gray-600">{move.move_name_kana}</p>
                            </div>
                            <div className="text-sm space-y-1">
                              <p><span className="font-medium text-gray-700">発生:</span> <span className="text-gray-900">{move.startup_frame}f</span></p>
                              <p><span className="font-medium text-gray-700">属性:</span> <span className="text-gray-900">{move.attribute}</span></p>
                            </div>
                            <div className="text-sm space-y-1">
                              <p><span className="font-medium text-gray-700">ヒット:</span> <span className="text-green-600">{move.hit_frame}</span></p>
                              <p><span className="font-medium text-gray-700">ガード:</span> <span className="text-red-600">{move.block_frame}</span></p>
                            </div>
                            <div className="text-sm">
                              <p><span className="font-medium text-gray-700">技ID:</span> <span className="text-gray-500">{move.move_id}</span></p>
                            </div>
                          </div>
                          
                          {move.remarks && move.remarks.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-100">
                              <p className="text-sm font-medium text-gray-700 mb-2">備考:</p>
                              <div className="space-y-1">
                                {move.remarks
                                  .filter((remark): remark is string => remark !== null && remark !== undefined)
                                  .map((remark, remarkIndex) => (
                                    <div key={`remark-${move.id || moveIndex}-${remarkIndex}`} className="flex items-start">
                                      <span className="inline-block w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                      <span className="text-sm text-gray-600">{remark}</span>
                                    </div>
                                  ))
                                }
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">
                      この技分類には技が登録されていません
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ページ作成ボタン */}
      {selectedCharacter && (
        <div className="fixed bottom-6 right-6">
          <button
            onClick={handleCreatePage}
            className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-full font-semibold text-lg shadow-lg transition-colors"
          >
            📋 ページを作成する
          </button>
        </div>
      )}
    </div>
  );
}