export interface Metric {
  value: string;
  label: string;
}

export interface CaseStudy {
  id: string;
  client: string;
  year: number;
  services: string[];
  countries: string[];
  region: string;
  permission: boolean;
  contributor_source?: string;
  contributor_name?: string;
  title: string;
  challenge: string;
  approach: string;
  metrics: Metric[];
  imagery?: {
    logo?: string;        // relative path from public/case-imagery/, e.g. "cosmo5/logo.svg"
    key_visual?: string;  // relative path from public/case-imagery/, e.g. "cosmo5/key-visual.jpg"
  };
}

export type GroupMode = 'vertical' | 'country' | 'region';

export interface NucleusOrbit {
  key: string;           // group label e.g. "Media"
  center: { x: number; y: number; z: number }; // position at t=0
  orbitU: { x: number; y: number; z: number }; // orbital plane basis vector u
  orbitV: { x: number; y: number; z: number }; // orbital plane basis vector v
  orbitR: number;        // orbital radius around staging center
  phase: number;         // starting angle
  speed: number;         // rad/frame (0.00002–0.00008)
  cases: CaseStudy[];
}

export interface StarOrbit {
  caseStudy: CaseStudy;
  nucleusKey: string;
  orbitCenter: { x: number; y: number; z: number }; // nucleus world position at t=0
  u: { x: number; y: number; z: number };  // base position on sphere surface (magnitude = r)
  v: { x: number; y: number; z: number };  // rotation u-axis
  r: number;
  phase: number;
  speed: number;         // rad/frame, signed (negative = retrograde)
  _ax?: { x: number; y: number; z: number }; // rotation axis for Rodrigues drift
}
