import { SessionParticipant } from '@prisma/client';

export interface ParticipantDto {
  id: string;
  displayName: string;
  isConnected: boolean;
}

export function participantToDto(entity: SessionParticipant): ParticipantDto {
  return {
    id: entity.id,
    displayName: entity.displayName,
    isConnected: entity.isConnected,
  };
}
