import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Component } from "./component.entity";
import { Build } from "./build.entity";

@Entity({ name: 'loads' })
export class Load {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({type: 'timestamp', default: () => "CURRENT_TIMESTAMP(6)"})
  createdAt: Date;

  @ManyToOne(() => Build, (build) => build.loads)
  @JoinColumn({ name: 'buildId' })
  build: Build;
}