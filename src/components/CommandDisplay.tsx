'use client';

import React from 'react';
import { parseCommandToIcons, getIconPath } from '@/utils/commandIcons';

interface CommandDisplayProps {
  command?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showFallback?: boolean;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6', 
  lg: 'h-8 w-8'
};

export default function CommandDisplay({ 
  command, 
  size = 'md', 
  className = '',
  showFallback = true 
}: CommandDisplayProps) {
  // コマンドが空またはnullの場合
  if (!command || command.trim() === '') {
    return showFallback ? (
      <span className={`text-gray-400 text-sm ${className}`}>-</span>
    ) : null;
  }

  const icons = parseCommandToIcons(command);

  // アイコンが解析できなかった場合はテキストで表示
  if (icons.length === 0) {
    return (
      <span className={`text-sm font-mono ${className}`}>
        {command}
      </span>
    );
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {icons.map((iconName, index) => (
        <img
          key={`${iconName}-${index}`}
          src={getIconPath(iconName)}
          alt={iconName}
          className={`${sizeClasses[size]} object-contain`}
          onError={(e) => {
            // 画像が見つからない場合はテキストに置換
            const target = e.target as HTMLImageElement;
            const span = document.createElement('span');
            span.textContent = iconName;
            span.className = 'text-xs font-mono bg-gray-200 px-1 py-0.5 rounded';
            target.parentNode?.replaceChild(span, target);
          }}
          title={iconName} // ホバー時にアイコン名を表示
        />
      ))}
    </div>
  );
}

interface CommandDisplayDetailedProps extends CommandDisplayProps {
  showOriginal?: boolean;
  showDebug?: boolean;
}

export function CommandDisplayDetailed({ 
  command, 
  size = 'md',
  className = '',
  showOriginal = false,
  showDebug = false
}: CommandDisplayDetailedProps) {
  const icons = command ? parseCommandToIcons(command) : [];

  return (
    <div className={`space-y-2 ${className}`}>
      <CommandDisplay 
        command={command} 
        size={size} 
        showFallback={true}
      />
      
      {showOriginal && command && (
        <div className="text-xs text-gray-500 font-mono">
          原文: {command}
        </div>
      )}
      
      {showDebug && command && (
        <div className="text-xs text-gray-400 space-y-1">
          <div>アイコン: [{icons.join(', ')}]</div>
          <div>解析結果: {icons.join('')}</div>
          <div>一致: {icons.join('') === command ? '✓' : '✗'}</div>
        </div>
      )}
    </div>
  );
}