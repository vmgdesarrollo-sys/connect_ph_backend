## 📋 Actividades Faltantes - Connect PH Backend (49 tareas)

---

### 🔴 **PRIORIDAD ALTA - Críticas (11 tareas)**

#### **1. Autenticación y Seguridad**
| # | Actividad | Descripción |
|---|-----------|-------------|
| 1.1 | **Implementar login real en AuthService** | Reemplazar mock data con validación contra DB |
| 1.2 | **Agregar bcrypt para hasheo de passwords** | Hashear passwords al registrar y comparar al login |
| 1.3 | **Implementar JWT con claims reales** | Incluir userId, email, roles en el token |
| 1.4 | **Validar email único antes de registrar** | Verificar email duplicado en DB |
| 1.5 | **Crear endpoint de refresh token** | Renovar tokens antes de expirar |

#### **2. Usuarios y Roles**
| # | Actividad | Descripción |
|---|-----------|-------------|
| 2.1 | **Completar registro de usuarios** | Hashear password, validar datos, retornar token |
| 2.2 | **Implementar endpoint de login** | Validar credenciales y retornar JWT |
| 2.3 | **Crear endpoint de perfil** | GET /users/profile retorna datos del usuario |
| 2.4 | **Implementar recuperación de contraseña** | Enviar email con link de reset |
| 2.5 | **Agregar validación de formato email** | Usar @IsEmail() en DTOs |
| 2.6 | **Implementar logout** | Blacklist de tokens |

---

### 🟡 **PRIORIDAD MEDIA - Funcionalidades de Negocio (19 tareas)**

#### **3. Sistema de Votaciones**
| # | Actividad | Descripción |
|---|-----------|-------------|
| 3.1 | **Validar un voto por usuario** | Verificar que no vote dos veces |
| 3.2 | **Implementar cálculo automático de resultados** | Contabilizar votos y porcentajes |
| 3.3 | **Crear endpoint de resultados** | GET /assemblies/:id/results |
| 3.4 | **Guardar historial de cambios de voto** | Mantener historial si cambia voto |
| 3.5 | **Implementar tipos de mayoría** | Simple, calificada, unanimidad |
| 3.6 | **Validar fechas de votación** | Solo votar durante período activo |

#### **4. Gestión de Asambleas**
| # | Actividad | Descripción |
|---|-----------|-------------|
| 4.1 | **Cambio automático de estados** | Programada → En Curso → Finalizada |
| 4.2 | **Integrar LiveKit para virtuales** | Crear rooms, gestionar video |
| 4.3 | **Calcular quórum automáticamente** | Sumar coeficientes de asistencia |
| 4.4 | **Validar quórum antes de votar** | Bloquear sin quórum |
| 4.5 | **Crear endpoint de resumen** | GET /assemblies/:id/summary |

#### **5. Agenda de Asambleas**
| # | Actividad | Descripción |
|---|-----------|-------------|
| 5.1 | **Ordenar items por posición** | Campo 'order' en agenda |
| 5.2 | **Gestionar tiempos por item** | duracion_estimada |
| 5.3 | **Vincular votaciones a agenda** | Relacionar voting_questions |
| 5.4 | **Marcar items como tratados** | PUT /agenda/:id/close |

#### **6. Notificaciones**
| # | Actividad | Descripción |
|---|-----------|-------------|
| 6.1 | **Email de confirmación de registro** | Template HTML |
| 6.2 | **Notificar nuevas asambleas** | Email a propietarios |
| 6.3 | **Notificar resultados** | Enviar resumen tras cerrar votación |
| 6.4 | **Crear tabla de notificaciones** | Guardar historial en DB |

---

### 🟢 **PRIORIDAD BAJA - Mejoras y Tests (19 tareas)**

#### **7. Tests Unitarios (6 tareas)**
| # | Actividad | Descripción |
|---|-----------|-------------|
| 7.1 | **UsersService.spec.ts** | Tests CRUD de usuarios |
| 7.2 | **AuthService.spec.ts** | Tests de login y tokens |
| 7.3 | **AssembliesService.spec.ts** | Tests de asambleas |
| 7.4 | **VotesService.spec.ts** | Tests de votaciones |
| 7.5 | **PhsService.spec.ts** | Tests de PHs |
| 7.6 | **Configurar cobertura Jest** | Mínimo 70% |

#### **8. Tests E2E (4 tareas)**
| # | Actividad | Descripción |
|---|-----------|-------------|
| 8.1 | **auth.e2e-spec.ts** | Flujo completo autenticación |
| 8.2 | **users.e2e-spec.ts** | Ciclo de vida usuarios |
| 8.3 | **assemblies.e2e-spec.ts** | Flujo de asambleas |
| 8.4 | **voting.e2e-spec.ts** | Sistema de votación |

#### **9. Documentación (4 tareas)**
| # | Actividad | Descripción |
|---|-----------|-------------|
| 9.1 | **Actualizar README.md** | Arquitectura, guía inicio |
| 9.2 | **Crear ARCHITECTURE.md** | Diagrama y relaciones |
| 9.3 | **Crear API.md** | Endpoints con ejemplos |
| 9.4 | **Crear DEPLOYMENT.md** | Guía de despliegue |

#### **10. Validaciones y Seguridad (5 tareas)**
| # | Actividad | Descripción |
|---|-----------|-------------|
| 10.1 | **Mejorar validaciones DTOs** | Más reglas, mensajes personalizados |
| 10.2 | **Implementar Rate Limiting** | Prevenir fuerza bruta |
| 10.3 | **Sanitización de inputs** | Prevenir SQL injection/XSS |
| 10.4 | **Logging estructurado** | Winston/Pino |
| 10.5 | **Health Check endpoint** | GET /health |

---

**📊 Resumen:** 49 actividades pendientes distribuidas en 10 categorías. El proyecto está ~60% completo con estructura base pero faltan tests, autenticación real y lógica de negocio.