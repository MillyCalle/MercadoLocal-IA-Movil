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
      PENDIENTE: { color: "#F59E0B", bg: "#FEF3C7", texto: "Pendiente" },
      PROCESANDO: { color: "#3B82F6", bg: "#DBEAFE", texto: "Procesando" },
      PENDIENTE_VERIFICACION: { color: "#8B5CF6", bg: "#EDE9FE", texto: "Verificando" },
      COMPLETADO: { color: "#10B981", bg: "#D1FAE5", texto: "Completado" },
      CANCELADO: { color: "#EF4444", bg: "#FEE2E2", texto: "Cancelado" },
      ENVIADO: { color: "#6366F1", bg: "#E0E7FF", texto: "Enviado" },
      ENTREGADO: { color: "#059669", bg: "#D1FAE5", texto: "Entregado" }
    };
    return estados[estado] || { color: "#6B7280", bg: "#F3F4F6", texto: estado };
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
              border-radius: 12px;
              border: 2px solid #FF6B35;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .empresa-nombre {
              font-size: 24px;
              font-weight: bold;
              color: #FF6B35;
              margin-bottom: 8px;
            }
            .factura-titulo {
              font-size: 32px;
              font-weight: 900;
              color: #1F2937;
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
              background: #FFF2E8;
              padding: 12px;
              text-align: left;
              border-bottom: 2px solid #FF6B35;
              color: #1F2937;
              font-size: 12px;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            td {
              padding: 12px;
              border-bottom: 1px solid #FFD3BE;
            }
            .totales {
              background: #FFF2E8;
              padding: 20px;
              border-radius: 8px;
              border: 2px solid #FF6B35;
              max-width: 350px;
              margin-left: auto;
            }
            .total-final {
              font-size: 24px;
              font-weight: 900;
              color: #FF6B35;
              margin-top: 10px;
            }
            .footer {
              text-align: center;
              padding-top: 20px;
              border-top: 2px solid #FFD3BE;
              color: #6B7280;
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
              <div style="font-size: 11px; color: #6B7280;">Nº FACTURA</div>
              <div style="font-size: 22px; font-weight: 900; color: #FF6B35;">
                ${numeroFactura}
              </div>
              <div style="font-size: 10px; color: #9CA3AF;">Pedido #${pedido.idPedido}</div>
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
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>Cargando factura...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!pedido) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
        
        {/* Header con efectos visuales */}
        <View style={styles.header}>
          <FloatingCircles />
          
          <View style={styles.headerTop}>
            <Text style={styles.headerIcon}>📄</Text>
          </View>
          
          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle}>Factura</Text>
            <View style={styles.titleUnderline} />
          </View>
          
          <Text style={styles.headerSubtitle}>
            Detalles de tu factura
          </Text>
        </View>
        
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📄</Text>
          <Text style={styles.emptyTitle}>Error al cargar la factura</Text>
          <Text style={styles.emptySubtitle}>
            No se pudo cargar la información de la factura
          </Text>
          <TouchableOpacity 
            style={styles.exploreButton}
            onPress={() => router.push('/consumidor/MisPedidos')}
          >
            <Text style={styles.exploreButtonText}>Volver a mis pedidos</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const estadoInfo = getEstadoInfo(pedido.estadoPedido);
  const numeroFactura = generarNumeroFactura(pedido.idPedido);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      {/* Header con efectos visuales */}
      <View style={styles.header}>
        <FloatingCircles />
        
        <View style={styles.headerTop}>
          <Text style={styles.headerIcon}>📄</Text>
        </View>
        
        <View style={styles.titleContainer}>
          <Text style={styles.headerTitle}>Factura</Text>
          <View style={styles.titleUnderline} />
        </View>
        
        <Text style={styles.headerSubtitle}>
          Detalles de tu factura
        </Text>
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
                <View style={[styles.estadoDot, { backgroundColor: estadoInfo.color }]} />
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
              <FontAwesome name="share-alt" size={16} color="#FF6B35" />
              <Text style={styles.shareButtonText}>Compartir</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.botonAccion, styles.pedidoButton]}
              onPress={() => router.push(`/consumidor/PedidoDetalle?id=${idPedido}`)}
            >
              <Ionicons name="cube-outline" size={16} color="#1F2937" />
              <Text style={styles.pedidoButtonText}>Ver pedido</Text>
            </TouchableOpacity>
          </View>

          {/* Footer informativo */}
          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>Gracias por tu compra en</Text>
            <Text style={styles.footerEmpresa}>MERCADO LOCAL - IA</Text>
            <Text style={styles.footerNota}>
              Este documento es una factura válida para efectos tributarios
            </Text>
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
    backgroundColor: "#f8f9fa",
  },
  
  // Efectos de círculos flotantes - MISMO QUE EXPLORAR, CARRITO Y MIS PEDIDOS
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
  
  // Header mejorado - MISMO ESTILO QUE TODAS LAS PANTALLAS
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
  },
  scrollViewContent: {
    padding: 16,
    paddingBottom: 20,
  },
  
  // Contenedor de factura - MISMO ESTILO QUE TARJETAS
  facturaContainer: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    overflow: "hidden",
  },
  
  // 1. TÍTULO
  tituloSeccion: {
    alignItems: 'center',
    marginBottom: 20,
  },
  nombrePlataforma: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FF6B35',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: "System",
  },
  facturaTitulo: {
    fontSize: 32,
    fontWeight: '900',
    color: '#1F2937',
    fontFamily: "System",
  },
  
  // 2. NÚMERO DE FACTURA
  numeroFacturaContainer: {
    alignItems: 'center',
    marginBottom: 24,
    padding: 20,
    backgroundColor: '#FFF2E8',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  numeroFacturaLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 6,
    fontFamily: "System",
    letterSpacing: 1,
  },
  numeroFactura: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FF6B35',
    marginBottom: 4,
    fontFamily: "System",
  },
  idPedido: {
    fontSize: 14,
    color: '#9CA3AF',
    fontFamily: "System",
  },
  
  // 3. DETALLES Y ESTADO
  detallesGrid: {
    flexDirection: 'row',
    marginBottom: 20,
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
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontFamily: "System",
  },
  detalleFila: {
    marginBottom: 12,
  },
  detalleLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
    fontFamily: "System",
  },
  detalleValor: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '600',
    fontFamily: "System",
  },
  estadoLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    textAlign: 'right',
    fontFamily: "System",
  },
  estadoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 100,
    justifyContent: 'center',
  },
  estadoDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  estadoTexto: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: "System",
  },
  
  // 4. TABLA DE PRODUCTOS
  tablaProductos: {
    marginBottom: 20,
  },
  tablaHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#FF6B35',
    marginBottom: 8,
    backgroundColor: '#FFF2E8',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  tablaHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1F2937',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: "System",
  },
  tablaFila: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#FFD3BE',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  tablaTexto: {
    fontSize: 14,
    color: '#1F2937',
    fontFamily: "System",
  },
  tablaSubtotal: {
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: '700',
    fontFamily: "System",
  },
  
  // 5. TOTALES
  totalesContainer: {
    marginBottom: 20,
    backgroundColor: '#FFF2E8',
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  totalFila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  totalLabel: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
    fontFamily: "System",
  },
  totalValor: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    fontFamily: "System",
  },
  separadorDelgado: {
    height: 1,
    backgroundColor: '#FFD3BE',
    marginVertical: 12,
  },
  totalFinalFila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  totalFinalLabel: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1F2937',
    textTransform: 'uppercase',
    fontFamily: "System",
  },
  totalFinalValor: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FF6B35',
    fontFamily: "System",
  },
  
  // 6. BOTONES
  botonesContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  botonAccion: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  downloadButton: {
    backgroundColor: '#FF6B35',
  },
  shareButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  pedidoButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  
  // Textos de botones específicos
  downloadButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: "System",
  },
  shareButtonText: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: "System",
  },
  pedidoButtonText: {
    color: '#1F2937',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: "System",
  },
  
  // Footer informativo
  footerContainer: {
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  footerText: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: "System",
  },
  footerEmpresa: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF6B35',
    marginTop: 4,
    fontFamily: "System",
  },
  footerNota: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
    fontFamily: "System",
  },
  
  // UTILIDADES
  separador: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 20,
  },
  bottomSpacing: {
    height: 20,
  },
});

export default Factura;