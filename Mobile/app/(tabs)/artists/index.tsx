import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

// ===== SIMPLE API CONFIGURATION =====
// CHANGE THIS IP TO YOUR COMPUTER'S IP ADDRESS!
const YOUR_IP = '192.168.10.163'; // <-- CHANGE THIS TO YOUR ACTUAL IP!
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
3. Test this URL in browser: ${BASE_URL}/api/getAllArtists/get
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
interface Artist {
  artist_id: number;
  first_name: string;
  surname: string;
  id_number: string;
  is_active: string;
}

interface DecodedToken {
  user_type: 'owner' | 'clerk' | 'visitor';
}

const Artists: React.FC = () => {
  // State management with proper TypeScript types
  const [artists, setArtists] = useState<Artist[]>([]);
  const [userType, setUserType] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

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

  // Fetch all artists from API
  const fetchArtists = async () => {
    try {
      setLoading(true);
      console.log(`Fetching artists from: ${BASE_URL}/api/getAllArtists/get`);
      
      const response = await apiClient.get('/api/getAllArtists/get');
      
      if (response.data && response.data.users) {
        setArtists(response.data.users);
        console.log(`✅ Successfully fetched ${response.data.users.length} artists`);
        
        // Debug: Log the first artist to see the data structure
        if (response.data.users.length > 0) {
          console.log('📋 Sample artist data:', response.data.users[0]);
        }
      } else {
        setArtists([]);
        console.log('⚠️ No artists found in response');
      }
    } catch (error: any) {
      console.error('❌ Error fetching artists:', error);
      setArtists([]);
      
      let errorMessage = 'Failed to fetch artists';
      
      if (error.message === 'Network Error') {
        errorMessage = `Cannot connect to server.\n\n` +
          `Please check:\n` +
          `• Backend server is running\n` +
          `• Update YOUR_IP in Artists.tsx to: your computer's IP\n` +
          `• Test in browser: ${BASE_URL}/api/getAllArtists/get`;
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout - server may be slow';
      }
      
      Alert.alert('Connection Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch of artists
  useEffect(() => {
    fetchArtists();
  }, []);

  // Pull-to-refresh functionality
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchArtists();
    setRefreshing(false);
  };

  // Filter artists based on search query
  const filteredArtists = (artists || []).filter((artist: Artist) =>
    artist.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    artist.surname.toLowerCase().includes(searchQuery.toLowerCase()) ||
    artist.id_number.includes(searchQuery)
  );

  // Navigation functions
  const navigateToAddArtist = () => {
    router.push('/artists/addArtist');
  };

  const navigateToEditArtist = (artistId: number) => {
    router.push(`/artists/editArtist?artist_id=${artistId}`);
  };

  // Handle artist deletion
  const handleDeleteArtist = async (artistId: number) => {
    Alert.alert(
      'Delete Artist',
      'Are you sure you want to delete this artist?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/api/deleteArtist/deleteA/${artistId}`);
              Alert.alert('Success', 'Artist deleted successfully');
              setArtists(artists.filter((artist) => artist.artist_id !== artistId));
            } catch (error: any) {
              console.error('Delete error:', error);
              Alert.alert(
                'Error',
                error.response?.data?.msg || 'Delete failed'
              );
            }
          },
        },
      ]
    );
  };

  // Render individual artist card
  const renderArtistCard = ({ item }: { item: Artist }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        {/* Artist name */}
        <Text style={styles.cardTitle}>{item.first_name} {item.surname}</Text>
        
        {/* Artist details */}
        <Text style={styles.cardDetail}>ID Number: {item.id_number}</Text>
        <Text style={styles.cardDetail}>Status: {item.is_active}</Text>
      </View>

      {/* Action buttons for owners only */}
      {userType === 'owner' && (
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigateToEditArtist(item.artist_id)}
          >
            <Text style={styles.buttonText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteArtist(item.artist_id)}
          >
            <Text style={styles.buttonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  // Empty state component
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateText}>
        {artists.length === 0 && !loading ? 
          `No connection to server.\nCheck YOUR_IP setting: ${YOUR_IP}` : 
          'No artists found.'
        }
      </Text>
      {artists.length === 0 && !loading && (
        <TouchableOpacity style={styles.retryButton} onPress={fetchArtists}>
          <Text style={styles.buttonText}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Loading indicator
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8b5e3c" />
        <Text style={styles.loadingText}>Loading artists...</Text>
        <Text style={styles.loadingSubText}>Connecting to: {BASE_URL}</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Artists</Text>
          <Text style={styles.subtitle}>Featured Artists</Text>
        </View>

        {/* Search and Add button section */}
        <View style={styles.searchSection}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search artists..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#888"
          />

          {/* Add artist button for owners */}
          {userType === 'owner' && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={navigateToAddArtist}
            >
              <Text style={styles.buttonText}>Add New Artist</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Artists grid */}
        <FlatList
          data={filteredArtists}
          renderItem={renderArtistCard}
          keyExtractor={(item) => item.artist_id.toString()}
          numColumns={screenWidth > 768 ? 2 : 1}
          contentContainerStyle={styles.listContainer}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false} // Disable FlatList scrolling since we have ScrollView
        />
      </ScrollView>
    </View>
  );
};

// Comprehensive styles matching your CSS design
const styles = StyleSheet.create({
  // Main wrapper - equivalent to .ex-wrapper
  wrapper: {
    flex: 1,
    backgroundColor: '#fdf9f4', // matches body background
  },

  // Content container - equivalent to .content
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
  },

  // Loading state
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fdf9f4',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6b4e3a',
    fontFamily: 'System',
  },
  loadingSubText: {
    marginTop: 5,
    fontSize: 12,
    color: '#8b5e3c',
    fontFamily: 'System',
  },

  // Header - equivalent to .content h1 and .subtitle
  header: {
    marginBottom: 25,
    alignItems: 'center',
  },
  title: {
    fontSize: 35, // 2.2rem equivalent
    fontWeight: 'bold',
    color: '#3e2f1c', // matches body color
    marginBottom: 5,
    textAlign: 'center',
    fontFamily: 'System',
  },
  subtitle: {
    fontSize: 20,
    fontStyle: 'italic',
    fontWeight: '400',
    color: '#666',
    marginTop: 12,
    letterSpacing: 0.4,
    lineHeight: 32, // 1.6 line height
    textAlign: 'center',
    fontFamily: 'System',
  },

  // Search section - equivalent to filters-container
  searchSection: {
    marginBottom: 25,
    alignItems: 'center',
    gap: 12,
  },

  // Search input - equivalent to .search-input
  searchInput: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    fontSize: 15,
    backgroundColor: 'white',
    width: '100%',
    maxWidth: 320,
    fontFamily: 'System',
    color: '#3e2f1c',
  },

  // Add button - equivalent to .btn.primary
  addButton: {
    backgroundColor: '#8b5e3c',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignItems: 'center',
    marginTop: 10,
  },

  // List container
  listContainer: {
    paddingBottom: 20,
  },

  // Art card - equivalent to .card
  card: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0d4c0',
    borderRadius: 12,
    marginBottom: 20,
    marginHorizontal: screenWidth > 768 ? 10 : 0,
    overflow: 'hidden',
    // Shadow for hover effect equivalent
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  // Card content - equivalent to .card-content
  cardContent: {
    padding: 15,
  },

  // Card title - equivalent to .card-content h2
  cardTitle: {
    fontSize: 19, // 1.2rem equivalent
    fontWeight: '600',
    color: '#3e2f1c',
    marginVertical: 6,
    marginBottom: 10,
    fontFamily: 'System',
  },

  // Card details - equivalent to .card-content p
  cardDetail: {
    fontSize: 14, // 0.9rem equivalent
    color: '#3e2f1c',
    marginBottom: 5,
    lineHeight: 19, // 1.4 line height
    fontFamily: 'System',
  },

  // Card actions - equivalent to .card-actions
  cardActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    flexWrap: 'wrap',
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },

  // Buttons - equivalent to .btn
  editButton: {
    backgroundColor: '#8b5e3c', // .btn.primary
    paddingVertical: 8,
    paddingHorizontal: 14,
    fontSize: 14, // 0.85rem equivalent
    borderRadius: 6,
    flex: 0.45,
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 8,
    paddingHorizontal: 14,
    fontSize: 14,
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

  // Empty state - equivalent to .empty-state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    textAlign: 'center',
    color: '#8b5e3c',
    fontStyle: 'italic',
    fontSize: 16,
    fontFamily: 'System',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#8b5e3c',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
});

export default Artists;