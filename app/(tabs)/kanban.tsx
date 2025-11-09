import { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  RefreshControl,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';
import { GestureHandlerRootView, Gesture, GestureDetector, ScrollView as GestureScrollView } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  runOnJS,
  withSpring,
  useAnimatedReaction,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Header } from '@/components/header';
import {
  getAllProducts,
  updateProductCategory,
  getAllCategories,
  createCategory,
  deleteCategory,
  SavedProduct,
} from '@/services/api';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  Colors,
  spacing,
  borderRadius,
  shadows,
  responsiveWidth,
  responsiveFontSize,
  isSmallDevice,
  isTablet,
} from '@/constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const COLUMN_WIDTH = isSmallDevice ? 260 : isTablet ? 320 : 300;

interface DraggableProductProps {
  product: SavedProduct;
  onDrop: (product: SavedProduct, category: string) => void;
  updating: string | null;
  colorScheme: 'light' | 'dark' | null | undefined;
  categories: string[];
  categoryIndex: number;
  currentCategory: string;
  columnWidth: number;
  onDragOverColumn: (absoluteX: number, currentIndex: number) => string | null;
  onDragEnd: () => void;
  onDragStart?: (product: SavedProduct, position: { x: number; y: number }) => void;
  onDragUpdate?: (position: { x: number; y: number }) => void;
  onDragClear?: () => void;
}

function DraggableProduct({
  product,
  onDrop,
  updating,
  colorScheme,
  categories,
  categoryIndex,
  currentCategory,
  columnWidth,
  onDragOverColumn,
  onDragEnd,
  onDragStart,
  onDragUpdate,
  onDragClear,
}: DraggableProductProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const isDragging = useSharedValue(false);
  const targetCategoryRef = useSharedValue<string | null>(null);
  const dragEnabled = useSharedValue(false);
  const dragAbsoluteX = useSharedValue(0);
  const frameCounter = useSharedValue(0);
  const [dragging, setDragging] = useState(false);
  const [targetCategory, setTargetCategory] = useState<string | null>(null);
  const [readyToDrag, setReadyToDrag] = useState(false);
  const colors = Colors[colorScheme ?? 'light'];

  // Throttled drag over handler - optimized to reduce JS thread calls
  const handleDragOver = useCallback(
    (absoluteX: number) => {
      const newCategory = onDragOverColumn(absoluteX, categoryIndex);
      const prevCategory = targetCategoryRef.value;
      targetCategoryRef.value = newCategory;
      
      // Only update state if category actually changed (prevents unnecessary re-renders)
      if (prevCategory !== newCategory) {
        setTargetCategory(newCategory);
        if (newCategory && Platform.OS === 'ios') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }
    },
    [onDragOverColumn, categoryIndex, targetCategoryRef]
  );

  // Throttle drag updates using animated reaction - only update every 3 frames
  // This reduces JS thread calls from 60fps to ~20fps for category detection
  useAnimatedReaction(
    () => {
      // Only react when dragging
      if (!isDragging.value || !dragEnabled.value) {
        return null;
      }
      return dragAbsoluteX.value;
    },
    (absoluteX) => {
      if (absoluteX === null || !isDragging.value || !dragEnabled.value) {
        return;
      }
      
      // Throttle: only update every 3 frames (~50ms at 60fps = 20fps updates)
      frameCounter.value = frameCounter.value + 1;
      if (frameCounter.value >= 3) {
        frameCounter.value = 0;
        runOnJS(handleDragOver)(absoluteX);
      }
    }
  );

  const handleDrop = useCallback(() => {
    const category = targetCategoryRef.value;
    if (category) {
      onDrop(product, category);
    } else {
      onDragEnd();
    }
    targetCategoryRef.value = null;
    setTargetCategory(null);
  }, [product, onDrop, onDragEnd, targetCategoryRef]);

  const isUpdating = updating === product._id;

  // Removed startHoldTimer and cancelHoldTimer - using LongPress directly

  const longPressGesture = Gesture.LongPress()
    .enabled(!isUpdating)
    .minDuration(1000)
    .maxDistance(10)
    .onStart(() => {
      dragEnabled.value = true;
      scale.value = withSpring(1.15, {
        damping: 15,
        stiffness: 300,
      });
      runOnJS(setReadyToDrag)(true);
      if (Platform.OS === 'ios') {
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
      }
    })
    .onEnd(() => {
      if (!isDragging.value) {
        dragEnabled.value = false;
        scale.value = withSpring(1);
        runOnJS(setReadyToDrag)(false);
      }
    });

  const panGesture = Gesture.Pan()
    .enabled(!isUpdating)
    .minDistance(5)
    .activeOffsetX([-25, 25])
    .failOffsetY([-8, 8])
    .onStart((event) => {
      // Only allow dragging if hold completed (1 second)
      if (!dragEnabled.value) {
        return;
      }
      isDragging.value = true;
      frameCounter.value = 0;
      dragAbsoluteX.value = event.absoluteX;
      runOnJS(setDragging)(true);
      scale.value = withSpring(1.2, {
        damping: 20,
        stiffness: 400,
      });
      opacity.value = 0; // Hide original card completely (no shadow)
      if (Platform.OS === 'ios') {
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Heavy);
      }
      // Notify parent to render dragged card at top level
      if (onDragStart) {
        runOnJS(onDragStart)(product, { x: event.absoluteX, y: event.absoluteY });
      }
      // Immediately update position on first drag
      runOnJS(handleDragOver)(event.absoluteX);
      if (onDragUpdate) {
        runOnJS(onDragUpdate)({ x: event.absoluteX, y: event.absoluteY });
      }
    })
    .onUpdate((event) => {
      if (!isDragging.value || !dragEnabled.value) {
        return;
      }
      // Update transform values directly on UI thread - runs at 60fps, very smooth
      // These updates happen on the native thread - no JS bridge overhead
      translateX.value = event.translationX;
      translateY.value = event.translationY;
      
      // Update absolute X position (used by animated reaction for throttled updates)
      dragAbsoluteX.value = event.absoluteX;
      
      // Update drag position for top-level card overlay (throttled via animated reaction)
      // Only update position immediately, category detection is throttled
      if (onDragUpdate) {
        // Update more frequently for smooth overlay movement (every frame is fine for position)
        runOnJS(onDragUpdate)({ x: event.absoluteX, y: event.absoluteY });
      }
    })
    .onEnd(() => {
      if (!isDragging.value) {
        return;
      }
      // Use faster spring config for snappier feel
      translateX.value = withSpring(0, {
        damping: 25,
        stiffness: 500,
      });
      translateY.value = withSpring(0, {
        damping: 25,
        stiffness: 500,
      });
      scale.value = withSpring(1, {
        damping: 20,
        stiffness: 400,
      });
      opacity.value = withSpring(1, {
        damping: 20,
        stiffness: 400,
      });
      isDragging.value = false;
      dragEnabled.value = false;
      runOnJS(setDragging)(false);
      runOnJS(setReadyToDrag)(false);
      if (onDragClear) {
        runOnJS(onDragClear)();
      }
      runOnJS(handleDrop)();
    })
    .onFinalize(() => {
      if (isDragging.value) {
        translateX.value = withSpring(0, {
          damping: 25,
          stiffness: 500,
        });
        translateY.value = withSpring(0, {
          damping: 25,
          stiffness: 500,
        });
        scale.value = withSpring(1, {
          damping: 20,
          stiffness: 400,
        });
        opacity.value = withSpring(1, {
          damping: 20,
          stiffness: 400,
        });
        isDragging.value = false;
        dragEnabled.value = false;
        runOnJS(setDragging)(false);
        runOnJS(setReadyToDrag)(false);
        if (onDragClear) {
          runOnJS(onDragClear)();
        }
      }
    });

  // Combine gestures: long press enables drag, pan handles the actual drag
  const composedGesture = Gesture.Simultaneous(longPressGesture, panGesture);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
      opacity: opacity.value,
      zIndex: isDragging.value || dragEnabled.value ? 9999 : 1,
    };
  });

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View 
        style={[
          animatedStyle,
          (dragging || readyToDrag) && { elevation: 50 },
        ]}>
        <View
          style={[
            styles.productCard,
            dragging && styles.productCardDragging,
            readyToDrag && !dragging && styles.productCardReady,
            isUpdating && styles.productCardUpdating,
            targetCategory && { borderColor: colors.success, borderWidth: 2 },
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}>
          {isUpdating && (
            <View style={styles.updatingIndicator}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          )}
          {dragging && targetCategory && (
            <View style={[styles.dropIndicator, { backgroundColor: colors.success }]}>
              <ThemedText style={styles.dropIndicatorText}>→ {targetCategory}</ThemedText>
            </View>
          )}
          <ThemedText style={[styles.productBarcode, { color: colors.textSecondary }]}>
            {product.barcode}
          </ThemedText>
          <ThemedText style={styles.productDescription} numberOfLines={2}>
            {product.description}
          </ThemedText>
          <View style={styles.productFooter}>
            <ThemedText style={[styles.productMaterial, { color: colors.textSecondary }]}>
              #{product.material}
            </ThemedText>
            {!dragging && !readyToDrag && (
              <ThemedText style={[styles.dragHint, { color: colors.textSecondary }]}>
                Hold 1s to drag
              </ThemedText>
            )}
            {readyToDrag && !dragging && (
              <ThemedText style={[styles.dragHint, { color: colors.primary, fontWeight: 'bold' }]}>
                ✓ Ready
              </ThemedText>
            )}
          </View>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

export default function KanbanScreen() {
  const [products, setProducts] = useState<SavedProduct[]>([]);
  const [categories, setCategories] = useState<string[]>(['Uncategorized']);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [dragTargetCategory, setDragTargetCategory] = useState<string | null>(null);
  const [draggedProduct, setDraggedProduct] = useState<SavedProduct | null>(null);
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);
  const [draggedProductTargetCategory, setDraggedProductTargetCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const boardScrollRef = useRef<ScrollView>(null);
  const columnRefs = useRef<{ [key: string]: View | null }>({});
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentScrollXRef = useRef<number>(0);
  const isScrollingRef = useRef<boolean>(false);
  const lastScrollDirectionRef = useRef<'left' | 'right' | null>(null);
  const lastScrollTimeRef = useRef<number>(0);
  const currentDragXRef = useRef<number>(0);
  const lastScrolledToIndexRef = useRef<number>(-1);

  const fetchCategories = useCallback(async () => {
    try {
      const fetchedCategories = await getAllCategories();
      
      // Ensure "Uncategorized" is always first, then sort the rest by createdAt
      // Since backend already sorts by createdAt, we just need to handle "Uncategorized"
      let sortedCategories: string[] = [];
      
      if (fetchedCategories.includes('Uncategorized')) {
        // Remove "Uncategorized" from the array
        const otherCategories = fetchedCategories.filter(cat => cat !== 'Uncategorized');
        // Put "Uncategorized" first, then the rest (already sorted by createdAt from backend)
        sortedCategories = ['Uncategorized', ...otherCategories];
      } else {
        // If "Uncategorized" doesn't exist, add it first
        sortedCategories = ['Uncategorized', ...fetchedCategories];
      }
      
      setCategories(sortedCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories(['Uncategorized']);
    }
  }, []);

  const fetchProducts = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      const fetchedProducts = await getAllProducts();
      setProducts(fetchedProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      Alert.alert('Error', 'Failed to load products');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchAllData = useCallback(async (showLoader = true) => {
    await Promise.all([fetchCategories(), fetchProducts(showLoader)]);
  }, [fetchCategories, fetchProducts]);

  useFocusEffect(
    useCallback(() => {
      fetchAllData(true);
    }, [fetchAllData])
  );

  // Reset scroll position when search query or selected category changes
  useEffect(() => {
    // Reset scroll to start when filters change
    if (boardScrollRef.current) {
      boardScrollRef.current.scrollTo({ x: 0, animated: true });
      currentScrollXRef.current = 0;
    }
  }, [searchQuery, selectedCategory]);

  // Filter products by search query (material, barcode, description)
  const filterProductsBySearch = useCallback((productList: SavedProduct[], query: string) => {
    if (!query.trim()) {
      return productList;
    }
    
    const lowerQuery = query.toLowerCase().trim();
    return productList.filter((p) => {
      const materialMatch = p.material?.toString().toLowerCase().includes(lowerQuery);
      const barcodeMatch = p.barcode?.toLowerCase().includes(lowerQuery);
      const descriptionMatch = p.description?.toLowerCase().includes(lowerQuery);
      
      return materialMatch || barcodeMatch || descriptionMatch;
    });
  }, []);

  // Get filtered products based on search and category filter
  const getFilteredProducts = useCallback(() => {
    let filteredProducts = products;
    
    // Apply category filter if selected
    if (selectedCategory) {
      filteredProducts = filteredProducts.filter((p) => (p.category || 'Uncategorized') === selectedCategory);
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      filteredProducts = filterProductsBySearch(filteredProducts, searchQuery);
    }
    
    return filteredProducts;
  }, [products, searchQuery, selectedCategory, filterProductsBySearch]);

  // Get filtered categories - only show categories that have matching products
  const getFilteredCategories = useCallback(() => {
    if (!searchQuery.trim() && !selectedCategory) {
      // No filters applied - show all categories
      return categories;
    }
    
    const filteredProducts = getFilteredProducts();
    const categoriesWithProducts = new Set<string>();
    
    // Get unique categories from filtered products
    filteredProducts.forEach((p) => {
      const category = p.category || 'Uncategorized';
      categoriesWithProducts.add(category);
    });
    
    // Return categories in the same order as the original categories array
    // but only include those that have matching products
    return categories.filter((cat) => categoriesWithProducts.has(cat));
  }, [categories, searchQuery, selectedCategory, getFilteredProducts]);

  // Get products by category, filtered by search query and selected category
  const getProductsByCategory = useCallback((category: string) => {
    const filteredProducts = getFilteredProducts();
    
    // Filter by the specific category column
    return filteredProducts
      .filter((p) => (p.category || 'Uncategorized') === category)
      .sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return a.barcode.localeCompare(b.barcode);
      });
  }, [getFilteredProducts]);

  // Get filtered categories for rendering
  const filteredCategories = getFilteredCategories();

  const scrollToCategory = useCallback(
    (categoryIndex: number) => {
      const visibleCategories = getFilteredCategories();
      if (!boardScrollRef.current || categoryIndex < 0 || categoryIndex >= visibleCategories.length) {
        return;
      }

      // Calculate the position to center the category accurately
      const columnSpacing = COLUMN_WIDTH + spacing.sm * 2;
      const boardPadding = spacing.md;
      const screenCenter = SCREEN_WIDTH / 2;
      
      // Calculate column center in content coordinates
      // Column layout: [padding][margin][COLUMN_WIDTH][margin][padding]
      // Column start: boardPadding + categoryIndex * columnSpacing
      // Column center: start + spacing.sm (left margin) + COLUMN_WIDTH/2
      const columnStart = boardPadding + categoryIndex * columnSpacing;
      const columnCenter = columnStart + spacing.sm + COLUMN_WIDTH / 2;
      
      // Scroll position needed to center this column on screen
      // When scrolled, screen center (screenCenter) should align with column center (columnCenter)
      // scrollX + screenCenter = columnCenter
      // Therefore: scrollX = columnCenter - screenCenter
      const targetX = columnCenter - screenCenter;

      // Scroll smoothly to center the category
      // Use animated: true for smooth scrolling
      boardScrollRef.current.scrollTo({
        x: Math.max(0, targetX),
        animated: true,
      });
      
      // Update scroll position ref immediately for more accurate tracking
      // This helps with rapid consecutive scrolls
      currentScrollXRef.current = Math.max(0, targetX);
    },
    [getFilteredCategories]
  );

      // Track the currently centered category index accurately
      // This function determines which category is currently centered on screen
      const getCenteredCategoryIndex = useCallback(() => {
        const scrollX = currentScrollXRef.current;
        const columnSpacing = COLUMN_WIDTH + spacing.sm * 2;
        const boardPadding = spacing.md;
        const screenCenter = SCREEN_WIDTH / 2;
        const visibleCategories = getFilteredCategories();
        
        // Calculate the screen center position in the scrollable content coordinates
        const screenCenterInContent = scrollX + screenCenter;
        
        // Subtract board padding to get position relative to first column
        const relativeCenterX = screenCenterInContent - boardPadding;
        
        // Find which column the center point falls into
        // Each column occupies exactly: [index * columnSpacing, (index + 1) * columnSpacing)
        // Use Math.floor to get the column index (more accurate than Math.round)
        let centeredIndex = Math.floor(relativeCenterX / columnSpacing);
        
        // Clamp to valid range [0, visibleCategories.length - 1]
        centeredIndex = Math.max(0, Math.min(centeredIndex, visibleCategories.length - 1));
        
        return centeredIndex;
      }, [getFilteredCategories]);

  const scrollBasedOnScreenPosition = useCallback(
    (absoluteX: number, currentCategoryIndex: number) => {
      if (!boardScrollRef.current || isScrollingRef.current) {
        // Don't scroll if already scrolling - wait for current scroll to complete
        return;
      }

      const edgeThreshold = SCREEN_WIDTH * 0.1; // 10% of screen width
      const isNearRightEdge = absoluteX > SCREEN_WIDTH - edgeThreshold;
      const isNearLeftEdge = absoluteX < edgeThreshold;

      if (!isNearRightEdge && !isNearLeftEdge) {
        // Not near edges - don't scroll
        return;
      }

      // Get the currently centered category index
      const centeredCategoryIndex = getCenteredCategoryIndex();

      // Determine target category - ALWAYS scroll to immediately adjacent category
      let targetCategoryIndex: number;
      let scrollDirection: 'left' | 'right';

          const visibleCategories = getFilteredCategories();
          
          if (isNearRightEdge) {
            // Scroll right - move to NEXT category (one step forward only)
            const nextIndex = centeredCategoryIndex + 1;
            if (nextIndex >= visibleCategories.length) {
              // Already at last category, can't scroll further
              return;
            }
            targetCategoryIndex = nextIndex;
            scrollDirection = 'right';
          } else if (isNearLeftEdge) {
            // Scroll left - move to PREVIOUS category (one step backward only)
            const prevIndex = centeredCategoryIndex - 1;
            if (prevIndex < 0) {
              // Already at first category, can't scroll further
              return;
            }
            targetCategoryIndex = prevIndex;
            scrollDirection = 'left';
          } else {
            // Not near any edge - shouldn't happen but handle it
            return;
          }

      // Validate target is different from centered category
      if (targetCategoryIndex === centeredCategoryIndex) {
        return;
      }

      // Check if we're already scrolling to this target
      const isAlreadyScrollingToTarget = lastScrolledToIndexRef.current === targetCategoryIndex && isScrollingRef.current;
      if (isAlreadyScrollingToTarget) {
        return;
      }

      // Check time since last scroll
      const now = Date.now();
      const timeSinceLastScroll = now - lastScrollTimeRef.current;
      const minScrollInterval = 500; // 500ms to ensure scroll completes before next

      // Only scroll if enough time has passed since last scroll
      // This is critical to prevent skipping - ensures one scroll finishes before next starts
      if (timeSinceLastScroll >= minScrollInterval) {
        // Mark as scrolling IMMEDIATELY to prevent duplicate scrolls
        isScrollingRef.current = true;
        lastScrollDirectionRef.current = scrollDirection;
        lastScrollTimeRef.current = now;
        lastScrolledToIndexRef.current = targetCategoryIndex;
        
        // Scroll to target category (exactly one category at a time)
        scrollToCategory(targetCategoryIndex);
        
        // Reset scrolling flag after scroll animation completes
        // Scroll animation typically takes 300-400ms, wait 500ms to be safe
        setTimeout(() => {
          isScrollingRef.current = false;
          // Note: scroll position ref is already updated in scrollToCategory
        }, 500);
      }
    },
    [scrollToCategory, getCenteredCategoryIndex, getFilteredCategories]
  );

  const handleDragOverColumn = useCallback(
    (absoluteX: number, currentIndex: number): string | null => {
      // DIRECT COLUMN DETECTION: Find which column the card is visually over on screen
      const scrollX = currentScrollXRef.current;
      const columnSpacing = COLUMN_WIDTH + spacing.sm * 2; // Total space per column
      const boardPadding = spacing.md; // Padding on board content
      const screenCenter = SCREEN_WIDTH / 2;
      
      // Calculate where each column is positioned on screen
      let closestColumnIndex = -1;
      let minDistance = Infinity;
      let cardIsOverColumnCenter = false;
      
      // OPTIMIZED: Pre-calculate constants and use early exit
      const centerTolerance = SCREEN_WIDTH * 0.15;
      const tolerance = COLUMN_WIDTH * 0.5;
      const filteredCats = getFilteredCategories();
      
      // Optimized loop - break immediately when match found
      for (let i = 0; i < filteredCats.length; i++) {
        const columnStartOnScreen = boardPadding + i * columnSpacing - scrollX;
        const columnEndOnScreen = columnStartOnScreen + columnSpacing;
        const columnCenterOnScreen = columnStartOnScreen + columnSpacing / 2;
        
        // Quick bounds check first (most common case)
        if (absoluteX >= (columnStartOnScreen - tolerance) && 
            absoluteX <= (columnEndOnScreen + tolerance)) {
          closestColumnIndex = i;
          if (Math.abs(absoluteX - columnCenterOnScreen) <= centerTolerance) {
            cardIsOverColumnCenter = true;
          }
          break; // Early exit
        }
        
        // Fallback: track closest (only if no match)
        if (closestColumnIndex === -1) {
          const distance = Math.abs(absoluteX - columnCenterOnScreen);
          if (distance < minDistance) {
            minDistance = distance;
            closestColumnIndex = i;
          }
        }
      }
      
      // Handle auto-scroll when near edges - ALWAYS check, but reset state when centered
      const edgeThreshold = SCREEN_WIDTH * 0.1;
      const isNearRightEdge = absoluteX > SCREEN_WIDTH - edgeThreshold;
      const isNearLeftEdge = absoluteX < edgeThreshold;
      const isNearEdge = isNearRightEdge || isNearLeftEdge;
      
      // RESET SCROLL STATE when card is centered over a category AND not near edge
      // This allows auto-scroll to work again when card moves to edges
      if (cardIsOverColumnCenter && !isNearEdge) {
        // Reset scroll state when centered AND not near edge
        // This allows fresh scroll when card moves from center to edge
        // BUT: Don't reset if we're currently scrolling (let it complete)
        if (!isScrollingRef.current) {
          lastScrollDirectionRef.current = null;
          lastScrollTimeRef.current = 0;
          lastScrolledToIndexRef.current = -1; // Reset last scrolled target
        }
        // Clear any pending scroll timeouts
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
          scrollTimeoutRef.current = null;
        }
      }
      
      // Check for auto-scroll when near edges - throttled to reduce calls
      // Only scroll if not already scrolling and card is at edge
      if (isNearEdge && !isScrollingRef.current) {
        // Try to scroll - will only scroll if conditions are met
        scrollBasedOnScreenPosition(absoluteX, currentIndex);
        
        // Set up continuous scroll checking with throttling
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
        
        // Check again after scroll interval - but less frequently for better performance
        scrollTimeoutRef.current = setTimeout(() => {
          if (!isScrollingRef.current) {
            const latestDragX = currentDragXRef.current;
            const stillNearRight = latestDragX > SCREEN_WIDTH - edgeThreshold;
            const stillNearLeft = latestDragX < edgeThreshold;
            
            if (stillNearRight || stillNearLeft) {
              scrollBasedOnScreenPosition(latestDragX, currentIndex);
            }
          }
        }, 550);
      } else {
        // Not near edges - clear timeout
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
          scrollTimeoutRef.current = null;
        }
      }
      
      // Ensure we have a valid column index
      const filteredCatsForDrag = getFilteredCategories();
      if (closestColumnIndex < 0 || closestColumnIndex >= filteredCatsForDrag.length) {
        setDragTargetCategory(null);
        setDraggedProductTargetCategory(null);
        return null;
      }
      
      // Get the target category
      const targetCategory = filteredCatsForDrag[closestColumnIndex];
      
      // Find the current category - need to get it from the visible categories based on currentIndex
      // currentIndex refers to the index in the filtered categories list
      let currentCategory: string | null = null;
      if (currentIndex >= 0 && currentIndex < filteredCatsForDrag.length) {
        currentCategory = filteredCatsForDrag[currentIndex];
      }
      
      // Only detect if it's a different category from the source
      if (targetCategory && currentCategory && targetCategory !== currentCategory) {
        setDragTargetCategory(targetCategory);
        setDraggedProductTargetCategory(targetCategory);
        return targetCategory;
      }
      
      // Same category or invalid
      setDragTargetCategory(null);
      setDraggedProductTargetCategory(null);
      return null;
    },
    [scrollBasedOnScreenPosition, getFilteredCategories]
  );

  const handleDragEnd = useCallback(() => {
    setDragTargetCategory(null);
    setDraggedProduct(null);
    setDragPosition(null);
    setDraggedProductTargetCategory(null);
    lastScrollDirectionRef.current = null;
    isScrollingRef.current = false;
    lastScrollTimeRef.current = 0;
    lastScrolledToIndexRef.current = -1;
    currentDragXRef.current = 0;
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = null;
    }
  }, []);

  const handleDragStart = useCallback((product: SavedProduct, position: { x: number; y: number }) => {
    setDraggedProduct(product);
    setDragPosition(position);
  }, []);

  const handleDragUpdate = useCallback((position: { x: number; y: number }) => {
    setDragPosition(position);
    currentDragXRef.current = position.x; // Store current drag X position for scroll checking
  }, []);

  const handleDragClear = useCallback(() => {
    setDraggedProduct(null);
    setDragPosition(null);
    setDraggedProductTargetCategory(null);
  }, []);

  const handleProductDrop = async (product: SavedProduct, newCategory: string) => {
    // Normalize category names - handle null/undefined as 'Uncategorized'
    const currentCategory = product.category || 'Uncategorized';
    const targetCategory = newCategory || 'Uncategorized';
    
    // If categories are the same, no need to update
    if (currentCategory === targetCategory) {
      handleDragEnd();
      return;
    }

    try {
      setUpdating(product._id || null);
      if (!product._id) {
        Alert.alert('Error', 'Product ID is missing');
        handleDragEnd();
        return;
      }

      console.log('Moving product to category:', {
        productId: product._id,
        from: currentCategory,
        to: targetCategory,
      });

      // Update product category (backend handles 'Uncategorized' normalization)
      await updateProductCategory(product._id, targetCategory);
      setProducts((prev) =>
        prev.map((p) => (p._id === product._id ? { ...p, category: targetCategory } : p))
      );
      await fetchCategories();
      handleDragEnd();
    } catch (error) {
      console.error('Error updating product category:', error);
      Alert.alert('Error', 'Failed to update product category');
      fetchProducts(false);
      handleDragEnd();
    } finally {
      setUpdating(null);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      Alert.alert('Error', 'Category name cannot be empty');
      return;
    }

    if (categories.includes(newCategoryName.trim())) {
      Alert.alert('Error', 'Category already exists');
      return;
    }

    try {
      await createCategory(newCategoryName.trim());
      await fetchCategories();
      setNewCategoryName('');
      setShowAddCategory(false);
    } catch (error) {
      console.error('Error creating category:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create category');
    }
  };

  const handleDeleteCategory = async (category: string) => {
    if (category === 'Uncategorized') {
      Alert.alert('Error', 'Cannot delete Uncategorized category');
      return;
    }

    const productsInCategory = getProductsByCategory(category);
    if (productsInCategory.length > 0) {
      Alert.alert(
        'Cannot Delete',
        `Move all ${productsInCategory.length} product(s) from "${category}" to another category before deleting.`,
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert('Delete Category', `Are you sure you want to delete "${category}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteCategory(category);
            await fetchCategories();
          } catch (error) {
            console.error('Error deleting category:', error);
            Alert.alert('Error', error instanceof Error ? error.message : 'Failed to delete category');
          }
        },
      },
    ]);
  };

  const renderCategoryColumn = (category: string) => {
    const categoryProducts = getProductsByCategory(category);
    const isUncategorized = category === 'Uncategorized';
    const isDragTarget = dragTargetCategory === category;

    return (
      <View
        key={category}
        ref={(ref) => {
          columnRefs.current[category] = ref;
        }}
        style={[
          styles.column,
          isDragTarget && { borderColor: colors.success, backgroundColor: colors.success + '10' },
          { backgroundColor: colors.backgroundSecondary, borderColor: colors.border },
        ]}
        onLayout={() => {
          // Layout measurement handled by drag detection
        }}>
        <View
          style={[
            styles.columnHeader,
            { borderBottomColor: colors.primary, backgroundColor: colors.card },
          ]}>
          <View style={styles.columnHeaderLeft}>
            <View style={[styles.categoryIndicator, { backgroundColor: colors.primary }]} />
            <View style={styles.columnHeaderText}>
              <ThemedText style={styles.columnTitle}>{category}</ThemedText>
              <ThemedText style={[styles.columnCount, { color: colors.textSecondary }]}>
                {categoryProducts.length} {categoryProducts.length === 1 ? 'item' : 'items'}
              </ThemedText>
            </View>
          </View>
          {!isUncategorized && (
            <TouchableOpacity
              onPress={() => handleDeleteCategory(category)}
              style={[styles.deleteButton, { backgroundColor: colors.error }]}>
              <ThemedText style={styles.deleteButtonText}>×</ThemedText>
            </TouchableOpacity>
          )}
        </View>

        <GestureScrollView
          style={styles.columnContent}
          contentContainerStyle={styles.columnContentContainer}
          nestedScrollEnabled={true}
          showsVerticalScrollIndicator={true}
          scrollEnabled={true}
          bounces={true}
          scrollEventThrottle={16}>
          {categoryProducts.length === 0 ? (
            <View style={styles.emptyColumn}>
              <ThemedText style={[styles.emptyColumnText, { color: colors.textSecondary }]}>
                No products
              </ThemedText>
              <ThemedText style={[styles.emptyColumnHint, { color: colors.textSecondary }]}>
                Drag products here
              </ThemedText>
            </View>
          ) : (
            categoryProducts.map((item) => (
              <DraggableProduct
                key={item._id || item.barcode}
                product={item}
                onDrop={handleProductDrop}
                updating={updating}
                colorScheme={colorScheme}
                categories={filteredCategories}
                categoryIndex={filteredCategories.indexOf(category)}
                currentCategory={category}
                columnWidth={COLUMN_WIDTH}
                onDragOverColumn={handleDragOverColumn}
                onDragEnd={handleDragEnd}
                onDragStart={handleDragStart}
                onDragUpdate={handleDragUpdate}
                onDragClear={handleDragClear}
              />
            ))
          )}
        </GestureScrollView>
      </View>
    );
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <Header />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <ThemedText style={styles.loadingText}>Loading products...</ThemedText>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <Header />
          <View style={[styles.boardHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
            <View style={styles.headerTop}>
              <View style={styles.headerLeft}>
                <ThemedText type="title" style={styles.title}>
                  Kanban Board
                </ThemedText>
              </View>
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: colors.primary }]}
                onPress={() => setShowAddCategory(true)}>
                <ThemedText style={styles.addButtonText}>+ Category</ThemedText>
              </TouchableOpacity>
            </View>
            
            {/* Search and Category Filter */}
            <View style={styles.filterContainer}>
              <View style={[styles.searchContainer, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
                <MaterialIcons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
                <TextInput
                  style={[styles.searchInput, { color: colors.text }]}
                  placeholder="Search by barcode, material, or description..."
                  placeholderTextColor={colors.textSecondary}
                  value={searchQuery}
                  onChangeText={(text) => {
                    setSearchQuery(text);
                    // Scroll will be reset by useEffect, but we can also do it immediately for better UX
                    if (boardScrollRef.current) {
                      boardScrollRef.current.scrollTo({ x: 0, animated: true });
                      currentScrollXRef.current = 0;
                    }
                  }}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity 
                    onPress={() => {
                      setSearchQuery('');
                      // Scroll will be reset by useEffect
                    }} 
                    style={styles.clearButton}>
                    <MaterialIcons name="close" size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>
              
              <View style={styles.dropdownContainer}>
                <TouchableOpacity
                  style={[styles.categoryDropdown, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
                  onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}>
                  <MaterialIcons name="filter-list" size={20} color={colors.text} style={styles.dropdownIcon} />
                  <ThemedText style={[styles.dropdownText, { color: colors.text }]}>
                    {selectedCategory || 'All Categories'}
                  </ThemedText>
                  <MaterialIcons 
                    name={showCategoryDropdown ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} 
                    size={24} 
                    color={colors.text} 
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <ScrollView
            ref={boardScrollRef}
            horizontal
            style={styles.board}
            contentContainerStyle={styles.boardContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => fetchAllData(false)} />
            }
            showsHorizontalScrollIndicator={false}
            onScroll={(event) => {
              currentScrollXRef.current = event.nativeEvent.contentOffset.x;
            }}
            scrollEventThrottle={16}>
            {getFilteredCategories().map((category) => renderCategoryColumn(category))}
          </ScrollView>
        </SafeAreaView>

        {/* Category Dropdown Modal - Rendered at top level to appear above everything */}
        <Modal
          visible={showCategoryDropdown}
          transparent
          animationType="fade"
          onRequestClose={() => setShowCategoryDropdown(false)}>
          <View style={styles.dropdownModalOverlay}>
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={() => setShowCategoryDropdown(false)}
            />
            <View style={styles.dropdownModalContainer} pointerEvents="box-none">
              <View style={[styles.dropdownMenu, { backgroundColor: colors.card, borderColor: colors.border, ...shadows.xl }]}>
                <View style={styles.dropdownHeader}>
                  <ThemedText type="title" style={[styles.dropdownHeaderText, { color: colors.text }]}>
                    Select Category
                  </ThemedText>
                  <TouchableOpacity onPress={() => setShowCategoryDropdown(false)}>
                    <MaterialIcons name="close" size={24} color={colors.text} />
                  </TouchableOpacity>
                </View>
                <ScrollView 
                  style={styles.dropdownScrollView} 
                  nestedScrollEnabled
                  showsVerticalScrollIndicator={true}>
                  <TouchableOpacity
                    style={[styles.dropdownItem, selectedCategory === null && { backgroundColor: colors.primary + '20' }]}
                    onPress={() => {
                      setSelectedCategory(null);
                      setShowCategoryDropdown(false);
                      // Scroll will be reset by useEffect
                    }}>
                    <ThemedText style={[styles.dropdownItemText, { color: colors.text }]}>
                      All Categories
                    </ThemedText>
                    {selectedCategory === null && (
                      <MaterialIcons name="check" size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                  {categories.map((category) => (
                    <TouchableOpacity
                      key={category}
                      style={[styles.dropdownItem, selectedCategory === category && { backgroundColor: colors.primary + '20' }]}
                      onPress={() => {
                        setSelectedCategory(category);
                        setShowCategoryDropdown(false);
                        // Scroll will be reset by useEffect
                      }}>
                      <ThemedText style={[styles.dropdownItemText, { color: colors.text }]}>
                        {category}
                      </ThemedText>
                      {selectedCategory === category && (
                        <MaterialIcons name="check" size={20} color={colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </View>
        </Modal>

        {/* Render dragged card at top level when dragging - outside SafeAreaView for proper positioning */}
        {draggedProduct && dragPosition && (
          <View
            style={[
              styles.draggedCardOverlay,
              {
                left: dragPosition.x - (COLUMN_WIDTH - spacing.md * 2) / 2,
                top: dragPosition.y - 80, // Offset to center on finger
              },
            ]}
            pointerEvents="none">
            <View
              style={[
                styles.productCard,
                styles.productCardDragging,
                draggedProductTargetCategory && { borderColor: colors.success, borderWidth: 2 },
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}>
              {draggedProductTargetCategory && (
                <View style={[styles.dropIndicator, { backgroundColor: colors.success }]}>
                  <ThemedText style={styles.dropIndicatorText}>→ {draggedProductTargetCategory}</ThemedText>
                </View>
              )}
              <ThemedText style={[styles.productBarcode, { color: colors.textSecondary }]}>
                {draggedProduct.barcode}
              </ThemedText>
              <ThemedText style={styles.productDescription} numberOfLines={2}>
                {draggedProduct.description}
              </ThemedText>
              <View style={styles.productFooter}>
                <ThemedText style={[styles.productMaterial, { color: colors.textSecondary }]}>
                  #{draggedProduct.material}
                </ThemedText>
              </View>
            </View>
          </View>
        )}

        <Modal
          visible={showAddCategory}
          animationType="slide"
          transparent
          onRequestClose={() => setShowAddCategory(false)}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContainer}>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <ThemedText type="title" style={styles.modalTitle}>
                Add New Category
              </ThemedText>
              <TextInput
                style={[
                  styles.modalInput,
                  {
                    backgroundColor: colors.backgroundSecondary,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="Category name"
                placeholderTextColor={colors.textSecondary}
                value={newCategoryName}
                onChangeText={setNewCategoryName}
                autoFocus
                onSubmitEditing={handleAddCategory}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton, { backgroundColor: colors.backgroundSecondary }]}
                  onPress={() => {
                    setShowAddCategory(false);
                    setNewCategoryName('');
                  }}>
                  <ThemedText style={[styles.modalButtonText, { color: colors.text }]}>Cancel</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton, { backgroundColor: colors.primary }]}
                  onPress={handleAddCategory}>
                  <ThemedText style={[styles.modalButtonText, styles.saveButtonText]}>Add</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </ThemedView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: responsiveFontSize(14),
  },
  boardHeader: {
    padding: spacing.md,
    borderBottomWidth: 1,
    ...shadows.sm,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: responsiveFontSize(22),
    fontWeight: 'bold',
  },
  addButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: responsiveFontSize(14),
  },
  filterContainer: {
    gap: spacing.sm,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: responsiveFontSize(14),
    padding: 0,
  },
  clearButton: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
  },
  dropdownContainer: {
    position: 'relative',
  },
  categoryDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    justifyContent: 'space-between',
  },
  dropdownIcon: {
    marginRight: spacing.sm,
  },
  dropdownText: {
    flex: 1,
    fontSize: responsiveFontSize(14),
    fontWeight: '500',
  },
  dropdownModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    paddingTop: Platform.OS === 'ios' ? 100 : 80,
  },
  dropdownModalContainer: {
    paddingHorizontal: spacing.md,
  },
  dropdownMenu: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    maxHeight: SCREEN_HEIGHT * 0.6,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  dropdownHeaderText: {
    fontSize: responsiveFontSize(18),
    fontWeight: 'bold',
  },
  dropdownScrollView: {
    maxHeight: SCREEN_HEIGHT * 0.5,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  dropdownItemText: {
    fontSize: responsiveFontSize(16),
    flex: 1,
  },
  board: {
    flex: 1,
  },
  boardContent: {
    padding: spacing.md,
  },
  column: {
    width: COLUMN_WIDTH,
    marginHorizontal: spacing.sm,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    borderWidth: 1,
    ...shadows.sm,
    flexShrink: 0,
    height: SCREEN_HEIGHT * 0.68,
  },
  columnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 2,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    flexShrink: 0,
    zIndex: 10,
    elevation: 5,
  },
  columnHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIndicator: {
    width: 4,
    height: 24,
    borderRadius: borderRadius.sm,
    marginRight: spacing.sm,
  },
  columnHeaderText: {
    flex: 1,
  },
  columnTitle: {
    fontSize: responsiveFontSize(16),
    fontWeight: 'bold',
    marginBottom: spacing.xs / 2,
  },
  columnCount: {
    fontSize: responsiveFontSize(12),
  },
  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 20,
  },
  columnContent: {
    flex: 1,
    minHeight: 0,
  },
  columnContentContainer: {
    paddingBottom: spacing.md,
    flexGrow: 1,
  },
  emptyColumn: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  emptyColumnText: {
    fontSize: responsiveFontSize(14),
    marginBottom: spacing.xs,
  },
  emptyColumnHint: {
    fontSize: responsiveFontSize(12),
    fontStyle: 'italic',
    opacity: 0.6,
  },
  productCard: {
    padding: spacing.md,
    marginVertical: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    ...shadows.sm,
  },
  productCardReady: {
    ...shadows.lg,
    borderWidth: 2,
    borderColor: '#00A859',
    elevation: 15,
  },
  productCardDragging: {
    ...shadows.xl,
    borderWidth: 2,
    elevation: 50,
    zIndex: 9999,
  },
  draggedCardOverlay: {
    position: 'absolute',
    width: COLUMN_WIDTH - spacing.md * 2,
    zIndex: 10000,
    elevation: 100,
    pointerEvents: 'none',
  },
  productCardUpdating: {
    opacity: 0.6,
  },
  updatingIndicator: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
  },
  dropIndicator: {
    position: 'absolute',
    top: -32,
    left: 0,
    right: 0,
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    ...shadows.md,
  },
  dropIndicatorText: {
    color: '#FFFFFF',
    fontSize: responsiveFontSize(12),
    fontWeight: 'bold',
  },
  productBarcode: {
    fontSize: responsiveFontSize(11),
    fontWeight: '600',
    marginBottom: spacing.xs,
    letterSpacing: 0.5,
  },
  productDescription: {
    fontSize: responsiveFontSize(14),
    marginBottom: spacing.sm,
    fontWeight: '500',
    lineHeight: 20,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  productMaterial: {
    fontSize: responsiveFontSize(11),
  },
  dragHint: {
    fontSize: responsiveFontSize(10),
    fontStyle: 'italic',
    opacity: 0.5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    width: responsiveWidth(85),
    maxWidth: 400,
    ...shadows.xl,
  },
  modalTitle: {
    marginBottom: spacing.lg,
    textAlign: 'center',
    fontSize: responsiveFontSize(20),
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: responsiveFontSize(16),
    marginBottom: spacing.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
  },
  modalButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    minWidth: responsiveWidth(25),
    alignItems: 'center',
  },
  cancelButton: {
    ...shadows.sm,
  },
  saveButton: {
    ...shadows.sm,
  },
  modalButtonText: {
    fontSize: responsiveFontSize(16),
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#FFFFFF',
  },
});
