// src/components/EffectDisplay.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { client } from '@/lib/client';

interface EffectDisplayProps {
  effectIds?: (string | number | null | undefined)[] | null | undefined;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showTooltip?: boolean;
}

interface EffectMasterData {
  id: string;
  image_path: string;
  effect_description?: string | null;
  createdAt: string;
  updatedAt: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8'
};

// エフェクトマスタのキャッシュ
let effectCache: Map<string, EffectMasterData> | null = null;

// エフェクトマスタの定義（固定）
const EFFECT_MASTER_DEFINITIONS = {
  '1': { name: 'ホーミング', fileName: 'HO.png', description: '相手の横移動に対して有効な技です' },
  '2': { name: 'トルネード誘発', fileName: 'TR.png', description: '空中の相手にヒットすると追撃しやすくなる技です' },
  '3': { name: 'パワークラッシュ', fileName: 'PC.png', description: '相手の上・中段攻撃を受け止めながら攻撃できる技です' },
  '4': { name: '回復ゲージ消滅', fileName: 'GV.png', description: '相手にヒットすると残っている回復可能ゲージを消滅させる技です' },
  '5': { name: 'ヒート発動技', fileName: 'HT.png', description: '地上の相手にヒットするとヒート状態になる技です' },
  '6': { name: 'ウォールブレイク', fileName: 'WB.png', description: '特定の壁を破壊し追撃が可能となる技です' },
  '7': { name: 'フロアブレイク', fileName: 'FB.png', description: '特定の床を破壊し追撃が可能となる技です' },
  '8': { name: '強制しゃがみ', fileName: 'KS.png', description: '地上の相手にヒットすると相手をしゃがみ状態にする技です' }
};

/**
 * データベースからエフェクトマスタを取得
 */
async function fetchEffectMaster(): Promise<Map<string, EffectMasterData>> {
  if (effectCache) {
    return effectCache;
  }

  try {
    const { data } = await client.models.Effect.list({ authMode: 'apiKey' });
    const effectList = data || [];
    const validEffects = effectList.filter(e => e !== null);

    effectCache = new Map();
    validEffects.forEach((effect: any, index: number) => {
      // インデックスベースでエフェクトIDを推定（1から開始）
      const effectId = String(index + 1);
      
      const mapped: EffectMasterData = {
        id: effect.id,
        image_path: effect.image_path || effect.imagePath,
        effect_description: effect.effect_description || effect.effectDescription || null,
        createdAt: effect.createdAt,
        updatedAt: effect.updatedAt,
      };
      effectCache!.set(effectId, mapped);
    });

    console.log('エフェクトマスタ取得完了:', effectCache.size, '件');
    return effectCache;
  } catch (error) {
    console.error('エフェクトマスタ取得エラー:', error);
    return new Map();
  }
}

/**
 * エフェクト情報を取得（フォールバック付き）
 */
function getEffectInfo(effectId: string): { name: string; imagePath: string; description: string } {
  const definition = EFFECT_MASTER_DEFINITIONS[effectId as keyof typeof EFFECT_MASTER_DEFINITIONS];
  
  if (definition) {
    return {
      name: definition.name,
      imagePath: `/effect-icons/${definition.fileName}`,
      description: definition.description
    };
  }
  
  // 定義されていないエフェクトIDの場合
  return {
    name: `エフェクト${effectId}`,
    imagePath: `/effect-icons/${effectId}.png`,
    description: `エフェクトID: ${effectId}`
  };
}

export default function EffectDisplay({ 
  effectIds, 
  size = 'md', 
  className = '',
  showTooltip = true 
}: EffectDisplayProps) {
  const [effectMaster, setEffectMaster] = useState<Map<string, EffectMasterData>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEffectMaster().then(master => {
      setEffectMaster(master);
      setLoading(false);
    });
  }, []);

  // 空またはnullの場合
  if (!effectIds || !Array.isArray(effectIds) || effectIds.length === 0) {
    return <span className={`text-gray-400 text-sm ${className}`}>-</span>;
  }

  // 有効なエフェクトIDのみをフィルタリング
  const validEffectIds = effectIds
    .filter((id): id is string | number => 
      id !== null && 
      id !== undefined && 
      String(id).trim() !== ''
    )
    .map(id => String(id).trim());

  if (validEffectIds.length === 0) {
    return <span className={`text-gray-400 text-sm ${className}`}>-</span>;
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {validEffectIds.map((effectId, index) => {
        const effectData = effectMaster.get(effectId);
        const effectInfo = getEffectInfo(effectId);
        
        // データベースの情報があればそれを優先、なければ定義を使用
        const imagePath = effectData?.image_path || effectInfo.imagePath;
        const description = effectData?.effect_description || effectInfo.description;
        const name = effectInfo.name;
        
        return (
          <div key={`${effectId}-${index}`} className="relative group">
            <img
              src={imagePath}
              alt={name}
              className={`${sizeClasses[size]} object-contain`}
              onError={(e) => {
                // 画像が見つからない場合はテキストに置換
                const target = e.target as HTMLImageElement;
                const span = document.createElement('span');
                span.textContent = effectId;
                span.className = 'text-xs font-mono bg-blue-200 text-blue-800 px-1 py-0.5 rounded';
                target.parentNode?.replaceChild(span, target);
              }}
            />
            
            {/* ツールチップ */}
            {showTooltip && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-normal max-w-xs text-center z-10">
                <div className="font-semibold">{name}</div>
                <div className="mt-1 text-gray-300">{description}</div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// より詳細な表示用コンポーネント
interface EffectDisplayDetailedProps {
  effectIds?: (string | number | null | undefined)[] | null | undefined;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showNames?: boolean;
  layout?: 'horizontal' | 'vertical';
}

export function EffectDisplayDetailed({ 
  effectIds, 
  size = 'md',
  className = '',
  showNames = false,
  layout = 'horizontal'
}: EffectDisplayDetailedProps) {
  const [effectMaster, setEffectMaster] = useState<Map<string, EffectMasterData>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEffectMaster().then(master => {
      setEffectMaster(master);
      setLoading(false);
    });
  }, []);

  if (!effectIds || !Array.isArray(effectIds) || effectIds.length === 0) {
    return <span className="text-gray-400 text-sm">エフェクトなし</span>;
  }

  const validEffectIds = effectIds
    .filter((id): id is string | number => 
      id !== null && 
      id !== undefined && 
      String(id).trim() !== ''
    )
    .map(id => String(id).trim());

  if (validEffectIds.length === 0) {
    return <span className="text-gray-400 text-sm">エフェクトなし</span>;
  }

  const containerClass = layout === 'vertical' ? 'flex flex-col gap-2' : 'flex items-center gap-2';

  return (
    <div className={`${containerClass} ${className}`}>
      {validEffectIds.map((effectId, index) => {
        const effectData = effectMaster.get(effectId);
        const effectInfo = getEffectInfo(effectId);
        
        const imagePath = effectData?.image_path || effectInfo.imagePath;
        const name = effectInfo.name;
        
        return (
          <div key={`${effectId}-${index}`} className={layout === 'vertical' ? 'flex items-center gap-2' : 'flex flex-col items-center gap-1'}>
            <img
              src={imagePath}
              alt={name}
              className={`${sizeClasses[size]} object-contain`}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                const span = document.createElement('span');
                span.textContent = effectId;
                span.className = 'text-xs font-mono bg-blue-200 text-blue-800 px-1 py-0.5 rounded';
                target.parentNode?.replaceChild(span, target);
              }}
            />
            {showNames && (
              <span className="text-xs text-gray-600">
                {name}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// エフェクトマスタ管理用のコンポーネント
export function EffectMasterList() {
  const [effectMaster, setEffectMaster] = useState<Map<string, EffectMasterData>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEffectMaster().then(master => {
      setEffectMaster(master);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">エフェクトマスタ定義</h3>
      <div className="text-sm text-gray-600">
        定義エフェクト数: {Object.keys(EFFECT_MASTER_DEFINITIONS).length} 件 
        {!loading && ` / 登録済み: ${effectMaster.size} 件`}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(EFFECT_MASTER_DEFINITIONS).map(([effectId, definition]) => {
          const effectData = effectMaster.get(effectId);
          const imagePath = effectData?.image_path || `/effect-icons/${definition.fileName}`;
          
          return (
            <div key={effectId} className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg">
              <img
                src={imagePath}
                alt={definition.name}
                className="h-8 w-8 object-contain mt-1 flex-shrink-0"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNiAxNkw4IDhIMjRMMTYgMTZaIiBmaWxsPSIjOUI5QkE0Ii8+CjxwYXRoIGQ9Ik0xNiAxNkw4IDI0SDI0TDE2IDE2WiIgZmlsbD0iIzlCOUJBNCIvPgo8L3N2Zz4K';
                }}
              />
              <div className="flex-1">
                <div className="font-semibold text-base text-gray-900">
                  {definition.name}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {definition.description}
                </div>
                <div className="flex gap-4 mt-2">
                  <div className="text-xs text-gray-500">ID: {effectId}</div>
                  <div className="text-xs text-gray-400">{definition.fileName}</div>
                  {effectData && (
                    <div className="text-xs text-green-600">✓ 登録済み</div>
                  )}
                  {!effectData && !loading && (
                    <div className="text-xs text-red-600">未登録</div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {!loading && effectMaster.size === 0 && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-sm">
            ⚠️ エフェクトマスタが登録されていません。以下のコマンドでマスタデータを作成してください：
          </p>
          <code className="block mt-2 p-2 bg-yellow-100 rounded text-yellow-900 text-sm">
            npm run create-effect-master
          </code>
        </div>
      )}
    </div>
  );
}