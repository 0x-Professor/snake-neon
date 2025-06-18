
import React, { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';

export const SoundManager: React.FC = () => {
  const { settings, gameState, score } = useGameStore();
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  useEffect(() => {
    // Initialize Web Audio API
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.connect(audioContextRef.current.destination);
    }

    return () => {
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
        oscillatorRef.current = null;
      }
    };
  }, []);

  const playSound = (frequency: number, duration: number = 200, type: OscillatorType = 'sine') => {
    if (!audioContextRef.current || !gainNodeRef.current) return;
    if (settings.volume === 0) return;

    try {
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
      }

      const oscillator = audioContextRef.current.createOscillator();
      const gain = audioContextRef.current.createGain();

      oscillator.connect(gain);
      gain.connect(gainNodeRef.current);

      oscillator.frequency.value = frequency;
      oscillator.type = type;
      
      gain.gain.setValueAtTime(settings.volume * 0.1, audioContextRef.current.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioContextRef.current.currentTime + duration / 1000);

      oscillator.start();
      oscillator.stop(audioContextRef.current.currentTime + duration / 1000);

      oscillatorRef.current = oscillator;
    } catch (error) {
      console.warn('Sound playback failed:', error);
    }
  };

  // Play sounds based on game events
  useEffect(() => {
    if (gameState === 'playing') {
      // Play a subtle background tone
      const interval = setInterval(() => {
        if (gameState === 'playing') {
          playSound(100 + (score * 2), 100, 'sine');
        }
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [gameState, score]);

  // Food collection sound effect
  useEffect(() => {
    if (score > 0) {
      playSound(523.25, 150, 'triangle'); // C5 note
    }
  }, [score]);

  return null;
};
