import React, { useContext} from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import TabBarIcon from './Components/TabBarIcon';
import ItemsList from './Components/ItemsList';
import ScreenWrapper from './Components/ScreenWrapper';

import ProfileScreen from './Screens/ProfileScreen';
import MeetUpScreen from './Screens/MeetUpScreen';
import SettingsScreen from './Screens/SettingsScreen';
import ChangeSettingsScreen from './Screens/ChangeSettingsScreen';
import MapScreen from './Screens/MapScreen';

import { Colors, Padding, Font, Icon, ContainerStyle } from './Utils/Style';
import { ThemeProvider, ThemeContext } from './Components/ThemeContext';



const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MapScreenWrapper() {
  return (
    <ScreenWrapper>
      <MapScreen/>
    </ScreenWrapper>
  );
}

function HomeScreenWrapper() {
  return (
    <ScreenWrapper>
      <ItemsList type='diet'/>
    </ScreenWrapper>
  );
}

function SettingsScreenWrapper() {
  return (
    <ScreenWrapper>
      <SettingsScreen />
    </ScreenWrapper>
  );
}

function BottomTabs() {
  const { theme } = useContext(ThemeContext);

  return (
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused }) => (
          <TabBarIcon 
            routeName={route.name}
            iconStyle={{ color: focused ? Colors.secondary : Colors.tertiary}}
            />
          ),
          tabBarStyle: {
            backgroundColor: theme.headerColor,
          },
          headerShown: false,
          tabBarActiveTintColor: Colors.secondary,
          tabBarInactiveTintColor: Colors.tertiary,
        })}
      >
        <Tab.Screen 
          name="Map" 
          component={MapScreenWrapper} 
          options={() => ({ 
            headerTintColor: Colors.tertiary,
          })}  
        />
        <Tab.Screen 
          name="Home" 
          component={HomeScreenWrapper} 
          options={({ navigation }) => ({ 
            headerTintColor: Colors.tertiary,
          })}  
        />
        <Tab.Screen 
          name="Settings" 
          component={SettingsScreenWrapper} 
          options={{
            headerTintColor: Colors.tertiary,
          }}
        />
      </Tab.Navigator>
  );
}
export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

function AppContent() {
  const { theme } = useContext(ThemeContext);

  return (
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerStyle: {
              backgroundColor: theme.headerColor,
            },
          }}
        >
          <Stack.Screen 
            name="Back" 
            component={BottomTabs} 
            options={{ 
              headerShown: false 
            }}
          />
          <Stack.Screen 
            name="Profile" 
            component={ProfileScreen} 
            options={{ 
              title: 'My Profile', 
              headerTintColor: Colors.tertiary,
            }}
          />
          <Stack.Screen 
            name="MeetUp" 
            component={MeetUpScreen} 
            options={{ 
              headerTintColor: Colors.tertiary,
              headerShown: true,
            }}
          />
          <Stack.Screen 
            name="ChangeSettings" 
            component={ChangeSettingsScreen} 
            options={{ 
              headerTintColor: Colors.tertiary,
              headerShown: true,
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  addIcon: {
    color: Colors.tertiary,
    fontSize: Font.sizeMedium,
  },
  addIconContainer: {
    flexDirection: ContainerStyle.flexDirection,
    paddingRight: Padding.xxlarge,
  },
});