'use client';

import { useState, useEffect } from 'react';
import { client } from '@/lib/client';

interface Character {
  id: string;
  character_id: string;
  character_name_en: string;
  character_name_jp?: string | null;
  display_name?: string | null;
}

const CATEGORIES = [
  '確定反撃',
  'しゃがめる連携',
  '割れない連携',
  '潜る連携',
  'ファジー',
  '立ち回り',
  'その他'
];

export default function MemoPage() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [importance, setImportance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    fetchCharacters();
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const fetchCharacters = async () => {
    try {
      const { data } = await client.models.Character.list({ authMode: 'apiKey' });
      const validCharacters = (data || []).filter(c => c !== null) as Character[];
      const sorted = validCharacters.sort((a, b) => {
        const idA = String(a.character_id).padStart(3, '0');
        const idB = String(b.character_id).padStart(3, '0');
        return idA.localeCompare(idB);
      });
      setCharacters(sorted);
    } catch (error) {
      console.error('キャラクター取得エラー:', error);
    }
  };

  const handleCategoryToggle = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const handleSave = async () => {
    if (!selectedCharacter) {
      alert('キャラクターを選択してください');
      return;
    }
    if (!title.trim()) {
      alert('メモを入力してください');
      return;
    }

    setLoading(true);
    
    try {
      const selectedChar = characters.find(c => c.character_id === selectedCharacter);
      const characterName = selectedChar 
        ? (selectedChar.display_name || selectedChar.character_name_jp || selectedChar.character_name_en)
        : selectedCharacter;

      // メモデータを作成（空配列やnullの適切な処理）
      const memoData = {
        character_id: selectedCharacter,
        character_name: characterName || selectedCharacter,
        categories: selectedCategories.length > 0 ? selectedCategories : undefined,
        title: title.trim(),
        content: content.trim() || undefined,
        importance: importance > 0 ? importance : undefined
      };

      console.log('メモ保存データ:', memoData);

      const result = await client.models.Memo.create(memoData, {
        authMode: 'apiKey'
      });

      console.log('保存結果:', result);

      if (result.data) {
        alert('メモを保存しました！');
        
        // フォームをリセット
        setSelectedCharacter('');
        setSelectedCategories([]);
        setTitle('');
        setContent('');
        setImportance(0);
      } else {
        throw new Error('データの保存に失敗しました');
      }
      
    } catch (error) {
      console.error('保存エラー詳細:', error);
      
      // エラーの詳細情報を表示
      if (error instanceof Error) {
        alert(`保存に失敗しました: ${error.message}`);
      } else {
        alert('保存に失敗しました。もう一度お試しください。');
      }
    } finally {
      setLoading(false);
    }
  };

  const getDisplayName = (character: Character): string => {
    if (character.display_name) return character.display_name;
    return character.character_name_jp || character.character_name_en;
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: `
        linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.5)),
        url('/backgrounds/background.jpg')
      `,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      backgroundRepeat: 'no-repeat',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23991b1b' fill-opacity='0.02'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        pointerEvents: 'none'
      }} />

      <div style={{
        position: 'relative',
        zIndex: 1,
        padding: isMobile ? '20px' : '40px 20px',
        maxWidth: '900px',
        margin: '0 auto'
      }}>
        {/* ヘッダー */}
        <div style={{
          textAlign: 'center',
          marginBottom: '40px'
        }}>
          <div style={{
            display: 'inline-block',
            position: 'relative'
          }}>
            <div style={{
              position: 'absolute',
              top: '-5px',
              left: '-30px',
              right: '-30px',
              bottom: '-5px',
              background: 'linear-gradient(135deg, #dc2626, #991b1b)',
              padding: '3px',
              borderRadius: '2px',
              boxShadow: '0 5px 15px rgba(0, 0, 0, 0.7)'
            }}>
              <div style={{
                width: '100%',
                height: '100%',
                background: 'linear-gradient(135deg, rgba(0,0,0,0.95), rgba(127, 29, 29, 0.15))',
                borderRadius: '1px'
              }} />
            </div>
            
            <h1 style={{
              position: 'relative',
              fontSize: isMobile ? '24px' : '32px',
              fontWeight: 'bold',
              color: '#ffffff',
              letterSpacing: '4px',
              textTransform: 'uppercase',
              textShadow: '2px 2px 4px rgba(0,0,0,0.9)',
              padding: '10px 40px'
            }}>
              メモ作成
            </h1>
          </div>
        </div>

        {/* メインコンテンツ */}
        <div style={{
          position: 'relative'
        }}>
          <div style={{
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            background: 'linear-gradient(135deg, #dc2626, #991b1b)',
            padding: '3px',
            borderRadius: '8px',
            boxShadow: '0 5px 15px rgba(0, 0, 0, 0.7)'
          }}>
            <div style={{
              width: '100%',
              height: '100%',
              background: 'rgba(0, 0, 0, 0.85)',
              borderRadius: '6px'
            }} />
          </div>

          <div style={{
            position: 'relative',
            padding: isMobile ? '20px' : '40px'
          }}>
            {/* キャラクター選択 */}
            <div style={{ marginBottom: '30px' }}>
              <label style={{
                display: 'block',
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#fca5a5',
                marginBottom: '12px',
                letterSpacing: '1px'
              }}>
                キャラクター
              </label>
              <select
                value={selectedCharacter}
                onChange={(e) => setSelectedCharacter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '16px',
                  background: 'rgba(0, 0, 0, 0.6)',
                  border: '2px solid rgba(185, 28, 28, 0.4)',
                  borderRadius: '6px',
                  color: '#ffffff',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="">選択してください</option>
                {characters.map(char => (
                  <option key={char.id} value={char.character_id}>
                    {getDisplayName(char)}
                  </option>
                ))}
              </select>
            </div>

            {/* 分類選択 */}
            <div style={{ marginBottom: '30px' }}>
              <label style={{
                display: 'block',
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#fca5a5',
                marginBottom: '12px',
                letterSpacing: '1px'
              }}>
                分類
              </label>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '10px'
              }}>
                {CATEGORIES.map(category => (
                  <label
                    key={category}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 16px',
                      background: selectedCategories.includes(category)
                        ? 'rgba(185, 28, 28, 0.3)'
                        : 'rgba(0, 0, 0, 0.4)',
                      border: '1px solid',
                      borderColor: selectedCategories.includes(category)
                        ? 'rgba(248, 113, 113, 0.5)'
                        : 'rgba(185, 28, 28, 0.2)',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      color: selectedCategories.includes(category) ? '#fca5a5' : '#e5e7eb'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category)}
                      onChange={() => handleCategoryToggle(category)}
                      style={{
                        width: '18px',
                        height: '18px',
                        cursor: 'pointer'
                      }}
                    />
                    <span style={{ fontSize: '14px', fontWeight: '500' }}>
                      {category}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* メモ入力 */}
            <div style={{ marginBottom: '30px' }}>
              <label style={{
                display: 'block',
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#fca5a5',
                marginBottom: '12px',
                letterSpacing: '1px'
              }}>
                メモ <span style={{ color: '#f87171', fontSize: '14px' }}>*必須</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例: LPRPはガード後12F確定反撃"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '16px',
                  background: 'rgba(0, 0, 0, 0.6)',
                  border: '2px solid rgba(185, 28, 28, 0.4)',
                  borderRadius: '6px',
                  color: '#ffffff',
                  outline: 'none'
                }}
              />
            </div>

            {/* 補足入力 */}
            <div style={{ marginBottom: '30px' }}>
              <label style={{
                display: 'block',
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#fca5a5',
                marginBottom: '12px',
                letterSpacing: '1px'
              }}>
                補足 <span style={{ color: '#9ca3af', fontSize: '14px' }}>任意</span>
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="詳細な説明や補足情報を入力してください（任意）"
                rows={10}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '16px',
                  background: 'rgba(0, 0, 0, 0.6)',
                  border: '2px solid rgba(185, 28, 28, 0.4)',
                  borderRadius: '6px',
                  color: '#ffffff',
                  outline: 'none',
                  resize: 'vertical',
                  lineHeight: '1.6'
                }}
              />
            </div>

            {/* 重要度選択 */}
            <div style={{ marginBottom: '30px' }}>
              <label style={{
                display: 'block',
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#fca5a5',
                marginBottom: '12px',
                letterSpacing: '1px'
              }}>
                重要度
              </label>
              <div style={{
                display: 'flex',
                gap: '8px',
                alignItems: 'center'
              }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onClick={() => setImportance(star)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '32px',
                      color: star <= importance ? '#fbbf24' : '#4b5563',
                      transition: 'all 0.2s',
                      padding: '4px'
                    }}
                  >
                    ★
                  </button>
                ))}
                <button
                  onClick={() => setImportance(0)}
                  style={{
                    marginLeft: '16px',
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    background: 'rgba(107, 114, 128, 0.3)',
                    border: '2px solid rgba(107, 114, 128, 0.5)',
                    borderRadius: '6px',
                    color: '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(107, 114, 128, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(107, 114, 128, 0.3)';
                  }}
                >
                  クリア
                </button>
              </div>
            </div>

            {/* ボタン */}
            <div style={{
              display: 'flex',
              gap: '20px',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <a
                href="/"
                style={{
                  padding: '14px 40px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  background: 'rgba(107, 114, 128, 0.3)',
                  border: '2px solid rgba(107, 114, 128, 0.5)',
                  borderRadius: '8px',
                  color: '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  minWidth: '140px',
                  textDecoration: 'none',
                  display: 'inline-block',
                  textAlign: 'center'
                }}
              >
                戻る
              </a>

              <button
                onClick={handleSave}
                disabled={loading}
                style={{
                  padding: '14px 40px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  background: loading 
                    ? 'rgba(107, 114, 128, 0.3)'
                    : 'linear-gradient(135deg, #dc2626, #991b1b)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#ffffff',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
                  minWidth: '140px'
                }}
              >
                {loading ? '保存中...' : '保存'}
              </button>

              <a
                href="/memo/list"
                style={{
                  padding: '14px 40px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
                  minWidth: '140px',
                  textDecoration: 'none',
                  display: 'inline-block',
                  textAlign: 'center'
                }}
              >
                一覧を見る
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}