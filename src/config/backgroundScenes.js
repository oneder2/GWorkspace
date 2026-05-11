/**
 * 背景场景配置
 * 统一管理场景资源、时段切换、遮罩参数与亮度策略
 */

const LIGHT_OVERLAY_RGB = [
  [255, 255, 255],
  [255, 255, 255],
  [255, 255, 255]
]

const DARK_OVERLAY_RGB = [
  [15, 23, 42],
  [30, 41, 59],
  [15, 23, 42]
]

const rgba = (rgb, opacity) => `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${opacity})`

export const defaultBackgroundSceneId = 'workplace'

export const backgroundScenes = {
  workplace: {
    id: 'workplace',
    label: 'Workplace',
    schedule: [
      { phase: 'dawn', startHour: 5 },
      { phase: 'day', startHour: 8 },
      { phase: 'dusk', startHour: 17 },
      { phase: 'night', startHour: 20 }
    ],
    phases: {
      dawn: {
        src: '/backgrounds/workplace/dawn.webp',
        brightness: 0.92,
        lightOverlay: [0.52, 0.44, 0.58],
        darkOverlay: [0.74, 0.8, 0.84]
      },
      day: {
        src: '/backgrounds/workplace/day.webp',
        brightness: 0.88,
        lightOverlay: [0.58, 0.48, 0.64],
        darkOverlay: [0.78, 0.83, 0.87]
      },
      dusk: {
        src: '/backgrounds/workplace/dusk.webp',
        brightness: 0.94,
        lightOverlay: [0.46, 0.38, 0.52],
        darkOverlay: [0.72, 0.78, 0.82]
      },
      night: {
        src: '/backgrounds/workplace/night.webp',
        brightness: 1.02,
        lightOverlay: [0.4, 0.34, 0.46],
        darkOverlay: [0.68, 0.74, 0.78]
      }
    }
  }
}

/**
 * 根据本地小时数解析当前应当使用的背景相位
 */
export const resolveBackgroundPhase = (
  sceneId = defaultBackgroundSceneId,
  hour = new Date().getHours()
) => {
  const scene = backgroundScenes[sceneId] ?? backgroundScenes[defaultBackgroundSceneId]
  const matchedPhase = [...scene.schedule]
    .reverse()
    .find(({ startHour }) => hour >= startHour)
  const phaseId = matchedPhase?.phase ?? scene.schedule[scene.schedule.length - 1].phase

  return {
    scene,
    phaseId,
    ...scene.phases[phaseId]
  }
}

/**
 * 构建遮罩渐变，保证不同场景只调整透明度参数即可
 */
export const buildOverlayGradient = (stops, mode = 'light') => {
  const palette = mode === 'dark' ? DARK_OVERLAY_RGB : LIGHT_OVERLAY_RGB
  return `linear-gradient(135deg, ${rgba(palette[0], stops[0])} 0%, ${rgba(
    palette[1],
    stops[1]
  )} 50%, ${rgba(palette[2], stops[2])} 100%)`
}
