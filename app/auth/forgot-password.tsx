import { useRouter } from "expo-router";
import { sendPasswordResetEmail } from "firebase/auth";
import { Mail } from "lucide-react-native";
import React, { useState } from "react";
import {
  Alert,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { auth } from '@/services/firebase';

export default function ForgotPassword() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [correoEnviado, setCorreoEnviado] = useState(false);

  const resetPassword = async () => {
    if (!email) {
      Alert.alert("Error", "Ingresa tu correo electrónico.");
      return;
    }

    if (!email.includes("@")) {
      Alert.alert("Error", "Ingresa un correo válido.");
      return;
    }

    try {
      setLoading(true);

      await sendPasswordResetEmail(auth, email.trim());

      setCorreoEnviado(true);

    } catch (error: any) {
      Alert.alert(
        "Error",
        "No se pudo enviar el correo. Verifica que el correo esté registrado."
      );
    } finally {
      setLoading(false);
    }
  };

  if (correoEnviado) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center px-6">

        <Text className="text-3xl font-bold text-[#90C659] mb-2">
        ¡Correo enviado!
        </Text>

        <Text className="text-center text-gray-500 mt-2 mb-8 text-base">
         Hemos enviado un enlace de recuperación a tu correo electrónico.
        Revisa tu bandeja de entrada o la carpeta de spam.
        </Text>

        <TouchableOpacity
          className="bg-[#90C659] py-4 px-10 rounded-2xl"
          onPress={() => router.replace("/auth/login")}
        >
          <Text className="text-white font-bold text-base">
            Volver al inicio de sesión
          </Text>
        </TouchableOpacity>

      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50 flex-col items-center justify-center p-6 relative">

      <View className="absolute -top-10 -right-10 opacity-5">
        <Image
          source={{
            uri: "https://cdn-icons-png.flaticon.com/512/2913/2913520.png",
          }}
          className="w-64 h-64"
          style={{ transform: [{ rotate: "45deg" }] }}
        />
      </View>

      <View className="absolute -bottom-10 -left-10 opacity-5">
        <Image
          source={{
            uri: "https://cdn-icons-png.flaticon.com/512/2913/2913520.png",
          }}
          className="w-64 h-64"
          style={{ transform: [{ rotate: "-12deg" }] }}
        />
      </View>

      <View className="flex-col items-center z-10 mb-8">
        <View className="flex-row items-center gap-3">

          <View className="bg-[#90C659] p-3.5 rounded-2xl shadow-xl">
            <Svg viewBox="0 0 24 24" width={40} height={40} fill="white">
              <Path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 5.5-8 5.5V6.5A4.5 4.5 0 0 0 9.5 2 4.5 4.5 0 0 0 5 6.5C5 10.5 8 13 8 13 8 13 5 16 5 19.5"/>
            </Svg>
          </View>

          <View>
            <Text className="text-[#90C659] text-4xl font-black">ECO</Text>
            <Text className="text-gray-800 text-4xl font-black">EAT</Text>
          </View>

        </View>
      </View>

      <View className="w-full max-w-sm bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">

        <Text className="text-center font-bold text-gray-500 text-sm tracking-widest mb-6 uppercase">
          Recuperar contraseña
        </Text>

        <Text className="text-center text-gray-500 mb-6">
          Escribe el correo con el que te registraste.
        </Text>

        <View className="w-full bg-gray-100 rounded-2xl flex-row items-center px-4 h-14 mb-6">
          <Mail color="#90C659" size={20} />
          <TextInput
            className="flex-1 ml-3"
            placeholder="Correo electrónico"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <TouchableOpacity
          onPress={resetPassword}
          disabled={loading}
          className={`bg-[#90C659] py-4 rounded-2xl items-center ${
            loading ? "opacity-70" : ""
          }`}
        >
          <Text className="text-white font-bold">
            {loading ? "Enviando..." : "Enviar correo"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.replace("/auth/login")}
          className="items-center mt-5"
        >
          <Text className="text-[#90C659] font-bold">
            ← Volver al inicio de sesión
          </Text>
        </TouchableOpacity>

      </View>

    </View>
  );
}
