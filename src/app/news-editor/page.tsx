// src/app/news-editor/page.tsx
'use client';

import { useState, useEffect } from 'react';

interface NewsItem {
  date: string;
  tag: string;
  content: string;
}

export default function NewsEditorPage() {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<NewsItem>({
    date: '',
    tag: '新着',
    content: ''
  });
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = () => {
    const savedNews = localStorage.getItem('tekkenNews');
    if (savedNews) {
      setNewsItems(JSON.parse(savedNews));
    }
  };

  const handleAdd = () => {
    if (!formData.date || !formData.content) {
      alert('日付と内容は必須です');
      return;
    }
    
    // 日付を YYYY.MM.DD 形式に変換
    const formattedDate = formData.date.replace(/-/g, '.');
    const newItem = { ...formData, date: formattedDate };
    
    const newItems = [...newsItems, newItem];
    // 日付でソート（新しい順）
    newItems.sort((a, b) => b.date.localeCompare(a.date));
    
    setNewsItems(newItems);
    setFormData({ date: '', tag: '新着', content: '' });
    saveNewsToStorage(newItems);
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    // 編集時は YYYY-MM-DD 形式に戻す
    const item = newsItems[index];
    const dateForInput = item.date.replace(/\./g, '-');
    setFormData({ ...item, date: dateForInput });
  };

  const handleUpdate = () => {
    if (editingIndex === null) return;
    
    // 日付を YYYY.MM.DD 形式に変換
    const formattedDate = formData.date.replace(/-/g, '.');
    const updatedItem = { ...formData, date: formattedDate };
    
    const newItems = [...newsItems];
    newItems[editingIndex] = updatedItem;
    
    setNewsItems(newItems);
    setEditingIndex(null);
    setFormData({ date: '', tag: '新着', content: '' });
    saveNewsToStorage(newItems);
  };

  const handleDelete = (index: number) => {
    if (confirm('このニュースを削除しますか？')) {
      const newItems = newsItems.filter((_, i) => i !== index);
      setNewsItems(newItems);
      saveNewsToStorage(newItems);
    }
  };

  const saveNewsToStorage = (items: NewsItem[]) => {
    localStorage.setItem('tekkenNews', JSON.stringify(items));
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: `
        linear-gradient(135deg, #000000 0%, #1a0505 50%, #000000 100%)
      `,
      padding: '40px 20px'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
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
            NEWS EDITOR
          </h1>
          
          <a 
            href="/"
            style={{
              background: 'linear-gradient(135deg, #dc2626, #991b1b)',
              color: '#ffffff',
              padding: '12px 24px',
              borderRadius: '4px',
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
        {showSuccess && (
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

        {/* 入力フォーム */}
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
            {editingIndex !== null ? 'ニュースを編集' : '新しいニュースを追加'}
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: '150px 120px 1fr',
            gap: '20px',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              style={{
                background: 'rgba(0, 0, 0, 0.6)',
                border: '1px solid rgba(185, 28, 28, 0.4)',
                color: '#ffffff',
                padding: '10px 15px',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
            
            <select
              value={formData.tag}
              onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
              style={{
                background: 'rgba(0, 0, 0, 0.6)',
                border: '1px solid rgba(185, 28, 28, 0.4)',
                color: '#ffffff',
                padding: '10px 15px',
                borderRadius: '4px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              <option value="新着">新着</option>
              <option value="更新">更新</option>
              <option value="重要">重要</option>
              <option value="イベント">イベント</option>
              <option value="メンテナンス">メンテナンス</option>
            </select>
            
            <input
              type="text"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="ニュース内容を入力..."
              style={{
                background: 'rgba(0, 0, 0, 0.6)',
                border: '1px solid rgba(185, 28, 28, 0.4)',
                color: '#ffffff',
                padding: '10px 15px',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>
          
          <div style={{
            display: 'flex',
            gap: '15px',
            justifyContent: 'flex-end'
          }}>
            {editingIndex !== null && (
              <button
                onClick={() => {
                  setEditingIndex(null);
                  setFormData({ date: '', tag: '新着', content: '' });
                }}
                style={{
                  background: 'rgba(107, 114, 128, 0.3)',
                  color: '#ffffff',
                  padding: '10px 24px',
                  borderRadius: '4px',
                  border: '1px solid rgba(107, 114, 128, 0.5)',
                  cursor: 'pointer',
                  fontWeight: 'bold',
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
            )}
            
            <button
              onClick={editingIndex !== null ? handleUpdate : handleAdd}
              style={{
                background: 'linear-gradient(135deg, #dc2626, #991b1b)',
                color: '#ffffff',
                padding: '10px 30px',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
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
              {editingIndex !== null ? '更新' : '追加'}
            </button>
          </div>
        </div>

        {/* ニュース一覧 */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.8)',
          border: '2px solid rgba(185, 28, 28, 0.3)',
          borderRadius: '8px',
          padding: '30px'
        }}>
          <h2 style={{
            fontSize: '24px',
            color: '#fca5a5',
            marginBottom: '20px',
            borderBottom: '2px solid rgba(185, 28, 28, 0.3)',
            paddingBottom: '10px'
          }}>
            現在のニュース一覧
          </h2>
          
          {newsItems.length === 0 ? (
            <p style={{
              color: '#6b7280',
              textAlign: 'center',
              padding: '40px',
              fontSize: '16px'
            }}>
              ニュースがありません
            </p>
          ) : (
            <div>
              {newsItems.map((news, index) => (
                <div 
                  key={index}
                  style={{
                    padding: '15px',
                    borderBottom: index < newsItems.length - 1 ? '1px solid rgba(185, 28, 28, 0.2)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(185, 28, 28, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {/* 日付 */}
                  <div style={{
                    fontSize: '14px',
                    color: '#9ca3af',
                    minWidth: '100px',
                    fontFamily: 'monospace'
                  }}>
                    {news.date}
                  </div>
                  
                  {/* タグ */}
                  <div style={{
                    background: news.tag === '重要' 
                      ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                      : news.tag === '更新'
                      ? 'linear-gradient(135deg, #3b82f6, #2563eb)'
                      : news.tag === 'イベント'
                      ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                      : news.tag === 'メンテナンス'
                      ? 'linear-gradient(135deg, #6b7280, #4b5563)'
                      : 'linear-gradient(135deg, #dc2626, #991b1b)',
                    color: '#ffffff',
                    padding: '2px 10px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    borderRadius: '2px',
                    minWidth: '80px',
                    textAlign: 'center'
                  }}>
                    {news.tag}
                  </div>
                  
                  {/* コンテンツ */}
                  <div style={{
                    fontSize: '14px',
                    color: '#e5e7eb',
                    flex: 1
                  }}>
                    {news.content}
                  </div>
                  
                  {/* アクションボタン */}
                  <div style={{
                    display: 'flex',
                    gap: '10px'
                  }}>
                    <button
                      onClick={() => handleEdit(index)}
                      style={{
                        background: 'rgba(59, 130, 246, 0.3)',
                        color: '#60a5fa',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        border: '1px solid rgba(59, 130, 246, 0.5)',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 'bold',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(59, 130, 246, 0.5)';
                        e.currentTarget.style.color = '#ffffff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(59, 130, 246, 0.3)';
                        e.currentTarget.style.color = '#60a5fa';
                      }}
                    >
                      編集
                    </button>
                    
                    <button
                      onClick={() => handleDelete(index)}
                      style={{
                        background: 'rgba(239, 68, 68, 0.3)',
                        color: '#f87171',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        border: '1px solid rgba(239, 68, 68, 0.5)',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 'bold',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.5)';
                        e.currentTarget.style.color = '#ffffff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)';
                        e.currentTarget.style.color = '#f87171';
                      }}
                    >
                      削除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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