// コマンドアイコンのマッピング定義
const COMMAND_ICONS = [
  'ah', 'all', 'ba', 'bc', 'bj', 'cm', 'cr', 'dk', 'ei', 
  'fc', 'fj', 'fo', 'ij', 'ju', 'lk',
  'lp', 'nb', 'ng', 'nh', 'nt', 'nv', 'qy', 'rk', 'rp',
  'uk', 'wk', 'wl', 'wp', 'wr', 'wu', 'xn', 'zb'
];

// エフェクトアイコンの定義
const EFFECT_ICONS = [
  'TR', 'FB', 'KS', 'GV', 'HO', 'HT', 'PC', 'WB'
];

// 要素の型定義
export interface CommandElement {
  type: 'text' | 'icon';
  value: string;
  iconType?: string;
}

/**
 * 半角括弧を全角括弧に変換する関数
 * @param text 変換対象の文字列
 * @returns 変換後の文字列
 */
function convertParentheses(text: string): string {
  return text
    .replace(/\(/g, '（')  // 半角 ( を全角 （ に変換
    .replace(/\)/g, '）'); // 半角 ) を全角 ） に変換
}

/**
 * コマンド文字列を文字列とアイコンの配列に変換する（大文字小文字対応版）
 * @param command コマンド文字列（例: "相手に接近してLPRP"、"lprp"、"LPRP"）またはnull/undefined
 * @returns 要素配列（例: [{type: 'text', value: '相手に接近して'}, {type: 'icon', value: 'lp'}, {type: 'icon', value: 'rp'}]）
 */
export function parseCommandToElements(command: string | null | undefined): CommandElement[] {
  if (!command || typeof command !== 'string') {
    return [];
  }

  const elements: CommandElement[] = [];
  let i = 0;
  let currentText = '';

  while (i < command.length) {
    let matched = false;
    
    // 長いアイコン名から順に検索（3文字 -> 2文字）
    for (const iconLength of [3, 2]) {
      if (i + iconLength <= command.length) {
        const substring = command.substring(i, i + iconLength);
        const substringLower = substring.toLowerCase();
        const substringUpper = substring.toUpperCase();
        
        // コマンドアイコンのチェック（小文字で比較）
        if (COMMAND_ICONS.includes(substringLower)) {
          // アイコンが見つかった場合
          
          // 蓄積された文字列があれば追加（半角括弧を全角に変換）
          if (currentText.length > 0) {
            elements.push({
              type: 'text',
              value: convertParentheses(currentText)
            });
            currentText = '';
          }
          
          // コマンドアイコンを追加（小文字で統一）
          elements.push({
            type: 'icon',
            value: substringLower,
            iconType: 'command'
          });
          
          i += iconLength;
          matched = true;
          break;
        }
        // エフェクトアイコンのチェック（大文字で比較）
        else if (EFFECT_ICONS.includes(substringUpper)) {
          // アイコンが見つかった場合
          
          // 蓄積された文字列があれば追加（半角括弧を全角に変換）
          if (currentText.length > 0) {
            elements.push({
              type: 'text',
              value: convertParentheses(currentText)
            });
            currentText = '';
          }
          
          // エフェクトアイコンを追加（大文字で統一）
          elements.push({
            type: 'icon',
            value: substringUpper,
            iconType: 'effect'
          });
          
          i += iconLength;
          matched = true;
          break;
        }
      }
    }
    
    // マッチしなかった場合は文字列として蓄積
    if (!matched) {
      currentText += command[i];
      i++;
    }
  }

  // 最後に残った文字列があれば追加（半角括弧を全角に変換）
  if (currentText.length > 0) {
    elements.push({
      type: 'text',
      value: convertParentheses(currentText)
    });
  }

  return elements;
}

/**
 * コマンド文字列をアイコン配列に変換する（後方互換性のため残す）
 * @param command コマンド文字列（例: "fontcrfcrp"、"FONTCRFCRP"）またはnull/undefined
 * @returns アイコンファイル名の配列（例: ["fo", "nt", "cr", "fc", "rp"]）
 */
export function parseCommandToIcons(command: string | null | undefined): string[] {
  const elements = parseCommandToElements(command);
  return elements
    .filter(element => element.type === 'icon')
    .map(element => element.value);
}

/**
 * アイコンファイルのパスを取得
 * @param iconName アイコン名（大文字小文字どちらでも可）
 * @param iconType アイコンタイプ（'command' | 'effect'）
 * @returns アイコンファイルのパス
 */
export function getIconPath(iconName: string, iconType?: string): string {
  const iconNameUpper = iconName.toUpperCase();
  const iconNameLower = iconName.toLowerCase();
  
  if (iconType === 'effect' || EFFECT_ICONS.includes(iconNameUpper)) {
    return `/effect-icons/${iconNameUpper}.png`;
  }
  return `/command-icons/${iconNameLower}.png`;
}

/**
 * コマンド文字列が有効かどうかチェック
 * @param command コマンド文字列またはnull/undefined
 * @returns 有効な場合true
 */
export function isValidCommand(command: string | null | undefined): boolean {
  if (!command) return false;
  
  const elements = parseCommandToElements(command);
  
  // 何らかの要素が解析できた場合は有効とする
  return elements.length > 0;
}

/**
 * コマンドが純粋にアイコンのみで構成されているかチェック
 * @param command コマンド文字列またはnull/undefined
 * @returns アイコンのみの場合true
 */
export function isIconOnlyCommand(command: string | null | undefined): boolean {
  if (!command) return false;
  
  const elements = parseCommandToElements(command);
  
  // 全ての要素がアイコンの場合のみtrue
  return elements.length > 0 && elements.every(el => el.type === 'icon');
}

/**
 * デバッグ用：コマンド解析結果を表示
 * @param command コマンド文字列またはnull/undefined
 */
export function debugCommand(command: string | null | undefined): void {
  console.log(`コマンド解析: "${command}"`);
  const elements = parseCommandToElements(command);
  console.log('要素:', elements);
  
  const textParts = elements.filter(el => el.type === 'text').map(el => el.value);
  const iconParts = elements.filter(el => el.type === 'icon').map(el => el.value);
  
  console.log('文字列部分:', textParts);
  console.log('アイコン部分:', iconParts);
  console.log('有効:', isValidCommand(command));
  console.log('アイコンのみ:', isIconOnlyCommand(command));
}

/**
 * 使用可能なアイコン一覧を取得
 * @returns アイコン名の配列
 */
export function getAvailableIcons(): string[] {
  return [...COMMAND_ICONS];
}

/**
 * 使用可能なエフェクトアイコン一覧を取得
 * @returns エフェクトアイコン名の配列
 */
export function getAvailableEffectIcons(): string[] {
  return [...EFFECT_ICONS];
}

/**
 * コマンドに含まれるアイコンが全て利用可能かチェック
 * @param command コマンド文字列またはnull/undefined
 * @returns 利用不可能なアイコンの配列
 */
export function getUnavailableIcons(command: string | null | undefined): string[] {
  if (!command) return [];
  
  const icons = parseCommandToIcons(command);
  const allIconsLower = COMMAND_ICONS.map(icon => icon.toLowerCase());
  const allIconsUpper = EFFECT_ICONS.map(icon => icon.toUpperCase());
  
  return icons.filter(icon => {
    const iconLower = icon.toLowerCase();
    const iconUpper = icon.toUpperCase();
    return !allIconsLower.includes(iconLower) && !allIconsUpper.includes(iconUpper);
  });
}