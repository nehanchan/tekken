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
  effect_id: string;
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
    validEffects.forEach((effect: any) => {
      // プロパティ名をEffectMasterData型に変換
      const mapped: EffectMasterData = {
        id: effect.id,
        effect_id: effect.effectId ?? effect.effect_id,
        image_path: effect.imagePath ?? effect.image_path,
        effect_description: effect.effectDescription ?? effect.effect_description ?? null,
        createdAt: effect.createdAt,
        updatedAt: effect.updatedAt,
      };
      effectCache!.set(String(mapped.effect_id), mapped);
    });

    console.log('エフェクトマスタ取得完了:', effectCache.size, '件');
    return effectCache;
  } catch (error) {
    console.error('エフェクトマスタ取得エラー:', error);
    return new Map();
  }
/**
 * エフェクト名を取得（説明文から抽出）
 */
function getEffectName(effectId: string, effectData?: EffectMasterData): string {
  if (effectData?.effect_description) {
    // 説明文から名前を推測（「〜に対して」「〜すると」などの前の部分）
    const description = effectData.effect_description;
    
    // パターンマッチングで名前を抽出
    if (description.includes('横移動に対して')) return 'ホーミング';
    if (description.includes('追撃しやすくなる')) return 'トルネード誘発';
    if (description.includes('受け止めながら')) return 'パワークラッシュ';
    if (description.includes('回復可能ゲージを消滅')) return '回復ゲージ消滅';
    if (description.includes('ヒート状態になる')) return 'ヒート発動技';
    if (description.includes('壁を破壊し')) return 'ウォールブレイク';
    if (description.includes('床を破壊し')) return 'フロアブレイク';
    if (description.includes('しゃがみ状態にする')) return '強制しゃがみ';
    
    // 上記にマッチしない場合は最初の部分を使用
    const firstPart = description.split(/に|を|と/)[0];
    return firstPart || `エフェクト${effectId}`;
  }
  
  return `エフェクト${effectId}`;
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

  if (loading) {
    return <span className={`text-gray-400 text-sm ${className}`}>読込中...</span>;
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {validEffectIds.map((effectId, index) => {
        const effectData = effectMaster.get(effectId);
        const effectName = getEffectName(effectId, effectData);
        
        return (
          <div key={`${effectId}-${index}`} className="relative group">
            <img
              src={effectData?.image_path || `/effect-icons/${effectId}.png`}
              alt={effectName}
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
                <div className="font-semibold">{effectName}</div>
                {effectData?.effect_description && (
                  <div className="mt-1 text-gray-300">{effectData.effect_description}</div>
                )}
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

  if (validEffectIds.length === 0 || loading) {
    return <span className="text-gray-400 text-sm">エフェクトなし</span>;
  }

  const containerClass = layout === 'vertical' ? 'flex flex-col gap-2' : 'flex items-center gap-2';

  return (
    <div className={`${containerClass} ${className}`}>
      {validEffectIds.map((effectId, index) => {
        const effectData = effectMaster.get(effectId);
        const effectName = getEffectName(effectId, effectData);
        
        return (
          <div key={`${effectId}-${index}`} className={layout === 'vertical' ? 'flex items-center gap-2' : 'flex flex-col items-center gap-1'}>
            <img
              src={effectData?.image_path || `/effect-icons/${effectId}.png`}
              alt={effectName}
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
                {effectName}
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

  if (loading) {
    return <div>エフェクトマスタ読み込み中...</div>;
  }

  const effects = Array.from(effectMaster.values()).sort((a, b) => 
    parseInt(a.effect_id) - parseInt(b.effect_id)
  );

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">エフェクトマスタ一覧</h3>
      <div className="text-sm text-gray-600">
        登録エフェクト数: {effects.length} 件
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {effects.map((effect) => {
          const effectName = getEffectName(effect.effect_id, effect);
          
          return (
            <div key={effect.id} className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg">
              <img
                src={effect.image_path}
                alt={effectName}
                className="h-8 w-8 object-contain mt-1 flex-shrink-0"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNiAxNkw4IDhIMjRMMTYgMTZaIiBmaWxsPSIjOUI5QkE0Ii8+CjxwYXRoIGQ9Ik0xNiAxNkw4IDI0SDI0TDE2IDE2WiIgZmlsbD0iIzlCOUJBNCIvPgo8L3N2Zz4K';
                }}
              />
              <div className="flex-1">
                <div className="font-semibold text-base text-gray-900">
                  {effectName}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {effect.effect_description || '説明なし'}
                </div>
                <div className="flex gap-4 mt-2">
                  <div className="text-xs text-gray-500">ID: {effect.effect_id}</div>
                  <div className="text-xs text-gray-400">{effect.image_path}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}