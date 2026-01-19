// app/consumidor/MisPedidos.tsx
import { FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { API_CONFIG } from '../../config';

// Tipos de datos
interface ProductoPedido {
  nombre: string;
  cantidad: number;
  precio: number;
}

interface Pedido {
  idPedido: string;
  id?: string;
  fechaPedido: string;
  estadoPedido: string;
  estadoSeguimiento?: string;
  total: number;
  productos: ProductoPedido[];
  direccionEntrega: string;
  metodoPago?: string;
  pagado?: boolean;
}

// Componente para los círculos flotantes del fondo
const FloatingCircles = () => {
  return (
    <View style={styles.floatingContainer}>
      <View style={[styles.floatingCircle, styles.circle1]} />
      <View style={[styles.floatingCircle, styles.circle2]} />
      <View style={[styles.floatingCircle, styles.circle3]} />
      <View style={[styles.floatingCircle, styles.circle4]} />
    </View>
  );
};

// Helper para formatear dinero
const money = (value: number) => {
  return value !== null && value !== undefined 
    ? `$${value.toFixed(2)}` 
    : "$0.00";
};

// Helper para mostrar estados en español
const getEstadoLabel = (estado: string) => {
  const estados: Record<string, string> = {
    PENDIENTE: "Pendiente de pago",
    PROCESANDO: "En proceso",
    PENDIENTE_VERIFICACION: "Verificando pago",
    COMPLETADO: "Completado",
    CANCELADO: "Cancelado",
    ENVIADO: "Enviado",
    ENTREGADO: "Entregado"
  };
  return estados[estado] || estado;
};

// Helper para obtener el color del estado
const getEstadoColor = (estado: string) => {
  const colors: Record<string, string> = {
    PENDIENTE: "#F59E0B", // naranja
    PROCESANDO: "#3B82F6", // azul
    PENDIENTE_VERIFICACION: "#8B5CF6", // violeta
    COMPLETADO: "#10B981", // verde
    ENVIADO: "#6366F1", // índigo
    ENTREGADO: "#059669", // verde oscuro
    CANCELADO: "#EF4444" // rojo
  };
  return colors[estado] || "#6B7280";
};

// Helper para formatear la fecha (como en la imagen: "10 ene 2026")
const formatFecha = (fecha: string) => {
  if (!fecha) return "";
  
  try {
    const date = new Date(fecha);
    const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const dia = date.getDate();
    const mes = meses[date.getMonth()];
    const anio = date.getFullYear();
    
    return `${dia} ${mes} ${anio}`;
  } catch (error) {
    return fecha;
  }
};

// Helper para formato de fecha y hora como en la imagen: "14:30 · Pedido #1234"
const formatFechaHoraPedido = (fecha: string, idPedido: string) => {
  if (!fecha) return `Pedido #${idPedido}`;
  
  try {
    const date = new Date(fecha);
    const hora = date.getHours().toString().padStart(2, '0');
    const minutos = date.getMinutes().toString().padStart(2, '0');
    return `${hora}:${minutos} · Pedido #${idPedido}`;
  } catch (error) {
    return `Pedido #${idPedido}`;
  }
};

// Pasos de seguimiento (como en la imagen)
const pasosSeguimiento = [
  "Pedido",
  "Recolectando",
  "Empacando",
  "En camino",
  "Listo",
  "Entregado"
];

const getSeguimientoIcon = (paso: string, completado: boolean, activo: boolean) => {
  const iconos: Record<string, { name: keyof typeof Ionicons.glyphMap, color: string }> = {
    Pedido: { name: "document-text-outline", color: completado ? "#10B981" : activo ? "#FF6B35" : "#9CA3AF" },
    Recolectando: { name: "cube-outline", color: completado ? "#10B981" : activo ? "#FF6B35" : "#9CA3AF" },
    Empacando: { name: "archive-outline", color: completado ? "#10B981" : activo ? "#FF6B35" : "#9CA3AF" },
    "En camino": { name: "car-outline", color: completado ? "#10B981" : activo ? "#FF6B35" : "#9CA3AF" },
    Listo: { name: "checkmark-circle-outline", color: completado ? "#10B981" : activo ? "#FF6B35" : "#9CA3AF" },
    Entregado: { name: "checkmark-done-circle-outline", color: completado ? "#10B981" : activo ? "#FF6B35" : "#9CA3AF" }
  };
  
  return iconos[paso] || { name: "ellipse-outline", color: completado ? "#10B981" : activo ? "#FF6B35" : "#9CA3AF" };
};

const getEstadoActualTexto = (estadoSeguimiento?: string) => {
  const textos: Record<string, string> = {
    Pedido: "Pedido confirmado",
    Recolectando: "Recolectando productos",
    Empacando: "Empacando pedido",
    "En camino": "Tu pedido va en camino",
    Listo: "Listo para retirar",
    Entregado: "Pedido entregado"
  };
  
  return estadoSeguimiento ? textos[estadoSeguimiento] || "Procesando pedido" : "Confirmando pedido";
};

const { width } = Dimensions.get('window');

const MisPedidos = () => {
  const router = useRouter();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pedidoExpandido, setPedidoExpandido] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>('');

  // Estados que permiten ver factura
  const estadosConFactura = ["PENDIENTE_VERIFICACION", "COMPLETADO", "ENVIADO", "ENTREGADO"];

  // Obtener token del AsyncStorage
  const getToken = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      return token;
    } catch (error) {
      console.error('Error obteniendo token:', error);
      return null;
    }
  };

  // Obtener rol del usuario
  const getUserRole = async () => {
    try {
      const role = await AsyncStorage.getItem('userRole');
      setUserRole(role || '');
      return role;
    } catch (error) {
      console.error('Error obteniendo rol:', error);
      return null;
    }
  };

  // Verificar si es repartidor o vendedor
  const esRepartidorOVendedor = () => {
    return userRole === 'ROLE_REPARTIDOR' || userRole === 'ROLE_VENDEDOR';
  };

  // Función para cargar pedidos
  const fetchPedidos = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      
      if (!token) {
        Alert.alert("Sesión expirada", "Por favor inicia sesión nuevamente");
        router.push('/login');
        return;
      }

      console.log('🔍 Fetching pedidos from:', `${API_CONFIG.BASE_URL}/pedidos/mis-pedidos`);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/pedidos/mis-pedidos`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        Alert.alert("Sesión expirada", "Por favor inicia sesión nuevamente");
        await AsyncStorage.removeItem('authToken');
        router.push('/login');
        return;
      }

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📦 Pedidos recibidos:', data);
      
      // Filtrar solo pedidos válidos
      const pedidosFiltrados = data.filter((p: Pedido) =>
        p.total > 0 &&
        ["PENDIENTE", "PENDIENTE_VERIFICACION", "PROCESANDO", "COMPLETADO", "ENVIADO", "ENTREGADO"].includes(p.estadoPedido)
      );
      
      // Ordenar por fecha (más reciente primero)
      pedidosFiltrados.sort((a: Pedido, b: Pedido) => 
        new Date(b.fechaPedido).getTime() - new Date(a.fechaPedido).getTime()
      );
      
      setPedidos(pedidosFiltrados);
    } catch (err: any) {
      console.error("❌ Error cargando pedidos:", err);
      Alert.alert(
        "Error", 
        err.message.includes('Network request failed') 
          ? "Error de conexión. Verifica tu internet." 
          : "No se pudieron cargar los pedidos. Intenta nuevamente."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await getUserRole();
      await fetchPedidos();
    };
    init();
  }, []);

  // Función para refrescar
  const onRefresh = () => {
    setRefreshing(true);
    fetchPedidos();
  };

  // Función para marcar como entregado
  const handleMarcarEntregado = async (idPedido: string, metodoPago?: string) => {
    Alert.alert(
      "Confirmar entrega",
      metodoPago === 'EFECTIVO' 
        ? '¿Confirmar que el pedido fue entregado y el cliente pagó en efectivo?'
        : '¿Confirmar que el pedido fue entregado?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          style: 'default',
          onPress: async () => {
            try {
              const token = await getToken();
              if (!token) {
                Alert.alert("Error", "Sesión expirada");
                return;
              }

              const response = await fetch(
                `${API_CONFIG.BASE_URL}/pedidos/${idPedido}/marcar-entregado`,
                {
                  method: 'PUT',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({ pagado: metodoPago === 'EFECTIVO' })
                }
              );

              if (!response.ok) {
                throw new Error('Error al marcar como entregado');
              }

              Alert.alert(
                "✅ Éxito", 
                "Pedido marcado como entregado" + 
                (metodoPago === 'EFECTIVO' ? ' y pagado' : ''),
                [{ text: 'OK', onPress: () => fetchPedidos() }]
              );
              
            } catch (error: any) {
              console.error('Error:', error);
              Alert.alert("❌ Error", "No se pudo marcar como entregado");
            }
          }
        }
      ]
    );
  };

  // Renderizar carga
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>Cargando tus compras...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Renderizar sin pedidos
  if (pedidos.length === 0 && !loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
        
        {/* Header con efectos visuales */}
        <View style={styles.header}>
          <FloatingCircles />
          
          <View style={styles.headerTop}>
            <Text style={styles.headerIcon}>📦</Text>
          </View>
          
          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle}>Mis Compras</Text>
            <View style={styles.titleUnderline} />
          </View>
          
          <Text style={styles.headerSubtitle}>
            Revisa el historial de todos tus pedidos
          </Text>
        </View>
        
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🛒</Text>
          <Text style={styles.emptyTitle}>No tienes compras registradas</Text>
          <Text style={styles.emptySubtitle}>
            Solo se muestran pedidos pagados o en verificación
          </Text>
          <TouchableOpacity 
            style={styles.exploreButton}
            onPress={() => router.push('/(tabs)/explorar')}
          >
            <Text style={styles.exploreButtonText}>Ir a la tienda</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      {/* Header con efectos visuales */}
      <View style={styles.header}>
        <FloatingCircles />
        
        <View style={styles.headerTop}>
          <Text style={styles.headerIcon}>📦</Text>
        </View>
        
        <View style={styles.titleContainer}>
          <Text style={styles.headerTitle}>Mis Compras</Text>
          <View style={styles.titleUnderline} />
        </View>
        
        <Text style={styles.headerSubtitle}>
          Revisa el historial de todos tus pedidos
        </Text>
      </View>

      {/* Contador de pedidos */}
      <View style={styles.counterContainer}>
        <Text style={styles.counterText}>
          {pedidos.length} pedido{pedidos.length !== 1 ? 's' : ''} realizado{pedidos.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Lista de pedidos */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF6B35']}
            tintColor="#FF6B35"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {pedidos.map((pedido) => {
          const puedeVerFactura = estadosConFactura.includes(pedido.estadoPedido);
          const puedeMarcarComoEntregado = esRepartidorOVendedor() && 
            (pedido.estadoSeguimiento === 'EN_CAMINO' || pedido.estadoPedido === 'ENVIADO');
          
          // Determinar el estado actual del seguimiento
          let estadoActualIndex = 0;
          if (pedido.estadoSeguimiento) {
            estadoActualIndex = pasosSeguimiento.findIndex(
              paso => paso.toLowerCase() === pedido.estadoSeguimiento?.toLowerCase()
            );
            if (estadoActualIndex === -1) estadoActualIndex = 0;
          }

          const estadoColor = getEstadoColor(pedido.estadoPedido);
          const estadoLabel = getEstadoLabel(pedido.estadoPedido);
          
          return (
            <View key={pedido.idPedido} style={styles.pedidoCard}>
              {/* Estado del pedido y total */}
              <View style={styles.estadoContainer}>
                <View style={[
                  styles.estadoBadge,
                  { backgroundColor: `${estadoColor}15` }
                ]}>
                  <View style={[styles.estadoDot, { backgroundColor: estadoColor }]} />
                  <Text style={[
                    styles.estadoText, 
                    { color: estadoColor }
                  ]}>
                    {estadoLabel}
                  </Text>
                </View>
                
                {/* Total - COLOR NARANJA */}
                <Text style={styles.pedidoTotal}>
                  {money(pedido.total)}
                </Text>
              </View>

              {/* Línea separadora */}
              <View style={styles.separator} />

              {/* Fecha e ID del pedido */}
              <View style={styles.fechaContainer}>
                <Text style={styles.fechaTexto}>
                  {formatFecha(pedido.fechaPedido)}
                </Text>
                <Text style={styles.horaPedido}>
                  {formatFechaHoraPedido(pedido.fechaPedido, pedido.idPedido)}
                </Text>
              </View>

              {/* Botón para expandir/colapsar seguimiento */}
              <TouchableOpacity
                style={styles.seguimientoButton}
                onPress={() => setPedidoExpandido(
                  pedidoExpandido === pedido.idPedido ? null : pedido.idPedido
                )}
                activeOpacity={0.7}
              >
                <Text style={styles.seguimientoButtonText}>
                  Seguimiento del pedido
                </Text>
                <Ionicons 
                  name={pedidoExpandido === pedido.idPedido ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color="#FF6B35" 
                />
              </TouchableOpacity>

              {/* Seguimiento expandido */}
              {pedidoExpandido === pedido.idPedido && (
                <View style={styles.seguimientoExpandido}>
                  {/* Pasos de seguimiento */}
                  <View style={styles.pasosContainer}>
                    {pasosSeguimiento.map((paso, index) => {
                      const completado = index <= estadoActualIndex;
                      const activo = index === estadoActualIndex;
                      const icono = getSeguimientoIcon(paso, completado, activo);
                      
                      return (
                        <View key={paso} style={styles.pasoItem}>
                          <View style={styles.pasoIconContainer}>
                            {completado ? (
                              <View style={[styles.pasoIconCompletado, activo && styles.pasoIconActivo]}>
                                <Ionicons 
                                  name={icono.name} 
                                  size={16} 
                                  color={completado ? "#FFFFFF" : icono.color} 
                                />
                              </View>
                            ) : (
                              <View style={[
                                styles.pasoIcon, 
                                activo && styles.pasoIconActivoBorde,
                                { borderColor: activo ? "#FF6B35" : "#D1D5DB" }
                              ]}>
                                <Ionicons 
                                  name={icono.name} 
                                  size={14} 
                                  color={icono.color} 
                                />
                              </View>
                            )}
                            
                            {/* Línea conectora */}
                            {index < pasosSeguimiento.length - 1 && (
                              <View style={[
                                styles.pasoLinea,
                                completado ? styles.pasoLineaCompletada : styles.pasoLineaPendiente
                              ]} />
                            )}
                          </View>
                          
                          <Text style={[
                            styles.pasoLabel,
                            completado ? styles.pasoLabelCompletado : styles.pasoLabelPendiente,
                            activo && styles.pasoLabelActivo
                          ]}>
                            {paso}
                          </Text>
                        </View>
                      );
                    })}
                  </View>

                  {/* Estado actual */}
                  <View style={styles.estadoActualContainer}>
                    <Text style={styles.estadoActualLabel}>Estado actual</Text>
                    <View style={styles.estadoActualContent}>
                      <Ionicons name="information-circle-outline" size={20} color="#FF6B35" />
                      <Text style={styles.estadoActualTexto}>
                        {getEstadoActualTexto(pedido.estadoSeguimiento)}
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Línea separadora */}
              <View style={styles.separator} />

              {/* Botones de acción */}
              <View style={styles.accionesContainer}>
                <TouchableOpacity
                  style={styles.detalleButton}
                  onPress={() => {
                    console.log('Navegando a PedidoDetalle con ID:', pedido.idPedido);
                    router.push(`/consumidor/PedidoDetalle?id=${pedido.idPedido}`);
                  }}
                >
                  <Ionicons name="eye-outline" size={18} color="#FF6B35" />
                  <Text style={styles.detalleButtonText}>Ver detalles completos</Text>
                </TouchableOpacity>

                {puedeVerFactura && (
                  <TouchableOpacity
                    style={styles.facturaButton}
                    onPress={() => {
                      console.log('Navegando a Factura con ID:', pedido.idPedido);
                      router.push(`/consumidor/Factura?id=${pedido.idPedido}`);
                    }}
                  >
                    <MaterialIcons name="receipt-long" size={18} color="#FF6B35" />
                    <Text style={styles.facturaButtonText}>Ver factura</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Botón de entregado para repartidores/vendedores */}
              {puedeMarcarComoEntregado && (
                <View style={styles.entregadoContainer}>
                  <TouchableOpacity
                    style={styles.entregadoButton}
                    onPress={() => handleMarcarEntregado(pedido.idPedido, pedido.metodoPago)}
                  >
                    <FontAwesome5 name="check-circle" size={18} color="#FFFFFF" />
                    <Text style={styles.entregadoButtonText}>Marcar como entregado</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}
        
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  
  // Efectos de círculos flotantes - MISMO QUE EXPLORAR Y CARRITO
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
  
  // Header mejorado - MISMO ESTILO QUE EXPLORAR Y CARRITO
  header: {
    backgroundColor: "white",
    paddingTop: 50,
    paddingBottom: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    alignItems: "center",
    overflow: 'hidden',
    position: 'relative',
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    zIndex: 1,
  },
  headerIcon: {
    fontSize: 40,
  },
  
  // Título con efectos
  titleContainer: {
    alignItems: 'center',
    marginBottom: 8,
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#2C3E50",
    textAlign: 'center',
    fontFamily: "System",
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  titleUnderline: {
    width: 60,
    height: 4,
    backgroundColor: '#FF6B35',
    borderRadius: 2,
    marginTop: 6,
  },
  headerSubtitle: {
    fontSize: 15,
    color: "#64748b",
    marginTop: 4,
    textAlign: "center",
    fontFamily: "System",
    zIndex: 1,
  },
  
  counterContainer: {
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  counterText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    textAlign: "center",
    fontFamily: "System",
  },
  
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    backgroundColor: "#f8f9fa",
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 20,
    color: "#9CA3AF",
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 12,
    fontFamily: "System",
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 30,
    fontFamily: "System",
  },
  
  // Botón Explorar - COLOR NARANJA
  exploreButton: {
    backgroundColor: "#FF6B35",
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 12,
    shadowColor: "#FF6B35",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  exploreButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "System",
  },
  
  scrollView: {
    flex: 1,
    padding: 16,
  },
  
  // Tarjeta de pedido - MISMO ESTILO QUE PRODUCTOS
  pedidoCard: {
    backgroundColor: "white",
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    overflow: "hidden",
  },
  
  estadoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
  },
  estadoBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  estadoDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  estadoText: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "System",
  },
  pedidoTotal: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FF6B35",
    fontFamily: "System",
  },
  
  separator: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 20,
  },
  
  fechaContainer: {
    padding: 20,
    paddingBottom: 10,
  },
  fechaTexto: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 4,
    fontFamily: "System",
  },
  horaPedido: {
    fontSize: 15,
    color: "#6B7280",
    fontFamily: "System",
  },
  
  seguimientoButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 10,
    backgroundColor: "#F8FAFC",
  },
  seguimientoButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    fontFamily: "System",
  },
  
  seguimientoExpandido: {
    padding: 20,
    backgroundColor: "#F8FAFC",
  },
  
  pasosContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  pasoItem: {
    alignItems: "center",
    width: (width - 40) / 6 - 8,
  },
  pasoIconContainer: {
    alignItems: "center",
    marginBottom: 8,
    position: 'relative',
  },
  pasoIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    zIndex: 2,
  },
  pasoIconCompletado: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#10B981",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  pasoIconActivo: {
    backgroundColor: "#FF6B35",
  },
  pasoIconActivoBorde: {
    borderWidth: 3,
    borderColor: "#FF6B35",
    backgroundColor: "#FFFFFF",
  },
  pasoLinea: {
    position: 'absolute',
    top: 14,
    left: 30,
    right: -((width - 40) / 6 + 8),
    height: 2,
    zIndex: 1,
  },
  pasoLineaCompletada: {
    backgroundColor: "#10B981",
  },
  pasoLineaPendiente: {
    backgroundColor: "#E5E7EB",
  },
  pasoLabel: {
    fontSize: 10,
    fontWeight: "500",
    textAlign: "center",
    fontFamily: "System",
  },
  pasoLabelCompletado: {
    color: "#10B981",
  },
  pasoLabelPendiente: {
    color: "#9CA3AF",
  },
  pasoLabelActivo: {
    color: "#FF6B35",
    fontWeight: "700",
  },
  
  estadoActualContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  estadoActualLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 8,
    fontFamily: "System",
  },
  estadoActualContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  estadoActualTexto: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
    marginLeft: 10,
    flex: 1,
    fontFamily: "System",
  },
  
  accionesContainer: {
    padding: 20,
    gap: 12,
  },
  
  detalleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#FF6B35",
    backgroundColor: "#FFFFFF",
  },
  detalleButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FF6B35",
    marginLeft: 10,
    fontFamily: "System",
  },
  
  facturaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#FF6B35",
    backgroundColor: "#FFFFFF",
  },
  facturaButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FF6B35",
    marginLeft: 10,
    fontFamily: "System",
  },
  
  entregadoContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  entregadoButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: "#FF6B35",
  },
  entregadoButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginLeft: 10,
    fontFamily: "System",
  },
  
  bottomSpacing: {
    height: 20,
  },
});

export default MisPedidos;