import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
  Easing,
} from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

interface SplashScreenProps {
  onFinish?: () => void;
  minDuration?: number;
}

export function SplashScreen({ onFinish, minDuration = 2200 }: SplashScreenProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const logoPulse = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const textFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Entrance animation (fade & scale)
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Delayed text entrance
    Animated.timing(textFadeAnim, {
      toValue: 1,
      duration: 600,
      delay: 350,
      useNativeDriver: true,
    }).start();

    // 3. Progress bar animation
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: minDuration,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start();

    // 4. Subtle continuous pulsing effect on logo badge
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(logoPulse, {
          toValue: 1.06,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(logoPulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    // 5. Sparkle continuous rotation
    const rotateLoop = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    rotateLoop.start();

    // 6. Complete after duration
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }).start(() => {
        if (onFinish) onFinish();
      });
    }, minDuration);

    return () => {
      clearTimeout(timer);
      pulseLoop.stop();
      rotateLoop.stop();
    };
  }, [minDuration, onFinish]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {/* Ambient background glows */}
      <View style={styles.ambientGlowTop} />
      <View style={styles.ambientGlowBottom} />

      <Animated.View
        style={[
          styles.contentWrapper,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Logo Card with Pulse */}
        <Animated.View
          style={[
            styles.logoOuterGlow,
            {
              transform: [{ scale: logoPulse }],
            },
          ]}
        >
          <View style={styles.logoBadge}>
            <MaterialCommunityIcons name="content-cut" size={50} color="#FFFFFF" />
            <Animated.View
              style={[
                styles.sparkleBadge,
                {
                  transform: [{ rotate: spin }],
                },
              ]}
            >
              <Ionicons name="sparkles" size={18} color="#E5B652" />
            </Animated.View>
          </View>
        </Animated.View>

        {/* Text Section */}
        <Animated.View
          style={[
            styles.textSection,
            {
              opacity: textFadeAnim,
            },
          ]}
        >
          <View style={styles.titleRow}>
            <Text style={styles.titleMain}>HAIRLINES</Text>
            <View style={styles.proTag}>
              <Text style={styles.proTagText}>PRO</Text>
            </View>
          </View>

          <Text style={styles.subtitle}>
            Professional Grooming & Beauty Partner
          </Text>
        </Animated.View>

        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <Animated.View style={[styles.progressBarFill, { width: progressWidth }]} />
        </View>
      </Animated.View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerPill}>
          <Ionicons name="shield-checkmark" size={13} color="#E5B652" style={{ marginRight: 6 }} />
          <Text style={styles.footerText}>Secure Professional Network</Text>
        </View>
        <Text style={styles.versionText}>v1.0.10</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  ambientGlowTop: {
    position: "absolute",
    top: -height * 0.15,
    right: -width * 0.2,
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: (width * 0.9) / 2,
    backgroundColor: "rgba(34, 45, 99, 0.45)",
  },
  ambientGlowBottom: {
    position: "absolute",
    bottom: -height * 0.15,
    left: -width * 0.2,
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: (width * 0.9) / 2,
    backgroundColor: "rgba(229, 182, 82, 0.12)",
  },
  contentWrapper: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  logoOuterGlow: {
    width: 124,
    height: 124,
    borderRadius: 62,
    backgroundColor: "rgba(34, 45, 99, 0.6)",
    borderWidth: 2,
    borderColor: "rgba(229, 182, 82, 0.35)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
    shadowColor: "#E5B652",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  logoBadge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#222D63",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.2)",
    position: "relative",
  },
  sparkleBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#1E293B",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5B652",
  },
  textSection: {
    alignItems: "center",
    marginBottom: 36,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  titleMain: {
    fontSize: 32,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 4,
  },
  proTag: {
    marginLeft: 8,
    backgroundColor: "#E5B652",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  proTagText: {
    color: "#0F172A",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    color: "#94A3B8",
    textAlign: "center",
    fontWeight: "500",
    letterSpacing: 0.4,
  },
  progressBarContainer: {
    width: 140,
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#E5B652",
    borderRadius: 2,
  },
  footer: {
    position: "absolute",
    bottom: 36,
    alignItems: "center",
  },
  footerPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    marginBottom: 8,
  },
  footerText: {
    color: "#CBD5E1",
    fontSize: 12,
    fontWeight: "600",
  },
  versionText: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "500",
  },
});
