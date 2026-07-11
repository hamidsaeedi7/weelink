import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/data_providers.dart';
import '../../core/theme.dart';

class AudienceScreen extends ConsumerWidget {
  const AudienceScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final leadsAsync = ref.watch(audienceProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('مخاطبین')),
      body: leadsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('خطا: $e', style: const TextStyle(color: AppColors.danger))),
        data: (leads) {
          if (leads.isEmpty) {
            return const Center(child: Text('هنوز مخاطبی ثبت نشده', style: TextStyle(color: AppColors.textMuted)));
          }
          return ListView.builder(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
            itemCount: leads.length,
            itemBuilder: (context, i) {
              final l = leads[i];
              return Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: GlassCard(
                  child: Row(
                    children: [
                      const Icon(Icons.person_outline_rounded, color: AppColors.accent, size: 20),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(l.name?.isNotEmpty == true ? l.name! : l.email, style: const TextStyle(fontWeight: FontWeight.w700)),
                            Text(l.email, style: const TextStyle(color: AppColors.textMuted, fontSize: 12), textDirection: TextDirection.ltr),
                          ],
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.delete_outline_rounded, size: 18, color: AppColors.danger),
                        onPressed: () => ref.read(audienceProvider.notifier).deleteItem(l.id),
                      ),
                    ],
                  ),
                ).animate().fadeIn(delay: (i * 40).ms),
              );
            },
          );
        },
      ),
    );
  }
}
