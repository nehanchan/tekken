// src/app/combo/create/page.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { client } from '@/lib/client';
import { TextWithIcons } from '@/components/CommandDisplay';

interface Character {
  id: string;
  character_id: string;
  character_name_en: string;
  character_name_jp?: string | null;
  display_name?: string | null;
}

interface Move {
  id: string;
  move_id: string;
  move_name: string;
  move_name_kana?: string | null;
  command?: string | null;
  character_id: string;
}

interface ComboNode {
  id: string;
  type: 'move' | 'freetext';
  moveId?: string;
  moveName?: string;
  command?: string;
  freeText?: string;
  backgroundColor: string;
  children: string[];
}

const BACKGROUND_COLORS = {
  white: '#ffffff',
  red: '#fca5a5',
  blue: '#93c5fd',
  green: '#86efac',
  yellow: '#fde047',
  purple: '#d8b4fe',
  gray: '#d1d5db',
};

// コマンドアイコンの定義（指定された配置順）
const COMMAND_ICONS = {
  directions: [
    // 1行目
    { code: 'bj', label: '↖ (7)' },
    { code: 'ju', label: '↑ (8)' },
    { code: 'fj', label: '↗ (9)' },
    // 2行目
    { code: 'ba', label: '← (4)' },
    { code: 'nt', label: 'N (5)' },
    { code: 'fo', label: '→ (6)' },
    // 3行目
    { code: 'bc', label: 'バックチャージ' },
    { code: 'cr', label: '↓ (2)' },
    { code: 'fc', label: 'フロントチャージ' },
    // 4行目
    { code: 'qy', label: 'クイック' },
    { code: 'wu', label: 'ウェイクアップ' },
    { code: 'ei', label: 'EX技' },
    // 5行目
    { code: 'ah', label: 'エアヒット' },
    { code: null, label: '' }, // 空欄
    { code: 'dk', label: '↙ (1)' },
    // 6行目
    { code: 'zb', label: 'ZB' },
    { code: 'xn', label: 'XN' },
    { code: 'cm', label: 'カウンター' },
  ],
  buttons: [
    // 1行目
    { code: 'lp', label: '弱P' },
    { code: 'rp', label: '強P' },
    { code: 'wp', label: 'ウォークパンチ' },
    // 2行目
    { code: 'lk', label: '弱K' },
    { code: 'rk', label: '強K' },
    { code: 'wk', label: 'ウォークキック' },
    // 3行目
    { code: 'ij', label: 'インジャンプ' },
    { code: 'uk', label: 'UK' },
    { code: null, label: '' }, // 空欄
  ],
  others: [
    { code: 'all', label: '全ボタン' },
    { code: 'ng', label: '↘ (3)' },
    { code: 'nh', label: 'NH' },
    { code: 'nv', label: 'ノーマルヒット' },
    { code: 'nb', label: 'ニュートラル' },
  ],
  modifiers: [
    { code: '+', label: '同時押し' },
    { code: 'or', label: 'または' },
    { code: '~', label: '最速' },
    { code: '>', label: 'ディレイ' },
  ],
  effects: [
    { code: 'TR', label: 'トルネード' },
    { code: 'FB', label: 'ファウンドバウンド' },
    { code: 'KS', label: 'KS' },
    { code: 'GV', label: 'GV' },
    { code: 'HO', label: 'ホーミング' },
    { code: 'HT', label: 'ヒート' },
    { code: 'PC', label: 'パワークラッシュ' },
    { code: 'WB', label: 'ウォールバウンド' },
    { code: 'wn', label: 'WN' },
    { code: 'wl', label: 'ホワイルラン' },
    { code: 'mp', label: '中P' },
    { code: 'mk', label: '中K' },
  ]
};

export default function ComboCreatePage() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacterId, setSelectedCharacterId] = useState('');
  const [moves, setMoves] = useState<Move[]>([]);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState(0);
  const [damage, setDamage] = useState('');
  const [importance, setImportance] = useState(0);
  const [displayMode, setDisplayMode] = useState<'move_name' | 'command'>('move_name');
  
  const [nodes, setNodes] = useState<Map<string, ComboNode>>(new Map());
  const [rootNodeId, setRootNodeId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  
  const [searchMode, setSearchMode] = useState<'name' | 'command'>('name');
  const [moveSearchQuery, setMoveSearchQuery] = useState('');
  const [selectedCommandIcons, setSelectedCommandIcons] = useState<string[]>([]);
  const [filteredMoves, setFilteredMoves] = useState<Move[]>([]);
  const [showMoveDropdown, setShowMoveDropdown] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCharacters();
  }, []);

  useEffect(() => {
    if (selectedCharacterId) {
      console.log('🔍 キャラクター選択:', selectedCharacterId);
      fetchMoves(selectedCharacterId);
    } else {
      console.log('❌ キャラクター未選択');
      setMoves([]);
      setFilteredMoves([]);
    }
  }, [selectedCharacterId]);

  // 技配列の変更を監視
  useEffect(() => {
    console.log('📊 現在の技数:', moves.length);
    if (moves.length > 0) {
      console.log('📝 技データサンプル:', moves.slice(0, 3).map(m => ({
        move_name: m.move_name,
        character_id: m.character_id,
        command: m.command
      })));
    }
  }, [moves]);

  // 技名検索
  useEffect(() => {
    if (searchMode === 'name' && moveSearchQuery.trim()) {
      console.log('🔎 技名検索開始:', moveSearchQuery, '/ 対象技数:', moves.length);
      
      const normalizeString = (str: string) => {
        return str
          .toLowerCase()
          .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
          .replace(/　/g, ' ')
          .replace(/[\u30A1-\u30F6]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0x60));
      };
      
      const query = normalizeString(moveSearchQuery);
      console.log('🔤 正規化後の検索文字列:', query);
      
      let debugCount = 0;
      const filtered = moves.filter(m => {
        const moveName = normalizeString(m.move_name);
        const moveNameKana = m.move_name_kana ? normalizeString(m.move_name_kana) : '';
        const command = m.command ? normalizeString(m.command) : '';
        
        const matchMoveName = moveName.includes(query);
        const matchKana = moveNameKana.includes(query);
        const matchCommand = command.includes(query);
        
        const isMatch = matchMoveName || matchKana || matchCommand;
        
        if (debugCount < 5) {
          debugCount++;
          console.log('  技チェック:', {
            move_name: m.move_name,
            normalized: moveName,
            matchMoveName,
            matchKana,
            matchCommand,
            isMatch
          });
        }
        
        return isMatch;
      });
      
      console.log(`✅ 検索結果: "${moveSearchQuery}" -> ${filtered.length}件`);
      setFilteredMoves(filtered);
    } else if (searchMode === 'name') {
      setFilteredMoves([]);
    }
  }, [moveSearchQuery, moves, searchMode]);

  // コマンド検索
  useEffect(() => {
    if (searchMode === 'command' && selectedCommandIcons.length > 0) {
      console.log('🎮 コマンド検索開始:', selectedCommandIcons);
      
      const searchPattern = selectedCommandIcons.join(' ');
      console.log('  検索パターン:', searchPattern);
      
      const filtered = moves.filter(m => {
        if (!m.command) return false;
        
        const normalizedCommand = m.command.replace(/\s+/g, ' ').toLowerCase();
        const normalizedPattern = searchPattern.toLowerCase();
        
        const isMatch = normalizedCommand.includes(normalizedPattern);
        
        if (isMatch) {
          console.log('  マッチ:', m.move_name, '/', m.command);
        }
        
        return isMatch;
      });
      
      console.log(`✅ コマンド検索結果: "${searchPattern}" -> ${filtered.length}件`);
      setFilteredMoves(filtered);
      setShowMoveDropdown(true);
    } else if (searchMode === 'command') {
      setFilteredMoves([]);
      setShowMoveDropdown(false);
    }
  }, [selectedCommandIcons, moves, searchMode]);

  useEffect(() => {
    if (selectedNodeId) {
      const node = nodes.get(selectedNodeId);
      if (node && node.type === 'move' && node.moveName) {
        setMoveSearchQuery(node.moveName);
        setShowMoveDropdown(false);
      } else {
        setMoveSearchQuery('');
        setShowMoveDropdown(false);
      }
    } else {
      setMoveSearchQuery('');
      setShowMoveDropdown(false);
    }
  }, [selectedNodeId, nodes]);

  const fetchCharacters = async () => {
    try {
      const { data } = await client.models.Character.list({ authMode: 'apiKey' });
      const validChars = (data || []).filter(c => c !== null) as Character[];
      console.log('✅ 取得したキャラクター数:', validChars.length);
      if (validChars.length > 0) {
        console.log('📋 サンプルキャラクター:', {
          character_id: validChars[0].character_id,
          character_id_type: typeof validChars[0].character_id,
          name: validChars[0].display_name || validChars[0].character_name_jp || validChars[0].character_name_en
        });
      }
      const sorted = validChars.sort((a, b) => {
        const idA = String(a.character_id).padStart(3, '0');
        const idB = String(b.character_id).padStart(3, '0');
        return idA.localeCompare(idB);
      });
      setCharacters(sorted);
    } catch (error) {
      console.error('❌ キャラクター取得エラー:', error);
    }
  };

  const fetchMoves = async (characterId: string) => {
    try {
      console.log('━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🎯 技取得開始');
      console.log('  対象キャラクターID:', characterId);
      console.log('  型:', typeof characterId);
      
      let allMoves: Move[] = [];
      let nextToken: string | null | undefined = undefined;
      let pageCount = 0;
      
      do {
        pageCount++;
        console.log(`  ページ${pageCount}を取得中...`);
        
        const response: { data: any[]; nextToken?: string | null } = await client.models.Move.list({ 
          authMode: 'apiKey',
          limit: 1000,
          nextToken: nextToken
        });
        
        const pageMoves = (response.data || []).filter((m: any) => m !== null) as Move[];
        allMoves = [...allMoves, ...pageMoves];
        nextToken = response.nextToken;
        
        console.log(`    このページ: ${pageMoves.length}件`);
        console.log(`    累計: ${allMoves.length}件`);
        
      } while (nextToken);
      
      console.log(`  全${pageCount}ページから計${allMoves.length}件取得完了`);
      
      if (allMoves.length > 0) {
        console.log('  サンプル技データ:');
        allMoves.slice(0, 3).forEach((m: Move) => {
          console.log('    -', {
            move_name: m.move_name,
            character_id: m.character_id,
            character_id_type: typeof m.character_id,
            command: m.command
          });
        });
      }
      
      const charIdStr = String(characterId).trim();
      console.log('  フィルタ条件:', charIdStr);
      
      let matchCount = 0;
      const validMoves = allMoves.filter(m => {
        const moveCharId = String(m.character_id).trim();
        
        const exactMatch = charIdStr === moveCharId;
        const numericMatch = parseInt(charIdStr) === parseInt(moveCharId);
        const paddedMatch = charIdStr.padStart(3, '0') === moveCharId.padStart(3, '0');
        
        const isMatch = exactMatch || numericMatch || paddedMatch;
        
        if (isMatch && matchCount < 3) {
          matchCount++;
          console.log('    マッチ:', {
            move_name: m.move_name,
            character_id: moveCharId,
            exactMatch,
            numericMatch,
            paddedMatch
          });
        }
        
        return isMatch;
      });
      
      console.log('  フィルタ後:', validMoves.length, '件');
      
      if (validMoves.length > 0) {
        console.log('  取得した技の例:');
        validMoves.slice(0, 5).forEach((m: Move) => {
          console.log('    -', m.move_name, '(character_id:', m.character_id, ')');
        });
      } else {
        console.warn('⚠️ このキャラクターIDに一致する技が見つかりませんでした');
        console.log('  確認: 全技の中にこのキャラクターIDの技はありますか？');
        const uniqueCharIds = [...new Set(allMoves.map(m => m.character_id))];
        console.log('  データベース内のキャラクターID一覧:', uniqueCharIds);
      }
      
      const sorted = validMoves.sort((a, b) => a.move_name.localeCompare(b.move_name));
      setMoves(sorted);
      setFilteredMoves([]);
      console.log('✅ 技取得完了');
      console.log('━━━━━━━━━━━━━━━━━━━━━━');
    } catch (error) {
      console.error('❌ 技取得エラー:', error);
    }
  };

  const addCommandIcon = (code: string) => {
    setSelectedCommandIcons([...selectedCommandIcons, code]);
  };

  const removeLastCommandIcon = () => {
    setSelectedCommandIcons(selectedCommandIcons.slice(0, -1));
  };

  const clearCommandIcons = () => {
    setSelectedCommandIcons([]);
  };

  const generateNodeId = () => {
    return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const addRootNode = () => {
    if (rootNodeId) {
      alert('ルートノードは既に存在します');
      return;
    }
    const newNodeId = generateNodeId();
    const newNode: ComboNode = {
      id: newNodeId,
      type: 'move',
      backgroundColor: BACKGROUND_COLORS.white,
      children: []
    };
    setNodes(new Map(nodes.set(newNodeId, newNode)));
    setRootNodeId(newNodeId);
    setSelectedNodeId(newNodeId);
  };

  const addChildNode = () => {
    if (!selectedNodeId) {
      alert('親ノードを選択してください');
      return;
    }
    const parentNode = nodes.get(selectedNodeId);
    if (!parentNode) return;

    const newNodeId = generateNodeId();
    const newNode: ComboNode = {
      id: newNodeId,
      type: 'move',
      backgroundColor: BACKGROUND_COLORS.white,
      children: []
    };

    const updatedParent = {
      ...parentNode,
      children: [...parentNode.children, newNodeId]
    };

    const newNodes = new Map(nodes);
    newNodes.set(newNodeId, newNode);
    newNodes.set(selectedNodeId, updatedParent);
    setNodes(newNodes);
    setSelectedNodeId(newNodeId);
  };

  const updateNodeType = (type: 'move' | 'freetext') => {
    if (!selectedNodeId) return;
    const node = nodes.get(selectedNodeId);
    if (!node) return;
    const updatedNode: ComboNode = {
      ...node,
      type,
      moveId: undefined,
      moveName: undefined,
      command: undefined,
      freeText: undefined
    };
    setNodes(new Map(nodes.set(selectedNodeId, updatedNode)));
  };

  const updateNodeMove = (moveId: string) => {
    if (!selectedNodeId) return;
    const node = nodes.get(selectedNodeId);
    if (!node) return;
    const move = moves.find(m => m.id === moveId);
    if (!move) return;
    const updatedNode: ComboNode = {
      ...node,
      type: 'move',
      moveId: move.id,
      moveName: move.move_name,
      command: move.command || undefined,
      freeText: undefined
    };
    setNodes(new Map(nodes.set(selectedNodeId, updatedNode)));
    setMoveSearchQuery(move.move_name);
    setShowMoveDropdown(false);
  };

  const updateNodeFreeText = (text: string) => {
    if (!selectedNodeId) return;
    const node = nodes.get(selectedNodeId);
    if (!node) return;
    const updatedNode: ComboNode = {
      ...node,
      type: 'freetext',
      moveId: undefined,
      moveName: undefined,
      command: undefined,
      freeText: text
    };
    setNodes(new Map(nodes.set(selectedNodeId, updatedNode)));
  };

  const updateNodeColor = (nodeId: string, color: string) => {
    const node = nodes.get(nodeId);
    if (!node) return;
    const updatedNode = {
      ...node,
      backgroundColor: BACKGROUND_COLORS[color as keyof typeof BACKGROUND_COLORS]
    };
    setNodes(new Map(nodes.set(nodeId, updatedNode)));
  };

  const deleteNode = (nodeId: string) => {
    if (!confirm('このノードとその子孫を削除しますか?')) return;
    const deleteRecursive = (id: string, nodesToDelete: Set<string>) => {
      nodesToDelete.add(id);
      const node = nodes.get(id);
      if (node) {
        node.children.forEach(childId => deleteRecursive(childId, nodesToDelete));
      }
    };
    const nodesToDelete = new Set<string>();
    deleteRecursive(nodeId, nodesToDelete);
    const newNodes = new Map(nodes);
    nodesToDelete.forEach(id => newNodes.delete(id));
    newNodes.forEach((node, id) => {
      if (node.children.includes(nodeId)) {
        newNodes.set(id, {
          ...node,
          children: node.children.filter(cid => cid !== nodeId)
        });
      }
    });
    if (rootNodeId === nodeId) {
      setRootNodeId(null);
    }
    setNodes(newNodes);
    setSelectedNodeId(null);
  };

  const renderTree = (nodeId: string, depth: number = 0): React.ReactElement | null => {
    const node = nodes.get(nodeId);
    if (!node) return null;
    const isSelected = selectedNodeId === nodeId;
    const displayText = displayMode === 'move_name' 
      ? (node.moveName || node.freeText || '未設定')
      : (node.command || node.freeText || '未設定');
    return (
      <div key={node.id} style={{ marginLeft: depth > 0 ? '40px' : '0' }}>
        <div onClick={() => setSelectedNodeId(node.id)} style={{ padding: '12px 16px', margin: '8px 0', backgroundColor: node.backgroundColor, border: isSelected ? '3px solid #ef4444' : '2px solid #6b7280', borderRadius: '8px', cursor: 'pointer', boxShadow: isSelected ? '0 0 10px rgba(239, 68, 68, 0.5)' : '0 2px 4px rgba(0,0,0,0.1)', transition: 'all 0.2s', color: '#000000', fontWeight: '600', fontSize: '14px' }}>
          <TextWithIcons text={displayText} size="sm" textClassName="font-semibold text-gray-900" showFallback={false} enableIconReplacement={true} />
        </div>
        {node.children.map(childId => renderTree(childId, depth + 1))}
      </div>
    );
  };

  const saveCombo = async () => {
    if (!selectedCharacterId) {
      alert('キャラクターを選択してください');
      return;
    }
    if (!title.trim()) {
      alert('タイトルを入力してください');
      return;
    }
    if (!rootNodeId) {
      alert('コンボツリーを作成してください');
      return;
    }
    setLoading(true);
    try {
      const character = characters.find(c => c.character_id === selectedCharacterId);
      const characterName = character?.display_name || character?.character_name_jp || character?.character_name_en || '';
      const nodesObject: { [key: string]: any } = {};
      nodes.forEach((node, id) => {
        nodesObject[id] = {
          id: node.id,
          type: node.type,
          moveId: node.moveId,
          moveName: node.moveName,
          command: node.command,
          freeText: node.freeText,
          backgroundColor: node.backgroundColor,
          children: node.children
        };
      });
      const treeData = { rootId: rootNodeId, nodes: nodesObject };
      await client.models.Combo.create({
        character_id: selectedCharacterId,
        character_name: characterName,
        title: title.trim(),
        description: description.trim() || undefined,
        difficulty: difficulty > 0 ? difficulty : undefined,
        damage: damage ? parseInt(damage) : undefined,
        importance: importance > 0 ? importance : undefined,
        nodes: JSON.stringify(treeData),
        display_mode: displayMode
      }, { authMode: 'apiKey' });
      alert('コンボを保存しました!');
      setTitle('');
      setDescription('');
      setDifficulty(0);
      setDamage('');
      setImportance(0);
      setNodes(new Map());
      setRootNodeId(null);
      setSelectedNodeId(null);
      setMoveSearchQuery('');
      setSelectedCommandIcons([]);
    } catch (error) {
      console.error('保存エラー:', error);
      alert('保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const getDisplayName = (char: Character) => {
    return char.display_name || char.character_name_jp || char.character_name_en;
  };

  const selectedNode = selectedNodeId ? nodes.get(selectedNodeId) : null;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #000000 0%, #1a0505 50%, #000000 100%)', padding: '20px' }}>
      <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffffff', letterSpacing: '2px' }}>コンボ作成</h1>
          <div style={{ display: 'flex', gap: '10px' }}>
            <a href="/combo/list" style={{ padding: '10px 20px', background: 'rgba(59, 130, 246, 0.3)', border: '2px solid rgba(59, 130, 246, 0.5)', borderRadius: '6px', color: '#60a5fa', textDecoration: 'none', fontWeight: 'bold' }}>一覧</a>
            <a href="/" style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #dc2626, #991b1b)', border: 'none', borderRadius: '6px', color: '#ffffff', textDecoration: 'none', fontWeight: 'bold' }}>トップ</a>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '20px' }}>
          <div style={{ background: 'rgba(0, 0, 0, 0.8)', border: '2px solid rgba(185, 28, 28, 0.3)', borderRadius: '8px', padding: '20px', maxHeight: 'calc(100vh - 140px)', overflowY: 'auto' }}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', color: '#fca5a5', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>キャラクター *</label>
              <select value={selectedCharacterId} onChange={(e) => { 
                const newCharId = e.target.value;
                console.log('👤 キャラクター選択変更:', newCharId); 
                setSelectedCharacterId(newCharId); 
              }} style={{ width: '100%', padding: '10px', background: 'rgba(0, 0, 0, 0.6)', border: '1px solid rgba(185, 28, 28, 0.4)', borderRadius: '4px', color: '#ffffff', fontSize: '14px' }}>
                <option value="">選択してください</option>
                {characters.map(char => <option key={char.id} value={char.character_id}>{getDisplayName(char)}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', color: '#fca5a5', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>タイトル *</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例: 基本コンボ" style={{ width: '100%', padding: '10px', background: 'rgba(0, 0, 0, 0.6)', border: '1px solid rgba(185, 28, 28, 0.4)', borderRadius: '4px', color: '#ffffff', fontSize: '14px' }} />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', color: '#fca5a5', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>説明</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} style={{ width: '100%', padding: '10px', background: 'rgba(0, 0, 0, 0.6)', border: '1px solid rgba(185, 28, 28, 0.4)', borderRadius: '4px', color: '#ffffff', fontSize: '14px', resize: 'vertical' }} />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', color: '#fca5a5', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>難易度</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[1, 2, 3, 4, 5].map(level => (
                  <button key={level} onClick={() => setDifficulty(level)} style={{ padding: '8px 16px', background: difficulty === level ? 'rgba(239, 68, 68, 0.3)' : 'rgba(0, 0, 0, 0.4)', border: `2px solid ${difficulty === level ? '#ef4444' : 'rgba(185, 28, 28, 0.3)'}`, borderRadius: '4px', color: difficulty === level ? '#fca5a5' : '#9ca3af', fontWeight: 'bold', cursor: 'pointer' }}>{level}</button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', color: '#fca5a5', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>ダメージ</label>
              <input type="number" value={damage} onChange={(e) => setDamage(e.target.value)} placeholder="数値" style={{ width: '100%', padding: '10px', background: 'rgba(0, 0, 0, 0.6)', border: '1px solid rgba(185, 28, 28, 0.4)', borderRadius: '4px', color: '#ffffff', fontSize: '14px' }} />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', color: '#fca5a5', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>重要度</label>
              <div style={{ display: 'flex', gap: '4px' }}>
                {[1, 2, 3, 4, 5].map(level => (
                  <button key={level} onClick={() => setImportance(level)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '28px', color: level <= importance ? '#fbbf24' : '#4b5563', padding: '4px' }}>★</button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', color: '#fca5a5', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>表示モード</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setDisplayMode('move_name')} style={{ flex: 1, padding: '10px', background: displayMode === 'move_name' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(0, 0, 0, 0.4)', border: `2px solid ${displayMode === 'move_name' ? '#3b82f6' : 'rgba(185, 28, 28, 0.3)'}`, borderRadius: '4px', color: displayMode === 'move_name' ? '#60a5fa' : '#9ca3af', fontWeight: 'bold', cursor: 'pointer' }}>技名</button>
                <button onClick={() => setDisplayMode('command')} style={{ flex: 1, padding: '10px', background: displayMode === 'command' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(0, 0, 0, 0.4)', border: `2px solid ${displayMode === 'command' ? '#3b82f6' : 'rgba(185, 28, 28, 0.3)'}`, borderRadius: '4px', color: displayMode === 'command' ? '#60a5fa' : '#9ca3af', fontWeight: 'bold', cursor: 'pointer' }}>コマンド</button>
              </div>
            </div>
            <hr style={{ border: '1px solid rgba(185, 28, 28, 0.3)', margin: '20px 0' }} />
            {selectedNode ? (
              <>
                <h3 style={{ color: '#fca5a5', fontSize: '16px', fontWeight: 'bold', marginBottom: '15px' }}>選択中のノード編集</h3>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', color: '#9ca3af', fontSize: '13px', marginBottom: '6px' }}>タイプ</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => updateNodeType('move')} style={{ flex: 1, padding: '8px', background: selectedNode.type === 'move' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(0, 0, 0, 0.4)', border: `2px solid ${selectedNode.type === 'move' ? '#22c55e' : 'rgba(185, 28, 28, 0.3)'}`, borderRadius: '4px', color: selectedNode.type === 'move' ? '#86efac' : '#9ca3af', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>技</button>
                    <button onClick={() => updateNodeType('freetext')} style={{ flex: 1, padding: '8px', background: selectedNode.type === 'freetext' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(0, 0, 0, 0.4)', border: `2px solid ${selectedNode.type === 'freetext' ? '#22c55e' : 'rgba(185, 28, 28, 0.3)'}`, borderRadius: '4px', color: selectedNode.type === 'freetext' ? '#86efac' : '#9ca3af', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>自由入力</button>
                  </div>
                </div>
                {selectedNode.type === 'move' && (
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', color: '#9ca3af', fontSize: '13px', marginBottom: '6px' }}>技検索</label>
                    {!selectedCharacterId ? (
                      <div style={{ padding: '10px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '4px', color: '#fca5a5', fontSize: '13px', textAlign: 'center' }}>キャラクターを選択してください</div>
                    ) : moves.length === 0 ? (
                      <div style={{ padding: '15px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '4px', color: '#fca5a5', fontSize: '13px', textAlign: 'center' }}>
                        <div style={{ marginBottom: '8px' }}>このキャラクターの技が見つかりません</div>
                        <div style={{ fontSize: '11px', color: '#9ca3af' }}>選択中: {selectedCharacterId}</div>
                        <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>ブラウザのコンソール（F12）でデバッグ情報を確認してください</div>
                      </div>
                    ) : (
                      <>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                          <button onClick={() => setSearchMode('name')} style={{ flex: 1, padding: '6px', background: searchMode === 'name' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(0, 0, 0, 0.4)', border: `2px solid ${searchMode === 'name' ? '#3b82f6' : 'rgba(185, 28, 28, 0.3)'}`, borderRadius: '4px', color: searchMode === 'name' ? '#60a5fa' : '#9ca3af', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>技名で探す</button>
                          <button onClick={() => setSearchMode('command')} style={{ flex: 1, padding: '6px', background: searchMode === 'command' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(0, 0, 0, 0.4)', border: `2px solid ${searchMode === 'command' ? '#3b82f6' : 'rgba(185, 28, 28, 0.3)'}`, borderRadius: '4px', color: searchMode === 'command' ? '#60a5fa' : '#9ca3af', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>コマンドで探す</button>
                        </div>

                        {searchMode === 'name' ? (
                          <div style={{ position: 'relative' }}>
                            <input ref={searchInputRef} type="text" value={moveSearchQuery} onChange={(e) => { setMoveSearchQuery(e.target.value); setShowMoveDropdown(true); }} placeholder="技名またはコマンドで検索..." style={{ width: '100%', padding: '8px', background: 'rgba(0, 0, 0, 0.6)', border: '1px solid rgba(185, 28, 28, 0.4)', borderRadius: '4px', color: '#ffffff', fontSize: '13px' }} />
                            {showMoveDropdown && moveSearchQuery.trim() && filteredMoves.length > 0 && (
                              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, maxHeight: '300px', overflowY: 'auto', background: 'rgba(0, 0, 0, 0.95)', border: '2px solid rgba(185, 28, 28, 0.4)', borderRadius: '4px', marginTop: '4px', zIndex: 1000, boxShadow: '0 4px 10px rgba(0,0,0,0.5)' }}>
                                {filteredMoves.map(move => (
                                  <div key={move.id} onClick={() => updateNodeMove(move.id)} style={{ padding: '10px', cursor: 'pointer', borderBottom: '1px solid rgba(185, 28, 28, 0.2)', transition: 'background 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                                    <div style={{ color: '#ffffff', fontSize: '13px', fontWeight: 'bold', marginBottom: '2px' }}>{move.move_name}</div>
                                    {move.command && (
                                      <div style={{ color: '#9ca3af', fontSize: '11px' }}>
                                        <TextWithIcons text={move.command} size="sm" showFallback={false} enableIconReplacement={true} />
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                            {showMoveDropdown && moveSearchQuery.trim() && filteredMoves.length === 0 && (
                              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'rgba(0, 0, 0, 0.95)', border: '2px solid rgba(185, 28, 28, 0.4)', borderRadius: '4px', marginTop: '4px', padding: '15px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>
                                「{moveSearchQuery}」に一致する技が見つかりませんでした
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>
                            <div style={{ padding: '8px', background: 'rgba(0, 0, 0, 0.6)', border: '1px solid rgba(185, 28, 28, 0.4)', borderRadius: '4px', marginBottom: '8px', minHeight: '36px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                              {selectedCommandIcons.length === 0 ? (
                                <span style={{ color: '#6b7280', fontSize: '13px' }}>アイコンを選択...</span>
                              ) : (
                                <TextWithIcons text={selectedCommandIcons.join(' ')} size="sm" showFallback={false} enableIconReplacement={true} />
                              )}
                            </div>
                            
                            <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                              <button onClick={removeLastCommandIcon} disabled={selectedCommandIcons.length === 0} style={{ flex: 1, padding: '6px', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '4px', color: '#fca5a5', fontSize: '11px', cursor: selectedCommandIcons.length === 0 ? 'not-allowed' : 'pointer', opacity: selectedCommandIcons.length === 0 ? 0.5 : 1 }}>← 戻る</button>
                              <button onClick={clearCommandIcons} disabled={selectedCommandIcons.length === 0} style={{ flex: 1, padding: '6px', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '4px', color: '#fca5a5', fontSize: '11px', cursor: selectedCommandIcons.length === 0 ? 'not-allowed' : 'pointer', opacity: selectedCommandIcons.length === 0 ? 0.5 : 1 }}>クリア</button>
                            </div>

                            <div style={{ marginBottom: '8px' }}>
                              <div style={{ color: '#9ca3af', fontSize: '11px', marginBottom: '4px', fontWeight: 'bold' }}>方向</div>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                                {COMMAND_ICONS.directions.map((icon, index) => (
                                  icon.code ? (
                                    <button key={icon.code} onClick={() => addCommandIcon(icon.code!)} style={{ padding: '8px 4px', background: 'rgba(0, 0, 0, 0.6)', border: '1px solid rgba(185, 28, 28, 0.4)', borderRadius: '4px', color: '#ffffff', fontSize: '10px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0, 0, 0, 0.6)'; }} title={icon.label}>
                                      <TextWithIcons text={icon.code} size="sm" showFallback={true} enableIconReplacement={true} />
                                    </button>
                                  ) : (
                                    <div key={`empty-${index}`} style={{ padding: '8px 4px', background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(185, 28, 28, 0.2)', borderRadius: '4px' }}></div>
                                  )
                                ))}
                              </div>
                            </div>

                            <div style={{ marginBottom: '8px' }}>
                              <div style={{ color: '#9ca3af', fontSize: '11px', marginBottom: '4px', fontWeight: 'bold' }}>攻撃ボタン</div>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                                {COMMAND_ICONS.buttons.map((icon, index) => (
                                  icon.code ? (
                                    <button key={icon.code} onClick={() => addCommandIcon(icon.code!)} style={{ padding: '8px 4px', background: 'rgba(0, 0, 0, 0.6)', border: '1px solid rgba(185, 28, 28, 0.4)', borderRadius: '4px', color: '#ffffff', fontSize: '10px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0, 0, 0, 0.6)'; }} title={icon.label}>
                                      <TextWithIcons text={icon.code} size="sm" showFallback={true} enableIconReplacement={true} />
                                    </button>
                                  ) : (
                                    <div key={`empty-btn-${index}`} style={{ padding: '8px 4px', background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(185, 28, 28, 0.2)', borderRadius: '4px' }}></div>
                                  )
                                ))}
                              </div>
                            </div>

                            <div style={{ marginBottom: '8px' }}>
                              <div style={{ color: '#9ca3af', fontSize: '11px', marginBottom: '4px', fontWeight: 'bold' }}>その他</div>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px' }}>
                                {COMMAND_ICONS.others.map(icon => (
                                  <button key={icon.code} onClick={() => addCommandIcon(icon.code)} style={{ padding: '8px 4px', background: 'rgba(0, 0, 0, 0.6)', border: '1px solid rgba(185, 28, 28, 0.4)', borderRadius: '4px', color: '#ffffff', fontSize: '9px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0, 0, 0, 0.6)'; }} title={icon.label}>
                                    <TextWithIcons text={icon.code} size="sm" showFallback={true} enableIconReplacement={true} />
                                  </button>
                                ))}
                              </div>
                            </div>

                            {filteredMoves.length > 0 && (
                              <div style={{ maxHeight: '200px', overflowY: 'auto', background: 'rgba(0, 0, 0, 0.95)', border: '2px solid rgba(185, 28, 28, 0.4)', borderRadius: '4px', marginTop: '8px' }}>
                                <div style={{ padding: '8px', background: 'rgba(185, 28, 28, 0.2)', borderBottom: '1px solid rgba(185, 28, 28, 0.4)', color: '#fca5a5', fontSize: '11px', fontWeight: 'bold' }}>
                                  {filteredMoves.length}件の技が見つかりました
                                </div>
                                {filteredMoves.map(move => (
                                  <div key={move.id} onClick={() => updateNodeMove(move.id)} style={{ padding: '10px', cursor: 'pointer', borderBottom: '1px solid rgba(185, 28, 28, 0.2)', transition: 'background 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                                    <div style={{ color: '#ffffff', fontSize: '13px', fontWeight: 'bold', marginBottom: '2px' }}>{move.move_name}</div>
                                    {move.command && (
                                      <div style={{ color: '#9ca3af', fontSize: '11px' }}>
                                        <TextWithIcons text={move.command} size="sm" showFallback={false} enableIconReplacement={true} />
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
                {selectedNode.type === 'freetext' && (
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', color: '#9ca3af', fontSize: '13px', marginBottom: '6px' }}>テキスト</label>
                    <input type="text" value={selectedNode.freeText || ''} onChange={(e) => updateNodeFreeText(e.target.value)} placeholder="自由入力" style={{ width: '100%', padding: '8px', background: 'rgba(0, 0, 0, 0.6)', border: '1px solid rgba(185, 28, 28, 0.4)', borderRadius: '4px', color: '#ffffff', fontSize: '13px' }} />
                  </div>
                )}
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', color: '#9ca3af', fontSize: '13px', marginBottom: '6px' }}>背景色</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                    {Object.entries(BACKGROUND_COLORS).map(([colorName, colorHex]) => (
                      <button key={colorName} onClick={() => updateNodeColor(selectedNodeId!, colorName)} style={{ width: '100%', height: '32px', background: colorHex, border: `3px solid ${selectedNode.backgroundColor === colorHex ? '#3b82f6' : '#6b7280'}`, borderRadius: '4px', cursor: 'pointer', transition: 'all 0.2s' }} title={colorName} />
                    ))}
                  </div>
                </div>
                <button onClick={() => deleteNode(selectedNodeId!)} style={{ width: '100%', padding: '10px', background: 'rgba(239, 68, 68, 0.3)', border: '2px solid rgba(239, 68, 68, 0.5)', borderRadius: '4px', color: '#fca5a5', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '15px' }}>ノードを削除</button>
              </>
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280', fontSize: '13px' }}>ノードを選択すると編集できます</div>
            )}
            <hr style={{ border: '1px solid rgba(185, 28, 28, 0.3)', margin: '20px 0' }} />
            <button onClick={saveCombo} disabled={loading} style={{ width: '100%', padding: '14px', background: loading ? 'rgba(107, 114, 128, 0.3)' : 'linear-gradient(135deg, #dc2626, #991b1b)', border: 'none', borderRadius: '6px', color: '#ffffff', fontSize: '16px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.5)' }}>{loading ? '保存中...' : '保存'}</button>
          </div>
          <div style={{ background: 'rgba(0, 0, 0, 0.8)', border: '2px solid rgba(185, 28, 28, 0.3)', borderRadius: '8px', padding: '20px', maxHeight: 'calc(100vh - 140px)', overflowY: 'auto', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ color: '#fca5a5', fontSize: '18px', fontWeight: 'bold', margin: 0 }}>コンボツリー</h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={addRootNode} disabled={!!rootNodeId} style={{ padding: '8px 16px', background: rootNodeId ? 'rgba(107, 114, 128, 0.3)' : 'rgba(34, 197, 94, 0.3)', border: '2px solid rgba(34, 197, 94, 0.5)', borderRadius: '4px', color: rootNodeId ? '#6b7280' : '#86efac', fontSize: '13px', fontWeight: 'bold', cursor: rootNodeId ? 'not-allowed' : 'pointer' }}>+ ルート</button>
                <button onClick={addChildNode} disabled={!selectedNodeId} style={{ padding: '8px 16px', background: selectedNodeId ? 'rgba(34, 197, 94, 0.3)' : 'rgba(107, 114, 128, 0.3)', border: '2px solid rgba(34, 197, 94, 0.5)', borderRadius: '4px', color: selectedNodeId ? '#86efac' : '#6b7280', fontSize: '13px', fontWeight: 'bold', cursor: selectedNodeId ? 'pointer' : 'not-allowed' }}>+ 子ノード</button>
              </div>
            </div>
            {rootNodeId ? <div onClick={() => setShowMoveDropdown(false)}>{renderTree(rootNodeId)}</div> : <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b7280', fontSize: '16px' }}>「+ ルート」ボタンでノードを追加してください</div>}
          </div>
        </div>
      </div>
    </div>
  );
}