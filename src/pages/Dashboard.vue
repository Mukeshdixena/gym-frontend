<template>
  <div class="container-fluid">
    <h2 class="mb-4">Dashboard</h2>

    <!-- Cards row -->
    <div class="row mb-4">
      <div class="col-md-3 mb-3" v-for="card in cards" :key="card.title">
        <div class="card text-white" :class="card.bg">
          <div class="card-body">
            <h5 class="card-title">{{ card.title }}</h5>
            <p class="card-text display-6">{{ card.value }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Members Table -->
    <h4>Recent Members</h4>
    <table class="table table-striped table-hover">
      <thead class="table-dark">
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Phone</th>
          <th>Membership Type</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="member in members" :key="member.id">
          <td>{{ member.name }}</td>
          <td>{{ member.email }}</td>
          <td>{{ member.phone }}</td>
          <td>{{ member.membership }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
interface Card {
  title: string;
  value: number;
  bg: string;
}

const cards: Card[] = [
  { title: 'Total Members', value: 120, bg: 'bg-primary' },
  { title: 'Active Trainers', value: 8, bg: 'bg-success' },
  { title: 'Classes Today', value: 5, bg: 'bg-warning' },
  { title: 'Pending Payments', value: 3, bg: 'bg-danger' },
];

interface Member {
  id: number;
  name: string;
  email: string;
  phone: string;
  membership: string;
}

const members: Member[] = [
  { id: 1, name: 'John Doe', email: 'john@example.com', phone: '9876543210', membership: 'Gold' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', phone: '9876543211', membership: 'Silver' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', phone: '9876543212', membership: 'Platinum' },
];
</script>
