import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api_client.dart';
import '../../core/theme.dart';
import 'auth_provider.dart';

enum _Step { phone, otp, setPassword }

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});
  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  _Step _step = _Step.phone;
  final _phoneCtrl = TextEditingController();
  final _otpCtrl = TextEditingController();
  final _nameCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  bool _loading = false;
  String? _error;

  String get _phone => _phoneCtrl.text.trim();

  Future<void> _sendOtp() async {
    if (_phone.length < 10) {
      setState(() => _error = 'شماره موبایل معتبر وارد کنید');
      return;
    }
    setState(() { _loading = true; _error = null; });
    try {
      await ref.read(authProvider.notifier).requestOtp(_phone);
      setState(() => _step = _Step.otp);
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _verifyOtp() async {
    if (_otpCtrl.text.trim().length < 4) {
      setState(() => _error = 'کد تأیید را کامل وارد کنید');
      return;
    }
    setState(() { _loading = true; _error = null; });
    try {
      final data = await ref.read(authProvider.notifier).verifyOtp(_phone, _otpCtrl.text.trim());
      final isNew = data['isNew'] == true;
      final hasPassword = data['hasPassword'] == true;
      if (isNew && !hasPassword) {
        setState(() => _step = _Step.setPassword);
      }
      // در غیر این صورت state=authenticated شده و router خودش هدایت می‌کند
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _finishSetPassword() async {
    if (_nameCtrl.text.trim().length < 3) {
      setState(() => _error = 'نام و نام خانوادگی را کامل وارد کنید');
      return;
    }
    if (_passCtrl.text.length < 8) {
      setState(() => _error = 'رمز عبور حداقل ۸ کاراکتر باشد');
      return;
    }
    setState(() { _loading = true; _error = null; });
    try {
      await ref.read(authProvider.notifier).setPassword(_passCtrl.text, fullName: _nameCtrl.text.trim());
      if (mounted) Navigator.of(context).maybePop();
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 40),
              _buildLogo(),
              const SizedBox(height: 48),
              AnimatedSwitcher(
                duration: const Duration(milliseconds: 350),
                transitionBuilder: (child, anim) => SlideTransition(
                  position: Tween(begin: const Offset(0.15, 0), end: Offset.zero).animate(anim),
                  child: FadeTransition(opacity: anim, child: child),
                ),
                child: _buildStep(),
              ),
              if (_error != null)
                Padding(
                  padding: const EdgeInsets.only(top: 16),
                  child: Text(_error!, style: const TextStyle(color: AppColors.danger), textAlign: TextAlign.center),
                ).animate().shake(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLogo() {
    return Column(
      key: const ValueKey('logo'),
      children: [
        Container(
          width: 72,
          height: 72,
          decoration: BoxDecoration(
            gradient: const LinearGradient(colors: [AppColors.accent, Color(0xFFFB923C)]),
            borderRadius: BorderRadius.circular(20),
            boxShadow: [BoxShadow(color: AppColors.accentGlow, blurRadius: 24, spreadRadius: 2)],
          ),
          child: const Icon(Icons.link_rounded, color: Colors.white, size: 36),
        ).animate().scale(duration: 500.ms, curve: Curves.elasticOut),
        const SizedBox(height: 16),
        Text('ویلینک', style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.w900))
            .animate().fadeIn(delay: 200.ms),
        Text('همه در یک لینک', style: TextStyle(color: AppColors.textSecondary))
            .animate().fadeIn(delay: 300.ms),
      ],
    );
  }

  Widget _buildStep() {
    switch (_step) {
      case _Step.phone:
        return _phoneStep();
      case _Step.otp:
        return _otpStep();
      case _Step.setPassword:
        return _setPasswordStep();
    }
  }

  Widget _phoneStep() {
    return Column(
      key: const ValueKey('phone'),
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text('ورود / ثبت‌نام', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800)),
        const SizedBox(height: 8),
        Text('شماره موبایل خود را وارد کنید', style: TextStyle(color: AppColors.textSecondary)),
        const SizedBox(height: 20),
        TextField(
          controller: _phoneCtrl,
          keyboardType: TextInputType.phone,
          textAlign: TextAlign.left,
          textDirection: TextDirection.ltr,
          decoration: const InputDecoration(hintText: '09xxxxxxxxx', prefixIcon: Icon(Icons.phone_iphone_rounded)),
        ),
        const SizedBox(height: 20),
        ElevatedButton(
          onPressed: _loading ? null : _sendOtp,
          child: _loading
              ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
              : const Text('دریافت کد تأیید'),
        ),
      ],
    );
  }

  Widget _otpStep() {
    return Column(
      key: const ValueKey('otp'),
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text('کد تأیید', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800)),
        const SizedBox(height: 8),
        Text('کد ارسال‌شده به $_phone را وارد کنید', style: TextStyle(color: AppColors.textSecondary)),
        const SizedBox(height: 20),
        TextField(
          controller: _otpCtrl,
          keyboardType: TextInputType.number,
          textAlign: TextAlign.center,
          maxLength: 6,
          style: const TextStyle(fontSize: 24, letterSpacing: 8),
          decoration: const InputDecoration(counterText: '', hintText: '------'),
        ),
        const SizedBox(height: 20),
        ElevatedButton(
          onPressed: _loading ? null : _verifyOtp,
          child: _loading
              ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
              : const Text('تأیید و ورود'),
        ),
        TextButton(
          onPressed: () => setState(() => _step = _Step.phone),
          child: const Text('تغییر شماره موبایل'),
        ),
      ],
    );
  }

  Widget _setPasswordStep() {
    return Column(
      key: const ValueKey('setpass'),
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text('تکمیل ثبت‌نام', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800)),
        const SizedBox(height: 8),
        Text('برای ورودهای بعدی، نام و رمز عبور تنظیم کنید', style: TextStyle(color: AppColors.textSecondary)),
        const SizedBox(height: 20),
        TextField(
          controller: _nameCtrl,
          decoration: const InputDecoration(hintText: 'نام و نام خانوادگی', prefixIcon: Icon(Icons.person_outline_rounded)),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _passCtrl,
          obscureText: true,
          decoration: const InputDecoration(hintText: 'رمز عبور (حداقل ۸ کاراکتر)', prefixIcon: Icon(Icons.lock_outline_rounded)),
        ),
        const SizedBox(height: 20),
        ElevatedButton(
          onPressed: _loading ? null : _finishSetPassword,
          child: _loading
              ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
              : const Text('شروع کنید'),
        ),
      ],
    );
  }
}
