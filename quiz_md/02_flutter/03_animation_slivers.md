---
id: FLUTTER_ANIM_001
category: Flutter
subcategory: Animation
difficulty: easy
type: single_choice
question: "What is the role of `AnimationController` in Flutter animations?"
options:
  A: "It defines the visual appearance of the animation (colors, sizes)"
  B: "It drives the animation by producing a value from 0.0 to 1.0 over a duration, and must be disposed when done"
  C: "It automatically animates any widget property"
  D: "It replaces the need for setState() in animated widgets"
correct_answer: "B"
explanation: |
  AnimationController is the engine of explicit animations:
  - Produces a double value interpolated from lowerBound to upperBound (default 0.0–1.0)
  - Controls timing: forward(), reverse(), repeat(), stop()
  - Must be created in initState() with a vsync provider (TickerProviderStateMixin)
  - MUST be disposed in dispose() to prevent memory leaks
  
  Example:
    late AnimationController _controller;
    @override
    void initState() {
      _controller = AnimationController(vsync: this, duration: Duration(seconds: 1));
    }
    @override
    void dispose() { _controller.dispose(); super.dispose(); }
tags:
  - flutter
  - animation
  - animation-controller
---

---
id: FLUTTER_ANIM_002
category: Flutter
subcategory: Animation
difficulty: medium
type: single_choice
question: "What is the difference between `Tween` and `CurvedAnimation`?"
options:
  A: "Tween controls speed; CurvedAnimation controls value range"
  B: "Tween maps a 0–1 range to a typed value range (e.g., Color, Offset, double); CurvedAnimation applies a non-linear curve to the 0–1 progress"
  C: "They are used only with ImplicitlyAnimatedWidgets"
  D: "CurvedAnimation is deprecated — use Tween with a curve parameter instead"
correct_answer: "B"
explanation: |
  CurvedAnimation wraps a controller and applies a Curve to the 0.0–1.0 progress:
    final curved = CurvedAnimation(parent: _controller, curve: Curves.easeInOut);
  
  Tween maps the curved/raw progress to a typed output range:
    final tween = Tween<double>(begin: 0, end: 300.0).animate(curved);
    // or: ColorTween, SizeTween, AlignmentTween...
  
  Chain: controller → CurvedAnimation → Tween → animated value
  
  AnimatedBuilder / AnimatedWidget listen to the animation and rebuild when value changes.
tags:
  - flutter
  - animation
  - tween
  - curved-animation
---

---
id: FLUTTER_ANIM_003
category: Flutter
subcategory: Animation
difficulty: medium
type: single_choice
question: "What is the difference between `AnimatedBuilder` and `AnimatedWidget`?"
options:
  A: "AnimatedBuilder is for implicit animations; AnimatedWidget is for explicit animations"
  B: "AnimatedWidget extends a widget that rebuilds on animation tick; AnimatedBuilder uses a builder callback — separating animation logic from the widget being animated"
  C: "They are functionally identical — AnimatedBuilder is just syntactic sugar"
  D: "AnimatedWidget is deprecated in Flutter 3.x"
correct_answer: "B"
explanation: |
  AnimatedWidget (subclass approach):
    class SpinningBox extends AnimatedWidget {
      const SpinningBox({required Animation<double> animation}) : super(listenable: animation);
      @override Widget build(BuildContext context) { /* use (animation as Animation<double>).value */ }
    }
  Good for reusable animated components.
  
  AnimatedBuilder (builder pattern):
    AnimatedBuilder(
      animation: _controller,
      builder: (context, child) => Transform.rotate(angle: _controller.value, child: child),
      child: const ExpensiveWidget(), // child NOT rebuilt on animation tick
    )
  The `child` parameter is built once and passed into builder — optimization for
  subtrees that don't depend on the animation value.
tags:
  - flutter
  - animation
  - animated-builder
  - animated-widget
---

---
id: FLUTTER_ANIM_004
category: Flutter
subcategory: Animation
difficulty: easy
type: single_choice
question: "What are ImplicitlyAnimatedWidgets and when should you use them?"
options:
  A: "Widgets that animate automatically without any controller — just update the property and Flutter animates between old and new values"
  B: "Widgets that require AnimationController to function"
  C: "Widgets with built-in physics simulations"
  D: "They are deprecated in favor of explicit animations"
correct_answer: "A"
explanation: |
  ImplicitlyAnimatedWidgets automatically animate when their properties change via setState():
  - AnimatedContainer — animates color, size, decoration, padding
  - AnimatedOpacity — animates opacity
  - AnimatedPadding — animates padding
  - AnimatedAlign — animates alignment
  - AnimatedDefaultTextStyle — animates text style
  - AnimatedPositioned — animates position in Stack
  
  Use them when:
  - Simple one-shot state-driven animations
  - No complex sequencing or user interaction control needed
  
  Use explicit (AnimationController) when:
  - Looping animations
  - User-controlled animations (drag → progress)
  - Complex multi-step sequences
tags:
  - flutter
  - animation
  - implicit-animation
---

---
id: FLUTTER_ANIM_005
category: Flutter
subcategory: Animation
difficulty: medium
type: single_choice
question: "How does Hero animation work in Flutter?"
options:
  A: "Hero copies the widget from source to destination screen"
  B: "Hero creates a shared element transition — the widget with the same `tag` flies between source and destination routes using an overlay layer"
  C: "Hero only works with images, not arbitrary widgets"
  D: "Hero requires manual AnimationController setup"
correct_answer: "B"
explanation: |
  Hero transition:
  1. Source and destination routes both have Hero(tag: 'same-tag', child: widget)
  2. During navigation, Flutter finds matching Hero tags
  3. An overlay Hero widget is created above both routes
  4. The overlay animates the position/size from source Hero's bounds to destination bounds
  5. Both original Heroes are hidden during the transition
  
  Requirements:
  - Same tag value on source and destination
  - Tags must be unique within a route (no duplicate tags)
  - createRectTween can customize the flight path
  - flightShuttleBuilder lets you customize the widget during flight
tags:
  - flutter
  - animation
  - hero
  - navigation
---

---
id: FLUTTER_ANIM_006
category: Flutter
subcategory: Slivers
difficulty: medium
type: single_choice
question: "What is a Sliver in Flutter and why do they exist?"
options:
  A: "Slivers are a type of animation in Flutter"
  B: "Slivers are viewport-aware scrollable pieces — they know their position in the scroll view and only paint visible content, enabling lazy rendering"
  C: "Slivers are only used for horizontal scrolling"
  D: "Slivers are deprecated in favor of ListView"
correct_answer: "B"
explanation: |
  Slivers are the building blocks of scrollable areas. Unlike ListView which is a
  complete scrollable, slivers give fine-grained control:
  
  CustomScrollView assembles multiple slivers:
  - SliverAppBar — collapsible/pinned/floating header
  - SliverList — lazy-loading vertical list
  - SliverGrid — lazy-loading grid
  - SliverToBoxAdapter — embeds a regular widget in a scroll view
  - SliverFillRemaining — fills the remaining space
  - SliverPadding — adds padding to slivers
  
  Key advantage: slivers are viewport-aware. They know their scroll offset and only
  call build/layout for visible children — crucial for large lists.
tags:
  - flutter
  - slivers
  - scrolling
  - custom-scroll-view
---

---
id: FLUTTER_ANIM_007
category: Flutter
subcategory: Slivers
difficulty: medium
type: single_choice
question: "What is the difference between `SliverList` with a `SliverChildBuilderDelegate` vs `SliverChildListDelegate`?"
options:
  A: "SliverChildListDelegate is lazy; SliverChildBuilderDelegate builds all children at once"
  B: "SliverChildBuilderDelegate builds children lazily (on-demand as they scroll into view); SliverChildListDelegate takes a pre-built list (all children created upfront)"
  C: "They perform identically"
  D: "SliverChildListDelegate supports infinite scroll; Builder does not"
correct_answer: "B"
explanation: |
  SliverChildListDelegate([widget1, widget2, ...]):
  - Receives a pre-built list — ALL children are instantiated immediately
  - Fine for small, known lists
  - Similar to Column — no lazy loading
  
  SliverChildBuilderDelegate((context, index) => buildItem(index), childCount: n):
  - Builder callback called only for visible items (lazy)
  - Essential for large lists or infinite scroll
  - Similar to ListView.builder
  
  Rule: always use Builder delegate for lists longer than ~20 items.
  ListView.builder internally uses SliverChildBuilderDelegate.
tags:
  - flutter
  - slivers
  - list
  - performance
---

---
id: FLUTTER_ANIM_008
category: Flutter
subcategory: Slivers
difficulty: hard
type: single_choice
question: "What does `SliverAppBar` with `pinned: true` and `floating: true` do differently than `pinned: true` alone?"
options:
  A: "They are identical — pinned and floating together are redundant"
  B: "pinned+floating: AppBar instantly re-appears when scrolling up (even mid-list), but collapses when scrolling down. pinned alone: AppBar stays always visible (pinned at top) without re-appearing behavior."
  C: "floating: true makes the AppBar transparent when scrolled past"
  D: "pinned+floating requires snap: true to function"
correct_answer: "B"
explanation: |
  SliverAppBar behaviors:
  
  Default (pinned: false, floating: false):
  - AppBar scrolls away with content. Comes back only when you scroll all the way up.
  
  pinned: true:
  - AppBar stays at top (collapsed to toolbarHeight) even when scrolled down.
  - Always visible.
  
  floating: true:
  - AppBar re-appears immediately when you start scrolling up, even if you're mid-list.
  - But it scrolls away when scrolling down.
  
  pinned: true + floating: true:
  - AppBar stays pinned at top AND instantly re-expands when scrolling up.
  - Adds snap: true to make it snap fully open/closed (no partial expansion).
tags:
  - flutter
  - slivers
  - sliver-app-bar
---

---
id: FLUTTER_ANIM_009
category: Flutter
subcategory: Animation
difficulty: hard
type: single_choice
question: "What is `TickerProviderStateMixin` and why is it required for AnimationController?"
options:
  A: "It provides a database connection for animations"
  B: "It provides a Ticker — a callback that fires on each vsync frame — which AnimationController uses to update its value in sync with the display refresh rate"
  C: "It's an optional mixin that improves animation performance"
  D: "It's required only for Hero animations"
correct_answer: "B"
explanation: |
  A Ticker calls a callback on every display frame (vsync tick).
  AnimationController uses the Ticker to advance its value smoothly.
  
  Without a vsync source, AnimationController would use a Timer — which is not
  synchronized with the display and wastes CPU when the app is in the background.
  
  Two mixins:
  - SingleTickerProviderStateMixin — for one AnimationController
  - TickerProviderStateMixin — for multiple AnimationControllers
  
  The mixin automatically pauses tickers when the widget is not visible (TickerMode),
  which prevents battery drain for off-screen animations.
tags:
  - flutter
  - animation
  - ticker
  - vsync
---

---
id: FLUTTER_ANIM_010
category: Flutter
subcategory: Animation
difficulty: medium
type: single_choice
question: "What is `FadeTransition` and why is it preferred over `AnimatedOpacity` for performance?"
options:
  A: "FadeTransition is only for page transitions, not widget animations"
  B: "FadeTransition uses an Animation<double> and applies opacity at the compositing layer level — it does NOT call build() on each frame, unlike AnimatedOpacity which uses setState()"
  C: "They have identical performance characteristics"
  D: "AnimatedOpacity is preferred — FadeTransition requires more boilerplate"
correct_answer: "B"
explanation: |
  AnimatedOpacity uses an ImplicitlyAnimatedWidget that internally calls setState() on
  each animation frame → widget rebuild on every frame.
  
  FadeTransition uses an explicit Animation<double> and the opacity layer in the
  compositing tree. It updates the opacity value directly in the render object
  WITHOUT rebuilding the widget tree (markNeedsPaint, not markNeedsBuild).
  
  This makes FadeTransition significantly more efficient for smooth opacity animations.
  Similarly: ScaleTransition, RotationTransition, SlideTransition are more efficient
  than their AnimatedX counterparts for frequent/looping animations.
tags:
  - flutter
  - animation
  - fade-transition
  - performance
---
