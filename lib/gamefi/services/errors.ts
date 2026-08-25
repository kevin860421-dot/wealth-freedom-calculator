export class GameFiServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GameFiServiceError";
  }
}

export class GameFiNotImplementedError extends GameFiServiceError {
  readonly phase = "Phase 2" as const;

  constructor(feature: string) {
    super(`${feature} 尚未實作（Phase 2：Gacha / Betting）`);
    this.name = "GameFiNotImplementedError";
  }
}
