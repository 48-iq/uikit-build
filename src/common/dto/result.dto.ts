import { ErrorDto } from "./error.dto";

export abstract class ResultDto<T> {
  success: boolean;
  error?: ErrorDto;
  result?: T;
}
