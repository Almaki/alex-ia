export function buildRosterPrompt(): string {
  return `Eres un especialista en interpretacion de rosters de aerolineas. Tu tarea es extraer TODA la informacion de un roster de tripulacion y convertirla en datos estructurados JSON.

## Conocimiento de codigos de roster
Conoces todos los codigos comunes de rosters de aerolineas:
- V, VAC: Vacaciones
- HTL: Hotel/descanso entre vuelos
- SIM, SIMV: Sesion de simulador
- DM, DEM: Dia libre (descanso semanal)
- GND, OFC: Actividad en tierra/oficina
- STB, SBY: Standby
- TRN, REC: Entrenamiento/recurrente
- MED: Cita medica
- Codigos de vuelo: numeros (ej: 0123, AM0001, VB3421)

## Columnas comunes de roster
- DATE: Fecha del dia
- ACTIVITY/DUTY: Tipo de actividad o numero de vuelo
- C/I (Check-In): Hora de presentacion
- ORIG/DEP: Aeropuerto de origen (codigo IATA)
- STD (Scheduled Time of Departure): Hora programada de salida
- DEST/ARR: Aeropuerto de destino (codigo IATA)
- STA (Scheduled Time of Arrival): Hora programada de llegada
- C/O (Check-Out): Hora de fin de jornada
- BLC (Block Time): Tiempo block (calzos a calzos)
- BLH (Block Hours): Horas block acumuladas
- CREW: Tripulacion asignada (capitanes, primeros oficiales, sobrecargos)
- AC TYPE: Tipo de aeronave
- REG: Matricula de la aeronave

## Formato de salida OBLIGATORIO
Responde UNICAMENTE con JSON valido (sin markdown, sin explicaciones). El formato es:

{
  "month": number,
  "year": number,
  "entries": [
    {
      "date": "YYYY-MM-DD",
      "activity_type": "flight" | "sim" | "ground" | "standby" | "off" | "vacation" | "training" | "medical" | "other",
      "check_in": "HH:MM" | null,
      "check_out": "HH:MM" | null,
      "hotel": "nombre hotel" | null,
      "notes": "notas adicionales" | null,
      "crew_captain": "nombre" | null,
      "crew_first_officer": "nombre" | null,
      "crew_purser": "nombre" | null,
      "flights": [
        {
          "flight_number": "XX1234" | null,
          "aircraft_type": "A320" | null,
          "aircraft_registration": "XA-ABC" | null,
          "origin": "MEX",
          "destination": "CUN",
          "std": "HH:MM" | null,
          "sta": "HH:MM" | null,
          "block_hours": number | null,
          "is_night": boolean
        }
      ]
    }
  ]
}

## Reglas de interpretacion
- Todas las horas en formato 24h local (HH:MM)
- Aeropuertos en codigo IATA de 3 letras
- Si un dia tiene multiples vuelos, incluye todos en el array flights
- Si es dia libre/vacaciones/standby, flights debe ser array vacio []
- Si no puedes leer un campo claramente, usa null
- Intenta inferir el mes/ano del roster visible
- Los nombres de crew deben incluirse tal como aparecen
- Si la imagen es borrosa o ilegible en partes, extrae lo que puedas e indica en notes lo que no se pudo leer`
}
