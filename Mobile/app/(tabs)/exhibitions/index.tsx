import AsyncStorage from '@react-native-async-storage/async-storage';
import { Link, useRouter } from 'expo-router';
import { jwtDecode } from 'jwt-decode';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  ListRenderItem,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

// --------------------- Types ---------------------
interface Exhibition {
  exhibition_id: number;
  ex_title: string;
  ex_date: string;
  ex_status: 'coming' | 'ongoing' | 'completed';
  ex_space: number;
  ex_category: 'Nature' | 'History' | 'Photography' | 'Other';
  ex_poster?: string;
  ex_price: number;
}

interface DecodedToken {
  id: number;
  email: string;
  user_type: 'owner' | 'clerk' | 'general';
  exp?: number;
}

// --------------------- Home Component ---------------------
const Ex: React.FC = () => {
  const router = useRouter();
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [payload, setPayload] = useState<DecodedToken | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedExhibition, setSelectedExhibition] = useState<Exhibition | null>(null);
  const [registrationType, setRegistrationType] = useState<'individual' | 'group'>('individual');
  const [attendees, setAttendees] = useState(1);

  // --------------------- Fetch user token and exhibitions ---------------------
  useEffect(() => {
    const getUserData = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          const decoded: DecodedToken = jwtDecode(token);
          setPayload(decoded);
        } else {
          // No token found, redirect to login
          Alert.alert(
            'Authentication Required',
            'Please log in to access exhibitions.',
            [
              {
                text: 'Go to Login',
                onPress: () => router.replace('/login'),
              },
            ],
            { cancelable: false }
          );
          return;
        }
      } catch (err) {
        console.error('Error decoding token:', err);
        // Invalid token, redirect to login
        Alert.alert(
          'Authentication Error',
          'Your session has expired. Please log in again.',
          [
            {
              text: 'Go to Login',
              onPress: () => router.replace('/login'),
            },
          ],
          { cancelable: false }
        );
        return;
      }
    };

    const fetchExhibitions = async () => {
      try {
        const res = await fetch('http://192.168.10.163:3000/api/getAllEx/getEx');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setExhibitions(data.users || []);
      } catch (err) {
        console.error('Error fetching exhibitions:', err);
        Alert.alert('Network Error', 'Could not load exhibitions.');
      }
    };

    getUserData();
    fetchExhibitions();
  }, []);

  // --------------------- Delete exhibition (owner only) ---------------------
  const handleDeleteExhibition = async (id: number, title: string) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete "${title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              if (!token) {
                Alert.alert(
                  'Authentication Required',
                  'Your session has expired. Please log in again.',
                  [
                    {
                      text: 'Go to Login',
                      onPress: () => router.replace('/login'),
                    },
                  ],
                  { cancelable: false }
                );
                return;
              }

              const res = await fetch(`http://192.168.10.163:3000/api/deleteEx/delete/${id}`, {
                method: 'DELETE',
                headers: { 
                  'Content-Type': 'application/json', 
                  Authorization: `Bearer ${token}`,
                },
              });
              const result = await res.json();
              
              if (res.ok) {
                Alert.alert('Success', result.message || `"${title}" deleted successfully`);
                setExhibitions(prev => prev.filter(ex => ex.exhibition_id !== id));
              } else {
                // Handle authentication errors
                if (res.status === 401 || res.status === 403) {
                  Alert.alert(
                    'Authentication Error',
                    'Your session has expired. Please log in again.',
                    [
                      {
                        text: 'Go to Login',
                        onPress: () => router.replace('/login'),
                      },
                    ],
                    { cancelable: false }
                  );
                } else {
                  Alert.alert('Delete Failed', result.message || 'Failed to delete exhibition');
                }
              }
            } catch (err) {
              console.error('Delete error:', err);
              Alert.alert('Network Error', 'Could not delete exhibition');
            }
          },
        },
      ]
    );
  };

  // --------------------- Handle Registration (visitors/general users) ---------------------
  const openRegistrationModal = (exhibition: Exhibition) => {
    console.log('Opening registration modal for:', exhibition);
    
    if (exhibition.ex_status !== 'coming') {
      Alert.alert('Registration Closed', 'Registration is only available for upcoming exhibitions.');
      return;
    }
    
    setSelectedExhibition(exhibition);
    setRegistrationType('individual');
    setAttendees(1);
    setShowReviewModal(false);
    setShowRegistrationModal(true);
  };

  const closeRegistrationModal = () => {
    setShowRegistrationModal(false);
    setShowReviewModal(false);
    setSelectedExhibition(null);
    setRegistrationType('individual');
    setAttendees(1);
  };

  const handleReview = () => {
    if (registrationType === 'group' && attendees < 2) {
      Alert.alert('Invalid Attendees', 'Group registration must have at least 2 attendees.');
      return;
    }

    if (registrationType === 'individual' && attendees !== 1) {
      Alert.alert('Invalid Attendees', 'Individual registration must have exactly 1 attendee.');
      return;
    }

    setShowReviewModal(true);
  };

  const submitRegistration = async () => {
    if (!selectedExhibition) return;

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert(
          'Authentication Required',
          'Your session has expired. Please log in again.',
          [
            {
              text: 'Go to Login',
              onPress: () => router.replace('/login'),
            },
          ],
          { cancelable: false }
        );
        return;
      }

      const registrationData = {
        exhibition_id: selectedExhibition.exhibition_id,
        registration_type: registrationType,
        attendees,
      };

      const response = await fetch('http://192.168.10.163:3000/api/registerForExhibition/exReg', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(registrationData),
      });

      const result = await response.json();

      if (response.ok) {
        Alert.alert('Registration Successful', 'You have been successfully registered for the exhibition!');
        closeRegistrationModal();
      } else {
        // Handle authentication errors
        if (response.status === 401 || response.status === 403) {
          Alert.alert(
            'Authentication Error',
            'Your session has expired. Please log in again.',
            [
              {
                text: 'Go to Login',
                onPress: () => router.replace('/login'),
              },
            ],
            { cancelable: false }
          );
        } else {
          Alert.alert('Registration Failed', result.msg || 'Failed to register for exhibition');
        }
      }
    } catch (err) {
      console.error('Registration error:', err);
      Alert.alert('Network Error', 'Could not register for exhibition. Please try again.');
    }
  };

  // --------------------- Render Exhibition Card ---------------------
  const renderExhibition: ListRenderItem<Exhibition> = ({ item }) => {
    const userType = payload?.user_type || 'general';
    
    return (
      <View style={styles.card}>
        {item.ex_poster && <Image source={{ uri: item.ex_poster }} style={styles.poster} />}
        <View style={styles.cardContent}>
          <View style={styles.statusChip}>
            <Text style={styles.statusText}>{item.ex_status}</Text>
          </View>
          <Text style={styles.cardTitle}>{item.ex_title}</Text>
          <Text style={styles.cardDetail}>Date: {new Date(item.ex_date).toLocaleDateString()}</Text>
          <Text style={styles.cardDetail}>Category: {item.ex_category}</Text>
          <Text style={styles.cardDetail}>Price: R{item.ex_price.toFixed(2)}</Text>
          {item.ex_space && <Text style={styles.cardDetail}>Space: {item.ex_space}</Text>}
        </View>

        <View style={styles.cardActions}>
          {/* Actions based on user type */}
          {userType === 'owner' && (
            <>
              {/* Owner can: Edit, Delete, View Details */}
              <TouchableOpacity
                style={[styles.actionButton, styles.editButton]}
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/exhibitions/editEx',
                    params: { id: item.exhibition_id },
                  })
                }
              >
                <Text style={styles.actionButtonText}>Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => handleDeleteExhibition(item.exhibition_id, item.ex_title)}
              >
                <Text style={styles.actionButtonText}>Delete</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.viewButton]}
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/exhibitions/exhibition',
                    params: { id: item.exhibition_id },
                  })
                }
              >
                <Text style={styles.actionButtonText}>View Details</Text>
              </TouchableOpacity>
            </>
          )}

          {userType === 'clerk' && (
            <>
              {/* Clerk can: Edit, View Details */}
              <TouchableOpacity
                style={[styles.actionButton, styles.editButton]}
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/exhibitions/editEx',
                    params: { id: item.exhibition_id },
                  })
                }
              >
                <Text style={styles.actionButtonText}>Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.viewButton]}
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/exhibitions/exhibition',
                    params: { id: item.exhibition_id },
                  })
                }
              >
                <Text style={styles.actionButtonText}>View Details</Text>
              </TouchableOpacity>
            </>
          )}

          {userType === 'general' && (
            <>
              {/* Visitors/General users can: Register (for upcoming), View Details */}
              {item.ex_status === 'coming' && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.registerButton]}
                  onPress={() => openRegistrationModal(item)}
                >
                  <Text style={styles.actionButtonText}>Register</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.actionButton, styles.viewButton]}
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/exhibitions/exhibition',
                    params: { id: item.exhibition_id },
                  })
                }
              >
                <Text style={styles.actionButtonText}>View Details</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  };

  // --------------------- Filter exhibitions ---------------------
  const filteredExhibitions = exhibitions.filter(ex => {
    const matchesTitle = ex.ex_title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === '' || ex.ex_category === categoryFilter;
    const matchesStatus = statusFilter === '' || ex.ex_status === statusFilter;
    return matchesTitle && matchesCategory && matchesStatus;
  });

  const categories = ['Nature', 'History', 'Photography', 'Other'];
  const statuses = ['coming', 'ongoing', 'completed'];

  // --------------------- Registration Modals ---------------------
  const RegistrationModal: React.FC = () => (
    <Modal visible={showRegistrationModal} transparent animationType="fade">
      <View style={styles.modalBackground}>
        <View style={styles.registrationModalContainer}>
          <Text style={styles.modalTitle}>
            Register for "{selectedExhibition?.ex_title || 'Exhibition'}"
          </Text>
          
          {selectedExhibition && (
            <>
              <View style={styles.exhibitionInfo}>
                <Text style={styles.exhibitionInfoText}>
                  Date: {new Date(selectedExhibition.ex_date).toLocaleDateString()}
                </Text>
                <Text style={styles.exhibitionInfoText}>
                  Price: R{selectedExhibition.ex_price.toFixed(2)} per person
                </Text>
              </View>
              
              <View style={styles.registrationForm}>
                <Text style={styles.registrationLabel}>Registration Type</Text>
                <View style={styles.registrationTypeContainer}>
                  <TouchableOpacity
                    style={[
                      styles.registrationTypeButton,
                      registrationType === 'individual' && styles.registrationTypeSelected
                    ]}
                    onPress={() => {
                      setRegistrationType('individual');
                      setAttendees(1);
                    }}
                  >
                    <Text style={[
                      styles.registrationTypeText,
                      registrationType === 'individual' && styles.registrationTypeTextSelected
                    ]}>Individual</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.registrationTypeButton,
                      registrationType === 'group' && styles.registrationTypeSelected
                    ]}
                    onPress={() => {
                      setRegistrationType('group');
                      setAttendees(2);
                    }}
                  >
                    <Text style={[
                      styles.registrationTypeText,
                      registrationType === 'group' && styles.registrationTypeTextSelected
                    ]}>Group</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.registrationLabel}>Number of Attendees</Text>
                <View style={styles.attendeesContainer}>
                  <TouchableOpacity
                    style={[styles.attendeeButton, (registrationType === 'individual' || (registrationType === 'group' && attendees <= 2)) && styles.attendeeButtonDisabled]}
                    onPress={() => {
                      if (registrationType === 'group' && attendees > 2) {
                        setAttendees(attendees - 1);
                      }
                    }}
                    disabled={registrationType === 'individual' || (registrationType === 'group' && attendees <= 2)}
                  >
                    <Text style={styles.attendeeButtonText}>-</Text>
                  </TouchableOpacity>
                  
                  <Text style={styles.attendeeCount}>{attendees}</Text>
                  
                  <TouchableOpacity
                    style={[styles.attendeeButton, registrationType === 'individual' && styles.attendeeButtonDisabled]}
                    onPress={() => {
                      if (registrationType === 'group') {
                        setAttendees(attendees + 1);
                      }
                    }}
                    disabled={registrationType === 'individual'}
                  >
                    <Text style={styles.attendeeButtonText}>+</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.costPreview}>
                  <Text style={styles.costPreviewText}>
                    Total Cost: R{(selectedExhibition.ex_price * attendees).toFixed(2)}
                  </Text>
                </View>
              </View>

              <View style={styles.registrationModalButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.reviewButton]}
                  onPress={handleReview}
                >
                  <Text style={styles.actionButtonText}>Review Registration</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={closeRegistrationModal}
                >
                  <Text style={styles.actionButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );

  const ReviewModal: React.FC = () => (
    <Modal visible={showReviewModal} transparent animationType="fade">
      <View style={styles.modalBackground}>
        <View style={styles.registrationModalContainer}>
          <Text style={styles.modalTitle}>Review Registration</Text>
          
          <View style={styles.reviewContent}>
            <View style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>Exhibition:</Text>
              <Text style={styles.reviewValue}>{selectedExhibition?.ex_title}</Text>
            </View>
            
            <View style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>Date:</Text>
              <Text style={styles.reviewValue}>
                {selectedExhibition?.ex_date ? new Date(selectedExhibition.ex_date).toLocaleDateString() : 'N/A'}
              </Text>
            </View>
            
            <View style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>Registration Type:</Text>
              <Text style={styles.reviewValue}>{registrationType}</Text>
            </View>
            
            <View style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>Number of Attendees:</Text>
              <Text style={styles.reviewValue}>{attendees}</Text>
            </View>
            
            <View style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>Price per person:</Text>
              <Text style={styles.reviewValue}>R{selectedExhibition?.ex_price.toFixed(2) || '0.00'}</Text>
            </View>
            
            <View style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>Total Cost:</Text>
              <Text style={[styles.reviewValue, styles.totalCost]}>
                R{((selectedExhibition?.ex_price || 0) * attendees).toFixed(2)}
              </Text>
            </View>
          </View>

          <View style={styles.registrationModalButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.confirmButton]}
              onPress={submitRegistration}
            >
              <Text style={styles.actionButtonText}>Confirm Registration</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.backButton]}
              onPress={() => setShowReviewModal(false)}
            >
              <Text style={styles.actionButtonText}>Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
  const CategoryModal: React.FC = () => (
    <Modal visible={showCategoryModal} transparent animationType="fade">
      <View style={styles.modalBackground}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Select Category</Text>
          <TouchableOpacity
            style={styles.modalOption}
            onPress={() => {
              setCategoryFilter('');
              setShowCategoryModal(false);
            }}
          >
            <Text style={styles.modalOptionText}>All Categories</Text>
          </TouchableOpacity>
          {categories.map(category => (
            <TouchableOpacity
              key={category}
              style={styles.modalOption}
              onPress={() => {
                setCategoryFilter(category);
                setShowCategoryModal(false);
              }}
            >
              <Text style={styles.modalOptionText}>{category}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowCategoryModal(false)}>
            <Text style={styles.modalCloseText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const StatusModal: React.FC = () => (
    <Modal visible={showStatusModal} transparent animationType="fade">
      <View style={styles.modalBackground}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Select Status</Text>
          <TouchableOpacity
            style={styles.modalOption}
            onPress={() => {
              setStatusFilter('');
              setShowStatusModal(false);
            }}
          >
            <Text style={styles.modalOptionText}>All Statuses</Text>
          </TouchableOpacity>
          {statuses.map(status => (
            <TouchableOpacity
              key={status}
              style={styles.modalOption}
              onPress={() => {
                setStatusFilter(status);
                setShowStatusModal(false);
              }}
            >
              <Text style={styles.modalOptionText}>{status}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowStatusModal(false)}>
            <Text style={styles.modalCloseText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // --------------------- Render ---------------------
  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>All Exhibitions</Text>
        <Text style={styles.subtitle}>A World of Art, All in One Place</Text>

        {/* Add Exhibition button only for owners */}
        {payload?.user_type === 'owner' && (
          <Link
            href="/(tabs)/exhibitions/addEx"
            style={styles.addButton}
          >
            <Text style={styles.addButtonText}>Add new Exhibition</Text>
          </Link>
        )}

        {/* User Role Indicator */}
        {payload && (
          <View style={styles.userIndicator}>
            <Text style={styles.userIndicatorText}>
              Logged in as: {payload.user_type === 'general' ? 'Visitor' : payload.user_type}
            </Text>
          </View>
        )}

        {/* Search and Filter */}
        <TextInput
          style={styles.searchInput}
          placeholder="Search by Exhibition name"
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        <View style={styles.filtersContainer}>
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Category:</Text>
            <TouchableOpacity style={styles.filterButton} onPress={() => setShowCategoryModal(true)}>
              <Text style={styles.filterButtonText}>{categoryFilter || 'All Categories'}</Text>
              <Text style={styles.dropdownArrow}>▼</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Status:</Text>
            <TouchableOpacity style={styles.filterButton} onPress={() => setShowStatusModal(true)}>
              <Text style={styles.filterButtonText}>{statusFilter || 'All Statuses'}</Text>
              <Text style={styles.dropdownArrow}>▼</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Exhibition List */}
        <FlatList
          data={filteredExhibitions}
          renderItem={renderExhibition}
          keyExtractor={item => item.exhibition_id.toString()}
          scrollEnabled={false}
          contentContainerStyle={styles.exhibitionsGrid}
        />
      </ScrollView>

      {/* Modals */}
      <CategoryModal />
      <StatusModal />
      <RegistrationModal />
      <ReviewModal />
    </View>
  );
};

// --------------------- Styles ---------------------
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff', 
    paddingHorizontal: 16, 
    paddingTop: 30 
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#333', 
    textAlign: 'center', 
    marginBottom: 4 
  },
  subtitle: { 
    fontSize: 16, 
    color: '#777', 
    textAlign: 'center', 
    marginBottom: 20 
  },
  userIndicator: {
    backgroundColor: '#f0f8ff',
    padding: 8,
    borderRadius: 6,
    marginBottom: 16,
    alignItems: 'center',
  },
  userIndicatorText: {
    fontSize: 14,
    color: '#5a3e2b',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  searchInput: { 
    backgroundColor: '#f9f9f9', 
    borderColor: '#ccc', 
    borderWidth: 1, 
    borderRadius: 8, 
    paddingHorizontal: 12, 
    paddingVertical: 12, 
    fontSize: 14, 
    marginBottom: 16, 
    color: '#000' 
  },
  filtersContainer: { marginBottom: 20 },
  filterRow: { marginBottom: 12 },
  filterLabel: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: '#333', 
    marginBottom: 6 
  },
  filterButton: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: '#ccc', 
    borderRadius: 8, 
    paddingHorizontal: 12, 
    paddingVertical: 12, 
    backgroundColor: '#fff' 
  },
  filterButtonText: { 
    fontSize: 14, 
    color: '#333', 
    flex: 1 
  },
  dropdownArrow: { 
    fontSize: 12, 
    color: '#666' 
  },
  exhibitionsGrid: { paddingBottom: 20 },
  card: { 
    backgroundColor: '#fff', 
    borderWidth: 1, 
    borderColor: '#ddd', 
    borderRadius: 10, 
    marginBottom: 16, 
    overflow: 'hidden', 
    elevation: 2, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 2 
  },
  poster: { 
    width: '100%', 
    height: 180, 
    resizeMode: 'cover' 
  },
  cardContent: { padding: 12 },
  statusChip: { 
    alignSelf: 'flex-start', 
    backgroundColor: '#8B4513', 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 12, 
    marginBottom: 8 
  },
  statusText: { 
    fontSize: 12, 
    fontWeight: 'bold', 
    color: '#fff', 
    textTransform: 'capitalize' 
  },
  cardTitle: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#333', 
    marginBottom: 6 
  },
  cardDetail: { 
    fontSize: 14, 
    color: '#555', 
    marginBottom: 4 
  },
  cardActions: { 
    flexDirection: 'row', 
    justifyContent: 'flex-start', 
    paddingHorizontal: 12, 
    paddingBottom: 12, 
    marginTop: 8,
    flexWrap: 'wrap',
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  editButton: {
    backgroundColor: '#8B4513', // Green for edit
  },
  deleteButton: {
    backgroundColor: '#8B4513', // Red for delete
  },
  viewButton: {
    backgroundColor: '#8B4513', // Orange for view details
  },
  registerButton: {
    backgroundColor: '#5a3e2b', // Brown for register
  },
  addButton: { 
    backgroundColor: '#5a3e2b', 
    padding: 12, 
    borderRadius: 8, 
    alignItems: 'center', 
    marginBottom: 16 
  },
  addButtonText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: '600' 
  },
  modalBackground: { 
    flex: 1, 
    backgroundColor: 'rgba(0, 0, 0, 0.5)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  modalContainer: { 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    margin: 20, 
    width: '80%', 
    maxHeight: '70%' 
  },
  modalTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#333', 
    padding: 16, 
    textAlign: 'center', 
    borderBottomWidth: 1, 
    borderBottomColor: '#eee' 
  },
  modalOption: { 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: '#f5f5f5' 
  },
  modalOptionText: { 
    fontSize: 16, 
    color: '#333' 
  },
  modalCloseButton: { 
    padding: 16, 
    alignItems: 'center', 
    backgroundColor: '#f0f0f0', 
    borderBottomLeftRadius: 12, 
    borderBottomRightRadius: 12 
  },
  modalCloseText: { 
    fontSize: 16, 
    color: '#666', 
    fontWeight: '600' 
  },
  // Registration Modal Styles
  registrationModalContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 20,
    width: '90%',
    maxHeight: '80%',
  },
  registrationForm: {
    padding: 16,
  },
  registrationLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  registrationTypeContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  registrationTypeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  registrationTypeSelected: {
    borderColor: '#5a3e2b',
    backgroundColor: '#f0f8ff',
  },
  registrationTypeText: {
    fontSize: 16,
    color: '#666',
    textTransform: 'capitalize',
  },
  registrationTypeTextSelected: {
    color: '#5a3e2b',
    fontWeight: '600',
  },
  attendeesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  attendeeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#5a3e2b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  attendeeButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  attendeeCount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 30,
    minWidth: 50,
    textAlign: 'center',
  },
  registrationModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  reviewButton: {
    backgroundColor: '#5a3e2b',
    paddingHorizontal: 20,
  },
  cancelButton: {
    backgroundColor: '#999',
    paddingHorizontal: 20,
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
  },
  backButton: {
    backgroundColor: '#666',
    paddingHorizontal: 20,
  },
  reviewContent: {
    padding: 16,
  },
  reviewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  reviewLabel: {
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  reviewValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
    textTransform: 'capitalize',
  },
  totalCost: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#5a3e2b',
  },
  // Exhibition info in modal
  exhibitionInfo: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  exhibitionInfoText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  // Cost preview
  costPreview: {
    backgroundColor: '#e8f5e8',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  costPreviewText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e7d2e',
  },
  // Disabled button style
  attendeeButtonDisabled: {
    backgroundColor: '#ccc',
  },
});

export default Ex;