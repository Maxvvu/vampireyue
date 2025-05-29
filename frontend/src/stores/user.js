import { defineStore } from 'pinia'
import api from '../api'
import router from '../router'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    userInfo: JSON.parse(localStorage.getItem('userInfo')) || null
  }),
  
  getters: {
    isLoggedIn: (state) => !!state.token,
    username: (state) => state.userInfo?.username
  },

  actions: {
    async login(username, password) {
      try {
        const { token, userInfo } = await api.post('/api/login', {
          username,
          password
        })
        
        this.token = token
        this.userInfo = userInfo
        
        localStorage.setItem('token', token)
        localStorage.setItem('userInfo', JSON.stringify(userInfo))
        
        return true
      } catch (error) {
        console.error('Login failed:', error.response?.data?.message || error.message)
        this.token = ''
        this.userInfo = null
        localStorage.removeItem('token')
        localStorage.removeItem('userInfo')
        return false
      }
    },

    async verifyToken() {
      try {
        const { valid, userInfo } = await api.get('/api/verify-token')
        if (valid) {
          this.userInfo = userInfo
          return true
        }
        return false
      } catch (error) {
        this.logout()
        return false
      }
    },

    logout() {
      this.token = ''
      this.userInfo = null
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
      router.push('/login')
    }
  }
}) 