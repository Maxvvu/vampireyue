<template>
  <el-container class="layout-container">
    <el-container>
      <el-header>
        <div class="header-content">
          <h2>学生行为管理系统</h2>
          <el-dropdown @command="handleCommand">
            <span class="user-dropdown">
              {{ userStore.userInfo?.username }}
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      
      <el-main>
        <el-row :gutter="20">
          <el-col :span="6">
            <el-card shadow="hover" class="dashboard-card">
              <template #header>
                <div class="card-header">
                  <span>总学生数</span>
                </div>
              </template>
              <div class="card-content">
                <el-statistic :value="statistics.totalStudents">
                  <template #title>
                    <div style="display: inline-flex; align-items: center">
                      学生
                      <el-icon style="margin-left: 4px">
                        <User />
                      </el-icon>
                    </div>
                  </template>
                </el-statistic>
              </div>
            </el-card>
          </el-col>
          
          <el-col :span="6">
            <el-card shadow="hover" class="dashboard-card">
              <template #header>
                <div class="card-header">
                  <span>违纪记录</span>
                </div>
              </template>
              <div class="card-content">
                <el-statistic :value="statistics.totalViolations">
                  <template #title>
                    <div style="display: inline-flex; align-items: center">
                      违纪
                      <el-icon style="margin-left: 4px">
                        <Warning />
                      </el-icon>
                    </div>
                  </template>
                </el-statistic>
              </div>
            </el-card>
          </el-col>
          
          <el-col :span="6">
            <el-card shadow="hover" class="dashboard-card">
              <template #header>
                <div class="card-header">
                  <span>优秀表现</span>
                </div>
              </template>
              <div class="card-content">
                <el-statistic :value="statistics.totalExcellent">
                  <template #title>
                    <div style="display: inline-flex; align-items: center">
                      优秀
                      <el-icon style="margin-left: 4px">
                        <Star />
                      </el-icon>
                    </div>
                  </template>
                </el-statistic>
              </div>
            </el-card>
          </el-col>
          
          <el-col :span="6">
            <el-card shadow="hover" class="dashboard-card">
              <template #header>
                <div class="card-header">
                  <span>行为类型</span>
                </div>
              </template>
              <div class="card-content">
                <el-statistic :value="statistics.totalBehaviorTypes">
                  <template #title>
                    <div style="display: inline-flex; align-items: center">
                      类型
                      <el-icon style="margin-left: 4px">
                        <List />
                      </el-icon>
                    </div>
                  </template>
                </el-statistic>
              </div>
            </el-card>
          </el-col>
        </el-row>
        
        <el-row :gutter="20" style="margin-top: 20px">
          <el-col :span="12">
            <el-card shadow="hover">
              <template #header>
                <div class="card-header">
                  <span>年级分布</span>
                </div>
              </template>
              <div ref="gradeChartRef" style="height: 300px"></div>
            </el-card>
          </el-col>
          
          <el-col :span="12">
            <el-card shadow="hover">
              <template #header>
                <div class="card-header">
                  <span>行为趋势</span>
                </div>
              </template>
              <div ref="trendChartRef" style="height: 300px"></div>
            </el-card>
          </el-col>
        </el-row>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { User, List, Star, Warning, ArrowDown } from '@element-plus/icons-vue'
import { useUserStore } from '../stores/user'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import axios from 'axios'

const userStore = useUserStore()
const router = useRouter()
const gradeChartRef = ref(null)
const trendChartRef = ref(null)

const statistics = ref({
  totalStudents: 0,
  totalViolations: 0,
  totalExcellent: 0,
  totalBehaviorTypes: 0
})

const handleCommand = (command) => {
  if (command === 'logout') {
    userStore.logout()
    router.push('/login')
  }
}

const fetchStatistics = async () => {
  try {
    const [studentsRes, behaviorsRes, typesRes] = await Promise.all([
      axios.get('/api/students'),
      axios.get('/api/behaviors'),
      axios.get('/api/behavior-types')
    ])
    
    statistics.value = {
      totalStudents: studentsRes.data.length,
      totalViolations: behaviorsRes.data.filter(b => b.category === '违纪').length,
      totalExcellent: behaviorsRes.data.filter(b => b.category === '优秀').length,
      totalBehaviorTypes: typesRes.data.length
    }
    
    initCharts(studentsRes.data, behaviorsRes.data)
  } catch (error) {
    console.error('获取统计数据失败:', error)
  }
}

const initCharts = (students, behaviors) => {
  // 年级分布图表
  const gradeChart = echarts.init(gradeChartRef.value)
  const gradeData = {
    '高一': students.filter(s => s.grade === '高一').length,
    '高二': students.filter(s => s.grade === '高二').length,
    '高三': students.filter(s => s.grade === '高三').length
  }
  
  gradeChart.setOption({
    title: {
      text: '年级学生分布'
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    series: [
      {
        type: 'pie',
        radius: '70%',
        data: Object.entries(gradeData).map(([name, value]) => ({ name, value })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  })
  
  // 行为趋势图表
  const trendChart = echarts.init(trendChartRef.value)
  const dates = [...new Set(behaviors.map(b => b.date.split('T')[0]))].sort()
  const violationData = dates.map(date => 
    behaviors.filter(b => b.date.startsWith(date) && b.category === '违纪').length
  )
  const excellentData = dates.map(date => 
    behaviors.filter(b => b.date.startsWith(date) && b.category === '优秀').length
  )
  
  trendChart.setOption({
    title: {
      text: '行为记录趋势'
    },
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['违纪', '优秀']
    },
    xAxis: {
      type: 'category',
      data: dates
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '违纪',
        type: 'line',
        data: violationData
      },
      {
        name: '优秀',
        type: 'line',
        data: excellentData
      }
    ]
  })
  
  // 监听窗口大小变化
  window.addEventListener('resize', () => {
    gradeChart.resize()
    trendChart.resize()
  })
}

onMounted(() => {
  fetchStatistics()
})
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.el-header {
  background-color: #fff;
  border-bottom: 1px solid #dcdfe6;
  padding: 0 20px;
}

.header-content {
  height: 60px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.user-dropdown {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
}

.el-main {
  background-color: #f0f2f5;
  padding: 20px;
}

.dashboard-card {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-content {
  text-align: center;
  padding: 20px 0;
}
</style> 