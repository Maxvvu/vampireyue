<template>
  <div class="student-import-container">
    <div class="header">
      <h2>学生导入</h2>
    </div>

    <el-card class="import-card">
      <div class="import-area">
        <el-upload
          class="excel-uploader"
          :action="`/api/students/import`"
          :headers="uploadHeaders"
          :on-success="handleImportSuccess"
          :on-error="handleImportError"
          :before-upload="beforeExcelUpload"
          accept=".xlsx,.xls"
          :show-file-list="false"
          :disabled="importing"
        >
          <template #trigger>
            <el-button type="primary" :loading="importing">
              <el-icon class="el-icon--upload"><Upload /></el-icon>
              选择Excel文件
            </el-button>
          </template>
          <template #tip>
            <div class="el-upload__tip">
              请上传Excel文件（.xlsx或.xls格式）
            </div>
          </template>
        </el-upload>

        <div class="template-download">
          <h3>导入说明：</h3>
          <ol>
            <li>请下载模板文件，按照模板格式填写学生信息</li>
            <li>必填字段：学号、姓名、年级</li>
            <li>选填字段：班级、家庭住址、紧急联系人、联系人电话、备注</li>
            <li>年级只能填写：高一、高二、高三</li>
            <li>Excel文件大小不能超过5MB</li>
          </ol>
          <el-button type="success" @click="downloadTemplate">
            <el-icon><Download /></el-icon>
            下载导入模板
          </el-button>
        </div>
      </div>

      <!-- 导入结果显示 -->
      <div v-if="importResult" class="import-result">
        <el-alert
          :title="'导入完成'"
          :type="importResult.error_count > 0 ? 'warning' : 'success'"
          :description="getResultDescription()"
          show-icon
          :closable="false"
        />
        
        <!-- 错误信息列表 -->
        <div v-if="importResult.error_messages && importResult.error_messages.length > 0" class="error-list">
          <h4>错误详情：</h4>
          <el-collapse>
            <el-collapse-item title="查看详细错误信息">
              <ul>
                <li v-for="(error, index) in importResult.error_messages" :key="index" class="error-item">
                  {{ error }}
                </li>
              </ul>
            </el-collapse-item>
          </el-collapse>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Upload, Download } from '@element-plus/icons-vue'
import axios from 'axios'

const importing = ref(false)
const importResult = ref(null)

// 上传请求头（添加token）
const uploadHeaders = computed(() => ({
  'Authorization': `Bearer ${localStorage.getItem('token')}`
}))

// 文件上传前的验证
const beforeExcelUpload = (file) => {
  const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                 file.type === 'application/vnd.ms-excel'
  const isLt5M = file.size / 1024 / 1024 < 5

  if (!isExcel) {
    ElMessage.error('只能上传Excel文件!')
    return false
  }
  if (!isLt5M) {
    ElMessage.error('文件大小不能超过 5MB!')
    return false
  }

  importing.value = true
  return true
}

// 导入成功处理
const handleImportSuccess = (response) => {
  importing.value = false
  if (response) {
    importResult.value = response
    if (response.error_count === 0) {
      ElMessage.success('导入成功')
    } else {
      ElMessage.warning('部分数据导入失败，请查看详细信息')
    }
  }
}

// 导入失败处理
const handleImportError = (error) => {
  importing.value = false
  console.error('导入失败:', error)
  ElMessage.error(error.response?.data?.message || '导入失败')
}

// 获取导入结果描述
const getResultDescription = () => {
  if (!importResult.value) return ''
  
  const { success_count, error_count } = importResult.value
  return `成功导入 ${success_count} 条记录，失败 ${error_count} 条`
}

// 下载模板文件
const downloadTemplate = async () => {
  try {
    const response = await axios({
      url: '/api/students/template',
      method: 'GET',
      responseType: 'blob',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })

    // 创建下载链接
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.download = '学生导入模板.xlsx'
    document.body.appendChild(link)
    link.click()
    
    // 清理
    window.URL.revokeObjectURL(url)
    document.body.removeChild(link)
    
    ElMessage.success('模板下载成功')
  } catch (error) {
    console.error('模板下载失败:', error)
    ElMessage.error('模板下载失败，请重试')
  }
}
</script>

<style scoped>
.student-import-container {
  padding: 20px;
}

.header {
  margin-bottom: 20px;
}

.import-card {
  max-width: 800px;
  margin: 0 auto;
}

.import-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  background-color: #fafafa;
  text-align: center;
}

.excel-uploader {
  margin-bottom: 20px;
}

.template-download {
  text-align: left;
  width: 100%;
  max-width: 600px;
  margin-top: 20px;
}

.template-download h3 {
  margin-bottom: 10px;
  color: #606266;
}

.template-download ol {
  margin: 10px 0 20px 20px;
  color: #606266;
}

.template-download li {
  margin-bottom: 8px;
}

.import-result {
  margin-top: 20px;
}

.error-list {
  margin-top: 20px;
}

.error-list h4 {
  color: #f56c6c;
  margin-bottom: 10px;
}

.error-item {
  color: #f56c6c;
  margin-bottom: 5px;
  list-style-type: none;
}

.el-upload__tip {
  font-size: 12px;
  color: #606266;
  margin-top: 5px;
}
</style> 