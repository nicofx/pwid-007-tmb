import type { ActionVerb } from '@tmb/contracts';

export type PlayScenarioId = 'core-a' | 'core-b' | 'core-c';

export interface ScenarioStep {
  verb: ActionVerb;
  targetId?: string;
  playerText: string;
  note: string;
}

export interface PlayScenario {
  id: PlayScenarioId;
  label: string;
  description: string;
  recommendedPresetId: string;
  steps: ScenarioStep[];
}

export const PLAY_SCENARIOS: PlayScenario[] = [
  {
    id: 'core-a',
    label: 'Ruta A - Escape sigiloso',
    description: 'Ruta sigilosa para escapar con pruebas.',
    recommendedPresetId: 'guided',
    steps: [
      {
        verb: 'OBSERVE',
        targetId: 'courier-contact',
        playerText: 'Observar al contacto del correo.',
        note: 'Leer ritmo del contacto.'
      },
      {
        verb: 'TALK',
        targetId: 'officer',
        playerText: 'Hablar con el oficial con cuidado.',
        note: 'Buscar ventaja social.'
      },
      {
        verb: 'SEARCH',
        targetId: 'service-door',
        playerText: 'Buscar alrededor de la puerta de servicio.',
        note: 'Abrir ruta al archivo.'
      },
      {
        verb: 'MOVE',
        targetId: 'service-door',
        playerText: 'Moverse por la puerta de servicio.',
        note: 'Transición de escena.'
      },
      {
        verb: 'SEARCH',
        targetId: 'records-ledger',
        playerText: 'Buscar en el libro de registros.',
        note: 'Objetivo de pista principal.'
      }
    ]
  },
  {
    id: 'core-b',
    label: 'Ruta B - Enfoque social',
    description: 'Ruta de diálogo para abrir acceso.',
    recommendedPresetId: 'default',
    steps: [
      {
        verb: 'TALK',
        targetId: 'officer',
        playerText: 'Iniciar conversación con el oficial.',
        note: 'Subir confianza o abrir ventana.'
      },
      {
        verb: 'TALK',
        targetId: 'courier-contact',
        playerText: 'Hablar con el contacto del correo.',
        note: 'Conectar objetivos.'
      },
      {
        verb: 'OBSERVE',
        targetId: 'service-door',
        playerText: 'Observar la puerta de servicio antes de moverse.',
        note: 'Evitar bloqueo tonto.'
      },
      {
        verb: 'MOVE',
        targetId: 'service-door',
        playerText: 'Moverse hacia el acceso al archivo.',
        note: 'Avanzar el ritmo.'
      }
    ]
  },
  {
    id: 'core-c',
    label: 'Ruta C - Investigación',
    description: 'Ruta de investigación para acumular pistas.',
    recommendedPresetId: 'guided',
    steps: [
      {
        verb: 'SEARCH',
        targetId: 'archive-lock',
        playerText: 'Inspeccionar la cerradura del archivo.',
        note: 'Primera señal técnica.'
      },
      {
        verb: 'SEARCH',
        targetId: 'records-ledger',
        playerText: 'Buscar pistas de transporte en el libro.',
        note: 'Pista de progreso.'
      },
      {
        verb: 'SEARCH',
        targetId: 'filing-cabinet',
        playerText: 'Buscar en el archivador.',
        note: 'Profundizar inventario de pistas.'
      },
      {
        verb: 'OBSERVE',
        targetId: 'tram-platform',
        playerText: 'Observar la plataforma del tranvía.',
        note: 'Preparar salida.'
      }
    ]
  }
];

export function getScenarioById(id: PlayScenarioId): PlayScenario {
  const found = PLAY_SCENARIOS.find((scenario) => scenario.id === id);
  if (found) {
    return found;
  }
  return PLAY_SCENARIOS[0] as PlayScenario;
}
