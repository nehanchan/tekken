'use client';

import { useState, useEffect } from 'react';
import { client } from '@/lib/client';
import type { Character, MoveCategory, Move } from '@/types';

export default function CreateCharacterPage() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [categories, setCategories] = useState<MoveCategory[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categoryMoves, setCategoryMoves] = useState<{[key: string]: Move[]}>({});
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
      const validCharacters = (charactersResult.data || []).filter(c => c !== null);
      const validCategories = (categoriesResult.data || []).filter(c => c !== null);
      
      console.log('キャラクター:', validCharacters);
      console.log('技分類:', validCategories);
      
      setCharacters(validCharacters);
      setCategories(validCategories);
    } catch (error) {
      console.error('データ取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCharacterSelect = async (characterId: string) => {
    const character = characters.find(c => c && c.characterId === characterId);
    setSelectedCharacter(character || null);
    setSelectedCategories([]);
    setCategoryMoves({});
  };

  const handleCategoryToggle = async (categoryId: string) => {
    if (!selectedCharacter) return;
    
    const isSelected = selectedCategories.includes(categoryId);
    
    if (isSelected) {
      setSelectedCategories(prev => prev.filter(id => id !== categoryId));
      setCategoryMoves(prev => {
        const updated = { ...prev };
        delete updated[categoryId];
        return updated;
      });
    } else {
      setSelectedCategories(prev => [...prev, categoryId]);
      
      try {
        const { data: moves } = await client.models.Move.list({
          filter: {
            and: [
              { characterId: { eq: selectedCharacter.characterId } },
              { categoryId: { eq: categoryId } }
            ]
          },
          authMode: 'apiKey'
        });
        
        // null要素をフィルタリング
        const validMoves = (moves || []).filter(m => m !== null);
        
        setCategoryMoves(prev => ({
          ...prev,
          [categoryId]: validMoves
        }));
      } catch (error) {
        console.error('技データ取得エラー:', error);
      }
    }
  };

  const handleCreatePage = () => {
    if (selectedCharacter) {
      window.location.href = `/character/${selectedCharacter.characterId}`;
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
          {characters.map(character => character && character.characterId && (
            <option key={character.characterId} value={character.characterId}>
              {character.characterId} - {character.name}
            </option>
          ))}
        </select>
      </div>

      {/* キャラクター情報表示 */}
      {selectedCharacter && (
        <div className="mb-8 p-6 border border-gray-200 rounded-lg bg-blue-50">
          <h3 className="text-lg font-semibold mb-4 text-blue-900">キャラクター情報</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <p><span className="font-medium text-gray-700">名前:</span> <span className="text-gray-900">{selectedCharacter.name}</span></p>
            <p><span className="font-medium text-gray-700">カナ:</span> <span className="text-gray-900">{selectedCharacter.nameKana || '未設定'}</span></p>
            <p><span className="font-medium text-gray-700">称号:</span> <span className="text-gray-900">{selectedCharacter.title || '未設定'}</span></p>
            <p><span className="font-medium text-gray-700">身長:</span> <span className="text-gray-900">{selectedCharacter.height ? `${selectedCharacter.height}cm` : '未設定'}</span></p>
            <p><span className="font-medium text-gray-700">体重:</span> <span className="text-gray-900">{selectedCharacter.weight ? `${selectedCharacter.weight}kg` : '未設定'}</span></p>
            <p><span className="font-medium text-gray-700">国籍:</span> <span className="text-gray-900">{selectedCharacter.nationality || '未設定'}</span></p>
          </div>
          {selectedCharacter.description && (
            <div className="mt-4">
              <p className="font-medium text-gray-700 mb-1">紹介文:</p>
              <p className="text-gray-900 leading-relaxed">{selectedCharacter.description}</p>
            </div>
          )}
        </div>
      )}

      {/* 技分類選択 */}
      {selectedCharacter && categories.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">2. 技分類選択（複数選択可）</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map(category => category && (
              <label key={category.id} className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(category.id)}
                  onChange={() => handleCategoryToggle(category.id)}
                  className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-900">{category.categoryName}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* 選択された技分類の技一覧 */}
      {selectedCategories.length > 0 && (
        <div className="mb-8 space-y-6">
          {selectedCategories.map(categoryId => {
            const category = categories.find(c => c && c.id === categoryId);
            const moves = categoryMoves[categoryId] || [];
            
            return (
              <div key={categoryId} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4">
                  <h3 className="text-lg font-semibold text-white">
                    {category?.categoryName} ({moves.length}件)
                  </h3>
                </div>
                
                <div className="p-4 bg-white">
                  {moves.length > 0 ? (
                    <div className="space-y-4">
                      {moves.map(move => move && (
                        <div key={move.id} className="p-4 border border-gray-100 rounded-lg hover:shadow-md transition-shadow">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                              <p className="font-semibold text-lg text-gray-900">{move.name}</p>
                              <p className="text-sm text-gray-600">{move.nameKana}</p>
                            </div>
                            <div className="text-sm space-y-1">
                              <p><span className="font-medium text-gray-700">発生:</span> <span className="text-gray-900">{move.startupFrame}f</span></p>
                              <p><span className="font-medium text-gray-700">属性:</span> <span className="text-gray-900">{move.attribute}</span></p>
                            </div>
                            <div className="text-sm space-y-1">
                              <p><span className="font-medium text-gray-700">ヒット:</span> <span className="text-green-600">{move.hitFrame}</span></p>
                              <p><span className="font-medium text-gray-700">ガード:</span> <span className="text-red-600">{move.blockFrame}</span></p>
                            </div>
                            <div className="text-sm">
                              <p><span className="font-medium text-gray-700">技ID:</span> <span className="text-gray-500">{move.moveId}</span></p>
                            </div>
                          </div>
                          
                          {move.notes && move.notes.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-100">
                              <p className="text-sm font-medium text-gray-700 mb-2">備考:</p>
                              <div className="space-y-1">
                                {move.notes.map((note, index) => (
                                  <div key={index} className="flex items-start">
                                    <span className="inline-block w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                    <span className="text-sm text-gray-600">{note}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-12">該当する技がありません</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 作成ボタン */}
      {selectedCharacter && selectedCategories.length > 0 && (
        <div className="flex justify-center pt-8 border-t border-gray-200">
          <button 
            onClick={handleCreatePage}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-semibold transition-colors shadow-lg hover:shadow-xl"
          >
            キャラクターページ作成
          </button>
        </div>
      )}

      {/* データなしの場合 */}
      {characters.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">キャラクターデータがありません</p>
          <p className="text-gray-400 text-sm">マスタデータが正常に投入されているか確認してください</p>
        </div>
      )}
    </div>
  );
}