<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { HomeFilled, User, List, Setting, SwitchButton, TrendCharts } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const router = useRouter()

const isLoggedIn = computed(() => {
  return localStorage.getItem('token')
})

const handleLogout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('userInfo')
  router.push('/login')
  ElMessage.success('退出登录成功')
}
</script>

<template>
  <div class="app-container">
    <el-container v-if="isLoggedIn">
      <el-header>
        <div class="header-content">
          <div class="header-left">
            <h2 class="logo">学生行为管理系统</h2>
            <el-menu
              mode="horizontal"
              :default-active="$route.path"
              router
              class="main-menu"
            >
              <el-menu-item index="/dashboard">
                <el-icon><HomeFilled /></el-icon>
                <span>首页</span>
              </el-menu-item>
              
              <el-sub-menu index="student-management">
                <template #title>
                  <el-icon><User /></el-icon>
                  <span>学生管理</span>
                </template>
                <el-menu-item index="/students">学生列表</el-menu-item>
                <el-menu-item index="/student-import">学生导入</el-menu-item>
              </el-sub-menu>
              
              <el-sub-menu index="behavior-management">
                <template #title>
                  <el-icon><List /></el-icon>
                  <span>行为管理</span>
                </template>
                <el-menu-item index="/behaviors">行为记录</el-menu-item>
                <el-menu-item index="/behavior-types">行为类型</el-menu-item>
              </el-sub-menu>
              
              <el-sub-menu index="analysis">
                <template #title>
                  <el-icon><TrendCharts /></el-icon>
                  <span>统计分析</span>
                </template>
                <el-menu-item index="/analysis">行为分析</el-menu-item>
                <el-menu-item index="/reports">统计报表</el-menu-item>
              </el-sub-menu>
            </el-menu>
          </div>
          <el-button type="danger" @click="handleLogout">
            <el-icon><SwitchButton /></el-icon>
            退出登录
          </el-button>
        </div>
      </el-header>
      <el-main>
        <router-view></router-view>
      </el-main>
    </el-container>
    <router-view v-else></router-view>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
  width: 100%;
}

#app {
  height: 100vh;
  width: 100vw;
}

.app-container {
  height: 100vh;
}

.el-container {
  height: 100%;
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

.header-left {
  display: flex;
  align-items: center;
}

.logo {
  margin-right: 40px;
  color: #409EFF;
}

.main-menu {
  border-bottom: none;
}

.el-main {
  padding: 20px;
  background-color: #f0f2f5;
}

.el-menu-item, .el-sub-menu {
  font-size: 14px;
}

.el-menu--horizontal > .el-sub-menu .el-sub-menu__title {
  height: 60px;
  line-height: 60px;
}

.el-menu--horizontal > .el-menu-item {
  height: 60px;
  line-height: 60px;
}

.el-sub-menu__title {
  display: flex;
  align-items: center;
}

.el-sub-menu__title .el-icon {
  margin-right: 5px;
}
</style>
