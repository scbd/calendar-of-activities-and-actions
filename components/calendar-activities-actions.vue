<template>
  <section class="activities-explorer">
    <div class="container py-3">
      <h2>Activities & Actions Explorer</h2>

      <p class="lead">This is a static scaffolding example. Interactive filters and data loading are intentionally removed.</p>

      <div class="card mb-3">
        <div class="card-body">
          <p class="m-0">Filters go here</p>
        </div>
      </div>

      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Type</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Example Item</td>
              <td>Meeting</td>
              <td>Planned</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="d-flex justify-content-end gap-2 mt-2">
        <button type="button">Prev</button>
        <span>Page 1 / 1</span>
        <button type="button">Next</button>
      </div>
  </div>
</section>
</template>

<script setup lang="ts">
// Component logic will go here
</script>

<style scoped>
/* Component styles */
</style>