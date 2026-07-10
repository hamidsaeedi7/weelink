import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api_client.dart';

enum AuthStatus { unknown, authenticated, unauthenticated }

class AuthState {
  final AuthStatus status;
  const AuthState(this.status);
}

class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier() : super(const AuthState(AuthStatus.unknown)) {
    _bootstrap();
  }

  final _api = ApiClient.instance;

  Future<void> _bootstrap() async {
    final has = await _api.hasSession();
    state = AuthState(has ? AuthStatus.authenticated : AuthStatus.unauthenticated);
  }

  /// ارسال کد OTP به شماره موبایل — برای کاربر جدید یا بازگشتی بدون رمز
  Future<void> requestOtp(String phone) async {
    await _api.post('/auth/register', body: {'phone': phone});
  }

  /// تأیید کد OTP — در صورت موفقیت توکن‌ها ذخیره و وضعیت authenticated می‌شود
  /// خروجی: isNew (کاربر تازه ثبت‌نام‌شده) و hasPassword
  Future<Map<String, dynamic>> verifyOtp(String phone, String code) async {
    final data = await _api.post<Map<String, dynamic>>('/auth/verify-otp', body: {'phone': phone, 'code': code});
    await _api.saveTokens(data['accessToken'], data['refreshToken']);
    state = const AuthState(AuthStatus.authenticated);
    return data;
  }

  Future<void> loginWithPassword({String? phone, String? email, required String password}) async {
    final data = await _api.post<Map<String, dynamic>>('/auth/login', body: {
      if (phone != null) 'phone': phone,
      if (email != null) 'email': email,
      'password': password,
    });
    await _api.saveTokens(data['accessToken'], data['refreshToken']);
    state = const AuthState(AuthStatus.authenticated);
  }

  Future<void> setPassword(String password, {String? fullName}) async {
    await _api.post('/auth/set-password', body: {'password': password, if (fullName != null) 'fullName': fullName});
  }

  Future<void> logout() async {
    await _api.clearTokens();
    state = const AuthState(AuthStatus.unauthenticated);
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) => AuthNotifier());
