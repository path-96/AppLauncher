
"use client";

import type { FC } from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import type { App } from '@/types';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Helper function to generate data-ai-hint from app name
const generateDataAiHintFromName = (name: string): string => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "application"; // Default hint
  if (words.length === 1) return words[0];
  return `${words[0]} ${words[1]}`; // First two words
};

interface AppCardProps {
  app: App;
  onDelete: (appId: string) => void;
}

const AppCard: FC<AppCardProps> = ({ app, onDelete }) => {

  const handleLaunch = () => {
    console.log(`Attempting to launch ${app.name} from ${app.path}`);
  };

  return (
    <div className="relative flex flex-col items-center p-3 hover:bg-muted/20 rounded-lg transition-colors duration-150 group">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-1 right-1 text-muted-foreground hover:text-destructive w-7 h-7 z-10 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
        aria-label={`${app.name}を削除`}
        onClick={() => onDelete(app.id)}
      >
        <Trash2 className="w-4 h-4" />
        <span className="sr-only">APP削除</span>
      </Button>

      <Image
        src={`https://placehold.co/80x80.png`}
        alt={`${app.name} icon`}
        width={80}
        height={80}
        className="rounded-md cursor-pointer mb-2"
        data-ai-hint={generateDataAiHintFromName(app.name)}
        onClick={handleLaunch}
        title={`${app.name}を起動`}
      />
      <div className="text-center w-full max-w-[120px]">
        <p className="text-sm font-medium text-foreground truncate" title={app.name}>
          {app.name}
        </p>
      </div>
    </div>
  );
};

export default AppCard;
