import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {observer} from 'mobx-react-lite';
import {useStore} from '../../stores';
import {FormattedMessage, useIntl} from 'react-intl';
import {useStyle} from '../../styles';
import {
  AppState,
  BackHandler,
  Dimensions,
  Keyboard,
  Platform,
  ScaledSize,
  Text,
} from 'react-native';
import {Box} from '../box';
import LottieView from 'lottie-react-native';
import {Gutter} from '../gutter';
import {TextInput} from '../input';
import {Button} from '../button';
import {TextButton} from '../text-button';
import delay from 'delay';
import {NeedHelpModal} from '../modal';
import Bugsnag from '@bugsnag/react-native';
import {registerModal} from '../modal/v2';
import {TouchableWithoutFeedback} from 'react-native-gesture-handler';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Reanimated, {
  useAnimatedKeyboard,
  useAnimatedStyle,
} from 'react-native-reanimated';
import {ScreenBackground} from '../page';

export const AutoLockUnlockModal = registerModal(
  observer(({unlock}: {unlock: () => void}) => {
    const {keyRingStore, keychainStore} = useStore();

    const [deviceSize, setDeviceSize] = useState<{
      width: number;
      height: number;
    }>(() => {
      const window = Dimensions.get('window');
      return {
        width: window.width,
        height: window.height,
      };
    });
    useLayoutEffect(() => {
      const fn = ({window}: {window: ScaledSize}) => {
        setDeviceSize({
          width: window.width,
          height: window.height,
        });
      };

      const listener = Dimensions.addEventListener('change', fn);
      return () => {
        listener.remove();
      };
    }, []);

    const intl = useIntl();
    const style = useStyle();

    const [isOpenHelpModal, setIsOpenHelpModal] = useState(false);

    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isBiometricLoading, setIsBiometricLoading] = useState(false);
    const [error, setError] = useState<Error | undefined>();

    //NOTE 안드로이드에서 Lock 모달이 있을때 뒤로가기 하면 기존 unlock페이지의 로직처럼 앱을 닫게 해야함
    useEffect(() => {
      const listener = BackHandler.addEventListener('hardwareBackPress', () => {
        BackHandler.exitApp();
        return true;
      });
      return () => {
        listener.remove();
      };
    }, []);
    const tryBiometric = async () => {
      try {
        setIsBiometricLoading(true);
        //NOTE 실제 lock 페이지와 비슷한 로딩 효과를 주기위해서 의도적으로 500 밀리초로 설정함
        await delay(500);
        const bioPassword = await keychainStore.getPasswordWithBiometry();
        const isCorrect = await keyRingStore.checkPassword(bioPassword);
        if (isCorrect) {
          unlock();
          // 모달이 내려가는 중에 다시 auto lock으로 인해서 lock이 되면 이전의 password가 남아있는 경우가 있음
          // 그래서 따로 지워줌
          setPassword('');
        }
      } catch (e) {
        console.log(e);

        if (
          e.message !== 'User password mac unmatched' &&
          !e.message?.includes('User canceled the operation') &&
          !e.message?.includes('msg: Cancel') &&
          !e.message?.includes('msg: Fingerprint operation cancelled.') &&
          !e.message?.includes('password not set') &&
          !e.message?.includes('Failed to get credentials from keychain') &&
          !e.message?.includes('Failed to authenticate') &&
          !e.message?.includes(
            'The user name or passphrase you entered is not correct.',
          ) &&
          !e.message?.includes('Wrapped error: User not authenticated')
        ) {
          Bugsnag.notify(e);
        }
      } finally {
        setIsBiometricLoading(false);
      }
    };

    const tryBiometricAutoOnce = useRef(false);
    // 그냥 deps 관련 eslint 경고를 피하려고 씀
    const tryBiometricFnRef = useRef(tryBiometric);
    tryBiometricFnRef.current = tryBiometric;
    useEffect(() => {
      const listener = AppState.addEventListener('change', e => {
        if (e === 'active') {
          if (
            !tryBiometricAutoOnce.current &&
            !isLoading &&
            !isBiometricLoading &&
            keychainStore.isBiometrySupported &&
            keychainStore.isBiometryOn
          ) {
            tryBiometricAutoOnce.current = true;

            tryBiometricFnRef.current();
          }
        }
      });

      return () => {
        listener.remove();
      };
    }, [
      isBiometricLoading,
      isLoading,
      keychainStore.isBiometryOn,
      keychainStore.isBiometrySupported,
    ]);

    const tryUnlock = async (password: string) => {
      try {
        setIsLoading(true);
        await delay(500);
        const isCorrect = await keyRingStore.checkPassword(password);
        if (isCorrect) {
          unlock();
          // 모달이 내려가는 중에 다시 auto lock으로 인해서 lock이 되면 이전의 password가 남아있는 경우가 있음
          // 그래서 따로 지워줌
          setPassword('');
          setIsLoading(false);
          return;
        }
        setError({name: 'invalid password', message: 'invalid password'});
      } catch (e) {
        console.log(e);

        if (
          e.message !== 'User password mac unmatched' &&
          !e.message?.includes('User canceled the operation') &&
          !e.message?.includes('msg: Cancel') &&
          !e.message?.includes('msg: Fingerprint operation cancelled.') &&
          !e.message?.includes('password not set') &&
          !e.message?.includes('Failed to get credentials from keychain') &&
          !e.message?.includes('Failed to authenticate') &&
          !e.message?.includes(
            'The user name or passphrase you entered is not correct.',
          ) &&
          !e.message?.includes('Wrapped error: User not authenticated')
        ) {
          Bugsnag.notify(e);
        }

        setIsLoading(false);
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    };

    const onPressSubmit = async () => {
      await tryUnlock(password);
    };

    const safeAreaInsets = useSafeAreaInsets();

    const keyboard = (() => {
      // ios에서만 keyboard height를 고려한다.
      // 안드로이드는 의외로 지혼자 keyboard 처리가 잘 된다...
      // 당연히 platform이 동적으로 바뀔 순 없으므로 linter를 무시한다.
      if (Platform.OS === 'ios') {
        return useAnimatedKeyboard();
      } else {
        return {
          height: {
            value: 0,
          },
        };
      }
    })();

    const viewStyle = useAnimatedStyle(() => {
      return {
        paddingTop: safeAreaInsets.top,
        paddingBottom: Math.max(safeAreaInsets.bottom, keyboard.height.value),
      };
    });

    return (
      <TouchableWithoutFeedback
        onPress={Keyboard.dismiss}
        containerStyle={{
          width: deviceSize.width,
          height: deviceSize.height,
        }}
        style={{
          flex: 1,
        }}>
        <ScreenBackground
          backgroundMode={'default'}
          disableVerticalPadding={true}
        />
        <Reanimated.View
          style={[
            viewStyle,
            {...style.flatten(['height-full', 'padding-x-24'])},
          ]}>
          <Box alignY="center" style={{flexGrow: 1}}>
            <Box style={{flex: 1}} />

            <Box alignX="center">
              <img src={require('../../public/assets/lottie/wallet/logo.png')} alt="" />

              {keyRingStore.needMigration ? (
                <React.Fragment>
                  <Text style={style.flatten(['h1', 'color-text-high'])}>
                    <FormattedMessage id="page.unlock.paragraph-section.keplr-here" />
                  </Text>

                  <Gutter size={12} />

                  <Text style={style.flatten(['subtitle4', 'color-gray-200'])}>
                    <FormattedMessage id="page.unlock.paragraph-section.enter-password-to-upgrade" />
                  </Text>
                </React.Fragment>
              ) : (
                <Text style={style.flatten(['h1', 'color-text-high'])}>
                  <FormattedMessage id="page.unlock.paragraph-section.welcome-back" />
                </Text>
              )}
            </Box>

            <Box>
              <Gutter size={70} />

              <TextInput
                label={intl.formatMessage({
                  id: 'page.unlock.bottom-section.password-input-label',
                })}
                value={password}
                secureTextEntry={true}
                returnKeyType="done"
                onChangeText={setPassword}
                onSubmitEditing={onPressSubmit}
                error={
                  error
                    ? intl.formatMessage({id: 'error.invalid-password'})
                    : undefined
                }
              />

              <Gutter size={34} />

              <Button
                text={
                  keyRingStore.needMigration
                    ? intl.formatMessage({id: 'page.unlock.migration-button'})
                    : intl.formatMessage({id: 'page.unlock.unlock-button'})
                }
                size="large"
                onPress={onPressSubmit}
                loading={isLoading}
                containerStyle={{width: '100%'}}
              />

              <Gutter size={32} />

              {keychainStore.isBiometryOn ? (
                <TextButton
                  text="Use Biometric Authentication"
                  size="large"
                  loading={isBiometricLoading}
                  onPress={async () => {
                    await tryBiometric();
                  }}
                />
              ) : null}
            </Box>

            <Box style={{flex: 1}} />

            <Box>
              <TextButton
                color="faint"
                text={intl.formatMessage({
                  id: 'page.unlock.need-help-button',
                })}
                size="large"
                onPress={() => setIsOpenHelpModal(true)}
              />

              <Gutter size={32} />
            </Box>
          </Box>
        </Reanimated.View>

        <NeedHelpModal
          isOpen={isOpenHelpModal}
          setIsOpen={setIsOpenHelpModal}
        />
      </TouchableWithoutFeedback>
    );
  }),
  {
    openImmediately: Platform.OS === 'android',
  },
);
