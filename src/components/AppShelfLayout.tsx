
"use client";

import { useState, useEffect, useCallback, useRef, type DragEvent }  from 'react';
import type { App, Category } from '@/types';
import useLocalStorage from '@/hooks/useLocalStorage';
import AppCard from '@/components/AppCard';
import AddCategoryDialog from '@/components/AddCategoryDialog';
import AddAppDialog from '@/components/AddAppDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { PlusCircle, Folder, Edit3, Trash2, Search, FolderOpen, Pin, PanelLeft, ArrowUpDown, SlidersHorizontal, X, Notebook, BookUser, Network, UploadCloud } from 'lucide-react';
import { cn } from '@/lib/utils';


type SortCriteria = 'default' | 'name-asc' | 'name-desc' | 'date-newest' | 'date-oldest';

interface CategoryIpConfig {
  ip: string;
  gateway: string;
  plcIp: string;
}

type CategoryIpAddresses = Record<string, CategoryIpConfig>;


const AppShelfLayout = () => {
  const [categories, setCategories] = useLocalStorage<Category[]>('appShelfCategories', []);
  const [apps, setApps] = useLocalStorage<App[]>('appShelfApps', []);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isClient, setIsClient] = useState(false);
  const [sortCriteria, setSortCriteria] = useState<SortCriteria>('default');

  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isAddAppOpen, setIsAddAppOpen] = useState(false);

  const [isFarRightPanelOpen, setIsFarRightPanelOpen] = useState(false);
  
  const [globalIp, setGlobalIp] = useState('');
  const [globalGateway, setGlobalGateway] = useState('');
  const [globalSecondaryIp, setGlobalSecondaryIp] = useState('');
  const [globalSecondaryGateway, setGlobalSecondaryGateway] = useState('');

  const [isDraggingOverDataFolder, setIsDraggingOverDataFolder] = useState(false);


  const [categoryIpAddresses, setCategoryIpAddresses] = useLocalStorage<CategoryIpAddresses>(
    'appShelfCategoryIpAddresses',
    {}
  );

  useEffect(() => {
    setIsClient(true);
  }, []);

  const getFilteredCategories = useCallback((): Category[] => {
    if (!isClient || !Array.isArray(categories)) {
      return [];
    }
    let filtered = [...categories];
    if (searchTerm.trim()) {
      filtered = filtered.filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    const pinned = filtered.filter(cat => cat.isPinned);
    const unpinned = filtered.filter(cat => !cat.isPinned);

    const sortFunction = (a: Category, b: Category) => {
      switch (sortCriteria) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'date-newest':
          const timeA = !isNaN(parseInt(a.id, 10)) && a.id.length > 5 ? parseInt(a.id, 10) : (a.sortOrder || 0);
          const timeB = !isNaN(parseInt(b.id, 10)) && b.id.length > 5 ? parseInt(b.id, 10) : (b.sortOrder || 0);
          return timeB - timeA;
        case 'date-oldest':
          const timeAOld = !isNaN(parseInt(a.id, 10)) && a.id.length > 5 ? parseInt(a.id, 10) : (a.sortOrder || 0);
          const timeBOld = !isNaN(parseInt(b.id, 10)) && b.id.length > 5 ? parseInt(b.id, 10) : (b.sortOrder || 0);
          return timeAOld - timeBOld;
        case 'default':
        default:
          const sortOrderA = typeof a.sortOrder === 'number' ? a.sortOrder : Date.now();
          const sortOrderB = typeof b.sortOrder === 'number' ? b.sortOrder : Date.now();
          if (sortOrderA !== sortOrderB) {
              return sortOrderA - sortOrderB;
          }
          const idTimeA = !isNaN(parseInt(a.id, 10)) && a.id.length > 5 ? parseInt(a.id, 10) : 0;
          const idTimeB = !isNaN(parseInt(b.id, 10)) && b.id.length > 5 ? parseInt(b.id, 10) : 0;
          if (idTimeA !== idTimeB) return idTimeA - idTimeB;
          return a.name.localeCompare(b.name);
      }
    };

    pinned.sort(sortFunction);
    unpinned.sort(sortFunction);

    return [...pinned, ...unpinned];
  }, [isClient, categories, searchTerm, sortCriteria]);


  useEffect(() => {
    if (isClient && categories.length > 0 && categories.some(cat => typeof cat.sortOrder !== 'number')) {
      setCategories(prev => {
        const updated = prev.map((cat, index) => ({
          ...cat,
          sortOrder: typeof cat.sortOrder === 'number' ? cat.sortOrder : (Date.now() + index),
        }));
        return updated;
      });
    }
  }, [isClient, categories, setCategories]);


 useEffect(() => {
    if (isClient) {
      const currentCategories = getFilteredCategories(); 
      const currentSelectionExists = selectedCategoryId && currentCategories.some(c => c.id === selectedCategoryId);

      if (currentCategories.length > 0 && (!currentSelectionExists || !selectedCategoryId)) {
        setSelectedCategoryId(currentCategories[0].id);
      } else if (currentCategories.length === 0 && selectedCategoryId !== null) {
        setSelectedCategoryId(null);
      }
    }
  }, [isClient, getFilteredCategories, categories, searchTerm, sortCriteria, selectedCategoryId]); 


  const handleSaveCategory = (name: string, id?: string) => {
    if (id) {
      setCategories(prev => prev.map(cat => cat.id === id ? { ...cat, name } : cat));
    } else {
      const currentCategoriesState = categories;
      const newCategory: Category = {
        id: Date.now().toString(),
        name,
        isPinned: false,
        sortOrder: Date.now()
      };
      setCategories(prev => [...prev, newCategory]);
      setCategoryIpAddresses(prev => ({
        ...prev,
        [newCategory.id]: { ip: '', gateway: '', plcIp: '' } 
      }));
      if(isClient && (currentCategoriesState.length === 0 || !selectedCategoryId)) {
        setSelectedCategoryId(newCategory.id);
      }
    }
    setEditingCategory(null);
  };

  const handleDeleteCategory = (categoryId: string) => {
    setApps(prev => prev.filter(app => app.categoryId !== categoryId));
    
    setCategoryIpAddresses(prev => {
      const updatedIps = { ...prev };
      delete updatedIps[categoryId];
      return updatedIps;
    });

    setCategories(prev => {
      const updatedCategories = prev.filter(cat => cat.id !== categoryId);
      const remainingCategoriesForSelection = getFilteredCategories().filter(cat => cat.id !== categoryId);

      if (selectedCategoryId === categoryId) {
          setSelectedCategoryId(remainingCategoriesForSelection.length > 0 ? remainingCategoriesForSelection[0].id : null);
      }
      return updatedCategories;
    });
    setCategoryToDelete(null); 
  };

  const confirmDeleteCategory = () => {
    if (categoryToDelete) {
      handleDeleteCategory(categoryToDelete.id);
    }
  };

  const handleTogglePinCategory = (categoryId: string) => {
    setCategories(prev =>
      prev.map(cat =>
        cat.id === categoryId ? { ...cat, isPinned: !cat.isPinned } : cat
      )
    );
  };

  const handleSaveApp = (appData: Omit<App, 'id' | 'icon'>) => {
    const newApp = { ...appData, id: Date.now().toString() };
    setApps(prev => [...prev, newApp]);
  };

  const handleDeleteApp = (appId: string) => {
    setApps(prev => prev.filter(app => app.id !== appId));
  };

  const selectedCategory = isClient ? categories.find(c => c.id === selectedCategoryId) : null;


  const handleChangeIpClick = () => {
    if (selectedCategoryId && selectedCategory) {
      const currentConfig = categoryIpAddresses[selectedCategoryId];
      if (currentConfig) {
        const ipToChange = currentConfig.ip;
        const gatewayToChange = currentConfig.gateway; 
        console.log(`「${selectedCategory.name}」のIPアドレス「${ipToChange || '未設定'}」, Gateway「${gatewayToChange || '未設定'}」の変更処理 (概念的)`);
      }
    }
  };
  
  const handlePingPlcClick = () => {
    if (selectedCategoryId && selectedCategory) {
      const currentConfig = categoryIpAddresses[selectedCategoryId];
      const plcIpToPing = currentConfig?.plcIp;
      console.log(`「${selectedCategory.name}」のPLC IPアドレス「${plcIpToPing || '未設定'}」のPing処理 (概念的)`);
    }
  };

  const handleDataManagementClick = (toolType: string, categoryName?: string) => {
    const catName = categoryName || (selectedCategory ? selectedCategory.name : "選択されたProject");
    let message = "";
    switch (toolType) {
      case 'notepad':
        message = `「${catName}」の「メモ帳」機能がクリックされました。`;
        break;
      case 'addressBook':
        message = `「${catName}」の「アドレス表」機能がクリックされました。`;
        break;
      case 'dataFolder':
        message = `「${catName}」の「データFolder」機能がクリックされました。`;
        break;
      default:
        message = "不明なデータ管理機能がクリックされました。";
    }
    console.log(message + " これは概念的なものです。");
  };

  const handleGlobalWiredIpChange = () => {
    console.log(`Global IP Change clicked. IP: ${globalIp}, Gateway: ${globalGateway}`);
  };

  const handleGlobalSecondaryIpChange = () => {
    console.log(`Global Secondary IP Change clicked. IP: ${globalSecondaryIp}, Gateway: ${globalSecondaryGateway}`);
  };


  const filteredApps = (() => {
    if (!isClient) return [];
    return apps
      .filter(app => selectedCategoryId ? app.categoryId === selectedCategoryId : true);
  })();

  let categoryMenuItemsElements: JSX.Element[] = [];
  if (isClient) {
    const categoriesForDisplay = getFilteredCategories();
    categoryMenuItemsElements = categoriesForDisplay.map((category) => {
      return (
        <SidebarMenuItem key={category.id} className="group/menu-item px-1 py-1">
          <div className="flex items-center w-full gap-1">
             <div className="flex items-center flex-shrink-0">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleTogglePinCategory(category.id)} title={category.isPinned ? 'Projectのピン留め解除' : 'Projectをピン留め'}>
                    <Pin className={`w-4 h-4 ${category.isPinned ? 'fill-primary text-sidebar-foreground' : 'text-sidebar-foreground hover:text-primary'}`} />
                </Button>
             </div>

            <SidebarMenuButton
              isActive={selectedCategoryId === category.id}
              onClick={() => setSelectedCategoryId(category.id)}
              className="justify-start group-data-[collapsible=icon]:justify-center flex-grow min-w-0 p-1 gap-1"
              tooltip={category.name}
            >
              <Folder className="w-5 h-5 flex-shrink-0" />
              <span className={cn(
                "truncate group-data-[collapsible=icon]:hidden",
                 category.isPinned ? "text-sidebar-primary font-medium" : "text-sidebar-foreground"
              )}>{category.name}</span>
            </SidebarMenuButton>

            <div className="flex items-center flex-shrink-0">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingCategory(category); setIsAddCategoryOpen(true);}} title="Project編集">
                <Edit3 className="w-4 h-4" />
                <span className="sr-only">Project編集</span>
              </Button>
               <AlertDialog>
                <AlertDialogTrigger asChild>
                   <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={() => setCategoryToDelete(category)} title="Project削除">
                    <Trash2 className="w-4 h-4" />
                     <span className="sr-only">Project削除</span>
                  </Button>
                </AlertDialogTrigger>
                {categoryToDelete && categoryToDelete.id === category.id && (
                 <AlertDialogContent>
                   <AlertDialogHeader>
                     <AlertDialogTitle>このProjectを削除してもよろしいですか？</AlertDialogTitle>
                     <AlertDialogDescription>
                       この操作は元に戻せません。Project「{categoryToDelete.name}」および関連するすべてのAPPが完全に削除されます。
                     </AlertDialogDescription>
                   </AlertDialogHeader>
                   <AlertDialogFooter>
                     <AlertDialogCancel onClick={() => setCategoryToDelete(null)}>キャンセル</AlertDialogCancel>
                     <AlertDialogAction
                       onClick={confirmDeleteCategory}
                       className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                     >
                       削除
                     </AlertDialogAction>
                   </AlertDialogFooter>
                 </AlertDialogContent>
               )}
             </AlertDialog>
            </div>
          </div>
        </SidebarMenuItem>
      );
    });
  } else {
     categoryMenuItemsElements.push(
        <div key="ssr-placeholder" className="p-4 text-center text-muted-foreground group-data-[collapsible=icon]:hidden">
          {/* SSR Placeholder */}
        </div>
     );
  }
  const handleDragOverDataFolder = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!selectedCategoryId) return;
    setIsDraggingOverDataFolder(true);
  };

  const handleDragLeaveDataFolder = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingOverDataFolder(false);
  };

  const handleDropDataFolder = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingOverDataFolder(false);
    if (!selectedCategoryId || !selectedCategory) return;

    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      console.log(`「${selectedCategory.name}」のデータFolderにファイルがドロップされました: ${file.name} (サイズ: ${file.size} bytes, タイプ: ${file.type})`);
      // Here you would typically handle the file (e.g., prepare for upload, read content)
      // For now, we just log it.
    }
  };


  return (
    <SidebarProvider defaultOpen>
      <Sidebar variant="sidebar" collapsible="icon" side="left"> {/* Category Sidebar */}
        <SidebarHeader className="p-4">
          <div className="flex flex-col items-start group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 gap-2">
            {/*<Image
                src="/yutaka-logo-bg.png"
                alt="Yutaka Logo"
                width={200}
                height={200}
                className="object-contain"
                data-ai-hint="abstract geometric"
              />
              {/*<h1 className="text-lg font-semibold group-data-[collapsible=icon]:hidden mt-1">...</h1>*/}
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu className="flex-1 min-h-0">
            <div className="flex items-center gap-2 px-2 group-data-[collapsible=icon]:flex-col mb-2">
                <Button
                    variant="default"
                    className="w-full justify-start group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-auto group-data-[collapsible=icon]:p-2"
                    onClick={() => setIsAddCategoryOpen(true)}
                    aria-label="Project追加"
                >
                    <PlusCircle className="mr-2 h-5 w-5 group-data-[collapsible=icon]:mr-0" />
                    <span className="group-data-[collapsible=icon]:hidden">Project追加</span>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="flex-shrink-0 group-data-[collapsible=icon]:mt-1" aria-label="並び替え">
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuLabel>並び替え</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setSortCriteria('default')}>デフォルト順</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortCriteria('name-asc')}>名前 (昇順)</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortCriteria('name-desc')}>名前 (降順)</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortCriteria('date-newest')}>追加日 (新しい順)</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortCriteria('date-oldest')}>追加日 (古い順)</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
            </div>
            {isClient && (
              <div className="relative p-2 mb-2 group-data-[collapsible=icon]:hidden">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                      type="search"
                      placeholder="検索"
                      className="pl-8 w-full"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                  />
              </div>
            )}
            <ScrollArea className="flex-1 min-h-0">
                {isClient && categoryMenuItemsElements.length > 0 ? categoryMenuItemsElements :
                 isClient && (
                  <div className="p-4 text-center text-muted-foreground group-data-[collapsible=icon]:hidden">
                    {searchTerm && categories.length > 0 && "検索に一致するProjectがありません。"}
                    {!searchTerm && categories.length === 0 && "まだProjectがありません。「Project追加」で作成しましょう。"}
                    {searchTerm && categories.length === 0 && "検索対象のProjectがありません。"}
                  </div>
                )}
                 {!isClient && (
                  <div className="p-4 text-center text-muted-foreground group-data-[collapsible=icon]:hidden">
                    {/* SSR Placeholder */}
                  </div>
                )}
            </ScrollArea>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>

      <div className="flex-grow flex flex-col overflow-hidden"> {/* Main Content Area Wrapper */}
          <header className="sticky top-0 z-20 flex h-16 items-center gap-2 border-b bg-background/80 backdrop-blur-sm px-6 flex-shrink-0">
              <SidebarTrigger>
                <PanelLeft />
              </SidebarTrigger>
              <h2 className="text-2xl font-semibold">
                  {isClient && selectedCategoryId ? (categories.find(c=>c.id === selectedCategoryId)?.name || "") :
                   (isClient && categories.length > 0 ? "Project選択" :
                   (isClient ? "作成したProject無" : ""))}
                  {!isClient && ""}
              </h2>
              
              <div className="flex items-center gap-2 ml-auto">
                 {isClient && selectedCategoryId && filteredApps.length > 0 && (
                  <Button onClick={() => setIsAddAppOpen(true)} variant="default" size="sm">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    APP追加
                  </Button>
                )}
                <Button onClick={() => setIsFarRightPanelOpen(!isFarRightPanelOpen)} variant="outline" size="icon" aria-label="設定パネル表示切替">
                  <SlidersHorizontal className="h-5 w-5" />
                </Button>
              </div>
          </header>

          <main className="flex-1 flex overflow-hidden"> {/* This will contain the two main panes */}
            {/* Left Pane: 設計・調整ツール */}
            <div className="flex-1 p-6 flex flex-col relative overflow-hidden">
                 <div className="absolute inset-0 -z-10 pointer-events-none bg-[url('/yutaka-logo-bg.png')] bg-no-repeat bg-contain bg-center opacity-15" />
                <h2 className="text-xl font-semibold mb-4 flex-shrink-0 relative z-0">ツール</h2>
                <div className="flex-1 overflow-y-auto relative z-0 min-h-[200px]">
                  {isClient && filteredApps.length > 0 ? (
                    <div className="grid grid-cols-4 gap-0">
                      {filteredApps.map(app => (
                        <AppCard key={app.id} app={app} onDelete={handleDeleteApp} />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center min-h-[300px] text-center text-muted-foreground py-10">
                      <h3 className="text-xl font-semibold mb-2">
                        {!isClient ? "" :
                          categories.length === 0 ? "作成したProjectなし。" :
                          !selectedCategoryId && categories.length > 0 ? "APPを表示するProjectを選択してください。" :
                           selectedCategoryId && filteredApps.length === 0 && "このProjectにAPPがありません。"
                        }
                      </h3>
                      <p className="mb-4">
                        {!isClient ? "" :
                          categories.length === 0 ? "「Project追加」ボタンでProjectを作成しましょう。" :
                          !selectedCategoryId && categories.length > 0 ? "サイドバーからProjectを選択してください。" :
                            ""
                        }
                      </p>
                      {isClient && categories.length === 0 && (
                        <Button onClick={() => setIsAddCategoryOpen(true)}>
                          <PlusCircle className="mr-2 h-5 w-5" /> Project 作成
                        </Button>
                      )}
                       {isClient && categories.length > 0 && selectedCategoryId && filteredApps.length === 0 && (
                        <Button onClick={() => setIsAddAppOpen(true)}>
                          <PlusCircle className="mr-2 h-5 w-5" /> APP追加
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                {isClient && (
                  <div className="mt-auto pt-4 border-t flex-shrink-0 relative z-0 space-y-3">
                    {/* Category IP Address Section */}
                    <div>
                      <div>
                        <Label htmlFor="ipAddress" className="text-sm">IPアドレス:</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Input
                            id="ipAddress"
                            type="text"
                            placeholder="IPアドレスを入力"
                            value={(selectedCategoryId && categoryIpAddresses[selectedCategoryId]?.ip) || ''}
                            onChange={(e) => {
                              if (selectedCategoryId) {
                                setCategoryIpAddresses(prev => ({
                                  ...prev,
                                  [selectedCategoryId]: {
                                    ...(prev[selectedCategoryId] || {ip: '', gateway: '', plcIp: ''}),
                                    ip: e.target.value,
                                  },
                                }));
                              }
                            }}
                            className="flex-grow h-9"
                            disabled={!selectedCategoryId}
                          />
                          <Button onClick={handleChangeIpClick} size="sm" disabled={!selectedCategoryId} className="flex-shrink-0">変更</Button>
                        </div>
                      </div>
                      <div className="mt-2">
                        <Label htmlFor="gateway" className="text-sm">デフォルトゲートウェイ:</Label>
                        <Input
                          id="gateway"
                          type="text"
                          placeholder="Gatewayを入力"
                          value={(selectedCategoryId && categoryIpAddresses[selectedCategoryId]?.gateway) || ''}
                          onChange={(e) => {
                            if (selectedCategoryId) {
                              setCategoryIpAddresses(prev => ({
                                ...prev,
                                [selectedCategoryId]: {
                                  ...(prev[selectedCategoryId] || {ip: '', gateway: '', plcIp: ''}),
                                  gateway: e.target.value,
                                },
                              }));
                            }
                          }}
                          className="mt-1 w-full h-9"
                          disabled={!selectedCategoryId}
                        />
                      </div>
                      <div className="mt-2">
                        <Label htmlFor="plcIpAddress" className="text-sm">PLC IPアドレス:</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Input
                            id="plcIpAddress"
                            type="text"
                            placeholder="PLC IPアドレスを入力"
                            value={(selectedCategoryId && categoryIpAddresses[selectedCategoryId]?.plcIp) || ''}
                            onChange={(e) => {
                              if (selectedCategoryId) {
                                setCategoryIpAddresses(prev => ({
                                  ...prev,
                                  [selectedCategoryId]: {
                                    ...(prev[selectedCategoryId] || {ip: '', gateway: '', plcIp: ''}),
                                    plcIp: e.target.value,
                                  },
                                }));
                              }
                            }}
                            className="flex-grow h-9"
                            disabled={!selectedCategoryId}
                          />
                          <Button onClick={handlePingPlcClick} size="sm" disabled={!selectedCategoryId} className="flex-shrink-0">Ping</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
            </div>
            
            {/* Right Pane: データ管理 (Fixed Width) */}
            {isClient && (
              <>
                <div className="w-px bg-border flex-shrink-0"></div> {/* Vertical Separator Line */}
                <div
                  className="p-6 border-l bg-card flex flex-col overflow-hidden flex-shrink-0 w-48"
                >
                    <h2 className="text-xl font-semibold mb-6 flex-shrink-0">データ管理</h2>
                    <div className="overflow-y-auto space-y-3">
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        disabled={!selectedCategoryId}
                        onClick={() => handleDataManagementClick('notepad')}
                        title={selectedCategory ? `「${selectedCategory.name}」のメモ帳` : "メモ帳"}
                      >
                        <Notebook className="mr-2 h-4 w-4" />
                        メモ帳
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        disabled={!selectedCategoryId}
                        onClick={() => handleDataManagementClick('addressBook')}
                        title={selectedCategory ? `「${selectedCategory.name}」のアドレス表` : "アドレス表"}
                      >
                        <BookUser className="mr-2 h-4 w-4" />
                        アドレス表
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        disabled={!selectedCategoryId}
                        onClick={() => handleDataManagementClick('dataFolder')}
                        title={selectedCategory ? `「${selectedCategory.name}」のデータFolder` : "データFolder"}
                      >
                        <FolderOpen className="mr-2 h-4 w-4" />
                        データFolder
                      </Button>
                       {selectedCategoryId && (
                        <div
                          className={cn(
                            "mt-4 flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted transition-colors",
                            isDraggingOverDataFolder ? "border-primary bg-primary/10" : "border-border",
                            !selectedCategoryId && "opacity-50 cursor-not-allowed"
                          )}
                          onDrop={handleDropDataFolder}
                          onDragOver={handleDragOverDataFolder}
                          onDragLeave={handleDragLeaveDataFolder}
                          title={selectedCategory ? `「${selectedCategory.name}」にファイルをドラッグ＆ドロップ` : "Projectを選択してファイルをドラッグ＆ドロップ"}
                        >
                          <UploadCloud className="w-10 h-10 text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground font-semibold">データ保存</p>
                        </div>
                      )}
                    </div>
                </div>
              </>
            )}
          </main>
      </div>

      {/* Far Right Toggleable Panel: 設定 */}
      {isClient && isFarRightPanelOpen && (
        <div className="w-64 border-l bg-background flex-shrink-0 flex flex-col overflow-hidden shadow-lg relative z-0">
           <div className="p-4 flex items-center justify-between border-b">
             <h2 className="text-xl font-semibold">設定</h2>
             <Button variant="ghost" size="icon" onClick={() => setIsFarRightPanelOpen(false)} aria-label="設定パネル閉じる">
               <X className="h-5 w-5" />
             </Button>
           </div>
           <div className="p-6 overflow-y-auto space-y-4">
               <div className="space-y-2">
                 <div>
                    <Label htmlFor="wireIp" className="text-sm">有線IP:</Label>
                <Button variant="outline" id="wireIp" className="w-full mt-1 justify-center h-9">自動</Button>
                    <Label htmlFor="globalIp" className="text-sm">社内IPアドレス:</Label>
                    <div className="flex items-center gap-2 mt-1">
                        <Input
                        id="globalIp"
                        type="text"
                        placeholder="IPアドレスを入力"
                        value={globalIp}
                        onChange={(e) => setGlobalIp(e.target.value)}
                        className="flex-grow h-9"
                        />
                        <Button onClick={handleGlobalWiredIpChange} size="sm" className="flex-shrink-0">変更</Button>
                    </div>
                 </div>
                 <div className="mt-2">
                    <Label htmlFor="globalGateway" className="text-sm">デフォルトゲートウェイ:</Label>
                    <Input
                      id="globalGateway"
                      type="text"
                      placeholder="Gatewayを入力"
                      value={globalGateway}
                      onChange={(e) => setGlobalGateway(e.target.value)}
                      className="mt-1 w-full h-9"
                    />
                  </div>
               </div>
               
               <div className="border-t pt-4 mt-4">
                <Label htmlFor="wirelessIp" className="text-sm">無線IP:</Label>
                <Button variant="outline" id="wirelessIp" className="w-full mt-1 justify-center h-9">自動</Button>
               </div>

               <div className="space-y-2 mt-4">
                 <div>
                    <Label htmlFor="globalSecondaryIp" className="text-sm">IPアドレス</Label>
                    <div className="flex items-center gap-2 mt-1">
                        <Input
                        id="globalSecondaryIp"
                        type="text"
                        placeholder="IPアドレスを入力"
                        value={globalSecondaryIp}
                        onChange={(e) => setGlobalSecondaryIp(e.target.value)}
                        className="flex-grow h-9"
                        />
                        <Button onClick={handleGlobalSecondaryIpChange} size="sm" className="flex-shrink-0">変更</Button>
                    </div>
                 </div>
                 <div className="mt-2">
                    <Label htmlFor="globalSecondaryGateway" className="text-sm">デフォルトゲートウェイ:</Label>
                    <Input
                      id="globalSecondaryGateway"
                      type="text"
                      placeholder="Gatewayを入力"
                      value={globalSecondaryGateway}
                      onChange={(e) => setGlobalSecondaryGateway(e.target.value)}
                      className="mt-1 w-full h-9"
                    />
                  </div>
               </div>
           </div>
        </div>
      )}


      <AddCategoryDialog
        isOpen={isAddCategoryOpen}
        onClose={() => { setIsAddCategoryOpen(false); setEditingCategory(null); }}
        onSave={handleSaveCategory}
        existingCategory={editingCategory}
      />
      <AddAppDialog
        isOpen={isAddAppOpen}
        onClose={() => setIsAddAppOpen(false)}
        onSave={handleSaveApp}
        categories={categories}
        defaultCategoryId={selectedCategoryId}
      />
      {categoryToDelete && (
        <AlertDialog open={!!categoryToDelete} onOpenChange={(open) => !open && setCategoryToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>このProjectを削除してもよろしいですか？</AlertDialogTitle>
              <AlertDialogDescription>
                この操作は元に戻せません。Project「{categoryToDelete.name}」および関連するすべてのAPPが完全に削除されます。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setCategoryToDelete(null)}>キャンセル</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteCategory}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                削除
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </SidebarProvider>
  );
};

export default AppShelfLayout;
    

