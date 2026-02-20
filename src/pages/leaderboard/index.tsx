import { useState } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { api } from '../../services/api'
import { getUser } from '../../store/auth'
import './index.scss'

const MEDALS = ['🥇', '🥈', '🥉']

export default function Leaderboard() {
  const [players, setPlayers] = useState<any[]>([])
  const [tab, setTab] = useState(0)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useDidShow(() => {
    const user = getUser()
    if (!user) {
      Taro.reLaunch({ url: '/pages/login/index' })
      return
    }
    setLoading(true)
    api.getLeaderboard()
      .then((data) => { 
        console.log('Leaderboard data:', data)
        setPlayers(Array.isArray(data) ? data : [])
        setError('') 
      })
      .catch((err) => { 
        console.error('Leaderboard error:', err)
        setError('无法加载数据') 
      })
      .finally(() => setLoading(false))
  })

  const goalRanking = [...players].sort((a, b) => (b.total_goals || 0) - (a.total_goals || 0))
  const assistRanking = [...players].sort((a, b) => (b.total_assists || 0) - (a.total_assists || 0))
  const interceptRanking = [...players].sort((a, b) => (b.total_interceptions || 0) - (a.total_interceptions || 0))

  const tabs = ['⚽ 射手榜', '🤝 助攻榜', '🛡️ 拦截榜', '⭐ 综合数据']

  const renderPodium = (ranking: any[], getValue: (p: any) => number, unit: string, color: string) => {
    const top3 = ranking.slice(0, 3).filter(p => getValue(p) > 0)
    if (top3.length === 0) return null
    return (
      <View className='podium'>
        {top3.map((p, i) => (
          <View className={`podium-card podium-${i}`} key={p.id}>
            <Text className='podium-medal'>{MEDALS[i]}</Text>
            <Text className='podium-name'>{p.name}</Text>
            <Text className='podium-pos'>{p.preferred_position}</Text>
            <Text className='podium-value' style={{ color }}>{getValue(p)}</Text>
            <Text className='podium-unit'>{unit}</Text>
          </View>
        ))}
      </View>
    )
  }

  const renderRankList = (ranking: any[], getValue: (p: any) => number, label: string, color: string) => (
    <View className='rank-list'>
      <View className='rank-header'>
        <Text className='rank-col-num'>排名</Text>
        <Text className='rank-col-name'>球员</Text>
        <Text className='rank-col-pos'>位置</Text>
        <Text className='rank-col-val'>{label}</Text>
        <Text className='rank-col-val'>场次</Text>
        <Text className='rank-col-val'>场均</Text>
      </View>
      {ranking.map((p, i) => {
        const val = getValue(p)
        const matches = p.matches_played || 0
        const avg = matches > 0 ? (val / matches).toFixed(1) : '0.0'
        return (
          <View className={`rank-row ${i < 3 && val > 0 ? 'rank-top' : ''}`} key={p.id}>
            <Text className='rank-col-num' style={{ color: i < 3 && val > 0 ? '#ffd700' : '#999' }}>
              {i < 3 && val > 0 ? MEDALS[i] : `${i + 1}`}
            </Text>
            <Text className='rank-col-name'>{p.name}</Text>
            <Text className='rank-col-pos'>{p.preferred_position}</Text>
            <Text className='rank-col-val' style={{ color, fontWeight: 'bold' }}>{val}</Text>
            <Text className='rank-col-val'>{matches}</Text>
            <Text className='rank-col-val' style={{ color: '#999' }}>{avg}</Text>
          </View>
        )
      })}
    </View>
  )

  const renderOverview = () => (
    <View className='rank-list'>
      <View className='rank-header'>
        <Text className='rank-col-num'>排名</Text>
        <Text className='rank-col-name'>球员</Text>
        <Text className='rank-col-pos'>位置</Text>
        <Text className='rank-col-val-sm'>进球</Text>
        <Text className='rank-col-val-sm'>助攻</Text>
        <Text className='rank-col-val-sm'>拦截</Text>
        <Text className='rank-col-val-sm'>MVP</Text>
        <Text className='rank-col-val-sm'>场次</Text>
      </View>
      {players.map((p, i) => (
        <View className={`rank-row ${i < 3 ? 'rank-top' : ''}`} key={p.id}>
          <Text className='rank-col-num' style={{ color: i < 3 ? '#ffd700' : '#999' }}>
            {i < 3 ? MEDALS[i] : `${i + 1}`}
          </Text>
          <Text className='rank-col-name'>{p.name}</Text>
          <Text className='rank-col-pos'>{p.preferred_position}</Text>
          <Text className='rank-col-val-sm' style={{ color: '#4caf50', fontWeight: 'bold' }}>{p.total_goals || 0}</Text>
          <Text className='rank-col-val-sm' style={{ color: '#2196f3', fontWeight: 'bold' }}>{p.total_assists || 0}</Text>
          <Text className='rank-col-val-sm' style={{ color: '#9c27b0', fontWeight: 'bold' }}>{p.total_interceptions || 0}</Text>
          <Text className='rank-col-val-sm' style={{ color: '#ffd700', fontWeight: 'bold' }}>{p.mvp_count || 0}</Text>
          <Text className='rank-col-val-sm'>{p.matches_played || 0}</Text>
        </View>
      ))}
    </View>
  )

  return (
    <View className='container'>
      <Text className='page-title'>🏆 数据统计与荣誉榜</Text>

      {/* Tabs */}
      <View className='tab-bar'>
        {tabs.map((t, i) => (
          <Text
            key={i}
            className={`tab-item ${tab === i ? 'tab-active' : ''}`}
            onClick={() => setTab(i)}
          >{t}</Text>
        ))}
      </View>

      {error && <View className='error-msg'>{error}</View>}

      {loading ? (
        <View className='card text-center'>
          <Text className='text-secondary'>加载中...</Text>
        </View>
      ) : players.length === 0 ? (
        <View className='card text-center'>
          <Text className='text-secondary'>暂无数据，完成比赛并录入数据后显示</Text>
        </View>
      ) : (
        <ScrollView scrollY className='scroll-content'>
          {tab === 0 && (
            <View>
              {renderPodium(goalRanking, p => p.total_goals || 0, '粒进球', '#4caf50')}
              {renderRankList(goalRanking, p => p.total_goals || 0, '进球', '#4caf50')}
            </View>
          )}
          {tab === 1 && (
            <View>
              {renderPodium(assistRanking, p => p.total_assists || 0, '次助攻', '#2196f3')}
              {renderRankList(assistRanking, p => p.total_assists || 0, '助攻', '#2196f3')}
            </View>
          )}
          {tab === 2 && (
            <View>
              {renderPodium(interceptRanking, p => p.total_interceptions || 0, '次拦截', '#9c27b0')}
              {renderRankList(interceptRanking, p => p.total_interceptions || 0, '拦截', '#9c27b0')}
            </View>
          )}
          {tab === 3 && renderOverview()}
        </ScrollView>
      )}
    </View>
  )
}
