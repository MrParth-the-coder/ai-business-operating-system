import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

export function getAccessToken() {
  return localStorage.getItem('access')
}

export function setTokens(tokens) {
  localStorage.setItem('access', tokens.access)
  localStorage.setItem('refresh', tokens.refresh)
}

export function clearTokens() {
  localStorage.removeItem('access')
  localStorage.removeItem('refresh')
}

export async function logout() {
  const token = localStorage.getItem('access')
  try {
    await axios.post(`${API_BASE}/auth/logout/`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    })
  } catch (err) {
    // ignore logout errors
  }
}

const client = axios.create({ baseURL: API_BASE })

client.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const refresh = localStorage.getItem('refresh')
      if (!refresh) return Promise.reject(error)
      try {
        const { data } = await axios.post(`${API_BASE}/auth/refresh/`, { refresh })
        localStorage.setItem('access', data.access)
        original.headers.Authorization = `Bearer ${data.access}`
        return client(original)
      } catch {
        clearTokens()
      }
    }
    return Promise.reject(error)
  },
)

export default client
