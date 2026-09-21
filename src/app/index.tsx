import React from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as WebBrowser from "expo-web-browser";
import { useAuth, useSSO, useUser } from "@clerk/expo";
import { AppleIcon, GoogleIcon } from "@/components/auth/AuthIcons";

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const { isSignedIn, signOut } = useAuth();
  const { user } = useUser();
  const { startSSOFlow } = useSSO();
  const [loadingProvider, setLoadingProvider] = React.useState<
    "google" | "apple" | null
  >(null);

  // Warm up the browser on native platforms to reduce initial launch latency
  React.useEffect(() => {
    if (Platform.OS !== "web") {
      void WebBrowser.warmUpAsync();
      return () => {
        void WebBrowser.coolDownAsync();
      };
    }
  }, []);

  const handleGoogleSignIn = React.useCallback(async () => {
    try {
      setLoadingProvider("google");
      const { createdSessionId, setActive, signUp } = await startSSOFlow({
        strategy: "oauth_google",
      });

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
      } else if (signUp?.status === "missing_requirements") {
        console.log("Clerk missing requirements:", signUp);
      }
    } catch (err: any) {
      console.error("Google sign-in error:", JSON.stringify(err, null, 2));
    } finally {
      setLoadingProvider(null);
    }
  }, [startSSOFlow]);

  const handleAppleSignIn = React.useCallback(async () => {
    try {
      setLoadingProvider("apple");
      const { createdSessionId, setActive, signUp } = await startSSOFlow({
        strategy: "oauth_apple",
      });

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
      } else if (signUp?.status === "missing_requirements") {
        console.log("Clerk missing requirements:", signUp);
      }
    } catch (err: any) {
      console.error("Apple sign-in error:", JSON.stringify(err, null, 2));
    } finally {
      setLoadingProvider(null);
    }
  }, [startSSOFlow]);

  return (
    <View className="flex-1 bg-black" style={styles.container}>
      <StatusBar style="light" />

      {/* Fullscreen Tropical Resort Background */}
      <Image
        source={require("@/assets/images/auth-bg.png")}
        contentFit="cover"
        style={styles.backgroundImage}
        priority="high"
      />

      {/* Dark overlay across background for enhanced contrast */}
      <View style={styles.darkOverlay} />

      {/* Realistic Water Gradient Overlay matching design */}
      <LinearGradient
        colors={[
          "transparent",
          "rgba(0, 48, 76, 0.08)",
          "rgba(0, 40, 64, 0.44)",
          "rgba(0, 24, 40, 0.8)",
          "rgba(0, 16, 28, 0.96)",
        ]}
        locations={[0.35, 0.48, 0.65, 0.83, 1.0]}
        style={styles.gradientOverlay}
      />

      {/* Main Content Area */}
      <View
        className="flex-1 justify-end px-7"
        style={[
          styles.contentWrapper,
          {
            paddingBottom: Math.max(insets.bottom, 20) + 14,
          },
        ]}
      >
        {/* Headline */}
        <View className="items-center mb-8" style={styles.headerArea}>
          <Text
            className="text-white text-center font-bold text-[32px] leading-[38px] tracking-tight"
            style={styles.titleLine1}
          >
            Your next
          </Text>
          <Text
            className="text-white text-center font-bold text-[32px] leading-[38px] tracking-tight"
            style={styles.titleLine2}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            adventure starts here
          </Text>
        </View>

        {/* Auth Action Buttons or Active Signed-In Card */}
        {isSignedIn ? (
          <View
            className="w-full items-center py-5 px-5 rounded-3xl bg-white/15 border border-white/25"
            style={styles.signedInContainer}
          >
            <Text className="text-white/80 text-xs font-semibold uppercase tracking-wider mb-1">
              Signed in as
            </Text>
            <Text className="text-white text-lg font-bold text-center mb-4">
              {user?.fullName ??
                user?.primaryEmailAddress?.emailAddress ??
                "Traveler"}
            </Text>
            <Pressable
              onPress={() => signOut()}
              className="w-full h-[50px] rounded-full bg-white/20 border border-white/40 items-center justify-center active:opacity-80"
              accessibilityRole="button"
              accessibilityLabel="Sign Out"
            >
              <Text className="text-white font-semibold text-[15px]">
                Sign Out
              </Text>
            </Pressable>
          </View>
        ) : (
          <View className="w-full gap-3.5" style={styles.buttonContainer}>
            {/* Continue with Google */}
            <Pressable
              onPress={handleGoogleSignIn}
              disabled={loadingProvider !== null}
              className="flex-row items-center justify-center w-full h-[54px] rounded-full bg-white active:opacity-90"
              style={[
                styles.whiteButton,
                loadingProvider !== null && { opacity: 0.8 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Continue with Google"
            >
              {loadingProvider === "google" ? (
                <ActivityIndicator size="small" color="#111827" />
              ) : (
                <>
                  <GoogleIcon size={20} />
                  <Text
                    className="text-neutral-900 font-semibold text-[16px] ml-3"
                    style={styles.whiteButtonText}
                  >
                    Continue with Google
                  </Text>
                </>
              )}
            </Pressable>

            {/* Continue with Apple */}
            <Pressable
              onPress={handleAppleSignIn}
              disabled={loadingProvider !== null}
              className="flex-row items-center justify-center w-full h-[54px] rounded-full bg-white active:opacity-90"
              style={[
                styles.whiteButton,
                loadingProvider !== null && { opacity: 0.8 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Continue with Apple"
            >
              {loadingProvider === "apple" ? (
                <ActivityIndicator size="small" color="#111827" />
              ) : (
                <>
                  <AppleIcon size={22} color="#000000" />
                  <Text
                    className="text-neutral-900 font-semibold text-[16px] ml-3"
                    style={styles.whiteButtonText}
                  >
                    Continue with Apple
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        )}

        {/* Terms of Service & Privacy Policy Disclaimer */}
        <View className="items-center mt-6" style={styles.footerContainer}>
          <Text
            className="text-white/70 text-center text-[12px] leading-[18px]"
            style={styles.footerText}
          >
            By continuing, you agree to our{"\n"}
            <Text
              className="text-white font-semibold"
              style={styles.footerLink}
            >
              Terms of Service
            </Text>
            {" and "}
            <Text
              className="text-white font-semibold"
              style={styles.footerLink}
            >
              Privacy Policy
            </Text>
            .
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
    width: "100%",
    height: "100%",
  },
  backgroundImage: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
  },
  darkOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.35)",
  },
  gradientOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
  },
  contentWrapper: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: 28,
    width: "100%",
    maxWidth: 440,
    alignSelf: "center",
  },
  headerArea: {
    alignItems: "center",
    marginBottom: 30,
    width: "100%",
  },
  titleLine1: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "800",
    lineHeight: 38,
    textAlign: "center",
    letterSpacing: -0.6,
    fontFamily: Platform.select({
      ios: "System",
      android: "sans-serif-medium",
      default:
        "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif",
    }),
    textShadowColor: "rgba(0, 0, 0, 0.32)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  titleLine2: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "800",
    lineHeight: 38,
    textAlign: "center",
    letterSpacing: -0.6,
    width: "100%",
    fontFamily: Platform.select({
      ios: "System",
      android: "sans-serif-medium",
      default:
        "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif",
    }),
    textShadowColor: "rgba(0, 0, 0, 0.32)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  buttonContainer: {
    width: "100%",
    gap: 13,
  },
  signedInContainer: {
    width: "100%",
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
  },
  whiteButton: {
    width: "100%",
    height: 54,
    borderRadius: 9999,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.14,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      default: {
        boxShadow: "0px 4px 14px rgba(0, 0, 0, 0.12)",
      } as any,
    }),
  },
  whiteButtonText: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 11,
    letterSpacing: -0.15,
    fontFamily: Platform.select({
      ios: "System",
      android: "sans-serif-medium",
      default:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    }),
  },
  footerContainer: {
    alignItems: "center",
    marginTop: 24,
  },
  footerText: {
    color: "rgba(255, 255, 255, 0.72)",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    letterSpacing: -0.1,
    fontFamily: Platform.select({
      ios: "System",
      android: "sans-serif",
      default:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    }),
  },
  footerLink: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
