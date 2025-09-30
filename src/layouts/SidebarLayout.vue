<template>
  <div class="d-flex vh-100">
    <!-- Sidebar -->
    <aside class="bg-dark text-light p-3" style="width: 220px;">
      <h2 class="mb-4">GymApp</h2>
      <nav class="nav flex-column">
        <router-link to="/" class="nav-link text-light" active-class="active">Dashboard</router-link>
        <router-link to="/members" class="nav-link text-light" active-class="active">Members</router-link>
        <router-link to="/trainers" class="nav-link text-light" active-class="active">Trainers</router-link>
        <router-link to="/classes" class="nav-link text-light" active-class="active">Classes</router-link>
      </nav>
    </aside>

    <!-- Main content -->
    <div class="flex-grow-1 d-flex flex-column">
      <header class="bg-light p-3 border-bottom">
        <h3>Welcome to Gym Management</h3>
      </header>
      <main class="flex-grow-1 p-3 bg-light">
        <router-view />
      </main>
    </div>
  </div>
</template>
