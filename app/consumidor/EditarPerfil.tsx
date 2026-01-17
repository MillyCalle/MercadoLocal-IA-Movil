import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { API_CONFIG } from "../../config";

const { width, height } = Dimensions.get('window');

interface Perfil {
  nombre: string;
  apellido: string;
  correo: string;
  fechaNacimiento?: string;
  rol: string;
  direccionConsumidor?: string;
  telefonoConsumidor?: string;
  cedulaConsumidor?: string;
  nombreEmpresa?: string;
  rucEmpresa?: string;
  direccionEmpresa?: string;
  telefonoEmpresa?: string;
}

// Componente para los círculos flotantes (IDÉNTICO AL PROFILE)
const FloatingCirclesEdit = () => {
  return (
    <View style={styles.floatingContainer}>
      <View style={[styles.floatingCircle, styles.circle1]} />
      <View style={[styles.floatingCircle, styles.circle2]} />
      <View style={[styles.floatingCircle, styles.circle3]} />
      <View style={[styles.floatingCircle, styles.circle4]} />
    </View>
  );
};

export default function EditarPerfil() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [direccionConsumidor, setDireccionConsumidor] = useState("");
  const [telefonoConsumidor, setTelefonoConsumidor] = useState("");
  const [direccionEmpresa, setDireccionEmpresa] = useState("");
  const [telefonoEmpresa, setTelefonoEmpresa] = useState("");

  // Para el date picker
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date(1990, 0, 1));

  // Referencias para inputs
  const apellidoRef = useRef<TextInput>(null);
  const direccionRef = useRef<TextInput>(null);
  const telefonoRef = useRef<TextInput>(null);
  const direccionEmpresaRef = useRef<TextInput>(null);
  const telefonoEmpresaRef = useRef<TextInput>(null);

  // Estado para evitar que el teclado se muestre automáticamente
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    // Ocultar teclado inmediatamente al cargar
    Keyboard.dismiss();
    
    cargarPerfil();
    startAnimations();
    
    // Listeners para el teclado
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
      Keyboard.dismiss();
    };
  }, []);

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      })
    ]).start();
  };

  const cargarPerfil = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        router.replace("/auth/login" as any);
        return;
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}/usuarios/perfil`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Error al cargar perfil");

      const data = await response.json();
      setPerfil(data);

      setNombre(data.nombre || "");
      setApellido(data.apellido || "");
      setFechaNacimiento(data.fechaNacimiento || "");
      setDireccionConsumidor(data.direccionConsumidor || "");
      setTelefonoConsumidor(data.telefonoConsumidor || "");
      setDireccionEmpresa(data.direccionEmpresa || "");
      setTelefonoEmpresa(data.telefonoEmpresa || "");

      if (data.fechaNacimiento) {
        const dateParts = data.fechaNacimiento.split('-');
        if (dateParts.length === 3) {
          const year = parseInt(dateParts[0]);
          const month = parseInt(dateParts[1]) - 1;
          const day = parseInt(dateParts[2]);
          setSelectedDate(new Date(year, month, day));
        }
      }
    } catch (error) {
      console.error("❌ Error al cargar perfil:", error);
      Alert.alert("Error", "No se pudo cargar el perfil");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (date) {
      const adjustedDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
      setSelectedDate(adjustedDate);
      
      const year = adjustedDate.getFullYear();
      const month = String(adjustedDate.getMonth() + 1).padStart(2, '0');
      const day = String(adjustedDate.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      
      setFechaNacimiento(formattedDate);
    }
  };

  const showDatePickerModal = () => {
    Keyboard.dismiss();
    setShowDatePicker(true);
  };

  const closeDatePicker = () => {
    setShowDatePicker(false);
  };

  const formatDateForDisplay = (dateStr: string) => {
    if (!dateStr) return "Seleccionar fecha";
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const guardarCambios = async () => {
    try {
      setSaving(true);
      Keyboard.dismiss();
      
      const token = await AsyncStorage.getItem("authToken");
      if (!token) throw new Error("No autorizado");

      const body: any = {
        nombre,
        apellido,
        fechaNacimiento: fechaNacimiento || null,
      };

      if (perfil?.rol === "CONSUMIDOR") {
        body.direccionConsumidor = direccionConsumidor;
        body.telefonoConsumidor = telefonoConsumidor;
      }

      if (perfil?.rol === "VENDEDOR") {
        body.direccionEmpresa = direccionEmpresa;
        body.telefonoEmpresa = telefonoEmpresa;
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}/usuarios/perfil`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error("Error al actualizar perfil");
      }

      Alert.alert(
        "✅ Perfil actualizado",
        "Tus cambios se guardaron correctamente",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (error: any) {
      console.error("❌ Error al guardar:", error);
      Alert.alert("Error", error.message || "No se pudo guardar los cambios");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  if (!perfil) return null;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <TouchableOpacity 
        activeOpacity={1} 
        style={styles.mainContainer}
        onPress={Keyboard.dismiss}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          {/* HEADER CON CÍRCULOS FLOTANTES */}
          <Animated.View 
            style={[
              styles.header,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
            ]}
          >
            <FloatingCirclesEdit />
            
            <View style={styles.headerTop}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <Text style={styles.backButtonText}>←</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>EDITAR PERFIL</Text>
              <View style={styles.headerIcon}>
                <Text style={styles.headerIconText}>✏️</Text>
              </View>
            </View>
            
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {perfil.nombre?.charAt(0)}
                  {perfil.apellido?.charAt(0)}
                </Text>
                <View style={styles.avatarRing} />
              </View>
              
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>
                  {perfil.rol === "CONSUMIDOR" ? "✏️" : "🏪"} EDITANDO
                </Text>
              </View>
            </View>

            <Text style={styles.headerLabel}>EDITANDO INFORMACIÓN</Text>
            <Text style={styles.headerName}>
              {perfil.nombre} {perfil.apellido}
            </Text>

            <View style={styles.statusContainer}>
              <View style={[styles.statusDot, { backgroundColor: "#FF6B35" }]} />
              <Text style={styles.statusText}>✏️ Editando información</Text>
            </View>
          </Animated.View>

          {/* DATOS PERSONALES */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Text style={styles.sectionIcon}>👤</Text>
              </View>
              <View>
                <Text style={styles.sectionTitle}>Datos Personales</Text>
                <Text style={styles.sectionSubtitle}>Actualiza tu información básica</Text>
              </View>
            </View>
            
            <View style={styles.card}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nombre</Text>
                <TextInput
                  style={styles.input}
                  value={nombre}
                  onChangeText={setNombre}
                  placeholder="Ingresa tu nombre"
                  placeholderTextColor="#94a3b8"
                  returnKeyType="next"
                  onSubmitEditing={() => apellidoRef.current?.focus()}
                  blurOnSubmit={false}
                  onFocus={() => {
                    // Scroll al campo cuando se enfoca
                    setTimeout(() => {
                      apellidoRef.current?.measure((x, y, width, height, pageX, pageY) => {
                        // Scroll suave al campo
                      });
                    }, 100);
                  }}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Apellido</Text>
                <TextInput
                  ref={apellidoRef}
                  style={styles.input}
                  value={apellido}
                  onChangeText={setApellido}
                  placeholder="Ingresa tu apellido"
                  placeholderTextColor="#94a3b8"
                  returnKeyType="next"
                  onSubmitEditing={() => {
                    if (perfil?.rol === "CONSUMIDOR") {
                      direccionRef.current?.focus();
                    } else if (perfil?.rol === "VENDEDOR") {
                      direccionEmpresaRef.current?.focus();
                    } else {
                      Keyboard.dismiss();
                    }
                  }}
                  blurOnSubmit={false}
                />
              </View>
              
              {/* Campo de fecha */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Fecha de Nacimiento</Text>
                <TouchableOpacity 
                  style={styles.datePickerButton}
                  onPress={showDatePickerModal}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.dateText,
                    !fechaNacimiento && styles.datePlaceholder
                  ]}>
                    {fechaNacimiento ? formatDateForDisplay(fechaNacimiento) : "Seleccionar fecha"}
                  </Text>
                  <View style={styles.calendarButton}>
                    <Text style={styles.calendarButtonIcon}>📅</Text>
                  </View>
                </TouchableOpacity>
                <Text style={styles.hint}>Presiona para seleccionar fecha</Text>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Correo electrónico
                </Text>
                <View style={styles.lockedField}>
                  <Text style={styles.lockedText}>{perfil.correo}</Text>
                  <View style={styles.lockBadge}>
                    <Text style={styles.lockBadgeText}>🔒</Text>
                  </View>
                </View>
                <Text style={styles.hint}>Este campo no se puede modificar</Text>
              </View>
            </View>
          </View>

          {/* DATOS DE CONSUMIDOR */}
          {perfil.rol === "CONSUMIDOR" && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIconContainer}>
                  <Text style={styles.sectionIcon}>🛒</Text>
                </View>
                <View>
                  <Text style={styles.sectionTitle}>Datos de Consumidor</Text>
                  <Text style={styles.sectionSubtitle}>Información de contacto</Text>
                </View>
              </View>
              
              <View style={styles.card}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Dirección</Text>
                  <TextInput
                    ref={direccionRef}
                    style={[styles.input, styles.inputMultiline]}
                    value={direccionConsumidor}
                    onChangeText={setDireccionConsumidor}
                    placeholder="Ingresa tu dirección completa"
                    placeholderTextColor="#94a3b8"
                    multiline
                    numberOfLines={3}
                    returnKeyType="next"
                    onSubmitEditing={() => telefonoRef.current?.focus()}
                    blurOnSubmit={false}
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Teléfono</Text>
                  <TextInput
                    ref={telefonoRef}
                    style={styles.input}
                    value={telefonoConsumidor}
                    onChangeText={setTelefonoConsumidor}
                    placeholder="0987654321"
                    placeholderTextColor="#94a3b8"
                    keyboardType="phone-pad"
                    returnKeyType="done"
                    onSubmitEditing={Keyboard.dismiss}
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>
                    Cédula
                  </Text>
                  <View style={styles.lockedField}>
                    <Text style={styles.lockedText}>{perfil.cedulaConsumidor || "No especificada"}</Text>
                    <View style={styles.lockBadge}>
                      <Text style={styles.lockBadgeText}>🔒</Text>
                    </View>
                  </View>
                  <Text style={styles.hint}>Este campo no se puede modificar</Text>
                </View>
              </View>
            </View>
          )}

          {/* DATOS DE VENDEDOR */}
          {perfil.rol === "VENDEDOR" && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIconContainer}>
                  <Text style={styles.sectionIcon}>🏪</Text>
                </View>
                <View>
                  <Text style={styles.sectionTitle}>Datos de la Empresa</Text>
                  <Text style={styles.sectionSubtitle}>Información comercial</Text>
                </View>
              </View>
              
              <View style={styles.card}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>
                    Nombre de la Empresa
                  </Text>
                  <View style={styles.lockedField}>
                    <Text style={styles.lockedText}>{perfil.nombreEmpresa || "No especificada"}</Text>
                    <View style={styles.lockBadge}>
                      <Text style={styles.lockBadgeText}>🔒</Text>
                    </View>
                  </View>
                  <Text style={styles.hint}>Este campo no se puede modificar</Text>
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>
                    RUC
                  </Text>
                  <View style={styles.lockedField}>
                    <Text style={styles.lockedText}>{perfil.rucEmpresa || "No especificado"}</Text>
                    <View style={styles.lockBadge}>
                      <Text style={styles.lockBadgeText}>🔒</Text>
                    </View>
                  </View>
                  <Text style={styles.hint}>Este campo no se puede modificar</Text>
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Dirección de la Empresa</Text>
                  <TextInput
                    ref={direccionEmpresaRef}
                    style={[styles.input, styles.inputMultiline]}
                    value={direccionEmpresa}
                    onChangeText={setDireccionEmpresa}
                    placeholder="Ingresa la dirección de la empresa"
                    placeholderTextColor="#94a3b8"
                    multiline
                    numberOfLines={3}
                    returnKeyType="next"
                    onSubmitEditing={() => telefonoEmpresaRef.current?.focus()}
                    blurOnSubmit={false}
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Teléfono de la Empresa</Text>
                  <TextInput
                    ref={telefonoEmpresaRef}
                    style={styles.input}
                    value={telefonoEmpresa}
                    onChangeText={setTelefonoEmpresa}
                    placeholder="Teléfono empresarial"
                    placeholderTextColor="#94a3b8"
                    keyboardType="phone-pad"
                    returnKeyType="done"
                    onSubmitEditing={Keyboard.dismiss}
                  />
                </View>
              </View>
            </View>
          )}

          {/* BOTONES */}
          <View style={styles.buttonsSection}>
            <Animated.View 
              style={[
                styles.buttonContainer,
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
              ]}
            >
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={guardarCambios}
                disabled={saving}
                activeOpacity={0.7}
              >
                {saving ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Text style={styles.buttonIcon}>💾</Text>
                    <Text style={styles.saveButtonText}>Guardar Cambios</Text>
                  </>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => router.back()}
                disabled={saving}
                activeOpacity={0.7}
              >
                <Text style={styles.buttonIcon}>✕</Text>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* FOOTER */}
          <View style={styles.footer}>
            <View style={styles.footerIconContainer}>
              <Text style={styles.footerIcon}>✏️</Text>
            </View>
            <View>
              <Text style={styles.footerTitle}>Editando perfil en</Text>
              <Text style={styles.footerBrand}>MercadoLocal</Text>
            </View>
            <Text style={styles.footerSubtitle}>
              Actualiza tu información para una mejor experiencia
            </Text>
          </View>
        </ScrollView>
      </TouchableOpacity>

      {/* DATE PICKER MODAL PARA iOS */}
      {showDatePicker && Platform.OS === 'ios' && (
        <Modal
          transparent={true}
          animationType="slide"
          visible={showDatePicker}
          onRequestClose={closeDatePicker}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={closeDatePicker}>
                  <Text style={styles.modalCancel}>Cancelar</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Fecha de Nacimiento</Text>
                <TouchableOpacity onPress={closeDatePicker}>
                  <Text style={styles.modalDone}>Listo</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.pickerContainer}>
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display="spinner"
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                  style={styles.datePicker}
                />
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* DATE PICKER PARA ANDROID */}
      {showDatePicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  mainContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#FF6B35",
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  
  // CÍRCULOS FLOTANTES (IDÉNTICO AL PROFILE)
  floatingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  floatingCircle: {
    position: 'absolute',
    borderRadius: 100,
    opacity: 0.15,
  },
  circle1: {
    width: 120,
    height: 120,
    backgroundColor: '#FF6B35',
    top: 20,
    left: 20,
  },
  circle2: {
    width: 80,
    height: 80,
    backgroundColor: '#3498DB',
    top: 60,
    right: 30,
  },
  circle3: {
    width: 100,
    height: 100,
    backgroundColor: '#9B59B6',
    bottom: 40,
    left: 40,
  },
  circle4: {
    width: 60,
    height: 60,
    backgroundColor: '#2ECC71',
    bottom: 80,
    right: 50,
  },
  
  // HEADER
  header: {
    backgroundColor: "white",
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: "center",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: '100%',
    marginBottom: 20,
    zIndex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  backButtonText: {
    fontSize: 24,
    color: "#FF6B35",
    fontWeight: "bold",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1e293b",
    letterSpacing: 0.5,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF2E8",
    justifyContent: "center",
    alignItems: "center",
  },
  headerIconText: {
    fontSize: 20,
    color: "#FF6B35",
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
    zIndex: 1,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#FF6B35",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#FF6B35",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
    position: 'relative',
  },
  avatarRing: {
    position: 'absolute',
    width: 116,
    height: 116,
    borderRadius: 58,
    borderWidth: 3,
    borderColor: 'rgba(255, 107, 53, 0.2)',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: "800",
    color: "white",
  },
  roleBadge: {
    position: 'absolute',
    bottom: -10,
    backgroundColor: "#FF6B35",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 2,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: "white",
  },
  headerLabel: {
    fontSize: 11,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "#FF6B35",
    fontWeight: "800",
    marginBottom: 8,
    zIndex: 1,
  },
  headerName: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1e293b",
    marginBottom: 12,
    textAlign: "center",
    letterSpacing: -0.5,
    zIndex: 1,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 1,
    marginBottom: 10,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    fontSize: 14,
    color: "#FF6B35",
    fontWeight: "600",
  },
  
  // SECCIONES
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  sectionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFF2E8",
    justifyContent: "center",
    alignItems: "center",
  },
  sectionIcon: {
    fontSize: 22,
    color: "#FF6B35",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1e293b",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#64748b",
  },
  
  // CARD
  card: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  
  // INPUTS
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#f8f9fa",
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: "#1e293b",
    fontWeight: "500",
  },
  inputMultiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  
  // DATE PICKER
  datePickerButton: {
    backgroundColor: "#f8f9fa",
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 15,
    color: "#1e293b",
    fontWeight: "500",
  },
  datePlaceholder: {
    color: "#94a3b8",
  },
  calendarButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFF2E8",
    justifyContent: "center",
    alignItems: "center",
  },
  calendarButtonIcon: {
    fontSize: 18,
    color: "#FF6B35",
  },
  
  // CAMPOS BLOQUEADOS
  lockedField: {
    backgroundColor: "#f3f4f6",
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lockedText: {
    fontSize: 15,
    color: "#64748b",
    fontWeight: "500",
    flex: 1,
  },
  lockBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
  },
  lockBadgeText: {
    fontSize: 14,
    color: "#DC2626",
  },
  
  hint: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 6,
    fontStyle: "italic",
  },
  
  // BOTONES
  buttonsSection: {
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 30,
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    gap: 12,
  },
  saveButton: {
    backgroundColor: "#FF6B35",
    shadowColor: "#FF6B35",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  cancelButton: {
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "#e5e7eb",
  },
  buttonIcon: {
    fontSize: 20,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "white",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#64748b",
  },
  
  // FOOTER
  footer: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 20,
    marginBottom: 40,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  footerIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FF6B35",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  footerIcon: {
    fontSize: 28,
    color: "white",
  },
  footerTitle: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
    marginBottom: 4,
    textAlign: "center",
  },
  footerBrand: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FF6B35",
    marginBottom: 12,
    textAlign: "center",
  },
  footerSubtitle: {
    fontSize: 13,
    color: "#94a3b8",
    textAlign: "center",
  },
  
  // MODAL PARA DATE PICKER (iOS)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalCancel: {
    fontSize: 16,
    color: '#6b7280',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1f2937',
  },
  modalDone: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B35',
  },
  pickerContainer: {
    padding: 20,
  },
  datePicker: {
    height: 200,
    width: '100%',
  },
});