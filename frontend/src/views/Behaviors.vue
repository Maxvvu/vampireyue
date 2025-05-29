<template>
  <div class="behaviors-container">
    <div class="header">
      <h2>行为记录管理</h2>
      <div class="header-right">
        <el-select v-model="filterGrade" placeholder="选择年级" clearable @change="handleFilter" style="margin-right: 10px">
          <el-option label="高一" value="高一" />
          <el-option label="高二" value="高二" />
          <el-option label="高三" value="高三" />
        </el-select>
        <el-select v-model="filterType" placeholder="行为类型" clearable @change="handleFilter" style="margin-right: 10px">
          <el-option-group label="违纪行为">
            <el-option
              v-for="type in behaviorTypes.filter(t => t.category === '违纪')"
              :key="type.id"
              :label="type.name"
              :value="type.name"
            />
          </el-option-group>
          <el-option-group label="优秀表现">
            <el-option
              v-for="type in behaviorTypes.filter(t => t.category === '优秀')"
              :key="type.id"
              :label="type.name"
              :value="type.name"
            />
          </el-option-group>
        </el-select>
        <el-button type="primary" @click="handleAdd">
          添加记录
        </el-button>
      </div>
    </div>

    <el-table 
      :data="filteredBehaviors" 
      style="width: 100%"
      v-loading="loading"
    >
      <el-table-column prop="student_name" label="学生姓名" sortable />
      <el-table-column prop="grade" label="年级" sortable width="100" />
      <el-table-column prop="class" label="班级" sortable width="100" />
      <el-table-column prop="behavior_type" label="行为类型" width="120">
        <template #default="scope">
          <el-tag :type="getBehaviorType(scope.row.behavior_type)">
            {{ scope.row.behavior_type }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="description" label="描述" show-overflow-tooltip />
      <el-table-column label="图片" width="100">
        <template #default="scope">
          <div class="image-container">
            <div class="image-preview" v-if="scope.row.image_url">
              <el-image
                :src="scope.row.image_url"
                :preview-src-list="[scope.row.image_url]"
                fit="cover"
                :initial-index="0"
                :preview-teleported="true"
                :hide-on-click-modal="false"
                class="behavior-image"
                @load="handleImageLoad(scope.row)"
                @error="handleImageLoadError(scope.row)"
              >
                <template #error>
                  <div class="image-error">
                    <el-icon><Picture /></el-icon>
                  </div>
                </template>
                <template #placeholder>
                  <div class="image-loading">
                    <el-icon><Loading /></el-icon>
                  </div>
                </template>
              </el-image>
            </div>
            <span v-else class="no-image">无图片</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="date" label="记录时间" sortable width="180">
        <template #default="scope">
          {{ new Date(scope.row.date).toLocaleString() }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="scope">
          <el-button
            size="small"
            type="primary"
            @click="handleEdit(scope.row)"
          >修改</el-button>
          <el-button
            size="small"
            type="danger"
            @click="handleDelete(scope.row)"
          >删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 添加/修改行为记录对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="form.id ? '修改行为记录' : '添加行为记录'"
      width="600px"
    >
      <el-form :model="form" label-width="100px" :rules="rules" ref="formRef">
        <el-form-item label="学生" prop="student_id">
          <el-select 
            v-model="form.student_id" 
            placeholder="请选择学生"
            filterable
            style="width: 100%"
            :disabled="!!form.id"
          >
            <el-option
              v-for="student in students"
              :key="student.id"
              :label="student.name"
              :value="student.id"
            >
              <span>{{ student.name }}</span>
              <span style="float: right; color: #8492a6; font-size: 13px">
                {{ student.grade }} {{ student.class }}
              </span>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="行为类型" prop="behavior_type">
          <el-select 
            v-model="form.behavior_type" 
            placeholder="请选择行为类型"
            style="width: 100%"
          >
            <el-option-group label="违纪行为">
              <el-option
                v-for="type in behaviorTypes.filter(t => t.category === '违纪')"
                :key="type.id"
                :label="type.name"
                :value="type.name"
              />
            </el-option-group>
            <el-option-group label="优秀表现">
              <el-option
                v-for="type in behaviorTypes.filter(t => t.category === '优秀')"
                :key="type.id"
                :label="type.name"
                :value="type.name"
              />
            </el-option-group>
          </el-select>
        </el-form-item>
        <el-form-item label="时间" prop="date">
          <el-date-picker
            v-model="form.date"
            type="datetime"
            placeholder="选择日期时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
            :default-time="new Date(2000, 1, 1, 0, 0, 0)"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入具体描述"
          />
        </el-form-item>
        <el-form-item label="图片">
          <el-upload
            class="behavior-image-uploader"
            :action="`/api/upload`"
            :show-file-list="false"
            :before-upload="beforeImageUpload"
            :headers="uploadHeaders"
            :on-success="handleImageSuccess"
            :on-error="handleImageError"
          >
            <img v-if="form.image_url" :src="getImageUrl(form.image_url)" class="behavior-image" />
            <el-icon v-else class="behavior-image-uploader-icon"><Plus /></el-icon>
          </el-upload>
          <div class="el-upload__tip">
            支持 jpg/png 文件，且不超过 2MB
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitting">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Picture, Loading } from '@element-plus/icons-vue'

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const behaviors = ref([])
const students = ref([])
const behaviorTypes = ref([])
const filterGrade = ref('')
const filterType = ref('')
const formRef = ref(null)

const form = ref({
  id: null,
  student_id: '',
  behavior_type: '',
  description: '',
  date: new Date().toISOString(),
  image_url: ''
})

const rules = {
  student_id: [
    { required: true, message: '请选择学生', trigger: 'change' }
  ],
  behavior_type: [
    { required: true, message: '请选择行为类型', trigger: 'change' }
  ],
  description: [
    { required: true, message: '请输入描述', trigger: 'blur' },
    { max: 200, message: '最多输入200个字符', trigger: 'blur' }
  ],
  date: [
    { required: true, message: '请选择时间', trigger: 'change' }
  ]
}

// 过滤后的行为记录
const filteredBehaviors = computed(() => {
  let result = [...behaviors.value]
  
  // 年级筛选
  if (filterGrade.value) {
    result = result.filter(behavior => {
      const student = students.value.find(s => s.id === behavior.student_id)
      return student && student.grade === filterGrade.value
    })
  }

  // 行为类型筛选
  if (filterType.value) {
    result = result.filter(behavior => behavior.behavior_type === filterType.value)
  }
  
  return result
})

// 获取行为记录列表
const fetchBehaviors = async () => {
  try {
    loading.value = true
    const response = await axios.get('/api/behaviors')
    behaviors.value = response.data
  } catch (error) {
    console.error('获取行为记录失败:', error)
    ElMessage.error('获取行为记录失败')
  } finally {
    loading.value = false
  }
}

// 获取学生列表
const fetchStudents = async () => {
  try {
    const response = await axios.get('/api/students')
    students.value = response.data
  } catch (error) {
    console.error('获取学生列表失败:', error)
    ElMessage.error('获取学生列表失败')
  }
}

// 获取行为类型列表
const fetchBehaviorTypes = async () => {
  try {
    const response = await axios.get('/api/behavior-types')
    behaviorTypes.value = response.data
  } catch (error) {
    console.error('获取行为类型失败:', error)
    ElMessage.error('获取行为类型失败')
  }
}

// 获取行为类型标签样式
const getBehaviorType = (type) => {
  const behaviorType = behaviorTypes.value.find(t => t.name === type)
  return behaviorType?.category === '违纪' ? 'danger' : 'success'
}

// 添加上传相关的方法
const uploadHeaders = computed(() => ({
  'Authorization': `Bearer ${localStorage.getItem('token')}`
}))

const beforeImageUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB!')
    return false
  }
  return true
}

const handleImageSuccess = (response) => {
  form.value.image_url = response.url
  ElMessage.success('图片上传成功')
}

const handleImageError = () => {
  ElMessage.error('图片上传失败')
}

// 修改添加行为记录的方法
const handleAdd = () => {
  form.value = {
    id: null,
    student_id: '',
    behavior_type: '',
    description: '',
    date: new Date().toISOString().slice(0, 19).replace('T', ' '),
    image_url: ''
  }
  dialogVisible.value = true
}

// 修改行为记录
const handleEdit = (row) => {
  form.value = {
    id: row.id,
    student_id: row.student_id,
    behavior_type: row.behavior_type,
    description: row.description,
    date: row.date,
    image_url: row.image_url
  }
  dialogVisible.value = true
}

// 修改提交表单的处理
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    
    submitting.value = true
    
    const requestData = {
      student_id: parseInt(form.value.student_id),
      behavior_type: form.value.behavior_type,
      description: form.value.description.trim(),
      date: form.value.date,
      image_url: form.value.image_url
    }

    let response
    if (form.value.id) {
      // 修改现有记录
      response = await axios.put(`/api/behaviors/${form.value.id}`, requestData)
      // 更新本地数据
      const index = behaviors.value.findIndex(b => b.id === form.value.id)
      if (index !== -1) {
        behaviors.value[index] = response.data
      }
      ElMessage.success('修改成功')
    } else {
      // 添加新记录
      response = await axios.post('/api/behaviors', requestData)
      behaviors.value.unshift(response.data)
      ElMessage.success('添加成功')
    }
    
    dialogVisible.value = false
  } catch (error) {
    console.error('提交失败:', error.response?.data || error)
    ElMessage.error(error.response?.data?.message || '提交失败')
  } finally {
    submitting.value = false
  }
}

// 删除行为记录
const handleDelete = (row) => {
  ElMessageBox.confirm(
    '确定要删除这条记录吗？删除后不可恢复。',
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
    .then(async () => {
      try {
        await axios.delete(`/api/behaviors/${row.id}`)
        ElMessage.success('删除成功')
        fetchBehaviors()
      } catch (error) {
        console.error('删除行为记录失败:', error)
        ElMessage.error('删除失败')
      }
    })
    .catch(() => {})
}

// 处理筛选
const handleFilter = () => {
  // 筛选会自动通过计算属性处理
}

const getImageUrl = (url) => {
  if (!url) return ''
  // 如果已经是完整URL，直接返回
  if (url.startsWith('http') || url.startsWith('/api/')) {
    return url
  }
  // 否则添加API前缀
  return `/api/uploads/${url.split('/').pop()}`
}

// 图片加载处理
const handleImageLoad = (row) => {
  if (row.imageLoadError) {
    row.imageLoadError = false
  }
}

const handleImageLoadError = (row) => {
  row.imageLoadError = true
}

onMounted(() => {
  fetchBehaviors()
  fetchStudents()
  fetchBehaviorTypes()
})
</script>

<style scoped>
.behaviors-container {
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

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.image-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 50px;
}

.behavior-image-thumb {
  width: 50px !important;
  height: 50px !important;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
  object-fit: cover;
  border: 1px solid #ebeef5;
}

.behavior-image-thumb:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.image-placeholder,
.image-error {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 50px;
  height: 50px;
  background-color: #f5f7fa;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  color: #909399;
}

.no-image {
  color: #909399;
  font-size: 12px;
}

.is-loading {
  animation: rotating 2s linear infinite;
}

@keyframes rotating {
  0% {
    transform: rotateZ(0deg);
  }
  100% {
    transform: rotateZ(360deg);
  }
}

.behavior-image {
  width: 100px;
  height: 100px;
  display: block;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid #ebeef5;
}

.behavior-image-uploader {
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
}

.behavior-image-uploader:hover {
  border-color: var(--el-color-primary);
}

.behavior-image-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 100px;
  height: 100px;
  text-align: center;
  line-height: 100px;
}

.el-upload__tip {
  font-size: 12px;
  color: #606266;
  margin-top: 5px;
}

.image-preview {
  display: flex;
  justify-content: center;
  align-items: center;
}

.image-loading {
  width: 50px;
  height: 50px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f7fa;
  border-radius: 4px;
}
</style> 