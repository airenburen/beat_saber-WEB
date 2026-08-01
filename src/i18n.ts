// Lightweight i18n: Chinese source strings ARE the keys; English looks up the
// map and falls back to the key, so untranslated strings degrade gracefully.
// Default = system language, overridden by the user's saved choice.
import { ref } from 'vue'

const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('bs_lang') : null
const sys = (typeof navigator !== 'undefined' && navigator.language || 'en').toLowerCase()
export const lang = ref<'zh' | 'en'>((saved as any) || (sys.startsWith('zh') ? 'zh' : 'en'))

export function setLang(l: 'zh' | 'en') {
  lang.value = l
  localStorage.setItem('bs_lang', l)
}

const EN: Record<string, string> = {
  // Menu / detail
  '开始 · PLAY': 'PLAY',
  '进入 VR · ENTER VR': 'ENTER VR',
  '桌面预览 · DESKTOP': 'DESKTOP PREVIEW',
  'DEMO MODE · 自动演示': 'DEMO MODE · AUTOPLAY',
  'NO FAIL · 血量清空不失败但扣 50% 分数': 'NO FAIL · keep playing at 0 HP, −50% score',
  '体感模式 · 摄像头食指控剑': 'HAND TRACKING · webcam finger sabers',
  '画质 GRAPHICS': 'GRAPHICS',
  '高': 'High',
  '中': 'Med',
  '低': 'Low',
  '难度 DIFFICULTY': 'DIFFICULTY',
  'IMPORT · 导入音乐': 'IMPORT AUDIO',
  '删除此谱面 · DELETE': 'DELETE MAP',
  'BEATSAVER · 社区谱面搜索': 'BEATSAVER · BROWSE MAPS',
  'VR UNAVAILABLE': 'VR UNAVAILABLE',
  '读取本地歌曲…': 'Loading local songs…',
  '解析内置歌曲 Reply…': 'Parsing bundled song Reply…',
  '下载内置歌曲 Reply…': 'Downloading bundled song Reply…',
  '首': 'songs',
  // BS overlay
  '搜索 或 输入谱面ID（如 4f454）直接下载...': 'Search, or paste a map ID (e.g. 4f454) to download…',
  '热门': 'Top',
  '最新': 'Latest',
  '榜单热度': 'BL Trending',
  '排位谱': 'BL Ranked',
  '全部': 'All',
  '动漫': 'Anime',
  'V家': 'Vocaloid',
  '流行': 'Pop',
  '电子': 'Electronic',
  '舞曲': 'Dance',
  '摇滚': 'Rock',
  '金属': 'Metal',
  '说唱': 'Hip-hop',
  '古典': 'Classical',
  '一键下载 TOP10': 'Download TOP10',
  '批量下载中…': 'Batch downloading…',
  '加载中…': 'Loading…',
  '加载更多 · MORE': 'LOAD MORE',
  '下载 DOWNLOAD': 'DOWNLOAD',
  '下载中…': 'Downloading…',
  '排队中': 'Queued',
  '✓ 已下载': '✓ Downloaded',
  '下载中': 'Downloading',
  '解析中': 'Parsing',
  '歌手': 'Artists',
  '热门曲目': 'Popular songs',
  '结果 · ': 'Results · ',
  // Results / fail / pause
  '通关！': 'LEVEL CLEARED!',
  '全连击！FULL COMBO': 'FULL COMBO!',
  '纯享演示 · ': 'DEMO · ',
  '完成度': 'Progress',
  '得分': 'Score',
  // VR panels
  '歌曲列表 · SELECT SONG': 'SELECT SONG',
  'BEATSAVER · 社区谱面': 'BEATSAVER · COMMUNITY MAPS',
  'BEATSAVER · 社区谱面搜索下载': 'BEATSAVER · SEARCH & DOWNLOAD',
  '排序 SORT': 'SORT',
  '分类 GENRE': 'GENRE',
  '快捷搜索 QUICK': 'QUICK SEARCH',
  '热门 TOP': 'TOP RATED',
  '最新 NEW': 'LATEST',
  '键盘搜索 · 输入歌名': 'KEYBOARD SEARCH',
  '← 返回歌单': '← BACK TO SONGS',
  '← 返回': '← BACK',
  '空格 SPACE': 'SPACE',
  '删除 DEL': 'DEL',
  '搜索 GO': 'GO',
  '输入歌名 · TYPE TO SEARCH': 'TYPE TO SEARCH',
  '键盘搜索': 'Keyboard',
  '自由输入': 'free text',
  '快捷搜索': 'quick search',
  '加载中 LOADING': 'LOADING',
  '加载失败': 'Load failed',
  '没有结果': 'No results',
  '画质': 'Quality',
  '帧率': 'FPS',
  '无上限': 'Max',
  '原画墙 ⚠开': 'Full walls ⚠ON',
  '原画墙 关': 'Full walls OFF',
  '可能卡顿·下局生效': 'may stutter · next song',
  '删除 DELETE': 'DELETE',
  '谱师': 'Mapper',
  // VR pause/results buttons
  '继续': 'RESUME',
  '重新开始': 'RESTART',
  '选歌菜单': 'SONG MENU',
  '重试': 'RETRY',
  '再来一次': 'RETRY',
  '激光指向下方按钮 · 扣扳机选择  (POINT & TRIGGER)': 'Point the laser at a button and pull the trigger',
  // Hand tracking status
  '摄像头启动中…': 'Starting camera…',
  '已就绪 · 举起双手食指': 'Ready · raise both index fingers',
  '摄像头权限被拒绝': 'Camera permission denied',
  '摄像头启动失败': 'Camera failed to start',
  '模型资源加载失败(存储配置未生效?)': 'Model assets failed to load',
  // Misc
  '源码 · GitHub': 'Source · GitHub',
  '演示视频 · bilibili': 'Demo video · bilibili',
  '分析中…': 'Analyzing…',
  '分析失败': 'Analyze failed',
}

export function t(s: string): string {
  return lang.value === 'zh' ? s : (EN[s] ?? s)
}
