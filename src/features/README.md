# Features - Arquitectura Feature-First

Cada feature es **autocontenida** y contiene toda la lógica relacionada.

## Estructura Estándar

Usa `.template/` como base para nuevas features:

```bash
cp -r src/features/.template src/features/mi-nueva-feature
```

## Features del Proyecto AlexIA

### `auth/`
Autenticacion y gestion de sesiones con Supabase.
- Login/Signup con Email/Password (dashboard admin)
- Gestion de sesion
- Proteccion de rutas

### `chat/`
Chat con IA - query/response de texto.
- Interfaz de chat con el asistente
- Integracion con RAG para respuestas basadas en manuales
- Historial de consultas

### `voice/`
Voz bidireccional (Pro y Premium).
- Whisper STT (transcripcion de audio a texto)
- TTS (generacion de audio de respuestas, solo Premium)
- Integracion hands-free

### `rag/`
RAG pipeline - busqueda en manuales de aviacion.
- Procesamiento y chunking de PDFs
- Embeddings con pgvector (Supabase)
- Busqueda semantica por flota

### `subscription/`
Planes, pagos y fair use.
- 3 tiers: Freemium ($0), Pro ($18.99/mes o $189.99/ano), Premium ($28.99/mes o $289.99/ano)
- Trial gratuito de 3 dias con acceso Premium
- Integracion Mercado Pago + PayPal
- Rate limiting por tier

### `fleet-management/`
Gestion de flotas y documentos (admin).
- Upload de manuales PDF por flota (A320, B737, E190, ATR)
- Procesamiento y indexacion de documentos

### `analytics/`
Dashboard de metricas y KPIs.
- North Star Metric: queries exitosas por usuario activo por semana
- Metricas de adquisicion, engagement, monetizacion
- Dashboard admin

### `abuse-detection/`
Anti-comparticion, strikes y suspensiones.
- Deteccion de "viaje imposible" (uso desde multiples ubicaciones)
- Sistema de strikes (3 strikes = suspension)
- Fair use enforcement

### `onboarding/`
Flujo de registro y seleccion de flota.
- Bienvenida y seleccion de flota
- Aceptacion de terminos y privacidad
- Primera query de prueba

### `dashboard/`
Dashboard principal de la aplicacion.
- Navegacion principal
- Widgets y stats
- Layout del dashboard

## Principios Feature-First

1. **Colocalización**: Todo relacionado vive junto
2. **Autocontenido**: Cada feature debe funcionar independientemente
3. **No dependencias circulares**: Features no importan de otras features
4. **Usar `shared/`**: Para código reutilizable entre features

## Ejemplo: Agregar nueva feature "profile"

```bash
# 1. Copiar template
cp -r src/features/.template src/features/profile

# 2. Crear componentes
# src/features/profile/components/ProfileCard.tsx
# src/features/profile/components/EditProfileForm.tsx

# 3. Crear hooks
# src/features/profile/hooks/useProfile.ts

# 4. Crear services
# src/features/profile/services/profileService.ts

# 5. Crear types
# src/features/profile/types/Profile.ts

# 6. Crear store (si necesario)
# src/features/profile/store/profileStore.ts
```

## Reglas de Oro

- ✅ **Sí**: `features/auth/components/LoginForm.tsx` importa de `shared/components/Button.tsx`
- ❌ **No**: `features/auth/` importa de `features/dashboard/`
- ✅ **Sí**: Cada feature tiene su propio store local (Zustand)
- ❌ **No**: Estado global innecesario
