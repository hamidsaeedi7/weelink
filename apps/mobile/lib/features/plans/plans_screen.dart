import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/api_client.dart';
import '../../core/theme.dart';

final _meProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  return ApiClient.instance.get('/users/me', parse: (j) => Map<String, dynamic>.from(j));
});

class PlansScreen extends ConsumerStatefulWidget {
  const PlansScreen({super.key});
  @override
  ConsumerState<PlansScreen> createState() => _PlansScreenState();
}

class _PlansScreenState extends ConsumerState<PlansScreen> {
  bool _loading = false;

  Future<void> _upgrade(int months) async {
    setState(() => _loading = true);
    try {
      final res = await ApiClient.instance.post<Map<String, dynamic>>('/payments/plan/request', body: {'months': months});
      final url = res['gatewayUrl'] as String?;
      if (url != null) await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
    } on ApiException catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final meAsync = ref.watch(_meProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('اشتراک')),
      body: meAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('خطا: $e', style: const TextStyle(color: AppColors.danger))),
        data: (me) {
          final plan = me['plan'] ?? 'FREE';
          final expiresAt = me['planExpiresAt'] != null ? DateTime.tryParse(me['planExpiresAt']) : null;
          final isPro = plan == 'PRO';

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              GlassCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(isPro ? Icons.workspace_premium_rounded : Icons.person_outline_rounded, color: isPro ? AppColors.accent : AppColors.textMuted),
                        const SizedBox(width: 8),
                        Text(isPro ? 'اشتراک PRO' : 'پلن رایگان', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                      ],
                    ),
                    if (isPro && expiresAt != null) ...[
                      const SizedBox(height: 8),
                      Text('تا تاریخ ${expiresAt.toLocal().toString().split(' ').first} فعال است', style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 24),
              Text('ارتقا به PRO', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800)),
              const SizedBox(height: 12),
              for (final months in [1, 6, 12])
                Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: GlassCard(
                    onTap: _loading ? null : () => _upgrade(months),
                    child: Row(
                      children: [
                        Expanded(child: Text('اشتراک $months ماهه', style: const TextStyle(fontWeight: FontWeight.w700))),
                        const Icon(Icons.arrow_back_ios_new_rounded, size: 14, color: AppColors.accent),
                      ],
                    ),
                  ),
                ),
              if (_loading) const Center(child: Padding(padding: EdgeInsets.all(16), child: CircularProgressIndicator())),
            ],
          );
        },
      ),
    );
  }
}
