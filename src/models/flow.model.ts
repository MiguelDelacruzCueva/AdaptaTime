export type BlockType = 'ENFOQUE' | 'DESCANSO' | 'MOVIMIENTO' | 'PROCRASTINAR';

export interface Block {
  id: string;
  flowId?: string;
  type: BlockType;
  durationMinutes: number;
  position: number;
}

export interface Flow {
  id: string;
  name: string;
  blocks: Block[];
  createdAt?: string;
}