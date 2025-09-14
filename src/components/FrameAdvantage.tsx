// src/components/FrameAdvantage.tsx
'use client';

import React from 'react';

// TextWithIconsを直接インポートできない場合の対応
interface TextWithIconsProps {
  text?: string | null;
  size?: 'sm' | 'md' | 'lg';
  textClassName?: string;
}

// 一時的にCommandDisplayから関数をインポート
import { parseCommandToElements, getIconPath } from '@/utils/commandIcons';

// TextWithIconsの簡単な実装
function TextWithIconsLocal({ 
  text, 
  size = 'sm', 
  textClassName = 'text-yellow-300 font-medium',
  showFallback = false 
}: TextWithIconsProps) {
  if (!text || text.trim() === '') {
    return showFallback ? <span>-</span> : <span>{text}</span>;
  }

  const elements = parseCommandToElements(text);
  
  if (elements.length === 0 || elements.every(el => el.type === 'text')) {
    return <span className={textClassName}>{text}</span>;
  }

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6', 
    lg: 'h-8 w-8'
  };

  return (
    <span className="inline-flex items-center gap-1">
      {elements.map((element, index) => {
        if (element.type === 'text') {
          return (
            <span key={`text-${index}`} className={textClassName}>
              {element.value}
            </span>
          );
        } else {
          const iconPath = getIconPath(element.value, element.iconType);
          return (
            <img
              key={`icon-${element.value}-${index}`}
              src={iconPath}
              alt={element.value}
              className={`${sizeClasses[size]} object-contain`}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                const span = document.createElement('span');
                span.textContent = element.value;
                span.className = textClassName;
                target.parentNode?.replaceChild(span, target);
              }}
            />
          );
        }
      })}
    </span>
  );
}

interface FrameAdvantageProps {
  value?: string | number | null | undefined;
  className?: string;
  showBackground?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function FrameAdvantage({ 
  value, 
  className = '', 
  showBackground = false,
  size = 'md'
}: FrameAdvantageProps) {
  // 値が空またはnullの場合
  if (value === null || value === undefined || value === '' || value === '-') {
    return <span className={`text-gray-400 ${className}`}>-</span>;
  }

  // 文字列に変換
  const stringValue = String(value);

  // 数値を抽出（+3, -5, 0などの形式に対応）
  const numericValue = parseNumericValue(stringValue);
  
  // サイズクラス
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm', 
    lg: 'text-base'
  };
  
  if (numericValue === null) {
    // 数値以外（"投げ", "ダウン"など） - アイコン置換対応
    return (
      <span className={`text-yellow-300 font-medium ${sizeClasses[size]} ${className}`}>
        <TextWithIconsLocal 
          text={stringValue} 
          size={size === 'lg' ? 'md' : 'sm'}
          textClassName="text-yellow-300 font-medium"
          showFallback={false}
        />
      </span>
    );
  }

  // 色分けとスタイル
  let textClass = 'text-white'; // デフォルト（0の場合）
  let bgClass = '';
  
  if (numericValue > 0) {
    textClass = 'text-green-300 font-semibold';
    bgClass = showBackground ? 'bg-green-900 bg-opacity-30 px-2 py-1 rounded' : '';
  } else if (numericValue < 0) {
    textClass = 'text-red-300 font-semibold';
    bgClass = showBackground ? 'bg-red-900 bg-opacity-30 px-2 py-1 rounded' : '';
  } else {
    textClass = 'text-gray-200 font-medium';
    bgClass = showBackground ? 'bg-gray-700 bg-opacity-30 px-2 py-1 rounded' : '';
  }

  // 数値の場合もアイコン置換を適用
  return (
    <span className={`${bgClass} ${sizeClasses[size]} ${className}`}>
      <TextWithIconsLocal 
        text={stringValue} 
        size={size === 'lg' ? 'md' : 'sm'}
        textClassName={textClass}
        showFallback={false}
      />
    </span>
  );
}

/**
 * 文字列から数値を抽出する関数
 */
function parseNumericValue(value: string): number | null {
  if (!value || typeof value !== 'string') return null;
  
  const directNumber = parseInt(value, 10);
  if (!isNaN(directNumber)) {
    return directNumber;
  }
  
  if (value.startsWith('+')) {
    const number = parseInt(value.substring(1), 10);
    return isNaN(number) ? null : number;
  }
  
  if (value.startsWith('-')) {
    const number = parseInt(value, 10);
    return isNaN(number) ? null : number;
  }
  
  return null;
}

// 硬直差に関する詳細情報を表示するコンポーネント
interface FrameAdvantageTooltipProps {
  hitFrame?: string | number | null | undefined;
  blockFrame?: string | number | null | undefined;
}

export function FrameAdvantageTooltip({ hitFrame, blockFrame }: FrameAdvantageTooltipProps) {
  return (
    <div className="text-xs text-gray-300 space-y-1">
      <div>ヒット時: <FrameAdvantage value={hitFrame} size="sm" /></div>
      <div>ガード時: <FrameAdvantage value={blockFrame} size="sm" /></div>
    </div>
  );
}