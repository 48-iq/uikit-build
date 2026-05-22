import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Build } from './build.entity';
import { Load } from './load.entity';

@Entity({ name: 'components' })
export class Component {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', nullable: true })
  updatedAt?: Date;

  @Column()
  name: string;

  @Column()
  framework: string;

  @Column()
  description: string;

  @Column()
  username: string;

  @Column()
  version: string;

  @OneToMany(() => Build, (build) => build.component)
  builds: Build[];

  @OneToMany(() => Load, (load) => load.component)
  loads: Load[];
}
