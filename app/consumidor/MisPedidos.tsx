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

// Helper para obtener el ícono del estado
const getEstadoIcon = (estado: string) => {
  const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
    PENDIENTE: "hourglass-outline",
    PROCESANDO: "cube-outline",
    PENDIENTE_VERIFICACION: "search-outline",
    COMPLETADO: "checkmark-circle-outline",
    CANCELADO: "close-circle-outline",
    ENVIADO: "car-outline",
    ENTREGADO: "checkmark-done-circle-outline"
  };
  return icons[estado] || "document-text-outline";
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
  return colors[estado] || "#6B7280"; // gris por defecto
};

// Helper para formatear la fecha
const formatFecha = (fecha: string) => {
  if (!fecha) return "";
  
  try {
    const date = new Date(fecha);
    const hoy = new Date();
    const ayer = new Date(hoy);
    ayer.setDate(hoy.getDate() - 1);
    
    // Si es hoy
    if (date.toDateString() === hoy.toDateString()) {
      const hora = date.getHours().toString().padStart(2, '0');
      const minutos = date.getMinutes().toString().padStart(2, '0');
      return `Hoy, ${hora}:${minutos}`;
    }
    
    // Si es ayer
    if (date.toDateString() === ayer.toDateString()) {
      const hora = date.getHours().toString().padStart(2, '0');
      const minutos = date.getMinutes().toString().padStart(2, '0');
      return `Ayer, ${hora}:${minutos}`;
    }
    
    // Otras fechas
    const dia = date.getDate().toString().padStart(2, '0');
    const mes = (date.getMonth() + 1).toString().padStart(2, '0');
    const anio = date.getFullYear().toString().substr(-2);
    return `${dia}/${mes}/${anio}`;
  } catch (error) {
    return fecha;
  }
};

// Pasos de seguimiento
const pasosSeguimiento = [
  "PEDIDO_REALIZADO",
  "RECOLECTANDO",
  "EMPACANDO",
  "EN_CAMINO",
  "LISTO_PARA_RETIRO",
  "ENTREGADO"
];

const getPasoLabel = (paso: string) => {
  const labels: Record<string, string> = {
    PEDIDO_REALIZADO: "Realizado",
    RECOLECTANDO: "Recolectando",
    EMPACANDO: "Empacando",
    EN_CAMINO: "En camino",
    LISTO_PARA_RETIRO: "Listo retiro",
    ENTREGADO: "Entregado"
  };
  return labels[paso] || paso.replaceAll("_", " ");
};

const getSeguimientoTexto = (estado: string) => {
  const textos: Record<string, string> = {
    PEDIDO_REALIZADO: "Pedido confirmado",
    RECOLECTANDO: "Recolectando productos",
    EMPACANDO: "Empacando pedido",
    EN_CAMINO: "Tu pedido va en camino",
    LISTO_PARA_RETIRO: "Listo para retirar",
    ENTREGADO: "Pedido entregado"
  };
  return textos[estado] || "Procesando pedido";
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
        <StatusBar barStyle="dark-content" backgroundColor="#F9FBF7" />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#5A8F48" />
          <Text style={styles.loadingText}>Cargando tus compras...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Renderizar sin pedidos
  if (pedidos.length === 0 && !loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F9FBF7" />
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#2D3E2B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mis Compras</Text>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={fetchPedidos}
          >
            <Ionicons name="refresh-outline" size={22} color="#5A8F48" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.centerContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="cart-outline" size={64} color="#9AAA98" />
          </View>
          <Text style={styles.emptyTitle}>Aún no tienes compras</Text>
          <Text style={styles.emptySubtitle}>
            Solo se muestran pedidos pagados o en verificación
          </Text>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => router.push('/(tabs)/explorar')}
          >
            <Text style={styles.primaryButtonText}>Ir a la tienda</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FBF7" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#2D3E2B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis Compras</Text>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={fetchPedidos}
        >
          <Ionicons name="refresh-outline" size={22} color="#5A8F48" />
        </TouchableOpacity>
      </View>

      {/* Contador de pedidos */}
      <View style={styles.counterContainer}>
        <Text style={styles.counterText}>
          {pedidos.length} compra{pedidos.length !== 1 ? 's' : ''} realizada{pedidos.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Lista de pedidos */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#5A8F48']}
            tintColor="#5A8F48"
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={pedidos.length === 0 ? styles.scrollViewEmpty : undefined}
      >
        {pedidos.map((pedido) => {
          const puedeVerFactura = estadosConFactura.includes(pedido.estadoPedido);
          const puedeMarcarComoEntregado = esRepartidorOVendedor() && 
            (pedido.estadoSeguimiento === 'EN_CAMINO' || pedido.estadoPedido === 'ENVIADO');
          const pasoIndex = pedido.estadoSeguimiento 
            ? pasosSeguimiento.indexOf(pedido.estadoSeguimiento)
            : 0;
          
          return (
            <View key={pedido.idPedido} style={styles.pedidoCard}>
              {/* Header del pedido */}
              <TouchableOpacity
                style={styles.pedidoHeader}
                onPress={() => setPedidoExpandido(
                  pedidoExpandido === pedido.idPedido ? null : pedido.idPedido
                )}
                activeOpacity={0.7}
              >
                <View style={styles.pedidoInfo}>
                  <View style={[
                    styles.estadoBadge,
                    { backgroundColor: `${getEstadoColor(pedido.estadoPedido)}20` }
                  ]}>
                    <Ionicons 
                      name={getEstadoIcon(pedido.estadoPedido)} 
                      size={14} 
                      color={getEstadoColor(pedido.estadoPedido)} 
                    />
                    <Text style={[
                      styles.estadoBadgeText, 
                      { color: getEstadoColor(pedido.estadoPedido) }
                    ]}>
                      {getEstadoLabel(pedido.estadoPedido)}
                    </Text>
                  </View>
                  <Text style={styles.pedidoFecha}>
                    {formatFecha(pedido.fechaPedido)}
                  </Text>
                </View>
                
                <Ionicons 
                  name={pedidoExpandido === pedido.idPedido ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color="#9AAA98" 
                />
              </TouchableOpacity>

              {/* Contenido del pedido */}
              <View style={styles.pedidoContent}>
                {/* ID y total */}
                <View style={styles.idTotalRow}>
                  <View style={styles.idContainer}>
                    <Text style={styles.idLabel}>Pedido #</Text>
                    <Text style={styles.idValue}>{pedido.idPedido}</Text>
                  </View>
                  
                  <View style={styles.totalContainer}>
                    <Text style={styles.totalLabel}>Total:</Text>
                    <Text style={styles.totalAmount}>{money(pedido.total)}</Text>
                  </View>
                </View>

                {/* Método de pago */}
                {pedido.metodoPago && (
                  <View style={styles.metodoPagoContainer}>
                    <Ionicons 
                      name={pedido.metodoPago === 'EFECTIVO' ? 'cash-outline' : 'card-outline'} 
                      size={16} 
                      color="#6B7F69" 
                    />
                    <Text style={styles.metodoPagoText}>
                      {pedido.metodoPago === 'EFECTIVO' ? 'Efectivo' : 
                       pedido.metodoPago === 'TARJETA' ? 'Tarjeta' : 
                       pedido.metodoPago}
                    </Text>
                    {pedido.pagado && (
                      <View style={styles.pagadoBadge}>
                        <Text style={styles.pagadoText}>Pagado</Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Botones de acción */}
                <View style={styles.buttonsContainer}>
                  <TouchableOpacity
                    style={styles.detalleButton}
                    onPress={() => {
                      console.log('Navegando a PedidoDetalle con ID:', pedido.idPedido);
                      router.push(`/consumidor/PedidoDetalle?id=${pedido.idPedido}`);
                    }}
                  >
                    <Ionicons name="eye-outline" size={18} color="#5A8F48" />
                    <Text style={styles.detalleButtonText}>Ver detalle</Text>
                  </TouchableOpacity>

                  {puedeVerFactura && (
                    <TouchableOpacity
                      style={styles.facturaButton}
                      onPress={() => {
                        console.log('Navegando a Factura con ID:', pedido.idPedido);
                        router.push(`/consumidor/Factura?id=${pedido.idPedido}`);
                      }}
                    >
                      <MaterialIcons name="receipt-long" size={18} color="#FFFFFF" />
                      <Text style={styles.facturaButtonText}>Factura</Text>
                    </TouchableOpacity>
                  )}

                  {puedeMarcarComoEntregado && (
                    <TouchableOpacity
                      style={styles.entregadoButton}
                      onPress={() => handleMarcarEntregado(pedido.idPedido, pedido.metodoPago)}
                    >
                      <FontAwesome5 name="check-circle" size={18} color="#FFFFFF" />
                      <Text style={styles.entregadoButtonText}>Entregado</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Contenido expandido - Seguimiento */}
              {pedidoExpandido === pedido.idPedido && (
                <View style={styles.seguimientoContainer}>
                  {/* Barra de progreso */}
                  {pedido.estadoSeguimiento && (
                    <View style={styles.progressBarContainer}>
                      <Text style={styles.seguimientoTitle}>Seguimiento del pedido</Text>
                      
                      <View style={styles.progressBar}>
                        <View style={[styles.progressFill, {
                          width: `${(pasoIndex / (pasosSeguimiento.length - 1)) * 100}%`
                        }]} />
                      </View>
                      
                      <View style={styles.progressSteps}>
                        {pasosSeguimiento.slice(0, 4).map((paso, index) => {
                          const activo = index <= pasoIndex;
                          return (
                            <View key={paso} style={styles.progressStep}>
                              <View style={[
                                styles.progressDot,
                                activo && styles.progressDotActive
                              ]} />
                              <Text style={[
                                styles.progressLabel,
                                activo && styles.progressLabelActive
                              ]}>
                                {getPasoLabel(paso)}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  )}

                  {/* Estado actual */}
                  <View style={styles.estadoActualContainer}>
                    <Ionicons name="location-outline" size={20} color="#5A8F48" />
                    <View style={styles.estadoActualText}>
                      <Text style={styles.estadoActualTitle}>
                        {pedido.estadoSeguimiento 
                          ? getSeguimientoTexto(pedido.estadoSeguimiento)
                          : getEstadoLabel(pedido.estadoPedido)}
                      </Text>
                      <Text style={styles.estadoActualSubtitle}>
                        Actualizado {formatFecha(pedido.fechaPedido)}
                      </Text>
                    </View>
                  </View>

                  {/* Información adicional */}
                  <View style={styles.infoAdicional}>
                    {/* Productos */}
                    {pedido.productos && pedido.productos.length > 0 && (
                      <View style={styles.productosContainer}>
                        <Text style={styles.infoLabel}>Productos:</Text>
                        {pedido.productos.slice(0, 3).map((producto, index) => (
                          <View key={index} style={styles.productoItem}>
                            <Text style={styles.productoNombre} numberOfLines={1}>
                              {producto.cantidad}x {producto.nombre}
                            </Text>
                            <Text style={styles.productoPrecio}>
                              ${(producto.precio * producto.cantidad).toFixed(2)}
                            </Text>
                          </View>
                        ))}
                        {pedido.productos.length > 3 && (
                          <Text style={styles.masProductos}>
                            +{pedido.productos.length - 3} productos más
                          </Text>
                        )}
                      </View>
                    )}

                    {/* Dirección */}
                    {pedido.direccionEntrega && (
                      <View style={styles.direccionContainer}>
                        <Text style={styles.infoLabel}>Dirección de entrega:</Text>
                        <View style={styles.direccionContent}>
                          <Ionicons name="location-outline" size={16} color="#6B7F69" />
                          <Text style={styles.direccionText} numberOfLines={2}>
                            {pedido.direccionEntrega}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
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
    backgroundColor: '#F9FBF7',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F9FBF7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8F5E9',
  },
  backButton: {
    padding: 8,
  },
  refreshButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3E2B',
    fontFamily: 'System',
  },
  counterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8F5E9',
  },
  counterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7F69',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  scrollViewEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  pedidoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E8F5E9',
    overflow: 'hidden',
  },
  pedidoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F7F0',
  },
  pedidoInfo: {
    flex: 1,
  },
  estadoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 6,
  },
  estadoBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  pedidoFecha: {
    fontSize: 13,
    color: '#9AAA98',
  },
  pedidoContent: {
    padding: 16,
  },
  idTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  idContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  idLabel: {
    fontSize: 13,
    color: '#6B7F69',
    marginRight: 4,
  },
  idValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2D3E2B',
    fontFamily: 'Courier',
  },
  totalContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  totalLabel: {
    fontSize: 14,
    color: '#2D3E2B',
    marginRight: 6,
    fontWeight: '500',
  },
  totalAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: '#5A8F48',
    fontFamily: 'System',
  },
  metodoPagoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F9FBF7',
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  metodoPagoText: {
    fontSize: 13,
    color: '#6B7F69',
    marginLeft: 6,
    marginRight: 10,
    fontWeight: '500',
  },
  pagadoBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pagadoText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  buttonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  detalleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#5A8F48',
    backgroundColor: '#FFFFFF',
    minWidth: 120,
  },
  detalleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5A8F48',
    marginLeft: 6,
  },
  facturaButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#5A8F48',
    minWidth: 100,
  },
  facturaButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 6,
  },
  entregadoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    minWidth: 120,
  },
  entregadoButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 6,
  },
  seguimientoContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F7F0',
    backgroundColor: '#F9FBF7',
  },
  progressBarContainer: {
    marginBottom: 20,
  },
  seguimientoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3E2B',
    marginBottom: 16,
    fontFamily: 'System',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E0E6D8',
    borderRadius: 3,
    marginBottom: 24,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#5A8F48',
    borderRadius: 3,
  },
  progressSteps: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressStep: {
    alignItems: 'center',
    width: (width - 32) / 4 - 8,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#C4CFC1',
    marginBottom: 6,
  },
  progressDotActive: {
    backgroundColor: '#5A8F48',
    transform: [{ scale: 1.2 }],
  },
  progressLabel: {
    fontSize: 10,
    color: '#9AAA98',
    textAlign: 'center',
    fontWeight: '500',
  },
  progressLabelActive: {
    color: '#5A8F48',
    fontWeight: '700',
  },
  estadoActualContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E8F5E9',
  },
  estadoActualText: {
    flex: 1,
    marginLeft: 12,
  },
  estadoActualTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#5A8F48',
    marginBottom: 4,
  },
  estadoActualSubtitle: {
    fontSize: 13,
    color: '#6B7F69',
  },
  infoAdicional: {
    gap: 12,
  },
  productosContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8F5E9',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3E2B',
    marginBottom: 8,
  },
  productoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F7F0',
  },
  productoNombre: {
    fontSize: 14,
    color: '#6B7F69',
    flex: 1,
    marginRight: 8,
  },
  productoPrecio: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5A8F48',
  },
  masProductos: {
    fontSize: 12,
    color: '#9AAA98',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 6,
  },
  direccionContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8F5E9',
  },
  direccionContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 4,
  },
  direccionText: {
    fontSize: 14,
    color: '#6B7F69',
    flex: 1,
    marginLeft: 8,
    lineHeight: 20,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ECF2E3',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D3E2B',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9AAA98',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  primaryButton: {
    backgroundColor: '#5A8F48',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7F69',
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 20,
  },
});

export default MisPedidos;