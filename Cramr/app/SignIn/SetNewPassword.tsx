import { useUser } from '@/contexts/UserContext';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { Colors } from '../../constants/Colors';

const SetNewPasswordScreen = () => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' }); // 'success', 'error', 'info'
    const [errors, setErrors] = useState({
        newPassword: '',
        confirmPassword: ''
    });
    const { isDarkMode } = useUser();
    const router = useRouter();
    const { token } = useLocalSearchParams();

     const backgroundColor = isDarkMode ? Colors.dark.background : Colors.light.background;
        const textColor = isDarkMode ? Colors.dark.text : Colors.light.text;
        const textInputColor = isDarkMode ? Colors.dark.textInput : Colors.light.textInput;
        const placeholderColor = isDarkMode ? Colors.dark.placeholderText : Colors.light.placeholderText;
        const cancelButtonColor = isDarkMode ? Colors.dark.cancelButton : Colors.light.cancelButton;
    

    // Validates password using the same logic as signup screen
    const validatePassword = (pwd: string) => {
        const errors: string[] = [];
        if (pwd.length < 8) errors.push('At least 8 characters');
        if (!/[A-Z]/.test(pwd)) errors.push('At least 1 capital letter');
        if (!/[^A-Za-z0-9]/.test(pwd)) errors.push('At least 1 special character');
        return errors;
    };

    const handleResetPassword = async () => {
        let newErrors = { newPassword: '', confirmPassword: '' };
        let hasError = false;

        if (!newPassword.trim()) {
            newErrors.newPassword = 'Please enter a new password';
            hasError = true;
        } else {
            const pwdErrors = validatePassword(newPassword);
            if (pwdErrors.length > 0) {
                newErrors.newPassword = 'Password must have: ' + pwdErrors.join(', ');
                hasError = true;
            }
        }

        if (!confirmPassword.trim()) {
            newErrors.confirmPassword = 'Please confirm your password';
            hasError = true;
        } else if (newPassword !== confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match!';
            hasError = true;
        }

        setErrors(newErrors);

        if (hasError) {
            return;
        }

        if (!token) {
            setMessage({ text: 'Invalid reset token', type: 'error' });
            return;
        }

        setIsLoading(true);
        setMessage({ text: 'Changing your password...', type: 'info' });

        try {
            const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/auth/reset-password/confirm`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    token, 
                    newPassword 
                })
            });

            const result = await response.json();

            if (result.success) {
                setMessage({ 
                    text: 'Your password has been changed successfully! You can now log in with your new password.', 
                    type: 'success' 
                });
                
                setTimeout(() => {
                    setMessage({ text: '', type: '' });
                    router.push('/SignIn/Loginscreen');
                }, 2000);
            } else {
                setMessage({ 
                    text: result.message || 'Failed to change password. Please try again.', 
                    type: 'error' 
                });
            }
        } catch (error) {
            setMessage({ 
                text: 'Network error. Please check your connection and try again.', 
                type: 'error' 
            });
        } finally {
            setIsLoading(false);
        }
    };

    const styles = getStyles(isDarkMode);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: backgroundColor }]}>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
            
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{flex: 1}}
            >
                <ScrollView 
                    contentContainerStyle={{flexGrow: 1}}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.header}>
                        <TouchableOpacity 
                            style={styles.backButton} 
                            onPress={() => router.back()}
                        >
                            <Ionicons 
                                name="arrow-back" 
                                size={24} 
                                color={textColor} 
                            />
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.card, {backgroundColor: backgroundColor}]}>
                        <Text style={[styles.cardTitle, {color: textColor}]}>Reset Password</Text>
                        <Text style={[styles.description, {color: placeholderColor}]}>
                            Enter your new password below.
                        </Text>

                        <View style={styles.fieldContainer}>
                            <View style={[styles.inputContainer, {backgroundColor: textInputColor}]}>
                                <Ionicons 
                                    name="lock-closed-outline" 
                                    size={20} 
                                    color={textColor}
                                    style={styles.inputIcon} 
                                />
                                <TextInput
                                    style={[styles.input, styles.passwordInput]}
                                    value={newPassword}
                                    onChangeText={text => {
                                        setNewPassword(text);
                                        if (errors.newPassword) setErrors({ ...errors, newPassword: '' });
                                        
                                        if (message.type === 'error') {
                                            setMessage({ text: '', type: '' });
                                        }
                                    }}
                                    secureTextEntry={!showNewPassword}
                                    placeholder="Enter new password"
                                    placeholderTextColor={placeholderColor}
                                />
                                <TouchableOpacity 
                                    style={styles.eyeIcon} 
                                    onPress={() => setShowNewPassword(!showNewPassword)}
                                >
                                    <Ionicons 
                                        name={showNewPassword ? "eye-off-outline" : "eye-outline"} 
                                        size={20} 
                                        color={textColor}
                                    />
                                </TouchableOpacity>
                            </View>
                            {errors.newPassword ? <Text style={styles.errorText}>{errors.newPassword}</Text> : null}
                        </View>

                        <View style={styles.fieldContainer}>
                            <View style={[styles.inputContainer, errors.confirmPassword ? styles.inputError : null, {backgroundColor: textInputColor}]}>
                                <Ionicons 
                                    name="lock-closed-outline" 
                                    size={20} 
                                    color={textColor}
                                    style={styles.inputIcon} 
                                />
                                <TextInput
                                    style={[styles.input, styles.passwordInput]}
                                    value={confirmPassword}
                                    onChangeText={text => {
                                        setConfirmPassword(text);
                                        if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
                                        
                                        if (message.type === 'error') {
                                            setMessage({ text: '', type: '' });
                                        }
                                    }}
                                    secureTextEntry={!showConfirmPassword}
                                    placeholder="Confirm new password"
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

                        <TouchableOpacity 
                            style={[styles.resetButton, isLoading && styles.resetButtonDisabled]} 
                            onPress={handleResetPassword}
                            disabled={isLoading}
                        >
                            <Text style={[styles.resetButtonText, { color: textColor }]}>
                                {isLoading ? 'Resetting Password...' : 'Reset Password'}
                            </Text>
                        </TouchableOpacity>

                        {/* Message display */}
                        {message.text && (
                            <Text style={[styles.messageText, {color: textColor}]}>
                                {message.text}
                            </Text>
                        )}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const getStyles = (isDarkMode: boolean) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: isDarkMode ? '#1F2937' : '#F3F4F6',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        paddingTop: 20,
    },
    backButton: {
        marginRight: 10,
    },
    card: {
        padding: 20,
        marginTop: 100,
    },
    cardTitle: {
        fontSize: 24,
        color: isDarkMode ? '#FFFFFF' : '#111827',
        textAlign: 'center',
        marginBottom: 16,
        fontFamily: 'Poppins-SemiBold',
    },
    description: {
        fontSize: 16,
        color: isDarkMode ? '#9CA3AF' : '#6B7280',
        textAlign: 'center',
        marginBottom: 20,
        fontFamily: 'Poppins-Regular',
    },
    fieldContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: isDarkMode ? '#FFFFFF' : '#111827',
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderRadius: 10,
    },
    inputError: {
        borderColor: '#E36062',
    },
    inputIcon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: isDarkMode ? '#FFFFFF' : '#111827',
        fontFamily: 'Poppins-Regular',
    },
    passwordInput: {
        paddingRight: 40,
    },
    eyeIcon: {
        position: 'absolute',
        right: 12,
        padding: 4,
    },
    errorText: {
        color: '#E36062',
        fontSize: 14,
        marginTop: 4,
        marginLeft: 4,
        fontFamily: 'Poppins-Regular',
    },
    resetButton: {
        backgroundColor: '#5CAEF1',
        paddingVertical: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 16,
    },
    resetButtonDisabled: {
        backgroundColor: '#9CA3AF',
    },
    resetButtonText: {
        fontFamily: 'Poppins-Regular',
        fontSize: 16,
    },
    messageText: {
        fontSize: 14,
        fontFamily: 'Poppins-Regular',
        textAlign: 'center',
        marginTop: 10,
    },
});

export default SetNewPasswordScreen;