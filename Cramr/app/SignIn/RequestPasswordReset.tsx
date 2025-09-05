import { useUser } from '@/contexts/UserContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Keyboard,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import { Colors } from '../../constants/Colors';

const RequestPasswordResetScreen = () => {
    const [email, setEmail] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isCodeSent, setIsCodeSent] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' }); // 'success', 'error', 'info'
    const { isDarkMode } = useUser();
    const router = useRouter();

    const backgroundColor = isDarkMode ? Colors.dark.background : Colors.light.background;
    const textColor = isDarkMode ? Colors.dark.text : Colors.light.text;
    const textInputColor = isDarkMode ? Colors.dark.textInput : Colors.light.textInput;
    const placeholderColor = isDarkMode ? Colors.dark.placeholderText : Colors.light.placeholderText;
    const cancelButtonColor = isDarkMode ? Colors.dark.cancelButton : Colors.light.cancelButton;

    const handleSendCode = async () => {
        if (!email.trim()) {
            setMessage({ text: 'Please enter your email address!', type: 'error' });
            return;
        }

        if (!email.endsWith('.edu')) {
            setMessage({ text: 'Please use a valid .edu email address!', type: 'error' });
            return;
        }

        setIsLoading(true);
        setMessage({ text: 'Sending verification code...', type: 'info' });

        try {
            const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const result = await response.json();

            if (result.success) {
                setMessage({ 
                    text: 'A 6-digit verification code has been sent to your email. Please check your inbox.', 
                    type: 'success' 
                });
                setIsCodeSent(true);
                console.log('verification code: ' +verificationCode);
                setTimeout(() => {
                    setMessage({ text: '', type: '' });
                }, 3000);
            } else {
                setMessage({ 
                    text: result.message || 'Failed to send verification code. Please try again.', 
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

    const handleVerifyCode = async () => {
        if (!verificationCode.trim()) {
            setMessage({ text: 'Please enter the verification code', type: 'error'});
            return;
        }

        if (verificationCode.length !== 6) {
            setMessage({ text: 'Please enter a valid 6-digit code', type: 'error' });
            return;
        }

        setIsLoading(true);
        setMessage({ text: 'Verifying code...', type: 'info' });

        try {
            const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/auth/verify-reset-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email, 
                    verificationCode 
                })
            });

            const result = await response.json();

            if (result.success) {
                setMessage({ 
                    text: 'Code verified successfully! Redirecting to password reset...', 
                    type: 'success' 
                });
                
                setTimeout(() => {
                    router.push({
                        pathname: '/SignIn/SetNewPassword',
                        params: { token: result.token }
                    });
                }, 1500);
            } else {
                setMessage({ 
                    text: result.message || 'Invalid verification code. Please try again.', 
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

    const handleResendCode = async () => {
        setVerificationCode('');
        setMessage({ text: 'Resending verification code...', type: 'info' });

        try {
            const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const result = await response.json();

            if (result.success) {
                setMessage({ 
                    text: 'New verification code sent! Please check your email.', 
                    type: 'success' 
                });
                console.log('verification code: ' + verificationCode);
                setTimeout(() => {
                    setMessage({ text: '', type: '' });
                }, 3000);
            } else {
                setMessage({ 
                    text: result.message || 'Failed to resend code. Please try again.', 
                    type: 'error' 
                });
            }
        } catch (error) {
            setMessage({ 
                text: 'Network error. Please check your connection and try again.', 
                type: 'error' 
            });
        }
    };

    const getMessageColor = () => {
        switch (message.type) {
            case 'success':
                return '#369942';
            case 'error':
                return '#E36062';
            case 'info':
                return '#5CAEF1';
            default:
                return textColor;
        }
    };

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: backgroundColor,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: 15,
            paddingTop: 5,
        },
        backButton: {
            padding: 8,
            marginRight: 16,
        },
        title: {
            fontSize: 24,
            fontWeight: 'bold',
            color: textColor,
        },
        card: {
            padding: 20,
            marginTop: 150,
        },
        cardTitle: {
            fontSize: 28,
            fontWeight: 'bold',
            color: textColor,
            textAlign: 'center',
            marginBottom: 16,
            fontFamily: 'Poppins-SemiBold',
        },
        description: {
            fontSize: 16,
            color: placeholderColor,
            textAlign: 'center',
            marginBottom: 20,
            lineHeight: 22,
            fontFamily: 'Poppins-Regular',
        },
        fieldContainer: {
            marginBottom: 20,
        },
        label: {
            fontSize: 14,
            fontWeight: '500',
            color: textColor,
            marginBottom: 8,
        },
        inputContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: textInputColor,
            borderRadius: 10,
            padding: 10,
        },
        inputIcon: {
            marginRight: 8,
        },
        input: {
            flex: 1,
            fontSize: 16,
            color: textColor,
            fontFamily: 'Poppins-Regular',
        },
        resendButton: {
            alignSelf: 'center',
            marginTop: 20,
            marginBottom: 5,
            flexDirection: 'row',
        },
        resendButtonText: {
            color: '#5CAEF1',
            fontSize: 16,
            fontFamily: 'Poppins-SemiBold',
        },
        resetButton: {
            backgroundColor: '#5CAEF1',
            padding: 10,
            borderRadius: 10,
            alignItems: 'center',
            marginBottom: 16,
        },
        resetButtonDisabled: {
            backgroundColor: cancelButtonColor,
        },
        resetButtonText: {
            fontSize: 16,
            fontFamily: 'Poppins-Regular',
            color: textColor,
        },
        messageText: {
            fontSize: 16,
            fontFamily: 'Poppins-Regular',
            textAlign: 'center',
            marginTop: 10,
        },
    });

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
            
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.container}>
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

                    <View style={styles.card}>
                <Text style={styles.cardTitle}>Reset Password</Text>
                <Text style={styles.description}>
                    {isCodeSent 
                        ? 'Enter the 6-digit verification code sent to your email.'
                        : 'Enter your email address to receive a verification code'
                    }
                </Text>

                {!isCodeSent ? (
                    // Email input state
                    <View style={styles.fieldContainer}>
                        <View style={styles.inputContainer}>
                            <Ionicons 
                                name="mail-outline" 
                                size={20} 
                                color={placeholderColor} 
                                style={styles.inputIcon} 
                            />
                            <TextInput
                                style={styles.input}
                                value={email}
                                onChangeText={(text) => {
                                    setEmail(text);
                                   
                                    if (message.type === 'error') {
                                        setMessage({ text: '', type: '' });
                                    }
                                }}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                placeholder="Email address (.edu)"
                                placeholderTextColor={placeholderColor}
                                editable={!isLoading}
                            />
                        </View>
                    </View>
                ) : (
                    // Code verification state
                    <View style={styles.fieldContainer}>
                        <View style={styles.inputContainer}>
                            <Ionicons 
                                name="key-outline" 
                                size={20} 
                                color={placeholderColor} 
                                style={styles.inputIcon} 
                            />
                            <TextInput
                                style={styles.input}
                                value={verificationCode}
                                onChangeText={(text) => {
                                    const numericText = text.replace(/[^0-9]/g, '');
                                    setVerificationCode(numericText.slice(0, 6));
                                    
                                    if (message.type === 'error') {
                                        setMessage({ text: '', type: '' });
                                    }
                                }}
                                keyboardType="numeric"
                                placeholder="6-digit verification code"
                                placeholderTextColor={placeholderColor}
                                maxLength={6}
                                editable={!isLoading}
                            />
                        </View>
                        <TouchableOpacity 
                            style={styles.resendButton} 
                            onPress={handleResendCode}
                            disabled={isLoading}
                        >
                            <Text style={{ color: placeholderColor, fontFamily: 'Poppins-Regular', fontSize: 16 }}>Didn't receive the code? </Text>
                            <Text style={styles.resendButtonText}>Resend Code</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <TouchableOpacity 
                    style={[styles.resetButton, isLoading && styles.resetButtonDisabled]} 
                    onPress={isCodeSent ? handleVerifyCode : handleSendCode}
                    disabled={isLoading}
                >
                    <Text style={styles.resetButtonText}>
                        {isLoading 
                            ? (isCodeSent ? 'Verifying...' : 'Sending...') 
                            : (isCodeSent ? 'Verify' : 'Send')
                        }
                    </Text>
                </TouchableOpacity>

                {/* Simple message display */}
                {message.text && (
                    <Text style={[styles.messageText, { color: getMessageColor() }]}>
                        {message.text}
                    </Text>
                )}
                    </View>
                </View>
            </TouchableWithoutFeedback>
        </SafeAreaView>
    );
};

export default RequestPasswordResetScreen;
