'use client';

import { useState, useEffect } from 'react';
import { client } from '@/lib/client';

interface FormData {
  character_id: string;
  character_name_en: string;
  character_name_jp: string;
  display_name: string;
  nickname: string;
  nationality: string;
  height: string;
  weight: string;
  martial_arts: string;
  character_description: string;
}

export default function NewCharacterPage() {
  const [formData, setFormData] = useState<FormData>({
    character_id: '',
    character_name_en: '',
    character_name_jp: '',
    display_name: '',
    nickname: '',
    nationality: '',
    height: '',
    weight: '',
    martial_arts: '',
    character_description: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [existingIds, setExistingIds] = useState<string[]>([]);
  const [idError, setIdError] = useState('');

  useEffect(() => {
    fetchExistingIds();
  }, []);

  const fetchExistingIds = async () => {
    try {
      const result = await client.models.Character.list({ authMode: 'apiKey' });
      const ids = (result.data || [])
        .filter(c => c !== null && c.character_id)
        .map(c => c.character_id);
      setExistingIds(ids);
    } catch (error) {
      console.error('ID取得エラー:', error);
    }
  };

  const validateId = (id: string) => {
    if (!id.trim()) {
      setIdError('IDは必須です');
      return false;
    }
    if (existingIds.includes(id.trim())) {
      setIdError('このIDは既に使用されています');
      return false;
    }
    if (!/^[0-9A-Za-z_-]+$/.test(id)) {
      setIdError('英数字、ハイフン、アンダースコアのみ使用可能');
      return false;
    }
    setIdError('');
    return true;
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'character_id') {
      validateId(value);
    }
  };

  const handleSubmit = async () => {
    if (!validateId(formData.character_id)) {
      alert('IDが無効です');
      return;
    }
    if (!formData.character_name_en.trim()) {
      alert('英語名は必須です');
      return;
    }

    setLoading(true);
    try {
      const data: any = {
        character_id: formData.character_id.trim(),
        character_name_en: formData.character_name_en.trim()
      };
      
      if (formData.character_name_jp) data.character_name_jp = formData.character_name_jp;
      if (formData.display_name) data.display_name = formData.display_name;
      if (formData.nickname) data.nickname = formData.nickname;
      if (formData.nationality) data.nationality = formData.nationality;
      if (formData.height) data.height = formData.height;
      if (formData.weight) data.weight = formData.weight;
      if (formData.martial_arts) data.martial_arts = formData.martial_arts;
      if (formData.character_description) data.character_description = formData.character_description;

      await client.models.Character.create(data, { authMode: 'apiKey' });
      
      setSaveSuccess(true);
      setTimeout(() => {
        const cont = confirm('登録しました！続けて登録しますか？');
        if (cont) {
          setFormData({
            character_id: '',
            character_name_en: '',
            character_name_jp: '',
            display_name: '',
            nickname: '',
            nationality: '',
            height: '',
            weight: '',
            martial_arts: '',
            character_description: ''
          });
          setSaveSuccess(false);
          fetchExistingIds();
        } else {
          window.location.href = '/';
        }
      }, 1000);
    } catch (error) {
      console.error('エラー:', error);
      alert('保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const containerStyle = {
    minHeight: '100vh',
    background: '#0a0a0a',
    padding: '40px 20px'
  };

  const boxStyle = {
    maxWidth: '900px',
    margin: '0 auto',
    background: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: '8px',
    padding: '30px'
  };

  const headerStyle = {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: '30px'
  };

  const labelStyle = {
    display: 'block',
    color: '#999',
    fontSize: '14px',
    marginBottom: '6px'
  };

  const inputStyle = {
    width: '100%',
    padding: '10px',
    background: '#0a0a0a',
    border: '1px solid #333',
    borderRadius: '4px',
    color: '#fff',
    fontSize: '16px'
  };

  const inputErrorStyle = {
    ...inputStyle,
    borderColor: '#dc2626'
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
    marginBottom: '20px'
  };

  const buttonStyle = {
    padding: '12px 30px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '16px'
  };

  const submitButtonStyle = {
    ...buttonStyle,
    background: loading ? '#555' : '#22c55e',
    color: '#fff'
  };

  const resetButtonStyle = {
    ...buttonStyle,
    background: '#333',
    color: '#fff',
    border: '1px solid #555'
  };

  return (
    <div style={containerStyle}>
      <div style={boxStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
          <h1 style={headerStyle}>新規キャラクター登録</h1>
          <div style={{ display: 'flex', gap: '10px' }}>
            <a href="/character/create" style={{ ...buttonStyle, background: '#333', color: '#fff', textDecoration: 'none', display: 'inline-block' }}>編集ページ</a>
            <a href="/" style={{ ...buttonStyle, background: '#dc2626', color: '#fff', textDecoration: 'none', display: 'inline-block' }}>トップ</a>
          </div>
        </div>

        {saveSuccess && (
          <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: '#22c55e',
            color: '#fff',
            padding: '15px 30px',
            borderRadius: '6px',
            zIndex: 1000
          }}>
            ✅ 登録完了
          </div>
        )}

        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ color: '#fca5a5', fontSize: '18px', marginBottom: '15px' }}>必須項目</h2>
          <div style={gridStyle}>
            <div>
              <label style={labelStyle}>キャラクターID *</label>
              <input
                type="text"
                value={formData.character_id}
                onChange={(e) => handleChange('character_id', e.target.value)}
                placeholder="例: 001"
                style={idError ? inputErrorStyle : inputStyle}
              />
              {idError && <div style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px' }}>{idError}</div>}
            </div>
            <div>
              <label style={labelStyle}>英語名 *</label>
              <input
                type="text"
                value={formData.character_name_en}
                onChange={(e) => handleChange('character_name_en', e.target.value)}
                placeholder="例: Jin Kazama"
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ color: '#fca5a5', fontSize: '18px', marginBottom: '15px' }}>基本情報</h2>
          <div style={gridStyle}>
            <div>
              <label style={labelStyle}>日本語名</label>
              <input
                type="text"
                value={formData.character_name_jp}
                onChange={(e) => handleChange('character_name_jp', e.target.value)}
                placeholder="例: 風間 仁"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>表示名</label>
              <input
                type="text"
                value={formData.display_name}
                onChange={(e) => handleChange('display_name', e.target.value)}
                placeholder="例: 仁"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>ニックネーム</label>
              <input
                type="text"
                value={formData.nickname}
                onChange={(e) => handleChange('nickname', e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>国籍</label>
              <input
                type="text"
                value={formData.nationality}
                onChange={(e) => handleChange('nationality', e.target.value)}
                placeholder="例: 日本"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>身長</label>
              <input
                type="text"
                value={formData.height}
                onChange={(e) => handleChange('height', e.target.value)}
                placeholder="例: 180cm"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>体重</label>
              <input
                type="text"
                value={formData.weight}
                onChange={(e) => handleChange('weight', e.target.value)}
                placeholder="例: 75kg"
                style={inputStyle}
              />
            </div>
          </div>
          <div style={{ marginTop: '20px' }}>
            <label style={labelStyle}>格闘技</label>
            <input
              type="text"
              value={formData.martial_arts}
              onChange={(e) => handleChange('martial_arts', e.target.value)}
              placeholder="例: 風間流空手"
              style={inputStyle}
            />
          </div>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ color: '#fca5a5', fontSize: '18px', marginBottom: '15px' }}>紹介文</h2>
          <textarea
            value={formData.character_description}
            onChange={(e) => handleChange('character_description', e.target.value)}
            placeholder="キャラクターの説明..."
            rows={6}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
          <button
            onClick={() => {
              if (confirm('リセットしますか？')) {
                setFormData({
                  character_id: '',
                  character_name_en: '',
                  character_name_jp: '',
                  display_name: '',
                  nickname: '',
                  nationality: '',
                  height: '',
                  weight: '',
                  martial_arts: '',
                  character_description: ''
                });
              }
            }}
            style={resetButtonStyle}
          >
            リセット
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !!idError || !formData.character_id || !formData.character_name_en}
            style={submitButtonStyle}
          >
            {loading ? '登録中...' : '登録'}
          </button>
        </div>
      </div>
    </div>
  );
}