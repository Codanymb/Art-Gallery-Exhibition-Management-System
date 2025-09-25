import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

// Interface for art piece data matching your backend structure
interface ArtPiece {
  art_piece_id: number;
  title: string;
  description: string;
  category: string;
  estimated_value: number;
  quantity: number;
  availability: 'available' | 'displayed';
  is_active: 'yes' | 'no';
  image: string;
}

const EditArtPieces: React.FC = () => {
  // Get route parameters (art piece ID from URL)
  const { art_piece_id } = useLocalSearchParams();
  const router = useRouter();

  // Art piece state
  const [art, setArt] = useState<ArtPiece | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Form state variables matching your original component
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [estimatedValue, setEstimatedValue] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [availability, setAvailability] = useState<string>('');
  const [isActive, setIsActive] = useState<string>('');
  const [image, setImage] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('1');
  
  // Submission loading state
  const [saving, setSaving] = useState<boolean>(false);

  // Fetch art piece data on component mount
  useEffect(() => {
    if (!art_piece_id) {
      Alert.alert('Error', 'No art piece ID provided');
      router.back();
      return;
    }

    fetchArtPiece();
  }, [art_piece_id]);

  // Fetch specific art piece data from your API
  const fetchArtPiece = async () => {
    try {
      setLoading(true);
      
      // Using your exact API endpoint structure
      const response = await axios.get(
        `http://192.168.10.163:3000/api/getEachArt/getEachArt/${art_piece_id}`
        // Replace 192.168.1.100 with your actual IP address
      );

      if (!response.data.art) {
        Alert.alert('Error', 'Art piece not found', [
          { text: 'OK', onPress: () => router.push('/artPieces') }
        ]);
        return;
      }

      const artData = response.data.art;
      setArt(artData);
      
      // Populate form fields with existing data
      setTitle(artData.title);
      setDescription(artData.description);
      setEstimatedValue(artData.estimated_value.toString());
      setCategory(artData.category);
      setAvailability(artData.availability);
      setIsActive(artData.is_active);
      setImage(artData.image);
      setQuantity(artData.quantity.toString());
      
    } catch (error: any) {
      console.error('Error fetching art piece:', error);
      Alert.alert('Error', 'Failed to fetch art piece', [
        { text: 'OK', onPress: () => router.push('/artPieces') }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Form validation
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Title is required');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Validation Error', 'Description is required');
      return;
    }

    const parsedValue = parseFloat(estimatedValue);
    if (isNaN(parsedValue) || parsedValue <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid estimated value');
      return;
    }

    const parsedQuantity = parseInt(quantity);
    if (isNaN(parsedQuantity) || parsedQuantity < 0) {
      Alert.alert('Validation Error', 'Please enter a valid quantity');
      return;
    }

    if (!category) {
      Alert.alert('Validation Error', 'Please select a category');
      return;
    }

    if (!availability) {
      Alert.alert('Validation Error', 'Please select availability status');
      return;
    }

    if (!isActive) {
      Alert.alert('Validation Error', 'Please select active status');
      return;
    }

    try {
      setSaving(true);
      const token = await AsyncStorage.getItem('token');

      // Prepare update data matching your backend structure
      const updateData = {
        title: title.trim(),
        description: description.trim(),
        estimated_value: parsedValue,
        category,
        availability,
        is_active: isActive,
        image: image.trim(),
        quantity: parsedQuantity,
      };

      // Using your exact API endpoint structure
      await axios.put(
        `http://192.168.10.163:3000/api/updateArt/updateArt/${art_piece_id}`,
        updateData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      Alert.alert('Success', 'Art piece updated successfully', [
        { text: 'OK', onPress: () => router.push('/artPieces') }
      ]);

    } catch (error: any) {
      console.error('Update error:', error);
      Alert.alert(
        'Error',
        error.response?.data?.msg || 'Update failed'
      );
    } finally {
      setSaving(false);
    }
  };

  // Handle cancel navigation
  const handleCancel = () => {
    Alert.alert(
      'Confirm',
      'Are you sure you want to cancel? Any unsaved changes will be lost.',
      [
        { text: 'Stay', style: 'cancel' },
        { text: 'Leave', onPress: () => router.push('/artPieces') }
      ]
    );
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B4513" />
        <Text style={styles.loadingText}>Loading art piece...</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Edit Art Piece</Text>
        </View>

        {/* Form Container */}
        <View style={styles.modal}>
          {/* Current Image Preview */}
          {image && (
            <View style={styles.imagePreviewContainer}>
              <Text style={styles.label}>Current Image:</Text>
              <Image source={{ uri: image }} style={styles.imagePreview} />
            </View>
          )}

          {/* Title Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter art piece title"
              placeholderTextColor="#999"
            />
          </View>

          {/* Description Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Enter description"
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Estimated Value Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Estimated Value (R) *</Text>
            <TextInput
              style={styles.input}
              value={estimatedValue}
              onChangeText={setEstimatedValue}
              placeholder="0.00"
              placeholderTextColor="#999"
              keyboardType="decimal-pad"
            />
          </View>

          {/* Category Picker */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={category}
                onValueChange={setCategory}
                style={styles.picker}
              >
                <Picker.Item label="Nature" value="Nature" />
                <Picker.Item label="History" value="History" />
                <Picker.Item label="Photography" value="Photography" />
                <Picker.Item label="Other" value="Other" />
              </Picker>
            </View>
          </View>

          {/* Availability Picker */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Availability *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={availability}
                onValueChange={setAvailability}
                style={styles.picker}
              >
                <Picker.Item label="Available" value="available" />
                <Picker.Item label="Displayed" value="displayed" />
              </Picker>
            </View>
          </View>

          {/* Active Status Picker */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Active Status *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={isActive}
                onValueChange={setIsActive}
                style={styles.picker}
              >
                <Picker.Item label="Yes" value="yes" />
                <Picker.Item label="No" value="no" />
              </Picker>
            </View>
          </View>

          {/* Quantity Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Quantity *</Text>
            <TextInput
              style={styles.input}
              value={quantity}
              onChangeText={setQuantity}
              placeholder="0"
              placeholderTextColor="#999"
              keyboardType="number-pad"
            />
          </View>

          {/* Image URL Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Image URL</Text>
            <TextInput
              style={styles.input}
              value={image}
              onChangeText={setImage}
              placeholder="Enter image URL"
              placeholderTextColor="#999"
              keyboardType="url"
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.btn, styles.primary, saving && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.buttonText}>Save Changes</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, styles.secondary]}
              onPress={handleCancel}
              disabled={saving}
            >
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

// Comprehensive styles matching your original CSS structure
const styles = StyleSheet.create({
  // Main wrapper - equivalent to .ex-wrapper
  wrapper: {
    flex: 1,
    backgroundColor: '#f9f7f2',
  },

  // Content container
  content: {
    flex: 1,
    padding: 20,
  },

  // Loading state
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

  // Header
  header: {
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    fontFamily: 'System',
  },

  // Form modal - equivalent to .modal
  modal: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 20,
  },

  // Image preview
  imagePreviewContainer: {
    marginBottom: 20,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    resizeMode: 'cover',
    marginTop: 8,
  },

  // Input groups
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
    fontFamily: 'System',
  },

  // Input styles
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    color: '#333',
    fontFamily: 'System',
  },
  textarea: {
    height: 100,
    textAlignVertical: 'top',
  },

  // Picker styles
  pickerContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    color: '#333',
  },

  // Button container - equivalent to .modal-buttons
  modalButtons: {
    flexDirection: 'column',
    gap: 15,
    marginTop: 30,
  },

  // Button base styles - equivalent to .btn
  btn: {
    borderRadius: 8,
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },

  // Primary button - equivalent to .btn.primary
  primary: {
    backgroundColor: '#8B4513',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'System',
  },

  // Secondary button - equivalent to .btn.secondary
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#6c757d',
  },
  secondaryButtonText: {
    color: '#6c757d',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'System',
  },

  // Disabled button state
  disabledButton: {
    opacity: 0.7,
  },
});

export default EditArtPieces;