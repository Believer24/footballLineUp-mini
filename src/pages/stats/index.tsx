import { useState } from 'react'
import { View, Text, Input, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { api } from '../../services/api'
import { getUser, canEdit } from '../../store/auth'
import './index.scss'

interface PlayerStat {
  playerId: number
  playerName: string
  goals: number
  assists: number
  interceptions: number
  yellowCards: number
  redCards: number
  rating: number
  isMVP: boolean
}

const calcRating = (s: { goals: number; assists: number; interceptions: number; yellowCards: number; redCards: number }): number => {
  if (s.goals === 0 && s.assists === 0 && s.interceptions === 0 && s.yellowCards === 0 && s.redCards === 0) return 6.0
  const raw = 6.0 + s.goals * 1.0 + s.assists * 0.5 + s.interceptions * 0.5 - s.yellowCards * 0.5 - s.redCards * 1.5
  return Math.round(Math.min(10, Math.max(1, raw)) * 10) / 10
}

export default function Stats() {
  const [match, setMatch] = useState<any>(null)
  const [playerStats, setPlayerStats] = useState<PlayerStat[]>([])
  const [homeScore, setHomeScore] = useState(0)
  const [awayScore, setAwayScore] = useState(0)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const user = getUser()
  const editable = user ? canEdit(user.role) : false

  useDidShow(() => {
    if (!user) { Taro.redirectTo({ url: '/pages/login/index' }); return }

    const instance = Taro.getCurrentInstance()
    const matchId = instance.router?.params?.matchId
    if (!matchId) { setError('缺少比赛ID'); setLoading(false); return }

    api.getMatch(Number(matchId)).then((data: any) => {
      if (!data) { setError('比赛不存在'); setLoading(false); return }
      setMatch(data)
      setHomeScore(data.home_score || 0)
      setAwayScore(data.away_score || 0)

      if (data.registrations && data.registrations.length > 0) {
        const stats: PlayerStat[] = data.registrations
          .filter((r: any) => r.is_starter)
          .map((r: any) => {
            // 如果已有统计数据，从 stats 里取
            const existingStat = data.stats?.find((s: any) => s.player_id === r.player_id)
            return {
              playerId: r.player_id,
              playerName: r.player_name || r.name,
              goals: existingStat?.goals || 0,
              assists: existingStat?.assists || 0,
              interceptions: existingStat?.interceptions || 0,
              yellowCards: existingStat?.yellow_cards || 0,
              redCards: existingStat?.red_cards || 0,
              rating: existingStat ? calcRating({
                goals: existingStat.goals || 0,
                assists: existingStat.assists || 0,
                interceptions: existingStat.interceptions || 0,
                yellowCards: existingStat.yellow_cards || 0,
                redCards: existingStat.red_cards || 0,
              }) : 6.0,
              isMVP: existingStat?.is_mvp || false,
            }
          })
        setPlayerStats(stats)
      }
      setLoading(false)
    }).catch(() => { setError('加载失败'); setLoading(false) })
  })

  const updateStat = (index: number, field: string, value: number) => {
    const updated = playerStats.map((s, i) => {
      if (i !== index) return s
      const newStat = { ...s, [field]: Math.max(0, value) }
      newStat.rating = calcRating(newStat)
      return newStat
    })
    // Auto MVP: highest rating with at least one stat
    const maxRating = Math.max(...updated.map(s => s.rating))
    updated.forEach(s => {
      const hasStats = s.goals > 0 || s.assists > 0 || s.interceptions > 0
      s.isMVP = hasStats && s.rating === maxRating
    })
    setPlayerStats(updated)
  }

  const handleSave = async () => {
    if (!match) return
    setSaving(true)
    try {
      await api.batchSaveStats(match.id, {
        stats: playerStats,
        home_score: homeScore,
        away_score: awayScore,
        formation: match.formation || '',
      })
      Taro.showToast({ title: '保存成功！', icon: 'success' })
      setTimeout(() => Taro.navigateBack(), 1200)
    } catch {
      Taro.showToast({ title: '保存失败', icon: 'error' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <View className='container'><View className='card text-center'><Text className='text-secondary'>加载中...</Text></View></View>
  }
  if (error) {
    return <View className='container'><View className='error-msg'>{error}</View></View>
  }
  if (!editable) {
    return <View className='container'><View className='card text-center'><Text className='text-secondary'>仅队长和领队可以录入数据</Text></View></View>
  }

  return (
    <ScrollView scrollY className='stats-page'>
      <View className='container'>
        <Text className='page-title'>📊 赛后数据统计</Text>

        {/* 比赛信息 */}
        <View className='card mb-20'>
          <Text style={{ color: '#fff', fontSize: '28rpx', fontWeight: 'bold' }}>
            {'⚽ ' + (match?.match_date?.split('T')[0] || '') + (match?.location ? ' · ' + match.location : '')}
          </Text>
        </View>

        {/* 比分 */}
        <View className='card mb-20'>
          <Text className='section-title'>比赛比分</Text>
          <View className='score-row'>
            <View className='score-box'>
              <Text className='score-label'>主队</Text>
              <Input
                className='score-input'
                type='number'
                value={String(homeScore)}
                onInput={(e) => setHomeScore(Math.max(0, Number(e.detail.value) || 0))}
              />
            </View>
            <Text className='score-divider'>:</Text>
            <View className='score-box'>
              <Text className='score-label'>客队</Text>
              <Input
                className='score-input'
                type='number'
                value={String(awayScore)}
                onInput={(e) => setAwayScore(Math.max(0, Number(e.detail.value) || 0))}
              />
            </View>
          </View>
        </View>

        {/* 球员数据 */}
        <View className='card mb-20'>
          <Text className='section-title'>球员数据</Text>
          <Text className='text-hint'>评分和MVP根据数据自动计算</Text>

          {playerStats.map((stat, idx) => (
            <View className={'player-stat-card' + (stat.isMVP ? ' mvp-card' : '')} key={stat.playerId}>
              <View className='stat-header'>
                <Text className='stat-player-name'>
                  {stat.isMVP ? '⭐ ' : ''}{stat.playerName}
                </Text>
                <Text className='stat-rating' style={{
                  color: stat.rating >= 8 ? '#4caf50' : stat.rating >= 6 ? '#2196f3' : '#f44336'
                }}>
                  {stat.rating}
                </Text>
              </View>

              <View className='stat-grid'>
                <View className='stat-item'>
                  <Text className='stat-label'>⚽ 进球</Text>
                  <View className='stat-controls'>
                    <Text className='stat-btn' onClick={() => updateStat(idx, 'goals', stat.goals - 1)}>-</Text>
                    <Text className='stat-value'>{stat.goals}</Text>
                    <Text className='stat-btn stat-btn-add' onClick={() => updateStat(idx, 'goals', stat.goals + 1)}>+</Text>
                  </View>
                </View>

                <View className='stat-item'>
                  <Text className='stat-label'>🅰️ 助攻</Text>
                  <View className='stat-controls'>
                    <Text className='stat-btn' onClick={() => updateStat(idx, 'assists', stat.assists - 1)}>-</Text>
                    <Text className='stat-value'>{stat.assists}</Text>
                    <Text className='stat-btn stat-btn-add' onClick={() => updateStat(idx, 'assists', stat.assists + 1)}>+</Text>
                  </View>
                </View>

                <View className='stat-item'>
                  <Text className='stat-label'>🛡️ 拦截</Text>
                  <View className='stat-controls'>
                    <Text className='stat-btn' onClick={() => updateStat(idx, 'interceptions', stat.interceptions - 1)}>-</Text>
                    <Text className='stat-value'>{stat.interceptions}</Text>
                    <Text className='stat-btn stat-btn-add' onClick={() => updateStat(idx, 'interceptions', stat.interceptions + 1)}>+</Text>
                  </View>
                </View>

                <View className='stat-item'>
                  <Text className='stat-label'>🟨 黄牌</Text>
                  <View className='stat-controls'>
                    <Text className='stat-btn' onClick={() => updateStat(idx, 'yellowCards', stat.yellowCards - 1)}>-</Text>
                    <Text className='stat-value'>{stat.yellowCards}</Text>
                    <Text className='stat-btn stat-btn-add' onClick={() => updateStat(idx, 'yellowCards', stat.yellowCards + 1)}>+</Text>
                  </View>
                </View>

                <View className='stat-item'>
                  <Text className='stat-label'>🟥 红牌</Text>
                  <View className='stat-controls'>
                    <Text className='stat-btn' onClick={() => updateStat(idx, 'redCards', stat.redCards - 1)}>-</Text>
                    <Text className='stat-value'>{stat.redCards}</Text>
                    <Text className='stat-btn stat-btn-add' onClick={() => updateStat(idx, 'redCards', stat.redCards + 1)}>+</Text>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* 保存按钮 */}
        <View className={'btn-save' + (saving ? ' btn-disabled' : '')} onClick={saving ? undefined : handleSave}>
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: '30rpx' }}>
            {saving ? '保存中...' : '💾 保存赛后数据'}
          </Text>
        </View>

        <View style={{ height: '60rpx' }} />
      </View>
    </ScrollView>
  )
}
