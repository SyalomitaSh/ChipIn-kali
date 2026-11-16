
import { useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';

import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

type OnboardingSlide = {
  image: number;
  title: string;
  description: string;
};

const onboardingData: OnboardingSlide[] = [
  {
    image: require('../../assets/images/onboarding/onboarding-1.png'),
    title: 'Auto-Scan Receipts',
    description:
      'Snap a photo of your receipt and let the system automatically extract menu items, prices, taxes, and discounts.',
  },
  {
    image: require('../../assets/images/onboarding/onboarding-2.png'),
    title: 'Pay Only What You Order',
    description:
      'Assign items individually, split any shared dishes fairly, and calculate taxes and discounts proportionally.',
  },
  {
    image: require('../../assets/images/onboarding/onboarding-3.png'),
    title: 'Track Payments & Minimize Transfers',
    description:
      'Monitor real-time payment status and settle group debts with the fewest transactions possible.',
  },
];

export default function OnboardingScreen() {
  const [currentPage, setCurrentPage] = useState(0);

  const router = useRouter();
  const { width, height } = useWindowDimensions();

  const flatListRef = useRef<FlatList<OnboardingSlide>>(null);

  const isLastPage = currentPage === onboardingData.length - 1;

  // Navigate to the next onboarding page
  const handleNext = () => {
    if (isLastPage) {
      router.replace('/(tabs)');
      return;
    }

    flatListRef.current?.scrollToIndex({
      index: currentPage + 1,
      animated: true,
    });
  };

  // Skip onboarding
  const handleSkip = () => {
    router.replace('/(tabs)');
  };

  // Update pagination when the user swipes
  const handleScrollEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const pageIndex = Math.round(offsetX / width);

    setCurrentPage(pageIndex);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Skip Button */}
      <View style={styles.header}>
        <Pressable onPress={handleSkip} hitSlop={10}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>

      {/* Horizontal Onboarding Pages */}
      <FlatList
        ref={flatListRef}
        data={onboardingData}
        keyExtractor={(_, index) => index.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onMomentumScrollEnd={handleScrollEnd}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
        renderItem={({ item }) => (
          <View style={[styles.page, { width }]}>
            {/* Illustration */}
            <View style={styles.illustrationContainer}>
              <Image
                source={item.image}
                style={{
                  width: width * 0.95,
                  height: Math.min(height * 0.43, 360),
                }}
                resizeMode="contain"
              />
            </View>

            {/* Content */}
            <View style={styles.content}>
              <Text style={styles.title}>
                {item.title}
              </Text>

              <Text style={styles.description}>
                {item.description}
              </Text>
            </View>
          </View>
        )}
      />

      {/* Pagination */}
      <View style={styles.pagination}>
        {onboardingData.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              currentPage === index && styles.activeDot,
            ]}
          />
        ))}
      </View>

      {/* Next Button */}
      <View style={styles.footer}>
        <Pressable
          style={styles.nextButton}
          onPress={handleNext}
        >
          <Text style={styles.nextButtonText}>
            {isLastPage ? 'Get Started' : 'Next'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  header: {
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 10,
  },

  skipText: {
    fontSize: 14,
    color: '#888888',
  },

  page: {
    flex: 1,
    paddingHorizontal: 20,
  },

  illustrationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  content: {
    alignItems: 'center',
    paddingHorizontal: 10,
  },

  title: {
    fontSize: 23,
    fontWeight: 'bold',
    color: '#111111',
    textAlign: 'center',
    marginBottom: 10,
  },

  description: {
    fontSize: 14,
    color: '#555555',
    textAlign: 'center',
    lineHeight: 20,
  },

  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
    marginBottom: 18,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D5D5D5',
  },

  activeDot: {
    backgroundColor: '#777777',
  },

  footer: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },

  nextButton: {
    backgroundColor: '#245078',
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: 'center',
  },

  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
