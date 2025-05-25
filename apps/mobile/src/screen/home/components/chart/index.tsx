import React, {FunctionComponent, useLayoutEffect} from 'react';
import {YAxis} from '../../../../components/axis';
import {ColorPalette} from '../../../../styles';
import {defaultSpringConfig} from '../../../../styles/spring';
import Svg, {Defs, LinearGradient, Path, Rect, Stop} from 'react-native-svg';
import Reanimated, {
  useAnimatedProps,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const ReanimatedPath = Reanimated.createAnimatedComponent(Path);

export const DualChart: FunctionComponent<{
  first: { weight: number };
  second: { weight: number };
  highlight: 'first' | 'second';
  isNotReady?: boolean;
}> = ({first, second, highlight, isNotReady}) => {
  const width = 262;
  const height = 168;

  const x = 134;
  const y = 130;
  const angle = 208;
  const radius = 120;
  const stroke = 12;

  const startAngle = 180 - angle / 2 + 90;
  const endAngle = 180 - angle / 2 + 90 + angle;

  const firstArcEndAngle = (() => {
    const fullWeight = first.weight + second.weight;
    return fullWeight > 0 ? startAngle + (first.weight / fullWeight) * angle : startAngle;
  })();

  const dashOffset = useSharedValue(0);

  useLayoutEffect(() => {
    const targetOffset = highlight === 'first' ? 0 : calculateDashOffset(firstArcEndAngle);
    dashOffset.value = withSpring(targetOffset, defaultSpringConfig);
  }, [highlight, firstArcEndAngle]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: dashOffset.value,
  }));

  const pathLength = calculatePathLength(radius, angle);

  return (
    <YAxis alignX="center">
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        <Defs>
          <LinearGradient id="linear" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#303032" />
            <Stop offset="100%" stopColor="#E3E8FF" />
          </LinearGradient>
        </Defs>

        {/* Background ring */}
        <Path
          d={getArcPath({x, y, radius, startAngle, endAngle})}
          stroke={isNotReady ? ColorPalette['gray-600'] : ColorPalette['gray-500']}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
        />

        {/* Animated arc */}
        <ReanimatedPath
          d={getArcPath({x, y, radius, startAngle, endAngle})}
          stroke="url(#linear)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={pathLength}
          animatedProps={animatedProps}
          fill="none"
        />
      </Svg>
    </YAxis>
  );
};

// Helper to calculate path length for stroke-dasharray
const calculatePathLength = (radius: number, angle: number) => {
  return (Math.PI * radius * angle) / 180;
};

// Helper to calculate dash offset based on angle
const calculateDashOffset = (angle: number) => {
  return (Math.PI * 120 * (208 - angle)) / 180; // 120 = radius, 208 = total angle
};

// Keep your existing getArcPath
const getArcPath = (opts: {
  x: number;
  y: number;
  radius: number;
  startAngle: number;
  endAngle: number;
}) => {
  const {x, y, startAngle, endAngle, radius} = opts;
  const startX = x - Math.cos(((180 - startAngle) * Math.PI) / 180) * radius;
  const startY = y + Math.sin(((180 - startAngle) * Math.PI) / 180) * radius;
  const endX = x - Math.cos(((180 - endAngle) * Math.PI) / 180) * radius;
  const endY = y + Math.sin(((180 - endAngle) * Math.PI) / 180) * radius;

  return `M ${startX} ${startY} A ${radius} ${radius} 0 ${
    Math.abs(startAngle - endAngle) <= 180 ? 0 : 1
  } 1 ${endX} ${endY}`;
};