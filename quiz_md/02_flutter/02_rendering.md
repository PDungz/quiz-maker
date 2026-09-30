---
id: FLUTTER_RENDER_001
category: Flutter
subcategory: Frame Pipeline
difficulty: medium
type: single_choice
question: "What is the Flutter frame rendering pipeline in order?"
options:
  A: "Paint → Layout → Build → Composite"
  B: "Animate → Build → Layout → Paint → Composite → Rasterize"
  C: "Build → Animate → Layout → Paint → Rasterize"
  D: "Layout → Build → Animate → Composite → Paint"
correct_answer: "B"
explanation: |
  Flutter's frame pipeline (per vsync tick, ~16.6ms for 60fps):
  1. Animate — tick AnimationControllers, update animated values
  2. Build — call build() on dirty widgets, reconcile Element tree
  3. Layout — RenderObjects perform layout (performLayout/performResize)
  4. Compositing bits update — update layer compositing flags
  5. Paint — RenderObjects paint to their layers (paint method)
  6. Composite — layer tree is assembled
  7. Rasterize — GPU rasterizes layers to pixels (raster thread)
  
  Missing the 16ms budget = jank (dropped frame). The UI and raster threads each have ~8ms.
tags:
  - flutter
  - rendering
  - frame-pipeline
---

---
id: FLUTTER_RENDER_002
category: Flutter
subcategory: Threading
difficulty: hard
type: single_choice
question: "What are the Flutter engine threads and what does each do?"
options:
  A: "Main thread and Background thread"
  B: "UI thread (Dart), Raster thread (GPU), IO thread, Platform thread"
  C: "Build thread, Layout thread, Paint thread"
  D: "Flutter runs entirely on a single thread"
correct_answer: "B"
explanation: |
  Flutter engine runs on 4 threads:
  
  UI thread (main isolate): Runs Dart code — build, layout, animation, event handling.
  Heavy Dart work here causes frame drops.
  
  Raster thread (GPU thread): Takes the layer tree from UI thread and rasterizes it
  using Skia/Impeller. Shader compilation jank happens here.
  
  IO thread: Loads assets, decodes images, loads fonts. Feeds textures to raster thread.
  
  Platform thread (main OS thread): Handles platform messages (MethodChannel), OS events,
  plugin callbacks. Never block this thread.
  
  Rule: heavy Dart computation → move to isolate (offloads UI thread).
tags:
  - flutter
  - threading
  - raster-thread
  - ui-thread
---

---
id: FLUTTER_RENDER_003
category: Flutter
subcategory: Performance
difficulty: medium
type: single_choice
question: "What is 'jank' in Flutter and what is its typical cause?"
options:
  A: "Jank is a rendering artifact caused by hardware limitations"
  B: "Jank is a dropped frame — occurs when building, laying out, or painting takes longer than the frame budget (~16ms for 60fps)"
  C: "Jank only occurs on Android devices"
  D: "Jank is caused by too many widgets in the tree"
correct_answer: "B"
explanation: |
  At 60fps, each frame has 16.6ms total budget. At 120fps (ProMotion), only 8.3ms.
  
  Jank = frame takes longer than the budget → user sees stuttering.
  
  Common causes:
  - Synchronous heavy computation on UI thread (parsing large JSON, sorting big lists)
  - Expensive build() methods called too frequently (overdraw, deep trees)
  - Shader compilation jank (first time a shader is used — Impeller resolves this)
  - Too many layers in repaint (use RepaintBoundary judiciously)
  - Image decoding on UI thread (use precacheImage)
  
  Diagnosis: Flutter DevTools → Performance tab → look for long frames.
tags:
  - flutter
  - jank
  - performance
  - fps
---

---
id: FLUTTER_RENDER_004
category: Flutter
subcategory: Performance
difficulty: medium
type: single_choice
question: "What does `RepaintBoundary` do and when should you use it?"
options:
  A: "Clips child widgets to a rectangular boundary"
  B: "Creates a separate compositing layer — prevents parent repaints from triggering child repaints, at the cost of extra GPU memory"
  C: "Marks a widget as semantically important"
  D: "Forces a widget to rebuild every frame"
correct_answer: "B"
explanation: |
  RepaintBoundary creates a new compositing layer (RasterCacheLayer) in the layer tree.
  When parent repaints, the child's cached layer is composited from GPU memory instead of repainting.
  
  Use when:
  - A child animates independently (spinning indicator, Lottie animation)
  - A complex static subtree is surrounded by frequently-changing UI (chat bubbles next to typing indicator)
  
  Cost: each RepaintBoundary = GPU texture allocation (memory). Overuse wastes GPU memory.
  
  Tip: Flutter DevTools → Rendering → "Highlight repaints" shows what's repainting each frame.
tags:
  - flutter
  - repaint-boundary
  - performance
  - compositing
---

---
id: FLUTTER_RENDER_005
category: Flutter
subcategory: RenderObject
difficulty: hard
type: single_choice
question: "What is the difference between `LeafRenderObjectWidget`, `SingleChildRenderObjectWidget`, and `MultiChildRenderObjectWidget`?"
options:
  A: "They differ only in how many times build() is called"
  B: "They define how many children a RenderObject can have: 0, 1, or many — affecting how the render tree is assembled"
  C: "LeafRenderObjectWidget is for icons; Multi is for layouts"
  D: "They are identical — the naming is just documentation"
correct_answer: "B"
explanation: |
  These are base classes for widgets that directly create RenderObjects:
  
  LeafRenderObjectWidget — no children (RenderBox with no child slot)
    Examples: RawImage, Texture, PlatformView, CustomPaint (when no child)
  
  SingleChildRenderObjectWidget — exactly one child
    Examples: Padding, Align, SizedBox, ClipRect, Opacity, Transform
  
  MultiChildRenderObjectWidget — multiple children (uses ContainerRenderObjectMixin)
    Examples: Row, Column, Stack, Flex, Wrap, Flow
  
  When creating custom render objects, choose the right base class to correctly
  participate in the layout/paint protocol.
tags:
  - flutter
  - render-object
  - custom-render
  - internals
---

---
id: FLUTTER_RENDER_006
category: Flutter
subcategory: RenderObject
difficulty: hard
type: single_choice
question: "What are the THREE responsibilities of a `RenderBox`?"
options:
  A: "Build, Layout, Paint"
  B: "Layout (size), Paint (drawing), Hit Testing (touch input)"
  C: "Animate, Render, Composite"
  D: "Measure, Draw, Clip"
correct_answer: "B"
explanation: |
  RenderBox (the most common RenderObject base) has three jobs:
  
  1. Layout — performLayout(): determines the box's size and positions its children
     Must set size property within the given constraints.
  
  2. Paint — paint(context, offset): draws the box's visual content onto a Canvas.
     Called only if the box is within the viewport (lazy painting).
  
  3. Hit Testing — hitTest(result, position): determines if a point is inside this box.
     Used by GestureArena to route touch events to the correct widget.
  
  Custom render objects override these three methods to implement custom layout and drawing.
tags:
  - flutter
  - render-object
  - renderbox
  - custom-render
---

---
id: FLUTTER_RENDER_007
category: Flutter
subcategory: Rendering
difficulty: hard
type: single_choice
question: "What is Impeller and how does it differ from Skia?"
options:
  A: "Impeller is a state management library for Flutter"
  B: "Impeller is Flutter's new rendering engine that pre-compiles shaders at app startup, eliminating shader compilation jank. Skia compiled shaders lazily causing first-frame stutters."
  C: "Impeller is faster than Skia but only works on iOS"
  D: "Impeller and Skia are identical in behavior"
correct_answer: "B"
explanation: |
  Skia (legacy renderer):
  - Shaders compiled lazily on first use → shader compilation jank (noticeable stutter)
  - Difficult to predict which frames would be slow
  
  Impeller (new renderer, default on iOS since Flutter 3.10, Android since 3.16):
  - Pre-compiles a fixed set of shaders at engine initialization time
  - Zero runtime shader compilation jank
  - Uses Metal (iOS) and Vulkan (Android) instead of OpenGL
  - Slightly different rendering characteristics (some visual differences in edge cases)
  
  Enable: flutter build ios --enable-impeller (default now on iOS/Android)
  Disable: flutter build ios --no-enable-impeller (fallback to Skia)
tags:
  - flutter
  - impeller
  - skia
  - rendering
---

---
id: FLUTTER_RENDER_008
category: Flutter
subcategory: Compositing
difficulty: hard
type: single_choice
question: "What is the Flutter compositing layer tree and why does it matter?"
options:
  A: "The compositing layer tree is identical to the widget tree"
  B: "It's a tree of GPU layers assembled from RenderObject paint operations. Layers enable caching, opacity, transforms, and clips without repainting child content."
  C: "The layer tree is only used on iOS with Metal rendering"
  D: "Compositing layers are automatically created for every widget"
correct_answer: "B"
explanation: |
  Not every RenderObject creates its own layer — most paint into their parent's layer.
  New layers are created for:
  - Opacity (OpacityLayer)
  - Transforms (TransformLayer)
  - Clips (ClipRectLayer, ClipPathLayer)
  - RepaintBoundary (OffsetLayer / RasterCacheLayer)
  - Platform views (PlatformViewLayer)
  
  Benefits of layers:
  - Opacity animations don't require repainting children — just compositing with alpha
  - Cached layers avoid re-rasterizing static content
  - GPU can composite layers independently (parallel operations)
  
  Too many layers = GPU memory pressure. Use DevTools → Layer Tree to inspect.
tags:
  - flutter
  - compositing
  - layers
  - rendering
---

---
id: FLUTTER_RENDER_009
category: Flutter
subcategory: Semantics
difficulty: medium
type: single_choice
question: "What is the Flutter Semantics tree and why is it important?"
options:
  A: "The Semantics tree is an optimization for reducing build() calls"
  B: "The Semantics tree is a parallel tree describing the UI in terms accessible to screen readers (TalkBack, VoiceOver) and testing frameworks"
  C: "Semantics is only required for government apps"
  D: "The Semantics tree is rebuilt on every frame"
correct_answer: "B"
explanation: |
  Flutter builds a Semantics tree alongside the render tree. It describes:
  - Labels (what TalkBack/VoiceOver reads aloud)
  - Roles (button, image, text field)
  - Actions (tap, scroll, long press)
  - States (checked, focused, enabled)
  
  Used by:
  - Accessibility services (screen readers)
  - Integration test framework (find.bySemanticsLabel)
  - Flutter Driver
  
  Add semantics explicitly with Semantics widget or via ExcludeSemantics/MergeSemantics.
  Many Material widgets (ElevatedButton, TextField) provide semantics automatically.
tags:
  - flutter
  - semantics
  - accessibility
---

---
id: FLUTTER_RENDER_010
category: Flutter
subcategory: Performance
difficulty: medium
type: single_choice
question: "What does the `CustomPainter` class allow you to do, and what are the performance best practices?"
options:
  A: "CustomPainter allows you to override Material theme colors"
  B: "CustomPainter lets you draw directly on a Canvas with full control. Use `shouldRepaint()` to minimize unnecessary repaints."
  C: "CustomPainter is only for drawing shapes — not text or images"
  D: "CustomPainter automatically creates a RepaintBoundary"
correct_answer: "B"
explanation: |
  CustomPainter gives access to a raw Canvas for drawing:
  - Shapes (drawRect, drawCircle, drawPath)
  - Text (TextPainter)
  - Images (drawImage)
  - Complex graphics, charts, custom UI components
  
  Performance best practices:
  1. shouldRepaint(old): return false if nothing changed — avoids redraw.
  2. shouldRebuildSemantics(old): similar for accessibility tree.
  3. Wrap CustomPaint in RepaintBoundary when the parent changes frequently.
  4. Cache expensive Path/TextPainter objects in the painter (don't recreate in paint()).
  5. Use Canvas.saveLayer() sparingly — it allocates an offscreen buffer (expensive).
tags:
  - flutter
  - custom-painter
  - canvas
  - performance
---

---
id: FLUTTER_RENDER_011
category: Flutter
subcategory: Performance
difficulty: medium
type: single_choice
question: "What is the difference between `opacity: 0.5` on a Container vs wrapping it in an `Opacity` widget?"
options:
  A: "They are identical in performance"
  B: "Container's color opacity (Colors.red.withOpacity(0.5)) paints directly without a layer; Opacity widget creates an opacity compositing layer which is more expensive for animated values"
  C: "Opacity widget is deprecated — use Container decoration instead"
  D: "Opacity widget only works on solid colors"
correct_answer: "B"
explanation: |
  Colors.red.withOpacity(0.5) on a paint call: cheap — the color is pre-multiplied
  before painting. No additional layer created.
  
  Opacity(opacity: 0.5, child: ...): creates an OpacityLayer in the compositing tree.
  For a static opacity — slightly more memory. For animated opacity — necessary because
  the layer can be cached and composited at different alphas without repainting children.
  
  Best practice for animated opacity: use AnimatedOpacity or FadeTransition (which use
  the Opacity layer correctly). For static partial opacity, prefer withOpacity() on colors
  or use ColorFiltered instead of Opacity.
tags:
  - flutter
  - opacity
  - compositing
  - performance
---

---
id: FLUTTER_RENDER_012
category: Flutter
subcategory: Rendering
difficulty: hard
type: single_choice
question: "What does `markNeedsPaint()` vs `markNeedsLayout()` do on a RenderObject?"
options:
  A: "They are identical — both trigger a full rebuild"
  B: "markNeedsLayout() schedules re-layout AND re-paint; markNeedsPaint() only schedules re-paint (cheaper — skips layout)"
  C: "markNeedsPaint() is for StatelessWidgets; markNeedsLayout() is for StatefulWidgets"
  D: "Neither method exists — use setState() instead"
correct_answer: "B"
explanation: |
  RenderObject dirty flags:
  
  markNeedsLayout(): the object's size may have changed.
  Flutter will re-run performLayout() then paint().
  Propagates up until it finds a relayout boundary (e.g., a sized box).
  
  markNeedsPaint(): only the visual appearance changed, size is the same.
  Flutter skips layout and only re-runs paint(). Much cheaper.
  
  Example: a custom render object that changes color (no size change) should only
  call markNeedsPaint(), not markNeedsLayout() — avoid unnecessary layout work.
tags:
  - flutter
  - render-object
  - layout
  - paint
---

---
id: FLUTTER_RENDER_013
category: Flutter
subcategory: Frame Pipeline
difficulty: medium
type: single_choice
question: "What is `WidgetsBinding.instance.addPostFrameCallback()` used for?"
options:
  A: "Adding a listener that fires on every frame"
  B: "Scheduling a one-time callback to run after the current frame completes — useful when you need context/layout info after the first build"
  C: "Cancelling a running animation frame"
  D: "It is equivalent to Future.delayed(Duration.zero)"
correct_answer: "B"
explanation: |
  addPostFrameCallback fires once after the next frame is drawn.
  
  Common use cases:
  - Measuring widget size after first build: context.findRenderObject()?.paintBounds
  - Showing a dialog/SnackBar after navigation completes
  - Scrolling to a position after the list is rendered
  - Any operation needing the widget to be fully laid out first
  
  Pattern in initState():
    @override
    void initState() {
      super.initState();
      WidgetsBinding.instance.addPostFrameCallback((_) {
        // Widget is now built and laid out
        _scrollController.animateTo(...);
      });
    }
tags:
  - flutter
  - frame-callback
  - lifecycle
---

---
id: FLUTTER_RENDER_014
category: Flutter
subcategory: Performance
difficulty: hard
type: single_choice
question: "How does Flutter's `SchedulerBinding` manage frame scheduling?"
options:
  A: "It uses a timer that fires every 16ms regardless of vsync"
  B: "It hooks into the platform's vsync signal; scheduleFrame() requests one frame, and the engine calls drawFrame() on each vsync when there's work to do"
  C: "SchedulerBinding runs frames on a background thread"
  D: "It always renders at the device's maximum refresh rate"
correct_answer: "B"
explanation: |
  SchedulerBinding coordinates Flutter's rendering with the display's vsync signal:
  
  1. Something marks a widget dirty (setState, markNeedsBuild)
  2. SchedulerBinding.scheduleFrame() is called — tells the engine "I need a frame"
  3. Engine waits for next vsync from the display hardware
  4. Engine calls WidgetsBinding.drawFrame() at vsync time
  5. Build → Layout → Paint → Composite runs
  6. If nothing is dirty, no frame is scheduled (battery friendly)
  
  This ensures Flutter only renders when needed (not in a busy loop) and is
  synchronized with the display to minimize tearing.
tags:
  - flutter
  - scheduler
  - vsync
  - frame-pipeline
---

---
id: FLUTTER_RENDER_015
category: Flutter
subcategory: Performance
difficulty: hard
type: single_choice
question: "What is shader compilation jank and how does Impeller solve it?"
options:
  A: "Shader jank is caused by too many widgets; Impeller reduces widget count"
  B: "Shader jank occurs when Skia compiles GLSL shaders on first use (causing frame drops). Impeller pre-compiles Metal/Vulkan shaders at engine build time, eliminating first-use delays."
  C: "Shader jank only happens on Android; iOS was always jank-free"
  D: "Impeller eliminates jank by running shaders on the CPU"
correct_answer: "B"
explanation: |
  Skia's shader jank:
  - Skia uses OpenGL shaders (GLSL) compiled lazily at runtime
  - First time a particular visual effect (gradient, blur, clip) renders → compile shader → stutter
  - SkSL shader warm-up (--bundle-sksl-path) was a workaround but required manual profiling
  
  Impeller's solution:
  - Uses a fixed, known set of shaders (no dynamic shader generation)
  - All shaders are compiled to Metal (iOS) or Vulkan SPIR-V (Android) at Flutter engine build time
  - Zero runtime shader compilation → no first-frame stutter
  - Trade-off: slightly larger engine binary, some visual edge cases differ from Skia
tags:
  - flutter
  - impeller
  - shader-jank
  - performance
---
