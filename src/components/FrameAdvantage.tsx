// src/components/FrameAdvantage.tsx
'use client';

import React from 'react';

interface FrameAdvantageProps {
  value?: string | number | null | undefined;
  className?: string;
  showBackground?: boolean; // 背景色も表示するか
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
    // 数値以外（"投げ", "ダウン"など）
    return (
      <span className={`text-yellow-300 font-medium ${sizeClasses[size]} ${className}`}>
        {stringValue}
      </span>
    );
  }

  // 色分けとスタイル
  let textClass = 'text-white'; // デフォルト（0の場合）
  let bgClass = '';
  
  if (numericValue > 0) {
    textClass = 'text-green-300 font-semibold'; // 正の数：明るい緑、太字
    bgClass = showBackground ? 'bg-green-900 bg-opacity-30 px-2 py-1 rounded' : '';
  } else if (numericValue < 0) {
    textClass = 'text-red-300 font-semibold'; // 負の数：明るい赤、太字  
    bgClass = showBackground ? 'bg-red-900 bg-opacity-30 px-2 py-1 rounded' : '';
  } else {
    // 0の場合
    textClass = 'text-gray-200 font-medium';
    bgClass = showBackground ? 'bg-gray-700 bg-opacity-30 px-2 py-1 rounded' : '';
  }

  return (
    <span className={`${textClass} ${bgClass} ${sizeClasses[size]} ${className}`}>
      {stringValue}
    </span>
  );
}

/**
 * 文字列から数値を抽出する関数
 * @param value "+3", "-5", "0", "ダウン" など
 * @returns 数値またはnull
 */
function parseNumericValue(value: string): number | null {
  if (!value || typeof value !== 'string') return null;
  
  // 数値のみの場合（"0", "3", "-5"など）
  const directNumber = parseInt(value, 10);
  if (!isNaN(directNumber)) {
    return directNumber;
  }
  
  // +記号付きの場合（"+3"など）
  if (value.startsWith('+')) {
    const number = parseInt(value.substring(1), 10);
    return isNaN(number) ? null : number;
  }
  
  // -記号付きの場合（"-5"など）
  if (value.startsWith('-')) {
    const number = parseInt(value, 10);
    return isNaN(number) ? null : number;
  }
  
  // その他の文字列（"ダウン", "投げ"など）
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