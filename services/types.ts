export type Meta = {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
};

export type Envelope<T> = {
  status?: string;
  message?: string;
  data?: T;
  meta?: Meta;
};

export type UiStatus = "active" | "non-active";
export const mapBoolToUi = (b: boolean): UiStatus => (b ? "active" : "non-active");