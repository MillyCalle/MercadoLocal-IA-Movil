import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { API_CONFIG } from "../../config";

const { width } = Dimensions.get("window");
const API_BASE_URL = API_CONFIG.BASE_URL;

interface PerfilVendedor {
  nombre: string;
  apellido: string;
  correo: string;
  fechaNacimiento?: string;
  fechaRegistro?: string;
  estado: string;
  rol: string;
  // Vendedor
  nombreEmpresa?: string;
  rucEmpresa?: string;
  direccionEmpresa?: string;
  telefonoEmpresa?: string;
  calificacionPromedio?: number;
  totalProductos?: number;
  totalVentas?: number;
  totalPedidos?: number;
  totalIngresos?: number;
  idVendedor?: string;
  id?: string;
  _id?: string;
}

interface EstadisticasDashboard {
  ingresosTotales: number;
  pedidos: number;
  productosDisponibles: number;
  totalProductos?: number;
  totalVentas?: number;
  totalPedidos?: number;
  totalIngresos?: number;
  calificacionPromedio?: number;
}

interface Pedido {
  id: string;
  numero: string;
  cliente: string;
  estado: string;
  total: number;
  fecha?: string;
}

// Componente para los círculos flotantes del fondo
const FloatingCirclesVendedor = () => {
  return (
    <View style={styles.floatingContainer}>
      <View style={[styles.floatingCircle, styles.circle1]} />
      <View style={[styles.floatingCircle, styles.circle2]} />
      <View style={[styles.floatingCircle, styles.circle3]} />
      <View style={[styles.floatingCircle, styles.circle4]} />
    </View>
  );
};

export default function MiPerfil() {
  const [perfil, setPerfil] = useState<PerfilVendedor | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [estadisticas, setEstadisticas] = useState<EstadisticasDashboard>({
    ingresosTotales: 0,
    pedidos: 0,
    productosDisponibles: 0,
    calificacionPromedio: 0
  });
  const [pedidosRecientes, setPedidosRecientes] = useState<Pedido[]>([]);
  const router = useRouter();
  
  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    const cargarTodo = async () => {
      const rol = await AsyncStorage.getItem("rol");
      console.log("🔍 Verificando rol en perfil vendedor:", rol);
      
      if (rol !== "VENDEDOR") {
        console.log("🚫 No es vendedor, redirigiendo a tabs...");
        router.replace("/(tabs)");
        return;
      }
      
      await cargarDatosCompletos();
      startAnimations();
    };
    
    cargarTodo();
  }, []);

  useFocusEffect(
    useCallback(() => {
      console.log("🔄 Pantalla de perfil vendedor recibió foco");
      recargarPerfil();
      
      return () => {
        console.log("🧹 Limpiando foco de perfil vendedor");
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

  // 🔥 FUNCIÓN PRINCIPAL: Cargar todos los datos como en el dashboard
  const cargarDatosCompletos = async () => {
    try {
      setLoading(true);
      
      const token = await AsyncStorage.getItem("authToken");
      const userDataString = await AsyncStorage.getItem("user");
      
      if (!token || !userDataString) {
        console.log("🔐 No hay token o usuario, redirigiendo...");
        router.replace("/WelcomeScreen");
        return;
      }

      const userData = JSON.parse(userDataString);
      const vendedorId = userData.idVendedor || userData.id || userData._id;
      
      if (!vendedorId) {
        throw new Error("No se encontró ID del vendedor");
      }
      
      // 1. Cargar perfil básico
      await cargarPerfilVendedor(token);
      
      // 2. Cargar estadísticas del dashboard
      await cargarEstadisticasDashboard(token, vendedorId);
      
      // 3. Cargar pedidos recientes (pero no se mostrarán en la UI según solicitud)
      await cargarPedidosRecientesDashboard(token, vendedorId);
      
    } catch (error: any) {
      console.error("❌ Error al cargar datos completos:", error);
      Alert.alert("Error", "No se pudieron cargar los datos del vendedor");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const cargarPerfilVendedor = async (token: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/usuarios/perfil`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al cargar perfil del vendedor");
      }

      const data = await response.json();
      console.log("📊 Perfil del vendedor cargado:", data);
      setPerfil(data);
      return data;
    } catch (error) {
      console.error("❌ Error al cargar perfil:", error);
      throw error;
    }
  };

  const cargarEstadisticasDashboard = async (token: string, vendedorId: string) => {
    try {
      console.log(`📡 Cargando estadísticas para vendedor: ${vendedorId}`);
      const response = await fetch(
        `${API_BASE_URL}/vendedor/${vendedorId}/estadisticas`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("📊 Estadísticas cargadas:", data);
        
        setEstadisticas({
          ingresosTotales: data.ingresosTotales || data.ingresos || 0,
          pedidos: data.totalPedidos || data.pedidos || 0,
          productosDisponibles: data.productosDisponibles || data.productos || 0,
          totalProductos: data.productosDisponibles || data.productos || 0,
          totalVentas: data.totalVentas || data.ventas || 0,
          totalPedidos: data.totalPedidos || data.pedidos || 0,
          totalIngresos: data.ingresosTotales || data.ingresos || 0,
          calificacionPromedio: data.calificacionPromedio || perfil?.calificacionPromedio || 0
        });
        
        return data;
      } else {
        console.log("⚠️ No se pudieron cargar estadísticas específicas");
        // Si falla, usar datos del perfil
        return null;
      }
    } catch (error) {
      console.error("❌ Error cargando estadísticas:", error);
      return null;
    }
  };

  const getClienteNombre = (pedido: any): string => {
    if (pedido.clienteNombre) return pedido.clienteNombre;
    if (pedido.nombreCliente) return pedido.nombreCliente;
    if (pedido.cliente) {
      if (typeof pedido.cliente === 'string') return pedido.cliente;
      if (pedido.cliente.nombre) {
        return `${pedido.cliente.nombre || ''} ${pedido.cliente.apellido || ''}`.trim();
      }
    }
    return "Cliente";
  };

  const cargarPedidosRecientesDashboard = async (token: string, vendedorId: string) => {
    try {
      console.log(`📡 Cargando pedidos recientes para vendedor: ${vendedorId}`);
      const response = await fetch(
        `${API_BASE_URL}/vendedor/${vendedorId}/pedidos/recientes`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("📦 Pedidos recientes cargados:", data);
        
        let pedidosFormateados: Pedido[] = [];
        
        if (Array.isArray(data)) {
          pedidosFormateados = data.map((pedido: any) => ({
            id: pedido.id || pedido._id || pedido.idPedido || "N/A",
            numero: pedido.numero || pedido.id || pedido._id || "N/A",
            cliente: getClienteNombre(pedido),
            estado: pedido.estado || "PENDIENTE",
            total: pedido.total || pedido.montoTotal || pedido.precioTotal || 0,
            fecha: pedido.fecha || pedido.fechaCreacion || pedido.createdAt || new Date().toISOString(),
          }));
        }
        
        // Guardamos los pedidos pero no los mostramos en la UI según solicitud
        setPedidosRecientes(pedidosFormateados.slice(0, 3));
      } else {
        console.log("⚠️ No se pudieron cargar pedidos recientes");
        setPedidosRecientes([]);
      }
    } catch (error) {
      console.error("❌ Error cargando pedidos recientes:", error);
      setPedidosRecientes([]);
    }
  };

  const recargarPerfil = async () => {
    setRefreshing(true);
    await cargarDatosCompletos();
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
        <Text style={styles.loadingText}>Cargando perfil del vendedor...</Text>
      </View>
    );
  }

  if (!perfil) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Error al cargar perfil</Text>
        <Text style={styles.errorText}>
          No se pudo cargar la información del perfil del vendedor
        </Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={cargarDatosCompletos}
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
      <Text style={styles.infoValue}>{value || "No especificado"}</Text>
    </Animated.View>
  );

  const StatCard = ({ title, value, icon, color }: { title: string; value: string | number; icon: string; color: string }) => (
    <Animated.View
      style={[
        styles.statCard,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          backgroundColor: color + '15',
          borderColor: color + '30',
        }
      ]}
    >
      <View style={[styles.statIconContainer, { backgroundColor: color + '30' }]}>
        <Text style={[styles.statIcon, { color }]}>{icon}</Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </Animated.View>
  );

  const ActionButton = ({ title, onPress, icon, color = "#FF6B35" }: { title: string; onPress: () => void; icon: string; color?: string }) => (
    <TouchableOpacity
      style={[styles.actionButton, { borderColor: color }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.actionIconContainer, { backgroundColor: color + '20' }]}>
        <Text style={[styles.actionIcon, { color }]}>{icon}</Text>
      </View>
      <Text style={[styles.actionText, { color }]}>{title}</Text>
    </TouchableOpacity>
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
      {/* Botón de recargar */}
      <TouchableOpacity 
        style={styles.refreshButton}
        onPress={recargarPerfil}
      >
        <Text style={styles.refreshIcon}>🔄</Text>
      </TouchableOpacity>

      {/* HEADER */}
      <Animated.View 
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <FloatingCirclesVendedor />
        
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {perfil.nombre?.charAt(0)}
              {perfil.apellido?.charAt(0)}
            </Text>
            <View style={styles.avatarRing} />
          </View>
          
          {/* Badge de vendedor */}
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>
              🏪 VENDEDOR
            </Text>
          </View>
        </View>

        <Text style={styles.headerLabel}>MI PERFIL DE VENDEDOR</Text>
        <Text style={styles.headerName}>
          {perfil.nombre} {perfil.apellido}
        </Text>

        {perfil.nombreEmpresa && (
          <Text style={styles.companyName}>
            {perfil.nombreEmpresa}
          </Text>
        )}

        {/* Indicador de estado */}
        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, { backgroundColor: "#2ECC71" }]} />
          <Text style={styles.statusText}>🟢 Activo</Text>
        </View>
      </Animated.View>

      {/* 🔥 ESTADÍSTICAS (USANDO DATOS DEL DASHBOARD) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Estadísticas de Negocio</Text>
        <Text style={styles.sectionSubtitle}>Datos en tiempo real de tu actividad</Text>
        
        <View style={styles.statsGrid}>
          <StatCard 
            title="Productos Activos" 
            value={estadisticas.productosDisponibles || estadisticas.totalProductos || 0} 
            icon="📦" 
            color="#3498DB" 
          />
          <StatCard 
            title="Pedidos Totales" 
            value={estadisticas.pedidos || estadisticas.totalPedidos || 0} 
            icon="📋" 
            color="#2ECC71" 
          />
          <StatCard 
            title="Ventas Totales" 
            value={estadisticas.totalVentas || 0} 
            icon="💰" 
            color="#9B59B6" 
          />
          {/* Reemplazado Ingresos Totales con Calificación Promedio */}
          <StatCard 
            title="Calificación" 
            value={`${(estadisticas.calificacionPromedio || perfil?.calificacionPromedio || 0).toFixed(1)}/5.0`} 
            icon="⭐" 
            color="#FFD700" 
          />
        </View>
      </View>

      {/* COMENTADO: PEDIDOS RECIENTES - Ya está en el inicio según solicitud */}
      {/* No se muestra la sección de pedidos recientes */}

      {/* ACCIONES RÁPIDAS */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Acciones</Text>
        <Text style={styles.sectionSubtitle}>Gestiona tu negocio</Text>
        
        <View style={styles.actionsGrid}>
          <ActionButton 
            title="Editar perfil" 
            onPress={() => Alert.alert("Funcionalidad en desarrollo", "Próximamente disponible")} 
            icon="✏️" 
          />
          <ActionButton 
            title="Dashboard" 
            onPress={() => router.push("/vendedor/dashboard")} 
            icon="📊" 
            color="#3498DB"
          />
          <ActionButton 
            title="Productos" 
            onPress={() => router.push("/vendedor/gestionar-productos")} 
            icon="📦" 
            color="#2ECC71"
          />
          <ActionButton 
            title="Pedidos" 
            onPress={() => router.push("/vendedor/gestionar-pedidos")} 
            icon="📋" 
            color="#9B59B6"
          />
        </View>
      </View>

      {/* INFORMACIÓN DE LA EMPRESA */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información de la Empresa</Text>
        <Text style={styles.sectionSubtitle}>Datos comerciales</Text>
        
        <View style={styles.infoCard}>
          <InfoItem label="Nombre de la empresa" value={perfil.nombreEmpresa} />
          <InfoItem label="RUC" value={perfil.rucEmpresa} />
          <InfoItem label="Dirección" value={perfil.direccionEmpresa} />
          <InfoItem label="Teléfono" value={perfil.telefonoEmpresa} />
          <InfoItem label="Correo electrónico" value={perfil.correo} />
          <InfoItem 
            label="Calificación promedio" 
            value={perfil.calificacionPromedio ? `${perfil.calificacionPromedio.toFixed(1)}/5.0` : "Sin calificaciones"} 
          />
          <InfoItem label="Fecha de registro" value={perfil.fechaRegistro?.split("T")[0]} />
        </View>
      </View>

      {/* INFORMACIÓN PERSONAL */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información Personal</Text>
        <Text style={styles.sectionSubtitle}>Datos del propietario</Text>
        
        <View style={styles.infoCard}>
          <InfoItem label="Nombre completo" value={`${perfil.nombre} ${perfil.apellido}`} />
          <InfoItem label="Correo electrónico" value={perfil.correo} />
          <InfoItem label="Fecha de nacimiento" value={perfil.fechaNacimiento} />
          <InfoItem label="Estado de cuenta" value={perfil.estado} />
          <InfoItem label="Rol" value={perfil.rol} />
        </View>
      </View>

      {/* SEGURIDAD */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Seguridad</Text>
        <Text style={styles.sectionSubtitle}>Gestiona tu cuenta</Text>
        
        <View style={styles.securityCard}>
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
        </View>
      </View>

      {/* FOOTER */}
      <View style={styles.footer}>
        <View style={styles.footerContent}>
          <View style={styles.footerIconContainer}>
            <Text style={styles.footerIcon}>🏪</Text>
          </View>
          <View>
            <Text style={styles.footerTitle}>Vendedor Verificado</Text>
            <Text style={styles.footerBrand}>MercadoLocal</Text>
          </View>
        </View>
        <Text style={styles.footerSubtitle}>
          Tu negocio local crece con nosotros
        </Text>
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
  
  // LOADING
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
  
  // ERROR
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
  
  // REFRESH BUTTON
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
  
  // CÍRCULOS FLOTANTES
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
    backgroundColor: '#2ECC71',
    bottom: 40,
    left: 40,
  },
  circle4: {
    width: 60,
    height: 60,
    backgroundColor: '#9B59B6',
    bottom: 80,
    right: 50,
  },
  
  // HEADER
  header: {
    backgroundColor: "white",
    paddingTop: 60,
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
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#FF6B35",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#FF6B35",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    position: 'relative',
  },
  avatarRing: {
    position: 'absolute',
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 3,
    borderColor: 'rgba(255, 107, 53, 0.2)',
  },
  avatarText: {
    fontSize: 32,
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
  },
  headerName: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1e293b",
    marginBottom: 4,
    textAlign: "center",
  },
  companyName: {
    fontSize: 18,
    color: "#64748b",
    fontWeight: "600",
    marginBottom: 16,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 14,
    color: "#2ECC71",
    fontWeight: "600",
  },
  
  // SECCIONES
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1e293b",
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 20,
  },
  
  // ESTADÍSTICAS
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '48%',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statIcon: {
    fontSize: 24,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1e293b",
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  
  // PEDIDOS (se mantienen los estilos por si se vuelven a usar)
  pedidosContainer: {
    gap: 12,
  },
  pedidoCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  pedidoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  pedidoNumero: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2C3E50",
    fontFamily: "System",
  },
  estadoBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  estadoText: {
    fontSize: 11,
    fontWeight: "700",
    fontFamily: "System",
  },
  pedidoCliente: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 6,
    fontFamily: "System",
  },
  pedidoFecha: {
    fontSize: 12,
    color: "#94a3b8",
    marginBottom: 12,
    fontFamily: "System",
  },
  pedidoFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  pedidoTotalLabel: {
    fontSize: 14,
    color: "#64748b",
    fontFamily: "System",
  },
  pedidoTotal: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FF6B35",
    fontFamily: "System",
  },
  
  // ACCIONES
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    minWidth: '48%',
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: "white",
  },
  actionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  actionIcon: {
    fontSize: 18,
    fontWeight: "bold",
  },
  actionText: {
    fontSize: 14,
    fontWeight: "700",
    flex: 1,
  },
  
  // INFO CARD
  infoCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  infoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  infoLabel: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: "#1e293b",
    fontWeight: "600",
    textAlign: "right",
    flex: 1,
  },
  
  // SEGURIDAD
  securityCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: "#FEE2E2",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
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
    flex: 1,
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
  footerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 16,
  },
  footerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FF6B35",
    justifyContent: "center",
    alignItems: "center",
  },
  footerIcon: {
    fontSize: 24,
    color: "white",
  },
  footerTitle: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
    marginBottom: 4,
  },
  footerBrand: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FF6B35",
  },
  footerSubtitle: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
    marginTop: 8,
  },
});