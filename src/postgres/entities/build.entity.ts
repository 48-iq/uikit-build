import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Component } from './component.entity';

export enum BuildStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  SUCCESS = 'success',
  FAILED = 'failed',
}

@Entity('builds')
export class Build {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'integer', default: 1 })
  version: number;

  @ManyToOne(() => Component, (component) => component.builds)
  @JoinColumn({ name: 'componentId' })
  component: Component;

  @Column({ type: 'enum', enum: BuildStatus, default: BuildStatus.PENDING })
  status: BuildStatus;

  @Column({ type: 'text', nullable: true })
  logs: string;

  @CreateDateColumn()
  startedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  finishedAt?: Date;

  @Column({ type: 'text', nullable: true })
  previewFilename: string;

  @Column({ type: 'text', nullable: true })
  packageFilename: string;

  @Column({ type: 'text', nullable: true })
  sourceFilename: string;
  
}