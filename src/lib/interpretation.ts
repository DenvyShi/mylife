/**
 * 易經解讀共享函數
 * 
 * 被 page.tsx 和 r/[encoded]/page.tsx 共用
 */

// ============================================================
// 基礎常數
// ============================================================

export const TRIGRAM_WUXING: Record<string, string> = {
  '乾': '金', '兌': '金',
  '坤': '土', '艮': '土',
  '震': '木', '巽': '木',
  '離': '火', '坎': '水',
};

// 傳統吉凶卦象分類（民間常用分類，非學術定論）
const AUSPICIOUS_IDS = new Set([
  1, 3, 5, 8, 14, 15, 16, 18, 24, 26, 27, 29, 30, 33, 35, 37, 38,
  41, 42, 44, 45, 46, 47, 48, 49, 51, 52, 53, 54, 55, 56, 57, 58,
  59, 60, 61, 62, 63, 64
]);

const INAUSPICIOUS_IDS = new Set([
  2, 4, 7, 20, 21, 22, 23, 25, 28, 31, 32, 34, 36, 39, 40, 43, 50
]);

// Hexagram base auspiciousness score (0-100)
// 80-100: 大吉/大順  |  60-79: 吉  |  40-59: 平  |  20-39: 凶  |  0-19: 大凶
const HEXAGRAM_BASE_SCORE: Record<number, number> = {
  1: 95,   // 乾 — 純陽至健，諸事旺盛
  2: 50,   // 坤 — 柔順包容，厚德載物（中性偏吉）
  3: 55,   // 屯 — 艱難初始，先難後易
  4: 40,   // 蒙 — 蒙昧不明，需啟發
  5: 75,   // 需 — 耐心等待，雲上於天
  6: 35,   // 讼 — 爭訴訟是非，口舌是非
  7: 50,   // 師 — 兵師興動，領袖才能（中性）
  8: 65,   // 比 — 親密輔助，水地比親
  9: 70,   // 小畜 — 小有積蓄，積少成多
  10: 60,  // 履 — 小心履虎尾，謹慎行事
  11: 90,  // 泰 — 天地交泰，諸事通暢
  12: 20,  // 否 — 天地不交，諸事阻塞
  13: 60,  // 同人 — 天下大同，志同道合
  14: 88,  // 大有 — 火在天上，諸事大有所獲
  15: 72,  // 謙 — 地中有山，謙遜納福
  16: 70,  // 豫 — 雷出地奋，豫悅和樂
  17: 55,  // 隨 — 澤中有雷，隨時而動
  18: 65,  // 蠱 — 山風蠱壞，整治革新
  19: 72,  // 臨 — 澤上有地，臨民治事
  20: 45,  // 觀 — 風地觀光，上看下效
  21: 30,  // 噬嗑 — 火雷噬嗑，刑罰是非
  22: 40,  // 賁 — 山火賁飾，外美內虛
  23: 15,  // 剝 — 山附於地，諸事剝落
  24: 65,  // 復 — 地雷復，七日來復
  25: 55,  // 無妄 — 天雷無妄，無妄而得
  26: 75,  // 大畜 — 山天大畜，積蓄德學
  27: 45,  // 頤 — 山雷頤，養生頤養
  28: 25,  // 大過 — 澤滅木，大過人擔
  29: 50,  // 坎 — 坎為水，陷險重重
  30: 55,  // 離 — 離為火，美麗光明
  31: 50,  // 咸 — 澤山咸，感應交心
  32: 55,  // 恆 — 雷風恆，永恆持久
  33: 65,  // 遯 — 天山遯，隱退待時
  34: 35,  // 大壯 — 雷天大壯，強盛而止
  35: 65,  // 晉 — 火地晉，前途光明
  36: 20,  // 明夷 — 日入地中，明而受傷
  37: 80,  // 家人 — 風火家人，家庭和睦
  38: 60,  // 睽 — 火澤睽，乖離分散
  39: 55,  // 蹇 — 水山蹇，艱難險阻
  40: 50,  // 解 — 雷水解，解除困難
  41: 70,  // 損 — 山澤損，損己利人
  42: 80,  // 益 — 風雷益，益己利人
  43: 45,  // 夬 — 澤天夬，果斷決策
  44: 35,  // 姤 — 天風姤，機緣相遇
  45: 65,  // 萃 — 澤地萃，薈萃聚集
  46: 70,  // 升 — 地風升，步步高升
  47: 45,  // 困 — 澤水困，窮困磨練
  48: 70,  // 井 — 水風井，養人利物
  49: 75,  // 革 — 澤火革，改革創新
  50: 25,  // 鼎 — 火風鼎，鼎新除舊
  51: 50,  // 震 — 震為雷，沉著應對
  52: 55,  // 艮 — 艮為山，適時停止
  53: 70,  // 漸 — 風山漸，逐步進展
  54: 60,  // 歸妹 — 雷澤歸妹，感情歸宿
  55: 65,  // 豐 — 雷火豐，豐盛繁茂
  56: 45,  // 旅 — 火山旅，異地羈旅
  57: 60,  // 巽 — 巽為風，柔順謙遜
  58: 55,  // 兌 — 兌為澤，喜悅和諧
  59: 55,  // 渙 — 風水渙，渙散分離
  60: 55,  // 節 — 水澤節，節制有度
  61: 80,  // 中孚 — 風澤中孚，誠信待人
  62: 45,  // 小過 — 雷山小過，小有过失
  63: 75,  // 既濟 — 水火既濟，事已成定
  64: 50,  // 未濟 — 火水未濟，事未成功
};

function getScoreLabel(score: number): string {
  if (score >= 90) return '大吉';
  if (score >= 75) return '中吉';
  if (score >= 60) return '小吉';
  if (score >= 45) return '平';
  if (score >= 30) return '小凶';
  if (score >= 15) return '中凶';
  return '大凶';
}

// ============================================================
// 五行計算
// ============================================================

export function computeWuxing(above: string, below: string): Record<string, number> {
  const aboveEl = TRIGRAM_WUXING[above] || '土';
  const belowEl = TRIGRAM_WUXING[below] || '土';
  const result: Record<string, number> = { 金: 0, 木: 0, 水: 0, 火: 0, 土: 0 };
  result[aboveEl] += 1;
  result[belowEl] += 1;
  // 陰陽調整
  const yinTrigrams = ['坤', '坎', '艮', '巽', '離'];
  const aboveYin = yinTrigrams.includes(above);
  const belowYin = yinTrigrams.includes(below);
  if (aboveYin) result[aboveEl] -= 0.5;
  else result[aboveEl] += 0.5;
  if (belowYin) result[belowEl] -= 0.5;
  else result[belowEl] += 0.5;
  return result;
}

// ============================================================
// 整體吉凶判斷
// ============================================================

export interface FortuneResult {
  rating: string;    // 吉 / 凶 / 平 / 吉帶變 / 凶帶變 / 平帶變 / 大變動
  emoji: string;      // 視覺符號
  color: string;      // CSS color
  summary: string;    // 簡述
  advice: string;     // 建議
  score: number;       // 0-100 吉凶評分
  scoreLabel: string;  // 評語標籤
}

export function assessFortune(hexagramId: number, changingCount: number): FortuneResult {
  const baseScore = HEXAGRAM_BASE_SCORE[hexagramId] ?? 50;
  const isAuspicious = AUSPICIOUS_IDS.has(hexagramId);
  const isInauspicious = INAUSPICIOUS_IDS.has(hexagramId);

  // 動爻越多，最終分數越趨向中性（50）
  // 完全不動：分數 = 基礎分 × (1 + 0.1×變化修正)
  // 6個動爻：分數直接趨向50（最大不確定性）
  const stabilityFactor = Math.max(0.1, 1 - changingCount * 0.15);
  const score = Math.round(baseScore * stabilityFactor + 50 * (1 - stabilityFactor));

  if (changingCount === 0) {
    if (isAuspicious) {
      return {
        rating: '吉', emoji: '✔', color: '#22C55E',
        summary: '此卦顯示事情發展順遂，無需過多變數，保持現狀即可達成目標。',
        advice: '穩定行事，因勢利導，吉無不利。',
        score,
        scoreLabel: getScoreLabel(score),
      };
    }
    if (isInauspicious) {
      return {
        rating: '凶', emoji: '✘', color: '#EF4444',
        summary: '此卦顯示阻力較大，若強行推進恐有不利之事發生。',
        advice: '審時度勢，不宜妄動，宜守不宜攻。',
        score,
        scoreLabel: getScoreLabel(score),
      };
    }
    return {
      rating: '平', emoji: '○', color: '#C9A227',
      summary: '此卦顯示事情處於中性狀態，結果好壞取決於人的作為。',
      advice: '謹慎行事，順其自然，結果未定。',
      score,
      scoreLabel: getScoreLabel(score),
    };
  }

  if (changingCount <= 2) {
    if (isAuspicious) {
      return {
        rating: '吉帶變', emoji: '◑', color: '#F59E0B',
        summary: '此卦本吉，但有變數在其中。變化之中需謹慎把握，方能趨吉避凶。',
        advice: '把握時機，順勢而為，雖有波折但終歸吉利。',
        score,
        scoreLabel: getScoreLabel(score),
      };
    }
    if (isInauspicious) {
      return {
        rating: '凶帶變', emoji: '◐', color: '#F97316',
        summary: '此卦本有隱患，但變化之中孕育轉機。若能及時調整，或可轉凶為吉。',
        advice: '防微杜漸，積極轉變，或可逢凶化吉。',
        score,
        scoreLabel: getScoreLabel(score),
      };
    }
    return {
      rating: '平帶變', emoji: '◔', color: '#C9A227',
      summary: '此卦顯示局勢將有所變化，結果取決於如何應對此變化。',
      advice: '審時度勢，靈活應對，積極求變。',
      score,
      scoreLabel: getScoreLabel(score),
    };
  }

  // 3+ 動爻
  return {
    rating: '大變動', emoji: '⚡', color: '#8B5CF6',
    summary: '此卦顯示將有重大變化，人生或事物將迎來轉折點。變化劇烈，結果未定。',
    advice: '謹言慎行，切忌衝動，把握轉機可致吉利。',
    score,
    scoreLabel: getScoreLabel(score),
  };
}

// ============================================================
// 卦辭解讀
// ============================================================

export function interpretJudgment(judgment: string): string {
  const interpretations: Record<string, string> = {
    '元亨利貞': '「元亨利貞」為《易經》最吉祥的斷語。元者始也，亨者通也，利者適宜也，貞者正而固也。表示此卦諸事順遂，初始即佳，通達無礙，所求有利，且能堅守正道，大吉大利之兆。',
    '大亨': '表示諸事通暢，障礙消除，進展順利。',
    '小亨': '表示有小阻礙，但最終可通達。',
    '不利': '表示此時行事不利，應避免主動出擊。',
    '悔亡': '表示過去的憂悔將消除，局勢好轉。',
    '无咎': '表示沒有大的過失，即使有小問題也能平安度過。',
    '吝': '表示有羞辱、悔恨之事發生，需要謹慎。',
    '厉': '表示有危險，需要小心行事。',
  };

  for (const [key, value] of Object.entries(interpretations)) {
    if (judgment.includes(key)) return value;
  }

  return `此卦顯示萬物變化之理，「${judgment}」暗示當前局勢的特質。宜順應變化，不可強求。`;
}

// ============================================================
// 象辭解讀
// ============================================================

export function interpretImage(image: string): string {
  if (image.includes('自強不息')) {
    return '天道運行，永不停息。此卦象徵積極進取、自強不息之精神。占得此卦者，當效法天道，努力上進，不可懈怠。';
  }
  if (image.includes('厚德載物')) {
    return '大地容納萬物，厚重不偏。此卦象徵寬容忍耐、德性深厚之精神。占得此卦者，當效法大地，包容萬物，修養品德。';
  }
  if (image.includes('獨立')) {
    return '象徵堅強獨立，不依賴他人。占得此卦者，當自強自立，不可依賴僥倖。';
  }
  if (image.includes('順')) {
    return '象徵柔順和諧，隨遇而安。占得此卦者，當順勢而為，不可過於強硬。';
  }
  if (image.includes('動')) {
    return '象徵行動、變化。占得此卦者，萬物萌動之象，有事將起，宜積極行動。';
  }
  if (image.includes('止')) {
    return '象徵停止、靜止。占得此卦者，知止而止之象，局勢到此當止，不宜再進。';
  }
  return '此象顯示天地萬物之理，占得此卦者當順應時勢，效法自然之理。';
}

// ============================================================
// 爻位名稱
// ============================================================

export function getLineLabel(position: number): string {
  if (position === 1) return '初爻';
  if (position === 6) return '上爻';
  return `六${['', '二', '三', '四', '五'][position - 1]}爻`;
}

// ============================================================
// 高亮結論卡片（Phase 1 新增）
// ============================================================

export interface HighlightConclusions {
  represents: string;   // 這一卦代表
  attention: string;    // 你現在較應注意
  suggestion: string;   // 建議方向
}

// 根據卦象屬性生成三句白話結論
function getHexagramTrait(hexagramId: number): string {
  const traits: Record<number, string> = {
    1: '目前形勢不錯，行動力強。',
    2: '適合低調行事，不要強出頭。',
    3: '萬事起頭難，先慢慢來。',
    4: '還需要更多準備，先學習。',
    5: '運勢不錯，但需要耐心等。',
    6: '目前容易有爭執或口舌。',
    7: '適合當領頭的人，帶領團隊。',
    8: '有人支持你，可以找人商量。',
    9: '有小積蓄，可以慢慢累積。',
    10: '出門做事要小心，穩妥為上。',
    11: '運勢很旺，諸事順利。',
    12: '運勢不暢，遇到阻礙。',
    13: '適合找人合作，志同道合。',
    14: '運勢大旺，大有收穫。',
    15: '低調謙虛，會帶來好運。',
    16: '心情愉快，事情進展順。',
    17: '跟隨時機行動，有人支持。',
    18: '適合整頓、處理積壓問題。',
    19: '形勢不錯，可以積極行動。',
    20: '看清楚再行動，不要急。',
    21: '有是非糾紛，要公平處理。',
    22: '先充實內在，不要只做表面。',
    23: '運勢正在走下坡，要保守。',
    24: '壞事到頭了，開始好轉。',
    25: '不要投機，自然會有收穫。',
    26: '積蓄實力，等待好時機。',
    27: '注意健康，飲食要節制。',
    28: '壓力過大，不要硬撐。',
    29: '陷入困境，要沉著應對。',
    30: '運勢不錯，名聲好轉。',
    31: '感情有感應，單身者有姻緣。',
    32: '事情需要持之以恆。',
    33: '適合隱退或休息。',
    34: '運勢很強，但要適可而止。',
    35: '前途光明，進展順利。',
    36: '運勢受制，行事要低調。',
    37: '家庭和諧，有利遠行。',
    38: '容易有分歧，要多溝通。',
    39: '前路有險阻，要小心前進。',
    40: '困難即將過去，開始好轉。',
    41: '肯付出讓利，反而有收穫。',
    42: '大膽行動，大有利益。',
    43: '事情將有結果，決定果斷。',
    44: '遇到好機會，好好把握。',
    45: '人緣好，有利於聚集人脈。',
    46: '步步高升，運勢上升。',
    47: '目前困頓，但能磨練心志。',
    48: '找對方向做事，有利發展。',
    49: '適合改革創新，轉機出現。',
    50: '內部問題浮現，要有決心。',
    51: '保持警惕，沉著應對變化。',
    52: '局勢明朗，適合暫時休息。',
    53: '按部就班，逐步前進。',
    54: '感情有歸屬，利於婚姻。',
    55: '運勢旺盛，紅紅火火。',
    56: '變動较大，奔波勞碌。',
    57: '運勢上揚，利於服眾。',
    58: '心情愉快，人際關係和諧。',
    59: '運勢渙散，要重新凝聚。',
    60: '凡事要有節制，不能過頭。',
    61: '待人真誠，人緣佳。',
    62: '做小事可成，大事先緩緩。',
    63: '事情已定，大局已明。',
    64: '事情未成，還需努力。',
  };
  return traits[hexagramId] || '目前局勢還在變化中。';
}

// 根據吉凶和變爻數生成"应注意"的內容
function getAttentionTip(rating: string, changingCount: number): string {
  if (changingCount >= 3) {
    return '變數較多，局勢未穩，行動要特別小心。';
  }
  if (changingCount >= 1) {
    return '有變化在發生，注意時機和方向。';
  }
  if (rating === '吉' || rating === '中吉' || rating === '小吉') {
    return '運勢不錯，但不要過度樂觀。';
  }
  if (rating === '凶' || rating === '中凶' || rating === '小凶') {
    return '形勢不太有利，穩守為上。';
  }
  return '形勢沒有明顯好壞，靜觀其變。';
}

// 根據吉凶和變爻數生成"建議方向"
function getSuggestion(rating: string, changingCount: number, advice: string): string {
  if (changingCount >= 3) {
    return '先等形勢明朗，再決定下一步行動。';
  }
  if (changingCount >= 1) {
    return '順應變化，靈活調整計劃。';
  }
  if (rating === '吉' || rating === '中吉' || rating === '小吉') {
    return '把握時機，可以積極行動。';
  }
  if (rating === '凶' || rating === '中凶' || rating === '小凶') {
    return '保守行事，不宜大動作。';
  }
  return '先整理現況，再決定是否推進。';
}

export function generateHighlightConclusions(
  hexagramId: number,
  hexagramName: string,
  rating: string,
  summary: string,
  advice: string,
  changingCount: number
): HighlightConclusions {
  return {
    represents: getHexagramTrait(hexagramId),
    attention: getAttentionTip(rating, changingCount),
    suggestion: getSuggestion(rating, changingCount, advice),
  };
}

// ============================================================
// 四段式白話解讀（Phase 1 新增）
// ============================================================

export interface PlainInterpretation {
  overall: string;      // 整體來看
  reminder: string;     // 對這件事的提醒
  actionAdvice: string; // 如果你正準備行動
  watchAdvice: string;  // 如果你仍在觀望
}

function getOverallStatement(hexagramId: number, rating: string, fortune: string): string {
  const overallMap: Record<string, string> = {
    '吉': '目前運勢不錯，事情朝好的方向發展。',
    '中吉': '運勢還可以，穩步推進會有收穫。',
    '小吉': '有些小利，慢慢來會有成果。',
    '平': '局勢沒有明顯好壞，成敗看自己作為。',
    '小凶': '形勢不太配合，要多花心力應對。',
    '中凶': '阻礙明顯，行事要特別小心。',
    '大凶': '運勢極差，強行行動恐有不利。',
  };
  return overallMap[rating] || '局勢還在變化中，需要耐心觀察。';
}

function getReminder(hexagramId: number, rating: string, changingCount: number): string {
  if (changingCount >= 3) {
    return '局勢變化大，別急著做決定，先看清楚再行動。';
  }
  if (changingCount >= 1) {
    return '有變化在醞釀，時機和方向是關鍵。';
  }
  if (rating.includes('吉')) {
    return '運勢好的时候更要看清方向，不要錯過機會。';
  }
  if (rating.includes('凶')) {
    return '形勢不利時，耐心等待比盲目行動更聰明。';
  }
  return '不確定的時候，先收集更多訊息再說。';
}

function getActionAdvice(hexagramId: number, rating: string, changingCount: number): string {
  if (changingCount >= 3) {
    return '先做準備功課，例如整理資料、評估風險，再決定是否行動。';
  }
  if (changingCount >= 1) {
    return '行動可以，但要留意變化，準備好備案。';
  }
  if (rating.includes('吉')) {
    return '現在是行動的好時機，積極一點會有收穫。';
  }
  if (rating.includes('凶')) {
    return '如果可以延後行動，就先等一等。如果不能拖，就先處理最確定的部分。';
  }
  return '先列出行動的選項，選風險最小的先做。';
}

function getWatchAdvice(hexagramId: number, rating: string, changingCount: number): string {
  if (changingCount >= 3) {
    return '靜觀其變是明智的選擇，等局勢明朗再出手。';
  }
  if (changingCount >= 1) {
    return '持續留意身邊的變化，捕捉時機的信號。';
  }
  if (rating.includes('吉')) {
    return '運勢好的時候繼續觀察，等最佳時機再出手。';
  }
  if (rating.includes('凶')) {
    return '繼續等待，不要被焦慮推著走，注意形勢何時好轉。';
  }
  return '保持現狀，繼續留意相關資訊，等待訊號。';
}

export function generatePlainInterpretation(
  hexagramId: number,
  hexagramName: string,
  rating: string,
  fortune: string,
  changingCount: number
): PlainInterpretation {
  return {
    overall: getOverallStatement(hexagramId, rating, fortune),
    reminder: getReminder(hexagramId, rating, changingCount),
    actionAdvice: getActionAdvice(hexagramId, rating, changingCount),
    watchAdvice: getWatchAdvice(hexagramId, rating, changingCount),
  };
}
