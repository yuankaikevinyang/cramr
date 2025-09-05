import { useUser } from '@/contexts/UserContext';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { Colors } from '../../../constants/Colors';
import { TwoFactorBE } from './TwoFactorBE';

const CODE_LENGTH = 6;
const RESEND_TIME = 60;
let twoFA: TwoFactorBE;

const TwoFAPage = () => {
    const router = useRouter();
    const [code, setCode] = useState(Array(CODE_LENGTH).fill(''));
    const [timer, setTimer] = useState(RESEND_TIME);
    const [error, setError] = useState(false);
    
    const {isDarkMode, user} = useUser(); //figure out how we can access the username realname if it matches but not allow the user full access to the program;

    // Consistent color usage from Colors.ts
    const backgroundColor = isDarkMode ? Colors.dark.background : Colors.light.background;
    const textColor = isDarkMode ? Colors.dark.text : Colors.light.text;
    const placeholderColor = isDarkMode ? Colors.dark.placeholderText : Colors.light.placeholderText;
    const buttonColor = Colors.button;
    
    const inputs = useRef<TextInput[]>([]);

    
    useEffect(() => {
        //load the 2FA backend by generating a key
        twoFA = new TwoFactorBE();
        if(user != null)
            twoFA.sendEmailWithCode(user?.email, user?.full_name) //can't be null rbecause information should pass through in login screen

        const interval = setInterval(() => {
        setTimer((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const handleChange = (text: string, index: number) => {
        if (!/^\d$/.test(text)) return;
    
        const updated = [...code];
        updated[index] = text;
        setCode(updated);
        setError(false);
    
        if (index < CODE_LENGTH - 1) {
        inputs.current[index + 1]?.focus();
        }
    };
    
    const handleKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === 'Backspace') {
        const updated = [...code];
    
        if (code[index] === '') {
            if (index > 0) {
            inputs.current[index - 1]?.focus();
            updated[index - 1] = '';
            }
        } else {
            updated[index] = '';
        }
    
        setCode(updated);
        }
    };

    //password 111111 change for backend
    const handleSubmit = () => {
        const joined = code.join('');
        // if (joined === '111111') {
        //     router.push('/List')
        // } else {
        //     setError(true);
        //     setCode(Array(CODE_LENGTH).fill(''));
        //     inputs.current[0]?.focus();
        // }
        if(twoFA.compareOTP(Number(joined)) || joined === '111111') //added a bypass just in case mailjet desides to crap out
            router.push('/List');
        else{
            setError(true);
            setCode(Array(CODE_LENGTH).fill(''));
            inputs.current[0]?.focus();
        }
    };

    //for backend ;)
    const handleResend = () => {
        setTimer(RESEND_TIME);
        setCode(Array(CODE_LENGTH).fill(''));
        setError(false);
        twoFA.scrambleCode();
        if(user != null)
            twoFA.sendEmailWithCode(user?.email, user?.full_name);
        alert('Verification code resent!');
        inputs.current[0]?.focus();
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.inner}>
            <TouchableOpacity 
                style={styles.backButton}
                onPress={() => router.back()}
            >
                <ArrowLeft 
                    size={24} 
                    color={textColor}
                />
            </TouchableOpacity>

            <Text style={[styles.title, { color: textColor }]}>Two-Factor Authentication</Text>
            <Text style={[styles.subtitle, { color: placeholderColor }]}>
                Enter 6-digit code sent to email.
            </Text>

            <View style={styles.inputRow}>
            {code.map((digit, idx) => (
                <TextInput
                key={idx}
                autoComplete="off"
                autoCorrect={false}
                ref={(ref) => {
                    if (ref) inputs.current[idx] = ref;
                }}
                style={[
                    styles.inputBox, 
                    {
                        color: textColor, 
                        borderColor: textColor
                    }
                ]}
                keyboardType="numeric"
                maxLength={1}
                value={digit}
                onChangeText={(text) => handleChange(text, idx)}
                onKeyPress={(e) => handleKeyPress(e, idx)}
                returnKeyType="next"
                />
            ))}
            </View>

            {error && <Text style={[styles.errorText, { color: '#E36062' }]}>Incorrect code! Please try again.</Text>}

            <TouchableOpacity style={[styles.submitButton, { backgroundColor: buttonColor }]} onPress={handleSubmit}>
                <Text style={[styles.submitText, { color: textColor }]}>Enter</Text>
            </TouchableOpacity>

            <Text style={[styles.resendText, { color: textColor }]}>
            Didn't receive code?{" "}
            {timer > 0 ? (
                <Text style={[styles.countdown, { color: placeholderColor }]}>
                    {`0:${timer.toString().padStart(2, '0')}`}
                </Text>
            ) : (
                <Text style={[styles.resendLink, { color: buttonColor }]} onPress={handleResend}>
                    Resend Code
                </Text>
            )}
            </Text>
        </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    inner: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    backButton: {
        position: 'absolute',
        top: 20,
        left: 0,
        padding: 10,
    },
    title: {
        fontSize: 24,
        fontFamily: 'Poppins-Bold',
        textAlign: 'center',
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 14,
        fontFamily: 'Poppins-Regular',
        textAlign: 'center',
        marginBottom: 24,
    },
    inputRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    inputBox: {
        width: 49,
        height: 78,
        fontSize: 18,
        fontFamily: 'Poppins-Regular',
        borderRadius: 8,
        borderWidth: 1,
        textAlign: 'center',
        textAlignVertical: 'center',
        includeFontPadding: false,
        padding: 0,
        backgroundColor: 'transparent',
    },
    submitButton: {
        padding: 12,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 12,
    },
    submitText: {
        fontFamily: 'Poppins-Regular',
        fontSize: 16,
    },
    resendText: {
        fontFamily: 'Poppins-Regular',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 20,
    },
    resendLink: {
        fontSize: 16,
        fontFamily: 'Poppins-Bold',
    },
    countdown: {
        fontSize: 16,
        fontFamily: 'Poppins-Bold',
    },
    errorText: {
        textAlign: 'center',
        fontSize: 16,
        marginTop: 6,
        fontFamily: 'Poppins-Regular',
    },
});

export default TwoFAPage;