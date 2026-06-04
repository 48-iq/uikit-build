export type ErrorCode = {
  statusCode: number;
  code: string;
  message: string;
};
export const ERROR_CODE = {
  SERVER_ERROR: {
    statusCode: 500,
    code: 'SERVER_001',
    message: 'Server error',
  },

  VALIDATION_ERROR: {
    statusCode: 400,
    code: 'VALIDATION_001',
    message: 'Validation error',
  },

  // build
  BUILD_NOT_FOUND: {
    statusCode: 404,
    code: 'BUILD_001',
    message: 'Build not found',
  },

  // preview
  PREVIEW_NOT_FOUND: {
    statusCode: 404,
    code: 'PREVIEW_001',
    message: 'Preview not found',
  },

  // preview
  USER_NOT_FOUND: {
    statusCode: 404,
    code: 'USER_001',
    message: 'User not found',
  },

  // component
  COMPONENT_NOT_FOUND: {
    statusCode: 404,
    code: 'COMPONENT_001',
    message: 'Component not found',
  },

  COMPONENT_ALREADY_EXISTS: {
    statusCode: 409,
    code: 'COMPONENT_002',
    message: 'Component already exists',
  },

  UNAUTHORIZED: {
    statusCode: 401,
    code: 'AUTH_001',
    message: 'Unauthorized',
  },

  FORBIDDEN: {
    statusCode: 403,
    code: 'FORBIDDEN_001',
    message: 'Forbidden',
  },
} satisfies Record<string, ErrorCode>;
