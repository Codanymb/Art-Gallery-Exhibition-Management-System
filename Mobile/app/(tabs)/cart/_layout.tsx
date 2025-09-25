import { View, Text, StyleSheet } from 'react-native';
import { Slot } from 'expo-router';

export default function cart() {
  return (
    <View style={styles.container}>
      {/* ✅ Optional header */}
      <Text style={styles.header}>Exhibitions</Text>

      {/* ✅ This renders the correct child page (addEx, editEx, index, etc.) */}
      <Slot />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});
