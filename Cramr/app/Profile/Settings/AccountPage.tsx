import { useUser } from '@/contexts/UserContext';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import { Colors } from '../../../constants/Colors';

const AccountPage = () => {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);

  // Account form state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Status
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [blockedIds, setBlockedIds] = useState<string[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  const [originalEmail, setOriginalEmail] = useState('');
  const [originalPhoneNumber, setOriginalPhoneNumber] = useState('');

  const { user: loggedInUser } = useUser();
  const { isDarkMode } = useUser();

  // Colors
  const backgroundColor = !isDarkMode ? Colors.light.background : Colors.dark.background;
  const textColor = !isDarkMode ? Colors.light.text : Colors.dark.text;
  const textInputColor = !isDarkMode ? Colors.light.textInput : Colors.dark.textInput;
  const placeholderTextColor = !isDarkMode
    ? Colors.light.placeholderText
    : Colors.dark.placeholderText;

  // Detect changes
  const checkForChanges = (
    emailValue: string,
    phoneValue: string,
    oldPwd: string,
    newPwd: string,
    confirmPwd: string
  ) => {
    const emailChanged = emailValue !== originalEmail;
    const phoneChanged = phoneValue !== originalPhoneNumber;
    const passwordChanging = oldPwd || newPwd || confirmPwd;

    setHasChanges(emailChanged || phoneChanged || passwordChanging);
  };

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (!loggedInUser?.id) return;

      setIsLoading(true);
      try {
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_BACKEND_URL}/users/${loggedInUser.id}`
        );
        if (response.ok) {
          const data = await response.json();
          const userEmail = data.email || '';
          const userPhone = data.phone_number || '';

          setEmail(userEmail);
          setPhoneNumber(userPhone);
          setOriginalEmail(userEmail);
          setOriginalPhoneNumber(userPhone);
          setBlockedIds(data.blocked_ids || []);
          setHasChanges(false);
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [loggedInUser?.id]);

  // Fetch blocked users
  const fetchBlockedUserProfile = async (blockedId: string) => {
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_URL}/users/${blockedId}`
      );
      if (response.ok) {
        const data = await response.json();
        return {
          id: blockedId,
          profilePicture: data.profile_picture_url,
          username: data.username,
        };
      }
    } catch (err) {
      console.error('Error fetching blocked user profile:', err);
    }
    return null;
  };

  useEffect(() => {
    const fetchAllBlockedProfiles = async () => {
      if (!blockedIds.length) {
        setBlockedUsers([]);
        return;
      }
      setIsLoading(true);
      const profiles = await Promise.all(blockedIds.map(id => fetchBlockedUserProfile(id)));
      setBlockedUsers(profiles.filter(p => p !== null));
      setIsLoading(false);
    };

    fetchAllBlockedProfiles();
  }, [blockedIds]);

  // Save account changes
  const handleSave = async () => {
    if (!hasChanges || isSaving) return;

    if (newPassword && newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match!');
      return;
    }
    if (newPassword && !oldPassword) {
      Alert.alert('Error', 'Please enter your old password to change your password.');
      return;
    }

    try {
      setIsSaving(true);

      const payload = {
        email,
        phone_number: phoneNumber,
        old_password: oldPassword || undefined,
        password: newPassword || undefined,
      };

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_URL}/users/${loggedInUser?.id}/account`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const msg = await response.text().catch(() => '');
        throw new Error(msg || 'Failed to update account');
      }

      setOriginalEmail(email);
      setOriginalPhoneNumber(phoneNumber);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setHasChanges(false);

      Alert.alert('Success', 'Account updated successfully!');
    } catch (err: any) {
      Alert.alert('Update failed', err?.message || 'Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete account
  const handleConfirmDelete = async () => {
    try {
      setIsDeleting(true);
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_URL}/users/${loggedInUser?.id}`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
        }
      );
      if (!res.ok) {
        const msg = await res.text().catch(() => '');
        throw new Error(msg || 'Failed to delete account');
      }

      setModalVisible(false);
      Alert.alert('Deleted', 'Your account has been deleted.');
      // TODO: clear auth/session
      router.replace('/');
    } catch (err: any) {
      Alert.alert('Delete failed', err?.message || 'Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUnblock = async (userId: string) => {
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_URL}/users/${loggedInUser?.id}/blocks/${userId}`,
        { method: 'DELETE', headers: { 'Content-Type': 'application/json' } }
      );
      if (response.ok) {
        Alert.alert('Success', 'User unblocked!');
        setBlockedIds(prev => prev.filter(id => id !== userId));
      }
    } catch (err) {
      Alert.alert('Error', 'Could not unblock user.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {loggedInUser && !isLoading && (
            <>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <ArrowLeft size={24} color={textColor} />
              </TouchableOpacity>

              <Text style={[styles.heading, { color: textColor }]}>Account</Text>

              {/* Email */}
              <Text style={[styles.subheading, { color: textColor }]}>Email</Text>
              <TextInput
                style={[styles.input, { backgroundColor: textInputColor, color: textColor }]}
                placeholder="email@ucsd.edu"
                placeholderTextColor={placeholderTextColor}
                value={email}
                onChangeText={text => {
                  setEmail(text);
                  checkForChanges(text, phoneNumber, oldPassword, newPassword, confirmPassword);
                }}
              />

              {/* Phone */}
              <Text style={[styles.subheading, { color: textColor }]}>Phone Number</Text>
              <TextInput
                style={[styles.input, { backgroundColor: textInputColor, color: textColor }]}
                placeholder="(123) 456-7890"
                placeholderTextColor={placeholderTextColor}
                value={phoneNumber}
                onChangeText={text => {
                  setPhoneNumber(text);
                  checkForChanges(email, text, oldPassword, newPassword, confirmPassword);
                }}
              />

              {/* Password */}
              <Text style={[styles.subheading, { color: textColor }]}>Change Password</Text>
              <TextInput
                style={[styles.input, { backgroundColor: textInputColor, color: textColor }]}
                placeholder="Old password"
                placeholderTextColor={placeholderTextColor}
                secureTextEntry
                value={oldPassword}
                onChangeText={text => {
                  setOldPassword(text);
                  checkForChanges(email, phoneNumber, text, newPassword, confirmPassword);
                }}
              />
              <TextInput
                style={[styles.input, { backgroundColor: textInputColor, color: textColor }]}
                placeholder="New password"
                placeholderTextColor={placeholderTextColor}
                secureTextEntry
                value={newPassword}
                onChangeText={text => {
                  setNewPassword(text);
                  checkForChanges(email, phoneNumber, oldPassword, text, confirmPassword);
                }}
              />
              <TextInput
                style={[styles.input, { backgroundColor: textInputColor, color: textColor }]}
                placeholder="Re-enter new password"
                placeholderTextColor={placeholderTextColor}
                secureTextEntry
                value={confirmPassword}
                onChangeText={text => {
                  setConfirmPassword(text);
                  checkForChanges(email, phoneNumber, oldPassword, newPassword, text);
                }}
              />

              {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <Text style={styles.errorText}>New passwords do not match!</Text>
              )}

              {/* Save */}
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  { opacity: hasChanges && !isSaving ? 1.0 : 0.7 },
                ]}
                onPress={handleSave}
                disabled={!hasChanges || isSaving}
              >
                <Text style={[styles.saveButtonText, { color: textColor }]}>
                  {isSaving ? 'Saving…' : hasChanges ? 'Save' : 'Saved!'}
                </Text>
              </TouchableOpacity>

              {/* Blocked Users */}
              <View style={styles.divider} />
              <Text style={[styles.subheading, { color: textColor }]}>Blocked Accounts</Text>
              {blockedUsers.map(user => (
                <View
                  key={user.id}
                  style={[
                    styles.blockedContainer,
                    { backgroundColor: textInputColor, flexDirection: 'row', alignItems: 'center' },
                  ]}
                >
                  <Image
                    source={{ uri: user.profilePicture }}
                    style={{ width: 40, height: 40, borderRadius: 20 }}
                  />
                  <Text style={[styles.normalText, { color: textColor, marginLeft: 12 }]}>
                    {user.username}
                  </Text>
                  <TouchableOpacity onPress={() => handleUnblock(user.id)}>
                    <Text style={[styles.normalBoldText, { color: '#E36062', marginLeft: 150 }]}>
                      ✕
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}

              {/* Delete */}
              <View style={styles.divider} />
              <Text style={[styles.subheading, { color: textColor }]}>Delete Account</Text>
              <TouchableOpacity style={styles.deleteButton} onPress={() => setModalVisible(true)}>
                <Text style={[styles.deleteButtonText, { color: textColor }]}>Delete</Text>
              </TouchableOpacity>

              <Modal transparent visible={modalVisible} animationType="fade">
                <View style={styles.modalBackground}>
                  <View style={[styles.modalCard, { backgroundColor: textInputColor }]}>
                    <Text style={[styles.modalTitle, { color: textColor }]}>
                      Delete account? This cannot be undone.
                    </Text>
                    <View style={styles.modalButtons}>
                      <Pressable
                        style={[styles.modalButton, styles.cancelButton]}
                        onPress={() => setModalVisible(false)}
                      >
                        <Text style={styles.cancelText}>Cancel</Text>
                      </Pressable>
                      <Pressable
                        style={[styles.modalButton, styles.confirmButton, isDeleting && { opacity: 0.6 }]}
                        onPress={handleConfirmDelete}
                        disabled={isDeleting}
                      >
                        <Text style={styles.confirmText}>
                          {isDeleting ? 'Deleting…' : 'Delete'}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              </Modal>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, flexGrow: 1 },
  backButton: { width: 25, height: 25, marginBottom: 12 },
  heading: {
    fontSize: 18,
    fontWeight: 'bold',
    alignSelf: 'center',
    marginBottom: 20,
    fontFamily: 'Poppins-Bold',
  },
  subheading: { marginBottom: 10, fontSize: 16, fontFamily: 'Poppins-Regular' },
  input: {
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    fontFamily: 'Poppins-Regular',
  },
  errorText: { color: 'red', marginBottom: 16, fontFamily: 'Poppins-Regular' },
  saveButton: {
    backgroundColor: '#5CAEF1',
    padding: 10,
    borderRadius: 12,
    marginBottom: 15,
    marginTop: 15,
  },
  saveButtonText: { fontSize: 16, textAlign: 'center', fontFamily: 'Poppins-Regular' },
  divider: { height: 1, backgroundColor: '#ccc', marginVertical: 16 },
  deleteButton: { backgroundColor: '#E36062', padding: 10, borderRadius: 12 },
  deleteButtonText: { fontSize: 16, textAlign: 'center', fontFamily: 'Poppins-Regular' },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: { padding: 24, borderRadius: 10, width: '70%' },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
  },
  modalButtons: { flexDirection: 'row', justifyContent: 'center', gap: 16 },
  modalButton: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 10 },
  cancelButton: { backgroundColor: '#e5e7eb' },
  confirmButton: { backgroundColor: '#E36062' },
  cancelText: { fontSize: 16, color: '#000', fontFamily: 'Poppins-Regular' },
  confirmText: { fontSize: 16, color: '#000', fontFamily: 'Poppins-Regular' },
  normalText: { fontFamily: 'Poppins-Regular', fontSize: 14 },
  normalBoldText: { fontFamily: 'Poppins-SemiBold', fontSize: 14 },
  blockedContainer: {
    width: '100%',
    padding: 8,
    marginBottom: 8,
    borderRadius: 10,
  },
});

export default AccountPage;
