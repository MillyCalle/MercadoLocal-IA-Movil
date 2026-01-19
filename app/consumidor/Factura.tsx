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
  Image,
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

interface Cliente {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  cedula?: string;
  telefono?: string;
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
  cliente?: Cliente;
}

// Importar el logo - RUTA CORREGIDA
const LOGO_PATH = require('../../assets/images/Logo.png');

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

  // NOMBRES DE LA PLATAFORMA ACTUALIZADOS
  const NOMBRE_PRINCIPAL = "My Harvest";
  const MARCA_REGISTRADA = "Mercado Local IA";

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

  // Formatear cédula (agregar puntos)
  const formatearCedula = (cedula?: string) => {
    if (!cedula) return "No especificada";
    // Formato: XX.XXX.XXX-X
    const limpiada = cedula.replace(/\D/g, '');
    if (limpiada.length >= 8) {
      return `${limpiada.substring(0, 2)}.${limpiada.substring(2, 5)}.${limpiada.substring(5, 8)}-${limpiada.substring(8)}`;
    }
    return cedula;
  };

  // Descargar/Compartir PDF
  const handleDescargarPDF = async () => {
    if (!pedido) return;
    
    setGeneratingPDF(true);
    try {
      const numeroFactura = generarNumeroFactura(pedido.idPedido);
      
      // Generar HTML para el PDF optimizado y profesional
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
            
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            
            body {
              font-family: 'Poppins', 'Helvetica', 'Arial', sans-serif;
              margin: 0;
              padding: 15px;
              color: #333;
              background: #ffffff;
              width: 100%;
              min-height: 100vh;
              font-size: 12px;
            }
            
            .factura-container {
              max-width: 200mm; /* Un poco más pequeño */
              min-height: 280mm; /* Reducido */
              margin: 0 auto;
              background: white;
              padding: 15mm 15mm; /* Márgenes reducidos */
              border: 1.5px solid #FF6B35;
              box-shadow: 0 4px 20px rgba(255, 107, 53, 0.1);
              position: relative;
              overflow: hidden;
              page-break-inside: avoid;
            }
            
            /* Header más compacto */
            .factura-header {
              display: flex;
              flex-direction: column;
              align-items: center;
              margin-bottom: 20px;
              position: relative;
              z-index: 1;
              text-align: center;
              border-bottom: 1.5px solid #FF6B35;
              padding-bottom: 15px;
            }
            
            .logo-titulo {
              font-size: 20px; /* Reducido */
              font-weight: 800;
              color: #FF6B35;
              margin-bottom: 3px;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            
            .logo-subtitle {
              font-size: 10px; /* Reducido */
              color: #6B7280;
              font-weight: 500;
              letter-spacing: 0.8px;
              margin-bottom: 10px;
            }
            
            .factura-titulo {
              font-size: 28px; /* Reducido */
              font-weight: 900;
              color: #1F2937;
              margin: 8px 0;
              position: relative;
              display: inline-block;
            }
            
            .factura-titulo:after {
              content: '';
              position: absolute;
              bottom: -6px;
              left: 50%;
              transform: translateX(-50%);
              width: 80px;
              height: 3px;
              background: #FF6B35;
              border-radius: 2px;
            }
            
            .numero-factura-container {
              text-align: center;
              padding: 15px;
              margin-bottom: 20px;
              background: linear-gradient(135deg, #FFF2E8 0%, #FFE4CC 100%);
              border-radius: 8px;
              border: 1.5px dashed #FF6B35;
              position: relative;
              z-index: 1;
            }
            
            .numero-factura-label {
              font-size: 10px;
              color: #FF6B35;
              font-weight: 700;
              margin-bottom: 6px;
              text-transform: uppercase;
              letter-spacing: 1.5px;
            }
            
            .numero-factura {
              font-size: 24px; /* Reducido */
              font-weight: 900;
              color: #FF6B35;
              margin-bottom: 4px;
            }
            
            .id-pedido {
              font-size: 11px;
              color: #9CA3AF;
              font-weight: 500;
            }
            
            /* Sección de información - dos columnas */
            .info-container {
              display: flex;
              justify-content: space-between;
              margin-bottom: 20px;
              gap: 15px;
            }
            
            .info-columna {
              flex: 1;
              background: #f8f9fa;
              padding: 15px;
              border-radius: 6px;
              border: 1px solid #E5E7EB;
            }
            
            .info-titulo {
              font-size: 12px;
              font-weight: 700;
              color: #1F2937;
              margin-bottom: 10px;
              text-transform: uppercase;
              letter-spacing: 0.8px;
              border-bottom: 1.5px solid #FF6B35;
              padding-bottom: 5px;
              display: inline-block;
            }
            
            .info-fila {
              margin-bottom: 8px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              page-break-inside: avoid;
            }
            
            .info-label {
              font-size: 10px;
              color: #6B7280;
              font-weight: 600;
              flex: 1;
            }
            
            .info-valor {
              font-size: 11px;
              color: #1F2937;
              font-weight: 600;
              flex: 2;
              text-align: right;
            }
            
            /* Tabla de productos más compacta */
            .tabla-container {
              margin-bottom: 20px;
              page-break-inside: avoid;
              overflow: hidden;
            }
            
            .tabla-titulo {
              font-size: 12px;
              font-weight: 700;
              color: #1F2937;
              margin-bottom: 12px;
              text-transform: uppercase;
              letter-spacing: 0.8px;
              border-bottom: 1.5px solid #FF6B35;
              padding-bottom: 5px;
              display: inline-block;
            }
            
            .productos-table {
              width: 100%;
              border-collapse: collapse;
              border-spacing: 0;
              font-size: 10px;
              page-break-inside: avoid;
            }
            
            .productos-table th {
              background: linear-gradient(135deg, #FF6B35 0%, #FF8E53 100%);
              padding: 10px 6px;
              text-align: left;
              color: white;
              font-size: 9px;
              text-transform: uppercase;
              letter-spacing: 0.8px;
              font-weight: 700;
              border: none;
            }
            
            .productos-table th:first-child {
              border-radius: 4px 0 0 0;
            }
            
            .productos-table th:last-child {
              border-radius: 0 4px 0 0;
            }
            
            .productos-table td {
              padding: 8px 6px;
              border-bottom: 1px solid #FFD3BE;
              background: white;
              vertical-align: top;
              page-break-inside: avoid;
            }
            
            .productos-table tr:last-child td {
              border-bottom: none;
            }
            
            .productos-table tr:nth-child(even) td {
              background: #FFF9F5;
            }
            
            .producto-nombre {
              font-weight: 600;
              color: #1F2937;
              max-width: 180px;
              word-wrap: break-word;
            }
            
            /* Totales más compactos */
            .totales-container {
              background: linear-gradient(135deg, #FFF2E8 0%, #FFE4CC 100%);
              padding: 15px;
              border-radius: 8px;
              border: 1.5px solid #FF6B35;
              width: 100%;
              max-width: 350px;
              margin-left: auto;
              position: relative;
              z-index: 1;
              page-break-inside: avoid;
            }
            
            .total-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 10px;
              font-size: 12px;
            }
            
            .total-row.final {
              margin-top: 12px;
              padding-top: 12px;
              border-top: 1.5px solid #FF8E53;
            }
            
            .total-label {
              color: #6B7280;
              font-weight: 600;
            }
            
            .total-value {
              color: #1F2937;
              font-weight: 700;
            }
            
            .total-final-value {
              font-size: 20px; /* Reducido */
              font-weight: 900;
              color: #FF6B35;
            }
            
            /* Footer más pequeño */
            .footer {
              text-align: center;
              padding-top: 20px;
              border-top: 1.5px solid #FFD3BE;
              color: #6B7280;
              font-size: 9px;
              position: relative;
              z-index: 1;
              margin-top: 25px;
              page-break-inside: avoid;
            }
            
            .footer-brand {
              font-size: 14px; /* Reducido */
              font-weight: 800;
              color: #FF6B35;
              margin-bottom: 4px;
              letter-spacing: 0.8px;
            }
            
            .footer-trademark {
              font-size: 8px;
              color: #9CA3AF;
              font-style: italic;
              margin-top: 3px;
            }
            
            /* MARCA DE AGUA MEJORADA */
            .watermark {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-45deg);
              font-size: 80px; /* Reducido y más bonito */
              font-weight: 900;
              color: rgba(255, 107, 53, 0.08); /* Más sutil pero visible */
              z-index: 0;
              pointer-events: none;
              white-space: nowrap;
              opacity: 0.7;
              text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.05);
              letter-spacing: 2px;
              font-family: 'Poppins', sans-serif;
            }
            
            /* Segundo watermark más tenue */
            .watermark-back {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(45deg);
              font-size: 70px;
              font-weight: 900;
              color: rgba(52, 152, 219, 0.04); /* Azul tenue */
              z-index: 0;
              pointer-events: none;
              white-space: nowrap;
              opacity: 0.5;
              text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.03);
              letter-spacing: 1px;
              font-family: 'Poppins', sans-serif;
            }
            
            /* Asegurar que el contenido tenga fondo blanco */
            .factura-container > *:not(.watermark):not(.watermark-back) {
              position: relative;
              z-index: 1;
              background: transparent;
            }
            
            /* Control de saltos de página */
            .keep-together {
              page-break-inside: avoid;
            }
            
            /* Responsive para PDF */
            @media print {
              body {
                padding: 0;
                margin: 0;
                background: white;
              }
              
              .factura-container {
                max-width: 100%;
                min-height: 280mm;
                padding: 10mm 15mm;
                margin: 0;
                border: none;
                box-shadow: none;
              }
              
              .watermark {
                font-size: 70px;
              }
              
              .watermark-back {
                font-size: 60px;
              }
            }
            
            /* Separador */
            .separador {
              height: 1px;
              background: #FFD3BE;
              margin: 15px 0;
            }
          </style>
        </head>
        <body>
          <div class="factura-container">
            <!-- MARCA DE AGUA MEJORADA -->
            <div class="watermark">${NOMBRE_PRINCIPAL}</div>
            <div class="watermark-back">${MARCA_REGISTRADA}</div>
            
            <!-- Header compacto -->
            <div class="factura-header">
              <h1 class="logo-titulo">${NOMBRE_PRINCIPAL}</h1>
              <div class="logo-subtitle">${MARCA_REGISTRADA}</div>
              <h1 class="factura-titulo">FACTURA</h1>
            </div>
            
            <!-- Número de factura -->
            <div class="numero-factura-container">
              <div class="numero-factura-label">N° FACTURA</div>
              <div class="numero-factura">${numeroFactura}</div>
              <div class="id-pedido">Pedido #${pedido.idPedido}</div>
            </div>
            
            <!-- Información en dos columnas -->
            <div class="info-container">
              <!-- Columna izquierda: Información del cliente -->
              <div class="info-columna keep-together">
                <h3 class="info-titulo">Datos del Cliente</h3>
                
                ${pedido.cliente ? `
                  <div class="info-fila">
                    <span class="info-label">Nombre:</span>
                    <span class="info-valor">${pedido.cliente.nombre} ${pedido.cliente.apellido}</span>
                  </div>
                  
                  ${pedido.cliente.cedula ? `
                    <div class="info-fila">
                      <span class="info-label">Cédula:</span>
                      <span class="info-valor">${formatearCedula(pedido.cliente.cedula)}</span>
                    </div>
                  ` : ''}
                  
                  <div class="info-fila">
                    <span class="info-label">Email:</span>
                    <span class="info-valor">${pedido.cliente.email}</span>
                  </div>
                  
                  ${pedido.cliente.telefono ? `
                    <div class="info-fila">
                      <span class="info-label">Teléfono:</span>
                      <span class="info-valor">${pedido.cliente.telefono}</span>
                    </div>
                  ` : ''}
                ` : `
                  <div class="info-fila">
                    <span class="info-label">Cliente:</span>
                    <span class="info-valor">No disponible</span>
                  </div>
                `}
              </div>
              
              <!-- Columna derecha: Información del pedido -->
              <div class="info-columna keep-together">
                <h3 class="info-titulo">Datos del Pedido</h3>
                
                <div class="info-fila">
                  <span class="info-label">Fecha:</span>
                  <span class="info-valor">${formatearFecha(pedido.fechaPedido)}</span>
                </div>
                
                <div class="info-fila">
                  <span class="info-label">Método de Pago:</span>
                  <span class="info-valor">${
                    pedido.metodoPago === "EFECTIVO" ? "Efectivo" :
                    pedido.metodoPago === "TRANSFERENCIA" ? "Transferencia" :
                    pedido.metodoPago === "TARJETA" ? "Tarjeta" : pedido.metodoPago
                  }</span>
                </div>
                
                ${pedido.direccionEntrega ? `
                  <div class="info-fila">
                    <span class="info-label">Dirección:</span>
                    <span class="info-valor">${pedido.direccionEntrega}</span>
                  </div>
                ` : ''}
                
                <div class="info-fila">
                  <span class="info-label">Estado:</span>
                  <span class="info-valor">${getEstadoInfo(pedido.estadoPedido).texto}</span>
                </div>
              </div>
            </div>
            
            <div class="separador"></div>
            
            <!-- Tabla de productos -->
            <div class="tabla-container keep-together">
              <h3 class="tabla-titulo">Detalle de Productos</h3>
              <table class="productos-table">
                <thead>
                  <tr>
                    <th style="width: 50%; text-align: left;">Producto</th>
                    <th style="width: 15%; text-align: center;">Cant.</th>
                    <th style="width: 17%; text-align: right;">P. Unitario</th>
                    <th style="width: 18%; text-align: right;">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  ${detalles.map(d => `
                    <tr class="keep-together">
                      <td class="producto-nombre">${d.producto?.nombreProducto || "Producto"}</td>
                      <td style="text-align: center;">${d.cantidad}</td>
                      <td style="text-align: right;">$${(d.subtotal / d.cantidad).toFixed(2)}</td>
                      <td style="text-align: right; font-weight: 600;">$${d.subtotal.toFixed(2)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
            
            <div class="separador"></div>
            
            <!-- Totales -->
            <div class="totales-container keep-together">
              <div class="total-row">
                <span class="total-label">Subtotal:</span>
                <span class="total-value">$${pedido.subtotal.toFixed(2)}</span>
              </div>
              
              <div class="total-row">
                <span class="total-label">IVA (12%):</span>
                <span class="total-value">$${pedido.iva.toFixed(2)}</span>
              </div>
              
              <div class="total-row final">
                <span class="total-label" style="font-size: 14px;">TOTAL A PAGAR:</span>
                <span class="total-final-value">$${pedido.total.toFixed(2)}</span>
              </div>
            </div>
            
            <!-- Footer -->
            <div class="footer keep-together">
              <div class="footer-brand">${NOMBRE_PRINCIPAL}</div>
              <div style="margin-bottom: 6px;">Gracias por confiar en nuestra plataforma de productos frescos y locales</div>
              <div class="footer-trademark">${MARCA_REGISTRADA} - Documento válido para efectos tributarios</div>
              <div style="margin-top: 12px; font-size: 8px; color: #9CA3AF; border-top: 1px solid #E5E7EB; padding-top: 8px;">
                <div>Fecha de generación: ${new Date().toLocaleDateString('es-ES', { 
                  day: '2-digit', 
                  month: '2-digit', 
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</div>
                <div style="margin-top: 3px;">Este documento es una representación digital de la factura original</div>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;
      
      // Generar y compartir PDF
      const { uri } = await Print.printToFileAsync({ 
        html,
        width: 595,  // Ancho A4 en puntos
        height: 842, // Alto A4 en puntos
      });
      
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
        message: `Factura de ${NOMBRE_PRINCIPAL}\nPedido #${pedido.idPedido}\nTotal: $${pedido.total.toFixed(2)}`,
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
          
          {/* HEADER CON LOGO ARRIBA Y TÍTULO CENTRADO */}
          <View style={styles.facturaHeader}>
            {/* Logo en la parte superior */}
            <View style={styles.logoContainer}>
              <Image 
                source={LOGO_PATH} 
                style={styles.logoImagen}
                resizeMode="contain"
              />
              <Text style={styles.marcaRegistrada}>{MARCA_REGISTRADA}</Text>
            </View>
            
            {/* Título "FACTURA" centrado */}
            <View style={styles.tituloContainer}>
              <Text style={styles.facturaTitulo}>FACTURA</Text>
              <View style={styles.tituloSubrayado} />
            </View>
          </View>

          {/* 2. NÚMERO DE FACTURA Y PEDIDO */}
          <View style={styles.numeroFacturaContainer}>
            <Text style={styles.numeroFacturaLabel}>N° FACTURA</Text>
            <Text style={styles.numeroFactura}>{numeroFactura}</Text>
            <Text style={styles.idPedido}>Pedido #{pedido.idPedido}</Text>
          </View>

          <View style={styles.separador} />

          {/* 3. INFORMACIÓN DEL CLIENTE (en la app también) */}
          <Text style={styles.seccionTitulo}>👤 INFORMACIÓN DEL CLIENTE</Text>
          
          <View style={styles.infoClienteContainer}>
            {pedido.cliente ? (
              <>
                <View style={styles.infoFila}>
                  <Text style={styles.infoLabel}>Nombre completo:</Text>
                  <Text style={styles.infoValor}>
                    {pedido.cliente.nombre} {pedido.cliente.apellido}
                  </Text>
                </View>
                
                {pedido.cliente.cedula && (
                  <View style={styles.infoFila}>
                    <Text style={styles.infoLabel}>Cédula:</Text>
                    <Text style={styles.infoValor}>
                      {formatearCedula(pedido.cliente.cedula)}
                    </Text>
                  </View>
                )}
                
                <View style={styles.infoFila}>
                  <Text style={styles.infoLabel}>Email:</Text>
                  <Text style={styles.infoValor}>{pedido.cliente.email}</Text>
                </View>
                
                {pedido.cliente.telefono && (
                  <View style={styles.infoFila}>
                    <Text style={styles.infoLabel}>Teléfono:</Text>
                    <Text style={styles.infoValor}>{pedido.cliente.telefono}</Text>
                  </View>
                )}
              </>
            ) : (
              <Text style={styles.sinDatosCliente}>
                Información del cliente no disponible
              </Text>
            )}
          </View>

          <View style={styles.separador} />

          {/* 4. DETALLES DEL PEDIDO Y ESTADO */}
          <View style={styles.detallesGrid}>
            
            {/* Columna izquierda: Detalles */}
            <View style={styles.detallesColumna}>
              <Text style={styles.seccionTitulo}>📋 DETALLES DEL PEDIDO</Text>
              
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
              <Text style={styles.seccionTitulo}>📊 ESTADO</Text>
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

          {/* 5. PRODUCTOS DEL PEDIDO */}
          <Text style={styles.seccionTitulo}>📦 PRODUCTOS DEL PEDIDO</Text>
          
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

          {/* 6. TOTALES */}
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
              <Text style={styles.totalFinalLabel}>TOTAL A PAGAR</Text>
              <Text style={styles.totalFinalValor}>${pedido.total.toFixed(2)}</Text>
            </View>
          </View>

          <View style={styles.separador} />

          {/* 7. BOTONES EN EL FOOTER */}
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
            <Text style={styles.footerEmpresa}>{NOMBRE_PRINCIPAL}</Text>
            <Text style={styles.footerNota}>
              {MARCA_REGISTRADA} - Documento válido para efectos tributarios
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
  
  // Efectos de círculos flotantes
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
  
  // Header mejorado
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
  
  // Contenedor de factura
  facturaContainer: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20, // Reducido
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
    borderColor: "#FF6B35",
    overflow: "hidden",
  },
  
  // 1. HEADER CON LOGO ARRIBA Y TÍTULO CENTRADO
  facturaHeader: {
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 20, // Reducido
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 15, // Reducido
  },
  logoImagen: {
    width: 90, // Reducido
    height: 35, // Reducido
    marginBottom: 5,
  },
  marcaRegistrada: {
    fontSize: 11, // Reducido
    color: '#6B7280',
    fontWeight: '500',
    fontFamily: "System",
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  tituloContainer: {
    alignItems: 'center',
  },
  facturaTitulo: {
    fontSize: 28, // Reducido
    fontWeight: '900',
    color: '#1F2937',
    fontFamily: "System",
    textAlign: 'center',
  },
  tituloSubrayado: {
    width: 70, // Reducido
    height: 3, // Reducido
    backgroundColor: '#FF6B35',
    borderRadius: 2,
    marginTop: 6,
  },
  
  // 2. NÚMERO DE FACTURA
  numeroFacturaContainer: {
    alignItems: 'center',
    marginBottom: 20, // Reducido
    padding: 20, // Reducido
    backgroundColor: '#FFF2E8',
    borderRadius: 10, // Reducido
    borderWidth: 2,
    borderColor: '#FF6B35',
    borderStyle: 'dashed',
  },
  numeroFacturaLabel: {
    fontSize: 11, // Reducido
    color: '#FF6B35',
    fontWeight: '700',
    marginBottom: 6, // Reducido
    fontFamily: "System",
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  numeroFactura: {
    fontSize: 28, // Reducido
    fontWeight: '900',
    color: '#FF6B35',
    marginBottom: 5,
    fontFamily: "System",
  },
  idPedido: {
    fontSize: 13, // Reducido
    color: '#9CA3AF',
    fontFamily: "System",
  },
  
  // 3. INFORMACIÓN DEL CLIENTE (en la app)
  infoClienteContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoFila: {
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    flex: 1,
  },
  infoValor: {
    fontSize: 13,
    color: '#1F2937',
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
  },
  sinDatosCliente: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    fontStyle: 'italic',
    padding: 10,
  },
  
  // 4. DETALLES Y ESTADO
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
    fontSize: 11, // Reducido
    fontWeight: '700',
    color: '#6B7280',
    marginBottom: 10, // Reducido
    textTransform: 'uppercase',
    letterSpacing: 1.2, // Reducido
    fontFamily: "System",
  },
  detalleFila: {
    marginBottom: 10, // Reducido
  },
  detalleLabel: {
    fontSize: 10, // Reducido
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.8, // Reducido
    marginBottom: 3,
    fontFamily: "System",
  },
  detalleValor: {
    fontSize: 14, // Reducido
    color: '#1F2937',
    fontWeight: '600',
    fontFamily: "System",
  },
  estadoLabel: {
    fontSize: 10, // Reducido
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.8, // Reducido
    marginBottom: 6, // Reducido
    textAlign: 'right',
    fontFamily: "System",
  },
  estadoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14, // Reducido
    paddingVertical: 7, // Reducido
    borderRadius: 20,
    minWidth: 90, // Reducido
    justifyContent: 'center',
    borderWidth: 2,
  },
  estadoDot: {
    width: 7, // Reducido
    height: 7, // Reducido
    borderRadius: 4,
    marginRight: 6, // Reducido
  },
  estadoTexto: {
    fontSize: 13, // Reducido
    fontWeight: '700',
    fontFamily: "System",
  },
  
  // 5. TABLA DE PRODUCTOS
  tablaProductos: {
    marginBottom: 20,
  },
  tablaHeader: {
    flexDirection: 'row',
    paddingVertical: 12, // Reducido
    borderBottomWidth: 2,
    borderBottomColor: '#FF6B35',
    marginBottom: 6, // Reducido
    backgroundColor: '#FFF2E8',
    borderRadius: 8, // Reducido
    paddingHorizontal: 10, // Reducido
  },
  tablaHeaderText: {
    fontSize: 10, // Reducido
    fontWeight: '700',
    color: '#1F2937',
    textTransform: 'uppercase',
    letterSpacing: 0.8, // Reducido
    fontFamily: "System",
  },
  tablaFila: {
    flexDirection: 'row',
    paddingVertical: 10, // Reducido
    borderBottomWidth: 1,
    borderBottomColor: '#FFD3BE',
    alignItems: 'center',
    paddingHorizontal: 10, // Reducido
  },
  tablaTexto: {
    fontSize: 13, // Reducido
    color: '#1F2937',
    fontFamily: "System",
  },
  tablaSubtotal: {
    fontSize: 13, // Reducido
    color: '#FF6B35',
    fontWeight: '700',
    fontFamily: "System",
  },
  
  // 6. TOTALES
  totalesContainer: {
    marginBottom: 20,
    backgroundColor: '#FFF2E8',
    borderRadius: 10, // Reducido
    padding: 20, // Reducido
    borderWidth: 2, // Reducido
    borderColor: '#FF6B35',
  },
  totalFila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10, // Reducido
  },
  totalLabel: {
    fontSize: 15, // Reducido
    color: '#6B7280',
    fontWeight: '600',
    fontFamily: "System",
  },
  totalValor: {
    fontSize: 15, // Reducido
    fontWeight: '600',
    color: '#1F2937',
    fontFamily: "System",
  },
  separadorDelgado: {
    height: 2,
    backgroundColor: '#FF8E53',
    marginVertical: 14, // Reducido
  },
  totalFinalFila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6, // Reducido
  },
  totalFinalLabel: {
    fontSize: 18, // Reducido
    fontWeight: '900',
    color: '#1F2937',
    textTransform: 'uppercase',
    fontFamily: "System",
  },
  totalFinalValor: {
    fontSize: 28, // Reducido
    fontWeight: '900',
    color: '#FF6B35',
    fontFamily: "System",
  },
  
  // 7. BOTONES
  botonesContainer: {
    flexDirection: 'row',
    gap: 10, // Reducido
    marginBottom: 20, // Reducido
  },
  botonAccion: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14, // Reducido
    borderRadius: 10, // Reducido
    gap: 6, // Reducido
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 }, // Reducido
    shadowOpacity: 0.1,
    shadowRadius: 4, // Reducido
    elevation: 3, // Reducido
  },
  downloadButton: {
    backgroundColor: '#FF6B35',
  },
  shareButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5, // Reducido
    borderColor: '#FF6B35',
  },
  pedidoButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5, // Reducido
    borderColor: '#E5E7EB',
  },
  
  // Textos de botones específicos
  downloadButtonText: {
    color: '#FFFFFF',
    fontSize: 13, // Reducido
    fontWeight: '700',
    fontFamily: "System",
  },
  shareButtonText: {
    color: '#FF6B35',
    fontSize: 13, // Reducido
    fontWeight: '700',
    fontFamily: "System",
  },
  pedidoButtonText: {
    color: '#1F2937',
    fontSize: 13, // Reducido
    fontWeight: '700',
    fontFamily: "System",
  },
  
  // Footer informativo
  footerContainer: {
    alignItems: 'center',
    paddingTop: 18, // Reducido
    borderTopWidth: 1.5, // Reducido
    borderTopColor: '#FFD3BE',
  },
  footerText: {
    fontSize: 12, // Reducido
    color: '#6B7280',
    fontFamily: "System",
  },
  footerEmpresa: {
    fontSize: 16, // Reducido
    fontWeight: '800',
    color: '#FF6B35',
    marginTop: 5,
    marginBottom: 6, // Reducido
    fontFamily: "System",
    textTransform: 'uppercase',
    letterSpacing: 0.8, // Reducido
  },
  footerNota: {
    fontSize: 10, // Reducido
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 3,
    fontStyle: 'italic',
    fontFamily: "System",
  },
  
  // UTILIDADES
  separador: {
    height: 1.5, // Reducido
    backgroundColor: '#FFD3BE',
    marginVertical: 20, // Reducido
  },
  bottomSpacing: {
    height: 20,
  },
});

export default Factura;