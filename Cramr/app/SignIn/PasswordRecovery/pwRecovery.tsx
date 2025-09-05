import { useUser } from '@/contexts/UserContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  LayoutAnimation,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View
} from "react-native";
import { Colors } from '../../../constants/Colors';

export default function PasswordRecoveryScreen({ onBack }: { onBack?: () => void }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  
  const { isDarkMode } = useUser();

  // Consistent color usage from Colors.ts
  const backgroundColor = isDarkMode ? Colors.dark.background : Colors.light.background;
  const textColor = isDarkMode ? Colors.dark.text : Colors.light.text;
  const textInputColor = isDarkMode ? Colors.dark.textInput : Colors.light.textInput;
  const placeholderColor = isDarkMode ? Colors.dark.placeholderText : Colors.light.placeholderText;
  const cancelButtonColor = isDarkMode ? Colors.dark.cancelButton : Colors.light.cancelButton;

  // enable LayoutAnimation on Android
  useEffect(() => {
    if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const emailRegex = useMemo(
    () =>
      /^(?:[a-zA-Z0-9_'^&+%=-]+(?:\.[a-zA-Z0-9_'^&+%=-]+)*)@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/,
    []
  );

  const emailValid = emailRegex.test(email);
  const emailsMatch = email.trim() !== "" && email === confirm;
  const canSubmit = emailValid && emailsMatch;

  function handleSubmit() {
    setSubmitted(true);
    if (!canSubmit) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSuccessMessage(`Password sent to ${email}!`);
  }

  function handleBack() {
    if (onBack) return onBack();
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor }]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Back Button - Top Left Corner */}
        <View style={styles.headerRow}>
          <ArrowLeft 
            size={24} 
            color={textColor}
            onPress={() => router.back()}
          />
        </View>

        <View style={[styles.cardWrapper, { backgroundColor }]}>
          {/* Title */}
          <View style={styles.titleBlock}>
            <Text style={[styles.title, { color: textColor }]}>Password Recovery</Text>
            <Text style={[styles.subtitle, { color: placeholderColor }]}>
              Enter your email address to receive your password.
            </Text>
          </View>

          {/* Form */}
          <View>
            {/* First Email Input */}
            <View style={styles.fieldBlock}>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color={textColor} style={styles.inputIcon} />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholder="Email address"
                  placeholderTextColor={placeholderColor}
                  style={[styles.input, { 
                    backgroundColor: textInputColor, 
                    color: textColor,
                  }]}
                />
              </View>
              {submitted && !emailValid && (
                <Text style={styles.errorText}>Please enter a valid email.</Text>
              )}
            </View>

            {/* Confirm Email Input */}
            <View style={styles.fieldBlock}>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color={textColor} style={styles.inputIcon} />
                <TextInput
                  value={confirm}
                  onChangeText={setConfirm}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholder="Confirm email address"
                  placeholderTextColor={placeholderColor}
                  style={[styles.input, { 
                    backgroundColor: textInputColor, 
                    color: textColor,
                  }]}
                />
              </View>
              {submitted && !emailsMatch && (
                <Text style={styles.errorText}>Emails do not match.</Text>
              )}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={!canSubmit}
              style={[
                styles.primaryBtn,
                !canSubmit && { backgroundColor: cancelButtonColor, opacity: 0.6 }
              ]}
            >
              <Text style={[
                [styles.primaryBtnText, {color: textColor}],
                !canSubmit && { opacity: 0.7, color: textColor }
              ]}>
                Recover Password
              </Text>
            </TouchableOpacity>

            {/* Success/Info Message */}
            {successMessage ? (
              <Text style={[styles.successText, { color: '#369942' }]}>{successMessage}</Text>
            ) : (
              <Text style={[styles.finePrint, { color: placeholderColor }]}>
                We'll send a password reset link to your email if it's associated with an
                account.
              </Text>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  headerRow: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 10 : 40,
    left: 20,
    zIndex: 1,
  },
  backBtn: {
    padding: 8,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardWrapper: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 120 : 100,
    justifyContent: 'flex-start',
  },
  titleBlock: {
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: 'Poppins-Bold',
    marginBottom: 10,
    marginTop: 50,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
  },
  fieldBlock: {
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  input: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingLeft: 48, // Make room for the icon
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
  },
  errorText: {
    color: '#E36062',
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    marginTop: 6,
  },
  primaryBtn: {
    backgroundColor: '#5CAEF1',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins-Regular',
  },
  successText: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
    marginTop: 12,
  },
  finePrint: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
});