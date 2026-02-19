import { useState, useEffect } from 'react'
import { View, Text, Picker } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { api } from '../../services/api'
import { getUser, canEdit, clearUser, ROLE_LABELS } from '../../store/auth'
import './index.scss'

const statusLabels = { upcoming: '未开始', ongoing: '进行中', completed: '已结束' }
const statusClass = { upcoming: 'chip-primary', ongoing: 'chip-warning', completed: 'chip-success' }

export default function Matches() {
  const [matches, setMatches] = useState<any[]>([])
  const [filterDate, setFilterDate] = useState('')
  const [error, setError] = useState('')
  const [user, setUser] = useState(getUser())

  const loadMatches = async (date?: string) => {
    try {
      const data = await api.getMatches(date)
      setMatches(Array.isArray(data) ? data : [])
      setError('')
    } catch { setError('无法连接服务器') }
  }

  useDidShow(() => {
    const currentUser = getUser()
    setUser(currentUser)
    if (!currentUser) {
      Taro.reLaunch({ url: '/pages/login/index' })
      return
    }
    loadMatches()
  })

  const handleViewTactics = (matchId: number) => {
    Taro.navigateTo({ url: `/pages/tactics/index?matchId=${matchId}` })
  }

  const handleDelete = (id: number) => {
    Taro.showModal({
      title: '提示',
      content: '确定删除这场比赛？',
      success: async (res) => {
        if (res.confirm) {
          await api.deleteMatch(id)
          loadMatches(filterDate || undefined)
        }
      }
    })
  }

  const handleLogout = () => {
    clearUser()
    Taro.reLaunch({ url: '/pages/login/index' })
  }

  const handleLocationClick = async (location: string, latitude?: number, longitude?: number) => {
    let lat = latitude
    let lng = longitude
    
    if (!lat || !lng) {
      try {
        const result = await api.geocode(location)
        if (result && result.lat && result.lng) {
          lat = result.lat
          lng = result.lng
        }
      } catch {}
    }

    if (lat && lng) {
      Taro.openLocation({
        latitude: lat,
        longitude: lng,
        name: location,
        address: location,
      })
    } else {
      Taro.showToast({ title: '无法定位该地址', icon: 'none' })
    }
  }

  const editable = user ? canEdit(user.role) : false

  return (
    <View className='container'>
      {/* 用户信息 */}
      <View className='user-bar'>
        <Text className='user-name'>{user?.displayName} ({user ? ROLE_LABELS[user.role] : ''})</Text>
        <Text className='logout-btn' onClick={handleLogout}>退出</Text>
      </View>

      <View className='flex-between mb-20'>
        <Text style={{ fontSize: '36px', fontWeight: 'bold' }}>⚽ 比赛列表</Text>
      </View>

      {/* 日期筛选 */}
      <View className='filter-bar'>
        <Picker mode='date' onChange={(e) => { setFilterDate(e.detail.value); loadMatches(e.detail.value) }}>
          <View className='btn-outline' style={{ fontSize: '24px', padding: '12px 20px' }}>
            {filterDate || '选择日期筛选'}
          </View>
        </Picker>
        {filterDate && (
          <Text className='clear-btn' onClick={() => { setFilterDate(''); loadMatches() }}>清除</Text>
        )}
      </View>

      {error && <View className='error-msg'>{error}</View>}

      {matches.length === 0 ? (
        <View className='card text-center'>
          <Text className='text-secondary'>暂无比赛记录</Text>
        </View>
      ) : (
        matches.map((match) => (
          <View className='card' key={match.id}>
            <View className='flex-between'>
              <Text style={{ fontSize: '26px', fontWeight: 'bold', color: '#fff' }}>
                {match.match_date?.split('T')[0]}
                {match.match_time && ` ${match.match_time.slice(0, 5)}`}
              </Text>
            </View>

            <View className='flex-row gap-10 mt-10'>
              <Text className='chip chip-primary'>{match.format}</Text>
              <Text className={`chip ${statusClass[match.status]}`}>{statusLabels[match.status]}</Text>
              <Text className='chip chip-info'>{match.formation || '未设置'}</Text>
            </View>

            <View style={{ marginTop: '12px' }}>
              <Text style={{ fontSize: '24px', color: '#ff9800', fontWeight: '500' }}>
                报名人数：{match.registered_count || 0}人
              </Text>
            </View>

            {match.location && (
              <View style={{ marginTop: '8px' }} onClick={() => handleLocationClick(match.location, match.latitude, match.longitude)}>
                <Text className='text-secondary location-text' style={{ fontSize: '22px', display: 'block' }}>
                  📍 {match.location}
                </Text>
              </View>
            )}

            {match.status === 'completed' && (
              <Text style={{ fontSize: '32px', fontWeight: 'bold', color: '#fff', marginTop: '8px', display: 'block' }}>
                {match.home_score} - {match.away_score}
              </Text>
            )}

            <View className='match-actions'>
              <Text className='action-btn' onClick={() => handleViewTactics(match.id)}>{editable ? '修改阵型' : '查看阵容'}</Text>
              {editable && (
                <Text className='action-btn stats-btn' onClick={() => Taro.navigateTo({ url: '/pages/stats/index?matchId=' + match.id })}>统计</Text>
              )}
              {editable && (
                <Text className='delete-btn' style={{ fontSize: '36px', color: '#ef5350', fontWeight: 'bold', lineHeight: '1' }} onClick={() => handleDelete(match.id)}>✕</Text>
              )}
            </View>
          </View>
        ))
      )}
    </View>
  )
}
