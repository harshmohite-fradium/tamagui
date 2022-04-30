import { createFiraMonoFont } from '@tamagui/font-fira-mono'
import { createInterFont } from '@tamagui/font-inter'
import { createSilkscreenFont } from '@tamagui/font-silkscreen'
import { shorthands } from '@tamagui/shorthands'
import { color, radius, size, space, themes, zIndex } from '@tamagui/theme-base'
import { createTamagui, createTokens } from 'tamagui'

import { animations } from './constants/animations'
import { media } from './constants/media'

const silkscreenFont = createSilkscreenFont()
const headingFont = createInterFont({
  transform: {
    6: 'uppercase',
    7: 'none',
  },
  weight: {
    6: '400',
    7: '700',
  },
  letterSpacing: {
    5: 2,
    6: 1,
    7: 0,
    8: -1,
    9: -2,
    10: -3,
    12: -4,
    14: -5,
    15: -6,
  },
})
const bodyFont = createInterFont(
  {},
  {
    sizeLineHeight: (size) => size + 14,
  }
)
const firaFont = createFiraMonoFont()

const tokens = createTokens({
  font: {
    heading: headingFont,
    body: bodyFont,
    mono: firaFont,
    silkscreen: silkscreenFont,
  },
  size,
  space,
  zIndex,
  color,
  radius,
})

const config = createTamagui({
  animations,
  media,
  defaultTheme: 'light',
  shorthands,
  themes,
  tokens,
})

export type Conf = typeof config

declare module 'tamagui' {
  interface TamaguiCustomConfig extends Conf {}
}

export default config
