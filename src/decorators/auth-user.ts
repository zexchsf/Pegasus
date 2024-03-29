import { createParamDecorator } from "@nestjs/common";

export const AuthUser = createParamDecorator((data, req) => {
  const request = req.switchToHttp().request;
  return request.user
})
