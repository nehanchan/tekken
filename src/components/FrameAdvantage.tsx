// src/components/FrameAdvantage.tsx
'use client';

import React from 'react';

// CommandElementの型定義
interface CommandElement {
  type: 'text' | 'icon';
  value: string;
  iconType?: string;
}

// CommandDisplayからの関数を直接実装（強化版）
function parseCommandToElements(text: string | null | undefined): CommandElement[] {
  if (!text || typeof text !== 'string') {
    return [];
  }

  const COMMAND_ICONS = [
    'ah', 'all', 'ba', 'bc', 'bj', 'cm', 'cr', 'dk', 'ei',
    'fc', 'fj', 'fo', 'ij', 'ju', 'lk',
    'lp', 'nb', 'ng', 'nh', 'nt', 'nv', 'qy', 'rk', 'rp',
    'uk', 'wk', 'wl', 'wp', 'wr', 'wu', 'xn', 'zb'
  ];

  // エフェクトアイコンの定義
  const EFFECT_ICONS = [
    'TR', 'FB', 'KS', 'GV', 'HO', 'HT', 'PC', 'WB'
  ];

  // 短い文字列の場合、エフェクトアイコンの完全一致をチェック
  const trimmedText = text.trim();
  if (EFFECT_ICONS.includes(trimmedText)) {
    return [{
      type: 'icon',
      value: trimmedText,
      iconType: 'effect'
    }];
  }

  const elements: CommandElement[] = [];
  let i = 0;
  let currentText = '';

  while (i < text.length) {
    let matched = false;
    
    // 長いアイコン名から順に検索（3文字 -> 2文字）
    for (const iconLength of [3, 2]) {
      if (i + iconLength <= text.length) {
        const substring = text.substring(i, i + iconLength);
        
        if (COMMAND_ICONS.includes(substring) || EFFECT_ICONS.includes(substring)) {
          if (currentText.length > 0) {
            elements.push({
              type: 'text',
              value: currentText.replace(/\(/g, '（').replace(/\)/g, '）')
            });
            currentText = '';
          }
          
          const iconType = EFFECT_ICONS.includes(substring) ? 'effect' : 'command';
          elements.push({
            type: 'icon',
            value: substring,
            iconType: iconType
          });
          
          i += iconLength;
          matched = true;
          break;
        }
      }
    }
    
    if (!matched) {
      currentText += text[i];
      i++;
    }
  }

  if (currentText.length > 0) {
    elements.push({
      type: 'text',
      value: currentText.replace(/\(/g, '（').replace(/\)/g, '）')
    });
  }

  return elements;
}

function getIconPath(iconName: string, iconType?: string): string {
  const EFFECT_ICONS = [
    'TR', 'FB', 'KS', 'GV', 'HO', 'HT', 'PC', 'WB'
  ];
  
  if (iconType === 'effect' || EFFECT_ICONS.includes(iconName)) {
    return `/effect-icons/${iconName}.png`;
  }
  return `/command-icons/${iconName}.png`;
}

// TextWithIconsの簡単な実装
interface TextWithIconsLocalProps {
  text?: string | null;
  size?: 'sm' | 'md' | 'lg';
  textClassName?: string;
  showFallback?: boolean;
}

function TextWithIconsLocal({ 
  text, 
  size = 'sm', 
  textClassName = 'text-yellow-300 font-medium',
  showFallback = false 
}: TextWithIconsLocalProps) {
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
          size={size === 'sm' ? 'md' : 'md'}
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
        size={size === 'sm' ? 'md' : 'lg'}
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