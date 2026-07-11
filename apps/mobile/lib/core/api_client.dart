import 'dart:async';
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// آدرس API — با --dart-define=API_BASE_URL قابل بازنویسی است (پیش‌فرض: سرور اصلی)
const String apiBaseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'https://api.weeelink.ir/api/v1',
);

/// دامنه‌ی خام سرور (بدون /api/v1) — برای فایل‌های آپلودشده لازم است
final String apiOrigin = apiBaseUrl.replaceFirst(RegExp(r'/api/v1/?$'), '');

/// سرور مسیرهای نسبی مثل «/uploads/…» برمی‌گرداند که در وب روی همان دامنه کار می‌کند
/// (nginx پروکسی می‌کند)، اما در اپ موبایل باید به آدرس کامل سرور تبدیل شود
String? resolveImageUrl(String? path) {
  if (path == null || path.isEmpty) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return '$apiOrigin$path';
}

class ApiException implements Exception {
  final String message;
  final int? statusCode;
  final String? code;
  ApiException(this.message, {this.statusCode, this.code});
  @override
  String toString() => message;
}

/// کلاینت HTTP — معادل apps/web/src/lib/api.ts (dio + interceptor توکن + رفرش خودکار ۴۰۱)
class ApiClient {
  ApiClient._internal() {
    _dio = Dio(BaseOptions(baseUrl: apiBaseUrl, connectTimeout: const Duration(seconds: 15)));
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _storage.read(key: 'access_token');
        if (token != null) options.headers['Authorization'] = 'Bearer $token';
        handler.next(options);
      },
      onError: (DioException err, handler) async {
        final status = err.response?.statusCode;
        final path = err.requestOptions.path;
        if (status == 401 && path != '/auth/refresh' && path != '/auth/login') {
          try {
            final retried = await _refreshAndRetry(err.requestOptions);
            return handler.resolve(retried);
          } catch (_) {
            await clearTokens();
          }
        }
        handler.next(err);
      },
    ));
  }

  static final ApiClient instance = ApiClient._internal();
  late final Dio _dio;
  final _storage = const FlutterSecureStorage();
  Future<void>? _refreshInFlight;

  Future<Response> _refreshAndRetry(RequestOptions failedRequest) async {
    _refreshInFlight ??= _doRefresh();
    await _refreshInFlight;
    _refreshInFlight = null;
    final token = await _storage.read(key: 'access_token');
    failedRequest.headers['Authorization'] = 'Bearer $token';
    return _dio.fetch(failedRequest);
  }

  Future<void> _doRefresh() async {
    final refreshToken = await _storage.read(key: 'refresh_token');
    if (refreshToken == null) throw ApiException('no refresh token');
    final res = await _dio.post('/auth/refresh', options: Options(headers: {'Authorization': 'Bearer $refreshToken'}));
    final data = res.data['data'] ?? res.data;
    await saveTokens(data['accessToken'], data['refreshToken']);
  }

  Future<void> saveTokens(String accessToken, String refreshToken) async {
    await _storage.write(key: 'access_token', value: accessToken);
    await _storage.write(key: 'refresh_token', value: refreshToken);
  }

  Future<void> clearTokens() async {
    await _storage.delete(key: 'access_token');
    await _storage.delete(key: 'refresh_token');
  }

  Future<bool> hasSession() async => (await _storage.read(key: 'access_token')) != null;

  /// درخواست عمومی — پاسخ سرور را از پوشش {success,data,timestamp} باز می‌کند
  Future<T> request<T>(
    String method,
    String path, {
    Map<String, dynamic>? query,
    dynamic body,
    T Function(dynamic json)? parse,
  }) async {
    try {
      final res = await _dio.request(
        path,
        queryParameters: query,
        data: body,
        options: Options(method: method),
      );
      final unwrapped = (res.data is Map && res.data['data'] != null) ? res.data['data'] : res.data;
      return parse != null ? parse(unwrapped) : unwrapped as T;
    } on DioException catch (e) {
      final msg = e.response?.data is Map ? (e.response?.data['message'] ?? 'خطای شبکه') : 'خطای شبکه';
      final code = e.response?.data is Map ? e.response?.data['code'] as String? : null;
      throw ApiException(msg.toString(), statusCode: e.response?.statusCode, code: code);
    }
  }

  Future<T> get<T>(String path, {Map<String, dynamic>? query, T Function(dynamic)? parse}) =>
      request('GET', path, query: query, parse: parse);
  Future<T> post<T>(String path, {dynamic body, T Function(dynamic)? parse}) =>
      request('POST', path, body: body, parse: parse);
  Future<T> put<T>(String path, {dynamic body, T Function(dynamic)? parse}) =>
      request('PUT', path, body: body, parse: parse);
  Future<T> delete<T>(String path, {T Function(dynamic)? parse}) => request('DELETE', path, parse: parse);

  Future<String> uploadImage(String filePath) async {
    final form = FormData.fromMap({'file': await MultipartFile.fromFile(filePath)});
    final res = await post<Map<String, dynamic>>('/upload/image', body: form);
    return res['url'] as String;
  }
}
