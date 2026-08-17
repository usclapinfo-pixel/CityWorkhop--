export interface City {
  id: string;
  name: string;
  state: string;
  district: string;
  code: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CityPage {
  data: City[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface CityQuery {
  search?: string;
  state?: string;
  district?: string;
  isActive?: string;
  page?: number;
  limit?: number;
}
