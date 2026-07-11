import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/data_providers.dart';
import '../../core/theme.dart';

class QrCodeScreen extends ConsumerWidget {
  const QrCodeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final shopAsync = ref.watch(shopProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('کد QR فروشگاه')),
      body: shopAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('خطا: $e', style: const TextStyle(color: AppColors.danger))),
        data: (shop) {
          final url = 'https://weeelink.ir/${shop.slug}';
          final qrImageUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${Uri.encodeComponent(url)}&color=F97316&bgcolor=0A0A0F&margin=12';
          return Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.surfaceGlass,
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(color: AppColors.border),
                      boxShadow: [BoxShadow(color: AppColors.accentGlow, blurRadius: 30, spreadRadius: 4)],
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: Image.network(qrImageUrl, width: 240, height: 240,
                          loadingBuilder: (context, child, progress) => progress == null ? child : const SizedBox(width: 240, height: 240, child: Center(child: CircularProgressIndicator()))),
                    ),
                  ).animate().scale(duration: 500.ms, curve: Curves.elasticOut),
                  const SizedBox(height: 24),
                  Text(shop.name, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16)).animate().fadeIn(delay: 200.ms),
                  const SizedBox(height: 4),
                  Text(url, style: const TextStyle(color: AppColors.textMuted, fontSize: 12), textDirection: TextDirection.ltr).animate().fadeIn(delay: 250.ms),
                  const SizedBox(height: 24),
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () {
                            Clipboard.setData(ClipboardData(text: url));
                            ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('لینک کپی شد')));
                          },
                          icon: const Icon(Icons.copy_rounded, size: 16),
                          label: const Text('کپی لینک'),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: () => launchUrl(Uri.parse(qrImageUrl), mode: LaunchMode.externalApplication),
                          icon: const Icon(Icons.download_rounded, size: 16),
                          label: const Text('دانلود کد QR'),
                        ),
                      ),
                    ],
                  ).animate().fadeIn(delay: 300.ms),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
