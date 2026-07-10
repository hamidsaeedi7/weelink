import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api_client.dart';
import '../../core/theme.dart';
import '../auth/auth_provider.dart';

class AccountScreen extends ConsumerStatefulWidget {
  const AccountScreen({super.key});
  @override
  ConsumerState<AccountScreen> createState() => _AccountScreenState();
}

class _AccountScreenState extends ConsumerState<AccountScreen> {
  final _oldPassCtrl = TextEditingController();
  final _newPassCtrl = TextEditingController();
  bool _changingPassword = false;

  Future<void> _changePassword() async {
    if (_newPassCtrl.text.trim().length < 8) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('رمز جدید حداقل ۸ کاراکتر باشد')));
      return;
    }
    setState(() => _changingPassword = true);
    try {
      await ApiClient.instance.post('/users/me/change-password', body: {
        'oldPassword': _oldPassCtrl.text,
        'newPassword': _newPassCtrl.text,
      });
      _oldPassCtrl.clear();
      _newPassCtrl.clear();
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('رمز عبور تغییر کرد')));
    } on ApiException catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _changingPassword = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('حساب کاربری')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text('تغییر رمز عبور', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800)),
          const SizedBox(height: 12),
          TextField(controller: _oldPassCtrl, obscureText: true, decoration: const InputDecoration(hintText: 'رمز فعلی')),
          const SizedBox(height: 10),
          TextField(controller: _newPassCtrl, obscureText: true, decoration: const InputDecoration(hintText: 'رمز جدید')),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: _changingPassword ? null : _changePassword,
            child: _changingPassword
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : const Text('تغییر رمز'),
          ),
          const SizedBox(height: 32),
          OutlinedButton.icon(
            onPressed: () => ref.read(authProvider.notifier).logout(),
            style: OutlinedButton.styleFrom(foregroundColor: AppColors.danger, side: const BorderSide(color: AppColors.danger)),
            icon: const Icon(Icons.logout_rounded),
            label: const Text('خروج از حساب'),
          ),
        ],
      ),
    );
  }
}
