---
id: FLUTTER_FUND_001
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
  1. Widget tree — immutable blueprints describing the UI (recreated frequently)
  2. Element tree — mutable instances linking widgets to render objects (lifecycle managers, reused)
  3. RenderObject tree — handles layout, painting, and hit testing (expensive, reused when possible)
  
  When you call setState(), Flutter rebuilds the Widget subtree cheaply, then reconciles
  the Element tree (reusing elements where possible) and updates RenderObjects only if needed.
tags:
  - flutter
  - internals
  - widget-tree
---

---
id: FLUTTER_FUND_002
category: Flutter
subcategory: Widget Tree
difficulty: easy
type: single_choice
question: "What is the difference between `StatelessWidget` and `StatefulWidget`?"
options:
  A: "StatelessWidget cannot have child widgets"
  B: "StatefulWidget has mutable state managed by a separate State object; StatelessWidget is immutable and rebuilds entirely from its constructor parameters"
  C: "StatelessWidget is faster because it uses native rendering"
  D: "StatefulWidget can only be used at the root of the tree"
correct_answer: "B"
explanation: |
  StatelessWidget: immutable, all configuration comes from constructor. Rebuilt from scratch
  when parent rebuilds with different parameters. No internal mutable state.
  
  StatefulWidget: paired with a State<T> object that persists across rebuilds.
  The widget itself is still immutable; the State object holds mutable data.
  
  Use StatefulWidget when: user interactions, animations, or async data loading
  change the appearance of that specific widget subtree.
tags:
  - flutter
  - stateful
  - stateless
---

---
id: FLUTTER_FUND_003
category: Flutter
subcategory: Lifecycle
difficulty: medium
type: single_choice
question: "What is the correct order of State lifecycle methods when a StatefulWidget is first created and displayed?"
options:
  A: "build → initState → didChangeDependencies"
  B: "initState → didChangeDependencies → build"
  C: "didChangeDependencies → initState → build"
  D: "initState → build → didChangeDependencies"
correct_answer: "B"
explanation: |
  Full StatefulWidget lifecycle order:
  1. createState() — creates the State object
  2. initState() — called once; initialize controllers, subscriptions
  3. didChangeDependencies() — called after initState AND when InheritedWidget dependencies change
  4. build() — called to build UI; may be called many times
  5. didUpdateWidget(oldWidget) — when parent rebuilds with new widget config
  6. deactivate() — when State is temporarily removed from tree
  7. dispose() — permanent removal; cancel subscriptions, dispose controllers
tags:
  - flutter
  - lifecycle
  - stateful
---

---
id: FLUTTER_FUND_004
category: Flutter
subcategory: Lifecycle
difficulty: medium
type: single_choice
question: "When is `didChangeDependencies()` called?"
options:
  A: "Only once, right after initState()"
  B: "After initState() AND whenever an InheritedWidget that this widget depends on changes"
  C: "Whenever setState() is called"
  D: "Only when the widget's parent rebuilds"
correct_answer: "B"
explanation: |
  didChangeDependencies() is called:
  1. Right after initState() (always, on first build)
  2. When any InheritedWidget higher in the tree that this State depends on changes
  
  Example: if you call context.dependOnInheritedWidgetOfExactType<Theme>() in build(),
  and the Theme changes, didChangeDependencies() fires before the next build().
  
  Use it for: fetching data that depends on InheritedWidget values (like Locale, Theme).
  Unlike initState(), you CAN safely call context.dependOnInheritedWidgetOfExactType here.
tags:
  - flutter
  - lifecycle
  - inherited-widget
---

---
id: FLUTTER_FUND_005
category: Flutter
subcategory: BuildContext
difficulty: hard
type: single_choice
question: "Why can you NOT use `BuildContext` in `initState()` to access InheritedWidgets?"
options:
  A: "initState() doesn't have access to the context parameter"
  B: "The widget is not yet attached to the element tree when initState() runs, so InheritedWidget lookups would return null or throw"
  C: "It's allowed but discouraged for performance reasons"
  D: "You can use context in initState() — there is no restriction"
correct_answer: "B"
explanation: |
  During initState(), the State is being initialized but the Element is not yet fully
  mounted into the tree. Using context to look up InheritedWidgets at this point is
  unreliable — the dependencies aren't registered yet.
  
  The fix: use didChangeDependencies() instead, which is called after initState() once
  the element is fully mounted, or schedule it with:
    WidgetsBinding.instance.addPostFrameCallback((_) { /* use context */ });
  
  You CAN use context in initState() for things that don't require InheritedWidget lookup
  (like accessing widget properties via context.widget), but it's a code smell.
tags:
  - flutter
  - buildcontext
  - lifecycle
  - inherited-widget
---

---
id: FLUTTER_FUND_006
category: Flutter
subcategory: Keys
difficulty: medium
type: single_choice
question: "When should you use a `GlobalKey` vs a `ValueKey` in Flutter?"
options:
  A: "GlobalKey for animations, ValueKey for lists"
  B: "GlobalKey to access State/context/RenderBox from outside the widget tree; ValueKey to preserve element identity when items reorder in a list"
  C: "They are interchangeable"
  D: "ValueKey is deprecated in Flutter 3.x"
correct_answer: "B"
explanation: |
  GlobalKey — creates a unique key registered globally. Lets you access:
  - globalKey.currentState — the State of the keyed widget
  - globalKey.currentContext — its BuildContext
  - globalKey.currentWidget — the Widget itself
  Use sparingly — global registry has performance cost.
  
  ValueKey(value) — identifies a widget by a value (e.g., item.id). Used in lists/animatedlist
  so Flutter can match elements correctly when items are inserted/removed/reordered.
  
  UniqueKey() — new unique key every build (forces widget recreation).
  ObjectKey(obj) — uses object identity (reference equality).
tags:
  - flutter
  - keys
  - global-key
  - value-key
---

---
id: FLUTTER_FUND_007
category: Flutter
subcategory: Keys
difficulty: hard
type: single_choice
question: "What problem do Keys solve in this scenario?"
code: |
  Column(children: [
    if (showA) ColoredBox(color: Colors.red),
    ColoredBox(color: Colors.blue),
  ])
code_lang: dart
options:
  A: "No problem — Flutter always correctly identifies widgets"
  B: "Without keys, when showA becomes false, Flutter may reuse the red box's element for the blue box, showing incorrect state"
  C: "Keys are only needed for ListView, not Column"
  D: "The if statement syntax is invalid in Flutter"
correct_answer: "B"
explanation: |
  Flutter reconciles the element tree by position. When showA is true: [red, blue].
  When showA becomes false: [blue]. Flutter sees one widget where two were.
  
  Without keys, it reuses the first element (red's element) for the blue box.
  If the boxes have internal State (e.g., a counter), the state is wrong.
  
  With ValueKey on each box, Flutter matches by key not position:
    ColoredBox(key: ValueKey('red'), color: Colors.red)
    ColoredBox(key: ValueKey('blue'), color: Colors.blue)
  
  Now Flutter correctly disposes the red element and keeps the blue element's state.
tags:
  - flutter
  - keys
  - element-tree
  - reconciliation
---

---
id: FLUTTER_FUND_008
category: Flutter
subcategory: InheritedWidget
difficulty: hard
type: single_choice
question: "How does `InheritedWidget` notify descendants of changes?"
options:
  A: "It uses a global event bus to broadcast changes"
  B: "Descendants that called `context.dependOnInheritedWidgetOfExactType()` are rebuilt when `updateShouldNotify()` returns true"
  C: "InheritedWidget pushes updates via setState()"
  D: "All widgets below InheritedWidget always rebuild when it changes"
correct_answer: "B"
explanation: |
  InheritedWidget propagation:
  1. A descendant registers dependency by calling context.dependOnInheritedWidgetOfExactType<T>()
  2. This is typically done inside build() or didChangeDependencies()
  3. When the InheritedWidget is replaced with a new instance, Flutter calls updateShouldNotify(old)
  4. If it returns true, all registered dependents are marked dirty and rebuilt
  
  context.getInheritedWidgetOfExactType<T>() — reads WITHOUT registering dependency (no rebuild)
  context.dependOnInheritedWidgetOfExactType<T>() — reads AND registers (triggers rebuild on change)
  
  This is the foundation of Provider, Theme, MediaQuery, Navigator, etc.
tags:
  - flutter
  - inherited-widget
  - buildcontext
---

---
id: FLUTTER_FUND_009
category: Flutter
subcategory: Layout
difficulty: medium
type: single_choice
question: "What is Flutter's layout constraint protocol?"
options:
  A: "Children propose sizes; parents accept or reject them"
  B: "Constraints go DOWN (parent → child), sizes go UP (child → parent), parent sets position"
  C: "All widgets have a fixed size defined at compile time"
  D: "Constraints flow up from leaf widgets to root"
correct_answer: "B"
explanation: |
  Flutter's layout mantra: "Constraints go down, sizes go up, parent sets position."
  
  1. Parent passes BoxConstraints (minW, maxW, minH, maxH) to child
  2. Child performs its own layout within those constraints
  3. Child returns its chosen size to parent
  4. Parent positions the child (offset)
  
  Tight constraint: minWidth == maxWidth (child has exactly one valid size)
  Loose constraint: minWidth == 0 (child picks its preferred size up to max)
  
  Understanding this prevents layout errors like "unbounded width/height" exceptions.
tags:
  - flutter
  - layout
  - constraints
---

---
id: FLUTTER_FUND_010
category: Flutter
subcategory: Layout
difficulty: hard
type: single_choice
question: "Why does this code throw a layout exception?"
code: |
  Row(
    children: [
      Column(
        children: [
          Text('Hello'),
        ],
      ),
    ],
  )
code_lang: dart
options:
  A: "Row and Column cannot be nested"
  B: "Column inside Row receives unbounded width constraints; Column tries to be as wide as possible and throws 'RenderFlex children have non-zero flex but incoming height constraints are unbounded'"
  C: "Text widget is not allowed inside Column"
  D: "No exception — this is valid Flutter code"
correct_answer: "D"
explanation: |
  Actually this code is VALID and does NOT throw. Row gives Column a loose width constraint,
  and Column sizes itself to its children's width (Text width).
  
  The ACTUAL problematic case is a Column inside a ListView (or any vertically unbounded
  context) that has Expanded children — Column gets unbounded height and can't resolve
  Expanded children.
  
  Common fix: wrap Column with Expanded inside Row/Column to give it bounded constraints,
  or use Flexible instead of Expanded for intrinsic sizing.
tags:
  - flutter
  - layout
  - constraints
  - row
  - column
---

---
id: FLUTTER_FUND_011
category: Flutter
subcategory: Navigation
difficulty: medium
type: single_choice
question: "What is the difference between Navigator 1.0 (imperative) and Navigator 2.0 (declarative)?"
options:
  A: "Navigator 2.0 is faster; Navigator 1.0 is deprecated"
  B: "Navigator 1.0 uses push/pop imperatively; Navigator 2.0 (Router API) drives navigation from app state declaratively — enabling deep links and web URL sync"
  C: "Navigator 2.0 only works on web platforms"
  D: "There is no meaningful difference for mobile apps"
correct_answer: "B"
explanation: |
  Navigator 1.0 (imperative):
    Navigator.push(context, MaterialPageRoute(builder: (_) => DetailPage()));
  Simple, but hard to handle deep links, back button on web, and URL sync.
  
  Navigator 2.0 (Router API / declarative):
  - App state determines the stack of pages
  - RouteInformationParser + RouterDelegate
  - The OS back button, deep links, and URL bar all sync with app state
  - More complex to set up but handles all navigation scenarios correctly
  
  In practice, use go_router (official package) which wraps Router API with a simple API.
  go_router supports deep links, redirects, nested navigation, shell routes.
tags:
  - flutter
  - navigation
  - navigator
  - go-router
---

---
id: FLUTTER_FUND_012
category: Flutter
subcategory: Navigation
difficulty: medium
type: single_choice
question: "In `go_router`, what is the purpose of a `redirect` callback?"
options:
  A: "To reload the current page"
  B: "To intercept navigation and reroute to a different path — commonly used for auth guards"
  C: "To pass extra data between routes"
  D: "To animate route transitions"
correct_answer: "B"
explanation: |
  redirect in go_router intercepts every navigation attempt and can return:
  - null: proceed to the requested route (no redirect)
  - A different path string: redirect to that route instead
  
  Common auth guard pattern:
    redirect: (context, state) {
      final loggedIn = ref.read(authProvider).isLoggedIn;
      if (!loggedIn && state.matchedLocation != '/login') return '/login';
      if (loggedIn && state.matchedLocation == '/login') return '/home';
      return null;
    }
  
  refreshListenable can trigger re-evaluation of the redirect when auth state changes.
tags:
  - flutter
  - navigation
  - go-router
  - auth
---

---
id: FLUTTER_FUND_013
category: Flutter
subcategory: Gestures
difficulty: medium
type: single_choice
question: "What is the difference between `GestureDetector` and `InkWell` in Flutter?"
options:
  A: "InkWell is deprecated; use GestureDetector"
  B: "GestureDetector handles gestures without visual feedback; InkWell provides Material ripple effect and is part of the Material tap feedback system"
  C: "GestureDetector only works on Android; InkWell works cross-platform"
  D: "InkWell cannot detect long presses"
correct_answer: "B"
explanation: |
  GestureDetector:
  - Raw gesture recognition (tap, long press, drag, scale, pan)
  - No visual feedback (no ripple, no splash)
  - Works on any widget
  - Use when you need custom gestures or non-Material design
  
  InkWell:
  - Material Design component with ripple/splash effect
  - Must be inside a Material widget for the ink to render
  - Limited to taps and double-taps (onTap, onDoubleTap, onLongPress)
  - Integrates with Tooltip and Focus system
  
  For lists: prefer ListTile (built-in InkWell) or wrap with InkWell for Material feel.
tags:
  - flutter
  - gestures
  - gesture-detector
  - inkwell
---

---
id: FLUTTER_FUND_014
category: Flutter
subcategory: BuildContext
difficulty: hard
type: single_choice
question: "What does `BuildContext` actually represent?"
options:
  A: "A reference to the current widget's properties"
  B: "The handle to the widget's Element in the Element tree — it IS the element"
  C: "A snapshot of the widget tree at a point in time"
  D: "A reference to the RenderObject"
correct_answer: "B"
explanation: |
  BuildContext is actually the Element itself (Element implements BuildContext).
  It represents the widget's location in the Element tree.
  
  This is why you can use context to:
  - Look up ancestor InheritedWidgets (context.dependOnInheritedWidgetOfExactType)
  - Find ancestor widgets (context.findAncestorWidgetOfExactType)
  - Access the render object (context.findRenderObject())
  - Navigate (Navigator.of(context))
  
  Common bug: storing context across async gaps. The element may be deactivated by
  the time the async callback runs. Always check `mounted` before using context after await.
tags:
  - flutter
  - buildcontext
  - element-tree
---

---
id: FLUTTER_FUND_015
category: Flutter
subcategory: Layout
difficulty: medium
type: single_choice
question: "What does `LayoutBuilder` provide that regular widgets don't?"
options:
  A: "It allows you to build different widget trees based on the PARENT's constraints at build time"
  B: "It builds widgets lazily for performance"
  C: "It provides access to the screen size via MediaQuery"
  D: "It forces children to match the parent's exact size"
correct_answer: "A"
explanation: |
  LayoutBuilder gives you the BoxConstraints passed to it by its parent, inside the builder callback.
  
  Use case: responsive UI that adapts to available space (not screen size):
    LayoutBuilder(builder: (context, constraints) {
      if (constraints.maxWidth > 600) return WideLayout();
      return NarrowLayout();
    })
  
  Difference from MediaQuery: MediaQuery.of(context).size is the SCREEN size (or window size).
  LayoutBuilder.constraints is the size available to THIS widget from ITS parent.
  A widget inside a Drawer has different constraints than the full screen.
tags:
  - flutter
  - layout
  - layout-builder
  - responsive
---

---
id: FLUTTER_FUND_016
category: Flutter
subcategory: Widget Tree
difficulty: easy
type: single_choice
question: "What is `const` constructor and why does it matter in Flutter?"
options:
  A: "const widgets are cached and reused across hot reloads only"
  B: "const widgets are compile-time constants — Flutter skips rebuilding them entirely when the parent rebuilds"
  C: "const is only valid for widgets without children"
  D: "const has no effect on Flutter widget performance"
correct_answer: "B"
explanation: |
  When a widget is marked `const`, Flutter can:
  1. Create it at compile time (no allocation at runtime)
  2. Canonicalize identical const widgets (same instance reused)
  3. Skip rebuilding it when parent calls setState() — the element recognizes same widget instance
  
  Best practice: use const wherever possible for static content:
    const Text('Hello') — rebuilt only if Text configuration changes
    const SizedBox.shrink() — zero-size placeholder, compiled once
    const EdgeInsets.all(16) — reused instance
  
  Flutter linter rule: prefer_const_constructors flags missing const.
tags:
  - flutter
  - const
  - performance
  - optimization
---

---
id: FLUTTER_FUND_017
category: Flutter
subcategory: Widget Tree
difficulty: medium
type: multiple_choice
question: "Which of the following are correct about `setState()` in Flutter? (Select ALL that apply)"
options:
  A: "setState() triggers a rebuild of the calling State's widget subtree"
  B: "setState() can be called from initState()"
  C: "Calling setState() from dispose() throws an exception"
  D: "You should call setState() as low in the tree as possible to minimize rebuild scope"
correct_answer: "A,C,D"
explanation: |
  A — TRUE: setState() marks the element dirty, scheduling a rebuild of that State's widget subtree.
  B — FALSE: calling setState() from initState() throws "setState() called in initState()".
       The widget hasn't been built yet. Use initState() only to initialize data, not trigger builds.
  C — TRUE: calling setState() after dispose() throws "setState() called after dispose()".
       Always check `mounted` in async callbacks before calling setState().
  D — TRUE: setState() on the root widget rebuilds the entire tree. Keep state local to minimize scope.
tags:
  - flutter
  - setstate
  - lifecycle
---

---
id: FLUTTER_FUND_018
category: Flutter
subcategory: Navigation
difficulty: easy
type: single_choice
question: "What is the difference between `Navigator.push` and `Navigator.pushReplacement`?"
options:
  A: "pushReplacement is faster because it doesn't animate"
  B: "push adds a new route on top of the stack; pushReplacement replaces the current route (previous route is disposed)"
  C: "pushReplacement is for bottom sheets; push is for full-screen routes"
  D: "They are identical"
correct_answer: "B"
explanation: |
  Navigator.push: adds route to stack. User can navigate back to the previous route.
  Stack: [Home, Login, Dashboard] after pushing Dashboard from Login.
  
  Navigator.pushReplacement: replaces current top route. Previous route is disposed.
  Stack: [Home, Dashboard] — Login is gone. Back button goes to Home, not Login.
  
  Use pushReplacement for: replacing Login/Onboarding with Home after successful auth,
  so user can't go back to the login screen.
  
  Navigator.pushAndRemoveUntil: pushes and removes all routes matching a predicate.
tags:
  - flutter
  - navigation
  - navigator
---

---
id: FLUTTER_FUND_019
category: Flutter
subcategory: Widget Tree
difficulty: medium
type: single_choice
question: "What is `MediaQuery` and what is the most common mistake when using it?"
options:
  A: "MediaQuery provides screen dimensions and accessibility settings. The mistake is calling it in initState()."
  B: "MediaQuery provides screen dimensions and system settings. Common mistake: calling MediaQuery.of(context) high in the tree causes the entire subtree to rebuild on any system change (e.g., keyboard showing)."
  C: "MediaQuery should always be used instead of LayoutBuilder"
  D: "MediaQuery only works on physical devices, not simulators"
correct_answer: "B"
explanation: |
  MediaQuery.of(context) registers the calling widget as a dependent of MediaQuery.
  It rebuilds whenever ANY MediaQuery value changes — screen size, textScaleFactor,
  keyboard visibility, display notch, etc.
  
  If you call MediaQuery.of(context) in a parent widget just to get screen width,
  the entire subtree rebuilds when the keyboard opens (viewInsets changes).
  
  Flutter 3.10+ solution: use specific methods:
    MediaQuery.sizeOf(context) — only rebuilds on size change
    MediaQuery.paddingOf(context) — only rebuilds on padding change
    MediaQuery.viewInsetsOf(context) — only rebuilds on insets change
tags:
  - flutter
  - mediaquery
  - performance
---

---
id: FLUTTER_FUND_020
category: Flutter
subcategory: Widget Tree
difficulty: hard
type: single_choice
question: "What is the `Element` tree's role in Flutter's reconciliation process?"
options:
  A: "The Element tree is a cache of the previous frame's widget tree"
  B: "Elements are the link between the immutable Widget and the mutable RenderObject. During reconciliation, Flutter reuses Elements (and their RenderObjects) when the widget type and key match."
  C: "Elements are only used for StatefulWidgets"
  D: "The Element tree is rebuilt from scratch on every frame"
correct_answer: "B"
explanation: |
  Flutter's reconciliation (diffing) works on the Element tree:
  
  When parent rebuilds:
  1. Flutter calls build() to get new widgets
  2. For each child position, it checks: same widget type + same key?
     - YES: update the existing Element with new widget config (cheap)
     - NO: deactivate old Element, create new one (expensive)
  3. Elements update their RenderObjects only if necessary
  
  This is why type matters: replacing Column with Row causes full subtree recreation.
  Why key matters: swapping items without keys causes state to follow position, not identity.
  
  StatefulWidget Elements hold the State object — that's how state survives widget rebuilds.
tags:
  - flutter
  - element-tree
  - reconciliation
  - internals
---
