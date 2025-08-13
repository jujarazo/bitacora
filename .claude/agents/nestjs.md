# NestJS Agent Instructions — Bitácora

## Mission

Write production-quality NestJS code for **Bitácora** (monorepo: `apps/api`) that is clean, testable, and aligned with Nest primitives and request lifecycle best practices.

## Architecture & Layering

* **Modules**: feature-scoped (`AuthModule`, `EntriesModule`, `MetricsModule`). Re-export providers when needed.
* **Controllers**: only HTTP concerns (routing, DTO mapping, status codes). No business logic.
* **Services**: business logic. Pure functions where possible; no direct framework types in signatures.
* **Persistence**: repositories/adapters hide ORM/DB details behind interfaces.
* **DTOs**: request/response contracts with `class-validator` + `class-transformer`.
* **DI**: constructor injection with `private readonly ...`. Never reassign injected deps.

## Request Lifecycle (follow strictly)

`Middleware → Guards → Interceptors (pre-controller) → Pipes → Controller → Interceptors (post) → Exception Filters`

* Put **cross-cutting pre-routing** in **Middleware**.
* Do **authorization/feature gates** in **Guards**.
* Do **validation/transforms** in **Pipes** (e.g., parse query/params, DTO validation).
* Do **logging, timing, mapping success responses, caching** in **Interceptors**.
* Do **error mapping / formatting** in **Exception Filters**.

## Choose the Right Primitive (decision matrix)

* **Middleware**

    * Use for: CORS, request ID, raw body parsing, global logging correlation.
    * Don’t use for: route authorization or validation.
* **Guards**

    * Use for: RBAC/ABAC, feature flags, permissions, authenticated state.
    * Don’t use for: input validation or error formatting.
* **Pipes**

    * Use for: DTO validation, query param parsing, type coercion (`string`→`number/date`).
    * Don’t use for: authorization or error handling.
* **Interceptors**

    * Use for: timing, response shaping, caching, pagination envelopes, masking fields.
    * Don’t use for: blocking a request (use Guards) or catching errors (use Filters).
* **Filters**

    * Use for: mapping thrown errors → HTTP responses; custom error payloads.
    * Don’t use for: preventing requests or modifying successful responses.

## Coding Rules

1. **DI & immutability**

   ```ts
   constructor(private readonly entriesService: EntriesService) {}
   ```
2. **DTOs + Validation**

   ```ts
   export class CreateEntryDto {
     @IsEnum(['sleep','exercise','mood'])
     type: 'sleep'|'exercise'|'mood';

     @IsNumber() @Type(() => Number)
     value: number;

     @IsOptional() @IsISO8601() @Type(() => Date)
     timestamp?: Date;
   }
   ```
3. **Controllers are thin**

   ```ts
   @Post()
   create(@Body() dto: CreateEntryDto) {
     return this.entriesService.create(dto);
   }
   ```
4. **Guards for access**

   ```ts
   @UseGuards(AuthGuard, RolesGuard('user'))
   ```
5. **Pipes for transformation**

   ```ts
   @Get(':id')
   findOne(@Param('id', ParseIntPipe) id: number) { ... }
   ```
6. **Interceptors for cross-cutting**

    * `@UseInterceptors(LoggingInterceptor, ClassSerializerInterceptor)`
7. **Filters for errors**

    * Throw domain errors; map with a filter or `HttpException`.
8. **Never** access envs directly in services. Inject a `ConfigService` adapter.
9. **No framework types** in core domain services (accept primitives/types, not `Request`).

## Templates (copy/paste)

### Guard

```ts
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<string[]>('roles', [
      ctx.getHandler(), ctx.getClass()
    ]);
    if (!roles?.length) return true;

    const req = ctx.switchToHttp().getRequest<Request & { user?: any }>();
    const userRoles: string[] = req.user?.roles ?? [];
    return roles.some(r => userRoles.includes(r));
  }
}
// usage
@SetMetadata('roles', ['user']) @UseGuards(RolesGuard)
```

### Pipe (DTO validation is default via `ValidationPipe`)

```ts
// main.ts
app.useGlobalPipes(new ValidationPipe({
  whitelist: true, transform: true, forbidNonWhitelisted: true
}));
```

### Interceptor (timing + response mapping)

```ts
@Injectable()
export class TimingInterceptor implements NestInterceptor {
  intercept(ctx: ExecutionContext, next: CallHandler) {
    const start = Date.now();
    return next.handle().pipe(
      tap(() => console.log('ms:', Date.now() - start))
    );
  }
}
```

### Exception Filter (domain → HTTP)

```ts
@Catch(DomainError)
export class DomainErrorFilter implements ExceptionFilter {
  catch(ex: DomainError, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    res.status(422).json({ code: ex.code, message: ex.message });
  }
}
// main.ts
app.useGlobalFilters(new DomainErrorFilter());
```

### Middleware (request id)

```ts
export function requestId(): NestMiddleware {
  return (req, _res, next) => { req.headers['x-request-id'] ||= crypto.randomUUID(); next(); };
}
// module
consumer.apply(requestId()).forRoutes('*');
```

## Project Conventions (Bitácora)

* **Modules**: `apps/api/src/{feature}/{feature}.module.ts`
* **Exports**: a feature module exports its service if used by other modules.
* **DTOs**: `src/{feature}/dto/*.dto.ts`
* **Entities/Models**: `src/{feature}/entities/*.ts` (no decorators in domain models unless using ORM entities explicitly)
* **Mappers**: map DB ↔ domain ↔ DTO; keep controllers dumb.
* **Config**: `ConfigModule.forRoot({ isGlobal: true })`; strongly type `process.env` via `zod` or `envalid`.
* **Logging**: global interceptor for timing; logger per module with context.
* **Error strategy**: throw domain errors in services; translate in filters; never return `null` when a 4xx fits better.

## Testing Rules

* **Unit**: services with stubs/mocks (no HTTP/ORM). Use `private readonly` in SUT. Arrange-Act-Assert.
* **E2E**: `@nestjs/testing` + `SuperTest`; spin up the module graph; use global pipes/filters as in `main.ts`.
* **Guards/Pipes/Interceptors**: isolated tests for positive/negative paths.
* **Factories**: test factories for DTOs and domain entities.

## Performance & Safety

* Parse primitives early (Pipes) to avoid string math.
* Cache heavy GETs with an Interceptor (respect auth/tenant keys).
* Avoid leaking internal fields; use `ClassSerializerInterceptor` + `@Exclude/@Expose`.
* Prefer async providers over reading files/env in constructors.

## Pull Request Checklist (agent must ensure)

* [ ] Correct primitive chosen (per decision matrix).
* [ ] Controller thin; all logic in service.
* [ ] DTOs validated & transformed; no unchecked input.
* [ ] Guards enforce auth/roles; no auth in controllers/services.
* [ ] Interceptors/Filters applied where appropriate.
* [ ] DI uses `private readonly`.
* [ ] Tests added/updated; e2e covers happy & error paths.
* [ ] No direct `process.env` in services; typed config used.
* [ ] Logs are structured and minimal; no sensitive data.
* [ ] Types are explicit; no `any`.

## Useful Snippets

* **Route scoping**

  ```ts
  @UseGuards(JwtAuthGuard) @Controller('entries')
  ```
* **Pagination envelope interceptor**

  ```ts
  // add { data, meta } response shape here rather than in controllers
  ```

---

**Agent behavior summary:**
Pick the correct Nest primitive based on intent; keep controllers slim; push logic down; validate and transform with pipes; authorize with guards; cross-cut with interceptors; map errors with filters; use immutable DI; write tests.
