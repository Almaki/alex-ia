# BUSINESS_LOGIC.md - AlexIA

> Generado por SaaS Factory | Fecha: 2026-01-28

## 1. Problema de Negocio

**Dolor:** Pilotos y tripulantes de aviacion en LATAM pierden tiempo valioso buscando informacion tecnica en manuales PDF de cientos de paginas. No existe un asistente tecnico 24/7 en espanol, las apps existentes son genericas y ninguna ofrece voz bidireccional hands-free.

**Dolores especificos:**
1. Manuales densos, desactualizados y dificiles de navegar (500+ paginas)
2. No existe asistente tecnico 24/7 que hable espanol
3. Pilotos memorizan datos que olvidan cuando mas los necesitan
4. Apps existentes (Clever Crew, Pocket Brief) son genericas, no personalizadas
5. Nada ofrece voz bidireccional para usar sin manos en layovers/crew room

**Costo actual:**
- **Tiempo:** ~8-12 horas/mes por piloto en busquedas ineficientes (45 min/dia)
- **Dinero:** Re-entrenamiento por checkrides reprobados $500-2,000 USD; apps genericas $40-60/mes sin resolver el problema
- **Frustracion:** Estres en briefings, verguenza frente a colegas, ansiedad pre-examenes
- **Seguridad operacional:** Decisiones con info incompleta, procedimientos de memoria, NOTAMs perdidos
- **ROI:** Piloto promedio pierde $660 USD/mes en tiempo. AlexIA Premium cuesta $28.99/mes = ROI 22x

## 2. Solucion

**Propuesta de valor:** Un asistente de aviacion con IA y voz bidireccional que responde preguntas tecnicas de manuales en segundos para pilotos y tripulantes de LATAM.

**Flujos principales:**

### Flujo 1: Onboarding
1. Usuario encuentra bot (Telegram/WhatsApp/Web)
2. Bienvenida y seleccion de flota (A320, B737, E190, ATR, etc.)
3. Acepta terminos y aviso de privacidad
4. Cuenta Freemium creada
5. Primera query de prueba

### Flujo 2: Query Texto (todos los tiers)
1. Usuario escribe pregunta
2. Sistema verifica limite de uso (fair use)
3. RAG busca en manuales de la flota del usuario
4. LLM genera respuesta precisa con referencia al manual
5. Respuesta entregada + query loggeada

### Flujo 3: Query Voz Entrada (Pro+)
1. Usuario envia audio
2. Whisper transcribe a texto
3. Flujo igual que texto
4. Respuesta en texto

### Flujo 4: Query Voz Bidireccional (Premium)
1. Usuario envia audio
2. Whisper transcribe a texto
3. RAG + LLM genera respuesta
4. TTS genera audio de la respuesta
5. Envia audio + texto al usuario

### Flujo 5: Upgrade/Monetizacion
1. Usuario alcanza limite Freemium
2. Mensaje de upgrade con planes
3. Selecciona plan (Pro $18.99 / Premium $28.99)
4. Pago via Mercado Pago / PayPal
5. Webhook confirma → tier actualizado

### Flujo 6: Fair Use
1. Query llega → verificar contador diario
2. Si < soft limit: continuar normal
3. Si > soft limit < hard limit: aviso + continuar
4. Si >= hard limit: bloquear hasta reset diario

### Flujo 7: Deteccion de Abuso
1. Query llega → verificar IP/ubicacion
2. Si "viaje imposible" (uso desde multiples ubicaciones simultaneas)
3. Strike +1
4. Si 3 strikes → suspender cuenta

## 3. Usuario Objetivo

**Rol:** Pilotos y Sobrecargos de aerolineas mexicanas y LATAM

**Perfil:**
- Edad: 25-55 anos
- Flotas: A320, B737, E190, ATR, etc.
- Idioma: Espanol (algunos bilingues)
- Dispositivo: 95% movil (iPhone/Android), usan Telegram y WhatsApp
- Contexto: En vuelo, layovers, crew room, hoteles, estudiando en casa

**Segmentos:**
1. **Capitanes:** Respuestas rapidas para briefings y decisiones
2. **Primeros Oficiales:** Estudian para upgrade, memorizan datos
3. **Sobrecargos:** Procedimientos de emergencia, servicio, regulaciones
4. **Estudiantes:** Examenes de licencia o tipo de aeronave

**Comportamiento:**
- ~20-30 consultas/dia promedio
- Valoran respuestas cortas y precisas
- Quieren voz cuando tienen manos ocupadas
- Dispuestos a pagar $20-30 USD/mes si el valor es claro

## 4. Arquitectura de Datos

**Input:**
- Queries de texto (Telegram, WhatsApp, Web)
- Audio de voz (notas de voz)
- Manuales PDF por flota (admin upload)
- Datos de registro (flota, posicion, email)

**Output:**
- Respuestas de texto con referencia a manuales
- Audio TTS de respuestas (Premium)
- Dashboard de metricas (admin)
- Historial de consultas por usuario

**Storage (Supabase tables sugeridas):**
- `profiles`: telegram_id, whatsapp_number, nombre, email, flota, posicion, tier, created_at
- `subscriptions`: user_id, tier, start_date, renewal_date, payment_method, status
- `queries`: user_id, question, answer, source_reference, response_time_ms, satisfaction, created_at
- `usage_daily`: user_id, date, text_queries, voice_queries, total_queries
- `fleet_documents`: fleet_type, document_name, chunk_id, embedding, content, source_page
- `abuse_log`: user_id, event_type, ip_address, location, strike_count, created_at
- `payments`: user_id, amount, currency, provider, transaction_id, status, created_at

**Datos sensibles (encriptados):**
- Nada de credenciales de aerolineas
- Nada de informacion de vuelos reales
- Solo info tecnica de manuales

**Cumplimiento:**
- LFPDPPP (Mexico)
- Aviso de privacidad
- Consentimiento expreso
- Derechos ARCO

## 5. KPIs de Exito

**North Star Metric:** Queries exitosas por usuario activo por semana

**Adquisicion:**
- Nuevos usuarios/dia
- Conversion Freemium → Pro → Premium
- CAC por canal

**Engagement:**
- DAU / WAU / MAU
- Queries por usuario por dia
- Retencion D1, D7, D30

**Monetizacion:**
- MRR total
- ARPU por tier
- Churn rate mensual
- LTV / CAC ratio

**Producto:**
- Tiempo de respuesta promedio (target: < 3 segundos)
- Tasa de satisfaccion (thumbs up/down)
- Preguntas sin respuesta del RAG
- Uso de voz vs texto

**Abuso:**
- Usuarios en soft/hard limit
- Strikes emitidos
- Cuentas suspendidas

## 6. Modelo de Precios

### Planes

| Tier | Mensual | Anual | Queries/dia | Voz Entrada | Voz Salida | Historial |
|------|---------|-------|-------------|-------------|------------|-----------|
| **Freemium** | $0 | - | ~5-10 | No | No | 7 dias |
| **Pro** | $18.99/mes | $189.99/ano | ~50-100 | Si | No | 30 dias |
| **Premium** | $28.99/mes | $289.99/ano | ~200+ | Si | Si (TTS) | Ilimitado |

### Trial (Prueba Gratuita)
- **Duracion:** 3 dias con acceso Premium
- **Limites durante trial:** 15 queries/dia + 5 audios Alexia/dia
- **Objetivo:** Demostrar valor antes del paywall

### Proyeccion de Ingresos
- **Escenario base (100 usuarios pagos):**
  - Mix estimado: 60% Pro + 40% Premium
  - Ingreso bruto: ~$2,299/mes
  - Costos operativos (APIs, infra): ~$1,858/mes
  - **Ingreso neto estimado: ~$441/mes**
- **Break-even:** ~80-100 usuarios pagos
- **Meta Year 1:** 500+ usuarios pagos

## 7. Ventajas Competitivas

1. **Nicho ultra-especifico:** Unico asistente de IA enfocado exclusivamente en aviacion para LATAM en espanol
2. **Voz bidireccional hands-free:** Ninguna app de aviacion ofrece STT + TTS integrado para uso sin manos
3. **RAG sobre manuales reales:** Respuestas basadas en documentacion oficial de cada flota, no en conocimiento generico
4. **Contexto por flota:** Personalizado por tipo de aeronave (A320, B737, E190, ATR), no one-size-fits-all
5. **Precio accesible para LATAM:** $18.99-$28.99 USD/mes vs $40-60/mes de alternativas genericas que no resuelven el problema
6. **Multi-canal nativo:** Telegram + WhatsApp + Web, los canales que ya usan los pilotos diariamente

## 8. Riesgos y Mitigaciones

| # | Riesgo | Impacto | Mitigacion |
|---|--------|---------|------------|
| 1 | **Calidad RAG insuficiente** | Respuestas incorrectas → perdida de confianza | Testing extensivo con pilotos reales, feedback loop, mejora continua de embeddings |
| 2 | **Costos de API escalados** | Margen negativo con muchos usuarios | Rate limiting por tier, cache de respuestas frecuentes, modelos eficientes (Gemini 2.5 Flash) |
| 3 | **Regulaciones aeronauticas** | Liability por informacion incorrecta | Disclaimer claro: "Solo referencia, no reemplaza documentacion oficial", no operational decisions |
| 4 | **Comparticion de cuentas** | Perdida de ingresos | Deteccion de "viaje imposible", sistema de strikes, suspension automatica |
| 5 | **Competencia de grandes players** | OpenAI/Google lanzan asistente aviation | First-mover advantage en LATAM/espanol, comunidad, datos especializados |
| 6 | **Dependencia de proveedores** | API de LLM cambia precios/terminos | Arquitectura multi-provider via OpenRouter, fallback entre modelos |
| 7 | **Adopcion lenta** | No alcanzar break-even | Trial gratuito, referral program, partnerships con escuelas de aviacion |

## 9. Especificacion Tecnica (Para el Agente)

### Features a Implementar (Feature-First)
```
src/features/
├── auth/               # Autenticacion Email/Password (Supabase) + Dashboard admin
├── chat/               # Chat con IA - texto query/response
├── voice/              # Voz bidireccional (Whisper + TTS)
├── rag/                # RAG pipeline - busqueda en manuales
├── subscription/       # Planes, pagos, fair use
├── fleet-management/   # Gestion de flotas y documentos (admin)
├── analytics/          # Dashboard de metricas y KPIs
├── abuse-detection/    # Anti-comparticion, strikes, suspensiones
└── onboarding/         # Flujo de registro y seleccion de flota
```

### Stack Confirmado
- **Frontend:** Next.js 16 + React 19 + TypeScript + Tailwind 3.4
- **Backend:** Supabase (Auth + Database + Storage + Edge Functions)
- **IA/LLM:** Gemini 2.5 Flash (Google AI) - modelo principal por costo-eficiencia
- **Orquestador:** Moltbot (orquestacion de bots multi-canal)
- **RAG:** Embeddings + pgvector (Supabase) + chunking de PDFs
- **Voz:** Whisper (STT) + TTS (ElevenLabs o similar)
- **Mensajeria:** Telegram Bot API + WhatsApp Business API
- **Pagos:** Mercado Pago + PayPal
- **Hosting:** VPS Hostinger (backend/servicios) + Vercel (frontend)
- **Validacion:** Zod
- **State:** Zustand (si necesario)
- **MCPs:** Next.js DevTools + Playwright + Supabase

### Proximos Pasos
1. [ ] Configurar Supabase (tablas, RLS, storage)
2. [ ] Implementar Auth (email/password para dashboard admin)
3. [ ] Feature: onboarding (registro + seleccion de flota)
4. [ ] Feature: rag (pipeline de procesamiento de PDFs + embeddings)
5. [ ] Feature: chat (query texto con RAG)
6. [ ] Feature: voice (Whisper STT + TTS)
7. [ ] Feature: subscription (planes, pagos, fair use)
8. [ ] Feature: fleet-management (admin upload de manuales)
9. [ ] Feature: analytics (dashboard de metricas)
10. [ ] Feature: abuse-detection (fair use + anti-comparticion)
11. [ ] Integracion Telegram Bot
12. [ ] Integracion WhatsApp Business
13. [ ] Testing E2E
14. [ ] Deploy Vercel + Supabase Production
