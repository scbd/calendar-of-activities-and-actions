<template>
  <Transition name="fade">
    <button
      v-show="isVisible"
      type="button"
      class="back-to-top-btn"
      :aria-label="t('calendar.messages.backToTop')"
      :title="t('calendar.messages.backToTop')"
      @click="scrollToTop"
    >
      <FontAwesomeIcon icon="arrow-up" />
    </button>
  </Transition>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useI18n } from '#imports';

const { t } = useI18n();

const isVisible = ref(false);

const handleScroll = () => {
  isVisible.value = window.scrollY > window.innerHeight;
};

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});
</script>

<style scoped>
.back-to-top-btn {
  position: fixed;
  bottom: 33vh;
  right: 2rem;
  z-index: 1050;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  border: none;
  border-radius: 50%;
  background-color: var(--bs-primary, #0d6efd);
  color: #fff;
  font-size: 1.1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
  cursor: pointer;
  transition: opacity 0.2s ease, transform 0.2s ease, background-color 0.2s ease;
  opacity: 0.85;
}

.back-to-top-btn:hover {
  opacity: 1;
  background-color: var(--bs-primary, #0b5ed7);
  transform: translateY(-2px);
}

.back-to-top-btn:focus-visible {
  outline: 2px solid var(--bs-primary, #0d6efd);
  outline-offset: 2px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
