import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Component } from './component.entity';

@Entity({ name: 'builds' })
export class BuildEntity {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', nullable: true })
  updatedAt?: Date;

  @ManyToOne(() => Component, (component) => component.builds)
  component: Component;

  @Column({ nullable: false})
  success: boolean;


  
}
