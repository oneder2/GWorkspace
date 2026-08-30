<template>
  <div class="writing-page animate-fade-in">
    <div v-if="!isInitialized" class="writing-loading">{{ $t('common.loading') }}</div>
    <OwnerWritingStudio v-else-if="isAdmin" :user="user" />
    <GuestWritingLab v-else @open-auth="showAuthModal = true" />
    <AuthModal v-if="showAuthModal" default-mode="login" @close="showAuthModal = false" @success="handleAuthSuccess" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import AuthModal from '../components/AuthModal.vue'
import GuestWritingLab from '../components/writing/GuestWritingLab.vue'
import OwnerWritingStudio from '../components/writing/OwnerWritingStudio.vue'
import { useAuth } from '../composables/useAuth'

const { user, isAdmin, isInitialized } = useAuth()
const showAuthModal = ref(false)

function handleAuthSuccess() {
  showAuthModal.value = false
}
</script>

<style>
@import '../styles/pages/ToolsPage.css';
</style>
