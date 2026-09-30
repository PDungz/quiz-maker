---
id: DART001
category: Dart
subcategory: OOP
difficulty: easy
type: single_choice
question: "What is the difference between `abstract class` and `interface` in Dart?"
options:
  A: "Dart has a dedicated `interface` keyword like Java"
  B: "Abstract classes can have method implementations; Dart uses `implements` on any class as an interface"
  C: "Interfaces are faster than abstract classes at runtime"
  D: "Abstract classes cannot have constructors"
correct_answer: "B"
explanation: |
  Dart does NOT have a separate `interface` keyword.
  Any class can be used as an interface with `implements`.
  Abstract classes can have concrete methods and constructors.
  When you `implement` a class, you must override ALL its members.
tags:
  - dart
  - oop
  - abstract
---

---
id: DART002
category: Dart
subcategory: Async
difficulty: medium
type: single_choice
question: "What is the output of the following code?\n\nvoid main() async {\n  print('A');\n  await Future.delayed(Duration.zero);\n  print('B');\n  print('C');\n}"
options:
  A: "A B C"
  B: "A C B"
  C: "B A C"
  D: "Compilation error"
correct_answer: "A"
explanation: |
  Output is: A then B then C (on separate ticks).
  `await Future.delayed(Duration.zero)` yields control to the event loop
  but B and C still run in order after the await resumes.
  Final output: A, B, C
tags:
  - dart
  - async
  - future
---

---
id: DART003
category: Dart
subcategory: Null Safety
difficulty: medium
type: single_choice
question: "Which operator should you use when you want to provide a default value if a nullable expression is null?"
options:
  A: "?."
  B: "??"
  C: "!"
  D: "?="
correct_answer: "B"
explanation: |
  `??` is the null-coalescing operator.
  Example: `String name = nullableName ?? 'default';`
  `?.` is null-aware access (returns null if left side is null).
  `!` is the null assertion (throws if null).
tags:
  - dart
  - null-safety
---

---
id: DART004
category: Dart
subcategory: Generics
difficulty: hard
type: single_choice
question: "What does `covariant` keyword do in Dart?"
options:
  A: "Marks a parameter as optional"
  B: "Allows a subclass to override a method with a more specific (narrower) parameter type"
  C: "Makes a class generic"
  D: "Enables compile-time constant evaluation"
correct_answer: "B"
explanation: |
  `covariant` relaxes Dart's type system to allow overriding a method
  with a parameter type that is a subtype of the original.
  
  Example:
    class Animal { void feed(covariant Animal food) {} }
    class Cat extends Animal { void feed(Cat food) {} } // OK with covariant
  
  Without covariant, narrowing the parameter type is a compile error.
tags:
  - dart
  - generics
  - type-system
---

---
id: DART005
category: Dart
subcategory: Isolates
difficulty: hard
type: single_choice
question: "Why can't Dart isolates share memory directly?"
options:
  A: "Dart has no garbage collector"
  B: "Each isolate has its own heap; communication happens via message passing to avoid race conditions"
  C: "Isolates run on different machines"
  D: "It's a VM limitation that will be removed in Dart 4"
correct_answer: "B"
explanation: |
  Dart's concurrency model uses isolates with separate heaps.
  This eliminates data races at the language level since no shared mutable state exists.
  Isolates communicate via SendPort/ReceivePort using message passing.
  Only primitive types and transferable objects can be sent between isolates.
tags:
  - dart
  - isolates
  - concurrency
---

---
id: FLUTTER001
category: Flutter
subcategory: Widget Tree
difficulty: easy
type: single_choice
question: "What are the THREE trees in Flutter's rendering pipeline?"
options:
  A: "Widget tree, Component tree, Layout tree"
  B: "Widget tree, Element tree, RenderObject tree"
  C: "UI tree, State tree, Paint tree"
  D: "Widget tree, Context tree, Render tree"
correct_answer: "B"
explanation: |
  Flutter maintains three synchronized trees:
  1. Widget tree — immutable descriptions of the UI (blueprints)
  2. Element tree — mutable instances that link widgets to render objects (lifecycle managers)
  3. RenderObject tree — handles layout, painting, and hit testing
  
  Widgets are recreated frequently; Elements and RenderObjects are reused when possible.
tags:
  - flutter
  - internals
  - widget-tree
---

---
id: FLUTTER002
category: Flutter
subcategory: Keys
difficulty: medium
type: single_choice
question: "When should you use a `GlobalKey` vs a `ValueKey` in Flutter?"
options:
  A: "GlobalKey for animations, ValueKey for lists"
  B: "GlobalKey to access state/context from outside the widget; ValueKey to preserve state when reordering items"
  C: "They are interchangeable"
  D: "ValueKey is deprecated in Flutter 3.x"
correct_answer: "B"
explanation: |
  GlobalKey — gives you access to a widget's State, BuildContext, or RenderBox from anywhere.
  Use sparingly; creates a global registry entry.
  
  ValueKey(value) — used to identify widgets in lists/columns so Flutter can match
  elements correctly when items are reordered or inserted.
  
  Also: UniqueKey() creates a new key every build (forces recreation).
  ObjectKey() uses object identity instead of equality.
tags:
  - flutter
  - keys
  - state
---

---
id: FLUTTER003
category: Flutter
subcategory: Lifecycle
difficulty: medium
type: single_choice
question: "Which `State` lifecycle method is called exactly once and is the right place to initialize controllers and subscriptions?"
options:
  A: "build()"
  B: "didChangeDependencies()"
  C: "initState()"
  D: "didUpdateWidget()"
correct_answer: "C"
explanation: |
  `initState()` is called once when the State object is inserted into the tree.
  Ideal for: initializing AnimationController, TextEditingController, streams, listeners.
  
  `build()` can be called many times — never put expensive initialization there.
  `didChangeDependencies()` is called after initState AND when inherited widgets change.
  `didUpdateWidget()` is called when the parent rebuilds with a new widget config.
tags:
  - flutter
  - lifecycle
  - state
---

---
id: FLUTTER004
category: Flutter
subcategory: Layout
difficulty: hard
type: single_choice
question: "What is the Flutter layout constraint rule?"
options:
  A: "Children propose sizes; parents accept or reject"
  B: "Parents pass tight constraints down; children lay out within those constraints and report their size up"
  C: "All widgets have a fixed size defined at compile time"
  D: "Constraints flow up from leaf widgets to root"
correct_answer: "B"
explanation: |
  Flutter's layout protocol: "Constraints go down, sizes go up, parent sets position."
  
  1. Parent passes BoxConstraints (minW, maxW, minH, maxH) to child
  2. Child lays out within those constraints and returns its size
  3. Parent positions the child
  
  Tight constraint: minWidth == maxWidth (child has no choice)
  Loose constraint: minWidth == 0 (child can be any size up to max)
tags:
  - flutter
  - layout
  - constraints
---

---
id: FLUTTER005
category: Flutter
subcategory: Performance
difficulty: hard
type: single_choice
question: "What does `RepaintBoundary` do and when should you use it?"
options:
  A: "Clips child widgets to a rectangular boundary"
  B: "Creates a separate compositing layer, preventing parent repaints from triggering child repaints"
  C: "Marks a widget as semantically important for accessibility"
  D: "Forces a widget to rebuild on every frame"
correct_answer: "B"
explanation: |
  RepaintBoundary creates a new layer in the compositing tree.
  When something in the parent repaints, the child layer is composited from cache
  rather than repainted from scratch.
  
  Use it when:
  - A child animates independently (e.g., loading spinner)
  - A complex static subtree is surrounded by frequently-changing UI
  
  Overuse increases memory (each layer = GPU texture). Use DevTools to identify hot spots.
tags:
  - flutter
  - performance
  - rendering
---

---
id: STATE001
category: State Management
subcategory: Bloc
difficulty: medium
type: single_choice
question: "What is the difference between `Bloc` and `Cubit` in the bloc package?"
options:
  A: "Cubit is faster; Bloc uses more memory"
  B: "Bloc uses Events to trigger state changes; Cubit exposes methods directly — Cubit is a simplified Bloc"
  C: "Bloc supports streams; Cubit does not"
  D: "They are identical — Cubit is just an alias"
correct_answer: "B"
explanation: |
  Cubit: simpler — you call methods directly to emit new states.
    cubit.increment() → emits CounterState(1)
  
  Bloc: event-driven — you add Events, and mapEventToState (or on<Event>) handles them.
    bloc.add(IncrementEvent()) → handler emits CounterState(1)
  
  Bloc provides better traceability (each state transition has an event log).
  Cubit has less boilerplate and is preferred for simple cases.
tags:
  - state-management
  - bloc
  - cubit
---

---
id: STATE002
category: State Management
subcategory: Bloc
difficulty: hard
type: single_choice
question: "What does `bloc_concurrency` package's `droppable()` transformer do?"
options:
  A: "Queues all events and processes them one by one"
  B: "Cancels the current event handler when a new event arrives"
  C: "Ignores new events while an event is being processed"
  D: "Restarts the handler with the latest event (debounce)"
correct_answer: "C"
explanation: |
  `droppable()` — ignores new events while one is already being processed.
  
  Use case: prevent duplicate API calls on rapid button taps.
  on<SearchEvent>(_onSearch, transformer: droppable())
  
  Compare:
  - sequential() — queues events (default)
  - concurrent() — processes all events simultaneously
  - droppable() — drops new events while busy
  - restartable() — cancels current and starts fresh with new event
tags:
  - state-management
  - bloc
  - concurrency
---

---
id: FB001
category: Firebase
subcategory: Cloud Messaging
difficulty: medium
type: single_choice
question: "What are the three app states that affect how FCM notifications are handled on mobile?"
options:
  A: "Active, Inactive, Background"
  B: "Foreground, Background, Terminated"
  C: "Running, Paused, Stopped"
  D: "Online, Offline, Doze"
correct_answer: "B"
explanation: |
  FCM handles notifications differently per state:
  
  Foreground: FirebaseMessaging.onMessage stream fires. You must show the notification manually.
  
  Background: System shows notification automatically (notification payload).
    FirebaseMessaging.onBackgroundMessage fires for data-only messages.
  
  Terminated: System shows notification. App launches when user taps.
    Use getInitialMessage() to retrieve the notification that launched the app.
tags:
  - firebase
  - fcm
  - push-notification
---

---
id: FB002
category: Firebase
subcategory: Cloud Messaging
difficulty: hard
type: single_choice
question: "What happens to FCM messages when an Android app is in terminated state?"
options:
  A: "Foreground handlers still receive the message"
  B: "FirebaseMessaging.onMessage always works"
  C: "Notification messages are shown by the OS; data-only messages may be delivered when app restarts"
  D: "FCM stops working completely when app is killed"
correct_answer: "C"
explanation: |
  When the app is terminated:
  - Notification payload: The OS (FCM system tray) handles display. User tapping launches the app.
  - Data-only payload: NOT guaranteed to wake app on Android (due to Doze mode / battery optimization).
  
  To handle terminated state tap: use FirebaseMessaging.instance.getInitialMessage()
  in main() or initState() to check for a pending notification.
  
  On iOS, VoIP pushes via PushKit can wake a terminated app — regular FCM cannot.
tags:
  - firebase
  - fcm
  - android
  - terminated-state
---

---
id: FB003
category: Firebase
subcategory: Cloud Messaging
difficulty: hard
type: single_choice
question: "How do you handle FCM background messages in Flutter on Android?"
options:
  A: "Register a listener in initState()"
  B: "Use FirebaseMessaging.onBackgroundMessage() with a top-level function annotated with @pragma('vm:entry-point')"
  C: "Override onMessageReceived in MainActivity.kt"
  D: "Set background: true in the FCM payload"
correct_answer: "B"
explanation: |
  Background message handler must be:
  1. A TOP-LEVEL function (not a class method or closure)
  2. Annotated with @pragma('vm:entry-point') so the Dart compiler doesn't tree-shake it
  
  Example:
    @pragma('vm:entry-point')
    Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
      await Firebase.initializeApp();
      // handle message
    }
    
    void main() {
      FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
      runApp(MyApp());
    }
tags:
  - firebase
  - fcm
  - background
  - android
---

---
id: FB004
category: Firebase
subcategory: Firestore
difficulty: medium
type: single_choice
question: "What is the difference between `get()` and `snapshots()` in Firestore Flutter SDK?"
options:
  A: "get() is for documents; snapshots() is for collections only"
  B: "get() returns a Future (one-time fetch); snapshots() returns a Stream (real-time updates)"
  C: "snapshots() is deprecated in favor of get(listen: true)"
  D: "They are identical in behavior"
correct_answer: "B"
explanation: |
  get() — one-time read, returns Future<DocumentSnapshot>
    Use when: you just need data once (profile load, initial fetch)
  
  snapshots() — real-time listener, returns Stream<DocumentSnapshot>
    Use when: you need live updates (chat, collaborative editing, dashboards)
  
  Always cancel snapshot subscriptions (StreamSubscription.cancel()) in dispose()
  to avoid memory leaks and unnecessary reads (which cost money!).
tags:
  - firebase
  - firestore
  - streams
---

---
id: FB005
category: Firebase
subcategory: Security Rules
difficulty: hard
type: single_choice
question: "What does this Firestore Security Rule do?\n\nmatch /users/{userId} {\n  allow read, write: if request.auth.uid == userId;\n}"
options:
  A: "Allows any authenticated user to read/write all user documents"
  B: "Allows only the document owner (whose UID matches the document ID) to read and write their own document"
  C: "Allows admin users to read all documents"
  D: "Blocks all access unless the user is an admin"
correct_answer: "B"
explanation: |
  `request.auth.uid` — the UID of the currently authenticated user making the request.
  `userId` — the wildcard from the document path /users/{userId}.
  
  This rule ensures each user can ONLY read/write their own document.
  If Alice (uid: "alice123") tries to read /users/bob456, request.auth.uid != userId → denied.
  
  Best practice: always scope rules to the authenticated user's UID.
tags:
  - firebase
  - security-rules
  - firestore
---

---
id: NET001
category: Networking
subcategory: Dio
difficulty: medium
type: single_choice
question: "What is the purpose of a Dio interceptor in Flutter?"
options:
  A: "To parse JSON automatically"
  B: "To intercept requests/responses for logging, auth token injection, retry logic, or error transformation"
  C: "To cache responses on disk"
  D: "To convert Dio to http package format"
correct_answer: "B"
explanation: |
  Dio interceptors hook into the request/response cycle:
  
  onRequest — modify headers before sending (e.g., add Authorization: Bearer token)
  onResponse — transform or log response data
  onError — handle errors, retry on 401, refresh tokens
  
  Example use: token refresh interceptor
    On 401 → call refresh endpoint → update token → retry original request
  
  Multiple interceptors can be chained via dio.interceptors.add(...)
tags:
  - networking
  - dio
  - interceptors
---

---
id: NET002
category: Networking
subcategory: Security
difficulty: hard
type: single_choice
question: "What is SSL/Certificate Pinning and why is it used in mobile apps?"
options:
  A: "Encrypting the app's source code before publishing"
  B: "Binding the app to a specific server certificate or public key to prevent MITM attacks even with a trusted CA"
  C: "Requiring users to accept SSL certificates manually"
  D: "Using only TLS 1.3 connections"
correct_answer: "B"
explanation: |
  Without pinning: if an attacker installs a rogue CA cert on the device,
  they can intercept HTTPS traffic (man-in-the-middle).
  
  With pinning: the app validates the server's certificate/public key against
  a hardcoded value. Even a valid-CA-signed cert is rejected if it doesn't match.
  
  In Flutter with Dio:
    (dio.httpClientAdapter as IOHttpClientAdapter).createHttpClient = () {
      final client = HttpClient();
      client.badCertificateCallback = (cert, host, port) {
        return cert.pem == expectedPem; // pin check
      };
      return client;
    };
  
  Downside: app must be updated when certificate rotates.
tags:
  - networking
  - security
  - ssl-pinning
---

---
id: ARCH001
category: Architecture
subcategory: Clean Architecture
difficulty: medium
type: single_choice
question: "In Clean Architecture, what is the role of a Use Case (Interactor)?"
options:
  A: "Directly calls the database"
  B: "Contains a single piece of business logic and orchestrates data flow between repository and presentation"
  C: "Holds UI state"
  D: "Maps JSON to model objects"
correct_answer: "B"
explanation: |
  Use Cases (also called Interactors) encapsulate one business rule.
  
  They:
  - Depend on Repository interfaces (not implementations) — DIP
  - Are called from the presentation layer (Bloc/ViewModel)
  - Return Either<Failure, Result> or emit streams
  - Know nothing about UI or database implementation details
  
  Example: GetUserProfileUseCase calls UserRepository.getProfile(userId)
  
  Benefits: testable in isolation, single responsibility, swappable infrastructure.
tags:
  - architecture
  - clean-architecture
  - use-case
---

---
id: PERF001
category: Performance
subcategory: Optimization
difficulty: medium
type: multiple_choice
question: "Which of the following are valid techniques to reduce unnecessary widget rebuilds in Flutter? (Select ALL that apply)"
options:
  A: "Using `const` constructors for widgets with static content"
  B: "Splitting large widgets into smaller focused widgets"
  C: "Using `RepaintBoundary` around frequently-animated subtrees"
  D: "Always using `setState` at the root widget"
correct_answer: "A,B,C"
explanation: |
  A — `const` widgets are canonicalized; Flutter skips rebuilding them entirely.
  
  B — Smaller widgets mean finer-grained rebuild scope. If state is local to a small widget,
      only that widget rebuilds instead of a large parent.
  
  C — RepaintBoundary isolates the paint phase for animated children.
  
  D — Calling setState at the root rebuilds the ENTIRE tree — the worst approach.
      Always call setState as low in the tree as possible.
tags:
  - flutter
  - performance
  - optimization
---

---
id: SEC001
category: Security
subcategory: Storage
difficulty: medium
type: single_choice
question: "Why should you NOT store sensitive data (tokens, passwords) in SharedPreferences?"
options:
  A: "SharedPreferences is too slow for token storage"
  B: "SharedPreferences stores data as plain text in an unencrypted XML/key-value file accessible to rooted devices or backup tools"
  C: "SharedPreferences doesn't support string values"
  D: "It causes memory leaks on Android"
correct_answer: "B"
explanation: |
  SharedPreferences on Android stores data in plain XML files.
  On a rooted device or via ADB backup, this data is trivially readable.
  
  For sensitive data use:
  - flutter_secure_storage — uses Android Keystore / iOS Keychain (hardware-backed encryption)
  - Keychain Services (iOS) / Android Keystore System directly
  
  Never store: JWT tokens, API keys, passwords, PII in SharedPreferences.
tags:
  - security
  - storage
  - flutter
---

---
id: TEST001
category: Testing
subcategory: Unit Testing
difficulty: easy
type: single_choice
question: "What is the purpose of `mocktail` (or `mockito`) in Flutter unit tests?"
options:
  A: "To generate UI screenshots for golden tests"
  B: "To create fake implementations of dependencies so you can test classes in isolation"
  C: "To run integration tests on real devices"
  D: "To measure code coverage"
correct_answer: "B"
explanation: |
  Mocking libraries let you replace real dependencies with controllable fakes.
  
  Example with mocktail:
    class MockUserRepository extends Mock implements UserRepository {}
    
    when(() => mockRepo.getUser('123')).thenAnswer((_) async => User(id: '123'));
  
  This lets you test a Bloc/UseCase without hitting a real database or network.
  
  mocktail is preferred over mockito in null-safe Dart because it doesn't require
  code generation for basic mocks.
tags:
  - testing
  - mocking
  - unit-test
---

---
id: NATIVE001
category: Native Integration
subcategory: Platform Channels
difficulty: hard
type: single_choice
question: "What is the difference between MethodChannel and EventChannel in Flutter?"
options:
  A: "MethodChannel is for iOS; EventChannel is for Android"
  B: "MethodChannel handles request-response calls; EventChannel handles continuous streams of data from native"
  C: "EventChannel is deprecated; use MethodChannel with callbacks instead"
  D: "They are identical but EventChannel is faster"
correct_answer: "B"
explanation: |
  MethodChannel — bidirectional RPC-style:
    Flutter calls native method → native returns one result
    Use for: camera capture, biometrics, battery level (one-shot)
  
  EventChannel — streaming from native to Flutter:
    Native pushes events continuously → Flutter listens via Stream
    Use for: accelerometer, location updates, BLE scan results, step counter
  
  Pigeon is a type-safe code generator for MethodChannels that eliminates
  string-based method names and manual type casting.
tags:
  - native
  - platform-channel
  - method-channel
  - event-channel
---
