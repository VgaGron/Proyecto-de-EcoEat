import emailjs from '@emailjs/browser';
import { useRouter } from 'expo-router';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { AlertTriangle, Lock, Mail, ShieldCheck, User } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import { Image, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { auth, db } from '@/services/firebase';

const EMAILJS_SERVICE_ID = 'service_dwcgwsh';
const EMAILJS_TEMPLATE_ID = 'template_1zrwhfo';
const EMAILJS_PUBLIC_KEY = '2UDNZPTkRN5Iy7yDi';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [pendingUserData, setPendingUserData] = useState<any>(null);
  const otpExpiry = useRef<number>(0);

  const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

  const sendOtpEmail = async (toEmail: string, code: string) => {
    const expiryTime = new Date(Date.now() + 15 * 60 * 1000);
    const timeStr = expiryTime.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

    await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      {
        email: toEmail,
        passcode: code,
        time: timeStr,
      },
      EMAILJS_PUBLIC_KEY
    );
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Por favor, escribe tu correo y contraseña.');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const userId = credential.user.uid;

      const profileRef = doc(db, 'usuarios', userId);
      const profileSnap = await getDoc(profileRef);

      if (profileSnap.exists()) {
        const userData = profileSnap.data();

        if (userData.rol === 'restaurante') {
          await signOut(auth);

          const code = generateCode();
          setGeneratedCode(code);
          otpExpiry.current = Date.now() + 15 * 60 * 1000;

          await sendOtpEmail(email.trim(), code);

          setPendingUserData({ email: email.trim(), password });
          setShowOtp(true);
        } else {
          router.replace('/menuUser');
        }
      } else {
        setError('Error del sistema: Perfil no encontrado.');
        await signOut(auth);
      }

    } catch (loginError: any) {
      console.error('Error al iniciar sesión:', loginError);
      if (loginError.code === 'auth/invalid-email') {
        setError('El formato del correo no es válido.');
      } else if (
        loginError.code === 'auth/invalid-credential' ||
        loginError.code === 'auth/wrong-password' ||
        loginError.code === 'auth/user-not-found'
      ) {
        setError('Correo o contraseña incorrectos.');
      } else if (loginError.code === 'auth/too-many-requests') {
        setError('Demasiados intentos. Intenta más tarde.');
      } else {
        setError('No se pudo iniciar sesión. Verifica tu conexión.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode) {
      setOtpError('Por favor ingresa el código.');
      return;
    }

    if (Date.now() > otpExpiry.current) {
      setOtpError('El código expiró. Vuelve a iniciar sesión.');
      setShowOtp(false);
      return;
    }

    if (otpCode.trim() !== generatedCode) {
      setOtpError('Código incorrecto. Inténtalo de nuevo.');
      return;
    }

    try {
      setIsLoading(true);
      await signInWithEmailAndPassword(auth, pendingUserData.email, pendingUserData.password);
      router.replace('/business/dashboardRestaurant');
    } catch (error) {
      setOtpError('Error al verificar. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  if (showOtp) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center p-6">
        <View className="w-full max-w-sm bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">

          <View className="items-center mb-6">
            <View className="w-16 h-16 bg-green-50 rounded-full items-center justify-center mb-4">
              <ShieldCheck color="#90C659" size={32} />
            </View>
            <Text className="font-black text-2xl text-gray-900 mb-2">Verificación</Text>
            <Text className="text-gray-500 text-sm text-center">
              Enviamos un código de 6 dígitos a{"\n"}
              <Text className="font-bold text-gray-700">{email}</Text>
            </Text>
          </View>

          {otpError ? (
            <View className="bg-red-50 border border-red-200 p-3 rounded-xl flex-row items-center gap-2 mb-4">
              <AlertTriangle color="#dc2626" size={16} />
              <Text className="text-red-600 text-xs font-bold flex-1">{otpError}</Text>
            </View>
          ) : null}

          <View className="w-full bg-gray-100 rounded-2xl flex-row items-center px-4 h-14 mb-6">
            <Mail color="#90C659" size={20} />
            <TextInput
              className="flex-1 ml-3 text-lg font-bold text-gray-800 tracking-widest"
              placeholder="000000"
              value={otpCode}
              onChangeText={(t) => { setOtpCode(t.replace(/[^0-9]/g, '')); setOtpError(''); }}
              keyboardType="numeric"
              maxLength={6}
            />
          </View>

          <TouchableOpacity
            onPress={handleVerifyOtp}
            disabled={isLoading}
            className={`w-full bg-[#90C659] py-4 rounded-2xl items-center shadow-lg mb-4 ${isLoading ? 'opacity-70' : ''}`}
          >
            <Text className="text-white font-bold uppercase tracking-widest">
              {isLoading ? 'Verificando...' : 'Verificar código'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => { setShowOtp(false); setOtpCode(''); setOtpError(''); }}
            className="items-center"
          >
            <Text className="text-gray-400 text-xs font-bold">← Volver al inicio de sesión</Text>
          </TouchableOpacity>

        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50 flex-col items-center justify-center p-6 relative">

      <View className="absolute -top-10 -right-10 opacity-5 pointer-events-none">
        <Image source={{ uri: "https://cdn-icons-png.flaticon.com/512/2913/2913520.png" }} className="w-64 h-64" style={{ transform: [{ rotate: '45deg' }] }} />
      </View>
      <View className="absolute -bottom-10 -left-10 opacity-5 pointer-events-none">
        <Image source={{ uri: "https://cdn-icons-png.flaticon.com/512/2913/2913520.png" }} className="w-64 h-64" style={{ transform: [{ rotate: '-12deg' }] }} />
      </View>

      <View className="flex-col items-center z-10 mb-8 mt-10">
        <View className="flex-row items-center gap-3">
          <View className="bg-[#90C659] p-3.5 rounded-2xl shadow-xl">
            <Svg viewBox="0 0 24 24" width={40} height={40} fill="white">
              <Path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 5.5-8 5.5V6.5A4.5 4.5 0 0 0 9.5 2 4.5 4.5 0 0 0 5 6.5C5 10.5 8 13 8 13 8 13 5 16 5 19.5"/>
            </Svg>
          </View>
          <View className="flex-col">
            <Text className="text-[#90C659] text-4xl font-black tracking-tighter -mb-2">ECO</Text>
            <Text className="text-gray-800 text-4xl font-black tracking-tighter">EAT</Text>
          </View>
        </View>
      </View>

      <View className="w-full max-w-sm bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 z-10">
        <Text className="text-center font-bold text-gray-500 text-sm tracking-widest mb-8 uppercase">
          Bienvenido de nuevo
        </Text>

        {error ? (
          <View className="bg-red-50 border border-red-200 p-3 rounded-xl flex-row items-center justify-center gap-2 mb-4">
            <AlertTriangle color="#dc2626" size={16} />
            <Text className="text-red-600 text-xs font-bold flex-1 text-center">{error}</Text>
          </View>
        ) : null}

        <View className="w-full bg-gray-100 rounded-2xl flex-row items-center px-4 h-14 mb-4">
          <User color="#90C659" size={20} />
          <TextInput
            className="flex-1 ml-3 text-sm font-medium text-gray-800"
            placeholder="Correo electrónico"
            value={email}
            onChangeText={(text) => { setEmail(text); setError(''); }}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View className="w-full bg-gray-100 rounded-2xl flex-row items-center px-4 h-14 mb-6">
          <Lock color="#90C659" size={20} />
          <TextInput
            className="flex-1 ml-3 text-sm font-medium text-gray-800"
            placeholder="Contraseña"
            value={password}
            onChangeText={(text) => { setPassword(text); setError(''); }}
            secureTextEntry={true}
          />
        </View>

        <TouchableOpacity
          onPress={handleLogin}
          disabled={isLoading}
          className={`w-full bg-[#90C659] py-4 rounded-2xl items-center shadow-lg mb-4 ${isLoading ? 'opacity-70' : ''}`}
        >
          <Text className="text-white font-bold uppercase tracking-widest">
            {isLoading ? 'Ingresando...' : 'Ingresar'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity className="items-center mb-4" onPress={() => router.push('/auth/forgot-password')}>
          <Text className="text-[#90C659] text-xs font-bold">¿Olvidaste tu contraseña?</Text>
        </TouchableOpacity>

        <View className="flex-row items-center mb-4">
          <View className="flex-1 h-[1px] bg-gray-100" />
          <Text className="mx-4 text-gray-400 text-[10px] font-bold uppercase tracking-widest">O entra con</Text>
          <View className="flex-1 h-[1px] bg-gray-100" />
        </View>

        <View className="flex-row justify-center gap-6">
          <TouchableOpacity className="w-14 h-14 bg-gray-50 rounded-2xl items-center justify-center border border-gray-100">
            <Image source={{ uri: "https://www.svgrepo.com/show/475656/google-color.svg" }} className="w-6 h-6" />
          </TouchableOpacity>
          <TouchableOpacity className="w-14 h-14 bg-gray-50 rounded-2xl items-center justify-center border border-gray-100">
            <Image source={{ uri: "https://www.svgrepo.com/show/475647/facebook-color.svg" }} className="w-6 h-6" />
          </TouchableOpacity>
        </View>
      </View>

      <View className="mt-8 flex-row items-center z-10">
        <Text className="text-gray-500 text-xs font-medium">¿No tienes cuenta? </Text>
        <TouchableOpacity onPress={() => router.push('/auth/registerselector')}>
          <Text className="text-[#90C659] text-xs font-black">Regístrate</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}