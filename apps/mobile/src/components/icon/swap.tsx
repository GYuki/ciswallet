import React, {FunctionComponent} from 'react';
import {IconProps} from './types';
import {Defs, Path, Svg, G, ClipPath, Rect} from 'react-native-svg';

export const SwapIcon: FunctionComponent<IconProps> = ({size, color}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <G clipPath="url(#clip0_12491_1417)">
        <Path d="M12.7778 9L7.88889 4M7.88889 4L3 9M7.88889 4V24M15.2222 19L20.1111 24M20.1111 24L25 19M20.1111 24V4" stroke={color || "currentColor"} stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      </G>
      <Defs>
        <ClipPath id="clip0_12491_1417">
          <Rect width="28" height="28" fill="white" />
        </ClipPath>
      </Defs>
    </Svg>
  );
};
