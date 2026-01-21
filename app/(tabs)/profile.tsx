import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { API_CONFIG } from "../../config";

interface Perfil {
  nombre: string;
  apellido: string;
  correo: string;
  fechaNacimiento?: string;
  fechaRegistro?: string;
  estado: string;
  rol: string;
  esAdministrador?: boolean;
  // Consumidor
  direccionConsumidor?: string;
  telefonoConsumidor?: string;
  cedulaConsumidor?: string;
  // Vendedor
  nombreEmpresa?: string;
  rucEmpresa?: string;
  direccionEmpresa?: string;
  telefonoEmpresa?: string;
  calificacionPromedio?: number;
}

// Componente para los círculos flotantes del fondo
const FloatingCirclesProfile = () => {
  return (
    <View style={styles.floatingContainer}>
      <View style={[styles.floatingCircle, styles.circle1]} />
      <View style={[styles.floatingCircle, styles.circle2]} />
      <View style={[styles.floatingCircle, styles.circle3]} />
      <View style={[styles.floatingCircle, styles.circle4]} />
    </View>
  );
};

export default function Profile() {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  
  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // 🔴 VERIFICAR SI ES VENDEDOR Y REDIRIGIR
    const verificarRol = async () => {
      const rol = await AsyncStorage.getItem("rol");
      if (rol === "VENDEDOR") {
        console.log("🚫 Vendedor intentando acceder a perfil de consumidor, redirigiendo...");
        router.replace("/vendedor/dashboard");
        return;
      }
      // Si es consumidor, cargar perfil
      cargarPerfil();
      startAnimations();
    };
    
    verificarRol();
  }, []);

  // SOLUCIÓN: Usar useFocusEffect para escuchar cuando la pantalla recibe foco
  useFocusEffect(
    useCallback(() => {
      console.log("🔄 Pantalla de perfil recibió foco");
      recargarPerfil();
      
      return () => {
        console.log("🧹 Limpiando foco de perfil");
      };
    }, [])
  );

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      })
    ]).start();
  };

  const cargarPerfil = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      
      if (!token) {
        console.log("🔐 No hay token, redirigiendo a WelcomeScreen");
        router.replace("/WelcomeScreen");
        return;
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}/usuarios/perfil`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al cargar perfil");
      }

      const data = await response.json();
      console.log("📊 Respuesta del perfil:", JSON.stringify(data, null, 2));
      setPerfil(data);
    } catch (error) {
      console.error("❌ Error al cargar perfil:", error);
      Alert.alert("Error", "No se pudo cargar el perfil. Por favor, intenta nuevamente.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Función para recargar el perfil
  const recargarPerfil = async () => {
    setRefreshing(true);
    await cargarPerfil();
  };

  const handleLogout = async () => {
    Alert.alert(
      "Cerrar sesión",
      "¿Estás seguro de que quieres cerrar sesión?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Cerrar sesión",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove([
                "authToken", 
                "user", 
                "token", 
                "rol", 
                "idUsuario",
                "idVendedor", 
                "idConsumidor",
                "isGuest",         
                "guestCart",      
                "guestLoginTime",  
                "searchCategory"   
              ]);
              
              console.log("✅ Sesión cerrada exitosamente");
              router.replace("/WelcomeScreen");
              
            } catch (error) {
              console.log("❌ Error al cerrar sesión:", error);
              Alert.alert("Error", "No se pudo cerrar sesión. Intenta nuevamente.");
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
        <View style={styles.loadingCircles}>
          <View style={[styles.loadingCircle, { backgroundColor: '#FF6B35' }]} />
          <View style={[styles.loadingCircle, { backgroundColor: '#3498DB' }]} />
          <View style={[styles.loadingCircle, { backgroundColor: '#9B59B6' }]} />
        </View>
      </View>
    );
  }

  if (!perfil) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Error al cargar perfil</Text>
        <Text style={styles.errorText}>
          No se pudo cargar la información del perfil
        </Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={recargarPerfil}
        >
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const InfoItem = ({ label, value }: { label: string; value?: string }) => (
    <Animated.View 
      style={[
        styles.infoItem,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || "N/A"}</Text>
    </Animated.View>
  );

  const ActionButton = ({
    children,
    onPress,
    variant = "primary",
    icon,
  }: {
    children: string;
    onPress: () => void;
    variant?: "primary" | "secondary";
    icon: string;
  }) => {
    const isPrimary = variant === "primary";

    return (
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }}
      >
        <TouchableOpacity
          style={[
            styles.actionButton,
            isPrimary ? styles.actionButtonPrimary : styles.actionButtonSecondary,
          ]}
          onPress={onPress}
          activeOpacity={0.7}
        >
          <View style={styles.actionButtonIconContainer}>
            <Text style={styles.actionButtonIcon}>{icon}</Text>
          </View>
          <Text
            style={[
              styles.actionButtonText,
              isPrimary
                ? styles.actionButtonTextPrimary
                : styles.actionButtonTextSecondary,
            ]}
          >
            {children}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const LogoutButton = () => (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }]
      }}
    >
      <TouchableOpacity 
        style={styles.logoutButton} 
        onPress={handleLogout}
        activeOpacity={0.7}
      >
        <View style={styles.logoutIconContainer}>
          <Text style={styles.logoutIcon}>🚪</Text>
        </View>
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={recargarPerfil}
          colors={["#FF6B35"]}
          tintColor="#FF6B35"
        />
      }
    >
      {/* Botón de recargar en la esquina */}
      <TouchableOpacity 
        style={styles.refreshButton}
        onPress={recargarPerfil}
      >
        <Text style={styles.refreshIcon}>🔄</Text>
      </TouchableOpacity>

      {/* 🔥 HEADER CON GRADIENTE Y CÍRCULOS */}
      <Animated.View 
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <FloatingCirclesProfile />
        
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {perfil.nombre?.charAt(0)}
              {perfil.apellido?.charAt(0)}
            </Text>
            <View style={styles.avatarRing} />
          </View>
          
          {/* Badge de rol */}
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>
              {perfil.rol === "CONSUMIDOR" && "🛒"}
              {perfil.rol === "VENDEDOR" && "🏪"}
              {perfil.rol === "ADMIN" && "🛡️"}
              {" "}{perfil.rol}
            </Text>
          </View>
        </View>

        <Text style={styles.headerLabel}>MI PERFIL</Text>
        <Text style={styles.headerName}>
          {perfil.nombre} {perfil.apellido}
        </Text>

        {/* Indicador de actualización si está refrescando */}
        {refreshing && (
          <View style={styles.updatingContainer}>
            <ActivityIndicator size="small" color="#FF6B35" />
            <Text style={styles.updatingText}>Actualizando...</Text>
          </View>
        )}

        {/* CORRECCIÓN: Siempre mostrar "Activo" si está logueado */}
        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, { backgroundColor: "#2ECC71" }]} />
          <Text style={styles.statusText}>🟢 Activo</Text>
        </View>

        {/* Info rápida */}
        <View style={styles.quickInfo}>
          <View style={styles.quickInfoItem}>
            <Text style={styles.quickInfoIcon}>📧</Text>
            <Text style={styles.quickInfoText} numberOfLines={1}>
              {perfil.correo}
            </Text>
          </View>
          {perfil.fechaRegistro && (
            <View style={styles.quickInfoItem}>
              <Text style={styles.quickInfoIcon}>📅</Text>
              <Text style={styles.quickInfoText}>
                Miembro desde {perfil.fechaRegistro?.split("T")[0]}
              </Text>
            </View>
          )}
        </View>
      </Animated.View>

      {/* 🔥 ACCIONES RÁPIDAS */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Acciones Disponibles</Text>
        <Text style={styles.sectionSubtitle}>Gestiona tu cuenta</Text>
        
        <View style={styles.actionsGrid}>
          {perfil.rol === "CONSUMIDOR" && (
            <>
              <ActionButton
                onPress={() => router.push("/consumidor/EditarPerfil")}
                icon="✏️"
              >
                Editar perfil
              </ActionButton>
              <ActionButton
                onPress={() => router.push("/(tabs)/Favoritos")}
                variant="secondary"
                icon="❤️"
              >
                Mis favoritos
              </ActionButton>
              <ActionButton
                onPress={() => router.push("/consumidor/MisPedidos")}
                variant="secondary"
                icon="📦"
              >
                Mis pedidos
              </ActionButton>
              <ActionButton
                onPress={() => router.push("/carrito" as any)}
                variant="secondary"
                icon="🛒"
              >
                Mi carrito
              </ActionButton>
            </>
          )}
          
          {/* 🚨 IMPORTANTE: VENDEDORES NO DEBERÍAN LLEGAR AQUÍ, PERO POR SI ACASO */}
          {perfil.rol === "VENDEDOR" && (
            <View style={{ padding: 20, alignItems: 'center', width: '100%' }}>
              <Text style={{ color: '#FF6B35', fontWeight: 'bold', fontSize: 16 }}>
                ⚠️ Vendedor detectado en perfil de consumidor
              </Text>
              <TouchableOpacity 
                style={{ 
                  backgroundColor: '#FF6B35', 
                  padding: 10, 
                  borderRadius: 8, 
                  marginTop: 10 
                }}
                onPress={() => router.replace("/vendedor/dashboard")}
              >
                <Text style={{ color: 'white', fontWeight: 'bold' }}>
                  Ir al dashboard de vendedor
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {perfil.rol === "ADMIN" && (
            <>
              <ActionButton
                onPress={() => router.push("/admin" as any)}
                icon="⚙️"
              >
                Panel Admin
              </ActionButton>
              <ActionButton
                onPress={() => router.push("/usuarios" as any)}
                variant="secondary"
                icon="👥"
              >
                Usuarios
              </ActionButton>
              <ActionButton
                onPress={() => router.push("/reportes" as any)}
                variant="secondary"
                icon="📈"
              >
                Reportes
              </ActionButton>
              <ActionButton
                onPress={() => router.push("/config" as any)}
                variant="secondary"
                icon="⚡"
              >
                Configuración
              </ActionButton>
            </>
          )}
        </View>
      </View>

      {/* 🔥 INFORMACIÓN PERSONAL */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información Personal</Text>
        <Text style={styles.sectionSubtitle}>Detalles de tu cuenta</Text>
        
        <View style={styles.infoCard}>
          <InfoItem label="Correo electrónico" value={perfil.correo} />
          <InfoItem label="Fecha de nacimiento" value={perfil.fechaNacimiento} />
          <InfoItem
            label="Fecha de registro"
            value={perfil.fechaRegistro?.split("T")[0]}
          />
        </View>
      </View>

      {/* 🔥 INFORMACIÓN ESPECÍFICA POR ROL */}
      {perfil.rol === "CONSUMIDOR" && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Perfil de Consumidor</Text>
          <Text style={styles.sectionSubtitle}>Información de contacto</Text>
          
          <View style={styles.infoCard}>
            <InfoItem label="Dirección" value={perfil.direccionConsumidor} />
            <InfoItem label="Teléfono" value={perfil.telefonoConsumidor} />
            <InfoItem label="Cédula" value={perfil.cedulaConsumidor} />
          </View>
        </View>
      )}

      {perfil.rol === "VENDEDOR" && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos de la Empresa</Text>
          <Text style={styles.sectionSubtitle}>Información comercial</Text>
          
          <View style={styles.infoCard}>
            <InfoItem label="Nombre de la empresa" value={perfil.nombreEmpresa} />
            <InfoItem label="RUC" value={perfil.rucEmpresa} />
            <InfoItem label="Dirección" value={perfil.direccionEmpresa} />
            <InfoItem label="Teléfono" value={perfil.telefonoEmpresa} />
            
            {perfil.calificacionPromedio !== undefined && (
              <View style={styles.ratingContainer}>
                <View style={styles.ratingIconContainer}>
                  <Text style={styles.ratingIcon}>⭐</Text>
                </View>
                <View>
                  <Text style={styles.ratingLabel}>Calificación promedio</Text>
                  <Text style={styles.ratingValue}>
                    {perfil.calificacionPromedio.toFixed(1)}/5.0
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>
      )}

      {perfil.rol === "ADMIN" && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Permisos Administrativos</Text>
          <Text style={styles.sectionSubtitle}>Control total del sistema</Text>
          
          <View style={styles.adminCard}>
            <View style={styles.adminIconContainer}>
              <Text style={styles.adminIcon}>🛡️</Text>
            </View>
            <Text style={styles.adminTitle}>Administrador</Text>
            <Text style={styles.adminDescription}>
              Tienes permisos completos para gestionar usuarios, productos, 
              vendedores y todas las configuraciones del sistema MercadoLocal.
            </Text>
          </View>
        </View>
      )}

      {/* 🔥 SEGURIDAD */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Seguridad</Text>
        <Text style={styles.sectionSubtitle}>Gestiona tu cuenta</Text>
        
        <View style={styles.securityCard}>
          <LogoutButton />
          
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => Alert.alert(
              "Eliminar cuenta",
              "Esta acción es permanente. ¿Estás seguro?",
              [
                { text: "Cancelar", style: "cancel" },
                { text: "Contactar soporte", onPress: () => {
                  Alert.alert("Soporte", "Para eliminar tu cuenta, contacta al soporte técnico.");
                }}
              ]
            )}
          >
            <View style={styles.deleteIconContainer}>
              <Text style={styles.deleteIcon}>🗑️</Text>
            </View>
            <Text style={styles.deleteText}>Eliminar mi cuenta</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 🔥 FOOTER */}
      <View style={styles.footer}>
        <View style={styles.footerContent}>
          <View style={styles.footerIconContainer}>
            <Text style={styles.footerIcon}>🌱</Text>
          </View>
          <View>
            <Text style={styles.footerTitle}>Gracias por ser parte de</Text>
            <Text style={styles.footerBrand}>MercadoLocal</Text>
          </View>
        </View>
        <Text style={styles.footerSubtitle}>
          Juntos apoyamos el comercio local y sostenible
        </Text>
        
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>v1.0.0 • MercadoLocal-IA</Text>
          <Text style={styles.versionSubtext}>© 2024 Todos los derechos reservados</Text>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  
  // 🔥 LOADING SCREEN
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
    fontFamily: "System",
  },
  loadingCircles: {
    flexDirection: "row",
    marginTop: 20,
    gap: 10,
  },
  loadingCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    opacity: 0.6,
  },
  
  // 🔥 ERROR SCREEN
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 20,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: "#FF6B35",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  
  // 🔥 REFRESH BUTTON
  refreshButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  refreshIcon: {
    fontSize: 18,
    color: "#FF6B35",
  },
  
  // 🔥 UPDATING INDICATOR
  updatingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    backgroundColor: "rgba(255, 107, 53, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  updatingText: {
    fontSize: 12,
    color: "#FF6B35",
    fontWeight: "500",
  },
  
  // 🔥 CÍRCULOS FLOTANTES
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
  
  // 🔥 HEADER
  header: {
    backgroundColor: "white",
    paddingTop: 60,
    paddingBottom: 40,
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
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
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
    width: 136,
    height: 136,
    borderRadius: 68,
    borderWidth: 3,
    borderColor: 'rgba(255, 107, 53, 0.2)',
  },
  avatarText: {
    fontSize: 42,
    fontWeight: "800",
    color: "white",
    fontFamily: "System",
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
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: "white",
    fontFamily: "System",
  },
  headerLabel: {
    fontSize: 11,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "#FF6B35",
    fontWeight: "800",
    marginBottom: 8,
    fontFamily: "System",
  },
  headerName: {
    fontSize: 32,
    fontWeight: "800",
    color: "#1e293b",
    marginBottom: 12,
    textAlign: "center",
    fontFamily: "System",
    letterSpacing: -0.5,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    fontSize: 14,
    color: "#2ECC71",
    fontWeight: "600",
    fontFamily: "System",
  },
  quickInfo: {
    width: '100%',
    gap: 10,
  },
  quickInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  quickInfoIcon: {
    fontSize: 20,
  },
  quickInfoText: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
    fontFamily: "System",
    flex: 1,
  },
  
  // 🔥 SECCIONES
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1e293b",
    fontFamily: "System",
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#64748b",
    fontFamily: "System",
    marginBottom: 20,
  },
  
  // 🔥 ACCIONES
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    minWidth: '48%',
    flex: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  actionButtonPrimary: {
    backgroundColor: "#FF6B35",
  },
  actionButtonSecondary: {
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "#FF6B35",
  },
  actionButtonIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: "center",
    alignItems: "center",
  },
  actionButtonIcon: {
    fontSize: 18,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "System",
    flex: 1,
  },
  actionButtonTextPrimary: {
    color: "white",
  },
  actionButtonTextSecondary: {
    color: "#FF6B35",
  },
  
  // 🔥 INFO CARDS
  infoCard: {
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
  infoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  infoLabel: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
    fontFamily: "System",
    flex: 1,
  },
  infoValue: {
    fontSize: 15,
    color: "#1e293b",
    fontWeight: "700",
    fontFamily: "System",
    textAlign: "right",
    flex: 1,
  },
  
  // 🔥 RATING
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 2,
    borderTopColor: "#f1f5f9",
  },
  ratingIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFF2E8",
    justifyContent: "center",
    alignItems: "center",
  },
  ratingIcon: {
    fontSize: 28,
    color: "#FF6B35",
  },
  ratingLabel: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "600",
    fontFamily: "System",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  ratingValue: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FF6B35",
    fontFamily: "System",
  },
  
  // 🔥 ADMIN CARD
  adminCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  adminIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FFF2E8",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  adminIcon: {
    fontSize: 32,
  },
  adminTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1e293b",
    fontFamily: "System",
    marginBottom: 12,
  },
  adminDescription: {
    fontSize: 15,
    color: "#64748b",
    fontFamily: "System",
    textAlign: "center",
    lineHeight: 22,
  },
  
  // 🔥 SEGURIDAD
  securityCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 24,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: "#FEE2E2",
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#FECACA",
  },
  logoutIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(220, 38, 38, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  logoutIcon: {
    fontSize: 20,
    color: "#DC2626",
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#DC2626",
    fontFamily: "System",
    flex: 1,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: "#f8f9fa",
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#e5e7eb",
  },
  deleteIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(107, 114, 128, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteIcon: {
    fontSize: 20,
    color: "#6B7280",
  },
  deleteText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#6B7280",
    fontFamily: "System",
    flex: 1,
  },
  
  // 🔥 FOOTER
  footer: {
    backgroundColor: "white",
    borderRadius: 24,
    padding: 32,
    marginHorizontal: 20,
    marginBottom: 40,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  footerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 16,
  },
  footerIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FF6B35",
    justifyContent: "center",
    alignItems: "center",
  },
  footerIcon: {
    fontSize: 28,
    color: "white",
  },
  footerTitle: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
    fontFamily: "System",
    marginBottom: 4,
  },
  footerBrand: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FF6B35",
    fontFamily: "System",
  },
  footerSubtitle: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
    marginBottom: 20,
    fontFamily: "System",
    lineHeight: 20,
  },
  versionContainer: {
    alignItems: "center",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    width: '100%',
  },
  versionText: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "600",
    fontFamily: "System",
  },
  versionSubtext: {
    fontSize: 11,
    color: "#cbd5e1",
    marginTop: 4,
    fontFamily: "System",
  },
});