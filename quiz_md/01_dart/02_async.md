---
id: DART_ASYNC_001
category: Dart
subcategory: Async
difficulty: easy
type: single_choice
question: "What keyword makes a function asynchronous and allows using `await` inside it?"
options:
  A: "future"
  B: "async"
  C: "await"
  D: "defer"
correct_answer: "B"
explanation: |
  `async` marks a function as asynchronous. Inside an async function you can use `await`
  to pause execution until a Future completes without blocking the thread.
  The return type automatically becomes Future<T> where T is the declared return type.
  Example: Future<String> fetchData() async { return await http.get(url); }
tags:
  - dart
  - async
  - future
---

---
id: DART_ASYNC_002
category: Dart
subcategory: Async
difficulty: easy
type: single_choice
question: "What is the output of the following code?"
code: |
  void main() async {
    print('1');
    Future(() => print('2'));
    print('3');
  }
code_lang: dart
options:
  A: "1 2 3"
  B: "1 3 2"
  C: "2 1 3"
  D: "1 3 (2 never prints)"
correct_answer: "B"
explanation: |
  `Future(() => print('2'))` schedules a microtask/task but does NOT await it.
  Execution continues synchronously: print('1'), schedule Future, print('3').
  After main() completes, the event loop picks up the Future and prints '2'.
  Output: 1, 3, 2
tags:
  - dart
  - async
  - event-loop
---

---
id: DART_ASYNC_003
category: Dart
subcategory: Async
difficulty: medium
type: single_choice
question: "What is the difference between `Future.microtask` and `Future.delayed(Duration.zero)`?"
options:
  A: "They are identical in behavior"
  B: "microtask runs before other event queue tasks; Future.delayed(Duration.zero) is put on the event queue"
  C: "Future.delayed(Duration.zero) runs synchronously"
  D: "microtask blocks the UI thread"
correct_answer: "B"
explanation: |
  Dart has two queues: the microtask queue and the event queue.
  Microtasks (scheduleMicrotask, Future.microtask) run before the next event queue item.
  Future.delayed(Duration.zero) posts to the event queue, so it runs after all microtasks.
  
  Order: sync code → microtask queue → event queue
  
  Use microtask when you need to run something before the next I/O event.
tags:
  - dart
  - async
  - microtask
  - event-loop
---

---
id: DART_ASYNC_004
category: Dart
subcategory: Async
difficulty: medium
type: single_choice
question: "What does `Future.wait([f1, f2, f3])` do?"
options:
  A: "Runs futures sequentially, one after another"
  B: "Runs all futures concurrently and returns when ALL complete, or throws if any fails"
  C: "Returns as soon as the first future completes"
  D: "Cancels remaining futures if one fails"
correct_answer: "B"
explanation: |
  Future.wait() starts all futures concurrently (not sequentially) and returns a
  Future<List<T>> that completes when ALL futures complete.
  If any future throws, the returned future completes with that error.
  
  For parallel execution of independent async tasks:
    final results = await Future.wait([fetchUser(), fetchPosts(), fetchConfig()]);
  
  Compare: Future.any() returns when the FIRST future completes.
tags:
  - dart
  - async
  - future
  - concurrency
---

---
id: DART_ASYNC_005
category: Dart
subcategory: Stream
difficulty: medium
type: single_choice
question: "What is the difference between a single-subscription Stream and a broadcast Stream?"
options:
  A: "Broadcast streams are faster; single-subscription streams buffer data"
  B: "Single-subscription allows only one listener and buffers events; broadcast allows multiple listeners but drops events if none are listening"
  C: "Single-subscription is for network; broadcast is for UI"
  D: "There is no practical difference"
correct_answer: "B"
explanation: |
  Single-subscription stream:
  - Only ONE listener allowed at a time
  - Buffers events until a listener subscribes
  - Can be paused/resumed
  - Default from async* generators and StreamController()
  
  Broadcast stream (StreamController.broadcast()):
  - Multiple simultaneous listeners
  - Events are NOT buffered — listeners miss events if not yet subscribed
  - Cannot be paused
  
  Use broadcast for UI events (clicks, state changes). Use single-subscription for file I/O, HTTP.
tags:
  - dart
  - stream
  - broadcast
---

---
id: DART_ASYNC_006
category: Dart
subcategory: Stream
difficulty: medium
type: single_choice
question: "What does `await for` do in Dart?"
code: |
  Stream<int> count() async* {
    for (int i = 0; i < 3; i++) {
      yield i;
    }
  }
  
  void main() async {
    await for (final n in count()) {
      print(n);
    }
    print('done');
  }
code_lang: dart
options:
  A: "Prints: done 0 1 2"
  B: "Prints: 0 1 2 done"
  C: "Throws a compile error"
  D: "Prints: 0 1 2 (done never prints)"
correct_answer: "B"
explanation: |
  `await for` iterates over a Stream, waiting for each event before processing it.
  It suspends the loop body between events but blocks until the stream closes.
  Output: 0, 1, 2, then done — because `await for` completes when the stream closes.
  
  `async*` creates an asynchronous generator. `yield` emits values one at a time.
  `yield*` delegates to another iterable/stream.
tags:
  - dart
  - stream
  - async-generator
---

---
id: DART_ASYNC_007
category: Dart
subcategory: Isolate
difficulty: hard
type: single_choice
question: "What is the recommended way to run a CPU-intensive task without blocking the UI in Flutter?"
options:
  A: "Use a Timer with short intervals to break up the work"
  B: "Use `compute()` or `Isolate.spawn()` to run the task in a separate isolate"
  C: "Use `Future.delayed(Duration.zero)` to defer the work"
  D: "Use `async/await` — it automatically moves work off the main thread"
correct_answer: "B"
explanation: |
  async/await does NOT move CPU work off the main thread — it only frees the thread
  while waiting for I/O. CPU-bound tasks (JSON parsing, image processing, encryption)
  still block the UI thread if run with async/await.
  
  Solutions:
  - compute(function, arg) — Flutter's shortcut, spawns an isolate, returns result
  - Isolate.spawn() — more control, bidirectional communication via SendPort/ReceivePort
  
  Example: compute(parseJson, jsonString) runs parseJson in a separate isolate.
tags:
  - dart
  - isolate
  - compute
  - performance
---

---
id: DART_ASYNC_008
category: Dart
subcategory: Isolate
difficulty: hard
type: single_choice
question: "How do two Dart isolates communicate with each other?"
options:
  A: "Via shared global variables"
  B: "Via SendPort and ReceivePort — message passing with copies of data"
  C: "Via a shared database"
  D: "Via HTTP requests between isolates"
correct_answer: "B"
explanation: |
  Isolates have separate heaps — no shared memory. Communication is via message passing:
  
  1. Create a ReceivePort in the spawning isolate
  2. Pass its sendPort to the child isolate via Isolate.spawn()
  3. Child sends messages via sendPort.send(data)
  4. Parent listens via receivePort.listen(...)
  
  Only serializable data can be sent: primitives, List, Map, SendPort, TransferableTypedData.
  Objects are COPIED, not shared. This prevents race conditions by design.
tags:
  - dart
  - isolate
  - sendport
  - receiveport
---

---
id: DART_ASYNC_009
category: Dart
subcategory: Stream
difficulty: hard
type: single_choice
question: "What happens if you forget to cancel a StreamSubscription in a StatefulWidget's dispose()?"
options:
  A: "The app crashes immediately"
  B: "Nothing — Dart's garbage collector handles it"
  C: "Memory leak: the subscription holds a reference keeping objects alive, and callbacks may fire on a disposed widget"
  D: "The stream automatically cancels when the widget is removed"
correct_answer: "C"
explanation: |
  A StreamSubscription keeps a strong reference to the stream and its callback.
  If not cancelled, it prevents garbage collection of related objects (memory leak).
  Worse, the callback may fire after the widget is disposed — calling setState() on
  a disposed State crashes with "setState() called after dispose()".
  
  Always cancel in dispose():
    StreamSubscription? _sub;
    @override
    void initState() { _sub = stream.listen(handler); }
    @override
    void dispose() { _sub?.cancel(); super.dispose(); }
tags:
  - dart
  - stream
  - memory-leak
  - dispose
---

---
id: DART_ASYNC_010
category: Dart
subcategory: Async
difficulty: medium
type: single_choice
question: "What does `StreamController.sink` provide?"
options:
  A: "A way to read events from the stream"
  B: "A way to add events into the stream from outside"
  C: "A way to transform stream events"
  D: "A subscription handle for cancelling the stream"
correct_answer: "B"
explanation: |
  StreamController has two sides:
  - controller.stream — the Stream that listeners subscribe to
  - controller.sink (or controller.add/addError/close) — the input side for adding events
  
  Pattern:
    final _controller = StreamController<int>();
    _controller.sink.add(42);      // push event in
    _controller.stream.listen(...); // listen on output
  
  Always call controller.close() in dispose() to avoid memory leaks.
tags:
  - dart
  - stream
  - streamcontroller
---

---
id: DART_ASYNC_011
category: Dart
subcategory: Async
difficulty: medium
type: multiple_choice
question: "Which of the following statements about `async/await` in Dart are TRUE? (Select ALL that apply)"
options:
  A: "An async function always returns a Future"
  B: "await can only be used inside an async function"
  C: "await blocks the entire thread until the Future completes"
  D: "You can use try/catch with await to handle Future errors"
correct_answer: "A,B,D"
explanation: |
  A — TRUE: async functions always return Future<T> (or Future<void>).
  B — TRUE: await is only valid inside an async function/method.
  C — FALSE: await suspends the current async function and yields control to the event loop.
       The thread is NOT blocked — other tasks can run while waiting.
  D — TRUE: try/catch works normally with await:
       try { final data = await fetchData(); } catch (e) { handleError(e); }
tags:
  - dart
  - async
  - await
---

---
id: DART_ASYNC_012
category: Dart
subcategory: Stream
difficulty: hard
type: single_choice
question: "What does `StreamTransformer` do and when would you use it?"
options:
  A: "Converts a Stream to a Future"
  B: "Applies a reusable transformation pipeline to a stream — map, filter, debounce — without modifying the source"
  C: "Merges multiple streams into one"
  D: "Converts a broadcast stream to a single-subscription stream"
correct_answer: "B"
explanation: |
  StreamTransformer<S, T> wraps a stream and applies transformations to its events.
  
  Example — debounce transformer:
    stream.transform(debounceTransformer(Duration(milliseconds: 300)))
  
  Built-in stream methods (map, where, expand, asyncMap) internally use StreamTransformer.
  Custom transformers are useful for reusable logic like:
  - Rate limiting / debouncing
  - Error recovery
  - Protocol parsing (bytes → messages)
  
  RxDart provides many ready-made transformers (debounceTime, throttleTime, switchMap).
tags:
  - dart
  - stream
  - transformer
---

---
id: DART_ASYNC_013
category: Dart
subcategory: Async
difficulty: hard
type: single_choice
question: "What is a Dart Zone and why would you use `runZonedGuarded`?"
options:
  A: "A Zone is a thread; runZonedGuarded creates a new thread"
  B: "A Zone is an execution context that can intercept async operations; runZonedGuarded catches uncaught errors in async code"
  C: "A Zone isolates memory between isolates"
  D: "runZonedGuarded is deprecated — use try/catch instead"
correct_answer: "B"
explanation: |
  Zones wrap execution contexts and can intercept:
  - Uncaught errors (onError)
  - Timer creation
  - scheduleMicrotask
  - print calls
  
  runZonedGuarded catches errors thrown in async callbacks that escape try/catch:
    runZonedGuarded(() {
      runApp(MyApp());
    }, (error, stack) {
      FirebaseCrashlytics.instance.recordError(error, stack);
    });
  
  This is how Flutter's main.dart catches all unhandled async errors and reports to Crashlytics.
tags:
  - dart
  - zones
  - error-handling
  - crashlytics
---

---
id: DART_ASYNC_014
category: Dart
subcategory: Async
difficulty: medium
type: single_choice
question: "What is the difference between `Future.value(x)` and `Future(() => x)`?"
options:
  A: "They are identical"
  B: "Future.value(x) completes synchronously in the microtask queue; Future(() => x) schedules on the event queue"
  C: "Future(() => x) is faster"
  D: "Future.value() can only be used with primitive types"
correct_answer: "B"
explanation: |
  Future.value(x) — creates an already-completed Future. Its then() callbacks are
  scheduled as microtasks (run before event queue tasks).
  
  Future(() => x) — schedules the function on the event queue, so it runs after
  all currently pending microtasks and before the next I/O event.
  
  This distinction matters for ordering guarantees in tests and complex async chains.
tags:
  - dart
  - async
  - future
  - microtask
---

---
id: DART_ASYNC_015
category: Dart
subcategory: Async
difficulty: hard
type: single_choice
question: "What problem does the following code have?"
code: |
  Future<void> loadData() async {
    final result = await api.fetchUser();
    if (result != null) {
      setState(() => user = result);
    }
  }
  
  @override
  void initState() {
    super.initState();
    loadData();
  }
code_lang: dart
options:
  A: "fetchUser() is never called"
  B: "setState() may be called after the widget is disposed if the user navigates away before the Future completes"
  C: "initState() cannot call async functions"
  D: "The Future is not awaited so it runs synchronously"
correct_answer: "B"
explanation: |
  If the user navigates away before fetchUser() completes, the State is disposed.
  When the Future completes, setState() is called on a disposed State → throws:
  "setState() called after dispose()"
  
  Fix: check mounted before calling setState():
    if (mounted) setState(() => user = result);
  
  Or use a CancelableOperation from async package, or track a cancel flag.
  
  Note: initState() CAN call async functions — you just don't await them directly.
  Instead, call the async function without await (fire and forget with mounted check).
tags:
  - dart
  - async
  - lifecycle
  - mounted
---
