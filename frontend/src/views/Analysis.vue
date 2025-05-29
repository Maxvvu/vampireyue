<template>
  <div class="analysis-container">
    <div class="header">
      <h2>统计分析</h2>
      <div class="header-right">
        <el-select v-model="filterGrade" placeholder="选择年级" clearable @change="fetchData" style="margin-right: 10px">
          <el-option label="高一" value="高一" />
          <el-option label="高二" value="高二" />
          <el-option label="高三" value="高三" />
        </el-select>
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :shortcuts="dateShortcuts"
          @change="fetchData"
        />
      </div>
    </div>

    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="stat-card">
          <template #header>
            <div class="card-header">
              <span>总违纪次数</span>
            </div>
          </template>
          <div class="stat-number violation">
            {{ statistics.totalViolations }}
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <template #header>
            <div class="card-header">
              <span>总优秀表现</span>
            </div>
          </template>
          <div class="stat-number excellent">
            {{ statistics.totalExcellent }}
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <template #header>
            <div class="card-header">
              <span>违纪学生数</span>
            </div>
          </template>
          <div class="stat-number">
            {{ statistics.violationStudents }}
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <template #header>
            <div class="card-header">
              <span>优秀学生数</span>
            </div>
          </template>
          <div class="stat-number">
            {{ statistics.excellentStudents }}
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>行为类型分布</span>
            </div>
          </template>
          <div class="chart-container">
            <div ref="behaviorTypeChart" style="width: 100%; height: 300px"></div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>年级行为趋势</span>
            </div>
          </template>
          <div class="chart-container">
            <div ref="gradeTrendChart" style="width: 100%; height: 300px"></div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row style="margin-top: 20px">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>行为记录趋势</span>
            </div>
          </template>
          <div class="chart-container">
            <div ref="trendChart" style="width: 100%; height: 300px"></div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'

const filterGrade = ref('')
const dateRange = ref('')
const loading = ref(false)

// 图表实例
const behaviorTypeChart = ref(null)
const gradeTrendChart = ref(null)
const trendChart = ref(null)
let charts = []

// 统计数据
const statistics = ref({
  totalViolations: 0,
  totalExcellent: 0,
  violationStudents: 0,
  excellentStudents: 0
})

// 日期快捷选项
const dateShortcuts = [
  {
    text: '最近一周',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 7)
      return [start, end]
    },
  },
  {
    text: '最近一月',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 30)
      return [start, end]
    },
  },
  {
    text: '最近三月',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 90)
      return [start, end]
    },
  }
]

// 初始化图表
const initCharts = () => {
  // 行为类型分布图
  const typeChart = echarts.init(behaviorTypeChart.value)
  typeChart.setOption({
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [{
      type: 'pie',
      radius: '50%',
      data: [],
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }]
  })

  // 年级行为趋势图
  const gradeChart = echarts.init(gradeTrendChart.value)
  gradeChart.setOption({
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['违纪', '优秀']
    },
    xAxis: {
      type: 'category',
      data: ['高一', '高二', '高三']
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '违纪',
        type: 'bar',
        data: []
      },
      {
        name: '优秀',
        type: 'bar',
        data: []
      }
    ]
  })

  // 行为记录趋势图
  const timeChart = echarts.init(trendChart.value)
  timeChart.setOption({
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['违纪', '优秀']
    },
    xAxis: {
      type: 'time',
      boundaryGap: false
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '违纪',
        type: 'line',
        data: []
      },
      {
        name: '优秀',
        type: 'line',
        data: []
      }
    ]
  })

  charts = [typeChart, gradeChart, timeChart]
}

// 获取统计数据
const fetchData = async () => {
  try {
    loading.value = true
    const params = {
      grade: filterGrade.value,
      start_date: dateRange.value?.[0]?.toISOString(),
      end_date: dateRange.value?.[1]?.toISOString()
    }
    
    const response = await axios.get('/api/statistics', { params })
    const data = response.data

    // 更新统计数字
    statistics.value = {
      totalViolations: data.total_violations,
      totalExcellent: data.total_excellent,
      violationStudents: data.violation_students,
      excellentStudents: data.excellent_students
    }

    // 更新行为类型分布图
    charts[0].setOption({
      series: [{
        data: data.behavior_type_distribution
      }]
    })

    // 更新年级行为趋势图
    charts[1].setOption({
      series: [
        {
          data: data.grade_violations
        },
        {
          data: data.grade_excellent
        }
      ]
    })

    // 更新行为记录趋势图
    charts[2].setOption({
      series: [
        {
          data: data.time_trend.violations
        },
        {
          data: data.time_trend.excellent
        }
      ]
    })
  } catch (error) {
    console.error('获取统计数据失败:', error)
    ElMessage.error('获取统计数据失败')
  } finally {
    loading.value = false
  }
}

// 监听窗口大小变化
const handleResize = () => {
  charts.forEach(chart => chart?.resize())
}

onMounted(() => {
  initCharts()
  fetchData()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  charts.forEach(chart => chart?.dispose())
})
</script>

<style scoped>
.analysis-container {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.stat-card {
  height: 160px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-number {
  font-size: 36px;
  font-weight: bold;
  text-align: center;
  margin-top: 20px;
}

.stat-number.violation {
  color: #f56c6c;
}

.stat-number.excellent {
  color: #67c23a;
}

.chart-container {
  display: flex;
  justify-content: center;
  align-items: center;
}
</style> 