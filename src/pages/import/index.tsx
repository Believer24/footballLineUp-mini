import { useState } from 'react'
import { View, Text, Textarea, Picker } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { getUser, canEdit } from '../../store/auth'
import { api } from '../../services/api'
import './index.scss'

const FORMAT_OPTIONS = ['5v5', '7v7', '11v11']
const FORMATION_MAP: Record<string, string[]> = {
  '5v5': ['2-2-1', '1-3-1', '3-2', '3-1-1'],
  '7v7': ['2-3-1', '3-2-1', '3-3'],
  '11v11': ['4-4-2', '4-3-3', '3-5-2', '4-2-3-1'],
}

const assignPositions = (count: number, format: string): string[] => {
  const base: Record<string, string[]> = {
    '5v5': ['DF', 'DF', 'MF', 'FW', 'FW'],
    '7v7': ['GK', 'DF', 'DF', 'MF', 'MF', 'MF', 'FW'],
    '11v11': ['GK', 'DF', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'FW', 'FW', 'FW'],
  }
  const positions = base[format] || base['5v5']
  const result: string[] = []
  for (let i = 0; i < count; i++) {
    result.push(i < positions.length ? positions[i] : ['DF', 'MF', 'FW'][(i - positions.length) % 3])
  }
  return result
}

interface ParsedPlayer {
  name: string
  position: string
}

export default function Import() {
  const [text, setText] = useState('')
  const [formatIdx, setFormatIdx] = useState(0)
  const [formationIdx, setFormationIdx] = useState(0)
  const [parsed, setParsed] = useState<{
    date: string; time: string; location: string; players: ParsedPlayer[]
  } | null>(null)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState(getUser())

  useDidShow(() => {
    const currentUser = getUser()
    setUser(currentUser)
    if (!currentUser) {
      Taro.reLaunch({ url: '/pages/login/index' })
    }
  })

  const editable = user ? canEdit(user.role) : false
  const format = FORMAT_OPTIONS[formatIdx]
  const formations = FORMATION_MAP[format]

  const handleParse = () => {
    if (!text.trim()) return

    const dateMatch = text.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/)
    const date = dateMatch ? `${dateMatch[1]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[3].padStart(2, '0')}` : ''

    const timeMatch = text.match(/(\d{1,2})点/)
    const time = timeMatch ? `${timeMatch[1].padStart(2, '0')}:00` : ''

    const locationMatch = text.match(/地点[：:](.*?)(?:\n|$)/)
    const location = locationMatch ? locationMatch[1].trim() : ''

    const playerMatches = text.match(/\d+[.\u3001]\s*([^\n\d]+)/g) || []
    const playerNames = playerMatches.map(m => {
      return m.replace(/^\d+[.\u3001]\s*/, '').trim().split(/[\s\uff08\(]/)[0]
    }).filter(n => n && n.length > 0 && n.length < 10)

    const positions = assignPositions(playerNames.length, format)
    const players = playerNames.map((name, i) => ({
      name,
      position: positions[i] || 'MF',
    }))

    setParsed({ date, time, location, players })
  }

  const handleImport = async () => {
    if (!parsed || parsed.players.length === 0) return
    setSaving(true)
    try {
      // 创建比赛
      const matchRes = await api.createMatch({
        match_date: parsed.date || new Date().toISOString().split('T')[0],
        match_time: parsed.time || undefined,
        location: parsed.location || undefined,
        format,
      })

      const lineupSize = format === '5v5' ? 5 : format === '7v7' ? 7 : 11
      const formation = formations[formationIdx]

      // 导入球员
      const playersToImport = parsed.players.map((p, i) => ({
        name: p.name,
        preferred_position: p.position,
        rating: 75,
        position_index: i < lineupSize ? i : null,
        is_starter: i < lineupSize,
      }))

      await api.importPlayers(matchRes.id, playersToImport)

      // 保存阵型
      await api.updateMatch(matchRes.id, { formation })

      Taro.showToast({ title: '导入成功！', icon: 'success' })

      setTimeout(() => {
        Taro.navigateTo({ url: `/pages/tactics/index?matchId=${matchRes.id}` })
      }, 1000)
    } catch {
      Taro.showToast({ title: '导入失败', icon: 'error' })
    } finally {
      setSaving(false)
    }
  }

  if (!editable) {
    return (
      <View className='container'>
        <View className='card text-center'>
          <Text className='text-secondary'>仅队长和领队可以导入数据</Text>
        </View>
      </View>
    )
  }

  return (
    <View className='container'>
      <Text className='page-title'>📋 快速导入报名</Text>

      {/* 赛制选择 */}
      <View className='card mb-20'>
        <Text className='label'>赛制</Text>
        <Picker mode='selector' range={FORMAT_OPTIONS} value={formatIdx}
          onChange={(e) => { setFormatIdx(Number(e.detail.value)); setFormationIdx(0); setParsed(null) }}
        >
          <View className='picker-value'>{format}</View>
        </Picker>

        <Text className='label' style={{ marginTop: '20rpx' }}>阵型</Text>
        <Picker mode='selector' range={formations} value={formationIdx}
          onChange={(e) => setFormationIdx(Number(e.detail.value))}
        >
          <View className='picker-value'>{formations[formationIdx]}</View>
        </Picker>
      </View>

      {/* 文本输入 */}
      <View className='card mb-20'>
        <Text className='label'>粘贴报名接龙内容</Text>
        <Textarea
          className='import-textarea'
          placeholder='粘贴报名接龙文字...'
          value={text}
          onInput={(e) => setText(e.detail.value)}
          maxlength={2000}
        />
        <View className='btn-primary mt-10' onClick={handleParse}>
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>解析内容</Text>
        </View>
      </View>

      {/* 解析结果 */}
      {parsed && parsed.players.length > 0 ? (
        <View className='card mb-20'>
          <Text className='label'>解析结果</Text>

          <View className='flex-row gap-10' style={{ flexWrap: 'wrap', marginBottom: '16rpx' }}>
            <Text className='chip chip-primary'>{'赛制: ' + format}</Text>
            <Text className='chip chip-warning'>{'阵型: ' + formations[formationIdx]}</Text>
            {parsed.date ? <Text className='chip'>{'📅 ' + parsed.date}</Text> : null}
            {parsed.time ? <Text className='chip'>{'⏰ ' + parsed.time}</Text> : null}
            {parsed.location ? <Text className='chip'>{'📍 ' + parsed.location}</Text> : null}
          </View>

          <Text style={{ color: '#fff', fontSize: '28rpx', fontWeight: 'bold', marginBottom: '12rpx', display: 'block' }}>
            {'识别到 ' + parsed.players.length + ' 位球员:'}
          </Text>

          <View className='player-list'>
            {parsed.players.map((p, i) => (
              <View className='player-tag' key={i}>
                <Text style={{ color: '#fff', fontSize: '24rpx' }}>{(i + 1) + '. ' + p.name}</Text>
                <Text className='pos-tag'>{p.position}</Text>
              </View>
            ))}
          </View>

          <View className={'btn-primary mt-10' + (saving ? ' btn-disabled' : '')} onClick={saving ? undefined : handleImport}>
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>{saving ? '导入中...' : '一键生成比赛并导入'}</Text>
          </View>
        </View>
      ) : null}

      {parsed && parsed.players.length === 0 ? (
        <View className='card'>
          <Text style={{ color: '#ff9800', fontSize: '26rpx' }}>⚠️ 未识别到球员名单，请检查格式</Text>
        </View>
      ) : null}
    </View>
  )
}
