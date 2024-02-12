import React, { memo } from 'react'
import PropTypes from 'prop-types'
import type { IconProps } from '@tamagui/helpers-icon'
import {
  Svg,
  Circle as _Circle,
  Ellipse,
  G,
  LinearGradient,
  RadialGradient,
  Line,
  Path,
  Polygon,
  Polyline,
  Rect,
  Symbol,
  Text as _Text,
  Use,
  Defs,
  Stop,
} from 'react-native-svg'
import { themed } from '@tamagui/helpers-icon'

const Icon = (props) => {
  const { color = 'black', size = 24, ...otherProps } = props
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...otherProps}
    >
      <Rect width="14" height="8" x="5" y="2" rx="2" stroke={color} />
      <Rect width="20" height="8" x="2" y="14" rx="2" stroke={color} />
      <Path d="M6 18h2" stroke={color} />
      <Path d="M12 18h6" stroke={color} />
    </Svg>
  )
}

Icon.displayName = 'Computer'

export const Computer = memo<IconProps>(themed(Icon))
