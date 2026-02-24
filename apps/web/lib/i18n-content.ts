const HOTSPOT_LABELS_ES: Record<string, string> = {
  officer: 'Oficial de calle',
  'courier-contact': 'Contacto del correo',
  'archive-lock': 'Cerradura del archivo',
  'service-door': 'Puerta de servicio',
  'records-ledger': 'Libro de registros',
  'filing-cabinet': 'Archivador',
  'sleeping-clerk': 'Empleado dormido',
  'stamp-desk': 'Escritorio de sellos',
  'courtyard-exit': 'Salida al patio',
  'tram-platform': 'Puesto del andén'
};

const LOCATION_LABELS_ES: Record<string, string> = {
  'street-night': 'Friedrichstrasse de noche',
  'archive-hall': 'Sala de archivo',
  'rail-yard': 'Salida del patio ferroviario'
};

function humanizeId(value: string): string {
  const spaced = value.replaceAll('-', ' ').trim();
  if (!spaced) {
    return value;
  }
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export function tTargetLabel(targetId?: string): string {
  if (!targetId) {
    return 'actual';
  }
  return HOTSPOT_LABELS_ES[targetId] ?? LOCATION_LABELS_ES[targetId] ?? humanizeId(targetId);
}

