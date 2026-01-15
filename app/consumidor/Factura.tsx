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

  // NOMBRE FIJO DE LA PLATAFORMA
  const NOMBRE_PLATAFORMA = "MERCADO LOCAL - IA";

  // Generar número de factura
  const generarNumeroFactura = (idPedido: string) => {
    const num = parseInt(idPedido);
    return `FAC-${String(num).padStart(6, "0")}`;
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
    const estados: Record<string, { color: string; bg: string; texto: string; }> = {
      PENDIENTE: { color: "#F4B419", bg: "#FFF8E1", texto: "Pendiente" },
      PROCESANDO: { color: "#4A90E2", bg: "#E3F2FD", texto: "Procesando" },
      PENDIENTE_VERIFICACION: { color: "#F57C00", bg: "#FFF3E0", texto: "Verificando" },
      COMPLETADO: { color: "#5A8F48", bg: "#E8F5E9", texto: "Completado" },
      CANCELADO: { color: "#E74C3C", bg: "#FFEBEE", texto: "Cancelado" },
      ENVIADO: { color: "#6366F1", bg: "#EEF2FF", texto: "Enviado" },
      ENTREGADO: { color: "#059669", bg: "#D1FAE5", texto: "Entregado" }
    };
    return estados[estado] || { color: "#6B7F69", bg: "#F5F5F5", texto: estado };
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
              text-align: center;
              margin-bottom: 30px;
            }
            .empresa-nombre {
              font-size: 24px;
              font-weight: bold;
              color: #5A8F48;
              margin-bottom: 8px;
            }
            .factura-titulo {
              font-size: 32px;
              font-weight: 900;
              color: #2D3E2B;
              margin: 0;
            }
            .numero-factura {
              text-align: center;
              padding: 15px;
              margin-bottom: 20px;
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
              <div class="empresa-nombre">${NOMBRE_PLATAFORMA}</div>
              <h1 class="factura-titulo">FACTURA</h1>
            </div>
            
            <div class="numero-factura">
              <div style="font-size: 11px; color: #6B7F69;">Nº FACTURA</div>
              <div style="font-size: 22px; font-weight: 900; color: #5A8F48;">
                ${numeroFactura}
              </div>
              <div style="font-size: 10px; color: #9AAA98;">Pedido #${pedido.idPedido}</div>
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
              <p>Gracias por tu compra en ${NOMBRE_PLATAFORMA}</p>
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
        message: `Factura de ${NOMBRE_PLATAFORMA}\nPedido #${pedido.idPedido}\nTotal: $${pedido.total.toFixed(2)}`,
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
          
          {/* 1. TÍTULO DE LA FACTURA */}
          <View style={styles.tituloSeccion}>
            <Text style={styles.nombrePlataforma}>{NOMBRE_PLATAFORMA}</Text>
            <Text style={styles.facturaTitulo}>FACTURA</Text>
          </View>

          {/* 2. NÚMERO DE FACTURA Y PEDIDO */}
          <View style={styles.numeroFacturaContainer}>
            <Text style={styles.numeroFacturaLabel}>N° FACTURA</Text>
            <Text style={styles.numeroFactura}>{numeroFactura}</Text>
            <Text style={styles.idPedido}>Pedido #{pedido.idPedido}</Text>
          </View>

          <View style={styles.separador} />

          {/* 3. DETALLES DEL PEDIDO Y ESTADO EN DOS COLUMNAS */}
          <View style={styles.detallesGrid}>
            
            {/* Columna izquierda: Detalles */}
            <View style={styles.detallesColumna}>
              <Text style={styles.seccionTitulo}>DETALLES DEL PEDIDO</Text>
              
              <View style={styles.detalleFila}>
                <Text style={styles.detalleLabel}>FECHA DE EMISIÓN</Text>
                <Text style={styles.detalleValor}>{formatearFecha(pedido.fechaPedido)}</Text>
              </View>
              
              <View style={styles.detalleFila}>
                <Text style={styles.detalleLabel}>MÉTODO DE PAGO</Text>
                <Text style={styles.detalleValor}>
                  {pedido.metodoPago === "EFECTIVO" ? "Efectivo" :
                   pedido.metodoPago === "TRANSFERENCIA" ? "Transferencia" :
                   pedido.metodoPago === "TARJETA" ? "Tarjeta" : pedido.metodoPago}
                </Text>
              </View>
            </View>

            {/* Columna derecha: Estado */}
            <View style={styles.estadoColumna}>
              <Text style={styles.seccionTitulo}>ESTADO</Text>
              <Text style={styles.estadoLabel}>ESTADO ACTUAL</Text>
              <View style={[styles.estadoBadge, { backgroundColor: estadoInfo.bg }]}>
                <Text style={[styles.estadoTexto, { color: estadoInfo.color }]}>
                  {estadoInfo.texto}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.separador} />

          {/* 4. PRODUCTOS DEL PEDIDO */}
          <Text style={styles.seccionTitulo}>PRODUCTOS DEL PEDIDO</Text>
          
          <View style={styles.tablaProductos}>
            {/* Encabezado de la tabla */}
            <View style={styles.tablaHeader}>
              <Text style={[styles.tablaHeaderText, { flex: 3 }]}>PRODUCTO</Text>
              <Text style={[styles.tablaHeaderText, { flex: 1, textAlign: 'center' }]}>CANT.</Text>
              <Text style={[styles.tablaHeaderText, { flex: 1.5, textAlign: 'right' }]}>P.UNIT.</Text>
              <Text style={[styles.tablaHeaderText, { flex: 1.5, textAlign: 'right' }]}>SUBTOTAL</Text>
            </View>
            
            {/* Filas de productos */}
            {detalles.map((d, i) => (
              <View key={i} style={styles.tablaFila}>
                <Text style={[styles.tablaTexto, { flex: 3 }]} numberOfLines={1}>
                  {d.producto?.nombreProducto || "Producto"}
                </Text>
                <Text style={[styles.tablaTexto, { flex: 1, textAlign: 'center' }]}>
                  {d.cantidad}
                </Text>
                <Text style={[styles.tablaTexto, { flex: 1.5, textAlign: 'right' }]}>
                  ${(d.subtotal / d.cantidad).toFixed(2)}
                </Text>
                <Text style={[styles.tablaSubtotal, { flex: 1.5, textAlign: 'right' }]}>
                  ${d.subtotal.toFixed(2)}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.separador} />

          {/* 5. TOTALES */}
          <View style={styles.totalesContainer}>
            <View style={styles.totalFila}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValor}>${pedido.subtotal.toFixed(2)}</Text>
            </View>
            
            <View style={styles.totalFila}>
              <Text style={styles.totalLabel}>IVA (12%)</Text>
              <Text style={styles.totalValor}>${pedido.iva.toFixed(2)}</Text>
            </View>
            
            <View style={styles.separadorDelgado} />
            
            <View style={styles.totalFinalFila}>
              <Text style={styles.totalFinalLabel}>TOTAL</Text>
              <Text style={styles.totalFinalValor}>${pedido.total.toFixed(2)}</Text>
            </View>
          </View>

          <View style={styles.separador} />

          {/* 6. BOTONES EN EL FOOTER */}
          <View style={styles.botonesContainer}>
            <TouchableOpacity
              style={[styles.botonAccion, styles.downloadButton]}
              onPress={handleDescargarPDF}
              disabled={generatingPDF}
            >
              {generatingPDF ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <MaterialIcons name="picture-as-pdf" size={18} color="#FFFFFF" />
                  <Text style={styles.downloadButtonText}>Descargar PDF</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.botonAccion, styles.shareButton]}
              onPress={handleCompartirImagen}
            >
              <FontAwesome name="share-alt" size={16} color="#5A8F48" />
              <Text style={styles.shareButtonText}>Compartir</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.botonAccion, styles.pedidoButton]}
              onPress={() => router.push(`/consumidor/PedidoDetalle?id=${idPedido}`)}
            >
              <Ionicons name="cube-outline" size={16} color="#2D3E2B" />
              <Text style={styles.pedidoButtonText}>Ver pedido</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.bottomSpacing} />
      </ScrollView>
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
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 16,
    paddingBottom: 20,
  },
  facturaContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  
  // 1. TÍTULO
  tituloSeccion: {
    alignItems: 'center',
    marginBottom: 16,
  },
  nombrePlataforma: {
    fontSize: 20,
    fontWeight: '700',
    color: '#5A8F48',
    marginBottom: 4,
    textAlign: 'center',
  },
  facturaTitulo: {
    fontSize: 24,
    fontWeight: '900',
    color: '#2D3E2B',
  },
  
  // 2. NÚMERO DE FACTURA
  numeroFacturaContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  numeroFacturaLabel: {
    fontSize: 12,
    color: '#6B7F69',
    fontWeight: '600',
    marginBottom: 4,
  },
  numeroFactura: {
    fontSize: 24,
    fontWeight: '900',
    color: '#5A8F48',
    marginBottom: 2,
  },
  idPedido: {
    fontSize: 12,
    color: '#9AAA98',
  },
  
  // 3. DETALLES Y ESTADO
  detallesGrid: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  detallesColumna: {
    flex: 1,
    marginRight: 16,
  },
  estadoColumna: {
    flex: 1,
    alignItems: 'flex-end',
  },
  seccionTitulo: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2D3E2B',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  detalleFila: {
    marginBottom: 10,
  },
  detalleLabel: {
    fontSize: 11,
    color: '#9AAA98',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  detalleValor: {
    fontSize: 15,
    color: '#2D3E2B',
    fontWeight: '600',
  },
  estadoLabel: {
    fontSize: 11,
    color: '#9AAA98',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
    textAlign: 'right',
  },
  estadoBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 100,
    alignItems: 'center',
  },
  estadoTexto: {
    fontSize: 14,
    fontWeight: '700',
  },
  
  // 4. TABLA DE PRODUCTOS
  tablaProductos: {
    marginBottom: 16,
  },
  tablaHeader: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#E3EBD9',
    marginBottom: 8,
  },
  tablaHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7F69',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tablaFila: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ECF2E3',
    alignItems: 'center',
  },
  tablaTexto: {
    fontSize: 14,
    color: '#2D3E2B',
  },
  tablaSubtotal: {
    fontSize: 14,
    color: '#5A8F48',
    fontWeight: '700',
  },
  
  // 5. TOTALES
  totalesContainer: {
    marginBottom: 16,
  },
  totalFila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: '#6B7F69',
  },
  totalValor: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2D3E2B',
  },
  separadorDelgado: {
    height: 1,
    backgroundColor: '#ECF2E3',
    marginVertical: 10,
  },
  totalFinalFila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  totalFinalLabel: {
    fontSize: 18,
    fontWeight: '900',
    color: '#2D3E2B',
    textTransform: 'uppercase',
  },
  totalFinalValor: {
    fontSize: 24,
    fontWeight: '900',
    color: '#5A8F48',
  },
  
  // 6. BOTONES
  botonesContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  botonAccion: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  downloadButton: {
    backgroundColor: '#5A8F48',
  },
  shareButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#5A8F48',
  },
  pedidoButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E3EBD9',
  },
  
  // Textos de botones específicos
  downloadButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  shareButtonText: {
    color: '#5A8F48',
    fontSize: 13,
    fontWeight: '700',
  },
  pedidoButtonText: {
    color: '#2D3E2B',
    fontSize: 13,
    fontWeight: '700',
  },
  
  // UTILIDADES
  separador: {
    height: 1,
    backgroundColor: '#ECF2E3',
    marginVertical: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7F69',
    fontWeight: '600',
  },
  
  // Estilos para pantalla de error
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