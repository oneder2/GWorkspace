import { ref } from 'vue'
import { aiApi } from '../utils/api'

const capsule = ref(null)
const isLoading = ref(false)
let pendingRequest = null

export function useDailyCapsule() {
  const loadDailyCapsule = async ({ force = false } = {}) => {
    if (!force && capsule.value) {
      return capsule.value
    }

    if (!force && pendingRequest) {
      return pendingRequest
    }

    isLoading.value = true
    pendingRequest = aiApi.getDailyCapsule()
      .then((result) => {
        capsule.value = result
        return result
      })
      .finally(() => {
        isLoading.value = false
        pendingRequest = null
      })

    return pendingRequest
  }

  return {
    capsule,
    isLoading,
    loadDailyCapsule
  }
}
