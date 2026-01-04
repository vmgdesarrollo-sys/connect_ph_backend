export class SelectProviderDto {
  providerName: string;
}

// El cuerpo que enviará el cliente cuando complete los campos dinámicos
export class AuthStepSubmissionDto {
  token: string; // El token que le dimos en el paso anterior
  fields: Record<string, any>; // Los valores de los inputs (celular, password, etc)
}