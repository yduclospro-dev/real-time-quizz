export class GetCurrentUserRequest {
  id: string;

  constructor(partial: Partial<GetCurrentUserRequest>) {
    Object.assign(this, partial);
  }
}
