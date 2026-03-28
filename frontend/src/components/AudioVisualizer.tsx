import { useEffect, useState } from 'react';

interface AudioVisualizerProps {
  isRecording: boolean;
}

const AudioVisualizer = ({ isRecording }: AudioVisualizerProps) => {
  const [bars, setBars] = useState<number[]>(new Array(30).fill(10));

  useEffect(() => {
    if (!isRecording) {
      setBars(new Array(30).fill(5));
      return;
    }

    const interval = setInterval(() => {
      setBars(prev => prev.map(() => Math.max(10, Math.random() * 100)));
    }, 100);

    return () => clearInterval(interval);
  }, [isRecording]);

  return (
    <div className="flex items-center justify-center gap-1 h-32 w-full bg-secondary/50 rounded-xl overflow-hidden p-6">
      {bars.map((height, index) => (
        <div
          key={index}
          className="w-1.5 md:w-2 bg-primary rounded-full transition-all duration-100 ease-in-out"
          style={{ height: `${height}%`, opacity: isRecording ? 0.8 : 0.3 }}
        />
      ))}
    </div>
  );
};

export default AudioVisualizer;