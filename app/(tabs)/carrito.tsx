import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useCarrito } from "../context/CarritoContext";

export default function Carrito() {
    const router = useRouter();
    const { items, actualizarCantidad, eliminarItem, loading } = useCarrito();

    const [subtotal, setSubtotal] = useState(0);
    const [iva, setIVA] = useState(0);
    const [total, setTotal] = useState(0);
    const [processingCheckout, setProcessingCheckout] = useState(false);

    // Calcular totales
    useEffect(() => {
        const sub = items.reduce(
            (acc, item) => acc + item.precioProducto * item.cantidad,
            0
        );
        const ivaCalc = sub * 0.12;
        setSubtotal(sub);
        setIVA(ivaCalc);
        setTotal(sub + ivaCalc);
    }, [items]);

    const handleVaciarCarrito = () => {
        Alert.alert(
            "Vaciar Carrito",
            "¿Estás seguro de que deseas vaciar el carrito?",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Vaciar",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            for (const item of items) {
                                await eliminarItem(item.idCarrito);
                            }
                        } catch (error) {
                            Alert.alert("Error", "No se pudo vaciar el carrito");
                        }
                    },
                },
            ]
        );
    };

    const handleEliminar = (idCarrito: number) => {
        Alert.alert(
            "Eliminar Producto",
            "¿Estás seguro de que deseas eliminar este producto del carrito?",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Eliminar",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await eliminarItem(idCarrito);
                        } catch (error) {
                            Alert.alert("Error", "No se pudo eliminar el producto");
                        }
                    },
                },
            ]
        );
    };

    const realizarCheckout = () => {
    if (!items || items.length === 0) {
        Alert.alert("Carrito vacío", "Agrega productos antes de continuar");
        return;
    }

    // Redirigir al CheckoutUnificado
    router.push("/consumidor/CheckoutUnificado" as any);
};

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#5A8F48" />
                <Text style={styles.loadingText}>Cargando carrito...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerEmoji}>🛒</Text>
                <Text style={styles.headerTitle}>Mi Carrito</Text>
                <Text style={styles.headerSubtitle}>
                    Revisa tus productos antes de finalizar
                </Text>
            </View>

            {items.length === 0 ? (
                // Carrito vacío
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyEmoji}>🛒</Text>
                    <Text style={styles.emptyTitle}>Tu carrito está vacío</Text>
                    <Text style={styles.emptySubtitle}>
                        ¡Explora nuestros productos y añade tus favoritos!
                    </Text>
                    <TouchableOpacity
                        style={styles.exploreButton}
                        onPress={() => router.push("/(tabs)/explorar" as any)}
                    >
                        <Text style={styles.exploreButtonText}>Explorar Productos</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                    {/* Productos */}
                    <View style={styles.productosSection}>
                        <View style={styles.productosHeader}>
                            <View>
                                <Text style={styles.productosTitle}>Productos</Text>
                                <Text style={styles.productosCount}>
                                    {items.length} {items.length === 1 ? "producto" : "productos"}
                                </Text>
                            </View>
                            {items.length > 0 && (
                                <TouchableOpacity
                                    style={styles.vaciarButton}
                                    onPress={handleVaciarCarrito}
                                >
                                    <Text style={styles.vaciarButtonText}>🗑️ Vaciar</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {items.map((item) => (
                            <View key={item.idCarrito} style={styles.productoCard}>
                                <Image
                                    source={{ uri: item.imagenProducto }}
                                    style={styles.productoImagen}
                                />

                                <View style={styles.productoInfo}>
                                    <Text style={styles.productoNombre} numberOfLines={2}>
                                        {item.nombreProducto}
                                    </Text>

                                    <Text style={styles.productoPrecio}>
                                        ${item.precioProducto.toFixed(2)}
                                    </Text>

                                    <View style={styles.cantidadControls}>
                                        <TouchableOpacity
                                            style={styles.cantidadButton}
                                            onPress={() =>
                                                actualizarCantidad(item.idCarrito, item.cantidad - 1)
                                            }
                                        >
                                            <Text style={styles.cantidadButtonText}>−</Text>
                                        </TouchableOpacity>

                                        <Text style={styles.cantidadText}>{item.cantidad}</Text>

                                        <TouchableOpacity
                                            style={styles.cantidadButton}
                                            onPress={() =>
                                                actualizarCantidad(item.idCarrito, item.cantidad + 1)
                                            }
                                        >
                                            <Text style={styles.cantidadButtonText}>+</Text>
                                        </TouchableOpacity>
                                    </View>

                                    <Text style={styles.productoSubtotal}>
                                        Subtotal: ${(item.precioProducto * item.cantidad).toFixed(2)}
                                    </Text>
                                </View>

                                <TouchableOpacity
                                    style={styles.eliminarButton}
                                    onPress={() => handleEliminar(item.idCarrito)}
                                >
                                    <Text style={styles.eliminarButtonText}>✕</Text>
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>

                    {/* Resumen */}
                    <View style={styles.resumenCard}>
                        <Text style={styles.resumenTitle}>📋 Resumen de Compra</Text>

                        <View style={styles.resumenRow}>
                            <Text style={styles.resumenLabel}>Subtotal</Text>
                            <Text style={styles.resumenValue}>${subtotal.toFixed(2)}</Text>
                        </View>

                        <View style={styles.resumenRow}>
                            <Text style={styles.resumenLabel}>IVA (12%)</Text>
                            <Text style={styles.resumenValue}>${iva.toFixed(2)}</Text>
                        </View>

                        <View style={styles.resumenDivider} />

                        <View style={styles.resumenTotal}>
                            <Text style={styles.resumenTotalLabel}>Total</Text>
                            <Text style={styles.resumenTotalValue}>${total.toFixed(2)}</Text>
                        </View>

                        <TouchableOpacity
                            style={[
                                styles.checkoutButton,
                                processingCheckout && styles.checkoutButtonDisabled
                            ]}
                            onPress={realizarCheckout}
                            disabled={processingCheckout}
                        >
                            {processingCheckout ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.checkoutButtonText}>🛒 Finalizar Compra</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.seguirButton}
                            onPress={() => router.push("/(tabs)/explorar" as any)}
                        >
                            <Text style={styles.seguirButtonText}>← Seguir Comprando</Text>
                        </TouchableOpacity>

                        {/* Info adicional */}
                        <View style={styles.infoCard}>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoIcon}>✓</Text>
                                <Text style={styles.infoText}>Compra segura y protegida</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoIcon}>✓</Text>
                                <Text style={styles.infoText}>Productos frescos y orgánicos</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoIcon}>✓</Text>
                                <Text style={styles.infoText}>Envío coordinado con el vendedor</Text>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F9FBF7",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#F9FBF7",
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: "#5A8F48",
        fontWeight: "600",
    },
    header: {
        backgroundColor: "white",
        paddingTop: 60,
        paddingBottom: 30,
        paddingHorizontal: 20,
        alignItems: "center",
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    headerEmoji: {
        fontSize: 56,
        marginBottom: 12,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: "800",
        color: "#2D3E2B",
        marginBottom: 8,
    },
    headerSubtitle: {
        fontSize: 14,
        color: "#6B7F69",
        textAlign: "center",
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 40,
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
    scrollView: {
        flex: 1,
    },
    productosSection: {
        padding: 20,
    },
    productosHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },
    productosTitle: {
        fontSize: 24,
        fontWeight: "800",
        color: "#2D3E2B",
    },
    productosCount: {
        fontSize: 14,
        color: "#6B7F69",
        marginTop: 4,
    },
    vaciarButton: {
        backgroundColor: "#FFF0F2",
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: "#DA3E52",
    },
    vaciarButtonText: {
        color: "#DA3E52",
        fontSize: 14,
        fontWeight: "700",
    },
    productoCard: {
        flexDirection: "row",
        backgroundColor: "white",
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 2,
        borderColor: "#ECF2E3",
    },
    productoImagen: {
        width: 100,
        height: 100,
        borderRadius: 12,
    },
    productoInfo: {
        flex: 1,
        marginLeft: 16,
    },
    productoNombre: {
        fontSize: 16,
        fontWeight: "700",
        color: "#2D3E2B",
        marginBottom: 6,
    },
    productoPrecio: {
        fontSize: 16,
        fontWeight: "700",
        color: "#5A8F48",
        marginBottom: 12,
    },
    cantidadControls: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginBottom: 8,
    },
    cantidadButton: {
        width: 32,
        height: 32,
        backgroundColor: "#5A8F48",
        borderRadius: 8,
        justifyContent: "center",
        alignItems: "center",
    },
    cantidadButtonText: {
        color: "white",
        fontSize: 18,
        fontWeight: "700",
    },
    cantidadText: {
        fontSize: 16,
        fontWeight: "700",
        minWidth: 30,
        textAlign: "center",
    },
    productoSubtotal: {
        fontSize: 14,
        fontWeight: "700",
        color: "#2D3E2B",
    },
    eliminarButton: {
        width: 36,
        height: 36,
        backgroundColor: "#DA3E52",
        borderRadius: 8,
        justifyContent: "center",
        alignItems: "center",
    },
    eliminarButtonText: {
        color: "white",
        fontSize: 18,
        fontWeight: "700",
    },
    resumenCard: {
        backgroundColor: "white",
        borderRadius: 20,
        padding: 24,
        margin: 20,
        marginTop: 0,
    },
    resumenTitle: {
        fontSize: 20,
        fontWeight: "800",
        color: "#2D3E2B",
        marginBottom: 20,
    },
    resumenRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    resumenLabel: {
        fontSize: 15,
        color: "#6B7F69",
        fontWeight: "600",
    },
    resumenValue: {
        fontSize: 16,
        fontWeight: "700",
        color: "#2D3E2B",
    },
    resumenDivider: {
        height: 1,
        backgroundColor: "#ECF2E3",
        marginVertical: 16,
    },
    resumenTotal: {
        backgroundColor: "#F9FBF7",
        padding: 16,
        borderRadius: 12,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },
    resumenTotalLabel: {
        fontSize: 18,
        fontWeight: "800",
        color: "#2D3E2B",
    },
    resumenTotalValue: {
        fontSize: 28,
        fontWeight: "900",
        color: "#5A8F48",
    },
    checkoutButton: {
        backgroundColor: "#5A8F48",
        paddingVertical: 18,
        borderRadius: 14,
        alignItems: "center",
        marginBottom: 12,
    },
    checkoutButtonDisabled: {
        backgroundColor: "#A5C9A0",
    },
    checkoutButtonText: {
        color: "white",
        fontSize: 17,
        fontWeight: "800",
    },
    seguirButton: {
        backgroundColor: "white",
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: "center",
        borderWidth: 2,
        borderColor: "#5A8F48",
        marginBottom: 20,
    },
    seguirButtonText: {
        color: "#5A8F48",
        fontSize: 15,
        fontWeight: "700",
    },
    infoCard: {
        backgroundColor: "#F9FBF7",
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#ECF2E3",
    },
    infoRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },
    infoIcon: {
        fontSize: 14,
        marginRight: 8,
        color: "#5A8F48",
    },
    infoText: {
        fontSize: 13,
        color: "#6B7F69",
    },
});