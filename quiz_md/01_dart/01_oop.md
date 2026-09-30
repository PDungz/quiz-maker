---
id: DART_OOP_001
category: Dart
subcategory: OOP
difficulty: easy
type: single_choice
question: "Which keyword do you use to include a mixin in a Dart class?"
options:
  A: "extends"
  B: "implements"
  C: "with"
  D: "uses"
correct_answer: "C"
explanation: |
  In Dart, the `with` keyword is used to include a mixin in a class.
  Example: `class MyClass extends BaseClass with MyMixin { ... }`
  You can apply multiple mixins: `with Mixin1, Mixin2`.
  Mixins allow reusing code across multiple class hierarchies without inheritance.
tags:
  - dart
  - oop
  - mixin
---

---
id: DART_OOP_002
category: Dart
subcategory: OOP
difficulty: medium
type: single_choice
question: "What is a key restriction on a class that is used as a mixin (declared with `mixin`)?"
options:
  A: "It cannot have any fields"
  B: "It cannot declare a generative constructor"
  C: "It cannot override methods from Object"
  D: "It must extend another mixin"
correct_answer: "B"
explanation: |
  A `mixin` in Dart cannot have a generative constructor. This is because mixins
  are not instantiated directly — they are applied to an existing class hierarchy.
  However, mixins can have fields, methods, getters, setters, and even factory constructors.
  Attempting to declare `MyMixin()` (a generative constructor) inside a `mixin` block is a compile error.
tags:
  - dart
  - oop
  - mixin
---

---
id: DART_OOP_003
category: Dart
subcategory: OOP
difficulty: medium
type: single_choice
question: "In Dart 3, what does the `sealed` class modifier do?"
options:
  A: "Prevents the class from being extended or implemented anywhere"
  B: "Allows exhaustive pattern matching on its subtypes within the same library"
  C: "Makes all fields in the class immutable"
  D: "Prevents the class from being used as a mixin"
correct_answer: "B"
explanation: |
  In Dart 3, `sealed` restricts a class so it can only be extended or implemented within
  the same library. The key benefit is exhaustive switch expressions — the compiler knows
  all possible subtypes and enforces that all cases are handled.
  `base` prevents implementation outside the library, `final` prevents both extension and
  implementation outside the library, and `interface` prevents extension (only implementation allowed).
tags:
  - dart
  - oop
  - sealed
  - dart3
  - pattern-matching
---

---
id: DART_OOP_004
category: Dart
subcategory: OOP
difficulty: hard
type: single_choice
question: "What is the output of this Dart code?"
code: |
  sealed class Shape {}
  class Circle extends Shape { final double radius; Circle(this.radius); }
  class Rectangle extends Shape { final double w, h; Rectangle(this.w, this.h); }

  double area(Shape s) => switch (s) {
    Circle c => 3.14 * c.radius * c.radius,
    Rectangle r => r.w * r.h,
  };

  void main() {
    print(area(Circle(2)));
    print(area(Rectangle(3, 4)));
  }
code_lang: dart
options:
  A: "12.56 and 12.0"
  B: "Compile error — switch is not exhaustive"
  C: "Runtime error — sealed class cannot be instantiated"
  D: "12.56 and 12.0, but only if a default case is added"
correct_answer: "A"
explanation: |
  With `sealed` classes, Dart 3 switch expressions are exhaustive — the compiler verifies
  all subtypes are handled without requiring a default case.
  `Circle(2)` → 3.14 * 4 = 12.56, `Rectangle(3, 4)` → 12.0.
  No compile error because `Circle` and `Rectangle` cover all subtypes of the sealed `Shape`.
tags:
  - dart
  - oop
  - sealed
  - dart3
  - pattern-matching
---

---
id: DART_OOP_005
category: Dart
subcategory: OOP
difficulty: easy
type: single_choice
question: "What is an extension method in Dart and where can it be called?"
options:
  A: "A method added to an existing class that can only be called within the same file"
  B: "A method added to an existing type without modifying it, callable wherever the extension is imported"
  C: "An override of an existing method in a subclass"
  D: "A static method that operates on a class instance"
correct_answer: "B"
explanation: |
  Extension methods let you add new functionality to existing types without subclassing or modifying the original type.
  They are callable anywhere the extension is in scope (imported).
  Example: `extension StringX on String { bool get isPalindrome => this == this.split('').reversed.join(); }`
  They work on any type: classes, enums, generic types, even `dynamic` (with restrictions).
tags:
  - dart
  - oop
  - extension
---

---
id: DART_OOP_006
category: Dart
subcategory: OOP
difficulty: medium
type: single_choice
question: "Which of the following correctly defines a generic class with a type constraint in Dart?"
options:
  A: "`class Box<T where T extends Comparable> { T value; }`"
  B: "`class Box<T extends Comparable> { T value; Box(this.value); }`"
  C: "`class Box<T : Comparable> { T value; Box(this.value); }`"
  D: "`class Box<T implements Comparable> { T value; Box(this.value); }`"
correct_answer: "B"
explanation: |
  Dart uses `<T extends SomeType>` for type bounds on generics.
  This restricts `T` to be a subtype of `SomeType`.
  The syntax `where`, `:`, or `implements` for type bounds are from other languages (C#, Kotlin, etc.)
  and are not valid Dart syntax.
tags:
  - dart
  - oop
  - generics
---

---
id: DART_OOP_007
category: Dart
subcategory: OOP
difficulty: medium
type: single_choice
question: "What is a `typedef` in Dart and when is it most useful?"
options:
  A: "An alias for a primitive type that improves memory layout"
  B: "A named type alias for function signatures or complex types, improving readability and reuse"
  C: "A compile-time constant definition similar to `const`"
  D: "A way to define interfaces without using the `abstract` keyword"
correct_answer: "B"
explanation: |
  `typedef` in Dart creates a named alias for a type, most commonly for function signatures.
  Example: `typedef Predicate<T> = bool Function(T value);`
  It can also alias complex generic types in Dart 2.13+: `typedef StringMap = Map<String, dynamic>;`
  Typedefs improve code readability and allow you to pass function types as parameters more cleanly.
tags:
  - dart
  - oop
  - typedef
---

---
id: DART_OOP_008
category: Dart
subcategory: OOP
difficulty: hard
type: single_choice
question: "What does `covariant` do in this Dart code?"
code: |
  class Animal {
    void eat(Animal food) {}
  }
  class Cat extends Animal {
    @override
    void eat(covariant Cat food) {}
  }
code_lang: dart
options:
  A: "It causes a compile error because covariant breaks the Liskov Substitution Principle"
  B: "It tells the type system to accept `Cat` or any subtype of `Cat` as the parameter, checked at runtime"
  C: "It makes the `food` parameter nullable"
  D: "It allows `Cat` to be passed where `Animal` is expected for the return type"
correct_answer: "B"
explanation: |
  `covariant` narrows the parameter type in a subclass override, which is technically unsound
  (breaks LSP) but is sometimes useful in practice. The type check is deferred to runtime.
  If you call `cat.eat(dog)` where `dog` is an `Animal` but not a `Cat`, you get a runtime TypeError.
  The compiler accepts the code but inserts a runtime check for the narrowed type.
tags:
  - dart
  - oop
  - covariant
  - type-system
---

---
id: DART_OOP_009
category: Dart
subcategory: OOP
difficulty: medium
type: single_choice
question: "What is a factory constructor in Dart and how does it differ from a regular constructor?"
options:
  A: "A factory constructor must always create a new instance of the class"
  B: "A factory constructor can return an existing instance, a subtype instance, or a cached object"
  C: "A factory constructor is only used for abstract classes"
  D: "A factory constructor cannot access `this` but a regular constructor can"
correct_answer: "B"
explanation: |
  A `factory` constructor does not automatically create a new instance — it uses `return` to provide
  an instance, which can be a cached object, a subtype, or a new instance.
  This is how the Singleton pattern is often implemented in Dart.
  Regular (generative) constructors always create a new instance and have access to `this`.
  Factory constructors are also used for named constructors that delegate to subtypes.
tags:
  - dart
  - oop
  - factory-constructor
---

---
id: DART_OOP_010
category: Dart
subcategory: OOP
difficulty: easy
type: single_choice
question: "What does the cascade notation `..` do in Dart?"
options:
  A: "It merges two objects into one"
  B: "It allows chaining multiple operations on the same object, returning the object itself"
  C: "It is the null-aware spread operator for collections"
  D: "It calls a method and discards its return value"
correct_answer: "B"
explanation: |
  The cascade `..` (and null-aware `?..`) lets you chain multiple method calls or property
  assignments on the same object without repeating the variable name.
  Example: `paint..color = Colors.blue..strokeWidth = 2.0..style = PaintingStyle.fill;`
  Each `..` operation returns the original object, not the result of the method call.
tags:
  - dart
  - oop
  - cascade
---

---
id: DART_OOP_011
category: Dart
subcategory: OOP
difficulty: hard
type: multiple_choice
question: "Which of the following statements about Dart Records (Dart 3) are correct?"
options:
  A: "Records are immutable and structurally typed"
  B: "Records support named fields and positional fields"
  C: "Records can be used as map keys because they have value equality"
  D: "Records can have methods defined on them"
correct_answer: "A,B,C"
explanation: |
  Dart Records (introduced in Dart 3) are anonymous immutable aggregate types.
  A: True — records are immutable; you cannot change their fields after creation.
  B: True — records support both positional `(1, 'hello')` and named `(x: 1, name: 'hello')` fields.
  C: True — records have structural equality (value equality), so they work as map keys.
  D: False — records cannot have methods. They only have auto-generated getters for their fields.
tags:
  - dart
  - oop
  - records
  - dart3
---

---
id: DART_OOP_012
category: Dart
subcategory: OOP
difficulty: hard
type: single_choice
question: "What does this pattern matching code do in Dart 3?"
code: |
  void describe(Object obj) {
    switch (obj) {
      case (int x, String s) when x > 0:
        print('Positive int $x with string $s');
      case (int x, String s):
        print('Non-positive int $x with string $s');
      default:
        print('Other');
    }
  }
code_lang: dart
options:
  A: "Compile error — `when` guard clauses are not supported in switch statements"
  B: "Destructures a Record, checking if it matches `(int, String)`, with a guard for the positive case"
  C: "Checks if `obj` is a List with two elements"
  D: "Runtime error — `Object` cannot be pattern-matched"
correct_answer: "B"
explanation: |
  Dart 3 pattern matching allows destructuring Records in switch cases.
  `case (int x, String s) when x > 0:` matches a Record of type `(int, String)` and
  additionally applies a `when` guard clause to further restrict the match.
  The `when` keyword is Dart 3's guard clause for patterns — it adds an extra boolean condition.
  This is a powerful combination of structural pattern matching with runtime guards.
tags:
  - dart
  - oop
  - pattern-matching
  - dart3
  - records
---

---
id: DART_OOP_013
category: Dart
subcategory: OOP
difficulty: medium
type: single_choice
question: "How do you overload the `+` operator in Dart?"
code: |
  class Vector {
    final double x, y;
    Vector(this.x, this.y);
    // How to implement addition?
  }
code_lang: dart
options:
  A: "`static Vector operator+(Vector a, Vector b) => Vector(a.x + b.x, a.y + b.y);`"
  B: "`Vector operator+(Vector other) => Vector(x + other.x, y + other.y);`"
  C: "`Vector add(Vector other) => Vector(x + other.x, y + other.y);` and annotate with `@operator`"
  D: "Dart does not support operator overloading"
correct_answer: "B"
explanation: |
  Dart supports operator overloading with the `operator` keyword followed by the operator symbol.
  The method is an instance method (not static) and receives one argument for binary operators.
  Supported overloadable operators include: `+`, `-`, `*`, `/`, `[]`, `[]=`, `==`, `<`, `>`, etc.
  Note: `==` overloading should also override `hashCode` to maintain consistency.
tags:
  - dart
  - oop
  - operator-overloading
---

---
id: DART_OOP_014
category: Dart
subcategory: OOP
difficulty: medium
type: single_choice
question: "What is the `late` keyword used for in Dart?"
options:
  A: "To declare a variable that will be initialized asynchronously"
  B: "To declare a non-nullable variable that is initialized after its declaration point, with a runtime check"
  C: "To delay garbage collection of an object"
  D: "To mark a field as lazily evaluated only when accessed the first time, cached thereafter (lazy initialization)"
correct_answer: "B"
explanation: |
  `late` has two uses: (1) declare a non-nullable variable that will be initialized before it is first used
  (runtime LateInitializationError if accessed before assignment), and (2) lazy initialization when combined
  with an initializer: `late final x = expensiveComputation()` — evaluated only on first access.
  Option D is actually also true for `late final` with an initializer. But the primary semantic of `late`
  without an initializer is deferring initialization with a runtime null check.
tags:
  - dart
  - oop
  - late
  - null-safety
---

---
id: DART_OOP_015
category: Dart
subcategory: OOP
difficulty: hard
type: single_choice
question: "What is the difference between `base class`, `final class`, and `interface class` in Dart 3?"
options:
  A: "`base` = can only extend, `final` = can only implement, `interface` = can only be mixed in"
  B: "`base` = can extend/mix-in but not implement outside library; `final` = neither extend nor implement outside; `interface` = can only implement outside"
  C: "All three prevent instantiation of the class itself"
  D: "`base`, `final`, and `interface` are interchangeable modifiers with the same effect"
correct_answer: "B"
explanation: |
  Dart 3 class modifiers control how a class can be used outside its library:
  - `base`: Allows being extended or mixed in, but NOT implemented (subclasses must also be base/final/sealed).
  - `final`: Prevents any form of extension, implementation, or mixin use outside the defining library.
  - `interface`: Allows being implemented, but NOT extended or mixed in outside the library.
  - `sealed`: Allows extending/implementing only within the same library (enables exhaustive switches).
tags:
  - dart
  - oop
  - class-modifiers
  - dart3
---
