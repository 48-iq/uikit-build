export type ErrorCode = {
  statusCode: number,
  code: string,
  message: string,
}
export const ERROR_CODES: Record<string, ErrorCode> = {
  "SERVER_ERROR": { statusCode: 500, code: "SERVER_001", message: "Server error" },
  
  "VALIDATION_ERROR": { statusCode: 400, code: "VALIDATION_001", message: "Validation error" },

  "COMPONENT_NOT_FOUND": { statusCode: 404, code: "COMPONENT_001", message: "Component not found" },
}