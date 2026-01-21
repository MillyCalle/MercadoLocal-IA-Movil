import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Easing,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { API_CONFIG, getCurrentNetwork } from "../config";

const { width, height } = Dimensions.get("window");

interface LoginResponse {
  token: string;
  rol: string;
  idUsuario: number;
  nombre?: string;
  correo?: string;
  idVendedor?: number;
  idConsumidor?: number;
}

// PALETA DE COLORES COMO EN EXPLORAR PRODUCTOS
const COLORS = {
  primary: "#FF6B35",        // Naranja principal
  secondary: "#9B59B6",      // Morado
  accent: "#3498DB",         // Azul
  success: "#2ECC71",        // Verde para éxito
  background: "#F8F9FA",     // Fondo claro
  surface: "#FFFFFF",        // Superficie blanca
  text: "#2C3E50",           // Texto oscuro
  lightText: "#64748B",      // Texto claro
  overlay: "rgba(255, 255, 255, 0.92)", // Overlay traslúcido
  glow: "rgba(255, 107, 53, 0.25)",    // Brillo naranja
};

// Componente de fondo con efectos de circuitos elegantes
const BackgroundEffects = () => {
  const floatAnim1 = useRef(new Animated.Value(0)).current;
  const floatAnim2 = useRef(new Animated.Value(0)).current;
  const floatAnim3 = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Animaciones de flotación para círculos
    const createFloatAnimation = (animValue: Animated.Value, duration: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, {
            toValue: 1,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: false,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: false,
          }),
        ])
      );
    };

    createFloatAnimation(floatAnim1, 7000).start();
    createFloatAnimation(floatAnim2, 5000).start();
    createFloatAnimation(floatAnim3, 6000).start();

    // Animación de pulso para efectos de luz
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.6,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  const translateY1 = floatAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 30],
  });

  const translateX2 = floatAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -20],
  });

  const translateY3 = floatAnim3.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 25],
  });

  return (
    <View style={styles.backgroundContainer}>
      {/* Gradiente principal con colores de la paleta */}
      <View style={styles.gradientMain} />
      
      {/* Círculos flotantes con colores de explorar productos */}
      <Animated.View 
        style={[
          styles.floatingCircle1,
          { 
            transform: [{ translateY: translateY1 }],
            opacity: pulseAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.15, 0.25]
            })
          }
        ]} 
      />
      <Animated.View 
        style={[
          styles.floatingCircle2,
          { 
            transform: [{ translateX: translateX2 }],
            opacity: pulseAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.1, 0.2]
            })
          }
        ]} 
      />
      <Animated.View 
        style={[
          styles.floatingCircle3,
          { 
            transform: [{ translateY: translateY3 }],
            opacity: pulseAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.2, 0.3]
            })
          }
        ]} 
      />
      
      {/* Círculo morado adicional */}
      <View style={styles.floatingCircle4} />
      
      {/* Patrones decorativos */}
      <View style={styles.decorativePattern1} />
      <View style={styles.decorativePattern2} />
      <View style={styles.decorativePattern3} />
    </View>
  );
};

// Componente de logo estático con efectos elegantes
const LogoWithEffects = () => {
  const glowAnim = useRef(new Animated.Value(0.2)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animación sutil de flotación y brillo
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(floatAnim, {
            toValue: 1,
            duration: 3000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(floatAnim, {
            toValue: 0,
            duration: 3000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 0.5,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.2,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
        ]),
      ])
    ).start();
  }, []);

  const translateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -5],
  });

  return (
    <View style={styles.logoContainer}>
      {/* Halo naranja detrás del logo */}
      <Animated.View style={[
        styles.logoHalo,
        {
          opacity: glowAnim,
          transform: [{ 
            scale: glowAnim.interpolate({
              inputRange: [0.2, 0.5],
              outputRange: [1, 1.1]
            }) 
          }]
        }
      ]} />
      
      {/* Logo con contenedor elegante */}
      <Animated.View style={[
        styles.logoWrapper,
        {
          transform: [{ translateY }]
        }
      ]}>
        {/* Fondo circular con gradiente */}
        <View style={styles.logoBackground} />
        
        {/* Logo principal */}
        <Image
          source={require("../assets/images/Logo2.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        
        {/* Reflejo sutil */}
        <View style={styles.logoReflection} />
      </Animated.View>
    </View>
  );
};

// Componente de input con efectos
const AnimatedInput = ({ 
  placeholder, 
  value, 
  onChangeText, 
  secureTextEntry = false,
  keyboardType = "default",
  icon,
  onFocus,
  onBlur,
  editable = true
}: any) => {
  const [isFocused, setIsFocused] = useState(false);
  const focusAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  useEffect(() => {
    Animated.timing(focusAnim, {
      toValue: isFocused ? 1 : 0,
      duration: 200,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [isFocused]);

  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(255, 107, 53, 0.1)", COLORS.primary],
  });

  const scale = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.005],
  });

  return (
    <Animated.View style={[
      styles.inputWrapper,
      {
        borderColor,
        transform: [{ scale }],
        shadowOpacity: focusAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.05, 0.15]
        }),
      }
    ]}>
      <View style={styles.inputIconContainer}>
        <Text style={styles.inputIcon}>{icon}</Text>
      </View>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="rgba(255, 107, 53, 0.5)"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize="none"
        onFocus={handleFocus}
        onBlur={handleBlur}
        editable={editable}
      />
      {/* Indicador de foco naranja */}
      {isFocused && (
        <Animated.View style={[
          styles.inputFocusIndicator,
          { 
            opacity: focusAnim,
            backgroundColor: COLORS.primary 
          }
        ]} />
      )}
    </Animated.View>
  );
};

// Botón animado con colores de la paleta
const AnimatedButton = ({ 
  title, 
  onPress, 
  loading = false, 
  variant = "primary",
  icon,
  subtitle
}: any) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const buttonStyle = variant === "primary" ? styles.primaryButton : styles.secondaryButton;
  const textStyle = variant === "primary" ? styles.primaryButtonText : styles.secondaryButtonText;
  const iconColor = variant === "primary" ? "white" : COLORS.primary;

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={loading}
      activeOpacity={0.9}
    >
      <Animated.View style={[
        buttonStyle,
        { transform: [{ scale: scaleAnim }] },
        loading && styles.buttonDisabled
      ]}>
        {/* Contenido del botón */}
        <View style={styles.buttonContent}>
          {icon && <Text style={[styles.buttonIcon, { color: iconColor }]}>{icon}</Text>}
          <View style={styles.buttonTextContainer}>
            <Text style={textStyle}>{title}</Text>
            {subtitle && (
              <Text style={[
                styles.buttonSubtitle,
                { color: variant === "primary" ? "rgba(255, 255, 255, 0.85)" : "rgba(255, 107, 53, 0.7)" }
              ]}>
                {subtitle}
              </Text>
            )}
          </View>
          {!loading && (
            <Text style={[
              styles.buttonArrow,
              { color: variant === "primary" ? "white" : COLORS.primary }
            ]}>
              →
            </Text>
          )}
        </View>
        
        {/* Indicador de carga */}
        {loading && (
          <ActivityIndicator 
            color={variant === "primary" ? "white" : COLORS.primary} 
            size="small" 
            style={styles.buttonLoader}
          />
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Por favor completa todos los campos");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Error", "Por favor ingresa un correo válido");
      return;
    }

    setLoading(true);

    try {
      console.log("🌐 Red:", getCurrentNetwork().name);
      console.log("🔄 Login:", `${API_CONFIG.BASE_URL}/auth/login`);
      console.log("📧 Email:", email);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          correo: email,
          contrasena: password,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log("📡 Status:", response.status);

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || "Error al iniciar sesión");
      }

      const data: LoginResponse = await response.json();
      console.log("✅ Login exitoso:", data);

      // Guardar todos los datos de autenticación
      await AsyncStorage.setItem("authToken", data.token);
      await AsyncStorage.setItem("token", data.token);
      await AsyncStorage.setItem("user", JSON.stringify(data));
      await AsyncStorage.setItem("rol", data.rol);
      await AsyncStorage.setItem("idUsuario", data.idUsuario.toString());

      if (data.idVendedor) {
        await AsyncStorage.setItem("idVendedor", data.idVendedor.toString());
      }

      if (data.idConsumidor) {
        await AsyncStorage.setItem("idConsumidor", data.idConsumidor.toString());
      }

      console.log("💾 Datos guardados");

      // ✅ REDIRECCIÓN SEGÚN ROL
      console.log(`🎯 Rol detectado: ${data.rol}`);
      
      if (data.rol === "VENDEDOR") {
        console.log("🔧 Redirigiendo a dashboard del vendedor...");
        // Redirigir al dashboard del vendedor
        router.replace("/vendedor/dashboard");
      } else {
        console.log("🛒 Redirigiendo a tabs para consumidor...");
        // Para consumidores o cualquier otro rol (CONSUMIDOR, CLIENTE, etc.)
        router.replace("/(tabs)");
      }

    } catch (error: any) {
      console.error("❌ Error:", error);
      
      let errorMessage = "Error desconocido";
      
      if (error.name === "AbortError") {
        errorMessage = "Tiempo agotado. Verifica tu conexión.";
      } else if (error.message.includes("Network")) {
        errorMessage = `No se pudo conectar.\n\nVerifica:\n• WiFi conectado\n• Backend corriendo\n• Red: ${getCurrentNetwork().name}`;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert("Error", errorMessage, [{ text: "OK" }]);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setLoading(true);
    try {
      await AsyncStorage.setItem("isGuest", "true");
      await AsyncStorage.removeItem("authToken");
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("user");
      await AsyncStorage.removeItem("rol");
      await AsyncStorage.removeItem("idUsuario");
      await AsyncStorage.removeItem("idVendedor");
      await AsyncStorage.removeItem("idConsumidor");
      
      console.log("👤 Usuario invitado registrado");
      router.replace("/(tabs)/explorar");
    } catch (error) {
      console.error("Error en login invitado:", error);
      Alert.alert("Error", "No se pudo iniciar como invitado");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterRedirect = () => {
    router.push("/register");
  };

  const handleBackToWelcome = () => {
    router.replace("/WelcomeScreen");
  };

  const mostrarConfig = () => {
    const net = getCurrentNetwork();
    Alert.alert(
      "⚙️ Configuración",
      `Red: ${net.name}\nIP: ${net.ip}\nPuerto: ${net.port}\n\nPara cambiar, edita config.ts`,
      [{ text: "OK" }]
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView 
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Fondo con efectos de círculos */}
        <BackgroundEffects />
        
        {/* Logo con efectos sutiles */}
        <LogoWithEffects />

        {/* Título principal */}
        <View style={styles.headerContainer}>
          <Text style={styles.mainTitle}>¡Bienvenido!</Text>
          <Text style={styles.subTitle}>Inicia sesión en tu cuenta</Text>
          
          {/* Línea decorativa naranja */}
          <View style={styles.titleLine} />
        </View>

        {/* Formulario con card elegante */}
        <View style={styles.formContainer}>
          <View style={styles.formCard}>
            {/* Header de la card con gradiente naranja */}
            <View style={styles.cardHeader} />
            
            {/* Campos del formulario */}
            <Text style={styles.formLabel}>Correo electrónico</Text>
            <AnimatedInput
              placeholder="ejemplo@correo.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              icon="📧"
              editable={!loading}
            />

            <Text style={styles.formLabel}>Contraseña</Text>
            <AnimatedInput
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              icon="🔒"
              editable={!loading}
            />

            {/* Toggle password */}
            <TouchableOpacity
              style={styles.togglePasswordButton}
              onPress={() => setShowPassword(!showPassword)}
              disabled={loading}
            >
              <Text style={styles.togglePasswordIcon}>
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </Text>
              <Text style={styles.togglePasswordText}>
                {showPassword ? "Ocultar" : "Mostrar"} contraseña
              </Text>
            </TouchableOpacity>

            {/* Botón de inicio de sesión NARANJA */}
            <AnimatedButton
              title="Iniciar Sesión"
              onPress={handleLogin}
              loading={loading}
              variant="primary"
              icon="🚀"
              subtitle="Accede a tu cuenta"
            />

            {/* Divisor elegante */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>o</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Botón de invitado - Estilo secundario */}
            <AnimatedButton
              title="Continuar como Invitado"
              onPress={handleGuestLogin}
              loading={loading}
              variant="secondary"
              icon="👤"
              subtitle="Explora sin cuenta"
            />

            {/* Enlaces de navegación */}
            <View style={styles.linksContainer}>
              <TouchableOpacity 
                onPress={handleRegisterRedirect}
                disabled={loading}
                style={styles.linkButton}
              >
                <Text style={styles.linkText}>
                  ¿No tienes cuenta?{" "}
                  <Text style={styles.linkHighlight}>Regístrate aquí</Text>
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={handleBackToWelcome}
                disabled={loading}
                style={styles.linkButton}
              >
                <Text style={styles.backLink}>
                  ← Volver al inicio
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Info de red */}
        <TouchableOpacity style={styles.networkInfo} onPress={mostrarConfig}>
          <View style={styles.networkIconContainer}>
            <Text style={styles.networkIcon}>🌐</Text>
            <View style={styles.networkStatus} />
          </View>
          <View style={styles.networkTextContainer}>
            <Text style={styles.networkName}>{getCurrentNetwork().name}</Text>
            <Text style={styles.networkUrl}>{API_CONFIG.BASE_URL}</Text>
          </View>
          <Text style={styles.networkHint}>Toca para detalles</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: COLORS.background,
    padding: 20,
    paddingTop: 60,
  },
  
  // Background effects
  backgroundContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "hidden",
  },
  gradientMain: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.7,
    backgroundColor: COLORS.background,
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
  },
  floatingCircle1: {
    position: "absolute",
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: COLORS.primary,
    top: 100,
    right: -80,
  },
  floatingCircle2: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: COLORS.secondary,
    bottom: 150,
    left: -50,
  },
  floatingCircle3: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.accent,
    top: 250,
    left: 20,
  },
  floatingCircle4: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.success,
    bottom: 200,
    right: 40,
    opacity: 0.2,
  },
  decorativePattern1: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 107, 53, 0.05)",
    top: 180,
    right: 40,
  },
  decorativePattern2: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(155, 89, 182, 0.05)",
    bottom: 100,
    right: 100,
  },
  decorativePattern3: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(52, 152, 219, 0.05)",
    top: 350,
    left: 100,
  },
  
  // Logo effects
  logoContainer: {
    alignItems: "center",
    marginBottom: 30,
    position: "relative",
  },
  logoHalo: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: COLORS.glow,
  },
  logoWrapper: {
    position: "relative",
    zIndex: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  logoBackground: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "white",
    position: "absolute",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  logo: {
    width: 120,
    height: 120,
    zIndex: 3,
  },
  logoReflection: {
    position: "absolute",
    top: 10,
    width: 100,
    height: 30,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 15,
    transform: [{ rotate: "15deg" }],
    zIndex: 2,
  },
  
  // Header
  headerContainer: {
    alignItems: "center",
    marginBottom: 40,
    position: "relative",
  },
  mainTitle: {
    fontSize: 42,
    fontWeight: "800",
    color: COLORS.primary,
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(255, 107, 53, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  subTitle: {
    fontSize: 18,
    color: COLORS.lightText,
    textAlign: "center",
    fontWeight: "500",
    letterSpacing: 0.3,
  },
  titleLine: {
    width: 60,
    height: 3,
    backgroundColor: COLORS.primary,
    marginTop: 15,
    borderRadius: 2,
  },
  
  // Form
  formContainer: {
    marginBottom: 30,
  },
  formCard: {
    backgroundColor: COLORS.overlay,
    borderRadius: 30,
    padding: 30,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.1,
    shadowRadius: 25,
    elevation: 12,
    position: "relative",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 107, 53, 0.1)",
  },
  cardHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 5,
    backgroundColor: COLORS.primary,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 8,
    marginTop: 20,
    marginLeft: 5,
    letterSpacing: 0.3,
  },
  
  // Inputs
  inputWrapper: {
    backgroundColor: "white",
    borderRadius: 15,
    borderWidth: 1.5,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 0,
    overflow: "hidden",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 6,
  },
  inputIconContainer: {
    paddingLeft: 15,
    paddingRight: 10,
  },
  inputIcon: {
    fontSize: 20,
    color: COLORS.primary,
  },
  input: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: COLORS.text,
    height: 56,
    fontWeight: "500",
  },
  inputFocusIndicator: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  
  // Toggle password
  togglePasswordButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    marginTop: 12,
    marginBottom: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "rgba(255, 107, 53, 0.08)",
  },
  togglePasswordIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  togglePasswordText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  
  // Buttons
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 15,
    padding: 22,
    marginTop: 10,
    position: "relative",
    overflow: "hidden",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  secondaryButton: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 22,
    borderWidth: 2,
    borderColor: COLORS.primary,
    position: "relative",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  buttonIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  buttonTextContainer: {
    flex: 1,
  },
  primaryButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  secondaryButtonText: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  buttonSubtitle: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: "500",
  },
  buttonArrow: {
    fontSize: 24,
    fontWeight: "bold",
  },
  buttonLoader: {
    position: "absolute",
    right: 20,
  },
  
  // Divider
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 30,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255, 107, 53, 0.15)",
  },
  dividerText: {
    marginHorizontal: 20,
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "600",
    backgroundColor: COLORS.overlay,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  
  // Links
  linksContainer: {
    gap: 15,
    marginTop: 20,
  },
  linkButton: {
    paddingVertical: 10,
  },
  linkText: {
    textAlign: "center",
    fontSize: 15,
    color: COLORS.lightText,
    fontWeight: "500",
  },
  linkHighlight: {
    color: COLORS.primary,
    fontWeight: "700",
  },
  backLink: {
    textAlign: "center",
    fontSize: 15,
    color: COLORS.primary,
    fontWeight: "600",
  },
  
  // Network info
  networkInfo: {
    backgroundColor: COLORS.overlay,
    borderRadius: 15,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 107, 53, 0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  networkIconContainer: {
    position: "relative",
    marginRight: 12,
  },
  networkIcon: {
    fontSize: 20,
    color: COLORS.primary,
  },
  networkStatus: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
    top: 0,
    right: 0,
    borderWidth: 2,
    borderColor: "white",
  },
  networkTextContainer: {
    flex: 1,
  },
  networkName: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 2,
  },
  networkUrl: {
    fontSize: 10,
    color: COLORS.lightText,
  },
  networkHint: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: "500",
  },
});