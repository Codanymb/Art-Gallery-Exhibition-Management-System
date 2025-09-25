import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
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

// --------------------- Component ---------------------
const Ex: React.FC = () => {
  const router = useRouter();
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [payload, setPayload] = useState<DecodedToken | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // --------------------- Fetch user + exhibitions ---------------------
  useEffect(() => {
    const getUserData = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          const decoded: DecodedToken = jwtDecode(token);
          setPayload(decoded);
        } else {
          Alert.alert('Login Required', 'Please log in to access exhibitions.', [
            { text: 'Go to Login', onPress: () => router.replace('/login') },
          ]);
          return;
        }
      } catch (err) {
        console.error('Error decoding token:', err);
        Alert.alert('Error', 'Session expired. Please log in again.', [
          { text: 'Go to Login', onPress: () => router.replace('/login') },
        ]);
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

  // --------------------- Exhibition Card ---------------------
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
          <Text style={styles.cardDetail}>
            Date: {new Date(item.ex_date).toLocaleDateString()}
          </Text>
          <Text style={styles.cardDetail}>Category: {item.ex_category}</Text>
          <Text style={styles.cardDetail}>Price: R{item.ex_price.toFixed(2)}</Text>
          {item.ex_space && <Text style={styles.cardDetail}>Space: {item.ex_space}</Text>}
        </View>

        <View style={styles.cardActions}>
          {userType === 'general' && (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.registerButton]}
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/exhibitions/exhibition',
                    params: { id: item.exhibition_id },
                  })
                }
              >
                <Text style={styles.actionButtonText}>Register</Text>
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
        </View>
      </View>
    );
  };

  // --------------------- Filters ---------------------
  const filteredExhibitions = exhibitions.filter((ex) => {
    const matchesTitle = ex.ex_title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === '' || ex.ex_category === categoryFilter;
    const onlyComing = ex.ex_status === 'coming';
    return matchesTitle && matchesCategory && onlyComing;
  });

  const categories = ['Nature', 'History', 'Photography', 'Other'];

  // --------------------- UI ---------------------
  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Upcoming Exhibitions</Text>
        <Text style={styles.subtitle}>A World of Art, All in One Place</Text>

        {/* Search */}
        <TextInput
          style={styles.searchInput}
          placeholder="Search by Exhibition name"
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {/* Category Filter */}
        <View style={styles.filtersContainer}>
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Category:</Text>
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setShowCategoryModal(true)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  categoryFilter && { color: '#8B4513', fontWeight: '700' },
                ]}
              >
                {categoryFilter || 'All Categories'}
              </Text>
              <Text style={styles.dropdownArrow}>▼</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Exhibition List */}
        <FlatList
          data={filteredExhibitions}
          renderItem={renderExhibition}
          keyExtractor={(item) => item.exhibition_id.toString()}
          scrollEnabled={false}
          contentContainerStyle={styles.exhibitionsGrid}
        />
      </ScrollView>

      {/* Category Modal */}
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
              <Text style={styles.modalOptionText}>All</Text>
            </TouchableOpacity>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.modalOption,
                  categoryFilter === cat && {
                    backgroundColor: '#f0e6e1',
                    borderRadius: 8,
                  },
                ]}
                onPress={() => {
                  setCategoryFilter(cat);
                  setShowCategoryModal(false);
                }}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    categoryFilter === cat && { color: '#8B4513', fontWeight: '700' },
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowCategoryModal(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Ex;

// --------------------- Styles ---------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#777',
    textAlign: 'center',
    marginBottom: 20,
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
    color: '#000',
  },
  filtersContainer: { marginBottom: 20 },
  filterRow: { marginBottom: 12 },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
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
    backgroundColor: '#fff',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#666',
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
    shadowRadius: 2,
  },
  poster: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  cardContent: { padding: 12 },
  statusChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#8B4513',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    textTransform: 'capitalize',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  cardDetail: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
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
  registerButton: { backgroundColor: '#5a3e2b' },
  viewButton: { backgroundColor: '#8B4513' },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 20,
    width: '80%',
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    padding: 16,
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  modalOptionText: { fontSize: 16, color: '#333' },
  modalCloseButton: {
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  modalCloseText: { fontSize: 16, color: '#666', fontWeight: '600' },
});
