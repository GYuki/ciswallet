import {useNavigation} from '@react-navigation/native';
import React, {FunctionComponent} from 'react';
import {StackNavProp} from '../../navigation';
import {PageWithScrollView} from '../../components/page';
import {PageButton} from './components/page-button';
import {ArrowRightIcon} from '../../components/icon/arrow-right';
import {useStyle} from '../../styles';
import {useIntl} from 'react-intl';
import {Box} from '../../components/box';
import {Stack} from '../../components/stack';
import {SettingIcon} from '../../components/icon';
import {KeyIcon} from '../../components/icon/key';

export const SettingScreen: FunctionComponent = () => {
  const navigate = useNavigation<StackNavProp>();
  const style = useStyle();
  const intl = useIntl();
  return (
    <PageWithScrollView backgroundMode={'default'}>
      <Box paddingX={12} paddingTop={8}>
        <Stack gutter={8}>
          <PageButton
            title={intl.formatMessage({id: 'page.setting.general-title'})}
            paragraph={intl.formatMessage({
              id: 'page.setting.general-paragraph',
            })}
            titleIcon={
              <SettingIcon
                size={16}
                color={style.get('color-text-high').color}
              />
            }
            endIcon={
              <ArrowRightIcon
                size={24}
                color={style.get('color-text-low').color}
              />
            }
            onClick={() => navigate.navigate('Setting.General')}
          />

          <PageButton
            title={intl.formatMessage({
              id: 'page.setting.security-privacy-title',
            })}
            paragraph={intl.formatMessage({
              id: 'page.setting.security-privacy-paragraph',
            })}
            titleIcon={
              <KeyIcon size={16} color={style.get('color-text-high').color} />
            }
            endIcon={
              <ArrowRightIcon
                size={24}
                color={style.get('color-text-low').color}
              />
            }
            onClick={() => navigate.navigate('Setting.SecurityAndPrivacy')}
          />

          {/* <PageButton
            title={intl.formatMessage({
              id: 'page.setting.manage-token-list-title',
            })}
            paragraph={intl.formatMessage({
              id: 'page.setting.manage-token-list-paragraph',
            })}
            endIcon={
              <ArrowRightIcon
                size={24}
                color={style.get('color-text-low').color}
              />
            }
            onClick={() => navigate.navigate('Setting.ManageTokenList')}
          /> */}
        </Stack>
      </Box>
    </PageWithScrollView>
  );
};
