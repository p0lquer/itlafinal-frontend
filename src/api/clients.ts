import axios from 'axios'

const client = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api',
    headers: { 'Content-Type': 'application/json' },
})

// Interceptor — agrega el token JWT automáticamente
// en cada request si existe en localStorage
client.interceptors.request.use((config) => {
    const token = localStorage.getItem('token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// Interceptor — si el token expiró o el backend rechaza la petición,
// no redirigimos automáticamente a login para no romper la vista del dashboard.
client.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            const requestUrl = error.config?.url ?? ''
            const isAuthEndpoint = /\/auth\/(login|register|me)/.test(requestUrl)

            if (!isAuthEndpoint) {
                localStorage.removeItem('token')
                localStorage.removeItem('user')
                window.dispatchEvent(new Event('auth:unauthorized'))
            }
        }
        return Promise.reject(error)
    }
)

export default client
