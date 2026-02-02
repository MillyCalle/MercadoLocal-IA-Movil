import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { API_CONFIG } from "../../config";

const { width, height } = Dimensions.get('window');
const isSmallDevice = width < 375;
const isMediumDevice = width >= 375 && width < 768;
const isLargeDevice = width >= 768;
const isTablet = width >= 768 && height < 1000;
const isLandscape = width > height;

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
  idPedido: number;
  fechaPedido: string;
  estadoPedido: string;
  subtotal: number;
  iva: number;
  total: number;
  metodoPago?: string;
  estadoPago?: string; // 🔥 AGREGADO
}

// 🔥 COMPONENTE DE CÍRCULOS FLOTANTES PREMIUM
const FloatingCircles = () => {
  const { width, height } = Dimensions.get('window');
  
  return (
    <View style={styles.floatingContainer}>
      <View style={[styles.floatingCircle, styles.circle1]} />
      <View style={[styles.floatingCircle, styles.circle2]} />
      <View style={[styles.floatingCircle, styles.circle3]} />
      <View style={[styles.floatingCircle, styles.circle4]} />
      <View style={[styles.floatingCircle, styles.circle5]} />
      <View style={[styles.floatingCircle, styles.circle6]} />
    </View>
  );
};

// 🔥 COMPONENTE DE ANIMACIÓN PREMIUM
interface AnimatedCardProps {
  children: React.ReactNode;
  delay?: number;
}

const AnimatedCard: React.FC<AnimatedCardProps> = ({ children, delay = 0 }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    const slideAnimation = Animated.timing(slideAnim, {
      toValue: 0,
      duration: 500,
      delay: delay,
      useNativeDriver: true,
    });

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        delay: delay,
        useNativeDriver: true,
      }),
      slideAnimation
    ]).start();
  }, [fadeAnim, slideAnim, delay]);

  return (
    <Animated.View style={{
      opacity: fadeAnim,
      transform: [{ translateY: slideAnim }]
    }}>
      {children}
    </Animated.View>
  );
};

// 🔥 COMPONENTE DE TARJETA PREMIUM
const PremiumCard = ({ children, style }: { children: React.ReactNode, style?: any }) => {
  return (
    <View style={[styles.premiumCard, style]}>
      <View style={styles.cardGlow} />
      <View style={styles.cardInnerShadow} />
      {children}
    </View>
  );
};

export default function Pedido() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [detalles, setDetalles] = useState<DetallePedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Estados del formulario de pago
  const [metodoPago, setMetodoPago] = useState("EFECTIVO");
  const [montoEfectivo, setMontoEfectivo] = useState("");
  const [comprobante, setComprobante] = useState<any>(null);
  const [numTarjeta, setNumTarjeta] = useState("");
  const [cvv, setCvv] = useState("");
  const [fechaTarjeta, setFechaTarjeta] = useState("");
  const [titular, setTitular] = useState("");
  const [finalizando, setFinalizando] = useState(false);

  // Animaciones
  const headerFadeAnim = useRef(new Animated.Value(0)).current;
  const headerSlideAnim = useRef(new Animated.Value(50)).current;
  const badgeColorAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    console.log("🔍 ID del pedido recibido:", id);
    cargarPedido();
    startAnimations();
  }, [id]);

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(headerFadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(headerSlideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      })
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(badgeColorAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(badgeColorAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  };

  // 🔥 FUNCIÓN PARA CARGAR PEDIDO
  const cargarPedido = async () => {
    console.log("🔄 INICIANDO CARGA DE PEDIDO");
    
    const token = await AsyncStorage.getItem("authToken");
    
    if (!token) {
      Alert.alert("Sesión requerida", "Debes iniciar sesión para ver el pedido", [
        { text: "Cancelar", style: "cancel" },
        { text: "Iniciar Sesión", onPress: () => router.push("/login") },
      ]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log(`📦 Cargando pedido #${id}...`);
      console.log(`🔑 Token: ${token.substring(0, 20)}...`);
      
      const pedidoId = id;
      
      // PRIMERO: Cargar el pedido principal
      let pedidoData = null;
      const pedidoEndpoints = [
        `${API_CONFIG.BASE_URL}/pedidos/${pedidoId}`,
        `${API_CONFIG.BASE_URL}/pedido/${pedidoId}`,
        `${API_CONFIG.BASE_URL}/pedidos/detalle/${pedidoId}`
      ];

      for (const endpoint of pedidoEndpoints) {
        try {
          console.log(`🔗 Intentando pedido en: ${endpoint}`);
          const res = await fetch(endpoint, {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
          });

          console.log(`📊 Status: ${res.status}`);
          
          if (res.ok) {
            pedidoData = await res.json();
            console.log("✅ Pedido cargado:", pedidoData);
            break;
          } else if (res.status === 404) {
            console.log(`❌ 404 en ${endpoint}`);
          }
        } catch (error) {
          console.error(`❌ Error en ${endpoint}:`, error);
        }
      }

      if (!pedidoData) {
        throw new Error("No se encontró el pedido o no tienes permisos");
      }

      // SEGUNDO: Cargar los detalles del pedido
      let detallesData: DetallePedido[] = [];
      console.log(`🔄 Buscando detalles para pedido #${pedidoId}...`);
      
      const detallesEndpoints = [
        `${API_CONFIG.BASE_URL}/pedidos/${pedidoId}/detalles`,
        `${API_CONFIG.BASE_URL}/pedido/${pedidoId}/detalles`,
        `${API_CONFIG.BASE_URL}/pedidos/detalles/${pedidoId}`,
        `${API_CONFIG.BASE_URL}/pedidos/${pedidoId}/items`,
      ];

      for (const endpoint of detallesEndpoints) {
        try {
          console.log(`🔗 Intentando detalles en: ${endpoint}`);
          const res = await fetch(endpoint, {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
          });

          console.log(`📊 Status detalles: ${res.status}`);
          
          if (res.ok) {
            const data = await res.json();
            detallesData = Array.isArray(data) ? data : [];
            console.log(`✅ ${detallesData.length} detalles cargados`);
            break;
          } else if (res.status === 404) {
            console.log(`❌ 404 detalles en ${endpoint}`);
          } else if (res.status === 401) {
            throw new Error("Sesión expirada. Vuelve a iniciar sesión.");
          }
        } catch (error) {
          console.error(`❌ Error detalles en ${endpoint}:`, error);
        }
      }

      console.log("📊 Resumen final:");
      console.log("- Pedido:", pedidoData);
      console.log("- Detalles encontrados:", detallesData.length);
      
      setPedido(pedidoData);
      setDetalles(detallesData);
      
      // Si el pedido ya tiene método de pago, establecerlo
      if (pedidoData.metodoPago && pedidoData.metodoPago !== "PENDIENTE") {
        setMetodoPago(pedidoData.metodoPago);
      }
      
    } catch (err: any) {
      console.error("❌ ERROR COMPLETO:", err);
      setError(err.message || "Error al cargar el pedido");
      
      if (!err.message.includes("Sesión")) {
        Alert.alert("Error", "No se pudo cargar el pedido. Verifica tu conexión.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 🔥 FUNCIÓN ACTUALIZADA PARA VERIFICAR SI EL PEDIDO ESTÁ FINALIZADO
  const pedidoFinalizado = (pedido: Pedido) => {
    return pedido.estadoPedido === "COMPLETADO" ||
           pedido.estadoPedido === "PENDIENTE_VERIFICACION" ||
           pedido.estadoPedido === "PROCESANDO" ||
           pedido.estadoPedido === "ENVIADO" ||
           (pedido.estadoPago && pedido.estadoPago === "PAGADO");
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    cargarPedido();
  }, []);

  // 🔥 FUNCIÓN PARA SELECCIONAR COMPROBANTE
  const seleccionarComprobante = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permiso necesario', 'Se necesita acceso a la galería');
        return;
      }

      Alert.alert(
        'Seleccionar comprobante',
        '¿Cómo quieres subir el comprobante?',
        [
          {
            text: 'Cámara',
            onPress: async () => {
              const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
              });

              if (!result.canceled && result.assets[0]) {
                setComprobante(result.assets[0]);
                Alert.alert("✅ Comprobante seleccionado", "Imagen tomada con éxito");
              }
            }
          },
          {
            text: 'Galería',
            onPress: async () => {
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
              });

              if (!result.canceled && result.assets[0]) {
                setComprobante(result.assets[0]);
                Alert.alert("✅ Comprobante seleccionado", "Imagen seleccionada con éxito");
              }
            }
          },
          {
            text: 'Documento (PDF)',
            onPress: async () => {
              const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'image/*'],
                copyToCacheDirectory: true,
              });

              if (!result.canceled && result.assets[0]) {
                setComprobante(result.assets[0]);
                Alert.alert("✅ Comprobante seleccionado", "Documento seleccionado con éxito");
              }
            }
          },
          {
            text: 'Cancelar',
            style: 'cancel'
          }
        ]
      );
    } catch (error) {
      console.error('Error seleccionando comprobante:', error);
      Alert.alert('Error', 'No se pudo seleccionar el archivo');
    }
  };

  // 🔥 FUNCIÓN PARA VALIDAR FORMULARIO
  const validarFormulario = (): boolean => {
    if (!pedido) return false;

    if (metodoPago === "EFECTIVO") {
      if (montoEfectivo) {
        const montoLimpio = montoEfectivo.replace(',', '.');
        const montoNum = parseFloat(montoLimpio);
        
        if (isNaN(montoNum)) {
          Alert.alert("Error", "Monto inválido");
          return false;
        }
        
        if (montoNum < pedido.total) {
          Alert.alert("Error", `El monto debe ser mayor o igual al total ($${pedido.total.toFixed(2).replace('.', ',')})`);
          return false;
        }
      }
      return true;
    }

    if (metodoPago === "TRANSFERENCIA") {
      if (!comprobante) {
        Alert.alert("Error", "Debes subir el comprobante de transferencia");
        return false;
      }
      return true;
    }

    if (metodoPago === "TARJETA") {
      const tarjetaLimpia = numTarjeta.replace(/\s/g, "");
      
      if (!tarjetaLimpia || tarjetaLimpia.length < 15 || tarjetaLimpia.length > 16) {
        Alert.alert("Error", "Número de tarjeta inválido (15-16 dígitos)");
        return false;
      }
      
      if (!cvv || cvv.length < 3 || cvv.length > 4) {
        Alert.alert("Error", "CVV inválido (3-4 dígitos)");
        return false;
      }
      
      if (!fechaTarjeta || !/^(0[1-9]|1[0-2])\/([0-9]{2})$/.test(fechaTarjeta)) {
        Alert.alert("Error", "Fecha de expiración inválida (MM/AA)");
        return false;
      }
      
      if (!titular.trim() || titular.length < 3) {
        Alert.alert("Error", "Nombre del titular requerido");
        return false;
      }
    }

    return true;
  };

  // 🔥 FUNCIÓN PARA FINALIZAR COMPRA
  const finalizarCompra = async () => {
    if (!pedido || !validarFormulario()) return;

    const token = await AsyncStorage.getItem("authToken");
    if (!token) {
      Alert.alert("Sesión requerida", "Debes iniciar sesión para realizar el pago", [
        { text: "Cancelar", style: "cancel" },
        { text: "Iniciar Sesión", onPress: () => router.push("/login") },
      ]);
      return;
    }

    // Confirmación según método de pago
    let confirmar;
    if (metodoPago === "EFECTIVO") {
      confirmar = await new Promise((resolve) => {
        Alert.alert(
          "⚠️ Pago en Efectivo",
          `• Total: $${pedido.total.toFixed(2)}\n` +
          `• Pagarás al recibir el pedido\n` +
          `• El vendedor preparará tu pedido\n\n` +
          `¿Confirmas tu pedido?`,
          [
            { text: "No", onPress: () => resolve(false), style: "cancel" },
            { text: "Sí, confirmar", onPress: () => resolve(true), style: "default" },
          ]
        );
      });
    } else {
      confirmar = await new Promise((resolve) => {
        Alert.alert(
          "Confirmar pago",
          `¿Confirmar pago de $${pedido.total.toFixed(2)} con ${metodoPago}?\n\n` +
          `Pedido #${pedido.idPedido}`,
          [
            { text: "Cancelar", onPress: () => resolve(false), style: "cancel" },
            { text: "Confirmar", onPress: () => resolve(true), style: "default" },
          ]
        );
      });
    }

    if (!confirmar) return;

    setFinalizando(true);

    try {
      console.log("\n💰 PROCESANDO PAGO");
      console.log("📦 Pedido ID:", pedido.idPedido);
      console.log("💳 Método:", metodoPago);
      console.log("💰 Total:", pedido.total);

      // Preparar datos
      let body;
      let headers: any = {
        Authorization: `Bearer ${token}`,
      };

      if (metodoPago === "EFECTIVO") {
        headers["Content-Type"] = "application/json";
        
        let montoFinal = pedido.total;
        if (montoEfectivo) {
          const montoLimpio = montoEfectivo.replace(',', '.');
          const montoNum = parseFloat(montoLimpio);
          
          if (!isNaN(montoNum) && montoNum >= pedido.total) {
            montoFinal = montoNum;
          }
        }
        
        body = JSON.stringify({
          metodoPago: "EFECTIVO",
          montoEfectivo: montoFinal
        });
        
      } else if (metodoPago === "TRANSFERENCIA") {
        const formData = new FormData();
        formData.append("metodoPago", "TRANSFERENCIA");
        
        if (comprobante) {
          const fileUri = comprobante.uri;
          const fileName = comprobante.name || "comprobante.jpg";
          const fileType = comprobante.mimeType || comprobante.type || "image/jpeg";

          formData.append("comprobante", {
            uri: Platform.OS === "ios" ? fileUri.replace("file://", "") : fileUri,
            name: fileName,
            type: fileType,
          } as any);
        }
        body = formData;
        
      } else if (metodoPago === "TARJETA") {
        const formData = new FormData();
        formData.append("metodoPago", "TARJETA");
        formData.append("numTarjeta", numTarjeta.replace(/\s/g, ""));
        formData.append("cvv", cvv);
        formData.append("fechaTarjeta", fechaTarjeta);
        formData.append("titular", titular);
        body = formData;
      }

      // Intentar diferentes endpoints
      const endpoints = [
        `${API_CONFIG.BASE_URL}/pedidos/finalizar/${pedido.idPedido}`,
        `${API_CONFIG.BASE_URL}/pedidos/${pedido.idPedido}/pagar`,
        `${API_CONFIG.BASE_URL}/pedidos/${pedido.idPedido}/procesar-pago`
      ];

      let response = null;
      let data = null;

      for (const endpoint of endpoints) {
        try {
          console.log(`🔗 Intentando: ${endpoint}`);
          
          const res = await fetch(endpoint, {
            method: "PUT",
            headers: headers,
            body: body,
          });

          console.log("📤 Status:", res.status);
          
          if (res.ok) {
            data = await res.json();
            response = res;
            console.log("✅ Pago procesado en:", endpoint);
            break;
          } else if (res.status === 400 || res.status === 404) {
            console.log("🔄 Intentando con POST...");
            const resPost = await fetch(endpoint, {
              method: "POST",
              headers: headers,
              body: body,
            });

            if (resPost.ok) {
              data = await resPost.json();
              response = resPost;
              console.log("✅ Pago procesado con POST en:", endpoint);
              break;
            }
          }
        } catch (error) {
          console.error(`❌ Error en ${endpoint}:`, error);
        }
      }

      if (!response || !data) {
        throw new Error("No se pudo procesar el pago");
      }

      console.log("✅ Pago exitoso:", data);

      // Mostrar éxito
      if (metodoPago === "EFECTIVO") {
        Alert.alert(
          "🎉 ¡Pedido confirmado!",
          `Pedido #${pedido.idPedido} confirmado.\n` +
          `Pagarás $${pedido.total.toFixed(2)} en efectivo al recibir.`,
          [
            {
              text: "Ver mi pedido",
              onPress: () => {
                cargarPedido();
              },
            },
            {
              text: "Volver al inicio",
              onPress: () => {
                router.push("/(tabs)/explorar");
              },
            },
          ]
        );
      } else {
        Alert.alert(
          "🎉 ¡Pago exitoso!",
          `Pago de $${pedido.total.toFixed(2)} procesado correctamente.`,
          [
            {
              text: "Ver detalles",
              onPress: () => {
                cargarPedido();
              },
            },
            {
              text: "Continuar",
              style: "default",
            },
          ]
        );
      }

      await cargarPedido();

    } catch (err: any) {
      console.error("\n❌ ERROR EN PAGO:", err);
      
      Alert.alert(
        "❌ Error al procesar el pago",
        `${err.message || "Error desconocido"}\n\n` +
        `Verifica:\n` +
        `1. Tu conexión a internet\n` +
        `2. Los datos ingresados\n` +
        `3. Intenta nuevamente`
      );
    } finally {
      setFinalizando(false);
    }
  };

  // 🔥 FUNCIÓN PARA CANCELAR PEDIDO
  const cancelarPedido = async () => {
    if (!pedido) return;

    const token = await AsyncStorage.getItem("authToken");
    if (!token) {
      router.push("/login");
      return;
    }

    const confirmar = await new Promise((resolve) => {
      Alert.alert(
        "Cancelar pedido",
        "¿Estás seguro de cancelar este pedido?\n\n" +
        "Esta acción no se puede deshacer.",
        [
          { text: "No, mantener", onPress: () => resolve(false), style: "cancel" },
          { 
            text: "Sí, cancelar", 
            onPress: () => resolve(true), 
            style: "destructive" 
          },
        ]
      );
    });

    if (!confirmar) return;

    try {
      const res = await fetch(`${API_CONFIG.BASE_URL}/pedidos/${pedido.idPedido}/cancelar`, {
        method: "PUT",
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (res.ok) {
        Alert.alert(
          "✅ Pedido cancelado",
          "El pedido ha sido cancelado exitosamente.",
          [
            {
              text: "Volver",
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        throw new Error("No se pudo cancelar el pedido");
      }
    } catch (err: any) {
      console.error("Error cancelando pedido:", err);
      Alert.alert("❌ Error", "No se pudo cancelar el pedido");
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <FloatingCircles />
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Cargando detalles del pedido...</Text>
        <View style={styles.loadingCircles}>
          <View style={[styles.loadingCircle, { backgroundColor: '#FF6B35' }]} />
          <View style={[styles.loadingCircle, { backgroundColor: '#3498DB' }]} />
          <View style={[styles.loadingCircle, { backgroundColor: '#2ECC71' }]} />
        </View>
      </View>
    );
  }

  if (error || !pedido) {
    return (
      <View style={styles.errorContainer}>
        <FloatingCircles />
        <View style={styles.errorContent}>
          <Text style={styles.errorIcon}>❌</Text>
          <Text style={styles.errorTitle}>Error al cargar pedido</Text>
          <Text style={styles.errorText}>
            {error || "No se encontró el pedido"}
          </Text>
          <View style={styles.errorButtons}>
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={() => cargarPedido()}
            >
              <Text style={styles.primaryButtonText}>🔄 Reintentar</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={() => router.back()}
            >
              <Text style={styles.secondaryButtonText}>← Volver</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  const estadoColors: Record<string, { color: string, icon: string, gradient: string[] }> = {
    PENDIENTE: { 
      color: "#FF6B35", 
      icon: "⏳",
      gradient: ["#FF6B35", "#FF8E53"]
    },
    PENDIENTE_VERIFICACION: { 
      color: "#F4B419", 
      icon: "🔍",
      gradient: ["#F4B419", "#F7C948"]
    },
    PROCESANDO: { 
      color: "#3498DB", 
      icon: "⚙️",
      gradient: ["#3498DB", "#5DADE2"]
    },
    COMPLETADO: { 
      color: "#2ECC71", 
      icon: "✅",
      gradient: ["#2ECC71", "#58D68D"]
    },
    CANCELADO: { 
      color: "#E74C3C", 
      icon: "❌",
      gradient: ["#E74C3C", "#EC7063"]
    },
    ENVIADO: { 
      color: "#9B59B6", 
      icon: "🚚",
      gradient: ["#9B59B6", "#AF7AC5"]
    },
  };

  // 🔥 DETERMINAR SI MOSTRAR FORMULARIO DE PAGO
  const mostrarFormularioPago = !pedidoFinalizado(pedido) && 
                                (pedido.estadoPedido === "PENDIENTE" || 
                                 pedido.estadoPedido === "CREADO");

  console.log("📋 Estado del pedido:", pedido.estadoPedido);
  console.log("💳 Estado de pago:", pedido.estadoPago);
  console.log("🎯 Mostrar formulario:", mostrarFormularioPago);

  const estadoInfo = estadoColors[pedido.estadoPedido] || { 
    color: "#6B7F69", 
    icon: "❓",
    gradient: ["#6B7F69", "#839982"]
  };

  const badgeBackgroundColor = badgeColorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: estadoInfo.gradient
  });

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#FF6B35"]}
          tintColor="#FF6B35"
          progressBackgroundColor="white"
        />
      }
    >
      <Animated.View 
        style={[
          styles.header,
          {
            opacity: headerFadeAnim,
            transform: [{ translateY: headerSlideAnim }]
          }
        ]}
      >
        <FloatingCircles />
        
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <View style={styles.backButtonCircle}>
            <Text style={styles.backButtonIcon}>←</Text>
            <View style={styles.backButtonGlow} />
          </View>
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, { 
              backgroundColor: estadoInfo.color,
              shadowColor: estadoInfo.color 
            }]}>
              <Text style={styles.avatarText}>#{pedido.idPedido}</Text>
              <View style={[styles.avatarRing, { 
                borderColor: `${estadoInfo.color}40`
              }]} />
              <View style={styles.avatarGlow} />
              <View style={styles.avatarShine} />
            </View>
            
            <Animated.View 
              style={[
                styles.estadoBadge,
                { backgroundColor: badgeBackgroundColor }
              ]}
            >
              <Text style={styles.estadoBadgeIcon}>{estadoInfo.icon}</Text>
              <Text style={styles.estadoBadgeText}>{pedido.estadoPedido}</Text>
            </Animated.View>
          </View>

          <View style={styles.titleContainer}>
            <Text style={styles.headerLabel}>DETALLE DE PEDIDO</Text>
            <View style={styles.titleLine} />
            <Text style={styles.headerTitle}>Pedido #{pedido.idPedido}</Text>
          </View>
          
          <View style={styles.infoBadgesContainer}>
            <PremiumCard style={styles.infoBadge}>
              <View style={styles.infoBadgeIconContainer}>
                <Text style={styles.infoBadgeIcon}>📅</Text>
              </View>
              <Text style={styles.infoBadgeText}>
                {new Date(pedido.fechaPedido).toLocaleDateString("es-ES", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </Text>
            </PremiumCard>

            {pedido.metodoPago && pedido.metodoPago !== "PENDIENTE" && (
              <PremiumCard style={styles.infoBadge}>
                <View style={styles.infoBadgeIconContainer}>
                  <Text style={styles.infoBadgeIcon}>
                    {pedido.metodoPago === "EFECTIVO" && "💵"}
                    {pedido.metodoPago === "TRANSFERENCIA" && "🏦"}
                    {pedido.metodoPago === "TARJETA" && "💳"}
                  </Text>
                </View>
                <Text style={styles.infoBadgeText}>{pedido.metodoPago}</Text>
              </PremiumCard>
            )}
          </View>
        </View>
      </Animated.View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Productos en tu pedido</Text>
          <Text style={styles.sectionSubtitle}>Artículos seleccionados</Text>
          <View style={styles.sectionUnderline} />
        </View>
        
        {detalles.length === 0 ? (
          <AnimatedCard delay={100}>
            <PremiumCard style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>🛒</Text>
              <Text style={styles.emptyTitle}>No hay productos</Text>
              <Text style={styles.emptyText}>Este pedido no contiene productos</Text>
            </PremiumCard>
          </AnimatedCard>
        ) : (
          <PremiumCard style={styles.productsCard}>
            {detalles.map((detalle, index) => (
              <AnimatedCard key={detalle.idDetalle || index} delay={100 + (index * 100)}>
                <View style={styles.productItem}>
                  <View style={styles.productImageContainer}>
                    {detalle.producto?.imagenProducto ? (
                      <Image
                        source={{ uri: detalle.producto.imagenProducto }}
                        style={styles.productImage}
                      />
                    ) : (
                      <View style={styles.productImagePlaceholder}>
                        <Text style={styles.productImagePlaceholderIcon}>🛍️</Text>
                        <Text style={styles.productImagePlaceholderText}>Producto</Text>
                      </View>
                    )}
                    <View style={styles.productImageBorder} />
                    <View style={styles.productImageGlow} />
                  </View>

                  <View style={styles.productInfo}>
                    <Text style={styles.productName} numberOfLines={2}>
                      {detalle.producto?.nombreProducto || "Producto"}
                    </Text>
                    
                    <View style={styles.productMeta}>
                      <View style={styles.quantityBadge}>
                        <Text style={styles.quantityBadgeIcon}>📦</Text>
                        <Text style={styles.quantityBadgeText}>x{detalle.cantidad}</Text>
                      </View>
                      
                      <View style={styles.priceBadge}>
                        <Text style={styles.priceBadgeText}>
                          ${(detalle.subtotal / detalle.cantidad).toFixed(2)} c/u
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.productPriceContainer}>
                    <Text style={styles.productPriceCurrency}>$</Text>
                    <Text style={styles.productPrice}>{detalle.subtotal.toFixed(2)}</Text>
                  </View>
                </View>
                {index < detalles.length - 1 && <View style={styles.productDivider} />}
              </AnimatedCard>
            ))}
          </PremiumCard>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Resumen de compra</Text>
          <Text style={styles.sectionSubtitle}>Detalles financieros</Text>
          <View style={styles.sectionUnderline} />
        </View>
        
        <AnimatedCard delay={200}>
          <PremiumCard style={styles.paymentCard}>
            <View style={styles.paymentRow}>
              <View style={styles.paymentLabelContainer}>
                <View style={[styles.paymentIconContainer, { backgroundColor: '#FFF2E8' }]}>
                  <Text style={[styles.paymentIcon, { color: '#FF6B35' }]}>💰</Text>
                </View>
                <Text style={styles.paymentLabel}>Subtotal</Text>
              </View>
              <View style={styles.paymentValueContainer}>
                <Text style={styles.paymentValueCurrency}>$</Text>
                <Text style={styles.paymentValue}>{pedido.subtotal.toFixed(2)}</Text>
              </View>
            </View>

            <View style={styles.paymentRow}>
              <View style={styles.paymentLabelContainer}>
                <View style={[styles.paymentIconContainer, { backgroundColor: '#E8F4FD' }]}>
                  <Text style={[styles.paymentIcon, { color: '#3498DB' }]}>🧾</Text>
                </View>
                <Text style={styles.paymentLabel}>IVA (12%)</Text>
              </View>
              <View style={styles.paymentValueContainer}>
                <Text style={styles.paymentValueCurrency}>$</Text>
                <Text style={styles.paymentValue}>{pedido.iva.toFixed(2)}</Text>
              </View>
            </View>

            {pedido.metodoPago && pedido.metodoPago !== "PENDIENTE" && (
              <View style={styles.paymentRow}>
                <View style={styles.paymentLabelContainer}>
                  <View style={[styles.paymentIconContainer, { backgroundColor: '#F0F4FF' }]}>
                    <Text style={[styles.paymentIcon, { color: '#9B59B6' }]}>
                      {pedido.metodoPago === "EFECTIVO" && "💵"}
                      {pedido.metodoPago === "TRANSFERENCIA" && "🏦"}
                      {pedido.metodoPago === "TARJETA" && "💳"}
                    </Text>
                  </View>
                  <Text style={styles.paymentLabel}>Método de pago</Text>
                </View>
                <View style={styles.paymentValueContainer}>
                  <Text style={styles.paymentValue}>{pedido.metodoPago}</Text>
                </View>
              </View>
            )}

            <View style={styles.paymentDivider}>
              <View style={styles.paymentDividerLine} />
              <View style={styles.paymentDividerDots}>
                <View style={styles.paymentDividerDot} />
                <View style={styles.paymentDividerDot} />
                <View style={styles.paymentDividerDot} />
              </View>
            </View>

            <View style={styles.paymentTotalRow}>
              <View style={styles.paymentLabelContainer}>
                <View style={[styles.paymentIconContainer, styles.paymentTotalIconContainer]}>
                  <Text style={[styles.paymentIcon, styles.paymentTotalIcon]}>💵</Text>
                </View>
                <Text style={styles.paymentTotalLabel}>Total</Text>
              </View>
              <View style={styles.paymentTotalValueContainer}>
                <Text style={styles.paymentTotalCurrency}>$</Text>
                <Text style={styles.paymentTotal}>{pedido.total.toFixed(2)}</Text>
              </View>
            </View>
          </PremiumCard>
        </AnimatedCard>
      </View>

      {/* 🔥 SECCIÓN DE PAGO - SOLO SI EL PEDIDO ESTÁ PENDIENTE */}
      {mostrarFormularioPago && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Completar Pago</Text>
            <Text style={styles.sectionSubtitle}>Selecciona cómo deseas pagar</Text>
            <View style={styles.sectionUnderline} />
          </View>
          
          <AnimatedCard delay={300}>
            <PremiumCard style={styles.paymentMethodCard}>
              <View style={styles.paymentMethods}>
                {["EFECTIVO", "TRANSFERENCIA", "TARJETA"].map((metodo, index) => (
                  <TouchableOpacity
                    key={metodo}
                    style={[
                      styles.paymentMethodButton,
                      metodoPago === metodo && styles.paymentMethodButtonActive,
                    ]}
                    onPress={() => {
                      setMetodoPago(metodo);
                      if (metodo !== "TRANSFERENCIA") {
                        setComprobante(null);
                      }
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={[
                      styles.paymentMethodIconContainer,
                      metodoPago === metodo && styles.paymentMethodIconContainerActive
                    ]}>
                      <Text style={[
                        styles.paymentMethodIcon,
                        metodoPago === metodo && styles.paymentMethodIconActive
                      ]}>
                        {metodo === "EFECTIVO" && "💵"}
                        {metodo === "TRANSFERENCIA" && "🏦"}
                        {metodo === "TARJETA" && "💳"}
                      </Text>
                    </View>
                    <Text style={[
                      styles.paymentMethodText,
                      metodoPago === metodo && styles.paymentMethodTextActive
                    ]}>
                      {metodo}
                    </Text>
                    {metodoPago === metodo && (
                      <View style={styles.selectedIndicator}>
                        <Text style={styles.selectedIndicatorIcon}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {metodoPago === "EFECTIVO" && (
                <AnimatedCard delay={400}>
                  <PremiumCard style={styles.formContainer}>
                    <View style={styles.alertBox}>
                      <View style={styles.alertIconContainer}>
                        <Text style={styles.alertIcon}>💵</Text>
                      </View>
                      <View style={styles.alertContent}>
                        <Text style={styles.alertTitle}>Pago contra entrega</Text>
                        <Text style={styles.alertText}>
                          Pagarás ${pedido.total.toFixed(2)} en efectivo cuando recibas tu pedido.
                        </Text>
                      </View>
                    </View>
                    
                    <Text style={styles.inputLabel}>Monto que entregarás (opcional):</Text>
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputCurrency}>$</Text>
                      <TextInput
                        style={styles.input}
                        placeholder={`Ej: ${(pedido.total + 1).toFixed(2)}`}
                        placeholderTextColor="#94a3b8"
                        keyboardType="decimal-pad"
                        value={montoEfectivo}
                        onChangeText={(text) => {
                          const cleaned = text.replace(/[^0-9,.]/g, '');
                          const formatted = cleaned.replace('.', ',');
                          setMontoEfectivo(formatted);
                        }}
                      />
                      <TouchableOpacity 
                        style={styles.sugerenciaButton}
                        onPress={() => {
                          const sugerido = Math.ceil(pedido.total) + 1;
                          setMontoEfectivo(sugerido.toFixed(2).replace('.', ','));
                        }}
                      >
                        <Text style={styles.sugerenciaButtonText}>Sugerir</Text>
                      </TouchableOpacity>
                    </View>
                    
                    {montoEfectivo && (
                      <View style={styles.cambioContainer}>
                        <Text style={styles.cambioLabel}>Información:</Text>
                        {(() => {
                          const montoLimpio = montoEfectivo.replace(',', '.');
                          const montoNum = parseFloat(montoLimpio);
                          
                          if (isNaN(montoNum)) {
                            return (
                              <Text style={styles.errorTextF}>❌ Monto inválido</Text>
                            );
                          } else if (montoNum < pedido.total) {
                            return (
                              <Text style={styles.errorTextF}>
                                ❌ Faltan ${(pedido.total - montoNum).toFixed(2)}
                              </Text>
                            );
                          } else {
                            return (
                              <Text style={styles.cambioText}>
                                ✓ Cambio: ${(montoNum - pedido.total).toFixed(2)}
                              </Text>
                            );
                          }
                        })()}
                      </View>
                    )}
                    
                    <Text style={styles.ayudaText}>
                      ⓘ Si no ingresas un monto, se asumirá que pagarás el total exacto (${pedido.total.toFixed(2)})
                    </Text>
                  </PremiumCard>
                </AnimatedCard>
              )}

              {metodoPago === "TRANSFERENCIA" && (
                <AnimatedCard delay={400}>
                  <PremiumCard style={styles.formContainer}>
                    <View style={styles.alertBox}>
                      <View style={styles.alertIconContainer}>
                        <Text style={styles.alertIcon}>🏦</Text>
                      </View>
                      <View style={styles.alertContent}>
                        <Text style={styles.alertTitle}>Transferencia Bancaria</Text>
                        <Text style={styles.alertText}>
                          Transfiere ${pedido.total.toFixed(2)} a nuestra cuenta y sube el comprobante.
                        </Text>
                      </View>
                    </View>
                    
                    <Text style={styles.inputLabel}>Subir comprobante de transferencia:</Text>
                    
                    {comprobante ? (
                      <View style={styles.comprobanteSeleccionado}>
                        {comprobante.type?.includes('image') || comprobante.mimeType?.includes('image') ? (
                          <Image 
                            source={{ uri: comprobante.uri }} 
                            style={styles.comprobantePreview}
                          />
                        ) : (
                          <View style={styles.pdfIconContainer}>
                            <Text style={styles.pdfIcon}>📄</Text>
                          </View>
                        )}
                        <View style={styles.comprobanteInfo}>
                          <Text style={styles.comprobanteNombre} numberOfLines={1}>
                            {comprobante.name || 'Comprobante'}
                          </Text>
                          <Text style={styles.comprobanteTipo}>
                            {comprobante.mimeType || comprobante.type || 'Archivo'}
                          </Text>
                          {comprobante.fileSize && (
                            <Text style={styles.comprobanteSize}>
                              {(comprobante.fileSize / 1024).toFixed(1)} KB
                            </Text>
                          )}
                        </View>
                        <TouchableOpacity 
                          style={styles.removerButton}
                          onPress={() => setComprobante(null)}
                        >
                          <Text style={styles.removerButtonText}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.fileButton}
                        onPress={seleccionarComprobante}
                      >
                        <Text style={styles.fileButtonIcon}>📎</Text>
                        <Text style={styles.fileButtonText}>Seleccionar comprobante</Text>
                        <Text style={styles.fileButtonSubtext}>
                          (Imagen JPG/PNG o PDF)
                        </Text>
                      </TouchableOpacity>
                    )}
                    
                    <Text style={styles.ayudaText}>
                      ⓘ Toma una foto del comprobante o selecciona el archivo PDF. Máximo 5MB.
                    </Text>
                  </PremiumCard>
                </AnimatedCard>
              )}

              {metodoPago === "TARJETA" && (
                <AnimatedCard delay={400}>
                  <PremiumCard style={styles.formContainer}>
                    <View style={styles.alertBox}>
                      <View style={styles.alertIconContainer}>
                        <Text style={styles.alertIcon}>💳</Text>
                      </View>
                      <View style={styles.alertContent}>
                        <Text style={styles.alertTitle}>Pago con Tarjeta</Text>
                        <Text style={styles.alertText}>
                          Ingresa los datos de tu tarjeta para completar el pago seguro.
                        </Text>
                      </View>
                    </View>
                    
                    <Text style={styles.inputLabel}>Número de tarjeta:</Text>
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputIcon}>💳</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="1234 5678 9012 3456"
                        placeholderTextColor="#94a3b8"
                        keyboardType="number-pad"
                        maxLength={19}
                        value={numTarjeta}
                        onChangeText={(text) => {
                          const formatted = text
                            .replace(/\s/g, "")
                            .replace(/(\d{4})/g, "$1 ")
                            .trim();
                          setNumTarjeta(formatted);
                        }}
                      />
                    </View>

                    <View style={styles.rowInputs}>
                      <View style={styles.columnInput}>
                        <Text style={styles.inputLabel}>CVV:</Text>
                        <View style={styles.inputContainer}>
                          <Text style={styles.inputIcon}>🔒</Text>
                          <TextInput
                            style={styles.input}
                            placeholder="123"
                            placeholderTextColor="#94a3b8"
                            keyboardType="number-pad"
                            maxLength={4}
                            secureTextEntry
                            value={cvv}
                            onChangeText={setCvv}
                          />
                        </View>
                      </View>
                      <View style={styles.columnInput}>
                        <Text style={styles.inputLabel}>Expiración (MM/AA):</Text>
                        <View style={styles.inputContainer}>
                          <Text style={styles.inputIcon}>📅</Text>
                          <TextInput
                            style={styles.input}
                            placeholder="12/25"
                            placeholderTextColor="#94a3b8"
                            value={fechaTarjeta}
                            onChangeText={(text) => {
                              let formatted = text.replace(/\D/g, '');
                              if (formatted.length > 2) {
                                formatted = formatted.substring(0, 2) + '/' + formatted.substring(2, 4);
                              }
                              setFechaTarjeta(formatted);
                            }}
                            maxLength={5}
                          />
                        </View>
                      </View>
                    </View>

                    <Text style={styles.inputLabel}>Titular:</Text>
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputIcon}>👤</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Nombre completo como aparece en la tarjeta"
                        placeholderTextColor="#94a3b8"
                        value={titular}
                        onChangeText={setTitular}
                      />
                    </View>
                    
                    <Text style={styles.ayudaText}>
                      ⓘ Los datos de tarjeta se procesan de forma segura.
                    </Text>
                  </PremiumCard>
                </AnimatedCard>
              )}

              <AnimatedCard delay={500}>
                <TouchableOpacity
                  style={[styles.finalizarButton, finalizando && styles.finalizarButtonDisabled]}
                  onPress={finalizarCompra}
                  disabled={finalizando}
                  activeOpacity={0.8}
                >
                  <View style={styles.finalizarButtonContent}>
                    <View style={styles.finalizarButtonIconContainer}>
                      <Text style={styles.finalizarButtonIcon}>
                        {finalizando ? "⏳" : "💳"}
                      </Text>
                    </View>
                    <Text style={styles.finalizarButtonText}>
                      {finalizando ? "Procesando..." : `Pagar $${pedido.total.toFixed(2)}`}
                    </Text>
                  </View>
                  {!finalizando && <View style={styles.buttonGlow} />}
                  <View style={styles.buttonShine} />
                </TouchableOpacity>
              </AnimatedCard>
            </PremiumCard>
          </AnimatedCard>
        </View>
      )}

      {/* 🔥 BOTÓN CANCELAR - SOLO SI ESTÁ PENDIENTE */}
      {mostrarFormularioPago && (
        <AnimatedCard delay={600}>
          <TouchableOpacity
            style={styles.cancelarButton}
            onPress={cancelarPedido}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelarButtonIcon}>✕</Text>
            <Text style={styles.cancelarButtonText}>Cancelar Pedido</Text>
          </TouchableOpacity>
        </AnimatedCard>
      )}

      <View style={styles.footer}>
        <FloatingCircles />
        
        <View style={styles.footerContent}>
          <View style={styles.footerIconContainer}>
            <Text style={styles.footerIcon}>🔒</Text>
            <View style={styles.footerIconGlow} />
            <View style={styles.footerIconShine} />
          </View>
          <View>
            <Text style={styles.footerTitle}>Proceso de Pago Seguro</Text>
            <Text style={styles.footerBrand}>MercadoLocal</Text>
          </View>
        </View>
        <Text style={styles.footerSubtitle}>
          {mostrarFormularioPago
            ? "Tus pagos están protegidos con encriptación de nivel bancario"
            : `Tu pedido #${pedido.idPedido} está ${pedido.estadoPedido.toLowerCase()}`
          }
        </Text>
        
        <View style={styles.footerDecoration}>
          <View style={styles.footerLine} />
          <View style={styles.footerDots}>
            <View style={styles.footerDot} />
            <View style={styles.footerDot} />
            <View style={styles.footerDot} />
          </View>
          <View style={styles.footerLine} />
        </View>
        
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Pedido #{pedido.idPedido} • MercadoLocal</Text>
          <Text style={styles.versionSubtext}>© 2024 Todos los derechos reservados</Text>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// 🔥 ESTILOS COMPLETOS
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    position: 'relative',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#FF6B35",
    fontWeight: "600",
    fontFamily: "System",
    letterSpacing: 0.5,
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
    opacity: 0.8,
    transform: [{ scale: 1 }],
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 20,
    position: 'relative',
  },
  errorContent: {
    alignItems: 'center',
    zIndex: 1,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 8,
    fontFamily: "System",
    letterSpacing: -0.3,
  },
  errorText: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 32,
    fontFamily: "System",
    lineHeight: 22,
  },
  errorButtons: {
    flexDirection: "row",
    gap: 16,
  },
  floatingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
    overflow: 'hidden',
  },
  floatingCircle: {
    position: 'absolute',
    borderRadius: 1000,
    opacity: 0.08,
  },
  circle1: {
    width: 200,
    height: 200,
    backgroundColor: '#FF6B35',
    top: -50,
    left: -50,
  },
  circle2: {
    width: 150,
    height: 150,
    backgroundColor: '#3498DB',
    top: 100,
    right: -30,
  },
  circle3: {
    width: 180,
    height: 180,
    backgroundColor: '#9B59B6',
    bottom: 100,
    left: -40,
  },
  circle4: {
    width: 100,
    height: 100,
    backgroundColor: '#2ECC71',
    bottom: 50,
    right: 50,
  },
  circle5: {
    width: 120,
    height: 120,
    backgroundColor: '#FF9F43',
    top: 150,
    left: '30%',
  },
  circle6: {
    width: 80,
    height: 80,
    backgroundColor: '#54a0ff',
    bottom: 150,
    right: '30%',
  },
  header: {
    backgroundColor: "white",
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    alignItems: "center",
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 15,
    overflow: 'hidden',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  backButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#FF6B35",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    position: 'relative',
  },
  backButtonGlow: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 107, 53, 0.2)',
    top: -2,
    left: -2,
  },
  backButtonIcon: {
    fontSize: 18,
    color: "#FF6B35",
    fontWeight: "700",
    zIndex: 1,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FF6B35",
    fontFamily: "System",
    marginLeft: 8,
  },
  headerContent: {
    alignItems: 'center',
    zIndex: 1,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
    position: 'relative',
    overflow: 'hidden',
  },
  avatarRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  avatarGlow: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    transform: [{ scale: 0.9 }],
  },
  avatarShine: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    top: 10,
    left: 10,
    transform: [{ rotate: '45deg' }],
  },
  avatarText: {
    fontSize: 38,
    fontWeight: "800",
    color: "white",
    fontFamily: "System",
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
  },
  estadoBadge: {
    position: 'absolute',
    bottom: -16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 2,
    borderColor: "white",
  },
  estadoBadgeIcon: {
    fontSize: 16,
    marginRight: 8,
    color: "white",
  },
  estadoBadgeText: {
    fontSize: 14,
    fontWeight: "800",
    color: "white",
    fontFamily: "System",
    letterSpacing: 0.5,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLabel: {
    fontSize: 12,
    letterSpacing: 3,
    textTransform: "uppercase",
    color: "#FF6B35",
    fontWeight: "800",
    marginBottom: 8,
    fontFamily: "System",
    opacity: 0.9,
  },
  titleLine: {
    width: 40,
    height: 3,
    backgroundColor: '#FF6B35',
    borderRadius: 2,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: "#1e293b",
    marginBottom: 20,
    textAlign: "center",
    fontFamily: "System",
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.08)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  infoBadgesContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  infoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  infoBadgeIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  infoBadgeIcon: {
    fontSize: 16,
    color: "#64748b",
  },
  infoBadgeText: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "600",
    fontFamily: "System",
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 28,
  },
  sectionHeader: {
    marginBottom: 20,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1e293b",
    fontFamily: "System",
    letterSpacing: -0.3,
    marginBottom: 6,
    textAlign: 'center',
  },
  sectionSubtitle: {
    fontSize: 15,
    color: "#64748b",
    fontFamily: "System",
    opacity: 0.8,
    textAlign: 'center',
  },
  sectionUnderline: {
    width: 60,
    height: 4,
    backgroundColor: '#FF6B35',
    borderRadius: 2,
    marginTop: 8,
  },
  premiumCard: {
    backgroundColor: "white",
    borderRadius: 25,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 10,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    position: 'relative',
    overflow: 'hidden',
  },
  cardGlow: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 107, 53, 0.05)',
    transform: [{ scale: 2 }],
  },
  cardInnerShadow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  emptyCard: {
    alignItems: "center",
    padding: 40,
  },
  emptyIcon: {
    fontSize: 52,
    marginBottom: 20,
    opacity: 0.6,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
    fontFamily: "System",
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: "#64748b",
    fontFamily: "System",
    textAlign: "center",
    lineHeight: 22,
  },
  productsCard: {
    padding: 20,
  },
  productItem: {
    flexDirection: "row",
    paddingVertical: 16,
    alignItems: 'center',
  },
  productImageContainer: {
    marginRight: 16,
    position: 'relative',
  },
  productImage: {
    width: 75,
    height: 75,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#f1f5f9",
  },
  productImageBorder: {
    position: 'absolute',
    width: 79,
    height: 79,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "rgba(255, 107, 53, 0.15)",
    top: -2,
    left: -2,
  },
  productImageGlow: {
    position: 'absolute',
    width: 83,
    height: 83,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255, 107, 53, 0.05)",
    top: -4,
    left: -4,
  },
  productImagePlaceholder: {
    width: 75,
    height: 75,
    borderRadius: 14,
    backgroundColor: "#FFF2E8",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFE4D6",
  },
  productImagePlaceholderIcon: {
    fontSize: 26,
    color: "#FF6B35",
    marginBottom: 4,
  },
  productImagePlaceholderText: {
    fontSize: 11,
    color: "#FF6B35",
    fontWeight: "600",
    fontFamily: "System",
  },
  productInfo: {
    flex: 1,
    marginRight: 12,
  },
  productName: {
    fontSize: 17,
    color: "#1e293b",
    fontWeight: "700",
    fontFamily: "System",
    marginBottom: 8,
    lineHeight: 22,
  },
  productMeta: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  quantityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: "#F0F9FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  quantityBadgeIcon: {
    fontSize: 13,
    color: "#0369A1",
  },
  quantityBadgeText: {
    fontSize: 13,
    color: "#0369A1",
    fontWeight: "600",
    fontFamily: "System",
  },
  priceBadge: {
    backgroundColor: "#F0FFF4",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  priceBadgeText: {
    fontSize: 13,
    color: "#166534",
    fontWeight: "600",
    fontFamily: "System",
  },
  productPriceContainer: {
    alignItems: 'flex-end',
  },
  productPriceCurrency: {
    fontSize: 15,
    color: "#FF6B35",
    fontWeight: "700",
    fontFamily: "System",
    marginBottom: -2,
  },
  productPrice: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FF6B35",
    fontFamily: "System",
  },
  productDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 12,
    marginHorizontal: -10,
  },
  paymentCard: {
    padding: 24,
  },
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  paymentLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  paymentIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  paymentIcon: {
    fontSize: 20,
  },
  paymentLabel: {
    fontSize: 16,
    color: "#64748b",
    fontWeight: "500",
    fontFamily: "System",
  },
  paymentValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  paymentValueCurrency: {
    fontSize: 16,
    color: "#1e293b",
    fontWeight: "600",
    fontFamily: "System",
    marginRight: 4,
  },
  paymentValue: {
    fontSize: 18,
    color: "#1e293b",
    fontWeight: "700",
    fontFamily: "System",
  },
  paymentDivider: {
    alignItems: 'center',
    marginVertical: 20,
  },
  paymentDividerLine: {
    height: 2,
    backgroundColor: "#f1f5f9",
    width: '100%',
  },
  paymentDividerDots: {
    flexDirection: 'row',
    gap: 8,
    position: 'absolute',
  },
  paymentDividerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B35',
  },
  paymentTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 20,
  },
  paymentTotalIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FF6B35",
    justifyContent: "center",
    alignItems: "center",
  },
  paymentTotalIcon: {
    fontSize: 24,
    color: "white",
  },
  paymentTotalLabel: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1e293b",
    fontFamily: "System",
  },
  paymentTotalValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  paymentTotalCurrency: {
    fontSize: 22,
    color: "#FF6B35",
    fontWeight: "700",
    fontFamily: "System",
    marginRight: 6,
  },
  paymentTotal: {
    fontSize: 36,
    fontWeight: "800",
    color: "#FF6B35",
    fontFamily: "System",
  },
  primaryButton: {
    backgroundColor: "#FF6B35",
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 14,
    shadowColor: "#FF6B35",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 2,
    borderColor: "white",
    minWidth: 140,
  },
  primaryButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
    fontFamily: "System",
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: "white",
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#FF6B35",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    minWidth: 140,
  },
  secondaryButtonText: {
    color: "#FF6B35",
    fontWeight: "700",
    fontSize: 16,
    fontFamily: "System",
    textAlign: 'center',
  },
  paymentMethodCard: {
    padding: 24,
  },
  paymentMethods: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  paymentMethodButton: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: 'transparent',
    flex: 1,
    marginHorizontal: 6,
    position: 'relative',
  },
  paymentMethodButtonActive: {
    backgroundColor: 'white',
    borderColor: '#FF6B35',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  paymentMethodIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  paymentMethodIconContainerActive: {
    backgroundColor: '#FFF2E8',
  },
  paymentMethodIcon: {
    fontSize: 24,
    color: '#64748b',
  },
  paymentMethodIconActive: {
    color: '#FF6B35',
  },
  paymentMethodText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    fontFamily: 'System',
  },
  paymentMethodTextActive: {
    color: '#FF6B35',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  selectedIndicatorIcon: {
    fontSize: 12,
    color: 'white',
    fontWeight: 'bold',
  },
  formContainer: {
    marginTop: 10,
  },
  alertBox: {
    flexDirection: 'row',
    backgroundColor: '#F0F9FF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#E0F2FE',
  },
  alertIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: 'white',
  },
  alertIcon: {
    fontSize: 22,
    color: '#0369A1',
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0369A1',
    marginBottom: 6,
    fontFamily: 'System',
  },
  alertText: {
    fontSize: 15,
    color: '#64748b',
    lineHeight: 22,
    fontFamily: 'System',
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 10,
    fontFamily: 'System',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#f1f5f9',
    borderRadius: 14,
    paddingHorizontal: 18,
    marginBottom: 20,
    height: 60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputCurrency: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FF6B35',
    marginRight: 10,
    fontFamily: 'System',
  },
  inputIcon: {
    fontSize: 22,
    color: '#94a3b8',
    marginRight: 14,
  },
  input: {
    flex: 1,
    fontSize: 17,
    color: '#1e293b',
    fontFamily: 'System',
    paddingVertical: 0,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 20,
  },
  columnInput: {
    flex: 1,
  },
  cambioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFBF9',
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#F0F4ED',
  },
  cambioLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 6,
  },
  cambioText: {
    fontSize: 15,
    color: '#2ECC71',
    fontWeight: '600',
  },
  errorTextF: {
    fontSize: 15,
    color: '#E74C3C',
    fontWeight: '600',
    fontFamily: 'System',
  },
  ayudaText: {
    fontSize: 12,
    color: '#94a3b8',
    fontStyle: 'italic',
    marginTop: 8,
  },
  comprobanteSeleccionado: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F4ED',
    padding: 12,
    borderRadius: 14,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#E3EBD9',
  },
  comprobantePreview: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginRight: 12,
  },
  pdfIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: '#E3EBD9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  pdfIcon: {
    fontSize: 28,
  },
  comprobanteInfo: {
    flex: 1,
  },
  comprobanteNombre: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
  comprobanteTipo: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
  },
  comprobanteSize: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  removerButton: {
    backgroundColor: '#E74C3C',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  fileButton: {
    backgroundColor: "#f8f9fa",
    borderRadius: 14,
    padding: 24,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderStyle: "dashed",
    alignItems: "center",
    marginBottom: 20,
  },
  fileButtonIcon: {
    fontSize: 36,
    marginBottom: 12,
  },
  fileButtonText: {
    fontSize: 16,
    color: "#1e293b",
    fontWeight: "600",
  },
  fileButtonSubtext: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 6,
  },
  sugerenciaButton: {
    backgroundColor: '#FFF2E8',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    marginLeft: 12,
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  sugerenciaButtonText: {
    color: '#FF6B35',
    fontSize: 13,
    fontWeight: '600',
  },
  finalizarButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 18,
    paddingVertical: 22,
    marginTop: 24,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 2,
    borderColor: 'white',
  },
  finalizarButtonDisabled: {
    backgroundColor: '#94a3b8',
    shadowColor: '#94a3b8',
    opacity: 0.9,
  },
  finalizarButtonContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  finalizarButtonIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  finalizarButtonIcon: {
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
  },
  finalizarButtonText: {
    fontSize: 20,
    fontWeight: '800',
    color: 'white',
    fontFamily: 'System',
  },
  buttonGlow: {
    position: 'absolute',
    width: '200%',
    height: '200%',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 1000,
    top: '-50%',
    left: '-50%',
    zIndex: 0,
  },
  buttonShine: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    top: -30,
    right: -30,
    transform: [{ rotate: '45deg' }],
    zIndex: 0,
  },
  cancelarButton: {
    backgroundColor: 'white',
    borderRadius: 18,
    paddingVertical: 18,
    marginHorizontal: 20,
    marginBottom: 20,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    borderWidth: 2,
    borderColor: '#E74C3C',
    shadowColor: '#E74C3C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  cancelarButtonIcon: {
    fontSize: 18,
    color: '#E74C3C',
    fontWeight: 'bold',
  },
  cancelarButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E74C3C',
    fontFamily: 'System',
  },
  footer: {
    backgroundColor: "white",
    borderRadius: 30,
    padding: 36,
    marginHorizontal: 20,
    marginBottom: 40,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    position: 'relative',
    overflow: 'hidden',
  },
  footerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    marginBottom: 20,
    zIndex: 1,
  },
  footerIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FF6B35",
    justifyContent: "center",
    alignItems: "center",
    position: 'relative',
    shadowColor: "#FF6B35",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  footerIconGlow: {
    position: 'absolute',
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(255, 107, 53, 0.3)',
    top: -2,
    left: -2,
  },
  
    footerIconShine: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    top: 8,
    left: 8,
    transform: [{ rotate: '45deg' }],
  },
  footerIcon: {
    fontSize: 28,
    color: "white",
    fontWeight: "bold",
  },
  footerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1e293b",
    fontFamily: "System",
  },
  footerBrand: {
    fontSize: 14,
    color: "#FF6B35",
    fontWeight: "700",
    fontFamily: "System",
  },
  footerSubtitle: {
    fontSize: 15,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
    fontFamily: "System",
    zIndex: 1,
  },
  footerDecoration: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  footerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#f1f5f9',
  },
  footerDots: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: 12,
  },
  footerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF6B35',
    opacity: 0.5,
  },
  versionContainer: {
    alignItems: 'center',
    zIndex: 1,
  },
  versionText: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "600",
    fontFamily: "System",
  },
  versionSubtext: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 6,
    fontFamily: "System",
  },
});