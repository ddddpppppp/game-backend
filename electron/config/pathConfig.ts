import path, { join } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

export const __dirname = path.dirname(fileURLToPath(import.meta.url))
process.env.APP_ROOT = path.join(__dirname, '../..')

export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')
export const indexHtml = join(RENDERER_DIST, 'index.html')
export const preloadJs = join(__dirname, '../preload/index.mjs')
export const url = `${process.env.VITE_DEV_SERVER_URL}`
