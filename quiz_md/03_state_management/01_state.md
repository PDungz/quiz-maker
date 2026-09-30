---
id: STATE_001
category: State Management
subcategory: Bloc
difficulty: easy
type: single_choice
question: "What is the difference between `Bloc` and `Cubit`?"
options:
  A: "Cubit is faster; Bloc uses more memory"
  B: "Bloc uses Events to trigger state changes; Cubit exposes methods directly — Cubit is a simplified Bloc with less boilerplate"
  C: "Bloc supports streams; Cubit does not"
  D: "They are identical — Cubit is just an alias"
correct_answer: "B"
explanation: |
  Cubit: simpler — call methods to emit states directly.
    cubit.increment() → emits CounterState(count: 1)
  
  Bloc: event-driven — add Events, handlers emit states.
    bloc.add(IncrementEvent()) → on<IncrementEvent> handler emits CounterState(count: 1)
  
  Bloc advantages:
  - Full event traceability (every state change linked to an event)
  - BlocObserver logs all events and transitions globally
  - Better for complex business logic with many event types
  
  Cubit advantages: less boilerplate, easier for simple state.
tags:
  - state-management
  - bloc
  - cubit
---

---
id: STATE_002
category: State Management
subcategory: Bloc
difficulty: hard
type: single_choice
question: "What does `bloc_concurrency`'s `droppable()` transformer do, and when should you use it?"
options:
  A: "Queues all events and processes them one by one"
  B: "Cancels the current event handler when a new event arrives"
  C: "Ignores new incoming events while an event is already being processed"
  D: "Processes all events simultaneously in parallel"
correct_answer: "C"
explanation: |
  bloc_concurrency transformers:
  
  sequential() (default): queues events. Processes one at a time in order.
  concurrent(): processes all events simultaneously.
  droppable(): ignores new events while one is in progress. Use for: prevent duplicate API calls on rapid button taps.
  restartable(): cancels current handler and starts fresh with the new event. Use for: search-as-you-type (cancel old search on new keystroke).
  
  Example:
    on<SearchEvent>(_onSearch, transformer: restartable());
    on<SubmitEvent>(_onSubmit, transformer: droppable());
tags:
  - state-management
  - bloc
  - concurrency
  - bloc-concurrency
---

---
id: STATE_003
category: State Management
subcategory: Bloc
difficulty: medium
type: single_choice
question: "What is the difference between `BlocBuilder`, `BlocListener`, and `BlocConsumer`?"
options:
  A: "They are identical — just different naming conventions"
  B: "BlocBuilder rebuilds UI; BlocListener reacts to state changes with side effects; BlocConsumer combines both"
  C: "BlocListener is deprecated — use BlocBuilder with side effects"
  D: "BlocConsumer is only for Cubits; BlocBuilder is only for Blocs"
correct_answer: "B"
explanation: |
  BlocBuilder<B, S>(builder: (context, state) => widget):
  - Rebuilds the widget subtree when state changes
  - Use for: UI that reflects state (show loading spinner, display data)
  
  BlocListener<B, S>(listener: (context, state) { ... }):
  - Calls listener function when state changes, does NOT rebuild
  - Use for: side effects — navigation, showing snackbars, dialogs
  
  BlocConsumer<B, S>(builder: ..., listener: ...):
  - Combines both: rebuilds UI AND handles side effects
  - Avoids nesting BlocListener inside BlocBuilder
  
  buildWhen and listenWhen callbacks filter which state changes trigger rebuild/listen.
tags:
  - state-management
  - bloc
  - bloc-builder
  - bloc-listener
---

---
id: STATE_004
category: State Management
subcategory: Bloc
difficulty: hard
type: single_choice
question: "What is `BlocObserver` and how is it useful in production apps?"
options:
  A: "BlocObserver is a widget that shows Bloc state in a debug overlay"
  B: "BlocObserver is a global observer that intercepts all Bloc/Cubit events, state transitions, and errors — used for logging and analytics"
  C: "BlocObserver is used to inject dependencies into Blocs"
  D: "BlocObserver observes widget rebuilds triggered by Bloc"
correct_answer: "B"
explanation: |
  BlocObserver hooks into every Bloc and Cubit globally:
  
    class AppBlocObserver extends BlocObserver {
      @override
      void onEvent(Bloc bloc, Object? event) {
        super.onEvent(bloc, event);
        log('${bloc.runtimeType} event: $event');
      }
      @override
      void onTransition(Bloc bloc, Transition transition) {
        super.onTransition(bloc, transition);
        FirebaseAnalytics.logEvent(name: 'state_change', ...);
      }
      @override
      void onError(BlocBase bloc, Object error, StackTrace stackTrace) {
        Crashlytics.recordError(error, stackTrace);
        super.onError(bloc, error, stackTrace);
      }
    }
    Bloc.observer = AppBlocObserver(); // in main()
tags:
  - state-management
  - bloc
  - bloc-observer
  - logging
---

---
id: STATE_005
category: State Management
subcategory: Provider
difficulty: easy
type: single_choice
question: "What is the difference between `context.watch<T>()` and `context.read<T>()` in Provider?"
options:
  A: "watch() is for reading once; read() is for listening to changes"
  B: "watch() subscribes to changes and rebuilds the widget; read() reads the value once without subscribing (safe in callbacks)"
  C: "They are identical"
  D: "read() only works inside initState()"
correct_answer: "B"
explanation: |
  context.watch<T>(): registers dependency. Widget rebuilds when T changes.
  Use in build() to display reactive data.
  
  context.read<T>(): reads the value without registering dependency. Widget does NOT rebuild.
  Use in callbacks (onPressed, onChanged) where you need the value at that moment.
  
  Anti-pattern:
    onPressed: () => context.watch<Counter>().increment()  // wrong — watch in callback
  
  Correct:
    onPressed: () => context.read<Counter>().increment()   // read in callback
  
  context.select<T, R>((T t) => t.value): only rebuild when the selected value changes.
  More granular than watch() — avoids rebuilds when other parts of T change.
tags:
  - state-management
  - provider
  - context-watch
  - context-read
---

---
id: STATE_006
category: State Management
subcategory: Provider
difficulty: medium
type: single_choice
question: "What is the difference between `ChangeNotifierProvider` and `ProxyProvider`?"
options:
  A: "ProxyProvider is deprecated; use ChangeNotifierProvider for everything"
  B: "ChangeNotifierProvider creates and manages a ChangeNotifier instance; ProxyProvider creates a value that depends on OTHER providers and updates when they change"
  C: "They are identical in functionality"
  D: "ProxyProvider is only for read-only data"
correct_answer: "B"
explanation: |
  ChangeNotifierProvider<T extends ChangeNotifier>:
  - Creates a T instance and disposes it when the widget leaves the tree
  - Notifies consumers when notifyListeners() is called
  
  ProxyProvider<T, R>:
  - Creates R using a value from another provider (T)
  - Rebuilds R when T changes
  - Useful for passing an auth token to a repository:
    ProxyProvider<AuthBloc, UserRepository>(
      update: (context, auth, prev) => UserRepository(token: auth.token),
    )
  
  ChangeNotifierProxyProvider combines both: creates ChangeNotifier dependent on other providers.
tags:
  - state-management
  - provider
  - proxy-provider
---

---
id: STATE_007
category: State Management
subcategory: Riverpod
difficulty: medium
type: single_choice
question: "What are the main Provider types in Riverpod and when do you use each?"
options:
  A: "Riverpod only has one Provider type — use annotations to configure behavior"
  B: "Provider (static value), StateProvider (simple state), FutureProvider (async), StreamProvider (stream), NotifierProvider/AsyncNotifierProvider (complex logic)"
  C: "Riverpod has the same types as Provider package — they are compatible"
  D: "FutureProvider and StreamProvider are deprecated in Riverpod 2.x"
correct_answer: "B"
explanation: |
  Riverpod provider types:
  
  Provider<T> — synchronous read-only value. Use for: constants, repositories, services.
  StateProvider<T> — simple mutable state (no logic). Use for: UI toggles, filters.
  FutureProvider<T> — async value that resolves once. Use for: one-time data fetching.
  StreamProvider<T> — wraps a Stream. Use for: Firestore snapshots, WebSocket.
  NotifierProvider<N, T> — complex sync logic in a Notifier class.
  AsyncNotifierProvider<N, T> — complex async logic with loading/error states.
  
  All support .family (parameterized) and .autoDispose (cleanup when unused).
tags:
  - state-management
  - riverpod
  - provider-types
---

---
id: STATE_008
category: State Management
subcategory: Riverpod
difficulty: medium
type: single_choice
question: "What is the difference between `ref.watch()`, `ref.read()`, and `ref.listen()` in Riverpod?"
options:
  A: "They are identical — just different syntax preferences"
  B: "ref.watch() rebuilds widget on change; ref.read() reads once (safe in callbacks); ref.listen() runs a callback on change without rebuilding"
  C: "ref.listen() is only for StreamProviders"
  D: "ref.read() is deprecated — use ref.watch() everywhere"
correct_answer: "B"
explanation: |
  ref.watch(provider): subscribes to provider. Widget/provider rebuilds when value changes.
  Use in build() or other providers.
  
  ref.read(provider): reads value ONCE without subscribing. Use in event handlers/callbacks.
    onPressed: () => ref.read(counterProvider.notifier).increment()
  
  ref.listen(provider, (prev, next) { ... }): registers a callback that fires on change
  without causing a rebuild. Use for: navigation, showing snackbar, logging.
    ref.listen(authProvider, (_, state) {
      if (state == AuthState.loggedOut) context.go('/login');
    });
tags:
  - state-management
  - riverpod
  - ref-watch
  - ref-read
---

---
id: STATE_009
category: State Management
subcategory: Riverpod
difficulty: hard
type: single_choice
question: "What does `.family` modifier do in Riverpod?"
code: |
  final userProvider = FutureProvider.family<User, String>((ref, userId) async {
    return ref.read(userRepositoryProvider).getUser(userId);
  });
  
  // Usage:
  final user = ref.watch(userProvider('user-123'));
code_lang: dart
options:
  A: "family creates a shared provider that all widgets use simultaneously"
  B: "family parameterizes a provider — creates a separate provider instance for each unique parameter value"
  C: "family is only for authentication providers"
  D: "family creates a provider that accepts a list of arguments"
correct_answer: "B"
explanation: |
  .family creates a provider factory that takes a parameter and returns a unique
  provider instance for each unique parameter value.
  
  userProvider('user-123') and userProvider('user-456') are DIFFERENT providers,
  each with their own state and cache.
  
  The provider is cached by parameter — calling ref.watch(userProvider('user-123'))
  from multiple widgets shares the same instance (no duplicate fetches).
  
  Common uses:
  - Load specific item by ID: itemProvider(itemId)
  - Filter/search: searchProvider(query)
  - Locale-specific data: translationProvider(locale)
tags:
  - state-management
  - riverpod
  - family
---

---
id: STATE_010
category: State Management
subcategory: Riverpod
difficulty: medium
type: single_choice
question: "What does `.autoDispose` do in Riverpod and when should you use it?"
options:
  A: "autoDispose disposes the provider after 30 seconds of inactivity"
  B: "autoDispose destroys the provider state when there are no more listeners — memory is reclaimed when navigating away"
  C: "autoDispose is the default behavior for all providers"
  D: "autoDispose only works with StateProvider"
correct_answer: "B"
explanation: |
  Without autoDispose: provider state lives forever (for the lifetime of the ProviderScope).
  This is useful for global singletons (auth state, user profile) that should persist.
  
  With autoDispose: provider is destroyed when its last listener unsubscribes (e.g., widget disposed).
  - Memory freed when leaving the screen
  - Next time the screen is opened, provider starts fresh (re-fetches data)
  
  Use autoDispose for:
  - Screen-specific data (search results, form state)
  - Data that should refresh each visit (product details page)
  
  Skip autoDispose for:
  - App-wide singletons (auth, cart, preferences)
  - Data expensive to re-fetch (large catalog)
  
  Use ref.keepAlive() inside a provider to conditionally prevent auto-disposal.
tags:
  - state-management
  - riverpod
  - auto-dispose
---

---
id: STATE_011
category: State Management
subcategory: GetIt
difficulty: medium
type: single_choice
question: "What is `GetIt` and how does it differ from Provider/Riverpod?"
options:
  A: "GetIt is a Flutter-specific state management solution like Bloc"
  B: "GetIt is a service locator (dependency injection container) — it registers and resolves dependencies without being tied to the widget tree"
  C: "GetIt is deprecated and replaced by Riverpod"
  D: "GetIt only works for singleton services"
correct_answer: "B"
explanation: |
  GetIt is a service locator / dependency injection container:
  
  Registration (in main or setup):
    GetIt.I.registerSingleton<ApiService>(ApiService());
    GetIt.I.registerLazySingleton<UserRepo>(() => UserRepoImpl());
    GetIt.I.registerFactory<LoginBloc>(() => LoginBloc(GetIt.I<UserRepo>()));
  
  Resolution (anywhere in code — no BuildContext needed!):
    final apiService = GetIt.I<ApiService>();
    final userRepo = GetIt.I<UserRepo>();
  
  Difference from Provider/Riverpod:
  - GetIt is NOT widget-tree-aware — works in plain Dart classes, no context needed
  - No rebuild mechanism — just DI
  - Commonly paired with Bloc/Riverpod: GetIt for DI, Bloc for state
  
  get_it + injectable: code generation for automatic registration.
tags:
  - state-management
  - getit
  - dependency-injection
---

---
id: STATE_012
category: State Management
subcategory: GetIt
difficulty: medium
type: single_choice
question: "What is the difference between `registerSingleton`, `registerLazySingleton`, and `registerFactory` in GetIt?"
options:
  A: "They are all identical — just different naming"
  B: "registerSingleton creates immediately; registerLazySingleton creates on first access; registerFactory creates a NEW instance every call"
  C: "registerFactory creates a singleton; registerSingleton creates multiple instances"
  D: "registerLazySingleton is deprecated"
correct_answer: "B"
explanation: |
  registerSingleton<T>(T instance):
  - Creates and registers the instance IMMEDIATELY at registration time
  - Same instance returned every time
  - Use for: services that must be ready at startup
  
  registerLazySingleton<T>(() => T()):
  - Factory called only on FIRST GetIt.I<T>() access (lazy)
  - Same instance returned on subsequent calls
  - Use for: most services (faster startup, memory efficient)
  
  registerFactory<T>(() => T()):
  - Factory called on EVERY GetIt.I<T>() call
  - Returns a NEW instance each time
  - Use for: Blocs/Cubits that should be fresh per screen
tags:
  - state-management
  - getit
  - dependency-injection
---

---
id: STATE_013
category: State Management
subcategory: MVVM
difficulty: medium
type: single_choice
question: "How is MVVM implemented in Flutter using ChangeNotifier?"
options:
  A: "Model = Widget, View = BuildContext, ViewModel = State"
  B: "Model = data/domain, ViewModel = ChangeNotifier with business logic and notifyListeners(), View = widget that watches via Consumer or context.watch()"
  C: "MVVM is not applicable to Flutter — use MVC instead"
  D: "ViewModel in Flutter must extend StatefulWidget"
correct_answer: "B"
explanation: |
  MVVM in Flutter with Provider:
  
  Model: data classes, repositories, domain entities.
  
  ViewModel (class extends ChangeNotifier):
    class UserViewModel extends ChangeNotifier {
      User? _user;
      User? get user => _user;
      
      Future<void> loadUser(String id) async {
        _user = await _repo.getUser(id);
        notifyListeners(); // notify View to rebuild
      }
    }
  
  View (widget):
    Consumer<UserViewModel>(builder: (context, vm, _) =>
      vm.user == null ? LoadingWidget() : UserCard(user: vm.user!))
  
  ChangeNotifierProvider creates and disposes the ViewModel.
tags:
  - state-management
  - mvvm
  - change-notifier
  - provider
---

---
id: STATE_014
category: State Management
subcategory: Bloc
difficulty: hard
type: multiple_choice
question: "Which of the following are correct best practices for Bloc state design? (Select ALL that apply)"
options:
  A: "State classes should be immutable — use copyWith() for modifications"
  B: "Emit a new state object (not mutate the existing one) to trigger rebuilds"
  C: "Using a single state class with status enum (initial/loading/success/failure) is a valid pattern"
  D: "setState() inside a Bloc is the correct way to update UI"
correct_answer: "A,B,C"
explanation: |
  A — TRUE: Bloc states should be immutable value objects.
    Use freezed or manual copyWith() for partial updates.
  
  B — TRUE: Bloc checks equality before notifying — emitting the SAME object instance
    does NOT trigger rebuild. Always emit a new object.
    Bad: state.list.add(item); emit(state); // mutates, same reference
    Good: emit(state.copyWith(list: [...state.list, item]));
  
  C — TRUE: The status pattern (sealed class or enum) is a clean approach:
    sealed class UserState {}
    class UserLoading extends UserState {}
    class UserLoaded extends UserState { final User user; }
    class UserError extends UserState { final String message; }
  
  D — FALSE: Blocs are pure Dart — no setState(). UI reacts via BlocBuilder.
tags:
  - state-management
  - bloc
  - best-practices
---

---
id: STATE_015
category: State Management
subcategory: Riverpod
difficulty: hard
type: single_choice
question: "How do you handle errors in a `FutureProvider` or `AsyncNotifierProvider` in Riverpod?"
options:
  A: "Use try/catch and return null on error"
  B: "Riverpod wraps the value in AsyncValue<T> — use .when(data, error, loading) to handle all states"
  C: "Errors in FutureProvider crash the app — you must catch them manually"
  D: "Use ErrorBoundary widget from Riverpod"
correct_answer: "B"
explanation: |
  FutureProvider and StreamProvider automatically wrap their value in AsyncValue<T>:
  - AsyncValue.loading() — while the future is pending
  - AsyncValue.data(value) — when resolved successfully
  - AsyncValue.error(error, stackTrace) — when an exception is thrown
  
  Consume with .when():
    ref.watch(userProvider).when(
      data: (user) => UserCard(user: user),
      loading: () => const CircularProgressIndicator(),
      error: (err, stack) => ErrorWidget(err.toString()),
    )
  
  Or .whenData() for just the success case.
  Or .value for the raw value (null if not loaded yet).
  
  In AsyncNotifier, throw exceptions normally — Riverpod catches them and sets error state.
tags:
  - state-management
  - riverpod
  - async-value
  - error-handling
---

---
id: STATE_016
category: State Management
subcategory: Bloc
difficulty: medium
type: single_choice
question: "What happens if you `emit()` in a Bloc after it's been closed?"
options:
  A: "Nothing — the emit is silently ignored"
  B: "A StateError is thrown: 'Cannot emit new states after calling close'"
  C: "The state is queued and emitted when the Bloc is re-opened"
  D: "The app crashes silently"
correct_answer: "B"
explanation: |
  After bloc.close() is called, the bloc's stream is closed. Calling emit() throws:
  "Cannot emit new states after calling close"
  
  This commonly happens when:
  - An async operation completes AFTER the widget (and Bloc) was disposed
  - The user navigated away during an in-flight API call
  
  Fix: check isClosed before emitting in async handlers:
    Future<void> _onLoadData(LoadData event, Emitter<State> emit) async {
      final data = await repository.fetch();
      if (!isClosed) emit(LoadedState(data));
    }
  
  Better fix: use Emitter.forEach() or Emitter.onEach() which automatically handle
  stream cancellation when the Bloc is closed.
tags:
  - state-management
  - bloc
  - lifecycle
  - close
---

---
id: STATE_017
category: State Management
subcategory: Riverpod
difficulty: hard
type: single_choice
question: "What is `ref.invalidate()` in Riverpod and when would you use it?"
options:
  A: "ref.invalidate() disposes the provider permanently"
  B: "ref.invalidate() forces a provider to re-compute on next access — useful for manual cache-busting (e.g., pull-to-refresh)"
  C: "ref.invalidate() is only available in tests"
  D: "ref.invalidate() removes the provider from the ProviderScope"
correct_answer: "B"
explanation: |
  ref.invalidate(provider) marks the provider as stale:
  - If there are active listeners: provider immediately re-computes
  - If there are no listeners: re-computes on next ref.watch()
  
  Common use cases:
  
  Pull-to-refresh:
    onRefresh: () async => ref.invalidate(postsProvider)
  
  After mutation (create/update/delete):
    await ref.read(postRepo).createPost(post);
    ref.invalidate(postsProvider); // refresh list
  
  After login/logout:
    ref.invalidate(userProfileProvider);
    ref.invalidate(permissionsProvider);
  
  Unlike ref.refresh() which also returns the new value, ref.invalidate() just schedules re-computation.
tags:
  - state-management
  - riverpod
  - invalidate
  - cache
---

---
id: STATE_018
category: State Management
subcategory: Provider
difficulty: medium
type: single_choice
question: "What is a `Selector` in Provider and why is it important for performance?"
options:
  A: "Selector is a widget that selects which provider to use based on platform"
  B: "Selector rebuilds only when a SPECIFIC selected value changes — prevents unnecessary rebuilds when other parts of the model change"
  C: "Selector is deprecated — use Consumer with buildWhen instead"
  D: "Selector can only be used with primitive types"
correct_answer: "B"
explanation: |
  Consumer<CartModel> rebuilds whenever ANY part of CartModel changes.
  
  Selector<CartModel, int>((context, cart) => cart.itemCount) only rebuilds when
  cart.itemCount changes — even if other properties (total price, items list) change.
  
  Example:
    Selector<CartModel, bool>(
      selector: (context, cart) => cart.isEmpty,
      builder: (context, isEmpty, child) =>
        isEmpty ? const EmptyCart() : const CartList(),
    )
  
  This is crucial in complex models — avoids rebuilding the entire screen when a
  sub-property changes. Equivalent to Riverpod's ref.watch(provider.select(...)).
tags:
  - state-management
  - provider
  - selector
  - performance
---

---
id: STATE_019
category: State Management
subcategory: Bloc
difficulty: medium
type: single_choice
question: "How does `MultiBlocProvider` improve code over nesting multiple `BlocProvider`s?"
options:
  A: "MultiBlocProvider runs Blocs on separate threads"
  B: "MultiBlocProvider flattens deeply nested BlocProvider trees into a flat list, improving readability"
  C: "MultiBlocProvider shares state between multiple Blocs"
  D: "It is a performance optimization that merges Blocs"
correct_answer: "B"
explanation: |
  Nested approach (hard to read):
    BlocProvider<AuthBloc>(
      create: (_) => AuthBloc(),
      child: BlocProvider<UserBloc>(
        create: (_) => UserBloc(),
        child: BlocProvider<CartBloc>(
          create: (_) => CartBloc(),
          child: MyApp(),
        ),
      ),
    )
  
  MultiBlocProvider approach (flat and readable):
    MultiBlocProvider(
      providers: [
        BlocProvider<AuthBloc>(create: (_) => AuthBloc()),
        BlocProvider<UserBloc>(create: (_) => UserBloc()),
        BlocProvider<CartBloc>(create: (_) => CartBloc()),
      ],
      child: MyApp(),
    )
  
  Similar helpers: MultiProvider (Provider package), MultiRepositoryProvider (bloc).
tags:
  - state-management
  - bloc
  - multi-bloc-provider
---

---
id: STATE_020
category: State Management
subcategory: Riverpod
difficulty: hard
type: single_choice
question: "What is the difference between `ProviderScope` and `ProviderContainer` in Riverpod?"
options:
  A: "They are identical — ProviderScope is just the widget wrapper for ProviderContainer"
  B: "ProviderScope is the widget that stores providers for the Flutter widget tree; ProviderContainer is the pure Dart equivalent (for tests and non-Flutter contexts)"
  C: "ProviderContainer can only be used in tests"
  D: "ProviderScope is deprecated in Riverpod 2.x"
correct_answer: "B"
explanation: |
  ProviderScope (Flutter widget):
  - Wraps the Flutter app at the root
  - Stores all provider state
  - Must wrap all widgets that use providers
  - Disposes all providers when removed from tree
    runApp(ProviderScope(child: MyApp()))
  
  ProviderContainer (pure Dart):
  - Same functionality but no widget tree dependency
  - Used in unit tests (no Flutter testing framework needed):
    final container = ProviderContainer();
    final value = container.read(myProvider);
    addTearDown(container.dispose);
  
  - Used in non-Flutter Dart apps or background isolates
  - ProviderScope internally wraps a ProviderContainer
tags:
  - state-management
  - riverpod
  - provider-scope
  - testing
---
