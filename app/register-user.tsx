import { useRouter } from 'expo-router';
import { AlertCircle, ArrowLeft, Check, Flame, Leaf, Lock, Mail, User } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

export default function RegisterUserScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [preferences, setPreferences] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);

  const dietOptions = ['Compro de todo', 'Vegano', 'Vegetariano', 'Dulces y Postres', 'Comida Saludable'];
  const allergyOptions = ['Sin Gluten', 'Sin Lácteos', 'Mariscos', 'Nueces', 'Huevo'];

  const toggleSelection = (item: string, list: string[], setList: (val: string[]) => void) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const handleFirebaseRegister = async () => {
    if (!name || !email || !password) {
      setErrorMsg("Por favor, llena tu nombre, correo y contraseña.");
      setStep(1);
      return;
    }

    try {
      setIsLoading(true);
      setErrorMsg('');

      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      await setDoc(doc(db, 'usuarios', user.uid), {
        nombre_completo: name,
        email: email.trim(),
        fecha_creacion: new Date().toISOString(),
        perfil_alimenticio: preferences,
        alergias: {
          opciones_predefinidas: allergies,
          alergia_personalizada: ""
        },
        rol: 'comensal'
      });

      setStep(3);
      setTimeout(() => {
        router.replace('/menuUser'); 
      }, 2500);

    } catch (error: any) {
      console.error("Error al registrar:", error);
      if (error.code === 'auth/email-already-in-use') {
        setErrorMsg('Este correo ya está registrado.');
      } else if (error.code === 'auth/weak-password') {
        setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      } else {
        setErrorMsg('Hubo un error al crear tu cuenta. Intenta de nuevo.');
      }
      setIsLoading(false);
      setStep(1); 
    }
  };

  if (step === 3) {
    return (
      <View className="flex-1 bg-green-50 items-center justify-center p-6">
        <ActivityIndicator size="large" color="#90C659" />
        <Text className="mt-6 text-2xl font-black text-gray-800 text-center">¡Cuenta Creada!</Text>
        <Text className="text-gray-500 mt-2 text-center text-base font-medium">Preparando tu perfil ecológico para empezar a rescatar comida...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50 flex-col relative">
      
      <TouchableOpacity 
        onPress={() => router.back()}
        className="absolute top-12 left-6 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm z-20"
      >
        <ArrowLeft color="#6b7280" size={24} />
      </TouchableOpacity>

      <View className="absolute top-14 w-full flex-row justify-center gap-2 z-10 pointer-events-none">
        <View className={`h-2 rounded-full ${step === 1 ? 'w-12 bg-[#90C659]' : 'w-2 bg-gray-300'}`} />
        <View className={`h-2 rounded-full ${step === 2 ? 'w-12 bg-[#90C659]' : 'w-2 bg-gray-300'}`} />
      </View>

      <ScrollView 
        contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24, paddingTop: 100 }}
        showsVerticalScrollIndicator={false}
      >
        
        <View className="flex-col items-center z-10 mb-8">
          <View className="flex-row items-center gap-3">
            <View className="bg-[#90C659] p-3.5 rounded-2xl shadow-xl">
              <Svg viewBox="0 0 24 24" width={32} height={32} fill="white">
                <Path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 5.5-8 5.5V6.5A4.5 4.5 0 0 0 9.5 2 4.5 4.5 0 0 0 5 6.5C5 10.5 8 13 8 13 8 13 5 16 5 19.5"/>
              </Svg>
            </View>
            <View className="flex-col">
              <Text className="text-[#90C659] text-3xl font-black tracking-tighter -mb-2">ECO</Text>
              <Text className="text-gray-800 text-3xl font-black tracking-tighter">EAT</Text>
            </View>
          </View>
        </View>

        <View className="w-full max-w-sm bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 z-10">
          
          {errorMsg ? (
            <View className="bg-red-50 p-3 rounded-xl mb-4 border border-red-100">
              <Text className="text-red-600 text-xs text-center font-bold">{errorMsg}</Text>
            </View>
          ) : null}

          {step === 1 && (
            <View>
              <View className="items-center mb-6">
                <Text className="font-bold text-gray-400 text-xs tracking-widest mb-1 uppercase">Paso 1 de 2</Text>
                <Text className="font-black text-2xl text-gray-900">Crea tu cuenta</Text>
                <Text className="text-gray-500 text-xs mt-1">Únete a la revolución contra el desperdicio</Text>
              </View>

              <View className="w-full bg-gray-100 rounded-2xl flex-row items-center px-4 h-14 mb-4">
                <User color="#90C659" size={20} />
                <TextInput 
                  value={name}
                  onChangeText={(text) => {setName(text); setErrorMsg('');}}
                  placeholder="Tu Nombre" 
                  className="flex-1 ml-3 text-sm font-medium text-gray-800"
                />
              </View>

              <View className="w-full bg-gray-100 rounded-2xl flex-row items-center px-4 h-14 mb-4">
                <Mail color="#90C659" size={20} />
                <TextInput 
                  value={email}
                  onChangeText={(text) => {setEmail(text); setErrorMsg('');}}
                  placeholder="Correo electrónico" 
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className="flex-1 ml-3 text-sm font-medium text-gray-800"
                />
              </View>

              <View className="w-full bg-gray-100 rounded-2xl flex-row items-center px-4 h-14 mb-6">
                <Lock color="#90C659" size={20} />
                <TextInput 
                  value={password}
                  onChangeText={(text) => {setPassword(text); setErrorMsg('');}}
                  placeholder="Crea una contraseña" 
                  secureTextEntry
                  className="flex-1 ml-3 text-sm font-medium text-gray-800"
                />
              </View>

              <TouchableOpacity 
                onPress={() => {
                  if(!name || !email || !password) {
                    setErrorMsg("Por favor, llena todos los campos.");
                    return;
                  }
                  setErrorMsg('');
                  setStep(2);
                }}
                className="w-full bg-[#90C659] py-4 rounded-2xl shadow-lg shadow-green-100 items-center mb-4"
              >
                <Text className="text-white font-bold uppercase tracking-wider">Siguiente</Text>
              </TouchableOpacity>

              <View className="flex-row justify-center mt-2">
                <Text className="text-gray-500 text-xs font-medium">¿Ya tienes cuenta? </Text>
                <TouchableOpacity onPress={() => router.push('/login')}>
                  <Text className="text-[#90C659] text-xs font-bold">Inicia sesión</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {step === 2 && (
            <View>
              <View className="items-center mb-6">
                <Text className="font-bold text-gray-400 text-xs tracking-widest mb-1 uppercase">Paso 2 de 2</Text>
                <Text className="font-black text-2xl text-gray-900">Tu Perfil</Text>
                <Text className="text-gray-500 text-xs mt-1">Personaliza tu experiencia de rescate</Text>
              </View>

              <View className="bg-green-50 p-4 rounded-2xl mb-4 border border-green-100">
                <View className="flex-row items-center gap-2 mb-3">
                  <View className="bg-[#90C659] p-1.5 rounded-lg"><Leaf color="white" size={14} /></View>
                  <Text className="font-bold text-sm text-gray-800">¿Qué prefieres comer?</Text>
                </View>
                <View className="flex-row flex-wrap gap-2">
                  {dietOptions.map((opt) => (
                    <TouchableOpacity
                      key={opt}
                      onPress={() => toggleSelection(opt, preferences, setPreferences)}
                      className={`flex-row items-center px-3 py-2 rounded-xl border ${
                        preferences.includes(opt) ? 'bg-[#90C659] border-[#90C659]' : 'bg-white border-green-200'
                      }`}
                    >
                      {preferences.includes(opt) && <Check color="white" size={12} style={{marginRight: 4}} />}
                      <Text className={`text-xs font-bold ${preferences.includes(opt) ? 'text-white' : 'text-gray-600'}`}>
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View className="bg-orange-50 p-4 rounded-2xl mb-6 border border-orange-100">
                <View className="flex-row items-center gap-2 mb-3">
                  <View className="bg-orange-500 p-1.5 rounded-lg"><AlertCircle color="white" size={14} /></View>
                  <Text className="font-bold text-sm text-gray-800">¿Alergias o restricciones?</Text>
                </View>
                <View className="flex-row flex-wrap gap-2">
                  {allergyOptions.map((opt) => (
                    <TouchableOpacity
                      key={opt}
                      onPress={() => toggleSelection(opt, allergies, setAllergies)}
                      className={`flex-row items-center px-3 py-2 rounded-xl border ${
                        allergies.includes(opt) ? 'bg-orange-500 border-orange-500' : 'bg-white border-orange-200'
                      }`}
                    >
                      {allergies.includes(opt) && <Check color="white" size={12} style={{marginRight: 4}} />}
                      <Text className={`text-xs font-bold ${allergies.includes(opt) ? 'text-white' : 'text-gray-600'}`}>
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity 
                onPress={handleFirebaseRegister}
                disabled={isLoading}
                className={`w-full bg-gray-900 py-4 rounded-2xl shadow-xl flex-row items-center justify-center gap-2 mb-3 ${isLoading ? 'opacity-70' : ''}`}
              >
                <Flame color="#fb923c" size={18} />
                <Text className="text-white font-bold tracking-wider">
                  {isLoading ? 'Creando cuenta...' : '¡Empezar a rescatar!'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setStep(1)} className="items-center py-2">
                <Text className="text-gray-400 font-bold text-xs">← Volver atrás</Text>
              </TouchableOpacity>

            </View>
          )}

        </View>

        <Text className="text-center text-gray-400 text-[10px] mt-6 max-w-[250px]">
          Al registrarte, aceptas nuestros términos de servicio y política de privacidad.
        </Text>
      </ScrollView>
    </View>
  );
}