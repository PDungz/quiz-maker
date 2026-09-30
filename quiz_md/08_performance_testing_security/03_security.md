---
id: SEC_001
category: Security
subcategory: Storage
difficulty: easy
type: single_choice
question: "Why should you NOT store sensitive data in `SharedPreferences`?"
options:
  A: "SharedPreferences is too slow for sensitive data"
  B: "SharedPreferences stores data as plain-text XML on Android / plist on iOS — readable on rooted devices, ADB backup, or macOS file access without encryption"
  C: "SharedPreferences doesn't support String values"
  D: "It causes memory leaks on Android"
correct_answer: "B"
explanation: |
  SharedPreferences storage:
  - Android: /data/data/<package>/shared_prefs/*.xml (plain XML)
  - iOS: NSUserDefaults → Library/Preferences/*.plist (unencrypted)
  
  Risks:
  - Rooted/jailbroken device: any app or tool can read these files
  - ADB backup (Android): adb backup -noapk exports SharedPreferences
  - macOS File Sharing / iTunes backup: iOS prefs exposed without encryption
  
  For sensitive data use:
    flutter_secure_storage:
    - Android: Android Keystore System (hardware-backed encryption)
    - iOS: Keychain Services (Secure Enclave on modern devices)
    
    await _storage.write(key: 'auth_token', value: token);
    final token = await _storage.read(key: 'auth_token');
  
  Never store in SharedPreferences: JWTs, API keys, passwords, biometric data, PII.
tags:
  - security
  - storage
  - shared-preferences
  - secure-storage
---

---
id: SEC_002
category: Security
subcategory: Storage
difficulty: medium
type: single_choice
question: "How does `flutter_secure_storage` protect data on Android and iOS?"
options:
  A: "It encrypts data with a password entered by the user"
  B: "Android: uses Android Keystore System (hardware-backed key storage). iOS: uses Keychain Services. Encryption keys are protected by the OS/hardware, never exposed to app code."
  C: "It stores data in an encrypted SQLite database in the app's documents directory"
  D: "flutter_secure_storage is not secure — it just base64-encodes the data"
correct_answer: "B"
explanation: |
  Android Keystore System:
  - Cryptographic keys stored in hardware-backed secure element (TEE/SE)
  - Key material never leaves the secure hardware
  - flutter_secure_storage: encrypts value using AES-256, key stored in Keystore
  - Can require biometric authentication to access keys (authenticationRequired option)
  
  iOS Keychain Services:
  - Hardware-encrypted storage (Secure Enclave on A-series chips)
  - Access controlled by kSecAttrAccessible (lock screen state)
  - Survives app reinstalls (unless kSecAttrAccessGroup not set)
  - Syncs to iCloud Keychain optionally
  
  Configuration options:
    const storage = FlutterSecureStorage(
      aOptions: AndroidOptions(encryptedSharedPreferences: true),
      iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
    );
tags:
  - security
  - secure-storage
  - keystore
  - keychain
---

---
id: SEC_003
category: Security
subcategory: Root Detection
difficulty: hard
type: single_choice
question: "Why is root/jailbreak detection important and what are its limitations?"
options:
  A: "Root detection is not needed for Flutter apps"
  B: "Root/jailbreak detection warns about compromised devices where security guarantees break down (file system access, SSL bypass, code injection). Limitation: determined attackers can bypass detection."
  C: "Root detection blocks the app for all users"
  D: "Root detection is handled automatically by Firebase"
correct_answer: "B"
explanation: |
  Why detect root/jailbreak:
  - Rooted Android: attacker can read secure storage, bypass SSL pinning (with Frida/xposed)
  - Jailbroken iOS: runtime hooks, bypass biometric auth, dump app memory
  - Financial apps, health apps, government apps often require it
  
  Detection methods (flutter_jailbreak_detection):
  - Android: check for su binary, Busybox, known root APKs (Magisk), test/eng build tags
  - iOS: check for Cydia, jailbreak files (/bin/bash, /private/jailbreak.sh), writeable /private
  
  Responses to detected device:
  - Show warning and allow use (common for non-critical features)
  - Block app usage (banking, payment, government apps)
  - Clear sensitive data and logout
  
  Limitations:
  - Advanced rooting tools (Magisk with DenyList) specifically hide from detection
  - Can cause false positives on legitimate test devices or custom ROMs
  - Not a complete security solution — use defense in depth
tags:
  - security
  - root-detection
  - jailbreak
---

---
id: SEC_004
category: Security
subcategory: Obfuscation
difficulty: medium
type: single_choice
question: "How do you obfuscate a Flutter release build and why is it important?"
options:
  A: "Obfuscation is enabled by default in release builds — no action needed"
  B: "Use --obfuscate and --split-debug-info flags when building. Renames classes/functions to random names, making reverse engineering harder."
  C: "Obfuscation only applies to native Android code"
  D: "Obfuscation makes the app unable to report crash stack traces"
correct_answer: "B"
explanation: |
  Flutter obfuscation:
    flutter build apk --obfuscate --split-debug-info=./debug-symbols/
    flutter build ios --obfuscate --split-debug-info=./debug-symbols/
  
  --obfuscate: renames Dart classes, methods, and fields to random names.
  A class like LoginBloc becomes something like aB3.cD5().
  
  --split-debug-info=<dir>: writes symbol maps to the specified directory.
  Required to decode crash stack traces from the obfuscated binary.
  
  Why important:
  - Reverse engineering: attackers use tools like jadx/objection to read app logic
  - API key extraction: obfuscation adds friction (not a complete solution — see secure storage)
  - Business logic protection: payment algorithms, scoring systems
  
  Crashlytics integration: upload .symbols file to Firebase for stack trace decoding.
    firebase crashlytics:symbols:upload --app=<APP_ID> ./debug-symbols/
tags:
  - security
  - obfuscation
  - release-build
  - crashlytics
---

---
id: SEC_005
category: Security
subcategory: Secrets
difficulty: hard
type: single_choice
question: "What is the correct way to manage API keys and secrets in a Flutter app?"
options:
  A: "Store API keys in pubspec.yaml — it's not compiled into the binary"
  B: "Store keys in a .env file and access via flutter_dotenv — keys end up in the binary but are obfuscated"
  C: "Never hardcode secrets in the app. Use backend-proxied calls, Remote Config for non-sensitive config, or native secure enclaves for truly secret keys."
  D: "Store keys in SharedPreferences encrypted with a hardcoded password"
correct_answer: "C"
explanation: |
  EVERYTHING in the Flutter binary can be extracted by a determined attacker.
  String in Dart code, .env file loaded at runtime, even obfuscated code.
  
  Correct approaches by sensitivity:
  
  Non-sensitive config (API base URLs, feature flags):
  - Firebase Remote Config (fetched at runtime, not in binary)
  - Build-time environment variables (--dart-define=API_URL=...) — in binary but non-secret
  
  Moderately sensitive (analytics keys):
  - Accept some risk; obfuscate; monitor for abuse
  
  Truly sensitive (payment signing keys, private keys):
  - NEVER in the app binary
  - Keep on your backend server
  - App calls YOUR backend, backend calls the sensitive service
  - Rotate keys when leaked
  
  Rule: if the key being exposed would cause a security breach, it belongs on your server.
tags:
  - security
  - secrets
  - api-keys
  - best-practices
---

---
id: SEC_006
category: Security
subcategory: Tampering
difficulty: hard
type: single_choice
question: "What is app binary tampering and what defenses can a Flutter app implement?"
options:
  A: "App tampering is impossible on iOS due to code signing"
  B: "Tampering = modifying the APK/IPA to bypass security checks (e.g., remove root detection). Defenses: integrity checks, Google Play Integrity API, App Attest (iOS), Firebase App Check."
  C: "Tampering can be fully prevented with obfuscation"
  D: "Tampering only affects Android apps"
correct_answer: "B"
explanation: |
  App tampering attacks:
  - Attacker extracts APK, modifies Smali/Dart bytecode (remove root checks, change API endpoints)
  - Re-signs with attacker's cert and distributes
  - Used to unlock premium features, bypass payment, extract data
  
  Defenses:
  
  Google Play Integrity API (Android):
  - Cryptographic proof the app is unmodified AND from Play Store
  - Detects unofficial installs, emulators, tampered binaries
  
  App Attest (iOS):
  - Apple hardware attestation that app is genuine
  - Private key generated in Secure Enclave, certified by Apple
  
  Firebase App Check: wraps both APIs and enforces on Firebase backend.
  
  Self-integrity check (weaker):
  - Check APK signature hash at runtime
  - Compare against expected value (easier to bypass but adds friction)
  
  Reality: no client-side defense is unbreakable. Use server-side validation for critical operations.
tags:
  - security
  - tampering
  - app-check
  - play-integrity
---

---
id: SEC_007
category: Security
subcategory: Network
difficulty: medium
type: single_choice
question: "What is the Network Security Configuration (Android) and App Transport Security (iOS)?"
options:
  A: "They are optional performance optimizations"
  B: "Platform-level security policies that enforce HTTPS, restrict allowed certificate authorities, and configure certificate pinning at the OS level"
  C: "They are Firebase features for securing network traffic"
  D: "These replace the need for SSL pinning in code"
correct_answer: "B"
explanation: |
  Android Network Security Config (res/xml/network_security_config.xml):
    <network-security-config>
      <domain-config>
        <domain includeSubdomains="true">api.example.com</domain>
        <pin-set>
          <pin digest="SHA-256">base64EncodedPin==</pin>
        </pin-set>
      </domain-config>
      <base-config cleartextTrafficPermitted="false"/> <!-- HTTPS only -->
    </network-security-config>
  
  Declared in AndroidManifest.xml:
    android:networkSecurityConfig="@xml/network_security_config"
  
  iOS App Transport Security (Info.plist):
  - Enforces HTTPS for all connections by default (iOS 9+)
  - NSExceptionDomains: whitelist specific domains for HTTP (discouraged)
  - NSAllowsArbitraryLoads: disable ATS (bad practice — App Store rejects without justification)
  
  These OS-level policies add defense-in-depth alongside code-level pinning.
tags:
  - security
  - network
  - android
  - ios
  - ssl-pinning
---

---
id: SEC_008
category: Security
subcategory: Authentication
difficulty: medium
type: single_choice
question: "What is biometric authentication in Flutter and how do you implement it securely?"
options:
  A: "Biometric authentication stores the user's fingerprint in the app"
  B: "Use local_auth package to authenticate locally via fingerprint/face. The OS verifies biometrics using Secure Enclave/TEE — the app never sees biometric data."
  C: "Biometric authentication sends biometric data to the server"
  D: "Biometrics are only for unlocking the device, not for in-app authentication"
correct_answer: "B"
explanation: |
  Biometric authentication with local_auth:
    final auth = LocalAuthentication();
    final canBio = await auth.canCheckBiometrics;
    final available = await auth.getAvailableBiometrics();
    
    final authenticated = await auth.authenticate(
      localizedReason: 'Confirm your identity to proceed',
      options: const AuthenticationOptions(
        stickyAuth: true,          // don't cancel on app backgrounding
        biometricOnly: false,      // allow PIN fallback
        sensitiveTransaction: true, // iOS: shows "Use Passcode" button
      ),
    );
  
  Security model:
  - Biometric data NEVER leaves the Secure Enclave/TEE
  - The app receives only bool (success/failure)
  - On Android: Biometric Prompt is OS-level UI
  - On iOS: FaceID/TouchID is handled by LocalAuthentication framework
  
  Use case: unlock secure storage, confirm transactions, gate sensitive features.
tags:
  - security
  - biometrics
  - local-auth
  - authentication
---

---
id: SEC_009
category: Security
subcategory: Data Validation
difficulty: medium
type: single_choice
question: "What is input validation and why is it important in Flutter forms?"
options:
  A: "Input validation is only needed on the server — the client can accept anything"
  B: "Client-side validation: improve UX with immediate feedback. Server-side validation: enforce security — never trust client input. Both are necessary."
  C: "Flutter's Form widget validates all input automatically"
  D: "Input validation prevents SQL injection in local databases"
correct_answer: "B"
explanation: |
  Client-side validation (Flutter Form + TextFormField validator):
  - Immediate user feedback (no network round-trip)
  - Prevents obviously wrong inputs
  - NOT a security control — can be bypassed
    validator: (value) {
      if (value == null || value.isEmpty) return 'Required';
      if (!RegExp(r'^[\w.-]+@[\w.-]+\.\w+$').hasMatch(value)) return 'Invalid email';
      return null;
    }
  
  Server-side validation (REQUIRED for security):
  - Validate every field regardless of client
  - Prevent: SQL injection, XSS, oversized payloads, invalid states
  - Return 422 Unprocessable Entity with field errors
  
  Defense in depth: sanitize display data (never use raw HTML from API in widgets),
  validate lengths, use typed APIs (Pigeon/strongly-typed models).
tags:
  - security
  - input-validation
  - forms
---

---
id: SEC_010
category: Security
subcategory: Certificates
difficulty: hard
type: single_choice
question: "What is the difference between pinning a certificate vs pinning a public key?"
options:
  A: "They are identical in security level"
  B: "Certificate pinning: pins the exact certificate (expires when cert rotates, app update needed). Public key pinning: pins the public key (survives certificate renewal as long as the key pair stays the same, no app update for renewal)"
  C: "Public key pinning is less secure than certificate pinning"
  D: "Certificate pinning works on iOS only; public key pinning is Android only"
correct_answer: "B"
explanation: |
  Certificate pinning:
  - Pin: SHA-256 of the full DER-encoded certificate
  - Breaks when cert expires/renews (different cert = different pin)
  - Requires app update on certificate rotation (every 1-3 years)
  
  Public key pinning:
  - Pin: SHA-256 of the SubjectPublicKeyInfo (SPKI) extracted from the cert
  - The public key stays the same when renewing a certificate (if same key pair used)
  - App doesn't need updating on certificate renewal (only on key change)
  - More resilient, preferred approach
  
  Implementation:
    // Extract SPKI from cert:
    openssl x509 -in cert.pem -pubkey -noout | openssl pkey -pubin -outform DER | openssl dgst -sha256 -binary | base64
  
  Include backup pins (for certificate rotation) to prevent accidental app lockout.
tags:
  - security
  - ssl-pinning
  - certificate
  - public-key-pinning
---
