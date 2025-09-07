// src/types/index.ts
import { Schema } from '../../amplify/data/resource';

export type Character = Schema['Character']['type'];
export type MoveCategory = Schema['MoveCategory']['type'];
export type Move = Schema['Move']['type'];
export type Effect = Schema['Effect']['type'];
export type Post = Schema['Post']['type'];

// 追加の型定義（必要に応じて）
export interface ExtendedMove extends Move {
  categoryName?: string;
}

export interface ExtendedCharacter extends Character {
  moveCount?: number;
}

// エフェクト関連の型
export interface EffectData {
  name: string;
  fileName: string;
  description: string;
}

export interface EffectMap {
  [key: string]: EffectData;
}

// フレームデータの型
export type FrameValue = string | number | null | undefined;

// コマンド関連の型
export interface CommandIcon {
  name: string;
  path: string;
}

// CSVインポート用の型定義
export interface MoveCsvRow {
  move_id: string;
  move_num?: string | number;
  character_id: string;
  move_category_id?: string;
  move_name: string;
  move_name_kana?: string;
  command?: string;
  startup_frame?: string | number;
  active_frame?: string;
  hit_frame?: string;
  block_frame?: string;
  attribute?: string;
  // エフェクト関連（CSV用）
  effect_id_1?: string;
  effect_id_2?: string;
  effect_id_3?: string;
  effect_id_4?: string;
  effect_id_5?: string;
  // 備考関連（CSV用）
  remarks_1?: string;
  remarks_2?: string;
  remarks_3?: string;
  remarks_4?: string;
  remarks_5?: string;
}