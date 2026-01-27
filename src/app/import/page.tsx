'use client';

import { useState, useCallback, useRef } from 'react';
import { Amplify } from 'aws-amplify';
import config from '../../../amplify_outputs.json';
import { generateClient } from 'aws-amplify/data';
import Papa from 'papaparse';

// Amplify設定を初期化
Amplify.configure(config);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const client = generateClient<any>({
  authMode: 'apiKey'
});

// ページネーション対応の全件取得ヘルパー
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchAll(model: any, updateMessage?: (msg: string) => void): Promise<any[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let allItems: any[] = [];
  let nextToken: string | null = null;
  let pageCount = 0;

  do {
    pageCount++;
    if (updateMessage) {
      updateMessage(`データ取得中... ページ ${pageCount}`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const params: any = {
      authMode: 'apiKey',
      limit: 1000,
    };

    if (nextToken) {
      params.nextToken = nextToken;
    }

    const result = await model.list(params);
    const pageItems = (result.data || []).filter(Boolean);
    allItems = allItems.concat(pageItems);
    nextToken = result.nextToken || null;
  } while (nextToken);

  return allItems;
}

// バッチ削除ヘルパー（並列処理で高速化）
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function batchDelete(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  model: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  items: any[],
  onProgress: (current: number, total: number) => void,
  batchSize: number = 10
): Promise<void> {
  const total = items.length;
  let deleted = 0;

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    
    // 並列で削除
    await Promise.all(
      batch.map(async (item) => {
        try {
          await model.delete({ id: item.id }, { authMode: 'apiKey' });
        } catch (e) {
          console.error('Delete error:', e);
        }
      })
    );

    deleted += batch.length;
    onProgress(deleted, total);
  }
}

type ImportType = 'character' | 'moveCategory' | 'move';

interface ImportResult {
  success: number;
  skipped: number;
  error: number;
  total: number;
  errors: string[];
}

interface ImportState {
  isImporting: boolean;
  progress: number;
  message: string;
  result: ImportResult | null;
}

const stringOrNull = (value: unknown): string | null => {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  return trimmed === '' ? null : trimmed;
};

const intOrNull = (value: unknown): number | null => {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  if (trimmed === '') return null;
  const num = parseInt(trimmed, 10);
  return isNaN(num) ? null : num;
};

export default function ImportPage() {
  const [importType, setImportType] = useState<ImportType>('character');
  const [replaceAll, setReplaceAll] = useState(false);
  const [dryRun, setDryRun] = useState(false);
  const [state, setState] = useState<ImportState>({
    isImporting: false,
    progress: 0,
    message: '',
    result: null,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateState = useCallback((updates: Partial<ImportState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  // キャラクターインポート
  const importCharacters = async (data: Record<string, unknown>[], isDryRun: boolean) => {
    const result: ImportResult = { success: 0, skipped: 0, error: 0, total: data.length, errors: [] };

    // 既存データ取得（ページネーション対応）
    const existingCharacters = await fetchAll(
      client.models.Character,
      (msg) => updateState({ message: msg })
    );

    // 全置換モードの場合、既存データを削除
    if (replaceAll && existingCharacters.length > 0 && !isDryRun) {
      await batchDelete(
        client.models.Character,
        existingCharacters,
        (current, total) => {
          updateState({
            message: `既存データ削除中... ${current}/${total}件`,
            progress: Math.round((current / total) * 50), // 削除は進捗の0-50%
          });
        }
      );
    }

    // 重複チェック用マップ
    const existingMap = new Map<string, boolean>();
    if (!replaceAll) {
      existingCharacters.forEach((c) => {
        if (c.character_id) existingMap.set(c.character_id, true);
      });
    }

    // インポート処理
    const progressOffset = (replaceAll && !isDryRun) ? 50 : 0;
    const progressScale = (replaceAll && !isDryRun) ? 50 : 100;
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 2;
      updateState({
        progress: progressOffset + Math.round(((i + 1) / data.length) * progressScale),
        message: `${isDryRun ? '[ドライラン] ' : ''}インポート中... ${i + 1}/${data.length}`,
      });

      try {
        const characterId = stringOrNull(row.character_id);
        const characterNameEn = stringOrNull(row.character_name_en);

        if (!characterId || !characterNameEn) {
          throw new Error('必須フィールド不足 (character_id, character_name_en)');
        }

        if (!replaceAll && existingMap.has(characterId)) {
          result.skipped++;
          continue;
        }

        if (!isDryRun) {
          await client.models.Character.create({
            character_id: characterId,
            character_name_en: characterNameEn,
            character_name_jp: stringOrNull(row.character_name_jp),
            nickname: stringOrNull(row.nickname),
            height: stringOrNull(row.height),
            weight: stringOrNull(row.weight),
            nationality: stringOrNull(row.nationality),
            martial_arts: stringOrNull(row.martial_arts),
            character_description: stringOrNull(row.character_description),
          }, { authMode: 'apiKey' });
        }

        result.success++;
      } catch (e) {
        result.error++;
        result.errors.push(`行${rowNumber}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    return result;
  };

  // 技分類インポート
  const importMoveCategories = async (data: Record<string, unknown>[], isDryRun: boolean) => {
    const result: ImportResult = { success: 0, skipped: 0, error: 0, total: data.length, errors: [] };

    // 既存データ取得（ページネーション対応）
    const existingCategories = await fetchAll(
      client.models.MoveCategory,
      (msg) => updateState({ message: msg })
    );

    if (replaceAll && existingCategories.length > 0 && !isDryRun) {
      await batchDelete(
        client.models.MoveCategory,
        existingCategories,
        (current, total) => {
          updateState({
            message: `既存データ削除中... ${current}/${total}件`,
            progress: Math.round((current / total) * 50),
          });
        }
      );
    }

    const existingMap = new Map<string, boolean>();
    if (!replaceAll) {
      existingCategories.forEach((c) => {
        if (c.move_category_id) existingMap.set(c.move_category_id, true);
      });
    }

    // インポート処理
    const progressOffset = (replaceAll && !isDryRun) ? 50 : 0;
    const progressScale = (replaceAll && !isDryRun) ? 50 : 100;

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 2;
      updateState({
        progress: progressOffset + Math.round(((i + 1) / data.length) * progressScale),
        message: `${isDryRun ? '[ドライラン] ' : ''}インポート中... ${i + 1}/${data.length}`,
      });

      try {
        const categoryId = stringOrNull(row.move_category_id);
        const categoryName = stringOrNull(row.move_category);

        if (!categoryId || !categoryName) {
          throw new Error('必須フィールド不足 (move_category_id, move_category)');
        }

        if (!replaceAll && existingMap.has(categoryId)) {
          result.skipped++;
          continue;
        }

        if (!isDryRun) {
          await client.models.MoveCategory.create({
            move_category_id: categoryId,
            move_category: categoryName,
          }, { authMode: 'apiKey' });
        }

        result.success++;
      } catch (e) {
        result.error++;
        result.errors.push(`行${rowNumber}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    return result;
  };

  // 技データインポート
  const importMoves = async (data: Record<string, unknown>[], isDryRun: boolean) => {
    const result: ImportResult = { success: 0, skipped: 0, error: 0, total: data.length, errors: [] };

    updateState({ message: '参照データを取得中...' });
    
    // キャラクター・技分類・既存技を取得（ページネーション対応）
    const [characters, categories, existingMoves] = await Promise.all([
      fetchAll(client.models.Character, (msg) => updateState({ message: `キャラクター${msg}` })),
      fetchAll(client.models.MoveCategory, (msg) => updateState({ message: `技分類${msg}` })),
      fetchAll(client.models.Move, (msg) => updateState({ message: `既存技${msg}` })),
    ]);

    // 参照マップ作成
    const characterMap = new Map<string, boolean>();
    characters.forEach((c) => {
      if (c.character_id) characterMap.set(c.character_id, true);
    });

    const categoryMap = new Map<string, string>();
    categories.forEach((c) => {
      if (c.move_category_id && c.id) {
        categoryMap.set(c.move_category_id, c.id);
      }
    });

    if (replaceAll && existingMoves.length > 0 && !isDryRun) {
      await batchDelete(
        client.models.Move,
        existingMoves,
        (current, total) => {
          updateState({
            message: `既存データ削除中... ${current}/${total}件`,
            progress: Math.round((current / total) * 50),
          });
        }
      );
    }

    const existingMoveMap = new Map<string, boolean>();
    if (!replaceAll) {
      existingMoves.forEach((m) => {
        if (m.move_id) existingMoveMap.set(m.move_id, true);
      });
    }

    // インポート処理
    const progressOffset = (replaceAll && !isDryRun) ? 50 : 0;
    const progressScale = (replaceAll && !isDryRun) ? 50 : 100;

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 2;
      updateState({
        progress: progressOffset + Math.round(((i + 1) / data.length) * progressScale),
        message: `${isDryRun ? '[ドライラン] ' : ''}インポート中... ${i + 1}/${data.length}`,
      });

      try {
        const moveId = stringOrNull(row.move_id);
        const characterId = stringOrNull(row.character_id);
        const moveCategoryId = stringOrNull(row.move_category_id);
        const moveName = stringOrNull(row.move_name);

        if (!moveId || !characterId || !moveCategoryId || !moveName) {
          throw new Error('必須フィールド不足 (move_id, character_id, move_category_id, move_name)');
        }

        if (!characterMap.has(characterId)) {
          throw new Error(`character_id "${characterId}" が存在しません`);
        }

        if (!categoryMap.has(moveCategoryId)) {
          throw new Error(`move_category_id "${moveCategoryId}" が存在しません`);
        }

        if (!replaceAll && existingMoveMap.has(moveId)) {
          result.skipped++;
          continue;
        }

        // エフェクトIDを配列に変換
        const effects: string[] = [];
        for (let j = 1; j <= 5; j++) {
          const effectId = stringOrNull(row[`effect_id_${j}`]);
          if (effectId) effects.push(effectId);
        }

        // 備考を配列に変換
        const remarks: string[] = [];
        for (let j = 1; j <= 5; j++) {
          const remark = stringOrNull(row[`remarks_${j}`]);
          if (remark) remarks.push(remark);
        }

        if (!isDryRun) {
          await client.models.Move.create({
            move_id: moveId,
            move_num: intOrNull(row.move_num),
            character_id: characterId,
            move_category_id: categoryMap.get(moveCategoryId) || null,
            move_name: moveName,
            move_name_kana: stringOrNull(row.move_name_kana),
            command: stringOrNull(row.command),
            startup_frame: intOrNull(row.startup_frame),
            active_frame: stringOrNull(row.active_frame),
            hit_frame: stringOrNull(row.hit_frame),
            block_frame: stringOrNull(row.block_frame),
            attribute: stringOrNull(row.attribute),
            effects: effects.length > 0 ? effects : null,
            remarks: remarks.length > 0 ? remarks : null,
          }, { authMode: 'apiKey' });
        }

        result.success++;
      } catch (e) {
        result.error++;
        result.errors.push(`行${rowNumber}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    return result;
  };

  // ファイル選択ハンドラ
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    updateState({ isImporting: true, progress: 0, message: 'CSVファイル読み込み中...', result: null });

    try {
      const text = await file.text();
      
      Papa.parse<Record<string, unknown>>(text, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          try {
            const data = results.data;
            
            if (data.length === 0) {
              updateState({ isImporting: false, message: 'CSVデータが空です', result: null });
              return;
            }

            let result: ImportResult;

            switch (importType) {
              case 'character':
                result = await importCharacters(data, dryRun);
                break;
              case 'moveCategory':
                result = await importMoveCategories(data, dryRun);
                break;
              case 'move':
                result = await importMoves(data, dryRun);
                break;
            }

            updateState({
              isImporting: false,
              progress: 100,
              message: dryRun ? 'ドライラン完了' : 'インポート完了',
              result,
            });
          } catch (e) {
            updateState({
              isImporting: false,
              message: `エラー: ${e instanceof Error ? e.message : String(e)}`,
              result: null,
            });
          }
        },
        error: (error: Error) => {
          updateState({
            isImporting: false,
            message: `CSV解析エラー: ${error.message}`,
            result: null,
          });
        },
      });
    } catch (e) {
      updateState({
        isImporting: false,
        message: `ファイル読み込みエラー: ${e instanceof Error ? e.message : String(e)}`,
        result: null,
      });
    }

    // ファイル入力をリセット
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getTypeLabel = (type: ImportType): string => {
    switch (type) {
      case 'character':
        return 'キャラクター';
      case 'moveCategory':
        return '技分類';
      case 'move':
        return '技データ';
    }
  };

  const getExpectedHeaders = (type: ImportType): string[] => {
    switch (type) {
      case 'character':
        return ['character_id', 'character_name_en', 'character_name_jp', 'nickname', 'height', 'weight', 'nationality', 'martial_arts', 'character_description'];
      case 'moveCategory':
        return ['move_category_id', 'move_category'];
      case 'move':
        return ['move_id', 'move_num', 'character_id', 'move_category_id', 'move_name', 'move_name_kana', 'command', 'startup_frame', 'active_frame', 'hit_frame', 'block_frame', 'attribute', 'effect_id_1', 'effect_id_2', 'effect_id_3', 'effect_id_4', 'effect_id_5', 'remarks_1', 'remarks_2', 'remarks_3', 'remarks_4', 'remarks_5'];
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">CSVインポート</h1>

      {/* インポートタイプ選択 */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">インポート種別</label>
        <div className="flex gap-4">
          {(['character', 'moveCategory', 'move'] as ImportType[]).map((type) => (
            <label key={type} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="importType"
                value={type}
                checked={importType === type}
                onChange={() => setImportType(type)}
                disabled={state.isImporting}
                className="w-4 h-4"
              />
              <span>{getTypeLabel(type)}</span>
            </label>
          ))}
        </div>
      </div>

      {/* オプション */}
      <div className="mb-6 space-y-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={dryRun}
            onChange={(e) => setDryRun(e.target.checked)}
            disabled={state.isImporting}
            className="w-4 h-4"
          />
          <span>ドライランモード（実際の処理は行わずテストのみ）</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={replaceAll}
            onChange={(e) => setReplaceAll(e.target.checked)}
            disabled={state.isImporting}
            className="w-4 h-4"
          />
          <span>全置換モード（既存データを全て削除してからインポート）</span>
        </label>
      </div>

      {/* CSVヘッダー表示 */}
      <div className="mb-6 p-4 bg-gray-100 rounded">
        <p className="text-sm font-medium mb-2">必要なCSVヘッダー:</p>
        <code className="text-xs break-all">{getExpectedHeaders(importType).join(', ')}</code>
      </div>

      {/* ファイル選択 */}
      <div className="mb-6">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          disabled={state.isImporting}
          className="block w-full text-sm border border-gray-300 rounded p-2 cursor-pointer disabled:opacity-50"
        />
      </div>

      {/* 進捗表示 */}
      {state.isImporting && (
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-1">
            <span>{state.message}</span>
            <span>{state.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded h-2">
            <div
              className="bg-blue-500 h-2 rounded transition-all"
              style={{ width: `${state.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* メッセージ表示 */}
      {!state.isImporting && state.message && !state.result && (
        <div className="mb-6 p-4 bg-yellow-100 text-yellow-800 rounded">
          {state.message}
        </div>
      )}

      {/* 結果表示 */}
      {state.result && (
        <div className={`p-4 rounded ${dryRun ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'}`}>
          <h2 className="font-bold mb-2">
            {dryRun ? '📋 ドライラン結果（実際の処理は行われていません）' : 'インポート結果'}
          </h2>
          <ul className="text-sm space-y-1">
            <li>成功{dryRun ? '予定' : ''}: {state.result.success}件</li>
            <li>スキップ{dryRun ? '予定' : ''}: {state.result.skipped}件</li>
            <li>エラー: {state.result.error}件</li>
            <li>合計: {state.result.total}件</li>
          </ul>
          
          {state.result.errors.length > 0 && (
            <div className="mt-4">
              <p className="font-medium text-red-600 mb-2">エラー詳細 (最初の10件):</p>
              <ul className="text-xs text-red-600 space-y-1 max-h-40 overflow-y-auto">
                {state.result.errors.slice(0, 10).map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
              {state.result.errors.length > 10 && (
                <p className="text-xs text-red-600 mt-1">
                  ... 他 {state.result.errors.length - 10} 件のエラー
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
