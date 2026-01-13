// app/consumidor/Factura.tsx
import { FontAwesome, Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Print from 'expo-print';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Platform,
    SafeAreaView,
    ScrollView,
    Share,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { API_CONFIG } from '../../config';

// Tipos de datos
interface DetallePedido {
  id: number;
  cantidad: number;
  subtotal: number;
  producto?: {
    nombreProducto: string;
    precio: number;
  };
}

interface Pedido {
  idPedido: string;
  fechaPedido: string;
  estadoPedido: string;
  subtotal: number;
  iva: number;
  total: number;
  metodoPago: string;
  direccionEntrega?: string;
  cliente?: {
    nombre: string;
    email: string;
  };
}

const Factura = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const idPedido = Array.isArray(id) ? id[0] : id;
  
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [detalles, setDetalles] = useState<DetallePedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  
  const facturaRef = React.useRef<View>(null);

  // Generar número de factura
  const generarNumeroFactura = (idPedido: string) => {
    return `FAC-${String(idPedido).padStart(6, "0")}`;
  };

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

  // Cargar datos de la factura
  const fetchFacturaData = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      
      if (!token) {
        Alert.alert("Sesión expirada", "Por favor inicia sesión nuevamente");
        router.push('/login');
        return;
      }

      const [pedidoResponse, detallesResponse] = await Promise.all([
        fetch(`${API_CONFIG.BASE_URL}/pedidos/${idPedido}`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`${API_CONFIG.BASE_URL}/pedidos/${idPedido}/detalles`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      ]);

      if (pedidoResponse.status === 401 || detallesResponse.status === 401) {
        Alert.alert("Sesión expirada", "Por favor inicia sesión nuevamente");
        await AsyncStorage.removeItem('authToken');
        router.push('/login');
        return;
      }

      if (!pedidoResponse.ok || !detallesResponse.ok) {
        throw new Error('Error al cargar los datos de la factura');
      }

      const pedidoData = await pedidoResponse.json();
      const detallesData = await detallesResponse.json();
      
      setPedido(pedidoData);
      setDetalles(detallesData);
    } catch (err: any) {
      console.error("❌ Error cargando factura:", err);
      Alert.alert(
        "Error", 
        err.message.includes('Network request failed') 
          ? "Error de conexión. Verifica tu internet." 
          : "No se pudo cargar la factura. Intenta nuevamente."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (idPedido) {
      fetchFacturaData();
    }
  }, [idPedido]);

  // Formatear fecha
  const formatearFecha = (fecha: string) => {
    if (!fecha) return "";
    
    try {
      const date = new Date(fecha);
      const dia = date.getDate().toString().padStart(2, '0');
      const mes = (date.getMonth() + 1).toString().padStart(2, '0');
      const anio = date.getFullYear();
      const hora = date.getHours().toString().padStart(2, '0');
      const minutos = date.getMinutes().toString().padStart(2, '0');
      
      return `${dia}/${mes}/${anio} ${hora}:${minutos}`;
    } catch (error) {
      return fecha;
    }
  };

  // Obtener información del estado
  const getEstadoInfo = (estado: string) => {
    const estados: Record<string, { color: string; bg: string; texto: string; emoji: string }> = {
      PENDIENTE: { color: "#F4B419", bg: "#FFF8E1", texto: "Pendiente", emoji: "⏳" },
      PROCESANDO: { color: "#4A90E2", bg: "#E3F2FD", texto: "Procesando", emoji: "🔄" },
      PENDIENTE_VERIFICACION: { color: "#F57C00", bg: "#FFF3E0", texto: "Verificando", emoji: "🔍" },
      COMPLETADO: { color: "#5A8F48", bg: "#E8F5E9", texto: "Completado", emoji: "✅" },
      CANCELADO: { color: "#E74C3C", bg: "#FFEBEE", texto: "Cancelado", emoji: "❌" },
      ENVIADO: { color: "#6366F1", bg: "#EEF2FF", texto: "Enviado", emoji: "🚚" },
      ENTREGADO: { color: "#059669", bg: "#D1FAE5", texto: "Entregado", emoji: "📦" }
    };
    return estados[estado] || { color: "#6B7F69", bg: "#F5F5F5", texto: estado, emoji: "📋" };
  };

  // Descargar/Compartir PDF
  const handleDescargarPDF = async () => {
    if (!pedido) return;
    
    setGeneratingPDF(true);
    try {
      const numeroFactura = generarNumeroFactura(pedido.idPedido);
      
      // Generar HTML para el PDF
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: 'Helvetica', 'Arial', sans-serif;
              margin: 0;
              padding: 20px;
              color: #333;
            }
            .factura-container {
              max-width: 800px;
              margin: 0 auto;
              background: white;
              padding: 30px;
              border-radius: 10px;
              border: 2px solid #E8F5E9;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 2px solid #ECF2E3;
            }
            .logo {
              font-size: 24px;
              font-weight: bold;
              color: #5A8F48;
            }
            .titulo {
              font-size: 28px;
              font-weight: 900;
              color: #2D3E2B;
              margin: 0;
            }
            .numero-factura {
              text-align: right;
              padding: 15px;
              border-radius: 8px;
              border: 2px solid #E3EBD9;
            }
            .grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-bottom: 30px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
            }
            th {
              background: #F5F9F3;
              padding: 12px;
              text-align: left;
              border-bottom: 2px solid #E3EBD9;
              color: #2D3E2B;
              font-size: 12px;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            td {
              padding: 12px;
              border-bottom: 1px solid #ECF2E3;
            }
            .totales {
              background: #F5F9F3;
              padding: 20px;
              border-radius: 8px;
              border: 2px solid #E3EBD9;
              max-width: 350px;
              margin-left: auto;
            }
            .total-final {
              font-size: 24px;
              font-weight: 900;
              color: #5A8F48;
              margin-top: 10px;
            }
            .footer {
              text-align: center;
              padding-top: 20px;
              border-top: 2px solid #ECF2E3;
              color: #6B7F69;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="factura-container">
            <div class="header">
              <div>
                <div class="logo">🏪 Don Carlos Market</div>
                <h1 class="titulo">FACTURA</h1>
              </div>
              <div class="numero-factura">
                <div style="font-size: 11px; color: #6B7F69;">Nº FACTURA</div>
                <div style="font-size: 22px; font-weight: 900; color: #5A8F48;">
                  ${numeroFactura}
                </div>
                <div style="font-size: 10px; color: #9AAA98;">Pedido #${pedido.idPedido}</div>
              </div>
            </div>
            
            <div class="grid">
              <div>
                <h3>Detalles del Pedido</h3>
                <div>
                  <div>📅 Fecha: ${formatearFecha(pedido.fechaPedido)}</div>
                  <div>💳 Método de pago: ${pedido.metodoPago}</div>
                </div>
              </div>
              <div>
                <h3>Estado</h3>
                <div>
                  <div style="font-size: 20px;">${getEstadoInfo(pedido.estadoPedido).emoji}</div>
                  <div style="font-weight: bold; color: ${getEstadoInfo(pedido.estadoPedido).color}">
                    ${getEstadoInfo(pedido.estadoPedido).texto}
                  </div>
                </div>
              </div>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cant.</th>
                  <th>Precio Unit.</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${detalles.map(d => `
                  <tr>
                    <td>${d.producto?.nombreProducto || "Producto"}</td>
                    <td>${d.cantidad}</td>
                    <td>$${(d.subtotal / d.cantidad).toFixed(2)}</td>
                    <td>$${d.subtotal.toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div class="totales">
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span>Subtotal:</span>
                <span>$${pedido.subtotal.toFixed(2)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span>IVA (12%):</span>
                <span>$${pedido.iva.toFixed(2)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-weight: bold;">
                <span>TOTAL:</span>
                <span class="total-final">$${pedido.total.toFixed(2)}</span>
              </div>
            </div>
            
            <div class="footer">
              <p>Gracias por tu compra en Don Carlos Market</p>
              <p>Este documento es una factura válida para efectos tributarios</p>
            </div>
          </div>
        </body>
        </html>
      `;
      
      // Generar y compartir PDF
      const { uri } = await Print.printToFileAsync({ html });
      
      if (Platform.OS === 'ios') {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Factura_${numeroFactura}`,
          UTI: 'com.adobe.pdf'
        });
      } else {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Factura_${numeroFactura}`
        });
      }
      
    } catch (error: any) {
      console.error('Error generando PDF:', error);
      Alert.alert("Error", "No se pudo generar el PDF");
    } finally {
      setGeneratingPDF(false);
    }
  };

  // Compartir como imagen
  const handleCompartirImagen = async () => {
    if (!facturaRef.current || !pedido) return;
    
    try {
      const uri = await captureRef(facturaRef.current, {
        format: 'png',
        quality: 0.8,
      });
      
      await Share.share({
        title: `Factura ${generarNumeroFactura(pedido.idPedido)}`,
        message: `Factura de Don Carlos Market\nPedido #${pedido.idPedido}\nTotal: $${pedido.total.toFixed(2)}`,
        url: Platform.OS === 'ios' ? uri : `file://${uri}`,
      });
    } catch (error: any) {
      console.error('Error compartiendo imagen:', error);
      Alert.alert("Error", "No se pudo compartir la factura");
    }
  };

  // Renderizar carga
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F9FBF7" />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#5A8F48" />
          <Text style={styles.loadingText}>Cargando factura...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!pedido) {
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
          <Text style={styles.headerTitle}>Factura</Text>
          <View style={styles.headerRight} />
        </View>
        
        <View style={styles.centerContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          </View>
          <Text style={styles.emptyTitle}>Error al cargar</Text>
          <Text style={styles.emptySubtitle}>
            No se pudo cargar la información de la factura
          </Text>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => router.push('/consumidor/MisPedidos')}
          >
            <Text style={styles.primaryButtonText}>Volver a mis pedidos</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const estadoInfo = getEstadoInfo(pedido.estadoPedido);
  const numeroFactura = generarNumeroFactura(pedido.idPedido);

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
        <Text style={styles.headerTitle}>Factura</Text>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={fetchFacturaData}
        >
          <Ionicons name="refresh-outline" size={22} color="#5A8F48" />
        </TouchableOpacity>
      </View>

      {/* Contenido de la factura */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollViewContent}
      >
        <View ref={facturaRef} style={styles.facturaContainer}>
          {/* Header de la factura */}
          <View style={styles.facturaHeader}>
            <View style={styles.logoContainer}>
              <View style={styles.logoIcon}>
                <Text style={styles.logoEmoji}>🏪</Text>
              </View>
              <View>
                <Text style={styles.empresaNombre}>Don Carlos Market</Text>
                <Text style={styles.facturaTitulo}>FACTURA</Text>
              </View>
            </View>
            
            <View style={styles.numeroFacturaContainer}>
              <Text style={styles.numeroFacturaLabel}>Nº FACTURA</Text>
              <Text style={styles.numeroFactura}>{numeroFactura}</Text>
              <Text style={styles.idPedido}>Pedido #{pedido.idPedido}</Text>
            </View>
          </View>

          {/* Información en dos columnas */}
          <View style={styles.infoGrid}>
            {/* Detalles del pedido */}
            <View style={styles.infoColumn}>
              <Text style={styles.sectionTitle}>Detalles del Pedido</Text>
              <View style={styles.detallesContainer}>
                <View style={styles.detalleItem}>
                  <View style={styles.detalleIcon}>
                    <Ionicons name="calendar-outline" size={16} color="#6B7F69" />
                  </View>
                  <View style={styles.detalleContent}>
                    <Text style={styles.detalleLabel}>Fecha de emisión</Text>
                    <Text style={styles.detalleValue}>{formatearFecha(pedido.fechaPedido)}</Text>
                  </View>
                </View>
                
                <View style={styles.detalleItem}>
                  <View style={styles.detalleIcon}>
                    <Ionicons 
                      name={pedido.metodoPago === "EFECTIVO" ? "cash-outline" : "card-outline"} 
                      size={16} 
                      color="#6B7F69" 
                    />
                  </View>
                  <View style={styles.detalleContent}>
                    <Text style={styles.detalleLabel}>Método de pago</Text>
                    <Text style={styles.detalleValue}>
                      {pedido.metodoPago === "EFECTIVO" ? "Efectivo" :
                       pedido.metodoPago === "TRANSFERENCIA" ? "Transferencia" :
                       pedido.metodoPago === "TARJETA" ? "Tarjeta" : pedido.metodoPago}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Estado */}
            <View style={styles.infoColumn}>
              <Text style={styles.sectionTitle}>Estado</Text>
              <View style={[styles.estadoContainer, { backgroundColor: estadoInfo.bg, borderColor: estadoInfo.color }]}>
                <Text style={styles.estadoEmoji}>{estadoInfo.emoji}</Text>
                <Text style={styles.estadoLabel}>Estado actual</Text>
                <Text style={[styles.estadoTexto, { color: estadoInfo.color }]}>{estadoInfo.texto}</Text>
              </View>
            </View>
          </View>

          {/* Productos del pedido */}
          <View style={styles.productosSection}>
            <Text style={styles.sectionTitle}>Productos del Pedido</Text>
            <View style={styles.productosContainer}>
              {/* Encabezados de la tabla */}
              <View style={styles.productosHeader}>
                <Text style={[styles.productosHeaderText, { flex: 3 }]}>Producto</Text>
                <Text style={[styles.productosHeaderText, { width: 50, textAlign: 'center' }]}>Cant.</Text>
                <Text style={[styles.productosHeaderText, { width: 70, textAlign: 'right' }]}>P.Unit.</Text>
                <Text style={[styles.productosHeaderText, { width: 80, textAlign: 'right' }]}>Subtotal</Text>
              </View>
              
              {/* Lista de productos */}
              {detalles.map((d, i) => (
                <View key={i} style={styles.productoRow}>
                  <Text style={[styles.productoText, { flex: 3 }]} numberOfLines={2}>
                    {d.producto?.nombreProducto || "Producto"}
                  </Text>
                  <Text style={[styles.productoText, { width: 50, textAlign: 'center' }]}>
                    {d.cantidad}
                  </Text>
                  <Text style={[styles.productoText, { width: 70, textAlign: 'right' }]}>
                    ${(d.subtotal / d.cantidad).toFixed(2)}
                  </Text>
                  <Text style={[styles.productoText, styles.productoSubtotal, { width: 80, textAlign: 'right' }]}>
                    ${d.subtotal.toFixed(2)}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Totales */}
          <View style={styles.totalesContainer}>
            <View style={styles.totalesContent}>
              <View style={styles.totalItem}>
                <Text style={styles.totalLabel}>Subtotal</Text>
                <Text style={styles.totalValue}>${pedido.subtotal.toFixed(2)}</Text>
              </View>
              
              <View style={styles.totalItem}>
                <Text style={styles.totalLabel}>IVA (12%)</Text>
                <Text style={styles.totalValue}>${pedido.iva.toFixed(2)}</Text>
              </View>
              
              <View style={[styles.totalItem, styles.totalFinal]}>
                <Text style={styles.totalFinalLabel}>Total</Text>
                <Text style={styles.totalFinalValue}>${pedido.total.toFixed(2)}</Text>
              </View>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Gracias por tu compra en Don Carlos Market
            </Text>
            <Text style={styles.footerSubtext}>
              Este documento es una factura válida para efectos tributarios
            </Text>
            
            {pedido.estadoPedido === "PENDIENTE_VERIFICACION" && (
              <View style={styles.alertaContainer}>
                <Ionicons name="warning-outline" size={16} color="#F57C00" />
                <Text style={styles.alertaText}>
                  Esta factura está sujeta a verificación de pago
                </Text>
              </View>
            )}
            
            {pedido.estadoPedido === "COMPLETADO" && (
              <View style={styles.confirmacionContainer}>
                <Ionicons name="checkmark-circle" size={16} color="#5A8F48" />
                <Text style={styles.confirmacionText}>
                  Pago verificado y confirmado
                </Text>
              </View>
            )}
          </View>
        </View>
        
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Botones de acción */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.downloadButton]}
          onPress={handleDescargarPDF}
          disabled={generatingPDF}
        >
          {generatingPDF ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <MaterialIcons name="picture-as-pdf" size={20} color="#FFFFFF" />
              <Text style={styles.downloadButtonText}>Descargar PDF</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.shareButton]}
          onPress={handleCompartirImagen}
        >
          <FontAwesome name="share-alt" size={18} color="#5A8F48" />
          <Text style={styles.shareButtonText}>Compartir</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.pedidoButton]}
          onPress={() => router.push(`/consumidor/PedidoDetalle?id=${idPedido}`)}
        >
          <Ionicons name="cube-outline" size={18} color="#2D3E2B" />
          <Text style={styles.pedidoButtonText}>Ver pedido</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const { width } = Dimensions.get('window');

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
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 16,
  },
  facturaContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E8F5E9',
  },
  facturaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#ECF2E3',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoIcon: {
    width: 50,
    height: 50,
    backgroundColor: '#5A8F48',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoEmoji: {
    fontSize: 28,
  },
  empresaNombre: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7F69',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  facturaTitulo: {
    fontSize: 28,
    fontWeight: '900',
    color: '#2D3E2B',
    fontFamily: 'System',
    marginTop: 2,
  },
  numeroFacturaContainer: {
    backgroundColor: '#F5F9F3',
    padding: 16,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E3EBD9',
    alignItems: 'flex-end',
  },
  numeroFacturaLabel: {
    fontSize: 11,
    color: '#6B7F69',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  numeroFactura: {
    fontSize: 22,
    fontWeight: '900',
    color: '#5A8F48',
    fontFamily: 'System',
    marginBottom: 2,
  },
  idPedido: {
    fontSize: 10,
    color: '#9AAA98',
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  infoColumn: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7F69',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  detallesContainer: {
    backgroundColor: '#FAFBF9',
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ECF2E3',
  },
  detalleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detalleIcon: {
    marginRight: 10,
  },
  detalleContent: {
    flex: 1,
  },
  detalleLabel: {
    fontSize: 10,
    color: '#9AAA98',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  detalleValue: {
    fontSize: 14,
    color: '#2D3E2B',
    fontWeight: '600',
  },
  estadoContainer: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 10,
    borderWidth: 2,
  },
  estadoEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  estadoLabel: {
    fontSize: 11,
    color: '#6B7F69',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  estadoTexto: {
    fontSize: 18,
    fontWeight: '700',
  },
  productosSection: {
    marginBottom: 24,
  },
  productosContainer: {
    backgroundColor: '#FAFBF9',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ECF2E3',
    overflow: 'hidden',
  },
  productosHeader: {
    flexDirection: 'row',
    backgroundColor: '#F5F9F3',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#E3EBD9',
  },
  productosHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2D3E2B',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  productoRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ECF2E3',
    alignItems: 'center',
  },
  productoText: {
    fontSize: 14,
    color: '#6B7F69',
  },
  productoSubtotal: {
    color: '#5A8F48',
    fontWeight: '700',
  },
  totalesContainer: {
    marginBottom: 24,
  },
  totalesContent: {
    backgroundColor: '#F5F9F3',
    padding: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E3EBD9',
    alignSelf: 'flex-end',
    minWidth: 250,
  },
  totalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#D5E3CC',
  },
  totalLabel: {
    fontSize: 14,
    color: '#6B7F69',
  },
  totalValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2D3E2B',
  },
  totalFinal: {
    borderBottomWidth: 0,
    marginBottom: 0,
    paddingBottom: 0,
    marginTop: 4,
  },
  totalFinalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D3E2B',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  totalFinalValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#5A8F48',
    fontFamily: 'System',
  },
  footer: {
    paddingTop: 20,
    borderTopWidth: 2,
    borderTopColor: '#ECF2E3',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#6B7F69',
    textAlign: 'center',
    marginBottom: 6,
  },
  footerSubtext: {
    fontSize: 11,
    color: '#B5C4B3',
    textAlign: 'center',
    marginBottom: 16,
  },
  alertaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFECB3',
    gap: 8,
  },
  alertaText: {
    fontSize: 12,
    color: '#F57C00',
    fontWeight: '600',
  },
  confirmacionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C8E6C9',
    gap: 8,
  },
  confirmacionText: {
    fontSize: 12,
    color: '#5A8F48',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8F5E9',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  downloadButton: {
    backgroundColor: '#5A8F48',
  },
  downloadButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  shareButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#5A8F48',
  },
  shareButtonText: {
    color: '#5A8F48',
    fontSize: 14,
    fontWeight: '700',
  },
  pedidoButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E3EBD9',
  },
  pedidoButtonText: {
    color: '#2D3E2B',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7F69',
    fontWeight: '600',
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
  bottomSpacing: {
    height: 20,
  },
});

export default Factura;