import { useState } from 'react'
import { View, Text, Image, ScrollView, Picker } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { api } from '../../services/api'
import { getUser, canEdit } from '../../store/auth'
import { FORMATIONS } from '../../data/formations'
import './index.scss'

import GK01 from '../../assets/playerIcon/GK01.png'
import GK02 from '../../assets/playerIcon/GK02.png'
import CB01 from '../../assets/playerIcon/CB01.png'
import CB02 from '../../assets/playerIcon/CB02.png'
import CB03 from '../../assets/playerIcon/CB03.png'
import LB01 from '../../assets/playerIcon/LB01.png'
import LB02 from '../../assets/playerIcon/LB02.png'
import RB01 from '../../assets/playerIcon/RB01.png'
import RB02 from '../../assets/playerIcon/RB02.png'
import CDM01 from '../../assets/playerIcon/CDM01.png'
import CDM02 from '../../assets/playerIcon/CDM02.png'
import CM01 from '../../assets/playerIcon/CM01.png'
import CM02 from '../../assets/playerIcon/CM02.png'
import CAM01 from '../../assets/playerIcon/CAM01.png'
import LM01 from '../../assets/playerIcon/LM01.png'
import RM01 from '../../assets/playerIcon/RM01.png'
import LW02 from '../../assets/playerIcon/LW02.png'
import ST01 from '../../assets/playerIcon/ST01.png'
import ST02 from '../../assets/playerIcon/ST02.png'
import ST03 from '../../assets/playerIcon/ST03.png'
import ST04 from '../../assets/playerIcon/ST04.png'
import ST05 from '../../assets/playerIcon/ST05.png'
import ST06 from '../../assets/playerIcon/ST06.png'

const POSITION_AVATARS: Record<string, string[]> = {
  GK: [GK01, GK02],
  DF: [CB01, CB02, CB03, LB01, LB02, RB01, RB02],
  MF: [CDM01, CDM02, CM01, CM02, CAM01, LM01, RM01, LW02],
  FW: [ST01, ST02, ST03, ST04, ST05, ST06],
}

const getPositionCategory = (pos: string): string => {
  if (pos === 'GK') return 'GK'
  if (['CB', 'LB', 'RB', 'LWB', 'RWB', 'DF'].includes(pos)) return 'DF'
  if (['CDM', 'CM', 'CAM', 'LM', 'RM', 'LW', 'RW', 'MF'].includes(pos)) return 'MF'
  if (['ST', 'CF', 'FW'].includes(pos)) return 'FW'
  return 'MF'
}

const getPositionAvatar = (position: string, index: number): string => {
  const cat = getPositionCategory(position)
  const avatars = POSITION_AVATARS[cat] || POSITION_AVATARS.MF
  return avatars[index % avatars.length]
}

const BADGE_COLORS: Record<string, string> = {
  GK: '#ffeb3b', DF: '#4caf50', MF: '#2196f3', FW: '#f44336',
}

export default function Tactics() {
  const [match, setMatch] = useState<any>(null)
  const [lineup, setLineup] = useState<any[]>([])
  const [bench, setBench] = useState<any[]>([])
  const [currentFormation, setCurrentFormation] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [selectedFrom, setSelectedFrom] = useState<'lineup' | 'bench' | null>(null)
  const [flippedMap, setFlippedMap] = useState<Record<string, boolean>>({})
  const [hasChanges, setHasChanges] = useState(false)
  const [playerStatsRating, setPlayerStatsRating] = useState<Record<number, number>>({})

  const user = getUser()
  const editable = user ? canEdit(user.role) : false

  const toggleFlip = (key: string) => {
    setFlippedMap(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleTapLineup = (index: number) => {
    if (!editable) { toggleFlip('lineup-' + index); return }
    if (selectedFrom === null) {
      if (lineup[index]) { setSelectedIndex(index); setSelectedFrom('lineup') }
    } else if (selectedFrom === 'lineup') {
      const newLineup = [...lineup]
      const temp = newLineup[selectedIndex!]
      newLineup[selectedIndex!] = newLineup[index]
      newLineup[index] = temp
      setLineup(newLineup); setSelectedIndex(null); setSelectedFrom(null); setHasChanges(true)
      Taro.showToast({ title: '位置已交换', icon: 'success', duration: 800 })
    } else if (selectedFrom === 'bench') {
      const newLineup = [...lineup]; const newBench = [...bench]
      const benchPlayer = newBench[selectedIndex!]; const lineupPlayer = newLineup[index]
      newLineup[index] = benchPlayer
      if (lineupPlayer) { newBench[selectedIndex!] = lineupPlayer } else { newBench.splice(selectedIndex!, 1) }
      setLineup(newLineup); setBench(newBench); setSelectedIndex(null); setSelectedFrom(null); setHasChanges(true)
      Taro.showToast({ title: '替换成功', icon: 'success', duration: 800 })
    }
  }

  const handleTapBench = (index: number) => {
    if (!editable) return
    if (selectedFrom === null) { setSelectedIndex(index); setSelectedFrom('bench') }
    else if (selectedFrom === 'bench') {
      if (index === selectedIndex) { setSelectedIndex(null); setSelectedFrom(null) }
      else {
        const newBench = [...bench]; const temp = newBench[selectedIndex!]
        newBench[selectedIndex!] = newBench[index]; newBench[index] = temp
        setBench(newBench); setSelectedIndex(null); setSelectedFrom(null); setHasChanges(true)
      }
    } else if (selectedFrom === 'lineup') {
      const newLineup = [...lineup]; const newBench = [...bench]
      const lineupPlayer = newLineup[selectedIndex!]; const benchPlayer = newBench[index]
      newLineup[selectedIndex!] = benchPlayer; newBench[index] = lineupPlayer
      setLineup(newLineup); setBench(newBench); setSelectedIndex(null); setSelectedFrom(null); setHasChanges(true)
      Taro.showToast({ title: '替换成功', icon: 'success', duration: 800 })
    }
  }

  const cancelSelection = () => { setSelectedIndex(null); setSelectedFrom(null) }

  // 切换阵型
  const handleFormationChange = (e: any) => {
    const format = match?.format || '5v5'
    const formationKeys = Object.keys(FORMATIONS[format] || {})
    const newFormation = formationKeys[Number(e.detail.value)]
    if (newFormation && newFormation !== currentFormation) {
      setCurrentFormation(newFormation)
      setHasChanges(true)
    }
  }

  // 保存阵型和人员位置到后端
  const handleSave = async () => {
    if (!match) return
    setSaving(true)
    try {
      // 更新阵型
      await api.updateMatch(match.id, { formation: currentFormation })

      // 更新球员位置：重新导入带 position_index 和 is_starter
      const lineupSize = lineup.length
      const playersToImport = [
        ...lineup.map((p: any, i: number) => p ? ({
          name: p.name,
          preferred_position: p.position || 'MF',
          rating: p.rating || 75,
          position_index: i,
          is_starter: true,
        }) : null).filter(Boolean),
        ...bench.map((p: any) => ({
          name: p.name,
          preferred_position: p.position || 'MF',
          rating: p.rating || 75,
          position_index: null,
          is_starter: false,
        })),
      ]

      if (playersToImport.length > 0) {
        await api.importPlayers(match.id, playersToImport)
      }

      setHasChanges(false)
      // 更新本地 match 数据
      setMatch({ ...match, formation: currentFormation })
      Taro.showToast({ title: '阵型已更新！', icon: 'success' })
      setTimeout(() => {
        Taro.navigateBack()
      }, 1000)
    } catch {
      Taro.showToast({ title: '保存失败', icon: 'error' })
    } finally {
      setSaving(false)
    }
  }

  useDidShow(() => {
    if (!user) { Taro.redirectTo({ url: '/pages/login/index' }); return }
    const instance = Taro.getCurrentInstance()
    const matchId = instance.router?.params?.matchId
    if (!matchId) { setError('缺少比赛ID'); setLoading(false); return }

    api.getMatch(Number(matchId)).then((data: any) => {
      if (!data) { setError('比赛不存在'); setLoading(false); return }
      setMatch(data)

      const format = data.format || '5v5'
      const lineupSize = format === '5v5' ? 5 : format === '7v7' ? 7 : 11
      const formationKey = data.formation || Object.keys(FORMATIONS[format] || {})[0] || '2-2-1'
      setCurrentFormation(formationKey)

      const calcRating = (s: { goals: number; assists: number; yellowCards: number; redCards: number }): number => {
        if (s.goals === 0 && s.assists === 0 && s.yellowCards === 0 && s.redCards === 0) return 6.0
        const raw = 6.0 + s.goals * 1.0 + s.assists * 0.5 - s.yellowCards * 0.5 - s.redCards * 1.5
        return Math.round(Math.min(10, Math.max(1, raw)) * 10) / 10
      }

      const toPercentRating = (rating10: number): number => {
        return Math.round(rating10 * 3.75 + 62.5)
      }

      const statsRatingMap: Record<number, number> = {}
      if (data.stats && data.stats.length > 0) {
        data.stats.forEach((stat: any) => {
          const rating10 = calcRating({
            goals: stat.goals || 0,
            assists: stat.assists || 0,
            yellowCards: stat.yellow_cards || 0,
            redCards: stat.red_cards || 0,
          })
          statsRatingMap[stat.player_id] = toPercentRating(rating10)
        })
      }
      setPlayerStatsRating(statsRatingMap)

      if (data.registrations && data.registrations.length > 0) {
        const posAvatarIdx: Record<string, number> = {}
        const sorted = [...data.registrations].sort((a: any, b: any) => {
          if (a.is_starter && !b.is_starter) return -1
          if (!a.is_starter && b.is_starter) return 1
          if (a.position_index != null && b.position_index != null) return a.position_index - b.position_index
          return 0
        })
        const newLineup: any[] = Array(lineupSize).fill(null)
        const newBench: any[] = []
        sorted.forEach((reg: any, i: number) => {
          const pos = reg.preferred_position || 'MF'
          const cat = getPositionCategory(pos)
          const avatarIdx = posAvatarIdx[cat] || 0
          posAvatarIdx[cat] = avatarIdx + 1
          const player = {
            id: reg.player_id, name: reg.player_name || reg.name, position: pos,
            avatar: getPositionAvatar(pos, avatarIdx), rating: reg.rating || 75,
            jerseyNumber: reg.position_index != null ? reg.position_index + 1 : i + 1,
          }
          if (reg.is_starter && reg.position_index != null && reg.position_index < lineupSize) {
            newLineup[reg.position_index] = player
          } else if (reg.is_starter) {
            const emptyIdx = newLineup.findIndex((p: any) => p === null)
            if (emptyIdx !== -1) newLineup[emptyIdx] = player; else newBench.push(player)
          } else { newBench.push(player) }
        })
        setLineup(newLineup); setBench(newBench)
      }
      setLoading(false)
    }).catch(() => { setError('加载失败'); setLoading(false) })
  })

  if (loading) return <View className='container'><View className='card text-center'><Text className='text-secondary'>加载中...</Text></View></View>
  if (error) return <View className='container'><View className='error-msg'>{error}</View></View>

  const format = match?.format || '5v5'
  const formationKeys = Object.keys(FORMATIONS[format] || {})
  const formationIdx = formationKeys.indexOf(currentFormation)
  const formationData = FORMATIONS[format]?.[currentFormation]
  const positions = formationData?.positions || []

  return (
    <ScrollView scrollY className='tactics-page'>
      <View className='container'>
        {/* 比赛信息 */}
        <View className='card match-info-card'>
          <View className='flex-between'>
            <Text style={{ fontSize: '32rpx', fontWeight: 'bold', color: '#fff' }}>
              {'⚽ ' + (match?.match_date?.split('T')[0] || '') + (match?.match_time ? ' ' + match.match_time.slice(0, 5) : '')}
            </Text>
            <Text className='chip chip-primary'>{format}</Text>
          </View>
          {match?.location ? (
            <Text className='text-secondary' style={{ fontSize: '24rpx', marginTop: '8rpx', display: 'block' }}>
              {'📍 ' + match.location}
            </Text>
          ) : null}

          {/* 阵型选择 */}
          <View className='formation-row'>
            <Text style={{ color: '#999', fontSize: '24rpx', marginRight: '12rpx' }}>阵型:</Text>
            {editable ? (
              <Picker mode='selector' range={formationKeys} value={formationIdx >= 0 ? formationIdx : 0} onChange={handleFormationChange}>
                <View className='formation-picker'>
                  <Text style={{ color: '#ff9800', fontWeight: 'bold', fontSize: '28rpx' }}>{currentFormation}</Text>
                  <Text style={{ color: '#999', fontSize: '22rpx', marginLeft: '8rpx' }}>▼ 切换</Text>
                </View>
              </Picker>
            ) : (
              <Text className='chip chip-warning'>{currentFormation}</Text>
            )}
            {match?.status === 'completed' ? (
              <Text style={{ fontSize: '36rpx', fontWeight: 'bold', color: '#ffd700', marginLeft: '16rpx' }}>
                {match.home_score + ' - ' + match.away_score}
              </Text>
            ) : null}
          </View>

          <Text className='text-secondary' style={{ fontSize: '22rpx', marginTop: '8rpx', display: 'block' }}>
            {editable ? '💡 点击球员选中交换 | 长按翻转 | 切换阵型后点击保存' : '💡 点击球员翻转查看号码和评分'}
          </Text>
        </View>

        {/* 选中提示 */}
        {selectedFrom !== null ? (
          <View className='selection-bar'>
            <Text style={{ color: '#ffd700', fontSize: '26rpx' }}>
              {'已选中: ' + (selectedFrom === 'lineup' ? (lineup[selectedIndex!]?.name || '') : (bench[selectedIndex!]?.name || '')) + '，点击目标位置交换'}
            </Text>
            <Text className='cancel-btn' onClick={cancelSelection}>取消</Text>
          </View>
        ) : null}

        {/* 保存按钮 */}
        {editable ? (
          <View className='btn-row'>
            <View className={'btn-save btn-save-half' + (saving ? ' btn-disabled' : '')} onClick={saving ? undefined : handleSave}>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: '28rpx' }}>
                {saving ? '保存中...' : '💾 保存阵型'}
              </Text>
            </View>
          </View>
        ) : null}

        {/* 球场 */}
        <View className='pitch'>
          <View className='pitch-line center-line' />
          <View className='center-circle' />
          <View className='goal-area goal-area-top' />
          <View className='goal-area goal-area-bottom' />
          <View className='penalty-area penalty-area-top' />
          <View className='penalty-area penalty-area-bottom' />

          {positions.map((pos: any, index: number) => {
            const player = lineup[index]
            const cat = getPositionCategory(pos.label)
            const badgeColor = BADGE_COLORS[cat] || '#2196f3'
            const isSelected = selectedFrom === 'lineup' && selectedIndex === index
            const isFlipped = flippedMap['lineup-' + index] || false
            const statsRating = player ? playerStatsRating[player.id] : null
            const displayRating = statsRating !== undefined && statsRating !== null ? statsRating : (player?.rating || 75)
            return (
              <View key={index} className={'position-slot' + (isSelected ? ' slot-selected' : '')}
                style={{ left: pos.x + '%', top: pos.y + '%' }}
                onClick={() => handleTapLineup(index)}
                onLongPress={() => player && toggleFlip('lineup-' + index)}
              >
                {player ? (
                  <>
                    <View className='player-card-wrapper'>
                      <View className={'player-card-inner' + (isFlipped ? ' flipped' : '')}>
                        <View className='player-card-front'>
                          <Image className={'player-avatar' + (isSelected ? ' avatar-selected' : '')} src={player.avatar} mode='aspectFill' />
                        </View>
                        <View className='player-card-back'>
                          <Text className='jersey-number'>{player.jerseyNumber || '?'}</Text>
                          <Text className='back-name'>{player.name}</Text>
                          <Text className='back-rating' style={{ color: displayRating >= 85 ? '#4caf50' : displayRating >= 75 ? '#2196f3' : '#f44336' }}>
                            {'评分 ' + displayRating}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <Text className='player-name'>{player.name}</Text>
                    <Text className='position-label' style={{ color: badgeColor }}>{pos.label}</Text>
                  </>
                ) : (
                  <View className={'empty-slot' + (selectedFrom !== null ? ' empty-slot-target' : '')}>
                    <Text>{pos.label}</Text>
                  </View>
                )}
              </View>
            )
          })}
        </View>

        {/* 替补席 */}
        <View className='card bench-section'>
          <Text style={{ fontSize: '30rpx', fontWeight: 'bold', color: '#fff', marginBottom: '16rpx', display: 'block' }}>
            {'🪑 替补席 (' + bench.length + '人)'}
          </Text>
          {bench.length === 0 ? (
            <Text className='text-secondary' style={{ fontSize: '24rpx' }}>暂无替补球员</Text>
          ) : (
            <View className='bench-list'>
              {bench.map((player: any, i: number) => {
                const cat = getPositionCategory(player.position)
                const badgeColor = BADGE_COLORS[cat] || '#2196f3'
                const isSelected = selectedFrom === 'bench' && selectedIndex === i
                return (
                  <View className={'bench-player' + (isSelected ? ' bench-selected' : '')} key={player.id || i} onClick={() => handleTapBench(i)}>
                    <Image className={'bench-avatar' + (isSelected ? ' avatar-selected' : '')} src={player.avatar} mode='aspectFill' />
                    <Text className='bench-name'>{player.name}</Text>
                    <View className='position-badge-sm' style={{ background: badgeColor }}>
                      <Text className='position-badge-text-sm'>{player.position}</Text>
                    </View>
                  </View>
                )
              })}
            </View>
          )}
        </View>

        <View style={{ height: '40rpx' }} />
      </View>
    </ScrollView>
  )
}
