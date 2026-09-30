---
id: PERF_001
category: Performance
subcategory: Profiling
difficulty: easy
type: single_choice
question: "What is the Flutter DevTools Performance tab used for?"
options:
  A: "Managing app dependencies and packages"
  B: "Profiling frame rendering — shows frame time breakdown (build, layout, paint, raster), identifies janky frames, and CPU usage"
  C: "Monitoring network requests"
  D: "Debugging Firestore queries"
correct_answer: "B"
explanation: |
  Flutter DevTools Performance tab provides:
  
  - Frame chart: timeline of each frame's build+layout+paint time vs the 16ms budget
  - Red frames: frames exceeding the budget (jank)
  - CPU profiler: flame chart of Dart and native stack traces
  - Raster thread timing: GPU rasterization time
  - "Track widget builds": shows which widgets rebuild each frame
  
  Workflow:
  1. Run in profile mode: flutter run --profile (release-like performance, profiling enabled)
  2. Open DevTools → Performance
  3. Reproduce the jank
  4. Stop recording and analyze the flame chart
  
  Note: never profile in debug mode — JIT compilation and debug assertions make it much slower than production.
tags:
  - performance
  - devtools
  - profiling
  - jank
---

---
id: PERF_002
category: Performance
subcategory: Memory
difficulty: medium
type: single_choice
question: "How do you detect memory leaks in a Flutter app using DevTools?"
options:
  A: "Memory leaks are impossible in Dart due to garbage collection"
  B: "Use DevTools Memory tab: take snapshots, check for unexpected object retention, watch heap growth over time, use 'Track Allocations' to find allocation sites"
  C: "Use print() statements to track object creation"
  D: "Memory leaks only occur in native code"
correct_answer: "B"
explanation: |
  Memory leak detection workflow:
  
  1. Run in debug or profile mode
  2. DevTools → Memory tab
  3. Use the app normally (navigate, load data)
  4. Take heap snapshot: snapshot A (baseline)
  5. Perform the suspected leaking action multiple times (e.g., open/close a screen)
  6. Force GC (garbage collection button)
  7. Take snapshot B
  8. Compare: objects in B that shouldn't be there = leak candidates
  
  Common Flutter memory leaks:
  - StreamSubscription not cancelled in dispose()
  - AnimationController not disposed
  - Timer not cancelled
  - GlobalKey holding State after widget removed
  - Plugin callbacks holding widget references
  
  Use 'Track Allocations' to pinpoint where leaked objects are created.
tags:
  - performance
  - memory
  - devtools
  - memory-leak
---

---
id: PERF_003
category: Performance
subcategory: Rebuild Optimization
difficulty: medium
type: single_choice
question: "What are the most effective techniques to reduce unnecessary widget rebuilds?"
options:
  A: "Increase the device's RAM"
  B: "Use const constructors, split large widgets into smaller ones, use Selector/select, move state as low as possible, use RepaintBoundary for animated subtrees"
  C: "Avoid using StatefulWidgets"
  D: "Disable hot reload in production"
correct_answer: "B"
explanation: |
  Rebuild optimization techniques:
  
  1. const constructors: widget instance reused — no rebuild if parent rebuilds.
     const Text('Hello') — never rebuilds.
  
  2. Split widgets: smaller rebuild scope. A 500-line build() method rebuilds everything.
     Extract stateless sub-widgets.
  
  3. Selector (Provider) / ref.watch(p.select()) (Riverpod):
     Rebuild only when the specific selected value changes.
  
  4. Move setState() lower in the tree:
     Don't call setState() on the root widget for local state.
  
  5. RepaintBoundary around animated widgets:
     Prevents parent repaint from cascading into the animated subtree.
  
  6. shouldRebuild in BlocBuilder:
     buildWhen: (prev, curr) => prev.count != curr.count
  
  7. Keys: correct keys prevent accidental widget recreation.
tags:
  - performance
  - rebuild-optimization
  - const
  - widget-tree
---

---
id: PERF_004
category: Performance
subcategory: Images
difficulty: medium
type: single_choice
question: "What is the best practice for loading images in a Flutter list with many items?"
options:
  A: "Use Image.network() directly — Flutter handles caching automatically"
  B: "Use `cached_network_image` (CachedNetworkImage) for disk+memory caching, precacheImage for critical images, and provide placeholders/error widgets"
  C: "Download all images at startup to avoid loading indicators"
  D: "Use base64-encoded images in the JSON response"
correct_answer: "B"
explanation: |
  Best practices for images in lists:
  
  CachedNetworkImage:
  - Memory cache + disk cache (survives app restart)
  - Placeholder widget while loading
  - Error widget if load fails
  - Automatic cache eviction
    CachedNetworkImage(
      imageUrl: url,
      placeholder: (_, __) => ShimmerWidget(),
      errorWidget: (_, __, ___) => Icon(Icons.error),
      memCacheWidth: 200, // decode at display size, not full resolution
    )
  
  precacheImage() — pre-loads important images before they're needed:
    await precacheImage(NetworkImage(url), context);
  
  ResizeImage / memCacheWidth/memCacheHeight: decode at display resolution, not full res.
  A 4K image displayed at 100x100 wastes ~96% of decode memory without this.
  
  For local assets: use const AssetImage() to avoid repeated asset lookups.
tags:
  - performance
  - images
  - caching
  - cached-network-image
---

---
id: PERF_005
category: Performance
subcategory: Lists
difficulty: medium
type: single_choice
question: "What is the difference between `ListView` and `ListView.builder` for large lists?"
options:
  A: "ListView.builder is only for dynamic content; ListView is for static lists"
  B: "ListView builds all children eagerly; ListView.builder builds children lazily (only visible items) — critical for performance with 50+ items"
  C: "They are identical — Flutter optimizes both automatically"
  D: "ListView.builder requires a fixed item count"
correct_answer: "B"
explanation: |
  ListView([Widget1, Widget2, ..., Widget1000]):
  - All children instantiated and laid out immediately
  - Entire list exists in memory
  - Fine for ~20 items max
  
  ListView.builder(itemCount: 1000, itemBuilder: (context, index) => Item()):
  - Only builds items near the viewport (typically 3 screenfuls)
  - Items off-screen are disposed (unless cacheExtent is large)
  - Memory stays roughly constant regardless of list size
  - Required for large/infinite lists
  
  ListView.separated: adds separators, also lazy.
  ListView.custom: most flexible, uses SliverChildDelegate.
  
  For complex layouts with mixed content: CustomScrollView + SliverList is more flexible.
tags:
  - performance
  - list
  - lazy-loading
  - list-view-builder
---

---
id: PERF_006
category: Performance
subcategory: Isolates
difficulty: hard
type: single_choice
question: "When should you use `compute()` vs `Isolate.spawn()` for background processing?"
options:
  A: "They are identical — compute() is just shorter syntax"
  B: "compute() is a simple one-shot helper for single function calls. Isolate.spawn() gives full control for long-running isolates with bidirectional communication."
  C: "compute() is only for math operations; Isolate.spawn() is for I/O"
  D: "Isolate.spawn() is deprecated — use compute() for everything"
correct_answer: "B"
explanation: |
  compute(function, arg):
  - Spawns an isolate, calls function(arg), returns the result, kills the isolate
  - Simple API: final result = await compute(parseJson, jsonString)
  - New isolate each call — overhead for repeated use
  - One-directional: passes one argument, gets one result
  - Use for: one-off heavy computations (parse large JSON, image processing)
  
  Isolate.spawn(entryPoint, message) or Isolate.run():
  - Full lifecycle control: keep isolate alive for multiple tasks
  - Bidirectional communication via SendPort/ReceivePort
  - Use for: background worker (database operations, continuous audio processing)
  - Dart 2.15+: Isolate.run() is compute() equivalent but simpler
  
  Rule of thumb: use Isolate.run() (or compute) for one-off tasks.
  Use Isolate.spawn() for long-lived background workers.
tags:
  - performance
  - isolate
  - compute
  - background
---

---
id: PERF_007
category: Performance
subcategory: Startup
difficulty: hard
type: single_choice
question: "What techniques reduce Flutter app startup time?"
options:
  A: "Startup time is determined by hardware — nothing you can do in code"
  B: "Deferred loading (loadLibrary), minimize work in main() before runApp(), use const widgets, async initialization, show skeleton/splash early"
  C: "Reduce app binary size by removing assets"
  D: "Disable animations during startup"
correct_answer: "B"
explanation: |
  App startup optimization:
  
  1. Deferred loading (lazy import):
     import 'heavy_feature.dart' deferred as heavy;
     // Only loads when needed:
     await heavy.loadLibrary();
  
  2. Minimize blocking work in main():
     // Don't: await loadAllData(); before runApp()
     // Do: runApp() first, load data in initState()
  
  3. Async initialization pattern:
     Show SplashScreen immediately, init Firebase/GetIt in background,
     navigate to home once ready.
  
  4. Precompile shaders (Impeller/SkSL): eliminates first-frame jank.
  
  5. Reduce import chain: heavy packages in deferred imports.
  
  6. AOT optimization: flutter build --release
  
  7. Split debug info: --split-debug-info (smaller binary, external symbolication)
tags:
  - performance
  - startup
  - deferred-loading
---

---
id: PERF_008
category: Performance
subcategory: Profiling
difficulty: medium
type: single_choice
question: "What does 'profile mode' provide that 'debug mode' and 'release mode' don't?"
options:
  A: "Profile mode has the same performance as debug mode but with extra logging"
  B: "Profile mode compiles with AOT (like release) but keeps profiling hooks enabled — gives accurate performance numbers without production obfuscation"
  C: "Profile mode is the same as release mode"
  D: "Profile mode only works on physical devices"
correct_answer: "B"
explanation: |
  Flutter build modes:
  
  Debug mode (flutter run):
  - JIT compilation (slower, larger binary)
  - All debug assertions enabled
  - Hot reload supported
  - Performance NOT representative of production
  
  Profile mode (flutter run --profile):
  - AOT compilation (close to production speed)
  - Profiling hooks enabled (Observatory, DevTools connect)
  - Debug assertions DISABLED
  - Hot reload NOT supported
  - Use this for performance profiling
  
  Release mode (flutter build --release):
  - AOT compiled, fully optimized
  - All debug info stripped (with --obfuscate)
  - No profiling hooks
  - Use for App Store submission
  
  Always profile in profile mode — never trust debug mode timings.
tags:
  - performance
  - profiling
  - debug-mode
  - release-mode
---

---
id: PERF_009
category: Performance
subcategory: Rebuild Optimization
difficulty: hard
type: single_choice
question: "What does the `ValueListenableBuilder` widget do and when is it more efficient than `setState`?"
options:
  A: "ValueListenableBuilder is deprecated — use StreamBuilder instead"
  B: "ValueListenableBuilder rebuilds only its subtree when a ValueNotifier changes — no setState() needed, minimizes rebuild scope to just the builder"
  C: "It requires Riverpod to function"
  D: "ValueListenableBuilder rebuilds the entire widget tree"
correct_answer: "B"
explanation: |
  ValueNotifier<T> is a lightweight ChangeNotifier for a single value:
    final counter = ValueNotifier<int>(0);
    counter.value++; // notifies listeners
  
  ValueListenableBuilder rebuilds only its builder when the value changes:
    ValueListenableBuilder<int>(
      valueListenable: counter,
      builder: (context, value, child) => Text('Count: $value'),
    )
  
  Benefits over setState():
  - No State class needed — works in StatelessWidget
  - Minimal rebuild scope — only the builder, not the whole parent widget
  - Efficient for frequently-changing local UI state (counter, toggle, progress)
  
  Compare to AnimatedBuilder: same concept but for Listenable (AnimationController).
tags:
  - performance
  - value-notifier
  - value-listenable-builder
  - rebuild
---

---
id: PERF_010
category: Performance
subcategory: Images
difficulty: medium
type: multiple_choice
question: "Which of the following are valid techniques to optimize image performance in Flutter? (Select ALL that apply)"
options:
  A: "Use `memCacheWidth` and `memCacheHeight` to decode images at display size, not original resolution"
  B: "Use `precacheImage()` to warm the image cache before the image is displayed"
  C: "Use PNG for all images — it's always better than JPEG"
  D: "Use WebP format for network images — smaller file size than PNG/JPEG at same quality"
correct_answer: "A,B,D"
explanation: |
  A — TRUE: Decoding a 4K image at 100px display wastes ~1600x memory.
    CachedNetworkImage(memCacheWidth: 200) decodes at 200px.
    Image.network(cacheWidth: 200) — built-in Flutter parameter.
  
  B — TRUE: precacheImage() pre-loads into memory cache before widget is built:
    await precacheImage(AssetImage('assets/hero.png'), context);
    Prevents loading flicker on first appearance.
  
  C — FALSE: PNG is lossless (larger files). JPEG is lossy but much smaller for photos.
    WebP supports both lossy and lossless at better compression than PNG/JPEG.
    Use SVG (flutter_svg) for icons/illustrations.
  
  D — TRUE: WebP is ~25-34% smaller than JPEG and ~26% smaller than PNG at same quality.
    Widely supported on modern Android/iOS.
tags:
  - performance
  - images
  - optimization
  - webp
---
