import { Profiler, ProfilerOnRenderCallback } from 'react';

const isDev = import.meta.env.DEV;

interface ProfilerWrapperProps {
  id: string;
  children: React.ReactNode;
  warnThreshold?: number; // ms
}

export function ProfilerWrapper({ 
  id, 
  children, 
  warnThreshold = 16 
}: ProfilerWrapperProps) {
  // Only enable profiling in development mode
  if (!isDev) {
    return <>{children}</>;
  }
  
  const onRender: ProfilerOnRenderCallback = (
    id,
    phase,
    actualDuration,
    baseDuration,
    startTime,
    commitTime
  ) => {
    // Only log if render takes longer than threshold
    if (actualDuration > warnThreshold) {
      console.warn(
        `[Profiler] ${id} took ${actualDuration.toFixed(2)}ms (${phase})`,
        {
          actualDuration,
          baseDuration,
          startTime,
          commitTime,
        }
      );
    }
  };
  
  return (
    <Profiler id={id} onRender={onRender}>
      {children}
    </Profiler>
  );
}
