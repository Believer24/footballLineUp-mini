import { useState } from 'react'
import { View, Text, Input, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { api } from '../../services/api'
import { saveUser } from '../../store/auth'
import './index.scss'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError('请输入用户名和密码')
      return
    }
    setLoading(true)
    try {
      const res = await api.login(username.trim(), password)
      if (res.success && res.user) {
        saveUser(res.user)
        Taro.switchTab({ url: '/pages/matches/index' })
      } else {
        setError('用户名或密码错误')
      }
    } catch {
      setError('登录失败，请检查网络')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className='login-page'>
      <View className='login-header'>
        <Image className='login-logo' src={require('../../assets/teamIcon.jpg')} mode='aspectFill' />
        <Text className='login-title'>金龙FC足球俱乐部</Text>
        <Text className='login-subtitle'>请登录以继续</Text>
      </View>

      <View className='login-form'>
        {error && <View className='login-error'>{error}</View>}

        <View className='input-group'>
          <Text className='input-label'>用户名</Text>
          <Input
            className='input-field'
            placeholder='请输入用户名'
            value={username}
            onInput={(e) => { setUsername(e.detail.value); setError('') }}
          />
        </View>

        <View className='input-group'>
          <Text className='input-label'>密码</Text>
          <Input
            className='input-field'
            placeholder='请输入密码'
            password
            value={password}
            onInput={(e) => { setPassword(e.detail.value); setError('') }}
          />
        </View>

        <View className='login-btn' onClick={handleLogin}>
          <Text style={{ color: '#fff' }}>{loading ? '登录中...' : '登 录'}</Text>
        </View>

        <Text className='login-hint'>默认账号：captain / manager / player1，密码：123456</Text>
      </View>
    </View>
  )
}
