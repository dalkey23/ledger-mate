export interface Party {
    id: string;         
    name: string;       
    nameNorm: string;   
    aliases?: string[];
    tags?: string[];
    createdAt: number;  
    updatedAt: number;  
    freq: number;       
  }
  