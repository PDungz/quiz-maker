---
id: DART_ADV_001
category: Dart
subcategory: Null Safety
difficulty: easy
type: single_choice
question: "What is the difference between `String?` and `String` in Dart null safety?"
options:
  A: "String? is faster because it skips null checks"
  B: "String? can hold a String value or null; String is non-nullable and can never be null"
  C: "String? is deprecated in Dart 3"
  D: "There is no difference at runtime"
correct_answer: "B"
explanation: |
  Sound null safety divides types into nullable (T?) and non-nullable (T).
  - String: guaranteed non-null. The compiler ensures it's never null at compile time.
  - String?: can be null or a String. You must handle the null case before using it.
  
  This is enforced at compile time — not runtime — so no NullPointerException surprises.
  Non-nullable types are the default. Add ? only when null is a meaningful value.
tags:
  - dart
  - null-safety
---

---
id: DART_ADV_002
category: Dart
subcategory: Null Safety
difficulty: easy
type: single_choice
question: "What does the `late` keyword do in Dart?"
options:
  A: "Marks a variable as lazily initialized — its initializer runs on first access"
  B: "Marks a variable that will be set asynchronously"
  C: "Delays garbage collection of a variable"
  D: "Both A and B"
correct_answer: "A"
explanation: |
  `late` has two use cases:
  1. Non-nullable variable initialized after declaration (initialized before first use):
       late String name;  // safe if you guarantee assignment before read
  
  2. Lazy initialization — initializer runs only on first access:
       late final expensive = computeExpensiveValue();  // runs once, on first use
  
  If a `late` variable is read before being assigned, it throws LateInitializationError at runtime.
  Use `late` when you're certain assignment happens before first read.
tags:
  - dart
  - null-safety
  - late
---

---
id: DART_ADV_003
category: Dart
subcategory: Null Safety
difficulty: medium
type: single_choice
question: "What does null promotion mean in Dart?"
code: |
  String? name;
  
  void greet() {
    if (name != null) {
      print(name.length); // Is this valid?
    }
  }
code_lang: dart
options:
  A: "No — you must use name!.length inside the if block"
  B: "Yes — Dart promotes name to String (non-nullable) inside the if block after the null check"
  C: "No — name is still nullable inside the if block"
  D: "Yes — but only for local variables, not instance fields"
correct_answer: "D"
explanation: |
  Dart performs flow-based type promotion. After `if (name != null)`, local variables
  are promoted to their non-nullable type automatically.
  
  HOWEVER, for instance fields (class members), promotion does NOT apply because
  another thread/code could set the field to null between the check and the use.
  
  For instance fields, use:
  - final local = name; if (local != null) { local.length }
  - name?.length
  - name!.length (if you're certain)
tags:
  - dart
  - null-safety
  - promotion
---

---
id: DART_ADV_004
category: Dart
subcategory: Null Safety
difficulty: medium
type: single_choice
question: "What is the difference between `??` and `??=` operators in Dart?"
options:
  A: "`??` returns the right side if left is null; `??=` assigns to the variable only if it's null"
  B: "They are identical"
  C: "`??=` is for lists; `??` is for single values"
  D: "`??` is the safe navigation operator"
correct_answer: "A"
explanation: |
  `??` (null-coalescing): returns left if not null, otherwise right.
    String display = name ?? 'Anonymous';  // expression
  
  `??=` (null-aware assignment): assigns the right side only if the variable is null.
    name ??= 'Anonymous';  // same as: if (name == null) name = 'Anonymous';
  
  Common use case for ??= : lazy initialization pattern.
    _cache ??= computeExpensiveValue();
tags:
  - dart
  - null-safety
  - operators
---

---
id: DART_ADV_005
category: Dart
subcategory: Records
difficulty: medium
type: single_choice
question: "What are Dart Records (introduced in Dart 3) and how do you destructure them?"
code: |
  (String, int) getUser() => ('Alice', 30);
  
  void main() {
    final (name, age) = getUser();
    print('$name is $age');
  }
code_lang: dart
options:
  A: "Records are a new collection type like List. This code throws a compile error."
  B: "Records are anonymous, immutable value types. The code prints: Alice is 30"
  C: "Records require named fields — positional records are not allowed"
  D: "Destructuring requires the `destructure` keyword"
correct_answer: "B"
explanation: |
  Dart 3 Records are anonymous, immutable aggregate types — like tuples.
  They support positional and named fields:
    (int, String) pos = (1, 'hello');
    ({int x, String y}) named = (x: 1, y: 'hello');
  
  Pattern matching destructures them:
    final (name, age) = getUser();  // positional destructuring
  
  Records are value types: two records with same fields/values are equal (==).
  Great for returning multiple values from functions without defining a class.
tags:
  - dart
  - records
  - pattern-matching
  - dart3
---

---
id: DART_ADV_006
category: Dart
subcategory: Pattern Matching
difficulty: hard
type: single_choice
question: "What does the `switch` expression with patterns do in Dart 3?"
code: |
  sealed class Shape {}
  class Circle extends Shape { final double radius; Circle(this.radius); }
  class Rectangle extends Shape { final double w, h; Rectangle(this.w, this.h); }
  
  double area(Shape shape) => switch (shape) {
    Circle(:final radius) => 3.14 * radius * radius,
    Rectangle(:final w, :final h) => w * h,
  };
code_lang: dart
options:
  A: "This is a compile error — switch cannot match on class types"
  B: "switch expression with object patterns destructures fields directly. Dart 3 exhaustiveness checker ensures all Shape subtypes are handled."
  C: "The `:final radius` syntax is invalid — you must use `as Circle`"
  D: "sealed classes cannot be used with switch"
correct_answer: "B"
explanation: |
  Dart 3 introduces switch expressions (not statements) and object patterns.
  
  `:final radius` is shorthand for `radius: final radius` — matches and binds a field.
  
  `sealed class` tells the compiler all subtypes are known. Combined with switch,
  the exhaustiveness checker verifies all cases are handled — no default needed.
  If you add a new Shape subclass, the compiler will error on the unhandled switch.
  
  This is exhaustive pattern matching, similar to Kotlin's sealed classes or Rust's enums.
tags:
  - dart
  - pattern-matching
  - sealed-class
  - dart3
---

---
id: DART_ADV_007
category: Dart
subcategory: Type System
difficulty: hard
type: single_choice
question: "What is the difference between `sealed`, `base`, `final`, and `interface` class modifiers in Dart 3?"
options:
  A: "They are all aliases for `abstract`"
  B: "sealed=exhaustive pattern matching in same library; base=can extend not implement; final=no extend/implement; interface=can implement not extend"
  C: "These modifiers only affect runtime behavior, not compile-time"
  D: "Only `sealed` and `final` are valid Dart 3 keywords"
correct_answer: "B"
explanation: |
  Dart 3 class modifiers control inheritance:
  
  sealed — can only be extended/implemented in the same library. Enables exhaustive switch.
  base   — can be extended (subclassed) but NOT implemented. Protects implementation details.
  final  — cannot be extended OR implemented outside the library. Fully closed.
  interface — can be implemented but NOT extended. Forces API contract without sharing impl.
  mixin class — can be used as both a mixin and a regular class.
  
  These give library authors fine-grained control over how their types can be used.
tags:
  - dart
  - class-modifiers
  - sealed
  - dart3
---

---
id: DART_ADV_008
category: Dart
subcategory: Compilation
difficulty: hard
type: single_choice
question: "What is the difference between AOT and JIT compilation in Dart, and which does Flutter use for production?"
options:
  A: "Flutter uses JIT for production for faster startup"
  B: "AOT (Ahead-of-Time) compiles to native code before running — used in release. JIT (Just-in-Time) compiles at runtime — used in debug/hot reload."
  C: "AOT and JIT produce identical performance"
  D: "Flutter only uses JIT on iOS due to Apple's restrictions"
correct_answer: "B"
explanation: |
  JIT compilation (debug mode):
  - Compiles and optimizes code at runtime
  - Enables hot reload (injects updated code without restart)
  - Slower startup, higher memory usage
  - Cannot ship to app stores
  
  AOT compilation (release mode):
  - dart compile / flutter build --release
  - Compiles entire Dart code to native ARM/x64 machine code before execution
  - Fast startup, lower memory footprint, no Dart VM overhead
  - No hot reload (code is baked in)
  
  Apple requires AOT (no JIT allowed on iOS), so Flutter AOT-compiles for all platforms in release.
tags:
  - dart
  - aot
  - jit
  - compilation
---

---
id: DART_ADV_009
category: Dart
subcategory: Generics
difficulty: medium
type: single_choice
question: "Are Dart generics reified? What does this mean practically?"
options:
  A: "No — generics are erased at runtime like Java pre-generics"
  B: "Yes — generic type information is preserved at runtime, so you can check `is List<String>` at runtime"
  C: "Only for built-in types like List and Map"
  D: "Only in AOT-compiled code"
correct_answer: "B"
explanation: |
  Dart generics are reified — type arguments are available at runtime.
  
  Practical consequence:
    List<String> names = ['Alice'];
    print(names is List<String>); // true
    print(names is List<int>);    // false
  
  In Java/Kotlin (type erasure), both would be `List` at runtime and both checks would be true.
  
  Dart's reified generics enable:
  - Accurate runtime type checks
  - Type-safe reflection
  - Correct behavior of `runtimeType`
  
  Important for libraries that need to dispatch on generic type parameters.
tags:
  - dart
  - generics
  - type-system
  - reified
---

---
id: DART_ADV_010
category: Dart
subcategory: Memory
difficulty: hard
type: single_choice
question: "What is tree shaking in Dart/Flutter and how does it affect your app?"
options:
  A: "Tree shaking removes unused widgets from the widget tree at runtime"
  B: "Tree shaking is a compile-time optimization that removes unused code (dead code elimination) from the final binary"
  C: "Tree shaking compresses image assets"
  D: "Tree shaking is only applied to JavaScript targets, not mobile"
correct_answer: "B"
explanation: |
  Tree shaking (dead code elimination) happens during AOT compilation (flutter build --release).
  The compiler analyses which code paths are actually reachable from main() and removes
  everything else, significantly reducing binary size.
  
  Practical implications:
  - Only imported AND used code is included — import a big package but use one function? Only that function ships.
  - @pragma('vm:entry-point') prevents tree shaking for functions called from native/isolates.
  - dart:mirrors reflection prevents tree shaking (everything must be kept). Avoid in Flutter.
  - deferred loading (loadLibrary()) can split code into chunks loaded on demand.
tags:
  - dart
  - tree-shaking
  - compilation
  - performance
---
