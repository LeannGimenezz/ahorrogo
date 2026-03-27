import { PenguinIllustration, type PenguinSize } from './PenguinIllustration';
import type { PenguinMood as LegacyPenguinMood } from '../../types';

type LegacyToNewMoodMap = Record<LegacyPenguinMood, 'idle' | 'happy' | 'celebrate' | 'sleep'>;

interface PenguinProps {
  mood: LegacyPenguinMood;
  size?: Exclude<PenguinSize, 'xl'>;
  className?: string;
}

const moodMap: LegacyToNewMoodMap = {
  idle: 'idle',
  happy: 'happy',
  celebrating: 'celebrate',
  waiting: 'sleep',
  encourage: 'happy',
  thinking: 'idle',
  guide: 'idle',
  celebrate: 'celebrate',
  wave: 'happy',
};

export function Penguin({ mood, size = 'md', className = '' }: PenguinProps) {
  return <PenguinIllustration mood={moodMap[mood]} size={size} className={className} />;
}
