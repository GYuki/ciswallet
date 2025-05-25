import React, {FunctionComponent} from 'react';
// import LottieView from 'lottie-react-native';
import { Image } from 'react-native';
import {useStyle} from '../../../styles';
import {Box} from '../../../components/box';
import {Gutter} from '../../../components/gutter';
import {Text} from 'react-native';
import {FormattedMessage, useIntl} from 'react-intl';
import {Button} from '../../../components/button';
import {TextButton} from '../../../components/text-button';
import {useNavigation} from '@react-navigation/native';
import {StackNavProp} from '../../../navigation';
import {ScrollViewRegisterContainer} from '../components/scroll-view-register-container';

export const RegisterIntroScreen: FunctionComponent = () => {
  const intl = useIntl();
  const style = useStyle();
  const navigation = useNavigation<StackNavProp>();

  return (
    <ScrollViewRegisterContainer
      forceEnableTopSafeArea={true}
      contentContainerStyle={{
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
      {/* <LottieView
        source={require('../../../public/assets/lottie/wallet/logo.json')}
        style={{width: 200, height: 155}}
      /> */}
      <Image 
        source={require('../../../public/assets/lottie/wallet/logo.png')}
        style={{width: 150, height: 125, marginBottom: 25}}
        resizeMode="contain"
      
      /> 
      <Gutter size={10} />

      <Text style={style.flatten(['mobile-h2', 'color-white'])}>
        <FormattedMessage id="pages.register.intro-new-user.title" />
      </Text>

      <Gutter size={100} />

      <Box width="100%" paddingX={36}>
        <Button
          text={intl.formatMessage({
            id: 'pages.register.intro.create-wallet-button',
          })}
          size="large"
          onPress={() => {
            navigation.navigate('Register.NewMnemonic');
          }}
        />

        <Gutter size={16} />

        <Button
          text={intl.formatMessage({
            id: 'pages.register.intro.import-wallet-button',
          })}
          size="large"
          color="secondary"
          onPress={() => {
            navigation.navigate('Register.RecoverMnemonic');
          }}
        />

        <Gutter size={20} />

        {/* <TextButton
          containerStyle={{height: 32}}
          size="large"
          text={intl.formatMessage({
            id: 'pages.register.intro.connect-hardware-wallet-button',
          })}
          onPress={() => {
            navigation.navigate('Register.Intro.ConnectHardware');
          }}
        /> */}
      </Box>
    </ScrollViewRegisterContainer>
  );
};
