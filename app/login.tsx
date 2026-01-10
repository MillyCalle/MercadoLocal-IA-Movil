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

interface LoginResponse {
  token: string;
  rol: string;
  idUsuario: number;
  nombre?: string;
  correo?: string;
  idVendedor?: number;
  idConsumidor?: number;
}

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Por favor completa todos los campos");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Error", "Por favor ingresa un correo válido");
      return;
    }

    setLoading(true);

    try {
      console.log("🌐 Red:", getCurrentNetwork().name);
      console.log("🔄 Login:", `${API_CONFIG.BASE_URL}/auth/login`);
      console.log("📧 Email:", email);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          correo: email,
          contrasena: password,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log("📡 Status:", response.status);

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || "Error al iniciar sesión");
      }

      const data: LoginResponse = await response.json();
      console.log("✅ Login exitoso:", data);

      await AsyncStorage.setItem("authToken", data.token);
      await AsyncStorage.setItem("token", data.token);
      await AsyncStorage.setItem("user", JSON.stringify(data));
      await AsyncStorage.setItem("rol", data.rol);
      await AsyncStorage.setItem("idUsuario", data.idUsuario.toString());

      if (data.idVendedor) {
        await AsyncStorage.setItem("idVendedor", data.idVendedor.toString());
      }

      if (data.idConsumidor) {
        await AsyncStorage.setItem("idConsumidor", data.idConsumidor.toString());
      }

      console.log("💾 Datos guardados");

      if (data.rol === "VENDEDOR") {
        console.log("🏪 → vendedor");
        router.replace("/(tabs)/profile");
      } else if (data.rol === "ADMIN") {
        console.log("👑 → admin");
        router.replace("/(tabs)");
      } else if (data.rol === "CONSUMIDOR") {
        console.log("🛒 → consumidor");
        router.replace("/(tabs)");
      } else {
        console.log("📱 → home");
        router.replace("/(tabs)");
      }

    } catch (error: any) {
      console.error("❌ Error:", error);
      
      let errorMessage = "Error desconocido";
      
      if (error.name === "AbortError") {
        errorMessage = "Tiempo agotado. Verifica tu conexión.";
      } else if (error.message.includes("Network")) {
        errorMessage = `No se pudo conectar.\n\nVerifica:\n• WiFi conectado\n• Backend corriendo\n• Red: ${getCurrentNetwork().name}`;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert("Error", errorMessage, [{ text: "OK" }]);
    } finally {
      setLoading(false);
    }
  };

  const mostrarConfig = () => {
    const net = getCurrentNetwork();
    Alert.alert(
      "⚙️ Configuración",
      `Red: ${net.name}\nIP: ${net.ip}\nPuerto: ${net.port}\n\nPara cambiar, edita config.ts`,
      [{ text: "OK" }]
    );
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

        <Text style={styles.title}>Mercado Local-IA</Text>
        <Text style={styles.subtitle}>Bienvenido de vuelta</Text>

        <View style={styles.formContainer}>
          <Text style={styles.label}>Correo electrónico</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputIcon}>📧</Text>
            <TextInput
              style={styles.input}
              placeholder="tu@correo.com"
              placeholderTextColor="#aaa"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
          </View>

          <Text style={styles.label}>Contraseña</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputIcon}>🔒</Text>
            <TextInput
              style={[styles.input, { paddingRight: 50 }]}
              placeholder="••••••••"
              placeholderTextColor="#aaa"
              value={password}
              onChangeText={setPassword}
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

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="white" size="small" />
                <Text style={styles.loginButtonText}>Iniciando...</Text>
              </View>
            ) : (
              <Text style={styles.loginButtonText}>Iniciar sesión</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => router.push("/register")}
            disabled={loading}
          >
            <Text style={styles.registerText}>
              ¿No tienes cuenta?{" "}
              <Text style={styles.registerLink}>Crear cuenta</Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => router.back()}
            disabled={loading}
          >
            <Text style={styles.backText}>← Volver</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.devInfo} onPress={mostrarConfig}>
          <Text style={styles.devText}>🌐 {getCurrentNetwork().name}</Text>
          <Text style={styles.devTextSmall}>{API_CONFIG.BASE_URL}</Text>
          <Text style={styles.devTextSmall}>Toca para config</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#fffdf7",
    padding: 20,
    justifyContent: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  logo: {
    width: 120,
    height: 120,
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
  formContainer: {
    width: "100%",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3a5a40",
    marginBottom: 8,
    marginTop: 15,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "#e0ddd0",
    borderRadius: 12,
    paddingHorizontal: 15,
    position: "relative",
  },
  inputIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  input: {
    flex: 1,
    padding: 14,
    fontSize: 16,
    color: "#333",
  },
  eyeIcon: {
    position: "absolute",
    right: 15,
    padding: 5,
  },
  eyeText: {
    fontSize: 20,
  },
  loginButton: {
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
  loginButtonDisabled: {
    backgroundColor: "#94a3b8",
    opacity: 0.7,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  loginButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  registerText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 14,
    color: "#666",
  },
  registerLink: {
    color: "#d48f27",
    fontWeight: "700",
  },
  backText: {
    textAlign: "center",
    marginTop: 15,
    fontSize: 14,
    color: "#6b8e4e",
    fontWeight: "600",
  },
  devInfo: {
    marginTop: 30,
    padding: 15,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    alignItems: "center",
  },
  devText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
  },
  devTextSmall: {
    fontSize: 10,
    color: "#999",
    marginTop: 4,
  },
});