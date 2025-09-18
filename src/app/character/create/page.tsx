// src/app/character/create/page.tsx (キャラクターマスタ編集機能付き)
'use client';

import { useState, useEffect } from 'react';
import { client } from '@/lib/client';

// 明示的な型定義
interface CharacterData {
  id: string;
  character_id: string;
  character_name_en: string;
  character_name_jp?: string | null;
  nickname?: string | null;
  nationality?: string | null;
  height?: string | null;
  weight?: string | null;
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

export default function CreateCharacterPage() {
  const [characters, setCharacters] = useState<CharacterData[]>([]);
  const [categories, setCategories] = useState<MoveCategoryData[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterData | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categoryMoves, setCategoryMoves] = useState<{[key: string]: MoveData[]}>({});
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedCharacter, setEditedCharacter] = useState<Partial<CharacterData>>({});
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [charactersResult, categoriesResult] = await Promise.all([
        client.models.Character.list({ authMode: 'apiKey' }),
        client.models.MoveCategory.list({ authMode: 'apiKey' })
      ]);
      
      // null要素をフィルタリング
      const allCharacters = (charactersResult.data || []).filter(c => c !== null) as CharacterData[];
      const allCategories = (categoriesResult.data || []).filter(c => c !== null) as MoveCategoryData[];
      
      // 重複除去（Mapを使用したより安全な方法）
      const characterMap = new Map<string, CharacterData>();
      allCharacters.forEach(char => {
        if (char.character_id && !characterMap.has(char.character_id)) {
          characterMap.set(char.character_id, char);
        }
      });
      const uniqueCharacters = Array.from(characterMap.values());
      
      const categoryMap = new Map<string, MoveCategoryData>();
      allCategories.forEach(cat => {
        if (cat.move_category_id && !categoryMap.has(cat.move_category_id)) {
          categoryMap.set(cat.move_category_id, cat);
        }
      });
      const uniqueCategories = Array.from(categoryMap.values());
      
      // character_idでソート
      uniqueCharacters.sort((a, b) => {
        const idA = String(a.character_id).padStart(3, '0');
        const idB = String(b.character_id).padStart(3, '0');
        return idA.localeCompare(idB);
      });
      
      console.log('キャラクター（重複除去後）:', uniqueCharacters);
      console.log('技分類（重複除去後）:', uniqueCategories);
      
      setCharacters(uniqueCharacters);
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('データ取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCharacterSelect = async (characterId: string) => {
    const character = characters.find(c => c && c.character_id === characterId);
    setSelectedCharacter(character || null);
    setSelectedCategories([]);
    setCategoryMoves({});
    setEditMode(false);
    setEditedCharacter({});
  };

  const handleCategoryToggle = async (move_category_id: string) => {
    if (!selectedCharacter) return;
    
    console.log('技分類トグル:', move_category_id, selectedCharacter.character_id);
    
    const isSelected = selectedCategories.includes(move_category_id);
    
    if (isSelected) {
      setSelectedCategories(prev => prev.filter(id => id !== move_category_id));
      setCategoryMoves(prev => {
        const updated = { ...prev };
        delete updated[move_category_id];
        return updated;
      });
    } else {
      setSelectedCategories(prev => [...prev, move_category_id]);
      
      try {
        console.log('技データ検索条件:', {
          character_id: selectedCharacter.character_id,
          move_category_id: move_category_id
        });
        
        const { data: moves } = await client.models.Move.list({
          filter: {
            and: [
              { character_id: { eq: selectedCharacter.character_id } },
              { move_category_id: { eq: move_category_id } }
            ]
          },
          authMode: 'apiKey'
        });
        
        console.log('取得した技データ:', moves);
        
        // null要素をフィルタリング
        const validMoves = (moves || []).filter(m => m !== null) as MoveData[];
        console.log('有効な技データ:', validMoves.length, '件');
        
        setCategoryMoves(prev => ({
          ...prev,
          [move_category_id]: validMoves
        }));
        
      } catch (error) {
        console.error('技データ取得エラー:', error);
      }
    }
  };

  const handleEdit = () => {
    if (selectedCharacter) {
      setEditMode(true);
      setEditedCharacter({
        ...selectedCharacter
      });
    }
  };

  const handleSave = async () => {
    if (!selectedCharacter || !editedCharacter.id) return;
    
    try {
      setLoading(true);
      
      // データベースの更新
      await client.models.Character.update({
        id: editedCharacter.id,
        character_name_jp: editedCharacter.character_name_jp,
        character_name_en: editedCharacter.character_name_en,
        nickname: editedCharacter.nickname,
        height: editedCharacter.height,
        weight: editedCharacter.weight,
        nationality: editedCharacter.nationality,
        martial_arts: editedCharacter.martial_arts,
        character_description: editedCharacter.character_description
      });
      
      // ローカルの状態を更新
      const updatedCharacters = characters.map(char => 
        char.id === editedCharacter.id 
          ? { ...char, ...editedCharacter } as CharacterData
          : char
      );
      setCharacters(updatedCharacters);
      setSelectedCharacter({ ...selectedCharacter, ...editedCharacter });
      setEditMode(false);
      setSaveSuccess(true);
      
      setTimeout(() => setSaveSuccess(false), 3000);
      
    } catch (error) {
      console.error('保存エラー:', error);
      alert('保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditMode(false);
    setEditedCharacter({});
  };

  const handleGoToCharacterPage = () => {
    if (selectedCharacter) {
      window.location.href = `/character/${selectedCharacter.character_id}`;
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #000000 0%, #1a0505 50%, #000000 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ fontSize: '24px', color: '#fca5a5' }}>読み込み中...</div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #000000 0%, #1a0505 50%, #000000 100%)',
      padding: '40px 20px'
    }}>
      <div className="container mx-auto max-w-6xl">
        {/* ヘッダー */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '40px'
        }}>
          <h1 style={{
            fontSize: '36px',
            fontWeight: 'bold',
            color: '#ffffff',
            letterSpacing: '2px',
            textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
          }}>
            キャラクター編集
          </h1>
          
          <a 
            href="/"
            style={{
              background: 'linear-gradient(135deg, #dc2626, #991b1b)',
              color: '#ffffff',
              padding: '12px 24px',
              borderRadius: '6px',
              textDecoration: 'none',
              fontWeight: 'bold',
              boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 15px rgba(0,0,0,0.6)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.5)';
            }}
          >
            トップページに戻る
          </a>
        </div>

        {/* 成功メッセージ */}
        {saveSuccess && (
          <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
            color: '#ffffff',
            padding: '15px 30px',
            borderRadius: '6px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            zIndex: 1000,
            animation: 'slideIn 0.3s ease-out'
          }}>
            ✅ 保存しました
          </div>
        )}
        
        {/* キャラクター選択 */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.8)',
          border: '2px solid rgba(185, 28, 28, 0.3)',
          borderRadius: '8px',
          padding: '30px',
          marginBottom: '30px'
        }}>
          <h2 style={{
            fontSize: '24px',
            color: '#fca5a5',
            marginBottom: '20px',
            borderBottom: '2px solid rgba(185, 28, 28, 0.3)',
            paddingBottom: '10px'
          }}>
            1. キャラクターID選択
          </h2>
          <select 
            onChange={(e) => handleCharacterSelect(e.target.value)}
            style={{
              background: 'rgba(0, 0, 0, 0.6)',
              border: '1px solid rgba(185, 28, 28, 0.4)',
              color: '#ffffff',
              padding: '12px 20px',
              borderRadius: '6px',
              width: '100%',
              maxWidth: '500px',
              fontSize: '16px',
              cursor: 'pointer'
            }}
            defaultValue=""
          >
            <option value="">キャラクターを選択してください</option>
            {characters.map((character, index) => character && character.character_id && (
              <option key={`char-${character.id || index}`} value={character.character_id}>
                {character.character_id} - {character.character_name_jp || character.character_name_en}
              </option>
            ))}
          </select>
        </div>

        {/* キャラクター情報表示・編集 */}
        {selectedCharacter && (
          <div style={{
            background: 'rgba(0, 0, 0, 0.8)',
            border: '2px solid rgba(185, 28, 28, 0.3)',
            borderRadius: '8px',
            padding: '30px',
            marginBottom: '30px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              borderBottom: '2px solid rgba(185, 28, 28, 0.3)',
              paddingBottom: '10px'
            }}>
              <h3 style={{
                fontSize: '24px',
                color: '#fca5a5'
              }}>
                キャラクター情報
              </h3>
              
              {!editMode ? (
                <button
                  onClick={handleEdit}
                  style={{
                    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                    color: '#ffffff',
                    padding: '10px 24px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 15px rgba(0,0,0,0.6)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.5)';
                  }}
                >
                  ✏️ 編集
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={handleCancel}
                    style={{
                      background: 'rgba(107, 114, 128, 0.3)',
                      color: '#ffffff',
                      padding: '10px 24px',
                      borderRadius: '6px',
                      border: '1px solid rgba(107, 114, 128, 0.5)',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(107, 114, 128, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(107, 114, 128, 0.3)';
                    }}
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    style={{
                      background: loading 
                        ? 'rgba(107, 114, 128, 0.3)'
                        : 'linear-gradient(135deg, #22c55e, #16a34a)',
                      color: '#ffffff',
                      padding: '10px 30px',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (!loading) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 15px rgba(0,0,0,0.6)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!loading) {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.5)';
                      }
                    }}
                  >
                    💾 保存
                  </button>
                </div>
              )}
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '20px',
              marginBottom: '20px'
            }}>
              {/* 日本語名 */}
              <div>
                <label style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '6px', display: 'block' }}>
                  日本語名:
                </label>
                {editMode ? (
                  <input
                    type="text"
                    value={editedCharacter.character_name_jp || ''}
                    onChange={(e) => setEditedCharacter({ ...editedCharacter, character_name_jp: e.target.value })}
                    style={{
                      background: 'rgba(0, 0, 0, 0.6)',
                      border: '1px solid rgba(185, 28, 28, 0.4)',
                      color: '#ffffff',
                      padding: '10px 15px',
                      borderRadius: '4px',
                      width: '100%',
                      fontSize: '16px'
                    }}
                  />
                ) : (
                  <div style={{ fontSize: '16px', color: '#e5e7eb', padding: '10px 0' }}>
                    {selectedCharacter.character_name_jp || '未設定'}
                  </div>
                )}
              </div>
              
              {/* 英語名 */}
              <div>
                <label style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '6px', display: 'block' }}>
                  英語名:
                </label>
                {editMode ? (
                  <input
                    type="text"
                    value={editedCharacter.character_name_en || ''}
                    onChange={(e) => setEditedCharacter({ ...editedCharacter, character_name_en: e.target.value })}
                    style={{
                      background: 'rgba(0, 0, 0, 0.6)',
                      border: '1px solid rgba(185, 28, 28, 0.4)',
                      color: '#ffffff',
                      padding: '10px 15px',
                      borderRadius: '4px',
                      width: '100%',
                      fontSize: '16px'
                    }}
                  />
                ) : (
                  <div style={{ fontSize: '16px', color: '#e5e7eb', padding: '10px 0' }}>
                    {selectedCharacter.character_name_en || '未設定'}
                  </div>
                )}
              </div>
              
              {/* ニックネーム */}
              <div>
                <label style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '6px', display: 'block' }}>
                  ニックネーム:
                </label>
                {editMode ? (
                  <input
                    type="text"
                    value={editedCharacter.nickname || ''}
                    onChange={(e) => setEditedCharacter({ ...editedCharacter, nickname: e.target.value })}
                    style={{
                      background: 'rgba(0, 0, 0, 0.6)',
                      border: '1px solid rgba(185, 28, 28, 0.4)',
                      color: '#ffffff',
                      padding: '10px 15px',
                      borderRadius: '4px',
                      width: '100%',
                      fontSize: '16px'
                    }}
                  />
                ) : (
                  <div style={{ fontSize: '16px', color: '#e5e7eb', padding: '10px 0' }}>
                    {selectedCharacter.nickname || '未設定'}
                  </div>
                )}
              </div>
              
              {/* 国籍 */}
              <div>
                <label style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '6px', display: 'block' }}>
                  国籍:
                </label>
                {editMode ? (
                  <input
                    type="text"
                    value={editedCharacter.nationality || ''}
                    onChange={(e) => setEditedCharacter({ ...editedCharacter, nationality: e.target.value })}
                    style={{
                      background: 'rgba(0, 0, 0, 0.6)',
                      border: '1px solid rgba(185, 28, 28, 0.4)',
                      color: '#ffffff',
                      padding: '10px 15px',
                      borderRadius: '4px',
                      width: '100%',
                      fontSize: '16px'
                    }}
                  />
                ) : (
                  <div style={{ fontSize: '16px', color: '#e5e7eb', padding: '10px 0' }}>
                    {selectedCharacter.nationality || '未設定'}
                  </div>
                )}
              </div>
              
              {/* 身長 */}
              <div>
                <label style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '6px', display: 'block' }}>
                  身長:
                </label>
                {editMode ? (
                  <input
                    type="text"
                    value={editedCharacter.height || ''}
                    onChange={(e) => setEditedCharacter({ ...editedCharacter, height: e.target.value })}
                    style={{
                      background: 'rgba(0, 0, 0, 0.6)',
                      border: '1px solid rgba(185, 28, 28, 0.4)',
                      color: '#ffffff',
                      padding: '10px 15px',
                      borderRadius: '4px',
                      width: '100%',
                      fontSize: '16px'
                    }}
                  />
                ) : (
                  <div style={{ fontSize: '16px', color: '#e5e7eb', padding: '10px 0' }}>
                    {selectedCharacter.height || '未設定'}
                  </div>
                )}
              </div>
              
              {/* 体重 */}
              <div>
                <label style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '6px', display: 'block' }}>
                  体重:
                </label>
                {editMode ? (
                  <input
                    type="text"
                    value={editedCharacter.weight || ''}
                    onChange={(e) => setEditedCharacter({ ...editedCharacter, weight: e.target.value })}
                    style={{
                      background: 'rgba(0, 0, 0, 0.6)',
                      border: '1px solid rgba(185, 28, 28, 0.4)',
                      color: '#ffffff',
                      padding: '10px 15px',
                      borderRadius: '4px',
                      width: '100%',
                      fontSize: '16px'
                    }}
                  />
                ) : (
                  <div style={{ fontSize: '16px', color: '#e5e7eb', padding: '10px 0' }}>
                    {selectedCharacter.weight || '未設定'}
                  </div>
                )}
              </div>
              
              {/* 格闘技 */}
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '6px', display: 'block' }}>
                  格闘技:
                </label>
                {editMode ? (
                  <input
                    type="text"
                    value={editedCharacter.martial_arts || ''}
                    onChange={(e) => setEditedCharacter({ ...editedCharacter, martial_arts: e.target.value })}
                    style={{
                      background: 'rgba(0, 0, 0, 0.6)',
                      border: '1px solid rgba(185, 28, 28, 0.4)',
                      color: '#ffffff',
                      padding: '10px 15px',
                      borderRadius: '4px',
                      width: '100%',
                      fontSize: '16px'
                    }}
                  />
                ) : (
                  <div style={{ fontSize: '16px', color: '#e5e7eb', padding: '10px 0' }}>
                    {selectedCharacter.martial_arts || '未設定'}
                  </div>
                )}
              </div>
            </div>
            
            {/* 紹介文 */}
            <div>
              <label style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '6px', display: 'block' }}>
                紹介文:
              </label>
              {editMode ? (
                <textarea
                  value={editedCharacter.character_description || ''}
                  onChange={(e) => setEditedCharacter({ ...editedCharacter, character_description: e.target.value })}
                  rows={6}
                  style={{
                    background: 'rgba(0, 0, 0, 0.6)',
                    border: '1px solid rgba(185, 28, 28, 0.4)',
                    color: '#ffffff',
                    padding: '10px 15px',
                    borderRadius: '4px',
                    width: '100%',
                    fontSize: '16px',
                    resize: 'vertical'
                  }}
                />
              ) : (
                <div style={{ 
                  fontSize: '16px', 
                  color: '#e5e7eb', 
                  padding: '10px',
                  background: 'rgba(0, 0, 0, 0.4)',
                  borderRadius: '4px',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap'
                }}>
                  {selectedCharacter.character_description || '未設定'}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 技分類選択 */}
        {selectedCharacter && categories.length > 0 && (
          <div style={{
            background: 'rgba(0, 0, 0, 0.8)',
            border: '2px solid rgba(185, 28, 28, 0.3)',
            borderRadius: '8px',
            padding: '30px',
            marginBottom: '30px'
          }}>
            <h2 style={{
              fontSize: '24px',
              color: '#fca5a5',
              marginBottom: '20px',
              borderBottom: '2px solid rgba(185, 28, 28, 0.3)',
              paddingBottom: '10px'
            }}>
              2. 技分類選択（複数選択可）
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '15px'
            }}>
              {categories.map((category, index) => category && (
                <label key={`category-${category.id || index}`} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  background: selectedCategories.includes(category.id) 
                    ? 'rgba(185, 28, 28, 0.2)'
                    : 'rgba(0, 0, 0, 0.5)',
                  border: '1px solid',
                  borderColor: selectedCategories.includes(category.id)
                    ? 'rgba(248, 113, 113, 0.5)'
                    : 'rgba(185, 28, 28, 0.2)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}>
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(category.id)}
                    onChange={() => handleCategoryToggle(category.id)}
                    style={{
                      width: '18px',
                      height: '18px',
                      cursor: 'pointer'
                    }}
                  />
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: selectedCategories.includes(category.id) ? '#fca5a5' : '#e5e7eb'
                  }}>
                    {category.move_category}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* 選択された技分類の技一覧 */}
        {selectedCategories.length > 0 && (
          <div style={{ marginBottom: '30px' }}>
            <h2 style={{
              fontSize: '24px',
              color: '#fca5a5',
              marginBottom: '20px'
            }}>
              技一覧（プレビュー）
            </h2>
            
            {selectedCategories.map((move_category_id, categoryIndex) => {
              const category = categories.find(c => c && c.id === move_category_id);
              const moves = categoryMoves[move_category_id] || [];
              
              return (
                <div key={`selected-category-${move_category_id || categoryIndex}`} style={{
                  background: 'rgba(0, 0, 0, 0.8)',
                  border: '2px solid rgba(185, 28, 28, 0.3)',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  marginBottom: '20px'
                }}>
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(185, 28, 28, 0.3), rgba(0, 0, 0, 0.5))',
                    padding: '15px 20px',
                    borderBottom: '1px solid rgba(185, 28, 28, 0.3)'
                  }}>
                    <h3 style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      color: '#ffffff'
                    }}>
                      {category?.move_category} ({moves.length}件)
                    </h3>
                  </div>
                  
                  <div style={{ padding: '20px' }}>
                    {moves.length > 0 ? (
                      <div style={{ 
                        display: 'grid',
                        gap: '10px'
                      }}>
                        {moves.slice(0, 5).map((move, moveIndex) => move && (
                          <div key={`move-${move.id || `${move_category_id}-${moveIndex}`}`} style={{
                            padding: '12px',
                            background: 'rgba(0, 0, 0, 0.4)',
                            borderRadius: '6px',
                            border: '1px solid rgba(185, 28, 28, 0.2)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <div>
                              <div style={{ 
                                fontWeight: '500', 
                                fontSize: '16px', 
                                color: '#ffffff',
                                marginBottom: '4px'
                              }}>
                                {move.move_name}
                              </div>
                              <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                                {move.move_name_kana}
                              </div>
                            </div>
                            <div style={{ 
                              fontSize: '12px', 
                              color: '#6b7280',
                              textAlign: 'right'
                            }}>
                              <div>発生: {move.startup_frame}f</div>
                              <div>技ID: {move.move_id}</div>
                            </div>
                          </div>
                        ))}
                        {moves.length > 5 && (
                          <div style={{
                            textAlign: 'center',
                            color: '#9ca3af',
                            fontSize: '14px',
                            padding: '10px'
                          }}>
                            ... 他 {moves.length - 5} 件
                          </div>
                        )}
                      </div>
                    ) : (
                      <p style={{ color: '#6b7280', textAlign: 'center', padding: '40px' }}>
                        この技分類には技が登録されていません
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ページ作成ボタン */}
        {selectedCharacter && (
          <div style={{
            position: 'fixed',
            bottom: '30px',
            right: '30px'
          }}>
            <button
              onClick={handleGoToCharacterPage}
              style={{
                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                color: '#ffffff',
                padding: '16px 32px',
                borderRadius: '50px',
                fontWeight: 'bold',
                fontSize: '18px',
                boxShadow: '0 10px 20px rgba(0,0,0,0.5)',
                cursor: 'pointer',
                border: 'none',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 15px 30px rgba(0,0,0,0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.5)';
              }}
            >
              📋 キャラクターページを見る
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}