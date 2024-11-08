import React, {useContext} from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import { Colors, Padding, Margin, ContainerStyle, Font, Align, BorderRadius, Opacity } from '../Utils/Style';
import { ThemeContext } from '../Components/ThemeContext';
import PressableButton from '../Components/PressableButtons/PressableButton';
import { useNavigation } from '@react-navigation/native';
import profile from '../Screens/ProfileScreen';
import MeetUp from '../Screens/MeetUpScreen';

export default function SettingsScreen() {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const navigation = useNavigation();

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      {/* <Pressable
        style={({ pressed }) => [
          styles.themeButton,
          { 
            backgroundColor: theme.buttonColor,
            opacity: pressed ? Opacity.partialOpaque : Opacity.opaque, 
          }
        ]}
        onPress={toggleTheme}
        android_ripple={{radius: BorderRadius.medium }}
      >
      <Text style={styles.themeButtonText}>
        Toggle Theme
      </Text>
</Pressable> */}
    <PressableButton
      title="My Profile"
      onPress={() => navigation.navigate('Profile')}
    />
    <PressableButton
      title="My Meet-ups"
      onPress={() => navigation.navigate('MeetUp')}
      buttonStyle={{marginTop: Margin.medium}}
    />
        <PressableButton
      title="Settings"
      onPress={() => navigation.navigate('ChangeSettings')}
      buttonStyle={{marginTop: Margin.xxxxlarge}}
    />
    <PressableButton
      title="Support"
      // onPress={() => navigation.navigate('MeetUp')}
      buttonStyle={{marginTop: Margin.medium}}
    />
    
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: ContainerStyle.flex,
    padding: Padding.xlarge,
  },
  themeButtonText: {
    color: Colors.tertiary,
    fontSize: Font.sizeMedium,
    textAlign: Align.center,
    padding: Padding.medium,
  },
  themeButton: {
    marginTop: Margin.xxxxlarge,
    borderRadius: BorderRadius.medium,
    alignSelf: Align.center,
  },
});