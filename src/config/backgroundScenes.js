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
        contrast: 1.02,
        saturation: 0.88,
        scale: 1.02,
        focalPoint: '56% 52%',
        mobileFocalPoint: '59% 50%',
        lightOverlay: [0.22, 0.16, 0.28],
        darkOverlay: [0.34, 0.4, 0.44]
      },
      day: {
        src: '/backgrounds/workplace/day.webp',
        brightness: 0.88,
        contrast: 1.04,
        saturation: 0.94,
        scale: 1.02,
        focalPoint: '56% 52%',
        mobileFocalPoint: '59% 50%',
        lightOverlay: [0.26, 0.2, 0.32],
        darkOverlay: [0.38, 0.44, 0.48]
      },
      dusk: {
        src: '/backgrounds/workplace/dusk.webp',
        brightness: 0.94,
        contrast: 1.04,
        saturation: 0.96,
        scale: 1.02,
        focalPoint: '56% 52%',
        mobileFocalPoint: '59% 50%',
        lightOverlay: [0.18, 0.12, 0.24],
        darkOverlay: [0.3, 0.36, 0.4]
      },
      night: {
        src: '/backgrounds/workplace/night.webp',
        brightness: 1.02,
        contrast: 1.08,
        saturation: 0.9,
        scale: 1.02,
        focalPoint: '56% 52%',
        mobileFocalPoint: '59% 50%',
        lightOverlay: [0.14, 0.1, 0.2],
        darkOverlay: [0.24, 0.3, 0.34]
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
