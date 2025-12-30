
export interface InventoryItem {
  id: string;
  name: string;
  category: 'Water' | 'Food' | 'Medical' | 'Security' | 'Tools' | 'Docs' | 'Meds';
  quantity: number;
  target: number;
  unit: string;
  expiry?: string;
  // For Food/Water calculations
  caloriesPerUnit?: number; 
  litersPerUnit?: number;
  // For Prescriptions
  dailyDose?: number;
}

export interface CrewProfile {
  adults: number;
  children: number;
  pets: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
  timestamp: number;
  groundingMetadata?: GroundingMetadata;
}

export interface GroundingMetadata {
  groundingChunks?: GroundingChunk[];
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
  maps?: {
    uri: string;
    title: string;
    placeAnswerSources?: {
        reviewSnippets?: {
            content: string;
        }[]
    }
  };
}

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  INVENTORY = 'INVENTORY',
  ADVISOR = 'ADVISOR', // Chat
  LOCATOR = 'LOCATOR', // Maps
  GUIDES = 'GUIDES',
  TOOLS = 'TOOLS',
  SIMULATION = 'SIMULATION', // Game
  SETTINGS = 'SETTINGS' // Datadog Config
}

export interface ChecklistCategory {
  title: string;
  items: string[];
}
