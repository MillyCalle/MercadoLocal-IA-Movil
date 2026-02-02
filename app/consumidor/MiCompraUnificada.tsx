import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    Easing,
    Linking,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { API_CONFIG } from "../../config";

// 🔥 COMPONENTES REUTILIZABLES
const FloatingCircles = () => {
    const { width, height } = Dimensions.get('window');
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.parallel([
                Animated.sequence([
                    Animated.timing(scaleAnim, {
                        toValue: 1.1,
                        duration: 4000,
                        easing: Easing.inOut(Easing.sin),
                        useNativeDriver: true,
                    }),
                    Animated.timing(scaleAnim, {
                        toValue: 1,
                        duration: 4000,
                        easing: Easing.inOut(Easing.sin),
                        useNativeDriver: true,
                    }),
                ]),
                Animated.timing(rotateAnim, {
                    toValue: 1,
                    duration: 25000,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const rotateInterpolate = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg']
    });

    return (
        <View style={styles.floatingContainer}>
            <Animated.View style={[
                styles.floatingCircle,
                styles.circle1,
                {
                    transform: [
                        { scale: scaleAnim },
                        { rotate: rotateInterpolate }
                    ]
                }
            ]} />
            <Animated.View style={[
                styles.floatingCircle,
                styles.circle2,
                {
                    transform: [
                        {
                            scale: scaleAnim.interpolate({
                                inputRange: [1, 1.1],
                                outputRange: [1, 1.05]
                            })
                        },
                        {
                            rotate: rotateAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: ['180deg', '540deg']
                            })
                        }
                    ]
                }
            ]} />
            <Animated.View style={[
                styles.floatingCircle,
                styles.circle3,
                {
                    transform: [
                        {
                            scale: scaleAnim.interpolate({
                                inputRange: [1, 1.1],
                                outputRange: [1, 1.08]
                            })
                        },
                        {
                            rotate: rotateAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: ['90deg', '450deg']
                            })
                        }
                    ]
                }
            ]} />
        </View>
    );
};

const PremiumCard = ({ children, style, delay = 0, withAnimation = true }: {
    children: React.ReactNode,
    style?: any,
    delay?: number,
    withAnimation?: boolean
}) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        if (withAnimation) {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 500,
                    delay: delay,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 400,
                    delay: delay,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            fadeAnim.setValue(1);
            slideAnim.setValue(0);
        }
    }, [withAnimation]);

    return (
        <Animated.View
            style={[
                styles.premiumCard,
                style,
                {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }]
                }
            ]}
        >
            {children}
        </Animated.View>
    );
};

const PremiumButton = ({
    title,
    icon,
    onPress,
    disabled = false,
    loading = false,
    type = "primary",
    fullWidth = true
}: {
    title: string,
    icon: string,
    onPress: () => void,
    disabled?: boolean,
    loading?: boolean,
    type?: "primary" | "secondary" | "outline",
    fullWidth?: boolean
}) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.97,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
        }).start();
    };

    const getButtonStyle = () => {
        switch (type) {
            case "secondary":
                return styles.secondaryPremiumButton;
            case "outline":
                return styles.outlinePremiumButton;
            default:
                return styles.primaryPremiumButton;
        }
    };

    const getIconStyle = () => {
        switch (type) {
            case "secondary":
                return styles.secondaryPremiumButtonIcon;
            case "outline":
                return styles.outlinePremiumButtonIcon;
            default:
                return styles.primaryPremiumButtonIcon;
        }
    };

    const getTextStyle = () => {
        switch (type) {
            case "secondary":
                return styles.secondaryPremiumButtonText;
            case "outline":
                return styles.outlinePremiumButtonText;
            default:
                return styles.primaryPremiumButtonText;
        }
    };

    return (
        <TouchableOpacity
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.8}
            style={[
                getButtonStyle(),
                fullWidth && styles.fullWidthButton,
                disabled && styles.disabledPremiumButton,
            ]}
        >
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                <View style={styles.premiumButtonContent}>
                    {loading ? (
                        <ActivityIndicator
                            size="small"
                            color={type === "outline" ? "#FF6B35" : "white"}
                        />
                    ) : (
                        <>
                            <Text style={getIconStyle()}>{icon}</Text>
                            <Text style={getTextStyle()}>{title}</Text>
                        </>
                    )}
                </View>
            </Animated.View>
        </TouchableOpacity>
    );
};

// 🔥 HELPERS
const money = (value: any): string => {
    const num = parseFloat(value);
    return !isNaN(num) ? num.toFixed(2) : "0.00";
};

const getEstadoLabel = (estado: string): string => {
    const estados: { [key: string]: string } = {
        PENDIENTE: "Pendiente de pago",
        PROCESANDO: "En proceso",
        PENDIENTE_VERIFICACION: "Verificando pago",
        COMPLETADO: "Completado",
        CANCELADO: "Cancelado"
    };
    return estados[estado] || estado;
};

const getEstadoEmoji = (estado: string): string => {
    const emojis: { [key: string]: string } = {
        PENDIENTE: "⏳",
        PROCESANDO: "📦",
        PENDIENTE_VERIFICACION: "🔍",
        COMPLETADO: "✅",
        CANCELADO: "❌"
    };
    return emojis[estado] || "📋";
};

const formatearFecha = (fecha: string): string => {
    if (!fecha) return "—";
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// 🔥 COMPONENTE DE PEDIDO
const PedidoCard = ({ pedido, index, onPress }: { pedido: any, index: number, onPress: () => void }) => {
    const totalPedido = pedido.total || pedido.montoTotal || 0;
    const estadoPedido = pedido.estadoPedido || pedido.estado;
    const pedidoId = pedido.idPedido || pedido.id;

    return (
        <PremiumCard style={styles.pedidoCard} delay={index * 50} withAnimation={index > 0}>
            <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
                <View style={styles.pedidoContent}>
                    {/* Header del pedido */}
                    <View style={styles.pedidoHeader}>
                        <View style={styles.pedidoIconContainer}>
                            <View style={[
                                styles.pedidoIconWrapper,
                                {
                                    backgroundColor: estadoPedido === "COMPLETADO" ? "rgba(16, 185, 129, 0.1)" :
                                        estadoPedido === "PENDIENTE" ? "rgba(245, 158, 11, 0.1)" :
                                        estadoPedido === "CANCELADO" ? "rgba(239, 68, 68, 0.1)" : "rgba(139, 92, 246, 0.1)"
                                }
                            ]}>
                                <Text style={[
                                    styles.pedidoIcon,
                                    {
                                        color: estadoPedido === "COMPLETADO" ? "#10B981" :
                                            estadoPedido === "PENDIENTE" ? "#F59E0B" :
                                            estadoPedido === "CANCELADO" ? "#EF4444" : "#8B5CF6"
                                    }
                                ]}>
                                    {getEstadoEmoji(estadoPedido)}
                                </Text>
                            </View>
                            <View style={styles.pedidoTitleContainer}>
                                <Text style={styles.pedidoTitle}>Pedido #{pedidoId}</Text>
                                <View style={[
                                    styles.estadoBadge,
                                    {
                                        backgroundColor: estadoPedido === "COMPLETADO"
                                            ? "rgba(16, 185, 129, 0.1)"
                                            : estadoPedido === "PENDIENTE"
                                                ? "rgba(245, 158, 11, 0.1)"
                                                : estadoPedido === "CANCELADO"
                                                    ? "rgba(239, 68, 68, 0.1)"
                                                    : "rgba(139, 92, 246, 0.1)"
                                    }
                                ]}>
                                    <Text style={[
                                        styles.estadoBadgeText,
                                        {
                                            color: estadoPedido === "COMPLETADO"
                                                ? "#10B981"
                                                : estadoPedido === "PENDIENTE"
                                                    ? "#F59E0B"
                                                    : estadoPedido === "CANCELADO"
                                                        ? "#EF4444"
                                                        : "#8B5CF6"
                                        }
                                    ]}>
                                        {getEstadoLabel(estadoPedido)}
                                    </Text>
                                </View>
                            </View>
                        </View>
                        <View style={styles.pedidoPriceContainer}>
                            <Text style={styles.pedidoPrice}>${money(totalPedido)}</Text>
                        </View>
                    </View>

                    {/* Información del pedido */}
                    <View style={styles.pedidoInfo}>
                        {pedido.fechaPedido && (
                            <View style={styles.pedidoInfoRow}>
                                <Text style={styles.pedidoInfoIcon}>📅</Text>
                                <Text style={styles.pedidoInfoText}>
                                    {formatearFecha(pedido.fechaPedido)}
                                </Text>
                            </View>
                        )}

                        {pedido.vendedor && (
                            <View style={styles.pedidoInfoRow}>
                                <Text style={styles.pedidoInfoIcon}>👤</Text>
                                <Text style={styles.pedidoInfoText}>
                                    Vendedor: {pedido.vendedor.nombre || `#${pedido.vendedor.idVendedor}`}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Botón de acción */}
                    <View style={styles.pedidoActions}>
                        <PremiumButton
                            title="Ver detalles"
                            icon="🔍"
                            onPress={onPress}
                            type="outline"
                            fullWidth={false}
                        />
                    </View>
                </View>
            </TouchableOpacity>
        </PremiumCard>
    );
};

// 🔥 COMPONENTE PRINCIPAL
export default function MiCompraUnificadaMobile() {
    const router = useRouter();
    const params = useLocalSearchParams();
    
    // ✅ CORRECCIÓN: Manejar parámetros correctamente
    const idCompraParam = params.idCompra;
    const getIdCompra = (): string => {
        if (Array.isArray(idCompraParam)) {
            return idCompraParam[0] || '';
        }
        return idCompraParam || '';
    };

    const [compraData, setCompraData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const headerFadeAnim = useRef(new Animated.Value(0)).current;
    const headerSlideAnim = useRef(new Animated.Value(50)).current;

    useEffect(() => {
        const startAnimations = () => {
            Animated.parallel([
                Animated.timing(headerFadeAnim, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.timing(headerSlideAnim, {
                    toValue: 0,
                    duration: 500,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
            ]).start();
        };

        startAnimations();
        
        // Verificar que tenemos un ID válido
        const compraId = getIdCompra();
        if (!compraId || compraId === "undefined") {
            setError("ID de compra no válido");
            setLoading(false);
            return;
        }
        
        fetchCompraData();
    }, []);

    const fetchCompraData = async () => {
        try {
            setLoading(true);
            const compraId = getIdCompra();
            const token = await AsyncStorage.getItem("authToken");
            
            if (!token) {
                Alert.alert("Sesión requerida", "Debes iniciar sesión para ver tus compras", [
                    { text: "Iniciar Sesión", onPress: () => router.push("/login") },
                    { text: "Cancelar", style: "cancel" },
                ]);
                return;
            }

            // Intentar obtener de AsyncStorage primero
            const storedData = await AsyncStorage.getItem(`compra_${compraId}`);
            if (storedData) {
                console.log("📱 Usando datos almacenados");
                setCompraData(JSON.parse(storedData));
                setLoading(false);
            }

            // Luego intentar del backend
            try {
                const response = await fetch(`${API_CONFIG.BASE_URL}/pedidos/compra-unificada/${compraId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log("✅ Datos del backend:", data);
                    setCompraData(data);
                    // Guardar en AsyncStorage
                    await AsyncStorage.setItem(`compra_${compraId}`, JSON.stringify(data));
                } else {
                    console.log("⚠️ No se pudo obtener datos del backend");
                }
            } catch (error) {
                console.log("⚠️ Error al conectar con el backend:", error);
            }

        } catch (err: any) {
            console.error("❌ Error:", err);
            setError(err.message || "Error al cargar la compra");
        } finally {
            setLoading(false);
        }
    };

    // 🔥 FUNCIONES DE ACCIÓN
    const verDetallesPedido = (pedidoId: string, pedidoNombre: string = "Pedido") => {
        if (!pedidoId) {
            Alert.alert("ID no disponible", "No se puede ver el detalle de este pedido");
            return;
        }

        Alert.alert(
            "Redirigiendo",
            `Abriendo detalles del ${pedidoNombre}...`,
            [
                { text: "Cancelar", style: "cancel" },
                { 
                    text: "Continuar", 
                    onPress: () => router.push(`/consumidor/PedidoDetalle?pedidoId=${pedidoId}`) 
                }
            ]
        );
    };

    const volverAlHistorial = () => {
        router.push("/consumidor/MisPedidos");
    };

    const copiarIdCompra = async () => {
        const compraId = getIdCompra();
        
        if (!compraId) {
            Alert.alert("ID no disponible", "No hay ID de compra para copiar");
            return;
        }

        try {
            // Usar el módulo de Clipboard de React Native
            // Nota: En Expo, necesitarías expo-clipboard
            // Por ahora usamos AsyncStorage como alternativa
            await AsyncStorage.setItem('clipboard', compraId);
            Alert.alert("✅ ID copiado", `El ID ${compraId} se copió al portapapeles`);
        } catch (err) {
            Alert.alert("Error", "No se pudo copiar el ID de la compra");
        }
    };

    const compartirCompra = async () => {
        if (!compraData) return;
        
        const compraId = getIdCompra();

        try {
            await Share.share({
                title: `Mi Compra #${compraData.idCompraUnificada || compraId}`,
                message: `📦 Mi compra en MercadoLocal\n\n` +
                         `ID: ${compraData.idCompraUnificada || compraId}\n` +
                         `Estado: ${getEstadoLabel(compraData.estadoCompra)}\n` +
                         `Total: $${money(compraData.totalGeneral)}\n` +
                         `Pedidos: ${compraData.pedidos?.length || 0}\n\n` +
                         `¡Gracias por tu compra! 🛍️`,
                url: API_CONFIG.BASE_URL
            });
        } catch (error) {
            Alert.alert("Error", "No se pudo compartir la compra");
        }
    };

    const contactarSoporte = () => {
        const compraId = getIdCompra();
        Linking.openURL(`mailto:soporte@mercadolocal.com?subject=Consulta sobre compra ${compraId}`);
    };

    const recargarDatos = () => {
        fetchCompraData();
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <FloatingCircles />
                <View style={styles.loadingContent}>
                    <ActivityIndicator size="large" color="#FF6B35" />
                    <Text style={styles.loadingText}>Cargando detalles de la compra...</Text>
                </View>
            </View>
        );
    }

    if (error && !compraData) {
        return (
            <View style={styles.errorContainer}>
                <FloatingCircles />
                <View style={styles.errorContent}>
                    <Text style={styles.errorEmoji}>⚠️</Text>
                    <Text style={styles.errorTitle}>Error</Text>
                    <Text style={styles.errorMessage}>{error}</Text>
                    <View style={styles.errorButtons}>
                        <PremiumButton
                            title="Volver a mis compras"
                            icon="←"
                            onPress={volverAlHistorial}
                            type="primary"
                        />
                        <PremiumButton
                            title="Reintentar"
                            icon="🔄"
                            onPress={recargarDatos}
                            type="outline"
                        />
                    </View>
                </View>
            </View>
        );
    }

    if (!compraData) {
        return (
            <View style={styles.emptyContainer}>
                <FloatingCircles />
                <View style={styles.emptyContent}>
                    <Text style={styles.emptyEmoji}>📭</Text>
                    <Text style={styles.emptyTitle}>Compra no encontrada</Text>
                    <Text style={styles.emptyMessage}>
                        No se encontraron datos para la compra #{getIdCompra() || "desconocida"}
                    </Text>
                    <PremiumButton
                        title="Volver a mis compras"
                        icon="←"
                        onPress={volverAlHistorial}
                        type="primary"
                    />
                </View>
            </View>
        );
    }

    // Extraer datos de la compra
    const {
        idCompraUnificada = getIdCompra(),
        pedidos = [],
        totalGeneral = 0,
        metodoPago = 'PENDIENTE',
        estadoCompra = 'PROCESANDO',
        fechaCompra,
        cantidadPedidos = pedidos.length
    } = compraData;

    // Calcular cantidad de vendedores únicos
    const vendedoresUnicos = new Set();
    pedidos.forEach((pedido: any) => {
        const idVendedor = pedido.vendedor?.idVendedor || pedido.idVendedor;
        if (idVendedor) vendedoresUnicos.add(idVendedor);
    });

    const vendedoresCount = vendedoresUnicos.size;

    return (
        <ScrollView
            style={styles.container}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
        >
            {/* HEADER */}
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
                
                {/* Botón volver */}
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={volverAlHistorial}
                    activeOpacity={0.7}
                >
                    <View style={styles.backButtonCircle}>
                        <Text style={styles.backButtonIcon}>←</Text>
                    </View>
                    <Text style={styles.backButtonText}>Volver</Text>
                </TouchableOpacity>

                {/* Contenido del header */}
                <View style={styles.headerContent}>
                    <Text style={styles.headerLabel}>DETALLES DE COMPRA</Text>
                    <View style={styles.titleLine} />
                    <Text style={styles.headerTitle}>Compra #{idCompraUnificada}</Text>
                    <Text style={styles.headerSubtitle}>
                        Revisa el estado y detalles de todos tus pedidos
                    </Text>
                </View>
            </Animated.View>

            {/* BOTONES DE ACCIÓN */}
            <View style={styles.actionButtonsContainer}>
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    style={styles.actionButtonsScroll}
                    contentContainerStyle={styles.actionButtonsContent}
                >
                    <PremiumButton
                        title="Copiar ID"
                        icon="📋"
                        onPress={copiarIdCompra}
                        type="outline"
                        fullWidth={false}
                    />
                    <PremiumButton
                        title="Compartir"
                        icon="📤"
                        onPress={compartirCompra}
                        type="outline"
                        fullWidth={false}
                    />
                    <PremiumButton
                        title="Soporte"
                        icon="🛟"
                        onPress={contactarSoporte}
                        type="outline"
                        fullWidth={false}
                    />
                    <PremiumButton
                        title="Recargar"
                        icon="🔄"
                        onPress={recargarDatos}
                        type="outline"
                        fullWidth={false}
                    />
                </ScrollView>
            </View>

            {/* ESTADÍSTICAS DE LA COMPRA */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>📊 Resumen de compra</Text>
                    <Text style={styles.sectionSubtitle}>Información general</Text>
                </View>

                <View style={styles.statsGrid}>
                    {/* Total */}
                    <PremiumCard style={styles.statCard}>
                        <View style={styles.statContent}>
                            <View style={[styles.statIconContainer, { backgroundColor: 'rgba(255, 107, 53, 0.1)' }]}>
                                <Text style={[styles.statIcon, { color: '#FF6B35' }]}>💰</Text>
                            </View>
                            <View style={styles.statTexts}>
                                <Text style={styles.statLabel}>Total de la compra</Text>
                                <Text style={styles.statValue}>${money(totalGeneral)}</Text>
                            </View>
                        </View>
                    </PremiumCard>

                    {/* Estado */}
                    <PremiumCard style={styles.statCard}>
                        <View style={styles.statContent}>
                            <View style={[styles.statIconContainer, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
                                <Text style={[styles.statIcon, { color: '#8B5CF6' }]}>
                                    {getEstadoEmoji(estadoCompra)}
                                </Text>
                            </View>
                            <View style={styles.statTexts}>
                                <Text style={styles.statLabel}>Estado</Text>
                                <Text style={[
                                    styles.statValue,
                                    { 
                                        color: estadoCompra === "COMPLETADO" ? "#10B981" :
                                               estadoCompra === "PENDIENTE" ? "#F59E0B" :
                                               estadoCompra === "CANCELADO" ? "#EF4444" : "#8B5CF6"
                                    }
                                ]}>
                                    {getEstadoLabel(estadoCompra)}
                                </Text>
                            </View>
                        </View>
                    </PremiumCard>

                    {/* Método de pago */}
                    <PremiumCard style={styles.statCard}>
                        <View style={styles.statContent}>
                            <View style={[styles.statIconContainer, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                                <Text style={[styles.statIcon, { color: '#10B981' }]}>
                                    {metodoPago === 'EFECTIVO' ? '💵' :
                                     metodoPago === 'TRANSFERENCIA' ? '🏦' :
                                     metodoPago === 'TARJETA' ? '💳' : '💰'}
                                </Text>
                            </View>
                            <View style={styles.statTexts}>
                                <Text style={styles.statLabel}>Método de pago</Text>
                                <Text style={styles.statValue}>
                                    {metodoPago === 'EFECTIVO' ? 'Efectivo' :
                                     metodoPago === 'TRANSFERENCIA' ? 'Transferencia' :
                                     metodoPago === 'TARJETA' ? 'Tarjeta' : metodoPago}
                                </Text>
                            </View>
                        </View>
                    </PremiumCard>

                    {/* Fecha */}
                    {fechaCompra && (
                        <PremiumCard style={styles.statCard}>
                            <View style={styles.statContent}>
                                <View style={[styles.statIconContainer, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                                    <Text style={[styles.statIcon, { color: '#F59E0B' }]}>📅</Text>
                                </View>
                                <View style={styles.statTexts}>
                                    <Text style={styles.statLabel}>Fecha de compra</Text>
                                    <Text style={styles.statValue}>
                                        {new Date(fechaCompra).toLocaleDateString('es-ES', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric'
                                        })}
                                    </Text>
                                </View>
                            </View>
                        </PremiumCard>
                    )}
                </View>
            </View>

            {/* ESTADÍSTICAS NUMÉRICAS */}
            <View style={styles.section}>
                <View style={styles.numericStatsContainer}>
                    <PremiumCard style={styles.numericStatCard}>
                        <Text style={styles.numericStatValue}>{cantidadPedidos}</Text>
                        <Text style={styles.numericStatLabel}>📦 Pedidos</Text>
                    </PremiumCard>
                    <PremiumCard style={styles.numericStatCard}>
                        <Text style={styles.numericStatValue}>{vendedoresCount}</Text>
                        <Text style={styles.numericStatLabel}>👥 Vendedores</Text>
                    </PremiumCard>
                </View>
            </View>

            {/* LISTA DE PEDIDOS */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>📦 Pedidos incluidos ({pedidos.length})</Text>
                    <Text style={styles.sectionSubtitle}>Toca cualquier pedido para ver detalles</Text>
                </View>

                {pedidos.map((pedido: any, index: number) => (
                    <PedidoCard
                        key={pedido.idPedido || index}
                        pedido={pedido}
                        index={index}
                        onPress={() => verDetallesPedido(pedido.idPedido, `Pedido #${pedido.idPedido}`)}
                    />
                ))}
            </View>

            {/* BOTÓN FACTURA (si aplica) */}
            {(estadoCompra === "COMPLETADO" || estadoCompra === "PENDIENTE_VERIFICACION") && (
                <View style={styles.section}>
                    <PremiumButton
                        title="Ver factura consolidada"
                        icon="📄"
                        onPress={() => {
                            Alert.alert(
                                "Factura consolidada",
                                "Esta función estará disponible pronto",
                                [{ text: "OK", style: "default" }]
                            );
                        }}
                        type="primary"
                    />
                </View>
            )}

            {/* FOOTER */}
            <View style={styles.footer}>
                <View style={styles.footerContent}>
                    <View style={styles.footerIconContainer}>
                        <Text style={styles.footerIcon}>🔒</Text>
                    </View>
                    <View>
                        <Text style={styles.footerTitle}>Compra protegida</Text>
                        <Text style={styles.footerBrand}>MercadoLocal</Text>
                    </View>
                </View>
                <Text style={styles.footerSubtitle}>
                    Tu compra está respaldada por nuestra garantía de satisfacción
                </Text>
                <View style={styles.versionContainer}>
                    <Text style={styles.versionText}>Detalles de Compra • MercadoLocal</Text>
                    <Text style={styles.versionSubtext}>© 2024 Todos los derechos reservados</Text>
                </View>
            </View>

            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

// 🔥 ESTILOS
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f8f9fa",
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f8f9fa",
        position: 'relative',
    },
    loadingContent: {
        alignItems: 'center',
        zIndex: 1,
    },
    loadingText: {
        fontSize: 16,
        color: "#64748b",
        fontWeight: "600" as any,
        marginTop: 20,
        fontFamily: "System",
    },
    errorContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f8f9fa",
        position: 'relative',
        paddingHorizontal: 20,
    },
    errorContent: {
        alignItems: 'center',
        zIndex: 1,
        width: '100%',
    },
    errorEmoji: {
        fontSize: 60,
        marginBottom: 20,
    },
    errorTitle: {
        fontSize: 24,
        fontWeight: "700" as any,
        color: "#2C3E50",
        marginBottom: 10,
        fontFamily: "System",
    },
    errorMessage: {
        fontSize: 16,
        color: "#64748b",
        textAlign: "center",
        marginBottom: 30,
        fontFamily: "System",
        lineHeight: 22,
    },
    errorButtons: {
        width: '100%',
        gap: 12,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f8f9fa",
        position: 'relative',
        paddingHorizontal: 20,
    },
    emptyContent: {
        alignItems: 'center',
        zIndex: 1,
    },
    emptyEmoji: {
        fontSize: 60,
        marginBottom: 20,
        color: "#FF6B35",
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: "700" as any,
        color: "#2C3E50",
        marginBottom: 10,
        fontFamily: "System",
    },
    emptyMessage: {
        fontSize: 16,
        color: "#64748b",
        textAlign: "center",
        marginBottom: 30,
        fontFamily: "System",
        lineHeight: 22,
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
        opacity: 0.05,
    },
    circle1: {
        width: 150,
        height: 150,
        backgroundColor: '#FF6B35',
        top: -30,
        left: -30,
    },
    circle2: {
        width: 120,
        height: 120,
        backgroundColor: '#3498DB',
        top: 80,
        right: -20,
    },
    circle3: {
        width: 140,
        height: 140,
        backgroundColor: '#9B59B6',
        bottom: 80,
        left: -30,
    },
    header: {
        backgroundColor: "white",
        paddingTop: 60,
        paddingBottom: 30,
        paddingHorizontal: 20,
        alignItems: "center",
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
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
        width: 36,
        height: 36,
        borderRadius: 18,
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
    backButtonIcon: {
        fontSize: 18,
        color: "#FF6B35",
        fontWeight: "700" as any,
    },
    backButtonText: {
        fontSize: 14,
        fontWeight: "600" as any,
        color: "#FF6B35",
        fontFamily: "System",
        marginLeft: 8,
    },
    headerContent: {
        alignItems: 'center',
        zIndex: 1,
        width: '100%',
    },
    headerLabel: {
        fontSize: 12,
        letterSpacing: 2,
        textTransform: "uppercase",
        color: "#FF6B35",
        fontWeight: "700" as any,
        marginBottom: 8,
        fontFamily: "System",
    },
    titleLine: {
        width: 40,
        height: 3,
        backgroundColor: '#FF6B35',
        borderRadius: 2,
        marginBottom: 12,
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: "700" as any,
        color: "#2C3E50",
        marginBottom: 8,
        textAlign: "center",
        fontFamily: "System",
    },
    headerSubtitle: {
        fontSize: 15,
        color: "#64748b",
        textAlign: "center",
        fontFamily: "System",
        lineHeight: 20,
    },
    actionButtonsContainer: {
        marginBottom: 20,
        paddingHorizontal: 16,
    },
    actionButtonsScroll: {
        flexGrow: 0,
    },
    actionButtonsContent: {
        flexDirection: 'row',
        gap: 10,
        paddingRight: 16,
    },
    section: {
        paddingHorizontal: 16,
        marginBottom: 24,
    },
    sectionHeader: {
        marginBottom: 16,
        alignItems: 'flex-start',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: "700" as any,
        color: "#1e293b",
        fontFamily: "System",
        marginBottom: 4,
    },
    sectionSubtitle: {
        fontSize: 14,
        color: "#64748b",
        fontFamily: "System",
        opacity: 0.8,
    },
    premiumCard: {
        backgroundColor: "white",
        borderRadius: 16,
        padding: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
        borderWidth: 1,
        borderColor: "#f1f5f9",
    },
    statsGrid: {
        gap: 12,
    },
    statCard: {
        padding: 16,
    },
    statContent: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    statIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
    },
    statIcon: {
        fontSize: 24,
    },
    statTexts: {
        flex: 1,
    },
    statLabel: {
        fontSize: 13,
        color: "#64748b",
        marginBottom: 4,
        fontWeight: "600" as any,
        fontFamily: "System",
    },
    statValue: {
        fontSize: 18,
        fontWeight: "800" as any,
        color: "#2C3E50",
        fontFamily: "System",
    },
    numericStatsContainer: {
        flexDirection: "row",
        gap: 12,
    },
    numericStatCard: {
        flex: 1,
        alignItems: "center",
        paddingVertical: 20,
    },
    numericStatValue: {
        fontSize: 32,
        fontWeight: "900" as any,
        color: "#FF6B35",
        marginBottom: 8,
        fontFamily: "System",
    },
    numericStatLabel: {
        fontSize: 14,
        color: "#64748b",
        fontWeight: "600" as any,
        fontFamily: "System",
    },
    pedidoCard: {
        marginBottom: 12,
    },
    pedidoContent: {
    },
    pedidoHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    pedidoIconContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        flex: 1,
    },
    pedidoIconWrapper: {
        width: 50,
        height: 50,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
    },
    pedidoIcon: {
        fontSize: 24,
    },
    pedidoTitleContainer: {
        flex: 1,
    },
    pedidoTitle: {
        fontSize: 18,
        fontWeight: "700" as any,
        color: "#2C3E50",
        marginBottom: 6,
        fontFamily: "System",
    },
    estadoBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    estadoBadgeText: {
        fontSize: 12,
        fontWeight: "700" as any,
        fontFamily: "System",
    },
    pedidoPriceContainer: {
        alignItems: 'flex-end',
    },
    pedidoPrice: {
        fontSize: 24,
        fontWeight: "900" as any,
        color: "#FF6B35",
        fontFamily: "System",
    },
    pedidoInfo: {
        gap: 8,
        marginBottom: 16,
    },
    pedidoInfoRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    pedidoInfoIcon: {
        fontSize: 16,
        color: "#64748b",
        width: 20,
    },
    pedidoInfoText: {
        fontSize: 14,
        color: "#64748b",
        fontFamily: "System",
        flex: 1,
    },
    pedidoActions: {
        alignItems: 'flex-start',
    },
    primaryPremiumButton: {
        backgroundColor: '#FF6B35',
        borderRadius: 12,
        paddingVertical: 14,
        shadowColor: '#FF6B35',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 4,
    },
    secondaryPremiumButton: {
        backgroundColor: '#8B5CF6',
        borderRadius: 12,
        paddingVertical: 14,
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 4,
    },
    outlinePremiumButton: {
        backgroundColor: 'white',
        borderRadius: 12,
        paddingVertical: 14,
        borderWidth: 1.5,
        borderColor: '#FF6B35',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    disabledPremiumButton: {
        backgroundColor: '#94a3b8',
        shadowColor: '#94a3b8',
        opacity: 0.7,
    },
    fullWidthButton: {
        width: '100%',
    },
    premiumButtonContent: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    primaryPremiumButtonIcon: {
        fontSize: 18,
        color: 'white',
    },
    secondaryPremiumButtonIcon: {
        fontSize: 18,
        color: 'white',
    },
    outlinePremiumButtonIcon: {
        fontSize: 18,
        color: '#FF6B35',
    },
    primaryPremiumButtonText: {
        fontSize: 15,
        fontWeight: '700' as any,
        color: 'white',
        fontFamily: 'System',
    },
    secondaryPremiumButtonText: {
        fontSize: 15,
        fontWeight: '700' as any,
        color: 'white',
        fontFamily: 'System',
    },
    outlinePremiumButtonText: {
        fontSize: 15,
        fontWeight: '700' as any,
        color: '#FF6B35',
        fontFamily: 'System',
    },
    footer: {
        backgroundColor: '#1e293b',
        borderRadius: 20,
        padding: 24,
        marginHorizontal: 16,
        marginTop: 20,
        marginBottom: 10,
        alignItems: 'center',
    },
    footerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    footerIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255, 107, 53, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    footerIcon: {
        fontSize: 24,
        color: '#FF6B35',
    },
    footerTitle: {
        fontSize: 16,
        fontWeight: '700' as any,
        color: 'white',
        fontFamily: 'System',
        marginBottom: 2,
    },
    footerBrand: {
        fontSize: 12,
        color: '#94a3b8',
        fontFamily: 'System',
        letterSpacing: 1,
    },
    footerSubtitle: {
        fontSize: 13,
        color: '#cbd5e1',
        textAlign: 'center',
        marginBottom: 16,
        lineHeight: 18,
        fontFamily: 'System',
    },
    versionContainer: {
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
        paddingTop: 16,
        alignItems: 'center',
        width: '100%',
    },
    versionText: {
        fontSize: 12,
        color: '#94a3b8',
        fontFamily: 'System',
        marginBottom: 4,
        letterSpacing: 0.5,
    },
    versionSubtext: {
        fontSize: 11,
        color: '#64748b',
        fontFamily: 'System',
        opacity: 0.7,
    },
});