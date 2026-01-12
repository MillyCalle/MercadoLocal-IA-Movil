import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { API_CONFIG } from "../../config";

interface Perfil {
  nombre: string;
  apellido: string;
  correo: string;
  fechaNacimiento?: string;
  rol: string;
  // Consumidor
  direccionConsumidor?: string;
  telefonoConsumidor?: string;
  cedulaConsumidor?: string;
  // Vendedor
  nombreEmpresa?: string;
  rucEmpresa?: string;
  direccionEmpresa?: string;
  telefonoEmpresa?: string;
}

export default function EditarPerfil() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [perfil, setPerfil] = useState<Perfil | null>(null);

  // Campos editables
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [direccionConsumidor, setDireccionConsumidor] = useState("");
  const [telefonoConsumidor, setTelefonoConsumidor] = useState("");
  const [direccionEmpresa, setDireccionEmpresa] = useState("");
  const [telefonoEmpresa, setTelefonoEmpresa] = useState("");

  useEffect(() => {
    cargarPerfil();
  }, []);

  const cargarPerfil = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");

      if (!token) {
        router.replace("/auth/login" as any);
        return;
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}/usuarios/perfil`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Error al cargar perfil");
      }

      const data = await response.json();
      setPerfil(data);

      // Llenar los campos editables
      setNombre(data.nombre || "");
      setApellido(data.apellido || "");
      setFechaNacimiento(data.fechaNacimiento || "");
      setDireccionConsumidor(data.direccionConsumidor || "");
      setTelefonoConsumidor(data.telefonoConsumidor || "");
      setDireccionEmpresa(data.direccionEmpresa || "");
      setTelefonoEmpresa(data.telefonoEmpresa || "");
    } catch (error) {
      console.error("❌ Error al cargar perfil:", error);
      Alert.alert("Error", "No se pudo cargar el perfil");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const guardarCambios = async () => {
    try {
      setSaving(true);

      const token = await AsyncStorage.getItem("authToken");
      if (!token) throw new Error("No autorizado");

      // Construir el request según el rol
      const body: any = {
        nombre,
        apellido,
        fechaNacimiento: fechaNacimiento || null,
      };

      if (perfil?.rol === "CONSUMIDOR") {
        body.direccionConsumidor = direccionConsumidor;
        body.telefonoConsumidor = telefonoConsumidor;
      }

      if (perfil?.rol === "VENDEDOR") {
        body.direccionEmpresa = direccionEmpresa;
        body.telefonoEmpresa = telefonoEmpresa;
      }

      console.log("📤 Enviando actualización:", body);

      const response = await fetch(`${API_CONFIG.BASE_URL}/usuarios/perfil`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Error del servidor:", errorText);
        throw new Error("Error al actualizar perfil");
      }

      Alert.alert(
        "✅ Perfil actualizado",
        "Tus cambios se guardaron correctamente",
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      console.error("❌ Error al guardar:", error);
      Alert.alert("Error", error.message || "No se pudo guardar los cambios");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5A8F48" />
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  if (!perfil) return null;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>✏️ Editar Perfil</Text>
          <Text style={styles.headerSubtitle}>
            Actualiza tu información personal
          </Text>
        </View>

        {/* Datos personales (comunes a todos) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📄 Datos Personales</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre</Text>
            <TextInput
              style={styles.input}
              value={nombre}
              onChangeText={setNombre}
              placeholder="Ingresa tu nombre"
              placeholderTextColor="#9AAA98"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Apellido</Text>
            <TextInput
              style={styles.input}
              value={apellido}
              onChangeText={setApellido}
              placeholder="Ingresa tu apellido"
              placeholderTextColor="#9AAA98"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Fecha de Nacimiento</Text>
            <TextInput
              style={styles.input}
              value={fechaNacimiento}
              onChangeText={setFechaNacimiento}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9AAA98"
            />
            <Text style={styles.hint}>Formato: YYYY-MM-DD (Ej: 1990-05-15)</Text>
          </View>

          {/* Campos bloqueados */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Correo electrónico <Text style={styles.locked}>🔒</Text>
            </Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={perfil.correo}
              editable={false}
              placeholderTextColor="#9AAA98"
            />
            <Text style={styles.hint}>Este campo no se puede modificar</Text>
          </View>
        </View>

        {/* Campos específicos para CONSUMIDOR */}
        {perfil.rol === "CONSUMIDOR" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🛒 Datos de Consumidor</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Dirección</Text>
              <TextInput
                style={styles.input}
                value={direccionConsumidor}
                onChangeText={setDireccionConsumidor}
                placeholder="Ingresa tu dirección"
                placeholderTextColor="#9AAA98"
                multiline
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Teléfono</Text>
              <TextInput
                style={styles.input}
                value={telefonoConsumidor}
                onChangeText={setTelefonoConsumidor}
                placeholder="Ingresa tu teléfono"
                placeholderTextColor="#9AAA98"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Cédula <Text style={styles.locked}>🔒</Text>
              </Text>
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={perfil.cedulaConsumidor}
                editable={false}
                placeholderTextColor="#9AAA98"
              />
              <Text style={styles.hint}>Este campo no se puede modificar</Text>
            </View>
          </View>
        )}

        {/* Campos específicos para VENDEDOR */}
        {perfil.rol === "VENDEDOR" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏪 Datos de la Empresa</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Nombre de la Empresa <Text style={styles.locked}>🔒</Text>
              </Text>
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={perfil.nombreEmpresa}
                editable={false}
                placeholderTextColor="#9AAA98"
              />
              <Text style={styles.hint}>Este campo no se puede modificar</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                RUC <Text style={styles.locked}>🔒</Text>
              </Text>
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={perfil.rucEmpresa}
                editable={false}
                placeholderTextColor="#9AAA98"
              />
              <Text style={styles.hint}>Este campo no se puede modificar</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Dirección de la Empresa</Text>
              <TextInput
                style={styles.input}
                value={direccionEmpresa}
                onChangeText={setDireccionEmpresa}
                placeholder="Ingresa la dirección"
                placeholderTextColor="#9AAA98"
                multiline
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Teléfono de la Empresa</Text>
              <TextInput
                style={styles.input}
                value={telefonoEmpresa}
                onChangeText={setTelefonoEmpresa}
                placeholder="Ingresa el teléfono"
                placeholderTextColor="#9AAA98"
                keyboardType="phone-pad"
              />
            </View>
          </View>
        )}

        {/* Botones */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={guardarCambios}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.saveButtonText}>💾 Guardar Cambios</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
            disabled={saving}
          >
            <Text style={styles.cancelButtonText}>❌ Cancelar</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.spacer} />
      </ScrollView>
    </KeyboardAvoidingView>
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
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: "white",
    paddingTop: 60,
    paddingBottom: 30,
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
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#2D3E2B",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6B7F69",
    textAlign: "center",
  },
  section: {
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2D3E2B",
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2D3E2B",
    marginBottom: 8,
  },
  locked: {
    fontSize: 12,
  },
  input: {
    backgroundColor: "#F9FBF7",
    borderWidth: 2,
    borderColor: "#ECF2E3",
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: "#2D3E2B",
    fontWeight: "500",
  },
  inputDisabled: {
    backgroundColor: "#ECF2E3",
    borderColor: "#DDE8D0",
    color: "#9AAA98",
  },
  hint: {
    fontSize: 12,
    color: "#9AAA98",
    marginTop: 6,
    fontStyle: "italic",
  },
  buttonsContainer: {
    marginHorizontal: 20,
    gap: 12,
  },
  saveButton: {
    backgroundColor: "#5A8F48",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: "white",
    fontSize: 17,
    fontWeight: "800",
  },
  cancelButton: {
    backgroundColor: "white",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#DA3E52",
  },
  cancelButtonText: {
    color: "#DA3E52",
    fontSize: 15,
    fontWeight: "700",
  },
  spacer: {
    height: 40,
  },
});