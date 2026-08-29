// 把 dist/ 同步到 android/app/src/main/assets/www/
// 用法：node scripts/sync-android-assets.mjs
import { cpSync, rmSync, mkdirSync, existsSync, readdirSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const src = resolve(root, 'dist')
const dest = resolve(root, 'android/app/src/main/assets/www')

if (!existsSync(src)) {
  console.error('dist/ 不存在，请先执行 npm run build')
  process.exit(1)
}

// Windows 下直接 rm 目录本身偶尔会 EPERM，改为逐项清空并容错（保留 .gitignore）
mkdirSync(dest, { recursive: true })
for (const entry of readdirSync(dest)) {
  if (entry === '.gitignore') continue
  try {
    rmSync(join(dest, entry), { recursive: true, force: true })
  } catch (e) {
    console.warn(`跳过无法删除的文件: ${entry}`)
  }
}
cpSync(src, dest, { recursive: true })

console.log(`已同步 dist/ -> ${dest.replace(root, '')}`)
