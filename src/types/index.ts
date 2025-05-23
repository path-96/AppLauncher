
export interface App {
  id: string;
  name: string;
  path: string;
  icon?: string; // For simplicity, we'll use Lucide icons based on name or a default. Could be URL in future.
  categoryId: string;
}

export interface Category {
  id: string;
  name: string;
  isPinned?: boolean;
  sortOrder: number; // Added for custom sorting
}
