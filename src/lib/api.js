const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()

const rawApiBaseUrl = configuredApiBaseUrl || (import.meta.env.DEV ? 'http://127.0.0.1:8001' : '')

export const API_BASE_URL = rawApiBaseUrl.replace(/\/$/, '')

export function buildApiUrl(path = '') {
  if (!API_BASE_URL) {
    throw new Error('前端没有配置后端地址。请在 Vercel 环境变量中设置 VITE_API_BASE_URL，例如 https://你的后端.onrender.com')
  }

  if (!path) return API_BASE_URL
  if (/^https?:\/\//i.test(path)) return path
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE_URL}${normalizedPath}`
}
