---
id: TEST_001
category: Testing
subcategory: Unit Testing
difficulty: easy
type: single_choice
question: "What is the AAA pattern in unit testing?"
options:
  A: "Authenticate, Authorize, Audit"
  B: "Arrange (set up), Act (execute), Assert (verify) — the standard structure for readable unit tests"
  C: "Assert, Arrange, Act"
  D: "Async, Await, Assert"
correct_answer: "B"
explanation: |
  AAA pattern structures tests into three clear phases:
  
  Arrange: set up the test data, dependencies, and initial state.
    final mockRepo = MockUserRepository();
    when(() => mockRepo.getUser('123')).thenAnswer((_) async => User(id: '123', name: 'Alice'));
    final useCase = GetUserUseCase(mockRepo);
  
  Act: execute the unit under test.
    final result = await useCase.call('123');
  
  Assert: verify the outcome.
    expect(result, Right(User(id: '123', name: 'Alice')));
    verify(() => mockRepo.getUser('123')).called(1);
  
  This pattern makes tests readable, maintainable, and clearly shows the test intent.
tags:
  - testing
  - unit-test
  - aaa-pattern
---

---
id: TEST_002
category: Testing
subcategory: Mocking
difficulty: easy
type: single_choice
question: "What is the difference between `mocktail` and `mockito` for Flutter unit tests?"
options:
  A: "They are identical packages"
  B: "mockito requires code generation (build_runner) for null-safe Dart; mocktail uses Dart's noSuchMethod without code generation — less setup"
  C: "mocktail is deprecated; use mockito"
  D: "mockito only works with Riverpod; mocktail works with Bloc"
correct_answer: "B"
explanation: |
  mockito (classic):
  - Requires @GenerateMocks([UserRepository]) annotation + build_runner
  - Generates mock classes: MockUserRepository
  - More setup but supports argument matchers with typed verification
  
  mocktail (null-safe, no codegen):
  - Extend Mock and implement the interface — no annotations needed:
    class MockUserRepository extends Mock implements UserRepository {}
  - Uses Dart's noSuchMethod for automatic method stubbing
  - Simpler setup, no build_runner dependency
  
  Both provide:
  - when().thenReturn() / thenAnswer() / thenThrow()
  - verify().called()
  - any() / captureAny() matchers
  
  Recommendation: mocktail for new projects (less friction). mockito if you need
  complex argument matchers or existing codebase already uses it.
tags:
  - testing
  - mocking
  - mocktail
  - mockito
---

---
id: TEST_003
category: Testing
subcategory: Bloc Testing
difficulty: medium
type: single_choice
question: "How do you test a Bloc using the `bloc_test` package?"
code: |
  blocTest<CounterBloc, CounterState>(
    'emits [CounterState(1)] when IncrementEvent is added',
    build: () => CounterBloc(),
    act: (bloc) => bloc.add(IncrementEvent()),
    expect: () => [CounterState(count: 1)],
  );
code_lang: dart
options:
  A: "This syntax is incorrect — use regular unit tests with expect()"
  B: "blocTest sets up the bloc (build), triggers events (act), and asserts the sequence of emitted states (expect)"
  C: "blocTest only works with Cubit, not Bloc"
  D: "expect() takes a single state, not a list"
correct_answer: "B"
explanation: |
  bloc_test provides a structured test helper:
  
  build: () => Bloc — creates a fresh bloc for the test.
  seed: () => InitialState — set initial state before act.
  act: (bloc) => bloc.add(Event) — trigger events.
  expect: () => [State1, State2] — expected ordered list of emitted states.
  verify: (bloc) => ... — additional assertions after test.
  errors: () => [isA<Exception>()] — if you expect the bloc to throw.
  
  whenListen: mocks a stream for StreamProvider in Bloc:
    whenListen(bloc, Stream.fromIterable([LoadedState(data)]));
  
  bloc_test runs the act and collects all emitted states, then compares with expect.
tags:
  - testing
  - bloc-test
  - bloc
  - unit-test
---

---
id: TEST_004
category: Testing
subcategory: Widget Testing
difficulty: medium
type: single_choice
question: "What does `pumpWidget()` do in Flutter widget tests?"
options:
  A: "pumpWidget runs the widget in a real device"
  B: "pumpWidget inflates the widget tree in a test environment, triggering build, layout, and paint — without needing a real device"
  C: "pumpWidget is only for StatelessWidgets"
  D: "pumpWidget automatically triggers all animations"
correct_answer: "B"
explanation: |
  Widget tests run in a virtual widget environment (no physical device needed):
  
    testWidgets('shows counter text', (WidgetTester tester) async {
      await tester.pumpWidget(MaterialApp(home: CounterPage()));
      
      // Find widgets
      expect(find.text('0'), findsOneWidget);
      
      // Tap a button
      await tester.tap(find.byIcon(Icons.add));
      
      // Rebuild (process setState)
      await tester.pump();
      
      expect(find.text('1'), findsOneWidget);
    });
  
  tester.pump() — triggers one frame (processes pending timers, animations one step).
  tester.pumpAndSettle() — pumps until no more frames pending (waits for animations to complete).
  tester.pump(Duration(seconds: 1)) — advance time by 1 second.
tags:
  - testing
  - widget-test
  - pump-widget
---

---
id: TEST_005
category: Testing
subcategory: Widget Testing
difficulty: medium
type: single_choice
question: "What is the difference between `find.byType()`, `find.byKey()`, and `find.text()` in widget tests?"
options:
  A: "They are identical — just different ways to reference the same widgets"
  B: "find.byType(T) finds widgets of type T; find.byKey(key) finds by Key; find.text(str) finds Text widgets containing that string"
  C: "find.byKey() is the only reliable finder — others may match multiple widgets"
  D: "find.text() is deprecated — use find.byText() instead"
correct_answer: "B"
explanation: |
  Flutter widget finders:
  
  find.text('Hello') — finds Text widgets (and descendants) containing 'Hello'.
  find.byType(ElevatedButton) — finds all widgets of that exact type.
  find.byKey(Key('submit_btn')) — finds widget with that specific Key (most reliable).
  find.byIcon(Icons.add) — finds Icon widgets with that icon.
  find.byWidget(myWidget) — finds by instance reference.
  find.ancestor(of: x, matching: y) — finds y that has x as descendant.
  find.descendant(of: x, matching: y) — finds y inside x.
  
  Best practice: use Keys for widgets you need to find in tests:
    ElevatedButton(key: const Key('login_button'), ...)
    find.byKey(const Key('login_button')) — unambiguous
tags:
  - testing
  - widget-test
  - finders
---

---
id: TEST_006
category: Testing
subcategory: Golden Tests
difficulty: hard
type: single_choice
question: "What are golden tests (snapshot tests) and what are their limitations in Flutter?"
options:
  A: "Golden tests test the app's business logic using golden paths (happy paths)"
  B: "Golden tests compare widget screenshots against stored reference images. Limitation: rendering differs slightly between platforms/OS versions — tests can be flaky across environments."
  C: "Golden tests are automated UI tests on real devices"
  D: "Golden tests require Firebase Test Lab"
correct_answer: "B"
explanation: |
  Golden tests (screenshot tests):
    testWidgets('UserCard matches golden', (tester) async {
      await tester.pumpWidget(MaterialApp(home: UserCard(user: mockUser)));
      await expectLater(find.byType(UserCard), matchesGoldenFile('user_card.png'));
    });
  
  First run: creates the .png reference file.
  Subsequent runs: compares against stored file — fails if different.
  
  To update golden files: flutter test --update-goldens
  
  Limitations:
  - Pixel differences between macOS/Linux/Windows CI — tests fail on different OS
  - Font rendering differs between platforms
  - Anti-aliasing varies between environments
  
  Solutions:
  - Use alwaysUseMaterial for consistent text rendering
  - Fix CI to always use the same platform (Linux)
  - Use golden_toolkit package for text loading in tests
  - Use network_image_mock to avoid async image loading issues
tags:
  - testing
  - golden-test
  - snapshot
---

---
id: TEST_007
category: Testing
subcategory: Integration Testing
difficulty: medium
type: single_choice
question: "What is an integration test in Flutter and how does it differ from a widget test?"
options:
  A: "Integration tests are identical to widget tests but with a different package"
  B: "Integration tests run on a real device/emulator, test full app flows including native plugins, network calls, and navigation. Widget tests run in a virtual environment without real hardware."
  C: "Integration tests only test networking — widget tests test UI"
  D: "Integration tests run in CI; widget tests run locally"
correct_answer: "B"
explanation: |
  Widget tests (flutter_test):
  - Virtual environment (no real device)
  - Fast (~milliseconds)
  - Can mock everything (network, platform)
  - No native plugin support
  
  Integration tests (integration_test package):
  - Run on physical device or emulator
  - Full app running (including native code, Firebase, etc.)
  - Slower (~seconds to minutes)
  - Test real user flows: login → navigate → interact → verify
  
  Patrol package (extends integration_test):
  - Handles native system dialogs (permission requests, alerts)
  - Supports notification testing, deep links
  
  Use widget tests for: UI components, state management logic, navigation logic.
  Use integration tests for: critical user flows, regression testing, release validation.
tags:
  - testing
  - integration-test
  - patrol
---

---
id: TEST_008
category: Testing
subcategory: Unit Testing
difficulty: medium
type: single_choice
question: "How do you test a `FutureProvider` or async `Notifier` in Riverpod?"
options:
  A: "Use regular Dart unit tests — Riverpod has no testing utilities"
  B: "Use ProviderContainer in tests to interact with providers without Flutter widgets. Override providers with mock implementations using container.overrideWith()."
  C: "Riverpod providers can only be tested with widget tests"
  D: "Use bloc_test package for Riverpod providers"
correct_answer: "B"
explanation: |
  Riverpod unit testing:
    test('userProvider loads user', () async {
      final mockRepo = MockUserRepository();
      when(() => mockRepo.getUser('123')).thenAnswer((_) async => User(id: '123'));
      
      final container = ProviderContainer(overrides: [
        userRepositoryProvider.overrideWithValue(mockRepo),
      ]);
      addTearDown(container.dispose);
      
      // Read async provider
      final user = await container.read(userProvider('123').future);
      expect(user.id, '123');
      
      // Check loading state
      expect(container.read(userProvider('123')).isLoading, false);
    });
  
  container.overrideWith() replaces the provider implementation.
  addTearDown(container.dispose) prevents provider leaks between tests.
tags:
  - testing
  - riverpod
  - provider-container
  - unit-test
---

---
id: TEST_009
category: Testing
subcategory: Mocking
difficulty: hard
type: single_choice
question: "How do you test a function that depends on `DateTime.now()` — a common source of test flakiness?"
options:
  A: "Tests with DateTime are inherently flaky — accept it"
  B: "Inject a clock abstraction (e.g., a function or Clock class) so tests can pass a fixed time. Never call DateTime.now() directly in business logic."
  C: "Use FakeAsync to freeze time automatically"
  D: "Use @visibleForTesting annotation to override DateTime.now()"
correct_answer: "B"
explanation: |
  Anti-pattern:
    class SessionManager {
      bool get isExpired => DateTime.now().isAfter(expiresAt); // not testable
    }
  
  Testable with injected clock:
    typedef Clock = DateTime Function();
    
    class SessionManager {
      final Clock _clock;
      SessionManager({Clock? clock}) : _clock = clock ?? DateTime.now;
      
      bool get isExpired => _clock().isAfter(expiresAt);
    }
    
    // Test:
    final session = SessionManager(clock: () => DateTime(2024, 1, 1));
    expect(session.isExpired, false);
  
  fake_async package: virtualizes time for async tests:
    fakeAsync((fake) {
      fake.elapse(Duration(hours: 2));
      expect(session.isExpired, true);
    });
tags:
  - testing
  - mocking
  - datetime
  - fake-async
---

---
id: TEST_010
category: Testing
subcategory: Widget Testing
difficulty: hard
type: single_choice
question: "How do you test a widget that uses `BuildContext` to show a `SnackBar` or navigate?"
options:
  A: "Context-dependent actions cannot be tested in widget tests"
  B: "Wrap in MaterialApp (provides Navigator and ScaffoldMessenger), use find/expect to verify navigation or snackbar appearance"
  C: "Use a real device for all navigation tests"
  D: "Mock BuildContext with a MockContext class"
correct_answer: "B"
explanation: |
  Testing navigation:
    testWidgets('navigates to detail on tap', (tester) async {
      await tester.pumpWidget(MaterialApp(
        home: ProductList(),
        routes: {'/detail': (_) => DetailPage()},
      ));
      
      await tester.tap(find.byKey(Key('product_0')));
      await tester.pumpAndSettle(); // wait for navigation animation
      
      expect(find.byType(DetailPage), findsOneWidget);
    });
  
  Testing SnackBar:
    testWidgets('shows error snackbar on failure', (tester) async {
      await tester.pumpWidget(MaterialApp(home: LoginPage()));
      
      await tester.tap(find.byKey(Key('login_btn')));
      await tester.pump(); // trigger setState/rebuild
      
      expect(find.byType(SnackBar), findsOneWidget);
      expect(find.text('Invalid credentials'), findsOneWidget);
    });
  
  Always use MaterialApp wrapper — provides Scaffold, Navigator, MediaQuery.
tags:
  - testing
  - widget-test
  - navigation
  - snackbar
---
