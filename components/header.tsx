import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Colors, spacing, shadows, responsiveFontSize } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function Header() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: colors.card,
          borderBottomColor: colors.border,
        },
      ]}>
      <View style={styles.headerContent}>
        <ThemedText type="title" style={[styles.headerTitle, { color: colors.text }]}>
          Shwapno Barcode Scanner
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    paddingTop: Platform.OS === 'ios' ? spacing.lg + 8 : spacing.lg + 12,
    borderBottomWidth: 1,
    ...shadows.sm,
  },
  headerContent: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: responsiveFontSize(20),
    fontWeight: 'bold',
    marginBottom: spacing.xs / 2,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: responsiveFontSize(12),
    fontWeight: '500',
  },
});

