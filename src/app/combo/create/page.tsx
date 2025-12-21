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
  
  const [moveSearchQuery, setMoveSearchQuery] = useState('');
  const [filteredMoves, setFilteredMoves] = useState<Move[]>([]);
  const [showMoveDropdown, setShowMoveDropdown] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCharacters();
  }, []);

  useEffect(() => {
    if (selectedCharacterId) {
      fetchMoves(selectedCharacterId);
    } else {
      setMoves([]);
      setFilteredMoves([]);
    }
  }, [selectedCharacterId]);

  // 技配列の変更を監視
  useEffect(() => {
    console.log('現在の技数:', moves.length);
  }, [moves]);

  useEffect(() => {
    if (moveSearchQuery.trim()) {
      // 検索クエリを正規化（全角→半角、小文字）
      const normalizeString = (str: string) => {
        return str
          .toLowerCase()
          .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
          .replace(/　/g, ' ');
      };
      
      const query = normalizeString(moveSearchQuery);
      const filtered = moves.filter(m => {
        const moveName = normalizeString(m.move_name);
        const command = m.command ? normalizeString(m.command) : '';
        return moveName.includes(query) || command.includes(query);
      });
      
      console.log(`Search: "${moveSearchQuery}" -> ${filtered.length} results`);
      setFilteredMoves(filtered);
    } else {
      setFilteredMoves([]);
    }
  }, [moveSearchQuery, moves]);

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
      console.log('取得したキャラクター数:', validChars.length);
      if (validChars.length > 0) {
        console.log('サンプルキャラクター:', {
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
      console.error('キャラクター取得エラー:', error);
    }
  };

  const fetchMoves = async (characterId: string) => {
    try {
      console.log('=== 技取得開始 ===');
      console.log('選択されたキャラクターID:', characterId, 'type:', typeof characterId);
      
      // 全件取得してフィルタリング（確実に取得するため）
      const { data } = await client.models.Move.list({ authMode: 'apiKey' });
      console.log('取得した全技数:', data?.length);
      
      if (data && data.length > 0) {
        console.log('サンプル技データ:', {
          character_id: data[0]?.character_id,
          character_id_type: typeof data[0]?.character_id,
          move_name: data[0]?.move_name
        });
      }
      
      const validMoves = (data || []).filter(m => {
        if (!m) return false;
        
        // 様々な比較方法を試す
        const charId = String(characterId).trim();
        const moveCharId = String(m.character_id).trim();
        
        // ゼロパディングありなし両方で比較
        const charIdNum = parseInt(charId);
        const moveCharIdNum = parseInt(moveCharId);
        
        const match = 
          charId === moveCharId || // 完全一致
          charIdNum === moveCharIdNum || // 数値一致
          charId.padStart(3, '0') === moveCharId.padStart(3, '0'); // ゼロパディング一致
        
        return match;
      }) as Move[];
      
      console.log('フィルタリング後の技数:', validMoves.length);
      
      if (validMoves.length > 0) {
        console.log('取得した技の例:', validMoves.slice(0, 3).map(m => ({
          character_id: m.character_id,
          move_name: m.move_name,
          command: m.command
        })));
      } else {
        console.warn('⚠️ このキャラクターIDに一致する技が見つかりませんでした');
        console.log('比較に使用したキャラクターID:', characterId);
      }
      
      const sorted = validMoves.sort((a, b) => a.move_name.localeCompare(b.move_name));
      setMoves(sorted);
      setFilteredMoves([]);
      console.log('=== 技取得完了 ===');
    } catch (error) {
      console.error('技取得エラー:', error);
    }
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
              <select value={selectedCharacterId} onChange={(e) => { console.log('Selected character_id:', e.target.value); setSelectedCharacterId(e.target.value); }} style={{ width: '100%', padding: '10px', background: 'rgba(0, 0, 0, 0.6)', border: '1px solid rgba(185, 28, 28, 0.4)', borderRadius: '4px', color: '#ffffff', fontSize: '14px' }}>
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
                        <div style={{ fontSize: '11px', color: '#9ca3af' }}>キャラクターID: {selectedCharacterId}</div>
                        <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>ブラウザのコンソールを確認してください（F12キー）</div>
                      </div>
                    ) : (
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
