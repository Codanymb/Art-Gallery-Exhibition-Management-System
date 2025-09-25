import { Slot } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function ArtPiece() {
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
