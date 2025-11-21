/**
 * Save Slot Picker UI Component
 * Displays all save slots and allows managing them
 */

import { useState, useEffect } from 'react';
import { Plus, MoreVertical, Play, Trash2, Edit, Download, Share2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { SaveSlot } from '@/lib/game/customSessionDB';
import { getAllSaveSlots, deleteSaveSlot } from '@/lib/game/saveSlotManager';
import { formatDistanceToNow } from 'date-fns';

interface SaveSlotPickerProps {
  onSelectSlot: (slotId: string) => void;
  onNewGame: () => void;
  onExportSlot: (slot: SaveSlot) => void;
  onShareSlot: (slot: SaveSlot) => void;
  onRenameSlot: (slot: SaveSlot) => void;
  onDuplicateSlot: (slot: SaveSlot) => void;
}

export function SaveSlotPicker({
  onSelectSlot,
  onNewGame,
  onExportSlot,
  onShareSlot,
  onRenameSlot,
  onDuplicateSlot,
}: SaveSlotPickerProps) {
  const [slots, setSlots] = useState<SaveSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [slotToDelete, setSlotToDelete] = useState<SaveSlot | null>(null);

  const loadSlots = async () => {
    setLoading(true);
    const loadedSlots = await getAllSaveSlots();
    setSlots(loadedSlots);
    setLoading(false);
  };

  useEffect(() => {
    loadSlots();
    
    // Listen for storage events to reload slots
    const handleStorageChange = () => {
      loadSlots();
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleDeleteClick = (slot: SaveSlot) => {
    setSlotToDelete(slot);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!slotToDelete) return;

    try {
      await deleteSaveSlot(slotToDelete.id);
      await loadSlots();
      setDeleteDialogOpen(false);
      setSlotToDelete(null);
    } catch (error) {
      console.error('Failed to delete slot:', error);
    }
  };

  if (loading) {
    return (
      <div className="flat-card py-12">
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-small text-muted-foreground">Loading saved games...</p>
        </div>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="flat-card py-12">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Play className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="text-center space-y-1">
            <h3 className="text-heading-3">No Saved Games</h3>
            <p className="text-small text-muted-foreground">Start a new game to create your first save</p>
          </div>
          <Button onClick={onNewGame} size="lg" className="mt-2">
            <Plus className="w-4 h-4 mr-2" />
            New Game
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-heading-3">Saved Games</h3>
        <Button onClick={onNewGame} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          New Game
        </Button>
      </div>

      <div className="grid gap-3">
        {slots.map((slot) => (
          <div
            key={slot.id}
            className="flat-card bg-card hover:bg-card/80 transition-colors group"
          >
            <div className="flex items-start gap-3">
              {/* Slot Info */}
              <button
                onClick={() => onSelectSlot(slot.id)}
                className="flex-1 text-left min-w-0"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="text-base font-semibold truncate">{slot.name}</h4>
                  <Play className="w-4 h-4 text-primary flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                
                <div className="space-y-1">
                  <p className="text-small text-muted-foreground">
                    Round {slot.session.currentRound}
                    {slot.session.config.numberOfRounds > 1 && ` of ${slot.session.config.numberOfRounds}`}
                    {slot.session.config.numberOfRounds === -1 && ' (Cozy Mode)'}
                  </p>
                  <p className="text-tiny text-muted-foreground">
                    Last played {formatDistanceToNow(slot.lastPlayed, { addSuffix: true })}
                  </p>
                </div>
              </button>

              {/* Actions Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onSelectSlot(slot.id)}>
                    <Play className="w-4 h-4 mr-2" />
                    Load Game
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onRenameSlot(slot)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDuplicateSlot(slot)}>
                    <Copy className="w-4 h-4 mr-2" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onExportSlot(slot)}>
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onShareSlot(slot)}>
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleDeleteClick(slot)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Saved Game?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{slotToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
