import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    Easing,
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { API_CONFIG } from "../../config";
import { useCarrito } from "../context/CarritoContext";

// 🔥 CÍRCULOS FLOTANTES CON ANIMACIÓN PREMIUM - CORREGIDOS MÁS SUAVES
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

            <View style={[styles.floatingCircle, styles.circle4]} />
            <View style={[styles.floatingCircle, styles.circle5]} />
            <View style={[styles.floatingCircle, styles.circle6]} />

            <View style={[styles.particle, styles.particle1]} />
            <View style={[styles.particle, styles.particle2]} />
            <View style={[styles.particle, styles.particle3]} />
            <View style={[styles.particle, styles.particle4]} />
        </View>
    );
};

// 🔥 BADGE ANIMADO - MÁS SIMPLE
const AnimatedBadge = ({ text, icon, color, isAnimated = true }: {
    text: string,
    icon: string,
    color: string,
    isAnimated?: boolean
}) => {
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (isAnimated) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.03,
                        duration: 1500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 1500,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        }
    }, [isAnimated]);

    return (
        <Animated.View style={[
            styles.animatedBadge,
            {
                backgroundColor: color,
                transform: [{ scale: pulseAnim }]
            }
        ]}>
            <Text style={styles.animatedBadgeIcon}>{icon}</Text>
            <Text style={styles.animatedBadgeText}>{text}</Text>
        </Animated.View>
    );
};

// 🔥 CARD CON EFECTO MÁS LIMPIO
const PremiumCard = ({
    children,
    style,
    delay = 0,
    withAnimation = true
}: {
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

// 🔥 BOTÓN PREMIUM SIMPLIFICADO
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
    type?: "primary" | "secondary" | "danger",
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
            case "danger":
                return styles.dangerPremiumButton;
            default:
                return styles.primaryPremiumButton;
        }
    };

    const getIconStyle = () => {
        switch (type) {
            case "secondary":
                return styles.secondaryPremiumButtonIcon;
            case "danger":
                return styles.dangerPremiumButtonIcon;
            default:
                return styles.primaryPremiumButtonIcon;
        }
    };

    const getTextStyle = () => {
        switch (type) {
            case "secondary":
                return styles.secondaryPremiumButtonText;
            case "danger":
                return styles.dangerPremiumButtonText;
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
                            color={type === "secondary" ? "#FF6B35" : "white"}
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

// 🔥 INPUT MEJORADO CON MEJOR ESPACIADO
const PremiumInput = ({
    label,
    value,
    onChangeText,
    placeholder,
    keyboardType = "default",
    secureTextEntry = false,
    icon,
    multiline = false,
    maxLength,
    autoCapitalize = "none",
    containerStyle = {}
}: {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder: string;
    keyboardType?: any;
    secureTextEntry?: boolean;
    icon?: string;
    multiline?: boolean;
    maxLength?: number;
    autoCapitalize?: "none" | "sentences" | "words" | "characters";
    containerStyle?: any;
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const focusAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(focusAnim, {
            toValue: isFocused ? 1 : 0,
            duration: 200,
            useNativeDriver: false,
        }).start();
    }, [isFocused]);

    const borderColor = focusAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['#e5e7eb', '#FF6B35']
    });

    return (
        <View style={[styles.premiumInputContainer, containerStyle]}>
            <Text style={styles.premiumInputLabel}>
                {label}
            </Text>

            <Animated.View
                style={[
                    styles.premiumInputWrapper,
                    { borderColor: borderColor }
                ]}
            >
                {icon && (
                    <Text style={styles.premiumInputIcon}>{icon}</Text>
                )}

                <TextInput
                    style={[
                        styles.premiumInput,
                        multiline && styles.multilineInput,
                        icon && styles.inputWithIcon
                    ]}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor="#94a3b8"
                    keyboardType={keyboardType}
                    secureTextEntry={secureTextEntry}
                    multiline={multiline}
                    maxLength={maxLength}
                    autoCapitalize={autoCapitalize}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                />
            </Animated.View>
        </View>
    );
};

// 🔥 COMPONENTE DE PRODUCTO SIMPLIFICADO
const ProductoCard = ({ item, index }: { item: any, index: number }) => {
    return (
        <PremiumCard style={styles.productoCard} delay={index * 50} withAnimation={index > 0}>
            <View style={styles.productoContent}>
                <View style={styles.productoImageContainer}>
                    {item.imagenProducto ? (
                        <Image
                            source={{ uri: item.imagenProducto }}
                            style={styles.productoImage}
                        />
                    ) : (
                        <View style={styles.productoImagePlaceholder}>
                            <Text style={styles.productoImagePlaceholderIcon}>🛍️</Text>
                        </View>
                    )}

                    <View style={styles.quantityBadge}>
                        <Text style={styles.quantityBadgeText}>x{item.cantidad}</Text>
                    </View>
                </View>

                <View style={styles.productoInfo}>
                    <Text style={styles.productoNombre} numberOfLines={2}>
                        {item.nombreProducto || "Producto sin nombre"}
                    </Text>

                    <View style={styles.productoMeta}>
                        <Text style={styles.precioUnitario}>
                            ${item.precioProducto.toFixed(2)} c/u
                        </Text>
                    </View>
                </View>

                <View style={styles.precioTotalContainer}>
                    <Text style={styles.precioTotal}>
                        ${(item.precioProducto * item.cantidad).toFixed(2)}
                    </Text>
                </View>
            </View>
        </PremiumCard>
    );
};

// 🔥 COMPONENTE PRINCIPAL
export default function CheckoutUnificadoPremium() {
    const router = useRouter();
    const { items, eliminarItem } = useCarrito();
    const { width } = Dimensions.get('window');

    const [metodoPago, setMetodoPago] = useState("EFECTIVO");
    const [montoEfectivo, setMontoEfectivo] = useState("");
    const [comprobante, setComprobante] = useState<any>(null);
    const [numTarjeta, setNumTarjeta] = useState("");
    const [cvv, setCvv] = useState("");
    const [fechaTarjeta, setFechaTarjeta] = useState("");
    const [titular, setTitular] = useState("");
    const [procesando, setProcesando] = useState(false);

    const headerFadeAnim = useRef(new Animated.Value(0)).current;
    const headerSlideAnim = useRef(new Animated.Value(50)).current;

    useEffect(() => {
        startAnimations();
    }, []);

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

    // Calcular totales
    const subtotal = items.reduce(
        (acc, item) => acc + item.precioProducto * item.cantidad,
        0
    );
    const iva = subtotal * 0.12;
    const total = subtotal + iva;

    // Función para seleccionar comprobante
    const seleccionarComprobante = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (status !== 'granted') {
                Alert.alert('Permiso necesario', 'Se necesita acceso a la galería para subir comprobantes');
                return;
            }

            Alert.alert(
                'Seleccionar comprobante',
                '¿Cómo quieres subir el comprobante?',
                [
                    {
                        text: '📸 Cámara',
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
                        text: '🖼️ Galería',
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
                        text: '📄 Documento PDF',
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

    // Validar formulario
    const validarFormulario = (): boolean => {
        if (metodoPago === "EFECTIVO") {
            if (montoEfectivo) {
                const montoLimpio = montoEfectivo.replace(',', '.');
                const montoNum = parseFloat(montoLimpio);

                if (isNaN(montoNum)) {
                    Alert.alert("Error", "Monto inválido");
                    return false;
                }

                if (montoNum < total) {
                    Alert.alert("Error", `El monto debe ser mayor o igual al total ($${total.toFixed(2).replace('.', ',')})`);
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

            if (comprobante.fileSize && comprobante.fileSize > 5 * 1024 * 1024) {
                Alert.alert("Error", "El archivo es muy grande. Máximo 5MB");
                return false;
            }

            const tiposPermitidos = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
            const tipoArchivo = comprobante.mimeType || comprobante.type;

            if (tipoArchivo && !tiposPermitidos.includes(tipoArchivo.toLowerCase())) {
                Alert.alert("Error", "Solo se permiten imágenes JPG, PNG o PDF");
                return false;
            }
        }

        if (metodoPago === "TARJETA") {
            if (!numTarjeta || numTarjeta.replace(/\s/g, "").length < 15) {
                Alert.alert("Error", "Número de tarjeta inválido");
                return false;
            }
            if (!cvv || cvv.length < 3) {
                Alert.alert("Error", "CVV inválido");
                return false;
            }
            if (!fechaTarjeta) {
                Alert.alert("Error", "Fecha de expiración requerida");
                return false;
            }
            if (!titular.trim()) {
                Alert.alert("Error", "Nombre del titular requerido");
                return false;
            }
        }

        return true;
    };

    // FUNCIÓN MEJORADA PARA CREAR PEDIDO
    const crearPedidoUnico = async (token: string, userId: number) => {
        console.log("🔵 Creando pedido único...");

        const endpoints = [
            {
                url: `${API_CONFIG.BASE_URL}/pedidos/checkout`,
                body: { idConsumidor: userId },
                name: "/pedidos/checkout con idConsumidor"
            },
            {
                url: `${API_CONFIG.BASE_URL}/pedidos`,
                body: { idConsumidor: userId },
                name: "/pedidos con idConsumidor"
            },
            {
                url: `${API_CONFIG.BASE_URL}/pedidos`,
                body: {
                    consumidor: { idConsumidor: userId }
                },
                name: "/pedidos con objeto consumidor"
            },
            {
                url: `${API_CONFIG.BASE_URL}/pedidos`,
                body: {
                    productos: items.map(item => ({
                        idProducto: item.idProducto,
                        cantidad: item.cantidad
                    }))
                },
                name: "/pedidos con productos"
            },
            {
                url: `${API_CONFIG.BASE_URL}/pedidos`,
                body: {
                    idConsumidor: userId,
                    productos: items.map(item => ({
                        idProducto: item.idProducto,
                        cantidad: item.cantidad
                    }))
                },
                name: "/pedidos con todo"
            }
        ];

        for (const endpoint of endpoints) {
            try {
                console.log(`\n🔵 Probando endpoint: ${endpoint.name}`);
                console.log("🔵 URL:", endpoint.url);
                console.log("🔵 Body:", JSON.stringify(endpoint.body));

                const response = await fetch(endpoint.url, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`,
                    },
                    body: JSON.stringify(endpoint.body),
                });

                console.log("📤 Status:", response.status);
                console.log("📤 OK?", response.ok);

                if (response.ok) {
                    const data = await response.json();
                    console.log("✅ Pedido creado exitosamente:", data);
                    return data;
                } else {
                    const errorText = await response.text();
                    console.log(`❌ Error ${response.status}:`, errorText);

                    if (response.status === 403) {
                        console.log("⚠️ Error 403 - Problema de permisos");
                        continue;
                    }

                    if (response.status === 400) {
                        console.log("⚠️ Error 400 - Estructura incorrecta");
                        continue;
                    }

                    if (response.status !== 200) {
                        throw new Error(`Error ${response.status}: ${errorText}`);
                    }
                }
            } catch (error) {
                console.error(`❌ Error en endpoint ${endpoint.name}:`, error);
            }
        }

        throw new Error("No se pudo crear el pedido con ningún endpoint");
    };

    // FINALIZAR COMPRA UNIFICADA
    const finalizarCompra = async () => {
        if (!validarFormulario()) return;

        const token = await AsyncStorage.getItem("authToken");
        const userData = await AsyncStorage.getItem("user");
        const user = userData ? JSON.parse(userData) : null;

        if (!token || !user?.idConsumidor) {
            Alert.alert("Sesión requerida", "Debes iniciar sesión para realizar la compra", [
                { text: "Cancelar", style: "cancel" },
                { text: "Iniciar Sesión", onPress: () => router.push("/login") },
            ]);
            return;
        }

        let confirmar;
        if (metodoPago === "EFECTIVO") {
            confirmar = await new Promise((resolve) => {
                Alert.alert(
                    "💵 Pago en Efectivo",
                    `📦 Finalizar compra\n\n` +
                    `💰 Total: $${total.toFixed(2).replace('.', ',')}\n` +
                    `⏰ Pagarás al recibir tu pedido\n` +
                    `✅ El vendedor será notificado inmediatamente\n\n` +
                    `¿Confirmar tu pedido?`,
                    [
                        {
                            text: "✕ Cancelar",
                            onPress: () => resolve(false),
                            style: "cancel"
                        },
                        {
                            text: "✅ Confirmar Pedido",
                            onPress: () => resolve(true),
                            style: "default"
                        },
                    ]
                );
            });
        } else {
            confirmar = await new Promise((resolve) => {
                Alert.alert(
                    "💳 Confirmar Pago",
                    `📦 Finalizar compra\n\n` +
                    `💰 Total: $${total.toFixed(2).replace('.', ',')}\n` +
                    `💳 Método: ${metodoPago}\n\n` +
                    `¿Procesar el pago ahora?`,
                    [
                        {
                            text: "✕ Cancelar",
                            onPress: () => resolve(false),
                            style: "cancel"
                        },
                        {
                            text: "✅ Proceder al Pago",
                            onPress: () => resolve(true),
                            style: "default"
                        },
                    ]
                );
            });
        }

        if (!confirmar) return;

        setProcesando(true);

        try {
            console.log("\n🛒 INICIANDO PROCESO DE CHECKOUT");
            console.log("👤 Usuario ID:", user.idConsumidor);
            console.log("💰 Total:", total);
            console.log("💳 Método de pago:", metodoPago);

            // 1. Crear el pedido único
            const pedidoUnico = await crearPedidoUnico(token, user.idConsumidor);

            if (!pedidoUnico || !pedidoUnico.idPedido) {
                throw new Error("No se creó el pedido correctamente");
            }

            console.log("✅ Pedido único creado:", pedidoUnico);

            // 2. Aplicar el método de pago
            console.log("\n🔵 Aplicando método de pago...");

            let body;
            let headers: any = {
                Authorization: `Bearer ${token}`,
            };

            if (metodoPago === "EFECTIVO") {
                headers["Content-Type"] = "application/json";

                let montoFinal = total;
                if (montoEfectivo) {
                    const montoLimpio = montoEfectivo.replace(',', '.');
                    const montoNum = parseFloat(montoLimpio);

                    if (!isNaN(montoNum) && montoNum >= total) {
                        montoFinal = montoNum;
                    }
                }

                body = JSON.stringify({
                    metodoPago: "EFECTIVO",
                    montoEfectivo: montoFinal
                });

                console.log("💵 Monto final:", montoFinal);

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

                    console.log("🏦 Archivo adjunto:", fileName);
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
                console.log("💳 Datos de tarjeta enviados");
            }

            const urlFinalizar = `${API_CONFIG.BASE_URL}/pedidos/finalizar/${pedidoUnico.idPedido}`;
            console.log("🔗 URL finalizar:", urlFinalizar);

            const resFinalizar = await fetch(urlFinalizar, {
                method: "PUT",
                headers: headers,
                body: body,
            });

            console.log("📤 Status finalizar:", resFinalizar.status);
            console.log("📤 OK?", resFinalizar.ok);

            if (!resFinalizar.ok) {
                const errorText = await resFinalizar.text();
                console.error("❌ Error del servidor (finalizar):", errorText);
                throw new Error(`Error al procesar el pago: ${errorText}`);
            }

            console.log("✅ Pedido finalizado exitosamente");

            // 3. Limpiar carrito
            try {
                console.log("🗑️ Limpiando carrito...");
                for (const item of items) {
                    await eliminarItem(item.idCarrito);
                }
                console.log("✅ Carrito limpiado exitosamente");
            } catch (error) {
                console.log("⚠️ No se pudo vaciar el carrito:", error);
            }

            // 4. Mostrar éxito y redirigir
            Alert.alert(
                "🎉 ¡Compra realizada con éxito!",
                `📦 Tu pedido #${pedidoUnico.idPedido} ha sido procesado correctamente.\n\n` +
                `💰 Total: $${total.toFixed(2).replace('.', ',')}\n` +
                `💳 Método: ${metodoPago}\n` +
                `✅ Estado: PROCESANDO`,
                [
                    {
                        text: "📦 Ver Pedido",
                        onPress: () => {
                            router.push(`/consumidor/Pedido?id=${pedidoUnico.idPedido}`);
                        },
                    },
                    {
                        text: "🏠 Ir al Inicio",
                        onPress: () => {
                            router.push("/(tabs)/explorar");
                        },
                    },
                ]
            );

        } catch (err: any) {
            console.error("\n❌ ERROR COMPLETO EN CHECKOUT:");
            console.error("❌ Mensaje:", err.message);
            console.error("❌ Stack:", err.stack);

            Alert.alert(
                "❌ Error al procesar la compra",
                `Detalles: ${err.message || "Error desconocido"}\n\nPor favor, intenta nuevamente.`
            );
        } finally {
            setProcesando(false);
        }
    };

    if (!items || items.length === 0) {
        return (
            <View style={styles.loadingContainer}>
                <FloatingCircles />
                <View style={styles.emptyContent}>
                    <Text style={styles.emptyEmoji}>🛒</Text>
                    <Text style={styles.emptyTitle}>Tu carrito está vacío</Text>
                    <Text style={styles.emptySubtitle}>
                        Agrega productos antes de finalizar la compra
                    </Text>
                    <PremiumButton
                        title="Explorar Productos"
                        icon="🔍"
                        onPress={() => router.push("/(tabs)/explorar")}
                        type="primary"
                    />
                </View>
            </View>
        );
    }

    return (
        <ScrollView 
            style={styles.container} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
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
                    </View>
                    <Text style={styles.backButtonText}>Volver</Text>
                </TouchableOpacity>

                <View style={styles.headerContent}>
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarIcon}>🛒</Text>
                        </View>

                        <AnimatedBadge
                            text={`${items.length} ${items.length === 1 ? "PRODUCTO" : "PRODUCTOS"}`}
                            icon="📦"
                            color="#FF6B35"
                            isAnimated={true}
                        />
                    </View>

                    <View style={styles.titleContainer}>
                        <Text style={styles.headerLabel}>CHECKOUT</Text>
                        <View style={styles.titleLine} />
                        <Text style={styles.headerTitle}>Finalizar Compra</Text>
                    </View>

                    <View style={styles.infoBadgesContainer}>
                        <PremiumCard style={styles.infoBadge} delay={100} withAnimation>
                            <View style={styles.infoBadgeIconContainer}>
                                <Text style={styles.infoBadgeIcon}>💰</Text>
                            </View>
                            <Text style={styles.infoBadgeText}>
                                ${total.toFixed(2)}
                            </Text>
                        </PremiumCard>

                        <PremiumCard style={styles.infoBadge} delay={150} withAnimation>
                            <View style={styles.infoBadgeIconContainer}>
                                <Text style={styles.infoBadgeIcon}>
                                    {metodoPago === "EFECTIVO" && "💵"}
                                    {metodoPago === "TRANSFERENCIA" && "🏦"}
                                    {metodoPago === "TARJETA" && "💳"}
                                </Text>
                            </View>
                            <Text style={styles.infoBadgeText}>{metodoPago}</Text>
                        </PremiumCard>
                    </View>
                </View>
            </Animated.View>

            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>📦 Productos en tu pedido</Text>
                    <Text style={styles.sectionSubtitle}>{items.length} {items.length === 1 ? "artículo" : "artículos"}</Text>
                </View>

                {items.map((item, index) => (
                    <ProductoCard key={item.idCarrito || index} item={item} index={index} />
                ))}
            </View>

            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>💰 Resumen de compra</Text>
                    <Text style={styles.sectionSubtitle}>Detalles financieros</Text>
                </View>

                <PremiumCard style={styles.resumenCard} delay={300} withAnimation>
                    <View style={styles.resumenRow}>
                        <View style={styles.resumenLabelContainer}>
                            <View style={[styles.resumenIconContainer, { backgroundColor: '#FFF2E8' }]}>
                                <Text style={[styles.resumenIcon, { color: '#FF6B35' }]}>🛒</Text>
                            </View>
                            <Text style={styles.resumenLabel}>Subtotal</Text>
                        </View>
                        <View style={styles.resumenValueContainer}>
                            <Text style={styles.resumenValue}>${subtotal.toFixed(2)}</Text>
                        </View>
                    </View>

                    <View style={styles.resumenRow}>
                        <View style={styles.resumenLabelContainer}>
                            <View style={[styles.resumenIconContainer, { backgroundColor: '#E8F4FD' }]}>
                                <Text style={[styles.resumenIcon, { color: '#3498DB' }]}>🧾</Text>
                            </View>
                            <Text style={styles.resumenLabel}>IVA (12%)</Text>
                        </View>
                        <View style={styles.resumenValueContainer}>
                            <Text style={styles.resumenValue}>${iva.toFixed(2)}</Text>
                        </View>
                    </View>

                    <View style={styles.resumenRow}>
                        <View style={styles.resumenLabelContainer}>
                            <View style={[styles.resumenIconContainer, { backgroundColor: '#F0F4FF' }]}>
                                <Text style={[styles.resumenIcon, { color: '#9B59B6' }]}>
                                    {metodoPago === "EFECTIVO" && "💵"}
                                    {metodoPago === "TRANSFERENCIA" && "🏦"}
                                    {metodoPago === "TARJETA" && "💳"}
                                </Text>
                            </View>
                            <Text style={styles.resumenLabel}>Método seleccionado</Text>
                        </View>
                        <View style={styles.resumenValueContainer}>
                            <Text style={styles.resumenValue}>{metodoPago}</Text>
                        </View>
                    </View>

                    <View style={styles.resumenDivider} />

                    <View style={styles.totalRow}>
                        <View style={styles.totalLabelContainer}>
                            <View style={[styles.totalIconContainer, { backgroundColor: '#FF6B35' }]}>
                                <Text style={styles.totalIcon}>💵</Text>
                            </View>
                            <Text style={styles.totalLabel}>Total</Text>
                        </View>
                        <View style={styles.totalValueContainer}>
                            <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
                        </View>
                    </View>
                </PremiumCard>
            </View>

            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>💳 Método de Pago</Text>
                    <Text style={styles.sectionSubtitle}>Selecciona cómo deseas pagar</Text>
                </View>

                <PremiumCard style={styles.paymentSection} delay={400} withAnimation>
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
                                activeOpacity={0.7}
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
                            </TouchableOpacity>
                        ))}
                    </View>

                    {metodoPago === "EFECTIVO" && (
                        <View style={styles.formContainer}>
                            <View style={styles.alertBox}>
                                <Text style={styles.alertIcon}>💵</Text>
                                <View style={styles.alertContent}>
                                    <Text style={styles.alertTitle}>Pago contra entrega</Text>
                                    <Text style={styles.alertText}>
                                        Pagarás ${total.toFixed(2)} en efectivo cuando recibas tu pedido.
                                    </Text>
                                </View>
                            </View>

                            <PremiumInput
                                label="Monto que entregarás (opcional)"
                                value={montoEfectivo}
                                onChangeText={setMontoEfectivo}
                                placeholder={`Ej: ${(total + 1).toFixed(2)}`}
                                keyboardType="decimal-pad"
                                icon="$"
                                containerStyle={styles.inputSpacing}
                            />

                            {montoEfectivo && (
                                <View style={styles.cambioContainer}>
                                    <Text style={styles.cambioLabel}>Información:</Text>
                                    {(() => {
                                        const montoLimpio = montoEfectivo.replace(',', '.');
                                        const montoNum = parseFloat(montoLimpio);

                                        if (isNaN(montoNum)) {
                                            return (
                                                <Text style={styles.errorText}>❌ Monto inválido</Text>
                                            );
                                        } else if (montoNum < total) {
                                            return (
                                                <Text style={styles.errorText}>
                                                    ❌ Faltan ${(total - montoNum).toFixed(2)}
                                                </Text>
                                            );
                                        } else {
                                            return (
                                                <Text style={styles.cambioText}>
                                                    ✓ Cambio: ${(montoNum - total).toFixed(2)}
                                                </Text>
                                            );
                                        }
                                    })()}
                                </View>
                            )}

                            <Text style={styles.ayudaText}>
                                ⓘ Si no ingresas un monto, se asumirá que pagarás el total exacto (${total.toFixed(2)})
                            </Text>
                        </View>
                    )}

                    {metodoPago === "TRANSFERENCIA" && (
                        <View style={styles.formContainer}>
                            <View style={styles.alertBox}>
                                <Text style={styles.alertIcon}>🏦</Text>
                                <View style={styles.alertContent}>
                                    <Text style={styles.alertTitle}>Transferencia Bancaria</Text>
                                    <Text style={styles.alertText}>
                                        Transfiere ${total.toFixed(2)} a nuestra cuenta y sube el comprobante.
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
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.fileButtonIcon}>📎</Text>
                                    <Text style={styles.fileButtonText}>Seleccionar comprobante</Text>
                                    <Text style={styles.fileButtonSubtext}>
                                        (Imagen JPG/PNG o PDF - Max 5MB)
                                    </Text>
                                </TouchableOpacity>
                            )}

                            <Text style={styles.ayudaText}>
                                ⓘ Toma una foto del comprobante o selecciona el archivo PDF
                            </Text>
                        </View>
                    )}

                    {metodoPago === "TARJETA" && (
                        <View style={styles.formContainer}>
                            <View style={styles.alertBox}>
                                <Text style={styles.alertIcon}>💳</Text>
                                <View style={styles.alertContent}>
                                    <Text style={styles.alertTitle}>Pago con Tarjeta</Text>
                                    <Text style={styles.alertText}>
                                        Ingresa los datos de tu tarjeta para completar el pago seguro.
                                    </Text>
                                </View>
                            </View>

                            <PremiumInput
                                label="Número de tarjeta"
                                value={numTarjeta}
                                onChangeText={(text) => {
                                    const formatted = text
                                        .replace(/\s/g, "")
                                        .replace(/(\d{4})/g, "$1 ")
                                        .trim();
                                    setNumTarjeta(formatted);
                                }}
                                placeholder="0000 0000 0000 0000"
                                keyboardType="number-pad"
                                maxLength={19}
                                icon="💳"
                                containerStyle={styles.inputSpacing}
                            />

                            <View style={styles.rowInputs}>
                                <View style={[styles.columnInput, styles.columnSpacing]}>
                                    <PremiumInput
                                        label="CVV"
                                        value={cvv}
                                        onChangeText={setCvv}
                                        placeholder="123"
                                        keyboardType="number-pad"
                                        maxLength={4}
                                        secureTextEntry
                                        icon="🔒"
                                    />
                                </View>
                                <View style={styles.columnInput}>
                                    <PremiumInput
                                        label="Expiración (MM/AA)"
                                        value={fechaTarjeta}
                                        onChangeText={(text) => {
                                            let formatted = text.replace(/\D/g, '');
                                            if (formatted.length > 2) {
                                                formatted = formatted.substring(0, 2) + '/' + formatted.substring(2, 4);
                                            }
                                            setFechaTarjeta(formatted);
                                        }}
                                        placeholder="12/25"
                                        maxLength={5}
                                        icon="📅"
                                    />
                                </View>
                            </View>

                            <PremiumInput
                                label="Titular de la tarjeta"
                                value={titular}
                                onChangeText={setTitular}
                                placeholder="Nombre completo como aparece en la tarjeta"
                                icon="👤"
                                autoCapitalize="words"
                                containerStyle={styles.inputSpacing}
                            />

                            <Text style={styles.ayudaText}>
                                ⓘ Los datos de tarjeta se procesan de forma segura
                            </Text>
                        </View>
                    )}

                    <PremiumButton
                        title={`Pagar $${total.toFixed(2)}`}
                        icon="💳"
                        onPress={finalizarCompra}
                        disabled={procesando}
                        loading={procesando}
                        type="primary"
                        fullWidth
                    />
                </PremiumCard>
            </View>

            <View style={styles.footer}>
                <FloatingCircles />

                <View style={styles.footerContent}>
                    <View style={styles.footerIconContainer}>
                        <Text style={styles.footerIcon}>🔒</Text>
                    </View>
                    <View>
                        <Text style={styles.footerTitle}>Proceso de Pago Seguro</Text>
                        <Text style={styles.footerBrand}>MercadoLocal</Text>
                    </View>
                </View>
                <Text style={styles.footerSubtitle}>
                    Tus pagos están protegidos con encriptación de nivel bancario
                </Text>

                <View style={styles.versionContainer}>
                    <Text style={styles.versionText}>Checkout Premium • MercadoLocal</Text>
                    <Text style={styles.versionSubtext}>© 2024 Todos los derechos reservados</Text>
                </View>
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
    emptyContent: {
        alignItems: 'center',
        zIndex: 1,
        paddingHorizontal: 20,
    },
    emptyEmoji: {
        fontSize: 60,
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: "700" as any,
        color: "#1e293b",
        marginBottom: 12,
        fontFamily: "System",
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 16,
        color: "#64748b",
        textAlign: "center",
        marginBottom: 30,
        fontFamily: "System",
        lineHeight: 22,
        paddingHorizontal: 20,
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
    circle4: {
        width: 80,
        height: 80,
        backgroundColor: '#2ECC71',
        bottom: 40,
        right: 40,
    },
    circle5: {
        width: 100,
        height: 100,
        backgroundColor: '#FF9F43',
        top: 120,
        left: '30%',
    },
    circle6: {
        width: 60,
        height: 60,
        backgroundColor: '#54a0ff',
        bottom: 120,
        right: '30%',
    },
    particle: {
        position: 'absolute',
        borderRadius: 2,
        opacity: 0.08,
    },
    particle1: {
        width: 3,
        height: 3,
        backgroundColor: '#FF6B35',
        top: 100,
        left: '20%',
    },
    particle2: {
        width: 2,
        height: 2,
        backgroundColor: '#3498DB',
        top: 200,
        right: '25%',
    },
    particle3: {
        width: 4,
        height: 4,
        backgroundColor: '#2ECC71',
        bottom: 150,
        left: '40%',
    },
    particle4: {
        width: 2,
        height: 2,
        backgroundColor: '#9B59B6',
        bottom: 80,
        right: '40%',
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

    avatarContainer: {
        alignItems: 'center',
        marginBottom: 20,
        position: 'relative',
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: '#FF6B35',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
        elevation: 10,
        marginBottom: 10,
    },
    avatarIcon: {
        fontSize: 36,
        color: "white",
    },

    animatedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 5,
        borderWidth: 2,
        borderColor: "white",
    },
    animatedBadgeIcon: {
        fontSize: 14,
        marginRight: 6,
        color: "white",
    },
    animatedBadgeText: {
        fontSize: 12,
        fontWeight: "700" as any,
        color: "white",
        fontFamily: "System",
        letterSpacing: 0.5,
    },

    titleContainer: {
        alignItems: 'center',
        marginBottom: 20,
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
        color: "#1e293b",
        marginBottom: 15,
        textAlign: "center",
        fontFamily: "System",
    },

    infoBadgesContainer: {
        flexDirection: 'row',
        gap: 10,
        justifyContent: 'center',
        flexWrap: 'wrap',
        width: '100%',
    },
    infoBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: "#f8f9fa",
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "#f1f5f9",
        minWidth: 100,
    },
    infoBadgeIconContainer: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: "white",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#e5e7eb",
    },
    infoBadgeIcon: {
        fontSize: 14,
        color: "#64748b",
    },
    infoBadgeText: {
        fontSize: 13,
        color: "#64748b",
        fontWeight: "600" as any,
        fontFamily: "System",
    },

    section: {
        paddingHorizontal: 16,
        marginBottom: 24,
    },
    sectionHeader: {
        marginBottom: 16,
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: "700" as any,
        color: "#1e293b",
        fontFamily: "System",
        marginBottom: 6,
        textAlign: 'center',
    },
    sectionSubtitle: {
        fontSize: 14,
        color: "#64748b",
        fontFamily: "System",
        opacity: 0.8,
        textAlign: 'center',
        marginBottom: 4,
    },

    premiumCard: {
        backgroundColor: "white",
        borderRadius: 20,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 6,
        borderWidth: 1,
        borderColor: "#f1f5f9",
    },

    productoCard: {
        padding: 0,
        overflow: 'hidden',
        marginBottom: 12,
    },
    productoContent: {
        flexDirection: "row",
        padding: 16,
        alignItems: 'center',
    },
    productoImageContainer: {
        marginRight: 12,
        position: 'relative',
    },
    productoImage: {
        width: 70,
        height: 70,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#f1f5f9",
    },
    productoImagePlaceholder: {
        width: 70,
        height: 70,
        borderRadius: 12,
        backgroundColor: "#FFF2E8",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#FFE4D6",
    },
    productoImagePlaceholderIcon: {
        fontSize: 28,
        color: "#FF6B35",
    },
    quantityBadge: {
        position: 'absolute',
        top: -6,
        right: -6,
        backgroundColor: "#FF6B35",
        minWidth: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 2,
        borderColor: "white",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
    },
    quantityBadgeText: {
        fontSize: 11,
        color: "white",
        fontWeight: "700" as any,
        fontFamily: "System",
        paddingHorizontal: 6,
    },

    productoInfo: {
        flex: 1,
        marginRight: 10,
    },
    productoNombre: {
        fontSize: 15,
        color: "#1e293b",
        fontWeight: "600" as any,
        fontFamily: "System",
        marginBottom: 6,
        lineHeight: 20,
    },
    productoMeta: {
        marginBottom: 6,
    },
    precioUnitario: {
        fontSize: 13,
        color: "#64748b",
        fontFamily: "System",
    },

    precioTotalContainer: {
        alignItems: 'flex-end',
    },
    precioTotal: {
        fontSize: 18,
        fontWeight: "700" as any,
        color: "#FF6B35",
        fontFamily: "System",
    },

    resumenCard: {
        padding: 18,
    },
    resumenRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#f1f5f9",
    },
    resumenLabelContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    resumenIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
    },
    resumenIcon: {
        fontSize: 16,
    },
    resumenLabel: {
        fontSize: 14,
        color: "#64748b",
        fontWeight: "500" as any,
        fontFamily: "System",
    },
    resumenValueContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    resumenValue: {
        fontSize: 15,
        color: "#1e293b",
        fontWeight: "600" as any,
        fontFamily: "System",
    },

    resumenDivider: {
        height: 1,
        backgroundColor: "#f1f5f9",
        marginVertical: 14,
    },

    totalRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingTop: 10,
    },
    totalLabelContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    totalIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: "center",
        alignItems: "center",
    },
    totalIcon: {
        fontSize: 18,
        color: "white",
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: "700" as any,
        color: "#1e293b",
        fontFamily: "System",
    },
    totalValueContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    totalValue: {
        fontSize: 28,
        fontWeight: "800" as any,
        color: "#FF6B35",
        fontFamily: "System",
    },

    paymentSection: {
        padding: 18,
    },
    paymentMethods: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        gap: 8,
    },
    paymentMethodButton: {
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        backgroundColor: '#f8f9fa',
        borderWidth: 1.5,
        borderColor: 'transparent',
        flex: 1,
        minHeight: 80,
        justifyContent: 'center',
    },
    paymentMethodButtonActive: {
        backgroundColor: 'white',
        borderColor: '#FF6B35',
        shadowColor: '#FF6B35',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    paymentMethodIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    paymentMethodIconContainerActive: {
        backgroundColor: '#FFF2E8',
    },
    paymentMethodIcon: {
        fontSize: 18,
        color: '#64748b',
    },
    paymentMethodIconActive: {
        color: '#FF6B35',
    },
    paymentMethodText: {
        fontSize: 12,
        fontWeight: '600' as any,
        color: '#64748b',
        fontFamily: 'System',
        textAlign: 'center',
    },
    paymentMethodTextActive: {
        color: '#FF6B35',
    },

    formContainer: {
        marginTop: 10,
    },
    alertBox: {
        flexDirection: 'row',
        backgroundColor: '#F0F9FF',
        borderRadius: 14,
        padding: 16,
        marginBottom: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E0F2FE',
    },
    alertIcon: {
        fontSize: 24,
        color: '#0369A1',
        marginRight: 12,
    },
    alertContent: {
        flex: 1,
    },
    alertTitle: {
        fontSize: 16,
        fontWeight: '700' as any,
        color: '#0369A1',
        marginBottom: 4,
        fontFamily: 'System',
    },
    alertText: {
        fontSize: 14,
        color: '#64748b',
        lineHeight: 20,
        fontFamily: 'System',
    },

    premiumInputContainer: {
        marginBottom: 16,
    },
    premiumInputLabel: {
        fontSize: 14,
        fontWeight: '600' as any,
        color: '#1e293b',
        marginBottom: 8,
        fontFamily: 'System',
    },
    premiumInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderWidth: 1.5,
        borderRadius: 12,
        paddingHorizontal: 14,
        height: 52,
    },
    premiumInputIcon: {
        fontSize: 18,
        color: '#94a3b8',
        marginRight: 10,
    },
    premiumInput: {
        flex: 1,
        fontSize: 15,
        color: '#1e293b',
        fontFamily: 'System',
        paddingVertical: 0,
        height: '100%',
    },
    inputWithIcon: {
        marginLeft: 0,
    },
    multilineInput: {
        height: 100,
        textAlignVertical: 'top',
        paddingTop: 12,
    },

    inputLabel: {
        fontSize: 14,
        fontWeight: '600' as any,
        color: '#1e293b',
        marginBottom: 10,
        fontFamily: 'System',
    },
    inputSpacing: {
        marginBottom: 16,
    },
    rowInputs: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    columnInput: {
        flex: 1,
    },
    columnSpacing: {
        marginRight: 4,
    },

    cambioContainer: {
        backgroundColor: '#F0FFF4',
        padding: 14,
        borderRadius: 12,
        marginTop: 8,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#DCFCE7',
    },
    cambioLabel: {
        fontSize: 12,
        fontWeight: '600' as any,
        color: '#64748b',
        marginBottom: 6,
        fontFamily: 'System',
    },
    cambioText: {
        fontSize: 14,
        color: '#2ECC71',
        fontWeight: '600' as any,
        fontFamily: 'System',
    },
    errorText: {
        fontSize: 14,
        color: '#E74C3C',
        fontWeight: '600' as any,
        fontFamily: 'System',
    },
    ayudaText: {
        fontSize: 12,
        color: '#94a3b8',
        fontFamily: "System",
        marginTop: 8,
        lineHeight: 16,
    },

    comprobanteSeleccionado: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F4ED',
        padding: 14,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E3EBD9',
    },
    comprobantePreview: {
        width: 50,
        height: 50,
        borderRadius: 8,
        marginRight: 12,
    },
    pdfIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 8,
        backgroundColor: '#E3EBD9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    pdfIcon: {
        fontSize: 22,
    },
    comprobanteInfo: {
        flex: 1,
    },
    comprobanteNombre: {
        fontSize: 14,
        fontWeight: '600' as any,
        color: '#1e293b',
        fontFamily: 'System',
    },
    comprobanteTipo: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
        fontFamily: 'System',
    },
    comprobanteSize: {
        fontSize: 11,
        color: '#94a3b8',
        marginTop: 2,
        fontFamily: 'System',
    },
    removerButton: {
        backgroundColor: '#E74C3C',
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    removerButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold' as any,
        fontFamily: 'System',
    },
    fileButton: {
        backgroundColor: "#f8f9fa",
        borderRadius: 12,
        padding: 20,
        borderWidth: 1.5,
        borderColor: "#e5e7eb",
        borderStyle: "dashed",
        alignItems: "center",
        marginBottom: 16,
    },
    fileButtonIcon: {
        fontSize: 28,
        marginBottom: 10,
    },
    fileButtonText: {
        fontSize: 14,
        color: "#1e293b",
        fontWeight: "600" as any,
        fontFamily: "System",
        textAlign: 'center',
    },
    fileButtonSubtext: {
        fontSize: 12,
        color: "#64748b",
        marginTop: 4,
        fontFamily: "System",
        textAlign: 'center',
    },

    primaryPremiumButton: {
        backgroundColor: '#FF6B35',
        borderRadius: 14,
        paddingVertical: 16,
        shadowColor: '#FF6B35',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    secondaryPremiumButton: {
        backgroundColor: 'white',
        borderRadius: 14,
        paddingVertical: 16,
        borderWidth: 1.5,
        borderColor: '#FF6B35',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    dangerPremiumButton: {
        backgroundColor: '#E74C3C',
        borderRadius: 14,
        paddingVertical: 16,
        shadowColor: '#E74C3C',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
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
    },
    primaryPremiumButtonIcon: {
        fontSize: 18,
        color: 'white',
        marginRight: 10,
    },
    primaryPremiumButtonText: {
        fontSize: 16,
        fontWeight: '700' as any,
        color: 'white',
        fontFamily: 'System',
    },
    secondaryPremiumButtonIcon: {
        fontSize: 18,
        color: '#FF6B35',
        marginRight: 10,
    },
    secondaryPremiumButtonText: {
        fontSize: 16,
        fontWeight: '700' as any,
        color: '#FF6B35',
        fontFamily: 'System',
    },
    dangerPremiumButtonIcon: {
        fontSize: 18,
        color: 'white',
        marginRight: 10,
    },
    dangerPremiumButtonText: {
        fontSize: 16,
        fontWeight: '700' as any,
        color: 'white',
        fontFamily: 'System',
    },

    footer: {
        backgroundColor: "white",
        borderRadius: 20,
        padding: 24,
        marginHorizontal: 16,
        marginBottom: 20,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 6,
        borderWidth: 1,
        borderColor: "#f1f5f9",
        position: 'relative',
        overflow: 'hidden',
    },
    footerContent: {
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
        marginBottom: 16,
        zIndex: 1,
    },
    footerIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: "#FF6B35",
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 4,
    },
    footerIcon: {
        fontSize: 24,
        color: "white",
    },
    footerTitle: {
        fontSize: 14,
        color: "#64748b",
        fontWeight: "500" as any,
        fontFamily: "System",
        marginBottom: 4,
    },
    footerBrand: {
        fontSize: 20,
        fontWeight: "700" as any,
        color: "#FF6B35",
        fontFamily: "System",
    },
    footerSubtitle: {
        fontSize: 14,
        color: "#94a3b8",
        textAlign: "center",
        marginBottom: 16,
        fontFamily: "System",
        lineHeight: 20,
    },
    versionContainer: {
        alignItems: "center",
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: "#f1f5f9",
        width: '100%',
    },
    versionText: {
        fontSize: 12,
        color: "#94a3b8",
        fontWeight: "500" as any,
        fontFamily: "System",
        textAlign: 'center',
    },
    versionSubtext: {
        fontSize: 11,
        color: "#cbd5e1",
        marginTop: 4,
        fontFamily: "System",
        textAlign: 'center',
    },
});