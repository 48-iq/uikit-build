import { ErrorDto } from "./error.dto";

export class ErrorResultDto {
  success: boolean;
  error: ErrorDto;
}