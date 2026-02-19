export default defineAppConfig({
  pages: [
    'pages/login/index',
    'pages/matches/index',
    'pages/import/index',
    'pages/tactics/index',
    'pages/leaderboard/index',
    'pages/stats/index',
  ],
  window: {
    backgroundTextStyle: 'dark',
    navigationBarBackgroundColor: '#1a1a2e',
    navigationBarTitleText: '金龙FC',
    navigationBarTextStyle: 'white',
    backgroundColor: '#0d1f2d',
  },
  tabBar: {
    color: '#999999',
    selectedColor: '#1976d2',
    backgroundColor: '#1a1a2e',
    borderStyle: 'black',
    list: [
      { pagePath: 'pages/matches/index', text: '比赛' },
      { pagePath: 'pages/import/index', text: '导入' },
      { pagePath: 'pages/leaderboard/index', text: '排行榜' },
    ],
  },
})
