// import { Colors } from '@/constants/Colors';
// import { useRouter } from 'expo-router';
// import React from 'react';
// import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// export default function HomeScreen() {
//   const router = useRouter();
//   // Temporarily disable useUser to fix the error
//   // const { isDarkMode } = useUser(); 
  
//   const backgroundColor = Colors.light.background;
//   const textColor = Colors.light.text;
//   const buttonBackgroundColor = Colors.light.textInput;

//   const navigationItems = [
//     // Sign in and Sign up
//     { title: 'Sign in', route: '/SignIn/Loginscreen' },
//     { title: 'Sign up', route: '/SignUp/signupscreen' },

//     // Home
//     { title: 'Home/List', route: '/List' },

//     // Map
//     { title: 'Map', route: '/Map/map' },
    
//     { title: 'View event', route: '/ViewEvent/viewevent' },

//     // Create Event and Edit Event
//     { title: 'Create event', route: '/CreateEvent/createevent' },
//     { title: 'Edit event', route: '/CreateEvent/EditEvent' },

//     //Messages
//     { title: 'Messages', route: 'List/Messages/messages' },

   
//     // Saved/RSVPed Events
//     { title: 'Saved/RSVPed Events', route: '/Saved/Saved' },

//     // Profile and Settings
//     { title: 'Profile Page (Internal)', route: '/Profile/Internal' },
//     { title: 'Settings', route: 'Profile/Settings/SettingsFrontPage' },
//     { title: 'Profile Page (External)', route: '/Profile/External' },
//     { title: 'Follow Page', route: '/Follow/follow' },
//     { title: 'Notifications', route: '/Profile/NotificationsPage' },

//     // Study Tools
//     { title: 'Study Tools', route: '/StudyTools/StudyTools' },
//     // Leaderboard
//     { title: 'Leaderboard', route: '/StudyTools/LeaderboardPage' }
//   ];

//   return (
//     <View style={[styles.container, { backgroundColor }]}>
//       {/* Header */}
//       <View style={styles.header}>
//         <Text style={[styles.title, { color: textColor }]}>
//           Navigation
//         </Text>
//       </View>
      
//       {/* Navigation Buttons */}
//       <ScrollView 
//         style={styles.scrollView}
//         contentContainerStyle={styles.scrollContent}
//         showsVerticalScrollIndicator={false}
//       >
//         {navigationItems.map((item, index) => (
//           <TouchableOpacity
//             key={index}
//             style={[styles.button, { backgroundColor: buttonBackgroundColor }]}
//             onPress={() => router.push(item.route as any)}
//             activeOpacity={0.7}
//           >
//             <Text style={[styles.buttonText, { color: textColor }]}>
//               {item.title}
//             </Text>
//           </TouchableOpacity>
//         ))}
//       </ScrollView>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   header: {
//     paddingTop: 60,
//     paddingBottom: 20,
//     paddingHorizontal: 20,
//     alignItems: 'center',
//   },
//   title: {
//     fontSize: 28,
//     fontWeight: 'bold',
//     fontFamily: 'Poppins-Bold',
//   },
//   scrollView: {
//     flex: 1,
//   },
//   scrollContent: {
//     padding: 20,
//     paddingTop: 0,
//   },
//   button: {
//     padding: 16,
//     marginBottom: 12,
//     borderRadius: 12,
//     alignItems: 'center',
//     elevation: 2,
//     shadowColor: '#000000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//   },
//   buttonText: {
//     fontSize: 16,
//     fontWeight: '500',
//     fontFamily: 'Poppins-Medium',
//   },
// });


// Goes to login (My stuff)
import { useUser } from '@/contexts/UserContext';
import { Redirect, useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';

export default function HomeScreen() {
  const router = useRouter();
  const {user} = useUser();

  if(user !== null){
    return <Redirect href="/List/eventList" />;
  } 
  return <Redirect href="/SignIn/Loginscreen" />; //maybe we have it so that if usercontext is true, login. Else go to login screen
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  
});

// The other one
// export default function HomeScreen() {
//   const router = useRouter();
//   return (
//     <ParallaxScrollView
//       headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
//       headerImage={
//         <Image
//           source={require('@/assets/images/partial-react-logo.png')}
//           style={styles.reactLogo}
//         />
//       }>
//       <ThemedView style={styles.titleContainer}>
//         <ThemedText type="title">Welcome!</ThemedText>
//         <HelloWave />
//       </ThemedView>
//       <ThemedView style={styles.stepContainer}>
//         <ThemedText type="subtitle">Step 1: Try it</ThemedText>
//         <ThemedText>
//           Edit <ThemedText type="defaultSemiBold">app/(tabs)/index.tsx</ThemedText> to see changes.
//           Press{' '}
//           <ThemedText type="defaultSemiBold">
//             {Platform.select({
//               ios: 'cmd + d',
//               android: 'cmd + m',
//               web: 'F12',
//             })}
//           </ThemedText>{' '}
//           to open developer tools.
//         </ThemedText>
//       </ThemedView>
//       <ThemedView style={styles.stepContainer}>
//         <ThemedText type="subtitle">Step 2: Explore</ThemedText>
//         <ThemedText>
//           {`Tap the Explore tab to learn more about what's included in this starter app.`}
//         </ThemedText>
//       </ThemedView>
//       <ThemedView style={styles.stepContainer}>
//         <ThemedText type="subtitle">Step 3: Get a fresh start</ThemedText>
//         <ThemedText>
//           {`When you're ready, run `}
//           <ThemedText type="defaultSemiBold">npm run reset-project</ThemedText> to get a fresh{' '}
//           <ThemedText type="defaultSemiBold">app</ThemedText> directory. This will move the current{' '}
//           <ThemedText type="defaultSemiBold">app</ThemedText> to{' '}
//           <ThemedText type="defaultSemiBold">app-example</ThemedText>.
//         </ThemedText>
//       </ThemedView>
//        <ThemedView style={{ marginVertical: 20, gap: 10 }}>
//         <Button title="Go to Signup Fail" onPress={() => router.push('/signupfail')} />
//         <Button title="Go to Signup Success" onPress={() => router.push('/SignUp/signupsuccess')} />
//         <Button title="Go to View Event Page" onPress={() => router.push('/ViewEvent/viewevent')} />
//         <Button title="Go to Signup Page" onPress={() => router.push('/SignUp/signupscreen')} />
//         <Button title="Go to Create Event" onPress={() => router.push('/CreateEvent/createevent')} />
//         <Button title="Go to Settings Page" onPress={() => router.push('/Settings/SettingsFrontPage')} />
//         <Button title="Go to Login Page" onPress={() => router.push('/Login/Loginscreen')} />
//         <Button title="Go to 2fa Page" onPress={() => router.push('/TwoFactor/TwoFAPage')} />
//         <Button title="Go to Map Page" onPress={() => router.push('/Map/map')} />
//         <Button title="Go to Profile Page (Internal)" onPress={() => router.push('/Profile/Internal')} />
//         <Button title="Go to Profile Page (External)" onPress={() => router.push('/Profile/External')} />
//         <Button title="Go to Saved/RSVP Events" onPress={() => router.push('/Saved/Saved')} />
//         <Button title="Go to Follow Page" onPress={() => router.push('/Follow/follow')} />
//         <Button title="Go to eventList Page" onPress={() => router.push('/List/eventList')} />
//         <Button title="Go to List View" onPress={() => router.push('/List')} />
//         <Button title="Go to Notifications" onPress={() => router.push('/Profile/NotificationsPage')} />
//       </ThemedView>
//     </ParallaxScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   titleContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 8,
//   },
//   stepContainer: {
//     gap: 8,
//     marginBottom: 8,
//   },
//   reactLogo: {
//     height: 178,
//     width: 290,
//     bottom: 0,
//     left: 0,
//     position: 'absolute',
//   },
// );