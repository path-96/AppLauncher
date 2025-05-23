
"use client";

import { useState, useEffect, type FC, useRef, type DragEvent } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadCloud, FileText } from 'lucide-react';
import type { Category, App } from '@/types';
import { cn } from '@/lib/utils';

interface AddAppDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (app: Omit<App, 'id' | 'icon'>) => void;
  categories: Category[];
  defaultCategoryId?: string | null;
}

const AddAppDialog: FC<AddAppDialogProps> = ({ isOpen, onClose, onSave, categories, defaultCategoryId }) => {
  const [appName, setAppName] = useState('');
  const [appPath, setAppPath] = useState(''); 
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setAppName('');
      setAppPath('');
      setSelectedFileName(null);
      setSelectedCategoryId(defaultCategoryId || (categories.length > 0 ? categories[0].id : undefined));
      setIsDraggingOver(false);
    }
  }, [isOpen, defaultCategoryId, categories]);

  const processFile = (file: File) => {
    if (file) {
      setAppName(file.name.replace(/\.[^/.]+$/, ""));
      setAppPath(file.name);
      setSelectedFileName(file.name);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingOver(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleSubmit = () => {
    if (appName.trim() && appPath.trim() && selectedCategoryId) {
      onSave({ name: appName.trim(), path: appPath.trim(), categoryId: selectedCategoryId });
      onClose();
    } else {
      console.error("情報不足: APP名、APPファイルの選択/ドロップ、Projectの選択をしてください。");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>新規APP追加</DialogTitle>
          <DialogDescription>
            新規APPの詳細情報を入力してください。APPファイルをドラッグ＆ドロップするか、参照して選択します。
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="appName" className="text-right">
              APP名
            </Label>
            <Input
              id="appName"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              className="col-span-3"
              placeholder="例: My Awesome App (ファイルから自動入力)"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="appFile" className="text-right pt-2">
              APPファイル
            </Label>
            <div className="col-span-3">
              <div
                className={cn(
                  "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted transition-colors",
                  isDraggingOver ? "border-primary bg-primary/10" : "border-border",
                )}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
                {selectedFileName ? (
                  <div className="flex flex-col items-center text-center">
                    <FileText className="w-10 h-10 text-primary mb-2" />
                    <p className="text-sm font-medium text-foreground">{selectedFileName}</p>
                    <p className="text-xs text-muted-foreground">クリックまたはドラッグして変更</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center">
                    <UploadCloud className="w-10 h-10 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      <span className="font-semibold text-primary">参照</span>またはドラッグ＆ドロップ
                    </p>
                    <p className="text-xs text-muted-foreground">(例: .exe)</p>
                  </div>
                )}
              </div>
              {appPath && !selectedFileName && (
                 <p className="text-xs text-muted-foreground mt-1">現在のファイル: {appPath}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">
              Project
            </Label>
            <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Projectを選択" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
                {categories.length === 0 && <p className="p-2 text-sm text-muted-foreground">まだProjectがありません。</p>}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>キャンセル</Button>
          <Button onClick={handleSubmit} disabled={!appName.trim() || !appPath.trim() || !selectedCategoryId}>APP追加</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddAppDialog;

