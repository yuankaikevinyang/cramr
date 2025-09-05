import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Edit3, Plus, Save } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { useUser } from '../../contexts/UserContext';

interface Flashcard {
  id: string;
  set_id: string;
  front: string;
  back: string;
  is_checked: boolean;
  position: number;
  user_id: string;
  isFlipped?: boolean;
}

interface FlashcardSet {
  id: string;
  name: string;
  description: string;
  user_id: string;
}

export default function FlashcardSet() {
  const router = useRouter();
  const { isDarkMode, user: loggedInUser } = useUser();
  const params = useLocalSearchParams();
  const setId = params.setId ? String(params.setId) : null;
  
  // Get screen dimensions for better keyboard handling
  const { height: screenHeight } = Dimensions.get('window');

  // Colors
  const backgroundColor = !isDarkMode ? Colors.light.background : Colors.dark.background;
  const textColor = !isDarkMode ? Colors.light.text : Colors.dark.text;
  const textInputColor = !isDarkMode ? Colors.light.textInput : Colors.dark.textInput;
  const placeholderColor = !isDarkMode ? Colors.light.placeholderText : Colors.dark.placeholderText;
  const cancelButtonColor = !isDarkMode ? Colors.light.cancelButton : Colors.dark.cancelButton;
  const cardBackgroundColor = textInputColor;

  // State
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [flashcardSet, setFlashcardSet] = useState<FlashcardSet | null>(null);
  const [loading, setLoading] = useState(false);
  const [editingCard, setEditingCard] = useState<string | null>(null);
  const [editingSet, setEditingSet] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  
  // Modal state
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<{id: string, front: string} | null>(null);
  
  // Separate state for editing set details
  const [editSetName, setEditSetName] = useState('');
  const [editSetDescription, setEditSetDescription] = useState('');

  // Keyboard event listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      (e) => setKeyboardHeight(e.endCoordinates.height)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => setKeyboardHeight(0)
    );

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  // Function to dismiss keyboard
  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  // GET - Fetch flashcard set details
  const fetchFlashcardSet = async () => {
    if (!loggedInUser?.id || !setId) return;

    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_URL}/flashcard_sets/${setId}?user_id=${loggedInUser.id}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setFlashcardSet(data.data);
        setEditSetName(data.data.name);
        setEditSetDescription(data.data.description || '');
      } else {
        const data = await response.json();
        Alert.alert('Error', data.error || 'Failed to fetch flashcard set');
        if (response.status === 404) {
          router.back();
        }
      }
    } catch (error) {
      console.error('Error fetching flashcard set:', error);
      Alert.alert('Error', 'Network error while fetching set details');
    }
  };

  // GET - Fetch flashcards for the set
  const fetchFlashcards = async () => {
    if (!loggedInUser?.id || !setId) {
      Alert.alert('Error', 'User not logged in or set ID missing');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_URL}/flashcards/${setId}?user_id=${loggedInUser.id}`
      );
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Server returned ${response.status}`);
      }
      
      const data = await response.json();
      setFlashcards(data.data || []);
    } catch (error: any) {
      console.error('Fetch error:', error);
      Alert.alert('Error', 'Failed to fetch flashcards: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // POST - Create new flashcard
  const createFlashcard = async () => {
    if (!loggedInUser?.id || !setId) {
      Alert.alert('Error', 'User not logged in or set ID missing');
      return;
    }

    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_URL}/flashcards/${setId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            front: 'New Question',
            back: 'New Answer',
            position: flashcards.length + 1,
            user_id: loggedInUser.id,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        const newCard = data.data;
        setFlashcards([newCard, ...flashcards]);
        // Automatically start editing the new card
        setEditingCard(newCard.id);
      } else {
        Alert.alert('Error', data.error || 'Failed to create flashcard');
      }
    } catch (error: any) {
      Alert.alert('Error', 'Network error: ' + error.message);
    }
  };

  // PUT - Update flashcard
  const updateFlashcard = async (cardId: string, updatedData: Partial<Flashcard>) => {
    if (!loggedInUser?.id) {
      Alert.alert('Error', 'User not logged in');
      return false;
    }

    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_URL}/flashcards/${cardId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...updatedData,
            user_id: loggedInUser.id,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        Alert.alert('Error', data.error || 'Failed to update flashcard');
        return false;
      }
      return true;
    } catch (error: any) {
      Alert.alert('Error', 'Network error: ' + error.message);
      return false;
    }
  };

  // PUT - Update flashcard set title/description
  const saveFlashcardSet = async () => {
    if (!loggedInUser?.id || !setId) {
      Alert.alert('Error', 'User not logged in or set ID missing');
      return;
    }

    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_URL}/flashcard_sets/${setId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: editSetName,
            description: editSetDescription,
            user_id: loggedInUser.id,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setFlashcardSet(data.data);
        setEditingSet(false);
        dismissKeyboard();
      } else {
        const data = await response.json();
        Alert.alert('Error', data.error || 'Failed to update flashcard set');
      }
    } catch (error: any) {
      Alert.alert('Error', 'Network error: ' + error.message);
    }
  };

  // Cancel editing set
  const cancelEditingSet = () => {
    setEditSetName(flashcardSet?.name || '');
    setEditSetDescription(flashcardSet?.description || '');
    setEditingSet(false);
    dismissKeyboard();
  };

  // DELETE - Delete flashcard (now using modal)
  const deleteFlashcard = async () => {
    if (!cardToDelete) return;

    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_URL}/flashcards/${cardToDelete.id}?user_id=${loggedInUser?.id}`,
        {
          method: 'DELETE',
        }
      );

      if (response.ok) {
        setFlashcards(flashcards.filter(card => card.id !== cardToDelete.id));
      } else {
        const data = await response.json();
        Alert.alert('Error', data.error || 'Failed to delete flashcard');
      }
    } catch (error: any) {
      Alert.alert('Error', 'Network error: ' + error.message);
    } finally {
      setDeleteModalVisible(false);
      setCardToDelete(null);
    }
  };

  const showDeleteModal = (cardId: string, cardFront: string) => {
    setCardToDelete({ id: cardId, front: cardFront });
    setDeleteModalVisible(true);
  };

  const hideDeleteModal = () => {
    setDeleteModalVisible(false);
    setCardToDelete(null);
  };

  const flipCard = (cardId: string) => {
    setFlashcards(flashcards.map(card => 
      card.id === cardId ? { ...card, isFlipped: !card.isFlipped } : card
    ));
  };

  const toggleComplete = async (cardId: string) => {
    const card = flashcards.find(c => c.id === cardId);
    if (!card) return;

    const updatedCard = { ...card, is_checked: !card.is_checked };
    setFlashcards(flashcards.map(c => 
      c.id === cardId ? updatedCard : c
    ));
    
    // Update on server - include all required fields to prevent null constraint violations
    await updateFlashcard(cardId, { 
      is_checked: updatedCard.is_checked,
      front: card.front,
      back: card.back
    });
  };

  const updateCard = (cardId: string, field: 'front' | 'back', value: string) => {
    setFlashcards(flashcards.map(card => 
      card.id === cardId ? { ...card, [field]: value } : card
    ));
  };

  const saveCardEdits = async (cardId: string) => {
    const card = flashcards.find(c => c.id === cardId);
    if (card) {
      const success = await updateFlashcard(cardId, { 
        front: card.front, 
        back: card.back 
      });
      if (success) {
        setEditingCard(null);
        dismissKeyboard();
      }
    }
  };

  const cancelCardEdits = (cardId: string) => {
    setEditingCard(null);
    dismissKeyboard();
    // Optionally refresh the card data from server or keep local changes
    fetchFlashcards();
  };

  const renderFlashcard = (card: Flashcard) => {
    const isEditing = editingCard === card.id;
    
    return (
      <View key={card.id} style={[styles.flashcard, { backgroundColor: cardBackgroundColor }]}>
        <View style={styles.flashcardHeader}>
          <TouchableOpacity 
            style={styles.checkbox}
            onPress={() => toggleComplete(card.id)}
          >
            <View style={[
              styles.checkboxInner, 
              { borderColor: textColor },
              card.is_checked && { backgroundColor: '#369942' }
            ]}>
              {card.is_checked && (
                <Ionicons name="checkmark" size={12} color={textColor} />
              )}
            </View>
          </TouchableOpacity>

          <View style={styles.cardActions}>
            {isEditing ? (
              <>
                <TouchableOpacity
                  onPress={() => saveCardEdits(card.id)}
                >
                  <Save size={20} color={textColor} />
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                onPress={() => setEditingCard(card.id)}
              >
                <Edit3 size={20} color={textColor} />
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              style={styles.deleteButton}
              onPress={() => showDeleteModal(card.id, card.front)}
            >
              <Text style={styles.deleteButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => !isEditing && flipCard(card.id)}
          disabled={isEditing}
          activeOpacity={isEditing ? 1 : 0.7}
        >
          <View style={styles.flashcardSide}>
            {isEditing ? (
              <View>
                <Text style={[styles.flashcardLabel, { color: textColor }]}>FRONT</Text>
                <TextInput
                  style={[styles.flashcardInput, { 
                    color: textColor,
                    borderColor: placeholderColor 
                  }]}
                  value={card.front}
                  onChangeText={(text) => updateCard(card.id, 'front', text)}
                  placeholder="Enter front text..."
                  placeholderTextColor={placeholderColor}
                  multiline
                  returnKeyType="next"
                  blurOnSubmit={false}
                />
                
                <Text style={[styles.flashcardLabel, { color: textColor, marginTop: 10 }]}>BACK</Text>
                <TextInput
                  style={[styles.flashcardInput, { 
                    color: textColor,
                    borderColor: placeholderColor 
                  }]}
                  value={card.back}
                  onChangeText={(text) => updateCard(card.id, 'back', text)}
                  placeholder="Enter back text..."
                  placeholderTextColor={placeholderColor}
                  multiline
                  returnKeyType="done"
                  onSubmitEditing={() => saveCardEdits(card.id)}
                />
              </View>
            ) : (
              <View>
                <Text style={[styles.flashcardLabel, { color: textColor }]}>
                  {card.isFlipped ? 'BACK' : 'FRONT'}
                </Text>
                <Text style={[styles.flashcardText, { color: textColor }]}>
                  {card.isFlipped ? card.back : card.front}
                </Text>
                {!card.isFlipped && (
                  <View style={styles.flipHint}>
                    <Text style={[styles.flipHintText, { color: textColor, opacity: 0.6 }]}>
                      Tap to reveal answer
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  // Load data when component mounts
  useEffect(() => {
    if (setId && loggedInUser?.id) {
      fetchFlashcardSet();
      fetchFlashcards();
    }
  }, [setId, loggedInUser?.id]);

  if (!setId) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={textColor} />
          </TouchableOpacity>
          <Text style={[styles.heading, { color: textColor }]}>Error: Set ID missing</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <SafeAreaView style={styles.container}>
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <ScrollView 
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: Math.max(100, keyboardHeight + 50) }
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            automaticallyAdjustKeyboardInsets={false}
            keyboardDismissMode="interactive"
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <ArrowLeft size={24} color={textColor} />
              </TouchableOpacity>

              <View style={styles.headerActions}>
                <TouchableOpacity onPress={createFlashcard} style={styles.addButton}>
                  <Plus size={24} color={textColor} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Set Title and Description */}
            <View style={styles.headerContent}>
              {editingSet ? (
                <View>
                  <TextInput
                    style={[styles.headingInput, { 
                      color: textColor,
                      borderColor: placeholderColor 
                    }]}
                    value={editSetName}
                    onChangeText={setEditSetName}
                    placeholder="Set Title"
                    placeholderTextColor={placeholderColor}
                    returnKeyType="next"
                    blurOnSubmit={false}
                  />
                  <TextInput
                    style={[styles.descriptionInput, { 
                      color: textColor,
                      borderColor: placeholderColor 
                    }]}
                    value={editSetDescription}
                    onChangeText={setEditSetDescription}
                    placeholder="Set Description"
                    placeholderTextColor={placeholderColor}
                    multiline
                    returnKeyType="done"
                    onSubmitEditing={saveFlashcardSet}
                  />
                  <View style={styles.editActions}>
                    <TouchableOpacity 
                      style={[styles.button, styles.cancelButton]}
                      onPress={cancelEditingSet}
                    >
                      <Text style={[styles.cancelButtonText, {color: textColor}]}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.button, styles.saveButton]}
                      onPress={saveFlashcardSet}
                    >
                      <Text style={[styles.saveButtonText, {color: textColor}]}>Save</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity onPress={() => setEditingSet(true)}>
                  <Text style={[styles.heading, { color: textColor }]}>
                    {flashcardSet?.name || 'Flashcard Set'}
                  </Text>
                  {flashcardSet?.description && (
                    <Text style={[styles.description, { color: textColor }]}>
                      {flashcardSet.description}
                    </Text>
                  )}
                  <Text style={[styles.editHint, { color: textColor, opacity: 0.6 }]}>
                    Tap to edit
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Flashcards List */}
            <View style={styles.flashcardsContainer}>
              {loading ? (
                <Text style={[styles.loadingText, { color: textColor }]}>Loading flashcards...</Text>
              ) : flashcards.length > 0 ? (
                flashcards.map(renderFlashcard)
              ) : (
                <View style={styles.emptyContainer}>
                  <Text style={[styles.emptyText, { color: textColor }]}>No flashcards yet</Text>
                  <Text style={[styles.emptySubtext, { color: textColor, opacity: 0.7 }]}>
                    Tap the + button to add your first flashcard
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </SafeAreaView>
    </KeyboardAvoidingView>
      <Modal
        animationType="fade"
        transparent={true}
        visible={deleteModalVisible}
        onRequestClose={hideDeleteModal}
      >
        <TouchableWithoutFeedback onPress={hideDeleteModal}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={[styles.modalContent, { backgroundColor: cardBackgroundColor }]}>
                <Text style={[styles.modalTitle, { color: textColor }]}>
                  Delete Flashcard
                </Text>
                
                <Text style={[styles.modalMessage, { color: textColor }]}>
                  Are you sure you want to delete this flashcard?
                </Text>
                
                {cardToDelete && (
                  <View style={[styles.cardPreview, { backgroundColor: backgroundColor }]}>
                    <Text style={[styles.cardPreviewText, { color: textColor }]} numberOfLines={2}>
                      "{cardToDelete.front}"
                    </Text>
                  </View>
                )}
                
                <Text style={[styles.modalWarning, { color: textColor, opacity: 0.7 }]}>
                  This action cannot be undone.
                </Text>

                <View style={styles.modalActions}>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.modalCancelButton, { backgroundColor: cancelButtonColor}]}
                    onPress={hideDeleteModal}
                  >
                    <Text style={[styles.modalButtonText, { color: textColor }]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.modalDeleteButton]}
                    onPress={deleteFlashcard}
                  >
                    <Text style={[styles.modalButtonText, { color: textColor }]}>
                      Delete
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
      </>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    padding: 5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  saveSetButton: {
    padding: 5,
  },
  addButton: {
    padding: 5,
  },
  headerContent: {
    marginBottom: 30,
  },
  heading: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    marginBottom: 5,
  },
  description: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    marginBottom: 5,
  },
  editHint: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    fontStyle: 'italic',
  },
  headingInput: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  descriptionInput: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
    textAlignVertical: 'top',
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  button: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  cancelButtonText: {
    fontFamily: 'Poppins-Regular',
  },
  saveButtonText: {
    fontFamily: 'Poppins-Regular',
  },

  // Flashcards
  flashcardsContainer: {
    marginBottom: 20,
  },
  flashcard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  flashcardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  checkbox: {
    padding: 5,
  },
  checkboxInner: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  editButton: {
    padding: 5,
  },
  saveButton: {
    backgroundColor: '#5CAEF1',
    padding: 10,
    borderRadius: 10,
  },
  cancelButton: {
    padding: 5,
  },
  cancelText: {
    color: '#666',
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
  },
  deleteButton: {
    padding: 5,
  },
  deleteButtonText: {
    color: '#E36062',
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
  },
  flashcardSide: {
    flex: 1,
  },
  flashcardLabel: {
    fontSize: 12,
    fontFamily: 'Poppins-SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  flashcardText: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    lineHeight: 22,
    minHeight: 44,
  },
  flashcardInput: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    minHeight: 44,
    textAlignVertical: 'top',
    marginBottom: 8,
  },
  flipHint: {
    alignItems: 'center',
    marginTop: 8,
  },
  flipHintText: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    fontStyle: 'italic',
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    marginTop: 50,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: 'Poppins-Medium',
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
  modalContent: {
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  cardPreview: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  cardPreviewText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  modalWarning: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalCancelButton: {
    borderWidth: 1,
  },
  modalDeleteButton: {
    backgroundColor: '#E36062',
  },
  modalButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
  },
});