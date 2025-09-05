import { useUser } from '@/contexts/UserContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Image,
    Platform,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Colors } from '../../constants/Colors';


const LoginScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const {isDarkMode, toggleDarkMode} = useUser();
    const [errors, setErrors] = useState({ email: '', password: '' });
    const [loginStatus, setLoginStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [loginMessage, setLoginMessage] = useState('');
    const router = useRouter();
    const { setUser } = useUser();

    // Colors
    const backgroundColor = (isDarkMode ? Colors.dark.background : Colors.light.background);
    const textColor = (isDarkMode ? Colors.dark.text : Colors.light.text);
    const textInputColor = (isDarkMode ? Colors.dark.textInput : Colors.light.textInput);
    const placeholderTextColor = (isDarkMode ? Colors.dark.placeholderText : Colors.light.placeholderText);

    //refactored to make it look cleaner
    const handleLogin = async () => {
        let newErrors = { email: '', password: '' };

        if(email.trim() && email.endsWith('.edu') && password.trim()) { //might replace the last part with regex but this works for now
            try {
                const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const result = await response.json();
                if (result.success) {
                    setLoginStatus('success');
                    // Store user information in context
                    console.log('Login successful, storing user:', result.user);
                    setUser(result.user);
                    // Navigate to 2FA page after successful login
                    setTimeout(() => {
                        router.push('./TwoFactor/TwoFAPage');
                    }, 1000); // Small delay to show success message
                    setLoginMessage('Login successful.');
                } else {
                    setLoginStatus('error');
                    setLoginMessage(result.message || 'Login failed.');
                }
            } catch (error) {
                setLoginStatus('error');
                setLoginMessage('Network error. Please try again.');
            }
       }
        else { //don't know how you can do this efficiently and cleanly
            if (!email.trim()) {
                newErrors.email = 'Please enter your email!';
            } else if (!email.endsWith('.edu')) {
                newErrors.email = 'Please use a valid .edu email address!';
            }

            if (!password.trim()) {
                newErrors.password = 'Please enter your password!';
            }
            
            
            setErrors(newErrors);
        }

    };

   const styles = getStyles(isDarkMode, backgroundColor, textColor, textInputColor, placeholderTextColor);


   return (
       <SafeAreaView style={[styles.container, { backgroundColor }]}>
           <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
           <KeyboardAwareScrollView
               contentContainerStyle={styles.contentContainer}
               enableOnAndroid={true}
               extraScrollHeight={Platform.OS === 'ios' ? 30 : 100}
               keyboardShouldPersistTaps="handled"
               showsVerticalScrollIndicator={false}
               enableAutomaticScroll={true}
               enableResetScrollToCoords={false}
               keyboardOpeningTime={100}
               extraHeight={Platform.OS === 'android' ? 100 : 30}
               keyboardDismissMode="interactive"
               scrollEnabled={true}
           >
               <View style={styles.card}>
                   <View style={styles.logoSection}>
                       <Image source={require('../../assets/images/logo.png')} style={styles.logo} />
                       <Text style={styles.title}>Sign in</Text>
                   </View>


                   <View style={styles.formContainer}>
                       <View style={styles.fieldContainer}>
                           <View style={[styles.inputContainer, errors.email ? styles.inputError : null]}>
                               <Ionicons name="mail-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                               <TextInput
                                   style={styles.input}
                                   value={email}
                                   onChangeText={text => {
                                       setEmail(text);
                                       if (errors.email) setErrors({ ...errors, email: '' });
                                   }}
                                   placeholder='Email address or username'
                                   keyboardType="email-address"
                                   autoCapitalize="none"
                                   // placeholder="your.email@school.edu"
                                   placeholderTextColor={placeholderTextColor}
                               />
                           </View>
                           {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
                       </View>


                       <View style={styles.fieldContainer}>
                           <View style={[styles.inputContainer, errors.password ? styles.inputError : null]}>
                               <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                               <TextInput
                                   style={[styles.input, styles.passwordInput]}
                                   value={password}
                                   onChangeText={text => {
                                       setPassword(text);
                                       if (errors.password) setErrors({ ...errors, password: '' });
                                   }}
                                   secureTextEntry={!showPassword}
                                   placeholder='Password'
                                   placeholderTextColor={placeholderTextColor}
                               />
                               <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
                                   <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#9CA3AF" />
                               </TouchableOpacity>
                           </View>
                           {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
                       </View>
                   </View>


                   <TouchableOpacity style={styles.signUpButton} onPress={handleLogin}>
                       <Text style={styles.signUpButtonText}>Sign In</Text>
                   </TouchableOpacity>
                   {loginStatus === 'error' && (
                       <Text style={[styles.errorText, { textAlign: 'center' }]}>{loginMessage}</Text>
                   )}
                   {loginStatus === 'success' && (
                       <Text style={{ color: 'green', textAlign: 'center', marginBottom: 10 , fontFamily: 'Poppins-Regular', fontSize: 14}}>{loginMessage}</Text>
                   )}

                    <View style={styles.loginLinkContainer}>
                        <TouchableOpacity onPress={() => router.push('/SignIn/RequestPasswordReset')}>
                            <Text style={styles.signInText}>Forgot password?</Text>
                        </TouchableOpacity>
                    </View>

                   <View style={styles.loginLinkContainer}>
                       <Text style={styles.loginText}>Don't have an account? </Text>
                       <TouchableOpacity onPress={() => router.push('/SignUp/signupscreen')}>
                           <Text style={styles.signInText}>Sign up</Text>
                       </TouchableOpacity>
                   </View>
               </View>
           </KeyboardAwareScrollView>
       </SafeAreaView>
   );
};


const getStyles = (isDarkMode: boolean, backgroundColor: string, textColor: string, textInputColor: string, placeholderTextColor: string) => StyleSheet.create({
   container: {
       // backgroundColor moved to inline style
   },
   contentContainer: {
       justifyContent: 'flex-start',
   },
   card: {
       backgroundColor: backgroundColor,
       height: 850,
       padding: 20,
   },
   logoSection: {
       alignItems: 'center',
       marginBottom: 20,
   },
   logo: {
       width: 300,
       height: 200,
       resizeMode: 'contain',
       marginTop: 75,
   },
   title: {
       fontSize: 28,
       marginTop: -60,
       color: textColor,
       marginBottom: 16,
       fontFamily: 'Poppins-SemiBold'
   },
   formContainer: {
       marginBottom: 24,
   },
   fieldContainer: {
       marginBottom: 20,
   },
   label: {
       fontSize: 14,
       fontWeight: '500',
       color: textColor,
       textAlign: 'center',
       marginBottom: 8,
   },
   inputContainer: {
       flexDirection: 'row',
       alignItems: 'center',
       backgroundColor: textInputColor,
       borderRadius: 10,
       paddingHorizontal: 12,
       paddingVertical: 12,
   },
   inputIcon: {
       marginRight: 8,
   },
   input: {
       flex: 1,
       fontSize: 16,
       color: textColor,
       fontFamily: 'Poppins-Regular'
   },
   passwordInput: {
       paddingRight: 40,
   },
   eyeIcon: {
       position: 'absolute',
       right: 12,
       padding: 4,
   },
   signUpButton: {
       backgroundColor: '#5CAEF1',
       paddingVertical: 12,
       borderRadius: 8,
       alignItems: 'center',
       marginTop: -20,
       marginBottom: 16,
   },
   signUpButtonText: {
       color: textColor,
       fontSize: 18,
       fontFamily: 'Poppins-Regular',
   },
   loginLinkContainer: {
       flexDirection: 'row',
       justifyContent: 'center',
       alignItems: 'center',
       marginBottom: 5,
       marginTop: 5,
   },
   loginText: {
       fontSize: 16,
       fontFamily: 'Poppins-Regular',
       color: textColor,
   },
   signInText: {
       fontSize: 16,
       fontFamily: 'Poppins-Bold',
       color: '#5CAEF1',
       fontWeight: '500',
   },
   inputError: {
       borderColor: '#E36062',
       fontFamily: 'Poppins-Regular',
       fontSize: 14,
   },
   errorText: {
       color: '#E36062',
       fontFamily: 'Poppins-Regular',
       fontSize: 14,
       marginTop: 5,
       marginLeft: 5,
   },
   forgotPasswordContainer: {
       alignItems: 'center',
       marginBottom: 16,
   },
   forgotPasswordText: {
       fontSize: 14,
       color: '#3B82F6',
       fontWeight: '500',
       textDecorationLine: 'underline',
   },
});


export default LoginScreen;