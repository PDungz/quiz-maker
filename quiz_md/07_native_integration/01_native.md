---
id: NATIVE_001
category: Native Integration
subcategory: Platform Channels
difficulty: easy
type: single_choice
question: "What is a `MethodChannel` in Flutter and what is it used for?"
options:
  A: "MethodChannel is a state management solution"
  B: "MethodChannel enables bidirectional RPC-style communication between Flutter (Dart) and native code (Swift/Kotlin) — one call, one response"
  C: "MethodChannel streams continuous data from native to Flutter"
  D: "MethodChannel is deprecated — use Pigeon instead"
correct_answer: "B"
explanation: |
  MethodChannel implements a request-response pattern:
  
  Dart side (calls native):
    const _channel = MethodChannel('com.example.app/battery');
    final level = await _channel.invokeMethod<int>('getBatteryLevel');
  
  Android side (Kotlin):
    MethodChannel(flutterEngine.dartExecutor.binaryMessenger, "com.example.app/battery")
      .setMethodCallHandler { call, result ->
        if (call.method == "getBatteryLevel") {
          result.success(getBatteryLevel())
        } else result.notImplemented()
      }
  
  iOS side (Swift):
    FlutterMethodChannel(name: "com.example.app/battery", binaryMessenger: controller)
      .setMethodCallHandler { call, result in
        if call.method == "getBatteryLevel" { result(getBatteryLevel()) }
        else { result(FlutterMethodNotImplemented) }
      }
tags:
  - native
  - platform-channel
  - method-channel
---

---
id: NATIVE_002
category: Native Integration
subcategory: Platform Channels
difficulty: medium
type: single_choice
question: "What is the difference between `MethodChannel` and `EventChannel`?"
options:
  A: "MethodChannel is for iOS; EventChannel is for Android"
  B: "MethodChannel handles one-shot request/response; EventChannel handles continuous data streams from native to Flutter (accelerometer, BLE, location updates)"
  C: "EventChannel is deprecated — use MethodChannel with callbacks"
  D: "They are identical but EventChannel is faster"
correct_answer: "B"
explanation: |
  MethodChannel — request/response (one-shot):
  - Flutter calls a method → native returns ONE result
  - Use for: camera capture, biometrics check, battery level, file picker
  
  EventChannel — streaming from native to Flutter:
  - Native continuously pushes events → Flutter receives via Stream
  - Use for: accelerometer, GPS location, BLE scan, step counter, NFC
  
  Dart side (EventChannel):
    const _channel = EventChannel('com.example.app/sensors');
    Stream<dynamic> get sensorStream => _channel.receiveBroadcastStream();
  
  Native side sets up StreamHandler with onListen() and onCancel() methods.
  
  BasicMessageChannel — for passing arbitrary messages with a codec (JSON, string, binary).
tags:
  - native
  - platform-channel
  - event-channel
---

---
id: NATIVE_003
category: Native Integration
subcategory: Pigeon
difficulty: hard
type: single_choice
question: "What is Pigeon and what problem does it solve?"
options:
  A: "Pigeon is a networking library for Flutter"
  B: "Pigeon is a code generation tool that creates type-safe platform channel APIs, eliminating string-based method names and manual type casting"
  C: "Pigeon replaces Dio for HTTP requests"
  D: "Pigeon is a state management library"
correct_answer: "B"
explanation: |
  Without Pigeon: platform channels use string method names and dynamic types.
    await channel.invokeMethod('getUserById', {'id': '123'}); // no type safety
    // Native: call.method == 'getUserById' && call.arguments['id'] // manual casting
  
  With Pigeon: define a Dart API spec, Pigeon generates:
    // pigeons/user_api.dart
    @HostApi()
    abstract class UserApi {
      User getUserById(String id);
    }
  
  Generated: UserApi.dart (Dart), UserApi.kt (Kotlin), UserApi.swift (Swift)
  Type-safe, compile-time checked method names and parameters.
  
  Benefits:
  - Compile-time verification of API contract
  - No string typos in method names
  - Automatic null safety handling
  - Bidirectional (Flutter→Native via @HostApi, Native→Flutter via @FlutterApi)
tags:
  - native
  - pigeon
  - code-generation
  - platform-channel
---

---
id: NATIVE_004
category: Native Integration
subcategory: Deep Links
difficulty: medium
type: single_choice
question: "What is the difference between a custom scheme deep link and a Universal Link (iOS) / App Link (Android)?"
options:
  A: "They are identical — just different names per platform"
  B: "Custom scheme (myapp://...): simple but insecure — any app can register the same scheme. Universal/App Links (https://...): verified domain ownership, falls back to web browser if app not installed."
  C: "Universal Links only work on iOS; App Links only work on Android"
  D: "Custom schemes require a paid Apple developer account"
correct_answer: "B"
explanation: |
  Custom scheme deep links (myapp://product/123):
  - Easy to set up
  - NOT verified — another app can claim the same scheme (link hijacking risk)
  - If app not installed: nothing happens (no fallback)
  - Supported on both iOS and Android
  
  Universal Links (iOS) / App Links (Android) using HTTPS (https://yourapp.com/product/123):
  - Verified: app must prove ownership via well-known file on your domain
    iOS: https://yourapp.com/.well-known/apple-app-site-association
    Android: https://yourapp.com/.well-known/assetlinks.json
  - If app installed: opens app directly (no browser)
  - If app not installed: opens web browser (graceful fallback)
  - No link hijacking — domain ownership is verified
  
  Recommended for production apps. Use go_router + app_links package in Flutter.
tags:
  - native
  - deep-link
  - universal-link
  - app-link
---

---
id: NATIVE_005
category: Native Integration
subcategory: Deep Links
difficulty: medium
type: single_choice
question: "How do you handle a deep link when the app is already open vs when it's launched from cold start?"
options:
  A: "Deep links only work when the app is already open"
  B: "Cold start: getInitialLink() / getInitialUri(). Already open: onLink stream. Both cases need handling."
  C: "Deep links require restart of the app to process"
  D: "Use getInitialLink() for both cases"
correct_answer: "B"
explanation: |
  Using app_links package (or uni_links):
  
  Cold start (app launched from deep link):
    final appLinks = AppLinks();
    final uri = await appLinks.getInitialLink(); // may be null if not launched from link
    if (uri != null) handleDeepLink(uri);
  
  App already running (received link while open):
    appLinks.uriLinkStream.listen((uri) {
      handleDeepLink(uri);
    });
  
  Both need to be set up in main() or in an init widget:
    void _setupDeepLinks() async {
      // Cold start
      final uri = await _appLinks.getInitialLink();
      if (uri != null && mounted) context.go(uri.path);
      
      // Hot start (stream)
      _linkSub = _appLinks.uriLinkStream.listen((uri) {
        if (mounted) context.go(uri.path);
      });
    }
tags:
  - native
  - deep-link
  - navigation
---

---
id: NATIVE_006
category: Native Integration
subcategory: Native Lifecycle
difficulty: hard
type: single_choice
question: "How do you observe native app lifecycle events (foreground/background) in Flutter?"
options:
  A: "Flutter does not expose native lifecycle events"
  B: "Use WidgetsBindingObserver mixin and override didChangeAppLifecycleState()"
  C: "Use Platform.operatingSystem to check the current state"
  D: "Use a MethodChannel to query native lifecycle state"
correct_answer: "B"
explanation: |
  Implement WidgetsBindingObserver in your State:
    class _MyWidgetState extends State<MyWidget> with WidgetsBindingObserver {
      @override
      void initState() {
        super.initState();
        WidgetsBinding.instance.addObserver(this);
      }
      
      @override
      void dispose() {
        WidgetsBinding.instance.removeObserver(this);
        super.dispose();
      }
      
      @override
      void didChangeAppLifecycleState(AppLifecycleState state) {
        switch (state) {
          case AppLifecycleState.resumed:    // app in foreground, visible and active
          case AppLifecycleState.inactive:   // app in transition (iOS only: call, notification)
          case AppLifecycleState.paused:     // app in background (hidden)
          case AppLifecycleState.detached:   // app about to be killed
          case AppLifecycleState.hidden:     // Flutter 3.13+ (desktop: window minimized)
        }
      }
    }
tags:
  - native
  - lifecycle
  - app-lifecycle
  - widgets-binding-observer
---

---
id: NATIVE_007
category: Native Integration
subcategory: SDK Integration
difficulty: medium
type: single_choice
question: "How do you integrate a third-party native Android SDK (AAR/Gradle dependency) into Flutter?"
options:
  A: "Add the SDK to pubspec.yaml like any Flutter package"
  B: "Add the Maven/AAR dependency in android/app/build.gradle, then expose functionality to Flutter via a MethodChannel or a custom Flutter plugin"
  C: "Native SDKs cannot be used with Flutter"
  D: "Use a JS bridge to connect the SDK"
correct_answer: "B"
explanation: |
  Steps to integrate a native Android SDK:
  
  1. Add dependency in android/app/build.gradle:
       dependencies {
         implementation 'com.example:native-sdk:1.0.0'
         // or for AAR: implementation files('libs/native-sdk.aar')
       }
  
  2. Create a MethodChannel to expose SDK functionality:
       class NativeSdkPlugin(private val context: Context) : MethodCallHandler {
         override fun onMethodCall(call: MethodCall, result: Result) {
           when (call.method) {
             "initSdk" -> { NativeSdk.init(context, call.argument("apiKey")); result.success(null) }
             "doAction" -> result.success(NativeSdk.performAction())
             else -> result.notImplemented()
           }
         }
       }
  
  3. Register in MainActivity or via plugin registration.
  
  For reusable SDKs: create a proper Flutter plugin with `flutter create --template=plugin`.
tags:
  - native
  - android
  - sdk-integration
  - platform-channel
---

---
id: NATIVE_008
category: Native Integration
subcategory: FlutterEngine
difficulty: hard
type: single_choice
question: "What is the difference between `FlutterActivity` and `FlutterFragment` when embedding Flutter in a native app?"
options:
  A: "FlutterActivity is for iOS; FlutterFragment is for Android"
  B: "FlutterActivity extends AppCompatActivity — use when Flutter IS the whole screen. FlutterFragment embeds Flutter inside an existing native Activity — use for add-to-app scenarios."
  C: "FlutterFragment is deprecated in favor of FlutterActivity"
  D: "They are identical"
correct_answer: "B"
explanation: |
  FlutterActivity:
  - A standalone Activity that hosts a full-screen Flutter view
  - Simple: extend FlutterActivity and you're done
  - Use for: hybrid apps where some screens are Flutter (full screen)
    Intent(context, FlutterActivity::class.java).also { startActivity(it) }
  
  FlutterFragment:
  - Embeds Flutter UI within an existing native Activity
  - Flutter occupies part of the screen alongside native views
  - Requires a FlutterEngine to be pre-warmed for performance
    val flutterFragment = FlutterFragment.createDefault()
    supportFragmentManager.beginTransaction().add(R.id.flutter_container, flutterFragment).commit()
  
  FlutterEngine pre-warming: create a FlutterEngine early to reduce first-render latency.
    FlutterEngineCache.getInstance().put("my_engine", FlutterEngine(context))
tags:
  - native
  - flutter-engine
  - flutter-activity
  - flutter-fragment
---

---
id: NATIVE_009
category: Native Integration
subcategory: Platform Channels
difficulty: hard
type: single_choice
question: "What are the supported data types that can be passed through a Flutter MethodChannel?"
options:
  A: "Only String and int"
  B: "null, bool, int, double, String, Uint8List, Int32List, Int64List, Float64List, List, Map — StandardMessageCodec handles serialization"
  C: "Any Dart object can be passed through MethodChannel"
  D: "Only JSON-serializable objects"
correct_answer: "B"
explanation: |
  MethodChannel uses StandardMessageCodec by default, which supports:
  - null
  - bool
  - int (32-bit and 64-bit)
  - double (64-bit)
  - String (UTF-8)
  - Uint8List, Int32List, Int64List, Float64List (typed arrays — efficient for binary data)
  - List (of any supported type, including nested Lists/Maps)
  - Map (String or int keys, any supported type values)
  
  To pass complex objects: serialize to Map<String, dynamic> first.
  To pass binary data: use Uint8List (more efficient than base64 String).
  
  Custom codecs available: JSONMessageCodec, StringCodec, BinaryCodec.
  Pigeon uses StandardMessageCodec but generates the serialization code automatically.
tags:
  - native
  - platform-channel
  - message-codec
---

---
id: NATIVE_010
category: Native Integration
subcategory: iOS
difficulty: hard
type: single_choice
question: "What are the limitations of handling VoIP calls with Flutter on iOS?"
options:
  A: "Flutter fully supports VoIP calls with the same capabilities as native apps"
  B: "Flutter cannot wake from terminated state for VoIP pushes — PushKit and CallKit require native Swift code. Flutter can only handle calls after the native layer has processed them."
  C: "VoIP calls require Android — iOS does not support VoIP"
  D: "Flutter's FCM can handle VoIP pushes with content_available: true"
correct_answer: "B"
explanation: |
  iOS VoIP (CallKit + PushKit) limitations with Flutter:
  
  PushKit (VoIP pushes):
  - Can wake a terminated iOS app for incoming calls
  - MUST be handled in native Swift code (AppDelegate)
  - Flutter cannot respond to PushKit pushes directly — you need a native plugin
  
  CallKit:
  - Native iOS framework for displaying system call UI
  - Must be implemented in Swift — Flutter can receive events via MethodChannel
  
  Packages: flutter_callkit_incoming provides a plugin that handles CallKit+PushKit
  on the native side and exposes events to Flutter.
  
  Important: Apple requires that every PushKit notification results in a CallKit
  report, or Apple may revoke VoIP push entitlement.
  
  Regular FCM (APNs): cannot reliably wake a terminated app for real-time calls.
tags:
  - native
  - ios
  - voip
  - callkit
  - pushkit
---

---
id: NATIVE_011
category: Native Integration
subcategory: Platform Channels
difficulty: medium
type: single_choice
question: "On which thread do platform channel callbacks execute, and why does it matter?"
options:
  A: "Platform channel callbacks always execute on the Dart UI thread"
  B: "Platform channel callbacks from native to Flutter execute on the platform thread (main OS thread). Never do heavy work there — dispatch to background thread first."
  C: "Platform channel callbacks execute on a background thread automatically"
  D: "Thread management is handled automatically — no concern needed"
correct_answer: "B"
explanation: |
  MethodChannel calls from Flutter → Native run on the platform thread (main UI thread on Android/iOS).
  
  Problem: long-running native operations on the platform thread freeze the UI.
  
  Android fix — dispatch to background:
    MethodChannel.setMethodCallHandler { call, result ->
      GlobalScope.launch(Dispatchers.IO) {          // background coroutine
        val data = heavyDatabaseOperation()
        withContext(Dispatchers.Main) {
          result.success(data)                       // respond on main thread
        }
      }
    }
  
  iOS fix:
    DispatchQueue.global(qos: .background).async {
      let data = heavyOperation()
      DispatchQueue.main.async { result(data) }      // respond on main thread
    }
  
  Method results must be sent on the platform thread (main thread), not background threads.
tags:
  - native
  - platform-channel
  - threading
---

---
id: NATIVE_012
category: Native Integration
subcategory: SDK Integration
difficulty: medium
type: single_choice
question: "How do you create a reusable Flutter plugin that wraps a native SDK?"
options:
  A: "Add the native code directly to the app's android/ and ios/ folders"
  B: "Use `flutter create --template=plugin my_plugin` to generate a plugin package with Dart API, Android/iOS implementations, and an example app"
  C: "Plugins require submitting to pub.dev — private plugins are not possible"
  D: "Only Google can create Flutter plugins"
correct_answer: "B"
explanation: |
  Creating a plugin:
    flutter create --template=plugin --platforms=android,ios my_native_sdk
  
  Generated structure:
    my_native_sdk/
      lib/my_native_sdk.dart          # Dart API
      android/src/.../MyNativeSdk.kt  # Android implementation
      ios/Classes/MyNativeSdkPlugin.swift  # iOS implementation
      example/                         # example app for testing
  
  Plugin structure:
  - Dart side defines the public API and calls MethodChannel
  - Native sides implement the MethodCallHandler
  
  Private (local) plugin: reference in pubspec.yaml:
    dependencies:
      my_native_sdk:
        path: ../my_native_sdk
  
  Federated plugins: separate packages per platform (community standard for pub.dev).
tags:
  - native
  - plugin
  - sdk-integration
---

---
id: NATIVE_013
category: Native Integration
subcategory: Deep Links
difficulty: easy
type: single_choice
question: "What is required on Android to configure App Links (HTTPS deep links)?"
options:
  A: "Only update AndroidManifest.xml"
  B: "Add intent-filter with autoVerify=true in AndroidManifest.xml AND host a Digital Asset Links JSON file at yourdomain.com/.well-known/assetlinks.json"
  C: "App Links are configured in Google Play Console only"
  D: "App Links require a signed production build — they don't work in debug mode"
correct_answer: "B"
explanation: |
  Android App Links setup:
  
  1. AndroidManifest.xml:
    <intent-filter android:autoVerify="true">
      <action android:name="android.intent.action.VIEW"/>
      <category android:name="android.intent.category.DEFAULT"/>
      <category android:name="android.intent.category.BROWSABLE"/>
      <data android:scheme="https" android:host="yourapp.com"/>
    </intent-filter>
  
  2. Host Digital Asset Links at:
    https://yourapp.com/.well-known/assetlinks.json
    [{
      "relation": ["delegate_permission/common.handle_all_urls"],
      "target": {
        "namespace": "android_app",
        "package_name": "com.example.app",
        "sha256_cert_fingerprints": ["AA:BB:..."]
      }
    }]
  
  Android verifies ownership at install time (autoVerify). If verification fails,
  the link opens in browser instead of app.
tags:
  - native
  - android
  - app-link
  - deep-link
---

---
id: NATIVE_014
category: Native Integration
subcategory: iOS
difficulty: hard
type: single_choice
question: "What is required to configure Universal Links on iOS?"
options:
  A: "Only add a URL scheme in Info.plist"
  B: "Add Associated Domains capability in Xcode (applinks:yourdomain.com) AND host an Apple App Site Association (AASA) file at yourdomain.com/.well-known/apple-app-site-association"
  C: "Universal Links are configured in App Store Connect only"
  D: "Universal Links require iOS 15+"
correct_answer: "B"
explanation: |
  iOS Universal Links setup:
  
  1. Xcode → Target → Signing & Capabilities → Add Associated Domains:
     applinks:yourapp.com
  
  2. Host AASA file at https://yourapp.com/.well-known/apple-app-site-association:
    {
      "applinks": {
        "apps": [],
        "details": [{
          "appID": "TEAM_ID.com.example.app",
          "paths": ["/products/*", "/orders/*"]
        }]
      }
    }
  
  iOS downloads and caches the AASA file at install time via Apple's CDN.
  
  3. Handle in AppDelegate (Swift) — or in Flutter via go_router + app_links.
  
  Note: AASA file MUST be served via HTTPS, no redirects, content-type application/json.
tags:
  - native
  - ios
  - universal-link
  - associated-domains
---

---
id: NATIVE_015
category: Native Integration
subcategory: Platform Channels
difficulty: medium
type: single_choice
question: "What does `BasicMessageChannel` provide that `MethodChannel` doesn't?"
options:
  A: "BasicMessageChannel is faster than MethodChannel"
  B: "BasicMessageChannel supports bidirectional messaging without request-response semantics — both sides can send messages at any time, using any MessageCodec"
  C: "BasicMessageChannel streams data like EventChannel"
  D: "BasicMessageChannel is the same as MethodChannel — just older API"
correct_answer: "B"
explanation: |
  MethodChannel: request-response (Flutter calls native, native responds once).
  EventChannel: native → Flutter continuous stream.
  BasicMessageChannel: flexible bidirectional message passing.
  
  - Both Flutter and native can send messages at any time
  - Uses pluggable MessageCodec: JSONMessageCodec, StringCodec, BinaryCodec, StandardMessageCodec
  - No concept of method names — just raw message passing
  
  Use cases:
  - Custom binary protocols
  - Integration with native libs that have callback-based APIs
  - Implementing custom serialization formats
  
  Example:
    const channel = BasicMessageChannel<String>('com.example/messages', StringCodec());
    channel.send('Hello from Dart');
    channel.setMessageHandler((message) async {
      return 'Got: $message';
    });
tags:
  - native
  - platform-channel
  - basic-message-channel
---
