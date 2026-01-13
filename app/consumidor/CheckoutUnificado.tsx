import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
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

export default function CheckoutUnificado() {
    const router = useRouter();
    const { items, eliminarItem } = useCarrito();

    const [metodoPago, setMetodoPago] = useState("EFECTIVO");
    const [montoEfectivo, setMontoEfectivo] = useState("");
    const [comprobante, setComprobante] = useState<any>(null);
    const [numTarjeta, setNumTarjeta] = useState("");
    const [cvv, setCvv] = useState("");
    const [fechaTarjeta, setFechaTarjeta] = useState("");
    const [titular, setTitular] = useState("");
    const [procesando, setProcesando] = useState(false);

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
            // Solicitar permisos para acceder a la galería
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            
            if (status !== 'granted') {
                Alert.alert('Permiso necesario', 'Se necesita acceso a la galería para subir comprobantes');
                return;
            }

            // Mostrar opciones al usuario
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
                // Convertir coma decimal a punto decimal
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
            
            // Validar tamaño máximo (5MB)
            if (comprobante.fileSize && comprobante.fileSize > 5 * 1024 * 1024) {
                Alert.alert("Error", "El archivo es muy grande. Máximo 5MB");
                return false;
            }
            
            // Validar tipo de archivo
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
        
        // Intenta diferentes endpoints y estructuras
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
                    
                    // Si es 403, podría ser problema de permisos
                    if (response.status === 403) {
                        console.log("⚠️ Error 403 - Problema de permisos");
                        // Continuar con el siguiente endpoint
                        continue;
                    }
                    
                    // Si es 400, podría ser estructura incorrecta
                    if (response.status === 400) {
                        console.log("⚠️ Error 400 - Estructura incorrecta");
                        continue;
                    }
                    
                    // Si no es 200, lanzar error
                    if (response.status !== 200) {
                        throw new Error(`Error ${response.status}: ${errorText}`);
                    }
                }
            } catch (error) {
                console.error(`❌ Error en endpoint ${endpoint.name}:`, error);
                // Continuar con el siguiente endpoint
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
                { text: "Iniciar Sesión", onPress: () => router.push("/login" as any) },
            ]);
            return;
        }

        // Confirmación
        let confirmar;
        if (metodoPago === "EFECTIVO") {
            confirmar = await new Promise((resolve) => {
                Alert.alert(
                    "⚠️ IMPORTANTE - Pago en Efectivo",
                    `• Total a pagar: $${total.toFixed(2).replace('.', ',')}\n` +
                    `• Pagarás al recibir el pedido\n` +
                    `• Una vez confirmado, NO PODRÁS CANCELAR\n` +
                    `• El vendedor preparará tu pedido de inmediato\n\n` +
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
                    "Confirmar pedido",
                    `¿Confirmar compra por $${total.toFixed(2).replace('.', ',')} con ${metodoPago}?`,
                    [
                        { text: "Cancelar", onPress: () => resolve(false), style: "cancel" },
                        { text: "Confirmar", onPress: () => resolve(true), style: "default" },
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
                
                // Convertir coma decimal a punto decimal
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
                `Tu pedido #${pedidoUnico.idPedido} ha sido procesado correctamente.`,
                [
                    {
                        text: "Ver Pedido",
                        onPress: () => {
                            router.push(`/consumidor/Pedido?id=${pedidoUnico.idPedido}` as any);
                        },
                    },
                    {
                        text: "Volver al Inicio",
                        onPress: () => {
                            router.push("/(tabs)/explorar" as any);
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
                <Text style={styles.emptyEmoji}>🛒</Text>
                <Text style={styles.emptyTitle}>Tu carrito está vacío</Text>
                <Text style={styles.emptySubtitle}>
                    Agrega productos antes de finalizar la compra
                </Text>
                <TouchableOpacity
                    style={styles.exploreButton}
                    onPress={() => router.push("/(tabs)/explorar" as any)}
                >
                    <Text style={styles.exploreButtonText}>Explorar Productos</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Text style={styles.backButtonText}>← Volver al carrito</Text>
                </TouchableOpacity>

                <View style={styles.headerCard}>
                    <View style={styles.headerLeft}>
                        <View style={styles.iconContainer}>
                            <Text style={styles.iconText}>🛒</Text>
                        </View>
                        <View>
                            <Text style={styles.pedidoTitle}>Finalizar Compra</Text>
                            <Text style={styles.fechaText}>
                                {items.length} {items.length === 1 ? "producto" : "productos"}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Productos */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>📦 Productos en tu pedido</Text>
                {items.map((item, index) => (
                    <View key={index} style={styles.productoCard}>
                        <Image
                            source={{ uri: item.imagenProducto }}
                            style={styles.productoImage}
                        />
                        <View style={styles.productoInfo}>
                            <Text style={styles.productoNombre}>
                                {item.nombreProducto}
                            </Text>
                            <Text style={styles.productoDetalle}>
                                Cantidad: {item.cantidad} • ${item.precioProducto.toFixed(2).replace('.', ',')} c/u
                            </Text>
                        </View>
                        <Text style={styles.productoSubtotal}>
                            ${(item.precioProducto * item.cantidad).toFixed(2).replace('.', ',')}
                        </Text>
                    </View>
                ))}
            </View>

            {/* Resumen */}
            <View style={styles.resumenCard}>
                <Text style={styles.sectionTitle}>💰 Resumen de compra</Text>
                
                <View style={styles.resumenRow}>
                    <Text style={styles.resumenLabel}>Subtotal</Text>
                    <Text style={styles.resumenValue}>${subtotal.toFixed(2).replace('.', ',')}</Text>
                </View>
                
                <View style={styles.resumenRow}>
                    <Text style={styles.resumenLabel}>IVA (12%)</Text>
                    <Text style={styles.resumenValue}>${iva.toFixed(2).replace('.', ',')}</Text>
                </View>
                
                <View style={styles.divider} />
                
                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalValue}>${total.toFixed(2).replace('.', ',')}</Text>
                </View>
            </View>

            {/* Método de Pago */}
            <View style={styles.pagoSection}>
                <Text style={styles.sectionTitle}>💳 Método de pago</Text>
                
                <View style={styles.metodosPago}>
                    {["EFECTIVO", "TRANSFERENCIA", "TARJETA"].map((metodo) => (
                        <TouchableOpacity
                            key={metodo}
                            style={[
                                styles.metodoButton,
                                metodoPago === metodo && styles.metodoButtonActive,
                            ]}
                            onPress={() => {
                                setMetodoPago(metodo);
                                // Limpiar comprobante si cambiamos de método
                                if (metodo !== "TRANSFERENCIA") {
                                    setComprobante(null);
                                }
                            }}
                        >
                            <Text
                                style={[
                                    styles.metodoButtonText,
                                    metodoPago === metodo && styles.metodoButtonTextActive,
                                ]}
                            >
                                {metodo === "EFECTIVO" && "💵 Efectivo"}
                                {metodo === "TRANSFERENCIA" && "🏦 Transferencia"}
                                {metodo === "TARJETA" && "💳 Tarjeta"}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Formularios según método de pago */}
                {metodoPago === "EFECTIVO" && (
                    <View style={styles.formContainer}>
                        <View style={styles.alertBox}>
                            <Text style={styles.alertText}>
                                💵 <Text style={styles.alertTextBold}>Pago contra entrega</Text>
                                {"\n"}Pagarás <Text style={styles.alertTextBold}>${total.toFixed(2).replace('.', ',')}</Text> en efectivo cuando recibas tu pedido.
                            </Text>
                        </View>
                        
                        <Text style={styles.inputLabel}>Monto que entregarás (opcional):</Text>
                        <View style={styles.inputContainer}>
                            <Text style={styles.currencySymbol}>$</Text>
                            <TextInput
                                style={styles.inputWithSymbol}
                                placeholder={`Ej: ${(total + 1).toFixed(2).replace('.', ',')}`}
                                placeholderTextColor="#94a3b8"
                                keyboardType="decimal-pad"
                                value={montoEfectivo}
                                onChangeText={(text) => {
                                    // Permitir números, coma y punto
                                    const cleaned = text.replace(/[^0-9,.]/g, '');
                                    // Reemplazar punto por coma si el usuario lo pone
                                    const formatted = cleaned.replace('.', ',');
                                    setMontoEfectivo(formatted);
                                }}
                            />
                            <TouchableOpacity 
                                style={styles.sugerenciaButton}
                                onPress={() => {
                                    // Sugerir un monto redondeado
                                    const sugerido = Math.ceil(total) + 1;
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
                                            <Text style={styles.errorText}>❌ Monto inválido</Text>
                                        );
                                    } else if (montoNum < total) {
                                        return (
                                            <Text style={styles.errorText}>
                                                ❌ Faltan ${(total - montoNum).toFixed(2).replace('.', ',')}
                                            </Text>
                                        );
                                    } else {
                                        return (
                                            <Text style={styles.cambioText}>
                                                ✓ Cambio: ${(montoNum - total).toFixed(2).replace('.', ',')}
                                            </Text>
                                        );
                                    }
                                })()}
                            </View>
                        )}
                        
                        <Text style={styles.ayudaText}>
                            ⓘ Si no ingresas un monto, se asumirá que pagarás el total exacto (${total.toFixed(2).replace('.', ',')})
                        </Text>
                    </View>
                )}

                {metodoPago === "TRANSFERENCIA" && (
                    <View style={styles.formContainer}>
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
                    </View>
                )}

                {metodoPago === "TARJETA" && (
                    <View style={styles.formContainer}>
                        <Text style={styles.inputLabel}>Número de tarjeta:</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="0000 0000 0000 0000"
                            placeholderTextColor="#94a3b8"
                            keyboardType="number-pad"
                            maxLength={19}
                            value={numTarjeta}
                            onChangeText={(text) =>
                                setNumTarjeta(
                                    text
                                        .replace(/\s/g, "")
                                        .replace(/(\d{4})/g, "$1 ")
                                        .trim()
                                )
                            }
                        />

                        <View style={styles.row}>
                            <View style={styles.halfInput}>
                                <Text style={styles.inputLabel}>CVV:</Text>
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
                            <View style={styles.halfInput}>
                                <Text style={styles.inputLabel}>Expiración (MM/AA):</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="12/25"
                                    placeholderTextColor="#94a3b8"
                                    value={fechaTarjeta}
                                    onChangeText={(text) => {
                                        // Formato automático MM/AA
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

                        <Text style={styles.inputLabel}>Titular:</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Nombre completo como aparece en la tarjeta"
                            placeholderTextColor="#94a3b8"
                            value={titular}
                            onChangeText={setTitular}
                        />
                        
                        <Text style={styles.ayudaText}>
                            ⓘ Los datos de tarjeta se procesan de forma segura.
                        </Text>
                    </View>
                )}

                {/* Botón finalizar */}
                <TouchableOpacity
                    style={[styles.finalizarButton, procesando && styles.finalizarButtonDisabled]}
                    onPress={finalizarCompra}
                    disabled={procesando}
                >
                    {procesando ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.finalizarButtonText}>
                            ✔ Finalizar Compra - ${total.toFixed(2).replace('.', ',')}
                        </Text>
                    )}
                </TouchableOpacity>
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
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f8f9fa",
        padding: 20,
    },
    emptyEmoji: {
        fontSize: 80,
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: "700",
        color: "#2D3E2B",
        marginBottom: 12,
    },
    emptySubtitle: {
        fontSize: 16,
        color: "#6B7F69",
        textAlign: "center",
        marginBottom: 30,
    },
    exploreButton: {
        backgroundColor: "#5A8F48",
        paddingVertical: 16,
        paddingHorizontal: 40,
        borderRadius: 12,
    },
    exploreButtonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "700",
    },
    header: {
        backgroundColor: "white",
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    backButton: {
        marginBottom: 16,
    },
    backButtonText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#5A8F48",
    },
    headerCard: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 12,
    },
    headerLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        flex: 1,
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 12,
        backgroundColor: "#5A8F48",
        justifyContent: "center",
        alignItems: "center",
    },
    iconText: {
        fontSize: 24,
    },
    pedidoTitle: {
        fontSize: 24,
        fontWeight: "700",
        color: "#2D3E2B",
    },
    fechaText: {
        fontSize: 12,
        color: "#6B7F69",
        marginTop: 4,
    },
    section: {
        backgroundColor: "white",
        marginTop: 16,
        marginHorizontal: 20,
        padding: 20,
        borderRadius: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#2D3E2B",
        marginBottom: 16,
    },
    productoCard: {
        flexDirection: "row",
        backgroundColor: "#F9FBF7",
        padding: 12,
        borderRadius: 12,
        marginBottom: 12,
        alignItems: "center",
        gap: 12,
    },
    productoImage: {
        width: 60,
        height: 60,
        borderRadius: 8,
    },
    productoInfo: {
        flex: 1,
    },
    productoNombre: {
        fontSize: 14,
        fontWeight: "600",
        color: "#2D3E2B",
        marginBottom: 4,
    },
    productoDetalle: {
        fontSize: 12,
        color: "#6B7F69",
    },
    productoSubtotal: {
        fontSize: 16,
        fontWeight: "700",
        color: "#5A8F48",
    },
    resumenCard: {
        backgroundColor: "#F9D94A",
        marginTop: 16,
        marginHorizontal: 20,
        padding: 20,
        borderRadius: 16,
    },
    resumenRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 12,
    },
    resumenLabel: {
        fontSize: 14,
        color: "#2D3E2B",
    },
    resumenValue: {
        fontSize: 14,
        fontWeight: "600",
        color: "#2D3E2B",
    },
    divider: {
        height: 2,
        backgroundColor: "rgba(45, 62, 43, 0.2)",
        marginVertical: 12,
    },
    totalRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: "700",
        color: "#2D3E2B",
    },
    totalValue: {
        fontSize: 28,
        fontWeight: "900",
        color: "#2D3E2B",
    },
    pagoSection: {
        backgroundColor: "white",
        marginTop: 16,
        marginHorizontal: 20,
        padding: 20,
        borderRadius: 16,
    },
    metodosPago: {
        flexDirection: "row",
        gap: 8,
        marginBottom: 16,
    },
    metodoButton: {
        flex: 1,
        backgroundColor: "#f8f9fa",
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: "center",
        borderWidth: 2,
        borderColor: "#e5e7eb",
    },
    metodoButtonActive: {
        backgroundColor: "#5A8F48",
        borderColor: "#5A8F48",
    },
    metodoButtonText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#6B7F69",
    },
    metodoButtonTextActive: {
        color: "white",
    },
    formContainer: {
        marginTop: 16,
    },
    alertBox: {
        backgroundColor: "#FFF3CD",
        borderWidth: 2,
        borderColor: "#FFC107",
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
    },
    alertText: {
        fontSize: 14,
        color: "#856404",
        lineHeight: 20,
    },
    alertTextBold: {
        fontWeight: "700",
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: "600",
        color: "#2D3E2B",
        marginBottom: 8,
    },
    input: {
        backgroundColor: "#f8f9fa",
        borderRadius: 10,
        padding: 12,
        fontSize: 14,
        color: "#2D3E2B",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        marginBottom: 12,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },
    currencySymbol: {
        fontSize: 16,
        fontWeight: "600",
        color: "#2D3E2B",
        marginRight: 8,
    },
    inputWithSymbol: {
        flex: 1,
        backgroundColor: "#f8f9fa",
        borderRadius: 10,
        padding: 12,
        fontSize: 14,
        color: "#2D3E2B",
        borderWidth: 1,
        borderColor: "#e5e7eb",
    },
    sugerenciaButton: {
        backgroundColor: "#ECF2E3",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        marginLeft: 8,
        borderWidth: 1,
        borderColor: "#5A8F48",
    },
    sugerenciaButtonText: {
        color: "#5A8F48",
        fontSize: 12,
        fontWeight: "600",
    },
    cambioContainer: {
        backgroundColor: "#FAFBF9",
        padding: 10,
        borderRadius: 8,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#F0F4ED",
    },
    cambioLabel: {
        fontSize: 12,
        fontWeight: "600",
        color: "#6B7F69",
        marginBottom: 4,
    },
    cambioText: {
        fontSize: 14,
        color: "#5A8F48",
        fontWeight: "600",
    },
    errorText: {
        fontSize: 14,
        color: "#DA3E52",
        fontWeight: "600",
    },
    ayudaText: {
        fontSize: 11,
        color: "#94a3b8",
        fontStyle: "italic",
        marginTop: 4,
    },
    // Estilos para comprobante
    comprobanteSeleccionado: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F4ED',
        padding: 12,
        borderRadius: 10,
        marginBottom: 12,
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
        fontSize: 24,
    },
    comprobanteInfo: {
        flex: 1,
    },
    comprobanteNombre: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2D3E2B',
    },
    comprobanteTipo: {
        fontSize: 12,
        color: '#6B7F69',
        marginTop: 2,
    },
    comprobanteSize: {
        fontSize: 11,
        color: '#94a3b8',
        marginTop: 2,
    },
    removerButton: {
        backgroundColor: '#DA3E52',
        width: 30,
        height: 30,
        borderRadius: 15,
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
        borderRadius: 10,
        padding: 20,
        borderWidth: 2,
        borderColor: "#e5e7eb",
        borderStyle: "dashed",
        alignItems: "center",
        marginBottom: 12,
    },
    fileButtonIcon: {
        fontSize: 32,
        marginBottom: 8,
    },
    fileButtonText: {
        fontSize: 14,
        color: "#6B7F69",
        fontWeight: "600",
    },
    fileButtonSubtext: {
        fontSize: 11,
        color: "#94a3b8",
        marginTop: 4,
    },
    row: {
        flexDirection: "row",
        gap: 12,
    },
    halfInput: {
        flex: 1,
    },
    finalizarButton: {
        backgroundColor: "#5A8F48",
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: "center",
        marginTop: 20,
    },
    finalizarButtonDisabled: {
        backgroundColor: "#98A598",
    },
    finalizarButtonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "700",
    },
});