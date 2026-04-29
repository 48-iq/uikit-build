import { Column, CreateDateColumn, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'components' })
export class Component {

  @PrimaryColumn()
  id: string;

  
  @CreateDateColumn({type: 'timestamp', default: () => "CURRENT_TIMESTAMP(6)"})
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true})
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
}
