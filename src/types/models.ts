export interface Snippet {
    id: string;
    title: string;
    description?: string;
    language: string;
    code: string;
    tags: string[];
    folder_id?: string | null;
    is_favorite: boolean;
    isFavorite?: boolean; // Frontend camelCase version
    created_at: number;
    updated_at: number;
    usage_count: number;
}

export interface Folder {
    id: string;
    name: string;
    icon?: string;
    color?: string;
    created_at: number;
}

export interface AppSettings {
    theme: 'light' | 'dark' | 'system';
    editorFontSize: number;
    minimap: boolean;
    wordWrap: boolean;
    autoSave: boolean;
}
