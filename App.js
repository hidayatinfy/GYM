import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { useDispatch } from "react-redux";
import { getSubcriptionPlanById } from "./redux/serviceSlice/commonSlice";

import Login from './layout/Login';
import FirstLogin from './layout/FirstLogin';
import ConfirmationScreen from './layout/Confirmation';
import AppNavigator from './layout/AppNavigator';
import MemberProfileScreen from './layout/MemberProfileScreen';
import AddMemberScreen from './layout/Addmember';
import UserProfileScreen from './layout/UserProfileScreen';
import MembersDashboard from './layout/Dashboard';
import LandingScreen from './layout/LandingScreen';

const Stack = createNativeStackNavigator();

// === Notification handler (foreground behavior) ===
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// === Android notification channel (for heads-up banners) ===
async function ensureAndroidChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
    });
  }
}

const App = () => {
  const dispatch = useDispatch();
  const [initialRoute, setInitialRoute] = useState(null);
  const [loading, setLoading] = useState(true);

  // === Notification listeners (no token registration) ===
  useEffect(() => {
    // Only do any notification work on real devices (Android / iOS)
    if (Platform.OS !== 'web' && Device.isDevice) {
      ensureAndroidChannel();
    }

    const sub1 = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received (foreground):', notification);
    });

    const sub2 = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped:', response);
      // You can navigate based on response.notification.request.content.data
    });

    return () => {
      sub1.remove();
      sub2.remove();
    };
  }, []);

  // === Login flow + optional local notification test ===
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        // For testing: force logged-in; change to 'false' when needed
        await AsyncStorage.setItem('isLoggedIn', 'true');

        const isLoggedIn = await AsyncStorage.getItem('isLoggedIn');

        if (isLoggedIn === 'true') {
          setInitialRoute('AppNavigator');
         dispatch(getSubcriptionPlanById());
        } else {
          setInitialRoute('FirstLogin');
        }
      } catch (error) {
        console.log('Error checking login status:', error);
        setInitialRoute('FirstLogin');
      } finally {
        setLoading(false);
      }
    };

    checkLoginStatus();

    // 🔔 Local notification test (native only, NOT web)
    if (Platform.OS !== 'web') {
      (async () => {
        await ensureAndroidChannel();
        // Demo: show a notification every 50 seconds
        setInterval(() => {
          Notifications.scheduleNotificationAsync({
            content: {
              title: '25 member fees are pending',
              body: 'Please click here.',
            },
            trigger: null, // fire immediately
          });
        }, 50000);
      })();
    }
  }, []);

  // Wait until we know where to go
  if (loading || initialRoute === null) return null;

  return (
    
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="FirstLogin" component={FirstLogin} />
        <Stack.Screen name="Login" component={Login} />

        <Stack.Screen
          name="AppNavigator"
          component={AppNavigator}
      
          options={{
            headerShown: false,
            title: 'Back',
          }}
          
        /> 

        <Stack.Screen
          name="UserProfileScreen"
          component={UserProfileScreen}
            options={{ headerShown: false }} // ✅ new profile screen
        />

        <Stack.Screen
          name="AddMemberScreen"
          component={AddMemberScreen}
            options={{ headerShown: false }}
        />

        <Stack.Screen
          name="MemberProfileScreen"
          component={MemberProfileScreen}
            options={{ headerShown: false }}
        />

        <Stack.Screen
          name="ConfirmationScreen"
          component={ConfirmationScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
