import { useUser } from '@/contexts/UserContext';
import * as DocumentPicker from 'expo-document-picker';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import * as WebBrowser from 'expo-web-browser';
import { ArrowLeft, Bookmark, BookOpen, Calendar, Clock, Eye, Info, Laptop, MapPin, Send, Trash2, Upload, Users, X, } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert,
  Dimensions,
  Image, Linking, Modal,
  RefreshControl,
  SafeAreaView, StyleSheet, Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Colors } from '../../constants/Colors';

const { width } = Dimensions.get('window');

interface Event {
  id: string;
  title: string;
  bannerColor: number;
  description: string;
  location?: string | null;
  study_room?: string | null;
  virtual_room_link?: string | null;
  class: string;
  event_format: string;
  date_and_time: Date;
  creator_id: string;
  creator_profile_picture: string;
  created_at: string;
  event_type: string;
  status: string;
  capacity: number;
  tags: string[];
  is_online?: boolean;
}

interface RSVP {
  user_id: string;
  username: string;
  full_name: string;
  profile_picture_url?: string;
  status: string;
}

interface Material {
  id: string;
  title: string;
  description?: string;
  file_url: string;
  file_name: string;
  file_size: number;
  file_type: string;
  user_id: string; 
  uploaded_at: string;
  uploader_username: string; 
  uploader_full_name: string; 
}

const EventViewScreen = () => {
  const { isDarkMode, user } = useUser();
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const router = useRouter();
  const { user: loggedInUser, updateUserData } = useUser();

  // Colors
  const backgroundColor = !isDarkMode ? Colors.light.background : Colors.dark.background;
  const textColor = !isDarkMode ? Colors.light.text : Colors.dark.text;
  const textInputColor = !isDarkMode ? Colors.light.textInput : Colors.dark.textInput;
  const bannerColors = Colors.bannerColors;
  const placeholderTextColor = !isDarkMode ? Colors.light.placeholderText : Colors.dark.placeholderText;
  const cancelButtonColor = !isDarkMode ? Colors.light.cancelButton : Colors.dark.cancelButton;

const userId = user?.id; // Use logged-in user's ID

// Debug logging
console.log('UserContext user:', user);
console.log('UserContext userId:', userId);
  const [comment, setComment] = useState('');
  const [isRSVPed, setIsRSVPed] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [event, setEvent] = useState<Event | null>(null);
  const [rsvps, setRsvps] = useState<RSVP[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  
  // Add refresh state
  const [refreshing, setRefreshing] = useState(false);

  const formatDate = (dateAndTime: Date | string | null) => {
    if (!dateAndTime) return 'Invalid date';
    try {
      const date = new Date(dateAndTime);
      if (isNaN(date.getTime())) return 'Invalid date';
      const year = date.getUTCFullYear();
      const month = date.getUTCMonth() + 1;
      const day = date.getUTCDate();
      return `${month}/${day}/${year}`;
    } catch {
      return 'Invalid date';
    }
  };

  const formatTime = (dateAndTime: Date | string | null) => {
    if (!dateAndTime) return 'Select Time';
    try {
      const date = new Date(dateAndTime);
      if (isNaN(date.getTime())) return 'Select Time';
      const hours = date.getUTCHours();
      const minutes = date.getUTCMinutes();
      const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const minutesStr = minutes.toString().padStart(2, '0');
      return `${hour12}:${minutesStr} ${ampm}`;
    } catch {
      return 'Select Time';
    }
  };
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [isBackendConnected, setIsBackendConnected] = useState(true);
  
  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  // File viewer modal state
  const [showFileViewerModal, setShowFileViewerModal] = useState(false);
  const [selectedFileUrl, setSelectedFileUrl] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [selectedFileType, setSelectedFileType] = useState<string>('');
  


  // -------- Fetch Event --------
  const fetchEvent = async () => {
    if (!eventId) return;
    try {
      const res = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/events/${eventId}`);
      if (res.ok) {
        const data = await res.json();
        setEvent(data);
      }
    } catch (error) {
      console.error('Failed to fetch event:', error);
    } finally {
      setLoading(false);
    }
  };

  const [bannerColor, setBannerColor] = useState<string | null>(null);

  useEffect(() => {
      const fetchBannerColor = async () => {
        if (!event?.creator_id) return;
        try {
          const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/users/${event.creator_id}`);
          if (response.ok) {
            const data = await response.json();
            setBannerColor(bannerColors[data.banner_color] || null);
          } else {
            setBannerColor(null);
          }
        } catch (error) {
          console.error('Error fetching banner color:', error);
          setBannerColor(null);
        }
      };
      fetchBannerColor();
    }, [bannerColors, event?.creator_id]);
    
  const [isOwner, setIsOwner] = useState(false);

  const checkIfOwner = () => {
    if (event?.creator_id === loggedInUser?.id) {
      setIsOwner(true);
    }
  };

  useEffect(() => {
    checkIfOwner();
  }, [event, loggedInUser]);

  const fetchRSVPs = async () => {
    if (!eventId) return;
    try {
      const res = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/events/${eventId}/rsvps`);
      if (res.ok) {
        const data = await res.json();
        setRsvps(data.rsvps || []);
      }
    } catch {}
  };

  const fetchComments = async () => {
    if (!eventId) return;
    try {
      const res = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/events/${eventId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      }
    } catch {}
  };

  // -------- RSVP and Save status --------
  const fetchUserStatuses = async () => {
    if (!eventId || !userId) return;
    try {
      // Fetch RSVP status
      const rsvpRes = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/events/${eventId}/rsvpd?user_id=${userId}`);
      if (rsvpRes.ok) {
        const rsvpData = await rsvpRes.json();
        setIsRSVPed(Boolean(rsvpData.rsvp?.status === 'accepted'));
      }

      // Fetch save status
      const saveRes = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/users/${userId}/saved-events/${eventId}`);
      if (saveRes.ok) {
        const saveData = await saveRes.json();
        setIsSaved(Boolean(saveData.is_saved));
      }
    } catch (error) {
      console.error('Error fetching user statuses:', error);
    }
  };

  // -------- Refresh function --------
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchEvent(),
        fetchRSVPs(), 
        fetchComments(),
        fetchUserStatuses()
      ]);
    } catch (error) {
      console.error('Error during refresh:', error);
    } finally {
      setRefreshing(false);
    }
  }, [eventId, userId]);

  const fetchMaterials = async (retryCount = 0) => {
    try {
      const res = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/events/${eventId}/materials`);
      if (res.ok) {
        const data = await res.json();
        console.log('Fetched materials:', data.materials);
        console.log('Current userId:', userId);
        setMaterials(data.materials || []);
      } else {
        console.error('Failed to fetch materials, status:', res.status);

        if (retryCount < 3) {
          setTimeout(() => {
            console.log(`Retrying fetchMaterials (attempt ${retryCount + 1})`);
            fetchMaterials(retryCount + 1);
          }, Math.pow(2, retryCount) * 1000); 
        }
      }
    } catch (error) {
      console.error('Failed to fetch materials:', error);
      // Retry on network errors
      if (retryCount < 3) {
        setTimeout(() => {
          console.log(`Retrying fetchMaterials after error (attempt ${retryCount + 1})`);
          fetchMaterials(retryCount + 1);
        }, Math.pow(2, retryCount) * 1000);
      }
    }
  };

  const checkBackendHealth = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/health`, {
        method: 'GET',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      setIsBackendConnected(response.ok);
      return response.ok;
    } catch (error) {
      console.error('Backend health check failed:', error);
      setIsBackendConnected(false);
      return false;
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFilePick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const file = result.assets[0];
        
        const maxSize = 20 * 1024 * 1024; // 20MB in bytes
        if (file.size && file.size > maxSize) {
          Alert.alert('File Too Large', 'File size must be 20MB or less');
          return;
        }
        
        // Check file type
        const allowedTypes = [
          'application/pdf',                                                    // PDF
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
          'image/jpeg',                                                        // JPG
          'image/png',                                                         // PNG
          'application/vnd.openxmlformats-officedocument.presentationml.presentation' // PPTX
        ];
        
        if (file.mimeType && !allowedTypes.includes(file.mimeType)) {
          Alert.alert(
            'File Type Not Allowed', 
            'Only PDF, DOCX, PNG, JPG, and PPTX files are accepted.\n\n' +
            'Selected file type: ' + (file.mimeType || 'Unknown')
          );
          return;
        }
        
        setSelectedFile(file);
      }
    } catch (error) {
      console.error('Error picking file:', error);
      Alert.alert('Error', 'Failed to select file');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !uploadTitle.trim()) {
      Alert.alert('Error', 'Please select a file and enter a title');
      return;
    }

    if (!userId) {
      Alert.alert('Error', 'You must be logged in to upload materials');
      return;
    }

    // Check if event already has maximum number of materials (10)
    if (materials.length >= 10) {
      Alert.alert('Maximum Materials Reached', 'This event already has the maximum of 10 study materials');
      return;
    }

    // Double-check file type before upload
    const allowedTypes = [
      'application/pdf',                                                    // PDF
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
      'image/jpeg',                                                        // JPG
      'image/png',                                                         // PNG
      'application/vnd.openxmlformats-officedocument.presentationml.presentation' // PPTX
    ];
    
    if (selectedFile.mimeType && !allowedTypes.includes(selectedFile.mimeType)) {
      Alert.alert(
        'File Type Not Allowed', 
        'The selected file type is not supported. Please select a PDF, DOCX, PNG, JPG, or PPTX file.'
      );
      return;
    }

    setIsUploading(true);
    try {
      console.log('Uploading with userId:', userId);
      console.log('Uploading with title:', uploadTitle.trim());
      console.log('Uploading with file:', selectedFile);
      
      const formData = new FormData();
      formData.append('file', {
        uri: selectedFile.uri,
        type: selectedFile.mimeType || 'application/octet-stream',
        name: selectedFile.name,
      } as any);
      formData.append('title', uploadTitle.trim());
      formData.append('description', uploadDescription.trim());
      formData.append('userId', userId);

      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/events/${eventId}/materials`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.ok) {
        Alert.alert('Success', 'Study material uploaded successfully!');
        await fetchMaterials();
        resetUploadForm();
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.error || 'Failed to upload material');
      }
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'Failed to upload material');
    } finally {
      setIsUploading(false);
    }
  };

  const resetUploadForm = () => {
    setShowUploadModal(false);
    setUploadTitle('');
    setUploadDescription('');
    setSelectedFile(null);
  };



  const canViewFile = (fileType: string): boolean => {
    const viewableTypes = ['pdf', 'png', 'jpg', 'jpeg', 'gif', 'docx', 'pptx'];
    return viewableTypes.some(type => fileType.toLowerCase().includes(type));
  };

  const openFileViewer = (fileUrl: string, fileName: string, fileType: string) => {
    setSelectedFileUrl(fileUrl);
    setSelectedFileName(fileName);
    setSelectedFileUrl(fileUrl);
    setSelectedFileType(fileType);
    setShowFileViewerModal(true);
  };

  const closeFileViewer = () => {
    setShowFileViewerModal(false);
    setSelectedFileUrl(null);
    setSelectedFileName('');
    setSelectedFileType('');
  };

  const handleFileAction = async (fileUrl: string, fileName: string, fileType: string) => {
    const fileTypeLower = fileType.toLowerCase();
    
    if (fileTypeLower.includes('pdf')) {
      WebBrowser.openBrowserAsync(fileUrl);
    } else if (fileTypeLower.includes('png') || fileTypeLower.includes('jpg') || fileTypeLower.includes('jpeg') || fileTypeLower.includes('gif')) {
      openFileViewer(fileUrl, fileName, fileType);
    } else if (fileTypeLower.includes('docx') || fileTypeLower.includes('pptx')) {
      // For Office documents, try to open in browser first, fallback to sharing
      try {
        await WebBrowser.openBrowserAsync(fileUrl);
      } catch (error) {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUrl);
        } else {
          Alert.alert('View File', 'This file type cannot be viewed directly. Please download it to view.');
        }
      }
    } else {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUrl);
      } else {
        Alert.alert('View File', 'This file type cannot be viewed directly. Please download it to view.');
      }
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.toLowerCase().includes('pdf')) return 'PDF';
    if (fileType.toLowerCase().includes('doc') || fileType.toLowerCase().includes('docx')) return 'DOCX';
    if (fileType.toLowerCase().includes('ppt') || fileType.toLowerCase().includes('pptx')) return 'PPTX';
    if (fileType.toLowerCase().includes('png') || fileType.toLowerCase().includes('jpg') || fileType.toLowerCase().includes('jpeg')) return 'IMG';
    return 'FILE';
  };

  const deleteMaterial = async (materialId: string) => {
    Alert.alert(
      'Delete Material',
      'Are you sure you want to delete this study material?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
                         try {
               console.log('Deleting material with:', { materialId, userId, eventId });
               const requestBody = { userId: userId };
               console.log('Request body:', requestBody);
               console.log('Request body stringified:', JSON.stringify(requestBody));
               console.log('userId type:', typeof userId);
               console.log('userId value:', userId);
               
               const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/events/${eventId}/materials/${materialId}?userId=${userId}`, {
                 method: 'DELETE',
                 headers: {
                   'Accept': 'application/json',
                 },
               });

                             if (response.ok) {
                 await fetchMaterials();
               } else {
                 const errorData = await response.json();
                 console.error('Delete response error:', errorData);
                 Alert.alert('Error', errorData.error || 'Failed to delete material');
               }
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert('Error', 'Failed to delete material');
            }
          },
        },
      ]
    );
  };

  // -------- Comment Handling --------
  const addComment = async () => {
    if (!comment.trim() || !userId) return;
    try {
      const res = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/events/${eventId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, content: comment.trim() })
      });
      if (res.ok) {
        const data = await res.json();
        setComments(prev => [...prev, data.comment]);
        setComment('');
      }
    } catch {}
  };

  const deleteComment = async (commentId: string) => {
    if (!userId) return;
    try {
      const res = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/events/${eventId}/comments/${commentId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      });
      if (res.ok) {
        setComments(prev => prev.filter(c => c.id !== commentId));
      }
    } catch {}
  };

  useEffect(() => {
    fetchEvent();
    fetchRSVPs();
    fetchComments();
    fetchMaterials();
    checkBackendHealth(); 
  }, [eventId]);

  // Refresh materials when screen comes into focus (e.g., when navigating back)
  useFocusEffect(
    useCallback(() => {
      if (eventId) {
        fetchMaterials();
      }
    }, [eventId])
  );

  useEffect(() => {
    if (!process.env.EXPO_PUBLIC_BACKEND_URL) return;

    fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/events/${eventId}/rsvpd?user_id=${userId}`)
      .then(res => res.json())
      .then(data => setIsRSVPed(Boolean(data.rsvp?.status === 'accepted')))
      .catch(console.error);

    fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/users/${userId}/saved-events/${eventId}`)
      .then(res => res.json())
      .then(data => setIsSaved(Boolean(data.is_saved)))
      .catch(console.error);
      
    if (userId) {
      fetchMaterials();
    }
  }, [eventId, userId]);

  // -------- RSVP / Save --------
  const toggleRSVP = async () => {
    if (busy || !eventId || !userId) return;
    setBusy(true);
    try {
      if (isRSVPed) {
        await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/events/${eventId}/rsvpd`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId }),
        });
        setIsRSVPed(false);
      } else {
        await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/events/${eventId}/rsvpd`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId, status: 'accepted' }),
        });
        setIsRSVPed(true);
      }
      await fetchEvent();
      await fetchRSVPs();
    } catch {
    } finally {
      setBusy(false);
    }
  };

  const toggleSave = async () => {
    if (busy || !eventId || !userId) return;
    setBusy(true);
    try {
      if (isSaved) {
        await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/users/${userId}/saved-events/${eventId}`, {
          method: 'DELETE',
        });
        setIsSaved(false);
      } else {
        await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/users/${userId}/saved-events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event_id: eventId }),
        });
        setIsSaved(true);
      }
    } catch {
    } finally {
      setBusy(false);
    }
  };

  // -------- Effects --------
  useEffect(() => {
    fetchEvent();
    fetchRSVPs();
    fetchComments();
  }, [eventId]);

  useEffect(() => {
    fetchUserStatuses();
  }, [eventId, userId]);

  if (!event) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: textColor }]}>Event not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const displayedRSVPs = rsvps.slice(0, 6);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <KeyboardAwareScrollView 
        contentContainerStyle={styles.scrollContent} 
        enableOnAndroid 
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={300}
        enableAutomaticScroll={true}
        keyboardDismissMode="interactive"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#5CAEF1']} // Android
            tintColor={'#5CAEF1'} // iOS
          />
        }
      >
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <ArrowLeft 
              size={24} 
              color={textColor}
              onPress={() => router.back()}
              style={{marginBottom: 15}}
            />
            {!isBackendConnected && (
              <View style={styles.connectionWarning}>
                <Text style={styles.connectionWarningText}> Backend Connection Issue</Text>
              </View>
            )}
          </View>
          {/* Event Card */}
          <View style={[styles.eventCard, { backgroundColor: textInputColor }]}>
            <View style={[styles.eventHeader, { backgroundColor: bannerColor || textInputColor}]}>
              <Text style={[styles.eventTitle, { color: textColor }]}>{event.title}</Text>
              <TouchableOpacity onPress={() => router.push({ pathname: '/Profile/External', params: { userId: event.creator_id } })}>
                <Image source={{ uri: event.creator_profile_picture }} style={styles.ownerAvatar ? styles.ownerAvatar : require('../../assets/images/default_profile.jpg')} />
              </TouchableOpacity>
            </View>

            <View style={styles.eventContent}>
              {event.tags && event.tags.length > 0 && (
                <View style={[styles.tagsRow, { maxWidth: event.tags.length <= 2 ? 175 : 'auto'}]}>
                  {event.tags.slice(0, 3).map((tag, i) => (
                    <View key={i} style={[styles.tag, { borderColor: textColor }]}>
                      <Text style={[styles.tagText, { color: textColor }]}>{tag}</Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.detailsContainer}>
                <View style={styles.detailRow}>
                  <BookOpen size={20} color={textColor} />
                  <Text style={[styles.detailText, { color: textColor }]}>{event.class}</Text>
                </View>

                {/* Updated location handling to match EventCollapsible */}
                {(event.event_format === 'In-Person' || event.event_format === 'In Person') && (
                  <View style={styles.detailRow}>
                    <MapPin size={20} color={textColor} />
                    <Text style={[styles.detailText, { color: textColor }]}>
                      {event.location}{event.study_room ? ` - ${event.study_room}` : ''}
                    </Text>
                  </View>
                )}

                {/* Added online event handling like EventCollapsible */}
                {event.event_format === 'Online' && (
                  <View style={styles.detailRow}>
                    <Laptop size={20} color={textColor} />
                    <TouchableOpacity
                      onPress={() =>
                        event.virtual_room_link
                          ? Linking.openURL(
                              event.virtual_room_link.startsWith('http://') || event.virtual_room_link.startsWith('https://')
                                ? event.virtual_room_link
                                : `http://${event.virtual_room_link}`
                            )
                          : null
                      }
                    >
                      <Text style={[styles.detailText, { color: textColor }]}>{event.virtual_room_link}</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <View style={styles.detailRow}>
                  <Calendar size={20} color={textColor} />
                  <Text style={[styles.detailText, { color: textColor }]}>{formatDate(event.date_and_time)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Clock size={20} color={textColor} />
                  <Text style={[styles.detailText, { color: textColor }]}>{formatTime(event.date_and_time)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Users size={20} color={textColor} />
                  <Text style={[styles.detailText, { color: textColor }]}>
                    {rsvps.length}/{event.capacity}
                  </Text>
                </View>

                <View style={styles.avatarsContainer}>
                  {displayedRSVPs.map((r, i) => (
                    <View key={i} style={styles.rsvpAvatar}>
                      <TouchableOpacity onPress={() => router.push({ pathname: '/Profile/External', params: { userId: r.user_id } })}>
                        <Image
                          source={r.profile_picture_url ? { uri: r.profile_picture_url } : require('../../assets/images/default_profile.jpg')}
                          style={styles.avatarImage}
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>

              {event.description && (
                <View style={styles.infoSection}>
                  <View style={styles.infoRow}>
                    <Info size={20} color={textColor} />
                    <Text style={[styles.infoText, { color: textColor }]}>{event.description}</Text>
                  </View>
                </View>
              )}

              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                {isOwner && (
                <TouchableOpacity onPress={() => router.push({ pathname: '/CreateEvent/EditEvent', params: { eventId } })} style={styles.editButton}>
                  <Text style={[styles.editButtonText, { color: textColor }]}>Edit</Text>
                </TouchableOpacity>
                )}

                {!isOwner && (
                  <>
                    {(rsvps.length < event.capacity || isRSVPed) &&(
                      <>
                      <TouchableOpacity onPress={toggleRSVP} disabled={busy} style={[styles.rsvpButton, { backgroundColor: isRSVPed ? cancelButtonColor : '#5CAEF1' }]}>
                        <Text style={[styles.rsvpButtonText, { color: textColor }]}>{isRSVPed ? 'RSVPed' : 'RSVP'}</Text>
                      </TouchableOpacity>

                      <TouchableOpacity onPress={toggleSave}>
                        <Bookmark color={textColor} size={25} fill={isSaved ? textColor : 'none'} style={styles.saveButtonContainer} />
                      </TouchableOpacity>
                      </>
                    )}
                    {!(rsvps.length < event.capacity || isRSVPed) && (
                      <TouchableOpacity onPress={toggleSave}>
                        <Bookmark color={textColor} size={25} fill={isSaved ? textColor : 'none'} style={[styles.saveButtonContainer, {marginTop: -20, marginLeft: 290, marginBottom: 10}]} />
                      </TouchableOpacity>
                    )}
                  </>
                )}
              </View>
            </View>
          </View>

          {/* Study Materials Section */}
          <Text style={[styles.studyMaterialsTitle, { color: textColor }]}>
            Study Materials ({materials.length}/10)
          </Text>
          
                       <View style={styles.materialsContainer}>
             {/* Display existing materials */}
             {materials.map((material, index) => (
              <TouchableOpacity 
                key={material.id} 
                style={[styles.materialCard, { backgroundColor: textInputColor }]}
                                 onPress={() => {
                   // Use the new file action handler for all file types
                   handleFileAction(material.file_url, material.file_name, material.file_type);
                 }}
                activeOpacity={0.7}
              >
                                 <View style={styles.materialHeader}>
                                       <View style={styles.materialTitleRow}>
                      <Text style={[styles.fileTypeIcon, { color: textColor }]}>{getFileIcon(material.file_type)}</Text>
                      <Text style={[styles.materialTitle, { color: textColor }]} numberOfLines={1}>
                        {material.title}
                      </Text>
                    </View>
                   <View style={styles.materialActions}>
                     {canViewFile(material.file_type) && (
                                               <TouchableOpacity 
                          onPress={(e) => {
                            e.stopPropagation(); // Prevent triggering the card's onPress
                            handleFileAction(material.file_url, material.file_name, material.file_type);
                          }}
                          style={styles.viewButton}
                        >
                          <Eye size={16} color="#5CAEF1" />
                        </TouchableOpacity>
                     )}
                                           {(material.user_id === userId || 
                        material.user_id === userId?.toString() || 
                        material.user_id?.toString() === userId) && (
                        <TouchableOpacity 
                          onPress={(e) => {
                            e.stopPropagation(); // Prevent triggering the card's onPress
                            console.log('Delete button clicked for material:', material.title);
                            deleteMaterial(material.id);
                          }}
                          style={styles.materialDeleteButton}
                        >
                          <Trash2 size={18} color="#ff4444" />
                        </TouchableOpacity>
                      )}
                      
                      
                   </View>
                 </View>
                                 <Text style={[styles.materialInfo, { color: placeholderTextColor }]}>
                   {formatBytes(material.file_size)} • {material.uploader_username || material.uploader_full_name}
                   {canViewFile(material.file_type) && (
                     <Text style={{ color: '#5CAEF1', fontWeight: 'bold' }}> • Viewable</Text>
                   )}
                 </Text>
                {material.description && (
                  <Text style={[styles.materialDescription, { color: placeholderTextColor }]} numberOfLines={2}>
                    {material.description}
                  </Text>
                )}
              </TouchableOpacity>
                         ))}
             
             {/* Add Material Button - positioned on the right */}
             <TouchableOpacity 
               style={[
                 styles.addMaterialCard, 
                 { 
                   borderColor: materials.length >= 10 ? placeholderTextColor : textColor,
                   opacity: materials.length >= 10 ? 0.5 : 1
                 }
               ]}
               onPress={() => {
                 if (!userId) {
                   Alert.alert('Error', 'You must be logged in to upload materials');
                   return;
                 }
                 if (materials.length >= 10) {
                   Alert.alert('Maximum Materials Reached', 'This event already has the maximum of 10 study materials');
                   return;
                 }
                 setShowUploadModal(true);
               }}
               disabled={materials.length >= 10}
             >
               <Text style={[styles.addMaterialPlus, { color: materials.length >= 10 ? placeholderTextColor : textColor }]}>+</Text>
             </TouchableOpacity>
             
             {/* Show message when maximum materials reached */}
             {materials.length >= 10 && (
               <Text style={[styles.materialInfo, { color: 'orange', textAlign: 'center', marginTop: 10 }]}>
                 Maximum of 10 study materials reached for this event
               </Text>
             )}
           </View>

          <View style={styles.commentsSection}>
            <Text style={[styles.commentsTitle, { color: textColor }]}>Comments ({comments.length})</Text>

            {comments.map(c => (
              <View key={c.id} style={[styles.commentItem, { backgroundColor: textInputColor, borderRadius: 10, padding: 10}]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <TouchableOpacity onPress={() => router.push({ pathname: '/Profile/External', params: { userId: c.user_id } })}>
                    <Image
                      source={c.profile_picture_url ? { uri: c.profile_picture_url } : require('../../assets/images/default_profile.jpg')}
                      style={{ width: 32, height: 32, borderRadius: 16, marginRight: 8 }}
                    />
                  </TouchableOpacity>
                  <View style={{ flex: 1 ,}}>
                    <Text style={{ color: textColor, fontFamily: 'Poppins-SemiBold' }}>{c.full_name || c.username}</Text>
                    <Text style={{ color: placeholderTextColor, fontFamily: 'Poppins-Regular', fontSize: 12 }}>
                      {new Date(c.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  {c.user_id === userId && (
                    <TouchableOpacity onPress={() => deleteComment(c.id)} style={{ padding: 4 }}>
                      <Text style={{ color: '#E36062', fontSize: 18 }}>×</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <Text style={{ color: textColor, fontFamily: 'Poppins-Regular', lineHeight: 20, marginLeft: 40 }}>
                  {c.content}
                </Text>
              </View>
            ))}

            <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginTop: 8 }}>
              <TextInput
                style={[styles.commentInput, { backgroundColor: textInputColor, color: textColor }]}
                placeholder="Add a comment..."
                placeholderTextColor={placeholderTextColor}
                value={comment}
                onChangeText={setComment}
                multiline
              />
              <TouchableOpacity onPress={addComment} disabled={!comment.trim()}>
                <View style={{ padding: 10, opacity: comment.trim() ? 1 : 0.5, marginTop: -40}}>
                  <Send size={20} color={comment.trim() ? '#5CAEF1' : placeholderTextColor} strokeWidth={2} />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAwareScrollView>

      {/* Upload Modal */}
      <Modal
        visible={showUploadModal}
        animationType="slide"
        transparent={false}
        onRequestClose={resetUploadForm}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor }]}>
          <View style={[styles.modalContent, { backgroundColor }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: textColor }]}>Upload Study Material</Text>
              <TouchableOpacity onPress={resetUploadForm}>
                <X size={24} color={textColor} />
              </TouchableOpacity>
            </View>

            <KeyboardAwareScrollView style={styles.modalBody}>
              <Text style={[styles.inputLabel, {fontFamily: 'Poppins-Regular', color: textColor }]}>Title *</Text>
              <TextInput
                style={[styles.uploadInput, { backgroundColor: textInputColor, color: textColor }]}
                placeholder="Enter material title"
                placeholderTextColor={placeholderTextColor}
                value={uploadTitle}
                onChangeText={setUploadTitle}
              />

              <Text style={[styles.inputLabel, {fontFamily: 'Poppins-Regular', color: textColor }]}>Description</Text>
              <TextInput
                style={[styles.uploadInput, styles.descriptionInput, { backgroundColor: textInputColor, color: textColor }]}
                placeholder="Enter description (optional)"
                placeholderTextColor={placeholderTextColor}
                value={uploadDescription}
                onChangeText={setUploadDescription}
                multiline
                numberOfLines={3}
              />

                             <TouchableOpacity
                 style={[styles.filePickerButton, { borderColor: textColor }]}
                 onPress={handleFilePick}
               >
                 <Upload size={20} color={textColor} />
                 <Text style={[styles.filePickerText, { color: textColor }]}>
                   {selectedFile ? selectedFile.name : 'Select File'}
                 </Text>
               </TouchableOpacity>
               
                               <Text style={[styles.materialInfo, { color: placeholderTextColor, textAlign: 'center', marginTop: 8 }]}>
                  Maximum file size: 20MB • Supported: PDF, DOCX, PNG, JPG, PPTX
                </Text>

              {selectedFile && (
                <View style={styles.selectedFileInfo}>
                  <Text style={[styles.selectedFileName, { color: textColor }]}>{selectedFile.name}</Text>
                  <Text style={[styles.selectedFileSize, { color: placeholderTextColor }]}>
                    {formatBytes(selectedFile.size || 0)}
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={[
                  styles.uploadButton,
                  { backgroundColor: uploadTitle.trim() && selectedFile ? '#5CAEF1' : '#e0e0e0' }
                ]}
                onPress={handleUpload}
                disabled={!uploadTitle.trim() || !selectedFile || isUploading}
              >
                {isUploading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={[styles.uploadButtonText, { color: textColor }]}>Upload Material</Text>
                )}
              </TouchableOpacity>
            </KeyboardAwareScrollView>
          </View>
                 </SafeAreaView>
               </Modal>

        {/* File Viewer Modal */}
        <Modal
          visible={showFileViewerModal}
          animationType="slide"
          transparent={false}
          onRequestClose={closeFileViewer}
        >
          <SafeAreaView style={[styles.modalContainer, { backgroundColor }]}>
            <View style={[styles.modalContent, { backgroundColor }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: textColor }]} numberOfLines={1}>
                  {selectedFileName}
                </Text>
                <TouchableOpacity onPress={closeFileViewer}>
                  <X size={24} color={textColor} />
                </TouchableOpacity>
              </View>
              
              {selectedFileUrl && (
                <View style={styles.fileViewerContainer}>
                  {selectedFileType.toLowerCase().includes('png') || 
                   selectedFileType.toLowerCase().includes('jpg') || 
                   selectedFileType.toLowerCase().includes('jpeg') || 
                   selectedFileType.toLowerCase().includes('gif') ? (
                    // Image viewer
                    <Image 
                      source={{ uri: selectedFileUrl }} 
                      style={styles.imageViewer}
                      resizeMode="contain"
                    />
                  ) : (
                    // For other file types, show file info and options
                    <View style={styles.fileInfoContainer}>
                      <Text style={[styles.fileInfoText, { color: textColor }]}>
                        File: {selectedFileName}
                      </Text>
                      <Text style={[styles.fileInfoText, { color: placeholderTextColor }]}>
                        Type: {selectedFileType}
                      </Text>
                      <TouchableOpacity
                        style={styles.openInBrowserButton}
                        onPress={() => {
                          WebBrowser.openBrowserAsync(selectedFileUrl);
                          closeFileViewer();
                        }}
                      >
                        <Text style={styles.openInBrowserButtonText}>Open in Browser</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
            </View>
          </SafeAreaView>
        </Modal>
        
      </SafeAreaView>
   );
 };


const styles = StyleSheet.create({
  container: { flex: 1 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 18, fontFamily: 'Poppins-Regular' },
  scrollContent: { flexGrow: 1 },
  content: { padding: 20},
  eventCard: {
    borderRadius: 10,
    marginBottom: 5,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 10,
  },
  eventTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: '#fff',
    flex: 1,
  },
  ownerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownerAvatarText: {
    fontSize: 16,
  },
  eventContent: {
    padding: 16,
  },
  tagsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  tagsContainer: {
    flexDirection: 'row',
    flex: 1,
  },
  tag: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginRight: 8,
  },
  tagText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
  },
  detailsContainer: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    marginLeft: 8,
    flex: 1,
  },
  avatarsContainer: {
    flexDirection: 'row',
    marginLeft: 30,
  },
  rsvpAvatar: {
    marginRight: 5,
  },
  avatarImage: {
    width: 25,
    height: 25,
    borderRadius: 12,
  },
  avatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  avatarText: {
    fontSize: 10,
    fontFamily: 'Poppins-SemiBold',
  },
  infoSection: {
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  rsvpButton: {
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    marginRight: 15,
    flex: 1,
  },
  editButton: {
    backgroundColor: '#5CAEF1',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    flex: 1,
  },
  rsvpButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
  },
  editButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
  },
  saveButtonContainer: {
    alignContent: 'center',
    top: 10
  },
  commentsSection: {
    marginTop: 10,
  },
  commentsTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 10,
  },
  addCommentContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 8,
  },
  commentInput: {
    flex: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: -40,
    maxHeight: 100,
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
  },
  sendButton: {
    padding: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  commentItem: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomColor: '#666666',
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  commentInfo: {
    flex: 1,
  },
  commentAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  commentAuthor: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
  },
  eventOwnerTag: {
    backgroundColor: '#5CAEF1',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  eventOwnerTagText: {
    fontSize: 10,
    fontFamily: 'Poppins-Medium',
    color: '#fff',
  },
  commentTime: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
  },
  commentContent: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    lineHeight: 20,
    marginLeft: 40,
  },
  deleteButton: {
    padding: 4,
  },
  deleteButtonText: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
  },
  studyMaterialsSection: {
    borderRadius: 16,
    marginBottom: 20,
    padding: 16,
    borderWidth: 1,
  },
  studyMaterialsTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 10,
    marginTop: 20,
  },
  materialsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 20,
  },
  addMaterialCard: {
    width: 60,
    height: 60,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginBottom: 10,
  },
  addMaterialPlus: {
    fontSize: 30,
    fontFamily: 'Poppins-Bold',
  },
  materialCard: {
    padding: 12,
    borderRadius: 12,
    marginRight: 10,
    marginBottom: 10,
    minWidth: 120,
    maxWidth: width * 0.4,
  },
  materialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  materialTitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    flex: 1,
    marginRight: 8,
  },
  materialInfo: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
  },
  modalBody: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 8,
    marginTop: 16,
  },
  uploadInput: {
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    marginBottom: 8,
  },
  descriptionInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  filePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingVertical: 20,
    marginTop: 16,
    marginBottom: 16,
  },
  filePickerText: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    marginLeft: 8,
  },
  selectedFileInfo: {
    marginBottom: 20,
  },
  selectedFileName: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 4,
  },
  selectedFileSize: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
  },
  uploadButton: {
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  uploadButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
  },
  materialDeleteButtonContainer: {
    padding: 4,
  },
  materialDeleteButton: {
    padding: 4,
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    borderRadius: 8,
  },
  materialDescription: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    marginTop: 4,
    lineHeight: 16,
  },


  materialActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewButton: {
    padding: 4,
    backgroundColor: 'rgba(92, 174, 241, 0.1)',
    borderRadius: 6,
  },
  materialTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  fileTypeIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  fileViewerContainer: {
    flex: 1,
    marginTop: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewer: {
    width: '100%',
    height: '100%',
    maxHeight: 500,
  },
  fileInfoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  fileInfoText: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    marginBottom: 16,
    textAlign: 'center',
  },
  openInBrowserButton: {
    backgroundColor: '#5CAEF1',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginTop: 20,
  },
     openInBrowserButtonText: {
     color: '#fff',
     fontSize: 16,
     fontFamily: 'Poppins-SemiBold',
   },
   headerRow: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'center',
     marginBottom: 15,
   },
   connectionWarning: {
     backgroundColor: '#E36062',
     paddingHorizontal: 12,
     paddingVertical: 6,
     borderRadius: 8,
   },
   connectionWarningText: {
     color: '#fff',
     fontSize: 12,
     fontFamily: 'Poppins-Medium',
   },
 });
 
export default EventViewScreen;