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
      const { data } = await client.models.Character.list();
      setCharacters(data);
    } catch (error) {
      console.error('Error fetching characters:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTestCharacter = async () => {
    try {
      await client.models.Character.create({
        name: '風間仁',
        fightingStyle: '空手・風間流喧嘩術',
        country: '日本',
        height: 180,
        weight: 75,
        description: '風間財閥の跡取り息子。悪魔の血を宿す。',
      });
      fetchCharacters(); // リスト更新
    } catch (error) {
      console.error('Error creating character:', error);
    }
  };

  return (
    <AuthWrapper>
      <div className="container mx-auto p-6">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            キャラクター一覧
          </h2>
          <button
            onClick={createTestCharacter}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
          >
            テストキャラクター作成
          </button>
        </div>

        {loading ? (
          <p className="text-center">読み込み中...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {characters.map((character) => (
              <div key={character.id} className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-2">{character.name}</h3>
                <p className="text-gray-600 mb-1">格闘スタイル: {character.fightingStyle}</p>
                <p className="text-gray-600 mb-1">出身地: {character.country}</p>
                <p className="text-gray-600 mb-3">
                  {character.height}cm / {character.weight}kg
                </p>
                <p className="text-sm text-gray-500">{character.description}</p>
              </div>
            ))}
          </div>
        )}

        {characters.length === 0 && !loading && (
          <p className="text-center text-gray-500">
            キャラクターがありません。テストキャラクターを作成してみてください。
          </p>
        )}
      </div>
    </AuthWrapper>
  );
}