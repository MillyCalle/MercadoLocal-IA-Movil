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
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { API_CONFIG, getCurrentNetwork } from "../config";

const { width, height } = Dimensions.get("window");

// PALETA DE COLORES ACTUALIZADA
const COLORS = {
  primary: "#FF6B35",
  secondary: "#9B59B6",
  accent: "#3498DB",
  success: "#2ECC71",
  background: "#F8F9FA",
  surface: "#FFFFFF",
  text: "#2C3E50",
  lightText: "#64748B",
  placeholder: "#94A3B8",
  overlay: "rgba(255, 255, 255, 0.95)",
  glow: "rgba(255, 107, 53, 0.25)",
};

// REEMPLAZA ESTAS CONSTANTES CON TU TIPOGRAFÍA
const TYPOGRAPHY = {
  regular: Platform.OS === 'ios' ? "System" : "Roboto",
  medium: Platform.OS === 'ios' ? "System" : "Roboto-Medium",
  bold: Platform.OS === 'ios' ? "System" : "Roboto-Bold",
  extraBold: Platform.OS === 'ios' ? "System" : "Roboto-Black",
};

// Componentes actualizados
const BackgroundEffects = () => {
  const floatAnim1 = useRef(new Animated.Value(0)).current;
  const floatAnim2 = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
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

    createFloatAnimation(floatAnim1, 8000).start();
    createFloatAnimation(floatAnim2, 6000).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.5,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.2,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  const translateY1 = floatAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 20],
  });

  const translateX2 = floatAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -15],
  });

  return (
    <View style={styles.backgroundContainer}>
      <View style={styles.gradientMain} />
      
      <Animated.View 
        style={[
          styles.floatingCircle1,
          { 
            transform: [{ translateY: translateY1 }],
            opacity: pulseAnim
          }
        ]} 
      />
      <Animated.View 
        style={[
          styles.floatingCircle2,
          { 
            transform: [{ translateX: translateX2 }],
            opacity: pulseAnim.interpolate({
              inputRange: [0.2, 0.5],
              outputRange: [0.1, 0.15]
            })
          }
        ]} 
      />
    </View>
  );
};

const LogoWithEffects = () => {
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
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
      ])
    ).start();
  }, []);

  const translateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -4],
  });

  return (
    <View style={styles.logoContainer}>
      <Animated.View style={[
        styles.logoWrapper,
        {
          transform: [{ translateY }]
        }
      ]}>
        <View style={styles.logoBackground} />
        <Image
          source={require("../assets/images/Logo2.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
};

const AnimatedInput = ({ 
  placeholder, 
  value, 
  onChangeText, 
  secureTextEntry = false,
  keyboardType = "default",
  icon,
  onFocus,
  onBlur,
  editable = true,
  multiline = false,
  numberOfLines = 1,
  containerStyle = {}
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

  return (
    <Animated.View style={[
      styles.inputWrapper,
      containerStyle,
      {
        borderColor,
      }
    ]}>
      {icon && (
        <View style={styles.inputIconContainer}>
          <Text style={styles.inputIcon}>{icon}</Text>
        </View>
      )}
      <TextInput
        style={[
          styles.input,
          multiline && styles.textareaInput,
          { height: multiline ? Math.max(numberOfLines * 24, 56) : 48 }
        ]}
        placeholder={placeholder}
        placeholderTextColor={COLORS.placeholder}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize="none"
        onFocus={handleFocus}
        onBlur={handleBlur}
        editable={editable}
        multiline={multiline}
        numberOfLines={multiline ? numberOfLines : 1}
        textAlignVertical={multiline ? "top" : "center"}
      />
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

const AnimatedButton = ({ 
  title, 
  onPress, 
  loading = false, 
  variant = "primary",
  icon,
  subtitle,
  style = {},
  disabled = false
}: any) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (!disabled && !loading) {
      Animated.spring(scaleAnim, {
        toValue: 0.97,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (!disabled && !loading) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }).start();
    }
  };

  const buttonStyle = variant === "primary" ? styles.primaryButton : styles.secondaryButton;
  const textStyle = variant === "primary" ? styles.primaryButtonText : styles.secondaryButtonText;

  return (
    <TouchableOpacity
      onPress={!disabled && !loading ? onPress : undefined}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      activeOpacity={0.9}
      style={[styles.buttonTouchable, style]}
    >
      <Animated.View style={[
        buttonStyle,
        { transform: [{ scale: scaleAnim }] },
        (loading || disabled) && styles.buttonDisabled
      ]}>
        <View style={styles.buttonContent}>
          {icon && <Text style={[styles.buttonIcon, { color: variant === "primary" ? "white" : COLORS.primary }]}>{icon}</Text>}
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
          {!loading && !disabled && (
            <Text style={[
              styles.buttonArrow,
              { color: variant === "primary" ? "white" : COLORS.primary }
            ]}>
              →
            </Text>
          )}
        </View>
        
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

const DatePickerModal = ({ visible, onClose, onConfirm, selectedYear, setSelectedYear, selectedMonth, setSelectedMonth, selectedDay, setSelectedDay }: any) => {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => (currentYear - i).toString());
  const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'));

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.datePickerContainer}>
              <View style={styles.datePickerHeader}>
                <Text style={styles.datePickerTitle}>📅 Fecha de Nacimiento</Text>
                <TouchableOpacity 
                  onPress={onClose}
                >
                  <Text style={styles.closeButton}>×</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.dateSelectors}>
                <View style={styles.dateSelector}>
                  <Text style={styles.dateSelectorLabel}>Año</Text>
                  <View style={styles.dateSelectorBackground}>
                    <ScrollView 
                      style={styles.dateScrollView}
                      showsVerticalScrollIndicator={false}
                    >
                      {years.map((year) => (
                        <TouchableOpacity
                          key={year}
                          style={[
                            styles.dateOption,
                            selectedYear === year && styles.dateOptionSelected
                          ]}
                          onPress={() => setSelectedYear(year)}
                        >
                          <Text style={[
                            styles.dateOptionText,
                            selectedYear === year && styles.dateOptionTextSelected
                          ]}>
                            {year}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>
                
                <View style={styles.dateSelector}>
                  <Text style={styles.dateSelectorLabel}>Mes</Text>
                  <View style={styles.dateSelectorBackground}>
                    <ScrollView 
                      style={styles.dateScrollView}
                      showsVerticalScrollIndicator={false}
                    >
                      {months.map((month) => (
                        <TouchableOpacity
                          key={month}
                          style={[
                            styles.dateOption,
                            selectedMonth === month && styles.dateOptionSelected
                          ]}
                          onPress={() => setSelectedMonth(month)}
                        >
                          <Text style={[
                            styles.dateOptionText,
                            selectedMonth === month && styles.dateOptionTextSelected
                          ]}>
                            {month}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>
                
                <View style={styles.dateSelector}>
                  <Text style={styles.dateSelectorLabel}>Día</Text>
                  <View style={styles.dateSelectorBackground}>
                    <ScrollView 
                      style={styles.dateScrollView}
                      showsVerticalScrollIndicator={false}
                    >
                      {days.map((day) => (
                        <TouchableOpacity
                          key={day}
                          style={[
                            styles.dateOption,
                            selectedDay === day && styles.dateOptionSelected
                          ]}
                          onPress={() => setSelectedDay(day)}
                        >
                          <Text style={[
                            styles.dateOptionText,
                            selectedDay === day && styles.dateOptionTextSelected
                          ]}>
                            {day}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>
              </View>
              
              {(selectedYear || selectedMonth || selectedDay) && (
                <View style={styles.selectedDatePreview}>
                  <Text style={styles.selectedDateLabel}>Fecha seleccionada:</Text>
                  <Text style={styles.selectedDateText}>
                    {selectedYear || "----"}-{selectedMonth || "--"}-{selectedDay || "--"}
                  </Text>
                </View>
              )}
              
              <AnimatedButton
                title="Confirmar Fecha"
                onPress={onConfirm}
                variant="primary"
                icon="✅"
                style={styles.confirmDateButton}
                loading={false}
                disabled={!selectedYear || !selectedMonth || !selectedDay}
              />
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

// Componente mejorado de RoleSelector SIN asteriscos
const AnimatedRoleSelector = ({ selectedRole, onSelect, loading }: any) => {
  return (
    <View style={styles.roleSelectorContainer}>
      <Text style={styles.roleSelectorLabel}>💼 ¿Cómo te unirás?</Text>
      <View style={styles.roleButtons}>
        <TouchableOpacity
          onPress={() => onSelect(3)}
          disabled={loading}
          activeOpacity={0.8}
          style={styles.roleButtonTouchable}
        >
          <View style={[
            styles.roleButton,
            selectedRole === 3 && styles.roleButtonActive
          ]}>
            <Text style={styles.roleIcon}>🛒</Text>
            <Text style={[styles.roleText, selectedRole === 3 && styles.roleTextActive]}>
              Consumidor
            </Text>
            <Text style={styles.roleDesc}>Compra productos</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onSelect(2)}
          disabled={loading}
          activeOpacity={0.8}
          style={styles.roleButtonTouchable}
        >
          <View style={[
            styles.roleButton,
            selectedRole === 2 && styles.roleButtonActive
          ]}>
            <Text style={styles.roleIcon}>🏪</Text>
            <Text style={[styles.roleText, selectedRole === 2 && styles.roleTextActive]}>
              Vendedor
            </Text>
            <Text style={styles.roleDesc}>Vende productos</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

interface RegisterResponse {
  token: string;
  rol: string;
  idUsuario: number;
  nombre?: string;
  correo?: string;
  idVendedor?: number;
  idConsumidor?: number;
  mensaje?: string;
}

export default function RegisterScreen() {
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    correo: "",
    contrasena: "",
    confirmarContrasena: "", // CAMPO AÑADIDO
    fechaNacimiento: "",
    idRol: 3,
    cedula: "",
    direccion: "",
    telefono: "",
    nombreEmpresa: "",
    ruc: "",
    direccionEmpresa: "",
    telefonoEmpresa: "",
    descripcion: ""
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // ESTADO AÑADIDO
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedDay, setSelectedDay] = useState("");
  const router = useRouter();

  const handleChange = (name: string, value: string) => {
    setForm({ ...form, [name]: value });
  };

  const handleRoleChange = (newRole: number) => {
    setForm({ ...form, idRol: newRole });
  };

  const handleOpenDatePicker = () => {
    setShowDatePicker(true);
  };

  const handleCloseDatePicker = () => {
    setShowDatePicker(false);
  };

  const handleDateConfirm = () => {
    if (selectedYear && selectedMonth && selectedDay) {
      const formattedDate = `${selectedYear}-${selectedMonth.padStart(2, '0')}-${selectedDay.padStart(2, '0')}`;
      setForm({ ...form, fechaNacimiento: formattedDate });
    }
    setShowDatePicker(false);
  };

  // FUNCIÓN PARA VALIDAR CONTRASEÑAS
  const validatePasswords = () => {
    if (!form.contrasena) {
      Alert.alert("Campo Requerido", "Por favor ingresa una contraseña");
      return false;
    }
    if (form.contrasena.length < 6) {
      Alert.alert("Contraseña Débil", "La contraseña debe tener al menos 6 caracteres");
      return false;
    }
    if (!form.confirmarContrasena) {
      Alert.alert("Campo Requerido", "Por favor confirma tu contraseña");
      return false;
    }
    if (form.contrasena !== form.confirmarContrasena) {
      Alert.alert("Error", "Las contraseñas no coinciden");
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!form.nombre || !form.apellido || !form.correo || !form.fechaNacimiento) {
      Alert.alert("Campos Requeridos", "Por favor completa todos los campos obligatorios");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.correo)) {
      Alert.alert("Correo Inválido", "Por favor ingresa un correo electrónico válido");
      return;
    }

    // Validar contraseñas
    if (!validatePasswords()) {
      return;
    }

    if (form.idRol === 3) {
      if (!form.cedula || !form.direccion || !form.telefono) {
        Alert.alert("Datos Incompletos", "Por favor completa todos los campos del consumidor");
        return;
      }
    } else if (form.idRol === 2) {
      if (!form.nombreEmpresa || !form.ruc || !form.direccionEmpresa || !form.telefonoEmpresa) {
        Alert.alert("Datos Incompletos", "Por favor completa todos los campos del vendedor");
        return;
      }
    }

    setLoading(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
      
      // Enviar solo los campos necesarios (sin confirmarContrasena)
      const dataToSend = {
        nombre: form.nombre,
        apellido: form.apellido,
        correo: form.correo,
        contrasena: form.contrasena,
        fechaNacimiento: form.fechaNacimiento,
        idRol: form.idRol,
        cedula: form.idRol === 3 ? form.cedula : "",
        direccion: form.idRol === 3 ? form.direccion : "",
        telefono: form.idRol === 3 ? form.telefono : "",
        nombreEmpresa: form.idRol === 2 ? form.nombreEmpresa : "",
        ruc: form.idRol === 2 ? form.ruc : "",
        direccionEmpresa: form.idRol === 2 ? form.direccionEmpresa : "",
        telefonoEmpresa: form.idRol === 2 ? form.telefonoEmpresa : "",
        descripcion: form.idRol === 2 ? form.descripcion : ""
      };
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSend),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data: RegisterResponse = await response.json();

      if (response.ok) {
        if (data.token) await AsyncStorage.setItem("authToken", data.token);
        if (data.token) await AsyncStorage.setItem("token", data.token);
        if (data.rol) await AsyncStorage.setItem("rol", data.rol);
        if (data.idUsuario) await AsyncStorage.setItem("idUsuario", data.idUsuario.toString());
        if (data.idVendedor) await AsyncStorage.setItem("idVendedor", data.idVendedor.toString());
        if (data.idConsumidor) await AsyncStorage.setItem("idConsumidor", data.idConsumidor.toString());

        const user = {
          id: data.idUsuario,
          rol: data.rol,
          nombre: form.nombre,
          correo: form.correo,
          idVendedor: data.idVendedor,
          idConsumidor: data.idConsumidor
        };
        await AsyncStorage.setItem("user", JSON.stringify(user));

        Alert.alert(
          "¡Éxito! 🎉",
          `¡Bienvenido ${form.nombre}! Tu cuenta ha sido creada exitosamente.`,
          [
            {
              text: "Continuar",
              onPress: () => router.replace("/(tabs)")
            }
          ]
        );

      } else {
        throw new Error(data.mensaje || "Error en registro");
      }

    } catch (error: any) {
      let errorMessage = "Error desconocido";
      
      if (error.name === "AbortError") {
        errorMessage = "Tiempo agotado. Verifica tu conexión.";
      } else if (error.message.includes("Network")) {
        errorMessage = `No se pudo conectar.\n\nVerifica:\n• WiFi conectado\n• Backend corriendo`;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert("Error", errorMessage);
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
      
      router.replace("/(tabs)/explorar");
    } catch (error) {
      Alert.alert("Error", "No se pudo iniciar como invitado");
    } finally {
      setLoading(false);
    }
  };

  const handleLoginRedirect = () => {
    router.push("/login");
  };

  const handleBackToWelcome = () => {
    router.replace("/WelcomeScreen");
  };

  const mostrarConfig = () => {
    const net = getCurrentNetwork();
    Alert.alert(
      "Configuración",
      `Red: ${net.name}\nIP: ${net.ip}\nPuerto: ${net.port}`
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
        bounces={false}
      >
        <BackgroundEffects />
        
        {/* Header FIXED - LOGO CENTRADO */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={handleBackToWelcome}
            style={styles.backButton}
            disabled={loading}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={styles.logoCenterContainer}>
            <LogoWithEffects />
          </View>
          <View style={styles.headerSpacer} />
        </View>

        {/* Títulos principales */}
        <View style={styles.headerContainer}>
          <Text style={styles.mainTitle}>¡Crea tu Cuenta!</Text>
          <Text style={styles.subTitle}>Únete a nuestra comunidad</Text>
        </View>

        {/* Formulario */}
        <View style={styles.formContainer}>
          <View style={styles.formCard}>
            <View style={styles.cardHeader} />
            
            <AnimatedRoleSelector 
              selectedRole={form.idRol}
              onSelect={handleRoleChange}
              loading={loading}
            />

            {/* Información Personal */}
            <Text style={styles.sectionTitle}>👤 Información Personal</Text>
            
            <View style={styles.inputRow}>
              <View style={styles.inputHalf}>
                <Text style={styles.formLabel}>Nombre</Text>
                <AnimatedInput
                  placeholder="Juan"
                  value={form.nombre}
                  onChangeText={(v: string) => handleChange("nombre", v)}
                  icon="👤"
                  editable={!loading}
                />
              </View>

              <View style={styles.inputHalf}>
                <Text style={styles.formLabel}>Apellido</Text>
                <AnimatedInput
                  placeholder="Pérez"
                  value={form.apellido}
                  onChangeText={(v: string) => handleChange("apellido", v)}
                  icon="📝"
                  editable={!loading}
                />
              </View>
            </View>

            <Text style={styles.formLabel}>Correo electrónico</Text>
            <AnimatedInput
              placeholder="tu@correo.com"
              value={form.correo}
              onChangeText={(v: string) => handleChange("correo", v)}
              keyboardType="email-address"
              icon="📧"
              editable={!loading}
            />

            {/* Contraseña */}
            <Text style={styles.formLabel}>Contraseña</Text>
            <View style={styles.passwordContainer}>
              <AnimatedInput
                placeholder="••••••••"
                value={form.contrasena}
                onChangeText={(v: string) => handleChange("contrasena", v)}
                secureTextEntry={!showPassword}
                icon="🔒"
                editable={!loading}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                <Text style={styles.eyeText}>{showPassword ? "👁️" : "👁️‍🗨️"}</Text>
              </TouchableOpacity>
            </View>

            {/* Confirmar Contraseña - CAMPO AÑADIDO */}
            <Text style={styles.formLabel}>Confirmar Contraseña</Text>
            <View style={styles.passwordContainer}>
              <AnimatedInput
                placeholder="••••••••"
                value={form.confirmarContrasena}
                onChangeText={(v: string) => handleChange("confirmarContrasena", v)}
                secureTextEntry={!showConfirmPassword}
                icon="🔒"
                editable={!loading}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={loading}
              >
                <Text style={styles.eyeText}>{showConfirmPassword ? "👁️" : "👁️‍🗨️"}</Text>
              </TouchableOpacity>
            </View>

            {/* Indicador visual de coincidencia de contraseñas - NUEVO */}
            {form.contrasena && form.confirmarContrasena && (
              <View style={styles.passwordMatchIndicator}>
                {form.contrasena === form.confirmarContrasena ? (
                  <Text style={styles.passwordMatchText}>✓ Las contraseñas coinciden</Text>
                ) : (
                  <Text style={styles.passwordMismatchText}>✗ Las contraseñas no coinciden</Text>
                )}
              </View>
            )}

            <Text style={styles.formLabel}>Fecha de nacimiento</Text>
            <TouchableOpacity
              onPress={handleOpenDatePicker}
              disabled={loading}
            >
              <AnimatedInput
                placeholder="YYYY-MM-DD"
                value={form.fechaNacimiento}
                onChangeText={() => {}}
                icon="📅"
                editable={false}
                containerStyle={styles.dateInputContainer}
              />
            </TouchableOpacity>

            {/* Campos según rol */}
            {form.idRol === 3 && (
              <>
                <View style={styles.sectionDivider} />
                <Text style={styles.sectionTitle}>🛒 Datos del Consumidor</Text>
                
                <Text style={styles.formLabel}>Cédula</Text>
                <AnimatedInput
                  placeholder="0102030405"
                  value={form.cedula}
                  onChangeText={(v: string) => handleChange("cedula", v)}
                  keyboardType="numeric"
                  icon="🆔"
                  editable={!loading}
                />
                
                <Text style={styles.formLabel}>Dirección</Text>
                <AnimatedInput
                  placeholder="Tu dirección"
                  value={form.direccion}
                  onChangeText={(v: string) => handleChange("direccion", v)}
                  icon="📍"
                  editable={!loading}
                />
                
                <Text style={styles.formLabel}>Teléfono</Text>
                <AnimatedInput
                  placeholder="0999999999"
                  value={form.telefono}
                  onChangeText={(v: string) => handleChange("telefono", v)}
                  keyboardType="phone-pad"
                  icon="📱"
                  editable={!loading}
                />
              </>
            )}

            {form.idRol === 2 && (
              <>
                <View style={styles.sectionDivider} />
                <Text style={styles.sectionTitle}>🏪 Datos del Negocio</Text>
                
                <Text style={styles.formLabel}>Nombre del negocio</Text>
                <AnimatedInput
                  placeholder="Frutas Don Pepe"
                  value={form.nombreEmpresa}
                  onChangeText={(v: string) => handleChange("nombreEmpresa", v)}
                  icon="🏬"
                  editable={!loading}
                />
                
                <Text style={styles.formLabel}>RUC</Text>
                <AnimatedInput
                  placeholder="1102345678001"
                  value={form.ruc}
                  onChangeText={(v: string) => handleChange("ruc", v)}
                  keyboardType="numeric"
                  icon="📋"
                  editable={!loading}
                />
                
                <Text style={styles.formLabel}>Dirección</Text>
                <AnimatedInput
                  placeholder="Local 12, Mercado Central"
                  value={form.direccionEmpresa}
                  onChangeText={(v: string) => handleChange("direccionEmpresa", v)}
                  icon="🗺️"
                  editable={!loading}
                />
                
                <Text style={styles.formLabel}>Teléfono</Text>
                <AnimatedInput
                  placeholder="0987654321"
                  value={form.telefonoEmpresa}
                  onChangeText={(v: string) => handleChange("telefonoEmpresa", v)}
                  keyboardType="phone-pad"
                  icon="📞"
                  editable={!loading}
                />
                
                <Text style={styles.formLabel}>Descripción (opcional)</Text>
                <AnimatedInput
                  placeholder="Describe tu negocio..."
                  value={form.descripcion}
                  onChangeText={(v: string) => handleChange("descripcion", v)}
                  icon="📝"
                  multiline={true}
                  numberOfLines={3}
                  editable={!loading}
                  containerStyle={styles.textareaContainer}
                />
              </>
            )}

            {/* Botón de registro */}
            <AnimatedButton
              title="Crear Cuenta"
              onPress={handleRegister}
              loading={loading}
              variant="primary"
              icon="🚀"
              subtitle="Únete a nuestra comunidad"
              style={styles.registerButton}
            />

            {/* Divisor */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>o</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Botón de invitado */}
            <AnimatedButton
              title="Continuar como Invitado"
              onPress={handleGuestLogin}
              loading={loading}
              variant="secondary"
              icon="👤"
              subtitle="Explora sin cuenta"
            />

            {/* Enlaces */}
            <View style={styles.linksContainer}>
              <TouchableOpacity 
                onPress={handleLoginRedirect}
                disabled={loading}
                style={styles.linkButton}
              >
                <Text style={styles.linkText}>
                  ¿Ya tienes cuenta?{" "}
                  <Text style={styles.linkHighlight}>Inicia sesión</Text>
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
        </TouchableOpacity>
      </ScrollView>

      <DatePickerModal
        visible={showDatePicker}
        onClose={handleCloseDatePicker}
        onConfirm={handleDateConfirm}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        selectedDay={selectedDay}
        setSelectedDay={setSelectedDay}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 30,
  },
  
  // Background
  backgroundContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gradientMain: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.4,
    backgroundColor: COLORS.background,
  },
  floatingCircle1: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: COLORS.primary,
    top: 50,
    right: -60,
    opacity: 0.1,
  },
  floatingCircle2: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: COLORS.secondary,
    bottom: 100,
    left: -40,
    opacity: 0.08,
  },
  
  // Header FIXED - LOGO CENTRADO
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    width: '100%',
  },
  backButton: {
    padding: 8,
    width: 40,
    alignItems: 'flex-start',
  },
  backIcon: {
    fontSize: 24,
    fontWeight: "600",
    color: COLORS.primary,
  },
  logoCenterContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerSpacer: {
    width: 40,
  },
  
  // Logo Container
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  logoWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  logoBackground: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "white",
    position: "absolute",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  logo: {
    width: 80,
    height: 80,
  },
  
  // Titles
  headerContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.primary,
    textAlign: "center",
    marginBottom: 6,
    fontFamily: TYPOGRAPHY.extraBold,
  },
  subTitle: {
    fontSize: 14,
    color: COLORS.lightText,
    textAlign: "center",
    fontWeight: "500",
    fontFamily: TYPOGRAPHY.medium,
  },
  
  // Form Container
  formContainer: {
    marginBottom: 20,
  },
  formCard: {
    backgroundColor: COLORS.overlay,
    borderRadius: 20,
    padding: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 15,
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 107, 53, 0.08)",
  },
  cardHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: COLORS.primary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  
  // Role Selector
  roleSelectorContainer: {
    marginBottom: 20,
  },
  roleSelectorLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 12,
    fontFamily: TYPOGRAPHY.bold,
  },
  roleButtons: {
    flexDirection: "row",
    gap: 12,
  },
  roleButtonTouchable: {
    flex: 1,
  },
  roleButton: {
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "rgba(255, 107, 53, 0.1)",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    minHeight: 100,
    justifyContent: "center",
  },
  roleButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: "rgba(255, 107, 53, 0.03)",
  },
  roleIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  roleText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 4,
    textAlign: "center",
    fontFamily: TYPOGRAPHY.bold,
  },
  roleTextActive: {
    color: COLORS.primary,
  },
  roleDesc: {
    fontSize: 11,
    color: COLORS.lightText,
    textAlign: "center",
    fontFamily: TYPOGRAPHY.regular,
  },
  
  // Section Titles
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    marginTop: 20,
    marginBottom: 12,
    fontFamily: TYPOGRAPHY.bold,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: "rgba(255, 107, 53, 0.08)",
    marginVertical: 16,
  },
  
  // Form Labels
  formLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 6,
    marginTop: 12,
    fontFamily: TYPOGRAPHY.bold,
  },
  
  // Inputs
  inputWrapper: {
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 1.5,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    minHeight: 48,
  },
  inputIconContainer: {
    paddingLeft: 12,
    paddingRight: 8,
  },
  inputIcon: {
    fontSize: 18,
    color: COLORS.primary,
  },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 15,
    color: COLORS.text,
    fontWeight: "500",
    minHeight: 48,
    fontFamily: TYPOGRAPHY.regular,
  },
  textareaInput: {
    textAlignVertical: "top",
    paddingTop: 12,
  },
  inputFocusIndicator: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  inputRow: {
    flexDirection: "row",
    gap: 12,
  },
  inputHalf: {
    flex: 1,
  },
  
  // Password
  passwordContainer: {
    position: "relative",
  },
  eyeIcon: {
    position: "absolute",
    right: 12,
    top: "50%",
    marginTop: -12,
    zIndex: 10,
    padding: 6,
  },
  eyeText: {
    fontSize: 16,
  },
  
  // Indicador de coincidencia de contraseñas - NUEVO
  passwordMatchIndicator: {
    marginTop: 6,
    marginBottom: 4,
  },
  passwordMatchText: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: "600",
    fontFamily: TYPOGRAPHY.medium,
  },
  passwordMismatchText: {
    fontSize: 12,
    color: "#ff4444",
    fontWeight: "600",
    fontFamily: TYPOGRAPHY.medium,
  },
  
  // Date
  dateInputContainer: {
    opacity: 0.9,
  },
  
  // Textarea
  textareaContainer: {
    minHeight: 80,
  },
  
  // Buttons
  buttonTouchable: {
    marginTop: 8,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    position: "relative",
    overflow: "hidden",
    minHeight: 56,
    justifyContent: "center",
  },
  secondaryButton: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: COLORS.primary,
    minHeight: 56,
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  buttonIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  buttonTextContainer: {
    flex: 1,
  },
  primaryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
    fontFamily: TYPOGRAPHY.bold,
  },
  secondaryButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "700",
    fontFamily: TYPOGRAPHY.bold,
  },
  buttonSubtitle: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: "500",
    fontFamily: TYPOGRAPHY.medium,
  },
  buttonArrow: {
    fontSize: 20,
    fontWeight: "bold",
  },
  buttonLoader: {
    position: "absolute",
    right: 16,
  },
  registerButton: {
    marginTop: 20,
  },
  
  // Divider
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255, 107, 53, 0.12)",
  },
  dividerText: {
    marginHorizontal: 16,
    color: COLORS.lightText,
    fontSize: 12,
    fontWeight: "600",
    backgroundColor: COLORS.background,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    fontFamily: TYPOGRAPHY.medium,
  },
  
  // Links
  linksContainer: {
    gap: 12,
    marginTop: 16,
  },
  linkButton: {
    paddingVertical: 8,
  },
  linkText: {
    textAlign: "center",
    fontSize: 14,
    color: COLORS.lightText,
    fontWeight: "500",
    fontFamily: TYPOGRAPHY.medium,
  },
  linkHighlight: {
    color: COLORS.primary,
    fontWeight: "700",
    fontFamily: TYPOGRAPHY.bold,
  },
  backLink: {
    textAlign: "center",
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "600",
    fontFamily: TYPOGRAPHY.bold,
  },
  
  // Network
  networkInfo: {
    backgroundColor: COLORS.overlay,
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 107, 53, 0.08)",
  },
  networkIconContainer: {
    position: "relative",
    marginRight: 10,
  },
  networkIcon: {
    fontSize: 18,
    color: COLORS.primary,
  },
  networkStatus: {
    position: "absolute",
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.success,
    top: 0,
    right: 0,
    borderWidth: 1.5,
    borderColor: "white",
  },
  networkTextContainer: {
    flex: 1,
  },
  networkName: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 2,
    fontFamily: TYPOGRAPHY.medium,
  },
  networkUrl: {
    fontSize: 10,
    color: COLORS.lightText,
    fontFamily: TYPOGRAPHY.regular,
  },
  
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-end",
  },
  datePickerContainer: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "65%",
  },
  datePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 107, 53, 0.1)",
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    flex: 1,
    fontFamily: TYPOGRAPHY.bold,
  },
  closeButton: {
    fontSize: 24,
    fontWeight: "300",
    color: COLORS.primary,
    paddingHorizontal: 10,
  },
  dateSelectors: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 8,
  },
  dateSelector: {
    flex: 1,
  },
  dateSelectorBackground: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 107, 53, 0.1)",
    overflow: "hidden",
  },
  dateSelectorLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 10,
    textAlign: "center",
    fontFamily: TYPOGRAPHY.bold,
  },
  dateScrollView: {
    maxHeight: 180,
  },
  dateOption: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 107, 53, 0.05)",
    alignItems: "center",
  },
  dateOptionSelected: {
    backgroundColor: "rgba(255, 107, 53, 0.08)",
  },
  dateOptionText: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: "500",
    fontFamily: TYPOGRAPHY.regular,
  },
  dateOptionTextSelected: {
    color: COLORS.primary,
    fontWeight: "700",
    fontFamily: TYPOGRAPHY.bold,
  },
  selectedDatePreview: {
    backgroundColor: "rgba(255, 107, 53, 0.05)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 107, 53, 0.1)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectedDateLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.text,
    fontFamily: TYPOGRAPHY.bold,
  },
  selectedDateText: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.primary,
    fontFamily: TYPOGRAPHY.bold,
  },
  confirmDateButton: {
    marginTop: 8,
  },
});