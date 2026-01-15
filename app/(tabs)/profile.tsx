import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { API_CONFIG } from "../../config";

interface Perfil {
  nombre: string;
  apellido: string;
  correo: string;
  fechaNacimiento?: string;
  fechaRegistro?: string;
  estado: string;
  rol: string;
  esAdministrador?: boolean;
  // Consumidor
  direccionConsumidor?: string;
  telefonoConsumidor?: string;
  cedulaConsumidor?: string;
  // Vendedor
  nombreEmpresa?: string;
  rucEmpresa?: string;
  direccionEmpresa?: string;
  telefonoEmpresa?: string;
  calificacionPromedio?: number;
}

export default function Profile() {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    cargarPerfil();
  }, []);

  const cargarPerfil = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      
      if (!token) {
        // Redirigir a WelcomeScreen
        console.log("🔐 No hay token, redirigiendo a WelcomeScreen");
        router.replace("/WelcomeScreen");
        return;
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}/usuarios/perfil`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al cargar perfil");
      }

      const data = await response.json();
      setPerfil(data);
    } catch (error) {
      console.error("❌ Error al cargar perfil:", error);
      // Redirigir a WelcomeScreen en caso de error
      router.replace("/WelcomeScreen");
    } finally {
      setLoading(false);
    }
  };

  // Función para cerrar sesión - CORREGIDA
  const handleLogout = async () => {
    Alert.alert(
      "Cerrar sesión",
      "¿Estás seguro de que quieres cerrar sesión?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Cerrar sesión",
          style: "destructive",
          onPress: async () => {
            try {
              // Limpiar TODOS los datos de sesión
              await AsyncStorage.multiRemove([
                "authToken", 
                "user", 
                "token", 
                "rol", 
                "idUsuario",
                "idVendedor", 
                "idConsumidor",
                "isGuest",         
                "guestCart",      
                "guestLoginTime",  
                "searchCategory"   
              ]);
              
              console.log("✅ Sesión cerrada exitosamente");
              
              
              router.replace("/WelcomeScreen");
              
            } catch (error) {
              console.log("❌ Error al cerrar sesión:", error);
              Alert.alert("Error", "No se pudo cerrar sesión. Intenta nuevamente.");
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5A8F48" />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </View>
    );
  }

  if (!perfil) return null;

  const InfoItem = ({ label, value }: { label: string; value?: string }) => (
    <View style={styles.infoItem}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || "N/A"}</Text>
    </View>
  );

  const ActionButton = ({
    children,
    onPress,
    variant = "primary",
    icon,
  }: {
    children: string;
    onPress: () => void;
    variant?: "primary" | "secondary";
    icon: string;
  }) => {
    const isPrimary = variant === "primary";

    return (
      <TouchableOpacity
        style={[
          styles.actionButton,
          isPrimary ? styles.actionButtonPrimary : styles.actionButtonSecondary,
        ]}
        onPress={onPress}
      >
        <Text style={styles.actionButtonIcon}>{icon}</Text>
        <Text
          style={[
            styles.actionButtonText,
            isPrimary
              ? styles.actionButtonTextPrimary
              : styles.actionButtonTextSecondary,
          ]}
        >
          {children}
        </Text>
      </TouchableOpacity>
    );
  };

  // Botón de cerrar sesión
  const LogoutButton = () => (
    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
      <Text style={styles.logoutIcon}>🚪</Text>
      <Text style={styles.logoutText}>Cerrar sesión</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {perfil.nombre?.charAt(0)}
            {perfil.apellido?.charAt(0)}
          </Text>
        </View>

        <Text style={styles.headerLabel}>Información del usuario</Text>

        <Text style={styles.headerName}>
          {perfil.nombre} {perfil.apellido}
        </Text>

        <View style={styles.statusContainer}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>{perfil.estado}</Text>
        </View>

        {/* Badges */}
        <View style={styles.badgesContainer}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {perfil.rol === "CONSUMIDOR" && "🛒 "}
              {perfil.rol === "VENDEDOR" && "🏪 "}
              {perfil.rol === "ADMIN" && "🛡️ "}
              {perfil.rol}
            </Text>
          </View>

          {perfil.esAdministrador && (
            <View style={[styles.badge, styles.badgeAdmin]}>
              <Text style={styles.badgeAdminText}>⚙️ Permisos Admin</Text>
            </View>
          )}

          <View style={[styles.badge, styles.badgeDate]}>
            <Text style={styles.badgeDateText}>
              📅 Miembro desde {perfil.fechaRegistro?.split("T")[0]}
            </Text>
          </View>
        </View>
      </View>

      {/* Acciones rápidas */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Acciones disponibles</Text>
        <Text style={styles.cardTitle}>⚡ Acciones Rápidas</Text>

        <View style={styles.actionsGrid}>
          {perfil.rol === "CONSUMIDOR" && (
            <>
              <ActionButton
                onPress={() => router.push("/consumidor/EditarPerfil")}
                icon="✏️"
              >
                Editar perfil
              </ActionButton>
              <ActionButton
                onPress={() => router.push("/(tabs)/Favoritos")}
                variant="secondary"
                icon="❤️"
              >
                Ver favoritos
              </ActionButton>
              <ActionButton
                onPress={() => router.push("/consumidor/MisPedidos")}
                variant="secondary"
                icon="📦"
              >
                Mis pedidos
              </ActionButton>
            </>
          )}

          {perfil.rol === "VENDEDOR" && (
            <>
              <ActionButton
                onPress={() => router.push("/editar-empresa" as any)}
                icon="✏️"
              >
                Editar empresa
              </ActionButton>
              <ActionButton
                onPress={() => router.push("/vendedor/pedidos" as any)}
                variant="secondary"
                icon="📊"
              >
                Gestionar pedidos
              </ActionButton>
              <ActionButton
                onPress={() => router.push("/vendedor/resenas" as any)}
                variant="secondary"
                icon="⭐"
              >
                Ver reseñas
              </ActionButton>
            </>
          )}

          {perfil.rol === "ADMIN" && (
            <>
              <ActionButton
                onPress={() => router.push("/admin" as any)}
                icon="⚙️"
              >
                Panel Admin
              </ActionButton>
              <ActionButton
                onPress={() => router.push("/usuarios" as any)}
                variant="secondary"
                icon="👥"
              >
                Gestionar usuarios
              </ActionButton>
            </>
          )}
        </View>
      </View>

      {/* Datos Personales */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Información personal</Text>
        <Text style={styles.cardTitle}>📄 Datos Personales</Text>

        <InfoItem label="Correo electrónico" value={perfil.correo} />
        <InfoItem label="Fecha de nacimiento" value={perfil.fechaNacimiento} />
        <InfoItem
          label="Fecha de registro"
          value={perfil.fechaRegistro?.split("T")[0]}
        />
      </View>

      {/* Datos específicos por rol */}
      {perfil.rol === "CONSUMIDOR" && (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Perfil de comprador</Text>
          <Text style={styles.cardTitle}>🛒 Datos de Consumidor</Text>

          <InfoItem label="Dirección" value={perfil.direccionConsumidor} />
          <InfoItem label="Teléfono" value={perfil.telefonoConsumidor} />
          <InfoItem label="Cédula" value={perfil.cedulaConsumidor} />
        </View>
      )}

      {perfil.rol === "VENDEDOR" && (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Información comercial</Text>
          <Text style={styles.cardTitle}>🏪 Datos de la Empresa</Text>

          <InfoItem label="Nombre de la empresa" value={perfil.nombreEmpresa} />
          <InfoItem label="RUC" value={perfil.rucEmpresa} />
          <InfoItem label="Dirección" value={perfil.direccionEmpresa} />
          <InfoItem label="Teléfono" value={perfil.telefonoEmpresa} />

          <View style={styles.ratingContainer}>
            <Text style={styles.ratingIcon}>⭐</Text>
            <View>
              <Text style={styles.ratingLabel}>Calificación promedio</Text>
              <Text style={styles.ratingValue}>
                {perfil.calificacionPromedio ?? "Sin calificación"}
              </Text>
            </View>
          </View>
        </View>
      )}

      {perfil.rol === "ADMIN" && (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Permisos especiales</Text>
          <Text style={styles.cardTitle}>🛡️ Administrador</Text>

          <Text style={styles.adminDescription}>
            Tienes permisos administrativos completos en MercadoLocal. Puedes
            gestionar usuarios, productos, vendedores y todas las configuraciones
            del sistema.
          </Text>
        </View>
      )}

      {/*Botón de cerrar sesión */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Gestión de cuenta</Text>
        <Text style={styles.cardTitle}>🔐 Seguridad</Text>
        
        <LogoutButton />
        
        {/* Opción para eliminar cuenta (opcional) */}
        <TouchableOpacity 
          style={styles.deleteAccountButton}
          onPress={() => Alert.alert(
            "Eliminar cuenta",
            "Esta acción no se puede deshacer. ¿Estás seguro?",
            [
              { text: "Cancelar", style: "cancel" },
              { text: "Eliminar", style: "destructive", onPress: () => {
                Alert.alert("Info", "Contacta al soporte para eliminar tu cuenta.");
              }}
            ]
          )}
        >
          <Text style={styles.deleteAccountText}>🗑️ Eliminar mi cuenta</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerContent}>
          <Text style={styles.footerIcon}>🌱</Text>
          <Text style={styles.footerTitle}>
            Gracias por ser parte de MercadoLocal
          </Text>
        </View>
        <Text style={styles.footerSubtitle}>
          Juntos apoyamos el comercio local y sostenible
        </Text>
        
        {/* Info de versión/actualización */}
        <View style={styles.versionInfo}>
          <Text style={styles.versionText}>v1.0.0</Text>
          <Text style={styles.versionSubtext}>MercadoLocal-IA</Text>
        </View>
      </View>
    </ScrollView>
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
    paddingBottom: 40,
    paddingHorizontal: 20,
    alignItems: "center",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#5A8F48",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 3,
    borderColor: "rgba(90, 143, 72, 0.2)",
  },
  avatarText: {
    fontSize: 36,
    fontWeight: "700",
    color: "white",
  },
  headerLabel: {
    fontSize: 11,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "#9AAA98",
    fontWeight: "500",
    marginBottom: 8,
  },
  headerName: {
    fontSize: 28,
    fontWeight: "700",
    color: "#2D3E2B",
    marginBottom: 8,
    textAlign: "center",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4ADE80",
  },
  statusText: {
    fontSize: 14,
    color: "#6B7F69",
    fontWeight: "500",
  },
  badgesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },
  badge: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#ECF2E3",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(90, 143, 72, 0.15)",
  },
  badgeText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#5A8F48",
  },
  badgeAdmin: {
    backgroundColor: "#FFE5E9",
    borderColor: "rgba(218, 62, 82, 0.15)",
  },
  badgeAdminText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#DA3E52",
  },
  badgeDate: {
    backgroundColor: "rgba(249, 251, 247, 0.8)",
    borderColor: "rgba(90, 143, 72, 0.1)",
  },
  badgeDateText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7F69",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardLabel: {
    fontSize: 11,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "#9AAA98",
    fontWeight: "500",
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2D3E2B",
    marginBottom: 20,
  },
  actionsGrid: {
    gap: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  actionButtonPrimary: {
    backgroundColor: "#5A8F48",
  },
  actionButtonSecondary: {
    backgroundColor: "#ECF2E3",
  },
  actionButtonIcon: {
    fontSize: 18,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: "700",
  },
  actionButtonTextPrimary: {
    color: "white",
  },
  actionButtonTextSecondary: {
    color: "#5A8F48",
  },
  infoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ECF2E3",
  },
  infoLabel: {
    fontSize: 14,
    color: "#6B7F69",
    fontWeight: "500",
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: "#2D3E2B",
    fontWeight: "700",
    textAlign: "right",
    flex: 1,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 2,
    borderTopColor: "#ECF2E3",
  },
  ratingIcon: {
    fontSize: 32,
  },
  ratingLabel: {
    fontSize: 12,
    color: "#9AAA98",
    fontWeight: "500",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  ratingValue: {
    fontSize: 28,
    fontWeight: "700",
    color: "#5A8F48",
  },
  adminDescription: {
    fontSize: 15,
    color: "#6B7F69",
    lineHeight: 22,
  },
  // Estilos para el botón de cerrar sesión
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: "#FEE2E2",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FECACA",
    marginBottom: 12,
  },
  logoutIcon: {
    fontSize: 20,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#DC2626",
  },
  //Botón para eliminar cuenta (opcional)
  deleteAccountButton: {
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FECACA",
    backgroundColor: "#FFF5F5",
  },
  deleteAccountText: {
    fontSize: 14,
    color: "#DC2626",
    fontWeight: "600",
  },
  footer: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 20,
    marginBottom: 40,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  footerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  footerIcon: {
    fontSize: 24,
  },
  footerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#5A8F48",
  },
  footerSubtitle: {
    fontSize: 13,
    color: "#9AAA98",
    textAlign: "center",
    marginBottom: 16,
  },
  // Info de versión
  versionInfo: {
    alignItems: "center",
    marginTop: 8,
  },
  versionText: {
    fontSize: 11,
    color: "#9AAA98",
    fontWeight: "600",
  },
  versionSubtext: {
    fontSize: 10,
    color: "#B5C4B3",
    marginTop: 2,
  },
});