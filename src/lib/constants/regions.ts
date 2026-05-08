// Regiones de Chile (división política administrativa). Orden geográfico
// de norte a sur. La RM se ubica donde corresponde geográficamente.
export const CHILE_REGIONS = [
  "Arica y Parinacota",
  "Tarapacá",
  "Antofagasta",
  "Atacama",
  "Coquimbo",
  "Valparaíso",
  "Metropolitana de Santiago",
  "O'Higgins",
  "Maule",
  "Ñuble",
  "Biobío",
  "La Araucanía",
  "Los Ríos",
  "Los Lagos",
  "Aysén",
  "Magallanes y Antártica Chilena",
] as const;

export type ChileRegion = (typeof CHILE_REGIONS)[number];
