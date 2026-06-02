import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Build } from './build.entity';
import { Load } from './load.entity';
import { ComponentTag } from './component-tag.enum';

export enum Framework {
  REACT = 'react',
  VUE = 'vue',
  VANILLA = 'vanilla',
}


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

  @Column({
    type: 'enum',
    enum: ComponentTag,
    array: true,
    nullable: true,
    default: [],
  })
  tags: ComponentTag[];

  @Column({
    type: 'enum',
    enum: Framework,
  })
  framework: Framework;

  @Column()
  description: string;

  @Column()
  username: string;

  @OneToMany(() => Build, (build) => build.component)
  builds: Build[];
}
