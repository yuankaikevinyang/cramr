import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { Colors } from '../../../constants/Colors';
import { useUser } from '../../../contexts/UserContext';


const AboutPage = () => {
  const router = useRouter();

  // Colors
  const {isDarkMode, toggleDarkMode} = useUser();
  const backgroundColor = (!isDarkMode ? Colors.light.background : Colors.dark.background)
  const textColor = (!isDarkMode ? Colors.light.text : Colors.dark.text)
  const textInputColor = (!isDarkMode ? Colors.light.textInput : Colors.dark.textInput)
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ArrowLeft 
          size={24} 
          color={textColor}
          onPress={() => router.back()}
        />

        <Text style={[styles.heading, { color: textColor }]}>About</Text>

        <Text style={[styles.sectionTitle, { color: textColor }]}>Terms of Service</Text>
        <View style={[styles.input, { backgroundColor: textInputColor }]}>
          <ScrollView>
            <Text style={[styles.text, { color: textColor }]}>
              Terms of Service
              {"\n\n"}
              Effective Date: 01/01/2025
              {"\n\n"}
              Welcome to Cramer, a mobile app developed under the UC San Diego Supercomputer Center. By using Cramer, you agree to the following terms:
              {"\n\n"}
              1. Use of the App: Cramer helps students discover and join nearby study sessions. You agree to use the app for educational and respectful purposes. Do not misuse the platform or post misleading group information.
              {"\n\n"}
              2. Eligibility: You must be at least 13 years old and affiliated with an educational institution.
              {"\n\n"}
              3. Account Responsibility: You are responsible for any activity that occurs under your account. University-affiliated emails may be required.
              {"\n\n"}
              4. Intellectual Property: All content and code within the app is the property of the Cramer team and UC San Diego unless otherwise noted.
              {"\n\n"}
              5. Location and Accuracy: Cramer uses location-based features. We do not guarantee the accuracy of any map data or session listings.
              {"\n\n"}
              6. Suspension or Termination: We reserve the right to suspend or terminate accounts that violate these terms.
              {"\n\n"}
              7. Changes to Terms: We may revise these terms at any time. Continued use of Cramer indicates acceptance of any updates.
              {"\n\n"}
              8. Contact: For questions, contact us at [Insert Email Address]
            </Text>
          </ScrollView>
        </View>

        <Text style={[styles.sectionTitle, { color: textColor }]}>Privacy Policy</Text>
        <View style={[styles.input, { backgroundColor: textInputColor }]}>
          <ScrollView>
            <Text style={[styles.text, { color: textColor }]}>
              Privacy Policy
              {"\n\n"}
              Effective Date: 01/01/2025
              {"\n\n"}
              Cramer respects your privacy. This policy outlines what information we collect and how we use it.
              {"\n\n"}
              1. Data We Collect:
              - Your email address (for authentication)
              - Your approximate location (for map features)
              - Study session details you create or join
              {"\n\n"}
              We do NOT collect:
              - Private messages
              - Unnecessary device data
              {"\n\n"}
              2. How Your Data is Used: We use your data to show local study groups, let you create or join sessions, and maintain a smooth app experience.
              {"\n\n"}
              3. Data Sharing: We do not sell your data. We may share anonymized data for research or improvement purposes, in line with UC San Diego data policies.
              {"\n\n"}
              4. Data Storage & Retention: Your data is stored securely while your account is active. You can request deletion of your data at any time.
              {"\n\n"}
              5. Security: We apply reasonable safeguards but cannot guarantee complete security of transmitted data.
              {"\n\n"}
              6. Children's Privacy: Cramer is not intended for users under 13 years old. We do not knowingly collect their data.
              {"\n\n"}
              7. Policy Updates: We may revise this policy from time to time. Major changes will be communicated in-app or via email.
              {"\n\n"}
              8. Contact: If you have questions, reach out to [Insert Email Address]
            </Text>
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // Text
  headerText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
  },
  subheaderText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
  },
  subheaderBoldText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
  },
  normalText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
  },
  normalBoldText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
  },

  // Other
  container: {
    flex: 1,
    // backgroundColor moved to inline style
  },
  scrollContent: {
    padding: 20,
  },
  backArrow: {
    fontSize: 25,
    marginBottom: 12,
    fontWeight: '600',
  },
  backButton: {
    width: 25,
    height: 25,
    marginBottom: 20,
  },
  backArrowImage: {
    width: 25,
    height: 25,
  },
  heading: {
    fontSize: 18,
    alignSelf: 'center',
    marginBottom: 20,
    fontFamily: 'Poppins-SemiBold',
    marginTop: -25,
  },
  input: {
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    height: 200,
    // backgroundColor moved to inline style
    fontFamily: 'Poppins-Regular',
  },
  text: {
    fontFamily: 'Poppins-Regular',
  },
  item: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#f2f2f2',
    borderRadius: 10,
    marginBottom: 10,
    fontFamily: 'Poppins-Regular',
  },
  itemText: {
    fontSize: 14,
    color: '#333',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    // color moved to inline style
    fontFamily: 'Poppins-Regular',
  },
  divider: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 20,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AboutPage;