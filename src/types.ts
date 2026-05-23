export enum Category {
  PC = 'PC games',
  XBOX = 'Xbox Games',
  PS5 = 'PS5 games',
  MOBILE = 'Mobiles games',
  LUST = 'Lust Games',
}

export interface Game {
  id: string;
  userId: string;
  title: string;
  category: Category;
  imageUrl?: string;
  startDate?: string | null;
  endDate?: string | null;
  visibility: 'public';
  createdAt: any;
  updatedAt: any;
}
