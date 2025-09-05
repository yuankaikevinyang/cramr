import { useRouter } from 'expo-router';
import { ArrowLeft, Plus } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { useUser } from '../../contexts/UserContext';

interface FlashcardSet {
  id: string;
  user_id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

interface DeleteModalProps {
  visible: boolean;
  setName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDarkMode: boolean;
}

const DeleteModal: React.FC<DeleteModalProps> = ({ 
  visible, 
  setName, 
  onConfirm, 
  onCancel, 
  isDarkMode 
}) => {
  const backgroundColor = (!isDarkMode ? Colors.light.background : Colors.dark.background);
  const textColor = (!isDarkMode ? Colors.light.text : Colors.dark.text);
  const textInputColor = (!isDarkMode ? Colors.light.textInput : Colors.dark.textInput);
  const cancelButtonColor = (!isDarkMode ? Colors.light.cancelButton : Colors.dark.cancelButton)

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: textInputColor }]}>
          <Text style={[styles.modalTitle, { color: textColor }]}>
            Delete Flashcard Set
          </Text>
          
          <Text style={[styles.modalMessage, { color: textColor }]}>
            Are you sure you want to delete "{setName}"? This action cannot be undone.
          </Text>
          
          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelButton, {backgroundColor: cancelButtonColor}]} 
              onPress={onCancel}
            >
              <Text style={[styles.cancelButtonText, { color: textColor }]}>
                Cancel
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modalButton, styles.deleteButton1]} 
              onPress={onConfirm}
            >
              <Text style={styles.deleteButtonTextModal}>
                Delete
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default function FlashcardsList() {
  const router = useRouter();
  const { user: loggedInUser, updateUserData } = useUser();

  // Colors
  const {isDarkMode, toggleDarkMode} = useUser();
  const backgroundColor = (!isDarkMode ? Colors.light.background : Colors.dark.background);
  const textColor = (!isDarkMode ? Colors.light.text : Colors.dark.text);
  const textInputColor = (!isDarkMode ? Colors.light.textInput : Colors.dark.textInput);

  const [flashcardSets, setFlashcardSets] = useState<FlashcardSet[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Modal state
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [setToDelete, setSetToDelete] = useState<{ id: string; name: string } | null>(null);

  // GET - Fetch flashcard sets for the logged in user
  const fetchFlashcardSets = async () => {
    if (!loggedInUser?.id) {
      Alert.alert('Error', 'User not logged in');
      return;
    }

    setLoading(true);
    try {
      // Include user ID as a query parameter
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_URL}/flashcard_sets?user_id=${loggedInUser.id}`
      );
      const data = await response.json();
      
      if (response.ok) {
        setFlashcardSets(data.data || []);
      } else {
        Alert.alert('Error', data.error || 'Failed to fetch flashcard sets');
      }
    } catch (error: any) {
      Alert.alert('Error', 'Network error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // POST - Create new flashcard set
  const createFlashcardSet = async () => {
    if (!loggedInUser?.id) {
      Alert.alert('Error', 'User not logged in');
      return;
    }

    try {
      // Use user-specific endpoint
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_URL}/flashcard_sets`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: 'New Flashcard Set',
            description: '',
            user_id: loggedInUser?.id
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        // Add new set to the beginning of the list
        setFlashcardSets([data.data, ...flashcardSets]);
      } else {
        Alert.alert('Error', data.error || 'Failed to create flashcard set');
      }
    } catch (error: any) {
      Alert.alert('Error', '2. Network error: ' + error.message);
    }
  };

  // Show delete confirmation modal
  const showDeleteConfirmation = (setId: string, setName: string) => {
    setSetToDelete({ id: setId, name: setName });
    setDeleteModalVisible(true);
  };

  // DELETE - Delete flashcard set
  const deleteFlashcardSet = async () => {
    if (!setToDelete) return;

    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_URL}/flashcard_sets/${setToDelete.id}/?user_id=${loggedInUser?.id}`,
        {
          method: 'DELETE',
        }
      );

      if (response.ok) {
        // Remove from local state
        setFlashcardSets(flashcardSets.filter(set => set.id !== setToDelete.id));
      } else {
        const data = await response.json();
        Alert.alert('Error', data.error || 'Failed to delete flashcard set');
      }
    } catch (error: any) {
      Alert.alert('Error', '3. Network error: ' + error.message);
    } finally {
      setDeleteModalVisible(false);
      setSetToDelete(null);
    }
  };

  // Navigate to individual flashcard set
  const navigateToFlashcardSet = (setId: string, setName: string) => {
    router.push({
      pathname: '/StudyTools/Flashcards',
      params: { setId, setName }
    });
  };

  // Load data when component mounts
  useEffect(() => {
    fetchFlashcardSets();
  }, [loggedInUser?.id]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={fetchFlashcardSets}
            tintColor={textColor}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={textColor} />
          </TouchableOpacity>
          
          <Text style={[styles.heading, { color: textColor }]}>Flashcards</Text>
          
          <TouchableOpacity onPress={createFlashcardSet} style={styles.addButton}>
            <Plus size={24} color={textColor} />
          </TouchableOpacity>
        </View>

        {/* Flashcard Sets List */}
        {loading && flashcardSets.length === 0 ? (
          <Text style={[styles.loadingText, { color: textColor }]}>Loading...</Text>
        ) : flashcardSets.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: textColor }]}>
              No flashcard sets yet
            </Text>
            <Text style={[styles.emptySubtext, { color: textColor, opacity: 0.7 }]}>
              Tap the + button to create your first set
            </Text>
          </View>
        ) : (
          flashcardSets.map((set) => (
            <View key={set.id} style={[styles.flashcardItem, { backgroundColor: textInputColor }]}>
              <TouchableOpacity 
                style={styles.flashcardContent}
                onPress={() => navigateToFlashcardSet(set.id, set.name)}
              >
                <View>
                  <Text style={[styles.flashcardName, { color: textColor }]}>
                    {set.name}
                  </Text>
                  {set.description && (
                    <Text style={[styles.flashcardDescription, { color: textColor, opacity: 0.7 }]}>
                      {set.description}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={() => showDeleteConfirmation(set.id, set.name)}
              >
                <Text style={styles.deleteButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <DeleteModal
        visible={deleteModalVisible}
        setName={setToDelete?.name || ''}
        onConfirm={deleteFlashcardSet}
        onCancel={() => {
          setDeleteModalVisible(false);
          setSetToDelete(null);
        }}
        isDarkMode={isDarkMode}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  heading: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
  },
  backButton: {
    width: 25,
    height: 25,
  },
  addButton: {
    width: 25,
    height: 25,
  },
  flashcardItem: {
    padding: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  flashcardContent: {
    flex: 1,
  },
  flashcardName: {
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
  },
  flashcardDescription: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    marginTop: 2,
  },
  deleteButton: {
    padding: 5,
    marginLeft: 10,
  },
  deleteButtonText: {
    fontSize: 16,
    color: '#E36062',
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    marginTop: 50,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
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
    width: '100%',
    maxWidth: 350,
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  modalMessage: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 20,
  },
  modalButtons: {
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
  },
  cancelButton: {
    borderColor: '#ccc',
  },
  deleteButton1: {
    backgroundColor: '#E36062',
  },
  cancelButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
  },
  deleteButtonTextModal: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#fff',
  },
});