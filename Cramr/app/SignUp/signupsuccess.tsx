import { ArrowRight, BookOpen, CheckCircle, Users } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import { Animated, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const SignUpSuccess = () => {
  const scaleAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
  }).start();
},[]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <Animated.View style={[styles.successIcon, { transform: [{ scale: scaleAnim }] }]}>
            <CheckCircle size={48} color="#ffffff" />
          </Animated.View>
          <View style={styles.celebrationIcon}>
            <Text style={styles.emoji}>🎉</Text>
          </View>
        </View>

        {/* Success Message */}
        <View style={styles.messageContainer}>
          <Text style={styles.title}>Welcome to Cramr!</Text>
          <Text style={styles.subtitle}>Account created successfully</Text>
          <Text style={styles.description}>
            You're all set to discover amazing study groups and connect with fellow learners
          </Text>
        </View>

        {/* Feature Highlights */}
        <View style={styles.featuresCard}>
          <Text style={styles.featuresTitle}>What's next?</Text>

          <View style={styles.featureItem}>
            <View style={styles.featureIconContainer}>
              <Users size={20} color="#2563eb" />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Find Study Groups</Text>
              <Text style={styles.featureDescription}>Browse groups in your area</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={[styles.featureIconContainer, { backgroundColor: '#f3e8ff' }]}>
              <BookOpen size={20} color="#9333ea" />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Create Sessions</Text>
              <Text style={styles.featureDescription}>Start your own study group</Text>
            </View>
          </View>
        </View>

        {/* Primary Action Button Only */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Create Profile</Text>
            <ArrowRight size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
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
  successIcon: {
    width: 96,
    height: 96,
    backgroundColor: '#16a34a',
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  celebrationIcon: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 32,
    height: 32,
    backgroundColor: '#fbbf24',
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
  featuresCard: {
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
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureIconContainer: {
    width: 40,
    height: 40,
    backgroundColor: '#dbeafe',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 384,
  },
  primaryButton: {
    backgroundColor: '#16a34a',
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
    marginRight: 8,
  },
  secondaryButton: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default SignUpSuccess;