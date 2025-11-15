export interface ClassicSave {
  id: string;
  user_id: string;
  current_chapter: number;
  current_level: number;
  active_boons: string[];
  unlocked_boons: string[];
  overall_best_score: number;
  updated_at: string;
}

export interface LifetimeStats {
  id: string;
  user_id: string;
  total_pings: number;
  rounds_completed: number;
  fastest_time: number;
  highest_accuracy: number;
  total_play_time: number;
  boons_unlocked: string[];
}

export interface CustomPreset {
  id: string;
  user_id: string;
  preset_name: string;
  settings: {
    pings: number;
    boxSize: number;
    movement: boolean;
    noiseLevel: number;
    decoys: boolean;
    theme: string;
  };
}
