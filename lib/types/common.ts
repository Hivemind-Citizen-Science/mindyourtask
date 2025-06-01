export type Direction = 'left' | 'right';

export interface Session {
  id: string;
  // Add other common session properties if available
}

export interface Trial<TParameters, TResponse> {
  parameters: TParameters;
  expectedResponse: TResponse;
} 