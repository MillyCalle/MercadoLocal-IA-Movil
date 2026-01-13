import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { API_CONFIG } from "../../config";

interface Producto {
  idProducto: number;
  nombreProducto: string;
  imagenProducto: string;
}

interface DetallePedido {
  idDetalle: number;
  cantidad: number;
  subtotal: number;
  producto: Producto;
}

interface Pedido {
  id: number;
  idPedido: number;
  fechaPedido: string;
  estadoPedido: string;
  estado: string;
  subtotal: number;
  iva: number;
  total: number;
  metodoPago?: string;
  detalles?: DetallePedido[];
}

export default function Pedido() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const API_URL = API_CONFIG.BASE_URL;
  
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    cargarPedido();
  }, [id]);

  const cargarPedido = async () => {
    const token = await AsyncStorage.getItem("authToken");
    
    if (!token) {
      router.push("/login" as any);
      return;
    }

    try {
      setLoading(true);
      
      // Cargar pedido con detalles en una sola petición (igual que en web)
      const res = await fetch(`${API_URL}/pedidos/${id}/detalles`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("No se pudo cargar el pedido");
      }

      const data = await res.json();
      setPedido(data);
    } catch (err: any) {
      console.error("❌ Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const irADetallePago = () => {
    router.push(`/pedidodetalle?id=${id}&origen=PEDIDO` as any);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#5A8F48" />
        <Text style={styles.loadingText}>Cargando pedido...</Text>
      </View>
    );
  }

  if (error || !pedido) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorEmoji}>❌</Text>
        <Text style={styles.errorTitle}>Error al cargar pedido</Text>
        <Text style={styles.errorMessage}>{error || "No se encontró el pedido"}</Text>
        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={() => router.push("/" as any)}
        >
          <Text style={styles.primaryButtonText}>Volver al inicio</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Usar los nombres de campos que vienen del backend (compatibilidad con ambas versiones)
  const pedidoId = pedido.idPedido || pedido.id;
  const estadoPedido = pedido.estadoPedido || pedido.estado;
  const detalles = pedido.detalles || [];

  const estadoColors: Record<string, string> = {
    PENDIENTE: "#F4B419",
    PENDIENTE_VERIFICACION: "#F4B419",
    PROCESANDO: "#4A90E2",
    COMPLETADO: "#5A8F48",
    CANCELADO: "#E74C3C",
  };

  const estadoColor = estadoColors[estadoPedido] || "#6B7F69";

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.content}>
        {/* Header */}
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>

        <View style={styles.headerCard}>
          <View style={styles.headerContent}>
            <View style={styles.iconContainer}>
              <Text style={styles.iconEmoji}>📦</Text>
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle}>Pedido #{pedidoId}</Text>
              <Text style={styles.headerDate}>
                📅 {new Date(pedido.fechaPedido).toLocaleDateString("es-ES", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>
          </View>

          <View style={[styles.estadoBadge, { backgroundColor: estadoColor }]}>
            <Text style={styles.estadoText}>{estadoPedido}</Text>
          </View>
        </View>

        {/* Productos */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>🛒 Productos del pedido</Text>

          {detalles.length === 0 ? (
            <Text style={styles.emptyText}>No hay productos en este pedido</Text>
          ) : (
            detalles.map((detalle, index) => (
              <View key={detalle.idDetalle || index} style={styles.productoItem}>
                {detalle.producto?.imagenProducto && (
                  <Image
                    source={{ uri: detalle.producto.imagenProducto }}
                    style={styles.productoImage}
                  />
                )}

                <View style={styles.productoInfo}>
                  <Text style={styles.productoNombre} numberOfLines={2}>
                    {detalle.producto?.nombreProducto || "Producto"}
                  </Text>
                  <View style={styles.productoDetails}>
                    <Text style={styles.productoDetailText}>Cantidad: {detalle.cantidad}</Text>
                    <Text style={styles.productoDetailText}> • </Text>
                    <Text style={styles.productoDetailText}>
                      ${(detalle.subtotal / detalle.cantidad).toFixed(2)} c/u
                    </Text>
                  </View>
                </View>

                <Text style={styles.productoPrice}>${detalle.subtotal.toFixed(2)}</Text>
              </View>
            ))
          )}
        </View>

        {/* Resumen */}
        <View style={styles.resumenCard}>
          <Text style={styles.resumenTitle}>💰 Resumen del pedido</Text>

          <View style={styles.resumenRow}>
            <Text style={styles.resumenLabel}>Subtotal</Text>
            <Text style={styles.resumenValue}>${pedido.subtotal.toFixed(2)}</Text>
          </View>

          <View style={styles.resumenRow}>
            <Text style={styles.resumenLabel}>IVA (12%)</Text>
            <Text style={styles.resumenValue}>${pedido.iva.toFixed(2)}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.resumenTotalRow}>
            <Text style={styles.resumenTotalLabel}>Total</Text>
            <Text style={styles.resumenTotal}>${pedido.total.toFixed(2)}</Text>
          </View>
        </View>

        {/* Acción según estado */}
        <View style={styles.actionCard}>
          {estadoPedido === "PENDIENTE" ? (
            <>
              <View style={styles.alertBox}>
                <Text style={styles.alertTitle}>⚡ Tu pedido está listo para procesar</Text>
                <Text style={styles.alertText}>
                  Continúa al siguiente paso para seleccionar tu método de pago y finalizar la compra.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={irADetallePago}
              >
                <Text style={styles.primaryButtonText}>Continuar al pago →</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.infoBox}>
                <Text style={styles.infoTitle}>ℹ️ Estado del pedido</Text>
                <Text style={styles.infoText}>
                  {estadoPedido === "COMPLETADO" && "Tu pedido ha sido completado exitosamente."}
                  {estadoPedido === "PROCESANDO" && "Tu pedido está siendo procesado."}
                  {estadoPedido === "PENDIENTE_VERIFICACION" && "Tu pedido está en verificación."}
                  {estadoPedido === "CANCELADO" && "Este pedido ha sido cancelado."}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => router.push(`/pedidodetalle?id=${id}` as any)}
              >
                <Text style={styles.secondaryButtonText}>Ver detalles completos</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FBF7',
  },
  contentContainer: {
    paddingBottom: 40,
  },
  content: {
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FBF7',
    padding: 20,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    color: '#6B7F69',
    fontWeight: '600',
  },
  errorEmoji: {
    fontSize: 60,
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2D3E2B',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#6B7F69',
    marginBottom: 24,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 20,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5A8F48',
  },
  headerCard: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#5A8F48',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  iconEmoji: {
    fontSize: 28,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D3E2B',
    marginBottom: 4,
  },
  headerDate: {
    fontSize: 13,
    color: '#6B7F69',
  },
  estadoBadge: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  estadoText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  card: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3E2B',
    marginBottom: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: '#6B7F69',
    fontSize: 16,
    paddingVertical: 40,
  },
  productoItem: {
    flexDirection: 'row',
    backgroundColor: '#FAFBF9',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0F4ED',
  },
  productoImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#ECF2E3',
  },
  productoInfo: {
    flex: 1,
    marginRight: 12,
  },
  productoNombre: {
    fontSize: 16,
    color: '#2D3E2B',
    fontWeight: '600',
    marginBottom: 8,
  },
  productoDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productoDetailText: {
    fontSize: 14,
    color: '#6B7F69',
  },
  productoPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#5A8F48',
  },
  resumenCard: {
    backgroundColor: '#F9D94A',
    padding: 24,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  resumenTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3E2B',
    marginBottom: 20,
  },
  resumenRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  resumenLabel: {
    fontSize: 16,
    color: '#2D3E2B',
    fontWeight: '500',
  },
  resumenValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3E2B',
  },
  divider: {
    height: 2,
    backgroundColor: 'rgba(45, 62, 43, 0.2)',
    marginVertical: 16,
  },
  resumenTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    alignItems: 'center',
  },
  resumenTotalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3E2B',
  },
  resumenTotal: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2D3E2B',
  },
  actionCard: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  alertBox: {
    backgroundColor: '#FFF9E6',
    borderWidth: 2,
    borderColor: '#F4B419',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  alertTitle: {
    fontSize: 16,
    color: '#856404',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  alertText: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
  },
  infoBox: {
    backgroundColor: '#F0F4ED',
    borderWidth: 2,
    borderColor: '#E3EBD9',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    color: '#2D3E2B',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7F69',
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: '#5A8F48',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#5A8F48',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});