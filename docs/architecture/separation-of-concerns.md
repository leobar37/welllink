# Patrón de Separación de Responsabilidades: Estado, Servicios y UI

## Overview

Este documento describe el patrón arquitectónico utilizado en mediapp para mantener una clara separación de responsabilidades entre tres capas fundamentales: **Estado (State)**, **Servicios (Services)** y **Interfaz de Usuario (UI)**.

## Principios Fundamentales

1. **Single Responsibility Principle**: Cada componente tiene una única razón para cambiar
2. **Dependency Injection**: Las dependencias se inyectan en lugar de crearse internamente
3. **Type Safety**: Tipado estricto de extremo a extremo
4. **Consistency**: Patrones consistentes en toda la aplicación

---

## 1. Capa de Estado (State Layer)

### Responsabilidades

- Gestionar el estado de la aplicación
- Manejar operaciones de lectura y escritura de datos
- Proporcionar caché y sincronización
- Manejar errores y estados de carga

### Patrón Principal: Custom Hooks con TanStack Query

#### Estructura Base

```typescript
// hooks/use-feature.ts
export function useFeature() {
  const queryClient = useQueryClient();

  // Lectura de datos
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["feature", id],
    queryFn: async () => {
      const { data, error } = await api.feature[id].get();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Escritura de datos
  const mutation = useMutation({
    mutationFn: async (data: UpdateData) => {
      const { data, error } = await api.feature[id].put(data);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidar caché relacionada
      queryClient.invalidateQueries({ queryKey: ["feature"] });
      toast.success("Actualizado exitosamente");
    },
    onError: (err) => {
      toast.error(extractErrorMessage(err));
    },
  });

  return {
    data,
    isLoading,
    error,
    update: mutation.mutate,
    refetch,
  };
}
```

#### Características Clave

1. **Centralización de API**: Todas las llamadas a la API pasan por el cliente tipado `api`
2. **Caché Automático**: TanStack Query maneja caché, revalidación y actualizaciones optimistas
3. **Manejo de Estados de Carga**: `isLoading`, `isFetching`, `error`
4. **Invalidación Selectiva**: Solo se invalida lo necesario con `invalidateQueries`

#### Ejemplo Real: useProfile

```typescript
// hooks/use-profile.ts
export function useProfile() {
  const queryClient = useQueryClient();

  const {
    data: profiles,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await api.profiles.get();
      if (error) throw error;
      return data as unknown as Profile[];
    },
  });

  // Single profile assumption
  const profile = profiles?.[0];

  const updateProfile = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Profile>;
    }) => {
      const { data: resData, error } = await api.profiles[id].put(data);
      if (error) throw error;
      return resData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      toast.success("Profile updated");
    },
  });

  return {
    profile,
    isLoading,
    error,
    updateProfile,
  };
}
```

### Estado Local Complejo

Para estados que no van al backend:

```typescript
// hooks/use-whatsapp.ts
export function useWhatsApp() {
  const [config, setConfig] = useState<WhatsAppConfig>({
    isConnected: false,
    instanceId: undefined,
    qrCode: undefined,
  });

  const pollIntervalRef = useRef<ReturnType<typeof setInterval>>();

  // Lógica compleja con polling
  const connect = useCallback(async (configId: string) => {
    // Conexión con polling de estado
  }, []);

  return { config, connect, disconnect };
}
```

---

## 2. Capa de Servicios (Service Layer)

### Responsabilidades

- Contener la lógica de negocio
- Orquestrar múltiples repositorios
- Validaciones y reglas de negocio
- Transformación de datos

### Patrón de Repositorio

#### Repositorio de Datos

```typescript
// services/repository/profile.ts
export class ProfileRepository {
  async findByUser(ctx: RequestContext, userId: string) {
    return db.query.profile.findMany({
      where: eq(profile.userId, userId),
      with: {
        avatar: true,
        coverImage: true,
        socialLinks: true,
      },
    });
  }

  async create(ctx: RequestContext, data: NewProfile) {
    const [profile] = await db
      .insert(profile)
      .values({ ...data, userId: ctx.userId })
      .returning();
    return profile;
  }
}
```

### Patrón de Servicio de Negocio

#### Servicio con Múltiples Dependencias

```typescript
// services/business/profile.ts
export class ProfileService {
  constructor(
    private profileRepository: ProfileRepository,
    private assetRepository: AssetRepository,
    private analyticsRepository: AnalyticsRepository,
  ) {}

  async createProfile(ctx: RequestContext, data: CreateProfileData) {
    // Validaciones de negocio
    const existingProfile = await this.profileRepository.findByUsername(
      ctx,
      data.username,
    );
    if (existingProfile) {
      throw new ConflictException("Username already exists");
    }

    // Validación de recursos relacionados
    if (data.avatarId) {
      const avatar = await this.assetRepository.findOne(ctx, data.avatarId);
      if (!avatar || avatar.type !== "avatar") {
        throw new BadRequestException("Invalid avatar");
      }
    }

    // Creación con lógica de negocio
    const profile = await this.profileRepository.create(ctx, {
      ...data,
      displayName: data.displayName || data.username,
      slug: this.generateSlug(data.username),
    });

    // Analytics tracking
    await this.analyticsRepository.trackEvent(ctx, {
      type: "profile_created",
      profileId: profile.id,
    });

    return profile;
  }

  private generateSlug(username: string): string {
    return username.toLowerCase().replace(/[^a-z0-9]/g, "-");
  }
}
```

### Inyección de Dependencias

#### Plugin de Servicios

```typescript
// plugins/services.ts
export const servicesPlugin = new Elysia({ name: "services" }).derive(
  { as: "global" },
  async () => {
    // Repositorios
    const profileRepository = new ProfileRepository();
    const assetRepository = new AssetRepository();

    // Servicios con sus dependencias
    const profileService = new ProfileService(
      profileRepository,
      assetRepository,
      analyticsRepository,
    );

    return {
      profileRepository,
      profileService,
      // ... otros servicios
    };
  },
);
```

#### Uso en Rutas

```typescript
// routes/profiles.ts
export const profileRoutes = new Elysia({ prefix: "/profiles" })
  .use(servicesPlugin)
  .derive({ as: "global" }, ({ profileService }) => {
    // Servicios inyectados automáticamente
    return { profileService };
  })
  .get("/", async ({ profileService, ctx }) => {
    return profileService.findByUser(ctx, ctx.userId);
  });
```

---

## 3. Capa de Interfaz de Usuario (UI Layer)

### Responsabilidades

- Presentar datos al usuario
- Capturar interacciones del usuario
- Ser agnóstica a la fuente de datos
- Manejar estados visuales (loading, error, empty)

### Patrón de Componentes Puros

#### Componente de UI Base

```typescript
// components/ui/button.tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-white hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-lg px-3",
        lg: "h-12 rounded-lg px-8",
      },
    },
  }
);

interface ButtonProps {
  variant?: "default" | "destructive" | "outline";
  size?: "default" | "sm" | "lg";
  onClick?: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}

export function Button({
  variant = "default",
  size = "default",
  onClick,
  children,
  disabled,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
```

### Patrón de Componentes Contenedor

#### Componente de Página/Ruta

```typescript
// pages/dashboard/ProfileSettings.tsx
export function ProfileSettings() {
  // Estado y lógica
  const { profile, isLoading, updateProfile } = useProfile();
  const { uploadAvatar } = useProfile();

  // Manejadores de eventos
  const handleSave = async (data: ProfileForm) => {
    await updateProfile(profile.id, data);
  };

  const handleAvatarUpload = async (file: File) => {
    await uploadAvatar(file);
  };

  // Renderizado con componentes puros
  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Configuración del Perfil</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <ProfileForm
              profile={profile}
              onSave={handleSave}
              onAvatarUpload={handleAvatarUpload}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

### Patrón de Layout

#### Layout con Autenticación

```typescript
// layouts/DashboardLayout.tsx
export function DashboardLayout() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return <Loader2 className="h-8 w-8 animate-spin" />;
  }

  if (!session) {
    return <Navigate to="/auth/login" replace />;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1">
        <Header user={session.user} />
        <Outlet />
      </main>
    </SidebarProvider>
  );
}
```

---

## 4. Manejo de Errores

### Excepciones Tipadas del Backend

```typescript
// utils/http-exceptions.ts
export class NotFoundException extends HttpException {
  constructor(message: string = "Not Found", code?: string) {
    super(message, 404, code);
    this.name = "NotFoundException";
  }
}

export class ConflictException extends HttpException {
  constructor(message: string = "Conflict", code?: string) {
    super(message, 409, code);
    this.name = "ConflictException";
  }
}
```

### Manejo Centralizado en el Frontend

```typescript
// lib/error-handler.ts
export function extractErrorMessage(
  error: unknown,
  fallback = "An error occurred",
): string {
  if (isEdenError(error)) {
    const { value } = error;
    if (isBackendError(value)) {
      return value.details || value.error || value.message || fallback;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}
```

---

## 5. Flujo de Datos Completo

### Flujo Típico: Actualización de Perfil

1. **UI Layer**: Usuario interactúa con formulario

   ```typescript
   <ProfileForm onSave={handleSave} />
   ```

2. **State Layer**: Hook maneja la mutación

   ```typescript
   const updateProfile = useMutation({
     mutationFn: async ({ id, data }) => api.profiles[id].put(data),
     onSuccess: () => toast.success("Updated!"),
   });
   ```

3. **API Layer**: edenTreaty genera llamada tipada

   ```typescript
   // Genera: PUT /api/profiles/:id
   api.profiles[id].put(data);
   ```

4. **Service Layer**: Lógica de negocio

   ```typescript
   async updateProfile(id: string, data: UpdateProfileData) {
     // Validaciones
     if (data.username && await this.existsUsername(data.username)) {
       throw new ConflictException();
     }

     // Transformación y persistencia
     return this.profileRepository.update(id, data);
   }
   ```

5. **Repository Layer**: Acceso a datos

   ```typescript
   async update(id: string, data: Partial<Profile>) {
     return db.update(profile)
       .set(data)
       .where(eq(profile.id, id))
       .returning();
   }
   ```

6. **State Update**: TanStack Query actualiza caché

   ```typescript
   queryClient.invalidateQueries({ queryKey: ["profiles"] });
   ```

7. **UI Re-render**: Componente se actualiza con nuevos datos
   ```typescript
   const { profile } = useProfile(); // Datos actualizados
   ```

---

## 6. Mejores Prácticas

### Reglas de Oro

1. **Nun mixes responsabilidades**
   - ✅ Componente solo renderiza
   - ✅ Hook solo maneja estado
   - ✅ Servicio solo tiene lógica de negocio

2. **Usa TypeScript estrictamente**
   - Tipos para todas las respuestas
   - Inferencia de tipos automática
   - `as` solo cuando es necesario

3. **Maneja errores consistentemente**
   - Backend: Excepciones tipadas
   - Frontend: Extracción centralizada
   - Usuario: Mensajes amigables con toast

4. **Optimiza el rendimiento**
   - Lazy loading de rutas
   - Memoización de cálculos costosos
   - Virtualización de listas largas

### Anti-Patrones a Evitar

1. ❌ Llamadas a la API directamente en componentes

   ```typescript
   // MAL
   function Component() {
     const [data, setData] = useState();
     useEffect(() => {
       fetch("/api/data").then(setData);
     }, []);
   }
   ```

2. ❌ Lógica de negocio en el UI

   ```typescript
   // MAL
   function Component() {
     const [isValid, setIsValid] = useState(false);
     const validate = (email) => {
       // Lógica de validación compleja
       if (email.includes("@")) {
         setIsValid(true);
       }
     };
   }
   ```

3. ❌ Estado global sin necesidad
   ```typescript
   // MAL
   const globalState = {
     profile: null,
     theme: "light",
   };
   ```

---

## 7. Testing Strategy

### Unit Tests

```typescript
// __tests__/hooks/useProfile.test.ts
describe("useProfile", () => {
  it("should fetch profile data", async () => {
    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.profile).toBeDefined();
    });
  });

  it("should update profile", async () => {
    const { result } = renderHook(() => useProfile());

    await act(async () => {
      await result.current.updateProfile("id", { name: "New Name" });
    });

    expect(toast.success).toHaveBeenCalledWith("Profile updated");
  });
});
```

### Integration Tests

```typescript
// __tests__/services/profileService.test.ts
describe("ProfileService", () => {
  let profileService: ProfileService;
  let mockProfileRepo: jest.Mocked<ProfileRepository>;

  beforeEach(() => {
    mockProfileRepo = createMockProfileRepository();
    profileService = new ProfileService(mockProfileRepo);
  });

  it("should create profile with validation", async () => {
    mockProfileRepo.findByUsername.mockResolvedValue(null);

    const profile = await profileService.createProfile(ctx, data);

    expect(profile).toBeDefined();
    expect(mockProfileRepo.create).toHaveBeenCalledWith(ctx, expectedData);
  });
});
```

---

## Conclusiones

Este patrón arquitectónico proporciona:

- **Mantenibilidad**: Código organizado y predecible
- **Escalabilidad**: Fácil agregar nuevas características
- **Testeabilidad**: Cada capa puede probarse independientemente
- **Reusabilidad**: Componentes y servicios desacoplados
- **Type Safety**: Seguridad de tipos extremo a extremo

La clave del éxito es mantener la disciplina de no mezclar responsabilidades y seguir los patrones establecidos consistentemente en toda la aplicación.
