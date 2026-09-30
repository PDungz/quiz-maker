---
id: ARCH_001
category: Architecture
subcategory: Clean Architecture
difficulty: easy
type: single_choice
question: "What are the three main layers in Clean Architecture for Flutter?"
options:
  A: "UI, Logic, Database"
  B: "Presentation, Domain, Data"
  C: "View, Controller, Model"
  D: "Widget, Service, Repository"
correct_answer: "B"
explanation: |
  Clean Architecture layers (dependency flows inward):
  
  Presentation layer: UI (widgets), state management (Bloc/ViewModel), formatters.
  Depends on Domain layer.
  
  Domain layer: business logic. Contains Entities, Use Cases (Interactors), Repository interfaces.
  PURE DART — no Flutter, no external packages. The innermost layer.
  
  Data layer: implements Repository interfaces. Contains Models (JSON mapping), DataSources
  (API, DB), Repository implementations.
  Depends on Domain (implements interfaces) but not Presentation.
  
  Dependency rule: outer layers depend on inner layers, NEVER the reverse.
tags:
  - architecture
  - clean-architecture
  - layers
---

---
id: ARCH_002
category: Architecture
subcategory: Clean Architecture
difficulty: medium
type: single_choice
question: "What is the role of a `Repository` in Clean Architecture?"
options:
  A: "Repository is where all widgets are stored"
  B: "Repository is an abstraction (interface) in the Domain layer that defines data access contracts — the Data layer provides the implementation"
  C: "Repository directly calls the REST API"
  D: "Repository holds UI state"
correct_answer: "B"
explanation: |
  Repository pattern:
  
  Domain layer defines the interface:
    abstract class UserRepository {
      Future<Either<Failure, User>> getUser(String id);
      Future<Either<Failure, List<User>>> getUsers();
    }
  
  Data layer implements it:
    class UserRepositoryImpl implements UserRepository {
      final UserRemoteDataSource _remote;
      final UserLocalDataSource _local;
      
      @override
      Future<Either<Failure, User>> getUser(String id) async {
        // check cache, fallback to API, handle errors
      }
    }
  
  Benefits: swap implementations (mock for testing), add caching transparently,
  switch from REST to GraphQL without touching domain or presentation.
tags:
  - architecture
  - repository
  - clean-architecture
---

---
id: ARCH_003
category: Architecture
subcategory: Clean Architecture
difficulty: medium
type: single_choice
question: "What is a Use Case (Interactor) and what should it contain?"
options:
  A: "A Use Case is a screen in the Flutter app"
  B: "A Use Case encapsulates ONE piece of business logic, calls Repository methods, and returns results to Presentation — it knows nothing about UI or data sources"
  C: "Use Cases directly query the database"
  D: "A Use Case replaces the Repository layer"
correct_answer: "B"
explanation: |
  Use Case / Interactor encapsulates a single business rule:
  
    class GetUserUseCase {
      final UserRepository _repository;
      GetUserUseCase(this._repository);
      
      Future<Either<Failure, User>> call(String userId) {
        return _repository.getUser(userId);
      }
    }
  
  Presentation calls it:
    final result = await _getUserUseCase(userId);
  
  Benefits:
  - Testable in isolation (mock the repository)
  - Single Responsibility: one use case per business action
  - Swappable: change business logic without touching UI or data
  - Reusable: multiple screens can use the same use case
tags:
  - architecture
  - use-case
  - clean-architecture
---

---
id: ARCH_004
category: Architecture
subcategory: SOLID
difficulty: medium
type: single_choice
question: "What does the Single Responsibility Principle (SRP) mean in practice for Flutter?"
options:
  A: "Each app should have only one screen"
  B: "A class should have only ONE reason to change — one responsibility. A UserBloc should handle user state, not also manage network or formatting."
  C: "Each function should only have one line of code"
  D: "SRP only applies to backend code, not Flutter"
correct_answer: "B"
explanation: |
  SRP: A class should have only one reason to change.
  
  Violation example:
    class UserBloc {
      // handles user events AND formats dates AND parses JSON AND logs analytics
    }
  
  Fix: separate concerns:
    class UserBloc — only manages user state transitions
    class DateFormatter — only handles date formatting
    class UserMapper — only maps JSON to User model
    class AnalyticsService — only logs analytics events
  
  When requirements change (e.g., date format changes), only DateFormatter changes.
  The Bloc, Mapper, and Analytics service are not affected.
  
  SRP leads to smaller, testable, reusable classes.
tags:
  - architecture
  - solid
  - srp
---

---
id: ARCH_005
category: Architecture
subcategory: SOLID
difficulty: medium
type: single_choice
question: "What is the Dependency Inversion Principle (DIP) and how does it apply to Flutter architecture?"
options:
  A: "High-level modules should import low-level modules directly"
  B: "High-level modules (Bloc/UseCase) should depend on abstractions (interfaces), not concrete implementations (ApiService, SqlDatabase)"
  C: "DIP means using dependency injection frameworks only"
  D: "DIP requires reversing all function return types"
correct_answer: "B"
explanation: |
  DIP: Depend on abstractions, not concretions.
  
  Without DIP:
    class LoginBloc {
      final FirebaseAuth _auth = FirebaseAuth.instance; // concrete dependency
    }
  
  With DIP:
    abstract class AuthRepository { Future<User> login(String email, String pass); }
    
    class LoginBloc {
      final AuthRepository _auth; // depends on abstraction
      LoginBloc(this._auth);
    }
    
    class FirebaseAuthRepository implements AuthRepository { ... } // concrete
  
  Benefits:
  - Swap Firebase for another auth provider → only change the implementation
  - Unit test LoginBloc with a MockAuthRepository
  - No import of firebase_auth in your Bloc
tags:
  - architecture
  - solid
  - dip
  - dependency-injection
---

---
id: ARCH_006
category: Architecture
subcategory: SOLID
difficulty: medium
type: single_choice
question: "What is the Open/Closed Principle (OCP) and give a Flutter example?"
options:
  A: "Classes should be open for extension but closed for modification"
  B: "Code should be open source"
  C: "Methods should have open visibility by default"
  D: "OCP means never changing existing code"
correct_answer: "A"
explanation: |
  OCP: Software entities should be OPEN for extension, CLOSED for modification.
  Add new behavior by adding code, not changing existing tested code.
  
  Example — payment methods without OCP:
    if (type == 'card') { processCard(); }
    else if (type == 'paypal') { processPaypal(); }
    // Adding crypto requires modifying this class — violates OCP
  
  With OCP using polymorphism:
    abstract class PaymentMethod { Future<void> process(Order order); }
    class CardPayment implements PaymentMethod { ... }
    class PaypalPayment implements PaymentMethod { ... }
    class CryptoPayment implements PaymentMethod { ... } // new — no existing code changed
    
    class PaymentService {
      Future<void> process(PaymentMethod method, Order order) => method.process(order);
    }
tags:
  - architecture
  - solid
  - ocp
---

---
id: ARCH_007
category: Architecture
subcategory: SOLID
difficulty: hard
type: single_choice
question: "What is the Liskov Substitution Principle (LSP) and how can violating it cause bugs in Flutter?"
options:
  A: "LSP means subclasses must override all parent methods"
  B: "Objects of a subclass should be substitutable for objects of the parent class without breaking the program — subtypes must honor the parent contract"
  C: "LSP requires using `implements` instead of `extends`"
  D: "LSP is only relevant for abstract classes"
correct_answer: "B"
explanation: |
  LSP: if S is a subtype of T, then T can be replaced with S without altering program correctness.
  
  Violation example:
    class ReadOnlyRepository extends UserRepository {
      @override
      Future<void> saveUser(User user) => throw UnimplementedError(); // breaks contract!
    }
  
  A UseCase that calls saveUser() will unexpectedly throw when given a ReadOnlyRepository.
  
  Fix: use interface segregation — split into ReadableUserRepository and WritableUserRepository.
  Only implement what you actually support.
  
  Flutter example: a custom CacheDataSource that overrides fetch() but ignores the maxAge
  parameter is an LSP violation — callers expect the parameter to be honored.
tags:
  - architecture
  - solid
  - lsp
---

---
id: ARCH_008
category: Architecture
subcategory: SOLID
difficulty: medium
type: single_choice
question: "What is the Interface Segregation Principle (ISP)?"
options:
  A: "Use one large interface to handle all operations"
  B: "Clients should not be forced to depend on methods they don't use — split large interfaces into smaller, focused ones"
  C: "ISP means every class needs at least one interface"
  D: "ISP requires all interfaces to extend a base interface"
correct_answer: "B"
explanation: |
  ISP: No client should depend on methods it doesn't use.
  
  Violation:
    abstract class UserRepository {
      Future<User> getUser(String id);
      Future<void> saveUser(User user);
      Future<void> deleteUser(String id);
      Future<void> sendEmail(String userId, String message); // unrelated!
    }
  
  Fix: split:
    abstract class UserReadRepository { Future<User> getUser(String id); }
    abstract class UserWriteRepository { Future<void> saveUser(User user); }
    abstract class EmailService { Future<void> sendEmail(String to, String msg); }
  
  A read-only screen's Bloc implements only UserReadRepository — not forced
  to know about write or email operations.
tags:
  - architecture
  - solid
  - isp
---

---
id: ARCH_009
category: Architecture
subcategory: Feature Structure
difficulty: medium
type: single_choice
question: "What is the 'feature-first' folder structure and how does it differ from 'layer-first'?"
options:
  A: "Feature-first puts all Blocs together; layer-first separates UI and logic"
  B: "Feature-first groups files by feature (login/, profile/, cart/) each with its own layers; layer-first groups by layer (presentation/, domain/, data/) across all features"
  C: "They are identical — just different naming"
  D: "Feature-first is only for large teams; layer-first is for small projects"
correct_answer: "B"
explanation: |
  Layer-first (classic):
    lib/
      data/repositories/, data/models/, data/datasources/
      domain/usecases/, domain/entities/
      presentation/blocs/, presentation/pages/, presentation/widgets/
  Issue: adding a feature touches 6+ folders. Hard to modularize.
  
  Feature-first (recommended for scale):
    lib/
      features/
        auth/
          data/ (auth_repository_impl, auth_remote_source)
          domain/ (auth_repository, login_usecase)
          presentation/ (login_page, auth_bloc)
        profile/
          ...
      core/ (shared utilities, base classes, theme)
  
  Benefits: feature can be extracted to a separate package, team can own features independently.
tags:
  - architecture
  - feature-first
  - folder-structure
---

---
id: ARCH_010
category: Architecture
subcategory: Error Handling
difficulty: hard
type: single_choice
question: "Why use `Either<Failure, T>` return type in repositories and use cases instead of throwing exceptions?"
options:
  A: "Either is faster than try/catch"
  B: "Either makes errors part of the type signature — callers are forced to handle both success and failure paths at compile time, no silent exceptions"
  C: "Exceptions cannot be caught in Dart"
  D: "Either is only useful with async code"
correct_answer: "B"
explanation: |
  Throwing exceptions:
    Future<User> getUser(String id) async { ... } // caller may forget try/catch
  
  Either approach (using dartz or fpdart):
    Future<Either<Failure, User>> getUser(String id) async {
      try {
        final user = await _api.fetchUser(id);
        return Right(user);
      } on NetworkException catch (e) {
        return Left(NetworkFailure(e.message));
      }
    }
  
  Caller MUST handle both cases:
    result.fold(
      (failure) => emit(ErrorState(failure.message)),
      (user) => emit(LoadedState(user)),
    );
  
  Benefits:
  - Errors are explicit in the type system
  - No uncaught exceptions in business logic
  - Easy to test both success and failure paths
tags:
  - architecture
  - either
  - error-handling
  - functional-programming
---

---
id: ARCH_011
category: Architecture
subcategory: Clean Architecture
difficulty: medium
type: single_choice
question: "What is the difference between an `Entity` and a `Model` in Clean Architecture?"
options:
  A: "They are identical — Entity is just a shorter name for Model"
  B: "Entity is a pure domain object (no JSON/serialization logic); Model is the data-layer representation with fromJson/toJson for API/DB mapping"
  C: "Entity is used in the UI; Model is used in the backend"
  D: "Models are immutable; Entities are mutable"
correct_answer: "B"
explanation: |
  Domain Entity (pure Dart):
    class User {
      final String id;
      final String name;
      final Email email; // value object
      const User({required this.id, required this.name, required this.email});
    }
  No JSON, no Firebase references, no package imports — pure business concept.
  
  Data Model (data layer):
    class UserModel extends User {
      const UserModel({required super.id, required super.name, required super.email});
      
      factory UserModel.fromJson(Map<String, dynamic> json) => UserModel(
        id: json['id'],
        name: json['name'],
        email: Email(json['email']),
      );
      
      Map<String, dynamic> toJson() => {'id': id, 'name': name, 'email': email.value};
    }
  
  Repository maps Model → Entity before returning to domain layer.
tags:
  - architecture
  - entity
  - model
  - clean-architecture
---

---
id: ARCH_012
category: Architecture
subcategory: Modularization
difficulty: hard
type: single_choice
question: "What are the benefits of modularizing a Flutter app into separate Dart packages?"
options:
  A: "Modularization only helps apps with 10+ developers"
  B: "Separate packages enforce dependency boundaries at compile time, enable parallel builds, improve test isolation, and allow code sharing between apps"
  C: "Packages make the app slower due to extra linking"
  D: "Modularization requires rewriting everything in separate repos"
correct_answer: "B"
explanation: |
  Monorepo / modular Flutter structure:
    packages/
      core_ui/         — shared design system components
      core_network/    — Dio setup, interceptors
      feature_auth/    — auth feature (depends on core_network)
      feature_cart/    — cart feature (depends on core_ui)
    apps/
      mobile_app/      — depends on features
      tablet_app/      — shares features
  
  Benefits:
  - Compile-time enforcement: feature_auth cannot import feature_cart (no circular deps)
  - Incremental builds: only changed packages rebuild
  - Team ownership: teams own their package
  - Reusability: core_ui shared between mobile and web Flutter apps
  - Faster testing: test packages independently
  
  Tools: melos for monorepo management (versioning, running scripts across packages).
tags:
  - architecture
  - modularization
  - packages
  - monorepo
---

---
id: ARCH_013
category: Architecture
subcategory: Data Layer
difficulty: medium
type: single_choice
question: "What is a `DataSource` in Clean Architecture and why separate Remote and Local DataSources?"
options:
  A: "DataSource is another name for Repository"
  B: "DataSource handles raw data access (API call or DB query). Remote DataSource hits the network; Local DataSource reads from cache/DB. The Repository decides which to use."
  C: "DataSources are used only for Firebase"
  D: "Local DataSource is only for SharedPreferences"
correct_answer: "B"
explanation: |
  Data layer structure:
  
  RemoteDataSource — API calls (Dio), Firebase, GraphQL.
  Returns raw Maps or DTOs.
  
  LocalDataSource — local database (Hive, Drift), SharedPreferences, SecureStorage.
  Returns cached data.
  
  Repository implementation orchestrates:
    Future<Either<Failure, User>> getUser(String id) async {
      // 1. Check local cache
      final cached = await _local.getUser(id);
      if (cached != null) return Right(cached.toEntity());
      
      // 2. Fetch from remote
      final user = await _remote.getUser(id);
      await _local.cacheUser(user); // 3. Save to cache
      return Right(user.toEntity());
    }
  
  Separation allows: testing each source independently, swapping implementations.
tags:
  - architecture
  - data-source
  - clean-architecture
  - offline-first
---

---
id: ARCH_014
category: Architecture
subcategory: Dependency Injection
difficulty: medium
type: single_choice
question: "What is the difference between constructor injection and service locator pattern?"
options:
  A: "Constructor injection is for Flutter only; service locator is for backend"
  B: "Constructor injection passes dependencies via constructor (explicit, testable, recommended); service locator (GetIt) lets classes pull dependencies from a global registry (convenient but hides dependencies)"
  C: "Service locator is always better — it reduces boilerplate"
  D: "They are identical in functionality and testability"
correct_answer: "B"
explanation: |
  Constructor injection:
    class LoginBloc {
      LoginBloc({required AuthRepository authRepo}); // explicit dependency
    }
    // Test: LoginBloc(authRepo: MockAuthRepository())
  
  Service locator (GetIt):
    class LoginBloc {
      LoginBloc() {
        _authRepo = GetIt.I<AuthRepository>(); // hidden dependency
      }
    }
    // Test: GetIt.I.registerSingleton<AuthRepository>(MockAuthRepository())
  
  Constructor injection pros:
  - Dependencies are visible in the constructor signature
  - No test setup for GetIt registrations
  - Compile-time verification of dependencies
  
  Service locator pros:
  - Less boilerplate in large dependency trees
  - Access from anywhere (no context/ref needed)
  
  Best practice: use constructor injection for business logic, GetIt for wiring them together.
tags:
  - architecture
  - dependency-injection
  - getit
  - testing
---

---
id: ARCH_015
category: Architecture
subcategory: Architecture Patterns
difficulty: hard
type: single_choice
question: "In event-driven architecture with Bloc, how do you handle cross-feature communication (e.g., Auth Bloc needs to notify Cart Bloc to clear on logout)?"
options:
  A: "Access CartBloc directly from AuthBloc using GetIt"
  B: "Use a shared event bus / stream that both Blocs listen to, or use a higher-level orchestrator Bloc — avoid direct Bloc-to-Bloc dependencies"
  C: "Put all logic in one mega-Bloc"
  D: "Use global setState() to notify all widgets"
correct_answer: "B"
explanation: |
  Anti-pattern: AuthBloc holds a reference to CartBloc and calls bloc.add(ClearCart()).
  This creates tight coupling and is hard to test.
  
  Pattern 1 — Stream bus:
    class EventBus { final _controller = StreamController.broadcast(); }
    AuthBloc: eventBus.emit(UserLoggedOut());
    CartBloc: eventBus.on<UserLoggedOut>().listen((_) => add(ClearCartEvent()));
  
  Pattern 2 — Repository as mediator:
    CartRepository listens to auth state stream and clears data on logout.
  
  Pattern 3 — App-level orchestrator:
    AppBloc handles high-level events and dispatches to child Blocs.
  
  Pattern 4 — Riverpod: ref.listen(authProvider, (_, state) { ... }) naturally handles this.
tags:
  - architecture
  - bloc
  - cross-feature
  - event-driven
---
