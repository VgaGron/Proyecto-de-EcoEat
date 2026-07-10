import * as DocumentPicker from 'expo-document-picker';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, GeoPoint, setDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { AlertTriangle, ArrowLeft, Camera, Check, CreditCard, FileCheck2, FileText, Lock, Mail, MapPin, Store, Upload, User } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { auth, db, storage } from '@/services/firebase';

export default function RestaurantRegisterScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '', password: '', ownerName: '', ruc: '', razonSocial: '',
    nombreComercial: '', dni: '', address: '', category: '', cci: ''
  });

  const categories = ['Panadería', 'Menú', 'Comida Rápida', 'Postres', 'Cafetería'];
  const [coordenadas, setCoordenadas] = useState<GeoPoint | null>(null);
  const [profileImage, setProfileImage] = useState<DocumentPicker.DocumentPickerAsset | null>(null); 
  const [licenciaFile, setLicenciaFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [sanidadFile, setSanidadFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loadingText, setLoadingText] = useState('Guardando...'); 

  const mapCategoryToId = (cat: string) => {
    const map: Record<string, string> = {
      'Panadería': 'bakery', 'Menú': 'menu', 'Comida Rápida': 'fastfood',
      'Postres': 'dessert', 'Cafetería': 'drinks'
    };
    return map[cat] || 'all';
  };

  const handleGetLocation = async () => {
    setErrorMsg('');
    let { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      setErrorMsg("Permiso de GPS denegado. ECOEAT necesita tu ubicación.");
      return;
    }

    try {
      let location = await Location.getCurrentPositionAsync({});
      setCoordenadas(new GeoPoint(location.coords.latitude, location.coords.longitude));
      Alert.alert("¡Éxito!", "Ubicación GPS fijada en el mapa.");
    } catch (error) {
      setErrorMsg("No se pudo obtener la ubicación. Verifica que el GPS esté encendido.");
    }
  };

  const pickDocument = async (setFile: (file: DocumentPicker.DocumentPickerAsset) => void, type: 'image/*' | ['image/*', 'application/pdf'] = ['image/*', 'application/pdf']) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: type,
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setFile(result.assets[0]);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Error al seleccionar el archivo.");
    }
  };

  const uploadToFirebase = async (uri: string, path: string) => {
    const response = await fetch(uri);
    const blob = await response.blob(); 
    const fileRef = ref(storage, path);
    await uploadBytes(fileRef, blob);
    return await getDownloadURL(fileRef);
  };

  const handleFirebaseRegister = async () => {
    try {
      setIsLoading(true);
      setErrorMsg('');
      
      if (!coordenadas) {
        setErrorMsg("Por favor fija tu ubicación GPS en el Paso 3.");
        setStep(3);
        setIsLoading(false);
        return;
      }

      setLoadingText('Creando cuenta segura...');
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email.trim(), formData.password);
      const uid = userCredential.user.uid;

      let licenciaUrl = "";
      let sanidadUrl = "";
      let finalImageUrl = "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=80";

      if (profileImage) {
        setLoadingText('Subiendo Logo del Local...');
        finalImageUrl = await uploadToFirebase(profileImage.uri, `restaurantes_logos/${uid}_perfil`);
      }

      if (licenciaFile) {
        setLoadingText('Subiendo Licencia...');
        licenciaUrl = await uploadToFirebase(licenciaFile.uri, `documentos_legales/${uid}_licencia`);
      }

      if (sanidadFile) {
        setLoadingText('Subiendo Carnet...');
        sanidadUrl = await uploadToFirebase(sanidadFile.uri, `documentos_legales/${uid}_sanidad`);
      }

      setLoadingText('Configurando perfil de restaurante...');
      
      await setDoc(doc(db, 'usuarios', uid), {
        nombre_completo: formData.ownerName,
        email: formData.email.trim(),
        rol: 'restaurante',
        fecha_creacion: new Date().toISOString()
      });

      await setDoc(doc(db, 'restaurantes', uid), {
        nombre: formData.nombreComercial || formData.razonSocial,
        razonSocial: formData.razonSocial,
        ruc: formData.ruc,
        dni: formData.dni,
        categoriaId: mapCategoryToId(formData.category),
        cci: formData.cci,
        activo: true, 
        ratingPromedio: 5.0,
        distanciaTexto: "A menos de 2 km", 
        imagenUrl: finalImageUrl,
        urgente: false,
        ubicacion: {
          coordenadas: coordenadas,
          direccion_texto: formData.address
        },
        documentos_legales: {
          licencia_url: licenciaUrl,
          sanidad_url: sanidadUrl,
          estado_verificacion: "pendiente"
        }
      });

      setStep(5); 

      setTimeout(() => {
        router.replace('/business/dashboardRestaurant'); 
      }, 2500);

    } catch (error: any) {
      console.error("Error completo:", error);
      if (error.code === 'auth/email-already-in-use') {
        setErrorMsg('Este correo corporativo ya está registrado.');
      } else {
        setErrorMsg('Ocurrió un error. Revisa tu conexión y los datos.');
      }
      setStep(1); 
    } finally {
      setIsLoading(false);
      setLoadingText('Guardando...');
    }
  };

  if (step === 5) {
    return (
      <View className="flex-1 bg-green-50 items-center justify-center p-6">
        <Store size={64} color="#90C659" />
        <Text className="mt-6 text-2xl font-black text-gray-800 text-center">¡Bienvenido a ECOEAT!</Text>
        <Text className="text-gray-500 mt-2 text-center text-base font-medium">Estamos configurando tu Panel de Control...</Text>
        <ActivityIndicator size="large" color="#90C659" className="mt-8" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50 flex-col relative">
      
      <TouchableOpacity 
        onPress={() => step > 1 ? setStep(step - 1) : router.back()}
        disabled={isLoading}
        className="absolute top-12 left-6 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm z-20 disabled:opacity-50"
      >
        <ArrowLeft color="#6b7280" size={24} />
      </TouchableOpacity>

      <View className="absolute top-14 w-full flex-row justify-center gap-2 z-10 pointer-events-none">
        {[1, 2, 3, 4].map(i => (
          <View key={i} className={`h-2 rounded-full transition-all ${i <= step ? 'w-8 bg-[#90C659]' : 'w-2 bg-gray-300'}`} />
        ))}
      </View>

      <ScrollView 
        contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24, paddingTop: 100 }}
        showsVerticalScrollIndicator={false}
      >
        
        <View className="w-full max-w-sm bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 z-10">
          
          {errorMsg ? (
            <View className="bg-red-50 p-3 rounded-xl mb-4 border border-red-100 flex-row items-start gap-2">
              <AlertTriangle color="#dc2626" size={18} style={{marginTop: 2}} />
              <Text className="text-red-600 text-xs font-bold flex-1">{errorMsg}</Text>
            </View>
          ) : null}

          {step === 1 && (
            <View>
              <View className="items-center mb-4">
                <Text className="font-bold text-gray-400 text-xs tracking-widest mb-1 uppercase">Paso 1 de 4</Text>
                <Text className="font-black text-2xl text-gray-900">Perfil del Local</Text>
              </View>

              <View className="items-center mb-6">
                <TouchableOpacity 
                  onPress={() => pickDocument(setProfileImage, 'image/*')}
                  className="w-24 h-24 bg-gray-50 rounded-full border-2 border-dashed border-gray-300 items-center justify-center overflow-hidden relative"
                >
                  {profileImage ? (
                    <>
                      <Image source={{ uri: profileImage.uri }} className="w-full h-full" resizeMode="cover" />
                      <View className="absolute bottom-0 w-full bg-black/40 py-1 items-center">
                        <Text className="text-[8px] text-white font-bold uppercase">Editar</Text>
                      </View>
                    </>
                  ) : (
                    <View className="items-center justify-center mt-2">
                      <Camera color="#9ca3af" size={28} />
                      <Text className="text-[10px] text-gray-400 font-bold mt-1">Logo / Foto</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

<Text className="font-bold text-xs text-gray-500 mb-1 ml-1">Correo electrónico</Text>
<View className="w-full bg-gray-100 rounded-2xl flex-row items-center px-4 h-14 mb-4">
  <Mail color="#90C659" size={20} />
  <TextInput placeholder="ej. minegocio@gmail.com" value={formData.email} onChangeText={t => setFormData({...formData, email: t})} keyboardType="email-address" autoCapitalize="none" className="flex-1 ml-3 text-sm font-medium text-gray-800" />
</View>

<Text className="font-bold text-xs text-gray-500 mb-1 ml-1">Contraseña</Text>
<View className="w-full bg-gray-100 rounded-2xl flex-row items-center px-4 h-14 mb-4">
  <Lock color="#90C659" size={20} />
  <TextInput placeholder="Mínimo 6 caracteres" value={formData.password} onChangeText={t => setFormData({...formData, password: t})} secureTextEntry className="flex-1 ml-3 text-sm font-medium text-gray-800" />
</View>

<Text className="font-bold text-xs text-gray-500 mb-1 ml-1">Nombre del dueño o representante</Text>
<View className="w-full bg-gray-100 rounded-2xl flex-row items-center px-4 h-14 mb-6">
  <User color="#90C659" size={20} />
  <TextInput placeholder="ej. Juan Pérez" value={formData.ownerName} onChangeText={t => setFormData({...formData, ownerName: t})} className="flex-1 ml-3 text-sm font-medium text-gray-800" />
</View>
</View>
          )}

{step === 2 && (
  <View>
    <View className="items-center mb-6">
      <Text className="font-bold text-gray-400 text-xs tracking-widest mb-1 uppercase">Paso 2 de 4</Text>
      <Text className="font-black text-2xl text-gray-900">Identidad Legal</Text>
    </View>

    <Text className="font-bold text-xs text-gray-500 mb-1 ml-1">RUC del negocio</Text>
    <View className="w-full bg-gray-100 rounded-2xl flex-row items-center px-4 h-14 mb-4">
      <FileText color="#3b82f6" size={20} />
      <TextInput maxLength={11} placeholder="Ej. 20123456789" value={formData.ruc} onChangeText={t => setFormData({...formData, ruc: t.replace(/[^0-9]/g, '')})} keyboardType="numeric" className="flex-1 ml-3 text-sm font-medium text-gray-800" />
    </View>

    <Text className="font-bold text-xs text-gray-500 mb-1 ml-1">Razón Social</Text>
    <View className="w-full bg-gray-100 rounded-2xl flex-row items-center px-4 h-14 mb-4">
      <TextInput placeholder="Ej. Panadería El Sol S.A.C." value={formData.razonSocial} onChangeText={t => setFormData({...formData, razonSocial: t})} className="flex-1 text-sm font-medium text-gray-800" />
    </View>

    <Text className="font-bold text-xs text-gray-500 mb-1 ml-1">Nombre Comercial</Text>
    <View className="w-full bg-gray-100 rounded-2xl flex-row items-center px-4 h-14 mb-4">
      <TextInput placeholder="Ej. La Molienda" value={formData.nombreComercial} onChangeText={t => setFormData({...formData, nombreComercial: t})} className="flex-1 text-sm font-medium text-gray-800" />
    </View>

    <Text className="font-bold text-xs text-gray-500 mb-1 ml-1">DNI del Representante Legal</Text>
    <View className="w-full bg-gray-100 rounded-2xl flex-row items-center px-4 h-14 mb-6">
      <User color="#3b82f6" size={20} />
      <TextInput maxLength={8} placeholder="Ej. 12345678" value={formData.dni} onChangeText={t => setFormData({...formData, dni: t.replace(/[^0-9]/g, '')})} keyboardType="numeric" className="flex-1 ml-3 text-sm font-medium text-gray-800" />
    </View>
  </View>
)}

{step === 3 && (
  <View>
    <View className="items-center mb-6">
      <Text className="font-bold text-gray-400 text-xs tracking-widest mb-1 uppercase">Paso 3 de 4</Text>
      <Text className="font-black text-2xl text-gray-900">Operativa</Text>
    </View>

    <View className="w-full bg-gray-100 rounded-2xl flex-row px-4 pt-3 pb-3 mb-3">
      <MapPin color="#f97316" size={20} style={{marginTop: 2}} />
      <TextInput 
        multiline numberOfLines={2} placeholder="Dirección Exacta" value={formData.address} 
        onChangeText={t => setFormData({...formData, address: t})} 
        className="flex-1 ml-3 text-sm font-medium text-gray-800" style={{textAlignVertical: 'top'}} 
      />
    </View>

    <Text className="font-bold text-xs text-gray-700 mb-2">
      📍 Mueve el marcador para fijar la ubicación exacta
    </Text>
    <View style={{ height: 220, borderRadius: 16, overflow: 'hidden', marginBottom: 12 }}>
      <MapView
        style={{ flex: 1 }}
        provider="google"
        initialRegion={{
          latitude: coordenadas ? coordenadas.latitude : -9.0853,
          longitude: coordenadas ? coordenadas.longitude : -78.5782,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        onPress={(e) => {
          const { latitude, longitude } = e.nativeEvent.coordinate;
          setCoordenadas(new GeoPoint(latitude, longitude));
        }}
      >
        {coordenadas && (
          <Marker
            coordinate={{
              latitude: coordenadas.latitude,
              longitude: coordenadas.longitude,
            }}
            draggable
            onDragEnd={(e) => {
              const { latitude, longitude } = e.nativeEvent.coordinate;
              setCoordenadas(new GeoPoint(latitude, longitude));
            }}
            pinColor="#f97316"
          />
        )}
      </MapView>
    </View>

    <View className="flex-row gap-2 mb-4">
      <TouchableOpacity 
        onPress={handleGetLocation}
        className="flex-1 bg-blue-500 py-2.5 rounded-xl flex-row items-center justify-center gap-1"
      >
        <MapPin color="white" size={14} />
        <Text className="text-white text-xs font-bold">Usar mi GPS</Text>
      </TouchableOpacity>

      {coordenadas && (
        <View className="flex-1 bg-green-500 py-2.5 rounded-xl flex-row items-center justify-center gap-1">
          <Check color="white" size={14} />
          <Text className="text-white text-xs font-bold">Ubicación fijada</Text>
        </View>
      )}
    </View>

    <Text className="font-bold text-xs text-gray-700 mb-2">Categoría</Text>
    <View className="flex-row flex-wrap gap-2 mb-4">
      {categories.map(cat => (
        <TouchableOpacity key={cat} onPress={() => setFormData({...formData, category: cat})} className={`px-3 py-2 rounded-xl border ${formData.category === cat ? 'bg-orange-500 border-orange-500' : 'bg-white border-gray-200'}`}>
          <Text className={`text-xs font-bold ${formData.category === cat ? 'text-white' : 'text-gray-600'}`}>{cat}</Text>
        </TouchableOpacity>
      ))}
    </View>

    <Text className="font-bold text-xs text-gray-700 mb-2">Documentos Legales</Text>
    <View className="flex-row gap-3 mb-6">
      <TouchableOpacity onPress={() => pickDocument(setLicenciaFile)} className={`flex-1 flex-col items-center justify-center p-3 border-2 border-dashed rounded-xl ${licenciaFile ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-gray-50'}`}>
        {licenciaFile ? <FileCheck2 color="#16a34a" size={20} /> : <Upload color="#6b7280" size={20} />}
        <Text className="text-[10px] font-bold text-gray-600 text-center mt-1">{licenciaFile ? 'Licencia Lista' : 'Subir Licencia'}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => pickDocument(setSanidadFile)} className={`flex-1 flex-col items-center justify-center p-3 border-2 border-dashed rounded-xl ${sanidadFile ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-gray-50'}`}>
        {sanidadFile ? <FileCheck2 color="#16a34a" size={20} /> : <Upload color="#6b7280" size={20} />}
        <Text className="text-[10px] font-bold text-gray-600 text-center mt-1">{sanidadFile ? 'Carnet Listo' : 'Subir Carnet'}</Text>
      </TouchableOpacity>
    </View>
  </View>
)}

          {step === 4 && (
            <View>
              <View className="items-center mb-6">
                <Text className="font-bold text-gray-400 text-xs tracking-widest mb-1 uppercase">Paso 4 de 4</Text>
                <Text className="font-black text-2xl text-gray-900 text-center">Datos Financieros</Text>
              </View>
              
              <View className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 mb-4">
                <Text className="text-emerald-800 text-xs font-medium">
                  <Text className="font-bold">Importante: </Text>
                  La cuenta debe estar a nombre de {formData.razonSocial || 'la empresa'} o del Representante Legal.
                </Text>
              </View>

              <View className="w-full bg-gray-100 rounded-2xl flex-row items-center px-4 h-14 mb-6">
                <CreditCard color="#059669" size={20} />
                <TextInput maxLength={20} placeholder="CCI (20 dígitos)" value={formData.cci} onChangeText={t => setFormData({...formData, cci: t.replace(/[^0-9]/g, '')})} keyboardType="numeric" className="flex-1 ml-3 text-sm font-medium text-gray-800" />
              </View>
            </View>
          )}

          <TouchableOpacity 
            onPress={() => {
              if (step < 4) setStep(step + 1);
              else handleFirebaseRegister();
            }}
            disabled={isLoading}
            className={`w-full py-4 rounded-2xl shadow-lg items-center flex-row justify-center gap-2 ${isLoading ? 'opacity-70' : ''} ${step === 1 ? 'bg-[#90C659]' : step === 2 ? 'bg-blue-500' : step === 3 ? 'bg-orange-500' : 'bg-emerald-600'}`}
          >
            {isLoading && <ActivityIndicator color="white" size="small" />}
            <Text className="text-white font-bold uppercase tracking-wider">
              {isLoading ? loadingText : step < 4 ? 'Continuar' : 'Finalizar Registro'}
            </Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </View>
  );
}