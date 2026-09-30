---
id: DEVOPS_001
category: DevOps
subcategory: Flavors
difficulty: medium
type: single_choice
question: "What are Flutter flavors and why are they needed?"
options:
  A: "Flavors are UI themes for the app"
  B: "Flavors create distinct build variants (dev/staging/prod) with different app IDs, names, Firebase configs, API endpoints, and icons — from the same codebase"
  C: "Flavors are only for Android — iOS uses schemes"
  D: "Flavors require separate repositories for each environment"
correct_answer: "B"
explanation: |
  Flutter flavors solve the problem of multiple environments from one codebase:
  
  Typical flavors: development, staging, production
  
  Per-flavor configuration:
  - App bundle ID: com.example.app.dev / com.example.app (prod)
  - App name: "MyApp Dev" / "MyApp"
  - Firebase project: separate google-services.json / GoogleService-Info.plist
  - API base URL: https://dev-api.example.com / https://api.example.com
  - App icon: with "DEV" badge / clean icon
  
  Run with flavor:
    flutter run --flavor dev -t lib/main_dev.dart
    flutter run --flavor prod -t lib/main_prod.dart
  
  Each main_*.dart configures the app differently before runApp().
  dart-define is an alternative: flutter run --dart-define=ENV=dev
tags:
  - devops
  - flavors
  - environments
---

---
id: DEVOPS_002
category: DevOps
subcategory: Flavors
difficulty: hard
type: single_choice
question: "How do you configure different Firebase projects per flavor in Flutter?"
options:
  A: "Use one Firebase project and switch collections based on flavor"
  B: "Place flavor-specific google-services.json in android/app/src/<flavor>/ and use flutterfire configure --flavor to generate per-flavor firebase_options.dart"
  C: "Configure Firebase programmatically using environment variables"
  D: "Firebase does not support multiple projects for the same app"
correct_answer: "B"
explanation: |
  Android:
  Place in Android source sets:
    android/app/src/dev/google-services.json     → dev Firebase project
    android/app/src/staging/google-services.json
    android/app/src/prod/google-services.json
  
  Gradle picks the correct file based on the active flavor automatically.
  
  iOS:
    ios/config/dev/GoogleService-Info.plist
    ios/config/staging/GoogleService-Info.plist
    ios/config/prod/GoogleService-Info.plist
  
  Add a build phase script to copy the correct plist based on the build configuration.
  
  FlutterFire CLI (recommended):
    flutterfire configure --project=my-app-dev --out=lib/firebase_options_dev.dart
    flutterfire configure --project=my-app-prod --out=lib/firebase_options_prod.dart
  
  In main_dev.dart:
    await Firebase.initializeApp(options: DevFirebaseOptions.currentPlatform);
tags:
  - devops
  - firebase
  - flavors
  - multi-environment
---

---
id: DEVOPS_003
category: DevOps
subcategory: Code Signing
difficulty: hard
type: single_choice
question: "What are the required steps for signing a Flutter Android app for release?"
options:
  A: "Android apps are signed automatically by Flutter"
  B: "Generate a keystore, create key.properties referencing it, configure signingConfigs in build.gradle, never commit keystore to version control"
  C: "Only Play Console signs the APK — no local signing needed"
  D: "Signing is only required for AAB, not APK"
correct_answer: "B"
explanation: |
  Android release signing steps:
  
  1. Generate keystore (once):
    keytool -genkey -v -keystore upload-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload
  
  2. Create android/key.properties (NEVER commit to git):
    storePassword=<keystore-password>
    keyPassword=<key-password>
    keyAlias=upload
    storeFile=../upload-keystore.jks
  
  3. Configure android/app/build.gradle:
    def keystoreProperties = new Properties()
    keystoreProperties.load(new FileInputStream(rootProject.file('key.properties')))
    
    android {
      signingConfigs {
        release {
          keyAlias keystoreProperties['keyAlias']
          keyPassword keystoreProperties['keyPassword']
          storeFile file(keystoreProperties['storeFile'])
          storePassword keystoreProperties['storePassword']
        }
      }
      buildTypes { release { signingConfig signingConfigs.release } }
    }
  
  4. Build: flutter build appbundle --release
  
  In CI: store keystore as base64-encoded secret, decode at build time.
tags:
  - devops
  - android
  - signing
  - keystore
---

---
id: DEVOPS_004
category: DevOps
subcategory: Code Signing
difficulty: hard
type: single_choice
question: "What are iOS Provisioning Profiles and Code Signing Certificates?"
options:
  A: "Provisioning Profiles are optional for TestFlight builds"
  B: "Certificate = developer identity (private key + Apple-signed public cert). Provisioning Profile = file tying app bundle ID + certificate + device list (dev) or distribution method (AppStore/AdHoc)"
  C: "iOS signing is fully automatic — no manual configuration needed"
  D: "Certificates are only for the App Store — debug builds don't need them"
correct_answer: "B"
explanation: |
  iOS code signing components:
  
  Certificate (.p12):
  - Development cert: sign apps for local devices
  - Distribution cert: sign apps for App Store, Ad Hoc, or Enterprise
  - Has an expiry (1-3 years)
  - Private key stays on your machine (export as .p12 for CI)
  
  Provisioning Profile (.mobileprovision):
  - Development: lists specific device UDIDs allowed to run the app
  - App Store: allows distribution via App Store
  - Ad Hoc: allows up to 100 registered devices
  - Enterprise: company internal distribution (requires Enterprise account)
  
  App ID: registered bundle identifier (com.example.app)
  Must match CFBundleIdentifier in Xcode.
  
  Fastlane match: stores all certs/profiles encrypted in a git repo,
  allowing easy sharing across team and CI/CD.
tags:
  - devops
  - ios
  - signing
  - certificates
  - provisioning-profile
---

---
id: DEVOPS_005
category: DevOps
subcategory: Fastlane
difficulty: medium
type: single_choice
question: "What is Fastlane and how does it help Flutter CI/CD?"
options:
  A: "Fastlane is a Flutter package for fast networking"
  B: "Fastlane is a Ruby-based automation tool for mobile CI/CD — automates building, testing, code signing, and distributing iOS and Android apps"
  C: "Fastlane is only for iOS — Android uses Gradle scripts"
  D: "Fastlane replaces Xcode and Android Studio"
correct_answer: "B"
explanation: |
  Fastlane key lanes for Flutter:
  
  fastlane/Fastfile:
    lane :beta do
      build_number = number_of_commits
      
      # Flutter build
      sh "flutter build appbundle --release --build-number=#{build_number}"
      
      # Upload to Play Store internal track
      supply(
        aab: '../build/app/outputs/bundle/release/app-release.aab',
        track: 'internal',
        json_key: 'play-store-key.json'
      )
    end
  
  Fastlane tools:
  - match: manages code signing (certs + profiles in git)
  - pilot: uploads to TestFlight
  - deliver: uploads to App Store Connect
  - supply: uploads to Google Play
  - increment_build_number: auto-increments build numbers
  
  Run: fastlane beta or fastlane ios beta
tags:
  - devops
  - fastlane
  - cicd
  - automation
---

---
id: DEVOPS_006
category: DevOps
subcategory: GitHub Actions
difficulty: medium
type: single_choice
question: "What is a typical GitHub Actions workflow structure for a Flutter app?"
options:
  A: "GitHub Actions only works for web apps — use Codemagic for mobile"
  B: "A YAML workflow file in .github/workflows/ that defines triggers, jobs with steps: setup Java/Flutter, restore pub cache, run tests, build, and upload artifacts"
  C: "GitHub Actions requires a paid GitHub plan for mobile"
  D: "GitHub Actions can only run on Ubuntu — not macOS for iOS builds"
correct_answer: "B"
explanation: |
  Example .github/workflows/flutter_ci.yml:
    name: Flutter CI
    on: [push, pull_request]
    jobs:
      test-and-build:
        runs-on: ubuntu-latest  # macos-latest for iOS
        steps:
          - uses: actions/checkout@v4
          - uses: actions/setup-java@v4
            with: { distribution: 'temurin', java-version: '17' }
          - uses: subosito/flutter-action@v2
            with: { flutter-version: '3.x', channel: 'stable' }
          - name: Cache pub packages
            uses: actions/cache@v4
            with:
              path: ~/.pub-cache
              key: ${{ runner.os }}-pub-${{ hashFiles('pubspec.lock') }}
          - run: flutter pub get
          - run: flutter test
          - run: flutter build apk --release
          - uses: actions/upload-artifact@v4
            with: { name: app-release, path: build/app/outputs/flutter-apk/app-release.apk }
tags:
  - devops
  - github-actions
  - cicd
  - flutter
---

---
id: DEVOPS_007
category: DevOps
subcategory: Codemagic
difficulty: medium
type: single_choice
question: "What does a Codemagic `codemagic.yaml` workflow configure?"
options:
  A: "Codemagic only supports a GUI — it has no YAML configuration"
  B: "codemagic.yaml defines the build environment (machine type), triggers, environment variables, build scripts (test/build/deploy steps), and publishing destinations (App Store, Play Store, Firebase)"
  C: "Codemagic YAML is only for Flutter web builds"
  D: "codemagic.yaml replaces pubspec.yaml"
correct_answer: "B"
explanation: |
  Example codemagic.yaml structure:
    workflows:
      flutter-release:
        name: Flutter Release
        instance_type: mac_mini_m2  # or linux_x2
        triggering:
          events: [push]
          branch_patterns: [{pattern: 'main', include: true}]
        environment:
          flutter: stable
          vars:
            KEYSTORE_PASSWORD: $KEYSTORE_PASSWORD  # from Codemagic secrets
        scripts:
          - name: Install dependencies
            script: flutter pub get
          - name: Run tests
            script: flutter test
          - name: Build Android
            script: |
              flutter build appbundle --release \
                --dart-define=API_URL=$API_URL
        artifacts:
          - build/**/outputs/**/*.aab
        publishing:
          google_play:
            credentials: $GOOGLE_PLAY_KEY
            track: internal
tags:
  - devops
  - codemagic
  - cicd
  - yaml
---

---
id: DEVOPS_008
category: DevOps
subcategory: Build
difficulty: easy
type: single_choice
question: "What is the difference between APK and AAB for Android distribution?"
options:
  A: "APK is for debug builds; AAB is for release builds"
  B: "APK: complete app package installable directly. AAB (Android App Bundle): optimized format — Google Play generates device-specific APKs from it (smaller downloads)"
  C: "AAB is only for tablets; APK is for phones"
  D: "Google Play no longer accepts APKs — only AAB"
correct_answer: "B"
explanation: |
  APK (Android Package):
  - Complete, installable app package
  - Contains all resources (all languages, screen densities)
  - Larger download size
  - Can be installed directly (sideloading)
  - Use for: direct distribution, beta testing without Play Store
  
  AAB (Android App Bundle):
  - NOT directly installable — must go through a distribution system
  - Google Play uses it to generate device-specific APKs (only needed resources)
  - Smaller app download (Play features: ~15% smaller on average)
  - Dynamic delivery: features delivered on demand
  - Required by Google Play since August 2021
  
  flutter build apk     → APK for direct install / Firebase App Distribution
  flutter build appbundle → AAB for Google Play
tags:
  - devops
  - android
  - apk
  - aab
---

---
id: DEVOPS_009
category: DevOps
subcategory: Version Management
difficulty: medium
type: single_choice
question: "How does versioning work in Flutter and how do you automate build numbers in CI?"
options:
  A: "Version is set in AndroidManifest.xml and Info.plist only"
  B: "pubspec.yaml version field (major.minor.patch+buildNumber) is the source of truth. In CI, auto-increment with --build-number=$CI_BUILD_NUMBER or number of commits."
  C: "Build numbers are set automatically by Flutter — no configuration needed"
  D: "iOS and Android versions must be managed separately"
correct_answer: "B"
explanation: |
  pubspec.yaml:
    version: 1.2.3+45
    # 1.2.3 = semantic version (versionName on Android, CFBundleShortVersionString on iOS)
    # 45 = build number (versionCode on Android, CFBundleVersion on iOS)
  
  Build with specific version:
    flutter build appbundle --build-name=1.2.3 --build-number=45
  
  CI automation strategies:
  
  1. Git commit count (monotonically increasing):
    BUILD_NUMBER=$(git rev-list --count HEAD)
    flutter build appbundle --build-number=$BUILD_NUMBER
  
  2. CI environment variable:
    flutter build appbundle --build-number=$GITHUB_RUN_NUMBER
  
  3. Fastlane increment_build_number (iOS):
    Reads from App Store Connect and increments.
  
  Rule: build number must be unique and always increasing (Play Store/App Store reject same/lower numbers).
tags:
  - devops
  - versioning
  - build-number
  - cicd
---

---
id: DEVOPS_010
category: DevOps
subcategory: Fastlane
difficulty: hard
type: single_choice
question: "What does `fastlane match` do and why is it the recommended approach for team iOS signing?"
options:
  A: "fastlane match matches the app bundle ID with the provisioning profile"
  B: "fastlane match stores all iOS certificates and provisioning profiles encrypted in a git repo, allowing all team members and CI to use the same signing identity"
  C: "fastlane match automatically renews expired certificates"
  D: "fastlane match is only for enterprise distribution"
correct_answer: "B"
explanation: |
  Problem without match:
  - Each developer manages their own certs/profiles
  - CI needs signing credentials — how to share securely?
  - Certificate expires/revoked → team scrambles to update
  
  fastlane match solution:
  1. Creates a private git repo (or S3/Google Cloud) for encrypted certs/profiles
  2. All certs encrypted with a passphrase stored in CI secrets
  3. Every developer runs: fastlane match development (downloads and installs certs)
  4. CI runs: fastlane match appstore --readonly (fetches without creating new)
  
  Fastfile example:
    lane :build_ios do
      match(type: 'appstore', readonly: is_ci)  # is_ci = CI environment
      build_ios_app(scheme: 'MyApp', export_method: 'app-store')
      upload_to_testflight
    end
  
  sync_code_signing is the modern alias for match in Fastfile.
tags:
  - devops
  - fastlane
  - ios
  - code-signing
  - match
---

---
id: DEVOPS_011
category: DevOps
subcategory: Testing
difficulty: medium
type: single_choice
question: "What is Firebase App Distribution and how does it fit in a Flutter CI pipeline?"
options:
  A: "Firebase App Distribution is a Firebase Analytics feature"
  B: "Firebase App Distribution is a beta testing platform — distribute APK/IPA to testers before App Store release. Integrates with Fastlane and GitHub Actions."
  C: "Firebase App Distribution replaces the App Store"
  D: "Firebase App Distribution only works with Android"
correct_answer: "B"
explanation: |
  Firebase App Distribution workflow:
  
  1. Build signed APK/IPA
  2. Upload to Firebase App Distribution with release notes
  3. Testers receive email notification with download link
  4. Testers install via Firebase App Distribution app (Android) or profile (iOS)
  
  GitHub Actions integration:
    - name: Upload to Firebase App Distribution
      uses: wzieba/Firebase-Distribution-Github-Action@v1
      with:
        appId: ${{ secrets.FIREBASE_APP_ID }}
        serviceCredentialsFileContent: ${{ secrets.CREDENTIAL_FILE_CONTENT }}
        groups: qa-team,beta-testers
        file: build/app/outputs/flutter-apk/app-release.apk
        releaseNotes: "Build from ${{ github.ref }}: ${{ github.event.head_commit.message }}"
  
  Fastlane: firebase_app_distribution action.
  
  Use for: internal QA, client preview builds, regression testing before release.
tags:
  - devops
  - firebase
  - app-distribution
  - beta-testing
---

---
id: DEVOPS_012
category: DevOps
subcategory: Release Pipeline
difficulty: hard
type: single_choice
question: "What is a complete Flutter release pipeline for both Android and iOS?"
options:
  A: "Release just means clicking 'Archive' in Xcode"
  B: "A release pipeline includes: run tests, build signed artifacts, distribute to beta testers, run automated E2E tests, then publish to App Store / Play Store with staged rollout"
  C: "Release pipelines are only needed for enterprise apps"
  D: "Releasing Flutter apps requires no special pipeline — flutter build is sufficient"
correct_answer: "B"
explanation: |
  Complete Flutter release pipeline stages:
  
  1. Pre-build checks:
     - flutter analyze (linting)
     - flutter test (unit + widget tests)
     - flutter test integration_test (if applicable)
  
  2. Build:
     - Android: flutter build appbundle --release --obfuscate --split-debug-info
     - iOS: flutter build ipa --release --obfuscate --split-debug-info
  
  3. Upload debug symbols:
     - Firebase Crashlytics: upload .symbols for deobfuscated crash reports
  
  4. Beta distribution:
     - Firebase App Distribution / TestFlight → QA team
     - Automated smoke tests on real devices (Firebase Test Lab)
  
  5. Store release:
     - Android: Google Play internal → alpha → beta → staged rollout (10% → 50% → 100%)
     - iOS: App Store Connect → TestFlight external → App Store Review → Phased Release
  
  6. Monitoring:
     - Monitor Crashlytics for new crashes
     - Monitor Firebase Performance for regressions
     - Monitor Play Store reviews / ratings
tags:
  - devops
  - release-pipeline
  - cicd
  - android
  - ios
---
