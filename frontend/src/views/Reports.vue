<template>
  <div class="reports-container">
    <div class="header">
      <h2>统计报表</h2>
      <div class="header-right">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          @change="handleDateChange"
        />
        <el-select v-model="selectedGrade" placeholder="选择年级" clearable @change="handleFilter" style="margin-left: 10px">
          <el-option label="高一" value="高一" />
          <el-option label="高二" value="高二" />
          <el-option label="高三" value="高三" />
        </el-select>
        <el-button type="primary" @click="exportReport" style="margin-left: 10px">
          <el-icon><Download /></el-icon>
          导出报表
        </el-button>
      </div>
    </div>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>行为类型分布</span>
            </div>
          </template>
          <div ref="behaviorTypeChartRef" style="height: 300px"></div>
        </el-card>
      </el-col>
      
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>年级行为对比</span>
            </div>
          </template>
          <div ref="gradeComparisonChartRef" style="height: 300px"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span>详细数据</span>
        </div>
      </template>
      <el-table
        :data="tableData"
        style="width: 100%"
        v-loading="loading"
        border
      >
        <el-table-column prop="grade" label="年级" width="100" />
        <el-table-column prop="class" label="班级" width="100" />
        <el-table-column prop="student_name" label="学生姓名" width="120" />
        <el-table-column prop="behavior_type" label="行为类型" width="120" />
        <el-table-column prop="category" label="类别" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.category === '违纪' ? 'danger' : 'success'">
              {{ scope.row.category }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" />
        <el-table-column prop="date" label="日期" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.date) }}
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Download } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import axios from 'axios'

const dateRange = ref([])
const selectedGrade = ref('')
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const tableData = ref([])
const behaviorTypeChartRef = ref(null)
const gradeComparisonChartRef = ref(null)

let behaviorTypeChart = null
let gradeComparisonChart = null

onMounted(() => {
  initCharts()
  fetchData()
})

const initCharts = () => {
  // 初始化行为类型分布图表
  behaviorTypeChart = echarts.init(behaviorTypeChartRef.value)
  behaviorTypeChart.setOption({
    title: {
      text: '行为类型分布'
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center'
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '20',
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: []
      }
    ]
  })

  // 初始化年级行为对比图表
  gradeComparisonChart = echarts.init(gradeComparisonChartRef.value)
  gradeComparisonChart.setOption({
    title: {
      text: '年级行为对比'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      data: ['违纪', '优秀']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
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
        stack: 'total',
        label: {
          show: true
        },
        emphasis: {
          focus: 'series'
        },
        data: []
      },
      {
        name: '优秀',
        type: 'bar',
        stack: 'total',
        label: {
          show: true
        },
        emphasis: {
          focus: 'series'
        },
        data: []
      }
    ]
  })

  // 监听窗口大小变化
  window.addEventListener('resize', () => {
    behaviorTypeChart.resize()
    gradeComparisonChart.resize()
  })
}

const fetchData = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      page_size: pageSize.value,
      grade: selectedGrade.value,
      start_date: dateRange.value?.[0],
      end_date: dateRange.value?.[1]
    }

    const response = await axios.get('/api/statistics', { params })
    const data = response.data

    // 更新表格数据
    tableData.value = data.behaviors || []
    total.value = data.total || 0

    // 更新图表数据
    updateCharts(data)
  } catch (error) {
    console.error('获取数据失败:', error)
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

const updateCharts = (data) => {
  // 更新行为类型分布图表
  if (data.behavior_type_distribution) {
    behaviorTypeChart.setOption({
      series: [{
        data: data.behavior_type_distribution
      }]
    })
  }

  // 更新年级行为对比图表
  if (data.grade_violations && data.grade_excellent) {
    gradeComparisonChart.setOption({
      series: [
        {
          data: data.grade_violations
        },
        {
          data: data.grade_excellent
        }
      ]
    })
  }
}

const handleDateChange = () => {
  currentPage.value = 1
  fetchData()
}

const handleFilter = () => {
  currentPage.value = 1
  fetchData()
}

const handleSizeChange = (val) => {
  pageSize.value = val
  fetchData()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchData()
}

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const exportReport = () => {
  ElMessage.info('导出功能开发中')
}
</script>

<style scoped>
.reports-container {
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
}

.chart-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-card {
  margin-top: 20px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style> 