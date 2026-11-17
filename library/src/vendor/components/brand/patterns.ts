/**
 * Yuyu dot sign patterns, read from the Figma "Brand — Dot sign" components
 * (file oVuNh4VRXQ9fIpdnUCoZqt, page 111:292). Rows are separated by "|".
 *
 *   X  marigold (lit dot)          O  ink base dot / ink detail
 *   .  soft (unlit) dot            D  deep marigold
 *   W  white                       m  soft dot on marigold
 *   (space) no dot
 */

/** The mark: a Y on a 5×5 grid; six marigold dots and one ink base dot, the host. */
export const MARK = "X...X|.X.X.|..X..|..X..|..O..";
/** Under 48px: bright dots only. */
export const MARK_BRIGHT = "X   X| X X |  X  |  X  |  O  ";
/** On marigold backgrounds: an ink Y, soft dots in a deeper marigold, a white host. */
export const MARK_ON_MARIGOLD = "OmmmO|mOmOm|mmOmm|mmOmm|mmWmm";

/** "YUYU" spelled in dots, for posters, merch and stage screens (not UI headers). */
export const DOT_WORDMARK = [
  "X   X O   O X   X O   O",
  " X X  O   O  X X  O   O",
  "  X   O   O   X   O   O",
  "  X   O   O   X   O   O",
  "  X    OOO    X    OOO ",
].join("|");

export const FACE_MOODS = ["happy", "cheering", "wink", "love", "done", "waiting", "surprised", "thinking", "sleepy", "sad"] as const;
export type DotFaceMood = (typeof FACE_MOODS)[number];

/** Dot faces on a 7×7 grid. */
export const FACES: Record<DotFaceMood, string> = {
  happy: " XXXXX |XXXXXXX|XOXXXOX|XXXXXXX|XOXXXOX|XXOOOXX| XXXXX ",
  cheering: " XXXXX |XOXXXOX|OXOXOXO|XXXXXXX|XOOOOOX|XXOOOXX| XXXXX ",
  wink: " XXXXX |XXXXXXX|XOXXOOX|XXXXXXX|XOXXXOX|XXOOOXX| XXXXX ",
  love: " XX XX |XXXXXXX|XXXXXXX|XXXXXXX| XXXXX |  XXX  |   X   ",
  done: " XXXXX |XXXXXXX|XXXXXOX|XXXXOXX|XOXOXXX|XXOXXXX| XXXXX ",
  waiting: " XXXXX |XXXOXXX|XXXOXXX|XXXOOXX|XXXXXXX|XXXXXXX| XXXXX ",
  surprised: " XXXXX |XXXXXXX|XOXXXOX|XXXXXXX|XXXOXXX|XXOXOXX| XXOXX ",
  thinking: " XXXXX |XXOXXOX|XXXXXXX|XXXXXXX|XXXOOOX|XXXXXXX| XXXXX ",
  sleepy: " XXXXX |XXXXXXX|XOOXOOX|XXXXXXX|XXXXXXX|XXXOXXX| XXXXX ",
  sad: " XXXXX |XXXXXXX|XOXXXOX|XXXXXXX|XXOOOXX|XOXXXOX| XXXXX ",
};

export const ICON_NAMES = ["date", "venue", "guests", "time", "speaker", "check-in", "feedback", "certificate", "reminder", "done", "page", "lock", "code"] as const;
export type DotIconName = (typeof ICON_NAMES)[number];

/** Product spot icons on a 7×7 grid: ink dots follow the theme, marigold marks the highlight. */
export const ICONS: Record<DotIconName, string> = {
  date: " O   O |XXXXXXX|O     O|O O O O|O     O|O O X O|OOOOOOO",
  venue: "  OOO  | O   O | O X O | O   O |  O O  |   O   |       ",
  guests: "       | O X O |       |OOXXXOO|OOXXXOO|       |       ",
  time: " OOOOO |O  X  O|O  X  O|O  XX O|O     O|O     O| OOOOO ",
  speaker: "  OOO  |  OXO  |  OXO  |  OOO  | O   O |  OOO  |   O   ",
  "check-in": "OOO OOO|O O O O|OOO OOO|       |OOO X X|O O  X |OOO X X",
  feedback: "   X   |   X   |XXXXXXX| XXXXX |  XXX  | XX XX | X   X ",
  certificate: "  OOO  | O X O | OXXXO | O X O |  OOO  |  O O  | O   O ",
  reminder: "   O   |  OOO  | O   O | O   O | O   O |OOOOOOO|   X   ",
  done: "       |      X|     X |X   X  | X X   |  X    |       ",
  page: "OOOOOOO|O X X O|OOOOOOO|O     O|O XXX O|O     O|OOOOOOO",
  lock: "  OOO  | O   O | O   O |OOOOOOO|OOOXOOO|OOOXOOO|OOOOOOO",
  code: "       | O   O |O  X  O|O  X  O|O  X  O| O   O |       ",
};

/** Split a pattern into equal-width rows of cells. */
export function parsePattern(pattern: string): string[][] {
  const rows = pattern.split("|");
  const width = Math.max(...rows.map((row) => row.length));
  return rows.map((row) => row.padEnd(width, " ").split(""));
}
