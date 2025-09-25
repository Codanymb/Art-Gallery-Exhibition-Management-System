import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';


const YOUR_IP = '192.168.10.163'; 
const BASE_URL = `http://${YOUR_IP}:3000`;

// Create axios instance with your IP
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests automatically
apiClient.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`Making request to: ${config.baseURL}${config.url}`);
  } catch (error) {
    console.log('Token error:', error);
  }
  return config;
});

// Better error messages
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.message === 'Network Error') {
      console.error(`
❌ NETWORK ERROR - Fix Steps:
1. Change YOUR_IP to your computer's IP address
2. Make sure backend is running: ${BASE_URL}
3. Test this URL in browser: ${BASE_URL}/api/getAllArts/getArt
4. Check your backend CORS settings
5. Make sure phone and computer are on same WiFi
      `);
    }
    return Promise.reject(error);
  }
);
// ===== END API CONFIGURATION =====

// Get device dimensions for responsive design
const { width: screenWidth } = Dimensions.get('window');

// Interface definitions for type safety
interface ArtPiece {
  art_piece_id: number;
  title: string;
  description: string;
  category: string;
  estimated_value: number;
  quantity: number;
  availability: 'available' | 'displayed';
  image?: string;
}

interface DecodedToken {
  user_type: 'owner' | 'clerk' | 'visitor';
}

const ArtPieces: React.FC = () => {
  // State management with proper TypeScript types
  const [arts, setArts] = useState<ArtPiece[]>([]);
  const [userType, setUserType] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState<boolean>(false);
  const [showStatusPicker, setShowStatusPicker] = useState<boolean>(false);

  // Router for navigation
  const router = useRouter();

  // JWT decode function (simplified for React Native)
  const jwtDecode = (token: string): DecodedToken | null => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('JWT decode error:', error);
      return null;
    }
  };

  // Get user type from token
  useEffect(() => {
    const getUserType = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          const decoded = jwtDecode(token);
          if (decoded) {
            setUserType(decoded.user_type);
          }
        }
      } catch (error) {
        console.error('Error getting user type:', error);
      }
    };

    getUserType();
  }, []);

  // Fetch all art pieces from API
  const fetchArtPieces = async () => {
    try {
      setLoading(true);
      console.log(`Fetching art pieces from: ${BASE_URL}/api/getAllArts/getArt`);
      
      const response = await apiClient.get('/api/getAllArts/getArt');
      
      if (response.data && response.data.arts) {
        setArts(response.data.arts);
        console.log(`✅ Successfully fetched ${response.data.arts.length} art pieces`);
        
        // Debug: Log the first art piece to see the data structure
        if (response.data.arts.length > 0) {
          console.log('📋 Sample art piece data:', response.data.arts[0]);
        }
      } else {
        setArts([]);
        console.log('⚠️ No arts found in response');
      }
    } catch (error: any) {
      console.error('❌ Error fetching arts:', error);
      
      let errorMessage = 'Failed to fetch art pieces';
      
      if (error.message === 'Network Error') {
        errorMessage = `Cannot connect to server.\n\n` +
          `Please check:\n` +
          `• Backend server is running\n` +
          `• Update YOUR_IP in ArtPieces.tsx to: your computer's IP\n` +
          `• Test in browser: ${BASE_URL}/api/getAllArts/getArt`;
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout - server may be slow';
      }
      
      Alert.alert('Connection Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch of art pieces
  useEffect(() => {
    fetchArtPieces();
  }, []);

  // Pull-to-refresh functionality
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchArtPieces();
    setRefreshing(false);
  };

  // Define categories and statuses arrays
  const categories = ['Nature', 'History', 'Photography', 'Other'];
  const statuses = ['available', 'displayed'];

  // Debug: Get unique categories and statuses from actual data
  const actualCategories = [...new Set(arts.map(art => art.category))];
  const actualStatuses = [...new Set(arts.map(art => art.availability))];
  
  // Log actual data categories (remove after debugging)
  React.useEffect(() => {
    if (arts.length > 0) {
      console.log('🏷️ Categories in data:', actualCategories);
      console.log('📊 Statuses in data:', actualStatuses);
    }
  }, [arts]);

  // Filter arts based on search query, category, and status
  const filteredArts = arts.filter((art: ArtPiece) => {
    const matchesTitle = art.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === '' || art.category === categoryFilter;
    const matchesStatus = statusFilter === '' || art.availability === statusFilter;
    
    // Debug logging - remove this after testing
    if (categoryFilter !== '' || statusFilter !== '') {
      console.log('🔍 Filtering Debug:', {
        artTitle: art.title,
        artCategory: art.category,
        artAvailability: art.availability,
        categoryFilter,
        statusFilter,
        matchesTitle,
        matchesCategory,
        matchesStatus,
        finalResult: matchesTitle && matchesCategory && matchesStatus
      });
    }
    
    return matchesTitle && matchesCategory && matchesStatus;
  });

  // Navigation functions
  const navigateToAddArt = () => {
    router.push('/artPieces/addArtPieces');
  };

  const navigateToEditArt = (artId: number) => {
    router.push(`/artPieces/editArtPieces?art_piece_id=${artId}`);
  };

  // Handle art piece deletion
  const handleDeleteArt = async (artId: number) => {
    Alert.alert(
      'Delete Art Piece',
      'Are you sure you want to delete this art piece?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/api/deleteArt/${artId}`);
              Alert.alert('Success', 'Art piece deleted successfully');
              setArts(arts.filter((art) => art.art_piece_id !== artId));
            } catch (error: any) {
              console.error('Delete error:', error);
              Alert.alert(
                'Error',
                error.response?.data?.message || 'Delete failed'
              );
            }
          },
        },
      ]
    );
  };

  // Render individual art piece card
  const renderArtCard = ({ item }: { item: ArtPiece }) => (
    <View style={styles.card}>
      {item.image && (
        <Image source={{ uri: item.image }} style={styles.cardImage} />
      )}
      
      <View style={styles.cardContent}>
        <View style={[
          styles.chip,
          item.availability === 'available' ? styles.chipAvailable : styles.chipDisplayed
        ]}>
          <Text style={styles.chipText}>{item.availability}</Text>
        </View>

        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardDescription}>{item.description}</Text>
        <Text style={styles.cardDetail}>Category: {item.category}</Text>
        <Text style={styles.cardDetail}>
          Estimated Value: R{item.estimated_value.toFixed(2)}
        </Text>
        <Text style={styles.cardDetail}>Quantity: {item.quantity}</Text>
      </View>

      {(userType === 'owner' || userType === 'clerk') && (
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigateToEditArt(item.art_piece_id)}
          >
            <Text style={styles.buttonText}>Edit</Text>
          </TouchableOpacity>

          {userType === 'owner' && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteArt(item.art_piece_id)}
            >
              <Text style={styles.buttonText}>Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );

  // Empty state component
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateText}>
        {arts.length === 0 && !loading ? 
          `No connection to server.\nCheck YOUR_IP setting: ${YOUR_IP}` : 
          'No art pieces found.'
        }
      </Text>
      {arts.length === 0 && !loading && (
        <TouchableOpacity style={styles.retryButton} onPress={fetchArtPieces}>
          <Text style={styles.buttonText}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Loading indicator
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B4513" />
        <Text style={styles.loadingText}>Loading art pieces...</Text>
        <Text style={styles.loadingSubText}>Connecting to: {BASE_URL}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header section */}
      <View style={styles.header}>
        <Text style={styles.title}>Art Pieces</Text>
        <Text style={styles.subtitle}>Explore Art From Various Exhibitions</Text>
      </View>

      {/* Search and filter section */}
      <View style={styles.searchSection}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search art by title..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#666"
        />

        {/* Filter dropdowns */}
        <View style={styles.filterRow}>
          {/* Category Filter */}
          <View style={styles.dropdownContainer}>
            <Text style={styles.dropdownLabel}>Category</Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowCategoryPicker(!showCategoryPicker)}
            >
              <Text style={styles.dropdownButtonText}>
                {categoryFilter || 'All Categories'}
              </Text>
              <Text style={styles.dropdownArrow}>{showCategoryPicker ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            
            {showCategoryPicker && (
              <View style={styles.dropdownOptions}>
                <TouchableOpacity
                  style={styles.dropdownOption}
                  onPress={() => {
                    setCategoryFilter('');
                    setShowCategoryPicker(false);
                  }}
                >
                  <Text style={styles.dropdownOptionText}>All Categories</Text>
                </TouchableOpacity>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={styles.dropdownOption}
                    onPress={() => {
                      setCategoryFilter(category);
                      setShowCategoryPicker(false);
                    }}
                  >
                    <Text style={styles.dropdownOptionText}>{category}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Status Filter */}
          <View style={styles.dropdownContainer}>
            <Text style={styles.dropdownLabel}>Status</Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowStatusPicker(!showStatusPicker)}
            >
              <Text style={styles.dropdownButtonText}>
                {statusFilter ? statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1) : 'All Statuses'}
              </Text>
              <Text style={styles.dropdownArrow}>{showStatusPicker ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            
            {showStatusPicker && (
              <View style={styles.dropdownOptions}>
                <TouchableOpacity
                  style={styles.dropdownOption}
                  onPress={() => {
                    setStatusFilter('');
                    setShowStatusPicker(false);
                  }}
                >
                  <Text style={styles.dropdownOptionText}>All Statuses</Text>
                </TouchableOpacity>
                {statuses.map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={styles.dropdownOption}
                    onPress={() => {
                      setStatusFilter(status);
                      setShowStatusPicker(false);
                    }}
                  >
                    <Text style={styles.dropdownOptionText}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        {userType === 'owner' && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={navigateToAddArt}
          >
            <Text style={styles.buttonText}>Add Art Piece</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Art pieces list */}
      <FlatList
        data={filteredArts}
        renderItem={renderArtCard}
        keyExtractor={(item) => item.art_piece_id.toString()}
        numColumns={screenWidth > 768 ? 2 : 1}
        contentContainerStyle={styles.listContainer}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

// Comprehensive styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f7f2',
    padding: 20,
  },
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f7f2',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
    fontFamily: 'System',
  },
  loadingSubText: {
    marginTop: 5,
    fontSize: 12,
    color: '#999',
    fontFamily: 'System',
  },

  header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
    textAlign: 'center',
    fontFamily: 'System',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontFamily: 'System',
  },

  searchSection: {
    marginBottom: 20,
  },
  searchInput: {
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 15,
    fontFamily: 'System',
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    zIndex: 1000, // Ensure dropdowns appear above other elements
  },

  // Custom dropdown styles
  dropdownContainer: {
    flex: 0.48,
    zIndex: 1000,
  },
  dropdownLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 5,
  },
  dropdownButton: {
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 15,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#666',
  },
  dropdownOptions: {
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginTop: 5,
    maxHeight: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    position: 'absolute',
    top: 70,
    left: 0,
    right: 0,
    zIndex: 1001,
  },
  dropdownOption: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dropdownOptionText: {
    fontSize: 16,
    color: '#333',
  },

  // Remove old picker styles
  pickerContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    flex: 0.48,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    fontSize: 16,
  },

  addButton: {
    backgroundColor: '#8B4513',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 10,
  },

  listContainer: {
    paddingBottom: 20,
  },

  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    marginHorizontal: screenWidth > 768 ? 8 : 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  cardContent: {
    padding: 16,
  },
  chip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 10,
  },
  chipAvailable: {
    backgroundColor: '#d4edda',
  },
  chipDisplayed: {
    backgroundColor: '#fff3cd',
  },
  chipText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    textTransform: 'capitalize',
    fontFamily: 'System',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
    fontFamily: 'System',
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
    fontFamily: 'System',
  },
  cardDetail: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
    fontFamily: 'System',
  },

  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  editButton: {
    backgroundColor: '#8B4513',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    flex: 0.45,
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#8B45135',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    flex: 0.45,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'System',
  },

  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'System',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#8B4513',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
});

export default ArtPieces;