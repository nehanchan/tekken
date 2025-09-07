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