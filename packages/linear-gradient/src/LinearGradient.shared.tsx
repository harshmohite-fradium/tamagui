import {
  ColorTokens,
  ThemeTokens,
  getVariable,
  styled,
  useProps,
  useTheme,
} from '@tamagui/core'
import { YStack, YStackProps } from '@tamagui/stacks'
import type { ViewStyle } from 'react-native'

import {
  LinearGradient as ExpoLinearGradient,
  LinearGradientProps as ExpoLinearGradientProps,
} from './linear-gradient'

//
export type LinearGradientProps = Omit<ExpoLinearGradientProps, 'colors'> &
  Omit<YStackProps, 'children' | keyof ExpoLinearGradientProps> & {
    colors?: (ColorTokens | ThemeTokens | (string & {}))[]
  }

export const LinearGradient = YStack.styleable<LinearGradientProps>((propsIn, ref) => {
  const props = useProps(propsIn)

  const { start, end, colors: colorsProp, locations, children, ...stackProps } = props
  const theme = useTheme()

  const colors =
    props.colors?.map((c) => {
      return (theme[c]?.val as string) ?? c
    }) || []

  return (
    <LinearGradientFrame ref={ref as any} {...stackProps}>
      <ExpoLinearGradient
        start={start}
        end={end}
        colors={colors}
        locations={locations}
        style={absoluteFill}
      >
        {children}
      </ExpoLinearGradient>
    </LinearGradientFrame>
  )
})

const absoluteFill: ViewStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
}

const LinearGradientFrame = styled(YStack, {
  name: 'LinearGradient',
  overflow: 'hidden',
  position: 'relative',
})
