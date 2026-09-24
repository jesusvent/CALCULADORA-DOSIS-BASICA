// Calculadora de Dosis Veterinaria — © 2026 Jesús Ventura. Todos los derechos reservados.
// Software propietario — ver LICENSE en la raíz del repositorio. Prohibida su copia,
// modificación, distribución o reutilización, total o parcial, sin autorización por escrito.
//
// Base de datos de fármacos veterinarios (perro y gato).
// IMPORTANTE: datos orientativos de ejemplo. Verifica siempre con una fuente
// actualizada (ej. Plumb's Veterinary Drug Handbook) antes de administrar.
//
// Estructura de cada entrada:
// {
//   id: identificador único
//   principioActivo: nombre del principio activo (se usa también para buscar en CIMAVET)
//   nombresComerciales: [lista de nombres comerciales conocidos en España/UE]
//   categoria: familia terapéutica (para mostrar contexto)
//   indicaciones: [lista de indicaciones clínicas habituales] (se usa para el buscador de PubMed)
//   especies: {
//     perro: { dosisMin, dosisMax, unidad ('mg/kg', 'mcg/kg' o 'UI/kg'), via, frecuencia, dosisMaxima (opcional, en la unidad total), notas },
//     gato:  { ... }  // si una especie no está soportada, se omite la clave
//   }
// }

// Fecha/hora y número de versión del último cambio de CONTENIDO en este archivo (fármaco o
// protocolo añadido/editado). Se actualizan solos: el hook de git en hooks/pre-commit detecta
// cualquier cambio real en este archivo (aparte de estas dos líneas) y al confirmar el commit
// pone la hora actual y suma 1 a VERSION_BD — no hace falta tocarlos a mano. Ambos se muestran
// en la cabecera de la app para que, comparándolos entre dos ordenadores, cualquiera pueda
// saber si su copia de la base de datos compartida está al día.
const ULTIMA_ACTUALIZACION_BD = "2026-09-24T09:25:14";
const VERSION_BD = 1;

const DRUGS = [
  {
    id: "amoxicilina-clavulanico",
    principioActivo: "Amoxicilina/Ácido clavulánico",
    nombresComerciales: ["Synulox", "Clavaseptin", "Augmentin (uso humano)"],
    categoria: "Antibiótico (betalactámico)",
    indicaciones: ["Infección bacteriana", "Infección cutánea", "Infección respiratoria"],
    especies: {
      perro: { dosisMin: 12.5, dosisMax: 25, unidad: "mg/kg", via: "VO", frecuencia: "cada 12 h", notas: "Con alimento para reducir molestias digestivas." },
      gato:  { dosisMin: 12.5, dosisMax: 25, unidad: "mg/kg", via: "VO", frecuencia: "cada 12 h", notas: "Con alimento para reducir molestias digestivas." }
    }
  },
  {
    id: "amoxicilina",
    principioActivo: "Amoxicilina",
    nombresComerciales: ["Clamoxyl"],
    categoria: "Antibiótico (betalactámico)",
    indicaciones: ["Infección bacteriana"],
    especies: {
      perro: { dosisMin: 10, dosisMax: 20, unidad: "mg/kg", via: "VO/SC", frecuencia: "cada 12-24 h", notas: "" },
      gato:  { dosisMin: 10, dosisMax: 20, unidad: "mg/kg", via: "VO/SC", frecuencia: "cada 12-24 h", notas: "" }
    }
  },
  {
    id: "amoxicilina-retard",
    principioActivo: "Amoxicilina (retard/depot)",
    nombresComerciales: ["Amoxoil Retard"],
    categoria: "Antibiótico (betalactámico, liberación prolongada)",
    indicaciones: ["Profilaxis prequirúrgica", "Infección bacteriana"],
    especies: {
      perro: { dosisMin: 15, dosisMax: 15, unidad: "mg/kg", via: "IM", frecuencia: "cada 48 h", notas: "Formulación de liberación prolongada (150 mg/ml); no confundir con la dosis oral estándar de amoxicilina." },
      gato:  { dosisMin: 15, dosisMax: 15, unidad: "mg/kg", via: "IM", frecuencia: "cada 48 h", notas: "Misma dosis que en perros (formulación de liberación prolongada, 150 mg/ml)." }
    }
  },
  {
    id: "enrofloxacina",
    principioActivo: "Enrofloxacina",
    nombresComerciales: ["Baytril"],
    categoria: "Antibiótico (fluoroquinolona)",
    indicaciones: ["Infección bacteriana", "Infección urinaria"],
    especies: {
      perro: { dosisMin: 5, dosisMax: 20, unidad: "mg/kg", via: "VO/SC", frecuencia: "cada 24 h", notas: "Evitar en cachorros en crecimiento (riesgo de lesión del cartílago)." },
      gato:  { dosisMin: 5, dosisMax: 5, unidad: "mg/kg", via: "VO/SC", frecuencia: "cada 24 h", dosisMaxima: 50, notas: "No superar 5 mg/kg/día: riesgo de degeneración retiniana/ceguera en gatos." }
    }
  },
  {
    id: "metronidazol",
    principioActivo: "Metronidazol",
    nombresComerciales: ["Flagyl (uso humano)", "Metronidazol Normon", "Metrobactin"],
    categoria: "Antibiótico/Antiprotozoario",
    indicaciones: ["Infección bacteriana anaerobia", "Diarrea", "Giardiasis"],
    especies: {
      perro: { dosisMin: 10, dosisMax: 25, unidad: "mg/kg", via: "VO", frecuencia: "cada 12 h", notas: "" },
      gato:  { dosisMin: 10, dosisMax: 15, unidad: "mg/kg", via: "VO", frecuencia: "cada 12-24 h", notas: "" }
    }
  },
  {
    id: "meloxicam",
    principioActivo: "Meloxicam",
    nombresComerciales: ["Metacam", "Loxicom"],
    categoria: "AINE",
    indicaciones: ["Dolor", "Inflamación", "Osteoartritis", "Dolor postquirúrgico"],
    especies: {
      perro: { dosisMin: 0.1, dosisMax: 0.2, unidad: "mg/kg", via: "VO/SC", frecuencia: "cada 24 h (dosis inicial 0.2, mantenimiento 0.1)", notas: "No combinar con otros AINEs ni corticoides. Con alimento." },
      gato:  { dosisMin: 0.05, dosisMax: 0.1, unidad: "mg/kg", via: "VO/SC", frecuencia: "cada 24 h (dosis inicial única, luego reducir)", notas: "Uso crónico solo dosis de mantenimiento muy bajas; vigilar función renal." }
    }
  },
  {
    id: "paracetamol",
    principioActivo: "Paracetamol",
    nombresComerciales: ["Perfalgan (uso humano)", "Gelocatil (uso humano)", "Apiretal (uso humano)"],
    categoria: "Analgésico/antipirético (no AINE clásico)",
    indicaciones: ["Dolor", "Dolor postquirúrgico", "Fiebre"],
    especies: {
      perro: { dosisMin: 10, dosisMax: 15, unidad: "mg/kg", via: "VO/IV lenta (>15 min)", frecuencia: "cada 8-12 h", notas: "Uso off-label: preparados de uso humano, no autorizado como medicamento veterinario en España. Suele combinarse con opioides u otros analgésicos para dolor moderado-severo (analgesia multimodal). No combinar con AINEs sin valorar el riesgo gastrointestinal/renal conjunto. NUNCA administrar a gatos." },
      gato:  { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "-", frecuencia: "-", notas: "⚠ CONTRAINDICADO EN GATOS: carecen de la enzima (glucuronil-transferasa) necesaria para metabolizarlo con seguridad. Causa metahemoglobinemia, daño hepático y puede ser mortal incluso a dosis bajas. No existe una dosis segura." }
    }
  },
  {
    id: "carprofeno",
    principioActivo: "Carprofeno",
    nombresComerciales: ["Rimadyl", "Vetprofen"],
    categoria: "AINE",
    indicaciones: ["Dolor", "Inflamación", "Osteoartritis", "Dolor postquirúrgico"],
    especies: {
      perro: { dosisMin: 2, dosisMax: 4, unidad: "mg/kg", via: "VO/SC", frecuencia: "cada 12-24 h", notas: "No combinar con otros AINEs ni corticoides." }
      // No indicado habitualmente en gato (uso puntual controlado): se omite por seguridad.
    }
  },
  {
    id: "acido-tolfenamico",
    principioActivo: "Ácido tolfenámico",
    nombresComerciales: ["Tolfedine", "Algenamic", "Tolfelab", "Tolfenil", "Tolfedian", "Tolfedol"],
    categoria: "AINE",
    indicaciones: ["Dolor postquirúrgico", "Infección respiratoria alta"],
    especies: {
      perro: { dosisMin: 4, dosisMax: 4, unidad: "mg/kg", via: "IM/SC", frecuencia: "dosis única, repetible a las 24 h", notas: "Prevención del dolor postoperatorio: dosis única IM 1 h antes de la inducción anestésica. No combinar con otros AINEs ni corticoides. Fuente: ficha técnica CIMAVET (Tolfedine, nº registro 792 ESP)." },
      gato:  { dosisMin: 4, dosisMax: 4, unidad: "mg/kg", via: "SC (no usar vía IM en gatos)", frecuencia: "dosis única, repetible a las 24 h", notas: "Coadyuvante en enfermedad de vías respiratorias altas, junto con tratamiento antimicrobiano. No combinar con otros AINEs ni corticoides. Fuente: ficha técnica CIMAVET (Tolfedine, nº registro 792 ESP)." }
    }
  },
  {
    id: "domperidona",
    principioActivo: "Domperidona",
    nombresComerciales: ["Leisguard"],
    categoria: "Inmunoestimulante",
    indicaciones: ["Prevención de leishmaniosis"],
    especies: {
      perro: { dosisMin: 0.5, dosisMax: 0.5, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h, durante 4 semanas consecutivas", notas: "Reduce el riesgo de infección activa/enfermedad clínica tras contacto con Leishmania infantum, mediante estimulación de la inmunidad celular (no es un uso gastrointestinal/procinético clásico). Fuente: ficha técnica CIMAVET (Leisguard, nº registro 2383 ESP)." }
    }
  },
  {
    id: "metergolina",
    principioActivo: "Metergolina",
    nombresComerciales: ["Contralac"],
    categoria: "Inhibidor de la prolactina",
    indicaciones: ["Pseudogestación", "Supresión de la lactación"],
    especies: {
      perro: { dosisMin: 0.2, dosisMax: 0.2, unidad: "mg/kg", via: "VO", frecuencia: "al día, repartido en 2 tomas", notas: "Solo en perras. Supresión de la lactación posparto y de otras manifestaciones de pseudogestación. Fuente: ficha técnica CIMAVET (Contralac, nº registro 809 ESP)." }
    }
  },
  {
    id: "apomorfina",
    principioActivo: "Apomorfina",
    nombresComerciales: ["Apovomin", "Emedog"],
    categoria: "Emético",
    indicaciones: ["Inducción del vómito"],
    especies: {
      perro: { dosisMin: 0.1, dosisMax: 0.1, unidad: "mg/kg", via: "SC", frecuencia: "dosis única", notas: "Solo perros; una única administración por vía subcutánea. Fuente: ficha técnica CIMAVET (Apovomin 1 mg/ml, nº registro 3970 ESP)." }
    }
  },
  {
    id: "etamsilato",
    principioActivo: "Etamsilato",
    nombresComerciales: ["Hemo", "Hemosilate"],
    categoria: "Hemostático",
    indicaciones: ["Hemorragia quirúrgica", "Hemorragia postraumática"],
    especies: {
      perro: { dosisMin: 5, dosisMax: 12.5, unidad: "mg/kg", via: "IM/IV", frecuencia: "según gravedad del proceso hemorrágico", notas: "Fuente: ficha técnica CIMAVET (Hemosilate, nº registro 3647 ESP)." },
      gato:  { dosisMin: 5, dosisMax: 12.5, unidad: "mg/kg", via: "IM/IV", frecuencia: "según gravedad del proceso hemorrágico", notas: "Fuente: ficha técnica CIMAVET (Hemosilate, nº registro 3647 ESP)." }
    }
  },
  {
    id: "pentobarbital",
    principioActivo: "Pentobarbital",
    nombresComerciales: ["Dolethal", "Euthasol", "Exagon", "Euthanimal"],
    categoria: "Barbitúrico (eutanasia)",
    indicaciones: ["Eutanasia"],
    especies: {
      perro: { dosisMin: 133, dosisMax: 133, unidad: "mg/kg", via: "IV (o intracardiaca tras sedación/anestesia profunda)", frecuencia: "dosis única", notas: "Exclusivamente para eutanasia. Administración endovenosa rápida; usar catéter para evitar extravasación. Fuente: ficha técnica CIMAVET (Dolethal, nº registro 737 ESP)." },
      gato:  { dosisMin: 133, dosisMax: 133, unidad: "mg/kg", via: "IV (o intracardiaca tras sedación/anestesia profunda)", frecuencia: "dosis única", notas: "Exclusivamente para eutanasia. Administración endovenosa rápida; usar catéter para evitar extravasación. Fuente: ficha técnica CIMAVET (Dolethal, nº registro 737 ESP)." }
    }
  },
  {
    id: "fentanilo",
    principioActivo: "Fentanilo",
    nombresComerciales: ["Fentadon"],
    categoria: "Analgésico opioide",
    indicaciones: ["Analgesia intraoperatoria", "Dolor postquirúrgico"],
    especies: {
      perro: { dosisMin: 5, dosisMax: 10, unidad: "mcg/kg", via: "IV", frecuencia: "bolo lento; puede seguirse de infusión continua", notas: "Solo perros. Tras el bolo, infusión continua de 12-24 microgramos/kg/h para analgesia intraoperatoria, o 6-10 microgramos/kg/h en postoperatorio ya sedado (calcúlala en la pestaña CRI). Margen de seguridad estrecho: medir la dosis con exactitud. Fuente: ficha técnica CIMAVET (Fentadon, nº registro 2519 ESP)." }
    }
  },
  {
    id: "propentofilina",
    principioActivo: "Propentofilina",
    nombresComerciales: ["Karsivan", "Vitofyllin", "Canergy"],
    categoria: "Vasodilatador (geriátrico/cognitivo)",
    indicaciones: ["Disfunción cognitiva", "Mala circulación cerebral/periférica en el perro geriátrico"],
    especies: {
      perro: { dosisMin: 6, dosisMax: 10, unidad: "mg/kg", via: "VO", frecuencia: "al día, dividido en 2 tomas", notas: "Mejora signos de apatía y letargia asociados a mala circulación cerebral/periférica en perros geriátricos. Fuente: ficha técnica CIMAVET (Karsivan, nº registro 1055 ESP)." }
    }
  },
  {
    id: "ketoconazol",
    principioActivo: "Ketoconazol",
    nombresComerciales: ["Fungiconazol"],
    categoria: "Antifúngico (imidazol)",
    indicaciones: ["Dermatomicosis"],
    especies: {
      perro: { dosisMin: 10, dosisMax: 10, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h", notas: "Solo perros. Equivale a 1 comprimido de 200 mg por cada 20 kg de peso al día. Para dermatomicosis por Microsporum canis/gypseum y otros dermatofitos sensibles. Fuente: ficha técnica CIMAVET (Fungiconazol, nº registro 3118 ESP)." }
    }
  },
  {
    id: "acido-fusidico-betametasona",
    principioActivo: "Ácido fusídico + Betametasona (gel cutáneo)",
    nombresComerciales: ["Betafuse"],
    categoria: "Antibiótico + corticoide tópico",
    indicaciones: ["Pioderma superficial", "Dermatitis húmeda aguda", "Intertrigo"],
    especies: {
      perro: { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "Cutánea (gel)", frecuencia: "2 veces al día, mínimo 5 días (máximo 7 días)", notas: "Aplicar ~0,5 cm de gel por cada 8 cm² de lesión, cortando el pelo y limpiando la zona antes. Continuar 48 h tras la curación. Fuente: ficha técnica CIMAVET (Betafuse, nº registro 3483 ESP)." }
    }
  },
  {
    id: "acetilcisteina-oftalmica",
    principioActivo: "Acetilcisteína (oftálmica)",
    nombresComerciales: ["Stromease"],
    categoria: "Colirio mucolítico",
    indicaciones: ["Úlcera corneal"],
    especies: {
      perro: { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "Oftálmica (colirio)", frecuencia: "2 gotas, 3-4 veces al día", notas: "Tratamiento de apoyo de úlceras corneales. Fuente: ficha técnica CIMAVET (Stromease, nº registro 4028 ESP)." },
      gato:  { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "Oftálmica (colirio)", frecuencia: "2 gotas, 3-4 veces al día", notas: "Tratamiento de apoyo de úlceras corneales. Fuente: ficha técnica CIMAVET (Stromease, nº registro 4028 ESP)." }
    }
  },
  {
    id: "pentosano-polisulfato",
    principioActivo: "Pentosano polisulfato sódico",
    nombresComerciales: ["Oapent", "Osteopen"],
    categoria: "Condroprotector inyectable",
    indicaciones: ["Osteoartritis", "Enfermedad articular degenerativa"],
    especies: {
      perro: { dosisMin: 3, dosisMax: 3, unidad: "mg/kg", via: "SC", frecuencia: "4 administraciones, con intervalo de 5-7 días entre cada una", notas: "Solo perros adultos con madurez esquelética. Inyección subcutánea aséptica; usar jeringa graduada con precisión. Fuente: ficha técnica CIMAVET (Oapent, nº registro 4521 ESP)." }
    }
  },
  {
    id: "tiletamina-zolazepam",
    principioActivo: "Tiletamina + Zolazepam",
    nombresComerciales: ["Zoletil"],
    categoria: "Anestésico disociativo (combinación)",
    indicaciones: ["Anestesia general"],
    especies: {
      perro: { dosisMin: 7, dosisMax: 25, unidad: "mg/kg", via: "IM (o IV, dosis menor: ver notas)", frecuencia: "dosis única según profundidad requerida (ver notas)", notas: "Dosis del producto total (partes iguales de tiletamina y zolazepam), reconstituido a 100 mg/ml. Vía IM: 7-10 mg/kg (exploración poco dolorosa), 10-15 mg/kg (cirugía menor), 15-25 mg/kg (cirugía mayor). Vía IV: 5 mg/kg, 7,5 mg/kg y 10 mg/kg para esas mismas indicaciones respectivamente. Mantenimiento: 1/3-1/2 de la dosis inicial (aprox. 2,5 mg/kg IV alarga la anestesia 40-60 min). Premedicar con atropina 0,05 mg/kg SC 15 min antes reduce sialorrea/riesgo vagal. Dosis letal descrita: 100 mg/kg IM. Fuente: ficha técnica CIMAVET (Zoletil, nº registro 2570 ESP)." },
      gato:  { dosisMin: 5, dosisMax: 15, unidad: "mg/kg", via: "IM (o IV, dosis menor: ver notas)", frecuencia: "dosis única según profundidad requerida (ver notas)", notas: "Dosis del producto total (partes iguales de tiletamina y zolazepam), reconstituido a 100 mg/ml. Vía IM: 10 mg/kg (exploración poco dolorosa) o 15 mg/kg (cirugía mayor). Vía IV: 5 mg/kg o 7,5 mg/kg para esas mismas indicaciones. Mantenimiento: 1/3-1/2 de la dosis inicial. Premedicar con atropina 0,05 mg/kg SC 15 min antes reduce sialorrea/riesgo vagal. Dosis letal descrita: 100 mg/kg IM. Fuente: ficha técnica CIMAVET (Zoletil, nº registro 2570 ESP)." }
    }
  },
  {
    id: "tiopental",
    principioActivo: "Tiopental",
    nombresComerciales: ["Tiobarbital"],
    categoria: "Barbitúrico (anestésico)",
    indicaciones: ["Inducción anestésica", "Anestesia general de corta duración"],
    especies: {
      perro: { dosisMin: 15, dosisMax: 25, unidad: "mg/kg", via: "IV exclusiva", frecuencia: "dosis única", notas: "Inducción de la narcosis antes de otros anestésicos generales, o anestesia general en intervenciones cortas. Fuente: ficha técnica CIMAVET (Tiobarbital Braun, nº registro 1249 ESP)." },
      gato:  { dosisMin: 15, dosisMax: 25, unidad: "mg/kg", via: "IV exclusiva", frecuencia: "dosis única", notas: "Inducción de la narcosis antes de otros anestésicos generales, o anestesia general en intervenciones cortas. Fuente: ficha técnica CIMAVET (Tiobarbital Braun, nº registro 1249 ESP)." }
    }
  },
  {
    id: "melarsomina",
    principioActivo: "Melarsomina",
    nombresComerciales: ["Immiticide"],
    categoria: "Adulticida (dirofilariosis)",
    indicaciones: ["Dirofilariosis canina"],
    especies: {
      perro: { dosisMin: 2.14, dosisMax: 2.14, unidad: "mg/kg", via: "IM profunda (masas lumbares)", frecuencia: "dos inyecciones separadas 24 h", notas: "Solo perros. Tratamiento de formas adultas de Dirofilaria immitis. Pesar con exactitud; inyectar cada dosis en un lado distinto del animal. Antídoto en sobredosis: dimercaprol (BAL) 3 mg/kg. Fuente: ficha técnica CIMAVET (Immiticide, nº registro 820 ESP)." }
    }
  },
  {
    id: "medroxiprogesterona",
    principioActivo: "Acetato de medroxiprogesterona",
    nombresComerciales: ["Gestovex"],
    categoria: "Progestágeno",
    indicaciones: ["Aplazamiento del celo"],
    especies: {
      perro: { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "VO", frecuencia: "según pauta (ver notas)", notas: "Solo perras. Interrupción/aplazamiento corto del celo: 2 comprimidos de 5 mg/día durante 3-4 días, luego 1 comprimido/día durante 12-14 días (doblar dosis si >15-20 kg), administrado en proestro/estro. Fuente: ficha técnica CIMAVET (Gestovex, nº registro 2398 ESP)." },
      gato:  { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "VO", frecuencia: "según pauta (ver notas)", notas: "Solo gatas. Aplazamiento del celo a largo plazo: 1 comprimido de 5 mg a la semana, administrado durante el anestro. Fuente: ficha técnica CIMAVET (Gestovex, nº registro 2398 ESP)." }
    }
  },
  {
    id: "bencilpenicilina-dihidroestreptomicina",
    principioActivo: "Bencilpenicilina procaína + Dihidroestreptomicina",
    nombresComerciales: ["Cen-A-Pen", "Penivex Complex"],
    categoria: "Antibiótico (betalactámico + aminoglucósido)",
    indicaciones: ["Infección bacteriana"],
    especies: {
      perro: { dosisMin: 20, dosisMax: 20, unidad: "mg/kg", via: "IM", frecuencia: "cada 24 h, durante 3 días consecutivos", notas: "Dosis de cada componente (20 mg/kg de bencilpenicilina procaína + 20 mg/kg de dihidroestreptomicina). Vigilar función renal por el componente aminoglucósido. Fuente: ficha técnica CIMAVET (Cen-A-Pen, nº registro 1013 ESP)." },
      gato:  { dosisMin: 20, dosisMax: 20, unidad: "mg/kg", via: "IM", frecuencia: "cada 24 h, durante 3 días consecutivos", notas: "Dosis de cada componente (20 mg/kg de bencilpenicilina procaína + 20 mg/kg de dihidroestreptomicina). Vigilar función renal por el componente aminoglucósido. Fuente: ficha técnica CIMAVET (Cen-A-Pen, nº registro 1013 ESP)." }
    }
  },
  {
    id: "clortetraciclina-oftalmica",
    principioActivo: "Clortetraciclina (oftálmica)",
    nombresComerciales: ["Ophtocycline"],
    categoria: "Antibiótico oftálmico (tetraciclina)",
    indicaciones: ["Queratitis", "Conjuntivitis", "Blefaritis"],
    especies: {
      perro: { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "Oftálmica (pomada)", frecuencia: "4 veces al día, durante 5 días", notas: "Aplicar 0,5-2 cm de pomada en el saco conjuntival según tamaño del animal. Si no hay mejoría clínica a los 3 días, valorar otro tratamiento. Fuente: ficha técnica CIMAVET (Ophtocycline, nº registro 3586 ESP)." },
      gato:  { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "Oftálmica (pomada)", frecuencia: "4 veces al día, durante 5 días", notas: "Aplicar 0,5-2 cm de pomada en el saco conjuntival según tamaño del animal. Si no hay mejoría clínica a los 3 días, valorar otro tratamiento. Fuente: ficha técnica CIMAVET (Ophtocycline, nº registro 3586 ESP)." }
    }
  },
  {
    id: "gentamicina",
    principioActivo: "Gentamicina",
    nombresComerciales: ["Gentavall", "Gentacalier", "Gentamiciven", "Vetersan Gentamicina"],
    categoria: "Antibiótico (aminoglucósido)",
    indicaciones: ["Infección bacteriana"],
    especies: {
      perro: { dosisMin: 5, dosisMax: 5, unidad: "mg/kg", via: "IM/IV lenta", frecuencia: "cada 12 h, durante 3-4 días", notas: "Vigilar función renal (nefrotoxicidad). Fuente: ficha técnica CIMAVET (Gentavall 40 mg/ml, nº registro 307 ESP)." },
      gato:  { dosisMin: 5, dosisMax: 5, unidad: "mg/kg", via: "IM/IV lenta", frecuencia: "cada 12 h, durante 3-4 días", notas: "Vigilar función renal (nefrotoxicidad). Fuente: ficha técnica CIMAVET (Gentavall 40 mg/ml, nº registro 307 ESP)." }
    }
  },
  {
    id: "tetracosactida",
    principioActivo: "Tetracosactida",
    nombresComerciales: ["Cosacthen"],
    categoria: "Diagnóstico (estimulación ACTH)",
    indicaciones: ["Evaluación de la función corticosuprarrenal"],
    especies: {
      perro: { dosisMin: 0.005, dosisMax: 0.005, unidad: "mg/kg", via: "IV/IM", frecuencia: "dosis única (test de estimulación con ACTH)", notas: "Solo perros. Equivale a 5 microgramos/kg. Fuente: ficha técnica CIMAVET (Cosacthen, nº registro 3872 ESP)." }
    }
  },
  {
    id: "cabergolina",
    principioActivo: "Cabergolina",
    nombresComerciales: ["Kabergovet", "Kaberstop", "Caliergolin", "Finilac", "Galastop", "Lactofin", "Veylactin"],
    categoria: "Inhibidor de la prolactina",
    indicaciones: ["Pseudogestación", "Supresión de la lactación"],
    especies: {
      perro: { dosisMin: 0.005, dosisMax: 0.005, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h, durante 4-6 días", notas: "Equivale a 5 microgramos/kg (0,1 ml/kg de la solución de 50 microgramos/ml). Repetir el ciclo si los signos no se resuelven o recidivan. Fuente: ficha técnica CIMAVET (Kabergovet, nº registro 3968 ESP)." },
      gato:  { dosisMin: 0.005, dosisMax: 0.005, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h, durante 4-6 días", notas: "Equivale a 5 microgramos/kg (0,1 ml/kg de la solución de 50 microgramos/ml). Repetir el ciclo si los signos no se resuelven o recidivan. Fuente: ficha técnica CIMAVET (Kabergovet, nº registro 3968 ESP)." }
    }
  },
  {
    id: "nandrolona",
    principioActivo: "Nandrolona",
    nombresComerciales: ["Myodine"],
    categoria: "Esteroide anabolizante",
    indicaciones: ["Tratamiento anabolizante coadyuvante"],
    especies: {
      perro: { dosisMin: 2, dosisMax: 5, unidad: "mg/kg", via: "SC/IM", frecuencia: "repetible cada 3-4 semanas", notas: "Como laurato de nandrolona. Ajustar dosis según respuesta clínica. Fuente: ficha técnica CIMAVET (Myodine, nº registro 3574 ESP)." },
      gato:  { dosisMin: 2, dosisMax: 5, unidad: "mg/kg", via: "SC/IM", frecuencia: "repetible cada 3-4 semanas", notas: "Como laurato de nandrolona. Ajustar dosis según respuesta clínica. Fuente: ficha técnica CIMAVET (Myodine, nº registro 3574 ESP)." }
    }
  },
  {
    id: "lactulosa",
    principioActivo: "Lactulosa",
    nombresComerciales: ["Laxatract", "Laxasan"],
    categoria: "Laxante osmótico",
    indicaciones: ["Estreñimiento"],
    especies: {
      perro: { dosisMin: 400, dosisMax: 400, unidad: "mg/kg", via: "VO", frecuencia: "al día, repartido en 2-3 tomas; ajustar según respuesta", notas: "Fuente: ficha técnica CIMAVET (Laxatract 667 mg/ml, nº registro 3793 ESP)." },
      gato:  { dosisMin: 400, dosisMax: 400, unidad: "mg/kg", via: "VO", frecuencia: "al día, repartido en 2-3 tomas; ajustar según respuesta", notas: "Fuente: ficha técnica CIMAVET (Laxatract 667 mg/ml, nº registro 3793 ESP)." }
    }
  },
  {
    id: "aglepristona",
    principioActivo: "Aglepristona",
    nombresComerciales: ["Alizin"],
    categoria: "Antiprogestágeno",
    indicaciones: ["Inducción del aborto"],
    especies: {
      perro: { dosisMin: 10, dosisMax: 10, unidad: "mg/kg", via: "SC", frecuencia: "dos veces, con un intervalo de 24 h", notas: "Solo en perras gestantes; inducción del aborto hasta 45 días tras el apareamiento. Administrar en la piel del cuello para evitar reacciones locales. Fuente: ficha técnica CIMAVET (Alizin, nº registro 1539 ESP)." }
    }
  },
  {
    id: "oxitocina",
    principioActivo: "Oxitocina",
    nombresComerciales: ["Facilpart"],
    categoria: "Hormona (oxitócico)",
    indicaciones: ["Inducción al parto", "Inercia uterina", "Eyección láctea"],
    especies: {
      perro: { dosisMin: null, dosisMax: null, unidad: "UI", via: "IV/IM/SC", frecuencia: "-", notas: "Dosis fija por animal, no por kg: obstetricia 5-25 UI; eyección láctea 2-10 UI. Perras. Usar la dosis más baja del rango; repetible tras al menos 30 min si el veterinario lo considera necesario. Fuente: ficha técnica CIMAVET (Facilpart, nº registro 528 ESP)." },
      gato:  { dosisMin: null, dosisMax: null, unidad: "UI", via: "IV/IM/SC", frecuencia: "-", notas: "Dosis fija por animal, no por kg: obstetricia 5-10 UI; eyección láctea 1-10 UI. Gatas. Usar la dosis más baja del rango; repetible tras al menos 30 min si el veterinario lo considera necesario. Fuente: ficha técnica CIMAVET (Facilpart, nº registro 528 ESP)." }
    }
  },
  {
    id: "efedrina",
    principioActivo: "Efedrina",
    nombresComerciales: ["Enurace", "Caniphedrin"],
    categoria: "Simpaticomimético (incontinencia urinaria)",
    indicaciones: ["Incontinencia urinaria"],
    especies: {
      perro: { dosisMin: 2, dosisMax: 2, unidad: "mg/kg", via: "VO", frecuencia: "al día, dividido en 2 tomas (dosis inicial; ajustar según respuesta)", notas: "Solo en perras ovariohisterectomizadas, para incontinencia por incompetencia del esfínter uretral. No superar 5 mg/kg/día. Administrar antes de las comidas con algo de alimento. Fuente: ficha técnica CIMAVET (Enurace 50, nº registro 2074 ESP)." }
    }
  },
  {
    id: "fenilpropanolamina",
    principioActivo: "Fenilpropanolamina",
    nombresComerciales: ["Propalin", "Proin", "Uriphex", "Continenza", "Urilin", "Uristop"],
    categoria: "Simpaticomimético (incontinencia urinaria)",
    indicaciones: ["Incontinencia urinaria"],
    especies: {
      perro: { dosisMin: 1, dosisMax: 1, unidad: "mg/kg", via: "VO", frecuencia: "cada 8 h, con la comida", notas: "Eficacia demostrada en perras ovariohisterectomizadas con incontinencia por incompetencia del esfínter uretral. La absorción mejora en ayunas. Fuente: ficha técnica CIMAVET (Propalin, nº registro 1507 ESP)." }
    }
  },
  {
    id: "otomax",
    principioActivo: "Gentamicina + betametasona + clotrimazol",
    nombresComerciales: ["Otomax"],
    categoria: "Ótico (antibiótico + corticoide + antifúngico)",
    indicaciones: ["Otitis externa"],
    especies: {
      perro: { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "Ótica", frecuencia: "2 veces al día, durante 7 días", notas: "Dosis fija según peso, no por kg: <15 kg → 4 gotas/oído; >15 kg → 8 gotas/oído, dos veces al día. Masajear suavemente la base de la oreja tras aplicar. Fuente: ficha técnica CIMAVET (Otomax, nº registro 1294 ESP)." }
    }
  },
  {
    id: "canaural",
    principioActivo: "Fludrocortisona + framicetina + nistatina + tiabendazol",
    nombresComerciales: ["Canaural"],
    categoria: "Ótico (antibiótico + antifúngico + corticoide)",
    indicaciones: ["Otitis externa", "Dermatitis"],
    especies: {
      perro: { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "Ótica", frecuencia: "2 veces al día, durante 7-14 días", notas: "5-10 gotas en el canal auditivo, dos veces al día. Agitar bien antes de usar; ajustar según la patología. Fuente: ficha técnica CIMAVET (Canaural, nº registro 2448 ESP)." },
      gato:  { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "Ótica", frecuencia: "2 veces al día, durante 7-14 días", notas: "5-10 gotas en el canal auditivo, dos veces al día. Agitar bien antes de usar; ajustar según la patología. Fuente: ficha técnica CIMAVET (Canaural, nº registro 2448 ESP)." }
    }
  },
  {
    id: "aurizon",
    principioActivo: "Marbofloxacina + clotrimazol + dexametasona",
    nombresComerciales: ["Aurizon"],
    categoria: "Ótico (antibiótico + antifúngico + corticoide)",
    indicaciones: ["Otitis externa"],
    especies: {
      perro: { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "Ótica", frecuencia: "una vez al día, durante 7-14 días", notas: "10 gotas en el oído afectado, una vez al día. Agitar bien antes de usar. A los 7 días, valorar si conviene prolongar el tratamiento otra semana. Fuente: ficha técnica CIMAVET (Aurizon, nº registro 1400 ESP)." }
    }
  },
  {
    id: "malaseb",
    principioActivo: "Clorhexidina + miconazol",
    nombresComerciales: ["Malaseb"],
    categoria: "Champú antiséptico/antifúngico",
    indicaciones: ["Dermatitis seborreica", "Dermatofitosis (Microsporum canis)"],
    especies: {
      perro: { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "Tópica (champú)", frecuencia: "2 veces por semana hasta mejoría, luego semanal de mantenimiento", notas: "Dejar actuar 10 minutos antes de aclarar. Fuente: ficha técnica CIMAVET (Malaseb, nº registro 2125 ESP)." },
      gato:  { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "Tópica (champú)", frecuencia: "2 veces por semana hasta cultivo negativo (máximo 16 semanas)", notas: "Dejar actuar 10 minutos antes de aclarar. Fuente: ficha técnica CIMAVET (Malaseb, nº registro 2125 ESP)." }
    }
  },
  {
    id: "praziquantel-pirantel-febantel",
    principioActivo: "Praziquantel + pirantel + febantel",
    nombresComerciales: ["Drontal", "Drontal Plus", "Endogard", "Cestem", "Zipyran Plus", "Cazitel", "Helm-Ex", "Wellplus", "ZIKYALL", "Cat-Ex"],
    categoria: "Antiparasitario interno (dewormer de amplio espectro)",
    indicaciones: ["Desparasitación interna"],
    especies: {
      perro: { dosisMin: 5, dosisMax: 5, unidad: "mg/kg", via: "VO", frecuencia: "dosis única", notas: "Dosis expresada como praziquantel; el comprimido asocia además 15 mg/kg de febantel y 14,4 mg/kg de pirantel embonato (proporción fija, equivale a 1 comprimido de Drontal Plus por cada 10 kg de peso). Fuente: ficha técnica CIMAVET (Drontal Plus, nº registro 539 ESP)." },
      gato:  { dosisMin: 5, dosisMax: 5, unidad: "mg/kg", via: "VO", frecuencia: "dosis única", notas: "Dosis expresada como praziquantel; el comprimido asocia además 57,5 mg/kg de pirantel embonato (sin febantel en la formulación felina; proporción fija, equivale a 1 comprimido de Drontal por cada 4 kg de peso). Gatitos <1 kg: no tratar. Fuente: ficha técnica CIMAVET (Drontal gatos, nº registro 1098 ESP)." }
    }
  },
  {
    id: "fipronil",
    principioActivo: "Fipronil",
    nombresComerciales: ["Frontline", "Effipro", "Fiprosmet", "Dynacan", "Lifronil"],
    categoria: "Antiparasitario externo (spot-on)",
    indicaciones: ["Prevención de pulgas y garrapatas"],
    especies: {
      perro: {
        tipoDosis: "banda",
        via: "Tópica (spot-on)",
        frecuencia: "una vez al mes",
        notas: "Solución al 10% (100 mg/ml). Aplicar sobre la piel entre los omóplatos, evitando que el animal se lama la zona; en perros grandes, mantener inmovilizado 2 min tras aplicar. Fuente: ficha técnica CIMAVET (Frontline Spot On, nº registro 1230/4175/4176/4177 ESP).",
        bandas: [
          { pesoMin: 2, pesoMax: 10, mg: 67, ml: 0.67, concentracion: 100, descripcion: "1 pipeta de 0,67 ml (67 mg)" },
          { pesoMin: 10.1, pesoMax: 20, mg: 134, ml: 1.34, concentracion: 100, descripcion: "1 pipeta de 1,34 ml (134 mg)" },
          { pesoMin: 20.1, pesoMax: 40, mg: 268, ml: 2.68, concentracion: 100, descripcion: "1 pipeta de 2,68 ml (268 mg)" },
          { pesoMin: 40.1, pesoMax: 999, mg: 402, ml: 4.02, concentracion: 100, descripcion: "1 pipeta de 4,02 ml (402 mg), para perros de más de 40 kg" }
        ]
      },
      gato: {
        tipoDosis: "banda",
        via: "Tópica (spot-on)",
        frecuencia: "una vez al mes",
        notas: "Solución al 10% (100 mg/ml); pipeta de tamaño único, independiente del peso del gato. Aplicar repartido en 2 puntos (base del cuello y entre los hombros). Protección frente a pulgas hasta 5 semanas. Fuente: ficha técnica CIMAVET (Frontline Spot On Gato, nº registro 1163 ESP).",
        bandas: [
          { pesoMin: 0, pesoMax: 999, mg: 50, ml: 0.5, concentracion: 100, descripcion: "1 pipeta de 0,5 ml (50 mg), tamaño único" }
        ]
      }
    }
  },
  {
    id: "fluralaner",
    principioActivo: "Fluralaner",
    nombresComerciales: ["Bravecto"],
    categoria: "Antiparasitario externo (isoxazolina, comprimido masticable)",
    indicaciones: ["Prevención de pulgas y garrapatas", "Demodicosis", "Sarna sarcóptica"],
    especies: {
      perro: {
        tipoDosis: "banda",
        via: "VO (con la comida)",
        frecuencia: "una vez cada 12 semanas frente a pulgas y la mayoría de garrapatas (cada 8 semanas frente a Rhipicephalus sanguineus)",
        notas: "Rango real 25-56 mg/kg dentro de cada tramo (el comprimido no debe partirse ni fraccionarse). Para perros de más de 56 kg, combinar dos comprimidos que más se aproximen al peso. También indicado en demodicosis (Demodex canis) y sarna sarcóptica: consultar pauta específica del veterinario para estos usos. Fuente: Summary of Product Characteristics, VMD (Reino Unido), VM 01708/5014-5020 — equivalente al registro CIMAVET EU/2/13/158.",
        bandas: [
          { pesoMin: 2, pesoMax: 4.5, mg: 112.5, comprimidos: 1, descripcion: "1 comprimido de 112,5 mg" },
          { pesoMin: 4.51, pesoMax: 10, mg: 250, comprimidos: 1, descripcion: "1 comprimido de 250 mg" },
          { pesoMin: 10.1, pesoMax: 20, mg: 500, comprimidos: 1, descripcion: "1 comprimido de 500 mg" },
          { pesoMin: 20.1, pesoMax: 40, mg: 1000, comprimidos: 1, descripcion: "1 comprimido de 1.000 mg" },
          { pesoMin: 40.1, pesoMax: 56, mg: 1400, comprimidos: 1, descripcion: "1 comprimido de 1.400 mg" }
        ]
      }
    }
  },
  {
    id: "tramadol",
    principioActivo: "Tramadol",
    nombresComerciales: ["Tralgiol", "Adolonta (uso humano)"],
    categoria: "Analgésico opioide",
    indicaciones: ["Dolor", "Dolor crónico"],
    especies: {
      perro: { dosisMin: 2, dosisMax: 5, unidad: "mg/kg", via: "VO/IV/SC", frecuencia: "cada 8-12 h", notas: "Eficacia analgésica variable en perro." },
      gato:  { dosisMin: 1, dosisMax: 4, unidad: "mg/kg", via: "VO/IV/SC", frecuencia: "cada 8-12 h", notas: "Sabor muy amargo, difícil vía oral en gatos." }
    }
  },
  {
    id: "dexametasona",
    principioActivo: "Dexametasona",
    nombresComerciales: ["Fortecortin (uso humano)", "Dexafort"],
    categoria: "Corticoide",
    indicaciones: ["Inflamación", "Shock", "Reacción alérgica"],
    especies: {
      perro: { dosisMin: 0.05, dosisMax: 0.2, unidad: "mg/kg", via: "IV/IM/SC", frecuencia: "cada 24 h (antiinflamatoria); dosis mayores en shock", notas: "No combinar con AINEs." },
      gato:  { dosisMin: 0.05, dosisMax: 0.2, unidad: "mg/kg", via: "IV/IM/SC", frecuencia: "cada 24 h", notas: "No combinar con AINEs." }
    }
  },
  {
    id: "ciclosporina",
    principioActivo: "Ciclosporina",
    nombresComerciales: ["Atopica", "Modulis", "Cyclavance", "Sporimune"],
    categoria: "Inmunosupresor",
    indicaciones: ["Dermatitis atópica", "Dermatitis alérgica"],
    especies: {
      perro: { dosisMin: 5, dosisMax: 5, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h al inicio; una vez controlados los signos clínicos (4-8 semanas), reducir a días alternos o cada 3-4 días según respuesta", notas: "No usar en perros menores de 6 meses ni con menos de 2 kg de peso. La marca Optimmune (misma composición) es una pomada oftálmica para queratoconjuntivitis seca, de uso y dosis completamente distintos — no es esta presentación oral. Fuente: ficha técnica CIMAVET (Atopica solución oral, nº registro 2367 ESP)." },
      gato:  { dosisMin: 7, dosisMax: 7, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h al inicio; reducir a días alternos o cada 3-4 días según respuesta clínica", notas: "No usar en gatos infectados por FeLV o FIV. La marca Optimmune (misma composición) es una pomada oftálmica para queratoconjuntivitis seca, de uso y dosis completamente distintos — no es esta presentación oral. Fuente: ficha técnica CIMAVET (Atopica solución oral, nº registro 2367 ESP)." }
    }
  },
  {
    id: "furosemida",
    principioActivo: "Furosemida",
    nombresComerciales: ["Seguril"],
    categoria: "Diurético",
    indicaciones: ["Insuficiencia cardíaca congestiva", "Edema"],
    especies: {
      perro: { dosisMin: 1, dosisMax: 4, unidad: "mg/kg", via: "VO/IV/IM", frecuencia: "cada 8-12 h (ICC aguda hasta cada 4-6 h)", notas: "Vigilar hidratación, función renal y electrolitos." },
      gato:  { dosisMin: 1, dosisMax: 2, unidad: "mg/kg", via: "VO/IV/IM", frecuencia: "cada 8-12 h", notas: "Vigilar hidratación, función renal y electrolitos." }
    }
  },
  {
    id: "clomipramina",
    principioActivo: "Clomipramina",
    nombresComerciales: ["Clomicalm"],
    categoria: "Antidepresivo (tricíclico)",
    indicaciones: ["Ansiedad por separación", "Trastornos de conducta"],
    especies: {
      perro: { dosisMin: 2, dosisMax: 4, unidad: "mg/kg", via: "VO", frecuencia: "cada 12 h (2 mg/kg/toma, hasta 2-4 mg/kg/día)", notas: "Solo junto con técnicas de modificación de conducta; no como tratamiento único. Fuente: Summary of Product Characteristics, VMD (Reino Unido), VM 05653/5027-5029 — equivalente al registro CIMAVET EU/2/98/007 (Clomicalm)." }
    }
  },
  {
    id: "torasemida",
    principioActivo: "Torasemida",
    nombresComerciales: ["Upcard", "Isemid"],
    categoria: "Diurético",
    indicaciones: ["Insuficiencia cardíaca congestiva", "Edema"],
    especies: {
      perro: { dosisMin: 0.1, dosisMax: 0.6, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h", notas: "Solo perros. La mayoría se estabiliza con ≤0,3 mg/kg/día; titular en incrementos de 0,1 mg/kg según respuesta clínica y vigilando función renal/electrolitos. No evaluado por encima de 0,8 mg/kg/día. Un solo comprimido tiene aprox. 20 veces el efecto diurético de una dosis única de furosemida. Fuente: Summary of Product Characteristics, VMD (Reino Unido), VM 06462/5012-5015 — equivalente al registro CIMAVET EU/2/15/184 (Upcard)." }
    }
  },
  {
    id: "amiodarona",
    principioActivo: "Amiodarona",
    nombresComerciales: ["Trangorex (uso humano)"],
    categoria: "Antiarrítmico clase III",
    indicaciones: ["Arritmia ventricular", "Arritmia supraventricular"],
    especies: {
      perro: { dosisMin: 5, dosisMax: 15, unidad: "mg/kg", via: "VO", frecuencia: "cada 12-24 h", notas: "Vigilar función hepática y hemograma; puede causar hepatotoxicidad." }
    }
  },
  {
    id: "diltiazem",
    principioActivo: "Diltiazem",
    nombresComerciales: ["Dilaclan (uso humano)", "Diltiazem (uso humano)"],
    categoria: "Antagonista del calcio (antiarrítmico/antihipertensivo)",
    indicaciones: ["Arritmia supraventricular", "Cardiomiopatía"],
    especies: {
      perro: { dosisMin: 0.5, dosisMax: 3, unidad: "mg/kg", via: "VO", frecuencia: "cada 8 h", notas: "Vía IV: 0,05-0,25 mg/kg." },
      gato:  { dosisMin: 1.75, dosisMax: 3.75, unidad: "mg/kg", via: "VO", frecuencia: "cada 8 h", dosisMaxima: 15, notas: "Fuente: vademecum cardio (documento interno de la clínica). Dosis citada como fija de 7,5-15 mg/gato cada 8 h (formulaciones de liberación sostenida se dosifican por animal, no por peso); el rango mg/kg mostrado es una aproximación para un gato típico, limitada a los 15 mg/gato citados como máximo." }
    }
  },
  {
    id: "esmolol",
    principioActivo: "Esmolol",
    nombresComerciales: ["Brevibloc (uso humano)"],
    categoria: "Betabloqueante de acción corta",
    indicaciones: ["Arritmia supraventricular", "Arritmia ventricular", "Emergencia/RCP"],
    especies: {
      perro: { dosisMin: 0.25, dosisMax: 0.5, unidad: "mg/kg", via: "IV", frecuencia: "bolo de carga lento", notas: "Mantenimiento en infusión continua (CRI): 10-200 microgramos/kg/min — usar la pestaña CRI para calcular el ritmo de la bomba." },
      gato:  { dosisMin: 0.25, dosisMax: 0.5, unidad: "mg/kg", via: "IV", frecuencia: "bolo de carga lento", notas: "Mantenimiento en infusión continua (CRI): 10-200 microgramos/kg/min — usar la pestaña CRI para calcular el ritmo de la bomba." }
    }
  },
  {
    id: "fenitoina",
    principioActivo: "Fenitoína",
    nombresComerciales: ["Epanutin (uso humano)", "Sinergina (uso humano)"],
    categoria: "Antiarrítmico/anticonvulsivante",
    indicaciones: ["Arritmia ventricular"],
    especies: {
      perro: { dosisMin: 20, dosisMax: 35, unidad: "mg/kg", via: "VO", frecuencia: "cada 8 h", notas: "Uso poco frecuente en la actualidad; vigilar función hepática." }
    }
  },
  {
    id: "glicopirolato",
    principioActivo: "Glicopirolato",
    nombresComerciales: ["Robinul (uso humano)"],
    categoria: "Anticolinérgico",
    indicaciones: ["Bradicardia", "Premedicación anticolinérgica"],
    especies: {
      perro: { dosisMin: 0.005, dosisMax: 0.01, unidad: "mg/kg", via: "IV/SC", frecuencia: "según necesidad", notas: "Alternativa a la atropina; efecto más prolongado y menos arritmogénico." },
      gato:  { dosisMin: 0.005, dosisMax: 0.01, unidad: "mg/kg", via: "IV/SC", frecuencia: "según necesidad", notas: "Alternativa a la atropina; efecto más prolongado y menos arritmogénico." }
    }
  },
  {
    id: "hidralazina",
    principioActivo: "Hidralazina",
    nombresComerciales: ["Hydrapres (uso humano)"],
    categoria: "Vasodilatador arterial",
    indicaciones: ["Insuficiencia cardíaca congestiva", "Hipertensión arterial sistémica"],
    especies: {
      perro: { dosisMin: 0.5, dosisMax: 3, unidad: "mg/kg", via: "VO", frecuencia: "cada 12 h", notas: "Vigilar hipotensión, sobre todo si se combina con IECA/diurético; iniciar con la dosis más baja." },
      gato:  { dosisMin: 0.6, dosisMax: 2.5, unidad: "mg/kg", via: "VO", frecuencia: "cada 12 h", dosisMaxima: 10, notas: "Fuente: vademecum cardio (documento interno de la clínica). Dosis citada como fija de 2,5-10 mg/gato cada 12 h; el rango mg/kg mostrado es una aproximación para un gato típico, limitada a los 10 mg/gato citados como máximo." }
    }
  },
  {
    id: "hidroclorotiazida",
    principioActivo: "Hidroclorotiazida",
    nombresComerciales: ["Hidrosaluretil (uso humano)"],
    categoria: "Diurético tiazídico",
    indicaciones: ["Insuficiencia cardíaca congestiva"],
    especies: {
      perro: { dosisMin: 2, dosisMax: 4, unidad: "mg/kg", via: "VO", frecuencia: "cada 12 h", notas: "Uso poco habitual; vigilar electrolitos, sobre todo si se combina con otros diuréticos." }
    }
  },
  {
    id: "imidapril",
    principioActivo: "Imidapril",
    nombresComerciales: ["Prilium"],
    categoria: "IECA (antihipertensivo/cardiorrenal)",
    indicaciones: ["Insuficiencia cardíaca congestiva", "Hipertensión arterial sistémica"],
    especies: {
      perro: { dosisMin: 0.25, dosisMax: 0.25, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h", notas: "Vigilar función renal y potasio al iniciar o ajustar dosis." },
      gato:  { dosisMin: 0.25, dosisMax: 0.25, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h", notas: "Vigilar función renal y potasio al iniciar o ajustar dosis." }
    }
  },
  {
    id: "mexiletina",
    principioActivo: "Mexiletina",
    nombresComerciales: ["Mexitil (uso humano)"],
    categoria: "Antiarrítmico clase Ib",
    indicaciones: ["Arritmia ventricular"],
    especies: {
      perro: { dosisMin: 5, dosisMax: 10, unidad: "mg/kg", via: "VO", frecuencia: "cada 8 h", notas: "A menudo combinado con sotalol o un betabloqueante." }
    }
  },
  {
    id: "procainamida",
    principioActivo: "Procainamida",
    nombresComerciales: ["Biocoryl (uso humano)"],
    categoria: "Antiarrítmico clase Ia",
    indicaciones: ["Arritmia ventricular"],
    especies: {
      perro: { dosisMin: 10, dosisMax: 30, unidad: "mg/kg", via: "VO", frecuencia: "cada 6-8 h", notas: "Vía IV/IM: 5-20 mg/kg." }
    }
  },
  {
    id: "propranolol",
    principioActivo: "Propranolol",
    nombresComerciales: ["Sumial (uso humano)"],
    categoria: "Betabloqueante no selectivo",
    indicaciones: ["Arritmia supraventricular", "Arritmia ventricular", "Cardiomiopatía"],
    especies: {
      perro: { dosisMin: 0.1, dosisMax: 2, unidad: "mg/kg", via: "VO", frecuencia: "cada 8 h", notas: "Vía IV: 0,01-0,1 mg/kg lento. Introducir gradualmente; puede empeorar una insuficiencia cardíaca descompensada." },
      gato:  { dosisMin: 0.01, dosisMax: 0.1, unidad: "mg/kg", via: "IV", frecuencia: "lento, según necesidad", notas: "La pauta oral en gatos suele ser una dosis fija por animal. Fuente: vademecum cardio (documento interno de la clínica): 2,5-10 mg/gato VO (frecuencia no especificada en la fuente; confirmar antes de pautar)." }
    }
  },
  {
    id: "quinidina",
    principioActivo: "Quinidina",
    nombresComerciales: ["Longacor (uso humano)"],
    categoria: "Antiarrítmico clase Ia",
    indicaciones: ["Arritmia ventricular"],
    especies: {
      perro: { dosisMin: 6, dosisMax: 16, unidad: "mg/kg", via: "VO/IM", frecuencia: "cada 6-8 h", notas: "Uso poco frecuente en la actualidad." }
    }
  },
  {
    id: "ramipril",
    principioActivo: "Ramipril",
    nombresComerciales: ["Vasotop", "Acovil (uso humano)"],
    categoria: "IECA (antihipertensivo/cardiorrenal)",
    indicaciones: ["Insuficiencia cardíaca congestiva", "Hipertensión arterial sistémica"],
    especies: {
      perro: { dosisMin: 0.125, dosisMax: 0.125, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h", notas: "Vigilar función renal y potasio al iniciar o ajustar dosis." },
      gato:  { dosisMin: 0.125, dosisMax: 0.125, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h", notas: "Vigilar función renal y potasio al iniciar o ajustar dosis." }
    }
  },
  {
    id: "sildenafilo",
    principioActivo: "Sildenafilo",
    nombresComerciales: ["Viagra (uso humano)", "Revatio (uso humano)"],
    categoria: "Vasodilatador pulmonar (inhibidor de la PDE5)",
    indicaciones: ["Enfermedad respiratoria"],
    especies: {
      perro: { dosisMin: 1, dosisMax: 1, unidad: "mg/kg", via: "VO", frecuencia: "cada 8-12 h", notas: "Dosis inicial para hipertensión pulmonar; puede subirse hasta 4-7 mg/kg TID en casos graves — ver protocolo específico de hipertensión pulmonar. Usar solo en HP grave, no leve/moderada." }
    }
  },
  {
    id: "sotalol",
    principioActivo: "Sotalol",
    nombresComerciales: ["Sotapor (uso humano)"],
    categoria: "Antiarrítmico clase III / betabloqueante",
    indicaciones: ["Arritmia ventricular", "Cardiomiopatía"],
    especies: {
      perro: { dosisMin: 1, dosisMax: 3, unidad: "mg/kg", via: "VO", frecuencia: "cada 12 h", notas: "Introducir gradualmente; vigilar ECG al iniciar o ajustar dosis." }
    }
  },
  {
    id: "omeprazol",
    principioActivo: "Omeprazol",
    nombresComerciales: ["Losec (uso humano)", "Gastrogard (equino, no aplica)"],
    categoria: "Antiulceroso (IBP)",
    indicaciones: ["Úlcera gástrica", "Reflujo", "Gastritis"],
    especies: {
      perro: { dosisMin: 0.5, dosisMax: 1, unidad: "mg/kg", via: "VO", frecuencia: "cada 12-24 h", notas: "Administrar antes de la comida." },
      gato:  { dosisMin: 0.5, dosisMax: 1, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h", notas: "Administrar antes de la comida." }
    }
  },
  {
    id: "maropitant",
    principioActivo: "Maropitant",
    nombresComerciales: ["Cerenia"],
    categoria: "Antiemético",
    indicaciones: ["Vómito", "Náuseas", "Prevención cinetosis"],
    especies: {
      perro: { dosisMin: 1, dosisMax: 1, unidad: "mg/kg", via: "SC/IV", frecuencia: "cada 24 h", notas: "Vía oral: 2 mg/kg cada 24 h." },
      gato:  { dosisMin: 1, dosisMax: 1, unidad: "mg/kg", via: "SC/IV", frecuencia: "cada 24 h", notas: "Vía oral: 2 mg/kg cada 24 h. Puede doler en la inyección SC." }
    }
  },
  {
    id: "clindamicina",
    principioActivo: "Clindamicina",
    nombresComerciales: ["Antirobe", "Clinabel", "Clindaseptin"],
    categoria: "Antibiótico (lincosamida)",
    indicaciones: ["Infección bacteriana", "Infección dental", "Infección ósea"],
    especies: {
      perro: { dosisMin: 5.5, dosisMax: 11, unidad: "mg/kg", via: "VO", frecuencia: "cada 12 h", notas: "Buena penetración ósea; útil en infecciones dentales." },
      gato:  { dosisMin: 5.5, dosisMax: 11, unidad: "mg/kg", via: "VO", frecuencia: "cada 12-24 h", notas: "" }
    }
  },
  {
    id: "cefalexina",
    principioActivo: "Cefalexina",
    nombresComerciales: ["Rilexine", "Ceporex", "Cefabactin", "Cephacare"],
    categoria: "Antibiótico (cefalosporina)",
    indicaciones: ["Infección bacteriana", "Infección cutánea"],
    especies: {
      perro: { dosisMin: 15, dosisMax: 30, unidad: "mg/kg", via: "VO", frecuencia: "cada 12 h", notas: "" },
      gato:  { dosisMin: 15, dosisMax: 30, unidad: "mg/kg", via: "VO", frecuencia: "cada 12 h", notas: "" }
    }
  },
  {
    id: "gabapentina",
    principioActivo: "Gabapentina",
    nombresComerciales: ["Neurontin (uso humano)", "Gabacan"],
    categoria: "Analgésico neuropático/Anticonvulsivo",
    indicaciones: ["Dolor neuropático", "Ansiedad/estrés en consulta", "Coadyuvante anticonvulsivo"],
    especies: {
      perro: { dosisMin: 5, dosisMax: 10, unidad: "mg/kg", via: "VO", frecuencia: "cada 8-12 h", notas: "Puede causar sedación al inicio." },
      gato:  { dosisMin: 5, dosisMax: 10, unidad: "mg/kg", via: "VO", frecuencia: "cada 8-12 h", notas: "Muy usada para sedación previa a visitas (100 mg/gato dosis fija habitual)." }
    }
  },
  {
    id: "insulina-glargina",
    principioActivo: "Insulina glargina",
    nombresComerciales: ["Lantus"],
    categoria: "Antidiabético",
    indicaciones: ["Diabetes mellitus"],
    especies: {
      gato:  { dosisMin: 0.25, dosisMax: 0.5, unidad: "UI/kg", via: "SC", frecuencia: "cada 12 h", dosisMaxima: 3, notas: "Iniciar con dosis baja y ajustar según curva de glucosa. Redondear a 0.5 UI." }
      // No incluida en perro por protocolo distinto (insulina lenta/NPH habitual).
    }
  },
  {
    id: "levotiroxina",
    principioActivo: "Levotiroxina",
    nombresComerciales: ["Leti-thyr4", "Forthyron"],
    categoria: "Hormona tiroidea",
    indicaciones: ["Hipotiroidismo"],
    especies: {
      perro: { dosisMin: 0.01, dosisMax: 0.02, unidad: "mg/kg", via: "VO", frecuencia: "cada 12-24 h", notas: "Reevaluar T4 a las 4-6 semanas de iniciar/ajustar." }
    }
  },
  {
    id: "fenobarbital",
    principioActivo: "Fenobarbital",
    nombresComerciales: ["Luminal (uso humano)", "Epiphen"],
    categoria: "Anticonvulsivo",
    indicaciones: ["Epilepsia", "Convulsiones"],
    especies: {
      perro: { dosisMin: 2, dosisMax: 3, unidad: "mg/kg", via: "VO", frecuencia: "cada 12 h", notas: "Monitorizar niveles séricos y función hepática." },
      gato:  { dosisMin: 1.5, dosisMax: 3, unidad: "mg/kg", via: "VO", frecuencia: "cada 12 h", notas: "Monitorizar niveles séricos y función hepática." }
    }
  },
  {
    id: "diazepam",
    principioActivo: "Diazepam",
    nombresComerciales: ["Diazedor", "Solupam", "Ziapam"],
    categoria: "Anticonvulsivante (benzodiazepina)",
    indicaciones: ["Convulsiones", "Espasmo musculoesquelético", "Sedación", "Premedicación"],
    especies: {
      perro: { dosisMin: 0.1, dosisMax: 2, unidad: "mg/kg", via: "IV lenta (única vía autorizada)", frecuencia: "según uso: preanestesia 0,1-0,2 mg/kg · sedación 0,2-0,6 mg/kg · convulsiones/espasmo musculoesquelético 0,5-2 mg/kg", notas: "Solo vía intravenosa lenta; no usar en enfermedad hepática grave. Fuente: ficha técnica CIMAVET (Diazedor, nº registro 3643 ESP)." },
      gato:  { dosisMin: 0.1, dosisMax: 2, unidad: "mg/kg", via: "IV lenta (única vía autorizada)", frecuencia: "según uso: preanestesia 0,1-0,2 mg/kg · sedación 0,2-0,6 mg/kg · convulsiones/espasmo musculoesquelético 0,5-2 mg/kg", notas: "Solo vía intravenosa lenta; no usar en enfermedad hepática grave. Fuente: ficha técnica CIMAVET (Diazedor, nº registro 3643 ESP)." }
    }
  },
  {
    id: "fluoxetina",
    principioActivo: "Fluoxetina",
    nombresComerciales: ["Fluoxevet", "Reconcile"],
    categoria: "Antidepresivo (ISRS)",
    indicaciones: ["Ansiedad por separación", "Trastornos de conducta"],
    especies: {
      perro: { dosisMin: 1, dosisMax: 2, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h", notas: "Solo junto con técnicas de modificación de conducta; no como tratamiento único. Fuente: ficha técnica CIMAVET (Fluoxevet, nº registro 4342 ESP)." }
    }
  },
  {
    id: "ondansetron",
    principioActivo: "Ondansetrón",
    nombresComerciales: ["Zofran (uso humano)", "Yatrox"],
    categoria: "Antiemético",
    indicaciones: ["Vómito", "Náuseas"],
    especies: {
      perro: { dosisMin: 0.5, dosisMax: 1, unidad: "mg/kg", via: "VO/IV", frecuencia: "cada 12-24 h", notas: "" },
      gato:  { dosisMin: 0.5, dosisMax: 1, unidad: "mg/kg", via: "VO/IV", frecuencia: "cada 12-24 h", notas: "" }
    }
  },
  {
    id: "doxiciclina",
    principioActivo: "Doxiciclina",
    nombresComerciales: ["Ronaxan", "Vibravet", "Doxybactin"],
    categoria: "Antibiótico (tetraciclina)",
    indicaciones: ["Infección bacteriana", "Ehrlichiosis", "Enfermedad respiratoria"],
    especies: {
      perro: { dosisMin: 5, dosisMax: 10, unidad: "mg/kg", via: "VO", frecuencia: "cada 12-24 h", notas: "Administrar con agua/alimento para evitar esofagitis; no tumbar al animal tras la toma." },
      gato:  { dosisMin: 5, dosisMax: 10, unidad: "mg/kg", via: "VO", frecuencia: "cada 12-24 h", notas: "Administrar con agua/alimento para evitar esofagitis; no tumbar al animal tras la toma." }
    }
  },
  {
    id: "espiramicina-metronidazol",
    principioActivo: "Espiramicina + Metronidazol",
    nombresComerciales: ["Stomorgyl"],
    categoria: "Antibiótico (macrólido + antiprotozoario)",
    indicaciones: ["Enfermedad periodontal", "Estomatitis", "Gingivitis", "Infección bucal"],
    especies: {
      perro: { dosisMin: 12.5, dosisMax: 12.5, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h, durante 5-10 días", notas: "Dosis expresada como metronidazol; el comprimido asocia además 75.000 UI/kg de espiramicina (proporción fija, equivale a 1 comprimido de Stomorgyl por cada 10 kg de peso al día). No usar en gestación ni lactancia. Fuente: ficha técnica CIMAVET (Stomorgyl, nº registro 537 ESP)." },
      gato:  { dosisMin: 12.5, dosisMax: 12.5, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h, durante 5-10 días", notas: "Dosis expresada como metronidazol; el comprimido asocia además 75.000 UI/kg de espiramicina (proporción fija, equivale a 1 comprimido de Stomorgyl por cada 10 kg de peso al día). No usar en gestación ni lactancia. Fuente: ficha técnica CIMAVET (Stomorgyl, nº registro 537 ESP)." }
    }
  },

  // ---- Sedación / anestesia / premedicación ----
  {
    id: "dexmedetomidina",
    principioActivo: "Dexmedetomidina",
    nombresComerciales: ["Dexdomitor", "Sedadex"],
    categoria: "Sedante alfa-2 agonista",
    indicaciones: ["Sedación", "Premedicación", "Anestesia (co-inducción)"],
    especies: {
      perro: { dosisMin: 0.001, dosisMax: 0.003, unidad: "mg/kg", via: "IV/IM", frecuencia: "dosis única (premedicación)", notas: "Equivale a 1-3 mcg/kg. Produce bradicardia; vigilar frecuencia cardíaca. Reversible con atipamezol." },
      gato:  { dosisMin: 0.001, dosisMax: 0.005, unidad: "mg/kg", via: "IV/IM", frecuencia: "dosis única (premedicación)", notas: "Equivale a 1-5 mcg/kg. Produce bradicardia; vigilar frecuencia cardíaca. Reversible con atipamezol." }
    }
  },
  {
    id: "medetomidina",
    principioActivo: "Medetomidina",
    nombresComerciales: ["Domtor", "Sedator", "Dormitor"],
    categoria: "Sedante alfa-2 agonista",
    indicaciones: ["Sedación", "Premedicación", "Anestesia (co-inducción)"],
    especies: {
      perro: { dosisMin: 0.01, dosisMax: 0.04, unidad: "mg/kg", via: "IV/IM", frecuencia: "dosis única (premedicación)", notas: "Equivale a 10-40 mcg/kg (es la mezcla racémica; dexmedetomidina es su enantiómero activo, a mitad de dosis aproximada). Produce bradicardia; vigilar frecuencia cardíaca. Reversible con atipamezol." },
      gato:  { dosisMin: 0.02, dosisMax: 0.08, unidad: "mg/kg", via: "IM", frecuencia: "dosis única (premedicación)", notas: "Equivale a 20-80 mcg/kg. Produce bradicardia; vigilar frecuencia cardíaca. Reversible con atipamezol." }
    }
  },
  {
    id: "metadona",
    principioActivo: "Metadona",
    nombresComerciales: ["Semfortan"],
    categoria: "Analgésico opioide",
    indicaciones: ["Dolor", "Premedicación", "Analgesia perioperatoria"],
    especies: {
      perro: { dosisMin: 0.1, dosisMax: 0.5, unidad: "mg/kg", via: "IV/IM/SC", frecuencia: "cada 4-6 h según necesidad", notas: "Opioide agonista puro; puede producir sedación/disforia y bradicardia. Vigilar depresión respiratoria a dosis altas." },
      gato:  { dosisMin: 0.1, dosisMax: 0.3, unidad: "mg/kg", via: "IV/IM/SC", frecuencia: "cada 4-6 h según necesidad", notas: "Opioide agonista puro; puede producir sedación/disforia y bradicardia. Vigilar depresión respiratoria a dosis altas." }
    }
  },
  {
    id: "metamizol",
    principioActivo: "Metamizol",
    // Sin nombre comercial listado a propósito: en CIMAVET, todo lo registrado con metamizol
    // (Rivalgin, Sympagesic, Spasmium Compositum...) es un producto multi-especie de grandes
    // animales (bovino/caballos/porcino) con autorización incidental en perros y NUNCA en
    // gatos — listar cualquiera de ellos aquí sugeriría que existe una marca propia para
    // mascotas, cuando no la hay (por eso la búsqueda en vivo ya informa correctamente de que
    // no hay nada autorizado como veterinario para la especie del paciente).
    nombresComerciales: [],
    categoria: "Analgésico/antipirético/espasmolítico",
    indicaciones: ["Dolor", "Fiebre", "Dolor cólico/espasmódico"],
    especies: {
      perro: { dosisMin: 25, dosisMax: 50, unidad: "mg/kg", via: "VO/IV/IM", frecuencia: "cada 8-12 h", notas: "Administrar IV lento (riesgo de hipotensión). No combinar con otros AINEs." },
      gato:  { dosisMin: 25, dosisMax: 50, unidad: "mg/kg", via: "VO/IV/IM", frecuencia: "cada 12-24 h", notas: "Uso con precaución en gato; datos más limitados que en perro. Administrar IV lento." }
    }
  },
  {
    id: "amlodipino",
    principioActivo: "Amlodipino",
    nombresComerciales: ["Amodip", "Lodisure"],
    categoria: "Antihipertensivo (antagonista del calcio)",
    indicaciones: ["Hipertensión arterial sistémica"],
    especies: {
      perro: { dosisMin: 0.05, dosisMax: 0.25, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h", notas: "Ajustar dosis según respuesta de presión arterial; puede tardar varios días en alcanzar efecto máximo." },
      gato:  { dosisMin: 0.1, dosisMax: 0.3, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h", notas: "Equivale aprox. a 0,625-1,25 mg/gato/día. Monitorizar presión arterial y función renal." }
    }
  },
  {
    id: "telmisartan",
    principioActivo: "Telmisartán",
    nombresComerciales: ["Semintra"],
    categoria: "Antihipertensivo (antagonista del receptor de angiotensina II)",
    indicaciones: ["Hipertensión arterial sistémica", "Proteinuria renal"],
    especies: {
      perro: { dosisMin: 0.5, dosisMax: 1, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h", notas: "Uso extrapolado del gato (indicación autorizada solo en gato en la UE); monitorizar función renal y presión arterial." },
      gato:  { dosisMin: 1, dosisMax: 2, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h", notas: "1 mg/kg/día para proteinuria renal (ERC); hasta 2 mg/kg/día para hipertensión, según ficha técnica de Semintra. Monitorizar presión arterial y función renal." }
    }
  },
  {
    id: "butorfanol",
    principioActivo: "Butorfanol",
    nombresComerciales: ["Torbugesic", "Alorfin"],
    categoria: "Opioide agonista-antagonista",
    indicaciones: ["Sedación", "Analgesia leve", "Premedicación"],
    especies: {
      perro: { dosisMin: 0.1, dosisMax: 0.4, unidad: "mg/kg", via: "IV/IM/SC", frecuencia: "cada 1-4 h según necesidad", notas: "Analgesia de corta duración; frecuente en combinación con sedantes." },
      gato:  { dosisMin: 0.1, dosisMax: 0.4, unidad: "mg/kg", via: "IV/IM/SC", frecuencia: "cada 1-4 h según necesidad", notas: "Analgesia de corta duración; frecuente en combinación con sedantes." }
    }
  },
  {
    id: "acepromazina",
    principioActivo: "Acepromazina",
    nombresComerciales: ["Calmo Neosan", "Vetranquil"],
    categoria: "Tranquilizante fenotiazínico",
    indicaciones: ["Sedación", "Premedicación", "Ansiedad"],
    especies: {
      perro: { dosisMin: 0.01, dosisMax: 0.03, unidad: "mg/kg", via: "IV/IM/SC", frecuencia: "dosis única (premedicación)", dosisMaxima: 3, notas: "No tiene efecto analgésico; combinar con opioide. No usar en animales hipovolémicos o con riesgo de convulsión." },
      gato:  { dosisMin: 0.01, dosisMax: 0.03, unidad: "mg/kg", via: "IV/IM/SC", frecuencia: "dosis única (premedicación)", dosisMaxima: 1, notas: "No tiene efecto analgésico; combinar con opioide." }
    }
  },
  {
    id: "midazolam",
    principioActivo: "Midazolam",
    nombresComerciales: ["Midazolam Normon (uso humano)", "Sedizolam"],
    categoria: "Benzodiazepina",
    indicaciones: ["Sedación", "Anestesia (co-inducción)", "Convulsiones"],
    especies: {
      perro: { dosisMin: 0.1, dosisMax: 0.3, unidad: "mg/kg", via: "IV/IM", frecuencia: "dosis única (co-inducción)", notas: "Poco fiable como sedante único en animales sanos; combinar con opioide/alfa-2." },
      gato:  { dosisMin: 0.1, dosisMax: 0.3, unidad: "mg/kg", via: "IV/IM", frecuencia: "dosis única (co-inducción)", notas: "Poco fiable como sedante único en animales sanos; combinar con opioide/alfa-2." }
    }
  },
  {
    id: "ketamina",
    principioActivo: "Ketamina",
    nombresComerciales: ["Imalgene", "Ketamidor"],
    categoria: "Anestésico disociativo",
    indicaciones: ["Anestesia (inducción)", "Analgesia (dosis subanestésicas)"],
    especies: {
      perro: { dosisMin: 5, dosisMax: 10, unidad: "mg/kg", via: "IV/IM", frecuencia: "dosis única (inducción, combinada con sedante)", notas: "No usar en monoterapia: administrar siempre junto a una benzodiazepina o alfa-2 agonista." },
      gato:  { dosisMin: 5, dosisMax: 10, unidad: "mg/kg", via: "IV/IM", frecuencia: "dosis única (inducción, combinada con sedante)", notas: "No usar en monoterapia: administrar siempre junto a una benzodiazepina o alfa-2 agonista." }
    }
  },
  {
    id: "propofol",
    principioActivo: "Propofol",
    nombresComerciales: ["PropoVet", "Propofol Lipuro (uso humano)"],
    categoria: "Anestésico intravenoso",
    indicaciones: ["Anestesia (inducción)"],
    especies: {
      perro: { dosisMin: 4, dosisMax: 6, unidad: "mg/kg", via: "IV", frecuencia: "administrar lento hasta efecto (dosis única)", notas: "Titular hasta efecto; dosis menor si hay premedicación previa. Apnea transitoria frecuente." },
      gato:  { dosisMin: 4, dosisMax: 6, unidad: "mg/kg", via: "IV", frecuencia: "administrar lento hasta efecto (dosis única)", notas: "Titular hasta efecto; dosis menor si hay premedicación previa. Apnea transitoria frecuente." }
    }
  },
  {
    id: "alfaxalona",
    principioActivo: "Alfaxalona",
    nombresComerciales: ["Alfaxan"],
    categoria: "Anestésico intravenoso",
    indicaciones: ["Anestesia (inducción)"],
    especies: {
      perro: { dosisMin: 2, dosisMax: 3, unidad: "mg/kg", via: "IV", frecuencia: "administrar lento hasta efecto (dosis única)", notas: "Dosis menor si hay premedicación previa." },
      gato:  { dosisMin: 2, dosisMax: 3, unidad: "mg/kg", via: "IV", frecuencia: "administrar lento hasta efecto (dosis única)", notas: "Dosis menor si hay premedicación previa." }
    }
  },
  {
    id: "atropina",
    principioActivo: "Atropina",
    nombresComerciales: ["Atropina B. Braun (uso humano)"],
    categoria: "Anticolinérgico",
    indicaciones: ["Premedicación anticolinérgica", "Bradicardia", "Emergencia/RCP"],
    especies: {
      perro: { dosisMin: 0.02, dosisMax: 0.04, unidad: "mg/kg", via: "IV/IM/SC", frecuencia: "dosis única, repetible si es necesario", notas: "No se usa de forma rutinaria en toda premedicación; reservar para bradicardia o emergencias." },
      gato:  { dosisMin: 0.02, dosisMax: 0.04, unidad: "mg/kg", via: "IV/IM/SC", frecuencia: "dosis única, repetible si es necesario", notas: "No se usa de forma rutinaria en toda premedicación; reservar para bradicardia o emergencias." }
    }
  },
  {
    id: "atenolol",
    principioActivo: "Atenolol",
    nombresComerciales: ["Tenormin (uso humano)"],
    categoria: "Betabloqueante cardioselectivo",
    indicaciones: ["Arritmia supraventricular", "Cardiomiopatía", "Hipertensión arterial sistémica"],
    especies: {
      perro: { dosisMin: 1, dosisMax: 2, unidad: "mg/kg", via: "VO", frecuencia: "cada 12 h", dosisMaxima: 50, notas: "Fuente: vademecum cardio (documento interno de la clínica). Dosis citada como 6,25-50 mg/perro cada 12 h (según tamaño); el rango mg/kg mostrado es una aproximación, limitada a los 50 mg citados como máximo." },
      gato:  { dosisMin: 1.5, dosisMax: 3, unidad: "mg/kg", via: "VO", frecuencia: "cada 12-24 h", dosisMaxima: 12.5, notas: "Fuente: vademecum cardio (documento interno de la clínica). Dosis citada como fija de 6,25-12,5 mg/gato cada 12-24 h, independientemente del peso; el rango mg/kg mostrado es una aproximación para un gato típico, limitada a los 12,5 mg/gato citados como máximo." }
    }
  },
  {
    id: "buprenorfina",
    principioActivo: "Buprenorfina",
    nombresComerciales: ["Bupaq", "Vetergesic"],
    categoria: "Opioide agonista parcial",
    indicaciones: ["Dolor", "Analgesia postquirúrgica", "Premedicación"],
    especies: {
      perro: { dosisMin: 0.01, dosisMax: 0.02, unidad: "mg/kg", via: "IV/IM/SC", frecuencia: "cada 6-8 h", notas: "Analgesia de inicio lento (20-30 min) pero más prolongada que butorfanol." },
      gato:  { dosisMin: 0.01, dosisMax: 0.02, unidad: "mg/kg", via: "IV/IM/SC/OTM", frecuencia: "cada 6-8 h", notas: "Buena absorción por vía transmucosa oral (OTM) en gatos." }
    }
  },
  {
    id: "naloxona",
    principioActivo: "Naloxona",
    nombresComerciales: ["Naloxona B. Braun (uso humano)"],
    categoria: "Antagonista opioide (reversor)",
    indicaciones: ["Reversión de opioides", "Emergencia/sobredosis"],
    especies: {
      perro: { dosisMin: 0.01, dosisMax: 0.04, unidad: "mg/kg", via: "IV/IM/SC", frecuencia: "dosis única, repetible cada 20-60 min si reaparece la sedación", notas: "Revierte también la analgesia opioide, no solo la sedación." },
      gato:  { dosisMin: 0.01, dosisMax: 0.04, unidad: "mg/kg", via: "IV/IM/SC", frecuencia: "dosis única, repetible cada 20-60 min si reaparece la sedación", notas: "Revierte también la analgesia opioide, no solo la sedación." }
    }
  },
  {
    id: "flumazenilo",
    principioActivo: "Flumazenilo",
    nombresComerciales: ["Anexate (uso humano)"],
    categoria: "Antagonista benzodiazepínico (reversor)",
    indicaciones: ["Reversión de benzodiazepinas (midazolam/diazepam)"],
    especies: {
      perro: { dosisMin: 0.01, dosisMax: 0.02, unidad: "mg/kg", via: "IV", frecuencia: "dosis única, repetible si reaparece la sedación", notas: "Vida media corta: puede necesitar repetirse antes que la benzodiazepina revertida." },
      gato:  { dosisMin: 0.01, dosisMax: 0.02, unidad: "mg/kg", via: "IV", frecuencia: "dosis única, repetible si reaparece la sedación", notas: "Vida media corta: puede necesitar repetirse antes que la benzodiazepina revertida." }
    }
  },
  {
    id: "xilazina",
    principioActivo: "Xilazina",
    nombresComerciales: ["Rompun"],
    categoria: "Sedante alfa-2 agonista",
    indicaciones: ["Sedación", "Premedicación", "Inducción del vómito (perro)"],
    especies: {
      perro: { dosisMin: 0.5, dosisMax: 1, unidad: "mg/kg", via: "IV/IM", frecuencia: "dosis única (premedicación)", notas: "Produce bradicardia y vómito frecuentes. En gran parte sustituida por dexmedetomidina en pequeños animales." },
      gato:  { dosisMin: 1, dosisMax: 2, unidad: "mg/kg", via: "IM", frecuencia: "dosis única (premedicación)", notas: "Produce bradicardia y vómito frecuentes. En gran parte sustituida por dexmedetomidina en pequeños animales." }
    }
  },
  {
    id: "lidocaina",
    principioActivo: "Lidocaína",
    nombresComerciales: ["Lidocaína B. Braun (uso humano)", "Lambda Vet"],
    categoria: "Anestésico local / antiarrítmico",
    indicaciones: ["Anestesia local", "Arritmia ventricular", "Analgesia (CRI)"],
    especies: {
      perro: { dosisMin: 2, dosisMax: 4, unidad: "mg/kg", via: "IV lento / infiltración local", frecuencia: "dosis única IV (antiarrítmico); no superar 6-8 mg/kg total en infiltración local", notas: "Vigilar signos de toxicidad (temblores, convulsiones) con dosis altas o IV rápida." },
      gato:  { dosisMin: 0.25, dosisMax: 0.5, unidad: "mg/kg", via: "IV lento", frecuencia: "dosis única, administrar muy lento", notas: "Los gatos son mucho más sensibles a la toxicidad por lidocaína: usar dosis muy inferiores a las de perro." }
    }
  },
  {
    id: "bupivacaina",
    principioActivo: "Bupivacaína",
    nombresComerciales: ["Bupivacaína B. Braun (uso humano)"],
    categoria: "Anestésico local",
    indicaciones: ["Anestesia local", "Bloqueo regional"],
    especies: {
      perro: { dosisMin: 1, dosisMax: 2, unidad: "mg/kg", via: "Infiltración local/bloqueo", frecuencia: "no repetir antes de 4-6 h; no superar la dosis máxima total", notas: "No administrar IV. Inicio de acción más lento que lidocaína pero efecto más prolongado." },
      gato:  { dosisMin: 1, dosisMax: 2, unidad: "mg/kg", via: "Infiltración local/bloqueo", frecuencia: "no repetir antes de 4-6 h; no superar la dosis máxima total", notas: "No administrar IV. Inicio de acción más lento que lidocaína pero efecto más prolongado." }
    }
  },
  {
    id: "cefovecina",
    principioActivo: "Cefovecina",
    nombresComerciales: ["Convenia"],
    categoria: "Antibiótico (cefalosporina 3ª gen., larga duración)",
    indicaciones: ["Infección cutánea", "Infección urinaria", "Infección bacteriana"],
    especies: {
      perro: { dosisMin: 8, dosisMax: 8, unidad: "mg/kg", via: "SC", frecuencia: "dosis única; efecto hasta 14 días", notas: "No repetir antes de 14 días. Útil cuando la administración oral repetida no es viable." },
      gato:  { dosisMin: 8, dosisMax: 8, unidad: "mg/kg", via: "SC", frecuencia: "dosis única; efecto hasta 14 días", notas: "No repetir antes de 14 días. Útil cuando la administración oral repetida no es viable." }
    }
  },
  {
    id: "marbofloxacina",
    principioActivo: "Marbofloxacina",
    nombresComerciales: ["Marbocyl", "Forcyl"],
    categoria: "Antibiótico (fluoroquinolona)",
    indicaciones: ["Infección bacteriana", "Infección urinaria", "Infección cutánea"],
    especies: {
      perro: { dosisMin: 2, dosisMax: 4, unidad: "mg/kg", via: "VO/SC", frecuencia: "cada 24 h", notas: "Evitar en cachorros en crecimiento (riesgo de lesión del cartílago)." },
      gato:  { dosisMin: 2, dosisMax: 4, unidad: "mg/kg", via: "VO/SC", frecuencia: "cada 24 h", notas: "Evitar en cachorros/gatitos en crecimiento (riesgo de lesión del cartílago)." }
    }
  },
  {
    id: "trimetoprim-sulfametoxazol",
    principioActivo: "Trimetoprim/Sulfametoxazol",
    nombresComerciales: ["Duphatrim", "Norodine"],
    categoria: "Antibiótico (sulfonamida potenciada)",
    indicaciones: ["Infección bacteriana", "Infección urinaria"],
    especies: {
      perro: { dosisMin: 15, dosisMax: 30, unidad: "mg/kg", via: "VO", frecuencia: "cada 12 h", notas: "Tratamientos largos: vigilar queratoconjuntivitis seca y función hepática/hematológica." },
      gato:  { dosisMin: 15, dosisMax: 30, unidad: "mg/kg", via: "VO", frecuencia: "cada 12 h", notas: "Usar con precaución; los gatos son más sensibles a efectos adversos hematológicos." }
    }
  },
  {
    id: "cefpodoxima",
    principioActivo: "Cefpodoxima",
    nombresComerciales: ["Simplicef"],
    categoria: "Antibiótico (cefalosporina)",
    indicaciones: ["Infección cutánea", "Infección bacteriana"],
    especies: {
      perro: { dosisMin: 5, dosisMax: 10, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h", notas: "" }
    }
  },
  {
    id: "azitromicina",
    principioActivo: "Azitromicina",
    nombresComerciales: ["Zitromax (uso humano)"],
    categoria: "Antibiótico (macrólido)",
    indicaciones: ["Infección bacteriana", "Infección respiratoria"],
    especies: {
      perro: { dosisMin: 5, dosisMax: 10, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h (algunos protocolos: cada 24-48 h tras dosis de carga)", notas: "" },
      gato:  { dosisMin: 5, dosisMax: 10, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h (algunos protocolos: cada 24-48 h tras dosis de carga)", notas: "" }
    }
  },
  {
    id: "ampicilina",
    principioActivo: "Ampicilina",
    nombresComerciales: ["Britapen (uso humano)"],
    categoria: "Antibiótico (betalactámico)",
    indicaciones: ["Sepsis/bacteriemia", "Profilaxis quirúrgica", "Neumonía", "Piotórax", "Gastroenteritis hemorrágica grave"],
    especies: {
      perro: { dosisMin: 20, dosisMax: 30, unidad: "mg/kg", via: "IV/IM", frecuencia: "cada 6-8 h (profilaxis quirúrgica: cada 2 h durante la cirugía)", notas: "Uso hospitalario/parenteral; ver también la ficha de \"Amoxicilina\" para presentación oral." },
      gato:  { dosisMin: 20, dosisMax: 30, unidad: "mg/kg", via: "IV/IM", frecuencia: "cada 6-8 h (profilaxis quirúrgica: cada 2 h durante la cirugía)", notas: "Uso hospitalario/parenteral; ver también la ficha de \"Amoxicilina\" para presentación oral." }
    }
  },
  {
    id: "cefazolina",
    principioActivo: "Cefazolina",
    nombresComerciales: ["Cefazolina Normon (uso humano)"],
    categoria: "Antibiótico (cefalosporina)",
    indicaciones: ["Profilaxis quirúrgica", "Infección bacteriana"],
    especies: {
      perro: { dosisMin: 20, dosisMax: 30, unidad: "mg/kg", via: "IV", frecuencia: "cada 90-120 min durante la cirugía (profilaxis); cada 6-8 h si es tratamiento", notas: "Dosis en el rango alto para cirugías óseas invasivas. Uso hospitalario, no VO." },
      gato:  { dosisMin: 20, dosisMax: 30, unidad: "mg/kg", via: "IV", frecuencia: "cada 90-120 min durante la cirugía (profilaxis); cada 6-8 h si es tratamiento", notas: "Dosis en el rango alto para cirugías óseas invasivas. Uso hospitalario, no VO." }
    }
  },
  {
    id: "cefadroxilo",
    principioActivo: "Cefadroxilo",
    nombresComerciales: ["Semelcef"],
    categoria: "Antibiótico (cefalosporina)",
    indicaciones: ["Infección cutánea", "Infección bacteriana"],
    especies: {
      perro: { dosisMin: 20, dosisMax: 20, unidad: "mg/kg", via: "VO", frecuencia: "cada 12 h", notas: "" },
      gato:  { dosisMin: 20, dosisMax: 20, unidad: "mg/kg", via: "VO", frecuencia: "cada 12 h", notas: "" }
    }
  },
  {
    id: "pradofloxacina",
    principioActivo: "Pradofloxacina",
    nombresComerciales: ["Veraflox"],
    categoria: "Antibiótico (fluoroquinolona)",
    indicaciones: ["Infección cutánea", "Infección bacteriana", "Infección urinaria"],
    especies: {
      perro: { dosisMin: 3, dosisMax: 4.5, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h", notas: "Reservar las fluoroquinolonas para cuando no haya alternativas de espectro reducido eficaces (categoría B EMA)." },
      gato:  { dosisMin: 3, dosisMax: 4.5, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h", notas: "Reservar las fluoroquinolonas para cuando no haya alternativas de espectro reducido eficaces (categoría B EMA)." }
    }
  },
  {
    id: "robenacoxib",
    principioActivo: "Robenacoxib",
    nombresComerciales: ["Onsior"],
    categoria: "AINE (selectivo COX-2)",
    indicaciones: ["Dolor", "Inflamación", "Dolor postquirúrgico"],
    especies: {
      perro: { dosisMin: 1, dosisMax: 2, unidad: "mg/kg", via: "VO/SC", frecuencia: "cada 24 h", notas: "No combinar con otros AINEs ni corticoides." },
      gato:  { dosisMin: 1, dosisMax: 2.4, unidad: "mg/kg", via: "VO/SC", frecuencia: "cada 24 h", notas: "Vía oral limitada a 6 días consecutivos en algunas indicaciones; la vía SC tiene otras restricciones de duración. No combinar con otros AINEs ni corticoides." }
    }
  },
  {
    id: "firocoxib",
    principioActivo: "Firocoxib",
    nombresComerciales: ["Previcox"],
    categoria: "AINE (selectivo COX-2)",
    indicaciones: ["Dolor", "Inflamación", "Osteoartritis"],
    especies: {
      perro: { dosisMin: 5, dosisMax: 5, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h", notas: "No combinar con otros AINEs ni corticoides." }
      // No indicado en gato.
    }
  },
  {
    id: "grapiprant",
    principioActivo: "Grapiprant",
    nombresComerciales: ["Galliprant"],
    categoria: "AINE (antagonista del receptor EP4)",
    indicaciones: ["Dolor", "Osteoartritis"],
    especies: {
      perro: { dosisMin: 2, dosisMax: 2, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h", notas: "Mecanismo distinto a los AINEs clásicos; no combinar con otros AINEs ni corticoides salvo indicación específica del veterinario." }
      // No indicado en gato.
    }
  },
  {
    id: "metilprednisolona",
    principioActivo: "Metilprednisolona",
    nombresComerciales: ["Urbason (uso humano)", "Medrol (uso humano)"],
    categoria: "Corticoide",
    indicaciones: ["Inflamación", "Alergia", "Enfermedad inmunomediada"],
    especies: {
      perro: { dosisMin: 0.5, dosisMax: 1, unidad: "mg/kg", via: "VO/IV/IM", frecuencia: "cada 12-24 h (antiinflamatoria)", notas: "Reducir dosis de forma gradual en tratamientos largos. No combinar con AINEs." },
      gato:  { dosisMin: 0.5, dosisMax: 1, unidad: "mg/kg", via: "VO/IV/IM", frecuencia: "cada 12-24 h (antiinflamatoria)", notas: "Reducir dosis de forma gradual en tratamientos largos. No combinar con AINEs." }
    }
  },
  {
    id: "pimobendan",
    principioActivo: "Pimobendán",
    nombresComerciales: ["Vetmedin", "Cardisure"],
    categoria: "Inotrópico cardíaco (sensibilizador del calcio + IPDE-III)",
    indicaciones: ["Insuficiencia cardíaca congestiva", "Cardiomiopatía"],
    especies: {
      perro: { dosisMin: 0.2, dosisMax: 0.3, unidad: "mg/kg", via: "VO", frecuencia: "cada 12 h, con el estómago vacío", notas: "Administrar aproximadamente 1 h antes de la comida." },
      gato:  { dosisMin: 0.125, dosisMax: 0.3, unidad: "mg/kg", via: "VO", frecuencia: "cada 12 h", notas: "Uso extendido (off-label) en cardiomiopatía hipertrófica felina; consultar protocolo específico." }
    }
  },
  {
    id: "benazepril",
    principioActivo: "Benazepril",
    nombresComerciales: ["Fortekor", "Benefortin", "Cardalis (combinado con espironolactona)"],
    categoria: "IECA (antihipertensivo/cardiorrenal)",
    indicaciones: ["Insuficiencia cardíaca congestiva", "Enfermedad renal crónica", "Proteinuria"],
    especies: {
      perro: { dosisMin: 0.25, dosisMax: 0.5, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h", notas: "Vigilar función renal y potasio al iniciar o ajustar dosis." },
      gato:  { dosisMin: 0.25, dosisMax: 0.5, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h", notas: "Vigilar función renal y potasio al iniciar o ajustar dosis." }
    }
  },
  {
    id: "enalapril",
    principioActivo: "Enalapril",
    nombresComerciales: ["Enacard", "Vasotop"],
    categoria: "IECA (antihipertensivo/cardíaco)",
    indicaciones: ["Insuficiencia cardíaca congestiva"],
    especies: {
      perro: { dosisMin: 0.5, dosisMax: 0.5, unidad: "mg/kg", via: "VO", frecuencia: "cada 12-24 h", notas: "Vigilar función renal y potasio al iniciar o ajustar dosis." },
      gato:  { dosisMin: 0.25, dosisMax: 0.5, unidad: "mg/kg", via: "VO", frecuencia: "cada 12-24 h", notas: "Vigilar función renal y potasio al iniciar o ajustar dosis." }
    }
  },
  {
    id: "espironolactona",
    principioActivo: "Espironolactona",
    nombresComerciales: ["Prilactone", "Cardalis (combinado con benazepril)"],
    categoria: "Diurético ahorrador de potasio",
    indicaciones: ["Insuficiencia cardíaca congestiva"],
    especies: {
      perro: { dosisMin: 1, dosisMax: 2, unidad: "mg/kg", via: "VO", frecuencia: "cada 12 h", notas: "Habitual en combinación con furosemida y/o benazepril/enalapril. Vigilar potasio." },
      gato:  { dosisMin: 1, dosisMax: 2, unidad: "mg/kg", via: "VO", frecuencia: "cada 12 h", notas: "Habitual en combinación con furosemida y/o IECA. Vigilar potasio." }
    }
  },
  {
    id: "digoxina",
    principioActivo: "Digoxina",
    nombresComerciales: ["Lanoxin (uso humano)"],
    categoria: "Antiarrítmico/inotrópico (margen terapéutico estrecho)",
    indicaciones: ["Insuficiencia cardíaca congestiva", "Arritmia supraventricular"],
    especies: {
      perro: { dosisMin: 0.003, dosisMax: 0.005, unidad: "mg/kg", via: "VO", frecuencia: "cada 12 h", notas: "Margen terapéutico muy estrecho: monitorizar niveles séricos y función renal periódicamente." },
      gato:  { dosisMin: 0.002, dosisMax: 0.004, unidad: "mg/kg", via: "VO", frecuencia: "cada 48 h", notas: "Los gatos son muy sensibles a la toxicidad digitálica: monitorizar niveles séricos estrechamente. Alternativa citada en vademecum cardio (fuente interna de la clínica): dosis FIJA de 0,03 mg/gato cada 12-48 h, independientemente del peso — convención habitual en cardiología felina para evitar sobredosificación." }
    }
  },
  {
    id: "clopidogrel",
    principioActivo: "Clopidogrel",
    nombresComerciales: ["Plavix (uso humano)", "Clopivet"],
    categoria: "Antiagregante plaquetario",
    indicaciones: ["Prevención de tromboembolismo (cardiomiopatía felina)"],
    especies: {
      perro: { dosisMin: 1, dosisMax: 3, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h", notas: "" },
      gato:  { dosisMin: 2, dosisMax: 4, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h", dosisMaxima: 18.75, notas: "Habitualmente pautado como dosis fija de 18,75 mg/gato/día independientemente del peso; el rango mg/kg es orientativo." }
    }
  },
  {
    id: "metimazol",
    principioActivo: "Metimazol",
    nombresComerciales: ["Felimazole"],
    categoria: "Antitiroideo",
    indicaciones: ["Hipertiroidismo felino"],
    especies: {
      gato: { dosisMin: 1.25, dosisMax: 2.5, unidad: "mg/kg", via: "VO", frecuencia: "cada 12 h (dosis inicial; ajustar según T4)", dosisMaxima: 5, notas: "Habitualmente pautado como 2,5 mg/gato cada 12 h de inicio, ajustando según control de T4. Vigilar hemograma y función hepática las primeras semanas." }
      // No indicado en perro (el hipertiroidismo canino es excepcional).
    }
  },
  {
    id: "trilostano",
    principioActivo: "Trilostano",
    nombresComerciales: ["Vetoryl"],
    categoria: "Inhibidor de la síntesis de cortisol",
    indicaciones: ["Hiperadrenocorticismo (Cushing)"],
    especies: {
      perro: { dosisMin: 1, dosisMax: 3, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h (algunos protocolos: cada 12 h), con alimento", notas: "Requiere monitorización estrecha con test de estimulación con ACTH; ajustar dosis según respuesta." }
    }
  },
  {
    id: "levetiracetam",
    principioActivo: "Levetiracetam",
    nombresComerciales: ["Keppra (uso humano)"],
    categoria: "Anticonvulsivo",
    indicaciones: ["Epilepsia", "Convulsiones"],
    especies: {
      perro: { dosisMin: 20, dosisMax: 20, unidad: "mg/kg", via: "VO/IV", frecuencia: "cada 8 h", notas: "Buen perfil de seguridad hepática; útil como coadyuvante o en crisis agudas." },
      gato:  { dosisMin: 20, dosisMax: 20, unidad: "mg/kg", via: "VO/IV", frecuencia: "cada 8 h", notas: "Buen perfil de seguridad hepática; útil como coadyuvante o en crisis agudas." }
    }
  },
  {
    id: "zonisamida",
    principioActivo: "Zonisamida",
    nombresComerciales: ["Zonisamide (uso humano)"],
    categoria: "Anticonvulsivo",
    indicaciones: ["Epilepsia", "Convulsiones"],
    especies: {
      perro: { dosisMin: 5, dosisMax: 10, unidad: "mg/kg", via: "VO", frecuencia: "cada 12 h", notas: "Monitorizar función hepática." },
      gato:  { dosisMin: 5, dosisMax: 10, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h", notas: "Monitorizar función hepática." }
    }
  },
  {
    id: "lotilaner",
    principioActivo: "Lotilaner",
    nombresComerciales: ["Credelio", "Adtab"],
    categoria: "Antiparasitario externo (isoxazolina)",
    indicaciones: ["Pulgas", "Garrapatas", "Sarna sarcóptica", "Sarna demodécica"],
    especies: {
      perro: {
        tipoDosis: "banda",
        pesoMinimo: 1.3,
        via: "VO (comprimido masticable)",
        frecuencia: "una vez al mes, con o después de la comida",
        notas: "Dosis 20-43 mg/kg. Actividad persistente 1 mes frente a pulgas y garrapatas. Sarna sarcóptica y demodicosis: mensual 2 meses consecutivos, continuar hasta 2 raspados cutáneos negativos consecutivos; casos graves pueden requerir tratamiento prolongado. Dosis fija por tramo de peso según ficha técnica, no mg/kg lineal. Fuente: Summary of Product Characteristics, VMD (Reino Unido), VM 52127/5009 — equivalente al registro CIMAVET EU/2/17/206 (CIMAVET bloqueado por CAPTCHA al ser autorización centralizada UE)." ,
        bandas: [
          { pesoMin: 1.3, pesoMax: 2.5, mg: 56, comprimidos: 1, descripcion: "1 comprimido de 56 mg" },
          { pesoMin: 2.6, pesoMax: 5.5, mg: 112, comprimidos: 1, descripcion: "1 comprimido de 112 mg" },
          { pesoMin: 5.6, pesoMax: 11.0, mg: 225, comprimidos: 1, descripcion: "1 comprimido de 225 mg" },
          { pesoMin: 11.1, pesoMax: 22.0, mg: 450, comprimidos: 1, descripcion: "1 comprimido de 450 mg" },
          { pesoMin: 22.1, pesoMax: 45.0, mg: 900, comprimidos: 1, descripcion: "1 comprimido de 900 mg" }
        ]
      },
      gato: {
        tipoDosis: "banda",
        pesoMinimo: 0.5,
        via: "VO (comprimido masticable)",
        frecuencia: "una vez al mes, con o dentro de los 30 min tras la comida",
        notas: "Dosis 6-24 mg/kg. Actividad persistente 1 mes frente a pulgas y garrapatas; tratamiento mensual durante toda la temporada. Dosis fija por tramo de peso según ficha técnica, no mg/kg lineal. Fuente: Summary of Product Characteristics, VMD (Reino Unido), equivalente al registro CIMAVET EU/2/17/206 (CIMAVET bloqueado por CAPTCHA al ser autorización centralizada UE)." ,
        bandas: [
          { pesoMin: 0.5, pesoMax: 2.0, mg: 12, comprimidos: 1, descripcion: "1 comprimido de 12 mg" },
          { pesoMin: 2.1, pesoMax: 8.0, mg: 48, comprimidos: 1, descripcion: "1 comprimido de 48 mg" }
        ]
      }
    }
  },
  {
    id: "sarolaner",
    principioActivo: "Sarolaner",
    nombresComerciales: ["Simparica"],
    categoria: "Antiparasitario externo (isoxazolina)",
    indicaciones: ["Pulgas", "Garrapatas", "Sarna sarcóptica", "Sarna demodécica", "Otodectes"],
    especies: {
      perro: {
        tipoDosis: "banda",
        pesoMinimo: 1.3,
        via: "VO (comprimido masticable)",
        frecuencia: "una vez al mes",
        notas: "Dosis 2-4 mg/kg. Pulgas y garrapatas: actividad persistente ≥5 semanas, mensual durante toda la temporada. Otodectes: dosis única, revalorar a los 30 días. Sarna sarcóptica: mensual 2 meses consecutivos. Demodicosis: mensual 3 meses consecutivos, continuar hasta 2 raspados cutáneos negativos consecutivos. Dosis fija por tramo de peso según ficha técnica, no mg/kg lineal. Fuente: Summary of Product Characteristics, VMD (Reino Unido), VM 42058/5052 — equivalente al registro CIMAVET EU/2/15/191 (CIMAVET bloqueado por CAPTCHA al ser autorización centralizada UE)." ,
        bandas: [
          { pesoMin: 1.3, pesoMax: 2.5, mg: 5, comprimidos: 1, descripcion: "1 comprimido de 5 mg" },
          { pesoMin: 2.6, pesoMax: 5.0, mg: 10, comprimidos: 1, descripcion: "1 comprimido de 10 mg" },
          { pesoMin: 5.1, pesoMax: 10.0, mg: 20, comprimidos: 1, descripcion: "1 comprimido de 20 mg" },
          { pesoMin: 10.1, pesoMax: 20.0, mg: 40, comprimidos: 1, descripcion: "1 comprimido de 40 mg" },
          { pesoMin: 20.1, pesoMax: 40.0, mg: 80, comprimidos: 1, descripcion: "1 comprimido de 80 mg" },
          { pesoMin: 40.1, pesoMax: 60.0, mg: 120, comprimidos: 1, descripcion: "1 comprimido de 120 mg" }
        ]
      }
    }
  },
  {
    id: "afoxolaner",
    principioActivo: "Afoxolaner",
    nombresComerciales: ["Nexgard", "Frontpro"],
    categoria: "Antiparasitario externo (isoxazolina)",
    indicaciones: ["Pulgas", "Garrapatas", "Sarna sarcóptica", "Sarna demodécica", "Otodectes"],
    especies: {
      perro: {
        tipoDosis: "banda",
        pesoMinimo: 2,
        via: "VO (comprimido masticable)",
        frecuencia: "una vez al mes",
        notas: "Dosis 2,7-7 mg/kg. Pulgas: actividad persistente ≥5 semanas. Garrapatas: tratamiento mensual. Sarna sarcóptica: mensual 2 meses consecutivos (o más según respuesta). Otodectes: dosis única, revalorar al mes. Demodicosis: mensual, casos graves pueden requerir tratamiento prolongado. Dosis fija por tramo de peso según ficha técnica, no mg/kg lineal. Fuente: Summary of Product Characteristics, VMD (Reino Unido), VM 61700/5028 — equivalente al registro CIMAVET EU/2/13/159 (CIMAVET bloqueado por CAPTCHA al ser autorización centralizada UE)." ,
        bandas: [
          { pesoMin: 2, pesoMax: 4.0, mg: 11, comprimidos: 1, descripcion: "1 comprimido de 11 mg" },
          { pesoMin: 4.1, pesoMax: 10.0, mg: 28, comprimidos: 1, descripcion: "1 comprimido de 28 mg" },
          { pesoMin: 10.1, pesoMax: 25.0, mg: 68, comprimidos: 1, descripcion: "1 comprimido de 68 mg" },
          { pesoMin: 25.1, pesoMax: 50.0, mg: 136, comprimidos: 1, descripcion: "1 comprimido de 136 mg" }
        ]
      }
    }
  },
  {
    id: "enflicoxib",
    principioActivo: "Enflicoxib",
    nombresComerciales: ["Daxocox"],
    categoria: "AINE (inhibidor selectivo de la COX-2, dosificación semanal)",
    indicaciones: ["Dolor osteoarticular", "Osteoartritis"],
    especies: {
      perro: { dosisMin: 4, dosisMax: 8, unidad: "mg/kg", via: "VO", frecuencia: "una vez por semana: 1ª dosis 8 mg/kg, después mantenimiento 4 mg/kg cada 7 días", notas: "Dosificación SEMANAL, no diaria: 1ª toma a 8 mg/kg, siguientes tomas (cada 7 días) a 4 mg/kg. No combinar con corticoides ni otros AINE. Fuente: Summary of Product Characteristics, VMD (Reino Unido), VM 32742/5005 — equivalente al registro CIMAVET EU/2/21/270 (CIMAVET bloqueado por CAPTCHA al ser autorización centralizada UE)." }
    }
  },
  {
    id: "mavacoxib",
    principioActivo: "Mavacoxib",
    nombresComerciales: ["Trocoxil"],
    categoria: "AINE (inhibidor selectivo de la COX-2, acción prolongada)",
    indicaciones: ["Dolor osteoarticular", "Osteoartritis"],
    especies: {
      perro: { dosisMin: 2, dosisMax: 2, unidad: "mg/kg", via: "VO", frecuencia: "⚠ NO es un AINE diario: 1ª toma, repetir a los 14 días, después cada mes; máximo 7 dosis (6,5 meses) por ciclo", notas: "Dar inmediatamente antes o con la comida principal. Vida media muy larga (14-19 días), por lo que un error de pauta (darlo a diario) es sobredosis grave. No usar en perros <5 kg ni <12 meses. No combinar con corticoides ni otros AINE. Fuente: Summary of Product Characteristics, VMD (Reino Unido), VM 42058/5076 — equivalente al registro CIMAVET EU/2/08/084 (CIMAVET bloqueado por CAPTCHA al ser autorización centralizada UE)." }
    }
  },
  {
    id: "cimicoxib",
    principioActivo: "Cimicoxib",
    nombresComerciales: ["Cimalgex"],
    categoria: "AINE (inhibidor selectivo de la COX-2)",
    indicaciones: ["Dolor osteoarticular", "Osteoartritis", "Dolor perioperatorio"],
    especies: {
      perro: { dosisMin: 2, dosisMax: 2, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h", notas: "Dolor e inflamación por osteoartritis y manejo del dolor perioperatorio (cirugía ortopédica o de tejidos blandos). No usar en perros <10 semanas. No combinar con corticoides ni otros AINE (respetar periodo de lavado). Fuente: Summary of Product Characteristics, VMD (Reino Unido), VM 06462/5000 — equivalente al registro CIMAVET EU/2/10/119 (CIMAVET bloqueado por CAPTCHA al ser autorización centralizada UE)." }
    }
  },
  {
    id: "atinvicitinib",
    principioActivo: "Atinvicitinib",
    nombresComerciales: ["Numelvi"],
    categoria: "Inmunomodulador (inhibidor de JAK, antipruriginoso)",
    indicaciones: ["Dermatitis alérgica", "Dermatitis atópica", "Prurito"],
    especies: {
      perro: { dosisMin: 0.8, dosisMax: 1.2, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h, con o cerca de la comida", notas: "Comprimidos ranurados (4,8/7,2/21,6/31,6 mg) fraccionables por mitades según tabla de peso de la ficha técnica. Producto nuevo (autorizado GB en 01/2026). Fuente: Summary of Product Characteristics, VMD (Reino Unido), VM 01708/5134 — equivalente al registro CIMAVET EU/2/25/351 (CIMAVET bloqueado por CAPTCHA al ser autorización centralizada UE)." }
    }
  },
  {
    id: "ilunocitinib",
    principioActivo: "Ilunocitinib",
    nombresComerciales: ["Zenrelia"],
    categoria: "Inmunomodulador (inhibidor de JAK, antipruriginoso)",
    indicaciones: ["Dermatitis alérgica", "Dermatitis atópica", "Prurito"],
    especies: {
      perro: { dosisMin: 0.6, dosisMax: 0.8, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h", notas: "Investigar y tratar causas subyacentes (pulgas, alergia alimentaria, contacto) e infecciones/infestaciones concomitantes. No usar en perros con inmunosupresión. Duración del tratamiento según valoración riesgo-beneficio individual. Comprimidos ranurados (4,8/6,4/8,5/15 mg) fraccionables por mitades según tabla de peso de la ficha técnica. Fuente: Summary of Product Characteristics, VMD (Reino Unido), VM 52127/5063 — equivalente al registro CIMAVET EU/2/25/349 (CIMAVET bloqueado por CAPTCHA al ser autorización centralizada UE)." }
    }
  },
  {
    id: "osaterona",
    principioActivo: "Osaterona",
    nombresComerciales: ["Ypozane"],
    categoria: "Antiandrógeno",
    indicaciones: ["Hiperplasia prostática benigna"],
    especies: {
      perro: { dosisMin: 0.25, dosisMax: 0.5, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h durante 7 días", notas: "Hiperplasia prostática benigna en machos enteros. Comprimidos por tramo de peso: 3-7,5 kg → 1,875 mg; 7,5-15 kg → 3,75 mg; 15-30 kg → 7,5 mg; 30-60 kg → 15 mg (1 comprimido/día, 7 días). Sin datos en perros <3 kg. Fuente: Summary of Product Characteristics, VMD (Reino Unido), VM 05653/5023 — equivalente al registro CIMAVET EU/2/06/068 (CIMAVET bloqueado por CAPTCHA al ser autorización centralizada UE)." }
    }
  },
  {
    id: "deslorelina",
    principioActivo: "Deslorelina",
    nombresComerciales: ["Suprelorin"],
    categoria: "Agonista de la GnRH (implante anticonceptivo)",
    indicaciones: ["Infertilidad temporal / anticoncepción"],
    especies: {
      perro: { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "SC (implante)", frecuencia: "1 implante cada 6 meses (macho adulto) o dosis única prepuberal", notas: "Dosis fija: 1 implante de 4,7 mg por animal, independientemente del tamaño/peso. Macho intacto adulto: infertilidad temporal desde 6 semanas hasta al menos 6 meses tras el implante; reimplantar cada 6 meses para mantener el efecto sin periodo de fertilidad intermedio. Hembra prepuberal: implantar entre 12-16 semanas de edad para retrasar el primer celo. Existe también presentación de 9,4 mg (perros y hurones). Fuente: Summary of Product Characteristics, VMD (Reino Unido), VM 05653/5017 — equivalente al registro CIMAVET EU/2/07/072 (CIMAVET bloqueado por CAPTCHA al ser autorización centralizada UE)." },
      gato:  { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "SC (implante)", frecuencia: "1 implante", notas: "Dosis fija: 1 implante de 4,7 mg por animal, independientemente del peso. Macho intacto ≥3 meses: infertilidad temporal y supresión del olor de la orina, libido, vocalización, marcaje y agresividad. Fuente: Summary of Product Characteristics, VMD (Reino Unido), VM 05653/5017 — equivalente al registro CIMAVET EU/2/07/072 (CIMAVET bloqueado por CAPTCHA al ser autorización centralizada UE)." }
    }
  },
  {
    id: "estriol",
    principioActivo: "Estriol",
    nombresComerciales: ["Incurin"],
    categoria: "Estrógeno de acción corta",
    indicaciones: ["Incontinencia urinaria hormonodependiente"],
    especies: {
      perro: { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h, ajuste individual (no existe relación establecida con el peso)", notas: "Solo en perras esterilizadas (ovariohisterectomizadas) >1 año, incontinencia por incompetencia del mecanismo esfinteriano. Iniciar con 1 comprimido/día (1 mg); si funciona, bajar a 1/2 comprimido/día (0,5 mg, dosis mínima); si no funciona, subir a 2 comprimidos/día (2 mg, dosis máxima) en toma única. Usar la dosis eficaz más baja posible; en algunas perras basta con días alternos. Revisión cada 6 meses. No usar en perras enteras, con polidipsia-poliuria, ni en gestación/lactancia. Fuente: Summary of Product Characteristics, VMD (Reino Unido), VM 01708/5038 — equivalente al registro CIMAVET EU/2/00/018 (CIMAVET bloqueado por CAPTCHA al ser autorización centralizada UE)." }
    }
  },
  {
    id: "ropinirol",
    principioActivo: "Ropinirol",
    nombresComerciales: ["Clevor"],
    categoria: "Agonista dopaminérgico (emético)",
    indicaciones: ["Inducción del vómito (descontaminación digestiva)"],
    especies: {
      perro: { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "Oftálmica (colirio, no VO/parenteral)", frecuencia: "dosis única en el/los ojo(s) según tabla de peso; repetir la misma dosis si no vomita en 15 min", notas: "Colirio para inducir el vómito (no es un fármaco sistémico clásico: se absorbe por vía conjuntival). Dosis por tramo de peso (no lineal mg/kg): 1,8-5 kg → 1 gota; 5,1-10 kg → 2 gotas; 10,1-20 kg → 3 gotas; 20,1-35 kg → 4 gotas; 35,1-60 kg → 6 gotas; 60,1-100 kg → 8 gotas (1 gota ≈ 810 µg ropinirol). Si son 2-4 gotas, repartir entre ambos ojos; si son 6-8 gotas, dividir en 2 administraciones separadas 1-2 min. No usar en perros <1,8 kg, <4,5 meses, con depresión del SNC, convulsiones u otros problemas neurológicos que puedan favorecer la aspiración. Fuente: Summary of Product Characteristics, VMD (Reino Unido), equivalente al registro CIMAVET EU/2/17/222 (CIMAVET bloqueado por CAPTCHA al ser autorización centralizada UE)." }
    }
  },
  {
    id: "toceranib",
    principioActivo: "Toceranib",
    nombresComerciales: ["Palladia"],
    categoria: "Inhibidor de tirosina-quinasa (terapia dirigida, oncológico)",
    indicaciones: ["Mastocitoma"],
    especies: {
      perro: { dosisMin: 3.25, dosisMax: 3.25, unidad: "mg/kg", via: "VO", frecuencia: "días alternos (cada 48 h)", notas: "Dosis inicial recomendada 3,25 mg/kg cada 48 h, en mastocitomas grado 2/3 recurrentes con o sin metástasis en ganglio linfático. Reevaluación veterinaria semanal las primeras 6 semanas, después cada 6 semanas. Si hay efectos adversos, reducir a 2,75 mg/kg o 2,25 mg/kg (no bajar de 2,2 mg/kg) o interrumpir hasta 2 semanas. Combinar habitualmente con un AINE anti-COX2 los días que no se administra toceranib. Fuente: European Commission Community Register (Anexo I, Summary of Product Characteristics), equivalente al registro CIMAVET EU/2/09/100 (CIMAVET bloqueado por CAPTCHA al ser autorización centralizada UE)." }
    }
  },
  {
    id: "masitinib",
    principioActivo: "Masitinib",
    nombresComerciales: ["Masivet"],
    categoria: "Inhibidor de tirosina-quinasa (terapia dirigida, oncológico)",
    indicaciones: ["Mastocitoma"],
    especies: {
      perro: { dosisMin: 11, dosisMax: 14, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h", notas: "Dosis recomendada 12,5 mg/kg/día (rango 11-14 mg/kg). Indicado en mastocitomas grado 2/3 recurrentes o no resecables con mutación activadora del receptor c-Kit. En perros <15 kg el ajuste exacto no siempre es posible: usar combinación de comprimidos de 50/150 mg para acercarse al objetivo. Si hay reacciones adversas, reducir a 9 mg/kg/día (rango 7,5-10,5) o 6 mg/kg/día (rango 4,5-7,5). Tratamiento continuo mientras la enfermedad esté estable o responda. Fuente: European Commission Community Register (Anexo I, Summary of Product Characteristics), equivalente al registro CIMAVET EU/2/08/087 (CIMAVET bloqueado por CAPTCHA al ser autorización centralizada UE)." }
    }
  },
  {
    id: "pregabalina",
    principioActivo: "Pregabalina",
    nombresComerciales: ["Bonqat"],
    categoria: "Anticonvulsivante / analgésico neuropático",
    indicaciones: ["Ansiedad aguda", "Dolor neuropático", "Epilepsia (coadyuvante)"],
    especies: {
      perro: { dosisMin: 2, dosisMax: 4, unidad: "mg/kg", via: "VO", frecuencia: "cada 8-12 h", notas: "Uso con comprimidos de uso humano (fuera de ficha, no existe presentación CIMAVET para perros). Dolor neuropático/coadyuvante anticonvulsivante." },
      gato: { dosisMin: 5, dosisMax: 5, unidad: "mg/kg", via: "VO", frecuencia: "dosis única, aproximadamente 1,5 h antes del transporte o la visita veterinaria", notas: "Ansiedad/miedo agudos asociados a transporte o visitas veterinarias, dosis única (no crónica). Fuente: Summary of Product Characteristics, VMD (Reino Unido), VM 06043/5003 (Bonqat, Orion) — mismo registro nacional en España (CIMAVET, autorización no centralizada)." }
    }
  },
  {
    id: "mirtazapina",
    principioActivo: "Mirtazapina",
    nombresComerciales: ["Mirataz"],
    categoria: "Estimulante del apetito / antiemético",
    indicaciones: ["Inapetencia", "Anorexia", "Náuseas/vómitos"],
    especies: {
      gato: { dosisMin: 1.88, dosisMax: 1.88, unidad: "mg/kg", via: "VO", frecuencia: "cada 48-72 h, ciclos de hasta 3 semanas", notas: "Vía oral con comprimidos de uso humano (fuera de ficha): empezar con 1/8 de comprimido de 15 mg en gatos pequeños y 1/4 en grandes; también actúa como antiemético. Existe además presentación tópica veterinaria específica (Mirataz, pomada transdérmica): dosis fija de 2 mg/gato (0,1 g pomada = línea de 3,8 cm) aplicada en la cara interna del pabellón auricular una vez al día durante 14 días, alternando oreja cada día — dosis fija por gato, no por kg. Fuente forma tópica: Summary of Product Characteristics, VMD (Reino Unido), VM 50406/5055 — equivalente al registro CIMAVET EU/2/19/247 (Mirataz, Dechra)." }
    }
  },
  {
    id: "bromuro-potasio",
    principioActivo: "Bromuro de potasio",
    nombresComerciales: ["Formulación magistral", "Kbrovet"],
    categoria: "Anticonvulsivo",
    indicaciones: ["Epilepsia", "Convulsiones"],
    especies: {
      perro: { dosisMin: 20, dosisMax: 30, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h (mantenimiento; existen protocolos de dosis de carga distintos)", notas: "Margen terapéutico estrecho: monitorizar niveles séricos. Evitar en gatos (riesgo de enfermedad respiratoria)." }
      // No incluido en gato: alto riesgo de neumonitis/asma felino.
    }
  },
  {
    id: "metoclopramida",
    principioActivo: "Metoclopramida",
    nombresComerciales: ["Primperan (uso humano)", "Emeprid"],
    categoria: "Procinético/Antiemético",
    indicaciones: ["Vómito", "Náuseas", "Íleo/reflujo"],
    especies: {
      perro: { dosisMin: 0.2, dosisMax: 0.5, unidad: "mg/kg", via: "VO/SC/IM", frecuencia: "cada 8 h (o infusión continua)", notas: "Evitar en caso de obstrucción gastrointestinal." },
      gato:  { dosisMin: 0.2, dosisMax: 0.5, unidad: "mg/kg", via: "VO/SC/IM", frecuencia: "cada 8 h (o infusión continua)", notas: "Evitar en caso de obstrucción gastrointestinal." }
    }
  },
  {
    id: "famotidina",
    principioActivo: "Famotidina",
    nombresComerciales: ["Famotidina Normon (uso humano)"],
    categoria: "Antiulceroso (antagonista H2)",
    indicaciones: ["Úlcera gástrica", "Gastritis", "Reflujo"],
    especies: {
      perro: { dosisMin: 0.5, dosisMax: 1, unidad: "mg/kg", via: "VO/IV", frecuencia: "cada 12-24 h", notas: "" },
      gato:  { dosisMin: 0.5, dosisMax: 1, unidad: "mg/kg", via: "VO/IV", frecuencia: "cada 12-24 h", notas: "" }
    }
  },
  {
    id: "sucralfato",
    principioActivo: "Sucralfato",
    nombresComerciales: ["Urbal", "Sucralfato Normon (uso humano)"],
    categoria: "Protector de la mucosa gástrica",
    indicaciones: ["Úlcera gástrica", "Esofagitis"],
    especies: {
      perro: { dosisMin: 20, dosisMax: 40, unidad: "mg/kg", via: "VO", frecuencia: "cada 8 h, separado de otros fármacos orales al menos 2 h", notas: "Puede reducir la absorción de otros fármacos administrados a la vez." },
      gato:  { dosisMin: 20, dosisMax: 40, unidad: "mg/kg", via: "VO", frecuencia: "cada 8 h, separado de otros fármacos orales al menos 2 h", notas: "Puede reducir la absorción de otros fármacos administrados a la vez." }
    }
  },
  {
    id: "cisaprida",
    principioActivo: "Cisaprida",
    nombresComerciales: ["Formulación magistral (uso compasivo)"],
    categoria: "Procinético gastrointestinal",
    indicaciones: ["Estreñimiento/megacolon (gato)", "Hipomotilidad gastrointestinal"],
    especies: {
      perro: { dosisMin: 0.1, dosisMax: 0.5, unidad: "mg/kg", via: "VO", frecuencia: "cada 8-12 h", notas: "Retirado del mercado humano en muchos países; disponible por formulación magistral veterinaria." },
      gato:  { dosisMin: 0.1, dosisMax: 0.5, unidad: "mg/kg", via: "VO", frecuencia: "cada 8-12 h", notas: "Muy usado en megacolon felino. Disponible por formulación magistral veterinaria." }
    }
  },
  {
    id: "fenbendazol",
    principioActivo: "Fenbendazol",
    nombresComerciales: ["Panacur"],
    categoria: "Antiparasitario (bencimidazol)",
    indicaciones: ["Desparasitación interna", "Giardiasis"],
    especies: {
      perro: { dosisMin: 50, dosisMax: 50, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h durante 3 días (giardiasis: hasta 5 días)", notas: "" },
      gato:  { dosisMin: 50, dosisMax: 50, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h durante 3 días (giardiasis: hasta 5 días)", notas: "" }
    }
  },
  {
    id: "praziquantel",
    principioActivo: "Praziquantel",
    nombresComerciales: ["Droncit"],
    categoria: "Antiparasitario (cestocida)",
    indicaciones: ["Desparasitación interna (tenias)"],
    especies: {
      perro: { dosisMin: 5, dosisMax: 5, unidad: "mg/kg", via: "VO/SC", frecuencia: "dosis única", notas: "" },
      gato:  { dosisMin: 5, dosisMax: 5, unidad: "mg/kg", via: "VO/SC", frecuencia: "dosis única", notas: "" }
    }
  },
  {
    id: "milbemicina-oxima",
    principioActivo: "Milbemicina oxima",
    nombresComerciales: ["Interceptor"],
    categoria: "Antiparasitario (lactona macrocíclica)",
    indicaciones: ["Prevención de dirofilariosis", "Desparasitación interna"],
    especies: {
      perro: { dosisMin: 0.5, dosisMax: 1, unidad: "mg/kg", via: "VO", frecuencia: "mensual", notas: "Comprobar ausencia de microfilarias/dirofilariosis activa antes de iniciar prevención en zona endémica." },
      gato:  { dosisMin: 2, dosisMax: 2, unidad: "mg/kg", via: "VO", frecuencia: "mensual", notas: "Formulación felina con concentración distinta a la canina; no intercambiar presentaciones." }
    }
  },
  {
    id: "fenbendazol",
    principioActivo: "Fenbendazol",
    nombresComerciales: ["Panacur"],
    categoria: "Antiparasitario interno (bencimidazol)",
    indicaciones: ["Desparasitación interna", "Nematodos", "Cestodos", "Giardia"],
    especies: {
      perro: { dosisMin: 50, dosisMax: 50, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h durante 3 días (nematodos) o 5 días (cestodos/giardia)", notas: "Pautas alternativas de la ficha técnica: dosis única de 100 mg/kg, o 50 mg/kg/día x3 días, o 20 mg/kg/día x5 días (todas equivalentes en eficacia según indicación). Perras gestantes (crías libres de parásitos): 25 mg/kg/día desde el día 40 de gestación hasta 2 días posparto. Depositar los comprimidos en la base de la lengua. Fuente: ficha técnica CIMAVET (Panacur, nº registro 1085 ESP)." },
      gato:  { dosisMin: 50, dosisMax: 50, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h durante 3 días (nematodos) o 5 días (cestodos/giardia)", notas: "Pautas alternativas de la ficha técnica: dosis única de 100 mg/kg, o 50 mg/kg/día x3 días, o 20 mg/kg/día x5 días. Fuente: ficha técnica CIMAVET (Panacur, nº registro 1085 ESP)." }
    }
  },
  {
    id: "nitenpiram",
    principioActivo: "Nitenpiram",
    nombresComerciales: ["Capstar"],
    categoria: "Antiparasitario externo (neonicotinoide, acción rápida)",
    indicaciones: ["Pulgas"],
    especies: {
      perro: { dosisMin: 1, dosisMax: 1, unidad: "mg/kg", via: "VO", frecuencia: "según infestación, hasta 1 vez al día", notas: "Acción rápida (mata pulgas en horas) pero sin efecto residual; repetir diario o días alternos si la infestación es intensa, combinar con un antiparasitario de acción prolongada. No dar más de un comprimido al día. Comprimidos de 11,4 mg (gatos y perros pequeños, 1-11 kg) o 57 mg (perros grandes). Fuente: ficha técnica CIMAVET (Capstar, nº registro 1459/1460 ESP)." },
      gato:  { dosisMin: 1, dosisMax: 1, unidad: "mg/kg", via: "VO", frecuencia: "según infestación, hasta 1 vez al día", notas: "Acción rápida (mata pulgas en horas) pero sin efecto residual; repetir diario o días alternos si la infestación es intensa, combinar con un antiparasitario de acción prolongada. No dar más de un comprimido al día. Comprimido de 11,4 mg. Fuente: ficha técnica CIMAVET (Capstar, nº registro 1459 ESP)." }
    }
  },
  {
    id: "miltefosina",
    principioActivo: "Miltefosina",
    nombresComerciales: ["Milteforan"],
    categoria: "Antiparasitario (leishmanicida)",
    indicaciones: ["Leishmaniosis"],
    especies: {
      perro: { dosisMin: 2, dosisMax: 2, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h durante 28 días", notas: "1 ml de solución oral por cada 10 kg. Verter sobre parte del alimento. Cumplir los 28 días completos es crucial (el parásito se aloja también en tejidos profundos: médula ósea, ganglios, bazo, hígado). Fuente: ficha técnica CIMAVET (Milteforan, nº registro 4297 ESP)." }
    }
  },
  {
    id: "fipronil-permetrina",
    principioActivo: "Fipronilo + Permetrina",
    nombresComerciales: ["Effitix"],
    categoria: "Antiparasitario externo combinado (spot-on)",
    indicaciones: ["Pulgas", "Garrapatas"],
    especies: {
      perro: {
        tipoDosis: "banda",
        pesoMinimo: 1.5,
        via: "Tópica (spot-on)",
        frecuencia: "una vez al mes (actividad 4 semanas)",
        notas: "Dosis mínima 6,7 mg/kg fipronilo + 60 mg/kg permetrina. Útil en estrategias de tratamiento de dermatitis alérgica a la picadura de pulgas (DAPP) ya diagnosticada. No usar en gatos (permetrina). Dosis fija por tramo de peso según ficha técnica, no mg/kg lineal. Fuente: ficha técnica CIMAVET (Effitix, nº registro 3100 ESP).",
        bandas: [
          { pesoMin: 1.5, pesoMax: 4.0, mg: 26.8, ml: 1, descripcion: "1 pipeta de 26,8 mg fipronilo + 240 mg permetrina" },
          { pesoMin: 4.1, pesoMax: 10.0, mg: 67, ml: 1, descripcion: "1 pipeta de 67 mg fipronilo + 600 mg permetrina" },
          { pesoMin: 10.1, pesoMax: 20.0, mg: 134, ml: 1, descripcion: "1 pipeta de 134 mg fipronilo + 1200 mg permetrina" },
          { pesoMin: 20.1, pesoMax: 40.0, mg: 268, ml: 1, descripcion: "1 pipeta de 268 mg fipronilo + 2400 mg permetrina" },
          { pesoMin: 40.1, pesoMax: 60.0, mg: 402, ml: 1, descripcion: "1 pipeta de 402 mg fipronilo + 3600 mg permetrina" }
        ]
      }
    }
  },
  {
    id: "imidacloprid-permetrina",
    principioActivo: "Imidacloprid + Permetrina",
    nombresComerciales: ["Advantix", "Ataxxa"],
    categoria: "Antiparasitario externo combinado (spot-on)",
    indicaciones: ["Pulgas", "Garrapatas"],
    especies: {
      perro: {
        tipoDosis: "banda",
        pesoMinimo: 0,
        via: "Tópica (spot-on)",
        frecuencia: "una vez al mes",
        notas: "Dosis mínima 10 mg/kg imidacloprid + 50 mg/kg permetrina. Actividad persistente frente a garrapatas 3-4 semanas. No usar en gatos (permetrina). Dosis fija por tramo de peso según ficha técnica, no mg/kg lineal. Fuente: ficha técnica CIMAVET (Advantix, nº registro 61-68 CP).",
        bandas: [
          { pesoMin: 0, pesoMax: 4.0, mg: 40, ml: 0.4, descripcion: "1 pipeta de 40 mg imidacloprid + 200 mg permetrina (0,4 ml)" },
          { pesoMin: 4.1, pesoMax: 10.0, mg: 100, ml: 1.0, descripcion: "1 pipeta de 100 mg imidacloprid + 500 mg permetrina (1,0 ml)" },
          { pesoMin: 10.1, pesoMax: 25.0, mg: 250, ml: 2.5, descripcion: "1 pipeta de 250 mg imidacloprid + 1250 mg permetrina (2,5 ml)" },
          { pesoMin: 25.1, pesoMax: 40.0, mg: 400, ml: 4.0, descripcion: "1 pipeta de 400 mg imidacloprid + 2000 mg permetrina (4,0 ml)" },
          { pesoMin: 40.1, pesoMax: 60.0, mg: 600, ml: 6.0, descripcion: "1 pipeta de 600 mg imidacloprid + 3000 mg permetrina (6,0 ml)" }
        ]
      }
    }
  },
  {
    id: "deltametrina",
    principioActivo: "Deltametrina",
    nombresComerciales: ["Merlin"],
    categoria: "Antiparasitario externo (collar, piretroide)",
    indicaciones: ["Garrapatas", "Flebotomos (prevención de leishmaniosis)"],
    especies: {
      perro: { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "Tópica (collar)", frecuencia: "1 collar; control de garrapatas 6 meses, de flebotomos 5,5 meses", notas: "Dosis fija por collar (no por kg): 0,77 g para perros pequeños y medianos, 1,04 g para perros grandes. No usar en cachorros <7 semanas. Ajustar sin apretar (deben caber 2 dedos entre el collar y el cuello). Fuente: ficha técnica CIMAVET (Merlin, nº registro 3714/4025 ESP)." }
    }
  },
  {
    id: "dinotefuran-piriproxifeno-permetrina",
    principioActivo: "Dinotefuran + Piriproxifeno + Permetrina",
    nombresComerciales: ["Vectra 3D"],
    categoria: "Antiparasitario externo combinado (spot-on)",
    indicaciones: ["Pulgas", "Garrapatas", "Mosquitos/flebotomos (repelente)"],
    especies: {
      perro: {
        tipoDosis: "banda",
        pesoMinimo: 1.5,
        via: "Tópica (spot-on)",
        frecuencia: "una vez al mes (actividad 4 semanas)",
        notas: "Dosis mínima 6,4 mg/kg dinotefuran + 0,6 mg/kg piriproxifeno + 46,6 mg/kg permetrina (0,12 ml/kg). No usar en gatos (permetrina). Dosis fija por tramo de peso según ficha técnica, no mg/kg lineal. Fuente: Summary of Product Characteristics, VMD (Reino Unido) — equivalente al registro CIMAVET EU/2/13/156 (CIMAVET bloqueado por CAPTCHA al ser autorización centralizada UE).",
        bandas: [
          { pesoMin: 1.5, pesoMax: 4.0, mg: 44, ml: 0.8, descripcion: "1 pipeta amarilla (0,8 ml): 44 mg dinotefuran + 3,9 mg piriproxifeno + 317 mg permetrina" },
          { pesoMin: 4.1, pesoMax: 10.0, mg: 87, ml: 1.6, descripcion: "1 pipeta verde azulada (1,6 ml): 87 mg dinotefuran + 7,7 mg piriproxifeno + 635 mg permetrina" },
          { pesoMin: 10.1, pesoMax: 25.0, mg: 196, ml: 3.6, descripcion: "1 pipeta azul (3,6 ml): 196 mg dinotefuran + 17,4 mg piriproxifeno + 1429 mg permetrina" },
          { pesoMin: 25.1, pesoMax: 40.0, mg: 256, ml: 4.7, descripcion: "1 pipeta púrpura (4,7 ml): 256 mg dinotefuran + 22,7 mg piriproxifeno + 1865 mg permetrina" },
          { pesoMin: 40.1, pesoMax: 90.0, mg: 436, ml: 8.0, descripcion: "1 pipeta roja (8,0 ml): 436 mg dinotefuran + 38,7 mg piriproxifeno + 3175 mg permetrina" }
        ]
      }
    }
  },
  {
    id: "acido-fenoxi-metilpropionico",
    principioActivo: "Ácido 2-fenoxi-2-metilpropiónico",
    nombresComerciales: ["Liverfine"],
    categoria: "Hepatoprotector",
    indicaciones: ["Apoyo hepático"],
    especies: {
      perro: { dosisMin: 10, dosisMax: 10, unidad: "mg/kg", via: "IM profunda/IP/IV lenta", frecuencia: "cada 24 h, a criterio veterinario", notas: "Equivale a 1 ml/10 kg. No se conocen síntomas de sobredosis. Fuente: ficha técnica CIMAVET (Liverfine, nº registro 1918 ESP)." }
    }
  },
  {
    id: "hidrocortisona-aceponato-otica",
    principioActivo: "Hidrocortisona aceponato (ótica)",
    nombresComerciales: ["Cortotic"],
    categoria: "Corticoide tópico ótico (pulverización)",
    indicaciones: ["Otitis externa (componente inflamatorio)"],
    especies: {
      perro: { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "Ótica (pulverización)", frecuencia: "0,44 ml (2 pulsaciones) por oído, una vez al día durante 7 días (extensible a 14 si no hay curación completa)", notas: "Respuesta clínica máxima puede no verse hasta 28 días tras la primera aplicación. Limpiar y secar el conducto auditivo antes del primer tratamiento. Fuente: ficha técnica CIMAVET (Cortotic, nº registro 4137 ESP)." }
    }
  },
  {
    id: "hidrocortisona-aceponato-cutanea",
    principioActivo: "Hidrocortisona aceponato (cutánea)",
    nombresComerciales: ["Cortavance", "Aceponato de Hidrocortisona Ecuphar"],
    categoria: "Corticoide tópico (pulverización cutánea, leave-on)",
    indicaciones: ["Dermatitis atópica", "Dermatosis inflamatorias/pruriginosas"],
    especies: {
      perro: { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "Cutánea (pulverización, leave-on)", frecuencia: "1 vez al día", notas: "Dosis por superficie de piel afectada (no por kg): 1,52 mcg/cm²/día, lograble con 2 pulsaciones del pulverizador sobre un cuadrado de 10x10 cm, a ~10 cm de distancia. Dermatosis inflamatorias/pruriginosas: 7 días consecutivos. Dermatitis atópica: 14-28 días consecutivos, con control veterinario intermedio a los 14 días (vigilar supresión del eje hipotálamo-hipófiso-adrenal y atrofia cutánea, ambas pueden ser asintomáticas). Evitar pulverizar cerca de los ojos. Fuente: Summary of Product Characteristics, VMD (Reino Unido) — equivalente al registro CIMAVET EU/2/06/069 (Cortavance) y EU/2/18/230 (Aceponato de Hidrocortisona Ecuphar), ambos bloqueados por CAPTCHA al ser autorización centralizada UE." }
    }
  },
  {
    id: "fipronil-s-metopreno",
    principioActivo: "Fipronilo + S-metopreno",
    nombresComerciales: ["Dynacan"],
    categoria: "Antiparasitario externo combinado (spot-on)",
    indicaciones: ["Pulgas", "Garrapatas"],
    especies: {
      perro: { dosisMin: 6.7, dosisMax: 6.7, unidad: "mg/kg", via: "Tópica (spot-on)", frecuencia: "una vez al mes (intervalo mínimo 4 semanas)", notas: "Dosis mínima 6,7 mg/kg fipronilo + 6 mg/kg (S)-metopreno. Pipetas por tramo de peso: 2-10 kg → 0,67 ml; existen presentaciones equivalentes para 10-20 kg, 20-40 kg y >40 kg. Aplicación mensual recomendada en riesgo alto de reinfestación, alergia a picaduras de pulgas (DAPP) o si se requiere control de garrapatas. Fuente: ficha técnica CIMAVET (Dynacan, nº registro 3858-3861 ESP)." },
      gato:  { dosisMin: 5, dosisMax: 5, unidad: "mg/kg", via: "Tópica (spot-on)", frecuencia: "una vez al mes", notas: "Dosis mínima 5 mg/kg fipronilo + 6 mg/kg (S)-metopreno. Pipeta fija de 0,5 ml por gato, independientemente del peso. Fuente: ficha técnica CIMAVET (Dynacan 50 mg/60 mg, nº registro 3857 ESP)." }
    }
  },
  {
    id: "tigilanol-tiglato",
    principioActivo: "Tigilanol tiglato",
    nombresComerciales: ["Stelfonta"],
    categoria: "Antineoplásico (uso intratumoral)",
    indicaciones: ["Mastocitoma"],
    especies: {
      perro: { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "Intratumoral", frecuencia: "dosis única (puede repetirse una vez a las 4 semanas si es necesario)", notas: "Dosis basada en el VOLUMEN DEL TUMOR, no en el peso del paciente: 0,5 mg/cm³ (= 0,5 ml/cm³), calculando el volumen como largo x ancho x alto x 0,5. Dosis mínima 0,1 ml independientemente del volumen. Solo para mastocitomas cutáneos no resecables/recurrentes con volumen ≤8 cm³, no en mucosas ni submucosos. Inyección exclusivamente intratumoral, en abanico, evitando manipular el tumor. Fuente: Summary of Product Characteristics, VMD (Reino Unido) — equivalente al registro CIMAVET EU/2/19/248 (CIMAVET bloqueado por CAPTCHA al ser autorización centralizada UE)." }
    }
  },
  {
    id: "pimobendan-benazepril",
    principioActivo: "Pimobendán + Benazepril",
    nombresComerciales: ["Fortekor Plus"],
    categoria: "Cardiovascular combinado (inotrópico + IECA)",
    indicaciones: ["Insuficiencia cardíaca congestiva"],
    especies: {
      perro: { dosisMin: 0.25, dosisMax: 0.5, unidad: "mg/kg", via: "VO", frecuencia: "cada 12 h (dividido en 2 tomas diarias), ~1 h antes de la comida", notas: "Dosis expresada como pimobendán; el mismo comprimido aporta además 0,5-1 mg/kg/día de benazepril repartido en las 2 tomas. Producto de combinación fija: usar solo cuando el paciente requiere ambos principios activos simultáneamente. Comprimidos ranurados, partibles. Fuente: Summary of Product Characteristics, VMD (Reino Unido) — equivalente al registro CIMAVET EU/2/15/185 (CIMAVET bloqueado por CAPTCHA al ser autorización centralizada UE)." }
    }
  },
  {
    id: "moxidectina",
    principioActivo: "Moxidectina",
    nombresComerciales: ["Afilaria"],
    categoria: "Antiparasitario interno (lactona macrocíclica, liberación prolongada)",
    indicaciones: ["Prevención de dirofilariosis", "Nematodos"],
    especies: {
      perro: { dosisMin: 0.17, dosisMax: 0.17, unidad: "mg/kg", via: "SC", frecuencia: "dosis única (inyección de liberación prolongada)", notas: "Equivale a 0,05 ml/kg de suspensión reconstituida. Prevención de dirofilariosis (D. immitis, D. repens) y tratamiento de anquilostomas. En cachorros de 12 semanas a 9 meses, dosificar según el peso en el momento del tratamiento (no anticipar el peso futuro); puede requerir tratamiento adicional por el rápido crecimiento. Fuente: ficha técnica CIMAVET (Afilaria, nº registro 3807 ESP)." }
    }
  },
  {
    id: "oxitetraciclina",
    principioActivo: "Oxitetraciclina",
    nombresComerciales: ["Bimodula"],
    categoria: "Antibiótico (tetraciclina)",
    indicaciones: ["Infección bacteriana sensible"],
    especies: {
      perro: { dosisMin: 10, dosisMax: 10, unidad: "mg/kg", via: "SC/IM", frecuencia: "cada 24 h durante 3-5 días", notas: "Solo la pauta de dosificación de 24 h está recomendada en perros y gatos (la pauta de acción prolongada de 10-20 mg/kg no se recomienda en esta especie). Fuente: ficha técnica CIMAVET (Bimodula, nº registro 3908 ESP)." },
      gato:  { dosisMin: 10, dosisMax: 10, unidad: "mg/kg", via: "SC/IM", frecuencia: "cada 24 h durante 3-5 días", notas: "Solo la pauta de dosificación de 24 h está recomendada en perros y gatos (la pauta de acción prolongada de 10-20 mg/kg no se recomienda en esta especie). Fuente: ficha técnica CIMAVET (Bimodula, nº registro 3908 ESP)." }
    }
  },
  {
    id: "clindamicina-topica",
    principioActivo: "Clindamicina (tópica)",
    nombresComerciales: ["Clindacutin"],
    categoria: "Antibiótico tópico (lincosamida)",
    indicaciones: ["Heridas infectadas superficiales", "Pioderma interdigital"],
    especies: {
      perro: { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "Cutánea (pomada)", frecuencia: "3-4 veces al día", notas: "Capa fina cubriendo la lesión todo el día. Heridas infectadas superficiales: máximo 7 días. Pioderma interdigital superficial: máximo 14 días. Fuente: ficha técnica CIMAVET (Clindacutin, nº registro 4026 ESP)." }
    }
  },
  {
    id: "epsiprantel-pirantel",
    principioActivo: "Epsiprantel + Pirantel",
    nombresComerciales: ["Dosalid"],
    categoria: "Antiparasitario interno combinado (cestodos + nematodos)",
    indicaciones: ["Desparasitación interna", "Cestodos", "Nematodos"],
    especies: {
      perro: { dosisMin: 5.5, dosisMax: 5.5, unidad: "mg/kg", via: "VO", frecuencia: "dosis única", notas: "Dosis expresada como epsiprantel; el mismo comprimido aporta además 5,0 mg/kg de pirantel (embonato) — equivale a 1 comprimido por cada 18 kg. No requiere ayuno previo. Fuente: ficha técnica CIMAVET (Dosalid, nº registro 1818 ESP)." }
    }
  },
  {
    id: "menbutona",
    principioActivo: "Menbutona",
    nombresComerciales: ["Indigest"],
    categoria: "Colerético / estimulante digestivo",
    indicaciones: ["Trastornos digestivos", "Estimulación de la motilidad gastrointestinal"],
    especies: {
      perro: { dosisMin: 10, dosisMax: 10, unidad: "mg/kg", via: "IM profunda/IV lenta", frecuencia: "una vez al día, duración según respuesta clínica", notas: "Margen de seguridad desconocido: respetar rigurosamente la dosis (riesgo de bloqueo cardíaco en sobredosis; tratar con un cardiotónico si ocurre). No indicado en gatos según ficha técnica. Fuente: ficha técnica CIMAVET (Indigest, nº registro 1018 ESP)." }
    }
  },
  {
    id: "acido-fusidico-betametasona-gel",
    principioActivo: "Ácido fusídico + Betametasona (gel)",
    nombresComerciales: ["Isaderm"],
    categoria: "Antibiótico + corticoide tópico",
    indicaciones: ["Pioderma superficial", "Dermatitis"],
    especies: {
      perro: { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "Cutánea (gel)", frecuencia: "2 veces al día, mínimo 5 días, máximo 7 días", notas: "Cortar el pelo y limpiar la zona antes de aplicar; capa fina. Continuar 2 días tras la curación de las lesiones. Si no hay respuesta a los 3 días, reevaluar el diagnóstico. Fuente: ficha técnica CIMAVET (Isaderm, nº registro 1544 ESP)." }
    }
  },
  {
    id: "lidocaina-cloranfenicol-prednisolona",
    principioActivo: "Lidocaína + Cloranfenicol + Prednisolona (oftálmica)",
    nombresComerciales: ["Oftalmovet"],
    categoria: "Anestésico + antibiótico + corticoide oftálmico",
    indicaciones: ["Conjuntivitis", "Inflamación ocular"],
    especies: {
      perro: { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "Oftálmica (colirio)", frecuencia: "2-3 gotas cada 6-12 h", notas: "Prolongar 24-48 h tras la remisión completa de los síntomas. Si no hay mejoría clara a los 2-3 días, reconsiderar diagnóstico y tratamiento. Fuente: ficha técnica CIMAVET (Oftalmovet, nº registro 4246 ESP)." },
      gato:  { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "Oftálmica (colirio)", frecuencia: "2-3 gotas cada 6-12 h", notas: "Prolongar 24-48 h tras la remisión completa de los síntomas. Si no hay mejoría clara a los 2-3 días, reconsiderar diagnóstico y tratamiento. Fuente: ficha técnica CIMAVET (Oftalmovet, nº registro 4246 ESP)." }
    }
  },
  {
    id: "procaina",
    principioActivo: "Procaína",
    nombresComerciales: ["Procamidor"],
    categoria: "Anestésico local",
    indicaciones: ["Anestesia local por infiltración", "Anestesia de conducción"],
    especies: {
      perro: { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "SC/perineural/epidural", frecuencia: "dosis única según técnica", notas: "Anestesia por infiltración: 1-5 ml (20-100 mg de hidrocloruro de procaína) según tamaño de la zona a tratar, no estrictamente por kg. Fuente: ficha técnica CIMAVET (Procamidor 20 mg/ml, nº registro 2921 ESP)." },
      gato:  { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "SC/perineural/epidural", frecuencia: "dosis única según técnica", notas: "Anestesia por infiltración: 1-5 ml (20-100 mg de hidrocloruro de procaína) según tamaño de la zona a tratar, no estrictamente por kg. Fuente: ficha técnica CIMAVET (Procamidor 20 mg/ml, nº registro 2921 ESP)." }
    }
  },
  {
    id: "lotilaner-milbemicina",
    principioActivo: "Lotilaner + Milbemicina oxima",
    nombresComerciales: ["Credelio Plus"],
    categoria: "Antiparasitario externo e interno combinado (comprimido masticable)",
    indicaciones: ["Pulgas", "Garrapatas", "Prevención de dirofilariosis", "Nematodos"],
    especies: {
      perro: { dosisMin: 20, dosisMax: 41, unidad: "mg/kg", via: "VO", frecuencia: "una vez al mes", notas: "Dosis expresada como lotilaner; el mismo comprimido aporta además 0,75-1,53 mg/kg de milbemicina oxima, según tabla de peso de la ficha técnica (5 concentraciones distintas). Prevención de dirofilariosis y angiostrongilosis, nematodos gastrointestinales, pulgas y garrapatas. Fuente: Summary of Product Characteristics, VMD (Reino Unido) — equivalente al registro CIMAVET EU/2/21/271 (CIMAVET bloqueado por CAPTCHA al ser autorización centralizada UE)." }
    }
  },
  {
    id: "esafoxolaner-eprinomectina-praziquantel",
    principioActivo: "Esafoxolaner + Eprinomectina + Praziquantel",
    nombresComerciales: ["Nexgard Combo"],
    categoria: "Antiparasitario externo e interno combinado (spot-on)",
    indicaciones: ["Pulgas", "Garrapatas", "Sarna notoédrica", "Otodectes", "Nematodos", "Cestodos", "Prevención de dirofilariosis"],
    especies: {
      gato: {
        tipoDosis: "banda",
        pesoMinimo: 0.8,
        via: "Tópica (spot-on)",
        frecuencia: "una vez al mes",
        notas: "Dosis mínima 1,44 mg/kg esafoxolaner + 0,48 mg/kg eprinomectina + 10 mg/kg praziquantel. Cubre echinococcosis (zoonosis de declaración obligatoria: seguir pautas específicas de tratamiento). Dosis fija por tramo de peso según ficha técnica, no mg/kg lineal. Fuente: Summary of Product Characteristics, VMD (Reino Unido) — equivalente al registro CIMAVET EU/2/20/267 (CIMAVET bloqueado por CAPTCHA al ser autorización centralizada UE).",
        bandas: [
          { pesoMin: 0.8, pesoMax: 2.5, mg: 3.6, ml: 0.3, descripcion: "1 pipeta (0,3 ml): 3,6 mg esafoxolaner + 1,2 mg eprinomectina + 24,9 mg praziquantel" },
          { pesoMin: 2.6, pesoMax: 7.5, mg: 10.8, ml: 0.9, descripcion: "1 pipeta (0,9 ml): 10,8 mg esafoxolaner + 3,6 mg eprinomectina + 74,7 mg praziquantel" }
        ]
      }
    }
  },
  {
    id: "afoxolaner-milbemicina",
    principioActivo: "Afoxolaner + Milbemicina oxima",
    nombresComerciales: ["Nexgard Spectra"],
    categoria: "Antiparasitario externo e interno combinado (comprimido masticable)",
    indicaciones: ["Pulgas", "Garrapatas", "Prevención de dirofilariosis", "Nematodos"],
    especies: {
      perro: { dosisMin: 2.5, dosisMax: 6.94, unidad: "mg/kg", via: "VO", frecuencia: "una vez al mes", notas: "Dosis expresada como afoxolaner; el mismo comprimido aporta además 0,5-1,39 mg/kg de milbemicina oxima, según tabla de peso de la ficha técnica. Prevención de dirofilariosis y angiostrongilosis, nematodos gastrointestinales, pulgas y garrapatas. Fuente: Summary of Product Characteristics, VMD (Reino Unido) — equivalente al registro CIMAVET EU/2/14/177 (CIMAVET bloqueado por CAPTCHA al ser autorización centralizada UE)." }
    }
  },
  {
    id: "sarolaner-moxidectina-pirantel",
    principioActivo: "Sarolaner + Moxidectina + Pirantel",
    nombresComerciales: ["Simparica Trio"],
    categoria: "Antiparasitario externo e interno combinado (comprimido masticable)",
    indicaciones: ["Pulgas", "Garrapatas", "Prevención de dirofilariosis", "Nematodos"],
    especies: {
      perro: { dosisMin: 1.2, dosisMax: 2.4, unidad: "mg/kg", via: "VO", frecuencia: "una vez al mes", notas: "Dosis expresada como sarolaner; el mismo comprimido aporta además 0,024-0,048 mg/kg de moxidectina y 5-10 mg/kg de pirantel (pamoato), según tabla de peso de la ficha técnica (comprimidos de 6 concentraciones distintas). Prevención de dirofilariosis, tratamiento de ascáridos y anquilostomas, pulgas y garrapatas. Fuente: Summary of Product Characteristics, VMD (Reino Unido) — equivalente al registro CIMAVET EU/2/19/243 (CIMAVET bloqueado por CAPTCHA al ser autorización centralizada UE)." }
    }
  },
  {
    id: "dinotefuran-piriproxifeno",
    principioActivo: "Dinotefuran + Piriproxifeno",
    nombresComerciales: ["Vectra Felis"],
    categoria: "Antiparasitario externo combinado (spot-on)",
    indicaciones: ["Pulgas"],
    especies: {
      gato: { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "Tópica (spot-on)", frecuencia: "una vez al mes", notas: "Dosis fija por gato (no por kg): 1 pipeta de 423 mg dinotefuran + 42,3 mg piriproxifeno, válida para gatos de 0,6 a 10 kg (a mayor peso, menor mg/kg efectivo). No usar en gatitos <7 semanas o <0,6 kg. Fuente: Summary of Product Characteristics, VMD (Reino Unido) — equivalente al registro CIMAVET EU/2/14/165 (CIMAVET bloqueado por CAPTCHA al ser autorización centralizada UE)." }
    }
  },
  {
    id: "imidacloprid-flumetrina",
    principioActivo: "Imidacloprid + Flumetrina",
    nombresComerciales: ["Seresto"],
    categoria: "Antiparasitario externo (collar)",
    indicaciones: ["Pulgas", "Garrapatas"],
    especies: {
      perro: { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "Tópica (collar)", frecuencia: "1 collar, protección 7-8 meses", notas: "Dosis fija por tramo de peso (no por kg): ≤8 kg → collar de 1,25 g + 0,56 g; >8 kg → collar de 4,50 g + 2,03 g. Ajustar sin apretar (dejar espacio de 2 dedos entre el collar y el cuello); retirar al finalizar el periodo de protección. Fuente: ficha técnica CIMAVET (Seresto, nº registro 56/57/60 IP)." },
      gato:  { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "Tópica (collar)", frecuencia: "1 collar, protección 8 meses", notas: "Dosis fija por collar (no por kg): collar único de 38 cm (1,25 g + 0,56 g) independientemente del peso. Llevar de forma continua los 8 meses; comprobar el ajuste periódicamente, especialmente en gatitos en crecimiento. Fuente: ficha técnica CIMAVET (Seresto, nº registro 2348 ESP)." }
    }
  },
  {
    id: "permetrina-collar",
    principioActivo: "Permetrina (collar)",
    nombresComerciales: ["Taberdog"],
    categoria: "Antiparasitario externo (collar, piretroide)",
    indicaciones: ["Pulgas", "Garrapatas"],
    especies: {
      perro: { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "Tópica (collar)", frecuencia: "1 collar por animal, dura 4 meses", notas: "Dosis fija por collar (no por kg), en tallas medianos/grandes. No usar en gatos (permetrina). Ajustar sin apretar (deben caber 2 dedos entre el collar y el cuello). Fuente: ficha técnica CIMAVET (Taberdog Collar Permetrina, nº registro 4294/4295 ESP)." }
    }
  },
  {
    id: "butafosfan-cianocobalamina",
    principioActivo: "Butafosfán + Cianocobalamina",
    nombresComerciales: ["Catosal"],
    categoria: "Suplemento (fósforo orgánico + vitamina B12)",
    indicaciones: ["Hipofosfatemia", "Deficiencia de vitamina B12", "Tratamiento de apoyo/reconstituyente"],
    especies: {
      perro: { dosisMin: 10, dosisMax: 15, unidad: "mg/kg", via: "IV/IM/SC", frecuencia: "repetir según necesidad", notas: "Dosis expresada como butafosfán (0,1-0,15 ml/kg de este preparado); aporta además 0,005-0,0075 mg/kg de cianocobalamina (vitamina B12). Calentar a temperatura corporal antes de administrar. Precaución en insuficiencia renal crónica (valorar riesgo-beneficio). Fuente: ficha técnica CIMAVET (Catosal, nº registro 3893 ESP)." }
    }
  },
  {
    id: "cianocobalamina",
    // OJO: principioActivo debe quedarse en el nombre químico limpio, sin paréntesis — se usa
    // tal cual para buscar en CIMAVET/CIMA (ver principioActivoCorto), y un paréntesis como
    // "(vitamina B12)" en la propia cadena de búsqueda hace que ambas búsquedas no encuentren
    // nada (confirmado en vivo). El sinónimo "Vitamina B12" se añade en nombresComerciales para
    // que siga siendo buscable por ese nombre habitual.
    principioActivo: "Cianocobalamina",
    nombresComerciales: ["Optovite B12 (uso humano)", "Vitamina B12"],
    categoria: "Vitamina (cobalamina/B12)",
    indicaciones: ["Hipocobalaminemia", "Enfermedad gastrointestinal crónica (EII, SIBO, insuficiencia pancreática exocrina)", "Enteropatía con pérdida de proteínas"],
    especies: {
      perro: { dosisMin: 50, dosisMax: 50, unidad: "mcg/kg", via: "SC", frecuencia: "1 vez/semana durante 6 semanas, luego 1 dosis al mes; reevaluar cobalamina sérica antes del 2º mes", notas: "Si la cobalamina sigue baja tras la reevaluación, mantenimiento crónico cada 3 semanas. Alternativa por vía oral (sin riesgo de sobredosificación, útil para mantenimiento en casa): 50 µg/kg VO cada 24 h, hasta 300 µg totales en perros grandes. No se encuentra como tal en CIMAVET; Optovite B12 es un preparado de uso humano registrado en CIMA (no en CIMAVET)." },
      gato: { dosisMin: null, dosisMax: null, unidad: "mcg", via: "SC", frecuencia: "cada 7 días × 6 semanas → cada 14 días × 6 semanas → mensual hasta resolver la causa", notas: "Dosis FIJA por animal en hipocobalaminemia confirmada, no por kg: 250 µg/gato SC. Alternativa por vía oral: 50 µg/kg VO cada 24 h. No se encuentra como tal en CIMAVET; Optovite B12 es un preparado de uso humano registrado en CIMA (no en CIMAVET)." }
    }
  },
  {
    id: "hidrocortisona-miconazol-gentamicina",
    principioActivo: "Hidrocortisona + Miconazol + Gentamicina",
    nombresComerciales: ["Easotic"],
    categoria: "Corticoide + antifúngico + antibiótico ótico",
    indicaciones: ["Otitis externa"],
    especies: {
      perro: { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "Ótica", frecuencia: "1 ml (1 dosis) por oído afectado, una vez al día durante 5 días", notas: "Agitar bien antes de usar; limpiar el envase multidosis pulsando la bomba antes de la primera administración. Fuente: Summary of Product Characteristics, VMD (Reino Unido) — equivalente al registro CIMAVET EU/2/08/085 (CIMAVET bloqueado por CAPTCHA al ser autorización centralizada UE)." }
    }
  },
  {
    id: "gentamicina-posaconazol-mometasona",
    principioActivo: "Gentamicina + Posaconazol + Mometasona",
    nombresComerciales: ["Mometamax"],
    categoria: "Antibiótico + antifúngico + corticoide ótico (dosis única)",
    indicaciones: ["Otitis externa"],
    especies: {
      perro: { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "Ótica", frecuencia: "dosis única de 0,8 ml por oído infectado", notas: "Tratamiento único (no repetir); la respuesta clínica máxima puede no verse hasta 28-42 días después. Limpiar y secar el conducto auditivo antes de aplicar. Administrar solo por veterinario o personal entrenado bajo supervisión veterinaria. Fuente: Summary of Product Characteristics, VMD (Reino Unido) — equivalente al registro CIMAVET EU/2/22/289 (CIMAVET bloqueado por CAPTCHA al ser autorización centralizada UE)." }
    }
  },
  {
    id: "florfenicol-terbinafina-mometasona",
    principioActivo: "Florfenicol + Terbinafina + Mometasona",
    nombresComerciales: ["Neptra"],
    categoria: "Antibiótico + antifúngico + corticoide ótico (dosis única)",
    indicaciones: ["Otitis externa"],
    especies: {
      perro: { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "Ótica", frecuencia: "dosis única de 1 ml por oído infectado", notas: "Tratamiento único; la respuesta clínica máxima puede no verse hasta 28 días después. Agitar bien 5 segundos antes de usar. Limpiar y secar el conducto auditivo antes de aplicar. Fuente: Summary of Product Characteristics, VMD (Reino Unido) — equivalente al registro CIMAVET EU/2/19/246 (CIMAVET bloqueado por CAPTCHA al ser autorización centralizada UE)." }
    }
  },
  {
    id: "terbinafina-florfenicol-betametasona",
    principioActivo: "Terbinafina + Florfenicol + Betametasona",
    nombresComerciales: ["Osurnia"],
    categoria: "Antifúngico + antibiótico + corticoide ótico (gel)",
    indicaciones: ["Otitis externa"],
    especies: {
      perro: { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "Ótica (gel)", frecuencia: "1 tubo por oído infectado; repetir a los 7 días (2 dosis en total)", notas: "Respuesta clínica máxima puede no verse hasta 21 días después de la 2ª dosis. Fuente: Summary of Product Characteristics, VMD (Reino Unido) — equivalente al registro CIMAVET EU/2/14/170 (CIMAVET bloqueado por CAPTCHA al ser autorización centralizada UE)." }
    }
  },
  {
    id: "orbifloxacino-mometasona-posaconazol",
    principioActivo: "Orbifloxacino + Mometasona + Posaconazol",
    nombresComerciales: ["Posatex"],
    categoria: "Antibiótico + corticoide + antifúngico ótico",
    indicaciones: ["Otitis externa"],
    especies: {
      perro: { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "Ótica", frecuencia: "según peso, una vez al día durante 7 días", notas: "Gotas por tramo de peso: <2 kg → 2 gotas; 2-15 kg → 4 gotas; ≥15 kg → 8 gotas, una vez al día x7 días. Limpiar y secar el conducto auditivo y recortar el exceso de pelo antes de aplicar; agitar bien antes de usar. Fuente: Summary of Product Characteristics, VMD (Reino Unido) — equivalente al registro CIMAVET EU/2/08/081 (CIMAVET bloqueado por CAPTCHA al ser autorización centralizada UE)." }
    }
  },
  {
    id: "marbofloxacino-ketoconazol-prednisolona",
    principioActivo: "Marbofloxacino + Ketoconazol + Prednisolona",
    nombresComerciales: ["Triderm"],
    categoria: "Antibiótico + antifúngico + corticoide tópico (pulverización cutánea)",
    indicaciones: ["Piodermia", "Dermatitis"],
    especies: {
      perro: { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "Cutánea (pulverización)", frecuencia: "2 activaciones del atomizador, 2 veces al día, durante 7-14 días", notas: "Dosis por superficie de piel afectada (no por kg): 2 activaciones (~0,2 ml) cubren un cuadrado de 5x5 cm (pulverizando a ~10 cm) o 10x10 cm (a ~30 cm). Retirar pelo y suciedad antes de aplicar. Fuente: ficha técnica CIMAVET (Triderm, nº registro 3774 ESP)." }
    }
  },
  {
    id: "neomicina-polimixina-oftalmica",
    principioActivo: "Neomicina + Polimixina B (oftálmica)",
    nombresComerciales: ["Duomyxin"],
    categoria: "Antibiótico oftálmico (colirio)",
    indicaciones: ["Conjuntivitis", "Infección ocular bacteriana"],
    especies: {
      perro: { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "Oftálmica (colirio)", frecuencia: "2 gotas, 3-4 veces al día, durante 8-10 días", notas: "Tratar ambos ojos si es necesario, con la misma pauta. Fuente: ficha técnica CIMAVET (Duomyxin, nº registro 4148 ESP)." },
      gato:  { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "Oftálmica (colirio)", frecuencia: "2 gotas, 3-4 veces al día, durante 8-10 días", notas: "Tratar ambos ojos si es necesario, con la misma pauta. Fuente: ficha técnica CIMAVET (Duomyxin, nº registro 4148 ESP)." }
    }
  },
  {
    id: "miconazol-prednisolona-polimixina",
    principioActivo: "Miconazol + Prednisolona + Polimixina B",
    nombresComerciales: ["Conofite"],
    categoria: "Antifúngico + corticoide + antibiótico ótico/cutáneo",
    indicaciones: ["Otitis externa", "Dermatitis"],
    especies: {
      perro: { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "Ótica / cutánea", frecuencia: "3-5 gotas por oído, 2 veces al día, durante 7-14 días", notas: "Limpiar y secar el conducto auditivo antes de aplicar; masajear la base de la oreja tras instilar. Calentar el frasco a temperatura corporal antes de usar. Cortar el exceso de pelo en la zona. Fuente: ficha técnica CIMAVET (Conofite, nº registro 2347 ESP)." },
      gato:  { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "Ótica / cutánea", frecuencia: "3-5 gotas por oído, 2 veces al día, durante 7-14 días", notas: "Limpiar y secar el conducto auditivo antes de aplicar; masajear la base de la oreja tras instilar. Calentar el frasco a temperatura corporal antes de usar. Fuente: ficha técnica CIMAVET (Conofite, nº registro 2347 ESP)." }
    }
  },
  {
    id: "triamcinolona-acido-salicilico",
    principioActivo: "Triamcinolona + Ácido salicílico",
    nombresComerciales: ["Recicort", "Dermanolon"],
    categoria: "Corticoide + queratolítico tópico",
    indicaciones: ["Otitis externa", "Dermatitis"],
    especies: {
      perro: { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "Ótica (Recicort) / cutánea en pulverización (Dermanolon)", frecuencia: "ótica: 8-10 gotas/oído 1-2 veces/día; cutánea: 1 pulsación/1,75 kg 2 veces/día", notas: "Vía ótica (Recicort): 8-10 gotas por oído 1-2 veces/día, sin superar 7 gotas/kg/día (cuidado en animales pequeños o si se tratan ambos oídos). Vía cutánea (Dermanolon): 1 pulsación del pulverizador por cada 1,75 kg de peso, 2 veces al día (mínimo 3,5 kg para poder dar 2 pulsaciones/día). Fuente: fichas técnicas CIMAVET (Recicort nº 3521 ESP; Dermanolon nº 3523 ESP)." },
      gato:  { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "Ótica (Recicort) / cutánea en pulverización (Dermanolon)", frecuencia: "ótica: 8-10 gotas/oído 1-2 veces/día; cutánea: 1 pulsación/1,75 kg 2 veces/día", notas: "Vía ótica (Recicort): 8-10 gotas por oído 1-2 veces/día, sin superar 7 gotas/kg/día. Vía cutánea (Dermanolon): 1 pulsación del pulverizador por cada 1,75 kg de peso, 2 veces al día (mínimo 3,5 kg para poder dar 2 pulsaciones/día). Fuente: fichas técnicas CIMAVET (Recicort nº 3521 ESP; Dermanolon nº 3523 ESP)." }
    }
  },
  {
    id: "emodepsida-praziquantel",
    principioActivo: "Emodepsida + Praziquantel",
    nombresComerciales: ["Profender"],
    categoria: "Antiparasitario interno combinado (nematodos + cestodos)",
    indicaciones: ["Desparasitación interna", "Nematodos", "Cestodos"],
    especies: {
      perro: { dosisMin: 1, dosisMax: 1, unidad: "mg/kg", via: "VO", frecuencia: "dosis única", notas: "Dosis expresada como emodepsida; el mismo comprimido aporta además 5 mg/kg de prazicuantel (comprimidos de liberación modificada). Fuente: Summary of Product Characteristics, VMD (Reino Unido) — equivalente al registro CIMAVET EU/2/05/054 (CIMAVET bloqueado por CAPTCHA al ser autorización centralizada UE)." },
      gato:  { dosisMin: 3, dosisMax: 3, unidad: "mg/kg", via: "Tópica (spot-on)", frecuencia: "dosis única", notas: "Dosis expresada como emodepsida; el mismo volumen aporta además 12 mg/kg de prazicuantel. Pipetas por tramo de peso: 0,5-2,5 kg → 0,35 ml; >2,5-5 kg → 0,70 ml; >5-8 kg → 1,12 ml; >8 kg → combinación de pipetas. Fuente: Summary of Product Characteristics, VMD (Reino Unido) — equivalente al registro CIMAVET EU/2/05/054 (CIMAVET bloqueado por CAPTCHA al ser autorización centralizada UE)." }
    }
  },
  {
    id: "tigolaner-emodepsida-praziquantel",
    principioActivo: "Tigolaner + Emodepsida + Praziquantel",
    nombresComerciales: ["Felpreva"],
    categoria: "Antiparasitario externo e interno combinado (spot-on, acción trimestral)",
    indicaciones: ["Pulgas", "Garrapatas", "Nematodos", "Cestodos", "Lombriz pulmonar"],
    especies: {
      gato: { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "Tópica (spot-on)", frecuencia: "cada 3 meses (no indicado a intervalos menores)", notas: "Dosis mínima: 14,4 mg/kg tigolaner + 3 mg/kg emodepsida + 12 mg/kg praziquantel (0,148 ml/kg). Pipetas por tramo de peso: 1,0-2,5 kg → 0,37 ml; 2,6-5,0 kg → 0,74 ml; 5,1-8,0 kg → 1,18 ml; >8 kg → combinación de pipetas. Actividad frente a pulgas/garrapatas de 3 meses; no repetir antes de ese plazo. Datos de seguridad limitados más allá de 4 tratamientos consecutivos (posible acumulación de tigolaner). Lombriz pulmonar (Aelurostrongylus, Troglostrongylus): repetir a las 2 semanas con un spot-on que contenga solo emodepsida+praziquantel. Solo indicado cuando coinciden ectoparásitos, cestodos y nematodos a la vez. Fuente: Summary of Product Characteristics, VMD (Reino Unido) — equivalente al registro CIMAVET EU/2/21/277 (CIMAVET bloqueado por CAPTCHA al ser autorización centralizada UE)." }
    }
  },
  {
    id: "emodepsida-toltrazurilo",
    principioActivo: "Emodepsida + Toltrazurilo",
    nombresComerciales: ["Procox"],
    categoria: "Antiparasitario interno combinado (nematodos + coccidios)",
    indicaciones: ["Desparasitación interna", "Nematodos", "Coccidiosis"],
    especies: {
      perro: { dosisMin: 0.45, dosisMax: 0.45, unidad: "mg/kg", via: "VO", frecuencia: "dosis única", notas: "Dosis expresada como emodepsida; el mismo volumen (0,5 ml/kg) aporta además 9 mg/kg de toltrazurilo. Cachorros desde 2 semanas de edad y ≥0,4 kg de peso. Fuente: Summary of Product Characteristics, VMD (Reino Unido) — equivalente al registro CIMAVET EU/2/11/123 (CIMAVET bloqueado por CAPTCHA al ser autorización centralizada UE)." }
    }
  },
  {
    id: "medetomidina-vatinoxan",
    principioActivo: "Medetomidina + Vatinoxan",
    nombresComerciales: ["Zenalpha"],
    categoria: "Sedante alfa-2 agonista + antagonista periférico (menor efecto cardiovascular)",
    indicaciones: ["Sedación", "Premedicación"],
    especies: {
      perro: { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "IM", frecuencia: "dosis única, procedimientos ≤30 min", notas: "Dosis basada en superficie corporal (1 mg/m² de medetomidina + 20 mg/m² de vatinoxan), no en mg/kg lineal — el mg/kg real baja al aumentar el peso. Vatinoxan es un antagonista periférico de receptores alfa-2 que reduce los efectos cardiovasculares (bradicardia, vasoconstricción) de la medetomidina sin revertir la sedación. Volumen orientativo según ficha técnica: 3,5-4 kg → 0,4 ml; 7,1-10 kg → 0,8 ml; 15,1-20 kg → 1,4 ml; 25,1-30 kg → 1,8 ml; 45,1-50 kg → 2,6 ml; >80 kg → 3,8 ml (tabla completa en ficha técnica). Reversible con atipamezol (vigilar taquicardia tras revertir). Fuente: Summary of Product Characteristics, VMD (Reino Unido), VM 42810/5000 — equivalente al registro CIMAVET EU/2/21/279 (CIMAVET bloqueado por CAPTCHA al ser autorización centralizada UE)." }
    }
  },
  {
    id: "tasipimidina",
    principioActivo: "Tasipimidina",
    nombresComerciales: ["Tessie"],
    categoria: "Agonista alfa-2 adrenérgico (ansiolítico)",
    indicaciones: ["Ansiedad situacional", "Miedo a ruidos", "Ansiedad por separación"],
    especies: {
      perro: { dosisMin: 0.03, dosisMax: 0.03, unidad: "mg/kg", via: "VO", frecuencia: "según necesidad, hasta 9 días consecutivos", notas: "Alivio a corto plazo de ansiedad/miedo situacional (ruidos, ausencia del propietario). No dar de comer 1 h antes ni 1 h después (retrasa la absorción). Si se combina con fluoxetina o clomipramina, reducir a 0,02 mg/kg (dar antes una dosis de prueba y observar 2 h). Si el perro va a quedarse solo, dar antes una dosis de prueba y observar 2 h para confirmar tolerancia. Fuente: Summary of Product Characteristics, VMD (Reino Unido), VM 06043/5004 — equivalente al registro CIMAVET EU/2/21/276 (CIMAVET bloqueado por CAPTCHA al ser autorización centralizada UE)." }
    }
  },
  {
    id: "velagliflozina",
    principioActivo: "Velagliflozina",
    nombresComerciales: ["Senvelgo"],
    categoria: "Antidiabético (inhibidor de SGLT2)",
    indicaciones: ["Diabetes mellitus no insulinodependiente (gato)"],
    especies: {
      gato: { dosisMin: 1, dosisMax: 1, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h", notas: "Misma pauta independientemente de tratamiento previo con insulina u otro antidiabético. Al cambiar desde insulina, omitir la dosis de insulina de la noche anterior al inicio de velagliflozina. No usar en gatos con cetoacidosis diabética, cetonuria o deshidratación grave. Jeringa dosificadora incluida con escala en kg (incrementos de 0,5 kg). Fuente: Summary of Product Characteristics, VMD (Reino Unido), VM 08327/5004 — equivalente al registro CIMAVET EU/2/23/305 (CIMAVET bloqueado por CAPTCHA al ser autorización centralizada UE)." }
    }
  },
  {
    id: "benazepril-espironolactona",
    principioActivo: "Benazepril + Espironolactona",
    nombresComerciales: ["Cardalis"],
    categoria: "Cardiovascular combinado (IECA + diurético ahorrador de potasio)",
    indicaciones: ["Insuficiencia cardíaca congestiva"],
    especies: {
      perro: { dosisMin: 0.25, dosisMax: 0.25, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h, con la comida", notas: "Dosis expresada como benazepril; el comprimido asocia además 2 mg/kg de espironolactona (proporción fija según tramo de peso de la ficha técnica). Insuficiencia cardíaca congestiva por enfermedad valvular degenerativa crónica, con apoyo diurético si procede. No usar en gestación/lactación ni en reproductores. Fuente: Summary of Product Characteristics, VMD (Reino Unido) — equivalente al registro CIMAVET EU/2/12/142 (CIMAVET bloqueado por CAPTCHA al ser autorización centralizada UE)." }
    }
  },
  {
    id: "desoxicortona",
    principioActivo: "Desoxicortona",
    nombresComerciales: ["Zycortal"],
    categoria: "Mineralocorticoide (terapia sustitutiva)",
    indicaciones: ["Hipoadrenocorticismo primario (Addison)"],
    especies: {
      perro: { dosisMin: 2.2, dosisMax: 2.2, unidad: "mg/kg", via: "SC", frecuencia: "dosis inicial; reevaluar Na⁺/K⁺ a los 10 días y ajustar dosis/intervalo según respuesta (intervalo típico final 20-46 días)", notas: "Dosis inicial 2,2 mg/kg SC. Reevaluar a los 10 días (Tmax): Na/K ≥34 → bajar a 2,0 mg/kg; 32-34 → bajar a 2,1 mg/kg; 27-32 → mantener 2,2 mg/kg; 24-27 → subir a 2,3 mg/kg; <24 → subir a 2,4 mg/kg. Una vez optimizado el intervalo (puede alargarse si Na/K >32) y la dosis, mantener el mismo régimen a largo plazo, siempre en combinación con un glucocorticoide (ej. prednisolona). Dosis final media en ensayo clínico 1,9 mg/kg (rango 1,2-2,5 mg/kg). Fuente: Summary of Product Characteristics, VMD (Reino Unido), VM 50406/5053 — equivalente al registro CIMAVET EU/2/15/189 (CIMAVET bloqueado por CAPTCHA al ser autorización centralizada UE)." }
    }
  },
  {
    id: "antimoniato-meglumina",
    principioActivo: "Antimoniato de meglumina",
    nombresComerciales: ["Antishmania"],
    categoria: "Antiparasitario (leishmanicida)",
    indicaciones: ["Leishmaniosis"],
    especies: {
      perro: { dosisMin: 100, dosisMax: 100, unidad: "mg/kg", via: "SC", frecuencia: "cada 24 h (o dividido en 2 inyecciones de 50 mg/kg cada 12 h), durante 3 semanas (prolongable 1 semana más si respuesta insuficiente)", notas: "Volúmenes >10 ml deben dividirse en 2 puntos de inyección distintos. Pueden ser necesarios tratamientos repetidos; frecuente asociar con alopurinol. Fuente: ficha técnica CIMAVET (Antishmania, nº registro 3368 ESP)." }
    }
  },
  {
    id: "gluconato-calcico",
    principioActivo: "Gluconato cálcico",
    nombresComerciales: ["Calciovet"],
    categoria: "Suplemento mineral (calcio IV)",
    indicaciones: ["Hipocalcemia", "Eclampsia/tetania puerperal"],
    especies: {
      perro: { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "IV (lenta)", frecuencia: "dosis única, infusión lenta con monitorización cardiaca", notas: "9-15 mg de Ca/kg/hora, equivalente a 0,5-0,9 ml/kg de esta formulación (186,1 mg gluconato cálcico/ml); en urgencias puede administrarse en 10-30 min. Inyectar lentamente y en asepsia; monitorizar función cardiaca e interrumpir si hay arritmia/bradicardia. Solución debe estar a temperatura corporal antes de administrar. Fuente: ficha técnica CIMAVET (Calciovet S, nº registro 3856 ESP)." },
      gato:  { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "IV (lenta)", frecuencia: "dosis única, infusión lenta con monitorización cardiaca", notas: "9-15 mg de Ca/kg/hora, equivalente a 0,5-0,9 ml/kg de esta formulación (186,1 mg gluconato cálcico/ml); en urgencias puede administrarse en 10-30 min. Inyectar lentamente y en asepsia; monitorizar función cardiaca e interrumpir si hay arritmia/bradicardia. Fuente: ficha técnica CIMAVET (Calciovet S, nº registro 3856 ESP)." }
    }
  },
  {
    id: "ivermectina-pirantel",
    principioActivo: "Ivermectina + Pirantel",
    nombresComerciales: ["Cardotek"],
    categoria: "Antiparasitario interno combinado (lactona macrocíclica + pirantel)",
    indicaciones: ["Prevención de dirofilariosis", "Ascáridos", "Anquilostomas"],
    especies: {
      perro: { dosisMin: 0.006, dosisMax: 0.006, unidad: "mg/kg", via: "VO", frecuencia: "mensual", notas: "Dosis mínima recomendada: 6 mcg/kg de ivermectina + 5 mg/kg de pirantel (pamoato), a intervalos mensuales. No confundir con la dosis de ivermectina para sarna (0,2-0,6 mg/kg), muy superior. ⚠ Precaución en razas sensibles a la mutación MDR1 (Collie, Pastor Australiano, Pastor de Shetland y cruces). Fuente: ficha técnica CIMAVET (Cardotek 30 Plus, nº registro 1080-1082 ESP)." }
    }
  },
  {
    id: "mebendazol",
    principioActivo: "Mebendazol",
    nombresComerciales: ["Telmin"],
    categoria: "Antiparasitario interno (bencimidazol)",
    indicaciones: ["Desparasitación interna", "Nematodos", "Cestodos"],
    especies: {
      perro: { dosisMin: 20, dosisMax: 20, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h durante 3 días (nematodos) o 5 días (cestodos)", notas: "Equivale a 1 comprimido/5 kg/día. Fuente: ficha técnica CIMAVET (Telmin, nº registro 474 ESP)." },
      gato:  { dosisMin: 20, dosisMax: 20, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h durante 3 días (nematodos) o 5 días (cestodos)", notas: "Equivale a 1 comprimido/5 kg/día. Fuente: ficha técnica CIMAVET (Telmin, nº registro 474 ESP)." }
    }
  },
  {
    id: "imidacloprid-moxidectina",
    principioActivo: "Imidacloprid + Moxidectina",
    nombresComerciales: ["Advocate", "Prinovox", "Prinocate"],
    categoria: "Antiparasitario externo e interno combinado (spot-on)",
    indicaciones: ["Pulgas", "Sarna sarcóptica", "Sarna demodécica", "Otodectes", "Prevención de dirofilariosis", "Desparasitación interna (nematodos)"],
    especies: {
      perro: { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "Tópica (spot-on)", frecuencia: "mensual", notas: "Dosis mínima 10 mg/kg imidacloprid + 2,5 mg/kg moxidectina (0,1 ml/kg). Pipetas por tramo de peso: ≤4 kg → 0,4 ml (40+10 mg); >4-10 kg → 1,0 ml (100+25 mg); >10-25 kg → 2,5 ml (250+62,5 mg); >25-40 kg → 4,0 ml (400+100 mg); >40 kg → combinación de pipetas. Solo indicado cuando el tratamiento de pulgas coincide con otra indicación (no usar solo como antipulgas). Fuente: Summary of Product Characteristics, VMD (Reino Unido), equivalente al registro CIMAVET EU/2/03/039 (CIMAVET bloqueado por CAPTCHA al ser autorización centralizada UE)." },
      gato:  { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "Tópica (spot-on)", frecuencia: "mensual", notas: "Dosis mínima 10 mg/kg imidacloprid + 1,0 mg/kg moxidectina (0,1 ml/kg). Pipetas por tramo de peso: ≤4 kg → 0,4 ml (40+4 mg); >4-8 kg → 0,8 ml (80+8 mg); >8 kg → combinación de pipetas. Solo indicado cuando el tratamiento de pulgas coincide con otra indicación. Fuente: Summary of Product Characteristics, VMD (Reino Unido), equivalente al registro CIMAVET EU/2/03/039 (CIMAVET bloqueado por CAPTCHA al ser autorización centralizada UE)." }
    }
  },
  {
    id: "milbemicina-praziquantel",
    principioActivo: "Milbemicina oxima + Praziquantel",
    nombresComerciales: ["Milbemax", "Milbeguard", "Milprazon", "Milpro", "Alpramil", "Milbenin", "Milbeprazin"],
    categoria: "Antiparasitario interno combinado (lactona macrocíclica + prazicuantel)",
    indicaciones: ["Desparasitación interna", "Prevención de dirofilariosis", "Cestodos"],
    especies: {
      perro: { dosisMin: 0.5, dosisMax: 0.5, unidad: "mg/kg", via: "VO", frecuencia: "dosis única (mensual en prevención de dirofilariosis)", notas: "Dosis expresada como milbemicina oxima; el comprimido asocia además 5 mg/kg de prazicuantel (proporción fija según tabla de peso de la ficha técnica: 5-25 kg → 1 comprimido de 12,5/125 mg, >25-50 kg → 2, >50-75 kg → 3; existe además presentación para perros pequeños/cachorros de 2,5/25 mg). Para Angiostrongylus vasorum, dar milbemicina 4 veces a intervalos semanales. Administrar con o después de la comida. Fuente: Summary of Product Characteristics, VMD (Reino Unido)." },
      gato:  { dosisMin: 2, dosisMax: 2, unidad: "mg/kg", via: "VO", frecuencia: "dosis única (mensual en prevención de dirofilariosis)", notas: "Dosis expresada como milbemicina oxima; el comprimido asocia además 5 mg/kg de prazicuantel (proporción fija según tabla de peso de la ficha técnica: 2-4 kg → 1/2 comprimido de 16/40 mg, >4-8 kg → 1, >8-12 kg → 1,5; existe además presentación para gatos pequeños/gatitos de 4/10 mg). Administrar con o después de la comida. Fuente: Summary of Product Characteristics, VMD (Reino Unido)." }
    }
  },
  {
    id: "ivermectina",
    principioActivo: "Ivermectina",
    nombresComerciales: ["Ivomec"],
    categoria: "Antiparasitario (lactona macrocíclica)",
    indicaciones: ["Sarna demodécica/sarcóptica"],
    especies: {
      perro: { dosisMin: 0.2, dosisMax: 0.6, unidad: "mg/kg", via: "VO/SC", frecuencia: "cada 24 h (protocolos prolongados en demodicosis)", notas: "⚠ CONTRAINDICADO o usar con máxima precaución en razas sensibles a mutación MDR1 (Collie, Pastor Australiano, Pastor de Shetland y cruces): riesgo de neurotoxicidad grave. La dosis para prevención de dirofilariosis es muy inferior (~0,006 mg/kg) y no corresponde a este rango." },
      gato:  { dosisMin: 0.2, dosisMax: 0.3, unidad: "mg/kg", via: "SC", frecuencia: "cada 24 h (protocolos prolongados en demodicosis/notoedres)", notas: "Usar con precaución; iniciar con dosis bajas y vigilar signos neurológicos." }
    }
  },
  {
    id: "selamectina",
    principioActivo: "Selamectina",
    nombresComerciales: ["Stronghold"],
    categoria: "Antiparasitario tópico (lactona macrocíclica)",
    indicaciones: ["Desparasitación externa e interna", "Prevención de dirofilariosis"],
    especies: {
      perro: { dosisMin: 6, dosisMax: 12, unidad: "mg/kg", via: "Tópica", frecuencia: "mensual", notas: "Dosis fija por pipeta según banda de peso del envase, no fraccionar la pipeta." },
      gato:  { dosisMin: 6, dosisMax: 12, unidad: "mg/kg", via: "Tópica", frecuencia: "mensual", notas: "Dosis fija por pipeta según banda de peso del envase, no fraccionar la pipeta." }
    }
  },
  {
    id: "clorfeniramina",
    principioActivo: "Clorfeniramina",
    nombresComerciales: ["Polaramine (uso humano)"],
    categoria: "Antihistamínico (H1)",
    indicaciones: ["Alergia", "Prurito"],
    especies: {
      perro: { dosisMin: 0.4, dosisMax: 0.4, unidad: "mg/kg", via: "VO", frecuencia: "cada 8-12 h", notas: "" },
      gato:  { dosisMin: 0.5, dosisMax: 1, unidad: "mg/kg", via: "VO", frecuencia: "cada 12 h", notas: "Habitualmente pautado como dosis fija de 2-4 mg/gato cada 12 h; el rango mg/kg es orientativo." }
    }
  },
  {
    id: "itraconazol",
    principioActivo: "Itraconazol",
    nombresComerciales: ["Itrafungol"],
    categoria: "Antifúngico (triazol)",
    indicaciones: ["Infección fúngica", "Dermatofitosis"],
    especies: {
      perro: { dosisMin: 5, dosisMax: 10, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h, con alimento", notas: "Monitorizar función hepática en tratamientos largos." },
      gato:  { dosisMin: 5, dosisMax: 10, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h, con alimento", notas: "Monitorizar función hepática en tratamientos largos." }
    }
  },
  {
    id: "terbinafina",
    principioActivo: "Terbinafina",
    nombresComerciales: ["Lamisil (uso humano)"],
    categoria: "Antifúngico (alilamina)",
    indicaciones: ["Infección fúngica", "Dermatofitosis", "Malassezia"],
    especies: {
      perro: { dosisMin: 20, dosisMax: 30, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h", notas: "Monitorizar función hepática en tratamientos largos." },
      gato:  { dosisMin: 20, dosisMax: 30, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h", notas: "Monitorizar función hepática en tratamientos largos." }
    }
  },
  {
    id: "vitamina-k1",
    principioActivo: "Fitomenadiona (Vitamina K1)",
    nombresComerciales: ["Konakion (uso humano)", "Kaergona"],
    categoria: "Antídoto (rodenticidas anticoagulantes)",
    indicaciones: ["Intoxicación por rodenticidas anticoagulantes"],
    especies: {
      perro: { dosisMin: 2.5, dosisMax: 5, unidad: "mg/kg", via: "VO/SC", frecuencia: "cada 12-24 h durante 2-4 semanas según el rodenticida", notas: "Evitar vía IV (riesgo de anafilaxia); administrar con alimento graso para mejorar absorción oral. Duración según el tipo de anticoagulante ingerido." },
      gato:  { dosisMin: 2.5, dosisMax: 5, unidad: "mg/kg", via: "VO/SC", frecuencia: "cada 12-24 h durante 2-4 semanas según el rodenticida", notas: "Evitar vía IV (riesgo de anafilaxia); administrar con alimento graso para mejorar absorción oral. Duración según el tipo de anticoagulante ingerido." }
    }
  },
  // ---- Anticuerpos monoclonales: dosis fija por banda de peso (no mg/kg lineal) ----
  // Tabla oficial tomada de la ficha técnica/EPAR (EMA) de cada producto. especies.<especie>.tipoDosis = "banda"
  // sustituye al cálculo mg/kg: se busca el tramo de peso del paciente y se muestra la dosis fija de esa banda.
  {
    id: "bedinvetmab",
    principioActivo: "Bedinvetmab",
    nombresComerciales: ["Librela"],
    categoria: "Anticuerpo monoclonal (anti-NGF, antidolor)",
    indicaciones: ["Dolor por osteoartritis"],
    especies: {
      perro: {
        tipoDosis: "banda",
        pesoMinimo: 0,
        via: "SC",
        frecuencia: "una vez al mes",
        notas: "No usar en perros menores de 12 meses, en reproductores ni en gestación/lactancia. Dosis fija por tramo de peso según ficha técnica EMA, no mg/kg lineal. Si no hay respuesta al mes, puede valorarse una segunda dosis; si tampoco responde, considerar otro tratamiento.",
        bandas: [
          { pesoMin: 0, pesoMax: 5.0, formula: true, mlPorKg: 0.1, concentracion: 5, descripcion: "0,1 ml/kg del vial de 5 mg/ml" },
          { pesoMin: 5.0, pesoMax: 10.0, mg: 5, ml: 1, descripcion: "1 vial de 5 mg (1 ml)" },
          { pesoMin: 10.1, pesoMax: 20.0, mg: 10, ml: 1, descripcion: "1 vial de 10 mg (1 ml)" },
          { pesoMin: 20.1, pesoMax: 30.0, mg: 15, ml: 1, descripcion: "1 vial de 15 mg (1 ml)" },
          { pesoMin: 30.1, pesoMax: 40.0, mg: 20, ml: 1, descripcion: "1 vial de 20 mg (1 ml)" },
          { pesoMin: 40.1, pesoMax: 60.0, mg: 30, ml: 1, descripcion: "1 vial de 30 mg (1 ml)" },
          { pesoMin: 60.1, pesoMax: 80.0, mg: 40, ml: 2, descripcion: "2 viales de 20 mg (2 ml)" },
          { pesoMin: 80.1, pesoMax: 100.0, mg: 50, ml: 2, descripcion: "1 vial de 20 mg + 1 vial de 30 mg (2 ml)" },
          { pesoMin: 100.1, pesoMax: 120.0, mg: 60, ml: 2, descripcion: "2 viales de 30 mg (2 ml)" }
        ]
      }
    }
  },
  {
    id: "lokivetmab",
    principioActivo: "Lokivetmab",
    nombresComerciales: ["Cytopoint"],
    categoria: "Anticuerpo monoclonal (anti-IL-31, antiprurito)",
    indicaciones: ["Dermatitis atópica", "Prurito"],
    especies: {
      perro: {
        tipoDosis: "banda",
        pesoMinimo: 3.0,
        avisoPesoMinimo: "No usar en perros de menos de 3 kg.",
        via: "SC",
        frecuencia: "una vez al mes",
        notas: "Investigar y tratar factores concomitantes (infección bacteriana/fúngica, parásitos) en la dermatitis atópica. Dosis fija por tramo de peso según ficha técnica EMA, no mg/kg lineal.",
        bandas: [
          { pesoMin: 3.0, pesoMax: 10.0, mg: 10, ml: 1, descripcion: "1 vial de 10 mg (1 ml)" },
          { pesoMin: 10.1, pesoMax: 20.0, mg: 20, ml: 1, descripcion: "1 vial de 20 mg (1 ml)" },
          { pesoMin: 20.1, pesoMax: 30.0, mg: 30, ml: 1, descripcion: "1 vial de 30 mg (1 ml)" },
          { pesoMin: 30.1, pesoMax: 40.0, mg: 40, ml: 1, descripcion: "1 vial de 40 mg (1 ml)" },
          { pesoMin: 40.1, pesoMax: 50.0, mg: 50, ml: 2, descripcion: "1 vial de 10 mg + 1 vial de 40 mg (2 ml)" },
          { pesoMin: 50.1, pesoMax: 60.0, mg: 60, ml: 2, descripcion: "2 viales de 30 mg (2 ml)" },
          { pesoMin: 60.1, pesoMax: 70.0, mg: 70, ml: 2, descripcion: "1 vial de 30 mg + 1 vial de 40 mg (2 ml)" },
          { pesoMin: 70.1, pesoMax: 80.0, mg: 80, ml: 2, descripcion: "2 viales de 40 mg (2 ml)" }
        ]
      }
    }
  },
  {
    id: "frunevetmab",
    principioActivo: "Frunevetmab",
    nombresComerciales: ["Solensia"],
    categoria: "Anticuerpo monoclonal (anti-NGF, antidolor)",
    indicaciones: ["Dolor por osteoartritis"],
    especies: {
      gato: {
        tipoDosis: "banda",
        pesoMinimo: 2.5,
        avisoPesoMinimo: "No usar en gatos de menos de 2,5 kg ni menores de 12 meses.",
        via: "SC",
        frecuencia: "una vez al mes",
        notas: "No usar en gatos menores de 12 meses, en reproductores ni en gestación/lactancia. Precaución (valorar riesgo-beneficio) en enfermedad renal IRIS 3-4. Dosis fija por tramo de peso (7 mg/ml), no mg/kg lineal.",
        bandas: [
          { pesoMin: 2.5, pesoMax: 7.0, mg: null, ml: 1, concentracion: 7, descripcion: "1 vial (7 mg, 1 ml)" },
          { pesoMin: 7.1, pesoMax: 14.0, mg: null, ml: 2, concentracion: 7, descripcion: "2 viales (14 mg, 2 ml)" }
        ]
      }
    }
  },
  {
    id: "izenivetmab",
    principioActivo: "Izenivetmab",
    nombresComerciales: ["Lenivia"],
    categoria: "Anticuerpo monoclonal (anti-NGF, antidolor)",
    indicaciones: ["Dolor por osteoartritis"],
    especies: {
      perro: {
        tipoDosis: "banda",
        pesoMinimo: 0,
        avisoPesoMinimo: "No usar en perros menores de 12 meses, en reproductores ni en gestación/lactancia.",
        via: "SC",
        frecuencia: "una vez cada 3 meses",
        notas: "Dosis recomendada 0,05-0,1 mg/kg. Dosis fija por tramo de peso según ficha técnica, no mg/kg lineal. Fuente: Summary of Product Characteristics, VMD (Reino Unido), VM 42058/5193 — equivalente al registro CIMAVET EU/2/25/355 (CIMAVET bloqueado por CAPTCHA al ser autorización centralizada UE).",
        bandas: [
          { pesoMin: 0, pesoMax: 5.0, formula: true, mlPorKg: 0.1, concentracion: 0.5, descripcion: "0,1 ml/kg del vial de 0,5 mg/ml" },
          { pesoMin: 5.0, pesoMax: 10.0, mg: 0.5, ml: 1, descripcion: "1 vial de 0,5 mg (1 ml)" },
          { pesoMin: 10.1, pesoMax: 20.0, mg: 1.0, ml: 1, descripcion: "1 vial de 1,0 mg (1 ml)" },
          { pesoMin: 20.1, pesoMax: 30.0, mg: 1.5, ml: 1, descripcion: "1 vial de 1,5 mg (1 ml)" },
          { pesoMin: 30.1, pesoMax: 40.0, mg: 2.0, ml: 1, descripcion: "1 vial de 2,0 mg (1 ml)" },
          { pesoMin: 40.1, pesoMax: 60.0, mg: 3.0, ml: 1, descripcion: "1 vial de 3,0 mg (1 ml)" },
          { pesoMin: 60.1, pesoMax: 80.0, mg: 4.0, ml: 2, descripcion: "2 viales de 2,0 mg (2 ml)" },
          { pesoMin: 80.1, pesoMax: 100.0, mg: 5.0, ml: 2, descripcion: "1 vial de 2,0 mg + 1 vial de 3,0 mg (2 ml)" },
          { pesoMin: 100.1, pesoMax: 120.0, mg: 6.0, ml: 2, descripcion: "2 viales de 3,0 mg (2 ml)" }
        ]
      }
    }
  },
  {
    id: "relfovetmab",
    principioActivo: "Relfovetmab",
    nombresComerciales: ["Portela"],
    categoria: "Anticuerpo monoclonal (anti-NGF, antidolor)",
    indicaciones: ["Dolor por osteoartritis"],
    especies: {
      gato: {
        tipoDosis: "banda",
        pesoMinimo: 2.5,
        avisoPesoMinimo: "No usar en gatos de menos de 2,5 kg, menores de 12 meses, en reproductores ni en gestación/lactancia. Seguridad y eficacia no estudiadas en gatos de más de 13,7 kg.",
        via: "SC",
        frecuencia: "una vez cada 3 meses",
        notas: "Dosis recomendada 0,5-1,25 mg/kg. Dosis fija por tramo de peso según ficha técnica, no mg/kg lineal. Fuente: Summary of Product Characteristics, VMD (Reino Unido), VM 42058/5214 — equivalente al registro CIMAVET EU/2/25/353 (CIMAVET bloqueado por CAPTCHA al ser autorización centralizada UE).",
        bandas: [
          { pesoMin: 2.5, pesoMax: 5.0, mg: 2.5, ml: 1, descripcion: "1 vial de 2,5 mg (1 ml)" },
          { pesoMin: 5.1, pesoMax: 12.8, mg: 6.4, ml: 1, descripcion: "1 vial de 6,4 mg (1 ml)" },
          { pesoMin: 12.9, pesoMax: 13.7, mg: 8.9, ml: 2, descripcion: "1 vial de 2,5 mg + 1 vial de 6,4 mg (2 ml)" }
        ]
      }
    }
  },
  {
    id: "oclacitinib",
    principioActivo: "Oclacitinib",
    nombresComerciales: ["Apoquel"],
    categoria: "Inmunomodulador (inhibidor de JAK, antipruriginoso)",
    indicaciones: ["Dermatitis alérgica", "Dermatitis atópica", "Prurito"],
    especies: {
      perro: { dosisMin: 0.4, dosisMax: 0.6, unidad: "mg/kg", via: "VO", frecuencia: "cada 12 h durante un máximo de 14 días, después cada 24 h de mantenimiento", notas: "Solo en perros a partir de 12 meses de edad. Fuente: FDA Freedom of Information Summary, NADA 141-345 (Zoetis)." }
      // No autorizado en gatos: se omite por seguridad.
    }
  },

  // ---- Suplementos/nutracéuticos sin dosis lineal por kg (pauta fija por tramo de peso,
  // tal cual figura en el prospecto del fabricante) ----
  {
    id: "hepatosil-plus-gel",
    principioActivo: "Silibina (cardo mariano) + fosfatidilcolina + vitamina E",
    nombresComerciales: ["Hepatosil Plus Gel"],
    categoria: "Suplemento hepático",
    indicaciones: ["Apoyo hepático"],
    especies: {
      perro: { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "VO", frecuencia: "según peso (ver notas)", notas: "Hasta 5 kg: 1 ml al día. De 5 a 10 kg: 2 ml al día. De 10 a 20 kg: 3 ml al día. De 20 a 30 kg: 4 ml al día. Más de 30 kg: 5 ml al día. Directamente en la boca o mezclado con la comida." },
      gato:  { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "VO", frecuencia: "según peso (ver notas)", notas: "Hasta 5 kg: 1 ml al día. De 5 a 10 kg: 2 ml al día. De 10 a 20 kg: 3 ml al día. De 20 a 30 kg: 4 ml al día. Más de 30 kg: 5 ml al día. Directamente en la boca o mezclado con la comida." }
    }
  },
  {
    id: "hepatosil-plus-razas-pequenas",
    principioActivo: "Levadura de cerveza + silibina (cardo mariano) + taurina + vitaminas del grupo B",
    nombresComerciales: ["Hepatosil Plus Razas Pequeñas"],
    categoria: "Suplemento hepático",
    indicaciones: ["Apoyo hepático"],
    especies: {
      perro: { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "VO", frecuencia: "según peso (ver notas)", notas: "Hasta 2,5 kg: 0,5 comprimidos al día. De 2 a 5 kg: 1 comprimido al día. De 5 a 10 kg: 2 comprimidos al día." },
      gato:  { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "VO", frecuencia: "según peso (ver notas)", notas: "Hasta 2,5 kg: 0,5 comprimidos al día. De 2 a 5 kg: 1 comprimido al día. De 5 a 10 kg: 2 comprimidos al día." }
    }
  },
  {
    id: "hepatosil-plus-razas-medianas-grandes",
    principioActivo: "Levadura de cerveza + silibina (cardo mariano) + taurina + vitaminas del grupo B",
    nombresComerciales: ["Hepatosil Plus Razas Medianas y Grandes"],
    categoria: "Suplemento hepático",
    indicaciones: ["Apoyo hepático"],
    especies: {
      perro: { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "VO", frecuencia: "según peso (ver notas)", notas: "<10 kg: 1/2 comprimido/día. 10-15 kg: 3/4 comprimidos/día. 15-20 kg: 1 comprimido/día. 20-25 kg: 1 1/4 comprimidos/día. 25-30 kg: 1 1/2 comprimidos/día. 30-35 kg: 1 3/4 comprimidos/día. 35-40 kg: 2 comprimidos/día. >40 kg: 2 1/2 comprimidos/día." }
    }
  },
  {
    id: "vetilea-hepato-gel",
    principioActivo: "Producto de levadura (Saccharomyces cerevisiae)",
    nombresComerciales: ["Vetilea Hepato Gel"],
    categoria: "Suplemento hepático",
    indicaciones: ["Apoyo hepático"],
    especies: {
      perro: { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "VO", frecuencia: "según peso (ver notas)", notas: "0,5 ml al día por cada 5 kg de peso corporal." },
      gato:  { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "VO", frecuencia: "según peso (ver notas)", notas: "0,5 ml al día por cada 5 kg de peso corporal." }
    }
  },
  {
    id: "vetilea-hepato-st",
    principioActivo: "Producto de levadura (Saccharomyces cerevisiae)",
    nombresComerciales: ["Vetilea Hepato ST"],
    categoria: "Suplemento hepático",
    indicaciones: ["Apoyo hepático"],
    especies: {
      perro: { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "VO", frecuencia: "según peso (ver notas)", notas: "1 comprimido al día por cada 20 kg de peso corporal." },
      gato:  { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "VO", frecuencia: "según peso (ver notas)", notas: "1 comprimido al día por cada 20 kg de peso corporal." }
    }
  },
  {
    id: "calmurofel",
    principioActivo: "L-triptófano + glucosamina + condroitín sulfato + ácido hialurónico",
    nombresComerciales: ["Calmurofel"],
    categoria: "Ansiolítico natural (triptófano)",
    indicaciones: ["Ansiedad", "Estrés"],
    especies: {
      perro: { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "VO", frecuencia: "según peso (ver notas)", notas: "<3 kg: 1 cápsula al día. >3 kg: 2 cápsulas al día. Mantenimiento en casos crónicos: <3 kg: 1 cápsula en días alternos; >3 kg: 1 cápsula al día." }
    }
  },
  {
    id: "impromune-pasta",
    principioActivo: "Nucleoforce (nucleótidos de Saccharomyces cerevisiae) + Immunactive (Lentinus edodes)",
    nombresComerciales: ["Impromune Pasta"],
    categoria: "Inmunoestimulante",
    indicaciones: ["Apoyo inmunitario"],
    especies: {
      perro: { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "VO", frecuencia: "según peso (ver notas)", notas: "<10 kg: 2 ml/día. 11-25 kg: 4 ml/día. >26 kg: 8 ml/día." }
    }
  },
  {
    id: "bener-rc-15",
    principioActivo: "Levadura de S. cerevisiae + hierro, cobre, vitaminas C, E, B1, B2, B3, B6, B9, B12 y K3",
    nombresComerciales: ["BENER RC-15"],
    categoria: "Suplemento multivitamínico",
    indicaciones: ["Suplementación nutricional"],
    especies: {
      perro: { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "VO", frecuencia: "según peso (ver notas)", notas: "1 chew por cada 15 kg de peso." }
    }
  },
  {
    id: "dialix-lespedeza-5",
    principioActivo: "Lespedeza capitata",
    nombresComerciales: ["Dialix Lespedeza 5"],
    categoria: "Suplemento renal (Lespedeza capitata)",
    indicaciones: ["Apoyo renal", "Proteinuria"],
    especies: {
      perro: { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "VO", frecuencia: "según peso (ver notas)", notas: "1 soft chew por cada 5 kg de peso, dos veces al día." }
    }
  },
  {
    id: "dialix-lespedeza-15",
    principioActivo: "Lespedeza capitata",
    nombresComerciales: ["Dialix Lespedeza 15"],
    categoria: "Suplemento renal (Lespedeza capitata)",
    indicaciones: ["Apoyo renal", "Proteinuria"],
    especies: {
      perro: { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "VO", frecuencia: "según peso (ver notas)", notas: "1 comprimido dos veces al día (mañana y noche) por cada 15 kg de peso." }
    }
  },
  {
    id: "dialix-lespedeza-plus-5",
    principioActivo: "Lespedeza capitata + carbonato cálcico",
    nombresComerciales: ["Dialix Lespedeza Plus 5"],
    categoria: "Suplemento renal (Lespedeza capitata)",
    indicaciones: ["Apoyo renal", "Proteinuria"],
    especies: {
      perro: { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "VO", frecuencia: "según peso (ver notas)", notas: "1 soft chew por cada 5 kg de peso, dos veces al día." }
    }
  },
  {
    id: "dialix-lespedeza-plus-15",
    principioActivo: "Lespedeza capitata + carbonato cálcico",
    nombresComerciales: ["Dialix Lespedeza Plus 15"],
    categoria: "Suplemento renal (Lespedeza capitata)",
    indicaciones: ["Apoyo renal", "Proteinuria"],
    especies: {
      perro: { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "VO", frecuencia: "según peso (ver notas)", notas: "1 soft chew por cada 15 kg de peso, dos veces al día." }
    }
  },
  {
    id: "zylkene-75",
    principioActivo: "Caseína hidrolizada (alfa-casozepina)",
    nombresComerciales: ["Zylkene 75 mg"],
    categoria: "Ansiolítico natural (caseína hidrolizada)",
    indicaciones: ["Ansiedad", "Estrés"],
    especies: {
      perro: { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "VO", frecuencia: "según peso (ver notas)", notas: "Menos de 5 kg: 1 cápsula/24 h. De 5 a 10 kg: 2 cápsulas/24 h." }
    }
  },
  {
    id: "zylkene-225",
    principioActivo: "Caseína hidrolizada (alfa-casozepina)",
    nombresComerciales: ["Zylkene 225 mg"],
    categoria: "Ansiolítico natural (caseína hidrolizada)",
    indicaciones: ["Ansiedad", "Estrés"],
    especies: {
      perro: { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "VO", frecuencia: "según peso (ver notas)", notas: "De 10 a 15 kg: 1 cápsula/24 h. De 15 a 30 kg: 2 cápsulas/24 h." }
    }
  },
  {
    id: "zylkene-450",
    principioActivo: "Caseína hidrolizada (alfa-casozepina)",
    nombresComerciales: ["Zylkene 450 mg"],
    categoria: "Ansiolítico natural (caseína hidrolizada)",
    indicaciones: ["Ansiedad", "Estrés"],
    especies: {
      perro: { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "VO", frecuencia: "según peso (ver notas)", notas: "20-40 kg: 1 cápsula al día. >40 kg: 2 cápsulas al día." }
    }
  },
  {
    id: "cystaid-canino",
    principioActivo: "N-acetil-D-glucosamina",
    nombresComerciales: ["Cystaid Canino"],
    categoria: "Suplemento urinario",
    indicaciones: ["Cistitis idiopática", "Apoyo urinario"],
    especies: {
      perro: { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "VO", frecuencia: "según peso (ver notas)", notas: "1 cápsula por cada 10 kg de peso durante 3-4 semanas hasta la desaparición de los síntomas. Mantenimiento/prevención en casos recurrentes: 1 cápsula por cada 10 kg cada 2 días (un día sí, un día no)." }
    }
  },
  {
    id: "cystaid-gatos",
    principioActivo: "N-acetil-D-glucosamina + L-teanina + quercetina dihidrato",
    nombresComerciales: ["Cystaid Gatos"],
    categoria: "Suplemento urinario",
    indicaciones: ["Cistitis idiopática felina", "Apoyo urinario"],
    especies: {
      gato: { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "VO", frecuencia: "según peso (ver notas)", notas: "Inicialmente 2 cápsulas al día (1 mañana / 1 noche) durante 3-4 semanas. Para tratamientos más largos: 1 cápsula al día." }
    }
  },
  {
    id: "urinaid",
    principioActivo: "D-manosa + arándano (Vaccinium macrocarpon) + granada + Withania somnifera",
    nombresComerciales: ["Urinaid"],
    categoria: "Suplemento urinario",
    indicaciones: ["Apoyo urinario"],
    especies: {
      perro: { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "VO", frecuencia: "según peso (ver notas)", notas: "<10 kg: 1 comprimido. 10-20 kg: 1 1/2 comprimidos. 20-30 kg: 2 comprimidos. >30 kg: 3 comprimidos." }
    }
  },
  {
    id: "calmex-perros",
    principioActivo: "L-triptófano + Rhodiola rosea + lecitina + Passiflora incarnata",
    nombresComerciales: ["Calmex Perros"],
    categoria: "Ansiolítico natural (triptófano/rhodiola)",
    indicaciones: ["Ansiedad", "Estrés"],
    especies: {
      perro: { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "VO", frecuencia: "según peso (ver notas)", notas: "<10 kg: 1 comprimido/día. 11-20 kg: 2 comprimidos/día. 21-30 kg: 3 comprimidos/día. 31-40 kg: 4 comprimidos/día. >40 kg: 5 comprimidos/día." }
    }
  },
  {
    id: "aktivait-perros-medianos-grandes",
    principioActivo: "DHA/EPA + fosfatidilserina + antioxidantes (vitamina E, coenzima Q10, ácido alfa lipoico)",
    nombresComerciales: ["Aktivait Perros Medianos y Grandes"],
    categoria: "Suplemento cognitivo (antioxidantes)",
    indicaciones: ["Disfunción cognitiva", "Apoyo neurológico en el envejecimiento"],
    especies: {
      perro: { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "VO", frecuencia: "según peso (ver notas)", notas: "10-20 kg: 1 comprimido/día. 20-40 kg: 2 comprimidos/día (1 mañana, 1 noche). >40 kg: 3 comprimidos/día (2 mañana, 1 noche)." }
    }
  },
  {
    id: "condrovet-force-ha-120",
    principioActivo: "Glucosamina HCl + condroitín sulfato + ácido hialurónico + colágeno nativo tipo II",
    nombresComerciales: ["Condrovet Force HA 120"],
    categoria: "Suplemento articular (condroprotector)",
    indicaciones: ["Osteoartritis", "Apoyo articular"],
    especies: {
      perro: { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "VO", frecuencia: "según peso (ver notas)", notas: "<5 kg: 1/2 comprimido. 5-10 kg: 1 comprimido. 10-20 kg: 2 comprimidos. 20-40 kg: 3 comprimidos. >40 kg: 4 comprimidos." }
    }
  },
  {
    id: "condrovet-force-ha-240",
    principioActivo: "Glucosamina HCl + condroitín sulfato + ácido hialurónico + colágeno nativo tipo II",
    nombresComerciales: ["Condrovet Force HA 240"],
    categoria: "Suplemento articular (condroprotector)",
    indicaciones: ["Osteoartritis", "Apoyo articular"],
    especies: {
      perro: { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "VO", frecuencia: "según peso (ver notas)", notas: "<5 kg: 1/2 comprimido. 5-10 kg: 1 comprimido. 10-20 kg: 2 comprimidos. 20-40 kg: 3 comprimidos. >40 kg: 4 comprimidos." }
    }
  },
  {
    id: "condrovet-force-ha-gatos",
    principioActivo: "Glucosamina HCl + condroitín sulfato + ácido hialurónico + colágeno nativo tipo II",
    nombresComerciales: ["Condrovet Force HA Gatos"],
    categoria: "Suplemento articular (condroprotector)",
    indicaciones: ["Osteoartritis", "Apoyo articular"],
    especies: {
      gato: { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "VO", frecuencia: "según peso (ver notas)", notas: "<5 kg: 1 cápsula al día. >5 kg: 2 cápsulas al día." }
    }
  },
  {
    id: "cosequin-advanced-perros",
    principioActivo: "Glucosamina HCl + condroitín sulfato + MSM + hialuronato sódico",
    nombresComerciales: ["Cosequin Advanced Perros"],
    categoria: "Suplemento articular (condroprotector)",
    indicaciones: ["Osteoartritis", "Apoyo articular"],
    especies: {
      perro: { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "VO", frecuencia: "según peso (ver notas)", notas: "Hasta 7 kg: 1/2 comprimido. 8-15 kg: 1 comprimido. 16-30 kg: 2 comprimidos. >30 kg: 3 comprimidos." }
    }
  },

  // ---- Fármacos sin pauta de dosificación registrada todavía: solo nombre/composición
  // conocidos (el usuario no había anotado una dosis en su base de datos personal). Se
  // añaden igualmente para que el producto sea localizable por nombre/composición desde
  // cualquier dispositivo; en cuanto se indique la pauta real se completa con notas. ----
  {
    id: "fortiflora-perros",
    principioActivo: "Cepa probiótica Enterococcus faecium SF68",
    nombresComerciales: ["Fortiflora perros"],
    categoria: "Probiótico",
    indicaciones: ["Diarrea", "Apoyo digestivo"],
    especies: {
      perro: { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "VO", frecuencia: "-", notas: "" }
    }
  },
  {
    id: "fortiflora-felina",
    principioActivo: "Cepa probiótica Enterococcus faecium SF68",
    nombresComerciales: ["Fortiflora Felina"],
    categoria: "Probiótico",
    indicaciones: ["Diarrea", "Apoyo digestivo"],
    especies: {
      gato: { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "VO", frecuencia: "-", notas: "" }
    }
  },
  {
    id: "pro-enteric-advanced-15",
    principioActivo: "Probiótico (Enterococcus faecium) + prebiótico (FOS/arabinogalactanos)",
    nombresComerciales: ["Pro Enteric Advanced 15ml"],
    categoria: "Probiótico/Prebiótico",
    indicaciones: ["Diarrea", "Apoyo digestivo"],
    especies: {
      perro: { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "VO", frecuencia: "-", notas: "" },
      gato:  { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "VO", frecuencia: "-", notas: "" }
    }
  },
  {
    id: "pro-enteric-advanced-30",
    principioActivo: "Probiótico (Enterococcus faecium) + prebiótico (FOS/arabinogalactanos) + caolina + pectina",
    nombresComerciales: ["Pro Enteric Advanced 30ml"],
    categoria: "Probiótico/Prebiótico",
    indicaciones: ["Diarrea", "Apoyo digestivo"],
    especies: {
      perro: { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "VO", frecuencia: "-", notas: "" },
      gato:  { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "VO", frecuencia: "-", notas: "" }
    }
  },
  {
    id: "digest-plasmoral-razas-pequenas-medianas",
    principioActivo: "Complejo de plasma + probióticos (Enterococcus faecium) + prebióticos (FOS/MOS) + vitaminas + zinc + selenio",
    nombresComerciales: ["Digest Plasmoral Razas Pequeñas y Medianas"],
    categoria: "Probiótico/Prebiótico",
    indicaciones: ["Diarrea", "Apoyo digestivo"],
    especies: {
      perro: { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "VO", frecuencia: "-", notas: "" },
      gato:  { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "VO", frecuencia: "-", notas: "" }
    }
  },
  {
    id: "digest-plasmoral-razas-grandes-gigantes",
    principioActivo: "Complejo de plasma + probióticos (Enterococcus faecium) + prebióticos (FOS/MOS) + vitaminas + zinc + selenio",
    nombresComerciales: ["Digest Plasmoral Razas Grandes y Gigantes"],
    categoria: "Probiótico/Prebiótico",
    indicaciones: ["Diarrea", "Apoyo digestivo"],
    especies: {
      perro: { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "VO", frecuencia: "-", notas: "" }
    }
  },
  {
    id: "vetilea-gastro-gel",
    principioActivo: "Carbonato cálcico + alginato sódico",
    nombresComerciales: ["Vetilea Gastro Gel 50ml"],
    categoria: "Antiácido/Protector gástrico",
    indicaciones: ["Gastritis", "Reflujo gastroesofágico"],
    especies: {
      perro: { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "VO", frecuencia: "-", notas: "" },
      gato:  { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "VO", frecuencia: "-", notas: "" }
    }
  },
  {
    id: "vetilea-gastro-comprimidos",
    principioActivo: "Carbonato cálcico + alginato sódico",
    nombresComerciales: ["Vetilea Gastro Comprimidos"],
    categoria: "Antiácido/Protector gástrico",
    indicaciones: ["Gastritis", "Reflujo gastroesofágico"],
    especies: {
      perro: { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "VO", frecuencia: "-", notas: "" },
      gato:  { dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "VO", frecuencia: "-", notas: "" }
    }
  }
];

// ---- Protocolos combinados (varios fármacos a la vez según indicación) ----
// Cada protocolo aplica una lista de fármacos (por id, referenciando DRUGS) a la vez
// sobre el paciente activo, usando la dosis de referencia de cada fármaco para su especie.
const PROTOCOLS = [
  {
    id: "sedacion-leve",
    nombre: "Sedación leve (manejo/exploración)",
    indicacion: "Sedación",
    especies: ["perro", "gato"],
    notas: "Combinación habitual para procedimientos poco dolorosos que requieren tranquilización (radiografías, curas, exploración).",
    componentes: ["acepromazina", "butorfanol"]
  },
  {
    id: "premedicacion-profunda",
    nombre: "Premedicación / sedación profunda",
    indicacion: "Premedicación",
    especies: ["perro", "gato"],
    notas: "Combinación alfa-2 agonista + opioide, habitual antes de procedimientos quirúrgicos.",
    componentes: ["dexmedetomidina", "butorfanol"]
  },
  {
    id: "induccion-anestesica-propofol",
    nombre: "Inducción anestésica (propofol + midazolam)",
    indicacion: "Anestesia",
    especies: ["perro", "gato"],
    notas: "Co-inducción para reducir la dosis total de propofol necesaria. Administrar tras premedicación.",
    componentes: ["midazolam", "propofol"]
  },
  {
    id: "induccion-anestesica-alfaxan",
    nombre: "Inducción anestésica (alfaxalona + midazolam)",
    indicacion: "Anestesia",
    especies: ["perro", "gato"],
    notas: "Alternativa a propofol para co-inducción. Administrar tras premedicación.",
    componentes: ["midazolam", "alfaxalona"]
  },
  {
    id: "anestesia-disociativa",
    nombre: "Inducción anestésica disociativa (ketamina + midazolam)",
    indicacion: "Anestesia",
    especies: ["perro", "gato"],
    notas: "Combinación clásica de inducción disociativa. No usar ketamina sola.",
    componentes: ["ketamina", "midazolam"]
  },
  {
    id: "analgesia-postquirurgica",
    nombre: "Analgesia multimodal postquirúrgica",
    indicacion: "Dolor postquirúrgico",
    especies: ["perro", "gato"],
    notas: "Combinación de AINE + opioide para control del dolor tras cirugía (una vez el paciente está estable).",
    componentes: ["meloxicam", "buprenorfina"]
  },
  // ---- Protocolos propios de la clínica (extraídos de "GUÍAS (reorganizado).docx") ----
  {
    id: "epilepsia-convulsiones-perro",
    nombre: "Epilepsia / convulsiones (perro) — escalada terapéutica",
    indicacion: "Neurología",
    especies: ["perro"],
    notas: "Tratamiento de elección: fenobarbital. Medir niveles séricos a las 2 semanas (objetivo 15-45 µg/ml). Si no reduce ≥50% la frecuencia de crisis con niveles terapéuticos tras 1-2 meses, añadir bromuro potásico SIN retirar el fenobarbital (o levetiracetam en su lugar si hay hepatopatía/shunt). Si sigue sin responder, subir fenobarbital hasta 5-6 mg/kg BID y valorar pasar a TID. Si es refractario a fenobarbital+bromuro+levetiracetam, añadir zonisamida como último escalón (poco probable que responda). Nunca retirar un fármaco de la escalada al añadir el siguiente. Para crisis agrupadas o estatus epiléptico: diazepam IV en bolo (repetir a los 5 min si no cede) ± infusión continua; si persiste, fenobarbital IV en bolo; si persiste, propofol. El fenobarbital nunca se retira de golpe (riesgo de convulsiones de rebote): reducir un 25% al mes.",
    componentes: [
      { nombre: "Fenobarbital", principioActivoReal: "Fenobarbital", categoria: "Anticonvulsivante (barbitúrico)", dosisMin: 2.5, dosisMax: 5, unidad: "mg/kg", via: "VO", frecuencia: "cada 12 h (cachorros: iniciar a 5 mg/kg cada 12 h)", notas: "Primera línea. Ajustar 10-30% según niveles séricos hasta llegar a nivel terapéutico." },
      { nombre: "Bromuro potásico", principioActivoReal: "Bromuro de potasio", categoria: "Anticonvulsivante (sal)", dosisMin: 20, dosisMax: 40, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h (o dividido en 2 tomas)", notas: "Añadir si el fenobarbital no controla ≥50% las crisis. Niveles terapéuticos: 100-200 mg/dl combinado con fenobarbital, 250-300 mg/dl en monoterapia. Tarda ~3 meses en estabilizarse sin dosis de carga (carga hospitalizada: 450-625 mg/kg repartidos en 5 días, con vómitos/diarrea esperables)." },
      { nombre: "Levetiracetam", principioActivoReal: "Levetiracetam", categoria: "Anticonvulsivante", dosisMin: 20, dosisMax: 20, unidad: "mg/kg", via: "VO/IV/IM/SC", frecuencia: "cada 8 h", notas: "Alternativa a bromuro, preferible si hay hepatopatía o shunt portosistémico (no metabolismo hepático). En crisis agrupadas: bolo de 60 mg/kg IV o intrarrectal, seguir con 20 mg/kg cada 8 h." },
      { nombre: "Zonisamida", principioActivoReal: "Zonisamida", categoria: "Anticonvulsivante", dosisMin: 5, dosisMax: 10, unidad: "mg/kg", via: "VO", frecuencia: "cada 12 h", notas: "Último escalón (refractario a fenobarbital+bromuro+levetiracetam). 5 mg/kg si va asociado a fenobarbital, 10 mg/kg si no. Vigilar función tiroidea y hepática." },
      { nombre: "Diazepam", principioActivoReal: "Diazepam", categoria: "Anticonvulsivante (benzodiazepina)", dosisMin: 0.5, dosisMax: 1, unidad: "mg/kg", dosisMaxima: 10, via: "IV/rectal", frecuencia: "bolo único, máx. 10 mg/animal; repetir a los 5 min si no cede; si va con fenobarbital usar 2 mg/kg", notas: "Solo para crisis agrupadas (>2/día) o estatus epiléptico. Si persiste, seguir con infusión continua 0.5-1 mg/kg/h." },
      { nombre: "Imepitoina", principioActivoReal: "Imepitoina", categoria: "Anticonvulsivante", dosisMin: 10, dosisMax: 30, unidad: "mg/kg", via: "VO", frecuencia: "cada 12 h", notas: "Fármaco de elección en epilepsia idiopática para algunos autores (alternativa de primera línea al fenobarbital, con menos controles necesarios y niveles en sangre alcanzados el mismo día). No funciona en clusters ni en estatus epiléptico. Puede pararse de golpe. Si es refractaria, cambiar a fenobarbital (2,5-3 mg/kg BID) retirando la imepitoina en 3 semanas (reduciendo a la mitad cada 7 días); no asociar imepitoina con fenobarbital." },
      { nombre: "Primidona", principioActivoReal: "Primidona", categoria: "Anticonvulsivante", dosisMin: 15, dosisMax: 30, unidad: "mg/kg", via: "VO", frecuencia: "al día, dividido en 2-3 tomas", notas: "Alternativa al fenobarbital en perros que no responden; más hepatotóxica, requiere mejor control hepático. Ajustar posología según niveles séricos igual que con fenobarbital." }
    ]
  },
  {
    id: "miastenia-gravis-adquirida",
    nombre: "Miastenia gravis adquirida",
    indicacion: "Neurología",
    especies: ["perro", "gato"],
    notas: "Enfermedad autoinmune de la unión neuromuscular; hasta un 87,7% de los perros afectados entran en remisión espontánea (media 6,4 meses, rango 1-18 meses). Es esencial reconocer megaesófago/debilidad faríngea antes de iniciar tratamiento (riesgo de neumonía por aspiración). Contraindicados en estos pacientes: aminoglucósidos, ampicilina, antiarrítmicos, fenotiazinas, anestésicos, narcóticos y relajantes musculares (empeoran la transmisión neuromuscular). Diagnóstico: neostigmina 0,05 mg/kg IM (premedicar con atropina), o edrofonio; mejoría en 15-30 min. En gatos, a diferencia del perro, los corticoides pueden usarse como primera línea (no se ha descrito el empeoramiento de la debilidad muscular que sí ocurre en perros); vigilar el hipertiroidismo tratado con metimazol como posible causa de MG inducida por fármacos en gatos. Castrar/esterilizar a los animales afectados.",
    componentes: [
      { nombre: "Piridostigmina bromuro", principioActivoReal: "Piridostigmina", categoria: "Anticolinesterásico", dosisMin: 1, dosisMax: 3, unidad: "mg/kg", via: "VO", frecuencia: "cada 8-12 h", notas: "Ajustar según tolerancia individual y respuesta; usar en todos los grupos de gravedad." },
      { nombre: "Prednisona (perro)", principioActivoReal: "Prednisona", categoria: "Corticoide", dosisMin: 0.5, dosisMax: 0.5, unidad: "mg/kg", via: "VO", frecuencia: "cada 48 h", notas: "Dosis baja recomendada en MG focal/generalizada moderada (grupos 1-2). Contraindicado si hay neumonía por aspiración activa, diabetes, obesidad grave, hipertensión no controlada o úlceras GI. Combinar con azatioprina si el efecto tarda en aparecer (no usar azatioprina en gatos)." },
      { nombre: "Prednisolona (gato) — dosis inicial", principioActivoReal: "Prednisolona", categoria: "Corticoide", dosisMin: 0.25, dosisMax: 0.25, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h", notas: "Si no hay respuesta suficiente, aumentar lentamente hasta 1-3 mg/kg cada 8-12 h." }
    ]
  },
  {
    id: "epilepsia-convulsiones-gato",
    nombre: "Epilepsia / convulsiones (gato) — escalada terapéutica",
    indicacion: "Neurología",
    especies: ["gato"],
    notas: "Tratamiento de elección: fenobarbital. A diferencia del perro, en gatos que responden bien no suele ser necesario reajustar la dosis con el tiempo. Niveles séricos objetivo 10-30 µg/ml. El diazepam oral en gato se ha asociado a necrosis hepática aguda: si se usa, vigilar ALT a los 3-5 días; no es la primera opción. El bromuro potásico NO se usa en gatos (riesgo de broncoalveolitis/asma felino).",
    componentes: [
      { nombre: "Fenobarbital", principioActivoReal: "Fenobarbital", categoria: "Anticonvulsivante (barbitúrico)", dosisMin: 1, dosisMax: 2, unidad: "mg/kg", via: "VO", frecuencia: "cada 12 h", notas: "Primera línea (dosis según la fuente más reciente del protocolo interno, charla UCV nov. 2024). Algunos gatos requieren hasta 10-12 mg/kg/día repartidos en 2-3 tomas." },
      { nombre: "Levetiracetam", principioActivoReal: "Levetiracetam", categoria: "Anticonvulsivante", dosisMin: 10, dosisMax: 20, unidad: "mg/kg", via: "VO", frecuencia: "cada 8 h", notas: "Puede incrementarse según respuesta si no hay mejoría suficiente." },
      { nombre: "Zonisamida", principioActivoReal: "Zonisamida", categoria: "Anticonvulsivante", dosisMin: 5, dosisMax: 10, unidad: "mg/kg", via: "VO", frecuencia: "cada 12 h", notas: "" },
      { nombre: "Gabapentina", principioActivoReal: "Gabapentina", categoria: "Anticonvulsivante/analgésico", dosisMin: 5, dosisMax: 10, unidad: "mg/kg", via: "VO", frecuencia: "cada 8 h", notas: "" },
      { nombre: "Pregabalina", principioActivoReal: "Pregabalina", categoria: "Anticonvulsivante/analgésico", dosisMin: 2, dosisMax: 4, unidad: "mg/kg", via: "VO", frecuencia: "cada 12-8 h", notas: "" }
    ]
  },
  {
    id: "algoritmo-convulsiones-anicura",
    nombre: "Algoritmo convulsiones AniCura (perro y gato) — estatus epiléptico y crisis en cúmulo",
    indicacion: "Neurología",
    especies: ["perro", "gato"],
    notas: "Protocolo AniCura para estatus epiléptico y convulsiones en cúmulo (status epilepticus / cluster seizures) en crisis ACTIVAS. Aplicable a perro y gato salvo indicación contraria. Fuente: ALGORITMO CONVULSIONES PERROS Y GATOS ANICURA (protocolo interno). CONSIDERACIONES INICIALES: grabar en vídeo las crisis (clave para el diagnóstico posterior). Si el paciente llega ESTABLE: colocar catéter IV y hacer analítica antes de medicar. Si llega o empieza CONVULSIONANDO: iniciar el algoritmo desde el Paso 1 sin demora. Cuando las crisis cesen por completo, pasar a la analítica pos-convulsiva. REGLA DE ESCALADA TERAPÉUTICA: si las crisis continúan o recidivan en 10-60 min, AÑADIR el siguiente escalón SIN RETIRAR el anterior. Revertir cada escalón tras 4-6 h de efecto sostenido. Paso 6 — último recurso, no incluido como componente por ser anestesia inhalatoria (no calculable por peso): ISOFLURANO 0,5-4% en O2 durante un mínimo de 12 h. ANALÍTICA POS-CONVULSIVA OBLIGATORIA (si las crisis se detienen): hemograma completo (CBC); proteínas totales, albúmina, globulina; perfil hepático (ALT, ALKP, GGT, TBIL); perfil renal/metabólico (creatinina, BUN, fósforo, colesterol, glucosa); electrolitos (Na, K, Cl, Ca). Opcional: urianálisis (densidad + tira reactiva), proteína de fase aguda (CRP en perro, SAA en gato), SDMA en gatos >8 años, niveles séricos de fenobarbital y bromuro si el paciente no es naïve. CLASIFICACIÓN ETIOLÓGICA: RAMA 1 (causa reactiva identificada en analítica) — tratar la causa primaria: hipoglucemia (dextrosa IV), hipertermia (enfriamiento activo), hipocalcemia (gluconato cálcico IV), hiperamonemia (enema rectal / metronidazol IV), SDRA/ARDS con POCUS torácico (oxigenoterapia ± furosemida), manteniendo soporte hemodinámico y la terapia de contención según respuesta clínica — la fuente no especifica dosis mg/kg para estos tratamientos sintomáticos, usa la ficha de cada fármaco en la base de datos. RAMA 2 (causa NO reactiva) — mantenimiento con levetiracetam + fenobarbital (mismas dosis que el Paso 3 de este protocolo) y plan diagnóstico neurológico avanzado: examen neurológico completo con revisión de los vídeos grabados, resonancia magnética o TC, y punción de líquido cefalorraquídeo (LCR).",
    componentes: [
      { nombre: "Midazolam (Paso 1 — bolo)", principioActivoReal: "Midazolam", categoria: "Anticonvulsivante (benzodiazepina)", dosisMin: 0.2, dosisMax: 0.5, unidad: "mg/kg", via: "IV (o IN, solo en perros)", frecuencia: "bolo único; repetir hasta 2 veces si las crisis persisten", notas: "Primera línea de contención rápida en crisis activas. IN = vía intranasal, indicada únicamente en perros." },
      { nombre: "Midazolam (Paso 2 — 3er bolo + CRI)", principioActivoReal: "Midazolam", categoria: "Anticonvulsivante (benzodiazepina)", dosisMin: 0.2, dosisMax: 0.5, unidad: "mg/kg", via: "IV (o IN, solo en perros)", frecuencia: "3er bolo, si las crisis persisten tras el Paso 1", notas: "Seguir con infusión continua (CRI) de 0,2-0,5 mg/kg/h (calcúlala en la pestaña CRI). ⚠ NO usar Dormazolam® para la CRI. Revertir el escalón tras 4-6 h de efecto sostenido." },
      { nombre: "Levetiracetam (Paso 3 — pulse therapy)", principioActivoReal: "Levetiracetam", categoria: "Anticonvulsivante", dosisMin: 40, dosisMax: 40, unidad: "mg/kg", via: "IV", frecuencia: "1ª dosis en bolo", notas: "Continuar con 20 mg/kg cada 8 h, diluido 1:1 en NaCl 0,9%. Se añade SIEMPRE junto con fenobarbital en este escalón (control antiepiléptico de fondo), no en su lugar. Reevaluar respuesta clínica a las 4-6 h. Misma pauta que la terapia de mantenimiento de la Rama 2 (causa no reactiva)." },
      { nombre: "Fenobarbital (Paso 3)", principioActivoReal: "Fenobarbital", categoria: "Anticonvulsivante (barbitúrico)", dosisMin: 2.5, dosisMax: 5, unidad: "mg/kg", via: "IM, VO o IV", frecuencia: "cada 12 h", notas: "Se añade SIEMPRE junto con levetiracetam en este escalón, no en su lugar. Reevaluar respuesta clínica a las 4-6 h. Misma pauta que la terapia de mantenimiento de la Rama 2 (causa no reactiva)." },
      { nombre: "Ketamina (Paso 4)", principioActivoReal: "Ketamina", categoria: "Anestésico disociativo", dosisMin: 3, dosisMax: 5, unidad: "mg/kg", via: "IV", frecuencia: "bolo a efecto", notas: "Modulación de receptores NMDA. Seguir con CRI de 0,1-0,5 mg/kg/h (calcúlala en la pestaña CRI). Puede combinarse con dexmedetomidina en este escalón (y/o); si las crisis continúan, pasar al siguiente escalón." },
      { nombre: "Dexmedetomidina (Paso 4)", principioActivoReal: "Dexmedetomidina", categoria: "Sedante alfa-2 agonista", dosisMin: 0.5, dosisMax: 0.5, unidad: "mcg/kg", via: "IV", frecuencia: "bolo único", notas: "Modulación de receptores alfa-2. Seguir con CRI de 0,5-3 µg/kg/h (calcúlala en la pestaña CRI). Puede combinarse con ketamina en este escalón (y/o)." },
      { nombre: "Propofol (Paso 5)", principioActivoReal: "Propofol", categoria: "Anestésico general (IV)", dosisMin: 1, dosisMax: 6, unidad: "mg/kg", via: "IV", frecuencia: "bolo a efecto", notas: "Seguir con CRI de 0,1-0,6 mg/kg/min, mínimo 6 h (máximo 20-24 mg/kg/día) — calcúlala en la pestaña CRI. ⚠ NO usar propofol con alcohol bencílico para la CRI. Último recurso antes de la anestesia inhalatoria con isoflurano (Paso 6: 0,5-4% en O2, mínimo 12 h — no calculable aquí, requiere máquina de anestesia)." }
    ]
  },
  {
    id: "leishmaniosis-canina",
    nombre: "Leishmaniosis canina — leishmanicida + alopurinol",
    indicacion: "Infecto-parasitarias",
    especies: ["perro"],
    notas: "Protocolo de Xavier Roura (consulta personal, 2024): leishmanicida convencional 1 mes + alopurinol durante 1 año (parar cuando no haya signos clínicos y el proteinograma sea normal). Si hay inflamación/vasculitis, añadir prednisona los primeros 7-15 días. Si persiste úlcera por vasculopatía, se puede añadir pentoxifilina 2-4 meses (dosis no especificada en la fuente; consultar referencia adicional antes de pautarla). Existen dos pautas de Glucantime citadas en fuentes distintas: 75 mg/kg/día continuo 1 mes (si no responde, mantener 1 mes más) — o bien 100 mg/kg/día SC en pauta 20 días-10 descanso-10 días (AVEPA Sevilla 1997) + alopurinol 30 mg/kg/día 3 meses. Esterilizar a las hembras (recaídas asociadas a celo/gestación por estrés). Miltefosina (Milteforan) es una alternativa oral al Glucantime inyectable, sin dosis registrada en la fuente.",
    componentes: [
      { nombre: "Meglumina antimoniato (Glucantime)", principioActivoReal: "Meglumina antimoniato", categoria: "Antiparasitario (leishmanicida)", dosisMin: 75, dosisMax: 100, unidad: "mg/kg", via: "SC", frecuencia: "cada 24 h — ver en notas las dos pautas de duración citadas en la fuente", notas: "Leishmanicida de primera línea. Combinar siempre con alopurinol." },
      { nombre: "Alopurinol (Zyloric)", principioActivoReal: "Alopurinol", categoria: "Antiparasitario (leishmaniosis)", dosisMin: 20, dosisMax: 30, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h, mínimo 6 meses (Roura recomienda hasta 1 año)", notas: "Los animales tratados dejan de ser infectantes mientras sigan con alopurinol." },
      { nombre: "Prednisona", principioActivoReal: "Prednisona", categoria: "Corticoide", dosisMin: 0.7, dosisMax: 0.7, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h, primeros 7-15 días", notas: "Solo si hay inflamación/vasculitis asociada (protocolo Roura)." }
    ]
  },
  {
    id: "pif-felino",
    nombre: "PIF (Peritonitis Infecciosa Felina) — antiviral GS-441524",
    indicacion: "Infecto-parasitarias (antiviral, gato)",
    especies: ["gato"],
    notas: "AVISO LEGAL: el GS-441524 (metabolito activo del remdesivir) no está autorizado en España; el veterinario no puede suministrarlo ni inyectarlo — solo informar, y es el tutor quien lo compra (online) y administra bajo supervisión veterinaria. Duración: 84 días ininterrumpidos, pesando semanalmente para reajustar dosis. Dosis inicial según forma clínica (ver componentes); si en 5-6 días no hay mejoría a la dosis mínima, subir a la siguiente. Aumentos siempre en tramos de 2-5 mg/kg, nunca reducir la dosis. Controles en semanas 4, 8 y 12 (clínica + analítica ± ecografía/radiografía). Recaída: reiniciar inyectable subiendo 3-5 mg/kg sobre la dosis final, de nuevo 84 días. Comprimidos: requieren ~50% más dosis (inicio directo) o el doble (si se cambia desde inyectable). No dar protector gástrico. Añadir protector hepático durante todo el tratamiento. Evitar fluoroquinolonas, lisina y refuerzos inmunológicos (vacunas/interferones) durante el tratamiento. Descartar antes FIV/FeLV y otras causas (mycoplasma, toxoplasma, cardiopatías, hepatopatías, pancreatitis, tumores). Fuentes: PIF Warriors, Mutian Global, Curefip.",
    componentes: [
      { nombre: "GS-441524", principioActivoReal: "GS-441524", categoria: "Antiviral (uso no autorizado en España)", dosisMin: 8, dosisMax: 15, unidad: "mg/kg", via: "SC u oral", frecuencia: "cada 24 h (bid si forma neurológica), 84 días", notas: "Por forma clínica: húmeda 8-10 mg/kg, seca/efusiva abdominal 10-12 mg/kg, ocular sin sig. neurológicos 15 mg/kg, neurológica 10-15 mg/kg cada 12 h." }
    ]
  },
  {
    id: "felv-felino",
    nombre: "FeLV (Leucemia felina) — antiviral raltegravir",
    indicacion: "Infecto-parasitarias (antiviral, gato)",
    especies: ["gato"],
    notas: "Reduce la carga viral en 15 días, pero la viremia no desaparece; no funciona para FIV. Tratamiento de por vida — si se retira, el virus vuelve a aumentar. Alternativa con menos evidencia: interferón alfa humano 30 UI SC, en semanas alternas (solo en gatos ya enfermos) o virbagen (1 ampolla + 25 ml SSF: 0,25 ml/gato VO cada 24 h). En gatos asintomáticos no hay consenso sobre tratar con antivirales ni interferón; evitar que salgan a la calle y, si conviven con otros gatos, alojarlos separados de los no infectados (a diferencia del VIF, el FeLV sí se transmite fácilmente entre convivientes).",
    componentes: [
      { nombre: "Raltegravir", principioActivoReal: "Raltegravir", categoria: "Antiviral", dosisMin: 20, dosisMax: 40, unidad: "mg/kg", via: "VO", frecuencia: "40 mg/kg cada 24 h o 20 mg/kg cada 12 h", notas: "Tratamiento indefinido mientras se mantenga la respuesta." }
    ]
  },
  {
    id: "herpesvirus-felino",
    nombre: "Herpesvirus felino — antiviral famciclovir",
    indicacion: "Infecto-parasitarias (antiviral, gato)",
    especies: ["gato"],
    notas: "El herpesvirus felino queda siempre como portador asintomático y se reactiva con el estrés; tropismo especial por la córnea, también produce dermatitis facial ulcerativa. El diagnóstico por PCR es muy sensible pero poco específico (los portadores dan positivo estén o no enfermos): la mejor confirmación es la respuesta clínica al famciclovir. Tratamiento tópico ocular complementario: virgan colirio/pomada, oftalmolosa cusi aureomicina, optimune, lubricante ocular. Si hay alteraciones inmunitarias asociadas, puede requerir corticoides.",
    componentes: [
      { nombre: "Famciclovir", principioActivoReal: "Famciclovir", categoria: "Antiviral", dosisMin: 40, dosisMax: 90, unidad: "mg/kg", via: "VO", frecuencia: "cada 8-12 h (casos agudos: 90 mg/kg cada 8 h)", notas: "Casos leves/crónicos: 40-90 mg/kg cada 8-12 h hasta 7-10 días tras la curación. Casos agudos: 90 mg/kg cada 8 h." }
    ]
  },
  {
    id: "insulinoma-manejo-medico",
    nombre: "Insulinoma — manejo médico de la hipoglucemia",
    indicacion: "Aparato digestivo / endocrinología",
    especies: ["perro", "gato"],
    notas: "Diagnóstico presuntivo: glucosa en ayunas < 40-50 mg/dl + insulina > 20 µU/ml (o normal en ~25% de los casos) + desaparición de síntomas tras glucosa. Crisis hipoglucémica aguda: en casa, untar miel en encías; en clínica, bolo de glucosa al 50% y mantener con glucosado al 2,5-5%. El tratamiento quirúrgico (resección del tumor, tolera extirpar 75-90% del páncreas) es el definitivo; el manejo médico es para casos no operables o hipoglucemia crónica.",
    componentes: [
      { nombre: "Dexametasona", principioActivoReal: "Dexametasona", categoria: "Corticoide", dosisMin: 0.5, dosisMax: 1, unidad: "mg/kg", via: "IV (en el suero)", frecuencia: "durante 6 h", notas: "Añadir al gotero si la crisis hipoglucémica aguda no responde solo a glucosa." },
      { nombre: "Prednisona (hipoglucemia crónica)", principioActivoReal: "Prednisona", categoria: "Corticoide", dosisMin: 0.5, dosisMax: 6, unidad: "mg/kg", via: "VO", frecuencia: "dividida en 2 tomas, incrementando según necesidad", notas: "Iniciar a 0,5 mg/kg y subir progresivamente sin superar 4-6 mg/kg." },
      { nombre: "Diazóxido (Proglycem)", principioActivoReal: "Diazóxido", categoria: "Hiperglucemiante", dosisMin: 10, dosisMax: 60, unidad: "mg/kg", via: "VO", frecuencia: "dividido en 2 tomas/día, con comida", notas: "Combinar con corticoides o usar si estos no funcionan. Iniciar a 10 mg/kg y subir según necesidad sin superar 60 mg/kg/día. Efectos 2os digestivos (mejoran dividiendo la dosis), anemia, diarrea, taquicardia, trombocitopenia, pancreatitis, diabetes mellitus." },
      { nombre: "Somatostatina", principioActivoReal: "Somatostatina", categoria: "Hormona (análogo)", dosisMin: 10, dosisMax: 40, unidad: "mcg/kg", via: "SC", frecuencia: "2-3 veces al día", notas: "La fuente no especifica con total claridad si es por kg o dosis total; se ha interpretado como mcg/kg por ser lo habitual en la bibliografía para análogos de somatostatina. Verificar antes de usar en pacientes muy pequeños o muy grandes. Sin efectos secundarios descritos en la fuente." }
    ]
  },
  {
    id: "lipidosis-hepatica-felina",
    nombre: "Lipidosis hepática felina",
    indicacion: "Aparato digestivo",
    especies: ["gato"],
    notas: "Curan entre el 50-65% de los casos. No usar productos glucosados en fluidoterapia hasta que el gato coma. No usar anabolizantes ni corticoides. Dieta Feline C/D o P/D con alimentación forzada (sonda) 4 veces/día durante 3 meses. La lactulosa (ver componente) y el metronidazol 7,5 mg/kg 2-3 veces/día son solo si hay encefalopatía hepática asociada (también puede usarse la lactulosa en enema si hay vómitos). Suplementos a dosis fija (no calculables por peso en esta app — consultar la dosis total antes de administrar): tiamina/vitamina B1 50-100 mg totales cada 12 h VO/SC/IM (su déficit produce midriasis, ceguera, ventroflexión de cabeza, ataxia y estupor); vitamina E 100-400 UI totales cada 24 h VO.",
    componentes: [
      { nombre: "Ácido ursodesoxicólico", principioActivoReal: "Ácido ursodesoxicólico", categoria: "Hepatoprotector (colerético)", dosisMin: 15, dosisMax: 15, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h", notas: "Aumenta el flujo biliar." },
      { nombre: "Lactulosa (solo si hay encefalopatía hepática)", principioActivoReal: "Lactulosa", categoria: "Laxante osmótico", dosisMin: 74, dosisMax: 74, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h, repartido en 2-3 tomas", notas: "Equivale a 0,5 ml/4,5 kg/día del jarabe estándar de lactulosa 667 mg/ml (Duphalac). También puede darse en enema tibio si hay vómitos." }
    ]
  },
  {
    id: "insuficiencia-pancreatica-exocrina",
    nombre: "Insuficiencia pancreática exocrina (EPI)",
    indicacion: "Aparato digestivo",
    especies: ["perro", "gato"],
    notas: "Diagnóstico por TLI (no por análisis de heces): <2,5 µg/ml indica EPI en perro (<8 en gato); entre 2,5-5 (perro) o 0-17 (gato) repetir la prueba asegurando ayuno correcto. Enzimas pancreáticos exógenos (Kreon/Lypex) con la comida, en 2 tomas/día: perros/gatos <10 kg, 0,5 cápsula/comida; perros >10 kg, 1 cápsula/comida — ir reduciendo hasta la dosis mínima eficaz. Si no responde: descartar SIBO concurrente (típico en Pastor Alemán, hasta 80% de los casos) y valorar antiácidos H2 si hay hiperacidez que inactiva la lipasa. Cianocobalamina (vitamina B12) a dosis fija (no calculable por peso en esta app): gato 0,25-0,5 mg SC cada 3 semanas; perro 1 mg SC una vez al mes; medir cobalamina sérica cada 2-3 meses y espaciar a cada 3 meses cuando se corrija.",
    componentes: [
      { nombre: "Prednisolona/prednisona (si coexiste enteritis)", principioActivoReal: "Prednisolona", categoria: "Corticoide", dosisMin: 1, dosisMax: 2, unidad: "mg/kg", via: "VO", frecuencia: "cada 12 h, 7-14 días", notas: "Solo si coexiste una enteritis linfocito-plasmocitaria confirmada." },
      { nombre: "Oxitetraciclina (si SIBO concurrente)", principioActivoReal: "Oxitetraciclina", categoria: "Antibiótico (tetraciclina)", dosisMin: 20, dosisMax: 20, unidad: "mg/kg", via: "VO", frecuencia: "cada 12 h, 6 semanas (o TID 28 días si SIBO puro)", notas: "Alternativa: metronidazol 20 mg/kg cada 24 h, 6 semanas." }
    ]
  },
  {
    id: "ibd-perro",
    nombre: "Enfermedad inflamatoria intestinal (perro) — escalada terapéutica",
    indicacion: "Aparato digestivo",
    especies: ["perro"],
    notas: "Empezar siempre por dieta y descartar parásitos (fenbendazol empírico) antes de inmunosupresión. Prednisona/prednisolona: pauta descendente 2 mg/kg/día 5 días → 1 mg/kg BID 6 días → 0,5 mg/kg BID 6 días → mantenimiento 0,5 mg/kg/día. Azatioprina se añade si no hay respuesta a corticoides (evaluar respuesta en 3-4 días); NO usar en gatos. Metronidazol combinado con corticoides o sulfasalazina, solo a corto-medio plazo (el enterocito se acostumbra). Azulfidina/olsalazina solo si hay evidencia histológica de afectación de intestino grueso. Cobalamina (vitamina B12) a dosis fija (no calculable por peso en esta app): 250-1500 microgramos totales/perro SC cada 7 días durante 8 semanas, luego mensual 4 veces.",
    componentes: [
      { nombre: "Prednisona/prednisolona", principioActivoReal: "Prednisolona", categoria: "Corticoide", dosisMin: 0.5, dosisMax: 2, unidad: "mg/kg", via: "VO", frecuencia: "ver pauta descendente en notas del protocolo", notas: "2 mg/kg/día 5 días → 1 mg/kg BID 6 días → 0,5 mg/kg BID 6 días → mantenimiento 0,5 mg/kg/día." },
      { nombre: "Azatioprina", principioActivoReal: "Azatioprina", categoria: "Inmunosupresor", dosisMin: 2, dosisMax: 2, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h 2 semanas, luego cada 48 h", notas: "Si no hay respuesta a corticoides solos. NO USAR EN GATOS." },
      { nombre: "Metronidazol", principioActivoReal: "Metronidazol", categoria: "Antibiótico/Antiprotozoario", dosisMin: 10, dosisMax: 20, unidad: "mg/kg", via: "VO", frecuencia: "cada 12 h", notas: "Combinado con corticoides o sulfasalazina; solo a corto-medio plazo." },
      { nombre: "Sulfasalazina (Azulfidina)", principioActivoReal: "Sulfasalazina", categoria: "Antiinflamatorio intestinal", dosisMin: 25, dosisMax: 50, unidad: "mg/kg", via: "VO", frecuencia: "cada 8-24 h, 3-6 semanas", notas: "Solo perro. Usar solo si hay evidencia histológica de afectación de intestino grueso." }
    ]
  },
  {
    id: "ibd-gato",
    nombre: "Enfermedad inflamatoria intestinal (gato) — protocolo Clínica Gattos",
    indicacion: "Aparato digestivo",
    especies: ["gato"],
    notas: "1) Dieta novel (mejor que hipoalergénica). 2) Metronidazol 2 semanas; si hay remisión, bajar dosis 25% cada 2 semanas hasta la mínima eficaz o retirar. 3) Prednisolona en gatos que no responden a antibiótico+dieta o enfermedad severa; misma pauta de reducción del 25%/2 semanas. 4) Si no responde, reevaluar (ecografía, ácido fólico, cobalamina) y añadir inmunosupresor: clorambucilo a dosis fija (no calculable por peso en esta app) de 2 mg totales/gato cada 72 h, o 20 mg/m² cada 14 días — fármaco citotóxico, manipular con guantes — o ciclosporina (ver componente). 5) Si responde, bajar todas las medicaciones un 25% cada 2 semanas hasta la dosis mínima eficaz o retirar.",
    componentes: [
      { nombre: "Metronidazol", principioActivoReal: "Metronidazol", categoria: "Antibiótico/Antiprotozoario", dosisMin: 10, dosisMax: 20, unidad: "mg/kg", via: "VO", frecuencia: "cada 12 h, 2 semanas", notas: "Washabau 2009. Alternativa citada: 62,5 mg totales/gato una vez al día (Gaschen 2006)." },
      { nombre: "Prednisolona", principioActivoReal: "Prednisolona", categoria: "Corticoide", dosisMin: 2, dosisMax: 2, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h, 2 semanas, luego reducir 25%/2 semanas", notas: "En gatos que no responden a antibiótico+dieta o con enfermedad muy severa." },
      { nombre: "Ciclosporina", principioActivoReal: "Ciclosporina", categoria: "Inmunosupresor", dosisMin: 5, dosisMax: 5, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h, 21 días", notas: "" }
    ]
  },
  {
    id: "sibo",
    nombre: "Sobrecrecimiento bacteriano intestinal (SIBO)",
    indicacion: "Aparato digestivo",
    especies: ["perro", "gato"],
    notas: "Tratar durante 4 semanas aunque haya remisión clínica precoz. En gatos con diarrea crónica y presupuesto limitado: tilosina en polvo mezclada con el alimento a largo plazo. Alternativa combinada (Melgarejo): oxitetraciclina + metronidazol, retirando el metronidazol a los 10 días y continuando con oxitetraciclina hasta 4 semanas.",
    componentes: [
      { nombre: "Oxitetraciclina", principioActivoReal: "Oxitetraciclina", categoria: "Antibiótico (tetraciclina)", dosisMin: 20, dosisMax: 20, unidad: "mg/kg", via: "VO", frecuencia: "cada 12 h, 10 días (no tetraciclina simple)", notas: "Alternativas: metronidazol 20 mg/kg cada 24 h, o tilosina 15 mg/kg cada 12 h." },
      { nombre: "Cobalamina (vitamina B12)", principioActivoReal: "Cianocobalamina", categoria: "Vitamina", dosisMin: 50, dosisMax: 50, unidad: "mcg/kg", via: "SC (o VO)", frecuencia: "SC: 1 vez/semana 6 semanas, luego mensual; VO: cada 24 h", notas: "Por vía oral, hasta 300 µg totales en perros grandes (sin riesgo de sobredosis por esta vía, según la fuente)." }
    ]
  },
  {
    id: "hepatopatia-cronica-perro",
    nombre: "Hepatitis crónica / cirrosis hepática (perro)",
    indicacion: "Aparato digestivo",
    especies: ["perro"],
    notas: "Hacer siempre biopsias múltiples (baja correlación citología-biopsia). Protocolo Xavier Roura (2020) fase inicial: hepatoprotector + ácido ursodesoxicólico 15 mg/kg/día + prednisona 0,5-0,7 mg/kg/día. Fase avanzada: añadir espironolactona 2-4 mg/kg BID + antieméticos + dieta baja en proteína. Si hay hepatotoxicosis por cobre confirmada: D-penicilamina (o trientina si produce vómitos/diarrea) + zinc al final del tratamiento previo. Si aparece úlcera gástrica, usar famotidina (no cimetidina).",
    componentes: [
      { nombre: "Ácido ursodesoxicólico", principioActivoReal: "Ácido ursodesoxicólico", categoria: "Hepatoprotector (colerético)", dosisMin: 10, dosisMax: 15, unidad: "mg/kg", via: "VO", frecuencia: "cada 12 h", notas: "" },
      { nombre: "Prednisolona (no prednisona)", principioActivoReal: "Prednisolona", categoria: "Corticoide", dosisMin: 0.5, dosisMax: 2, unidad: "mg/kg", via: "VO", frecuencia: "hasta remisión clínica, luego reducir a días alternos", notas: "Usar solo si no responde a tratamiento de apoyo. Vigilar úlceras, sangrado intestinal y retención de sodio (empeora la ascitis)." },
      { nombre: "Azatioprina", principioActivoReal: "Azatioprina", categoria: "Inmunosupresor", dosisMin: 1, dosisMax: 2, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h", notas: "Si la prednisolona sola no es eficaz o da muchos efectos secundarios; se puede combinar con prednisolona a dosis bajas." },
      { nombre: "Colchicina", principioActivoReal: "Colchicina", categoria: "Antifibrótico", dosisMin: 0.025, dosisMax: 0.03, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h", notas: "Produce vómitos y diarrea." },
      { nombre: "Espironolactona (fase avanzada)", principioActivoReal: "Espironolactona", categoria: "Diurético ahorrador de potasio", dosisMin: 2, dosisMax: 4, unidad: "mg/kg", via: "VO", frecuencia: "cada 12 h", notas: "Fase avanzada, junto con antieméticos y dieta baja en proteína." },
      { nombre: "D-penicilamina (hepatotoxicosis por cobre)", principioActivoReal: "D-penicilamina", categoria: "Quelante del cobre", dosisMin: 10, dosisMax: 15, unidad: "mg/kg", via: "VO", frecuencia: "cada 12 h", notas: "Si produce vómitos/diarrea, sustituir por trientina 10-15 mg/kg BID. Poco eficaz y con efectos secundarios." }
    ]
  },
  {
    id: "colangitis-felina",
    nombre: "Colangitis felina",
    indicacion: "Aparato digestivo",
    especies: ["gato"],
    notas: "Forma neutrofílica (aguda supurativa o crónica no supurativa/mixta): antibiótico + hepatoprotector + ácido ursodesoxicólico. Forma linfocítica (colangitis-hepatitis portal linfocítica): prednisolona + hepatoprotector + ácido ursodesoxicólico, sin antibiótico.",
    componentes: [
      { nombre: "Amoxicilina/Ácido clavulánico (forma neutrofílica)", principioActivoReal: "Amoxicilina/Ácido clavulánico", categoria: "Antibiótico (betalactámico)", dosisMin: 12.5, dosisMax: 25, unidad: "mg/kg", via: "VO", frecuencia: "cada 12 h", notas: "Alternativas citadas: quinolonas, doxiciclina o metronidazol." },
      { nombre: "Ácido ursodesoxicólico", principioActivoReal: "Ácido ursodesoxicólico", categoria: "Hepatoprotector (colerético)", dosisMin: 10, dosisMax: 15, unidad: "mg/kg", via: "VO", frecuencia: "cada 12-24 h", notas: "Junto con hepatoprotector (hepatosil/similar) en ambas formas." },
      { nombre: "Prednisolona (forma linfocítica)", principioActivoReal: "Prednisolona", categoria: "Corticoide", dosisMin: 1, dosisMax: 2, unidad: "mg/kg", via: "VO", frecuencia: "cada 12-24 h", notas: "Solo en la forma linfocítica (colangitis-hepatitis portal linfocítica); sin antibiótico." }
    ]
  },
  {
    id: "vomito-antiemeticos",
    nombre: "Vómito — antieméticos según mecanismo",
    indicacion: "Aparato digestivo",
    especies: ["perro", "gato"],
    notas: "Elegir según causa/mecanismo, no todos a la vez. Antagonistas D2 dopaminérgicos (metoclopramida): poco efectivos en gatos (receptores distintos); indicados en uremia, pancreatitis aguda y problemas de vaciado gástrico — la domperidona es más efectiva. Antagonistas alfa-2/fenotiazinas: de elección en perro y gato, también en parvovirosis; vigilar sedación e hipotensión en deshidratados. Antihistamínicos H1: para vómito por mareo, más eficaces en perro que en gato. Antagonistas 5-HT3 (ondansetrón): para vómito asociado a quimioterapia. Agonistas 5-HT4 (cisaprida): aumentan la motilidad GI, útiles en vaciado gástrico, reflujo, íleo postoperatorio y megacolon.",
    componentes: [
      { nombre: "Metoclopramida", principioActivoReal: "Metoclopramida", categoria: "Antiemético (antagonista D2)", dosisMin: 0.2, dosisMax: 0.4, unidad: "mg/kg", via: "VO/SC/IM", frecuencia: "cada 6 h (qid); o 1-2 mg/kg/día en infusión IV continua", notas: "Poco efectiva en gatos." },
      { nombre: "Domperidona", principioActivoReal: "Domperidona", categoria: "Antiemético/procinético", dosisMin: 0.1, dosisMax: 0.3, unidad: "mg/kg", via: "IM/IV", frecuencia: "cada 12 h", notas: "Más efectiva que metoclopramida, especialmente en gato." },
      { nombre: "Difenhidramina", principioActivoReal: "Difenhidramina", categoria: "Antihistamínico (H1)", dosisMin: 2, dosisMax: 4, unidad: "mg/kg", via: "VO/IM", frecuencia: "cada 8 h (tid)", notas: "Para vómito asociado a mareo/cinetosis. Más eficaz en perro que en gato." },
      { nombre: "Ondansetrón", principioActivoReal: "Ondansetrón", categoria: "Antiemético (antagonista 5-HT3)", dosisMin: 0.5, dosisMax: 1, unidad: "mg/kg", via: "VO", frecuencia: "cada 12-24 h, o 30 min antes de la quimioterapia", notas: "Para vómito asociado a quimioterapia." },
      { nombre: "Cisaprida", principioActivoReal: "Cisaprida", categoria: "Procinético (agonista 5-HT4)", dosisMin: 0.1, dosisMax: 0.5, unidad: "mg/kg", via: "VO", frecuencia: "cada 8 h (tid)", notas: "Para vaciamiento gástrico, reflujo gastroesofágico, íleo postoperatorio y megacolon." }
    ]
  },
  {
    id: "incontinencia-urinaria-esfinter",
    nombre: "Incontinencia urinaria por incompetencia del esfínter",
    indicacion: "Aparato urinario",
    especies: ["perro", "gato"],
    notas: "Típica tras ovariohisterectomía o cirugía de uréter ectópico (25-50% de los operados pueden seguir incontinentes). Alternativas a dosis fija no incluidas aquí: estriol 0,5-2 mg/perro cada 24 h 5-7 días y luego días alternos (sensibiliza el esfínter, puede combinarse con fenilpropanolamina); imipramina 5-20 mg/perro BID (cita alternativa a la dosis por kg). Suprelorin (deslorelina) es una opción en pacientes en los que van mal los alfa-adrenérgicos (hipertensos, nerviosos), con ~50% de éxito.",
    componentes: [
      { nombre: "Fenilpropanolamina", principioActivoReal: "Fenilpropanolamina", categoria: "Agonista alfa-adrenérgico", dosisMin: 1.5, dosisMax: 2, unidad: "mg/kg", via: "VO", frecuencia: "perro: cada 8-12 h; gato: cada 8 h", notas: "Primera línea en ambas especies." },
      { nombre: "Efedrina", principioActivoReal: "Efedrina", categoria: "Agonista alfa-adrenérgico", dosisMin: 0.4, dosisMax: 4, unidad: "mg/kg", via: "VO", frecuencia: "cada 12-8 h", notas: "Solo perro. Empezar a 0,4 mg/kg e ir subiendo gradualmente hasta 4 mg/kg." },
      { nombre: "Imipramina", principioActivoReal: "Imipramina", categoria: "Antidepresivo tricíclico", dosisMin: 2, dosisMax: 4, unidad: "mg/kg", via: "VO", frecuencia: "cada 24-12 h", notas: "Uso menos frecuente." },
      { nombre: "Oxibutinina", principioActivoReal: "Oxibutinina", categoria: "Anticolinérgico", dosisMin: 0.2, dosisMax: 0.2, unidad: "mg/kg", via: "VO", frecuencia: "cada 12 h", notas: "La fuente no especifica especie; extrapolar con precaución en gato." },
      { nombre: "Flavoxato", principioActivoReal: "Flavoxato", categoria: "Antiespasmódico urinario", dosisMin: 10, dosisMax: 10, unidad: "mg/kg", via: "VO", frecuencia: "cada 12 h", notas: "Puede combinarse con fenilpropanolamina o estriol. La fuente no especifica especie." }
    ]
  },
  {
    id: "urolitiasis-urato",
    nombre: "Urolitiasis por urato amónico (dálmata y otras razas)",
    indicacion: "Aparato urinario",
    especies: ["perro"],
    notas: "Junto con dieta baja en purinas y no acidificante (Hill's u/d). Objetivo: pH urinario 7,1-7,7 (si sube de 8, riesgo de urolitos de fosfato cálcico). Mantener el tratamiento un mes tras la desaparición radiológica de los urolitos. En cristaluria de urato en dálmatas sin urolitos: dosis inicial 10 mg/kg dividida en 2 tomas, ajustando según excreción de urato en orina (objetivo 300±25 mg/24h), revisando cada 2-3 semanas y luego una vez al año — tratamiento de por vida.",
    componentes: [
      { nombre: "Alopurinol", principioActivoReal: "Alopurinol", categoria: "Inhibidor de la xantina oxidasa", dosisMin: 10, dosisMax: 30, unidad: "mg/kg", via: "VO", frecuencia: "dividido en 2-3 tomas/día", notas: "30 mg/kg/día para disolución activa; dosis de mantenimiento/prevención más baja, 10 mg/kg/día. Evitar uso excesivo con dietas altas en proteína (riesgo de urolitos de xantina)." }
    ]
  },
  {
    id: "urolitiasis-cistina",
    nombre: "Urolitiasis por cistina",
    indicacion: "Aparato urinario",
    especies: ["perro"],
    notas: "Junto con dieta Hill's u/d (baja en proteína/metionina). Ligada al cromosoma Y (solo machos); más frecuente en Teckel y Bulldog inglés. Mantener el tratamiento un mes tras la desaparición radiológica de los urolitos. La D-penicilamina puede dar vómitos/náuseas.",
    componentes: [
      { nombre: "D-penicilamina", principioActivoReal: "D-penicilamina", categoria: "Quelante (fármaco con tiol)", dosisMin: 30, dosisMax: 30, unidad: "mg/kg", via: "VO", frecuencia: "dividida en varias tomas/día", notas: "Alternativa con menos efectos digestivos: tiopronina, misma dosis." },
      { nombre: "Citrato potásico", principioActivoReal: "Citrato potásico", categoria: "Alcalinizante urinario", dosisMin: 50, dosisMax: 100, unidad: "mg/kg", via: "VO", frecuencia: "dividido en el día", notas: "Si es necesario eliminar la aciduria; objetivo pH ~7,5." }
    ]
  },
  {
    id: "erc-manejo",
    nombre: "Enfermedad renal crónica — proteinuria, hipertensión, anemia y apetito",
    indicacion: "Aparato urinario",
    especies: ["perro", "gato"],
    notas: "La dieta renal es, si solo se pudiera elegir un tratamiento, el más importante (duplica la esperanza de vida junto con el IECA). IECA (benazepril/Fortekor — ver ficha de Benazepril) indicado si UPC > 0,4 (gato) o > 0,5 (perro), o UPC > 2 en estadio IRIS I. Hipertensión: en perro, bajar sodio en dieta + IECA (se puede doblar la dosis en algunos casos) ± amlodipino si la TA es muy alta; en gato, empezar directamente con amlodipino (ver ficha de Amlodipino) y añadir IECA si hay proteinuria — objetivo TA <160 mmHg (mejor <150), evitar Fortekor solo para la hipertensión (no funciona). Atenolol en gato es a dosis FIJA (no calculable por peso en esta app): 6,25-12,5 mg totales/gato cada 12-24 h, si no responde al amlodipino. Hipopotasemia (K<3,5 mEq/l): si estable, gluconato potásico 2-6 mEq/gato/día VO (alternativa al citrato potásico del componente). Anemia: tratar si Hto<20 (perro >30-35%, gato >30% objetivo); Epo puede producir hipertensión y anticuerpos anti-eritropoyetina.",
    componentes: [
      { nombre: "Atenolol (perro)", principioActivoReal: "Atenolol", categoria: "Betabloqueante", dosisMin: 0.25, dosisMax: 1, unidad: "mg/kg", via: "VO", frecuencia: "cada 12-24 h", notas: "Solo perro (en gato la dosis es fija, ver notas del protocolo). Si no responde junto con amlodipino." },
      { nombre: "Mirtazapina (estimulante del apetito)", principioActivoReal: "Mirtazapina", categoria: "Estimulante del apetito/antiemético", dosisMin: 1.88, dosisMax: 1.88, unidad: "mg/kg", via: "VO", frecuencia: "cada 48-72 h, 3 semanas", notas: "Empezar con 1/8 de comprimido en pacientes pequeños y 1/4 en grandes. También funciona como antiemético." },
      { nombre: "Eritropoyetina humana", principioActivoReal: "Eritropoyetina", categoria: "Estimulante de la eritropoyesis", dosisMin: 50, dosisMax: 100, unidad: "UI/kg", via: "SC/IV", frecuencia: "3-4 veces por semana", notas: "Hasta Hto >30-35% en perro, >30% en gato; luego reducir 25% cada 2-6 semanas. Añadir hierro (dextrano 50 mg/kg/3 semanas en gato). Puede producir hipertensión y anticuerpos anti-eritropoyetina." },
      { nombre: "Hidróxido de aluminio (quelante de fósforo)", principioActivoReal: "Hidróxido de aluminio", categoria: "Quelante del fósforo", dosisMin: 30, dosisMax: 90, unidad: "mg/kg", via: "VO", frecuencia: "cada 12 h, con la comida", notas: "Si no toleran la dieta renal o se quiere bajar el fósforo más rápido. Dar con la comida o inmediatamente después; no mezclar con otras medicaciones." },
      { nombre: "Citrato potásico (hipopotasemia/acidosis)", principioActivoReal: "Citrato potásico", categoria: "Alcalinizante urinario", dosisMin: 40, dosisMax: 60, unidad: "mg/kg", via: "VO", frecuencia: "dividido en 2-3 tomas/día", notas: "Para hipopotasemia estable o acidosis metabólica leve (bicarbonato <18 mmol/l perro, <16 gato)." }
    ]
  },
  {
    id: "ira-oliguria",
    nombre: "Insuficiencia renal aguda oligúrica — manejo de la diuresis",
    indicacion: "Aparato urinario",
    especies: ["perro", "gato"],
    notas: "Primero corregir la deshidratación con fluidoterapia (reponer en 6-8 h). Si tras estimar 3-5% de deshidratación sigue sin orinar, escalar: furosemida (ver componente) ± dopamina 2-5 mcg/kg/min en infusión continua (diluir 30 mg en 500 ml de fisiológico → 60 mcg/ml). Si la furosemida no funciona, manitol; si tampoco, diltiazem. Monitorizar ECG, PANI y FC durante estos tratamientos. Si hay infección, ampicilina 11 mg/kg IV cada 8 h hasta tener el cultivo. Suspender siempre los fármacos nefrotóxicos (AINEs, aminoglucósidos) y los IECAs durante el episodio agudo.",
    componentes: [
      { nombre: "Furosemida", principioActivoReal: "Furosemida", categoria: "Diurético de asa", dosisMin: 2, dosisMax: 6, unidad: "mg/kg", via: "IV", frecuencia: "dosis de prueba 2 mg/kg; doblar/triplicar si no hay respuesta en 60 min; si fracasa, 1 mg/kg cada hora", notas: "Provoca arritmias: controlar ECG. Si fracasa del todo, diálisis peritoneal." },
      { nombre: "Manitol", principioActivoReal: "Manitol", categoria: "Diurético osmótico", dosisMin: 250, dosisMax: 500, unidad: "mg/kg", via: "IV lento (3-5 min)", frecuencia: "dosis única; debe verse diuresis en 20-30 min", notas: "Equivale a 0,25-0,5 g/kg. Si funciona, mantenimiento en infusión 2-5 ml/min de solución al 5-10%. Si no hay respuesta, no repetir. No usar en insuficiencia cardíaca congestiva." },
      { nombre: "Diltiazem", principioActivoReal: "Diltiazem", categoria: "Antagonista del calcio", dosisMin: 0.3, dosisMax: 0.5, unidad: "mg/kg", via: "IV (bolo lento, 10 min)", frecuencia: "dosis única, seguido de perfusión continua 3-5 mcg/kg/min", notas: "Si furosemida y manitol no funcionan. Monitorizar PANI y FC." }
    ]
  },
  {
    id: "cistitis-intersticial-felina",
    nombre: "Cistitis intersticial felina (FIC) — antiespasmódicos y analgesia",
    indicacion: "Aparato urinario",
    especies: ["gato"],
    notas: "Tabla de tratamientos de las Jornadas AVEPA 2013 (formación continuada). Fomentar comida húmeda, más bebederos y enriquecimiento ambiental (feliway, rascadores, sitios elevados) — es tan importante como la medicación. NO usar corticoides (la prednisolona aumenta el riesgo de infección sin reducir la inflamación urinaria). Dosis fijas citadas no incluidas como componente (no calculables por peso en esta app): N-acetilglucosamina 125 mg/gato cada 24 h VO (terapia adyuvante en casos crónicos refractarios); prazosin 0,25-1 mg/gato cada 8-12 h VO (antiespasmódico de músculo liso); amitriptilina 2,5-10 mg/gato VO por la noche.",
    componentes: [
      { nombre: "Fenoxibenzamina", principioActivoReal: "Fenoxibenzamina", categoria: "Antiespasmódico (músculo liso)", dosisMin: 0.5, dosisMax: 1, unidad: "mg/kg", via: "VO", frecuencia: "cada 12 h, 5 días", notas: "También usada tras desobstrucción uretral para el espasmo del esfínter (2,5 mg/gato cada 8-12 h en ese contexto); puede provocar hipotensión, usar solo tras resolver la uremia postrenal." },
      { nombre: "Acepromazina", principioActivoReal: "Acepromazina", categoria: "Antiespasmódico (músculo liso)", dosisMin: 0.05, dosisMax: 0.2, unidad: "mg/kg", via: "IV/IM/SC", frecuencia: "cada 8-12 h (o 1-3 mg/kg VO)", notas: "Dosis específica para FIC (antiespasmódico), distinta de la sedación habitual." },
      { nombre: "Diazepam", principioActivoReal: "Diazepam", categoria: "Antiespasmódico (músculo estriado)", dosisMin: 0.2, dosisMax: 0.5, unidad: "mg/kg", via: "IV", frecuencia: "según necesidad", notas: "Para el componente de musculatura estriada del esfínter. Tras desobstrucción con espasmo refractario a fenoxibenzamina: 1-2 mg/kg BID-TID." },
      { nombre: "Dantroleno", principioActivoReal: "Dantroleno", categoria: "Antiespasmódico (músculo estriado)", dosisMin: 0.5, dosisMax: 2, unidad: "mg/kg", via: "VO", frecuencia: "cada 12 h", notas: "" },
      { nombre: "Clomipramina", principioActivoReal: "Clomipramina", categoria: "Antidepresivo tricíclico", dosisMin: 0.25, dosisMax: 0.5, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h, por la noche", notas: "Efectos sobre todo comportamentales." },
      { nombre: "Buprenorfina", principioActivoReal: "Buprenorfina", categoria: "Analgésico opioide", dosisMin: 0.01, dosisMax: 0.03, unidad: "mg/kg", via: "VO/SC/IM/IV", frecuencia: "cada 8-12 h", notas: "Equivale a 10-30 microgramos/kg." },
      { nombre: "Meloxicam", principioActivoReal: "Meloxicam", categoria: "AINE", dosisMin: 0.05, dosisMax: 0.1, unidad: "mg/kg", via: "VO", frecuencia: "0,1 mg/kg/día 4 días, luego 0,05 mg/kg/día", notas: "" }
    ]
  },
  {
    id: "encefalopatia-hepatica-shunt",
    nombre: "Encefalopatía hepática / shunt portosistémico — manejo médico",
    indicacion: "Técnicas de diagnóstico / cirugía",
    especies: ["perro", "gato"],
    notas: "Pronóstico pobre sin cirugía (mortalidad >50% al año), pero siempre estabilizar médicamente al menos 1 mes antes de operar. La lactulosa (ver componente) puede darse también en enema si hay vómitos. Si hay convulsiones: levetiracetam de elección; si no, midazolam mejor que diazepam (seguido de infusión 0,1-0,25 mg/kg/min) o fenobarbital — la acepromazina no aumenta las convulsiones en estos pacientes. Dieta hipoalergénica. Premedicación quirúrgica: fentanilo o metadona + propofol, fluidos 5-10 ml/kg/h; si hipotensión, noradrenalina o bolos de albúmina.",
    componentes: [
      { nombre: "Lactulosa", principioActivoReal: "Lactulosa", categoria: "Laxante osmótico", dosisMin: 333.5, dosisMax: 667, unidad: "mg/kg", via: "VO", frecuencia: "cada 8-12 h", notas: "Equivale a 0,5-1 ml/kg del jarabe estándar de lactulosa 667 mg/ml (Duphalac). También puede darse en enema tibio si hay vómitos." },
      { nombre: "Ampicilina", principioActivoReal: "Ampicilina", categoria: "Antibiótico (betalactámico)", dosisMin: 22, dosisMax: 22, unidad: "mg/kg", via: "IV", frecuencia: "cada 6 h (qid)", notas: "Reduce la flora intestinal productora de toxinas/amonio." },
      { nombre: "Metronidazol", principioActivoReal: "Metronidazol", categoria: "Antibiótico/Antiprotozoario", dosisMin: 7.5, dosisMax: 7.5, unidad: "mg/kg", via: "IV/VO", frecuencia: "cada 12 h", notas: "Como última opción frente a ampicilina." },
      { nombre: "Levetiracetam (si hay convulsiones)", principioActivoReal: "Levetiracetam", categoria: "Anticonvulsivante", dosisMin: 20, dosisMax: 20, unidad: "mg/kg", via: "IV/VO", frecuencia: "cada 8 h (tid)", notas: "Anticonvulsivante de elección en estos pacientes." },
      { nombre: "Vitamina K1 (si hay coagulopatía)", principioActivoReal: "Fitomenadiona", categoria: "Antídoto/Vitamina", dosisMin: 1.5, dosisMax: 2, unidad: "mg/kg", via: "SC", frecuencia: "cada 12 h, 3 dosis; también 3-5 días antes y después de la cirugía aunque la coagulación esté bien", notas: "" },
      { nombre: "Omeprazol", principioActivoReal: "Omeprazol", categoria: "Inhibidor de la bomba de protones", dosisMin: 0.5, dosisMax: 1, unidad: "mg/kg", via: "IV/VO", frecuencia: "cada 12 h", notas: "" },
      { nombre: "Manitol (si hay edema cerebral)", principioActivoReal: "Manitol", categoria: "Diurético osmótico", dosisMin: 500, dosisMax: 1500, unidad: "mg/kg", via: "IV, en 15-20 min", frecuencia: "según necesidad", notas: "Equivale a 0,5-1,5 g/kg." },
      { nombre: "Flumazenilo (si hay coma)", principioActivoReal: "Flumazenilo", categoria: "Antagonista de benzodiazepinas", dosisMin: 0.02, dosisMax: 0.02, unidad: "mg/kg", via: "IV", frecuencia: "a efecto", notas: "" },
      { nombre: "Ácido ursodesoxicólico", principioActivoReal: "Ácido ursodesoxicólico", categoria: "Hepatoprotector (colerético)", dosisMin: 10, dosisMax: 15, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h", notas: "" },
      { nombre: "Vitamina E", principioActivoReal: "Vitamina E", categoria: "Vitamina/antioxidante", dosisMin: 15, dosisMax: 15, unidad: "UI/kg", via: "VO", frecuencia: "cada 24 h", notas: "" },
      { nombre: "SAMe (S-adenosilmetionina)", principioActivoReal: "SAMe", categoria: "Hepatoprotector", dosisMin: 20, dosisMax: 20, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h", notas: "" }
    ]
  },
  {
    id: "sedacion-ecocardiografia",
    nombre: "Sedación para ecocardiografía",
    indicacion: "Técnicas de diagnóstico",
    especies: ["perro", "gato"],
    notas: "El objetivo es la mínima sedación eficaz que altere lo menos posible las mediciones. Evitar los alfa-2 agonistas (bradicardia, alteran las mediciones). Alternativas citadas sin dosis por kg completa: en perros, diazepam 0,3 mg/kg + alfaxalona 1-3 mg/kg IV (PubMed); en gatos difíciles, gabapentina oral antes de la visita, o midazolam+ketamina para los muy agresivos (riesgo cardiovascular, puede afectar algunas mediciones). En gatos, si no se puede sedar, priorizar valorar el tamaño subjetivo de aurícula izquierda y paredes ventriculares antes que un estudio completo bajo sedación.",
    componentes: [
      { nombre: "Acepromazina (perro)", principioActivoReal: "Acepromazina", categoria: "Tranquilizante fenotiazínico", dosisMin: 0.025, dosisMax: 0.03, unidad: "mg/kg", via: "IV", frecuencia: "dosis única", notas: "Combinar con buprenorfina 0,01 mg/kg IV o butorfanol 0,3 mg/kg IV." },
      { nombre: "Acepromazina (gato)", principioActivoReal: "Acepromazina", categoria: "Tranquilizante fenotiazínico", dosisMin: 0.1, dosisMax: 0.1, unidad: "mg/kg", via: "IV", frecuencia: "dosis única", notas: "Combinar con butorfanol 0,25 mg/kg." },
      { nombre: "Butorfanol", principioActivoReal: "Butorfanol", categoria: "Opioide agonista-antagonista", dosisMin: 0.25, dosisMax: 0.3, unidad: "mg/kg", via: "IV/IM", frecuencia: "dosis única", notas: "0,25 mg/kg con acepromazina en gato; 0,3 mg/kg con acepromazina en perro o con alfaxalona en gato." },
      { nombre: "Alfaxalona (gato, alternativa)", principioActivoReal: "Alfaxalona", categoria: "Anestésico neuroesteroide", dosisMin: 1, dosisMax: 1, unidad: "mg/kg", via: "IM", frecuencia: "dosis única", notas: "Combinar con butorfanol 0,3 mg/kg IM. Afecta poco a las mediciones ecocardiográficas; algunos gatos muy nerviosos pueden necesitar dosis repetidas." }
    ]
  },
  {
    id: "cardiopatias-congenitas-obstructivas",
    nombre: "Estenosis aórtica/pulmonar — manejo médico con betabloqueante",
    indicacion: "Cardiopulmonar",
    especies: ["perro"],
    notas: "Betabloqueantes indicados si gradiente pulmonar máximo >60 mmHg sin ICC (reduce el consumo miocárdico de O2 y la contractilidad); en estenosis aórtica, ajustar según reducción de FC y contractilidad. Si hay ICC: diuréticos + IECA + espironolactona (mal pronóstico). La dilatación con balón es curativa a partir de gradiente 80 mmHg en estenosis pulmonar (no en la aórtica). Hipertensión pulmonar grave (sildenafilo): NO usar en HP leve/moderada. Retirar si la regurgitación mitral es <60. Endocarditis: azitromicina 1 mes + antiagregante (clopidogrel) + atenolol, por el riesgo de trombos.",
    componentes: [
      { nombre: "Atenolol", principioActivoReal: "Atenolol", categoria: "Betabloqueante", dosisMin: 0.2, dosisMax: 2, unidad: "mg/kg", via: "VO", frecuencia: "empezar a 0,2-0,5 mg/kg cada 24 h e ir subiendo hasta 1-2 mg/kg cada 12 h", notas: "Ajustar hasta evidenciar reducción de FC y contractilidad." },
      { nombre: "Sildenafilo (hipertensión pulmonar grave)", principioActivoReal: "Sildenafilo", categoria: "Vasodilatador pulmonar (inhibidor PDE5)", dosisMin: 1, dosisMax: 7, unidad: "mg/kg", via: "VO", frecuencia: "cada 8 h (tid)", notas: "Empezar a 1-2 mg/kg TID y subir si no se controla, hasta una dosis techo de 4-7 mg/kg TID. El rango mostrado (1-7 mg/kg) cubre desde el inicio hasta el techo, no es una única dosis a administrar de entrada. Solo en hipertensión pulmonar grave, con mucha precaución." }
    ]
  },
  {
    id: "hipertiroidismo-tormenta-tiroidea",
    nombre: "Hipertiroidismo felino — tormenta tiroidea y premedicación quirúrgica",
    indicacion: "Endocrinología",
    especies: ["gato"],
    notas: "El tratamiento paliativo de mantenimiento (metimazol/carbimazol) está en la ficha de Metimazol. El yodo radiactivo es el tratamiento curativo de elección. Si hay enfermedad renal concurrente, usar la dosis mínima de metimazol (1,25 mg BID) porque el hipertiroidismo enmascara la IR (la creatinina baja al bajar la masa muscular) y tratarlo puede agravarla. Cirugía (solo en nódulos unilaterales, riesgo de hipocalcemia postoperatoria si hay afectación paratiroidea): pretratar con tiamazol 16 días antes.",
    componentes: [
      { nombre: "Propranolol (premedicación quirúrgica)", principioActivoReal: "Propranolol", categoria: "Betabloqueante", dosisMin: 0.5, dosisMax: 2, unidad: "mg/kg", via: "VO", frecuencia: "antes de la cirugía", notas: "Para prevenir arritmias perioperatorias; combinar con anticolinérgico para fibrilaciones." },
      { nombre: "Propranolol (tormenta tiroidea, UCI)", principioActivoReal: "Propranolol", categoria: "Betabloqueante", dosisMin: 0.02, dosisMax: 0.02, unidad: "mg/kg", via: "IV lento", frecuencia: "según necesidad", notas: "Inhibe la conversión periférica de T4 a T3. Alternativa: esmolol 0,1-0,5 mg/kg (mejor perfil que propranolol en UCI)." }
    ]
  },
  {
    id: "hiperadrenocorticismo-mitotano",
    nombre: "Hiperadrenocorticismo (Cushing) — mitotano (Lysodren)",
    indicacion: "Endocrinología",
    especies: ["perro"],
    notas: "Administrar siempre con comida grasa. Fase de inducción: dura 4-30 días (media 9), hasta que el animal empieza a comer y beber menos, momento en el que se hace estimulación con ACTH (objetivo cortisol pre y post 1-6 µg/dl). Si es necesario durante la inducción, dar prednisona 0,15-1,25 mg/kg/día. En diabéticos concurrentes, dar a la vez insulina de acción intermedia 0,5-1 UI/kg 1-2 veces/día. Fase de mantenimiento: si responde en <10 días (sensible), 25 mg/kg UNA VEZ POR SEMANA; si tarda >10 días (resistente), 50 mg/kg una vez por semana — luego ACTH a los 90 días y después cada 3-6 meses; en recaída, reiniciar inducción subiendo la dosis un 50%. Destrucción completa de la corteza adrenal (alternativa): 75-100 mg/kg repartidos en 3 tomas durante 25 días, añadiendo desde el día 3 hidrocortisona + fludrocortisona de por vida (ver componentes).",
    componentes: [
      { nombre: "Mitotano — inducción (tumor hipofisario)", principioActivoReal: "Mitotano", categoria: "Adrenolítico", dosisMin: 25, dosisMax: 50, unidad: "mg/kg", via: "VO, con comida grasa", frecuencia: "dividido en 2-3 tomas/día, 4-30 días (media 9)", notas: "Para tumor hipofisario (PDH, la forma más frecuente, 80% de los casos)." },
      { nombre: "Mitotano — inducción (tumor adrenal)", principioActivoReal: "Mitotano", categoria: "Adrenolítico", dosisMin: 50, dosisMax: 75, unidad: "mg/kg", via: "VO, con comida grasa", frecuencia: "dividido en 2-3 tomas/día, 4-30 días", notas: "Para tumor adrenal (20% de los casos)." },
      { nombre: "Hidrocortisona (destrucción completa)", principioActivoReal: "Hidrocortisona", categoria: "Corticoide (sustitución)", dosisMin: 1, dosisMax: 2, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h, de por vida", notas: "Empezar a 2 mg/kg desde el día 3 de la inducción a dosis altas (75-100 mg/kg); bajar a 1 mg/kg tras ajustar electrolitos." },
      { nombre: "Fludrocortisona (destrucción completa)", principioActivoReal: "Fludrocortisona", categoria: "Mineralocorticoide (sustitución)", dosisMin: 0.01, dosisMax: 0.01, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h, de por vida", notas: "Ajustar según ionograma (subir si K alto o Na bajo)." }
    ]
  },
  {
    id: "hiperadrenocorticismo-ketoconazol",
    nombre: "Hiperadrenocorticismo (Cushing) — ketoconazol",
    indicacion: "Endocrinología",
    especies: ["perro"],
    notas: "Inhibe la esteroidogénesis adrenal de forma reversible. Útil para evaluar durante 4 semanas si la disfunción es adrenal, y en perros <5 kg en los que no se puede usar mitotano por reacción medicamentosa. Hacer estimulación con ACTH a los 10-14 días (objetivo: ligero hipoadrenocorticismo); si no se alcanza, subir a 15 mg/kg/12h. Suspender si aparece anorexia, depresión, vómito o diarrea.",
    componentes: [
      { nombre: "Ketoconazol", principioActivoReal: "Ketoconazol", categoria: "Antifúngico (inhibidor de esteroidogénesis)", dosisMin: 5, dosisMax: 15, unidad: "mg/kg", via: "VO", frecuencia: "cada 12 h — titulación en 3 pasos, ver notas", notas: "Titulación: empezar a 5 mg/kg/12h 7 días → 10 mg/kg/12h 7-14 días → si no hay respuesta, 15 mg/kg/12h. Calcula cada paso por separado; el rango mostrado aquí (5-15 mg/kg) cubre las tres dosis, no un único cálculo." }
    ]
  },
  {
    id: "diabetes-cetoacidosis",
    nombre: "Cetoacidosis diabética — estabilización inicial",
    indicacion: "Endocrinología",
    especies: ["perro", "gato"],
    notas: "Empezar con fisiológico normal; suplementar potasio conforme se restaura la filtración glomerular (hemodilución por rehidratación). La glucemia NO debe bajar de 200 mg/dl en las primeras 24 h (para mantener la diuresis). En cuanto la glucemia esté en 250-300 mg/dl, añadir glucosado al 50% al fluido IV para preparar una solución de glucosa al 5%. Insulina regular de acción rápida — no glargina ni NPH en esta fase aguda.",
    componentes: [
      { nombre: "Insulina regular (bolo inicial)", principioActivoReal: "Insulina regular", categoria: "Antidiabético", dosisMin: 0.2, dosisMax: 0.2, unidad: "UI/kg", via: "IM", frecuencia: "dosis única inicial", notas: "Seguir con infusión de 0,05 UI/kg cada hora (objetivo glucemia 200-250 mg/dl); una vez alcanzado, pasar a cada 6-8 h IM o SC si la hidratación lo permite." }
    ]
  },
  {
    id: "cardiomiopatia-hipertrofica-felina",
    nombre: "Cardiomiopatía hipertrófica felina (CMH) — manejo",
    indicacion: "Cardiopulmonar",
    especies: ["gato"],
    notas: "Descartar causas secundarias: hipertensión sistémica (objetivo <150 mmHg en gato tranquilo), hipertiroidismo, acromegalia — mirar siempre tiroides. Dosis fijas por gato no incluidas como componente (no calculables por peso en esta app): furosemida crónica 6,25 mg/gato SID a 12,5 mg/gato TID según respuesta; diltiazem 7,5 mg/gato cada 8 h; amlodipino 0,625 mg/gato SID si sube la TA; digoxina 1/4 comprimido de 0,125 mg cada 24-48 h si FA<25% o arritmias supraventriculares graves; atenolol 6,25-12,5 mg/gato cada 12-24 h si hay obstrucción dinámica del tracto de salida del VI (SAM) sin ICC; clopidogrel 18,75 mg/gato SID (mejor que aspirina 5 mg/gato/3 días — FATCAT) si hay riesgo de trombo. IECA (benazepril) si AI aumentada; si AI muy aumentada, añadir antiagregante aunque no haya trombo (SMOKE). Si diltiazem no es suficiente, sustituir por propranolol o añadirlo.",
    componentes: [
      { nombre: "Furosemida (ICC aguda grave)", principioActivoReal: "Furosemida", categoria: "Diurético de asa", dosisMin: 2, dosisMax: 4, unidad: "mg/kg", via: "IV (o IM cada 2 h)", frecuencia: "cada hora hasta mejoría respiratoria, luego bajar a 1-2 mg/kg cada 6-12 h", notas: "Reducir bruscamente la dosis en cuanto mejore la disnea." },
      { nombre: "Acepromazina (si muy nervioso)", principioActivoReal: "Acepromazina", categoria: "Tranquilizante fenotiazínico", dosisMin: 0.005, dosisMax: 0.1, unidad: "mg/kg", via: "IV", frecuencia: "según necesidad", notas: "Dosis muy baja, específica para el gato cardiópata agudo nervioso." },
      { nombre: "Propranolol (si falla diltiazem)", principioActivoReal: "Propranolol", categoria: "Betabloqueante", dosisMin: 0.5, dosisMax: 2, unidad: "mg/kg", via: "VO", frecuencia: "cada 8 h (tid)", notas: "Sustituir o añadir al diltiazem si la respuesta no es buena." }
    ]
  },
  {
    id: "tromboembolismo-felino",
    nombre: "Tromboembolismo aórtico felino — manejo ambulatorio",
    indicacion: "Cardiopulmonar",
    especies: ["gato"],
    notas: "Basado en guías ACVIM y German Santamaría. Es muy doloroso: analgesia siempre. Anticoagulantes (para prevenir el crecimiento del trombo) solo si han pasado pocas horas desde el evento, no si han pasado varias horas o días. Antiagregante de elección: clopidogrel 18,75 mg/gato VO cada 24 h (dosis fija, mejor que aspirina 5 mg/gato/3 días según el estudio FATCAT — recurrencia más tardía). Rivaroxabán 2,5 mg VO cada 24 h (dosis fija) como alternativa/combinación. Monitorizar la frecuencia respiratoria en reposo en casa (objetivo <30 rpm).",
    componentes: [
      { nombre: "Furosemida", principioActivoReal: "Furosemida", categoria: "Diurético de asa", dosisMin: 2, dosisMax: 2, unidad: "mg/kg", via: "VO", frecuencia: "cada 12 h", notas: "Para el manejo de la ICC concurrente." },
      { nombre: "Pimobendán", principioActivoReal: "Pimobendán", categoria: "Inodilatador", dosisMin: 0.25, dosisMax: 0.25, unidad: "mg/kg", via: "VO", frecuencia: "cada 12 h", notas: "" }
    ]
  },
  {
    id: "rinitis-linfoplasmocitaria-canina",
    nombre: "Rinitis linfoplasmocitaria canina",
    indicacion: "Cardiopulmonar",
    especies: ["perro"],
    notas: "Diagnóstico por exclusión + histología. Terapia de apoyo: humidificación de vías respiratorias, eliminar irritantes ambientales, solución salina intranasal, fenilefrina en gotas en ciclos de 3 días alternados con 3 días de solución salina. Si hay mejoría con antibiótico inmunomodulador, continuar con doxiciclina SID o azitromicina 2 veces/semana. Se puede combinar con piroxicam.",
    componentes: [
      { nombre: "Prednisona", principioActivoReal: "Prednisona", categoria: "Corticoide", dosisMin: 0.5, dosisMax: 1, unidad: "mg/kg", via: "VO", frecuencia: "1 mg/kg cada 24 h inicial, bajando hasta mínimo 0,5 mg/kg en días alternos", notas: "" },
      { nombre: "Ciclosporina (alternativa)", principioActivoReal: "Ciclosporina", categoria: "Inmunosupresor", dosisMin: 5, dosisMax: 5, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h", notas: "" },
      { nombre: "Doxiciclina (antibiótico inmunomodulador)", principioActivoReal: "Doxiciclina", categoria: "Antibiótico (tetraciclina)", dosisMin: 3, dosisMax: 5, unidad: "mg/kg", via: "VO", frecuencia: "cada 12 h", notas: "Alternativa: azitromicina 5 mg/kg cada 24 h." }
    ]
  },
  {
    id: "asma-bronquial-felino",
    nombre: "Asma bronquial felino",
    indicacion: "Cardiopulmonar",
    especies: ["gato"],
    notas: "Signos leves/intermitentes: broncodilatador inhalado según necesidad (albuterol/salbutamol 100 mcg por puff). El Ventolin no debe usarse más de 10 días consecutivos; si hace falta más tiempo, cambiar a salmeterol (Beglan). Signos severos, manejo inicial: oxigenoterapia + broncodilatador inhalado cada 30-60 min o terbutalina SC/IM cada 4 h + dexametasona IV/IM (ver componentes). Fluticasona inhalada 110-220 mcg BID (dosis fija, no incluida como componente) es la base del tratamiento de mantenimiento, reduciendo a la dosis mínima eficaz.",
    componentes: [
      { nombre: "Prednisolona", principioActivoReal: "Prednisolona", categoria: "Corticoide", dosisMin: 1, dosisMax: 1, unidad: "mg/kg", via: "VO", frecuencia: "BID 5 días, luego SID 5 días, luego cada 48 h 5 días", notas: "Pauta descendente estándar para crisis leve-moderada o tras estabilización de una crisis severa." },
      { nombre: "Dexametasona (crisis severa)", principioActivoReal: "Dexametasona", categoria: "Corticoide", dosisMin: 1, dosisMax: 1, unidad: "mg/kg", via: "IV/IM", frecuencia: "dosis única, manejo inicial de la crisis", notas: "" },
      { nombre: "Terbutalina (crisis severa)", principioActivoReal: "Terbutalina", categoria: "Broncodilatador (agonista beta-2)", dosisMin: 0.01, dosisMax: 0.01, unidad: "mg/kg", via: "SC/IM", frecuencia: "cada 4 h", notas: "Alternativa fija fuera de crisis: 0,325-0,625 mg/gato VO BID-TID." },
      { nombre: "Teofilina de acción sostenida", principioActivoReal: "Teofilina", categoria: "Broncodilatador (metilxantina)", dosisMin: 25, dosisMax: 25, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h, toma nocturna", notas: "" }
    ]
  },
  {
    id: "colapso-traqueal-manejo-medico",
    nombre: "Colapso traqueal — manejo médico",
    indicacion: "Cardiopulmonar",
    especies: ["perro"],
    notas: "Del 58 al 80% tienen infección respiratoria concurrente: doxiciclina 10 mg/kg SID (ver ficha de Doxiciclina). Pérdida de peso agresiva siempre (se ponga stent o no). La codeína es muy segura y puede titularse muy por encima de las dosis de formulario en tosedores refractarios (protocolo UCV: empezar 0,5 mg/kg BID 2 semanas, si no mejora subir a 1 mg/kg cada 12 h, luego hasta 2 mg/kg). Post-stent: doxiciclina + butorfanol + prednisolona + trazodona.",
    componentes: [
      { nombre: "Butorfanol", principioActivoReal: "Butorfanol", categoria: "Opioide agonista-antagonista", dosisMin: 0.5, dosisMax: 1, unidad: "mg/kg", via: "VO", frecuencia: "cada 8-12 h (bid-tid)", notas: "" },
      { nombre: "Prednisolona", principioActivoReal: "Prednisolona", categoria: "Corticoide", dosisMin: 0.5, dosisMax: 0.5, unidad: "mg/kg", via: "VO", frecuencia: "cada 12 h, bajando progresivamente", notas: "" },
      { nombre: "Codeína", principioActivoReal: "Codeína", categoria: "Antitusígeno opioide", dosisMin: 0.5, dosisMax: 4, unidad: "mg/kg", via: "VO", frecuencia: "cada 8-12 h, ver notas del protocolo para la titulación", notas: "Titular: 0,5 mg/kg BID → 1 mg/kg cada 12 h → hasta 1,5-2 mg/kg. Muy seguro incluso a dosis altas." },
      { nombre: "Trazodona", principioActivoReal: "Trazodona", categoria: "Ansiolítico", dosisMin: 2, dosisMax: 10, unidad: "mg/kg", via: "VO", frecuencia: "cada 8 h (tid), previo a días de posible estrés", notas: "" },
      { nombre: "Propentofilina", principioActivoReal: "Propentofilina", categoria: "Broncodilatador/hemorreológico", dosisMin: 6, dosisMax: 6, unidad: "mg/kg", via: "VO", frecuencia: "cada 12 h", notas: "No sube la frecuencia cardíaca (a diferencia de teofilina/aminofilina). También indicada en bronquitis crónica/fibrosis pulmonar." }
    ]
  },
  {
    id: "icc-regurgitacion-mitral-cmd",
    nombre: "Insuficiencia cardíaca congestiva (regurgitación mitral / CMD) — tratamiento",
    indicacion: "Cardiopulmonar",
    especies: ["perro"],
    notas: "Cardiopatía incipiente (sin ICC): IECA + dieta baja en sodio. ICC establecida: IECA + pimobendán + furosemida (añadir espironolactona si es necesario). Seguimiento: FR en reposo dormido >7 resp/15s indica edema pulmonar (subir diuréticos); Rx de control cada 3-4 meses. ICC resistente al tratamiento: furosemida hasta máx. 4 mg/kg TID, espironolactona hasta máx. 2-3 mg/kg BID, IECA a doble frecuencia, añadir otro vasodilatador (amlodipino o hidralazina). Tos en cardiópatas: alternar butorfanol con codeína como antitusígenos; broncodilatadores (teofilina, terbutalina); bajar de peso; usar arnés en vez de collar. Prueba diagnóstica cardiaco-vs-respiratorio: furosemida de prueba 0,5-1 mg/kg cada 8 h 2-4 días — si responde, origen cardíaco.",
    componentes: [
      { nombre: "Furosemida (crisis/urgencia)", principioActivoReal: "Furosemida", categoria: "Diurético de asa", dosisMin: 3, dosisMax: 4, unidad: "mg/kg", via: "IV", frecuencia: "repetible cada 2-4 h", notas: "Mantenimiento oral: 1-2 mg/kg cada 12 h (la dosis más baja que sea eficaz)." },
      { nombre: "Pimobendán", principioActivoReal: "Pimobendán", categoria: "Inodilatador", dosisMin: 0.2, dosisMax: 0.3, unidad: "mg/kg", via: "VO", frecuencia: "cada 12 h, 1-1,5 h antes de la comida", notas: "Si no se da antes de comer, pierde efectividad. No usar en estenosis aórtica, CMH obstructiva ni insuficiencia hepática." },
      { nombre: "Espironolactona", principioActivoReal: "Espironolactona", categoria: "Diurético ahorrador de potasio", dosisMin: 2, dosisMax: 4, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h (hasta 2-3 mg/kg BID en casos resistentes)", notas: "Tarda 3-4 días en hacer efecto; combinar con furosemida a mitad de dosis una vez resuelto el derrame agudo." },
      { nombre: "Hidralazina (ICC resistente)", principioActivoReal: "Hidralazina", categoria: "Vasodilatador arterial", dosisMin: 0.5, dosisMax: 2, unidad: "mg/kg", via: "VO", frecuencia: "cada 12 h", notas: "Reductor potente de la postcarga. No usar si hay taquicardia. Añadir en ICC resistente al tratamiento estándar." }
    ]
  },
  {
    id: "arritmias-antiarritmicos",
    nombre: "Arritmias cardíacas — antiarrítmicos",
    indicacion: "Cardiopulmonar",
    especies: ["perro"],
    notas: "Fibrilación auricular (carga de digoxina IV): 0,03 mg/kg IV — 50% de la dosis en el minuto 0, 25% a los 30-60 min, 25% más a los 30-60 min siguientes; hacer digoxinemia a la semana, 8h post-dosis (valor normal 1,0-2,2 ng/ml). Combinar con diltiazem para mejor control de FC (raramente <125 lpm con diltiazem solo). Alternativa: digoxina + propranolol. Taquicardia ventricular/fibrilación atrial: procainamida. Arritmias ventriculares agudas: lidocaína en bolo, repetible cada 10 min hasta máximo 8 mg/kg total; alternativa oral: tocainida 15-20 mg/kg cada 8-12 h.",
    componentes: [
      { nombre: "Digoxina (mantenimiento oral)", principioActivoReal: "Digoxina", categoria: "Glucósido cardíaco", dosisMin: 0.03, dosisMax: 0.03, unidad: "mg/kg", via: "VO", frecuencia: "dividido en 2 tomas/día", notas: "Contraindicada en CMH obstructiva, cardiomiopatía restrictiva, estenosis aórtica, bloqueo AV grado II-III y síndrome del seno enfermo." },
      { nombre: "Diltiazem", principioActivoReal: "Diltiazem", categoria: "Antagonista del calcio", dosisMin: 0.5, dosisMax: 0.5, unidad: "mg/kg", via: "VO", frecuencia: "cada 8 h (tid)", notas: "Segunda elección en gatos con CMH tras los betabloqueantes." },
      { nombre: "Procainamida", principioActivoReal: "Procainamida", categoria: "Antiarrítmico clase Ia", dosisMin: 8, dosisMax: 20, unidad: "mg/kg", via: "VO", frecuencia: "cada 6-8 h (alternativa IM: 6-12 mg/kg cada 6-8 h)", notas: "" },
      { nombre: "Lidocaína (arritmias ventriculares)", principioActivoReal: "Lidocaína", categoria: "Antiarrítmico clase Ib", dosisMin: 2, dosisMax: 4, unidad: "mg/kg", via: "IV", frecuencia: "repetible cada 10 min hasta un máximo ACUMULADO de 8 mg/kg (no por bolo)", notas: "No usar en bradicardia o bloqueos de alto grado. El cálculo mostrado es por bolo individual (2-4 mg/kg); no superar 8 mg/kg en total sumando todos los bolos." }
    ]
  },
  {
    id: "rcp-parada-cardiorrespiratoria",
    nombre: "Parada cardiorrespiratoria (RCP) — reanimación",
    indicacion: "Anestesia / urgencias",
    especies: ["perro", "gato"],
    notas: "Vía aérea: intubar de inmediato (o ventilar con ambú hasta estabilizar) con O2 al 100% a 20 insuflaciones/min. Masaje cardíaco si no hay pulso tras 20-30 s de ventilación: 80-120 compresiones/min, insuflar cada 2-3 compresiones. Comprobar eficacia por pulso femoral, ECG o contracción pupilar. Adrenalina en asistolia: 0,2-0,5 mg (fijo) o 0,5-5 microgramos/kg IV, intratraqueal (doble dosis) o intracardíaca, repetible cada 5 min. Metoxamina (0,4 mg/kg) es alternativa a la adrenalina en fibrilación, igual de eficaz en asistolia. Bicarbonato sódico 1 mEq/kg tras la parada (no necesario si duró <5 min). Soporte vital prolongado: dexametasona 4 mg/kg para edema cerebral/pulmón de shock.",
    componentes: [
      { nombre: "Atropina (bradicardia/bloqueo AV)", principioActivoReal: "Atropina", categoria: "Anticolinérgico", dosisMin: 0.02, dosisMax: 0.02, unidad: "mg/kg", via: "IV", frecuencia: "cada 2-5 min", notas: "En exceso puede provocar taquicardia y arritmias." },
      { nombre: "Lidocaína (arritmia ventricular en RCP)", principioActivoReal: "Lidocaína", categoria: "Antiarrítmico clase Ib", dosisMin: 1, dosisMax: 2, unidad: "mg/kg", via: "IV", frecuencia: "dosis única", notas: "En gatos, bajar a 1-2 mg/kg (más sensibles a toxicidad). No usar en bloqueo de tercer grado. No usar la presentación con vasoconstrictor de anestesia local." },
      { nombre: "Cloruro cálcico (parada por hiperpotasemia/hipocalcemia)", principioActivoReal: "Cloruro cálcico", categoria: "Sal de calcio", dosisMin: 10, dosisMax: 10, unidad: "mg/kg", via: "IV lento", frecuencia: "cada 10 min", notas: "Solución al 10%. Solo si la parada se asocia a hipocalcemia, hiperpotasemia o hipermagnesemia — en exceso puede provocar asistolia." },
      { nombre: "Dexametasona (soporte vital prolongado)", principioActivoReal: "Dexametasona", categoria: "Corticoide", dosisMin: 4, dosisMax: 4, unidad: "mg/kg", via: "IV", frecuencia: "dosis única", notas: "Para prevenir edema cerebral y pulmón de shock tras RCP prolongada." }
    ]
  },
  {
    id: "anafilaxia-anestesia",
    nombre: "Reacción anafiláctica durante la anestesia",
    indicacion: "Anestesia / urgencias",
    especies: ["perro", "gato"],
    notas: "Fluidoterapia agresiva: cristaloide isotónico 10-20 ml/kg IV en bolo, o coloide 10-20 ml/kg/día en bolo IV. Broncodilatador inhalado (Ventolin) si hay broncoespasmo.",
    componentes: [
      { nombre: "Epinefrina (adrenalina)", principioActivoReal: "Epinefrina", categoria: "Simpaticomimético", dosisMin: 0.01, dosisMax: 0.01, unidad: "mg/kg", via: "IV, bolo", frecuencia: "dosis única, seguida de infusión 0,005-1 mcg/kg/min", notas: "" },
      { nombre: "Difenhidramina", principioActivoReal: "Difenhidramina", categoria: "Antihistamínico (H1)", dosisMin: 0.5, dosisMax: 1, unidad: "mg/kg", via: "IV", frecuencia: "dosis única", notas: "" },
      { nombre: "Metilprednisolona", principioActivoReal: "Metilprednisolona", categoria: "Corticoide", dosisMin: 10, dosisMax: 20, unidad: "mg/kg", via: "IV", frecuencia: "dosis única", notas: "" },
      { nombre: "Teofilina", principioActivoReal: "Teofilina", categoria: "Broncodilatador (metilxantina)", dosisMin: 2.5, dosisMax: 5, unidad: "mg/kg", via: "IV", frecuencia: "dosis única", notas: "" }
    ]
  },
  {
    id: "bloqueo-neuromuscular-reversion",
    nombre: "Bloqueo neuromuscular (atracurio) y reversión",
    indicacion: "Anestesia",
    especies: ["perro", "gato"],
    notas: "El atracurio se puede almacenar en nevera hasta 18 meses. Dosis de 0,25 mg/kg producen parálisis de unos 43 minutos; mantenimiento 0,14-0,4 mg/kg cada 30 min. La dosis máxima de neostigmina no debe exceder los 5 mg totales — administrar un 50% más si no se aprecia efecto adecuado, mezclada con atropina en la misma jeringa e ir dando de 0,5 en 0,5 ml hasta revertir. Alternativa a neostigmina: edrofonio 0,5 mg/kg IV lento (no precisa atropina, efecto máximo en 1-2 min, dura 60-80 min) — considerado mejor que la neostigmina.",
    componentes: [
      { nombre: "Atracurio", principioActivoReal: "Atracurio", categoria: "Bloqueante neuromuscular", dosisMin: 0.14, dosisMax: 0.4, unidad: "mg/kg", via: "IV", frecuencia: "cada 30 min", notas: "Dosis única de 0,25 mg/kg para bloqueo de ~43 min." },
      { nombre: "Neostigmina (reversión)", principioActivoReal: "Neostigmina", categoria: "Anticolinesterásico", dosisMin: 0.1, dosisMax: 0.1, unidad: "mg/kg", via: "IV", frecuencia: "dosis única (máx. 5 mg totales)", notas: "Combinar con atropina 1,2-1,8 mg/kg IV en la misma jeringa para bloquear los efectos muscarínicos." }
    ]
  },
  {
    id: "sarna-demodecica-sarcoptica",
    nombre: "Sarna demodécica y sarcóptica — tratamiento",
    indicacion: "Dermatología",
    especies: ["perro"],
    notas: "Demodécica: continuar hasta 2 raspados negativos con 15 días de intervalo (aprox. 6 meses). Castrar a las hembras (el celo favorece la recaída). Tras curación aparente, se puede usar un antiparasitario spot-on de mantenimiento cada 15 días hasta cumplir 1 año sin recaídas. Un pequeño número de perros con mala inmunidad necesita mantenimiento crónico. Sarcóptica: Ivomec bovino (ivermectina) 1 ml/4,5 kg, 6 tratamientos cada 14 días + baños de amitraz semanales 6 semanas (dosis en ml/kg, no incluida como componente). El diagnóstico suele confirmarse por respuesta al tratamiento (raspados a menudo negativos).",
    componentes: [
      { nombre: "Milbemicina oxima (demodécica)", principioActivoReal: "Milbemicina oxima", categoria: "Antiparasitario (lactona macrocíclica)", dosisMin: 3, dosisMax: 3, unidad: "mg/kg", via: "VO", frecuencia: "una vez por semana, hasta raspado negativo (~6 meses)", notas: "" },
      { nombre: "Ivermectina/Moxidectina (demodécica)", principioActivoReal: "Ivermectina", categoria: "Antiparasitario (lactona macrocíclica)", dosisMin: 0.4, dosisMax: 0.5, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h, hasta 2 raspados negativos con 15 días de intervalo", notas: "Equivale a 400-500 microgramos/kg. No usar ivermectina en razas sensibles (collie y similares) sin confirmar genotipo MDR1." }
    ]
  },
  {
    id: "dermatofitosis-sistemica",
    nombre: "Dermatofitosis (tiña) — tratamiento sistémico",
    indicacion: "Dermatología",
    especies: ["perro", "gato"],
    notas: "Terapia tópica de elección: enilconazol (perro y gato). Tratar también el ambiente con lejía sin diluir o virkon. La griseofulvina no debe usarse en gatos con FIV ni en gestantes; controlar hemograma cada 7-14 días (riesgo de neutropenia). El ketoconazol se reserva en EEUU para cuando falla la griseofulvina, pero en Europa se usa más ampliamente; no funciona bien frente a M. canis — medir enzimas hepáticas mensualmente.",
    componentes: [
      { nombre: "Griseofulvina", principioActivoReal: "Griseofulvina", categoria: "Antifúngico", dosisMin: 25, dosisMax: 60, unidad: "mg/kg", via: "VO", frecuencia: "cada 12 h, 4-6 semanas", notas: "" },
      { nombre: "Ketoconazol", principioActivoReal: "Ketoconazol", categoria: "Antifúngico", dosisMin: 10, dosisMax: 10, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h, 3-4 semanas", notas: "" }
    ]
  },
  {
    id: "lupus-eritematoso-cutaneo",
    nombre: "Lupus eritematoso cutáneo",
    indicacion: "Dermatología",
    especies: ["perro"],
    notas: "Tetraciclina + nicotinamida a dosis fija (no calculable por peso en esta app): 250 mg de cada fármaco TID en perros <10 kg, 500 mg de cada en perros >10 kg — puede sustituirse la tetraciclina por doxiciclina (ver componente). Tacrolimus tópico al 0,1% como complemento.",
    componentes: [
      { nombre: "Doxiciclina (sustituto de tetraciclina)", principioActivoReal: "Doxiciclina", categoria: "Antibiótico (tetraciclina)", dosisMin: 10, dosisMax: 10, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h", notas: "" },
      { nombre: "Prednisolona", principioActivoReal: "Prednisolona", categoria: "Corticoide", dosisMin: 2, dosisMax: 2, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h", notas: "Alternativa: ciclosporina 5-10 mg/kg SID." }
    ]
  },
  {
    id: "vasculitis-borde-oreja",
    nombre: "Vasculitis cutánea / dermatosis del borde de la oreja",
    indicacion: "Dermatología",
    especies: ["perro"],
    notas: "Descartar siempre hipotiroidismo (si está presente, el pronóstico es malo si no se trata). Mejoran a veces con pomadas antibiótico-corticoide tópicas. A veces requiere sección quirúrgica del borde de la oreja.",
    componentes: [
      { nombre: "Pentoxifilina", principioActivoReal: "Pentoxifilina", categoria: "Hemorreológico/vasodilatador", dosisMin: 10, dosisMax: 10, unidad: "mg/kg", via: "VO", frecuencia: "cada 8 h", notas: "Tratamiento de varios meses para poder valorar su eficacia." },
      { nombre: "Prednisona (dosis de ataque)", principioActivoReal: "Prednisona", categoria: "Corticoide", dosisMin: 2.2, dosisMax: 4, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h", notas: "" }
    ]
  },
  {
    id: "dermatitis-atopica-canina",
    nombre: "Dermatitis atópica canina — manejo escalonado",
    indicacion: "Dermatología",
    especies: ["perro"],
    notas: "Siempre citología de piel primero: si hay muchas bacterias, tratar con cefalexina; si hay malassezia, ketoconazol + baños. Si responde y queda por debajo del umbral de prurito, mantener así; si no, pasar a tratamiento sintomático de la dermatitis alérgica. Champú: peróxido de benzoilo (seborrea seca) o Allermyl. Otitis concurrente: limpiador ótico regular ± antibiótico-corticoide tópico si es aguda. Fístula perianal del pastor alemán (relacionada): prednisona 2 mg/kg/día 2 semanas, luego 1 mg/kg/día 4 semanas más, o ciclosporina 5-7,5 mg/kg BID la primera semana, ajustando después según niveles séricos (objetivo 400-600 ng/ml).",
    componentes: [
      { nombre: "Prednisona/prednisolona (dacortin)", principioActivoReal: "Prednisolona", categoria: "Corticoide", dosisMin: 0.5, dosisMax: 1, unidad: "mg/kg", via: "VO", frecuencia: "0,5-1 mg/kg SID 5-7 días, luego 1 mg/kg cada 48 h 10 días más", notas: "Si la infección genera mucho prurito, se puede añadir a 1 mg/kg hasta controlar el prurito." },
      { nombre: "Ciclosporina", principioActivoReal: "Ciclosporina", categoria: "Inmunosupresor", dosisMin: 5, dosisMax: 10, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h 1 mes, luego cada 48 h 1 mes, luego cada 72-96 h", notas: "Puede continuarse así de por vida. Mismo resultado que corticoides a largo plazo." },
      { nombre: "Ketoconazol (si malassezia)", principioActivoReal: "Ketoconazol", categoria: "Antifúngico", dosisMin: 10, dosisMax: 10, unidad: "mg/kg", dosisMaxima: 200, via: "VO, con comida", frecuencia: "cada 24 h", notas: "Máximo 200 mg/día por perro. Tratamiento 1-2 meses, prolongando 7-10 días tras la curación." }
    ]
  },
  {
    id: "granuloma-eosinofilico-felino",
    nombre: "Complejo granuloma eosinofílico felino",
    indicacion: "Dermatología",
    especies: ["gato"],
    notas: "Agrupa: úlcera indolente (labio superior), placa eosinofílica (abdomen/muslos, con prurito) y granuloma eosinofílico (extremidades, barbilla, sin prurito). Pronóstico según fase: I (sin tratamiento previo, mejor pronóstico, recaída 25% a 6 meses), II (recaída tras tto previo, 50% a 6 meses), III (refractario a corticoides, 50% recaída pese a tratamiento). Alternativa inyectable de depósito: acetato de metilprednisolona 20 mg/gato IM cada 15 días (dosis fija).",
    componentes: [
      { nombre: "Prednisolona", principioActivoReal: "Prednisolona", categoria: "Corticoide", dosisMin: 2, dosisMax: 2, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h", notas: "" },
      { nombre: "Dexametasona", principioActivoReal: "Dexametasona", categoria: "Corticoide", dosisMin: 0.1, dosisMax: 0.1, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h", notas: "" }
    ]
  },
  {
    id: "meningoencefalitis-granulomatosa",
    nombre: "Meningoencefalitis granulomatosa (GME) / meningitis inmunomediada",
    indicacion: "Neurología",
    especies: ["perro"],
    notas: "Corticoide en pauta descendente muy prolongada (duración mínima del tratamiento 6 meses, con revisiones cada 4-6 semanas): 2 mg/kg BID 2 días → 1 mg/kg BID 2 semanas → 0,5 mg/kg BID 1 mes → 0,25 mg/kg SID 1 mes → 0,25 mg/kg cada 48 h 2 meses. Pauta alternativa citada (más larga): 2 mg/kg BID 3 semanas → 1 mg/kg SID 2 semanas → 1 mg/kg días alternos 2 semanas → 0,5 mg/kg días alternos 2 semanas → 0,3 mg/kg días alternos 2 semanas. Si no es efectivo, añadir azatioprina. Ciclosporina: su efecto es más lento en monoterapia; usarla cuando se quieren evitar los efectos secundarios de los corticoides a largo plazo.",
    componentes: [
      { nombre: "Metilprednisolona (o prednisolona)", principioActivoReal: "Metilprednisolona", categoria: "Corticoide", dosisMin: 0.25, dosisMax: 2, unidad: "mg/kg", via: "VO", frecuencia: "ver pauta descendente completa en las notas del protocolo", notas: "La prednisolona es alternativa pero tiene más efecto gluconeogénico. Calcular cada escalón de la pauta por separado, este rango cubre desde la dosis inicial hasta la de mantenimiento." },
      { nombre: "Azatioprina (si no responde)", principioActivoReal: "Azatioprina", categoria: "Inmunosupresor", dosisMin: 1.5, dosisMax: 2, unidad: "mg/kg", via: "VO", frecuencia: "cada 48 h", notas: "Añadir sin retirar el corticoide si la pauta de corticoide sola no controla la enfermedad." },
      { nombre: "Ciclosporina", principioActivoReal: "Ciclosporina", categoria: "Inmunosupresor", dosisMin: 5, dosisMax: 10, unidad: "mg/kg", via: "VO", frecuencia: "10 mg/kg BID 6 semanas, luego intentar reducir a 5 mg/kg SID", notas: "" },
      { nombre: "Micofenolato mofetilo", principioActivoReal: "Micofenolato mofetilo", categoria: "Inmunosupresor", dosisMin: 10, dosisMax: 20, unidad: "mg/kg", via: "VO", frecuencia: "20 mg/kg BID el primer mes, luego reducir a 10 mg/kg BID", notas: "" }
    ]
  },
  {
    id: "hiperplasia-prostatica-benigna-perro",
    nombre: "Hiperplasia prostática benigna (HPB)",
    indicacion: "Genital y Reproducción",
    especies: ["perro"],
    notas: "Tratamiento médico como alternativa a la castración (curativa) cuando esta no es posible o se quiere preservar la reproducción. Mejoría visible en 10-20 días con tamsulosina/flutamida, algo más lenta con finasteride (~4 semanas). Con finasteride alternar con periodos de descanso no superiores a 3 meses.",
    componentes: [
      { nombre: "Finasteride", principioActivoReal: "Finasteride", categoria: "Inhibidor de la 5-alfa-reductasa", dosisMin: 0.1, dosisMax: 1, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h", notas: "De 8 a 53 semanas de tratamiento. Alternativa práctica: 1 comprimido/día (5 mg) para perros de 5-50 kg." },
      { nombre: "Flutamida", principioActivoReal: "Flutamida", categoria: "Antiandrógeno no esteroideo", dosisMin: 5, dosisMax: 5, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h, durante 7 semanas", notas: "Reduce el tamaño prostático en 10-14 días, efecto mantenido hasta 1,5 meses tras el cese. Fármaco de elección en reproductores; inconveniente: coste." },
      { nombre: "Tamsulosina", principioActivoReal: "Tamsulosina", categoria: "Bloqueante alfa-1 adrenérgico", dosisMin: 0.01, dosisMax: 0.01, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h", notas: "Equivale a 10 microgramos/kg/día. Mejora rápidamente los signos de obstrucción urinaria mientras hace efecto el finasteride o se realiza la castración." }
    ]
  },
  {
    id: "piometra-tratamiento-medico-perra",
    nombre: "Piometra de cuello abierto — tratamiento médico conservador",
    indicacion: "Genital y Reproducción",
    especies: ["perro"],
    notas: "SOLO en piometra de CUELLO ABIERTO y en hembras estables, sin fallo renal ni cardiopatía (el vaciado uterino está contraindicado en cardiópatas y nefrópatas: controlar siempre BUN y creatinina). Tasa de curación aproximada 75% en cuello abierto. Premedicar con atropina (0,25 mg/kg) 15 minutos antes de cada dosis de prostaglandina para reducir sus efectos secundarios (salivación, vómito, taquicardia/bradicardia, tenesmo). La ovariohisterectomía sigue siendo el tratamiento de elección salvo que se quiera preservar la reproducción.",
    componentes: [
      { nombre: "Cloprostenol (análogo de PGF2α)", principioActivoReal: "Cloprostenol", categoria: "Prostaglandina", dosisMin: 0.25, dosisMax: 0.25, unidad: "mg/kg", via: "SC", frecuencia: "cada 12 h durante 5 días (perras grandes)", notas: "En perras pequeñas usar dosis crecientes: día 1: 0,1 mg/kg BID; días 2-5: 0,15 mg/kg BID; días 5-8: 0,25 mg/kg BID. Premedicar siempre con atropina." },
      { nombre: "Marbofloxacino", principioActivoReal: "Marbofloxacino", categoria: "Antibiótico (fluoroquinolona)", dosisMin: 2, dosisMax: 2, unidad: "mg/kg", via: "VO/SC", frecuencia: "cada 24 h, durante 10-15 días o hasta remisión ecográfica", notas: "" }
    ]
  },
  {
    id: "tetania-puerperal-eclampsia",
    nombre: "Tetania puerperal (eclampsia, hipocalcemia posparto)",
    indicacion: "Genital y Reproducción",
    especies: ["perro"],
    notas: "Típica en perras pequeñas con camadas numerosas, unas 2 semanas tras el parto. Diagnóstico: calcio sérico < 8 mg/dl (medir siempre también glucosa para diferenciar de hipoglucemia; si hay hipoglucemia confirmada, tratar con dextrosa al 10-20%, 5-20 ml). Parar la infusión IV si aparecen vómitos o bradicardia. Suspender la lactancia 24 h; si persiste, destetar la camada y usar cabergolina (galastop) para cortar la producción de leche.",
    componentes: [
      { nombre: "Gluconato cálcico 10% (IV lenta, fase aguda)", principioActivoReal: "Gluconato cálcico", categoria: "Suplemento de calcio", dosisMin: 50, dosisMax: 150, unidad: "mg/kg", via: "IV lenta", frecuencia: "dosis única, a pasar en 10-20 min (máx. 1 ml/min de la solución al 10%)", notas: "Equivale a 0,5-1,5 ml/kg de solución de gluconato cálcico al 10% (100 mg/ml); mejor limitarse a 0,5 ml/kg = 50 mg/kg si es posible. Monitorizar ECG/FC durante la infusión." },
      { nombre: "Calcio oral (mantenimiento tras la fase aguda)", principioActivoReal: "Gluconato o carbonato cálcico", categoria: "Suplemento de calcio", dosisMin: 25, dosisMax: 50, unidad: "mg/kg", via: "VO", frecuencia: "al día, dividido en 2 tomas (BID)", notas: "" }
    ]
  },
  {
    id: "pseudogestacion-pseudociesis",
    nombre: "Pseudogestación (pseudociesis)",
    indicacion: "Genital y Reproducción",
    especies: ["perro", "gato"],
    notas: "Cabergolina es la opción con menos efectos secundarios, válida en perra y gata. Mismo protocolo de cabergolina sirve para inducir/adelantar el celo y para anoestro persistente en gata (15-20 días).",
    componentes: [
      { nombre: "Cabergolina", principioActivoReal: "Cabergolina", categoria: "Agonista dopaminérgico (antiprolactínico)", dosisMin: 0.005, dosisMax: 0.005, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h, durante 4-6 días", notas: "Equivale a 5 microgramos/kg/día." },
      { nombre: "Metergolina", principioActivoReal: "Metergolina", categoria: "Agonista dopaminérgico (antiprolactínico)", dosisMin: 0.2, dosisMax: 0.2, unidad: "mg/kg", via: "VO", frecuencia: "cada 12 h, durante 8-10 días", notas: "Especie: perro." }
    ]
  },
  {
    id: "interrupcion-gestacion-no-deseada",
    nombre: "Interrupción de gestación no deseada (aglepristona)",
    indicacion: "Genital y Reproducción",
    especies: ["perro", "gato"],
    notas: "Aglepristona (Alizin) es antiprogestágeno, eficaz desde el día de la monta hasta el día 55 en la perra. Confirmar el éxito del aborto por ecografía; dada su inocuidad, si falla puede repetirse la pauta o recurrir a prostaglandinas. En perra: 2 inyecciones SC separadas 24 h en la cara interna del muslo (puede caer el pelo en la zona). En gata: 2 inyecciones con 24 h de intervalo, eficacia ~85%, puede volver a salir en celo en 1 semana. La dosis se expresa también como 0,33 ml/kg del producto comercial (10 mg/kg).",
    componentes: [
      { nombre: "Aglepristona (perra)", principioActivoReal: "Aglepristona", categoria: "Antiprogestágeno", dosisMin: 10, dosisMax: 10, unidad: "mg/kg", via: "SC", frecuencia: "días 1 y 2 (equivale a 0,33 ml/kg)", notas: "" },
      { nombre: "Aglepristona (gata)", principioActivoReal: "Aglepristona", categoria: "Antiprogestágeno", dosisMin: 15, dosisMax: 15, unidad: "mg/kg", via: "SC", frecuencia: "días 0 y 1 (equivale a 0,5 ml/kg)", notas: "" }
    ]
  },
  {
    id: "feocromocitoma-manejo-perioperatorio",
    nombre: "Feocromocitoma — manejo perioperatorio (bloqueo adrenérgico)",
    indicacion: "Cirugía / Endocrinología",
    especies: ["perro"],
    notas: "Raza predispuesta: bóxer. El tumor medular adrenal (feocromocitoma) libera adrenalina/noradrenalina produciendo hipertensión, taquicardia y arritmias, a veces difíciles de diagnosticar. Iniciar el bloqueo alfa (fenoxibenzamina) 1-2 semanas (7-15 días) antes de la cirugía; no añadir el betabloqueante hasta que la PA esté controlada (un betabloqueo sin alfa-bloqueo previo puede provocar una crisis hipertensiva grave por vasoconstricción sin oposición). Evitar manipular el tumor más de lo imprescindible durante la cirugía, ya que libera catecolaminas de forma aguda; tener fentolamina disponible para una crisis hipertensiva intraoperatoria. Mortalidad quirúrgica descrita 15-20%. Tras la adrenalectomía, suplementar con corticoides varios meses ya que la glándula contralateral suele estar atrofiada.",
    componentes: [
      { nombre: "Fenoxibenzamina (bloqueo alfa preoperatorio)", principioActivoReal: "Fenoxibenzamina", categoria: "Bloqueante alfa-adrenérgico", dosisMin: 0.25, dosisMax: 0.25, unidad: "mg/kg", via: "VO", frecuencia: "cada 12 h, comenzando 1-2 semanas antes de la cirugía", notas: "" },
      { nombre: "Esmolol (bloqueo beta intraoperatorio, si arritmia/taquicardia)", principioActivoReal: "Esmolol", categoria: "Betabloqueante de acción corta", dosisMin: 0.05, dosisMax: 0.1, unidad: "mg/kg", via: "IV", frecuencia: "bolo lento cada 5 min hasta una dosis TOTAL acumulada máxima de 0,5 mg/kg", notas: "Preferido sobre propranolol en el intraoperatorio por su vida media más corta. No administrar hasta que la PA esté controlada con el alfa-bloqueante." },
      { nombre: "Lidocaína (si aparecen arritmias ventriculares)", principioActivoReal: "Lidocaína", categoria: "Antiarrítmico clase Ib", dosisMin: 2, dosisMax: 2, unidad: "mg/kg", via: "IV", frecuencia: "bolo, repetible hasta un máximo ACUMULADO de 8 mg/kg, seguido de infusión de 50-75 microgramos/kg/min", notas: "El cálculo mostrado es por bolo individual; no superar 8 mg/kg en total sumando todos los bolos." },
      { nombre: "Corticoide de soporte perioperatorio (adrenalectomía)", principioActivoReal: "Dexametasona", categoria: "Corticoide", dosisMin: 0.1, dosisMax: 0.2, unidad: "mg/kg", via: "IV", frecuencia: "al inicio de la cirugía, y mantener las horas siguientes", notas: "Alternativa: prednisona 1-2 mg/kg IV. Post-op continuar pauta descendente: dexametasona 0,02-0,04 mg/kg QID 2 días, después prednisolona 0,5 mg/kg BID hasta que la glándula contralateral recupere función." }
    ]
  },
  {
    id: "torsion-gastrica-manejo-perioperatorio",
    nombre: "Torsión/dilatación gástrica (GDV) — estabilización y manejo perioperatorio",
    indicacion: "Cirugía / Urgencias",
    especies: ["perro"],
    notas: "Lactato > 6 mmol/l sugiere necrosis gástrica (supervivencia ~99% si lactato < 6). Reposición de volumen inicial con cristaloides isotónicos (40 ml/kg/h) y/o coloides (isohes 10-20 ml/kg en 15-30 min); en shock grave puede usarse suero hipertónico al 5-7,5% (4 ml/kg en 5-10 min), estos componentes de fluidoterapia no se calculan aquí por ser dosis en ml/kg de sueroterapia, no fármacos. Antes de la descompresión gástrica, considerar deferoxamina para prevenir el daño por reperfusión.",
    componentes: [
      { nombre: "Lidocaína (arritmias ventriculares, 1ª línea)", principioActivoReal: "Lidocaína", categoria: "Antiarrítmico clase Ib", dosisMin: 2, dosisMax: 2, unidad: "mg/kg", via: "IV", frecuencia: "bolo, seguido de infusión continua", notas: "" },
      { nombre: "Procainamida (si no hay respuesta a lidocaína)", principioActivoReal: "Procainamida", categoria: "Antiarrítmico clase Ia", dosisMin: 6, dosisMax: 10, unidad: "mg/kg", via: "IV", frecuencia: "dosis de carga lenta; se pueden repetir bolos de 2 mg/kg cada 5 min según respuesta", notas: "" },
      { nombre: "Sulfato de magnesio 20%", principioActivoReal: "Sulfato de magnesio", categoria: "Antiarrítmico / suplemento electrolítico", dosisMin: 12.5, dosisMax: 35, unidad: "mg/kg", via: "IV (en infusión continua)", frecuencia: "a pasar en 2-4 h, repetible cada 8 h", notas: "Equivale a 0,15-0,3 mEq/kg." },
      { nombre: "Deferoxamina (prevención del daño de reperfusión)", principioActivoReal: "Deferoxamina", categoria: "Quelante del hierro / antioxidante", dosisMin: 20, dosisMax: 25, unidad: "mg/kg", via: "IV lenta", frecuencia: "dosis única, 10 minutos antes de la descompresión gástrica", notas: "" },
      { nombre: "Cefazolina (profilaxis/tratamiento antibiótico perioperatorio)", principioActivoReal: "Cefazolina", categoria: "Antibiótico (cefalosporina 1ª gen.)", dosisMin: 15, dosisMax: 15, unidad: "mg/kg", via: "IV", frecuencia: "en el momento de la inducción anestésica y repetir cada 8 h", notas: "" }
    ]
  },
  {
    id: "trauma-craneoencefalico-manejo-agudo",
    nombre: "Traumatismo craneoencefálico — manejo agudo (hipertensión intracraneal)",
    indicacion: "Neurología / Urgencias",
    especies: ["perro", "gato"],
    notas: "Elevar la cabeza 30° respecto al cuerpo. Evitar la hipovolemia (fluidoterapia con cristaloides isotónicos, evitando la sobrehidratación). Suplementar oxígeno. Vigilar el reflejo de Cushing (aumento de PA no invasiva > 160 con bradicardia < 60 lpm), que indica aumento de la presión intracraneal. NO usar corticoides (producen acidosis láctica), NI atropina, NI vasodilatadores, NI ketamina (baja la FC y aumenta la PIC). PA no invasiva objetivo: 60-100 mmHg. Glucemia > 153 mg/dl al ingreso se asocia a mal pronóstico. Si tras la recuperación aparecen crisis epilépticas, iniciar tratamiento anticonvulsivante y valorar retirarlo al año si no hay más convulsiones.",
    componentes: [
      { nombre: "Manitol (si aparece reflejo de Cushing, sin hipovolemia)", principioActivoReal: "Manitol", categoria: "Diurético osmótico", dosisMin: 1000, dosisMax: 1000, unidad: "mg/kg", via: "IV", frecuencia: "a pasar en 15 min, repetible cada 15 min si es necesario", notas: "Equivale a 1 g/kg. NO administrar si hay hipovolemia — en ese caso usar suero salino hipertónico (4 ml/kg de solución al 4-7% en 10 min, seguido de 4 ml/kg de cristaloide isotónico), que sí puede darse aunque exista hipovolemia." }
    ]
  },
  {
    id: "sindrome-cauda-equina-lumbosacro",
    nombre: "Síndrome de cauda equina (enfermedad lumbosacra degenerativa) — manejo médico del dolor",
    indicacion: "Neurología",
    especies: ["perro"],
    notas: "Ante sospecha clínica de compresión de raíces nerviosas lumbares caudales sin hallazgos en la mielografía, valorar RM específica de raíces nerviosas y explorar el orificio intervertebral lumbosacro.",
    componentes: [
      { nombre: "Tramadol", principioActivoReal: "Tramadol", categoria: "Analgésico opioide", dosisMin: 2, dosisMax: 2, unidad: "mg/kg", via: "VO", frecuencia: "cada 12 h", notas: "" },
      { nombre: "Metocarbamol", principioActivoReal: "Metocarbamol", categoria: "Relajante muscular de acción central", dosisMin: 10, dosisMax: 10, unidad: "mg/kg", via: "VO", frecuencia: "cada 12 h", notas: "" }
    ]
  },
  {
    id: "intoxicacion-amitraz",
    nombre: "Intoxicación por amitraz (collar antiparasitario ingerido)",
    indicacion: "Neurología / Toxicología",
    especies: ["perro"],
    notas: "El amitraz es un agonista alfa-2 adrenérgico; la yohimbina actúa como antagonista específico revirtiendo la sedación, bradicardia e hipotensión.",
    componentes: [
      { nombre: "Yohimbina", principioActivoReal: "Yohimbina", categoria: "Antagonista alfa-2 adrenérgico (antídoto)", dosisMin: 0.1, dosisMax: 0.1, unidad: "mg/kg", via: "IV", frecuencia: "cada 24 h, según necesidad", notas: "" }
    ]
  },
  {
    id: "traumatismo-medular-agudo",
    nombre: "Traumatismo medular agudo (disco toracolumbar / lesión medular)",
    indicacion: "Neurología / Urgencias",
    especies: ["perro"],
    notas: "Clasificación orientativa: 1) solo dolor → tratamiento médico (AINE/analgesia ± fenestración); 2-3) ataxia/paraparesia → fenestración ventral; 4) paraplejia con retención urinaria/derrame → hemilaminectomía en las primeras 24 h (hasta 48 h con menos garantías); 5) paraplejia con pérdida de dolor profundo → hemilaminectomía urgente en 24 h. Pronóstico: sin dolor profundo, recuperación <5% tras cirugía; con dolor profundo, ~66% mejoran (no implica marcha normal); paraparesia ~85% de recuperación. Solo usar un único AINE cada vez, nunca combinar dos, y no combinar AINE con corticoide.",
    componentes: [
      { nombre: "Metilprednisolona succinato sódico (bolo IV agudo)", principioActivoReal: "Metilprednisolona succinato sódico", categoria: "Corticoide (neuroprotección aguda)", dosisMin: 30, dosisMax: 30, unidad: "mg/kg", via: "IV lenta", frecuencia: "bolo único lento (evitar vómito/hipotensión), seguido de 15 mg/kg IV a las 2-6 h, y continuar con infusión de 2,5 mg/kg/hora durante 24-48 h más", notas: "Protocolo clásico de neuroprotección aguda (basado en el NASCIS canino); su eficacia real es controvertida y hoy no se considera de uso rutinario en muchos centros — valorar caso a caso." },
      { nombre: "Fenilbutazona (dolor únicamente, sin cirugía)", principioActivoReal: "Fenilbutazona", categoria: "AINE", dosisMin: 10, dosisMax: 25, unidad: "mg/kg", via: "VO", frecuencia: "cada 8 h", notas: "" },
      { nombre: "Flunixin meglumine (dolor únicamente, sin cirugía)", principioActivoReal: "Flunixin meglumine", categoria: "AINE", dosisMin: 0.5, dosisMax: 1, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h", notas: "Uso de corta duración; alto riesgo de ulceración GI." },
      { nombre: "Carprofeno (dolor únicamente, sin cirugía)", principioActivoReal: "Carprofeno", categoria: "AINE", dosisMin: 2.2, dosisMax: 2.2, unidad: "mg/kg", via: "VO", frecuencia: "cada 12 h", notas: "" },
      { nombre: "Metocarbamol", principioActivoReal: "Metocarbamol", categoria: "Relajante muscular de acción central", dosisMin: 20, dosisMax: 20, unidad: "mg/kg", via: "VO", frecuencia: "cada 8 h", notas: "" }
    ]
  },
  {
    id: "fobia-ruidos-petardos",
    nombre: "Miedo/fobia a ruidos fuertes (petardos, tormentas)",
    indicacion: "Comportamiento",
    especies: ["perro", "gato"],
    notas: "Casos leves: collar de feromonas (Adaptil en perro, Feliway en gato) + Zylkene (nutracéutico). Casos graves (no come, se esconde bajo la cama, etc.): alprazolam; advertir de probable efecto sedante al subir la dosis. Para un uso puntual concreto (ej. solo la noche de fuegos artificiales), existe también dexmedetomidina en gel transmucoso oral (Sileo), efecto en 15-60 min y duración 2-3 h, aplicado 1 hora antes del evento — no incluido aquí por no ser dosificación mg/kg estándar de clínica.",
    componentes: [
      { nombre: "Zylkene (alfa-casozepina)", principioActivoReal: "Alfa-casozepina", categoria: "Nutracéutico ansiolítico", dosisMin: 15, dosisMax: 15, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h", notas: "Para casos leves." },
      { nombre: "Alprazolam (perro)", principioActivoReal: "Alprazolam", categoria: "Ansiolítico (benzodiazepina)", dosisMin: 0.02, dosisMax: 0.1, unidad: "mg/kg", dosisMaxima: 4, via: "VO", frecuencia: "cada 8 h", notas: "Máximo 4 mg/perro/día en total. Para casos graves." },
      { nombre: "Alprazolam (gato)", principioActivoReal: "Alprazolam", categoria: "Ansiolítico (benzodiazepina)", dosisMin: 0.01, dosisMax: 0.02, unidad: "mg/kg", via: "VO", frecuencia: "cada 8 h", notas: "Para casos graves." }
    ]
  },
  {
    id: "ansiedad-separacion-perro",
    nombre: "Síndrome de ansiedad por separación (perro)",
    indicacion: "Comportamiento",
    especies: ["perro"],
    notas: "La farmacoterapia es un complemento a la modificación de conducta: suprimir el ritual de salida (simular salidas sin irse, incrementar progresivamente el tiempo fuera), suprimir el ritual de llegada, aumentar el ejercicio físico antes de dejarlo solo, y dejarle un espacio reducido con objetos/prendas del dueño (nunca atado).",
    componentes: [
      { nombre: "Clomipramina", principioActivoReal: "Clomipramina", categoria: "Antidepresivo tricíclico", dosisMin: 1, dosisMax: 3, unidad: "mg/kg", via: "VO", frecuencia: "cada 12 h — ver pauta ascendente en las notas", notas: "Pauta: 1 mg/kg BID las 2 primeras semanas → 2 mg/kg BID semanas 3-4 → 3 mg/kg BID durante el 2º mes → después disminuir hasta la dosis mínima eficaz, a mantener el resto de su vida." }
    ]
  },
  {
    id: "terapia-dirigida-mastocitoma-tumores-kit",
    nombre: "Terapia dirigida (inhibidores de tirosina-quinasa) en mastocitoma y otros tumores KIT+",
    indicacion: "Oncología",
    especies: ["perro"],
    notas: "AVISO IMPORTANTE: la inmensa mayoría de la quimioterapia citotóxica clásica en oncología veterinaria (vinblastina, lomustina, doxorrubicina, carboplatino, cisplatino, ciclofosfamida, clorambucilo, mitoxantrona, vincristina) se dosifica por SUPERFICIE CORPORAL (mg/m²), no por peso — precisamente porque la relación peso-superficie no es lineal y usar mg/kg fijo sería impreciso y peligroso en animales muy pequeños o muy grandes. Esta calculadora solo trabaja en mg/kg, por lo que esos fármacos NO están incluidos aquí a propósito: usar una tabla de conversión peso→m² y un oncólogo/protocolo específico. Los dos inhibidores de tirosina-quinasa de esta ficha (masitinib, toceranib) son la excepción: sí se dosifican por peso (mg/kg). Uso en mastocitoma inoperable/metastásico o recidivante, adenocarcinoma de sacos anales, y como opción en otros carcinomas KIT+. Requieren control analítico (sangre y orina) periódico durante el tratamiento.",
    componentes: [
      { nombre: "Masitinib (Masivet)", principioActivoReal: "Masitinib", categoria: "Inhibidor de tirosina-quinasa (terapia dirigida)", dosisMin: 10, dosisMax: 12.5, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h, tratamiento continuo mientras la enfermedad esté estable o responda (mínimo 6 meses-1 año)", notas: "" },
      { nombre: "Toceranib (Palladia)", principioActivoReal: "Toceranib", categoria: "Inhibidor de tirosina-quinasa (terapia dirigida)", dosisMin: 2.5, dosisMax: 3.2, unidad: "mg/kg", via: "VO", frecuencia: "días alternos (o lunes/miércoles/viernes)", notas: "Combinar habitualmente con un AINE anti-COX2 los días que no se da toceranib (ej. martes/jueves/sábado)." }
    ]
  },
  {
    id: "intoxicacion-oruga-procesionaria",
    nombre: "Envenenamiento por oruga procesionaria del pino",
    indicacion: "Toxicología",
    especies: ["perro"],
    notas: "Iniciar tratamiento cuanto antes. Lavar la zona afectada (lengua/boca) con abundante suero fisiológico SIN FROTAR (frotar rompe los pelos urticantes y libera más toxina, la taumatopeína). Si hay estomatitis, añadir antibioterapia (espiramicina). En casos graves con imposibilidad de comer/beber, hospitalizar para fluidoterapia (sondaje oronasal en casos extremos). Duración del tratamiento variable, habitualmente hasta 10 días.",
    componentes: [
      { nombre: "Prednisolona", principioActivoReal: "Prednisolona", categoria: "Corticoide", dosisMin: 1, dosisMax: 1, unidad: "mg/kg", via: "IM", frecuencia: "cada 24 h", notas: "Alternativa citada: hemisuccinato de metilprednisolona (Urbason) en dosis fijas por tramos de peso (1 ampolla de 8/20/40 mg cada 8/20/40 kg respectivamente, cada 24 h IM) — equivalente aproximado a 1 mg/kg." },
      { nombre: "Dexclorfeniramina maleato (Polaramine)", principioActivoReal: "Dexclorfeniramina", categoria: "Antihistamínico", dosisMin: 0.25, dosisMax: 0.25, unidad: "mg/kg", via: "SC", frecuencia: "cada 24 h, durante 1-3 días", notas: "" },
      { nombre: "Heparina (control de la necrosis, eficacia no demostrada)", principioActivoReal: "Heparina sódica", categoria: "Anticoagulante", dosisMin: 200, dosisMax: 500, unidad: "UI/kg", via: "SC", frecuencia: "cada 8 h", notas: "Citada en la fuente como intento de controlar la necrosis local, sin resultados satisfactorios demostrados." }
    ]
  },
  {
    id: "hipertension-pulmonar-manejo",
    nombre: "Hipertensión pulmonar — vasodilatador pulmonar (sildenafilo)",
    indicacion: "Cardiopulmonar",
    especies: ["perro"],
    notas: "Tarda aproximadamente 1 mes en hacer efecto. Usar con mucha precaución y solo en hipertensión pulmonar GRAVE, no en casos leves o moderados. Controvertido en la HP tipo II (secundaria a cardiopatía izquierda), ya que puede aumentar la congestión venosa pulmonar — valorar caso a caso. CONTRAINDICADO en HP tipo III (enfermedad respiratoria/hipoxia: fibrosis pulmonar, síndrome braquicéfalo, colapso traqueal), ya que en estos casos la vasoconstricción pulmonar es un mecanismo compensador beneficiario (redirige la sangre a zonas mejor ventiladas). En ductus arterioso persistente revertido (shunt derecha-izquierda), se usa desde el principio en pauta TID. Puede retirarse si la regurgitación mitral es < 60 mmHg.",
    componentes: [
      { nombre: "Sildenafilo", principioActivoReal: "Sildenafilo", categoria: "Vasodilatador pulmonar (inhibidor de la PDE5)", dosisMin: 1, dosisMax: 2, unidad: "mg/kg", via: "VO", frecuencia: "cada 8-12 h al inicio, subir si no se controla", notas: "Dosis techo citada: 4-7 mg/kg TID. Ir subiendo progresivamente desde 1-2 mg/kg si no hay cardiopatía izquierda grave y no se controla la clínica." }
    ]
  },
  {
    id: "hernia-discal-manejo-medico-dolor-neurogenico",
    nombre: "Hernia discal — manejo médico del dolor neurogénico (fase aguda y crónica)",
    indicacion: "Neurología",
    especies: ["perro"],
    notas: "Fase aguda con corticoide ya pautado por otra causa: usar tramadol + gabapentina en pauta ascendente (ver componentes) en vez de AINE (no combinar AINE con corticoide). Fase aguda SIN corticoide: AINE + tramadol + gabapentina. Fase crónica: AINE 4-6 semanas (si no mejora, valorar cirugía) + gabapentina 1-3 meses tras retirar el AINE, con retirada progresiva; si no hay buena respuesta, mantener gabapentina de por vida. En cauda equina con compresión: AINE o corticoide + gabapentina de por vida.",
    componentes: [
      { nombre: "Gabapentina (pauta ascendente, fase aguda)", principioActivoReal: "Gabapentina", categoria: "Anticonvulsivante/analgésico neuropático", dosisMin: 10, dosisMax: 20, unidad: "mg/kg", via: "VO", frecuencia: "iniciar a 10 mg/kg TID; a los 5 días subir a 15 mg/kg cada 8-12 h; a los 5 días subir a 20 mg/kg cada 8-12 h si es necesario", notas: "" },
      { nombre: "Pregabalina (alternativa en casos agudos muy dolorosos)", principioActivoReal: "Pregabalina", categoria: "Anticonvulsivante/analgésico neuropático", dosisMin: 4, dosisMax: 4, unidad: "mg/kg", via: "VO", frecuencia: "cada 12 h", notas: "" },
      { nombre: "Tramadol", principioActivoReal: "Tramadol", categoria: "Analgésico opioide", dosisMin: 2, dosisMax: 2, unidad: "mg/kg", via: "VO", frecuencia: "cada 8-12 h", notas: "" }
    ]
  },
  {
    id: "alfaxalona-manejo-disnea-felina",
    nombre: "Sedación mínima para exploración de gato disneico (sin premedicación)",
    indicacion: "Cardiopulmonar / Urgencias",
    especies: ["gato"],
    notas: "Útil para poder explorar (auscultar, radiografiar) a un gato con distrés respiratorio agudo minimizando el manejo/estrés, que por sí solo puede desencadenar una crisis. Puede combinarse con butorfanol.",
    componentes: [
      { nombre: "Alfaxalona", principioActivoReal: "Alfaxalona", categoria: "Anestésico/sedante", dosisMin: 0.5, dosisMax: 1, unidad: "mg/kg", via: "IV o IM", frecuencia: "dosis única, sin premedicación previa", notas: "" }
    ]
  },
  {
    id: "anemia-erc-eritropoyetina-perro",
    nombre: "Anemia asociada a enfermedad renal crónica — eritropoyetina",
    indicacion: "Aparato Urinario",
    especies: ["perro"],
    notas: "Suplementar siempre con hierro, ya que la eritropoyesis estimulada consume rápidamente los depósitos férricos y sin suplementación el tratamiento fracasa (ej. sulfato ferroso 100-300 mg/día en dosis total, o lactato ferroso). Vigilar la posible hipertensión arterial y policitemia excesiva durante el tratamiento.",
    componentes: [
      { nombre: "Epoetina (EPO)", principioActivoReal: "Eritropoyetina", categoria: "Estimulante de la eritropoyesis", dosisMin: 100, dosisMax: 100, unidad: "UI/kg", via: "SC", frecuencia: "3 veces por semana", notas: "" }
    ]
  },
  {
    id: "sedacion-ecocardiografia-perro-acepromazina-butorfanol",
    nombre: "Sedación ecocardiografía perros: acepromacina + butorfanol",
    indicacion: "Técnicas de diagnóstico",
    especies: ["perro"],
    notas: "Protocolo real de la clínica.",
    componentes: [
      { nombre: "Acepromazina", principioActivoReal: "Acepromazina", categoria: "Tranquilizante fenotiazínico", dosisMin: 0.03, dosisMax: 0.03, unidad: "mg/kg", via: "IM/IV", frecuencia: "dosis única", notas: "" },
      { nombre: "Butorfanol", principioActivoReal: "Butorfanol", categoria: "Opioide agonista-antagonista", dosisMin: 0.1, dosisMax: 0.2, unidad: "mg/kg", via: "IM/IV", frecuencia: "dosis única", notas: "" }
    ]
  },
  {
    id: "sedacion-ecocardiografia-perro-acepromazina-buprenorfina",
    nombre: "Sedación ecocardiografía perros: acepromacina + buprenorfina",
    indicacion: "Técnicas de diagnóstico",
    especies: ["perro"],
    notas: "Protocolo real de la clínica.",
    componentes: [
      { nombre: "Acepromazina", principioActivoReal: "Acepromazina", categoria: "Tranquilizante fenotiazínico", dosisMin: 0.03, dosisMax: 0.03, unidad: "mg/kg", via: "IM/IV", frecuencia: "dosis única", notas: "" },
      { nombre: "Buprenorfina", principioActivoReal: "Buprenorfina", categoria: "Analgésico opioide", dosisMin: 0.0075, dosisMax: 0.0075, unidad: "mg/kg", via: "IM/IV", frecuencia: "dosis única", notas: "" }
    ]
  },
  {
    id: "sedacion-ecocardiografia-gato-acepromazina-butorfanol",
    nombre: "Sedación ecocardiografía gatos: acepromacina + butorfanol",
    indicacion: "Técnicas de diagnóstico",
    especies: ["gato"],
    notas: "Protocolo real de la clínica.",
    componentes: [
      { nombre: "Acepromazina", principioActivoReal: "Acepromazina", categoria: "Tranquilizante fenotiazínico", dosisMin: 0.05, dosisMax: 0.05, unidad: "mg/kg", via: "IM/IV", frecuencia: "dosis única", notas: "" },
      { nombre: "Butorfanol", principioActivoReal: "Butorfanol", categoria: "Opioide agonista-antagonista", dosisMin: 0.25, dosisMax: 0.25, unidad: "mg/kg", via: "IM/IV", frecuencia: "dosis única", notas: "" }
    ]
  },
  {
    id: "sedacion-ecocardiografia-gato-midazolam-ketamina",
    nombre: "Sedación ecocardiografía gatos difíciles: midazolam + ketamina",
    indicacion: "Técnicas de diagnóstico",
    especies: ["gato"],
    notas: "Protocolo real de la clínica, para gatos muy agresivos/difíciles de manejar.",
    componentes: [
      { nombre: "Midazolam", principioActivoReal: "Midazolam", categoria: "Ansiolítico (benzodiazepina)", dosisMin: 0.2, dosisMax: 0.2, unidad: "mg/kg", via: "IM/IV", frecuencia: "dosis única", notas: "" },
      { nombre: "Ketamina", principioActivoReal: "Ketamina", categoria: "Anestésico disociativo", dosisMin: 5, dosisMax: 5, unidad: "mg/kg", via: "IM/IV", frecuencia: "dosis única", notas: "" }
    ]
  },
  {
    id: "sedacion-ecocardiografia-gato-alfaxan-butorfanol",
    nombre: "Sedación ecocardiografía gatos: alfaxalona + butorfanol",
    indicacion: "Técnicas de diagnóstico",
    especies: ["gato"],
    notas: "Protocolo real de la clínica.",
    componentes: [
      { nombre: "Alfaxalona", principioActivoReal: "Alfaxalona", categoria: "Anestésico neuroesteroide", dosisMin: 1, dosisMax: 1, unidad: "mg/kg", via: "IM", frecuencia: "dosis única", notas: "" },
      { nombre: "Butorfanol", principioActivoReal: "Butorfanol", categoria: "Opioide agonista-antagonista", dosisMin: 0.3, dosisMax: 0.3, unidad: "mg/kg", via: "IM", frecuencia: "dosis única", notas: "" }
    ]
  },
  {
    id: "sedacion-ecocardiografia-gato-diazepam-alfaxalona",
    nombre: "Sedación ecocardiografía gatos: diazepam + alfaxalona",
    indicacion: "Técnicas de diagnóstico",
    especies: ["gato"],
    notas: "Protocolo real de la clínica.",
    componentes: [
      { nombre: "Diazepam", principioActivoReal: "Diazepam", categoria: "Anticonvulsivante (benzodiazepina)", dosisMin: 0.3, dosisMax: 0.3, unidad: "mg/kg", via: "IV", frecuencia: "dosis única", notas: "" },
      { nombre: "Alfaxalona", principioActivoReal: "Alfaxalona", categoria: "Anestésico neuroesteroide", dosisMin: 1, dosisMax: 3, unidad: "mg/kg", via: "IV", frecuencia: "dosis única", notas: "" }
    ]
  },
  {
    id: "sedacion-cirugia-acepromazina-metadona-ventura",
    nombre: "Sedación/premedicación quirúrgica (protocolo Ventura): acepromacina + metadona",
    indicacion: "Sedación",
    especies: ["perro"],
    notas: "Protocolo real de la clínica.",
    componentes: [
      { nombre: "Acepromazina", principioActivoReal: "Acepromazina", categoria: "Tranquilizante fenotiazínico", dosisMin: 0.02, dosisMax: 0.02, unidad: "mg/kg", via: "IV/IM", frecuencia: "dosis única", notas: "" },
      { nombre: "Metadona", principioActivoReal: "Metadona", categoria: "Analgésico opioide", dosisMin: 0.3, dosisMax: 0.3, unidad: "mg/kg", via: "IV/IM", frecuencia: "dosis única", notas: "" }
    ]
  },
  {
    id: "cardalis-benazepril-espironolactona-perro",
    nombre: "Insuficiencia cardíaca congestiva — Cardalis (benazepril + espironolactona)",
    indicacion: "Cardiopulmonar",
    especies: ["perro"],
    notas: "Dosis de ficha técnica de Cardalis (comprimidos masticables, combinación fija 1:8 benazepril:espironolactona — presentaciones 2,5/20 mg, 5/40 mg y 10/80 mg): un único comprimido diario cubre ambos principios activos a la vez. Si se calcula cada principio activo por separado (ej. para usar otra marca no combinada), asegurarse de administrarlos igualmente una vez al día juntos.",
    componentes: [
      { nombre: "Benazepril", principioActivoReal: "Benazepril", categoria: "IECA (antihipertensivo/cardiorrenal)", dosisMin: 0.25, dosisMax: 0.25, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h", notas: "" },
      { nombre: "Espironolactona", principioActivoReal: "Espironolactona", categoria: "Diurético ahorrador de potasio", dosisMin: 2, dosisMax: 2, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h", notas: "En Cardalis se da una vez al día (a diferencia de la pauta habitual BID de espironolactona sola)." }
    ]
  }
];

// ============================================================
// Reglas de interacción entre fármacos (comprobación del resumen del paciente)
// ============================================================
// IMPORTANTE: esto es una selección curada de interacciones conocidas y bien
// establecidas en farmacología veterinaria (por categoría terapéutica y, en
// algunos casos, por principio activo concreto). NO es una base de datos
// exhaustiva de interacciones ni sustituye la consulta de una fuente de
// referencia (ej. Plumb's) o el criterio clínico. Cada regla compara dos
// "grupos": un fármaco del resumen coincide con un grupo si su categoría
// aparece en `categorias` o si su principio activo contiene alguno de los
// nombres de `principiosActivos`.
const REGLAS_INTERACCION = [
  {
    grupoA: { categorias: ["AINE", "AINE (selectivo COX-2)", "AINE (antagonista del receptor EP4)"] },
    grupoB: { categorias: ["AINE", "AINE (selectivo COX-2)", "AINE (antagonista del receptor EP4)"] },
    gravedad: "alta",
    texto: "Dos AINEs a la vez: riesgo muy elevado de úlcera gastrointestinal, hemorragia digestiva y toxicidad renal. No combinar."
  },
  {
    grupoA: { categorias: ["AINE", "AINE (selectivo COX-2)", "AINE (antagonista del receptor EP4)"] },
    grupoB: { categorias: ["Corticoide"] },
    gravedad: "alta",
    texto: "AINE + corticoide: riesgo muy elevado de úlcera/perforación gastrointestinal. No combinar; si se cambia de uno a otro, respetar un periodo de lavado."
  },
  {
    grupoA: { categorias: ["AINE", "AINE (selectivo COX-2)", "AINE (antagonista del receptor EP4)"] },
    grupoB: { categorias: ["IECA (antihipertensivo/cardiorrenal)", "IECA (antihipertensivo/cardíaco)", "Diurético", "Diurético ahorrador de potasio"] },
    gravedad: "media",
    texto: "AINE + IECA/diurético: mecanismos distintos reducen la perfusión renal; combinados aumentan el riesgo de lesión renal, sobre todo si hay deshidratación o hipotensión. Vigilar función renal e hidratación."
  },
  {
    grupoA: { categorias: ["IECA (antihipertensivo/cardiorrenal)", "IECA (antihipertensivo/cardíaco)"] },
    grupoB: { categorias: ["Diurético ahorrador de potasio"] },
    gravedad: "media",
    texto: "IECA + espironolactona: ambos tienden a retener potasio; vigilar hiperpotasemia, especialmente si hay insuficiencia renal."
  },
  {
    grupoA: { categorias: ["Diurético"] },
    grupoB: { categorias: ["Antiarrítmico/inotrópico (margen terapéutico estrecho)"] },
    gravedad: "media",
    texto: "Furosemida + digoxina: la furosemida puede causar hipopotasemia, lo que aumenta el riesgo de toxicidad digitálica. Vigilar electrolitos y, si es posible, niveles séricos de digoxina."
  },
  {
    grupoA: { categorias: ["Sedante alfa-2 agonista"] },
    grupoB: { categorias: ["Sedante alfa-2 agonista"] },
    gravedad: "media",
    texto: "Dos alfa-2 agonistas a la vez: efecto sedante y cardiovascular (bradicardia, hipotensión) aditivo y difícil de controlar. No es una combinación habitual."
  },
  {
    grupoA: { categorias: ["Opioide agonista parcial"] },
    grupoB: { categorias: ["Opioide agonista-antagonista", "Analgésico opioide"] },
    gravedad: "media",
    texto: "Buprenorfina (agonista parcial) junto a un opioide agonista puro (ej. butorfanol, tramadol): puede antagonizar competitivamente el receptor y reducir la analgesia del otro opioide. Evitar combinarlos salvo pauta específica."
  },
  {
    grupoA: { categorias: ["Antidiabético"] },
    grupoB: { categorias: ["Corticoide"] },
    gravedad: "media",
    texto: "Insulina + corticoide: los corticoides son hiperglucemiantes y antagonizan el efecto de la insulina; puede ser necesario reajustar la dosis de insulina mientras dure el tratamiento."
  },
  {
    grupoA: { categorias: ["Anticonvulsivo"], principiosActivos: ["Fenobarbital"] },
    grupoB: { categorias: ["Antifúngico (triazol)"] },
    gravedad: "media",
    texto: "Fenobarbital induce enzimas hepáticas y puede reducir los niveles de fármacos metabolizados por el hígado (ej. itraconazol); y a la inversa, algunos antifúngicos azólicos pueden aumentar los niveles de fenobarbital. Vigilar eficacia/toxicidad de ambos."
  },
  {
    grupoA: { principiosActivos: ["Metronidazol"] },
    grupoB: { principiosActivos: ["Fenobarbital"] },
    gravedad: "baja",
    texto: "El metronidazol puede inhibir el metabolismo hepático del fenobarbital y aumentar sus niveles séricos. Vigilar signos de sedación excesiva en tratamientos prolongados."
  },
  {
    grupoA: { principiosActivos: ["Doxiciclina"] },
    grupoB: { principiosActivos: ["Sucralfato"] },
    gravedad: "baja",
    texto: "El sucralfato (y antiácidos o lácteos) puede quelar la doxiciclina y reducir su absorción oral: separar la administración al menos 2 horas."
  },
  {
    grupoA: { categorias: ["Antiparasitario (lactona macrocíclica)", "Antiparasitario tópico (lactona macrocíclica)"] },
    grupoB: { categorias: ["Antiparasitario (lactona macrocíclica)", "Antiparasitario tópico (lactona macrocíclica)"] },
    gravedad: "media",
    texto: "Dos lactonas macrocíclicas a la vez (ej. ivermectina + milbemicina/selamectina): riesgo aditivo de neurotoxicidad, especialmente en razas sensibles a la mutación MDR1 (Collie, Pastor Australiano y cruces). Evitar solapar salvo indicación expresa."
  },
  {
    grupoA: { categorias: ["Inhibidor de la síntesis de cortisol"] },
    grupoB: { categorias: ["Diurético ahorrador de potasio", "IECA (antihipertensivo/cardiorrenal)", "IECA (antihipertensivo/cardíaco)"] },
    gravedad: "baja",
    texto: "Trilostano junto a espironolactona/IECA: ambos pueden favorecer la hiperpotasemia y potenciar el efecto sobre la producción de aldosterona/cortisol. Vigilar electrolitos, especialmente al iniciar o ajustar dosis."
  }
];

// ============================================================
// Uso responsable de antibióticos: clasificación EMA/AMEG y
// dosis por indicación clínica (guías cargadas por el usuario)
// ============================================================
// Fuentes:
//  - EMA/AMEG: "Clasificación de las clases de antibióticos para uso veterinario" (informe AMEG, EMA)
//  - AniCura: "Guía de antibióticos de AniCura para tratamiento y profilaxis" (basada en Jessen et al.,
//    Antibiotic Use Guidelines for Companion Animal Practice, 2nd ed., Danish Small Animal Veterinary
//    Association, SvHKS, 2019) y "Guidelines for the use of antibiotics in oral diseases" (AniCura, 2025)
//  - BSAVA/SAMSoc: póster clínico "PROTECT ME - Antibiotic use in our practice" (2026)
// Esto es una selección curada para apoyo a la decisión clínica, no sustituye el cultivo/antibiograma
// ni el criterio del veterinario responsable del caso.

// Categoría EMA/AMEG (A=evitar, B=limitar/uso crítico en humana, C=precaución, D=prudencia/primera línea)
// por principio activo. Cuanto más alta la letra, más se debe restringir su uso por impacto en resistencias.
const CATEGORIA_EMA_ANTIBIOTICOS = {
  "amoxicilina": "D",
  "ampicilina": "D",
  "amoxicilina/ácido clavulánico": "C",
  "cefazolina": "C",
  "cefalexina": "C",
  "cefadroxilo": "C",
  "cefpodoxima": "B",
  "cefovecina": "B",
  "enrofloxacina": "B",
  "marbofloxacina": "B",
  "pradofloxacina": "B",
  "doxiciclina": "D",
  "clindamicina": "C",
  "metronidazol": "D",
  "trimetoprim/sulfametoxazol": "D",
  "azitromicina": "C"
};

const ETIQUETA_CATEGORIA_EMA = {
  A: "Evitar",
  B: "Limitar (uso crítico en humana)",
  C: "Precaución",
  D: "Prudencia (primera línea)"
};

// Cada indicación agrupa las opciones de antibiótico recomendadas por las guías para ese cuadro
// clínico, con su propia dosis y una "prioridad" (1 = primera línea recomendada; números mayores =
// reservar para cuando la primera línea no sea adecuada, haya fracasado o lo indique el antibiograma).
const INDICACIONES_ANTIBIOTICOS = [
  {
    id: "profilaxis-quirurgica",
    nombre: "Profilaxis antibiótica quirúrgica (PAQ)",
    especies: ["perro", "gato"],
    notas: "Solo si está justificada (ver clasificación de heridas/ASA): no en cirugías limpias y cortas (<60 min) sin implante. Administrar 30-60 min antes de la incisión y repetir cada 2 semividas hasta el final de la cirugía. No continuar más de 24 h tras la cirugía; si se continúa, considerarlo tratamiento, no profilaxis. No sustituye la asepsia quirúrgica.",
    fuente: "AniCura Antibiotic Guidelines (2019/2023); BSAVA/SAMSoc PROTECT ME (2026)",
    opciones: [
      { principioActivo: "Cefazolina", prioridad: 1, dosisMin: 20, dosisMax: 30, unidad: "mg/kg", via: "IV", frecuencia: "cada 90-120 min hasta el final de la cirugía", notas: "Dosis mayor en cirugía ósea invasiva." },
      { principioActivo: "Ampicilina", prioridad: 1, dosisMin: 20, dosisMax: 20, unidad: "mg/kg", via: "IV", frecuencia: "cada 2 h hasta el final de la cirugía", notas: "" },
      { principioActivo: "Amoxicilina/Ácido clavulánico", prioridad: 1, dosisMin: 20, dosisMax: 25, unidad: "mg/kg", via: "IV", frecuencia: "cada 90 min hasta el final de la cirugía", notas: "" },
      { principioActivo: "Enrofloxacina", prioridad: 3, dosisMin: 5, dosisMax: 5, unidad: "mg/kg", via: "IV", frecuencia: "añadir a ampicilina/amoxi-clav solo en pacientes ASA 4-5 o con derrame de contenido intestinal/pus abdominal", notas: "Reservar para pacientes de alto riesgo; no de uso rutinario." }
    ]
  },
  {
    id: "heridas-abscesos",
    nombre: "Heridas y abscesos (tratamiento sistémico)",
    especies: ["perro", "gato"],
    notas: "La limpieza mecánica, el desbridamiento y el vendaje son el pilar del tratamiento; el antibiótico sistémico es un complemento, no un sustituto. No indicado en heridas quirúrgicas limpias ni en la mayoría de heridas cicatrizando por segunda intención. Tomar muestra para cultivo en casos recurrentes.",
    fuente: "AniCura Antibiotic Guidelines (2019/2023)",
    opciones: [
      { principioActivo: "Amoxicilina", prioridad: 1, dosisMin: 22, dosisMax: 22, unidad: "mg/kg", via: "VO", frecuencia: "cada 8-12 h", notas: "Para afectación leve-moderada." },
      { principioActivo: "Amoxicilina/Ácido clavulánico", prioridad: 1, dosisMin: 12.5, dosisMax: 12.5, unidad: "mg/kg", via: "VO", frecuencia: "cada 12 h", notas: "Para afectación leve-moderada." },
      { principioActivo: "Trimetoprim/Sulfametoxazol", prioridad: 2, dosisMin: 15, dosisMax: 15, unidad: "mg/kg", via: "VO", frecuencia: "cada 12 h", notas: "Para pacientes de mayor gravedad; no es una opción para procesos purulentos." }
    ]
  },
  {
    id: "pioderma",
    nombre: "Pioderma / infección cutánea (tratamiento sistémico)",
    especies: ["perro", "gato"],
    notas: "El tratamiento tópico (champú/antiséptico) es de primera elección en pioderma superficial y a menudo evita el antibiótico sistémico. El sistémico se reserva para pioderma extensa/profunda, mínimo 14 días, con revisión durante el tratamiento. Realizar cultivo y antibiograma si hay sospecha de multirresistencia (MRSP/MRSA) o cocos+bacilos mixtos.",
    fuente: "AniCura Antibiotic Guidelines (2019/2023)",
    opciones: [
      { principioActivo: "Clindamicina", prioridad: 1, dosisMin: 5.5, dosisMax: 5.5, unidad: "mg/kg", via: "VO", frecuencia: "cada 12 h (u 11 mg/kg cada 24 h)", notas: "Espectro reducido: primera opción en pioderma no complicada. No eficaz frente a bacilos gramnegativos." },
      { principioActivo: "Amoxicilina/Ácido clavulánico", prioridad: 2, dosisMin: 12.5, dosisMax: 12.5, unidad: "mg/kg", via: "VO", frecuencia: "cada 12 h", notas: "Usar cuando se confirme resistencia a las opciones de espectro reducido." },
      { principioActivo: "Cefadroxilo", prioridad: 2, dosisMin: 20, dosisMax: 20, unidad: "mg/kg", via: "VO", frecuencia: "cada 12 h", notas: "Usar cuando se confirme resistencia a las opciones de espectro reducido." },
      { principioActivo: "Cefalexina", prioridad: 2, dosisMin: 25, dosisMax: 25, unidad: "mg/kg", via: "VO", frecuencia: "cada 12 h", notas: "Usar cuando se confirme resistencia a las opciones de espectro reducido." },
      { principioActivo: "Trimetoprim/Sulfametoxazol", prioridad: 2, dosisMin: 15, dosisMax: 15, unidad: "mg/kg", via: "VO", frecuencia: "cada 12 h", notas: "Usar cuando se confirme resistencia a las opciones de espectro reducido." },
      { principioActivo: "Enrofloxacina", prioridad: 3, dosisMin: 5, dosisMax: 20, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h", notas: "Reservar para resistencia a los dos grupos anteriores. En gatos no superar la dosis de ficha técnica; con función renal reducida, evitar." },
      { principioActivo: "Marbofloxacina", prioridad: 3, dosisMin: 2, dosisMax: 2, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h", notas: "Reservar para resistencia a los dos grupos anteriores." },
      { principioActivo: "Pradofloxacina", prioridad: 3, dosisMin: 3, dosisMax: 4.5, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h", notas: "Reservar para resistencia a los dos grupos anteriores." }
    ]
  },
  {
    id: "gastroenteritis-hemorragica-grave",
    nombre: "Gastroenteritis hemorrágica aguda grave con sepsis",
    especies: ["perro", "gato"],
    notas: "El antibiótico solo está indicado si hay signos de sepsis (taquicardia, taquipnea, hipo/hipertermia, leucocitosis o neutropenia con desviación a la izquierda, hipoglucemia, choque séptico). La diarrea aguda sin signos de sepsis NO debe tratarse con antibióticos. Retirar en cuanto mejore la condición clínica.",
    fuente: "AniCura Antibiotic Guidelines (2019/2023)",
    opciones: [
      { principioActivo: "Ampicilina", prioridad: 1, dosisMin: 25, dosisMax: 25, unidad: "mg/kg", via: "IV", frecuencia: "cada 6-8 h", notas: "Combinar con enrofloxacina IV." },
      { principioActivo: "Amoxicilina/Ácido clavulánico", prioridad: 1, dosisMin: 12.5, dosisMax: 12.5, unidad: "mg/kg", via: "IV", frecuencia: "cada 12 h", notas: "Alternativa a ampicilina; combinar con enrofloxacina IV." },
      { principioActivo: "Enrofloxacina", prioridad: 1, dosisMin: 5, dosisMax: 5, unidad: "mg/kg", via: "IV", frecuencia: "cada 24 h", notas: "Administrar junto con ampicilina o amoxi-clav, no en monoterapia." }
    ]
  },
  {
    id: "colitis-granulomatosa-ecai",
    nombre: "Colitis granulomatosa asociada a E. coli invasiva (ECAI)",
    especies: ["perro"],
    notas: "Única enteropatía crónica con etiología bacteriana primaria confirmada (más frecuente en bóxer y bulldog francés). Requiere diagnóstico histopatológico (idealmente con técnica FISH) antes de tratar; en el resto de diarreas crónicas los antibióticos ya NO están justificados como ensayo diagnóstico.",
    fuente: "AniCura Antibiotic Guidelines (2019/2023)",
    opciones: [
      { principioActivo: "Enrofloxacina", prioridad: 1, dosisMin: 5, dosisMax: 10, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h, durante 8-10 semanas", notas: "" },
      { principioActivo: "Marbofloxacina", prioridad: 1, dosisMin: 2, dosisMax: 5, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h, durante 8-10 semanas", notas: "" }
    ]
  },
  {
    id: "rinitis-cric-fiebre",
    nombre: "Rinitis / complejo respiratorio infeccioso canino con fiebre",
    especies: ["perro", "gato"],
    notas: "La mayoría de rinitis agudas y del CRIC (\"tos de las perreras\") son virales y remiten solas en 1-2 semanas: NO tratar con antibiótico si no hay fiebre/anorexia ni afectación sistémica. Reservar el antibiótico para fiebre y anorexia con secreción mucopurulenta, o resistencia al tratamiento sintomático tras 10 días.",
    fuente: "AniCura Antibiotic Guidelines (2019/2023)",
    opciones: [
      { principioActivo: "Doxiciclina", prioridad: 1, dosisMin: 5, dosisMax: 10, unidad: "mg/kg", via: "VO", frecuencia: "cada 12-24 h, durante 7 días", notas: "5 mg/kg cada 12 h o 10 mg/kg cada 24 h." }
    ]
  },
  {
    id: "neumonia",
    nombre: "Neumonía bacteriana",
    especies: ["perro", "gato"],
    notas: "Confirmar con hallazgos clínicos y radiográficos (3 proyecciones). Duración recomendada por AniCura: 7 días, con revisión antes de suspender. Si no responde en 2-3 días, reevaluar diagnóstico y tomar cultivo antes de cambiar de antibiótico.",
    fuente: "AniCura Antibiotic Guidelines (2019/2023); BSAVA/SAMSoc PROTECT ME (2026)",
    opciones: [
      { principioActivo: "Doxiciclina", prioridad: 1, dosisMin: 10, dosisMax: 10, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h", notas: "Preferible si se sospecha secundaria a enfermedad respiratoria infecciosa (\"tos de las perreras\") o ETRS felina. Paciente ambulatorio, sin síntomas sistémicos." },
      { principioActivo: "Amoxicilina", prioridad: 1, dosisMin: 22, dosisMax: 22, unidad: "mg/kg", via: "VO", frecuencia: "cada 8-12 h", notas: "Paciente ambulatorio, sin síntomas sistémicos; aumentar la frecuencia por ser tiempo-dependiente." },
      { principioActivo: "Ampicilina", prioridad: 2, dosisMin: 20, dosisMax: 30, unidad: "mg/kg", via: "IV", frecuencia: "cada 8 h", notas: "Paciente hospitalizado sin signos de sepsis." },
      { principioActivo: "Enrofloxacina", prioridad: 3, dosisMin: 5, dosisMax: 5, unidad: "mg/kg", via: "IV", frecuencia: "cada 24 h", notas: "Añadir a ampicilina solo si hay signos de sepsis." }
    ]
  },
  {
    id: "piotorax",
    nombre: "Piotórax",
    especies: ["perro", "gato"],
    notas: "El drenaje torácico (con o sin lavado) es imprescindible junto al antibiótico. Tomar muestra para citología y cultivo aerobio/anaerobio antes de iniciar tratamiento cuando sea posible.",
    fuente: "AniCura Antibiotic Guidelines (2019/2023)",
    opciones: [
      { principioActivo: "Ampicilina", prioridad: 1, dosisMin: 20, dosisMax: 30, unidad: "mg/kg", via: "IV", frecuencia: "cada 8 h", notas: "Combinar con enrofloxacina IV mientras se esperan resultados de cultivo." },
      { principioActivo: "Enrofloxacina", prioridad: 1, dosisMin: 5, dosisMax: 5, unidad: "mg/kg", via: "IV", frecuencia: "cada 24 h", notas: "Combinar con ampicilina, no en monoterapia." },
      { principioActivo: "Trimetoprim/Sulfametoxazol", prioridad: 2, dosisMin: 30, dosisMax: 30, unidad: "mg/kg", via: "IV/IM/SC", frecuencia: "cada 12 h", notas: "Si se sospecha Nocardia spp. (organismos filamentosos en citología)." }
    ]
  },
  {
    id: "itu-esporadica-perro",
    nombre: "Cistitis bacteriana esporádica (perro)",
    especies: ["perro"],
    notas: "A menudo remite sola; considerar \"esperar y observar\" 2-5 días con analgesia/AINE antes de antibiótico si no hay contraindicación. No se recomienda cultivo de rutina en el primer episodio no complicado. Duración corta (3-5 días) si responde bien.",
    fuente: "AniCura Antibiotic Guidelines (2019/2023); BSAVA/SAMSoc PROTECT ME (2026)",
    opciones: [
      { principioActivo: "Trimetoprim/Sulfametoxazol", prioridad: 1, dosisMin: 15, dosisMax: 15, unidad: "mg/kg", via: "VO", frecuencia: "cada 12 h, 3-5 días", notas: "" },
      { principioActivo: "Amoxicilina", prioridad: 1, dosisMin: 10, dosisMax: 10, unidad: "mg/kg", via: "VO", frecuencia: "cada 12 h, 3-5 días", notas: "" }
    ]
  },
  {
    id: "itu-esporadica-gato",
    nombre: "Cistitis bacteriana esporádica (gato)",
    especies: ["gato"],
    notas: "La ITU verdadera es poco frecuente en gatos con síntomas del tracto urinario inferior (la cistitis idiopática felina es mucho más común: no tratar con antibiótico). Tratamiento inicial con analgesia/AINE; añadir antibiótico 3-4 días después solo si persisten los síntomas.",
    fuente: "AniCura Antibiotic Guidelines (2019/2023)",
    opciones: [
      { principioActivo: "Amoxicilina", prioridad: 1, dosisMin: 10, dosisMax: 10, unidad: "mg/kg", via: "VO", frecuencia: "cada 12 h, 3-5 días", notas: "" }
    ]
  },
  {
    id: "itu-recurrente",
    nombre: "Cistitis bacteriana recurrente/persistente",
    especies: ["perro", "gato"],
    notas: "Cultivo y antibiograma obligatorios (≥3 episodios/año). Investigar causa predisponente (urolitiasis, anomalías anatómicas, prostatitis, endocrinopatías). Duración de hasta 14 días en infecciones persistentes; en reinfección con el mismo germen, puede bastar repetir la pauta que funcionó antes 3-5 días.",
    fuente: "AniCura Antibiotic Guidelines (2019/2023); BSAVA/SAMSoc PROTECT ME (2026)",
    opciones: [
      { principioActivo: "Amoxicilina", prioridad: 1, dosisMin: 10, dosisMax: 10, unidad: "mg/kg", via: "VO", frecuencia: "cada 12 h, 7-14 días", notas: "Ajustar según antibiograma." },
      { principioActivo: "Trimetoprim/Sulfametoxazol", prioridad: 1, dosisMin: 15, dosisMax: 15, unidad: "mg/kg", via: "VO", frecuencia: "cada 12 h, 7-14 días", notas: "Ajustar según antibiograma." }
    ]
  },
  {
    id: "prostatitis",
    nombre: "Prostatitis bacteriana",
    especies: ["perro"],
    notas: "La terapia antiandrogénica (castración quirúrgica o médica) está siempre indicada, incluso con antibiótico. Elegir el antibiótico considerando su penetración en la barrera sangre-próstata. Cultivo y antibiograma recomendados.",
    fuente: "AniCura Antibiotic Guidelines (2019/2023); BSAVA/SAMSoc PROTECT ME (2026)",
    opciones: [
      { principioActivo: "Trimetoprim/Sulfametoxazol", prioridad: 1, dosisMin: 15, dosisMax: 30, unidad: "mg/kg", via: "VO", frecuencia: "cada 12 h, 14 días (hasta 2-4 semanas)", notas: "Buena penetración prostática; primera elección." },
      { principioActivo: "Enrofloxacina", prioridad: 2, dosisMin: 5, dosisMax: 5, unidad: "mg/kg", via: "IV", frecuencia: "cada 24 h", notas: "Reservar para riesgo vital o absceso prostático." }
    ]
  },
  {
    id: "pielonefritis-perro",
    nombre: "Pielonefritis (perro)",
    especies: ["perro"],
    notas: "Realizar siempre cultivo y antibiograma (orina ± hemocultivo si hay fiebre/inmunodepresión). Tratamiento empírico inicial mientras se esperan resultados; ajustar después. Duración habitual 10-14 días.",
    fuente: "AniCura Antibiotic Guidelines (2019/2023)",
    opciones: [
      { principioActivo: "Cefalexina", prioridad: 1, dosisMin: 25, dosisMax: 25, unidad: "mg/kg", via: "VO", frecuencia: "cada 8 h", notas: "" },
      { principioActivo: "Enrofloxacina", prioridad: 2, dosisMin: 5, dosisMax: 5, unidad: "mg/kg", via: "VO/IM/SC", frecuencia: "cada 24 h", notas: "Reservar las fluoroquinolonas para cuadros con riesgo vital." },
      { principioActivo: "Marbofloxacina", prioridad: 2, dosisMin: 2, dosisMax: 2, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h", notas: "Reservar las fluoroquinolonas para cuadros con riesgo vital." },
      { principioActivo: "Pradofloxacina", prioridad: 2, dosisMin: 3, dosisMax: 3, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h", notas: "Reservar las fluoroquinolonas para cuadros con riesgo vital." }
    ]
  },
  {
    id: "pielonefritis-gato",
    nombre: "Pielonefritis (gato)",
    especies: ["gato"],
    notas: "Realizar siempre cultivo y antibiograma. Duración habitual 10-14 días. Con función renal reducida, evitar enrofloxacina y marbofloxacina.",
    fuente: "AniCura Antibiotic Guidelines (2019/2023)",
    opciones: [
      { principioActivo: "Amoxicilina", prioridad: 1, dosisMin: 15, dosisMax: 15, unidad: "mg/kg", via: "VO", frecuencia: "cada 8 h", notas: "" },
      { principioActivo: "Cefalexina", prioridad: 1, dosisMin: 25, dosisMax: 25, unidad: "mg/kg", via: "VO", frecuencia: "cada 12 h", notas: "Algunos gatos pueden necesitar 3 veces al día para concentración tisular eficaz." },
      { principioActivo: "Enrofloxacina", prioridad: 2, dosisMin: 5, dosisMax: 5, unidad: "mg/kg", via: "VO/IM/SC", frecuencia: "cada 24 h", notas: "Evitar con función renal reducida. Reservar para cuadros con riesgo vital." },
      { principioActivo: "Marbofloxacina", prioridad: 2, dosisMin: 2, dosisMax: 2, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h", notas: "Evitar con función renal reducida. Reservar para cuadros con riesgo vital." },
      { principioActivo: "Pradofloxacina", prioridad: 2, dosisMin: 3, dosisMax: 3, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h", notas: "Reservar para cuadros con riesgo vital." }
    ]
  },
  {
    id: "odontologia-tratamiento",
    nombre: "Odontología: absceso con celulitis facial / osteomielitis confirmada",
    especies: ["perro", "gato"],
    notas: "La gran mayoría de patología dental (periodontitis, gingivitis, diente fracturado, absceso sin celulitis) NO se trata con antibiótico: el tratamiento es mecánico (extracción, endodoncia, limpieza) ± analgesia. El antibiótico solo se justifica con celulitis facial evidente u osteomielitis confirmada por histopatología.",
    fuente: "AniCura \"Guidelines for the use of antibiotics in oral diseases\" (2025)",
    opciones: [
      { principioActivo: "Amoxicilina/Ácido clavulánico", prioridad: 1, dosisMin: 20, dosisMax: 20, unidad: "mg/kg", via: "VO", frecuencia: "cada 12 h, 5 días (celulitis facial) o 2 semanas (osteomielitis confirmada)", notas: "Combinar con extracción/tratamiento mecánico lo antes posible; no sustituye al tratamiento dental." },
      { principioActivo: "Clindamicina", prioridad: 2, dosisMin: 5.5, dosisMax: 11, unidad: "mg/kg", via: "VO", frecuencia: "cada 12 h, 7 días (11 mg/kg cada 12-24 h 4 semanas si hay osteomielitis)", notas: "Buena penetración ósea; alternativa razonable." }
    ]
  },
  {
    id: "odontologia-profilaxis",
    nombre: "Odontología: profilaxis quirúrgica en pacientes de riesgo",
    especies: ["perro", "gato"],
    notas: "Solo en pacientes ASA ≥3, inmunodeprimidos, con fracturas mandibulares que comunican con la boca, estenosis subaórtica/aórtica, marcapasos, endocarditis bacteriana previa u osteosíntesis reciente con placas/tornillos que requieran limpieza dental. NO indicada de forma rutinaria antes de limpiezas/extracciones simples.",
    fuente: "AniCura \"Guidelines for the use of antibiotics in oral diseases\" (2025)",
    opciones: [
      { principioActivo: "Amoxicilina/Ácido clavulánico", prioridad: 1, dosisMin: 20, dosisMax: 25, unidad: "mg/kg", via: "IV", frecuencia: "cada 90 min hasta el final del procedimiento", notas: "No continuar después de la cirugía salvo indicación terapéutica." },
      { principioActivo: "Ampicilina", prioridad: 1, dosisMin: 20, dosisMax: 20, unidad: "mg/kg", via: "IV", frecuencia: "cada 60 min hasta el final del procedimiento", notas: "" }
    ]
  },
  {
    id: "sepsis-bacteriemia",
    nombre: "Bacteriemia / sepsis",
    especies: ["perro", "gato"],
    notas: "Tomar muestras (orina, bilis, derrames, lavado de vías respiratorias) para identificar el foco antes de iniciar el tratamiento, siempre que sea posible. Control quirúrgico del foco si procede. Pasar a vía oral en cuanto mejore la clínica.",
    fuente: "BSAVA/SAMSoc PROTECT ME (2026)",
    opciones: [
      { principioActivo: "Amoxicilina/Ácido clavulánico", prioridad: 1, dosisMin: 20, dosisMax: 20, unidad: "mg/kg", via: "IV", frecuencia: "cada 8 h", notas: "" },
      { principioActivo: "Enrofloxacina", prioridad: 2, dosisMin: 10, dosisMax: 10, unidad: "mg/kg", via: "IV", frecuencia: "cada 24 h (perro)", notas: "Si ha recibido un betalactámico en los últimos 3 meses; combinar con clindamicina o metronidazol." },
      { principioActivo: "Marbofloxacina", prioridad: 2, dosisMin: 5, dosisMax: 5, unidad: "mg/kg", via: "IV", frecuencia: "cada 24 h (gato)", notas: "Si ha recibido un betalactámico en los últimos 3 meses; combinar con clindamicina o metronidazol." },
      { principioActivo: "Clindamicina", prioridad: 2, dosisMin: 11, dosisMax: 11, unidad: "mg/kg", via: "IV", frecuencia: "cada 12 h", notas: "Combinar con fluoroquinolona si ha recibido un betalactámico en los últimos 3 meses." },
      { principioActivo: "Metronidazol", prioridad: 2, dosisMin: 10, dosisMax: 10, unidad: "mg/kg", via: "IV", frecuencia: "cada 12 h", notas: "Alternativa a clindamicina en el mismo esquema." }
    ]
  },
  {
    id: "peritonitis-septica",
    nombre: "Peritonitis séptica",
    especies: ["perro", "gato"],
    notas: "El control quirúrgico definitivo del foco (lavado, cierre de la perforación, drenaje) es esencial y no puede sustituirse por el antibiótico. Pasar a vía oral en cuanto mejore la clínica; en medicina humana se usan pautas de hasta 4 días tras el control del foco.",
    fuente: "BSAVA/SAMSoc PROTECT ME (2026)",
    opciones: [
      { principioActivo: "Amoxicilina/Ácido clavulánico", prioridad: 1, dosisMin: 20, dosisMax: 20, unidad: "mg/kg", via: "IV", frecuencia: "cada 8 h", notas: "Añadir metronidazol si hay perforación colónica." },
      { principioActivo: "Metronidazol", prioridad: 2, dosisMin: 10, dosisMax: 10, unidad: "mg/kg", via: "IV", frecuencia: "cada 12 h", notas: "Añadir a amoxi-clav si hay perforación colónica, o si amoxi-clav no está disponible, junto con cefazolina." },
      { principioActivo: "Cefazolina", prioridad: 2, dosisMin: 20, dosisMax: 20, unidad: "mg/kg", via: "IV", frecuencia: "cada 8 h", notas: "Si amoxi-clav no está disponible, combinar con clindamicina o metronidazol." }
    ]
  },
  {
    id: "infeccion-respiratoria-felina",
    nombre: "Infección respiratoria felina (incl. micoplasma)",
    especies: ["gato"],
    notas: "Micoplasma respiratorio suele cursar como rinosinusitis crónica (diagnóstico por PCR). En procesos crónicos, cultivar también para criptococo y aspergillus, y descartar pólipos/estenosis nasofaríngea y rinitis crónica inmunomediada antes de repetir tandas de antibiótico.",
    fuente: "Protocolo interno de la clínica (guía reorganizada)",
    opciones: [
      { principioActivo: "Doxiciclina", prioridad: 1, dosisMin: 5, dosisMax: 10, unidad: "mg/kg", via: "VO", frecuencia: "10 mg/kg cada 24 h o 5 mg/kg cada 12 h", notas: "Primera elección. Dar con comida o abundante agua para evitar esofagitis; en gatitos jóvenes puede teñir el esmalte dental." },
      { principioActivo: "Marbofloxacina", prioridad: 2, dosisMin: 2, dosisMax: 2, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h", notas: "Segunda opción si no hay respuesta a doxiciclina." },
      { principioActivo: "Pradofloxacina", prioridad: 2, dosisMin: 3, dosisMax: 4.5, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h", notas: "Segunda opción si no hay respuesta a doxiciclina." },
      { principioActivo: "Azitromicina", prioridad: 3, dosisMin: 5, dosisMax: 10, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h", notas: "Tercera opción." }
    ]
  },
  {
    id: "giardiasis-tricomoniasis",
    nombre: "Giardiasis y tricomoniasis",
    especies: ["perro", "gato"],
    notas: "Diferenciar por movimiento: Giardia tiene movimiento ondulante, Trichomonas avanza en línea recta. En cachorros con tricomoniasis la diarrea suele mejorar al hacerse adultos pero reaparece a los 6-7 años; no responden bien a tratamientos habituales. El fenbendazol es útil para diferenciar diarrea por Giardia (responde) de otras causas, ya que solo actúa sobre Giardia (el metronidazol además es inmunomodulador, antibacteriano y antiparasitario general). En Giardia resistente: pauta de 5 días tratamiento - 15 descanso - 5 tratamiento - 2 meses descanso - 5 días tratamiento.",
    fuente: "Protocolo interno de la clínica (guía reorganizada)",
    opciones: [
      { principioActivo: "Fenbendazol", prioridad: 1, dosisMin: 50, dosisMax: 50, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h, 3 días (Giardia); 5 días (Trichomonas)", notas: "Si no desaparece la Giardia, prolongar 4 días más." },
      { principioActivo: "Furazolidona", prioridad: 2, dosisMin: 4, dosisMax: 4, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h, 5-10 días", notas: "Solo gatos, para Giardia. Puede provocar vómito y/o diarrea; no usar en hembras gestantes." },
      { principioActivo: "Metronidazol", prioridad: 2, dosisMin: 15, dosisMax: 15, unidad: "mg/kg", via: "VO", frecuencia: "cada 12 h, 7-10 días", notas: "Para Trichomonas." },
      { principioActivo: "Ronidazol", prioridad: 3, dosisMin: 30, dosisMax: 30, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h, 15 días", notas: "Para Trichomonas resistente; el más efectivo pero neurotóxico. No usar en animales < 3 meses; si aparecen signos neurológicos, suspender. La curación puede tardar 1-1,5 años." }
    ]
  },
  {
    id: "criptosporidiosis",
    nombre: "Criptosporidiosis",
    especies: ["perro", "gato"],
    notas: "Ningún tratamiento ha demostrado frenar la infección de forma definitiva (es en el fondo un problema de inmunidad del paciente); aun así pueden usarse estas opciones de soporte.",
    fuente: "Protocolo interno de la clínica (guía reorganizada)",
    opciones: [
      { principioActivo: "Tilosina", prioridad: 1, dosisMin: 10, dosisMax: 15, unidad: "mg/kg", via: "VO", frecuencia: "cada 12 h, 7-10 días", notas: "" },
      { principioActivo: "Azitromicina", prioridad: 1, dosisMin: 10, dosisMax: 10, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h, 7-10 días", notas: "" },
      { principioActivo: "Nitazoxanida", prioridad: 2, dosisMin: 25, dosisMax: 25, unidad: "mg/kg", via: "VO", frecuencia: "cada 12 h, 7-10 días", notas: "" }
    ]
  },
  {
    id: "ehrlichiosis-canina",
    nombre: "Ehrlichiosis canina",
    especies: ["perro"],
    notas: "Parásito intracelular obligado de monocitos (E. canis); menos del 1% de los monocitos suelen estar parasitados, por lo que la detección directa es difícil (usar técnicas de leucoconcentración). Por los fenómenos inmunológicos asociados, se recomienda añadir corticoides junto con levamisol como inmunoestimulante. En la forma crónica la leucopenia se asocia a alta mortalidad.",
    fuente: "Protocolo interno de la clínica (guía reorganizada)",
    opciones: [
      { principioActivo: "Doxiciclina", prioridad: 1, dosisMin: 10, dosisMax: 10, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h, 28 días", notas: "" },
      { principioActivo: "Dipropionato de imidocarb", prioridad: 2, dosisMin: 5, dosisMax: 5, unidad: "mg/kg", via: "IM", frecuencia: "dosis única, repetir a los 15 días", notas: "" },
      { principioActivo: "Oxitetraciclina", prioridad: 3, dosisMin: 30, dosisMax: 30, unidad: "mg/kg", via: "VO", frecuencia: "cada 12 h, 14 días", notas: "No cura la infección (solo mejora clínica); opción menos eficaz que doxiciclina." }
    ]
  },
  {
    id: "toxoplasmosis-meningitis",
    nombre: "Toxoplasmosis con afectación de SNC (meningitis)",
    especies: ["perro", "gato"],
    notas: "Enfermedad poco frecuente en perro; una meningitis por toxoplasma es grave. Descartar antes meningitis corticorespondedora/necrotizante si la clínica no encaja o no responde. La clindamicina no atraviesa bien la barrera hematoencefálica pero sí es eficaz en la miositis toxoplásmica; para afectación de SNC se prefiere trimetoprim-sulfadiazina + pirimetamina + ácido fólico (la pirimetamina es antagonista del ácido fólico, hay que suplementarlo para evitar mielosupresión).",
    fuente: "Protocolo interno de la clínica (guía reorganizada)",
    opciones: [
      { principioActivo: "Clindamicina", prioridad: 1, dosisMin: 25, dosisMax: 25, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h dividido en 2 tomas (BID)", notas: "De elección según Pelegrino; no atraviesa bien la barrera hematoencefálica, mejor para miositis que para meningitis." },
      { principioActivo: "Trimetoprim/Sulfadiazina + Pirimetamina", prioridad: 2, dosisMin: 15, dosisMax: 15, unidad: "mg/kg", via: "VO", frecuencia: "trimetoprim-sulfadiazina 15 mg/kg BID; añadir pirimetamina 0,25-0,5 mg/kg BID", notas: "Asociar siempre ácido fólico (0,5-5 mg/día) para prevenir la mielosupresión por la pirimetamina. Considerado tratamiento de elección para meningitis por algunos autores, segunda opción por otros." }
    ]
  }
];

// ---- Dosis según uso/procedimiento concreto (independiente de los protocolos combinados) ----
// Algunos fármacos usan dosis muy distintas según para qué se administran, no solo según
// especie (ej. acepromazina para ecocardiografía necesita una dosis mucho menor que para
// premedicación normal, porque hay que evitar alterar la frecuencia cardíaca/contractilidad).
// Cada entrada añade, para un principioActivo de DRUGS, una lista de "usos" alternativos a la
// dosis de referencia por defecto del fármaco, cada uno con su propia dosis por especie.
const USOS_ESPECIFICOS_FARMACO = [
  {
    principioActivo: "Prednisolona",
    usos: [
      {
        nombre: "Paniculitis nodular estéril",
        especies: {
          perro: { dosisMin: 1, dosisMax: 1, unidad: "mg/kg", via: "VO", frecuencia: "cada 12 h, reducir cuando mejoren las lesiones", notas: "Dosis alta. Alternativa: nicotinamida+tetraciclina (dosis fija según peso, ver protocolo de Lupus eritematoso) + DHA 200 mg/kg por la noche." }
        }
      },
      {
        nombre: "Otitis externa proliferativa",
        especies: {
          perro: { dosisMin: 2, dosisMax: 5, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h 7-10 días, luego cada 48 h varias semanas", notas: "Asociar con antibiótico. Una vez reducida la inflamación, pasar a tratamiento tópico. Descartar hipotiroidismo/alergia como causa primaria." }
        }
      },
      {
        nombre: "Piogranulomas/foliculitis interdigital estéril",
        especies: {
          perro: { dosisMin: 2.2, dosisMax: 2.2, unidad: "mg/kg", via: "VO", frecuencia: "cada 24 h hasta mejoría", notas: "Descartar hipotiroidismo." }
        }
      },
      {
        nombre: "Pioderma juvenil / celulitis juvenil",
        especies: {
          perro: { dosisMin: 1, dosisMax: 2, unidad: "mg/kg", via: "VO", frecuencia: "cada 12 h 7-10 días, luego reducir 6-10 semanas", notas: "Celulitis juvenil: 2 mg/kg SID, controlando la infección concurrente." }
        }
      }
    ]
  },
  {
    principioActivo: "Metilprednisolona",
    usos: [
      {
        nombre: "Úlcera eosinofílica felina",
        especies: {
          gato: { dosisMin: 5, dosisMax: 5, unidad: "mg/kg", via: "SC/IM", frecuencia: "cada 2-3 semanas, 3 dosis, luego cada 3 meses", notas: "" }
        }
      },
      {
        nombre: "Alergia felina (forma crónica, inyectable)",
        especies: {
          gato: { dosisMin: 4, dosisMax: 4, unidad: "mg/kg", via: "SC", frecuencia: "cada 3 meses", notas: "En casos agudos usar acetato de metilprednisolona a dosis fija (40 mg/gato SC, 2 dosis/semana) + clorfeniramina + trimetoprim/sulfa — dosis fijas no incluidas aquí." }
        }
      }
    ]
  },
  {
    principioActivo: "Trilostano",
    usos: [
      {
        nombre: "Protocolo real de la clínica (dosis menor, BID)",
        especies: {
          perro: { dosisMin: 0.2, dosisMax: 1, unidad: "mg/kg", via: "VO, con alimento", frecuencia: "cada 12 h (empezar a 0,2-0,5 mg/kg BID)", notas: "Dosis distinta a la de ficha técnica (Vetoryl recomienda 1-3 mg/kg SID — ver ficha de referencia del fármaco). La experiencia de la clínica es que dosis de inicio menores BID tienen eficacia igual o mejor que dosis altas, con muchos menos efectos adversos. Empezar en domingo; reducir la comida a 1/3 el viernes/sábado previos. Revisión a los 7 días con ACTH 2-3 h post-trilostano; objetivo cortisol post-ACTH 1,5-5,5 µg/dl y densidad urinaria >1020. Si cortisol <1,5, subir dosis BID un 25%. La dosis final habitual está entre 0,2 y 1,0 mg/kg BID. NUNCA administrar si el perro tiene poco apetito." }
        }
      }
    ]
  },
  {
    principioActivo: "Acepromazina",
    usos: [
      {
        nombre: "Sedación oral / ansiolisis (consulta, transporte, ruidos)",
        especies: {
          perro: { dosisMin: 0.5, dosisMax: 2.2, unidad: "mg/kg", via: "VO", frecuencia: "1-2 h antes del evento; efecto hasta 6-8 h", notas: "Dosis oral muy superior a la parenteral por su menor biodisponibilidad por esta vía. No es un ansiolítico verdadero (no actúa sobre el miedo/ansiedad de base, solo sedación); valorar asociar gabapentina si hay ansiedad marcada." },
          gato: { dosisMin: 0.5, dosisMax: 1, unidad: "mg/kg", via: "VO", frecuencia: "1-2 h antes del evento; efecto hasta 6-8 h", notas: "Dosis oral muy superior a la parenteral por su menor biodisponibilidad por esta vía." }
        }
      }
    ]
  },
  {
    principioActivo: "Ketamina",
    usos: [
      {
        nombre: "Analgesia a dosis subanestésica (bolo adyuvante)",
        especies: {
          perro: { dosisMin: 0.25, dosisMax: 0.5, unidad: "mg/kg", via: "IV/IM", frecuencia: "dosis única (bolo); en infusión continua se calcula aparte por mcg/kg/min", notas: "A esta dosis no produce anestesia disociativa; se usa como adyuvante analgésico (antagonista NMDA) junto a opioides, no en monoterapia para el dolor." },
          gato: { dosisMin: 0.25, dosisMax: 0.5, unidad: "mg/kg", via: "IV/IM", frecuencia: "dosis única (bolo); en infusión continua se calcula aparte por mcg/kg/min", notas: "A esta dosis no produce anestesia disociativa; se usa como adyuvante analgésico (antagonista NMDA) junto a opioides, no en monoterapia para el dolor." }
        }
      }
    ]
  },
  {
    principioActivo: "Butorfanol",
    usos: [
      {
        nombre: "Antitusígeno",
        especies: {
          perro: { dosisMin: 0.05, dosisMax: 0.1, unidad: "mg/kg", via: "VO/SC", frecuencia: "cada 6-12 h", notas: "Dosis menor que la analgésica habitual. Uso típico en colapso traqueal o tos de las perreras no complicada." }
        }
      },
      {
        nombre: "Premedicación combinada con alfa-2 agonista o acepromazina",
        especies: {
          perro: { dosisMin: 0.2, dosisMax: 0.3, unidad: "mg/kg", via: "IV/IM/SC", frecuencia: "dosis única (premedicación)", notas: "Dosis en el extremo alto del rango analgésico, para potenciar la sedación al combinarlo con un sedante." },
          gato: { dosisMin: 0.2, dosisMax: 0.3, unidad: "mg/kg", via: "IV/IM/SC", frecuencia: "dosis única (premedicación)", notas: "Dosis en el extremo alto del rango analgésico, para potenciar la sedación al combinarlo con un sedante." }
        }
      }
    ]
  }
];

// ---- Listado de productos recomendados por el hospital ----
// Transcripción mecánica del listado interno (marca, laboratorio, composición, orden de recomendación).
// No implica juicio clínico: el "orden de recomendación" es una decisión de compras/acuerdo del hospital,
// no una valoración de eficacia. Se usa para mostrar, junto a la ficha de cada fármaco, qué marcas están
// disponibles en el hospital y su grado de recomendación de compra.
const ETIQUETA_ORDEN_HOSPITAL = {
  "Recomendado - Primera Opción": { texto: "Recomendado · primera opción", clase: "primera" },
  "Recomendado": { texto: "Recomendado", clase: "recomendado" },
  "Según Necesidad": { texto: "Según necesidad", clase: "necesidad" },
  "Fuera de Acuerdo": { texto: "Fuera de acuerdo", clase: "fuera" }
};

const PRODUCTOS_HOSPITAL = [
  { marca: "Aceponato Ecuphar", laboratorio: "Ecuphar", composicion: "Hydrocortison", orden: "Fuera de Acuerdo" },
  { marca: "Aceprolab", laboratorio: "Labiana", composicion: "Acepromacin", orden: "Fuera de Acuerdo" },
  { marca: "Aceprovet", laboratorio: "Fatro", composicion: "Acepromacin", orden: "Recomendado" },
  { marca: "Adocam", laboratorio: "Calier", composicion: "Meloxicam", orden: "Fuera de Acuerdo" },
  { marca: "Adtab", laboratorio: "Elanco", composicion: "Lotilaner", orden: "Fuera de Acuerdo" },
  { marca: "Advantix", laboratorio: "Elanco", composicion: "Imidacloprid, Permetrin", orden: "Según Necesidad" },
  { marca: "Advocate", laboratorio: "Elanco", composicion: "Imidacloprid/Moxidectin", orden: "Fuera de Acuerdo" },
  { marca: "Afilaria", laboratorio: "Fatro", composicion: "Moxidectin", orden: "Recomendado" },
  { marca: "Alfaxan", laboratorio: "Zoetis", composicion: "Alfaxalone", orden: "Recomendado" },
  { marca: "Algenamic", laboratorio: "Fatro-Ganaderia", composicion: "Tolfenamic Acid", orden: "Según Necesidad" },
  { marca: "Alizin", laboratorio: "Virbac", composicion: "Aglepriston", orden: "Según Necesidad" },
  { marca: "Alpramil", laboratorio: "Ecuphar", composicion: "Milbemycinoxim/Praziquantel", orden: "Fuera de Acuerdo" },
  { marca: "Alumax", laboratorio: "Livisto", composicion: "Aluminium Agents", orden: "Según Necesidad" },
  { marca: "Alutopic", laboratorio: "Fatro-Ganaderia", composicion: "Aluminium Agents", orden: "Recomendado" },
  { marca: "Alvegesic", laboratorio: "Ecuphar", composicion: "Butorphanol", orden: "Recomendado" },
  { marca: "Alzane", laboratorio: "Zoetis", composicion: "Atipamezole", orden: "Fuera de Acuerdo" },
  { marca: "Amodip", laboratorio: "Ceva", composicion: "Amlodipin", orden: "Recomendado" },
  { marca: "Amoxibactin", laboratorio: "Dechra", composicion: "Amoxicillin + Clavulanic acid", orden: "Recomendado" },
  { marca: "Anesketin", laboratorio: "Dechra", composicion: "Ketamine", orden: "Recomendado - Primera Opción" },
  { marca: "Antidorm", laboratorio: "Calier", composicion: "Atipamezole", orden: "Fuera de Acuerdo" },
  { marca: "Antisedan", laboratorio: "Ecuphar", composicion: "Atipamezole", orden: "Recomendado" },
  { marca: "Antishmania", laboratorio: "Fatro", composicion: "Meglumine Antimonate", orden: "Recomendado" },
  { marca: "Apelka Vet", laboratorio: "Boehringer", composicion: "Thiamazole", orden: "Recomendado" },
  { marca: "Apoquel", laboratorio: "Zoetis", composicion: "Oclacitinib", orden: "Recomendado" },
  { marca: "Ataxxa", laboratorio: "Labiana", composicion: "Imidacloprid, Permetrin", orden: "Fuera de Acuerdo" },
  { marca: "Atopica", laboratorio: "Elanco", composicion: "Cyclosporine", orden: "Recomendado" },
  { marca: "Aurizon", laboratorio: "Vetoquinol", composicion: "Marbofloxacin/Clotrimazol/Dexamethason", orden: "Recomendado" },
  { marca: "Banacep", laboratorio: "Calier", composicion: "Benazepril", orden: "Fuera de Acuerdo" },
  { marca: "Baytril", laboratorio: "Elanco", composicion: "Enrofloxacin", orden: "Fuera de Acuerdo" },
  { marca: "Benakor", laboratorio: "Dechra", composicion: "Benazepril", orden: "Recomendado" },
  { marca: "Benazecare", laboratorio: "Ecuphar", composicion: "Benazepril", orden: "Fuera de Acuerdo" },
  { marca: "Benefortin", laboratorio: "Boehringer", composicion: "Benazepril", orden: "Recomendado - Primera Opción" },
  { marca: "Betafuse", laboratorio: "Karizoo", composicion: "Betamethasone/Fusidic Acid", orden: "Recomendado" },
  { marca: "Bimodula", laboratorio: "Fatro", composicion: "Chloroxitetracycline", orden: "Según Necesidad" },
  { marca: "Bioclanic", laboratorio: "Karizoo", composicion: "Amoxicillin + Clavulanic acid", orden: "Fuera de Acuerdo" },
  { marca: "Bonqat", laboratorio: "Domes Pharma", composicion: "Pregabalin", orden: "Recomendado" },
  { marca: "Braun Fluid", laboratorio: "B.Braun", composicion: "Fluid therapy", orden: "Recomendado" },
  { marca: "Bravecto", laboratorio: "MSD", composicion: "Fluralaner", orden: "Recomendado - Primera Opción" },
  { marca: "Bupaq", laboratorio: "Karizoo", composicion: "Buprenorphin", orden: "Fuera de Acuerdo" },
  { marca: "Buprecare", laboratorio: "Ecuphar", composicion: "Buprenorphin", orden: "Recomendado" },
  { marca: "Bupredine", laboratorio: "Dechra", composicion: "Buprenorphin", orden: "Recomendado" },
  { marca: "BUTOMIDOR", laboratorio: "Karizoo", composicion: "Butorphanol", orden: "Recomendado" },
  { marca: "Calciovet", laboratorio: "Divasa", composicion: "Calcium Gluconate", orden: "Según Necesidad" },
  { marca: "Calier B-8", laboratorio: "Calier", composicion: "Vitamin B12 B2 B1 B6/ Arginine /Lisine/ …", orden: "Fuera de Acuerdo" },
  { marca: "Caliercortin", laboratorio: "Calier", composicion: "Dexamethasone", orden: "Fuera de Acuerdo" },
  { marca: "Canaural", laboratorio: "Dechra", composicion: "Framycetin", orden: "Recomendado - Primera Opción" },
  { marca: "Canergy", laboratorio: "Dechra", composicion: "Propentofylline", orden: "Fuera de Acuerdo" },
  { marca: "Canidolor", laboratorio: "Fatro", composicion: "Meloxicam", orden: "Fuera de Acuerdo" },
  { marca: "Canigen", laboratorio: "Virbac", composicion: "Different manipulated viral stems", orden: "Fuera de Acuerdo" },
  { marca: "Caninsulin", laboratorio: "MSD", composicion: "Insulin", orden: "Recomendado" },
  { marca: "Caniphedrin", laboratorio: "Karizoo", composicion: "Ephedrine", orden: "Según Necesidad" },
  { marca: "Canitroid", laboratorio: "Dechra", composicion: "Levothyroxine", orden: "Recomendado" },
  { marca: "Capstar", laboratorio: "Elanco", composicion: "Nitenpyram", orden: "Según Necesidad" },
  { marca: "Cardalis", laboratorio: "Ceva", composicion: "Benazepril-Hydrochlorid/Spironolacton", orden: "Recomendado" },
  { marca: "Cardinefril", laboratorio: "Fatro", composicion: "Benazepril", orden: "Fuera de Acuerdo" },
  { marca: "Cardisan", laboratorio: "Livisto", composicion: "Pimobendan", orden: "Fuera de Acuerdo" },
  { marca: "Cardisure", laboratorio: "Dechra", composicion: "Pimobendan", orden: "Recomendado" },
  { marca: "Cardotek", laboratorio: "Boehringer", composicion: "Ivermectine - Pyrantel", orden: "Según Necesidad" },
  { marca: "Carporal", laboratorio: "Dechra", composicion: "Carprofen", orden: "Fuera de Acuerdo" },
  { marca: "Carprodyl", laboratorio: "Ceva", composicion: "Carprofen", orden: "Fuera de Acuerdo" },
  { marca: "CARPROFELICAN", laboratorio: "Dechra", composicion: "Carprofen", orden: "Fuera de Acuerdo" },
  { marca: "Carprox", laboratorio: "Virbac", composicion: "Carprofen", orden: "Fuera de Acuerdo" },
  { marca: "Cat-Ex", laboratorio: "Karizoo", composicion: "Praziquantel/Pyrantel/Fenbantel", orden: "Fuera de Acuerdo" },
  { marca: "Catosal", laboratorio: "Bayer - Ganaderia", composicion: "Vitamin B12 / Butafosfan", orden: "Fuera de Acuerdo" },
  { marca: "Cazitel", laboratorio: "Zoetis", composicion: "Praziquantel/Pyrantel/Fenbantel", orden: "Fuera de Acuerdo" },
  { marca: "Cefa Cure", laboratorio: "MSD", composicion: "Cefadroxil", orden: "Según Necesidad" },
  { marca: "Cefabactin", laboratorio: "Dechra", composicion: "Cefalexin", orden: "Recomendado - Primera Opción" },
  { marca: "Cefaseptin", laboratorio: "Vetoquinol", composicion: "Cefalexin", orden: "Recomendado" },
  { marca: "Cepedox", laboratorio: "Karizoo", composicion: "Doxycycline", orden: "Fuera de Acuerdo" },
  { marca: "Cephacare", laboratorio: "Ecuphar", composicion: "Cefalexin", orden: "Según Necesidad" },
  { marca: "Cerenia", laboratorio: "Zoetis", composicion: "Maropitant", orden: "Recomendado" },
  { marca: "Cestem", laboratorio: "Ceva", composicion: "Praziquantel/Pyrantel/Fenbantel", orden: "Fuera de Acuerdo" },
  { marca: "Chanhold", laboratorio: "Fatro", composicion: "Selamectin", orden: "Fuera de Acuerdo" },
  { marca: "Cimalgex", laboratorio: "Vetoquinol", composicion: "Cimicoxib", orden: "Fuera de Acuerdo" },
  { marca: "Clavaseptin", laboratorio: "Vetoquinol", composicion: "Amoxicillin + Clavulanic acid", orden: "Recomendado - Primera Opción" },
  { marca: "Clavucill", laboratorio: "Hifarmax", composicion: "Amoxicillin + Clavulanic acid", orden: "Fuera de Acuerdo" },
  { marca: "Clavusan", laboratorio: "Dechra", composicion: "Amoxicillin + Clavulanic acid", orden: "Recomendado" },
  { marca: "Clevor", laboratorio: "Ecuphar", composicion: "Ropinirole hydrochloride", orden: "Fuera de Acuerdo" },
  { marca: "Clinacin", laboratorio: "Kimipharma", composicion: "Clindamycin", orden: "Fuera de Acuerdo" },
  { marca: "Clindabactin", laboratorio: "Dechra", composicion: "Clindamycin", orden: "Recomendado - Primera Opción" },
  { marca: "Clindacutin", laboratorio: "Dechra", composicion: "Clindamycin Topic Use", orden: "Según Necesidad" },
  { marca: "Clindaseptin", laboratorio: "Vetoquinol", composicion: "Clindamycin", orden: "Recomendado" },
  { marca: "Clomicalm", laboratorio: "Virbac", composicion: "Clomipramine hydrochloride", orden: "Según Necesidad" },
  { marca: "Conofite", laboratorio: "Ecuphar", composicion: "Prednisolone/Polymyxin-B/Miconazolnitrate", orden: "Recomendado" },
  { marca: "Continenza", laboratorio: "Fatro", composicion: "Phenylpropalin", orden: "Fuera de Acuerdo" },
  { marca: "Contralac", laboratorio: "Virbac", composicion: "Metergoline", orden: "Según Necesidad" },
  { marca: "Convenia", laboratorio: "Zoetis", composicion: "Cefovecin", orden: "Según Necesidad" },
  { marca: "Cortavance", laboratorio: "Virbac", composicion: "Hydrocortison", orden: "Recomendado" },
  { marca: "Cortotic", laboratorio: "Virbac", composicion: "Hydrocortison (otic)", orden: "Recomendado" },
  { marca: "Cosacthen", laboratorio: "Dechra", composicion: "Tetracosactid", orden: "Recomendado" },
  { marca: "Coxatab", laboratorio: "Karizoo", composicion: "Firocoxib", orden: "Fuera de Acuerdo" },
  { marca: "Credelio", laboratorio: "Elanco", composicion: "Lotilaner", orden: "Según Necesidad" },
  { marca: "Credelio Plus", laboratorio: "Elanco", composicion: "Lotilaner, Milbemicine", orden: "Recomendado" },
  { marca: "Cyclavance", laboratorio: "Virbac", composicion: "Cyclosporine", orden: "Fuera de Acuerdo" },
  { marca: "Cylanic", laboratorio: "Livisto", composicion: "Amoxicillin + Clavulanic acid", orden: "Fuera de Acuerdo" },
  { marca: "Cytopoint", laboratorio: "Zoetis", composicion: "Lokivetmab", orden: "Recomendado" },
  { marca: "Danilon", laboratorio: "Ecuphar", composicion: "Suxibuzone", orden: "Según Necesidad" },
  { marca: "Daxocox", laboratorio: "Ecuphar", composicion: "Enflicoxib", orden: "Recomendado" },
  { marca: "Dectomax", laboratorio: "Zoetis", composicion: "Doramektin", orden: "Según Necesidad" },
  { marca: "Dermanolon", laboratorio: "Dechra", composicion: "Triamcinolone + 2-Hydroxybenzo acid + salicylic acid", orden: "Según Necesidad" },
  { marca: "Dermipred", laboratorio: "Ceva", composicion: "Prednisolone", orden: "Fuera de Acuerdo" },
  { marca: "Dexdomitor", laboratorio: "Ecuphar", composicion: "Dexmedetomidine", orden: "Recomendado" },
  { marca: "Dexdormostart", laboratorio: "Livisto", composicion: "Dexmedetomidine", orden: "Fuera de Acuerdo" },
  { marca: "Deyanil", laboratorio: "Fatro", composicion: "Dexamethasone", orden: "Fuera de Acuerdo" },
  { marca: "Deyanil", laboratorio: "Fatro-Ganaderia", composicion: "Dexamethasone", orden: "Fuera de Acuerdo" },
  { marca: "Diazedor", laboratorio: "Karizoo", composicion: "Diazepam", orden: "Fuera de Acuerdo" },
  { marca: "Dogstem", laboratorio: "Domes Pharma", composicion: "Stem cells", orden: "Según Necesidad" },
  { marca: "Dolethal", laboratorio: "Vetoquinol", composicion: "Pentobarbital", orden: "Recomendado" },
  { marca: "Domtor", laboratorio: "Ecuphar", composicion: "Medetomidine", orden: "Recomendado" },
  { marca: "Dorbene", laboratorio: "Zoetis", composicion: "Medetomidine", orden: "Fuera de Acuerdo" },
  { marca: "Dormazolam", laboratorio: "Dechra", composicion: "Midazolam", orden: "Según Necesidad" },
  { marca: "Dormisan", laboratorio: "Fatro", composicion: "Medetomidine", orden: "Fuera de Acuerdo" },
  { marca: "Dormostart", laboratorio: "Livisto", composicion: "Medetomidine", orden: "Fuera de Acuerdo" },
  { marca: "Dormostop", laboratorio: "Livisto", composicion: "Atipamezole", orden: "Fuera de Acuerdo" },
  { marca: "Dosalid", laboratorio: "Zoetis", composicion: "Pyrantel/Epsiprantel", orden: "Fuera de Acuerdo" },
  { marca: "Doxybactin", laboratorio: "Dechra", composicion: "Doxycycline", orden: "Recomendado - Primera Opción" },
  { marca: "Doxycare", laboratorio: "Ecuphar", composicion: "Doxycycline", orden: "Recomendado" },
  { marca: "DOXYTAB", laboratorio: "Karizoo", composicion: "Doxycycline", orden: "Fuera de Acuerdo" },
  { marca: "Drontal", laboratorio: "Vetoquinol", composicion: "Praziquantel/Pyrantel/Fenbantel", orden: "Según Necesidad" },
  { marca: "Drontal Plus", laboratorio: "Vetoquinol", composicion: "Praziquantel/Pyrantel/Fenbantel", orden: "Según Necesidad" },
  { marca: "Duecoxin", laboratorio: "Fatro", composicion: "Robenacoxib", orden: "Fuera de Acuerdo" },
  { marca: "Duomyxin", laboratorio: "Domes Pharma", composicion: "Neomicine/Polymixine", orden: "Recomendado" },
  { marca: "Dynacan", laboratorio: "Calier", composicion: "Fipronil, Combinations", orden: "Fuera de Acuerdo" },
  { marca: "Easotic", laboratorio: "Virbac", composicion: "Hydrocortison/Miconazol/Gentamicine", orden: "Recomendado" },
  { marca: "Efex", laboratorio: "Ceva", composicion: "Marbofloxacin", orden: "Fuera de Acuerdo" },
  { marca: "Effinol", laboratorio: "Calier", composicion: "Fipronil", orden: "Recomendado" },
  { marca: "Effipro", laboratorio: "Virbac", composicion: "Fipronil", orden: "Fuera de Acuerdo" },
  { marca: "Effitix", laboratorio: "Virbac", composicion: "Fipronil/Permethrin", orden: "Fuera de Acuerdo" },
  { marca: "Elmaro", laboratorio: "Elanco", composicion: "Maropitant", orden: "Fuera de Acuerdo" },
  { marca: "Emdocam", laboratorio: "Divasa", composicion: "Meloxicam", orden: "Fuera de Acuerdo" },
  { marca: "Emedog", laboratorio: "Domes Pharma", composicion: "Apomorphine", orden: "Recomendado" },
  { marca: "Endogard", laboratorio: "Virbac", composicion: "Praziquantel/Pyrantel/Fenbantel", orden: "Fuera de Acuerdo" },
  { marca: "Engystol", laboratorio: "Heel", composicion: "Unknown - Homeophaty", orden: "Según Necesidad" },
  { marca: "Enrocat", laboratorio: "Livisto", composicion: "Enrofloxacin", orden: "Fuera de Acuerdo" },
  { marca: "ENROCILL", laboratorio: "Hifarmax", composicion: "Enrofloxacin", orden: "Según Necesidad" },
  { marca: "Enrotab", laboratorio: "Karizoo", composicion: "Enrofloxacin", orden: "Fuera de Acuerdo" },
  { marca: "Enrox", laboratorio: "Virbac", composicion: "Enrofloxacin", orden: "Fuera de Acuerdo" },
  { marca: "Epityl", laboratorio: "Karizoo", composicion: "Phenobarbital", orden: "Fuera de Acuerdo" },
  { marca: "Equine Pharma", laboratorio: "Calier", composicion: "Unknown - Homeophaty", orden: "Fuera de Acuerdo" },
  { marca: "Equine Pharma", laboratorio: "Karizoo", composicion: "Unknown - Homeophaty", orden: "Fuera de Acuerdo" },
  { marca: "Equine Pharma", laboratorio: "Others", composicion: "Unknown - Homeophaty", orden: "Fuera de Acuerdo" },
  { marca: "Equine Pharma", laboratorio: "Vetnova", composicion: "Unknown - Homeophaty", orden: "Fuera de Acuerdo" },
  { marca: "Eupenclav", laboratorio: "Fatro", composicion: "Amoxicillin + Clavulanic acid", orden: "Recomendado" },
  { marca: "Eupenclav", laboratorio: "Fatro-Ganaderia", composicion: "Amoxicillin + Clavulanic acid", orden: "Recomendado" },
  { marca: "Eurican", laboratorio: "Boehringer", composicion: "Different manipulated viral stems", orden: "Fuera de Acuerdo" },
  { marca: "Euthasol", laboratorio: "Dechra", composicion: "Pentobarbital natrium", orden: "Recomendado" },
  { marca: "Euthoxin", laboratorio: "Fatro", composicion: "Pentobarbital", orden: "Fuera de Acuerdo" },
  { marca: "Evicto", laboratorio: "Virbac", composicion: "Selamectin", orden: "Fuera de Acuerdo" },
  { marca: "Exagon", laboratorio: "Karizoo", composicion: "Phenobarbital", orden: "Fuera de Acuerdo" },
  { marca: "Facilpart", laboratorio: "Syva", composicion: "Oxytocin", orden: "Según Necesidad" },
  { marca: "Fatrobendan", laboratorio: "Fatro", composicion: "Pimobendan", orden: "Fuera de Acuerdo" },
  { marca: "Feligen", laboratorio: "Virbac", composicion: "Different manipulated viral stems", orden: "Fuera de Acuerdo" },
  { marca: "Felimazole", laboratorio: "Dechra", composicion: "Thiamazole", orden: "Recomendado" },
  { marca: "Felpreva", laboratorio: "Vetoquinol", composicion: "Emodepside/Prazicuantel/Tigolaner", orden: "Recomendado" },
  { marca: "Fentadon", laboratorio: "Dechra", composicion: "Fentanyl", orden: "Según Necesidad" },
  { marca: "Ficoxil", laboratorio: "Livisto", composicion: "Firocoxib", orden: "Fuera de Acuerdo" },
  { marca: "Finilac", laboratorio: "Dechra", composicion: "Cabergolin", orden: "Fuera de Acuerdo" },
  { marca: "Fiprosmet", laboratorio: "Fatro", composicion: "Fipronil, Combinations", orden: "Fuera de Acuerdo" },
  { marca: "Firodyl", laboratorio: "Ceva", composicion: "Firocoxib", orden: "Fuera de Acuerdo" },
  { marca: "Fluoxevet", laboratorio: "Domes Pharma", composicion: "Fluoxetine", orden: "Recomendado" },
  { marca: "Fortekor", laboratorio: "Elanco", composicion: "Benazepril", orden: "Según Necesidad" },
  { marca: "Fortekor Plus", laboratorio: "Elanco", composicion: "Benazapril/Pimobendan", orden: "Recomendado" },
  { marca: "Frontline", laboratorio: "Boehringer", composicion: "Fipronil", orden: "Recomendado" },
  { marca: "Frontline Combo", laboratorio: "Boehringer", composicion: "Fipronil, Combinations", orden: "Fuera de Acuerdo" },
  { marca: "Frontline TriAct", laboratorio: "Boehringer", composicion: "Fipronil/Permethrin", orden: "Recomendado" },
  { marca: "Frontpro", laboratorio: "Boehringer", composicion: "Afoxolaner", orden: "Fuera de Acuerdo" },
  { marca: "Fugasol", laboratorio: "Karizoo", composicion: "Itraconazole", orden: "Fuera de Acuerdo" },
  { marca: "Fungiconazol", laboratorio: "Dechra", composicion: "Ketoconazole", orden: "Recomendado" },
  { marca: "Furosoral", laboratorio: "Dechra", composicion: "Furosemide", orden: "Según Necesidad" },
  { marca: "Galastop", laboratorio: "Ceva", composicion: "Cabergolin", orden: "Recomendado" },
  { marca: "Galliprant", laboratorio: "Elanco", composicion: "Grapiprant", orden: "Recomendado" },
  { marca: "Gentasol", laboratorio: "Labiana", composicion: "Gentamicin", orden: "Según Necesidad" },
  { marca: "Gentavet", laboratorio: "Fatro-Ganaderia", composicion: "Gentamicin", orden: "Fuera de Acuerdo" },
  { marca: "Gestovex", laboratorio: "Dechra", composicion: "Medroxyprogesterone", orden: "Según Necesidad" },
  { marca: "Glucantime", laboratorio: "Boehringer", composicion: "Meglumine Antimonate", orden: "Fuera de Acuerdo" },
  { marca: "Guardian", laboratorio: "Elanco", composicion: "Moxidectin", orden: "Recomendado" },
  { marca: "Hedylon", laboratorio: "Livisto", composicion: "Prednisolone", orden: "Fuera de Acuerdo" },
  { marca: "Helm-Ex", laboratorio: "Karizoo", composicion: "Praziquantel/Pyrantel/Fenbantel", orden: "Fuera de Acuerdo" },
  { marca: "hemo141", laboratorio: "Ecuphar", composicion: "Etamsylate", orden: "Según Necesidad" },
  { marca: "Immiticide", laboratorio: "Boehringer", composicion: "Melarsomine", orden: "Según Necesidad" },
  { marca: "Incurin", laboratorio: "MSD", composicion: "Estriol", orden: "Según Necesidad" },
  { marca: "Indigest", laboratorio: "Calier", composicion: "Menbutone", orden: "Según Necesidad" },
  { marca: "Inflacam", laboratorio: "Virbac", composicion: "Meloxicam", orden: "Fuera de Acuerdo" },
  { marca: "Intubeaze", laboratorio: "Dechra", composicion: "Lidocainhydrochlorid-Monohydrat", orden: "Recomendado" },
  { marca: "Isaderm", laboratorio: "Dechra", composicion: "Fucidic Acid", orden: "Recomendado" },
  { marca: "Isathal", laboratorio: "Dechra", composicion: "Fucidic Acid", orden: "Recomendado - Primera Opción" },
  { marca: "Isemid", laboratorio: "Ceva", composicion: "Torasemid", orden: "Recomendado" },
  { marca: "Isoflo", laboratorio: "Zoetis", composicion: "Isoflurane", orden: "Fuera de Acuerdo" },
  { marca: "Isoflurin", laboratorio: "Fatro", composicion: "Isoflurane", orden: "Recomendado" },
  { marca: "Isoflutek", laboratorio: "Karizoo", composicion: "Isoflurane", orden: "Recomendado" },
  { marca: "Isovet", laboratorio: "B.Braun", composicion: "Isoflurane", orden: "Fuera de Acuerdo" },
  { marca: "Itrafungol", laboratorio: "Virbac", composicion: "Itraconazole", orden: "Recomendado" },
  { marca: "Kabergovet", laboratorio: "Karizoo", composicion: "Cabergolin", orden: "Fuera de Acuerdo" },
  { marca: "Kariflox", laboratorio: "Others", composicion: "Enrofloxacin", orden: "Fuera de Acuerdo" },
  { marca: "Karsivan", laboratorio: "MSD", composicion: "Propentofylline", orden: "Recomendado" },
  { marca: "Kesium", laboratorio: "Ceva", composicion: "Amoxicillin + Clavulanic acid", orden: "Fuera de Acuerdo" },
  { marca: "Ketabel", laboratorio: "Fatro", composicion: "Ketamine", orden: "Recomendado" },
  { marca: "Ketamidor", laboratorio: "Karizoo", composicion: "Ketamine", orden: "Fuera de Acuerdo" },
  { marca: "Ketexx", laboratorio: "Livisto", composicion: "Ketamine", orden: "Fuera de Acuerdo" },
  { marca: "Ketofarm", laboratorio: "Fatro-Ganaderia", composicion: "Ketamine", orden: "Fuera de Acuerdo" },
  { marca: "Keyvit", laboratorio: "Fatro", composicion: "Phytomenadione", orden: "Según Necesidad" },
  { marca: "Kruuse Rehab", laboratorio: "Kruuse", composicion: "Dexamethasone", orden: "Fuera de Acuerdo" },
  { marca: "Lactato Ringer", laboratorio: "B.Braun", composicion: "Fluid therapy", orden: "Recomendado" },
  { marca: "Lactofin", laboratorio: "Fatro", composicion: "Cabergolin", orden: "Fuera de Acuerdo" },
  { marca: "Laxatract", laboratorio: "Dechra", composicion: "Lactulose", orden: "Recomendado" },
  { marca: "Leisguard", laboratorio: "Ecuphar", composicion: "Domperidone", orden: "Recomendado" },
  { marca: "Letifend", laboratorio: "Leti", composicion: "Recombinant Q Protein", orden: "Recomendado - Primera Opción" },
  { marca: "Leucofeligen", laboratorio: "Virbac", composicion: "Different manipulated viral stems", orden: "Fuera de Acuerdo" },
  { marca: "Leucogen", laboratorio: "Virbac", composicion: "Different manipulated viral stems", orden: "Fuera de Acuerdo" },
  { marca: "Leventa", laboratorio: "MSD", composicion: "Levothyroxine", orden: "Recomendado" },
  { marca: "Lexylan", laboratorio: "Labiana", composicion: "Cefalexin", orden: "Fuera de Acuerdo" },
  { marca: "Libeo", laboratorio: "Ceva", composicion: "Furosemide", orden: "Recomendado" },
  { marca: "Librela", laboratorio: "Zoetis", composicion: "Bedinvetmab", orden: "Recomendado - Primera Opción" },
  { marca: "Libromide", laboratorio: "Dechra", composicion: "Kaliumbromid", orden: "Según Necesidad" },
  { marca: "Lidor", laboratorio: "Karizoo", composicion: "Lidocainhydrochlorid-Monohydrat", orden: "Recomendado" },
  { marca: "Lifronil", laboratorio: "Zotal", composicion: "Fipronil", orden: "Fuera de Acuerdo" },
  { marca: "Liverfine", laboratorio: "Fatro", composicion: "Poly (2-propenal, 2-propenoic acid)", orden: "Según Necesidad" },
  { marca: "Liverfine", laboratorio: "Fatro-Ganaderia", composicion: "Poly (2-propenal, 2-propenoic acid)", orden: "Según Necesidad" },
  { marca: "Livestock Pharma", laboratorio: "Armi", composicion: "Livestock Pharma", orden: "Fuera de Acuerdo" },
  { marca: "Livestock Pharma", laboratorio: "Bayer - Ganaderia", composicion: "Livestock Pharma", orden: "Fuera de Acuerdo" },
  { marca: "Livestock Pharma", laboratorio: "Boehringer", composicion: "Livestock Pharma", orden: "Fuera de Acuerdo" },
  { marca: "Livestock Pharma", laboratorio: "Calier", composicion: "Livestock Pharma", orden: "Fuera de Acuerdo" },
  { marca: "Livestock Pharma", laboratorio: "Calier-Ramaderia", composicion: "Livestock Pharma", orden: "Fuera de Acuerdo" },
  { marca: "Livestock Pharma", laboratorio: "Ceva", composicion: "Livestock Pharma", orden: "Fuera de Acuerdo" },
  { marca: "Livestock Pharma", laboratorio: "Dechra", composicion: "Livestock Pharma", orden: "Fuera de Acuerdo" },
  { marca: "Livestock Pharma", laboratorio: "Ecuphar", composicion: "Livestock Pharma", orden: "Fuera de Acuerdo" },
  { marca: "Livestock Pharma", laboratorio: "Elanco", composicion: "Livestock Pharma", orden: "Fuera de Acuerdo" },
  { marca: "Livestock Pharma", laboratorio: "Everest", composicion: "Livestock Pharma", orden: "Fuera de Acuerdo" },
  { marca: "Livestock Pharma", laboratorio: "Fatro", composicion: "Livestock Pharma", orden: "Fuera de Acuerdo" },
  { marca: "Livestock Pharma", laboratorio: "Hifarmax", composicion: "Livestock Pharma", orden: "Fuera de Acuerdo" },
  { marca: "Livestock Pharma", laboratorio: "Hill'S", composicion: "Livestock Pharma", orden: "Fuera de Acuerdo" },
  { marca: "Livestock Pharma", laboratorio: "Karizoo", composicion: "Livestock Pharma", orden: "Fuera de Acuerdo" },
  { marca: "Livestock Pharma", laboratorio: "Labiana", composicion: "Livestock Pharma", orden: "Fuera de Acuerdo" },
  { marca: "Livestock Pharma", laboratorio: "Livisto", composicion: "Livestock Pharma", orden: "Fuera de Acuerdo" },
  { marca: "Livestock Pharma", laboratorio: "MSD", composicion: "Livestock Pharma", orden: "Fuera de Acuerdo" },
  { marca: "Livestock Pharma", laboratorio: "Others", composicion: "Livestock Pharma", orden: "Fuera de Acuerdo" },
  { marca: "Livestock Pharma", laboratorio: "Syva", composicion: "Livestock Pharma", orden: "Fuera de Acuerdo" },
  { marca: "Livestock Pharma", laboratorio: "Varios", composicion: "Livestock Pharma", orden: "Fuera de Acuerdo" },
  { marca: "Livestock Pharma", laboratorio: "Vetia", composicion: "Livestock Pharma", orden: "Fuera de Acuerdo" },
  { marca: "Livestock Pharma", laboratorio: "Virbac", composicion: "Livestock Pharma", orden: "Fuera de Acuerdo" },
  { marca: "Livestock Pharma", laboratorio: "Zoetis", composicion: "Livestock Pharma", orden: "Fuera de Acuerdo" },
  { marca: "Livestock Pharma", laboratorio: "Zotal", composicion: "Livestock Pharma", orden: "Fuera de Acuerdo" },
  { marca: "Lodisure", laboratorio: "Dechra", composicion: "Amlodipin", orden: "Según Necesidad" },
  { marca: "Loxicom", laboratorio: "Karizoo", composicion: "Meloxicam", orden: "Fuera de Acuerdo" },
  { marca: "Loxicom", laboratorio: "Others", composicion: "Meloxicam", orden: "Fuera de Acuerdo" },
  { marca: "Malaseb", laboratorio: "Dechra", composicion: "Chlorhexidine digluconate, miconazole nitrate", orden: "Recomendado - Primera Opción" },
  { marca: "Marbocare", laboratorio: "Ecuphar", composicion: "Marbofloxacin", orden: "Fuera de Acuerdo" },
  { marca: "Marbocyl", laboratorio: "Vetoquinol", composicion: "Marbofloxacin", orden: "Recomendado - Primera Opción" },
  { marca: "Marbofloxoral", laboratorio: "Karizoo", composicion: "Marbofloxacin", orden: "Fuera de Acuerdo" },
  { marca: "Marbovet", laboratorio: "Fatro", composicion: "Marbofloxacin", orden: "Recomendado" },
  { marca: "Masivet", laboratorio: "Imagine", composicion: "Masitinib", orden: "Según Necesidad" },
  { marca: "Maxivac", laboratorio: "Ecuphar", composicion: "Different manipulated viral stems", orden: "Fuera de Acuerdo" },
  { marca: "Medeson", laboratorio: "Imagine", composicion: "Medetomidine", orden: "Fuera de Acuerdo" },
  { marca: "Medetor", laboratorio: "Virbac", composicion: "Medetomidine", orden: "Fuera de Acuerdo" },
  { marca: "Meloxidolor", laboratorio: "Dechra", composicion: "Meloxicam", orden: "Fuera de Acuerdo" },
  { marca: "Meloxidyl", laboratorio: "Ceva", composicion: "Meloxicam", orden: "Recomendado" },
  { marca: "Meloxoral", laboratorio: "Dechra", composicion: "Meloxicam", orden: "Fuera de Acuerdo" },
  { marca: "Meloxyl", laboratorio: "Kimipharma", composicion: "Meloxicam", orden: "Fuera de Acuerdo" },
  { marca: "Merlin", laboratorio: "Calier", composicion: "Deltamethrin", orden: "Fuera de Acuerdo" },
  { marca: "Metacam", laboratorio: "Boehringer", composicion: "Meloxicam", orden: "Recomendado - Primera Opción" },
  { marca: "Metrobactin", laboratorio: "Dechra", composicion: "Metronidazole", orden: "Recomendado" },
  { marca: "Metrocare", laboratorio: "Ecuphar", composicion: "Metronidazole", orden: "Fuera de Acuerdo" },
  { marca: "Metrotab", laboratorio: "Virbac", composicion: "Metronidazole", orden: "Fuera de Acuerdo" },
  { marca: "Metrovis", laboratorio: "Livisto", composicion: "Metronidazole", orden: "Fuera de Acuerdo" },
  { marca: "Metrozenil", laboratorio: "Karizoo", composicion: "Metronidazole", orden: "Fuera de Acuerdo" },
  { marca: "Milbeguard", laboratorio: "Ceva", composicion: "Milbemycinoxim/Praziquantel", orden: "Recomendado" },
  { marca: "Milbemax", laboratorio: "Elanco", composicion: "Milbemycinoxim/Praziquantel", orden: "Recomendado - Primera Opción" },
  { marca: "Milbenin", laboratorio: "Kimipharma", composicion: "Milbemycinoxim/Praziquantel", orden: "Fuera de Acuerdo" },
  { marca: "Milbeprazin", laboratorio: "Calier", composicion: "Milbemycinoxim/Praziquantel", orden: "Fuera de Acuerdo" },
  { marca: "Milprazon", laboratorio: "Labiana", composicion: "Milbemycinoxim/Praziquantel", orden: "Fuera de Acuerdo" },
  { marca: "Milpro", laboratorio: "Virbac", composicion: "Milbemycinoxim/Praziquantel", orden: "Fuera de Acuerdo" },
  { marca: "Milteforan", laboratorio: "Virbac", composicion: "Miltefosine", orden: "Según Necesidad" },
  { marca: "Mirataz", laboratorio: "Dechra", composicion: "Mirtazapane", orden: "Recomendado - Primera Opción" },
  { marca: "Mitex", laboratorio: "Karizoo", composicion: "Prednisolone/Polymyxin-B/Miconazolnitrate", orden: "Fuera de Acuerdo" },
  { marca: "Mobeel", laboratorio: "Heel", composicion: "Unknown - Homeophaty", orden: "Según Necesidad" },
  { marca: "Moderin", laboratorio: "Zoetis", composicion: "Dexamethasone", orden: "Recomendado" },
  { marca: "Modulis", laboratorio: "Ceva", composicion: "Cyclosporine", orden: "Recomendado" },
  { marca: "Mometamax", laboratorio: "MSD", composicion: "Gentamicine/Posaconazol/Momethason", orden: "Según Necesidad" },
  { marca: "Myodine", laboratorio: "Dechra", composicion: "Nandrolone", orden: "Según Necesidad" },
  { marca: "Nelio", laboratorio: "Ceva", composicion: "Benazepril", orden: "Fuera de Acuerdo" },
  { marca: "Neoleish", laboratorio: "Petia", composicion: "Different manipulated viral stems", orden: "Según Necesidad" },
  { marca: "Neptra", laboratorio: "Elanco", composicion: "Terbinafin/Florfenicol/Momethason", orden: "Recomendado" },
  { marca: "Nexgard", laboratorio: "Boehringer", composicion: "Afoxolaner", orden: "Según Necesidad" },
  { marca: "Nexgard Combo", laboratorio: "Boehringer", composicion: "Eprinomectin, Combinations", orden: "Recomendado" },
  { marca: "Nexgard Spectra", laboratorio: "Boehringer", composicion: "Afoxolaner/Milbemycinoxim", orden: "Recomendado" },
  { marca: "Nicilan", laboratorio: "Calier", composicion: "Amoxicillin + Clavulanic acid", orden: "Fuera de Acuerdo" },
  { marca: "Nobivac", laboratorio: "MSD", composicion: "Different manipulated viral stems", orden: "Recomendado - Primera Opción" },
  { marca: "Nobivac Feline", laboratorio: "MSD", composicion: "Different manipulated viral stems", orden: "Recomendado - Primera Opción" },
  { marca: "Nosedorm", laboratorio: "Karizoo", composicion: "Atipamezole", orden: "Fuera de Acuerdo" },
  { marca: "Numelvi", laboratorio: "MSD", composicion: "Atinvicitinib", orden: "Recomendado" },
  { marca: "NuxVomica", laboratorio: "Heel", composicion: "Unknown - Homeophaty", orden: "Según Necesidad" },
  { marca: "Oftalmovet", laboratorio: "Fatro", composicion: "Prednisolone eyedrops", orden: "Según Necesidad" },
  { marca: "Oftalmovit", laboratorio: "Fatro", composicion: "Vitamin A", orden: "Recomendado" },
  { marca: "Onsior", laboratorio: "Elanco", composicion: "Robenacoxib", orden: "Recomendado - Primera Opción" },
  { marca: "Ophtocycline", laboratorio: "Dechra", composicion: "Chlortetracycline", orden: "Recomendado" },
  { marca: "Optimmune", laboratorio: "MSD", composicion: "Cyclosporine", orden: "Recomendado" },
  { marca: "Osteopen", laboratorio: "Karizoo", composicion: "Pentosan Polysulfat Natrium", orden: "Según Necesidad" },
  { marca: "Osurnia", laboratorio: "Dechra", composicion: "Terbinafin/Florfenicol/Betamethason", orden: "Recomendado" },
  { marca: "Otisur", laboratorio: "Fatro", composicion: "Prednisolone/Polymyxin-B/Miconazolnitrate", orden: "Fuera de Acuerdo" },
  { marca: "Otodine", laboratorio: "Nextmune", composicion: "Chlorhexidine digluconate, miconazole nitrate", orden: "Fuera de Acuerdo" },
  { marca: "Otomax", laboratorio: "MSD", composicion: "Gentamicin/Clotrimazol/Betametasona", orden: "Según Necesidad" },
  { marca: "Otomicol", laboratorio: "Labiana", composicion: "Prednisolone/Polymyxin-B/Miconazolnitrate", orden: "Fuera de Acuerdo" },
  { marca: "Ototop", laboratorio: "Livisto", composicion: "Prednisolone/Polymyxin-B/Miconazolnitrate", orden: "Fuera de Acuerdo" },
  { marca: "Otoxolan", laboratorio: "Labiana", composicion: "Marbofloxacin/Clotrimazol/Dexamethason", orden: "Fuera de Acuerdo" },
  { marca: "Pacifeel", laboratorio: "Heel", composicion: "Unknown - Homeophaty", orden: "Según Necesidad" },
  { marca: "Palladia", laboratorio: "Zoetis", composicion: "Toceranib", orden: "Recomendado" },
  { marca: "Panacur", laboratorio: "MSD", composicion: "Fenbendazol", orden: "Recomendado" },
  { marca: "Parasital", laboratorio: "Zotal", composicion: "Fipronil", orden: "Fuera de Acuerdo" },
  { marca: "Partovet", laboratorio: "Divasa", composicion: "Oxytocin", orden: "Según Necesidad" },
  { marca: "Parvigen", laboratorio: "Virbac", composicion: "Different manipulated viral stems", orden: "Fuera de Acuerdo" },
  { marca: "Pestigon", laboratorio: "Karizoo", composicion: "Fipronil", orden: "Fuera de Acuerdo" },
  { marca: "Pexion", laboratorio: "Boehringer", composicion: "Imepitoïne", orden: "Recomendado - Primera Opción" },
  { marca: "Phenoleptil", laboratorio: "Dechra", composicion: "Phenobarbital", orden: "Recomendado" },
  { marca: "Pimotab", laboratorio: "Karizoo", composicion: "Pimobendan", orden: "Fuera de Acuerdo" },
  { marca: "Popandog", laboratorio: "Fatro", composicion: "Praziquantel/Pyrantel/Fenbantel", orden: "Recomendado" },
  { marca: "Posatex", laboratorio: "MSD", composicion: "Orbiflo/Posaconazol/Momethason", orden: "Según Necesidad" },
  { marca: "Prazitel", laboratorio: "Ecuphar", composicion: "Praziquantel/Pyrantel/Fenbantel", orden: "Fuera de Acuerdo" },
  { marca: "Prednicortone", laboratorio: "Dechra", composicion: "Prednisolone", orden: "Recomendado - Primera Opción" },
  { marca: "Prednisolona Fatro", laboratorio: "Fatro", composicion: "Prednisolone", orden: "Recomendado" },
  { marca: "Prevendog", laboratorio: "Virbac", composicion: "Deltamethrin", orden: "Fuera de Acuerdo" },
  { marca: "Previcox", laboratorio: "Boehringer", composicion: "Firocoxib", orden: "Recomendado - Primera Opción" },
  { marca: "Prevomax", laboratorio: "Dechra", composicion: "Maropitant", orden: "Recomendado - Primera Opción" },
  { marca: "Prilactone", laboratorio: "Ceva", composicion: "Spironolacton", orden: "Recomendado" },
  { marca: "Prinocate", laboratorio: "Hifarmax", composicion: "Imidacloprid/Moxidectin", orden: "Fuera de Acuerdo" },
  { marca: "Prinovox", laboratorio: "Fatro", composicion: "Moxidectin/Imidacloprid", orden: "Según Necesidad" },
  { marca: "Privaprol", laboratorio: "Fatro", composicion: "Lotrifen", orden: "Según Necesidad" },
  { marca: "Procamidor", laboratorio: "Karizoo", composicion: "Procaine", orden: "Fuera de Acuerdo" },
  { marca: "Procapen", laboratorio: "Livisto", composicion: "Benzylpenicillin", orden: "Según Necesidad" },
  { marca: "Procox", laboratorio: "Vetoquinol", composicion: "Toltrazurile/Emodepside", orden: "Fuera de Acuerdo" },
  { marca: "Profender", laboratorio: "Vetoquinol", composicion: "Emodepside/Prazicuantel", orden: "Fuera de Acuerdo" },
  { marca: "Propalin", laboratorio: "Vetoquinol", composicion: "Phenylpropalin", orden: "Recomendado" },
  { marca: "Propancat", laboratorio: "Fatro", composicion: "Praziquantel/Pyrantel/Fenbantel", orden: "Recomendado" },
  { marca: "PROPOFOL LIPURO", laboratorio: "B.Braun", composicion: "Propofol", orden: "Recomendado" },
  { marca: "Propomitor", laboratorio: "Ecuphar", composicion: "Propofol", orden: "Recomendado" },
  { marca: "Proposure", laboratorio: "Karizoo", composicion: "Propofol", orden: "Recomendado" },
  { marca: "Propovet", laboratorio: "Zoetis", composicion: "Propofol", orden: "Fuera de Acuerdo" },
  { marca: "ProZinc", laboratorio: "Boehringer", composicion: "Insulin", orden: "Recomendado - Primera Opción" },
  { marca: "Pulsix", laboratorio: "Livisto", composicion: "Imidacloprid, Permetrin", orden: "Fuera de Acuerdo" },
  { marca: "Purevax", laboratorio: "Boehringer", composicion: "Different manipulated viral stems", orden: "Recomendado" },
  { marca: "Rabigen", laboratorio: "Virbac", composicion: "Inactivated Rabies-stem", orden: "Fuera de Acuerdo" },
  { marca: "Rapidexon", laboratorio: "Dechra", composicion: "Dexamethasone", orden: "Fuera de Acuerdo" },
  { marca: "Rapison", laboratorio: "Fatro-Ganaderia", composicion: "Dexamethasone", orden: "Fuera de Acuerdo" },
  { marca: "Reanest", laboratorio: "Hifarmax", composicion: "Medetomidine", orden: "Fuera de Acuerdo" },
  { marca: "Recicort", laboratorio: "Dechra", composicion: "Triamcinolone + salicylic acid", orden: "Recomendado" },
  { marca: "RECONCILE", laboratorio: "Vetnova", composicion: "Fluoxetine", orden: "Según Necesidad" },
  { marca: "Release", laboratorio: "Calier", composicion: "Pentobarbital", orden: "Fuera de Acuerdo" },
  { marca: "Remend", laboratorio: "Domes Pharma", composicion: "Hyaluronic acid", orden: "Recomendado" },
  { marca: "Revazol", laboratorio: "Dechra", composicion: "Atipamezole", orden: "Recomendado - Primera Opción" },
  { marca: "Reverse", laboratorio: "Fatro", composicion: "Atipamezole", orden: "Recomendado" },
  { marca: "Revertor", laboratorio: "Virbac", composicion: "Atipamezole", orden: "Fuera de Acuerdo" },
  { marca: "Rheumocam", laboratorio: "Ecuphar", composicion: "Meloxicam", orden: "Fuera de Acuerdo" },
  { marca: "Rheumocam", laboratorio: "Fatro", composicion: "Meloxicam", orden: "Fuera de Acuerdo" },
  { marca: "Rilexine", laboratorio: "Virbac", composicion: "Cefalexin", orden: "Fuera de Acuerdo" },
  { marca: "Rimadyl", laboratorio: "Zoetis", composicion: "Carprofen", orden: "Recomendado" },
  { marca: "Rivalgin", laboratorio: "Karizoo", composicion: "Metamizole", orden: "Recomendado" },
  { marca: "Robexera", laboratorio: "Labiana", composicion: "Robenacoxib", orden: "Fuera de Acuerdo" },
  { marca: "Rompun", laboratorio: "Bayer - Ganaderia", composicion: "Xylazine", orden: "Según Necesidad" },
  { marca: "Ronaxan", laboratorio: "Boehringer", composicion: "Doxycycline", orden: "Fuera de Acuerdo" },
  { marca: "Rycarfa", laboratorio: "Hifarmax", composicion: "Carprofen", orden: "Según Necesidad" },
  { marca: "Scalibor", laboratorio: "MSD", composicion: "Deltamethrin", orden: "Según Necesidad" },
  { marca: "Sedadex", laboratorio: "Dechra", composicion: "Dexmedetomidine", orden: "Recomendado - Primera Opción" },
  { marca: "Sedanine", laboratorio: "Labiana", composicion: "Acepromacin", orden: "Recomendado" },
  { marca: "Sedastart", laboratorio: "B.Braun", composicion: "Medetomidine", orden: "Fuera de Acuerdo" },
  { marca: "Sedastop", laboratorio: "B.Braun", composicion: "Atipamezole", orden: "Fuera de Acuerdo" },
  { marca: "Sedator", laboratorio: "Dechra", composicion: "Medetomidine", orden: "Recomendado - Primera Opción" },
  { marca: "Sededorm", laboratorio: "Karizoo", composicion: "Medetomidine", orden: "Fuera de Acuerdo" },
  { marca: "Sedin", laboratorio: "Calier", composicion: "Dexmedetomidine", orden: "Fuera de Acuerdo" },
  { marca: "Selehold", laboratorio: "Labiana", composicion: "Selamectin", orden: "Fuera de Acuerdo" },
  { marca: "Semelcef", laboratorio: "Fatro", composicion: "Cefadroxil", orden: "Según Necesidad" },
  { marca: "Semfortan", laboratorio: "Dechra", composicion: "Methadone", orden: "Recomendado - Primera Opción" },
  { marca: "Semintra", laboratorio: "Boehringer", composicion: "Telmisartan", orden: "Recomendado" },
  { marca: "Senvelgo", laboratorio: "Boehringer", composicion: "Velagliflozine", orden: "Recomendado - Primera Opción" },
  { marca: "Seresto", laboratorio: "Elanco", composicion: "Imidacloprid/Flumethrin", orden: "Recomendado - Primera Opción" },
  { marca: "Sevoflo", laboratorio: "Zoetis", composicion: "Sevoflurane", orden: "Fuera de Acuerdo" },
  { marca: "Sevohale", laboratorio: "Fatro", composicion: "Sevoflurane", orden: "Recomendado" },
  { marca: "Sevotek", laboratorio: "Karizoo", composicion: "Sevoflurane", orden: "Recomendado" },
  { marca: "Sileo", laboratorio: "Ecuphar", composicion: "Dexmedetomidine", orden: "Recomendado" },
  { marca: "Simparica", laboratorio: "Zoetis", composicion: "Sarolaner", orden: "Recomendado" },
  { marca: "Simparica Trio", laboratorio: "Zoetis", composicion: "Sarolaner, Moxidectine Pyrantel", orden: "Recomendado" },
  { marca: "Solensia", laboratorio: "Zoetis", composicion: "Frunevetmab", orden: "Recomendado - Primera Opción" },
  { marca: "Soligental", laboratorio: "Virbac", composicion: "Gentamicin", orden: "Según Necesidad" },
  { marca: "Soliphen", laboratorio: "Domes Pharma", composicion: "Phenobarbital", orden: "Recomendado" },
  { marca: "Solupam", laboratorio: "Dechra", composicion: "Diazepam", orden: "Recomendado - Primera Opción" },
  { marca: "Spasmalgan", laboratorio: "Hifarmax", composicion: "Metamizole", orden: "Fuera de Acuerdo" },
  { marca: "Spizobactin", laboratorio: "Dechra", composicion: "Spiramycine + Metronidazole", orden: "Recomendado - Primera Opción" },
  { marca: "Sporimune", laboratorio: "Dechra", composicion: "Cyclosporine", orden: "Fuera de Acuerdo" },
  { marca: "Stelfonta", laboratorio: "Virbac", composicion: "Tigilanoltiglat", orden: "Según Necesidad" },
  { marca: "Stomorgyl", laboratorio: "Boehringer", composicion: "Spiramycine + Metronidazole", orden: "Recomendado" },
  { marca: "Stromease", laboratorio: "Domes Pharma", composicion: "Acetylcysteine", orden: "Recomendado" },
  { marca: "Stronghold", laboratorio: "Zoetis", composicion: "Selamectin", orden: "Recomendado" },
  { marca: "Stronghold Plus", laboratorio: "Zoetis", composicion: "Selamectin", orden: "Recomendado" },
  { marca: "Suprelorin", laboratorio: "Virbac", composicion: "Deslorelon", orden: "Recomendado" },
  { marca: "Surolan", laboratorio: "Elanco", composicion: "Prednisolone/Polymyxin-B/Miconazolnitrate", orden: "Fuera de Acuerdo" },
  { marca: "Synulox", laboratorio: "Zoetis", composicion: "Amoxicillin + Clavulanic acid", orden: "Fuera de Acuerdo" },
  { marca: "T-61", laboratorio: "MSD", composicion: "Embutacide", orden: "Recomendado" },
  { marca: "Taber", laboratorio: "Divasa", composicion: "Permethrin", orden: "Según Necesidad" },
  { marca: "Tabernil", laboratorio: "Divasa", composicion: "Unknown - Homeophaty", orden: "Según Necesidad" },
  { marca: "Telmin", laboratorio: "Ecuphar", composicion: "Mebendazole", orden: "Según Necesidad" },
  { marca: "Tenicipen", laboratorio: "Fatro", composicion: "Praziquantel", orden: "Según Necesidad" },
  { marca: "Tessie", laboratorio: "Domes Pharma", composicion: "Tasipimidine", orden: "Según Necesidad" },
  { marca: "Therios", laboratorio: "Ceva", composicion: "Cefalexin", orden: "Fuera de Acuerdo" },
  { marca: "Thiamacare", laboratorio: "Ecuphar", composicion: "Thiamazole", orden: "Fuera de Acuerdo" },
  { marca: "Thyroxavet", laboratorio: "Karizoo", composicion: "Levothyroxine", orden: "Fuera de Acuerdo" },
  { marca: "Tiobarbital", laboratorio: "B.Braun", composicion: "Thiopental", orden: "Recomendado" },
  { marca: "Tipafar", laboratorio: "Hifarmax", composicion: "Atipamezole", orden: "Fuera de Acuerdo" },
  { marca: "Tolfedine", laboratorio: "Vetoquinol", composicion: "Tolfenamic Acid", orden: "Según Necesidad" },
  { marca: "Torbugesic", laboratorio: "Zoetis", composicion: "Butorphanol", orden: "Fuera de Acuerdo" },
  { marca: "Torphadine", laboratorio: "Dechra", composicion: "Butorphanol", orden: "Recomendado - Primera Opción" },
  { marca: "Torphasol", laboratorio: "Livisto", composicion: "Butorphanol", orden: "Fuera de Acuerdo" },
  { marca: "Tralieve", laboratorio: "Dechra", composicion: "Tramadolhydrochlorid", orden: "Recomendado - Primera Opción" },
  { marca: "Tramvetol", laboratorio: "Virbac", composicion: "Tramadolhydrochlorid", orden: "Fuera de Acuerdo" },
  { marca: "Traumeel", laboratorio: "Heel", composicion: "Unknown - Homeophaty", orden: "Según Necesidad" },
  { marca: "Triderm", laboratorio: "Fatro", composicion: "Marbofloxacin/Ketocanazol/Prednisolone", orden: "Recomendado" },
  { marca: "Trilotab", laboratorio: "Virbac", composicion: "Trilostan", orden: "Fuera de Acuerdo" },
  { marca: "Trocoxil", laboratorio: "Zoetis", composicion: "Mavacoxib", orden: "Según Necesidad" },
  { marca: "Tsefalen", laboratorio: "Fatro", composicion: "Cefalexin", orden: "Fuera de Acuerdo" },
  { marca: "Tusheel", laboratorio: "Heel", composicion: "Unknown - Homeophaty", orden: "Según Necesidad" },
  { marca: "Upcard", laboratorio: "Vetoquinol", composicion: "Torasemid", orden: "Según Necesidad" },
  { marca: "Uristop", laboratorio: "Karizoo", composicion: "Phenylpropalin", orden: "Fuera de Acuerdo" },
  { marca: "Vanguard", laboratorio: "Zoetis", composicion: "Different manipulated viral stems", orden: "Fuera de Acuerdo" },
  { marca: "Vasotop", laboratorio: "MSD", composicion: "Ramipril", orden: "Según Necesidad" },
  { marca: "Vectimax", laboratorio: "Ecuphar", composicion: "Ivermectine", orden: "Fuera de Acuerdo" },
  { marca: "Vectra", laboratorio: "Ceva", composicion: "Dinotefuran/Piriproxifen", orden: "Según Necesidad" },
  { marca: "Vectra 3D", laboratorio: "Ceva", composicion: "Dinotefuran/Piriproxifen/Permetrine", orden: "Recomendado" },
  { marca: "Veraflox", laboratorio: "Elanco", composicion: "Pradofloxacin", orden: "Según Necesidad" },
  { marca: "Versican", laboratorio: "Zoetis", composicion: "Different manipulated viral stems", orden: "Fuera de Acuerdo" },
  { marca: "Versifel", laboratorio: "Zoetis", composicion: "Different manipulated viral stems", orden: "Fuera de Acuerdo" },
  { marca: "Versiguard", laboratorio: "Zoetis", composicion: "Different manipulated viral stems", orden: "Fuera de Acuerdo" },
  { marca: "Vetbromide", laboratorio: "Domes Pharma", composicion: "Kaliumbromid", orden: "Recomendado" },
  { marca: "Veteglan", laboratorio: "Calier", composicion: "Cloprostenol", orden: "Fuera de Acuerdo" },
  { marca: "Vetemex", laboratorio: "Virbac", composicion: "Maropitant", orden: "Fuera de Acuerdo" },
  { marca: "Vetflurane", laboratorio: "Virbac", composicion: "Isoflurane", orden: "Fuera de Acuerdo" },
  { marca: "Vetmedin", laboratorio: "Boehringer", composicion: "Pimobendan", orden: "Recomendado - Primera Opción" },
  { marca: "Vetoryl", laboratorio: "Dechra", composicion: "Trilostan", orden: "Recomendado - Primera Opción" },
  { marca: "Veylactin", laboratorio: "Hifarmax", composicion: "Cabergolin", orden: "Según Necesidad" },
  { marca: "VIRBAGEN", laboratorio: "Virbac", composicion: "Interferone omega, recombinant", orden: "Recomendado" },
  { marca: "Vitamivet", laboratorio: "Domes Pharma", composicion: "Phytomenadione", orden: "Recomendado" },
  { marca: "Vitofyllin", laboratorio: "Divasa", composicion: "Propentofylline", orden: "Fuera de Acuerdo" },
  { marca: "Vomend", laboratorio: "Dechra", composicion: "Metoclopramid", orden: "Recomendado" },
  { marca: "Vominil", laboratorio: "Karizoo", composicion: "Maropitant", orden: "Fuera de Acuerdo" },
  { marca: "Wellplus", laboratorio: "Divasa", composicion: "Praziquantel/Pyrantel/Fenbantel", orden: "Fuera de Acuerdo" },
  { marca: "Xeden", laboratorio: "Ceva", composicion: "Enrofloxacin", orden: "Recomendado" },
  { marca: "Xilagesic", laboratorio: "Calier", composicion: "Xylazine", orden: "Según Necesidad" },
  { marca: "Xylasol", laboratorio: "Karizoo", composicion: "Xylazine", orden: "Fuera de Acuerdo" },
  { marca: "Xylexx", laboratorio: "Livisto", composicion: "Xylazine", orden: "Fuera de Acuerdo" },
  { marca: "Ypozane", laboratorio: "Virbac", composicion: "Osateron", orden: "Recomendado" },
  { marca: "Zeel", laboratorio: "Heel", composicion: "Unknown - Homeophaty", orden: "Según Necesidad" },
  { marca: "Zelys", laboratorio: "Ceva", composicion: "Pimobendan", orden: "Fuera de Acuerdo" },
  { marca: "Zenalpha", laboratorio: "Dechra", composicion: "Medetomidine - Vatinoxan", orden: "Recomendado" },
  { marca: "Zenrelia", laboratorio: "Elanco", composicion: "Ilunocitinib", orden: "Recomendado" },
  { marca: "Ziapam", laboratorio: "Domes Pharma", composicion: "Diazepam", orden: "Recomendado" },
  { marca: "ZIKYALL", laboratorio: "Hifarmax", composicion: "Praziquantel/Pyrantel/Fenbantel", orden: "Fuera de Acuerdo" },
  { marca: "Zipyran Plus", laboratorio: "Calier", composicion: "Praziquantel/Pyrantel/Fenbantel", orden: "Fuera de Acuerdo" },
  { marca: "Zodon", laboratorio: "Ceva", composicion: "Clindamycin", orden: "Según Necesidad" },
  { marca: "Zoletil", laboratorio: "Virbac", composicion: "Tiletamine/Zolazepam", orden: "Según Necesidad" },
  { marca: "Zycortal", laboratorio: "Dechra", composicion: "Desoxycortone pivalate", orden: "Recomendado" }
];

// Traducción/alias de la composición (tal y como figura en PRODUCTOS_HOSPITAL, en inglés) al
// principioActivo español usado en DRUGS, para poder cruzar ambas listas. Solo cubre, de momento,
// las categorías trabajadas en el asistente de indicación de antibióticos y las de uso diario más
// frecuente (antibióticos, AINEs/analgésicos, sedantes-anestésicos, cardiológicos, endocrinos).
// Ampliar aquí a medida que se añadan más fármacos con dosis propia.
const ALIAS_COMPOSICION_HOSPITAL = {
  "acepromacin": "Acepromazina",
  "alfaxalone": "Alfaxalona",
  "amlodipin": "Amlodipino",
  "amoxicillin + clavulanic acid": "Amoxicilina/Ácido clavulánico",
  "atipamezole": "Atipamezol",
  "acetylcysteine": "Acetilcisteína (oftálmica)",
  "betamethasone/fusidic acid": "Ácido fusídico + Betametasona (gel cutáneo)",
  "pentosan polysulfat natrium": "Pentosano polisulfato sódico",
  "bedinvetmab": "Bedinvetmab",
  "benazepril": "Benazepril",
  "benzylpenicillin": "Bencilpenicilina procaína + Dihidroestreptomicina",
  "buprenorphin": "Buprenorfina",
  "butorphanol": "Butorfanol",
  "chlortetracycline": "Clortetraciclina (oftálmica)",
  "carprofen": "Carprofeno",
  "cefadroxil": "Cefadroxilo",
  "cefalexin": "Cefalexina",
  "cefovecin": "Cefovecina",
  "clindamycin": "Clindamicina",
  "clomipramine hydrochloride": "Clomipramina",
  "apomorphine": "Apomorfina",
  "domperidone": "Domperidona",
  "etamsylate": "Etamsilato",
  "fentanyl": "Fentanilo",
  "cyclosporine": "Ciclosporina",
  "dexamethasone": "Dexametasona",
  "dexmedetomidine": "Dexmedetomidina",
  "diazepam": "Diazepam",
  "doxycycline": "Doxiciclina",
  "ephedrine": "Efedrina",
  "enrofloxacin": "Enrofloxacina",
  "phenylpropalin": "Fenilpropanolamina",
  "firocoxib": "Firocoxib",
  "fluralaner": "Fluralaner",
  "marbofloxacin/clotrimazol/dexamethason": "Marbofloxacina + clotrimazol + dexametasona",
  "framycetin": "Fludrocortisona + framicetina + nistatina + tiabendazol",
  "chlorhexidine digluconate, miconazole nitrate": "Clorhexidina + miconazol",
  "gentamicin/clotrimazol/betametasona": "Gentamicina + betametasona + clotrimazol",
  "praziquantel/pyrantel/fenbantel": "Praziquantel + pirantel + febantel",
  "fipronil": "Fipronil",
  "fluoxetine": "Fluoxetina",
  "frunevetmab": "Frunevetmab",
  "masitinib": "Masitinib",
  "toceranib": "Toceranib",
  "pregabalin": "Pregabalina",
  "mirtazapane": "Mirtazapina",
  "ropinirole hydrochloride": "Ropinirol",
  "cimicoxib": "Cimicoxib",
  "mavacoxib": "Mavacoxib",
  "enflicoxib": "Enflicoxib",
  "lotilaner": "Lotilaner",
  "afoxolaner": "Afoxolaner",
  "sarolaner": "Sarolaner",
  "milbemycinoxim/praziquantel": "Milbemicina oxima + Praziquantel",
  "imidacloprid/moxidectin": "Imidacloprid + Moxidectina",
  "moxidectin/imidacloprid": "Imidacloprid + Moxidectina",
  "fenbendazol": "Fenbendazol",
  "nitenpyram": "Nitenpiram",
  "miltefosine": "Miltefosina",
  "mebendazole": "Mebendazol",
  "meglumine antimonate": "Antimoniato de meglumina",
  "calcium gluconate": "Gluconato cálcico",
  "ivermectine - pyrantel": "Ivermectina + Pirantel",
  "desoxycortone pivalate": "Desoxicortona",
  "benazepril-hydrochlorid/spironolacton": "Benazepril + Espironolactona",
  "velagliflozine": "Velagliflozina",
  "tasipimidine": "Tasipimidina",
  "medetomidine - vatinoxan": "Medetomidina + Vatinoxan",
  "toltrazurile/emodepside": "Emodepsida + Toltrazurilo",
  "emodepside/prazicuantel/tigolaner": "Tigolaner + Emodepsida + Praziquantel",
  "emodepside/prazicuantel": "Emodepsida + Praziquantel",
  "marbofloxacin/ketocanazol/prednisolone": "Marbofloxacino + Ketoconazol + Prednisolona",
  "neomicine/polymixine": "Neomicina + Polimixina B (oftálmica)",
  "prednisolone/polymyxin-b/miconazolnitrate": "Miconazol + Prednisolona + Polimixina B",
  "triamcinolone + salicylic acid": "Triamcinolona + Ácido salicílico",
  "triamcinolone + 2-hydroxybenzo acid + salicylic acid": "Triamcinolona + Ácido salicílico",
  "hydrocortison/miconazol/gentamicine": "Hidrocortisona + Miconazol + Gentamicina",
  "gentamicine/posaconazol/momethason": "Gentamicina + Posaconazol + Mometasona",
  "terbinafin/florfenicol/momethason": "Florfenicol + Terbinafina + Mometasona",
  "terbinafin/florfenicol/betamethason": "Terbinafina + Florfenicol + Betametasona",
  "orbiflo/posaconazol/momethason": "Orbifloxacino + Mometasona + Posaconazol",
  "vitamin b12 / butafosfan": "Butafosfán + Cianocobalamina",
  "fipronil/permethrin": "Fipronilo + Permetrina",
  "deltamethrin": "Deltametrina",
  "permethrin": "Permetrina (collar)",
  "imidacloprid, permetrin": "Imidacloprid + Permetrina",
  "imidacloprid/flumethrin": "Imidacloprid + Flumetrina",
  "dinotefuran/piriproxifen": "Dinotefuran + Piriproxifeno",
  "dinotefuran/piriproxifen/permetrine": "Dinotefuran + Piriproxifeno + Permetrina",
  "sarolaner, moxidectine pyrantel": "Sarolaner + Moxidectina + Pirantel",
  "afoxolaner/milbemycinoxim": "Afoxolaner + Milbemicina oxima",
  "eprinomectin, combinations": "Esafoxolaner + Eprinomectina + Praziquantel",
  "lotilaner, milbemicine": "Lotilaner + Milbemicina oxima",
  "moxidectin": "Moxidectina",
  "chloroxitetracycline": "Oxitetraciclina",
  "clindamycin topic use": "Clindamicina (tópica)",
  "pyrantel/epsiprantel": "Epsiprantel + Pirantel",
  "menbutone": "Menbutona",
  "fucidic acid": "Ácido fusídico + Betametasona (gel)",
  "prednisolone eyedrops": "Lidocaína + Cloranfenicol + Prednisolona (oftálmica)",
  "procaine": "Procaína",
  "benazapril/pimobendan": "Pimobendán + Benazepril",
  "tigilanoltiglat": "Tigilanol tiglato",
  "interferone omega, recombinant": "Interferón omega felino recombinante",
  "fipronil, combinations": "Fipronilo + S-metopreno",
  "lotrifen": "Lotrifén",
  "hydrocortison": "Hidrocortisona aceponato (cutánea)",
  "hydrocortison (otic)": "Hidrocortisona aceponato (ótica)",
  "poly (2-propenal, 2-propenoic acid)": "Ácido 2-fenoxi-2-metilpropiónico",
  "estriol": "Estriol",
  "atinvicitinib": "Atinvicitinib",
  "deslorelon": "Deslorelina",
  "osateron": "Osaterona",
  "ilunocitinib": "Ilunocitinib",
  "aglepriston": "Aglepristona",
  "cabergolin": "Cabergolina",
  "gentamicin": "Gentamicina",
  "lactulose": "Lactulosa",
  "nandrolone": "Nandrolona",
  "oxytocin": "Oxitocina",
  "tetracosactid": "Tetracosactida",
  "furosemide": "Furosemida",
  "gabapentin": "Gabapentina",
  "grapiprant": "Grapiprant",
  "insulin": "Insulina glargina",
  "kaliumbromid": "Bromuro de potasio",
  "itraconazole": "Itraconazol",
  "ivermectine": "Ivermectina",
  "ketamine": "Ketamina",
  "ketoconazole": "Ketoconazol",
  "metergoline": "Metergolina",
  "levothyroxine": "Levotiroxina",
  "lidocainhydrochlorid-monohydrat": "Lidocaína",
  "lokivetmab": "Lokivetmab",
  "maropitant": "Maropitant",
  "marbofloxacin": "Marbofloxacina",
  "medetomidine": "Medetomidina",
  "medroxyprogesterone": "Acetato de medroxiprogesterona",
  "melarsomine": "Melarsomina",
  "meloxicam": "Meloxicam",
  "metamizole": "Metamizol",
  "methadone": "Metadona",
  "oclacitinib": "Oclacitinib",
  "metoclopramid": "Metoclopramida",
  "metronidazole": "Metronidazol",
  "midazolam": "Midazolam",
  "imepitoïne": "Imepitoina",
  "pentobarbital": "Pentobarbital",
  "pentobarbital natrium": "Pentobarbital",
  "phenobarbital": "Fenobarbital",
  "phytomenadione": "Fitomenadiona (Vitamina K1)",
  "pimobendan": "Pimobendán",
  "pradofloxacin": "Pradofloxacina",
  "praziquantel": "Praziquantel",
  "prednisolone": "Prednisolona",
  "propentofylline": "Propentofilina",
  "propofol": "Propofol",
  "ramipril": "Ramipril",
  "robenacoxib": "Robenacoxib",
  "selamectin": "Selamectina",
  "spiramycine + metronidazole": "Espiramicina + Metronidazol",
  "spironolacton": "Espironolactona",
  "telmisartan": "Telmisartán",
  "thiamazole": "Metimazol",
  "torasemid": "Torasemida",
  "tiletamine/zolazepam": "Tiletamina + Zolazepam",
  "thiopental": "Tiopental",
  "tolfenamic acid": "Ácido tolfenámico",
  "tramadolhydrochlorid": "Tramadol",
  "xylazine": "Xilazina",
  "trilostan": "Trilostano"
};

// ============================================================
// CRI — fármacos habituales de hospitalización/UCI, para la calculadora "preparar
// para que dure X horas" (tercer método de la pestaña CRI). Dosis y usos según la
// guía interna "Resumen CRI hospitalización y UCI". dosisUnidad usa los mismos
// valores que CRI_UNIDADES_DOSIS (mcgkgmin, mcgkgh, mgkgmin, mgkgh, mgkgdia, uikgh,
// uikgdia, uikgmin, mukgmin). concentracionSugerida solo se rellena cuando la guía
// asume explícitamente una presentación comercial concreta; si no, se deja en blanco
// para que el usuario indique la de su vial.
// No incluye fármacos con pauta especial no reducible a esta fórmula (bolos únicos
// como el manitol, dosis en ml/kg/h de mezclas ya preparadas como el potasio, o CRI
// sin dosis fija publicada como el tranexámico) — esos se consultan en la ficha del
// fármaco o en la guía original.
const CRI_FARMACOS_UCI = [
  { categoria: "Analgesia", nombre: "Fentanilo", unidadFarmaco: "mg", dosisUnidad: "mcgkgh",
    dosis: { perro: { min: 2, max: 10 }, gato: { min: 1, max: 5 } },
    notas: "Dolor moderado-intenso, politrauma, posoperatorio, ventilación. Carga: 2-5 µg/kg IV lento. Fotosensible según presentación. Vigilar FR, ventilación, sedación, FC y temperatura. En gatos: hipertermia o excitación." },
  { categoria: "Analgesia", nombre: "Remifentanilo", unidadFarmaco: "mg", dosisUnidad: "mcgkgh",
    dosis: { ambas: { min: 3, max: 18 } },
    notas: "Analgesia intraoperatoria o muy titulable. Carga: 2-5 µg/kg IV lento. Sin analgesia residual: instaurar analgesia de transición antes de retirarlo." },
  { categoria: "Analgesia", nombre: "Ketamina (analgesia)", unidadFarmaco: "mg", dosisUnidad: "mgkgh",
    dosis: { ambas: { min: 0.1, max: 0.6 } },
    notas: "Antihiperalgesia y dolor neuropático, dosis subanestésica. Carga opcional: 0,25-0,5 mg/kg IV. Puede combinarse en MLK/FLK. Cautela en hipertensión intracraneal o miocardiopatía hipertrófica." },
  { categoria: "Analgesia", nombre: "Dexmedetomidina (sedación/analgesia)", unidadFarmaco: "mg", dosisUnidad: "mcgkgh", concentracionSugerida: 0.5,
    dosis: { ambas: { min: 0.25, max: 1 } },
    notas: "Sedación cooperativa y analgesia; hasta 2 µg/kg/h en casos seleccionados. Carga opcional: 0,5-1 µg/kg IV lento. Evitar bolo rápido. Contraindicada en shock, hipovolemia, bradicardia o bloqueo AV." },
  { categoria: "Sedación/anestesia/convulsiones", nombre: "Midazolam", unidadFarmaco: "mg", dosisUnidad: "mgkgh",
    dosis: { ambas: { min: 0.1, max: 0.5 } },
    notas: "Sedación, relajación muscular, tétanos, tremores, status. Carga: 0,2-0,3 mg/kg IV. Fotosensible. Vigilar excitación paradójica y depresión respiratoria si se combina con opioides." },
  { categoria: "Sedación/anestesia/convulsiones", nombre: "Diazepam", unidadFarmaco: "mg", dosisUnidad: "mgkgh",
    dosis: { ambas: { min: 0.1, max: 0.5 } },
    notas: "Status epiléptico y espasmos. Carga: 0,5 mg/kg IV. Fotosensible. Usar material compatible (no PVC: adsorción/precipitación). En gatos evitar CRI prolongado (riesgo de necrosis hepática idiosincrásica)." },
  { categoria: "Sedación/anestesia/convulsiones", nombre: "Propofol", unidadFarmaco: "mg", dosisUnidad: "mgkgmin",
    dosis: { perro: { min: 0.1, max: 0.6 }, gato: { min: 0.05, max: 0.4 } },
    notas: "Anestesia, ventilación, status refractario. Carga: 1-6 mg/kg IV titulado a efecto. Puro, no mezclar; asepsia estricta. En gatos evitar CRI prolongado (cuerpos de Heinz/anemia)." },
  { categoria: "Sedación/anestesia/convulsiones", nombre: "Alfaxalona", unidadFarmaco: "mg", dosisUnidad: "mgkgmin",
    dosis: { ambas: { min: 0.05, max: 0.2 } },
    notas: "Sedación profunda/anestesia. Carga: 1-3 mg/kg IV titulado. Controlar ventilación y PA; riesgo de apnea, hipotensión, excitación y acumulación." },
  { categoria: "Sedación/anestesia/convulsiones", nombre: "Ketamina (anticonvulsivante)", unidadFarmaco: "mg", dosisUnidad: "mgkgh",
    dosis: { ambas: { min: 0.5, max: 2 } },
    notas: "Status refractario, tras tratamiento de primera/segunda línea. Carga: 1-5 mg/kg IV titulados. Evitar en hipertensión/taquiarritmia graves." },
  { categoria: "Sedación/anestesia/convulsiones", nombre: "Dexmedetomidina (anticonvulsivante)", unidadFarmaco: "mg", dosisUnidad: "mcgkgh", concentracionSugerida: 0.5,
    dosis: { ambas: { min: 3, max: 7 } },
    notas: "Status epiléptico refractario, tercera línea (principalmente perro). Carga: 3 µg/kg IV lento según protocolo. ECG, PA continua, temperatura y soporte ventilatorio disponible." },
  { categoria: "Vasopresores e inotropos", nombre: "Noradrenalina", unidadFarmaco: "mg", dosisUnidad: "mcgkgmin", concentracionSugerida: 0.5,
    dosis: { ambas: { min: 0.05, max: 2 } },
    notas: "Primera elección en shock distributivo tras fluidos apropiados. Sin carga. Vía exclusiva, preferible central. Fotosensible: proteger jeringa y línea. PA, ECG, lactato y perfusión." },
  { categoria: "Vasopresores e inotropos", nombre: "Adrenalina", unidadFarmaco: "mg", dosisUnidad: "mcgkgmin",
    dosis: { ambas: { min: 0.01, max: 1 } },
    notas: "Shock refractario, anafilaxia grave, inopresión. Sin carga en shock (anafilaxia: 0,01 mg/kg IM). Vía exclusiva, diluida. Fotosensible. Glucosa, lactato, K, ECG y PA." },
  { categoria: "Vasopresores e inotropos", nombre: "Vasopresina", unidadFarmaco: "UI", dosisUnidad: "mukgmin",
    dosis: { ambas: { min: 0.5, max: 2 } },
    notas: "Shock vasopléjico añadido a noradrenalina; hasta 5 mU/kg/min en casos seleccionados. Sin carga rutinaria. Vía exclusiva, diluida. Vigilar perfusión cutánea, GI y renal." },
  { categoria: "Vasopresores e inotropos", nombre: "Dobutamina", unidadFarmaco: "mg", dosisUnidad: "mcgkgmin",
    dosis: { ambas: { min: 1, max: 15 } },
    notas: "Bajo gasto con PA suficiente; hasta 20 µg/kg/min con cautela. Sin carga rutinaria. Vía exclusiva, diluida. Fotosensible. Titular por perfusión, eco, PA y ECG." },
  { categoria: "Vasopresores e inotropos", nombre: "Dopamina", unidadFarmaco: "mg", dosisUnidad: "mcgkgmin",
    dosis: { ambas: { min: 2, max: 15 } },
    notas: "Alternativa inotropa/vasopresora. Sin carga rutinaria. Vía exclusiva, diluida. Fotosensible. Respuesta variable; ECG y PA. La dosis renal no protege el riñón." },
  { categoria: "Vasopresores e inotropos", nombre: "Fenilefrina", unidadFarmaco: "mg", dosisUnidad: "mcgkgmin",
    dosis: { ambas: { min: 0.5, max: 3 } },
    notas: "Vasodilatación con contractilidad conservada; TSVI dinámico. Carga opcional: 1-3 µg/kg IV lento. Alfa puro; titular con PA y gasto." },
  { categoria: "Vasopresores e inotropos", nombre: "Milrinona", unidadFarmaco: "mg", dosisUnidad: "mcgkgmin",
    dosis: { ambas: { min: 0.25, max: 0.75 } },
    notas: "Inodilatación e hipertensión pulmonar seleccionada. Carga: 25-50 µg/kg IV en 10-20 min (omitir si hipotenso). Ajustar en fallo renal." },
  { categoria: "Vasodilatadores e hipertensión", nombre: "Nitroprusiato", unidadFarmaco: "mg", dosisUnidad: "mcgkgmin",
    dosis: { ambas: { min: 0.5, max: 3.5 } },
    notas: "Emergencia hipertensiva, poscarga elevada; hasta 5 µg/kg/min. Sin carga. Diluir SOLO en G5 (D5W); vía exclusiva. Fotosensible: proteger bolsa y línea. PA continua. Riesgo de cianuro/tiocianato." },
  { categoria: "Vasodilatadores e hipertensión", nombre: "Nitroglicerina IV", unidadFarmaco: "mg", dosisUnidad: "mcgkgmin",
    dosis: { ambas: { min: 0.5, max: 5 } },
    notas: "Venodilatación; edema cardiogénico seleccionado. Sin carga. Se adsorbe a PVC: usar material compatible y línea cebada. Fotosensible. Riesgo de tolerancia rápida." },
  { categoria: "Vasodilatadores e hipertensión", nombre: "Fenoldopam", unidadFarmaco: "mg", dosisUnidad: "mcgkgmin",
    dosis: { ambas: { min: 0.1, max: 1.6 } },
    notas: "Emergencia hipertensiva. Iniciar a 0,1 µg/kg/min y aumentar 0,1 cada 15 min hasta máx. 1,6. Sin carga. PA continua y titulación incremental." },
  { categoria: "Vasodilatadores e hipertensión", nombre: "Labetalol", unidadFarmaco: "mg", dosisUnidad: "mcgkgmin",
    dosis: { ambas: { min: 10, max: 25 } },
    notas: "Hipertensión con taquicardia, tras carga. Carga: 0,2-0,5 mg/kg IV lento. ECG y PA. Evitar en insuficiencia cardiaca, bradicardia, bloqueo AV o broncoconstricción." },
  { categoria: "Vasodilatadores e hipertensión", nombre: "Esmolol", unidadFarmaco: "mg", dosisUnidad: "mcgkgmin",
    dosis: { ambas: { min: 25, max: 200 } },
    notas: "Taquicardia supraventricular y control adrenérgico. Carga opcional: 50-500 µg/kg IV lento. Vida media corta; ECG y PA." },
  { categoria: "Antiarrítmicos / analgesia", nombre: "Lidocaína", unidadFarmaco: "mg", dosisUnidad: "mcgkgmin", concentracionSugerida: 20,
    dosis: { perro: { min: 25, max: 80 }, gato: { min: 10, max: 20 } },
    notas: "Perro: analgesia multimodal (25-50 µg/kg/min) o taquicardia ventricular (25-80). Gato: antiarrítmica con cautela (10-20), no rutinaria como analgésica. Carga: perro 1-2 mg/kg IV lento, gato 0,25-0,5 mg/kg si está indicada. ECG continuo. Gatos muy sensibles a toxicidad." },
  { categoria: "Antiarrítmicos", nombre: "Procainamida", unidadFarmaco: "mg", dosisUnidad: "mcgkgmin",
    dosis: { ambas: { min: 10, max: 50 } },
    notas: "Arritmias ventriculares refractarias y algunas TSV, tras carga. Carga: 6-10 mg/kg IV lento. ECG y PA; acumulación en fallo renal." },
  { categoria: "Antiarrítmicos", nombre: "Amiodarona", unidadFarmaco: "mg", dosisUnidad: "mcgkgmin",
    dosis: { ambas: { min: 5, max: 15 } },
    notas: "Arritmias ventriculares refractarias, tras carga. Carga: 5 mg/kg IV lento. Diluyente/material según formulación (frecuentemente G5). Fotosensible. ECG y PA; riesgo de hepatotoxicidad." },
  { categoria: "Antiarrítmicos", nombre: "Diltiazem", unidadFarmaco: "mg", dosisUnidad: "mcgkgmin",
    dosis: { ambas: { min: 1, max: 5 } },
    notas: "Fibrilación auricular o TSV, tras carga. Carga: 0,1-0,25 mg/kg IV lento. Titular a frecuencia y perfusión; ECG y PA. Interacción con betabloqueantes." },
  { categoria: "Diuréticos", nombre: "Furosemida (perro, dosis inicial alta)", unidadFarmaco: "mg", dosisUnidad: "mgkgh",
    dosis: { perro: { min: 0.66, max: 0.66 } },
    notas: "Edema pulmonar cardiogénico grave o refractario. Carga: 2 mg/kg IV (ajustar al tratamiento previo). FR, POCUS, diuresis, peso, PA, creatinina y electrolitos." },
  { categoria: "Diuréticos", nombre: "Furosemida (perro, reducción)", unidadFarmaco: "mg", dosisUnidad: "mgkgh",
    dosis: { perro: { min: 0.33, max: 0.33 } },
    notas: "Descenso tras respuesta clínica o menor gravedad. Carga: 2 mg/kg IV (ajustar al tratamiento previo). Evitar deshidratación, azotemia y alteraciones electrolíticas." },
  { categoria: "Diuréticos", nombre: "Furosemida (gato)", unidadFarmaco: "mg", dosisUnidad: "mgkgh",
    dosis: { gato: { min: 0.33, max: 0.33 } },
    notas: "Edema pulmonar cardiogénico felino seleccionado. Carga: 2 mg/kg IV (ajustar al tratamiento previo). Mayor susceptibilidad a hipovolemia, hipotermia, azotemia y alteraciones electrolíticas." },
  { categoria: "Insulina y metabolismo", nombre: "Insulina regular", unidadFarmaco: "UI", dosisUnidad: "uikgh",
    dosis: { ambas: { min: 0.05, max: 0.1 } },
    notas: "CAD, EHH seleccionado, hiperpotasemia con glucosa. Sin bolo en CAD. Diluir en SSF y cebar línea (se adsorbe); bomba exclusiva. Glucosa, K y P seriados; corregir hipopotasemia importante antes." },
  { categoria: "Insulina y metabolismo", nombre: "Glucagón", unidadFarmaco: "mg", dosisUnidad: "mcgkgh",
    dosis: { ambas: { min: 1, max: 5 } },
    notas: "Insulinoma; toxicidad por betabloqueantes/calcioantagonistas. Carga: 50 µg/kg IV según indicación. Solución fresca tras reconstitución. Glucosa y K frecuentes." },
  { categoria: "Gastrointestinal", nombre: "Metoclopramida", unidadFarmaco: "mg", dosisUnidad: "mgkgdia", concentracionSugerida: 5,
    dosis: { ambas: { min: 1, max: 2 } },
    notas: "Procinético y antiemético. Carga opcional: 0,2-0,5 mg/kg IV lento. Diluir en SSF. Fotosensible. Evitar en obstrucción, perforación o hemorragia GI." },
  { categoria: "Gastrointestinal", nombre: "Eritromicina (procinético)", unidadFarmaco: "mg", dosisUnidad: "mgkgh",
    dosis: { ambas: { min: 0.5, max: 1 } },
    notas: "Procinético de motilina, dosis inferior a la antimicrobiana. Sin carga. Confirmar formulación IV. Riesgo de QT largo y arritmias." },
  { categoria: "Hemostasia y anticoagulación", nombre: "Heparina no fraccionada", unidadFarmaco: "UI", dosisUnidad: "uikgh",
    dosis: { ambas: { min: 15, max: 25 } },
    notas: "Tromboembolismo y circuitos extracorpóreos, tras carga. Carga: 75-100 U/kg IV si está indicada. Bomba exclusiva; ajustar con anti-Xa/aPTT." },
  { categoria: "Otros CRI de UCI", nombre: "Hidrocortisona", unidadFarmaco: "mg", dosisUnidad: "mgkgh",
    dosis: { ambas: { min: 0.08, max: 0.18 } },
    notas: "Shock vasopresor-dependiente con sospecha de CIRCI; no para todo shock. Carga: 1 mg/kg IV. Diluir tras reconstitución. Fotosensible. Glucosa, Na, infección y necesidades de vasopresor." }
];
