import { RefreshCw, XCircle } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import { Animated, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const SignUpFail = () => {
    const scaleAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
    }).start();
}, []);
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Error Icon */}
        <View style={styles.iconContainer}>
          <Animated.View style={[styles.errorIcon, { transform: [{ scale: scaleAnim }] }]}>
            <XCircle size={48} color="#ffffff" />
          </Animated.View>
          <View style={styles.warningIcon}>
            <Text style={styles.emoji}>⚠️</Text>
          </View>
        </View>

        {/* Error Message */}
        <View style={styles.messageContainer}>
          <Text style={styles.title}>Oops! Something went wrong</Text>
          <Text style={styles.subtitle}>Account creation failed</Text>
          <Text style={styles.description}>
            We couldn't create your account. Please check your details and try again.
          </Text>
        </View>

        {/* Error Details */}
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Common issues:</Text>
          
          <View style={styles.errorItem}>
            <View style={styles.errorBullet} />
            <Text style={styles.errorText}>Email address must be a university address</Text>
          </View>

          <View style={styles.errorItem}>
            <View style={styles.errorBullet} />
            <Text style={styles.errorText}>Password doesn't meet requirements</Text>
          </View>

          <View style={styles.errorItem}>
            <View style={styles.errorBullet} />
            <Text style={styles.errorText}>Network connection issues</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.primaryButton}>
            <RefreshCw size={20} color="#ffffff" />
            <Text style={styles.primaryButtonText}>Try Again</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Back to Login</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.helpButton}>
            <Text style={styles.helpButtonText}>Need Help?</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fef2f2',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 32,
  },
  errorIcon: {
    width: 96,
    height: 96,
    backgroundColor: '#ef4444',
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  warningIcon: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 32,
    height: 32,
    backgroundColor: '#fb923c',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 16,
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#4b5563',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 20,
  },
  errorCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
    width: '100%',
    maxWidth: 384,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  errorItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  errorBullet: {
    width: 8,
    height: 8,
    backgroundColor: '#f87171',
    borderRadius: 4,
    marginTop: 6,
    marginRight: 12,
    flexShrink: 0,
  },
  errorText: {
    fontSize: 14,
    color: '#4b5563',
    flex: 1,
    lineHeight: 20,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 384,
  },
  primaryButton: {
    backgroundColor: '#dc2626',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButton: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#d1d5db', 
  },
  secondaryButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '500',
  },
  helpButton: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  helpButtonText: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default SignUpFail;