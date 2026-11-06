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

export type DashboardRotationAlert = {
  batchId: string;
  batchName: string;
  areaId: string;
  areaName: string;
  daysOccupied: number;
  maxDays: number;
  daysExceeded: number;
};

export type DashboardAlerts = {
  rotationAlerts: DashboardRotationAlert[];
  unweighedAnimalsCount: number;
  activeWithdrawalCount: number;
  pendingPurchasesCount: number;
};

export type DashboardBatchGoal = {
  batchId: string;
  batchName: string;
  currentAnimalCount: number;
  currentAvgWeightKg: number | null;
  targetWeightKg: number;
  targetDate: string;
  daysRemaining: number;
  status: "REACHED" | "ON_TRACK" | "BEHIND";
  requiredAdg: number | null;
};

export type DashboardWithdrawalAnimal = {
  animalId: string;
  identifier: string;
  title: string;
  withdrawalEndDate: string;
  daysRemaining: number;
};

export type DashboardSanitary = {
  procedures30d: number;
  procedures90d: number;
  activeWithdrawalAnimals: DashboardWithdrawalAnimal[];
};

export type DashboardEfficiency = {
  kgPerHaPerDay: number | null;
  totalGainKg: number;
  occupiedHectares: number;
  evaluatedDays: number;
};

export type DashboardBatchOption = {
  id: string;
  name: string;
};

export type DashboardData = {
  summary: DashboardSummary;
  pastureStatus: DashboardPastureStatus;
  categoryDistribution: DashboardCategoryItem[];
  weightEvolution: DashboardWeightEvolutionItem[];
  readyPastures: DashboardReadyPasture[];
  slaughterProjections: DashboardSlaughterProjection[];
  alerts: DashboardAlerts;
  batchGoals: DashboardBatchGoal[];
  sanitary: DashboardSanitary;
  efficiency: DashboardEfficiency;
  batches: DashboardBatchOption[];
};
