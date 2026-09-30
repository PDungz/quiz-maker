---
id: NET_001
category: Networking
subcategory: Dio
difficulty: easy
type: single_choice
question: "What is Dio and what advantages does it have over the built-in `http` package?"
options:
  A: "Dio is a database library for Flutter"
  B: "Dio is an HTTP client with built-in interceptors, request cancellation, FormData upload, response transformation, and timeout configuration"
  C: "Dio is faster but has less features than http"
  D: "Dio is only for GraphQL requests"
correct_answer: "B"
explanation: |
  Dio vs http package:
  
  Dio advantages:
  - Interceptors (request/response/error hooks)
  - Global base URL, headers, timeouts via BaseOptions
  - Request cancellation with CancelToken
  - FormData and multipart file upload
  - Download progress tracking
  - Response type configuration (JSON, bytes, stream)
  - Built-in retry support (with dio_retry)
  - dio_cache_interceptor for response caching
  
  http package: simpler API, smaller package, good for basic use cases.
  
  Dio is the standard choice for production Flutter apps with complex API requirements.
tags:
  - networking
  - dio
  - http
---

---
id: NET_002
category: Networking
subcategory: Dio
difficulty: medium
type: single_choice
question: "What is the purpose of a Dio interceptor?"
options:
  A: "To parse JSON responses automatically"
  B: "To intercept requests/responses/errors — add auth headers, log requests, retry on failure, or transform error responses"
  C: "To cache responses on disk"
  D: "To convert between REST and GraphQL"
correct_answer: "B"
explanation: |
  Dio interceptors hook into three points:
  
  onRequest — called before the request is sent. Use for: adding auth header, logging.
    options.headers['Authorization'] = 'Bearer ${token}';
  
  onResponse — called after successful response. Use for: response transformation, logging.
  
  onError — called on any error. Use for: retry logic, token refresh, error normalization.
  
  Multiple interceptors can be chained:
    dio.interceptors.addAll([
      LoggingInterceptor(),
      AuthInterceptor(tokenService),
      RetryInterceptor(dio),
    ]);
  
  They execute in order for requests and in reverse order for responses.
tags:
  - networking
  - dio
  - interceptors
---

---
id: NET_003
category: Networking
subcategory: Dio
difficulty: hard
type: single_choice
question: "How do you implement a token refresh interceptor that handles 401 responses correctly, including concurrent requests?"
options:
  A: "In onError, call the refresh endpoint and retry. No special handling needed."
  B: "In onError on 401, refresh the token, then retry. Use a lock (Mutex) to prevent multiple simultaneous refresh calls when concurrent requests all get 401."
  C: "Refresh the token before every request in onRequest"
  D: "Handle 401 by navigating to login screen immediately"
correct_answer: "B"
explanation: |
  Problem: multiple concurrent requests all fail with 401 simultaneously.
  Without a lock, each would trigger a refresh → multiple refresh calls → race condition.
  
  Solution using a lock flag:
    bool _isRefreshing = false;
    final _queue = <({RequestOptions opts, ErrorInterceptorHandler handler})>[];
    
    onError: (DioException e, handler) async {
      if (e.response?.statusCode != 401) return handler.next(e);
      if (_isRefreshing) {
        _queue.add((opts: e.requestOptions, handler: handler)); return;
      }
      _isRefreshing = true;
      try {
        final newToken = await _authService.refreshToken();
        _tokenStorage.save(newToken);
        // retry queued requests
        for (final item in _queue) { _retryRequest(item.opts, item.handler, newToken); }
        _queue.clear();
        handler.resolve(await _retryRequest(e.requestOptions, handler, newToken));
      } catch (_) { handler.reject(e); } finally { _isRefreshing = false; }
    }
tags:
  - networking
  - dio
  - token-refresh
  - interceptors
---

---
id: NET_004
category: Networking
subcategory: REST
difficulty: easy
type: single_choice
question: "What does JWT (JSON Web Token) consist of and how is it verified?"
options:
  A: "JWT is a session ID stored on the server"
  B: "JWT has three base64url-encoded parts: Header (algorithm), Payload (claims), Signature — verified by the server using the secret/public key"
  C: "JWT is encrypted — the payload cannot be read without the key"
  D: "JWT verification requires a database lookup on every request"
correct_answer: "B"
explanation: |
  JWT structure: header.payload.signature (base64url encoded, dot-separated)
  
  Header: { "alg": "HS256", "typ": "JWT" }
  Payload: { "sub": "user123", "exp": 1234567890, "iat": 1234560000, "role": "admin" }
  Signature: HMACSHA256(base64url(header) + '.' + base64url(payload), secret)
  
  IMPORTANT: The payload is NOT encrypted — anyone can decode it.
  The signature only proves it hasn't been tampered with.
  
  Never put sensitive data (passwords, CC numbers) in JWT payload!
  
  Verification: server recomputes signature from header+payload and compares.
  If they match AND exp hasn't passed → valid.
tags:
  - networking
  - jwt
  - authentication
  - security
---

---
id: NET_005
category: Networking
subcategory: Security
difficulty: hard
type: single_choice
question: "What is SSL/Certificate Pinning and how do you implement it in Flutter with Dio?"
options:
  A: "Using HTTPS instead of HTTP"
  B: "Hardcoding the server's certificate or public key in the app — rejects any certificate not matching, even if signed by a trusted CA, preventing MITM attacks"
  C: "Requiring users to install a custom CA certificate"
  D: "Enabling TLS 1.3 on the server"
correct_answer: "B"
explanation: |
  Without pinning: a compromised device/network with a rogue CA can intercept HTTPS.
  With pinning: app validates server cert against a bundled known-good fingerprint.
  
  Dio implementation:
    (dio.httpClientAdapter as IOHttpClientAdapter).createHttpClient = () {
      final client = HttpClient();
      client.badCertificateCallback = (X509Certificate cert, String host, int port) {
        final fingerprint = sha256.convert(cert.der).toString();
        return fingerprint == 'expected_sha256_fingerprint';
      };
      return client;
    };
  
  Packages: ssl_pinning_plugin, dio_pinning_interceptor.
  
  Downside: app must be updated when certificate rotates (every 1-2 years).
  Solution: pin the public key (key pinning) which survives certificate renewal.
tags:
  - networking
  - ssl-pinning
  - security
  - dio
---

---
id: NET_006
category: Networking
subcategory: WebSocket
difficulty: medium
type: single_choice
question: "How do you implement a WebSocket connection in Flutter using `web_socket_channel`?"
options:
  A: "WebSocket is not supported in Flutter — use long polling instead"
  B: "Use WebSocketChannel.connect(uri), send via channel.sink.add(), receive via channel.stream.listen()"
  C: "Use Dio's WebSocket mode with dio.websocket()"
  D: "WebSocket requires a native platform channel"
correct_answer: "B"
explanation: |
  web_socket_channel package:
    final channel = WebSocketChannel.connect(
      Uri.parse('wss://api.example.com/ws'),
    );
    
    // Send messages
    channel.sink.add(jsonEncode({'type': 'subscribe', 'topic': 'prices'}));
    
    // Receive messages
    channel.stream.listen(
      (message) => handleMessage(message),
      onError: (error) => handleError(error),
      onDone: () => handleDisconnect(),
    );
    
    // Close
    channel.sink.close(status.normalClosure);
  
  Best practices:
  - Implement reconnect with exponential backoff on disconnect
  - Ping/pong heartbeat to detect dead connections
  - Handle connection state (connecting/connected/disconnected)
  - Wrap in a StreamController to broadcast to multiple listeners
tags:
  - networking
  - websocket
  - web-socket-channel
---

---
id: NET_007
category: Networking
subcategory: WebSocket
difficulty: hard
type: single_choice
question: "What is an exponential backoff reconnect strategy for WebSocket and why is it needed?"
options:
  A: "Reconnect immediately on every disconnect — fastest recovery"
  B: "Wait progressively longer between reconnect attempts (1s, 2s, 4s, 8s...) to avoid overwhelming the server during outages"
  C: "Only reconnect when the user taps a button"
  D: "Exponential backoff is only for HTTP, not WebSocket"
correct_answer: "B"
explanation: |
  Why: if 10,000 clients all disconnect simultaneously (server restart) and all retry
  immediately, they cause a thundering herd — server gets overwhelmed on restart.
  
  Exponential backoff:
    Duration delay = Duration(seconds: 1);
    Future<void> reconnect() async {
      while (!_connected) {
        await Future.delayed(delay);
        try {
          await _connect();
          delay = Duration(seconds: 1); // reset on success
        } catch (_) {
          delay = delay * 2;
          if (delay > Duration(minutes: 5)) delay = Duration(minutes: 5); // cap
        }
      }
    }
  
  Add jitter (random 0-1s added to delay) to spread reconnect attempts across clients.
  Check connectivity_plus to avoid retrying with no network.
tags:
  - networking
  - websocket
  - reconnect
  - exponential-backoff
---

---
id: NET_008
category: Networking
subcategory: REST
difficulty: medium
type: single_choice
question: "What is the difference between `GraphQL` and REST, and what are the key advantages of GraphQL?"
options:
  A: "GraphQL only works with JavaScript; REST works with Flutter"
  B: "REST has fixed endpoints returning fixed shapes; GraphQL has one endpoint where clients specify exactly what data they need — solves over-fetching and under-fetching"
  C: "GraphQL is slower than REST"
  D: "GraphQL requires WebSocket"
correct_answer: "B"
explanation: |
  REST:
  - Multiple endpoints (/users, /posts, /comments)
  - Fixed response shape — may return more than needed (over-fetching)
  - Multiple requests for related data (under-fetching / N+1 problem)
  
  GraphQL:
  - Single endpoint (/graphql)
  - Client specifies exact fields: query { user(id:"1") { name, posts { title } } }
  - Gets exactly what it asked for — no over/under-fetching
  - Mutations for writes, Subscriptions for real-time
  
  Flutter GraphQL packages: graphql_flutter, ferry, artemis (code generation).
  
  Trade-offs: GraphQL adds server complexity, caching is harder than REST's URL-based cache.
tags:
  - networking
  - graphql
  - rest
---

---
id: NET_009
category: Networking
subcategory: Caching
difficulty: medium
type: single_choice
question: "What is the difference between `ETag` and `Cache-Control` HTTP headers?"
options:
  A: "ETag sets expiration time; Cache-Control verifies content hash"
  B: "Cache-Control specifies HOW LONG to cache (max-age); ETag is a content fingerprint for conditional requests — the client sends If-None-Match to check if content changed"
  C: "They are identical in function"
  D: "ETag is only for images; Cache-Control is for JSON"
correct_answer: "B"
explanation: |
  Cache-Control: max-age=3600 — browser/client uses cached response for 1 hour without asking server.
  After 1 hour, it re-requests.
  
  ETag: "abc123" — server provides a content fingerprint.
  On next request, client sends: If-None-Match: "abc123"
  If content unchanged → server responds 304 Not Modified (no body) — saves bandwidth.
  If content changed → server sends full 200 response with new ETag.
  
  In Flutter with dio_cache_interceptor:
    final cacheStore = MemCacheStore();
    dio.interceptors.add(DioCacheInterceptor(options: CacheOptions(store: cacheStore)));
  
  Offline-first apps combine cache with connectivity check: serve cached data when offline.
tags:
  - networking
  - caching
  - etag
  - cache-control
---

---
id: NET_010
category: Networking
subcategory: REST
difficulty: medium
type: single_choice
question: "What is the correct HTTP status code for each scenario?"
options:
  A: "201 Created, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 422 Unprocessable Entity, 500 Internal Server Error"
  B: "200 for all success, 400 for all errors, 500 for server issues"
  C: "201 for GET, 200 for POST, 204 for DELETE"
  D: "404 for any failed request"
correct_answer: "A"
explanation: |
  Essential HTTP status codes for mobile API integration:
  
  2xx Success:
  - 200 OK — general success
  - 201 Created — POST created a resource
  - 204 No Content — DELETE/PUT succeeded, no body
  
  4xx Client Errors:
  - 400 Bad Request — malformed request syntax
  - 401 Unauthorized — not authenticated (missing/invalid token)
  - 403 Forbidden — authenticated but not authorized
  - 404 Not Found — resource doesn't exist
  - 409 Conflict — resource state conflict (duplicate)
  - 422 Unprocessable Entity — validation failure
  - 429 Too Many Requests — rate limited
  
  5xx Server Errors:
  - 500 Internal Server Error — generic server crash
  - 503 Service Unavailable — server down/overloaded
tags:
  - networking
  - http
  - status-codes
  - rest
---

---
id: NET_011
category: Networking
subcategory: Dio
difficulty: medium
type: single_choice
question: "How do you upload a file (multipart/form-data) using Dio in Flutter?"
options:
  A: "Use dio.post() with the file path as a string"
  B: "Use FormData with MultipartFile.fromFile() or MultipartFile.fromBytes()"
  C: "File upload requires a native platform channel with Dio"
  D: "Use dio.putBytes() with the raw file bytes"
correct_answer: "B"
explanation: |
  Multipart file upload with Dio:
    final formData = FormData.fromMap({
      'name': 'John',
      'avatar': await MultipartFile.fromFile(
        '/path/to/image.jpg',
        filename: 'avatar.jpg',
        contentType: MediaType('image', 'jpeg'),
      ),
    });
    
    final response = await dio.post(
      '/upload',
      data: formData,
      onSendProgress: (sent, total) {
        print('${(sent / total * 100).toStringAsFixed(0)}%');
      },
    );
  
  For bytes (from image_picker):
    final bytes = await file.readAsBytes();
    'avatar': MultipartFile.fromBytes(bytes, filename: 'avatar.jpg')
tags:
  - networking
  - dio
  - file-upload
  - multipart
---

---
id: NET_012
category: Networking
subcategory: REST
difficulty: medium
type: single_choice
question: "What is `connectivity_plus` and how should you use it in a Flutter app?"
options:
  A: "connectivity_plus is a networking library that replaces Dio"
  B: "connectivity_plus detects network availability. Use it to show offline UI, but ALWAYS verify with an actual request — the device may have WiFi but no internet."
  C: "connectivity_plus provides the device's IP address"
  D: "connectivity_plus is deprecated — use dart:io InternetAddress instead"
correct_answer: "B"
explanation: |
  connectivity_plus checks network interface status (WiFi, mobile, ethernet, none).
  
  Stream usage:
    Connectivity().onConnectivityChanged.listen((result) {
      if (result == ConnectivityResult.none) showOfflineBanner();
    });
  
  CRITICAL CAVEAT: ConnectivityResult.wifi/mobile does NOT guarantee internet access!
  - Captive portal (hotel WiFi): device has WiFi but no internet
  - VPN issues, DNS failures
  
  Best practice: use connectivity_plus for quick UI feedback, but verify internet by
  actually pinging a reliable endpoint:
    try {
      await http.get(Uri.parse('https://www.google.com')).timeout(Duration(seconds: 3));
      // has internet
    } catch (_) { /* no internet */ }
tags:
  - networking
  - connectivity
  - offline
---

---
id: NET_013
category: Networking
subcategory: REST
difficulty: hard
type: single_choice
question: "What is the offline-first strategy and how do you implement it in Flutter?"
options:
  A: "Offline-first means the app works without any server"
  B: "Offline-first: read from local cache first (show data immediately), sync with server in background, handle write conflicts — app is usable with no/poor network"
  C: "Offline-first requires WebSocket connections"
  D: "Offline-first is only for simple note-taking apps"
correct_answer: "B"
explanation: |
  Offline-first patterns:
  
  1. Cache-first reads:
     Show cached data immediately, fetch fresh data in background (stale-while-revalidate).
  
  2. Optimistic updates:
     Apply change locally immediately, sync to server asynchronously.
     If server fails: rollback and show error.
  
  3. Offline queue for writes:
     Store pending operations in local DB. Process queue when connectivity returns.
     connectivity_plus + WorkManager for background sync.
  
  4. Conflict resolution:
     Last-write-wins, server-wins, or manual conflict UI.
  
  Tools: Hive/Drift for local DB, WorkManager for background sync, Firestore has built-in offline support.
tags:
  - networking
  - offline-first
  - caching
  - sync
---

---
id: NET_014
category: Networking
subcategory: SSE
difficulty: hard
type: single_choice
question: "What is Server-Sent Events (SSE) and when would you choose it over WebSocket?"
options:
  A: "SSE is identical to WebSocket but only works on iOS"
  B: "SSE is a one-directional HTTP stream (server → client) — simpler than WebSocket, uses standard HTTP, auto-reconnects. Choose SSE when you only need server push (notifications, live feeds)."
  C: "SSE requires a special Flutter plugin and native code"
  D: "SSE is deprecated in favor of WebSocket"
correct_answer: "B"
explanation: |
  Server-Sent Events (EventSource):
  - HTTP/1.1 persistent connection: text/event-stream content type
  - ONE-WAY: server → client only
  - Auto-reconnect: browser/client reconnects automatically with Last-Event-ID
  - Standard HTTP: works through proxies, load balancers (unlike WebSocket upgrade)
  - Simple: no message framing, just "data: ...\n\n" lines
  
  Use SSE for: live sports scores, notification feeds, progress updates, log streaming.
  Use WebSocket for: chat (bidirectional), multiplayer games, collaborative editing.
  
  Flutter: use Dio's ResponseType.stream or http package streaming:
    final request = await HttpClient().getUrl(Uri.parse(url));
    final response = await request.close();
    response.transform(utf8.decoder).listen((chunk) { parseEvents(chunk); });
tags:
  - networking
  - sse
  - server-sent-events
  - websocket
---

---
id: NET_015
category: Networking
subcategory: Dio
difficulty: medium
type: single_choice
question: "How does request cancellation work with Dio's `CancelToken`?"
options:
  A: "Request cancellation is not supported in Dio"
  B: "Create a CancelToken, pass it to the request, call cancel() to abort — useful for cancelling in-flight requests when navigating away"
  C: "CancelToken only works on Android"
  D: "Cancellation waits for the response and then discards it"
correct_answer: "B"
explanation: |
  CancelToken in Dio:
    final cancelToken = CancelToken();
    
    try {
      final response = await dio.get('/data', cancelToken: cancelToken);
    } on DioException catch (e) {
      if (CancelToken.isCancel(e)) {
        print('Request cancelled: ${e.message}');
      }
    }
    
    // Cancel from elsewhere (e.g., dispose):
    cancelToken.cancel('User navigated away');
  
  Common use cases:
  - Search-as-you-type: cancel previous search on new keystroke
  - Navigate away during loading: cancel the in-flight request in dispose()
  - Restartable Bloc transformer + CancelToken: cancel old request on new event
  
  One CancelToken can cancel multiple requests simultaneously.
tags:
  - networking
  - dio
  - cancel-token
  - performance
---

---
id: NET_016
category: Networking
subcategory: Security
difficulty: hard
type: single_choice
question: "What is a man-in-the-middle (MITM) attack and what defenses does a Flutter app have?"
options:
  A: "MITM is a server-side vulnerability; Flutter apps are not vulnerable"
  B: "MITM intercepts network traffic. Defenses: HTTPS (TLS), certificate pinning, public key pinning, prevent debug proxy on release builds"
  C: "Using HTTPS alone fully prevents MITM attacks"
  D: "Flutter uses end-to-end encryption by default"
correct_answer: "B"
explanation: |
  MITM attack: attacker positions between app and server, intercepts encrypted traffic.
  
  How it works with HTTPS: attacker uses a rogue CA cert trusted by the device.
  HTTPS encrypts but trusts ANY certificate from a trusted CA — attacker can decrypt.
  
  Defenses:
  1. Certificate pinning: app validates server cert against hardcoded fingerprint.
  2. Public key pinning: pin the server's public key (survives cert renewal).
  3. Detect proxy in release mode: check for HTTP_PROXY environment variable.
  4. App Transport Security (iOS): enforces HTTPS, rejects weak ciphers.
  5. Network Security Config (Android): custom certificate trust rules per domain.
  6. Detect Charles/mitmproxy: check installed profiles on iOS in debug detection.
tags:
  - networking
  - security
  - mitm
  - ssl-pinning
---

---
id: NET_017
category: Networking
subcategory: Dio
difficulty: medium
type: single_choice
question: "What is a good way to structure a Dio client for a production Flutter app?"
options:
  A: "Create a global Dio instance directly in each repository"
  B: "Create a DioClient class that configures BaseOptions, adds interceptors, and is registered as a singleton via GetIt/Riverpod — injected into repositories"
  C: "Use a new Dio() instance for every HTTP request"
  D: "Extend Dio to add custom methods"
correct_answer: "B"
explanation: |
  Production Dio setup:
    class DioClient {
      late final Dio _dio;
      
      DioClient(TokenStorage storage) {
        _dio = Dio(BaseOptions(
          baseUrl: Env.apiBaseUrl,
          connectTimeout: Duration(seconds: 10),
          receiveTimeout: Duration(seconds: 30),
          headers: {'Accept': 'application/json'},
        ));
        
        _dio.interceptors.addAll([
          AuthInterceptor(storage, _dio),
          LoggingInterceptor(),
          ErrorInterceptor(),
        ]);
      }
      
      Future<Response> get(String path, {Map<String, dynamic>? params}) =>
        _dio.get(path, queryParameters: params);
    }
  
  Register: GetIt.I.registerLazySingleton(() => DioClient(GetIt.I<TokenStorage>()))
  Use in repositories: inject DioClient via constructor.
tags:
  - networking
  - dio
  - architecture
  - best-practices
---

---
id: NET_018
category: Networking
subcategory: REST
difficulty: easy
type: single_choice
question: "What is the difference between `POST`, `PUT`, and `PATCH` HTTP methods?"
options:
  A: "They are identical — just naming conventions"
  B: "POST creates a resource; PUT replaces the entire resource; PATCH partially updates a resource"
  C: "PATCH is deprecated — use PUT with partial data"
  D: "POST is for forms; PUT and PATCH are for REST APIs only"
correct_answer: "B"
explanation: |
  POST /users — create a new user. Server assigns the ID. NOT idempotent.
  
  PUT /users/123 — REPLACE user 123 completely. Send the full resource body.
    Idempotent: calling it twice has same result as once.
    Missing fields in body = they're set to null/default.
  
  PATCH /users/123 — PARTIALLY update user 123. Only send changed fields.
    { "email": "new@email.com" } — only email is updated, other fields unchanged.
    More network-efficient than PUT for small changes.
  
  DELETE /users/123 — delete user 123. Idempotent.
  GET /users/123 — retrieve user 123. Safe (no side effects). Idempotent.
tags:
  - networking
  - http
  - rest
  - methods
---

---
id: NET_019
category: Networking
subcategory: REST
difficulty: medium
type: single_choice
question: "How do you handle pagination in a REST API Flutter app?"
options:
  A: "Load all data at once and filter locally"
  B: "Use offset/limit or cursor-based pagination, load next page when user scrolls near bottom (using ScrollController or infinite_scroll_pagination package)"
  C: "Pagination is handled automatically by Dio"
  D: "Only use page number pagination — cursor pagination is too complex"
correct_answer: "B"
explanation: |
  Offset/limit pagination:
    GET /posts?offset=20&limit=10  // page 3 of 10
  Problem: items shift if new posts are inserted — user may miss/see duplicates.
  
  Cursor/keyset pagination (recommended for feeds):
    GET /posts?after=cursor_xyz&limit=10  // after specific item
  No drift — new items don't affect existing pages.
  
  Flutter implementation with infinite_scroll_pagination:
    final _pagingController = PagingController<String?, Post>(firstPageKey: null);
    
    _pagingController.addPageRequestListener((cursor) async {
      final page = await _api.getPosts(after: cursor, limit: 20);
      if (page.isLastPage) _pagingController.appendLastPage(page.items);
      else _pagingController.appendPage(page.items, page.nextCursor);
    });
    
    PagedListView(pagingController: _pagingController, builderDelegate: ...)
tags:
  - networking
  - pagination
  - infinite-scroll
  - rest
---

---
id: NET_020
category: Networking
subcategory: Dio
difficulty: hard
type: single_choice
question: "What does `DioException` (formerly `DioError`) contain and how do you classify errors?"
options:
  A: "DioException only contains the status code"
  B: "DioException has a type enum (connectionTimeout, sendTimeout, receiveTimeout, badResponse, cancel, connectionError) and optionally response with status code and body"
  C: "All Dio errors are of the same type — use try/catch with generic Exception"
  D: "DioException is only thrown for 5xx errors"
correct_answer: "B"
explanation: |
  DioExceptionType enum covers the error category:
  
  connectionTimeout — couldn't establish connection in time
  sendTimeout — request took too long to send
  receiveTimeout — response took too long to receive
  badCertificate — SSL certificate failed (pinning failure)
  badResponse — server returned 4xx/5xx (response is available)
  cancel — CancelToken was triggered
  connectionError — no network, DNS failure
  unknown — other errors
  
  Error classification in interceptor:
    if (e.type == DioExceptionType.badResponse) {
      switch (e.response?.statusCode) {
        case 401: return handleUnauthorized();
        case 422: return handleValidationError(e.response?.data);
        case 500: return handleServerError();
      }
    } else if (e.type == DioExceptionType.connectionError) {
      return handleNoNetwork();
    }
tags:
  - networking
  - dio
  - error-handling
  - exception
---
