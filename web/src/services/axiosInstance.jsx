import axios from 'axios'
import { jwtDecode } from 'jwt-decode'

// Base URL and API Keys from environment variables
const BASE_URL = import.meta.env.VITE_API_GATEWAY_URL || 'https://localhost:7777/r/komunas-app'
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 300000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
})

// Request interceptor for Bearer token injection
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('komunas_token')

    if (token) {
      try {
        const decoded = jwtDecode(token)
        const currentTime = Date.now() / 1000

        if (decoded.exp < currentTime) {
          console.warn('Token expired, clearing session')
          localStorage.removeItem('komunas_token')
          localStorage.removeItem('komunas_user')
          return config
        }

        config.headers.Authorization = `Bearer ${token}`
      } catch (error) {
        console.error('Invalid token format:', error)
        localStorage.removeItem('komunas_token')
        localStorage.removeItem('komunas_user')
      }
    }

    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor for global error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('Unauthorized access - redirecting to login')

      const isRegistrationPage = window.location.pathname.includes('/register')
      const isRegistrationApi = error.config?.url?.includes('/auth/register')

      if (!isRegistrationPage && !isRegistrationApi) {
        localStorage.removeItem('komunas_token')
        localStorage.removeItem('komunas_user')
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
      }
    } else if (error.response?.status === 403) {
      console.warn('Access denied for this resource (403). Session preserved.')
    }
    return Promise.reject(error)
  }
)

export default axiosInstance
