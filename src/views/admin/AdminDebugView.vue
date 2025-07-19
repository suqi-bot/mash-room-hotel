<template>
  <div class="admin-debug">
    <h1>调试功能已移除</h1>
    <p>此页面已被移除，请返回管理后台。</p>
    <router-link to="/admin/dashboard" class="btn">返回管理后台</router-link>
  </div>
</template>

<script setup lang="ts">
// 临时文件，用于解决构建问题
</script>

<style scoped>
.admin-debug {
  padding: 2rem;
  text-align: center;
}

.btn {
  display: inline-block;
  padding: 0.5rem 1rem;
  background: #007bff;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  margin-top: 1rem;
}
</style>
