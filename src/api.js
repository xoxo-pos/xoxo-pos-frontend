import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
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
