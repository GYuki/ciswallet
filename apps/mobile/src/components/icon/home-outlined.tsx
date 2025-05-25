import React, {FunctionComponent} from 'react';
import {IconProps} from './types';
import {Path, Svg} from 'react-native-svg';

export const HomeOutlinedIcon: FunctionComponent<IconProps> = ({
  size,
  color,
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <Path
        d="M11.3884 23.6791V17.0745H16.6058V23.6791C16.6058 24.4056 17.1927 25 17.9101 25H21.8231C22.5405 25 23.1275 24.4056 23.1275 23.6791V14.4326H25.3448C25.9448 14.4326 26.2318 13.6797 25.7753 13.2834L14.871 3.33684C14.3754 2.88772 13.6188 2.88772 13.1232 3.33684L2.21894 13.2834C1.77546 13.6797 2.04937 14.4326 2.64937 14.4326H4.86674V23.6791C4.86674 24.4056 5.45369 25 6.17108 25H10.0841C10.8015 25 11.3884 24.4056 11.3884 23.6791Z"
        stroke={color || 'currentColor'}
        stroke-width="2.2"
      />
    </Svg>
  );
};
