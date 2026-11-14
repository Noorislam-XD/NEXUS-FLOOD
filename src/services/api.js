import { supabase } from '../lib/supabase.js'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

class ApiClient {
  constructor() {
    this.baseUrl = API_BASE
  }

  async getAuthHeader() {
    try {
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.access_token) {
          return { 'Authorization': `Bearer ${session.access_token}` }
        }
      }
    } catch (e) {
      // No auth session
    }
    return {}
  }

  async request(method, path, body = null, isFormData = false) {
    const url = `${this.baseUrl}${path}`
    const authHeader = await this.getAuthHeader()
    const headers = isFormData 
      ? { ...authHeader }
      : { 'Content-Type': 'application/json', ...authHeader }

    const config = { method, headers }
    if (body) {
      config.body = isFormData ? body : JSON.stringify(body)
    }

    const response = await fetch(url, config)
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }))
      throw new Error(error.message || `HTTP ${response.status}`)
    }

    return response.json()
  }

  get(path) { return this.request('GET', path) }
  post(path, body, isFormData = false) { return this.request('POST', path, body, isFormData) }
  patch(path, body) { return this.request('PATCH', path, body) }
  delete(path) { return this.request('DELETE', path) }
}

export const api = new ApiClient()
