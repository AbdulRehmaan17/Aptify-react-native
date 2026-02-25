import { NavigatorScreenParams } from '@react-navigation/native';
import { AuthStackParamList as ASPList } from './AuthStack';
import { MainTabsParamList } from './MainTabs';

export type AuthStackParamList = ASPList;

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  App: NavigatorScreenParams<MainTabsParamList>;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList { }
  }
}
