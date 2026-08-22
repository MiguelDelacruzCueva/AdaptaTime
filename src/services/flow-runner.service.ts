// src/services/flow-runner.service.ts
import { Flow, BlockType } from '../models/flow.model';
import { StorageService } from './storage.service';
import { AudioService } from './audio.service';
import { TauriService } from './tauri.service';

type FlowListener = () => void;

export class FlowRunnerService {
  private static flow: Flow | null = null;
  private static currentBlockIndex: number = 0;
  private static secondsRemaining: number = 0;
  private static isRunning: boolean = false;
  private static intervalId: number | null = null;
  private static timeSpent: Record<BlockType, number> = {
    ENFOQUE: 0, DESCANSO: 0, MOVIMIENTO: 0, PROCRASTINAR: 0
  };
  private static listeners: Set<FlowListener> = new Set();

  static isBusy(): boolean {
    return this.flow !== null;
  }

  static getStatus() {
    if (!this.flow || !this.flow.blocks || this.flow.blocks.length === 0) return null;
    const currentBlock = this.flow.blocks[this.currentBlockIndex] || this.flow.blocks[0];
    const nextBlock = this.flow.blocks[this.currentBlockIndex + 1] || null;

    return {
      flow: this.flow,
      flowName: this.flow.name,
      currentBlockIndex: this.currentBlockIndex,
      totalBlocks: this.flow.blocks.length,
      currentBlock,
      nextBlock,
      secondsRemaining: this.secondsRemaining,
      isRunning: this.isRunning
    };
  }

  static startFlow(flow: Flow): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.flow = flow;
    this.currentBlockIndex = 0;
    this.timeSpent = { ENFOQUE: 0, DESCANSO: 0, MOVIMIENTO: 0, PROCRASTINAR: 0 };
    const firstBlock = flow.blocks[0];
    this.secondsRemaining = (firstBlock ? firstBlock.durationMinutes : 1) * 60;
    this.isRunning = true;

    this.intervalId = window.setInterval(() => {
      if (this.secondsRemaining > 0) {
        this.secondsRemaining--;
        const curType = this.flow?.blocks[this.currentBlockIndex]?.type || 'ENFOQUE';
        this.timeSpent[curType] = (this.timeSpent[curType] || 0) + 1;
        this.notify();
      } else {
        this.nextBlock();
      }
    }, 1000);

    this.notify();
  }

  static pause(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    this.notify();
  }

  static resume(): void {
    if (!this.flow || this.isRunning) return;
    this.isRunning = true;
    this.intervalId = window.setInterval(() => {
      if (this.secondsRemaining > 0) {
        this.secondsRemaining--;
        const curType = this.flow?.blocks[this.currentBlockIndex]?.type || 'ENFOQUE';
        this.timeSpent[curType] = (this.timeSpent[curType] || 0) + 1;
        this.notify();
      } else {
        this.nextBlock();
      }
    }, 1000);
    this.notify();
  }

  static resetCurrentBlock(): void {
    if (!this.flow) return;
    const block = this.flow.blocks[this.currentBlockIndex];
    this.secondsRemaining = (block ? block.durationMinutes : 1) * 60;
    this.notify();
  }

  static nextBlock(): void {
    if (!this.flow) return;
    AudioService.playNotificationSound();

    if (this.currentBlockIndex < this.flow.blocks.length - 1) {
      this.currentBlockIndex++;
      const nextB = this.flow.blocks[this.currentBlockIndex];
      this.secondsRemaining = (nextB ? nextB.durationMinutes : 1) * 60;
      TauriService.notifyBlockFinished('Siguiente bloque', `Iniciando ${nextB.type} (${nextB.durationMinutes}m)`);
      this.notify();
    } else {
      this.finishFlow();
    }
  }

  static finishFlow(): void {
    if (!this.flow) return;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;

    const breakdown: Record<BlockType, number> = {
      ENFOQUE: Math.round((this.timeSpent.ENFOQUE || 0) / 60),
      DESCANSO: Math.round((this.timeSpent.DESCANSO || 0) / 60),
      MOVIMIENTO: Math.round((this.timeSpent.MOVIMIENTO || 0) / 60),
      PROCRASTINAR: Math.round((this.timeSpent.PROCRASTINAR || 0) / 60)
    };

    const totalMins = Object.values(breakdown).reduce((a, b) => a + b, 0);

    StorageService.recordSession({
      id: crypto.randomUUID(),
      flowId: this.flow.id,
      flowName: this.flow.name,
      completedAt: new Date().toISOString(),
      totalDurationMinutes: Math.max(1, totalMins),
      completedBlocks: this.flow.blocks.length,
      totalBlocks: this.flow.blocks.length,
      breakdown
    });

    TauriService.notifyBlockFinished('¡Flujo terminado!', `Has completado "${this.flow.name}".`);
    
    this.flow = null;
    this.currentBlockIndex = 0;
    this.secondsRemaining = 0;
    this.notify();
  }

  static stopFlow(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    this.flow = null;
    this.currentBlockIndex = 0;
    this.secondsRemaining = 0;
    this.notify();
  }

  static subscribe(fn: FlowListener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private static notify(): void {
    this.listeners.forEach(fn => fn());
  }
}