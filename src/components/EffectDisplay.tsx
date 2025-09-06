// src/components/EffectDisplay.tsx
'use client';

import React from 'react';

interface EffectDisplayProps {
  effectIds?: (string | number)[];
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showTooltip?: boolean;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8'
};

// エフェクトIDと名前・ファイル名・説明のマッピング
const EFFECT_DATA: { [key: string]: { name: string; fileName: string; description: string } } = {
  '1': { 
    name: 'ホーミング', 
    fileName: 'HO.png', 
    description: '相手の横移動に対して有効な技です' 
  },
  '2': { 
    name: 'トルネード誘発', 
    fileName: 'TR.png', 
    description: '空中の相手にヒットすると追撃しやすくなる技です' 
  },
  '3': { 
    name: 'パワークラッシュ', 
    fileName: 'PC.png', 
    description: '相手の上・中段攻撃を受け止めながら攻撃できる技です' 
  },
  '4': { 
    name: '回復ゲージ消滅', 
    fileName: 'GV.png', 
    description: '相手にヒットすると残っている回復可能ゲージを消滅させる技です' 
  },
  '5': { 
    name: 'ヒート発動技', 
    fileName: 'HT.png', 
    description: '地上の相手にヒットするとヒート状態になる技です' 
  },
  '6': { 
    name: 'ウォールブレイク', 
    fileName: 'WB.png', 
    description: '特定の壁を破壊し追撃が可能となる技です' 
  },
  '7': { 
    name: 'フロアブレイク', 
    fileName: 'FB.png', 
    description: '特定の床を破壊し追撃が可能となる技です' 
  },
  '8': { 
    name: '強制しゃがみ', 
    fileName: 'KS.png', 
    description: '地上の相手にヒットすると相手をしゃがみ状態にする技です' 
  }
};

/**
 * エフェクトアイコンのパスを取得
 * @param effectId エフェクトID
 * @returns アイコンファイルのパス
 */
function getEffectIconPath(effectId: string): string {
  const effectData = EFFECT_DATA[effectId];
  if (effectData) {
    return `/effect-icons/${effectData.fileName}`;
  }
  // フォールバック: IDをそのままファイル名として使用
  return `/effect-icons/${effectId}.png`;
}

/**
 * エフェクト名を取得
 * @param effectId エフェクトID
 * @returns エフェクト名
 */
function getEffectName(effectId: string): string {
  const effectData = EFFECT_DATA[effectId];
  return effectData ? effectData.name : `エフェクト${effectId}`;
}

/**
 * エフェクト説明を取得
 * @param effectId エフェクトID
 * @returns エフェクト説明
 */
function getEffectDescription(effectId: string): string {
  const effectData = EFFECT_DATA[effectId];
  return effectData ? effectData.description : '';
}

export default function EffectDisplay({ 
  effectIds = [], 
  size = 'md', 
  className = '',
  showTooltip = true 
}: EffectDisplayProps) {
  // 空またはnullの場合
  if (!effectIds || effectIds.length === 0) {
    return <span className={`text-gray-400 text-sm ${className}`}>-</span>;
  }

  // 有効なエフェクトIDのみをフィルタリング
  const validEffectIds = effectIds
    .filter(id => id !== null && id !== undefined && String(id).trim() !== '')
    .map(id => String(id).trim());

  if (validEffectIds.length === 0) {
    return <span className={`text-gray-400 text-sm ${className}`}>-</span>;
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {validEffectIds.map((effectId, index) => (
        <div key={`${effectId}-${index}`} className="relative group">
          <img
            src={getEffectIconPath(effectId)}
            alt={getEffectName(effectId)}
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
              <div className="font-semibold">{getEffectName(effectId)}</div>
              <div className="mt-1 text-gray-300">{getEffectDescription(effectId)}</div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// より詳細な表示用コンポーネント
interface EffectDisplayDetailedProps extends EffectDisplayProps {
  showNames?: boolean;
  layout?: 'horizontal' | 'vertical';
}

export function EffectDisplayDetailed({ 
  effectIds = [], 
  size = 'md',
  className = '',
  showNames = false,
  layout = 'horizontal'
}: EffectDisplayDetailedProps) {
  const validEffectIds = effectIds
    .filter(id => id !== null && id !== undefined && String(id).trim() !== '')
    .map(id => String(id).trim());

  if (validEffectIds.length === 0) {
    return <span className="text-gray-400 text-sm">エフェクトなし</span>;
  }

  const containerClass = layout === 'vertical' ? 'flex flex-col gap-2' : 'flex items-center gap-2';

  return (
    <div className={`${containerClass} ${className}`}>
      {validEffectIds.map((effectId, index) => (
        <div key={`${effectId}-${index}`} className={layout === 'vertical' ? 'flex items-center gap-2' : 'flex flex-col items-center gap-1'}>
          <img
            src={getEffectIconPath(effectId)}
            alt={getEffectName(effectId)}
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
              {getEffectName(effectId)}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

// エフェクトマスタ管理用のコンポーネント
export function EffectMasterList() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">エフェクトマスタ一覧</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(EFFECT_DATA).map(([id, data]) => (
          <div key={id} className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg">
            <img
              src={getEffectIconPath(id)}
              alt={data.name}
              className="h-8 w-8 object-contain mt-1 flex-shrink-0"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNiAxNkw4IDhIMjRMMTYgMTZaIiBmaWxsPSIjOUI5QkE0Ii8+CjxwYXRoIGQ9Ik0xNiAxNkw4IDI0SDI0TDE2IDE2WiIgZmlsbD0iIzlCOUJBNCIvPgo8L3N2Zz4K';
              }}
            />
            <div className="flex-1">
              <div className="font-semibold text-base text-gray-900">{data.name}</div>
              <div className="text-sm text-gray-600 mt-1">{data.description}</div>
              <div className="flex gap-4 mt-2">
                <div className="text-xs text-gray-500">ID: {id}</div>
                <div className="text-xs text-gray-400">{data.fileName}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}