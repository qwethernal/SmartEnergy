import { IsIn } from 'class-validator';

export class DeviceCommandDto {
  @IsIn(['ON', 'OFF'])
  state!: 'ON' | 'OFF';
}
