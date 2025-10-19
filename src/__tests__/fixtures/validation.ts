import {
  ValidateCodeRequest,
  ValidateCodeResponse,
  ValidatePromptRequest,
  ValidatePromptResponse
} from '../../types';

export const mockValidateCodeRequest: ValidateCodeRequest = {
  code: 'def hello_world():\n    return "Hello, World!"'
};

export const mockValidCodeResponse: ValidateCodeResponse = {
  valid: true,
  is_valid: true,
  errors: [],
  warnings: []
};

export const mockInvalidCodeResponse: ValidateCodeResponse = {
  valid: false,
  is_valid: false,
  errors: ['SyntaxError: unexpected EOF while parsing', 'IndentationError: unexpected indent'],
  warnings: []
};

export const mockCodeWithWarningsResponse: ValidateCodeResponse = {
  valid: true,
  is_valid: true,
  errors: [],
  warnings: ['Unused variable: x']
};

export const mockValidatePromptRequest: ValidatePromptRequest = {
  prompt: 'Hello {name}, welcome to {system}!'
};

export const mockValidPromptResponse: ValidatePromptResponse = {
  valid: true,
  errors: [],
  variables: ['name', 'system']
};

export const mockInvalidPromptResponse: ValidatePromptResponse = {
  valid: false,
  errors: ['Unclosed placeholder: {name'],
  variables: []
};

export const mockPromptNoVariablesResponse: ValidatePromptResponse = {
  valid: true,
  errors: [],
  variables: []
};
