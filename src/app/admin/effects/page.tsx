// src/app/admin/effects/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { client } from '@/lib/client';
import { EffectMasterList } from '@/components/EffectDisplay';
import AuthWrapper from '@/components/AuthWrapper';
import type { Effect } from '@/types';

export default function EffectAdminPage() {
  const [effects, setEffects] = useState<Effect[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEffects();
  }, []);

  const fetchEffects = async () => {
    setLoading(true);
    try {
      const { data } = await client.models.Effect.list({ authMode: 'apiKey' });
      const validEffects = (data || []).filter(e => e !== null);
      setEffects(validEffects);
    } catch (error) {
      console.error('エフェクト取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const createEffectMaster = async () => {
    const confirmed = window.confirm('エフェクトマスタを再作成しますか？\n既存のエフェクトデータは削除されます。');
    if (!confirmed) return;

    try {
      // 簡易的な作成処理（実際のスクリプトを実行する場合は別途実装）
      alert('エフェクトマスタ作成はコマンドラインから実行してください:\nnpm run create-effect-master');
    } catch (error) {
      console.error('エフェクトマスタ作成エラー:', error);
    }
  };

  return (
    <AuthWrapper>
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">エフェクト管理</h1>
          <button 
            onClick={createEffectMaster}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg"
          >
            エフェクトマスタ再作成
          </button>
        </div>

        {/* 現在のエフェクトマスタ状況 */}
        <div className="mb-8 p-6 border border-gray-200 rounded-lg bg-white">
          <h2 className="text-xl font-semibold mb-4">現在の登録状況</h2>
          
          {loading ? (
            <p>読み込み中...</p>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                登録エフェクト数: {effects.length} 件
              </div>
              
              {effects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {effects.map((effect, index) => (
                    <div key={effect.id} className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg">
                      <img
                        src={effect.imagePath || ''}
                        alt={`エフェクト${index + 1}`}
                        className="h-8 w-8 object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                      <div>
                        <div className="font-medium text-sm">エフェクト {index + 1}</div>
                        <div className="text-xs text-gray-500">{effect.imagePath}</div>
                        <div className="text-xs text-gray-400">ID: {effect.id}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">エフェクトマスタが登録されていません</p>
                  <p className="text-sm text-gray-400 mt-2">
                    「エフェクトマスタ再作成」ボタンからマスタデータを作成してください
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* エフェクトマスタ一覧（参照用） */}
        <div className="mb-8 p-6 border border-gray-200 rounded-lg bg-gray-50">
          <h2 className="text-xl font-semibold mb-4">エフェクトマスタ定義</h2>
          <EffectMasterList />
        </div>

        {/* 使用方法 */}
        <div className="p-6 border border-gray-200 rounded-lg bg-blue-50">
          <h2 className="text-xl font-semibold mb-4">使用方法</h2>
          
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-medium text-blue-900">1. エフェクトアイコンの準備</h3>
              <p className="text-blue-700 ml-4">
                `/public/effect-icons/` フォルダに以下のファイルを配置してください：
              </p>
              <ul className="list-disc list-inside text-blue-600 ml-8 mt-2">
                <li>HO.png（ホーミング - 相手の横移動に対して有効な技です）</li>
                <li>TR.png（トルネード誘発 - 空中の相手にヒットすると追撃しやすくなる技です）</li>
                <li>PC.png（パワークラッシュ - 相手の上・中段攻撃を受け止めながら攻撃できる技です）</li>
                <li>GV.png（回復ゲージ消滅 - 相手にヒットすると残っている回復可能ゲージを消滅させる技です）</li>
                <li>HT.png（ヒート発動技 - 地上の相手にヒットするとヒート状態になる技です）</li>
                <li>WB.png（ウォールブレイク - 特定の壁を破壊し追撃が可能となる技です）</li>
                <li>FB.png（フロアブレイク - 特定の床を破壊し追撃が可能となる技です）</li>
                <li>KS.png（強制しゃがみ - 地上の相手にヒットすると相手をしゃがみ状態にする技です）</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-blue-900">2. エフェクトマスタ作成</h3>
              <p className="text-blue-700 ml-4">
                コマンドラインから以下を実行：
              </p>
              <code className="block bg-blue-100 p-2 rounded ml-4 mt-2 text-blue-800">
                npm run create-effect-master
              </code>
            </div>
            
            <div>
              <h3 className="font-medium text-blue-900">3. 技データインポート</h3>
              <p className="text-blue-700 ml-4">
                CSVファイルの effect_id_1～5 列にエフェクトID（1～8）を設定してインポート
              </p>
            </div>
          </div>
        </div>
      </div>
    </AuthWrapper>
  );
}