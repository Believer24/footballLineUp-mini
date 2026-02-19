import Taro from '@tarojs/taro'

// 改成你的后端地址（部署后改成公网HTTPS地址）
const API_BASE = 'http://localhost:4000/api'

const request = async (url: string, options?: Taro.request.Option) => {
  const res = await Taro.request({
    url: `${API_BASE}${url}`,
    header: { 'Content-Type': 'application/json' },
    ...options,
  })
  return res.data
}

export const api = {
  // 登录
  login: (username: string, password: string) =>
    request('/auth/login', { method: 'POST', data: { username, password } }),

  // 比赛
  getMatches: (date?: string) =>
    request(date ? `/matches?date=${date}` : '/matches'),

  getMatch: (id: number) => request(`/matches/${id}`),

  createMatch: (data: any) =>
    request('/matches', { method: 'POST', data }),

  updateMatch: (id: number, data: any) =>
    request(`/matches/${id}`, { method: 'PUT', data }),

  deleteMatch: (id: number) =>
    request(`/matches/${id}`, { method: 'DELETE' }),

  // 球员
  getPlayers: () => request('/players'),

  addPlayer: (data: any) =>
    request('/players', { method: 'POST', data }),

  deletePlayer: (id: number) =>
    request(`/players/${id}`, { method: 'DELETE' }),

  // 批量操作
  importPlayers: (matchId: number, players: any[]) =>
    request(`/matches/${matchId}/import-players`, { method: 'POST', data: { players } }),

  batchSaveStats: (matchId: number, data: any) =>
    request(`/matches/${matchId}/batch-stats`, { method: 'POST', data }),

  // 排行榜
  getLeaderboard: () => request('/stats/leaderboard'),

  // 地理编码
  geocode: (address: string) => request(`/geocode?address=${encodeURIComponent(address)}`),
}
