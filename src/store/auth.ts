import Taro from '@tarojs/taro'

export type UserRole = 'captain' | 'manager' | 'player'

export interface AuthUser {
  id: number
  username: string
  displayName: string
  role: UserRole
}

const STORAGE_KEY = 'footballLineUp_auth'

export const ROLE_LABELS: Record<UserRole, string> = {
  captain: '队长',
  manager: '领队',
  player: '队员',
}

export const canEdit = (role: UserRole): boolean => {
  return role === 'captain' || role === 'manager'
}

export const getUser = (): AuthUser | null => {
  try {
    const saved = Taro.getStorageSync(STORAGE_KEY)
    return saved ? JSON.parse(saved) : null
  } catch { return null }
}

export const saveUser = (user: AuthUser) => {
  Taro.setStorageSync(STORAGE_KEY, JSON.stringify(user))
}

export const clearUser = () => {
  Taro.removeStorageSync(STORAGE_KEY)
}
