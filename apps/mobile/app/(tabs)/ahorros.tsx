import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/Colors';

export default function AhorrosScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.placeholder}>Ahorros — próximamente</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  placeholder: { color: Colors.textSecondary, fontSize: 16 },
});
