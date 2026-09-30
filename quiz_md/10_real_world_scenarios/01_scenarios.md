---
id: SCENARIO_001
category: Real World
subcategory: Authentication
difficulty: hard
type: single_choice
question: "Your login screen has a race condition: rapidly tapping the login button sends multiple API requests. How do you fix this?"
options:
  A: "Disable the button in the UI only — the backend handles duplicates"
  B: "Use droppable() transformer in Bloc (ignore new events while one is processing), or set a loading state that disables the button before the first request completes"
  C: "Add a 500ms debounce to all button taps globally"
  D: "Use a Mutex to queue login requests"
correct_answer: "B"
explanation: |
  The race condition: user taps quickly → multiple LoginEvent added to Bloc → multiple
  API calls → possibly two sessions created, duplicate analytics events, or errors.
  
  Solution 1 — Bloc droppable transformer (recommended):
    on<LoginEvent>(_onLogin, transformer: droppable());
  droppable() ignores new LoginEvents while _onLogin is in progress.
  
  Solution 2 — Emit loading state before API call:
    Future<void> _onLogin(LoginEvent event, Emitter emit) async {
      emit(LoginLoading());  // disables button immediately
      try {
        final user = await _authRepo.login(event.email, event.pass);
        emit(LoginSuccess(user));
      } catch (e) {
        emit(LoginError(e.toString()));
      }
    }
  
  In UI: BlocBuilder disables button when state is LoginLoading.
  
  Both approaches are complementary — use both for defense in depth.
tags:
  - scenario
  - race-condition
  - bloc
  - authentication
---

---
id: SCENARIO_002
category: Real World
subcategory: Networking
difficulty: hard
type: single_choice
question: "Your WebSocket connection drops intermittently on mobile networks. How do you implement a reliable reconnect strategy?"
options:
  A: "Reconnect immediately on every disconnect — fastest recovery"
  B: "Exponential backoff with jitter + connectivity check + heartbeat ping to detect silent drops"
  C: "Only reconnect when the user explicitly pulls to refresh"
  D: "Switch to HTTP polling instead of WebSocket"
correct_answer: "B"
explanation: |
  Robust WebSocket reconnect strategy:
  
  1. Exponential backoff on disconnect:
    Duration _backoff = Duration(seconds: 1);
    void _reconnect() async {
      while (!_connected) {
        await Future.delayed(_backoff + _jitter());
        _backoff = (_backoff * 2).clamp(Duration(seconds: 1), Duration(minutes: 2));
        try { await _connect(); _backoff = Duration(seconds: 1); }
        catch (_) {}
      }
    }
  
  2. Jitter: add random 0-1s to prevent thundering herd on server restart.
  
  3. Network check: pause retry loop when connectivity_plus reports no network.
    connectivity.onConnectivityChanged.listen((result) {
      if (result != ConnectivityResult.none) _reconnect();
    });
  
  4. Heartbeat ping: WebSocket can appear open but be silently dead.
    Timer.periodic(Duration(seconds: 30), (_) => _channel.sink.add('ping'));
    If no pong within 10s → treat as disconnected → reconnect.
tags:
  - scenario
  - websocket
  - reconnect
  - exponential-backoff
---

---
id: SCENARIO_003
category: Real World
subcategory: State Management
difficulty: hard
type: single_choice
question: "Users report that navigating back to a screen shows stale data — the Bloc is retaining its last state. How do you fix this?"
options:
  A: "Call bloc.close() on every navigation"
  B: "Ensure the BlocProvider that creates the Bloc is scoped to the route — when the route is popped, the BlocProvider is disposed and the Bloc is closed/reset on re-entry"
  C: "Manually reset Bloc state in initState()"
  D: "Use a global Bloc that never disposes"
correct_answer: "B"
explanation: |
  Root cause: BlocProvider placed too high in the widget tree (e.g., at app level)
  keeps the Bloc alive between navigation. Re-visiting the screen shows the old state.
  
  Fix: scope BlocProvider to the route that needs it:
  
  With go_router:
    GoRoute(
      path: '/products',
      builder: (context, state) => BlocProvider(
        create: (_) => ProductBloc()..add(LoadProductsEvent()),
        child: ProductsPage(),
      ),
    )
  
  Or with Navigator:
    Navigator.push(context, MaterialPageRoute(
      builder: (_) => BlocProvider(
        create: (_) => ProductBloc()..add(LoadProductsEvent()),
        child: ProductsPage(),
      ),
    ));
  
  When the route is popped, BlocProvider.dispose() → Bloc.close() → next visit creates fresh Bloc.
  
  For data that SHOULD persist across navigation (cart, auth): keep at app level.
  For screen-specific data (product list, search results): scope to route.
tags:
  - scenario
  - bloc
  - navigation
  - memory
---

---
id: SCENARIO_004
category: Real World
subcategory: Networking
difficulty: hard
type: single_choice
question: "Multiple API requests all get 401 simultaneously when the token expires. Each triggers a token refresh, causing a refresh race condition. How do you solve this?"
options:
  A: "Refresh the token before every single request"
  B: "Use a lock flag in the auth interceptor: first 401 triggers refresh, subsequent 401s queue and wait for the first refresh to complete, then all retry with the new token"
  C: "Logout the user on any 401"
  D: "Increase the token expiry to 30 days"
correct_answer: "B"
explanation: |
  The problem: 5 requests go out simultaneously. Token expires mid-flight.
  All 5 get 401. All 5 try to call refreshToken() → 5 simultaneous refresh calls.
  First refresh succeeds, next 4 may fail (refresh token used) → user gets logged out.
  
  Dio interceptor with lock:
    bool _isRefreshing = false;
    final List<(RequestOptions, ErrorInterceptorHandler)> _pendingQueue = [];
    
    onError: (e, handler) async {
      if (e.response?.statusCode != 401) return handler.next(e);
      
      if (_isRefreshing) {
        _pendingQueue.add((e.requestOptions, handler));
        return; // wait, don't reject yet
      }
      
      _isRefreshing = true;
      try {
        final token = await _auth.refreshToken();
        _storage.saveToken(token);
        // Retry queued requests
        for (final (opts, h) in _pendingQueue) {
          opts.headers['Authorization'] = 'Bearer $token';
          h.resolve(await _dio.fetch(opts));
        }
        _pendingQueue.clear();
        // Retry current request
        e.requestOptions.headers['Authorization'] = 'Bearer $token';
        handler.resolve(await _dio.fetch(e.requestOptions));
      } catch (_) {
        for (final (_, h) in _pendingQueue) h.reject(e);
        _pendingQueue.clear();
        handler.reject(e);
        _auth.logout();
      } finally { _isRefreshing = false; }
    }
tags:
  - scenario
  - networking
  - token-refresh
  - race-condition
---

---
id: SCENARIO_005
category: Real World
subcategory: Performance
difficulty: hard
type: single_choice
question: "The app freezes for 2-3 seconds when loading a list of 500 items with complex local processing. How do you diagnose and fix this?"
options:
  A: "Add more cache — the issue is network latency"
  B: "Profile with DevTools to confirm it's CPU-bound, then move the processing to a compute() isolate to avoid blocking the UI thread"
  C: "Reduce the list to 50 items maximum"
  D: "Use a more powerful device"
correct_answer: "B"
explanation: |
  Diagnosis:
  1. flutter run --profile → DevTools Performance tab
  2. Reproduce the freeze → look for a long frame in the chart
  3. CPU profiler flame chart → find the expensive Dart function (JSON parsing, sorting, etc.)
  4. Confirm it's UI thread, not raster thread
  
  Fix — move to isolate:
    // Before (blocking UI):
    List<Item> items = parseAndProcessItems(rawJson); // 2s on UI thread
    
    // After (non-blocking):
    List<Item> items = await compute(parseAndProcessItems, rawJson);
    // or:
    List<Item> items = await Isolate.run(() => parseAndProcessItems(rawJson));
  
  Also consider:
  - Lazy processing: only process items as they scroll into view
  - Pagination: process 20 items at a time
  - Background isolate worker: keep isolate alive for repeated processing
  
  Never do CPU-heavy work in build() — it runs on every frame tick.
tags:
  - scenario
  - performance
  - isolate
  - jank
---

---
id: SCENARIO_006
category: Real World
subcategory: Firebase
difficulty: hard
type: single_choice
question: "Users report receiving duplicate push notifications. What are the likely causes and how do you fix them?"
options:
  A: "Duplicate notifications are a Firebase bug — report to Google"
  B: "Multiple FCM tokens registered per user, multiple topic subscriptions, missing deduplication logic, or notification channel misconfiguration on Android"
  C: "Duplicate notifications only happen on Android 8+"
  D: "Increase the minimum interval between sends on the server"
correct_answer: "B"
explanation: |
  Root causes of duplicate notifications:
  
  1. Multiple FCM tokens per device:
     User reinstalls app → new token + old token still in backend.
     Fix: listen to onTokenRefresh, replace old token (not append).
     Handle FCM token invalidation (404 from FCM API = delete that token from backend).
  
  2. Multiple subscriptions to same topic:
     subscribeTopic called multiple times without checking.
     Fix: track subscription state locally, subscribe only once.
  
  3. Android notification channels:
     Multiple channels receiving the same notification.
     Fix: ensure consistent channel ID per notification type.
  
  4. Duplicate message IDs from server:
     Fix server to generate unique message IDs.
  
  5. Foreground + background handling both showing notification:
     Fix: in foreground handler, check if you've already shown a local notification.
  
  Client-side deduplication: store last 100 message IDs (fcmMessageId) in SharedPreferences.
  Before showing: if (seenIds.contains(messageId)) return; // skip duplicate.
tags:
  - scenario
  - firebase
  - fcm
  - notifications
---

---
id: SCENARIO_007
category: Real World
subcategory: Firebase
difficulty: hard
type: single_choice
question: "Your Firestore real-time listener is causing unnecessary reads and high costs. How do you optimize it?"
options:
  A: "Real-time listeners cannot be optimized — switch to polling"
  B: "Narrow the query, use snapshots metadata to differentiate local vs server changes, unsubscribe when not needed, and denormalize data to reduce listen scope"
  C: "Increase Firestore quotas in the console"
  D: "Cache all Firestore data in SharedPreferences"
correct_answer: "B"
explanation: |
  Firestore cost optimization for listeners:
  
  1. Narrow queries: listen to the specific document/subcollection you need.
    BAD: collection('posts').snapshots() → listens to ALL posts
    GOOD: collection('posts').where('userId', isEqualTo: uid).limit(20).snapshots()
  
  2. Local vs server change detection:
    stream.listen((snapshot) {
      if (snapshot.metadata.isFromCache) return; // skip local changes
      if (snapshot.metadata.hasPendingWrites) return; // skip optimistic writes
      processServerUpdate(snapshot);
    });
  
  3. Unsubscribe when widget is off-screen:
    _subscription = collectionRef.snapshots().listen(...);
    // In dispose():
    _subscription?.cancel();
  
  4. Use get() instead of snapshots() for infrequently-changing data.
  
  5. Denormalize: store all needed data in one document to avoid multiple listeners.
tags:
  - scenario
  - firebase
  - firestore
  - performance
  - cost
---

---
id: SCENARIO_008
category: Real World
subcategory: Navigation
difficulty: hard
type: single_choice
question: "The app receives a deep link notification while in terminated state. How do you ensure the user navigates to the correct screen?"
options:
  A: "Deep link navigation from terminated state is not possible"
  B: "Get the initial message/link in main() before runApp, store the destination, then navigate after the widget tree is built using addPostFrameCallback or initial route logic"
  C: "Use a Timer to check for pending deep links every second"
  D: "Handle deep links only when the app is in foreground"
correct_answer: "B"
explanation: |
  Complete deep link + terminated state navigation:
  
    void main() async {
      WidgetsFlutterBinding.ensureInitialized();
      await Firebase.initializeApp();
      
      // Check FCM notification that launched the app
      final initialMessage = await FirebaseMessaging.instance.getInitialMessage();
      
      // Check deep link that launched the app
      final initialLink = await AppLinks().getInitialLink();
      
      runApp(MyApp(
        initialNotification: initialMessage,
        initialDeepLink: initialLink,
      ));
    }
  
  In the root widget's initState:
    @override
    void initState() {
      super.initState();
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (widget.initialNotification != null) {
          _handleNotificationNavigation(widget.initialNotification!);
        }
        if (widget.initialDeepLink != null) {
          context.go(widget.initialDeepLink!.path);
        }
      });
    }
  
  addPostFrameCallback ensures the widget tree is built before navigation.
tags:
  - scenario
  - deep-link
  - fcm
  - navigation
  - terminated-state
---

---
id: SCENARIO_009
category: Real World
subcategory: Performance
difficulty: hard
type: single_choice
question: "A large list with CachedNetworkImages is consuming excessive memory and causing the app to be killed by the OS. How do you fix this?"
options:
  A: "Load fewer images per page"
  B: "Use ListView.builder with memCacheWidth/Height constraints, limit cache size, and use AutomaticKeepAliveClientMixin only where necessary"
  C: "Convert all images to local assets"
  D: "Use FutureBuilder to load images one by one"
correct_answer: "B"
explanation: |
  Memory optimization for large image lists:
  
  1. ListView.builder (lazy) — only builds visible items:
    ListView.builder(itemBuilder: (_, i) => ImageItem(items[i]))
    NOT ListView with all items pre-built.
  
  2. memCacheWidth/Height — decode at display size, not original resolution:
    CachedNetworkImage(
      imageUrl: url,
      memCacheWidth: 300,  // decode at 300px even if original is 4K
      memCacheHeight: 300,
    )
    A 300x300 display size uses 300*300*4 = ~360KB not 4000*4000*4 = ~64MB
  
  3. Limit cache:
    PaintingBinding.instance.imageCache.maximumSize = 100; // max 100 images
    PaintingBinding.instance.imageCache.maximumSizeBytes = 50 << 20; // 50MB
  
  4. Avoid AutomaticKeepAliveClientMixin on image items — it keeps items alive off-screen.
  
  5. RepaintBoundary per item: prevent neighbor repaints triggering full list repaint.
tags:
  - scenario
  - performance
  - memory
  - images
  - list
---

---
id: SCENARIO_010
category: Real World
subcategory: State Management
difficulty: hard
type: single_choice
question: "A Provider state update on Screen A is not reflected on Screen B, even though they share the same provider. What are the likely causes?"
options:
  A: "Provider cannot share state between screens"
  B: "The ChangeNotifierProvider is scoped below the common ancestor, different Provider instances exist, or context.watch() is missing (using context.read() instead)"
  C: "Navigator.push always creates a new Provider scope"
  D: "You must use GlobalKey to share Provider state between screens"
correct_answer: "B"
explanation: |
  Common causes and fixes:
  
  1. Provider scoped too low (most common):
    // BAD: each screen creates its own CartProvider instance
    MaterialPageRoute(builder: (_) => ChangeNotifierProvider(
      create: (_) => CartProvider(),
      child: CartPage(),
    ))
    
    // GOOD: place shared providers above Navigator (in MaterialApp or app root)
    ChangeNotifierProvider(create: (_) => CartProvider(), child: MaterialApp(...))
  
  2. Using context.read() instead of context.watch() in the widget that should update:
    // BAD: read() doesn't subscribe to changes
    Text('${context.read<Cart>().count}')
    // GOOD: watch() rebuilds on change
    Text('${context.watch<Cart>().count}')
  
  3. Forgot to call notifyListeners() in CartProvider after mutation.
  
  4. Using Selector with wrong selector function that always returns equal (cached value).
  
  Debug: wrap with Consumer and print state in builder to verify it fires.
tags:
  - scenario
  - provider
  - state-management
  - navigation
---

---
id: SCENARIO_011
category: Real World
subcategory: Firebase
difficulty: hard
type: single_choice
question: "Firebase Crashlytics is not capturing Flutter errors in production. What could be wrong?"
options:
  A: "Crashlytics only works in debug mode"
  B: "Missing FlutterError.onError setup, missing runZonedGuarded/PlatformDispatcher.onError, or crashlyticsCollectionEnabled is set to false"
  C: "Crashlytics requires a paid Firebase plan"
  D: "Crashlytics auto-captures everything without setup"
correct_answer: "B"
explanation: |
  Crashlytics checklist:
  
  1. FlutterError.onError not set → Flutter framework errors (like build errors) not reported:
    FlutterError.onError = FirebaseCrashlytics.instance.recordFlutterFatalError;
  
  2. Dart async errors not caught → runZonedGuarded or PlatformDispatcher:
    PlatformDispatcher.instance.onError = (error, stack) {
      FirebaseCrashlytics.instance.recordError(error, stack, fatal: true);
      return true;
    };
  
  3. Collection disabled:
    await FirebaseCrashlytics.instance.setCrashlyticsCollectionEnabled(true);
    // Or check if disabled for debug builds only
  
  4. Missing DSYM upload for iOS (crashes show unsymbolicated addresses):
    Add "Upload dSYMs" build phase in Xcode, or use Fastlane upload_symbols_to_crashlytics.
  
  5. Obfuscated Android without symbol upload:
    firebase crashlytics:symbols:upload --app=<APP_ID> ./debug-symbols/
  
  6. Testing in debug mode with crashlyticsCollectionEnabled: false (by design — check release mode).
tags:
  - scenario
  - firebase
  - crashlytics
  - error-handling
---

---
id: SCENARIO_012
category: Real World
subcategory: Architecture
difficulty: hard
type: single_choice
question: "Your app needs offline support — users should see cached data and queue writes when offline, then sync when online. What is the architecture?"
options:
  A: "Show an error message when offline — syncing is too complex"
  B: "Read from local DB first (Hive/Drift), write optimistically to local DB immediately, queue failed server writes, sync queue on reconnect"
  C: "Use SharedPreferences to cache all API responses"
  D: "Only cache read operations — writes require network"
correct_answer: "B"
explanation: |
  Offline-first architecture:
  
  Reads (cache-first):
    Future<List<Post>> getPosts() async {
      final cached = await _localDb.getPosts();
      if (cached.isNotEmpty) yield cached; // show immediately
      try {
        final fresh = await _api.getPosts();
        await _localDb.savePosts(fresh);
        yield fresh; // update display
      } catch (e) { /* show cached, no error if fresh fails */ }
    }
  
  Writes (optimistic + queue):
    Future<void> createPost(Post post) async {
      await _localDb.savePost(post); // immediate local write
      try {
        await _api.createPost(post); // try server
      } catch (NetworkException) {
        await _syncQueue.add(SyncOperation.create(post)); // queue for later
      }
    }
  
  Sync on reconnect:
    connectivity.onConnectivityChanged.listen((status) async {
      if (status != ConnectivityResult.none) {
        final pending = await _syncQueue.getAll();
        for (final op in pending) await _processOperation(op);
      }
    });
  
  Tools: Hive/Drift/Isar for local DB, WorkManager for background sync.
tags:
  - scenario
  - offline-first
  - architecture
  - sync
---

---
id: SCENARIO_013
category: Real World
subcategory: Testing
difficulty: hard
type: single_choice
question: "Golden tests are passing locally but failing on CI. What is the most likely cause and fix?"
options:
  A: "CI has a slower CPU — golden tests fail on slow machines"
  B: "Font rendering and anti-aliasing differ between macOS (local) and Linux (CI). Fix: run golden tests only on Linux, use loadFonts() in setUp, or use a tolerance threshold."
  C: "Golden tests don't work in CI environments"
  D: "CI must use a physical device for golden tests"
correct_answer: "B"
explanation: |
  Root cause: golden file was generated on macOS (developer machine) but CI runs on Linux.
  Different OS → different font rendering → pixel differences → test fails.
  
  Solutions:
  
  1. Generate goldens on the same OS as CI (Linux):
    flutter test --update-goldens  # run this in a Linux Docker container
  
  2. golden_toolkit package — ensures consistent font loading:
    testWidgets('widget matches golden', (tester) async {
      await loadAppFonts(); // loads fonts consistently
      await tester.pumpWidgetBuilder(MyWidget());
      await screenMatchesGolden(tester, 'my_widget');
    });
  
  3. Tolerance threshold for minor rendering differences:
    await expectLater(find.byType(MyWidget),
      matchesGoldenFile('my_widget.png'));
    // Or custom comparator with 0.1% tolerance
  
  4. Use Alwaysuse... overrides:
    debugDisableShadows = true; // consistent shadow rendering
  
  5. network_image_mock: mock network images to avoid async loading issues.
tags:
  - scenario
  - testing
  - golden-test
  - cicd
---

---
id: SCENARIO_014
category: Real World
subcategory: Performance
difficulty: hard
type: single_choice
question: "Users report the app becomes slow and unresponsive after leaving it running for several hours. DevTools shows continuously growing memory. What is the debugging approach?"
options:
  A: "The device needs more RAM"
  B: "Use DevTools Memory tab to identify retained objects, look for uncancelled subscriptions, undisposed controllers, and Timer callbacks holding widget references"
  C: "Restart the app every 2 hours automatically"
  D: "Clear all caches every 5 minutes"
correct_answer: "B"
explanation: |
  Memory leak debugging workflow:
  
  1. Reproduce the scenario (navigate screens repeatedly, load data)
  2. DevTools → Memory → take snapshot A
  3. Continue using app for 10 minutes
  4. Force GC → take snapshot B
  5. Compare: look for widget/Bloc/Controller instances that should have been disposed
  
  Most common Flutter memory leaks:
  
  StreamSubscription not cancelled:
    // BAD:
    void initState() { _sub = stream.listen(handler); } // never cancelled!
    // FIX:
    void dispose() { _sub.cancel(); super.dispose(); }
  
  AnimationController not disposed:
    void dispose() { _controller.dispose(); super.dispose(); }
  
  Timer not cancelled:
    Timer? _timer;
    void dispose() { _timer?.cancel(); super.dispose(); }
  
  GlobalKey keeping State alive:
    // Don't store GlobalKeys in long-lived objects
  
  Third-party plugin callbacks:
    // Always unregister listeners in dispose()
tags:
  - scenario
  - performance
  - memory-leak
  - devtools
---

---
id: SCENARIO_015
category: Real World
subcategory: Navigation
difficulty: hard
type: single_choice
question: "How do you implement an authentication guard that redirects unauthenticated users to login and preserves the original destination?"
options:
  A: "Check auth state in every screen's initState"
  B: "Use go_router's redirect callback with auth state listening, preserving the original path in the redirect target"
  C: "Use Navigator.pushReplacementNamed to go to login"
  D: "Authentication guards require native code"
correct_answer: "B"
explanation: |
  go_router auth guard with destination preservation:
  
    final router = GoRouter(
      refreshListenable: authNotifier, // re-evaluates redirect when auth changes
      redirect: (context, state) {
        final loggedIn = authNotifier.isLoggedIn;
        final loggingIn = state.matchedLocation == '/login';
        
        if (!loggedIn && !loggingIn) {
          // Preserve original destination as query param
          return '/login?from=${state.uri.toString()}';
        }
        if (loggedIn && loggingIn) {
          // Redirect to original destination after login
          final from = state.uri.queryParameters['from'] ?? '/home';
          return from;
        }
        return null; // no redirect
      },
      routes: [...],
    );
    
    // In LoginScreen after successful auth:
    final from = GoRouterState.of(context).uri.queryParameters['from'] ?? '/home';
    context.go(from);
  
  refreshListenable (ChangeNotifier from auth state) triggers redirect re-evaluation
  whenever auth state changes — handles both login and logout scenarios.
tags:
  - scenario
  - navigation
  - authentication
  - go-router
---

---
id: SCENARIO_016
category: Real World
subcategory: Networking
difficulty: hard
type: single_choice
question: "An API call takes 8 seconds and the user sees a blank screen with just a spinner. How do you improve the UX?"
options:
  A: "Increase the timeout to 30 seconds"
  B: "Show skeleton/shimmer placeholders immediately, use stale-while-revalidate (show cached data first), add cancel capability, and show meaningful progress"
  C: "Reduce the data returned by the API"
  D: "Use a background isolate for the API call"
correct_answer: "B"
explanation: |
  UX improvements for slow loading:
  
  1. Skeleton/shimmer loading:
    BlocBuilder(builder: (_, state) {
      if (state is Loading) return ShimmerList(); // looks like loading content
      if (state is Loaded) return ActualList(state.items);
    })
  
  2. Stale-while-revalidate — show cached immediately:
    Future<void> loadPosts() async {
      final cached = await _cache.getPosts();
      if (cached.isNotEmpty) emit(LoadedState(cached)); // show immediately
      final fresh = await _api.getPosts(); // update in background
      emit(LoadedState(fresh));
    }
  
  3. Cancellable requests with timeout feedback:
    dio.options.receiveTimeout = Duration(seconds: 10);
    // Show "This is taking longer than usual..." after 5 seconds
  
  4. Progressive loading — load first page in 2s, then paginate:
    GET /posts?limit=5 → show immediately
    // Load more on scroll
  
  5. Optimistic updates for writes: show result before server confirms.
tags:
  - scenario
  - ux
  - loading
  - networking
  - caching
---

---
id: SCENARIO_017
category: Real World
subcategory: Firebase
difficulty: hard
type: single_choice
question: "A Firestore query works in development but fails with 'Missing or insufficient permissions' in production. How do you debug and fix this?"
options:
  A: "Set Firestore rules to allow all reads/writes in production"
  B: "Test rules with the Firebase Emulator, use Rules Playground in console, check request.auth state, and ensure the query matches the rule structure"
  C: "The issue is always with the Firestore index — add a composite index"
  D: "Security rules only apply to web apps — Flutter is exempt"
correct_answer: "B"
explanation: |
  Debugging Firestore permission errors:
  
  1. Firebase Console → Firestore → Rules tab → Rules Playground:
     Simulate the exact request with auth token to see which rule fails.
  
  2. Common causes:
     - request.auth is null: user is not authenticated when query runs.
       Fix: ensure await FirebaseAuth.instance.currentUser != null before querying.
  
     - Rule expects specific field: request.auth.uid == resource.data.userId
       but query omits where('userId', isEqualTo: uid) — client can request any doc.
  
     - Missing rule for subcollection:
       match /posts/{postId} { ... } does NOT cover /posts/{postId}/comments/{commentId}
       Add explicit: match /posts/{postId}/comments/{id} { ... }
  
  3. Enable verbose logging in dev:
     FirebaseFirestore.instance.settings = Settings(persistenceEnabled: false);
  
  4. Use Firebase Emulator with rules for local testing:
     firebase emulators:start
tags:
  - scenario
  - firebase
  - firestore
  - security-rules
---

---
id: SCENARIO_018
category: Real World
subcategory: Architecture
difficulty: hard
type: single_choice
question: "You need to implement a 'undo last action' feature for a list (e.g., undo delete item). What is the architecture?"
options:
  A: "Store the deleted item in SharedPreferences"
  B: "Emit an optimistic state update, show SnackBar with undo, reverse the operation if undo is tapped before timeout, or confirm the server deletion if snackbar expires"
  C: "Use a transaction to lock the item until the undo window expires"
  D: "Reload the list from the server on undo"
correct_answer: "B"
explanation: |
  Optimistic delete with undo pattern:
  
  Bloc:
    on<DeleteItemEvent>((event, emit) async {
      final originalItems = state.items;
      
      // 1. Optimistic update: remove immediately from UI
      emit(state.copyWith(items: state.items.where((i) => i.id != event.id).toList()));
      
      // 2. Show SnackBar with undo option (from BlocListener in UI)
      _pendingDelete = event.id;
      _undoTimer = Timer(Duration(seconds: 5), () => _confirmDelete(event.id));
    });
    
    on<UndoDeleteEvent>((event, emit) {
      _undoTimer?.cancel();
      emit(state.copyWith(items: originalItems)); // restore
    });
    
    Future<void> _confirmDelete(String id) async {
      await _repository.deleteItem(id); // actual server delete
    }
  
  UI (BlocListener):
    listener: (context, state) {
      if (state is ItemDeleted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('Item deleted'),
          action: SnackBarAction(label: 'UNDO', onPressed: () => bloc.add(UndoDeleteEvent())),
          duration: Duration(seconds: 5),
        ));
      }
    }
tags:
  - scenario
  - architecture
  - undo
  - optimistic-update
---

---
id: SCENARIO_019
category: Real World
subcategory: DevOps
difficulty: hard
type: single_choice
question: "Your Flutter app's CI build takes 25 minutes. How do you optimize it?"
options:
  A: "Buy a faster CI machine — that's the only option"
  B: "Cache pub packages and Gradle/CocoaPods, run tests in parallel, use incremental builds, skip unnecessary steps for PRs vs releases"
  C: "Remove all tests to speed up the build"
  D: "Run CI only on main branch, not on PRs"
correct_answer: "B"
explanation: |
  CI build time optimization:
  
  1. Cache pub packages (saves 2-3 min):
    - uses: actions/cache@v4
      with:
        path: ~/.pub-cache
        key: ${{ runner.os }}-pub-${{ hashFiles('pubspec.lock') }}
  
  2. Cache Gradle (Android, saves 3-5 min):
    path: ~/.gradle/caches + ~/.gradle/wrapper
  
  3. Cache CocoaPods (iOS, saves 5-10 min):
    path: ios/Pods
    key: ${{ hashFiles('ios/Podfile.lock') }}
  
  4. Parallel jobs: run Android and iOS builds simultaneously.
  
  5. Conditional steps:
    - Run full E2E tests only on main/release branches
    - Unit + widget tests on every PR (fast feedback)
  
  6. Pre-built Flutter: use setup-flutter action with cache.
  
  7. Incremental build: don't clean before every build.
  
  8. Faster machines: GitHub hosted (ubuntu-latest), Codemagic M2 Mac.
tags:
  - scenario
  - devops
  - cicd
  - performance
  - github-actions
---

---
id: SCENARIO_020
category: Real World
subcategory: Architecture
difficulty: hard
type: single_choice
question: "How do you reduce Flutter app size for slow-network markets?"
options:
  A: "App size cannot be reduced without removing features"
  B: "Enable tree shaking, use --split-debug-info, deferred loading for rarely-used features, optimize assets (WebP, compressed SVG), and enable Play Store's Dynamic Delivery"
  C: "Only reduce image resolution"
  D: "App size is determined by Flutter engine size — nothing you can do"
correct_answer: "B"
explanation: |
  Flutter app size reduction strategies:
  
  1. Tree shaking (automatic in release):
    flutter build appbundle --release → removes unused Dart code
  
  2. Split debug info (significantly reduces binary size):
    flutter build appbundle --obfuscate --split-debug-info=./debug-symbols/
  
  3. Deferred loading (on-demand feature modules):
    import 'pdf_viewer.dart' deferred as pdf;
    // Load only when user opens PDF feature:
    await pdf.loadLibrary();
    Removes rarely-used code from initial download.
  
  4. Asset optimization:
    - Convert PNG → WebP (25-34% smaller)
    - Compress images: flutter_image_compress
    - Use SVG for icons (flutter_svg)
    - Remove unused assets
  
  5. Android AAB + Dynamic Delivery:
    Play Store generates device-specific APKs (only matching screen density/ABI/language)
    Typical savings: 15-35% smaller download
  
  6. Remove unused Flutter plugins: check dependency tree.
  
  7. Analyze binary: flutter build appbundle --analyze-size
tags:
  - scenario
  - devops
  - app-size
  - optimization
  - deferred-loading
---
