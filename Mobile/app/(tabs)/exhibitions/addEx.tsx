import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
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
  ex_title: string;
  ex_date: string;
  ex_status: 'coming' | 'ongoing' | 'completed';
  ex_space: string;
  ex_category: 'Nature' | 'History' | 'Photography' | 'Other';
  ex_poster: string;
  ex_price: string;
}

// --------------------- Add Exhibition Component ---------------------
const AddEx: React.FC = () => {
  const router = useRouter();
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [exhibition, setExhibition] = useState<Exhibition>({
    ex_title: '',
    ex_date: '',
    ex_status: 'coming',
    ex_space: '',
    ex_category: 'Nature',
    ex_poster: '',
    ex_price: '',
  });

  // --------------------- Handle Input Changes ---------------------
  const handleChange = (name: keyof Exhibition, value: string) => {
    setExhibition({ ...exhibition, [name]: value });
  };

  // --------------------- Validate Form ---------------------
  const validateForm = (): boolean => {
    if (!exhibition.ex_title.trim()) {
      Alert.alert('Validation Error', 'Title is required');
      return false;
    }
    if (!exhibition.ex_date.trim()) {
      Alert.alert('Validation Error', 'Date is required');
      return false;
    }
    if (!exhibition.ex_space.trim()) {
      Alert.alert('Validation Error', 'Space is required');
      return false;
    }
    if (!exhibition.ex_price.trim()) {
      Alert.alert('Validation Error', 'Price is required');
      return false;
    }
    if (isNaN(Number(exhibition.ex_space)) || Number(exhibition.ex_space) <= 0) {
      Alert.alert('Validation Error', 'Space must be a valid positive number');
      return false;
    }
    if (isNaN(Number(exhibition.ex_price)) || Number(exhibition.ex_price) < 0) {
      Alert.alert('Validation Error', 'Price must be a valid number');
      return false;
    }
    return true;
  };

  // --------------------- Handle Form Submission ---------------------
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      
      const response = await fetch('http://192.168.10.163:3000/api/AddExhibition/Add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          ...exhibition,
          ex_space: Number(exhibition.ex_space),
          ex_price: Number(exhibition.ex_price),
        }),
      });

      const result = await response.json();

      if (response.ok) {
        Alert.alert(
          'Success',
          result.Message || 'Exhibition created successfully!',
          [
            {
              text: 'OK',
              onPress: () => router.back(), // Navigate back to exhibitions list
            },
          ]
        );
      } else {
        Alert.alert('Error', result.msg || 'Failed to create exhibition');
      }
    } catch (err) {
      console.error('Error creating exhibition:', err);
      Alert.alert('Network Error', 'Could not create exhibition. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // --------------------- Category and Status Options ---------------------
  const categories: Array<Exhibition['ex_category']> = ['Nature', 'History', 'Photography', 'Other'];
  const statuses: Array<Exhibition['ex_status']> = ['coming', 'ongoing', 'completed'];

  // --------------------- Category Modal ---------------------
  const CategoryModal: React.FC = () => (
    <Modal visible={showCategoryModal} transparent animationType="fade">
      <View style={styles.modalBackground}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Select Category</Text>
          {categories.map(category => (
            <TouchableOpacity
              key={category}
              style={styles.modalOption}
              onPress={() => {
                handleChange('ex_category', category);
                setShowCategoryModal(false);
              }}
            >
              <Text style={styles.modalOptionText}>{category}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity 
            style={styles.modalCloseButton} 
            onPress={() => setShowCategoryModal(false)}
          >
            <Text style={styles.modalCloseText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // --------------------- Status Modal ---------------------
  const StatusModal: React.FC = () => (
    <Modal visible={showStatusModal} transparent animationType="fade">
      <View style={styles.modalBackground}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Select Status</Text>
          {statuses.map(status => (
            <TouchableOpacity
              key={status}
              style={styles.modalOption}
              onPress={() => {
                handleChange('ex_status', status);
                setShowStatusModal(false);
              }}
            >
              <Text style={styles.modalOptionText}>{status}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity 
            style={styles.modalCloseButton} 
            onPress={() => setShowStatusModal(false)}
          >
            <Text style={styles.modalCloseText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // --------------------- Render ---------------------
  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        <Text style={styles.title}>Create New Exhibition</Text>
        
        <View style={styles.form}>
          {/* Title Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter exhibition title"
              placeholderTextColor="#999"
              value={exhibition.ex_title}
              onChangeText={(value) => handleChange('ex_title', value)}
            />
          </View>

          {/* Date Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#999"
              value={exhibition.ex_date}
              onChangeText={(value) => handleChange('ex_date', value)}
            />
          </View>

          {/* Space Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Space *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter space number"
              placeholderTextColor="#999"
              keyboardType="numeric"
              value={exhibition.ex_space}
              onChangeText={(value) => handleChange('ex_space', value)}
            />
          </View>

          {/* Category Selector */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category *</Text>
            <TouchableOpacity 
              style={styles.selector} 
              onPress={() => setShowCategoryModal(true)}
            >
              <Text style={styles.selectorText}>{exhibition.ex_category}</Text>
              <Text style={styles.dropdownArrow}>▼</Text>
            </TouchableOpacity>
          </View>

          {/* Status Selector */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Status *</Text>
            <TouchableOpacity 
              style={styles.selector} 
              onPress={() => setShowStatusModal(true)}
            >
              <Text style={styles.selectorText}>{exhibition.ex_status}</Text>
              <Text style={styles.dropdownArrow}>▼</Text>
            </TouchableOpacity>
          </View>

          {/* Poster URL Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Poster URL</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Paste poster image URL"
              placeholderTextColor="#999"
              value={exhibition.ex_poster}
              onChangeText={(value) => handleChange('ex_poster', value)}
              multiline
            />
          </View>

          {/* Price Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Price *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter price (e.g., 25.00)"
              placeholderTextColor="#999"
              keyboardType="numeric"
              value={exhibition.ex_price}
              onChangeText={(value) => handleChange('ex_price', value)}
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            <Text style={styles.submitButtonText}>
              {isLoading ? 'Creating Exhibition...' : 'Create Exhibition'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modals */}
      <CategoryModal />
      <StatusModal />
    </View>
  );
};

// --------------------- Styles ---------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 30,
  },
  form: {
    flex: 1,
    paddingBottom: 30,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#f9f9f9',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    minHeight: 48,
  },
  selector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 48,
  },
  selectorText: {
    fontSize: 16,
    color: '#333',
    textTransform: 'capitalize',
  },
  dropdownArrow: {
    fontSize: 14,
    color: '#666',
  },
  submitButton: {
    backgroundColor: '#5a3e2b',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
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
  modalOptionText: {
    fontSize: 16,
    color: '#333',
    textTransform: 'capitalize',
  },
  modalCloseButton: {
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  modalCloseText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
});

export default AddEx;