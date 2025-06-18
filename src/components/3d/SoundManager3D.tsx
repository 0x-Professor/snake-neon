
import React, { useEffect, useRef } from 'react';
import { useGameStore } from '../../store/gameStore';

export const SoundManager3D: React.FC = () => {
  const { settings, gameState, score } = useGameStore();
  const audioContextRef = useRef<AudioContext | null>(null);
  const synthRef = useRef<any>(null);

  useEffect(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }, []);

  const playSound = (frequency: number, duration: number = 200, type: OscillatorType = 'sine') => {
    if (!audioContextRef.current || settings.volume === 0) return;

    try {
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = type;
      
      gainNode.gain.setValueAtTime(settings.volume * 0.3, audioContextRef.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContextRef.current.currentTime + duration / 1000);

      oscillator.start();
      oscillator.stop(audioContextRef.current.currentTime + duration / 1000);
    } catch (error) {
      console.warn('Sound playback failed:', error);
    }
  };

  const playVoiceReaction = (type: 'good' | 'bad') => {
    // Simulate voice reactions with synthesized tones
    if (type === 'good') {
      playSound(440, 300, 'triangle'); // A4 note
      setTimeout(() => playSound(523, 300, 'triangle'), 100); // C5 note
    } else {
      playSound(220, 500, 'sawtooth'); // Lower, harsher tone
    }
  };

  // Food collection sound
  useEffect(() => {
    if (score > 0) {
      playSound(659.25, 200, 'triangle'); // E5 note
      playVoiceReaction('good');
    }
  }, [score]);

  // Game over sound
  useEffect(() => {
    if (gameState === 'gameOver') {
      playVoiceReaction('bad');
    }
  }, [gameState]);

  return null;
};
