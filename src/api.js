import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://xoxo-pos-backend-production.up.railway.app/api'
  console.log(import.meta.env.VITE_API_URL)
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('xoxo_token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

export const money = (value) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(value || 0)

export const user = () => {
  try {
    return JSON.parse(localStorage.getItem('xoxo_user')) || {}
  } catch {
    return {}
  }
}
