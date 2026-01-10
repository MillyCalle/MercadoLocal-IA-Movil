import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { API_CONFIG, getCurrentNetwork } from "../config";

interface RegisterResponse {
  token: string;
  rol: string;
  idUsuario: number;
  nombre?: string;
  correo?: string;
  idVendedor?: number;
  idConsumidor?: number;
  mensaje?: string;
}

export default function RegisterScreen() {
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    correo: "",
    contrasena: "",
    fechaNacimiento: "",
    idRol: 3,
    cedula: "",
    direccion: "",
    telefono: "",
    nombreEmpresa: "",
    ruc: "",
    direccionEmpresa: "",
    telefonoEmpresa: "",
    descripcion: ""
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (name: string, value: string) => {
    setForm({ ...form, [name]: value });
  };

  const handleRoleChange = (newRole: number) => {
    setForm({ ...form, idRol: newRole });
  };

  const handleRegister = async () => {
    if (!form.nombre || !form.apellido || !form.correo || !form.contrasena || !form.fechaNacimiento) {
      Alert.alert("Error", "Completa todos los campos obligatorios");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.correo)) {
      Alert.alert("Error", "Correo inválido");
      return;
    }

    if (form.contrasena.length < 6) {
      Alert.alert("Error", "Contraseña debe tener 6+ caracteres");
      return;
    }

    if (form.idRol === 3) {
      if (!form.cedula || !form.direccion || !form.telefono) {
        Alert.alert("Error", "Completa campos de consumidor");
        return;
      }
    } else if (form.idRol === 2) {
      if (!form.nombreEmpresa || !form.ruc || !form.direccionEmpresa || !form.telefonoEmpresa) {
        Alert.alert("Error", "Completa campos de vendedor");
        return;
      }
    }

    setLoading(true);

    try {
      console.log("🌐 Red:", getCurrentNetwork().name);
      console.log("🔄 Registro:", `${API_CONFIG.BASE_URL}/auth/register`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log("📡 Status:", response.status);

      const data: RegisterResponse = await response.json();

      if (response.ok) {
        console.log("✅ Registro exitoso:", data);

        if (data.token) await AsyncStorage.setItem("authToken", data.token);
        if (data.token) await AsyncStorage.setItem("token", data.token);
        if (data.rol) await AsyncStorage.setItem("rol", data.rol);
        if (data.idUsuario) await AsyncStorage.setItem("idUsuario", data.idUsuario.toString());
        if (data.idVendedor) await AsyncStorage.setItem("idVendedor", data.idVendedor.toString());
        if (data.idConsumidor) await AsyncStorage.setItem("idConsumidor", data.idConsumidor.toString());

        const user = {
          id: data.idUsuario,
          rol: data.rol,
          nombre: form.nombre,
          correo: form.correo,
          idVendedor: data.idVendedor,
          idConsumidor: data.idConsumidor
        };
        await AsyncStorage.setItem("user", JSON.stringify(user));

        Alert.alert(
          "¡Éxito! 🎉",
          `Bienvenido ${form.nombre}`,
          [
            {
              text: "Continuar",
              onPress: () => {
                if (data.rol === "VENDEDOR") {
                  router.replace("/(tabs)/profile");
                } else {
                  router.replace("/(tabs)");
                }
              }
            }
          ]
        );

      } else {
        throw new Error(data.mensaje || "Error en registro");
      }

    } catch (error: any) {
      console.error("❌ Error:", error);
      
      let errorMessage = "Error desconocido";
      
      if (error.name === "AbortError") {
        errorMessage = "Tiempo agotado";
      } else if (error.message.includes("Network")) {
        errorMessage = `No conecta.\n\nRed: ${getCurrentNetwork().name}`;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert("Error", errorMessage, [{ text: "OK" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView 
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoContainer}>
          <Image
            source={require("../assets/images/Logo2.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.title}>Crear Cuenta</Text>
        <Text style={styles.subtitle}>Únete a nuestra comunidad</Text>

        <View style={styles.roleSelector}>
          <Text style={styles.roleLabel}>¿Cómo te unirás? *</Text>
          <View style={styles.roleButtons}>
            <TouchableOpacity
              style={[styles.roleButton, form.idRol === 3 && styles.roleButtonActive]}
              onPress={() => handleRoleChange(3)}
            >
              <Text style={styles.roleIcon}>🛒</Text>
              <Text style={[styles.roleText, form.idRol === 3 && styles.roleTextActive]}>
                Consumidor
              </Text>
              <Text style={styles.roleDesc}>Compra</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.roleButton, form.idRol === 2 && styles.roleButtonActive]}
              onPress={() => handleRoleChange(2)}
            >
              <Text style={styles.roleIcon}>🏪</Text>
              <Text style={[styles.roleText, form.idRol === 2 && styles.roleTextActive]}>
                Vendedor
              </Text>
              <Text style={styles.roleDesc}>Vende</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Información Personal</Text>

        <View style={styles.inputRow}>
          <View style={styles.inputHalf}>
            <Text style={styles.label}>Nombre *</Text>
            <TextInput
              style={styles.input}
              placeholder="Juan"
              placeholderTextColor="#aaa"
              value={form.nombre}
              onChangeText={(v) => handleChange("nombre", v)}
              editable={!loading}
            />
          </View>

          <View style={styles.inputHalf}>
            <Text style={styles.label}>Apellido *</Text>
            <TextInput
              style={styles.input}
              placeholder="Pérez"
              placeholderTextColor="#aaa"
              value={form.apellido}
              onChangeText={(v) => handleChange("apellido", v)}
              editable={!loading}
            />
          </View>
        </View>

        <Text style={styles.label}>Correo *</Text>
        <TextInput
          style={styles.input}
          placeholder="tu@correo.com"
          placeholderTextColor="#aaa"
          value={form.correo}
          onChangeText={(v) => handleChange("correo", v)}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!loading}
        />

        <Text style={styles.label}>Contraseña *</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={[styles.input, { paddingRight: 50 }]}
            placeholder="••••••••"
            placeholderTextColor="#aaa"
            value={form.contrasena}
            onChangeText={(v) => handleChange("contrasena", v)}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            editable={!loading}
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowPassword(!showPassword)}
            disabled={loading}
          >
            <Text style={styles.eyeText}>{showPassword ? "👁️" : "👁️‍🗨️"}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Fecha nacimiento *</Text>
        <TextInput
          style={styles.input}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#aaa"
          value={form.fechaNacimiento}
          onChangeText={(v) => handleChange("fechaNacimiento", v)}
          editable={!loading}
        />

        {form.idRol === 3 && (
          <>
            <Text style={styles.sectionTitle}>Datos Consumidor</Text>
            <Text style={styles.label}>Cédula *</Text>
            <TextInput
              style={styles.input}
              placeholder="0102030405"
              placeholderTextColor="#aaa"
              value={form.cedula}
              onChangeText={(v) => handleChange("cedula", v)}
              keyboardType="numeric"
              editable={!loading}
            />
            <Text style={styles.label}>Dirección *</Text>
            <TextInput
              style={styles.input}
              placeholder="Dirección"
              placeholderTextColor="#aaa"
              value={form.direccion}
              onChangeText={(v) => handleChange("direccion", v)}
              editable={!loading}
            />
            <Text style={styles.label}>Teléfono *</Text>
            <TextInput
              style={styles.input}
              placeholder="0999999999"
              placeholderTextColor="#aaa"
              value={form.telefono}
              onChangeText={(v) => handleChange("telefono", v)}
              keyboardType="phone-pad"
              editable={!loading}
            />
          </>
        )}

        {form.idRol === 2 && (
          <>
            <Text style={styles.sectionTitle}>Datos Negocio</Text>
            <Text style={styles.label}>Nombre negocio *</Text>
            <TextInput
              style={styles.input}
              placeholder="Frutas Don Pepe"
              placeholderTextColor="#aaa"
              value={form.nombreEmpresa}
              onChangeText={(v) => handleChange("nombreEmpresa", v)}
              editable={!loading}
            />
            <Text style={styles.label}>RUC *</Text>
            <TextInput
              style={styles.input}
              placeholder="1102345678001"
              placeholderTextColor="#aaa"
              value={form.ruc}
              onChangeText={(v) => handleChange("ruc", v)}
              keyboardType="numeric"
              editable={!loading}
            />
            <Text style={styles.label}>Dirección negocio *</Text>
            <TextInput
              style={styles.input}
              placeholder="Local 12"
              placeholderTextColor="#aaa"
              value={form.direccionEmpresa}
              onChangeText={(v) => handleChange("direccionEmpresa", v)}
              editable={!loading}
            />
            <Text style={styles.label}>Teléfono negocio *</Text>
            <TextInput
              style={styles.input}
              placeholder="0987654321"
              placeholderTextColor="#aaa"
              value={form.telefonoEmpresa}
              onChangeText={(v) => handleChange("telefonoEmpresa", v)}
              keyboardType="phone-pad"
              editable={!loading}
            />
            <Text style={styles.label}>Descripción</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Descripción..."
              placeholderTextColor="#aaa"
              value={form.descripcion}
              onChangeText={(v) => handleChange("descripcion", v)}
              multiline
              numberOfLines={4}
              editable={!loading}
            />
          </>
        )}

        <TouchableOpacity
          style={[styles.registerButton, loading && styles.registerButtonDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="white" size="small" />
              <Text style={styles.registerButtonText}>Registrando...</Text>
            </View>
          ) : (
            <Text style={styles.registerButtonText}>Registrarse</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => router.push("/login")}
          disabled={loading}
        >
          <Text style={styles.loginText}>
            ¿Ya tienes cuenta?{" "}
            <Text style={styles.loginLink}>Inicia sesión</Text>
          </Text>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#fffdf7",
    padding: 20,
    paddingTop: 50,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  logo: {
    width: 100,
    height: 100,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#3a5a40",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#6b8e4e",
    textAlign: "center",
    marginBottom: 30,
  },
  roleSelector: {
    marginBottom: 25,
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3a5a40",
    marginBottom: 12,
  },
  roleButtons: {
    flexDirection: "row",
    gap: 12,
  },
  roleButton: {
    flex: 1,
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "#e0ddd0",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
  },
  roleButtonActive: {
    borderColor: "#6b8e4e",
    backgroundColor: "#f0f5f1",
  },
  roleIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  roleText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  roleTextActive: {
    color: "#3a5a40",
  },
  roleDesc: {
    fontSize: 12,
    color: "#666",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#3a5a40",
    marginTop: 20,
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3a5a40",
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "#e0ddd0",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: "#333",
  },
  inputRow: {
    flexDirection: "row",
    gap: 12,
  },
  inputHalf: {
    flex: 1,
  },
  passwordContainer: {
    position: "relative",
  },
  eyeIcon: {
    position: "absolute",
    right: 15,
    top: 15,
    padding: 5,
  },
  eyeText: {
    fontSize: 20,
  },
  textarea: {
    minHeight: 100,
    textAlignVertical: "top",
    paddingTop: 14,
  },
  registerButton: {
    backgroundColor: "#6b8e4e",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  registerButtonDisabled: {
    backgroundColor: "#94a3b8",
    opacity: 0.7,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  registerButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  loginText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 14,
    color: "#666",
  },
  loginLink: {
    color: "#d48f27",
    fontWeight: "700",
  },
});