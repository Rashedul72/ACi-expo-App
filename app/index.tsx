import { Redirect } from 'expo-router';

export default function Index() {
  // Redirect to the scanner tab as the initial screen
  return <Redirect href="/(tabs)/scanner" />;
}

