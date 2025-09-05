import { useUser } from '@/contexts/UserContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Image,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Colors } from '../../constants/Colors';

//manages the state for input fields, password validation, error messages, and dark mode
const SignUpScreen = () => {
    // Colors
    const {isDarkMode, toggleDarkMode} = useUser();
    const { setUser } = useUser();

    const backgroundColor = isDarkMode ? Colors.dark.background : Colors.light.background;
    const textColor = isDarkMode ? Colors.dark.text : Colors.light.text;
    const textInputColor = isDarkMode ? Colors.dark.textInput : Colors.light.textInput;
    const placeholderColor = isDarkMode ? Colors.dark.placeholderText : Colors.light.placeholderText;
    const disabledButtonColor = isDarkMode ? Colors.dark.disabledButton : Colors.light.disabledButton;
    const errorColor = '#E36062';
    const primaryColor = '#5CAEF1';
    const themeToggleColor = isDarkMode ? Colors.dark.secondary || '#4B5563' : Colors.light.secondary || '#E5E7EB';


    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [userUsername, setUserUsername] = useState('');
    const [errors, setErrors] = useState({
        username: '',
        userUsername: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const router = useRouter();
    //logo image path
    const logoImagePath = require('../../assets/images/logo.png'); 
    //validates password
    const validatePassword = (pwd: string) => {
        const errors: string[] = [];
        if (pwd.length < 8) errors.push('At least 8 characters');
        if (!/[A-Z]/.test(pwd)) errors.push('At least 1 capital letter');
        if (!/[^A-Za-z0-9]/.test(pwd)) errors.push('At least 1 special character');
        return errors;
    };
    //handles sign up process
    const handleSignUp = async () => {
        let newErrors = { username: '', userUsername: '', email: '', password: '', confirmPassword: '' };
        let hasError = false;
        if (!username.trim()) {
            newErrors.username = 'Please enter your name!';
            hasError = true;
        }
        if (!userUsername.trim()) {
            newErrors.userUsername = 'Please enter a username!';
            hasError = true;
        }
        if (!email.trim()) {
            newErrors.email = 'Please enter your email!';
            hasError = true;
        } else if (!email.endsWith('.edu')) {
            newErrors.email = 'Please use a valid .edu email address.';
            hasError = true;
        }
        const pwdErrors = validatePassword(password);
        if (!password.trim()) {
            newErrors.password = 'Please enter a password!';
            hasError = true;
        } else if (pwdErrors.length > 0) {
            newErrors.password = 'Password must have: ' + pwdErrors.join(', ');
            hasError = true;
        }
        if (!confirmPassword.trim()) {
            newErrors.confirmPassword = 'Please confirm your password!';
            hasError = true;
        } else if (password !== confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match!';
            hasError = true;
        }
        setErrors(newErrors);
        
        if (!hasError) {
            setIsLoading(true);
            try {
                // Send signup data to backend
                const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/signup`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username: userUsername,
                        password: password,
                        email: email,
                        full_name: username,
                        created_at: new Date().toISOString()
                    })
                });
                const result = await response.json();
                console.log('Signup response:', { status: response.status, result });
                
                if (response.ok && result.success) {
                    console.log('User registered successfully');
                    setUser(result.user);
                    router.push('/SignIn/Loginscreen');
                } else {
                    // Handle different error cases
                    if (response.status === 409) {
                        // Handle validation errors (duplicate email/username)
                        if (result.errors) {
                            // New format with specific field errors
                            setErrors(prev => ({
                                ...prev,
                                email: result.errors.email || '',
                                userUsername: result.errors.username || ''
                            }));
                        } else {
                            // Fallback for old format
                            const errorMessage = result.message || result.error || result.msg || 'Something went wrong. Please try again.';
                            if (errorMessage.toLowerCase().includes('email')) {
                                setErrors(prev => ({ ...prev, email: errorMessage }));
                            } else if (errorMessage.toLowerCase().includes('username')) {
                                setErrors(prev => ({ ...prev, userUsername: errorMessage }));
                            } else {
                                setErrors(prev => ({ ...prev, email: errorMessage }));
                            }
                        }
                    } else if (response.status === 400) {
                        // Missing required fields or other 400 errors
                        const errorMessage = result.message || result.error || result.msg || 'Something went wrong. Please try again.';
                        console.log('Setting error message:', errorMessage);
                        setErrors(prev => ({ ...prev, email: errorMessage }));
                    } else {
                        // Other errors
                        const errorMessage = result.message || result.error || result.msg || 'Something went wrong. Please try again.';
                        setErrors(prev => ({ ...prev, email: errorMessage }));
                    }
                }
            } catch (error) {
                console.error('Signup error:', error);
                setErrors(prev => ({ ...prev, email: 'Something went wrong. Please try again.' }));
            } finally {
                setIsLoading(false);
            }
        }
    };
    //styles for the sign up screen
    const styles = getStyles(isDarkMode, backgroundColor, textColor, textInputColor, placeholderColor, disabledButtonColor, errorColor, primaryColor, themeToggleColor);
    //returns the sign up screen
    return (
        <SafeAreaView style={[styles.container, { backgroundColor }]}>
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

                    {/* Logo Section */}
                    <View style={styles.logoSection}>
                        <View style={styles.logoContainer}>
                            <Image source={logoImagePath} style={styles.logo} />
                        </View>
                        <Text style={styles.title}>Sign up</Text>
                    </View>

                    {/* Form Fields */}
                    <View style={styles.formContainer}>
                        {/* Name Field */}
                        <View style={styles.fieldContainer}>
                            <View style={[styles.inputContainer, errors.username ? styles.inputError : null, {backgroundColor: textInputColor}]}>
                                <Ionicons 
                                    name="person-outline" 
                                    size={16} 
                                    color={textColor}
                                    style={styles.inputIcon} 
                                />
                                <TextInput
                                    placeholder='Full Name'
                                    style={[styles.input, {color: textColor}]}
                                    value={username}
                                    onChangeText={text => {
                                        setUsername(text);
                                        if (errors.username) setErrors({ ...errors, username: '' });
                                    }}
                                    placeholderTextColor={placeholderColor}
                                />
                            </View>
                            {errors.username ? <Text style={styles.errorText}>{errors.username}</Text> : null}
                        </View>

                        {/* Username Field */}
                        <View style={styles.fieldContainer}>
                            <View style={[styles.inputContainer, errors.userUsername ? styles.inputError : null, {backgroundColor: textInputColor}]}>
                                <Ionicons 
                                    name="at-outline" 
                                    size={20} 
                                    color={textColor}
                                    style={styles.inputIcon} 
                                />
                                <TextInput
                                    style={[styles.input, {color: textColor}]}
                                    value={userUsername}
                                    onChangeText={text => {
                                        setUserUsername(text);
                                        if (errors.userUsername) setErrors({ ...errors, userUsername: '' });
                                    }}
                                    placeholder="Username"
                                    autoCapitalize="none"
                                    placeholderTextColor={placeholderColor}
                                />
                            </View>
                            {errors.userUsername ? <Text style={styles.errorText}>{errors.userUsername}</Text> : null}
                        </View>

                        {/* Email Field */}
                        <View style={styles.fieldContainer}>
                            <View style={[styles.inputContainer, errors.email ? styles.inputError : null, {backgroundColor: textInputColor}]}>
                                <Ionicons 
                                    name="mail-outline" 
                                    size={20} 
                                    color={textColor}
                                    style={styles.inputIcon} 
                                />
                                <TextInput
                                    placeholder='Email address (.edu)'
                                    style={[styles.input, {color: textColor}]}
                                    value={email}
                                    onChangeText={text => {
                                        setEmail(text);
                                        if (errors.email) setErrors({ ...errors, email: '' });
                                    }}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    placeholderTextColor={placeholderColor}
                                />
                            </View>
                            {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
                        </View>

                        {/* Password Field */}
                        <View style={styles.fieldContainer}>
                            <View style={[styles.inputContainer, errors.password ? styles.inputError : null, {backgroundColor: textInputColor}]}>
                                <Ionicons 
                                    name="lock-closed-outline" 
                                    size={20} 
                                    color={textColor}
                                    style={styles.inputIcon} 
                                />
                                <TextInput
                                    placeholder='Password'
                                    style={[styles.input, styles.passwordInput, {color: textColor}]}
                                    value={password}
                                    onChangeText={text => {
                                        setPassword(text);
                                        if (errors.password) setErrors({ ...errors, password: '' });
                                    }}
                                    secureTextEntry={!showPassword}
                                    placeholderTextColor={placeholderColor}
                                />
                                <TouchableOpacity
                                    style={styles.eyeIcon}
                                    onPress={() => setShowPassword(!showPassword)}
                                >
                                    <Ionicons 
                                        name={showPassword ? "eye-off-outline" : "eye-outline"} 
                                        size={20} 
                                        color={textColor}
                                    />
                                </TouchableOpacity>
                            </View>
                            {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
                        </View>

                        {/* Confirm Password Field */}
                        <View style={styles.fieldContainer}>
                            <View style={[styles.inputContainer, errors.confirmPassword ? styles.inputError : null, {backgroundColor: textInputColor}]}>
                                <Ionicons 
                                    name="lock-closed-outline" 
                                    size={20} 
                                    color={textColor}
                                    style={styles.inputIcon} 
                                />
                                <TextInput
                                    placeholder='Confirm password'
                                    style={[styles.input, styles.passwordInput, {color: textColor}]}
                                    value={confirmPassword}
                                    onChangeText={text => {
                                        setConfirmPassword(text);
                                        if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
                                    }}
                                    secureTextEntry={!showConfirmPassword}
                                    placeholderTextColor={placeholderColor}
                                />
                                <TouchableOpacity
                                    style={styles.eyeIcon}
                                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    <Ionicons 
                                        name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                                        size={20} 
                                        color={textColor}
                                    />
                                </TouchableOpacity>
                            </View>
                            {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}
                        </View>
                    </View>

                    {/* Sign Up Button */}
                    <TouchableOpacity 
                        style={[styles.signUpButton, isLoading && {backgroundColor: disabledButtonColor}]} 
                        onPress={handleSignUp}
                        disabled={isLoading}
                    >
                        <Text style={styles.signUpButtonText}>
                            {isLoading ? 'Creating Account...' : 'Sign Up'}
                        </Text>
                    </TouchableOpacity>

                    {/* Login Link */}
                    <View style={styles.loginLinkContainer}>
                        <Text style={[styles.loginText, {color: textColor}]}>Already have an account? </Text>
                        <TouchableOpacity onPress={() => router.push('/SignIn/Loginscreen')}>
                            <Text style={styles.signInText}> Sign in</Text>
                        </TouchableOpacity>
                    </View>
            </KeyboardAwareScrollView>
        </SafeAreaView>
    );
};

const getStyles = (isDarkMode: boolean, backgroundColor: string, textColor: string, textInputColor: string, placeholderColor: string, disabledButtonColor: string, errorColor: string, primaryColor: string,) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: backgroundColor,
    },
    contentContainer: {
        flexGrow: 1,
        justifyContent: 'flex-start',
        padding: 20,
    },
    logoSection: {
        alignItems: 'center',
        marginTop: 0,
    },
    logoContainer: {
        backgroundColor: 'transparent',
        // borderRadius: 50, // Remove or comment out if not needed
        padding: 0,
        marginBottom: 0,
        marginTop: 0,
    },
    logo: {
        width: 300,
        height: 200,
        resizeMode: 'contain',
        marginBottom: 0,
        marginTop: -16,
    },
    title: {
        fontSize: 28,
        color: textColor,
        marginBottom: 30,
        marginTop: -60,
        fontFamily: "Poppins-SemiBold"
    },
    formContainer: {
        marginTop: 8,
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
        borderRadius: 10,
        padding: 10,
    },
    inputIcon: {
        marginRight: 10,
        fontFamily: "Poppins-Regular"
    },
    input: {
        flex: 1,
        fontSize: 16,
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
        backgroundColor: primaryColor,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 16,
    },
    signUpButtonText: {
        fontSize: 16,
        fontWeight: '500',
        fontFamily: 'Poppins-Regular',
        color: textColor
    },
    loginLinkContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loginText: {
        fontSize: 14,
        fontFamily: 'Poppins-Regular'
    },
    signInText: {
        fontSize: 14,
        color: primaryColor,
        fontFamily: 'Poppins-SemiBold',
        marginBottom: 1,
    },
    inputError: {
        borderColor: errorColor,
    },
    errorText: {
        color: errorColor,
        fontSize: 14,
        marginTop: 4,
        marginLeft: 4,
        fontFamily: 'Poppins-Regular'
    },
});

export default SignUpScreen;