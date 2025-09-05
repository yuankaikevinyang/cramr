import * as ImagePicker from "expo-image-picker";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { Colors } from '../constants/Colors';

interface ImageUploadProps {
  value?: string | null; // URL or local path
  onChangeImage: (uri: string | null) => void; // Callback to return the URI
  style?: object;
  isDarkMode: boolean;
}

export default function ImageUpload({value, onChangeImage, style, isDarkMode}: ImageUploadProps) {
  const backgroundColor = (!isDarkMode ? Colors.light.background : Colors.dark.background)
  const textColor = (!isDarkMode ? Colors.light.text : Colors.dark.text)
  const modalBackgroundColor = (!isDarkMode ? Colors.light.textInput : Colors.dark.textInput)
  const cancelButtonColor = (!isDarkMode ? Colors.light.cancelButton : Colors.dark.cancelButton)
  
  const [image, setImage] = useState<string | null>(value || null);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Update local state when value prop changes
  useEffect(() => {
    setImage(value || null);
  }, [value]);

  // Call onChangeImage only when user picks or removes an image
  const handleImageChange = useCallback((newImage: string | null) => {
    onChangeImage(newImage);
  }, [onChangeImage]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", `Sorry, we need camera roll permission to upload images.`);
    } else {
      const result = await ImagePicker.launchImageLibraryAsync();
      if (!result.canceled) {
        const newImageUri = result.assets[0].uri;
        setImage(newImageUri);
        setError(null);
        handleImageChange(newImageUri);
      }
    }
  };

  const showRemoveModal = () => {
    setShowDeleteModal(true);
  };

  const hideRemoveModal = () => {
    setShowDeleteModal(false);
  };

  const confirmRemoveImage = () => {
    setImage(null);
    handleImageChange(null);
    setShowDeleteModal(false);
  };

  // Function to determine image source
  const getImageSource = () => {
    if (image) {
      // If it's a URL (starts with http) or local URI, use { uri: image }
      if (image.startsWith('http') || image.startsWith('file://')) {
        return { uri: image };
      }
      // For any other string, treat as URI
      return { uri: image };
    }
    // Fallback to default image when no image is set
    return require('../assets/images/default_profile.jpg');
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={pickImage}>
        <Image
          source={getImageSource()}
          style={styles.profilePicture}
        />
      </TouchableOpacity>

      {/* Show remove button only if there's a selected image */}
      {image && (
        <TouchableOpacity onPress={showRemoveModal} style={[styles.removeButton, {backgroundColor: backgroundColor}]}>
          <Text style={[styles.removeButtonText]}>×</Text>
        </TouchableOpacity>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={hideRemoveModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, {backgroundColor: modalBackgroundColor}]}>
            <Text style={[styles.modalTitle, {color: textColor}]}>
              Remove Profile Picture
            </Text>
            <Text style={[styles.modalMessage, {color: textColor}]}>
              Are you sure you want to remove your profile picture?
            </Text>
            
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton, {backgroundColor: cancelButtonColor}]} 
                onPress={hideRemoveModal}
              >
                <Text style={[styles.cancelButtonText, {color: textColor}]}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.removeButtonModal]} 
                onPress={confirmRemoveImage}
              >
                <Text style={[styles.removeButtonModalText, {color: textColor}]}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: 75,
    height: 75,
  },
  header: {
    fontSize: 20,
    marginBottom: 16,
  },
  errorText: {
    color: "red",
    marginTop: 16,
  },
  profilePicture: {
    width: 75,
    height: 75,
    borderRadius: 50,
  },
  removeButton: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 25,
    height: 25,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    fontSize: 16,
    color: '#E36062',
    fontWeight: 'bold'
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    borderRadius: 15,
    padding: 25,
    width: '85%',
    maxWidth: 350,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    marginBottom: 25,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#E5E5E5',
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: '#666',
  },
  removeButtonModal: {
    backgroundColor: '#E36062',
  },
  removeButtonModalText: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: '#FFFFFF',
    fontWeight: '500',
  },
});