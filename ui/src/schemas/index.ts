export interface Page<T> {
  count: number;
  previous: number;
  next: number;
  results: Array<T>;
}
