import React, { useEffect, useRef } from 'react';
import {
  View,
  Image,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
  Easing,
} from 'react-native';

const { width } = Dimensions.get('window');

const LOGO = require('../../assets/splash-icon.png');

interface SplashScreenProps {
  onFinish?: () => void;
  minDuration?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onFinish,
  minDuration = 2200,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 7,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Progress bar
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: minDuration,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start();

    // Complete after duration
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        if (onFinish) onFinish();
      });
    }, minDuration);

    return () => clearTimeout(timer);
  }, [minDuration, onFinish]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <Animated.View style={[styles.contentWrapper, { transform: [{ scale: scaleAnim }] }]}>
        <Image source={LOGO} style={styles.logo} resizeMode="contain" />

        <View style={styles.textContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.titleMain}>HAIRLINES</Text>
            <View style={styles.customerTag}>
              <Text style={styles.customerTagText}>CUSTOMER</Text>
            </View>
          </View>

          <Text style={styles.subtitle}>
            On-Demand Barber & Beauty Services
          </Text>
        </View>
      </Animated.View>

      {/* Gold progress bar at bottom */}
      <View style={styles.progressBarContainer}>
        <Animated.View style={[styles.progressBarFill, { width: progressWidth }]} />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: width * 0.52,
    height: width * 0.44,
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  titleMain: {
    fontSize: 26,
    fontWeight: '800',
    color: '#222D63',
    letterSpacing: 3,
  },
  customerTag: {
    marginLeft: 8,
    backgroundColor: '#222D63',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  customerTagText: {
    color: '#E5B652',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    fontWeight: '500',
    letterSpacing: 0.4,
  },
  progressBarContainer: {
    position: 'absolute',
    bottom: 48,
    width: 120,
    height: 3,
    backgroundColor: 'rgba(34, 45, 99, 0.12)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#E5B652',
    borderRadius: 2,
  },
});
