import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { jwtDecode } from 'jwt-decode';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

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
  user_type: string;
  exp?: number;
}

const Home: React.FC = () => {
  const router = useRouter();

  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [payload, setPayload] = useState<DecodedToken | null>(null);

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  // Registration modal states - UPDATED WITH TWO-STEP FLOW
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false); // NEW: Review step
  const [selectedExhibition, setSelectedExhibition] = useState<Exhibition | null>(null);
  const [registrationType, setRegistrationType] = useState<'individual' | 'group'>('individual');
  const [attendees, setAttendees] = useState(1);

  // 🔹 Use useFocusEffect to refresh data when screen is focused
  useFocusEffect(
    useCallback(() => {
      const getUserData = async () => {
        try {
          const token = await AsyncStorage.getItem('token');
          if (token) {
            const decoded: DecodedToken = jwtDecode(token);
            setPayload(decoded);
          }
        } catch (err) {
          Alert.alert('Authentication Error', 'Please log in again');
        }
      };

      const fetchExhibitions = async () => {
        try {
          const res = await fetch('http://192.168.10.163:3000/api/getAllEx/getEx');
          if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);

          const data = await res.json();
          setExhibitions(data.users || []);
        } catch (err) {
          Alert.alert('Error', 'Could not load exhibitions');
        }
      };

      getUserData();
      fetchExhibitions();
    }, [])
  );

  // 🔹 Memoized handlers to prevent re-renders
  const handleViewDetails = useCallback((exhibitionId: number) => {
    router.push({
      pathname: '/(tabs)/exhibitions/ExhibitionDetails',
      params: {
        exhibition_id: exhibitionId.toString(), // Ensure it's a string
      },
    });
  }, [router]);

  // UPDATED: Open registration modal (first step)
  const openRegistrationModal = useCallback((exhibition: Exhibition) => {
    setSelectedExhibition(exhibition);
    setRegistrationType('individual');
    setAttendees(1);
    setShowRegistrationModal(true);
    setShowReviewModal(false); // Reset review step
  }, []);

  // NEW: Close all modals and reset states
  const closeAllModals = () => {
    setShowRegistrationModal(false);
    setShowReviewModal(false);
    setSelectedExhibition(null);
    setRegistrationType('individual');
    setAttendees(1);
  };

  // NEW: Move to review step (validation + show review)
  const handleViewRegistrationDetails = () => {
    if (registrationType === 'group' && attendees < 2) {
      Alert.alert('Error', 'Group registration must have at least 2 attendees.');
      return;
    }

    if (registrationType === 'individual' && attendees !== 1) {
      Alert.alert('Error', 'Individual registration must have exactly 1 attendee.');
      return;
    }

    setShowReviewModal(true);
  };

  // UPDATED: Final registration submission (from review step)
  const confirmRegistration = async () => {
    if (!selectedExhibition) return;

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Authentication Error', 'Please log in again.');
        return;
      }

      const response = await fetch('http://192.168.10.163:3000/api/registerForExhibition/exReg', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          exhibition_id: selectedExhibition.exhibition_id,
          registration_type: registrationType,
          attendees: attendees,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        Alert.alert('Success', result.msg || 'Registration successful!', [
          { text: 'OK', onPress: () => closeAllModals() },
        ]);
      } else {
        Alert.alert('Failed', result.msg || 'Registration failed.');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred during registration.');
    }
  };

  const handleDeleteExhibition = useCallback(async (id: number, title: string) => {
    Alert.alert('Confirm Delete', `Are you sure you want to delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('token');
            const res = await fetch(`http://192.168.10.163:3000/api/deleteEx/delete/${id}`, {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
                ...(token && { Authorization: `Bearer ${token}` }),
              },
            });

            const responseText = await res.text();
            const result = responseText ? JSON.parse(responseText) : {};

            if (res.ok) {
              Alert.alert('Deleted', result.message || 'Exhibition deleted');
              setExhibitions((prev) => prev.filter((ex) => ex.exhibition_id !== id));
            } else {
              Alert.alert('Error', result.message || 'Could not delete');
            }
          } catch {
            Alert.alert('Error', 'Delete request failed');
          }
        },
      },
    ]);
  }, []);

  const filteredExhibitions = exhibitions.filter((ex) => {
    const matchesTitle = ex.ex_title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !categoryFilter || ex.ex_category === categoryFilter;
    const matchesStatus = !statusFilter || ex.ex_status === statusFilter;
    return matchesTitle && matchesCategory && matchesStatus;
  });

  const categories = ['Nature', 'History', 'Photography', 'Other'];
  const statuses = ['coming', 'ongoing', 'completed'];

  // 🔹 Memoized renderItem to prevent unnecessary re-renders
  const renderExhibition = useCallback(({ item }: { item: Exhibition }) => (
    <View style={styles.exhibitionContainer} key={item.exhibition_id}>
      {item.ex_poster ? (
        <Image source={{ uri: item.ex_poster }} style={styles.exhibitionImage} />
      ) : (
        <View style={[styles.exhibitionImage, styles.exhibitionImagePlaceholder]}>
          <Text>No Image</Text>
        </View>
      )}
      <View style={styles.exhibitionDetails}>
        <Text style={styles.exhibitionTitle}>{item.ex_title}</Text>
        <Text>Status: {item.ex_status}</Text>
        <Text>Category: {item.ex_category}</Text>
        <Text>Date: {new Date(item.ex_date).toLocaleDateString()}</Text>
        <Text>Price: R{item.ex_price.toFixed(2)}</Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.registerButton]}
            onPress={() => handleViewDetails(item.exhibition_id)}
          >
            <Text style={styles.buttonText}>View Details</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.registerButton]}
            onPress={() => openRegistrationModal(item)}
          >
            <Text style={styles.buttonText}>Register</Text>
          </TouchableOpacity>

          {payload?.user_type === 'admin' && (
            <TouchableOpacity
              style={[styles.button, styles.deleteButton]}
              onPress={() => handleDeleteExhibition(item.exhibition_id, item.ex_title)}
            >
              <Text style={styles.buttonText}>Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  ), [payload?.user_type, handleViewDetails, openRegistrationModal, handleDeleteExhibition]);

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Search exhibitions"
        style={styles.searchInput}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <View style={styles.filtersRow}>
        <TouchableOpacity style={styles.filterButton} onPress={() => setShowCategoryModal(true)}>
          <Text>Category: {categoryFilter || 'All'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterButton} onPress={() => setShowStatusModal(true)}>
          <Text>Status: {statusFilter || 'All'}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredExhibitions}
        keyExtractor={(item) => `exhibition-${item.exhibition_id}`}
        renderItem={renderExhibition}
        removeClippedSubviews={false}
        initialNumToRender={10}
        maxToRenderPerBatch={5}
        windowSize={10}
        getItemLayout={(data, index) => ({
          length: 200, // Approximate item height
          offset: 200 * index,
          index,
        })}
      />

      {/* Category Modal */}
      <Modal visible={showCategoryModal} transparent animationType="fade">
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text>Select Category</Text>
            <TouchableOpacity onPress={() => { setCategoryFilter(''); setShowCategoryModal(false); }}>
              <Text>All</Text>
            </TouchableOpacity>
            {categories.map((cat) => (
              <TouchableOpacity key={cat} onPress={() => { setCategoryFilter(cat); setShowCategoryModal(false); }}>
                <Text>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* Status Modal */}
      <Modal visible={showStatusModal} transparent animationType="fade">
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text>Select Status</Text>
            <TouchableOpacity onPress={() => { setStatusFilter(''); setShowStatusModal(false); }}>
              <Text>All</Text>
            </TouchableOpacity>
            {statuses.map((status) => (
              <TouchableOpacity key={status} onPress={() => { setStatusFilter(status); setShowStatusModal(false); }}>
                <Text>{status}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* STEP 1: Registration Form Modal */}
      <Modal visible={showRegistrationModal && !showReviewModal} transparent animationType="slide">
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
                        registrationType === 'individual' && styles.registrationTypeSelected,
                      ]}
                      onPress={() => {
                        setRegistrationType('individual');
                        setAttendees(1);
                      }}
                    >
                      <Text
                        style={[
                          styles.registrationTypeText,
                          registrationType === 'individual' && styles.registrationTypeTextSelected,
                        ]}
                      >
                        Individual
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.registrationTypeButton,
                        registrationType === 'group' && styles.registrationTypeSelected,
                      ]}
                      onPress={() => {
                        setRegistrationType('group');
                        setAttendees(2);
                      }}
                    >
                      <Text
                        style={[
                          styles.registrationTypeText,
                          registrationType === 'group' && styles.registrationTypeTextSelected,
                        ]}
                      >
                        Group
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {registrationType === 'group' && (
                    <>
                      <Text style={styles.registrationLabel}>Number of Attendees</Text>
                      <View style={styles.attendeesContainer}>
                        <TouchableOpacity
                          style={[
                            styles.attendeeButton,
                            attendees <= 2 && styles.attendeeButtonDisabled,
                          ]}
                          onPress={() => setAttendees((prev) => Math.max(2, prev - 1))}
                          disabled={attendees <= 2}
                        >
                          <Text style={styles.attendeeButtonText}>-</Text>
                        </TouchableOpacity>

                        <Text style={styles.attendeeCount}>{attendees}</Text>

                        <TouchableOpacity
                          style={styles.attendeeButton}
                          onPress={() => setAttendees((prev) => Math.min(10, prev + 1))}
                        >
                          <Text style={styles.attendeeButtonText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  )}
                </View>

                {/* STEP 1 BUTTONS */}
                <View style={styles.modalButtons}>
                  <TouchableOpacity 
                    style={styles.modalButton} 
                    onPress={handleViewRegistrationDetails}
                  >
                    <Text style={styles.modalButtonText}>View Registration Details</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalCancelButton]}
                    onPress={closeAllModals}
                  >
                    <Text style={[styles.modalButtonText, styles.modalCancelButtonText]}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* STEP 2: Review Registration Modal */}
      <Modal visible={showReviewModal} transparent animationType="slide">
        <View style={styles.modalBackground}>
          <View style={styles.registrationModalContainer}>
            <Text style={styles.modalTitle}>Review Registration</Text>

            {selectedExhibition && (
              <>
                <View style={styles.reviewContainer}>
                  <Text style={styles.reviewLabel}>Exhibition:</Text>
                  <Text style={styles.reviewValue}>{selectedExhibition.ex_title}</Text>
                  
                  <Text style={styles.reviewLabel}>Date:</Text>
                  <Text style={styles.reviewValue}>
                    {new Date(selectedExhibition.ex_date).toLocaleDateString()}
                  </Text>
                  
                  <Text style={styles.reviewLabel}>Registration Type:</Text>
                  <Text style={styles.reviewValue}>
                    {registrationType.charAt(0).toUpperCase() + registrationType.slice(1)}
                  </Text>
                  
                  <Text style={styles.reviewLabel}>Number of Attendees:</Text>
                  <Text style={styles.reviewValue}>{attendees}</Text>
                  
                  <Text style={styles.reviewLabel}>Total Cost:</Text>
                  <Text style={[styles.reviewValue, styles.totalCost]}>
                    R{(selectedExhibition.ex_price * attendees).toFixed(2)}
                  </Text>
                </View>

                {/* STEP 2 BUTTONS */}
                <View style={styles.modalButtons}>
                  <TouchableOpacity 
                    style={styles.modalButton} 
                    onPress={confirmRegistration}
                  >
                    <Text style={styles.modalButtonText}>Confirm Registration</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalCancelButton]}
                    onPress={() => setShowReviewModal(false)}
                  >
                    <Text style={[styles.modalButtonText, styles.modalCancelButtonText]}>Back</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    padding: 16,
  },
  buttonContainer: {
    flexDirection: "row",        
    justifyContent: "space-between", 
    alignItems: "center",        
    marginTop: 20,               
    paddingHorizontal: 20,       
  },

  // --- Search + Filters ---
  searchInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: "#fff",
    marginBottom: 12,
  },
  filtersRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  filterButton: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    marginHorizontal: 4,
    elevation: 2,
  },
  filterButtonText: {
    fontSize: 14,
    color: "#333",
    textAlign: "center",
  },

  // --- Exhibition Card ---
  exhibitionContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  exhibitionImage: {
    width: "100%",
    height: 180,
    resizeMode: "cover",
  },
  exhibitionImagePlaceholder: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#eee",
  },
  exhibitionDetails: {
    padding: 12,
  },
  exhibitionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 6,
    color: "#222",
  },

  // --- Buttons ---
  buttonsRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginTop: 12,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginRight: 8,
  },
  registerButton: {
    backgroundColor: "#8B4513",
  },
  deleteButton: {
    backgroundColor: "#A52A2A",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },

  // --- Modals ---
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    width: "85%",
    padding: 20,
    elevation: 5,
  },
  registrationModalContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    width: "90%",
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
    color: "#111",
    textAlign: "center",
  },
  modalOption: {
    paddingVertical: 12,
  },
  modalOptionText: {
    fontSize: 16,
    color: "#333",
  },
  modalCloseButton: {
    marginTop: 16,
    alignSelf: "flex-end",
  },
  modalCloseText: {
    fontSize: 14,
    color: "#007bff",
  },

  // --- Registration Form ---
  exhibitionInfo: {
    marginBottom: 12,
  },
  exhibitionInfoText: {
    fontSize: 14,
    color: "#555",
    marginBottom: 4,
  },
  registrationForm: {
    marginBottom: 16,
  },
  registrationLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 6,
    color: "#333",
  },
  registrationTypeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  registrationTypeButton: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    alignItems: "center",
  },
  registrationTypeSelected: {
    backgroundColor: "#8B4513",
    borderColor: "#8B4513",
  },
  registrationTypeText: {
    fontSize: 14,
    color: "#333",
  },
  registrationTypeTextSelected: {
    color: "#fff",
    fontWeight: "600",
  },
  attendeesContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  attendeeButton: {
    backgroundColor: "#8B4513",
    borderRadius: 50,
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  attendeeButtonDisabled: {
    backgroundColor: "#aaa",
  },
  attendeeButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  attendeeCount: {
    fontSize: 16,
    fontWeight: "600",
    marginHorizontal: 16,
    color: "#333",
  },

  // --- Review Step Styles (NEW) ---
  reviewContainer: {
    marginBottom: 20,
  },
  reviewLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
    marginTop: 8,
  },
  reviewValue: {
    fontSize: 16,
    color: "#555",
    marginBottom: 8,
    paddingLeft: 8,
  },
  totalCost: {
    fontSize: 18,
    fontWeight: "700",
    color: "#8B4513",
  },

  // --- Modal Actions ---
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 20,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "#8B4513",
    marginLeft: 10,
  },
  modalCancelButton: {
    backgroundColor: "#eee",
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  modalCancelButtonText: {
    color: "#333",
  },
});

export default Home