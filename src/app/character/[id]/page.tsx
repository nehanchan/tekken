// src/app/character/[id]/page.tsx (コマンド列折り返し対応版)
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { client } from '@/lib/client';
import CommandDisplay, { TextWithIcons, PlainText } from '@/components/CommandDisplay';
import { parseCommandToElements, getIconPath } from '@/utils/commandIcons';
import FrameAdvantage from '@/components/FrameAdvantage';
import EffectDisplay from '@/components/EffectDisplay';

// 列幅設定（元に戻す）
const COLUMN_WIDTHS = {
  no: '30px',
  move_name: '250px',
  command: '320px',    // 元の幅に戻す
  startup: '40px',
  active: '52px',
  hit: '48px',
  guard: '48px',
  attribute: '70px',
  effect: '70px',
  remarks: '400px'
};

interface CharacterData {
  id: string;
  character_id: string;
  character_name_en: string;
  character_name_jp?: string | null;
  nickname?: string | null;
  height?: string | null;
  weight?: string | null;
  nationality?: string | null;
  martial_arts?: string | null;
  character_description?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface MoveCategoryData {
  id: string;
  move_category_id: string;
  move_category: string;
  createdAt?: string;
  updatedAt?: string;
}

interface MoveData {
  id: string;
  move_id: string;
  move_num?: number | null;
  character_id: string;
  move_category_id?: string | null;
  move_name: string;
  move_name_kana?: string | null;
  command?: string | null;
  startup_frame?: number | null;
  active_frame?: string | null;
  hit_frame?: string | null;
  block_frame?: string | null;
  attribute?: string | null;
  effects?: (string | null)[] | null;
  remarks?: (string | null)[] | null;
  createdAt?: string;
  updatedAt?: string;
}

export default function CharacterDetailPage() {
  const params = useParams();
  const characterId = params.id as string;
  
  const [character, setCharacter] = useState<CharacterData | null>(null);
  const [categories, setCategories] = useState<MoveCategoryData[]>([]);
  const [movesByCategory, setMovesByCategory] = useState<{[key: string]: MoveData[]}>({});
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedMove, setSelectedMove] = useState<MoveData | null>(null);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [textScale, setTextScale] = useState(1);

  // 画面サイズ監視とテキストスケール計算（より積極的な調整）
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      
      if (width >= 768) {
        // より積極的なスケール調整（コマンド列の折り返しを促進）
        if (width <= 800) {
          setTextScale(0.55);  // より小さく
        } else if (width <= 900) {
          setTextScale(0.65);
        } else if (width <= 1000) {
          setTextScale(0.75);
        } else if (width <= 1100) {
          setTextScale(0.85);
        } else if (width <= 1200) {
          setTextScale(0.9);
        } else {
          setTextScale(1.0);
        }
      } else {
        setTextScale(1);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    fetchCharacterData();
  }, [characterId]);

  useEffect(() => {
    if (categories.length > 0) {
      const allCategoryIds = new Set(categories.map(cat => cat.id));
      setSelectedCategories(allCategoryIds);
    }
  }, [categories]);

  // データ取得処理
  const fetchCharacterData = async () => {
    setLoading(true);
    try {
      const { data: characters } = await client.models.Character.list({
        filter: { character_id: { eq: characterId } },
        authMode: 'apiKey'
      });
      
      const validCharacters = (characters || []).filter(c => c !== null) as CharacterData[];
      
      if (validCharacters[0]) {
        setCharacter(validCharacters[0]);
        
        // 技データ取得（ページネーション対応）
        let allMoves: MoveData[] = [];
        let nextToken = null;
        
        do {
          const params: any = {
            filter: { character_id: { eq: characterId } },
            authMode: 'apiKey',
            limit: 1000
          };
          
          if (nextToken) {
            params.nextToken = nextToken;
          }
          
          const result = await client.models.Move.list(params);
          const pageMoves = (result.data || []).filter(m => m !== null) as MoveData[];
          allMoves = allMoves.concat(pageMoves);
          nextToken = result.nextToken;
          
        } while (nextToken);
        
        // 技分類データ取得（ページネーション対応）
        let allCategories: MoveCategoryData[] = [];
        nextToken = null;
        
        do {
          const params: any = {
            authMode: 'apiKey',
            limit: 1000
          };
          
          if (nextToken) {
            params.nextToken = nextToken;
          }
          
          const result = await client.models.MoveCategory.list(params);
          const pageCategories = (result.data || []).filter(c => c !== null) as MoveCategoryData[];
          allCategories = allCategories.concat(pageCategories);
          nextToken = result.nextToken;
          
        } while (nextToken);
        
        // データ整理
        const grouped: {[key: string]: MoveData[]} = {};
        const usedCategories: MoveCategoryData[] = [];
        
        for (const move of allMoves) {
          const categoryId = move.move_category_id;
          if (categoryId) {
            if (!grouped[categoryId]) {
              grouped[categoryId] = [];
              const category = allCategories.find(c => c.id === categoryId);
              if (category && !usedCategories.find(uc => uc.id === category.id)) {
                usedCategories.push(category);
              }
            }
            grouped[categoryId].push(move);
          }
        }
        
        // カテゴリソート（move_idの最小値順）
        usedCategories.sort((a, b) => {
          const aMovesInCategory = grouped[a.id] || [];
          const bMovesInCategory = grouped[b.id] || [];
          
          const aMinMoveId = aMovesInCategory.length > 0 
            ? Math.min(...aMovesInCategory.map(move => parseInt(move.move_id, 10)).filter(id => !isNaN(id)))
            : Infinity;
          const bMinMoveId = bMovesInCategory.length > 0 
            ? Math.min(...bMovesInCategory.map(move => parseInt(move.move_id, 10)).filter(id => !isNaN(id)))
            : Infinity;
          
          return aMinMoveId - bMinMoveId;
        });
        
        // 各カテゴリ内の技をmove_id順でソート
        Object.keys(grouped).forEach(categoryId => {
          grouped[categoryId].sort((a, b) => {
            const aId = String(a.move_id).padStart(5, '0');
            const bId = String(b.move_id).padStart(5, '0');
            return aId.localeCompare(bId);
          });
        });
        
        setMovesByCategory(grouped);
        setCategories(usedCategories);
      }
    } catch (error) {
      console.error('データ取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  // スケールされたフォントサイズを計算（統一サイズ）
  const getScaledFontSize = (baseSize: number) => {
    return Math.max(baseSize * textScale, 8); // 最小サイズを8pxに設定
  };

  // テーブル用の統一フォントサイズ
  const getTableFontSize = () => {
    return getScaledFontSize(12); // テーブル内は全て12pxベース
  };

  // カテゴリ選択処理
  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  // 改良されたResponsiveCommandDisplayコンポーネント（直接処理版）
  const ResponsiveCommandDisplay = ({ 
    command, 
    size = 'md', 
    className = '', 
    showFallback = true 
  }: {
    command?: string | null;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    showFallback?: boolean;
  }) => {
    if (!command || command.trim() === '') {
      return showFallback ? (
        <span className={`text-gray-400 ${className}`} style={{ fontSize: `${getTableFontSize()}px` }}>-</span>
      ) : null;
    }

    // アイコン置換を試行
    const elements = parseCommandToElements(command);
    
    // アイコン置換できなかった場合は強制折り返しテキスト表示
    if (elements.length === 0 || elements.every(el => el.type === 'text')) {
      return (
        <div style={{ 
          fontSize: `${getTableFontSize()}px`,
          lineHeight: '1.3',
          width: '100%',
          maxWidth: '100%',
          wordBreak: 'break-all',
          overflowWrap: 'anywhere',
          whiteSpace: 'normal',
          hyphens: 'auto',
          color: '#d1d5db'
        }} className={className}>
          {command}
        </div>
      );
    }

    // アイコン置換された場合の表示
    const sizeClasses = {
      sm: 'h-4 w-4',
      md: 'h-6 w-6', 
      lg: 'h-8 w-8'
    };

    const iconSize = textScale > 0.8 ? 'md' : 'sm';

    return (
      <div style={{ 
        display: 'flex',
        alignItems: 'center',
        gap: `${Math.max(textScale * 2, 1)}px`,
        flexWrap: 'wrap',
        fontSize: `${getTableFontSize()}px`,
        lineHeight: '1.3',
        width: '100%',
        maxWidth: '100%'
      }} className={className}>
        {elements.map((element, index) => {
          if (element.type === 'text') {
            return (
              <span 
                key={`text-${index}`} 
                style={{
                  wordBreak: 'break-all',
                  overflowWrap: 'anywhere',
                  whiteSpace: 'normal',
                  color: '#d1d5db'
                }}
              >
                {element.value}
              </span>
            );
          } else {
            return (
              <img
                key={`icon-${element.value}-${index}`}
                src={getIconPath(element.value, element.iconType)}
                alt={element.value}
                className={`${sizeClasses[iconSize]} object-contain flex-shrink-0`}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  const span = document.createElement('span');
                  span.textContent = element.value;
                  span.className = 'text-xs font-mono bg-gray-200 text-gray-800 px-1 py-0.5 rounded';
                  span.style.wordBreak = 'break-all';
                  span.style.overflowWrap = 'anywhere';
                  span.style.whiteSpace = 'normal';
                  target.parentNode?.replaceChild(span, target);
                }}
                title={element.value}
              />
            );
          }
        })}
      </div>
    );
  };

  // 技名表示
  const renderMoveName = (moveName: string, moveNameKana?: string | null) => {
    return (
      <div>
        <div style={{ 
          fontWeight: '500', 
          fontSize: `${getTableFontSize()}px`, 
          color: '#fef2f2',
          lineHeight: '1.2'
        }}>
          <TextWithIcons 
            text={moveName} 
            size="sm"
            textClassName="text-white font-medium"
            showFallback={false}
            enableIconReplacement={true}
          />
        </div>
        {moveNameKana && !isMobile && (
          <div style={{ 
            fontSize: `${Math.max(getTableFontSize() - 2, 8)}px`, 
            color: '#fca5a5', 
            marginTop: '2px',
            lineHeight: '1.2'
          }}>
            (<TextWithIcons 
              text={moveNameKana} 
              size="sm"
              textClassName="text-rose-300"
              showFallback={false}
              enableIconReplacement={true}
            />)
          </div>
        )}
      </div>
    );
  };

  // 属性表示
  const renderAttribute = (attribute: string | null | undefined) => {
    if (!attribute) {
      return <span style={{ color: 'rgba(248, 113, 113, 0.6)' }}>-</span>;
    }

    const color = (attribute === 'D' || attribute === '浮') ? '#4ade80' : '#ffffff';
    
    return (
      <div style={{ 
        color: color, 
        fontWeight: '500',
        fontSize: `${getTableFontSize()}px`
      }}>
        <TextWithIcons 
          text={attribute} 
          size="sm"
          textClassName="font-medium"
          showFallback={false}
          enableIconReplacement={true}
        />
      </div>
    );
  };

  // 備考表示
  const renderRemarks = (remarks?: (string | null)[] | null) => {
    if (!remarks || remarks.length === 0) {
      return <span style={{ color: 'rgba(248, 113, 113, 0.6)' }}>-</span>;
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: `${Math.max(textScale * 6, 4)}px` }}>
        {remarks
          .filter((remark): remark is string => remark !== null && remark !== undefined)
          .map((remark, remarkIndex) => (
            <div key={remarkIndex} style={{ 
              fontSize: `${getTableFontSize()}px`, 
              lineHeight: '1.4', 
              wordBreak: 'break-word', 
              color: '#fef2f2',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '4px'
            }}>
              <span style={{ flexShrink: 0, marginTop: '2px' }}>・</span>
              <TextWithIcons 
                text={remark} 
                size={textScale > 0.8 ? 'md' : 'sm'} // 他の列と同様のサイズ調整
                textClassName="text-gray-100"
                className="flex items-center gap-1 flex-wrap"
                showFallback={false}
                enableIconReplacement={true}
              />
            </div>
          ))
        }
      </div>
    );
  };

  // キャラクター紹介文
  const renderDescription = (description: string) => {
    return (
      <div style={{ color: '#e5e7eb', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
        <PlainText 
          text={description} 
          className="text-gray-200 leading-relaxed"
          showFallback={false}
        />
      </div>
    );
  };

  // キャラクター名
  const renderCharacterName = (nameJp?: string | null, nameEn?: string) => {
    const displayName = nameJp || nameEn;
    if (!displayName) return null;

    return (
      <span style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.8)' }}>
        <PlainText 
          text={displayName} 
          className={`${isMobile ? 'text-2xl' : 'text-4xl'} font-bold text-red-50`}
          showFallback={false}
        />
      </span>
    );
  };

  // ニックネーム
  const renderNickname = (nickname?: string | null) => {
    if (!nickname) return null;
    
    return (
      <p style={{ fontSize: isMobile ? '16px' : '20px', color: '#f87171', fontWeight: '600', marginTop: '8px' }}>
        <PlainText 
          text={nickname} 
          className="text-red-400 font-semibold"
          showFallback={false}
        />
      </p>
    );
  };

  // モバイル表示用の技行
  const renderMobileMoveRow = (move: MoveData, index: number) => (
    <div 
      key={move.id}
      onClick={() => {
        setSelectedMove(move);
        setShowMoveModal(true);
      }}
      style={{
        background: 'rgba(0, 0, 0, 0.8)',
        border: '1px solid rgba(185, 28, 28, 0.3)',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '12px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        transform: 'scale(1)',
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = 'scale(0.98)';
        e.currentTarget.style.background = 'rgba(127, 29, 29, 0.4)';
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.background = 'rgba(0, 0, 0, 0.8)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.background = 'rgba(0, 0, 0, 0.8)';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div style={{ fontSize: '12px', color: '#fca5a5', fontWeight: '500' }}>
          No.{move.move_num || index + 1}
        </div>
        <div style={{ fontSize: '12px', color: '#60a5fa', fontWeight: '500' }}>
          タップで詳細 ▶
        </div>
      </div>
      
      <div style={{ marginBottom: '12px' }}>
        {renderMoveName(move.move_name, move.move_name_kana)}
      </div>
      
      <div style={{ 
        display: 'flex', 
        alignItems: 'flex-start', 
        justifyContent: 'flex-start',
        padding: '8px 0'
      }}>
        <ResponsiveCommandDisplay 
          command={move.command} 
          size="md"
          className="w-full"
          showFallback={true}
        />
      </div>
    </div>
  );

  // デスクトップ表示用のテーブル行
  const renderDesktopMoveRow = (move: MoveData, index: number) => (
    <tr 
      key={move.id} 
      style={{ 
        borderBottom: '1px solid rgba(127, 29, 29, 0.2)',
        transition: 'all 0.2s'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(127, 29, 29, 0.3)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
      }}
    >
      {/* No */}
      <td style={{ 
        border: '2px solid rgba(185, 28, 28, 0.3)', 
        padding: `${getScaledFontSize(6)}px ${getScaledFontSize(3)}px`, 
        textAlign: 'center', 
        fontSize: `${getTableFontSize()}px`, 
        fontWeight: '500', 
        color: '#fca5a5',
        width: COLUMN_WIDTHS.no,
        maxWidth: COLUMN_WIDTHS.no,
        minWidth: COLUMN_WIDTHS.no
      }}>
        {move.move_num || index + 1}
      </td>
      
      {/* 技名 */}
      <td style={{ 
        border: '2px solid rgba(185, 28, 28, 0.3)', 
        padding: `${getScaledFontSize(6)}px ${getScaledFontSize(12)}px`, 
        fontSize: `${getTableFontSize()}px`,
        width: COLUMN_WIDTHS.move_name,
        maxWidth: COLUMN_WIDTHS.move_name,
        minWidth: COLUMN_WIDTHS.move_name
      }}>
        {renderMoveName(move.move_name, move.move_name_kana)}
      </td>
      
      {/* コマンド */}
      <td style={{ 
        border: '2px solid rgba(185, 28, 28, 0.3)', 
        padding: `${getScaledFontSize(6)}px ${getScaledFontSize(8)}px`, 
        fontSize: `${getTableFontSize()}px`,
        width: COLUMN_WIDTHS.command,
        maxWidth: COLUMN_WIDTHS.command,
        minWidth: COLUMN_WIDTHS.command,
        lineHeight: '1.3',
        verticalAlign: 'middle'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'flex-start', 
          minHeight: `${getScaledFontSize(24)}px`,
          width: '100%'
        }}>
          <ResponsiveCommandDisplay 
            command={move.command} 
            size={textScale > 0.8 ? 'md' : 'sm'}
            className="w-full"
            showFallback={true}
          />
        </div>
      </td>
      
      {/* 発生 */}
      <td style={{ 
        border: '2px solid rgba(185, 28, 28, 0.3)', 
        padding: `${getScaledFontSize(6)}px ${getScaledFontSize(3)}px`, 
        textAlign: 'center', 
        fontSize: `${getTableFontSize()}px`, 
        fontWeight: '500', 
        color: '#ffffff',
        width: COLUMN_WIDTHS.startup,
        maxWidth: COLUMN_WIDTHS.startup,
        minWidth: COLUMN_WIDTHS.startup
      }}>
        {move.startup_frame || '-'}
      </td>
      
      {/* 持続 */}
      <td style={{ 
        border: '2px solid rgba(185, 28, 28, 0.3)', 
        padding: `${getScaledFontSize(6)}px`, 
        textAlign: 'center', 
        fontSize: `${getTableFontSize()}px`, 
        fontWeight: '500', 
        color: '#ffffff',
        width: COLUMN_WIDTHS.active,
        maxWidth: COLUMN_WIDTHS.active,
        minWidth: COLUMN_WIDTHS.active
      }}>
        <TextWithIcons 
          text={move.active_frame || '-'} 
          size="sm"
          textClassName="text-white font-medium"
          showFallback={true}
          enableIconReplacement={true}
        />
      </td>
      
      {/* ヒット */}
      <td style={{ 
        border: '2px solid rgba(185, 28, 28, 0.3)', 
        padding: `${getScaledFontSize(6)}px`, 
        textAlign: 'center', 
        fontSize: `${getTableFontSize()}px`,
        width: COLUMN_WIDTHS.hit,
        maxWidth: COLUMN_WIDTHS.hit,
        minWidth: COLUMN_WIDTHS.hit
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: `${getScaledFontSize(24)}px`,
          width: '100%'
        }}>
          <FrameAdvantage value={move.hit_frame} size={textScale > 0.8 ? 'md' : 'sm'} />
        </div>
      </td>
      
      {/* ガード */}
      <td style={{ 
        border: '2px solid rgba(185, 28, 28, 0.3)', 
        padding: `${getScaledFontSize(6)}px`, 
        textAlign: 'center', 
        fontSize: `${getTableFontSize()}px`,
        width: COLUMN_WIDTHS.guard,
        maxWidth: COLUMN_WIDTHS.guard,
        minWidth: COLUMN_WIDTHS.guard
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: `${getScaledFontSize(24)}px`,
          width: '100%'
        }}>
          <FrameAdvantage value={move.block_frame} size={textScale > 0.8 ? 'md' : 'sm'} />
        </div>
      </td>
      
      {/* 判定 */}
      <td style={{ 
        border: '2px solid rgba(185, 28, 28, 0.3)', 
        padding: `${getScaledFontSize(6)}px`, 
        textAlign: 'center', 
        fontSize: `${getTableFontSize()}px`,
        width: COLUMN_WIDTHS.attribute,
        maxWidth: COLUMN_WIDTHS.attribute,
        minWidth: COLUMN_WIDTHS.attribute
      }}>
        {renderAttribute(move.attribute)}
      </td>
      
      {/* 属性 */}
      <td style={{ 
        border: '2px solid rgba(185, 28, 28, 0.3)', 
        padding: `${getScaledFontSize(6)}px ${getScaledFontSize(12)}px`, 
        textAlign: 'center', 
        fontSize: `${getTableFontSize()}px`,
        width: COLUMN_WIDTHS.effect,
        maxWidth: COLUMN_WIDTHS.effect,
        minWidth: COLUMN_WIDTHS.effect
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: `${getScaledFontSize(24)}px` 
        }}>
          <EffectDisplay 
            effectIds={move.effects ? move.effects.filter(e => e !== null) : []} 
            size={textScale > 0.8 ? 'md' : 'sm'}
            showTooltip={false}
          />
        </div>
      </td>
      
      {/* 備考 */}
      <td style={{ 
        border: '2px solid rgba(185, 28, 28, 0.3)', 
        padding: `${getScaledFontSize(6)}px ${getScaledFontSize(12)}px`, 
        fontSize: `${getTableFontSize()}px`,
        width: COLUMN_WIDTHS.remarks,
        maxWidth: COLUMN_WIDTHS.remarks,
        minWidth: COLUMN_WIDTHS.remarks,
        verticalAlign: 'top'
      }}>
        {renderRemarks(move.remarks)}
      </td>
    </tr>
  );

  // ローディング表示
  if (loading) {
    return (
      <div 
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(to bottom right, #111827, #7f1d1d, #000000)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <div style={{ fontSize: '18px', color: '#fef2f2', textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
          読み込み中...
        </div>
      </div>
    );
  }

  // キャラクターが見つからない場合
  if (!character) {
    return (
      <div 
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(to bottom right, #111827, #7f1d1d, #000000)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#f87171', marginBottom: '16px', textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
            キャラクターが見つかりません
          </h1>
          <a 
            href="/" 
            style={{
              background: 'linear-gradient(to right, #dc2626, #b91c1c)',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '8px',
              fontWeight: '600',
              textDecoration: 'none',
              boxShadow: '0 10px 15px rgba(0,0,0,0.3)',
              transition: 'all 0.2s'
            }}
          >
            トップページに戻る
          </a>
        </div>
      </div>
    );
  }

  // メイン表示
  return (
    <div 
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom right, #111827, #7f1d1d, #000000)',
        padding: isMobile ? '16px' : '24px',
        position: 'relative'
      }}
    >
      
      {/* ヘッダー */}
      <div style={{ marginBottom: isMobile ? '16px' : '24px' }}>
        <nav style={{ fontSize: '14px', color: '#d1d5db', marginBottom: '16px' }}>
          <a href="/" style={{ color: '#d1d5db', textDecoration: 'none' }}>トップ</a>
          <span style={{ margin: '0 8px', color: '#ef4444' }}>›</span>
          <span style={{ color: '#fca5a5' }}>
            {character.character_name_jp || character.character_name_en}
          </span>
        </nav>
        
        {/* デバッグ表示: 現在のテキストスケール */}
        {!isMobile && (
          <div style={{ 
            fontSize: '12px', 
            color: '#6b7280', 
            textAlign: 'right',
            marginBottom: '8px'
          }}>
            スケール: {textScale.toFixed(2)} | 画面幅: {typeof window !== 'undefined' ? window.innerWidth : 0}px
          </div>
        )}
      </div>

      {/* キャラクター情報表示 */}
      <div 
        style={{
          marginBottom: isMobile ? '24px' : '32px',
          background: 'linear-gradient(to right, #450a0a, #111827, #450a0a)',
          padding: isMobile ? '24px' : '32px',
          borderRadius: '8px',
          boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
          border: '1px solid rgba(185, 28, 28, 0.3)',
          backdropFilter: 'blur(4px)',
          maxWidth: '1152px',
          margin: `0 auto ${isMobile ? '24px' : '32px'} auto`
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 style={{ 
            fontSize: isMobile ? '24px' : '36px', 
            fontWeight: 'bold', 
            color: '#fef2f2', 
            marginBottom: '8px', 
            textShadow: '2px 2px 8px rgba(0,0,0,0.8)' 
          }}>
            {renderCharacterName(character.character_name_jp, character.character_name_en)}
          </h1>
          <p style={{ fontSize: isMobile ? '16px' : '18px', color: '#fca5a5' }}>
            <PlainText 
              text={character.character_name_en} 
              className="text-rose-300"
              showFallback={false}
            />
          </p>
          {renderNickname(character.nickname)}
        </div>
        
        {/* 基本情報 */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: isMobile ? '16px' : '24px', 
          marginBottom: '24px' 
        }}>
          <div 
            style={{
              background: 'rgba(0, 0, 0, 0.4)',
              padding: '16px',
              borderRadius: '8px',
              boxShadow: '0 10px 15px rgba(0,0,0,0.3)',
              border: '1px solid rgba(185, 28, 28, 0.2)',
              backdropFilter: 'blur(4px)'
            }}
          >
            <h3 style={{ fontWeight: '600', color: '#fca5a5', marginBottom: '8px' }}>基本情報</h3>
            <p style={{ fontSize: '14px', color: '#d1d5db' }}>身長: {character.height || '未設定'}</p>
            <p style={{ fontSize: '14px', color: '#d1d5db' }}>体重: {character.weight || '未設定'}</p>
            <p style={{ fontSize: '14px', color: '#d1d5db' }}>国籍: {character.nationality || '未設定'}</p>
            {character.martial_arts && (
              <p style={{ fontSize: '14px', color: '#d1d5db' }}>
                格闘技: <PlainText 
                  text={character.martial_arts} 
                  className="text-gray-300"
                  showFallback={false}
                />
              </p>
            )}
          </div>
        </div>
        
        {/* キャラクター紹介 */}
        {character.character_description && (
          <div 
            style={{
              border: '1px solid rgba(185, 28, 28, 0.3)',
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 10px 15px rgba(0,0,0,0.3)',
              background: 'rgba(0, 0, 0, 0.2)',
              backdropFilter: 'blur(4px)'
            }}
          >
            <button 
              onClick={() => setIsDescriptionOpen(!isDescriptionOpen)}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '16px',
                background: 'rgba(69, 10, 10, 0.5)',
                border: 'none',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
                borderBottom: '1px solid rgba(185, 28, 28, 0.2)'
              }}
            >
              <h3 style={{ fontWeight: '600', color: '#fca5a5', margin: 0 }}>キャラクター紹介</h3>
              <span style={{ 
                transform: isDescriptionOpen ? 'rotate(180deg)' : 'rotate(0deg)', 
                transition: 'transform 0.2s', 
                color: '#f87171' 
              }}>
                ▼
              </span>
            </button>
            
            {isDescriptionOpen && (
              <div style={{ padding: '24px', background: 'rgba(0, 0, 0, 0.3)' }}>
                {renderDescription(character.character_description)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 技分類選択・技表示 */}
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ 
          fontSize: isMobile ? '20px' : '24px', 
          fontWeight: 'bold', 
          color: '#fef2f2', 
          marginBottom: isMobile ? '16px' : '24px', 
          textShadow: '2px 2px 8px rgba(0,0,0,0.8)' 
        }}>
          技一覧
        </h2>
        
        {categories.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {categories.map(category => {
              const moves = movesByCategory[category.id] || [];
              const isSelected = selectedCategories.has(category.id);
              
              return (
                <div 
                  key={category.id} 
                  style={{
                    border: '1px solid rgba(185, 28, 28, 0.4)',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
                    background: 'linear-gradient(to right, rgba(69, 10, 10, 0.5), rgba(0, 0, 0, 0.5))',
                    backdropFilter: 'blur(4px)'
                  }}
                >
                  <button 
                    onClick={() => handleCategorySelect(category.id)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '16px',
                      background: 'linear-gradient(to right, rgba(127, 29, 29, 0.7), rgba(69, 10, 10, 0.7))',
                      border: 'none',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      borderBottom: '1px solid rgba(220, 38, 38, 0.3)'
                    }}
                  >
                    <span style={{ 
                      fontWeight: '600', 
                      color: '#fef2f2', 
                      textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                      fontSize: isMobile ? '14px' : '16px'
                    }}>
                      {`${category.move_category} (${moves.length}個の技)`}
                    </span>
                    <span style={{ 
                      transform: isSelected ? 'rotate(180deg)' : 'rotate(0deg)', 
                      transition: 'transform 0.2s', 
                      color: '#f87171' 
                    }}>
                      ▼
                    </span>
                  </button>
                  
                  {isSelected && (
                    <div style={{ background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.8), rgba(69, 10, 10, 0.6))' }}>
                      {/* モバイル表示: カード形式 */}
                      {isMobile ? (
                        <div style={{ padding: '16px' }}>
                          {moves.map((move, index) => renderMobileMoveRow(move, index))}
                        </div>
                      ) : (
                        /* デスクトップ表示: テーブル形式 */
                        <div style={{ position: 'relative', overflowX: 'auto' }}>
                          <table style={{ 
                            width: '100%', 
                            borderCollapse: 'collapse', 
                            border: '1px solid rgb(185, 28, 28)', 
                            minWidth: 'max-content',
                            tableLayout: 'fixed'
                          }}>
                            <thead>
                              <tr style={{ background: 'linear-gradient(to right, #7f1d1d, #b91c1c, #7f1d1d)' }}>
                                {/* No */}
                                <th style={{ 
                                  border: '1px solid rgb(185, 28, 28)', 
                                  padding: `${getScaledFontSize(6)}px ${getScaledFontSize(3)}px`, 
                                  fontSize: `${getTableFontSize()}px`, 
                                  fontWeight: 'bold', 
                                  width: COLUMN_WIDTHS.no,
                                  maxWidth: COLUMN_WIDTHS.no,
                                  minWidth: COLUMN_WIDTHS.no,
                                  color: '#fef2f2'
                                }}>
                                  No
                                </th>
                                
                                {/* 技名 */}
                                <th style={{ 
                                  border: '1px solid rgb(185, 28, 28)', 
                                  padding: `${getScaledFontSize(6)}px ${getScaledFontSize(12)}px`, 
                                  fontSize: `${getTableFontSize()}px`, 
                                  fontWeight: 'bold', 
                                  width: COLUMN_WIDTHS.move_name,
                                  maxWidth: COLUMN_WIDTHS.move_name,
                                  minWidth: COLUMN_WIDTHS.move_name,
                                  color: '#fef2f2'
                                }}>
                                  技名
                                </th>
                                
                                {/* コマンド */}
                                <th style={{ 
                                  border: '1px solid rgb(185, 28, 28)', 
                                  padding: `${getScaledFontSize(6)}px ${getScaledFontSize(8)}px`, 
                                  fontSize: `${getTableFontSize()}px`, 
                                  fontWeight: 'bold', 
                                  width: COLUMN_WIDTHS.command,
                                  maxWidth: COLUMN_WIDTHS.command,
                                  minWidth: COLUMN_WIDTHS.command,
                                  color: '#fef2f2' 
                                }}>
                                  コマンド
                                </th>
                                
                                {/* 発生 */}
                                <th style={{ 
                                  border: '1px solid rgb(185, 28, 28)', 
                                  padding: `${getScaledFontSize(6)}px ${getScaledFontSize(3)}px`, 
                                  fontSize: `${getTableFontSize()}px`, 
                                  fontWeight: 'bold', 
                                  width: COLUMN_WIDTHS.startup,
                                  maxWidth: COLUMN_WIDTHS.startup,
                                  minWidth: COLUMN_WIDTHS.startup,
                                  color: '#fef2f2' 
                                }}>
                                  発生
                                </th>
                                
                                {/* 持続 */}
                                <th style={{ 
                                  border: '1px solid rgb(185, 28, 28)', 
                                  padding: `${getScaledFontSize(6)}px`, 
                                  fontSize: `${getTableFontSize()}px`, 
                                  fontWeight: 'bold', 
                                  width: COLUMN_WIDTHS.active,
                                  maxWidth: COLUMN_WIDTHS.active,
                                  minWidth: COLUMN_WIDTHS.active,
                                  color: '#fef2f2' 
                                }}>
                                  持続
                                </th>
                                
                                {/* ヒット */}
                                <th style={{ 
                                  border: '1px solid rgb(185, 28, 28)', 
                                  padding: `${getScaledFontSize(6)}px`, 
                                  fontSize: `${getTableFontSize()}px`, 
                                  fontWeight: 'bold', 
                                  width: COLUMN_WIDTHS.hit,
                                  maxWidth: COLUMN_WIDTHS.hit,
                                  minWidth: COLUMN_WIDTHS.hit,
                                  color: '#fef2f2' 
                                }}>
                                  ヒット
                                </th>
                                
                                {/* ガード */}
                                <th style={{ 
                                  border: '1px solid rgb(185, 28, 28)', 
                                  padding: `${getScaledFontSize(6)}px`, 
                                  fontSize: `${getTableFontSize()}px`, 
                                  fontWeight: 'bold', 
                                  width: COLUMN_WIDTHS.guard,
                                  maxWidth: COLUMN_WIDTHS.guard,
                                  minWidth: COLUMN_WIDTHS.guard,
                                  color: '#fef2f2' 
                                }}>
                                  ガード
                                </th>
                                
                                {/* 判定 */}
                                <th style={{ 
                                  border: '1px solid rgb(185, 28, 28)', 
                                  padding: `${getScaledFontSize(6)}px`, 
                                  fontSize: `${getTableFontSize()}px`, 
                                  fontWeight: 'bold', 
                                  width: COLUMN_WIDTHS.attribute,
                                  maxWidth: COLUMN_WIDTHS.attribute,
                                  minWidth: COLUMN_WIDTHS.attribute,
                                  color: '#fef2f2' 
                                }}>
                                  判定
                                </th>
                                
                                {/* 属性 */}
                                <th style={{ 
                                  border: '1px solid rgb(185, 28, 28)', 
                                  padding: `${getScaledFontSize(6)}px ${getScaledFontSize(12)}px`, 
                                  fontSize: `${getTableFontSize()}px`, 
                                  fontWeight: 'bold', 
                                  width: COLUMN_WIDTHS.effect,
                                  maxWidth: COLUMN_WIDTHS.effect,
                                  minWidth: COLUMN_WIDTHS.effect,
                                  color: '#fef2f2' 
                                }}>
                                  属性
                                </th>
                                
                                {/* 備考 */}
                                <th style={{ 
                                  border: '1px solid rgb(185, 28, 28)', 
                                  padding: `${getScaledFontSize(6)}px ${getScaledFontSize(12)}px`, 
                                  fontSize: `${getTableFontSize()}px`, 
                                  fontWeight: 'bold', 
                                  width: COLUMN_WIDTHS.remarks,
                                  maxWidth: COLUMN_WIDTHS.remarks,
                                  minWidth: COLUMN_WIDTHS.remarks,
                                  color: '#fef2f2' 
                                }}>
                                  備考
                                </th>
                              </tr>
                            </thead>
                            <tbody style={{ 
                              background: '#000000', 
                              color: 'white' 
                            }}>
                              {moves.map((move, index) => renderDesktopMoveRow(move, index))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div 
            style={{
              textAlign: 'center',
              padding: '48px',
              background: 'linear-gradient(to right, rgba(69, 10, 10, 0.3), rgba(0, 0, 0, 0.3))',
              borderRadius: '8px',
              border: '1px solid rgba(185, 28, 28, 0.2)',
              backdropFilter: 'blur(4px)'
            }}
          >
            <p style={{ color: '#fca5a5' }}>このキャラクターには技データがありません</p>
          </div>
        )}
      </div>

      {/* モーダル - 技詳細表示 */}
      {showMoveModal && selectedMove && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.8)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            backdropFilter: 'blur(4px)'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowMoveModal(false);
              setSelectedMove(null);
            }
          }}
        >
          <div 
            style={{
              background: 'linear-gradient(to bottom, #111827, #7f1d1d, #000000)',
              border: '2px solid rgba(185, 28, 28, 0.5)',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '90vw',
              maxHeight: '80vh',
              overflow: 'auto',
              boxShadow: '0 25px 50px rgba(0,0,0,0.8)',
              position: 'relative'
            }}
          >
            {/* モーダルヘッダー */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'flex-start',
              marginBottom: '20px',
              borderBottom: '1px solid rgba(185, 28, 28, 0.3)',
              paddingBottom: '16px'
            }}>
              <div>
                <div style={{ fontSize: '12px', color: '#fca5a5', marginBottom: '4px' }}>
                  No.{selectedMove.move_num || '?'}
                </div>
                {renderMoveName(selectedMove.move_name, selectedMove.move_name_kana)}
              </div>
              <button
                onClick={() => {
                  setShowMoveModal(false);
                  setSelectedMove(null);
                }}
                style={{
                  background: 'rgba(185, 28, 28, 0.3)',
                  border: '1px solid rgba(185, 28, 28, 0.5)',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  color: '#fca5a5',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(185, 28, 28, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(185, 28, 28, 0.3)';
                }}
              >
                ×
              </button>
            </div>

            {/* コマンド表示 */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ 
                color: '#fca5a5', 
                fontSize: '14px', 
                fontWeight: '600', 
                marginBottom: '8px' 
              }}>
                コマンド
              </h4>
              <div style={{ 
                background: 'rgba(0, 0, 0, 0.4)',
                padding: '12px',
                borderRadius: '6px',
                border: '1px solid rgba(185, 28, 28, 0.2)',
                wordWrap: 'break-word',
                wordBreak: 'break-all',
                whiteSpace: 'normal'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'flex-start',
                  flexWrap: 'wrap',
                  gap: '2px',
                  width: '100%'
                }}>
                  <ResponsiveCommandDisplay 
                    command={selectedMove.command} 
                    size="lg"
                    className="w-full"
                    showFallback={true}
                  />
                </div>
              </div>
            </div>

            {/* フレームデータ */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ 
                color: '#fca5a5', 
                fontSize: '14px', 
                fontWeight: '600', 
                marginBottom: '12px' 
              }}>
                フレームデータ
              </h4>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(2, 1fr)', 
                gap: '12px'
              }}>
                <div style={{
                  background: 'rgba(0, 0, 0, 0.4)',
                  padding: '12px',
                  borderRadius: '6px',
                  border: '1px solid rgba(185, 28, 28, 0.2)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '12px', color: '#d1d5db', marginBottom: '4px' }}>発生</div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#ffffff' }}>
                    {selectedMove.startup_frame || '-'}
                  </div>
                </div>
                
                <div style={{
                  background: 'rgba(0, 0, 0, 0.4)',
                  padding: '12px',
                  borderRadius: '6px',
                  border: '1px solid rgba(185, 28, 28, 0.2)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '12px', color: '#d1d5db', marginBottom: '4px' }}>持続</div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#ffffff' }}>
                    <TextWithIcons 
                      text={selectedMove.active_frame || '-'} 
                      size="sm"
                      textClassName="text-white font-semibold"
                      showFallback={true}
                      enableIconReplacement={true}
                    />
                  </div>
                </div>
                
                <div style={{
                  background: 'rgba(0, 0, 0, 0.4)',
                  padding: '12px',
                  borderRadius: '6px',
                  border: '1px solid rgba(185, 28, 28, 0.2)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '12px', color: '#d1d5db', marginBottom: '4px' }}>ヒット</div>
                  <div style={{ fontSize: '16px', fontWeight: '600' }}>
                    <FrameAdvantage value={selectedMove.hit_frame} size="md" />
                  </div>
                </div>
                
                <div style={{
                  background: 'rgba(0, 0, 0, 0.4)',
                  padding: '12px',
                  borderRadius: '6px',
                  border: '1px solid rgba(185, 28, 28, 0.2)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '12px', color: '#d1d5db', marginBottom: '4px' }}>ガード</div>
                  <div style={{ fontSize: '16px', fontWeight: '600' }}>
                    <FrameAdvantage value={selectedMove.block_frame} size="md" />
                  </div>
                </div>
              </div>
            </div>

            {/* 属性・判定 */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ 
                color: '#fca5a5', 
                fontSize: '14px', 
                fontWeight: '600', 
                marginBottom: '12px' 
              }}>
                属性・判定
              </h4>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(2, 1fr)', 
                gap: '12px'
              }}>
                <div style={{
                  background: 'rgba(0, 0, 0, 0.4)',
                  padding: '12px',
                  borderRadius: '6px',
                  border: '1px solid rgba(185, 28, 28, 0.2)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '12px', color: '#d1d5db', marginBottom: '4px' }}>判定</div>
                  <div style={{ fontSize: '16px', fontWeight: '600' }}>
                    {renderAttribute(selectedMove.attribute)}
                  </div>
                </div>
                
                <div style={{
                  background: 'rgba(0, 0, 0, 0.4)',
                  padding: '12px',
                  borderRadius: '6px',
                  border: '1px solid rgba(185, 28, 28, 0.2)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '12px', color: '#d1d5db', marginBottom: '4px' }}>属性</div>
                  <div style={{ fontSize: '16px', fontWeight: '600' }}>
                    <EffectDisplay 
                      effectIds={selectedMove.effects ? selectedMove.effects.filter(e => e !== null) : []} 
                      size="md"
                      showTooltip={false}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 備考 */}
            {selectedMove.remarks && selectedMove.remarks.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ 
                  color: '#fca5a5', 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  marginBottom: '12px' 
                }}>
                  備考
                </h4>
                <div style={{
                  background: 'rgba(0, 0, 0, 0.4)',
                  padding: '16px',
                  borderRadius: '6px',
                  border: '1px solid rgba(185, 28, 28, 0.2)'
                }}>
                  {renderRemarks(selectedMove.remarks)}
                </div>
              </div>
            )}

            {/* 閉じるボタン */}
            <div style={{ textAlign: 'center' }}>
              <button
                onClick={() => {
                  setShowMoveModal(false);
                  setSelectedMove(null);
                }}
                style={{
                  background: 'linear-gradient(to right, #dc2626, #b91c1c)',
                  color: 'white',
                  padding: '12px 24px',
                  borderRadius: '6px',
                  border: 'none',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
                }}
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}