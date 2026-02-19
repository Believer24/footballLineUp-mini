export interface Position {
  x: number;
  y: number;
  label: string;
}

export interface Formation {
  positions: Position[];
}

export interface FormationSet {
  [key: string]: Formation;
}

export interface AllFormations {
  '5v5': FormationSet;
  '7v7': FormationSet;
  '11v11': FormationSet;
}

export const FORMATIONS: AllFormations = {
  '5v5': {
    '2-2': {
      positions: [
        { x: 25, y: 75, label: 'DF' },
        { x: 75, y: 75, label: 'DF' },
        { x: 25, y: 30, label: 'FW' },
        { x: 75, y: 30, label: 'FW' },
        { x: 50, y: 52, label: 'MF' },
      ]
    },
    '1-2-1': {
      positions: [
        { x: 50, y: 80, label: 'DF' },
        { x: 25, y: 50, label: 'MF' },
        { x: 75, y: 50, label: 'MF' },
        { x: 50, y: 50, label: 'MF' },
        { x: 50, y: 20, label: 'FW' },
      ]
    },
    '2-1-1': {
      positions: [
        { x: 25, y: 75, label: 'DF' },
        { x: 75, y: 75, label: 'DF' },
        { x: 50, y: 50, label: 'MF' },
        { x: 50, y: 25, label: 'FW' },
        { x: 50, y: 90, label: 'DF' },
      ]
    },
    '3-1': {
      positions: [
        { x: 20, y: 70, label: 'DF' },
        { x: 50, y: 75, label: 'DF' },
        { x: 80, y: 70, label: 'DF' },
        { x: 50, y: 45, label: 'MF' },
        { x: 50, y: 20, label: 'FW' },
      ]
    },
  },
  '7v7': {
    '2-3-1': {
      positions: [
        { x: 50, y: 85, label: 'GK' },
        { x: 30, y: 70, label: 'CB' },
        { x: 70, y: 70, label: 'CB' },
        { x: 20, y: 45, label: 'LM' },
        { x: 50, y: 45, label: 'CM' },
        { x: 80, y: 45, label: 'RM' },
        { x: 50, y: 15, label: 'ST' },
      ]
    },
    '3-2-1': {
      positions: [
        { x: 50, y: 85, label: 'GK' },
        { x: 20, y: 65, label: 'CB' },
        { x: 50, y: 65, label: 'CB' },
        { x: 80, y: 65, label: 'CB' },
        { x: 35, y: 40, label: 'CM' },
        { x: 65, y: 40, label: 'CM' },
        { x: 50, y: 15, label: 'ST' },
      ]
    },
    '3-3': {
      positions: [
        { x: 50, y: 85, label: 'GK' },
        { x: 20, y: 65, label: 'CB' },
        { x: 50, y: 65, label: 'CB' },
        { x: 80, y: 65, label: 'CB' },
        { x: 20, y: 25, label: 'LW' },
        { x: 50, y: 25, label: 'ST' },
        { x: 80, y: 25, label: 'RW' },
      ]
    },
  },
  '11v11': {
    '4-4-2': {
      positions: [
        { x: 50, y: 90, label: 'GK' },
        { x: 15, y: 72, label: 'LB' },
        { x: 38, y: 72, label: 'CB' },
        { x: 62, y: 72, label: 'CB' },
        { x: 85, y: 72, label: 'RB' },
        { x: 15, y: 45, label: 'LM' },
        { x: 38, y: 45, label: 'CM' },
        { x: 62, y: 45, label: 'CM' },
        { x: 85, y: 45, label: 'RM' },
        { x: 35, y: 18, label: 'ST' },
        { x: 65, y: 18, label: 'ST' },
      ]
    },
    '4-3-3': {
      positions: [
        { x: 50, y: 90, label: 'GK' },
        { x: 15, y: 72, label: 'LB' },
        { x: 38, y: 72, label: 'CB' },
        { x: 62, y: 72, label: 'CB' },
        { x: 85, y: 72, label: 'RB' },
        { x: 25, y: 45, label: 'CM' },
        { x: 50, y: 45, label: 'CM' },
        { x: 75, y: 45, label: 'CM' },
        { x: 20, y: 18, label: 'LW' },
        { x: 50, y: 18, label: 'ST' },
        { x: 80, y: 18, label: 'RW' },
      ]
    },
    '3-5-2': {
      positions: [
        { x: 50, y: 90, label: 'GK' },
        { x: 25, y: 72, label: 'CB' },
        { x: 50, y: 72, label: 'CB' },
        { x: 75, y: 72, label: 'CB' },
        { x: 10, y: 50, label: 'LWB' },
        { x: 35, y: 50, label: 'CM' },
        { x: 50, y: 42, label: 'CAM' },
        { x: 65, y: 50, label: 'CM' },
        { x: 90, y: 50, label: 'RWB' },
        { x: 35, y: 18, label: 'ST' },
        { x: 65, y: 18, label: 'ST' },
      ]
    },
    '4-2-3-1': {
      positions: [
        { x: 50, y: 90, label: 'GK' },
        { x: 15, y: 72, label: 'LB' },
        { x: 38, y: 72, label: 'CB' },
        { x: 62, y: 72, label: 'CB' },
        { x: 85, y: 72, label: 'RB' },
        { x: 35, y: 55, label: 'CDM' },
        { x: 65, y: 55, label: 'CDM' },
        { x: 20, y: 35, label: 'LW' },
        { x: 50, y: 35, label: 'CAM' },
        { x: 80, y: 35, label: 'RW' },
        { x: 50, y: 15, label: 'ST' },
      ]
    },
  },
};
