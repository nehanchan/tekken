// コマンドアイコンのマッピング定義
const COMMAND_ICONS = [
  'ah', 'all', 'ba', 'bc', 'bj', 'cm', 'cr', 'dk', 'ei', 'FB',
  'fc', 'fj', 'fo', 'GV', 'HO', 'HT', 'ij', 'ju', 'KS', 'lk',
  'lp', 'nb', 'ng', 'nh', 'nt', 'nv', 'PC', 'qy', 'rk', 'rp',
  'TR', 'uk', 'WB', 'wk', 'wl', 'wp', 'wr', 'wu', 'xn', 'zb'
];

/**
 * コマンド文字列をアイコン配列に変換する
 * @param command コマンド文字列（例: "fontcrfcrp"）またはnull/undefined
 * @returns アイコンファイル名の配列（例: ["fo", "nt", "cr", "fc", "rp"]）
 */
export function parseCommandToIcons(command: string | null | undefined): string[] {
  if (!command || typeof command !== 'string') {
    return [];
  }

  const icons: string[] = [];
  let i = 0;

  while (i < command.length) {
    let matched = false;
    
    // 長いアイコン名から順に検索（3文字 -> 2文字）
    for (const iconLength of [3, 2]) {
      if (i + iconLength <= command.length) {
        const substring = command.substring(i, i + iconLength);
        
        if (COMMAND_ICONS.includes(substring)) {
          icons.push(substring);
          i += iconLength;
          matched = true;
          break;
        }
      }
    }
    
    // マッチしなかった場合は1文字スキップ
    if (!matched) {
      console.warn(`コマンド解析: 不明な文字 "${command[i]}" at position ${i} in "${command}"`);
      i++;
    }
  }

  return icons;
}

/**
 * アイコンファイルのパスを取得
 * @param iconName アイコン名
 * @returns アイコンファイルのパス
 */
export function getIconPath(iconName: string): string {
  return `/command-icons/${iconName}.png`;
}

/**
 * コマンド文字列が有効かどうかチェック
 * @param command コマンド文字列またはnull/undefined
 * @returns 有効な場合true
 */
export function isValidCommand(command: string | null | undefined): boolean {
  if (!command) return false;
  
  const icons = parseCommandToIcons(command);
  const reconstructed = icons.join('');
  
  // 完全に解析できた場合のみ有効とする
  return reconstructed === command;
}

/**
 * デバッグ用：コマンド解析結果を表示
 * @param command コマンド文字列またはnull/undefined
 */
export function debugCommand(command: string | null | undefined): void {
  console.log(`コマンド解析: "${command}"`);
  const icons = parseCommandToIcons(command);
  console.log('アイコン:', icons);
  console.log('再構築:', icons.join(''));
  console.log('有効:', isValidCommand(command));
}