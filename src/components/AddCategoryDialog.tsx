
"use client";

import { useState, useEffect, type FC } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Category } from '@/types';

interface AddCategoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, id?: string) => void;
  existingCategory?: Category | null;
}

const AddCategoryDialog: FC<AddCategoryDialogProps> = ({ isOpen, onClose, onSave, existingCategory }) => {
  const [name, setName] = useState('');

  useEffect(() => {
    if (existingCategory) {
      setName(existingCategory.name);
    } else {
      setName('');
    }
  }, [existingCategory, isOpen]);

  const handleSubmit = () => {
    if (name.trim()) {
      onSave(name.trim(), existingCategory?.id);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{existingCategory ? 'Project名前変更' : 'Project追加'}</DialogTitle>
          <DialogDescription>
            {!existingCategory ? "Project フォルダーも同時に作成します。" : null}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              名前
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              autoFocus
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>キャンセル</Button>
          <Button onClick={handleSubmit} disabled={!name.trim()}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddCategoryDialog;
