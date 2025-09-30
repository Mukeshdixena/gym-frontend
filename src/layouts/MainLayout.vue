<template>
  <div class="main-layout">
    <nav class="navbar">
      <router-link to="/">Dashboard</router-link>
      <router-link to="/members">Members</router-link>
    </nav>
    <main class="content">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.main-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.navbar {
  display: flex;
  gap: 20px;
  padding: 10px 20px;
  background-color: #2c3e50;
}

.navbar a {
  color: #ecf0f1;
  text-decoration: none;
  font-weight: bold;
}

.navbar a.router-link-active {
  text-decoration: underline;
}

.content {
  flex: 1;
  padding: 20px;
}
</style>
