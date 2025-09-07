'use client';

import { useEffect, useState } from 'react';
import { client } from '@/lib/client';
import type { Character } from '@/types';
import AuthWrapper from '@/components/AuthWrapper';

export default function Home() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCharacters();
  }, []);

  const fetchCharacters = async () => {
    try {
      const { data } = await client.models.Character.list({ 
        authMode: 'apiKey' 
      });
      console.log('取得したキャラクターデータ:', data);
      
      // nullを除外してフィルタリング
      const validCharacters = (data || []).filter(character => character !== null);
      setCharacters(validCharacters);
    } catch (error) {
      console.error('Error fetching characters:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthWrapper>
      <div className="container mx-auto p-6">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            鉄拳キャラクターデータベース
          </h2>
          <div className="space-x-4">
            <a 
              href="/character/create"
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              キャラクターページ作成
            </a>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">登録済みキャラクター一覧</h3>
          {loading ? (
            <p className="text-center">読み込み中...</p>
          ) : characters.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {characters.map((character) => (
                <a 
                  key={character.id} 
                  href={`/character/${character.character_id}`}
                  className="block bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
                >
                  <h4 className="text-xl font-semibold mb-2">
                    {character.character_name_jp || character.character_name_en}
                  </h4>
                  <p className="text-gray-600 mb-1">
                    称号: {character.nickname || '未設定'}
                  </p>
                  <p className="text-gray-600 mb-1">
                    出身: {character.nationality || '未設定'}
                  </p>
                  <p className="text-gray-600 mb-3">
                    {character.height || '未設定'} / {character.weight || '未設定'}
                  </p>
                  {character.character_description && (
                    <p className="text-sm text-gray-500 line-clamp-3">
                      {character.character_description}
                    </p>
                  )}
                </a>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">キャラクターデータがありません</p>
            </div>
          )}
        </div>
      </div>
    </AuthWrapper>
  );
}