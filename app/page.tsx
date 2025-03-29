import { View, Text, StyleSheet, Image } from 'react-native';

export default function Page() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome to Expo</Text>
        <Text style={styles.subtitle}>Get started by editing app/page.tsx</Text>
      </View>

      <View style={styles.logoContainer}>
        <Image 
          source={{ uri: 'https://vitejs.dev/logo.svg' }}
          style={styles.logo}
        />
        <Image 
          source={{ uri: 'https://reactjs.org/logo-og.png' }}
          style={styles.logo}
        />
      </View>

      <View style={styles.grid}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Docs</Text>
          <Text style={styles.cardText}>Find in-depth information about Expo features and API.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Learn</Text>
          <Text style={styles.cardText}>Learn about Expo in an interactive course with quizzes!</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Templates</Text>
          <Text style={styles.cardText}>Explore the Expo template repository.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Deploy</Text>
          <Text style={styles.cardText}>Instantly deploy your Expo app to a public URL with Expo EAS.</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  logoContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
    marginHorizontal: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});