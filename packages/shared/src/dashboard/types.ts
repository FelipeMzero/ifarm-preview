// Tipos das respostas da API do painel/dashboard.

export type DashboardSummary = {
  totalAnimals: number;
  males: number;
  females: number;
  activeBatches: number;
  averageWeightKg: number | null;
  averageAdg: number | null;
  stockingRate: {
    uaPerHa: number | null;
    totalUa: number;
    totalProductiveHectares: number;
  };
};

export type DashboardPastureStatus = {
  available: number;
  occupied: number;
  resting: number;
  total: number;
};

export type DashboardCategoryItem = {
  category: string;
  count: number;
  percentage: number;
};

export type DashboardWeightEvolutionItem = {
  month: string;
  averageWeightKg: number;
  animalCount: number;
};

export type DashboardReadyPasture = {
  id: string;
  name: string;
  hectares: number;
  daysResting: number;
  minRestDays: number;
  stockingRate: number;
  capacityUa: number;
};

export type DashboardSlaughterProjection = {
  animalId: string;
  identifier: string;
  batchName: string | null;
  currentWeightKg: number;
  targetWeightKg: number;
  projectedAdg: number;
  projectedSlaughterDate: string | null;
  daysRemaining: number | null;
  confidenceR2: number;
  percentageOfTarget: number;
};

export type DashboardData = {
  summary: DashboardSummary;
  pastureStatus: DashboardPastureStatus;
  categoryDistribution: DashboardCategoryItem[];
  weightEvolution: DashboardWeightEvolutionItem[];
  readyPastures: DashboardReadyPasture[];
  slaughterProjections: DashboardSlaughterProjection[];
};
