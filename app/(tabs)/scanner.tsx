import { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Alert,
  ActivityIndicator,
  Pressable,
  TextInput,
  Platform,
  Dimensions,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Header } from '@/components/header';
import {
  fetchProductByBarcode,
  saveProductToDatabase,
  getProductByBarcode,
  SavedProduct,
} from '@/services/api';
import {
  Colors,
  spacing,
  borderRadius,
  shadows,
  responsiveWidth,
  responsiveHeight,
  responsiveFontSize,
  isSmallDevice,
  isTablet,
} from '@/constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Use light mode colors only
const colors = Colors.light;

// Responsive scan frame size
const getScanFrameSize = () => {
  if (isSmallDevice) {
    return Math.min(SCREEN_WIDTH * 0.75, 260);
  } else if (isTablet) {
    return Math.min(SCREEN_WIDTH * 0.5, 400);
  } else {
    return Math.min(SCREEN_WIDTH * 0.8, 320);
  }
};

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [product, setProduct] = useState<SavedProduct | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);
  const [isExistingProduct, setIsExistingProduct] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [scanFrameSize, setScanFrameSize] = useState(getScanFrameSize());

  useEffect(() => {
    // Update scan frame size on orientation change
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScanFrameSize(getScanFrameSize());
    });
    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    if (permission && !permission.granted) {
      requestPermission();
    }
  }, [permission]);

  const handleBarCodeScanned = async ({ data, type }: { data: string; type: string }) => {
    if (scanned || loading || saving || checking) return;

    console.log('Barcode scanned:', { data, type });

    if (!/^\d+$/.test(data)) {
      console.log('Invalid barcode format:', data);
      return;
    }

    setScanned(true);
    setChecking(true);
    setLoading(false);
    setSaving(false);
    setProduct(null);
    setIsExistingProduct(false);

    try {
      // First, check if product already exists in database
      try {
        const existingProduct = await getProductByBarcode(data);
        if (existingProduct) {
          setChecking(false);
          setProduct(existingProduct);
          setIsExistingProduct(true);
          console.log('Product already exists in database:', existingProduct);
          return;
        }
      } catch (checkError) {
        // If check fails, continue to fetch from external API
        console.log('Could not check database, continuing with external API');
      }

      // Fetch product from external API
      setChecking(false);
      setLoading(true);
      const response = await fetchProductByBarcode(data);
      const externalProduct = response.product;

      setLoading(false);
      setSaving(true);

      try {
        const savedProduct = await saveProductToDatabase(externalProduct, 'Uncategorized');
        setProduct(savedProduct);
        setIsExistingProduct(false);
        console.log('Product saved to database:', savedProduct);
      } catch (saveError) {
        console.error('Error saving product to database:', saveError);
        setProduct({
          ...externalProduct,
          category: 'Uncategorized',
        });
        setIsExistingProduct(false);
        Alert.alert(
          'Warning',
          'Product fetched but could not be saved to database. Please check your connection.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to fetch product', [
        {
          text: 'OK',
          onPress: () => setScanned(false),
        },
      ]);
    } finally {
      setLoading(false);
      setSaving(false);
      setChecking(false);
    }
  };

  const handleScanAgain = () => {
    setScanned(false);
    setProduct(null);
    setIsExistingProduct(false);
  };

  const handleManualSubmit = async () => {
    if (!manualBarcode.trim()) {
      Alert.alert('Error', 'Please enter a barcode');
      return;
    }

    setChecking(true);
    setLoading(false);
    setSaving(false);
    setProduct(null);
    setIsExistingProduct(false);

    try {
      // First, check if product already exists in database
      try {
        const existingProduct = await getProductByBarcode(manualBarcode.trim());
        if (existingProduct) {
          setChecking(false);
          setProduct(existingProduct);
          setIsExistingProduct(true);
          setShowManualInput(false);
          setManualBarcode('');
          console.log('Product already exists in database:', existingProduct);
          return;
        }
      } catch (checkError) {
        // If check fails, continue to fetch from external API
        console.log('Could not check database, continuing with external API');
      }

      // Fetch product from external API
      setChecking(false);
      setLoading(true);
      const response = await fetchProductByBarcode(manualBarcode.trim());
      const externalProduct = response.product;

      setLoading(false);
      setSaving(true);

      try {
        const savedProduct = await saveProductToDatabase(externalProduct, 'Uncategorized');
        setProduct(savedProduct);
        setIsExistingProduct(false);
        setShowManualInput(false);
        setManualBarcode('');
        console.log('Product saved to database:', savedProduct);
      } catch (saveError) {
        console.error('Error saving product to database:', saveError);
        setProduct({
          ...externalProduct,
          category: 'Uncategorized',
        });
        setIsExistingProduct(false);
        setShowManualInput(false);
        setManualBarcode('');
        Alert.alert(
          'Warning',
          'Product fetched but could not be saved to database. Please check your connection.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to fetch product');
    } finally {
      setLoading(false);
      setSaving(false);
      setChecking(false);
    }
  };

  if (!permission) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <SafeAreaView style={styles.safeArea}>
          <Header />
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={colors.primary} />
            <ThemedText style={styles.loadingText}>Requesting camera permission...</ThemedText>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <SafeAreaView style={styles.safeArea}>
          <Header />
          <View style={styles.centerContent}>
            <View style={[styles.permissionCard, { backgroundColor: colors.card }]}>
              <ThemedText type="title" style={styles.permissionTitle}>
                Camera Access Required
              </ThemedText>
              <ThemedText style={styles.permissionMessage}>
                We need access to your camera to scan barcodes and identify products.
              </ThemedText>
              <Pressable
                style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                onPress={requestPermission}>
                <ThemedText style={styles.primaryButtonText}>Grant Permission</ThemedText>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <Header />
        {product && !loading && !checking ? (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>
            <View style={[styles.productCard, { backgroundColor: colors.card }]}>
              {isExistingProduct ? (
                <View style={[styles.existingBadge, { backgroundColor: colors.info + '20', borderColor: colors.info }]}>
                  <ThemedText style={[styles.existingBadgeText, { color: colors.info }]}>
                    ✓ Already in Database
                  </ThemedText>
                </View>
              ) : (
                <View style={[styles.successBadge, { backgroundColor: colors.success + '20' }]}>
                  <ThemedText style={[styles.successBadgeText, { color: colors.success }]}>
                    ✓ Saved
                  </ThemedText>
                </View>
              )}
              <ThemedText type="title" style={styles.productTitle}>
                Product Details
              </ThemedText>

              <View style={styles.productInfoRow}>
                <ThemedText style={[styles.productLabel, { color: colors.textSecondary }]}>Barcode</ThemedText>
                <ThemedText style={[styles.productValue, { color: colors.text }]}>{product.barcode}</ThemedText>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <View style={styles.productInfoRow}>
                <ThemedText style={[styles.productLabel, { color: colors.textSecondary }]}>Material</ThemedText>
                <ThemedText style={[styles.productValue, { color: colors.text }]}>{product.material}</ThemedText>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <View style={styles.productInfoRow}>
                <ThemedText style={[styles.productLabel, { color: colors.textSecondary }]}>Description</ThemedText>
                <ThemedText style={[styles.productValue, styles.productDescription, { color: colors.text }]}>
                  {product.description}
                </ThemedText>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <View style={styles.productInfoRow}>
                <ThemedText style={[styles.productLabel, { color: colors.textSecondary }]}>Category</ThemedText>
                <View style={[styles.categoryBadge, { backgroundColor: colors.primary + '20' }]}>
                  <ThemedText style={[styles.categoryText, { color: colors.primary }]}>
                    {product.category || 'Uncategorized'}
                  </ThemedText>
                </View>
              </View>

              <Pressable
                style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                onPress={handleScanAgain}>
                <ThemedText style={styles.primaryButtonText}>Scan Another Product</ThemedText>
              </Pressable>
            </View>
          </ScrollView>
        ) : (
          <>
            <View style={styles.cameraContainer}>
              <CameraView
                style={styles.camera}
                facing="back"
                onBarcodeScanned={scanned || loading || saving || checking ? undefined : handleBarCodeScanned}
                barcodeScannerSettings={
                  Platform.OS === 'ios'
                    ? undefined
                    : {
                        barcodeTypes: [
                          'aztec',
                          'ean13',
                          'ean8',
                          'qr',
                          'pdf417',
                          'upc_a',
                          'upc_e',
                          'datamatrix',
                          'code39',
                          'code93',
                          'itf14',
                          'codabar',
                          'code128',
                        ],
                      }
                }
                enableTorch={false}
              />
            </View>

            {(checking || loading || saving) && (
              <View style={styles.loadingOverlay}>
                <View style={[styles.loadingCard, { backgroundColor: colors.card }]}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <ThemedText style={[styles.loadingText, { color: colors.text }]}>
                    {checking
                      ? 'Checking database...'
                      : loading
                        ? 'Fetching product...'
                        : 'Saving to database...'}
                  </ThemedText>
                </View>
              </View>
            )}

            {!checking && !loading && !saving && (
              <>
                <View style={styles.scanArea}>
                  <View style={[styles.scanFrame, { width: scanFrameSize, height: scanFrameSize * 0.6 }]}>
                    <View style={[styles.corner, styles.topLeft, { borderColor: colors.primary }]} />
                    <View style={[styles.corner, styles.topRight, { borderColor: colors.primary }]} />
                    <View style={[styles.corner, styles.bottomLeft, { borderColor: colors.primary }]} />
                    <View style={[styles.corner, styles.bottomRight, { borderColor: colors.primary }]} />
                  </View>
                </View>

                <View style={styles.overlay}>
                  <View style={styles.instructionCard}>
                    <ThemedText style={styles.instructionTitle}>Point camera at barcode</ThemedText>
                    <ThemedText style={styles.instructionSubtext}>
                      Make sure the barcode is within the frame
                    </ThemedText>
                  </View>

                  <Pressable
                    style={[styles.secondaryButton, { borderColor: colors.border, backgroundColor: '#FFFFFF' }]}
                    onPress={() => setShowManualInput(!showManualInput)}>
                    <ThemedText style={[styles.secondaryButtonText, { color: '#000000' }]}>
                      {showManualInput ? 'Hide Manual Entry' : 'Enter Barcode Manually'}
                    </ThemedText>
                  </Pressable>
                </View>

                {showManualInput && (
                  <View style={[styles.manualInputCard, { backgroundColor: colors.card }]}>
                    <ThemedText style={[styles.manualLabel, { color: colors.text }]}>Enter Barcode</ThemedText>
                    <TextInput
                      style={[
                        styles.manualInput,
                        {
                          backgroundColor: '#FFFFFF',
                          color: '#000000',
                          borderColor: colors.border,
                        },
                      ]}
                      value={manualBarcode}
                      onChangeText={setManualBarcode}
                      placeholder="8901012116340"
                      placeholderTextColor="#999999"
                      keyboardType="number-pad"
                      autoFocus
                    />
                    <View style={styles.manualButtons}>
                      <Pressable
                        style={[styles.cancelButton, { backgroundColor: colors.backgroundSecondary }]}
                        onPress={() => setShowManualInput(false)}>
                        <ThemedText style={[styles.cancelButtonText, { color: colors.text }]}>
                          Cancel
                        </ThemedText>
                      </Pressable>
                      <Pressable
                        style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                        onPress={handleManualSubmit}>
                        <ThemedText style={styles.primaryButtonText}>Search</ThemedText>
                      </Pressable>
                    </View>
                  </View>
                )}
              </>
            )}
          </>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  scanArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: borderRadius.lg,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
  },
  topLeft: {
    top: -2,
    left: -2,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: borderRadius.lg,
  },
  topRight: {
    top: -2,
    right: -2,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: borderRadius.lg,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: borderRadius.lg,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: borderRadius.lg,
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingBottom: responsiveHeight(3),
    paddingTop: spacing.md,
  },
  instructionCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  instructionTitle: {
    color: '#FFFFFF',
    fontSize: responsiveFontSize(16),
    fontWeight: '600',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  instructionSubtext: {
    color: '#FFFFFF',
    fontSize: responsiveFontSize(14),
    opacity: 0.9,
    textAlign: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  loadingCard: {
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    minWidth: responsiveWidth(70),
    maxWidth: responsiveWidth(85),
    ...shadows.lg,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: responsiveFontSize(14),
    fontWeight: '500',
    textAlign: 'center',
  },
  productCard: {
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
    ...shadows.lg,
  },
  successBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginBottom: spacing.md,
  },
  successBadgeText: {
    fontSize: responsiveFontSize(12),
    fontWeight: '600',
  },
  existingBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginBottom: spacing.md,
    borderWidth: 1.5,
  },
  existingBadgeText: {
    fontSize: responsiveFontSize(12),
    fontWeight: '600',
  },
  productTitle: {
    fontSize: responsiveFontSize(22),
    fontWeight: 'bold',
    marginBottom: spacing.lg,
    color: '#000000',
  },
  productInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
    flexWrap: 'wrap',
  },
  productLabel: {
    fontSize: responsiveFontSize(14),
    fontWeight: '600',
    flex: 1,
    minWidth: responsiveWidth(30),
  },
  productValue: {
    fontSize: responsiveFontSize(14),
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
    minWidth: responsiveWidth(50),
  },
  productDescription: {
    textAlign: 'right',
  },
  divider: {
    height: 1,
    marginVertical: spacing.md,
    opacity: 0.2,
  },
  categoryBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-end',
  },
  categoryText: {
    fontSize: responsiveFontSize(12),
    fontWeight: '600',
  },
  permissionCard: {
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    width: '100%',
    maxWidth: responsiveWidth(90),
    ...shadows.lg,
  },
  permissionTitle: {
    fontSize: responsiveFontSize(20),
    fontWeight: 'bold',
    marginBottom: spacing.md,
    textAlign: 'center',
    color: '#000000',
  },
  permissionMessage: {
    fontSize: responsiveFontSize(14),
    textAlign: 'center',
    marginBottom: spacing.xl,
    color: '#666666',
    lineHeight: 20,
  },
  primaryButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    ...shadows.md,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: responsiveFontSize(16),
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    borderWidth: 1.5,
  },
  secondaryButtonText: {
    fontSize: responsiveFontSize(14),
    fontWeight: '600',
    color: '#000000',
  },
  manualInputCard: {
    position: 'absolute',
    top: responsiveHeight(5),
    left: spacing.lg,
    right: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    maxWidth: 500,
    alignSelf: 'center',
    ...shadows.xl,
  },
  manualLabel: {
    fontSize: responsiveFontSize(16),
    fontWeight: '600',
    marginBottom: spacing.md,
    color: '#000000',
  },
  manualInput: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    fontSize: responsiveFontSize(16),
    marginBottom: spacing.md,
    borderWidth: 1.5,
    width: '100%',
  },
  manualButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  cancelButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    minWidth: responsiveWidth(25),
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: responsiveFontSize(14),
    fontWeight: '500',
  },
});
