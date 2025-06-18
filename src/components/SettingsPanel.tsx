
import React from 'react';
import { useGameStore } from '../store/gameStore';

export const SettingsPanel: React.FC = () => {
  const { settings, updateSettings, toggleSettings } = useGameStore();

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateSettings({ volume: parseFloat(e.target.value) });
  };

  const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateSettings({ gameSpeed: parseInt(e.target.value) });
  };

  const handleThemeToggle = () => {
    updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' });
  };

  const handleKeyRemapping = (key: keyof typeof settings.keyMapping, value: string) => {
    updateSettings({
      keyMapping: {
        ...settings.keyMapping,
        [key]: value.toLowerCase(),
      },
    });
  };

  const handleAccessibilityToggle = (option: keyof typeof settings.accessibility) => {
    updateSettings({
      accessibility: {
        ...settings.accessibility,
        [option]: !settings.accessibility[option],
      },
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black flex items-center justify-center p-4">
      <div className="bg-black/60 backdrop-blur-lg border border-cyan-500/30 rounded-lg p-8 max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-cyan-400">Settings</h2>
          <button
            onClick={toggleSettings}
            className="text-cyan-400 hover:text-cyan-300 text-2xl"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Audio Settings */}
          <div>
            <h3 className="text-xl font-semibold text-white mb-3">🔊 Audio</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-cyan-300 text-sm mb-1">Volume</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.volume}
                  onChange={handleVolumeChange}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="text-right text-cyan-400 text-sm mt-1">
                  {Math.round(settings.volume * 100)}%
                </div>
              </div>
            </div>
          </div>

          {/* Game Settings */}
          <div>
            <h3 className="text-xl font-semibold text-white mb-3">🎮 Game</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-cyan-300 text-sm mb-1">Game Speed</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={settings.gameSpeed}
                  onChange={handleSpeedChange}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="text-right text-cyan-400 text-sm mt-1">
                  {settings.gameSpeed}/10
                </div>
              </div>
              
              <div>
                <label className="block text-cyan-300 text-sm mb-1">Theme</label>
                <button
                  onClick={handleThemeToggle}
                  className={`w-full py-2 px-4 rounded-lg border-2 font-semibold transition-all duration-300 ${
                    settings.theme === 'dark'
                      ? 'bg-gray-800 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-black'
                  }`}
                >
                  {settings.theme === 'dark' ? '🌙 Dark' : '☀️ Light'}
                </button>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div>
            <h3 className="text-xl font-semibold text-white mb-3">⌨️ Controls</h3>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(settings.keyMapping).map(([action, key]) => (
                <div key={action}>
                  <label className="block text-cyan-300 text-sm mb-1 capitalize">
                    {action}
                  </label>
                  <input
                    type="text"
                    value={key}
                    onChange={(e) => handleKeyRemapping(action as keyof typeof settings.keyMapping, e.target.value)}
                    className="w-full py-2 px-3 bg-gray-800 border border-gray-600 rounded text-white text-sm focus:border-cyan-400 focus:outline-none"
                    placeholder="Key"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Accessibility */}
          <div>
            <h3 className="text-xl font-semibold text-white mb-3">♿ Accessibility</h3>
            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.accessibility.reducedMotion}
                  onChange={() => handleAccessibilityToggle('reducedMotion')}
                  className="w-5 h-5 text-cyan-400 bg-gray-800 border-gray-600 rounded focus:ring-cyan-400"
                />
                <span className="text-cyan-300">Reduced Motion</span>
              </label>
              
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.accessibility.highContrast}
                  onChange={() => handleAccessibilityToggle('highContrast')}
                  className="w-5 h-5 text-cyan-400 bg-gray-800 border-gray-600 rounded focus:ring-cyan-400"
                />
                <span className="text-cyan-300">High Contrast</span>
              </label>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-700">
          <button
            onClick={toggleSettings}
            className="w-full py-3 px-6 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg transition-all duration-300"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};
