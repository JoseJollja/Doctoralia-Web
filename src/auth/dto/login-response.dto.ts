export class LoginResponseDto {
  access_token: string;
  user: {
    username: string;
    role: string;
  };
}
