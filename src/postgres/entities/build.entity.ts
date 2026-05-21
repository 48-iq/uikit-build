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

  @Column({ type: 'uuid' })
  componentId: string;

  @ManyToOne(() => Component, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'componentId' })
  component?: Component;

  @Column()
  username: string;

  @Column()
  name: string;

  @Column()
  version: string;

  @Column({ type: 'enum', enum: BuildStatus, default: BuildStatus.PENDING })
  status: BuildStatus;

  @Column({ type: 'text', nullable: true })
  logs: string;

  @Column({ nullable: true })
  errorMessage?: string;

  @CreateDateColumn()
  startedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  finishedAt?: Date;

  @Column({ default: 'component' })
  type: string;
}